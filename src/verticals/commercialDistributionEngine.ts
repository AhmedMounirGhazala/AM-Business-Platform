/**
 * AM Business Platform — P0-06 Commercial Distribution Engine
 * Runtime service for Profile 01: Commercial Trading / Distribution.
 * Implements delivery routes, customer territories, van stock allocation,
 * wholesale tiered pricing, Buy X Get Y promotions, and distribution reporting.
 */

import {
  DeliveryTerritory,
  DeliveryRoute,
  VanStockAllocation,
  WholesaleTierPriceRule,
  BuyXGetYPromotion
} from './types';

export interface TerritoryCreationParams {
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  nameAr: string;
  region: string;
  city: string;
  assignedRepIds?: string[];
}

export interface RouteCreationParams {
  tenantId: string;
  companyId: string;
  territoryId: string;
  code: string;
  name: string;
  nameAr: string;
  vehiclePlateNumber?: string;
  defaultSalespersonId: string;
  customerIds: string[];
  dayOfWeekFrequency?: number[];
}

export class CommercialDistributionEngine {
  /**
   * Creates and validates a new delivery territory
   */
  public static createTerritory(params: TerritoryCreationParams): DeliveryTerritory {
    if (!params.code || !params.name) {
      throw new Error('Territory code and name are mandatory.');
    }

    return {
      id: `TERR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      code: params.code.trim().toUpperCase(),
      name: params.name.trim(),
      nameAr: params.nameAr || params.name,
      region: params.region || 'Default Region',
      city: params.city || 'Cairo',
      activeRoutesCount: 0,
      assignedRepIds: params.assignedRepIds || []
    };
  }

  /**
   * Creates a delivery route within a territory
   */
  public static createRoute(params: RouteCreationParams): DeliveryRoute {
    if (!params.code || !params.name || !params.territoryId) {
      throw new Error('Route code, name, and territory ID are mandatory.');
    }

    return {
      id: `ROUTE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      territoryId: params.territoryId,
      code: params.code.trim().toUpperCase(),
      name: params.name.trim(),
      nameAr: params.nameAr || params.name,
      vehiclePlateNumber: params.vehiclePlateNumber,
      defaultSalespersonId: params.defaultSalespersonId || 'REP-001',
      stopsCount: params.customerIds.length,
      customerIds: params.customerIds,
      dayOfWeekFrequency: params.dayOfWeekFrequency || [1, 2, 3, 4, 5], // Mon-Fri
      status: 'ACTIVE'
    };
  }

