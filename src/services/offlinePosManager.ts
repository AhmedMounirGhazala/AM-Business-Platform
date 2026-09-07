/**
 * AM Business Platform - Offline POS Manager
 * Architecture Baseline: v2.8 | Pilot Readiness Phase 2
 * Coordinates Offline Transaction Lifecycle, IndexedDB Queuing, Crash Recovery,
 * Conflict Detection, and Server Synchronization with Zero Duplicate GL Mutation.
 */

import {
  OfflineTransactionQueueItem,
  OfflineTransactionType,
  SyncBatchRequest,
  SyncBatchResponse,
  POSReceipt,
  SalesReturn,
  POSShiftCashMovement,
  POSReceiptLine,
  PaymentTransaction
} from '../types/sales';
import { OfflineSalesSyncEngine } from '../engine/offlineSalesSyncEngine';
import { OfflinePosIndexedDbService } from './offlinePosIndexedDb';

export interface OfflineSyncSummary {
  total: number;
  pendingCount: number;
  syncedCount: number;
  conflictCount: number;
  failedCount: number;
}

export class OfflinePosManager {
  private static instance: OfflinePosManager | null = null;
  private dbService = OfflinePosIndexedDbService.getInstance();
  private sequenceCounter = 1;

  public static getInstance(): OfflinePosManager {
    if (!OfflinePosManager.instance) {
      OfflinePosManager.instance = new OfflinePosManager();
    }
    return OfflinePosManager.instance;
  }

  public static resetInstance(): void {
    OfflinePosManager.instance = null;
  }

  /**
   * Generates next local sequence number
   */
  private getNextSequence(existingQueue: OfflineTransactionQueueItem[]): number {
    if (existingQueue.length === 0) {
      return this.sequenceCounter++;
    }
    const maxSeq = Math.max(...existingQueue.map(i => i.localSequence || 0));
    return maxSeq + 1;
  }

  /**
   * Record an offline POS checkout/sale
   */
  public async recordOfflineSale(params: {
    deviceId: string;
    userId: string;
    userName: string;
    companyId: string;
    branchId: string;
    registerId: string;
    registerCode: string;
    shiftId: string;
    customerId?: string;
    customerName?: string;
    lines: POSReceiptLine[];
    subtotal: number;
    taxTotal: number;
    grandTotal: number;
    payments: PaymentTransaction[];
    changeGiven: number;
  }): Promise<{ queueItem: OfflineTransactionQueueItem; receipt: POSReceipt }> {
    const queue = await this.dbService.getQueue();
    const sequence = this.getNextSequence(queue);

    const tempDocNumber = OfflineSalesSyncEngine.generateTemporaryDocumentNumber(
      params.registerCode || 'REG01',
      'SALE',
      sequence
    );

    const payload = {
      customerId: params.customerId || 'cust-walkin',
      customerName: params.customerName || 'Walk-in Retail Customer',
      registerId: params.registerId,
      registerCode: params.registerCode,
      shiftId: params.shiftId,
      lines: params.lines,
      subtotal: params.subtotal,
      taxTotal: params.taxTotal,
      grandTotal: params.grandTotal,
      payments: params.payments,
      changeGiven: params.changeGiven
    };

    const queueItem = OfflineSalesSyncEngine.createOfflineTransaction(
      params.deviceId,
      params.userId,
      params.userName,
      params.companyId,
      params.branchId,
      'SALE',
      tempDocNumber,
      sequence,
      payload
    );

    const receipt: POSReceipt = {
      id: `rcpt-off-${Date.now()}`,
      tenantId: 'ten-001',
      companyId: params.companyId,
      branchId: params.branchId,
      warehouseId: 'wh-001',
      registerId: params.registerId,
      shiftId: params.shiftId,
      receiptNumber: tempDocNumber,
      transactionType: 'SALE',
      isWalkInCustomer: !params.customerId || params.customerId === 'cust-walkin',
      cashierId: params.userId,
      cashierName: params.userName,
      customerId: params.customerId || 'cust-walkin',
      customerName: params.customerName || 'Walk-in Retail Customer',
      lines: params.lines,
      subtotal: params.subtotal,
      discountTotal: 0,
      taxTotal: params.taxTotal,
      grandTotal: params.grandTotal,
      payments: params.payments,
      changeGiven: params.changeGiven,
      status: 'COMPLETED',
      sha256Seal: queueItem.encryptedChecksumSha256,
      createdAt: queueItem.timestamp
    };

    // Atomically persist to IndexedDB
    await this.dbService.enqueue(queueItem);
    await this.dbService.saveOfflineReceipt(receipt);

    return { queueItem, receipt };
  }

