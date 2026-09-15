/**
 * Enterprise Financial Event Engine
 * Core event-driven accounting engine that converts business events into balanced GL Journal Entries with complete 12 Dimensions
 */

import crypto from 'crypto';
import { 
  Account, 
  AccountingDimensions, 
  FinancialEvent, 
  FinancialEventType, 
  JournalEntry, 
  JournalLine, 
  PostingRule 
} from '../types';
import { CurrencyEngine } from './currencyEngine';
import { PostingRulesEngine } from './postingRulesEngine';

export interface PublishEventParams {
  tenantId: string;
  companyId: string;
  eventType: FinancialEventType;
  sourceDocumentType: string;
  sourceDocumentId: string;
  sourceDocumentNumber: string;
  amount: number;
  taxAmount?: number;
  discountAmount?: number;
  currency?: string;
  exchangeRate?: number;
  partyId?: string;
  partyName?: string;
  description?: string;
  dimensions?: AccountingDimensions;
  triggeredBy?: string;
  triggeredByName?: string;
}

export class FinancialEventEngine {
  /**
   * Process and publish a Financial Event, creating auto-posted balanced Journal Entries
   */
  static processEvent(
    params: PublishEventParams,
    postingRules: PostingRule[],
    accounts: Account[],
    journalEntriesList: JournalEntry[],
    financialEventsList: FinancialEvent[],
    generateDocNumFn: (tenantId: string, entityType: 'JE') => string,
    recordAuditFn: (...args: any[]) => void
  ): { journalEntry: JournalEntry | null; financialEvent: FinancialEvent } {
    const {
      tenantId,
      companyId,
      eventType,
      sourceDocumentType,
      sourceDocumentId,
      sourceDocumentNumber,
      amount,
      taxAmount = 0,
      discountAmount = 0,
      currency = 'SAR',
      exchangeRate = 1.0,
      partyId,
      partyName,
      description,
      dimensions = {},
      triggeredBy = 'usr-001',
      triggeredByName = 'Financial Events Engine'
    } = params;

    const today = new Date().toISOString().split('T')[0];

    // =========================================================================
    // 0. IDEMPOTENCY GUARD: Prevent duplicate journal postings on retry
    // =========================================================================
    const existingFE = financialEventsList.find(
      fe => fe.tenantId === tenantId &&
            fe.companyId === companyId &&
            fe.sourceDocumentType === sourceDocumentType &&
            (fe.sourceDocumentId === sourceDocumentId || fe.sourceDocumentNumber === sourceDocumentNumber) &&
            fe.status === 'PROCESSED'
    );
    if (existingFE) {
      const existingJE = journalEntriesList.find(
        je => (existingFE.journalEntryId && je.id === existingFE.journalEntryId) ||
              (je.tenantId === tenantId && je.companyId === companyId &&
               je.originatingDocumentType === sourceDocumentType &&
               (je.originatingDocumentId === sourceDocumentId || je.originatingDocumentNumber === sourceDocumentNumber))
      ) || null;
      return { journalEntry: existingJE, financialEvent: existingFE };
    }

    // Secondary check: authoritative Journal Entry already posted
    const existingAuthoritativeJE = journalEntriesList.find(
      je => je.tenantId === tenantId &&
            je.companyId === companyId &&
            je.originatingDocumentType === sourceDocumentType &&
            (je.originatingDocumentId === sourceDocumentId || je.originatingDocumentNumber === sourceDocumentNumber) &&
            je.status === 'Posted'
    );
    if (existingAuthoritativeJE) {
      let matchingFE = financialEventsList.find(fe => fe.journalEntryId === existingAuthoritativeJE.id);
      if (!matchingFE) {
        matchingFE = {
          id: `fe-${Date.now()}-existing`,
          tenantId,
          companyId,
          eventType,
          sourceDocumentType,
          sourceDocumentId,
          sourceDocumentNumber,
          amount,
          taxAmount,
          currency,
          exchangeRate,
          baseCurrencyAmount: amount * exchangeRate,
          eventDate: existingAuthoritativeJE.date,
          description: existingAuthoritativeJE.description,
          triggeredBy,
          status: 'PROCESSED',
          journalEntryId: existingAuthoritativeJE.id
        };
        financialEventsList.unshift(matchingFE);
      }
      return { journalEntry: existingAuthoritativeJE, financialEvent: matchingFE };
    }

    // =========================================================================
    // 1. RESOLVE POSTING RULE FOR DOCUMENT/EVENT TYPE
    // =========================================================================
    const resolvedAccounts = PostingRulesEngine.resolveRule(
      tenantId,
      sourceDocumentType,
      postingRules,
      accounts,
      companyId
    );

    if (!resolvedAccounts) {
      const failedEvent: FinancialEvent = {
        id: `fe-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenantId,
        companyId,
        eventType,
        sourceDocumentType,
        sourceDocumentId,
        sourceDocumentNumber,
        amount,
        taxAmount,
        discountAmount,
        currency,
        exchangeRate,
        baseCurrencyAmount: amount * exchangeRate,
        eventDate: today,
        partyId,
        partyName,
        description: description || `Event Failed: No active posting rule for ${sourceDocumentType}`,
        triggeredBy,
        status: 'FAILED'
      };
      financialEventsList.unshift(failedEvent);
      return { journalEntry: null, financialEvent: failedEvent };
    }

    const { debitAccount, creditAccount, taxAccount } = resolvedAccounts;

    // =========================================================================
    // 1b. TENANT & COMPANY ISOLATION ENFORCEMENT
    // =========================================================================
    if (companyId) {
      if (debitAccount.companyId && debitAccount.companyId !== companyId) {
        throw new Error(`TENANT/COMPANY ISOLATION VIOLATION: Debit Account ${debitAccount.code} belongs to company ${debitAccount.companyId}, but event belongs to company ${companyId}`);
      }
      if (creditAccount.companyId && creditAccount.companyId !== companyId) {
        throw new Error(`TENANT/COMPANY ISOLATION VIOLATION: Credit Account ${creditAccount.code} belongs to company ${creditAccount.companyId}, but event belongs to company ${companyId}`);
      }
      if (taxAccount && taxAccount.companyId && taxAccount.companyId !== companyId) {
        throw new Error(`TENANT/COMPANY ISOLATION VIOLATION: Tax Account ${taxAccount.code} belongs to company ${taxAccount.companyId}, but event belongs to company ${companyId}`);
      }
    }
    if (tenantId) {
      if (debitAccount.tenantId && debitAccount.tenantId !== tenantId) {
        throw new Error(`TENANT/COMPANY ISOLATION VIOLATION: Debit Account ${debitAccount.code} belongs to tenant ${debitAccount.tenantId}, but event belongs to tenant ${tenantId}`);
      }
      if (creditAccount.tenantId && creditAccount.tenantId !== tenantId) {
        throw new Error(`TENANT/COMPANY ISOLATION VIOLATION: Credit Account ${creditAccount.code} belongs to tenant ${creditAccount.tenantId}, but event belongs to tenant ${tenantId}`);
      }
      if (taxAccount && taxAccount.tenantId && taxAccount.tenantId !== tenantId) {
        throw new Error(`TENANT/COMPANY ISOLATION VIOLATION: Tax Account ${taxAccount.code} belongs to tenant ${taxAccount.tenantId}, but event belongs to tenant ${tenantId}`);
      }
    }

    // =========================================================================
    // 2. BUILD MULTI-LINE JOURNAL ENTRY LINES WITH COMPLETE 12 DIMENSIONS
    // =========================================================================
    const lines: JournalLine[] = [];
    const entryNumber = generateDocNumFn(tenantId, 'JE');

    const mergedDimensions: AccountingDimensions = {
      companyId,
      branchId: dimensions.branchId,
      warehouseId: dimensions.warehouseId,
      departmentId: dimensions.departmentId || resolvedAccounts.departmentId,
      costCenterId: dimensions.costCenterId || resolvedAccounts.costCenterId,
      profitCenterId: dimensions.profitCenterId || resolvedAccounts.profitCenterId,
      projectId: dimensions.projectId,
      employeeId: dimensions.employeeId,
      customerId: dimensions.customerId || (sourceDocumentType === 'SalesInvoice' ? partyId : undefined),
      supplierId: dimensions.supplierId || (sourceDocumentType === 'PurchaseInvoice' ? partyId : undefined),
      currency,
      exchangeRate
    };

    const isPurchaseSide = [
      'PurchaseInvoice',
      'SupplierInvoice',
      'AP_INVOICE',
      'PURCHASE_INVOICE',
      'PURCHASE_INVOICE_POSTED',
      'StockReceipt',
      'SupplierBill',
      'VOUCHER'
    ].includes(sourceDocumentType) || eventType === 'PURCHASE_INVOICE_POSTED' || eventType === 'SUPPLIER_INVOICE_POSTED';

    const isSalesReturn = [
      'CustomerCreditNote',
      'CreditNote',
      'SALES_RETURN',
      'CUSTOMER_CREDIT_NOTE_POSTED',
      'CustomerDebitNote'
    ].includes(sourceDocumentType) || eventType === 'CUSTOMER_CREDIT_NOTE_POSTED';

    const isPurchaseReturn = [
      'SupplierDebitNote',
      'DebitNote',
      'PURCHASE_RETURN',
      'SUPPLIER_DEBIT_NOTE_POSTED',
      'SupplierCreditNote',
      'VendorReturnNote',
      'VENDOR_RETURN_POSTED'
    ].includes(sourceDocumentType) || eventType === 'SUPPLIER_DEBIT_NOTE_POSTED' || eventType === 'SUPPLIER_CREDIT_NOTE_POSTED';

    const isPaymentReversal = [
      'CUSTOMER_PAYMENT_REVERSED',
      'SUPPLIER_PAYMENT_REVERSED'
    ].includes(eventType as any);

    // Monetary Precision: round gross and tax to 2 decimal places
    const grossAmount = Math.round(amount * 100) / 100;
    const effTaxAmount = Math.round(taxAmount * 100) / 100;
    const netAmount = Math.round((grossAmount - effTaxAmount) * 100) / 100;

    if (isPurchaseSide) {
      // -----------------------------------------------------------------------
      // PURCHASE INVOICE / EXPENSE:
      // DR: Expense / Inventory (net amount)
      // DR: Input VAT Recoverable [Account 1040] (tax amount, if any)
      // CR: Accounts Payable [Account 2010] (gross amount)
      // -----------------------------------------------------------------------
      if (effTaxAmount > 0 && taxAccount) {
        lines.push({
          id: `jl-${Date.now()}-1`,
          accountCode: debitAccount.code,
          accountName: debitAccount.name,
          description: `${sourceDocumentNumber} - Expense/Inventory Net Asset`,
          debit: netAmount,
          credit: 0,
          ...mergedDimensions,
          baseCurrencyDebit: Math.round(netAmount * exchangeRate * 100) / 100,
          baseCurrencyCredit: 0
        });

        lines.push({
          id: `jl-${Date.now()}-2`,
          accountCode: taxAccount.code,
          accountName: taxAccount.name,
          description: `${sourceDocumentNumber} - Input VAT Recoverable (Asset Debit)`,
          debit: effTaxAmount,
          credit: 0,
          ...mergedDimensions,
          baseCurrencyDebit: Math.round(effTaxAmount * exchangeRate * 100) / 100,
          baseCurrencyCredit: 0
        });

        lines.push({
          id: `jl-${Date.now()}-3`,
          accountCode: creditAccount.code,
          accountName: creditAccount.name,
          description: `${sourceDocumentNumber} - Total Payable to Supplier (Gross)`,
          debit: 0,
          credit: grossAmount,
          ...mergedDimensions,
          baseCurrencyDebit: 0,
          baseCurrencyCredit: Math.round(grossAmount * exchangeRate * 100) / 100
        });
      } else {
        // Zero-rated / Exempt or non-taxable purchase
        lines.push({
          id: `jl-${Date.now()}-1`,
          accountCode: debitAccount.code,
          accountName: debitAccount.name,
          description: `${sourceDocumentNumber} - Expense/Inventory Net Asset`,
          debit: grossAmount,
          credit: 0,
          ...mergedDimensions,
          baseCurrencyDebit: Math.round(grossAmount * exchangeRate * 100) / 100,
          baseCurrencyCredit: 0
        });

        lines.push({
          id: `jl-${Date.now()}-2`,
          accountCode: creditAccount.code,
          accountName: creditAccount.name,
          description: `${sourceDocumentNumber} - Total Payable to Supplier (Gross)`,
          debit: 0,
          credit: grossAmount,
          ...mergedDimensions,
          baseCurrencyDebit: 0,
          baseCurrencyCredit: Math.round(grossAmount * exchangeRate * 100) / 100
        });
      }
    } else if (isSalesReturn) {
      // -----------------------------------------------------------------------
      // CUSTOMER CREDIT NOTE / SALES RETURN:
      // DR: Revenue [Account 4010] (reverses revenue, net amount)
      // DR: Output VAT Liability [Account 2020] (reverses output VAT, tax amount)
      // CR: Accounts Receivable [Account 1020] (reverses customer balance, gross)
      // -----------------------------------------------------------------------
      // Identify AR and Revenue accounts from resolved pair
      const isAR = (a: Account) => a.accountType === 'Receivable' || a.code === '1020' || a.category === 'Asset';
      const arAccount = isAR(debitAccount) ? debitAccount : creditAccount;
      const revenueAccount = arAccount === debitAccount ? creditAccount : debitAccount;

      if (effTaxAmount > 0 && taxAccount) {
        lines.push({
          id: `jl-${Date.now()}-1`,
          accountCode: revenueAccount.code,
          accountName: revenueAccount.name,
          description: `${sourceDocumentNumber} - Revenue Reversal / Return`,
          debit: netAmount,
          credit: 0,
          ...mergedDimensions,
          baseCurrencyDebit: Math.round(netAmount * exchangeRate * 100) / 100,
          baseCurrencyCredit: 0
        });

        lines.push({
          id: `jl-${Date.now()}-2`,
          accountCode: taxAccount.code,
          accountName: taxAccount.name,
          description: `${sourceDocumentNumber} - Output VAT Reversal Debit`,
          debit: effTaxAmount,
          credit: 0,
          ...mergedDimensions,
          baseCurrencyDebit: Math.round(effTaxAmount * exchangeRate * 100) / 100,
          baseCurrencyCredit: 0
        });

        lines.push({
          id: `jl-${Date.now()}-3`,
          accountCode: arAccount.code,
          accountName: arAccount.name,
          description: `${sourceDocumentNumber} - Customer Balance Reduction`,
          debit: 0,
          credit: grossAmount,
          ...mergedDimensions,
          baseCurrencyDebit: 0,
          baseCurrencyCredit: Math.round(grossAmount * exchangeRate * 100) / 100
        });
      } else {
        // Zero-rated or exempt sales return
        lines.push({
          id: `jl-${Date.now()}-1`,
          accountCode: revenueAccount.code,
          accountName: revenueAccount.name,
          description: `${sourceDocumentNumber} - Revenue Reversal / Return`,
          debit: grossAmount,
          credit: 0,
          ...mergedDimensions,
          baseCurrencyDebit: Math.round(grossAmount * exchangeRate * 100) / 100,
          baseCurrencyCredit: 0
        });

        lines.push({
          id: `jl-${Date.now()}-2`,
          accountCode: arAccount.code,
          accountName: arAccount.name,
          description: `${sourceDocumentNumber} - Customer Balance Reduction`,
          debit: 0,
          credit: grossAmount,
          ...mergedDimensions,
          baseCurrencyDebit: 0,
          baseCurrencyCredit: Math.round(grossAmount * exchangeRate * 100) / 100
        });
      }
    } else if (isPurchaseReturn) {
      // -----------------------------------------------------------------------
      // SUPPLIER DEBIT NOTE / PURCHASE RETURN:
      // DR: Accounts Payable [Account 2010] (reverses liability, gross amount)
      // CR: Expense / Inventory [Account 1030] (reduces expense/asset, net amount)
      // CR: Input VAT Recoverable [Account 1040] (reverses input tax, tax amount)
      // -----------------------------------------------------------------------
      // Identify AP and Inventory/Expense accounts
      const isAP = (a: Account) => a.accountType === 'Payable' || a.code === '2010' || a.category === 'Liability';
      const apAccount = isAP(creditAccount) ? creditAccount : (isAP(debitAccount) ? debitAccount : creditAccount);
      const invExpenseAccount = apAccount === creditAccount ? debitAccount : creditAccount;

      if (effTaxAmount > 0 && taxAccount) {
        lines.push({
          id: `jl-${Date.now()}-1`,
          accountCode: apAccount.code,
          accountName: apAccount.name,
          description: `${sourceDocumentNumber} - Accounts Payable Debit Reversal`,
          debit: grossAmount,
          credit: 0,
          ...mergedDimensions,
          baseCurrencyDebit: Math.round(grossAmount * exchangeRate * 100) / 100,
          baseCurrencyCredit: 0
        });

        lines.push({
          id: `jl-${Date.now()}-2`,
          accountCode: invExpenseAccount.code,
          accountName: invExpenseAccount.name,
          description: `${sourceDocumentNumber} - Inventory/Expense Credit Reduction`,
          debit: 0,
          credit: netAmount,
          ...mergedDimensions,
          baseCurrencyDebit: 0,
          baseCurrencyCredit: Math.round(netAmount * exchangeRate * 100) / 100
        });

        lines.push({
          id: `jl-${Date.now()}-3`,
          accountCode: taxAccount.code,
          accountName: taxAccount.name,
          description: `${sourceDocumentNumber} - Input VAT Recoverable Credit Reversal`,
          debit: 0,
          credit: effTaxAmount,
          ...mergedDimensions,
          baseCurrencyDebit: 0,
          baseCurrencyCredit: Math.round(effTaxAmount * exchangeRate * 100) / 100
        });
      } else {
        // Zero-rated / exempt purchase return
        lines.push({
          id: `jl-${Date.now()}-1`,
          accountCode: apAccount.code,
          accountName: apAccount.name,
          description: `${sourceDocumentNumber} - Accounts Payable Debit Reversal`,
          debit: grossAmount,
          credit: 0,
          ...mergedDimensions,
          baseCurrencyDebit: Math.round(grossAmount * exchangeRate * 100) / 100,
          baseCurrencyCredit: 0
        });

        lines.push({
          id: `jl-${Date.now()}-2`,
          accountCode: invExpenseAccount.code,
          accountName: invExpenseAccount.name,
          description: `${sourceDocumentNumber} - Inventory/Expense Credit Reduction`,
          debit: 0,
          credit: grossAmount,
          ...mergedDimensions,
          baseCurrencyDebit: 0,
          baseCurrencyCredit: Math.round(grossAmount * exchangeRate * 100) / 100
        });
      }
    } else if (isPaymentReversal) {
      // -----------------------------------------------------------------------
      // PAYMENT REVERSALS
      // -----------------------------------------------------------------------
      if (eventType === 'CUSTOMER_PAYMENT_REVERSED') {
        // Reverse customer receipt: DR AR (1020), CR Bank (1010)
        lines.push({
          id: `jl-${Date.now()}-1`,
          accountCode: creditAccount.code,
          accountName: creditAccount.name,
          description: `${sourceDocumentNumber} - Customer Payment Reversal AR Restoration`,
          debit: grossAmount,
          credit: 0,
          ...mergedDimensions,
          baseCurrencyDebit: Math.round(grossAmount * exchangeRate * 100) / 100,
          baseCurrencyCredit: 0
        });

        lines.push({
          id: `jl-${Date.now()}-2`,
          accountCode: debitAccount.code,
          accountName: debitAccount.name,
          description: `${sourceDocumentNumber} - Customer Payment Reversal Cash Deduction`,
          debit: 0,
          credit: grossAmount,
          ...mergedDimensions,
          baseCurrencyDebit: 0,
          baseCurrencyCredit: Math.round(grossAmount * exchangeRate * 100) / 100
        });
      } else {
        // Reverse supplier payment: DR Bank (1010), CR AP (2010)
        lines.push({
          id: `jl-${Date.now()}-1`,
          accountCode: creditAccount.code,
          accountName: creditAccount.name,
          description: `${sourceDocumentNumber} - Supplier Payment Reversal Cash Restoration`,
          debit: grossAmount,
          credit: 0,
          ...mergedDimensions,
          baseCurrencyDebit: Math.round(grossAmount * exchangeRate * 100) / 100,
          baseCurrencyCredit: 0
        });

        lines.push({
          id: `jl-${Date.now()}-2`,
          accountCode: debitAccount.code,
          accountName: debitAccount.name,
          description: `${sourceDocumentNumber} - Supplier Payment Reversal AP Restoration`,
          debit: 0,
          credit: grossAmount,
          ...mergedDimensions,
          baseCurrencyDebit: 0,
          baseCurrencyCredit: Math.round(grossAmount * exchangeRate * 100) / 100
        });
      }
    } else if (effTaxAmount > 0 && taxAccount) {
      // -----------------------------------------------------------------------
      // STANDARD SALES INVOICE WITH OUTPUT VAT:
      // DR: Accounts Receivable [Account 1020] (gross amount)
      // CR: Revenue [Account 4010] (net amount)
      // CR: Output VAT Liability [Account 2020] (tax amount)
      // -----------------------------------------------------------------------
      lines.push({
        id: `jl-${Date.now()}-1`,
        accountCode: debitAccount.code,
        accountName: debitAccount.name,
        description: `${sourceDocumentNumber} - Total Receivable/Debit`,
        debit: grossAmount,
        credit: 0,
        ...mergedDimensions,
        baseCurrencyDebit: Math.round(grossAmount * exchangeRate * 100) / 100,
        baseCurrencyCredit: 0
      });

      lines.push({
        id: `jl-${Date.now()}-2`,
        accountCode: creditAccount.code,
        accountName: creditAccount.name,
        description: `${sourceDocumentNumber} - Net Revenue/Credit`,
        debit: 0,
        credit: netAmount,
        ...mergedDimensions,
        baseCurrencyDebit: 0,
        baseCurrencyCredit: Math.round(netAmount * exchangeRate * 100) / 100
      });

      lines.push({
        id: `jl-${Date.now()}-3`,
        accountCode: taxAccount.code,
        accountName: taxAccount.name,
        description: `${sourceDocumentNumber} - Output VAT Liability Credit`,
        debit: 0,
        credit: effTaxAmount,
        ...mergedDimensions,
        baseCurrencyDebit: 0,
        baseCurrencyCredit: Math.round(effTaxAmount * exchangeRate * 100) / 100
      });
    } else {
      // -----------------------------------------------------------------------
      // STANDARD TWO-LEGGED TRANSACTION (Cash receipts, disbursements, or tax=0)
      // -----------------------------------------------------------------------
      lines.push({
        id: `jl-${Date.now()}-1`,
        accountCode: debitAccount.code,
        accountName: debitAccount.name,
        description: `${sourceDocumentNumber} - Debit Entry`,
        debit: grossAmount,
        credit: 0,
        ...mergedDimensions,
        baseCurrencyDebit: Math.round(grossAmount * exchangeRate * 100) / 100,
        baseCurrencyCredit: 0
      });

      lines.push({
        id: `jl-${Date.now()}-2`,
        accountCode: creditAccount.code,
        accountName: creditAccount.name,
        description: `${sourceDocumentNumber} - Credit Entry`,
        debit: 0,
        credit: grossAmount,
        ...mergedDimensions,
        baseCurrencyDebit: 0,
        baseCurrencyCredit: Math.round(grossAmount * exchangeRate * 100) / 100
      });
    }

    // =========================================================================
    // 3. INVARIANT ENFORCEMENT: TOTAL DEBITS = TOTAL CREDITS
    // =========================================================================
    let totalDebit = Math.round(lines.reduce((s, l) => s + (l.debit || 0), 0) * 100) / 100;
    let totalCredit = Math.round(lines.reduce((s, l) => s + (l.credit || 0), 0) * 100) / 100;

    // Handle micro-penny rounding differences (<= 0.02) from multi-line tax breakdowns
    const diff = Math.round((totalDebit - totalCredit) * 100) / 100;
    if (Math.abs(diff) > 0 && Math.abs(diff) <= 0.02) {
      // Find the primary revenue or expense line to absorb the 1-cent variance
      const primaryLine = lines.find(l => l.accountCode !== '1040' && l.accountCode !== '2020');
      if (primaryLine) {
        if (primaryLine.debit > 0) {
          primaryLine.debit = Math.round((primaryLine.debit - diff) * 100) / 100;
        } else if (primaryLine.credit > 0) {
          primaryLine.credit = Math.round((primaryLine.credit + diff) * 100) / 100;
        }
        totalDebit = Math.round(lines.reduce((s, l) => s + (l.debit || 0), 0) * 100) / 100;
        totalCredit = Math.round(lines.reduce((s, l) => s + (l.credit || 0), 0) * 100) / 100;
      }
    }

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(
        `CRITICAL ACCOUNTING INVARIANT VIOLATION: Total Debits (${totalDebit}) do not match Total Credits (${totalCredit}) for ${sourceDocumentType} ${sourceDocumentNumber}`
      );
    }

    // =========================================================================
    // 4. CRYPTOGRAPHIC AUDIT SEAL (SHA-256)
    // =========================================================================
    const signaturePayload = `${entryNumber}|${tenantId}|${companyId}|${today}|${totalDebit}|${totalCredit}|${lines.map(l => `${l.accountCode}:${l.debit}:${l.credit}`).join(';')}`;
    const digitalSignature = crypto.createHash('sha256').update(signaturePayload).digest('hex');

    // =========================================================================
    // 5. CONSTRUCT AUTHORITATIVE JOURNAL ENTRY
    // =========================================================================
    lines.forEach(l => {
      if (!l.accountId) {
        l.accountId = l.accountCode;
      }
    });

    const newJE: JournalEntry = {
      id: `je-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      companyId,
      branchId: dimensions.branchId,
      warehouseId: dimensions.warehouseId,
      departmentId: mergedDimensions.departmentId,
      costCenterId: mergedDimensions.costCenterId,
      profitCenterId: mergedDimensions.profitCenterId,
      projectId: dimensions.projectId,
      entryNumber,
      date: today,
      postingDate: today,
      reference: sourceDocumentNumber,
      description: description || `Auto-posted via Financial Events Engine for ${sourceDocumentType} ${sourceDocumentNumber}`,
      status: 'Posted',
      lines,
      totalDebit,
      totalCredit,
      currency,
      exchangeRate,
      originatingDocumentType: sourceDocumentType,
      originatingDocumentId: sourceDocumentId,
      originatingDocumentNumber: sourceDocumentNumber,
      isAutoGenerated: true,
      createdBy: triggeredBy,
      createdByName: triggeredByName,
      createdAt: new Date().toISOString(),
      approvedBy: 'System Financial Event Engine',
      approvedAt: new Date().toISOString(),
      digitalSignature
    };

    // =========================================================================
    // 6. ATOMIC GENERAL LEDGER POSTING WITH AUTOMATIC ROLLBACK
    // =========================================================================
    const balanceSnapshots: { acc: Account; originalBalance: number }[] = [];
    try {
      lines.forEach((line) => {
        const acc = accounts.find(a => a.code === line.accountCode && (!companyId || !a.companyId || a.companyId === companyId));
        if (acc) {
          balanceSnapshots.push({ acc, originalBalance: acc.balance });
          if (acc.category === 'Asset' || acc.category === 'Expense') {
            acc.balance = Math.round((acc.balance + (Number(line.debit) - Number(line.credit))) * 100) / 100;
          } else {
            acc.balance = Math.round((acc.balance + (Number(line.credit) - Number(line.debit))) * 100) / 100;
          }
        } else {
          throw new Error(`CRITICAL ACCOUNTING ERROR: Account ${line.accountCode} not found in scope for posting`);
        }
      });
    } catch (glError: any) {
      // Rollback all account balances immediately
      balanceSnapshots.forEach(snap => {
        snap.acc.balance = snap.originalBalance;
      });
      const failedEvent: FinancialEvent = {
        id: `fe-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenantId,
        companyId,
        eventType,
        sourceDocumentType,
        sourceDocumentId,
        sourceDocumentNumber,
        amount,
        taxAmount,
        discountAmount,
        currency,
        exchangeRate,
        baseCurrencyAmount: amount * exchangeRate,
        eventDate: today,
        description: `Failed GL Posting: ${glError.message}`,
        status: 'FAILED',
        triggeredBy
      };
      financialEventsList.unshift(failedEvent);
      throw glError;
    }

    journalEntriesList.unshift(newJE);

    // =========================================================================
    // 7. RECORD AUDIT TRAIL & FINANCIAL EVENT
    // =========================================================================
    const finEvent: FinancialEvent = {
      id: `fe-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      companyId,
      branchId: dimensions.branchId,
      warehouseId: dimensions.warehouseId,
      departmentId: mergedDimensions.departmentId,
      costCenterId: mergedDimensions.costCenterId,
      profitCenterId: mergedDimensions.profitCenterId,
      projectId: dimensions.projectId,
      employeeId: dimensions.employeeId,
      partyId,
      partyName,
      eventType,
      sourceDocumentType,
      sourceDocumentId,
      sourceDocumentNumber,
      amount,
      taxAmount,
      discountAmount,
      currency,
      exchangeRate,
      baseCurrencyAmount: amount * exchangeRate,
      eventDate: today,
      description: newJE.description,
      triggeredBy,
      status: 'PROCESSED',
      journalEntryId: newJE.id
    };

    financialEventsList.unshift(finEvent);

    // Record Audit
    recordAuditFn(
      tenantId,
      triggeredBy,
      triggeredByName,
      'System Financial Event Engine',
      'POST',
      sourceDocumentType,
      sourceDocumentId,
      `Financial Event [${eventType}] processed: Generated GL Journal Entry ${entryNumber} (${amount.toLocaleString()} ${currency})`,
      sourceDocumentNumber
    );

    return { journalEntry: newJE, financialEvent: finEvent };
  }
}
