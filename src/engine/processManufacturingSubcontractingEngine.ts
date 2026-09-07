/**
 * AM Enterprise ERP — Phase 3.2D-04 Process Manufacturing, APS & Subcontracting Engine
 * Architecture Baseline v2.8 Compliant
 * Decoupled Financial Events, Zero Direct GL Mutation, SoD Enforcement & SHA-256 Seals
 */

import { sha256Hex } from '../utils/sha256';
import {
  FinancialEventPayload,
  MasterRecipe,
  RecipeStatus,
  RecipeIngredient,
  BatchMaster,
  BatchStatus,
  ProcessOrder,
  ProcessOrderStatus,
  DispensedIngredientLine,
  PhaseExecutionLog,
  WorkCenterCapacityProfile,
  CapacityBucketAnalysis,
  FiniteScheduleRunResult,
  SetupChangeoverMatrixRule,
  SubcontractOrder,
  SubcontractOrderStatus,
  SubcontractReceiptResult,
  ProductionLine,
  KanbanControlCycle,
  KanbanContainer,
  KanbanBackflushResult,
  ScheduledOperationLoad
} from '../types/processManufacturingSubcontracting';

export class ProcessManufacturingSubcontractingEngine {
  private static sequenceCounters: Record<string, number> = {};

  private static getNextSequence(prefix: string): string {
    const year = new Date().getFullYear();
    const key = `${prefix}-${year}`;
    this.sequenceCounters[key] = (this.sequenceCounters[key] || 0) + 1;
    return `${prefix}-${year}-${String(this.sequenceCounters[key]).padStart(5, '0')}`;
  }

  // ==========================================================================
  // 1. MASTER RECIPES & FORMULATION MANAGEMENT (PP-PI)
  // ==========================================================================

  public static generateRecipeHash(recipe: Partial<MasterRecipe>): string {
    const payload = JSON.stringify({
      tenantId: recipe.tenantId,
      companyId: recipe.companyId,
      recipeCode: recipe.recipeCode,
      productSku: recipe.productSku,
      version: recipe.version,
      baseQuantity: recipe.baseQuantity,
      phases: recipe.phases?.map(p => ({ n: p.phaseNumber, wc: p.workCenterId, dur: p.standardDurationHours })),
      ingredients: recipe.ingredients?.map(i => ({ sku: i.itemSku, qty: i.standardQuantity, pot: i.isPotencyAdjustable })),
      coProducts: recipe.coProducts?.map(c => ({ sku: c.itemSku, pct: c.costApportionmentPercent })),
      byProducts: recipe.byProducts?.map(b => ({ sku: b.itemSku, val: b.estimatedNetRealizableCreditUnit }))
    });
    return sha256Hex(payload);
  }

  public static createMasterRecipe(params: {
    tenantId: string;
    companyId: string;
    recipeCode: string;
    productSku: string;
    productName: string;
    version?: number;
    baseQuantity: number;
    unitOfMeasure: string;
    phases: MasterRecipe['phases'];
    ingredients: MasterRecipe['ingredients'];
    coProducts?: MasterRecipe['coProducts'];
    byProducts?: MasterRecipe['byProducts'];
    validFrom: string;
    densityGPerMl?: number;
    createdBy: string;
  }): MasterRecipe {
    if (!params.recipeCode || !params.productSku) {
      throw new Error('Recipe code and product SKU are mandatory');
    }
    if (params.baseQuantity <= 0) {
      throw new Error('Recipe base quantity must be strictly positive');
    }
    if (!params.ingredients || params.ingredients.length === 0) {
      throw new Error('Recipe must contain at least one ingredient');
    }

    const coProducts = params.coProducts || [];
    const totalCoProductPercent = coProducts.reduce((acc, cp) => acc + cp.costApportionmentPercent, 0);
    if (totalCoProductPercent >= 100) {
      throw new Error(`Co-product cost apportionment sum (${totalCoProductPercent}%) must be strictly less than 100% to leave cost for main product`);
    }

    const recipeId = this.getNextSequence('REC');
    const version = params.version || 1;

    const partialRecipe: Partial<MasterRecipe> = {
      tenantId: params.tenantId,
      companyId: params.companyId,
      recipeCode: params.recipeCode,
      productSku: params.productSku,
      version,
      baseQuantity: params.baseQuantity,
      phases: params.phases,
      ingredients: params.ingredients,
      coProducts,
      byProducts: params.byProducts || []
    };

    const seal = this.generateRecipeHash(partialRecipe);

    return {
      id: recipeId,
      tenantId: params.tenantId,
      companyId: params.companyId,
      recipeCode: params.recipeCode,
      productSku: params.productSku,
      productName: params.productName,
      version,
      status: 'DRAFT',
      baseQuantity: params.baseQuantity,
      unitOfMeasure: params.unitOfMeasure,
      phases: params.phases,
      ingredients: params.ingredients,
      coProducts,
      byProducts: params.byProducts || [],
      validFrom: params.validFrom,
      densityGPerMl: params.densityGPerMl,
      createdBy: params.createdBy,
      sha256Seal: seal
    };
  }

  public static approveMasterRecipe(params: {
    recipe: MasterRecipe;
    approvedBy: string;
    asActive?: boolean;
  }): MasterRecipe {
    const { recipe, approvedBy, asActive } = params;
    if (recipe.status === 'APPROVED' || recipe.status === 'ACTIVE') {
      throw new Error(`Recipe is already approved/active (status: ${recipe.status})`);
    }
    // Segregation of Duties (SoD): Recipe Creator cannot approve their own recipe
    if (recipe.createdBy === approvedBy) {
      throw new Error(`SoD Violation: Recipe creator '${recipe.createdBy}' cannot approve their own recipe`);
    }

    const approvalDate = new Date().toISOString();
    return {
      ...recipe,
      status: asActive ? 'ACTIVE' : 'APPROVED',
      approvedBy,
      approvalDate,
      sha256Seal: this.generateRecipeHash({ ...recipe, approvedBy, approvalDate })
    };
  }

