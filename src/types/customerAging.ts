/**
 * AM Enterprise ERP — Phase 3.2C-05 Domain Types
 * Domain: Customer Aging, Statements of Account, IFRS 9 ECL Provisioning,
 * Bad Debt Write-Offs & End-to-End Order-to-Cash (O2C) Analytics
 */

export type AgingBucket = 'CURRENT' | 'DAYS_1_30' | 'DAYS_31_60' | 'DAYS_61_90' | 'DAYS_91_120' | 'OVER_120';

export type AgingMethod = 'DUE_DATE' | 'DOCUMENT_DATE';

export interface OpenInvoiceAgingItem {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  originalAmount: number;
  openBalance: number;
  daysOverdue: number;
  bucket: AgingBucket;
  currency: string;
}

export interface CustomerAgingDetail {
  customerId: string;
  customerName: string;
  customerCode: string;
  currency: string;
  totalOpenBalance: number;
  currentAmount: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days91to120: number;
  over120: number;
  oldestInvoiceDate: string;
  oldestDueDate: string;
  maxDaysOverdue: number;
  invoiceCount: number;
  creditRating?: string;
  openInvoices: OpenInvoiceAgingItem[];
}

export interface CustomerAgingSummary {
  totalReceivables: number;
  totalCurrent: number;
  totalDays1to30: number;
  totalDays31to60: number;
  totalDays61to90: number;
  totalDays91to120: number;
  totalOver120: number;
  customerCount: number;
  openInvoiceCount: number;
}

export interface CustomerAgingReport {
  id: string;
  asOfDate: string;
  agingMethod: AgingMethod;
  tenantId: string;
  companyId: string;
  currency: string;
  customers: CustomerAgingDetail[];
  summary: CustomerAgingSummary;
  generatedAt: string;
  generatedBy: string;
  sha256Seal: string;
}

export interface AgingSnapshotRecord {
  id: string;
  snapshotNumber: string;
  tenantId: string;
  companyId: string;
  asOfDate: string;
  agingMethod: AgingMethod;
  currency: string;
  summary: CustomerAgingSummary;
  customerCount: number;
  dataPayloadHash: string;
  sha256Seal: string;
  createdAt: string;
  createdBy: string;
  isSealed: boolean;
}

export interface CustomerStatementTransaction {
  date: string;
  referenceType: 'INVOICE' | 'CREDIT_MEMO' | 'PAYMENT' | 'DISPUTE_ADJUSTMENT' | 'WRITE_OFF';
  referenceNumber: string;
  referenceId: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface CustomerStatementOfAccount {
  id: string;
  statementNumber: string;
  tenantId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  statementDate: string;
  periodStartDate: string;
  periodEndDate: string;
  currency: string;
  openingBalance: number;
  totalInvoiced: number;
  totalPaid: number;
  totalCredited: number;
  totalAdjusted: number;
  closingBalance: number;
  transactions: CustomerStatementTransaction[];
  unallocatedPayments: number;
  agingSummary: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    over90: number;
  };
  sha256Hash: string;
  generatedAt: string;
  generatedBy: string;
}

export interface IFRS9BucketLossRate {
  bucket: AgingBucket;
  defaultProbabilityRate: number; // e.g. 0.01 for 1%
  lossGivenDefaultRate: number;    // e.g. 0.80 for 80%
  effectiveLossRate: number;       // defaultProbability * lossGivenDefault
}

export interface IFRS9ProvisionMatrix {
  id: string;
  tenantId: string;
  companyId: string;
  currency: string;
  rates: Record<AgingBucket, number>; // Loss percentage per bucket (0.00 to 1.00)
  effectiveDate: string;
}

export interface ECLBucketCalculation {
  bucket: AgingBucket;
  grossAmount: number;
  lossRate: number;
  expectedLossAmount: number;
}

export interface ECLCalculationResult {
  id: string;
  tenantId: string;
  companyId: string;
  evaluationDate: string;
  totalReceivables: number;
  calculatedAllowanceRequired: number;
  existingAllowanceBalance: number;
  provisionAdjustmentAmount: number;
  isExpenseIncrease: boolean;
  bucketBreakdown: ECLBucketCalculation[];
  financialEventId?: string;
  evaluatedBy: string;
  createdAt: string;
}

export type WriteOffReason =
  | 'BANKRUPTCY'
  | 'UNTRACEABLE_DEBTOR'
  | 'LEGAL_SETTLEMENT'
  | 'STATUTE_EXPIRED'
  | 'UNECONOMIC_RECOVERY';

export type WriteOffStatus =
  | 'DRAFT'
  | 'PENDING_FIRST_APPROVAL'
  | 'PENDING_CFO_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED';

export interface DebtWriteOffProposal {
  id: string;
  proposalNumber: string;
  tenantId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  billingDocumentId: string;
  billingDocumentNumber: string;
  originalInvoiceAmount: number;
  writeOffAmount: number;
  currency: string;
  reason: WriteOffReason;
  justification: string;
  status: WriteOffStatus;
  requiresDualApproval: boolean;
  proposedBy: string;
  proposedAt: string;
  firstApprovedBy?: string;
  firstApprovedAt?: string;
  cfoApprovedBy?: string;
  cfoApprovedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  executedBy?: string;
  executedAt?: string;
  recoveredAmount?: number;
  financialEventId?: string;
  version: number;
}

export interface DebtRecoveryRecord {
  id: string;
  recoveryNumber: string;
  tenantId: string;
  companyId: string;
  writeOffProposalId: string;
  customerId: string;
  billingDocumentNumber: string;
  recoveredAmount: number;
  currency: string;
  recoveryDate: string;
  paymentMethod: string;
  bankAccountId: string;
  financialEventId: string;
  recordedBy: string;
  recordedAt: string;
}

export interface O2CRiskAccount {
  customerId: string;
  customerName: string;
  customerCode: string;
  totalExposure: number;
  overdueAmount: number;
  overduePercent: number;
  oldestDaysOverdue: number;
  brokenPromisesCount: number;
  activeDisputesCount: number;
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface O2CAnalyticsDashboard {
  tenantId: string;
  companyId: string;
  currency: string;
  asOfDate: string;
  periodDays: number;
  totalGrossReceivables: number;
  totalNetReceivables: number;
  allowanceForDoubtfulAccounts: number;
  coverageRatio: number; // Allowance / Total Gross
  dsoStandard: number;
  dsoBestPossible: number;
  dsoCountback: number;
  collectionEffectivenessIndex: number;
  billingAccuracyPercent: number;
  averagePgiToBillingDays: number;
  averageBillingToCashDays: number;
  unappliedCashTotal: number;
  unappliedCashRatio: number;
  activeDisputeCount: number;
  activeDisputeTotalAmount: number;
  averageDisputeResolutionDays: number;
  brokenPromisesCount: number;
  topRiskAccounts: O2CRiskAccount[];
  generatedAt: string;
}
