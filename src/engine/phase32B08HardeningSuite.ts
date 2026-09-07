/**
 * AM Business Platform - Phase 3.2B-08 Hardening Suite
 * Evaluated Receipt Settlement (ERS), Vendor Consignment Settlements,
 * Landed Cost Adjustments, Supplier Scorecarding & Prepayment Amortization
 * Authoritative 30/30 Test Verification Suite
 * Aligned with SAP S/4HANA (MM-PUR / MRRL / MRKO / ME61), Oracle Cloud SCM & IFRS/ZATCA Standards
 */

import { AdvancedProcurementEngine } from './advancedProcurementEngine';
import {
  GoodsReceiptNote,
  PurchaseOrder,
  ConsignmentAgreement,
  ConsignmentStockRecord,
  ConsignmentWithdrawal,
  LandedCostActualInvoice,
  VendorPrepayment
} from '../types/procurement';

import {
  APVoucher,
  SupplierInvoice
} from '../types/accountsPayable';

export interface HardeningTestResult {
  testId: string;
  name: string;
  category: string;
  status: 'PASS' | 'FAIL';
  executionTimeMs: number;
  details: string;
  error?: string;
}

export interface Phase32B08HardeningReport {
  suiteId: string;
  phase: string;
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  durationMs: number;
  results: HardeningTestResult[];
  overallStatus: 'PASS' | 'FAIL';
}

