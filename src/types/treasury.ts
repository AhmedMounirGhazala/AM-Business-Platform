/**
 * AM Business Platform - Phase 2.9 Banking, Cash Management & Treasury Domain Types
 * Aligned with SAP S/4HANA FI-BL/TRM, Oracle ERP Cloud Treasury, and IFRS / IAS 7 (Statement of Cash Flows)
 */

export type BankAccountType = 'CURRENT' | 'SAVINGS' | 'MONEY_MARKET' | 'TREASURY' | 'OVERDRAFT' | 'ESCROW';
export type BankAccountStatus = 'ACTIVE' | 'DORMANT' | 'SUSPENDED' | 'CLOSED' | 'BLOCKED' | 'INACTIVE';
export type CashAccountType = 'MAIN_CASH' | 'PETTY_CASH' | 'BRANCH_CASH' | 'VAULT' | 'TILL' | 'MAIN_SAFE';

export type TreasuryTransactionType = 
  | 'BANK_DEPOSIT' 
  | 'BANK_PAYMENT'
  | 'CASH_WITHDRAWAL' 
  | 'CASH_TRANSFER' 
  | 'BANK_TRANSFER' 
  | 'INTERNAL_TRANSFER' 
  | 'INTERCOMPANY_TRANSFER' 
  | 'FX_CONVERSION'
  | 'BANK_CHARGE'
  | 'INTEREST_INCOME'
  | 'INTEREST_EXPENSE';

export type TreasuryTransactionStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'POSTED' | 'RECONCILED' | 'CANCELLED';

export type ChequeDirection = 'INCOMING' | 'OUTGOING';
export type ChequeType = 'STANDARD' | 'POST_DATED' | 'CERTIFIED' | 'CASHIERS_CHEQUE' | 'PDC';
export type ChequeStatus = 
  | 'RECEIVED' 
  | 'HELD_IN_VAULT'
  | 'ISSUED' 
  | 'PRINTED'
  | 'DELIVERED'
  | 'DEPOSITED' 
  | 'UNDER_CLEARING' 
  | 'CLEARED' 
  | 'RETURNED' 
  | 'DISHONOURED' 
  | 'BOUNCED'
  | 'CANCELLED' 
  | 'VOID'
  | 'VOIDED'
  | 'LOST'
  | 'DESTROYED';

export type ReconciliationStatus = 'UNRECONCILED' | 'PARTIALLY_RECONCILED' | 'RECONCILED';
export type MatchStatus = 'EXACT_MATCH' | 'RULE_MATCH' | 'MANUAL_MATCH' | 'UNMATCHED';

export type ForecastHorizon = 'DAILY' | 'WEEKLY' | 'MONTHLY' | '7_DAYS' | '30_DAYS' | '90_DAYS' | '180_DAYS';
export type CashFlowCategory = 'OPERATING_INFLOW' | 'OPERATING_OUTFLOW' | 'INVESTING' | 'FINANCING' | 'INTERCOMPANY' | 'TAX' | 'PAYROLL';

// ==========================================
// 1. BANK MASTER & CASH ACCOUNTS
// ==========================================

export interface AuthorizedSignatory {
  id: string;
  name: string;
  role: string;
  approvalLimit: number;
  currency: string;
  signatureReference?: string;
  email?: string;
}

export interface BankMaster {
  id: string;
  bankCode: string;
  bankName: string;
  bankNameAr?: string;
  swiftCode: string;
  routingCode?: string;
  country: string;
  headquartersCity?: string;
  rating?: string;
  website?: string;
  contactNumber?: string;
  branches?: BankBranch[];
  isActive: boolean;
  companyId?: string;
  createdAt?: string;
}

export interface BankBranch {
  id: string;
  branchCode: string;
  branchName: string;
  branchNameAr?: string;
  city: string;
  address?: string;
  managerName?: string;
  contactPhone?: string;
}

export interface BankAccount {
  id: string;
  companyId: string;
  bankId: string;
  bankName: string;
  branchId?: string;
  branchName?: string;
  accountNumber: string;
  accountName: string;
  accountNameAr?: string;
  iban: string;
  swiftCode: string;
  currency: string;
  accountType: BankAccountType;
  glAccountId: string; // Linked GL Cash at Bank Account (e.g., 102000)
  glAccountCode: string;
  glClearingAccountId?: string; // Cheques in transit / outgoing clearing (e.g., 102900)
  openingBalance?: number;
  currentBalance: number;
  availableBalance?: number;
  reconciledBalance?: number;
  unreconciledBalance: number;
  overdraftLimit?: number;
  status: BankAccountStatus;
  isDefaultOperatingAccount?: boolean;
  signatories?: AuthorizedSignatory[];
  openedDate?: string;
  lastReconciledDate?: string;
  lastStatementDate?: string;
}

