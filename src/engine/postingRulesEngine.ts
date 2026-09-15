/**
 * Enterprise Configurable Posting Rules Engine
 * Replaces hardcoded accounting logic with dynamic per-tenant configuration
 */

import { Account, FinancialEvent, JournalEntry, PostingRule } from '../types';
import { FinancialEventEngine } from './financialEventEngine';

export interface ResolvedPostingAccounts {
  ruleId?: string;
  ruleName?: string;
  debitAccount: Account;
  creditAccount: Account;
  taxAccount?: Account;
  discountAccount?: Account;
  costCenterId?: string;
  profitCenterId?: string;
  departmentId?: string;
}

const DOCUMENT_TYPE_ALIASES: Record<string, string> = {
  // Sales side
  'SalesInvoice': 'SalesInvoice',
  'CustomerSalesInvoice': 'SalesInvoice',
  'AR_INVOICE': 'SalesInvoice',
  'SALES_INVOICE': 'SalesInvoice',
  'CustomerInvoice': 'SalesInvoice',
  'EVT_SALES_INVOICE_POSTED': 'SalesInvoice',
  'POSReceipt': 'SalesInvoice',
  'POS_SALE': 'SalesInvoice',
  'EVT_POS_CASH_RECEIPT': 'CustomerPayment',
  
  // Purchase side
  'PurchaseInvoice': 'PurchaseInvoice',
  'SupplierInvoice': 'PurchaseInvoice',
  'AP_INVOICE': 'PurchaseInvoice',
  'PURCHASE_INVOICE': 'PurchaseInvoice',
  'SupplierBill': 'PurchaseInvoice',
  'VOUCHER': 'PurchaseInvoice',
  
  // Payment side
  'CustomerPayment': 'CustomerPayment',
  'CustomerReceipt': 'CustomerPayment',
  'AR_RECEIPT': 'CustomerPayment',
  'CUSTOMER_PAYMENT': 'CustomerPayment',
  'EVT_AR_RECEIPT_POSTED': 'CustomerPayment',
  'SupplierPayment': 'SupplierPayment',
  'PaymentBatch': 'SupplierPayment',
  'AP_PAYMENT': 'SupplierPayment',
  'SUPPLIER_PAYMENT': 'SupplierPayment',
  
  // Returns / Credit / Debit notes
  'CustomerCreditNote': 'CustomerCreditNote',
  'CreditNote': 'CustomerCreditNote',
  'SALES_RETURN': 'CustomerCreditNote',
  'CUSTOMER_CREDIT_NOTE_POSTED': 'CustomerCreditNote',
  'CustomerDebitNote': 'CustomerCreditNote',
  'SupplierDebitNote': 'SupplierDebitNote',
  'DebitNote': 'SupplierDebitNote',
  'PURCHASE_RETURN': 'SupplierDebitNote',
  'SUPPLIER_DEBIT_NOTE_POSTED': 'SupplierDebitNote',
  'SupplierCreditNote': 'SupplierDebitNote',
  'VendorReturnNote': 'SupplierDebitNote',
  'VENDOR_RETURN_POSTED': 'SupplierDebitNote',

  // Inventory
  'StockReceipt': 'StockReceipt',
  'GoodsReceiptNote': 'StockReceipt',
  'GOODS_RECEIPT_POSTED': 'StockReceipt',
  'StockIssue': 'StockIssue',
  'GoodsIssueNote': 'StockIssue',
  'GOODS_ISSUE_POSTED': 'StockIssue'
};

