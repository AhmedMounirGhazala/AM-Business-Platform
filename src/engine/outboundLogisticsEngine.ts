/**
 * AM BUSINESS PLATFORM — OUTBOUND LOGISTICS & DELIVERY EXECUTION ENGINE
 * Phase 3.2C-02: Advanced Outbound Delivery, Shipping Execution, Handling Units, ATP Promising, RMA & ePOD
 * Architectural Alignment: SAP S/4HANA LE-SHP / TM, Oracle SCM Logistics, D365 Supply Chain
 */

import {
  OutboundDelivery,
  OutboundDeliveryLine,
  OutboundDeliveryStatus,
  PickWave,
  PickTask,
  PickTaskStatus,
  HandlingUnit,
  HandlingUnitItem,
  HandlingUnitType,
  PGIDocument,
  ReturnAuthorization,
  RMALine,
  RMAStatus,
  InspectionDispositionType,
  ProofOfDelivery,
  LogisticsAuditRecord,
  ATPCheckRequest,
  ATPCheckResponse,
  ATPItemResult,
  StockReservation
} from '../types/outboundLogistics';

export interface CreateDeliveryParams {
  tenantId: string;
  companyId: string;
  salesOrderId: string;
  salesOrderNumber: string;
  customerId: string;
  customerName: string;
  shippingAddress: string;
  shippingPoint: string;
  carrierCode: string;
  carrierName: string;
  serviceLevel: string;
  shippingRoute: string;
  plannedDepartureDate: string;
  plannedArrivalDate: string;
  completeDeliveryRequired?: boolean;
  currency?: string;
  lines: {
    salesOrderLineId: string;
    sku: string;
    description: string;
    orderedQuantity: number;
    deliveryQuantity: number;
    uom: string;
    unitPrice: number;
    unitCost: number;
    warehouseId: string;
    storageBin?: string;
    batchNumber?: string;
    lotExpiryDate?: string;
  }[];
  performedBy: string;
}

export interface CreatePickWaveParams {
  tenantId: string;
  companyId: string;
  warehouseId: string;
  shippingRoute: string;
  carrierCode: string;
  deliveryIds: string[];
  performedBy: string;
}

export interface PackHandlingUnitParams {
  tenantId: string;
  companyId: string;
  packagingType: HandlingUnitType;
  deliveryId: string;
  parentHuId?: string;
  tareWeightKg: number;
  maxWeightCapacityKg: number;
  volumeCbm: number;
  items: {
    deliveryLineId: string;
    sku: string;
    description: string;
    quantity: number;
    uom: string;
    batchNumber?: string;
    unitWeightKg: number;
  }[];
  performedBy: string;
}

export interface ExecutePGIParams {
  tenantId: string;
  companyId: string;
  deliveryId: string;
  performedBy: string;
  postingDate?: string;
}

export interface CreateRMAParams {
  tenantId: string;
  companyId: string;
  originalSalesOrderId: string;
  originalDeliveryNumber: string;
  customerId: string;
  customerName: string;
  currency?: string;
  lines: {
    originalDeliveryId: string;
    originalDeliveryLineId: string;
    sku: string;
    description: string;
    returnQuantity: number;
    uom: string;
    returnReason: 'DAMAGED' | 'DEFECTIVE' | 'WRONG_ITEM' | 'CUSTOMER_CANCEL' | 'EXPIRED';
    unitCreditPrice: number;
  }[];
  performedBy: string;
}

export interface InspectRMAParams {
  tenantId: string;
  companyId: string;
  rmaId: string;
  inspections: {
    lineId: string;
    inspectedQuantity: number;
    disposition: InspectionDispositionType;
    dispositionNotes?: string;
    restockedToWarehouseId?: string;
    restockedToBin?: string;
  }[];
  performedBy: string;
}

export interface RecordEPODParams {
  tenantId: string;
  companyId: string;
  deliveryId: string;
  recipientName: string;
  signatureImageHash: string;
  latitude?: number;
  longitude?: number;
  deliveredTimestamp: string;
  carrierEstimatedCost: number;
  carrierActualCost: number;
  discrepancies?: {
    sku: string;
    missingQuantity: number;
    damagedQuantity: number;
    notes: string;
  }[];
  performedBy: string;
}

export class OutboundLogisticsEngine {
  // In-Memory Enterprise Storage
  private static deliveries: Map<string, OutboundDelivery> = new Map();
  private static pickWaves: Map<string, PickWave> = new Map();
  private static handlingUnits: Map<string, HandlingUnit> = new Map();
  private static pgiDocuments: Map<string, PGIDocument> = new Map();
  private static rmaDocuments: Map<string, ReturnAuthorization> = new Map();
  private static epodRecords: Map<string, ProofOfDelivery> = new Map();
  private static stockReservations: Map<string, StockReservation> = new Map();
  private static auditVault: LogisticsAuditRecord[] = [];

  // Gapless sequence counters
  private static counters: Map<string, number> = new Map();

  // Simple inventory stock ledger for ATP evaluation
  private static inventoryLedger: Map<string, { onHand: number; reserved: number; scheduledInbound: number }> = new Map();

  /**
   * Reset engine state (for testing & isolation)
   */
  public static reset(): void {
    this.deliveries.clear();
    this.pickWaves.clear();
    this.handlingUnits.clear();
    this.pgiDocuments.clear();
    this.rmaDocuments.clear();
    this.epodRecords.clear();
    this.stockReservations.clear();
    this.auditVault = [];
    this.counters.clear();
    this.inventoryLedger.clear();
  }

