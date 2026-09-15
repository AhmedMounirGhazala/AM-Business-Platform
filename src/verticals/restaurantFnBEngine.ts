/**
 * AM Business Platform — P0-06 Restaurant & F&B Engine
 * Runtime service for Profile 02: Restaurant, Cafe & Food Services.
 * Implements dining areas, table lifecycle, bill splitting, table merging/transfer,
 * Kitchen Display System (KDS), Recipe BOMs, ingredient consumption, waste logging,
 * and theoretical vs actual food cost calculations.
 */

import {
  DiningArea,
  RestaurantTableRuntime,
  TableOrderItem,
  TableBillSplit,
  RecipeBOM,
  RestaurantWasteRecord
} from './types';

export class RestaurantFnBEngine {
  /**
   * Initializes a dining area
   */
  public static createDiningArea(params: {
    tenantId: string;
    companyId: string;
    branchId: string;
    name: string;
    nameAr?: string;
    floorLevel: string;
    smokingAllowed?: boolean;
  }): DiningArea {
    return {
      id: `AREA-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      branchId: params.branchId,
      name: params.name,
      nameAr: params.nameAr || params.name,
      floorLevel: params.floorLevel,
      smokingAllowed: !!params.smokingAllowed
    };
  }

  /**
   * Initializes a restaurant table
   */
  public static createTable(params: {
    tenantId: string;
    companyId: string;
    branchId: string;
    diningAreaId: string;
    tableNumber: string;
    capacity: number;
  }): RestaurantTableRuntime {
    return {
      id: `TBL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      branchId: params.branchId,
      diningAreaId: params.diningAreaId,
      tableNumber: params.tableNumber,
      capacity: params.capacity,
      status: 'AVAILABLE'
    };
  }

  /**
   * Opens a table when guests arrive
   */
  public static openTable(
    table: RestaurantTableRuntime,
    guestCount: number,
    serverStaffId: string
  ): RestaurantTableRuntime {
    if (table.status === 'OCCUPIED') {
      throw new Error(`Table ${table.tableNumber} is already occupied.`);
    }

    table.status = 'OCCUPIED';
    table.activeGuestsCount = guestCount;
    table.serverStaffId = serverStaffId;
    table.openedAt = new Date().toISOString();
    table.currentOrderId = `ORD-TBL-${table.tableNumber}-${Date.now().toString().slice(-4)}`;
    table.totalBillAmount = 0;
    return table;
  }

  /**
   * Adds items with modifiers to a table order and determines station routing
   */
  public static addItemToOrder(
    table: RestaurantTableRuntime,
    item: {
      itemId: string;
      itemSku: string;
      name: string;
      quantity: number;
      unitPrice: number;
      modifiers?: { modifierId: string; name: string; additionalPrice: number }[];
      kitchenNotes?: string;
      station?: 'HOT_KITCHEN' | 'COLD_PREP' | 'BEVERAGES' | 'BAKERY' | 'DESSERT';
      seatNumber?: number;
    }
  ): { updatedTable: RestaurantTableRuntime; orderItem: TableOrderItem } {
    if (table.status !== 'OCCUPIED') {
      throw new Error(`Cannot add items to table ${table.tableNumber} because it is not occupied.`);
    }

    const modifiers = item.modifiers || [];
    const modifiersTotal = modifiers.reduce((acc, m) => acc + m.additionalPrice, 0);
    const lineTotal = (item.unitPrice + modifiersTotal) * item.quantity;

    table.totalBillAmount = (table.totalBillAmount || 0) + lineTotal;

    const orderItem: TableOrderItem = {
      itemId: item.itemId,
      itemSku: item.itemSku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      modifiers,
      kitchenNotes: item.kitchenNotes,
      kitchenStatus: 'PENDING',
      station: item.station || 'HOT_KITCHEN',
      seatNumber: item.seatNumber
    };

    return { updatedTable: table, orderItem };
  }

  /**
   * Splits a table bill equally or by seat
   */
  public static splitBill(
    table: RestaurantTableRuntime,
    splitType: 'EQUAL' | 'BY_SEAT',
    partsCount: number,
    vatRate: number = 0.15
  ): TableBillSplit {
    const totalAmount = table.totalBillAmount || 0;
    const parts = Math.max(1, partsCount);
    const amountPerPart = Math.round((totalAmount / parts) * 100) / 100;

    const shares = [];
    for (let i = 1; i <= parts; i++) {
      const shareAmount = i === parts ? totalAmount - amountPerPart * (parts - 1) : amountPerPart;
      const taxAmount = Math.round(shareAmount * vatRate * 100) / 100;
      shares.push({
        shareNumber: i,
        guestName: `Guest ${i}`,
        amount: shareAmount,
        taxAmount,
        paid: false
      });
    }

    return {
      splitId: `SPLIT-${Date.now()}`,
      splitType,
      shares
    };
  }

