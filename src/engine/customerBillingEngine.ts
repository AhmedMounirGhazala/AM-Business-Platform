/**
 * AM BUSINESS PLATFORM — CUSTOMER BILLING & REVENUE RECOGNITION ENGINE
 * Phase 3.2C-03: Advanced Customer Invoicing, Milestone Billing, IFRS 15 Revenue Recognition,
 * Deferred Revenue Amortization, Intercompany Transfer Invoicing & Dunning Management
 * Architectural Standard: SAP S/4HANA SD-BIL / FI-CA / RAR, Oracle ERP Cloud Financials
 */

import {
  BillingDocument,
  BillingDocumentType,
  BillingLineItem,
  BillingStatus,
  CustomerDunningRecord,
  DunningLevel,
  IFRS15RevenueContract,
  IntercompanyBillingRule,
  MilestoneBillingPlan,
  MilestoneBillingStage,
  PerformanceObligation,
  RevenueAmortizationSchedule,
  RevenueSchedulePeriod,
  TaxCategory
} from '../types/customerBilling';
import { OutboundLogisticsEngine } from './outboundLogisticsEngine';

export interface CreateBillingDocumentDTO {
  tenantId: string;
  companyId: string;
  billingType: BillingDocumentType;
  customerId: string;
  customerName: string;
  customerTaxNumber?: string;
  billingAddress: string;
  billingDate: string;
  dueDate: string;
  paymentTerms?: string;
  currency: string;
  exchangeRate?: number;
  salesOrderId?: string;
  deliveryId?: string;
  contractId?: string;
  milestoneId?: string;
  originalBillingDocId?: string;
  isIntercompany?: boolean;
  targetCompanyId?: string;
  targetVendorId?: string;
  createdBy?: string;
  performedBy?: string;
  lines: Array<{
    sku: string;
    description: string;
    billedQuantity: number;
    uom: string;
    unitPrice: number;
    discountPercentage?: number;
    discountAmount?: number;
    taxCategory?: TaxCategory;
    taxRate?: number;
    salesOrderId?: string;
    salesOrderLineId?: string;
    deliveryId?: string;
    deliveryLineId?: string;
    costCenter?: string;
    profitCenter?: string;
    wbsElement?: string;
    glAccountSales?: string;
    glAccountTax?: string;
  }>;
}

export interface CreateIFRS15ContractDTO {
  tenantId: string;
  companyId: string;
  salesOrderId: string;
  customerId: string;
  customerName: string;
  totalTransactionPrice: number;
  currency: string;
  performanceObligations: Array<{
    name: string;
    pobType: 'POINT_IN_TIME' | 'OVER_TIME_STRAIGHT_LINE' | 'OVER_TIME_PERCENTAGE_COMPLETE';
    standaloneSellingPrice: number;
    startDate: string;
    endDate: string;
    revenueGlAccount?: string;
    contractLiabilityGlAccount?: string;
    contractAssetGlAccount?: string;
  }>;
  performedBy: string;
}

export interface CreateMilestoneBillingPlanDTO {
  tenantId: string;
  companyId: string;
  salesOrderId: string;
  salesContractId?: string;
  customerId: string;
  customerName: string;
  totalContractValue: number;
  currency: string;
  stages: Array<{
    stageName: string;
    milestonePercentage: number;
    retentionPercentage?: number;
    targetDate: string;
  }>;
  performedBy: string;
}

export class CustomerBillingEngine {
  private static billingDocuments = new Map<string, BillingDocument>();
  private static ifrs15Contracts = new Map<string, IFRS15RevenueContract>();
  private static amortizationSchedules = new Map<string, RevenueAmortizationSchedule>();
  private static milestonePlans = new Map<string, MilestoneBillingPlan>();
  private static intercompanyRules = new Map<string, IntercompanyBillingRule>();
  private static dunningRecords = new Map<string, CustomerDunningRecord>();
  private static auditLogs: Array<{ timestamp: string; event: string; details: any }> = [];

  // Reset engine for deterministic test execution
  public static reset(): void {
    this.billingDocuments.clear();
    this.ifrs15Contracts.clear();
    this.amortizationSchedules.clear();
    this.milestonePlans.clear();
    this.intercompanyRules.clear();
    this.dunningRecords.clear();
    this.auditLogs = [];
  }

  // =========================================================================
  // 1. BILLING DOCUMENT CREATION & LIFECYCLE
  // =========================================================================