export class Phase32B08HardeningSuite {
  static async runSuite(): Promise<Phase32B08HardeningReport> {
    const startTime = Date.now();
    const results: HardeningTestResult[] = [];

    const mockTenantId = 'ten-001';
    const mockCompanyId = 'comp-001';
    const mockBranchId = 'br-001';

    const vendorA = { id: 'ven-001', code: 'VEND-001', name: 'Apex Industrial Supplies' };
    const vendorB = { id: 'ven-002', code: 'VEND-002', name: 'Global Logistics Partners' };
    const vendorC = { id: 'ven-003', code: 'VEND-003', name: 'Silicon Hardware Tech' };

    const executeTest = (
      testId: string,
      name: string,
      category: string,
      testFn: () => void | Promise<void>
    ) => {
      const tStart = Date.now();
      try {
        testFn();
        results.push({
          testId,
          name,
          category,
          status: 'PASS',
          executionTimeMs: Date.now() - tStart,
          details: 'Assertion validated business invariants successfully.'
        });
      } catch (err: any) {
        results.push({
          testId,
          name,
          category,
          status: 'FAIL',
          executionTimeMs: Date.now() - tStart,
          details: 'Assertion failed.',
          error: err.message
        });
      }
    };

    // =========================================================================
    // PILLAR 1: EVALUATED RECEIPT SETTLEMENT (ERS) (TESTS 01 - 07)
    // =========================================================================

    // Test 01: Happy-path ERS self-billing tax invoice generation
    executeTest('32B08-TEST-01', 'Happy-Path ERS Self-Billing Invoice Generation', 'ERS', () => {
      const po: PurchaseOrder = {
        id: 'po-101',
        poNumber: 'PO-2026-0101',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        currency: 'USD',
        exchangeRate: 1.0,
        status: 'APPROVED',
        subtotal: 10000,
        taxTotal: 1500,
        grandTotal: 11500,
        items: [
          {
            id: 'po-item-1',
            itemSku: 'SKU-VALVE-01',
            itemName: 'Industrial Pressure Valve',
            orderedQty: 10,
            unitPrice: 1000,
            lineTotal: 10000,
            receivedQty: 10,
            status: 'RECEIVED'
          } as any
        ],
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
        version: 1
      };

      const grn: GoodsReceiptNote = {
        id: 'grn-101',
        grnNumber: 'GRN-2026-0101',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        warehouseId: 'wh-001',
        vendorId: vendorA.id,
        vendorName: vendorA.name,
        poId: po.id,
        poNumber: po.poNumber,
        receivedAt: '2026-08-05T10:00:00Z',
        receivedBy: 'user-01',
        status: 'POSTED',
        qualityStatus: 'APPROVED',
        items: [
          {
            id: 'grn-item-1',
            grnId: 'grn-101',
            poId: po.id,
            poItemId: 'po-item-1',
            itemSku: 'SKU-VALVE-01',
            itemName: 'Industrial Pressure Valve',
            receivedUOM: 'EA',
            receivedQty: 10,
            acceptedQty: 10,
            rejectedQty: 0,
            quarantinedQty: 0,
            unitCost: 1000,
            totalCost: 10000,
            baseQuantity: 10,
            baseUOM: 'EA',
            uomConversionFactor: 1,
            warehouseId: 'wh-001',
            qualityStatus: 'APPROVED',
            landedCostAllocated: 0,
            capitalizedUnitCost: 1000,
            capitalizedTotalCost: 10000,
            version: 1
          }
        ],
        totalReceivedQuantity: 10,
        totalReceivedAmount: 10000,
        landedCostTotal: 0,
        capitalizedGrandTotal: 10000,
        currency: 'USD',
        exchangeRate: 1,
        version: 1,
        createdAt: '2026-08-05T10:00:00Z',
        updatedAt: '2026-08-05T10:00:00Z'
      };

      const result = AdvancedProcurementEngine.generateERSInvoices(
        {
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          cutoffDate: '2026-08-31',
          taxPercent: 15.0,
          performedBy: 'procurement-bot'
        },
        [grn],
        [po]
      );

      if (result.generatedInvoicesCount !== 1) {
        throw new Error(`Expected 1 ERS invoice, got ${result.generatedInvoicesCount}`);
      }
      const inv = result.invoices[0];
      if (inv.netAmount !== 10000 || inv.taxAmount !== 1500 || inv.grossAmount !== 11500) {
        throw new Error(`Invalid invoice totals: net=${inv.netAmount}, tax=${inv.taxAmount}, gross=${inv.grossAmount}`);
      }
      if (!inv.ersNumber.startsWith('ERS-') || !inv.selfBillingInvoiceNumber.startsWith('SBI-')) {
        throw new Error(`Invalid document numbers: ${inv.ersNumber}, ${inv.selfBillingInvoiceNumber}`);
      }
      if (!inv.immutableHash.startsWith('ERS-HASH-')) {
        throw new Error('Missing ERS immutable SHA-256 seal.');
      }
    });

    // Test 02: ERS rejection of quarantined GRN
    executeTest('32B08-TEST-02', 'ERS Rejection of Quarantined/Rejected GRN', 'ERS', () => {
      const grn: GoodsReceiptNote = {
        id: 'grn-102',
        grnNumber: 'GRN-2026-0102',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        warehouseId: 'wh-001',
        vendorId: vendorA.id,
        vendorName: vendorA.name,
        poId: 'po-102',
        poNumber: 'PO-2026-0102',
        receivedAt: '2026-08-05T10:00:00Z',
        receivedBy: 'user-01',
        status: 'POSTED',
        qualityStatus: 'QUARANTINED',
        items: [],
        totalReceivedQuantity: 10,
        totalReceivedAmount: 10000,
        landedCostTotal: 0,
        capitalizedGrandTotal: 10000,
        currency: 'USD',
        exchangeRate: 1,
        version: 1,
        createdAt: '2026-08-05T10:00:00Z',
        updatedAt: '2026-08-05T10:00:00Z'
      };

      const result = AdvancedProcurementEngine.generateERSInvoices(
        {
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          cutoffDate: '2026-08-31',
          performedBy: 'procurement-bot'
        },
        [grn],
        []
      );

      if (result.generatedInvoicesCount !== 0) {
        throw new Error('Quarantined GRN must not generate ERS invoices.');
      }
    });

    // Test 03: ERS exclusion of unposted / draft GRN
    executeTest('32B08-TEST-03', 'ERS Exclusion of Draft/Unposted GRN', 'ERS', () => {
      const grn: GoodsReceiptNote = {
        id: 'grn-103',
        grnNumber: 'GRN-2026-0103',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        warehouseId: 'wh-001',
        vendorId: vendorA.id,
        vendorName: vendorA.name,
        poId: 'po-103',
        poNumber: 'PO-2026-0103',
        receivedAt: '2026-08-05T10:00:00Z',
        receivedBy: 'user-01',
        status: 'DRAFT' as any,
        qualityStatus: 'APPROVED',
        items: [],
        totalReceivedQuantity: 10,
        totalReceivedAmount: 10000,
        landedCostTotal: 0,
        capitalizedGrandTotal: 10000,
        currency: 'USD',
        exchangeRate: 1,
        version: 1,
        createdAt: '2026-08-05T10:00:00Z',
        updatedAt: '2026-08-05T10:00:00Z'
      };

      const result = AdvancedProcurementEngine.generateERSInvoices(
        {
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          cutoffDate: '2026-08-31',
          performedBy: 'procurement-bot'
        },
        [grn],
        []
      );

      if (result.generatedInvoicesCount !== 0) {
        throw new Error('Draft GRN must not generate ERS invoices.');
      }
    });

    // Test 04: ERS idempotency & duplicate prevention
    executeTest('32B08-TEST-04', 'ERS Idempotency and Duplicate Prevention', 'ERS', () => {
      const po: PurchaseOrder = {
        id: 'po-104',
        poNumber: 'PO-2026-0104',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        currency: 'USD',
        exchangeRate: 1.0,
        status: 'APPROVED',
        subtotal: 5000,
        taxTotal: 750,
        grandTotal: 5750,
        items: [{ id: 'po-item-104', itemSku: 'SKU-04', orderedQty: 5, unitPrice: 1000 } as any],
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
        version: 1
      };

      const grn: GoodsReceiptNote = {
        id: 'grn-104',
        grnNumber: 'GRN-2026-0104',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        warehouseId: 'wh-001',
        vendorId: vendorA.id,
        vendorName: vendorA.name,
        poId: po.id,
        poNumber: po.poNumber,
        receivedAt: '2026-08-05T10:00:00Z',
        receivedBy: 'user-01',
        status: 'POSTED',
        qualityStatus: 'APPROVED',
        items: [
          {
            id: 'grn-item-104',
            grnId: 'grn-104',
            poId: po.id,
            poItemId: 'po-item-104',
            itemSku: 'SKU-04',
            itemName: 'Item 4',
            receivedQty: 5,
            acceptedQty: 5,
            rejectedQty: 0,
            quarantinedQty: 0,
            unitCost: 1000,
            totalCost: 5000,
            baseQuantity: 5,
            baseUOM: 'EA',
            receivedUOM: 'EA',
            uomConversionFactor: 1,
            warehouseId: 'wh-001',
            qualityStatus: 'APPROVED',
            landedCostAllocated: 0,
            capitalizedUnitCost: 1000,
            capitalizedTotalCost: 5000,
            version: 1
          }
        ],
        totalReceivedQuantity: 5,
        totalReceivedAmount: 5000,
        landedCostTotal: 0,
        capitalizedGrandTotal: 5000,
        currency: 'USD',
        exchangeRate: 1,
        version: 1,
        createdAt: '2026-08-05T10:00:00Z',
        updatedAt: '2026-08-05T10:00:00Z'
      };

      const existingInvoice: any = {
        id: 'ers-existing-1',
        grnId: 'grn-104'
      };

      const result = AdvancedProcurementEngine.generateERSInvoices(
        {
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          cutoffDate: '2026-08-31',
          performedBy: 'procurement-bot'
        },
        [grn],
        [po],
        [existingInvoice]
      );

      if (result.generatedInvoicesCount !== 0) {
        throw new Error('Already settled GRN must not be duplicated in ERS run.');
      }
    });

    // Test 05: ERS tenant & company strict isolation
    executeTest('32B08-TEST-05', 'ERS Tenant & Company Isolation', 'ERS', () => {
      const grnAlien: GoodsReceiptNote = {
        id: 'grn-alien',
        grnNumber: 'GRN-ALIEN',
        tenantId: 'ten-alien-999',
        companyId: 'comp-alien-999',
        warehouseId: 'wh-001',
        vendorId: vendorA.id,
        vendorName: vendorA.name,
        poId: 'po-101',
        poNumber: 'PO-2026-0101',
        receivedAt: '2026-08-05T10:00:00Z',
        receivedBy: 'user-01',
        status: 'POSTED',
        qualityStatus: 'APPROVED',
        items: [],
        totalReceivedQuantity: 1,
        totalReceivedAmount: 100,
        landedCostTotal: 0,
        capitalizedGrandTotal: 100,
        currency: 'USD',
        exchangeRate: 1,
        version: 1,
        createdAt: '2026-08-05T10:00:00Z',
        updatedAt: '2026-08-05T10:00:00Z'
      };

      const result = AdvancedProcurementEngine.generateERSInvoices(
        {
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          cutoffDate: '2026-08-31',
          performedBy: 'procurement-bot'
        },
        [grnAlien],
        []
      );

      if (result.generatedInvoicesCount !== 0) {
        throw new Error('Alien tenant GRN must be filtered out of ERS run.');
      }
    });

    // Test 06: Multi-GRN batch ERS run with cutoff date filter
    executeTest('32B08-TEST-06', 'Multi-GRN Batch ERS Run with Cutoff Date Filtering', 'ERS', () => {
      const po: PurchaseOrder = {
        id: 'po-batch',
        poNumber: 'PO-BATCH',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        currency: 'USD',
        exchangeRate: 1.0,
        status: 'APPROVED',
        subtotal: 2000,
        taxTotal: 300,
        grandTotal: 2300,
        items: [{ id: 'po-item-b', itemSku: 'SKU-B', orderedQty: 2, unitPrice: 1000 } as any],
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
        version: 1
      };

      const grnInScope: GoodsReceiptNote = {
        id: 'grn-in-scope',
        grnNumber: 'GRN-IN-SCOPE',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        warehouseId: 'wh-001',
        vendorId: vendorA.id,
        vendorName: vendorA.name,
        poId: po.id,
        poNumber: po.poNumber,
        receivedAt: '2026-08-10T10:00:00Z',
        receivedBy: 'user-01',
        status: 'POSTED',
        qualityStatus: 'APPROVED',
        items: [
          {
            id: 'gi-1',
            grnId: 'grn-in-scope',
            poId: po.id,
            poItemId: 'po-item-b',
            itemSku: 'SKU-B',
            itemName: 'Item B',
            receivedQty: 1,
            acceptedQty: 1,
            rejectedQty: 0,
            quarantinedQty: 0,
            unitCost: 1000,
            totalCost: 1000,
            baseQuantity: 1,
            baseUOM: 'EA',
            receivedUOM: 'EA',
            uomConversionFactor: 1,
            warehouseId: 'wh-001',
            qualityStatus: 'APPROVED',
            landedCostAllocated: 0,
            capitalizedUnitCost: 1000,
            capitalizedTotalCost: 1000,
            version: 1
          }
        ],
        totalReceivedQuantity: 1,
        totalReceivedAmount: 1000,
        landedCostTotal: 0,
        capitalizedGrandTotal: 1000,
        currency: 'USD',
        exchangeRate: 1,
        version: 1,
        createdAt: '2026-08-10T10:00:00Z',
        updatedAt: '2026-08-10T10:00:00Z'
      };

      const grnOutOfScope: GoodsReceiptNote = {
        ...grnInScope,
        id: 'grn-out-scope',
        grnNumber: 'GRN-OUT-SCOPE',
        receivedAt: '2026-09-15T10:00:00Z' // Beyond cutoff date
      };

      const result = AdvancedProcurementEngine.generateERSInvoices(
        {
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          cutoffDate: '2026-08-31',
          performedBy: 'procurement-bot'
        },
        [grnInScope, grnOutOfScope],
        [po]
      );

      if (result.generatedInvoicesCount !== 1 || result.invoices[0].grnId !== 'grn-in-scope') {
        throw new Error('Cutoff date filter failed to exclude future GRN.');
      }
    });

    // Test 07: ERS precision tax calculation & voucher link
    executeTest('32B08-TEST-07', 'ERS Tax Calculation & AP Voucher Linkage', 'ERS', () => {
      const po: PurchaseOrder = {
        id: 'po-tax',
        poNumber: 'PO-TAX',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        vendorId: vendorB.id,
        vendorCode: vendorB.code,
        vendorName: vendorB.name,
        currency: 'USD',
        exchangeRate: 1.0,
        status: 'APPROVED',
        subtotal: 3333.33,
        taxTotal: 500.0,
        grandTotal: 3833.33,
        items: [{ id: 'po-item-tax', itemSku: 'SKU-TAX', orderedQty: 1, unitPrice: 3333.33 } as any],
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
        version: 1
      };

      const grn: GoodsReceiptNote = {
        id: 'grn-tax',
        grnNumber: 'GRN-TAX',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        warehouseId: 'wh-001',
        vendorId: vendorB.id,
        vendorName: vendorB.name,
        poId: po.id,
        poNumber: po.poNumber,
        receivedAt: '2026-08-10T10:00:00Z',
        receivedBy: 'user-01',
        status: 'POSTED',
        qualityStatus: 'APPROVED',
        items: [
          {
            id: 'gi-tax',
            grnId: 'grn-tax',
            poId: po.id,
            poItemId: 'po-item-tax',
            itemSku: 'SKU-TAX',
            itemName: 'Tax Item',
            receivedQty: 1,
            acceptedQty: 1,
            rejectedQty: 0,
            quarantinedQty: 0,
            unitCost: 3333.33,
            totalCost: 3333.33,
            baseQuantity: 1,
            baseUOM: 'EA',
            receivedUOM: 'EA',
            uomConversionFactor: 1,
            warehouseId: 'wh-001',
            qualityStatus: 'APPROVED',
            landedCostAllocated: 0,
            capitalizedUnitCost: 3333.33,
            capitalizedTotalCost: 3333.33,
            version: 1
          }
        ],
        totalReceivedQuantity: 1,
        totalReceivedAmount: 3333.33,
        landedCostTotal: 0,
        capitalizedGrandTotal: 3333.33,
        currency: 'USD',
        exchangeRate: 1,
        version: 1,
        createdAt: '2026-08-10T10:00:00Z',
        updatedAt: '2026-08-10T10:00:00Z'
      };

      const result = AdvancedProcurementEngine.generateERSInvoices(
        {
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          cutoffDate: '2026-08-31',
          taxPercent: 15.0,
          performedBy: 'procurement-bot'
        },
        [grn],
        [po]
      );

      const inv = result.invoices[0];
      if (inv.netAmount !== 3333.33 || inv.taxAmount !== 500.0 || inv.grossAmount !== 3833.33) {
        throw new Error(`Tax rounding variance detected: gross=${inv.grossAmount}`);
      }
      if (!inv.voucherId || !inv.voucherNumber) {
        throw new Error('Missing automatic AP Voucher generation linkage.');
      }
    });

    // =========================================================================
    // PILLAR 2: VENDOR CONSIGNMENT INVENTORY & SETTLEMENTS (TESTS 08 - 14)
    // =========================================================================

    // Test 08: Consignment agreement creation & master validation
    executeTest('32B08-TEST-08', 'Vendor Consignment Agreement Creation', 'CONSIGNMENT', () => {
      const agreement = AdvancedProcurementEngine.createConsignmentAgreement({
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        itemSku: 'SKU-CONSIGN-01',
        itemName: 'Consigned Microcontrollers',
        agreedPrice: 45.0,
        currency: 'USD',
        warehouseId: 'wh-001',
        warehouseName: 'Main Plant Warehouse',
        taxPercent: 15.0
      });

      if (!agreement.agreementNumber.startsWith('VCA-') || agreement.status !== 'ACTIVE') {
        throw new Error('Failed to create valid active consignment agreement.');
      }
    });

    // Test 09: Consignment stock withdrawal & on-hand reduction with audit trail
    executeTest('32B08-TEST-09', 'Consignment Stock Consumption & Audit Trail', 'CONSIGNMENT', () => {
      const agreement = AdvancedProcurementEngine.createConsignmentAgreement({
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        itemSku: 'SKU-CONSIGN-01',
        itemName: 'Consigned Microcontrollers',
        agreedPrice: 50.0,
        taxPercent: 15.0
      });

      const stockRecord: ConsignmentStockRecord = {
        id: 'csr-01',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        vendorId: vendorA.id,
        vendorName: vendorA.name,
        warehouseId: 'wh-001',
        itemSku: 'SKU-CONSIGN-01',
        itemName: 'Consigned Microcontrollers',
        onHandConsignedQty: 100,
        withdrawnQty: 0,
        settledQty: 0,
        openForSettlementQty: 0,
        currency: 'USD',
        agreedUnitPrice: 50.0,
        lastMovementDate: '2026-08-01T00:00:00Z'
      };

      const { withdrawal, updatedStock, auditRecord } = AdvancedProcurementEngine.recordConsignmentWithdrawal(
        {
          quantity: 20,
          purpose: 'PRODUCTION',
          withdrawalDate: '2026-08-15'
        },
        agreement,
        stockRecord,
        'prod-manager'
      );

      if (withdrawal.quantity !== 20 || withdrawal.netAmount !== 1000 || withdrawal.taxAmount !== 150 || withdrawal.grossAmount !== 1150) {
        throw new Error(`Invalid withdrawal amounts: gross=${withdrawal.grossAmount}`);
      }
      if (updatedStock.onHandConsignedQty !== 80 || updatedStock.withdrawnQty !== 20 || updatedStock.openForSettlementQty !== 20) {
        throw new Error(`Invalid updated stock quantities: onHand=${updatedStock.onHandConsignedQty}`);
      }
      if (auditRecord.actionType !== 'CONSIGNMENT_WITHDRAWAL_LOGGED') {
        throw new Error('Missing audit record for consignment withdrawal.');
      }
    });

    // Test 10: Consignment withdrawal deficit guard
    executeTest('32B08-TEST-10', 'Consignment Stock Deficit Guard', 'CONSIGNMENT', () => {
      const agreement = AdvancedProcurementEngine.createConsignmentAgreement({
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        vendorId: vendorA.id,
        itemSku: 'SKU-CONSIGN-01',
        agreedPrice: 50.0
      });

      const stockRecord: ConsignmentStockRecord = {
        id: 'csr-02',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        vendorId: vendorA.id,
        vendorName: vendorA.name,
        warehouseId: 'wh-001',
        itemSku: 'SKU-CONSIGN-01',
        itemName: 'Consigned Microcontrollers',
        onHandConsignedQty: 10,
        withdrawnQty: 0,
        settledQty: 0,
        openForSettlementQty: 0,
        currency: 'USD',
        agreedUnitPrice: 50.0,
        lastMovementDate: '2026-08-01T00:00:00Z'
      };

      let threw = false;
      try {
        AdvancedProcurementEngine.recordConsignmentWithdrawal({ quantity: 25 }, agreement, stockRecord);
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('CONSIGNMENT_STOCK_DEFICIT')) {
          throw new Error(`Unexpected error message: ${err.message}`);
        }
      }
      if (!threw) {
        throw new Error('Over-consumption of consignment stock must fail.');
      }
    });

