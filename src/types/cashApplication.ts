/**
 * AM BUSINESS PLATFORM — CUSTOMER CASH APPLICATIONS & LOCKBOX TYPES
 * Phase 3.2C-04: Advanced Customer Cash Applications, Bank Lockbox Auto-Matching,
 * Remittance Ingestion, Dispute Deductions, Claim Settlement & Credit Collections
 * Architectural Standard: SAP S/4HANA FI-AR Lockbox / AutoMatch & FSCM Dispute Management, Oracle Cash App
 */

export type LockboxFormat = 'BAI2' | 'MT940' | 'EDI_820' | 'CAMT_053' | 'CSV_GENERIC';

export type LockboxBatchStatus =
  | 'IMPORTED'
  | 'PROCESSING'
  | 'AUTO_CLEARED'
  | 'PARTIALLY_CLEARED'
  | 'REQUIRES_REVIEW'
  | 'CANCELLED';

export type CashAppMatchingStatus =
  | 'EXACT_MATCH'
  | 'MULTI_INVOICE_MATCH'
  | 'DISCOUNT_TOLERANCE_MATCH'
  | 'PARTIAL_RESIDUAL_MATCH'
  | 'CUSTOMER_ON_ACCOUNT'
  | 'UNIDENTIFIED'
  | 'DISPUTED_DEDUCTION';

export type DeductionReasonCode =
  | 'PRICE_DISCREPANCY'
  | 'DAMAGED_GOODS'
  | 'SHORT_DELIVERY'
  | 'UNAUTHORIZED_CASH_DISCOUNT'
  | 'TRADE_PROMOTION_REBATE'
  | 'TAX_EXEMPTION_CLAIM'
  | 'FREIGHT_OVERCHARGE'
  | 'RETURNS_PENDING_CREDIT'
  | 'DUPLICATE_PAYMENT_NETTING'
  | 'OTHER_UNSPECIFIED';

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_INVESTIGATION'
  | 'PENDING_SOD_APPROVAL'
  | 'APPROVED_CREDIT_MEMO'
  | 'REJECTED_REBILLED'
  | 'WRITTEN_OFF'
  | 'CANCELLED';

export type ResidualTreatment =
  | 'RESIDUAL_ITEM'      // Clears original invoice, generates new residual item with original due date
  | 'PARTIAL_PAYMENT'    // Keeps original invoice open with reduced open balance
  | 'ON_ACCOUNT_CREDIT'; // Unallocated excess or unreferenced payment posted to customer AR ledger

export interface RemittanceAdviceLine {
  id: string;
  invoiceNumber: string;
  invoiceDate?: string;
  grossInvoiceAmount: number;
  discountTaken: number;
  deductionAmount: number;
  deductionReasonCode?: DeductionReasonCode;
  deductionNotes?: string;
  netPaymentAmount: number;
}

export interface LockboxTransaction {
  id: string;
  batchId: string;
  transactionRef: string;
  checkOrTraceNumber: string;
  paymentMethod: 'CHECK' | 'WIRE' | 'ACH' | 'ELECTRONIC_EFT' | 'CREDIT_CARD';
  paymentDate: string;
  depositDate: string;
  bankAccountId: string;
  bankAccountIban: string;
  remittedAmount: number;
  currency: string;
  exchangeRate: number;
  payerName: string;
  payerTaxId?: string;
  payerIban?: string;
  payerCustomerCode?: string;
  matchedCustomerId?: string;
  matchingConfidenceScore: number; // 0 to 100%
  matchingStatus: CashAppMatchingStatus;
  remittanceLines: RemittanceAdviceLine[];
  appliedAmount: number;
  onAccountAmount: number;
  unappliedAmount: number;
  cashApplicationRecordId?: string;
  status: 'PENDING' | 'CLEARED' | 'PARTIAL' | 'EXCEPTION';
  exceptionMessage?: string;
}

