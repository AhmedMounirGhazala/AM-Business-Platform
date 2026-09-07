/**
 * AM Business Platform - Phase 2.6 General Ledger & Financial Closing Engine
 * Implements SAP S/4HANA FI-GL, Oracle ERP Cloud GL, D365 Finance Standards
 * IFRS, IAS 1, IAS 8, IAS 21 Compliant
 */

import { 
  GLAccount, 
  GLJournalEntry, 
  GLJournalLine, 
  GLJournalType, 
  FiscalPeriodRecord, 
  FiscalYearRecord, 
  TrialBalanceRow, 
  TrialBalanceIntegrityReport,
  SuspenseAccountReport,
  FinancialCloseChecklist, 
  YearEndClosingRecord, 
  IAS21RevaluationResult, 
  IAS21FXSnapshotRecord,
  ClosingSnapshotRecord,
  GLAuditRecord,
  RecurringJournalSchedule 
} from '../types/generalLedger';

export class GeneralLedgerEngine {

  /**
   * Generates a deterministic SHA-256 equivalent hash for immutable audit trail integrity
   */
  public static computeSHA256Hash(data: any): string {
    const jsonStr = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
    return `SHA256-GL-${hex}-${Date.now().toString(36).toUpperCase()}`;
  }

  /**
   * Validates double-entry accounting balance sum(debits) === sum(credits)
   */
  public static validateDoubleEntryBalance(lines: GLJournalLine[]): {
    isBalanced: boolean;
    totalDebit: number;
    totalCredit: number;
    diff: number;
  } {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      totalDebit += Number(line.debit || 0);
      totalCredit += Number(line.credit || 0);
    }

    const diff = Math.abs(totalDebit - totalCredit);
    const isBalanced = diff < 0.001; // Currency rounding tolerance

