/**
 * AM Business Platform - Procurement & Purchasing Domain Types (Phase 2.3)
 * Enterprise Standard Aligned with SAP S/4HANA Sourcing & Procurement (MM-PUR) and Oracle ERP Cloud SCM
 */

import { DocumentLifecycleStatus, UserRole } from './index';
export type { UserRole };

// ==================== 1. PROCUREMENT MASTER DATA ====================

export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'UNDER_EVALUATION';

export interface VendorMaster {
  id: string;
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  nameAr?: string;
  taxNumber?: string;
  commercialRegNo?: string;
  vendorCategoryId?: string;
  vendorCategoryName?: string;
  category?: string;
  paymentTermsId?: string;
  paymentTermsName?: string;
  incotermsId?: string;
  incotermsCode?: string;
  purchasingOrgId?: string;
  purchasingOrgName?: string;
  currency: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  country?: string;
  city?: string;
  bankName?: string;
  bankIban?: string;
  bankSwift?: string;
  creditLimit?: number;
  rating?: number; // 1 to 5 stars
  performanceKPIs?: SupplierPerformanceKPIs;
  status: VendorStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorContractRule {
  id: string;
  tenantId: string;
  companyId?: string;
  vendorId: string;
  vendorName?: string;
  contractNumber: string;
  contractType?: 'FIXED' | 'TIERED' | 'INDEXED' | 'VOLUME_DISCOUNT' | 'FRAMEWORK';
  itemSku: string;
  contractPrice?: number;
  contractedPrice?: number;
  currency: string;
  uom?: string;
  minQuantity?: number;
  minCommitmentQty?: number;
  maxQuantity?: number;
  maxCommitmentQty?: number;
  pricingMechanism?: string;
  tieredRules?: any[];
  discountPercent?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  isActive?: boolean;
}

export interface SupplierPerformanceKPIs {
  onTimeDeliveryRate: number; // e.g. 98.5%
  averageLeadTimeDays: number; // e.g. 12
  qualityRating: number; // 0 - 100%
  rejectionRate: number; // e.g. 1.2%
  totalOrdersCompleted: number;
  totalAmountProcured: number;
  lastEvaluatedAt: string;
}

export interface VendorPriceHistoryRecord {
  id: string;
  tenantId: string;
  companyId: string;
  vendorId: string;
  vendorName: string;
  itemSku: string;
  itemName: string;
  unitPrice: number;
  currency: string;
  effectiveDate: string;
  expiryDate?: string;
  sourceDocumentType: 'QUOTATION' | 'PO' | 'CONTRACT' | 'MANUAL';
  sourceDocumentNumber: string;
  createdAt: string;
}

export interface VendorCategory {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  nameAr: string;
  description?: string;
  active: boolean;
}

export interface PaymentTerms {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  nameAr: string;
  dueDays: number;
  discountDays?: number;
  discountPercent?: number;
  active: boolean;
}

export interface Incoterms {
  id: string;
  tenantId: string;
  code: string; // e.g., FOB, CIF, EXW, DDP, DAP
  name: string;
  nameAr: string;
  description?: string;
  active: boolean;
}

export interface ProcurementCategory {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  nameAr: string;
  parentId?: string;
  active: boolean;
}

export interface BuyerGroup {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  nameAr: string;
  description?: string;
  active: boolean;
}

export interface PurchasingOrganization {
  id: string;
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  nameAr: string;
  isCompanyLevel: boolean;
  active: boolean;
}

// ==================== 2. PURCHASE REQUISITION (PR) ENGINE ====================

export type PRStatus = 
  | 'DRAFT' 
  | 'BUDGET_CHECKED'
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'IN_RFQ' 
  | 'PARTIALLY_CONVERTED' 
  | 'CONVERTED_TO_PO' 
  | 'CANCELLED';

export type PRPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ProcurementBudgetCheckStatus =
  | 'WITHIN_BUDGET'
  | 'BUDGET_WARNING'
  | 'OVER_BUDGET'
  | 'BUDGET_BLOCKED'
  | 'BUDGET_NOT_CONFIGURED'
  | 'BUDGET_CHECK_FAILED'
  | 'BUDGET_AVAILABLE'
  | 'BUDGET_RESERVED'
  | 'PASSED'
  | 'WARNING'
  | 'EXCEEDED';

export type ProcurementBudgetPolicy =
  | 'NONE'
  | 'WARNING'
  | 'SOFT_BLOCK'
  | 'HARD_BLOCK';

export interface ProcurementBudgetCheckResult {
  id: string;
  requisitionId?: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  departmentId?: string;
  costCenterId?: string;
  profitCenterId?: string;
  projectId?: string;
  fiscalPeriod?: string;
  allocatedBudget: number;
  consumedBudget: number;
  committedBudget: number;
  availableBudget: number;
  requestedAmount: number;
  variance: number;
  status: ProcurementBudgetCheckStatus;
  policy: ProcurementBudgetPolicy;
  isBlocked: boolean;
  reason: string;
  evaluatedAt: string;
}

export interface PurchaseRequisitionLine {
  id: string;
  requisitionId?: string; // Canonical
  prId?: string; // Legacy alias
  lineNumber?: number;
  productId?: string;
  itemSku?: string; // Canonical/Legacy SKU
  variantId?: string;
  variantSku?: string;
  itemName: string;
  itemNameAr?: string;
  description?: string;
  categoryId?: string;
  requestedQuantity?: number;
  requestedQty?: number; // Legacy alias
  quantity?: number; // Test suite legacy alias
  requestedUOM?: string;
  uom?: string; // Legacy alias
  baseQuantity?: number;
  baseUOM?: string;
  uomConversionFactor?: number;
  estimatedUnitPrice: number;
  estimatedLineAmount?: number;
  estimatedTotalPrice?: number; // Legacy alias
  taxCategoryId?: string;
  taxCategoryCode?: string;
  estimatedTaxAmount?: number;
  warehouseId: string;
  warehouseName?: string;
  departmentId?: string;
  costCenterId?: string;
  costCenterCode?: string;
  expenseAccountId?: string;
  expenseAccountCode?: string;
  profitCenterId?: string;
  projectId?: string;
  supplierId?: string;
  supplierName?: string;
  requiredDate: string;
  status: 'OPEN' | 'IN_RFQ' | 'ORDERED' | 'CANCELLED' | 'APPROVED';
  poReference?: string;
}

export type PurchaseRequisitionItem = PurchaseRequisitionLine;

export interface PurchaseRequisition {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  prNumber: string; // e.g. PR-2026-0001
  title?: string;
  requestedBy?: string; // User ID
  requesterId?: string; // Alias
  requestedByName?: string;
  requesterName?: string; // Canonical alias
  departmentId?: string;
  departmentName?: string;
  warehouseId?: string;
  warehouseName?: string;
  supplierId?: string;
  supplierName?: string;
  currencyId?: string;
  currency: string;
  exchangeRate?: number;
  costCenterId?: string;
  costCenterName?: string;
  profitCenterId?: string;
  profitCenterName?: string;
  projectId?: string;
  projectName?: string;
  purchasingOrgId?: string;
  purchasingOrgName?: string;
  buyerGroupId?: string;
  requisitionDate: string;
  requiredDate: string;
  priority: PRPriority;
  purpose?: string;
  status: PRStatus;
  approvalStatus?: string;
  approvalLevel?: number | string;
  totalEstimatedAmount: number;
  budgetStatus?: ProcurementBudgetCheckStatus;
  budgetPolicy?: ProcurementBudgetPolicy;
  budgetCheckResult?: ProcurementBudgetCheckResult;
  lines: PurchaseRequisitionLine[];
  items?: PurchaseRequisitionLine[]; // Legacy alias
  approvalHistory?: PurchaseApprovalStep[];
  rejectionReason?: string;
  version: number;
  currentVersion?: number;
  amendmentCount?: number;
  correlationId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 3. REQUEST FOR QUOTATION (RFQ) ENGINE ====================

export type RFQStatus = 
  | 'DRAFT' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'PUBLISHED' 
  | 'ISSUED' 
  | 'PARTIALLY_RESPONDED' 
  | 'FULLY_RESPONDED' 
  | 'RESPONSES_RECEIVED' 
  | 'UNDER_EVALUATION' 
  | 'EVALUATED' 
  | 'AWARDED' 
  | 'PARTIALLY_AWARDED' 
  | 'CANCELLED' 
  | 'REJECTED' 
  | 'CLOSED';

export type RFQInvitationStatus = 'INVITED' | 'VIEWED' | 'RESPONDED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';

export interface RFQSupplierInvitation {
  id: string;
  rfqId: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  supplierEmail?: string;
  invitedAt: string;
  invitedBy: string;
  invitedByName?: string;
  responseDeadline: string;
  invitationStatus: RFQInvitationStatus;
  respondedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  quotationId?: string;
}

export interface RFQLine {
  id: string;
  rfqId: string;
  lineIndex?: number;
  prId?: string;
  prLineId?: string;
  prItemId?: string; // Legacy alias
  productId?: string;
  variantId?: string;
  variantSku?: string;
  itemSku: string;
  itemName: string;
  itemNameAr?: string;
  description?: string;
  categoryId?: string;
  targetQuantity?: number;
  requestedQty?: number; // Legacy alias
  targetUOM?: string;
  uom?: string; // Legacy alias
  baseQuantity?: number;
  baseUOM?: string;
  uomConversionFactor?: number;
  targetUnitPrice?: number;
  taxCategoryId?: string;
  taxCategoryCode?: string;
  warehouseId?: string;
  warehouseName?: string;
  departmentId?: string;
  costCenterId?: string;
  projectId?: string;
  requiredDate?: string;
  targetDeliveryDate?: string; // Legacy alias
  specifications?: string;
  status?: 'OPEN' | 'QUOTED' | 'AWARDED' | 'PARTIALLY_AWARDED' | 'CANCELLED';
  awardedQuantity?: number;
  remainingQuantity?: number;
}

export type RFQItem = RFQLine;

export interface RequestForQuotation {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  rfqNumber: string; // e.g. RFQ-2026-0001
  title: string;
  prId?: string;
  prNumber?: string;
  departmentId?: string;
  departmentName?: string;
  buyerId?: string;
  buyerName?: string;
  currency?: string;
  issuedDate: string;
  closingDate: string;
  targetDeliveryDate?: string;
  paymentTermsId?: string;
  paymentTermsName?: string;
  incotermsId?: string;
  incotermsCode?: string;
  status: RFQStatus;
  buyersNotes?: string;
  notes?: string;
  vendorIds: string[]; // Invited vendor IDs (for legacy compatibility)
  invitations?: RFQSupplierInvitation[];
  items: RFQLine[]; // Legacy and canonical line array
  lines?: RFQLine[];
  quotations?: SupplierQuotation[];
  award?: RFQAward;
  evaluationNotes?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  version?: number;
  correlationId?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 4. VENDOR QUOTATION & COMPARISON MATRIX ENGINE ====================

export type SupplierQuotationStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'SELECTED'
  | 'ACCEPTED' 
  | 'PARTIALLY_ACCEPTED' 
  | 'REJECTED' 
  | 'REVISED';

export type VendorQuotationStatus = SupplierQuotationStatus;

export interface SupplierQuotationLine {
  id: string;
  quotationId: string;
  rfqLineId?: string;
  rfqItemId?: string; // Legacy alias
  prLineId?: string;
  productId?: string;
  variantId?: string;
  itemSku: string;
  itemName: string;
  supplierItemCode?: string;
  quotedQuantity?: number;
  offeredQty?: number; // Legacy alias
  quotedUOM?: string;
  uom?: string; // Legacy alias
  baseQuantity?: number;
  baseUOM?: string;
  uomConversionFactor?: number;
  unitPrice: number;
  normalizedUnitPrice?: number; // Converted to RFQ Currency & Base UOM
  discountPercent?: number;
  discountAmount?: number;
  taxCategoryId?: string;
  taxCategoryCode?: string;
  taxRate?: number;
  taxAmount?: number;
  lineTotal?: number;
  totalPrice?: number; // Legacy alias
  lineTotalBaseCurrency?: number;
  deliveryLeadTimeDays?: number;
  leadTimeDays?: number;
  promisedDeliveryDate?: string;
  deliveryDate?: string; // Legacy alias
  technicalScore?: number;
  commercialScore?: number;
  overallScore?: number;
  complianceConfirmed?: boolean;
  remarks?: string;
  isAwarded?: boolean;
  awardedQuantity?: number;
}

export type VendorQuotationItem = SupplierQuotationLine;

export interface SupplierQuotationScore {
  priceScore: number;
  leadTimeScore: number;
  qualityScore: number;
  commercialScore: number;
  compositeScore: number;
  ranking: number;
  scoringBreakdown: Record<string, string>;
}

export interface SupplierQuotation {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  rfqId: string;
  rfqNumber: string;
  quotationNumber: string; // Supplier's quote ref
  internalQuotationNumber?: string; // AM ERP internal sequence
  supplierId?: string;
  vendorId?: string; // Legacy alias
  supplierCode?: string;
  supplierName?: string;
  vendorName?: string; // Legacy alias
  quotationDate: string;
  validUntil: string;
  currency: string;
  exchangeRate: number;
  exchangeRateDate?: string;
  paymentTermsId?: string;
  paymentTermsName?: string;
  incotermsId?: string;
  incotermsCode?: string;
  deliveryLeadTimeDays?: number;
  leadTimeDays?: number;
  subtotalAmount?: number;
  discountAmount?: number;
  freightAmount?: number;
  taxAmount?: number;
  totalAmount?: number; // Legacy alias
  totalGrossAmount?: number;
  totalGrossAmountBaseCurrency?: number;
  status: SupplierQuotationStatus;
  items: SupplierQuotationLine[]; // Legacy and canonical
  lines?: SupplierQuotationLine[];
  revisionNumber?: number;
  previousRevisionId?: string;
  revisionReason?: string;
  overallScore?: number;
  evaluationScore?: SupplierQuotationScore;
  supplierNotes?: string;
  notes?: string;
  version?: number;
  correlationId?: string;
  createdAt: string;
  updatedAt?: string;
}

export type VendorQuotation = SupplierQuotation;

export interface QuotationComparisonMatrixItem {
  itemSku: string;
  itemName: string;
  requestedQty: number;
  uom: string;
  quotes: {
    vendorId: string;
    vendorName: string;
    unitPrice: number;
    totalPrice: number;
    deliveryDate: string;
    leadTimeDays: number;
    technicalScore: number;
    commercialScore: number;
    overallScore: number;
    isSelected: boolean;
  }[];
  winningVendorId?: string;
  winningVendorName?: string;
}

export interface RFQComparisonReport {
  rfqId: string;
  rfqNumber: string;
  generatedAt: string;
  currency: string;
  lines: Array<{
    rfqLineId: string;
    itemSku: string;
    itemName: string;
    targetQuantity: number;
    targetUOM: string;
    baseQuantity: number;
    baseUOM: string;
    offers: Array<{
      quotationId: string;
      quotationNumber: string;
      supplierId: string;
      supplierName: string;
      quotedQuantity: number;
      quotedUOM: string;
      unitPrice: number;
      normalizedUnitPrice: number;
      discountPercent: number;
      taxRate: number;
      lineTotal: number;
      lineTotalBaseCurrency: number;
      leadTimeDays: number;
      score: number;
      isAwarded?: boolean;
    }>;
  }>;
  totalComparisons: Array<{
    quotationId: string;
    quotationNumber: string;
    supplierId: string;
    supplierName: string;
    totalGrossAmount: number;
    totalGrossAmountBaseCurrency: number;
    currency: string;
    leadTimeDays: number;
    compositeScore: number;
    rank: number;
    explanation: string;
    scoringBreakdown?: Record<string, string>;
  }>;
}

export type AwardType = 'SINGLE_SUPPLIER' | 'SPLIT_AWARD' | 'LINE_BY_LINE';

export interface RFQAwardLine {
  id: string;
  awardId: string;
  rfqLineId: string;
  prLineId?: string;
  quotationId: string;
  quotationLineId: string;
  supplierId: string;
  supplierCode?: string;
  supplierName: string;
  productId: string;
  itemSku: string;
  itemName: string;
  awardedQuantity: number;
  awardedUOM: string;
  baseQuantity: number;
  baseUOM: string;
  unitPrice: number;
  currency: string;
  exchangeRate: number;
  lineTotal: number;
  lineTotalBaseCurrency: number;
  deliveryLeadTimeDays: number;
  promisedDeliveryDate?: string;
  reason?: string;
}

export interface RFQAward {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  rfqId: string;
  rfqNumber: string;
  awardNumber: string; // e.g. AWD-2026-0001
  awardType: AwardType;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'READY_FOR_PO' | 'PO_CREATED';
  awardedBy: string;
  awardedByName: string;
  awardedAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  justification: string;
  lines: RFQAwardLine[];
  items?: RFQAwardLine[]; // Alias
  totalAwardedAmount: number;
  totalAwardedAmountBaseCurrency: number;
  currency: string;
  isConsumedByPO: boolean;
  purchaseOrderIds?: string[];
  version: number;
  correlationId?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 5. PURCHASE ORDER (PO) ENGINE ====================

export type POType = 
  | 'STANDARD' 
  | 'CONTRACT_RELEASE' 
  | 'BLANKET' 
  | 'SERVICE' 
  | 'DIRECT';

export type POStatus = 
  | 'DRAFT' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'ISSUED'
  | 'ISSUED_TO_VENDOR' 
  | 'ACKNOWLEDGED'
  | 'ACKNOWLEDGED_BY_VENDOR'
  | 'PARTIALLY_RECEIVED' 
  | 'PARTIAL_RECEIVED'
  | 'DELIVERED'
  | 'PARTIALLY_DELIVERED'
  | 'FULLY_RECEIVED' 
  | 'CLOSED' 
  | 'CANCELLED' 
  | 'REJECTED'
  | 'ON_HOLD';

export type POPricingSource = 
  | 'CONTRACT' 
  | 'RFQ_AWARD' 
  | 'PRICE_LIST' 
  | 'BASE_PRICE' 
  | 'MANUAL';

export interface ContractPriceSnapshot {
  contractId?: string;
  contractNumber?: string;
  contractType?: 'FIXED' | 'TIERED' | 'INDEXED' | 'VOLUME_DISCOUNT' | 'FRAMEWORK';
  ruleId?: string;
  priceType: 'FIXED' | 'TIERED' | 'INDEXED' | 'VOLUME_DISCOUNT';
  agreedUnitPrice: number;
  agreedCurrency: string;
  exchangeRateAtSnapshot: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  minCommitmentQty?: number;
  maxCommitmentQty?: number;
  pricingTierApplied?: string;
  pricingTier?: string;
  discountPercent?: number;
  snapshotTimestamp: string;
  snapshotHash?: string;
  sha256Seal: string;
}

export type POPriceSnapshot = ContractPriceSnapshot;

export interface PODeliveryScheduleItem {
  id: string;
  poId: string;
  poLineId: string;
  scheduleLineNumber: number;
  scheduledDate: string;
  deliveryDate?: string; // Alias
  scheduledQuantity: number;
  scheduledQty?: number; // Alias
  receivedQuantity: number;
  openQuantity: number;
  status: 'PENDING' | 'IN_TRANSIT' | 'PARTIALLY_DELIVERED' | 'DELIVERED' | 'CANCELLED';
  warehouseId?: string;
  deliveryAddress?: string;
  notes?: string;
}

export interface PurchaseOrderItem {
  id: string;
  poId?: string;
  lineNumber?: number;
  productId?: string;
  variantId?: string;
  itemSku: string;
  itemName: string;
  description?: string;
  supplierItemCode?: string;
  supplierItemName?: string;
  warehouseId?: string;
  warehouseCode?: string;
  warehouseName?: string;
  orderedQty?: number;
  orderedQuantity?: number; // Alias
  quantityOrdered?: number; // Alias
  receivedQty?: number;
  receivedQuantity?: number; // Alias
  quantityReceived?: number; // Alias
  billedQuantity?: number;
  quantityInvoiced?: number; // Alias
  returnedQty?: number;
  returnedQuantity?: number; // Alias
  quantityReturned?: number; // Alias
  openQty?: number;
  openQuantity?: number; // Alias
  tolerancePercent?: number;
  overDeliveryTolerancePercent?: number;
  underDeliveryTolerancePercent?: number;
  version?: number;
  uom: string;
  orderedUOM?: string; // Alias
  baseQuantity?: number;
  baseUOM?: string;
  uomConversionFactor?: number;
  pricingSource?: POPricingSource;
  pricingRuleId?: string;
  contractPriceSnapshot?: ContractPriceSnapshot;
  contractPricingSnapshot?: ContractPriceSnapshot;
  unitPrice: number;
  listPrice?: number;
  netUnitPrice?: number;
  taxCategoryId?: string;
  taxCategoryCode?: string;
  taxRate?: number;
  taxAmount?: number;
  discountPercent?: number;
  discountRate?: number; // Alias
  discountAmount?: number;
  totalAmount?: number;
  lineTotal?: number; // Alias
  lineTotalBaseCurrency?: number;
  requiredDeliveryDate?: string;
  promisedDeliveryDate?: string;
  deliverySchedules?: PODeliveryScheduleItem[];
  accountAssignment?: {
    glAccount?: string;
    costCenterId?: string;
    profitCenterId?: string;
    projectId?: string;
    departmentId?: string;
  };
  prLineId?: string;
  rfqLineId?: string;
  awardLineId?: string;
  status?: 'OPEN' | 'PARTIAL' | 'FULFILLED' | 'CANCELLED' | 'CLOSED';
  notes?: string;
}

export type PurchaseOrderLine = PurchaseOrderItem;

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  poNumber: string; // e.g. PO-2026-0001
  poType?: POType;
  vendorId: string;
  vendorCode?: string;
  vendorName: string;
  vendorContactPerson?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  sourceDocumentType?: 'PR' | 'RFQ_AWARD' | 'CONTRACT' | 'DIRECT' | 'NONE';
  sourceDocumentId?: string;
  sourceDocumentNumber?: string;
  contractId?: string;
  contractNumber?: string;
  contractType?: string;
  prId?: string;
  prNumber?: string;
  rfqId?: string;
  rfqNumber?: string;
  awardId?: string;
  awardNumber?: string;
  rfqAwardId?: string;
  purchasingOrgId?: string;
  buyerGroupId?: string;
  buyerId?: string;
  buyerName?: string;
  poDate?: string;
  orderDate?: string; // Alias
  effectiveDate?: string;
  expectedDeliveryDate?: string;
  validUntil?: string;
  paymentTermsId?: string;
  paymentTermsCode?: string;
  paymentTermsName?: string;
  incotermsId?: string;
  incotermsCode?: string;
  incotermsLocation?: string;
  currency: string;
  exchangeRate: number;
  exchangeRateDate?: string;
  items: PurchaseOrderItem[];
  lines?: PurchaseOrderItem[]; // Alias
  subtotalAmount?: number;
  subtotal?: number; // Alias
  subtotalAmountBaseCurrency?: number;
  taxAmount?: number;
  taxTotal?: number; // Alias
  taxAmountBaseCurrency?: number;
  discountAmount?: number;
  discountAmountBaseCurrency?: number;
  totalAmount?: number;
  grandTotal?: number; // Alias
  totalAmountBaseCurrency?: number;
  baseCurrencyTotal?: number; // Legacy alias
  status: POStatus;
  deliveryStatus?: 'PENDING' | 'PARTIAL' | 'DELIVERED' | 'CANCELLED';
  tolerancePercent?: number;
  overDeliveryTolerancePercent?: number;
  approvalStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  approvalSteps?: any[];
  approvalWorkflow?: any; // Alias
  approvalLevel?: number;
  currentApproverRole?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  budgetStatus?: 'NOT_CHECKED' | 'RESERVED' | 'COMMITTED' | 'EXCEEDED';
  budgetCheckResult?: ProcurementBudgetCheckResult;
  departmentId?: string;
  costCenterId?: string;
  issuedAt?: string;
  vendorConfirmationRef?: string;
  version?: number;
  currentVersion?: number; // Legacy alias
  amendmentCount?: number;
  deliveryScheduleCount?: number;
  shippingAddress?: string;
  billingAddress?: string;
  termsAndConditions?: string;
  notes?: string;
  digitalSignature?: string;
  correlationId?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 6. PURCHASE APPROVAL WORKFLOW ENGINE ====================

export interface PurchaseApprovalRule {
  id: string;
  tenantId: string;
  companyId: string;
  documentType: 'PR' | 'PO' | 'AMENDMENT' | 'RETURN';
  minAmount: number;
  maxAmount: number;
  requiredRoles: UserRole[];
  approverUserIds?: string[];
  stepNumber: number;
  description?: string;
  isActive: boolean;
}

export interface PurchaseApprovalStep {
  id: string;
  documentId: string;
  documentType: 'PR' | 'PO' | 'AMENDMENT' | 'RETURN';
  stepNumber: number;
  approverRole: UserRole | string;
  approverUserId?: string;
  approverName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  actionDate?: string;
  comments?: string;
  digitalSignature?: string;
}

// ==================== 7. PURCHASE AMENDMENTS & VERSIONING ENGINE ====================

export interface PurchaseOrderAmendment {
  id: string;
  poId: string;
  poNumber: string;
  amendmentNumber: string; // e.g. AMD-PO-2026-0001-01
  version: number;
  requestedBy: string;
  requestedByName: string;
  requestedDate: string;
  amendmentReason: string;
  changesDescription: string;
  previousTotalAmount: number;
  newTotalAmount: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  snapshotData: Partial<PurchaseOrder>;
  createdAt: string;
}

// ==================== 8. PARTIAL DELIVERIES & GOODS RECEIPT INTEGRATION ====================

export type GoodsReceiptStatus = 
  | 'DRAFT' 
  | 'POSTED' 
  | 'QUALITY_PENDING' 
  | 'ACCEPTED' 
  | 'PARTIALLY_ACCEPTED' 
  | 'QUARANTINED' 
  | 'REJECTED' 
  | 'COMPLETED' 
  | 'REVERSED' 
  | 'CANCELLED';

export type QualityInspectionStatus = 
  | 'PENDING' 
  | 'PENDING_INSPECTION'
  | 'APPROVED' 
  | 'PARTIALLY_ACCEPTED' 
  | 'PARTIALLY_APPROVED'
  | 'REJECTED' 
  | 'QUARANTINED';

export type LandedCostComponentType = 'FREIGHT' | 'CUSTOMS' | 'INSURANCE' | 'HANDLING' | 'OTHER';

export type LandedCostAllocationBasis = 'BY_VALUE' | 'BY_QUANTITY' | 'BY_WEIGHT';

export interface LandedCostComponent {
  id: string;
  componentType: LandedCostComponentType;
  description: string;
  vendorId?: string;
  vendorName?: string;
  amount: number;
  currency: string;
  allocationBasis: LandedCostAllocationBasis;
}

export interface OverDeliveryToleranceRule {
  poLineTolerancePercent?: number;
  vendorTolerancePercent?: number;
  systemDefaultTolerancePercent?: number;
  allowOverride?: boolean;
}

export interface GoodsReceiptItem {
  id: string;
  grnId: string;
  poId: string;
  poItemId: string;
  itemSku: string;
  itemName: string;
  productId?: string;
  variantId?: string;
  requestedUOM?: string;
  receivedUOM: string;
  receivedQty: number;
  baseQuantity: number;
  baseUOM: string;
  uomConversionFactor: number;
  unitCost: number;
  totalCost: number;
  warehouseId: string;
  warehouseName?: string;
  locationId?: string;
  binId?: string;
  binCode?: string;
  batchNumber?: string;
  lotNumber?: string;
  lotId?: string;
  serialNumbers?: string[];
  expiryDate?: string;
  manufactureDate?: string;
  qualityStatus: QualityInspectionStatus;
  acceptedQty: number;
  rejectedQty: number;
  quarantinedQty: number;
  rejectionReason?: string;
  quarantineReason?: string;
  inspectionNotes?: string;
  landedCostAllocated: number;
  capitalizedUnitCost: number;
  capitalizedTotalCost: number;
  status?: 'OPEN' | 'PARTIAL' | 'FULFILLED' | 'ACCEPTED' | 'REJECTED' | 'QUARANTINED';
  version: number;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  warehouseId: string;
  warehouseName?: string;
  vendorId: string;
  vendorName: string;
  poId: string;
  poNumber: string;
  receivedAt: string;
  receivedBy: string;
  receivedByName?: string;
  status: GoodsReceiptStatus;
  qualityStatus: QualityInspectionStatus;
  items: GoodsReceiptItem[];
  totalReceivedQuantity: number;
  totalReceivedAmount: number;
  landedCosts?: LandedCostComponent[];
  landedCostTotal: number;
  capitalizedGrandTotal: number;
  currency: string;
  exchangeRate: number;
  baseCurrencyTotal?: number;
  financialEventId?: string;
  journalEntryId?: string;
  inventoryMovementReference?: string;
  reversalReason?: string;
  reversedAt?: string;
  reversedBy?: string;
  notes?: string;
  version: number;
  digitalSignature?: string;
  correlationId?: string;
  sourceDocumentType?: string;
  sourceDocumentId?: string;
  createdAt: string;
  updatedAt: string;
}

export type PartialDeliveryReceiptItem = {
  itemSku: string;
  orderedQty: number;
  previouslyReceivedQty: number;
  newlyReceivedQty: number;
  remainingOpenQty: number;
  status: 'OPEN' | 'PARTIAL' | 'FULFILLED';
};

export interface PartialDeliveryReceiptResult {
  poId: string;
  poNumber: string;
  goodsReceiptId: string;
  goodsReceiptNumber: string;
  receivedItems: PartialDeliveryReceiptItem[];
  overallPOStatus: POStatus;
  financialEventId?: string;
  postedAt: string;
}

// ==================== 9. VENDOR RETURNS ENGINE ====================

export type VendorReturnStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SHIPPED_TO_VENDOR' | 'CANCELLED';

export interface VendorReturnItem {
  id: string;
  returnId: string;
  poItemId?: string;
  itemSku: string;
  itemName: string;
  returnedQty: number;
  uom: string;
  unitCost: number;
  totalCost: number;
  batchNumber?: string;
  serialNumber?: string;
  reason: string;
}

export interface VendorReturnNote {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  returnNumber: string; // e.g. VRN-2026-0001
  poId: string;
  poNumber: string;
  goodsReceiptId?: string;
  goodsReceiptNumber?: string;
  vendorId: string;
  vendorName: string;
  warehouseId: string;
  warehouseName?: string;
  returnDate: string;
  reason: 'DEFECTIVE' | 'OVER_DELIVERY' | 'WRONG_SPECIFICATION' | 'DAMAGED_IN_TRANSIT' | 'OTHER';
  items: VendorReturnItem[];
  totalReturnAmount: number;
  status: VendorReturnStatus;
  financialQueueRef?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==================== 10. PURCHASE DOCUMENT AUDIT TRAIL ENGINE ====================

export type PurchaseAuditAction = 
  | 'PR_CREATED'
  | 'PR_UPDATED'
  | 'PR_SUBMITTED'
  | 'PR_BUDGET_CHECKED'
  | 'PR_APPROVED'
  | 'PR_REJECTED'
  | 'PR_CANCELLED'
  | 'RFQ_CREATED'
  | 'RFQ_UPDATED'
  | 'RFQ_SUBMITTED'
  | 'RFQ_APPROVED'
  | 'RFQ_REJECTED'
  | 'RFQ_MARKED_READY'
  | 'RFQ_PUBLISHED'
  | 'RFQ_INVITATIONS_SENT'
  | 'RFQ_SUPPLIER_DECLINED'
  | 'RFQ_RESPONSE_LOGGED'
  | 'RFQ_EVALUATION_STARTED'
  | 'RFQ_AWARDED'
  | 'RFQ_CANCELLED'
  | 'RFQ_CLOSED'
  | 'RFQ_ISSUED'
  | 'QUOTATION_SUBMITTED'
  | 'QUOTATION_REVISED'
  | 'QUOTATION_EVALUATED'
  | 'AWARD_CREATED'
  | 'AWARD_APPROVED'
  | 'AWARD_REJECTED'
  | 'PO_CREATED'
  | 'PO_UPDATED'
  | 'PO_SUBMITTED'
  | 'PO_APPROVED'
  | 'PO_REJECTED'
  | 'PO_ISSUED'
  | 'PO_ACKNOWLEDGED'
  | 'PO_AMENDED'
  | 'PO_CANCELLED'
  | 'PO_CLOSED'
  | 'PO_SCHEDULE_UPDATED'
  | 'PO_PRICE_OVERRIDDEN'
  | 'PO_BUDGET_CHECKED'
  | 'PO_LINE_CANCELLED'
  | 'PO_CONVERTED_FROM_PR'
  | 'PO_CONVERTED_FROM_AWARD'
  | 'PARTIAL_RECEIPT_POSTED'
  | 'FULL_RECEIPT_POSTED'
  | 'GRN_CREATED'
  | 'GRN_POSTED'
  | 'GRN_QUALITY_DECISION'
  | 'GRN_QUARANTINED'
  | 'GRN_REJECTED'
  | 'GRN_REVERSED'
  | 'LANDED_COST_ALLOCATED'
  | 'GOODS_RECEIPT_POSTED'
  | 'INVENTORY_RECEIPT_VALUATION'
  | 'VENDOR_RETURN_CREATED'
  | 'VENDOR_RETURN_APPROVED'
  | 'VENDOR_RETURN_SHIPPED'
  | 'VENDOR_RETURN_POSTED'
  | 'ERS_INVOICE_GENERATED'
  | 'CONSIGNMENT_WITHDRAWAL_LOGGED'
  | 'CONSIGNMENT_SETTLEMENT_POSTED'
  | 'LANDED_COST_VARIANCE_ADJUSTED'
  | 'SUPPLIER_SCORECARD_EVALUATED'
  | 'VENDOR_PREPAYMENT_RECORDED'
  | 'VENDOR_PREPAYMENT_APPLIED';

export interface PurchaseAuditRecord {
  id: string;
  auditId?: string;
  documentId?: string;
  action?: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  warehouseId?: string;
  actionType: PurchaseAuditAction;
  performedBy: string;
  performedByName: string;
  performedAt: string;
  targetDocumentType: 'PR' | 'RFQ' | 'QUOTATION' | 'AWARD' | 'PO' | 'AMENDMENT' | 'RECEIPT' | 'RETURN' | 'GRN' | 'VRN' | 'ERS' | 'CONSIGNMENT' | 'SCORECARD' | 'PREPAYMENT';
  targetDocumentId: string;
  targetDocumentNumber: string;
  details: string;
  previousState?: string;
  newState?: string;
  reason?: string;
  correlationId?: string;
  version?: number;
  ipAddress?: string;
  immutableHash: string;
}

// ==================== 11. EVALUATED RECEIPT SETTLEMENT (ERS) TYPES ====================

export type ERSStatus = 'PENDING' | 'GENERATED' | 'POSTED' | 'FAILED' | 'CANCELLED';

export interface ERSInvoiceItem {
  id: string;
  grnItemId: string;
  poItemId: string;
  itemSku: string;
  itemName: string;
  acceptedQty: number;
  uom: string;
  contractUnitPrice: number;
  lineNetAmount: number;
  taxPercent: number;
  taxAmount: number;
  lineGrossAmount: number;
}

export interface ERSInvoice {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  ersNumber: string; // e.g. ERS-2026-0001
  selfBillingInvoiceNumber: string; // e.g. SBI-2026-0001
  grnId: string;
  grnNumber: string;
  poId: string;
  poNumber: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  postingDate: string;
  dueDate: string;
  currency: string;
  exchangeRate: number;
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
  status: ERSStatus;
  items: ERSInvoiceItem[];
  voucherId?: string;
  voucherNumber?: string;
  grirClearingId?: string;
  generatedBy: string;
  generatedAt: string;
  digitalSignature?: string;
  immutableHash: string;
}

export interface ERSRunParams {
  tenantId: string;
  companyId: string;
  vendorId?: string;
  cutoffDate: string;
  taxPercent?: number;
  performedBy: string;
}

export interface ERSRunResult {
  runId: string;
  timestamp: string;
  processedGRNCount: number;
  generatedInvoicesCount: number;
  totalGrossAmount: number;
  invoices: ERSInvoice[];
}

// ==================== 12. VENDOR CONSIGNMENT INVENTORY & SETTLEMENT TYPES ====================

export type ConsignmentAgreementStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
export type ConsignmentWithdrawalStatus = 'LOGGED' | 'SETTLED' | 'CANCELLED';

export interface ConsignmentAgreement {
  id: string;
  tenantId: string;
  companyId: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  agreementNumber: string;
  itemSku: string;
  itemName: string;
  agreedPrice: number;
  currency: string;
  uom: string;
  warehouseId: string;
  warehouseName?: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: ConsignmentAgreementStatus;
  taxPercent: number;
  createdAt: string;
}

export interface ConsignmentStockRecord {
  id: string;
  tenantId: string;
  companyId: string;
  vendorId: string;
  vendorName: string;
  warehouseId: string;
  warehouseName?: string;
  itemSku: string;
  itemName: string;
  onHandConsignedQty: number;
  withdrawnQty: number;
  settledQty: number;
  openForSettlementQty: number;
  currency: string;
  agreedUnitPrice: number;
  lastMovementDate: string;
}

export interface ConsignmentWithdrawal {
  id: string;
  tenantId: string;
  companyId: string;
  withdrawalNumber: string; // e.g. CW-2026-0001
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  warehouseId: string;
  warehouseName?: string;
  itemSku: string;
  itemName: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  netAmount: number;
  taxPercent: number;
  taxAmount: number;
  grossAmount: number;
  currency: string;
  withdrawalDate: string;
  purpose: 'PRODUCTION' | 'SALES_FULFILLMENT' | 'INTERNAL_CONSUMPTION';
  costCenterId?: string;
  status: ConsignmentWithdrawalStatus;
  settlementId?: string;
  withdrawnBy: string;
  createdAt: string;
}

export interface ConsignmentSettlementItem {
  id: string;
  withdrawalId: string;
  withdrawalNumber: string;
  itemSku: string;
  itemName: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
}

export interface ConsignmentSettlement {
  id: string;
  tenantId: string;
  companyId: string;
  settlementNumber: string; // e.g. CS-2026-0001
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  totalQuantity: number;
  totalNetAmount: number;
  totalTaxAmount: number;
  totalGrossAmount: number;
  items: ConsignmentSettlementItem[];
  voucherId?: string;
  voucherNumber?: string;
  status: 'POSTED' | 'CANCELLED';
  settledBy: string;
  settledAt: string;
  immutableHash: string;
}

// ==================== 13. LANDED COST VARIANCE & CAPITALIZATION ADJUSTMENT TYPES ====================

export type LandedCostVarianceStatus = 'PENDING' | 'APPLIED' | 'REVERSED';

export interface LandedCostActualInvoice {
  id: string;
  tenantId: string;
  companyId: string;
  invoiceNumber: string;
  carrierOrAgentVendorId: string;
  carrierOrAgentVendorName: string;
  grnId: string;
  grnNumber: string;
  componentType: LandedCostComponentType;
  estimatedAmount: number;
  actualAmount: number;
  varianceAmount: number; // actual - estimated
  currency: string;
  invoiceDate: string;
  postingDate: string;
}

export interface LandedCostVarianceAllocation {
  goodsReceiptItemId: string;
  itemSku: string;
  itemName: string;
  receivedQty: number;
  inventoryValueBase: number;
  allocatedEstimatedCost: number;
  allocatedActualCost: number;
  varianceAdjustment: number;
  revisedCapitalizedUnitCost: number;
}

export interface LandedCostVarianceAdjustment {
  id: string;
  tenantId: string;
  companyId: string;
  adjustmentNumber: string; // e.g. LCA-2026-0001
  grnId: string;
  grnNumber: string;
  componentType: LandedCostComponentType;
  estimatedCostTotal: number;
  actualCostTotal: number;
  totalVariance: number;
  allocationBasis: LandedCostAllocationBasis;
  allocations: LandedCostVarianceAllocation[];
  status: LandedCostVarianceStatus;
  postedBy: string;
  postedAt: string;
  immutableHash: string;
}

// ==================== 14. MULTI-CRITERIA SUPPLIER SCORECARDING & EVALUATION TYPES ====================

export type SupplierTier = 'TIER_A_STRATEGIC' | 'TIER_B_PREFERRED' | 'TIER_C_STANDARD' | 'TIER_D_HIGH_RISK';
export type SupplierStatusRecommendation = 'PREFERRED' | 'APPROVED' | 'PROBATION' | 'BLOCKED';

export interface ScorecardPillarScore {
  pillar: 'QUALITY' | 'DELIVERY' | 'COMMERCIAL_PRICE' | 'SERVICE_COMPLIANCE';
  weight: number; // e.g. 0.35 = 35%
  rawScore: number; // 0 to 100
  weightedScore: number; // rawScore * weight
  metrics: Record<string, number | string>;
}

export interface SupplierScorecard {
  id: string;
  tenantId: string;
  companyId: string;
  scorecardId: string; // e.g. SC-2026-0001
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  evaluationPeriod: string; // e.g. '2026-Q3' or '2026-08'
  overallScore: number; // 0 to 100
  tier: SupplierTier;
  recommendedStatus: SupplierStatusRecommendation;
  pillars: ScorecardPillarScore[];
  totalOrdersAnalyzed: number;
  totalSpendAnalyzed: number;
  evaluatorNotes?: string;
  evaluatedBy: string;
  evaluatedAt: string;
  immutableHash: string;
}

export interface SupplierEvaluationWeightConfig {
  qualityWeight: number; // e.g. 0.35 (35%)
  deliveryWeight: number; // e.g. 0.30 (30%)
  priceWeight: number; // e.g. 0.20 (20%)
  serviceWeight: number; // e.g. 0.15 (15%)
}

// ==================== 15. VENDOR PREPAYMENTS & AMORTIZATION TYPES ====================

export type PrepaymentStatus = 'POSTED' | 'PARTIALLY_APPLIED' | 'FULLY_APPLIED' | 'CANCELLED';

export interface VendorPrepayment {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  prepaymentNumber: string; // e.g. ADV-2026-0001
  poId: string;
  poNumber: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  paymentDate: string;
  currency: string;
  totalPrepaidAmount: number;
  appliedAmount: number;
  remainingAmount: number;
  paymentMethod: string;
  bankAccountId?: string;
  reference?: string;
  status: PrepaymentStatus;
  createdBy: string;
  createdAt: string;
  immutableHash: string;
}

export interface PrepaymentApplicationRecord {
  id: string;
  prepaymentId: string;
  prepaymentNumber: string;
  voucherId: string;
  voucherNumber: string;
  appliedAmount: number;
  applicationDate: string;
  appliedBy: string;
  remainingPrepaymentBalance: number;
  remainingVoucherBalance: number;
}
