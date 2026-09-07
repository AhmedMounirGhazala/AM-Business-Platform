/**
 * AM Enterprise ERP — Phase 3.2D-04 Domain Types
 * Process Manufacturing (PP-PI), Advanced Finite Capacity Scheduling (APS),
 * Subcontracting / Outside Processing & Electronic Kanban Execution
 */

export interface FinancialEventPayload {
  eventId: string;
  eventType: string;
  tenantId: string;
  companyId: string;
  sourceModule: string;
  sourceEntityId: string;
  eventTimestamp: string;
  payload: Record<string, any>;
}

// ============================================================================
// 1. PROCESS MANUFACTURING & MASTER RECIPES (PP-PI)
// ============================================================================

export type RecipeStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'OBSOLETE';

export interface RecipePhaseOperation {
  phaseNumber: number;
  phaseName: string;
  workCenterId: string;
  standardDurationHours: number;
  temperatureCelsius?: number;
  pressureBar?: number;
  mixingSpeedRpm?: number;
  phTarget?: number;
  instructions: string;
}

export interface RecipeIngredient {
  itemSku: string;
  description: string;
  standardQuantity: number;
  unitOfMeasure: string;
  isPotencyAdjustable?: boolean;
  basePotencyPercent?: number; // default 100%
  isFiller?: boolean; // automatically absorbs variance when potency shifts active ingredient qty
  scrapPercentage?: number;
}

export interface CoProductDefinition {
  itemSku: string;
  description: string;
  plannedYieldQuantity: number;
  unitOfMeasure: string;
  costApportionmentPercent: number; // Sum of main product + co-products = 100%
}

export interface ByProductDefinition {
  itemSku: string;
  description: string;
  plannedYieldQuantity: number;
  unitOfMeasure: string;
  estimatedNetRealizableCreditUnit: number; // Value credited to reduce main batch cost
}

export interface MasterRecipe {
  id: string;
  tenantId: string;
  companyId: string;
  recipeCode: string;
  productSku: string;
  productName: string;
  version: number;
  status: RecipeStatus;
  baseQuantity: number;
  unitOfMeasure: string;
  phases: RecipePhaseOperation[];
  ingredients: RecipeIngredient[];
  coProducts: CoProductDefinition[];
  byProducts: ByProductDefinition[];
  validFrom: string;
  validTo?: string;
  densityGPerMl?: number;
  createdBy: string;
  approvedBy?: string;
  approvalDate?: string;
  sha256Seal: string;
}

// Batch Master & Lifecycle Management
export type BatchStatus = 'QUARANTINE' | 'UNRESTRICTED' | 'RESTRICTED' | 'RETEST_REQUIRED' | 'BLOCKED' | 'SCRAPPED';

export interface BatchMaster {
  id: string;
  tenantId: string;
  companyId: string;
  batchNumber: string;
  itemSku: string;
  manufacturingDate: string;
  expirationDate: string; // SLED
  retestDate?: string;
  actualPotencyPercent: number; // e.g. 98.5%
  status: BatchStatus;
  warehouseId: string;
  quantityOnHand: number;
  unitOfMeasure: string;
  storageConditionNotes?: string;
  certificateOfAnalysisId?: string;
  inspectedBy?: string;
  statusChangeHistory: {
    previousStatus: BatchStatus;
    newStatus: BatchStatus;
    changedBy: string;
    reason: string;
    timestamp: string;
  }[];
}

// Process Order Lifecycle
export type ProcessOrderStatus = 'CREATED' | 'RELEASED' | 'DISPENSED' | 'IN_PROCESS' | 'BULK_COMPLETE' | 'PACKAGED' | 'CLOSED';

export interface DispensedIngredientLine {
  itemSku: string;
  batchNumber: string;
  standardQuantity: number;
  actualDispensedQuantity: number;
  unitOfMeasure: string;
  dispensedBy: string;
  dispensedAt: string;
  potencyFactorApplied: number;
}

export interface PhaseExecutionLog {
  phaseNumber: number;
  workCenterId: string;
  actualStartTime: string;
  actualEndTime?: string;
  actualDurationHours: number;
  recordedTemperature?: number;
  recordedPh?: number;
  operatorId: string;
  notes?: string;
}

export interface ProcessOrder {
  id: string;
  tenantId: string;
  companyId: string;
  orderNumber: string;
  recipeId: string;
  recipeCode: string;
  productSku: string;
  plannedBatchQuantity: number;
  actualYieldQuantity: number;
  unitOfMeasure: string;
  assignedBatchNumber: string;
  status: ProcessOrderStatus;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  dispensedIngredients: DispensedIngredientLine[];
  phaseLogs: PhaseExecutionLog[];
  coProductYields: { itemSku: string; batchNumber: string; quantity: number }[];
  byProductYields: { itemSku: string; batchNumber: string; quantity: number }[];
  totalActualCost: number;
  totalByProductCredit: number;
  netBatchCost: number;
  createdBy: string;
  releasedBy?: string;
  completedBy?: string;
  closedBy?: string;
}

// ============================================================================
// 2. ADVANCED PLANNING & FINITE CAPACITY SCHEDULING (APS / CRP)
// ============================================================================

