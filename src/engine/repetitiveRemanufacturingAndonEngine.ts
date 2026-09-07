/**
 * AM Enterprise ERP — Phase 3.2D-07 Engine
 * Repetitive Manufacturing, Circular Remanufacturing & Core Returns,
 * Potency Balancing & Shop Floor Andon Orchestration
 */

import {
  RepetitiveProductionSchedule,
  RepetitiveReportingPoint,
  RepetitiveBackflushResult,
  RemanTeardownOrder,
  CoreConditionGrade,
  HarvestedComponent,
  PotencyAssayRecord,
  PotencyCompensationResult,
  JointCostSplitMethod,
  JointProductOutput,
  JointCostSettlementResult,
  AndonIncident,
  AndonSeverity,
  AndonCategory
} from '../types/repetitiveRemanufacturingAndon';

export class RepetitiveRemanufacturingAndonEngine {
  private static hashPayload(payload: any): string {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    for (let i = 0; i < raw.length; i++) {
      const c = raw.charCodeAt(i);
      h0 = (Math.imul(h0 ^ c, 0x5bd1e995)) >>> 0;
      h1 = (Math.imul(h1 ^ (c * 31), 0x27d4eb2d)) >>> 0;
      h2 = (Math.imul(h2 ^ (c * 17), 0x165667b1)) >>> 0;
      h3 = (Math.imul(h3 ^ (c * 13), 0xd3a2646c)) >>> 0;
      h4 = (Math.imul(h4 ^ (c * 7), 0x85ebca6b)) >>> 0;
      h5 = (Math.imul(h5 ^ (c * 3), 0xc2b2ae35)) >>> 0;
      h6 = (Math.imul(h6 ^ (c * 53), 0x45d9f3b)) >>> 0;
      h7 = (Math.imul(h7 ^ (c * 97), 0x7feb352d)) >>> 0;
    }
    const toHex8 = (n: number) => ('00000000' + (n >>> 0).toString(16)).slice(-8);
    return `${toHex8(h0)}${toHex8(h1)}${toHex8(h2)}${toHex8(h3)}${toHex8(h4)}${toHex8(h5)}${toHex8(h6)}${toHex8(h7)}`;
  }

  // =========================================================================
  // 1. REPETITIVE MANUFACTURING & TAKT-TIME BACKFLUSH
  // =========================================================================

