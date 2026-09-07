/**
 * AM Enterprise ERP - RFQ Sourcing Award Engine (Phase 3.2B-02)
 * Enterprise Standard Aligned with SAP S/4HANA (Sourcing Award) & Oracle SCM Split Award Framework
 */

import {
  RequestForQuotation,
  RFQLine,
  SupplierQuotation,
  SupplierQuotationLine,
  RFQAward,
  RFQAwardLine,
  AwardType,
  PurchaseAuditRecord
} from '../types/procurement';
import { MasterDataService } from './masterDataService';
import { WorkflowEngine } from './workflowEngine';
import { RFQUserContext } from './rfqEngine';

export interface AwardAllocation {
  rfqLineId: string;
  quotationId: string;
  quotationLineId: string;
  awardedQuantity: number;
  reason?: string;
}

export class RFQAwardEngine {
  /**
   * Execute Sourcing Award (Single Supplier, Split Award, or Line-by-Line)
   */
  static executeAward(
    rfqId: string,
    awardType: AwardType,
    allocations: AwardAllocation[],
    justification: string,
    rfqs: RequestForQuotation[],
    quotations: SupplierQuotation[],
    awards: RFQAward[],
    auditLogs: PurchaseAuditRecord[],
    context: RFQUserContext,
    expectedVersion?: number
  ): { success: boolean; award?: RFQAward; isConflict?: boolean; error?: string } {
    const rfq = rfqs.find(r => r.id === rfqId && r.tenantId === context.tenantId);
    if (!rfq) return { success: false, error: 'RFQ not found.' };

    // Concurrency Check
    if (expectedVersion !== undefined && rfq.version !== expectedVersion) {
      return {
        success: false,
        isConflict: true,
        error: `Optimistic concurrency conflict on RFQ ${rfq.rfqNumber} (Version: ${rfq.version}, Expected: ${expectedVersion}).`
      };
    }

    if (rfq.status === 'AWARDED' || rfq.status === 'CLOSED' || rfq.status === 'CANCELLED') {
      return { success: false, error: `Cannot award RFQ in terminal status '${rfq.status}'.` };
    }

    if (!justification || justification.trim() === '') {
      return { success: false, error: 'Award commercial justification is mandatory.' };
    }

    if (!allocations || allocations.length === 0) {
      return { success: false, error: 'At least one line allocation is required to execute an award.' };
    }

    const rfqLines = rfq.items || rfq.lines || [];
    const rfqCurrency = rfq.currency || 'SAR';

    // 1. Group allocations by rfqLineId and validate over-award constraints
    const lineAllocMap = new Map<string, number>();
    for (const alloc of allocations) {
      const current = lineAllocMap.get(alloc.rfqLineId) || 0;
      lineAllocMap.set(alloc.rfqLineId, current + alloc.awardedQuantity);
    }

    for (const [lineId, totalAwarded] of lineAllocMap.entries()) {
      const rfqLine = rfqLines.find(l => l.id === lineId);
      if (!rfqLine) {
        return { success: false, error: `RFQ Line '${lineId}' not found in RFQ ${rfq.rfqNumber}.` };
      }
      const targetQty = rfqLine.targetQuantity || rfqLine.requestedQty || 1;
      if (totalAwarded > targetQty) {
        return {
          success: false,
          error: `Over-award violation on line '${rfqLine.itemName}': Total awarded quantity (${totalAwarded}) exceeds target quantity (${targetQty}).`
        };
      }
      if (totalAwarded <= 0) {
        return {
          success: false,
          error: `Award quantity on line '${rfqLine.itemName}' must be greater than zero.`
        };
      }
    }

    // 2. Build Award Lines and validate quotation lines
    const awardId = `award-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const count = awards.length + 1;
    const awardNumber = `AWD-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;
    const awardLines: RFQAwardLine[] = [];
    const winningQuotationIds = new Set<string>();

    for (const alloc of allocations) {
      const quote = quotations.find(q => q.id === alloc.quotationId && q.tenantId === context.tenantId);
      if (!quote) {
        return { success: false, error: `Quotation '${alloc.quotationId}' not found.` };
      }

      const qLines = quote.items || quote.lines || [];
      const qLine = qLines.find(ql => ql.id === alloc.quotationLineId || ql.rfqLineId === alloc.rfqLineId);
      if (!qLine) {
        return { success: false, error: `Quotation line not found in quote ${quote.quotationNumber}.` };
      }

      const rfqLine = rfqLines.find(l => l.id === alloc.rfqLineId)!;

      const unitPrice = qLine.unitPrice;
      const exRate = quote.exchangeRate || 1.0;
      const awardedQty = alloc.awardedQuantity;
      const lineTotal = awardedQty * unitPrice;
      const lineTotalBase = lineTotal * exRate;

      const aLine: RFQAwardLine = {
        id: `awd-line-${Date.now()}-${awardLines.length}`,
        awardId,
        rfqLineId: rfqLine.id,
        prLineId: rfqLine.prLineId,
        quotationId: quote.id,
        quotationLineId: qLine.id,
        supplierId: quote.supplierId || quote.vendorId || '',
        supplierCode: quote.supplierCode,
        supplierName: quote.supplierName || quote.vendorName || '',
        productId: rfqLine.productId || qLine.productId || rfqLine.itemSku,
        itemSku: rfqLine.itemSku,
        itemName: rfqLine.itemName,
        awardedQuantity: awardedQty,
        awardedUOM: qLine.quotedUOM || rfqLine.targetUOM,
        baseQuantity: (awardedQty * (rfqLine.uomConversionFactor || 1)),
        baseUOM: rfqLine.baseUOM,
        unitPrice,
        currency: quote.currency,
        exchangeRate: exRate,
        lineTotal,
        lineTotalBaseCurrency: lineTotalBase,
        deliveryLeadTimeDays: qLine.deliveryLeadTimeDays || quote.deliveryLeadTimeDays || 14,
        promisedDeliveryDate: qLine.promisedDeliveryDate || quote.validUntil,
        reason: alloc.reason || justification
      };

      awardLines.push(aLine);
      winningQuotationIds.add(quote.id);

      // Update Quotation line award status
      qLine.isAwarded = true;
      qLine.awardedQuantity = (qLine.awardedQuantity || 0) + awardedQty;

      // Update RFQ line award status
      rfqLine.awardedQuantity = (rfqLine.awardedQuantity || 0) + awardedQty;
      const targetQty = rfqLine.targetQuantity || rfqLine.requestedQty || 1;
      rfqLine.remainingQuantity = Math.max(0, targetQty - rfqLine.awardedQuantity);
      rfqLine.status = rfqLine.remainingQuantity === 0 ? 'AWARDED' : 'PARTIALLY_AWARDED';
    }

    const totalAwardAmount = awardLines.reduce((s, l) => s + l.lineTotal, 0);
    const totalAwardBase = awardLines.reduce((s, l) => s + l.lineTotalBaseCurrency, 0);

    const awardEntity: RFQAward = {
      id: awardId,
      tenantId: rfq.tenantId,
      companyId: rfq.companyId,
      branchId: rfq.branchId,
      rfqId: rfq.id,
      rfqNumber: rfq.rfqNumber,
      awardNumber,
      awardType,
      status: 'APPROVED', // Sourcing award approved and READY_FOR_PO in Phase 3.2B-03
      awardedBy: context.userId,
      awardedByName: context.userName,
      awardedAt: new Date().toISOString(),
      approvedBy: context.userId,
      approvedByName: context.userName,
      approvedAt: new Date().toISOString(),
      justification,
      lines: awardLines,
      items: awardLines,
      totalAwardedAmount: totalAwardAmount,
      totalAwardedAmountBaseCurrency: totalAwardBase,
      currency: rfqCurrency,
      isConsumedByPO: false,
      purchaseOrderIds: [],
      version: 1,
      correlationId: `corr-awd-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    awards.unshift(awardEntity);
    rfq.award = awardEntity;

    // Determine overall RFQ award status
    const allLinesFullyAwarded = rfqLines.every(l => (l.remainingQuantity || 0) === 0);
    const prevStatus = rfq.status;
    rfq.status = allLinesFullyAwarded ? 'AWARDED' : 'PARTIALLY_AWARDED';
    rfq.version = (rfq.version || 1) + 1;
    rfq.updatedAt = new Date().toISOString();

    // Update Winning vs Losing Quotations
    const allRfqQuotes = quotations.filter(q => q.rfqId === rfq.id && q.tenantId === context.tenantId && q.status !== 'REVISED');
    allRfqQuotes.forEach(q => {
      if (winningQuotationIds.has(q.id)) {
        const qLines = q.items || q.lines || [];
        const anyUnawarded = qLines.some(ql => !ql.isAwarded);
        q.status = (allLinesFullyAwarded && !anyUnawarded) ? 'ACCEPTED' : 'PARTIALLY_ACCEPTED';
      } else {
        q.status = 'REJECTED';
      }
      q.updatedAt = new Date().toISOString();
    });

    const timestamp = new Date().toISOString();
    const hash = WorkflowEngine.generateDigitalSignature(awardEntity.id, awardEntity.awardNumber, context.userId, timestamp);

    auditLogs.unshift({
      id: `aud-awd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: rfq.tenantId,
      companyId: rfq.companyId,
      branchId: rfq.branchId,
      actionType: 'AWARD_CREATED',
      performedBy: context.userId,
      performedByName: context.userName,
      performedAt: timestamp,
      targetDocumentType: 'AWARD',
      targetDocumentId: awardEntity.id,
      targetDocumentNumber: awardEntity.awardNumber,
      details: `Award ${awardEntity.awardNumber} executed (${awardType}) for RFQ ${rfq.rfqNumber}. Total Awarded: ${totalAwardBase.toLocaleString()} ${rfqCurrency}. Justification: ${justification}`,
      previousState: prevStatus,
      newState: 'APPROVED',
      version: 1,
      immutableHash: hash
    });

