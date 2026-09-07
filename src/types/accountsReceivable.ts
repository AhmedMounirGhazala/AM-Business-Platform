/**
 * AM Business Platform - Accounts Receivable & Order-to-Cash Domain Type Definitions
 * Target Architecture: SAP S/4HANA FI-AR, Oracle ERP Cloud Receivables, D365 Finance
 * Compliance: IFRS 15, ZATCA Phase 2, Domain-Driven Design (DDD)
 */

export type CustomerCategory = 'ENTERPRISE' | 'SME' | 'GOVERNMENT' | 'INDIVIDUAL';

export type CreditClass = 'CLASS_A_PRIME' | 'CLASS_B_STANDARD' | 'CLASS_C_RISK' | 'CLASS_D_HIGH_RISK';

export type CustomerRiskRating = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SalesTerritory = 'RIYADH_CENTRAL' | 'JEDDAH_WEST' | 'DAMMAM_EAST' | 'INTERNATIONAL' | 'OTHER';

export type CollectionsProfile = 'STANDARD_TERMS' | 'STRICT_COLLECTIONS' | 'VIP_CUSTOM_TERMS' | 'PREPAYMENT_ONLY';

export interface ARCustomer {
  id: string;
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  nameAr: string;
  category: CustomerCategory;
  taxNumber: string; // ZATCA / VAT Registration Number
  crNumber?: string; // Commercial Registration Number
  email: string;
  phone: string;
  address: string;
  creditClass: CreditClass;
  creditLimit: number;
  creditDays: number;
  salesTerritory: SalesTerritory;
  collectionsProfile: CollectionsProfile;
  riskRating: CustomerRiskRating;
  isBlocked: boolean;
  blockReason?: string;
  currentBalance: number;
  overdueBalance: number;
  currency: string;
  paymentTermsCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesInvoiceLineItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // e.g., 0.15 for 15% VAT
  taxAmount: number;
  discountRate: number; // e.g. 0.05 for 5%
  discountAmount: number;
  lineTotal: number;
}

export type SalesInvoiceStatus = 'DRAFT' | 'POSTED' | 'CANCELLED' | 'REVERSED';

export type ARPaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

