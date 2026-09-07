/**
 * AM BUSINESS PLATFORM — CUSTOMER BILLING & REVENUE RECOGNITION TYPES
 * Phase 3.2C-03: Advanced Customer Billing, Milestone Invoicing, IFRS 15 Revenue Recognition,
 * Deferred Revenue Schedules, Intercompany Invoicing & Dunning
 * Architectural Standard: SAP S/4HANA SD-BIL / FI-CA / RAR, Oracle ERP Cloud Financials
 */

export type BillingDocumentType =
  | 'STANDARD_INVOICE'       // Standard order or delivery-based invoice
  | 'DELIVERY_BASED_INVOICE' // PGI-linked outbound delivery invoice
  | 'MILESTONE_INVOICE'      // Progress billing against project/contract milestones
  | 'SUBSCRIPTION_PERIODIC'  // Recurring subscription billing
  | 'INTERCOMPANY_INVOICE'   // Cross-company transfer pricing billing
  | 'PRO_FORMA_INVOICE'      // Non-posting customs / commercial pro-forma
  | 'DOWN_PAYMENT_REQUEST'   // Customer advance payment request
  | 'CREDIT_MEMO'            // AR credit adjustment / return refund
  | 'DEBIT_MEMO';            // AR surcharge / under-billing adjustment

export type BillingStatus =
  | 'DRAFT'
  | 'RELEASED_FOR_POSTING'
  | 'POSTED_TO_FI'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'CANCELLED'
  | 'REVERSED'
  | 'DISPUTED';

export type TaxCategory = 'STANDARD_VAT_15' | 'ZERO_RATED' | 'EXEMPT' | 'REVERSE_CHARGE';

export interface BillingLineItem {
  id: string;
  lineItemNumber: number;
  salesOrderId?: string;
  salesOrderLineId?: string;
  deliveryId?: string;
  deliveryLineId?: string;
  contractId?: string;
  sku: string;
  description: string;
  billedQuantity: number;
  uom: string;
  unitPrice: number;
  discountPercentage: number;
  discountAmount: number;
  netAmount: number;
  taxCategory: TaxCategory;
  taxRate: number;
  taxAmount: number;
  grossAmount: number;
  costCenter?: string;
  profitCenter?: string;
  wbsElement?: string;
  glAccountSales?: string;
  glAccountTax?: string;
}

export interface BillingDocument {
  id: string;
  tenantId: string;
  companyId: string;
  billingDocumentNumber: string;
  billingType: BillingDocumentType;
  status: BillingStatus;
  customerId: string;
  customerName: string;
  customerTaxNumber?: string;
  billingAddress: string;
  billingDate: string;
  postingDate: string;
  dueDate: string;
  paymentTerms: string;
  currency: string;
  exchangeRate: number; // Against base company currency (e.g. SAR or USD)
  lines: BillingLineItem[];
  subtotalNetAmount: number;
  totalDiscountAmount: number;
  totalTaxAmount: number;
  totalGrossAmount: number;
  baseCurrencyGrossAmount: number;
  paidAmount: number;
  openBalance: number;
  deliveryId?: string;
  salesOrderId?: string;
  contractId?: string;
  isIntercompany: boolean;
  targetCompanyId?: string;
  targetVendorId?: string;
  mirrorApVoucherId?: string;
  milestoneId?: string;
  originalBillingDocId?: string; // For credit/debit memos
  reversalReason?: string;
  financialEventId?: string;
  glJournalEntryId?: string;
  zatcaUuid?: string;
  zatcaQrCode?: string;
  version: number;
  createdAt: string;
  createdBy: string;
  postedAt?: string;
  postedBy?: string;
}

// IFRS 15 Revenue Recognition
export type PerformanceObligationType =
  | 'POINT_IN_TIME' // Delivered product / standard sale
  | 'OVER_TIME_STRAIGHT_LINE' // Monthly subscription / SaaS / Warranty
  | 'OVER_TIME_PERCENTAGE_COMPLETE'; // Milestone engineering / service contract

