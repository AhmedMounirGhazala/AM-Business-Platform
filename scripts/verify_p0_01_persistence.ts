/**
 * AM BUSINESS PLATFORM — PILOT VERIFICATION SUITE
 * TASK P0-01: UNIVERSAL DURABLE PERSISTENCE
 * 
 * Verifies end-to-end restart survival, write-through reactivity,
 * atomic transactions, and mock decoupling across the SQLite System of Record.
 */

import { PilotDatabaseService } from '../server/pilotDatabase';
import {
  initDurableCollection,
  persistEntity,
  deletePersistedEntity,
  executeTransaction,
  makeDurableArray,
  makeDurableEntity
} from '../server/persistenceRegistry';
import { MasterDataService } from '../src/engine/masterDataService';
import { SupplierInvitationEngine } from '../src/engine/supplierInvitationEngine';
import { SupplierQuotationEngine } from '../src/engine/supplierQuotationEngine';
import { AttachmentEngine } from '../src/engine/attachmentEngine';
import { CommentEngine } from '../src/engine/commentEngine';
import { RestaurantTable, KitchenDisplayOrder, KitchenWasteRecord, CRMTicket, ProjectTimesheet, DocumentAttachment, ActivityLog, DocumentComment } from '../src/types';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, name: string, details?: string) {
  if (!condition) {
    results.push({ suite, name, passed: false, details: details || 'Assertion failed' });
    console.error(`❌ [FAIL] ${suite} -> ${name}: ${details || ''}`);
  } else {
    results.push({ suite, name, passed: true });
    console.log(`✅ [PASS] ${suite} -> ${name}`);
  }
}