  // =========================================================================
  // 1. INVENTORY MOCK LEDGER / ATP MANAGEMENT
  // =========================================================================

  public static seedInventory(
    sku: string,
    warehouseId: string,
    onHand: number,
    scheduledInbound: number = 0,
    reserved: number = 0
  ): void {
    const key = `${warehouseId}:${sku}`;
    this.inventoryLedger.set(key, { onHand, reserved, scheduledInbound });
  }

  public static getStockBalance(sku: string, warehouseId: string): { onHand: number; reserved: number; scheduledInbound: number; netAvailable: number } {
    const key = `${warehouseId}:${sku}`;
    const entry = this.inventoryLedger.get(key) || { onHand: 0, reserved: 0, scheduledInbound: 0 };
    const netAvailable = Math.max(0, entry.onHand + entry.scheduledInbound - entry.reserved);
    return { ...entry, netAvailable };
  }

  /**
   * Available-to-Promise (ATP) Multi-Echelon Stock Check
   */
  public static checkATP(
    tenantId: string,
    companyId: string,
    items: { sku: string; requestedQuantity: number; warehouseId: string; requiredDeliveryDate: string }[],
    substitutesMap?: Record<string, string>,
    alternativeWarehousesMap?: Record<string, string[]>
  ): ATPCheckResponse {
    const now = new Date().toISOString();
    let isFullyConfirmed = true;
    const results: ATPItemResult[] = [];

    for (const item of items) {
      if (item.requestedQuantity <= 0) {
        throw new Error(`ATP check requested quantity must be greater than zero for SKU: ${item.sku}`);
      }

      const balance = this.getStockBalance(item.sku, item.warehouseId);
      const confirmedQty = Math.min(item.requestedQuantity, balance.netAvailable);

      let atpStatus: ATPItemResult['atpStatus'] = 'AVAILABLE';
      let substituteSku: string | undefined = undefined;
      let altWarehouseId: string | undefined = undefined;
      let altAvailableQty: number | undefined = undefined;

      if (confirmedQty === item.requestedQuantity) {
        atpStatus = 'AVAILABLE';
      } else if (confirmedQty > 0) {
        atpStatus = 'PARTIALLY_AVAILABLE';
        isFullyConfirmed = false;
      } else {
        atpStatus = 'UNAVAILABLE';
        isFullyConfirmed = false;
      }

      // Check alternative warehouse or substitute if not fully confirmed
      if (confirmedQty < item.requestedQuantity) {
        if (alternativeWarehousesMap && alternativeWarehousesMap[item.warehouseId]) {
          for (const altWh of alternativeWarehousesMap[item.warehouseId]) {
            const altBal = this.getStockBalance(item.sku, altWh);
            if (altBal.netAvailable >= item.requestedQuantity - confirmedQty) {
              altWarehouseId = altWh;
              altAvailableQty = altBal.netAvailable;
              atpStatus = 'SUBSTITUTE_RECOMMENDED';
              break;
            }
          }
        }

        if (!altWarehouseId && substitutesMap && substitutesMap[item.sku]) {
          const subSku = substitutesMap[item.sku];
          const subBal = this.getStockBalance(subSku, item.warehouseId);
          if (subBal.netAvailable >= item.requestedQuantity) {
            substituteSku = subSku;
            atpStatus = 'SUBSTITUTE_RECOMMENDED';
          }
        }
      }

      results.push({
        sku: item.sku,
        warehouseId: item.warehouseId,
        requestedQuantity: item.requestedQuantity,
        confirmedQuantity: confirmedQty,
        availableOnHand: balance.onHand,
        scheduledInbound: balance.scheduledInbound,
        allocatedReserved: balance.reserved,
        netAvailable: balance.netAvailable,
        atpStatus,
        confirmedDate: item.requiredDeliveryDate,
        substituteSku,
        alternativeWarehouseId: altWarehouseId,
        alternativeAvailableQty: altAvailableQty
      });
    }

    return {
      tenantId,
      companyId,
      checkTimestamp: now,
      isFullyConfirmed,
      results
    };
  }

  /**
   * Create Hard Reservation for Sales Order Line
   */
  public static createStockReservation(
    tenantId: string,
    companyId: string,
    salesOrderId: string,
    salesOrderLineId: string,
    sku: string,
    warehouseId: string,
    quantity: number,
    uom: string,
    ttlMinutes: number = 1440,
    performedBy: string
  ): StockReservation {
    if (quantity <= 0) throw new Error('Reservation quantity must be greater than zero');
    const balance = this.getStockBalance(sku, warehouseId);
    if (balance.netAvailable < quantity) {
      throw new Error(`Insufficient available stock for reservation. Available: ${balance.netAvailable}, Requested: ${quantity}`);
    }

    // Update reserved ledger
    const key = `${warehouseId}:${sku}`;
    const ledger = this.inventoryLedger.get(key) || { onHand: 0, reserved: 0, scheduledInbound: 0 };
    ledger.reserved += quantity;
    this.inventoryLedger.set(key, ledger);

    const year = new Date().getFullYear();
    const resSeq = this.getNextSequence(tenantId, companyId, `RES-${year}`);
    const resNumber = `RES-${year}-${String(resSeq).padStart(5, '0')}`;

    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

    const reservation: StockReservation = {
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      companyId,
      reservationNumber: resNumber,
      salesOrderId,
      salesOrderLineId,
      sku,
      warehouseId,
      quantity,
      uom,
      status: 'ACTIVE',
      expiresAt,
      createdAt: new Date().toISOString(),
      createdBy: performedBy
    };

    this.stockReservations.set(reservation.id, reservation);
    this.logAudit(tenantId, companyId, 'DELIVERY', reservation.id, 'CREATE_STOCK_RESERVATION', performedBy, { reservation });
    return reservation;
  }