  public static createBillingDocument(dto: CreateBillingDocumentDTO): BillingDocument {
    if (!dto.tenantId || !dto.companyId || !dto.customerId) {
      throw new Error('Tenant, Company, and Customer IDs are required.');
    }
    if (!dto.lines || dto.lines.length === 0) {
      throw new Error('Billing document must contain at least one line item.');
    }

    // Delivery-based invoicing validation: PGI verification
    if (dto.billingType === 'DELIVERY_BASED_INVOICE' && dto.deliveryId) {
      const delivery = OutboundLogisticsEngine.getDelivery(dto.deliveryId);
      if (!delivery) {
        throw new Error(`Referenced delivery ${dto.deliveryId} not found.`);
      }
      if (!['GOODS_ISSUED', 'IN_TRANSIT', 'DELIVERED'].includes(delivery.status)) {
        throw new Error(
          `Cannot create delivery-based invoice for delivery ${delivery.deliveryNumber}. Post Goods Issue (PGI) is required (current status: ${delivery.status}).`
        );
      }
    }

    const exchangeRate = dto.exchangeRate !== undefined && dto.exchangeRate > 0 ? dto.exchangeRate : 1.0;
    const docId = `bill-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const docNumber = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    let subtotalNetAmount = 0;
    let totalDiscountAmount = 0;
    let totalTaxAmount = 0;

    const lines: BillingLineItem[] = dto.lines.map((l, index) => {
      const quantity = Math.max(0, l.billedQuantity);
      const unitPrice = Math.max(0, l.unitPrice);
      const discountPercentage = l.discountPercentage || 0;
      const grossBeforeDiscount = quantity * unitPrice;
      const discountAmount = Number(((grossBeforeDiscount * discountPercentage) / 100).toFixed(2));
      const netAmount = Number((grossBeforeDiscount - discountAmount).toFixed(2));

      const taxCategory = l.taxCategory || 'STANDARD_VAT_15';
      let taxRate = 0.15;
      if (taxCategory === 'ZERO_RATED' || taxCategory === 'EXEMPT') taxRate = 0.0;
      if (taxCategory === 'REVERSE_CHARGE') taxRate = 0.0;
      if (l.taxRate !== undefined) taxRate = l.taxRate;

      const taxAmount = Number((netAmount * taxRate).toFixed(2));
      const lineGross = Number((netAmount + taxAmount).toFixed(2));

      subtotalNetAmount += netAmount;
      totalDiscountAmount += discountAmount;
      totalTaxAmount += taxAmount;

      return {
        id: `bline-${docId}-${index + 1}`,
        lineItemNumber: index + 1,
        salesOrderId: l.salesOrderId || dto.salesOrderId,
        salesOrderLineId: l.salesOrderLineId,
        deliveryId: l.deliveryId || dto.deliveryId,
        deliveryLineId: l.deliveryLineId,
        contractId: dto.contractId,
        sku: l.sku,
        description: l.description,
        billedQuantity: quantity,
        uom: l.uom || 'EA',
        unitPrice,
        discountPercentage,
        discountAmount,
        netAmount,
        taxCategory,
        taxRate,
        taxAmount,
        grossAmount: lineGross,
        costCenter: l.costCenter || 'CC-SALES-DOMESTIC',
        profitCenter: l.profitCenter || 'PC-RETAIL-01',
        wbsElement: l.wbsElement,
        glAccountSales: l.glAccountSales || '410000-SALES-REVENUE',
        glAccountTax: l.glAccountTax || '220000-VAT-OUTPUT-PAYABLE'
      };
    });

    const totalGrossAmount = Number((subtotalNetAmount + totalTaxAmount).toFixed(2));
    const baseCurrencyGrossAmount = Number((totalGrossAmount * exchangeRate).toFixed(2));

    const billingDoc: BillingDocument = {
      id: docId,
      tenantId: dto.tenantId,
      companyId: dto.companyId,
      billingDocumentNumber: docNumber,
      billingType: dto.billingType,
      status: 'DRAFT',
      customerId: dto.customerId,
      customerName: dto.customerName,
      customerTaxNumber: dto.customerTaxNumber,
      billingAddress: dto.billingAddress,
      billingDate: dto.billingDate || new Date().toISOString().split('T')[0],
      postingDate: dto.billingDate || new Date().toISOString().split('T')[0],
      dueDate: dto.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      paymentTerms: dto.paymentTerms || 'NET_30',
      currency: dto.currency || 'USD',
      exchangeRate,
      lines,
      subtotalNetAmount: Number(subtotalNetAmount.toFixed(2)),
      totalDiscountAmount: Number(totalDiscountAmount.toFixed(2)),
      totalTaxAmount: Number(totalTaxAmount.toFixed(2)),
      totalGrossAmount,
      baseCurrencyGrossAmount,
      paidAmount: 0,
      openBalance: totalGrossAmount,
      deliveryId: dto.deliveryId,
      salesOrderId: dto.salesOrderId,
      contractId: dto.contractId,
      isIntercompany: !!dto.isIntercompany,
      targetCompanyId: dto.targetCompanyId,
      targetVendorId: dto.targetVendorId,
      milestoneId: dto.milestoneId,
      originalBillingDocId: dto.originalBillingDocId,
      version: 1,
      createdAt: new Date().toISOString(),
      createdBy: dto.performedBy
    };

    this.billingDocuments.set(docId, billingDoc);
    this.recordAudit('BILLING_DOC_CREATED', { docId, docNumber, billingType: dto.billingType, totalGrossAmount });

    return billingDoc;
  }

  public static postBillingDocument(
    billingDocId: string,
    performedBy: string,
    soDCheck = true
  ): { billingDoc: BillingDocument; financialEventId: string } {
    const doc = this.billingDocuments.get(billingDocId);
    if (!doc) throw new Error(`Billing document ${billingDocId} not found.`);

    if (doc.status !== 'DRAFT' && doc.status !== 'RELEASED_FOR_POSTING') {
      throw new Error(`Cannot post billing document in status ${doc.status}. Expected DRAFT.`);
    }

    // Segregation of Duties (SoD) Rule: High-value invoices (> $50,000) cannot be posted by creator
    if (soDCheck && doc.totalGrossAmount > 50000 && doc.createdBy === performedBy) {
      throw new Error(
        `Segregation of Duties (SoD) Violation: High-value billing document (> $50,000) created by ${doc.createdBy} must be approved & posted by a separate billing officer.`
      );
    }

    // Non-posting Pro-Forma guard
    if (doc.billingType === 'PRO_FORMA_INVOICE') {
      doc.status = 'RELEASED_FOR_POSTING';
      doc.version += 1;
      return { billingDoc: doc, financialEventId: 'PRO_FORMA_NON_POSTING' };
    }

    const financialEventId = `fe-bill-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const journalEntryId = `JE-AR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    doc.status = 'POSTED_TO_FI';
    doc.financialEventId = financialEventId;
    doc.glJournalEntryId = journalEntryId;
    doc.postedAt = new Date().toISOString();
    doc.postedBy = performedBy;
    doc.zatcaUuid = `zatca-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    doc.zatcaQrCode = `QR-${Buffer.from(`${doc.billingDocumentNumber}|${doc.totalGrossAmount}|${doc.totalTaxAmount}`).toString('base64')}`;
    doc.version += 1;

    this.recordAudit('BILLING_DOC_POSTED', {
      docId: doc.id,
      docNumber: doc.billingDocumentNumber,
      totalGrossAmount: doc.totalGrossAmount,
      financialEventId,
      journalEntryId,
      performedBy
    });

    return { billingDoc: doc, financialEventId };
  }

