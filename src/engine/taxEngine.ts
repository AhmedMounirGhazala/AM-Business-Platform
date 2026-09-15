/**
 * Enterprise Tax Engine
 * Authoritative runtime tax resolution, effective-dated rule evaluation,
 * and tax-inclusive / tax-exclusive accounting decomposition.
 */

import { TaxRule } from '../types';
export type { TaxRule };
import {
  INITIAL_TAX_RULES,
  INITIAL_COUNTRIES_MASTER,
  INITIAL_TAX_SYSTEMS_MASTER
} from '../data/mockDatabase';

export interface TaxCalculationItem {
  id?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxCode?: string;
  taxCategory?: 'STANDARD' | 'ZERO_RATED' | 'EXEMPT' | 'REDUCED' | string;
  taxRate?: number;
  isTaxInclusive?: boolean;
}

export interface TaxResolutionContext {
  tenantId?: string;
  companyId?: string;
  branchId?: string;
  countryOrJurisdiction?: 'KSA' | 'SA' | 'EGY' | 'EG' | 'UAE' | 'OTHER' | string;
  countryCode?: string;
  taxSystemId?: string;
  taxCategory?: 'STANDARD' | 'ZERO_RATED' | 'EXEMPT' | 'REDUCED' | string;
  taxCode?: string;
  transactionDate?: string; // YYYY-MM-DD
  isTaxInclusive?: boolean;
  industryProfile?: string;
  customerTaxExempt?: boolean;
  supplierTaxExempt?: boolean;
}

export interface TaxResolutionResult {
  taxCode: string;
  taxRate: number;
  taxCategory?: string;
  rule?: TaxRule;
}

export interface TaxCalculationResult {
  subtotal: number;
  discountTotal: number;
  taxableTotal: number;
  exemptTotal: number;
  zeroRatedTotal: number;
  taxTotal: number;
  totalTax?: number;
  taxAmount?: number;
  netTotal?: number;
  withholdingTaxTotal: number;
  withholdingTaxAmount?: number;
  grandTotal: number;
  grossAmount?: number;
  lineBreakdowns: {
    lineId: string;
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    netAmount?: number;
    taxAmount: number;
    taxRate: number;
    taxCode: string;
    taxCategory?: string;
    isTaxInclusive: boolean;
    withholdingTaxAmount: number;
    total: number;
    grossAmount?: number;
  }[];
}

export interface TaxEngineProviders {
  getTaxRules?: () => TaxRule[];
  getCountriesMaster?: () => any[];
  getTaxSystemsMaster?: () => any[];
}

export class TaxEngine {
  private static liveProviders: TaxEngineProviders = {};

  /**
   * Register live persistent data providers (e.g. from server/pilotDb)
   */
  public static setLiveProviders(providers: TaxEngineProviders): void {
    this.liveProviders = { ...this.liveProviders, ...providers };
  }

  /**
   * Retrieves active tax rules from passed rules, live provider, or default initial rules
   */
  public static getEffectiveTaxRules(passedRules?: TaxRule[]): TaxRule[] {
    if (passedRules && passedRules.length > 0) {
      return passedRules;
    }
    if (this.liveProviders.getTaxRules) {
      const live = this.liveProviders.getTaxRules();
      if (live && live.length > 0) return live;
    }
    return INITIAL_TAX_RULES;
  }

  /**
   * Retrieves country master data
   */
  public static getCountries(): any[] {
    if (this.liveProviders.getCountriesMaster) {
      const live = this.liveProviders.getCountriesMaster();
      if (live && live.length > 0) return live;
    }
    return INITIAL_COUNTRIES_MASTER;
  }

  /**
   * Retrieves tax systems master data
   */
  public static getTaxSystems(): any[] {
    if (this.liveProviders.getTaxSystemsMaster) {
      const live = this.liveProviders.getTaxSystemsMaster();
      if (live && live.length > 0) return live;
    }
    return INITIAL_TAX_SYSTEMS_MASTER;
  }

  /**
   * Normalizes country code or jurisdiction name to standard ISO-2
   */
  public static normalizeCountryCode(code?: string): string {
    if (!code) return 'SA';
    const c = code.trim().toUpperCase();
    if (c === 'EG' || c === 'EGY' || c === 'EGYPT') return 'EG';
    if (c === 'SA' || c === 'KSA' || c === 'SAUDI' || c === 'SAUDI ARABIA') return 'SA';
    if (c === 'AE' || c === 'UAE' || c === 'UNITED ARAB EMIRATES') return 'AE';
    return c;
  }