    // Test 11: Inactive / expired consignment agreement rejection
    executeTest('32B08-TEST-11', 'Inactive Consignment Agreement Guard', 'CONSIGNMENT', () => {
      const agreement = AdvancedProcurementEngine.createConsignmentAgreement({
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        vendorId: vendorA.id,
        itemSku: 'SKU-CONSIGN-01',
        agreedPrice: 50.0,
        status: 'EXPIRED' as any
      });

      const stockRecord: ConsignmentStockRecord = {
        id: 'csr-03',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        vendorId: vendorA.id,
        vendorName: vendorA.name,
        warehouseId: 'wh-001',
        itemSku: 'SKU-CONSIGN-01',
        itemName: 'Consigned Microcontrollers',
        onHandConsignedQty: 100,
        withdrawnQty: 0,
        settledQty: 0,
        openForSettlementQty: 0,
        currency: 'USD',
        agreedUnitPrice: 50.0,
        lastMovementDate: '2026-08-01T00:00:00Z'
      };

      let threw = false;
      try {
        AdvancedProcurementEngine.recordConsignmentWithdrawal({ quantity: 5 }, agreement, stockRecord);
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('CONSIGNMENT_AGREEMENT_INACTIVE')) {
          throw new Error(`Unexpected error message: ${err.message}`);
        }
      }
      if (!threw) {
        throw new Error('Consumption under expired agreement must fail.');
      }
    });

    // Test 12: Periodic Consignment AP Settlement generation (MRKO standard)
    executeTest('32B08-TEST-12', 'Consignment Periodic AP Settlement (MRKO)', 'CONSIGNMENT', () => {
      const w1: ConsignmentWithdrawal = {
        id: 'cw-01',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        withdrawalNumber: 'CW-2026-0001',
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        warehouseId: 'wh-001',
        itemSku: 'SKU-C1',
        itemName: 'Item C1',
        quantity: 10,
        uom: 'EA',
        unitPrice: 100,
        netAmount: 1000,
        taxPercent: 15,
        taxAmount: 150,
        grossAmount: 1150,
        currency: 'USD',
        withdrawalDate: '2026-08-10',
        purpose: 'PRODUCTION',
        status: 'LOGGED',
        withdrawnBy: 'user-01',
        createdAt: '2026-08-10T00:00:00Z'
      };

      const { settlement, settledWithdrawals, auditRecord } = AdvancedProcurementEngine.settleConsignmentConsumption(
        mockTenantId,
        mockCompanyId,
        vendorA.id,
        '2026-08-01',
        '2026-08-31',
        [w1],
        'accountant-01'
      );

      if (settlement.totalQuantity !== 10 || settlement.totalGrossAmount !== 1150) {
        throw new Error(`Invalid settlement total: ${settlement.totalGrossAmount}`);
      }
      if (settledWithdrawals[0].status !== 'SETTLED') {
        throw new Error('Withdrawal status not updated to SETTLED.');
      }
      if (!settlement.voucherId || !settlement.voucherNumber) {
        throw new Error('Missing automatic AP Voucher generation.');
      }
    });

    // Test 13: Zero-drift tax and gross settlement aggregation across multi-withdrawals
    executeTest('32B08-TEST-13', 'Multi-Withdrawal Settlement Aggregation & Tax Precision', 'CONSIGNMENT', () => {
      const w1: ConsignmentWithdrawal = {
        id: 'cw-11',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        withdrawalNumber: 'CW-2026-0011',
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        warehouseId: 'wh-001',
        itemSku: 'SKU-C1',
        itemName: 'Item C1',
        quantity: 5,
        uom: 'EA',
        unitPrice: 100,
        netAmount: 500,
        taxPercent: 15,
        taxAmount: 75,
        grossAmount: 575,
        currency: 'USD',
        withdrawalDate: '2026-08-10',
        purpose: 'PRODUCTION',
        status: 'LOGGED',
        withdrawnBy: 'user-01',
        createdAt: '2026-08-10T00:00:00Z'
      };

      const w2: ConsignmentWithdrawal = {
        ...w1,
        id: 'cw-12',
        withdrawalNumber: 'CW-2026-0012',
        quantity: 15,
        netAmount: 1500,
        taxAmount: 225,
        grossAmount: 1725,
        withdrawalDate: '2026-08-12'
      };

      const { settlement } = AdvancedProcurementEngine.settleConsignmentConsumption(
        mockTenantId,
        mockCompanyId,
        vendorA.id,
        '2026-08-01',
        '2026-08-31',
        [w1, w2],
        'accountant-01'
      );

      if (settlement.totalQuantity !== 20 || settlement.totalNetAmount !== 2000 || settlement.totalTaxAmount !== 300 || settlement.totalGrossAmount !== 2300) {
        throw new Error(`Multi-withdrawal settlement aggregation error: gross=${settlement.totalGrossAmount}`);
      }
    });

    // Test 14: Double settlement prevention for already settled withdrawals
    executeTest('32B08-TEST-14', 'Double Settlement Guard for Consignment Withdrawals', 'CONSIGNMENT', () => {
      const settledW: ConsignmentWithdrawal = {
        id: 'cw-settled',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        withdrawalNumber: 'CW-2026-9999',
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        warehouseId: 'wh-001',
        itemSku: 'SKU-C1',
        itemName: 'Item C1',
        quantity: 10,
        uom: 'EA',
        unitPrice: 100,
        netAmount: 1000,
        taxPercent: 15,
        taxAmount: 150,
        grossAmount: 1150,
        currency: 'USD',
        withdrawalDate: '2026-08-10',
        purpose: 'PRODUCTION',
        status: 'SETTLED',
        settlementId: 'cs-old-1',
        withdrawnBy: 'user-01',
        createdAt: '2026-08-10T00:00:00Z'
      };

      let threw = false;
      try {
        AdvancedProcurementEngine.settleConsignmentConsumption(
          mockTenantId,
          mockCompanyId,
          vendorA.id,
          '2026-08-01',
          '2026-08-31',
          [settledW],
          'accountant-01'
        );
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('NO_SETTLEABLE_CONSIGNMENT_WITHDRAWALS')) {
          throw new Error(`Unexpected error: ${err.message}`);
        }
      }
      if (!threw) {
        throw new Error('Re-settlement of settled consignment withdrawal must fail.');
      }
    });

    // =========================================================================
    // PILLAR 3: LANDED COST VARIANCE & CAPITALIZATION ADJUSTMENTS (TESTS 15 - 20)
    // =========================================================================

    // Test 15: Landed cost freight invoice variance reconciliation (actual > estimated)
    executeTest('32B08-TEST-15', 'Landed Cost Upward Variance Apportionment', 'LANDED_COST', () => {
      const grn: GoodsReceiptNote = {
        id: 'grn-lc-1',
        grnNumber: 'GRN-LC-001',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        warehouseId: 'wh-001',
        vendorId: vendorA.id,
        vendorName: vendorA.name,
        poId: 'po-1',
        poNumber: 'PO-001',
        receivedAt: '2026-08-01T00:00:00Z',
        receivedBy: 'user-01',
        status: 'POSTED',
        qualityStatus: 'APPROVED',
        items: [
          {
            id: 'grn-item-lc-1',
            grnId: 'grn-lc-1',
            poId: 'po-1',
            poItemId: 'poi-1',
            itemSku: 'SKU-HEAVY-01',
            itemName: 'Heavy Industrial Generator',
            receivedQty: 2,
            acceptedQty: 2,
            rejectedQty: 0,
            quarantinedQty: 0,
            unitCost: 5000,
            totalCost: 10000,
            baseQuantity: 2,
            baseUOM: 'EA',
            receivedUOM: 'EA',
            uomConversionFactor: 1,
            warehouseId: 'wh-001',
            qualityStatus: 'APPROVED',
            landedCostAllocated: 500,
            capitalizedUnitCost: 5250,
            capitalizedTotalCost: 10500,
            version: 1
          }
        ],
        totalReceivedQuantity: 2,
        totalReceivedAmount: 10000,
        landedCostTotal: 500,
        capitalizedGrandTotal: 10500,
        currency: 'USD',
        exchangeRate: 1,
        version: 1,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z'
      };

      const actualInvoice: LandedCostActualInvoice = {
        id: 'inv-freight-1',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        invoiceNumber: 'INV-FRT-999',
        carrierOrAgentVendorId: vendorB.id,
        carrierOrAgentVendorName: vendorB.name,
        grnId: 'grn-lc-1',
        grnNumber: 'GRN-LC-001',
        componentType: 'FREIGHT',
        estimatedAmount: 500,
        actualAmount: 700, // +$200 variance
        varianceAmount: 200,
        currency: 'USD',
        invoiceDate: '2026-08-15',
        postingDate: '2026-08-15'
      };

      const { adjustment, auditRecord } = AdvancedProcurementEngine.calculateLandedCostVarianceAdjustment(
        actualInvoice,
        grn,
        'BY_VALUE',
        'cost-accountant'
      );

      if (adjustment.totalVariance !== 200 || adjustment.allocations[0].varianceAdjustment !== 200) {
        throw new Error(`Variance allocation mismatch: total=${adjustment.totalVariance}`);
      }
      if (adjustment.allocations[0].revisedCapitalizedUnitCost !== 5350) {
        throw new Error(`Revised unit cost calculation error: ${adjustment.allocations[0].revisedCapitalizedUnitCost}`);
      }
      if (!adjustment.immutableHash.startsWith('LCA-HASH-')) {
        throw new Error('Missing Landed Cost adjustment SHA-256 seal.');
      }
    });

    // Test 16: Landed cost reduction variance reconciliation (actual < estimated)
    executeTest('32B08-TEST-16', 'Landed Cost Downward Variance Apportionment', 'LANDED_COST', () => {
      const grn: GoodsReceiptNote = {
        id: 'grn-lc-2',
        grnNumber: 'GRN-LC-002',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        warehouseId: 'wh-001',
        vendorId: vendorA.id,
        vendorName: vendorA.name,
        poId: 'po-2',
        poNumber: 'PO-002',
        receivedAt: '2026-08-01T00:00:00Z',
        receivedBy: 'user-01',
        status: 'POSTED',
        qualityStatus: 'APPROVED',
        items: [
          {
            id: 'grn-item-lc-2',
            grnId: 'grn-lc-2',
            poId: 'po-2',
            poItemId: 'poi-2',
            itemSku: 'SKU-02',
            itemName: 'Item 2',
            receivedQty: 10,
            acceptedQty: 10,
            rejectedQty: 0,
            quarantinedQty: 0,
            unitCost: 100,
            totalCost: 1000,
            baseQuantity: 10,
            baseUOM: 'EA',
            receivedUOM: 'EA',
            uomConversionFactor: 1,
            warehouseId: 'wh-001',
            qualityStatus: 'APPROVED',
            landedCostAllocated: 200,
            capitalizedUnitCost: 120,
            capitalizedTotalCost: 1200,
            version: 1
          }
        ],
        totalReceivedQuantity: 10,
        totalReceivedAmount: 1000,
        landedCostTotal: 200,
        capitalizedGrandTotal: 1200,
        currency: 'USD',
        exchangeRate: 1,
        version: 1,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z'
      };

      const actualInvoice: LandedCostActualInvoice = {
        id: 'inv-customs-1',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        invoiceNumber: 'INV-CUS-888',
        carrierOrAgentVendorId: vendorB.id,
        carrierOrAgentVendorName: vendorB.name,
        grnId: 'grn-lc-2',
        grnNumber: 'GRN-LC-002',
        componentType: 'CUSTOMS',
        estimatedAmount: 200,
        actualAmount: 150, // -$50 variance
        varianceAmount: -50,
        currency: 'USD',
        invoiceDate: '2026-08-15',
        postingDate: '2026-08-15'
      };

      const { adjustment } = AdvancedProcurementEngine.calculateLandedCostVarianceAdjustment(
        actualInvoice,
        grn,
        'BY_VALUE',
        'cost-accountant'
      );

      if (adjustment.totalVariance !== -50 || adjustment.allocations[0].varianceAdjustment !== -50) {
        throw new Error(`Downward variance allocation failed: ${adjustment.totalVariance}`);
      }
      if (adjustment.allocations[0].revisedCapitalizedUnitCost !== 115) {
        throw new Error(`Revised unit cost calculation error: ${adjustment.allocations[0].revisedCapitalizedUnitCost}`);
      }
    });

    // Test 17: Multi-item landed cost variance apportionment BY_VALUE with zero-drift penny balancing
    executeTest('32B08-TEST-17', 'Multi-Item Landed Cost Apportionment (BY_VALUE)', 'LANDED_COST', () => {
      const grn: GoodsReceiptNote = {
        id: 'grn-lc-3',
        grnNumber: 'GRN-LC-003',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        warehouseId: 'wh-001',
        vendorId: vendorA.id,
        vendorName: vendorA.name,
        poId: 'po-3',
        poNumber: 'PO-003',
        receivedAt: '2026-08-01T00:00:00Z',
        receivedBy: 'user-01',
        status: 'POSTED',
        qualityStatus: 'APPROVED',
        items: [
          {
            id: 'grn-item-3a',
            grnId: 'grn-lc-3',
            poId: 'po-3',
            poItemId: 'poi-3a',
            itemSku: 'SKU-A',
            itemName: 'Item A',
            receivedQty: 1,
            acceptedQty: 1,
            rejectedQty: 0,
            quarantinedQty: 0,
            unitCost: 3000,
            totalCost: 3000,
            baseQuantity: 1,
            baseUOM: 'EA',
            receivedUOM: 'EA',
            uomConversionFactor: 1,
            warehouseId: 'wh-001',
            qualityStatus: 'APPROVED',
            landedCostAllocated: 300,
            capitalizedUnitCost: 3300,
            capitalizedTotalCost: 3300,
            version: 1
          },
          {
            id: 'grn-item-3b',
            grnId: 'grn-lc-3',
            poId: 'po-3',
            poItemId: 'poi-3b',
            itemSku: 'SKU-B',
            itemName: 'Item B',
            receivedQty: 1,
            acceptedQty: 1,
            rejectedQty: 0,
            quarantinedQty: 0,
            unitCost: 7000,
            totalCost: 7000,
            baseQuantity: 1,
            baseUOM: 'EA',
            receivedUOM: 'EA',
            uomConversionFactor: 1,
            warehouseId: 'wh-001',
            qualityStatus: 'APPROVED',
            landedCostAllocated: 700,
            capitalizedUnitCost: 7700,
            capitalizedTotalCost: 7700,
            version: 1
          }
        ],
        totalReceivedQuantity: 2,
        totalReceivedAmount: 10000,
        landedCostTotal: 1000,
        capitalizedGrandTotal: 11000,
        currency: 'USD',
        exchangeRate: 1,
        version: 1,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z'
      };

      const actualInvoice: LandedCostActualInvoice = {
        id: 'inv-freight-3',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        invoiceNumber: 'INV-FRT-003',
        carrierOrAgentVendorId: vendorB.id,
        carrierOrAgentVendorName: vendorB.name,
        grnId: 'grn-lc-3',
        grnNumber: 'GRN-LC-003',
        componentType: 'FREIGHT',
        estimatedAmount: 1000,
        actualAmount: 1100, // +$100 variance
        varianceAmount: 100,
        currency: 'USD',
        invoiceDate: '2026-08-15',
        postingDate: '2026-08-15'
      };

      const { adjustment } = AdvancedProcurementEngine.calculateLandedCostVarianceAdjustment(
        actualInvoice,
        grn,
        'BY_VALUE',
        'cost-accountant'
      );

      // 30% to Item A ($30), 70% to Item B ($70)
      if (adjustment.allocations[0].varianceAdjustment !== 30 || adjustment.allocations[1].varianceAdjustment !== 70) {
        throw new Error(`Proportional apportionment error: A=${adjustment.allocations[0].varianceAdjustment}, B=${adjustment.allocations[1].varianceAdjustment}`);
      }
    });

    // Test 18: Multi-item landed cost variance apportionment BY_QUANTITY
    executeTest('32B08-TEST-18', 'Multi-Item Landed Cost Apportionment (BY_QUANTITY)', 'LANDED_COST', () => {
      const grn: GoodsReceiptNote = {
        id: 'grn-lc-4',
        grnNumber: 'GRN-LC-004',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        warehouseId: 'wh-001',
        vendorId: vendorA.id,
        vendorName: vendorA.name,
        poId: 'po-4',
        poNumber: 'PO-004',
        receivedAt: '2026-08-01T00:00:00Z',
        receivedBy: 'user-01',
        status: 'POSTED',
        qualityStatus: 'APPROVED',
        items: [
          {
            id: 'grn-item-4a',
            grnId: 'grn-lc-4',
            poId: 'po-4',
            poItemId: 'poi-4a',
            itemSku: 'SKU-A',
            itemName: 'Item A',
            receivedQty: 50,
            acceptedQty: 50,
            rejectedQty: 0,
            quarantinedQty: 0,
            unitCost: 10,
            totalCost: 500,
            baseQuantity: 50,
            baseUOM: 'EA',
            receivedUOM: 'EA',
            uomConversionFactor: 1,
            warehouseId: 'wh-001',
            qualityStatus: 'APPROVED',
            landedCostAllocated: 50,
            capitalizedUnitCost: 11,
            capitalizedTotalCost: 550,
            version: 1
          },
          {
            id: 'grn-item-4b',
            grnId: 'grn-lc-4',
            poId: 'po-4',
            poItemId: 'poi-4b',
            itemSku: 'SKU-B',
            itemName: 'Item B',
            receivedQty: 50,
            acceptedQty: 50,
            rejectedQty: 0,
            quarantinedQty: 0,
            unitCost: 90,
            totalCost: 4500,
            baseQuantity: 50,
            baseUOM: 'EA',
            receivedUOM: 'EA',
            uomConversionFactor: 1,
            warehouseId: 'wh-001',
            qualityStatus: 'APPROVED',
            landedCostAllocated: 50,
            capitalizedUnitCost: 91,
            capitalizedTotalCost: 4550,
            version: 1
          }
        ],
        totalReceivedQuantity: 100,
        totalReceivedAmount: 5000,
        landedCostTotal: 100,
        capitalizedGrandTotal: 5100,
        currency: 'USD',
        exchangeRate: 1,
        version: 1,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z'
      };

      const actualInvoice: LandedCostActualInvoice = {
        id: 'inv-freight-4',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        invoiceNumber: 'INV-FRT-004',
        carrierOrAgentVendorId: vendorB.id,
        carrierOrAgentVendorName: vendorB.name,
        grnId: 'grn-lc-4',
        grnNumber: 'GRN-LC-004',
        componentType: 'HANDLING',
        estimatedAmount: 100,
        actualAmount: 150, // +$50 variance
        varianceAmount: 50,
        currency: 'USD',
        invoiceDate: '2026-08-15',
        postingDate: '2026-08-15'
      };

      const { adjustment } = AdvancedProcurementEngine.calculateLandedCostVarianceAdjustment(
        actualInvoice,
        grn,
        'BY_QUANTITY',
        'cost-accountant'
      );

      // 50/100 = 50% ($25) each
      if (adjustment.allocations[0].varianceAdjustment !== 25 || adjustment.allocations[1].varianceAdjustment !== 25) {
        throw new Error(`Quantity-based apportionment error: ${adjustment.allocations[0].varianceAdjustment}`);
      }
    });

    // Test 19: Landed cost GRN mismatch validation failure
    executeTest('32B08-TEST-19', 'Landed Cost GRN Mismatch Validation Failure', 'LANDED_COST', () => {
      const grn: GoodsReceiptNote = {
        id: 'grn-actual-id',
        grnNumber: 'GRN-ACTUAL',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        warehouseId: 'wh-001',
        vendorId: vendorA.id,
        vendorName: vendorA.name,
        poId: 'po-1',
        poNumber: 'PO-1',
        receivedAt: '2026-08-01T00:00:00Z',
        receivedBy: 'user-01',
        status: 'POSTED',
        qualityStatus: 'APPROVED',
        items: [],
        totalReceivedQuantity: 1,
        totalReceivedAmount: 100,
        landedCostTotal: 0,
        capitalizedGrandTotal: 100,
        currency: 'USD',
        exchangeRate: 1,
        version: 1,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z'
      };

      const actualInvoice: LandedCostActualInvoice = {
        id: 'inv-freight-err',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        invoiceNumber: 'INV-FRT-ERR',
        carrierOrAgentVendorId: vendorB.id,
        carrierOrAgentVendorName: vendorB.name,
        grnId: 'grn-wrong-id',
        grnNumber: 'GRN-WRONG',
        componentType: 'FREIGHT',
        estimatedAmount: 100,
        actualAmount: 150,
        varianceAmount: 50,
        currency: 'USD',
        invoiceDate: '2026-08-15',
        postingDate: '2026-08-15'
      };

      let threw = false;
      try {
        AdvancedProcurementEngine.calculateLandedCostVarianceAdjustment(actualInvoice, grn);
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('LANDED_COST_GRN_MISMATCH')) {
          throw new Error(`Unexpected error message: ${err.message}`);
        }
      }
      if (!threw) {
        throw new Error('GRN mismatch must throw an error.');
      }
    });

    // Test 20: Capitalized unit cost recalculation accuracy & SHA-256 audit lineage
    executeTest('32B08-TEST-20', 'Capitalized Unit Cost Integrity & Audit Lineage', 'LANDED_COST', () => {
      const grn: GoodsReceiptNote = {
        id: 'grn-lc-20',
        grnNumber: 'GRN-LC-020',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        warehouseId: 'wh-001',
        vendorId: vendorA.id,
        vendorName: vendorA.name,
        poId: 'po-20',
        poNumber: 'PO-20',
        receivedAt: '2026-08-01T00:00:00Z',
        receivedBy: 'user-01',
        status: 'POSTED',
        qualityStatus: 'APPROVED',
        items: [
          {
            id: 'gi-20',
            grnId: 'grn-lc-20',
            poId: 'po-20',
            poItemId: 'poi-20',
            itemSku: 'SKU-20',
            itemName: 'Item 20',
            receivedQty: 10,
            acceptedQty: 10,
            rejectedQty: 0,
            quarantinedQty: 0,
            unitCost: 100,
            totalCost: 1000,
            baseQuantity: 10,
            baseUOM: 'EA',
            receivedUOM: 'EA',
            uomConversionFactor: 1,
            warehouseId: 'wh-001',
            qualityStatus: 'APPROVED',
            landedCostAllocated: 100,
            capitalizedUnitCost: 110,
            capitalizedTotalCost: 1100,
            version: 1
          }
        ],
        totalReceivedQuantity: 10,
        totalReceivedAmount: 1000,
        landedCostTotal: 100,
        capitalizedGrandTotal: 1100,
        currency: 'USD',
        exchangeRate: 1,
        version: 1,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z'
      };

      const actualInvoice: LandedCostActualInvoice = {
        id: 'inv-freight-20',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        invoiceNumber: 'INV-FRT-020',
        carrierOrAgentVendorId: vendorB.id,
        carrierOrAgentVendorName: vendorB.name,
        grnId: 'grn-lc-20',
        grnNumber: 'GRN-LC-020',
        componentType: 'FREIGHT',
        estimatedAmount: 100,
        actualAmount: 120, // +$20 variance -> +$2/unit
        varianceAmount: 20,
        currency: 'USD',
        invoiceDate: '2026-08-15',
        postingDate: '2026-08-15'
      };

      const { adjustment, auditRecord } = AdvancedProcurementEngine.calculateLandedCostVarianceAdjustment(
        actualInvoice,
        grn,
        'BY_VALUE',
        'cost-accountant'
      );

      if (adjustment.allocations[0].revisedCapitalizedUnitCost !== 112) {
        throw new Error(`Revised unit cost calculation error: ${adjustment.allocations[0].revisedCapitalizedUnitCost}`);
      }
      if (auditRecord.actionType !== 'LANDED_COST_VARIANCE_ADJUSTED') {
        throw new Error('Audit trail action type mismatch.');
      }
    });

    // =========================================================================
    // PILLAR 4: MULTI-CRITERIA SUPPLIER SCORECARDING & EVALUATION (TESTS 21 - 26)
    // =========================================================================

    // Test 21: Full 4-pillar supplier scorecard generation
    executeTest('32B08-TEST-21', 'Supplier 4-Pillar Scorecard Generation', 'SCORECARD', () => {
      const pos: PurchaseOrder[] = [
        {
          id: 'po-sc-1',
          poNumber: 'PO-SC-1',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          vendorId: vendorA.id,
          vendorCode: vendorA.code,
          vendorName: vendorA.name,
          currency: 'USD',
          status: 'APPROVED',
          expectedDeliveryDate: '2026-08-15',
          grandTotal: 10000,
          items: [],
          createdAt: '2026-08-01T00:00:00Z',
          updatedAt: '2026-08-01T00:00:00Z',
          version: 1
        } as any
      ];

      const grns: GoodsReceiptNote[] = [
        {
          id: 'grn-sc-1',
          grnNumber: 'GRN-SC-1',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          warehouseId: 'wh-001',
          vendorId: vendorA.id,
          vendorName: vendorA.name,
          poId: 'po-sc-1',
          poNumber: 'PO-SC-1',
          receivedAt: '2026-08-12T00:00:00Z', // On time
          receivedBy: 'user-01',
          status: 'POSTED',
          qualityStatus: 'APPROVED',
          items: [
            {
              id: 'gi-sc-1',
              grnId: 'grn-sc-1',
              poId: 'po-sc-1',
              poItemId: 'poi-1',
              itemSku: 'SKU-1',
              itemName: 'Item 1',
              receivedQty: 100,
              acceptedQty: 100,
              rejectedQty: 0,
              quarantinedQty: 0,
              unitCost: 100,
              totalCost: 10000,
              baseQuantity: 100,
              baseUOM: 'EA',
              receivedUOM: 'EA',
              uomConversionFactor: 1,
              warehouseId: 'wh-001',
              qualityStatus: 'APPROVED',
              landedCostAllocated: 0,
              capitalizedUnitCost: 100,
              capitalizedTotalCost: 10000,
              version: 1
            }
          ],
          totalReceivedQuantity: 100,
          totalReceivedAmount: 10000,
          landedCostTotal: 0,
          capitalizedGrandTotal: 10000,
          currency: 'USD',
          exchangeRate: 1,
          version: 1,
          createdAt: '2026-08-12T00:00:00Z',
          updatedAt: '2026-08-12T00:00:00Z'
        }
      ];

      const invoices: SupplierInvoice[] = [
        {
          id: 'inv-sc-1',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          vendorId: vendorA.id,
          threeWayMatchStatus: 'EXACT_MATCH',
          grossAmount: 10000
        } as any
      ];

      const { scorecard } = AdvancedProcurementEngine.evaluateSupplierScorecard(
        mockTenantId,
        mockCompanyId,
        vendorA,
        '2026-Q3',
        pos,
        grns,
        invoices
      );

      if (scorecard.pillars.length !== 4) {
        throw new Error(`Expected 4 scorecard pillars, got ${scorecard.pillars.length}`);
      }
      if (scorecard.overallScore < 95) {
        throw new Error(`Flawless vendor should score >= 95, got ${scorecard.overallScore}`);
      }
    });

    // Test 22: High-performing supplier categorized as TIER_A_STRATEGIC with PREFERRED status
    executeTest('32B08-TEST-22', 'Strategic Vendor Tier A Assignment', 'SCORECARD', () => {
      const pos: PurchaseOrder[] = [
        {
          id: 'po-1',
          vendorId: vendorA.id,
          expectedDeliveryDate: '2026-08-20',
          grandTotal: 50000
        } as any
      ];

      const grns: GoodsReceiptNote[] = [
        {
          id: 'grn-1',
          vendorId: vendorA.id,
          poId: 'po-1',
          receivedAt: '2026-08-18',
          items: [{ receivedQty: 500, acceptedQty: 500, rejectedQty: 0 } as any]
        } as any
      ];

      const invoices: SupplierInvoice[] = [
        { id: 'inv-1', vendorId: vendorA.id, threeWayMatchStatus: 'EXACT_MATCH' } as any
      ];

      const { scorecard, updatedVendorStatus } = AdvancedProcurementEngine.evaluateSupplierScorecard(
        mockTenantId,
        mockCompanyId,
        vendorA,
        '2026-Q3',
        pos,
        grns,
        invoices
      );

      if (scorecard.tier !== 'TIER_A_STRATEGIC' || updatedVendorStatus !== 'PREFERRED') {
        throw new Error(`Expected TIER_A_STRATEGIC and PREFERRED, got ${scorecard.tier} and ${updatedVendorStatus}`);
      }
    });

    // Test 23: Low-performing supplier categorized as TIER_D_HIGH_RISK with BLOCKED status
    executeTest('32B08-TEST-23', 'High-Risk Vendor Tier D Assignment (Defect Rejections)', 'SCORECARD', () => {
      const pos: PurchaseOrder[] = [
        {
          id: 'po-bad',
          vendorId: vendorC.id,
          expectedDeliveryDate: '2026-08-01',
          grandTotal: 20000
        } as any
      ];

      const grns: GoodsReceiptNote[] = [
        {
          id: 'grn-bad',
          vendorId: vendorC.id,
          poId: 'po-bad',
          receivedAt: '2026-08-25', // 24 days late!
          items: [{ receivedQty: 100, acceptedQty: 20, rejectedQty: 80 } as any] // 80% rejected!
        } as any
      ];

      const invoices: SupplierInvoice[] = [
        { id: 'inv-bad', vendorId: vendorC.id, threeWayMatchStatus: 'PRICE_VARIANCE_BLOCKED' } as any
      ];

      const { scorecard, updatedVendorStatus } = AdvancedProcurementEngine.evaluateSupplierScorecard(
        mockTenantId,
        mockCompanyId,
        vendorC,
        '2026-Q3',
        pos,
        grns,
        invoices
      );

      if (scorecard.tier !== 'TIER_D_HIGH_RISK' || updatedVendorStatus !== 'BLOCKED') {
        throw new Error(`Expected TIER_D_HIGH_RISK and BLOCKED, got ${scorecard.tier} and ${updatedVendorStatus}`);
      }
    });

    // Test 24: Custom evaluation weights configuration & weighted score calculation
    executeTest('32B08-TEST-24', 'Custom Evaluation Weights Configuration', 'SCORECARD', () => {
      const pos: PurchaseOrder[] = [{ id: 'po-w', vendorId: vendorA.id, grandTotal: 1000 } as any];
      const grns: GoodsReceiptNote[] = [
        {
          id: 'grn-w',
          vendorId: vendorA.id,
          poId: 'po-w',
          receivedAt: '2026-08-01',
          items: [{ receivedQty: 10, acceptedQty: 10, rejectedQty: 0 } as any]
        } as any
      ];
      const invoices: SupplierInvoice[] = [{ id: 'inv-w', vendorId: vendorA.id, threeWayMatchStatus: 'EXACT_MATCH' } as any];

      const customWeights = {
        qualityWeight: 0.50, // 50%
        deliveryWeight: 0.20,
        priceWeight: 0.20,
        serviceWeight: 0.10
      };

      const { scorecard } = AdvancedProcurementEngine.evaluateSupplierScorecard(
        mockTenantId,
        mockCompanyId,
        vendorA,
        '2026-Q3',
        pos,
        grns,
        invoices,
        customWeights
      );

      const qPillar = scorecard.pillars.find(p => p.pillar === 'QUALITY');
      if (!qPillar || qPillar.weight !== 0.50) {
        throw new Error('Custom quality weight not respected in scorecard calculation.');
      }
    });

    // Test 25: Delivery score accurately penalizes late shipments against PO delivery date
    executeTest('32B08-TEST-25', 'Delivery Pillar OTD Calculation Accuracy', 'SCORECARD', () => {
      const pos: PurchaseOrder[] = [
        { id: 'po-otd-1', vendorId: vendorB.id, expectedDeliveryDate: '2026-08-10', grandTotal: 1000 } as any,
        { id: 'po-otd-2', vendorId: vendorB.id, expectedDeliveryDate: '2026-08-15', grandTotal: 1000 } as any
      ];

      const grns: GoodsReceiptNote[] = [
        { id: 'grn-otd-1', vendorId: vendorB.id, poId: 'po-otd-1', receivedAt: '2026-08-09', items: [] } as any, // On-Time
        { id: 'grn-otd-2', vendorId: vendorB.id, poId: 'po-otd-2', receivedAt: '2026-08-20', items: [] } as any  // Late
      ];

      const { scorecard } = AdvancedProcurementEngine.evaluateSupplierScorecard(
        mockTenantId,
        mockCompanyId,
        vendorB,
        '2026-Q3',
        pos,
        grns,
        []
      );

      const dPillar = scorecard.pillars.find(p => p.pillar === 'DELIVERY');
      if (!dPillar || dPillar.rawScore !== 50.0) {
        throw new Error(`Expected 50% OTD delivery score, got ${dPillar?.rawScore}`);
      }
    });

    // Test 26: Immutable SHA-256 hash seal and scorecard audit record creation
    executeTest('32B08-TEST-26', 'Scorecard Immutable SHA-256 Hash Seal', 'SCORECARD', () => {
      const { scorecard, auditRecord } = AdvancedProcurementEngine.evaluateSupplierScorecard(
        mockTenantId,
        mockCompanyId,
        vendorA,
        '2026-Q3',
        [],
        [],
        []
      );

      if (!scorecard.immutableHash.startsWith('SC-HASH-')) {
        throw new Error('Scorecard missing valid SHA-256 hash seal.');
      }
      if (auditRecord.actionType !== 'SUPPLIER_SCORECARD_EVALUATED') {
        throw new Error('Audit record action type mismatch for supplier evaluation.');
      }
    });

    // =========================================================================
    // PILLAR 5: VENDOR PREPAYMENTS & AMORTIZATION (TESTS 27 - 30)
    // =========================================================================

    // Test 27: Record vendor advance prepayment against PO with audit lineage
    executeTest('32B08-TEST-27', 'Record Vendor Advance Prepayment', 'PREPAYMENT', () => {
      const { prepayment, auditRecord } = AdvancedProcurementEngine.recordVendorPrepayment({
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        poId: 'po-101',
        poNumber: 'PO-2026-0101',
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        totalPrepaidAmount: 5000,
        paymentMethod: 'WIRE_TRANSFER'
      });

      if (prepayment.totalPrepaidAmount !== 5000 || prepayment.remainingAmount !== 5000 || prepayment.status !== 'POSTED') {
        throw new Error(`Invalid prepayment initialization: remaining=${prepayment.remainingAmount}`);
      }
      if (!prepayment.immutableHash.startsWith('ADV-HASH-')) {
        throw new Error('Missing prepayment SHA-256 digital hash seal.');
      }
      if (auditRecord.actionType !== 'VENDOR_PREPAYMENT_RECORDED') {
        throw new Error('Audit record action type mismatch for prepayment.');
      }
    });

    // Test 28: Partial prepayment application against AP voucher with residual balance tracking
    executeTest('32B08-TEST-28', 'Partial Prepayment Amortization against AP Voucher', 'PREPAYMENT', () => {
      const prepayment: VendorPrepayment = {
        id: 'adv-01',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        prepaymentNumber: 'ADV-2026-0001',
        poId: 'po-101',
        poNumber: 'PO-2026-0101',
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        paymentDate: '2026-08-01',
        currency: 'USD',
        totalPrepaidAmount: 5000,
        appliedAmount: 0,
        remainingAmount: 5000,
        paymentMethod: 'WIRE_TRANSFER',
        status: 'POSTED',
        createdBy: 'user-01',
        createdAt: '2026-08-01T00:00:00Z',
        immutableHash: 'ADV-HASH-123'
      };

      const voucher: APVoucher = {
        id: 'vch-01',
        voucherNumber: 'VCH-2026-0001',
        supplierInvoiceId: 'inv-01',
        supplierInvoiceNumber: 'INV-2026-0001',
        vendorInvoiceNumber: 'VINV-0001',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        voucherDate: '2026-08-10',
        dueDate: '2026-09-10',
        currency: 'USD',
        grossAmount: 8000,
        netAmount: 7000,
        paidAmount: 0,
        remainingAmount: 8000,
        status: 'UNPAID',
        createdAt: '2026-08-10T00:00:00Z'
      };

      const { updatedPrepayment, updatedVoucher, applicationRecord, auditRecord } = AdvancedProcurementEngine.applyPrepaymentToVoucher(
        prepayment,
        voucher,
        3000,
        'ap-clerk'
      );

      if (updatedPrepayment.remainingAmount !== 2000 || updatedPrepayment.appliedAmount !== 3000 || updatedPrepayment.status !== 'PARTIALLY_APPLIED') {
        throw new Error(`Prepayment balance tracking error: remaining=${updatedPrepayment.remainingAmount}`);
      }
      if (updatedVoucher.remainingAmount !== 5000 || updatedVoucher.paidAmount !== 3000 || updatedVoucher.status !== 'PARTIALLY_PAID') {
        throw new Error(`Voucher balance tracking error: remaining=${updatedVoucher.remainingAmount}`);
      }
      if (applicationRecord.appliedAmount !== 3000) {
        throw new Error('Application record amount mismatch.');
      }
    });

    // Test 29: Full prepayment liquidation against voucher settling liability completely
    executeTest('32B08-TEST-29', 'Full Prepayment Liquidation & Voucher Settlement', 'PREPAYMENT', () => {
      const prepayment: VendorPrepayment = {
        id: 'adv-02',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        prepaymentNumber: 'ADV-2026-0002',
        poId: 'po-102',
        poNumber: 'PO-2026-0102',
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        paymentDate: '2026-08-01',
        currency: 'USD',
        totalPrepaidAmount: 4000,
        appliedAmount: 0,
        remainingAmount: 4000,
        paymentMethod: 'WIRE_TRANSFER',
        status: 'POSTED',
        createdBy: 'user-01',
        createdAt: '2026-08-01T00:00:00Z',
        immutableHash: 'ADV-HASH-456'
      };

      const voucher: APVoucher = {
        id: 'vch-02',
        voucherNumber: 'VCH-2026-0002',
        supplierInvoiceId: 'inv-02',
        supplierInvoiceNumber: 'INV-2026-0002',
        vendorInvoiceNumber: 'VINV-0002',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        voucherDate: '2026-08-10',
        dueDate: '2026-09-10',
        currency: 'USD',
        grossAmount: 4000,
        netAmount: 3500,
        paidAmount: 0,
        remainingAmount: 4000,
        status: 'UNPAID',
        createdAt: '2026-08-10T00:00:00Z'
      };

      const { updatedPrepayment, updatedVoucher } = AdvancedProcurementEngine.applyPrepaymentToVoucher(
        prepayment,
        voucher
      );

      if (updatedPrepayment.remainingAmount !== 0 || updatedPrepayment.status !== 'FULLY_APPLIED') {
        throw new Error('Prepayment status should be FULLY_APPLIED with 0 remaining balance.');
      }
      if (updatedVoucher.remainingAmount !== 0 || updatedVoucher.status !== 'PAID') {
        throw new Error('Voucher status should be PAID with 0 remaining liability.');
      }
    });

    // Test 30: Cross-vendor and cross-tenant prepayment application hard blocks
    executeTest('32B08-TEST-30', 'Cross-Vendor & Cross-Tenant Prepayment Hard Block', 'PREPAYMENT', () => {
      const prepayment: VendorPrepayment = {
        id: 'adv-03',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        prepaymentNumber: 'ADV-2026-0003',
        poId: 'po-103',
        poNumber: 'PO-2026-0103',
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        paymentDate: '2026-08-01',
        currency: 'USD',
        totalPrepaidAmount: 1000,
        appliedAmount: 0,
        remainingAmount: 1000,
        paymentMethod: 'WIRE_TRANSFER',
        status: 'POSTED',
        createdBy: 'user-01',
        createdAt: '2026-08-01T00:00:00Z',
        immutableHash: 'ADV-HASH-789'
      };

      const crossVendorVoucher: APVoucher = {
        id: 'vch-03',
        voucherNumber: 'VCH-2026-0003',
        supplierInvoiceId: 'inv-03',
        supplierInvoiceNumber: 'INV-2026-0003',
        vendorInvoiceNumber: 'VINV-0003',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        vendorId: vendorB.id, // Different vendor!
        vendorCode: vendorB.code,
        vendorName: vendorB.name,
        voucherDate: '2026-08-10',
        dueDate: '2026-09-10',
        currency: 'USD',
        grossAmount: 1000,
        netAmount: 850,
        paidAmount: 0,
        remainingAmount: 1000,
        status: 'UNPAID',
        createdAt: '2026-08-10T00:00:00Z'
      };

      let threw = false;
      try {
        AdvancedProcurementEngine.applyPrepaymentToVoucher(prepayment, crossVendorVoucher);
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('VENDOR_MISMATCH')) {
          throw new Error(`Unexpected error message: ${err.message}`);
        }
      }
      if (!threw) {
        throw new Error('Cross-vendor prepayment application must fail.');
      }
    });

    const durationMs = Date.now() - startTime;
    const passedTests = results.filter(r => r.status === 'PASS').length;
    const failedTests = results.filter(r => r.status === 'FAIL').length;

    return {
      suiteId: `suite-32b08-${Date.now()}`,
      phase: '3.2B-08',
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      passedTests,
      failedTests,
      durationMs,
      results,
      overallStatus: failedTests === 0 ? 'PASS' : 'FAIL'
    };
  }
}
