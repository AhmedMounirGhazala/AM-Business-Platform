/**
 * Enterprise Inventory Costing Engine
 * Phase 2.2.3 — Valuation Engine
 *
 * Implements:
 * - FIFO Cost Layers (Immutable receipt layers, sequential consumption)
 * - Moving Weighted Average Cost (AVCO)
 * - Standard Costing & Variance Analysis
 * - Category Defaults & Item Method Overrides
 * - Cost Business Events (EVT_COST_LAYER_CREATED, EVT_COST_LAYER_CONSUMED, EVT_AVERAGE_COST_UPDATED, EVT_STANDARD_COST_UPDATED)
 * - Audit Trail & Traceability Logs
 *
 * CRITICAL ARCHITECTURAL GUARANTEE:
 * This engine operates strictly within the Inventory Management domain.
 * It NEVER performs General Ledger (GL) postings, COGS postings, or journal entry creation.
 */

import {
  InventoryItem,
  ItemCategory,
  CostingMethod,
  CostLayer,
  CostLayerConsumption,
  MovingAverageCostRecord,
  StandardCostRecord,
  CostCalculationLog,
  CostBusinessEvent,
  CostBusinessEventType,
  StockQuant
} from '../types';

export interface CostingEngineContext {
  tenantId: string;
  companyId: string;
  branchId?: string;
  userId: string;
  userName: string;
  costLayers: CostLayer[];
  layerConsumptions: CostLayerConsumption[];
  avgCostRecords: MovingAverageCostRecord[];
  standardCostRecords: StandardCostRecord[];
  calculationLogs: CostCalculationLog[];
  businessEvents: CostBusinessEvent[];
  stockQuants: StockQuant[];
  itemCategories?: ItemCategory[];
  items: InventoryItem[];
}

export interface ReceiptCostingRequest {
  itemSku: string;
  warehouseId: string;
  warehouseName: string;
  binId?: string;
  binCode?: string;
  batchNumber?: string;
  lotId?: string;
  quantity: number;
  unitCost: number;
  sourceDocumentType: string;
  sourceDocumentId: string;
  sourceDocumentNumber: string;
  receiptDate?: string;
}

export interface IssueCostingRequest {
  itemSku: string;
  warehouseId: string;
  warehouseName: string;
  binId?: string;
  batchNumber?: string;
  quantity: number;
  sourceDocumentType: string;
  sourceDocumentId: string;
  sourceDocumentNumber: string;
  issueDate?: string;
}

export interface ReceiptCostingResult {
  costingMethod: CostingMethod;
  unitCost: number;
  totalCost: number;
  createdLayer?: CostLayer;
  avgCostRecord?: MovingAverageCostRecord;
  standardCostRecord?: StandardCostRecord;
  businessEvent: CostBusinessEvent;
  auditLog: CostCalculationLog;
}

export interface IssueCostingResult {
  costingMethod: CostingMethod;
  unitCost: number;
  totalCost: number;
  consumedLayers: CostLayerConsumption[];
  businessEvents: CostBusinessEvent[];
  auditLog: CostCalculationLog;
}

export class InventoryCostingEngine {
  /**
   * Resolves effective costing method for an item considering Category defaults & Item overrides
   */
  public static resolveCostingMethod(
    item: InventoryItem,
    category?: ItemCategory,
    systemDefault: CostingMethod = 'FIFO'
  ): CostingMethod {
    // 1. Check if category defines a default and allows item-level override
    if (category) {
      if (category.allowItemOverride && item.valuationMethod) {
        return this.mapLegacyMethod(item.valuationMethod);
      }
      if (category.defaultCostingMethod) {
        return category.defaultCostingMethod;
      }
    }

    // 2. Check item direct valuation method
    if (item.valuationMethod) {
      return this.mapLegacyMethod(item.valuationMethod);
    }

    // 3. System default fallback
    return systemDefault;
  }

  private static mapLegacyMethod(method: string): CostingMethod {
    if (method === 'Weighted Average' || method === 'AVCO') return 'AVCO';
    if (method === 'Standard Cost' || method === 'STANDARD') return 'STANDARD';
    return 'FIFO';
  }