  /**
   * Record an offline POS return/refund
   */
  public async recordOfflineReturn(params: {
    deviceId: string;
    userId: string;
    userName: string;
    companyId: string;
    branchId: string;
    registerCode: string;
    originalReceiptNumber: string;
    customerId?: string;
    customerName?: string;
    lines: any[];
    refundGrandTotal: number;
    refundMethod: 'CASH' | 'ORIGINAL_PAYMENT_METHOD';
  }): Promise<{ queueItem: OfflineTransactionQueueItem; returnRecord: SalesReturn }> {
    const queue = await this.dbService.getQueue();
    const sequence = this.getNextSequence(queue);

    const tempDocNumber = OfflineSalesSyncEngine.generateTemporaryDocumentNumber(
      params.registerCode || 'REG01',
      'RETURN',
      sequence
    );

    const payload = {
      originalReceiptNumber: params.originalReceiptNumber,
      customerId: params.customerId || 'cust-walkin',
      customerName: params.customerName || 'Walk-in Retail Customer',
      lines: params.lines,
      refundGrandTotal: params.refundGrandTotal,
      refundMethod: params.refundMethod
    };

    const queueItem = OfflineSalesSyncEngine.createOfflineTransaction(
      params.deviceId,
      params.userId,
      params.userName,
      params.companyId,
      params.branchId,
      'RETURN',
      tempDocNumber,
      sequence,
      payload
    );

    const returnRecord: SalesReturn = {
      id: `ret-off-${Date.now()}`,
      tenantId: 'ten-001',
      companyId: params.companyId,
      branchId: params.branchId,
      returnNumber: tempDocNumber,
      returnType: 'PARTIAL_RETURN',
      originalDocumentType: 'POS_RECEIPT',
      originalDocumentNumber: params.originalReceiptNumber,
      customerId: params.customerId || 'cust-walkin',
      customerName: params.customerName || 'Walk-in Customer',
      lines: params.lines,
      refundSubtotal: params.refundGrandTotal / 1.15,
      refundTaxTotal: params.refundGrandTotal - (params.refundGrandTotal / 1.15),
      refundGrandTotal: params.refundGrandTotal,
      refundMethod: params.refundMethod,
      approvedBy: params.userId,
      status: 'COMPLETED',
      sha256Seal: queueItem.encryptedChecksumSha256,
      createdAt: queueItem.timestamp
    };

    await this.dbService.enqueue(queueItem);
    await this.dbService.saveOfflineReturn(returnRecord);

    return { queueItem, returnRecord };
  }

  /**
   * Record an offline cash collection / shift movement
   */
  public async recordOfflineCashMovement(params: {
    deviceId: string;
    userId: string;
    userName: string;
    companyId: string;
    branchId: string;
    registerCode: string;
    shiftId: string;
    type: 'CASH_DROP' | 'PETTY_EXPENSE' | 'CASH_ADD';
    amount: number;
    reason: string;
  }): Promise<{ queueItem: OfflineTransactionQueueItem; movement: POSShiftCashMovement }> {
    const queue = await this.dbService.getQueue();
    const sequence = this.getNextSequence(queue);

    const tempDocNumber = OfflineSalesSyncEngine.generateTemporaryDocumentNumber(
      params.registerCode || 'REG01',
      'CASH_COLLECTION',
      sequence
    );

    const payload = {
      shiftId: params.shiftId,
      type: params.type,
      amount: params.amount,
      reason: params.reason,
      tempDocNumber
    };

    const queueItem = OfflineSalesSyncEngine.createOfflineTransaction(
      params.deviceId,
      params.userId,
      params.userName,
      params.companyId,
      params.branchId,
      'CASH_COLLECTION',
      tempDocNumber,
      sequence,
      payload
    );

    const movement: POSShiftCashMovement = {
      id: `mov-off-${Date.now()}`,
      shiftId: params.shiftId,
      type: params.type === 'CASH_DROP' ? 'CASH_DROP' : params.type === 'PETTY_EXPENSE' ? 'PETTY_EXPENSE' : 'OPENING_FLOAT',
      amount: params.amount,
      currency: 'SAR',
      reason: params.reason,
      receiptNumber: tempDocNumber,
      performedBy: params.userId,
      performedByName: params.userName,
      timestamp: queueItem.timestamp
    };

    await this.dbService.enqueue(queueItem);
    await this.dbService.saveOfflineCashMovement(movement);

    return { queueItem, movement };
  }

  /**
   * Load entire queue state and summary counts
   */
  public async getQueueState(): Promise<{ items: OfflineTransactionQueueItem[]; summary: OfflineSyncSummary }> {
    const items = await this.dbService.getQueue();
    const summary: OfflineSyncSummary = {
      total: items.length,
      pendingCount: items.filter(i => i.syncStatus === 'QUEUED' || i.syncStatus === 'SYNCING').length,
      syncedCount: items.filter(i => i.syncStatus === 'SYNCED').length,
      conflictCount: items.filter(i => i.syncStatus === 'CONFLICT').length,
      failedCount: items.filter(i => i.syncStatus === 'FAILED').length
    };
    return { items, summary };
  }

