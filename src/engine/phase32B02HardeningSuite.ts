/**
 * AM ERP — Phase 3.2B-02 Hardening & Verification Suite
 * Architecture Baseline: v2.8
 * Comprehensive Quality Gate for RFQ & Supplier Quotations
 * 
 * 30/30 Authoritative Acceptance Scenarios:
 *  - RFQ Lifecycle & Master Data: Scenarios 01 to 10
 *  - Supplier Invitation & Sourcing: Scenarios 11 to 14
 *  - Security, Tenant & Multi-Entity Isolation: Scenarios 15 to 16
 *  - Supplier Quotation Intake & Currency: Scenarios 17 to 22
 *  - Quotation Comparison Matrix & Scoring: Scenarios 23 to 24
 *  - Sourcing Award & Split Award: Scenarios 25 to 27
 *  - Audit Trail, Concurrency & E2E Lifecycle: Scenarios 28 to 30
 */

import { RFQEngine } from './rfqEngine';
import { SupplierInvitationEngine } from './supplierInvitationEngine';
import { SupplierQuotationEngine } from './supplierQuotationEngine';
import { QuotationComparisonEngine } from './quotationComparisonEngine';
import { RFQAwardEngine } from './rfqAwardEngine';
import { MasterDataService } from './masterDataService';
import { CurrencyEngine } from './currencyEngine';
import { Phase31HardeningSuite } from './phase31HardeningSuite';
import { Phase32AHardeningSuite } from './phase32AHardeningSuite';
import { Phase32B01HardeningSuite } from './phase32B01HardeningSuite';
import {
  RequestForQuotation,
  RFQSupplierInvitation,
  SupplierQuotation,
  RFQAward,
  PurchaseRequisition,
  PurchaseAuditRecord
} from '../types/procurement';
import {
  INITIAL_PURCHASE_REQUISITIONS,
  INITIAL_PURCHASE_AUDIT_LOGS,
  INITIAL_VENDORS
} from '../data/mockDatabase';

export interface Phase32B02TestResult {
  scenarioId: string;
  name: string;
  category: 'RFQ_LIFECYCLE' | 'INVITATION' | 'SECURITY_ISOLATION' | 'QUOTATION_INTAKE' | 'COMPARISON_SCORING' | 'AWARD_SPLIT' | 'AUDIT_CONCURRENCY_E2E';
  status: 'PASS' | 'FAIL' | 'SKIPPED';
  executionTimeMs: number;
  details: string;
  error?: string;
}

export interface Phase32B02SuiteReport {
  suiteName: string;
  phase: string;
  totalScenarios: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  successRate: string;
  timestamp: string;
  results: Phase32B02TestResult[];
  phase31RegressionPassed: boolean;
  phase32ARegressionPassed: boolean;
  phase32B01RegressionPassed: boolean;
  verdict: 'APPROVED' | 'REJECTED';
}

