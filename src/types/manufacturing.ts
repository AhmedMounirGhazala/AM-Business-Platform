/**
 * AM Enterprise ERP — Phase 3.2D-01 Domain Types
 * Plan-to-Produce (P2P-Mfg) / Discrete Manufacturing & Production Planning:
 * - Bill of Materials (BOM) & Multi-Level Explosion
 * - Work Centers, Machine Capacities & Cost Rates
 * - Routings, Operations & Shop Floor Time Tickets
 * - Production Work Orders (MO/WO) Lifecycle State Machine
 * - Material Allocations & Reservations
 * - Goods Issue to Production (Staging & Backflush)
 * - Goods Receipt of Finished Goods
 * - Standard vs Actual Costing, WIP & Production Variances
 * - Material Requirements Planning (MRP) Net Requirements Run
 * - Cryptographic Audit Seals & SoD Governance
 */

export type BOMStatus = 'DRAFT' | 'ACTIVE' | 'UNDER_REVISION' | 'OBSOLETE';
export type ComponentType = 'RAW_MATERIAL' | 'SUB_ASSEMBLY' | 'PACKAGING' | 'CONSUMABLE';

export interface BOMComponent {
  componentId: string;
  sku: string;
  description: string;
  componentType: ComponentType;
  quantityPerUnit: number;
  scrapFactorPercent: number; // e.g., 2% = 0.02
  uom: string;
  subAssemblyBOMId?: string; // Links to child BOM for multi-level hierarchy
  costPerUnit: number;
  warehouseId: string;
}

export interface BillOfMaterials {
  id: string;
  tenantId: string;
  companyId: string;
  bomNumber: string; // BOM-FG-001
  finishedGoodSku: string;
  finishedGoodName: string;
  version: number;
  status: BOMStatus;
  baseQuantity: number;
  uom: string;
  components: BOMComponent[];
  effectiveFrom: string;
  effectiveTo?: string;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface BOMExplosionItem {
  level: number;
  parentSku: string;
  componentSku: string;
  componentName: string;
  componentType: ComponentType;
  grossQuantityRequired: number;
  scrapAllowance: number;
  netQuantityRequired: number;
  uom: string;
  unitCost: number;
  totalCost: number;
  subAssemblyBOMId?: string;
}

export interface WorkCenter {
  id: string;
  tenantId: string;
  companyId: string;
  workCenterCode: string;
  name: string;
  costCenterCode: string;
  hourlyLaborRate: number;
  hourlyMachineRate: number;
  hourlyOverheadRate: number;
  capacityHoursPerDay: number;
  efficiencyPercent: number; // default 100
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface RoutingOperation {
  operationNumber: number; // 10, 20, 30...
  operationName: string;
  workCenterId: string;
  workCenterCode: string;
  setupTimeHours: number; // Fixed setup time
  runTimeHoursPerUnit: number; // Variable per unit
  isMilestone: boolean; // Must be completed before subsequent ops
  description?: string;
}

export interface Routing {
  id: string;
  tenantId: string;
  companyId: string;
  routingNumber: string; // RTG-FG-001
  finishedGoodSku: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  operations: RoutingOperation[];
  createdBy: string;
  createdAt: string;
}

export type WorkOrderStatus = 
  | 'DRAFT'
  | 'PLANNED'
  | 'RELEASED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SETTLED'
  | 'CLOSED'
  | 'CANCELLED';

export interface WorkOrderMaterialAllocation {
  componentSku: string;
  description: string;
  componentType: ComponentType;
  requiredQuantity: number;
  reservedQuantity: number;
  issuedQuantity: number;
  scrappedQuantity: number;
  uom: string;
  unitCost: number;
  totalPlannedCost: number;
  totalActualCost: number;
  warehouseId: string;
}

export interface OperationConfirmation {
  id: string;
  operationNumber: number;
  workCenterCode: string;
  confirmedGoodQuantity: number;
  confirmedScrapQuantity: number;
  actualLaborHours: number;
  actualMachineHours: number;
  operatorId: string;
  operatorName: string;
  confirmedAt: string;
  notes?: string;
}

export interface WorkOrderCostSummary {
  plannedMaterialCost: number;
  plannedLaborCost: number;
  plannedMachineCost: number;
  plannedOverheadCost: number;
  totalPlannedCost: number;
  standardCostPerUnit: number;

  actualMaterialCost: number;
  actualLaborCost: number;
  actualMachineCost: number;
  actualOverheadCost: number;
  totalActualCost: number;
  actualCostPerUnit: number;

  wipBalance: number; // Material + Labor + Overhead issued minus GR finished goods
  materialVariance: number;
  laborEfficiencyVariance: number;
  overheadVariance: number;
  totalVariance: number;
}

export interface ProductionWorkOrder {
  id: string;
  tenantId: string;
  companyId: string;
  orderNumber: string; // WO-2026-00001
  finishedGoodSku: string;
  finishedGoodName: string;
  bomId: string;
  bomVersion: number;
  routingId: string;
  plannedQuantity: number;
  completedQuantity: number;
  scrappedQuantity: number;
  uom: string;
  status: WorkOrderStatus;
  salesOrderId?: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  targetWarehouseId: string;
  materials: WorkOrderMaterialAllocation[];
  operationConfirmations: OperationConfirmation[];
  costSummary: WorkOrderCostSummary;
  createdBy: string;
  createdAt: string;
  releasedBy?: string;
  releasedAt?: string;
  completedBy?: string;
  completedAt?: string;
  settledBy?: string;
  settledAt?: string;
  integrityHash?: string;
  version: number;
}

export interface GoodsIssueLine {
  componentSku: string;
  quantity: number;
  uom: string;
  unitCost: number;
  warehouseId: string;
}

export interface GoodsIssueRecord {
  id: string;
  tenantId: string;
  companyId: string;
  issueNumber: string;
  workOrderId: string;
  workOrderNumber: string;
  issueDate: string;
  issuedBy: string;
  issueType: 'MANUAL_STAGING' | 'BACKFLUSH';
  lines: GoodsIssueLine[];
  totalIssuedValue: number;
  financialEventId?: string;
}

export interface GoodsReceiptRecord {
  id: string;
  tenantId: string;
  companyId: string;
  receiptNumber: string;
  workOrderId: string;
  workOrderNumber: string;
  finishedGoodSku: string;
  receiptDate: string;
  receivedBy: string;
  receivedQuantity: number;
  uom: string;
  unitValuationCost: number;
  totalReceiptValue: number;
  destinationWarehouseId: string;
  financialEventId?: string;
}

export interface MRPPlannedOrder {
  id: string;
  sku: string;
  description: string;
  actionType: 'CREATE_WORK_ORDER' | 'CREATE_PURCHASE_REQUISITION';
  netRequirementQuantity: number;
  uom: string;
  demandSource: string; // Sales Order or Safety Stock
  demandDate: string;
  suggestedStartDate: string;
  leadTimeDays: number;
  estimatedCost: number;
  status: 'PENDING' | 'CONVERTED' | 'DISMISSED';
}

export interface MRPSummaryReport {
  runId: string;
  tenantId: string;
  companyId: string;
  executionDate: string;
  grossRequirementsEvaluated: number;
  plannedProductionOrdersGenerated: number;
  plannedPurchaseRequisitionsGenerated: number;
  totalPlannedExpenditure: number;
  plannedOrders: MRPPlannedOrder[];
  integrityHash: string;
}
