/**
 * AM Enterprise ERP — Phase 3.2D-06 Manufacturing Intelligence & Tooling Engine
 * Tooling/Die Life Cycle, Calibration Enforcement, Electronic Batch Records (eBR),
 * Line Clearance Governance, Loss-Tree OEE Analytics & Shift Handover
 *
 * Architecture Principles:
 * - Zero direct GL mutation (Strictly decoupled FinancialEventPayload)
 * - Segregation of Duties (SoD) enforcement
 * - Multi-tenant isolation
 * - Cryptographic tamper-evident SHA-256 seals
 */

import { sha256Hex } from '../utils/sha256';
import {
  ToolMaster,
  ToolStatus,
  ToolType,
  ToolUsageRecord,
  LineClearanceChecklist,
  ElectronicBatchRecord,
  CriticalProcessParameter,
  OEELossTreeAnalysis,
  OEELossRecord,
  ShiftHandoverLogbook
} from '../types/manufacturingIntelligenceTooling';

export interface DecoupledMfgFinancialEvent {
  eventId: string;
  eventType: 'EVT_TOOLING_AMORTIZATION' | 'EVT_BATCH_RELEASE_COMPLETED' | 'EVT_BATCH_REJECT_VARIANCE' | 'EVT_CHANGEOVER_SETUP_COST';
  tenantId: string;
  companyId: string;
  timestamp: string;
  amount: number;
  currency: string;
  debitAccount: string;
  creditAccount: string;
  referenceId: string;
  narration: string;
  metadata: Record<string, any>;
  sha256Seal: string;
}

export class ManufacturingIntelligenceToolingEngine {
  private static financialEventsQueue: DecoupledMfgFinancialEvent[] = [];

  public static getFinancialEventsQueue(): DecoupledMfgFinancialEvent[] {
    return [...this.financialEventsQueue];
  }

  public static clearFinancialEventsQueue(): void {
    this.financialEventsQueue = [];
  }

  private static emitFinancialEvent(event: Omit<DecoupledMfgFinancialEvent, 'eventId' | 'sha256Seal'>): DecoupledMfgFinancialEvent {
    const eventId = `FEVT-MFG-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const seal = sha256Hex(JSON.stringify({ eventId, ...event }));
    const record: DecoupledMfgFinancialEvent = {
      eventId,
      ...event,
      sha256Seal: seal
    };
    this.financialEventsQueue.push(record);
    return record;
  }

  // =========================================================================
  // 1. TOOLING & DIE LIFECYCLE MANAGEMENT
  // =========================================================================

  public static createToolMaster(params: {
    tenantId: string;
    companyId: string;
    toolCode: string;
    toolName: string;
    toolType: ToolType;
    serialNumber: string;
    workCenterId: string;
    nominalLifeCycles: number;
    maxLifeCycles: number;
    warningThresholdCycles?: number;
    calibrationIntervalDays: number;
    costPerCycleUsd: number;
    hourlyWearRateUsd?: number;
  }): ToolMaster {
    if (!params.tenantId || !params.companyId) {
      throw new Error('Tenant ID and Company ID are strictly required');
    }
    if (!params.toolCode || !params.toolName) {
      throw new Error('Tool Code and Tool Name are required');
    }
    if (params.nominalLifeCycles <= 0 || params.maxLifeCycles <= params.nominalLifeCycles) {
      throw new Error('Max life cycles must be strictly greater than nominal life cycles');
    }
    if (params.costPerCycleUsd < 0) {
      throw new Error('Cost per cycle cannot be negative');
    }

    const now = new Date().toISOString();
    const nextCalDate = new Date(Date.now() + params.calibrationIntervalDays * 86400000).toISOString();
    const id = `TOOL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const warningCycles = params.warningThresholdCycles || Math.floor(params.nominalLifeCycles * 0.9);

    const seal = sha256Hex(JSON.stringify({
      id,
      code: params.toolCode,
      serial: params.serialNumber,
      maxCycles: params.maxLifeCycles,
      created: now
    }));

    return {
      id,
      tenantId: params.tenantId,
      companyId: params.companyId,
      toolCode: params.toolCode,
      toolName: params.toolName,
      toolType: params.toolType,
      serialNumber: params.serialNumber,
      workCenterId: params.workCenterId,
      nominalLifeCycles: params.nominalLifeCycles,
      currentLifeCycles: 0,
      maxLifeCycles: params.maxLifeCycles,
      warningThresholdCycles: warningCycles,
      calibrationIntervalDays: params.calibrationIntervalDays,
      lastCalibratedAt: now,
      nextCalibrationDue: nextCalDate,
      status: 'AVAILABLE',
      hourlyWearRateUsd: params.hourlyWearRateUsd || 0,
      costPerCycleUsd: params.costPerCycleUsd,
      createdAt: now,
      updatedAt: now,
      sha256Seal: seal
    };
  }

