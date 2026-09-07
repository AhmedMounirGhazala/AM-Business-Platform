/**
 * AM Enterprise ERP — Phase 3.2D-02 Domain Types
 * Shop Floor Dispatching, Machine IoT & Quality Inspections (QM/MES)
 * 
 * Subsystems:
 * 1. Shop Floor Dispatching, Shift Schedules & Priority Queues
 * 2. Machine Masters, Real-Time IoT Telemetry & OEE Analytics
 * 3. Quality Inspection Plans, Sampling & Inspection Lots (QM)
 * 4. Defect Management, Non-Conformance Reports (NCR) & CAPA
 * 5. Serial & Lot Genealogy with Cryptographic Traceability
 * 6. Decoupled Financial Events (Scrap / Rework Cost Allocations)
 */

export type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'CUSTOM';

export type OperatorSkill = 
  | 'CNC_OPERATION'
  | 'PRECISION_WELDING'
  | 'SMT_ASSEMBLY'
  | 'ROBOTICS'
  | 'GENERAL_ASSEMBLY'
  | 'QUALITY_INSPECTION'
  | 'MAINTENANCE_TECH';

export interface ShopFloorOperator {
  id: string;
  tenantId: string;
  companyId: string;
  employeeNumber: string;
  name: string;
  active: boolean;
  certifiedSkills: OperatorSkill[];
  currentShift: ShiftType;
  assignedWorkCenterId?: string;
}

export type DispatchPriorityRule = 
  | 'CRITICAL_RATIO'
  | 'EARLIEST_DUE_DATE'
  | 'SHORTEST_PROCESSING_TIME'
  | 'MANUAL_PRIORITY';

export type DispatchStatus = 
  | 'QUEUED'
  | 'DISPATCHED'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'INTERRUPTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ShopFloorDispatchOrder {
  id: string;
  tenantId: string;
  companyId: string;
  dispatchNumber: string; // DISP-2026-00001
  workOrderId: string;
  workOrderNumber: string;
  operationNumber: number;
  routingOperationName: string;
  workCenterId: string;
  workCenterCode: string;
  assignedMachineId?: string;
  assignedOperatorId?: string;
  shift: ShiftType;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  priority: number; // 1 (Highest) to 10 (Lowest)
  status: DispatchStatus;
  targetQuantity: number;
  completedGoodQuantity: number;
  scrappedQuantity: number;
  requiredSkill: OperatorSkill;
  criticalRatio?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeTicket {
  id: string;
  tenantId: string;
  companyId: string;
  ticketNumber: string;
  dispatchOrderId: string;
  workOrderId: string;
  operationNumber: number;
  operatorId: string;
  machineId: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  goodQuantity: number;
  scrapQuantity: number;
  status: 'OPEN' | 'SUBMITTED' | 'APPROVED';
  submittedAt?: string;
  approvedBy?: string;
}

// ==========================================
// MACHINE & IOT INTEGRATION
// ==========================================

export type MachineState = 
  | 'IDLE'
  | 'RUNNING'
  | 'SETUP'
  | 'UNPLANNED_DOWNTIME'
  | 'PLANNED_MAINTENANCE'
  | 'OFFLINE';

export interface MachineMaster {
  id: string;
  tenantId: string;
  companyId: string;
  machineCode: string; // CNC-01, ROBOT-02
  name: string;
  workCenterId: string;
  workCenterCode: string;
  iotDeviceId: string;
  currentState: MachineState;
  nominalCycleTimeSeconds: number;
  nominalSpeedUnitsPerHour: number;
  maxOperatingTemperature: number; // e.g. 85°C
  maxVibrationThreshold: number; // e.g. 7.5 mm/s
  lastTelemetryAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IoTTelemetryPayload {
  machineId: string;
  iotDeviceId: string;
  timestamp: string;
  sensorReadings: {
    temperatureCelsius: number;
    vibrationMmPerSec: number;
    spindleRpm: number;
    powerKw: number;
    pressureBar?: number;
  };
  cycleCounter: number;
  activeErrorCodes: string[];
}

export type DowntimeCategory = 
  | 'MECHANICAL'
  | 'ELECTRICAL'
  | 'TOOLING'
  | 'MATERIAL_STARVATION'
  | 'OPERATOR_ABSENCE'
  | 'SETUP_CHANGE'
  | 'SAFETY_INTERLOCK';

export interface DowntimeEvent {
  id: string;
  tenantId: string;
  companyId: string;
  machineId: string;
  machineCode: string;
  dispatchOrderId?: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  category: DowntimeCategory;
  reasonCode: string;
  description: string;
  resolvedBy?: string;
  status: 'ACTIVE' | 'RESOLVED';
}

export interface OEEMetrics {
  machineId: string;
  machineCode: string;
  periodStart: string;
  periodEnd: string;
  plannedProductionTimeMinutes: number;
  operatingTimeMinutes: number;
  unplannedDowntimeMinutes: number;
  idealCycleTimeSeconds: number;
  totalUnitsProduced: number;
  goodUnitsProduced: number;
  defectiveUnitsProduced: number;
  availabilityRate: number; // 0.0 - 1.0
  performanceRate: number; // 0.0 - 1.0
  qualityRate: number; // 0.0 - 1.0
  oeePercent: number; // 0 - 100%
  worldClassCompliant: boolean; // OEE >= 85%
}

// ==========================================
// QUALITY MANAGEMENT & INSPECTIONS
// ==========================================

export type InspectionType = 'INCOMING_GOODS' | 'IN_PROCESS' | 'FINAL_INSPECTION';
export type CharacteristicType = 'QUANTITATIVE' | 'QUALITATIVE';
export type SamplingRule = 'FIXED' | 'PERCENTAGE' | 'ISO_2859_NORMAL';

export interface InspectionCharacteristic {
  characteristicId: string;
  name: string;
  type: CharacteristicType;
  targetValue?: number;
  upperTolerance?: number;
  lowerTolerance?: number;
  uom?: string;
  acceptableQualitativeValues?: string[];
  isCritical: boolean;
}

export interface InspectionPlan {
  id: string;
  tenantId: string;
  companyId: string;
  planNumber: string; // IP-FG-001
  itemSku: string;
  inspectionType: InspectionType;
  characteristics: InspectionCharacteristic[];
  samplingRule: SamplingRule;
  sampleRateOrSize: number; // e.g. 5 units or 10%
  version: number;
  active: boolean;
  createdAt: string;
}

export interface SampleMeasurement {
  sampleNumber: number;
  characteristicId: string;
  numericValue?: number;
  qualitativeValue?: string;
  pass: boolean;
  remarks?: string;
}

export type UsageDecision = 
  | 'APPROVED'
  | 'REJECTED'
  | 'ACCEPTED_WITH_CONCESSION'
  | 'REWORK_REQUIRED'
  | 'SCRAPPED';

export type InspectionLotStatus = 
  | 'CREATED'
  | 'RECORDING_IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface InspectionLot {
  id: string;
  tenantId: string;
  companyId: string;
  lotNumber: string; // IL-2026-00001
  inspectionType: InspectionType;
  itemSku: string;
  itemName: string;
  lotSize: number;
  sampleSize: number;
  sourceDocumentType: 'GOODS_RECEIPT' | 'WORK_ORDER' | 'FINISHED_GOODS';
  sourceDocumentId: string;
  sourceDocumentNumber: string;
  operationNumber?: number;
  planId: string;
  status: InspectionLotStatus;
  measurements: SampleMeasurement[];
  usageDecision?: UsageDecision;
  usageDecisionBy?: string;
  usageDecisionAt?: string;
  usageDecisionNotes?: string;
  cryptographicSeal?: string;
  createdAt: string;
  createdBy: string;
}