  /**
   * Potency Balancing Algorithm:
   * For active ingredients where raw material batch potency differs from standard (100%),
   * scales active ingredient quantity to deliver standard active content:
   * requiredActualQty = (standardQty * basePotency) / actualPotencyPercent
   * If a designated filler/excipient exists, adjusts filler quantity so total formula weight remains invariant.
   */
  public static calculatePotencyAdjustedIngredients(params: {
    ingredients: RecipeIngredient[];
    batchBatchPotencies: Record<string, number>; // itemSku -> actualPotencyPercent (e.g. 95 for 95%)
    batchSizeMultiplier?: number;
  }): { adjustedIngredients: (RecipeIngredient & { calculatedQuantity: number; potencyShiftDelta: number })[]; totalBatchWeight: number } {
    const mult = params.batchSizeMultiplier ?? 1;
    let totalStandardWeight = 0;
    let activeQuantityDelta = 0;
    let fillerIndex = -1;

    const adjusted = params.ingredients.map((ing, idx) => {
      const stdQty = ing.standardQuantity * mult;
      totalStandardWeight += stdQty;

      if (ing.isFiller) {
        fillerIndex = idx;
        return {
          ...ing,
          calculatedQuantity: stdQty,
          potencyShiftDelta: 0
        };
      }

      if (ing.isPotencyAdjustable) {
        const basePotency = ing.basePotencyPercent ?? 100;
        const actualPotency = params.batchBatchPotencies[ing.itemSku] ?? basePotency;
        if (actualPotency <= 0) throw new Error(`Invalid actual potency for ${ing.itemSku}: ${actualPotency}%`);

        const calculatedQty = (stdQty * basePotency) / actualPotency;
        const delta = calculatedQty - stdQty;
        activeQuantityDelta += delta;

        return {
          ...ing,
          calculatedQuantity: Number(calculatedQty.toFixed(4)),
          potencyShiftDelta: Number(delta.toFixed(4))
        };
      }

      return {
        ...ing,
        calculatedQuantity: stdQty,
        potencyShiftDelta: 0
      };
    });

    // Compensate filler if present
    if (fillerIndex >= 0) {
      const origFiller = adjusted[fillerIndex].calculatedQuantity;
      const compensated = origFiller - activeQuantityDelta;
      if (compensated < 0) {
        throw new Error(`Potency adjustment required more active ingredient than available filler capacity. Filler became negative: ${compensated}`);
      }
      adjusted[fillerIndex].calculatedQuantity = Number(compensated.toFixed(4));
      adjusted[fillerIndex].potencyShiftDelta = Number((-activeQuantityDelta).toFixed(4));
    }

    const totalBatchWeight = Number(adjusted.reduce((sum, i) => sum + i.calculatedQuantity, 0).toFixed(4));

    return {
      adjustedIngredients: adjusted,
      totalBatchWeight
    };
  }

  // ==========================================================================
  // 2. BATCH MASTER & SHELF-LIFE / STATUS MANAGEMENT
  // ==========================================================================

