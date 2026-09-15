export * from './generalLedger';
export * from './procurement';
export * from './accountsPayable';
export * from './accountsReceivable';
export * from './reporting';
export * from './fixedAssets';
export * from './treasury';
export * from './platform';
export * from './sales';
export * from './salesContracts';
export * from './outboundLogistics';
export * from './masterData';
export * from './manufacturing';
export * from './shopFloorQuality';
export * from './branding';
/**
 * AM Business Platform - Master Enterprise Architecture Types
 * Aligned with SAP, Oracle ERP Cloud, Microsoft Dynamics 365, and Odoo Enterprise Standards
 */

export type EditionType = 'Community' | 'Professional' | 'Enterprise';

export type UserRole = 
  | 'Super Admin'
  | 'Tenant Admin'
  | 'Finance Manager'
  | 'VP Finance'
  | 'Inventory Manager'
  | 'Sales Lead'
  | 'Purchasing Agent'
  | 'Requester'
  | 'Buyer'
  | 'Approver'
  | 'Procurement Manager'
  | 'Auditor'
  | 'HR Specialist';

export interface UserPermission {
  module: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'approve' | 'export')[];
}

export interface User {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  permissions: UserPermission[];
  active: boolean;
  createdAt: string;
  passwordHash?: string;
  pinHash?: string;
}

// ==================== MASTER DATA FOUNDATION ====================

export interface Tenant {
  id: string;
  name: string;
  code: string;
  edition: EditionType;
  ownerEmail: string;
  active?: boolean;
  createdAt: string;
  updatedAt?: string;
  isConfigured?: boolean;
}

