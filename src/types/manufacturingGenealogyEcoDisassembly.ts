/**
 * AM Enterprise ERP — Phase 3.2D-09 Domain Types
 * Co-Products & By-Products Cost Allocation, Multi-Level Batch Genealogy & Serialization Traceability,
 * Engineering Change Orders (ECO) with BOM Redlining, and Disassembly / De-Manufacturing Workflows.
 */

// =========================================================================
// 1. CO-PRODUCTS & BY-PRODUCTS COST ALLOCATION
// =========================================================================

export type JointCostAllocationMethod = 'EQUIVALENCE_NUMBERS' | 'NET_REALIZABLE_VALUE' | 'PHYSICAL_QUANTITY';

export interface CoProductOutputItem {
  itemSku: string;
  productName: string;
  isPrimary: boolean;
  producedQty: number;
  unitOfMeasure: string;
  equivalenceFactor: number; // e.g. 1.0 for primary, 0.6 for co-product A
  plannedSalesPricePerUnit?: number; // for NRV method
  allocatedJointCost: number;
  unitManufacturingCost: number;
  glAccountDestination: string; // e.g. '13100-FINISHED-GOODS'
}

export interface ByProductOutputItem {
  itemSku: string;
  productName: string;
  producedQty: number;
  unitOfMeasure: string;
  standardCreditRatePerUnit: number;
  totalCreditValue: number;
  glAccountDestination: string; // e.g. '13200-BY-PRODUCTS-INV'
}

export interface JointProductionCostAnalysis {
  id: string;
  tenantId: string;
  companyId: string;
  manufacturingOrderId: string;
  calculationDate: string;
  totalOrderCostGross: number;
  byProductCreditTotal: number;
  netJointCostToAllocate: number;
  allocationMethod: JointCostAllocationMethod;
  coProducts: CoProductOutputItem[];
  byProducts: ByProductOutputItem[];
  currency: string;
  auditHash: string;
}

// =========================================================================
// 2. MULTI-LEVEL BATCH GENEALOGY & SERIALIZATION AS-BUILT TREE
// =========================================================================

export type GenealogyNodeType = 'RAW_MATERIAL' | 'SUBASSEMBLY' | 'FINISHED_GOOD';
export type GenealogyQuarantineStatus = 'CLEARED' | 'QUARANTINE_HOLD' | 'REJECTED';

export interface QualityTelemetrySnapshot {
  inspectionId?: string;
  torqueNewtonMeters?: number;
  dimensionMm?: number;
  purityPct?: number;
  passedInspection: boolean;
}

export interface BatchGenealogyNode {
  nodeId: string;
  tenantId: string;
  companyId: string;
  lotOrSerialNumber: string;
  itemSku: string;
  itemDescription: string;
  nodeType: GenealogyNodeType;
  parentLotNumber?: string; // Upstream parent
  childLotNumbers: string[]; // Downstream children used
  workCenterId: string;
  manufacturingOrderId?: string;
  supplierLotNumber?: string;
  operatorId: string;
  timestamp: string;
  quarantineStatus: GenealogyQuarantineStatus;
  quarantineReason?: string;
  telemetry?: QualityTelemetrySnapshot;
  auditHash: string;
}

export interface BatchTraceResult {
  rootLotNumber: string;
  direction: 'UPSTREAM_WHERE_USED' | 'DOWNSTREAM_IMPACT';
  traversedNodes: BatchGenealogyNode[];
  impactedFinishedGoodsLots: string[];
  impactedSubassemblies: string[];
  totalNodesCount: number;
  containsQuarantinedItems: boolean;
}

// =========================================================================
// 3. ENGINEERING CHANGE ORDERS (ECO) & BOM REDLINING
// =========================================================================

export type EcoStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'CCB_REVIEW'
  | 'APPROVED'
  | 'EFFECTIVE'
  | 'REJECTED'
  | 'SUPERSEDED';