export class PostingRulesEngine {
  /**
   * Resolves the configured accounting posting rule for a tenant and document type
   */
  static resolveRule(
    tenantId: string,
    documentType: string,
    postingRules: PostingRule[],
    accounts: Account[],
    companyId?: string
  ): ResolvedPostingAccounts | null {
    const canonicalDocType = DOCUMENT_TYPE_ALIASES[documentType] || documentType;

    // 1. Search for matching active rule by tenant, canonicalDocType, companyId
    let rule = postingRules.find(
      r => r.tenantId === tenantId && (r.documentType === canonicalDocType || r.documentType === documentType) && r.isActive && (!companyId || r.companyId === companyId)
    );

    // 2. Fallback to generic rule if tenant specific not found
    if (!rule) {
      rule = postingRules.find(r => (r.documentType === canonicalDocType || r.documentType === documentType) && r.isActive);
    }

    // 3. Fallback to base transaction document type if return/credit note specific rule not defined
    if (!rule) {
      if (['CustomerCreditNote', 'CreditNote', 'SALES_RETURN', 'CUSTOMER_CREDIT_NOTE_POSTED'].includes(canonicalDocType)) {
        rule = postingRules.find(r => r.tenantId === tenantId && r.documentType === 'SalesInvoice' && r.isActive && (!companyId || r.companyId === companyId)) ||
               postingRules.find(r => r.documentType === 'SalesInvoice' && r.isActive);
      } else if (['SupplierDebitNote', 'DebitNote', 'PURCHASE_RETURN', 'SUPPLIER_DEBIT_NOTE_POSTED', 'SupplierCreditNote', 'VendorReturnNote'].includes(canonicalDocType)) {
        rule = postingRules.find(r => r.tenantId === tenantId && r.documentType === 'PurchaseInvoice' && r.isActive && (!companyId || r.companyId === companyId)) ||
               postingRules.find(r => r.documentType === 'PurchaseInvoice' && r.isActive);
      }
    }

    if (!rule) {
      console.error(`PostingRulesEngine: No active posting rule found for documentType "${documentType}" in tenant "${tenantId}"`);
      return null;
    }

    // Account lookup: prefer tenant & company match, then fallback to code lookup
    const findAccount = (code: string): Account | undefined => {
      // 1. Exact match for tenant and company
      let acc = accounts.find(a => a.code === code && a.isActive && (!tenantId || !a.tenantId || a.tenantId === tenantId) && (!companyId || !a.companyId || a.companyId === companyId));
      // 2. Match for tenant by code
      if (!acc) {
        acc = accounts.find(a => a.code === code && a.isActive && (!tenantId || !a.tenantId || a.tenantId === tenantId));
      }
      // 3. Match by code across accounts
      if (!acc) {
        acc = accounts.find(a => a.code === code && a.isActive);
      }
      return acc;
    };

    const debitAccount = findAccount(rule.debitAccountCode);
    const creditAccount = findAccount(rule.creditAccountCode);
    const taxAccount = rule.taxAccountCode ? findAccount(rule.taxAccountCode) : undefined;
    const discountAccount = rule.discountAccountCode ? findAccount(rule.discountAccountCode) : undefined;

    if (!debitAccount || !creditAccount) {
      console.error(`PostingRulesEngine: Invalid GL accounts for rule ${rule.name}. Debit: ${rule.debitAccountCode}, Credit: ${rule.creditAccountCode}`);
      return null;
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      debitAccount,
      creditAccount,
      taxAccount,
      discountAccount,
      costCenterId: rule.costCenterId,
      profitCenterId: rule.profitCenterId,
      departmentId: rule.departmentId
    };
  }