export interface CashAccount {
  id: string;
  companyId: string;
  branchId?: string;
  code: string;
  name: string;
  nameAr?: string;
  type: CashAccountType;
  currency: string;
  glAccountId: string; // e.g. 101000 Petty Cash
  glAccountCode: string;
  custodianId?: string;
  custodianName?: string;
  openingBalance?: number;
  currentBalance: number;
  minimumThreshold?: number;
  maximumLimit?: number;
  maxLimit?: number;
  isActive: boolean;
  lastCountDate?: string;
  createdAt?: string;
}

// ==========================================
// 2. TREASURY TRANSACTIONS & TRANSFERS
// ==========================================

export interface TreasuryTransaction {
  id: string;
  transactionNumber: string; // e.g. TR-2026-0001
  companyId: string;
  branchId?: string;
  transactionType?: TreasuryTransactionType;
  type?: TreasuryTransactionType;
  category?: string;
  transactionDate: string;
  valueDate: string;
  
  // Source
  sourceType?: 'BANK' | 'CASH';
  sourceAccountId?: string;
  sourceAccountName?: string;
  sourceCurrency?: string;
  sourceAmount?: number;

  // Destination
  destinationType?: 'BANK' | 'CASH' | 'THIRD_PARTY';
  destinationAccountId?: string;
  destinationAccountName?: string;
  destinationCurrency?: string;
  destinationAmount?: number;

  // Single Account References
  bankAccountId?: string;
  bankAccountName?: string;
  targetBankAccountId?: string;
  targetBankAccountName?: string;
  amount?: number;
  baseAmount?: number;
  currency?: string;
  baseCurrencyAmount?: number;
  
  // Multi-Currency / FX
  exchangeRate?: number;
  fxGainLossAmount?: number;

  // Charges
  bankFeeAmount?: number;
  bankFeeGlAccountId?: string;

  // Offset Account
  offsetAccountCode?: string;
  offsetAccountName?: string;

  // Intercompany
  isIntercompany?: boolean;
  toCompanyId?: string;
  intercompanyDueToAccountId?: string;
  intercompanyDueFromAccountId?: string;

  // Reference & Metadata
  referenceNumber?: string;
  description: string;
  status: TreasuryTransactionStatus;
  reconciliationStatus?: string;
  createdBy?: string;
  createdAt?: string;
  sha256Hash?: string;
  approvedBy?: string;
  approvedAt?: string;
  postedAt?: string;
  clearedAt?: string;
  reconciliationId?: string;
  
  // Decoupled GL Accounting Postings
  glAccountPostings?: TreasuryGLPosting[];
  correlationId?: string;
  auditHash?: string;
}

export interface TreasuryGLPosting {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  currency: string;
  exchangeRate: number;
  memo: string;
  postingType?: 'DEBIT' | 'CREDIT';
  amount?: number;
}

// ==========================================
// 3. CHEQUE & PDC MANAGEMENT
// ==========================================

export interface ChequeBook {
  id: string;
  bankAccountId: string;
  bankAccountName: string;
  bookNumber?: string;
  seriesPrefix?: string;
  startChequeNumber?: number;
  endChequeNumber?: number;
  currentChequeNumber?: number;
  startNumber?: number;
  endNumber?: number;
  currentNumber?: number;
  totalLeaves: number;
  issuedLeaves?: number;
  usedLeaves?: number;
  voidLeaves?: number;
  cancelledLeaves?: number;
  status: 'ACTIVE' | 'EXHAUSTED' | 'CANCELLED';
  issueDate?: string;
  companyId?: string;
}

export interface ChequeRecord {
  id: string;
  chequeNumber: string;
  direction: ChequeDirection;
  chequeType?: ChequeType;
  type?: ChequeType;
  status: ChequeStatus;
  companyId: string;
  
  // Bank Information
  bankAccountId?: string; // For outgoing
  bankAccountName?: string;
  bankName: string;
  branchName?: string;
  draweeBankName?: string; // For incoming (customer's bank)
  
  // Party Information
  partyType?: 'CUSTOMER' | 'VENDOR' | 'EMPLOYEE' | 'OTHER';
  partyId?: string;
  partyName?: string;
  beneficiaryName?: string;
  payeeOrDrawer?: string;
  
