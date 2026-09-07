/**
 * AM Enterprise ERP — Phase 3.2D-03 Domain Types
 * Advanced Product Costing, Manufacturing Variance Settlement & Enterprise Plant Maintenance (CO-PC / EAM)
 * 
 * - Multi-Level Standard Cost Rollup (Direct Materials, Labor, Machine, Overhead)
 * - 6-Way Manufacturing Variance Breakdown (Material Usage/Price, Labor Rate/Efficiency, Overhead)
 * - WIP Settlement & Decoupled Financial Event Emission (Zero Direct GL Mutation)
 * - Enterprise Plant Maintenance (EAM): Functional Locations, Equipment Hierarchy
 * - Preventive Maintenance (PM) Schedules (Time-based & IoT Run-hours Meter-based)
 * - Maintenance Work Orders (MWO), Spare Parts Reservation & Consumptions
 * - Equipment Reliability Analytics (MTBF, MTTR, Availability %)
 * - Engineering Change Management (ECM / ECO) with Redlining & Cryptographic Audit Seals
 */

import { ComponentType } from './manufacturing';

// ==========================================
// 1. PRODUCT COSTING & COST ROLLUP (CO-PC)
// ==========================================

export interface CostComponentSplit {
  directMaterialCost: number;
  directLaborCost: number;
  machineCost: number;
  variableOverheadCost: number;
  fixedOverheadCost: number;
  subcontractingCost: number;
  totalCost: number;
}

export interface CostedBOMItem {
  level: number;
  sku: string;
  itemName: string;
  componentType: ComponentType;
  quantityRequired: number;
  uom: string;
  unitCost: number;
  extendedCost: number;
  costSplit: CostComponentSplit;
  isSubAssembly: boolean;
}

export interface StandardCostEstimate {
  id: string;
  tenantId: string;
  companyId: string;
  costingRunNumber: string; // CR-2026-001
  finishedGoodSku: string;
  finishedGoodName: string;
  bomId: string;
  bomVersion: number;
  routingId: string;
  lotSize: number;
  uom: string;
  costSplit: CostComponentSplit;
  unitStandardCost: number;
  totalStandardCost: number;
  costedComponents: CostedBOMItem[];
  validFrom: string;
  validTo: string;
  status: 'ESTIMATED' | 'MARKED' | 'RELEASED' | 'OBSOLETE';
  createdBy: string;
  createdAt: string;
  releasedBy?: string;
  releasedAt?: string;
  cryptographicHash: string;
}

// ==========================================
// 2. 6-WAY MANUFACTURING VARIANCE SETTLEMENT
// ==========================================

export interface ManufacturingVarianceBreakdown {
  materialUsageVariance: number;    // (Actual Qty - Standard Qty) * Standard Price
  materialPriceVariance: number;    // (Actual Price - Standard Price) * Actual Qty
  laborRateVariance: number;        // (Actual Rate - Standard Rate) * Actual Hours
  laborEfficiencyVariance: number;  // (Actual Hours - Standard Hours) * Standard Rate
  machineSpendingVariance: number;  // Actual Machine Cost - (Actual Hours * Std Rate)
  machineEfficiencyVariance: number;// (Actual Hours - Standard Hours) * Std Rate
  overheadSpendingVariance: number;
  totalVariance: number;
  isUnfavorable: boolean;           // Total actual > Total standard
}

export interface WIPRevaluationRecord {
  id: string;
  tenantId: string;
  companyId: string;
  workOrderId: string;
  workOrderNumber: string;
  priorWipBalance: number;
  finishedGoodsReceiptValue: number;
  netRemainingWIP: number;
  settledVarianceAmount: number;
  settlementDate: string;
  settledBy: string;
  financialEventId: string;
  cryptographicSeal: string;
}

// ==========================================
// 3. ENTERPRISE PLANT MAINTENANCE (EAM / PM)
// ==========================================

