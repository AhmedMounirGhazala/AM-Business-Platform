/**
 * AM ERP — Authoritative Enterprise Pricing Engine
 * Architecture Baseline: v2.8 (Phase 3.2A)
 * 
 * Official 4-Tier Pricing Resolution Hierarchy:
 * 1. CONTRACT (Special Customer Agreement)
 * 2. CUSTOMER_TIER (Customer Group / Segment Price List)
 * 3. PROMOTION (Active Promotional Price List)
 * 4. BASE_PRICE (Product Master Standard Price)
 * 
 * Enforces explainable calculations, currency conversions via CurrencyEngine,
 * quantity break tiers, and deterministic short-circuit evaluation.
 */

import {
  PriceListHeader,
  PriceListLine,
  ContractPriceRule,
  PriceCalculationParams,
  ExplainablePricingResult,
  PricingPriorityTier,
  PricingPriorityName
} from '../types';
import { CurrencyEngine } from './currencyEngine';

export class PricingEngine {
  // Master Store of Price Lists
  private static priceLists: PriceListHeader[] = [
    {
      id: 'pl-retail-std',
      tenantId: 'ten-001',
      code: 'PL_RETAIL_STD',
      name: 'Standard Retail Price List (SAR)',
      nameAr: 'قائمة أسعار التجزئة القياسية (ريال)',
      type: 'STANDARD_SALES',
      currency: 'SAR',
      priority: 10,
      effectiveFrom: '2026-01-01T00:00:00Z',
      isDefault: true,
      active: true,
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'pl-wholesale-tier1',
      tenantId: 'ten-001',
      code: 'PL_WHOLESALE_T1',
      name: 'Key Account Wholesale Tier 1 (15% Off)',
      nameAr: 'قائمة كبار العملاء جملة فئة 1 (خصم 15%)',
      type: 'WHOLESALE',
      currency: 'SAR',
      priority: 50,
      customerGroupScope: ['WHOLESALE', 'DISTRIBUTOR', 'KEY_ACCOUNT'],
      effectiveFrom: '2026-01-01T00:00:00Z',
      isDefault: false,
      active: true,
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'pl-summer-promo',
      tenantId: 'ten-001',
      code: 'PL_PROMO_SUMMER',
      name: 'Summer Flash Promotion 2026',
      nameAr: 'عرض الصيف الترويجي السريع 2026',
      type: 'PROMOTIONAL',
      currency: 'SAR',
      priority: 30,
      effectiveFrom: '2026-06-01T00:00:00Z',
      effectiveTo: '2026-08-31T23:59:59Z',
      isDefault: false,
      active: true,
      createdAt: '2026-05-15T00:00:00Z'
    }
  ];

  // Master Store of Price List Lines (with Quantity Breaks)
  private static priceListLines: PriceListLine[] = [
    // Standard Retail
    { id: 'pll-001', tenantId: 'ten-001', priceListId: 'pl-retail-std', itemSku: 'HW-SRV-01', uom: 'PCS', minQuantity: 1, unitPrice: 26000, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'pll-002', tenantId: 'ten-001', priceListId: 'pl-retail-std', itemSku: 'SW-ERP-USR', uom: 'LIC', minQuantity: 1, unitPrice: 12000, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'pll-003', tenantId: 'ten-001', priceListId: 'pl-retail-std', itemSku: 'APP-POLO-01', uom: 'PCS', minQuantity: 1, unitPrice: 160, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'pll-004', tenantId: 'ten-001', priceListId: 'pl-retail-std', itemSku: 'MOB-PRO-5G', uom: 'PCS', minQuantity: 1, unitPrice: 4200, active: true, createdAt: '2026-01-01T00:00:00Z' },

    // Wholesale Tier 1 (with quantity breaks)
    { id: 'pll-010', tenantId: 'ten-001', priceListId: 'pl-wholesale-tier1', itemSku: 'HW-SRV-01', uom: 'PCS', minQuantity: 1, unitPrice: 23500, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'pll-011', tenantId: 'ten-001', priceListId: 'pl-wholesale-tier1', itemSku: 'HW-SRV-01', uom: 'PCS', minQuantity: 5, unitPrice: 22000, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'pll-012', tenantId: 'ten-001', priceListId: 'pl-wholesale-tier1', itemSku: 'APP-POLO-01', uom: 'PCS', minQuantity: 20, unitPrice: 110, active: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'pll-013', tenantId: 'ten-001', priceListId: 'pl-wholesale-tier1', itemSku: 'APP-POLO-01', uom: 'PCS', minQuantity: 100, unitPrice: 95, active: true, createdAt: '2026-01-01T00:00:00Z' },

    // Summer Promo Lines
    { id: 'pll-020', tenantId: 'ten-001', priceListId: 'pl-summer-promo', itemSku: 'APP-POLO-01', uom: 'PCS', minQuantity: 1, unitPrice: 125, active: true, createdAt: '2026-05-15T00:00:00Z' },
    { id: 'pll-021', tenantId: 'ten-001', priceListId: 'pl-summer-promo', itemSku: 'MOB-PRO-5G', uom: 'PCS', minQuantity: 1, unitPrice: 3850, active: true, createdAt: '2026-05-15T00:00:00Z' }
  ];

