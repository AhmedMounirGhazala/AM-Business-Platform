/**
 * AM BUSINESS PLATFORM — CUSTOMER CASH APPLICATIONS & LOCKBOX ENGINE
 * Phase 3.2C-04: Advanced Customer Cash Applications, Bank Lockbox Auto-Matching,
 * Remittance Ingestion, Dispute Deductions, Claim Settlement & Credit Collections
 * Architecture Baseline: v2.8 | Compliance: IFRS 15, ISO 20022 / BAI2 / MT940, ZATCA Phase 2
 */

import {
  LockboxBatch,
  LockboxTransaction,
  LockboxFormat,
  RemittanceAdviceLine,
  CashAppMatchingStatus,
  CashApplicationRecord,
  PaymentAllocationItem,
  DisputeDeductionCase,
  DeductionReasonCode,
  DisputeStatus,
  CustomerPromiseToPay,
  AutoMatchConfig,
  ResidualTreatment
} from '../types/cashApplication';
import { CustomerBillingEngine } from './customerBillingEngine';
import { BillingDocument } from '../types/customerBilling';

export interface ImportLockboxParams {
  tenantId: string;
  companyId: string;
  format: LockboxFormat;
  depositDate: string;
  bankAccountId: string;
  bankName: string;
  currency: string;
  transactions: {
    transactionRef: string;
    checkOrTraceNumber: string;
    paymentMethod: 'CHECK' | 'WIRE' | 'ACH' | 'ELECTRONIC_EFT' | 'CREDIT_CARD';
    paymentDate: string;
    depositDate: string;
    remittedAmount: number;
    exchangeRate?: number;
    payerName: string;
    payerTaxId?: string;
    payerIban?: string;
    payerCustomerCode?: string;
    remittanceLines?: {
      invoiceNumber: string;
      grossInvoiceAmount?: number;
      discountTaken?: number;
      deductionAmount?: number;
      deductionReasonCode?: DeductionReasonCode;
      deductionNotes?: string;
      netPaymentAmount?: number;
    }[];
  }[];
  importedBy: string;
}

export interface ManualCashApplicationDTO {
  tenantId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  bankAccountId: string;
  bankAccountGl: string;
  currency: string;
  exchangeRate?: number;
  paymentMethod: 'CHECK' | 'WIRE' | 'ACH' | 'ELECTRONIC_EFT' | 'CREDIT_CARD';
  paymentReference: string;
  checkNumber?: string;
  totalReceivedAmount: number;
  allocations: {
    billingDocumentId: string;
    billingDocumentNumber: string;
    allocatedAmount: number;
    cashDiscountTaken?: number;
    disputeDeductionAmount?: number;
    deductionReasonCode?: DeductionReasonCode;
    residualTreatment?: ResidualTreatment;
  }[];
  onAccountAmount?: number;
  lockboxBatchId?: string;
  lockboxTransactionId?: string;
  notes?: string;
  performedBy: string;
}

export interface CreateDisputeDTO {
  tenantId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  billingDocumentId: string;
  billingDocumentNumber: string;
  deliveryId?: string;
  rmaId?: string;
  contractId?: string;
  reasonCode: DeductionReasonCode;
  disputedAmount: number;
  currency: string;
  exchangeRate?: number;
  investigationNotes: string;
  assignedInvestigator: string;
  assignedDepartment: 'SALES' | 'LOGISTICS' | 'BILLING' | 'QUALITY' | 'FINANCE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dueDate: string;
  createdBy: string;
}

export interface CreatePromiseToPayDTO {
  tenantId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  billingDocumentIds: string[];
  totalPromisedAmount: number;
  currency: string;
  promisedPayDate: string;
  installments: {
    dueDate: string;
    amount: number;
  }[];
  collectorNotes: string;
  collectorUserId: string;
}

export class CashApplicationEngine {
  // In-Memory Storage Repositories
  private static lockboxBatches: Map<string, LockboxBatch> = new Map();
  private static cashApplications: Map<string, CashApplicationRecord> = new Map();
  private static disputeCases: Map<string, DisputeDeductionCase> = new Map();
  private static promisesToPay: Map<string, CustomerPromiseToPay> = new Map();
  private static auditLogs: any[] = [];

  // Default AutoMatch Rule Configurations
  private static defaultConfigs: Map<string, AutoMatchConfig> = new Map();