  /**
   * Dispatches a van stock allocation for mobile route sales
   */
  public static dispatchVanStock(params: {
    tenantId: string;
    companyId: string;
    routeId: string;
    vehicleId: string;
    salespersonId: string;
    dispatchWarehouseId: string;
    items: { itemSku: string; itemName: string; uom: string; quantityLoaded: number; unitCost: number }[];
  }): VanStockAllocation {
    if (!params.items || params.items.length === 0) {
      throw new Error('Van stock dispatch requires at least one product item.');
    }

    const allocationItems = params.items.map(item => {
      if (item.quantityLoaded <= 0) {
        throw new Error(`Quantity loaded for SKU ${item.itemSku} must be greater than zero.`);
      }
      return {
        itemSku: item.itemSku,
        itemName: item.itemName,
        uom: item.uom,
        quantityLoaded: item.quantityLoaded,
        quantitySold: 0,
        quantityReturned: 0,
        quantityDamaged: 0,
        unitCost: item.unitCost
      };
    });

    return {
      id: `VAN-DISP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      routeId: params.routeId,
      vehicleId: params.vehicleId,
      salespersonId: params.salespersonId,
      dispatchWarehouseId: params.dispatchWarehouseId,
      dispatchDate: new Date().toISOString().split('T')[0],
      items: allocationItems,
      status: 'DISPATCHED'
    };
  }

  /**
   * Reconciles van sales and returns at end-of-day
   */
  public static reconcileVanRun(
    allocation: VanStockAllocation,
    reconciliationData: { itemSku: string; quantitySold: number; quantityReturned: number; quantityDamaged: number }[]
  ): {
    updatedAllocation: VanStockAllocation;
    totalRevenueEstimated: number;
    totalDamagedValue: number;
    discrepancyDetected: boolean;
  } {
    let totalDamagedValue = 0;
    let discrepancyDetected = false;

    allocation.items.forEach(item => {
      const match = reconciliationData.find(r => r.itemSku === item.itemSku);
      if (match) {
        item.quantitySold = match.quantitySold;
        item.quantityReturned = match.quantityReturned;
        item.quantityDamaged = match.quantityDamaged;

        const totalAccountedFor = match.quantitySold + match.quantityReturned + match.quantityDamaged;
        if (totalAccountedFor !== item.quantityLoaded) {
          discrepancyDetected = true;
        }

        totalDamagedValue += match.quantityDamaged * item.unitCost;
      }
    });

    allocation.status = 'RECONCILED';

    return {
      updatedAllocation: allocation,
      totalRevenueEstimated: 0, // Calculated downstream with actual prices
      totalDamagedValue,
      discrepancyDetected
    };
  }

  /**
   * Calculates wholesale tiered pricing for customer order line
   */
  public static calculateWholesalePrice(params: {
    baseUnitPrice: number;
    quantity: number;
    customerTier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'STANDARD';
    tierRules: WholesaleTierPriceRule[];
  }): { effectiveUnitPrice: number; discountPercent: number; ruleApplied?: WholesaleTierPriceRule } {
    const applicableRule = params.tierRules
      .filter(r => r.customerTier === params.customerTier && params.quantity >= r.minQuantity)
      .sort((a, b) => b.minQuantity - a.minQuantity)[0];

    if (applicableRule) {
      if (applicableRule.customPrice !== undefined) {
        return {
          effectiveUnitPrice: applicableRule.customPrice,
          discountPercent: Math.max(0, ((params.baseUnitPrice - applicableRule.customPrice) / params.baseUnitPrice) * 100),
          ruleApplied: applicableRule
        };
      } else {
        const discounted = params.baseUnitPrice * (1 - applicableRule.discountPercentage / 100);
        return {
          effectiveUnitPrice: Math.round(discounted * 100) / 100,
          discountPercent: applicableRule.discountPercentage,
          ruleApplied: applicableRule
        };
      }
    }

    return {
      effectiveUnitPrice: params.baseUnitPrice,
      discountPercent: 0
    };
  }

  /**
   * Evaluates Buy X Get Y promotional rule
   */
  public static evaluateBuyXGetY(
    orderLines: { sku: string; quantity: number; unitPrice: number }[],
    promotion: BuyXGetYPromotion
  ): { eligible: boolean; freeRewardQuantity: number; rewardSku: string; discountPercent: number } {
    if (!promotion.isActive) {
      return { eligible: false, freeRewardQuantity: 0, rewardSku: promotion.rewardSku, discountPercent: 0 };
    }

    const qualifyingLine = orderLines.find(l => l.sku === promotion.qualifyingSku);
    if (!qualifyingLine || qualifyingLine.quantity < promotion.qualifyingQuantity) {
      return { eligible: false, freeRewardQuantity: 0, rewardSku: promotion.rewardSku, discountPercent: 0 };
    }

    const multiples = Math.floor(qualifyingLine.quantity / promotion.qualifyingQuantity);
    const freeQty = multiples * promotion.rewardQuantity;

    return {
      eligible: true,
      freeRewardQuantity: freeQty,
      rewardSku: promotion.rewardSku,
      discountPercent: promotion.discountOnRewardPercent
    };
  }

  /**
   * Generates summary distribution metrics
   */
  public static calculateDistributionKpis(routes: DeliveryRoute[], allocations: VanStockAllocation[]) {
    const activeRoutes = routes.filter(r => r.status === 'ACTIVE').length;
    const totalStops = routes.reduce((sum, r) => sum + r.stopsCount, 0);
    const closedRuns = allocations.filter(a => a.status === 'RECONCILED' || a.status === 'CLOSED').length;
    const fulfillmentRate = allocations.length > 0 ? (closedRuns / allocations.length) * 100 : 100;

    return {
      activeRoutesCount: activeRoutes,
      totalStopsCovered: totalStops,
      completedRunsCount: closedRuns,
      routeFulfillmentRatePercent: Math.round(fulfillmentRate * 10) / 10
    };
  }
}
