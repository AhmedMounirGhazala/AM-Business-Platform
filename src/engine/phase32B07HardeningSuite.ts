/**
 * AM Business Platform - Phase 3.2B-07 Hardening Suite
 * Supplier Aging, Statements, Debit/Credit Notes Reconciliation & AP Analytics Workspace
 * Authoritative 30/30 Test Verification Suite
 * Aligned with SAP S/4HANA (FI-AP / FI-AR / Analytics), Oracle ERP Cloud Payables & IFRS/ZATCA Standards
 */

import { AccountsPayableEngine } from './accountsPayableEngine';
import { PostingRulesEngine } from './postingRulesEngine';
import { Account, PostingRule } from '../types';
import {
  SupplierInvoice,
  APVoucher,
  SupplierCreditNote,
  SupplierDebitNote,
  VendorAgingReport,
  VendorStatement,
  PurchaseAccrual,
  PaymentBatch
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

export interface Phase32B07HardeningReport {
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

export class Phase32B07HardeningSuite {
  static async runSuite(): Promise<Phase32B07HardeningReport> {
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
      testFn: () => { passed: boolean; details: string; error?: string }
    ) => {
      const tStart = Date.now();
      try {
        const res = testFn();
        results.push({
          testId,
          name,
          category,
          status: res.passed ? 'PASS' : 'FAIL',
          executionTimeMs: Date.now() - tStart,
          details: res.details,
          error: res.error
        });
      } catch (err: any) {
        results.push({
          testId,
          name,
          category,
          status: 'FAIL',
          executionTimeMs: Date.now() - tStart,
          details: 'Execution exception',
          error: err.message || String(err)
        });
      }
    };

    // =========================================================================
    // SECTION 1: MULTI-BUCKET VENDOR AGING ENGINE (TESTS 1 - 5)
    // =========================================================================

    const mockVouchersForAging: APVoucher[] = [
      // Vendor A:
      // Report Date: 2026-09-01
      // 1. Current (Due 2026-09-15) -> $5,000
      {
        id: 'vch-a1',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        voucherNumber: 'VCH-A1',
        supplierInvoiceId: 'inv-a1',
        supplierInvoiceNumber: 'INV-A1',
        vendorInvoiceNumber: 'VA-01',
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        voucherDate: '2026-08-15',
        dueDate: '2026-09-15',
        currency: 'USD',
        grossAmount: 5000,
        netAmount: 4500,
        paidAmount: 0,
        remainingAmount: 5000,
        status: 'UNPAID',
        createdAt: '2026-08-15T00:00:00Z'
      },
      // 2. 1-30 Days Overdue (Due 2026-08-10, 22 days overdue) -> $3,000
      {
        id: 'vch-a2',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        voucherNumber: 'VCH-A2',
        supplierInvoiceId: 'inv-a2',
        supplierInvoiceNumber: 'INV-A2',
        vendorInvoiceNumber: 'VA-02',
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        voucherDate: '2026-07-10',
        dueDate: '2026-08-10',
        currency: 'USD',
        grossAmount: 3000,
        netAmount: 2700,
        paidAmount: 0,
        remainingAmount: 3000,
        status: 'UNPAID',
        createdAt: '2026-07-10T00:00:00Z'
      },
      // 3. 31-60 Days Overdue (Due 2026-07-15, 48 days overdue) -> $2,000
      {
        id: 'vch-a3',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        voucherNumber: 'VCH-A3',
        supplierInvoiceId: 'inv-a3',
        supplierInvoiceNumber: 'INV-A3',
        vendorInvoiceNumber: 'VA-03',
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        voucherDate: '2026-06-15',
        dueDate: '2026-07-15',
        currency: 'USD',
        grossAmount: 2000,
        netAmount: 1800,
        paidAmount: 0,
        remainingAmount: 2000,
        status: 'UNPAID',
        createdAt: '2026-06-15T00:00:00Z'
      },
      // 4. 61-90 Days Overdue (Due 2026-06-15, 78 days overdue) -> $1,500
      {
        id: 'vch-a4',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        voucherNumber: 'VCH-A4',
        supplierInvoiceId: 'inv-a4',
        supplierInvoiceNumber: 'INV-A4',
        vendorInvoiceNumber: 'VA-04',
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        voucherDate: '2026-05-15',
        dueDate: '2026-06-15',
        currency: 'USD',
        grossAmount: 1500,
        netAmount: 1350,
        paidAmount: 0,
        remainingAmount: 1500,
        status: 'UNPAID',
        createdAt: '2026-05-15T00:00:00Z'
      },
      // 5. 91-120 Days Overdue (Due 2026-05-15, 109 days overdue) -> $1,000
      {
        id: 'vch-a5',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        voucherNumber: 'VCH-A5',
        supplierInvoiceId: 'inv-a5',
        supplierInvoiceNumber: 'INV-A5',
        vendorInvoiceNumber: 'VA-05',
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        voucherDate: '2026-04-15',
        dueDate: '2026-05-15',
        currency: 'USD',
        grossAmount: 1000,
        netAmount: 900,
        paidAmount: 0,
        remainingAmount: 1000,
        status: 'UNPAID',
        createdAt: '2026-04-15T00:00:00Z'
      },
      // 6. Over 120 Days Overdue (Due 2026-03-01, 184 days overdue) -> $4,000
      {
        id: 'vch-a6',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        voucherNumber: 'VCH-A6',
        supplierInvoiceId: 'inv-a6',
        supplierInvoiceNumber: 'INV-A6',
        vendorInvoiceNumber: 'VA-06',
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        voucherDate: '2026-02-01',
        dueDate: '2026-03-01',
        currency: 'USD',
        grossAmount: 4000,
        netAmount: 3600,
        paidAmount: 0,
        remainingAmount: 4000,
        status: 'UNPAID',
        createdAt: '2026-02-01T00:00:00Z'
      },
      // Vendor B: Current only $10,000
      {
        id: 'vch-b1',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        voucherNumber: 'VCH-B1',
        supplierInvoiceId: 'inv-b1',
        supplierInvoiceNumber: 'INV-B1',
        vendorInvoiceNumber: 'VB-01',
        vendorId: vendorB.id,
        vendorCode: vendorB.code,
        vendorName: vendorB.name,
        voucherDate: '2026-08-20',
        dueDate: '2026-09-20',
        currency: 'USD',
        grossAmount: 10000,
        netAmount: 9000,
        paidAmount: 0,
        remainingAmount: 10000,
        status: 'UNPAID',
        createdAt: '2026-08-20T00:00:00Z'
      },
      // Fully settled voucher (should be excluded from aging)
      {
        id: 'vch-b-paid',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        voucherNumber: 'VCH-B-PAID',
        supplierInvoiceId: 'inv-b2',
        supplierInvoiceNumber: 'INV-B2',
        vendorInvoiceNumber: 'VB-PAID',
        vendorId: vendorB.id,
        vendorCode: vendorB.code,
        vendorName: vendorB.name,
        voucherDate: '2026-05-01',
        dueDate: '2026-06-01',
        currency: 'USD',
        grossAmount: 8000,
        netAmount: 7200,
        paidAmount: 8000,
        remainingAmount: 0,
        status: 'PAID',
        createdAt: '2026-05-01T00:00:00Z'
      }
    ];

    executeTest(
      'TEST-APAG-01',
      'Standard 5-Bucket Aging Calculation (Current, 1-30, 31-60, 61-90, 91-120, >120)',
      'Supplier Aging Engine',
      () => {
        const report = AccountsPayableEngine.generateVendorAgingReport(
          mockVouchersForAging,
          [vendorA, vendorB, vendorC],
          '2026-09-01'
        );

        const vA = report.vendors.find(v => v.vendorId === vendorA.id);
        const ok =
          vA !== undefined &&
          vA.current === 5000 &&
          vA.days1To30 === 3000 &&
          vA.days31To60 === 2000 &&
          vA.days61To90 === 1500 &&
          vA.days91To120 === 1000 &&
          vA.over120 === 4000 &&
          vA.totalDue === 16500;

        return {
          passed: ok,
          details: `Vendor A Aging: Current=$${vA?.current}, 1-30=$${vA?.days1To30}, 31-60=$${vA?.days31To60}, 61-90=$${vA?.days61To90}, 91-120=$${vA?.days91To120}, >120=$${vA?.over120}. Total=$${vA?.totalDue}`
        };
      }
    );

    executeTest(
      'TEST-APAG-02',
      'Weighted Average Days Overdue (WADO) Calculation',
      'Supplier Aging Engine',
      () => {
        const report = AccountsPayableEngine.generateVendorAgingReport(
          mockVouchersForAging,
          [vendorA, vendorB],
          '2026-09-01'
        );

        const vA = report.vendors.find(v => v.vendorId === vendorA.id);
        const vB = report.vendors.find(v => v.vendorId === vendorB.id);

        const ok =
          vA !== undefined &&
          vA.weightedAvgDaysOverdue > 50 &&
          vB !== undefined &&
          vB.weightedAvgDaysOverdue === 0;

        return {
          passed: ok,
          details: `Vendor A WADO=${vA?.weightedAvgDaysOverdue} days, Vendor B WADO=${vB?.weightedAvgDaysOverdue} days (all current).`
        };
      }
    );

    executeTest(
      'TEST-APAG-03',
      'Grand Total Aggregation and Multi-Vendor Breakdown Accuracy',
      'Supplier Aging Engine',
      () => {
        const report = AccountsPayableEngine.generateVendorAgingReport(
          mockVouchersForAging,
          [vendorA, vendorB, vendorC],
          '2026-09-01'
        );

        const ok =
          report.grandTotal === 26500 &&
          report.totalCurrent === 15000 &&
          report.total1To30 === 3000 &&
          report.total31To60 === 2000 &&
          report.total61To90 === 1500 &&
          report.total91To120 === 1000 &&
          report.totalOver120 === 4000 &&
          report.vendors.length === 2; // Vendor C has 0 due so excluded

        return {
          passed: ok,
          details: `Grand Total Payables=$${report.grandTotal}, Total Current=$${report.totalCurrent}, Total Overdue=$${report.grandTotal - report.totalCurrent}. Active Vendors=${report.vendors.length}`
        };
      }
    );

    executeTest(
      'TEST-APAG-04',
      'Fully Settled Voucher Exclusion from Active Aging',
      'Supplier Aging Engine',
      () => {
        const report = AccountsPayableEngine.generateVendorAgingReport(
          mockVouchersForAging,
          [vendorB],
          '2026-09-01'
        );

        const vB = report.vendors.find(v => v.vendorId === vendorB.id);
        const ok = vB !== undefined && vB.totalDue === 10000;

        return {
          passed: ok,
          details: `Vendor B Paid voucher ($8,000) excluded. Total Due: $${vB?.totalDue}`
        };
      }
    );

    executeTest(
      'TEST-APAG-05',
      'Immutable Vendor Aging Snapshot Generation with SHA-256 Seal',
      'Supplier Aging Engine',
      () => {
        const report = AccountsPayableEngine.generateVendorAgingReport(
          mockVouchersForAging,
          [vendorA, vendorB],
          '2026-09-01'
        );

        const snap = AccountsPayableEngine.createVendorAgingSnapshot(
          mockTenantId,
          mockCompanyId,
          report,
          'user-finance-controller'
        );

        const ok =
          snap.tenantId === mockTenantId &&
          snap.companyId === mockCompanyId &&
          snap.grandTotal === 26500 &&
          snap.immutableHash.startsWith('AP-HASH-') &&
          snap.createdBy === 'user-finance-controller';

        return {
          passed: ok,
          details: `Aging Snapshot ${snap.snapshotId} generated with immutable seal ${snap.immutableHash.substring(0, 20)}...`
        };
      }
    );

    // =========================================================================
    // SECTION 2: VENDOR STATEMENT GENERATION & RECONCILIATION (TESTS 6 - 10)
    // =========================================================================

    const mockInvoicesForStatement: SupplierInvoice[] = [
      {
        id: 'inv-st-1',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        invoiceNumber: 'SINV-2026-0101',
        vendorInvoiceNumber: 'VINV-01',
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        invoiceDate: '2026-06-01',
        postingDate: '2026-06-01',
        dueDate: '2026-07-01',
        currency: 'USD',
        exchangeRate: 1.0,
        netAmount: 10000,
        taxAmount: 1500,
        grossAmount: 11500,
        status: 'POSTED',
        threeWayMatchStatus: 'MATCHED',
        items: [],
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z'
      },
      {
        id: 'inv-st-2',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        invoiceNumber: 'SINV-2026-0202',
        vendorInvoiceNumber: 'VINV-02',
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        invoiceDate: '2026-07-15',
        postingDate: '2026-07-15',
        dueDate: '2026-08-15',
        currency: 'USD',
        exchangeRate: 1.0,
        netAmount: 8000,
        taxAmount: 1200,
        grossAmount: 9200,
        status: 'POSTED',
        threeWayMatchStatus: 'MATCHED',
        items: [],
        createdAt: '2026-07-15T00:00:00Z',
        updatedAt: '2026-07-15T00:00:00Z'
      },
      {
        id: 'inv-st-3',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        invoiceNumber: 'SINV-2026-0303',
        vendorInvoiceNumber: 'VINV-03',
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        invoiceDate: '2026-08-10',
        postingDate: '2026-08-10',
        dueDate: '2026-09-10',
        currency: 'USD',
        exchangeRate: 1.0,
        netAmount: 5000,
        taxAmount: 750,
        grossAmount: 5750,
        status: 'POSTED',
        threeWayMatchStatus: 'MATCHED',
        items: [],
        createdAt: '2026-08-10T00:00:00Z',
        updatedAt: '2026-08-10T00:00:00Z'
      }
    ];

    const mockCreditNotesForStatement: SupplierCreditNote[] = [
      {
        id: 'cn-st-1',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        creditNoteNumber: 'SCN-2026-001',
        vendorCreditNoteRef: 'VCR-01',
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        issueDate: '2026-07-20',
        reasonCode: 'RETURN_DAMAGED',
        currency: 'USD',
        amount: 2000,
        taxAmount: 300,
        totalAmount: 2300,
        status: 'POSTED',
        createdAt: '2026-07-20T00:00:00Z'
      }
    ];

    const mockPaymentsForStatement: PaymentBatch[] = [
      {
        id: 'pb-st-1',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        batchNumber: 'PB-20260701-01',
        proposalId: 'prop-st-1',
        paymentMethod: 'BANK_TRANSFER',
        currency: 'USD',
        totalAmount: 11500,
        totalCount: 1,
        paymentDate: '2026-07-05',
        status: 'RELEASED',
        items: [
          {
            id: 'pbi-01',
            batchId: 'pb-st-1',
            voucherId: 'vch-st-1',
            vendorId: vendorA.id,
            vendorName: vendorA.name,
            paymentAmount: 11500,
            reference: 'Payment for VINV-01'
          }
        ],
        createdAt: '2026-07-05T00:00:00Z'
      }
    ];

    executeTest(
      'TEST-APSTMT-06',
      'Vendor Statement Multi-Period Date Range Filtering and Opening Balance Invariant',
      'Vendor Statement Engine',
      () => {
        // Statement Range: 2026-07-01 to 2026-08-31
        // Before 2026-07-01: Invoice 1 ($11,500) posted on 2026-06-01 -> Opening Balance = $11,500
        const statement = AccountsPayableEngine.generateVendorStatement(
          vendorA.id,
          vendorA.code,
          vendorA.name,
          '2026-07-01',
          '2026-08-31',
          mockInvoicesForStatement,
          [],
          mockCreditNotesForStatement,
          mockPaymentsForStatement
        );

        const ok =
          statement.openingBalance === 11500 &&
          statement.vendorId === vendorA.id &&
          statement.lines.length === 4; // Payment ($11,500), Inv 2 ($9,200), CN 1 ($2,300), Inv 3 ($5,750)

        return {
          passed: ok,
          details: `Statement Opening Balance=$${statement.openingBalance}, Lines=${statement.lines.length}, Closing Balance=$${statement.closingBalance}`
        };
      }
    );

    executeTest(
      'TEST-APSTMT-07',
      'Multi-Document Chronological Running Balance Line Reconstruction',
      'Vendor Statement Engine',
      () => {
        const statement = AccountsPayableEngine.generateVendorStatement(
          vendorA.id,
          vendorA.code,
          vendorA.name,
          '2026-07-01',
          '2026-08-31',
          mockInvoicesForStatement,
          [],
          mockCreditNotesForStatement,
          mockPaymentsForStatement
        );

        // Expected Running balances:
        // Opening: 11,500
        // 2026-07-05: Payment (-11,500) -> 0
        // 2026-07-15: Invoice (+9,200) -> 9,200
        // 2026-07-20: Credit Note (-2,300) -> 6,900
        // 2026-08-10: Invoice (+5,750) -> 12,650
        const l0 = statement.lines[0];
        const l1 = statement.lines[1];
        const l2 = statement.lines[2];
        const l3 = statement.lines[3];

        const ok =
          l0.runningBalance === 0 &&
          l1.runningBalance === 9200 &&
          l2.runningBalance === 6900 &&
          l3.runningBalance === 12650 &&
          statement.closingBalance === 12650;

        return {
          passed: ok,
          details: `Chronological Balances: L0(Pay)=$${l0.runningBalance}, L1(Inv)=$${l1.runningBalance}, L2(CN)=$${l2.runningBalance}, L3(Inv)=$${l3.runningBalance}. Final=$${statement.closingBalance}`
        };
      }
    );

    executeTest(
      'TEST-APSTMT-08',
      'Subledger Balance vs Vendor Statement Reconciliation & Variance Detection',
      'Vendor Statement Engine',
      () => {
        const statement = AccountsPayableEngine.generateVendorStatement(
          vendorA.id,
          vendorA.code,
          vendorA.name,
          '2026-07-01',
          '2026-08-31',
          mockInvoicesForStatement,
          [],
          mockCreditNotesForStatement,
          mockPaymentsForStatement
        );

        // Open vouchers in subledger totaling $11,650 (Variance = $1,000)
        const openVouchers: APVoucher[] = [
          {
            id: 'vch-sub-1',
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            voucherNumber: 'VCH-SUB-1',
            supplierInvoiceId: 'inv-st-2',
            supplierInvoiceNumber: 'SINV-2026-0202',
            vendorInvoiceNumber: 'VINV-02',
            vendorId: vendorA.id,
            vendorCode: vendorA.code,
            vendorName: vendorA.name,
            voucherDate: '2026-07-15',
            dueDate: '2026-08-15',
            currency: 'USD',
            grossAmount: 9200,
            netAmount: 8000,
            paidAmount: 2300, // Credit note applied
            remainingAmount: 6900,
            status: 'PARTIALLY_PAID',
            createdAt: '2026-07-15T00:00:00Z'
          },
          {
            id: 'vch-sub-2',
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            voucherNumber: 'VCH-SUB-2',
            supplierInvoiceId: 'inv-st-3',
            supplierInvoiceNumber: 'SINV-2026-0303',
            vendorInvoiceNumber: 'VINV-03',
            vendorId: vendorA.id,
            vendorCode: vendorA.code,
            vendorName: vendorA.name,
            voucherDate: '2026-08-10',
            dueDate: '2026-09-10',
            currency: 'USD',
            grossAmount: 5750,
            netAmount: 5000,
            paidAmount: 1000, // Subledger shows partial payment not on statement
            remainingAmount: 4750,
            status: 'PARTIALLY_PAID',
            createdAt: '2026-08-10T00:00:00Z'
          }
        ];

        const rec = AccountsPayableEngine.reconcileVendorStatement(statement, openVouchers, '2026-08-31');

        const ok =
          !rec.isReconciled &&
          rec.variance === 1000 &&
          rec.reconciliationStatus === 'VARIANCE_DETECTED';

        return {
          passed: ok,
          details: `Reconciliation Status: ${rec.reconciliationStatus}, Statement Balance: $${rec.statementClosingBalance}, Subledger: $${rec.subledgerOpenBalance}, Variance: $${rec.variance}`
        };
      }
    );

    executeTest(
      'TEST-APSTMT-09',
      'Zero Variance Statement Reconciliation (PERFECT_MATCH Status)',
      'Vendor Statement Engine',
      () => {
        const statement = AccountsPayableEngine.generateVendorStatement(
          vendorA.id,
          vendorA.code,
          vendorA.name,
          '2026-07-01',
          '2026-08-31',
          mockInvoicesForStatement,
          [],
          mockCreditNotesForStatement,
          mockPaymentsForStatement
        );

        // Open vouchers in subledger totaling exactly $12,650
        const matchedVouchers: APVoucher[] = [
          {
            id: 'vch-sub-1',
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            voucherNumber: 'VCH-SUB-1',
            supplierInvoiceId: 'inv-st-2',
            supplierInvoiceNumber: 'SINV-2026-0202',
            vendorInvoiceNumber: 'VINV-02',
            vendorId: vendorA.id,
            vendorCode: vendorA.code,
            vendorName: vendorA.name,
            voucherDate: '2026-07-15',
            dueDate: '2026-08-15',
            currency: 'USD',
            grossAmount: 9200,
            netAmount: 8000,
            paidAmount: 2300,
            remainingAmount: 6900,
            status: 'PARTIALLY_PAID',
            createdAt: '2026-07-15T00:00:00Z'
          },
          {
            id: 'vch-sub-2',
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            voucherNumber: 'VCH-SUB-2',
            supplierInvoiceId: 'inv-st-3',
            supplierInvoiceNumber: 'SINV-2026-0303',
            vendorInvoiceNumber: 'VINV-03',
            vendorId: vendorA.id,
            vendorCode: vendorA.code,
            vendorName: vendorA.name,
            voucherDate: '2026-08-10',
            dueDate: '2026-09-10',
            currency: 'USD',
            grossAmount: 5750,
            netAmount: 5000,
            paidAmount: 0,
            remainingAmount: 5750,
            status: 'UNPAID',
            createdAt: '2026-08-10T00:00:00Z'
          }
        ];

        const rec = AccountsPayableEngine.reconcileVendorStatement(statement, matchedVouchers, '2026-08-31');

        const ok =
          rec.isReconciled &&
          rec.variance === 0 &&
          rec.reconciliationStatus === 'PERFECT_MATCH';

        return {
          passed: ok,
          details: `Reconciliation Status: ${rec.reconciliationStatus}, Variance: $${rec.variance}. Perfectly matched.`
        };
      }
    );

    executeTest(
      'TEST-APSTMT-10',
      'Disputed Variance Threshold Escalation (> $5,000 threshold flag)',
      'Vendor Statement Engine',
      () => {
        const statement = AccountsPayableEngine.generateVendorStatement(
          vendorA.id,
          vendorA.code,
          vendorA.name,
          '2026-07-01',
          '2026-08-31',
          mockInvoicesForStatement,
          [],
          mockCreditNotesForStatement,
          mockPaymentsForStatement
        );

        // Subledger missing major invoice ($6,000 variance)
        const partialVouchers: APVoucher[] = [
          {
            id: 'vch-sub-1',
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            voucherNumber: 'VCH-SUB-1',
            supplierInvoiceId: 'inv-st-2',
            supplierInvoiceNumber: 'SINV-2026-0202',
            vendorInvoiceNumber: 'VINV-02',
            vendorId: vendorA.id,
            vendorCode: vendorA.code,
            vendorName: vendorA.name,
            voucherDate: '2026-07-15',
            dueDate: '2026-08-15',
            currency: 'USD',
            grossAmount: 9200,
            netAmount: 8000,
            paidAmount: 2300,
            remainingAmount: 6650,
            status: 'PARTIALLY_PAID',
            createdAt: '2026-07-15T00:00:00Z'
          }
        ];

        const rec = AccountsPayableEngine.reconcileVendorStatement(statement, partialVouchers, '2026-08-31');

        const ok =
          !rec.isReconciled &&
          rec.variance === 6000 &&
          rec.reconciliationStatus === 'DISPUTED';

        return {
          passed: ok,
          details: `High variance ($${rec.variance}) escalated to ${rec.reconciliationStatus}.`
        };
      }
    );

    // =========================================================================
    // SECTION 3: SUPPLIER CREDIT NOTE PROCESSING & APPLICATION (TESTS 11 - 15)
    // =========================================================================

    let testCreditNote: SupplierCreditNote;
    let testOpenVoucher: APVoucher;

    executeTest(
      'TEST-APCN-11',
      'Supplier Credit Note Creation with Categorized Reason Codes',
      'Supplier Credit Note Engine',
      () => {
        const { creditNote, auditRecord } = AccountsPayableEngine.createSupplierCreditNote({
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          branchId: mockBranchId,
          creditNoteNumber: 'SCN-2026-0088',
          vendorCreditNoteRef: 'VCR-8899',
          vendorId: vendorA.id,
          vendorCode: vendorA.code,
          vendorName: vendorA.name,
          issueDate: '2026-08-20',
          reasonCode: 'DEFECTIVE_GOODS',
          currency: 'USD',
          amount: 3000,
          taxAmount: 450,
          totalAmount: 3450
        });

        testCreditNote = creditNote;

        const ok =
          creditNote.status === 'POSTED' &&
          creditNote.reasonCode === 'DEFECTIVE_GOODS' &&
          creditNote.totalAmount === 3450 &&
          auditRecord.immutableHash.startsWith('AP-HASH-');

        return {
          passed: ok,
          details: `Credit Note ${creditNote.creditNoteNumber} posted for $${creditNote.totalAmount}. Reason: ${creditNote.reasonCode}`
        };
      }
    );

    executeTest(
      'TEST-APCN-12',
      'Application of Credit Note to Open AP Voucher with Full Liability Liquidation',
      'Supplier Credit Note Engine',
      () => {
        // Voucher with remaining balance = $3,450
        const voucher: APVoucher = {
          id: 'vch-settle-01',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          voucherNumber: 'VCH-SETTLE-01',
          supplierInvoiceId: 'sinv-100',
          supplierInvoiceNumber: 'SINV-100',
          vendorInvoiceNumber: 'VINV-100',
          vendorId: vendorA.id,
          vendorCode: vendorA.code,
          vendorName: vendorA.name,
          voucherDate: '2026-08-01',
          dueDate: '2026-08-31',
          currency: 'USD',
          grossAmount: 3450,
          netAmount: 3000,
          paidAmount: 0,
          remainingAmount: 3450,
          status: 'UNPAID',
          createdAt: '2026-08-01T00:00:00Z'
        };

        const { updatedCreditNote, updatedVoucher, appliedAmount, auditRecord } =
          AccountsPayableEngine.applyCreditNoteToVoucher(testCreditNote, voucher, undefined, 'user-ap-clerk');

        const ok =
          appliedAmount === 3450 &&
          updatedVoucher.remainingAmount === 0 &&
          updatedVoucher.status === 'PAID' &&
          updatedCreditNote.status === 'APPLIED' &&
          updatedCreditNote.appliedToVoucherId === voucher.id &&
          auditRecord.actionType === 'APPLY_SUPPLIER_CREDIT_NOTE';

        return {
          passed: ok,
          details: `Applied $${appliedAmount} from CN ${updatedCreditNote.creditNoteNumber}. Voucher status: ${updatedVoucher.status}, Remaining: $${updatedVoucher.remainingAmount}`
        };
      }
    );

    executeTest(
      'TEST-APCN-13',
      'Partial Credit Note Application to AP Voucher (PARTIALLY_PAID Voucher State)',
      'Supplier Credit Note Engine',
      () => {
        const { creditNote } = AccountsPayableEngine.createSupplierCreditNote({
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          creditNoteNumber: 'SCN-2026-0099',
          vendorCreditNoteRef: 'VCR-9900',
          vendorId: vendorA.id,
          vendorCode: vendorA.code,
          vendorName: vendorA.name,
          issueDate: '2026-08-25',
          reasonCode: 'PRICE_CORRECTION',
          currency: 'USD',
          amount: 1000,
          taxAmount: 150,
          totalAmount: 1150
        });

        // Larger voucher ($5,000 remaining)
        const voucher: APVoucher = {
          id: 'vch-large-01',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          voucherNumber: 'VCH-LARGE-01',
          supplierInvoiceId: 'sinv-200',
          supplierInvoiceNumber: 'SINV-200',
          vendorInvoiceNumber: 'VINV-200',
          vendorId: vendorA.id,
          vendorCode: vendorA.code,
          vendorName: vendorA.name,
          voucherDate: '2026-08-01',
          dueDate: '2026-08-31',
          currency: 'USD',
          grossAmount: 5000,
          netAmount: 4350,
          paidAmount: 0,
          remainingAmount: 5000,
          status: 'UNPAID',
          createdAt: '2026-08-01T00:00:00Z'
        };

        const { updatedCreditNote, updatedVoucher, appliedAmount } =
          AccountsPayableEngine.applyCreditNoteToVoucher(creditNote, voucher, undefined, 'user-ap-clerk');

        const ok =
          appliedAmount === 1150 &&
          updatedVoucher.remainingAmount === 3850 &&
          updatedVoucher.paidAmount === 1150 &&
          updatedVoucher.status === 'PARTIALLY_PAID' &&
          updatedCreditNote.status === 'APPLIED';

        return {
          passed: ok,
          details: `Partial CN application: $${appliedAmount} applied. Voucher status: ${updatedVoucher.status}, Remaining: $${updatedVoucher.remainingAmount}`
        };
      }
    );

    executeTest(
      'TEST-APCN-14',
      'Tenant and Company Boundary Guarding on Credit Note Application',
      'Supplier Credit Note Engine',
      () => {
        const { creditNote } = AccountsPayableEngine.createSupplierCreditNote({
          tenantId: 'other-tenant-999',
          companyId: mockCompanyId,
          creditNoteNumber: 'SCN-OTHER-01',
          vendorCreditNoteRef: 'VCR-OTHER',
          vendorId: vendorA.id,
          vendorCode: vendorA.code,
          vendorName: vendorA.name,
          issueDate: '2026-08-25',
          reasonCode: 'OTHER',
          currency: 'USD',
          amount: 500,
          taxAmount: 75,
          totalAmount: 575
        });

        const voucher: APVoucher = {
          id: 'vch-ten-01',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          voucherNumber: 'VCH-TEN-01',
          supplierInvoiceId: 'sinv-300',
          supplierInvoiceNumber: 'SINV-300',
          vendorInvoiceNumber: 'VINV-300',
          vendorId: vendorA.id,
          vendorCode: vendorA.code,
          vendorName: vendorA.name,
          voucherDate: '2026-08-01',
          dueDate: '2026-08-31',
          currency: 'USD',
          grossAmount: 1000,
          netAmount: 870,
          paidAmount: 0,
          remainingAmount: 1000,
          status: 'UNPAID',
          createdAt: '2026-08-01T00:00:00Z'
        };

        let rejected = false;
        try {
          AccountsPayableEngine.applyCreditNoteToVoucher(creditNote, voucher);
        } catch (err: any) {
          rejected = err.message.includes('TENANT_COMPANY_MISMATCH');
        }

        return {
          passed: rejected,
          details: `Cross-tenant credit note application properly rejected with TENANT_COMPANY_MISMATCH error.`
        };
      }
    );

    executeTest(
      'TEST-APCN-15',
      'Cross-Vendor Credit Note Application Rejection Invariant',
      'Supplier Credit Note Engine',
      () => {
        const { creditNote } = AccountsPayableEngine.createSupplierCreditNote({
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          creditNoteNumber: 'SCN-VEN-B',
          vendorCreditNoteRef: 'VCR-VB',
          vendorId: vendorB.id,
          vendorCode: vendorB.code,
          vendorName: vendorB.name,
          issueDate: '2026-08-25',
          reasonCode: 'DEFECTIVE_GOODS',
          currency: 'USD',
          amount: 500,
          taxAmount: 75,
          totalAmount: 575
        });

        const voucherForVendorA: APVoucher = {
          id: 'vch-ven-a',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          voucherNumber: 'VCH-VEN-A',
          supplierInvoiceId: 'sinv-400',
          supplierInvoiceNumber: 'SINV-400',
          vendorInvoiceNumber: 'VINV-400',
          vendorId: vendorA.id,
          vendorCode: vendorA.code,
          vendorName: vendorA.name,
          voucherDate: '2026-08-01',
          dueDate: '2026-08-31',
          currency: 'USD',
          grossAmount: 1000,
          netAmount: 870,
          paidAmount: 0,
          remainingAmount: 1000,
          status: 'UNPAID',
          createdAt: '2026-08-01T00:00:00Z'
        };

        let rejected = false;
        try {
          AccountsPayableEngine.applyCreditNoteToVoucher(creditNote, voucherForVendorA);
        } catch (err: any) {
          rejected = err.message.includes('VENDOR_MISMATCH');
        }

        return {
          passed: rejected,
          details: `Cross-vendor application properly rejected with VENDOR_MISMATCH error.`
        };
      }
    );

    // =========================================================================
    // SECTION 4: SUPPLIER DEBIT NOTE LIFECYCLE & ADJUSTMENTS (TESTS 16 - 18)
    // =========================================================================

    let testDebitNote: SupplierDebitNote;

    executeTest(
      'TEST-APDN-16',
      'Supplier Debit Note Creation with Document Tracking and Audit Hash',
      'Supplier Debit Note Engine',
      () => {
        const { debitNote, auditRecord } = AccountsPayableEngine.createSupplierDebitNote({
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          branchId: mockBranchId,
          debitNoteNumber: 'SDN-2026-0050',
          vendorDebitNoteRef: 'VDN-5050',
          vendorId: vendorA.id,
          vendorCode: vendorA.code,
          vendorName: vendorA.name,
          issueDate: '2026-08-28',
          reasonCode: 'PRICE_CORRECTION',
          currency: 'USD',
          amount: 1500,
          taxAmount: 225,
          totalAmount: 1725
        });

        testDebitNote = debitNote;

        const ok =
          debitNote.status === 'POSTED' &&
          debitNote.totalAmount === 1725 &&
          debitNote.reasonCode === 'PRICE_CORRECTION' &&
          auditRecord.immutableHash.startsWith('AP-HASH-');

        return {
          passed: ok,
          details: `Debit Note ${debitNote.debitNoteNumber} issued to ${debitNote.vendorName} for $${debitNote.totalAmount}. Reason: ${debitNote.reasonCode}`
        };
      }
    );

    executeTest(
      'TEST-APDN-17',
      'Application of Debit Note to Open AP Voucher Reducing Payable Obligation',
      'Supplier Debit Note Engine',
      () => {
        const voucher: APVoucher = {
          id: 'vch-dn-01',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          voucherNumber: 'VCH-DN-01',
          supplierInvoiceId: 'sinv-500',
          supplierInvoiceNumber: 'SINV-500',
          vendorInvoiceNumber: 'VINV-500',
          vendorId: vendorA.id,
          vendorCode: vendorA.code,
          vendorName: vendorA.name,
          voucherDate: '2026-08-01',
          dueDate: '2026-08-31',
          currency: 'USD',
          grossAmount: 3000,
          netAmount: 2600,
          paidAmount: 0,
          remainingAmount: 3000,
          status: 'UNPAID',
          createdAt: '2026-08-01T00:00:00Z'
        };

        const { updatedDebitNote, updatedVoucher, appliedAmount } =
          AccountsPayableEngine.applyDebitNoteToVoucher(testDebitNote, voucher, undefined, 'user-ap-manager');

        const ok =
          appliedAmount === 1725 &&
          updatedVoucher.remainingAmount === 1275 &&
          updatedVoucher.paidAmount === 1725 &&
          updatedVoucher.status === 'PARTIALLY_PAID' &&
          updatedDebitNote.status === 'APPLIED';

        return {
          passed: ok,
          details: `Debit note applied: $${appliedAmount}. Voucher remaining balance reduced from $3,000 to $${updatedVoucher.remainingAmount}`
        };
      }
    );

    executeTest(
      'TEST-APDN-18',
      'Over-settlement Prevention Guard on Inactive or Settled Vouchers',
      'Supplier Debit Note Engine',
      () => {
        const settledVoucher: APVoucher = {
          id: 'vch-zero-bal',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          voucherNumber: 'VCH-ZERO',
          supplierInvoiceId: 'sinv-600',
          supplierInvoiceNumber: 'SINV-600',
          vendorInvoiceNumber: 'VINV-600',
          vendorId: vendorA.id,
          vendorCode: vendorA.code,
          vendorName: vendorA.name,
          voucherDate: '2026-08-01',
          dueDate: '2026-08-31',
          currency: 'USD',
          grossAmount: 1000,
          netAmount: 870,
          paidAmount: 1000,
          remainingAmount: 0,
          status: 'PAID',
          createdAt: '2026-08-01T00:00:00Z'
        };

        let rejected = false;
        try {
          AccountsPayableEngine.applyDebitNoteToVoucher(testDebitNote, settledVoucher);
        } catch (err: any) {
          rejected = err.message.includes('VOUCHER_ALREADY_SETTLED') || err.message.includes('INVALID_DEBIT_NOTE_STATUS');
        }

        return {
          passed: rejected,
          details: `Application on settled voucher prevented.`
        };
      }
    );

    // =========================================================================
    // SECTION 5: PERIOD-END PURCHASE ACCRUAL ENGINE (GRNI) (TESTS 19 - 22)
    // =========================================================================

    const mockGRNsForAccruals = [
      {
        id: 'grn-uninv-01',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        number: 'GRN-2026-088',
        poId: 'po-2026-088',
        poNumber: 'PO-2026-0088',
        vendorId: vendorA.id,
        vendorName: vendorA.name,
        totalAmount: 15000,
        currency: 'USD',
        status: 'RECEIVED'
      },
      {
        id: 'grn-inv-02',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        number: 'GRN-2026-089',
        poId: 'po-2026-089',
        poNumber: 'PO-2026-0089',
        vendorId: vendorB.id,
        vendorName: vendorB.name,
        totalAmount: 25000,
        currency: 'USD',
        status: 'RECEIVED'
      }
    ];

    const mockInvoicesForAccruals: SupplierInvoice[] = [
      {
        id: 'sinv-matching-grn',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        invoiceNumber: 'SINV-2026-089',
        vendorInvoiceNumber: 'VINV-089',
        vendorId: vendorB.id,
        vendorCode: vendorB.code,
        vendorName: vendorB.name,
        grnId: 'grn-inv-02',
        grnNumber: 'GRN-2026-089',
        invoiceDate: '2026-08-30',
        postingDate: '2026-08-30',
        dueDate: '2026-09-30',
        currency: 'USD',
        exchangeRate: 1.0,
        netAmount: 25000,
        taxAmount: 3750,
        grossAmount: 28750,
        status: 'POSTED',
        threeWayMatchStatus: 'MATCHED',
        items: [],
        createdAt: '2026-08-30T00:00:00Z',
        updatedAt: '2026-08-30T00:00:00Z'
      }
    ];

    let testAccrual: PurchaseAccrual;

    executeTest(
      'TEST-APACCR-19',
      'Uninvoiced Goods Receipts Identification and Period-End Purchase Accrual Posting',
      'Purchase Accruals Engine',
      () => {
        const accruals = AccountsPayableEngine.calculatePurchaseAccruals(
          mockTenantId,
          mockCompanyId,
          '2026-08',
          mockGRNsForAccruals,
          mockInvoicesForAccruals
        );

        testAccrual = accruals[0];

        const ok =
          accruals.length === 1 &&
          accruals[0].grnId === 'grn-uninv-01' &&
          accruals[0].accruedAmount === 15000 &&
          accruals[0].period === '2026-08' &&
          accruals[0].status === 'POSTED';

        return {
          passed: ok,
          details: `Uninvoiced GRN ${accruals[0]?.grnNumber} identified. Accrual ${accruals[0]?.accrualNumber} posted for $${accruals[0]?.accruedAmount}`
        };
      }
    );

    executeTest(
      'TEST-APACCR-20',
      'Exclusion of Invoiced GRNs from Period-End Purchase Accrual Generation',
      'Purchase Accruals Engine',
      () => {
        const accruals = AccountsPayableEngine.calculatePurchaseAccruals(
          mockTenantId,
          mockCompanyId,
          '2026-08',
          mockGRNsForAccruals,
          mockInvoicesForAccruals
        );

        const hasInvoicedGRN = accruals.some(a => a.grnId === 'grn-inv-02');
        const ok = !hasInvoicedGRN;

        return {
          passed: ok,
          details: `Invoiced GRN 'GRN-2026-089' properly excluded from purchase accruals.`
        };
      }
    );

    executeTest(
      'TEST-APACCR-21',
      'Purchase Accrual Reversal Lifecycle in Subsequent Period',
      'Purchase Accruals Engine',
      () => {
        const { reversedAccrual, auditRecord } = AccountsPayableEngine.reversePurchaseAccrual(
          testAccrual,
          'Period 2026-09 Opening Accrual Reversal',
          'user-gl-accountant'
        );

        const ok =
          reversedAccrual.status === 'REVERSED' &&
          reversedAccrual.reversedAt !== undefined &&
          auditRecord.actionType === 'REVERSE_PURCHASE_ACCRUAL';

        return {
          passed: ok,
          details: `Accrual ${reversedAccrual.accrualNumber} status transitioned to REVERSED. Reversal reason: ${auditRecord.reason}`
        };
      }
    );

    executeTest(
      'TEST-APACCR-22',
      'Double Reversal Prevention Guard on Inactive Accruals',
      'Purchase Accruals Engine',
      () => {
        const reversedAccrual: PurchaseAccrual = {
          ...testAccrual,
          status: 'REVERSED',
          reversedAt: new Date().toISOString()
        };

        let rejected = false;
        try {
          AccountsPayableEngine.reversePurchaseAccrual(reversedAccrual, 'Attempt duplicate reversal');
        } catch (err: any) {
          rejected = err.message.includes('ACCRUAL_ALREADY_REVERSED');
        }

        return {
          passed: rejected,
          details: `Duplicate reversal rejected with ACCRUAL_ALREADY_REVERSED.`
        };
      }
    );

    // =========================================================================
    // SECTION 6: VENDOR CREDIT CONTROL & ADMINISTRATIVE RISK (TESTS 23 - 26)
    // =========================================================================

    const mockOpenVouchersForCredit: APVoucher[] = [
      {
        id: 'vch-cr-1',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        voucherNumber: 'VCH-CR-1',
        supplierInvoiceId: 'sinv-cr-1',
        supplierInvoiceNumber: 'SINV-CR-1',
        vendorInvoiceNumber: 'VCR-01',
        vendorId: vendorA.id,
        vendorCode: vendorA.code,
        vendorName: vendorA.name,
        voucherDate: '2026-08-01',
        dueDate: '2026-08-31',
        currency: 'USD',
        grossAmount: 350000,
        netAmount: 300000,
        paidAmount: 0,
        remainingAmount: 350000,
        status: 'UNPAID',
        createdAt: '2026-08-01T00:00:00Z'
      }
    ];

    executeTest(
      'TEST-APCC-23',
      'Vendor Exposure & Credit Limit Utilization Calculation',
      'Vendor Credit Control Engine',
      () => {
        // Credit limit = $500,000. Outstanding = $350,000. New invoice = $50,000 -> Total = $400,000 (80%)
        const check = AccountsPayableEngine.validateVendorCreditControl(
          vendorA.id,
          vendorA.code,
          vendorA.name,
          50000,
          mockOpenVouchersForCredit,
          500000,
          60,
          false
        );

        const ok =
          check.outstandingBalance === 350000 &&
          check.utilizationPercent === 80.0 &&
          !check.isLimitExceeded;

        return {
          passed: ok,
          details: `Vendor ${check.vendorName}: Outstanding=$${check.outstandingBalance}, New Exposure=$400,000, Utilization=${check.utilizationPercent}% of $${check.creditLimit}`
        };
      }
    );

    executeTest(
      'TEST-APCC-24',
      'Credit Limit Exceeded Guard & Critical Warning Generation',
      'Vendor Credit Control Engine',
      () => {
        // Outstanding = $350,000. New invoice = $200,000 -> Total = $550,000 (> $500,000 limit)
        const check = AccountsPayableEngine.validateVendorCreditControl(
          vendorA.id,
          vendorA.code,
          vendorA.name,
          200000,
          mockOpenVouchersForCredit,
          500000,
          60,
          false
        );

        const ok =
          check.isLimitExceeded &&
          check.utilizationPercent === 110.0 &&
          check.warnings.some(w => w.includes('CREDIT_LIMIT_EXCEEDED'));

        return {
          passed: ok,
          details: `Credit limit exceeded (${check.utilizationPercent}%). Warning: ${check.warnings[0]}`
        };
      }
    );

    executeTest(
      'TEST-APCC-25',
      '80% Utilization Threshold Early-Warning Flag Generation',
      'Vendor Credit Control Engine',
      () => {
        const check = AccountsPayableEngine.validateVendorCreditControl(
          vendorA.id,
          vendorA.code,
          vendorA.name,
          75000,
          mockOpenVouchersForCredit,
          500000,
          60,
          false
        );

        const ok =
          !check.isLimitExceeded &&
          check.utilizationPercent === 85.0 &&
          check.warnings.some(w => w.includes('CREDIT_WARNING'));

        return {
          passed: ok,
          details: `Early warning triggered at ${check.utilizationPercent}% utilization.`
        };
      }
    );

    executeTest(
      'TEST-APCC-26',
      'Administrative Vendor Financial Block Enforcement',
      'Vendor Credit Control Engine',
      () => {
        const check = AccountsPayableEngine.validateVendorCreditControl(
          vendorA.id,
          vendorA.code,
          vendorA.name,
          10000,
          mockOpenVouchersForCredit,
          500000,
          60,
          true,
          'Pending Legal Compliance Audit'
        );

        const ok =
          check.isBlocked &&
          check.warnings.some(w => w.includes('VENDOR_BLOCKED'));

        return {
          passed: ok,
          details: `Vendor Block enforced. Reason: ${check.blockReason}. Warning: ${check.warnings[0]}`
        };
      }
    );

    // =========================================================================
    // SECTION 7: AP EXECUTIVE ANALYTICS, DPO & CASH FORECASTING (TESTS 27 - 28)
    // =========================================================================

    executeTest(
      'TEST-APANAL-27',
      'Executive Cash Outflow Forecast Distribution across 6 Time Horizons',
      'AP Analytics Workspace',
      () => {
        const dashboard = AccountsPayableEngine.calculateAPAnalyticsDashboard(
          mockTenantId,
          mockCompanyId,
          mockVouchersForAging,
          [],
          mockGRNsForAccruals,
          2400000,
          '2026-09-01'
        );

        const ok =
          dashboard.outflowForecast.length === 6 &&
          dashboard.totalOpenPayables === 26500 &&
          dashboard.totalOverduePayables === 11500 &&
          dashboard.overduePercentage > 40;

        return {
          passed: ok,
          details: `Total Open Payables=$${dashboard.totalOpenPayables}, Overdue=$${dashboard.totalOverduePayables} (${dashboard.overduePercentage}%). Forecast Buckets=${dashboard.outflowForecast.length}`
        };
      }
    );

    executeTest(
      'TEST-APANAL-28',
      'DPO, Early Discount Capture Rate, and Vendor Concentration HHI Index Calculation',
      'AP Analytics Workspace',
      () => {
        const dashboard = AccountsPayableEngine.calculateAPAnalyticsDashboard(
          mockTenantId,
          mockCompanyId,
          mockVouchersForAging,
          mockInvoicesForAccruals,
          mockGRNsForAccruals,
          2400000,
          '2026-09-01'
        );

        const ok =
          dashboard.daysPayableOutstanding > 0 &&
          dashboard.vendorConcentrationIndex > 0 &&
          dashboard.topVendorsByExposure.length === 2 &&
          dashboard.grirUninvoicedExposure === 15000;

        return {
          passed: ok,
          details: `DPO=${dashboard.daysPayableOutstanding} days, HHI=${dashboard.vendorConcentrationIndex}, GRNI Uninvoiced Exposure=$${dashboard.grirUninvoicedExposure}, Top Vendors=${dashboard.topVendorsByExposure.length}`
        };
      }
    );

    // =========================================================================
    // SECTION 8: ACCOUNTING INTEGRATION & ZERO DIRECT GL MUTATION (TESTS 29 - 30)
    // =========================================================================

    const mockAccounts: Account[] = [
      {
        id: 'acc-2000',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        code: '2000',
        name: 'Accounts Payable Control',
        nameAr: 'حساب مراقبة الذمم الدائنة',
        accountType: 'Payable',
        category: 'Liability',
        balance: 500000,
        isActive: true,
        currency: 'USD',
        level: 3
      },
      {
        id: 'acc-5000',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        code: '5000',
        name: 'Cost of Goods Sold / Purchase Adjustments',
        nameAr: 'تكلفة البضاعة المباعة / تسويات المشتريات',
        accountType: 'Expense',
        category: 'Expense',
        balance: 1000000,
        isActive: true,
        currency: 'USD',
        level: 3
      },
      {
        id: 'acc-2010',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        code: '2010',
        name: 'GR/IR Clearing Account',
        nameAr: 'حساب مقاصة البضائع المستلمة والفواتير',
        accountType: 'Payable',
        category: 'Liability',
        balance: 200000,
        isActive: true,
        currency: 'USD',
        level: 3
      },
      {
        id: 'acc-2020',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        code: '2020',
        name: 'Purchase Accruals (GRNI)',
        nameAr: 'مستحقات المشتريات غير المفوترة',
        accountType: 'Payable',
        category: 'Liability',
        balance: 150000,
        isActive: true,
        currency: 'USD',
        level: 3
      }
    ];

    const mockPostingRules: PostingRule[] = [
      {
        id: 'pr-cn-01',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        name: 'Supplier Credit Note Posting',
        documentType: 'SUPPLIER_CREDIT_NOTE_POSTED',
        debitAccountCode: '2000', // Debit AP Control (Reduces AP Liability)
        creditAccountCode: '5000', // Credit Purchase Adjustment / Expense
        isActive: true
      },
      {
        id: 'pr-accr-01',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        name: 'Period-End Purchase Accrual Posting',
        documentType: 'PURCHASE_ACCRUAL_POSTED',
        debitAccountCode: '2010', // Debit GR/IR Clearing
        creditAccountCode: '2020', // Credit Purchase Accruals (GRNI)
        isActive: true
      },
      {
        id: 'pr-accr-02',
        tenantId: mockTenantId,
        companyId: mockCompanyId,
        name: 'Period-End Purchase Accrual Reversal',
        documentType: 'PURCHASE_ACCRUAL_REVERSED',
        debitAccountCode: '2020', // Debit Purchase Accruals (GRNI)
        creditAccountCode: '2010', // Credit GR/IR Clearing
        isActive: true
      }
    ];

    executeTest(
      'TEST-APPR-29',
      'Supplier Credit Note Posting Rule Resolution (Debit AP Control -> Credit Purchase Adjustment)',
      'Financial Posting Rules Integration',
      () => {
        const resolved = PostingRulesEngine.resolveRule(
          mockTenantId,
          'SUPPLIER_CREDIT_NOTE_POSTED',
          mockPostingRules,
          mockAccounts,
          mockCompanyId
        );

        const ok =
          resolved !== null &&
          resolved.debitAccount.code === '2000' &&
          resolved.creditAccount.code === '5000';

        return {
          passed: ok,
          details: `Credit Note Posting Rule Resolved: Debit AP Control (${resolved?.debitAccount.code}) -> Credit Purchase Adjustment (${resolved?.creditAccount.code})`
        };
      }
    );

    executeTest(
      'TEST-APPR-30',
      'Purchase Accrual Posting Rule Resolution (Debit GR/IR Clearing -> Credit Purchase Accruals)',
      'Financial Posting Rules Integration',
      () => {
        const resolved = PostingRulesEngine.resolveRule(
          mockTenantId,
          'PURCHASE_ACCRUAL_POSTED',
          mockPostingRules,
          mockAccounts,
          mockCompanyId
        );

        const ok =
          resolved !== null &&
          resolved.debitAccount.code === '2010' &&
          resolved.creditAccount.code === '2020';

        return {
          passed: ok,
          details: `Purchase Accrual Posting Rule Resolved: Debit GR/IR (${resolved?.debitAccount.code}) -> Credit Accruals (${resolved?.creditAccount.code})`
        };
      }
    );

    const passedTests = results.filter(r => r.status === 'PASS').length;
    const failedTests = results.filter(r => r.status === 'FAIL').length;
    const durationMs = Date.now() - startTime;

    return {
      suiteId: 'PHASE-3.2B-07-HARDENING-SUITE',
      phase: 'Phase 3.2B-07: Supplier Aging, Statements, Debit/Credit Notes Reconciliation & AP Analytics Workspace',
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
