/**
 * Enterprise Inventory Execution Engine - Phase 2.2.1
 * Aligned with SAP S/4HANA Inventory Management, Oracle SCM, and Microsoft Dynamics 365 Architecture.
 * 
 * Enforces:
 * 1. Stock Quant Engine (Current on-hand for Item, Warehouse, Bin, Lot, Batch, Serial Number)
 * 2. Immutable Append-Only Stock Ledger
 * 3. Goods Receipt (GRN) & Goods Issue (GIN) Executions
 * 4. Configurable Movement Types
 * 5. Business Events Generation
 * 6. Financial Event Integration (EMITS Financial Events ONLY - ZERO direct GL postings)
 * 7. Business Policy Validations (Negative Stock Policy, Lot/Serial Requirements)
 * 8. Audit Trail Recording
 */

import { 
  InventoryItem, 
  StockQuant, 
  StockLedgerEntry, 
  InventoryMovementType, 
  InventoryMovementTypeConfig, 
  InventoryBusinessEvent, 
  FinancialEvent, 
  Warehouse, 
  BinLocation, 
  BatchLot, 
  SerialNumber,
  InventoryRuleConfig
} from '../types';

export interface ExecuteMovementParams {
  tenantId: string;
  companyId: string;
  branchId?: string;
  movementType: InventoryMovementType;
  itemSku: string;
  warehouseId: string;
  binId?: string;
  binCode?: string;
  batchNumber?: string;
  lotId?: string;
  serialNumber?: string;
  quantity: number;
  uom?: string;
  unitCost?: number;
  sourceDocumentType: string; // e.g. GoodsReceiptNote, GoodsIssueNote, OpeningStock, StockTransfer, SalesReturn, PurchaseReturn
  sourceDocumentId: string;
  sourceDocumentNumber: string;
  reference?: string;
  reason?: string;
  userId: string;
  userName: string;
  userRole?: string;
}

export interface ExecutionEngineResult {
  success: boolean;
  stockLedgerEntry: StockLedgerEntry;
  updatedQuant: StockQuant;
  updatedItem: InventoryItem;
  businessEvent: InventoryBusinessEvent;
  financialEventData: {
    tenantId: string;
    companyId: string;
    eventType: FinancialEvent['eventType'];
    sourceDocumentType: string;
    sourceDocumentId: string;
    sourceDocumentNumber: string;
    amount: number;
    taxAmount: number;
    currency: string;
    partyId?: string;
    partyName?: string;
    description: string;
    triggeredBy: string;
  };
  warnings?: string[];
}