  public static reverseBillingDocument(
    billingDocId: string,
    reversalReason: string,
    performedBy: string
  ): { reversedDoc: BillingDocument; reversalFinancialEventId: string } {
    const doc = this.billingDocuments.get(billingDocId);
    if (!doc) throw new Error(`Billing document ${billingDocId} not found.`);

    if (doc.paidAmount > 0) {
      throw new Error(
        `Cannot reverse billing document ${doc.billingDocumentNumber}. It already has applied customer payments ($${doc.paidAmount}). Process a Credit Memo instead.`
      );
    }

    if (doc.status !== 'POSTED_TO_FI') {
      throw new Error(`Only POSTED_TO_FI billing documents can be reversed. Current status: ${doc.status}`);
    }

    const reversalEventId = `fe-rev-bill-${Date.now()}`;
    doc.status = 'REVERSED';
    doc.reversalReason = reversalReason;
    doc.openBalance = 0;
    doc.version += 1;

    this.recordAudit('BILLING_DOC_REVERSED', {
      docId: doc.id,
      docNumber: doc.billingDocumentNumber,
      reversalReason,
      reversalEventId,
      performedBy
    });

    return { reversedDoc: doc, reversalFinancialEventId: reversalEventId };
  }

  public static applyCustomerPayment(
    billingDocId: string,
    paymentAmount: number,
    paymentReference: string,
    performedBy: string
  ): BillingDocument {
    const doc = this.billingDocuments.get(billingDocId);
    if (!doc) throw new Error(`Billing document ${billingDocId} not found.`);

    if (doc.status !== 'POSTED_TO_FI' && doc.status !== 'PARTIALLY_PAID') {
      throw new Error(`Cannot apply payment to billing document in status ${doc.status}. Must be POSTED_TO_FI or PARTIALLY_PAID.`);
    }

    if (paymentAmount <= 0) throw new Error('Payment amount must be greater than zero.');
    if (paymentAmount > doc.openBalance + 0.001) {
      throw new Error(`Payment amount ($${paymentAmount}) exceeds invoice open balance ($${doc.openBalance}).`);
    }

    doc.paidAmount = Number((doc.paidAmount + paymentAmount).toFixed(2));
    doc.openBalance = Number((doc.totalGrossAmount - doc.paidAmount).toFixed(2));

    if (doc.openBalance <= 0.01) {
      doc.openBalance = 0;
      doc.status = 'PAID';
    } else {
      doc.status = 'PARTIALLY_PAID';
    }

    doc.version += 1;

    this.recordAudit('CUSTOMER_PAYMENT_APPLIED', {
      docId: doc.id,
      docNumber: doc.billingDocumentNumber,
      paymentAmount,
      remainingBalance: doc.openBalance,
      paymentReference,
      performedBy
    });

    return doc;
  }

  // =========================================================================
  // 2. IFRS 15 REVENUE RECOGNITION (5-STEP MODEL)
  // =========================================================================