export interface CustomerSalesInvoice {
  id: string;
  tenantId: string;
  companyId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerTaxNumber?: string;
  salesOrderRef?: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  exchangeRate: number;
  lines: SalesInvoiceLineItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  status: SalesInvoiceStatus;
  paymentStatus: ARPaymentStatus;
  zatcaUuid?: string;
  zatcaQrHash?: string;
  hash: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type CreditNoteType = 'RETURN' | 'PRICE_ADJUSTMENT' | 'COMMERCIAL_DISCOUNT';

export interface CustomerCreditNote {
  id: string;
  tenantId: string;
  companyId: string;
  creditNoteNumber: string;
  customerId: string;
  customerName: string;
  invoiceId?: string;
  invoiceNumber?: string;
  type: CreditNoteType;
  reason: string;
  lines: SalesInvoiceLineItem[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  hash: string;
  createdBy: string;
  createdAt: string;
}

export interface CustomerDebitNote {
  id: string;
  tenantId: string;
  companyId: string;
  debitNoteNumber: string;
  customerId: string;
  customerName: string;
  invoiceId?: string;
  invoiceNumber?: string;
  reason: string;
  amount: number;
  taxAmount: number;
  grandTotal: number;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  hash: string;
  createdBy: string;
  createdAt: string;
}

export type ARPaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'WIRE_TRANSFER';

export type ReceiptType = 'STANDARD' | 'PARTIAL' | 'ADVANCE';

export interface CustomerReceipt {
  id: string;
  tenantId: string;
  companyId: string;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  receiptDate: string;
  paymentMethod: ARPaymentMethod;
  receiptType: ReceiptType;
  referenceNumber: string;
  currency: string;
  exchangeRate: number;
  totalAmount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED' | 'REVERSED';
  reversalReason?: string;
  reversedAt?: string;
  reversedBy?: string;
  hash: string;
  createdBy: string;
  createdAt: string;
}

export type AllocationType = 'AUTOMATIC' | 'MANUAL' | 'FIFO' | 'PARTIAL' | 'ADVANCE';

export interface ReceiptAllocationRecord {
  id: string;
  tenantId: string;
  companyId: string;
  receiptId: string;
  receiptNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  allocatedAmount: number;
  allocationType: AllocationType;
  allocatedAt: string;
  allocatedBy: string;
}

export interface CustomerAgingBucket {
  customerId: string;
  customerCode: string;
  customerName: string;
  currentAmount: number;   // Not yet due
  days1To30: number;       // 1-30 days overdue
  days31To60: number;      // 31-60 days overdue
  days61To90: number;      // 61-90 days overdue
  days91To120: number;     // 91-120 days overdue
  days120Plus: number;     // 120+ days overdue
  totalOutstanding: number;
}

export interface CustomerAgingReport {
  reportDate: string;
  buckets: CustomerAgingBucket[];
  totalCurrent: number;
  total1To30: number;
  total31To60: number;
  total61To90: number;
  total91To120: number;
  total120Plus: number;
  grandTotalOutstanding: number;
  dsoDays: number; // Days Sales Outstanding metric
}

export interface CustomerAgingSnapshotRecord {
  id: string;
  tenantId: string;
  companyId: string;
  snapshotDate: string;
  report: CustomerAgingReport;
  dsoDays: number;
  createdBy: string;
  createdAt: string;
  hash: string;
}

export interface StatementTransactionLine {
  id: string;
  date: string;
  documentNumber: string;
  type: 'INVOICE' | 'RECEIPT' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'REVERSAL';
  description: string;
  debitAmount: number;   // Increases AR
  creditAmount: number;  // Decreases AR
  runningBalance: number;
}

export interface CustomerStatementOfAccount {
  customerId: string;
  customerName: string;
  customerCode: string;
  taxNumber?: string;
  startDate: string;
  endDate: string;
  openingBalance: number;
  transactions: StatementTransactionLine[];
  closingBalance: number;
  totalInvoiced: number;
  totalReceipts: number;
  totalCreditNotes: number;
  totalDebitNotes: number;
  statementHash: string; // Cryptographic integrity hash
}

export interface ARCreditControlCheck {
  customerId: string;
  customerCode: string;
  customerName: string;
  creditLimit: number;
  currentBalance: number;
  openInvoiceAmount: number;
  newOrderAmount: number;
  totalExposure: number;
  availableCredit: number;
  creditUtilizationPercent: number;
  isCreditLimitExceeded: boolean;
  creditDaysAllowed: number;
  hasOverdueInvoices: boolean;
  maxOverdueDays: number;
  isBlocked: boolean;
  blockReason?: string;
  riskRating: CustomerRiskRating;
  canProceed: boolean;
  isOverrideAllowed?: boolean;
  isOverridden?: boolean;
  overrideReason?: string;
  overrideBy?: string;
  overrideApprovedAt?: string;
  warnings: string[];
}

export type ReminderLevel = 'LEVEL_1_GENTLE' | 'LEVEL_2_FIRM' | 'LEVEL_3_FINAL_NOTICE' | 'LEVEL_4_LEGAL';

export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'FORMAL_LETTER';

export type CollectionLifecycleState = 'REMINDER' | 'CALL' | 'PROMISE_TO_PAY' | 'BROKEN_PROMISE' | 'LEGAL_ACTION' | 'CLOSED';

export interface CollectionActivityNote {
  id: string;
  tenantId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  invoiceId?: string;
  invoiceNumber?: string;
  reminderLevel: ReminderLevel;
  activityType: ActivityType;
  lifecycleState: CollectionLifecycleState;
  notes: string;
  followUpDate?: string;
  createdBy: string;
  createdAt: string;
}

export interface PromiseToPayRecord {
  id: string;
  tenantId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  invoiceId: string;
  invoiceNumber: string;
  promisedAmount: number;
  promiseDate: string;
  status: 'PENDING' | 'KEPT' | 'BROKEN' | 'CLOSED';
  notes?: string;
  updatedAt?: string;
  createdBy: string;
  createdAt: string;
}

/**
 * Multi Currency Settlement & Foreign Exchange Difference Readiness
 */
export interface SettlementFXRealization {
  invoiceId: string;
  receiptId: string;
  documentCurrency: string;
  baseCurrency: string;
  invoiceExchangeRate: number;
  receiptExchangeRate: number;
  settlementAmountDoc: number;
  settlementAmountBaseInvoiceRate: number;
  settlementAmountBaseReceiptRate: number;
  realizedGainLossBase: number; // Positive = Realized Gain, Negative = Realized Loss
}

export interface PerformanceObligation {
  id: string;
  description: string;
  standalonePrice: number;
  allocatedPrice: number;
  isSatisfied: boolean;
  satisfactionDate?: string;
}

export interface RevenueRecognitionSchedule {
  id: string;
  contractRef: string;
  customerId: string;
  customerName: string;
  totalContractValue: number;
  recognizedRevenue: number;
  deferredRevenue: number;
  performanceObligations: PerformanceObligation[];
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'FULLY_RECOGNIZED';
  createdAt: string;
}

export interface ARAuditRecord {
  id: string;
  tenantId: string;
  companyId: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'TRANSITION' | 'ALLOCATE' | 'REVERSE' | 'CREDIT_CHECK' | 'STATEMENT_GEN';
  entityType: string;
  entityId: string;
  entityNumber?: string;
  correlationId?: string;
  previousState?: string;
  newState?: string;
  details: string;
  hash: string;
}
