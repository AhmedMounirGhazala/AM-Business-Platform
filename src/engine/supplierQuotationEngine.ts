/**
 * AM Enterprise ERP - Supplier Quotation Engine (Phase 3.2B-02)
 * Enterprise Standard Aligned with SAP S/4HANA (MM-PUR-RFQ) and Oracle Procurement Cloud
 */

import {
  RequestForQuotation,
  RFQLine,
  SupplierQuotation,
  SupplierQuotationLine,
  SupplierQuotationStatus,
  RFQSupplierInvitation,
  PurchaseAuditRecord,
  VendorMaster
} from '../types/procurement';
import { INITIAL_VENDORS } from '../data/mockDatabase';
import { MasterDataService } from './masterDataService';
import { CurrencyEngine } from './currencyEngine';
import { WorkflowEngine } from './workflowEngine';
import { RFQUserContext } from './rfqEngine';

export class SupplierQuotationEngine {
  private static liveVendorProvider?: () => VendorMaster[];

  public static setLiveVendorProvider(provider: () => VendorMaster[]): void {
    this.liveVendorProvider = provider;
  }

  /**
   * Validate and compute line totals, tax amounts, and currency-normalized unit price
   */
  static validateAndComputeLine(
    rawLine: Partial<SupplierQuotationLine>,
    rfqLine: RFQLine | undefined,
    quoteCurrency: string,
    rfqCurrency: string,
    exchangeRate: number,
    tenantId: string,
    index: number = 0
  ): { success: boolean; line?: SupplierQuotationLine; error?: string } {
    const qty = Number(rawLine.quotedQuantity !== undefined ? rawLine.quotedQuantity : rawLine.offeredQty);
    if (!qty || isNaN(qty) || qty <= 0) {
      return { success: false, error: `Quote Line ${index + 1}: Quoted quantity must be greater than zero.` };
    }

    const unitPrice = Number(rawLine.unitPrice);
    if (isNaN(unitPrice) || unitPrice < 0) {
      return { success: false, error: `Quote Line ${index + 1}: Unit price cannot be negative.` };
    }

    const itemSku = rawLine.itemSku || rfqLine?.itemSku;
    if (!itemSku) {
      return { success: false, error: `Quote Line ${index + 1}: Item SKU or product reference is required.` };
    }

    // 1. Authoritative Master Data Product Lookup
    const products = MasterDataService.getProducts(tenantId);
    const matchedProduct = products.find(p => p.sku.toLowerCase() === itemSku.toLowerCase() || p.id === rawLine.productId);
    const baseUOM = matchedProduct?.baseUom || rfqLine?.baseUOM || 'PCS';
    const quotedUOM = (rawLine.quotedUOM || rawLine.uom || rfqLine?.targetUOM || baseUOM).toUpperCase();

    // 2. UOM Registry Validation & Conversion
    const tenantUOMs = MasterDataService.getUOMs(tenantId);
    const resolvedUOM = tenantUOMs.find(u => u.code.toUpperCase() === quotedUOM);
    if (!resolvedUOM) {
      return { success: false, error: `Quote Line ${index + 1}: Quoted UOM '${quotedUOM}' is not recognized in tenant UOM registry.` };
    }
    if (!resolvedUOM.active) {
      return { success: false, error: `Quote Line ${index + 1}: Quoted UOM '${quotedUOM}' is inactive.` };
    }

    let baseQuantity = qty;
    let uomConversionFactor = 1;

    try {
      const conv = MasterDataService.convertQuantity(
        quotedUOM,
        baseUOM,
        qty,
        tenantId,
        itemSku
      );
      baseQuantity = conv.convertedQuantity;
      uomConversionFactor = conv.factorUsed;
    } catch (err: any) {
      return { success: false, error: `Quote Line ${index + 1}: UOM conversion failed: ${err.message || err}` };
    }

    // 3. Discount & Tax Arithmetic
    const discountPercent = Number(rawLine.discountPercent || 0);
    const discountAmount = rawLine.discountAmount !== undefined
      ? Number(rawLine.discountAmount)
      : (unitPrice * qty) * (discountPercent / 100);

    const netLineTotal = (unitPrice * qty) - discountAmount;

    let taxRate = Number(rawLine.taxRate !== undefined ? rawLine.taxRate : 15); // Default 15% VAT
    let taxCategoryId = rawLine.taxCategoryId || matchedProduct?.taxCategoryId;
    let taxCategoryCode = rawLine.taxCategoryCode;

    if (taxCategoryId && rawLine.taxRate === undefined) {
      const taxCats = MasterDataService.getTaxCategories(tenantId);
      const taxCat = taxCats.find(t => t.id === taxCategoryId);
      if (taxCat) {
        taxCategoryCode = taxCat.code;
        taxRate = taxCat.isExempt || taxCat.isZeroRated ? 0 : 15;
      }
    }

    const taxAmount = netLineTotal * (taxRate / 100);
    const lineTotal = netLineTotal + taxAmount;

    // 4. Currency Normalization (Against RFQ Currency & Base UOM)
    // Rate: exchangeRate (Quote Currency -> RFQ Currency)
    const lineTotalBaseCurrency = lineTotal * exchangeRate;
    // Normalized Unit Price: Price per Base UOM in RFQ Currency
    const pricePerBaseUnitInQuoteCurrency = unitPrice / (uomConversionFactor || 1);
    const normalizedUnitPrice = pricePerBaseUnitInQuoteCurrency * exchangeRate;

    const leadTime = Number(rawLine.deliveryLeadTimeDays || rawLine.leadTimeDays || 14);
    const promisedDeliveryDate = rawLine.promisedDeliveryDate || rawLine.deliveryDate || new Date(Date.now() + leadTime * 86400000).toISOString();

    const quoteLine: SupplierQuotationLine = {
      id: rawLine.id || `quote-line-${Date.now()}-${index}`,
      quotationId: rawLine.quotationId || '',
      rfqLineId: rawLine.rfqLineId || rfqLine?.id || '',
      rfqItemId: rawLine.rfqLineId || rfqLine?.id || '',
      prLineId: rfqLine?.prLineId,
      productId: matchedProduct?.id || rfqLine?.productId || itemSku,
      variantId: rawLine.variantId || rfqLine?.variantId,
      itemSku,
      itemName: matchedProduct?.name || rfqLine?.itemName || itemSku,
      supplierItemCode: rawLine.supplierItemCode || '',
      quotedQuantity: qty,
      offeredQty: qty,
      quotedUOM,
      uom: quotedUOM,
      baseQuantity,
      baseUOM,
      uomConversionFactor,
      unitPrice,
      normalizedUnitPrice: Number(normalizedUnitPrice.toFixed(4)),
      discountPercent,
      discountAmount,
      taxCategoryId,
      taxCategoryCode,
      taxRate,
      taxAmount,
      lineTotal,
      totalPrice: lineTotal,
      lineTotalBaseCurrency,
      deliveryLeadTimeDays: leadTime,
      leadTimeDays: leadTime,
      promisedDeliveryDate,
      deliveryDate: promisedDeliveryDate,
      technicalScore: rawLine.technicalScore || 90,
      commercialScore: rawLine.commercialScore || 90,
      overallScore: rawLine.overallScore || 90,
      complianceConfirmed: rawLine.complianceConfirmed !== false,
      remarks: rawLine.remarks || '',
      isAwarded: false,
      awardedQuantity: 0
    };

    return { success: true, line: quoteLine };
  }