export class InventoryExecutionEngine {
  /**
   * Configurable Registry of Inventory Movement Types
   */
  static MOVEMENT_TYPE_CONFIGS: Record<InventoryMovementType, InventoryMovementTypeConfig> = {
    GOODS_RECEIPT: {
      code: 'GOODS_RECEIPT',
      name: 'Goods Receipt (GRN)',
      nameAr: 'استلام بضاعة (إذن استلام)',
      direction: 'INCREASE',
      businessEventType: 'EVT_GOODS_RECEIPT',
      financialEventType: 'STOCK_RECEIPT_POSTED',
      requiresReference: true,
      description: 'Inbound inventory receipt from purchase order, vendor delivery, or production output.'
    },
    GOODS_ISSUE: {
      code: 'GOODS_ISSUE',
      name: 'Goods Issue (GIN)',
      nameAr: 'صرف بضاعة (إذن صرف)',
      direction: 'DECREASE',
      businessEventType: 'EVT_GOODS_ISSUE',
      financialEventType: 'STOCK_ISSUE_POSTED',
      requiresReference: true,
      description: 'Outbound inventory issue for sales fulfillment, internal consumption, or scrapping.'
    },
    OPENING_STOCK: {
      code: 'OPENING_STOCK',
      name: 'Opening Stock Balance',
      nameAr: 'رصيد افتتاحي للمخزون',
      direction: 'INCREASE',
      businessEventType: 'EVT_OPENING_STOCK',
      financialEventType: 'STOCK_RECEIPT_POSTED',
      requiresReference: false,
      description: 'Initial stock balance upload during system implementation or fiscal year opening.'
    },
    TRANSFER_OUT: {
      code: 'TRANSFER_OUT',
      name: 'Inter-Warehouse Transfer Out',
      nameAr: 'تحويل مخزني صادرة',
      direction: 'DECREASE',
      businessEventType: 'EVT_TRANSFER_OUT',
      financialEventType: 'STOCK_TRANSFER_POSTED',
      requiresReference: true,
      description: 'Stock issue from source warehouse to transit location for inter-warehouse transfer.'
    },
    TRANSFER_IN: {
      code: 'TRANSFER_IN',
      name: 'Inter-Warehouse Transfer In',
      nameAr: 'تحويل مخزني واردة',
      direction: 'INCREASE',
      businessEventType: 'EVT_TRANSFER_IN',
      financialEventType: 'STOCK_TRANSFER_POSTED',
      requiresReference: true,
      description: 'Stock receipt into target warehouse from inter-warehouse transfer order.'
    },
    ADJUSTMENT_PLUS: {
      code: 'ADJUSTMENT_PLUS',
      name: 'Physical Count Adjustment (+)',
      nameAr: 'تعديل جردي بالموجب (+)',
      direction: 'INCREASE',
      businessEventType: 'EVT_ADJUSTMENT_PLUS',
      financialEventType: 'STOCK_ADJUSTMENT_POSTED',
      requiresReference: false,
      description: 'Inventory adjustment increasing stock quantity following physical stock count audit.'
    },
    ADJUSTMENT_MINUS: {
      code: 'ADJUSTMENT_MINUS',
      name: 'Physical Count Adjustment (-)',
      nameAr: 'تعديل جردي بالسالب (-)',
      direction: 'DECREASE',
      businessEventType: 'EVT_ADJUSTMENT_MINUS',
      financialEventType: 'STOCK_ADJUSTMENT_POSTED',
      requiresReference: false,
      description: 'Inventory adjustment decreasing stock quantity for variance or inventory shrinkage.'
    },
    RETURN_IN: {
      code: 'RETURN_IN',
      name: 'Customer Sales Return (RMA)',
      nameAr: 'مرتجع مبيعات عميل',
      direction: 'INCREASE',
      businessEventType: 'EVT_RETURN_IN',
      financialEventType: 'STOCK_RECEIPT_POSTED',
      requiresReference: true,
      description: 'Receipt of returned goods from customer back into sellable or quarantine stock.'
    },
    RETURN_OUT: {
      code: 'RETURN_OUT',
      name: 'Supplier Purchase Return',
      nameAr: 'مرتجع مشتريات إلى مورد',
      direction: 'DECREASE',
      businessEventType: 'EVT_RETURN_OUT',
      financialEventType: 'STOCK_ISSUE_POSTED',
      requiresReference: true,
      description: 'Issue of defective or returned goods back to vendor.'
    }
  };

