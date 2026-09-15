/**
 * AM Business Platform — P0-06 Fashion Retail Engine
 * Runtime service for Profile 04 (Women's Clothing) & Profile 05 (Children's Clothing).
 * Implements Style x Color x Size x SKU variant matrix, barcode generation,
 * fitting room holds, customer reservations with deposits, seasonal markdowns,
 * and children-specific configurable age models & gift receipts.
 */

import {
  ApparelStyleMaster,
  ApparelVariantSKU,
  FittingRoomHoldTicket,
  CustomerReservation,
  SeasonalMarkdownRule
} from './types';

export class FashionRetailEngine {
  /**
   * Generates EAN-13 compatible barcode for variant SKU
   */
  public static generateVariantBarcode(styleCode: string, colorCode: string, size: string): string {
    const raw = `${styleCode}${colorCode}${size}`.toUpperCase();
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
    }
    const base12 = ('200' + ('000000000' + hash).slice(-9));
    // Calculate EAN check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(base12[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return `${base12}${checkDigit}`;
  }

  /**
   * Creates a Style Master and expands its full Variant Matrix (Style x Color x Size)
   */
  public static createStyleWithMatrix(params: {
    tenantId: string;
    companyId: string;
    styleCode: string;
    styleName: string;
    styleNameAr?: string;
    brand: string;
    category: 'WOMENS_WEAR' | 'CHILDRENS_WEAR' | 'MENS_WEAR';
    subCategory: string;
    season: string;
    collection: string;
    materialComposition: string;
    careInstructions?: string;
    baseCost: number;
    baseRetailPrice: number;
    colors: { colorCode: string; colorName: string; hexCode?: string }[];
    sizes: string[];
    isChildrenWear?: boolean;
    ageGroupRange?: string;
    safetyCertifications?: string[];
  }): { style: ApparelStyleMaster; variants: ApparelVariantSKU[] } {
    if (!params.styleCode || !params.styleName) {
      throw new Error('Style code and style name are required.');
    }
    if (!params.colors || params.colors.length === 0) {
      throw new Error('At least one color is required to generate variant matrix.');
    }
    if (!params.sizes || params.sizes.length === 0) {
      throw new Error('At least one size is required to generate variant matrix.');
    }

    const style: ApparelStyleMaster = {
      id: `STY-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      styleCode: params.styleCode.trim().toUpperCase(),
      styleName: params.styleName.trim(),
      styleNameAr: params.styleNameAr,
      brand: params.brand,
      category: params.category,
      subCategory: params.subCategory,
      season: params.season,
      collection: params.collection,
      materialComposition: params.materialComposition,
      careInstructions: params.careInstructions,
      baseCost: params.baseCost,
      baseRetailPrice: params.baseRetailPrice,
      availableColors: params.colors,
      availableSizes: params.sizes,
      isChildrenWear: params.isChildrenWear,
      ageGroupRange: params.ageGroupRange,
      safetyCertifications: params.safetyCertifications
    };

    const variants: ApparelVariantSKU[] = [];

    params.colors.forEach(col => {
      params.sizes.forEach(sz => {
        const sku = `${style.styleCode}-${col.colorCode}-${sz}`.toUpperCase();
        const barcode = this.generateVariantBarcode(style.styleCode, col.colorCode, sz);

        variants.push({
          id: `VAR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          styleId: style.id,
          styleCode: style.styleCode,
          colorCode: col.colorCode,
          colorName: col.colorName,
          size: sz,
          sku,
          barcode,
          stockOnHand: 0,
          reservedStock: 0,
          unitCost: style.baseCost,
          retailPrice: style.baseRetailPrice,
          currentMarkdownPercent: 0
        });
      });
    });

    return { style, variants };
  }

  /**
   * Creates a Fitting Room Hold ticket
   */
  public static createFittingRoomHold(params: {
    tenantId: string;
    companyId: string;
    branchId: string;
    fittingRoomNumber: number;
    customerName?: string;
    items: { variantSku: string; styleCode: string; color: string; size: string; quantity: number }[];
    holdDurationMinutes?: number;
  }): FittingRoomHoldTicket {
    const heldAt = new Date();
    const expiresAt = new Date(heldAt.getTime() + (params.holdDurationMinutes || 30) * 60000);

    return {
      id: `FR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      branchId: params.branchId,
      ticketNumber: `FR-${params.fittingRoomNumber}-${Date.now().toString().slice(-4)}`,
      fittingRoomNumber: params.fittingRoomNumber,
      customerName: params.customerName,
      items: params.items,
      heldAt: heldAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'ACTIVE_HOLD'
    };
  }

  /**
   * Creates customer reservation with deposit payment
   */
  public static createCustomerReservation(params: {
    tenantId: string;
    companyId: string;
    branchId: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    items: { variantSku: string; quantity: number; unitPrice: number }[];
    depositPaid: number;
    validityDays?: number;
  }): CustomerReservation {
    const totalOrderAmount = params.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const balanceRemaining = Math.max(0, totalOrderAmount - params.depositPaid);

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (params.validityDays || 7));

    return {
      id: `RES-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      branchId: params.branchId,
      reservationNumber: `RES-${Date.now().toString().slice(-6)}`,
      customerId: params.customerId,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      reservedItems: params.items,
      totalDepositPaid: params.depositPaid,
      balanceRemaining,
      validUntil: validUntil.toISOString().split('T')[0],
      status: 'ACTIVE'
    };
  }

  /**
   * Applies seasonal markdown rule to variants
   */
  public static applySeasonalMarkdown(
    variants: ApparelVariantSKU[],
    rule: SeasonalMarkdownRule
  ): { updatedCount: number; updatedVariants: ApparelVariantSKU[] } {
    let updatedCount = 0;
    variants.forEach(v => {
      v.currentMarkdownPercent = rule.discountPercentage;
      v.retailPrice = Math.round(v.retailPrice * (1 - rule.discountPercentage / 100) * 100) / 100;
      updatedCount++;
    });

    return { updatedCount, updatedVariants: variants };
  }

  /**
   * Generates children gift receipt data (omits retail prices)
   */
  public static generateGiftReceipt(
    receiptNumber: string,
    storeName: string,
    items: { variantSku: string; styleName: string; color: string; size: string; quantity: number }[],
    exchangeWindowDays: number = 30
  ) {
    const exchangeDeadline = new Date();
    exchangeDeadline.setDate(exchangeDeadline.getDate() + exchangeWindowDays);

    return {
      receiptNumber: `GIFT-${receiptNumber}`,
      storeName,
      isGiftReceipt: true,
      hidePrices: true,
      issuedDate: new Date().toISOString().split('T')[0],
      exchangeDeadline: exchangeDeadline.toISOString().split('T')[0],
      items: items.map(i => ({
        variantSku: i.variantSku,
        description: `${i.styleName} (${i.color}, ${i.size})`,
        quantity: i.quantity
      })),
      policyNotice: 'Item may be exchanged with this gift receipt within the deadline. Tags must remain attached.'
    };
  }

  /**
   * Calculates fashion performance analytics
   */
  public static calculateFashionKpis(
    styles: ApparelStyleMaster[],
    variants: ApparelVariantSKU[],
    holds: FittingRoomHoldTicket[]
  ) {
    const totalVariants = variants.length;
    const inStockUnits = variants.reduce((sum, v) => sum + v.stockOnHand, 0);
    const reservedUnits = variants.reduce((sum, v) => sum + v.reservedStock, 0);

    const activeHolds = holds.filter(h => h.status === 'ACTIVE_HOLD').length;
    const purchasedHolds = holds.filter(h => h.status === 'PURCHASED').length;
    const conversionRate = holds.length > 0 ? (purchasedHolds / holds.length) * 100 : 0;

    return {
      totalStylesCount: styles.length,
      totalVariantSkusCount: totalVariants,
      totalUnitsInStock: inStockUnits,
      reservedUnitsCount: reservedUnits,
      activeFittingRoomHolds: activeHolds,
      fittingRoomConversionPercent: Math.round(conversionRate * 10) / 10
    };
  }
}