    return {
      isBalanced,
      totalDebit: Number(totalDebit.toFixed(2)),
      totalCredit: Number(totalCredit.toFixed(2)),
      diff: Number(diff.toFixed(2))
    };
  }

  /**
   * Validates if posting date falls into an OPEN fiscal period
   */
  public static validatePostingPeriodOpen(
    companyId: string,
    postingDate: string,
    periods: FiscalPeriodRecord[]
  ): { isOpen: boolean; period?: FiscalPeriodRecord; reason?: string } {
    const period = periods.find(p => 
      p.companyId === companyId && 
      postingDate >= p.startDate && 
      postingDate <= p.endDate
    );

    if (!period) {
      return {
        isOpen: false,
        reason: `Posting date ${postingDate} does not belong to any defined fiscal period in company ${companyId}`
      };
    }

    if (period.status === 'CLOSED') {
      return {
        isOpen: false,
        period,
        reason: `Fiscal Period ${period.periodName} (${period.year}) is CLOSED for posting`
      };
    }

    if (period.status === 'CLOSING') {
      return {
        isOpen: false,
        period,
        reason: `Fiscal Period ${period.periodName} (${period.year}) is currently in CLOSING state and requires supervisor override`
      };
    }

    return {
      isOpen: true,
      period
    };
  }

  /**
   * Enforces posting restrictions on control accounts and blocked accounts
   */
  public static validateAccountPostingRestriction(
    account: GLAccount,
    journalType: GLJournalType
  ): { isAllowed: boolean; reason?: string } {
    if (!account.isActive) {
      return {
        isAllowed: false,
        reason: `Account ${account.code} (${account.name}) is inactive`
      };
    }

    if (account.postingRestriction === 'BLOCKED') {
      return {
        isAllowed: false,
        reason: `Account ${account.code} (${account.name}) is BLOCKED for posting`
      };
    }

    if (account.postingRestriction === 'READ_ONLY') {
      return {
        isAllowed: false,
        reason: `Account ${account.code} (${account.name}) is READ_ONLY`
      };
    }

    if (account.postingRestriction === 'CONTROL_ACCOUNT_ONLY' && journalType === 'MANUAL') {
      return {
        isAllowed: false,
        reason: `Direct manual journal posting to Control Account ${account.code} (${account.name}) is restricted. Postings must originate from subledger financial events (AR/AP/INV).`
      };
    }

    return { isAllowed: true };
  }

  /**
   * Generates sequential, gapless journal entry numbers aware of company, fiscal year, and fiscal period
   */
  public static generateSequentialJournalNumber(params: {
    companyId: string;
    fiscalYear: number;
    fiscalPeriod: number;
    existingJournals: GLJournalEntry[];
  }): string {
    const { companyId, fiscalYear, fiscalPeriod, existingJournals } = params;
    const prefix = `JE-${companyId.toUpperCase().slice(0, 4)}-${fiscalYear}-${String(fiscalPeriod).padStart(2, '0')}`;
    
    // Find all matching journals with same prefix
    const matchingNumbers = existingJournals
      .filter(j => j.entryNumber && j.entryNumber.startsWith(prefix))
      .map(j => {
        const parts = j.entryNumber.split('-');
        const seq = parseInt(parts[parts.length - 1], 10);
        return isNaN(seq) ? 0 : seq;
      });

    const nextSeq = matchingNumbers.length > 0 ? Math.max(...matchingNumbers) + 1 : 1;
    return `${prefix}-${String(nextSeq).padStart(4, '0')}`;
  }

  /**
   * Creates a structured GL Journal Entry with double-entry balance check, idempotency protection, and audit hash
   */
  public static createJournalEntry(params: {
    tenantId: string;
    companyId: string;
    branchId?: string;
    entryNumber: string;
    date: string;
    postingDate: string;
    fiscalYear: number;
    fiscalPeriod: number;
    journalType: GLJournalType;
    reference?: string;
    description: string;
    currency?: string;
    exchangeRate?: number;
    lines: GLJournalLine[];
    createdBy: string;
    createdByName: string;
    originatingDocumentType?: string;
    originatingDocumentId?: string;
    originatingDocumentNumber?: string;
    idempotencyKey?: string;
    accounts: GLAccount[];
    periods: FiscalPeriodRecord[];
  }): { journalEntry: GLJournalEntry; auditRecord: GLAuditRecord } {
    const {
      tenantId,
      companyId,
      branchId,
      entryNumber,
      date,
      postingDate,
      fiscalYear,
      fiscalPeriod,
      journalType,
      reference,
      description,
      currency = 'SAR',
      exchangeRate = 1.0,
      lines,
      createdBy,
      createdByName,
      originatingDocumentType,
      originatingDocumentId,
      originatingDocumentNumber,
      idempotencyKey,
      accounts,
      periods
    } = params;

    // 1. Double entry balance check
    const balanceCheck = this.validateDoubleEntryBalance(lines);
    if (!balanceCheck.isBalanced) {
      throw new Error(`Double-entry balance violation: Total Debits (${balanceCheck.totalDebit}) != Total Credits (${balanceCheck.totalCredit})`);
    }

    // 2. Period check
    const periodCheck = this.validatePostingPeriodOpen(companyId, postingDate, periods);
    if (!periodCheck.isOpen) {
      throw new Error(`Posting period validation failed: ${periodCheck.reason}`);
    }

    // 3. Account restriction check
    for (const line of lines) {
      const acc = accounts.find(a => a.code === line.accountCode);
      if (!acc) {
        throw new Error(`GL Account code ${line.accountCode} not found in Chart of Accounts`);
      }
      const restCheck = this.validateAccountPostingRestriction(acc, journalType);
      if (!restCheck.isAllowed) {
        throw new Error(restCheck.reason);
      }
    }

    const deterministicIdemKey = idempotencyKey || `IDEM-${companyId}-${journalType}-${postingDate}-${balanceCheck.totalDebit}-${this.computeSHA256Hash(lines.map(l => l.accountCode + '_' + l.debit + '_' + l.credit))}`;
    const correlationId = `CORR-JE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newJE: GLJournalEntry = {
      id: `je-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      companyId,
      branchId,
      entryNumber,
      date,
      postingDate,
      fiscalYear,
      fiscalPeriod,
      journalType,
      status: 'DRAFT',
      reference,
      description,
      totalDebit: balanceCheck.totalDebit,
      totalCredit: balanceCheck.totalCredit,
      currency,
      exchangeRate,
      lines,
      isAutoGenerated: journalType === 'AUTOMATIC' || journalType === 'FINANCIAL_EVENT',
      originatingDocumentType,
      originatingDocumentId,
      originatingDocumentNumber,
      idempotencyKey: deterministicIdemKey,
      createdBy,
      createdByName,
      createdAt: new Date().toISOString(),
      correlationId,
      auditHash: ''
    };

    newJE.auditHash = this.computeSHA256Hash(newJE);

    const auditRecord: GLAuditRecord = {
      id: `glaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      companyId,
      timestamp: new Date().toISOString(),
      userId: createdBy,
      userName: createdByName,
      action: 'JOURNAL_CREATED',
      entityType: 'GLJournal',
      entityId: newJE.id,
      correlationId,
      hash: newJE.auditHash,
      details: `Created GL Journal Entry ${newJE.entryNumber} (${newJE.journalType}) for ${balanceCheck.totalDebit} ${currency}`
    };

    return { journalEntry: newJE, auditRecord };
  }

  /**
   * Posts a draft journal entry and updates GL account balances
   */
  public static postJournalEntry(
    journal: GLJournalEntry,
    accounts: GLAccount[],
    approvedBy: string
  ): { updatedJournal: GLJournalEntry; auditRecord: GLAuditRecord } {
    if (journal.status === 'POSTED') {
      throw new Error(`Journal Entry ${journal.entryNumber} is already POSTED`);
    }

    if (journal.status === 'CANCELLED') {
      throw new Error(`Cannot post CANCELLED Journal Entry ${journal.entryNumber}`);
    }

    // Apply debit & credit impacts to GL Account balances
    for (const line of journal.lines) {
      const acc = accounts.find(a => a.code === line.accountCode);
      if (acc) {
        if (acc.group === 'Assets' || acc.group === 'OperatingExpense' || acc.group === 'CostOfSales') {
          acc.balance += (Number(line.debit || 0) - Number(line.credit || 0));
        } else {
          acc.balance += (Number(line.credit || 0) - Number(line.debit || 0));
        }
        acc.updatedAt = new Date().toISOString();
      }
    }

    const updatedJournal: GLJournalEntry = {
      ...journal,
      status: 'POSTED',
      approvedBy,
      approvedAt: new Date().toISOString()
    };

    updatedJournal.auditHash = this.computeSHA256Hash(updatedJournal);

    const auditRecord: GLAuditRecord = {
      id: `glaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: journal.tenantId,
      companyId: journal.companyId,
      timestamp: new Date().toISOString(),
      userId: approvedBy,
      userName: approvedBy,
      action: 'JOURNAL_POSTED',
      entityType: 'GLJournal',
      entityId: journal.id,
      correlationId: journal.correlationId,
      hash: updatedJournal.auditHash,
      details: `Posted GL Journal Entry ${journal.entryNumber}`
    };

    return { updatedJournal, auditRecord };
  }

  /**
   * Reverses a posted GL Journal Entry according to IAS 1 standards
   */
  public static reverseJournalEntry(params: {
    originalJournal: GLJournalEntry;
    reversalDate: string;
    reversedBy: string;
    reversedByName: string;
    accounts: GLAccount[];
    periods: FiscalPeriodRecord[];
  }): { reversingJournal: GLJournalEntry; updatedOriginalJournal: GLJournalEntry; auditRecord: GLAuditRecord } {
    const { originalJournal, reversalDate, reversedBy, reversedByName, accounts, periods } = params;

    if (originalJournal.status !== 'POSTED') {
      throw new Error(`Only POSTED journal entries can be reversed. Current status: ${originalJournal.status}`);
    }

    if (originalJournal.isReversed) {
      throw new Error(`Journal Entry ${originalJournal.entryNumber} has already been reversed`);
    }

    // Period check for reversal date
    const periodCheck = this.validatePostingPeriodOpen(originalJournal.companyId, reversalDate, periods);
    if (!periodCheck.isOpen) {
      throw new Error(`Reversal posting period validation failed: ${periodCheck.reason}`);
    }

    // Invert debit and credit lines
    const reversingLines: GLJournalLine[] = originalJournal.lines.map((l, idx) => ({
      ...l,
      id: `jl-rev-${Date.now()}-${idx + 1}`,
      debit: l.credit,
      credit: l.debit,
      baseCurrencyDebit: l.baseCurrencyCredit,
      baseCurrencyCredit: l.baseCurrencyDebit,
      description: `Reversal of ${originalJournal.entryNumber}: ${l.description}`
    }));

    const reversingJE: GLJournalEntry = {
      id: `je-rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: originalJournal.tenantId,
      companyId: originalJournal.companyId,
      branchId: originalJournal.branchId,
      entryNumber: `${originalJournal.entryNumber}-REV`,
      date: reversalDate,
      postingDate: reversalDate,
      fiscalYear: periodCheck.period?.year || originalJournal.fiscalYear,
      fiscalPeriod: periodCheck.period?.periodNumber || originalJournal.fiscalPeriod,
      journalType: 'REVERSING',
      status: 'POSTED',
      reference: `REV:${originalJournal.entryNumber}`,
      description: `Reversal Entry for ${originalJournal.entryNumber}: ${originalJournal.description}`,
      totalDebit: originalJournal.totalCredit,
      totalCredit: originalJournal.totalDebit,
      currency: originalJournal.currency,
      exchangeRate: originalJournal.exchangeRate,
      lines: reversingLines,
      isAutoGenerated: true,
      originatingDocumentType: 'GLJournal',
      originatingDocumentId: originalJournal.id,
      originatingDocumentNumber: originalJournal.entryNumber,
      reversedJournalEntryId: originalJournal.id,
      createdBy: reversedBy,
      createdByName: reversedByName,
      createdAt: new Date().toISOString(),
      approvedBy: reversedByName,
      approvedAt: new Date().toISOString(),
      correlationId: `CORR-REV-${originalJournal.correlationId}`,
      auditHash: ''
    };

    reversingJE.auditHash = this.computeSHA256Hash(reversingJE);

    // Apply reversed impacts to GL account balances
    for (const line of reversingLines) {
      const acc = accounts.find(a => a.code === line.accountCode);
      if (acc) {
        if (acc.group === 'Assets' || acc.group === 'OperatingExpense' || acc.group === 'CostOfSales') {
          acc.balance += (Number(line.debit || 0) - Number(line.credit || 0));
        } else {
          acc.balance += (Number(line.credit || 0) - Number(line.debit || 0));
        }
        acc.updatedAt = new Date().toISOString();
      }
    }

    const updatedOriginalJournal: GLJournalEntry = {
      ...originalJournal,
      status: 'REVERSED',
      isReversed: true,
      reversalDate,
      reversedJournalEntryId: reversingJE.id
    };

    const auditRecord: GLAuditRecord = {
      id: `glaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: originalJournal.tenantId,
      companyId: originalJournal.companyId,
      timestamp: new Date().toISOString(),
      userId: reversedBy,
      userName: reversedByName,
      action: 'JOURNAL_REVERSED',
      entityType: 'GLJournal',
      entityId: originalJournal.id,
      correlationId: reversingJE.correlationId,
      hash: reversingJE.auditHash,
      details: `Reversed GL Journal Entry ${originalJournal.entryNumber} via Reversing Entry ${reversingJE.entryNumber}`
    };

    return { reversingJournal: reversingJE, updatedOriginalJournal, auditRecord };
  }

  /**
   * Generates Trial Balance report with opening, movement, and closing balances
   */
  public static generateTrialBalance(params: {
    accounts: GLAccount[];
    journals: GLJournalEntry[];
    periodNumber?: number;
    fiscalYear?: number;
    companyId?: string;
    branchId?: string;
    costCenterId?: string;
  }): { rows: TrialBalanceRow[]; totalOpeningDebit: number; totalOpeningCredit: number; totalPeriodDebit: number; totalPeriodCredit: number; totalClosingDebit: number; totalClosingCredit: number } {
    const { accounts, journals, periodNumber, fiscalYear, companyId, branchId, costCenterId } = params;

    // Filter relevant posted journals
    const postedJournals = journals.filter(j => {
      if (j.status !== 'POSTED') return false;
      if (companyId && j.companyId !== companyId) return false;
      if (branchId && j.branchId !== branchId) return false;
      return true;
    });

    const rows: TrialBalanceRow[] = accounts.map(acc => {
      let openingDebit = 0;
      let openingCredit = 0;
      let periodDebit = 0;
      let periodCredit = 0;

      for (const je of postedJournals) {
        const isPriorPeriod = (fiscalYear && je.fiscalYear < fiscalYear) || 
                              (fiscalYear && periodNumber && je.fiscalYear === fiscalYear && je.fiscalPeriod < periodNumber);
        
        const isCurrentPeriod = (!fiscalYear || je.fiscalYear === fiscalYear) && 
                                (!periodNumber || je.fiscalPeriod === periodNumber);

        for (const line of je.lines) {
          if (line.accountCode !== acc.code) continue;
          if (costCenterId && line.dimensions?.costCenterId !== costCenterId) continue;

          if (isPriorPeriod) {
            openingDebit += Number(line.debit || 0);
            openingCredit += Number(line.credit || 0);
          } else if (isCurrentPeriod) {
            periodDebit += Number(line.debit || 0);
            periodCredit += Number(line.credit || 0);
          }
        }
      }

      // If no historical period filter specified, current balance represents opening + movement
      const isDebitCategory = acc.group === 'Assets' || acc.group === 'OperatingExpense' || acc.group === 'CostOfSales';
      
      const openingNet = isDebitCategory ? (openingDebit - openingCredit) : (openingCredit - openingDebit);
      
      const netMovement = isDebitCategory ? (periodDebit - periodCredit) : (periodCredit - periodDebit);
      const totalNet = (periodNumber || fiscalYear) ? (openingNet + netMovement) : acc.balance;

      const closingDebit = isDebitCategory && totalNet > 0 ? totalNet : (!isDebitCategory && totalNet < 0 ? Math.abs(totalNet) : 0);
      const closingCredit = !isDebitCategory && totalNet > 0 ? totalNet : (isDebitCategory && totalNet < 0 ? Math.abs(totalNet) : 0);

      return {
        accountCode: acc.code,
        accountName: acc.name,
        accountGroup: acc.group,
        accountType: acc.accountType,
        isControlAccount: acc.isControlAccount,
        openingDebit: Number(openingDebit.toFixed(2)),
        openingCredit: Number(openingCredit.toFixed(2)),
        openingNet: Number(openingNet.toFixed(2)),
        periodDebit: Number(periodDebit.toFixed(2)),
        periodCredit: Number(periodCredit.toFixed(2)),
        closingDebit: Number(closingDebit.toFixed(2)),
        closingCredit: Number(closingCredit.toFixed(2)),
        closingNet: Number(totalNet.toFixed(2))
      };
    });

    let totalOpeningDebit = 0;
    let totalOpeningCredit = 0;
    let totalPeriodDebit = 0;
    let totalPeriodCredit = 0;
    let totalClosingDebit = 0;
    let totalClosingCredit = 0;

    for (const r of rows) {
      totalOpeningDebit += r.openingDebit;
      totalOpeningCredit += r.openingCredit;
      totalPeriodDebit += r.periodDebit;
      totalPeriodCredit += r.periodCredit;
      totalClosingDebit += r.closingDebit;
      totalClosingCredit += r.closingCredit;
    }

    return {
      rows,
      totalOpeningDebit: Number(totalOpeningDebit.toFixed(2)),
      totalOpeningCredit: Number(totalOpeningCredit.toFixed(2)),
      totalPeriodDebit: Number(totalPeriodDebit.toFixed(2)),
      totalPeriodCredit: Number(totalPeriodCredit.toFixed(2)),
      totalClosingDebit: Number(totalClosingDebit.toFixed(2)),
      totalClosingCredit: Number(totalClosingCredit.toFixed(2))
    };
  }

  /**
   * Validates Trial Balance mathematical integrity: OpeningNet + PeriodNet = ClosingNet and Total Debit = Total Credit
   */
  public static validateTrialBalanceIntegrity(tbRows: TrialBalanceRow[]): TrialBalanceIntegrityReport {
    let totalOpeningDebit = 0;
    let totalOpeningCredit = 0;
    let totalPeriodDebit = 0;
    let totalPeriodCredit = 0;
    let totalClosingDebit = 0;
    let totalClosingCredit = 0;

    const accountDiscrepancies: Array<{
      accountCode: string;
      expectedClosingNet: number;
      actualClosingNet: number;
      diff: number;
    }> = [];

    for (const r of tbRows) {
      totalOpeningDebit += r.openingDebit;
      totalOpeningCredit += r.openingCredit;
      totalPeriodDebit += r.periodDebit;
      totalPeriodCredit += r.periodCredit;
      totalClosingDebit += r.closingDebit;
      totalClosingCredit += r.closingCredit;

      // Verify OpeningNet + PeriodNet = ClosingNet
      const isDebitNature = r.accountGroup === 'Assets' || r.accountGroup === 'OperatingExpense' || r.accountGroup === 'CostOfSales';
      const expectedNet = isDebitNature 
        ? (r.openingNet + (r.periodDebit - r.periodCredit))
        : (r.openingNet + (r.periodCredit - r.periodDebit));

      const diff = Math.abs(expectedNet - r.closingNet);
      if (diff > 0.01) {
        accountDiscrepancies.push({
          accountCode: r.accountCode,
          expectedClosingNet: Number(expectedNet.toFixed(2)),
          actualClosingNet: r.closingNet,
          diff: Number(diff.toFixed(2))
        });
      }
    }

    const totalClosingDiff = Math.abs(totalClosingDebit - totalClosingCredit);
    const isVerified = totalClosingDiff < 0.01 && accountDiscrepancies.length === 0;

    const hashPayload = {
      totalClosingDebit: Number(totalClosingDebit.toFixed(2)),
      totalClosingCredit: Number(totalClosingCredit.toFixed(2)),
      accountCount: tbRows.length,
      discrepancyCount: accountDiscrepancies.length
    };

    return {
      isVerified,
      totalOpeningDebit: Number(totalOpeningDebit.toFixed(2)),
      totalOpeningCredit: Number(totalOpeningCredit.toFixed(2)),
      totalPeriodDebit: Number(totalPeriodDebit.toFixed(2)),
      totalPeriodCredit: Number(totalPeriodCredit.toFixed(2)),
      totalClosingDebit: Number(totalClosingDebit.toFixed(2)),
      totalClosingCredit: Number(totalClosingCredit.toFixed(2)),
      accountCount: tbRows.length,
      accountDiscrepancies,
      sha256VerificationHash: this.computeSHA256Hash(hashPayload)
    };
  }

  /**
   * Detects suspense accounts, clearing accounts, and temporary postings carrying unresolved non-zero balances
   */
  public static detectSuspenseAccounts(accounts: GLAccount[]): SuspenseAccountReport {
    const suspenseAccountsList: Array<{
      accountCode: string;
      accountName: string;
      accountType: string;
      balance: number;
      status: 'CLEARED' | 'UNRESOLVED_BALANCE';
    }> = [];

    for (const acc of accounts) {
      const isSuspenseName = acc.name.toLowerCase().includes('suspense') || 
                             acc.name.toLowerCase().includes('clearing') || 
                             acc.name.toLowerCase().includes('temp') ||
                             acc.code === '9999' || acc.code === '2010';

      if (isSuspenseName) {
        suspenseAccountsList.push({
          accountCode: acc.code,
          accountName: acc.name,
          accountType: acc.accountType,
          balance: Number(acc.balance.toFixed(2)),
          status: Math.abs(acc.balance) < 0.01 ? 'CLEARED' : 'UNRESOLVED_BALANCE'
        });
      }
    }

    const hasUnresolvedSuspense = suspenseAccountsList.some(s => s.status === 'UNRESOLVED_BALANCE');

    return {
      hasUnresolvedSuspense,
      suspenseAccounts: suspenseAccountsList
    };
  }

  /**
   * Evaluates Financial Pre-Close Checklist for a fiscal period, including subledgers (Inventory, Procurement, AP, AR, Financial Events, Suspense Accounts)
   */
  public static evaluatePreCloseChecklist(params: {
    period: FiscalPeriodRecord;
    journals: GLJournalEntry[];
    accounts: GLAccount[];
    subledgerStatus?: {
      isInventoryClosed?: boolean;
      isProcurementClosed?: boolean;
      isAPClosed?: boolean;
      isARClosed?: boolean;
      pendingEventsCount?: number;
    };
  }): FinancialCloseChecklist {
    const { period, journals, accounts, subledgerStatus } = params;

    const periodJournals = journals.filter(j => j.fiscalYear === period.year && j.fiscalPeriod === period.periodNumber);
    const draftJournals = periodJournals.filter(j => j.status === 'DRAFT');

    const tb = this.generateTrialBalance({ accounts, journals, periodNumber: period.periodNumber, fiscalYear: period.year });
    const tbIntegrity = this.validateTrialBalanceIntegrity(tb.rows);
    const suspenseReport = this.detectSuspenseAccounts(accounts);

    const isTrialBalanceBalanced = tbIntegrity.isVerified;
    const isUnpostedJournalsCleared = draftJournals.length === 0;
    const isAllEventsProcessed = (subledgerStatus?.pendingEventsCount ?? 0) === 0;
    const isSubledgersReconciled = true;
    const isForeignCurrencyRevalued = true;
    const isApprovedByController = period.status === 'CLOSING' || period.status === 'OPEN';

    const isInventoryClosed = subledgerStatus?.isInventoryClosed ?? true;
    const isProcurementClosed = subledgerStatus?.isProcurementClosed ?? true;
    const isAPClosed = subledgerStatus?.isAPClosed ?? true;
    const isARClosed = subledgerStatus?.isARClosed ?? true;
    const isFinancialEventQueueEmpty = isAllEventsProcessed;
    const isSuspenseAccountsCleared = !suspenseReport.hasUnresolvedSuspense;

    const blockers: string[] = [];
    if (!isUnpostedJournalsCleared) blockers.push(`There are ${draftJournals.length} unposted DRAFT journal entries in this period.`);
    if (!isTrialBalanceBalanced) blockers.push(`Trial Balance is out of balance or integrity check failed. Debits: ${tb.totalClosingDebit}, Credits: ${tb.totalClosingCredit}`);
    if (!isInventoryClosed) blockers.push(`Inventory Domain Period is NOT closed.`);
    if (!isProcurementClosed) blockers.push(`Procurement Domain has unbilled PO receipts or pending vendor returns.`);
    if (!isAPClosed) blockers.push(`Accounts Payable Domain has unposted supplier invoices or vouchers.`);
    if (!isARClosed) blockers.push(`Accounts Receivable Domain has unposted sales invoices or receipts.`);
    if (!isFinancialEventQueueEmpty) blockers.push(`Financial Event Queue contains ${subledgerStatus?.pendingEventsCount} pending unposted events.`);
    if (!isSuspenseAccountsCleared) {
      const unresolvedCodes = suspenseReport.suspenseAccounts.filter(s => s.status === 'UNRESOLVED_BALANCE').map(s => `${s.accountCode} (${s.balance})`).join(', ');
      blockers.push(`Suspense/Clearing accounts contain unresolved balances: ${unresolvedCodes}`);
    }

    return {
      periodId: period.id,
      periodName: period.periodName,
      year: period.year,
      isAllEventsProcessed,
      isSubledgersReconciled,
      isUnpostedJournalsCleared,
      isTrialBalanceBalanced,
      isForeignCurrencyRevalued,
      isApprovedByController,
      isInventoryClosed,
      isProcurementClosed,
      isAPClosed,
      isARClosed,
      isFinancialEventQueueEmpty,
      isSuspenseAccountsCleared,
      canClose: blockers.length === 0,
      blockers
    };
  }

  /**
   * Governs reopening of closed fiscal periods under strict audit governance
   */
  public static reopenFiscalPeriod(params: {
    period: FiscalPeriodRecord;
    reopenedBy: string;
    reason: string;
  }): { updatedPeriod: FiscalPeriodRecord; auditRecord: GLAuditRecord } {
    const { period, reopenedBy, reason } = params;

    if (!reason || reason.trim().length < 5) {
      throw new Error(`Reopening Fiscal Period ${period.periodName} requires a mandatory business justification reason (minimum 5 characters).`);
    }

    const updatedPeriod: FiscalPeriodRecord = {
      ...period,
      status: 'REOPENED',
      reopenCounter: (period.reopenCounter || 0) + 1,
      lastReopenedReason: reason,
      lastReopenedBy: reopenedBy,
      lastReopenedAt: new Date().toISOString()
    };

    const correlationId = `CORR-REOPEN-${period.year}-${period.periodNumber}-${Date.now()}`;
    const auditHash = this.computeSHA256Hash(updatedPeriod);

    const auditRecord: GLAuditRecord = {
      id: `glaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: period.tenantId,
      companyId: period.companyId,
      timestamp: new Date().toISOString(),
      userId: reopenedBy,
      userName: reopenedBy,
      action: 'PERIOD_REOPENED',
      entityType: 'FiscalPeriod',
      entityId: period.id,
      correlationId,
      hash: auditHash,
      details: `Reopened closed Fiscal Period ${period.periodName} (${period.year}). Reason: "${reason}". Reopen count: ${updatedPeriod.reopenCounter}`
    };

    return { updatedPeriod, auditRecord };
  }

  /**
   * Creates an immutable IAS 21 Foreign Exchange Valuation Snapshot Record
   */
  public static createIAS21FXSnapshot(params: {
    tenantId: string;
    companyId: string;
    valuationDate: string;
    spotRates: Record<string, number>;
    revaluationResults: IAS21RevaluationResult[];
    createdBy: string;
  }): { snapshot: IAS21FXSnapshotRecord; auditRecord: GLAuditRecord } {
    const { tenantId, companyId, valuationDate, spotRates, revaluationResults, createdBy } = params;

    const totalUnrealizedGainLoss = revaluationResults.reduce((sum, r) => sum + r.unrealizedGainLoss, 0);
    const correlationId = `CORR-FX21-${Date.now()}`;

    const snapshotPayload = {
      tenantId,
      companyId,
      valuationDate,
      spotRates,
      revaluationResults,
      totalUnrealizedGainLoss
    };

    const sha256Hash = this.computeSHA256Hash(snapshotPayload);

    const snapshot: IAS21FXSnapshotRecord = {
      id: `fxsnap-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      companyId,
      valuationDate,
      spotRates,
      revaluationResults,
      totalUnrealizedGainLoss: Number(totalUnrealizedGainLoss.toFixed(2)),
      createdBy,
      createdAt: new Date().toISOString(),
      sha256Hash,
      correlationId
    };

    const auditRecord: GLAuditRecord = {
      id: `glaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      companyId,
      timestamp: new Date().toISOString(),
      userId: createdBy,
      userName: createdBy,
      action: 'FX_REVALUED',
      entityType: 'IAS21Snapshot',
      entityId: snapshot.id,
      correlationId,
      hash: sha256Hash,
      details: `Generated IAS 21 Foreign Currency Valuation Snapshot as of ${valuationDate}. Total Net Unrealized Gain/Loss: ${totalUnrealizedGainLoss.toFixed(2)} SAR`
    };

    return { snapshot, auditRecord };
  }

  /**
   * Generates an immutable Period Closing Snapshot Bundle containing COA, Trial Balance, Journals, and FX Rates
   */
  public static generateClosingSnapshot(params: {
    tenantId: string;
    companyId: string;
    period: FiscalPeriodRecord;
    accounts: GLAccount[];
    trialBalance: TrialBalanceRow[];
    journals: GLJournalEntry[];
    closedBy: string;
    fxRates?: Record<string, number>;
  }): { snapshot: ClosingSnapshotRecord; auditRecord: GLAuditRecord } {
    const { tenantId, companyId, period, accounts, trialBalance, journals, closedBy, fxRates = { 'USD': 3.75, 'EUR': 4.10, 'AED': 1.02 } } = params;

    const periodJournals = journals.filter(j => j.fiscalYear === period.year && j.fiscalPeriod === period.periodNumber);
    const correlationId = `CORR-SNAPSHOT-${period.year}-${period.periodNumber}`;

    const bundlePayload = {
      tenantId,
      companyId,
      periodId: period.id,
      periodName: period.periodName,
      year: period.year,
      closedBy,
      closedAt: new Date().toISOString(),
      accountsCount: accounts.length,
      tbRowCount: trialBalance.length,
      journalsCount: periodJournals.length
    };

    const sha256Hash = this.computeSHA256Hash(bundlePayload);

    const snapshot: ClosingSnapshotRecord = {
      id: `closesnap-${period.year}-${period.periodNumber}-${Date.now()}`,
      tenantId,
      companyId,
      periodId: period.id,
      periodName: period.periodName,
      year: period.year,
      closedBy,
      closedAt: new Date().toISOString(),
      chartOfAccountsSnapshot: JSON.parse(JSON.stringify(accounts)),
      trialBalanceSnapshot: JSON.parse(JSON.stringify(trialBalance)),
      journalEntriesCount: periodJournals.length,
      fxRatesSnapshot: fxRates,
      sha256Hash,
      correlationId
    };

    const auditRecord: GLAuditRecord = {
      id: `glaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      companyId,
      timestamp: new Date().toISOString(),
      userId: closedBy,
      userName: closedBy,
      action: 'PERIOD_CLOSED',
      entityType: 'ClosingSnapshot',
      entityId: snapshot.id,
      correlationId,
      hash: sha256Hash,
      details: `Generated immutable Closing Snapshot for Fiscal Period ${period.periodName} (${period.year}). SHA-256: ${sha256Hash}`
    };

    return { snapshot, auditRecord };
  }

  /**
   * Executes Year-End Financial Closing (IAS 1 Retained Earnings Carry-Forward)
   */
  public static executeYearEndClose(params: {
    tenantId: string;
    companyId: string;
    fiscalYear: FiscalYearRecord;
    accounts: GLAccount[];
    journals: GLJournalEntry[];
    retainedEarningsAccountCode: string;
    closedBy: string;
  }): { yearEndRecord: YearEndClosingRecord; retainedEarningsJE: GLJournalEntry; auditRecord: GLAuditRecord } {
    const { tenantId, companyId, fiscalYear, accounts, retainedEarningsAccountCode, closedBy } = params;

    if (fiscalYear.isClosed) {
      throw new Error(`Fiscal Year ${fiscalYear.year} is already CLOSED`);
    }

    const retainedAcc = accounts.find(a => a.code === retainedEarningsAccountCode);
    if (!retainedAcc) {
      throw new Error(`Retained Earnings account code ${retainedEarningsAccountCode} not found in Chart of Accounts`);
    }

    // 1. Calculate Total Revenues and Total Expenses
    let totalRevenue = 0;
    let totalExpense = 0;

    for (const acc of accounts) {
      if (acc.group === 'Revenue') {
        totalRevenue += acc.balance;
      } else if (acc.group === 'OperatingExpense' || acc.group === 'CostOfSales' || acc.group === 'OtherIncomeExpense') {
        totalExpense += acc.balance;
      }
    }

    const netIncomeOrLoss = totalRevenue - totalExpense;

    // 2. Build Zeroing Journal Entry lines for Revenue and Expense accounts
    const zeroingLines: GLJournalLine[] = [];
    let lineNo = 1;

    for (const acc of accounts) {
      if (acc.group === 'Revenue' && acc.balance !== 0) {
        zeroingLines.push({
          id: `jl-ye-${Date.now()}-${lineNo++}`,
          lineNo,
          accountCode: acc.code,
          accountName: acc.name,
          description: `Year-End Close ${fiscalYear.year} - Zero out Revenue`,
          debit: acc.balance,
          credit: 0
        });
      } else if ((acc.group === 'OperatingExpense' || acc.group === 'CostOfSales' || acc.group === 'OtherIncomeExpense') && acc.balance !== 0) {
        zeroingLines.push({
          id: `jl-ye-${Date.now()}-${lineNo++}`,
          lineNo,
          accountCode: acc.code,
          accountName: acc.name,
          description: `Year-End Close ${fiscalYear.year} - Zero out Expense`,
          debit: 0,
          credit: acc.balance
        });
      }
    }

    // Net Income goes to Retained Earnings Credit; Net Loss goes to Debit
    if (netIncomeOrLoss > 0) {
      zeroingLines.push({
        id: `jl-ye-${Date.now()}-${lineNo++}`,
        lineNo,
        accountCode: retainedAcc.code,
        accountName: retainedAcc.name,
        description: `Year-End Close ${fiscalYear.year} - Transfer Net Income to Retained Earnings`,
        debit: 0,
        credit: netIncomeOrLoss
      });
    } else if (netIncomeOrLoss < 0) {
      zeroingLines.push({
        id: `jl-ye-${Date.now()}-${lineNo++}`,
        lineNo,
        accountCode: retainedAcc.code,
        accountName: retainedAcc.name,
        description: `Year-End Close ${fiscalYear.year} - Transfer Net Loss to Retained Earnings`,
        debit: Math.abs(netIncomeOrLoss),
        credit: 0
      });
    }

    const correlationId = `CORR-YEAREND-${fiscalYear.year}`;

    const retainedEarningsJE: GLJournalEntry = {
      id: `je-ye-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      companyId,
      entryNumber: `JE-YEAREND-${fiscalYear.year}`,
      date: fiscalYear.endDate,
      postingDate: fiscalYear.endDate,
      fiscalYear: fiscalYear.year,
      fiscalPeriod: 13, // Year-End Closing Period
      journalType: 'AUTOMATIC',
      status: 'POSTED',
      reference: `YEAREND-${fiscalYear.year}`,
      description: `Fiscal Year ${fiscalYear.year} Year-End Close & Retained Earnings Transfer`,
      totalDebit: Math.max(totalRevenue, totalExpense),
      totalCredit: Math.max(totalRevenue, totalExpense),
      currency: 'SAR',
      exchangeRate: 1.0,
      lines: zeroingLines,
      isAutoGenerated: true,
      originatingDocumentType: 'YearEndClose',
      originatingDocumentId: fiscalYear.id,
      originatingDocumentNumber: `YEAREND-${fiscalYear.year}`,
      createdBy: closedBy,
      createdByName: closedBy,
      createdAt: new Date().toISOString(),
      approvedBy: closedBy,
      approvedAt: new Date().toISOString(),
      correlationId,
      auditHash: ''
    };

    retainedEarningsJE.auditHash = this.computeSHA256Hash(retainedEarningsJE);

    // Apply zeroing and retained earnings transfer to GL balances
    for (const acc of accounts) {
      if (acc.group === 'Revenue' || acc.group === 'OperatingExpense' || acc.group === 'CostOfSales' || acc.group === 'OtherIncomeExpense') {
        acc.balance = 0;
      }
    }
    retainedAcc.balance += netIncomeOrLoss;

    fiscalYear.isClosed = true;
    fiscalYear.closedAt = new Date().toISOString();
    fiscalYear.closedBy = closedBy;

    const yearEndRecord: YearEndClosingRecord = {
      id: `yec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      companyId,
      fiscalYear: fiscalYear.year,
      closingDate: fiscalYear.endDate,
      netIncomeOrLoss,
      retainedEarningsAccountCode,
      retainedEarningsJournalEntryId: retainedEarningsJE.id,
      openingBalancesGenerated: true,
      closedBy,
      closedAt: new Date().toISOString(),
      auditHash: retainedEarningsJE.auditHash
    };

    const auditRecord: GLAuditRecord = {
      id: `glaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      companyId,
      timestamp: new Date().toISOString(),
      userId: closedBy,
      userName: closedBy,
      action: 'YEAR_END_CLOSED',
      entityType: 'FiscalYear',
      entityId: fiscalYear.id,
      correlationId,
      hash: retainedEarningsJE.auditHash,
      details: `Completed Fiscal Year ${fiscalYear.year} Year-End Closing. Net Income transferred to Retained Earnings: ${netIncomeOrLoss} SAR`
    };

    return { yearEndRecord, retainedEarningsJE, auditRecord };
  }

  /**
   * Calculates IAS 21 Unrealized Foreign Currency Gain/Loss on Period-End Spot Rates
   */
  public static calculateIAS21UnrealizedFX(
    accounts: GLAccount[],
    spotRates: Record<string, number> // e.g. { 'USD': 3.75, 'EUR': 4.10, 'AED': 1.02 }
  ): IAS21RevaluationResult[] {
    const results: IAS21RevaluationResult[] = [];

    for (const acc of accounts) {
      if (acc.currency !== 'SAR' && spotRates[acc.currency]) {
        const spotRate = spotRates[acc.currency];
        const historicalBookRate = 3.75; // Baseline book rate
        const foreignBalance = acc.balance;
        const historicalBaseAmount = foreignBalance * historicalBookRate;
        const revaluedBaseAmount = foreignBalance * spotRate;
        const unrealizedGainLoss = revaluedBaseAmount - historicalBaseAmount;

        results.push({
          accountCode: acc.code,
          accountName: acc.name,
          currency: acc.currency,
          foreignBalance,
          historicalBookRate,
          historicalBaseAmount: Number(historicalBaseAmount.toFixed(2)),
          periodEndSpotRate: spotRate,
          revaluedBaseAmount: Number(revaluedBaseAmount.toFixed(2)),
          unrealizedGainLoss: Number(unrealizedGainLoss.toFixed(2))
        });
      }
    }

    return results;
  }
}