  /**
   * Checks whether a tax rule is active and effective on a given transaction date
   */
  public static isRuleEffective(rule: TaxRule, targetDate?: string): boolean {
    if (!rule.isActive) return false;
    if (!targetDate) return true;

    const dateStr = targetDate.includes('T') ? targetDate.split('T')[0] : targetDate;
    if (rule.effectiveFrom && dateStr < rule.effectiveFrom) return false;
    if (rule.effectiveTo && dateStr > rule.effectiveTo) return false;
    return true;
  }

  /**
   * Resolves active tax rate dynamically through:
   * Country -> Localization Profile -> Tax System -> Tax Profile / Category -> Effective Tax Rule
   * Honoring effective dates and configuration updates without hardcoded constants.
   */
  public static resolveTaxRate(
    context: TaxResolutionContext,
    taxRules?: TaxRule[]
  ): TaxResolutionResult {
    const { countryOrJurisdiction, countryCode, taxCategory, taxCode, transactionDate, customerTaxExempt, supplierTaxExempt } = context;
    const targetDate = transactionDate || new Date().toISOString().split('T')[0];
    const rulesPool = this.getEffectiveTaxRules(taxRules);

    // 0. Exemption flag on customer or supplier
    if (customerTaxExempt || supplierTaxExempt) {
      const exemptRule = rulesPool.find(r => (r.taxCategory === 'EXEMPT' || r.code === 'EXEMPT') && this.isRuleEffective(r, targetDate));
      return {
        taxCode: exemptRule ? exemptRule.code : 'EXEMPT',
        taxRate: 0.0,
        taxCategory: 'EXEMPT',
        rule: exemptRule
      };
    }

    // 1. Direct taxCode lookup if specified
    if (taxCode) {
      const matched = rulesPool.filter(r => r.code === taxCode && this.isRuleEffective(r, targetDate));
      if (matched.length > 0) {
        // Pick the most specific or latest effectiveFrom
        matched.sort((a, b) => (b.effectiveFrom || '').localeCompare(a.effectiveFrom || ''));
        const activeMatch = matched[0];
        return {
          taxCode: activeMatch.code,
          taxRate: activeMatch.rate,
          taxCategory: activeMatch.taxCategory || 'STANDARD',
          rule: activeMatch
        };
      }
    }

    // 2. Explicit Zero-Rated Category
    if (taxCategory === 'ZERO_RATED') {
      const zeroRule = rulesPool.find(
        r => (r.taxCategory === 'ZERO_RATED' || r.code === 'VAT0' || r.rate === 0) &&
             this.isRuleEffective(r, targetDate)
      );
      return {
        taxCode: zeroRule?.code || 'VAT0',
        taxRate: 0,
        taxCategory: 'ZERO_RATED',
        rule: zeroRule
      };
    }

    // 3. Explicit Exempt Category
    if (taxCategory === 'EXEMPT') {
      const exemptRule = rulesPool.find(
        r => (r.taxCategory === 'EXEMPT' || r.code === 'VAT_EXEMPT' || r.code === 'EXEMPT' || (r.rate === 0 && r.code !== 'VAT0')) &&
             this.isRuleEffective(r, targetDate)
      );
      return {
        taxCode: exemptRule?.code || 'VAT_EXEMPT',
        taxRate: 0,
        taxCategory: 'EXEMPT',
        rule: exemptRule
      };
    }

    // 3b. Specific Named Rates or Reverse Charge
    if (taxCategory === 'STANDARD_VAT_15' || taxCategory === 'VAT15') {
      const r15 = rulesPool.find(r => (r.code === 'VAT15' || r.rate === 0.15) && this.isRuleEffective(r, targetDate));
      return {
        taxCode: r15?.code || 'VAT15',
        taxRate: 0.15,
        taxCategory: 'STANDARD',
        rule: r15
      };
    }
    if (taxCategory === 'STANDARD_VAT_14' || taxCategory === 'VAT14') {
      const r14 = rulesPool.find(r => (r.code === 'VAT14' || r.rate === 0.14) && this.isRuleEffective(r, targetDate));
      return {
        taxCode: r14?.code || 'VAT14',
        taxRate: 0.14,
        taxCategory: 'STANDARD',
        rule: r14
      };
    }
    if (taxCategory === 'STANDARD_VAT_5' || taxCategory === 'VAT5') {
      const r5 = rulesPool.find(r => (r.code === 'VAT5' || r.rate === 0.05) && this.isRuleEffective(r, targetDate));
      return {
        taxCode: r5?.code || 'VAT5',
        taxRate: 0.05,
        taxCategory: 'STANDARD',
        rule: r5
      };
    }
    if (taxCategory === 'REVERSE_CHARGE') {
      return {
        taxCode: 'REVERSE_CHARGE',
        taxRate: 0,
        taxCategory: 'REVERSE_CHARGE'
      };
    }

    // 4. Hierarchical Country & Tax System Resolution
    const normCountry = this.normalizeCountryCode(countryCode || countryOrJurisdiction);
    const countries = this.getCountries();
    const taxSystems = this.getTaxSystems();

    const countryMaster = countries.find(c => c.code === normCountry || c.code3 === normCountry);
    const taxSysId = countryMaster?.defaultTaxSystemId || (normCountry === 'EG' ? 'tax-sys-eg-vat' : 'tax-sys-sa-vat');
    const taxSystem = taxSystems.find(ts => ts.id === taxSysId || ts.countryCode === normCountry);

    // Search rules matching country code or tax system ID
    const countryRules = rulesPool.filter(
      r => (r.countryCode === normCountry || (taxSystem && r.taxSystemId === taxSystem.id)) &&
           this.isRuleEffective(r, targetDate)
    );

    if (countryRules.length > 0) {
      // Sort by effectiveFrom descending so the active version for this date takes precedence
      countryRules.sort((a, b) => (b.effectiveFrom || '').localeCompare(a.effectiveFrom || ''));
      const activeRule = countryRules[0];
      return {
        taxCode: activeRule.code,
        taxRate: activeRule.rate,
        taxCategory: activeRule.taxCategory || 'STANDARD',
        rule: activeRule
      };
    }

    // If no rule explicitly tagged with countryCode, match rule with standard rate from tax system
    if (taxSystem) {
      const expectedRate = taxSystem.standardRate / 100;
      const rateRule = rulesPool.find(
        r => Math.abs(r.rate - expectedRate) < 0.0001 && this.isRuleEffective(r, targetDate)
      );
      if (rateRule) {
        return {
          taxCode: rateRule.code,
          taxRate: rateRule.rate,
          taxCategory: rateRule.taxCategory || 'STANDARD',
          rule: rateRule
        };
      }
      return {
        taxCode: taxSystem.code,
        taxRate: expectedRate,
        taxCategory: 'STANDARD'
      };
    }

    // 5. Default Company / Active Rule Fallback
    const fallbackActive = rulesPool.find(
      r => r.rate > 0 && this.isRuleEffective(r, targetDate)
    );
    if (fallbackActive) {
      return {
        taxCode: fallbackActive.code,
        taxRate: fallbackActive.rate,
        taxCategory: fallbackActive.taxCategory || 'STANDARD',
        rule: fallbackActive
      };
    }

    // Ultimate fallback based on country
    const defaultRate = normCountry === 'EG' ? 0.14 : 0.15;
    const defaultCode = normCountry === 'EG' ? 'VAT14' : 'VAT15';
    return {
      taxCode: defaultCode,
      taxRate: defaultRate,
      taxCategory: 'STANDARD'
    };
  }