  public static createIFRS15RevenueContract(dto: CreateIFRS15ContractDTO): IFRS15RevenueContract {
    if (!dto.tenantId || !dto.companyId || !dto.salesOrderId) {
      throw new Error('Tenant, Company, and Sales Order IDs are required.');
    }
    if (!dto.performanceObligations || dto.performanceObligations.length === 0) {
      throw new Error('IFRS 15 contract must contain at least one Performance Obligation (POB).');
    }

    const totalSSP = dto.performanceObligations.reduce((sum, pob) => sum + pob.standaloneSellingPrice, 0);
    if (totalSSP <= 0) {
      throw new Error('Total Standalone Selling Price (SSP) across all POBs must be greater than zero.');
    }

    const contractId = `ifrs15-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const contractNumber = `REV-CTR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let totalAllocated = 0;
    const pobs: PerformanceObligation[] = dto.performanceObligations.map((pobDto, idx) => {
      const sspRatio = Number((pobDto.standaloneSellingPrice / totalSSP).toFixed(6));
      const allocatedPrice = Number((dto.totalTransactionPrice * sspRatio).toFixed(2));
      totalAllocated += allocatedPrice;

      return {
        id: `pob-${contractId}-${idx + 1}`,
        pobNumber: `POB-${idx + 1}`,
        name: pobDto.name,
        pobType: pobDto.pobType,
        standaloneSellingPrice: pobDto.standaloneSellingPrice,
        sspRatio,
        allocatedTransactionPrice: allocatedPrice,
        recognizedRevenue: 0,
        deferredRevenueBalance: allocatedPrice,
        unbilledContractAsset: 0,
        status: 'PENDING',
        satisfactionPercentage: 0,
        startDate: pobDto.startDate,
        endDate: pobDto.endDate,
        revenueGlAccount: pobDto.revenueGlAccount || '410000-SALES-REVENUE',
        contractLiabilityGlAccount: pobDto.contractLiabilityGlAccount || '230000-DEFERRED-REVENUE-LIABILITY',
        contractAssetGlAccount: pobDto.contractAssetGlAccount || '140000-UNBILLED-CONTRACT-ASSETS'
      };
    });

    // Rounding adjustment on last POB
    const diff = Number((dto.totalTransactionPrice - totalAllocated).toFixed(2));
    if (diff !== 0 && pobs.length > 0) {
      pobs[pobs.length - 1].allocatedTransactionPrice = Number(
        (pobs[pobs.length - 1].allocatedTransactionPrice + diff).toFixed(2)
      );
      pobs[pobs.length - 1].deferredRevenueBalance = pobs[pobs.length - 1].allocatedTransactionPrice;
    }

    const contract: IFRS15RevenueContract = {
      id: contractId,
      tenantId: dto.tenantId,
      companyId: dto.companyId,
      contractNumber,
      salesOrderId: dto.salesOrderId,
      customerId: dto.customerId,
      customerName: dto.customerName,
      totalTransactionPrice: dto.totalTransactionPrice,
      totalAllocatedRevenue: dto.totalTransactionPrice,
      totalRecognizedRevenue: 0,
      totalDeferredRevenue: dto.totalTransactionPrice,
      currency: dto.currency || 'USD',
      performanceObligations: pobs,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      createdBy: dto.performedBy,
      updatedAt: new Date().toISOString()
    };

    this.ifrs15Contracts.set(contractId, contract);
    this.recordAudit('IFRS15_CONTRACT_CREATED', {
      contractId,
      contractNumber,
      totalTransactionPrice: dto.totalTransactionPrice,
      pobCount: pobs.length
    });

    return contract;
  }

  public static generateRevenueAmortizationSchedule(
    contractId: string,
    pobId: string,
    numberOfMonths: number,
    startYear: number,
    startMonth: number
  ): RevenueAmortizationSchedule {
    const contract = this.ifrs15Contracts.get(contractId);
    if (!contract) throw new Error(`IFRS 15 contract ${contractId} not found.`);

    const pob = contract.performanceObligations.find(p => p.id === pobId);
    if (!pob) throw new Error(`Performance obligation ${pobId} not found in contract ${contractId}.`);

    if (numberOfMonths <= 0) throw new Error('Number of amortization months must be at least 1.');

    const scheduleId = `rev-sched-${contractId}-${pobId}`;
    const monthlyAmount = Number((pob.allocatedTransactionPrice / numberOfMonths).toFixed(2));

    const periods: RevenueSchedulePeriod[] = [];
    let allocatedSoFar = 0;

    for (let i = 0; i < numberOfMonths; i++) {
      let m = startMonth + i;
      let y = startYear;
      while (m > 12) {
        m -= 12;
        y += 1;
      }

      let schedAmt = monthlyAmount;
      if (i === numberOfMonths - 1) {
        schedAmt = Number((pob.allocatedTransactionPrice - allocatedSoFar).toFixed(2));
      } else {
        allocatedSoFar += schedAmt;
      }

      periods.push({
        id: `period-${scheduleId}-${i + 1}`,
        pobId,
        periodYear: y,
        periodMonth: m,
        scheduledRevenue: schedAmt,
        recognizedRevenue: 0,
        isRecognized: false
      });
    }

    const schedule: RevenueAmortizationSchedule = {
      id: scheduleId,
      tenantId: contract.tenantId,
      companyId: contract.companyId,
      contractId,
      pobId,
      currency: contract.currency,
      totalAmortizationAmount: pob.allocatedTransactionPrice,
      periods,
      status: 'SCHEDULED'
    };

    this.amortizationSchedules.set(scheduleId, schedule);
    return schedule;
  }

