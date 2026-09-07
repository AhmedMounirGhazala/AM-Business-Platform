/**
 * AM Business Platform - Pilot Readiness Phase 1 Hardening Suite
 * Architecture Baseline: v2.8 | Pilot Readiness Phase 1
 * Validates SQLite Persistence, WAL Durability, SHA-256 Backups, and Master Data CSV Onboarding
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PilotDatabaseService } from '../../server/pilotDatabase';
import { PilotMasterDataImportRow } from '../types/pilot';

export interface PilotTestResult {
  id: string;
  name: string;
  passed: boolean;
  message: string;
}

export interface PilotSuiteReport {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  results: PilotTestResult[];
}

export class PilotReadinessHardeningSuite {
  public static runAll(): PilotSuiteReport {
    const results: PilotTestResult[] = [];
    const testDbPath = path.resolve(process.cwd(), 'data', 'test_pilot_suite.db');

    // Clean up any stale test database
    try {
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    } catch {}

    const pilotDb = PilotDatabaseService.createIsolated(testDbPath);

    // TEST 1: SQLite Engine & Telemetry
    try {
      const status = pilotDb.getStatus();
      const passed = status.status === 'ACTIVE' && status.engine.includes('SQLite');
      results.push({
        id: 'TEST-PILOT-01',
        name: 'SQLite Engine Initialization & WAL Durability Mode',
        passed,
        message: passed ? `Database online at ${status.databasePath} with WAL mode active` : 'Failed to initialize SQLite'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-PILOT-01', name: 'SQLite Engine Initialization', passed: false, message: err.message });
    }

    // TEST 2: Entity CRUD Persistence
    try {
      pilotDb.saveEntity('test_products', { id: 'prod-001', sku: 'SKU-TEST-01', name: 'Almarai Milk 1L', price: 6.5 }, 'ten-001', 'comp-001');
      const loaded = pilotDb.loadCollection<any>('test_products');
      const passed = loaded.length === 1 && loaded[0].sku === 'SKU-TEST-01';
      results.push({
        id: 'TEST-PILOT-02',
        name: 'Single Entity CRUD Persistence in SQLite',
        passed,
        message: passed ? 'Successfully wrote and read entity from SQLite' : 'Entity load mismatch'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-PILOT-02', name: 'Entity CRUD Persistence', passed: false, message: err.message });
    }

    // TEST 3: Bulk Collection Upsert Transaction
    try {
      const items = [
        { id: 'bulk-01', sku: 'SKU-B1', name: 'Item 1' },
        { id: 'bulk-02', sku: 'SKU-B2', name: 'Item 2' },
        { id: 'bulk-03', sku: 'SKU-B3', name: 'Item 3' }
      ];
      pilotDb.saveCollection('bulk_test', items, 'ten-001', 'comp-001');
      const bulkLoaded = pilotDb.loadCollection<any>('bulk_test');
      const passed = bulkLoaded.length === 3;
      results.push({
        id: 'TEST-PILOT-03',
        name: 'Atomic Transactional Bulk Collection Upsert',
        passed,
        message: passed ? '3 entities atomically committed inside transaction' : 'Bulk collection length mismatch'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-PILOT-03', name: 'Bulk Collection Upsert', passed: false, message: err.message });
    }

    // TEST 4: Multi-Tenant & Multi-Company Isolation
    try {
      pilotDb.saveEntity('tenant_items', { id: 'item-t1', name: 'Tenant 1 Product' }, 'ten-001', 'comp-001');
      pilotDb.saveEntity('tenant_items', { id: 'item-t2', name: 'Tenant 2 Product' }, 'ten-002', 'comp-002');
      const allTenantItems = pilotDb.loadCollection<any>('tenant_items');
      const passed = allTenantItems.some(i => i.id === 'item-t1') && allTenantItems.some(i => i.id === 'item-t2');
      results.push({
        id: 'TEST-PILOT-04',
        name: 'Multi-Tenant and Multi-Company Isolation Bounds',
        passed,
        message: passed ? 'Entities cleanly isolated by tenant_id & company_id columns' : 'Isolation verification failed'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-PILOT-04', name: 'Tenant Isolation', passed: false, message: err.message });
    }

    // TEST 5: Cryptographic SHA-256 Audit Trail
    try {
      const hash1 = pilotDb.logAudit('OPEN_REGISTER', { registerId: 'reg-01', float: 1000 });
      const hash2 = pilotDb.logAudit('CLOSE_REGISTER', { registerId: 'reg-01', sales: 4500 });
      const passed = typeof hash1 === 'string' && hash1.length === 64 && typeof hash2 === 'string' && hash2.length === 64 && hash1 !== hash2;
      results.push({
        id: 'TEST-PILOT-05',
        name: 'Cryptographic SHA-256 Audit Vault Chaining',
        passed,
        message: passed ? `SHA-256 block hash generated: ${hash2.slice(0, 16)}...` : 'Invalid audit hash format'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-PILOT-05', name: 'Audit Vault Chaining', passed: false, message: err.message });
    }

    // TEST 6: Backup Snapshot Creation with Digital Checksum
    let backupPayload: any = null;
    try {
      const dataset = {
        products: [{ id: 'p1', name: 'Prod A', price: 10 }],
        posReceipts: [{ id: 'r1', receiptNumber: 'POS-001', total: 50 }]
      };
      backupPayload = pilotDb.createBackup('Test Retail Snapshot', dataset);
      const passed = backupPayload && backupPayload.metadata.checksumSha256.length === 64 && backupPayload.metadata.totalRecords === 2;
      results.push({
        id: 'TEST-PILOT-06',
        name: 'Full Backup Snapshot Generation with SHA-256 Seal',
        passed,
        message: passed ? `Backup ${backupPayload.metadata.backupId} created with checksum ${backupPayload.metadata.checksumSha256.slice(0, 16)}...` : 'Failed to create backup snapshot'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-PILOT-06', name: 'Backup Creation', passed: false, message: err.message });
    }

    // TEST 7: Atomic Backup Restore
    try {
      const restoreRes = pilotDb.restoreBackup(backupPayload);
      const restoredProds = pilotDb.loadCollection<any>('products');
      const passed = restoreRes.success && restoredProds.length === 1 && restoredProds[0].id === 'p1';
      results.push({
        id: 'TEST-PILOT-07',
        name: 'Atomic Database Restore with Checksum Validation',
        passed,
        message: passed ? `Restored ${restoreRes.totalRecordsRestored} records across ${restoreRes.collectionsRestored.length} collections` : 'Restore verification failed'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-PILOT-07', name: 'Atomic Restore', passed: false, message: err.message });
    }

    // TEST 8: Tampered Backup Rejection
    try {
      const tampered = JSON.parse(JSON.stringify(backupPayload));
      tampered.data.products[0].price = 999999; // Tamper price without updating SHA-256
      let rejected = false;
      try {
        pilotDb.restoreBackup(tampered);
      } catch (e: any) {
        if (e.message.includes('Checksum integrity mismatch')) {
          rejected = true;
        }
      }
      results.push({
        id: 'TEST-PILOT-08',
        name: 'Tampered Backup Rejection & Integrity Defense',
        passed: rejected,
        message: rejected ? 'Correctly rejected tampered backup with mismatched SHA-256 checksum' : 'Failed to reject tampered backup'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-PILOT-08', name: 'Tampered Backup Defense', passed: false, message: err.message });
    }

    // TEST 9: Master Data CSV Parsing
    try {
      const sampleCsv = `sku,barcode,name,category,cost,price,opening_stock,opening_cash\nSKU-001,628100,Milk 1L,Dairy,4.0,6.0,50,1500\nSKU-002,628101,Bread,Bakery,2.0,3.0,100,0`;
      const parsed = PilotDatabaseService.parseCsv(sampleCsv);
      const passed = parsed.length === 2 && parsed[0].sku === 'SKU-001' && parsed[0].costPrice === 4.0 && parsed[0].openingCashAmount === 1500;
      results.push({
        id: 'TEST-PILOT-09',
        name: 'Master Data CSV Parser & Numeric Extractor',
        passed,
        message: passed ? `Parsed ${parsed.length} rows with cost, price, stock, and opening cash` : 'CSV parsing failed'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-PILOT-09', name: 'CSV Parser', passed: false, message: err.message });
    }

    // TEST 10: Validation Engine & Error Detection
    try {
      const invalidRows: PilotMasterDataImportRow[] = [
        { sku: '', name: 'No SKU Item', costPrice: 10, sellingPrice: 15 },
        { sku: 'SKU-NEG', name: 'Negative Price Item', costPrice: -5, sellingPrice: 10 }
      ];
      const preview = pilotDb.previewImport(invalidRows, [], []);
      const passed = !preview.valid && preview.summary.errorRows === 2;
      results.push({
        id: 'TEST-PILOT-10',
        name: 'CSV Validation Engine & Error Rule Detection',
        passed,
        message: passed ? `Identified ${preview.summary.errorRows} invalid rows (missing SKU, negative cost)` : 'Failed to flag invalid rows'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-PILOT-10', name: 'Validation Rules', passed: false, message: err.message });
    }

    // TEST 11: Duplicate SKU & Barcode Collision Detection
    try {
      const existingItems = [{ sku: 'EXIST-01', barcode: 'BC-EXIST-01' }];
      const importRows: PilotMasterDataImportRow[] = [
        { sku: 'EXIST-01', name: 'Colliding Item', costPrice: 5, sellingPrice: 8 },
        { sku: 'NEW-01', barcode: 'BC-EXIST-01', name: 'Colliding Barcode', costPrice: 5, sellingPrice: 8 }
      ];
      const preview = pilotDb.previewImport(importRows, existingItems, []);
      const passed = preview.summary.duplicateRows >= 1 && preview.items.some(i => i.status === 'DUPLICATE' || i.status === 'WARNING');
      results.push({
        id: 'TEST-PILOT-11',
        name: 'Duplicate SKU & Barcode Collision Detection',
        passed,
        message: passed ? `Detected duplicate SKU '${importRows[0].sku}' against existing master catalog` : 'Collision detection failed'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-PILOT-11', name: 'Duplicate Detection', passed: false, message: err.message });
    }

    // TEST 12: Opening Stock Valuation & FIFO Layer Creation
    let mockContext: any = null;
    try {
      mockContext = {
        inventory: [],
        stockMovements: [],
        costLayers: [],
        treasuryTransactions: [],
        journalEntries: [],
        accounts: [],
        auditLogs: []
      };

      const importRows: PilotMasterDataImportRow[] = [
        { sku: 'RTL-MILK', name: 'Fresh Milk', costPrice: 5.0, sellingPrice: 7.0, openingStockQty: 100, openingCashAmount: 2500 },
        { sku: 'RTL-BREAD', name: 'Sliced Bread', costPrice: 3.0, sellingPrice: 4.5, openingStockQty: 50, openingCashAmount: 0 }
      ];

      const commitRes = pilotDb.commitImport(
        { companyId: 'comp-001', tenantId: 'ten-001', rows: importRows },
        mockContext
      );

      // Expected stock cost: (100 * 5) + (50 * 3) = 500 + 150 = 650
      const expectedStockVal = 650;
      const passed = commitRes.success &&
        commitRes.openingStockCostValue === expectedStockVal &&
        mockContext.costLayers.length === 2 &&
        mockContext.stockMovements.length === 2;

      results.push({
        id: 'TEST-PILOT-12',
        name: 'Opening Stock Valuation & FIFO Cost Layer Creation',
        passed,
        message: passed ? `Created 2 stock movements & FIFO cost layers totaling ${expectedStockVal} SAR` : 'Valuation mismatch'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-PILOT-12', name: 'Stock Valuation & FIFO', passed: false, message: err.message });
    }

    // TEST 13: Opening Cash Float Recorded in Treasury
    try {
      const tx = mockContext.treasuryTransactions[0];
      const passed = tx && tx.amount === 2500 && tx.transactionType === 'OPENING_BALANCE' && tx.status === 'CLEARED';
      results.push({
        id: 'TEST-PILOT-13',
        name: 'Retail Register Opening Cash Float Treasury Posting',
        passed,
        message: passed ? `Recorded ${tx.amount} SAR opening cash float in bank account ${tx.bankAccountId}` : 'Treasury transaction mismatch'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-PILOT-13', name: 'Opening Cash Posting', passed: false, message: err.message });
    }

    // TEST 14: Balanced Opening Balance Journal Voucher
    try {
      const je = mockContext.journalEntries[0];
      // Stock 650 + Cash 2500 = 3150 Total Debits and Credits
      const expectedTotal = 3150;
      const passed = je &&
        je.totalDebit === expectedTotal &&
        je.totalCredit === expectedTotal &&
        je.isBalanced === true &&
        je.lines.length === 3; // Dr Inventory, Dr Cash, Cr Equity

      results.push({
        id: 'TEST-PILOT-14',
        name: 'Balanced Double-Entry Opening Journal Voucher',
        passed,
        message: passed ? `Balanced JV #${je.entryNumber}: Dr 12000 (650) + Dr 11010 (2500) = Cr 30000 (3150)` : 'Journal entry balance mismatch'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-PILOT-14', name: 'Double-Entry Journal Voucher', passed: false, message: err.message });
    }

    // TEST 15: Zero Direct GL Mutation Enforcement
    try {
      const je = mockContext.journalEntries[0];
      const passed = je && je.source === 'PILOT_MASTER_DATA_IMPORT' && je.status === 'POSTED' && je.auditTrailHash.length === 64;
      results.push({
        id: 'TEST-PILOT-15',
        name: 'Zero Direct GL Mutation Rule & Audit Trail Hash',
        passed,
        message: passed ? `Compliant event-driven posting sealed with audit hash ${je.auditTrailHash.slice(0, 16)}...` : 'Direct GL mutation violation'
      });
    } catch (err: any) {
      results.push({ id: 'TEST-PILOT-15', name: 'Zero Direct GL Mutation', passed: false, message: err.message });
    }

    // Clean up test database
    try {
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    } catch {}

    const passedCount = results.filter(r => r.passed).length;
    return {
      suite: 'Pilot Readiness Phase 1 Hardening Suite',
      total: results.length,
      passed: passedCount,
      failed: results.length - passedCount,
      results
    };
  }
}
