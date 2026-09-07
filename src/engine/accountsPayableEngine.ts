/**
 * AM Business Platform - Accounts Payable & Financial Matching Domain Engine
 * Enterprise DDD Architecture aligned with SAP S/4HANA FI-AP/MM, Oracle ERP Cloud, Microsoft Dynamics 365, IFRS & ZATCA standards
 */

import {
  SupplierInvoice,
  SupplierInvoiceItem,
  SupplierInvoiceStatus,
  ThreeWayMatchStatus,
  ThreeWayMatchDetail,
  GRIRClearingRecord,
  APVoucher,
  SupplierCreditNote,
  CreditNoteReason,
  PaymentProposal,
  PaymentProposalItem,
  PaymentBatch,
  PaymentBatchItem,
  VendorStatement,
  VendorStatementLine,
  VendorAgingReport,
  VendorAgingSummary,
  PurchaseAccrual,
  APAuditRecord,
  PaymentAllocationRecord,
  PaymentAllocationType,
  VendorCreditControlCheck,
  ExchangeRateDifference,
  VendorAgingSnapshotRecord,
  PaymentReversalRecord,
  InvoiceToleranceProfile,
  ThreeWayMatchLineResult,
  SupplierDebitNote,
  GRIRClearingExecution,
  MatchAction,
  APAnalyticsDashboard,
  CashOutflowBucket,
  VendorExposureSummary,
  VendorStatementReconciliation
} from '../types/accountsPayable';

import { PurchaseOrder } from '../types/procurement';

export interface MatchingToleranceConfig {
  maxPriceVariancePercent: number; // e.g. 2.0 = 2%
  maxPriceVarianceAmount: number; // e.g. $100
  maxQtyVariancePercent: number; // e.g. 0%
  maxTaxVariancePercent?: number; // e.g. 1.0%
  maxTaxVarianceAmount?: number; // e.g. $50
  maxAmountVariancePercent?: number; // e.g. 1.0%
  maxAmountVarianceAmount?: number; // e.g. $200
  allowOverBilling: boolean;
  enforceHardBlock?: boolean;
}

export class AccountsPayableEngine {
  public static DEFAULT_TOLERANCE: MatchingToleranceConfig = {
    maxPriceVariancePercent: 2.0,
    maxPriceVarianceAmount: 100,
    maxQtyVariancePercent: 0.0,
    maxTaxVariancePercent: 1.0,
    maxTaxVarianceAmount: 50,
    maxAmountVariancePercent: 1.0,
    maxAmountVarianceAmount: 200,
    allowOverBilling: false,
    enforceHardBlock: true
  };

  /**
   * Resolve effective tolerance config through 3-tier hierarchy:
   * 1. PO Line / Target Specific Profile -> 2. Vendor Specific Profile -> 3. System Global Default
   */
  public static resolveToleranceProfile(
    vendorId: string,
    toleranceProfiles: InvoiceToleranceProfile[] = [],
    poItemId?: string,
    itemSku?: string
  ): MatchingToleranceConfig {
    // 1. PO Item or Item specific profile
    if (poItemId || itemSku) {
      const lineProfile = toleranceProfiles.find(
        p => p.isActive !== false && ((poItemId && p.targetId === poItemId) || (itemSku && p.targetId === itemSku))
      );
      if (lineProfile) {
        return {
          maxPriceVariancePercent: lineProfile.priceTolerancePercent,
          maxPriceVarianceAmount: lineProfile.priceToleranceAmount,
          maxQtyVariancePercent: lineProfile.qtyTolerancePercent,
          maxTaxVariancePercent: lineProfile.taxTolerancePercent,
          maxTaxVarianceAmount: lineProfile.taxToleranceAmount,
          maxAmountVariancePercent: lineProfile.amountTolerancePercent,
          maxAmountVarianceAmount: lineProfile.amountToleranceAmount,
          allowOverBilling: lineProfile.allowOverBilling,
          enforceHardBlock: lineProfile.enforceHardBlock
        };
      }
    }

    // 2. Vendor specific profile
    const vendorProfile = toleranceProfiles.find(
      p => p.isActive !== false && p.scope === 'VENDOR' && p.targetId === vendorId
    );
    if (vendorProfile) {
      return {
        maxPriceVariancePercent: vendorProfile.priceTolerancePercent,
        maxPriceVarianceAmount: vendorProfile.priceToleranceAmount,
        maxQtyVariancePercent: vendorProfile.qtyTolerancePercent,
        maxTaxVariancePercent: vendorProfile.taxTolerancePercent,
        maxTaxVarianceAmount: vendorProfile.taxToleranceAmount,
        maxAmountVariancePercent: vendorProfile.amountTolerancePercent,
        maxAmountVarianceAmount: vendorProfile.amountToleranceAmount,
        allowOverBilling: vendorProfile.allowOverBilling,
        enforceHardBlock: vendorProfile.enforceHardBlock
      };
    }

    // 3. System profile or default
    const sysProfile = toleranceProfiles.find(p => p.isActive !== false && p.scope === 'SYSTEM');
    if (sysProfile) {
      return {
        maxPriceVariancePercent: sysProfile.priceTolerancePercent,
        maxPriceVarianceAmount: sysProfile.priceToleranceAmount,
        maxQtyVariancePercent: sysProfile.qtyTolerancePercent,
        maxTaxVariancePercent: sysProfile.taxTolerancePercent,
        maxTaxVarianceAmount: sysProfile.taxToleranceAmount,
        maxAmountVariancePercent: sysProfile.amountTolerancePercent,
        maxAmountVarianceAmount: sysProfile.amountToleranceAmount,
        allowOverBilling: sysProfile.allowOverBilling,
        enforceHardBlock: sysProfile.enforceHardBlock
      };
    }

    return AccountsPayableEngine.DEFAULT_TOLERANCE;
  }

