/**
 * AM Business Platform - Accounts Payable & Financial Matching Domain Types
 * Enterprise DDD Architecture aligned with SAP S/4HANA FI-AP/MM, Oracle ERP Cloud, Microsoft Dynamics 365, IFRS & ZATCA standards
 */

import { UserRole } from './index';

// ==================== 1. SUPPLIER INVOICE & THREE-WAY MATCHING ====================

export type SupplierInvoiceStatus = 
  | 'DRAFT'
  | 'OPEN'
  | 'HOLD'
  | 'PENDING_MATCHING'
  | 'MATCHED'
  | 'BLOCKED_VARIANCE'
  | 'APPROVED'
  | 'POSTED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'REVERSED';

export type ThreeWayMatchStatus = 
  | 'PENDING'
  | 'MATCHED'
  | 'EXACT_MATCH'
  | 'WITHIN_TOLERANCE'
  | 'PRICE_VARIANCE_BLOCKED'
  | 'QUANTITY_VARIANCE_BLOCKED'
  | 'TAX_VARIANCE_BLOCKED'
  | 'AMOUNT_VARIANCE_BLOCKED'
  | 'MANUALLY_RELEASED'
  | 'FAILED';

export type MatchAction = 'ACCEPT' | 'WARNING' | 'HARD_BLOCK';

export type InvoiceToleranceScope = 'SYSTEM' | 'VENDOR' | 'PO_LINE' | 'ITEM';

export interface InvoiceToleranceProfile {
  id: string;
  tenantId: string;
  companyId: string;
  profileName?: string;
  scope: InvoiceToleranceScope;
  targetId?: string; // vendorId, poItemId, or itemSku
  priceTolerancePercent: number; // e.g. 2.0 = 2%
  priceToleranceAmount: number; // e.g. 100 SAR/USD
  qtyTolerancePercent: number; // e.g. 0.0%
  qtyToleranceAmount?: number;
  taxTolerancePercent?: number; // e.g. 1.0%
  taxToleranceAmount?: number;
  amountTolerancePercent?: number; // e.g. 1.0%
  amountToleranceAmount?: number; // e.g. 200 SAR
  enforceHardBlock: boolean;
  allowOverBilling: boolean;
  isActive?: boolean;
}

export interface ThreeWayMatchLineResult {
  id?: string;
  itemSku: string;
  itemName: string;
  poItemId?: string;
  grnItemId?: string;
  invoiceItemId?: string;
  poUnitPrice: number;
  poQty: number;
  poLineTotal: number;
  grnUnitPrice: number;
  grnQty: number;
  grnLineTotal: number;
  invoiceUnitPrice: number;
  invoiceQty: number;
  invoiceLineTotal: number;
  invoiceTaxAmount: number;
  priceVariance: number;
  priceVariancePercent: number;
  priceVarianceAmount: number;
  qtyVariance: number;
  qtyVariancePercent: number;
  qtyVarianceAmount: number;
  taxVariance: number;
  amountVariance: number;
  status: 'EXACT_MATCH' | 'WITHIN_TOLERANCE' | 'PRICE_VARIANCE_BLOCKED' | 'QTY_VARIANCE_BLOCKED' | 'TAX_VARIANCE_BLOCKED' | 'AMOUNT_VARIANCE_BLOCKED' | 'PASSED_WITH_WARNING';
  action: MatchAction;
  discrepancies: string[];
}

export interface ThreeWayMatchDetail {
  poNumber: string;
  grnNumber: string;
  poTotalAmount: number;
  grnTotalAmount: number;
  invoiceTotalAmount: number;
  priceVariance: number;
  quantityVariance: number;
  taxVariance?: number;
  amountVariance: number;
  realizedFXGainLoss?: number;
  isWithinTolerance: boolean;
  matchedAt: string;
  evaluatedBy?: string;
  overallAction?: MatchAction;
  toleranceProfileApplied?: string;
  discrepancies: string[];
  lineResults?: ThreeWayMatchLineResult[];
  sha256AuditSeal?: string;
}

export interface SupplierInvoiceItem {
  id: string;
  invoiceId?: string;
  poItemId?: string;
  poLineNumber?: number;
  grnItemId?: string;
  grnId?: string;
  grnNumber?: string;
  grnLineNumber?: number;
  itemSku: string;
  itemName: string;
  description?: string;
  billedQty: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  taxCode?: string;
  lineTotal: number;
  baseCurrencyUnitPrice?: number;
  baseCurrencyLineTotal?: number;
  costCenterId?: string;
  profitCenterId?: string;
  glAccountId?: string;
  poUnitPrice?: number;
  receivedQty?: number;
  realizedFxDifference?: number;
}