  // Master Store of Special Customer Contracts (Priority 1)
  private static contractRules: ContractPriceRule[] = [
    {
      id: 'cpr-aramco-srv',
      tenantId: 'ten-001',
      customerId: 'cust-001',
      customerName: 'Saudi Aramco Technology Ventures',
      itemSku: 'HW-SRV-01',
      contractNumber: 'CNT-ARAMCO-2026-01',
      contractPrice: 21000,
      currency: 'SAR',
      uom: 'PCS',
      minQuantity: 1,
      maxQuantity: 100,
      effectiveFrom: '2026-01-01T00:00:00Z',
      effectiveTo: '2026-12-31T23:59:59Z',
      active: true,
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'cpr-aramco-lic',
      tenantId: 'ten-001',
      customerId: 'cust-001',
      customerName: 'Saudi Aramco Technology Ventures',
      itemSku: 'SW-ERP-USR',
      contractNumber: 'CNT-ARAMCO-2026-02',
      contractPrice: 8500,
      currency: 'SAR',
      uom: 'LIC',
      minQuantity: 10,
      effectiveFrom: '2026-01-01T00:00:00Z',
      effectiveTo: '2026-12-31T23:59:59Z',
      active: true,
      createdAt: '2026-01-01T00:00:00Z'
    }
  ];

  // ---------- MANAGEMENT METHODS ----------
  public static getPriceLists(tenantId: string): PriceListHeader[] {
    return this.priceLists.filter(p => p.tenantId === tenantId && p.active);
  }

  public static getPriceListLines(priceListId: string, tenantId: string): PriceListLine[] {
    return this.priceListLines.filter(l => l.tenantId === tenantId && l.priceListId === priceListId && l.active);
  }

  public static getContractRules(tenantId: string): ContractPriceRule[] {
    return this.contractRules.filter(r => r.tenantId === tenantId && r.active);
  }