  /**
   * Validates mandatory inputs for costing calculations
   */
  public static validateCostInputs(
    quantity: number,
    unitCost: number,
    itemSku: string,
    warehouseId: string,
    context: CostingEngineContext
  ): { item: InventoryItem; category?: ItemCategory } {
    if (!context.tenantId || !context.companyId) {
      throw new Error('Costing Engine Error: Missing Tenant ID or Company ID context.');
    }

    if (quantity <= 0) {
      throw new Error(`Costing Engine Error: Quantity must be greater than zero (${quantity} provided).`);
    }

    if (unitCost < 0) {
      throw new Error(`Costing Engine Error: Unit Cost cannot be negative (${unitCost} SAR provided).`);
    }

    const item = context.items.find(i => i.sku === itemSku && i.tenantId === context.tenantId);
    if (!item) {
      throw new Error(`Costing Engine Error: Item with SKU '${itemSku}' not found for tenant '${context.tenantId}'.`);
    }

    const category = context.itemCategories?.find(c => c.id === item.categoryId && c.tenantId === context.tenantId);

    return { item, category };
  }

  /**
   * Processes Inventory Valuation on Goods Receipt
   */
  public static processReceiptValuation(
    request: ReceiptCostingRequest,
    context: CostingEngineContext
  ): ReceiptCostingResult {
    const { item, category } = this.validateCostInputs(
      request.quantity,
      request.unitCost,
      request.itemSku,
      request.warehouseId,
      context
    );

    const method = this.resolveCostingMethod(item, category);
    const now = new Date().toISOString();
    const receiptDate = request.receiptDate || now;
    const totalCost = request.quantity * request.unitCost;

    let createdLayer: CostLayer | undefined;
    let avgCostRecord: MovingAverageCostRecord | undefined;
    let standardCostRecord: StandardCostRecord | undefined;
    let businessEvent: CostBusinessEvent;

    if (method === 'FIFO') {
      // 1. Create FIFO Cost Layer
      const layerNumber = `LAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      createdLayer = {
        id: `layer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tenantId: context.tenantId,
        companyId: context.companyId,
        branchId: context.branchId,
        layerNumber,
        itemSku: item.sku,
        itemName: item.name,
        warehouseId: request.warehouseId,
        warehouseName: request.warehouseName,
        binId: request.binId,
        binCode: request.binCode,
        batchNumber: request.batchNumber,
        lotId: request.lotId,
        quantity: request.quantity,
        remainingQuantity: request.quantity,
        unitCost: request.unitCost,
        totalCost,
        remainingTotalCost: totalCost,
        sourceDocumentType: request.sourceDocumentType,
        sourceDocumentId: request.sourceDocumentId,
        sourceDocumentNumber: request.sourceDocumentNumber,
        receiptDate,
        status: 'ACTIVE',
        createdBy: context.userId,
        createdAt: now
      };

      context.costLayers.unshift(createdLayer);

      businessEvent = {
        id: `cbe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tenantId: context.tenantId,
        companyId: context.companyId,
        branchId: context.branchId,
        eventType: 'EVT_COST_LAYER_CREATED',
        itemSku: item.sku,
        itemName: item.name,
        warehouseId: request.warehouseId,
        costingMethod: 'FIFO',
        layerId: createdLayer.id,
        layerNumber: createdLayer.layerNumber,
        quantity: request.quantity,
        unitCost: request.unitCost,
        totalCost,
        sourceDocumentType: request.sourceDocumentType,
        sourceDocumentNumber: request.sourceDocumentNumber,
        timestamp: now,
        triggeredBy: context.userName
      };

    } else if (method === 'AVCO') {
      // 2. Calculate Moving Average Cost
      // Calculate total stock qty across quants for this SKU in the company
      const totalCurrentQty = context.stockQuants
        .filter(q => q.itemSku === item.sku && q.tenantId === context.tenantId)
        .reduce((sum, q) => sum + (q.qtyOnHand || 0), 0);

      const previousAvgCost = item.costPrice || request.unitCost;
      const newQty = totalCurrentQty + request.quantity;
      const newAvgCost = newQty > 0
        ? Math.round((((totalCurrentQty * previousAvgCost) + totalCost) / newQty) * 100) / 100
        : request.unitCost;

      // Update item cost price (moving average)
      item.costPrice = newAvgCost;

      avgCostRecord = {
        id: `mac-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tenantId: context.tenantId,
        companyId: context.companyId,
        itemSku: item.sku,
        itemName: item.name,
        warehouseId: request.warehouseId,
        previousQty: totalCurrentQty,
        previousAvgCost,
        receiptQty: request.quantity,
        receiptUnitCost: request.unitCost,
        newQty,
        newAvgCost,
        sourceDocumentNumber: request.sourceDocumentNumber,
        updatedAt: now,
        updatedBy: context.userName
      };

      context.avgCostRecords.unshift(avgCostRecord);

      businessEvent = {
        id: `cbe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tenantId: context.tenantId,
        companyId: context.companyId,
        branchId: context.branchId,
        eventType: 'EVT_AVERAGE_COST_UPDATED',
        itemSku: item.sku,
        itemName: item.name,
        warehouseId: request.warehouseId,
        costingMethod: 'AVCO',
        quantity: request.quantity,
        unitCost: newAvgCost,
        totalCost,
        sourceDocumentType: request.sourceDocumentType,
        sourceDocumentNumber: request.sourceDocumentNumber,
        timestamp: now,
        triggeredBy: context.userName
      };

    } else {
      // 3. Standard Cost Analysis
      const standardCost = item.costPrice || request.unitCost;
      const unitVariance = request.unitCost - standardCost;
      const totalVariance = unitVariance * request.quantity;

      standardCostRecord = {
        id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tenantId: context.tenantId,
        companyId: context.companyId,
        itemSku: item.sku,
        itemName: item.name,
        standardCost,
        actualReceiptCost: request.unitCost,
        unitVariance,
        totalVariance,
        quantity: request.quantity,
        sourceDocumentNumber: request.sourceDocumentNumber,
        calculatedAt: now,
        calculatedBy: context.userName
      };

      context.standardCostRecords.unshift(standardCostRecord);

      businessEvent = {
        id: `cbe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tenantId: context.tenantId,
        companyId: context.companyId,
        branchId: context.branchId,
        eventType: 'EVT_STANDARD_COST_UPDATED',
        itemSku: item.sku,
        itemName: item.name,
        warehouseId: request.warehouseId,
        costingMethod: 'STANDARD',
        quantity: request.quantity,
        unitCost: standardCost,
        totalCost: request.quantity * standardCost,
        varianceAmount: totalVariance,
        sourceDocumentType: request.sourceDocumentType,
        sourceDocumentNumber: request.sourceDocumentNumber,
        timestamp: now,
        triggeredBy: context.userName
      };
    }