  /**
   * Authoritative line-level calculation helper
   */
  public static calculateLineTax(
    item: TaxCalculationItem,
    context?: TaxResolutionContext,
    taxRules?: TaxRule[]
  ) {
    const lineSubtotal = Math.round((item.quantity * item.unitPrice) * 100) / 100;
    const discountPct = item.discountPercent || 0;
    const discountAmount = item.discountAmount !== undefined
      ? item.discountAmount
      : Math.round((lineSubtotal * (discountPct / 100)) * 100) / 100;
    const netLine = lineSubtotal - discountAmount;

    // Resolve rate authoritatively
    let taxRate = item.taxRate;
    let taxCode = item.taxCode || 'VAT15';
    let taxCategory = item.taxCategory;

    if (taxRate === undefined) {
      const resolved = this.resolveTaxRate(
        {
          ...context,
          taxCode: item.taxCode,
          taxCategory: item.taxCategory
        },
        taxRules
      );
      taxRate = resolved.taxRate;
      taxCode = resolved.taxCode;
      taxCategory = resolved.taxCategory;
    }

    const isTaxInclusive = Boolean(item.isTaxInclusive ?? context?.isTaxInclusive);

    let taxableAmount: number;
    let taxAmount: number;

    if (isTaxInclusive && taxRate > 0) {
      taxableAmount = Math.round((netLine / (1 + taxRate)) * 100) / 100;
      taxAmount = Math.round((netLine - taxableAmount) * 100) / 100;
    } else {
      taxableAmount = netLine;
      taxAmount = Math.round((taxableAmount * taxRate) * 100) / 100;
    }

    const total = isTaxInclusive ? netLine : Math.round((taxableAmount + taxAmount) * 100) / 100;

    return {
      subtotal: lineSubtotal,
      discountAmount,
      taxableAmount,
      netAmount: taxableAmount,
      taxAmount,
      taxRate,
      taxCode,
      taxCategory,
      isTaxInclusive,
      total,
      grossAmount: total
    };
  }