  /**
   * Record a new supplier quotation
   */
  static recordQuotation(
    data: Partial<SupplierQuotation>,
    lines: Partial<SupplierQuotationLine>[],
    quotations: SupplierQuotation[],
    rfqs: RequestForQuotation[],
    invitations: RFQSupplierInvitation[],
    auditLogs: PurchaseAuditRecord[],
    context: RFQUserContext,
    customVendors?: VendorMaster[]
  ): { success: boolean; quotation?: SupplierQuotation; error?: string } {
    if (!data.rfqId) {
      return { success: false, error: 'RFQ ID reference is mandatory.' };
    }

    const rfq = rfqs.find(r => r.id === data.rfqId && r.tenantId === context.tenantId);
    if (!rfq) return { success: false, error: 'Referenced RFQ not found in tenant.' };

    if (rfq.status === 'CANCELLED' || rfq.status === 'CLOSED') {
      return { success: false, error: `Cannot submit quotation for RFQ in status '${rfq.status}'.` };
    }

    const supplierId = data.supplierId || data.vendorId;
    if (!supplierId) {
      return { success: false, error: 'Supplier reference (ID or code) is mandatory.' };
    }

    // Lookup Supplier Master
    const vendorsList = customVendors || (this.liveVendorProvider ? this.liveVendorProvider() : (INITIAL_VENDORS as any[]));
    let matchedSupplier = vendorsList.find((s: any) => (s.id === supplierId || s.code === supplierId) && s.tenantId === context.tenantId);
    if (!matchedSupplier) {
      return { success: false, error: `Supplier '${supplierId}' not found in master data.` };
    }
    const isInactive = matchedSupplier.status === 'INACTIVE' || matchedSupplier.status === 'BLOCKED' || matchedSupplier.active === false;
    if (isInactive) {
      return { success: false, error: `Supplier '${matchedSupplier.name}' is inactive.` };
    }

    // Check duplicate quotation number for same supplier
    const quoteNum = data.quotationNumber || `VQ-${matchedSupplier.code}-${Date.now().toString().slice(-4)}`;
    const duplicate = quotations.find(
      q => q.rfqId === rfq.id &&
           (q.supplierId === matchedSupplier!.id || q.supplierCode === matchedSupplier!.code) &&
           q.quotationNumber.toLowerCase() === quoteNum.toLowerCase() &&
           q.status !== 'REVISED'
    );
    if (duplicate) {
      return { success: false, error: `Quotation '${quoteNum}' has already been recorded for supplier '${matchedSupplier.name}' on RFQ ${rfq.rfqNumber}.` };
    }

    if (!lines || lines.length === 0) {
      return { success: false, error: 'Quotation must contain at least one line item.' };
    }

    // Currency & Exchange Rate Snapshotting via CurrencyEngine
    const quoteCurrency = (data.currency || (matchedSupplier as any).currency || rfq.currency || 'SAR').toUpperCase();
    const rfqCurrency = (rfq.currency || 'SAR').toUpperCase();
    let exchangeRate = data.exchangeRate || 1.0;

    if (quoteCurrency === rfqCurrency) {
      exchangeRate = 1.0;
    } else if (!data.exchangeRate) {
      exchangeRate = CurrencyEngine.getExchangeRate(quoteCurrency, rfqCurrency, []);
    }

    const rfqLines = rfq.items || rfq.lines || [];
    const processedLines: SupplierQuotationLine[] = [];

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const matchingRfqLine = rfqLines.find(rl => rl.id === rawLine.rfqLineId || rl.itemSku === rawLine.itemSku);
      const lineRes = this.validateAndComputeLine(
        rawLine,
        matchingRfqLine,
        quoteCurrency,
        rfqCurrency,
        exchangeRate,
        context.tenantId,
        i
      );
      if (!lineRes.success || !lineRes.line) {
        return { success: false, error: lineRes.error };
      }
      processedLines.push(lineRes.line);
    }

