/**
 * AM Enterprise ERP — Phase 3.2C-01 Domain Types
 * Advanced Order-to-Cash (O2C):
 * 1. Sales Contracts & Blanket Sales Agreements (BPA / Outline Agreements)
 * 2. Customer Consignment Inventory (Fill-Up, Issue/Consumption, Pick-Up, Return)
 * 3. Customer Volume Rebates & Settlement Management
 * 4. Drop-Shipment Order Lifecycle & Direct Vendor Delivery Orchestration
 * 5. Dynamic Customer Credit Exposure & Order Governance
 */

export type SalesContractType = 'QUANTITY_COMMITMENT' | 'VALUE_COMMITMENT' | 'PRICE_AGREEMENT';
export type SalesContractStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'FULFILLED' | 'CANCELLED';

export interface SalesContractLine {
  id: string;
  lineNumber: number;
  itemSku: string;
  itemName: string;
  uom: string;
  committedQuantity: number;
  releasedQuantity: number;
  remainingQuantity: number;
  agreedUnitPrice: number;
  currency: string;
  committedAmount: number;
  releasedAmount: number;
  remainingAmount: number;
  minimumOrderQuantity?: number;
  maximumOrderQuantity?: number;
  discountPercentage?: number;
  notes?: string;
}

export interface ContractDrawdownRelease {
  id: string;
  contractId: string;
  contractNumber: string;
  salesOrderId: string;
  salesOrderNumber: string;
  lineId: string;
  itemSku: string;
  releasedQuantity: number;
  unitPrice: number;
  releasedAmount: number;
  releaseDate: string;
  performedBy: string;
}

