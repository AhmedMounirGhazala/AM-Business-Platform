/**
 * AM Enterprise ERP — Phase 3.2D-06 Types & Domain Contracts
 * Advanced Manufacturing Intelligence, Tooling/Die Life Management,
 * Electronic Batch Records (eBR), Line Clearance, and OEE Loss Tree Analysis
 */

export type ToolStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE_REQUIRED' | 'LOCKED_EXPIRED' | 'SCRAPPED';

export type ToolType = 'DIE_STAMPING' | 'INJECTION_MOLD' | 'CUTTING_TOOL' | 'WELDING_FIXTURE' | 'CALIBRATION_JIG';

export interface ToolMaster {
  id: string;
  tenantId: string;
  companyId: string;
  toolCode: string;
  toolName: string;
  toolType: ToolType;
  serialNumber: string;
  workCenterId: string;
  nominalLifeCycles: number;
  currentLifeCycles: number;
  maxLifeCycles: number; // Hard stop limit
  warningThresholdCycles: number;
  calibrationIntervalDays: number;
  lastCalibratedAt: string;
  nextCalibrationDue: string;
  status: ToolStatus;
  hourlyWearRateUsd: number;
  costPerCycleUsd: number;
  createdAt: string;
  updatedAt: string;
  sha256Seal: string;
}

export interface ToolUsageRecord {
  id: string;
  toolId: string;
  workOrderId: string;
  operationSeq: number;
  cyclesRecorded: number;
  accumulatedCyclesBefore: number;
  accumulatedCyclesAfter: number;
  amortizedCostUsd: number;
  recordedBy: string;
  timestamp: string;
  statusAfter: ToolStatus;
  sha256Seal: string;
}

export interface LineClearanceChecklist {
  id: string;
  tenantId: string;
  companyId: string;
  workCenterId: string;
  workOrderId: string;
  priorLotNumber: string;
  targetLotNumber: string;
  equipmentCleanedAndSanitized: boolean;
  priorMaterialsRemoved: boolean;
  wasteBinsEmptied: boolean;
  correctLabelsAndPackagingVerified: boolean;
  calibrationValidForGauges: boolean;
  safetyGuardsInPlace: boolean;
  clearedByOperator: string;
  verifiedByQAInspector: string;
  clearedAt: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  sha256Seal: string;
}

export interface CriticalProcessParameter {
  parameterName: string;
  targetValue: number;
  actualValue: number;
  unit: string;
  lowerTolerance: number;
  upperTolerance: number;
  withinTolerance: boolean;
}

export interface ElectronicBatchRecord {
  id: string;
  tenantId: string;
  companyId: string;
  batchNumber: string;
  workOrderId: string;
  productSku: string;
  lineClearanceId: string;
  ingredientsAdded: Array<{
    itemSku: string;
    lotNumber: string;
    plannedQuantity: number;
    actualQuantity: number;
    unitOfMeasure: string;
    weighedBy: string;
    verifiedBy: string;
    timestamp: string;
  }>;
  parameters: CriticalProcessParameter[];
  environmentalSensors: {
    ambientTemperatureC: number;
    relativeHumidityPct: number;
    cleanroomPressurePa: number;
    recordedAt: string;
  };
  inProcessDeviations: string[]; // Deviation permit IDs if any
  dualSignatures: {
    productionLeadSignature: string;
    productionLeadSignedAt: string;
    qualityAssuranceSignature: string;
    qualityAssuranceSignedAt: string;
  } | null;
  status: 'IN_PROCESS' | 'PENDING_QA_RELEASE' | 'RELEASED' | 'QUARANTINED';
  sha256AuditSeal: string;
}

export type OEELossCategory =
  | 'EQUIPMENT_BREAKDOWN'
  | 'SETUP_CHANGEOVER'
  | 'IDLING_MINOR_STOPS'
  | 'REDUCED_SPEED'
  | 'PROCESS_DEFECTS'
  | 'STARTUP_REDUCED_YIELD';

export interface OEELossRecord {
  category: OEELossCategory;
  durationMinutes: number;
  lostUnitsEquivalent: number;
  reason: string;
  impactScore: number; // 0 - 100
}

export interface OEELossTreeAnalysis {
  tenantId: string;
  companyId: string;
  workCenterId: string;
  periodStart: string;
  periodEnd: string;
  plannedProductionTimeMinutes: number;
  operatingTimeMinutes: number;
  netOperatingTimeMinutes: number;
  valuableOperatingTimeMinutes: number;
  idealCycleTimeSeconds: number;
  totalPiecesProduced: number;
  goodPiecesProduced: number;
  scrapPiecesProduced: number;
  // OEE Factors (0.00 - 1.00)
  availabilityRate: number;
  performanceRate: number;
  qualityRate: number;
  overallEquipmentEffectiveness: number; // A * P * Q
  // Six Big Losses Breakdown
  losses: OEELossRecord[];
  meanTimeBetweenFailuresHours: number; // MTBF
  meanTimeToRepairMinutes: number; // MTTR
  sha256Seal: string;
}

export interface ShiftHandoverLogbook {
  id: string;
  tenantId: string;
  companyId: string;
  shiftId: string; // e.g. "SHIFT-MORNING-20260903"
  workCenterId: string;
  outgoingSupervisor: string;
  incomingSupervisor: string;
  shiftStartTime: string;
  shiftEndTime: string;
  totalOutputUnits: number;
  scrapUnits: number;
  unresolvedAnomalies: Array<{
    alertId: string;
    severity: 'LOW' | 'MEDIUM' | 'CRITICAL';
    description: string;
    actionPending: string;
  }>;
  wipItemsInCell: Array<{
    workOrderId: string;
    stage: string;
    quantity: number;
  }>;
  safetyIncidentsCount: number;
  handoverNotes: string;
  isSignedOffByBoth: boolean;
  signedOffAt?: string;
  sha256Seal: string;
}