  // Financial Information
  issueDate: string;
  dueDate: string; // PDC Maturity Date
  clearingDate?: string;
  clearanceDate?: string;
  currency: string;
  amount: number;
  exchangeRate?: number;
  
  // Actions & History
  depositDate?: string;
  depositedBankAccountId?: string;
  returnDate?: string;
  returnReason?: string;
  bounceReason?: string;
  dishonourPenaltyAmount?: number;
  cancellationReason?: string;
  
  // References
  invoiceReference?: string;
  voucherNumber?: string;
  memo?: string;
  signatoryName?: string;
  
  // GL Postings & Audit
  glPostings?: TreasuryGLPosting[];
  glPostingStatus?: string;
  correlationId?: string;
  auditHash?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 4. BANK RECONCILIATION
// ==========================================

export interface BankStatement {
  id: string;
  companyId?: string;
  bankAccountId: string;
  statementNumber: string;
  statementDate: string;
  openingBalance: number;
  closingBalance: number;
  totalDebits?: number; // Withdrawals
  totalCredits?: number; // Deposits
  lineCount?: number;
  matchedLineCount?: number;
  unmatchedLineCount?: number;
  status?: string;
  importedBy?: string;
  rawContentHash?: string;
  currency: string;
  importedAt: string;
  sourceType?: 'CSV' | 'MT940' | 'CAMT053' | 'MANUAL';
  format?: string;
  contentHash?: string;
  lines: BankStatementLine[];
}

export interface BankStatementLine {
  id: string;
  statementId?: string;
  bankStatementId?: string;
  lineNumber?: number;
  transactionDate: string;
  valueDate?: string;
  transactionType?: 'DEBIT' | 'CREDIT';
  type?: 'DEBIT' | 'CREDIT';
  amount: number;
  referenceNumber?: string;
  chequeNumber?: string;
  payeePayerName?: string;
  description: string;
  matchedTransactionId?: string;
  matchStatus: MatchStatus;
  matchConfidence?: number; // 0 - 100%
  matchedAt?: string;
  reconciledBy?: string;
}

export interface BankReconciliationSession {
  id: string;
  reconciliationNumber: string;
  companyId: string;
  bankAccountId: string;
  bankAccountName: string;
  statementId: string;
  periodStartDate: string;
  periodEndDate: string;
  statementEndingBalance: number;
  bookEndingBalance: number;
  
  // Reconciling Adjustments
  unpresentedChequesTotal: number; // Outgoing cheques not yet cleared by bank
  outstandingDepositsTotal: number; // Deposits in transit not yet in statement
  bankChargesTotal: number; // Charges in statement not yet in books
  bankInterestTotal: number; // Interest in statement not yet in books
  otherAdjustmentsTotal: number;

  reconciledBookBalance: number;
  reconciledBankBalance: number;
  difference: number;
  status: ReconciliationStatus;
  
  matchedCount: number;
  unmatchedStatementCount: number;
  unmatchedBookCount: number;
  
