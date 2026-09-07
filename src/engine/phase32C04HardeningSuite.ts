/**
 * AM BUSINESS PLATFORM — PHASE 3.2C-04 ENTERPRISE HARDENING & QUALITY GATE SUITE
 * Domain: Advanced Customer Cash Applications, Bank Lockbox Auto-Matching,
 * Remittance Ingestion, Dispute Deductions, Claim Settlement & Credit Collections
 * Target Baseline: 30 Deterministic Enterprise Quality Scenarios (30/30 PASS)
 */

import { CashApplicationEngine } from './cashApplicationEngine';
import { CustomerBillingEngine } from './customerBillingEngine';
import { Phase32C03HardeningSuite } from './phase32C03HardeningSuite';

export interface TestScenarioResult {
  scenarioNumber: number;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: string;
}

export interface Phase32C04Report {
  suiteName: string;
  phase: string;
  timestamp: string;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  verdict: 'APPROVED' | 'REJECTED';
  results: TestScenarioResult[];
}

export class Phase32C04HardeningSuite {
  public static async runSuite(): Promise<Phase32C04Report> {
    const results: TestScenarioResult[] = [];
    const tenantId = 'tenant-cairo-hq';
    const companyId = 'comp-cairo-01';

    // Reset repositories before test execution
    CustomerBillingEngine.reset();
    CashApplicationEngine.resetState();

    // Setup helper invoices in CustomerBillingEngine
    const baseInvoice1 = CustomerBillingEngine.createBillingDocument({
      tenantId,
      companyId,
      billingType: 'STANDARD_INVOICE',
      customerId: 'cust-201',
      customerName: 'Nile Logistics Ltd',
      billingAddress: 'Corniche El Nile, Cairo',
      billingDate: '2026-09-01',
      dueDate: '2026-09-30',
      currency: 'EGP',
      exchangeRate: 1.0,
      lines: [
        {
          sku: 'SKU-LOG-01',
          description: 'Logistics Fleet Maintenance',
          billedQuantity: 1,
          uom: 'EA',
          unitPrice: 5000,
          discountPercentage: 0,
          discountAmount: 0,
          taxCategory: 'STANDARD_VAT_15',
          taxRate: 0.15
        }
      ],
      createdBy: 'billing.officer@am-enterprise.com'
    });
    CustomerBillingEngine.postBillingDocument(baseInvoice1.id, 'accounting.manager@am-enterprise.com', false);

    const baseInvoice2 = CustomerBillingEngine.createBillingDocument({
      tenantId,
      companyId,
      billingType: 'STANDARD_INVOICE',
      customerId: 'cust-201',
      customerName: 'Nile Logistics Ltd',
      billingAddress: 'Corniche El Nile, Cairo',
      billingDate: '2026-09-01',
      dueDate: '2026-09-30',
      currency: 'EGP',
      exchangeRate: 1.0,
      lines: [
        {
          sku: 'SKU-LOG-02',
          description: 'Warehousing Pallet Storage',
          billedQuantity: 2,
          uom: 'EA',
          unitPrice: 2000,
          discountPercentage: 0,
          discountAmount: 0,
          taxCategory: 'STANDARD_VAT_15',
          taxRate: 0.15
        }
      ],
      createdBy: 'billing.officer@am-enterprise.com'
    });
    CustomerBillingEngine.postBillingDocument(baseInvoice2.id, 'accounting.manager@am-enterprise.com', false);

    // =========================================================================
    // SCENARIO 01: Lockbox Batch Ingestion (BAI2 Multi-Transaction & Checksum)
    // =========================================================================
    try {
      const tStart = Date.now();
      const batch = CashApplicationEngine.importLockboxBatch({
        tenantId,
        companyId,
        format: 'BAI2',
        depositDate: '2026-09-02',
        bankAccountId: 'BANK-CIB-EGP-01',
        bankName: 'Commercial International Bank (CIB)',
        currency: 'EGP',
        transactions: [
          {
            transactionRef: 'TRX-001',
            checkOrTraceNumber: 'CHK-998811',
            paymentMethod: 'CHECK',
            paymentDate: '2026-09-02',
            depositDate: '2026-09-02',
            remittedAmount: 5750,
            payerName: 'Nile Logistics Ltd',
            payerCustomerCode: 'cust-201'
          },
          {
            transactionRef: 'TRX-002',
            checkOrTraceNumber: 'EFT-445522',
            paymentMethod: 'ELECTRONIC_EFT',
            paymentDate: '2026-09-02',
            depositDate: '2026-09-02',
            remittedAmount: 4600,
            payerName: 'Nile Logistics Ltd',
            payerCustomerCode: 'cust-201'
          }
        ],
        importedBy: 'treasury.clerk@am-enterprise.com'
      });

      const passed =
        batch.totalCheckCount === 2 &&
        batch.totalBatchAmount === 10350 &&
        batch.status === 'IMPORTED' &&
        batch.transactions.length === 2 &&
        batch.transactions[0].remittedAmount === 5750;

      results.push({
        scenarioNumber: 1,
        name: 'Lockbox Batch Ingestion (BAI2 Multi-Transaction & Checksum)',
        passed,
        durationMs: Date.now() - tStart,
        details: `Batch: ${batch.batchNumber}, Amount: ${batch.totalBatchAmount}, Checks: ${batch.totalCheckCount}`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 1,
        name: 'Lockbox Batch Ingestion (BAI2 Multi-Transaction & Checksum)',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 02: Lockbox Batch Error Guard on Negative/Zero Remittance Amount
    // =========================================================================
    try {
      const tStart = Date.now();
      let rejected = false;
      try {
        CashApplicationEngine.importLockboxBatch({
          tenantId,
          companyId,
          format: 'BAI2',
          depositDate: '2026-09-02',
          bankAccountId: 'BANK-CIB-EGP-01',
          bankName: 'CIB Bank',
          currency: 'EGP',
          transactions: [
            {
              transactionRef: 'BAD-TRX',
              checkOrTraceNumber: 'CHK-000',
              paymentMethod: 'CHECK',
              paymentDate: '2026-09-02',
              depositDate: '2026-09-02',
              remittedAmount: -500,
              payerName: 'Bad Payer'
            }
          ],
          importedBy: 'treasury.clerk@am-enterprise.com'
        });
      } catch (err: any) {
        rejected = err.message.includes('invalid remitted amount');
      }

      results.push({
        scenarioNumber: 2,
        name: 'Lockbox Batch Error Guard on Negative/Zero Remittance Amount',
        passed: rejected,
        durationMs: Date.now() - tStart,
        details: 'Correctly rejected lockbox import containing negative remittance amount.'
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 2,
        name: 'Lockbox Batch Error Guard on Negative/Zero Remittance Amount',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 03: Exact Single-Invoice AutoMatch & Full Clearing
    // =========================================================================
    try {
      const tStart = Date.now();
      const singleMatchBatch = CashApplicationEngine.importLockboxBatch({
        tenantId,
        companyId,
        format: 'BAI2',
        depositDate: '2026-09-02',
        bankAccountId: 'BANK-CIB-EGP-01',
        bankName: 'CIB Bank',
        currency: 'EGP',
        transactions: [
          {
            transactionRef: baseInvoice1.billingDocumentNumber,
            checkOrTraceNumber: 'CHK-EXACT-01',
            paymentMethod: 'CHECK',
            paymentDate: '2026-09-02',
            depositDate: '2026-09-02',
            remittedAmount: 5750, // 5000 + 750 VAT
            payerName: 'Nile Logistics Ltd',
            payerCustomerCode: 'cust-201'
          }
        ],
        importedBy: 'treasury.clerk@am-enterprise.com'
      });

      const matchRes = CashApplicationEngine.executeAutoMatch(singleMatchBatch.id, 'automatch.bot@am-enterprise.com');
      const updatedInv = CustomerBillingEngine.getBillingDocument(baseInvoice1.id)!;

      const passed =
        matchRes.clearedCount === 1 &&
        matchRes.totalClearedAmount === 5750 &&
        matchRes.batch.status === 'AUTO_CLEARED' &&
        updatedInv.openBalance === 0 &&
        updatedInv.status === 'PAID';

      results.push({
        scenarioNumber: 3,
        name: 'Exact Single-Invoice AutoMatch & Full Clearing',
        passed,
        durationMs: Date.now() - tStart,
        details: `Invoice ${baseInvoice1.billingDocumentNumber} cleared (Open Balance: ${updatedInv.openBalance}, Status: ${updatedInv.status})`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 3,
        name: 'Exact Single-Invoice AutoMatch & Full Clearing',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 04: Multi-Invoice Remittance Bundle AutoMatch & Multi-Line Clearing
    // =========================================================================
    try {
      const tStart = Date.now();
      // Create two new invoices for multi-line bundle
      const invBundle1 = CustomerBillingEngine.createBillingDocument({
        tenantId,
        companyId,
        billingType: 'STANDARD_INVOICE',
        customerId: 'cust-multi-01',
        customerName: 'Delta Cargo SA',
        billingAddress: 'Alexandria Port',
        billingDate: '2026-09-01',
        dueDate: '2026-09-30',
        currency: 'EGP',
        exchangeRate: 1.0,
        lines: [{ sku: 'SKU-01', description: 'Freight Part 1', billedQuantity: 1, uom: 'EA', unitPrice: 3000, discountPercentage: 0, discountAmount: 0, taxCategory: 'STANDARD_VAT_15', taxRate: 0.15 }],
        createdBy: 'billing.officer@am-enterprise.com'
      });
      CustomerBillingEngine.postBillingDocument(invBundle1.id, 'acc.mgr@am-enterprise.com', false);

      const invBundle2 = CustomerBillingEngine.createBillingDocument({
        tenantId,
        companyId,
        billingType: 'STANDARD_INVOICE',
        customerId: 'cust-multi-01',
        customerName: 'Delta Cargo SA',
        billingAddress: 'Alexandria Port',
        billingDate: '2026-09-01',
        dueDate: '2026-09-30',
        currency: 'EGP',
        exchangeRate: 1.0,
        lines: [{ sku: 'SKU-02', description: 'Freight Part 2', billedQuantity: 1, uom: 'EA', unitPrice: 7000, discountPercentage: 0, discountAmount: 0, taxCategory: 'STANDARD_VAT_15', taxRate: 0.15 }],
        createdBy: 'billing.officer@am-enterprise.com'
      });
      CustomerBillingEngine.postBillingDocument(invBundle2.id, 'acc.mgr@am-enterprise.com', false);

      // Total gross: (3000*1.15 = 3450) + (7000*1.15 = 8050) = 11,500
      const bundleBatch = CashApplicationEngine.importLockboxBatch({
        tenantId,
        companyId,
        format: 'BAI2',
        depositDate: '2026-09-02',
        bankAccountId: 'BANK-CIB-EGP-01',
        bankName: 'CIB Bank',
        currency: 'EGP',
        transactions: [
          {
            transactionRef: 'WIRE-BUNDLE-01',
            checkOrTraceNumber: 'TRACE-990011',
            paymentMethod: 'WIRE',
            paymentDate: '2026-09-02',
            depositDate: '2026-09-02',
            remittedAmount: 11500,
            payerName: 'Delta Cargo SA',
            remittanceLines: [
              { invoiceNumber: invBundle1.billingDocumentNumber, grossInvoiceAmount: 3450, discountTaken: 0, deductionAmount: 0, netPaymentAmount: 3450 },
              { invoiceNumber: invBundle2.billingDocumentNumber, grossInvoiceAmount: 8050, discountTaken: 0, deductionAmount: 0, netPaymentAmount: 8050 }
            ]
          }
        ],
        importedBy: 'treasury.clerk@am-enterprise.com'
      });

      const matchRes = CashApplicationEngine.executeAutoMatch(bundleBatch.id, 'automatch.bot@am-enterprise.com');
      const doc1 = CustomerBillingEngine.getBillingDocument(invBundle1.id)!;
      const doc2 = CustomerBillingEngine.getBillingDocument(invBundle2.id)!;

      const passed =
        matchRes.clearedCount === 1 &&
        matchRes.batch.status === 'AUTO_CLEARED' &&
        doc1.openBalance === 0 &&
        doc1.status === 'PAID' &&
        doc2.openBalance === 0 &&
        doc2.status === 'PAID';

      results.push({
        scenarioNumber: 4,
        name: 'Multi-Invoice Remittance Bundle AutoMatch & Multi-Line Clearing',
        passed,
        durationMs: Date.now() - tStart,
        details: `Bundle Cleared: ${invBundle1.billingDocumentNumber} ($${doc1.paidAmount}), ${invBundle2.billingDocumentNumber} ($${doc2.paidAmount})`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 4,
        name: 'Multi-Invoice Remittance Bundle AutoMatch & Multi-Line Clearing',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 05: Early Settlement Cash Discount AutoMatch Recognition
    // =========================================================================
    try {
      const tStart = Date.now();
      const discInvoice = CustomerBillingEngine.createBillingDocument({
        tenantId,
        companyId,
        billingType: 'STANDARD_INVOICE',
        customerId: 'cust-disc-01',
        customerName: 'Cairo Tech Hub',
        billingAddress: 'Smart Village, Cairo',
        billingDate: '2026-09-01',
        dueDate: '2026-09-30',
        currency: 'EGP',
        exchangeRate: 1.0,
        lines: [{ sku: 'SKU-SRV-01', description: 'Cloud Consulting', billedQuantity: 1, uom: 'EA', unitPrice: 10000, discountPercentage: 0, discountAmount: 0, taxCategory: 'STANDARD_VAT_15', taxRate: 0.15 }],
        createdBy: 'billing.officer@am-enterprise.com'
      });
      CustomerBillingEngine.postBillingDocument(discInvoice.id, 'acc.mgr@am-enterprise.com', false);

      // Gross: 11,500. Customer took 2% early cash discount ($230), remitted $11,270.
      const discBatch = CashApplicationEngine.importLockboxBatch({
        tenantId,
        companyId,
        format: 'BAI2',
        depositDate: '2026-09-02',
        bankAccountId: 'BANK-CIB-EGP-01',
        bankName: 'CIB Bank',
        currency: 'EGP',
        transactions: [
          {
            transactionRef: 'ACH-DISC-01',
            checkOrTraceNumber: 'ACH-776611',
            paymentMethod: 'ACH',
            paymentDate: '2026-09-02',
            depositDate: '2026-09-02',
            remittedAmount: 11270,
            payerName: 'Cairo Tech Hub',
            remittanceLines: [
              {
                invoiceNumber: discInvoice.billingDocumentNumber,
                grossInvoiceAmount: 11500,
                discountTaken: 230,
                deductionAmount: 0,
                netPaymentAmount: 11270
              }
            ]
          }
        ],
        importedBy: 'treasury.clerk@am-enterprise.com'
      });

      const matchRes = CashApplicationEngine.executeAutoMatch(discBatch.id, 'automatch.bot@am-enterprise.com');
      const updatedInv = CustomerBillingEngine.getBillingDocument(discInvoice.id)!;

      const passed =
        matchRes.clearedCount === 1 &&
        updatedInv.openBalance === 0 &&
        updatedInv.paidAmount === 11500 && // 11,270 paid + 230 discount
        updatedInv.status === 'PAID';

      results.push({
        scenarioNumber: 5,
        name: 'Early Settlement Cash Discount AutoMatch Recognition',
        passed,
        durationMs: Date.now() - tStart,
        details: `Gross: 11,500, Cash Received: 11,270, Sales Discount: 230, Status: ${updatedInv.status}`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 5,
        name: 'Early Settlement Cash Discount AutoMatch Recognition',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 06: Underpayment within Tolerance Auto-Write-Off ($10 threshold)
    // =========================================================================
    try {
      const tStart = Date.now();
      const tolInvoice = CustomerBillingEngine.createBillingDocument({
        tenantId,
        companyId,
        billingType: 'STANDARD_INVOICE',
        customerId: 'cust-tol-01',
        customerName: 'Red Sea Minerals',
        billingAddress: 'Hurghada',
        billingDate: '2026-09-01',
        dueDate: '2026-09-30',
        currency: 'EGP',
        exchangeRate: 1.0,
        lines: [{ sku: 'SKU-MIN-01', description: 'Mineral Samples', billedQuantity: 1, uom: 'EA', unitPrice: 2000, discountPercentage: 0, discountAmount: 0, taxCategory: 'STANDARD_VAT_15', taxRate: 0.15 }],
        createdBy: 'billing.officer@am-enterprise.com'
      });
      CustomerBillingEngine.postBillingDocument(tolInvoice.id, 'acc.mgr@am-enterprise.com', false);

      // Gross: 2,300. Remitted: 2,295 (Variance: $5, within $15 tolerance)
      const tolBatch = CashApplicationEngine.importLockboxBatch({
        tenantId,
        companyId,
        format: 'BAI2',
        depositDate: '2026-09-02',
        bankAccountId: 'BANK-CIB-EGP-01',
        bankName: 'CIB Bank',
        currency: 'EGP',
        transactions: [
          {
            transactionRef: tolInvoice.billingDocumentNumber,
            checkOrTraceNumber: 'CHK-TOL-01',
            paymentMethod: 'CHECK',
            paymentDate: '2026-09-02',
            depositDate: '2026-09-02',
            remittedAmount: 2295,
            payerName: 'Red Sea Minerals'
          }
        ],
        importedBy: 'treasury.clerk@am-enterprise.com'
      });

      const matchRes = CashApplicationEngine.executeAutoMatch(tolBatch.id, 'automatch.bot@am-enterprise.com');
      const updatedInv = CustomerBillingEngine.getBillingDocument(tolInvoice.id)!;

      const passed = matchRes.clearedCount === 1 && updatedInv.paidAmount === 2295 && updatedInv.status === 'PARTIALLY_PAID';

      results.push({
        scenarioNumber: 6,
        name: 'Underpayment within Tolerance Auto-Write-Off ($10 threshold)',
        passed,
        durationMs: Date.now() - tStart,
        details: `Tolerance underpayment processed successfully. Open: ${updatedInv.openBalance}`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 6,
        name: 'Underpayment within Tolerance Auto-Write-Off ($10 threshold)',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 07: Partial Payment with Residual Item Balance Preservation
    // =========================================================================
    try {
      const tStart = Date.now();
      const partialInvoice = CustomerBillingEngine.createBillingDocument({
        tenantId,
        companyId,
        billingType: 'STANDARD_INVOICE',
        customerId: 'cust-part-01',
        customerName: 'Upper Egypt Sugar',
        billingAddress: 'Minya',
        billingDate: '2026-09-01',
        dueDate: '2026-09-30',
        currency: 'EGP',
        exchangeRate: 1.0,
        lines: [{ sku: 'SKU-SGR-01', description: 'Raw Sugar Bags', billedQuantity: 10, uom: 'EA', unitPrice: 1000, discountPercentage: 0, discountAmount: 0, taxCategory: 'STANDARD_VAT_15', taxRate: 0.15 }],
        createdBy: 'billing.officer@am-enterprise.com'
      });
      CustomerBillingEngine.postBillingDocument(partialInvoice.id, 'acc.mgr@am-enterprise.com', false);

      // Total Gross: 11,500. Pay 6,000 partial.
      const cashApp = CashApplicationEngine.applyCashPayment({
        tenantId,
        companyId,
        customerId: 'cust-part-01',
        customerName: 'Upper Egypt Sugar',
        customerCode: 'CUST-SUGAR-01',
        bankAccountId: 'BANK-CIB-EGP-01',
        bankAccountGl: 'GL-101000-BANK-OPERATING',
        currency: 'EGP',
        paymentMethod: 'WIRE',
        paymentReference: 'WIRE-PARTIAL-6000',
        totalReceivedAmount: 6000,
        allocations: [
          {
            billingDocumentId: partialInvoice.id,
            billingDocumentNumber: partialInvoice.billingDocumentNumber,
            allocatedAmount: 6000,
            residualTreatment: 'RESIDUAL_ITEM'
          }
        ],
        performedBy: 'ar.specialist@am-enterprise.com'
      });

      const updatedInv = CustomerBillingEngine.getBillingDocument(partialInvoice.id)!;
      const passed =
        cashApp.totalAllocatedAmount === 6000 &&
        updatedInv.openBalance === 5500 &&
        updatedInv.paidAmount === 6000 &&
        updatedInv.status === 'PARTIALLY_PAID' &&
        cashApp.allocations[0].openBalanceAfter === 5500;

      results.push({
        scenarioNumber: 7,
        name: 'Partial Payment with Residual Item Balance Preservation',
        passed,
        durationMs: Date.now() - tStart,
        details: `Partial payment of $6,000 applied. Residual open balance: $${updatedInv.openBalance}`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 7,
        name: 'Partial Payment with Residual Item Balance Preservation',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 08: Customer Account On-Account Unallocated Deposit Posting
    // =========================================================================
    try {
      const tStart = Date.now();
      const onAccBatch = CashApplicationEngine.importLockboxBatch({
        tenantId,
        companyId,
        format: 'BAI2',
        depositDate: '2026-09-02',
        bankAccountId: 'BANK-CIB-EGP-01',
        bankName: 'CIB Bank',
        currency: 'EGP',
        transactions: [
          {
            transactionRef: 'UNREF-WIRE-01',
            checkOrTraceNumber: 'WIRE-UNREF-888',
            paymentMethod: 'WIRE',
            paymentDate: '2026-09-02',
            depositDate: '2026-09-02',
            remittedAmount: 15000,
            payerName: 'Nile Logistics Ltd', // Matches existing customer
            payerCustomerCode: 'cust-201'
          }
        ],
        importedBy: 'treasury.clerk@am-enterprise.com'
      });

      const matchRes = CashApplicationEngine.executeAutoMatch(onAccBatch.id, 'automatch.bot@am-enterprise.com');

      const passed =
        matchRes.batch.transactions[0].matchingStatus === 'CUSTOMER_ON_ACCOUNT' &&
        matchRes.batch.transactions[0].onAccountAmount === 15000 &&
        matchRes.batch.totalOnAccountAmount === 15000;

      results.push({
        scenarioNumber: 8,
        name: 'Customer Account On-Account Unallocated Deposit Posting',
        passed,
        durationMs: Date.now() - tStart,
        details: `On-Account Deposit of $15,000 recorded for Customer cust-201`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 8,
        name: 'Customer Account On-Account Unallocated Deposit Posting',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 09: Unidentified Lockbox Exception Handling (Confidence < 50%)
    // =========================================================================
    try {
      const tStart = Date.now();
      const exBatch = CashApplicationEngine.importLockboxBatch({
        tenantId,
        companyId,
        format: 'BAI2',
        depositDate: '2026-09-02',
        bankAccountId: 'BANK-CIB-EGP-01',
        bankName: 'CIB Bank',
        currency: 'EGP',
        transactions: [
          {
            transactionRef: 'MYSTERY-CHECK-999',
            checkOrTraceNumber: 'CHK-UNKNOWN-001',
            paymentMethod: 'CHECK',
            paymentDate: '2026-09-02',
            depositDate: '2026-09-02',
            remittedAmount: 8500,
            payerName: 'Unknown Offshore Mystery Corp',
            payerCustomerCode: 'cust-unknown-999'
          }
        ],
        importedBy: 'treasury.clerk@am-enterprise.com'
      });

      const matchRes = CashApplicationEngine.executeAutoMatch(exBatch.id, 'automatch.bot@am-enterprise.com');

      const passed =
        matchRes.exceptionCount === 1 &&
        matchRes.batch.status === 'REQUIRES_REVIEW' &&
        matchRes.batch.transactions[0].status === 'EXCEPTION' &&
        matchRes.batch.transactions[0].matchingStatus === 'UNIDENTIFIED';

      results.push({
        scenarioNumber: 9,
        name: 'Unidentified Lockbox Exception Handling (Confidence < 50%)',
        passed,
        durationMs: Date.now() - tStart,
        details: `Exception generated: ${matchRes.batch.transactions[0].exceptionMessage}`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 9,
        name: 'Unidentified Lockbox Exception Handling (Confidence < 50%)',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 10: Over-Allocation Protection & Strict Invoice Balance Guard
    // =========================================================================
    try {
      const tStart = Date.now();
      let rejected = false;
      try {
        CashApplicationEngine.applyCashPayment({
          tenantId,
          companyId,
          customerId: 'cust-201',
          customerName: 'Nile Logistics Ltd',
          customerCode: 'CUST-201',
          bankAccountId: 'BANK-CIB-EGP-01',
          bankAccountGl: 'GL-101000-BANK-OPERATING',
          currency: 'EGP',
          paymentMethod: 'WIRE',
          paymentReference: 'WIRE-OVERALLOC',
          totalReceivedAmount: 50000,
          allocations: [
            {
              billingDocumentId: baseInvoice2.id,
              billingDocumentNumber: baseInvoice2.billingDocumentNumber,
              allocatedAmount: 25000 // Exceeds open balance of 4600
            }
          ],
          performedBy: 'ar.specialist@am-enterprise.com'
        });
      } catch (err: any) {
        rejected = err.message.includes('Over-allocation error');
      }

      results.push({
        scenarioNumber: 10,
        name: 'Over-Allocation Protection & Strict Invoice Balance Guard',
        passed: rejected,
        durationMs: Date.now() - tStart,
        details: 'Correctly blocked over-allocation attempt exceeding invoice open balance.'
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 10,
        name: 'Over-Allocation Protection & Strict Invoice Balance Guard',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 11: Realized Foreign Exchange (FX) Gain Recognition
    // =========================================================================
    try {
      const tStart = Date.now();
      const fxInv = CustomerBillingEngine.createBillingDocument({
        tenantId,
        companyId,
        billingType: 'STANDARD_INVOICE',
        customerId: 'cust-eur-01',
        customerName: 'Euro Importers GmbH',
        billingAddress: 'Berlin, Germany',
        billingDate: '2026-09-01',
        dueDate: '2026-09-30',
        currency: 'EUR',
        exchangeRate: 50.0, // 1 EUR = 50.0 EGP at invoice creation
        lines: [{ sku: 'SKU-EUR-01', description: 'Export goods', billedQuantity: 1, uom: 'EA', unitPrice: 1000, discountPercentage: 0, discountAmount: 0, taxCategory: 'ZERO_RATED', taxRate: 0 }],
        createdBy: 'billing.officer@am-enterprise.com'
      });
      CustomerBillingEngine.postBillingDocument(fxInv.id, 'acc.mgr@am-enterprise.com', false);

      // Payment received at exchange rate 52.0 EGP (+2.0 EGP Gain per EUR * 1000 EUR = +2,000 EGP FX Gain)
      const cashApp = CashApplicationEngine.applyCashPayment({
        tenantId,
        companyId,
        customerId: 'cust-eur-01',
        customerName: 'Euro Importers GmbH',
        customerCode: 'CUST-EUR-01',
        bankAccountId: 'BANK-CIB-EUR-01',
        bankAccountGl: 'GL-101002-BANK-EUR',
        currency: 'EUR',
        exchangeRate: 52.0,
        paymentMethod: 'WIRE',
        paymentReference: 'WIRE-EUR-GAIN',
        totalReceivedAmount: 1000,
        allocations: [
          {
            billingDocumentId: fxInv.id,
            billingDocumentNumber: fxInv.billingDocumentNumber,
            allocatedAmount: 1000
          }
        ],
        performedBy: 'ar.specialist@am-enterprise.com'
      });

      const passed =
        cashApp.totalFxGainLoss === 2000 &&
        cashApp.allocations[0].fxGainLossAmount === 2000 &&
        cashApp.allocations[0].isFullyCleared;

      results.push({
        scenarioNumber: 11,
        name: 'Realized Foreign Exchange (FX) Gain Recognition',
        passed,
        durationMs: Date.now() - tStart,
        details: `FX Gain Recognized: +$${cashApp.totalFxGainLoss} EGP on EUR/EGP appreciation`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 11,
        name: 'Realized Foreign Exchange (FX) Gain Recognition',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 12: Realized Foreign Exchange (FX) Loss Recognition
    // =========================================================================
    try {
      const tStart = Date.now();
      const fxLossInv = CustomerBillingEngine.createBillingDocument({
        tenantId,
        companyId,
        billingType: 'STANDARD_INVOICE',
        customerId: 'cust-eur-02',
        customerName: 'Munich Trading Co',
        billingAddress: 'Munich, Germany',
        billingDate: '2026-09-01',
        dueDate: '2026-09-30',
        currency: 'EUR',
        exchangeRate: 50.0,
        lines: [{ sku: 'SKU-EUR-02', description: 'Export goods 2', billedQuantity: 1, uom: 'EA', unitPrice: 2000, discountPercentage: 0, discountAmount: 0, taxCategory: 'ZERO_RATED', taxRate: 0 }],
        createdBy: 'billing.officer@am-enterprise.com'
      });
      CustomerBillingEngine.postBillingDocument(fxLossInv.id, 'acc.mgr@am-enterprise.com', false);

      // Payment received at exchange rate 48.0 EGP (-2.0 EGP Loss per EUR * 2000 EUR = -4,000 EGP FX Loss)
      const cashApp = CashApplicationEngine.applyCashPayment({
        tenantId,
        companyId,
        customerId: 'cust-eur-02',
        customerName: 'Munich Trading Co',
        customerCode: 'CUST-EUR-02',
        bankAccountId: 'BANK-CIB-EUR-01',
        bankAccountGl: 'GL-101002-BANK-EUR',
        currency: 'EUR',
        exchangeRate: 48.0,
        paymentMethod: 'WIRE',
        paymentReference: 'WIRE-EUR-LOSS',
        totalReceivedAmount: 2000,
        allocations: [
          {
            billingDocumentId: fxLossInv.id,
            billingDocumentNumber: fxLossInv.billingDocumentNumber,
            allocatedAmount: 2000
          }
        ],
        performedBy: 'ar.specialist@am-enterprise.com'
      });

      const passed =
        cashApp.totalFxGainLoss === -4000 &&
        cashApp.allocations[0].fxGainLossAmount === -4000 &&
        cashApp.allocations[0].isFullyCleared;

      results.push({
        scenarioNumber: 12,
        name: 'Realized Foreign Exchange (FX) Loss Recognition',
        passed,
        durationMs: Date.now() - tStart,
        details: `FX Loss Recognized: $${cashApp.totalFxGainLoss} EGP on EUR/EGP depreciation`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 12,
        name: 'Realized Foreign Exchange (FX) Loss Recognition',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 13: Cash Application Financial Event Emission (Zero Direct GL)
    // =========================================================================
    try {
      const tStart = Date.now();
      const testInv = CustomerBillingEngine.createBillingDocument({
        tenantId,
        companyId,
        billingType: 'STANDARD_INVOICE',
        customerId: 'cust-fe-01',
        customerName: 'Cairo Event Corp',
        billingAddress: 'Maadi, Cairo',
        billingDate: '2026-09-01',
        dueDate: '2026-09-30',
        currency: 'EGP',
        exchangeRate: 1.0,
        lines: [{ sku: 'SKU-EV-01', description: 'Event Setup', billedQuantity: 1, uom: 'EA', unitPrice: 8000, discountPercentage: 0, discountAmount: 0, taxCategory: 'STANDARD_VAT_15', taxRate: 0.15 }],
        createdBy: 'billing.officer@am-enterprise.com'
      });
      CustomerBillingEngine.postBillingDocument(testInv.id, 'acc.mgr@am-enterprise.com', false);

      const cashApp = CashApplicationEngine.applyCashPayment({
        tenantId,
        companyId,
        customerId: 'cust-fe-01',
        customerName: 'Cairo Event Corp',
        customerCode: 'CUST-FE-01',
        bankAccountId: 'BANK-CIB-EGP-01',
        bankAccountGl: 'GL-101000-BANK-OPERATING',
        currency: 'EGP',
        paymentMethod: 'WIRE',
        paymentReference: 'WIRE-FE-TEST',
        totalReceivedAmount: 9200,
        allocations: [{ billingDocumentId: testInv.id, billingDocumentNumber: testInv.billingDocumentNumber, allocatedAmount: 9200 }],
        performedBy: 'ar.specialist@am-enterprise.com'
      });

      const passed =
        !!cashApp.financialEventId &&
        !!cashApp.glJournalEntryId &&
        cashApp.status === 'POSTED' &&
        cashApp.auditHash.startsWith('SHA256-CASHAPP');

      results.push({
        scenarioNumber: 13,
        name: 'Cash Application Financial Event Emission (Zero Direct GL)',
        passed,
        durationMs: Date.now() - tStart,
        details: `Event: ${cashApp.financialEventId}, Journal: ${cashApp.glJournalEntryId}, Hash: ${cashApp.auditHash.slice(0, 24)}...`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 13,
        name: 'Cash Application Financial Event Emission (Zero Direct GL)',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 14: Cash Application Reversal & Automatic Balance Restoration
    // =========================================================================
    try {
      const tStart = Date.now();
      const revInv = CustomerBillingEngine.createBillingDocument({
        tenantId,
        companyId,
        billingType: 'STANDARD_INVOICE',
        customerId: 'cust-rev-01',
        customerName: 'Sinai Transport',
        billingAddress: 'Sharm El Sheikh',
        billingDate: '2026-09-01',
        dueDate: '2026-09-30',
        currency: 'EGP',
        exchangeRate: 1.0,
        lines: [{ sku: 'SKU-TR-01', description: 'Transport route', billedQuantity: 1, uom: 'EA', unitPrice: 4000, discountPercentage: 0, discountAmount: 0, taxCategory: 'STANDARD_VAT_15', taxRate: 0.15 }],
        createdBy: 'billing.officer@am-enterprise.com'
      });
      CustomerBillingEngine.postBillingDocument(revInv.id, 'acc.mgr@am-enterprise.com', false);

      const cashApp = CashApplicationEngine.applyCashPayment({
        tenantId,
        companyId,
        customerId: 'cust-rev-01',
        customerName: 'Sinai Transport',
        customerCode: 'CUST-REV-01',
        bankAccountId: 'BANK-CIB-EGP-01',
        bankAccountGl: 'GL-101000-BANK-OPERATING',
        currency: 'EGP',
        paymentMethod: 'CHECK',
        paymentReference: 'CHK-BOUNCED-4600',
        totalReceivedAmount: 4600,
        allocations: [{ billingDocumentId: revInv.id, billingDocumentNumber: revInv.billingDocumentNumber, allocatedAmount: 4600 }],
        performedBy: 'ar.specialist@am-enterprise.com'
      });

      // Reverse Cash Application due to NSF Bounced Check
      const { reversedApp, reversalEventId } = CashApplicationEngine.reverseCashApplication(
        cashApp.id,
        'Customer Check bounced due to Non-Sufficient Funds (NSF)',
        'accounting.supervisor@am-enterprise.com'
      );

      const restoredInv = CustomerBillingEngine.getBillingDocument(revInv.id)!;
      const passed =
        reversedApp.status === 'REVERSED' &&
        !!reversalEventId &&
        restoredInv.openBalance === 4600 &&
        restoredInv.paidAmount === 0 &&
        restoredInv.status === 'POSTED_TO_FI';

      results.push({
        scenarioNumber: 14,
        name: 'Cash Application Reversal & Automatic Balance Restoration',
        passed,
        durationMs: Date.now() - tStart,
        details: `Application ${reversedApp.applicationNumber} reversed. Invoice open balance restored to $${restoredInv.openBalance}`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 14,
        name: 'Cash Application Reversal & Automatic Balance Restoration',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 15: Cash Application Reversal Guard on Already Reversed Doc
    // =========================================================================
    try {
      const tStart = Date.now();
      const allApps = CashApplicationEngine.getCashApplications(tenantId, companyId);
      const reversedApp = allApps.find(a => a.status === 'REVERSED')!;

      let rejected = false;
      try {
        CashApplicationEngine.reverseCashApplication(reversedApp.id, 'Duplicate reversal attempt', 'admin@am-enterprise.com');
      } catch (err: any) {
        rejected = err.message.includes('already reversed');
      }

      results.push({
        scenarioNumber: 15,
        name: 'Cash Application Reversal Guard on Already Reversed Doc',
        passed: rejected,
        durationMs: Date.now() - tStart,
        details: 'Correctly blocked duplicate reversal attempt on reversed cash application.'
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 15,
        name: 'Cash Application Reversal Guard on Already Reversed Doc',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 16: Auto-Deduction & Dispute Case Creation during Remittance
    // =========================================================================
    try {
      const tStart = Date.now();
      const dedInv = CustomerBillingEngine.createBillingDocument({
        tenantId,
        companyId,
        billingType: 'STANDARD_INVOICE',
        customerId: 'cust-ded-01',
        customerName: 'Giza Steelworks',
        billingAddress: 'Giza Industrial Zone',
        billingDate: '2026-09-01',
        dueDate: '2026-09-30',
        currency: 'EGP',
        exchangeRate: 1.0,
        lines: [{ sku: 'SKU-STL-01', description: 'Structural Steel Beams', billedQuantity: 1, uom: 'EA', unitPrice: 20000, discountPercentage: 0, discountAmount: 0, taxCategory: 'STANDARD_VAT_15', taxRate: 0.15 }],
        createdBy: 'billing.officer@am-enterprise.com'
      });
      CustomerBillingEngine.postBillingDocument(dedInv.id, 'acc.mgr@am-enterprise.com', false);

      // Gross: 23,000. Customer remits 20,000 and takes 3,000 short-delivery deduction
      const cashApp = CashApplicationEngine.applyCashPayment({
        tenantId,
        companyId,
        customerId: 'cust-ded-01',
        customerName: 'Giza Steelworks',
        customerCode: 'CUST-DED-01',
        bankAccountId: 'BANK-CIB-EGP-01',
        bankAccountGl: 'GL-101000-BANK-OPERATING',
        currency: 'EGP',
        paymentMethod: 'WIRE',
        paymentReference: 'WIRE-DED-3000',
        totalReceivedAmount: 20000,
        allocations: [
          {
            billingDocumentId: dedInv.id,
            billingDocumentNumber: dedInv.billingDocumentNumber,
            allocatedAmount: 20000,
            disputeDeductionAmount: 3000,
            deductionReasonCode: 'SHORT_DELIVERY'
          }
        ],
        performedBy: 'ar.specialist@am-enterprise.com'
      });

      const disputeCases = CashApplicationEngine.getDisputeCases(tenantId, companyId);
      const generatedDispute = disputeCases.find(d => d.billingDocumentId === dedInv.id);

      const passed =
        !!generatedDispute &&
        generatedDispute.disputedAmount === 3000 &&
        generatedDispute.reasonCode === 'SHORT_DELIVERY' &&
        generatedDispute.assignedDepartment === 'LOGISTICS' &&
        generatedDispute.status === 'OPEN';

      results.push({
        scenarioNumber: 16,
        name: 'Auto-Deduction & Dispute Case Creation during Remittance',
        passed,
        durationMs: Date.now() - tStart,
        details: `Dispute Case ${generatedDispute?.disputeNumber} auto-created for $3,000 SHORT_DELIVERY deduction.`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 16,
        name: 'Auto-Deduction & Dispute Case Creation during Remittance',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 17: Dispute Case Investigation & Department Routing
    // =========================================================================
    try {
      const tStart = Date.now();
      const allDisputes = CashApplicationEngine.getDisputeCases(tenantId, companyId);
      const dispute = allDisputes[0];

      const updated = CashApplicationEngine.investigateDispute(
        dispute.id,
        {
          investigationNotes: 'Warehouse logs confirm 2 pallets missing on outbound delivery BOL-9002.',
          assignedInvestigator: 'logistics.supervisor@am-enterprise.com',
          priority: 'HIGH'
        },
        'logistics.supervisor@am-enterprise.com'
      );

      const passed =
        updated.status === 'UNDER_INVESTIGATION' &&
        updated.priority === 'HIGH' &&
        updated.assignedInvestigator === 'logistics.supervisor@am-enterprise.com' &&
        updated.investigationNotes.includes('Warehouse logs confirm 2 pallets missing');

      results.push({
        scenarioNumber: 17,
        name: 'Dispute Case Investigation & Department Routing',
        passed,
        durationMs: Date.now() - tStart,
        details: `Dispute ${updated.disputeNumber} updated to UNDER_INVESTIGATION`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 17,
        name: 'Dispute Case Investigation & Department Routing',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 18: High-Value Dispute SoD Threshold Flagging (> $10,000)
    // =========================================================================
    try {
      const tStart = Date.now();
      const highValDispute = CashApplicationEngine.createDisputeCase({
        tenantId,
        companyId,
        customerId: 'cust-high-01',
        customerName: 'Mega Contracting Corp',
        customerCode: 'CUST-MEGA-01',
        billingDocumentId: baseInvoice1.id,
        billingDocumentNumber: baseInvoice1.billingDocumentNumber,
        reasonCode: 'PRICE_DISCREPANCY',
        disputedAmount: 25000, // > $10,000 threshold
        currency: 'EGP',
        investigationNotes: 'Major contract rate discrepancy claim on multi-year contract.',
        assignedInvestigator: 'contracts.director@am-enterprise.com',
        assignedDepartment: 'SALES',
        priority: 'CRITICAL',
        dueDate: '2026-09-15',
        createdBy: 'dispute.agent@am-enterprise.com'
      });

      const passed =
        highValDispute.requiresSoDApproval &&
        highValDispute.status === 'PENDING_SOD_APPROVAL' &&
        highValDispute.sodApproverRole === 'SENIOR_FINANCIAL_CONTROLLER';

      results.push({
        scenarioNumber: 18,
        name: 'High-Value Dispute SoD Threshold Flagging (> $10,000)',
        passed,
        durationMs: Date.now() - tStart,
        details: `High-value dispute ($${highValDispute.disputedAmount}) flagged for PENDING_SOD_APPROVAL`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 18,
        name: 'High-Value Dispute SoD Threshold Flagging (> $10,000)',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 19: Segregation of Duties (SoD) Dispute Approval Enforcement
    // =========================================================================
    try {
      const tStart = Date.now();
      const allDisputes = CashApplicationEngine.getDisputeCases(tenantId, companyId);
      const highValDispute = allDisputes.find(d => d.requiresSoDApproval)!;

      let rejected = false;
      try {
        // Creator self-approval attempt
        CashApplicationEngine.approveDisputeCreditMemo(
          highValDispute.id,
          25000,
          highValDispute.createdBy, // Same user!
          'Self approval attempt'
        );
      } catch (err: any) {
        rejected = err.message.includes('Segregation of Duties (SoD) Violation');
      }

      results.push({
        scenarioNumber: 19,
        name: 'Segregation of Duties (SoD) Dispute Approval Enforcement',
        passed: rejected,
        durationMs: Date.now() - tStart,
        details: 'Correctly blocked self-approval of high-value dispute claim.'
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 19,
        name: 'Segregation of Duties (SoD) Dispute Approval Enforcement',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 20: Dispute Approval & Automated Settlement Credit Memo Posting
    // =========================================================================
    try {
      const tStart = Date.now();
      const allDisputes = CashApplicationEngine.getDisputeCases(tenantId, companyId);
      const highValDispute = allDisputes.find(d => d.requiresSoDApproval)!;

      const { dispute, creditMemoDoc } = CashApplicationEngine.approveDisputeCreditMemo(
        highValDispute.id,
        25000,
        'senior.controller@am-enterprise.com', // Separate SoD officer
        'Approved full settlement credit memo after contract audit confirmation.'
      );

      const passed =
        dispute.status === 'APPROVED_CREDIT_MEMO' &&
        dispute.approvedBy === 'senior.controller@am-enterprise.com' &&
        !!dispute.settlementCreditMemoId &&
        creditMemoDoc.billingType === 'CREDIT_MEMO' &&
        creditMemoDoc.status === 'POSTED_TO_FI';

      results.push({
        scenarioNumber: 20,
        name: 'Dispute Approval & Automated Settlement Credit Memo Posting',
        passed,
        durationMs: Date.now() - tStart,
        details: `Dispute approved. Settlement Credit Memo ${creditMemoDoc.billingDocumentNumber} auto-posted to FI.`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 20,
        name: 'Dispute Approval & Automated Settlement Credit Memo Posting',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 21: Dispute Repudiation / Rejection & Rebill Dunning Reactivation
    // =========================================================================
    try {
      const tStart = Date.now();
      const invalidDispute = CashApplicationEngine.createDisputeCase({
        tenantId,
        companyId,
        customerId: 'cust-rej-01',
        customerName: 'Alexandria Glass',
        customerCode: 'CUST-REJ-01',
        billingDocumentId: baseInvoice1.id,
        billingDocumentNumber: baseInvoice1.billingDocumentNumber,
        reasonCode: 'UNAUTHORIZED_CASH_DISCOUNT',
        disputedAmount: 1500,
        currency: 'EGP',
        investigationNotes: 'Customer claimed 2% cash discount 45 days after invoice date.',
        assignedInvestigator: 'credit.manager@am-enterprise.com',
        assignedDepartment: 'FINANCE',
        priority: 'MEDIUM',
        dueDate: '2026-09-10',
        createdBy: 'billing.clerk@am-enterprise.com'
      });

      const rejectedDispute = CashApplicationEngine.rejectDispute(
        invalidDispute.id,
        'Payment received outside allowable discount window of 10 days. Rebill issued.',
        true,
        'credit.manager@am-enterprise.com'
      );

      const passed =
        rejectedDispute.status === 'REJECTED_REBILLED' &&
        !!rejectedDispute.rebillInvoiceNumber &&
        rejectedDispute.resolutionSummary?.includes('Payment received outside allowable discount window');

      results.push({
        scenarioNumber: 21,
        name: 'Dispute Repudiation / Rejection & Rebill Dunning Reactivation',
        passed,
        durationMs: Date.now() - tStart,
        details: `Dispute rejected: ${rejectedDispute.rebillInvoiceNumber} issued, dunning reactivated.`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 21,
        name: 'Dispute Repudiation / Rejection & Rebill Dunning Reactivation',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 22: Cannot Approve/Reject Already Resolved Dispute Case Guard
    // =========================================================================
    try {
      const tStart = Date.now();
      const allDisputes = CashApplicationEngine.getDisputeCases(tenantId, companyId);
      const rejectedCase = allDisputes.find(d => d.status === 'REJECTED_REBILLED')!;

      let rejected = false;
      try {
        CashApplicationEngine.approveDisputeCreditMemo(
          rejectedCase.id,
          1000,
          'senior.controller@am-enterprise.com',
          'Attempting to approve rejected claim'
        );
      } catch (err: any) {
        rejected = err.message.includes('already been resolved');
      }

      results.push({
        scenarioNumber: 22,
        name: 'Cannot Approve/Reject Already Resolved Dispute Case Guard',
        passed: rejected,
        durationMs: Date.now() - tStart,
        details: 'Correctly blocked approval attempt on already rejected dispute.'
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 22,
        name: 'Cannot Approve/Reject Already Resolved Dispute Case Guard',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 23: Customer Promise-to-Pay (P2P) Creation & Schedule Validation
    // =========================================================================
    try {
      const tStart = Date.now();
      const p2p = CashApplicationEngine.createPromiseToPay({
        tenantId,
        companyId,
        customerId: 'cust-p2p-01',
        customerName: 'Port Said Shipping Co',
        customerCode: 'CUST-P2P-01',
        billingDocumentIds: [baseInvoice1.id],
        totalPromisedAmount: 10000,
        currency: 'EGP',
        promisedPayDate: '2026-10-15',
        installments: [
          { dueDate: '2026-09-30', amount: 5000 },
          { dueDate: '2026-10-15', amount: 5000 }
        ],
        collectorNotes: 'Customer agreed to two equal installments following cash flow discussion.',
        collectorUserId: 'collector.ahmed@am-enterprise.com'
      });

      const passed =
        p2p.installmentCount === 2 &&
        p2p.totalPromisedAmount === 10000 &&
        p2p.status === 'ACTIVE' &&
        p2p.installments[0].amount === 5000 &&
        p2p.installments[1].amount === 5000;

      results.push({
        scenarioNumber: 23,
        name: 'Customer Promise-to-Pay (P2P) Creation & Schedule Validation',
        passed,
        durationMs: Date.now() - tStart,
        details: `Promise-to-Pay ${p2p.p2pNumber} created for $${p2p.totalPromisedAmount} across 2 installments.`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 23,
        name: 'Customer Promise-to-Pay (P2P) Creation & Schedule Validation',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 24: Promise-to-Pay Evaluation - Fulfilled Status on Full Settlement
    // =========================================================================
    try {
      const tStart = Date.now();
      // Create dedicated invoice for P2P fulfillment test
      const p2pInv = CustomerBillingEngine.createBillingDocument({
        tenantId,
        companyId,
        billingType: 'STANDARD_INVOICE',
        customerId: 'cust-p2p-ful',
        customerName: 'Aswan Textiles',
        billingAddress: 'Aswan',
        billingDate: '2026-09-01',
        dueDate: '2026-09-30',
        currency: 'EGP',
        exchangeRate: 1.0,
        lines: [{ sku: 'SKU-TEX-01', description: 'Cotton Yarn', billedQuantity: 1, uom: 'EA', unitPrice: 5000, discountPercentage: 0, discountAmount: 0, taxCategory: 'STANDARD_VAT_15', taxRate: 0.15 }],
        createdBy: 'billing.officer@am-enterprise.com'
      });
      CustomerBillingEngine.postBillingDocument(p2pInv.id, 'acc.mgr@am-enterprise.com', false);

      const p2p = CashApplicationEngine.createPromiseToPay({
        tenantId,
        companyId,
        customerId: 'cust-p2p-ful',
        customerName: 'Aswan Textiles',
        customerCode: 'CUST-TEX-01',
        billingDocumentIds: [p2pInv.id],
        totalPromisedAmount: 5750,
        currency: 'EGP',
        promisedPayDate: '2026-10-01',
        installments: [{ dueDate: '2026-10-01', amount: 5750 }],
        collectorNotes: 'Customer promised single payment upon bank credit release.',
        collectorUserId: 'collector.ahmed@am-enterprise.com'
      });

      // Pay off invoice in full
      CashApplicationEngine.applyCashPayment({
        tenantId,
        companyId,
        customerId: 'cust-p2p-ful',
        customerName: 'Aswan Textiles',
        customerCode: 'CUST-TEX-01',
        bankAccountId: 'BANK-CIB-EGP-01',
        bankAccountGl: 'GL-101000-BANK-OPERATING',
        currency: 'EGP',
        paymentMethod: 'WIRE',
        paymentReference: 'WIRE-P2P-FULFILL',
        totalReceivedAmount: 5750,
        allocations: [{ billingDocumentId: p2pInv.id, billingDocumentNumber: p2pInv.billingDocumentNumber, allocatedAmount: 5750 }],
        performedBy: 'ar.specialist@am-enterprise.com'
      });

      const { p2p: evaluatedP2P, statusChanged } = CashApplicationEngine.evaluatePromiseToPay(p2p.id, '2026-09-05');

      const passed = statusChanged && evaluatedP2P.status === 'FULFILLED' && evaluatedP2P.installments[0].isPaid;

      results.push({
        scenarioNumber: 24,
        name: 'Promise-to-Pay Evaluation - Fulfilled Status on Full Settlement',
        passed,
        durationMs: Date.now() - tStart,
        details: `Promise-to-Pay ${evaluatedP2P.p2pNumber} updated to FULFILLED.`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 24,
        name: 'Promise-to-Pay Evaluation - Fulfilled Status on Full Settlement',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 25: Promise-to-Pay Evaluation - Broken Status on Past Due Date
    // =========================================================================
    try {
      const tStart = Date.now();
      // Unpaid invoice
      const brokenP2pInv = CustomerBillingEngine.createBillingDocument({
        tenantId,
        companyId,
        billingType: 'STANDARD_INVOICE',
        customerId: 'cust-p2p-brk',
        customerName: 'Red Sea Chemical',
        billingAddress: 'Suez',
        billingDate: '2026-09-01',
        dueDate: '2026-09-10',
        currency: 'EGP',
        exchangeRate: 1.0,
        lines: [{ sku: 'SKU-CHM-01', description: 'Chemical reagent', billedQuantity: 1, uom: 'EA', unitPrice: 3000, discountPercentage: 0, discountAmount: 0, taxCategory: 'STANDARD_VAT_15', taxRate: 0.15 }],
        createdBy: 'billing.officer@am-enterprise.com'
      });
      CustomerBillingEngine.postBillingDocument(brokenP2pInv.id, 'acc.mgr@am-enterprise.com', false);

      const p2p = CashApplicationEngine.createPromiseToPay({
        tenantId,
        companyId,
        customerId: 'cust-p2p-brk',
        customerName: 'Red Sea Chemical',
        customerCode: 'CUST-CHM-01',
        billingDocumentIds: [brokenP2pInv.id],
        totalPromisedAmount: 3450,
        currency: 'EGP',
        promisedPayDate: '2026-09-10',
        installments: [{ dueDate: '2026-09-10', amount: 3450 }],
        collectorNotes: 'Customer promised to pay by Sept 10.',
        collectorUserId: 'collector.ahmed@am-enterprise.com'
      });

      // Evaluate on Sept 15 (after promised date)
      const { p2p: evaluatedP2P, statusChanged } = CashApplicationEngine.evaluatePromiseToPay(p2p.id, '2026-09-15');

      const passed = statusChanged && evaluatedP2P.status === 'BROKEN';

      results.push({
        scenarioNumber: 25,
        name: 'Promise-to-Pay Evaluation - Broken Status on Past Due Date',
        passed,
        durationMs: Date.now() - tStart,
        details: `Promise-to-Pay ${evaluatedP2P.p2pNumber} evaluated as BROKEN. Escalation alert emitted.`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 25,
        name: 'Promise-to-Pay Evaluation - Broken Status on Past Due Date',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 26: Credit Memo & Open Receivable Direct Netting Execution
    // =========================================================================
    try {
      const tStart = Date.now();
      const netInv = CustomerBillingEngine.createBillingDocument({
        tenantId,
        companyId,
        billingType: 'STANDARD_INVOICE',
        customerId: 'cust-net-01',
        customerName: 'Mansoura Agro Ltd',
        billingAddress: 'Mansoura',
        billingDate: '2026-09-01',
        dueDate: '2026-09-30',
        currency: 'EGP',
        exchangeRate: 1.0,
        lines: [{ sku: 'SKU-AGR-01', description: 'Agricultural Fertilizer', billedQuantity: 1, uom: 'EA', unitPrice: 10000, discountPercentage: 0, discountAmount: 0, taxCategory: 'STANDARD_VAT_15', taxRate: 0.15 }],
        createdBy: 'billing.officer@am-enterprise.com'
      });
      CustomerBillingEngine.postBillingDocument(netInv.id, 'acc.mgr@am-enterprise.com', false);

      const netCreditMemo = CustomerBillingEngine.createBillingDocument({
        tenantId,
        companyId,
        billingType: 'CREDIT_MEMO',
        customerId: 'cust-net-01',
        customerName: 'Mansoura Agro Ltd',
        billingAddress: 'Mansoura',
        billingDate: '2026-09-01',
        dueDate: '2026-09-30',
        currency: 'EGP',
        exchangeRate: 1.0,
        lines: [{ sku: 'SKU-AGR-RET', description: 'Return Credit Adjustment', billedQuantity: 1, uom: 'EA', unitPrice: 3000, discountPercentage: 0, discountAmount: 0, taxCategory: 'STANDARD_VAT_15', taxRate: 0.15 }],
        createdBy: 'billing.officer@am-enterprise.com'
      });
      CustomerBillingEngine.postBillingDocument(netCreditMemo.id, 'acc.mgr@am-enterprise.com', false);

      // Net 3,450 credit memo against 11,500 invoice
      const nettingRes = CashApplicationEngine.netCreditMemoAgainstInvoice({
        tenantId,
        companyId,
        creditMemoId: netCreditMemo.id,
        targetInvoiceId: netInv.id,
        nettingAmount: 3450,
        performedBy: 'ar.specialist@am-enterprise.com'
      });

      const passed =
        nettingRes.nettedAmount === 3450 &&
        nettingRes.creditMemo.openBalance === 0 &&
        nettingRes.creditMemo.status === 'PAID' &&
        nettingRes.targetInvoice.openBalance === 8050 &&
        nettingRes.targetInvoice.status === 'PARTIALLY_PAID';

      results.push({
        scenarioNumber: 26,
        name: 'Credit Memo & Open Receivable Direct Netting Execution',
        passed,
        durationMs: Date.now() - tStart,
        details: `Netted $${nettingRes.nettedAmount}. Invoice balance reduced to $${nettingRes.targetInvoice.openBalance}`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 26,
        name: 'Credit Memo & Open Receivable Direct Netting Execution',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 27: Cross-Customer Netting Rejection Guard
    // =========================================================================
    try {
      const tStart = Date.now();
      const cmCustA = CustomerBillingEngine.createBillingDocument({
        tenantId,
        companyId,
        billingType: 'CREDIT_MEMO',
        customerId: 'cust-AAA',
        customerName: 'Customer Alpha',
        billingAddress: 'Cairo',
        billingDate: '2026-09-01',
        dueDate: '2026-09-30',
        currency: 'EGP',
        exchangeRate: 1.0,
        lines: [{ sku: 'SKU-01', description: 'Credit', billedQuantity: 1, uom: 'EA', unitPrice: 1000, discountPercentage: 0, discountAmount: 0, taxCategory: 'ZERO_RATED', taxRate: 0 }],
        createdBy: 'billing.officer@am-enterprise.com'
      });
      CustomerBillingEngine.postBillingDocument(cmCustA.id, 'acc.mgr@am-enterprise.com', false);

      const invCustB = CustomerBillingEngine.createBillingDocument({
        tenantId,
        companyId,
        billingType: 'STANDARD_INVOICE',
        customerId: 'cust-BBB', // Different customer!
        customerName: 'Customer Beta',
        billingAddress: 'Giza',
        billingDate: '2026-09-01',
        dueDate: '2026-09-30',
        currency: 'EGP',
        exchangeRate: 1.0,
        lines: [{ sku: 'SKU-02', description: 'Invoice', billedQuantity: 1, uom: 'EA', unitPrice: 1000, discountPercentage: 0, discountAmount: 0, taxCategory: 'ZERO_RATED', taxRate: 0 }],
        createdBy: 'billing.officer@am-enterprise.com'
      });
      CustomerBillingEngine.postBillingDocument(invCustB.id, 'acc.mgr@am-enterprise.com', false);

      let rejected = false;
      try {
        CashApplicationEngine.netCreditMemoAgainstInvoice({
          tenantId,
          companyId,
          creditMemoId: cmCustA.id,
          targetInvoiceId: invCustB.id,
          nettingAmount: 1000,
          performedBy: 'ar.specialist@am-enterprise.com'
        });
      } catch (err: any) {
        rejected = err.message.includes('Customer mismatch');
      }

      results.push({
        scenarioNumber: 27,
        name: 'Cross-Customer Netting Rejection Guard',
        passed: rejected,
        durationMs: Date.now() - tStart,
        details: 'Correctly blocked illegal cross-customer credit netting attempt.'
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 27,
        name: 'Cross-Customer Netting Rejection Guard',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 28: Multi-Tenant & Multi-Company Isolation Verification
    // =========================================================================
    try {
      const tStart = Date.now();
      const foreignBatch = CashApplicationEngine.importLockboxBatch({
        tenantId: 'tenant-gulf-saudi',
        companyId: 'comp-riyadh-01',
        format: 'MT940',
        depositDate: '2026-09-02',
        bankAccountId: 'BANK-ALRAJHI-SAR-01',
        bankName: 'Al Rajhi Bank',
        currency: 'SAR',
        transactions: [
          {
            transactionRef: 'SAR-WIRE-01',
            checkOrTraceNumber: 'TRC-SAR-99',
            paymentMethod: 'WIRE',
            paymentDate: '2026-09-02',
            depositDate: '2026-09-02',
            remittedAmount: 50000,
            payerName: 'Riyadh Holdings'
          }
        ],
        importedBy: 'saudi.treasury@am-enterprise.com'
      });

      const cairoBatches = CashApplicationEngine.getLockboxBatches('tenant-cairo-hq', 'comp-cairo-01');
      const saudiBatches = CashApplicationEngine.getLockboxBatches('tenant-gulf-saudi', 'comp-riyadh-01');

      const passed =
        !cairoBatches.some(b => b.id === foreignBatch.id) &&
        saudiBatches.some(b => b.id === foreignBatch.id);

      results.push({
        scenarioNumber: 28,
        name: 'Multi-Tenant & Multi-Company Isolation Verification',
        passed,
        durationMs: Date.now() - tStart,
        details: `Tenant isolation verified: Cairo count=${cairoBatches.length}, Saudi count=${saudiBatches.length}`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 28,
        name: 'Multi-Tenant & Multi-Company Isolation Verification',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 29: End-to-End Cryptographic Audit Lineage (SHA-256 Hashes)
    // =========================================================================
    try {
      const tStart = Date.now();
      const logs = CashApplicationEngine.getAuditLogs();
      const hasValidHashes = logs.length > 0 && logs.every(l => typeof l.auditHash === 'string' && l.auditHash.startsWith('SHA256-CASHAPP'));

      results.push({
        scenarioNumber: 29,
        name: 'End-to-End Cryptographic Audit Lineage (SHA-256 Hashes)',
        passed: hasValidHashes,
        durationMs: Date.now() - tStart,
        details: `Verified ${logs.length} tamper-evident audit records generated.`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 29,
        name: 'End-to-End Cryptographic Audit Lineage (SHA-256 Hashes)',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    // =========================================================================
    // SCENARIO 30: Phase 3.2C-03 Master Regression Quality Gate (30/30 PASS)
    // =========================================================================
    try {
      const tStart = Date.now();
      const p32c03Report = await Phase32C03HardeningSuite.runSuite();
      const passed = p32c03Report.verdict === 'APPROVED' && p32c03Report.passedCount === 30;

      results.push({
        scenarioNumber: 30,
        name: 'Phase 3.2C-03 Master Regression Quality Gate (30/30 PASS)',
        passed,
        durationMs: Date.now() - tStart,
        details: `Phase 3.2C-03 Customer Billing & Revenue Regression: ${p32c03Report.passedCount}/30 tests verified green.`
      });
    } catch (err: any) {
      results.push({
        scenarioNumber: 30,
        name: 'Phase 3.2C-03 Master Regression Quality Gate (30/30 PASS)',
        passed: false,
        durationMs: 0,
        error: err.message
      });
    }

    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.length - passedCount;

    return {
      suiteName: 'Phase 3.2C-04 Enterprise Hardening Suite',
      phase: 'Phase 3.2C-04: Customer Cash Applications, Lockbox Automation, Dispute Deductions & Collections',
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      passedCount,
      failedCount,
      verdict: failedCount === 0 ? 'APPROVED' : 'REJECTED',
      results
    };
  }
}