export type POBStatus = 'PENDING' | 'IN_PROGRESS' | 'SATISFIED' | 'CANCELLED';

export interface PerformanceObligation {
  id: string;
  pobNumber: string;
  name: string;
  pobType: PerformanceObligationType;
  allocatedTransactionPrice: number;
  standaloneSellingPrice: number;
  sspRatio: number; // Standalone selling price ratio
  recognizedRevenue: number;
  deferredRevenueBalance: number;
  unbilledContractAsset: number;
  status: POBStatus;
  satisfactionPercentage: number;
  startDate: string;
  endDate: string;
  revenueGlAccount: string;
  contractLiabilityGlAccount: string;
  contractAssetGlAccount: string;
}

export interface IFRS15RevenueContract {
  id: string;
  tenantId: string;
  companyId: string;
  contractNumber: string;
  salesOrderId: string;
  customerId: string;
  customerName: string;
  totalTransactionPrice: number;
  totalAllocatedRevenue: number;
  totalRecognizedRevenue: number;
  totalDeferredRevenue: number;
  currency: string;
  performanceObligations: PerformanceObligation[];
  status: 'ACTIVE' | 'FULLY_SATISFIED' | 'TERMINATED';
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface RevenueSchedulePeriod {
  id: string;
  pobId: string;
  periodYear: number;
  periodMonth: number;
  scheduledRevenue: number;
  recognizedRevenue: number;
  isRecognized: boolean;
  recognizedDate?: string;
  financialEventId?: string;
  glJournalEntryId?: string;
  recognizedBy?: string;
}

export interface RevenueAmortizationSchedule {
  id: string;
  tenantId: string;
  companyId: string;
  contractId: string;
  pobId: string;
  currency: string;
  totalAmortizationAmount: number;
  periods: RevenueSchedulePeriod[];
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
}

// Milestone Billing Plan
export interface MilestoneBillingStage {
  id: string;
  stageName: string;
  milestonePercentage: number; // e.g. 20 for 20%
  amount: number;
  retentionPercentage: number; // e.g. 10 for 10% retention hold
  retentionAmount: number;
  netBilledAmount: number;
  targetDate: string;
  isSignoffApproved: boolean;
  signoffApprovedBy?: string;
  signoffApprovedAt?: string;
  billingDocumentId?: string;
  isBilled: boolean;
  status: 'PENDING_SIGNOFF' | 'APPROVED_FOR_BILLING' | 'BILLED';
}

export interface MilestoneBillingPlan {
  id: string;
  tenantId: string;
  companyId: string;
  planNumber: string;
  salesOrderId: string;
  salesContractId?: string;
  customerId: string;
  customerName: string;
  totalContractValue: number;
  currency: string;
  totalRetentionHeld: number;
  stages: MilestoneBillingStage[];
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  createdBy: string;
}

// Intercompany Transfer Pricing
export interface IntercompanyBillingRule {
  id: string;
  tenantId: string;
  fromCompanyId: string;
  toCompanyId: string;
  transferPricingMethod: 'COST_PLUS_MARKUP' | 'FIXED_PRICE' | 'COMMERCIAL_DISCOUNT';
  markupPercentage: number; // e.g. 15 for Cost + 15%
  settlementCurrency: string;
  eliminationGlAccount: string;
  isActive: boolean;
}

// Dunning & Collection Management
export type DunningLevel = 'LEVEL_0_CURRENT' | 'LEVEL_1_REMINDER' | 'LEVEL_2_DEMAND' | 'LEVEL_3_FINAL_NOTICE' | 'LEVEL_4_LEGAL_COLLECTION';

export interface CustomerDunningRecord {
  id: string;
  tenantId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  totalOverdueAmount: number;
  oldestOverdueDate: string;
  daysOverdue: number;
  currentDunningLevel: DunningLevel;
  lastDunningNoticeDate?: string;
  dunningFeeAmount: number;
  isCreditBlocked: boolean;
  disputeOpen: boolean;
  disputeReason?: string;
  notes: string[];
}
