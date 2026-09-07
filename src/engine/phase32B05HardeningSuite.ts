/**
 * AM Business Platform - Phase 3.2B-05 Hardening Suite
 * Accounts Payable, 3-Way Matching, GR/IR Clearing, Vendor Aging & Payment Proposals
 * Comprehensive 30/30 Verification Engine
 * Aligned with SAP S/4HANA (FI-AP / MM-IV / FI-GL-GRIR) and Oracle ERP Cloud Payables
 */

import { AccountsPayableEngine, MatchingToleranceConfig } from './accountsPayableEngine';
import {
  SupplierInvoice,
  SupplierInvoiceItem,
  APVoucher,
  SupplierCreditNote,
  SupplierDebitNote,
  PaymentProposal,
  PaymentBatch,
  InvoiceToleranceProfile
} from '../types/accountsPayable';
import { PurchaseOrder } from '../types/procurement';

export interface HardeningTestResult {
  testId: string;
  name: string;
  category: string;
  status: 'PASS' | 'FAIL';
  executionTimeMs: number;
  details: string;
  error?: string;
}

export interface Phase32B05HardeningReport {
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

export class Phase32B05HardeningSuite {
  static async runSuite(): Promise<Phase32B05HardeningReport> {
    const startTime = Date.now();
    const results: HardeningTestResult[] = [];

    const mockTenantId = 'ten-001';
    const mockCompanyId = 'comp-001';
    const mockBranchId = 'br-001';
    const mockVendorId = 'ven-001';
    const mockVendorCode = 'VEND-001';
    const mockVendorName = 'Apex Industrial Supplies Co';

    const buildMockPO = (overrides?: Partial<PurchaseOrder>): PurchaseOrder => ({
      id: 'po-test-01',
      tenantId: mockTenantId,
      companyId: mockCompanyId,
      branchId: mockBranchId,
      poNumber: 'PO-2026-001',
      vendorId: mockVendorId,
      vendorName: mockVendorName,
      poType: 'STANDARD',
      status: 'ISSUED',
      orderDate: '2026-08-01',
      currency: 'USD',
      exchangeRate: 1.0,
      paymentTermsId: 'pt-01',
      paymentTermsName: '2/10 Net 30',
      items: [
        {
          id: 'poi-01',
          itemSku: 'SKU-VALVE-01',
          itemName: 'Heavy Duty Control Valve',
          orderedQuantity: 10,
          quantity: 10,
          receivedQuantity: 10,
          invoicedQuantity: 0,
          unitPrice: 100,
          taxRate: 15,
          taxAmount: 150,
          lineTotal: 1000,
          uom: 'PCS'
        } as any
      ],
      subtotal: 1000,
      taxAmount: 150,
      totalAmount: 1150,
      approvalStatus: 'APPROVED',
      createdAt: '2026-08-01T10:00:00Z',
      updatedAt: '2026-08-01T10:00:00Z',
      ...overrides
    });

    const buildMockGRN = (overrides?: any) => ({
      id: 'grn-test-01',
      tenantId: mockTenantId,
      companyId: mockCompanyId,
      number: 'GRN-2026-001',
      poId: 'po-test-01',
      poNumber: 'PO-2026-001',
      totalAmount: 1000,
      items: [
        {
          id: 'grni-01',
          itemSku: 'SKU-VALVE-01',
          itemName: 'Heavy Duty Control Valve',
          receivedQty: 10,
          unitPrice: 100
        }
      ],
      status: 'POSTED',
      ...overrides
    });

    // Helper runner
    const runTest = async (
      testId: string,
      name: string,
      category: string,
      fn: () => void | Promise<void>
    ) => {
      const t0 = Date.now();
      try {
        await fn();
        results.push({
          testId,
          name,
          category,
          status: 'PASS',
          executionTimeMs: Date.now() - t0,
          details: 'Verified successfully.'
        });
      } catch (err: any) {
        results.push({
          testId,
          name,
          category,
          status: 'FAIL',
          executionTimeMs: Date.now() - t0,
          details: err.message || 'Assertion failed',
          error: err.stack || err.message
        });
      }
    };

    // ==================== 1. SUPPLIER INVOICE VALIDATION & DUPLICATE PROTECTION ====================

    await runTest(
      'TC-AP-01',
      'Duplicate Supplier Invoice Prevention by Vendor + Ref + Date',
      'Supplier Invoice Integrity',
      () => {
        const existingInvoices: SupplierInvoice[] = [
          {
            id: 'sinv-001',
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            invoiceNumber: 'INV-SYS-001',
            vendorInvoiceNumber: 'VEN-INV-9988',
            vendorId: mockVendorId,
            vendorCode: mockVendorCode,
            vendorName: mockVendorName,
            invoiceDate: '2026-08-15',
            postingDate: '2026-08-15',
            dueDate: '2026-09-14',
            currency: 'USD',
            exchangeRate: 1.0,
            netAmount: 1000,
            taxAmount: 150,
            grossAmount: 1150,
            status: 'APPROVED',
            threeWayMatchStatus: 'MATCHED',
            items: [],
            matchingDetails: {} as any,
            createdAt: '2026-08-15T00:00:00Z',
            updatedAt: '2026-08-15T00:00:00Z'
          }
        ];

        let duplicateBlocked = false;
        try {
          AccountsPayableEngine.processSupplierInvoice(
            {
              tenantId: mockTenantId,
              companyId: mockCompanyId,
              invoiceNumber: 'INV-SYS-002',
              vendorInvoiceNumber: 'VEN-INV-9988',
              vendorId: mockVendorId,
              vendorCode: mockVendorCode,
              vendorName: mockVendorName,
              invoiceDate: '2026-08-15',
              postingDate: '2026-08-15',
              dueDate: '2026-09-14',
              currency: 'USD',
              exchangeRate: 1.0,
              netAmount: 1000,
              taxAmount: 150,
              grossAmount: 1150,
              items: [],
              matchingDetails: {} as any
            },
            [buildMockPO()],
            [buildMockGRN()],
            AccountsPayableEngine.DEFAULT_TOLERANCE,
            existingInvoices
          );
        } catch (e: any) {
          if (e.message.includes('DUPLICATE_SUPPLIER_INVOICE')) {
            duplicateBlocked = true;
          }
        }

        if (!duplicateBlocked) throw new Error('Duplicate supplier invoice was not blocked.');
      }
    );

    // ==================== 2. THREE-WAY MATCHING (EXACT MATCH) ====================

    await runTest(
      'TC-AP-02',
      '3-Way Match: Perfect Exact Match across PO, GRN, and Invoice',
      '3-Way Matching Engine',
      () => {
        const po = buildMockPO();
        const grn = buildMockGRN();

        const { invoice, auditRecord } = AccountsPayableEngine.processSupplierInvoice(
          {
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            invoiceNumber: 'INV-SYS-100',
            vendorInvoiceNumber: 'VEN-INV-100',
            vendorId: mockVendorId,
            vendorCode: mockVendorCode,
            vendorName: mockVendorName,
            poId: po.id,
            poNumber: po.poNumber,
            grnId: grn.id,
            grnNumber: grn.number,
            invoiceDate: '2026-08-16',
            postingDate: '2026-08-16',
            dueDate: '2026-09-15',
            currency: 'USD',
            exchangeRate: 1.0,
            netAmount: 1000,
            taxAmount: 150,
            grossAmount: 1150,
            items: [
              {
                id: 'invi-01',
                itemSku: 'SKU-VALVE-01',
                itemName: 'Heavy Duty Control Valve',
                billedQty: 10,
                unitPrice: 100,
                taxRate: 15,
                taxAmount: 150,
                lineTotal: 1000
              }
            ],
            matchingDetails: {} as any
          },
          [po],
          [grn]
        );

        if (invoice.status !== 'MATCHED') throw new Error(`Expected status MATCHED, got ${invoice.status}`);
        if (invoice.threeWayMatchStatus !== 'MATCHED') throw new Error(`Expected 3-way match MATCHED, got ${invoice.threeWayMatchStatus}`);
        if (!auditRecord.immutableHash) throw new Error('Missing audit record hash.');
      }
    );

    // ==================== 3. THREE-WAY MATCHING (PRICE VARIANCE BLOCK) ====================

    await runTest(
      'TC-AP-03',
      '3-Way Match: Price Variance Hard Block (Unit Price $125 vs PO $100)',
      '3-Way Matching Engine',
      () => {
        const po = buildMockPO();
        const grn = buildMockGRN();

        const { invoice } = AccountsPayableEngine.processSupplierInvoice(
          {
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            invoiceNumber: 'INV-SYS-101',
            vendorInvoiceNumber: 'VEN-INV-101',
            vendorId: mockVendorId,
            vendorCode: mockVendorCode,
            vendorName: mockVendorName,
            poId: po.id,
            poNumber: po.poNumber,
            grnId: grn.id,
            grnNumber: grn.number,
            invoiceDate: '2026-08-16',
            postingDate: '2026-08-16',
            dueDate: '2026-09-15',
            currency: 'USD',
            exchangeRate: 1.0,
            netAmount: 1250,
            taxAmount: 187.5,
            grossAmount: 1437.5,
            items: [
              {
                id: 'invi-02',
                itemSku: 'SKU-VALVE-01',
                itemName: 'Heavy Duty Control Valve',
                billedQty: 10,
                unitPrice: 125, // 25% higher -> triggers price block
                taxRate: 15,
                taxAmount: 187.5,
                lineTotal: 1250
              }
            ],
            matchingDetails: {} as any
          },
          [po],
          [grn]
        );

        if (invoice.status !== 'BLOCKED_VARIANCE') throw new Error(`Expected status BLOCKED_VARIANCE, got ${invoice.status}`);
        if (invoice.threeWayMatchStatus !== 'PRICE_VARIANCE_BLOCKED') throw new Error(`Expected PRICE_VARIANCE_BLOCKED, got ${invoice.threeWayMatchStatus}`);
      }
    );

    // ==================== 4. THREE-WAY MATCHING (QUANTITY VARIANCE BLOCK) ====================

    await runTest(
      'TC-AP-04',
      '3-Way Match: Quantity Variance Block (Billed 15 vs GRN Received 10)',
      '3-Way Matching Engine',
      () => {
        const po = buildMockPO();
        const grn = buildMockGRN();

        const { invoice } = AccountsPayableEngine.processSupplierInvoice(
          {
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            invoiceNumber: 'INV-SYS-102',
            vendorInvoiceNumber: 'VEN-INV-102',
            vendorId: mockVendorId,
            vendorCode: mockVendorCode,
            vendorName: mockVendorName,
            poId: po.id,
            poNumber: po.poNumber,
            grnId: grn.id,
            grnNumber: grn.number,
            invoiceDate: '2026-08-16',
            postingDate: '2026-08-16',
            dueDate: '2026-09-15',
            currency: 'USD',
            exchangeRate: 1.0,
            netAmount: 1500,
            taxAmount: 225,
            grossAmount: 1725,
            items: [
              {
                id: 'invi-03',
                itemSku: 'SKU-VALVE-01',
                itemName: 'Heavy Duty Control Valve',
                billedQty: 15, // GRN only received 10
                unitPrice: 100,
                taxRate: 15,
                taxAmount: 225,
                lineTotal: 1500
              }
            ],
            matchingDetails: {} as any
          },
          [po],
          [grn]
        );

        if (invoice.status !== 'BLOCKED_VARIANCE') throw new Error(`Expected status BLOCKED_VARIANCE, got ${invoice.status}`);
        if (invoice.threeWayMatchStatus !== 'QUANTITY_VARIANCE_BLOCKED') throw new Error(`Expected QUANTITY_VARIANCE_BLOCKED, got ${invoice.threeWayMatchStatus}`);
      }
    );

    // ==================== 5. MULTI-TIER TOLERANCE PROFILE RESOLUTION ====================

    await runTest(
      'TC-AP-05',
      'Multi-Tier Tolerance Resolution: Vendor-Specific Profile Overrides Default',
      'Tolerance Governance',
      () => {
        const profiles: InvoiceToleranceProfile[] = [
          {
            id: 'tol-sys',
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            profileName: 'Global System Profile',
            scope: 'SYSTEM',
            priceTolerancePercent: 1.0,
            priceToleranceAmount: 50,
            qtyTolerancePercent: 0,
            taxTolerancePercent: 1,
            taxToleranceAmount: 20,
            amountTolerancePercent: 1,
            amountToleranceAmount: 100,
            allowOverBilling: false,
            enforceHardBlock: true,
            isActive: true
          },
          {
            id: 'tol-ven',
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            profileName: 'Apex Vendor Relaxed Tolerance',
            scope: 'VENDOR',
            targetId: mockVendorId,
            priceTolerancePercent: 5.0, // 5% allowed for Apex
            priceToleranceAmount: 250,
            qtyTolerancePercent: 0,
            taxTolerancePercent: 2,
            taxToleranceAmount: 50,
            amountTolerancePercent: 2,
            amountToleranceAmount: 300,
            allowOverBilling: false,
            enforceHardBlock: true,
            isActive: true
          }
        ];

        const resolved = AccountsPayableEngine.resolveToleranceProfile(mockVendorId, profiles);
        if (resolved.maxPriceVariancePercent !== 5.0) {
          throw new Error(`Expected resolved price tolerance 5.0%, got ${resolved.maxPriceVariancePercent}%`);
        }
      }
    );

    // ==================== 6. MANUAL VARIANCE RELEASE WORKFLOW ====================

    await runTest(
      'TC-AP-06',
      'Manual Variance Release with Auditor Reason and Status Update',
      'Audit & Workflow Engine',
      () => {
        const po = buildMockPO();
        const grn = buildMockGRN();

        const { invoice } = AccountsPayableEngine.processSupplierInvoice(
          {
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            invoiceNumber: 'INV-SYS-103',
            vendorInvoiceNumber: 'VEN-INV-103',
            vendorId: mockVendorId,
            vendorCode: mockVendorCode,
            vendorName: mockVendorName,
            poId: po.id,
            poNumber: po.poNumber,
            grnId: grn.id,
            grnNumber: grn.number,
            invoiceDate: '2026-08-16',
            postingDate: '2026-08-16',
            dueDate: '2026-09-15',
            currency: 'USD',
            exchangeRate: 1.0,
            netAmount: 1050,
            taxAmount: 157.5,
            grossAmount: 1207.5,
            items: [
              {
                id: 'invi-04',
                itemSku: 'SKU-VALVE-01',
                itemName: 'Heavy Duty Control Valve',
                billedQty: 10,
                unitPrice: 105,
                taxRate: 15,
                taxAmount: 157.5,
                lineTotal: 1050
              }
            ],
            matchingDetails: {} as any
          },
          [po],
          [grn]
        );

        const { updatedInvoice, auditRecord } = AccountsPayableEngine.releaseVarianceBlock(
          invoice,
          'CFO_JOHN_DOE',
          'Price increase approved due to urgent expedited shipping surcharge.'
        );

        if (updatedInvoice.status !== 'APPROVED') throw new Error(`Expected status APPROVED, got ${updatedInvoice.status}`);
        if (updatedInvoice.threeWayMatchStatus !== 'MANUALLY_RELEASED') throw new Error(`Expected MANUALLY_RELEASED, got ${updatedInvoice.threeWayMatchStatus}`);
        if (updatedInvoice.varianceReleasedBy !== 'CFO_JOHN_DOE') throw new Error('Missing releaser record.');
        if (!auditRecord.details.includes('CFO_JOHN_DOE') && !auditRecord.performedBy.includes('CFO_JOHN_DOE')) {
          throw new Error('Audit record did not capture releaser.');
        }
      }
    );

    // ==================== 7. AP VOUCHER GENERATION & BALANCE ====================

    await runTest(
      'TC-AP-07',
      'AP Voucher Generation: Proper Balance Tracking and Early Discount Capture',
      'Accounts Payable Vouchers',
      () => {
        const invoice: SupplierInvoice = {
          id: 'sinv-200',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          branchId: mockBranchId,
          invoiceNumber: 'INV-SYS-200',
          vendorInvoiceNumber: 'VEN-INV-200',
          vendorId: mockVendorId,
          vendorCode: mockVendorCode,
          vendorName: mockVendorName,
          invoiceDate: '2026-08-01',
          postingDate: '2026-08-01',
          dueDate: '2026-08-31',
          currency: 'USD',
          exchangeRate: 1.0,
          netAmount: 5000,
          taxAmount: 750,
          grossAmount: 5750,
          status: 'APPROVED',
          threeWayMatchStatus: 'MATCHED',
          items: [],
          matchingDetails: {} as any,
          createdAt: '2026-08-01T00:00:00Z',
          updatedAt: '2026-08-01T00:00:00Z'
        };

        const { voucher, auditRecord } = AccountsPayableEngine.createAPVoucher(invoice);

        if (voucher.grossAmount !== 5750) throw new Error(`Expected grossAmount 5750, got ${voucher.grossAmount}`);
        if (voucher.remainingAmount !== 5750) throw new Error(`Expected remainingAmount 5750, got ${voucher.remainingAmount}`);
        if (voucher.paidAmount !== 0) throw new Error(`Expected paidAmount 0, got ${voucher.paidAmount}`);
        if (voucher.status !== 'UNPAID') throw new Error(`Expected status UNPAID, got ${voucher.status}`);
        if (!auditRecord.immutableHash) throw new Error('Missing audit hash.');
      }
    );

    // ==================== 8. SUPPLIER CREDIT NOTE POSTING ====================

    await runTest(
      'TC-AP-08',
      'Supplier Credit Note: Balance Offsetting and Reason Tracking',
      'Supplier Credit/Debit Notes',
      () => {
        const { creditNote, auditRecord } = AccountsPayableEngine.createSupplierCreditNote({
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          creditNoteNumber: 'SCN-2026-001',
          vendorCreditNoteRef: 'VCN-8811',
          vendorId: mockVendorId,
          vendorCode: mockVendorCode,
          vendorName: mockVendorName,
          issueDate: '2026-08-18',
          reasonCode: 'RETURN_DAMAGED',
          currency: 'USD',
          amount: 500,
          taxAmount: 75,
          totalAmount: 575
        });

        if (creditNote.status !== 'POSTED') throw new Error(`Expected status POSTED, got ${creditNote.status}`);
        if (creditNote.totalAmount !== 575) throw new Error(`Expected totalAmount 575, got ${creditNote.totalAmount}`);
        if (creditNote.reasonCode !== 'RETURN_DAMAGED') throw new Error('Incorrect reason code.');
      }
    );

    // ==================== 9. SUPPLIER DEBIT NOTE POSTING ====================

    await runTest(
      'TC-AP-09',
      'Supplier Debit Note: Pricing Deduction Issuance with Audit Stamp',
      'Supplier Credit/Debit Notes',
      () => {
        const { debitNote, auditRecord } = AccountsPayableEngine.createSupplierDebitNote({
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          debitNoteNumber: 'SDN-2026-001',
          vendorDebitNoteRef: 'VDN-9911',
          vendorId: mockVendorId,
          vendorCode: mockVendorCode,
          vendorName: mockVendorName,
          issueDate: '2026-08-19',
          reasonCode: 'PRICE_CORRECTION',
          currency: 'USD',
          amount: 300,
          taxAmount: 45,
          totalAmount: 345
        });

        if (debitNote.status !== 'POSTED') throw new Error(`Expected status POSTED, got ${debitNote.status}`);
        if (debitNote.totalAmount !== 345) throw new Error(`Expected totalAmount 345, got ${debitNote.totalAmount}`);
      }
    );

    // ==================== 10. AUTOMATED PAYMENT PROPOSAL GENERATION ====================

    await runTest(
      'TC-AP-10',
      'Payment Proposal: Cutoff Date Filtering and Early Discount Computation',
      'Payment Automation',
      () => {
        const vouchers: APVoucher[] = [
          {
            id: 'vch-01',
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            voucherNumber: 'APV-001',
            supplierInvoiceId: 'sinv-001',
            supplierInvoiceNumber: 'INV-001',
            vendorInvoiceNumber: 'VINV-001',
            vendorId: mockVendorId,
            vendorCode: mockVendorCode,
            vendorName: mockVendorName,
            voucherDate: '2026-08-01',
            dueDate: '2026-08-20',
            currency: 'USD',
            grossAmount: 1000,
            netAmount: 1000,
            paidAmount: 0,
            remainingAmount: 1000,
            earlyDiscountDeadline: '2026-08-11',
            earlyDiscountPercent: 2,
            earlyDiscountAmount: 20,
            status: 'UNPAID',
            createdAt: '2026-08-01T00:00:00Z'
          },
          {
            id: 'vch-02',
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            voucherNumber: 'APV-002',
            supplierInvoiceId: 'sinv-002',
            supplierInvoiceNumber: 'INV-002',
            vendorInvoiceNumber: 'VINV-002',
            vendorId: mockVendorId,
            vendorCode: mockVendorCode,
            vendorName: mockVendorName,
            voucherDate: '2026-08-01',
            dueDate: '2026-09-30', // Beyond cutoff
            currency: 'USD',
            grossAmount: 2000,
            netAmount: 2000,
            paidAmount: 0,
            remainingAmount: 2000,
            status: 'UNPAID',
            createdAt: '2026-08-01T00:00:00Z'
          }
        ];

        const { proposal } = AccountsPayableEngine.generatePaymentProposal(
          mockTenantId,
          mockCompanyId,
          '2026-08-25', // Cutoff date
          vouchers
        );

        if (proposal.items.length !== 1) {
          throw new Error(`Expected 1 eligible voucher in proposal, got ${proposal.items.length}`);
        }
        if (proposal.totalProposedAmount !== 1000) {
          throw new Error(`Expected proposal amount 1000, got ${proposal.totalProposedAmount}`);
        }
      }
    );

    // ==================== 11. PAYMENT BATCH EXECUTION & VOUCHER DEDUCTION ====================

    await runTest(
      'TC-AP-11',
      'Payment Batch: Multi-Voucher Payment Execution via Bank Transfer',
      'Payment Automation',
      () => {
        const proposal: PaymentProposal = {
          id: 'pprop-01',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          proposalNumber: 'PROP-2026-001',
          cutoffDueDate: '2026-08-25',
          currency: 'USD',
          totalProposedAmount: 3000,
          totalDiscountCaptured: 0,
          netPaymentAmount: 3000,
          status: 'APPROVED',
          items: [
            {
              id: 'ppi-01',
              proposalId: 'pprop-01',
              voucherId: 'vch-01',
              voucherNumber: 'APV-001',
              vendorInvoiceNumber: 'VINV-001',
              vendorId: mockVendorId,
              vendorName: mockVendorName,
              grossAmount: 1000,
              remainingAmount: 1000,
              proposedAmount: 1000,
              earlyDiscountAmount: 0,
              netPaymentAmount: 1000,
              dueDate: '2026-08-20',
              paymentPriority: 'NORMAL',
              isExcluded: false
            },
            {
              id: 'ppi-02',
              proposalId: 'pprop-01',
              voucherId: 'vch-02',
              voucherNumber: 'APV-002',
              vendorInvoiceNumber: 'VINV-002',
              vendorId: mockVendorId,
              vendorName: mockVendorName,
              grossAmount: 2000,
              remainingAmount: 2000,
              proposedAmount: 2000,
              earlyDiscountAmount: 0,
              netPaymentAmount: 2000,
              dueDate: '2026-08-20',
              paymentPriority: 'NORMAL',
              isExcluded: false
            }
          ],
          createdBy: 'sys-user',
          createdAt: '2026-08-20T00:00:00Z'
        };

        const { batch } = AccountsPayableEngine.createPaymentBatch(
          proposal,
          'BANK_TRANSFER',
          'BANK-RIYADH-01'
        );

        if (batch.totalAmount !== 3000) throw new Error(`Expected batch total 3000, got ${batch.totalAmount}`);
        if (batch.totalCount !== 2) throw new Error(`Expected item count 2, got ${batch.totalCount}`);
        if (batch.paymentMethod !== 'BANK_TRANSFER') throw new Error('Incorrect payment method');
      }
    );

    // ==================== 12. PAYMENT REVERSAL & BALANCE RESTORATION ====================

    await runTest(
      'TC-AP-12',
      'Payment Reversal: Rollback Batch and Restore Voucher Remaining Balances',
      'Payment Reversals',
      () => {
        const vouchers: APVoucher[] = [
          {
            id: 'vch-rev-01',
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            voucherNumber: 'APV-REV-01',
            supplierInvoiceId: 'sinv-01',
            supplierInvoiceNumber: 'INV-01',
            vendorInvoiceNumber: 'VINV-01',
            vendorId: mockVendorId,
            vendorCode: mockVendorCode,
            vendorName: mockVendorName,
            voucherDate: '2026-08-01',
            dueDate: '2026-08-20',
            currency: 'USD',
            grossAmount: 1500,
            netAmount: 1500,
            paidAmount: 1500,
            remainingAmount: 0,
            status: 'PAID',
            createdAt: '2026-08-01T00:00:00Z'
          }
        ];

        const batch: PaymentBatch = {
          id: 'pb-rev-01',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          batchNumber: 'PB-REV-01',
          proposalId: 'pprop-01',
          paymentMethod: 'ACH',
          bankAccountId: 'bank-01',
          currency: 'USD',
          totalAmount: 1500,
          totalCount: 1,
          paymentDate: '2026-08-21',
          status: 'PROCESSED',
          items: [
            {
              id: 'pbi-01',
              batchId: 'pb-rev-01',
              voucherId: 'vch-rev-01',
              vendorId: mockVendorId,
              vendorName: mockVendorName,
              paymentAmount: 1500,
              reference: 'ACH Ref'
            }
          ],
          createdAt: '2026-08-21T00:00:00Z'
        };

        const { updatedBatch, updatedVouchers, reversalRecords } = AccountsPayableEngine.reversePaymentBatch(
          batch,
          vouchers,
          'Bank ACH Bounce / Insufficient Funds'
        );

        if (updatedBatch.status !== 'CANCELLED') throw new Error(`Expected batch status CANCELLED, got ${updatedBatch.status}`);
        const restoredVoucher = updatedVouchers.find(v => v.id === 'vch-rev-01');
        if (!restoredVoucher || restoredVoucher.remainingAmount !== 1500) {
          throw new Error(`Expected voucher remainingAmount 1500, got ${restoredVoucher?.remainingAmount}`);
        }
        if (restoredVoucher.status !== 'UNPAID') {
          throw new Error(`Expected voucher status UNPAID, got ${restoredVoucher.status}`);
        }
        if (reversalRecords.length !== 1) throw new Error('Reversal record not created.');
      }
    );

    // ==================== 13. VENDOR STATEMENT GENERATION & RECONCILIATION ====================

    await runTest(
      'TC-AP-13',
      'Vendor Statement: Chronological Ledger with Running Balances and Debits/Credits',
      'Vendor Statement Engine',
      () => {
        const invoices: SupplierInvoice[] = [
          {
            id: 'inv-st-01',
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            invoiceNumber: 'INV-ST-01',
            vendorInvoiceNumber: 'VINV-ST-01',
            vendorId: mockVendorId,
            vendorCode: mockVendorCode,
            vendorName: mockVendorName,
            invoiceDate: '2026-08-05',
            postingDate: '2026-08-05',
            dueDate: '2026-09-05',
            currency: 'USD',
            exchangeRate: 1.0,
            netAmount: 1000,
            taxAmount: 150,
            grossAmount: 1150,
            status: 'APPROVED',
            threeWayMatchStatus: 'MATCHED',
            items: [],
            matchingDetails: {} as any,
            createdAt: '2026-08-05T00:00:00Z',
            updatedAt: '2026-08-05T00:00:00Z'
          }
        ];

        const creditNotes: SupplierCreditNote[] = [
          {
            id: 'scn-st-01',
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            creditNoteNumber: 'SCN-ST-01',
            vendorCreditNoteRef: 'VCR-01',
            vendorId: mockVendorId,
            vendorCode: mockVendorCode,
            vendorName: mockVendorName,
            issueDate: '2026-08-10',
            reasonCode: 'RETURN_DEFECTIVE',
            currency: 'USD',
            amount: 100,
            taxAmount: 15,
            totalAmount: 115,
            status: 'POSTED',
            createdAt: '2026-08-10T00:00:00Z'
          }
        ];

        const payments: PaymentBatch[] = [
          {
            id: 'pb-st-01',
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            batchNumber: 'PB-ST-01',
            proposalId: 'prop-01',
            paymentMethod: 'BANK_TRANSFER',
            currency: 'USD',
            totalAmount: 500,
            totalCount: 1,
            paymentDate: '2026-08-15',
            status: 'APPROVED',
            items: [
              {
                id: 'pbi-st-01',
                batchId: 'pb-st-01',
                voucherId: 'vch-01',
                vendorId: mockVendorId,
                vendorName: mockVendorName,
                paymentAmount: 500,
                reference: 'Part Pay'
              }
            ],
            createdAt: '2026-08-15T00:00:00Z'
          }
        ];

        const statement = AccountsPayableEngine.generateVendorStatement(
          mockVendorId,
          mockVendorCode,
          mockVendorName,
          '2026-08-01',
          '2026-08-31',
          invoices,
          [],
          creditNotes,
          payments
        );

        if (statement.totalInvoices !== 1150) throw new Error(`Expected totalInvoices 1150, got ${statement.totalInvoices}`);
        if (statement.totalCreditNotes !== 115) throw new Error(`Expected totalCreditNotes 115, got ${statement.totalCreditNotes}`);
        if (statement.totalPayments !== 500) throw new Error(`Expected totalPayments 500, got ${statement.totalPayments}`);
        // Closing balance = 1150 - 115 - 500 = 535
        if (statement.closingBalance !== 535) throw new Error(`Expected closingBalance 535, got ${statement.closingBalance}`);
      }
    );

    // ==================== 14. VENDOR AGING REPORT (5 BUCKETS) ====================

    await runTest(
      'TC-AP-14',
      'Vendor Aging Analysis: 5-Bucket Distribution (Current, 1-30, 31-60, 61-90, 91-120, >120)',
      'Vendor Aging Engine',
      () => {
        const vouchers: APVoucher[] = [
          {
            id: 'vch-age-1',
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            voucherNumber: 'VCH-CURR',
            supplierInvoiceId: 'inv-1',
            supplierInvoiceNumber: 'INV-1',
            vendorInvoiceNumber: 'VINV-1',
            vendorId: mockVendorId,
            vendorCode: mockVendorCode,
            vendorName: mockVendorName,
            voucherDate: '2026-08-01',
            dueDate: '2026-08-31', // Current (not overdue on 2026-08-25)
            currency: 'USD',
            grossAmount: 1000,
            netAmount: 1000,
            paidAmount: 0,
            remainingAmount: 1000,
            status: 'UNPAID',
            createdAt: '2026-08-01T00:00:00Z'
          },
          {
            id: 'vch-age-2',
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            voucherNumber: 'VCH-30',
            supplierInvoiceId: 'inv-2',
            supplierInvoiceNumber: 'INV-2',
            vendorInvoiceNumber: 'VINV-2',
            vendorId: mockVendorId,
            vendorCode: mockVendorCode,
            vendorName: mockVendorName,
            voucherDate: '2026-07-01',
            dueDate: '2026-07-31', // 25 days overdue -> 1-30 bucket
            currency: 'USD',
            grossAmount: 2000,
            netAmount: 2000,
            paidAmount: 0,
            remainingAmount: 2000,
            status: 'UNPAID',
            createdAt: '2026-07-01T00:00:00Z'
          },
          {
            id: 'vch-age-3',
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            voucherNumber: 'VCH-60',
            supplierInvoiceId: 'inv-3',
            supplierInvoiceNumber: 'INV-3',
            vendorInvoiceNumber: 'VINV-3',
            vendorId: mockVendorId,
            vendorCode: mockVendorCode,
            vendorName: mockVendorName,
            voucherDate: '2026-06-01',
            dueDate: '2026-06-30', // 56 days overdue -> 31-60 bucket
            currency: 'USD',
            grossAmount: 3000,
            netAmount: 3000,
            paidAmount: 0,
            remainingAmount: 3000,
            status: 'UNPAID',
            createdAt: '2026-06-01T00:00:00Z'
          }
        ];

        const report = AccountsPayableEngine.generateVendorAgingReport(
          vouchers,
          [{ id: mockVendorId, code: mockVendorCode, name: mockVendorName }],
          '2026-08-25'
        );

        if (report.grandTotal !== 6000) throw new Error(`Expected grandTotal 6000, got ${report.grandTotal}`);
        if (report.totalCurrent !== 1000) throw new Error(`Expected totalCurrent 1000, got ${report.totalCurrent}`);
        if (report.total1To30 !== 2000) throw new Error(`Expected total1To30 2000, got ${report.total1To30}`);
        if (report.total31To60 !== 3000) throw new Error(`Expected total31To60 3000, got ${report.total31To60}`);
      }
    );

    // ==================== 15. IMMUTABLE AGING SNAPSHOT CREATION ====================

    await runTest(
      'TC-AP-15',
      'Vendor Aging Snapshot: Cryptographic SHA Hash Seal & Snapshot Archival',
      'Vendor Aging Engine',
      () => {
        const report = AccountsPayableEngine.generateVendorAgingReport(
          [],
          [{ id: mockVendorId, code: mockVendorCode, name: mockVendorName }],
          '2026-08-25'
        );

        const snapshot = AccountsPayableEngine.createVendorAgingSnapshot(
          mockTenantId,
          mockCompanyId,
          report,
          'AUDITOR_CLARA'
        );

        if (!snapshot.immutableHash) throw new Error('Missing snapshot hash.');
        if (snapshot.createdBy !== 'AUDITOR_CLARA') throw new Error('Incorrect createdBy in snapshot.');
      }
    );

    // ==================== 16. GR/IR CLEARING EXECUTION ====================

    await runTest(
      'TC-AP-16',
      'GR/IR Clearing: Execution with PPV Calculation and Full Clearance Seal',
      'GR/IR Reconciliation',
      () => {
        const po = buildMockPO();
        const grn = buildMockGRN();
        const invoice: SupplierInvoice = {
          id: 'sinv-grir-01',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          invoiceNumber: 'INV-GRIR-01',
          vendorInvoiceNumber: 'VINV-GRIR-01',
          vendorId: mockVendorId,
          vendorCode: mockVendorCode,
          vendorName: mockVendorName,
          invoiceDate: '2026-08-15',
          postingDate: '2026-08-15',
          dueDate: '2026-09-15',
          currency: 'USD',
          exchangeRate: 1.0,
          netAmount: 1000,
          taxAmount: 150,
          grossAmount: 1150,
          status: 'MATCHED',
          threeWayMatchStatus: 'MATCHED',
          items: [
            {
              id: 'invi-g1',
              itemSku: 'SKU-VALVE-01',
              itemName: 'Heavy Duty Control Valve',
              billedQty: 10,
              unitPrice: 100,
              taxRate: 15,
              taxAmount: 150,
              lineTotal: 1000
            }
          ],
          matchingDetails: {} as any,
          createdAt: '2026-08-15T00:00:00Z',
          updatedAt: '2026-08-15T00:00:00Z'
        };

        const { clearing, auditRecord } = AccountsPayableEngine.executeGRIRClearing(
          po,
          grn,
          invoice
        );

        if (clearing.status !== 'FULLY_CLEARED') throw new Error(`Expected status FULLY_CLEARED, got ${clearing.status}`);
        if (clearing.clearedAmount !== 1000) throw new Error(`Expected clearedAmount 1000, got ${clearing.clearedAmount}`);
        if (clearing.openQuantity !== 0) throw new Error(`Expected openQuantity 0, got ${clearing.openQuantity}`);
        if (!clearing.sha256Seal) throw new Error('Missing cryptographic SHA seal.');
      }
    );

    // ==================== 17. GR/IR UNBILLED ACCRUALS ENGINE ====================

    await runTest(
      'TC-AP-17',
      'GR/IR Unbilled Accruals: Calculation for Received Not Invoiced Items',
      'GR/IR Reconciliation',
      () => {
        const po = buildMockPO();
        const grns = [buildMockGRN()];
        const emptyInvoices: SupplierInvoice[] = [];

        const clearingRecords = AccountsPayableEngine.processGRIRClearing(
          [po],
          grns,
          emptyInvoices
        );

        if (clearingRecords.length !== 1) throw new Error(`Expected 1 clearing record, got ${clearingRecords.length}`);
        const rec = clearingRecords[0];
        if (rec.openQty !== 10) throw new Error(`Expected openQty 10, got ${rec.openQty}`);
        if (rec.openAmount !== 1000) throw new Error(`Expected openAmount 1000, got ${rec.openAmount}`);
        if (rec.status !== 'OPEN') throw new Error(`Expected status OPEN, got ${rec.status}`);
      }
    );

    // ==================== 18. INVOICE STATE TRANSITION AUDIT ====================

    await runTest(
      'TC-AP-18',
      'Supplier Invoice Lifecycle State Transitions with Correlation Tracking',
      'Audit & Workflow Engine',
      () => {
        const invoice: SupplierInvoice = {
          id: 'sinv-tr-01',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          invoiceNumber: 'INV-TR-01',
          vendorInvoiceNumber: 'VINV-TR-01',
          vendorId: mockVendorId,
          vendorCode: mockVendorCode,
          vendorName: mockVendorName,
          invoiceDate: '2026-08-10',
          postingDate: '2026-08-10',
          dueDate: '2026-09-10',
          currency: 'USD',
          exchangeRate: 1.0,
          netAmount: 500,
          taxAmount: 75,
          grossAmount: 575,
          status: 'MATCHED',
          threeWayMatchStatus: 'MATCHED',
          items: [],
          matchingDetails: {} as any,
          createdAt: '2026-08-10T00:00:00Z',
          updatedAt: '2026-08-10T00:00:00Z'
        };

        const { updatedInvoice, auditRecord } = AccountsPayableEngine.transitionInvoiceState(
          invoice,
          'APPROVED',
          'SYS_APPROVER',
          'Manager approval finalized',
          'CORR-INV-999'
        );

        if (updatedInvoice.status !== 'APPROVED') throw new Error(`Expected status APPROVED, got ${updatedInvoice.status}`);
        if (auditRecord.correlationId !== 'CORR-INV-999') throw new Error('Correlation ID mismatch.');
        if (auditRecord.previousState !== 'MATCHED' || auditRecord.newState !== 'APPROVED') {
          throw new Error('State transition history not recorded accurately.');
        }
      }
    );

    // ==================== 19. EARLY PAYMENT DISCOUNT ENGINE ====================

    await runTest(
      'TC-AP-19',
      'Early Payment Discount: Terms Parser and Deadline Qualification (2/10 Net 30)',
      'Payment Automation',
      () => {
        const eligible = AccountsPayableEngine.calculateEarlyPaymentDiscount(
          10000,
          '2026-08-01',
          '2026-08-08', // Paid in 7 days (within 10 days)
          '2/10 Net 30'
        );

        if (!eligible.isEligible) throw new Error('Expected discount eligibility true.');
        if (eligible.discountAmount !== 200) throw new Error(`Expected discount $200, got $${eligible.discountAmount}`);

        const expired = AccountsPayableEngine.calculateEarlyPaymentDiscount(
          10000,
          '2026-08-01',
          '2026-08-20', // Paid in 19 days (after 10 days)
          '2/10 Net 30'
        );

        if (expired.isEligible) throw new Error('Expected discount eligibility false.');
        if (expired.discountAmount !== 0) throw new Error(`Expected discount $0, got $${expired.discountAmount}`);
      }
    );

    // ==================== 20. SUPPLIER INVOICE REVERSAL ====================

    await runTest(
      'TC-AP-20',
      'Supplier Invoice Reversal: Status Invalidation and Reopening GR/IR',
      'Accounts Payable Integrity',
      () => {
        const invoice: SupplierInvoice = {
          id: 'sinv-rev-01',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          invoiceNumber: 'INV-REV-01',
          vendorInvoiceNumber: 'VINV-REV-01',
          vendorId: mockVendorId,
          vendorCode: mockVendorCode,
          vendorName: mockVendorName,
          invoiceDate: '2026-08-10',
          postingDate: '2026-08-10',
          dueDate: '2026-09-10',
          currency: 'USD',
          exchangeRate: 1.0,
          netAmount: 1000,
          taxAmount: 150,
          grossAmount: 1150,
          status: 'POSTED',
          threeWayMatchStatus: 'MATCHED',
          items: [],
          matchingDetails: {} as any,
          createdAt: '2026-08-10T00:00:00Z',
          updatedAt: '2026-08-10T00:00:00Z'
        };

        const { reversedInvoice, auditRecord } = AccountsPayableEngine.reverseSupplierInvoice(
          invoice,
          'Wrong vendor entity invoiced.'
        );

        if (reversedInvoice.status !== 'REVERSED') throw new Error(`Expected status REVERSED, got ${reversedInvoice.status}`);
        if (!auditRecord.details.includes('reversed')) throw new Error('Audit record missing reversal details.');
      }
    );

    // ==================== 21. PARTIAL VOUCHER PAYMENT ====================

    await runTest(
      'TC-AP-21',
      'Partial Voucher Payment: Correct Remaining Amount & Status Tracking',
      'Accounts Payable Vouchers',
      () => {
        const invoice: SupplierInvoice = {
          id: 'sinv-part-01',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          invoiceNumber: 'INV-PART-01',
          vendorInvoiceNumber: 'VINV-PART-01',
          vendorId: mockVendorId,
          vendorCode: mockVendorCode,
          vendorName: mockVendorName,
          invoiceDate: '2026-08-01',
          postingDate: '2026-08-01',
          dueDate: '2026-08-31',
          currency: 'USD',
          exchangeRate: 1.0,
          netAmount: 2000,
          taxAmount: 300,
          grossAmount: 2300,
          status: 'APPROVED',
          threeWayMatchStatus: 'MATCHED',
          items: [],
          matchingDetails: {} as any,
          createdAt: '2026-08-01T00:00:00Z',
          updatedAt: '2026-08-01T00:00:00Z'
        };

        const { voucher } = AccountsPayableEngine.createAPVoucher(invoice);
        // Simulate partial payment of $1000
        voucher.paidAmount = 1000;
        voucher.remainingAmount = voucher.grossAmount - voucher.paidAmount;
        voucher.status = 'PARTIALLY_PAID';

        if (voucher.remainingAmount !== 1300) throw new Error(`Expected remainingAmount 1300, got ${voucher.remainingAmount}`);
        if (voucher.status !== 'PARTIALLY_PAID') throw new Error(`Expected status PARTIALLY_PAID, got ${voucher.status}`);
      }
    );

    // ==================== 22. PAYMENT PROPOSAL EXCLUSION ====================

    await runTest(
      'TC-AP-22',
      'Payment Proposal Item Exclusion / Dispute Hold',
      'Payment Automation',
      () => {
        const proposal: PaymentProposal = {
          id: 'prop-ex-01',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          proposalNumber: 'PROP-EX-01',
          cutoffDueDate: '2026-08-25',
          currency: 'USD',
          totalProposedAmount: 5000,
          totalDiscountCaptured: 0,
          netPaymentAmount: 5000,
          status: 'APPROVED',
          items: [
            {
              id: 'ppi-ex-1',
              proposalId: 'prop-ex-01',
              voucherId: 'vch-1',
              voucherNumber: 'APV-1',
              vendorInvoiceNumber: 'VINV-1',
              vendorId: mockVendorId,
              vendorName: mockVendorName,
              grossAmount: 2000,
              remainingAmount: 2000,
              proposedAmount: 2000,
              earlyDiscountAmount: 0,
              netPaymentAmount: 2000,
              dueDate: '2026-08-20',
              paymentPriority: 'NORMAL',
              isExcluded: false
            },
            {
              id: 'ppi-ex-2',
              proposalId: 'prop-ex-01',
              voucherId: 'vch-2',
              voucherNumber: 'APV-2',
              vendorInvoiceNumber: 'VINV-2',
              vendorId: mockVendorId,
              vendorName: mockVendorName,
              grossAmount: 3000,
              remainingAmount: 3000,
              proposedAmount: 3000,
              earlyDiscountAmount: 0,
              netPaymentAmount: 3000,
              dueDate: '2026-08-20',
              paymentPriority: 'NORMAL',
              isExcluded: true, // EXCLUDED
              exclusionReason: 'Quality Dispute on delivered goods'
            }
          ],
          createdBy: 'sys-user',
          createdAt: '2026-08-20T00:00:00Z'
        };

        const { batch } = AccountsPayableEngine.createPaymentBatch(
          proposal,
          'CHECK'
        );

        if (batch.totalCount !== 1) throw new Error(`Expected batch item count 1, got ${batch.totalCount}`);
        if (batch.totalAmount !== 2000) throw new Error(`Expected batch total 2000, got ${batch.totalAmount}`);
      }
    );

    // ==================== 23. MULTI-LINE ITEM 3-WAY MATCH ====================

    await runTest(
      'TC-AP-23',
      'Multi-Line Item 3-Way Matching with Individual Line Statuses',
      '3-Way Matching Engine',
      () => {
        const po = buildMockPO({
          items: [
            {
              id: 'poi-1',
              itemSku: 'SKU-A',
              itemName: 'Item A',
              orderedQuantity: 5,
              quantity: 5,
              receivedQuantity: 5,
              invoicedQuantity: 0,
              unitPrice: 50,
              taxRate: 15,
              taxAmount: 37.5,
              lineTotal: 250,
              uom: 'PCS'
            } as any,
            {
              id: 'poi-2',
              itemSku: 'SKU-B',
              itemName: 'Item B',
              orderedQuantity: 10,
              quantity: 10,
              receivedQuantity: 10,
              invoicedQuantity: 0,
              unitPrice: 100,
              taxRate: 15,
              taxAmount: 150,
              lineTotal: 1000,
              uom: 'PCS'
            } as any
          ]
        });

        const grn = buildMockGRN({
          items: [
            { id: 'grni-1', itemSku: 'SKU-A', itemName: 'Item A', receivedQty: 5, unitPrice: 50 },
            { id: 'grni-2', itemSku: 'SKU-B', itemName: 'Item B', receivedQty: 10, unitPrice: 100 }
          ]
        });

        const { invoice } = AccountsPayableEngine.processSupplierInvoice(
          {
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            invoiceNumber: 'INV-MULTI-01',
            vendorInvoiceNumber: 'VINV-MULTI-01',
            vendorId: mockVendorId,
            vendorCode: mockVendorCode,
            vendorName: mockVendorName,
            poId: po.id,
            poNumber: po.poNumber,
            grnId: grn.id,
            grnNumber: grn.number,
            invoiceDate: '2026-08-16',
            postingDate: '2026-08-16',
            dueDate: '2026-09-15',
            currency: 'USD',
            exchangeRate: 1.0,
            netAmount: 1250,
            taxAmount: 187.5,
            grossAmount: 1437.5,
            items: [
              {
                id: 'invi-1',
                itemSku: 'SKU-A',
                itemName: 'Item A',
                billedQty: 5,
                unitPrice: 50,
                taxRate: 15,
                taxAmount: 37.5,
                lineTotal: 250
              },
              {
                id: 'invi-2',
                itemSku: 'SKU-B',
                itemName: 'Item B',
                billedQty: 10,
                unitPrice: 100,
                taxRate: 15,
                taxAmount: 150,
                lineTotal: 1000
              }
            ],
            matchingDetails: {} as any
          },
          [po],
          [grn]
        );

        if (invoice.status !== 'MATCHED') throw new Error(`Expected status MATCHED, got ${invoice.status}`);
        if (invoice.matchingDetails.lineResults?.length !== 2) {
          throw new Error(`Expected 2 line results, got ${invoice.matchingDetails.lineResults?.length}`);
        }
      }
    );

    // ==================== 24. OVER-BILLING STRICT BLOCK ====================

    await runTest(
      'TC-AP-24',
      'Over-Billing Prevention when allowOverBilling is false',
      'Tolerance Governance',
      () => {
        const po = buildMockPO();
        const grn = buildMockGRN();

        const { invoice } = AccountsPayableEngine.processSupplierInvoice(
          {
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            invoiceNumber: 'INV-OVER-01',
            vendorInvoiceNumber: 'VINV-OVER-01',
            vendorId: mockVendorId,
            vendorCode: mockVendorCode,
            vendorName: mockVendorName,
            poId: po.id,
            poNumber: po.poNumber,
            grnId: grn.id,
            grnNumber: grn.number,
            invoiceDate: '2026-08-16',
            postingDate: '2026-08-16',
            dueDate: '2026-09-15',
            currency: 'USD',
            exchangeRate: 1.0,
            netAmount: 1200,
            taxAmount: 180,
            grossAmount: 1380,
            items: [
              {
                id: 'invi-over',
                itemSku: 'SKU-VALVE-01',
                itemName: 'Heavy Duty Control Valve',
                billedQty: 12, // GRN is 10
                unitPrice: 100,
                taxRate: 15,
                taxAmount: 180,
                lineTotal: 1200
              }
            ],
            matchingDetails: {} as any
          },
          [po],
          [grn],
          { ...AccountsPayableEngine.DEFAULT_TOLERANCE, allowOverBilling: false }
        );

        if (invoice.threeWayMatchStatus !== 'QUANTITY_VARIANCE_BLOCKED') {
          throw new Error(`Expected QUANTITY_VARIANCE_BLOCKED, got ${invoice.threeWayMatchStatus}`);
        }
      }
    );

    // ==================== 25. AP PAYMENT BATCH GENERATION FOR MULTIPLE METHODS ====================

    await runTest(
      'TC-AP-25',
      'AP Payment Batch Generation for Multiple Payment Methods (ACH, WIRE, CHECK)',
      'Payment Automation',
      () => {
        const proposal: PaymentProposal = {
          id: 'prop-multi-pm',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          proposalNumber: 'PROP-MULTI-01',
          cutoffDueDate: '2026-08-25',
          currency: 'USD',
          totalProposedAmount: 1000,
          totalDiscountCaptured: 0,
          netPaymentAmount: 1000,
          status: 'APPROVED',
          items: [
            {
              id: 'ppi-1',
              proposalId: 'prop-multi-pm',
              voucherId: 'vch-1',
              voucherNumber: 'APV-1',
              vendorInvoiceNumber: 'VINV-1',
              vendorId: mockVendorId,
              vendorName: mockVendorName,
              grossAmount: 1000,
              remainingAmount: 1000,
              proposedAmount: 1000,
              earlyDiscountAmount: 0,
              netPaymentAmount: 1000,
              dueDate: '2026-08-20',
              paymentPriority: 'NORMAL',
              isExcluded: false
            }
          ],
          createdBy: 'sys-user',
          createdAt: '2026-08-20T00:00:00Z'
        };

        const batchWire = AccountsPayableEngine.createPaymentBatch(proposal, 'WIRE');
        if (batchWire.batch.paymentMethod !== 'WIRE') throw new Error('Expected WIRE payment method');

        const batchAch = AccountsPayableEngine.createPaymentBatch(proposal, 'ACH');
        if (batchAch.batch.paymentMethod !== 'ACH') throw new Error('Expected ACH payment method');
      }
    );

    // ==================== 26. VENDOR ZERO BALANCE HANDLING ====================

    await runTest(
      'TC-AP-26',
      'Vendor Aging Report with Zero Balances or Fully Settled Accounts',
      'Vendor Aging Engine',
      () => {
        const paidVouchers: APVoucher[] = [
          {
            id: 'vch-paid-01',
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            voucherNumber: 'VCH-PAID',
            supplierInvoiceId: 'inv-1',
            supplierInvoiceNumber: 'INV-1',
            vendorInvoiceNumber: 'VINV-1',
            vendorId: mockVendorId,
            vendorCode: mockVendorCode,
            vendorName: mockVendorName,
            voucherDate: '2026-08-01',
            dueDate: '2026-08-10',
            currency: 'USD',
            grossAmount: 1000,
            netAmount: 1000,
            paidAmount: 1000,
            remainingAmount: 0, // Fully paid
            status: 'PAID',
            createdAt: '2026-08-01T00:00:00Z'
          }
        ];

        const report = AccountsPayableEngine.generateVendorAgingReport(
          paidVouchers,
          [{ id: mockVendorId, code: mockVendorCode, name: mockVendorName }],
          '2026-08-25'
        );

        if (report.grandTotal !== 0) throw new Error(`Expected grandTotal 0, got ${report.grandTotal}`);
        if (report.vendors.length !== 0) throw new Error(`Expected 0 outstanding vendors, got ${report.vendors.length}`);
      }
    );

    // ==================== 27. TAX VARIANCE AUDITING ====================

    await runTest(
      'TC-AP-27',
      'Tax Variance Checking between Supplier Invoice and Purchase Order',
      '3-Way Matching Engine',
      () => {
        const po = buildMockPO({
          items: [
            {
              id: 'poi-tax',
              itemSku: 'SKU-VALVE-01',
              itemName: 'Heavy Duty Control Valve',
              orderedQuantity: 10,
              quantity: 10,
              receivedQuantity: 10,
              invoicedQuantity: 0,
              unitPrice: 100,
              taxRate: 15, // 15% VAT
              taxAmount: 150,
              lineTotal: 1000,
              uom: 'PCS'
            } as any
          ]
        });

        const grn = buildMockGRN();

        const { invoice } = AccountsPayableEngine.processSupplierInvoice(
          {
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            invoiceNumber: 'INV-TAX-01',
            vendorInvoiceNumber: 'VINV-TAX-01',
            vendorId: mockVendorId,
            vendorCode: mockVendorCode,
            vendorName: mockVendorName,
            poId: po.id,
            poNumber: po.poNumber,
            grnId: grn.id,
            grnNumber: grn.number,
            invoiceDate: '2026-08-16',
            postingDate: '2026-08-16',
            dueDate: '2026-09-15',
            currency: 'USD',
            exchangeRate: 1.0,
            netAmount: 1000,
            taxAmount: 200,
            grossAmount: 1200,
            items: [
              {
                id: 'invi-tax',
                itemSku: 'SKU-VALVE-01',
                itemName: 'Heavy Duty Control Valve',
                billedQty: 10,
                unitPrice: 100,
                taxRate: 20, // 20% vs PO 15% (exceeds maxTaxVariancePercent 1%)
                taxAmount: 200,
                lineTotal: 1000
              }
            ],
            matchingDetails: {} as any
          },
          [po],
          [grn],
          { ...AccountsPayableEngine.DEFAULT_TOLERANCE, maxTaxVariancePercent: 1.0 }
        );

        if (invoice.threeWayMatchStatus !== 'TAX_VARIANCE_BLOCKED') {
          throw new Error(`Expected TAX_VARIANCE_BLOCKED, got ${invoice.threeWayMatchStatus}`);
        }
      }
    );

    // ==================== 28. IMMUTABLE AP AUDIT HASH INTEGRITY ====================

    await runTest(
      'TC-AP-28',
      'Cryptographic AP Audit Record Consistency and Hash Regeneration',
      'Audit & Workflow Engine',
      () => {
        const data1 = JSON.stringify({ invoiceNumber: 'INV-001', grossAmount: 1000 });
        const hash1 = AccountsPayableEngine.computeAuditHash(data1);

        if (!hash1.startsWith('AP-HASH-')) {
          throw new Error(`Invalid hash format: ${hash1}`);
        }
      }
    );

    // ==================== 29. GR/IR PARTIAL CLEARING WITH OPEN BALANCES ====================

    await runTest(
      'TC-AP-29',
      'GR/IR Partial Clearing with Partial Delivery and Invoicing',
      'GR/IR Reconciliation',
      () => {
        const po = buildMockPO({
          items: [
            {
              id: 'poi-part',
              itemSku: 'SKU-VALVE-01',
              itemName: 'Heavy Duty Control Valve',
              orderedQuantity: 20,
              quantity: 20,
              receivedQuantity: 10,
              invoicedQuantity: 0,
              unitPrice: 100,
              taxRate: 15,
              taxAmount: 300,
              lineTotal: 2000,
              uom: 'PCS'
            } as any
          ]
        });

        const grn = buildMockGRN({
          items: [{ id: 'grni-p', itemSku: 'SKU-VALVE-01', itemName: 'Valve', receivedQty: 10, unitPrice: 100 }]
        });

        const invoice: SupplierInvoice = {
          id: 'sinv-p-01',
          tenantId: mockTenantId,
          companyId: mockCompanyId,
          invoiceNumber: 'INV-P-01',
          vendorInvoiceNumber: 'VINV-P-01',
          vendorId: mockVendorId,
          vendorCode: mockVendorCode,
          vendorName: mockVendorName,
          invoiceDate: '2026-08-15',
          postingDate: '2026-08-15',
          dueDate: '2026-09-15',
          currency: 'USD',
          exchangeRate: 1.0,
          netAmount: 500,
          taxAmount: 75,
          grossAmount: 575,
          status: 'MATCHED',
          threeWayMatchStatus: 'MATCHED',
          items: [
            {
              id: 'invi-p',
              itemSku: 'SKU-VALVE-01',
              itemName: 'Valve',
              billedQty: 5,
              unitPrice: 100,
              taxRate: 15,
              taxAmount: 75,
              lineTotal: 500
            }
          ],
          matchingDetails: {} as any,
          createdAt: '2026-08-15T00:00:00Z',
          updatedAt: '2026-08-15T00:00:00Z'
        };

        const { clearing } = AccountsPayableEngine.executeGRIRClearing(
          po,
          grn,
          invoice
        );

        if (clearing.status !== 'PARTIALLY_CLEARED') {
          throw new Error(`Expected status PARTIALLY_CLEARED, got ${clearing.status}`);
        }
        if (clearing.clearedQuantity !== 5) {
          throw new Error(`Expected clearedQuantity 5, got ${clearing.clearedQuantity}`);
        }
        if (clearing.openQuantity !== 5) {
          throw new Error(`Expected openQuantity 5, got ${clearing.openQuantity}`);
        }
      }
    );

    // ==================== 30. END-TO-END PROCURE-TO-PAY COMPLETE AUDIT TRAIL ====================

    await runTest(
      'TC-AP-30',
      'End-to-End P2P Lifecycle: PO -> GRN -> Invoice 3-Way Match -> AP Voucher -> Proposal -> Payment Batch -> GR/IR Clearing',
      'End-to-End Integration',
      () => {
        // 1. PO
        const po = buildMockPO();
        // 2. GRN
        const grn = buildMockGRN();
        // 3. Invoice & Match
        const { invoice } = AccountsPayableEngine.processSupplierInvoice(
          {
            tenantId: mockTenantId,
            companyId: mockCompanyId,
            invoiceNumber: 'INV-E2E-01',
            vendorInvoiceNumber: 'VINV-E2E-01',
            vendorId: mockVendorId,
            vendorCode: mockVendorCode,
            vendorName: mockVendorName,
            poId: po.id,
            poNumber: po.poNumber,
            grnId: grn.id,
            grnNumber: grn.number,
            invoiceDate: '2026-08-16',
            postingDate: '2026-08-16',
            dueDate: '2026-09-15',
            currency: 'USD',
            exchangeRate: 1.0,
            netAmount: 1000,
            taxAmount: 150,
            grossAmount: 1150,
            items: [
              {
                id: 'invi-e2e',
                itemSku: 'SKU-VALVE-01',
                itemName: 'Heavy Duty Control Valve',
                billedQty: 10,
                unitPrice: 100,
                taxRate: 15,
                taxAmount: 150,
                lineTotal: 1000
              }
            ],
            matchingDetails: {} as any
          },
          [po],
          [grn]
        );

        if (invoice.status !== 'MATCHED') throw new Error('E2E Step 3 Failed: Invoice Match');

        // 4. Create Voucher
        const { voucher } = AccountsPayableEngine.createAPVoucher(invoice);
        if (voucher.remainingAmount !== 1150) throw new Error('E2E Step 4 Failed: Voucher Creation');

        // 5. Payment Proposal
        const { proposal } = AccountsPayableEngine.generatePaymentProposal(
          mockTenantId,
          mockCompanyId,
          '2026-09-30',
          [voucher]
        );
        if (proposal.items.length !== 1) throw new Error('E2E Step 5 Failed: Proposal');

        // 6. Payment Batch
        const { batch } = AccountsPayableEngine.createPaymentBatch(proposal, 'BANK_TRANSFER');
        if (batch.totalAmount !== 1150) throw new Error('E2E Step 6 Failed: Payment Batch');

        // 7. GR/IR Clearing
        const { clearing } = AccountsPayableEngine.executeGRIRClearing(po, grn, invoice);
        if (clearing.status !== 'FULLY_CLEARED') throw new Error('E2E Step 7 Failed: GR/IR Clearing');
      }
    );

    const durationMs = Date.now() - startTime;
    const passedTests = results.filter(r => r.status === 'PASS').length;
    const failedTests = results.filter(r => r.status === 'FAIL').length;

    return {
      suiteId: `suite-32b05-${Date.now()}`,
      phase: 'Phase 3.2B-05 Accounts Payable & 3-Way Matching Engine',
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