  public static recordToolUsageCycles(params: {
    tool: ToolMaster;
    workOrderId: string;
    operationSeq: number;
    cyclesRun: number;
    recordedBy: string;
  }): { updatedTool: ToolMaster; usageRecord: ToolUsageRecord; financialEvent: DecoupledMfgFinancialEvent } {
    const { tool, cyclesRun } = params;

    // Check if tool is usable
    if (tool.status === 'LOCKED_EXPIRED' || tool.status === 'SCRAPPED') {
      throw new Error(`Cannot run operation: Tool ${tool.toolCode} is ${tool.status} and cannot be used`);
    }

    // Check calibration expiry
    const nowMs = Date.now();
    const calDueMs = new Date(tool.nextCalibrationDue).getTime();
    if (nowMs > calDueMs) {
      throw new Error(`Cannot run operation: Tool ${tool.toolCode} calibration expired on ${tool.nextCalibrationDue}`);
    }

    if (cyclesRun <= 0) {
      throw new Error('Cycles run must be strictly positive');
    }

    const previousCycles = tool.currentLifeCycles;
    const newTotalCycles = previousCycles + cyclesRun;
    let newStatus: ToolStatus = tool.status;

    if (newTotalCycles >= tool.maxLifeCycles) {
      newStatus = 'LOCKED_EXPIRED';
    } else if (newTotalCycles >= tool.warningThresholdCycles) {
      newStatus = 'MAINTENANCE_REQUIRED';
    } else {
      newStatus = 'IN_USE';
    }

    const now = new Date().toISOString();
    const amortizedCost = Math.round(cyclesRun * tool.costPerCycleUsd * 100) / 100;

    const usageRecordId = `TUR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const usageSeal = sha256Hex(JSON.stringify({
      usageRecordId,
      toolId: tool.id,
      workOrderId: params.workOrderId,
      cyclesRun,
      newTotalCycles,
      amortizedCost
    }));

    const usageRecord: ToolUsageRecord = {
      id: usageRecordId,
      toolId: tool.id,
      workOrderId: params.workOrderId,
      operationSeq: params.operationSeq,
      cyclesRecorded: cyclesRun,
      accumulatedCyclesBefore: previousCycles,
      accumulatedCyclesAfter: newTotalCycles,
      amortizedCostUsd: amortizedCost,
      recordedBy: params.recordedBy,
      timestamp: now,
      statusAfter: newStatus,
      sha256Seal: usageSeal
    };

    const toolSeal = sha256Hex(JSON.stringify({
      id: tool.id,
      currentLifeCycles: newTotalCycles,
      status: newStatus,
      updatedAt: now
    }));

    const updatedTool: ToolMaster = {
      ...tool,
      currentLifeCycles: newTotalCycles,
      status: newStatus,
      updatedAt: now,
      sha256Seal: toolSeal
    };

    // Emit decoupled financial event for tooling amortization
    const financialEvent = this.emitFinancialEvent({
      eventType: 'EVT_TOOLING_AMORTIZATION',
      tenantId: tool.tenantId,
      companyId: tool.companyId,
      timestamp: now,
      amount: amortizedCost,
      currency: 'USD',
      debitAccount: '5120-MANUFACTURING-OVERHEAD-TOOLING',
      creditAccount: '1850-ACCUMULATED-AMORTIZATION-TOOLING',
      referenceId: tool.toolCode,
      narration: `Amortized tooling wear for ${tool.toolCode} on WO ${params.workOrderId}: ${cyclesRun} cycles`,
      metadata: {
        workOrderId: params.workOrderId,
        cyclesRecorded: cyclesRun,
        totalLifeCycles: newTotalCycles,
        toolStatus: newStatus
      }
    });

    return { updatedTool, usageRecord, financialEvent };
  }

  public static calibrateAndCertifyTool(params: {
    tool: ToolMaster;
    calibratedByTechnician: string;
    approvedByQAInspector: string;
    resetLifeCycles?: boolean; // For overhauled/reground tools
    inspectorSignature: string;
  }): ToolMaster {
    const { tool, calibratedByTechnician, approvedByQAInspector, inspectorSignature } = params;

    // SoD Check: Inspector cannot be technician
    if (calibratedByTechnician.toLowerCase() === approvedByQAInspector.toLowerCase()) {
      throw new Error(`Segregation of Duties Violation: Technician (${calibratedByTechnician}) cannot approve their own calibration`);
    }

    if (!inspectorSignature || inspectorSignature.trim().length < 4) {
      throw new Error('Authorized digital inspector signature is mandatory for calibration release');
    }

    const now = new Date();
    const nextCalDate = new Date(now.getTime() + tool.calibrationIntervalDays * 86400000).toISOString();
    const newLifeCycles = params.resetLifeCycles ? 0 : tool.currentLifeCycles;

    const newSeal = sha256Hex(JSON.stringify({
      id: tool.id,
      code: tool.toolCode,
      calibratedAt: now.toISOString(),
      calibratedBy: calibratedByTechnician,
      approvedBy: approvedByQAInspector,
      signature: inspectorSignature,
      reset: params.resetLifeCycles
    }));

    return {
      ...tool,
      currentLifeCycles: newLifeCycles,
      lastCalibratedAt: now.toISOString(),
      nextCalibrationDue: nextCalDate,
      status: 'AVAILABLE',
      updatedAt: now.toISOString(),
      sha256Seal: newSeal
    };
  }

  // =========================================================================
  // 2. LINE CLEARANCE PROTOCOL
  // =========================================================================

  public static performLineClearance(params: {
    tenantId: string;
    companyId: string;
    workCenterId: string;
    workOrderId: string;
    priorLotNumber: string;
    targetLotNumber: string;
    checklist: {
      equipmentCleanedAndSanitized: boolean;
      priorMaterialsRemoved: boolean;
      wasteBinsEmptied: boolean;
      correctLabelsAndPackagingVerified: boolean;
      calibrationValidForGauges: boolean;
      safetyGuardsInPlace: boolean;
    };
    clearedByOperator: string;
    verifiedByQAInspector: string;
  }): LineClearanceChecklist {
    if (!params.tenantId || !params.companyId) {
      throw new Error('Tenant ID and Company ID are required');
    }

    // SoD Check: Operator cannot be QA Inspector
    if (params.clearedByOperator.toLowerCase() === params.verifiedByQAInspector.toLowerCase()) {
      throw new Error(`Segregation of Duties Violation: Clearing Operator (${params.clearedByOperator}) cannot verify line clearance as QA Inspector`);
    }

    const allPassed =
      params.checklist.equipmentCleanedAndSanitized &&
      params.checklist.priorMaterialsRemoved &&
      params.checklist.wasteBinsEmptied &&
      params.checklist.correctLabelsAndPackagingVerified &&
      params.checklist.calibrationValidForGauges &&
      params.checklist.safetyGuardsInPlace;

    const id = `LNC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const status = allPassed ? 'APPROVED' : 'REJECTED';
    const rejectionReason = allPassed ? undefined : 'One or more line clearance prerequisite checks failed.';

    const seal = sha256Hex(JSON.stringify({
      id,
      workCenter: params.workCenterId,
      workOrder: params.workOrderId,
      targetLot: params.targetLotNumber,
      status,
      clearedBy: params.clearedByOperator,
      verifiedBy: params.verifiedByQAInspector,
      timestamp: now
    }));

    return {
      id,
      tenantId: params.tenantId,
      companyId: params.companyId,
      workCenterId: params.workCenterId,
      workOrderId: params.workOrderId,
      priorLotNumber: params.priorLotNumber,
      targetLotNumber: params.targetLotNumber,
      ...params.checklist,
      clearedByOperator: params.clearedByOperator,
      verifiedByQAInspector: params.verifiedByQAInspector,
      clearedAt: now,
      status,
      rejectionReason,
      sha256Seal: seal
    };
  }