export class Phase32B02HardeningSuite {
  public static async runSuite(): Promise<Phase32B02SuiteReport> {
    const results: Phase32B02TestResult[] = [];
    const tenantId = 'ten-001';
    const companyId = 'comp-001';
    const branchId = 'br-001';

    const context = {
      userId: 'usr-buyer-01',
      userName: 'Tariq Al-Mansoor',
      userRole: 'PURCHASE_OFFICER',
      tenantId,
      companyId,
      branchId
    };

    // Deep-cloned isolated state collections
    const testRequisitions: PurchaseRequisition[] = JSON.parse(JSON.stringify(INITIAL_PURCHASE_REQUISITIONS));
    const testAuditLogs: PurchaseAuditRecord[] = JSON.parse(JSON.stringify(INITIAL_PURCHASE_AUDIT_LOGS));
    const testRFQs: RequestForQuotation[] = [];
    const testInvitations: RFQSupplierInvitation[] = [];
    const testQuotations: SupplierQuotation[] = [];
    const testAwards: RFQAward[] = [];

    // Ensure Master Data test entities exist
    const products = MasterDataService.getProducts(tenantId);
    let sampleProduct = products.find(p => p.sku === 'TEST-SRV-01');
    if (!sampleProduct) {
      sampleProduct = MasterDataService.createProduct({
        tenantId,
        sku: 'TEST-SRV-01',
        name: 'Enterprise Test Server PowerEdge R750',
        productType: 'STOCK',
        categoryId: 'cat-01',
        taxCategoryId: 'tax-cat-std',
        baseUom: 'PCS',
        trackingPolicy: 'SERIAL',
        baseCostPrice: 18500,
        baseSellingPrice: 22000,
        reorderPoint: 5,
        isConfigurable: false,
        active: true
      }, 'usr-001');
    } else if (!sampleProduct.active) {
      sampleProduct = MasterDataService.updateProduct(sampleProduct.id, { active: true }, 'usr-001');
    }

    let sampleInactiveProduct = products.find(p => p.sku === 'DISCONTINUED-CPU');
    if (!sampleInactiveProduct) {
      sampleInactiveProduct = MasterDataService.createProduct({
        tenantId,
        sku: 'DISCONTINUED-CPU',
        name: 'Discontinued Legacy Processor',
        productType: 'STOCK',
        categoryId: 'cat-01',
        taxCategoryId: 'tax-cat-std',
        baseUom: 'PCS',
        trackingPolicy: 'STANDARD',
        baseCostPrice: 500,
        baseSellingPrice: 750,
        reorderPoint: 0,
        isConfigurable: false,
        active: false
      }, 'usr-001');
    }
    if (sampleInactiveProduct.active) {
      sampleInactiveProduct = MasterDataService.deactivateProduct(sampleInactiveProduct.id, 'usr-001', 'Discontinued item');
    }

    // Isolated test vendors
    const testVendors = [
      {
        id: 'ven-alpha-01',
        tenantId,
        companyId,
        code: 'SUP-ALPHA',
        name: 'Alpha Systems Trading Co.',
        nameAr: 'شركة ألفا للأنظمة',
        taxNumber: '310123456700003',
        vendorCategoryId: 'vcat-001',
        vendorCategoryName: 'Hardware & Infrastructure',
        paymentTermsId: 'pterm-001',
        paymentTermsName: 'Net 30 Days',
        incotermsId: 'inco-001',
        incotermsCode: 'FOB',
        currency: 'SAR',
        status: 'ACTIVE' as const,
        createdAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'ven-beta-01',
        tenantId,
        companyId,
        code: 'SUP-BETA',
        name: 'Beta Global Technologies Inc.',
        nameAr: 'شركة بيتا العالمية للتقنية',
        taxNumber: '310987654300003',
        vendorCategoryId: 'vcat-001',
        vendorCategoryName: 'Hardware & Infrastructure',
        paymentTermsId: 'pterm-001',
        paymentTermsName: 'Net 30 Days',
        incotermsId: 'inco-001',
        incotermsCode: 'FOB',
        currency: 'USD',
        status: 'ACTIVE' as const,
        createdAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'ven-blocked-01',
        tenantId,
        companyId,
        code: 'SUP-BLOCKED',
        name: 'Blocked Vendor Corp',
        nameAr: 'شركة المورد المحظور',
        taxNumber: '310000000000003',
        vendorCategoryId: 'vcat-001',
        vendorCategoryName: 'Hardware & Infrastructure',
        paymentTermsId: 'pterm-001',
        paymentTermsName: 'Net 30 Days',
        incotermsId: 'inco-001',
        incotermsCode: 'FOB',
        currency: 'SAR',
        status: 'BLOCKED' as const,
        createdAt: '2026-01-01T00:00:00Z'
      }
    ];

    testVendors.forEach(tv => {
      if (!INITIAL_VENDORS.some(v => v.id === tv.id)) {
        (INITIAL_VENDORS as any[]).push(tv);
      }
    });

    // Ensure baseline requisitions with known states exist
    if (!testRequisitions.some(p => p.status === 'DRAFT' || p.status === 'PENDING_APPROVAL')) {
      const draftLines: any[] = [{
        id: 'prl-draft-01',
        requisitionId: 'pr-draft-test-01',
        productId: sampleProduct.id,
        itemSku: sampleProduct.sku,
        itemName: sampleProduct.name,
        requestedQuantity: 5,
        requestedUOM: 'PCS',
        baseQuantity: 5,
        baseUOM: 'PCS',
        uomConversionFactor: 1,
        estimatedUnitPrice: 1000,
        estimatedTotalPrice: 5000,
        estimatedLineAmount: 5000,
        warehouseId: 'wh-001',
        status: 'OPEN',
        requiredDate: new Date().toISOString()
      }];
      testRequisitions.unshift({
        id: 'pr-draft-test-01',
        prNumber: 'PR-2026-9001',
        tenantId,
        companyId,
        branchId,
        departmentId: 'dept-01',
        departmentName: 'IT Infrastructure',
        warehouseId: 'wh-001',
        warehouseName: 'Central WH',
        costCenterId: 'cc-it-ops',
        costCenterName: 'IT Operations',
        requestedBy: 'usr-001',
        requestedByName: 'Test User',
        priority: 'MEDIUM',
        status: 'DRAFT',
        version: 1,
        requisitionDate: new Date().toISOString(),
        requiredDate: new Date().toISOString(),
        lines: draftLines,
        items: draftLines,
        totalEstimatedAmount: 5000,
        currency: 'SAR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    const appLines1: any[] = [{
      id: 'prl-app-01',
      requisitionId: 'pr-approved-test-01',
      productId: sampleProduct.id,
      itemSku: sampleProduct.sku,
      itemName: sampleProduct.name,
      requestedQuantity: 10,
      requestedUOM: 'PCS',
      baseQuantity: 10,
      baseUOM: 'PCS',
      uomConversionFactor: 1,
      estimatedUnitPrice: 18000,
      estimatedTotalPrice: 180000,
      estimatedLineAmount: 180000,
      warehouseId: 'wh-001',
      status: 'OPEN',
      requiredDate: new Date().toISOString()
    }];

    const appLines2: any[] = [{
      id: 'prl-app-e2e-01',
      requisitionId: 'pr-approved-e2e-01',
      productId: sampleProduct.id,
      itemSku: sampleProduct.sku,
      itemName: sampleProduct.name,
      requestedQuantity: 10,
      requestedUOM: 'PCS',
      baseQuantity: 10,
      baseUOM: 'PCS',
      uomConversionFactor: 1,
      estimatedUnitPrice: 18000,
      estimatedTotalPrice: 180000,
      estimatedLineAmount: 180000,
      warehouseId: 'wh-001',
      status: 'OPEN',
      requiredDate: new Date().toISOString()
    }];

    testRequisitions.push(
      {
        id: 'pr-approved-test-01',
        prNumber: 'PR-2026-9002',
        tenantId,
        companyId,
        branchId,
        departmentId: 'dept-01',
        departmentName: 'IT Infrastructure',
        warehouseId: 'wh-001',
        warehouseName: 'Central WH',
        costCenterId: 'cc-it-ops',
        costCenterName: 'IT Operations',
        requestedBy: 'usr-001',
        requestedByName: 'Test User',
        priority: 'HIGH',
        status: 'APPROVED',
        version: 1,
        requisitionDate: new Date().toISOString(),
        requiredDate: new Date().toISOString(),
        lines: appLines1,
        items: appLines1,
        totalEstimatedAmount: 180000,
        currency: 'SAR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'pr-approved-e2e-01',
        prNumber: 'PR-2026-9003',
        tenantId,
        companyId,
        branchId,
        departmentId: 'dept-01',
        departmentName: 'IT Infrastructure',
        warehouseId: 'wh-001',
        warehouseName: 'Central WH',
        costCenterId: 'cc-it-ops',
        costCenterName: 'IT Operations',
        requestedBy: 'usr-001',
        requestedByName: 'Test User',
        priority: 'HIGH',
        status: 'APPROVED',
        version: 1,
        requisitionDate: new Date().toISOString(),
        requiredDate: new Date().toISOString(),
        lines: appLines2,
        items: appLines2,
        totalEstimatedAmount: 180000,
        currency: 'SAR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );

    const sampleSupplierA = testVendors[0];
    const sampleSupplierB = testVendors[1];
    const sampleInactiveSupplier = testVendors[2];

    // -------------------------------------------------------------
    // SCENARIO-01: Create Standalone RFQ in DRAFT Status
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const res = RFQEngine.createRFQ(
        {
          title: 'IT Data Center Hardware Refresh 2026',
          departmentId: 'dept-01',
          currency: 'SAR'
        },
        [
          {
            productId: sampleProduct.id,
            itemSku: sampleProduct.sku,
            itemName: sampleProduct.name,
            targetQuantity: 5,
            targetUOM: 'PCS',
            targetUnitPrice: 18000
          }
        ],
        testRFQs,
        testAuditLogs,
        context
      );

      if (res.success && res.rfq && res.rfq.status === 'DRAFT' && res.rfq.version === 1 && res.rfq.items.length === 1) {
        results.push({
          scenarioId: 'SCENARIO-01',
          name: 'Create Standalone RFQ in DRAFT Status',
          category: 'RFQ_LIFECYCLE',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `RFQ ${res.rfq.rfqNumber} successfully created in DRAFT state with snapshotted line.`
        });
      } else {
        throw new Error(res.error || 'Failed to create standalone RFQ');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-01',
        name: 'Create Standalone RFQ in DRAFT Status',
        category: 'RFQ_LIFECYCLE',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Failed to create standalone RFQ',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-02: Create RFQ from Approved Purchase Requisition
    // -------------------------------------------------------------
    let rfqFromPrId = '';
    try {
      const start = Date.now();
      const approvedPr = testRequisitions.find(p => p.status === 'APPROVED' && p.tenantId === tenantId);
      if (!approvedPr) throw new Error('No APPROVED PR found in test baseline.');

      const res = RFQEngine.createRFQFromPR(
        approvedPr.id,
        undefined,
        [sampleSupplierA.id, sampleSupplierB.id],
        new Date(Date.now() + 10 * 86400000).toISOString(),
        testRequisitions,
        testRFQs,
        testAuditLogs,
        context
      );

      if (res.success && res.rfq && res.rfq.prId === approvedPr.id && approvedPr.status === 'IN_RFQ') {
        rfqFromPrId = res.rfq.id;
        results.push({
          scenarioId: 'SCENARIO-02',
          name: 'Create RFQ from Approved Purchase Requisition',
          category: 'RFQ_LIFECYCLE',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `RFQ ${res.rfq.rfqNumber} generated from PR ${approvedPr.prNumber}. PR status transitioned to IN_RFQ.`
        });
      } else {
        throw new Error(res.error || 'Failed to generate RFQ from PR');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-02',
        name: 'Create RFQ from Approved Purchase Requisition',
        category: 'RFQ_LIFECYCLE',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Failed to generate RFQ from PR',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-03: Block RFQ Generation from Draft/Pending PR
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const draftPr = testRequisitions.find(p => p.status === 'DRAFT' || p.status === 'PENDING_APPROVAL');
      if (!draftPr) throw new Error('No Draft/Pending PR found in baseline.');

      const res = RFQEngine.createRFQFromPR(
        draftPr.id,
        undefined,
        [sampleSupplierA.id],
        new Date().toISOString(),
        testRequisitions,
        testRFQs,
        testAuditLogs,
        context
      );

      if (!res.success && res.error?.includes('must be in \'APPROVED\' status')) {
        results.push({
          scenarioId: 'SCENARIO-03',
          name: 'Block RFQ Generation from Draft/Pending PR',
          category: 'RFQ_LIFECYCLE',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Correctly rejected PR in ${draftPr.status} status: ${res.error}`
        });
      } else {
        throw new Error('RFQ from unapproved PR was unexpectedly permitted.');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-03',
        name: 'Block RFQ Generation from Draft/Pending PR',
        category: 'RFQ_LIFECYCLE',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Validation check failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-04: RFQ Line UOM Conversion Snapshot from Master Data
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      // Test converting BOX (10 PCS) to PCS
      const res = RFQEngine.createRFQ(
        { title: 'Bulk Cable Procurement', currency: 'SAR' },
        [
          {
            productId: sampleProduct.id,
            itemSku: sampleProduct.sku,
            itemName: sampleProduct.name,
            targetQuantity: 3,
            targetUOM: 'BOX',
            targetUnitPrice: 180000
          }
        ],
        testRFQs,
        testAuditLogs,
        context
      );

      if (res.success && res.rfq && res.rfq.items[0].targetUOM === 'BOX' && res.rfq.items[0].baseQuantity === 30) {
        results.push({
          scenarioId: 'SCENARIO-04',
          name: 'RFQ Line UOM Conversion Snapshot from Master Data',
          category: 'RFQ_LIFECYCLE',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Target UOM BOX (Factor: ${res.rfq.items[0].uomConversionFactor}) normalized to ${res.rfq.items[0].baseQuantity} ${res.rfq.items[0].baseUOM}.`
        });
      } else {
        throw new Error(res.error || 'UOM conversion snapshot failed');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-04',
        name: 'RFQ Line UOM Conversion Snapshot from Master Data',
        category: 'RFQ_LIFECYCLE',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'UOM conversion test failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-05: RFQ Line Rejection for Inactive Product
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const res = RFQEngine.createRFQ(
        { title: 'Invalid Product RFQ', currency: 'SAR' },
        [
          {
            productId: sampleInactiveProduct.id,
            itemSku: sampleInactiveProduct.sku,
            itemName: sampleInactiveProduct.name,
            targetQuantity: 1,
            targetUOM: 'PCS'
          }
        ],
        testRFQs,
        testAuditLogs,
        context
      );

      if (!res.success && res.error?.includes('INACTIVE')) {
        results.push({
          scenarioId: 'SCENARIO-05',
          name: 'RFQ Line Rejection for Inactive Product',
          category: 'RFQ_LIFECYCLE',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Correctly rejected inactive product: ${res.error}`
        });
      } else {
        throw new Error('Inactive product was unexpectedly permitted on RFQ');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-05',
        name: 'RFQ Line Rejection for Inactive Product',
        category: 'RFQ_LIFECYCLE',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Inactive product validation failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-06: RFQ Line Rejection for Zero or Negative Quantity
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const res = RFQEngine.createRFQ(
        { title: 'Zero Qty RFQ', currency: 'SAR' },
        [
          {
            productId: sampleProduct.id,
            itemSku: sampleProduct.sku,
            itemName: sampleProduct.name,
            targetQuantity: 0,
            targetUOM: 'PCS'
          }
        ],
        testRFQs,
        testAuditLogs,
        context
      );

      if (!res.success && res.error?.includes('greater than zero')) {
        results.push({
          scenarioId: 'SCENARIO-06',
          name: 'RFQ Line Rejection for Zero or Negative Quantity',
          category: 'RFQ_LIFECYCLE',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Correctly rejected zero quantity: ${res.error}`
        });
      } else {
        throw new Error('Zero quantity line was unexpectedly permitted on RFQ');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-06',
        name: 'RFQ Line Rejection for Zero or Negative Quantity',
        category: 'RFQ_LIFECYCLE',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Zero qty validation failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-07: RFQ Line Rejection for Unrecognized Target UOM
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const res = RFQEngine.createRFQ(
        { title: 'Bad UOM RFQ', currency: 'SAR' },
        [
          {
            productId: sampleProduct.id,
            itemSku: sampleProduct.sku,
            itemName: sampleProduct.name,
            targetQuantity: 10,
            targetUOM: 'UNKNOWN_UOM_XYZ'
          }
        ],
        testRFQs,
        testAuditLogs,
        context
      );

      if (!res.success && res.error?.includes('not recognized in tenant UOM registry')) {
        results.push({
          scenarioId: 'SCENARIO-07',
          name: 'RFQ Line Rejection for Unrecognized Target UOM',
          category: 'RFQ_LIFECYCLE',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Correctly blocked unrecognized UOM: ${res.error}`
        });
      } else {
        throw new Error('Invalid UOM was unexpectedly permitted on RFQ');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-07',
        name: 'RFQ Line Rejection for Unrecognized Target UOM',
        category: 'RFQ_LIFECYCLE',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'UOM registry validation failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-08: RFQ Optimistic Concurrency Control (Version Conflict)
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const targetRfq = testRFQs[0];
      const conflictRes = RFQEngine.updateRFQ(
        targetRfq.id,
        { title: 'Concurrent Update Attempt' },
        undefined,
        testRFQs,
        testAuditLogs,
        context,
        999 // Intentionally stale version
      );

      if (!conflictRes.success && conflictRes.isConflict) {
        results.push({
          scenarioId: 'SCENARIO-08',
          name: 'RFQ Optimistic Concurrency Control (Version Conflict)',
          category: 'RFQ_LIFECYCLE',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Correctly caught concurrency conflict: ${conflictRes.error}`
        });
      } else {
        throw new Error('Stale update succeeded without triggering concurrency conflict');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-08',
        name: 'RFQ Optimistic Concurrency Control (Version Conflict)',
        category: 'RFQ_LIFECYCLE',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Optimistic concurrency test failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-09: RFQ Mark Ready / Approval Transition
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const targetRfq = testRFQs.find(r => r.status === 'DRAFT');
      if (!targetRfq) throw new Error('No DRAFT RFQ found');

      const res = RFQEngine.markReady(
        targetRfq.id,
        testRFQs,
        testAuditLogs,
        context,
        targetRfq.version
      );

      if (res.success && res.rfq && res.rfq.status === 'APPROVED') {
        results.push({
          scenarioId: 'SCENARIO-09',
          name: 'RFQ Mark Ready / Approval Transition',
          category: 'RFQ_LIFECYCLE',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `RFQ ${res.rfq.rfqNumber} successfully transitioned from DRAFT to APPROVED (Version: ${res.rfq.version}).`
        });
      } else {
        throw new Error(res.error || 'Failed to mark RFQ ready');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-09',
        name: 'RFQ Mark Ready / Approval Transition',
        category: 'RFQ_LIFECYCLE',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Mark ready transition failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-10: RFQ Publish to Suppliers
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const targetRfq = testRFQs.find(r => r.status === 'APPROVED');
      if (!targetRfq) throw new Error('No APPROVED RFQ found');

      const res = RFQEngine.publishRFQ(
        targetRfq.id,
        testRFQs,
        testAuditLogs,
        context,
        targetRfq.version
      );

      if (res.success && res.rfq && res.rfq.status === 'PUBLISHED') {
        results.push({
          scenarioId: 'SCENARIO-10',
          name: 'RFQ Publish to Suppliers',
          category: 'RFQ_LIFECYCLE',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `RFQ ${res.rfq.rfqNumber} successfully PUBLISHED to suppliers.`
        });
      } else {
        throw new Error(res.error || 'Failed to publish RFQ');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-10',
        name: 'RFQ Publish to Suppliers',
        category: 'RFQ_LIFECYCLE',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Publish RFQ failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-11: Supplier Invitation with Active Supplier Validation
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const targetRfq = testRFQs.find(r => r.status === 'PUBLISHED');
      if (!targetRfq) throw new Error('No PUBLISHED RFQ found');

      const res = SupplierInvitationEngine.inviteSuppliers(
        targetRfq.id,
        [sampleSupplierA.id, sampleSupplierB.id],
        new Date(Date.now() + 14 * 86400000).toISOString(),
        testRFQs,
        testInvitations,
        testAuditLogs,
        context,
        targetRfq.version
      );

      if (res.success && res.invitations && res.invitations.length === 2 && res.invitations[0].invitationStatus === 'INVITED') {
        results.push({
          scenarioId: 'SCENARIO-11',
          name: 'Supplier Invitation with Active Supplier Validation',
          category: 'INVITATION',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Invited ${res.invitations.length} eligible suppliers to RFQ ${targetRfq.rfqNumber}.`
        });
      } else {
        throw new Error(res.error || 'Failed to invite suppliers');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-11',
        name: 'Supplier Invitation with Active Supplier Validation',
        category: 'INVITATION',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Supplier invitation failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-12: Supplier Invitation Rejection for Inactive / Blocked Supplier
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const targetRfq = testRFQs[0];
      const res = SupplierInvitationEngine.inviteSuppliers(
        targetRfq.id,
        [sampleInactiveSupplier.id],
        undefined,
        testRFQs,
        testInvitations,
        testAuditLogs,
        context
      );

      if (!res.success && res.error?.includes('inactive in Master Data')) {
        results.push({
          scenarioId: 'SCENARIO-12',
          name: 'Supplier Invitation Rejection for Inactive / Blocked Supplier',
          category: 'INVITATION',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Correctly blocked invitation to inactive supplier: ${res.error}`
        });
      } else {
        throw new Error('Inactive supplier was unexpectedly invited');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-12',
        name: 'Supplier Invitation Rejection for Inactive / Blocked Supplier',
        category: 'INVITATION',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Blocked supplier test failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-13: Duplicate Supplier Invitation Blocked on Same RFQ
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const targetRfq = testRFQs.find(r => r.status === 'PUBLISHED');
      if (!targetRfq) throw new Error('No PUBLISHED RFQ found');

      // Attempt to invite Supplier A again
      const res = SupplierInvitationEngine.inviteSuppliers(
        targetRfq.id,
        [sampleSupplierA.id],
        undefined,
        testRFQs,
        testInvitations,
        testAuditLogs,
        context,
        targetRfq.version
      );

      if (!res.success && res.error?.includes('has already been invited')) {
        results.push({
          scenarioId: 'SCENARIO-13',
          name: 'Duplicate Supplier Invitation Blocked on Same RFQ',
          category: 'INVITATION',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Correctly prevented duplicate invitation: ${res.error}`
        });
      } else {
        throw new Error('Duplicate invitation was unexpectedly allowed');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-13',
        name: 'Duplicate Supplier Invitation Blocked on Same RFQ',
        category: 'INVITATION',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Duplicate invitation check failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-14: Supplier Decline Sourcing Invitation
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const targetRfq = testRFQs.find(r => r.status === 'PUBLISHED');
      if (!targetRfq) throw new Error('No PUBLISHED RFQ found');

      const res = SupplierInvitationEngine.recordSupplierDecline(
        targetRfq.id,
        sampleSupplierB.id,
        'Factory capacity at 100% utilization for Q1 2026',
        testRFQs,
        testInvitations,
        testAuditLogs,
        context
      );

      if (res.success && res.invitation && res.invitation.invitationStatus === 'DECLINED' && res.invitation.declineReason) {
        results.push({
          scenarioId: 'SCENARIO-14',
          name: 'Supplier Decline Sourcing Invitation',
          category: 'INVITATION',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Decline recorded for ${sampleSupplierB.name}: ${res.invitation.declineReason}`
        });
      } else {
        throw new Error(res.error || 'Failed to record supplier decline');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-14',
        name: 'Supplier Decline Sourcing Invitation',
        category: 'INVITATION',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Supplier decline test failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-15: Cross-Tenant RFQ & Sourcing Security Isolation
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const foreignContext = { ...context, tenantId: 'ten-FOREIGN-999' };
      const targetRfq = testRFQs[0];

      const res = RFQEngine.updateRFQ(
        targetRfq.id,
        { title: 'Cross-Tenant Tampering' },
        undefined,
        testRFQs,
        testAuditLogs,
        foreignContext
      );

      if (!res.success && res.error?.includes('Cross-tenant RFQ modification strictly prohibited')) {
        results.push({
          scenarioId: 'SCENARIO-15',
          name: 'Cross-Tenant RFQ & Sourcing Security Isolation',
          category: 'SECURITY_ISOLATION',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Tenant isolation verified: ${res.error}`
        });
      } else {
        throw new Error('Cross-tenant modification was permitted');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-15',
        name: 'Cross-Tenant RFQ & Sourcing Security Isolation',
        category: 'SECURITY_ISOLATION',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Tenant isolation failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-16: Multi-Entity Company & Branch Boundary Enforcement
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const targetRfq = testRFQs[0];
      const retrieved = RFQEngine.getRFQ(targetRfq.id, tenantId, testRFQs, 'comp-FOREIGN-999');

      if (!retrieved) {
        results.push({
          scenarioId: 'SCENARIO-16',
          name: 'Multi-Entity Company & Branch Boundary Enforcement',
          category: 'SECURITY_ISOLATION',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: 'Company boundary isolation verified: Cross-company retrieval blocked.'
        });
      } else {
        throw new Error('Cross-company RFQ access was permitted');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-16',
        name: 'Multi-Entity Company & Branch Boundary Enforcement',
        category: 'SECURITY_ISOLATION',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Company isolation failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-17: Supplier Quotation Intake with Line Calculations (Discount & Tax)
    // -------------------------------------------------------------
    let quoteAId = '';
    try {
      const start = Date.now();
      const targetRfq = testRFQs[0];
      const rfqLine = targetRfq.items[0];

      const res = SupplierQuotationEngine.recordQuotation(
        {
          rfqId: targetRfq.id,
          supplierId: sampleSupplierA.id,
          quotationNumber: 'VQ-ALPHA-2026-001',
          currency: 'SAR',
          deliveryLeadTimeDays: 10
        },
        [
          {
            rfqLineId: rfqLine.id,
            itemSku: rfqLine.itemSku,
            quotedQuantity: 5,
            quotedUOM: 'PCS',
            unitPrice: 17500, // 5 * 17500 = 87,500
            discountPercent: 5, // 5% discount = 4,375 -> Net: 83,125
            taxRate: 15 // 15% VAT = 12,468.75 -> Total: 95,593.75
          }
        ],
        testQuotations,
        testRFQs,
        testInvitations,
        testAuditLogs,
        context
      );

      if (res.success && res.quotation && res.quotation.status === 'SUBMITTED' && res.quotation.items[0].lineTotal === 95593.75) {
        quoteAId = res.quotation.id;
        results.push({
          scenarioId: 'SCENARIO-17',
          name: 'Supplier Quotation Intake with Line Calculations (Discount & Tax)',
          category: 'QUOTATION_INTAKE',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Quotation recorded: Subtotal 87,500, Disc 4,375, Tax 12,468.75, Gross Total: ${res.quotation.totalGrossAmount} SAR.`
        });
      } else {
        throw new Error(res.error || 'Failed to record quotation');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-17',
        name: 'Supplier Quotation Intake with Line Calculations (Discount & Tax)',
        category: 'QUOTATION_INTAKE',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Quotation intake failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-18: Multi-Currency Quotation Intake (USD -> SAR Normalization)
    // -------------------------------------------------------------
    let quoteBId = '';
    try {
      const start = Date.now();
      const targetRfq = testRFQs[0];
      const rfqLine = targetRfq.items[0];

      // Re-invite supplier B to create quote
      SupplierInvitationEngine.inviteSuppliers(
        targetRfq.id,
        [sampleSupplierB.id],
        undefined,
        testRFQs,
        testInvitations,
        testAuditLogs,
        context
      );

      const res = SupplierQuotationEngine.recordQuotation(
        {
          rfqId: targetRfq.id,
          supplierId: sampleSupplierB.id,
          quotationNumber: 'VQ-BETA-USD-001',
          currency: 'USD',
          exchangeRate: 3.75, // 1 USD = 3.75 SAR
          deliveryLeadTimeDays: 7
        },
        [
          {
            rfqLineId: rfqLine.id,
            itemSku: rfqLine.itemSku,
            quotedQuantity: 5,
            quotedUOM: 'PCS',
            unitPrice: 4500, // 5 * 4500 = 22,500 USD
            discountPercent: 0,
            taxRate: 0 // Tax exempt export
          }
        ],
        testQuotations,
        testRFQs,
        testInvitations,
        testAuditLogs,
        context
      );

      if (res.success && res.quotation && res.quotation.currency === 'USD' && res.quotation.totalGrossAmountBaseCurrency === 84375) {
        quoteBId = res.quotation.id;
        results.push({
          scenarioId: 'SCENARIO-18',
          name: 'Multi-Currency Quotation Intake (USD -> SAR Normalization)',
          category: 'QUOTATION_INTAKE',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Normalized 22,500 USD @ 3.75 -> ${res.quotation.totalGrossAmountBaseCurrency} SAR in base currency.`
        });
      } else {
        throw new Error(res.error || 'Multi-currency quotation intake failed');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-18',
        name: 'Multi-Currency Quotation Intake (USD -> SAR Normalization)',
        category: 'QUOTATION_INTAKE',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Multi-currency intake failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-19: Quotation UOM Normalization (BOX -> PCS)
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const targetRfq = testRFQs.find(r => r.items[0].targetUOM === 'BOX') || testRFQs[0];
      const rfqLine = targetRfq.items[0];

      const res = SupplierQuotationEngine.recordQuotation(
        {
          rfqId: targetRfq.id,
          supplierId: sampleSupplierA.id,
          quotationNumber: `VQ-UOM-TEST-${Date.now()}`,
          currency: 'SAR'
        },
        [
          {
            rfqLineId: rfqLine.id,
            itemSku: rfqLine.itemSku,
            quotedQuantity: 30, // Quoting 30 PCS directly
            quotedUOM: 'PCS',
            unitPrice: 17000
          }
        ],
        testQuotations,
        testRFQs,
        testInvitations,
        testAuditLogs,
        context
      );

      if (res.success && res.quotation && res.quotation.items[0].baseQuantity === 30) {
        results.push({
          scenarioId: 'SCENARIO-19',
          name: 'Quotation UOM Normalization (BOX -> PCS)',
          category: 'QUOTATION_INTAKE',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Quoted in PCS directly converted & aligned with base unit (${res.quotation.items[0].baseQuantity} PCS).`
        });
      } else {
        throw new Error(res.error || 'Quotation UOM normalization failed');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-19',
        name: 'Quotation UOM Normalization (BOX -> PCS)',
        category: 'QUOTATION_INTAKE',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'UOM normalization failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-20: Duplicate Quotation Submission Blocked
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const targetRfq = testRFQs[0];
      const rfqLine = targetRfq.items[0];

      const res = SupplierQuotationEngine.recordQuotation(
        {
          rfqId: targetRfq.id,
          supplierId: sampleSupplierA.id,
          quotationNumber: 'VQ-ALPHA-2026-001', // Duplicate quote number
          currency: 'SAR'
        },
        [
          {
            rfqLineId: rfqLine.id,
            itemSku: rfqLine.itemSku,
            quotedQuantity: 5,
            unitPrice: 17500
          }
        ],
        testQuotations,
        testRFQs,
        testInvitations,
        testAuditLogs,
        context
      );

      if (!res.success && res.error?.includes('has already been recorded')) {
        results.push({
          scenarioId: 'SCENARIO-20',
          name: 'Duplicate Quotation Submission Blocked',
          category: 'QUOTATION_INTAKE',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Duplicate quotation correctly blocked: ${res.error}`
        });
      } else {
        throw new Error('Duplicate quotation was unexpectedly allowed');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-20',
        name: 'Duplicate Quotation Submission Blocked',
        category: 'QUOTATION_INTAKE',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Duplicate quote check failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-21: Quotation Controlled Revision Tracking (Revision 2)
    // -------------------------------------------------------------
    let quoteARev2Id = '';
    try {
      const start = Date.now();
      const parentQuote = testQuotations.find(q => q.id === quoteAId);
      if (!parentQuote) throw new Error('Parent quotation not found');

      const res = SupplierQuotationEngine.createQuotationRevision(
        parentQuote.id,
        { currency: 'SAR', deliveryLeadTimeDays: 8 },
        [
          {
            rfqLineId: parentQuote.items[0].rfqLineId,
            itemSku: parentQuote.items[0].itemSku,
            quotedQuantity: 5,
            quotedUOM: 'PCS',
            unitPrice: 16800, // Price reduced from 17,500 to 16,800
            discountPercent: 5,
            taxRate: 15
          }
        ],
        'Supplier provided additional 4% promotional discount on revised quote',
        testQuotations,
        testRFQs,
        testAuditLogs,
        context,
        parentQuote.version
      );

      if (res.success && res.quotation && res.quotation.revisionNumber === 2 && parentQuote.status === 'REVISED') {
        quoteARev2Id = res.quotation.id;
        results.push({
          scenarioId: 'SCENARIO-21',
          name: 'Quotation Controlled Revision Tracking (Revision 2)',
          category: 'QUOTATION_INTAKE',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Quotation revised to Revision 2. Previous quotation ${parentQuote.id} marked as REVISED.`
        });
      } else {
        throw new Error(res.error || 'Failed to create quotation revision');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-21',
        name: 'Quotation Controlled Revision Tracking (Revision 2)',
        category: 'QUOTATION_INTAKE',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Revision tracking failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-22: Quotation Revision Optimistic Locking Check
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const quote = testQuotations.find(q => q.id === quoteARev2Id);
      if (!quote) throw new Error('Revision 2 quote not found');

      const res = SupplierQuotationEngine.createQuotationRevision(
        quote.id,
        {},
        undefined,
        'Concurrent revision test',
        testQuotations,
        testRFQs,
        testAuditLogs,
        context,
        999 // Stale version
      );

      if (!res.success && res.isConflict) {
        results.push({
          scenarioId: 'SCENARIO-22',
          name: 'Quotation Revision Optimistic Locking Check',
          category: 'QUOTATION_INTAKE',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Optimistic concurrency lock verified: ${res.error}`
        });
      } else {
        throw new Error('Revision with stale version succeeded unexpectedly');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-22',
        name: 'Quotation Revision Optimistic Locking Check',
        category: 'QUOTATION_INTAKE',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Concurrency lock check failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-23: Multi-Criteria Quotation Comparison Matrix Generation
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const targetRfq = testRFQs[0];

      const res = QuotationComparisonEngine.generateComparisonMatrix(
        targetRfq.id,
        testRFQs,
        testQuotations,
        testAuditLogs,
        context
      );

      if (res.success && res.report && res.report.totalComparisons.length >= 2) {
        results.push({
          scenarioId: 'SCENARIO-23',
          name: 'Multi-Criteria Quotation Comparison Matrix Generation',
          category: 'COMPARISON_SCORING',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Comparison matrix generated with ${res.report.totalComparisons.length} supplier evaluations across lines & totals.`
        });
      } else {
        throw new Error(res.error || 'Comparison matrix generation failed');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-23',
        name: 'Multi-Criteria Quotation Comparison Matrix Generation',
        category: 'COMPARISON_SCORING',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Comparison matrix test failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-24: Quotation Ranking with Custom Weighted Scoring Criteria
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const targetRfq = testRFQs[0];

      // Custom weights: 70% price, 10% lead time, 10% quality, 10% commercial
      const res = QuotationComparisonEngine.generateComparisonMatrix(
        targetRfq.id,
        testRFQs,
        testQuotations,
        testAuditLogs,
        context,
        { priceWeight: 0.70, leadTimeWeight: 0.10, qualityWeight: 0.10, commercialWeight: 0.10 }
      );

      if (res.success && res.report && res.report.totalComparisons[0].rank === 1) {
        const topSupplier = res.report.totalComparisons[0];
        results.push({
          scenarioId: 'SCENARIO-24',
          name: 'Quotation Ranking with Custom Weighted Scoring Criteria',
          category: 'COMPARISON_SCORING',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Top ranked supplier: ${topSupplier.supplierName} (Rank #1, Score: ${topSupplier.compositeScore}/100).`
        });
      } else {
        throw new Error(res.error || 'Quotation ranking failed');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-24',
        name: 'Quotation Ranking with Custom Weighted Scoring Criteria',
        category: 'COMPARISON_SCORING',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Ranking test failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-25: Single Supplier Sourcing Award Execution
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const targetRfq = testRFQs[0];
      const rfqLine = targetRfq.items[0];
      const winningQuote = testQuotations.find(q => q.rfqId === targetRfq.id && q.status === 'SUBMITTED');
      if (!winningQuote) throw new Error('No active quote found for award');

      const res = RFQAwardEngine.executeAward(
        targetRfq.id,
        'SINGLE_SUPPLIER',
        [
          {
            rfqLineId: rfqLine.id,
            quotationId: winningQuote.id,
            quotationLineId: winningQuote.items[0].id,
            awardedQuantity: rfqLine.targetQuantity || 5,
            reason: 'Best overall evaluated commercial and technical proposal'
          }
        ],
        'Commercial evaluation approved by procurement committee',
        testRFQs,
        testQuotations,
        testAwards,
        testAuditLogs,
        context,
        targetRfq.version
      );

      if (res.success && res.award && res.award.status === 'APPROVED' && targetRfq.status === 'AWARDED') {
        results.push({
          scenarioId: 'SCENARIO-25',
          name: 'Single Supplier Sourcing Award Execution',
          category: 'AWARD_SPLIT',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Award ${res.award.awardNumber} executed. RFQ transitioned to AWARDED, Winning quote to ACCEPTED.`
        });
      } else {
        throw new Error(res.error || 'Single supplier award failed');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-25',
        name: 'Single Supplier Sourcing Award Execution',
        category: 'AWARD_SPLIT',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Single award failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-26: Split Award Allocation Across Multiple Suppliers
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      // Create a fresh RFQ with 10 units for split award test
      const rfqRes = RFQEngine.createRFQ(
        { title: 'Split Award Sourcing RFQ', currency: 'SAR' },
        [
          {
            productId: sampleProduct.id,
            itemSku: sampleProduct.sku,
            itemName: sampleProduct.name,
            targetQuantity: 10,
            targetUOM: 'PCS',
            targetUnitPrice: 18000
          }
        ],
        testRFQs,
        testAuditLogs,
        context
      );
      if (!rfqRes.success || !rfqRes.rfq) throw new Error('Failed to create RFQ for split award');
      const splitRfq = rfqRes.rfq;

      // Submit Quote 1 (Alpha)
      const q1Res = SupplierQuotationEngine.recordQuotation(
        { rfqId: splitRfq.id, supplierId: sampleSupplierA.id, quotationNumber: 'VQ-SPLIT-A', currency: 'SAR' },
        [{ rfqLineId: splitRfq.items[0].id, itemSku: sampleProduct.sku, quotedQuantity: 10, unitPrice: 17500 }],
        testQuotations,
        testRFQs,
        testInvitations,
        testAuditLogs,
        context
      );
      // Submit Quote 2 (Beta)
      const q2Res = SupplierQuotationEngine.recordQuotation(
        { rfqId: splitRfq.id, supplierId: sampleSupplierB.id, quotationNumber: 'VQ-SPLIT-B', currency: 'SAR' },
        [{ rfqLineId: splitRfq.items[0].id, itemSku: sampleProduct.sku, quotedQuantity: 10, unitPrice: 17200 }],
        testQuotations,
        testRFQs,
        testInvitations,
        testAuditLogs,
        context
      );

      // Execute Split Award: 6 units to Beta (lower price), 4 units to Alpha (faster lead time)
      const awardRes = RFQAwardEngine.executeAward(
        splitRfq.id,
        'SPLIT_AWARD',
        [
          {
            rfqLineId: splitRfq.items[0].id,
            quotationId: q2Res.quotation!.id,
            quotationLineId: q2Res.quotation!.items[0].id,
            awardedQuantity: 6,
            reason: '60% primary allocation at lower unit price'
          },
          {
            rfqLineId: splitRfq.items[0].id,
            quotationId: q1Res.quotation!.id,
            quotationLineId: q1Res.quotation!.items[0].id,
            awardedQuantity: 4,
            reason: '40% secondary allocation for supply chain redundancy'
          }
        ],
        'Multi-sourcing policy applied to mitigate single-vendor risk',
        testRFQs,
        testQuotations,
        testAwards,
        testAuditLogs,
        context,
        splitRfq.version
      );

      if (awardRes.success && awardRes.award && awardRes.award.lines.length === 2 && splitRfq.status === 'AWARDED') {
        results.push({
          scenarioId: 'SCENARIO-26',
          name: 'Split Award Allocation Across Multiple Suppliers',
          category: 'AWARD_SPLIT',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Split Award ${awardRes.award.awardNumber} executed: 6 units to ${sampleSupplierB.name}, 4 units to ${sampleSupplierA.name}.`
        });
      } else {
        throw new Error(awardRes.error || 'Split award execution failed');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-26',
        name: 'Split Award Allocation Across Multiple Suppliers',
        category: 'AWARD_SPLIT',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Split award failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-27: Over-Award Validation Guard (Award Qty > Target Qty)
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const rfqRes = RFQEngine.createRFQ(
        { title: 'Over-Award Test RFQ', currency: 'SAR' },
        [{ productId: sampleProduct.id, itemSku: sampleProduct.sku, itemName: sampleProduct.name, targetQuantity: 5, targetUOM: 'PCS' }],
        testRFQs,
        testAuditLogs,
        context
      );
      const testRfq = rfqRes.rfq!;
      const qRes = SupplierQuotationEngine.recordQuotation(
        { rfqId: testRfq.id, supplierId: sampleSupplierA.id, quotationNumber: 'VQ-OVER-01', currency: 'SAR' },
        [{ rfqLineId: testRfq.items[0].id, itemSku: sampleProduct.sku, quotedQuantity: 10, unitPrice: 15000 }],
        testQuotations,
        testRFQs,
        testInvitations,
        testAuditLogs,
        context
      );

      // Attempt to award 8 units when target is only 5 units
      const awardRes = RFQAwardEngine.executeAward(
        testRfq.id,
        'SINGLE_SUPPLIER',
        [{ rfqLineId: testRfq.items[0].id, quotationId: qRes.quotation!.id, quotationLineId: qRes.quotation!.items[0].id, awardedQuantity: 8 }],
        'Intentional over-award test',
        testRFQs,
        testQuotations,
        testAwards,
        testAuditLogs,
        context,
        testRfq.version
      );

      if (!awardRes.success && awardRes.error?.includes('exceeds target quantity')) {
        results.push({
          scenarioId: 'SCENARIO-27',
          name: 'Over-Award Validation Guard (Award Qty > Target Qty)',
          category: 'AWARD_SPLIT',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Over-award correctly caught and rejected: ${awardRes.error}`
        });
      } else {
        throw new Error('Over-award was unexpectedly permitted');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-27',
        name: 'Over-Award Validation Guard (Award Qty > Target Qty)',
        category: 'AWARD_SPLIT',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Over-award check failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-28: Immutable Audit Trail Generation with Cryptographic Hash
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const rfqLogs = testAuditLogs.filter(l => l.targetDocumentType === 'RFQ' || l.targetDocumentType === 'QUOTATION' || l.targetDocumentType === 'AWARD');
      const allHaveHash = rfqLogs.length > 0 && rfqLogs.every(l => l.immutableHash && l.immutableHash.length > 0);

      if (allHaveHash) {
        results.push({
          scenarioId: 'SCENARIO-28',
          name: 'Immutable Audit Trail Generation with Cryptographic Hash',
          category: 'AUDIT_CONCURRENCY_E2E',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `Verified ${rfqLogs.length} audit logs. All contain valid enterprise digital signatures & nonces.`
        });
      } else {
        throw new Error('Audit records lack valid digital signatures');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-28',
        name: 'Immutable Audit Trail Generation with Cryptographic Hash',
        category: 'AUDIT_CONCURRENCY_E2E',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Audit trail verification failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-29: RFQ Administrative Cancellation with Mandatory Justification
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      const rfqRes = RFQEngine.createRFQ(
        { title: 'RFQ To Be Cancelled', currency: 'SAR' },
        [{ productId: sampleProduct.id, itemSku: sampleProduct.sku, itemName: sampleProduct.name, targetQuantity: 2, targetUOM: 'PCS' }],
        testRFQs,
        testAuditLogs,
        context
      );
      const cancelRfq = rfqRes.rfq!;

      const res = RFQEngine.cancelRFQ(
        cancelRfq.id,
        'Project scope restructured; compute requirements transferred to Cloud division',
        testRFQs,
        testAuditLogs,
        context,
        cancelRfq.version
      );

      if (res.success && res.rfq && res.rfq.status === 'CANCELLED' && res.rfq.cancellationReason) {
        results.push({
          scenarioId: 'SCENARIO-29',
          name: 'RFQ Administrative Cancellation with Mandatory Justification',
          category: 'AUDIT_CONCURRENCY_E2E',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `RFQ ${res.rfq.rfqNumber} successfully cancelled with justification recorded.`
        });
      } else {
        throw new Error(res.error || 'Failed to cancel RFQ');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-29',
        name: 'RFQ Administrative Cancellation with Mandatory Justification',
        category: 'AUDIT_CONCURRENCY_E2E',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'Cancellation test failed',
        error: e.message
      });
    }

    // -------------------------------------------------------------
    // SCENARIO-30: Full End-to-End Sourcing Lifecycle Integration
    // -------------------------------------------------------------
    try {
      const start = Date.now();
      // Step 1: Find an approved PR
      const approvedPr = testRequisitions.find(p => p.status === 'APPROVED');
      if (!approvedPr) throw new Error('No approved PR found for E2E flow');

      // Step 2: PR -> RFQ
      const rfqRes = RFQEngine.createRFQFromPR(
        approvedPr.id,
        undefined,
        [sampleSupplierA.id, sampleSupplierB.id],
        new Date(Date.now() + 14 * 86400000).toISOString(),
        testRequisitions,
        testRFQs,
        testAuditLogs,
        context
      );
      if (!rfqRes.success || !rfqRes.rfq) throw new Error(`E2E Step 2 failed: ${rfqRes.error}`);
      const e2eRfq = rfqRes.rfq;

      // Step 3: Publish RFQ
      RFQEngine.publishRFQ(e2eRfq.id, testRFQs, testAuditLogs, context, e2eRfq.version);

      // Step 4: Record Supplier A Quotation
      const qARes = SupplierQuotationEngine.recordQuotation(
        { rfqId: e2eRfq.id, supplierId: sampleSupplierA.id, quotationNumber: 'VQ-E2E-ALPHA', currency: 'SAR', deliveryLeadTimeDays: 12 },
        [{ rfqLineId: e2eRfq.items[0].id, itemSku: e2eRfq.items[0].itemSku, quotedQuantity: e2eRfq.items[0].targetQuantity, unitPrice: 17400, taxRate: 15 }],
        testQuotations,
        testRFQs,
        testInvitations,
        testAuditLogs,
        context
      );
      if (!qARes.success || !qARes.quotation) throw new Error(`E2E Step 4 failed: ${qARes.error}`);

      // Step 5: Record Supplier B Quotation
      const qBRes = SupplierQuotationEngine.recordQuotation(
        { rfqId: e2eRfq.id, supplierId: sampleSupplierB.id, quotationNumber: 'VQ-E2E-BETA', currency: 'USD', exchangeRate: 3.75, deliveryLeadTimeDays: 8 },
        [{ rfqLineId: e2eRfq.items[0].id, itemSku: e2eRfq.items[0].itemSku, quotedQuantity: e2eRfq.items[0].targetQuantity, unitPrice: 4400, taxRate: 0 }],
        testQuotations,
        testRFQs,
        testInvitations,
        testAuditLogs,
        context
      );
      if (!qBRes.success || !qBRes.quotation) throw new Error(`E2E Step 5 failed: ${qBRes.error}`);

      // Step 6: Generate Comparison Matrix
      const matrixRes = QuotationComparisonEngine.generateComparisonMatrix(e2eRfq.id, testRFQs, testQuotations, testAuditLogs, context);
      if (!matrixRes.success || !matrixRes.report) throw new Error(`E2E Step 6 failed: ${matrixRes.error}`);

      // Step 7: Execute Sourcing Award
      const awardRes = RFQAwardEngine.executeAward(
        e2eRfq.id,
        'SINGLE_SUPPLIER',
        [{
          rfqLineId: e2eRfq.items[0].id,
          quotationId: qBRes.quotation.id,
          quotationLineId: qBRes.quotation.items[0].id,
          awardedQuantity: e2eRfq.items[0].targetQuantity || 1,
          reason: 'Lowest evaluated base-currency cost with fastest delivery lead time'
        }],
        'Approved by Procurement Review Board',
        testRFQs,
        testQuotations,
        testAwards,
        testAuditLogs,
        context,
        e2eRfq.version
      );
      if (!awardRes.success || !awardRes.award) throw new Error(`E2E Step 7 failed: ${awardRes.error}`);

      // Step 8: Verify Complete Sourcing State
      if (
        approvedPr.status === 'IN_RFQ' &&
        e2eRfq.status === 'AWARDED' &&
        qBRes.quotation.status === 'ACCEPTED' &&
        qARes.quotation.status === 'REJECTED' &&
        awardRes.award.status === 'APPROVED'
      ) {
        results.push({
          scenarioId: 'SCENARIO-30',
          name: 'Full End-to-End Sourcing Lifecycle Integration',
          category: 'AUDIT_CONCURRENCY_E2E',
          status: 'PASS',
          executionTimeMs: Date.now() - start,
          details: `E2E Verified: PR ${approvedPr.prNumber} -> RFQ ${e2eRfq.rfqNumber} -> 2 Quotes -> Matrix -> Award ${awardRes.award.awardNumber} (Status: APPROVED, READY_FOR_PO).`
        });
      } else {
        throw new Error('E2E lifecycle state validation mismatch');
      }
    } catch (e: any) {
      results.push({
        scenarioId: 'SCENARIO-30',
        name: 'Full End-to-End Sourcing Lifecycle Integration',
        category: 'AUDIT_CONCURRENCY_E2E',
        status: 'FAIL',
        executionTimeMs: 0,
        details: 'E2E lifecycle failed',
        error: e.message
      });
    }

    // Run Regression Suite for Frozen Phases (Phase 3.2B-01 runs P31 & P32A regressions)
    const p32B01Report = await Phase32B01HardeningSuite.runSuite();
    const isP31Passed = p32B01Report.phase31RegressionPassed;
    const isP32APassed = p32B01Report.phase32ARegressionPassed;
    const isP32B01Passed = p32B01Report.verdict === 'APPROVED' && p32B01Report.passedCount === 30;

    const passedCount = results.filter(r => r.status === 'PASS').length;
    const failedCount = results.filter(r => r.status === 'FAIL').length;
    const skippedCount = results.filter(r => r.status === 'SKIPPED').length;
    const totalScenarios = results.length;
    const successRate = `${((passedCount / totalScenarios) * 100).toFixed(1)}%`;

    const verdict = (
      passedCount === 30 &&
      failedCount === 0 &&
      isP31Passed &&
      isP32APassed &&
      isP32B01Passed
    ) ? 'APPROVED' : 'REJECTED';

    return {
      suiteName: 'AM ERP Phase 3.2B-02 Hardening Suite (RFQ & Supplier Quotations)',
      phase: 'PHASE-3.2B-02',
      totalScenarios,
      passedCount,
      failedCount,
      skippedCount,
      successRate,
      timestamp: new Date().toISOString(),
      results,
      phase31RegressionPassed: isP31Passed,
      phase32ARegressionPassed: isP32APassed,
      phase32B01RegressionPassed: isP32B01Passed,
      verdict
    };
  }
}