    const subtotal = processedLines.reduce((s, l) => s + (l.quotedQuantity * l.unitPrice), 0);
    const discountAmt = processedLines.reduce((s, l) => s + l.discountAmount, 0);
    const taxAmt = processedLines.reduce((s, l) => s + l.taxAmount, 0);
    const freightAmt = Number(data.freightAmount || 0);
    const totalGross = (subtotal - discountAmt) + taxAmt + freightAmt;
    const totalGrossBase = totalGross * exchangeRate;

    const count = quotations.length + 1;
    const quoteId = `quote-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const internalNumber = `SQ-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;

    processedLines.forEach(l => {
      l.quotationId = quoteId;
    });

    const leadTimes = processedLines.map(l => l.deliveryLeadTimeDays);
    const avgLeadTime = leadTimes.length > 0 ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) : 14;

    const newQuote: SupplierQuotation = {
      id: quoteId,
      tenantId: rfq.tenantId,
      companyId: rfq.companyId,
      branchId: rfq.branchId,
      rfqId: rfq.id,
      rfqNumber: rfq.rfqNumber,
      quotationNumber: quoteNum,
      internalQuotationNumber: internalNumber,
      supplierId: matchedSupplier.id,
      vendorId: matchedSupplier.id,
      supplierCode: matchedSupplier.code,
      supplierName: matchedSupplier.name,
      vendorName: matchedSupplier.name,
      quotationDate: data.quotationDate || new Date().toISOString(),
      validUntil: data.validUntil || new Date(Date.now() + 30 * 86400000).toISOString(),
      currency: quoteCurrency,
      exchangeRate,
      exchangeRateDate: new Date().toISOString(),
      paymentTermsId: data.paymentTermsId || (matchedSupplier as any).paymentTermsId || 'pterm-001',
      paymentTermsName: data.paymentTermsName || 'Net 30 Days',
      incotermsId: data.incotermsId || (matchedSupplier as any).incotermsId || 'inco-001',
      incotermsCode: data.incotermsCode || 'FOB',
      deliveryLeadTimeDays: data.deliveryLeadTimeDays || avgLeadTime,
      leadTimeDays: data.deliveryLeadTimeDays || avgLeadTime,
      subtotalAmount: subtotal,
      discountAmount: discountAmt,
      freightAmount: freightAmt,
      taxAmount: taxAmt,
      totalAmount: totalGross,
      totalGrossAmount: totalGross,
      totalGrossAmountBaseCurrency: totalGrossBase,
      status: 'SUBMITTED',
      items: processedLines,
      lines: processedLines,
      revisionNumber: 1,
      overallScore: 90,
      supplierNotes: data.supplierNotes || data.notes || '',
      notes: data.notes || data.supplierNotes || '',
      version: 1,
      correlationId: `corr-quote-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    quotations.unshift(newQuote);

    // Update Invitation status to RESPONDED
    const invite = invitations.find(
      i => i.rfqId === rfq.id && (i.supplierId === matchedSupplier!.id || i.supplierCode === matchedSupplier!.code)
    );
    if (invite) {
      invite.invitationStatus = 'RESPONDED';
      invite.respondedAt = new Date().toISOString();
      invite.quotationId = newQuote.id;
    }

    // Advance RFQ state if in published/issued
    if (rfq.status === 'PUBLISHED' || rfq.status === 'ISSUED') {
      rfq.status = 'RESPONSES_RECEIVED';
      rfq.updatedAt = new Date().toISOString();
    }

    const timestamp = new Date().toISOString();
    const hash = WorkflowEngine.generateDigitalSignature(newQuote.id, newQuote.quotationNumber, context.userId, timestamp);

    auditLogs.unshift({
      id: `aud-q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: newQuote.tenantId,
      companyId: newQuote.companyId,
      branchId: newQuote.branchId,
      actionType: 'QUOTATION_SUBMITTED',
      performedBy: context.userId,
      performedByName: context.userName,
      performedAt: timestamp,
      targetDocumentType: 'QUOTATION',
      targetDocumentId: newQuote.id,
      targetDocumentNumber: newQuote.quotationNumber,
      details: `Quotation ${newQuote.quotationNumber} (${newQuote.internalQuotationNumber}) recorded from ${newQuote.supplierName}. Gross Total: ${totalGross.toLocaleString()} ${quoteCurrency} (${totalGrossBase.toLocaleString()} ${rfqCurrency}).`,
      previousState: undefined,
      newState: 'SUBMITTED',
      version: 1,
      immutableHash: hash
    });

    return { success: true, quotation: newQuote };
  }

  /**
   * Create a controlled revision for a supplier quotation (Immutable historical snapshot)
   */
  static createQuotationRevision(
    quotationId: string,
    updates: Partial<SupplierQuotation>,
    lines: Partial<SupplierQuotationLine>[] | undefined,
    reason: string,
    quotations: SupplierQuotation[],
    rfqs: RequestForQuotation[],
    auditLogs: PurchaseAuditRecord[],
    context: RFQUserContext,
    expectedVersion?: number
  ): { success: boolean; quotation?: SupplierQuotation; isConflict?: boolean; error?: string } {
    const prevQuote = quotations.find(q => q.id === quotationId && q.tenantId === context.tenantId);
    if (!prevQuote) return { success: false, error: 'Quotation not found.' };

    // Concurrency Check
    if (expectedVersion !== undefined && prevQuote.version !== expectedVersion) {
      return {
        success: false,
        isConflict: true,
        error: `Optimistic concurrency conflict on Quotation ${prevQuote.quotationNumber} (Version: ${prevQuote.version}, Expected: ${expectedVersion}).`
      };
    }

    if (prevQuote.status === 'REVISED' || prevQuote.status === 'REJECTED') {
      return { success: false, error: `Cannot revise quotation in status '${prevQuote.status}'.` };
    }

    if (!reason || reason.trim() === '') {
      return { success: false, error: 'Revision reason is required to revise a quotation.' };
    }

    const rfq = rfqs.find(r => r.id === prevQuote.rfqId && r.tenantId === context.tenantId);
    if (!rfq) return { success: false, error: 'Associated RFQ not found.' };

    const quoteCurrency = updates.currency || prevQuote.currency;
    const rfqCurrency = rfq.currency || 'SAR';
    const exchangeRate = updates.exchangeRate || prevQuote.exchangeRate;

    const rfqLines = rfq.items || rfq.lines || [];
    const sourceLines = lines && lines.length > 0 ? lines : (prevQuote.items || prevQuote.lines || []);
    const processedLines: SupplierQuotationLine[] = [];

    for (let i = 0; i < sourceLines.length; i++) {
      const rawLine = sourceLines[i];
      const matchingRfqLine = rfqLines.find(rl => rl.id === rawLine.rfqLineId || rl.itemSku === rawLine.itemSku);
      const lineRes = this.validateAndComputeLine(
        rawLine,
        matchingRfqLine,
        quoteCurrency,
        rfqCurrency,
        exchangeRate,
        context.tenantId,
        i
      );
      if (!lineRes.success || !lineRes.line) {
        return { success: false, error: lineRes.error };
      }
      processedLines.push(lineRes.line);
    }

    const subtotal = processedLines.reduce((s, l) => s + (l.quotedQuantity * l.unitPrice), 0);
    const discountAmt = processedLines.reduce((s, l) => s + l.discountAmount, 0);
    const taxAmt = processedLines.reduce((s, l) => s + l.taxAmount, 0);
    const freightAmt = Number(updates.freightAmount !== undefined ? updates.freightAmount : prevQuote.freightAmount);
    const totalGross = (subtotal - discountAmt) + taxAmt + freightAmt;
    const totalGrossBase = totalGross * exchangeRate;

    // Mark previous quotation as REVISED
    prevQuote.status = 'REVISED';
    prevQuote.updatedAt = new Date().toISOString();

    const newRevNum = (prevQuote.revisionNumber || 1) + 1;
    const newQuoteId = `quote-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    processedLines.forEach(l => {
      l.quotationId = newQuoteId;
    });

    const newQuote: SupplierQuotation = {
      ...prevQuote,
      ...updates,
      id: newQuoteId,
      tenantId: prevQuote.tenantId,
      companyId: prevQuote.companyId,
      branchId: prevQuote.branchId,
      rfqId: prevQuote.rfqId,
      rfqNumber: prevQuote.rfqNumber,
      quotationNumber: prevQuote.quotationNumber,
      internalQuotationNumber: `${prevQuote.internalQuotationNumber}-R${newRevNum}`,
      supplierId: prevQuote.supplierId,
      supplierCode: prevQuote.supplierCode,
      supplierName: prevQuote.supplierName,
      currency: quoteCurrency,
      exchangeRate,
      subtotalAmount: subtotal,
      discountAmount: discountAmt,
      freightAmount: freightAmt,
      taxAmount: taxAmt,
      totalAmount: totalGross,
      totalGrossAmount: totalGross,
      totalGrossAmountBaseCurrency: totalGrossBase,
      status: 'SUBMITTED',
      items: processedLines,
      lines: processedLines,
      revisionNumber: newRevNum,
      previousRevisionId: prevQuote.id,
      revisionReason: reason,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    quotations.unshift(newQuote);

    const timestamp = new Date().toISOString();
    const hash = WorkflowEngine.generateDigitalSignature(newQuote.id, newQuote.quotationNumber, context.userId, timestamp);

    auditLogs.unshift({
      id: `aud-rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: newQuote.tenantId,
      companyId: newQuote.companyId,
      branchId: newQuote.branchId,
      actionType: 'QUOTATION_REVISED',
      performedBy: context.userId,
      performedByName: context.userName,
      performedAt: timestamp,
      targetDocumentType: 'QUOTATION',
      targetDocumentId: newQuote.id,
      targetDocumentNumber: newQuote.quotationNumber,
      details: `Quotation ${newQuote.quotationNumber} revised to Revision ${newRevNum} (Previous ID: ${prevQuote.id}). Reason: ${reason}. New Gross Total: ${totalGross.toLocaleString()} ${quoteCurrency}.`,
      previousState: 'SUBMITTED',
      newState: 'SUBMITTED',
      version: 1,
      immutableHash: hash
    });

    return { success: true, quotation: newQuote };
  }

  /**
   * Get single quotation with tenant boundary
   */
  static getQuotation(
    id: string,
    tenantId: string,
    quotations: SupplierQuotation[],
    companyId?: string
  ): SupplierQuotation | undefined {
    return quotations.find(
      q => q.id === id && q.tenantId === tenantId && (!companyId || q.companyId === companyId)
    );
  }

  /**
   * List quotations for an RFQ
   */
  static listQuotations(
    rfqId: string,
    tenantId: string,
    quotations: SupplierQuotation[],
    includeHistoricalRevisions: boolean = false
  ): SupplierQuotation[] {
    return quotations.filter(q => {
      if (q.rfqId !== rfqId || q.tenantId !== tenantId) return false;
      if (!includeHistoricalRevisions && q.status === 'REVISED') return false;
      return true;
    });
  }
}
