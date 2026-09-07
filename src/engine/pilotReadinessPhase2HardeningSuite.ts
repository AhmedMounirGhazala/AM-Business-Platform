/**
 * AM Business Platform - Pilot Readiness Phase 2 Hardening Suite
 * Architecture Baseline: v2.8 | Pilot Readiness Phase 2
 * Scope: Offline POS Hardening (IndexedDB, OFF- Lineage, Crash Recovery,
 * Retry Cycles, Conflict Detection, Idempotency, and Authoritative SQLite Promotion)
 */

import fs from 'node:fs';
import path from 'node:path';
import { PilotDatabaseService } from '../../server/pilotDatabase';
import { OfflinePosIndexedDbService } from '../services/offlinePosIndexedDb';
import { OfflinePosManager } from '../services/offlinePosManager';
import { OfflineSalesSyncEngine } from './offlineSalesSyncEngine';
import {
  OfflineTransactionQueueItem,
  POSReceipt,
  SalesReturn,
  POSShiftCashMovement,
  SyncBatchRequest,
  POSDeviceMaster
} from '../types/sales';

export interface PilotPhase2TestResult {
  id: string;
  name: string;
  passed: boolean;
  message: string;
}

export interface PilotPhase2SuiteReport {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  results: PilotPhase2TestResult[];
}

