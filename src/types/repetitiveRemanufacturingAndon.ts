/**
 * AM Enterprise ERP — Phase 3.2D-07 Domain Types
 * Repetitive Manufacturing, Circular Remanufacturing & Core Returns,
 * Potency Balancing & Shop Floor Andon Orchestration
 */

export type RepetitiveScheduleStatus = 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export interface RepetitiveReportingPoint {
  sequence: number;
  operationName: string;
  workCenterId: string;
  cumulativeCompletedQty: number;
  cumulativeScrapQty: number;
  lastBackflushAt?: string;
}

export interface RepetitiveProductionSchedule {
  id: string;
  tenantId: string;
  companyId: string;
  scheduleCode: string;
  productSku: string;
  productionLineId: string;
  validFrom: string;
  validTo: string;
  taktTimeSeconds: number; // e.g. 45 seconds per unit
  plannedDailyRate: number; // e.g. 600 units/day
  totalPlannedUnits: number;
  totalReportedUnits: number;
  totalScrapUnits: number;
  reportingPoints: RepetitiveReportingPoint[];
  status: RepetitiveScheduleStatus;
  bomId: string;
  routingId: string;
  createdAt: string;
  updatedAt: string;
  auditHash: string;
}

export interface RepetitiveBackflushResult {
  schedule: RepetitiveProductionSchedule;
  reportingPointSeq: number;
  backflushQty: number;
  scrapQty: number;
  backflushedAt: string;
  operatorId: string;
  financialEvent: {
    eventId: string;
    eventType: 'EVT_REPETITIVE_BACKFLUSH_SETTLED';
    tenantId: string;
    companyId: string;
    scheduleId: string;
    reportingPointSeq: number;
    unitsSettled: number;
    laborOverheadEstimatedCost: number;
    materialsCostIssued: number;
    timestamp: string;
    glPostings: Array<{
      accountCode: string;
      accountName: string;
      debit: number;
      credit: number;
    }>;
  };
}

export type CoreConditionGrade = 'GRADE_A_REFURBISHABLE' | 'GRADE_B_MINOR_DEFECTS' | 'GRADE_C_HARVEST_ONLY' | 'GRADE_D_SCRAP';

export interface HarvestedComponent {
  componentSku: string;
  componentName: string;
  recoveredQuantity: number;
  standardCostUsd: number;
  salvageValueUsd: number;
  disposition: 'RETURN_TO_STOCK' | 'REFURBISH' | 'SCRAP';
  targetBinLocation: string;
}

export interface RemanTeardownOrder {
  id: string;
  tenantId: string;
  companyId: string;
  orderNumber: string; // e.g. REMAN-2026-001
  coreReturnSerial: string;
  parentProductSku: string;
  customerAccountId: string;
  conditionGrade: CoreConditionGrade;
  coreDepositAmountUsd: number;
  coreCreditApprovedUsd: number;
  disassemblyWorkCenterId: string;
  harvestedComponents: HarvestedComponent[];
  totalSalvagedValueUsd: number;
  teardownCostUsd: number;
  netEconomicBenefitUsd: number;
  status: 'RECEIVED' | 'INSPECTION_COMPLETED' | 'DISASSEMBLED' | 'HARVEST_STORED' | 'CLOSED';
  technicianId: string;
  inspectedAt: string;
  closedAt?: string;
  auditHash: string;
}

export interface PotencyAssayRecord {
  ingredientSku: string;
  ingredientName: string;
  lotNumber: string;
  nominalPotencyPct: number; // e.g. 100.0%
  actualAssayPotencyPct: number; // e.g. 92.5%
  moistureContentPct?: number;
  testedAt: string;
  analystId: string;
}

export interface PotencyCompensationResult {
  formulaId: string;
  batchSizeKg: number;
  activeIngredient: {
    sku: string;
    lotNumber: string;
    nominalQtyKg: number;
    adjustedQtyKg: number;
    potencyFactor: number;
  };
  fillerExcipient: {
    sku: string;
    lotNumber: string;
    nominalQtyKg: number;
    compensatedQtyKg: number;
  };
  otherIngredients: Array<{
    sku: string;
    qtyKg: number;
  }>;
  totalBatchWeightKg: number; // Must strictly equal nominal total batch size
  weightVarianceGrams: number; // Must strictly equal 0.00
  compensatedAt: string;
  pharmacistSignature: string;
}

export type JointCostSplitMethod = 'SALES_VALUE_SPLITOFF' | 'PHYSICAL_UNITS' | 'NET_REALIZABLE_VALUE';

export interface JointProductOutput {
  productSku: string;
  productName: string;
  productType: 'MAIN_PRODUCT' | 'CO_PRODUCT' | 'BY_PRODUCT';
  quantityProduced: number;
  unitOfMeasure: string;
  marketPricePerUnitUsd: number;
  separableProcessingCostPerUnitUsd: number;
  allocatedJointCostUsd: number;
  unitCostUsd: number;
}

export interface JointCostSettlementResult {
  settlementId: string;
  tenantId: string;
  companyId: string;
  productionBatchId: string;
  totalJointCostUsd: number;
  splitMethod: JointCostSplitMethod;
  outputs: JointProductOutput[];
  reconciliationDifferenceUsd: number; // Must be 0.00
  settledAt: string;
  financialEvent: {
    eventId: string;
    eventType: 'EVT_BYPRODUCT_SPLITOFF_SETTLED';
    tenantId: string;
    companyId: string;
    batchId: string;
    totalJointCost: number;
    glPostings: Array<{
      accountCode: string;
      accountName: string;
      debit: number;
      credit: number;
    }>;
  };
}

export type AndonSeverity = 'INFO_NOTICE' | 'WARNING_ATTENTION' | 'CRITICAL_STOP';
export type AndonCategory = 'SAFETY_E_STOP' | 'QUALITY_OUT_OF_SPEC' | 'MACHINE_JAM' | 'MATERIAL_SHORTAGE' | 'PROCESS_ANOMALY';
export type AndonStatus = 'OPEN_TRIGGERED' | 'ACKNOWLEDGED' | 'IN_REPAIR' | 'RESOLVED' | 'CLOSED';

export interface AndonIncident {
  id: string;
  tenantId: string;
  companyId: string;
  incidentCode: string; // ANDON-2026-0001
  workCenterId: string;
  workOrderId?: string;
  category: AndonCategory;
  severity: AndonSeverity;
  description: string;
  triggeredBy: string;
  triggeredAt: string;
  lineHaltEnforced: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  responseLeadTimeMinutes?: number;
  resolvedBy?: string;
  resolvedAt?: string;
  totalDowntimeMinutes?: number;
  resolutionNotes?: string;
  status: AndonStatus;
  auditHash: string;
}