export type MaintenanceOrderType = 'CORRECTIVE' | 'PREVENTIVE' | 'PREDICTIVE' | 'CALIBRATION';
export type MaintenanceOrderStatus = 'DRAFT' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'SETTLED' | 'CANCELLED';
export type MaintenancePriority = 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface FunctionalLocation {
  id: string;
  tenantId: string;
  companyId: string;
  locationCode: string; // e.g., PLANT-01-AREA-CNC
  name: string;
  plantId: string;
  parentLocationCode?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface EquipmentAsset {
  id: string;
  tenantId: string;
  companyId: string;
  equipmentCode: string; // EQ-CNC-001
  name: string;
  category: 'PRODUCTION_MACHINE' | 'UTILITY' | 'TOOLING' | 'FLEET';
  functionalLocationCode: string;
  workCenterId?: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  installationDate: string;
  currentRunHours: number;
  totalBreakdowns: number;
  totalDowntimeHours: number;
  status: 'OPERATIONAL' | 'IN_MAINTENANCE' | 'LOCKOUT' | 'DECOMMISSIONED';
}

export interface PreventiveMaintenanceSchedule {
  id: string;
  tenantId: string;
  companyId: string;
  scheduleCode: string; // PMS-001
  equipmentId: string;
  equipmentCode: string;
  title: string;
  frequencyType: 'TIME_BASED' | 'RUN_HOURS_METER';
  intervalDays?: number;       // e.g., every 90 days
  intervalRunHours?: number;   // e.g., every 500 hours
  lastServiceDate?: string;
  lastServiceRunHours?: number;
  nextDueDate: string;
  nextDueRunHours?: number;
  assignedTechnicianRole: string;
  estimatedLaborHours: number;
  requiredSpareParts: {
    partSku: string;
    partName: string;
    quantity: number;
    uom: string;
    estimatedCost: number;
  }[];
  isActive: boolean;
}

export interface MaintenanceSparePartLine {
  partSku: string;
  partName: string;
  plannedQuantity: number;
  consumedQuantity: number;
  uom: string;
  unitCost: number;
  totalCost: number;
  warehouseId: string;
  status: 'RESERVED' | 'CONSUMED' | 'RETURNED';
}

export interface MaintenanceWorkOrder {
  id: string;
  tenantId: string;
  companyId: string;
  mwoNumber: string; // MWO-2026-00001
  orderType: MaintenanceOrderType;
  priority: MaintenancePriority;
  equipmentId: string;
  equipmentCode: string;
  title: string;
  description: string;
  status: MaintenanceOrderStatus;
  pmScheduleId?: string;
  breakdownReportedAt?: string;
  safetyLockoutRequired: boolean;
  lockoutTagoutInstalled: boolean;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  spareParts: MaintenanceSparePartLine[];
  actualLaborHours: number;
  actualDowntimeHours: number;
  totalPartsCost: number;
  totalLaborCost: number;
  totalOrderCost: number;
  rootCauseNotes?: string;
  resolutionNotes?: string;
  plannedStartDate: string;
  actualStartDate?: string;
  completedDate?: string;
  createdBy: string;
  createdAt: string;
  releasedBy?: string;
  completedBy?: string;
  settledBy?: string;
  cryptographicSeal?: string;
}

export interface EquipmentReliabilityMetrics {
  equipmentId: string;
  equipmentCode: string;
  periodStart: string;
  periodEnd: string;
  totalOperatingHours: number;
  totalDowntimeHours: number;
  breakdownCount: number;
  meanTimeBetweenFailuresHours: number; // MTBF = (Operating Hours - Downtime Hours) / Breakdowns
  meanTimeToRepairHours: number;        // MTTR = Total Downtime Hours / Breakdowns
  availabilityPercent: number;          // Availability = (Operating - Downtime) / Operating * 100
  maintenanceCostIndex: number;
}

// ==========================================
// 4. ENGINEERING CHANGE MANAGEMENT (ECM / ECO)
// ==========================================

export type ECOStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'EFFECTIVE' | 'SUPERSEDED' | 'REJECTED';

export interface ECOComponentRedline {
  action: 'ADD' | 'REMOVE' | 'MODIFY_QUANTITY';
  componentSku: string;
  oldQuantity?: number;
  newQuantity?: number;
  uom: string;
  reason: string;
}

export interface ECORoutingRedline {
  action: 'ADD_OPERATION' | 'REMOVE_OPERATION' | 'MODIFY_RUN_TIME';
  operationNumber: number;
  oldRunTimeHours?: number;
  newRunTimeHours?: number;
  workCenterCode: string;
  reason: string;
}

export interface EngineeringChangeOrder {
  id: string;
  tenantId: string;
  companyId: string;
  ecoNumber: string; // ECO-2026-0001
  title: string;
  description: string;
  changeReason: 'COST_REDUCTION' | 'QUALITY_IMPROVEMENT' | 'SAFETY' | 'REGULATORY' | 'OBSOLESCENCE';
  affectedFinishedGoodSku: string;
  bomId: string;
  fromBomVersion: number;
  toBomVersion: number;
  routingId?: string;
  status: ECOStatus;
  componentRedlines: ECOComponentRedline[];
  routingRedlines: ECORoutingRedline[];
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  effectiveDate: string;
  cryptographicSeal: string;
}