    auditLogs.unshift({
      id: `aud-rfq-awd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: rfq.tenantId,
      companyId: rfq.companyId,
      branchId: rfq.branchId,
      actionType: 'RFQ_AWARDED',
      performedBy: context.userId,
      performedByName: context.userName,
      performedAt: timestamp,
      targetDocumentType: 'RFQ',
      targetDocumentId: rfq.id,
      targetDocumentNumber: rfq.rfqNumber,
      details: `RFQ ${rfq.rfqNumber} status advanced to ${rfq.status} following award ${awardEntity.awardNumber}.`,
      previousState: prevStatus,
      newState: rfq.status,
      version: rfq.version,
      immutableHash: hash
    });

    return { success: true, award: awardEntity };
  }

  /**
   * Get single award with tenant isolation
   */
  static getAward(
    id: string,
    tenantId: string,
    awards: RFQAward[],
    companyId?: string
  ): RFQAward | undefined {
    return awards.find(
      a => a.id === id && a.tenantId === tenantId && (!companyId || a.companyId === companyId)
    );
  }

  /**
   * List awards for an RFQ
   */
  static listAwards(
    rfqId: string,
    tenantId: string,
    awards: RFQAward[]
  ): RFQAward[] {
    return awards.filter(a => a.rfqId === rfqId && a.tenantId === tenantId);
  }
}
