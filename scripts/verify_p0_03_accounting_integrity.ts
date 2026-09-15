/**
 * AM BUSINESS PLATFORM — PILOT VERIFICATION SUITE
 * TASK P0-03: ACCOUNTING INTEGRITY & INPUT VAT CONTROL
 * 
 * Verifies end-to-end:
 * Scenario A: Purchase invoice — recoverable Input VAT (DR 1030, DR 1040, CR 2010)
 * Scenario B: Sales invoice — Output VAT (DR 1020, CR 4010, CR 2020)
 * Scenario C: Customer credit note — Output VAT reversal (DR 4010, DR 2020, CR 1020)
 * Scenario D: Supplier debit note — Input VAT reversal (DR 2010, CR 1030, CR 1040)
 * Scenario E: Zero-rated purchase / sale (tax = 0, no VAT line, balanced)
 * Scenario F: Exempt purchase / sale (tax = 0, no VAT line, distinct exemption)
 * Scenario G: Tax-inclusive sale (authoritative decomposition, no double-tax)
 * Scenario H: Tax-exclusive sale (additive tax, balanced)
 * Scenario I: DiscountPercent transaction (subtotal -> discount -> net -> tax -> gross)
 * Scenario J: DiscountAmount transaction (subtotal -> explicit discount -> net -> tax -> gross)
 * Scenario K: Multi-line transaction (mixed tax rates and categories)
 * Scenario L: Rounding edge case (fractional cents handled to exact 2-decimal balance)
 * Scenario M: Duplicate financial-event retry (Idempotency, exactly one JE, no balance double-count)
 * Scenario N: Failed posting rollback (Atomicity, zero partial mutations on failure)
 * Scenario O: Cross-company isolation (A cannot mutate B, strict rejection of mismatches)
 * Scenario P: Document total ↔ journal reconciliation (Net + Tax = Gross = Debits = Credits)
 * Scenario Q: Full source-document → GL traceability (Source Doc -> FE -> JE -> GL -> SHA256)
 */

import { TaxEngine } from '../src/engine/taxEngine';
import { FinancialEventEngine } from '../src/engine/financialEventEngine';
import { PostingRulesEngine } from '../src/engine/postingRulesEngine';
import { Account, PostingRule, JournalEntry, FinancialEvent } from '../src/types';
import { INITIAL_ACCOUNTS, INITIAL_POSTING_RULES } from '../src/data/mockDatabase';

interface TestResult {
  scenario: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, scenario: string, name: string, details?: string) {
  if (!condition) {
    results.push({ scenario, name, passed: false, details: details || 'Assertion failed' });
    console.error(`❌ [FAIL] Scenario ${scenario} -> ${name}: ${details || ''}`);
  } else {
    results.push({ scenario, name, passed: true, details });
    console.log(`✅ [PASS] Scenario ${scenario} -> ${name}`);
  }
}

// Helpers for clean test harnesses
function createHarness() {
  const accounts: Account[] = JSON.parse(JSON.stringify(INITIAL_ACCOUNTS));
  const postingRules: PostingRule[] = JSON.parse(JSON.stringify(INITIAL_POSTING_RULES));
  const journalEntries: JournalEntry[] = [];
  const financialEvents: FinancialEvent[] = [];
  const auditLogs: any[] = [];

  let docCounter = 1000;
  const generateDocNumFn = (tenantId: string, entityType: 'JE') => `${entityType}-2026-${++docCounter}`;
  const recordAuditFn = (...args: any[]) => {
    auditLogs.push(args);
  };

  return {
    accounts,
    postingRules,
    journalEntries,
    financialEvents,
    auditLogs,
    generateDocNumFn,
    recordAuditFn
  };
}