  public static recognizeRevenueSchedulePeriod(
    scheduleId: string,
    periodId: string,
    performedBy: string
  ): { period: RevenueSchedulePeriod; financialEventId: string } {
    const schedule = this.amortizationSchedules.get(scheduleId);
    if (!schedule) throw new Error(`Revenue schedule ${scheduleId} not found.`);

    const period = schedule.periods.find(p => p.id === periodId);
    if (!period) throw new Error(`Period ${periodId} not found in schedule ${scheduleId}.`);

    if (period.isRecognized) {
      throw new Error(`Period ${period.periodYear}-${period.periodMonth} is already recognized.`);
    }

    const contract = this.ifrs15Contracts.get(schedule.contractId);
    if (!contract) throw new Error(`Contract ${schedule.contractId} not found.`);

    const pob = contract.performanceObligations.find(p => p.id === schedule.pobId);
    if (!pob) throw new Error(`POB ${schedule.pobId} not found.`);

    const financialEventId = `fe-rev-${Date.now()}`;
    const jeId = `JE-REV-${period.periodYear}-${period.periodMonth}-${Math.floor(1000 + Math.random() * 9000)}`;

    period.isRecognized = true;
    period.recognizedRevenue = period.scheduledRevenue;
    period.recognizedDate = new Date().toISOString();
    period.financialEventId = financialEventId;
    period.glJournalEntryId = jeId;
    period.recognizedBy = performedBy;

    pob.recognizedRevenue = Number((pob.recognizedRevenue + period.recognizedRevenue).toFixed(2));
    pob.deferredRevenueBalance = Number((pob.allocatedTransactionPrice - pob.recognizedRevenue).toFixed(2));
    pob.satisfactionPercentage = Number(((pob.recognizedRevenue / pob.allocatedTransactionPrice) * 100).toFixed(2));

    if (pob.deferredRevenueBalance <= 0.01) {
      pob.deferredRevenueBalance = 0;
      pob.status = 'SATISFIED';
    } else {
      pob.status = 'IN_PROGRESS';
    }

    contract.totalRecognizedRevenue = Number(
      contract.performanceObligations.reduce((sum, p) => sum + p.recognizedRevenue, 0).toFixed(2)
    );
    contract.totalDeferredRevenue = Number(
      contract.performanceObligations.reduce((sum, p) => sum + p.deferredRevenueBalance, 0).toFixed(2)
    );

    const allSatisfied = contract.performanceObligations.every(p => p.status === 'SATISFIED');
    if (allSatisfied) contract.status = 'FULLY_SATISFIED';

    schedule.status = schedule.periods.every(p => p.isRecognized) ? 'COMPLETED' : 'IN_PROGRESS';

    this.recordAudit('REVENUE_PERIOD_RECOGNIZED', {
      contractId: contract.id,
      pobId: pob.id,
      periodYear: period.periodYear,
      periodMonth: period.periodMonth,
      recognizedRevenue: period.recognizedRevenue,
      financialEventId,
      performedBy
    });

    return { period, financialEventId };
  }

  public static recognizePercentageOfCompletion(
    contractId: string,
    pobId: string,
    completionPercentage: number,
    performedBy: string
  ): { incrementalRecognizedRevenue: number; pob: PerformanceObligation; financialEventId: string } {
    const contract = this.ifrs15Contracts.get(contractId);
    if (!contract) throw new Error(`IFRS 15 contract ${contractId} not found.`);

    const pob = contract.performanceObligations.find(p => p.id === pobId);
    if (!pob) throw new Error(`POB ${pobId} not found.`);

    if (completionPercentage < pob.satisfactionPercentage) {
      throw new Error(
        `New percentage (${completionPercentage}%) cannot be less than previously recognized completion (${pob.satisfactionPercentage}%).`
      );
    }
    if (completionPercentage > 100) throw new Error('Completion percentage cannot exceed 100%.');

    const totalEarnedRevenue = Number(((pob.allocatedTransactionPrice * completionPercentage) / 100).toFixed(2));
    const incremental = Number((totalEarnedRevenue - pob.recognizedRevenue).toFixed(2));

    if (incremental <= 0) {
      return { incrementalRecognizedRevenue: 0, pob, financialEventId: 'NO_OP' };
    }

    const financialEventId = `fe-poc-rev-${Date.now()}`;
    pob.recognizedRevenue = totalEarnedRevenue;
    pob.deferredRevenueBalance = Number((pob.allocatedTransactionPrice - pob.recognizedRevenue).toFixed(2));
    pob.satisfactionPercentage = completionPercentage;
    pob.status = completionPercentage >= 100 ? 'SATISFIED' : 'IN_PROGRESS';

    contract.totalRecognizedRevenue = Number(
      contract.performanceObligations.reduce((sum, p) => sum + p.recognizedRevenue, 0).toFixed(2)
    );
    contract.totalDeferredRevenue = Number(
      contract.performanceObligations.reduce((sum, p) => sum + p.deferredRevenueBalance, 0).toFixed(2)
    );

    if (contract.performanceObligations.every(p => p.status === 'SATISFIED')) {
      contract.status = 'FULLY_SATISFIED';
    }

    this.recordAudit('POC_REVENUE_RECOGNIZED', {
      contractId,
      pobId,
      completionPercentage,
      incremental,
      totalRecognized: pob.recognizedRevenue,
      financialEventId,
      performedBy
    });

    return { incrementalRecognizedRevenue: incremental, pob, financialEventId };
  }

  // =========================================================================
  // 3. MILESTONE BILLING PLANS
  // =========================================================================

