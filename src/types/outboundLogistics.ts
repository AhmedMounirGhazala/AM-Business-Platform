/**
 * AM BUSINESS PLATFORM — OUTBOUND LOGISTICS & DELIVERY DOMAIN TYPES
 * Phase 3.2C-02: Advanced Outbound Delivery, Shipping Execution, Handling Units, ATP Promising & RMA
 * Architectural Alignment: SAP S/4HANA LE-SHP / TM, Oracle SCM Logistics, D365 Supply Chain
 */

export type OutboundDeliveryStatus = 
  | 'DRAFT'
  | 'PLANNED'
  | 'RELEASED_FOR_PICKING'
  | 'PARTIALLY_PICKED'
  | 'PICKED'
  | 'PACKED'
  | 'GOODS_ISSUED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REVERSED';

export type PickTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXCEPTION';

export type HandlingUnitType = 'CARTON' | 'PALLET' | 'CONTAINER' | 'CRATE' | 'TOTE';

export type RMAStatus = 'REQUESTED' | 'APPROVED' | 'RECEIVED' | 'INSPECTED' | 'SETTLED' | 'REJECTED' | 'CANCELLED';

export type InspectionDispositionType = 
  | 'RESTOCK_SELLABLE'
  | 'SCRAP_WRITE_OFF'
  | 'REWORK_REFURBISH'
  | 'RETURN_TO_VENDOR';

export type ATPStatus = 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'UNAVAILABLE' | 'SUBSTITUTE_RECOMMENDED';

export interface ATPCheckItem {
  sku: string;
  requestedQuantity: number;
  warehouseId: string;
  requiredDeliveryDate: string; // ISO
}

export interface ATPCheckRequest {
  tenantId: string;
  companyId: string;
  items: ATPCheckItem[];
  substitutesMap?: Record<string, string>;
  alternativeWarehousesMap?: Record<string, string[]>;
}

export interface ATPItemResult {
  sku: string;
  warehouseId: string;
  requestedQuantity: number;
  confirmedQuantity: number;
  availableOnHand: number;
  scheduledInbound: number;
  allocatedReserved: number;
  netAvailable: number;
  atpStatus: ATPStatus;
  confirmedDate: string;
  substituteSku?: string;
  alternativeWarehouseId?: string;
  alternativeAvailableQty?: number;
}

export interface ATPCheckResponse {
  tenantId: string;
  companyId: string;
  checkTimestamp: string;
  isFullyConfirmed: boolean;
  results: ATPItemResult[];
}

export interface StockReservation {
  id: string;
  tenantId: string;
  companyId: string;
  reservationNumber: string;
  salesOrderId: string;
  salesOrderLineId: string;
  sku: string;
  warehouseId: string;
  quantity: number;
  uom: string;
  status: 'ACTIVE' | 'RELEASED' | 'EXPIRED' | 'CONSUMED';
  expiresAt: string; // ISO
  createdAt: string;
  createdBy: string;
}

export interface OutboundDeliveryLine {
  id: string;
  deliveryId: string;
  salesOrderId: string;
  salesOrderLineId: string;
  sku: string;
  description: string;
  orderedQuantity: number;
  deliveryQuantity: number;
  pickedQuantity: number;
  packedQuantity: number;
  uom: string;
  unitPrice: number;
  unitCost: number;
  currency: string;
  warehouseId: string;
  storageBin: string;
  batchNumber?: string;
  lotExpiryDate?: string;
  isComplete: boolean;
}