// ==========================================
// DEFECTS, NCR & CAPA
// ==========================================

export type DefectSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export type DefectType = 
  | 'DIMENSIONAL_OUT_OF_TOLERANCE'
  | 'MATERIAL_DEFECT'
  | 'SURFACE_FINISH'
  | 'CONTAMINATION'
  | 'ASSEMBLY_ERROR'
  | 'ELECTRICAL_FAILURE'
  | 'PACKAGING';

export type NCRStatus = 
  | 'OPEN'
  | 'INVESTIGATING'
  | 'DISPOSITIONED'
  | 'CAPA_PENDING'
  | 'CLOSED';

export type NCRDisposition = 
  | 'SCRAP'
  | 'RETURN_TO_VENDOR'
  | 'REWORK'
  | 'USE_AS_IS';

export interface NonConformanceReport {
  id: string;
  tenantId: string;
  companyId: string;
  ncrNumber: string; // NCR-2026-00001
  inspectionLotId?: string;
  workOrderId?: string;
  sourceDocNumber: string;
  itemSku: string;
  itemName: string;
  defectQuantity: number;
  uom: string;
  severity: DefectSeverity;
  defectType: DefectType;
  defectDescription: string;
  quarantineLocationId?: string;
  isQuarantined: boolean;
  status: NCRStatus;
  disposition?: NCRDisposition;
  dispositionNotes?: string;
  dispositionBy?: string;
  dispositionAt?: string;
  estimatedScrapOrReworkCost: number;
  financialEventId?: string;
  capaId?: string;
  createdAt: string;
  createdBy: string;
  integrityHash?: string;
}

export type CAPAStatus = 'OPEN' | 'ACTION_IN_PROGRESS' | 'VERIFICATION' | 'CLOSED';
export type CAPARootCauseCategory = 'PROCESS' | 'MACHINE' | 'MANPOWER' | 'MATERIAL' | 'ENVIRONMENT';

export interface CorrectivePreventiveAction {
  id: string;
  tenantId: string;
  companyId: string;
  capaNumber: string; // CAPA-2026-00001
  ncrId: string;
  ncrNumber: string;
  rootCauseCategory: CAPARootCauseCategory;
  fiveWhysAnalysis: string[];
  rootCauseStatement: string;
  correctiveActionDescription: string;
  preventiveActionDescription: string;
  assignedOwnerId: string;
  targetCompletionDate: string;
  actualCompletionDate?: string;
  effectivenessVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  status: CAPAStatus;
  createdAt: string;
  createdBy: string;
}

// ==========================================
// TRACEABILITY & GENEALOGY
// ==========================================

export interface SerialComponentTrace {
  componentSku: string;
  componentName: string;
  componentLotNumber: string;
  componentSerialNumber?: string;
  supplierPoNumber?: string;
  quantityConsumed: number;
  uom: string;
}

export interface SerialGenealogyRecord {
  finishedGoodSerial: string;
  finishedGoodSku: string;
  finishedGoodName: string;
  workOrderId: string;
  workOrderNumber: string;
  productionDate: string;
  machineId: string;
  operatorId: string;
  consumedComponents: SerialComponentTrace[];
  qualityInspectionLotId: string;
  usageDecision: UsageDecision;
  cryptographicHash: string;
}

export interface TraceabilityResult {
  queryType: 'FORWARD' | 'BACKWARD';
  targetIdentifier: string;
  rootItem: string;
  found: boolean;
  traceChain: any[];
  affectedWorkOrders: string[];
  affectedFinishedGoodSerials: string[];
  affectedCustomerDeliveries: string[];
  verificationTimestamp: string;
}