export interface SalesContract {
  id: string;
  contractNumber: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  contractType: SalesContractType;
  status: SalesContractStatus;
  customerId: string;
  customerCode: string;
  customerName: string;
  title: string;
  startDate: string;
  endDate: string;
  currency: string;
  exchangeRate: number;
  totalCommittedAmount: number;
  totalReleasedAmount: number;
  totalRemainingAmount: number;
  paymentTermsId: string;
  paymentTermsCode: string;
  autoRenew: boolean;
  renewalNoticeDays?: number;
  earlyTerminationPenaltyRate?: number; // e.g. 0.05 for 5%
  approvedBy?: string;
  approvedAt?: string;
  lines: SalesContractLine[];
  drawdownHistory: ContractDrawdownRelease[];
  version: number;
  auditTrail: SalesContractAuditLog[];
  sha256Hash: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesContractAuditLog {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'SUBMIT' | 'APPROVE' | 'ACTIVATE' | 'DRAWDOWN' | 'AMEND' | 'EXPIRE' | 'TERMINATE' | 'CANCEL';
  performedBy: string;
  previousStatus?: SalesContractStatus;
  newStatus?: SalesContractStatus;
  details: string;
  sha256Hash: string;
}

// ==================== 2. CUSTOMER CONSIGNMENT INVENTORY ====================

export type ConsignmentMovementType =
  | 'CONSIGNMENT_FILLUP'      // Company -> Customer site (No billing, transfers custody)
  | 'CONSIGNMENT_ISSUE'       // Customer consumes consignment -> Triggers billing & revenue
  | 'CONSIGNMENT_PICKUP'      // Return unused consignment goods from customer back to company
  | 'CONSIGNMENT_RETURN';     // Customer returns consumed goods for credit

export interface CustomerConsignmentStock {
  id: string;
  tenantId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  customerLocationId: string;
  customerLocationName: string;
  itemSku: string;
  itemName: string;
  uom: string;
  currentStockQuantity: number;
  reservedStockQuantity: number;
  unitValuationCost: number;
  totalValuationValue: number;
  currency: string;
  lastMovementDate: string;
  updatedAt: string;
}

export interface ConsignmentMovementRecord {
  id: string;
  movementNumber: string;
  tenantId: string;
  companyId: string;
  movementType: ConsignmentMovementType;
  customerId: string;
  customerName: string;
  customerLocationId: string;
  itemSku: string;
  itemName: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  referenceDocumentType?: 'SALES_ORDER' | 'DELIVERY_NOTE' | 'INVOICE' | 'RETURN_ORDER';
  referenceDocumentId?: string;
  referenceDocumentNumber?: string;
  financialEventId?: string;
  performedBy: string;
  notes?: string;
  timestamp: string;
  sha256Hash: string;
}

// ==================== 3. CUSTOMER VOLUME REBATES & SETTLEMENT ====================

export type RebateCalculationBasis = 'NET_SALES_VALUE' | 'GROSS_SALES_VALUE' | 'TOTAL_QUANTITY';
export type RebateAgreementStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'SETTLED' | 'CANCELLED';

export interface RebateTier {
  tierNumber: number;
  thresholdFrom: number;
  thresholdTo?: number; // null/undefined for upper unbounded
  rebatePercentage: number; // e.g. 3.5 for 3.5%
  fixedRatePerUnit?: number;
}

export interface CustomerRebateAgreement {
  id: string;
  agreementNumber: string;
  tenantId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  title: string;
  status: RebateAgreementStatus;
  calculationBasis: RebateCalculationBasis;
  currency: string;
  validFrom: string;
  validTo: string;
  tiers: RebateTier[];
  eligibleItemSkus?: string[]; // Empty means all items
  eligibleCategories?: string[];
  accumulatedEligibleAmount: number;
  accumulatedEligibleQuantity: number;
  accumulatedAccrualAmount: number;
  totalSettledAmount: number;
  remainingPayableAmount: number;
  settlements: RebateSettlementRecord[];
  version: number;
  sha256Hash: string;
  createdAt: string;
  updatedAt: string;
}

export interface RebateAccrualEntry {
  id: string;
  agreementId: string;
  agreementNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerId: string;
  eligibleInvoiceAmount: number;
  applicableRebateRate: number;
  accrualAmount: number;
  currency: string;
  financialEventId?: string;
  timestamp: string;
}

export interface RebateSettlementRecord {
  id: string;
  settlementNumber: string;
  agreementId: string;
  agreementNumber: string;
  tenantId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  settlementDate: string;
  settledAmount: number;
  currency: string;
  settlementType: 'CREDIT_MEMO' | 'DIRECT_PAYOUT';
  creditNoteId?: string;
  creditNoteNumber?: string;
  financialEventId?: string;
  performedBy: string;
  notes?: string;
  sha256Hash: string;
}

// ==================== 4. DROP-SHIPMENT DIRECT DELIVERY ====================

export type DropShipmentStatus =
  | 'PENDING_PO_CREATION'
  | 'PO_CREATED'
  | 'VENDOR_CONFIRMED'
  | 'IN_TRANSIT'
  | 'DELIVERED_TO_CUSTOMER'
  | 'BILLED_TO_CUSTOMER'
  | 'CANCELLED';

export interface DropShipmentOrder {
  id: string;
  dropShipNumber: string;
  tenantId: string;
  companyId: string;
  salesOrderId: string;
  salesOrderNumber: string;
  salesOrderLineNumber: number;
  customerId: string;
  customerName: string;
  shippingAddress: string;
  vendorId: string;
  vendorName: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  itemSku: string;
  itemName: string;
  quantity: number;
  uom: string;
  customerSellingPrice: number;
  customerTotalAmount: number;
  vendorPurchaseCost: number;
  vendorTotalCost: number;
  estimatedMarginAmount: number;
  estimatedMarginPercent: number;
  currency: string;
  status: DropShipmentStatus;
  carrierName?: string;
  trackingNumber?: string;
  vendorDeliveryDate?: string;
  customerReceivedDate?: string;
  customerInvoiceId?: string;
  vendorBillId?: string;
  auditTrail: DropShipAuditLog[];
  sha256Hash: string;
  createdAt: string;
  updatedAt: string;
}

export interface DropShipAuditLog {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  previousStatus?: DropShipmentStatus;
  newStatus?: DropShipmentStatus;
  details: string;
}

// ==================== 5. CUSTOMER CREDIT EXPOSURE & RISK WORKBENCH ====================

export type CreditRiskRating = 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'CRITICAL_SUSPENDED';

export interface CustomerCreditProfile {
  id: string;
  tenantId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  creditLimit: number;
  currency: string;
  paymentTermsDays: number;
  creditHoldActive: boolean;
  creditRiskRating: CreditRiskRating;
  openOrdersAmount: number;        // Confirmed orders not yet delivered
  openDeliveriesAmount: number;    // Delivered not yet invoiced
  openInvoicesAmount: number;      // Invoiced not yet paid (AR)
  totalExposureAmount: number;     // Open Orders + Open Deliveries + Open Invoices
  availableCreditAmount: number;   // Credit Limit - Total Exposure
  creditUtilizationPercent: number; // Exposure / Limit * 100
  overdueBalanceAmount: number;
  oldestOverdueDays: number;
  lastReviewDate: string;
  nextReviewDate: string;
  overrideApprover?: string;
  overrideExpiryDate?: string;
  notes?: string;
  updatedAt: string;
}

export interface CreditCheckResult {
  passed: boolean;
  customerId: string;
  customerName: string;
  requestedOrderAmount: number;
  currentExposure: number;
  newProjectedExposure: number;
  creditLimit: number;
  utilizationAfterOrder: number;
  creditHoldActive: boolean;
  overdueBlocking: boolean;
  failureReasons: string[];
  requiresSpecialApproval: boolean;
  recommendedAction: 'APPROVE' | 'REQUIRE_PREPAYMENT' | 'REQUIRE_MANAGEMENT_OVERRIDE' | 'REJECT';
}