  public static createMilestoneBillingPlan(dto: CreateMilestoneBillingPlanDTO): MilestoneBillingPlan {
    if (!dto.tenantId || !dto.companyId || !dto.salesOrderId) {
      throw new Error('Tenant, Company, and Sales Order IDs are required.');
    }
    if (!dto.stages || dto.stages.length === 0) {
      throw new Error('Milestone billing plan must have at least one stage.');
    }

    const totalPct = dto.stages.reduce((sum, s) => sum + s.milestonePercentage, 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      throw new Error(`Total milestone percentages must equal exactly 100% (currently ${totalPct}%).`);
    }

    const planId = `plan-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const planNumber = `MBP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let totalRetentionHeld = 0;
    const stages: MilestoneBillingStage[] = dto.stages.map((s, idx) => {
      const grossStageAmt = Number(((dto.totalContractValue * s.milestonePercentage) / 100).toFixed(2));
      const retentionPct = s.retentionPercentage || 0;
      const retentionAmount = Number(((grossStageAmt * retentionPct) / 100).toFixed(2));
      const netBilledAmount = Number((grossStageAmt - retentionAmount).toFixed(2));

      totalRetentionHeld += retentionAmount;

      return {
        id: `mstage-${planId}-${idx + 1}`,
        stageName: s.stageName,
        milestonePercentage: s.milestonePercentage,
        amount: grossStageAmt,
        retentionPercentage: retentionPct,
        retentionAmount,
        netBilledAmount,
        targetDate: s.targetDate,
        isSignoffApproved: false,
        isBilled: false,
        status: 'PENDING_SIGNOFF'
      };
    });

    const plan: MilestoneBillingPlan = {
      id: planId,
      tenantId: dto.tenantId,
      companyId: dto.companyId,
      planNumber,
      salesOrderId: dto.salesOrderId,
      salesContractId: dto.salesContractId,
      customerId: dto.customerId,
      customerName: dto.customerName,
      totalContractValue: dto.totalContractValue,
      currency: dto.currency || 'USD',
      totalRetentionHeld: Number(totalRetentionHeld.toFixed(2)),
      stages,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      createdBy: dto.performedBy
    };

    this.milestonePlans.set(planId, plan);
    this.recordAudit('MILESTONE_PLAN_CREATED', { planId, planNumber, totalContractValue: dto.totalContractValue });

    return plan;
  }

  public static signoffMilestoneStage(
    planId: string,
    stageId: string,
    approvedBy: string
  ): MilestoneBillingStage {
    const plan = this.milestonePlans.get(planId);
    if (!plan) throw new Error(`Milestone plan ${planId} not found.`);

    const stage = plan.stages.find(s => s.id === stageId);
    if (!stage) throw new Error(`Stage ${stageId} not found in plan ${planId}.`);

    stage.isSignoffApproved = true;
    stage.signoffApprovedBy = approvedBy;
    stage.signoffApprovedAt = new Date().toISOString();
    stage.status = 'APPROVED_FOR_BILLING';

    this.recordAudit('MILESTONE_SIGNOFF_APPROVED', { planId, stageId, approvedBy });
    return stage;
  }

  public static generateMilestoneInvoice(
    planId: string,
    stageId: string,
    performedBy: string
  ): BillingDocument {
    const plan = this.milestonePlans.get(planId);
    if (!plan) throw new Error(`Milestone plan ${planId} not found.`);

    const stage = plan.stages.find(s => s.id === stageId);
    if (!stage) throw new Error(`Stage ${stageId} not found in plan ${planId}.`);

    if (!stage.isSignoffApproved) {
      throw new Error(`Cannot generate invoice for stage ${stage.stageName}. Milestone sign-off approval is required first.`);
    }
    if (stage.isBilled) {
      throw new Error(`Milestone stage ${stage.stageName} has already been billed.`);
    }

    const billingDoc = this.createBillingDocument({
      tenantId: plan.tenantId,
      companyId: plan.companyId,
      billingType: 'MILESTONE_INVOICE',
      customerId: plan.customerId,
      customerName: plan.customerName,
      billingAddress: 'Corporate Project Headquarters',
      billingDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      currency: plan.currency,
      salesOrderId: plan.salesOrderId,
      milestoneId: stage.id,
      lines: [
        {
          sku: 'SRV-PROJECT-MILESTONE',
          description: `Progress Billing: ${stage.stageName} (${stage.milestonePercentage}%) - Net of ${stage.retentionPercentage}% Retention`,
          billedQuantity: 1,
          uom: 'AU',
          unitPrice: stage.netBilledAmount,
          taxCategory: 'STANDARD_VAT_15',
          glAccountSales: '410000-SERVICE-REVENUE'
        }
      ],
      performedBy
    });

    stage.isBilled = true;
    stage.billingDocumentId = billingDoc.id;
    stage.status = 'BILLED';

    if (plan.stages.every(s => s.isBilled)) {
      plan.status = 'COMPLETED';
    }

    this.recordAudit('MILESTONE_INVOICE_GENERATED', { planId, stageId, billingDocId: billingDoc.id });
    return billingDoc;
  }

  // =========================================================================
  // 4. INTERCOMPANY TRANSFER INVOICING & MIRROR AP VOUCHER
  // =========================================================================

  public static registerIntercompanyRule(rule: IntercompanyBillingRule): void {
    this.intercompanyRules.set(`${rule.tenantId}-${rule.fromCompanyId}-${rule.toCompanyId}`, rule);
  }

