/**
 * AM Business Platform - Phase 3.1 Enterprise Sales & Point of Sale (POS) Domain Types
 * Target Architecture: SAP S/4HANA SD (Sales and Distribution), Oracle SCM Order Management, Dynamics 365 Commerce & Retail
 * Architecture Baseline: v2.8
 * Strict Domain-Driven Design (DDD) & Event-Driven Financial Architecture
 */

// ==================== 1. SALES ORDER LIFECYCLE & QUOTATIONS ====================

export type SalesOrderStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ON_HOLD'
  | 'CONFIRMED'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'CLOSED';

export type SalesQuotationStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'SENT_TO_CUSTOMER'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONVERTED_TO_ORDER';

export type OrderHoldReason =
  | 'CREDIT_LIMIT_EXCEEDED'
  | 'PRICING_DISCREPANCY'
  | 'COMPLIANCE_CHECK'
  | 'CUSTOMER_REQUEST'
  | 'INSUFFICIENT_STOCK'
  | 'MANAGEMENT_REVIEW';

export interface SalesOrderStateTransitionAudit {
  id: string;
  orderId: string;
  orderNumber: string;
  fromStatus: SalesOrderStatus;
  toStatus: SalesOrderStatus;
  reason?: string;
  performedBy: string;
  performedByName: string;
  performedByRole: string;
  timestamp: string;
  digitalSealSha256: string;
  metadata?: Record<string, any>;
}

export interface SalesQuotationLine {
  id: string;
  itemSku: string;
  itemName: string;
  itemNameAr?: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  discountRate: number; // e.g. 0.05 for 5%
  discountAmount: number;
  taxCode: string;
  taxRate: number; // e.g. 0.15 for 15%
  taxAmount: number;
  lineTotal: number;
  availableStock?: number;
  notes?: string;
}