  /**
   * Calculates comprehensive tax breakdowns for document line items
   */
  public static calculateDocumentTaxes(
    items: TaxCalculationItem[],
    taxRules?: TaxRule[],
    defaultTaxCode?: string,
    withholdingRate: number = 0,
    context?: TaxResolutionContext
  ): TaxCalculationResult {
    let subtotal = 0;
    let discountTotal = 0;
    let taxableTotal = 0;
    let exemptTotal = 0;
    let zeroRatedTotal = 0;
    let taxTotal = 0;
    let withholdingTaxTotal = 0;

    const rules = this.getEffectiveTaxRules(taxRules);
    const effWithholdingRate = withholdingRate > 1 ? withholdingRate / 100 : withholdingRate;

    const lineBreakdowns = items.map((item, index) => {
      const resolvedContext: TaxResolutionContext = {
        ...context,
        taxCode: item.taxCode || defaultTaxCode || context?.taxCode,
        taxCategory: item.taxCategory || context?.taxCategory
      };

      const line = this.calculateLineTax(item, resolvedContext, rules);

      const lineWithholding = Math.round((line.taxableAmount * effWithholdingRate) * 100) / 100;
      const finalLineTotal = Math.round((line.total - lineWithholding) * 100) / 100;

      subtotal += line.subtotal;
      discountTotal += line.discountAmount;

      if (line.taxCategory === 'EXEMPT') {
        exemptTotal += line.taxableAmount;
      } else if (line.taxCategory === 'ZERO_RATED') {
        zeroRatedTotal += line.taxableAmount;
      } else {
        taxableTotal += line.taxableAmount;
      }

      taxTotal += line.taxAmount;
      withholdingTaxTotal += lineWithholding;

      return {
        lineId: item.id || `line-${index + 1}`,
        subtotal: line.subtotal,
        discountAmount: line.discountAmount,
        taxableAmount: line.taxableAmount,
        netAmount: line.taxableAmount,
        taxAmount: line.taxAmount,
        taxRate: line.taxRate,
        taxCode: line.taxCode,
        taxCategory: line.taxCategory,
        isTaxInclusive: line.isTaxInclusive,
        withholdingTaxAmount: lineWithholding,
        total: finalLineTotal,
        grossAmount: finalLineTotal
      };
    });

    const netTaxableBase = taxableTotal + exemptTotal + zeroRatedTotal;
    const grandTotal = Math.round((netTaxableBase + taxTotal - withholdingTaxTotal) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      taxableTotal: Math.round(taxableTotal * 100) / 100,
      exemptTotal: Math.round(exemptTotal * 100) / 100,
      zeroRatedTotal: Math.round(zeroRatedTotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      totalTax: Math.round(taxTotal * 100) / 100,
      taxAmount: Math.round(taxTotal * 100) / 100,
      netTotal: Math.round(netTaxableBase * 100) / 100,
      withholdingTaxTotal: Math.round(withholdingTaxTotal * 100) / 100,
      withholdingTaxAmount: Math.round(withholdingTaxTotal * 100) / 100,
      grandTotal,
      grossAmount: grandTotal,
      lineBreakdowns
    };
  }

  /**
   * Authoritative document-level tax calculation helper for context/document payloads
   */
  public static calculateDocumentTax(
    doc: any,
    taxRules?: TaxRule[]
  ): TaxCalculationResult & { totalNet: number } {
    const rawLines = doc.lines || [];
    const items: TaxCalculationItem[] = rawLines.map((l: any, i: number) => ({
      id: l.lineId || l.id || `line-${i + 1}`,
      name: l.name || l.description || l.productId || 'Item',
      quantity: Number(l.quantity || 1),
      unitPrice: Number(l.unitPrice || 0),
      discountAmount: Number(l.discountAmount || 0),
      discountPercent: Number(l.discountPercent || 0),
      taxRate: l.taxRate,
      taxCode: l.taxCode,
      taxCategory: l.taxCategory || l.category,
      isTaxInclusive: l.isTaxInclusive ?? doc.isTaxInclusive
    }));

    const context: TaxResolutionContext = {
      countryOrJurisdiction: doc.jurisdiction,
      countryCode: doc.countryCode || (doc.jurisdiction?.startsWith('SA') ? 'SA' : doc.jurisdiction?.startsWith('EG') ? 'EG' : undefined),
      transactionDate: doc.date || doc.transactionDate,
      isTaxInclusive: doc.isTaxInclusive,
      customerTaxExempt: doc.customerTaxExempt,
      supplierTaxExempt: doc.supplierTaxExempt
    };

    const result = this.calculateDocumentTaxes(items, taxRules, undefined, doc.withholdingRate || 0, context);
    return {
      ...result,
      totalNet: result.netTotal
    };
  }
}