  public static createPriceList(header: Omit<PriceListHeader, 'id' | 'createdAt'>): PriceListHeader {
    const newHeader: PriceListHeader = {
      ...header,
      id: `pl-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.priceLists.push(newHeader);
    return newHeader;
  }

  public static addPriceListLine(line: Omit<PriceListLine, 'id' | 'createdAt'>): PriceListLine {
    if (line.unitPrice < 0) {
      throw new Error('Price list line unit price cannot be negative.');
    }
    const newLine: PriceListLine = {
      ...line,
      id: `pll-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.priceListLines.push(newLine);
    return newLine;
  }

  public static addContractRule(rule: any): any {
    const price = rule.contractedPrice ?? rule.contractPrice ?? 0;
    if (price < 0) {
      throw new Error('Contract price cannot be negative.');
    }
    const newRule: any = {
      ...rule,
      contractPrice: price,
      contractedPrice: price,
      id: rule.id || `cpr-${Date.now()}`,
      createdAt: rule.createdAt || new Date().toISOString()
    };
    this.contractRules.push(newRule);
    return newRule;
  }

  // ---------- AUTHORITATIVE PRICING CALCULATION ----------
  /**
   * Deterministic 4-Tier Pricing Resolution Engine
   */
  public static calculatePrice(params: PriceCalculationParams): ExplainablePricingResult {
    const tenantId = params.tenantId || 'ten-001';
    const txDate = params.transactionDate || new Date().toISOString();
    const qty = params.quantity > 0 ? params.quantity : 1;
    const itemSku = params.itemSku;
    const variantSku = params.variantSku;
    const targetCurrency = params.targetCurrency || 'SAR';
    const auditTrail: string[] = [];

    auditTrail.push(`[Step 0] Initializing price resolution for Item '${itemSku}' (Qty: ${qty}, Customer: '${params.customerId || 'ANONYMOUS'}', Group: '${params.customerGroup || 'STANDARD'}', Currency: '${targetCurrency}').`);

    let selectedPriority: PricingPriorityTier = 4;
    let selectedPriorityName: PricingPriorityName = 'BASE_PRICE';
    let baseUnitPrice = params.baseUnitPrice || 100;
    let effectiveUnitPrice = baseUnitPrice;
    let sourceRuleId = 'BASE_FALLBACK';
    let sourcePriceListName = 'Product Master Standard Price';
    let quantityBreakApplied: number | undefined;
    let appliedDiscountPercent = 0;
    let appliedDiscountAmount = 0;

    // -------------------------------------------------------------
    // PRIORITY 1: SPECIAL CUSTOMER CONTRACT (Absolute Precedence)
    // -------------------------------------------------------------
    if (params.customerId) {
      auditTrail.push(`[Step 1] Checking Priority 1 (Special Customer Contract Rules)...`);
      const matchedContract = this.contractRules.find(r => 
        r.tenantId === tenantId &&
        r.active &&
        r.customerId === params.customerId &&
        (r.itemSku === itemSku || (variantSku && r.variantSku === variantSku)) &&
        r.effectiveFrom <= txDate &&
        r.effectiveTo >= txDate &&
        qty >= r.minQuantity &&
        (!r.maxQuantity || qty <= r.maxQuantity)
      );

      if (matchedContract) {
        selectedPriority = 1;
        selectedPriorityName = 'CONTRACT';
        effectiveUnitPrice = matchedContract.contractPrice;
        sourceRuleId = matchedContract.contractNumber;
        sourcePriceListName = `Contract: ${matchedContract.contractNumber} (${matchedContract.customerName || matchedContract.customerId})`;
        auditTrail.push(`[MATCH Priority 1] Contract Price applied: ${effectiveUnitPrice} ${matchedContract.currency} via Contract '${matchedContract.contractNumber}'. Short-circuiting resolution.`);
      } else {
        auditTrail.push(`[Step 1 PASS] No active contract rule matched for Customer '${params.customerId}'.`);
      }
    }

    // -------------------------------------------------------------
    // PRIORITY 2: CUSTOMER TIER PRICE LIST (Wholesale / Key Account)
    // -------------------------------------------------------------
    if (selectedPriority > 2 && (params.customerGroup || params.priceListId)) {
      auditTrail.push(`[Step 2] Checking Priority 2 (Customer Tier Price Lists)...`);

      // Find applicable Customer Tier price lists
      const tierLists = this.priceLists.filter(pl => 
        pl.tenantId === tenantId &&
        pl.active &&
        (pl.type === 'WHOLESALE' || pl.type === 'KEY_ACCOUNT' || pl.type === 'STANDARD_SALES') &&
        pl.effectiveFrom <= txDate &&
        (!pl.effectiveTo || pl.effectiveTo >= txDate) &&
        (!pl.companyScope || pl.companyScope.length === 0 || (params.companyId && pl.companyScope.includes(params.companyId))) &&
        (!pl.customerGroupScope || pl.customerGroupScope.length === 0 || (params.customerGroup && pl.customerGroupScope.includes(params.customerGroup)))
      ).sort((a, b) => b.priority - a.priority);

      for (const pl of tierLists) {
        // Look for matching line with quantity breaks (highest minQuantity <= qty)
        const matchingLines = this.priceListLines.filter(l => 
          l.tenantId === tenantId &&
          l.priceListId === pl.id &&
          l.active &&
          l.itemSku === itemSku &&
          (!l.variantSku || l.variantSku === variantSku) &&
          qty >= l.minQuantity
        ).sort((a, b) => b.minQuantity - a.minQuantity);

        if (matchingLines.length > 0) {
          const bestLine = matchingLines[0];
          selectedPriority = 2;
          selectedPriorityName = 'CUSTOMER_TIER';
          effectiveUnitPrice = bestLine.unitPrice;
          sourceRuleId = bestLine.id;
          sourcePriceListName = pl.name;
          quantityBreakApplied = bestLine.minQuantity;
          auditTrail.push(`[MATCH Priority 2] Tier Price applied: ${effectiveUnitPrice} ${pl.currency} via Price List '${pl.name}' (Tier Qty: >= ${bestLine.minQuantity}).`);
          break;
        }
      }

      if (selectedPriority > 2) {
        auditTrail.push(`[Step 2 PASS] No qualifying customer tier price lines matched.`);
      }
    }

    // -------------------------------------------------------------
    // PRIORITY 3: PROMOTIONAL PRICE RULE (Campaigns)
    // -------------------------------------------------------------
    if (selectedPriority > 3) {
      auditTrail.push(`[Step 3] Checking Priority 3 (Active Promotional Price Lists)...`);

      const promoLists = this.priceLists.filter(pl => 
        pl.tenantId === tenantId &&
        pl.active &&
        pl.type === 'PROMOTIONAL' &&
        pl.effectiveFrom <= txDate &&
        (!pl.effectiveTo || pl.effectiveTo >= txDate)
      ).sort((a, b) => b.priority - a.priority);

      for (const promo of promoLists) {
        const promoLine = this.priceListLines.find(l => 
          l.tenantId === tenantId &&
          l.priceListId === promo.id &&
          l.active &&
          l.itemSku === itemSku &&
          qty >= l.minQuantity
        );

        if (promoLine) {
          selectedPriority = 3;
          selectedPriorityName = 'PROMOTION';
          effectiveUnitPrice = promoLine.unitPrice;
          sourceRuleId = promoLine.id;
          sourcePriceListName = promo.name;
          quantityBreakApplied = promoLine.minQuantity;
          auditTrail.push(`[MATCH Priority 3] Promotional Price applied: ${effectiveUnitPrice} ${promo.currency} via Promotion '${promo.name}'.`);
          break;
        }
      }

      if (selectedPriority > 3) {
        auditTrail.push(`[Step 3 PASS] No active promotional campaigns matched item.`);
      }
    }

    // -------------------------------------------------------------
    // PRIORITY 4: STANDARD BASE SELLING PRICE (Fallback)
    // -------------------------------------------------------------
    if (selectedPriority === 4) {
      auditTrail.push(`[Step 4 Fallback] Using Priority 4 (Product Master Base Price): ${baseUnitPrice} SAR.`);
      effectiveUnitPrice = baseUnitPrice;
      sourceRuleId = 'PROD_BASE_PRICE';
      sourcePriceListName = 'Product Master Standard Selling Price';
    }

    // -------------------------------------------------------------
    // CURRENCY CONVERSION INTEGRATION
    // -------------------------------------------------------------
    let exchangeRateUsed = 1.0;
    let finalConvertedUnitPrice = effectiveUnitPrice;
    const sourceCurrency = 'SAR'; // Canonical base pricing currency

    if (targetCurrency !== sourceCurrency) {
      try {
        const conv = CurrencyEngine.convertAmount(effectiveUnitPrice, sourceCurrency, targetCurrency, []);
        finalConvertedUnitPrice = conv.convertedAmount;
        exchangeRateUsed = conv.rate;
        auditTrail.push(`[Step 5 Currency] Converted from ${sourceCurrency} to ${targetCurrency} using rate ${exchangeRateUsed} => ${finalConvertedUnitPrice} ${targetCurrency}.`);
      } catch (err: any) {
        auditTrail.push(`[Step 5 Currency Warning] Currency conversion failed (${err.message}). Defaulting to SAR rate 1.0.`);
      }
    }

    // Discounts relative to base
    if (baseUnitPrice > 0 && effectiveUnitPrice < baseUnitPrice) {
      appliedDiscountAmount = Number((baseUnitPrice - effectiveUnitPrice).toFixed(2));
      appliedDiscountPercent = Number((((baseUnitPrice - effectiveUnitPrice) / baseUnitPrice) * 100).toFixed(2));
    }

    const lineTotal = Number((finalConvertedUnitPrice * qty).toFixed(2));

    auditTrail.push(`[Summary] Final Calculated Unit Price: ${finalConvertedUnitPrice} ${targetCurrency} (Line Total: ${lineTotal} ${targetCurrency}) with Priority ${selectedPriority} [${selectedPriorityName}].`);

    return {
      baseUnitPrice,
      finalUnitPrice: finalConvertedUnitPrice,
      appliedDiscountPercent,
      appliedDiscountAmount,
      appliedPriority: selectedPriority,
      appliedPriorityName: selectedPriorityName,
      sourceRuleId,
      sourcePriceListName,
      currency: targetCurrency,
      exchangeRateUsed,
      baseCurrencyPrice: effectiveUnitPrice,
      quantityBreakApplied,
      uomUsed: params.uom || 'PCS',
      lineTotal,
      auditTrail,
      calculatedAt: new Date().toISOString()
    };
  }
}