  public static createBatch(params: {
    tenantId: string;
    companyId: string;
    batchNumber: string;
    itemSku: string;
    manufacturingDate: string;
    shelfLifeDays: number;
    retestDays?: number;
    actualPotencyPercent?: number;
    warehouseId: string;
    quantityOnHand: number;
    unitOfMeasure: string;
    certificateOfAnalysisId?: string;
    inspectedBy?: string;
  }): BatchMaster {
    const mfg = new Date(params.manufacturingDate);
    const expDate = new Date(mfg);
    expDate.setDate(expDate.getDate() + params.shelfLifeDays);

    let retestDateStr: string | undefined;
    if (params.retestDays) {
      const retDate = new Date(mfg);
      retDate.setDate(retDate.getDate() + params.retestDays);
      retestDateStr = retDate.toISOString().split('T')[0];
    }

    return {
      id: `BATCH-${params.itemSku}-${params.batchNumber}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      batchNumber: params.batchNumber,
      itemSku: params.itemSku,
      manufacturingDate: params.manufacturingDate,
      expirationDate: expDate.toISOString().split('T')[0],
      retestDate: retestDateStr,
      actualPotencyPercent: params.actualPotencyPercent ?? 100,
      status: 'QUARANTINE',
      warehouseId: params.warehouseId,
      quantityOnHand: params.quantityOnHand,
      unitOfMeasure: params.unitOfMeasure,
      certificateOfAnalysisId: params.certificateOfAnalysisId,
      inspectedBy: params.inspectedBy,
      statusChangeHistory: [{
        previousStatus: 'QUARANTINE',
        newStatus: 'QUARANTINE',
        changedBy: params.inspectedBy || 'system',
        reason: 'Initial batch creation in quarantine',
        timestamp: new Date().toISOString()
      }]
    };
  }

  public static updateBatchStatus(params: {
    batch: BatchMaster;
    newStatus: BatchStatus;
    changedBy: string;
    reason: string;
  }): BatchMaster {
    const { batch, newStatus, changedBy, reason } = params;
    if (!reason || reason.trim().length === 0) {
      throw new Error('Mandatory reason required for batch status change');
    }

    // SoD rule: Changing from QUARANTINE to UNRESTRICTED requires a quality inspector, not production operator
    if (batch.status === 'QUARANTINE' && newStatus === 'UNRESTRICTED' && changedBy.startsWith('operator-')) {
      throw new Error(`SoD Violation: Production operator '${changedBy}' cannot release quarantine batch to unrestricted stock`);
    }

    const updatedHistory = [
      ...batch.statusChangeHistory,
      {
        previousStatus: batch.status,
        newStatus,
        changedBy,
        reason,
        timestamp: new Date().toISOString()
      }
    ];

    return {
      ...batch,
      status: newStatus,
      statusChangeHistory: updatedHistory
    };
  }

  public static evaluateBatchExpiration(batch: BatchMaster, asOfDate: string): BatchMaster {
    const asOf = new Date(asOfDate);
    const exp = new Date(batch.expirationDate);

    if (asOf > exp && batch.status !== 'BLOCKED' && batch.status !== 'SCRAPPED') {
      return this.updateBatchStatus({
        batch,
        newStatus: 'BLOCKED',
        changedBy: 'auto-sled-monitor',
        reason: `Batch expired on ${batch.expirationDate}, evaluated as of ${asOfDate}`
      });
    }

    if (batch.retestDate) {
      const ret = new Date(batch.retestDate);
      if (asOf > ret && batch.status === 'UNRESTRICTED') {
        return this.updateBatchStatus({
          batch,
          newStatus: 'RETEST_REQUIRED',
          changedBy: 'auto-sled-monitor',
          reason: `Retest date ${batch.retestDate} reached as of ${asOfDate}`
        });
      }
    }

    return batch;
  }

  // ==========================================================================
  // 3. PROCESS ORDERS (PP-PI EXECUTION)
  // ==========================================================================

  public static createProcessOrder(params: {
    tenantId: string;
    companyId: string;
    recipe: MasterRecipe;
    plannedBatchQuantity: number;
    assignedBatchNumber: string;
    plannedStartDate: string;
    plannedEndDate: string;
    createdBy: string;
  }): ProcessOrder {
    if (params.recipe.status !== 'ACTIVE' && params.recipe.status !== 'APPROVED') {
      throw new Error(`Cannot create Process Order from unapproved recipe '${params.recipe.recipeCode}' (status: ${params.recipe.status})`);
    }
    if (params.plannedBatchQuantity <= 0) {
      throw new Error('Planned batch quantity must be strictly positive');
    }

    const orderNumber = this.getNextSequence('PRC');

    return {
      id: orderNumber,
      tenantId: params.tenantId,
      companyId: params.companyId,
      orderNumber,
      recipeId: params.recipe.id,
      recipeCode: params.recipe.recipeCode,
      productSku: params.recipe.productSku,
      plannedBatchQuantity: params.plannedBatchQuantity,
      actualYieldQuantity: 0,
      unitOfMeasure: params.recipe.unitOfMeasure,
      assignedBatchNumber: params.assignedBatchNumber,
      status: 'CREATED',
      plannedStartDate: params.plannedStartDate,
      plannedEndDate: params.plannedEndDate,
      dispensedIngredients: [],
      phaseLogs: [],
      coProductYields: [],
      byProductYields: [],
      totalActualCost: 0,
      totalByProductCredit: 0,
      netBatchCost: 0,
      createdBy: params.createdBy
    };
  }

  public static releaseProcessOrder(params: {
    processOrder: ProcessOrder;
    releasedBy: string;
  }): { updatedOrder: ProcessOrder; financialEvent: FinancialEventPayload } {
    const { processOrder, releasedBy } = params;
    if (processOrder.status !== 'CREATED') {
      throw new Error(`Order ${processOrder.orderNumber} is already released or in-process (status: ${processOrder.status})`);
    }
    // SoD check: Order creator cannot release their own order
    if (processOrder.createdBy === releasedBy) {
      throw new Error(`SoD Violation: Process Order creator '${processOrder.createdBy}' cannot release their own order`);
    }

    const updatedOrder: ProcessOrder = {
      ...processOrder,
      status: 'RELEASED',
      releasedBy,
      actualStartDate: new Date().toISOString()
    };

    const financialEvent: FinancialEventPayload = {
      eventId: `EVT-${this.getNextSequence('FIN')}`,
      eventType: 'PROCESS_ORDER_RELEASED',
      tenantId: processOrder.tenantId,
      companyId: processOrder.companyId,
      sourceModule: 'PROCESS_MANUFACTURING',
      sourceEntityId: processOrder.id,
      eventTimestamp: new Date().toISOString(),
      payload: {
        orderNumber: processOrder.orderNumber,
        productSku: processOrder.productSku,
        assignedBatchNumber: processOrder.assignedBatchNumber,
        plannedBatchQuantity: processOrder.plannedBatchQuantity,
        releasedBy
      }
    };

    return { updatedOrder, financialEvent };
  }

  public static recordDispensedIngredient(params: {
    processOrder: ProcessOrder;
    itemSku: string;
    batchNumber: string;
    rawMaterialBatch: BatchMaster;
    standardQuantity: number;
    actualDispensedQuantity: number;
    unitOfMeasure: string;
    dispensedBy: string;
    potencyFactorApplied?: number;
  }): ProcessOrder {
    const { processOrder, itemSku, batchNumber, rawMaterialBatch, standardQuantity, actualDispensedQuantity, unitOfMeasure, dispensedBy, potencyFactorApplied } = params;

    if (processOrder.status !== 'RELEASED' && processOrder.status !== 'DISPENSED' && processOrder.status !== 'IN_PROCESS') {
      throw new Error(`Cannot dispense into order with status '${processOrder.status}'`);
    }

    // Validation: Raw material batch must be UNRESTRICTED
    if (rawMaterialBatch.status !== 'UNRESTRICTED') {
      throw new Error(`Cannot dispense raw material batch '${batchNumber}': status is '${rawMaterialBatch.status}' (Must be UNRESTRICTED)`);
    }

    // Check expiration
    const today = new Date().toISOString().split('T')[0];
    if (rawMaterialBatch.expirationDate < today) {
      throw new Error(`Cannot dispense expired batch '${batchNumber}' (Expired: ${rawMaterialBatch.expirationDate})`);
    }

    const dispenseLine: DispensedIngredientLine = {
      itemSku,
      batchNumber,
      standardQuantity,
      actualDispensedQuantity,
      unitOfMeasure,
      dispensedBy,
      dispensedAt: new Date().toISOString(),
      potencyFactorApplied: potencyFactorApplied ?? 1.0
    };

    const updatedDispensed = [...processOrder.dispensedIngredients, dispenseLine];
    const newStatus: ProcessOrderStatus = processOrder.status === 'RELEASED' ? 'DISPENSED' : processOrder.status;

    return {
      ...processOrder,
      dispensedIngredients: updatedDispensed,
      status: newStatus
    };
  }

  public static recordPhaseConfirmation(params: {
    processOrder: ProcessOrder;
    phaseNumber: number;
    workCenterId: string;
    actualStartTime: string;
    actualEndTime: string;
    actualDurationHours: number;
    recordedTemperature?: number;
    recordedPh?: number;
    operatorId: string;
    notes?: string;
  }): ProcessOrder {
    const { processOrder, phaseNumber, workCenterId, actualStartTime, actualEndTime, actualDurationHours, recordedTemperature, recordedPh, operatorId, notes } = params;

    const log: PhaseExecutionLog = {
      phaseNumber,
      workCenterId,
      actualStartTime,
      actualEndTime,
      actualDurationHours,
      recordedTemperature,
      recordedPh,
      operatorId,
      notes
    };

    return {
      ...processOrder,
      status: 'IN_PROCESS',
      phaseLogs: [...processOrder.phaseLogs, log]
    };
  }

  public static completeProcessOrderYield(params: {
    processOrder: ProcessOrder;
    recipe: MasterRecipe;
    actualMainYieldQuantity: number;
    coProductYields?: { itemSku: string; batchNumber: string; quantity: number }[];
    byProductYields?: { itemSku: string; batchNumber: string; quantity: number }[];
    totalAccumulatedCosts: number;
    completedBy: string;
  }): { completedOrder: ProcessOrder; costAllocation: { mainProductCost: number; coProductsCost: Record<string, number>; byProductCreditTotal: number }; financialEvent: FinancialEventPayload } {
    const { processOrder, recipe, actualMainYieldQuantity, coProductYields = [], byProductYields = [], totalAccumulatedCosts, completedBy } = params;

    if (actualMainYieldQuantity <= 0) {
      throw new Error('Actual main yield quantity must be strictly positive');
    }

    // 1. Calculate by-product credits (deducted directly from gross batch cost)
    let totalByProductCredit = 0;
    for (const byP of byProductYields) {
      const def = recipe.byProducts.find(b => b.itemSku === byP.itemSku);
      const rate = def?.estimatedNetRealizableCreditUnit ?? 0;
      totalByProductCredit += byP.quantity * rate;
    }

    const netCostToAllocate = Math.max(0, totalAccumulatedCosts - totalByProductCredit);

    // 2. Co-product cost apportionment
    const coProductCosts: Record<string, number> = {};
    let totalCoProductAllocationPercent = 0;

    for (const coP of coProductYields) {
      const def = recipe.coProducts.find(c => c.itemSku === coP.itemSku);
      const pct = def?.costApportionmentPercent ?? 0;
      totalCoProductAllocationPercent += pct;
      const allocatedCost = Number(((netCostToAllocate * pct) / 100).toFixed(2));
      coProductCosts[coP.itemSku] = allocatedCost;
    }

    const mainProductPercent = Math.max(0, 100 - totalCoProductAllocationPercent);
    const mainProductCost = Number(((netCostToAllocate * mainProductPercent) / 100).toFixed(2));

    const completedOrder: ProcessOrder = {
      ...processOrder,
      actualYieldQuantity: actualMainYieldQuantity,
      coProductYields,
      byProductYields,
      totalActualCost: totalAccumulatedCosts,
      totalByProductCredit,
      netBatchCost: netCostToAllocate,
      status: 'BULK_COMPLETE',
      completedBy,
      actualEndDate: new Date().toISOString()
    };

    const financialEvent: FinancialEventPayload = {
      eventId: `EVT-${this.getNextSequence('FIN')}`,
      eventType: 'PROCESS_BATCH_YIELD_POSTED',
      tenantId: processOrder.tenantId,
      companyId: processOrder.companyId,
      sourceModule: 'PROCESS_MANUFACTURING',
      sourceEntityId: processOrder.id,
      eventTimestamp: new Date().toISOString(),
      payload: {
        orderNumber: processOrder.orderNumber,
        productSku: processOrder.productSku,
        assignedBatchNumber: processOrder.assignedBatchNumber,
        actualYieldQuantity: actualMainYieldQuantity,
        mainProductCost,
        coProductCosts,
        totalByProductCredit,
        netBatchCost: netCostToAllocate,
        completedBy
      }
    };

    return {
      completedOrder,
      costAllocation: {
        mainProductCost,
        coProductsCost: coProductCosts,
        byProductCreditTotal: totalByProductCredit
      },
      financialEvent
    };
  }

  // ==========================================================================
  // 4. ADVANCED PLANNING & FINITE CAPACITY SCHEDULING (APS / CRP)
  // ==========================================================================

  public static createWorkCenterCapacityProfile(params: {
    workCenterId: string;
    workCenterCode: string;
    name: string;
    shiftsPerDay: number;
    hoursPerShift: number;
    workersPerShift?: number;
    machineEfficiencyPercent?: number;
    utilizationTargetPercent?: number;
    queueTimeHours?: number;
    moveWaitTimeHours?: number;
  }): WorkCenterCapacityProfile {
    const eff = (params.machineEfficiencyPercent ?? 100) / 100;
    const util = (params.utilizationTargetPercent ?? 100) / 100;
    const dailyAvailableHours = Number((params.shiftsPerDay * params.hoursPerShift * eff * util).toFixed(2));

    return {
      workCenterId: params.workCenterId,
      workCenterCode: params.workCenterCode,
      name: params.name,
      shiftProfile: {
        shiftCode: `${params.shiftsPerDay}S-STD`,
        shiftsPerDay: params.shiftsPerDay,
        hoursPerShift: params.hoursPerShift,
        workersPerShift: params.workersPerShift ?? 1,
        machineEfficiencyPercent: params.machineEfficiencyPercent ?? 100,
        utilizationTargetPercent: params.utilizationTargetPercent ?? 100
      },
      dailyAvailableHours,
      queueTimeHours: params.queueTimeHours ?? 0.5,
      moveWaitTimeHours: params.moveWaitTimeHours ?? 0.5
    };
  }

  /**
   * Finite Capacity Scheduling Engine:
   * Dispatches operations onto work centers while respecting finite daily bucket capacity.
   * Detects bucket overloads, highlights bottlenecks, and applies setup changeover optimization rules.
   */
  public static runFiniteCapacitySchedule(params: {
    operationsToSchedule: {
      orderId: string;
      orderNumber: string;
      productFamily?: string;
      operationNumber: number;
      workCenterId: string;
      setupHours: number;
      runHours: number;
      earliestStartDate: string; // YYYY-MM-DD
    }[];
    workCenterProfiles: WorkCenterCapacityProfile[];
    changeoverMatrix?: SetupChangeoverMatrixRule[];
    algorithm?: 'FORWARD' | 'SETUP_OPTIMIZED';
    horizonDays?: number;
  }): FiniteScheduleRunResult {
    const startTime = Date.now();
    const algorithm = params.algorithm ?? 'FORWARD';
    const horizonDays = params.horizonDays ?? 14;

    const profileMap = new Map<string, WorkCenterCapacityProfile>();
    for (const p of params.workCenterProfiles) profileMap.set(p.workCenterId, p);

    // Initialize daily capacity buckets for each work center
    const bucketsByWcAndDate: Map<string, CapacityBucketAnalysis> = new Map();

    const baseDate = new Date(params.operationsToSchedule[0]?.earliestStartDate || new Date().toISOString().split('T')[0]);

    for (const profile of params.workCenterProfiles) {
      for (let d = 0; d < horizonDays; d++) {
        const curDate = new Date(baseDate);
        curDate.setDate(curDate.getDate() + d);
        const dateKey = curDate.toISOString().split('T')[0];
        const key = `${profile.workCenterId}_${dateKey}`;

        bucketsByWcAndDate.set(key, {
          workCenterId: profile.workCenterId,
          bucketDate: dateKey,
          availableCapacityHours: profile.dailyAvailableHours,
          loadedCapacityHours: 0,
          loadPercent: 0,
          isOverloaded: false,
          isBottleneck: false,
          scheduledOperations: []
        });
      }
    }

    // Sort operations based on algorithm
    let ops = [...params.operationsToSchedule];
    if (algorithm === 'SETUP_OPTIMIZED' && params.changeoverMatrix) {
      // Group by productFamily to minimize changeover setup penalties
      ops.sort((a, b) => (a.productFamily || '').localeCompare(b.productFamily || ''));
    } else {
      ops.sort((a, b) => a.earliestStartDate.localeCompare(b.earliestStartDate) || a.operationNumber - b.operationNumber);
    }

    // Schedule operations into finite buckets
    const scheduledOps: ScheduledOperationLoad[] = [];
    const bottleneckSet = new Set<string>();

    for (const op of ops) {
      const profile = profileMap.get(op.workCenterId);
      if (!profile) continue;

      let neededHours = op.setupHours + op.runHours;
      let scheduled = false;

      // Find earliest available bucket from earliestStartDate that has room or allocate across consecutive days
      for (let d = 0; d < horizonDays; d++) {
        const curDate = new Date(baseDate);
        curDate.setDate(curDate.getDate() + d);
        const dateKey = curDate.toISOString().split('T')[0];
        if (dateKey < op.earliestStartDate) continue;

        const key = `${op.workCenterId}_${dateKey}`;
        const bucket = bucketsByWcAndDate.get(key);
        if (!bucket) continue;

        const remainingInBucket = bucket.availableCapacityHours - bucket.loadedCapacityHours;

        if (remainingInBucket >= neededHours || (remainingInBucket > 0 && d === horizonDays - 1)) {
          // Fits in this bucket
          bucket.loadedCapacityHours = Number((bucket.loadedCapacityHours + neededHours).toFixed(2));
          bucket.loadPercent = Number(((bucket.loadedCapacityHours / bucket.availableCapacityHours) * 100).toFixed(1));
          if (bucket.loadPercent > 100) {
            bucket.isOverloaded = true;
            bucket.isBottleneck = true;
            bottleneckSet.add(op.workCenterId);
          }

          const opLoad: ScheduledOperationLoad = {
            orderId: op.orderId,
            orderNumber: op.orderNumber,
            operationNumber: op.operationNumber,
            scheduledStart: `${dateKey}T08:00:00Z`,
            scheduledEnd: `${dateKey}T${8 + Math.min(8, Math.ceil(neededHours))}:00:00Z`,
            setupHours: op.setupHours,
            runHours: op.runHours,
            totalCapacityHours: neededHours
          };
          bucket.scheduledOperations.push(opLoad);
          scheduledOps.push(opLoad);
          scheduled = true;
          break;
        }
      }

      // If cannot fit within capacity without overloading, place in first available date with overload flag
      if (!scheduled) {
        const key = `${op.workCenterId}_${op.earliestStartDate}`;
        let bucket = bucketsByWcAndDate.get(key);
        if (!bucket) {
          bucket = bucketsByWcAndDate.values().next().value;
        }
        if (bucket) {
          bucket.loadedCapacityHours = Number((bucket.loadedCapacityHours + neededHours).toFixed(2));
          bucket.loadPercent = Number(((bucket.loadedCapacityHours / bucket.availableCapacityHours) * 100).toFixed(1));
          bucket.isOverloaded = true;
          bucket.isBottleneck = true;
          bottleneckSet.add(op.workCenterId);

          const opLoad: ScheduledOperationLoad = {
            orderId: op.orderId,
            orderNumber: op.orderNumber,
            operationNumber: op.operationNumber,
            scheduledStart: `${bucket.bucketDate}T08:00:00Z`,
            scheduledEnd: `${bucket.bucketDate}T16:00:00Z`,
            setupHours: op.setupHours,
            runHours: op.runHours,
            totalCapacityHours: neededHours
          };
          bucket.scheduledOperations.push(opLoad);
          scheduledOps.push(opLoad);
        }
      }
    }

    const allBuckets = Array.from(bucketsByWcAndDate.values());
    const uniqueOrders = new Set(ops.map(o => o.orderId)).size;

    return {
      scheduleRunId: this.getNextSequence('APS'),
      runDate: new Date().toISOString(),
      algorithm,
      totalOrdersScheduled: uniqueOrders,
      totalOperationsScheduled: scheduledOps.length,
      bottlenecksIdentified: Array.from(bottleneckSet),
      buckets: allBuckets,
      executionTimeMs: Date.now() - startTime
    };
  }

  // ==========================================================================
  // 5. SUBCONTRACTING & OUTSIDE PROCESSING (TOLL MANUFACTURING)
  // ==========================================================================

  public static createSubcontractOrder(params: {
    tenantId: string;
    companyId: string;
    vendorId: string;
    vendorName: string;
    finishedItemSku: string;
    finishedItemDescription: string;
    orderQuantity: number;
    serviceRatePerUnit: number;
    unitOfMeasure: string;
    deliveryDueDate: string;
    plantWarehouseId: string;
    vendorSpecialStockWarehouseId?: string;
    providedComponents: {
      componentSku: string;
      description: string;
      requiredQuantityPerUnit: number;
      unitCost: number;
      unitOfMeasure: string;
    }[];
    sourceWorkOrderId?: string;
    notes?: string;
  }): SubcontractOrder {
    if (params.orderQuantity <= 0) {
      throw new Error('Subcontract order quantity must be strictly positive');
    }
    if (params.serviceRatePerUnit < 0) {
      throw new Error('Service rate per unit cannot be negative');
    }

    const subcontractOrderNumber = this.getNextSequence('SC-ORD');
    const totalServiceCost = Number((params.orderQuantity * params.serviceRatePerUnit).toFixed(2));
    const vendorSpecialStockWarehouseId = params.vendorSpecialStockWarehouseId || `WH-VEND-O-${params.vendorId}`;

    const components = params.providedComponents.map(c => ({
      componentSku: c.componentSku,
      description: c.description,
      requiredQuantity: Number((c.requiredQuantityPerUnit * params.orderQuantity).toFixed(4)),
      issuedQuantity: 0,
      consumedQuantity: 0,
      scrapQuantity: 0,
      unitCost: c.unitCost,
      unitOfMeasure: c.unitOfMeasure
    }));

    return {
      id: subcontractOrderNumber,
      tenantId: params.tenantId,
      companyId: params.companyId,
      subcontractOrderNumber,
      vendorId: params.vendorId,
      vendorName: params.vendorName,
      finishedItemSku: params.finishedItemSku,
      finishedItemDescription: params.finishedItemDescription,
      orderQuantity: params.orderQuantity,
      receivedQuantity: 0,
      serviceRatePerUnit: params.serviceRatePerUnit,
      totalServiceCost,
      unitOfMeasure: params.unitOfMeasure,
      deliveryDueDate: params.deliveryDueDate,
      status: 'DRAFT',
      sourceWorkOrderId: params.sourceWorkOrderId,
      plantWarehouseId: params.plantWarehouseId,
      vendorSpecialStockWarehouseId,
      providedComponents: components,
      notes: params.notes
    };
  }

  public static issueSubcontractComponents(params: {
    subcontractOrder: SubcontractOrder;
    componentIssues: { componentSku: string; quantity: number }[];
    issuedBy: string;
  }): { updatedOrder: SubcontractOrder; financialEvent: FinancialEventPayload } {
    const { subcontractOrder, componentIssues, issuedBy } = params;

    if (subcontractOrder.status !== 'DRAFT' && subcontractOrder.status !== 'APPROVED' && subcontractOrder.status !== 'STOCK_ISSUED') {
      throw new Error(`Cannot issue components for subcontract order in status '${subcontractOrder.status}'`);
    }

    const updatedComponents = subcontractOrder.providedComponents.map(comp => {
      const issue = componentIssues.find(i => i.componentSku === comp.componentSku);
      if (!issue) return comp;
      return {
        ...comp,
        issuedQuantity: comp.issuedQuantity + issue.quantity
      };
    });

    const updatedOrder: SubcontractOrder = {
      ...subcontractOrder,
      status: 'STOCK_ISSUED',
      providedComponents: updatedComponents,
      issuedAt: new Date().toISOString(),
      issuedBy
    };

    const totalIssuedValue = componentIssues.reduce((sum, issue) => {
      const comp = subcontractOrder.providedComponents.find(c => c.componentSku === issue.componentSku);
      return sum + (issue.quantity * (comp?.unitCost ?? 0));
    }, 0);

    const financialEvent: FinancialEventPayload = {
      eventId: `EVT-${this.getNextSequence('FIN')}`,
      eventType: 'SUBCONTRACT_STOCK_ISSUED',
      tenantId: subcontractOrder.tenantId,
      companyId: subcontractOrder.companyId,
      sourceModule: 'SUBCONTRACTING',
      sourceEntityId: subcontractOrder.id,
      eventTimestamp: new Date().toISOString(),
      payload: {
        subcontractOrderNumber: subcontractOrder.subcontractOrderNumber,
        vendorId: subcontractOrder.vendorId,
        fromWarehouseId: subcontractOrder.plantWarehouseId,
        toSpecialStockWarehouseId: subcontractOrder.vendorSpecialStockWarehouseId,
        items: componentIssues,
        totalIssuedValue: Number(totalIssuedValue.toFixed(2)),
        issuedBy
      }
    };

    return { updatedOrder, financialEvent };
  }

  public static receiveSubcontractGoods(params: {
    subcontractOrder: SubcontractOrder;
    receivedQuantity: number;
    receivedBy: string;
    actualComponentScrap?: Record<string, number>; // extra scrap consumed at vendor
  }): { updatedOrder: SubcontractOrder; receiptResult: SubcontractReceiptResult } {
    const { subcontractOrder, receivedQuantity, receivedBy, actualComponentScrap = {} } = params;

    if (receivedQuantity <= 0) {
      throw new Error('Received quantity must be strictly positive');
    }
    const newTotalReceived = subcontractOrder.receivedQuantity + receivedQuantity;
    if (newTotalReceived > subcontractOrder.orderQuantity * 1.1) {
      throw new Error(`Receipt quantity exceeds order limit tolerance (Ordered: ${subcontractOrder.orderQuantity}, Received to date: ${newTotalReceived})`);
    }

    // Segregation of Duties: Stock Issuer cannot confirm receipt
    if (subcontractOrder.issuedBy === receivedBy) {
      throw new Error(`SoD Violation: Stock issuer '${subcontractOrder.issuedBy}' cannot receive finished subcontract goods`);
    }

    // Calculate component consumption proportion
    const proportion = receivedQuantity / subcontractOrder.orderQuantity;
    let totalComponentCostConsumed = 0;
    const componentsConsumed: { componentSku: string; quantityConsumed: number; totalCost: number }[] = [];

    const updatedComponents = subcontractOrder.providedComponents.map(comp => {
      const stdPortion = comp.requiredQuantity * proportion;
      const extraScrap = actualComponentScrap[comp.componentSku] ?? 0;
      const totalConsumedThisReceipt = stdPortion + extraScrap;

      if (comp.consumedQuantity + totalConsumedThisReceipt > comp.issuedQuantity) {
        throw new Error(`Insufficient issued Special Stock 'O' for component '${comp.componentSku}'. Issued: ${comp.issuedQuantity}, previously consumed: ${comp.consumedQuantity}, needed now: ${totalConsumedThisReceipt}`);
      }

      const cost = Number((totalConsumedThisReceipt * comp.unitCost).toFixed(2));
      totalComponentCostConsumed += cost;

      componentsConsumed.push({
        componentSku: comp.componentSku,
        quantityConsumed: Number(totalConsumedThisReceipt.toFixed(4)),
        totalCost: cost
      });

      return {
        ...comp,
        consumedQuantity: Number((comp.consumedQuantity + totalConsumedThisReceipt).toFixed(4)),
        scrapQuantity: comp.scrapQuantity + extraScrap
      };
    });

    const totalServiceCharge = Number((receivedQuantity * subcontractOrder.serviceRatePerUnit).toFixed(2));
    const totalFinishedValuation = Number((totalComponentCostConsumed + totalServiceCharge).toFixed(2));
    const finishedUnitCost = Number((totalFinishedValuation / receivedQuantity).toFixed(4));

    const receiptNumber = this.getNextSequence('SC-REC');
    const isCompleted = newTotalReceived >= subcontractOrder.orderQuantity;

    const updatedOrder: SubcontractOrder = {
      ...subcontractOrder,
      receivedQuantity: newTotalReceived,
      status: isCompleted ? 'COMPLETED' : 'PARTIALLY_RECEIVED',
      providedComponents: updatedComponents,
      completedAt: isCompleted ? new Date().toISOString() : undefined,
      completedBy: isCompleted ? receivedBy : undefined
    };

    const financialEvent: FinancialEventPayload = {
      eventId: `EVT-${this.getNextSequence('FIN')}`,
      eventType: 'SUBCONTRACT_SERVICE_SETTLED',
      tenantId: subcontractOrder.tenantId,
      companyId: subcontractOrder.companyId,
      sourceModule: 'SUBCONTRACTING',
      sourceEntityId: subcontractOrder.id,
      eventTimestamp: new Date().toISOString(),
      payload: {
        receiptNumber,
        subcontractOrderNumber: subcontractOrder.subcontractOrderNumber,
        vendorId: subcontractOrder.vendorId,
        finishedItemSku: subcontractOrder.finishedItemSku,
        receivedQuantity,
        totalComponentCostConsumed,
        totalServiceCharge,
        totalFinishedValuation,
        finishedUnitCost,
        receivedBy
      }
    };

    const receiptResult: SubcontractReceiptResult = {
      subcontractOrderId: subcontractOrder.id,
      receiptNumber,
      receivedQuantity,
      componentsConsumed,
      totalComponentCostConsumed,
      totalServiceCharge,
      totalFinishedValuation,
      finishedUnitCost,
      financialEvent
    };

    return { updatedOrder, receiptResult };
  }

  // ==========================================================================
  // 6. REPETITIVE MANUFACTURING & ELECTRONIC KANBAN (REM / PULL)
  // ==========================================================================

  public static createProductionLine(params: {
    tenantId: string;
    companyId: string;
    lineCode: string;
    lineName: string;
    taktTimeSeconds: number;
    activeWorkCenters: string[];
    currentShift?: string;
  }): ProductionLine {
    if (params.taktTimeSeconds <= 0) {
      throw new Error('Takt time must be strictly positive');
    }
    const designHourlyRate = Number((3600 / params.taktTimeSeconds).toFixed(2));

    return {
      id: `LINE-${params.lineCode}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      lineCode: params.lineCode,
      lineName: params.lineName,
      taktTimeSeconds: params.taktTimeSeconds,
      designHourlyRate,
      activeWorkCenters: params.activeWorkCenters,
      currentShift: params.currentShift || 'SHIFT-1',
      isOperational: true
    };
  }