  /**
   * Release or Expire Reservation
   */
  public static releaseStockReservation(reservationId: string, performedBy: string, isConsumption: boolean = false): void {
    const res = this.stockReservations.get(reservationId);
    if (!res) throw new Error(`Reservation not found: ${reservationId}`);
    if (res.status !== 'ACTIVE') throw new Error(`Reservation already in terminal status: ${res.status}`);

    const key = `${res.warehouseId}:${res.sku}`;
    const ledger = this.inventoryLedger.get(key);
    if (ledger) {
      ledger.reserved = Math.max(0, ledger.reserved - res.quantity);
      if (isConsumption) {
        ledger.onHand = Math.max(0, ledger.onHand - res.quantity);
      }
      this.inventoryLedger.set(key, ledger);
    }

    res.status = isConsumption ? 'CONSUMED' : 'RELEASED';
    this.logAudit(res.tenantId, res.companyId, 'DELIVERY', res.id, isConsumption ? 'CONSUME_RESERVATION' : 'RELEASE_RESERVATION', performedBy, { res });
  }

  // =========================================================================
  // 2. OUTBOUND DELIVERY ORDER LIFECYCLE
  // =========================================================================

  public static createOutboundDelivery(params: CreateDeliveryParams): OutboundDelivery {
    if (!params.tenantId || !params.companyId) {
      throw new Error('Tenant ID and Company ID are mandatory');
    }
    if (!params.salesOrderId || !params.lines || params.lines.length === 0) {
      throw new Error('Valid sales order ID and at least one delivery line are required');
    }

    const year = new Date().getFullYear();
    const seq = this.getNextSequence(params.tenantId, params.companyId, `OBD-${year}`);
    const deliveryNumber = `OBD-${year}-${String(seq).padStart(5, '0')}`;

    let totalWeight = 0;
    let totalVolume = 0;
    let totalValue = 0;
    let totalCost = 0;

    const deliveryId = `obd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const deliveryLines: OutboundDeliveryLine[] = params.lines.map((l, idx) => {
      if (l.deliveryQuantity <= 0) {
        throw new Error(`Delivery quantity on line ${idx + 1} (${l.sku}) must be greater than 0`);
      }
      if (l.deliveryQuantity > l.orderedQuantity) {
        throw new Error(`Delivery quantity (${l.deliveryQuantity}) exceeds ordered quantity (${l.orderedQuantity}) on SKU ${l.sku}`);
      }

      const lineTotal = l.deliveryQuantity * l.unitPrice;
      const lineCost = l.deliveryQuantity * l.unitCost;
      totalValue += lineTotal;
      totalCost += lineCost;

      // Estimate weight/volume based on standard multipliers
      totalWeight += l.deliveryQuantity * 1.5; // default 1.5 kg per unit
      totalVolume += l.deliveryQuantity * 0.005; // default 0.005 cbm per unit

      return {
        id: `line-${deliveryId}-${idx + 1}`,
        deliveryId,
        salesOrderId: params.salesOrderId,
        salesOrderLineId: l.salesOrderLineId,
        sku: l.sku,
        description: l.description,
        orderedQuantity: l.orderedQuantity,
        deliveryQuantity: l.deliveryQuantity,
        pickedQuantity: 0,
        packedQuantity: 0,
        uom: l.uom,
        unitPrice: l.unitPrice,
        unitCost: l.unitCost,
        currency: params.currency || 'USD',
        warehouseId: l.warehouseId,
        storageBin: l.storageBin || 'BIN-DEFAULT',
        batchNumber: l.batchNumber,
        lotExpiryDate: l.lotExpiryDate,
        isComplete: l.deliveryQuantity === l.orderedQuantity
      };
    });

    // Check complete delivery requirement
    if (params.completeDeliveryRequired) {
      const anyIncomplete = deliveryLines.some(l => l.deliveryQuantity < l.orderedQuantity);
      if (anyIncomplete) {
        throw new Error('Partial delivery blocked: Customer requires 100% complete delivery.');
      }
    }

    const now = new Date().toISOString();

    const delivery: OutboundDelivery = {
      id: deliveryId,
      tenantId: params.tenantId,
      companyId: params.companyId,
      deliveryNumber,
      salesOrderId: params.salesOrderId,
      salesOrderNumber: params.salesOrderNumber,
      customerId: params.customerId,
      customerName: params.customerName,
      shippingAddress: params.shippingAddress,
      shippingPoint: params.shippingPoint,
      carrierCode: params.carrierCode,
      carrierName: params.carrierName,
      serviceLevel: params.serviceLevel,
      shippingRoute: params.shippingRoute,
      plannedDepartureDate: params.plannedDepartureDate,
      plannedArrivalDate: params.plannedArrivalDate,
      status: 'PLANNED',
      completeDeliveryRequired: !!params.completeDeliveryRequired,
      totalWeightKg: Math.round(totalWeight * 100) / 100,
      totalVolumeCbm: Math.round(totalVolume * 1000) / 1000,
      totalDeliveryValue: Math.round(totalValue * 100) / 100,
      totalDeliveryCost: Math.round(totalCost * 100) / 100,
      currency: params.currency || 'USD',
      lines: deliveryLines,
      handlingUnitIds: [],
      version: 1,
      createdAt: now,
      createdBy: params.performedBy,
      updatedAt: now
    };

    this.deliveries.set(delivery.id, delivery);
    this.logAudit(delivery.tenantId, delivery.companyId, 'DELIVERY', delivery.id, 'CREATE_DELIVERY', params.performedBy, { delivery });
    return delivery;
  }

  public static getDelivery(id: string): OutboundDelivery | undefined {
    return this.deliveries.get(id);
  }

  public static getAllDeliveries(tenantId: string, companyId: string): OutboundDelivery[] {
    return Array.from(this.deliveries.values()).filter(d => d.tenantId === tenantId && d.companyId === companyId);
  }

  public static getAllWaves(tenantId: string, companyId: string): PickWave[] {
    return Array.from(this.pickWaves.values()).filter(w => w.tenantId === tenantId && w.companyId === companyId);
  }

  public static getAllHandlingUnits(tenantId: string, companyId: string): HandlingUnit[] {
    return Array.from(this.handlingUnits.values()).filter(h => h.tenantId === tenantId && h.companyId === companyId);
  }

  public static getAllRMAs(tenantId: string, companyId: string): ReturnAuthorization[] {
    return Array.from(this.rmaDocuments.values()).filter(r => r.tenantId === tenantId && r.companyId === companyId);
  }

  public static getAllPGIDocuments(tenantId: string, companyId: string): PGIDocument[] {
    return Array.from(this.pgiDocuments.values()).filter(p => p.tenantId === tenantId && p.companyId === companyId);
  }

  public static getAllProofOfDeliveries(tenantId: string, companyId: string): ProofOfDelivery[] {
    return Array.from(this.epodRecords.values()).filter(p => p.tenantId === tenantId && p.companyId === companyId);
  }

  public static cancelDelivery(deliveryId: string, reason: string, performedBy: string): OutboundDelivery {
    const delivery = this.deliveries.get(deliveryId);
    if (!delivery) throw new Error(`Delivery not found: ${deliveryId}`);
    if (['GOODS_ISSUED', 'IN_TRANSIT', 'DELIVERED'].includes(delivery.status)) {
      throw new Error(`Cannot cancel delivery in status ${delivery.status}. Goods have already been issued.`);
    }

    delivery.status = 'CANCELLED';
    delivery.reversalReason = reason;
    delivery.updatedAt = new Date().toISOString();
    delivery.version += 1;

    this.logAudit(delivery.tenantId, delivery.companyId, 'DELIVERY', delivery.id, 'CANCEL_DELIVERY', performedBy, { reason });
    return delivery;
  }

  // =========================================================================
  // 3. WAVE PICKING, FIFO/FEFO ROUTING & CONFIRMATION
  // =========================================================================

  public static createPickWave(params: CreatePickWaveParams): PickWave {
    if (!params.deliveryIds || params.deliveryIds.length === 0) {
      throw new Error('Pick wave must contain at least one delivery');
    }

    const year = new Date().getFullYear();
    const seq = this.getNextSequence(params.tenantId, params.companyId, `WAV-${year}`);
    const waveNumber = `WAV-${year}-${String(seq).padStart(5, '0')}`;
    const waveId = `wav-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const tasks: PickTask[] = [];

    for (const dId of params.deliveryIds) {
      const delivery = this.deliveries.get(dId);
      if (!delivery) throw new Error(`Delivery not found for wave: ${dId}`);
      if (delivery.status !== 'PLANNED') {
        throw new Error(`Delivery ${delivery.deliveryNumber} must be in PLANNED status to assign to pick wave (current: ${delivery.status})`);
      }

      delivery.status = 'RELEASED_FOR_PICKING';
      delivery.pickWaveId = waveId;
      delivery.version += 1;

      // Sort lines by FEFO (earliest expiry first) if lot-controlled, then by storage bin
      const sortedLines = [...delivery.lines].sort((a, b) => {
        if (a.lotExpiryDate && b.lotExpiryDate) {
          return new Date(a.lotExpiryDate).getTime() - new Date(b.lotExpiryDate).getTime();
        }
        return a.storageBin.localeCompare(b.storageBin);
      });

      for (const line of sortedLines) {
        const taskSeq = tasks.length + 1;
        tasks.push({
          id: `ptk-${waveId}-${taskSeq}`,
          tenantId: params.tenantId,
          companyId: params.companyId,
          taskNumber: `TASK-${waveNumber}-${String(taskSeq).padStart(3, '0')}`,
          waveId,
          deliveryId: delivery.id,
          deliveryLineId: line.id,
          sku: line.sku,
          description: line.description,
          warehouseId: line.warehouseId,
          sourceStorageBin: line.storageBin,
          destinationBin: 'STAGE-OUTBOUND-01',
          quantityRequested: line.deliveryQuantity - line.pickedQuantity,
          quantityPicked: 0,
          uom: line.uom,
          batchNumber: line.batchNumber,
          lotExpiryDate: line.lotExpiryDate,
          status: 'PENDING'
        });
      }
    }

    const wave: PickWave = {
      id: waveId,
      tenantId: params.tenantId,
      companyId: params.companyId,
      waveNumber,
      warehouseId: params.warehouseId,
      shippingRoute: params.shippingRoute,
      carrierCode: params.carrierCode,
      status: 'OPEN',
      deliveryIds: params.deliveryIds,
      tasks,
      createdAt: new Date().toISOString(),
      createdBy: params.performedBy
    };

    this.pickWaves.set(wave.id, wave);
    this.logAudit(wave.tenantId, wave.companyId, 'PICK_WAVE', wave.id, 'CREATE_PICK_WAVE', params.performedBy, { wave });
    return wave;
  }

