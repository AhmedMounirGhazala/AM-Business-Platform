/**
 * AM BUSINESS PLATFORM — PILOT VERIFICATION SUITE
 * TASK P0-02: DYNAMIC TAX RUNTIME BINDING & TAX-TO-ACCOUNTING INTEGRITY
 * 
 * Verifies end-to-end:
 * 1. Authoritative TaxEngine resolution across jurisdictions (KSA 15%, Egypt 14%, UAE 5%, Zero-Rated, Exempt)
 * 2. Effective date transitions (KSA 5% pre-July 2020 vs 15% current)
 * 3. Tax-inclusive vs Tax-exclusive calculation precision
 * 4. Runtime binding in POS, Sales, AR, Procurement, and AP
 * 5. Strict accounting integrity:
 *    - Input VAT Recoverable: DEBIT Account 1040 (Asset), NEVER credit liability
 *    - Output VAT Liability: CREDIT Account 2020 (Liability)
 *    - Balanced journal entries (Debit === Credit) across all postings
 */

import { TaxEngine, TaxRule } from '../src/engine/taxEngine';
import { SalesEngine } from '../src/engine/salesEngine';
import { AccountsReceivableEngine } from '../src/engine/accountsReceivableEngine';
import { CustomerBillingEngine } from '../src/engine/customerBillingEngine';
import { FinancialEventEngine } from '../src/engine/financialEventEngine';
import { PostingRulesEngine } from '../src/engine/postingRulesEngine';
import { Account, PostingRule, JournalEntry, FinancialEvent } from '../src/types';
import { INITIAL_ACCOUNTS, INITIAL_POSTING_RULES, INITIAL_TAX_RULES } from '../src/data/mockDatabase';

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
    results.push({ suite, name, passed: true, details });
    console.log(`✅ [PASS] ${suite} -> ${name}`);
  }
}