  public static createKanbanControlCycle(params: {
    tenantId: string;
    companyId: string;
    controlCycleCode: string;
    materialSku: string;
    materialName: string;
    supplyArea: string;
    sourceType: KanbanControlCycle['sourceType'];
    sourceLocation: string;
    containerQuantity: number;
    numberOfContainers: number;
    productionLineId?: string;
    createdBy: string;
  }): KanbanControlCycle {
    if (params.containerQuantity <= 0 || params.numberOfContainers <= 0) {
      throw new Error('Container quantity and number of containers must be strictly positive');
    }

    const containers: KanbanContainer[] = [];
    for (let i = 1; i <= params.numberOfContainers; i++) {
      containers.push({
        containerId: `KB-${params.controlCycleCode}-BIN-${String(i).padStart(2, '0')}`,
        binNumber: i,
        status: 'FULL',
        lastStatusChange: new Date().toISOString()
      });
    }

    return {
      id: `CC-${params.controlCycleCode}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      controlCycleCode: params.controlCycleCode,
      materialSku: params.materialSku,
      materialName: params.materialName,
      supplyArea: params.supplyArea,
      sourceType: params.sourceType,
      sourceLocation: params.sourceLocation,
      containerQuantity: params.containerQuantity,
      numberOfContainers: params.numberOfContainers,
      containers,
      productionLineId: params.productionLineId,
      isActive: true,
      createdBy: params.createdBy
    };
  }

  public static triggerKanbanEmpty(params: {
    controlCycle: KanbanControlCycle;
    containerId: string;
  }): { updatedControlCycle: KanbanControlCycle; replenishmentSignal: { replenishmentOrderRef: string; sourceType: string; targetQuantity: number } } {
    const { controlCycle, containerId } = params;
    const containerIdx = controlCycle.containers.findIndex(c => c.containerId === containerId);
    if (containerIdx < 0) {
      throw new Error(`Kanban container '${containerId}' not found in control cycle '${controlCycle.controlCycleCode}'`);
    }

    const container = controlCycle.containers[containerIdx];
    if (container.status === 'EMPTY' || container.status === 'IN_PROCESS') {
      throw new Error(`Container '${containerId}' is already empty or in replenishment (status: ${container.status})`);
    }

    const replenishmentOrderRef = `REPL-${this.getNextSequence('KB')}`;

    const updatedContainers = [...controlCycle.containers];
    updatedContainers[containerIdx] = {
      ...container,
      status: 'EMPTY',
      currentReplenishmentOrderRef: replenishmentOrderRef,
      lastStatusChange: new Date().toISOString()
    };

    return {
      updatedControlCycle: {
        ...controlCycle,
        containers: updatedContainers
      },
      replenishmentSignal: {
        replenishmentOrderRef,
        sourceType: controlCycle.sourceType,
        targetQuantity: controlCycle.containerQuantity
      }
    };
  }

  public static triggerKanbanFullAndBackflush(params: {
    controlCycle: KanbanControlCycle;
    containerId: string;
    bomComponentsToDeduct?: { itemSku: string; quantityPerUnit: number }[];
  }): { updatedControlCycle: KanbanControlCycle; backflushResult: KanbanBackflushResult } {
    const { controlCycle, containerId, bomComponentsToDeduct = [] } = params;
    const containerIdx = controlCycle.containers.findIndex(c => c.containerId === containerId);
    if (containerIdx < 0) {
      throw new Error(`Kanban container '${containerId}' not found in control cycle '${controlCycle.controlCycleCode}'`);
    }

    const container = controlCycle.containers[containerIdx];
    const qty = controlCycle.containerQuantity;

    const componentsDeducted = bomComponentsToDeduct.map(comp => ({
      itemSku: comp.itemSku,
      quantity: Number((comp.quantityPerUnit * qty).toFixed(4))
    }));

    const updatedContainers = [...controlCycle.containers];
    updatedContainers[containerIdx] = {
      ...container,
      status: 'FULL',
      currentReplenishmentOrderRef: undefined,
      lastStatusChange: new Date().toISOString()
    };

    const financialEvent: FinancialEventPayload = {
      eventId: `EVT-${this.getNextSequence('FIN')}`,
      eventType: 'KANBAN_CONTAINER_BACKFLUSHED',
      tenantId: controlCycle.tenantId,
      companyId: controlCycle.companyId,
      sourceModule: 'REPETITIVE_MANUFACTURING',
      sourceEntityId: controlCycle.id,
      eventTimestamp: new Date().toISOString(),
      payload: {
        controlCycleCode: controlCycle.controlCycleCode,
        containerId,
        materialSku: controlCycle.materialSku,
        quantity: qty,
        componentsDeducted
      }
    };

    const backflushResult: KanbanBackflushResult = {
      controlCycleId: controlCycle.id,
      containerId,
      materialSku: controlCycle.materialSku,
      quantity: qty,
      backflushedAt: new Date().toISOString(),
      componentsDeducted,
      financialEvent
    };

    return {
      updatedControlCycle: {
        ...controlCycle,
        containers: updatedContainers
      },
      backflushResult
    };
  }
}