  public static createRepetitiveSchedule(params: {
    tenantId: string;
    companyId: string;
    scheduleCode: string;
    productSku: string;
    productionLineId: string;
    validFrom: string;
    validTo: string;
    taktTimeSeconds: number;
    plannedDailyRate: number;
    totalPlannedUnits: number;
    bomId: string;
    routingId: string;
    reportingPoints: Array<{ sequence: number; operationName: string; workCenterId: string }>;
  }): RepetitiveProductionSchedule {
    if (!params.scheduleCode || !params.productSku || !params.productionLineId) {
      throw new Error('Schedule code, product SKU, and production line ID are mandatory.');
    }
    if (params.taktTimeSeconds <= 0 || params.plannedDailyRate <= 0 || params.totalPlannedUnits <= 0) {
      throw new Error('Takt time, daily rate, and planned units must be positive non-zero values.');
    }
    if (!params.reportingPoints || params.reportingPoints.length === 0) {
      throw new Error('At least one reporting point operation must be defined for repetitive production.');
    }

    const now = new Date().toISOString();
    const sortedPoints: RepetitiveReportingPoint[] = params.reportingPoints
      .sort((a, b) => a.sequence - b.sequence)
      .map(p => ({
        sequence: p.sequence,
        operationName: p.operationName,
        workCenterId: p.workCenterId,
        cumulativeCompletedQty: 0,
        cumulativeScrapQty: 0
      }));

    const partialSchedule = {
      tenantId: params.tenantId,
      companyId: params.companyId,
      scheduleCode: params.scheduleCode,
      productSku: params.productSku,
      productionLineId: params.productionLineId,
      validFrom: params.validFrom,
      validTo: params.validTo,
      taktTimeSeconds: params.taktTimeSeconds,
      plannedDailyRate: params.plannedDailyRate,
      totalPlannedUnits: params.totalPlannedUnits,
      bomId: params.bomId,
      routingId: params.routingId,
      createdAt: now
    };

    const auditHash = this.hashPayload(partialSchedule);

    return {
      id: `REM-SCHED-${Date.now().toString(36).toUpperCase()}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      scheduleCode: params.scheduleCode,
      productSku: params.productSku,
      productionLineId: params.productionLineId,
      validFrom: params.validFrom,
      validTo: params.validTo,
      taktTimeSeconds: params.taktTimeSeconds,
      plannedDailyRate: params.plannedDailyRate,
      totalPlannedUnits: params.totalPlannedUnits,
      totalReportedUnits: 0,
      totalScrapUnits: 0,
      reportingPoints: sortedPoints,
      status: 'ACTIVE',
      bomId: params.bomId,
      routingId: params.routingId,
      createdAt: now,
      updatedAt: now,
      auditHash
    };
  }

  public static executeRepetitiveBackflush(params: {
    schedule: RepetitiveProductionSchedule;
    reportingPointSeq: number;
    backflushQty: number;
    scrapQty?: number;
    operatorId: string;
    estimatedUnitMaterialCost?: number;
    estimatedUnitConversionCost?: number;
  }): RepetitiveBackflushResult {
    const { schedule, reportingPointSeq, backflushQty } = params;
    const scrapQty = params.scrapQty || 0;

    if (schedule.status !== 'ACTIVE') {
      throw new Error(`Cannot backflush against schedule in '${schedule.status}' status. Schedule must be ACTIVE.`);
    }
    if (backflushQty <= 0) {
      throw new Error('Backflush quantity must be greater than zero.');
    }
    if (scrapQty < 0) {
      throw new Error('Scrap quantity cannot be negative.');
    }

    const ptIndex = schedule.reportingPoints.findIndex(p => p.sequence === reportingPointSeq);
    if (ptIndex === -1) {
      throw new Error(`Reporting point sequence ${reportingPointSeq} does not exist on schedule ${schedule.scheduleCode}.`);
    }

    const now = new Date().toISOString();
    const updatedPoints = schedule.reportingPoints.map((pt, idx) => {
      if (idx === ptIndex) {
        return {
          ...pt,
          cumulativeCompletedQty: pt.cumulativeCompletedQty + backflushQty,
          cumulativeScrapQty: pt.cumulativeScrapQty + scrapQty,
          lastBackflushAt: now
        };
      }
      return pt;
    });

    const isFinalPoint = ptIndex === schedule.reportingPoints.length - 1;
    const newTotalReported = isFinalPoint
      ? schedule.totalReportedUnits + backflushQty
      : schedule.totalReportedUnits;
    const newTotalScrap = schedule.totalScrapUnits + scrapQty;

    const unitMatCost = params.estimatedUnitMaterialCost ?? 18.50;
    const unitConvCost = params.estimatedUnitConversionCost ?? 6.25;

    const totalMatCost = Math.round((backflushQty + scrapQty) * unitMatCost * 100) / 100;
    const totalLaborOverheadCost = Math.round(backflushQty * unitConvCost * 100) / 100;
    const totalWipSettled = Math.round((totalMatCost + totalLaborOverheadCost) * 100) / 100;

    const updatedSchedule: RepetitiveProductionSchedule = {
      ...schedule,
      totalReportedUnits: newTotalReported,
      totalScrapUnits: newTotalScrap,
      reportingPoints: updatedPoints,
      updatedAt: now,
      status: newTotalReported >= schedule.totalPlannedUnits ? 'COMPLETED' : 'ACTIVE',
      auditHash: this.hashPayload({
        id: schedule.id,
        newTotalReported,
        newTotalScrap,
        updatedPoints,
        timestamp: now
      })
    };

    const financialEvent = {
      eventId: `EVT-REM-BF-${Date.now().toString(36).toUpperCase()}`,
      eventType: 'EVT_REPETITIVE_BACKFLUSH_SETTLED' as const,
      tenantId: schedule.tenantId,
      companyId: schedule.companyId,
      scheduleId: schedule.id,
      reportingPointSeq,
      unitsSettled: backflushQty,
      laborOverheadEstimatedCost: totalLaborOverheadCost,
      materialsCostIssued: totalMatCost,
      timestamp: now,
      glPostings: [
        {
          accountCode: '1410-WIP-REP-MFG',
          accountName: 'Work In Progress - Repetitive Lines',
          debit: totalWipSettled,
          credit: 0
        },
        {
          accountCode: '1310-RAW-MATERIALS',
          accountName: 'Raw Materials Inventory Issued',
          debit: 0,
          credit: totalMatCost
        },
        {
          accountCode: '5200-OVERHEAD-APPLIED',
          accountName: 'Repetitive Labor & Overhead Applied',
          debit: 0,
          credit: totalLaborOverheadCost
        }
      ]
    };

    return {
      schedule: updatedSchedule,
      reportingPointSeq,
      backflushQty,
      scrapQty,
      backflushedAt: now,
      operatorId: params.operatorId,
      financialEvent
    };
  }

  // =========================================================================
  // 2. CIRCULAR REMANUFACTURING & CORE RETURN HARVESTING
  // =========================================================================

  public static createCoreReturnAndTeardown(params: {
    tenantId: string;
    companyId: string;
    orderNumber: string;
    coreReturnSerial: string;
    parentProductSku: string;
    customerAccountId: string;
    conditionGrade: CoreConditionGrade;
    coreDepositAmountUsd: number;
    disassemblyWorkCenterId: string;
    technicianId: string;
    harvestedComponents?: HarvestedComponent[];
    teardownCostUsd?: number;
  }): { teardownOrder: RemanTeardownOrder; financialEvent: any } {
    if (!params.coreReturnSerial || !params.parentProductSku || !params.customerAccountId) {
      throw new Error('Core return serial number, product SKU, and customer account are mandatory.');
    }
    if (params.coreDepositAmountUsd < 0) {
      throw new Error('Core deposit amount cannot be negative.');
    }

    // Determine approved core refund credit by condition grade
    let creditMultiplier = 0.0;
    switch (params.conditionGrade) {
      case 'GRADE_A_REFURBISHABLE':
        creditMultiplier = 1.0; // 100% full deposit credit
        break;
      case 'GRADE_B_MINOR_DEFECTS':
        creditMultiplier = 0.75; // 75% credit
        break;
      case 'GRADE_C_HARVEST_ONLY':
        creditMultiplier = 0.40; // 40% credit
        break;
      case 'GRADE_D_SCRAP':
        creditMultiplier = 0.0; // 0% credit (total loss)
        break;
    }

    const coreCreditApprovedUsd = Math.round(params.coreDepositAmountUsd * creditMultiplier * 100) / 100;
    const teardownCostUsd = params.teardownCostUsd ?? 45.0;

    const harvestedComponents: HarvestedComponent[] = params.harvestedComponents || [];
    const totalSalvagedValueUsd = Math.round(
      harvestedComponents.reduce((acc, c) => acc + (c.salvageValueUsd * c.recoveredQuantity), 0) * 100
    ) / 100;

    const netEconomicBenefitUsd = Math.round((totalSalvagedValueUsd - teardownCostUsd - coreCreditApprovedUsd) * 100) / 100;
    const now = new Date().toISOString();

    const orderId = `REMAN-${Date.now().toString(36).toUpperCase()}`;
    const auditHash = this.hashPayload({
      orderId,
      coreReturnSerial: params.coreReturnSerial,
      conditionGrade: params.conditionGrade,
      coreCreditApprovedUsd,
      totalSalvagedValueUsd,
      netEconomicBenefitUsd,
      timestamp: now
    });

    const teardownOrder: RemanTeardownOrder = {
      id: orderId,
      tenantId: params.tenantId,
      companyId: params.companyId,
      orderNumber: params.orderNumber,
      coreReturnSerial: params.coreReturnSerial,
      parentProductSku: params.parentProductSku,
      customerAccountId: params.customerAccountId,
      conditionGrade: params.conditionGrade,
      coreDepositAmountUsd: params.coreDepositAmountUsd,
      coreCreditApprovedUsd,
      disassemblyWorkCenterId: params.disassemblyWorkCenterId,
      harvestedComponents,
      totalSalvagedValueUsd,
      teardownCostUsd,
      netEconomicBenefitUsd,
      status: harvestedComponents.length > 0 ? 'DISASSEMBLED' : 'INSPECTION_COMPLETED',
      technicianId: params.technicianId,
      inspectedAt: now,
      auditHash
    };

    const financialEvent = {
      eventId: `EVT-REMAN-TD-${Date.now().toString(36).toUpperCase()}`,
      eventType: 'EVT_CORE_DEPOSIT_RECOVERED' as const,
      tenantId: params.tenantId,
      companyId: params.companyId,
      orderId: teardownOrder.id,
      coreReturnSerial: params.coreReturnSerial,
      coreCreditApprovedUsd,
      salvagedComponentsValueUsd: totalSalvagedValueUsd,
      timestamp: now,
      glPostings: [
        {
          accountCode: '1330-SALVAGE-PARTS-INVENTORY',
          accountName: 'Harvested Reman Parts Inventory',
          debit: totalSalvagedValueUsd,
          credit: 0
        },
        {
          accountCode: '2150-CUSTOMER-CORE-CREDIT-PAYABLE',
          accountName: 'Customer Core Deposit Payable',
          debit: 0,
          credit: coreCreditApprovedUsd
        },
        {
          accountCode: '5200-OVERHEAD-APPLIED',
          accountName: 'Reman Teardown Labor & Overhead Absorbed',
          debit: 0,
          credit: teardownCostUsd
        },
        {
          accountCode: '5310-REMAN-ECONOMIC-GAIN-LOSS',
          accountName: 'Remanufacturing Circular Salvage Gain/Loss',
          debit: netEconomicBenefitUsd < 0 ? Math.abs(netEconomicBenefitUsd) : 0,
          credit: netEconomicBenefitUsd >= 0 ? netEconomicBenefitUsd : 0
        }
      ]
    };

    return { teardownOrder, financialEvent };
  }

  // =========================================================================
  // 3. ACTIVE INGREDIENT POTENCY BALANCING & RECIPE COMPENSATION
  // =========================================================================

  public static balancePotencyAndCompensateRecipe(params: {
    formulaId: string;
    batchSizeKg: number;
    activeIngredient: {
      sku: string;
      nominalQtyKg: number;
      assay: PotencyAssayRecord;
    };
    fillerExcipient: {
      sku: string;
      lotNumber: string;
      nominalQtyKg: number;
    };
    otherIngredients?: Array<{ sku: string; qtyKg: number }>;
    pharmacistSignature: string;
  }): PotencyCompensationResult {
    const { activeIngredient, fillerExcipient, batchSizeKg } = params;
    const otherIngredients = params.otherIngredients || [];

    if (!params.pharmacistSignature) {
      throw new Error('Qualified Pharmacist / QA Chemist digital signature is mandatory for potency recipe compensation.');
    }

    const assayPotency = activeIngredient.assay.actualAssayPotencyPct;
    if (assayPotency <= 0 || assayPotency < 70.0 || assayPotency > 130.0) {
      throw new Error(
        `Active ingredient assay potency (${assayPotency}%) is outside acceptable pharmaceutical limits (70.0% - 130.0%). Lot rejected.`
      );
    }

    // Potency compensation factor = Nominal Potency / Actual Assay Potency
    const nominalPotency = activeIngredient.assay.nominalPotencyPct || 100.0;
    const potencyFactor = Math.round((nominalPotency / assayPotency) * 1000000) / 1000000;

    // Adjusted active quantity
    const adjustedActiveQty = Math.round(activeIngredient.nominalQtyKg * potencyFactor * 1000) / 1000;
    const deltaActive = Math.round((adjustedActiveQty - activeIngredient.nominalQtyKg) * 1000) / 1000;

    // Compensate filler/excipient so total batch weight remains perfectly static
    const compensatedFillerQty = Math.round((fillerExcipient.nominalQtyKg - deltaActive) * 1000) / 1000;
    if (compensatedFillerQty < 0) {
      throw new Error(
        `Required potency compensation (${adjustedActiveQty} kg) exceeds available excipient mass (${fillerExcipient.nominalQtyKg} kg). Cannot balance batch weight.`
      );
    }

    const othersTotal = otherIngredients.reduce((sum, item) => sum + item.qtyKg, 0);
    const calculatedTotalWeight = Math.round((adjustedActiveQty + compensatedFillerQty + othersTotal) * 1000) / 1000;

    const nominalTotal = Math.round((activeIngredient.nominalQtyKg + fillerExcipient.nominalQtyKg + othersTotal) * 1000) / 1000;
    const weightVarianceGrams = Math.round(Math.abs(calculatedTotalWeight - nominalTotal) * 1000);

    return {
      formulaId: params.formulaId,
      batchSizeKg,
      activeIngredient: {
        sku: activeIngredient.sku,
        lotNumber: activeIngredient.assay.lotNumber,
        nominalQtyKg: activeIngredient.nominalQtyKg,
        adjustedQtyKg: adjustedActiveQty,
        potencyFactor
      },
      fillerExcipient: {
        sku: fillerExcipient.sku,
        lotNumber: fillerExcipient.lotNumber,
        nominalQtyKg: fillerExcipient.nominalQtyKg,
        compensatedQtyKg: compensatedFillerQty
      },
      otherIngredients,
      totalBatchWeightKg: calculatedTotalWeight,
      weightVarianceGrams,
      compensatedAt: new Date().toISOString(),
      pharmacistSignature: params.pharmacistSignature
    };
  }

  // =========================================================================
  // 4. BY-PRODUCT & CO-PRODUCT JOINT COST SETTLEMENT (SPLIT-OFF)
  // =========================================================================

  public static settleJointProductionCostSplitOff(params: {
    tenantId: string;
    companyId: string;
    productionBatchId: string;
    totalJointCostUsd: number;
    splitMethod: JointCostSplitMethod;
    products: Array<{
      productSku: string;
      productName: string;
      productType: 'MAIN_PRODUCT' | 'CO_PRODUCT' | 'BY_PRODUCT';
      quantityProduced: number;
      unitOfMeasure: string;
      marketPricePerUnitUsd: number;
      separableProcessingCostPerUnitUsd?: number;
    }>;
  }): JointCostSettlementResult {
    const { tenantId, companyId, productionBatchId, totalJointCostUsd, splitMethod, products } = params;

    if (totalJointCostUsd <= 0) {
      throw new Error('Total joint production cost must be greater than zero.');
    }
    if (!products || products.length === 0) {
      throw new Error('At least one product output is required for joint cost allocation.');
    }

    // Step 1: Compute allocation bases
    const productCalculations = products.map(p => {
      const separableCostPerUnit = p.separableProcessingCostPerUnitUsd || 0;
      const totalSeparableCost = separableCostPerUnit * p.quantityProduced;
      const grossSalesValue = p.quantityProduced * p.marketPricePerUnitUsd;
      const netRealizableValue = Math.max(0, grossSalesValue - totalSeparableCost);

      return {
        ...p,
        separableCostPerUnit,
        totalSeparableCost,
        grossSalesValue,
        netRealizableValue
      };
    });

    let totalBase = 0;
    if (splitMethod === 'SALES_VALUE_SPLITOFF') {
      totalBase = productCalculations.reduce((acc, p) => acc + p.grossSalesValue, 0);
    } else if (splitMethod === 'PHYSICAL_UNITS') {
      totalBase = productCalculations.reduce((acc, p) => acc + p.quantityProduced, 0);
    } else if (splitMethod === 'NET_REALIZABLE_VALUE') {
      totalBase = productCalculations.reduce((acc, p) => acc + p.netRealizableValue, 0);
    }

    if (totalBase <= 0) {
      throw new Error(`Total allocation basis for method ${splitMethod} is zero or negative. Cannot apportion joint cost.`);
    }

    // Step 2: Apportion joint cost
    let allocatedSum = 0;
    const outputs: JointProductOutput[] = productCalculations.map(p => {
      let basisValue = 0;
      if (splitMethod === 'SALES_VALUE_SPLITOFF') basisValue = p.grossSalesValue;
      else if (splitMethod === 'PHYSICAL_UNITS') basisValue = p.quantityProduced;
      else if (splitMethod === 'NET_REALIZABLE_VALUE') basisValue = p.netRealizableValue;

      const fraction = basisValue / totalBase;
      const allocatedJointCostUsd = Math.round(totalJointCostUsd * fraction * 100) / 100;
      allocatedSum += allocatedJointCostUsd;

      const unitCostUsd = Math.round(((allocatedJointCostUsd + p.totalSeparableCost) / p.quantityProduced) * 1000) / 1000;

      return {
        productSku: p.productSku,
        productName: p.productName,
        productType: p.productType,
        quantityProduced: p.quantityProduced,
        unitOfMeasure: p.unitOfMeasure,
        marketPricePerUnitUsd: p.marketPricePerUnitUsd,
        separableProcessingCostPerUnitUsd: p.separableCostPerUnit,
        allocatedJointCostUsd,
        unitCostUsd
      };
    });

    // Zero-penny rounding reconciliation: adjust main product by any rounding remainder
    const roundingDiff = Math.round((totalJointCostUsd - allocatedSum) * 100) / 100;
    if (roundingDiff !== 0 && outputs.length > 0) {
      const mainIdx = outputs.findIndex(o => o.productType === 'MAIN_PRODUCT');
      const targetIdx = mainIdx !== -1 ? mainIdx : 0;
      outputs[targetIdx].allocatedJointCostUsd = Math.round((outputs[targetIdx].allocatedJointCostUsd + roundingDiff) * 100) / 100;
      outputs[targetIdx].unitCostUsd = Math.round(
        ((outputs[targetIdx].allocatedJointCostUsd + (outputs[targetIdx].separableProcessingCostPerUnitUsd * outputs[targetIdx].quantityProduced)) /
          outputs[targetIdx].quantityProduced) * 1000
      ) / 1000;
    }

    const now = new Date().toISOString();
    const settlementId = `JOINT-STL-${Date.now().toString(36).toUpperCase()}`;

    const financialEvent = {
      eventId: `EVT-JOINT-${Date.now().toString(36).toUpperCase()}`,
      eventType: 'EVT_BYPRODUCT_SPLITOFF_SETTLED' as const,
      tenantId,
      companyId,
      batchId: productionBatchId,
      totalJointCost: totalJointCostUsd,
      glPostings: [
        {
          accountCode: '1320-FINISHED-GOODS-MAIN',
          accountName: 'Finished Goods - Main & Co-Products',
          debit: totalJointCostUsd,
          credit: 0
        },
        {
          accountCode: '1410-WIP-JOINT-PROCESS',
          accountName: 'WIP - Joint Refining Clearing',
          debit: 0,
          credit: totalJointCostUsd
        }
      ]
    };

    return {
      settlementId,
      tenantId,
      companyId,
      productionBatchId,
      totalJointCostUsd,
      splitMethod,
      outputs,
      reconciliationDifferenceUsd: 0.00,
      settledAt: now,
      financialEvent
    };
  }

  // =========================================================================
  // 5. ANDON INCIDENT TRIGGERING, ESCALATION & RESOLUTION
  // =========================================================================

  public static triggerAndonAlert(params: {
    tenantId: string;
    companyId: string;
    workCenterId: string;
    workOrderId?: string;
    category: AndonCategory;
    severity: AndonSeverity;
    description: string;
    triggeredBy: string;
  }): AndonIncident {
    if (!params.workCenterId || !params.description || !params.triggeredBy) {
      throw new Error('Work center, incident description, and triggering operator are mandatory.');
    }

    const now = new Date().toISOString();
    const incidentCode = `ANDON-${Date.now().toString().slice(-6)}`;
    const lineHaltEnforced = params.severity === 'CRITICAL_STOP' || params.category === 'SAFETY_E_STOP';

    const incidentId = `ANDON-INC-${Date.now().toString(36).toUpperCase()}`;
    const auditHash = this.hashPayload({
      incidentId,
      incidentCode,
      workCenterId: params.workCenterId,
      severity: params.severity,
      lineHaltEnforced,
      timestamp: now
    });

    return {
      id: incidentId,
      tenantId: params.tenantId,
      companyId: params.companyId,
      incidentCode,
      workCenterId: params.workCenterId,
      workOrderId: params.workOrderId,
      category: params.category,
      severity: params.severity,
      description: params.description,
      triggeredBy: params.triggeredBy,
      triggeredAt: now,
      lineHaltEnforced,
      status: 'OPEN_TRIGGERED',
      auditHash
    };
  }

  public static acknowledgeAndonIncident(params: {
    incident: AndonIncident;
    acknowledgedBy: string;
  }): AndonIncident {
    const { incident, acknowledgedBy } = params;
    if (incident.status !== 'OPEN_TRIGGERED') {
      throw new Error(`Cannot acknowledge incident in '${incident.status}' status. Must be OPEN_TRIGGERED.`);
    }
    if (!acknowledgedBy) {
      throw new Error('Acknowledging technician / supervisor ID is mandatory.');
    }

    const now = new Date().toISOString();
    const leadTimeMinutes = Math.max(
      1,
      Math.round((new Date(now).getTime() - new Date(incident.triggeredAt).getTime()) / 60000)
    );

    return {
      ...incident,
      status: 'ACKNOWLEDGED',
      acknowledgedBy,
      acknowledgedAt: now,
      responseLeadTimeMinutes: leadTimeMinutes,
      auditHash: this.hashPayload({
        id: incident.id,
        status: 'ACKNOWLEDGED',
        acknowledgedBy,
        leadTimeMinutes,
        timestamp: now
      })
    };
  }

  public static resolveAndonIncident(params: {
    incident: AndonIncident;
    resolvedBy: string;
    resolutionNotes: string;
    downtimeMinutes?: number;
  }): AndonIncident {
    const { incident, resolvedBy, resolutionNotes } = params;
    if (incident.status === 'RESOLVED' || incident.status === 'CLOSED') {
      throw new Error(`Incident ${incident.incidentCode} is already resolved.`);
    }
    if (!resolvedBy || !resolutionNotes) {
      throw new Error('Resolving technician and corrective action resolution notes are mandatory.');
    }

    // Segregation of Duties: Operator who triggered safety incident cannot unilaterally resolve without maintenance/lead sign-off
    if (incident.category === 'SAFETY_E_STOP' && incident.triggeredBy === resolvedBy) {
      throw new Error(
        'Segregation of Duties Violation: Safety E-Stop incidents cannot be resolved by the triggering operator alone. Maintenance Lead or EHS Officer sign-off required.'
      );
    }

    const now = new Date().toISOString();
    const downtimeMinutes = params.downtimeMinutes ?? Math.max(
      5,
      Math.round((new Date(now).getTime() - new Date(incident.triggeredAt).getTime()) / 60000)
    );

    return {
      ...incident,
      status: 'RESOLVED',
      resolvedBy,
      resolvedAt: now,
      resolutionNotes,
      totalDowntimeMinutes: downtimeMinutes,
      lineHaltEnforced: false, // Line interlock released
      auditHash: this.hashPayload({
        id: incident.id,
        status: 'RESOLVED',
        resolvedBy,
        downtimeMinutes,
        timestamp: now
      })
    };
  }
}