  completedBy?: string;
  completedAt?: string;
  createdAt: string;
}

// ==========================================
// 5. CASH FORECASTING & LIQUIDITY
// ==========================================

export interface CashForecastItem {
  id: string;
  date: string;
  category: CashFlowCategory;
  direction: 'INFLOW' | 'OUTFLOW';
  amount: number;
  currency: string;
  probabilityScore: number; // 0.0 to 1.0 (certainty)
  sourceType: 'AR_INVOICE' | 'AP_BILL' | 'PDC_CHEQUE' | 'RECURRING_BUDGET' | 'LOAN_SCHEDULE' | 'MANUAL';
  referenceId?: string;
  referenceName: string;
  notes?: string;
}

export interface CashFlowPositionPoint {
  date: string;
  periodLabel: string;
  openingCash: number;
  projectedInflows: number;
  projectedOutflows: number;
  netCashFlow: number;
  projectedClosingCash: number;
  liquidityBuffer: number;
  status: 'SURPLUS' | 'OPTIMAL' | 'TIGHT' | 'DEFICIT';
}

export interface LiquidityAnalysisReport {
  companyId: string;
  asOfDate: string;
  horizon: ForecastHorizon;
  currentImmediateLiquidity: number; // Cash + Bank
  totalShortTermReceivables: number; // AR + Incoming PDCs
  totalShortTermPayables: number; // AP + Outgoing PDCs
  netWorkingCapitalCash: number;
  timeline: CashFlowPositionPoint[];
  forecastItems: CashForecastItem[];
}

// ==========================================
// 6. PAYMENT CALENDAR
// ==========================================

export interface PaymentCalendarEntry {
  id: string;
  date?: string;
  dueDate?: string;
  type: 'PAYMENT' | 'COLLECTION';
  partyName?: string;
  counterpartyName?: string;
  amount: number;
  currency: string;
  source?: 'AP_DUE' | 'AR_DUE' | 'PDC_MATURING' | 'PAYROLL' | 'TAX' | 'LOAN';
  category?: string;
  referenceDocumentNumber?: string;
  status: 'PENDING' | 'PROCESSED' | 'OVERDUE' | 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED';
  bankAccountId?: string;
  urgency?: 'HIGH' | 'MEDIUM' | 'LOW';
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  companyId?: string;
}

// ==========================================
// 7. BANK CHARGES & INTEREST
// ==========================================

export interface BankChargeRecord {
  id: string;
  chargeNumber?: string;
  bankAccountId: string;
  bankAccountName: string;
  chargeType: 'MAINTENANCE_FEE' | 'TRANSFER_FEE' | 'SWIFT_FEE' | 'OVERDRAFT_INTEREST' | 'LOAN_INTEREST' | 'RETURNED_CHEQUE_FEE' | 'ACCOUNT_MAINTENANCE' | string;
  amount: number;
  vatRate?: number;
  vatAmount?: number;
  totalChargeAmount?: number;
  totalDeduction?: number;
  currency: string;
  chargeDate: string;
  referenceNumber: string;
  description: string;
  glExpenseAccountId?: string;
  glExpenseAccountCode?: string;
  status?: 'POSTED' | 'REVERSED';
  glPostingStatus?: string;
  correlationId?: string;
  auditHash?: string;
  postedAt?: string;
  companyId?: string;
}

// ==========================================
// 8. FOREIGN CURRENCY & FX
// ==========================================

export interface ExchangeRateRecord {
  id: string;
  companyId?: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: string;
  rateType?: 'SPOT' | 'FORWARD' | 'AVERAGE' | string;
  source?: 'CENTRAL_BANK' | 'MARKET_SPOT' | 'MANUAL' | 'SAMA_OFFICIAL' | 'REUTERS' | 'BLOOMBERG' | 'MANUAL_ENTRY' | string;
  createdAt?: string;
}

export interface FXRevaluationResult {
  revaluationId?: string;
  companyId?: string;
  fiscalPeriod?: string;
  asOfDate: string;
  baseCurrency: string;
  revaluedAccounts: {
    accountId: string;
    accountName: string;
    currency: string;
    foreignBalance: number;
    bookValueBase: number;
    closingRate: number;
    revaluedBase: number;
    unrealizedGainLoss: number;
  }[];
  totalUnrealizedGainLoss: number;
  glAccountPostings: TreasuryGLPosting[];
}

// ==========================================
// 9. TREASURY DOMAIN EVENTS (Zero Direct GL)
// ==========================================

export type TreasuryDomainEventType = 
  | 'BANK_TRANSFER_POSTED'
  | 'BANK_DEPOSIT_POSTED'
  | 'BANK_WITHDRAWAL_POSTED'
  | 'CASH_TRANSFER_POSTED'
  | 'INTERCOMPANY_TRANSFER_POSTED'
  | 'CHEQUE_ISSUED'
  | 'CHEQUE_RECEIVED'
  | 'CHEQUE_DEPOSITED'
  | 'CHEQUE_CLEARED'
  | 'CHEQUE_RETURNED'
  | 'CHEQUE_DISHONOURED'
  | 'CHEQUE_CANCELLED'
  | 'BANK_RECONCILIATION_COMPLETED'
  | 'BANK_CHARGES_POSTED'
  | 'FX_TRANSFER_POSTED'
  | 'FX_REVALUATION_CALCULATED';

export interface TreasuryDomainEvent {
  id: string;
  eventType: TreasuryDomainEventType;
  entityId: string;
  entityType: 'BANK_ACCOUNT' | 'CASH_ACCOUNT' | 'TRANSACTION' | 'CHEQUE' | 'RECONCILIATION' | 'CHARGE' | 'FX_REVALUATION';
  companyId: string;
  timestamp: string;
  performedBy: string;
  payload: any;
  glAccountPostings: TreasuryGLPosting[];
  sha256Hash: string;
  correlationId: string;
}

// ==========================================
// 10. TREASURY DASHBOARD SUMMARY
// ==========================================

export interface TreasuryDashboardSummary {
  companyId: string;
  asOfDate: string;
  baseCurrency: string;
  
  // Total Positions
  totalCashOnHand: number;
  totalBankBalances: number;
  totalImmediateLiquidity: number;
  totalOverdraftAvailable: number;
  