async function runAccountingIntegritySuite() {
  console.log('\n================================================================');
  console.log('AM ENTERPRISE ERP — TASK P0-03 ACCOUNTING INTEGRITY SUITE');
  console.log('================================================================\n');

  // ===========================================================================
  // SCENARIO A: Purchase invoice — recoverable Input VAT
  // ===========================================================================
  {
    const h = createHarness();
    const sc = 'A';

    // Net purchase = 1,000, VAT = 140 (14%), Gross = 1,140
    const net = 1000;
    const tax = 140;
    const gross = 1140;

    const acc1030Before = h.accounts.find(a => a.code === '1030')!.balance;
    const acc1040Before = h.accounts.find(a => a.code === '1040')!.balance;
    const acc2010Before = h.accounts.find(a => a.code === '2010')!.balance;

    const res = FinancialEventEngine.processEvent(
      {
        tenantId: 'ten-001',
        companyId: 'comp-001',
        eventType: 'PURCHASE_INVOICE_POSTED',
        sourceDocumentType: 'PurchaseInvoice',
        sourceDocumentId: 'pi-sc-a-01',
        sourceDocumentNumber: 'PINV-2026-001',
        amount: gross,
        taxAmount: tax,
        currency: 'EGP',
        partyId: 'vend-001',
        partyName: 'Cairo Trade Hub',
        description: 'Commercial Raw Materials Purchase'
      },
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    const je = res.journalEntry;
    assert(je !== null, sc, 'Purchase invoice generated journal entry');
    if (je) {
      assert(je.status === 'Posted', sc, 'Journal entry status is Posted');
      assert(Math.abs(je.totalDebit - gross) < 0.001, sc, `Total Debits equal gross (${gross})`, `Got ${je.totalDebit}`);
      assert(Math.abs(je.totalCredit - gross) < 0.001, sc, `Total Credits equal gross (${gross})`, `Got ${je.totalCredit}`);
      assert(Math.abs(je.totalDebit - je.totalCredit) < 0.001, sc, 'Sum of Debits equals Sum of Credits');

      // Check DR lines
      const invLine = je.lines.find(l => l.accountCode === '1030');
      assert(invLine !== undefined && invLine.debit === net && invLine.credit === 0, sc, 'DR Expense/Inventory (1030) for net amount (1,000)');

      const inputVatLine = je.lines.find(l => l.accountCode === '1040');
      assert(inputVatLine !== undefined && inputVatLine.debit === tax && inputVatLine.credit === 0, sc, 'DR Input VAT Recoverable (1040) for tax amount (140)');

      // Check CR line
      const apLine = je.lines.find(l => l.accountCode === '2010');
      assert(apLine !== undefined && apLine.credit === gross && apLine.debit === 0, sc, 'CR Accounts Payable (2010) for gross amount (1,140)');

      // Verify Output VAT liability (2020) was NOT credited
      const outputVatLine = je.lines.find(l => l.accountCode === '2020');
      assert(outputVatLine === undefined, sc, 'Output VAT Liability (2020) is NOT touched in purchase');

      // Verify GL Account mutations
      const acc1030After = h.accounts.find(a => a.code === '1030')!.balance;
      const acc1040After = h.accounts.find(a => a.code === '1040')!.balance;
      const acc2010After = h.accounts.find(a => a.code === '2010')!.balance;
      assert(Math.abs(acc1030After - (acc1030Before + net)) < 0.001, sc, 'GL Account 1030 balance increased by net');
      assert(Math.abs(acc1040After - (acc1040Before + tax)) < 0.001, sc, 'GL Account 1040 balance increased by tax');
      assert(Math.abs(acc2010After - (acc2010Before + gross)) < 0.001, sc, 'GL Account 2010 balance increased by gross');
    }
  }

  // ===========================================================================
  // SCENARIO B: Sales invoice — Output VAT
  // ===========================================================================
  {
    const h = createHarness();
    const sc = 'B';

    // Net sale = 2,000, VAT = 300 (15%), Gross = 2,300
    const net = 2000;
    const tax = 300;
    const gross = 2300;

    const acc1020Before = h.accounts.find(a => a.code === '1020')!.balance;
    const acc4010Before = h.accounts.find(a => a.code === '4010')!.balance;
    const acc2020Before = h.accounts.find(a => a.code === '2020')!.balance;

    const res = FinancialEventEngine.processEvent(
      {
        tenantId: 'ten-001',
        companyId: 'comp-001',
        eventType: 'SALES_INVOICE_POSTED',
        sourceDocumentType: 'SalesInvoice',
        sourceDocumentId: 'si-sc-b-01',
        sourceDocumentNumber: 'SINV-2026-002',
        amount: gross,
        taxAmount: tax,
        currency: 'SAR',
        partyId: 'cust-001',
        partyName: 'Al-Noor Wholesalers',
        description: 'Wholesale Food Delivery'
      },
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    const je = res.journalEntry;
    assert(je !== null, sc, 'Sales invoice generated journal entry');
    if (je) {
      assert(Math.abs(je.totalDebit - gross) < 0.001, sc, `Total Debits equal gross (${gross})`);
      assert(Math.abs(je.totalCredit - gross) < 0.001, sc, `Total Credits equal gross (${gross})`);
      assert(Math.abs(je.totalDebit - je.totalCredit) < 0.001, sc, 'Sum of Debits equals Sum of Credits');

      // DR AR 1020
      const arLine = je.lines.find(l => l.accountCode === '1020');
      assert(arLine !== undefined && arLine.debit === gross && arLine.credit === 0, sc, 'DR Accounts Receivable (1020) for gross (2,300)');

      // CR Revenue 4010
      const revLine = je.lines.find(l => l.accountCode === '4010');
      assert(revLine !== undefined && revLine.credit === net && revLine.debit === 0, sc, 'CR Sales Revenue (4010) for net (2,000)');

      // CR Output VAT 2020
      const vatLine = je.lines.find(l => l.accountCode === '2020');
      assert(vatLine !== undefined && vatLine.credit === tax && vatLine.debit === 0, sc, 'CR Output VAT Liability (2020) for tax (300)');

      // GL Account balances
      const acc1020After = h.accounts.find(a => a.code === '1020')!.balance;
      const acc4010After = h.accounts.find(a => a.code === '4010')!.balance;
      const acc2020After = h.accounts.find(a => a.code === '2020')!.balance;
      assert(Math.abs(acc1020After - (acc1020Before + gross)) < 0.001, sc, 'GL Account 1020 increased by gross');
      assert(Math.abs(acc4010After - (acc4010Before + net)) < 0.001, sc, 'GL Account 4010 increased by net');
      assert(Math.abs(acc2020After - (acc2020Before + tax)) < 0.001, sc, 'GL Account 2020 increased by tax');
    }
  }

  // ===========================================================================
  // SCENARIO C: Customer credit note — Output VAT reversal
  // ===========================================================================
  {
    const h = createHarness();
    const sc = 'C';

    const net = 500;
    const tax = 75;
    const gross = 575;

    const acc1020Before = h.accounts.find(a => a.code === '1020')!.balance;
    const acc4010Before = h.accounts.find(a => a.code === '4010')!.balance;
    const acc2020Before = h.accounts.find(a => a.code === '2020')!.balance;

    const res = FinancialEventEngine.processEvent(
      {
        tenantId: 'ten-001',
        companyId: 'comp-001',
        eventType: 'CUSTOMER_CREDIT_NOTE_POSTED',
        sourceDocumentType: 'CustomerCreditNote',
        sourceDocumentId: 'cn-sc-c-01',
        sourceDocumentNumber: 'CRN-2026-003',
        amount: gross,
        taxAmount: tax,
        currency: 'SAR',
        partyId: 'cust-001',
        partyName: 'Al-Noor Wholesalers',
        description: 'Customer Damaged Goods Return'
      },
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    const je = res.journalEntry;
    assert(je !== null, sc, 'Customer credit note generated journal entry');
    if (je) {
      assert(Math.abs(je.totalDebit - gross) < 0.001, sc, 'Credit note balanced: Total Debit == gross (575)');
      assert(Math.abs(je.totalCredit - gross) < 0.001, sc, 'Credit note balanced: Total Credit == gross (575)');

      // DR Revenue 4010 (Reversing Revenue)
      const revReversal = je.lines.find(l => l.accountCode === '4010');
      assert(revReversal !== undefined && revReversal.debit === net && revReversal.credit === 0, sc, 'DR Sales Revenue (4010) reverses net (500)');

      // DR Output VAT 2020 (Reversing Liability)
      const vatReversal = je.lines.find(l => l.accountCode === '2020');
      assert(vatReversal !== undefined && vatReversal.debit === tax && vatReversal.credit === 0, sc, 'DR Output VAT Liability (2020) reverses tax (75)');

      // CR AR 1020 (Reducing Customer Receivable)
      const arReduction = je.lines.find(l => l.accountCode === '1020');
      assert(arReduction !== undefined && arReduction.credit === gross && arReduction.debit === 0, sc, 'CR Accounts Receivable (1020) reduces gross (575)');

      // Check no negative amounts
      assert(je.lines.every(l => l.debit >= 0 && l.credit >= 0), sc, 'No negative amounts used in credit note journal');

      // Check GL Account impact
      const acc1020After = h.accounts.find(a => a.code === '1020')!.balance;
      const acc4010After = h.accounts.find(a => a.code === '4010')!.balance;
      const acc2020After = h.accounts.find(a => a.code === '2020')!.balance;
      assert(Math.abs(acc1020After - (acc1020Before - gross)) < 0.001, sc, 'GL Account 1020 reduced by gross');
      assert(Math.abs(acc4010After - (acc4010Before - net)) < 0.001, sc, 'GL Account 4010 reduced by net');
      assert(Math.abs(acc2020After - (acc2020Before - tax)) < 0.001, sc, 'GL Account 2020 reduced by tax');
    }
  }

  // ===========================================================================
  // SCENARIO D: Supplier debit note — Input VAT reversal
  // ===========================================================================
  {
    const h = createHarness();
    const sc = 'D';

    const net = 400;
    const tax = 60;
    const gross = 460;

    const acc1030Before = h.accounts.find(a => a.code === '1030')!.balance;
    const acc1040Before = h.accounts.find(a => a.code === '1040')!.balance;
    const acc2010Before = h.accounts.find(a => a.code === '2010')!.balance;

    const res = FinancialEventEngine.processEvent(
      {
        tenantId: 'ten-001',
        companyId: 'comp-001',
        eventType: 'SUPPLIER_DEBIT_NOTE_POSTED',
        sourceDocumentType: 'SupplierDebitNote',
        sourceDocumentId: 'dn-sc-d-01',
        sourceDocumentNumber: 'DBN-2026-004',
        amount: gross,
        taxAmount: tax,
        currency: 'SAR',
        partyId: 'vend-001',
        partyName: 'Saudi Industrial Supplies',
        description: 'Supplier Return - Defective Materials'
      },
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    const je = res.journalEntry;
    assert(je !== null, sc, 'Supplier debit note generated journal entry');
    if (je) {
      assert(Math.abs(je.totalDebit - gross) < 0.001, sc, 'Debit note balanced: Total Debit == gross (460)');
      assert(Math.abs(je.totalCredit - gross) < 0.001, sc, 'Debit note balanced: Total Credit == gross (460)');

      // DR AP 2010 (Reducing Payable)
      const apReduction = je.lines.find(l => l.accountCode === '2010');
      assert(apReduction !== undefined && apReduction.debit === gross && apReduction.credit === 0, sc, 'DR Accounts Payable (2010) reverses liability (460)');

      // CR Inventory/Expense 1030 (Reducing Asset/Expense)
      const invReduction = je.lines.find(l => l.accountCode === '1030');
      assert(invReduction !== undefined && invReduction.credit === net && invReduction.debit === 0, sc, 'CR Expense/Inventory (1030) reduces cost (400)');

      // CR Input VAT Recoverable 1040 (Reversing Recoverable Tax Asset)
      const inputVatReversal = je.lines.find(l => l.accountCode === '1040');
      assert(inputVatReversal !== undefined && inputVatReversal.credit === tax && inputVatReversal.debit === 0, sc, 'CR Input VAT Recoverable (1040) reverses tax credit (60)');

      // Check no negative amounts
      assert(je.lines.every(l => l.debit >= 0 && l.credit >= 0), sc, 'No negative amounts used in debit note journal');

      // GL Account impact
      const acc1030After = h.accounts.find(a => a.code === '1030')!.balance;
      const acc1040After = h.accounts.find(a => a.code === '1040')!.balance;
      const acc2010After = h.accounts.find(a => a.code === '2010')!.balance;
      assert(Math.abs(acc2010After - (acc2010Before - gross)) < 0.001, sc, 'GL Account 2010 reduced by gross');
      assert(Math.abs(acc1030After - (acc1030Before - net)) < 0.001, sc, 'GL Account 1030 reduced by net');
      assert(Math.abs(acc1040After - (acc1040Before - tax)) < 0.001, sc, 'GL Account 1040 reduced by tax');
    }
  }

  // ===========================================================================
  // SCENARIO E: Zero-rated purchase / sale
  // ===========================================================================
  {
    const h = createHarness();
    const sc = 'E';

    // 1. Zero-rated sale
    const zeroSaleRes = FinancialEventEngine.processEvent(
      {
        tenantId: 'ten-001',
        companyId: 'comp-001',
        eventType: 'SALES_INVOICE_POSTED',
        sourceDocumentType: 'SalesInvoice',
        sourceDocumentId: 'si-sc-e-01',
        sourceDocumentNumber: 'SINV-2026-ZERO',
        amount: 1200,
        taxAmount: 0,
        currency: 'SAR',
        description: 'Zero-Rated Medical Equipment Sale'
      },
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    const saleJE = zeroSaleRes.journalEntry;
    assert(saleJE !== null, sc, 'Zero-rated sale generated journal entry');
    if (saleJE) {
      assert(Math.abs(saleJE.totalDebit - 1200) < 0.001 && Math.abs(saleJE.totalCredit - 1200) < 0.001, sc, 'Zero-rated sale is balanced at 1,200');
      const vatLine = saleJE.lines.find(l => l.accountCode === '2020');
      assert(vatLine === undefined, sc, 'Zero-rated sale has NO Output VAT liability line');
      const arLine = saleJE.lines.find(l => l.accountCode === '1020');
      const revLine = saleJE.lines.find(l => l.accountCode === '4010');
      assert(arLine?.debit === 1200 && revLine?.credit === 1200, sc, 'Zero-rated sale: DR AR 1,200, CR Revenue 1,200');
    }

    // 2. Zero-rated purchase
    const zeroPurchRes = FinancialEventEngine.processEvent(
      {
        tenantId: 'ten-001',
        companyId: 'comp-001',
        eventType: 'PURCHASE_INVOICE_POSTED',
        sourceDocumentType: 'PurchaseInvoice',
        sourceDocumentId: 'pi-sc-e-02',
        sourceDocumentNumber: 'PINV-2026-ZERO',
        amount: 800,
        taxAmount: 0,
        currency: 'SAR',
        description: 'Zero-Rated Supplies Purchase'
      },
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    const purchJE = zeroPurchRes.journalEntry;
    assert(purchJE !== null, sc, 'Zero-rated purchase generated journal entry');
    if (purchJE) {
      assert(Math.abs(purchJE.totalDebit - 800) < 0.001 && Math.abs(purchJE.totalCredit - 800) < 0.001, sc, 'Zero-rated purchase is balanced at 800');
      const vatLine = purchJE.lines.find(l => l.accountCode === '1040');
      assert(vatLine === undefined, sc, 'Zero-rated purchase has NO Input VAT recoverable line');
      const invLine = purchJE.lines.find(l => l.accountCode === '1030');
      const apLine = purchJE.lines.find(l => l.accountCode === '2010');
      assert(invLine?.debit === 800 && apLine?.credit === 800, sc, 'Zero-rated purchase: DR Expense/Inventory 800, CR AP 800');
    }
  }

  // ===========================================================================
  // SCENARIO F: Exempt purchase / sale
  // ===========================================================================
  {
    const h = createHarness();
    const sc = 'F';

    // Exempt financial services sale
    const exemptSaleRes = FinancialEventEngine.processEvent(
      {
        tenantId: 'ten-001',
        companyId: 'comp-001',
        eventType: 'SALES_INVOICE_POSTED',
        sourceDocumentType: 'SalesInvoice',
        sourceDocumentId: 'si-sc-f-01',
        sourceDocumentNumber: 'SINV-2026-EXEMPT',
        amount: 1500,
        taxAmount: 0,
        currency: 'SAR',
        description: 'Exempt Financial Advisory Fee'
      },
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    const je = exemptSaleRes.journalEntry;
    assert(je !== null, sc, 'Exempt sale generated journal entry');
    if (je) {
      assert(Math.abs(je.totalDebit - 1500) < 0.001 && Math.abs(je.totalCredit - 1500) < 0.001, sc, 'Exempt sale is balanced at 1,500');
      assert(je.lines.find(l => l.accountCode === '2020') === undefined, sc, 'Exempt sale posts 0 VAT liability');
      assert(je.lines.find(l => l.accountCode === '1020')?.debit === 1500, sc, 'DR AR 1,500');
      assert(je.lines.find(l => l.accountCode === '4010')?.credit === 1500, sc, 'CR Revenue 1,500');
    }
  }

  // ===========================================================================
  // SCENARIO G: Tax-inclusive sale
  // ===========================================================================
  {
    const h = createHarness();
    const sc = 'G';

    // Tax-inclusive pricing: Gross = 1,140 with 14% VAT in Egypt
    const item = { quantity: 1, unitPrice: 1140, isTaxInclusive: true };
    const lineCalc = TaxEngine.calculateLineTax(item, { countryOrJurisdiction: 'EG' });

    assert(lineCalc.taxableAmount === 1000, sc, 'TaxEngine decomposed tax-inclusive net to exactly 1,000', `Got ${lineCalc.taxableAmount}`);
    assert(lineCalc.taxAmount === 140, sc, 'TaxEngine calculated tax-inclusive tax to exactly 140', `Got ${lineCalc.taxAmount}`);
    assert(lineCalc.total === 1140, sc, 'TaxEngine gross total equals 1,140');

    // Post to accounting
    const res = FinancialEventEngine.processEvent(
      {
        tenantId: 'ten-001',
        companyId: 'comp-001',
        eventType: 'SALES_INVOICE_POSTED',
        sourceDocumentType: 'SalesInvoice',
        sourceDocumentId: 'si-sc-g-01',
        sourceDocumentNumber: 'SINV-2026-INCL',
        amount: lineCalc.total,
        taxAmount: lineCalc.taxAmount,
        currency: 'EGP',
        description: 'Tax Inclusive Retail Sale'
      },
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    const je = res.journalEntry;
    assert(je !== null, sc, 'Tax-inclusive sale generated journal entry');
    if (je) {
      assert(Math.abs(je.totalDebit - 1140) < 0.001, sc, 'Total Debits equal gross 1,140');
      assert(Math.abs(je.totalCredit - 1140) < 0.001, sc, 'Total Credits equal gross 1,140');
      assert(je.lines.find(l => l.accountCode === '1020')?.debit === 1140, sc, 'DR AR 1,140');
      assert(je.lines.find(l => l.accountCode === '4010')?.credit === 1000, sc, 'CR Revenue 1,000 (decomposed net)');
      assert(je.lines.find(l => l.accountCode === '2020')?.credit === 140, sc, 'CR Output VAT 140 (decomposed tax)');
      assert(lineCalc.taxableAmount + lineCalc.taxAmount === lineCalc.total, sc, 'Net + Tax exactly equals Gross (no double tax)');
    }
  }

  // ===========================================================================
  // SCENARIO H: Tax-exclusive sale
  // ===========================================================================
  {
    const h = createHarness();
    const sc = 'H';

    // Tax-exclusive pricing: Net = 1,000 with 15% VAT in KSA -> Gross = 1,150
    const item = { quantity: 1, unitPrice: 1000, isTaxInclusive: false };
    const lineCalc = TaxEngine.calculateLineTax(item, { countryOrJurisdiction: 'SA' });

    assert(lineCalc.taxableAmount === 1000, sc, 'Tax-exclusive net is 1,000');
    assert(lineCalc.taxAmount === 150, sc, 'Tax-exclusive tax is 150');
    assert(lineCalc.total === 1150, sc, 'Tax-exclusive gross is 1,150');

    const res = FinancialEventEngine.processEvent(
      {
        tenantId: 'ten-001',
        companyId: 'comp-001',
        eventType: 'SALES_INVOICE_POSTED',
        sourceDocumentType: 'SalesInvoice',
        sourceDocumentId: 'si-sc-h-01',
        sourceDocumentNumber: 'SINV-2026-EXCL',
        amount: lineCalc.total,
        taxAmount: lineCalc.taxAmount,
        currency: 'SAR',
        description: 'Tax Exclusive B2B Sale'
      },
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    const je = res.journalEntry;
    assert(je !== null, sc, 'Tax-exclusive sale generated journal entry');
    if (je) {
      assert(Math.abs(je.totalDebit - 1150) < 0.001, sc, 'Total Debits equal 1,150');
      assert(Math.abs(je.totalCredit - 1150) < 0.001, sc, 'Total Credits equal 1,150');
      assert(je.lines.find(l => l.accountCode === '1020')?.debit === 1150, sc, 'DR AR 1,150');
      assert(je.lines.find(l => l.accountCode === '4010')?.credit === 1000, sc, 'CR Revenue 1,000');
      assert(je.lines.find(l => l.accountCode === '2020')?.credit === 150, sc, 'CR Output VAT 150');
    }
  }

  // ===========================================================================
  // SCENARIO I: DiscountPercent transaction
  // ===========================================================================
  {
    const h = createHarness();
    const sc = 'I';

    // Subtotal = 1,000, DiscountPercent = 10% (100 SAR) -> Net = 900, VAT 15% on 900 = 135, Gross = 1,035
    const item = { quantity: 1, unitPrice: 1000, discountPercent: 10, isTaxInclusive: false };
    const lineCalc = TaxEngine.calculateLineTax(item, { countryOrJurisdiction: 'SA' });

    assert(lineCalc.subtotal === 1000, sc, 'Subtotal is 1,000');
    assert(lineCalc.discountAmount === 100, sc, 'Discount amount is 100 (10%)');
    assert(lineCalc.taxableAmount === 900, sc, 'Taxable net amount is 900');
    assert(lineCalc.taxAmount === 135, sc, 'Tax amount is 135 (15% on 900)');
    assert(lineCalc.total === 1035, sc, 'Gross total is 1,035');

    const res = FinancialEventEngine.processEvent(
      {
        tenantId: 'ten-001',
        companyId: 'comp-001',
        eventType: 'SALES_INVOICE_POSTED',
        sourceDocumentType: 'SalesInvoice',
        sourceDocumentId: 'si-sc-i-01',
        sourceDocumentNumber: 'SINV-2026-DISCPCT',
        amount: lineCalc.total,
        taxAmount: lineCalc.taxAmount,
        discountAmount: lineCalc.discountAmount,
        currency: 'SAR',
        description: 'Sale with 10% Trade Discount'
      },
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    const je = res.journalEntry;
    assert(je !== null, sc, 'Discount percent sale generated journal entry');
    if (je) {
      assert(Math.abs(je.totalDebit - 1035) < 0.001, sc, 'Total Debits equal 1,035');
      assert(Math.abs(je.totalCredit - 1035) < 0.001, sc, 'Total Credits equal 1,035');
      assert(je.lines.find(l => l.accountCode === '1020')?.debit === 1035, sc, 'DR AR 1,035');
      assert(je.lines.find(l => l.accountCode === '4010')?.credit === 900, sc, 'CR Revenue 900 (net after discount)');
      assert(je.lines.find(l => l.accountCode === '2020')?.credit === 135, sc, 'CR Output VAT 135');
    }
  }

  // ===========================================================================
  // SCENARIO J: DiscountAmount transaction
  // ===========================================================================
  {
    const h = createHarness();
    const sc = 'J';

    // Subtotal = 2,500, Explicit discountAmount = 250 -> Net = 2,250, VAT 15% = 337.50, Gross = 2,587.50
    const item = { quantity: 1, unitPrice: 2500, discountAmount: 250, isTaxInclusive: false };
    const lineCalc = TaxEngine.calculateLineTax(item, { countryOrJurisdiction: 'SA' });

    assert(lineCalc.subtotal === 2500, sc, 'Subtotal is 2,500');
    assert(lineCalc.discountAmount === 250, sc, 'Discount amount is 250');
    assert(lineCalc.taxableAmount === 2250, sc, 'Taxable net amount is 2,250');
    assert(lineCalc.taxAmount === 337.5, sc, 'Tax amount is 337.50');
    assert(lineCalc.total === 2587.5, sc, 'Gross total is 2,587.50');

    const res = FinancialEventEngine.processEvent(
      {
        tenantId: 'ten-001',
        companyId: 'comp-001',
        eventType: 'SALES_INVOICE_POSTED',
        sourceDocumentType: 'SalesInvoice',
        sourceDocumentId: 'si-sc-j-01',
        sourceDocumentNumber: 'SINV-2026-DISCAMT',
        amount: lineCalc.total,
        taxAmount: lineCalc.taxAmount,
        discountAmount: lineCalc.discountAmount,
        currency: 'SAR',
        description: 'Sale with Lump-Sum Discount'
      },
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    const je = res.journalEntry;
    assert(je !== null, sc, 'Discount amount sale generated journal entry');
    if (je) {
      assert(Math.abs(je.totalDebit - 2587.5) < 0.001, sc, 'Total Debits equal 2,587.50');
      assert(Math.abs(je.totalCredit - 2587.5) < 0.001, sc, 'Total Credits equal 2,587.50');
      assert(je.lines.find(l => l.accountCode === '1020')?.debit === 2587.5, sc, 'DR AR 2,587.50');
      assert(je.lines.find(l => l.accountCode === '4010')?.credit === 2250, sc, 'CR Revenue 2,250');
      assert(je.lines.find(l => l.accountCode === '2020')?.credit === 337.5, sc, 'CR Output VAT 337.50');
    }
  }

  // ===========================================================================
  // SCENARIO K: Multi-line transaction (Mixed rates)
  // ===========================================================================
  {
    const h = createHarness();
    const sc = 'K';

    const items = [
      { id: 'l-1', quantity: 1, unitPrice: 1000, taxRate: 0.15, taxCategory: 'STANDARD' },
      { id: 'l-2', quantity: 1, unitPrice: 500, taxRate: 0.05, taxCategory: 'REDUCED' },
      { id: 'l-3', quantity: 1, unitPrice: 300, taxRate: 0.00, taxCategory: 'ZERO_RATED' },
      { id: 'l-4', quantity: 1, unitPrice: 200, taxRate: 0.00, taxCategory: 'EXEMPT' }
    ];

    const docTax = TaxEngine.calculateDocumentTaxes(items, undefined, undefined, 0, { countryOrJurisdiction: 'SA' });

    assert(docTax.netTotal === 2000, sc, 'Multi-line net total is 2,000 (1000+500+300+200)');
    assert(docTax.taxTotal === 175, sc, 'Multi-line tax total is 175 (150+25+0+0)');
    assert(docTax.grandTotal === 2175, sc, 'Multi-line grand total is 2,175');

    const res = FinancialEventEngine.processEvent(
      {
        tenantId: 'ten-001',
        companyId: 'comp-001',
        eventType: 'SALES_INVOICE_POSTED',
        sourceDocumentType: 'SalesInvoice',
        sourceDocumentId: 'si-sc-k-01',
        sourceDocumentNumber: 'SINV-2026-MULTI',
        amount: docTax.grandTotal,
        taxAmount: docTax.taxTotal,
        currency: 'SAR',
        description: 'Multi-Line Mixed Tax Invoice'
      },
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    const je = res.journalEntry;
    assert(je !== null, sc, 'Multi-line transaction generated journal entry');
    if (je) {
      assert(Math.abs(je.totalDebit - 2175) < 0.001, sc, 'Total Debits equal 2,175');
      assert(Math.abs(je.totalCredit - 2175) < 0.001, sc, 'Total Credits equal 2,175');
      assert(je.lines.find(l => l.accountCode === '1020')?.debit === 2175, sc, 'DR AR 2,175');
      assert(je.lines.find(l => l.accountCode === '4010')?.credit === 2000, sc, 'CR Revenue 2,000');
      assert(je.lines.find(l => l.accountCode === '2020')?.credit === 175, sc, 'CR Output VAT 175');
    }
  }

  // ===========================================================================
  // SCENARIO L: Rounding edge case
  // ===========================================================================
  {
    const h = createHarness();
    const sc = 'L';

    // Fractional amount: unit price 33.33, qty 3 = 99.99, tax 15% = 14.9985 -> 15.00
    // Gross = 114.99
    const item = { quantity: 3, unitPrice: 33.33, isTaxInclusive: false };
    const lineCalc = TaxEngine.calculateLineTax(item, { countryOrJurisdiction: 'SA' });

    assert(lineCalc.subtotal === 99.99, sc, 'Subtotal is 99.99');
    assert(lineCalc.taxAmount === 15.00, sc, 'Tax rounded to 2 decimals is exactly 15.00', `Got ${lineCalc.taxAmount}`);
    assert(lineCalc.total === 114.99, sc, 'Gross rounded to 2 decimals is exactly 114.99');

    const res = FinancialEventEngine.processEvent(
      {
        tenantId: 'ten-001',
        companyId: 'comp-001',
        eventType: 'SALES_INVOICE_POSTED',
        sourceDocumentType: 'SalesInvoice',
        sourceDocumentId: 'si-sc-l-01',
        sourceDocumentNumber: 'SINV-2026-ROUND',
        amount: lineCalc.total,
        taxAmount: lineCalc.taxAmount,
        currency: 'SAR',
        description: 'Fractional Penny Rounding Sale'
      },
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    const je = res.journalEntry;
    assert(je !== null, sc, 'Rounding transaction generated journal entry');
    if (je) {
      assert(Math.abs(je.totalDebit - 114.99) < 0.001, sc, 'Total Debits is exactly 114.99');
      assert(Math.abs(je.totalCredit - 114.99) < 0.001, sc, 'Total Credits is exactly 114.99');
      assert(Math.abs(je.totalDebit - je.totalCredit) < 0.0001, sc, 'Exact double-entry balance with zero penny leak');
    }
  }

  // ===========================================================================
  // SCENARIO M: Duplicate financial-event retry (Idempotency)
  // ===========================================================================
  {
    const h = createHarness();
    const sc = 'M';

    const eventPayload = {
      tenantId: 'ten-001',
      companyId: 'comp-001',
      eventType: 'SALES_INVOICE_POSTED' as const,
      sourceDocumentType: 'SalesInvoice',
      sourceDocumentId: 'si-sc-m-idempotent-01',
      sourceDocumentNumber: 'SINV-2026-IDEMP',
      amount: 5750,
      taxAmount: 750,
      currency: 'SAR',
      description: 'Idempotency Test Invoice'
    };

    // 1. Post event once
    const res1 = FinancialEventEngine.processEvent(
      eventPayload,
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    assert(res1.journalEntry !== null, sc, 'First posting attempt produced journal entry');
    const firstJEId = res1.journalEntry!.id;
    const jeCountAfterFirst = h.journalEntries.length;
    const feCountAfterFirst = h.financialEvents.length;
    const arBalanceAfterFirst = h.accounts.find(a => a.code === '1020')!.balance;

    // 2. Process same event second time
    const res2 = FinancialEventEngine.processEvent(
      eventPayload,
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    assert(res2.journalEntry !== null, sc, 'Retry returned existing journal entry');
    assert(res2.journalEntry!.id === firstJEId, sc, 'Returned journal entry has identical authoritative ID');
    assert(h.journalEntries.length === jeCountAfterFirst, sc, 'Journal entries list count did NOT increase');
    assert(h.financialEvents.length === feCountAfterFirst, sc, 'No duplicate financial event appended');

    // Verify GL balances were NOT double-counted
    const arBalanceAfterSecond = h.accounts.find(a => a.code === '1020')!.balance;
    assert(arBalanceAfterSecond === arBalanceAfterFirst, sc, 'GL Account 1020 balance was NOT mutated twice');
  }

  // ===========================================================================
  // SCENARIO N: Failed posting rollback (Atomicity)
  // ===========================================================================
  {
    const h = createHarness();
    const sc = 'N';

    const jeCountBefore = h.journalEntries.length;
    const feCountBefore = h.financialEvents.length;
    const arBalanceBefore = h.accounts.find(a => a.code === '1020')!.balance;
    const revBalanceBefore = h.accounts.find(a => a.code === '4010')!.balance;

    // Attempt to post with an invalid non-existent document type
    const resFailed = FinancialEventEngine.processEvent(
      {
        tenantId: 'ten-001',
        companyId: 'comp-001',
        eventType: 'SALES_INVOICE_POSTED',
        sourceDocumentType: 'NON_EXISTENT_DOCUMENT_TYPE_123',
        sourceDocumentId: 'bad-doc-01',
        sourceDocumentNumber: 'BAD-001',
        amount: 9999,
        taxAmount: 999,
        currency: 'SAR',
        description: 'Failed Event Attempt'
      },
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    assert(resFailed.journalEntry === null, sc, 'Failed attempt returned null journal entry');
    assert(resFailed.financialEvent.status === 'FAILED', sc, 'Financial event status recorded as FAILED');
    assert(h.journalEntries.length === jeCountBefore, sc, 'No partial journal entry added to journal list');

    // Verify account balances remained completely untouched
    const arBalanceAfter = h.accounts.find(a => a.code === '1020')!.balance;
    const revBalanceAfter = h.accounts.find(a => a.code === '4010')!.balance;
    assert(arBalanceAfter === arBalanceBefore, sc, 'AR account balance was untouched after failure');
    assert(revBalanceAfter === revBalanceBefore, sc, 'Revenue account balance was untouched after failure');
  }

  // ===========================================================================
  // SCENARIO O: Cross-company isolation
  // ===========================================================================
  {
    const h = createHarness();
    const sc = 'O';

    // Add company-specific accounts belonging strictly to Company B (comp-002)
    const companyBAccountAR: Account = {
      id: 'acc-comp-002-ar',
      tenantId: 'ten-001',
      companyId: 'comp-002',
      code: '1020-B',
      name: 'Accounts Receivable Company B',
      nameAr: 'مدينون تجاريون شركة ب',
      category: 'Asset',
      accountType: 'Receivable',
      currency: 'SAR',
      balance: 50000,
      isActive: true,
      level: 4
    };
    const companyBAccountRev: Account = {
      id: 'acc-comp-002-rev',
      tenantId: 'ten-001',
      companyId: 'comp-002',
      code: '4010-B',
      name: 'Sales Revenue Company B',
      nameAr: 'إيرادات شركة ب',
      category: 'Revenue',
      accountType: 'Revenue',
      currency: 'SAR',
      balance: 100000,
      isActive: true,
      level: 4
    };
    const companyBAccountTax: Account = {
      id: 'acc-comp-002-tax',
      tenantId: 'ten-001',
      companyId: 'comp-002',
      code: '2020-B',
      name: 'Output VAT Company B',
      nameAr: 'ضريبة المخرجات شركة ب',
      category: 'Liability',
      accountType: 'TaxPayable',
      currency: 'SAR',
      balance: 15000,
      isActive: true,
      level: 4
    };
    h.accounts.push(companyBAccountAR, companyBAccountRev, companyBAccountTax);

    // Rule specifically for comp-002 pointing to Company B accounts
    const companyBRule: PostingRule = {
      id: 'pr-comp-002-sales',
      tenantId: 'ten-001',
      companyId: 'comp-002',
      name: 'Company B Sales Rule',
      documentType: 'SalesInvoice',
      debitAccountCode: '1020-B',
      creditAccountCode: '4010-B',
      taxAccountCode: '2020-B',
      isActive: true
    };
    h.postingRules.push(companyBRule);

    const accABefore = h.accounts.find(a => a.code === '1020')!.balance;

    // Post an event for Company B
    const resB = FinancialEventEngine.processEvent(
      {
        tenantId: 'ten-001',
        companyId: 'comp-002',
        eventType: 'SALES_INVOICE_POSTED',
        sourceDocumentType: 'SalesInvoice',
        sourceDocumentId: 'si-comp-b-01',
        sourceDocumentNumber: 'SINV-COMP-B-01',
        amount: 2300,
        taxAmount: 300,
        currency: 'SAR',
        description: 'Company B Isolated Sale'
      },
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    assert(resB.journalEntry !== null, sc, 'Company B event processed successfully');
    assert(resB.journalEntry?.companyId === 'comp-002', sc, 'Journal entry is owned by Company B (comp-002)');
    assert(resB.financialEvent.companyId === 'comp-002', sc, 'Financial event is owned by Company B');

    // Verify 1020-B was mutated, but Company A default 1020 was NOT touched by Company B
    const accB = h.accounts.find(a => a.code === '1020-B')!;
    const accAAfter = h.accounts.find(a => a.code === '1020')!.balance;
    assert(accB.balance === 52300, sc, 'Company B account 1020-B increased by 2,300', `Got ${accB.balance}`);
    assert(accAAfter === accABefore, sc, 'Company A account 1020 was NOT touched by Company B transaction');
    
    // Now verify attempting to cross-post Company A with Company B account throws isolation violation
    let crossCompanyErrorCaught = false;
    try {
      // Simulate rule attempting to post Company B account for Company A event
      const crossRule: PostingRule = {
        id: 'pr-cross-leak',
        tenantId: 'ten-001',
        companyId: 'comp-001',
        name: 'Cross Leak Rule',
        documentType: 'CrossDocumentType',
        debitAccountCode: '1020-B', // Company B account!
        creditAccountCode: '4010',
        isActive: true
      };
      h.postingRules.push(crossRule);

      FinancialEventEngine.processEvent(
        {
          tenantId: 'ten-001',
          companyId: 'comp-001', // Company A event!
          eventType: 'SALES_INVOICE_POSTED',
          sourceDocumentType: 'CrossDocumentType',
          sourceDocumentId: 'cross-01',
          sourceDocumentNumber: 'CROSS-001',
          amount: 1000,
          currency: 'SAR'
        },
        h.postingRules,
        h.accounts,
        h.journalEntries,
        h.financialEvents,
        h.generateDocNumFn,
        h.recordAuditFn
      );
    } catch (crossErr: any) {
      crossCompanyErrorCaught = true;
      assert(crossErr.message.includes('ISOLATION VIOLATION') || crossErr.message.includes('not found in scope'), sc, 'Cross-company posting strictly rejected with isolation violation', crossErr.message);
    }
    assert(crossCompanyErrorCaught, sc, 'Cross-company posting violation blocked before GL mutation');
  }

  // ===========================================================================
  // SCENARIO P: Document total ↔ journal reconciliation
  // ===========================================================================
  {
    const h = createHarness();
    const sc = 'P';

    const items = [
      { quantity: 10, unitPrice: 200, discountPercent: 5, isTaxInclusive: false } // Subtotal 2,000, Disc 100, Net 1,900, Tax 15% = 285, Gross 2,185
    ];
    const calc = TaxEngine.calculateDocumentTaxes(items, undefined, undefined, 0, { countryOrJurisdiction: 'SA' });

    const res = FinancialEventEngine.processEvent(
      {
        tenantId: 'ten-001',
        companyId: 'comp-001',
        eventType: 'SALES_INVOICE_POSTED',
        sourceDocumentType: 'SalesInvoice',
        sourceDocumentId: 'si-sc-p-01',
        sourceDocumentNumber: 'SINV-2026-RECON',
        amount: calc.grandTotal,
        taxAmount: calc.taxTotal,
        discountAmount: calc.discountTotal,
        currency: 'SAR',
        description: 'Reconciliation Verification Invoice'
      },
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    const je = res.journalEntry;
    assert(je !== null, sc, 'Reconciliation journal created');
    if (je) {
      // Document Gross == Journal Debits == Journal Credits
      assert(calc.grandTotal === je.totalDebit, sc, 'Document Gross Total exactly equals Journal Total Debits (2,185)');
      assert(calc.grandTotal === je.totalCredit, sc, 'Document Gross Total exactly equals Journal Total Credits (2,185)');

      // Document Net == Revenue line
      const revLine = je.lines.find(l => l.accountCode === '4010');
      assert(calc.netTotal === revLine?.credit, sc, 'Document Net Total exactly equals Revenue Credit (1,900)');

      // Document Tax == Tax line
      const taxLine = je.lines.find(l => l.accountCode === '2020');
      assert(calc.taxTotal === taxLine?.credit, sc, 'Document Tax Total exactly equals Output VAT Credit (285)');

      // Document Gross == AR Control line
      const arLine = je.lines.find(l => l.accountCode === '1020');
      assert(calc.grandTotal === arLine?.debit, sc, 'Document Gross Total exactly equals AR Control Debit (2,185)');

      // Invariant: Gross = Net + Tax
      assert(calc.netTotal! + calc.taxTotal === calc.grandTotal, sc, 'Document Invariant Holds: Net (1,900) + Tax (285) == Gross (2,185)');
    }
  }

  // ===========================================================================
  // SCENARIO Q: Full source-document → GL traceability
  // ===========================================================================
  {
    const h = createHarness();
    const sc = 'Q';

    const sourceDocId = 'inv-trace-999';
    const sourceDocNum = 'SINV-2026-TRACE';
    const tenantId = 'ten-001';
    const companyId = 'comp-001';

    const res = FinancialEventEngine.processEvent(
      {
        tenantId,
        companyId,
        eventType: 'SALES_INVOICE_POSTED',
        sourceDocumentType: 'SalesInvoice',
        sourceDocumentId: sourceDocId,
        sourceDocumentNumber: sourceDocNum,
        amount: 3450,
        taxAmount: 450,
        currency: 'SAR',
        partyId: 'cust-trace-01',
        partyName: 'Traceability Partner Ltd',
        description: 'Traceability Certification Order',
        dimensions: {
          branchId: 'br-riyadh',
          costCenterId: 'cc-sales-01',
          projectId: 'proj-omega'
        }
      },
      h.postingRules,
      h.accounts,
      h.journalEntries,
      h.financialEvents,
      h.generateDocNumFn,
      h.recordAuditFn
    );

    const je = res.journalEntry;
    const fe = res.financialEvent;

    assert(je !== null && fe !== null, sc, 'Both JE and FE generated');
    if (je && fe) {
      // 1. Source Linkage
      assert(je.originatingDocumentType === 'SalesInvoice', sc, 'Journal links to originating document type');
      assert(je.originatingDocumentId === sourceDocId, sc, 'Journal links to source document ID');
      assert(je.originatingDocumentNumber === sourceDocNum, sc, 'Journal links to source document number');
      assert(fe.sourceDocumentId === sourceDocId, sc, 'Financial event links to source document ID');
      assert(fe.journalEntryId === je.id, sc, 'Financial event points to authoritative Journal Entry ID');

      // 2. 12 Dimensional propagation
      assert(je.branchId === 'br-riyadh', sc, 'Branch dimension propagated to JE');
      assert(je.costCenterId === 'cc-sales-01', sc, 'Cost Center dimension propagated to JE');
      assert(je.projectId === 'proj-omega', sc, 'Project dimension propagated to JE');
      assert(je.lines.every(l => l.branchId === 'br-riyadh' && l.costCenterId === 'cc-sales-01'), sc, 'All Journal lines carry consistent dimensional tags');

      // 3. SHA-256 Cryptographic Audit Seal
      assert(je.digitalSignature !== undefined && je.digitalSignature.length === 64, sc, 'Journal contains valid SHA-256 digital signature seal', `Signature: ${je.digitalSignature}`);

      // 4. Audit Log
      assert(h.auditLogs.length > 0, sc, 'Audit trail recorded transaction');
      const audit = h.auditLogs[0];
      assert(audit[5] === 'SalesInvoice' && audit[6] === sourceDocId, sc, 'Audit log accurately references source entity');
    }
  }

  // ===========================================================================
  // SUMMARY & VERDICT
  // ===========================================================================
  console.log('\n================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  const totalCount = results.length;

  console.log(`TASK P0-03 VERIFICATION SUMMARY: ${passedCount}/${totalCount} PASS (${failedCount} FAIL)`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    console.error('❌ CERTIFICATION FAILED! Defective scenarios:');
    results.filter(r => !r.passed).forEach(r => {
      console.error(`   - Scenario ${r.scenario}: ${r.name} -> ${r.details}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 P0-03 ACCOUNTING INTEGRITY & INPUT VAT CONTROL CERTIFIED PASS!');
  }
}

runAccountingIntegritySuite().catch((err) => {
  console.error('Fatal Execution Error in P0-03 suite:', err);
  process.exit(1);
});