  /**
   * Process a financial event and generate an authoritative Journal Entry
   * Supports strict idempotency via idempotencyKey, sourceDocumentId, or existing journal entries.
   */
  static processFinancialEvent(
    event: any,
    postingRules: PostingRule[],
    accounts: Account[],
    journalEntriesList: JournalEntry[],
    financialEventsList: FinancialEvent[],
    generateDocNumFn: (tenantId: string, entityType: 'JE') => string,
    recordAuditFn?: (...args: any[]) => void
  ): { journalEntry: JournalEntry | null; financialEvent: FinancialEvent } {
    const tenantId = event.tenantId || 'ten-001';
    const companyId = event.companyId || 'comp-001';
    const idempotencyKey = event.idempotencyKey || (event as any).payload?.idempotencyKey;
    const sourceDocumentId = event.sourceDocumentId || event.payload?.invoiceId || event.id;
    const sourceDocumentNumber = event.sourceDocumentNumber || event.payload?.invoiceNumber || sourceDocumentId;
    const sourceDocumentType = event.sourceDocumentType || event.documentType || 'PurchaseInvoice';

    // 1. Check existing by idempotencyKey
    if (idempotencyKey) {
      const existingByKey = financialEventsList.find(
        fe => (fe as any).idempotencyKey === idempotencyKey
      );
      if (existingByKey) {
        const je = journalEntriesList.find(j => j.id === existingByKey.journalEntryId) || null;
        return { journalEntry: je, financialEvent: existingByKey };
      }
    }

    // 2. Check existing by source document in financialEvents
    const existingFE = financialEventsList.find(
      fe => fe.tenantId === tenantId &&
            fe.companyId === companyId &&
            fe.sourceDocumentId === sourceDocumentId &&
            fe.status === 'PROCESSED'
    );
    if (existingFE) {
      const existingJE = journalEntriesList.find(
        je => (existingFE.journalEntryId && je.id === existingFE.journalEntryId) ||
              (je.originatingDocumentId === sourceDocumentId)
      ) || null;
      return { journalEntry: existingJE, financialEvent: existingFE };
    }

    // 3. Check existing by source document in posted journalEntries
    const existingJE = journalEntriesList.find(
      je => je.tenantId === tenantId &&
            je.companyId === companyId &&
            je.originatingDocumentId === sourceDocumentId &&
            je.status === 'Posted'
    );
    if (existingJE) {
      let matchingFE = financialEventsList.find(fe => fe.journalEntryId === existingJE.id);
      if (!matchingFE) {
        matchingFE = {
          id: `fe-${Date.now()}-existing`,
          tenantId,
          companyId,
          eventType: event.eventType,
          sourceDocumentType,
          sourceDocumentId,
          sourceDocumentNumber,
          amount: event.amount || event.payload?.grossAmount || 0,
          currency: event.currency || event.payload?.currency || 'SAR',
          status: 'PROCESSED',
          journalEntryId: existingJE.id
        } as FinancialEvent;
        if (idempotencyKey) (matchingFE as any).idempotencyKey = idempotencyKey;
        financialEventsList.unshift(matchingFE);
      }
      return { journalEntry: existingJE, financialEvent: matchingFE };
    }

    const payload = event.payload || {};
    const grossAmount = Number(event.totalAmount || event.amount || payload.grossAmount || 0);
    const taxAmount = Number(event.taxAmount ?? payload.taxAmount ?? 0);
    const currency = event.currency || payload.currency || 'SAR';
    const exchangeRate = Number(event.exchangeRate || payload.exchangeRate || 1.0);
    const partyId = event.partyId || payload.vendorId || payload.customerId;
    const partyName = event.partyName || payload.vendorName || payload.customerName;

    const result = FinancialEventEngine.processEvent(
      {
        tenantId,
        companyId,
        eventType: event.eventType,
        sourceDocumentType,
        sourceDocumentId,
        sourceDocumentNumber,
        amount: grossAmount,
        taxAmount,
        currency,
        exchangeRate,
        partyId,
        partyName,
        description: event.description || `Auto-posted financial event for ${sourceDocumentNumber}`,
        dimensions: event.dimensions || { companyId, tenantId },
        triggeredBy: event.triggeredBy || 'pilot-user',
        triggeredByName: event.triggeredByName || 'Pilot Operator'
      },
      postingRules,
      accounts,
      journalEntriesList,
      financialEventsList,
      generateDocNumFn,
      recordAuditFn || (() => {})
    );

    if (result.financialEvent && idempotencyKey) {
      (result.financialEvent as any).idempotencyKey = idempotencyKey;
    }

    return result;
  }
}