  // Cheque Positions
  totalPdcIncoming: number;
  totalPdcOutgoing: number;
  maturingPdcNext7DaysCount: number;
  maturingPdcNext7DaysAmount: number;

  // Unreconciled
  unreconciledBankCount: number;
  unreconciledTransactionsCount: number;

  // 7-Day Net Cash Flow
  sevenDayInflow: number;
  sevenDayOutflow: number;
  sevenDayNetPosition: number;

  // Account Breakdown
  bankAccounts: BankAccount[];
  cashAccounts: CashAccount[];
  
  // Currency Allocation
  currencyBreakdown: {
    currency: string;
    totalBaseValue: number;
    percentage: number;
  }[];

  recentTransactions: TreasuryTransaction[];
  upcomingCalendar: PaymentCalendarEntry[];
}

// ==========================================
// 11. ENTERPRISE HARDENING & QUALITY GATE (PHASE 2.9)
// ==========================================

export type QualityGateCriterionStatus = 'PASSED' | 'FAILED' | 'WARNING';

export interface Phase29QualityGateAssertion {
  criterionId: string;
  criterionName: string;
  category: 
    | 'IDEMPOTENCY_CONTROL'
    | 'NUMBERING_GOVERNANCE'
    | 'ACCOUNT_LOCK_PROTECTION'
    | 'CHEQUE_LIFECYCLE'
    | 'APPROVAL_WORKFLOW'
    | 'RECONCILIATION_INTEGRITY'
    | 'STATEMENT_IMPORT_PROTECTION'
    | 'FX_GOVERNANCE'
    | 'LIQUIDITY_SNAPSHOT'
    | 'CASH_POSITION_INTEGRITY'
    | 'AUDIT_CHAIN_INTEGRITY'
    | 'CROSS_DOMAIN_REGRESSION';
  status: QualityGateCriterionStatus;
  verificationDetails: string;
  sha256VerificationHash: string;
  executionTimestamp: string;
}

export interface Phase29QualityGateReport {
  reportId: string;
  phase: 'Phase 2.9 Banking, Cash Management & Treasury';
  certificationStatus: 'CERTIFIED_ENTERPRISE_GRADE' | 'FAILED';
  totalAssertions: number;
  passedCount: number;
  failedCount: number;
  passRate: number; // e.g. 100.0%
  overallScore: string; // e.g. '100.0% (15/15 Passed)'
  companyId: string;
  executionTimestamp: string;
  auditor: string;
  assertions: Phase29QualityGateAssertion[];
  cryptographicSeal: string;
  immutableMetadata: {
    ias7CashFlowCompliant: boolean;
    ias21FXCompliant: boolean;
    iso20022Ready: boolean;
    zeroDirectGLPostingEnforced: boolean;
    gaplessNumberingEnforced: boolean;
  };
}

export interface ImmutableLiquiditySnapshot {
  id: string;
  snapshotNumber: string;
  companyId: string;
  snapshotDate: string;
  baseCurrency: string;
  totalCashOnHand: number;
  totalBankBalances: number;
  totalUndepositedCheques: number;
  totalOutstandingOutgoingCheques: number;
  netImmediateLiquidity: number;
  forecastedInflows30Days: number;
  forecastedOutflows30Days: number;
  net30DayForecast: number;
  accountBreakdown: {
    accountId: string;
    accountType: 'BANK' | 'CASH';
    accountName: string;
    currency: string;
    balance: number;
    baseCurrencyValue: number;
  }[];
  sealedBy: string;
  sealedAt: string;
  sha256Signature: string;
  previousSnapshotHash?: string;
}

export interface TreasuryAuditLogRecord {
  id: string;
  sequenceNumber: number;
  companyId: string;
  eventType: TreasuryDomainEventType | 'SNAPSHOT_SEALED' | 'RECONCILIATION_FINALIZED' | 'CHEQUE_STATE_CHANGED' | 'APPROVAL_GRANTED';
  entityId: string;
  entityType: string;
  action: string;
  performedBy: string;
  timestamp: string;
  payloadSummary: string;
  previousHash: string;
  currentHash: string;
  correlationId: string;
}

export interface TreasuryApprovalPolicy {
  id: string;
  companyId: string;
  currency: string;
  tiers: TreasuryApprovalThresholdTier[];
}

export interface TreasuryApprovalThresholdTier {
  tierLevel: number;
  tierName: string;
  minAmount: number;
  maxAmount: number; // -1 for unlimited
  requiredSignatures: number;
  allowedRoles: string[];
}