export interface CapacityShiftProfile {
  shiftCode: string;
  shiftsPerDay: number;
  hoursPerShift: number;
  workersPerShift: number;
  machineEfficiencyPercent: number; // e.g. 90%
  utilizationTargetPercent: number; // e.g. 85%
}

export interface WorkCenterCapacityProfile {
  workCenterId: string;
  workCenterCode: string;
  name: string;
  shiftProfile: CapacityShiftProfile;
  dailyAvailableHours: number; // shiftsPerDay * hoursPerShift * (efficiency / 100) * (utilization / 100)
  queueTimeHours: number;
  moveWaitTimeHours: number;
}

export interface ScheduledOperationLoad {
  orderId: string;
  orderNumber: string;
  operationNumber: number;
  scheduledStart: string; // ISO datetime
  scheduledEnd: string;   // ISO datetime
  setupHours: number;
  runHours: number;
  totalCapacityHours: number;
  sequenceRank?: number;
}

export interface CapacityBucketAnalysis {
  workCenterId: string;
  bucketDate: string; // YYYY-MM-DD
  availableCapacityHours: number;
  loadedCapacityHours: number;
  loadPercent: number;
  isOverloaded: boolean;
  isBottleneck: boolean;
  scheduledOperations: ScheduledOperationLoad[];
}

export interface FiniteScheduleRunResult {
  scheduleRunId: string;
  runDate: string;
  algorithm: 'FORWARD' | 'BACKWARD' | 'SETUP_OPTIMIZED';
  totalOrdersScheduled: number;
  totalOperationsScheduled: number;
  bottlenecksIdentified: string[];
  buckets: CapacityBucketAnalysis[];
  executionTimeMs: number;
}

export interface SetupChangeoverMatrixRule {
  fromFamily: string;
  toFamily: string;
  changeoverSetupHours: number;
  requiresWashdown: boolean;
}

// ============================================================================
// 3. SUBCONTRACTING & OUTSIDE PROCESSING (TOLL MANUFACTURING)
// ============================================================================

export type SubcontractOrderStatus = 'DRAFT' | 'APPROVED' | 'STOCK_ISSUED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CLOSED';

export interface SubcontractProvidedComponent {
  componentSku: string;
  description: string;
  requiredQuantity: number;
  issuedQuantity: number; // Transferred to Special Stock "O"
  consumedQuantity: number;
  scrapQuantity: number;
  unitCost: number;
  unitOfMeasure: string;
}

export interface SubcontractOrder {
  id: string;
  tenantId: string;
  companyId: string;
  subcontractOrderNumber: string;
  vendorId: string;
  vendorName: string;
  finishedItemSku: string;
  finishedItemDescription: string;
  orderQuantity: number;
  receivedQuantity: number;
  serviceRatePerUnit: number;
  totalServiceCost: number;
  unitOfMeasure: string;
  deliveryDueDate: string;
  status: SubcontractOrderStatus;
  sourceWorkOrderId?: string;
  plantWarehouseId: string;
  vendorSpecialStockWarehouseId: string; // Virtual warehouse for Special Stock "O"
  providedComponents: SubcontractProvidedComponent[];
  issuedAt?: string;
  issuedBy?: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export interface SubcontractReceiptResult {
  subcontractOrderId: string;
  receiptNumber: string;
  receivedQuantity: number;
  componentsConsumed: { componentSku: string; quantityConsumed: number; totalCost: number }[];
  totalComponentCostConsumed: number;
  totalServiceCharge: number;
  totalFinishedValuation: number; // Component cost + service fee
  finishedUnitCost: number;
  financialEvent: FinancialEventPayload;
}

// ============================================================================
// 4. REPETITIVE MANUFACTURING & ELECTRONIC KANBAN EXECUTION (REM)
// ============================================================================

export interface ProductionLine {
  id: string;
  tenantId: string;
  companyId: string;
  lineCode: string;
  lineName: string;
  taktTimeSeconds: number; // e.g. 60 sec per unit
  designHourlyRate: number; // 3600 / taktTimeSeconds
  activeWorkCenters: string[];
  currentShift: string;
  isOperational: boolean;
}

export type KanbanSourceType = 'IN_HOUSE' | 'EXTERNAL_VENDOR' | 'STOCK_TRANSFER';
export type KanbanContainerStatus = 'FULL' | 'EMPTY' | 'IN_PROCESS' | 'IN_TRANSIT';

export interface KanbanContainer {
  containerId: string;
  binNumber: number;
  status: KanbanContainerStatus;
  lastStatusChange: string;
  currentReplenishmentOrderRef?: string;
}

export interface KanbanControlCycle {
  id: string;
  tenantId: string;
  companyId: string;
  controlCycleCode: string;
  materialSku: string;
  materialName: string;
  supplyArea: string; // Storage bin or line-side stock location
  sourceType: KanbanSourceType;
  sourceLocation: string; // e.g., Central Warehouse or Supplier ID
  containerQuantity: number; // Units per kanban bin
  numberOfContainers: number;
  containers: KanbanContainer[];
  productionLineId?: string;
  isActive: boolean;
  createdBy: string;
}

export interface KanbanBackflushResult {
  controlCycleId: string;
  containerId: string;
  materialSku: string;
  quantity: number;
  backflushedAt: string;
  componentsDeducted: { itemSku: string; quantity: number }[];
  financialEvent: FinancialEventPayload;
}