  public static executeIntercompanyBilling(params: {
    tenantId: string;
    fromCompanyId: string;
    toCompanyId: string;
    customerId: string; // Intercompany Customer in FromCompany
    customerName: string;
    vendorId: string;   // Intercompany Vendor in ToCompany
    vendorName: string;
    costAmount: number;
    currency: string;
    sku: string;
    description: string;
    quantity: number;
    performedBy: string;
  }): { intercompanyCustomerInvoice: BillingDocument; mirrorApVoucherId: string } {
    const ruleKey = `${params.tenantId}-${params.fromCompanyId}-${params.toCompanyId}`;
    const rule = this.intercompanyRules.get(ruleKey) || {
      id: `rule-${Date.now()}`,
      tenantId: params.tenantId,
      fromCompanyId: params.fromCompanyId,
      toCompanyId: params.toCompanyId,
      transferPricingMethod: 'COST_PLUS_MARKUP',
      markupPercentage: 15,
      settlementCurrency: params.currency,
      eliminationGlAccount: '590000-INTERCOMPANY-ELIMINATION',
      isActive: true
    };

    const markup = rule.markupPercentage || 15;
    const transferPrice = Number((params.costAmount * (1 + markup / 100)).toFixed(2));
    const unitPrice = Number((transferPrice / Math.max(1, params.quantity)).toFixed(2));

    const arInvoice = this.createBillingDocument({
      tenantId: params.tenantId,
      companyId: params.fromCompanyId,
      billingType: 'INTERCOMPANY_INVOICE',
      customerId: params.customerId,
      customerName: params.customerName,
      billingAddress: `Intercompany Hub - ${params.toCompanyId}`,
      billingDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      currency: params.currency,
      isIntercompany: true,
      targetCompanyId: params.toCompanyId,
      targetVendorId: params.vendorId,
      lines: [
        {
          sku: params.sku,
          description: `[Intercompany Transfer Price Cost + ${markup}%] ${params.description}`,
          billedQuantity: params.quantity,
          uom: 'EA',
          unitPrice,
          taxCategory: 'EXEMPT',
          glAccountSales: '415000-INTERCOMPANY-REVENUE'
        }
      ],
      performedBy: params.performedBy
    });

    this.postBillingDocument(arInvoice.id, params.performedBy, false);

    // Generate Mirror AP Voucher for ToCompany
    const mirrorApVoucherId = `AP-VOUCH-IC-${Date.now()}`;
    arInvoice.mirrorApVoucherId = mirrorApVoucherId;

    this.recordAudit('INTERCOMPANY_TRANSACTION_COMPLETED', {
      arInvoiceId: arInvoice.id,
      fromCompany: params.fromCompanyId,
      toCompany: params.toCompanyId,
      transferPrice,
      mirrorApVoucherId
    });

    return { intercompanyCustomerInvoice: arInvoice, mirrorApVoucherId };
  }

  // =========================================================================
  // 5. CREDIT & DEBIT MEMOS WITH SOD APPROVAL
  // =========================================================================

  public static createCreditMemo(params: {
    tenantId: string;
    companyId: string;
    originalBillingDocId: string;
    creditAmount: number;
    creditReason: 'GOODS_RETURN' | 'PRICE_DISCOUNT_ADJUSTMENT' | 'BILLING_ERROR';
    requestedBy: string;
    approvedBy: string;
    notes?: string;
  }): BillingDocument {
    const origDoc = this.billingDocuments.get(params.originalBillingDocId);
    if (!origDoc) throw new Error(`Original invoice ${params.originalBillingDocId} not found.`);

    if (origDoc.status !== 'POSTED_TO_FI' && origDoc.status !== 'PARTIALLY_PAID' && origDoc.status !== 'PAID') {
      throw new Error(`Cannot issue credit memo against unposted invoice (status: ${origDoc.status}).`);
    }

    if (params.creditAmount <= 0) throw new Error('Credit amount must be greater than zero.');
    if (params.creditAmount > origDoc.totalGrossAmount) {
      throw new Error(`Credit amount ($${params.creditAmount}) cannot exceed original invoice gross amount ($${origDoc.totalGrossAmount}).`);
    }

    // Segregation of Duties (SoD): Requester cannot approve their own credit memo
    if (params.requestedBy === params.approvedBy) {
      throw new Error(
        `Segregation of Duties (SoD) Violation: Credit memo requested by ${params.requestedBy} must be approved by an authorized Financial Controller.`
      );
    }

    const netCredit = Number((params.creditAmount / 1.15).toFixed(2));
    const taxCredit = Number((params.creditAmount - netCredit).toFixed(2));

    const creditMemo = this.createBillingDocument({
      tenantId: params.tenantId,
      companyId: params.companyId,
      billingType: 'CREDIT_MEMO',
      customerId: origDoc.customerId,
      customerName: origDoc.customerName,
      billingAddress: origDoc.billingAddress,
      billingDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      currency: origDoc.currency,
      originalBillingDocId: origDoc.id,
      lines: [
        {
          sku: 'ADJ-CREDIT-MEMO',
          description: `Credit Memo Adjustment: ${params.creditReason} (Ref: ${origDoc.billingDocumentNumber})`,
          billedQuantity: 1,
          uom: 'EA',
          unitPrice: netCredit,
          taxCategory: 'STANDARD_VAT_15',
          glAccountSales: '419000-SALES-RETURNS-ALLOWANCES'
        }
      ],
      performedBy: params.approvedBy
    });

    this.postBillingDocument(creditMemo.id, params.approvedBy, false);

    // Adjust original document open balance
    origDoc.openBalance = Math.max(0, Number((origDoc.openBalance - params.creditAmount).toFixed(2)));
    origDoc.version += 1;

    this.recordAudit('CREDIT_MEMO_POSTED', {
      creditMemoId: creditMemo.id,
      originalDocId: origDoc.id,
      creditAmount: params.creditAmount,
      approvedBy: params.approvedBy
    });

    return creditMemo;
  }