    context.businessEvents.unshift(businessEvent);

    // 4. Traceable Audit Log
    const auditLog: CostCalculationLog = {
      id: `ccl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenantId: context.tenantId,
      companyId: context.companyId,
      itemSku: item.sku,
      itemName: item.name,
      calculationMethod: method,
      operationType: 'RECEIPT',
      quantity: request.quantity,
      unitCost: request.unitCost,
      totalCost,
      sourceDocumentType: request.sourceDocumentType,
      sourceDocumentNumber: request.sourceDocumentNumber,
      sourceModule: 'InventoryManagement',
      createdBy: context.userId,
      createdAt: now,
      details: `Processed receipt valuation for SKU ${item.sku} via ${method} method.`
    };

    context.calculationLogs.unshift(auditLog);

    return {
      costingMethod: method,
      unitCost: request.unitCost,
      totalCost,
      createdLayer,
      avgCostRecord,
      standardCostRecord,
      businessEvent,
      auditLog
    };
  }

  /**
   * Processes Inventory Valuation on Goods Issue
   */
  public static processIssueValuation(
    request: IssueCostingRequest,
    context: CostingEngineContext
  ): IssueCostingResult {
    const { item, category } = this.validateCostInputs(
      request.quantity,
      1, // Dummy unit cost for issue validation
      request.itemSku,
      request.warehouseId,
      context
    );

    const method = this.resolveCostingMethod(item, category);
    const now = new Date().toISOString();

    const consumedLayers: CostLayerConsumption[] = [];
    const businessEvents: CostBusinessEvent[] = [];
    let calculatedUnitCost = item.costPrice || 0;
    let totalIssueCost = 0;

    if (method === 'FIFO') {
      // 1. Fetch Active Cost Layers for Item SKU & Warehouse ordered by receiptDate ASC
      const activeLayers = context.costLayers
        .filter(l => 
          l.tenantId === context.tenantId &&
          l.itemSku === item.sku &&
          l.warehouseId === request.warehouseId &&
          l.status === 'ACTIVE' &&
          l.remainingQuantity > 0 &&
          (!request.batchNumber || !l.batchNumber || l.batchNumber === request.batchNumber)
        )
        .sort((a, b) => new Date(a.receiptDate).getTime() - new Date(b.receiptDate).getTime());

      const totalAvailable = activeLayers.reduce((sum, l) => sum + l.remainingQuantity, 0);

      if (totalAvailable < request.quantity) {
        throw new Error(
          `Costing Engine Error (FIFO Layer Exhaustion): Insufficient FIFO cost layer quantity for SKU '${item.sku}' at Warehouse '${request.warehouseName}'. Requested: ${request.quantity}, Available in active layers: ${totalAvailable}.`
        );
      }

      let qtyNeeded = request.quantity;

      for (const layer of activeLayers) {
        if (qtyNeeded <= 0) break;

        const qtyToConsume = Math.min(qtyNeeded, layer.remainingQuantity);
        const layerConsumptionCost = qtyToConsume * layer.unitCost;

        layer.remainingQuantity -= qtyToConsume;
        layer.remainingTotalCost = layer.remainingQuantity * layer.unitCost;

        if (layer.remainingQuantity === 0) {
          layer.status = 'EXHAUSTED';
        }

        totalIssueCost += layerConsumptionCost;
        qtyNeeded -= qtyToConsume;

        const consumptionRecord: CostLayerConsumption = {
          id: `clc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          tenantId: context.tenantId,
          companyId: context.companyId,
          costLayerId: layer.id,
          costLayerNumber: layer.layerNumber,
          issueDocumentType: request.sourceDocumentType,
          issueDocumentNumber: request.sourceDocumentNumber,
          itemSku: item.sku,
          quantityConsumed: qtyToConsume,
          unitCost: layer.unitCost,
          totalCost: layerConsumptionCost,
          consumedAt: now,
          consumedBy: context.userName
        };

