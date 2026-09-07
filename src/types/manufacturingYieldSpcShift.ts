/**
 * AM Enterprise ERP — Phase 3.2D-08 Domain Types
 * Manufacturing Yield Optimization, Digital Shift Handover Governance,
 * Statistical Process Control (SPC / Six Sigma / Cpk) & Scrap Recovery
 */

// =========================================================================
// 1. STATISTICAL PROCESS CONTROL (SPC) & SIX SIGMA TYPES
// =========================================================================

export type SpcChartType = 'X_BAR_R' | 'X_BAR_S' | 'INDIVIDUAL_MOVING_RANGE' | 'P_CHART' | 'C_CHART';
export type SpcCapabilityRating = 'WORLD_CLASS' | 'CAPABLE' | 'MARGINALLY_CAPABLE' | 'INCAPABLE';

export interface SpcSubgroup {
  subgroupId: string;
  timestamp: string;
  sampleValues: number[];
  mean: number;
  range: number;
  stdDev: number;
  operatorId: string;
}

export interface SpcControlLimits {
  centerLine: number; // Mean of Means (X-double-bar)
  ucl: number;        // Upper Control Limit
  lcl: number;        // Lower Control Limit
  rangeCenterLine: number; // Mean Range (R-bar)
  rangeUcl: number;
  rangeLcl: number;
  sigmaEstimate: number;
}

export interface SpcProcessCapability {
  usl: number; // Upper Specification Limit
  lsl: number; // Lower Specification Limit
  nominalTarget?: number;
  cp: number;   // Process Potential
  cpk: number;  // Process Capability Index
  pp?: number;  // Process Performance
  ppk?: number; // Process Performance Index
  rating: SpcCapabilityRating;
  isCapable: boolean; // cpk >= 1.33
  defectPpmEstimated: number;
}

export type SpcRuleSet = 'WESTERN_ELECTRIC' | 'NELSON' | 'HYBRID_STANDARD';

export interface SpcRuleViolation {
  subgroupId: string;
  ruleId: 'RULE_1_BEYOND_3_SIGMA' | 'RULE_2_NINE_SAME_SIDE' | 'RULE_3_SIX_TRENDING' | 'RULE_4_FOURTEEN_ALTERNATING' | 'WECO_RULE_2_ZONE_A' | 'WECO_RULE_3_ZONE_B';
  ruleSet?: SpcRuleSet;
  ruleName?: string;
  ruleProvenance?: string;
  ruleDescription: string;
  severity: 'WARNING' | 'CRITICAL_OUT_OF_CONTROL';
  triggerValue: number;
  timestamp: string;
}

export interface SpcStudy {
  id: string;
  tenantId: string;
  companyId: string;
  studyCode: string;
  workCenterId: string;
  productSku: string;
  parameterName: string; // e.g. "Shaft Outer Diameter (mm)"
  unitOfMeasure: string;
  chartType: SpcChartType;
  usl: number;
  lsl: number;
  nominalTarget?: number;
  subgroups: SpcSubgroup[];
  controlLimits: SpcControlLimits;
  capability?: SpcProcessCapability;
  violations: SpcRuleViolation[];
  quarantineTriggered: boolean;
  createdAt: string;
  updatedAt: string;
  auditHash: string;
}

// =========================================================================
// 2. DIGITAL SHIFT HANDOVER & WIP CUSTODY TYPES
// =========================================================================

export type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT';
export type ShiftHandoverStatus = 'INITIATED' | 'OUTGOING_SIGNED' | 'COMPLETED' | 'REJECTED_DISCREPANCY';

export interface ShiftWipSnapshotItem {
  itemSku: string;
  lotNumber: string;
  workCenterId: string;
  theoreticalSystemQty: number;
  physicalCountedQty: number;
  varianceQty: number;
  variancePct: number;
  discrepancyFlag: boolean;
  notes?: string;
}

export interface ShiftSafetyLotoCheck {
  itemCode: string;
  description: string;
  verified: boolean;
  comments?: string;
}

export interface ShiftSupervisorSignature {
  supervisorId: string;
  supervisorName: string;
  role: string;
  signedAt: string;
  signatureToken: string;
}

export interface DigitalShiftHandover {
  id: string;
  tenantId: string;
  companyId: string;
  handoverCode: string;
  productionLineId: string;
  shiftDate: string;
  shiftType: ShiftType;
  outgoingSupervisorId: string;
  incomingSupervisorId: string;
  status: ShiftHandoverStatus;
  safetyCleanPassed: boolean;
  safetyChecklist: ShiftSafetyLotoCheck[];
  wipItems: ShiftWipSnapshotItem[];
  openAndonIncidentsCount: number;
  openMaintenanceOrdersCount: number;
  outgoingSignature?: ShiftSupervisorSignature;
  incomingSignature?: ShiftSupervisorSignature;
  rejectionReason?: string;
  createdAt: string;
  completedAt?: string;
  auditHash: string;
}