export interface OutboundDelivery {
  id: string;
  tenantId: string;
  companyId: string;
  deliveryNumber: string; // OBD-YYYY-00001
  salesOrderId: string;
  salesOrderNumber: string;
  customerId: string;
  customerName: string;
  shippingAddress: string;
  shippingPoint: string;
  carrierCode: string;
  carrierName: string;
  serviceLevel: string; // e.g., 'EXPRESS', 'STANDARD', 'FREIGHT'
  shippingRoute: string;
  trackingNumber?: string;
  plannedDepartureDate: string;
  plannedArrivalDate: string;
  actualDepartureDate?: string;
  actualDeliveryDate?: string;
  status: OutboundDeliveryStatus;
  completeDeliveryRequired: boolean;
  totalWeightKg: number;
  totalVolumeCbm: number;
  totalDeliveryValue: number;
  totalDeliveryCost: number;
  currency: string;
  lines: OutboundDeliveryLine[];
  handlingUnitIds: string[];
  pickWaveId?: string;
  pgiDocumentNumber?: string;
  pgiTimestamp?: string;
  reversalReason?: string;
  reversalTimestamp?: string;
  proofOfDeliveryId?: string;
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface PickTask {
  id: string;
  tenantId: string;
  companyId: string;
  taskNumber: string;
  waveId: string;
  deliveryId: string;
  deliveryLineId: string;
  sku: string;
  description: string;
  warehouseId: string;
  sourceStorageBin: string;
  destinationBin: string;
  quantityRequested: number;
  quantityPicked: number;
  uom: string;
  batchNumber?: string;
  lotExpiryDate?: string;
  status: PickTaskStatus;
  pickedBy?: string;
  pickedAt?: string;
  exceptionReason?: string;
}

export interface PickWave {
  id: string;
  tenantId: string;
  companyId: string;
  waveNumber: string; // WAV-YYYY-00001
  warehouseId: string;
  shippingRoute: string;
  carrierCode: string;
  status: 'OPEN' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  deliveryIds: string[];
  tasks: PickTask[];
  createdAt: string;
  createdBy: string;
  completedAt?: string;
}

export interface HandlingUnitItem {
  deliveryLineId: string;
  sku: string;
  description: string;
  quantity: number;
  uom: string;
  batchNumber?: string;
  weightKg: number;
}

export interface HandlingUnit {
  id: string;
  tenantId: string;
  companyId: string;
  huNumber: string; // HU-PAL-000001
  sscc18Barcode: string; // Serial Shipping Container Code
  packagingType: HandlingUnitType;
  deliveryId: string;
  parentHuId?: string; // For nesting (e.g. Carton inside Pallet)
  tareWeightKg: number;
  netWeightKg: number;
  grossWeightKg: number;
  volumeCbm: number;
  maxWeightCapacityKg: number;
  items: HandlingUnitItem[];
  sealed: boolean;
  sealNumber?: string;
  cryptographicSealHash?: string;
  createdAt: string;
  createdBy: string;
}

export interface PGIDocument {
  id: string;
  tenantId: string;
  companyId: string;
  pgiNumber: string; // PGI-YYYY-00001
  deliveryId: string;
  deliveryNumber: string;
  salesOrderId: string;
  totalCostValue: number;
  currency: string;
  journalEntryId?: string;
  financialEventId: string;
  status: 'POSTED' | 'REVERSED';
  reversalPgiNumber?: string;
  reversalReason?: string;
  postedAt: string;
  postedBy: string;
}

export interface RMALine {
  id: string;
  rmaId: string;
  originalDeliveryId: string;
  originalDeliveryLineId: string;
  sku: string;
  description: string;
  returnQuantity: number;
  uom: string;
  returnReason: 'DAMAGED' | 'DEFECTIVE' | 'WRONG_ITEM' | 'CUSTOMER_CANCEL' | 'EXPIRED';
  unitCreditPrice: number;
  currency: string;
  inspectedQuantity?: number;
  disposition?: InspectionDispositionType;
  dispositionNotes?: string;
  restockedToWarehouseId?: string;
  restockedToBin?: string;
}

export interface ReturnAuthorization {
  id: string;
  tenantId: string;
  companyId: string;
  rmaNumber: string; // RMA-YYYY-00001
  originalSalesOrderId: string;
  originalDeliveryNumber: string;
  customerId: string;
  customerName: string;
  status: RMAStatus;
  lines: RMALine[];
  totalCreditValue: number;
  currency: string;
  creditMemoId?: string;
  inspectionDate?: string;
  inspectedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  createdBy: string;
}

export interface ProofOfDelivery {
  id: string;
  tenantId: string;
  companyId: string;
  deliveryId: string;
  deliveryNumber: string;
  recipientName: string;
  signatureImageHash: string;
  latitude?: number;
  longitude?: number;
  deliveredTimestamp: string;
  discrepancyReported: boolean;
  discrepancies?: {
    sku: string;
    missingQuantity: number;
    damagedQuantity: number;
    notes: string;
  }[];
  carrierEstimatedCost: number;
  carrierActualCost: number;
  freightCostVariance: number;
  carrierInvoiceMatch: 'MATCHED' | 'VARIANCE_HOLD' | 'REJECTED';
  createdAt: string;
  createdBy: string;
}

export interface LogisticsAuditRecord {
  id: string;
  tenantId: string;
  companyId: string;
  entityType: 'DELIVERY' | 'PICK_WAVE' | 'HANDLING_UNIT' | 'PGI' | 'RMA' | 'EPOD';
  entityId: string;
  action: string;
  performedBy: string;
  timestamp: string;
  previousHash: string;
  currentHash: string;
  details: Record<string, any>;
}