export interface SalesQuotation {
  id: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerNameAr?: string;
  customerEmail?: string;
  customerPhone?: string;
  salespersonId: string;
  salespersonName: string;
  issueDate: string;
  validUntil: string;
  currency: string;
  exchangeRate: number;
  lines: SalesQuotationLine[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  status: SalesQuotationStatus;
  termsAndConditions?: string;
  convertedSalesOrderId?: string;
  convertedSalesOrderNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderLine {
  id: string;
  lineNumber: number;
  itemSku: string;
  itemName: string;
  itemNameAr?: string;
  variantId?: string;
  variantName?: string;
  uom: string;
  warehouseId: string;
  warehouseName: string;
  quantityOrdered: number;
  quantityReserved: number;
  quantityFulfilled: number;
  quantityReturned: number;
  quantityCancelled: number;
  unitPrice: number;
  appliedPriceListId?: string;
  lineDiscountType: 'PERCENT' | 'FIXED' | 'PROMO';
  discountRate: number; // e.g. 0.10 for 10%
  discountAmount: number;
  discountApprovalRequired: boolean;
  discountApprovedBy?: string;
  taxJurisdictionId?: string;
  taxCode: string;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  estimatedDeliveryDate?: string;
  notes?: string;
}

export interface SalesOrder {
  id: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  orderNumber: string;
  quotationRefId?: string;
  quotationRefNumber?: string;
  customerPurchaseOrderNumber?: string;
  customerId: string;
  customerName: string;
  customerNameAr?: string;
  customerCategory: 'ENTERPRISE' | 'SME' | 'GOVERNMENT' | 'INDIVIDUAL' | 'WALK_IN';
  customerTaxNumber?: string;
  shippingAddress: string;
  billingAddress: string;
  salespersonId: string;
  salespersonName: string;
  orderDate: string;
  requestedDeliveryDate: string;
  currency: string;
  exchangeRate: number;
  paymentTermsCode: string;
  paymentMethodType: PaymentMethodType;
  priceListId?: string;
  lines: SalesOrderLine[];
  subtotal: number;
  headerDiscountRate: number;
  headerDiscountAmount: number;
  appliedCouponCode?: string;
  taxTotal: number;
  grandTotal: number;
  status: SalesOrderStatus;
  holdReason?: OrderHoldReason;
  holdNotes?: string;
  cancellationReason?: string;
  stockReservationStatus: 'UNRESERVED' | 'PARTIALLY_RESERVED' | 'FULLY_RESERVED';
  arInvoiceId?: string;
  arInvoiceNumber?: string;
  stateTransitions: SalesOrderStateTransitionAudit[];
  createdAt: string;
  updatedAt: string;
  sha256AuditSeal: string;
}

// ==================== 2. RETAIL POINT OF SALE (POS) ====================

export interface POSRegister {
  id: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  warehouseId: string;
  code: string;
  name: string;
  nameAr: string;
  currentShiftId?: string;
  isActive: boolean;
  cashDrawerStatus: 'OPEN' | 'CLOSED' | 'LOCKED';
  defaultCashAccountId: string;
  defaultBankAccountId: string;
  printerIpOrName?: string;
}

export type POSShiftStatus = 'OPEN' | 'CLOSING_REVIEW' | 'CLOSED' | 'RECONCILED';

export interface POSShiftCashMovement {
  id: string;
  shiftId: string;
  type: 'OPENING_FLOAT' | 'CASH_SALE' | 'CASH_REFUND' | 'PETTY_EXPENSE' | 'CASH_DROP' | 'SAFE_TRANSFER';
  amount: number;
  currency: string;
  reason?: string;
  receiptNumber?: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
}

export interface POSShift {
  id: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  warehouseId: string;
  registerId: string;
  registerCode: string;
  shiftNumber: string;
  cashierId: string;
  cashierName: string;
  supervisorId?: string;
  openedAt: string;
  closedAt?: string;
  status: POSShiftStatus;
  openingCashFloat: number;
  totalCashSales: number;
  totalCardSales: number;
  totalWalletSales: number;
  totalCreditSales: number;
  totalCashRefunds: number;
  totalCashDrops: number;
  totalPettyExpenses: number;
  expectedCashInDrawer: number;
  actualCountedCash?: number;
  cashVariance?: number; // actual - expected
  varianceReason?: string;
  varianceApprovedBy?: string;
  totalTransactionsCount: number;
  totalItemsSoldCount: number;
  zReportGenerated: boolean;
  zReportData?: Record<string, any>;
  cashMovements: POSShiftCashMovement[];
  createdAt: string;
  updatedAt: string;
}

export interface POSReceiptLine {
  id: string;
  itemSku: string;
  barcode?: string;
  itemName: string;
  itemNameAr?: string;
  variantDescription?: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  originalUnitPrice: number;
  discountAmount: number;
  discountPercentage: number;
  appliedPromoId?: string;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  costPrice?: number;
}

export type POSReceiptStatus =
  | 'COMPLETED'
  | 'HELD'
  | 'VOIDED'
  | 'REFUNDED'
  | 'EXCHANGED';

export interface POSReceipt {
  id: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  warehouseId: string;
  registerId: string;
  shiftId: string;
  receiptNumber: string;
  transactionType: 'SALE' | 'RETURN' | 'EXCHANGE';
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerTaxNumber?: string;
  isWalkInCustomer: boolean;
  cashierId: string;
  cashierName: string;
  lines: POSReceiptLine[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  payments: PaymentTransaction[];
  changeGiven: number;
  status: POSReceiptStatus;
  originalReceiptRefId?: string;
  originalReceiptRefNumber?: string;
  returnReason?: string;
  exchangeDifferenceAmount?: number;
  qrCodePayload?: string;
  sha256Seal: string;
  createdAt: string;
}

// ==================== 3. PAYMENT ENGINE ====================

export type PaymentMethodType =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'DIGITAL_WALLET'
  | 'CHEQUE'
  | 'CUSTOMER_CREDIT'
  | 'GIFT_CARD'
  | 'SPLIT'
  | 'ADVANCE_DEPOSIT';

export interface PaymentTransaction {
  id: string;
  method: PaymentMethodType;
  amount: number;
  currency: string;
  exchangeRate: number;
  referenceNumber?: string;
  cardBrand?: 'VISA' | 'MASTERCARD' | 'MADA' | 'AMEX' | 'OTHER';
  cardLast4?: string;
  walletProvider?: 'STC_PAY' | 'APPLE_PAY' | 'URPAY' | 'OTHER';
  chequeNumber?: string;
  chequeDueDate?: string;
  giftCardCode?: string;
  customerIdForCredit?: string;
  treasuryAccountCode: string;
  treasuryAccountId: string;
  transactionStatus: 'CAPTURED' | 'PENDING' | 'REFUNDED' | 'VOIDED';
  authCode?: string;
  capturedAt: string;
}

// ==================== 4. PRICING & VOLUME TIERS ====================

export interface VolumePriceTier {
  minQuantity: number;
  maxQuantity?: number;
  unitPrice: number;
  discountPercent?: number;
}

export interface EnterprisePriceList {
  id: string;
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  nameAr: string;
  currency: string;
  priceListType: 'RETAIL' | 'WHOLESALE' | 'VIP' | 'EXPORT' | 'BRANCH_CUSTOM';
  branchId?: string;
  isDefault: boolean;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  itemPrices: {
    itemSku: string;
    itemName: string;
    basePrice: number;
    volumeTiers?: VolumePriceTier[];
  }[];
}

// ==================== 5. DISCOUNT ENGINE ====================

export interface DiscountRule {
  id: string;
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  nameAr: string;
  discountType: 'LINE_PERCENT' | 'LINE_FIXED' | 'DOC_PERCENT' | 'DOC_FIXED' | 'CUSTOMER_TIER';
  value: number; // percentage or fixed amount
  maxDiscountThreshold: number; // e.g. 15% - beyond this requires manager approval
  applicableCustomerCategory?: string;
  applicableItemCategory?: string;
  minOrderValue?: number;
  requiresSupervisorApprovalAbove: number;
  isActive: boolean;
}

export interface DiscountApprovalRequest {
  id: string;
  orderOrReceiptNumber: string;
  requestedDiscountPercent: number;
  requestedDiscountAmount: number;
  maxAllowedPercent: number;
  cashierOrSalespersonId: string;
  cashierOrSalespersonName: string;
  approverUserId?: string;
  approverUserName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  requestedAt: string;
  respondedAt?: string;
}

// ==================== 6. PROMOTION ENGINE ====================

export type PromotionType =
  | 'BUY_X_GET_Y'
  | 'PERCENTAGE_DISCOUNT'
  | 'FIXED_DISCOUNT'
  | 'BUNDLE_PRICING'
  | 'QUANTITY_TIER'
  | 'SEASONAL'
  | 'COUPON_CODE';

export interface PromotionCampaign {
  id: string;
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  nameAr: string;
  type: PromotionType;
  couponCode?: string;
  startDate: string;
  endDate: string;
  minCartValue?: number;
  maxRedemptionsTotal?: number;
  redemptionsCount: number;
  buyQuantityRequired?: number;
  buyItemSku?: string;
  freeQuantityGranted?: number;
  freeItemSku?: string;
  discountPercent?: number;
  discountFixedAmount?: number;
  bundleItemSkus?: string[];
  bundleSpecialPrice?: number;
  isActive: boolean;
}

// ==================== 7. TAX ENGINE ABSTRACTION ====================

export interface SalesTaxJurisdiction {
  id: string;
  jurisdictionCode: string;
  jurisdictionName: string;
  defaultTaxRate: number; // e.g. 0.15 for VAT 15%
  isTaxInclusiveDefault: boolean;
  withholdingTaxRate: number;
  eInvoicingStandard: 'EGYPT_ETA' | 'ZATCA_PHASE2' | 'GCC_VAT' | 'GENERIC_VAT';
  roundingMethod: 'HALF_UP' | 'HALF_EVEN' | 'FLOOR';
  taxExemptionCodes: { code: string; description: string; descriptionAr: string }[];
}

export interface SalesTaxCalculationItem {
  itemSku: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxCode?: string;
  isTaxInclusive?: boolean;
  taxExemptionReasonCode?: string;
}

export interface SalesTaxCalculationResult {
  taxableSubtotal: number;
  exemptSubtotal: number;
  taxTotal: number;
  withholdingTaxTotal: number;
  grandTotal: number;
  lineTaxes: {
    itemSku: string;
    taxableAmount: number;
    taxRate: number;
    taxAmount: number;
    isExempt: boolean;
    lineTotalWithTax: number;
  }[];
}

// ==================== 8. SALES RETURNS & EXCHANGES ====================

export type SalesReturnType =
  | 'FULL_RETURN'
  | 'PARTIAL_RETURN'
  | 'RETURN_WITHOUT_INVOICE'
  | 'EXCHANGE';

export interface SalesReturnLine {
  id: string;
  itemSku: string;
  itemName: string;
  quantityReturned: number;
  unitPrice: number;
  refundAmount: number;
  returnReasonCode: string;
  returnReasonText: string;
  restockWarehouseId: string;
  condition: 'RESTOCKABLE_NEW' | 'DAMAGED_SCRAP' | 'NEEDS_INSPECTION';
}

export interface SalesReturn {
  id: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  returnNumber: string;
  returnType: SalesReturnType;
  originalDocumentType: 'SALES_ORDER' | 'POS_RECEIPT' | 'SALES_INVOICE' | 'NONE';
  originalDocumentId?: string;
  originalDocumentNumber?: string;
  customerId: string;
  customerName: string;
  lines: SalesReturnLine[];
  refundSubtotal: number;
  refundTaxTotal: number;
  refundGrandTotal: number;
  refundMethod: 'ORIGINAL_PAYMENT_METHOD' | 'CASH' | 'STORE_CREDIT' | 'AR_CREDIT_NOTE';
  storeCreditVoucherCode?: string;
  exchangeSalesOrderId?: string;
  approvedBy: string;
  status: 'COMPLETED' | 'PENDING_APPROVAL' | 'CANCELLED';
  financialEventId?: string;
  sha256Seal: string;
  createdAt: string;
}

// ==================== 9. SALES DOCUMENT NUMBERING CONFIG ====================

export interface SalesDocumentSequenceConfig {
  id: string;
  tenantId: string;
  companyId: string;
  documentType: 'QUOTATION' | 'SALES_ORDER' | 'SALES_INVOICE' | 'POS_RECEIPT' | 'SALES_RETURN' | 'CREDIT_NOTE';
  prefix: string;
  yearPrefix: boolean;
  nextNumber: number;
  zeroPad: number;
  suffix?: string;
}

// ==================== 10. SALES ANALYTICS & EXECUTIVE KPIS ====================

export interface SalesExecutiveMetrics {
  totalGrossSales: number;
  totalNetSales: number;
  totalPosSales: number;
  totalEnterpriseSales: number;
  totalOrdersCount: number;
  activeQuotationsCount: number;
  pendingOrderApprovalsCount: number;
  openShiftsCount: number;
  averageOrderValue: number;
  returnRatePercentage: number;
  topSellingProducts: {
    sku: string;
    name: string;
    quantitySold: number;
    revenue: number;
  }[];
  salesByChannel: {
    channel: 'RETAIL_POS' | 'ENTERPRISE_B2B' | 'ECOMMERCE' | 'DIRECT_QUOTATION';
    amount: number;
    percentage: number;
  }[];
}

// ==================== 11. OFFLINE TRANSACTION QUEUE & STATUS ====================

export type OfflineTransactionStatus =
  | 'QUEUED'
  | 'SYNCING'
  | 'SYNCED'
  | 'FAILED'
  | 'CONFLICT'
  | 'REQUIRES_REVIEW'
  | 'CANCELLED';

export type OfflineTransactionType =
  | 'SALE'
  | 'RETURN'
  | 'CUSTOMER_ORDER'
  | 'CASH_COLLECTION'
  | 'DISCOUNT_APPROVAL'
  | 'CUSTOMER_CREATION';

export interface OfflineTransactionQueueItem {
  id: string; // local transaction id
  globalCorrelationId: string;
  idempotencyKey: string;
  deviceId: string;
  deviceName?: string;
  userId: string;
  userName: string;
  companyId: string;
  branchId: string;
  terminalId?: string;
  timestamp: string;
  localSequence: number;
  syncStatus: OfflineTransactionStatus;
  transactionType: OfflineTransactionType;
  tempDocumentNumber: string;
  resolvedServerDocumentNumber?: string;
  resolvedServerDocumentId?: string;
  finalServerDocumentNumber?: string;
  finalServerDocumentId?: string;
  payload: Record<string, any>;
  retryCount: number;
  maxRetries: number;
  lastAttemptTimestamp?: string;
  nextRetryTimestamp?: string;
  errorMessage?: string;
  conflictDetails?: SyncConflictRecord;
  encryptedChecksumSha256: string;
  syncedAt?: string;
}

// ==================== 12. OFFLINE MOBILE FIELD SALES ====================

export interface MobileCustomerSnapshot {
  id: string;
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  nameAr?: string;
  phone: string;
  email?: string;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  priceListId?: string;
  paymentTerms: string;
  taxRegistrationNumber?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  status: 'ACTIVE' | 'ON_HOLD' | 'BLOCKED';
  snapshotTimestamp: string;
}

export interface MobileProductAvailabilitySnapshot {
  sku: string;
  barcode?: string;
  name: string;
  nameAr?: string;
  uom: string;
  basePrice: number;
  costPrice: number;
  qtyOnHand: number;
  qtyReserved: number;
  qtyAvailableOffline: number;
  safetyBuffer: number;
  category: string;
  isStale: boolean;
  snapshotTimestamp: string;
}

export interface SalesRepresentativeTarget {
  id: string;
  salesRepId: string;
  salesRepName: string;
  period: string; // e.g. '2026-Q3' or '2026-08'
  targetRevenue: number;
  achievedRevenue: number;
  targetVisitsCount: number;
  achievedVisitsCount: number;
  targetNewCustomers: number;
  achievedNewCustomers: number;
  targetCollectionsAmount: number;
  achievedCollectionsAmount: number;
  commissionRatePercent: number;
  commissionEarned: number;
}

export interface SalesRepresentativeActivity {
  id: string;
  salesRepId: string;
  salesRepName: string;
  customerId: string;
  customerName: string;
  activityType: 'VISIT_CHECKIN' | 'ORDER_TAKEN' | 'COLLECTION_MADE' | 'RETURN_PROCESSED' | 'NOTE_LOGGED';
  timestamp: string;
  location?: { lat: number; lng: number; address?: string };
  documentReference?: string;
  amount?: number;
  notes?: string;
  offlineGenerated: boolean;
}

// ==================== 13. OFFLINE DOCUMENT NUMBERING & LINEAGE ====================

export interface OfflineDocumentLineage {
  id: string;
  deviceId: string;
  tempDocumentNumber: string;
  documentType: OfflineTransactionType;
  createdAtOffline: string;
  syncEventId?: string;
  syncedAt?: string;
  serverDocumentId?: string;
  finalServerDocumentNumber?: string;
  status: 'TEMPORARY' | 'PROMOTED_TO_SERVER' | 'VOIDED';
  sha256Seal: string;
}

// ==================== 14. SYNCHRONIZATION ENGINE & IDEMPOTENCY ====================

export interface SyncBatchRequest {
  batchId: string;
  deviceId: string;
  userId: string;
  companyId: string;
  branchId: string;
  sentAt: string;
  items: OfflineTransactionQueueItem[];
}

export interface SyncBatchItemResult {
  localTransactionId: string;
  idempotencyKey: string;
  tempDocumentNumber: string;
  status: 'SUCCESS' | 'DUPLICATE_IGNORED' | 'CONFLICT' | 'VALIDATION_FAILED' | 'ERROR';
  serverDocumentId?: string;
  serverDocumentNumber?: string;
  financialEventId?: string;
  message: string;
  conflictDetails?: SyncConflictRecord;
}

export interface SyncBatchResponse {
  batchId: string;
  processedAt: string;
  totalItems: number;
  successCount: number;
  duplicateCount: number;
  conflictCount: number;
  failureCount: number;
  results: SyncBatchItemResult[];
  serverTimestamp: string;
}

export interface SyncAuditRecord {
  id: string;
  syncSessionId: string;
  deviceId: string;
  deviceName?: string;
  userId: string;
  userName: string;
  companyId: string;
  branchId: string;
  transactionId: string;
  transactionType: OfflineTransactionType;
  tempDocNumber: string;
  finalDocNumber?: string;
  attemptNumber: number;
  timestamp: string;
  syncResult: 'SUCCESS' | 'DUPLICATE_RESOLVED' | 'CONFLICT_DETECTED' | 'FAILED' | 'RECOVERED';
  errorMessage?: string;
  conflictType?: string;
  resolutionType?: string;
  correlationId: string;
  payloadChecksumSha256: string;
}

// ==================== 15. CONFLICT DETECTION & RESOLUTION ====================

export type SyncConflictType =
  | 'PRICE_MISMATCH'
  | 'INSUFFICIENT_STOCK'
  | 'CREDIT_LIMIT_EXCEEDED'
  | 'CUSTOMER_SUSPENDED'
  | 'ORDER_ALREADY_CANCELLED'
  | 'DOCUMENT_ALREADY_PROCESSED'
  | 'DISCOUNT_POLICY_BREACH'
  | 'USER_PERMISSION_REVOKED';

export type SyncConflictResolution =
  | 'AUTO_RESOLVED'
  | 'SERVER_WINS'
  | 'CLIENT_WINS'
  | 'MERGE_REQUIRED'
  | 'MANUAL_REVIEW';

export interface SyncConflictRecord {
  id: string;
  transactionId: string;
  tempDocNumber: string;
  conflictType: SyncConflictType;
  detectedAt: string;
  clientState: Record<string, any>;
  serverState: Record<string, any>;
  differenceExplanation: string;
  resolutionStatus: 'PENDING' | 'RESOLVED' | 'REJECTED';
  appliedResolution?: SyncConflictResolution;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  auditTrailSha256: string;
}

// ==================== 16. DEVICE & TERMINAL GOVERNANCE ====================

export interface POSDeviceMaster {
  id: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  branchName: string;
  deviceCode: string;
  deviceName: string;
  deviceType: 'MOBILE_PHONE' | 'TABLET' | 'DESKTOP_POS' | 'HANDHELD_TERMINAL';
  macAddressOrFingerprint: string;
  assignedUserId?: string;
  assignedUserName?: string;
  assignedTerminalId?: string;
  appVersion: string;
  registeredAt: string;
  lastSyncAt?: string;
  lastHeartbeatAt: string;
  isActive: boolean;
  isAuthorized: boolean;
  connectivityStatus: 'ONLINE' | 'OFFLINE' | 'SYNCING';
  localPendingQueueCount: number;
  deviceHealth: 'HEALTHY' | 'SYNC_DELAYED' | 'UNAUTHORIZED' | 'ERROR';
  allowedOfflineDays: number;
  securityTokenHash: string;
}

// ==================== 17. INDUSTRY CONFIGURATION LAYER ====================

export type IndustryProfileType =
  | 'RETAIL'
  | 'FASHION'
  | 'MOBILE_ACCESSORIES'
  | 'WHOLESALE'
  | 'MANUFACTURING'
  | 'RESTAURANT'
  | 'SERVICE_CENTER'
  | 'CONSTRUCTION'
  | 'IMPORT_EXPORT';

export type IndustryVerticalType = IndustryProfileType;
export type IndustryVertical = IndustryProfileType;

export interface IndustryProfileConfig {
  id: string;
  profileType: IndustryProfileType;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  isPreconfigured: boolean;
  isActive: boolean;

  // POS & Terminal Behavior
  posConfig: {
    enableBarcodeScanner: boolean;
    requireVariantSelection: boolean; // Fashion (Color / Size)
    enableImeiSerialTracking: boolean; // Mobile & Accessories
    enableTableManagement: boolean; // Restaurant
    enableKitchenDisplaySystem: boolean; // Restaurant
    enableWeighingScaleIntegration: boolean;
    enableFastCashButtons: boolean;
    defaultPaymentMethod: PaymentMethodType;
    allowPriceOverride: boolean;
    allowNegativeStock: boolean;
  };

  // Sales Order & Quotation Behavior
  salesConfig: {
    requireCustomerSelection: boolean;
    defaultPriceListType: 'RETAIL' | 'WHOLESALE' | 'VIP' | 'EXPORT';
    enableVolumeTierDiscounts: boolean; // Wholesale
    enableJobOrderIntegration: boolean; // Service Center / Manufacturing
    enableCustomsDeclarationField: boolean; // Import/Export
    enableBillOfQuantitiesBOM: boolean; // Construction / Manufacturing
    enableWarrantyTracking: boolean; // Mobile & Service Center
    maxOrderDiscountThreshold: number;
    mandatoryPaymentTerms: boolean;
  };

  // Document Fields & Numbering
  documentConfig: {
    orderPrefix: string;
    invoicePrefix: string;
    receiptPrefix: string;
    returnPrefix: string;
    customFields: { key: string; label: string; labelAr: string; fieldType: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT'; required: boolean; options?: string[] }[];
  };

  // Approval & Financial Controls (Non-bypassable controls remain enforced)
  governanceConfig: {
    supervisorApprovalDiscountPercent: number;
    creditLimitBlockPolicy: 'HARD_BLOCK' | 'WARNING_WITH_OVERRIDE' | 'ALLOW';
    allowOfflineOperations: boolean;
    maxOfflineTransactionAgeHours: number;
  };
}

// ==================== 18. COMPLIANCE ADAPTER ARCHITECTURE ====================

export type ComplianceJurisdiction =
  | 'EGYPT_ETA'
  | 'ZATCA_PHASE2'
  | 'UAE_FTA'
  | 'GENERIC_STATUTORY';

export interface ComplianceTaxRegistration {
  taxRegistrationNumber: string;
  commercialRegistryNumber?: string;
  registeredTaxpayerName: string;
  jurisdiction: ComplianceJurisdiction;
  activityCode?: string;
  branchCode?: string;
}

export interface EgyptianEInvoicePayload {
  issuer: {
    type: 'B' | 'P';
    id: string; // Tax ID
    name: string;
    address: { country: string; governate: string; regionCity: string; street: string; buildingNumber: string };
  };
  receiver: {
    type: 'B' | 'P' | 'F';
    id: string;
    name: string;
    address: Record<string, string>;
  };
  documentType: 'I' | 'C' | 'D'; // Invoice, Credit Note, Debit Note
  documentTypeVersion: '1.0' | '0.9';
  dateTimeIssued: string;
  taxpayerActivityCode: string;
  internalID: string;
  invoiceLines: {
    description: string;
    itemType: 'GS1' | 'EGS';
    itemCode: string;
    unitType: string;
    quantity: number;
    unitValue: { currencySold: string; amountEGP: number };
    salesTotal: number;
    total: number;
    valueDifference: number;
    totalTaxableFees: number;
    netTotal: number;
    itemsDiscount: number;
    taxableItems: { taxType: string; amount: number; subType: string; rate: number }[];
  }[];
  totalDiscountAmount: number;
  totalSalesAmount: number;
  netAmount: number;
  taxTotals: { taxType: string; amount: number }[];
  totalAmount: number;
  extraDiscountAmount: number;
  totalItemsDiscountAmount: number;
  uuid?: string;
  submissionStatus: 'VALID' | 'SUBMITTED' | 'REJECTED' | 'PENDING';
}

export interface ZatcaPhase2Payload {
  invoiceUuid: string;
  invoiceCounter: number;
  previousInvoiceHashSha256: string;
  invoiceHashSha256: string;
  cryptographicStampEcdsa: string;
  tlvQrCodeBase64: string;
  clearanceStatus: 'CLEARED' | 'REPORTED' | 'NOT_REPORTED';
  zatcaWarnings?: string[];
  zatcaErrors?: string[];
}

export interface ComplianceValidationResult {
  isValid: boolean;
  jurisdiction: ComplianceJurisdiction;
  documentNumber: string;
  validationTimestamp: string;
  errors: string[];
  warnings: string[];
  formattedPayload?: any;
  qrCodeVerificationPayload?: string;
  digitalSealSha256: string;
}

// ==================== 19. DATA OWNERSHIP & UNIVERSAL EXPORT ====================

export type ExportFormatType = 'XLSX' | 'CSV' | 'JSON' | 'XML';

export type ExportDomainType =
  | 'ALL_DOMAINS'
  | 'CUSTOMERS'
  | 'PRODUCTS_CATALOG'
  | 'PRICE_LISTS'
  | 'SALES_ORDERS'
  | 'SALES_INVOICES'
  | 'PAYMENTS'
  | 'SALES_RETURNS'
  | 'POS_TRANSACTIONS'
  | 'POS_SHIFTS'
  | 'CASH_MOVEMENTS'
  | 'SYNC_AUDIT_LOGS'
  | 'INDUSTRY_CONFIGURATION';

export interface UniversalExportRequest {
  companyId: string;
  branchId?: string;
  domain: ExportDomainType;
  format: ExportFormatType;
  dateFrom?: string;
  dateTo?: string;
  preserveRelationalReferences: boolean;
}

export interface UniversalExportResult {
  id: string;
  domain: ExportDomainType;
  format: ExportFormatType;
  totalRecords: number;
  generatedAt: string;
  fileName: string;
  fileSizeBytes: number;
  dataPayload: string; // Base64 or formatted string
  sha256IntegrityHash: string;
}

export type SalesExportFormat = ExportFormatType;

export type ExportDatasetType =
  | 'ALL_COMPLETE_SALES_BUNDLE'
  | 'SALES_ORDERS_WITH_LINES'
  | 'POS_RECEIPTS_WITH_PAYMENTS'
  | 'ENTERPRISE_PRICE_LISTS'
  | 'SYNC_AUDIT_LOGS_AND_LINEAGE';

export interface HardeningAssertionResult {
  assertion: string;
  passed: boolean;
  expected?: any;
  actual?: any;
}

export interface HardeningScenarioResult {
  scenarioNumber: number;
  name: string;
  category: string;
  description: string;
  passed: boolean;
  durationMs: number;
  assertions: HardeningAssertionResult[];
  outputArtifacts?: Record<string, any>;
}

export interface HardeningTestSuiteReport {
  suiteName: string;
  totalScenarios: number;
  passedCount: number;
  failedCount: number;
  qualityGateStatus: 'PASS' | 'FAIL';
  executionDurationMs: number;
  testRunSha256: string;
  executedAt: string;
  results: HardeningScenarioResult[];
}