        consumedLayers.push(consumptionRecord);
        context.layerConsumptions.unshift(consumptionRecord);

        const event: CostBusinessEvent = {
          id: `cbe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          tenantId: context.tenantId,
          companyId: context.companyId,
          branchId: context.branchId,
          eventType: 'EVT_COST_LAYER_CONSUMED',
          itemSku: item.sku,
          itemName: item.name,
          warehouseId: request.warehouseId,
          costingMethod: 'FIFO',
          layerId: layer.id,
          layerNumber: layer.layerNumber,
          quantity: qtyToConsume,
          unitCost: layer.unitCost,
          totalCost: layerConsumptionCost,
          sourceDocumentType: request.sourceDocumentType,
          sourceDocumentNumber: request.sourceDocumentNumber,
          timestamp: now,
          triggeredBy: context.userName
        };

        businessEvents.push(event);
        context.businessEvents.unshift(event);
      }

      calculatedUnitCost = totalIssueCost / request.quantity;

    } else if (method === 'AVCO') {
      // 2. Weighted Average Cost Issue
      calculatedUnitCost = item.costPrice || 0;
      totalIssueCost = request.quantity * calculatedUnitCost;

      const event: CostBusinessEvent = {
        id: `cbe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tenantId: context.tenantId,
        companyId: context.companyId,
        branchId: context.branchId,
        eventType: 'EVT_AVERAGE_COST_UPDATED',
        itemSku: item.sku,
        itemName: item.name,
        warehouseId: request.warehouseId,
        costingMethod: 'AVCO',
        quantity: request.quantity,
        unitCost: calculatedUnitCost,
        totalCost: totalIssueCost,
        sourceDocumentType: request.sourceDocumentType,
        sourceDocumentNumber: request.sourceDocumentNumber,
        timestamp: now,
        triggeredBy: context.userName
      };

      businessEvents.push(event);
      context.businessEvents.unshift(event);

    } else {
      // 3. Standard Cost Issue
      calculatedUnitCost = item.costPrice || 0;
      totalIssueCost = request.quantity * calculatedUnitCost;

      const event: CostBusinessEvent = {
        id: `cbe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tenantId: context.tenantId,
        companyId: context.companyId,
        branchId: context.branchId,
        eventType: 'EVT_STANDARD_COST_UPDATED',
        itemSku: item.sku,
        itemName: item.name,
        warehouseId: request.warehouseId,
        costingMethod: 'STANDARD',
        quantity: request.quantity,
        unitCost: calculatedUnitCost,
        totalCost: totalIssueCost,
        sourceDocumentType: request.sourceDocumentType,
        sourceDocumentNumber: request.sourceDocumentNumber,
        timestamp: now,
        triggeredBy: context.userName
      };

      businessEvents.push(event);
      context.businessEvents.unshift(event);
    }

    // Traceable Audit Log
    const auditLog: CostCalculationLog = {
      id: `ccl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenantId: context.tenantId,
      companyId: context.companyId,
      itemSku: item.sku,
      itemName: item.name,
      calculationMethod: method,
      operationType: 'ISSUE',
      quantity: request.quantity,
      unitCost: calculatedUnitCost,
      totalCost: totalIssueCost,
      sourceDocumentType: request.sourceDocumentType,
      sourceDocumentNumber: request.sourceDocumentNumber,
      sourceModule: 'InventoryManagement',
      createdBy: context.userId,
      createdAt: now,
      details: `Processed issue valuation for SKU ${item.sku} via ${method} method.`
    };

    context.calculationLogs.unshift(auditLog);

    return {
      costingMethod: method,
      unitCost: calculatedUnitCost,
      totalCost: totalIssueCost,
      consumedLayers,
      businessEvents,
      auditLog
    };
  }
}