  /**
   * Transfers a table to another table
   */
  public static transferTable(
    fromTable: RestaurantTableRuntime,
    toTable: RestaurantTableRuntime
  ): { sourceTable: RestaurantTableRuntime; destinationTable: RestaurantTableRuntime } {
    if (fromTable.status !== 'OCCUPIED') {
      throw new Error(`Source table ${fromTable.tableNumber} is not occupied.`);
    }
    if (toTable.status === 'OCCUPIED') {
      throw new Error(`Destination table ${toTable.tableNumber} is already occupied.`);
    }

    toTable.status = 'OCCUPIED';
    toTable.currentOrderId = fromTable.currentOrderId;
    toTable.activeGuestsCount = fromTable.activeGuestsCount;
    toTable.serverStaffId = fromTable.serverStaffId;
    toTable.openedAt = fromTable.openedAt;
    toTable.totalBillAmount = fromTable.totalBillAmount;

    fromTable.status = 'DIRTY';
    fromTable.currentOrderId = undefined;
    fromTable.activeGuestsCount = 0;
    fromTable.totalBillAmount = 0;

    return { sourceTable: fromTable, destinationTable: toTable };
  }

  /**
   * Merges two tables together
   */
  public static mergeTables(
    primaryTable: RestaurantTableRuntime,
    secondaryTable: RestaurantTableRuntime
  ): { primaryTable: RestaurantTableRuntime; secondaryTable: RestaurantTableRuntime } {
    primaryTable.totalBillAmount = (primaryTable.totalBillAmount || 0) + (secondaryTable.totalBillAmount || 0);
    primaryTable.activeGuestsCount = (primaryTable.activeGuestsCount || 0) + (secondaryTable.activeGuestsCount || 0);

    secondaryTable.status = 'OCCUPIED';
    secondaryTable.mergedWithTableId = primaryTable.id;
    secondaryTable.totalBillAmount = 0;

    return { primaryTable, secondaryTable };
  }

  /**
   * Calculates ingredient consumption for sold menu items based on Recipe BOM
   */
  public static calculateRecipeConsumption(
    menuItemSku: string,
    quantitySold: number,
    recipeBom: RecipeBOM
  ): { rawItemSku: string; rawItemName: string; requiredQuantity: number; unitCost: number; lineCost: number }[] {
    const yieldFactor = Math.max(1, recipeBom.portionYield);

    return recipeBom.ingredients.map(ing => {
      const perPortionQty = (ing.consumptionQuantity / yieldFactor) * (1 + ing.shrinkagePercent / 100);
      const totalQty = Math.round(perPortionQty * quantitySold * 1000) / 1000;
      const lineCost = Math.round(totalQty * ing.unitCost * 100) / 100;
      return {
        rawItemSku: ing.rawItemSku,
        rawItemName: ing.rawItemName,
        requiredQuantity: totalQty,
        unitCost: ing.unitCost,
        lineCost
      };
    });
  }

  /**
   * Records kitchen waste and calculates total cost impact
   */
  public static recordKitchenWaste(params: {
    tenantId: string;
    companyId: string;
    branchId: string;
    itemSku: string;
    itemName: string;
    quantity: number;
    uom: string;
    unitCost: number;
    reason: 'SPOILAGE' | 'PREPARATION_ERROR' | 'CUSTOMER_RETURN' | 'EXPIRED' | 'OVER_PORTIONED';
    reportedBy: string;
  }): RestaurantWasteRecord {
    const totalCostAmount = Math.round(params.quantity * params.unitCost * 100) / 100;

    return {
      id: `WST-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      branchId: params.branchId,
      wasteDate: new Date().toISOString().split('T')[0],
      itemSku: params.itemSku,
      itemName: params.itemName,
      quantity: params.quantity,
      uom: params.uom,
      unitCost: params.unitCost,
      totalCostAmount,
      reason: params.reason,
      reportedBy: params.reportedBy
    };
  }

  /**
   * Calculates theoretical vs actual food cost %
   */
  public static calculateFoodCostVariance(params: {
    totalFoodRevenue: number;
    theoreticalIngredientsCost: number;
    actualPurchasedConsumedCost: number;
    wasteCost: number;
  }) {
    const theoreticalPercent = params.totalFoodRevenue > 0
      ? (params.theoreticalIngredientsCost / params.totalFoodRevenue) * 100
      : 0;
    const actualPercent = params.totalFoodRevenue > 0
      ? (params.actualPurchasedConsumedCost / params.totalFoodRevenue) * 100
      : 0;
    const variancePercent = actualPercent - theoreticalPercent;

    return {
      theoreticalFoodCostPercent: Math.round(theoreticalPercent * 10) / 10,
      actualFoodCostPercent: Math.round(actualPercent * 10) / 10,
      varianceCostAmount: Math.round((params.actualPurchasedConsumedCost - params.theoreticalIngredientsCost) * 100) / 100,
      variancePercent: Math.round(variancePercent * 10) / 10,
      wastePercentOfRevenue: params.totalFoodRevenue > 0
        ? Math.round((params.wasteCost / params.totalFoodRevenue) * 1000) / 10
        : 0
    };
  }
}