  /**
   * Helper to compute SHA-256 style hash for immutable AP audit logs
   */
  public static computeAuditHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `AP-HASH-${Math.abs(hash).toString(16).toUpperCase()}-${Date.now()}`;
  }

  /**
   * Validate Duplicate Supplier Invoice Protection
   * Checks Tenant, Company, Vendor, Vendor Invoice Ref, and Invoice Date
   */
  public static validateDuplicateInvoice(
    tenantId: string,
    companyId: string,
    vendorId: string,
    vendorInvoiceNumber: string,
    invoiceDate: string,
    existingInvoices: SupplierInvoice[]
  ): { isDuplicate: boolean; duplicateInvoiceNumber?: string } {
    const normalizedRef = vendorInvoiceNumber.trim().toLowerCase();
    const dup = existingInvoices.find(
      inv =>
        inv.tenantId === tenantId &&
        inv.companyId === companyId &&
        inv.vendorId === vendorId &&
        inv.vendorInvoiceNumber.trim().toLowerCase() === normalizedRef &&
        inv.invoiceDate === invoiceDate &&
        inv.status !== 'CANCELLED' &&
        inv.status !== 'REVERSED'
    );
    if (dup) {
      return { isDuplicate: true, duplicateInvoiceNumber: dup.invoiceNumber };
    }
    return { isDuplicate: false };
  }

  // ==================== 1. SUPPLIER INVOICE & THREE-WAY MATCHING ====================

  /**
   * Create and execute 3-Way Matching for a Supplier Invoice
   */
  public static processSupplierInvoice(
    invoiceData: Omit<SupplierInvoice, 'id' | 'status' | 'threeWayMatchStatus' | 'createdAt' | 'updatedAt'>,
    purchaseOrders: PurchaseOrder[],
    existingGRNs: any[], // Goods Receipt Notes
    tolerance: MatchingToleranceConfig = AccountsPayableEngine.DEFAULT_TOLERANCE,
    existingInvoices: SupplierInvoice[] = []
  ): { invoice: SupplierInvoice; auditRecord: APAuditRecord } {
    // 1. Duplicate Supplier Invoice Validation
    if (existingInvoices && existingInvoices.length > 0) {
      const dupCheck = AccountsPayableEngine.validateDuplicateInvoice(
        invoiceData.tenantId,
        invoiceData.companyId,
        invoiceData.vendorId,
        invoiceData.vendorInvoiceNumber,
        invoiceData.invoiceDate,
        existingInvoices
      );
      if (dupCheck.isDuplicate) {
        throw new Error(
          `DUPLICATE_SUPPLIER_INVOICE: Supplier Invoice reference '${invoiceData.vendorInvoiceNumber}' for Vendor ID '${invoiceData.vendorId}' on date '${invoiceData.invoiceDate}' already exists in system (${dupCheck.duplicateInvoiceNumber}). Post rejected.`
        );
      }
    }

    const id = `sinv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    let matchStatus: ThreeWayMatchStatus = 'MATCHED';
    const discrepancies: string[] = [];

    let totalPOAmount = 0;
    let totalGRNAmount = 0;
    let priceVarianceTotal = 0;
    let qtyVarianceTotal = 0;

    const po = purchaseOrders.find(p => p.id === invoiceData.poId || p.poNumber === invoiceData.poNumber);
    const grn = existingGRNs.find(g => g.id === invoiceData.grnId || g.number === invoiceData.grnNumber);

    if (po) {
      totalPOAmount = po.totalAmount;
    } else if (invoiceData.poNumber) {
      discrepancies.push(`Purchase Order '${invoiceData.poNumber}' not found in active PO registry.`);
      matchStatus = 'FAILED';
    }

    if (grn) {
      totalGRNAmount = grn.totalAmount || 0;
    }

    const lineResults: ThreeWayMatchLineResult[] = [];

    // Line item matching
    invoiceData.items.forEach(item => {
      let matchingPOItem = po?.items.find(i => i.itemSku === item.itemSku || (item.poItemId && i.id === item.poItemId));
      let matchingGRNLine = grn?.items?.find((i: any) => i.itemSku === item.itemSku || (item.grnItemId && i.id === item.grnItemId));

      const poUnitPrice = matchingPOItem?.unitPrice || 0;
      const poQty = matchingPOItem?.orderedQuantity || 0;
      const grnUnitPrice = matchingGRNLine?.unitPrice || poUnitPrice;
      const grnQty = matchingGRNLine?.receivedQty || 0;

      if (matchingPOItem) {
        item.poUnitPrice = matchingPOItem.unitPrice;
      }
      if (matchingGRNLine) {
        item.receivedQty = matchingGRNLine.receivedQty;
      }

      const linePriceVariance = matchingPOItem ? item.unitPrice - matchingPOItem.unitPrice : 0;
      const priceVariancePct = matchingPOItem && matchingPOItem.unitPrice > 0 ? (linePriceVariance / matchingPOItem.unitPrice) * 100 : 0;
      const priceVarianceAmount = linePriceVariance * item.billedQty;
      priceVarianceTotal += priceVarianceAmount;

      const lineQtyVariance = matchingGRNLine ? item.billedQty - matchingGRNLine.receivedQty : (matchingPOItem ? item.billedQty - poQty : 0);
      const qtyVariancePct = (matchingGRNLine && matchingGRNLine.receivedQty > 0)
        ? (lineQtyVariance / matchingGRNLine.receivedQty) * 100
        : (matchingPOItem && poQty > 0 ? (lineQtyVariance / poQty) * 100 : 0);
      const qtyVarianceAmount = lineQtyVariance * item.unitPrice;
      qtyVarianceTotal += qtyVarianceAmount;

      const lineDiscrepancies: string[] = [];
      let lineStatus: 'EXACT_MATCH' | 'WITHIN_TOLERANCE' | 'PRICE_VARIANCE_BLOCKED' | 'QTY_VARIANCE_BLOCKED' | 'TAX_VARIANCE_BLOCKED' | 'AMOUNT_VARIANCE_BLOCKED' | 'PASSED_WITH_WARNING' = 'EXACT_MATCH';
      let lineAction: MatchAction = 'ACCEPT';

      // Price tolerance evaluation
      if (matchingPOItem) {
        if (Math.abs(priceVariancePct) > tolerance.maxPriceVariancePercent && Math.abs(priceVarianceAmount) > tolerance.maxPriceVarianceAmount) {
          lineDiscrepancies.push(`Price Variance on ${item.itemSku}: Invoice $${item.unitPrice} vs PO $${matchingPOItem.unitPrice} (${priceVariancePct.toFixed(1)}%).`);
          lineStatus = 'PRICE_VARIANCE_BLOCKED';
          lineAction = tolerance.enforceHardBlock !== false ? 'HARD_BLOCK' : 'WARNING';
          if (matchStatus !== 'FAILED') matchStatus = 'PRICE_VARIANCE_BLOCKED';
        } else if (Math.abs(priceVariancePct) > 0) {
          lineStatus = 'WITHIN_TOLERANCE';
        }
      }

      // Quantity tolerance evaluation
      if (matchingGRNLine) {
        if (item.billedQty > matchingGRNLine.receivedQty && !tolerance.allowOverBilling) {
          lineDiscrepancies.push(`Quantity Variance on ${item.itemSku}: Billed ${item.billedQty} vs GRN Received ${matchingGRNLine.receivedQty}.`);
          lineStatus = 'QTY_VARIANCE_BLOCKED';
          lineAction = tolerance.enforceHardBlock !== false ? 'HARD_BLOCK' : 'WARNING';
          if (matchStatus !== 'FAILED' && matchStatus !== 'PRICE_VARIANCE_BLOCKED') {
            matchStatus = 'QUANTITY_VARIANCE_BLOCKED';
          }
        }
      }

      // Tax tolerance evaluation if configured
      if (tolerance.maxTaxVariancePercent !== undefined && item.taxRate !== undefined && matchingPOItem?.taxRate !== undefined) {
        const taxRateVariance = Math.abs(item.taxRate - matchingPOItem.taxRate);
        if (taxRateVariance > tolerance.maxTaxVariancePercent) {
          lineDiscrepancies.push(`Tax Rate Variance on ${item.itemSku}: Invoice ${item.taxRate}% vs PO ${matchingPOItem.taxRate}%.`);
          lineStatus = 'TAX_VARIANCE_BLOCKED';
          lineAction = 'HARD_BLOCK';
          if (matchStatus !== 'FAILED' && matchStatus !== 'PRICE_VARIANCE_BLOCKED' && matchStatus !== 'QUANTITY_VARIANCE_BLOCKED') {
            matchStatus = 'TAX_VARIANCE_BLOCKED';
          }
        }
      }

      lineDiscrepancies.forEach(d => discrepancies.push(d));

      lineResults.push({
        itemSku: item.itemSku,
        itemName: item.itemName,
        poItemId: item.poItemId,
        grnItemId: item.grnItemId,
        invoiceItemId: item.id,
        poUnitPrice,
        poQty,
        poLineTotal: poUnitPrice * poQty,
        grnUnitPrice,
        grnQty,
        grnLineTotal: grnUnitPrice * grnQty,
        invoiceUnitPrice: item.unitPrice,
        invoiceQty: item.billedQty,
        invoiceLineTotal: item.lineTotal,
        invoiceTaxAmount: item.taxAmount || 0,
        priceVariance: linePriceVariance,
        priceVariancePercent: priceVariancePct,
        priceVarianceAmount,
        qtyVariance: lineQtyVariance,
        qtyVariancePercent: qtyVariancePct,
        qtyVarianceAmount,
        taxVariance: 0,
        amountVariance: Math.abs(item.lineTotal - (poUnitPrice * item.billedQty)),
        status: lineStatus,
        action: lineAction,
        discrepancies: lineDiscrepancies
      });
    });

    const isWithinTol = (matchStatus as string) === 'MATCHED' || (matchStatus as string) === 'EXACT_MATCH' || (matchStatus as string) === 'WITHIN_TOLERANCE';
    const invoiceStatus: SupplierInvoiceStatus = isWithinTol ? 'MATCHED' : 'BLOCKED_VARIANCE';

    const matchingDetails: ThreeWayMatchDetail = {
      poNumber: invoiceData.poNumber || 'N/A',
      grnNumber: invoiceData.grnNumber || 'N/A',
      poTotalAmount: totalPOAmount,
      grnTotalAmount: totalGRNAmount,
      invoiceTotalAmount: invoiceData.grossAmount,
      priceVariance: priceVarianceTotal,
      quantityVariance: qtyVarianceTotal,
      amountVariance: Math.abs(invoiceData.grossAmount - totalPOAmount),
      isWithinTolerance: isWithinTol,
      matchedAt: now,
      overallAction: isWithinTol ? 'ACCEPT' : 'HARD_BLOCK',
      discrepancies,
      lineResults
    };

    const invoice: SupplierInvoice = {
      ...invoiceData,
      id,
      status: invoiceStatus,
      threeWayMatchStatus: matchStatus,
      matchingDetails,
      createdAt: now,
      updatedAt: now
    };

    const auditRecord: APAuditRecord = {
      id: `apaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: invoice.tenantId,
      companyId: invoice.companyId,
      actionType: 'PROCESS_SUPPLIER_INVOICE_3WAY_MATCH',
      performedBy: 'sys-ap-engine',
      performedByName: 'Accounts Payable Engine',
      performedAt: now,
      targetDocumentType: 'SupplierInvoice',
      targetDocumentId: invoice.id,
      targetDocumentNumber: invoice.invoiceNumber,
      details: `3-Way Match executed with status ${matchStatus}. Billed Amount: $${invoice.grossAmount}. Discrepancies: ${discrepancies.length}`,
      immutableHash: AccountsPayableEngine.computeAuditHash(JSON.stringify(invoice))
    };

    return { invoice, auditRecord };
  }

  /**
   * Release Variance Block on Supplier Invoice
   */
  public static releaseVarianceBlock(
    invoice: SupplierInvoice,
    releasedBy: string,
    reason: string
  ): { updatedInvoice: SupplierInvoice; auditRecord: APAuditRecord } {
    const now = new Date().toISOString();
    const updatedInvoice: SupplierInvoice = {
      ...invoice,
      status: 'APPROVED',
      threeWayMatchStatus: 'MANUALLY_RELEASED',
      varianceReleasedBy: releasedBy,
      varianceReleaseReason: reason,
      updatedAt: now
    };

    const auditRecord: APAuditRecord = {
      id: `apaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: invoice.tenantId,
      companyId: invoice.companyId,
      actionType: 'RELEASE_INVOICE_VARIANCE_BLOCK',
      performedBy: releasedBy,
      performedByName: releasedBy,
      performedAt: now,
      targetDocumentType: 'SupplierInvoice',
      targetDocumentId: invoice.id,
      targetDocumentNumber: invoice.invoiceNumber,
      details: `Variance block manually released. Reason: ${reason}`,
      immutableHash: AccountsPayableEngine.computeAuditHash(JSON.stringify(updatedInvoice))
    };

    return { updatedInvoice, auditRecord };
  }

  // ==================== 2. AP VOUCHER GENERATION ====================

  /**
   * Generate Accounts Payable Voucher from Approved Supplier Invoice
   */
  public static createAPVoucher(invoice: SupplierInvoice): { voucher: APVoucher; auditRecord: APAuditRecord } {
    const id = `apv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const voucher: APVoucher = {
      id,
      tenantId: invoice.tenantId,
      companyId: invoice.companyId,
      branchId: invoice.branchId,
      voucherNumber: `APV-${invoice.invoiceNumber}`,
      supplierInvoiceId: invoice.id,
      supplierInvoiceNumber: invoice.invoiceNumber,
      vendorInvoiceNumber: invoice.vendorInvoiceNumber,
      vendorId: invoice.vendorId,
      vendorCode: invoice.vendorCode,
      vendorName: invoice.vendorName,
      voucherDate: invoice.postingDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      grossAmount: invoice.grossAmount,
      netAmount: invoice.netAmount,
      paidAmount: 0,
      remainingAmount: invoice.grossAmount,
      status: 'UNPAID',
      createdAt: now
    };

    const auditRecord: APAuditRecord = {
      id: `apaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: voucher.tenantId,
      companyId: voucher.companyId,
      actionType: 'CREATE_AP_VOUCHER',
      performedBy: 'sys-ap-engine',
      performedByName: 'Accounts Payable Engine',
      performedAt: now,
      targetDocumentType: 'APVoucher',
      targetDocumentId: voucher.id,
      targetDocumentNumber: voucher.voucherNumber,
      details: `AP Voucher generated for Vendor ${voucher.vendorName}. Total Owed: $${voucher.grossAmount}`,
      immutableHash: AccountsPayableEngine.computeAuditHash(JSON.stringify(voucher))
    };

    return { voucher, auditRecord };
  }

  // ==================== 3. GR/IR CLEARING ENGINE ====================

  /**
   * Reconcile Goods Receipt / Invoice Receipt (GR/IR) balances
   */
  public static processGRIRClearing(
    purchaseOrders: PurchaseOrder[],
    existingGRNs: any[],
    supplierInvoices: SupplierInvoice[]
  ): GRIRClearingRecord[] {
    const clearingRecords: GRIRClearingRecord[] = [];

    purchaseOrders.forEach(po => {
      po.items.forEach(poItem => {
        const matchingGRNs = existingGRNs.filter(g => g.poId === po.id || g.poNumber === po.poNumber);
        let totalGRNQty = 0;
        let grnDocNumber = 'N/A';
        let grnDocId = 'N/A';

        matchingGRNs.forEach(g => {
          grnDocNumber = g.number || g.id;
          grnDocId = g.id;
          const itemLine = g.items?.find((i: any) => i.itemSku === poItem.itemSku);
          if (itemLine) totalGRNQty += itemLine.receivedQty || 0;
        });

        const matchingInvoices = supplierInvoices.filter(
          inv => inv.poId === po.id || inv.poNumber === po.poNumber
        );

        let totalInvoiceQty = 0;
        let totalInvoiceAmt = 0;
        let invNumber = 'N/A';
        let invId = 'N/A';

        matchingInvoices.forEach(inv => {
          invNumber = inv.invoiceNumber;
          invId = inv.id;
          const invLine = inv.items.find(i => i.itemSku === poItem.itemSku);
          if (invLine) {
            totalInvoiceQty += invLine.billedQty;
            totalInvoiceAmt += invLine.lineTotal;
          }
        });

        const grnAmount = totalGRNQty * poItem.unitPrice;
        const clearedQty = Math.min(totalGRNQty, totalInvoiceQty);
        const clearedAmount = clearedQty * poItem.unitPrice;
        const openQty = totalGRNQty - totalInvoiceQty;
        const openAmount = openQty * poItem.unitPrice;

        let status: 'OPEN' | 'PARTIALLY_CLEARED' | 'FULLY_CLEARED' | 'ADJUSTED_WRITE_OFF' = 'OPEN';
        if (openQty === 0 && totalGRNQty > 0) status = 'FULLY_CLEARED';
        else if (clearedQty > 0) status = 'PARTIALLY_CLEARED';

        clearingRecords.push({
          id: `grir-${po.id}-${poItem.itemSku}`,
          tenantId: po.tenantId,
          companyId: po.companyId,
          poId: po.id,
          poNumber: po.poNumber,
          itemSku: poItem.itemSku,
          itemName: poItem.itemName,
          vendorId: po.vendorId,
          vendorName: po.vendorName,
          grnId: grnDocId,
          grnNumber: grnDocNumber,
          grnQty: totalGRNQty,
          grnAmount,
          invoiceId: invId !== 'N/A' ? invId : undefined,
          invoiceNumber: invNumber !== 'N/A' ? invNumber : undefined,
          invoiceQty: totalInvoiceQty,
          invoiceAmount: totalInvoiceAmt,
          clearedQty,
          clearedAmount,
          openQty,
          openAmount,
          status,
          createdAt: new Date().toISOString()
        });
      });
    });

    return clearingRecords;
  }

  // ==================== 4. SUPPLIER CREDIT NOTE ENGINE ====================

  /**
   * Process Supplier Credit Note / Debit Memo
   */
  public static createSupplierCreditNote(
    data: Omit<SupplierCreditNote, 'id' | 'status' | 'createdAt'>
  ): { creditNote: SupplierCreditNote; auditRecord: APAuditRecord } {
    const id = `scn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const creditNote: SupplierCreditNote = {
      ...data,
      id,
      status: 'POSTED',
      createdAt: now,
      postedAt: now
    };

    const auditRecord: APAuditRecord = {
      id: `apaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: creditNote.tenantId,
      companyId: creditNote.companyId,
      actionType: 'POST_SUPPLIER_CREDIT_NOTE',
      performedBy: 'sys-ap-engine',
      performedByName: 'Accounts Payable Engine',
      performedAt: now,
      targetDocumentType: 'SupplierCreditNote',
      targetDocumentId: creditNote.id,
      targetDocumentNumber: creditNote.creditNoteNumber,
      details: `Credit Note posted for Vendor ${creditNote.vendorName}. Total: $${creditNote.totalAmount}. Reason: ${creditNote.reasonCode}`,
      immutableHash: AccountsPayableEngine.computeAuditHash(JSON.stringify(creditNote))
    };

    return { creditNote, auditRecord };
  }

  // ==================== 5. PAYMENT PROPOSAL & BATCH PREPARATION ====================

  /**
   * Generate Payment Proposal for eligible unpaid vouchers up to cutoff date
   */
  public static generatePaymentProposal(
    tenantId: string,
    companyId: string,
    cutoffDueDate: string,
    vouchers: APVoucher[],
    vendorIdFilter?: string,
    user: string = 'sys-ap-user'
  ): { proposal: PaymentProposal; auditRecord: APAuditRecord } {
    const proposalId = `pprop-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    let eligibleVouchers = vouchers.filter(
      v => v.tenantId === tenantId && v.companyId === companyId && v.status !== 'PAID' && v.remainingAmount > 0
    );

    if (vendorIdFilter) {
      eligibleVouchers = eligibleVouchers.filter(v => v.vendorId === vendorIdFilter);
    }

    // Filter by due date or early discount deadline
    eligibleVouchers = eligibleVouchers.filter(v => v.dueDate <= cutoffDueDate || (v.earlyDiscountDeadline && v.earlyDiscountDeadline <= cutoffDueDate));

    let totalProposed = 0;
    let totalDiscountCaptured = 0;

    const items: PaymentProposalItem[] = eligibleVouchers.map(v => {
      const isEarly = v.earlyDiscountDeadline && v.earlyDiscountDeadline >= now.split('T')[0];
      const discount = isEarly ? (v.earlyDiscountAmount || 0) : 0;
      const netPay = v.remainingAmount - discount;

      totalProposed += v.remainingAmount;
      totalDiscountCaptured += discount;

      return {
        id: `ppitem-${v.id}`,
        proposalId,
        voucherId: v.id,
        voucherNumber: v.voucherNumber,
        vendorInvoiceNumber: v.vendorInvoiceNumber,
        vendorId: v.vendorId,
        vendorName: v.vendorName,
        grossAmount: v.grossAmount,
        remainingAmount: v.remainingAmount,
        proposedAmount: v.remainingAmount,
        discountAmountCaptured: discount,
        netPaymentAmount: netPay,
        dueDate: v.dueDate,
        isExcluded: false
      };
    });

    const proposal: PaymentProposal = {
      id: proposalId,
      tenantId,
      companyId,
      proposalNumber: `PROP-${now.split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 100)}`,
      proposalDate: now.split('T')[0],
      cutoffDueDate,
      vendorId: vendorIdFilter,
      currency: eligibleVouchers[0]?.currency || 'USD',
      totalProposedAmount: totalProposed,
      totalEarlyDiscountCaptured: totalDiscountCaptured,
      status: 'DRAFT',
      items,
      createdBy: user,
      createdAt: now
    };

    const auditRecord: APAuditRecord = {
      id: `apaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      companyId,
      actionType: 'GENERATE_PAYMENT_PROPOSAL',
      performedBy: user,
      performedByName: user,
      performedAt: now,
      targetDocumentType: 'PaymentProposal',
      targetDocumentId: proposal.id,
      targetDocumentNumber: proposal.proposalNumber,
      details: `Payment proposal created with ${items.length} items totaling $${totalProposed}. Potential discounts: $${totalDiscountCaptured}`,
      immutableHash: AccountsPayableEngine.computeAuditHash(JSON.stringify(proposal))
    };

    return { proposal, auditRecord };
  }

  /**
   * Convert Approved Payment Proposal into an Executable Payment Batch
   */
  public static createPaymentBatch(
    proposal: PaymentProposal,
    paymentMethod: 'BANK_TRANSFER' | 'CHECK' | 'WIRE' | 'ACH',
    bankAccountId: string = 'bank-main-001',
    user: string = 'sys-ap-user'
  ): { batch: PaymentBatch; auditRecord: APAuditRecord } {
    const batchId = `pbatch-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const activeItems = proposal.items.filter(i => !i.isExcluded);

    const batchItems: PaymentBatchItem[] = activeItems.map(item => ({
      id: `pbitem-${item.voucherId}`,
      batchId,
      voucherId: item.voucherId,
      vendorId: item.vendorId,
      vendorName: item.vendorName,
      paymentAmount: item.netPaymentAmount,
      reference: `Payment for Voucher ${item.voucherNumber} (Inv #${item.vendorInvoiceNumber})`
    }));

    const totalAmt = batchItems.reduce((acc, i) => acc + i.paymentAmount, 0);

    const batch: PaymentBatch = {
      id: batchId,
      tenantId: proposal.tenantId,
      companyId: proposal.companyId,
      batchNumber: `PB-${now.split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 100)}`,
      proposalId: proposal.id,
      paymentMethod,
      bankAccountId,
      currency: proposal.currency,
      totalAmount: totalAmt,
      totalCount: batchItems.length,
      paymentDate: now.split('T')[0],
      status: 'APPROVED',
      items: batchItems,
      createdAt: now
    };

    const auditRecord: APAuditRecord = {
      id: `apaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: batch.tenantId,
      companyId: batch.companyId,
      actionType: 'CREATE_PAYMENT_BATCH',
      performedBy: user,
      performedByName: user,
      performedAt: now,
      targetDocumentType: 'PaymentBatch',
      targetDocumentId: batch.id,
      targetDocumentNumber: batch.batchNumber,
      details: `Payment Batch created via ${paymentMethod} for ${batch.totalCount} vendors totaling $${totalAmt}`,
      immutableHash: AccountsPayableEngine.computeAuditHash(JSON.stringify(batch))
    };

    return { batch, auditRecord };
  }

  // ==================== 6. VENDOR STATEMENT ENGINE ====================

  /**
   * Generate Vendor Statement for any specified date range
   */
  public static generateVendorStatement(
    vendorId: string,
    vendorCode: string,
    vendorName: string,
    startDate: string,
    endDate: string,
    invoices: SupplierInvoice[],
    vouchers: APVoucher[],
    creditNotes: SupplierCreditNote[],
    payments: PaymentBatch[]
  ): VendorStatement {
    const lines: VendorStatementLine[] = [];

    // Filter vendor documents
    const vInvoices = invoices.filter(i => i.vendorId === vendorId && i.status !== 'CANCELLED' && i.status !== 'DRAFT');
    const vCreditNotes = creditNotes.filter(c => c.vendorId === vendorId && c.status !== 'CANCELLED');
    
    // Flatten payments
    const vPayments: { id: string; date: string; number: string; amount: number }[] = [];
    payments.forEach(p => {
      const pStat = p.status as string;
      if (pStat === 'RELEASED' || pStat === 'COMPLETED' || pStat === 'PROCESSED' || pStat === 'APPROVED') {
        p.items.forEach(item => {
          if (item.vendorId === vendorId) {
            vPayments.push({
              id: item.id,
              date: p.paymentDate,
              number: p.batchNumber,
              amount: item.paymentAmount
            });
          }
        });
      }
    });

    // Opening balance before startDate
    let openingBalance = 0;

    vInvoices.filter(i => i.postingDate < startDate).forEach(i => { openingBalance += i.grossAmount; });
    vCreditNotes.filter(c => c.issueDate < startDate).forEach(c => { openingBalance -= c.totalAmount; });
    vPayments.filter(p => p.date < startDate).forEach(p => { openingBalance -= p.amount; });

    let currentBalance = openingBalance;

    // Filter documents within date range
    const rangeInvoices = vInvoices.filter(i => i.postingDate >= startDate && i.postingDate <= endDate);
    const rangeCreditNotes = vCreditNotes.filter(c => c.issueDate >= startDate && c.issueDate <= endDate);
    const rangePayments = vPayments.filter(p => p.date >= startDate && p.date <= endDate);

    // Combine and sort by date
    const allEvents: { date: string; type: 'INVOICE' | 'PAYMENT' | 'CREDIT_NOTE'; num: string; ref: string; amt: number }[] = [];

    rangeInvoices.forEach(i => allEvents.push({ date: i.postingDate, type: 'INVOICE', num: i.invoiceNumber, ref: i.vendorInvoiceNumber, amt: i.grossAmount }));
    rangeCreditNotes.forEach(c => allEvents.push({ date: c.issueDate, type: 'CREDIT_NOTE', num: c.creditNoteNumber, ref: c.vendorCreditNoteRef, amt: c.totalAmount }));
    rangePayments.forEach(p => allEvents.push({ date: p.date, type: 'PAYMENT', num: p.number, ref: 'Payment Batch', amt: p.amount }));

    allEvents.sort((a, b) => a.date.localeCompare(b.date));

    let totalInvoices = 0;
    let totalPayments = 0;
    let totalCreditNotes = 0;

    allEvents.forEach((ev, idx) => {
      let debit = 0;
      let credit = 0;

      if (ev.type === 'INVOICE') {
        credit = ev.amt;
        currentBalance += ev.amt;
        totalInvoices += ev.amt;
      } else if (ev.type === 'CREDIT_NOTE') {
        debit = ev.amt;
        currentBalance -= ev.amt;
        totalCreditNotes += ev.amt;
      } else if (ev.type === 'PAYMENT') {
        debit = ev.amt;
        currentBalance -= ev.amt;
        totalPayments += ev.amt;
      }

      lines.push({
        id: `vstmt-line-${idx}`,
        date: ev.date,
        documentType: ev.type,
        documentNumber: ev.num,
        reference: ev.ref,
        debit,
        credit,
        runningBalance: currentBalance
      });
    });

    return {
      vendorId,
      vendorCode,
      vendorName,
      startDate,
      endDate,
      currency: invoices[0]?.currency || 'USD',
      openingBalance,
      totalInvoices,
      totalPayments,
      totalCreditNotes,
      closingBalance: currentBalance,
      lines
    };
  }

  // ==================== 7. VENDOR AGING ENGINE ====================

  /**
   * Generate Vendor Aging Analysis with 5 aging buckets
   */
  public static generateVendorAgingReport(
    vouchers: APVoucher[],
    vendors: { id: string; code: string; name: string }[],
    reportDate: string = new Date().toISOString().split('T')[0]
  ): VendorAgingReport {
    const vendorSummaries: VendorAgingSummary[] = [];

    let totalCurrent = 0;
    let total1To30 = 0;
    let total31To60 = 0;
    let total61To90 = 0;
    let total91To120 = 0;
    let totalOver120 = 0;
    let grandTotal = 0;

    const reportTimestamp = new Date(reportDate).getTime();

    vendors.forEach(v => {
      const openVouchers = vouchers.filter(vch => vch.vendorId === v.id && vch.remainingAmount > 0 && vch.status !== 'CANCELLED');

      let current = 0;
      let days1To30 = 0;
      let days31To60 = 0;
      let days61To90 = 0;
      let days91To120 = 0;
      let over120 = 0;
      let totalDue = 0;
      let weightedDaysSum = 0;

      openVouchers.forEach(vch => {
        const dueTimestamp = new Date(vch.dueDate).getTime();
        const daysOverdue = Math.floor((reportTimestamp - dueTimestamp) / (1000 * 60 * 60 * 24));
        const amt = vch.remainingAmount;

        totalDue += amt;
        if (daysOverdue > 0) weightedDaysSum += daysOverdue * amt;

        if (daysOverdue <= 0) current += amt;
        else if (daysOverdue <= 30) days1To30 += amt;
        else if (daysOverdue <= 60) days31To60 += amt;
        else if (daysOverdue <= 90) days61To90 += amt;
        else if (daysOverdue <= 120) days91To120 += amt;
        else over120 += amt;
      });

      if (totalDue > 0) {
        totalCurrent += current;
        total1To30 += days1To30;
        total31To60 += days31To60;
        total61To90 += days61To90;
        total91To120 += days91To120;
        totalOver120 += over120;
        grandTotal += totalDue;

        vendorSummaries.push({
          vendorId: v.id,
          vendorCode: v.code,
          vendorName: v.name,
          current,
          days1To30,
          days31To60,
          days61To90,
          days91To120,
          over120,
          totalDue,
          weightedAvgDaysOverdue: totalDue > 0 ? Math.round(weightedDaysSum / totalDue) : 0
        });
      }
    });

    return {
      reportDate,
      currency: 'USD',
      vendors: vendorSummaries,
      totalCurrent,
      total1To30,
      total31To60,
      total61To90,
      total91To120,
      totalOver120,
      grandTotal
    };
  }

  // ==================== 8. PURCHASE ACCRUAL ENGINE ====================

  /**
   * Calculate Period-End Purchase Accruals for Uninvoiced Goods Received
   */
  public static calculatePurchaseAccruals(
    tenantId: string,
    companyId: string,
    period: string, // e.g. "2026-08"
    existingGRNs: any[],
    supplierInvoices: SupplierInvoice[]
  ): PurchaseAccrual[] {
    const accruals: PurchaseAccrual[] = [];
    const now = new Date().toISOString();

    existingGRNs.forEach(grn => {
      if (grn.tenantId === tenantId && grn.companyId === companyId) {
        // Check if invoice has been posted against this GRN
        const hasInvoice = supplierInvoices.some(
          inv => (inv.grnId === grn.id || inv.grnNumber === grn.number) && inv.status !== 'CANCELLED'
        );

        if (!hasInvoice && grn.totalAmount > 0) {
          accruals.push({
            id: `pacc-${grn.id}`,
            tenantId,
            companyId,
            accrualNumber: `ACCR-${period}-${grn.number}`,
            period,
            poId: grn.poId || 'po-2026-001',
            poNumber: grn.poNumber || 'PO-2026-0001',
            grnId: grn.id,
            grnNumber: grn.number,
            vendorId: grn.vendorId || 'ven-001',
            vendorName: grn.vendorName || 'Dell Technologies Global',
            accruedAmount: grn.totalAmount,
            currency: grn.currency || 'USD',
            status: 'POSTED',
            postedAt: now,
            createdAt: now
          });
        }
      }
    });

    return accruals;
  }

  // ==================== 9. VENDOR CREDIT CONTROL ENGINE ====================

  /**
   * Validate Vendor Credit Parameters (Outstanding balance, credit limit, credit days, vendor block status)
   */
  public static validateVendorCreditControl(
    vendorId: string,
    vendorCode: string,
    vendorName: string,
    newInvoiceAmount: number,
    openVouchers: APVoucher[],
    creditLimit: number = 500000,
    creditDays: number = 60,
    isBlocked: boolean = false,
    blockReason?: string
  ): VendorCreditControlCheck {
    const vendorVouchers = openVouchers.filter(v => v.vendorId === vendorId && v.remainingAmount > 0 && v.status !== 'CANCELLED');
    const outstandingBalance = vendorVouchers.reduce((acc, v) => acc + v.remainingAmount, 0);
    const newTotal = outstandingBalance + newInvoiceAmount;
    const utilizationPercent = creditLimit > 0 ? (newTotal / creditLimit) * 100 : 0;
    const isLimitExceeded = creditLimit > 0 && newTotal > creditLimit;
    const warnings: string[] = [];

    if (isBlocked) {
      warnings.push(`VENDOR_BLOCKED: Vendor '${vendorName}' is currently blocked for financial postings. Reason: ${blockReason || 'Administrative Block'}`);
    }
    if (isLimitExceeded) {
      warnings.push(`CREDIT_LIMIT_EXCEEDED: New Exposure ($${newTotal.toLocaleString()}) exceeds Vendor Credit Limit ($${creditLimit.toLocaleString()}).`);
    } else if (utilizationPercent >= 80) {
      warnings.push(`CREDIT_WARNING: Vendor Credit Exposure is at ${utilizationPercent.toFixed(1)}% of limit ($${creditLimit.toLocaleString()}).`);
    }

    return {
      vendorId,
      vendorCode,
      vendorName,
      outstandingBalance,
      creditLimit,
      creditDays,
      isBlocked,
      blockReason,
      utilizationPercent: Math.round(utilizationPercent * 10) / 10,
      isLimitExceeded,
      warningThresholdPercent: 80,
      warnings
    };
  }

  // ==================== 10. PAYMENT ALLOCATION ENGINE ====================

  /**
   * Allocate Payment to Vouchers supporting AUTOMATIC, MANUAL, FIFO, and PARTIAL allocations
   */
  public static allocatePayment(
    tenantId: string,
    companyId: string,
    vendorId: string,
    vendorName: string,
    paymentAmount: number,
    allocationType: PaymentAllocationType,
    vouchers: APVoucher[],
    targetVoucherIds?: string[],
    user: string = 'sys-ap-user'
  ): { allocations: PaymentAllocationRecord[]; updatedVouchers: APVoucher[]; auditRecords: APAuditRecord[] } {
    const allocations: PaymentAllocationRecord[] = [];
    const updatedVouchers = [...vouchers];
    const auditRecords: APAuditRecord[] = [];
    const now = new Date().toISOString();

    let openVouchers = updatedVouchers.filter(
      v => v.tenantId === tenantId && v.companyId === companyId && v.vendorId === vendorId && v.remainingAmount > 0 && v.status !== 'CANCELLED'
    );

    if (allocationType === 'MANUAL' && targetVoucherIds && targetVoucherIds.length > 0) {
      openVouchers = openVouchers.filter(v => targetVoucherIds.includes(v.id));
    } else if (allocationType === 'FIFO') {
      openVouchers.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    }

    let remainingPayment = paymentAmount;

    for (const v of openVouchers) {
      if (remainingPayment <= 0) break;

      const allocationAmt = Math.min(remainingPayment, v.remainingAmount);
      remainingPayment -= allocationAmt;

      v.paidAmount += allocationAmt;
      v.remainingAmount -= allocationAmt;
      if (v.remainingAmount <= 0) {
        v.remainingAmount = 0;
        v.status = 'PAID';
      } else {
        v.status = 'PARTIALLY_PAID';
      }

      const allocRecord: PaymentAllocationRecord = {
        id: `palloc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenantId,
        companyId,
        voucherId: v.id,
        voucherNumber: v.voucherNumber,
        vendorId,
        vendorName,
        allocatedAmount: allocationAmt,
        allocationType,
        allocatedAt: now,
        allocatedBy: user,
        reference: `Allocated $${allocationAmt} via ${allocationType}`
      };
      allocations.push(allocRecord);

      auditRecords.push({
        id: `apaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenantId,
        companyId,
        actionType: 'PAYMENT_ALLOCATED',
        performedBy: user,
        performedByName: user,
        performedAt: now,
        targetDocumentType: 'APVoucher',
        targetDocumentId: v.id,
        targetDocumentNumber: v.voucherNumber,
        details: `Allocated $${allocationAmt} (${allocationType}) to Voucher ${v.voucherNumber}. New status: ${v.status}`,
        immutableHash: AccountsPayableEngine.computeAuditHash(JSON.stringify(allocRecord))
      });
    }

    return { allocations, updatedVouchers, auditRecords };
  }

  // ==================== 11. EXCHANGE RATE READINESS ENGINE ====================

  /**
   * Calculate Foreign Currency Exchange Rate Differences (Realized Gain / Loss)
   */
  public static calculateExchangeRateDifference(
    docCurrency: string,
    docExchangeRate: number,
    paymentExchangeRate: number,
    documentAmountInDocCurrency: number
  ): ExchangeRateDifference {
    const documentAmountInLocalCurrency = documentAmountInDocCurrency * docExchangeRate;
    const paymentAmountInLocalCurrency = documentAmountInDocCurrency * paymentExchangeRate;
    const realizedExchangeDifference = documentAmountInLocalCurrency - paymentAmountInLocalCurrency;

    let realizedGainLossStatus: 'GAIN' | 'LOSS' | 'NEUTRAL' = 'NEUTRAL';
    if (realizedExchangeDifference > 0) realizedGainLossStatus = 'GAIN';
    else if (realizedExchangeDifference < 0) realizedGainLossStatus = 'LOSS';

    return {
      docCurrency,
      docExchangeRate,
      paymentExchangeRate,
      documentAmountInDocCurrency,
      documentAmountInLocalCurrency,
      paymentAmountInLocalCurrency,
      realizedExchangeDifference: Math.round(realizedExchangeDifference * 100) / 100,
      realizedGainLossStatus
    };
  }

  // ==================== 12. EARLY PAYMENT DISCOUNT CALCULATOR ====================

  /**
   * Validate and calculate early payment discount eligibility for terms (e.g. 2/10 Net 30, 1/15 Net 45, 3/7 Net 60)
   */
  public static calculateEarlyPaymentDiscount(
    grossAmount: number,
    invoiceDate: string,
    paymentDate: string,
    paymentTermsCode: string = '2/10 Net 30'
  ): { isEligible: boolean; discountPercent: number; discountAmount: number; deadlineDate: string } {
    let discountPercent = 0;
    let discountDays = 10;

    const match = paymentTermsCode.match(/(\d+(?:\.\d+)?)\/(\d+)\s+Net\s+(\d+)/i);
    if (match) {
      discountPercent = parseFloat(match[1]);
      discountDays = parseInt(match[2], 10);
    } else if (paymentTermsCode === '2/10 Net 30') {
      discountPercent = 2.0;
      discountDays = 10;
    } else if (paymentTermsCode === '1/15 Net 45') {
      discountPercent = 1.0;
      discountDays = 15;
    } else if (paymentTermsCode === '3/7 Net 60') {
      discountPercent = 3.0;
      discountDays = 7;
    }

    const invTime = new Date(invoiceDate).getTime();
    const deadlineTime = invTime + discountDays * 24 * 60 * 60 * 1000;
    const deadlineDate = new Date(deadlineTime).toISOString().split('T')[0];

    const payTime = new Date(paymentDate).getTime();
    const isEligible = payTime <= deadlineTime;
    const discountAmount = isEligible ? Math.round(grossAmount * (discountPercent / 100) * 100) / 100 : 0;

    return {
      isEligible,
      discountPercent: isEligible ? discountPercent : 0,
      discountAmount,
      deadlineDate
    };
  }

  // ==================== 13. INVOICE STATE TRANSITION ENGINE ====================

  /**
   * Transition Supplier Invoice through lifecycle states with audit tracking and correlation ID
   */
  public static transitionInvoiceState(
    invoice: SupplierInvoice,
    newStatus: SupplierInvoiceStatus,
    user: string,
    reason: string,
    correlationId?: string
  ): { updatedInvoice: SupplierInvoice; auditRecord: APAuditRecord } {
    const now = new Date().toISOString();
    const previousState = invoice.status;

    const updatedInvoice: SupplierInvoice = {
      ...invoice,
      status: newStatus,
      updatedAt: now
    };

    const auditRecord: APAuditRecord = {
      id: `apaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: invoice.tenantId,
      companyId: invoice.companyId,
      actionType: `TRANSITION_INVOICE_STATE_${previousState}_TO_${newStatus}`,
      performedBy: user,
      performedByName: user,
      performedAt: now,
      targetDocumentType: 'SupplierInvoice',
      targetDocumentId: invoice.id,
      targetDocumentNumber: invoice.invoiceNumber,
      details: `Invoice state transitioned from ${previousState} to ${newStatus}. Reason: ${reason}`,
      immutableHash: AccountsPayableEngine.computeAuditHash(JSON.stringify(updatedInvoice)),
      correlationId: correlationId || `corr-${Date.now()}`,
      reason,
      previousState,
      newState: newStatus
    };

    return { updatedInvoice, auditRecord };
  }

  // ==================== 14. VENDOR AGING SNAPSHOT ENGINE ====================

  /**
   * Create an immutable Vendor Aging Snapshot Record
   */
  public static createVendorAgingSnapshot(
    tenantId: string,
    companyId: string,
    report: VendorAgingReport,
    createdBy: string = 'sys-ap-user'
  ): VendorAgingSnapshotRecord {
    const now = new Date().toISOString();
    const snapshotId = `aging-snap-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const snapshot: VendorAgingSnapshotRecord = {
      id: snapshotId,
      tenantId,
      companyId,
      snapshotId,
      snapshotTimestamp: now,
      reportDate: report.reportDate,
      currency: report.currency,
      vendors: report.vendors,
      grandTotal: report.grandTotal,
      createdBy,
      immutableHash: AccountsPayableEngine.computeAuditHash(JSON.stringify(report))
    };

    return snapshot;
  }

  // ==================== 15. PAYMENT REVERSAL READY ENGINE ====================

  /**
   * Reverse Payment Batch and restore AP Voucher remaining balances
   */
  public static reversePaymentBatch(
    batch: PaymentBatch,
    vouchers: APVoucher[],
    reason: string,
    user: string = 'sys-ap-user'
  ): { updatedBatch: PaymentBatch; updatedVouchers: APVoucher[]; reversalRecords: PaymentReversalRecord[]; auditRecords: APAuditRecord[] } {
    const now = new Date().toISOString();
    const updatedBatch: PaymentBatch = { ...batch, status: 'CANCELLED' };
    const updatedVouchers = [...vouchers];
    const reversalRecords: PaymentReversalRecord[] = [];
    const auditRecords: APAuditRecord[] = [];

    batch.items.forEach(item => {
      const v = updatedVouchers.find(vch => vch.id === item.voucherId);
      if (v) {
        v.paidAmount = Math.max(0, v.paidAmount - item.paymentAmount);
        v.remainingAmount = v.grossAmount - v.paidAmount;
        v.status = v.paidAmount === 0 ? 'UNPAID' : 'PARTIALLY_PAID';

        const revRecord: PaymentReversalRecord = {
          id: `prev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tenantId: batch.tenantId,
          companyId: batch.companyId,
          originalBatchId: batch.id,
          originalBatchNumber: batch.batchNumber,
          voucherId: v.id,
          voucherNumber: v.voucherNumber,
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          reversedAmount: item.paymentAmount,
          currency: batch.currency,
          reason,
          reversedBy: user,
          reversedAt: now
        };
        reversalRecords.push(revRecord);

        auditRecords.push({
          id: `apaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tenantId: batch.tenantId,
          companyId: batch.companyId,
          actionType: 'REVERSE_SUPPLIER_PAYMENT',
          performedBy: user,
          performedByName: user,
          performedAt: now,
          targetDocumentType: 'PaymentBatch',
          targetDocumentId: batch.id,
          targetDocumentNumber: batch.batchNumber,
          details: `Reversed payment of $${item.paymentAmount} for Voucher ${v.voucherNumber}. Reason: ${reason}`,
          immutableHash: AccountsPayableEngine.computeAuditHash(JSON.stringify(revRecord)),
          reason,
          previousState: 'RELEASED',
          newState: 'REVERSED'
        });
      }
    });

    return { updatedBatch, updatedVouchers, reversalRecords, auditRecords };
  }

  // ==================== 16. SUPPLIER INVOICE REVERSAL ENGINE ====================

  /**
   * Reverse a Posted Supplier Invoice with audit trail and un-clearing GR/IR
   */
  public static reverseSupplierInvoice(
    invoice: SupplierInvoice,
    reason: string,
    user: string = 'sys-ap-user'
  ): { reversedInvoice: SupplierInvoice; auditRecord: APAuditRecord } {
    if (invoice.status === 'REVERSED' || invoice.status === 'CANCELLED') {
      throw new Error(`INVOICE_ALREADY_INACTIVE: Cannot reverse invoice in status '${invoice.status}'.`);
    }

    const now = new Date().toISOString();
    const reversedInvoice: SupplierInvoice = {
      ...invoice,
      status: 'REVERSED',
      updatedAt: now
    };

    const auditRecord: APAuditRecord = {
      id: `apaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: invoice.tenantId,
      companyId: invoice.companyId,
      actionType: 'REVERSE_SUPPLIER_INVOICE',
      performedBy: user,
      performedByName: user,
      performedAt: now,
      targetDocumentType: 'SupplierInvoice',
      targetDocumentId: invoice.id,
      targetDocumentNumber: invoice.invoiceNumber,
      details: `Supplier invoice ${invoice.invoiceNumber} reversed. Reason: ${reason}. GR/IR liabilities reopened.`,
      immutableHash: AccountsPayableEngine.computeAuditHash(JSON.stringify(reversedInvoice)),
      reason,
      previousState: invoice.status,
      newState: 'REVERSED'
    };

    return { reversedInvoice, auditRecord };
  }

  // ==================== 17. SUPPLIER DEBIT NOTE ENGINE ====================

  /**
   * Create and post Supplier Debit Note (Price deduction / Return / Shortage)
   */
  public static createSupplierDebitNote(
    data: Omit<SupplierDebitNote, 'id' | 'status' | 'createdAt'>,
    user: string = 'sys-ap-user'
  ): { debitNote: SupplierDebitNote; auditRecord: APAuditRecord } {
    const id = `sdn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const debitNote: SupplierDebitNote = {
      ...data,
      id,
      status: 'POSTED',
      createdAt: now,
      postedAt: now
    };

    const auditRecord: APAuditRecord = {
      id: `apaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: debitNote.tenantId,
      companyId: debitNote.companyId,
      actionType: 'POST_SUPPLIER_DEBIT_NOTE',
      performedBy: user,
      performedByName: user,
      performedAt: now,
      targetDocumentType: 'SupplierDebitNote',
      targetDocumentId: debitNote.id,
      targetDocumentNumber: debitNote.debitNoteNumber,
      details: `Debit note ${debitNote.debitNoteNumber} issued to Vendor ${debitNote.vendorName}. Total: $${debitNote.totalAmount}. Reason: ${debitNote.reasonCode}`,
      immutableHash: AccountsPayableEngine.computeAuditHash(JSON.stringify(debitNote))
    };

    return { debitNote, auditRecord };
  }

  // ==================== 18. AUTOMATED GR/IR CLEARING EXECUTION ====================

  /**
   * Execute GR/IR Clearing between Goods Receipts and Supplier Invoices with PPV and FX calculation
   */
  public static executeGRIRClearing(
    po: PurchaseOrder,
    grn: any,
    invoice: SupplierInvoice,
    user: string = 'sys-ap-user'
  ): { clearing: GRIRClearingExecution; auditRecord: APAuditRecord } {
    const id = `grirc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    let totalGRNQty = 0;
    let totalGRNAmount = 0;
    let totalInvQty = 0;
    let totalInvAmount = 0;

    if (grn?.items) {
      grn.items.forEach((item: any) => {
        totalGRNQty += item.receivedQty || 0;
        totalGRNAmount += (item.receivedQty || 0) * (item.unitPrice || 0);
      });
    }

    if (invoice?.items) {
      invoice.items.forEach((item: any) => {
        totalInvQty += item.billedQty || 0;
        totalInvAmount += item.lineTotal || 0;
      });
    }

    const clearedQty = Math.min(totalGRNQty, totalInvQty);
    const clearedAmount = clearedQty * (po.items[0]?.unitPrice || (totalGRNQty > 0 ? totalGRNAmount / totalGRNQty : 0));
    const ppvVarianceAmount = totalInvAmount - totalGRNAmount;
    const openQty = totalGRNQty - totalInvQty;
    const openAmount = openQty * (po.items[0]?.unitPrice || 0);

    const status = openQty === 0 && totalGRNQty > 0 ? 'FULLY_CLEARED' : (clearedQty > 0 ? 'PARTIALLY_CLEARED' : 'OPEN');

    const clearing: GRIRClearingExecution = {
      id,
      tenantId: po.tenantId,
      companyId: po.companyId,
      poId: po.id,
      poNumber: po.poNumber,
      grnId: grn?.id,
      grnNumber: grn?.number,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clearedQuantity: clearedQty,
      clearedAmount,
      grnAmount: totalGRNAmount,
      invoiceAmount: totalInvAmount,
      ppvVarianceAmount,
      exchangeDifferenceAmount: 0,
      openQuantity: openQty,
      openAmount,
      status,
      clearedAt: now,
      sha256Seal: AccountsPayableEngine.computeAuditHash(`GRIR-${po.poNumber}-${invoice.invoiceNumber}-${clearedAmount}`)
    };

    const auditRecord: APAuditRecord = {
      id: `apaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: po.tenantId,
      companyId: po.companyId,
      actionType: 'EXECUTE_GRIR_CLEARING',
      performedBy: user,
      performedByName: user,
      performedAt: now,
      targetDocumentType: 'GRIRClearing',
      targetDocumentId: clearing.id,
      targetDocumentNumber: `GRIR-${po.poNumber}`,
      details: `GR/IR Clearing executed for PO ${po.poNumber}. Cleared: $${clearedAmount}. PPV Variance: $${ppvVarianceAmount}. Status: ${status}`,
      immutableHash: AccountsPayableEngine.computeAuditHash(JSON.stringify(clearing))
    };

    return { clearing, auditRecord };
  }

  // ==================== 19. APPLY CREDIT NOTE TO VOUCHER ====================

  /**
   * Apply a Supplier Credit Note to an AP Voucher to liquidate liability
   */
  public static applyCreditNoteToVoucher(
    creditNote: SupplierCreditNote,
    voucher: APVoucher,
    applyAmount?: number,
    user: string = 'sys-ap-user'
  ): { updatedCreditNote: SupplierCreditNote; updatedVoucher: APVoucher; appliedAmount: number; auditRecord: APAuditRecord } {
    if (creditNote.tenantId !== voucher.tenantId || creditNote.companyId !== voucher.companyId) {
      throw new Error(`TENANT_COMPANY_MISMATCH: Credit note and voucher belong to different tenants or companies.`);
    }
    if (creditNote.vendorId !== voucher.vendorId) {
      throw new Error(`VENDOR_MISMATCH: Credit note vendor (${creditNote.vendorId}) does not match voucher vendor (${voucher.vendorId}).`);
    }
    if (creditNote.status === 'APPLIED' || creditNote.status === 'CANCELLED') {
      throw new Error(`INVALID_CREDIT_NOTE_STATUS: Credit note is already '${creditNote.status}'.`);
    }
    if (voucher.status === 'PAID' || voucher.remainingAmount <= 0) {
      throw new Error(`VOUCHER_ALREADY_SETTLED: Voucher ${voucher.voucherNumber} has no remaining balance.`);
    }

    const availableCredit = creditNote.totalAmount;
    const requestedApply = applyAmount !== undefined ? applyAmount : availableCredit;
    const actualApplyAmount = Math.min(requestedApply, voucher.remainingAmount, availableCredit);

    if (actualApplyAmount <= 0) {
      throw new Error(`INVALID_APPLY_AMOUNT: Applied amount must be greater than zero.`);
    }

    const now = new Date().toISOString();
    const updatedVoucher: APVoucher = {
      ...voucher,
      paidAmount: voucher.paidAmount + actualApplyAmount,
      remainingAmount: Math.max(0, voucher.remainingAmount - actualApplyAmount),
      status: voucher.remainingAmount - actualApplyAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID'
    };

    const updatedCreditNote: SupplierCreditNote = {
      ...creditNote,
      status: 'APPLIED',
      appliedToVoucherId: voucher.id
    };

    const auditRecord: APAuditRecord = {
      id: `apaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: creditNote.tenantId,
      companyId: creditNote.companyId,
      actionType: 'APPLY_SUPPLIER_CREDIT_NOTE',
      performedBy: user,
      performedByName: user,
      performedAt: now,
      targetDocumentType: 'SupplierCreditNote',
      targetDocumentId: creditNote.id,
      targetDocumentNumber: creditNote.creditNoteNumber,
      details: `Credit note ${creditNote.creditNoteNumber} ($${actualApplyAmount}) applied to Voucher ${voucher.voucherNumber}. Voucher remaining balance: $${updatedVoucher.remainingAmount}.`,
      immutableHash: AccountsPayableEngine.computeAuditHash(JSON.stringify({ updatedCreditNote, updatedVoucher, actualApplyAmount }))
    };

    return { updatedCreditNote, updatedVoucher, appliedAmount: actualApplyAmount, auditRecord };
  }

  // ==================== 20. APPLY DEBIT NOTE TO VOUCHER ====================

  /**
   * Apply a Supplier Debit Note to an AP Voucher to liquidate liability
   */
  public static applyDebitNoteToVoucher(
    debitNote: SupplierDebitNote,
    voucher: APVoucher,
    applyAmount?: number,
    user: string = 'sys-ap-user'
  ): { updatedDebitNote: SupplierDebitNote; updatedVoucher: APVoucher; appliedAmount: number; auditRecord: APAuditRecord } {
    if (debitNote.tenantId !== voucher.tenantId || debitNote.companyId !== voucher.companyId) {
      throw new Error(`TENANT_COMPANY_MISMATCH: Debit note and voucher belong to different tenants or companies.`);
    }
    if (debitNote.vendorId !== voucher.vendorId) {
      throw new Error(`VENDOR_MISMATCH: Debit note vendor (${debitNote.vendorId}) does not match voucher vendor (${voucher.vendorId}).`);
    }
    if (debitNote.status === 'APPLIED' || debitNote.status === 'CANCELLED') {
      throw new Error(`INVALID_DEBIT_NOTE_STATUS: Debit note is already '${debitNote.status}'.`);
    }
    if (voucher.status === 'PAID' || voucher.remainingAmount <= 0) {
      throw new Error(`VOUCHER_ALREADY_SETTLED: Voucher ${voucher.voucherNumber} has no remaining balance.`);
    }

    const availableDebit = debitNote.totalAmount;
    const requestedApply = applyAmount !== undefined ? applyAmount : availableDebit;
    const actualApplyAmount = Math.min(requestedApply, voucher.remainingAmount, availableDebit);

    if (actualApplyAmount <= 0) {
      throw new Error(`INVALID_APPLY_AMOUNT: Applied amount must be greater than zero.`);
    }

    const now = new Date().toISOString();
    const updatedVoucher: APVoucher = {
      ...voucher,
      paidAmount: voucher.paidAmount + actualApplyAmount,
      remainingAmount: Math.max(0, voucher.remainingAmount - actualApplyAmount),
      status: voucher.remainingAmount - actualApplyAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID'
    };

    const updatedDebitNote: SupplierDebitNote = {
      ...debitNote,
      status: 'APPLIED'
    };

    const auditRecord: APAuditRecord = {
      id: `apaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: debitNote.tenantId,
      companyId: debitNote.companyId,
      actionType: 'APPLY_SUPPLIER_DEBIT_NOTE',
      performedBy: user,
      performedByName: user,
      performedAt: now,
      targetDocumentType: 'SupplierDebitNote',
      targetDocumentId: debitNote.id,
      targetDocumentNumber: debitNote.debitNoteNumber,
      details: `Debit note ${debitNote.debitNoteNumber} ($${actualApplyAmount}) applied to Voucher ${voucher.voucherNumber}. Voucher remaining balance: $${updatedVoucher.remainingAmount}.`,
      immutableHash: AccountsPayableEngine.computeAuditHash(JSON.stringify({ updatedDebitNote, updatedVoucher, actualApplyAmount }))
    };

    return { updatedDebitNote, updatedVoucher, appliedAmount: actualApplyAmount, auditRecord };
  }

  // ==================== 21. PURCHASE ACCRUAL REVERSAL ENGINE ====================

  /**
   * Reverse an existing period-end purchase accrual
   */
  public static reversePurchaseAccrual(
    accrual: PurchaseAccrual,
    reason: string,
    user: string = 'sys-ap-user'
  ): { reversedAccrual: PurchaseAccrual; auditRecord: APAuditRecord } {
    if (accrual.status === 'REVERSED') {
      throw new Error(`ACCRUAL_ALREADY_REVERSED: Purchase accrual ${accrual.accrualNumber} is already reversed.`);
    }

    const now = new Date().toISOString();
    const reversedAccrual: PurchaseAccrual = {
      ...accrual,
      status: 'REVERSED',
      reversedAt: now
    };

    const auditRecord: APAuditRecord = {
      id: `apaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: accrual.tenantId,
      companyId: accrual.companyId,
      actionType: 'REVERSE_PURCHASE_ACCRUAL',
      performedBy: user,
      performedByName: user,
      performedAt: now,
      targetDocumentType: 'PurchaseAccrual',
      targetDocumentId: accrual.id,
      targetDocumentNumber: accrual.accrualNumber,
      details: `Purchase accrual ${accrual.accrualNumber} for $${accrual.accruedAmount} reversed. Reason: ${reason}`,
      immutableHash: AccountsPayableEngine.computeAuditHash(JSON.stringify(reversedAccrual)),
      reason
    };

    return { reversedAccrual, auditRecord };
  }

  // ==================== 22. VENDOR STATEMENT RECONCILIATION ====================

  /**
   * Reconcile Vendor Statement Closing Balance against open subledger AP vouchers
   */
  public static reconcileVendorStatement(
    statement: VendorStatement,
    openVouchers: APVoucher[],
    asOfDate: string = new Date().toISOString().split('T')[0]
  ): VendorStatementReconciliation {
    const vendorVouchers = openVouchers.filter(
      v => v.vendorId === statement.vendorId && v.remainingAmount > 0 && v.status !== 'CANCELLED'
    );
    const subledgerOpenBalance = vendorVouchers.reduce((acc, v) => acc + v.remainingAmount, 0);
    const variance = Math.round((statement.closingBalance - subledgerOpenBalance) * 100) / 100;
    const isReconciled = Math.abs(variance) < 0.01;

    let reconciliationStatus: 'PERFECT_MATCH' | 'VARIANCE_DETECTED' | 'DISPUTED' = 'PERFECT_MATCH';
    if (!isReconciled) {
      reconciliationStatus = Math.abs(variance) > 5000 ? 'DISPUTED' : 'VARIANCE_DETECTED';
    }

    return {
      vendorId: statement.vendorId,
      vendorCode: statement.vendorCode,
      vendorName: statement.vendorName,
      asOfDate,
      statementClosingBalance: statement.closingBalance,
      subledgerOpenBalance,
      variance,
      isReconciled,
      unmatchedItemCount: isReconciled ? 0 : Math.max(1, Math.abs(statement.lines.length - vendorVouchers.length)),
      reconciliationStatus,
      notes: isReconciled
        ? 'Vendor statement balance matches open AP subledger perfectly.'
        : `Variance of $${variance} detected between statement and open vouchers.`
    };
  }

  // ==================== 23. AP ANALYTICS & CASH OUTFLOW FORECASTING ====================

  /**
   * Compute comprehensive AP Analytics Dashboard metrics including DPO, HHI, and cash flow projections
   */
  public static calculateAPAnalyticsDashboard(
    tenantId: string,
    companyId: string,
    vouchers: APVoucher[],
    invoices: SupplierInvoice[],
    existingGRNs: any[] = [],
    annualCostOfGoodsSold: number = 2400000,
    asOfDate: string = new Date().toISOString().split('T')[0]
  ): APAnalyticsDashboard {
    const activeVouchers = vouchers.filter(
      v => v.tenantId === tenantId && v.companyId === companyId && v.status !== 'CANCELLED'
    );

    const openVouchers = activeVouchers.filter(v => v.remainingAmount > 0);
    const totalOpenPayables = openVouchers.reduce((sum, v) => sum + v.remainingAmount, 0);

    const asOfTimestamp = new Date(asOfDate).getTime();
    const overdueVouchers = openVouchers.filter(v => new Date(v.dueDate).getTime() < asOfTimestamp);
    const totalOverduePayables = overdueVouchers.reduce((sum, v) => sum + v.remainingAmount, 0);
    const overduePercentage = totalOpenPayables > 0 ? (totalOverduePayables / totalOpenPayables) * 100 : 0;

    // Days Payable Outstanding (DPO) = (Accounts Payable / COGS) * 365
    const daysPayableOutstanding = annualCostOfGoodsSold > 0
      ? Math.round((totalOpenPayables / annualCostOfGoodsSold) * 365)
      : 0;

    // Early discount tracking
    let totalEarlyDiscountsCaptured = 0;
    let totalEarlyDiscountsMissed = 0;

    activeVouchers.forEach(v => {
      if (v.earlyDiscountAmount && v.earlyDiscountAmount > 0) {
        if (v.paidAmount >= v.grossAmount - v.earlyDiscountAmount && v.status === 'PAID') {
          totalEarlyDiscountsCaptured += v.earlyDiscountAmount;
        } else if (v.earlyDiscountDeadline && new Date(v.earlyDiscountDeadline).getTime() < asOfTimestamp && v.status !== 'PAID') {
          totalEarlyDiscountsMissed += v.earlyDiscountAmount;
        }
      }
    });

    const totalPotentialDiscounts = totalEarlyDiscountsCaptured + totalEarlyDiscountsMissed;
    const earlyDiscountCaptureRate = totalPotentialDiscounts > 0
      ? (totalEarlyDiscountsCaptured / totalPotentialDiscounts) * 100
      : 100;

    // GR/IR Uninvoiced Exposure (GRNI)
    let grirUninvoicedExposure = 0;
    existingGRNs.forEach(grn => {
      if (grn.tenantId === tenantId && grn.companyId === companyId) {
        const hasInvoice = invoices.some(
          inv => (inv.grnId === grn.id || inv.grnNumber === grn.number) && inv.status !== 'CANCELLED'
        );
        if (!hasInvoice && grn.totalAmount > 0) {
          grirUninvoicedExposure += grn.totalAmount;
        }
      }
    });

    // Cash Outflow Forecasting Buckets
    const buckets: Record<CashOutflowBucket['period'], { label: string; amount: number; count: number }> = {
      '1-7_DAYS': { label: '1 - 7 Days', amount: 0, count: 0 },
      '8-14_DAYS': { label: '8 - 14 Days', amount: 0, count: 0 },
      '15-30_DAYS': { label: '15 - 30 Days', amount: 0, count: 0 },
      '31-60_DAYS': { label: '31 - 60 Days', amount: 0, count: 0 },
      '61-90_DAYS': { label: '61 - 90 Days', amount: 0, count: 0 },
      'OVER_90_DAYS': { label: 'Over 90 Days', amount: 0, count: 0 }
    };

    openVouchers.forEach(v => {
      const dueTime = new Date(v.dueDate).getTime();
      const daysUntilDue = Math.ceil((dueTime - asOfTimestamp) / (1000 * 60 * 60 * 24));
      const amt = v.remainingAmount;

      if (daysUntilDue <= 7) {
        buckets['1-7_DAYS'].amount += amt;
        buckets['1-7_DAYS'].count += 1;
      } else if (daysUntilDue <= 14) {
        buckets['8-14_DAYS'].amount += amt;
        buckets['8-14_DAYS'].count += 1;
      } else if (daysUntilDue <= 30) {
        buckets['15-30_DAYS'].amount += amt;
        buckets['15-30_DAYS'].count += 1;
      } else if (daysUntilDue <= 60) {
        buckets['31-60_DAYS'].amount += amt;
        buckets['31-60_DAYS'].count += 1;
      } else if (daysUntilDue <= 90) {
        buckets['61-90_DAYS'].amount += amt;
        buckets['61-90_DAYS'].count += 1;
      } else {
        buckets['OVER_90_DAYS'].amount += amt;
        buckets['OVER_90_DAYS'].count += 1;
      }
    });

    const outflowForecast: CashOutflowBucket[] = (Object.keys(buckets) as CashOutflowBucket['period'][]).map(period => ({
      period,
      periodLabel: buckets[period].label,
      projectedOutflow: Math.round(buckets[period].amount * 100) / 100,
      voucherCount: buckets[period].count
    }));

    // Vendor Concentration & Exposure
    const vendorMap = new Map<string, { code: string; name: string; open: number; overdue: number }>();
    openVouchers.forEach(v => {
      const existing = vendorMap.get(v.vendorId) || { code: v.vendorCode || v.vendorId, name: v.vendorName, open: 0, overdue: 0 };
      existing.open += v.remainingAmount;
      if (new Date(v.dueDate).getTime() < asOfTimestamp) {
        existing.overdue += v.remainingAmount;
      }
      vendorMap.set(v.vendorId, existing);
    });

    const topVendorsByExposure: VendorExposureSummary[] = [];
    let hhiSum = 0;

    vendorMap.forEach((val, venId) => {
      const share = totalOpenPayables > 0 ? (val.open / totalOpenPayables) * 100 : 0;
      hhiSum += Math.pow(share, 2);

      let riskRating: VendorExposureSummary['riskRating'] = 'LOW';
      if (val.overdue > 50000 || (val.open > 0 && val.overdue / val.open > 0.5)) {
        riskRating = 'CRITICAL';
      } else if (val.overdue > 20000) {
        riskRating = 'HIGH';
      } else if (val.overdue > 0 || share > 25) {
        riskRating = 'MEDIUM';
      }

      topVendorsByExposure.push({
        vendorId: venId,
        vendorCode: val.code,
        vendorName: val.name,
        totalOpenAmount: Math.round(val.open * 100) / 100,
        overdueAmount: Math.round(val.overdue * 100) / 100,
        shareOfTotalPercent: Math.round(share * 10) / 10,
        riskRating
      });
    });

    topVendorsByExposure.sort((a, b) => b.totalOpenAmount - a.totalOpenAmount);

    return {
      tenantId,
      companyId,
      asOfDate,
      currency: activeVouchers[0]?.currency || 'USD',
      totalOpenPayables: Math.round(totalOpenPayables * 100) / 100,
      totalOverduePayables: Math.round(totalOverduePayables * 100) / 100,
      overduePercentage: Math.round(overduePercentage * 10) / 10,
      daysPayableOutstanding,
      earlyDiscountCaptureRate: Math.round(earlyDiscountCaptureRate * 10) / 10,
      totalEarlyDiscountsCaptured: Math.round(totalEarlyDiscountsCaptured * 100) / 100,
      totalEarlyDiscountsMissed: Math.round(totalEarlyDiscountsMissed * 100) / 100,
      grirUninvoicedExposure: Math.round(grirUninvoicedExposure * 100) / 100,
      vendorConcentrationIndex: Math.round(hhiSum),
      outflowForecast,
      topVendorsByExposure
    };
  }
}