async function runDynamicTaxVerification() {
  console.log('\n================================================================');
  console.log('AM ENTERPRISE ERP — TASK P0-02 DYNAMIC TAX RUNTIME BINDING SUITE');
  console.log('================================================================\n');

  // ----------------------------------------------------
  // SUITE 1: Authoritative Multi-Jurisdiction Resolution
  // ----------------------------------------------------
  const suite1 = 'SUITE 1: Multi-Jurisdiction Runtime Resolution';

  // 1.1 KSA Current (15%)
  const ksaRes = TaxEngine.resolveTaxRate({
    countryOrJurisdiction: 'SA',
    transactionDate: '2026-09-01'
  });
  assert(ksaRes.taxRate === 0.15, suite1, 'KSA Current resolves to 15%', `Got ${ksaRes.taxRate}`);
  assert(ksaRes.taxCode === 'VAT15', suite1, 'KSA Current resolves to code VAT15', `Got ${ksaRes.taxCode}`);

  // 1.2 KSA Historical (< 2020-07-01 resolves to 5%)
  const ksaHistRes = TaxEngine.resolveTaxRate({
    countryOrJurisdiction: 'SA',
    transactionDate: '2020-01-15'
  });
  assert(ksaHistRes.taxRate === 0.05, suite1, 'KSA Historical (< 2020-07-01) resolves to 5%', `Got ${ksaHistRes.taxRate}`);
  assert(ksaHistRes.taxCode === 'VAT5' || ksaHistRes.taxCode === 'VAT5_HIST', suite1, 'KSA Historical resolves to code VAT5 or VAT5_HIST', `Got ${ksaHistRes.taxCode}`);

  // 1.3 Egypt Current (14%)
  const egRes = TaxEngine.resolveTaxRate({
    countryOrJurisdiction: 'EG',
    transactionDate: '2026-09-01'
  });
  assert(egRes.taxRate === 0.14, suite1, 'Egypt resolves to 14%', `Got ${egRes.taxRate}`);
  assert(egRes.taxCode === 'VAT14', suite1, 'Egypt resolves to code VAT14', `Got ${egRes.taxCode}`);

  // 1.4 UAE Current (5%)
  const uaeRes = TaxEngine.resolveTaxRate({
    countryOrJurisdiction: 'AE',
    transactionDate: '2026-09-01'
  });
  assert(uaeRes.taxRate === 0.05, suite1, 'UAE resolves to 5%', `Got ${uaeRes.taxRate}`);

  // 1.5 Zero-Rated (0%)
  const zeroRes = TaxEngine.resolveTaxRate({
    countryOrJurisdiction: 'SA',
    taxCategory: 'ZERO_RATED',
    transactionDate: '2026-09-01'
  });
  assert(zeroRes.taxRate === 0.0, suite1, 'Zero-Rated category resolves to 0%', `Got ${zeroRes.taxRate}`);

  // 1.6 Exempt (0%)
  const exemptRes = TaxEngine.resolveTaxRate({
    countryOrJurisdiction: 'SA',
    taxCategory: 'EXEMPT',
    transactionDate: '2026-09-01'
  });
  assert(exemptRes.taxRate === 0.0, suite1, 'Exempt category resolves to 0%', `Got ${exemptRes.taxRate}`);

  // 1.7 Customer Exemption Override
  const custExemptRes = TaxEngine.resolveTaxRate({
    countryOrJurisdiction: 'SA',
    customerTaxExempt: true,
    transactionDate: '2026-09-01'
  });
  assert(custExemptRes.taxRate === 0.0, suite1, 'Customer exemption override resolves to 0% tax', `Got ${custExemptRes.taxRate}`);
  assert(custExemptRes.taxCategory === 'EXEMPT', suite1, 'Customer exemption resolves to EXEMPT category');

  // 1.8 Supplier Exemption Override
  const suppExemptRes = TaxEngine.resolveTaxRate({
    countryOrJurisdiction: 'EG',
    supplierTaxExempt: true,
    transactionDate: '2026-09-01'
  });
  assert(suppExemptRes.taxRate === 0.0, suite1, 'Supplier exemption override resolves to 0% tax in Egypt', `Got ${suppExemptRes.taxRate}`);

  // ----------------------------------------------------
  // SUITE 2: Dynamic Rule Injection & Priority
  // ----------------------------------------------------
  const suite2 = 'SUITE 2: Dynamic Rule Injection & Priority';

  const customRule: TaxRule = {
    id: 'tr-custom-special',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'VAT_SPECIAL_10',
    name: 'Special Economic Zone 10% VAT',
    nameAr: 'ضريبة منطقة اقتصادية خاصة 10%',
    rate: 0.10,
    countryCode: 'SA',
    taxCategory: 'STANDARD',
    taxAccountCode: '2020',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    isActive: true
  };

  const dynamicRes = TaxEngine.resolveTaxRate(
    { countryOrJurisdiction: 'SA', taxCode: 'VAT_SPECIAL_10', transactionDate: '2026-06-01' },
    [customRule, ...INITIAL_TAX_RULES]
  );
  assert(dynamicRes.taxRate === 0.10, suite2, 'Dynamic tax rule with 10% rate is matched and effective', `Got ${dynamicRes.taxRate}`);

  const expiredRes = TaxEngine.resolveTaxRate(
    { countryOrJurisdiction: 'SA', taxCode: 'VAT_SPECIAL_10', transactionDate: '2027-01-01' },
    [customRule, ...INITIAL_TAX_RULES]
  );
  assert(expiredRes.taxRate === 0.15, suite2, 'Expired dynamic tax rule falls back to default active country rule (15%)', `Got ${expiredRes.taxRate}`);

  // ----------------------------------------------------
  // SUITE 3: Tax Calculation Arithmetic (Inclusive vs Exclusive)
  // ----------------------------------------------------
  const suite3 = 'SUITE 3: Tax Calculation Arithmetic';

  // 3.1 Tax-Exclusive: Net = 1,000, Rate = 15% -> Tax = 150, Gross = 1,150
  const lineExcl = TaxEngine.calculateLineTax({
    quantity: 2,
    unitPrice: 500,
    taxRate: 0.15,
    isTaxInclusive: false
  });
  assert(lineExcl.taxAmount === 150, suite3, 'Tax-exclusive line tax is exactly 150', `Got ${lineExcl.taxAmount}`);
  assert(lineExcl.grossAmount === 1150, suite3, 'Tax-exclusive gross amount is exactly 1,150', `Got ${lineExcl.grossAmount}`);
  assert(lineExcl.netAmount === 1000, suite3, 'Tax-exclusive net amount is exactly 1,000');

  // 3.2 Tax-Inclusive: Gross = 1,150, Rate = 15% -> Net = 1,000, Tax = 150
  const lineIncl = TaxEngine.calculateLineTax({
    quantity: 1,
    unitPrice: 1150,
    taxRate: 0.15,
    isTaxInclusive: true
  });
  assert(lineIncl.netAmount === 1000, suite3, 'Tax-inclusive net amount is back-calculated to exactly 1,000', `Got ${lineIncl.netAmount}`);
  assert(lineIncl.taxAmount === 150, suite3, 'Tax-inclusive tax amount is exactly 150', `Got ${lineIncl.taxAmount}`);
  assert(lineIncl.grossAmount === 1150, suite3, 'Tax-inclusive gross amount matches original 1,150', `Got ${lineIncl.grossAmount}`);

  // 3.3 Multi-line document with mixed categories and discounts
  const docCalc = TaxEngine.calculateDocumentTaxes([
    {
      sku: 'SKU-01',
      quantity: 10,
      unitPrice: 100, // 1,000 - 10% = 900
      discountPercent: 10,
      taxCategory: 'STANDARD'
    },
    {
      sku: 'SKU-02',
      quantity: 5,
      unitPrice: 200, // 1,000
      taxCategory: 'ZERO_RATED'
    },
    {
      sku: 'SKU-03',
      quantity: 2,
      unitPrice: 500, // 1,000
      taxCategory: 'EXEMPT'
    }
  ], INITIAL_TAX_RULES, 'VAT15', 0, { countryOrJurisdiction: 'SA' });

  assert(docCalc.netTotal === 2900, suite3, 'Mixed document net total is 2,900', `Got ${docCalc.netTotal}`);
  assert(docCalc.totalTax === 135, suite3, 'Mixed document total tax is 135 (15% on 900 only)', `Got ${docCalc.totalTax}`);
  assert(docCalc.grandTotal === 3035, suite3, 'Mixed document grand total is 3,035', `Got ${docCalc.grandTotal}`);

  // 3.4 Withholding Tax Application (e.g. 5% WHT on subtotal)
  const docWht = TaxEngine.calculateDocumentTaxes([
    {
      sku: 'SKU-SRV-01',
      quantity: 1,
      unitPrice: 10000,
      taxCategory: 'STANDARD'
    }
  ], INITIAL_TAX_RULES, 'VAT15', 5, { countryOrJurisdiction: 'SA' });

  assert(docWht.subtotal === 10000, suite3, 'Subtotal is 10,000');
  assert(docWht.totalTax === 1500, suite3, 'Standard VAT is 1,500');
  assert(docWht.withholdingTaxAmount === 500, suite3, 'Withholding tax is 500 (5% of 10,000)', `Got ${docWht.withholdingTaxAmount}`);
  assert(docWht.grandTotal === 11000, suite3, 'Grand total payable is 11,000 (10,000 + 1,500 - 500 WHT)', `Got ${docWht.grandTotal}`);

  // ----------------------------------------------------
  // SUITE 4: Sales Domain & POS Runtime Binding
  // ----------------------------------------------------
  const suite4 = 'SUITE 4: Sales Domain Runtime Binding';

  // 4.1 POS Receipt calculation via SalesEngine
  const mockRegister: any = {
    id: 'pos-term-01',
    code: 'REG-01',
    name: 'Main Register',
    branchId: 'br-001',
    warehouseId: 'wh-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    currency: 'SAR',
    isActive: true
  };
  const mockShift: any = {
    id: 'shift-001',
    registerId: 'pos-term-01',
    cashierId: 'usr-cashier',
    cashierName: 'Zaid',
    openedAt: new Date().toISOString(),
    status: 'OPEN',
    openingFloat: 500,
    totalCashSales: 0,
    totalCardSales: 0,
    totalWalletSales: 0,
    totalCreditSales: 0,
    totalReturnsAmount: 0,
    totalTransactionsCount: 0,
    totalItemsSoldCount: 0,
    cashMovements: []
  };
  const mockCartLines: any[] = [
    {
      id: 'cart-1',
      itemSku: 'SKU-PHARM-01',
      itemName: 'Medication',
      quantity: 2,
      unitPrice: 100,
      discountAmount: 0,
      discountPercentage: 0,
      originalUnitPrice: 100,
      uom: 'EA',
      taxRate: 0.15,
      taxCode: 'VAT15',
      taxAmount: 30,
      lineTotal: 230
    }
  ];
  const mockPayments: any[] = [{ id: 'pmt-1', method: 'CASH', amount: 230, currency: 'SAR', status: 'COMPLETED', createdAt: new Date().toISOString() }];
  const mockCustomer = { id: 'cust-walkin', name: 'Walk-in Retail Customer', isWalkIn: true };
  const mockCashier = { id: 'usr-cashier', name: 'Zaid' };

  const checkoutRes = SalesEngine.processPOSReceipt(
    mockRegister,
    mockShift,
    mockCartLines,
    mockPayments,
    mockCustomer,
    mockCashier,
    'POS-2026-TEST-001'
  );
  const posSale = checkoutRes.receipt!;

  assert(posSale.taxTotal === 30, suite4, 'POS sale correctly resolves 15% VAT (30 SAR on 200 SAR)', `Got ${posSale.taxTotal}`);
  assert(posSale.grandTotal === 230, suite4, 'POS grand total is 230 SAR', `Got ${posSale.grandTotal}`);

  // 4.2 POS Return with tax reversal
  const mockReturnLines: any[] = [
    {
      itemSku: 'SKU-PHARM-01',
      itemName: 'Medication',
      quantityReturned: 1,
      unitPrice: 100,
      taxRate: 0.15,
      taxAmount: 15,
      refundAmount: 115,
      returnReasonText: 'Damaged item',
      restockWarehouseId: 'wh-001'
    }
  ];
  const posReturn = SalesEngine.processSalesReturn(
    'RET-2026-0001',
    'PARTIAL_RETURN',
    { type: 'POS_RECEIPT', number: posSale.receiptNumber, id: posSale.id },
    mockCustomer,
    mockReturnLines,
    'CASH',
    'usr-cashier'
  );

  assert(posReturn.refundGrandTotal === 115, suite4, 'Sales return correctly calculates 115 refund including 15 tax', `Got ${posReturn.refundGrandTotal}`);

  // 4.3 AR Credit Note tax resolution
  const { creditNote: arCreditNote } = AccountsReceivableEngine.createCreditNote(
    'ten-001',
    'comp-001',
    'cust-001',
    'Test Customer',
    'PRICE_ADJUSTMENT',
    'Volume rebate adjustment',
    2000,
    0.15,
    'INV-001',
    'INV-2026-0001',
    'usr-001'
  );
  assert(arCreditNote.taxAmount === 300, suite4, 'AR Credit note tax amount is 300 (15% on 2,000)', `Got ${arCreditNote.taxAmount}`);
  assert(arCreditNote.totalAmount === 2300, suite4, 'AR Credit note total amount is 2,300', `Got ${arCreditNote.totalAmount}`);

  // ----------------------------------------------------
  // SUITE 5: Tax-to-Accounting Integrity (GL Postings)
  // ----------------------------------------------------
  const suite5 = 'SUITE 5: Tax-to-Accounting Integrity';

  const accounts = [...INITIAL_ACCOUNTS];
  const postingRules = [...INITIAL_POSTING_RULES];
  const journalEntries: JournalEntry[] = [];
  const financialEvents: FinancialEvent[] = [];

  let jeCounter = 1;
  const generateDocNumFn = (_tenantId: string, type: string) => `${type}-2026-${String(jeCounter++).padStart(5, '0')}`;
  const recordAuditFn = () => {};

  // 5.1 PURCHASE INVOICE: Must Debit Account 1040 (TaxReceivable / Input VAT Recoverable)
  // NEVER credit Output VAT Liability
  const purchaseEventResult = FinancialEventEngine.processEvent(
    {
      tenantId: 'ten-001',
      companyId: 'comp-001',
      eventType: 'PURCHASE_INVOICE_POSTED',
      sourceDocumentType: 'PurchaseInvoice',
      sourceDocumentId: 'pi-test-01',
      sourceDocumentNumber: 'PINV-2026-001',
      amount: 11500, // Gross
      taxAmount: 1500, // Tax
      currency: 'SAR',
      partyId: 'vend-001',
      partyName: 'Saudi Industrial Supplies',
      description: 'Raw Materials Purchase'
    },
    postingRules,
    accounts,
    journalEntries,
    financialEvents,
    generateDocNumFn,
    recordAuditFn
  );

  const purchaseJE = purchaseEventResult.journalEntry;
  assert(purchaseJE !== null, suite5, 'Purchase invoice generated a journal entry');

  if (purchaseJE) {
    const totalDebit = purchaseJE.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = purchaseJE.lines.reduce((s, l) => s + l.credit, 0);
    assert(Math.abs(totalDebit - totalCredit) < 0.001, suite5, 'Purchase journal entry is mathematically balanced (Debit === Credit)', `Debit: ${totalDebit}, Credit: ${totalCredit}`);

    // Find Input VAT line
    const inputVatLine = purchaseJE.lines.find(l => l.accountCode === '1040');
    assert(inputVatLine !== undefined, suite5, 'Input VAT posted to Account 1040 (TaxReceivable / Recoverable Input VAT)');
    assert(inputVatLine?.debit === 1500, suite5, 'Input VAT is DEBITED for 1,500 (Asset debit)', `Got debit: ${inputVatLine?.debit}`);
    assert(inputVatLine?.credit === 0, suite5, 'Input VAT credit is 0');

    // Find AP line
    const apLine = purchaseJE.lines.find(l => l.accountCode === '2010');
    assert(apLine !== undefined, suite5, 'Accounts Payable line posted to Account 2010');
    assert(apLine?.credit === 11500, suite5, 'Accounts Payable is CREDITED for 11,500 (Gross liability)', `Got credit: ${apLine?.credit}`);

    // Verify Output VAT liability (2020) was NOT credited
    const outputVatLine = purchaseJE.lines.find(l => l.accountCode === '2020');
    assert(outputVatLine === undefined || (outputVatLine.debit === 0 && outputVatLine.credit === 0), suite5, 'Output VAT Liability (2020) was NOT credited during purchase posting');
  }

  // 5.2 SALES INVOICE: Must Credit Account 2020 (TaxPayable / Output VAT Liability)
  const salesEventResult = FinancialEventEngine.processEvent(
    {
      tenantId: 'ten-001',
      companyId: 'comp-001',
      eventType: 'SALES_INVOICE_POSTED',
      sourceDocumentType: 'SalesInvoice',
      sourceDocumentId: 'si-test-01',
      sourceDocumentNumber: 'SINV-2026-001',
      amount: 23000, // Gross
      taxAmount: 3000, // Tax
      currency: 'SAR',
      partyId: 'cust-001',
      partyName: 'Al-Madina Hypermarket',
      description: 'Commercial Goods Delivery'
    },
    postingRules,
    accounts,
    journalEntries,
    financialEvents,
    generateDocNumFn,
    recordAuditFn
  );

  const salesJE = salesEventResult.journalEntry;
  assert(salesJE !== null, suite5, 'Sales invoice generated a journal entry');

  if (salesJE) {
    const totalDebit = salesJE.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = salesJE.lines.reduce((s, l) => s + l.credit, 0);
    assert(Math.abs(totalDebit - totalCredit) < 0.001, suite5, 'Sales journal entry is mathematically balanced (Debit === Credit)', `Debit: ${totalDebit}, Credit: ${totalCredit}`);

    // Find Output VAT line
    const outputVatLine = salesJE.lines.find(l => l.accountCode === '2020');
    assert(outputVatLine !== undefined, suite5, 'Output VAT posted to Account 2020 (TaxPayable / Output VAT Liability)');
    assert(outputVatLine?.credit === 3000, suite5, 'Output VAT is CREDITED for 3,000 (Liability credit)', `Got credit: ${outputVatLine?.credit}`);
    assert(outputVatLine?.debit === 0, suite5, 'Output VAT debit is 0');

    // Find AR line
    const arLine = salesJE.lines.find(l => l.accountCode === '1020');
    assert(arLine !== undefined, suite5, 'Accounts Receivable line posted to Account 1020');
    assert(arLine?.debit === 23000, suite5, 'Accounts Receivable is DEBITED for 23,000 (Gross asset)', `Got debit: ${arLine?.debit}`);
  }

  // 5.3 SALES RETURN / CREDIT NOTE: Output VAT Reversal Debit
  const salesReturnEventResult = FinancialEventEngine.processEvent(
    {
      tenantId: 'ten-001',
      companyId: 'comp-001',
      eventType: 'CUSTOMER_CREDIT_NOTE_POSTED',
      sourceDocumentType: 'CustomerCreditNote',
      sourceDocumentId: 'cn-test-01',
      sourceDocumentNumber: 'CRN-2026-001',
      amount: 2300, // Gross
      taxAmount: 300, // Tax
      currency: 'SAR',
      partyId: 'cust-001',
      partyName: 'Al-Madina Hypermarket',
      description: 'Customer Return'
    },
    postingRules,
    accounts,
    journalEntries,
    financialEvents,
    generateDocNumFn,
    recordAuditFn
  );

  const returnJE = salesReturnEventResult.journalEntry;
  assert(returnJE !== null, suite5, 'Customer credit note generated a journal entry');

  if (returnJE) {
    const totalDebit = returnJE.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = returnJE.lines.reduce((s, l) => s + l.credit, 0);
    assert(Math.abs(totalDebit - totalCredit) < 0.001, suite5, 'Customer credit note journal entry is balanced', `Debit: ${totalDebit}, Credit: ${totalCredit}`);

    // Output VAT reversal should be DEBIT
    const vatReversalLine = returnJE.lines.find(l => l.accountCode === '2020');
    assert(vatReversalLine !== undefined, suite5, 'Output VAT reversal posted to Account 2020');
    assert(vatReversalLine?.debit === 300, suite5, 'Output VAT reversal is DEBITED for 300 (Reversing liability)', `Got debit: ${vatReversalLine?.debit}`);
  }

  // 5.4 PURCHASE RETURN / DEBIT NOTE: Input VAT Reversal Credit
  const purchaseReturnEventResult = FinancialEventEngine.processEvent(
    {
      tenantId: 'ten-001',
      companyId: 'comp-001',
      eventType: 'SUPPLIER_DEBIT_NOTE_POSTED',
      sourceDocumentType: 'SupplierDebitNote',
      sourceDocumentId: 'dn-test-01',
      sourceDocumentNumber: 'DBN-2026-001',
      amount: 1150, // Gross
      taxAmount: 150, // Tax
      currency: 'SAR',
      partyId: 'vend-001',
      partyName: 'Saudi Industrial Supplies',
      description: 'Supplier Return'
    },
    postingRules,
    accounts,
    journalEntries,
    financialEvents,
    generateDocNumFn,
    recordAuditFn
  );

  const debitNoteJE = purchaseReturnEventResult.journalEntry;
  assert(debitNoteJE !== null, suite5, 'Supplier debit note generated a journal entry');

  if (debitNoteJE) {
    const totalDebit = debitNoteJE.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = debitNoteJE.lines.reduce((s, l) => s + l.credit, 0);
    assert(Math.abs(totalDebit - totalCredit) < 0.001, suite5, 'Supplier debit note journal entry is balanced', `Debit: ${totalDebit}, Credit: ${totalCredit}`);

    // Input VAT reversal should be CREDIT
    const inputVatReversalLine = debitNoteJE.lines.find(l => l.accountCode === '1040');
    assert(inputVatReversalLine !== undefined, suite5, 'Input VAT reversal posted to Account 1040');
    assert(inputVatReversalLine?.credit === 150, suite5, 'Input VAT reversal is CREDITED for 150 (Reversing asset)', `Got credit: ${inputVatReversalLine?.credit}`);
  }

  // ----------------------------------------------------
  // SUITE 6: Summary & Certification Verdict
  // ----------------------------------------------------
  console.log('\n================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  const totalCount = results.length;

  console.log(`TASK P0-02 VERIFICATION SUMMARY: ${passedCount}/${totalCount} PASS (${failedCount} FAIL)`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    console.error(`❌ CERTIFICATION FAILED: ${failedCount} tests failed.`);
    process.exit(1);
  } else {
    console.log('🎉 P0-02 DYNAMIC TAX RUNTIME BINDING & ACCOUNTING INTEGRITY CERTIFIED PASS!');
  }
}

runDynamicTaxVerification().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