export interface LockboxBatch {
  id: string;
  tenantId: string;
  companyId: string;
  batchNumber: string;
  format: LockboxFormat;
  depositDate: string;
  bankAccountId: string;
  bankName: string;
  currency: string;
  totalCheckCount: number;
  totalBatchAmount: number;
  totalAppliedAmount: number;
  totalOnAccountAmount: number;
  totalUnappliedAmount: number;
  status: LockboxBatchStatus;
  transactions: LockboxTransaction[];
  importedAt: string;
  importedBy: string;
  processedAt?: string;
  processedBy?: string;
  version: number;
}

export interface PaymentAllocationItem {
  id: string;
  billingDocumentId: string;
  billingDocumentNumber: string;
  originalGrossAmount: number;
  openBalanceBefore: number;
  allocatedAmount: number;
  cashDiscountTaken: number;
  disputeDeductionAmount: number;
  deductionReasonCode?: DeductionReasonCode;
  disputeCaseId?: string;
  fxGainLossAmount: number; // Realized FX gain (+) or loss (-)
  openBalanceAfter: number;
  residualTreatment: ResidualTreatment;
  isFullyCleared: boolean;
}

export interface CashApplicationRecord {
  id: string;
  tenantId: string;
  companyId: string;
  applicationNumber: string;
  applicationDate: string;
  postingDate: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  bankAccountId: string;
  bankAccountGl: string;
  currency: string;
  exchangeRate: number;
  paymentMethod: 'CHECK' | 'WIRE' | 'ACH' | 'ELECTRONIC_EFT' | 'CREDIT_CARD';
  paymentReference: string;
  checkNumber?: string;
  totalReceivedAmount: number;
  totalAllocatedAmount: number;
  totalDiscountAmount: number;
  totalDeductionsAmount: number;
  totalFxGainLoss: number;
  totalOnAccountAmount: number;
  allocations: PaymentAllocationItem[];
  financialEventId?: string;
  glJournalEntryId?: string;
  lockboxBatchId?: string;
  lockboxTransactionId?: string;
  status: 'POSTED' | 'REVERSED' | 'DRAFT';
  reversalReason?: string;
  reversedAt?: string;
  reversedBy?: string;
  reversalEventId?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
  auditHash: string;
  version: number;
}

export interface DisputeDeductionCase {
  id: string;
  tenantId: string;
  companyId: string;
  disputeNumber: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  billingDocumentId: string;
  billingDocumentNumber: string;
  deliveryId?: string;
  rmaId?: string;
  contractId?: string;
  reasonCode: DeductionReasonCode;
  status: DisputeStatus;
  disputedAmount: number;
  currency: string;
  exchangeRate: number;
  investigationNotes: string;
  assignedInvestigator: string;
  assignedDepartment: 'SALES' | 'LOGISTICS' | 'BILLING' | 'QUALITY' | 'FINANCE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dueDate: string;
  requiresSoDApproval: boolean;
  sodApproverRole?: string;
  approvedBy?: string;
  approvedAt?: string;
  settlementCreditMemoId?: string;
  settlementCreditMemoNumber?: string;
  rebillInvoiceNumber?: string;
  resolutionSummary?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  version: number;
}

export interface CustomerPromiseToPay {
  id: string;
  tenantId: string;
  companyId: string;
  p2pNumber: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  billingDocumentIds: string[];
  totalPromisedAmount: number;
  currency: string;
  promisedPayDate: string;
  installmentCount: number;
  installments: {
    installmentNumber: number;
    dueDate: string;
    amount: number;
    isPaid: boolean;
    paidDate?: string;
    paidAmount?: number;
  }[];
  status: 'ACTIVE' | 'FULFILLED' | 'BROKEN' | 'CANCELLED';
  collectorNotes: string;
  collectorUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutoMatchConfig {
  tenantId: string;
  companyId: string;
  autoClearConfidenceThreshold: number; // e.g., 95
  maxCashDiscountToleranceDays: number; // e.g., 5 days beyond term discount window
  maxUnderpaymentToleranceAmount: number; // e.g., $10.00 auto-write-off threshold
  allowResidualItemCreation: boolean;
  defaultBankGlAccount: string;
  salesDiscountGlAccount: string;
  arDisputeDeductionGlAccount: string;
  realizedFxGainGlAccount: string;
  realizedFxLossGlAccount: string;
  customerOnAccountGlAccount: string;
}