  /**
   * Synchronize all pending items to the server
   */
  public async syncPendingQueue(options?: {
    deviceId?: string;
    userId?: string;
    companyId?: string;
    branchId?: string;
    customFetch?: (url: string, init: any) => Promise<any>;
  }): Promise<{ response: SyncBatchResponse; updatedItems: OfflineTransactionQueueItem[] }> {
    const pendingItems = await this.dbService.getPendingQueue();

    if (pendingItems.length === 0) {
      return {
        response: {
          batchId: `batch-empty-${Date.now()}`,
          processedAt: new Date().toISOString(),
          totalItems: 0,
          successCount: 0,
          duplicateCount: 0,
          conflictCount: 0,
          failureCount: 0,
          results: [],
          serverTimestamp: new Date().toISOString()
        },
        updatedItems: []
      };
    }

    // Set status to SYNCING in IndexedDB
    for (const item of pendingItems) {
      item.syncStatus = 'SYNCING';
      item.lastAttemptTimestamp = new Date().toISOString();
      await this.dbService.updateItem(item);
    }

    const firstItem = pendingItems[0];
    const batchRequest: SyncBatchRequest = {
      batchId: `batch-sync-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      deviceId: options?.deviceId || firstItem.deviceId || 'DEV-POS-01',
      userId: options?.userId || firstItem.userId || 'usr-001',
      companyId: options?.companyId || firstItem.companyId || 'comp-001',
      branchId: options?.branchId || firstItem.branchId || 'br-001',
      sentAt: new Date().toISOString(),
      items: pendingItems
    };

    let batchResponse: SyncBatchResponse;

    try {
      const fetchFn = options?.customFetch || (typeof fetch !== 'undefined' ? fetch : null);
      if (!fetchFn) {
        throw new Error('No HTTP fetch function available in this environment');
      }

      const res = await fetchFn('/api/v1/sales/sync/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchRequest)
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const body = await res.json();
      batchResponse = body.response || body;
    } catch (networkError: any) {
      // Mark all items as FAILED with retry count incremented
      for (const item of pendingItems) {
        item.syncStatus = 'FAILED';
        item.retryCount += 1;
        item.errorMessage = `Network failure: ${networkError.message}`;
        await this.dbService.updateItem(item);
      }

      return {
        response: {
          batchId: batchRequest.batchId,
          processedAt: new Date().toISOString(),
          totalItems: pendingItems.length,
          successCount: 0,
          duplicateCount: 0,
          conflictCount: 0,
          failureCount: pendingItems.length,
          results: pendingItems.map(item => ({
            localTransactionId: item.id,
            idempotencyKey: item.idempotencyKey,
            tempDocumentNumber: item.tempDocumentNumber,
            status: 'ERROR',
            message: networkError.message
          })),
          serverTimestamp: new Date().toISOString()
        },
        updatedItems: pendingItems
      };
    }

    // Process server results and persist updated states into IndexedDB
    const updatedItems: OfflineTransactionQueueItem[] = [];
    for (const result of batchResponse.results) {
      const item = pendingItems.find(i => i.id === result.localTransactionId || i.tempDocumentNumber === result.tempDocumentNumber);
      if (!item) continue;

      if (result.status === 'SUCCESS') {
        item.syncStatus = 'SYNCED';
        item.finalServerDocumentNumber = result.serverDocumentNumber;
        item.finalServerDocumentId = result.serverDocumentId;
        item.syncedAt = new Date().toISOString();
      } else if (result.status === 'DUPLICATE_IGNORED') {
        // Already posted previously; treat as successfully synchronized without repeating GL mutation
        item.syncStatus = 'SYNCED';
        item.syncedAt = new Date().toISOString();
      } else if (result.status === 'CONFLICT') {
        item.syncStatus = 'CONFLICT';
        item.conflictDetails = result.conflictDetails;
        item.errorMessage = result.message;
      } else if (result.status === 'ERROR') {
        item.syncStatus = 'FAILED';
        item.retryCount += 1;
        item.errorMessage = result.message;
      }

      await this.dbService.updateItem(item);
      updatedItems.push(item);
    }

    return { response: batchResponse, updatedItems };
  }

  /**
   * Retry an individual failed transaction
   */
  public async retryTransaction(id: string): Promise<{ success: boolean; item?: OfflineTransactionQueueItem }> {
    const item = await this.dbService.getItemById(id);
    if (!item) return { success: false };

    item.syncStatus = 'QUEUED';
    item.errorMessage = undefined;
    await this.dbService.updateItem(item);

    const syncResult = await this.syncPendingQueue({
      deviceId: item.deviceId,
      userId: item.userId,
      companyId: item.companyId,
      branchId: item.branchId
    });

    const updated = await this.dbService.getItemById(id);
    return { success: updated?.syncStatus === 'SYNCED', item: updated };
  }

  /**
   * Clear all SYNCED transactions from local storage
   */
  public async clearSyncedTransactions(): Promise<number> {
    return await this.dbService.clearSynced();
  }
}
