/**
 * Enterprise Tax Engine
 * Configurable Tax Engine supporting VAT, GST, Sales Tax, Withholding Tax, and Localization
 */

import { TaxRule } from '../types';

export interface TaxCalculationItem {
  id?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxCode?: string;
  taxRate?: number;
}

export interface TaxCalculationResult {
  subtotal: number;
  discountTotal: number;
  taxableTotal: number;
  taxTotal: number;
  withholdingTaxTotal: number;
  grandTotal: number;
  lineBreakdowns: {
    lineId: string;
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    taxAmount: number;
    taxRate: number;
    withholdingTaxAmount: number;
    total: number;
  }[];
}

export class TaxEngine {
  /**
   * Calculates comprehensive tax breakdowns for a set of document line items
   */
  static calculateDocumentTaxes(
    items: TaxCalculationItem[],
    taxRules: TaxRule[],
    defaultTaxCode: string = 'VAT15',
    withholdingRate: number = 0
  ): TaxCalculationResult {
    let subtotal = 0;
    let discountTotal = 0;
    let taxableTotal = 0;
    let taxTotal = 0;
    let withholdingTaxTotal = 0;

    const lineBreakdowns = items.map((item, index) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const discountPct = item.discountPercent || 0;
      const discountAmount = lineSubtotal * (discountPct / 100);
      const taxableAmount = lineSubtotal - discountAmount;

      // Find tax rule
      let taxRate = item.taxRate;
      if (taxRate === undefined) {
        const rule = taxRules.find(r => r.code === (item.taxCode || defaultTaxCode) && r.isActive);
        taxRate = rule ? rule.rate : 0.15;
      }

      const taxAmount = taxableAmount * taxRate;
      const lineWithholding = taxableAmount * withholdingRate;

      const lineTotal = taxableAmount + taxAmount - lineWithholding;

      subtotal += lineSubtotal;
      discountTotal += discountAmount;
      taxableTotal += taxableAmount;
      taxTotal += taxAmount;
      withholdingTaxTotal += lineWithholding;

      return {
        lineId: item.id || `line-${index + 1}`,
        subtotal: lineSubtotal,
        discountAmount,
        taxableAmount,
        taxAmount,
        taxRate,
        withholdingTaxAmount: lineWithholding,
        total: lineTotal
      };
    });

    const grandTotal = taxableTotal + taxTotal - withholdingTaxTotal;

    return {
      subtotal,
      discountTotal,
      taxableTotal,
      taxTotal,
      withholdingTaxTotal,
      grandTotal,
      lineBreakdowns
    };
  }
}