export type EcoDispositionAction = 
  | 'USE_AS_IS_UNTIL_EXHAUSTED'
  | 'REWORK_TO_NEW_REVISION'
  | 'SCRAP_IMMEDIATELY'
  | 'RETURN_TO_SUPPLIER';

export type BomRedlineChangeType = 'COMPONENT_ADDED' | 'COMPONENT_REMOVED' | 'QUANTITY_MODIFIED' | 'SUBSTITUTE_SPECIFIED';

export interface BomRedlineItem {
  changeType: BomRedlineChangeType;
  componentSku: string;
  componentDescription: string;
  previousQty: number;
  newQty: number;
  unitOfMeasure: string;
  findNumber: string;
  dispositionAction: EcoDispositionAction;
  estimatedReworkScrapCost: number;
}

export interface EcoApprovalSignature {
  approverId: string;
  approverName: string;
  role: 'CCB_CHAIR' | 'CHIEF_ENGINEER' | 'OPERATIONS_DIRECTOR' | 'QUALITY_HEAD';
  decision: 'APPROVED' | 'REJECTED';
  signatureToken: string;
  timestamp: string;
  comments?: string;
}

export interface EngineeringChangeOrder {
  id: string;
  tenantId: string;
  companyId: string;
  ecoCode: string; // e.g. "ECO-2026-BOM-0042"
  title: string;
  description: string;
  originatorId: string;
  targetProductSku: string;
  currentBomRevision: string;
  proposedBomRevision: string;
  status: EcoStatus;
  effectivityType: 'EFFECTIVE_DATE' | 'SERIAL_CUTOFF_NUMBER';
  effectiveDate?: string;
  effectiveCutoffSerialOrLot?: string;
  redlineItems: BomRedlineItem[];
  approvals: EcoApprovalSignature[];
  createdAt: string;
  updatedAt: string;
  auditHash: string;
}

// =========================================================================
// 4. DISASSEMBLY / DE-MANUFACTURING & COMPONENT HARVESTING
// =========================================================================

export type DisassemblyOrderStatus = 
  | 'PLANNED'
  | 'IN_TEARDOWN'
  | 'INSPECTION_GRADING'
  | 'COMPLETED'
  | 'CANCELLED';

export type HarvestedComponentGrade = 
  | 'GRADE_A_REUSABLE'      // Directly return to active inventory at standard value
  | 'GRADE_B_REFURB_NEEDED' // Send to secondary refurbishment routing
  | 'GRADE_C_SCRAP_SALVAGE' // Salvage at scrap credit
  | 'UNSALVAGEABLE_WASTE';  // Write-off disposal

export interface HarvestedComponent {
  componentSku: string;
  componentName: string;
  harvestedQty: number;
  unitOfMeasure: string;
  conditionGrade: HarvestedComponentGrade;
  assignedConditionLot: string;
  allocatedResidualCost: number;
  targetWarehouseId: string;
  targetBinId: string;
  glAccountCreditOrDebit: string;
}

export interface DisassemblyOrder {
  id: string;
  tenantId: string;
  companyId: string;
  disassemblyCode: string; // e.g. "DIS-2026-904"
  sourceItemSku: string;
  sourceSerialOrLot: string;
  sourceUnitBookValue: number;
  workCenterId: string;
  operatorId: string;
  status: DisassemblyOrderStatus;
  teardownHoursLabor: number;
  laborRatePerHour: number;
  harvestedComponents: HarvestedComponent[];
  totalHarvestedValue: number;
  netDisassemblyVariance: number; // positive = net gain/salvage recovery, negative = disposal loss
  createdAt: string;
  completedAt?: string;
  auditHash: string;
}

export interface DisassemblyFinancialEvent {
  eventId: string;
  tenantId: string;
  companyId: string;
  orderCode: string;
  eventType: 'DISASSEMBLY_TEARDOWN_COMPLETED' | 'JOINT_CO_PRODUCT_COST_ALLOCATED';
  timestamp: string;
  glPostings: Array<{
    accountCode: string;
    accountName: string;
    debitAmount: number;
    creditAmount: number;
  }>;
  balanced: boolean;
  auditHash: string;
}