// =========================================================================
// 3. PRODUCTION YIELD & SCRAP RECOVERY TYPES
// =========================================================================

export interface ProductionYieldAnalysis {
  manufacturingOrderId: string;
  productSku: string;
  plannedOutputQty: number;
  actualGoodQty: number;
  actualScrapQty: number;
  actualReworkQty: number;
  standardScrapAllowancePct: number; // e.g. 3% standard allowance
  actualScrapPct: number;
  standardAllowedScrapQty: number;
  scrapVarianceQty: number; // actualScrap - standardAllowedScrap
  isFavorableVariance: boolean;
  yieldEfficiencyPct: number; // (actualGood / plannedOutput) * 100
  materialCostPerUnit: number;
  materialYieldVarianceCost: number; // scrapVarianceQty * materialCostPerUnit
}

export interface ScrapRecoveryHarvest {
  id: string;
  tenantId: string;
  companyId: string;
  manufacturingOrderId: string;
  recoveredMaterialSku: string; // e.g. "REGRIND-RESIN-HDPE"
  quantityRecoveredKg: number;
  recoveryGrade: 'GRADE_PREMIUM_REGRIND' | 'GRADE_STANDARD_REGRIND' | 'GRADE_DOWNGRADED_FEEDSTOCK';
  unitCreditRate: number; // $/kg credit
  totalRecoveryValue: number;
  targetWarehouseId: string;
  targetBinId: string;
  lotNumber: string;
  harvestedAt: string;
  operatorId: string;
  auditHash: string;
}

export interface YieldFinancialEvent {
  eventId: string;
  eventType: 'EVT_MFG_YIELD_VARIANCE_RECOGNIZED' | 'EVT_MFG_SCRAP_RECOVERY_POSTED';
  tenantId: string;
  companyId: string;
  manufacturingOrderId: string;
  productSku: string;
  amount: number;
  isFavorable?: boolean;
  timestamp: string;
  glPostings: Array<{
    accountCode: string;
    accountName: string;
    debitAmount: number;
    creditAmount: number;
  }>;
}

// =========================================================================
// 4. DYNAMIC LINE BALANCING & HEIJUNKA TYPES
// =========================================================================

export interface WorkCenterCycleTime {
  workCenterId: string;
  operationName: string;
  cycleTimeSeconds: number;
  standardCycleTimeSeconds: number;
  headcount: number;
}

export interface LineBalanceMetrics {
  productionLineId: string;
  taktTimeSeconds: number;
  stationCount: number;
  totalCycleTimeSeconds: number;
  bottleneckStationId: string;
  bottleneckCycleTimeSeconds: number;
  lineBalanceEfficiencyPct: number; // (sum(cycleTimes) / (stations * bottleneck)) * 100
  balanceDelayPct: number;          // 100 - efficiency
  smoothnessIndex: number;          // sqrt(sum((bottleneck - stationTime)^2))
  theoreticalMinWorkstations: number; // ceil(totalCycleTime / taktTime)
  bottleneckStarvationAlert: boolean;
  recommendedBuffers: Array<{
    betweenWorkCenterA: string;
    betweenWorkCenterB: string;
    bufferUnitsNeeded: number;
  }>;
}

export interface HeijunkaBoxSlot {
  timeSlot: string; // e.g. "08:00 - 08:20"
  sequenceNumber: number;
  productSku: string;
  batchQty: number;
  kanbanCardId: string;
}

export interface HeijunkaSchedule {
  productionLineId: string;
  scheduleDate: string;
  pitchMinutes: number; // e.g. 20 minutes pitch
  dailyTotalUnits: number;
  productMixRatio: Record<string, number>; // e.g. { 'SKU-A': 60, 'SKU-B': 30, 'SKU-C': 10 }
  slots: HeijunkaBoxSlot[];
  generatedAt: string;
}

// =========================================================================
// 5. DOMAIN AUDIT & QUALITY GATE TYPES
// =========================================================================

export interface Phase32D08AuditRecord {
  id: string;
  tenantId: string;
  companyId: string;
  entityType: 'SPC_STUDY' | 'SHIFT_HANDOVER' | 'YIELD_ANALYSIS' | 'SCRAP_RECOVERY' | 'LINE_BALANCE';
  entityId: string;
  action: string;
  performedBy: string;
  timestamp: string;
  previousHash: string;
  currentHash: string;
  payloadHash: string;
  details: Record<string, any>;
}