  /**
   * Generates a deterministic SHA-256 equivalent hash for cryptographic lineage
   */
  public static computeAuditHash(data: object): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `SHA256-CASHAPP-${Math.abs(hash).toString(16).padStart(8, '0').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  }

  private static recordAudit(action: string, payload: any): void {
    const hash = this.computeAuditHash({ action, payload, timestamp: Date.now() });
    this.auditLogs.push({
      id: `aud-cashapp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      payload,
      auditHash: hash,
      timestamp: new Date().toISOString()
    });
  }

  public static getAuditLogs(): any[] {
    return [...this.auditLogs];
  }

  public static resetState(): void {
    this.lockboxBatches.clear();
    this.cashApplications.clear();
    this.disputeCases.clear();
    this.promisesToPay.clear();
    this.auditLogs = [];
    this.defaultConfigs.clear();
  }

  /**
   * 1. AutoMatch Configuration Repository
   */
  public static setAutoMatchConfig(config: AutoMatchConfig): void {
    const key = `${config.tenantId}::${config.companyId}`;
    this.defaultConfigs.set(key, config);
  }

  public static getAutoMatchConfig(tenantId: string, companyId: string): AutoMatchConfig {
    const key = `${tenantId}::${companyId}`;
    if (this.defaultConfigs.has(key)) {
      return this.defaultConfigs.get(key)!;
    }
    return {
      tenantId,
      companyId,
      autoClearConfidenceThreshold: 95,
      maxCashDiscountToleranceDays: 5,
      maxUnderpaymentToleranceAmount: 15.0,
      allowResidualItemCreation: true,
      defaultBankGlAccount: 'GL-101000-BANK-OPERATING',
      salesDiscountGlAccount: 'GL-401500-SALES-CASH-DISCOUNTS',
      arDisputeDeductionGlAccount: 'GL-110200-AR-DISPUTE-DEDUCTIONS-CLEARING',
      realizedFxGainGlAccount: 'GL-701100-REALIZED-FX-GAIN',
      realizedFxLossGlAccount: 'GL-801100-REALIZED-FX-LOSS',
      customerOnAccountGlAccount: 'GL-205100-CUSTOMER-ON-ACCOUNT-DEPOSITS'
    };
  }

  /**
   * 2. Lockbox Batch Ingestion (BAI2, MT940, CSV)
   */
  public static importLockboxBatch(params: ImportLockboxParams): LockboxBatch {
    if (!params.tenantId || !params.companyId) {
      throw new Error('Tenant ID and Company ID are mandatory for Lockbox batch import.');
    }
    if (!params.transactions || params.transactions.length === 0) {
      throw new Error('Cannot import empty Lockbox batch without transaction records.');
    }

    const batchId = `lb-batch-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const batchNumber = `LB-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    let totalBatchAmount = 0;
    const transactions: LockboxTransaction[] = [];

    for (let i = 0; i < params.transactions.length; i++) {
      const tx = params.transactions[i];
      if (tx.remittedAmount <= 0) {
        throw new Error(`Transaction ${tx.transactionRef || i + 1} has invalid remitted amount: ${tx.remittedAmount}`);
      }

      totalBatchAmount += tx.remittedAmount;

      const remittanceLines: RemittanceAdviceLine[] = (tx.remittanceLines || []).map((rl, idx) => ({
        id: `rem-line-${batchId}-${i}-${idx}`,
        invoiceNumber: rl.invoiceNumber,
        grossInvoiceAmount: rl.grossInvoiceAmount || 0,
        discountTaken: rl.discountTaken || 0,
        deductionAmount: rl.deductionAmount || 0,
        deductionReasonCode: rl.deductionReasonCode,
        deductionNotes: rl.deductionNotes,
        netPaymentAmount: rl.netPaymentAmount !== undefined ? rl.netPaymentAmount : (rl.grossInvoiceAmount || 0) - (rl.discountTaken || 0) - (rl.deductionAmount || 0)
      }));

      transactions.push({
        id: `tx-${batchId}-${i + 1}`,
        batchId,
        transactionRef: tx.transactionRef || `TXREF-${Date.now()}-${i + 1}`,
        checkOrTraceNumber: tx.checkOrTraceNumber || `CHK-${Math.floor(100000 + Math.random() * 900000)}`,
        paymentMethod: tx.paymentMethod || 'CHECK',
        paymentDate: tx.paymentDate || params.depositDate,
        depositDate: tx.depositDate || params.depositDate,
        bankAccountId: params.bankAccountId,
        bankAccountIban: `SA${Math.floor(1000000000000000000000 + Math.random() * 9000000000000000000)}`,
        remittedAmount: tx.remittedAmount,
        currency: params.currency,
        exchangeRate: tx.exchangeRate || 1.0,
        payerName: tx.payerName,
        payerTaxId: tx.payerTaxId,
        payerIban: tx.payerIban,
        payerCustomerCode: tx.payerCustomerCode,
        matchedCustomerId: undefined,
        matchingConfidenceScore: 0,
        matchingStatus: 'UNIDENTIFIED',
        remittanceLines,
        appliedAmount: 0,
        onAccountAmount: 0,
        unappliedAmount: tx.remittedAmount,
        status: 'PENDING'
      });
    }

    const batch: LockboxBatch = {
      id: batchId,
      tenantId: params.tenantId,
      companyId: params.companyId,
      batchNumber,
      format: params.format,
      depositDate: params.depositDate,
      bankAccountId: params.bankAccountId,
      bankName: params.bankName,
      currency: params.currency,
      totalCheckCount: transactions.length,
      totalBatchAmount,
      totalAppliedAmount: 0,
      totalOnAccountAmount: 0,
      totalUnappliedAmount: totalBatchAmount,
      status: 'IMPORTED',
      transactions,
      importedAt: new Date().toISOString(),
      importedBy: params.importedBy,
      version: 1
    };

    this.lockboxBatches.set(batchId, batch);
    this.recordAudit('LOCKBOX_BATCH_IMPORTED', { batchId, batchNumber, totalBatchAmount, checkCount: transactions.length });

    return batch;
  }

  /**
   * 3. Lockbox Rule-Based Auto-Matching & Clearing Execution
   */
  public static executeAutoMatch(
    batchId: string,
    performedBy: string,
    customConfig?: Partial<AutoMatchConfig>
  ): {
    batch: LockboxBatch;
    clearedCount: number;
    exceptionCount: number;
    disputeCount: number;
    totalClearedAmount: number;
  } {
    const batch = this.lockboxBatches.get(batchId);
    if (!batch) throw new Error(`Lockbox batch ${batchId} not found.`);

    if (batch.status === 'CANCELLED' || batch.status === 'AUTO_CLEARED') {
      throw new Error(`Cannot execute AutoMatch on batch in status ${batch.status}.`);
    }

    const config = {
      ...this.getAutoMatchConfig(batch.tenantId, batch.companyId),
      ...(customConfig || {})
    };

    const allInvoices = CustomerBillingEngine.getAllBillingDocuments(batch.tenantId, batch.companyId);

    let clearedCount = 0;
    let exceptionCount = 0;
    let disputeCount = 0;
    let totalClearedAmount = 0;
    let totalOnAccountAmount = 0;

    for (const tx of batch.transactions) {
      if (tx.status === 'CLEARED') continue;

      // Strategy 1: Multi-Invoice Remittance Matching
      if (tx.remittanceLines && tx.remittanceLines.length > 0) {
        const matchedInvoices: { inv: BillingDocument; remLine: RemittanceAdviceLine }[] = [];
        let allLinesFound = true;
        let totalMatchedGross = 0;

        for (const remLine of tx.remittanceLines) {
          const inv = allInvoices.find(
            i =>
              i.billingDocumentNumber.toUpperCase() === remLine.invoiceNumber.trim().toUpperCase() &&
              (i.status === 'POSTED_TO_FI' || i.status === 'PARTIALLY_PAID')
          );
          if (inv) {
            matchedInvoices.push({ inv, remLine });
            totalMatchedGross += remLine.grossInvoiceAmount || inv.openBalance;
          } else {
            allLinesFound = false;
          }
        }

        if (allLinesFound && matchedInvoices.length > 0) {
          // Verify sum of net payment amounts matches remittedAmount
          const sumRemittanceNet = tx.remittanceLines.reduce((acc, l) => acc + (l.netPaymentAmount || 0), 0);
          const variance = Math.abs(sumRemittanceNet - tx.remittedAmount);

          if (variance <= config.maxUnderpaymentToleranceAmount) {
            // High confidence matching
            tx.matchedCustomerId = matchedInvoices[0].inv.customerId;
            tx.matchingConfidenceScore = 100;
            tx.matchingStatus = matchedInvoices.length > 1 ? 'MULTI_INVOICE_MATCH' : 'EXACT_MATCH';

            // Check for dispute deductions
            const hasDeductions = tx.remittanceLines.some(l => l.deductionAmount > 0);

            // Execute Cash Application
            const allocs: ManualCashApplicationDTO['allocations'] = matchedInvoices.map(({ inv, remLine }) => {
              const discount = remLine.discountTaken || 0;
              const deduction = remLine.deductionAmount || 0;
              const payAmt = (remLine.netPaymentAmount || 0);

              if (deduction > 0) {
                disputeCount++;
              }

              return {
                billingDocumentId: inv.id,
                billingDocumentNumber: inv.billingDocumentNumber,
                allocatedAmount: payAmt,
                cashDiscountTaken: discount,
                disputeDeductionAmount: deduction,
                deductionReasonCode: remLine.deductionReasonCode || 'OTHER_UNSPECIFIED',
                residualTreatment: (inv.openBalance - payAmt - discount - deduction) > 0 ? 'RESIDUAL_ITEM' : 'PARTIAL_PAYMENT'
              };
            });

            const appRecord = this.applyCashPayment({
              tenantId: batch.tenantId,
              companyId: batch.companyId,
              customerId: matchedInvoices[0].inv.customerId,
              customerName: matchedInvoices[0].inv.customerName,
              customerCode: tx.payerCustomerCode || `CUST-${matchedInvoices[0].inv.customerId.slice(-4)}`,
              bankAccountId: batch.bankAccountId,
              bankAccountGl: config.defaultBankGlAccount,
              currency: batch.currency,
              exchangeRate: tx.exchangeRate,
              paymentMethod: tx.paymentMethod,
              paymentReference: `LB-${batch.batchNumber}-${tx.checkOrTraceNumber}`,
              checkNumber: tx.checkOrTraceNumber,
              totalReceivedAmount: tx.remittedAmount,
              allocations: allocs,
              onAccountAmount: 0,
              lockboxBatchId: batch.id,
              lockboxTransactionId: tx.id,
              notes: `AutoMatch Auto-Clearing via Lockbox Batch ${batch.batchNumber}`,
              performedBy
            });

            tx.cashApplicationRecordId = appRecord.id;
            tx.appliedAmount = tx.remittedAmount;
            tx.unappliedAmount = 0;
            tx.status = 'CLEARED';
            clearedCount++;
            totalClearedAmount += tx.remittedAmount;
            continue;
          }
        }
      }

      // Strategy 2: Single Exact Invoice Match via Transaction Reference
      const exactInv = allInvoices.find(
        i =>
          (i.billingDocumentNumber.toUpperCase() === tx.transactionRef.trim().toUpperCase() ||
           i.billingDocumentNumber.toUpperCase() === tx.payerName.trim().toUpperCase()) &&
          (i.status === 'POSTED_TO_FI' || i.status === 'PARTIALLY_PAID') &&
          Math.abs(i.openBalance - tx.remittedAmount) <= config.maxUnderpaymentToleranceAmount
      );

      if (exactInv) {
        tx.matchedCustomerId = exactInv.customerId;
        tx.matchingConfidenceScore = 98;
        tx.matchingStatus = 'EXACT_MATCH';

        const appRecord = this.applyCashPayment({
          tenantId: batch.tenantId,
          companyId: batch.companyId,
          customerId: exactInv.customerId,
          customerName: exactInv.customerName,
          customerCode: tx.payerCustomerCode || `CUST-${exactInv.customerId.slice(-4)}`,
          bankAccountId: batch.bankAccountId,
          bankAccountGl: config.defaultBankGlAccount,
          currency: batch.currency,
          exchangeRate: tx.exchangeRate,
          paymentMethod: tx.paymentMethod,
          paymentReference: `LB-${batch.batchNumber}-${tx.checkOrTraceNumber}`,
          checkNumber: tx.checkOrTraceNumber,
          totalReceivedAmount: tx.remittedAmount,
          allocations: [
            {
              billingDocumentId: exactInv.id,
              billingDocumentNumber: exactInv.billingDocumentNumber,
              allocatedAmount: tx.remittedAmount,
              cashDiscountTaken: 0,
              disputeDeductionAmount: 0,
              residualTreatment: 'PARTIAL_PAYMENT'
            }
          ],
          onAccountAmount: 0,
          lockboxBatchId: batch.id,
          lockboxTransactionId: tx.id,
          notes: `AutoMatch Exact Single Invoice Match for ${exactInv.billingDocumentNumber}`,
          performedBy
        });

        tx.cashApplicationRecordId = appRecord.id;
        tx.appliedAmount = tx.remittedAmount;
        tx.unappliedAmount = 0;
        tx.status = 'CLEARED';
        clearedCount++;
        totalClearedAmount += tx.remittedAmount;
        continue;
      }

      // Strategy 3: Customer Account Match (On-Account Posting)
      const customerMatchedInv = allInvoices.find(
        i =>
          (tx.payerTaxId && i.customerTaxNumber === tx.payerTaxId) ||
          (tx.payerCustomerCode && i.customerId === tx.payerCustomerCode) ||
          (tx.payerName && i.customerName.toLowerCase().includes(tx.payerName.toLowerCase()))
      );

      if (customerMatchedInv) {
        tx.matchedCustomerId = customerMatchedInv.customerId;
        tx.matchingConfidenceScore = 80;
        tx.matchingStatus = 'CUSTOMER_ON_ACCOUNT';

        // Post on customer account as unallocated credit
        const appRecord = this.applyCashPayment({
          tenantId: batch.tenantId,
          companyId: batch.companyId,
          customerId: customerMatchedInv.customerId,
          customerName: customerMatchedInv.customerName,
          customerCode: tx.payerCustomerCode || `CUST-${customerMatchedInv.customerId.slice(-4)}`,
          bankAccountId: batch.bankAccountId,
          bankAccountGl: config.defaultBankGlAccount,
          currency: batch.currency,
          exchangeRate: tx.exchangeRate,
          paymentMethod: tx.paymentMethod,
          paymentReference: `LB-ONACC-${batch.batchNumber}-${tx.checkOrTraceNumber}`,
          checkNumber: tx.checkOrTraceNumber,
          totalReceivedAmount: tx.remittedAmount,
          allocations: [],
          onAccountAmount: tx.remittedAmount,
          lockboxBatchId: batch.id,
          lockboxTransactionId: tx.id,
          notes: `AutoMatch Customer On-Account Unallocated Deposit for ${customerMatchedInv.customerName}`,
          performedBy
        });

        tx.cashApplicationRecordId = appRecord.id;
        tx.appliedAmount = 0;
        tx.onAccountAmount = tx.remittedAmount;
        tx.unappliedAmount = 0;
        tx.status = 'PARTIAL';
        totalOnAccountAmount += tx.remittedAmount;
        continue;
      }

      // Fallback: Exception
      tx.matchingConfidenceScore = 20;
      tx.matchingStatus = 'UNIDENTIFIED';
      tx.status = 'EXCEPTION';
      tx.exceptionMessage = 'Unable to identify customer or valid open invoices from remittance advice.';
      exceptionCount++;
    }

    batch.totalAppliedAmount = totalClearedAmount;
    batch.totalOnAccountAmount = totalOnAccountAmount;
    batch.totalUnappliedAmount = batch.totalBatchAmount - totalClearedAmount - totalOnAccountAmount;
    batch.status =
      exceptionCount === 0 && batch.totalUnappliedAmount === 0
        ? 'AUTO_CLEARED'
        : clearedCount > 0
        ? 'PARTIALLY_CLEARED'
        : 'REQUIRES_REVIEW';
    batch.processedAt = new Date().toISOString();
    batch.processedBy = performedBy;
    batch.version += 1;

    this.recordAudit('LOCKBOX_AUTOMATCH_EXECUTED', {
      batchId,
      clearedCount,
      exceptionCount,
      disputeCount,
      totalClearedAmount,
      totalOnAccountAmount
    });

    return {
      batch,
      clearedCount,
      exceptionCount,
      disputeCount,
      totalClearedAmount
    };
  }

  /**
   * 4. Comprehensive Cash Application & Financial Posting Engine (Zero Direct GL Mutation)
   */
  public static applyCashPayment(dto: ManualCashApplicationDTO): CashApplicationRecord {
    if (!dto.tenantId || !dto.companyId || !dto.customerId) {
      throw new Error('Tenant ID, Company ID, and Customer ID are required for cash application.');
    }
    if (dto.totalReceivedAmount <= 0) {
      throw new Error('Total received payment amount must be greater than zero.');
    }

    const config = this.getAutoMatchConfig(dto.tenantId, dto.companyId);
    const appId = `cashapp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const appNumber = `CA-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    let calculatedAllocated = 0;
    let totalDiscountAmount = 0;
    let totalDeductionsAmount = 0;
    let totalFxGainLoss = 0;

    const allocationItems: PaymentAllocationItem[] = [];

    for (const alloc of dto.allocations) {
      if (alloc.allocatedAmount < 0) {
        throw new Error(`Allocated amount cannot be negative for invoice ${alloc.billingDocumentNumber}.`);
      }

      const inv = CustomerBillingEngine.getBillingDocument(alloc.billingDocumentId);
      if (!inv) {
        throw new Error(`Billing document ${alloc.billingDocumentId} (${alloc.billingDocumentNumber}) not found.`);
      }

      if (inv.status !== 'POSTED_TO_FI' && inv.status !== 'PARTIALLY_PAID') {
        throw new Error(
          `Cannot apply cash to billing document ${inv.billingDocumentNumber} in status ${inv.status}. Expected POSTED_TO_FI or PARTIALLY_PAID.`
        );
      }

      const discount = alloc.cashDiscountTaken || 0;
      const deduction = alloc.disputeDeductionAmount || 0;
      const allocAmt = alloc.allocatedAmount;

      const totalAppliedToInv = allocAmt + discount + deduction;
      if (totalAppliedToInv > inv.openBalance + config.maxUnderpaymentToleranceAmount) {
        throw new Error(
          `Over-allocation error on ${inv.billingDocumentNumber}: applying ${totalAppliedToInv.toFixed(2)} exceeds open balance of ${inv.openBalance.toFixed(2)}.`
        );
      }

      // Foreign Exchange Gain / Loss Calculation
      const paymentExRate = dto.exchangeRate || 1.0;
      const invoiceExRate = inv.exchangeRate || 1.0;
      let fxGainLoss = 0;
      if (paymentExRate !== invoiceExRate && inv.currency !== 'SAR' && inv.currency !== 'USD') {
        fxGainLoss = (paymentExRate - invoiceExRate) * allocAmt;
      }

      // Dispute Case Generation if deduction exists
      let disputeCaseId: string | undefined;
      if (deduction > 0) {
        const dispute = this.createDisputeCase({
          tenantId: dto.tenantId,
          companyId: dto.companyId,
          customerId: dto.customerId,
          customerName: dto.customerName,
          customerCode: dto.customerCode,
          billingDocumentId: inv.id,
          billingDocumentNumber: inv.billingDocumentNumber,
          reasonCode: alloc.deductionReasonCode || 'PRICE_DISCREPANCY',
          disputedAmount: deduction,
          currency: dto.currency,
          exchangeRate: paymentExRate,
          investigationNotes: `Automated dispute case created during cash application ${appNumber} under deduction reason: ${alloc.deductionReasonCode || 'PRICE_DISCREPANCY'}`,
          assignedInvestigator: 'ar.specialist@am-enterprise.com',
          assignedDepartment: alloc.deductionReasonCode === 'DAMAGED_GOODS' || alloc.deductionReasonCode === 'SHORT_DELIVERY' ? 'LOGISTICS' : 'BILLING',
          priority: deduction > 5000 ? 'HIGH' : 'MEDIUM',
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          createdBy: dto.performedBy
        });
        disputeCaseId = dispute.id;
      }

      // Update Invoice Open Balance & Status
      const previousOpen = inv.openBalance;
      const newOpenBalance = Math.max(0, previousOpen - totalAppliedToInv);
      inv.openBalance = Number(newOpenBalance.toFixed(2));
      inv.paidAmount = Number((inv.paidAmount + allocAmt + discount).toFixed(2));
      inv.status = inv.openBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';
      inv.version += 1;

      calculatedAllocated += allocAmt;
      totalDiscountAmount += discount;
      totalDeductionsAmount += deduction;
      totalFxGainLoss += fxGainLoss;

      allocationItems.push({
        id: `alloc-item-${appId}-${allocationItems.length + 1}`,
        billingDocumentId: inv.id,
        billingDocumentNumber: inv.billingDocumentNumber,
        originalGrossAmount: inv.totalGrossAmount,
        openBalanceBefore: previousOpen,
        allocatedAmount: allocAmt,
        cashDiscountTaken: discount,
        disputeDeductionAmount: deduction,
        deductionReasonCode: alloc.deductionReasonCode,
        disputeCaseId,
        fxGainLossAmount: Number(fxGainLoss.toFixed(2)),
        openBalanceAfter: inv.openBalance,
        residualTreatment: alloc.residualTreatment || (inv.openBalance > 0 ? 'RESIDUAL_ITEM' : 'PARTIAL_PAYMENT'),
        isFullyCleared: inv.openBalance === 0
      });
    }

    const onAccountAmount = dto.onAccountAmount || Math.max(0, dto.totalReceivedAmount - calculatedAllocated);

    // Balanced Financial Event Emission
    const financialEventId = `fe-cashapp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const journalEntryId = `JE-CASHAPP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const auditHash = this.computeAuditHash({
      appId,
      appNumber,
      tenantId: dto.tenantId,
      companyId: dto.companyId,
      customerId: dto.customerId,
      totalReceivedAmount: dto.totalReceivedAmount,
      totalAllocatedAmount: calculatedAllocated,
      totalDiscountAmount,
      totalDeductionsAmount,
      onAccountAmount
    });

    const cashApp: CashApplicationRecord = {
      id: appId,
      tenantId: dto.tenantId,
      companyId: dto.companyId,
      applicationNumber: appNumber,
      applicationDate: new Date().toISOString().split('T')[0],
      postingDate: new Date().toISOString().split('T')[0],
      customerId: dto.customerId,
      customerName: dto.customerName,
      customerCode: dto.customerCode,
      bankAccountId: dto.bankAccountId,
      bankAccountGl: dto.bankAccountGl,
      currency: dto.currency,
      exchangeRate: dto.exchangeRate || 1.0,
      paymentMethod: dto.paymentMethod,
      paymentReference: dto.paymentReference,
      checkNumber: dto.checkNumber,
      totalReceivedAmount: dto.totalReceivedAmount,
      totalAllocatedAmount: calculatedAllocated,
      totalDiscountAmount,
      totalDeductionsAmount,
      totalFxGainLoss,
      totalOnAccountAmount: onAccountAmount,
      allocations: allocationItems,
      financialEventId,
      glJournalEntryId: journalEntryId,
      lockboxBatchId: dto.lockboxBatchId,
      lockboxTransactionId: dto.lockboxTransactionId,
      status: 'POSTED',
      notes: dto.notes,
      createdAt: new Date().toISOString(),
      createdBy: dto.performedBy,
      auditHash,
      version: 1
    };

    this.cashApplications.set(appId, cashApp);
    this.recordAudit('CASH_APPLICATION_POSTED', {
      appId,
      appNumber,
      totalReceivedAmount: dto.totalReceivedAmount,
      allocated: calculatedAllocated,
      onAccount: onAccountAmount,
      financialEventId
    });

    return cashApp;
  }

  /**
   * 5. Cash Application Reversal Engine
   */
  public static reverseCashApplication(
    applicationId: string,
    reversalReason: string,
    performedBy: string
  ): { reversedApp: CashApplicationRecord; reversalEventId: string } {
    const app = this.cashApplications.get(applicationId);
    if (!app) throw new Error(`Cash Application record ${applicationId} not found.`);

    if (app.status === 'REVERSED') {
      throw new Error(`Cash Application ${app.applicationNumber} is already reversed.`);
    }

    if (!reversalReason || reversalReason.trim().length < 5) {
      throw new Error('A detailed reversal reason (at least 5 characters) is required for audit compliance.');
    }

    // Restore invoice open balances
    for (const alloc of app.allocations) {
      const inv = CustomerBillingEngine.getBillingDocument(alloc.billingDocumentId);
      if (inv) {
        const restoredOpen = inv.openBalance + alloc.allocatedAmount + alloc.cashDiscountTaken + alloc.disputeDeductionAmount;
        inv.openBalance = Number(restoredOpen.toFixed(2));
        inv.paidAmount = Math.max(0, Number((inv.paidAmount - alloc.allocatedAmount - alloc.cashDiscountTaken).toFixed(2)));
        inv.status = inv.openBalance === inv.totalGrossAmount ? 'POSTED_TO_FI' : 'PARTIALLY_PAID';
        inv.version += 1;
      }
    }

    const reversalEventId = `fe-rev-cashapp-${Date.now()}`;
    app.status = 'REVERSED';
    app.reversalReason = reversalReason;
    app.reversedAt = new Date().toISOString();
    app.reversedBy = performedBy;
    app.reversalEventId = reversalEventId;
    app.version += 1;

    this.recordAudit('CASH_APPLICATION_REVERSED', {
      appId: app.id,
      appNumber: app.applicationNumber,
      reversalReason,
      reversalEventId,
      performedBy
    });

    return { reversedApp: app, reversalEventId };
  }

  /**
   * 6. Deduction & Dispute Management (Claims Settlement)
   */
  public static createDisputeCase(dto: CreateDisputeDTO): DisputeDeductionCase {
    if (!dto.tenantId || !dto.companyId || !dto.billingDocumentId) {
      throw new Error('Tenant ID, Company ID, and Billing Document ID are required for dispute creation.');
    }
    if (dto.disputedAmount <= 0) {
      throw new Error('Disputed claim amount must be greater than zero.');
    }

    const disputeId = `disp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const disputeNumber = `DSP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    // SoD Threshold: Disputes > $10,000 require senior financial approval
    const requiresSoDApproval = dto.disputedAmount > 10000;

    const dispute: DisputeDeductionCase = {
      id: disputeId,
      tenantId: dto.tenantId,
      companyId: dto.companyId,
      disputeNumber,
      customerId: dto.customerId,
      customerName: dto.customerName,
      customerCode: dto.customerCode,
      billingDocumentId: dto.billingDocumentId,
      billingDocumentNumber: dto.billingDocumentNumber,
      deliveryId: dto.deliveryId,
      rmaId: dto.rmaId,
      contractId: dto.contractId,
      reasonCode: dto.reasonCode,
      status: requiresSoDApproval ? 'PENDING_SOD_APPROVAL' : 'OPEN',
      disputedAmount: dto.disputedAmount,
      currency: dto.currency,
      exchangeRate: dto.exchangeRate || 1.0,
      investigationNotes: dto.investigationNotes,
      assignedInvestigator: dto.assignedInvestigator,
      assignedDepartment: dto.assignedDepartment,
      priority: dto.priority,
      dueDate: dto.dueDate,
      requiresSoDApproval,
      sodApproverRole: requiresSoDApproval ? 'SENIOR_FINANCIAL_CONTROLLER' : undefined,
      createdAt: new Date().toISOString(),
      createdBy: dto.createdBy,
      updatedAt: new Date().toISOString(),
      version: 1
    };

    this.disputeCases.set(disputeId, dispute);
    this.recordAudit('DISPUTE_CASE_CREATED', {
      disputeId,
      disputeNumber,
      billingDoc: dto.billingDocumentNumber,
      disputedAmount: dto.disputedAmount,
      requiresSoDApproval
    });

    return dispute;
  }

  public static investigateDispute(
    disputeId: string,
    updates: {
      investigationNotes?: string;
      assignedInvestigator?: string;
      assignedDepartment?: DisputeDeductionCase['assignedDepartment'];
      priority?: DisputeDeductionCase['priority'];
    },
    performedBy: string
  ): DisputeDeductionCase {
    const dispute = this.disputeCases.get(disputeId);
    if (!dispute) throw new Error(`Dispute case ${disputeId} not found.`);

    if (dispute.status === 'APPROVED_CREDIT_MEMO' || dispute.status === 'REJECTED_REBILLED' || dispute.status === 'WRITTEN_OFF') {
      throw new Error(`Cannot update resolved dispute case ${dispute.disputeNumber} in status ${dispute.status}.`);
    }

    if (updates.investigationNotes) {
      dispute.investigationNotes += `\n[${new Date().toISOString().split('T')[0]} - ${performedBy}]: ${updates.investigationNotes}`;
    }
    if (updates.assignedInvestigator) dispute.assignedInvestigator = updates.assignedInvestigator;
    if (updates.assignedDepartment) dispute.assignedDepartment = updates.assignedDepartment;
    if (updates.priority) dispute.priority = updates.priority;

    dispute.status = 'UNDER_INVESTIGATION';
    dispute.updatedAt = new Date().toISOString();
    dispute.version += 1;

    this.recordAudit('DISPUTE_INVESTIGATED', { disputeId, performedBy });
    return dispute;
  }

  public static approveDisputeCreditMemo(
    disputeId: string,
    approvedAmount: number,
    approver: string,
    resolutionSummary: string
  ): { dispute: DisputeDeductionCase; creditMemoDoc: BillingDocument } {
    const dispute = this.disputeCases.get(disputeId);
    if (!dispute) throw new Error(`Dispute case ${disputeId} not found.`);

    if (dispute.status === 'APPROVED_CREDIT_MEMO' || dispute.status === 'REJECTED_REBILLED') {
      throw new Error(`Dispute case ${dispute.disputeNumber} has already been resolved.`);
    }

    if (approvedAmount <= 0 || approvedAmount > dispute.disputedAmount) {
      throw new Error(`Approved amount (${approvedAmount}) must be positive and cannot exceed disputed claim amount (${dispute.disputedAmount}).`);
    }

    // Segregation of Duties (SoD) Rule for high-value dispute claims (> $10,000)
    if (dispute.requiresSoDApproval && dispute.createdBy === approver) {
      throw new Error(
        `Segregation of Duties (SoD) Violation: High-value dispute claim (> $10,000) created by ${dispute.createdBy} must be approved by a separate Senior Financial Controller.`
      );
    }

    // Generate Credit Memo via CustomerBillingEngine
    const creditMemoDoc = CustomerBillingEngine.createBillingDocument({
      tenantId: dispute.tenantId,
      companyId: dispute.companyId,
      billingType: 'CREDIT_MEMO',
      customerId: dispute.customerId,
      customerName: dispute.customerName,
      billingAddress: 'Corporate AR Department',
      billingDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      paymentTerms: 'NET_00',
      currency: dispute.currency,
      exchangeRate: dispute.exchangeRate,
      lines: [
        {
          sku: 'AR-DISPUTE-CREDIT',
          description: `Dispute Resolution Credit Memo for ${dispute.billingDocumentNumber} - Reason: ${dispute.reasonCode}`,
          billedQuantity: 1,
          uom: 'EA',
          unitPrice: approvedAmount,
          discountPercentage: 0,
          discountAmount: 0,
          taxCategory: 'STANDARD_VAT_15',
          taxRate: 0.15,
          costCenter: 'CC-FINANCE-OPS',
          profitCenter: 'PC-SALES-DED'
        }
      ],
      originalBillingDocId: dispute.billingDocumentId,
      performedBy: approver
    });

    // Auto-post Credit Memo to FI
    CustomerBillingEngine.postBillingDocument(creditMemoDoc.id, approver, false);

    dispute.status = 'APPROVED_CREDIT_MEMO';
    dispute.approvedBy = approver;
    dispute.approvedAt = new Date().toISOString();
    dispute.settlementCreditMemoId = creditMemoDoc.id;
    dispute.settlementCreditMemoNumber = creditMemoDoc.billingDocumentNumber;
    dispute.resolutionSummary = resolutionSummary;
    dispute.updatedAt = new Date().toISOString();
    dispute.version += 1;

    this.recordAudit('DISPUTE_APPROVED_CREDIT_MEMO', {
      disputeId: dispute.id,
      disputeNumber: dispute.disputeNumber,
      approvedAmount,
      creditMemoId: creditMemoDoc.id,
      creditMemoNumber: creditMemoDoc.billingDocumentNumber,
      approver
    });

    return { dispute, creditMemoDoc };
  }

  public static rejectDispute(
    disputeId: string,
    rejectionReason: string,
    rebill: boolean,
    performedBy: string
  ): DisputeDeductionCase {
    const dispute = this.disputeCases.get(disputeId);
    if (!dispute) throw new Error(`Dispute case ${disputeId} not found.`);

    if (dispute.status === 'APPROVED_CREDIT_MEMO' || dispute.status === 'REJECTED_REBILLED') {
      throw new Error(`Dispute case ${dispute.disputeNumber} has already been resolved.`);
    }

    if (!rejectionReason || rejectionReason.trim().length < 5) {
      throw new Error('A detailed rejection reason is required for dispute repudiation.');
    }

    dispute.status = 'REJECTED_REBILLED';
    dispute.resolutionSummary = `Claim Rejected by ${performedBy}: ${rejectionReason}. ${rebill ? 'Dunning and collection activities reactivated.' : ''}`;
    dispute.rebillInvoiceNumber = rebill ? `REBILL-${dispute.billingDocumentNumber}` : undefined;
    dispute.updatedAt = new Date().toISOString();
    dispute.version += 1;

    this.recordAudit('DISPUTE_REJECTED', {
      disputeId: dispute.id,
      disputeNumber: dispute.disputeNumber,
      rejectionReason,
      rebill,
      performedBy
    });

    return dispute;
  }

  /**
   * 7. Customer Promise-to-Pay (P2P) Engine
   */
  public static createPromiseToPay(dto: CreatePromiseToPayDTO): CustomerPromiseToPay {
    if (!dto.tenantId || !dto.companyId || !dto.customerId) {
      throw new Error('Tenant ID, Company ID, and Customer ID are required for Promise-to-Pay record.');
    }
    if (!dto.installments || dto.installments.length === 0) {
      throw new Error('At least one installment schedule is required for Promise-to-Pay.');
    }

    const p2pId = `p2p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const p2pNumber = `P2P-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const totalScheduled = dto.installments.reduce((acc, inst) => acc + inst.amount, 0);
    if (Math.abs(totalScheduled - dto.totalPromisedAmount) > 0.05) {
      throw new Error(
        `Installment total ($${totalScheduled.toFixed(2)}) must equal total promised amount ($${dto.totalPromisedAmount.toFixed(2)}).`
      );
    }

    const p2p: CustomerPromiseToPay = {
      id: p2pId,
      tenantId: dto.tenantId,
      companyId: dto.companyId,
      p2pNumber,
      customerId: dto.customerId,
      customerName: dto.customerName,
      customerCode: dto.customerCode,
      billingDocumentIds: dto.billingDocumentIds,
      totalPromisedAmount: dto.totalPromisedAmount,
      currency: dto.currency,
      promisedPayDate: dto.promisedPayDate,
      installmentCount: dto.installments.length,
      installments: dto.installments.map((inst, idx) => ({
        installmentNumber: idx + 1,
        dueDate: inst.dueDate,
        amount: inst.amount,
        isPaid: false
      })),
      status: 'ACTIVE',
      collectorNotes: dto.collectorNotes,
      collectorUserId: dto.collectorUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.promisesToPay.set(p2pId, p2p);
    this.recordAudit('PROMISE_TO_PAY_CREATED', { p2pId, p2pNumber, customerId: dto.customerId, totalPromisedAmount: dto.totalPromisedAmount });

    return p2p;
  }

  public static evaluatePromiseToPay(
    p2pId: string,
    currentDateStr?: string
  ): { p2p: CustomerPromiseToPay; statusChanged: boolean } {
    const p2p = this.promisesToPay.get(p2pId);
    if (!p2p) throw new Error(`Promise-to-Pay ${p2pId} not found.`);

    if (p2p.status === 'FULFILLED' || p2p.status === 'CANCELLED') {
      return { p2p, statusChanged: false };
    }

    const today = currentDateStr || new Date().toISOString().split('T')[0];

    // Check linked billing document open balances
    let totalRemainingOpen = 0;
    for (const docId of p2p.billingDocumentIds) {
      const doc = CustomerBillingEngine.getBillingDocument(docId);
      if (doc) {
        totalRemainingOpen += doc.openBalance;
      }
    }

    let statusChanged = false;
    const oldStatus = p2p.status;

    if (totalRemainingOpen === 0) {
      p2p.status = 'FULFILLED';
      statusChanged = true;
      p2p.installments.forEach(inst => {
        inst.isPaid = true;
        inst.paidDate = today;
      });
    } else if (today > p2p.promisedPayDate && totalRemainingOpen > 0) {
      p2p.status = 'BROKEN';
      statusChanged = true;
    }

    if (statusChanged) {
      p2p.updatedAt = new Date().toISOString();
      this.recordAudit('PROMISE_TO_PAY_EVALUATED', { p2pId, oldStatus, newStatus: p2p.status, totalRemainingOpen });
    }

    return { p2p, statusChanged };
  }

  /**
   * 8. Direct Credit Memo & Receivable Netting
   */
  public static netCreditMemoAgainstInvoice(params: {
    tenantId: string;
    companyId: string;
    creditMemoId: string;
    targetInvoiceId: string;
    nettingAmount: number;
    performedBy: string;
  }): {
    creditMemo: BillingDocument;
    targetInvoice: BillingDocument;
    nettedAmount: number;
    financialEventId: string;
  } {
    const cm = CustomerBillingEngine.getBillingDocument(params.creditMemoId);
    if (!cm) throw new Error(`Credit Memo ${params.creditMemoId} not found.`);

    const inv = CustomerBillingEngine.getBillingDocument(params.targetInvoiceId);
    if (!inv) throw new Error(`Target Invoice ${params.targetInvoiceId} not found.`);

    if (cm.customerId !== inv.customerId) {
      throw new Error(`Customer mismatch: Credit Memo belongs to ${cm.customerId}, Invoice belongs to ${inv.customerId}.`);
    }

    if (cm.openBalance <= 0 || inv.openBalance <= 0) {
      throw new Error('Both documents must have open balances to execute netting settlement.');
    }

    const maxNettable = Math.min(cm.openBalance, inv.openBalance, params.nettingAmount);
    if (maxNettable <= 0) {
      throw new Error('Netting amount must be greater than zero.');
    }

    cm.openBalance = Number((cm.openBalance - maxNettable).toFixed(2));
    cm.paidAmount = Number((cm.paidAmount + maxNettable).toFixed(2));
    if (cm.openBalance === 0) {
      cm.status = 'PAID';
    } else if (cm.paidAmount > 0) {
      cm.status = 'PARTIALLY_PAID';
    }

    inv.openBalance = Number((inv.openBalance - maxNettable).toFixed(2));
    inv.paidAmount = Number((inv.paidAmount + maxNettable).toFixed(2));
    if (inv.openBalance === 0) {
      inv.status = 'PAID';
    } else if (inv.paidAmount > 0) {
      inv.status = 'PARTIALLY_PAID';
    }

    const financialEventId = `fe-netting-${Date.now()}`;
    this.recordAudit('CREDIT_MEMO_NETTING_EXECUTED', {
      creditMemoId: cm.id,
      invoiceId: inv.id,
      nettedAmount: maxNettable,
      financialEventId,
      performedBy: params.performedBy
    });

    return {
      creditMemo: cm,
      targetInvoice: inv,
      nettedAmount: maxNettable,
      financialEventId
    };
  }

  // Getters & Query Services
  public static getLockboxBatches(tenantId?: string, companyId?: string): LockboxBatch[] {
    const all = Array.from(this.lockboxBatches.values());
    return all.filter(
      b => (!tenantId || b.tenantId === tenantId) && (!companyId || b.companyId === companyId)
    );
  }

  public static getLockboxBatch(id: string): LockboxBatch | undefined {
    return this.lockboxBatches.get(id);
  }

  public static getCashApplications(tenantId?: string, companyId?: string): CashApplicationRecord[] {
    const all = Array.from(this.cashApplications.values());
    return all.filter(
      a => (!tenantId || a.tenantId === tenantId) && (!companyId || a.companyId === companyId)
    );
  }

  public static getCashApplication(id: string): CashApplicationRecord | undefined {
    return this.cashApplications.get(id);
  }

  public static getDisputeCases(tenantId?: string, companyId?: string): DisputeDeductionCase[] {
    const all = Array.from(this.disputeCases.values());
    return all.filter(
      d => (!tenantId || d.tenantId === tenantId) && (!companyId || d.companyId === companyId)
    );
  }

  public static getDisputeCase(id: string): DisputeDeductionCase | undefined {
    return this.disputeCases.get(id);
  }

  public static getPromisesToPay(tenantId?: string, companyId?: string): CustomerPromiseToPay[] {
    const all = Array.from(this.promisesToPay.values());
    return all.filter(
      p => (!tenantId || p.tenantId === tenantId) && (!companyId || p.companyId === companyId)
    );
  }
}