export interface SupplierInvoice {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  invoiceNumber: string;
  vendorInvoiceNumber: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  poId?: string;
  poNumber?: string;
  poReferences?: string[];
  grnId?: string;
  grnNumber?: string;
  grnReferences?: string[];
  invoiceDate: string;
  postingDate: string;
  dueDate: string;
  paymentTermsId?: string;
  paymentTermsName?: string;
  currency: string;
  exchangeRate: number;
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
  baseCurrencyGrossAmount?: number;
  discountAmount?: number;
  taxRegistrationNumber?: string; // ZATCA Tax ID
  status: SupplierInvoiceStatus;
  threeWayMatchStatus: ThreeWayMatchStatus;
  matchingDetails?: ThreeWayMatchDetail;
  items: SupplierInvoiceItem[];
  approvedBy?: string;
  approvedAt?: string;
  varianceReleasedBy?: string;
  varianceReleaseReason?: string;
  financialEventId?: string;
  journalEntryId?: string;
  clearedWithGRIR?: boolean;
  version?: number;
  expectedVersion?: number;
  sha256Seal?: string;
  digitalSignature?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 2. GR/IR CLEARING ====================

export interface GRIRClearingRecord {
  id: string;
  tenantId: string;
  companyId: string;
  poId: string;
  poNumber: string;
  itemSku: string;
  itemName: string;
  vendorId: string;
  vendorName: string;
  grnId: string;
  grnNumber: string;
  grnQty: number;
  grnAmount: number;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceQty?: number;
  invoiceAmount?: number;
  clearedQty: number;
  clearedAmount: number;
  openQty: number;
  openAmount: number;
  status: 'OPEN' | 'PARTIALLY_CLEARED' | 'FULLY_CLEARED' | 'ADJUSTED_WRITE_OFF';
  clearedAt?: string;
  writeOffAmount?: number;
  writeOffReason?: string;
  createdAt: string;
}

// ==================== 3. ACCOUNTS PAYABLE VOUCHER ====================

export interface APVoucher {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  voucherNumber: string;
  supplierInvoiceId: string;
  supplierInvoiceNumber: string;
  vendorInvoiceNumber: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  voucherDate: string;
  dueDate: string;
  currency: string;
  grossAmount: number;
  netAmount: number;
  paidAmount: number;
  remainingAmount: number;
  earlyDiscountDeadline?: string;
  earlyDiscountPercent?: number;
  earlyDiscountAmount?: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  createdAt: string;
}

// ==================== 4. SUPPLIER CREDIT NOTE ====================

export type CreditNoteReason = 
  | 'DEFECTIVE_GOODS'
  | 'RETURN_DAMAGED'
  | 'RETURN_DEFECTIVE'
  | 'PRICE_DIFFERENCE'
  | 'PRICE_CORRECTION'
  | 'VOLUME_REBATE'
  | 'RETURN_OF_GOODS'
  | 'OTHER';

export interface SupplierCreditNote {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  creditNoteNumber: string;
  vendorCreditNoteRef: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  originalInvoiceId?: string;
  originalInvoiceNumber?: string;
  vendorReturnId?: string;
  issueDate: string;
  reasonCode: CreditNoteReason;
  currency: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'DRAFT' | 'APPROVED' | 'POSTED' | 'APPLIED' | 'CANCELLED';
  appliedToVoucherId?: string;
  financialEventId?: string;
  journalEntryId?: string;
  createdAt: string;
  postedAt?: string;
}

export interface SupplierDebitNote {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  debitNoteNumber: string;
  vendorDebitNoteRef: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  originalInvoiceId?: string;
  originalInvoiceNumber?: string;
  issueDate: string;
  reasonCode: CreditNoteReason;
  currency: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'DRAFT' | 'APPROVED' | 'POSTED' | 'APPLIED' | 'CANCELLED';
  financialEventId?: string;
  journalEntryId?: string;
  createdAt: string;
  postedAt?: string;
}

export interface GRIRClearingExecution {
  id: string;
  tenantId: string;
  companyId: string;
  poId: string;
  poNumber: string;
  grnId?: string;
  grnNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  clearedQuantity: number;
  clearedAmount: number;
  grnAmount: number;
  invoiceAmount: number;
  ppvVarianceAmount: number;
  exchangeDifferenceAmount: number;
  openQuantity: number;
  openAmount: number;
  status: 'OPEN' | 'PARTIALLY_CLEARED' | 'FULLY_CLEARED' | 'ADJUSTED_WRITE_OFF';
  financialEventId?: string;
  journalEntryId?: string;
  clearedAt: string;
  sha256Seal?: string;
}

// ==================== 5. PAYMENT PROPOSAL & BATCH PREPARATION ====================

export interface PaymentProposalItem {
  id: string;
  proposalId: string;
  voucherId: string;
  voucherNumber: string;
  vendorInvoiceNumber: string;
  vendorId: string;
  vendorName: string;
  grossAmount: number;
  remainingAmount: number;
  proposedAmount: number;
  discountAmountCaptured?: number;
  earlyDiscountAmount?: number;
  netPaymentAmount: number;
  dueDate: string;
  paymentPriority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isExcluded: boolean;
  exclusionReason?: string;
}

export interface PaymentProposal {
  id: string;
  tenantId: string;
  companyId: string;
  proposalNumber: string;
  proposalDate?: string;
  cutoffDueDate: string;
  vendorId?: string;
  currency: string;
  totalProposedAmount: number;
  totalEarlyDiscountCaptured?: number;
  totalDiscountCaptured?: number;
  netPaymentAmount?: number;
  status: 'DRAFT' | 'APPROVED' | 'EXECUTED' | 'CANCELLED';
  items: PaymentProposalItem[];
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface PaymentBatchItem {
  id: string;
  batchId: string;
  voucherId: string;
  vendorId: string;
  vendorName: string;
  paymentAmount: number;
  reference: string;
}

export interface PaymentBatch {
  id: string;
  tenantId: string;
  companyId: string;
  batchNumber: string;
  proposalId: string;
  paymentMethod: 'BANK_TRANSFER' | 'CHECK' | 'WIRE' | 'ACH';
  bankAccountId?: string;
  currency: string;
  totalAmount: number;
  totalCount: number;
  paymentDate: string;
  status: 'DRAFT' | 'APPROVED' | 'PROCESSED' | 'RELEASED' | 'COMPLETED' | 'CANCELLED' | 'REVERSED';
  items: PaymentBatchItem[];
  releasedBy?: string;
  releasedAt?: string;
  createdAt: string;
}

// ==================== 6. VENDOR STATEMENT ====================

export interface VendorStatementLine {
  id: string;
  date: string;
  documentType: 'INVOICE' | 'PAYMENT' | 'CREDIT_NOTE' | 'OPENING_BALANCE';
  documentNumber: string;
  reference: string;
  debit: number; // Reduces balance owed to vendor
  credit: number; // Increases balance owed to vendor
  runningBalance: number;
}

export interface VendorStatement {
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  startDate: string;
  endDate: string;
  currency: string;
  openingBalance: number;
  totalInvoices: number;
  totalPayments: number;
  totalCreditNotes: number;
  closingBalance: number;
  lines: VendorStatementLine[];
}

// ==================== 7. VENDOR AGING REPORT ====================

export interface VendorAgingSummary {
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  current: number;
  days1To30: number;
  days31To60: number;
  days61To90: number;
  days91To120: number;
  over120: number;
  totalDue: number;
  weightedAvgDaysOverdue: number;
}

export interface VendorAgingReport {
  reportDate: string;
  currency: string;
  vendors: VendorAgingSummary[];
  totalCurrent: number;
  total1To30: number;
  total31To60: number;
  total61To90: number;
  total91To120: number;
  totalOver120: number;
  grandTotal: number;
}

// ==================== 8. PURCHASE ACCRUAL ENGINE ====================

export interface PurchaseAccrual {
  id: string;
  tenantId: string;
  companyId: string;
  accrualNumber: string;
  period: string; // e.g. "2026-08"
  poId: string;
  poNumber: string;
  grnId: string;
  grnNumber: string;
  vendorId: string;
  vendorName: string;
  accruedAmount: number;
  currency: string;
  status: 'POSTED' | 'REVERSED';
  postedAt: string;
  reversedAt?: string;
  createdAt: string;
}

// ==================== 9. AP AUDIT TRAIL ====================

export interface APAuditRecord {
  id: string;
  tenantId: string;
  companyId: string;
  actionType: string;
  performedBy: string;
  performedByName: string;
  performedAt: string;
  targetDocumentType: string;
  targetDocumentId: string;
  targetDocumentNumber: string;
  details: string;
  immutableHash: string;
  correlationId?: string;
  reason?: string;
  previousState?: string;
  newState?: string;
}

// ==================== 10. PAYMENT ALLOCATION ENGINE TYPES ====================

export type PaymentAllocationType = 'AUTOMATIC' | 'MANUAL' | 'FIFO' | 'PARTIAL';

export interface PaymentAllocationRecord {
  id: string;
  tenantId: string;
  companyId: string;
  batchId?: string;
  paymentItemId?: string;
  voucherId: string;
  voucherNumber: string;
  vendorId: string;
  vendorName: string;
  allocatedAmount: number;
  allocationType: PaymentAllocationType;
  allocatedAt: string;
  allocatedBy: string;
  reference?: string;
}

// ==================== 11. VENDOR CREDIT CONTROL TYPES ====================

export interface VendorCreditControlCheck {
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  outstandingBalance: number;
  creditLimit: number;
  creditDays: number;
  isBlocked: boolean;
  blockReason?: string;
  utilizationPercent: number;
  isLimitExceeded: boolean;
  warningThresholdPercent: number;
  warnings: string[];
}

// ==================== 12. EXCHANGE RATE READINESS TYPES ====================

export interface ExchangeRateDifference {
  docCurrency: string;
  docExchangeRate: number;
  paymentExchangeRate: number;
  documentAmountInDocCurrency: number;
  documentAmountInLocalCurrency: number;
  paymentAmountInLocalCurrency: number;
  realizedExchangeDifference: number; // Positive = Gain, Negative = Loss
  realizedGainLossStatus: 'GAIN' | 'LOSS' | 'NEUTRAL';
}

// ==================== 13. VENDOR AGING SNAPSHOT TYPES ====================

export interface VendorAgingSnapshotRecord {
  id: string;
  tenantId: string;
  companyId: string;
  snapshotId: string;
  snapshotTimestamp: string;
  reportDate: string;
  currency: string;
  vendors: VendorAgingSummary[];
  grandTotal: number;
  createdBy: string;
  immutableHash: string;
}

// ==================== 14. PAYMENT REVERSAL TYPES ====================

export interface PaymentReversalRecord {
  id: string;
  tenantId: string;
  companyId: string;
  originalBatchId: string;
  originalBatchNumber: string;
  voucherId: string;
  voucherNumber: string;
  vendorId: string;
  vendorName: string;
  reversedAmount: number;
  currency: string;
  reason: string;
  reversedBy: string;
  reversedAt: string;
  financialEventId?: string;
}

// ==================== 15. AP ANALYTICS & RECONCILIATION TYPES ====================

export interface CashOutflowBucket {
  period: '1-7_DAYS' | '8-14_DAYS' | '15-30_DAYS' | '31-60_DAYS' | '61-90_DAYS' | 'OVER_90_DAYS';
  periodLabel: string;
  projectedOutflow: number;
  voucherCount: number;
}

export interface VendorExposureSummary {
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  totalOpenAmount: number;
  overdueAmount: number;
  shareOfTotalPercent: number;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface APAnalyticsDashboard {
  tenantId: string;
  companyId: string;
  asOfDate: string;
  currency: string;
  totalOpenPayables: number;
  totalOverduePayables: number;
  overduePercentage: number;
  daysPayableOutstanding: number; // DPO
  earlyDiscountCaptureRate: number; // %
  totalEarlyDiscountsCaptured: number;
  totalEarlyDiscountsMissed: number;
  grirUninvoicedExposure: number; // GRNI (Goods Received Not Invoiced)
  vendorConcentrationIndex: number; // Herfindahl-Hirschman Index (0-10000)
  outflowForecast: CashOutflowBucket[];
  topVendorsByExposure: VendorExposureSummary[];
}

export interface VendorStatementReconciliation {
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  asOfDate: string;
  statementClosingBalance: number;
  subledgerOpenBalance: number;
  variance: number;
  isReconciled: boolean;
  unmatchedItemCount: number;
  reconciliationStatus: 'PERFECT_MATCH' | 'VARIANCE_DETECTED' | 'DISPUTED';
  notes?: string;
}

