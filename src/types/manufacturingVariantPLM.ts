/**
 * AM Enterprise ERP — Phase 3.2D-05 Domain Types
 * Product Lifecycle Management (PLM), Variant Configuration (CTO/ATO Super-BOMs),
 * Engineering Deviations/Concessions, Multi-Tier Recall Containment,
 * and Plant Sustainability / Carbon Footprint (ESG) Tracking
 */

import { FinancialEventPayload } from './processManufacturingSubcontracting';

// ============================================================================
// 1. VARIANT CONFIGURATION & SUPER-BOM (CTO / ATO)
// ============================================================================

export type CharacteristicType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'ENUM';

export interface CharacteristicValueOption {
  code: string;
  label: string;
  priceDelta: number; // Surcharge/discount to base price
  costDelta: number;  // Direct BOM component delta
}

export interface ConfigurationCharacteristic {
  id: string;
  code: string;
  name: string;
  type: CharacteristicType;
  allowedValues: CharacteristicValueOption[];
  defaultValue?: string;
  required: boolean;
}

export type ConfigurationRuleType = 
  | 'PRECONDITION'          // Option B only available if Option A == X
  | 'SELECTION_CONDITION'   // Include component if characteristic matches expression
  | 'INCOMPATIBILITY'       // Option A cannot coexist with Option B
  | 'CALCULATION';          // Calculate numeric dimension or quantity

export interface ConfigurationRule {
  id: string;
  ruleType: ConfigurationRuleType;
  sourceCharacteristic: string;
  targetCharacteristic?: string;
  conditionExpression: string; // e.g. "COLOR == 'TITANIUM_GREY'" or "VOLTAGE == '240V' && PLUG == 'UK'"
  errorMessage?: string;
}

export interface SuperBOMComponent {
  id: string;
  itemSku: string;
  description: string;
  baseQuantity: number;
  unitOfMeasure: string;
  unitCost: number;
  selectionCondition?: string; // Logical expression evaluated against selected options
  isStandard: boolean;         // Always included regardless of configuration
}

export interface SuperBOM {
  id: string;
  tenantId: string;
  companyId: string;
  baseModelSku: string;
  modelName: string;
  version: number;
  basePrice: number;
  components: SuperBOMComponent[];
  createdAt: string;
}

export interface ConfigurableProductModel {
  id: string;
  tenantId: string;
  companyId: string;
  baseModelSku: string;
  modelName: string;
  characteristics: ConfigurationCharacteristic[];
  rules: ConfigurationRule[];
  superBomId: string;
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED';
  createdAt: string;
}

export interface ResolvedVariantComponent {
  itemSku: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  unitCost: number;
  totalCost: number;
}

export interface ConfiguredVariantInstance {
  id: string;
  tenantId: string;
  companyId: string;
  configuredSku: string; // e.g. "FG-TURBINE-OPT-9912"
  baseModelSku: string;
  selectedOptions: Record<string, string | number | boolean>;
  resolvedBOM: ResolvedVariantComponent[];
  totalMaterialCost: number;
  basePrice: number;
  totalOptionPriceDelta: number;
  finalCalculatedPrice: number;
  cryptographicConfigurationHash: string; // SHA-256 of normalized configuration
  configuredBy: string;
  configuredAt: string;
}

// ============================================================================
// 2. PLM ENGINEERING DEVIATIONS & CONCESSION PERMITS
// ============================================================================

export type DeviationType = 
  | 'MATERIAL_SUBSTITUTION' 
  | 'ROUTING_BYPASS' 
  | 'TOLERANCE_RELAXATION'
  | 'SUPPLIER_ALTERNATIVE';

export type DeviationStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'APPROVED' 
  | 'ACTIVE' 
  | 'EXHAUSTED' 
  | 'EXPIRED' 
  | 'REJECTED';