async function runUniversalPersistenceVerification() {
  console.log('\n========================================================');
  console.log('AM ENTERPRISE ERP — TASK P0-01 DURABLE PERSISTENCE SUITE');
  console.log('========================================================\n');

  const testDb = PilotDatabaseService.getInstance();

  // ----------------------------------------------------
  // SUITE 1: Basic Reactive Array & Property Persistence
  // ----------------------------------------------------
  const suite1 = 'SUITE 1: Reactive Write-Through';
  let memoryInventory: any[] = [];
  const durableInventory = initDurableCollection('test_inventory', memoryInventory, testDb);

  const testItem = {
    id: `ITEM-TEST-${Date.now()}`,
    name: 'Industrial Valve 50mm',
    sku: 'SKU-VLV-050',
    stock: 100,
    unitPrice: 450.0,
    cost: 320.0
  };

  // Push through proxy
  durableInventory.push(testItem);

  // Check SQLite immediately
  const retrievedItem = testDb.getEntity<any>('test_inventory', testItem.id);
  assert(retrievedItem !== null, suite1, 'Push writes through to SQLite immediately');
  assert(retrievedItem?.sku === 'SKU-VLV-050', suite1, 'Retrieved item has correct SKU');

  // Mutate nested property through proxy
  durableInventory[0].stock = 125;
  const updatedItem = testDb.getEntity<any>('test_inventory', testItem.id);
  assert(updatedItem?.stock === 125, suite1, 'Property update writes through to SQLite');

  // Splice delete through proxy
  durableInventory.splice(0, 1);
  const deletedItem = testDb.getEntity('test_inventory', testItem.id);
  assert(deletedItem === null, suite1, 'Splice removes item from SQLite System of Record');

  // ----------------------------------------------------
  // SUITE 2: Multi-Entity Restart Survival (Core Entities)
  // ----------------------------------------------------
  const suite2 = 'SUITE 2: Core Entity Restart Survival';
  const timestamp = Date.now();

  const sampleEntities: { collection: string; entity: any }[] = [
    {
      collection: 'companies',
      entity: { id: `comp-p01-${timestamp}`, code: 'COMP-P01', name: 'Al-Mounir Holding Co', currency: 'EGP', active: true }
    },
    {
      collection: 'branches',
      entity: { id: `br-p01-${timestamp}`, companyId: `comp-p01-${timestamp}`, code: 'BR-CAIRO', name: 'Cairo HQ Branch', active: true }
    },
    {
      collection: 'warehouses',
      entity: { id: `wh-p01-${timestamp}`, code: 'WH-MAIN-01', name: 'Primary Distribution Center', branchId: `br-p01-${timestamp}` }
    },
    {
      collection: 'inventory',
      entity: { id: `inv-p01-${timestamp}`, sku: `SKU-MOTOR-${timestamp}`, name: '3-Phase Electric Motor 15kW', uom: 'PCS', unitCost: 12500 }
    },
    {
      collection: 'customers',
      entity: { id: `cust-p01-${timestamp}`, code: 'CUST-DELTA', name: 'Delta Manufacturing Corp', creditLimit: 500000, active: true }
    },
    {
      collection: 'vendors',
      entity: { id: `vend-p01-${timestamp}`, code: 'VEND-STEEL', name: 'Ezz Steel Group', currency: 'EGP', status: 'ACTIVE' }
    },
    {
      collection: 'glAccounts',
      entity: { id: `acc-p01-${timestamp}`, code: '110100', name: 'Main Operating Cash - CIB', type: 'ASSET', currency: 'EGP' }
    },
    {
      collection: 'glJournals',
      entity: { id: `je-p01-${timestamp}`, entryNumber: `JE-${timestamp}`, date: '2026-09-08', status: 'DRAFT', totalDebit: 25000, totalCredit: 25000 }
    },
    {
      collection: 'treasuryBanks',
      entity: { id: `tb-p01-${timestamp}`, bankCode: 'CIB-EG', bankName: 'Commercial International Bank', swiftCode: 'CIBEGCAX' }
    },
    {
      collection: 'fixedAssetMasters',
      entity: { id: `fa-p01-${timestamp}`, assetNumber: `FA-${timestamp}`, description: 'CNC Lathe Machine A1', acquisitionCost: 850000 }
    },
    {
      collection: 'purchaseOrders',
      entity: { id: `po-p01-${timestamp}`, poNumber: `PO-${timestamp}`, vendorId: `vend-p01-${timestamp}`, totalAmount: 75000, status: 'APPROVED' }
    },
    {
      collection: 'goodsReceipts',
      entity: { id: `grn-p01-${timestamp}`, grnNumber: `GRN-${timestamp}`, poId: `po-p01-${timestamp}`, status: 'VERIFIED' }
    },
    {
      collection: 'supplierInvoices',
      entity: { id: `si-p01-${timestamp}`, invoiceNumber: `VINV-${timestamp}`, vendorId: `vend-p01-${timestamp}`, total: 75000, status: 'MATCHED' }
    },
    {
      collection: 'salesOrders',
      entity: { id: `so-p01-${timestamp}`, orderNumber: `SO-${timestamp}`, customerId: `cust-p01-${timestamp}`, totalAmount: 120000, status: 'CONFIRMED' }
    },
    {
      collection: 'salesInvoices',
      entity: { id: `inv-doc-${timestamp}`, invoiceNumber: `SINV-${timestamp}`, customerId: `cust-p01-${timestamp}`, total: 120000, status: 'POSTED' }
    },
    {
      collection: 'posReceipts',
      entity: { id: `pos-rcpt-${timestamp}`, receiptNumber: `REC-${timestamp}`, total: 450.50, paymentMethod: 'CASH', offlineCreated: false }
    },
    {
      collection: 'manufacturingBOMs',
      entity: { id: `bom-p01-${timestamp}`, bomNumber: `BOM-${timestamp}`, productId: `inv-p01-${timestamp}`, revision: 'A' }
    },
    {
      collection: 'manufacturingWorkOrders',
      entity: { id: `wo-p01-${timestamp}`, woNumber: `WO-${timestamp}`, bomId: `bom-p01-${timestamp}`, plannedQty: 50, status: 'IN_PROGRESS' }
    },
    {
      collection: 'qualityInspectionLots',
      entity: { id: `qil-p01-${timestamp}`, lotNumber: `QLOT-${timestamp}`, materialId: `inv-p01-${timestamp}`, sampleSize: 5, status: 'RELEASED' }
    }
  ];

  // Persist all sample entities
  for (const item of sampleEntities) {
    persistEntity(item.collection, item.entity, testDb, 'ten-001', 'comp-001');
  }

  // Simulate Cold Server Restart: create fresh arrays and reinitialize via initDurableCollection
  for (const item of sampleEntities) {
    const emptyMemArray: any[] = [];
    const restoredCollection = initDurableCollection(item.collection, emptyMemArray, testDb);
    const found = restoredCollection.find((e: any) => e.id === item.entity.id);
    assert(
      found !== undefined && found !== null,
      suite2,
      `Cold restart survival: ${item.collection} (ID: ${item.entity.id})`
    );
  }

  // ----------------------------------------------------
  // SUITE 3: Atomic Transaction Rollback & Commit
  // ----------------------------------------------------
  const suite3 = 'SUITE 3: Atomic Transactions';

  const txBatchId = `tx-${timestamp}`;
  const parentId = `PARENT-${txBatchId}`;
  const childId = `CHILD-${txBatchId}`;

  // Test 1: Successful atomic transaction
  const txSuccess = executeTransaction(testDb, (txDb) => {
    txDb.saveEntity('tx_parent', { id: parentId, name: 'Parent Order', status: 'NEW' });
    txDb.saveEntity('tx_child', { id: childId, parentId, amount: 500 });
    return true;
  });

  assert(txSuccess === true, suite3, 'Atomic transaction committed successfully');
  assert(testDb.getEntity('tx_parent', parentId) !== null, suite3, 'Parent entity exists in DB after commit');
  assert(testDb.getEntity('tx_child', childId) !== null, suite3, 'Child entity exists in DB after commit');

  // Test 2: Failed atomic transaction -> complete rollback
  const failParentId = `PARENT-FAIL-${txBatchId}`;
  const failChildId = `CHILD-FAIL-${txBatchId}`;

  let caughtError = false;
  try {
    executeTransaction(testDb, (txDb) => {
      txDb.saveEntity('tx_parent', { id: failParentId, name: 'Doomed Parent' });
      // Deliberate mid-transaction failure
      throw new Error('Simulation of unexpected financial validation abort');
    });
  } catch (err) {
    caughtError = true;
  }

  assert(caughtError === true, suite3, 'Transaction error caught and escalated');
  assert(testDb.getEntity('tx_parent', failParentId) === null, suite3, 'Parent entity rolled back completely');
  assert(testDb.getEntity('tx_child', failChildId) === null, suite3, 'No orphan records left behind');

  // ----------------------------------------------------
  // SUITE 4: MasterDataService Hydration & Mutation Listener
  // ----------------------------------------------------
  const suite4 = 'SUITE 4: MasterDataService Durability';

  const newProduct = {
    id: `prod-dur-${timestamp}`,
    tenantId: 'ten-001',
    sku: `SKU-MD-${timestamp}`,
    name: 'Durable Product Master',
    type: 'STORABLE' as const,
    active: true,
    createdAt: new Date().toISOString()
  };

  // Log audit in MasterDataService triggers mutationListener
  const tracker = { listenerFired: false };
  MasterDataService.setMutationListener((type, entity) => {
    if (entity && entity.id === newProduct.id) {
      tracker.listenerFired = true;
      testDb.saveEntity('masterData_products', entity);
    }
  });

  MasterDataService.logAudit(
    'ten-001',
    'CREATE',
    'Product',
    newProduct.id,
    newProduct.sku,
    'usr-001',
    'Admin User',
    undefined,
    newProduct
  );

  assert(tracker.listenerFired === true, suite4, 'MasterDataService mutation listener fired on creation');
  const storedMdProduct = testDb.getEntity<any>('masterData_products', newProduct.id);
  assert(storedMdProduct !== null, suite4, 'MasterData product written through to SQLite');
  assert(storedMdProduct?.sku === newProduct.sku, suite4, 'Stored product SKU matches');

  // ----------------------------------------------------
  // SUITE 5: Supplier Engine Mock Decoupling
  // ----------------------------------------------------
  const suite5 = 'SUITE 5: Sourcing Mock Decoupling';

  const liveVendor = {
    id: `VEND-LIVE-${timestamp}`,
    code: `VEND-LIVE-${timestamp}`,
    name: 'Live Persisted Steel Supplier',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    status: 'ACTIVE' as const,
    active: true,
    currency: 'EGP'
  };

  // Persist live vendor to SQLite
  testDb.saveEntity('vendors', liveVendor);

  // Set live vendor provider in SupplierInvitationEngine and SupplierQuotationEngine
  SupplierInvitationEngine.setLiveVendorProvider(() => [liveVendor as any]);
  SupplierQuotationEngine.setLiveVendorProvider(() => [liveVendor as any]);

  // Validate eligibility using live vendor provider (bypassing INITIAL_VENDORS)
  const eligibility = SupplierInvitationEngine.validateSupplierEligibility(
    liveVendor.id,
    'ten-001',
    'comp-001'
  );
  assert(eligibility.eligible === true, suite5, 'SupplierInvitationEngine resolved vendor from live provider');
  assert(eligibility.supplier?.name === liveVendor.name, suite5, 'Resolved vendor name matches live data');

  // Test SupplierQuotationEngine validation with live vendor
  const mockRfq: any = {
    id: `rfq-p01-${timestamp}`,
    rfqNumber: `RFQ-${timestamp}`,
    tenantId: 'ten-001',
    companyId: 'comp-001',
    status: 'ISSUED',
    currency: 'EGP',
    exchangeRate: 1,
    lines: [{ id: 'line-01', itemSku: newProduct.sku, targetQty: 10, uom: 'PCS', baseUOM: 'PCS' }]
  };

  const quotationResult = SupplierQuotationEngine.recordQuotation(
    {
      rfqId: mockRfq.id,
      quotationNumber: `VQ-TEST-${timestamp}`,
      vendorId: liveVendor.id,
      supplierId: liveVendor.id,
      currency: 'EGP'
    },
    [
      {
        rfqLineId: 'line-01',
        itemSku: newProduct.sku,
        offeredQty: 10,
        quotedQuantity: 10,
        unitPrice: 100,
        leadTimeDays: 5
      }
    ],
    [],
    [mockRfq],
    [],
    [],
    {
      userId: 'usr-001',
      userName: 'Admin User',
      tenantId: 'ten-001',
      companyId: 'comp-001',
      branchId: 'br-001'
    }
  );

  assert(quotationResult.success === true, suite5, 'SupplierQuotationEngine recorded quote against live vendor', quotationResult.error);
  assert(quotationResult.quotation?.supplierName === liveVendor.name, suite5, 'Quotation bound to live vendor name');

  // ----------------------------------------------------
  // SUITE 6: Cryptographic Audit Vault Durability
  // ----------------------------------------------------
  const suite6 = 'SUITE 6: Audit Vault SHA-256 Integrity';

  const auditEntry = {
    action: 'PILOT_PERSISTENCE_VERIFIED',
    tenantId: 'ten-001',
    userId: 'usr-admin',
    details: 'Task P0-01 Universal Durable Persistence verification executed successfully.'
  };

  const auditHash = testDb.logAudit(auditEntry.action, auditEntry, auditEntry.tenantId);
  assert(typeof auditHash === 'string' && auditHash.length === 64, suite6, 'Audit record written to pilot_audit_vault');
  assert(auditHash.length === 64, suite6, 'Audit record contains valid SHA-256 hash');

  const vaultVerification = testDb.verifyAuditVaultIntegrity();
  assert(vaultVerification.valid === true, suite6, 'Audit vault chain integrity verified 100% valid');

  // ----------------------------------------------------
  // SUITE 7: Localization & Financial Master Data Durability
  // ----------------------------------------------------
  const suite7 = 'SUITE 7: Localization & Financial Masters';

  const masterEntities: { collection: string; entity: any }[] = [
    {
      collection: 'countriesMaster',
      entity: { id: `cntry-p01-${timestamp}`, code: 'EGY', name: 'Egypt', nameAr: 'مصر', currency: 'EGP', isVatEnabled: true }
    },
    {
      collection: 'taxSystemsMaster',
      entity: { id: `taxsys-p01-${timestamp}`, countryCode: 'EGY', taxSystem: 'STANDARD_VAT', standardRate: 14, allowsWithholding: true }
    },
    {
      collection: 'fiscalCalendarsMaster',
      entity: { id: `fisc-p01-${timestamp}`, companyId: 'comp-001', fiscalYear: 2026, startDate: '2026-01-01', endDate: '2026-12-31', isLocked: false }
    },
    {
      collection: 'eventMappingRules',
      entity: { id: `evmap-p01-${timestamp}`, eventType: 'SALES_INVOICE_POSTED', debitAccountCode: '120100', creditAccountCode: '410100', isActive: true }
    },
    {
      collection: 'postingProfiles',
      entity: { id: `postprof-p01-${timestamp}`, code: 'PROF-RETAIL-EGY', name: 'Retail VAT Posting Profile', currency: 'EGP', isActive: true }
    },
    {
      collection: 'procurementPaymentTerms',
      entity: { id: `payterm-p01-${timestamp}`, code: 'NET30', name: 'Net 30 Days', netDays: 30, discountDays: 10, discountPercent: 2 }
    },
    {
      collection: 'incoterms',
      entity: { id: `inco-p01-${timestamp}`, code: 'CIF', name: 'Cost, Insurance and Freight', description: 'Seller delivers goods to named port' }
    }
  ];

  for (const item of masterEntities) {
    persistEntity(item.collection, item.entity, testDb, 'ten-001', 'comp-001');
  }

  for (const item of masterEntities) {
    const mem: any[] = [];
    const restored = initDurableCollection(item.collection, mem, testDb);
    const found = restored.find((e: any) => e.id === item.entity.id);
    assert(
      found !== undefined && found !== null,
      suite7,
      `Cold restart survival: ${item.collection} (ID: ${item.entity.id})`
    );
  }

  // ----------------------------------------------------
  // SUITE 8: Fixed Assets & Treasury Periodic Snapshots
  // ----------------------------------------------------
  const suite8 = 'SUITE 8: Fixed Assets & Treasury Snapshots';

  const faSnapshot = {
    id: `fasnap-p01-${timestamp}`,
    period: '2026-08',
    totalAcquisitionCost: 15000000,
    accumulatedDepreciation: 3200000,
    netBookValue: 11800000,
    snapshotDate: '2026-08-31T23:59:59Z'
  };
  persistEntity('fixedAssetSnapshots', faSnapshot, testDb);
  const memFaSnap: any[] = [];
  const restoredFaSnap = initDurableCollection('fixedAssetSnapshots', memFaSnap, testDb);
  assert(
    restoredFaSnap.some((s: any) => s.id === faSnapshot.id && s.netBookValue === 11800000),
    suite8,
    'Fixed asset snapshot survived cold restart with exact net book value'
  );

  const treasurySnapshot = {
    id: `trsnap-p01-${timestamp}`,
    asOfDate: '2026-08-31T23:59:59Z',
    companyId: 'comp-001',
    totalCashEGP: 8450000,
    totalCashUSD: 250000,
    liquidityCoverageRatio: 1.45
  };
  persistEntity('treasurySnapshots', treasurySnapshot, testDb);
  const memTrSnap: any[] = [];
  const restoredTrSnap = initDurableCollection('treasurySnapshots', memTrSnap, testDb);
  assert(
    restoredTrSnap.some((s: any) => s.id === treasurySnapshot.id && s.liquidityCoverageRatio === 1.45),
    suite8,
    'Treasury snapshot survived cold restart with exact liquidity ratio'
  );

  // ----------------------------------------------------
  // SUITE 9: Restaurant Operations & KDS Durability
  // ----------------------------------------------------
  const suite9 = 'SUITE 9: Restaurant & KDS Durability';

  const sampleTable: RestaurantTable = {
    id: `tbl-test-${timestamp}`,
    tableNumber: 'T-108',
    capacity: 6,
    section: 'VIP Sea View',
    status: 'AVAILABLE',
    companyId: 'comp-001',
    branchId: 'br-001'
  };

  const durableTables = initDurableCollection<RestaurantTable>('restaurantTables', [], testDb);
  durableTables.push(sampleTable);
  const dbTable = testDb.getEntity<RestaurantTable>('restaurantTables', sampleTable.id);
  assert(dbTable !== null && dbTable.tableNumber === 'T-108', suite9, 'Table creation writes through to SQLite');

  // Mutate table status (occupy table)
  durableTables[durableTables.length - 1].status = 'OCCUPIED';
  durableTables[durableTables.length - 1].activeGuests = 4;
  const updatedDbTable = testDb.getEntity<RestaurantTable>('restaurantTables', sampleTable.id);
  assert(
    updatedDbTable?.status === 'OCCUPIED' && updatedDbTable?.activeGuests === 4,
    suite9,
    'Table status mutation writes through to SQLite System of Record'
  );

  // KDS order creation & state transition
  const sampleKds: KitchenDisplayOrder = {
    id: `kds-test-${timestamp}`,
    orderNumber: `KDS-${timestamp}`,
    tableNumber: 'T-108',
    orderType: 'DINE_IN',
    status: 'PREPARING',
    station: 'HOT_KITCHEN',
    priority: 'RUSH',
    items: [{ itemId: 'item-01', itemName: 'Mixed Grill Platter', quantity: 2, status: 'COOKING' }],
    createdAt: new Date().toISOString(),
    companyId: 'comp-001',
    branchId: 'br-001'
  };
  const durableKds = initDurableCollection<KitchenDisplayOrder>('kitchenOrders', [], testDb);
  durableKds.push(sampleKds);
  assert(testDb.getEntity('kitchenOrders', sampleKds.id) !== null, suite9, 'Kitchen order writes through immediately');

  // Kitchen Waste Record
  const sampleWaste: KitchenWasteRecord = {
    id: `kw-test-${timestamp}`,
    wasteNumber: `WST-${timestamp}`,
    date: '2026-09-08',
    itemId: 'item-meat-01',
    itemName: 'Prime Beef Tenderloin',
    quantity: 2.2,
    uom: 'KG',
    costAmount: 660,
    reason: 'TRIMMING',
    reportedBy: 'Chef Sous',
    actionTaken: 'Variance booked to F&B COGS',
    companyId: 'comp-001',
    branchId: 'br-001'
  };
  const durableWaste = initDurableCollection<KitchenWasteRecord>('kitchenWasteRecords', [], testDb);
  durableWaste.push(sampleWaste);
  assert(testDb.getEntity('kitchenWasteRecords', sampleWaste.id) !== null, suite9, 'Kitchen waste record written to SQLite');

  // ----------------------------------------------------
  // SUITE 10: CRM Tickets & Professional Services Timesheets
  // ----------------------------------------------------
  const suite10 = 'SUITE 10: CRM & Project Timesheets Durability';

  const sampleTicket: CRMTicket = {
    id: `tkt-test-${timestamp}`,
    ticketNumber: `TCK-${timestamp}`,
    customerId: 'cust-p01-test',
    customerName: 'Delta Holding Ltd',
    subject: 'Request for Electronic ZATCA XML Invoice Archive',
    description: 'Provide certified XML copies of August sales invoices.',
    priority: 'HIGH',
    status: 'OPEN',
    category: 'TECHNICAL',
    createdAt: new Date().toISOString(),
    companyId: 'comp-001'
  };
  const durableTickets = initDurableCollection<CRMTicket>('crmTickets', [], testDb);
  durableTickets.push(sampleTicket);
  assert(testDb.getEntity('crmTickets', sampleTicket.id) !== null, suite10, 'CRM ticket written through to SQLite');

  const sampleTimesheet: ProjectTimesheet = {
    id: `ts-test-${timestamp}`,
    timesheetNumber: `TS-${timestamp}`,
    projectId: 'proj-pilot-01',
    projectName: 'Retail ERP Deployment',
    employeeId: 'emp-tech-01',
    employeeName: 'Engineer Hassan',
    date: '2026-09-08',
    hoursWorked: 8,
    billableHours: 8,
    taskDescription: 'Database persistence regression verification',
    hourlyRate: 120,
    totalCost: 960,
    status: 'SUBMITTED',
    companyId: 'comp-001'
  };
  const durableTimesheets = initDurableCollection<ProjectTimesheet>('projectTimesheets', [], testDb);
  durableTimesheets.push(sampleTimesheet);
  assert(testDb.getEntity('projectTimesheets', sampleTimesheet.id) !== null, suite10, 'Project timesheet written to SQLite');

  // ----------------------------------------------------
  // SUITE 11: Universal AttachmentEngine & CommentEngine Durability
  // ----------------------------------------------------
  const suite11 = 'SUITE 11: DMS & CommentEngine Durability';

  // Wire mutation listeners as in server.ts
  AttachmentEngine.setMutationListener((att) => {
    testDb.saveEntity('attachmentEngine_attachments', att);
  });
  CommentEngine.setCommentMutationListener((cmt) => {
    testDb.saveEntity('commentEngine_comments', cmt);
  });
  CommentEngine.setActivityMutationListener((act) => {
    testDb.saveEntity('commentEngine_activityLogs', act);
  });

  // Test Attachment upload write-through
  const uploadedAtt = AttachmentEngine.uploadAttachment(
    'ten-001',
    'SalesInvoice',
    `inv-test-${timestamp}`,
    'Tax_Authority_Clearance_Seal.pdf',
    'application/pdf',
    524288,
    'usr-001',
    'https://storage.enterprise.internal/docs/tax_seal.pdf'
  );
  const storedAtt = testDb.getEntity<DocumentAttachment>('attachmentEngine_attachments', uploadedAtt.id);
  assert(storedAtt !== null, suite11, 'AttachmentEngine upload writes through to SQLite');
  assert(storedAtt?.fileName === 'Tax_Authority_Clearance_Seal.pdf', suite11, 'Stored attachment filename matches');

  // Test Comment addition write-through
  const addedComment = CommentEngine.addComment(
    'ten-001',
    'SalesInvoice',
    `inv-test-${timestamp}`,
    'usr-001',
    'Chief Accountant',
    'All cryptographic hashes and VAT totals verified against tax authority.',
    true
  );
  const storedComment = testDb.getEntity<DocumentComment>('commentEngine_comments', addedComment.id);
  assert(storedComment !== null, suite11, 'CommentEngine comment writes through to SQLite');
  assert(storedComment?.isInternalNote === true, suite11, 'Stored comment preserves internal note flag');

  // Test Activity logging write-through
  const loggedActivity = CommentEngine.logActivity(
    'ten-001',
    'usr-001',
    'Chief Accountant',
    'VERIFIED_AND_POSTED',
    'SalesInvoice',
    `inv-test-${timestamp}`,
    'Invoice certified and ledger posted with 100% compliance',
    `INV-${timestamp}`
  );
  const storedActivity = testDb.getEntity<ActivityLog>('commentEngine_activityLogs', loggedActivity.id);
  assert(storedActivity !== null, suite11, 'CommentEngine activity log writes through to SQLite');
  assert(storedActivity?.action === 'VERIFIED_AND_POSTED', suite11, 'Stored activity action matches');

  // Test Cold Restart Rehydration of AttachmentEngine and CommentEngine
  AttachmentEngine.hydrate([storedAtt!]);
  const restoredAttList = AttachmentEngine.getEntityAttachments('ten-001', 'SalesInvoice', `inv-test-${timestamp}`);
  assert(restoredAttList.length >= 1, suite11, 'AttachmentEngine restored from persisted SQLite state');

  CommentEngine.hydrate([storedComment!], [storedActivity!]);
  const restoredCommentList = CommentEngine.getEntityComments('ten-001', 'SalesInvoice', `inv-test-${timestamp}`);
  assert(restoredCommentList.length >= 1, suite11, 'CommentEngine comments restored from persisted SQLite state');

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  console.log('\n========================================================');
  console.log(`TASK P0-01 VERIFICATION SUMMARY: ${passed}/${total} PASS (${failed} FAIL)`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runUniversalPersistenceVerification().catch((err) => {
  console.error('Fatal error in verification suite:', err);
  process.exit(1);
});