  // =========================================================================
  // 3. ELECTRONIC BATCH RECORD (eBR) GOVERNANCE (21 CFR Part 11 Compliant)
  // =========================================================================

  public static initializeElectronicBatchRecord(params: {
    tenantId: string;
    companyId: string;
    batchNumber: string;
    workOrderId: string;
    productSku: string;
    lineClearance: LineClearanceChecklist;
  }): ElectronicBatchRecord {
    if (params.lineClearance.status !== 'APPROVED') {
      throw new Error(`Cannot initialize eBR: Line clearance ${params.lineClearance.id} is NOT approved`);
    }

    const id = `EBR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const seal = sha256Hex(JSON.stringify({
      id,
      batch: params.batchNumber,
      wo: params.workOrderId,
      lineClearance: params.lineClearance.id,
      created: now
    }));

    return {
      id,
      tenantId: params.tenantId,
      companyId: params.companyId,
      batchNumber: params.batchNumber,
      workOrderId: params.workOrderId,
      productSku: params.productSku,
      lineClearanceId: params.lineClearance.id,
      ingredientsAdded: [],
      parameters: [],
      environmentalSensors: {
        ambientTemperatureC: 21.5,
        relativeHumidityPct: 45.0,
        cleanroomPressurePa: 25.0,
        recordedAt: now
      },
      inProcessDeviations: [],
      dualSignatures: null,
      status: 'IN_PROCESS',
      sha256AuditSeal: seal
    };
  }

  public static addIngredientDispense(params: {
    ebr: ElectronicBatchRecord;
    itemSku: string;
    lotNumber: string;
    plannedQuantity: number;
    actualQuantity: number;
    unitOfMeasure: string;
    weighedBy: string;
    verifiedBy: string;
  }): ElectronicBatchRecord {
    if (params.ebr.status !== 'IN_PROCESS') {
      throw new Error(`Cannot dispense ingredient: Batch ${params.ebr.batchNumber} status is ${params.ebr.status}`);
    }

    if (params.weighedBy.toLowerCase() === params.verifiedBy.toLowerCase()) {
      throw new Error(`SoD Violation: Weigher (${params.weighedBy}) cannot verify own ingredient dispense`);
    }

    if (params.actualQuantity <= 0) {
      throw new Error('Dispensed quantity must be greater than zero');
    }

    // Tolerance check (within +/- 5% of planned)
    const variance = Math.abs(params.actualQuantity - params.plannedQuantity) / params.plannedQuantity;
    if (variance > 0.05) {
      throw new Error(`Ingredient dispense variance exceeds 5% tolerance: planned ${params.plannedQuantity}, actual ${params.actualQuantity}`);
    }

    const now = new Date().toISOString();
    const updatedIngredients = [
      ...params.ebr.ingredientsAdded,
      {
        itemSku: params.itemSku,
        lotNumber: params.lotNumber,
        plannedQuantity: params.plannedQuantity,
        actualQuantity: params.actualQuantity,
        unitOfMeasure: params.unitOfMeasure,
        weighedBy: params.weighedBy,
        verifiedBy: params.verifiedBy,
        timestamp: now
      }
    ];

    const seal = sha256Hex(JSON.stringify({
      ebrId: params.ebr.id,
      ingredientsCount: updatedIngredients.length,
      updatedAt: now
    }));

    return {
      ...params.ebr,
      ingredientsAdded: updatedIngredients,
      sha256AuditSeal: seal
    };
  }

  public static recordCriticalProcessParameter(params: {
    ebr: ElectronicBatchRecord;
    parameterName: string;
    actualValue: number;
    targetValue: number;
    unit: string;
    lowerTolerance: number;
    upperTolerance: number;
  }): ElectronicBatchRecord {
    if (params.ebr.status !== 'IN_PROCESS') {
      throw new Error(`Cannot record parameter: Batch ${params.ebr.batchNumber} is not IN_PROCESS`);
    }

    const withinTolerance = params.actualValue >= params.lowerTolerance && params.actualValue <= params.upperTolerance;

    const param: CriticalProcessParameter = {
      parameterName: params.parameterName,
      targetValue: params.targetValue,
      actualValue: params.actualValue,
      unit: params.unit,
      lowerTolerance: params.lowerTolerance,
      upperTolerance: params.upperTolerance,
      withinTolerance
    };

    const updatedParams = [...params.ebr.parameters, param];
    const now = new Date().toISOString();

    const seal = sha256Hex(JSON.stringify({
      ebrId: params.ebr.id,
      paramsCount: updatedParams.length,
      lastParam: param.parameterName,
      withinTolerance,
      updatedAt: now
    }));

    return {
      ...params.ebr,
      parameters: updatedParams,
      sha256AuditSeal: seal
    };
  }

  public static signAndReleaseBatchRecord(params: {
    ebr: ElectronicBatchRecord;
    productionLeadSignature: string;
    productionLeadName: string;
    qualityAssuranceSignature: string;
    qualityAssuranceName: string;
    batchLotValueUsd?: number;
  }): { releasedEbr: ElectronicBatchRecord; financialEvent: DecoupledMfgFinancialEvent } {
    const { ebr, productionLeadName, qualityAssuranceName, productionLeadSignature, qualityAssuranceSignature } = params;

    if (ebr.status !== 'IN_PROCESS' && ebr.status !== 'PENDING_QA_RELEASE') {
      throw new Error(`Cannot sign batch: Current status is ${ebr.status}`);
    }

    // 21 CFR Part 11 SoD Dual Signature Check
    if (productionLeadName.toLowerCase() === qualityAssuranceName.toLowerCase()) {
      throw new Error(`21 CFR Part 11 Violation: Production Lead (${productionLeadName}) cannot sign as Quality Assurance Officer`);
    }

    if (!productionLeadSignature || !qualityAssuranceSignature) {
      throw new Error('Both Production Lead and QA Officer cryptographic digital signatures are mandatory');
    }

    // Check if any critical parameters failed tolerance
    const anyParamOut = ebr.parameters.some(p => !p.withinTolerance);
    const finalStatus = anyParamOut ? 'QUARANTINED' : 'RELEASED';

    const now = new Date().toISOString();

    const dualSignatures = {
      productionLeadSignature,
      productionLeadSignedAt: now,
      qualityAssuranceSignature,
      qualityAssuranceSignedAt: now
    };

    const finalSeal = sha256Hex(JSON.stringify({
      id: ebr.id,
      batch: ebr.batchNumber,
      status: finalStatus,
      prodLead: productionLeadName,
      qaLead: qualityAssuranceName,
      dualSignatures,
      releasedAt: now
    }));

    const releasedEbr: ElectronicBatchRecord = {
      ...ebr,
      dualSignatures,
      status: finalStatus,
      sha256AuditSeal: finalSeal
    };

    const lotValue = params.batchLotValueUsd || 25000;
    const isReleased = finalStatus === 'RELEASED';

    const financialEvent = this.emitFinancialEvent({
      eventType: isReleased ? 'EVT_BATCH_RELEASE_COMPLETED' : 'EVT_BATCH_REJECT_VARIANCE',
      tenantId: ebr.tenantId,
      companyId: ebr.companyId,
      timestamp: now,
      amount: lotValue,
      currency: 'USD',
      debitAccount: isReleased ? '1410-FINISHED-GOODS-INVENTORY' : '5200-MANUFACTURING-SCRAP-VARIANCE',
      creditAccount: '1430-WORK-IN-PROCESS-INVENTORY',
      referenceId: ebr.batchNumber,
      narration: isReleased
        ? `Finished Goods transfer for released batch ${ebr.batchNumber} (${ebr.productSku})`
        : `Scrap variance hold for quarantined batch ${ebr.batchNumber} due to out-of-spec parameters`,
      metadata: {
        batchNumber: ebr.batchNumber,
        productSku: ebr.productSku,
        ebrId: ebr.id,
        status: finalStatus,
        parametersCount: ebr.parameters.length,
        anyOutOfSpec: anyParamOut
      }
    });

    return { releasedEbr, financialEvent };
  }

  // =========================================================================
  // 4. LOSS-TREE OEE ANALYTICS ENGINE (Six Big Losses)
  // =========================================================================

  public static calculateOEELossTree(params: {
    tenantId: string;
    companyId: string;
    workCenterId: string;
    periodStart: string;
    periodEnd: string;
    plannedProductionTimeMinutes: number;
    operatingTimeMinutes: number;
    idealCycleTimeSeconds: number; // e.g. 12 seconds per piece
    totalPiecesProduced: number;
    goodPiecesProduced: number;
    lossBreakdown: OEELossRecord[];
  }): { analysis: OEELossTreeAnalysis; changeoverEvent?: DecoupledMfgFinancialEvent } {
    const {
      plannedProductionTimeMinutes,
      operatingTimeMinutes,
      idealCycleTimeSeconds,
      totalPiecesProduced,
      goodPiecesProduced,
      lossBreakdown
    } = params;

    if (plannedProductionTimeMinutes <= 0) {
      throw new Error('Planned production time must be greater than zero');
    }
    if (operatingTimeMinutes > plannedProductionTimeMinutes) {
      throw new Error('Operating time cannot exceed planned production time');
    }
    if (goodPiecesProduced > totalPiecesProduced) {
      throw new Error('Good pieces produced cannot exceed total pieces produced');
    }

    const scrapPiecesProduced = totalPiecesProduced - goodPiecesProduced;

    // 1. Availability = Operating Time / Planned Production Time
    const availabilityRate = Math.min(1, Math.max(0, operatingTimeMinutes / plannedProductionTimeMinutes));

    // 2. Performance = (Ideal Cycle Time * Total Pieces) / Operating Time
    const idealProductionTimeMinutes = (totalPiecesProduced * idealCycleTimeSeconds) / 60;
    const performanceRate = operatingTimeMinutes > 0
      ? Math.min(1, Math.max(0, idealProductionTimeMinutes / operatingTimeMinutes))
      : 0;

    // 3. Quality = Good Pieces / Total Pieces
    const qualityRate = totalPiecesProduced > 0
      ? Math.min(1, Math.max(0, goodPiecesProduced / totalPiecesProduced))
      : 0;

    // 4. Overall OEE
    const overallOEE = Math.round(availabilityRate * performanceRate * qualityRate * 10000) / 10000;

    // MTBF & MTTR calculation
    const breakdownLosses = lossBreakdown.filter(l => l.category === 'EQUIPMENT_BREAKDOWN');
    const breakdownCount = breakdownLosses.length || 1;
    const totalBreakdownMinutes = breakdownLosses.reduce((acc, l) => acc + l.durationMinutes, 0);

    const mttrMinutes = breakdownLosses.length > 0 ? totalBreakdownMinutes / breakdownCount : 0;
    const mtbfHours = breakdownLosses.length > 0
      ? (operatingTimeMinutes / 60) / breakdownCount
      : operatingTimeMinutes / 60;

    const seal = sha256Hex(JSON.stringify({
      workCenter: params.workCenterId,
      plannedTime: plannedProductionTimeMinutes,
      operatingTime: operatingTimeMinutes,
      availability: availabilityRate,
      performance: performanceRate,
      quality: qualityRate,
      oee: overallOEE,
      losses: lossBreakdown.length
    }));

    const analysis: OEELossTreeAnalysis = {
      tenantId: params.tenantId,
      companyId: params.companyId,
      workCenterId: params.workCenterId,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      plannedProductionTimeMinutes,
      operatingTimeMinutes,
      netOperatingTimeMinutes: Math.round(operatingTimeMinutes * performanceRate),
      valuableOperatingTimeMinutes: Math.round(operatingTimeMinutes * performanceRate * qualityRate),
      idealCycleTimeSeconds,
      totalPiecesProduced,
      goodPiecesProduced,
      scrapPiecesProduced,
      availabilityRate: Math.round(availabilityRate * 10000) / 10000,
      performanceRate: Math.round(performanceRate * 10000) / 10000,
      qualityRate: Math.round(qualityRate * 10000) / 10000,
      overallEquipmentEffectiveness: overallOEE,
      losses: lossBreakdown,
      meanTimeBetweenFailuresHours: Math.round(mtbfHours * 100) / 100,
      meanTimeToRepairMinutes: Math.round(mttrMinutes * 100) / 100,
      sha256Seal: seal
    };

    // If changeover loss exists, emit decoupled setup expense event
    const changeoverLoss = lossBreakdown.find(l => l.category === 'SETUP_CHANGEOVER');
    let changeoverEvent: DecoupledMfgFinancialEvent | undefined;
    if (changeoverLoss && changeoverLoss.durationMinutes > 0) {
      const changeoverCost = Math.round((changeoverLoss.durationMinutes / 60) * 150 * 100) / 100; // $150/hr setup labor
      changeoverEvent = this.emitFinancialEvent({
        eventType: 'EVT_CHANGEOVER_SETUP_COST',
        tenantId: params.tenantId,
        companyId: params.companyId,
        timestamp: new Date().toISOString(),
        amount: changeoverCost,
        currency: 'USD',
        debitAccount: '5130-DIRECT-SETUP-LABOR-VARIANCE',
        creditAccount: '2110-ACCRUED-PAYROLL-EXPENSES',
        referenceId: `WC-${params.workCenterId}-SETUP`,
        narration: `Setup & changeover loss on ${params.workCenterId}: ${changeoverLoss.durationMinutes} mins`,
        metadata: {
          workCenterId: params.workCenterId,
          durationMinutes: changeoverLoss.durationMinutes,
          lostUnits: changeoverLoss.lostUnitsEquivalent
        }
      });
    }

    return { analysis, changeoverEvent };
  }

  // =========================================================================
  // 5. SHIFT HANDOVER LOGBOOK GOVERNANCE
  // =========================================================================

  public static createShiftHandover(params: {
    tenantId: string;
    companyId: string;
    shiftId: string;
    workCenterId: string;
    outgoingSupervisor: string;
    shiftStartTime: string;
    shiftEndTime: string;
    totalOutputUnits: number;
    scrapUnits: number;
    wipItemsInCell: Array<{ workOrderId: string; stage: string; quantity: number }>;
    unresolvedAnomalies: Array<{ alertId: string; severity: 'LOW' | 'MEDIUM' | 'CRITICAL'; description: string; actionPending: string }>;
    safetyIncidentsCount: number;
    handoverNotes: string;
  }): ShiftHandoverLogbook {
    if (!params.tenantId || !params.companyId) {
      throw new Error('Tenant ID and Company ID are required');
    }
    if (!params.shiftId || !params.outgoingSupervisor) {
      throw new Error('Shift ID and Outgoing Supervisor are required');
    }

    const id = `SHF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const seal = sha256Hex(JSON.stringify({
      id,
      shiftId: params.shiftId,
      workCenter: params.workCenterId,
      outgoing: params.outgoingSupervisor,
      totalOutput: params.totalOutputUnits,
      scrap: params.scrapUnits
    }));

    return {
      id,
      tenantId: params.tenantId,
      companyId: params.companyId,
      shiftId: params.shiftId,
      workCenterId: params.workCenterId,
      outgoingSupervisor: params.outgoingSupervisor,
      incomingSupervisor: '',
      shiftStartTime: params.shiftStartTime,
      shiftEndTime: params.shiftEndTime,
      totalOutputUnits: params.totalOutputUnits,
      scrapUnits: params.scrapUnits,
      unresolvedAnomalies: params.unresolvedAnomalies,
      wipItemsInCell: params.wipItemsInCell,
      safetyIncidentsCount: params.safetyIncidentsCount,
      handoverNotes: params.handoverNotes,
      isSignedOffByBoth: false,
      sha256Seal: seal
    };
  }