export interface DeviationPermit {
  id: string;
  tenantId: string;
  companyId: string;
  permitNumber: string; // e.g. "DEV-2026-0042"
  title: string;
  deviationType: DeviationType;
  status: DeviationStatus;
  affectedFinishedGoodSku: string;
  bomId: string;
  originalMaterialSku?: string;
  substituteMaterialSku?: string;
  workCenterId?: string;
  justification: string;
  scopeType: 'QUANTITY_LIMIT' | 'DATE_RANGE' | 'LOT_COUNT';
  maxAllowedQuantity?: number;
  consumedQuantity: number;
  validFrom: string;
  validTo?: string;
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  qualityManagerSignature?: string;
  cryptographicSeal: string;
}

// ============================================================================
// 3. MULTI-TIER RECALL CONTAINMENT & QUARANTINE ENGINE
// ============================================================================

export type RecallSeverity = 'CLASS_I' | 'CLASS_II' | 'CLASS_III'; // I = Life threatening / critical, II = Temporary, III = Minor

export type RecallStatus = 
  | 'INITIATED' 
  | 'CONTAINMENT_ACTIVE' 
  | 'NOTIFICATIONS_DISPATCHED' 
  | 'RECOVERY_IN_PROGRESS' 
  | 'RECONCILED' 
  | 'CLOSED';

export type QuarantinedEntityType = 
  | 'RAW_INVENTORY_LOT' 
  | 'WIP_WORK_ORDER' 
  | 'FINISHED_GOODS_STOCK' 
  | 'OUTBOUND_SHIPMENT' 
  | 'CUSTOMER_DELIVERY';

export interface QuarantinedEntityRecord {
  id: string;
  entityType: QuarantinedEntityType;
  entityId: string;          // Lot ID, Work Order ID, Shipment ID, or Delivery ID
  itemSku: string;
  itemDescription: string;
  lotNumber?: string;
  serialNumber?: string;
  warehouseId?: string;
  customerId?: string;
  customerName?: string;
  affectedQuantity: number;
  quarantineStatus: 'LOCKED' | 'NOTIFIED' | 'RETRIEVED' | 'DISPOSED' | 'RELEASED';
  lockedAt: string;
  notes?: string;
}

export interface RecallIncident {
  id: string;
  tenantId: string;
  companyId: string;
  incidentNumber: string; // e.g. "RCL-2026-001"
  title: string;
  severity: RecallSeverity;
  status: RecallStatus;
  rootCauseSku: string;
  rootCauseLotNumber: string;
  defectDescription: string;
  affectedEntities: QuarantinedEntityRecord[];
  totalQuarantinedStockQty: number;
  totalHaltedWipQty: number;
  totalCustomerImpactedQty: number;
  initiatedBy: string;
  initiatedAt: string;
  containmentLockedAt?: string;
  closedBy?: string;
  closedAt?: string;
  regulatoryReportRequired: boolean;
  regulatoryBody?: string; // e.g. "FDA", "FAA", "OSHA", "ISO"
  containmentHash: string;  // SHA-256 seal of complete affected tree
  financialEvent?: FinancialEventPayload;
}

// ============================================================================
// 4. PLANT SUSTAINABILITY, ENERGY & CARBON (ESG) ACCOUNTING
// ============================================================================

export interface EnergyConsumptionRecord {
  id: string;
  tenantId: string;
  companyId: string;
  workOrderId: string;
  workCenterId: string;
  productionDate: string;
  electricityKwh: number;
  naturalGasCubicMeters: number;
  compressedAirCubicMeters: number;
  waterLiters: number;
  energyCost: number;
  recordedBy: string;
  recordedAt: string;
}

export interface CarbonFootprintCalculation {
  id: string;
  tenantId: string;
  companyId: string;
  workOrderId: string;
  productSku: string;
  productName: string;
  quantityProduced: number;
  directEnergyCo2Kg: number;       // Scope 2 (electricity)
  fuelCombustionCo2Kg: number;     // Scope 1 (direct natural gas / fuels)
  rawMaterialEmbodiedCo2Kg: number;// Scope 3 upstream (embodied in BOM inputs)
  totalCo2eKg: number;             // Total kg CO2 equivalent
  co2ePerUnitKg: number;           // Intensity metric: kg CO2e / unit
  esgRatingBand: 'A' | 'B' | 'C' | 'D' | 'F'; // Benchmark tier
  calculatedAt: string;
  auditSeal: string;               // SHA-256 cryptographic verification seal
}