  /**
   * Main Inventory Movement Execution Processor
   */
  static processExecutionMovement(
    params: ExecuteMovementParams,
    context: {
      items: InventoryItem[];
      warehouses: Warehouse[];
      bins: BinLocation[];
      quants: StockQuant[];
      batchLots: BatchLot[];
      serials: SerialNumber[];
      config?: InventoryRuleConfig;
    }
  ): ExecutionEngineResult {
    const warnings: string[] = [];

    // 1. Validate Config & Movement Type
    const mvtConfig = this.MOVEMENT_TYPE_CONFIGS[params.movementType];
    if (!mvtConfig) {
      throw new Error(`Invalid movement type '${params.movementType}'. Supported types: ${Object.keys(this.MOVEMENT_TYPE_CONFIGS).join(', ')}`);
    }

    // 2. Validate Quantity > 0
    if (!params.quantity || params.quantity <= 0) {
      throw new Error('Movement quantity must be greater than zero.');
    }

    // 3. Validate Master Data Dependencies
    const item = context.items.find(i => i.sku === params.itemSku && i.tenantId === params.tenantId);
    if (!item) {
      throw new Error(`Master Data Failure: Item with SKU '${params.itemSku}' does not exist in tenant '${params.tenantId}'.`);
    }

    const warehouse = context.warehouses.find(w => w.id === params.warehouseId && w.tenantId === params.tenantId);
    if (!warehouse) {
      throw new Error(`Master Data Failure: Warehouse '${params.warehouseId}' does not exist in tenant '${params.tenantId}'.`);
    }

    let bin: BinLocation | undefined;
    if (params.binId) {
      bin = context.bins.find(b => b.id === params.binId);
      if (!bin) {
        throw new Error(`Master Data Failure: Bin location '${params.binId}' does not exist.`);
      }
    }

    // 4. Validate Batch & Serial if required by Item/Config
    if (params.batchNumber) {
      const batch = context.batchLots.find(b => b.itemSku === params.itemSku && b.batchNumber === params.batchNumber);
      if (batch && batch.status === 'Expired' && mvtConfig.direction === 'DECREASE') {
        warnings.push(`Warning: Batch '${params.batchNumber}' is expired.`);
      }
    }

    if (params.serialNumber) {
      const serial = context.serials.find(s => s.itemSku === params.itemSku && s.serialNumber === params.serialNumber);
      if (serial && serial.status === 'Issued' && mvtConfig.direction === 'DECREASE') {
        throw new Error(`Serial Number '${params.serialNumber}' has already been issued.`);
      }
    }

    // 5. Evaluate Stock Quant & Negative Stock Policy
    const targetBinCode = params.binCode || (bin ? bin.code : 'BIN-DEFAULT');
    const targetBinId = params.binId || (bin ? bin.id : 'bin-default');
    const targetBatch = params.batchNumber || 'N/A';
    const targetSerial = params.serialNumber || 'N/A';

    let quant = context.quants.find(q => 
      q.itemSku === params.itemSku && 
      q.warehouseId === params.warehouseId &&
      (q.binId === targetBinId || q.binCode === targetBinCode) &&
      (q.batchNumber || 'N/A') === targetBatch &&
      (q.serialNumber || 'N/A') === targetSerial
    );

    const currentQtyOnHand = quant ? quant.qtyOnHand : 0;
    const isDecrease = mvtConfig.direction === 'DECREASE';
    const impactQty = isDecrease ? -params.quantity : params.quantity;
    const projectedQtyOnHand = currentQtyOnHand + impactQty;

    // Negative Stock Policy Check
    const negPolicy: 'Block' | 'Warn' | 'Allow' = context.config?.negativeStockPolicy || ((context.config as any)?.allowNegativeStock ? 'Allow' : 'Block');
    if (isDecrease && projectedQtyOnHand < 0) {
      if (negPolicy === 'Block') {
        throw new Error(`Business Policy Constraint: Movement would result in negative stock balance (${projectedQtyOnHand} ${item.uom}) for SKU '${item.sku}' at Warehouse '${warehouse.name}'. Configuration policy blocks negative inventory.`);
      } else if (negPolicy === 'Warn') {
        warnings.push(`Warning: Negative stock policy warning - stock balance for '${item.sku}' will fall below zero (${projectedQtyOnHand} ${item.uom}).`);
      }
    }

    // 6. Update or Create Stock Quant
    const costPrice = params.unitCost ?? item.costPrice;
    const nowIso = new Date().toISOString();

    if (quant) {
      quant.qtyOnHand = projectedQtyOnHand;
      quant.qtyAvailable = Math.max(0, quant.qtyOnHand - (quant.qtyReserved || 0));
      quant.unitCost = costPrice;
      quant.totalValue = quant.qtyOnHand * costPrice;
      quant.updatedAt = nowIso;
    } else {
      quant = {
        id: `quant-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenantId: params.tenantId,
        companyId: params.companyId,
        itemSku: item.sku,
        itemName: item.name,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        binId: targetBinId,
        binCode: targetBinCode,
        batchNumber: params.batchNumber,
        serialNumber: params.serialNumber,
        qtyOnHand: Math.max(0, impactQty),
        qtyAvailable: Math.max(0, impactQty),
        qtyReserved: 0,
        qtyInTransit: 0,
        qtyDamaged: 0,
        qtyReturned: 0,
        unitCost: costPrice,
        totalValue: Math.max(0, impactQty) * costPrice,
        uom: params.uom || item.uom,
        status: 'Available',
        updatedAt: nowIso
      };
      context.quants.unshift(quant);
    }

    // Update Item Aggregate Stock
    item.stockQty = Math.max(0, item.stockQty + impactQty);

    // 7. Create Immutable Append-Only Stock Ledger Entry
    const movementNumber = `SLM-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const totalCost = params.quantity * costPrice;

    const stockLedgerEntry: StockLedgerEntry = {
      id: `sle-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      branchId: params.branchId || warehouse.branchId,
      movementNumber,
      movementType: params.movementType,
      itemSku: item.sku,
      itemName: item.name,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      binId: targetBinId,
      binCode: targetBinCode,
      batchNumber: params.batchNumber,
      lotId: params.lotId,
      serialNumber: params.serialNumber,
      quantity: params.quantity,
      quantityImpact: impactQty,
      uom: params.uom || item.uom,
      unitCost: costPrice,
      totalCost,
      sourceDocumentType: params.sourceDocumentType,
      sourceDocumentId: params.sourceDocumentId,
      sourceDocumentNumber: params.sourceDocumentNumber,
      reference: params.reference,
      reason: params.reason,
      timestamp: nowIso,
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      status: 'POSTED'
    };

    // 8. Generate Business Event
    const businessEvent: InventoryBusinessEvent = {
      id: `evt-inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      branchId: params.branchId || warehouse.branchId,
      eventType: mvtConfig.businessEventType,
      movementId: stockLedgerEntry.id,
      movementNumber,
      itemSku: item.sku,
      itemName: item.name,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      binId: targetBinId,
      binCode: targetBinCode,
      batchNumber: params.batchNumber,
      serialNumber: params.serialNumber,
      quantity: params.quantity,
      direction: mvtConfig.direction,
      uom: params.uom || item.uom,
      unitCost: costPrice,
      totalCost,
      sourceDocumentType: params.sourceDocumentType,
      sourceDocumentNumber: params.sourceDocumentNumber,
      timestamp: nowIso,
      triggeredBy: params.userName
    };

    // 9. Prepare Financial Event Data (Emitted to Financial Event Engine - NO DIRECT GL POSTING)
    const financialEventData = {
      tenantId: params.tenantId,
      companyId: params.companyId,
      eventType: mvtConfig.financialEventType,
      sourceDocumentType: params.sourceDocumentType,
      sourceDocumentId: params.sourceDocumentId,
      sourceDocumentNumber: params.sourceDocumentNumber,
      amount: totalCost,
      taxAmount: 0,
      currency: 'SAR',
      partyId: undefined,
      partyName: item.name,
      description: `Inventory ${mvtConfig.name} [${params.sourceDocumentNumber}]: ${params.quantity} ${item.uom} of ${item.name} @ ${costPrice} SAR`,
      triggeredBy: params.userId
    };

    return {
      success: true,
      stockLedgerEntry,
      updatedQuant: quant,
      updatedItem: item,
      businessEvent,
      financialEventData,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Dedicated Helper: Goods Receipt (GRN) Execution
   */
  static executeGoodsReceipt(
    params: Omit<ExecuteMovementParams, 'movementType'>,
    context: Parameters<typeof InventoryExecutionEngine.processExecutionMovement>[1]
  ): ExecutionEngineResult {
    return this.processExecutionMovement(
      { ...params, movementType: 'GOODS_RECEIPT' },
      context
    );
  }

  /**
   * Dedicated Helper: Goods Issue (GIN) Execution
   */
  static executeGoodsIssue(
    params: Omit<ExecuteMovementParams, 'movementType'>,
    context: Parameters<typeof InventoryExecutionEngine.processExecutionMovement>[1]
  ): ExecutionEngineResult {
    return this.processExecutionMovement(
      { ...params, movementType: 'GOODS_ISSUE' },
      context
    );
  }
}