  // =========================================================================
  // 6. DUNNING & DISPUTE EVALUATION ENGINE
  // =========================================================================

  public static runDunningEvaluation(
    tenantId: string,
    companyId: string,
    asOfDate: string = new Date().toISOString().split('T')[0]
  ): CustomerDunningRecord[] {
    const customerInvoices = Array.from(this.billingDocuments.values()).filter(
      d =>
        d.tenantId === tenantId &&
        d.companyId === companyId &&
        ['POSTED_TO_FI', 'PARTIALLY_PAID'].includes(d.status) &&
        d.openBalance > 0
    );

    const customerMap = new Map<string, { name: string; invoices: BillingDocument[] }>();
    customerInvoices.forEach(inv => {
      if (!customerMap.has(inv.customerId)) {
        customerMap.set(inv.customerId, { name: inv.customerName, invoices: [] });
      }
      customerMap.get(inv.customerId)!.invoices.push(inv);
    });

    const results: CustomerDunningRecord[] = [];
    const asOfTime = new Date(asOfDate).getTime();

    customerMap.forEach(({ name, invoices }, customerId) => {
      let totalOverdue = 0;
      let maxDaysOverdue = 0;
      let oldestDate = asOfDate;

      invoices.forEach(inv => {
        const dueTime = new Date(inv.dueDate).getTime();
        if (asOfTime > dueTime) {
          const days = Math.floor((asOfTime - dueTime) / (1000 * 3600 * 24));
          totalOverdue += inv.openBalance;
          if (days > maxDaysOverdue) {
            maxDaysOverdue = days;
            oldestDate = inv.dueDate;
          }
        }
      });

      let dunningLevel: DunningLevel = 'LEVEL_0_CURRENT';
      let dunningFee = 0;
      let isCreditBlocked = false;

      if (maxDaysOverdue > 90) {
        dunningLevel = 'LEVEL_4_LEGAL_COLLECTION';
        dunningFee = 250;
        isCreditBlocked = true;
      } else if (maxDaysOverdue > 60) {
        dunningLevel = 'LEVEL_3_FINAL_NOTICE';
        dunningFee = 150;
      } else if (maxDaysOverdue > 30) {
        dunningLevel = 'LEVEL_2_DEMAND';
        dunningFee = 50;
      } else if (maxDaysOverdue > 0) {
        dunningLevel = 'LEVEL_1_REMINDER';
        dunningFee = 0;
      }

      const rec: CustomerDunningRecord = {
        id: `dun-${tenantId}-${customerId}`,
        tenantId,
        companyId,
        customerId,
        customerName: name,
        totalOverdueAmount: Number(totalOverdue.toFixed(2)),
        oldestOverdueDate: oldestDate,
        daysOverdue: maxDaysOverdue,
        currentDunningLevel: dunningLevel,
        lastDunningNoticeDate: maxDaysOverdue > 0 ? asOfDate : undefined,
        dunningFeeAmount: dunningFee,
        isCreditBlocked,
        disputeOpen: false,
        notes: [
          `Dunning evaluation executed on ${asOfDate}. Max overdue: ${maxDaysOverdue} days. Assessed Level: ${dunningLevel}.`
        ]
      };

      this.dunningRecords.set(rec.id, rec);
      results.push(rec);
    });

    return results;
  }

  // =========================================================================
  // 7. QUERY METHODS
  // =========================================================================

  public static getBillingDocument(id: string): BillingDocument | undefined {
    return this.billingDocuments.get(id);
  }

  public static getAllBillingDocuments(tenantId: string, companyId: string): BillingDocument[] {
    return Array.from(this.billingDocuments.values()).filter(
      d => d.tenantId === tenantId && d.companyId === companyId
    );
  }

  public static getIFRS15Contract(id: string): IFRS15RevenueContract | undefined {
    return this.ifrs15Contracts.get(id);
  }

  public static getAllIFRS15Contracts(tenantId: string, companyId: string): IFRS15RevenueContract[] {
    return Array.from(this.ifrs15Contracts.values()).filter(
      c => c.tenantId === tenantId && c.companyId === companyId
    );
  }

  public static getAmortizationSchedule(id: string): RevenueAmortizationSchedule | undefined {
    return this.amortizationSchedules.get(id);
  }

  public static getAllMilestonePlans(tenantId: string, companyId: string): MilestoneBillingPlan[] {
    return Array.from(this.milestonePlans.values()).filter(
      p => p.tenantId === tenantId && p.companyId === companyId
    );
  }

  public static getAllDunningRecords(tenantId: string, companyId: string): CustomerDunningRecord[] {
    return Array.from(this.dunningRecords.values()).filter(
      d => d.tenantId === tenantId && d.companyId === companyId
    );
  }

  private static recordAudit(event: string, details: any): void {
    this.auditLogs.push({
      timestamp: new Date().toISOString(),
      event,
      details
    });
  }
}