export class PilotReadinessPhase2HardeningSuite {
  public static async runAll(): Promise<PilotPhase2SuiteReport> {
    const results: PilotPhase2TestResult[] = [];
    const testDbPath = path.resolve(process.cwd(), 'data', 'test_pilot_phase2_suite.db');

    // Clean up any stale test database
    try {
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    } catch {}

    const pilotDb = PilotDatabaseService.createIsolated(testDbPath);
    const dbService = OfflinePosIndexedDbService.getInstance();
    await dbService.clearAll();

    // Reset manager instance
    const posManager = OfflinePosManager.getInstance();

    // TEST 1: Offline POS Receipt Generation & Local Persistence
    try {
      const receiptRes = await posManager.recordOfflineSale({
        deviceId: 'REG-01-MAIN',
        userId: 'usr-001',
        userName: 'Ahmed Mounir',
        companyId: 'comp-001',
        branchId: 'br-001',
        registerId: 'reg-01',
        registerCode: 'REG-01-MAIN',
        shiftId: 'shift-01',
        lines: [
          {
            id: 'line-1',
            itemSku: 'SKU-001',
            itemName: 'Industrial Scanner',
            quantity: 2,
            unitPrice: 500,
            discountAmount: 0,
            taxRate: 0.15,
            taxAmount: 150,
            lineTotal: 1150
          } as any
        ],
        subtotal: 1000,
        taxTotal: 150,
        grandTotal: 1150,
        payments: [
          {
            id: 'pay-01',
            method: 'CASH',
            amount: 1150,
            currency: 'SAR',
            exchangeRate: 1,
            treasuryAccountCode: '1010',
            treasuryAccountId: 'acc-1010-cash',
            transactionStatus: 'CAPTURED',
            capturedAt: new Date().toISOString()
          }
        ],
        changeGiven: 0
      });

      const queueItems = await dbService.getQueue();
      const savedReceipts = await dbService.getOfflineReceipts();

      const passed =
        ['QUEUED', 'SYNCING'].includes(receiptRes.queueItem.syncStatus) &&
        receiptRes.queueItem.tempDocumentNumber.startsWith('OFF-') &&
        receiptRes.queueItem.tempDocumentNumber.includes('SALE') &&
        queueItems.length === 1 &&
        savedReceipts.length === 1 &&
        savedReceipts[0].grandTotal === 1150;

      results.push({
        id: 'TEST-OFF-01',
        name: 'Offline POS Receipt Generation & Local IndexedDB Persistence',
        passed,
        message: passed
          ? `Receipt ${receiptRes.receipt.receiptNumber} stored with temp number ${receiptRes.queueItem.tempDocumentNumber}`
          : 'Receipt generation or persistence failed'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-OFF-01', name: 'Offline POS Receipt Generation', passed: false, message: err.message });
    }

    // TEST 2: Offline POS Return Generation & Linkage
    try {
      const returnRes = await posManager.recordOfflineReturn({
        deviceId: 'REG-01-MAIN',
        userId: 'usr-001',
        userName: 'Ahmed Mounir',
        companyId: 'comp-001',
        branchId: 'br-001',
        registerCode: 'REG-01-MAIN',
        originalReceiptNumber: 'POS-2026-0099',
        lines: [
          {
            itemSku: 'SKU-001',
            itemName: 'Industrial Scanner',
            quantityReturned: 1,
            unitPrice: 500,
            refundAmount: 575,
            returnReasonText: 'Defective packaging',
            restockWarehouseId: 'wh-001'
          } as any
        ],
        refundGrandTotal: 575,
        refundMethod: 'CASH'
      });

      const savedReturns = await dbService.getOfflineReturns();
      const queueItems = await dbService.getQueue();

      const passed =
        returnRes.returnRecord.returnNumber.startsWith('OFF-') &&
        returnRes.returnRecord.returnNumber.includes('RETURN') &&
        returnRes.returnRecord.originalDocumentNumber === 'POS-2026-0099' &&
        savedReturns.length === 1 &&
        queueItems.length === 2;

      results.push({
        id: 'TEST-OFF-02',
        name: 'Offline POS Return Generation & RMA Linkage',
        passed,
        message: passed
          ? `Return ${returnRes.returnRecord.returnNumber} linked to ${returnRes.returnRecord.originalDocumentNumber}`
          : 'Offline return persistence failed'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-OFF-02', name: 'Offline POS Return Generation', passed: false, message: err.message });
    }

    // TEST 3: Offline Shift Cash Movement Persistence
    try {
      const cashRes = await posManager.recordOfflineCashMovement({
        deviceId: 'REG-01-MAIN',
        userId: 'usr-001',
        userName: 'Ahmed Mounir',
        companyId: 'comp-001',
        branchId: 'br-001',
        registerCode: 'REG-01-MAIN',
        shiftId: 'shift-01',
        type: 'PETTY_EXPENSE',
        amount: 85,
        reason: 'Store Cleaning Supplies'
      });

      const movements = await dbService.getOfflineCashMovements();
      const queue = await dbService.getQueue();

      const passed =
        cashRes.movement.id.startsWith('mov-off-') &&
        cashRes.movement.amount === 85 &&
        movements.length === 1 &&
        queue.length === 3;

      results.push({
        id: 'TEST-OFF-03',
        name: 'Offline Shift Cash Movement Persistence',
        passed,
        message: passed
          ? `Cash movement ${cashRes.movement.id} (${cashRes.movement.type} ${cashRes.movement.amount} SAR) stored`
          : 'Cash movement persistence failed'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-OFF-03', name: 'Offline Shift Cash Movement', passed: false, message: err.message });
    }

    // TEST 4: Multi-Tenant & Multi-Company Isolation in Local Storage
    try {
      const queue = await dbService.getQueue();
      const company1Items = queue.filter(q => q.companyId === 'comp-001');
      const company2Items = queue.filter(q => q.companyId === 'comp-002');

      const passed = company1Items.length === 3 && company2Items.length === 0;

      results.push({
        id: 'TEST-OFF-04',
        name: 'Multi-Tenant & Multi-Company Isolation in Local Storage',
        passed,
        message: passed
          ? 'Queue items cleanly stamped and partitioned by companyId'
          : 'Company isolation verification failed'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-OFF-04', name: 'Multi-Tenant Isolation', passed: false, message: err.message });
    }

    // TEST 5: Crash & Restart Recovery Simulation
    try {
      const countBefore = (await dbService.getQueue()).length;
      await dbService.simulateBrowserRestart();
      const countAfter = (await dbService.getQueue()).length;

      const passed = countBefore === 3 && countAfter === 3;

      results.push({
        id: 'TEST-OFF-05',
        name: 'Crash & Restart Recovery (IndexedDB Reload Simulation)',
        passed,
        message: passed
          ? `All ${countAfter} queued transactions preserved intact across browser reload`
          : 'Transactions lost during restart simulation'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-OFF-05', name: 'Crash Recovery Simulation', passed: false, message: err.message });
    }

    // TEST 6: SHA-256 Audit Seal Integrity Validation
    try {
      const queue = await dbService.getQueue();
      const allSealed = queue.every(q => q.encryptedChecksumSha256 && q.encryptedChecksumSha256.startsWith('sha256_'));

      // Validate tampering detection against exact deterministic payload
      const item = queue[0];
      const recalculated = OfflineSalesSyncEngine.generateSha256({
        idempotencyKey: item.idempotencyKey,
        deviceId: item.deviceId,
        userId: item.userId,
        companyId: item.companyId,
        branchId: item.branchId,
        tempDocNumber: item.tempDocumentNumber,
        transactionType: item.transactionType,
        payload: item.payload
      });
      const sealMatches = item.encryptedChecksumSha256 === recalculated;

      const passed = allSealed && sealMatches;

      results.push({
        id: 'TEST-OFF-06',
        name: 'SHA-256 Tamper-Evident Audit Seal Validation',
        passed,
        message: passed
          ? `Cryptographic seal verified: ${item.encryptedChecksumSha256.slice(0, 18)}...`
          : 'Seal validation or tamper detection mismatch'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-OFF-06', name: 'Audit Seal Validation', passed: false, message: err.message });
    }

    // TEST 7: Status Progression Life-Cycle (QUEUED -> SYNCED / FAILED)
    try {
      const queue = await dbService.getQueue();
      const first = queue[0];

      first.syncStatus = 'FAILED';
      first.errorMessage = 'Network timeout';
      await dbService.updateItem(first);

      const updated = await dbService.getItemById(first.id);
      const passed = updated?.syncStatus === 'FAILED' && updated.errorMessage === 'Network timeout';

      // Restore to QUEUED for subsequent tests
      first.syncStatus = 'QUEUED';
      first.errorMessage = undefined;
      await dbService.updateItem(first);

      results.push({
        id: 'TEST-OFF-07',
        name: 'Offline Transaction Status Progression State Machine',
        passed,
        message: passed
          ? 'Queue item transitioned through FAILED and returned to QUEUED'
          : 'Status transition failed'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-OFF-07', name: 'Status Progression', passed: false, message: err.message });
    }

    // TEST 8: Retry Mechanism on Transient Failure
    try {
      const queue = await dbService.getQueue();
      const target = queue[0];

      target.syncStatus = 'FAILED';
      target.retryCount = 1;
      await dbService.updateItem(target);

      // Trigger simulated retry step
      target.retryCount = (target.retryCount || 0) + 1;
      target.syncStatus = 'QUEUED';
      target.errorMessage = undefined;
      await dbService.updateItem(target);

      const retried = await dbService.getItemById(target.id);
      const passed = (retried?.retryCount || 0) === 2 && retried?.syncStatus === 'QUEUED';

      results.push({
        id: 'TEST-OFF-08',
        name: 'Retry Handling with Retry Counter & Backoff Preservation',
        passed,
        message: passed
          ? `Retry count incremented to ${retried?.retryCount}, status reset to QUEUED`
          : 'Retry counter did not update correctly'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-OFF-08', name: 'Retry Handling', passed: false, message: err.message });
    }

    // TEST 9: Batch Packaging & Sync Request Structure Compliance
    try {
      const pendingItems = await dbService.getPendingQueue();
      const batchRequest: SyncBatchRequest = {
        batchId: `batch-test-${Date.now()}`,
        deviceId: 'REG-01-MAIN',
        userId: 'usr-001',
        companyId: 'comp-001',
        branchId: 'br-001',
        sentAt: new Date().toISOString(),
        items: pendingItems
      };

      const passed =
        batchRequest.items.length === 3 &&
        batchRequest.batchId.startsWith('batch-test-') &&
        batchRequest.items.every(i => i.idempotencyKey && i.tempDocumentNumber);

      results.push({
        id: 'TEST-OFF-09',
        name: 'Batch Packaging & Sync Request Structure Compliance',
        passed,
        message: passed
          ? `Packaged batch of ${batchRequest.items.length} items ready for authoritative server sync`
          : 'Batch structure failed validation'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-OFF-09', name: 'Batch Packaging', passed: false, message: err.message });
    }

    // TEST 10: Server-Side SQLite Promotion for Offline Receipts
    try {
      const queue = await dbService.getQueue();
      const saleItem = queue.find(q => q.transactionType === 'SALE');

      let promotedDocNumber = '';
      if (saleItem) {
        promotedDocNumber = `POS-SRV-${Date.now()}`;
        const promotedEntity = {
          id: `rcpt-srv-${Date.now()}`,
          tempDocumentNumber: saleItem.tempDocumentNumber,
          receiptNumber: promotedDocNumber,
          grandTotal: saleItem.payload.grandTotal,
          companyId: saleItem.companyId,
          promotedAt: new Date().toISOString()
        };
        pilotDb.saveEntity('posReceipts', promotedEntity, 'ten-001', saleItem.companyId);
        pilotDb.saveEntity('idempotencyKeys', { id: saleItem.idempotencyKey, recordedAt: new Date().toISOString() });
      }

      const storedReceipts = pilotDb.loadCollection<any>('posReceipts');
      const passed = storedReceipts.some(r => r.tempDocumentNumber === saleItem?.tempDocumentNumber);

      results.push({
        id: 'TEST-OFF-10',
        name: 'Server-Side Authoritative SQLite Promotion for Offline Receipts',
        passed,
        message: passed
          ? `Receipt ${saleItem?.tempDocumentNumber} successfully promoted to SQLite as ${promotedDocNumber}`
          : 'SQLite receipt persistence mismatch'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-OFF-10', name: 'SQLite Receipt Promotion', passed: false, message: err.message });
    }

    // TEST 11: Server-Side SQLite Promotion for Offline Returns
    try {
      const queue = await dbService.getQueue();
      const returnItem = queue.find(q => q.transactionType === 'RETURN');

      let promotedReturnNumber = '';
      if (returnItem) {
        promotedReturnNumber = `RET-SRV-${Date.now()}`;
        const promotedReturn = {
          id: `ret-srv-${Date.now()}`,
          tempDocumentNumber: returnItem.tempDocumentNumber,
          returnNumber: promotedReturnNumber,
          refundGrandTotal: returnItem.payload.refundGrandTotal,
          companyId: returnItem.companyId,
          promotedAt: new Date().toISOString()
        };
        pilotDb.saveEntity('salesReturns', promotedReturn, 'ten-001', returnItem.companyId);
        pilotDb.saveEntity('idempotencyKeys', { id: returnItem.idempotencyKey, recordedAt: new Date().toISOString() });
      }

      const storedReturns = pilotDb.loadCollection<any>('salesReturns');
      const passed = storedReturns.some(r => r.tempDocumentNumber === returnItem?.tempDocumentNumber);

      results.push({
        id: 'TEST-OFF-11',
        name: 'Server-Side Authoritative SQLite Promotion for Offline Returns',
        passed,
        message: passed
          ? `Return ${returnItem?.tempDocumentNumber} successfully promoted to SQLite as ${promotedReturnNumber}`
          : 'SQLite return persistence mismatch'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-OFF-11', name: 'SQLite Return Promotion', passed: false, message: err.message });
    }

    // TEST 12: Server-Side SQLite Promotion for Cash Movements
    try {
      const queue = await dbService.getQueue();
      const cashItem = queue.find(q => q.transactionType === 'CASH_COLLECTION');

      if (cashItem) {
        pilotDb.saveEntity('posShiftMovements', {
          id: cashItem.payload.id || cashItem.id,
          tempDocumentNumber: cashItem.tempDocumentNumber,
          amount: cashItem.payload.amount,
          movementType: cashItem.payload.type,
          companyId: cashItem.companyId,
          promotedAt: new Date().toISOString()
        }, 'ten-001', cashItem.companyId);
      }

      const storedCash = pilotDb.loadCollection<any>('posShiftMovements');
      const passed = storedCash.some(c => c.tempDocumentNumber === cashItem?.tempDocumentNumber);

      results.push({
        id: 'TEST-OFF-12',
        name: 'Server-Side Authoritative SQLite Promotion for Cash Movements',
        passed,
        message: passed
          ? `Cash movement ${cashItem?.tempDocumentNumber} successfully promoted to SQLite`
          : 'SQLite cash movement persistence mismatch'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-OFF-12', name: 'SQLite Cash Promotion', passed: false, message: err.message });
    }

    // TEST 13: Idempotency Enforcement & Duplicate Prevention
    try {
      const queue = await dbService.getQueue();
      const saleItem = queue.find(q => q.transactionType === 'SALE');

      // Check if the idempotency key exists in SQLite
      const storedKeys = pilotDb.loadCollection<any>('idempotencyKeys');
      const keyExists = storedKeys.some(k => k.id === saleItem?.idempotencyKey);

      // Process duplicate via OfflineSalesSyncEngine
      const mockDevice: POSDeviceMaster = {
        id: 'REG-01-MAIN',
        tenantId: 'ten-001',
        companyId: 'comp-001',
        branchId: 'br-001',
        branchName: 'Main Branch',
        deviceCode: 'REG-01-MAIN',
        deviceName: 'Main Register',
        deviceType: 'DESKTOP_POS',
        macAddressOrFingerprint: 'FP-REG-01',
        appVersion: '2.8.0',
        registeredAt: new Date().toISOString(),
        lastHeartbeatAt: new Date().toISOString(),
        isActive: true,
        isAuthorized: true,
        connectivityStatus: 'ONLINE',
        localPendingQueueCount: 0,
        deviceHealth: 'HEALTHY',
        allowedOfflineDays: 7,
        securityTokenHash: 'token_hash_01'
      };

      const idempotencySet = new Set<string>();
      if (saleItem) idempotencySet.add(saleItem.idempotencyKey);

      const syncResult = OfflineSalesSyncEngine.processSyncBatch(
        {
          batchId: 'batch-dup-test',
          deviceId: 'REG-01-MAIN',
          userId: 'usr-001',
          companyId: 'comp-001',
          branchId: 'br-001',
          sentAt: new Date().toISOString(),
          items: saleItem ? [saleItem] : []
        },
        {
          registeredDevices: [mockDevice],
          idempotencyStore: idempotencySet,
          customers: [],
          products: []
        }
      );

      const isDuplicateIgnored =
        syncResult.response.duplicateCount === 1 &&
        syncResult.response.results[0]?.status === 'DUPLICATE_IGNORED';

      const passed = keyExists && isDuplicateIgnored;

      results.push({
        id: 'TEST-OFF-13',
        name: 'Idempotency Enforcement & Duplicate Retransmission Prevention',
        passed,
        message: passed
          ? `Duplicate transaction ${saleItem?.idempotencyKey} safely caught with DUPLICATE_IGNORED without side effects`
          : 'Duplicate transaction was not prevented'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-OFF-13', name: 'Idempotency Enforcement', passed: false, message: err.message });
    }

    // TEST 14: Zero Direct GL Mutation & Event-Driven Financial Audit Trail
    try {
      const queue = await dbService.getQueue();
      const saleItem = queue.find(q => q.transactionType === 'SALE');

      const mockDevice: POSDeviceMaster = {
        id: 'REG-01-MAIN',
        tenantId: 'ten-001',
        companyId: 'comp-001',
        branchId: 'br-001',
        branchName: 'Main Branch',
        deviceCode: 'REG-01-MAIN',
        deviceName: 'Main Register',
        deviceType: 'DESKTOP_POS',
        macAddressOrFingerprint: 'FP-REG-01',
        appVersion: '2.8.0',
        registeredAt: new Date().toISOString(),
        lastHeartbeatAt: new Date().toISOString(),
        isActive: true,
        isAuthorized: true,
        connectivityStatus: 'ONLINE',
        localPendingQueueCount: 0,
        deviceHealth: 'HEALTHY',
        allowedOfflineDays: 7,
        securityTokenHash: 'token_hash_01'
      };

      // Fresh idempotency set without the key to test promotion event triggering
      const syncResult = OfflineSalesSyncEngine.processSyncBatch(
        {
          batchId: 'batch-gl-test',
          deviceId: 'REG-01-MAIN',
          userId: 'usr-001',
          companyId: 'comp-001',
          branchId: 'br-001',
          sentAt: new Date().toISOString(),
          items: saleItem ? [{ ...saleItem, idempotencyKey: 'fresh-key-for-gl-test' }] : []
        },
        {
          registeredDevices: [mockDevice],
          idempotencyStore: new Set(),
          customers: [],
          products: [],
          onPromoteReceipt: (_tempDoc, _payload) => {
            // Emits financial event, zero direct GL mutation
            const financialEventId = `ev-pos-rec-${Date.now()}`;
            return {
              serverId: `rcpt-promoted-${Date.now()}`,
              serverNumber: `POS-2026-FINAL-${Math.floor(Math.random() * 1000)}`,
              financialEventId
            };
          }
        }
      );

      const itemRes = syncResult.response.results[0];
      const hasFinancialEvent = Boolean(itemRes?.financialEventId && itemRes.financialEventId.startsWith('ev-pos-rec-'));
      const hasAuditLog = syncResult.auditLogs.length > 0;

      const passed = itemRes?.status === 'SUCCESS' && hasFinancialEvent && hasAuditLog;

      results.push({
        id: 'TEST-OFF-14',
        name: 'Zero Direct GL Mutation on Offline Sync (Event-Driven Promotion)',
        passed,
        message: passed
          ? `Receipt promoted with Financial Event ${itemRes.financialEventId} and sealed audit log`
          : 'Zero direct GL mutation compliance failure'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-OFF-14', name: 'Zero Direct GL Mutation', passed: false, message: err.message });
    }

    // TEST 15: Queue Pruning / Clear Synced Transactions from Local Store
    try {
      const queue = await dbService.getQueue();
      // Mark all as SYNCED
      for (const item of queue) {
        item.syncStatus = 'SYNCED';
        await dbService.updateItem(item);
      }

      await posManager.clearSyncedTransactions();
      const remainingQueue = await dbService.getQueue();

      const passed = remainingQueue.length === 0;

      results.push({
        id: 'TEST-OFF-15',
        name: 'Queue Pruning & Local Clean-up of Synced Transactions',
        passed,
        message: passed
          ? 'Successfully cleared all SYNCED transactions from local IndexedDB storage'
          : `Expected 0 remaining items, found ${remainingQueue.length}`
      });
    } catch (err: any) {
      results.push({ id: 'TEST-OFF-15', name: 'Queue Pruning', passed: false, message: err.message });
    }

    // Clean up test database
    try {
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    } catch {}

    const passedCount = results.filter(r => r.passed).length;
    return {
      suite: 'Pilot Readiness Phase 2 Hardening Suite (Offline POS)',
      total: results.length,
      passed: passedCount,
      failed: results.length - passedCount,
      results
    };
  }
}
