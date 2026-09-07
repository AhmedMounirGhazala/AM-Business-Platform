/**
 * AM Enterprise ERP - Quotation Comparison Engine (Phase 3.2B-02)
 * Enterprise Standard Aligned with SAP S/4HANA (Sourcing Cockpit) & Oracle SCM Evaluation Matrix
 */

import {
  RequestForQuotation,
  RFQLine,
  SupplierQuotation,
  SupplierQuotationLine,
  RFQComparisonReport,
  SupplierQuotationScore,
  PurchaseAuditRecord
} from '../types/procurement';
import { WorkflowEngine } from './workflowEngine';
import { RFQUserContext } from './rfqEngine';

export interface ComparisonWeights {
  priceWeight: number;      // e.g. 0.50 (50%)
  leadTimeWeight: number;   // e.g. 0.20 (20%)
  qualityWeight: number;    // e.g. 0.20 (20%)
  commercialWeight: number; // e.g. 0.10 (10%)
}

export const DEFAULT_EVALUATION_WEIGHTS: ComparisonWeights = {
  priceWeight: 0.50,
  leadTimeWeight: 0.20,
  qualityWeight: 0.20,
  commercialWeight: 0.10
};

export class QuotationComparisonEngine {
  /**
   * Evaluate quotations and build comprehensive comparison matrix report
   */
  static generateComparisonMatrix(
    rfqId: string,
    rfqs: RequestForQuotation[],
    quotations: SupplierQuotation[],
    auditLogs: PurchaseAuditRecord[],
    context: RFQUserContext,
    weights: ComparisonWeights = DEFAULT_EVALUATION_WEIGHTS
  ): { success: boolean; report?: RFQComparisonReport; error?: string } {
    const rfq = rfqs.find(r => r.id === rfqId && r.tenantId === context.tenantId);
    if (!rfq) return { success: false, error: 'RFQ not found.' };

    const activeQuotes = quotations.filter(
      q => q.rfqId === rfq.id && q.tenantId === context.tenantId && q.status !== 'REVISED' && q.status !== 'REJECTED'
    );

    if (activeQuotes.length === 0) {
      return { success: false, error: `No active quotations found for RFQ ${rfq.rfqNumber}.` };
    }

    const rfqLines = rfq.items || rfq.lines || [];
    const rfqCurrency = rfq.currency || 'SAR';

    // Normalize weights to sum to 1.0
    const totalWeight = weights.priceWeight + weights.leadTimeWeight + weights.qualityWeight + weights.commercialWeight;
    const normWeights: ComparisonWeights = totalWeight > 0 ? {
      priceWeight: weights.priceWeight / totalWeight,
      leadTimeWeight: weights.leadTimeWeight / totalWeight,
      qualityWeight: weights.qualityWeight / totalWeight,
      commercialWeight: weights.commercialWeight / totalWeight
    } : DEFAULT_EVALUATION_WEIGHTS;

    // Minimums across all quotes for scoring baselines
    const allTotalGrossBase = activeQuotes.map(q => q.totalGrossAmountBaseCurrency || q.totalAmount || 1);
    const minTotalGross = Math.min(...allTotalGrossBase);

    const allLeadTimes = activeQuotes.map(q => q.deliveryLeadTimeDays || q.leadTimeDays || 14);
    const minLeadTime = Math.min(...allLeadTimes.filter(lt => lt > 0), 7);

    // Build Line Offers
    const lineReports = rfqLines.map(rl => {
      const offers = activeQuotes.map(quote => {
        const qLines = quote.items || quote.lines || [];
        const matchingQLine = qLines.find(ql => ql.rfqLineId === rl.id || ql.itemSku === rl.itemSku);

        const quotedQty = matchingQLine ? matchingQLine.quotedQuantity : 0;
        const quotedUOM = matchingQLine ? matchingQLine.quotedUOM : rl.targetUOM;
        const unitPrice = matchingQLine ? matchingQLine.unitPrice : 0;
        const normUnitPrice = matchingQLine ? matchingQLine.normalizedUnitPrice : 0;
        const discPercent = matchingQLine ? matchingQLine.discountPercent : 0;
        const taxRate = matchingQLine ? matchingQLine.taxRate : 15;
        const lineTotal = matchingQLine ? matchingQLine.lineTotal : 0;
        const lineTotalBase = matchingQLine ? matchingQLine.lineTotalBaseCurrency : 0;
        const leadTime = matchingQLine ? (matchingQLine.deliveryLeadTimeDays || quote.deliveryLeadTimeDays || 14) : 14;
        const score = matchingQLine?.overallScore || quote.overallScore || 85;

        return {
          quotationId: quote.id,
          quotationNumber: quote.quotationNumber,
          supplierId: quote.supplierId || quote.vendorId || '',
          supplierName: quote.supplierName || quote.vendorName || '',
          quotedQuantity: quotedQty,
          quotedUOM: quotedUOM || 'PCS',
          unitPrice,
          normalizedUnitPrice: normUnitPrice,
          discountPercent: discPercent,
          taxRate,
          lineTotal,
          lineTotalBaseCurrency: lineTotalBase,
          leadTimeDays: leadTime,
          score,
          isAwarded: matchingQLine?.isAwarded || false
        };
      });

      return {
        rfqLineId: rl.id,
        itemSku: rl.itemSku,
        itemName: rl.itemName,
        targetQuantity: rl.targetQuantity || rl.requestedQty || 1,
        targetUOM: rl.targetUOM || rl.uom || 'PCS',
        baseQuantity: rl.baseQuantity || rl.targetQuantity || 1,
        baseUOM: rl.baseUOM || 'PCS',
        offers
      };
    });

    // Score and Rank Total Quotations
    const scoredQuotations = activeQuotes.map(quote => {
      const grossBase = quote.totalGrossAmountBaseCurrency || quote.totalAmount || 1;
      const leadTime = quote.deliveryLeadTimeDays || quote.leadTimeDays || 14;

      // Price Score: (Min Total / Quote Total) * 100
      const priceScore = grossBase > 0 ? Math.min(100, Math.max(10, (minTotalGross / grossBase) * 100)) : 100;

      // Lead Time Score: (Min Lead Time / Quote Lead Time) * 100
      const leadTimeScore = leadTime > 0 ? Math.min(100, Math.max(10, (minLeadTime / leadTime) * 100)) : 100;

      // Quality Score (from average line technical scores or default 90)
      const qLines = quote.items || quote.lines || [];
      const qualityScore = qLines.length > 0
        ? qLines.reduce((s, l) => s + (l.technicalScore || 90), 0) / qLines.length
        : (quote.overallScore || 90);

      // Commercial Score (from average line commercial scores or default 90)
      const commercialScore = qLines.length > 0
        ? qLines.reduce((s, l) => s + (l.commercialScore || 90), 0) / qLines.length
        : 90;

      const compositeScore = Number((
        (priceScore * normWeights.priceWeight) +
        (leadTimeScore * normWeights.leadTimeWeight) +
        (qualityScore * normWeights.qualityWeight) +
        (commercialScore * normWeights.commercialWeight)
      ).toFixed(2));

      const scoringBreakdown: Record<string, string> = {
        price: `${priceScore.toFixed(1)}/100 (Weight: ${(normWeights.priceWeight * 100).toFixed(0)}%)`,
        leadTime: `${leadTimeScore.toFixed(1)}/100 (Weight: ${(normWeights.leadTimeWeight * 100).toFixed(0)}%)`,
        quality: `${qualityScore.toFixed(1)}/100 (Weight: ${(normWeights.qualityWeight * 100).toFixed(0)}%)`,
        commercial: `${commercialScore.toFixed(1)}/100 (Weight: ${(normWeights.commercialWeight * 100).toFixed(0)}%)`
      };

      const evaluationScore: SupplierQuotationScore = {
        priceScore: Number(priceScore.toFixed(2)),
        leadTimeScore: Number(leadTimeScore.toFixed(2)),
        qualityScore: Number(qualityScore.toFixed(2)),
        commercialScore: Number(commercialScore.toFixed(2)),
        compositeScore,
        ranking: 0,
        scoringBreakdown
      };

      quote.evaluationScore = evaluationScore;
      quote.overallScore = compositeScore;

      return {
        quote,
        evaluationScore,
        compositeScore,
        grossBase,
        leadTime
      };
    });

    // Rank from highest composite score to lowest
    scoredQuotations.sort((a, b) => b.compositeScore - a.compositeScore);

    scoredQuotations.forEach((item, idx) => {
      item.evaluationScore.ranking = idx + 1;
      item.quote.evaluationScore!.ranking = idx + 1;
    });

    const totalComparisons = scoredQuotations.map(item => {
      const q = item.quote;
      return {
        quotationId: q.id,
        quotationNumber: q.quotationNumber,
        supplierId: q.supplierId || q.vendorId || '',
        supplierName: q.supplierName || q.vendorName || '',
        totalGrossAmount: q.totalGrossAmount || q.totalAmount || 0,
        totalGrossAmountBaseCurrency: q.totalGrossAmountBaseCurrency || q.totalAmount || 0,
        currency: q.currency,
        leadTimeDays: item.leadTime,
        compositeScore: item.compositeScore,
        rank: item.evaluationScore.ranking,
        explanation: `Rank #${item.evaluationScore.ranking} with composite score of ${item.compositeScore}/100. Price: ${q.totalGrossAmountBaseCurrency.toLocaleString()} ${rfqCurrency}, Lead Time: ${item.leadTime} days.`,
        scoringBreakdown: item.evaluationScore.scoringBreakdown
      };
    });

    const report: RFQComparisonReport = {
      rfqId: rfq.id,
      rfqNumber: rfq.rfqNumber,
      generatedAt: new Date().toISOString(),
      currency: rfqCurrency,
      lines: lineReports,
      totalComparisons
    };

    // Advance RFQ status to EVALUATED
    if (rfq.status === 'PUBLISHED' || rfq.status === 'ISSUED' || rfq.status === 'RESPONSES_RECEIVED') {
      rfq.status = 'EVALUATED';
      rfq.version = (rfq.version || 1) + 1;
      rfq.updatedAt = new Date().toISOString();
    }

    const timestamp = new Date().toISOString();
    const hash = WorkflowEngine.generateDigitalSignature(rfq.id, report.rfqNumber, context.userId, timestamp);

    auditLogs.unshift({
      id: `aud-eval-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: rfq.tenantId,
      companyId: rfq.companyId,
      branchId: rfq.branchId,
      actionType: 'QUOTATION_EVALUATED',
      performedBy: context.userId,
      performedByName: context.userName,
      performedAt: timestamp,
      targetDocumentType: 'RFQ',
      targetDocumentId: rfq.id,
      targetDocumentNumber: rfq.rfqNumber,
      details: `Comparison matrix generated for RFQ ${rfq.rfqNumber} evaluating ${activeQuotes.length} quotations. Best ranked supplier: ${totalComparisons[0]?.supplierName} (Score: ${totalComparisons[0]?.compositeScore}).`,
      previousState: rfq.status,
      newState: 'EVALUATED',
      version: rfq.version,
      immutableHash: hash
    });

    return { success: true, report };
  }
}