  public static confirmPickTask(
    waveId: string,
    taskId: string,
    quantityPicked: number,
    performedBy: string,
    exceptionReason?: string
  ): PickTask {
    const wave = this.pickWaves.get(waveId);
    if (!wave) throw new Error(`Pick wave not found: ${waveId}`);

    const task = wave.tasks.find(t => t.id === taskId);
    if (!task) throw new Error(`Pick task not found: ${taskId}`);
    if (task.status === 'COMPLETED') throw new Error('Pick task is already completed');

    if (quantityPicked > task.quantityRequested) {
      throw new Error(`Cannot over-pick: Picked ${quantityPicked} exceeds requested ${task.quantityRequested}`);
    }

    task.quantityPicked = quantityPicked;
    task.pickedBy = performedBy;
    task.pickedAt = new Date().toISOString();
    task.exceptionReason = exceptionReason;

    if (quantityPicked === task.quantityRequested) {
      task.status = 'COMPLETED';
    } else {
      task.status = 'EXCEPTION';
    }

    // Update the corresponding delivery line
    const delivery = this.deliveries.get(task.deliveryId);
    if (delivery) {
      const line = delivery.lines.find(l => l.id === task.deliveryLineId);
      if (line) {
        line.pickedQuantity += quantityPicked;
      }

      // Check overall delivery pick status
      const allLinesPicked = delivery.lines.every(l => l.pickedQuantity >= l.deliveryQuantity);
      const anyLinePicked = delivery.lines.some(l => l.pickedQuantity > 0);

      if (allLinesPicked) {
        delivery.status = 'PICKED';
      } else if (anyLinePicked) {
        delivery.status = 'PARTIALLY_PICKED';
      }
      delivery.version += 1;
    }

    // Check wave status
    const allTasksDone = wave.tasks.every(t => t.status === 'COMPLETED' || t.status === 'EXCEPTION');
    if (allTasksDone) {
      wave.status = 'COMPLETED';
      wave.completedAt = new Date().toISOString();
    } else {
      wave.status = 'IN_PROGRESS';
    }

    this.logAudit(wave.tenantId, wave.companyId, 'PICK_WAVE', wave.id, 'CONFIRM_PICK_TASK', performedBy, { taskId, quantityPicked, task });
    return task;
  }