  public static signOffShiftHandover(params: {
    handover: ShiftHandoverLogbook;
    incomingSupervisor: string;
    acknowledgementNotes?: string;
  }): ShiftHandoverLogbook {
    const { handover, incomingSupervisor } = params;

    if (handover.isSignedOffByBoth) {
      throw new Error('Shift handover has already been completed and signed off');
    }

    // SoD Check: Incoming supervisor cannot be outgoing supervisor
    if (handover.outgoingSupervisor.toLowerCase() === incomingSupervisor.toLowerCase()) {
      throw new Error(`Segregation of Duties Violation: Incoming Supervisor (${incomingSupervisor}) cannot be the same as Outgoing Supervisor`);
    }

    const now = new Date().toISOString();
    const updatedNotes = params.acknowledgementNotes
      ? `${handover.handoverNotes} | Incoming Note: ${params.acknowledgementNotes}`
      : handover.handoverNotes;

    const finalSeal = sha256Hex(JSON.stringify({
      id: handover.id,
      shiftId: handover.shiftId,
      outgoing: handover.outgoingSupervisor,
      incoming: incomingSupervisor,
      signedOffAt: now,
      output: handover.totalOutputUnits,
      anomaliesCount: handover.unresolvedAnomalies.length
    }));

    return {
      ...handover,
      incomingSupervisor,
      handoverNotes: updatedNotes,
      isSignedOffByBoth: true,
      signedOffAt: now,
      sha256Seal: finalSeal
    };
  }
}
