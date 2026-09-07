/**
 * Enterprise Financial Event Engine
 * Core event-driven accounting engine that converts business events into balanced GL Journal Entries with complete 12 Dimensions
 */

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

    // 1. Resolve posting rule for document/event type
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

    // 2. Build multi-line Journal Entry lines with full dimensions
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

    if (taxAmount > 0 && taxAccount) {
      // Net Amount = Total - Tax Amount
      const netAmount = amount - taxAmount;

      lines.push({
        id: `jl-${Date.now()}-1`,
        accountCode: debitAccount.code,
        accountName: debitAccount.name,
        description: `${sourceDocumentNumber} - Total Receivable/Debit`,
        debit: amount,
        credit: 0,
        ...mergedDimensions,
        baseCurrencyDebit: amount * exchangeRate,
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
        baseCurrencyCredit: netAmount * exchangeRate
      });

      lines.push({
        id: `jl-${Date.now()}-3`,
        accountCode: taxAccount.code,
        accountName: taxAccount.name,
        description: `${sourceDocumentNumber} - Tax/VAT Component`,
        debit: 0,
        credit: taxAmount,
        ...mergedDimensions,
        baseCurrencyDebit: 0,
        baseCurrencyCredit: taxAmount * exchangeRate
      });
    } else {
      lines.push({
        id: `jl-${Date.now()}-1`,
        accountCode: debitAccount.code,
        accountName: debitAccount.name,
        description: `${sourceDocumentNumber} - Debit Entry`,
        debit: amount,
        credit: 0,
        ...mergedDimensions,
        baseCurrencyDebit: amount * exchangeRate,
        baseCurrencyCredit: 0
      });

      lines.push({
        id: `jl-${Date.now()}-2`,
        accountCode: creditAccount.code,
        accountName: creditAccount.name,
        description: `${sourceDocumentNumber} - Credit Entry`,
        debit: 0,
        credit: amount,
        ...mergedDimensions,
        baseCurrencyDebit: 0,
        baseCurrencyCredit: amount * exchangeRate
      });
    }

    // 3. Construct Journal Entry Header
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
      totalDebit: amount,
      totalCredit: amount,
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
      digitalSignature: `SIG-FE-${Date.now()}`
    };

    // 4. Update General Ledger Account Balances
    lines.forEach((line) => {
      const acc = accounts.find(a => a.code === line.accountCode);
      if (acc) {
        if (acc.category === 'Asset' || acc.category === 'Expense') {
          acc.balance += (Number(line.debit) - Number(line.credit));
        } else {
          acc.balance += (Number(line.credit) - Number(line.debit));
        }
      }
    });

    journalEntriesList.unshift(newJE);

    // 5. Create Financial Event Log
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