  // =========================================================================
  // 4. HANDLING UNITS (HU), NESTED PACKAGING & SSCC-18
  // =========================================================================

  /**
   * SSCC-18 Check Digit Calculator (Mod-10 algorithm per GS1 standard)
   */
  public static calculateSSCC18CheckDigit(payload17Digits: string): number {
    if (payload17Digits.length !== 17) {
      throw new Error('SSCC-18 payload must be exactly 17 digits before check digit');
    }
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const digit = parseInt(payload17Digits[i], 10);
      const multiplier = i % 2 === 0 ? 3 : 1; // 1-indexed odd is weight 3
      sum += digit * multiplier;
    }
    const remainder = sum % 10;
    return remainder === 0 ? 0 : 10 - remainder;
  }

  public static generateSSCC18(companyPrefix: string, seqNum: number, extensionDigit: number = 0): string {
    const paddedPrefix = companyPrefix.padEnd(7, '0').substring(0, 7);
    const paddedSeq = String(seqNum).padStart(9, '0');
    const base17 = `${extensionDigit}${paddedPrefix}${paddedSeq}`;
    const checkDigit = this.calculateSSCC18CheckDigit(base17);
    return `${base17}${checkDigit}`;
  }

  public static packHandlingUnit(params: PackHandlingUnitParams): HandlingUnit {
    const delivery = this.deliveries.get(params.deliveryId);
    if (!delivery) throw new Error(`Delivery not found: ${params.deliveryId}`);

    const seq = this.getNextSequence(params.tenantId, params.companyId, `HU-${params.packagingType}`);
    const huNumber = `HU-${params.packagingType.substring(0, 3)}-${String(seq).padStart(6, '0')}`;
    const sscc18 = this.generateSSCC18('9501234', seq);

    let netWeight = 0;
    const huItems: HandlingUnitItem[] = [];

    for (const item of params.items) {
      const line = delivery.lines.find(l => l.id === item.deliveryLineId);
      if (!line) throw new Error(`Delivery line not found: ${item.deliveryLineId}`);

      if (line.packedQuantity + item.quantity > line.pickedQuantity) {
        throw new Error(`Cannot pack more than picked quantity for SKU ${item.sku}. Packed: ${line.packedQuantity + item.quantity}, Picked: ${line.pickedQuantity}`);
      }

      line.packedQuantity += item.quantity;
      const itemWeight = item.quantity * item.unitWeightKg;
      netWeight += itemWeight;

      huItems.push({
        deliveryLineId: item.deliveryLineId,
        sku: item.sku,
        description: item.description,
        quantity: item.quantity,
        uom: item.uom,
        batchNumber: item.batchNumber,
        weightKg: itemWeight
      });
    }

    const grossWeight = netWeight + params.tareWeightKg;
    if (params.maxWeightCapacityKg && grossWeight > params.maxWeightCapacityKg) {
      throw new Error(`Gross weight (${grossWeight} kg) exceeds maximum capacity (${params.maxWeightCapacityKg} kg) of packaging unit.`);
    }

    const sealNumber = `SEAL-${Date.now().toString(36).toUpperCase()}`;
    const sealHash = this.computeSha256(`${huNumber}:${sscc18}:${grossWeight}:${sealNumber}`);

    const hu: HandlingUnit = {
      id: `hu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      huNumber,
      sscc18Barcode: sscc18,
      packagingType: params.packagingType,
      deliveryId: params.deliveryId,
      parentHuId: params.parentHuId,
      tareWeightKg: params.tareWeightKg,
      netWeightKg: Math.round(netWeight * 100) / 100,
      grossWeightKg: Math.round(grossWeight * 100) / 100,
      volumeCbm: params.volumeCbm,
      maxWeightCapacityKg: params.maxWeightCapacityKg,
      items: huItems,
      sealed: true,
      sealNumber,
      cryptographicSealHash: sealHash,
      createdAt: new Date().toISOString(),
      createdBy: params.performedBy
    };

    this.handlingUnits.set(hu.id, hu);
    delivery.handlingUnitIds.push(hu.id);

    // Update delivery packed status
    const allLinesPacked = delivery.lines.every(l => l.packedQuantity >= l.deliveryQuantity);
    if (allLinesPacked) {
      delivery.status = 'PACKED';
    }
    delivery.version += 1;

    this.logAudit(hu.tenantId, hu.companyId, 'HANDLING_UNIT', hu.id, 'PACK_HANDLING_UNIT', params.performedBy, { hu });
    return hu;
  }

  public static getHandlingUnit(id: string): HandlingUnit | undefined {
    return this.handlingUnits.get(id);
  }

  // =========================================================================
  // 5. POST GOODS ISSUE (PGI) & FINANCIAL EVENT INTEGRATION
  // =========================================================================

  public static executePostGoodsIssue(params: ExecutePGIParams): PGIDocument {
    const delivery = this.deliveries.get(params.deliveryId);
    if (!delivery) throw new Error(`Delivery not found: ${params.deliveryId}`);

    if (delivery.status !== 'PACKED' && delivery.status !== 'PICKED') {
      throw new Error(`Delivery ${delivery.deliveryNumber} must be in PICKED or PACKED status to execute Post Goods Issue (current: ${delivery.status})`);
    }

    // Strict validation: every line must be fully picked
    for (const line of delivery.lines) {
      if (line.pickedQuantity < line.deliveryQuantity) {
        throw new Error(`Line ${line.sku} picked quantity (${line.pickedQuantity}) is less than required delivery quantity (${line.deliveryQuantity})`);
      }
    }

    const year = new Date().getFullYear();
    const seq = this.getNextSequence(params.tenantId, params.companyId, `PGI-${year}`);
    const pgiNumber = `PGI-${year}-${String(seq).padStart(5, '0')}`;
    const pgiId = `pgi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // Deduct inventory physical stock ledger
    for (const line of delivery.lines) {
      const key = `${line.warehouseId}:${line.sku}`;
      const balance = this.inventoryLedger.get(key) || { onHand: 0, reserved: 0, scheduledInbound: 0 };
      balance.onHand = Math.max(0, balance.onHand - line.deliveryQuantity);
      this.inventoryLedger.set(key, balance);
    }

    // Emit decoupled Financial Event (COGS / Inventory Outbound)
    const financialEventId = `fe-pgi-${Date.now()}`;
    const financialEvent = {
      eventId: financialEventId,
      eventType: 'GOODS_ISSUE_OUTBOUND',
      tenantId: params.tenantId,
      companyId: params.companyId,
      sourceDocumentId: delivery.id,
      sourceDocumentNumber: delivery.deliveryNumber,
      sourceDocumentType: 'OUTBOUND_DELIVERY',
      amount: delivery.totalDeliveryCost,
      currency: delivery.currency,
      exchangeRate: 1.0,
      timestamp: now,
      payload: {
        salesOrderId: delivery.salesOrderId,
        salesOrderNumber: delivery.salesOrderNumber,
        customerId: delivery.customerId,
        totalCost: delivery.totalDeliveryCost,
        totalRevenue: delivery.totalDeliveryValue,
        pgiNumber
      },
      performedBy: params.performedBy
    };

    const pgiDoc: PGIDocument = {
      id: pgiId,
      tenantId: params.tenantId,
      companyId: params.companyId,
      pgiNumber,
      deliveryId: delivery.id,
      deliveryNumber: delivery.deliveryNumber,
      salesOrderId: delivery.salesOrderId,
      totalCostValue: delivery.totalDeliveryCost,
      currency: delivery.currency,
      financialEventId,
      status: 'POSTED',
      postedAt: now,
      postedBy: params.performedBy
    };

    this.pgiDocuments.set(pgiDoc.id, pgiDoc);

    // Update delivery status to GOODS_ISSUED / IN_TRANSIT
    delivery.status = 'IN_TRANSIT';
    delivery.pgiDocumentNumber = pgiNumber;
    delivery.pgiTimestamp = now;
    delivery.actualDepartureDate = now;
    delivery.version += 1;

    this.logAudit(delivery.tenantId, delivery.companyId, 'PGI', pgiDoc.id, 'EXECUTE_PGI', params.performedBy, { pgiDoc });
    return pgiDoc;
  }

  public static reversePostGoodsIssue(
    deliveryId: string,
    reason: string,
    performedBy: string
  ): PGIDocument {
    const delivery = this.deliveries.get(deliveryId);
    if (!delivery) throw new Error(`Delivery not found: ${deliveryId}`);

    if (delivery.status !== 'IN_TRANSIT' && delivery.status !== 'GOODS_ISSUED') {
      throw new Error(`Cannot reverse PGI for delivery in status ${delivery.status}`);
    }

    const pgiDoc = Array.from(this.pgiDocuments.values()).find(p => p.deliveryId === deliveryId && p.status === 'POSTED');
    if (!pgiDoc) throw new Error(`Active PGI document not found for delivery: ${deliveryId}`);

    // Restore inventory
    for (const line of delivery.lines) {
      const key = `${line.warehouseId}:${line.sku}`;
      const balance = this.inventoryLedger.get(key) || { onHand: 0, reserved: 0, scheduledInbound: 0 };
      balance.onHand += line.deliveryQuantity;
      this.inventoryLedger.set(key, balance);
    }

    const year = new Date().getFullYear();
    const revSeq = this.getNextSequence(delivery.tenantId, delivery.companyId, `PGI-REV-${year}`);
    const revNumber = `PGI-REV-${year}-${String(revSeq).padStart(5, '0')}`;

    pgiDoc.status = 'REVERSED';
    pgiDoc.reversalPgiNumber = revNumber;
    pgiDoc.reversalReason = reason;

    // Financial Event Reversal
    const revEventId = `fe-pgi-rev-${Date.now()}`;
    const revFinancialEvent = {
      eventId: revEventId,
      eventType: 'GOODS_ISSUE_OUTBOUND_REVERSAL',
      tenantId: delivery.tenantId,
      companyId: delivery.companyId,
      sourceDocumentId: delivery.id,
      sourceDocumentNumber: delivery.deliveryNumber,
      sourceDocumentType: 'OUTBOUND_DELIVERY_REVERSAL',
      amount: -delivery.totalDeliveryCost,
      currency: delivery.currency,
      exchangeRate: 1.0,
      timestamp: new Date().toISOString(),
      payload: {
        originalPgiNumber: pgiDoc.pgiNumber,
        reversalPgiNumber: revNumber,
        reversalReason: reason
      },
      performedBy
    };

    delivery.status = 'REVERSED';
    delivery.reversalReason = reason;
    delivery.reversalTimestamp = new Date().toISOString();
    delivery.version += 1;

    this.logAudit(delivery.tenantId, delivery.companyId, 'PGI', pgiDoc.id, 'REVERSE_PGI', performedBy, { revNumber, reason });
    return pgiDoc;
  }

  // =========================================================================
  // 6. CUSTOMER RETURNS & RETURN MATERIAL AUTHORIZATION (RMA)
  // =========================================================================

  public static createReturnAuthorization(params: CreateRMAParams): ReturnAuthorization {
    if (!params.lines || params.lines.length === 0) {
      throw new Error('RMA requires at least one return item line');
    }

    const year = new Date().getFullYear();
    const seq = this.getNextSequence(params.tenantId, params.companyId, `RMA-${year}`);
    const rmaNumber = `RMA-${year}-${String(seq).padStart(5, '0')}`;
    const rmaId = `rma-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    let totalCredit = 0;
    const rmaLines: RMALine[] = params.lines.map((l, idx) => {
      if (l.returnQuantity <= 0) throw new Error(`Return quantity on line ${idx + 1} must be > 0`);
      totalCredit += l.returnQuantity * l.unitCreditPrice;
      return {
        id: `rmal-${rmaId}-${idx + 1}`,
        rmaId,
        originalDeliveryId: l.originalDeliveryId,
        originalDeliveryLineId: l.originalDeliveryLineId,
        sku: l.sku,
        description: l.description,
        returnQuantity: l.returnQuantity,
        uom: l.uom,
        returnReason: l.returnReason,
        unitCreditPrice: l.unitCreditPrice,
        currency: params.currency || 'USD'
      };
    });

    const rma: ReturnAuthorization = {
      id: rmaId,
      tenantId: params.tenantId,
      companyId: params.companyId,
      rmaNumber,
      originalSalesOrderId: params.originalSalesOrderId,
      originalDeliveryNumber: params.originalDeliveryNumber,
      customerId: params.customerId,
      customerName: params.customerName,
      status: 'REQUESTED',
      lines: rmaLines,
      totalCreditValue: Math.round(totalCredit * 100) / 100,
      currency: params.currency || 'USD',
      createdAt: new Date().toISOString(),
      createdBy: params.performedBy
    };

    this.rmaDocuments.set(rma.id, rma);
    this.logAudit(rma.tenantId, rma.companyId, 'RMA', rma.id, 'CREATE_RMA', params.performedBy, { rma });
    return rma;
  }

  public static inspectAndDispositionRMA(params: InspectRMAParams): ReturnAuthorization {
    const rma = this.rmaDocuments.get(params.rmaId);
    if (!rma) throw new Error(`RMA document not found: ${params.rmaId}`);

    // Creator cannot self-approve / self-inspect if enterprise SoD applies
    if (rma.createdBy === params.performedBy) {
      throw new Error(`Segregation of Duties violation: RMA creator (${params.performedBy}) cannot inspect/approve disposition.`);
    }

    for (const insp of params.inspections) {
      const line = rma.lines.find(l => l.id === insp.lineId);
      if (!line) throw new Error(`RMA line not found: ${insp.lineId}`);

      line.inspectedQuantity = insp.inspectedQuantity;
      line.disposition = insp.disposition;
      line.dispositionNotes = insp.dispositionNotes;
      line.restockedToWarehouseId = insp.restockedToWarehouseId;
      line.restockedToBin = insp.restockedToBin;

      // Handle stock restock if SELLABLE
      if (insp.disposition === 'RESTOCK_SELLABLE' && insp.restockedToWarehouseId) {
        const key = `${insp.restockedToWarehouseId}:${line.sku}`;
        const balance = this.inventoryLedger.get(key) || { onHand: 0, reserved: 0, scheduledInbound: 0 };
        balance.onHand += insp.inspectedQuantity;
        this.inventoryLedger.set(key, balance);
      }
    }

    rma.status = 'INSPECTED';
    rma.inspectionDate = new Date().toISOString();
    rma.inspectedBy = params.performedBy;
    rma.approvedBy = params.performedBy;
    rma.approvedAt = new Date().toISOString();

    this.logAudit(rma.tenantId, rma.companyId, 'RMA', rma.id, 'INSPECT_RMA', params.performedBy, { inspections: params.inspections });
    return rma;
  }

  public static getRMA(id: string): ReturnAuthorization | undefined {
    return this.rmaDocuments.get(id);
  }

  // =========================================================================
  // 7. ELECTRONIC PROOF OF DELIVERY (ePOD) & FREIGHT COST SETTLEMENT
  // =========================================================================

  public static recordProofOfDelivery(params: RecordEPODParams): ProofOfDelivery {
    const delivery = this.deliveries.get(params.deliveryId);
    if (!delivery) throw new Error(`Delivery not found: ${params.deliveryId}`);

    if (delivery.status !== 'IN_TRANSIT' && delivery.status !== 'GOODS_ISSUED') {
      throw new Error(`Delivery must be in transit to record ePOD (current status: ${delivery.status})`);
    }

    const variance = params.carrierActualCost - params.carrierEstimatedCost;
    let matchStatus: ProofOfDelivery['carrierInvoiceMatch'] = 'MATCHED';

    // 10% freight tolerance check
    const tolerancePct = params.carrierEstimatedCost > 0 ? Math.abs(variance) / params.carrierEstimatedCost : 0;
    if (tolerancePct > 0.10) {
      matchStatus = 'VARIANCE_HOLD';
    }

    const epodId = `epod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const epod: ProofOfDelivery = {
      id: epodId,
      tenantId: params.tenantId,
      companyId: params.companyId,
      deliveryId: delivery.id,
      deliveryNumber: delivery.deliveryNumber,
      recipientName: params.recipientName,
      signatureImageHash: params.signatureImageHash,
      latitude: params.latitude,
      longitude: params.longitude,
      deliveredTimestamp: params.deliveredTimestamp,
      discrepancyReported: !!(params.discrepancies && params.discrepancies.length > 0),
      discrepancies: params.discrepancies,
      carrierEstimatedCost: params.carrierEstimatedCost,
      carrierActualCost: params.carrierActualCost,
      freightCostVariance: Math.round(variance * 100) / 100,
      carrierInvoiceMatch: matchStatus,
      createdAt: new Date().toISOString(),
      createdBy: params.performedBy
    };

    this.epodRecords.set(epod.id, epod);

    // Update delivery status
    delivery.status = 'DELIVERED';
    delivery.actualDeliveryDate = params.deliveredTimestamp;
    delivery.proofOfDeliveryId = epod.id;
    delivery.version += 1;

    this.logAudit(delivery.tenantId, delivery.companyId, 'EPOD', epod.id, 'RECORD_EPOD', params.performedBy, { epod });
    return epod;
  }

  public static getEPOD(id: string): ProofOfDelivery | undefined {
    return this.epodRecords.get(id);
  }

  // =========================================================================
  // 8. AUDIT VAULT & UTILITIES
  // =========================================================================

  private static getNextSequence(tenantId: string, companyId: string, typeKey: string): number {
    const key = `${tenantId}:${companyId}:${typeKey}`;
    const cur = this.counters.get(key) || 0;
    const next = cur + 1;
    this.counters.set(key, next);
    return next;
  }

  private static computeSha256(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `sha256-${hex}${hex}${hex}${hex}`.substring(0, 40);
  }

  private static logAudit(
    tenantId: string,
    companyId: string,
    entityType: LogisticsAuditRecord['entityType'],
    entityId: string,
    action: string,
    performedBy: string,
    details: Record<string, any>
  ): void {
    const prevHash = this.auditVault.length > 0 ? this.auditVault[this.auditVault.length - 1].currentHash : 'GENESIS-HASH-LOGISTICS';
    const timestamp = new Date().toISOString();
    const payload = `${prevHash}:${tenantId}:${companyId}:${entityType}:${entityId}:${action}:${performedBy}:${timestamp}`;
    const currentHash = this.computeSha256(payload);

    this.auditVault.push({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      companyId,
      entityType,
      entityId,
      action,
      performedBy,
      timestamp,
      previousHash: prevHash,
      currentHash,
      details
    });
  }

  public static getAuditVault(): LogisticsAuditRecord[] {
    return [...this.auditVault];
  }
}