export interface Company {
  id: string;
  tenantId: string;
  name?: string;
  legalName?: string;
  tradeName?: string;
  commercialRegister?: string;
  nameAr?: string;
  code?: string;
  taxNumber: string;
  currency?: string;
  baseCurrency?: string;
  country: string;
  countryCode?: string;
  state?: string;
  city?: string;
  taxSystemId?: string;
  taxSystemName?: string;
  taxRate?: number;
  timezone?: string;
  dateFormat?: string;
  numberFormat?: string;
  language?: string;
  fiscalYearStart?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Localization & Master Data Interfaces
export interface CountryMaster {
  id: string;
  code: string; // ISO 2 code e.g. 'EG', 'SA', 'AE', 'US'
  code3: string; // ISO 3 code e.g. 'EGY', 'SAU', 'ARE', 'USA'
  name: string;
  nameAr: string;
  flag: string; // Emoji flag e.g. 🇪🇬
  defaultCurrency: string; // e.g. 'EGP'
  defaultTimezone: string; // e.g. 'Africa/Cairo'
  defaultLanguage: string; // e.g. 'ar'
  defaultDateFormat: string; // e.g. 'DD/MM/YYYY'
  defaultNumberFormat: string; // e.g. '1,234.56'
  defaultTaxSystemId: string; // e.g. 'tax-sys-eg-vat'
  fiscalYearStartMonth: number; // e.g. 1 or 7
}

export interface StateProvinceMaster {
  id: string;
  countryCode: string;
  code: string;
  name: string;
  nameAr: string;
}

export interface CityMaster {
  id: string;
  countryCode: string;
  stateCode?: string;
  name: string;
  nameAr: string;
}

export interface TaxSystemMaster {
  id: string;
  countryCode: string;
  code: string;
  name: string;
  nameAr: string;
  authorityName: string;
  standardRate: number;
  reducedRates?: { name: string; rate: number }[];
  requiresEinvoicing: boolean;
  einvoicingStandard?: string; // e.g. 'ETA', 'ZATCA Phase 2', 'FTA'
  isActive: boolean;
}

export interface TimezoneMaster {
  code: string;
  name: string;
  offset: string;
}

export interface LanguageMaster {
  code: string;
  name: string;
  nativeName: string;
  direction: 'rtl' | 'ltr';
}

export interface FiscalCalendarMaster {
  id: string;
  name: string;
  nameAr: string;
  startMonth: number; // 1 to 12
  startDay: number;
}

export interface Branch {
  id: string;
  tenantId: string;
  companyId: string;
  name: string;
  nameAr: string;
  code: string;
  city: string;
  active: boolean;
}

export interface Department {
  id: string;
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  nameAr: string;
}

export interface CostCenter {
  id: string;
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  nameAr: string;
  departmentId?: string;
  active: boolean;
}

export interface ProfitCenter {
  id: string;
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  nameAr: string;
  active: boolean;
}

export interface Project {
  id: string;
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  nameAr: string;
  budget: number;
  status: 'Planning' | 'Active' | 'Completed' | 'On Hold';
}

export interface Warehouse {
  id: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  name: string;
  nameAr: string;
  code: string;
  isMain: boolean;
}

export interface Currency {
  code: string; // e.g. SAR, AED, USD, EUR
  name: string;
  nameAr: string;
  symbol: string;
  isBaseCurrency: boolean;
}

export interface ExchangeRate {
  id: string;
  tenantId: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: string;
}

export interface FiscalYear {
  id: string;
  tenantId: string;
  companyId: string;
  year: number;
  startDate: string;
  endDate: string;
  isClosed: boolean;
}

export interface FiscalPeriod {
  id: string;
  fiscalYearId: string;
  periodNumber: number; // 1 to 12
  startDate: string;
  endDate: string;
  isLocked: boolean;
}

export interface TaxRule {
  id: string;
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  nameAr: string;
  rate: number; // e.g. 0.15 for 15% VAT
  taxAccountCode: string; // Output VAT or Input VAT
  isActive: boolean;
  countryCode?: string;
  taxSystemId?: string;
  taxCategory?: 'STANDARD' | 'ZERO_RATED' | 'EXEMPT' | 'REDUCED' | string;
  effectiveFrom?: string; // YYYY-MM-DD
  effectiveTo?: string; // YYYY-MM-DD
  isDefault?: boolean;
}

export interface UnitOfMeasure {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  nameAr: string;
  symbol?: string;
  uomCategory?: any;
  isBaseUom?: boolean;
  decimalPrecision?: number;
  active?: boolean;
}

export interface ItemCategory {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  nameAr: string;
  inventoryAccountCode: string;
  cogsAccountCode: string;
  revenueAccountCode: string;
  valuationMethod: 'FIFO' | 'Weighted Average' | 'Standard Cost';
  defaultCostingMethod?: CostingMethod;
  allowItemOverride?: boolean;
  active?: boolean;
}

export interface PaymentTerm {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  nameAr: string;
  dueDays: number;
}

// ==================== UNIVERSAL DOCUMENT LIFECYCLE ====================

export type DocumentLifecycleStatus = 
  | 'Draft'
  | 'Submitted'
  | 'Pending Approval'
  | 'Approved'
  | 'Posted'
  | 'Partially Processed'
  | 'Closed'
  | 'Cancelled'
  | 'Reversed'
  | 'Archived'
  | 'DRAFT'
  | 'POSTED'
  | 'APPROVED'
  | 'CANCELLED';

// ==================== EVENT-DRIVEN FINANCIAL ENGINE & POSTING RULES ====================

export type FinancialEventType = 
  | 'SALES_INVOICE_POSTED'
  | 'CUSTOMER_INVOICE_POSTED'
  | 'PURCHASE_INVOICE_POSTED'
  | 'SUPPLIER_INVOICE_POSTED'
  | 'SUPPLIER_INVOICE_REVERSED'
  | 'CUSTOMER_CREDIT_NOTE_POSTED'
  | 'SUPPLIER_CREDIT_NOTE_POSTED'
  | 'SUPPLIER_DEBIT_NOTE_POSTED'
  | 'GRIR_CLEARING_POSTED'
  | 'PURCHASE_ACCRUAL_POSTED'
  | 'PURCHASE_RECEIPT_POSTED'
  | 'CUSTOMER_PAYMENT_POSTED'
  | 'CUSTOMER_RECEIPT_POSTED'
  | 'SUPPLIER_PAYMENT_POSTED'
  | 'CUSTOMER_PAYMENT_REVERSED'
  | 'SUPPLIER_PAYMENT_REVERSED'
  | 'CASH_RECEIPT_POSTED'
  | 'CASH_PAYMENT_POSTED'
  | 'STOCK_RECEIPT_POSTED'
  | 'STOCK_ISSUE_POSTED'
  | 'STOCK_TRANSFER_POSTED'
  | 'STOCK_ADJUSTMENT_POSTED'
  | 'MANUFACTURING_CONSUMPTION_POSTED'
  | 'MANUFACTURING_OUTPUT_POSTED'
  | 'ASSET_PURCHASE_POSTED'
  | 'ASSET_DEPRECIATION_POSTED'
  | 'PAYROLL_POSTING_POSTED'
  | 'EXPENSE_POSTING_POSTED'
  | 'BANK_TRANSACTION_POSTED'
  | 'CURRENCY_REVALUATION_POSTED'
  | 'GOODS_RECEIPT'
  | 'GOODS_ISSUE'
  | 'INVENTORY_ADJUSTMENT'
  | 'OPENING_BALANCE'
  | 'INVENTORY_TRANSFER';

export interface PostingRule {
  id: string;
  tenantId: string;
  companyId: string;
  documentType: string;
  name: string;
  debitAccountCode: string;
  creditAccountCode: string;
  taxAccountCode?: string;
  discountAccountCode?: string;
  costCenterId?: string;
  profitCenterId?: string;
  departmentId?: string;
  isActive: boolean;
}

export interface AccountingDimensions {
  companyId?: string;
  branchId?: string;
  warehouseId?: string;
  departmentId?: string;
  costCenterId?: string;
  profitCenterId?: string;
  projectId?: string;
  employeeId?: string;
  customerId?: string;
  supplierId?: string;
  currency?: string;
  exchangeRate?: number;
}

export interface FinancialEvent {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  warehouseId?: string;
  departmentId?: string;
  costCenterId?: string;
  profitCenterId?: string;
  projectId?: string;
  employeeId?: string;
  partyId?: string; // Customer or Vendor ID
  partyName?: string;
  eventType: FinancialEventType;
  sourceDocumentType?: string;
  sourceDocumentId: string;
  sourceDocumentNumber: string;
  amount?: number;
  taxAmount?: number;
  discountAmount?: number;
  currency?: string;
  exchangeRate?: number;
  baseCurrencyAmount?: number;
  eventDate: string;
  description?: string;
  triggeredBy?: string;
  status: 'PROCESSED' | 'FAILED' | 'PENDING' | 'QUEUED';
  journalEntryId?: string;
  documentType?: string;
  fiscalYear?: number;
  periodNumber?: number;
  retryCount?: number;
  maxRetries?: number;
  correlationId?: string;
  idempotencyKey?: string;
  createdAt?: string;
  payload?: any;
}

// ==================== FINANCIAL ACCOUNTING ====================

export type AccountCategory = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface Account {
  id: string;
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  nameAr: string;
  category: AccountCategory;
  accountType: 'Cash' | 'Receivable' | 'Payable' | 'Inventory' | 'TaxPayable' | 'TaxReceivable' | 'Equity' | 'Revenue' | 'Expense' | 'Property';
  parentId?: string | null;
  balance: number;
  currency: string;
  isActive: boolean;
  level: number;
}

export interface JournalLine {
  id: string;
  accountId?: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  companyId?: string;
  branchId?: string;
  warehouseId?: string;
  departmentId?: string;
  costCenterId?: string;
  profitCenterId?: string;
  projectId?: string;
  employeeId?: string;
  customerId?: string;
  supplierId?: string;
  currency?: string;
  exchangeRate?: number;
  baseCurrencyDebit?: number;
  baseCurrencyCredit?: number;
}

export interface JournalEntry {
  id: string;
  tenantId?: string;
  companyId: string;
  branchId?: string;
  warehouseId?: string;
  departmentId?: string;
  costCenterId?: string;
  profitCenterId?: string;
  projectId?: string;
  entryNumber: string; // e.g. JE-2026-0001
  date: string;
  postingDate: string;
  reference?: string;
  description: string;
  status: DocumentLifecycleStatus;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  currency?: string;
  exchangeRate?: number;
  originatingDocumentType?: string; // e.g. SalesInvoice, StockMovement
  originatingDocumentId?: string;
  originatingDocumentNumber?: string;
  isAutoGenerated?: boolean;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  digitalSignature?: string;
  attachmentsCount?: number;
  documentType?: string;
  sourceDocumentId?: string;
  sourceDocumentNumber?: string;
  fiscalYear?: number;
  periodNumber?: number;
  isBalanced?: boolean;
}

export interface TaxCalculationContext {
  documentId?: string;
  documentType?: string;
  jurisdiction?: string;
  date?: string;
  isTaxInclusive?: boolean;
  tenantId?: string;
  companyId?: string;
  withholdingRate?: number;
  customer?: any;
  vendor?: any;
  lines: Array<{
    lineId?: string;
    id?: string;
    name?: string;
    description?: string;
    productId?: string;
    category?: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    taxCode?: string;
    taxInclusive?: boolean;
  }>;
}

// ==================== DOCUMENT RELATIONSHIP ENGINE ====================

export type DocumentRelationshipType = 
  | 'QUOTATION_TO_SO'
  | 'SO_TO_DELIVERY'
  | 'DELIVERY_TO_INV'
  | 'INV_TO_PAYMENT'
  | 'PR_TO_PO'
  | 'PO_TO_GRN'
  | 'GRN_TO_PI'
  | 'PI_TO_PAYMENT';

export interface DocumentRelationship {
  id: string;
  tenantId: string;
  sourceDocType: string;
  sourceDocId: string;
  sourceDocNumber: string;
  targetDocType: string;
  targetDocId: string;
  targetDocNumber: string;
  relationshipType: DocumentRelationshipType | string;
  createdAt: string;
}

// ==================== BACKGROUND PROCESSING ENGINE ====================

export type JobType = 
  | 'FINANCIAL_POSTING'
  | 'CURRENCY_REVALUATION'
  | 'INVENTORY_COST_RECALC'
  | 'REPORT_GENERATION'
  | 'NOTIFICATION_DISPATCH'
  | 'AUDIT_CLEANUP';

export interface BackgroundJob {
  id: string;
  tenantId: string;
  jobType: JobType;
  title: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  payload?: any;
  result?: any;
  error?: string;
  progressPercent: number;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

// ==================== DOCUMENT NUMBERING ENGINE ====================

export interface DocumentNumberingRule {
  id: string;
  tenantId: string;
  companyId?: string;
  entityType: 'JE' | 'INV' | 'PO' | 'PI' | 'SO' | 'GRN' | 'SM' | 'CP' | 'SP' | 'EXP';
  prefix: string;
  suffix?: string;
  nextNumber: number;
  zeroPad: number;
  yearPrefix: boolean;
  lastGeneratedFormat: string;
}

// ==================== WORKFLOW & APPROVAL ENGINE ====================

export interface WorkflowRule {
  id: string;
  tenantId: string;
  companyId?: string;
  name: string;
  entityType: 'JournalEntry' | 'PurchaseOrder' | 'SalesInvoice' | 'PurchaseInvoice' | 'StockMovement' | 'CustomerPayment' | 'DiscountOverride';
  thresholdAmount: number;
  requiredRole: UserRole;
  isActive: boolean;
  stepName: string;
}

export interface ApprovalRequest {
  id: string;
  tenantId: string;
  companyId?: string;
  workflowRuleId: string;
  entityType: string;
  entityId: string;
  entityNumber: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  amount: number;
  description: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  currentApproverRole: UserRole;
  comments?: string;
}

// ==================== AUDIT ENGINE ====================

export interface AuditLog {
  id: string;
  tenantId: string;
  companyId?: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'POST' | 'APPROVE' | 'REJECT' | 'LOGIN' | 'REVERSE';
  entityType: string;
  entityId: string;
  entityNumber?: string;
  previousState?: string;
  newState?: string;
  ipAddress: string;
  details: string;
}

// ==================== INVENTORY & LOGISTICS ====================

export type ItemType = 'Stock Item' | 'Service' | 'Asset' | 'Non-Stock' | 'Bundle' | 'Kit';

export interface ItemBrand {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  nameAr: string;
  active: boolean;
}

export interface ItemModel {
  id: string;
  tenantId: string;
  brandId: string;
  brandName?: string;
  code: string;
  name: string;
  nameAr: string;
  active: boolean;
}

export interface ItemGroup {
  id: string;
  tenantId: string;
  categoryId: string;
  categoryName?: string;
  code: string;
  name: string;
  nameAr: string;
  active: boolean;
}

export interface UomConversion {
  id: string;
  tenantId: string;
  fromUom: string;
  toUom: string;
  conversionRatio: number; // e.g. 1 BOX = 10 PCS => ratio 10
  active: boolean;
}

export interface PackagingUnit {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  nameAr: string;
  baseUom: string;
  capacity: number; // e.g. 100
  active: boolean;
}

export type WarehouseType = 'Main' | 'Transit' | 'Quarantine' | 'Bonded' | 'Retail' | 'Virtual';

export interface WarehouseZone {
  id: string;
  tenantId: string;
  warehouseId: string;
  code: string;
  name: string;
  nameAr: string;
  zoneType: 'Receiving' | 'Bulk' | 'Picking' | 'Quarantine' | 'Staging' | 'Shipping';
  active: boolean;
}

export interface BinLocation {
  id: string;
  tenantId: string;
  warehouseId: string;
  zoneId: string;
  code: string; // e.g. BIN-A-01-02
  name: string;
  nameAr?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  barcode?: string;
  isDefaultReceiving?: boolean;
  isDefaultShipping?: boolean;
  maxWeightCapacity?: number;
  active: boolean;
}

export interface BatchLot {
  id: string;
  tenantId: string;
  itemSku: string;
  itemName?: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  shelfLifeDays: number;
  supplierBatchRef?: string;
  initialQty: number;
  currentQty: number;
  status: 'Active' | 'Quarantine' | 'Expired' | 'Exhausted';
  notes?: string;
}

export interface SerialNumber {
  id: string;
  tenantId: string;
  itemSku: string;
  itemName?: string;
  serialNumber: string;
  batchNumber?: string;
  warehouseId?: string;
  binId?: string;
  status: 'Available' | 'Reserved' | 'Issued' | 'In Transit' | 'Damaged';
  warrantyExpiryDate?: string;
  createdAt: string;
}

export interface StockQuant {
  id: string;
  tenantId: string;
  companyId: string;
  itemSku: string;
  itemName: string;
  categoryId: string;
  categoryName: string;
  warehouseId: string;
  warehouseName: string;
  zoneId?: string;
  zoneName?: string;
  binId?: string;
  binCode?: string;
  batchNumber?: string;
  serialNumber?: string;
  qtyOnHand: number;
  qtyAvailable: number;
  qtyReserved: number;
  qtyInTransit: number;
  qtyDamaged: number;
  qtyReturned: number;
  unitCost: number;
  totalValue: number;
  uom: string;
  status: 'Available' | 'Quarantine' | 'Reserved' | 'Damaged' | 'Expired';
  lastCountDate?: string;
  updatedAt: string;
}

export interface InventoryRuleConfig {
  negativeStockPolicy: 'Block' | 'Warn' | 'Allow';
  serialTrackingMode: 'Optional' | 'Mandatory';
  batchTrackingMode: 'Optional' | 'Mandatory';
  expiryTrackingMode: 'Optional' | 'Mandatory';
  barcodeRulePattern: string; // e.g. "628{SKU}{RAND}"
  skuRulePattern: string;     // e.g. "{CAT}-{BRD}-{SEQ}"
  defaultCostMethod: 'FIFO' | 'Weighted Average' | 'Standard Cost';
  defaultWarehouseId: string;
  defaultUomCode: string;
  autoGenerateSku: boolean;
  autoGenerateBarcode: boolean;
}

export interface ItemVariant {
  id: string;
  sku: string;
  variantName: string;
  color?: string;
  size?: string;
  season?: string;
  collection?: string;
  barcode?: string;
  additionalPrice?: number;
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  companyId: string;
  sku: string;
  itemType: ItemType;
  barcode?: string;
  multipleBarcodes?: string[];
  serialNumbers?: string[];
  batchNumbers?: string[];
  expiryDate?: string;
  name: string;
  nameAr: string;
  categoryId: string;
  categoryName: string;
  brandId?: string;
  brandName?: string;
  modelId?: string;
  modelName?: string;
  itemGroupId?: string;
  uom: string;
  alternativeUnits?: { uom: string; conversionRatio: number }[];
  packingUnits?: string;
  costPrice: number;
  sellingPrice: number;
  stockQty: number;
  reorderPoint: number;
  warehouseId: string;
  valuationMethod: 'FIFO' | 'Weighted Average' | 'Standard Cost' | 'Specific Identification';
  weight?: number;
  volume?: number;
  dimensions?: string; // e.g. 10x20x30 cm
  hsCode?: string;
  countryOfOrigin?: string;
  preferredSupplierId?: string;
  defaultWarehouseId?: string;
  defaultCostCenterId?: string;
  defaultRevenueAccountCode?: string;
  defaultExpenseAccountCode?: string;
  defaultInventoryAccountCode?: string;
  variants?: ItemVariant[];
  active: boolean;
}

export interface StockMovement {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  movementNumber: string;
  date: string;
  itemSku: string;
  itemName: string;
  warehouseId: string;
  warehouseName: string;
  movementType: 'Receipt' | 'Issue' | 'Transfer' | 'Adjustment' | string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  reference?: string;
  status: DocumentLifecycleStatus;
  journalEntryId?: string;
  performedBy: string;
  createdAt: string;
}

// ==================== PHASE 2.2.1 INVENTORY EXECUTION ENGINE ====================

export type InventoryMovementType = 
  | 'GOODS_RECEIPT'
  | 'GOODS_ISSUE'
  | 'OPENING_STOCK'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT_PLUS'
  | 'ADJUSTMENT_MINUS'
  | 'RETURN_IN'
  | 'RETURN_OUT';

export interface InventoryMovementTypeConfig {
  code: InventoryMovementType;
  name: string;
  nameAr: string;
  direction: 'INCREASE' | 'DECREASE';
  businessEventType: string;
  financialEventType: FinancialEventType;
  requiresReference: boolean;
  description: string;
}

export interface StockLedgerEntry {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  movementNumber: string;
  movementType: InventoryMovementType;
  itemSku: string;
  itemName: string;
  warehouseId: string;
  warehouseName: string;
  binId?: string;
  binCode?: string;
  batchNumber?: string;
  lotId?: string;
  serialNumber?: string;
  quantity: number;          // Positive quantity transferred
  quantityImpact: number;    // Positive for increase (+qty), Negative for decrease (-qty)
  uom: string;
  unitCost: number;
  totalCost: number;
  sourceDocumentType: string; // e.g. GoodsReceiptNote, GoodsIssueNote, OpeningStock, StockTransfer, SalesReturn, PurchaseReturn
  sourceDocumentId: string;
  sourceDocumentNumber: string;
  reference?: string;
  reason?: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole?: string;
  status: 'POSTED' | 'REVERSED';
}

export interface InventoryBusinessEvent {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  eventType: string; // e.g. EVT_GOODS_RECEIPT, EVT_GOODS_ISSUE
  movementId: string;
  movementNumber: string;
  itemSku: string;
  itemName: string;
  warehouseId: string;
  warehouseName: string;
  binId?: string;
  binCode?: string;
  batchNumber?: string;
  serialNumber?: string;
  quantity: number;
  direction: 'INCREASE' | 'DECREASE';
  uom: string;
  unitCost: number;
  totalCost: number;
  sourceDocumentType: string;
  sourceDocumentNumber: string;
  timestamp: string;
  triggeredBy: string;
}

// ==================== PHASE 2.2.3 INVENTORY COSTING ENGINE ====================

export type CostingMethod = 'FIFO' | 'AVCO' | 'STANDARD';

export interface ItemCategory {
  id: string;
  tenantId: string;
  companyId?: string;
  code: string;
  name: string;
  nameAr: string;
  defaultCostingMethod?: CostingMethod;
  allowItemOverride?: boolean;
  active?: boolean;
}

export interface CostLayer {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  layerNumber: string;
  itemSku: string;
  itemName: string;
  warehouseId: string;
  warehouseName: string;
  binId?: string;
  binCode?: string;
  batchNumber?: string;
  lotId?: string;
  quantity: number;            // Initial receipt quantity
  remainingQuantity: number;   // Quantity remaining in layer
  unitCost: number;            // Unit cost at receipt time
  totalCost: number;           // Initial total cost
  remainingTotalCost: number;  // remainingQuantity * unitCost
  sourceDocumentType: string;  // e.g. GoodsReceiptNote, OpeningStock, StockTransfer
  sourceDocumentId: string;
  sourceDocumentNumber: string;
  receiptDate: string;         // ISO timestamp
  status: 'ACTIVE' | 'EXHAUSTED' | 'CLOSED';
  createdBy: string;
  createdAt: string;
}

export interface CostLayerConsumption {
  id: string;
  tenantId: string;
  companyId: string;
  costLayerId: string;
  costLayerNumber: string;
  issueDocumentType: string;
  issueDocumentNumber: string;
  itemSku: string;
  quantityConsumed: number;
  unitCost: number;
  totalCost: number;
  consumedAt: string;
  consumedBy: string;
}

export interface MovingAverageCostRecord {
  id: string;
  tenantId: string;
  companyId: string;
  itemSku: string;
  itemName: string;
  warehouseId?: string;
  previousQty: number;
  previousAvgCost: number;
  receiptQty: number;
  receiptUnitCost: number;
  newQty: number;
  newAvgCost: number;
  sourceDocumentNumber: string;
  updatedAt: string;
  updatedBy: string;
}

export interface StandardCostRecord {
  id: string;
  tenantId: string;
  companyId: string;
  itemSku: string;
  itemName: string;
  standardCost: number;
  actualReceiptCost: number;
  unitVariance: number;  // Actual - Standard
  totalVariance: number; // (Actual - Standard) * Quantity
  quantity: number;
  sourceDocumentNumber: string;
  calculatedAt: string;
  calculatedBy: string;
}

export interface CostCalculationLog {
  id: string;
  tenantId: string;
  companyId: string;
  itemSku: string;
  itemName: string;
  calculationMethod: CostingMethod;
  operationType: 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT' | 'RECALCULATION';
  quantity: number;
  unitCost: number;
  totalCost: number;
  sourceDocumentType: string;
  sourceDocumentNumber: string;
  sourceModule: 'InventoryManagement';
  createdBy: string;
  createdAt: string;
  details: string;
}

export type CostBusinessEventType = 
  | 'EVT_COST_LAYER_CREATED'
  | 'EVT_COST_LAYER_CONSUMED'
  | 'EVT_AVERAGE_COST_UPDATED'
  | 'EVT_STANDARD_COST_UPDATED';

export interface CostBusinessEvent {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  eventType: CostBusinessEventType;
  itemSku: string;
  itemName: string;
  warehouseId?: string;
  costingMethod: CostingMethod;
  layerId?: string;
  layerNumber?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  varianceAmount?: number;
  sourceDocumentType: string;
  sourceDocumentNumber: string;
  timestamp: string;
  triggeredBy: string;
}

// ==================== SALES & PURCHASING ====================

export interface Customer {
  id: string;
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  nameAr: string;
  taxNumber: string;
  email: string;
  phone: string;
  creditLimit: number;
  balance: number;
  receivableAccountCode?: string;
}

export interface SalesInvoiceLine {
  itemSku: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number; // e.g. 0.15 for 15% VAT
  taxAmount: number;
  total: number;
}

export interface SalesInvoice {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  status: DocumentLifecycleStatus;
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
  lines: SalesInvoiceLine[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  journalEntryId?: string;
  createdBy: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  nameAr: string;
  taxNumber: string;
  email: string;
  phone: string;
  balance: number;
  payableAccountCode?: string;
}

export interface PurchaseOrderLine {
  itemSku: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  taxRate: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  date: string;
  expectedDate: string;
  status: DocumentLifecycleStatus;
  lines?: PurchaseOrderLine[];
  totalAmount: number;
  createdBy: string;
  createdAt: string;
}

export interface PurchaseInvoice {
  id: string;
  tenantId: string;
  companyId: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  purchaseOrderId?: string;
  date: string;
  dueDate: string;
  status: DocumentLifecycleStatus;
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  journalEntryId?: string;
  createdBy: string;
  createdAt: string;
}

export interface CustomerPayment {
  id: string;
  tenantId: string;
  companyId: string;
  paymentNumber: string;
  customerId: string;
  customerName: string;
  salesInvoiceId?: string;
  salesInvoiceNumber?: string;
  date: string;
  amount: number;
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Credit Card' | 'Cheque';
  reference?: string;
  status: DocumentLifecycleStatus;
  journalEntryId?: string;
  createdBy: string;
  createdAt: string;
}

export interface SupplierPayment {
  id: string;
  tenantId: string;
  companyId: string;
  paymentNumber: string;
  vendorId: string;
  vendorName: string;
  purchaseInvoiceId?: string;
  date: string;
  amount: number;
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Cheque';
  reference?: string;
  status: DocumentLifecycleStatus;
  journalEntryId?: string;
  createdBy: string;
  createdAt: string;
}

// ==================== CRM & HR ====================

export interface Lead {
  id: string;
  tenantId: string;
  companyId?: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  value: number;
  stage: 'New' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  assignedTo: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  tenantId: string;
  companyId?: string;
  employeeCode: string;
  name: string;
  nameAr: string;
  department: string;
  jobTitle: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  joiningDate: string;
  status: 'Active' | 'On Leave' | 'Terminated';
}

// ==================== AI COPILOT & ANALYTICS ====================

export interface AnomalyReport {
  id: string;
  type: 'JOURNAL_SWING' | 'SPLIT_PO' | 'UNUSUAL_DISCOUNT' | 'STOCK_DISCREPANCY';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  entityNumber: string;
  detectedAt: string;
  recommendedAction: string;
}

export interface ExecutiveMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  netProfitMargin: number;
  workingCapital: number;
  inventoryValuation: number;
  pendingApprovalsCount: number;
  activeTenantsCount: number;
  cashInflowMonth: number;
  cashOutflowMonth: number;
}

// ==================== PHASE 3 ENTERPRISE BUSINESS RULES ENGINE ====================

export type RuleCategory = 
  | 'VALIDATION'
  | 'APPROVAL'
  | 'POSTING'
  | 'TAX'
  | 'PRICING'
  | 'DISCOUNT'
  | 'CREDIT_LIMIT'
  | 'INVENTORY'
  | 'WAREHOUSE'
  | 'PURCHASING'
  | 'SALES'
  | 'CUSTOMER'
  | 'SUPPLIER'
  | 'MANUFACTURING'
  | 'PAYROLL'
  | 'ASSET'
  | 'NOTIFICATION';

export interface BusinessRule {
  id: string;
  tenantId: string;
  category: RuleCategory;
  ruleCode: string;
  name: string;
  description: string;
  expression: string; // Dynamic rule expression or formula
  priority: number; // 1 (highest) to 100
  isActive: boolean;
  actionIfPassed?: string;
  actionIfFailed?: string;
}

// ==================== MASTER DATA FOUNDATION EXTENSIONS ====================

export interface MasterEntityBase {
  id: string;
  tenantId: string;
  status: 'Active' | 'Inactive' | 'Archived';
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  customFields?: Record<string, any>;
  notesCount?: number;
  attachmentsCount?: number;
}

export interface Brand extends MasterEntityBase {
  code: string;
  name: string;
  nameAr?: string;
  manufacturer?: string;
}

export interface Model extends MasterEntityBase {
  brandId: string;
  code: string;
  name: string;
}

export interface Color extends MasterEntityBase {
  code: string;
  name: string;
  hexCode?: string;
}

export interface Size extends MasterEntityBase {
  code: string;
  name: string;
  category?: string;
}

export interface PaymentMethod extends MasterEntityBase {
  code: string;
  name: string;
  nameAr?: string;
  glAccountCode?: string;
}

export interface Bank extends MasterEntityBase {
  code: string;
  name: string;
  iban: string;
  swiftCode: string;
  glAccountCode: string;
  currency: string;
}

export interface WarehouseLocation extends MasterEntityBase {
  warehouseId: string;
  aisle: string;
  rack: string;
  shelf: string;
  bin: string;
  code: string;
}

export interface BusinessPartner extends MasterEntityBase {
  code: string;
  name: string;
  type: 'Customer' | 'Supplier' | 'Both';
  taxNumber?: string;
  creditLimit?: number;
  paymentTermsId?: string;
}

export interface Country extends MasterEntityBase {
  isoCode: string;
  name: string;
  nameAr?: string;
  phonePrefix: string;
}

export interface City extends MasterEntityBase {
  countryCode: string;
  name: string;
  nameAr?: string;
}

export interface Region extends MasterEntityBase {
  countryCode: string;
  name: string;
}

export interface Asset extends MasterEntityBase {
  assetCode: string;
  name: string;
  category: string;
  acquisitionDate: string;
  acquisitionCost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  depreciationMethod: 'Straight Line' | 'Declining Balance';
  accumulatedDepreciation: number;
  bookValue: number;
  glAssetAccount: string;
  glDepreciationAccount: string;
  glAccumulatedAccount: string;
  costCenterId?: string;
  location?: string;
}

// ==================== PRICING & DISCOUNT ENGINE ====================

export interface PriceList {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  currency: string;
  isDefault: boolean;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface CustomerPriceRule {
  id: string;
  tenantId: string;
  priceListId?: string;
  customerId?: string;
  customerGroup?: string;
  itemSku: string;
  unitPrice: number;
  minQuantity?: number;
  discountPercent?: number;
  validFrom?: string;
  validTo?: string;
}

// ==================== ENHANCED TAX ENGINE ====================

export type TaxType = 'VAT' | 'GST' | 'Sales Tax' | 'Purchase Tax' | 'Withholding Tax';
export type TaxCalculationMethod = 'Exclusive' | 'Inclusive' | 'Compound';

export interface TaxConfig {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  taxType: TaxType;
  method: TaxCalculationMethod;
  rate: number;
  glAccountCode: string;
  isCompound: boolean;
  isActive: boolean;
}

// ==================== NOTIFICATION ENGINE ====================

export type NotificationChannel = 'In-App' | 'Email' | 'SMS' | 'Push' | 'WhatsApp';

export interface NotificationRecord {
  id: string;
  tenantId: string;
  userId: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

// ==================== ATTACHMENT & VERSIONING ENGINE ====================

export interface FileVersion {
  versionNumber: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface DocumentAttachment {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  version: number;
  versions: FileVersion[];
  uploadedBy: string;
  uploadedAt: string;
}

// ==================== COMMENT & ACTIVITY ENGINE ====================

export interface DocumentComment {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  comment: string;
  mentions?: string[]; // User IDs mentioned
  isInternalNote: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  entityNumber?: string;
  details: string;
  timestamp: string;
}

// ==================== GLOBAL ENTERPRISE SEARCH ====================

export interface SearchResult {
  id: string;
  category: 'Customers' | 'Suppliers' | 'Items' | 'Invoices' | 'Journal Entries' | 'Projects' | 'Warehouses' | 'Employees' | 'Assets' | 'Documents';
  title: string;
  subtitle: string;
  entityType: string;
  entityId: string;
  entityNumber?: string;
  url?: string;
}

// ==================== VALIDATION ENGINE ====================

// ==================== PHASE 4 ENTERPRISE CONFIGURATION ENGINE ====================

export type ConfigScopeLevel = 'PLATFORM' | 'TENANT' | 'COMPANY' | 'BRANCH' | 'WAREHOUSE' | 'DEPARTMENT' | 'USER';

export type ProductEdition = 'Community' | 'Professional' | 'Enterprise';

export interface SystemConfigValue {
  id: string;
  scopeLevel: ConfigScopeLevel;
  scopeId: string; // e.g. tenantId, companyId, branchId, etc.
  category: 'GENERAL' | 'FINANCIAL' | 'INVENTORY' | 'SALES' | 'PURCHASING' | 'WORKFLOW' | 'NUMBERING' | 'TAX' | 'NOTIFICATION' | 'SECURITY' | 'FEATURE_FLAGS' | 'LOCALIZATION';
  key: string;
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  isLockedByParent?: boolean;
  updatedAt: string;
  updatedBy?: string;
}

export interface GeneralSystemConfig {
  systemLanguage: string; // 'en' | 'ar'
  defaultCurrency: string; // 'SAR'
  timeZone: string; // 'Asia/Riyadh'
  dateFormat: string; // 'YYYY-MM-DD'
  numberFormat: string; // 'en-US' | 'ar-SA'
  decimalPrecision: number; // 2
  defaultCompanyId: string;
  defaultBranchId: string;
  defaultWarehouseId: string;
  theme: 'light' | 'dark' | 'system';
  direction: 'ltr' | 'rtl';
  regionalLocalization: string; // 'SA' | 'AE' | 'GCC' | 'GLOBAL'
}

export interface FinancialConfig {
  coaStructure: 'STANDARD_4_LEVEL' | 'ENTERPRISE_6_LEVEL';
  defaultReceivableAccountCode: string; // '1020'
  defaultPayableAccountCode: string; // '2010'
  defaultTaxAccountCode: string; // '2020'
  defaultBankAccountCode: string; // '1010'
  defaultRevenueAccountCode: string; // '4000'
  defaultCostOfGoodsAccountCode: string; // '5000'
  fiscalPeriodLocking: boolean;
  yearClosingPolicy: 'AUTOMATIC_RETAINED_EARNINGS' | 'MANUAL_APPROVAL';
  openingBalancePolicy: 'REQUIRE_AUDIT_APPROVAL' | 'STANDARD_ENTRY';
  exchangeRatePolicy: 'DAILY_CENTRAL_BANK' | 'FIXED_PERIODIC';
  multiCurrencyEnabled: boolean;
  roundingMethod: 'HALF_EVEN' | 'HALF_UP' | 'FLOOR';
  journalApprovalThreshold: number; // 10000 SAR
}

export interface InventoryConfig {
  defaultCostingMethod: 'FIFO' | 'Weighted Average' | 'Standard Cost';
  negativeInventoryPolicy: 'ALLOW' | 'BLOCK' | 'WARN_AND_ALLOW';
  reservationPolicy: 'ON_SALES_ORDER' | 'ON_DISPATCH';
  backorderPolicy: 'ALLOW' | 'BLOCK';
  lotTrackingEnabled: boolean;
  serialTrackingEnabled: boolean;
  expiryTrackingEnabled: boolean;
  autoReplenishmentEnabled: boolean;
  physicalCountPolicy: 'CYCLE_COUNT' | 'FULL_FREEZE';
}

export interface SalesConfig {
  quotationExpiryDays: number; // 30
  defaultPriceListId: string;
  discountPolicy: 'MAX_15_PERCENT_UNAPPROVED' | 'STRICT_APPROVAL';
  creditLimitEnforcement: 'STRICT_BLOCK' | 'WARNING_ONLY';
  deliveryPolicy: 'UPON_PAYMENT' | 'CREDIT_TERMS';
  taxDefaultMethod: 'Inclusive' | 'Exclusive';
  customerApprovalRequired: boolean;
}

export interface PurchasingConfig {
  poApprovalLimit: number; // 50000
  vendorApprovalRequired: boolean;
  receivingPolicy: 'STRICT_MATCH_PO' | 'ALLOW_TOLERANCE';
  partialReceiptAllowed: boolean;
  priceVarianceTolerancePercent: number; // 5%
  threeWayInvoiceMatching: boolean;
}

export interface SecurityConfig {
  passwordMinLength: number; // 8
  passwordRequireSpecialChar: boolean;
  sessionTimeoutMinutes: number; // 60
  twoFactorAuthRequired: boolean;
  ipRestrictionEnabled: boolean;
  allowedIpAddresses: string[];
  auditRetentionDays: number; // 365
}

export interface FeatureFlag {
  featureKey: string; // e.g. 'MODULE_AI_ASSISTANT', 'MULTI_BRANCH', 'ASSET_MANAGEMENT'
  featureName: string;
  description: string;
  minEditionRequired: ProductEdition;
  isEnabled: boolean;
}

export interface LocalizationPack {
  code: string; // 'SA' | 'AE' | 'EG'
  countryName: string;
  currency: string;
  taxPacks: { name: string; defaultRate: number; code: string }[];
  languagePacks: string[];
  documentTemplates: { templateId: string; templateName: string }[];
}

export interface ValidationRule {
  ruleId: string;
  ruleName: string;
  severity: 'ERROR' | 'WARNING';
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { field?: string; message: string; severity: 'ERROR' | 'WARNING' }[];
}

// ==================== PHASE 2.2.4 INVENTORY FINANCIAL INTEGRATION ====================

export type InventoryBusinessEventType = 
  | 'EVT_GOODS_RECEIPT'
  | 'EVT_GOODS_ISSUE'
  | 'EVT_ADJUSTMENT_PLUS'
  | 'EVT_ADJUSTMENT_MINUS'
  | 'EVT_OPENING_STOCK'
  | 'EVT_TRANSFER'
  | 'EVT_RETURN_IN'
  | 'EVT_RETURN_OUT';

export type FinancialIntegrationPostingBehavior = 'AUTO_POST' | 'QUEUE_POST' | 'MANUAL_POST';

export interface InventoryFinancialEventMapRule {
  id: string;
  tenantId: string;
  businessEventType: InventoryBusinessEventType;
  financialEventType: FinancialEventType;
  description: string;
  descriptionAr: string;
  active: boolean;
}

export interface PostingProfile {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  nameAr: string;
  companyId: string; // '*' or specific ID
  branchId: string; // '*' or specific ID
  inventoryCategoryId: string; // '*' or specific ID
  businessEventType: InventoryBusinessEventType;
  financialEventType: FinancialEventType;
  journalTemplateId: string;
  currency: string;
  postingBehavior: FinancialIntegrationPostingBehavior;
  active: boolean;
}

export interface JournalTemplateLine {
  id: string;
  lineNo: number;
  accountType: 'INVENTORY_ASSET' | 'GR_IR_CLEARING' | 'COGS' | 'INVENTORY_ADJUSTMENT' | 'INVENTORY_DIFFERENCE' | 'INVENTORY_TRANSFER_CLEARING' | 'OPENING_BALANCE_EQUITY' | 'SALES_RETURNS' | 'VENDOR_RETURNS' | 'WRITE_OFF_EXPENSE';
  accountCodeDefault: string;
  side: 'DEBIT' | 'CREDIT';
  percentage: number; // 100% standard
  descriptionPattern: string;
}

export interface JournalTemplate {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  nameAr: string;
  category: 'Inventory Asset' | 'Inventory Adjustment' | 'Inventory Difference' | 'Inventory Transfer' | 'Inventory Opening' | 'Inventory Return' | 'Inventory Write-Off';
  lines: JournalTemplateLine[];
  active: boolean;
}

export interface InventoryFinancialEventPayload {
  eventId: string;
  correlationId: string;
  idempotencyKey: string;
  eventVersion: string; // '1.0'
  schemaVersion: string; // 'v1.0'
  eventTypeVersion: string; // 'v1.0'
  tenantId: string;
  companyId: string;
  branchId: string;
  warehouseId: string;
  itemId: string;
  itemSku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  currency: string;
  businessEvent: InventoryBusinessEventType;
  financialEventType: FinancialEventType;
  postingProfileId?: string;
  journalTemplateId?: string;
  sourceDocumentType: string;
  sourceDocumentId: string;
  sourceDocumentNumber: string;
  sourceLineId?: string;
  createdBy: string;
  createdAt: string;
  auditMetadata: Record<string, any>;
}

export type FinancialQueueStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Retry' | 'Cancelled' | 'DeadLetter';

export interface InventoryFinancialQueueItem {
  id: string;
  tenantId: string;
  companyId: string;
  eventId: string;
  correlationId: string;
  idempotencyKey: string;
  payload: InventoryFinancialEventPayload;
  postingProfile?: PostingProfile;
  journalTemplate?: JournalTemplate;
  status: FinancialQueueStatus;
  retryCount: number;
  maxRetries: number;
  retryDelayMs: number;
  nextRetryAt?: string;
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  isDeadLetter: boolean;
  failureReason?: string;
  journalEntryId?: string;
  queuedAt: string;
  processedAt?: string;
  auditHistory: {
    id: string;
    timestamp: string;
    action: string;
    user: string;
    details: string;
  }[];
}

export interface InventoryFinancialAuditRecord {
  id: string;
  tenantId: string;
  eventId: string;
  correlationId: string;
  idempotencyKey: string;
  eventVersion: string;
  queueItemId?: string;
  businessEventType: InventoryBusinessEventType;
  financialEventType: FinancialEventType;
  sourceDocumentNumber: string;
  status: string;
  actionTaken: string;
  performedBy: string;
  timestamp: string;
  details: string;
}

// ==========================================================
// Phase 2.2.5 — Inventory Closing & Inventory Control Engine Types
// ==========================================================

export type InventoryPeriodStatus = 'Open' | 'Closing' | 'Closed' | 'Reopened';

export interface InventoryPeriod {
  id: string;
  tenantId: string;
  companyId: string;
  periodName: string;
  fiscalYear: number;
  fiscalPeriod: number;
  startDate: string;
  endDate: string;
  status: InventoryPeriodStatus;
  closedBy?: string;
  closedAt?: string;
  reopenedBy?: string;
  reopenedAt?: string;
  reopenReason?: string;
  reopenCounter?: number;
  snapshotRef?: string;
  certificateRef?: string;
  allowOverrideUsers?: string[];
}

export interface InventoryClosingSnapshot {
  id: string;
  snapshotNumber: string;
  periodId: string;
  periodName: string;
  companyId: string;
  createdAt: string;
  createdBy: string;
  inventorySnapshot: InventoryItem[];
  stockQuantSnapshot: StockQuant[];
  fifoLayerSnapshot: any[];
  avcoSnapshot: { itemSku: string; avcoCost: number; stockQty: number }[];
  standardCostSnapshot: { itemSku: string; standardCost: number }[];
  inventoryValueSnapshot: {
    totalValue: number;
    warehouseValues: Record<string, number>;
    itemCategoryValues: Record<string, number>;
  };
  hash: string;
}

export interface InventoryCertificateRecord {
  id: string;
  certificateNumber: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  warehouseId: string;
  closingPeriod: string;
  inventoryValue: number;
  healthScore: number;
  accuracyPercent: number;
  completenessPercent: number;
  closingUser: string;
  closingDate: string;
  snapshotReference: string;
  auditReference: string;
  overallStatus: 'CERTIFIED' | 'CONDITIONAL' | 'ACTION_REQUIRED';
  immutableHash: string;
}

export type FiscalLockLevel = 'Company' | 'Branch' | 'Warehouse';
export type FiscalLockStatus = 'Unlocked' | 'Locked' | 'SoftLock';

export interface FiscalInventoryLock {
  id: string;
  tenantId: string;
  companyId: string;
  lockLevel: FiscalLockLevel;
  targetId: string;
  targetName: string;
  status: FiscalLockStatus;
  lockedBy?: string;
  lockedAt?: string;
  lockReason?: string;
  autoUnlockAt?: string;
}

export type CountSessionStatus = 'Draft' | 'InProgress' | 'Counting' | 'VarianceReview' | 'RecountRequested' | 'Approved' | 'Cancelled';

export interface CountSheetItem {
  id: string;
  itemId: string;
  itemSku: string;
  itemName: string;
  warehouseId: string;
  zoneId?: string;
  binId?: string;
  batchNumber?: string;
  serialNumber?: string;
  bookQuantity: number;
  physicalQuantity?: number;
  varianceQuantity?: number;
  unitCost: number;
  varianceValue?: number;
  isBlindCount: boolean;
  countedBy?: string;
  countedAt?: string;
  notes?: string;
  status: 'Pending' | 'Counted' | 'RecountNeeded' | 'Verified';
}

export interface InventoryCountSession {
  id: string;
  sessionNumber: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  warehouseId: string;
  warehouseName: string;
  periodId?: string;
  title: string;
  isBlindCount: boolean;
  status: CountSessionStatus;
  items: CountSheetItem[];
  totalBookValue: number;
  totalPhysicalValue: number;
  totalVarianceValue: number;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

export interface InventoryReconciliationProposal {
  id: string;
  countSessionId: string;
  tenantId: string;
  companyId: string;
  warehouseId: string;
  itemSku: string;
  itemName: string;
  bookQuantity: number;
  physicalQuantity: number;
  varianceQuantity: number;
  unitCost: number;
  varianceValue: number;
  type: 'Gain' | 'Loss';
  proposedEventType: 'EVT_ADJUSTMENT_PLUS' | 'EVT_ADJUSTMENT_MINUS';
  status: 'Pending' | 'Approved' | 'Posted' | 'Rejected';
  approvedBy?: string;
  postedEventId?: string;
  postedAt?: string;
}

export interface InventoryHealthMetrics {
  negativeStockCount: number;
  negativeStockValue: number;
  deadStockCount: number;
  deadStockValue: number;
  slowMovingCount: number;
  fastMovingCount: number;
  overstockCount: number;
  understockCount: number;
  nearExpiryCount: number;
  expiredCount: number;
  totalInventoryValue: number;
  warehouseUtilizationPercent: number;
  itemsList: {
    negativeStockItems: any[];
    deadStockItems: any[];
    overstockItems: any[];
    understockItems: any[];
    nearExpiryItems: any[];
  };
}

export interface IntegrityCheckResult {
  checkName: string;
  category: string;
  passed: boolean;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  errorCount: number;
  details: string[];
}

export interface InventoryIntegrityReport {
  overallPassed: boolean;
  checkedAt: string;
  checkedBy: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: IntegrityCheckResult[];
}

export interface InventoryCertificationReport {
  certifiedAt: string;
  certifiedBy: string;
  periodName: string;
  companyName: string;
  inventoryHealthScore: number;
  inventoryAccuracyPercent: number;
  inventoryCompletenessPercent: number;
  openVariancesCount: number;
  openVariancesValue: number;
  pendingAdjustmentsCount: number;
  pendingCountsCount: number;
  pendingApprovalsCount: number;
  totalBookValue: number;
  integrityPassed: boolean;
  overallStatus: 'CERTIFIED' | 'CONDITIONAL' | 'ACTION_REQUIRED';
  recommendations: string[];
}

export interface InventoryClosingAuditRecord {
  id: string;
  tenantId: string;
  actionType: 'PERIOD_CLOSED' | 'PERIOD_REOPENED' | 'FISCAL_LOCK_CHANGED' | 'COUNT_APPROVED' | 'VARIANCE_APPROVED' | 'ADJUSTMENT_POSTED';
  performedBy: string;
  performedAt: string;
  targetRef: string;
  details: string;
  previousState?: string;
  newState?: string;
  ipAddress?: string;
  hash: string;
}

// ==================== RESTAURANT & HOSPITALITY OPERATIONS ====================
export interface RestaurantTable {
  id: string;
  tableNumber: string;
  capacity: number;
  section: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'DIRTY' | 'BILL_REQUESTED';
  currentOrderId?: string;
  activeGuests?: number;
  serverStaffId?: string;
  companyId?: string;
  branchId?: string;
}

export interface KitchenDisplayOrder {
  id: string;
  orderNumber: string;
  tableNumber?: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  station: 'HOT_KITCHEN' | 'COLD_PREP' | 'BEVERAGES' | 'BAKERY';
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    modifiers?: string[];
    notes?: string;
    status: 'PENDING' | 'COOKING' | 'DONE';
  }>;
  priority: 'NORMAL' | 'VIP' | 'RUSH';
  createdAt: string;
  readyAt?: string;
  companyId?: string;
  branchId?: string;
}

export interface KitchenWasteRecord {
  id: string;
  wasteNumber: string;
  date: string;
  itemId: string;
  itemName: string;
  quantity: number;
  uom: string;
  costAmount: number;
  reason: 'SPOILAGE' | 'PREPARATION_ERROR' | 'CUSTOMER_RETURN' | 'EXPIRED' | 'TRIMMING';
  reportedBy: string;
  actionTaken: string;
  companyId?: string;
  branchId?: string;
}

// ==================== CRM TICKETS & PROJECTS TIMESHEETS ====================
export interface CRMTicket {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerName: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  category: 'INQUIRY' | 'BILLING' | 'TECHNICAL' | 'COMPLAINT' | 'DELIVERY';
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  resolvedAt?: string;
  companyId?: string;
}

export interface ProjectTimesheet {
  id: string;
  timesheetNumber: string;
  projectId: string;
  projectName: string;
  employeeId: string;
  employeeName: string;
  date: string;
  hoursWorked: number;
  billableHours: number;
  taskDescription: string;
  hourlyRate: number;
  totalCost: number;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'BILLED';
  approvedBy?: string;
  approvedAt?: string;
  companyId?: string;
}

export * from './procurement';



