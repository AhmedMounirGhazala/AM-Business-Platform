import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  Scale, 
  Lock, 
  RotateCcw, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Search, 
  Eye, 
  RefreshCw, 
  Layers, 
  DollarSign, 
  Clock, 
  ArrowRightLeft,
  ChevronRight,
  TrendingUp,
  Download,
  Filter
} from 'lucide-react';
import { ApiClient } from '../../services/apiClient';
import { 
  GLAccount, 
  GLJournalEntry, 
  GLJournalLine, 
  FiscalYearRecord, 
  FiscalPeriodRecord, 
  TrialBalanceRow, 
  FinancialCloseChecklist, 
  RecurringJournalSchedule, 
  GLAuditRecord,
  IAS21RevaluationResult
} from '../../types/generalLedger';

export const GeneralLedgerManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'coa' | 'journals' | 'periods' | 'trial_balance' | 'closing' | 'recurring' | 'audit'>('coa');

  // Master Data State
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [journals, setJournals] = useState<GLJournalEntry[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYearRecord[]>([]);
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriodRecord[]>([]);
  const [recurringSchedules, setRecurringSchedules] = useState<RecurringJournalSchedule[]>([]);
  const [auditLogs, setAuditLogs] = useState<GLAuditRecord[]>([]);
  const [trialBalance, setTrialBalance] = useState<{ rows: TrialBalanceRow[]; totalClosingDebit: number; totalClosingCredit: number } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [journalStatusFilter, setJournalStatusFilter] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(8);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Modals
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState<boolean>(false);
  const [isNewJournalModalOpen, setIsNewJournalModalOpen] = useState<boolean>(false);
  const [isJournalDetailsModalOpen, setIsJournalDetailsModalOpen] = useState<boolean>(false);
  const [selectedJournal, setSelectedJournal] = useState<GLJournalEntry | null>(null);

  // New Account Form State
  const [newAccCode, setNewAccCode] = useState<string>('');
  const [newAccName, setNewAccName] = useState<string>('');
  const [newAccNameAr, setNewAccNameAr] = useState<string>('');
  const [newAccGroup, setNewAccGroup] = useState<string>('OperatingExpense');
  const [newAccType, setNewAccType] = useState<string>('OperatingExpense');
  const [newAccRestriction, setNewAccRestriction] = useState<string>('POSTING_ALLOWED');
  const [newAccCurrency, setNewAccCurrency] = useState<string>('SAR');
  const [newAccIsControl, setNewAccIsControl] = useState<boolean>(false);

  // New Journal Entry Form State
  const [newJeRef, setNewJeRef] = useState<string>('');
  const [newJeDesc, setNewJeDesc] = useState<string>('');
  const [newJeLines, setNewJeLines] = useState<{ accountCode: string; description: string; debit: number; credit: number }[]>([
    { accountCode: '1010', description: 'Debit Entry', debit: 1000, credit: 0 },
    { accountCode: '4010', description: 'Credit Entry', debit: 0, credit: 1000 }
  ]);

  // Closing State
  const [closingChecklist, setClosingChecklist] = useState<FinancialCloseChecklist | null>(null);
  const [fxSpotRates, setFxSpotRates] = useState<{ USD: number; EUR: number; AED: number }>({ USD: 3.75, EUR: 4.10, AED: 1.02 });
  const [fxResults, setFxResults] = useState<IAS21RevaluationResult[]>([]);

  // Initial Load
  useEffect(() => {
    loadAllGLData();
  }, []);

  const loadAllGLData = async () => {
    setLoading(true);
    try {
      const [accs, jns, yrs, prds, recs, auds, tb] = await Promise.all([
        ApiClient.getGLAccounts(),
        ApiClient.getGLJournals(),
        ApiClient.getGLFiscalYears(),
        ApiClient.getGLFiscalPeriods(),
        ApiClient.getGLRecurringSchedules(),
        ApiClient.getGLAuditLogs(),
        ApiClient.getGLTrialBalance({ periodNumber: selectedPeriod, fiscalYear: selectedYear })
      ]);

      setAccounts(accs || []);
      setJournals(jns || []);
      setFiscalYears(yrs || []);
      setFiscalPeriods(prds || []);
      setRecurringSchedules(recs || []);
      setAuditLogs(auds || []);
      setTrialBalance(tb || null);
    } catch (err: any) {
      console.error('Failed to load GL data:', err);
      setMessage({ type: 'error', text: err.message || 'Error connecting to General Ledger Engine' });
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Create GL Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newAcc = await ApiClient.createGLAccount({
        code: newAccCode,
        name: newAccName,
        nameAr: newAccNameAr || newAccName,
        group: newAccGroup,
        accountType: newAccType,
        postingRestriction: newAccRestriction,
        currency: newAccCurrency,
        isControlAccount: newAccIsControl
      });

      setAccounts(prev => [...prev, newAcc]);
      setIsNewAccountModalOpen(false);
      showNotification('success', `Created GL Account ${newAcc.code} - ${newAcc.name}`);
      // Reset form
      setNewAccCode('');
      setNewAccName('');
      setNewAccNameAr('');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create GL account');
    }
  };

  // Create Manual Journal Entry
  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    const totDebit = newJeLines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
    const totCredit = newJeLines.reduce((sum, l) => sum + Number(l.credit || 0), 0);

    if (Math.abs(totDebit - totCredit) > 0.01) {
      showNotification('error', `Journal is not balanced! Total Debit: ${totDebit} SAR, Total Credit: ${totCredit} SAR`);
      return;
    }

    try {
      const formattedLines = newJeLines.map((l, idx) => {
        const acc = accounts.find(a => a.code === l.accountCode);
        return {
          id: `jl-new-${idx}`,
          lineNo: idx + 1,
          accountCode: l.accountCode,
          accountName: acc ? acc.name : 'GL Account',
          description: l.description,
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0)
        };
      });

      const newJE = await ApiClient.createGLJournal({
        reference: newJeRef,
        description: newJeDesc,
        fiscalYear: selectedYear,
        fiscalPeriod: selectedPeriod,
        journalType: 'MANUAL',
        lines: formattedLines,
        createdBy: 'usr-001',
        createdByName: 'Finance Manager'
      });

      setJournals(prev => [newJE, ...prev]);
      setIsNewJournalModalOpen(false);
      showNotification('success', `Created DRAFT Journal Entry ${newJE.entryNumber}`);
      loadAllGLData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create Journal Entry');
    }
  };

  // Post Journal
  const handlePostJournal = async (journalId: string) => {
    try {
      const postedJE = await ApiClient.postGLJournal(journalId, 'Finance Manager');
      setJournals(prev => prev.map(j => j.id === journalId ? postedJE : j));
      showNotification('success', `Successfully Posted GL Journal ${postedJE.entryNumber}`);
      loadAllGLData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to post Journal Entry');
    }
  };

  // Reverse Journal
  const handleReverseJournal = async (journalId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await ApiClient.reverseGLJournal(journalId, {
        reversalDate: today,
        reversedBy: 'usr-001',
        reversedByName: 'Chief Accountant'
      });

      setJournals(prev => prev.map(j => j.id === journalId ? result.originalJournal : j));
      setJournals(prev => [result.reversingJournal, ...prev]);
      showNotification('success', `Reversed GL Journal Entry. Created Reversing Entry ${result.reversingJournal.entryNumber}`);
      loadAllGLData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to reverse Journal Entry');
    }
  };

  // Period Status Change
  const handleTogglePeriodStatus = async (periodId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      const updated = await ApiClient.updateGLFiscalPeriodStatus(periodId, nextStatus, 'Financial Controller');
      setFiscalPeriods(prev => prev.map(p => p.id === periodId ? updated : p));
      showNotification('success', `Updated Fiscal Period status to ${nextStatus}`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update period status');
    }
  };

  // Check Pre-Close Checklist
  const handleCheckPreClose = async (periodId: string) => {
    try {
      const chk = await ApiClient.getGLPreCloseChecklist(periodId);
      setClosingChecklist(chk);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to fetch pre-close checklist');
    }
  };

  // Execute Period Close
  const handleExecutePeriodClose = async (periodId: string) => {
    try {
      const res = await ApiClient.executeGLPeriodClose(periodId, 'Chief Financial Officer');
      if (res.success) {
        showNotification('success', `Fiscal Period successfully CLOSED and locked.`);
        loadAllGLData();
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Period close failed');
    }
  };

  // Execute Year-End Close
  const handleExecuteYearEndClose = async () => {
    try {
      const res = await ApiClient.executeGLYearEndClose(selectedYear, '3020', 'Chief Financial Officer');
      showNotification('success', `Fiscal Year ${selectedYear} CLOSED! Net Income/Loss transferred to Retained Earnings (Account 3020).`);
      loadAllGLData();
    } catch (err: any) {
      showNotification('error', err.message || 'Year-End Close failed');
    }
  };

  // IAS 21 Revaluation
  const handleCalculateIAS21 = async () => {
    try {
      const res = await ApiClient.calculateGLIAS21Revaluation(fxSpotRates);
      setFxResults(res.revaluationResults || []);
      showNotification('success', 'IAS 21 Foreign Currency Revaluation Calculated successfully');
    } catch (err: any) {
      showNotification('error', err.message || 'IAS 21 Revaluation failed');
    }
  };

  // Execute Recurring Run
  const handleExecuteRecurring = async () => {
    try {
      const res = await ApiClient.executeGLRecurringSchedules();
      showNotification('success', `Executed ${res.executedCount} due recurring journal schedule(s).`);
      loadAllGLData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to execute recurring journals');
    }
  };

  // Derived KPI Stats
  const totalAccounts = accounts.length;
  const draftJournalsCount = journals.filter(j => j.status === 'DRAFT').length;
  const openPeriodsCount = fiscalPeriods.filter(p => p.status === 'OPEN').length;
  const tbBalanced = trialBalance ? Math.abs(trialBalance.totalClosingDebit - trialBalance.totalClosingCredit) < 0.01 : true;

  // Filtered Accounts
  const filteredAccounts = accounts.filter(a => {
    const matchesSearch = a.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (a.nameAr && a.nameAr.includes(searchTerm));
    const matchesGroup = groupFilter === 'ALL' || a.group === groupFilter;
    return matchesSearch && matchesGroup;
  });

  // Filtered Journals
  const filteredJournals = journals.filter(j => {
    const matchesSearch = j.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          j.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (j.reference && j.reference.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = journalStatusFilter === 'ALL' || j.status === journalStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-[#0B1F3A] border border-[#153258] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#153258] border border-[#F28C28]/40 rounded-xl">
              <BookOpen className="w-6 h-6 text-[#F28C28]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">General Ledger & Financial Closing</h1>
              <p className="text-xs text-slate-300 mt-0.5">
                SAP S/4HANA FI-GL & Oracle ERP Cloud Receivables Architecture • IFRS / IAS 1 / IAS 8 / IAS 21 Compliant
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={loadAllGLData} 
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition backdrop-blur-sm border border-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Ledger
          </button>
          <button 
            onClick={() => setIsNewJournalModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition shadow-md shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            New Manual Journal
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center justify-between shadow-sm border ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-3 text-sm font-medium">
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
            {message.text}
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Chart of Accounts</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalAccounts} Accounts</p>
            <p className="text-xs text-slate-400 mt-0.5">Active Hierarchy Level 1-4</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <Layers className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Unposted Drafts</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{draftJournalsCount} Entries</p>
            <p className="text-xs text-slate-400 mt-0.5">Pending Review & Posting</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Posting Period Status</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">Period {selectedPeriod} / {selectedYear}</p>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">{openPeriodsCount} Open Fiscal Periods</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <Calendar className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Trial Balance Integrity</p>
            <p className={`text-2xl font-bold mt-1 ${tbBalanced ? 'text-emerald-600' : 'text-rose-600'}`}>
              {tbBalanced ? 'BALANCED' : 'UNBALANCED'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Sum Debits === Sum Credits</p>
          </div>
          <div className={`p-3 rounded-xl border ${tbBalanced ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
            <Scale className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Tab Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex flex-wrap gap-1 shadow-sm">
        <button
          onClick={() => setActiveTab('coa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'coa' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Chart of Accounts Engine
        </button>

        <button
          onClick={() => setActiveTab('journals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'journals' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Journal Entries Ledger
        </button>

        <button
          onClick={() => setActiveTab('periods')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'periods' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Posting Periods & Calendar
        </button>

        <button
          onClick={() => setActiveTab('trial_balance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'trial_balance' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-4 h-4" />
          Trial Balance Engine
        </button>

        <button
          onClick={() => setActiveTab('closing')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'closing' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-4 h-4" />
          Financial Closing & Year-End
        </button>

        <button
          onClick={() => setActiveTab('recurring')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'recurring' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          Recurring & Reversing
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Audit Vault & Integrity
        </button>
      </div>

      {/* Tab Content 1: Chart of Accounts Engine */}
      {activeTab === 'coa' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Chart of Accounts Engine</h2>
              <p className="text-xs text-slate-500 mt-0.5">Configure Account Categories, Control Account Restrictions, and Balances</p>
            </div>
            
            <button
              onClick={() => setIsNewAccountModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              Add GL Account
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search account code, name, or Arabic description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Group:</span>
              <select
                value={groupFilter}
                onChange={e => setGroupFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">All Groups</option>
                <option value="Assets">Assets</option>
                <option value="Liabilities">Liabilities</option>
                <option value="Equity">Equity</option>
                <option value="Revenue">Revenue</option>
                <option value="OperatingExpense">Operating Expense</option>
                <option value="CostOfSales">Cost of Sales</option>
              </select>
            </div>
          </div>

          {/* Accounts Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Account Code</th>
                  <th className="py-3 px-4">Account Name (EN / AR)</th>
                  <th className="py-3 px-4">Group</th>
                  <th className="py-3 px-4">Account Type</th>
                  <th className="py-3 px-4">Posting Restriction</th>
                  <th className="py-3 px-4 text-right">Current Balance (SAR)</th>
                  <th className="py-3 px-4 text-center">Control Account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAccounts.map(acc => (
                  <tr key={acc.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-indigo-950 font-mono">{acc.code}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{acc.name}</div>
                      <div className="text-[11px] text-slate-400">{acc.nameAr}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        acc.group === 'Assets' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                        acc.group === 'Liabilities' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        acc.group === 'Equity' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        acc.group === 'Revenue' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {acc.group}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{acc.accountType}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        acc.postingRestriction === 'POSTING_ALLOWED' ? 'bg-emerald-100 text-emerald-800' :
                        acc.postingRestriction === 'CONTROL_ACCOUNT_ONLY' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {acc.postingRestriction}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                      {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {acc.currency}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {acc.isControlAccount ? (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold">
                          {acc.controlType || 'YES'}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: Journal Entries Ledger Engine */}
      {activeTab === 'journals' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">General Ledger Journal Entries</h2>
              <p className="text-xs text-slate-500 mt-0.5">Double-Entry Immutable Audit Log, Manual Postings, and Subledger Reversals</p>
            </div>

            <button
              onClick={() => setIsNewJournalModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Manual Journal
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search entry number, reference, description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Status:</span>
              <select
                value={journalStatusFilter}
                onChange={e => setJournalStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">All Statuses</option>
                <option value="POSTED">Posted</option>
                <option value="DRAFT">Draft</option>
                <option value="REVERSED">Reversed</option>
              </select>
            </div>
          </div>

          {/* Journals Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Entry #</th>
                  <th className="py-3 px-4">Posting Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Total Debit (SAR)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">SHA-256 Audit Hash</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredJournals.map(je => (
                  <tr key={je.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-indigo-900 font-mono">{je.entryNumber}</td>
                    <td className="py-3 px-4 text-slate-700">{je.postingDate}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        je.journalType === 'MANUAL' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                        je.journalType === 'FINANCIAL_EVENT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        je.journalType === 'REVERSING' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {je.journalType}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-800 font-semibold">{je.description}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                      {je.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        je.status === 'POSTED' ? 'bg-emerald-100 text-emerald-800' :
                        je.status === 'DRAFT' ? 'bg-amber-100 text-amber-800' :
                        je.status === 'REVERSED' ? 'bg-purple-100 text-purple-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {je.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400 max-w-[150px] truncate" title={je.auditHash}>
                      {je.auditHash}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setSelectedJournal(je); setIsJournalDetailsModalOpen(true); }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                          title="View Lines"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {je.status === 'DRAFT' && (
                          <button
                            onClick={() => handlePostJournal(je.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition"
                          >
                            Post
                          </button>
                        )}

                        {je.status === 'POSTED' && !je.isReversed && (
                          <button
                            onClick={() => handleReverseJournal(je.id)}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-bold transition"
                            title="IAS 1 Reversal Entry"
                          >
                            Reverse
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 3: Posting Periods & Calendar */}
      {activeTab === 'periods' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Fiscal Calendar & Posting Periods</h2>
              <p className="text-xs text-slate-500 mt-0.5">Control Open/Closed Financial Posting Windows according to IAS 1 & IAS 8</p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">Fiscal Year:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-white"
              >
                {fiscalYears.map(fy => (
                  <option key={fy.id} value={fy.year}>{fy.year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {fiscalPeriods.filter(p => p.year === selectedYear).map(period => (
              <div 
                key={period.id}
                className={`p-4 rounded-xl border transition shadow-sm flex flex-col justify-between ${
                  period.status === 'OPEN' ? 'bg-emerald-50/50 border-emerald-200' :
                  period.status === 'CLOSING' ? 'bg-amber-50/50 border-amber-200' :
                  'bg-slate-50 border-slate-200 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{period.periodName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      period.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' :
                      period.status === 'CLOSING' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-200 text-slate-800'
                    }`}>
                      {period.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2 font-mono">
                    {period.startDate} to {period.endDate}
                  </p>

                  {period.lockedBy && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Locked by: {period.lockedBy}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <button
                    onClick={() => handleTogglePeriodStatus(period.id, period.status)}
                    className={`w-full py-1.5 rounded text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      period.status === 'OPEN' ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {period.status === 'OPEN' ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Close Period
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        Re-Open Period
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 4: Trial Balance Engine */}
      {activeTab === 'trial_balance' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Interactive Trial Balance Engine</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time Double-Entry Verification of Opening, Movement, and Closing Balances</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">Period:</span>
              <select
                value={selectedPeriod}
                onChange={e => { setSelectedPeriod(Number(e.target.value)); loadAllGLData(); }}
                className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-white"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(p => (
                  <option key={p} value={p}>Period {p}</option>
                ))}
              </select>
            </div>
          </div>

          {trialBalance && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Account Code</th>
                    <th className="py-3 px-4">Account Name</th>
                    <th className="py-3 px-4">Group</th>
                    <th className="py-3 px-4 text-right">Opening Net (SAR)</th>
                    <th className="py-3 px-4 text-right">Period Debit (SAR)</th>
                    <th className="py-3 px-4 text-right">Period Credit (SAR)</th>
                    <th className="py-3 px-4 text-right">Closing Debit (SAR)</th>
                    <th className="py-3 px-4 text-right">Closing Credit (SAR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {trialBalance.rows.map(row => (
                    <tr key={row.accountCode} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-indigo-950 font-mono">{row.accountCode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{row.accountName}</td>
                      <td className="py-3 px-4 text-slate-500">{row.accountGroup}</td>
                      <td className="py-3 px-4 text-right font-mono">{row.openingNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700">{row.periodDebit > 0 ? row.periodDebit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                      <td className="py-3 px-4 text-right font-mono text-indigo-700">{row.periodCredit > 0 ? row.periodCredit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{row.closingDebit > 0 ? row.closingDebit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{row.closingCredit > 0 ? row.closingCredit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-indigo-900 text-white font-bold border-t-2 border-indigo-950">
                  <tr>
                    <td colSpan={6} className="py-4 px-4 text-right text-sm">TOTAL TRIAL BALANCE CLOSING SUMS:</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-emerald-300">
                      {trialBalance.totalClosingDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-emerald-300">
                      {trialBalance.totalClosingCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 5: Financial Closing & Year-End Engine */}
      {activeTab === 'closing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Period Close Checklist Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Period Financial Close Checklist</h3>
                <p className="text-xs text-slate-500 mt-0.5">Pre-Close Checklist Evaluation for Period {selectedPeriod}</p>
              </div>

              <button
                onClick={() => handleCheckPreClose(String(selectedPeriod))}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition border border-indigo-200"
              >
                Run Checklist Pre-Check
              </button>
            </div>

            {closingChecklist ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg border bg-slate-50 space-y-2 text-xs font-medium">
                  <div className="flex items-center justify-between">
                    <span>Unposted Draft Journals Cleared</span>
                    {closingChecklist.isUnpostedJournalsCleared ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Trial Balance Balanced (Debits = Credits)</span>
                    {closingChecklist.isTrialBalanceBalanced ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Subledgers Reconciled (AR/AP/INV)</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>IAS 21 Foreign Currency Revalued</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>

                {closingChecklist.blockers.length > 0 && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1 font-medium">
                    <p className="font-bold">Closing Blocked by the following issues:</p>
                    {closingChecklist.blockers.map((b, i) => (
                      <p key={i}>• {b}</p>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleExecutePeriodClose(String(selectedPeriod))}
                  disabled={!closingChecklist.canClose}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 ${
                    closingChecklist.canClose ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  Execute Period Financial Close
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Click "Run Checklist Pre-Check" to evaluate period closing readiness.</p>
            )}
          </div>

          {/* Year-End Closing (Retained Earnings Carry-Forward) Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Year-End Financial Closing (IAS 1)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Zero P&L Accounts and Transfer Net Income / Loss to Retained Earnings</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Target Fiscal Year:</span>
                  <span className="font-bold text-indigo-950 font-mono text-sm">{selectedYear}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Retained Earnings GL Code:</span>
                  <span className="font-bold text-indigo-950 font-mono">3020 (Retained Earnings)</span>
                </div>
              </div>

              <button
                onClick={handleExecuteYearEndClose}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-md flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Execute Fiscal Year-End Close
              </button>
            </div>

            {/* IAS 21 Foreign Currency Revaluation Box */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">IAS 21 FX Revaluation Engine</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500">USD Spot</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fxSpotRates.USD}
                    onChange={e => setFxSpotRates({ ...fxSpotRates, USD: Number(e.target.value) })}
                    className="w-full p-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">EUR Spot</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fxSpotRates.EUR}
                    onChange={e => setFxSpotRates({ ...fxSpotRates, EUR: Number(e.target.value) })}
                    className="w-full p-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">AED Spot</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fxSpotRates.AED}
                    onChange={e => setFxSpotRates({ ...fxSpotRates, AED: Number(e.target.value) })}
                    className="w-full p-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleCalculateIAS21}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition"
              >
                Calculate Unrealized FX Gains / Losses
              </button>

              {fxResults.length > 0 && (
                <div className="space-y-1 text-xs">
                  {fxResults.map(r => (
                    <div key={r.accountCode} className="flex justify-between p-2 bg-slate-50 rounded">
                      <span>{r.accountName} ({r.currency})</span>
                      <span className={`font-mono font-bold ${r.unrealizedGainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {r.unrealizedGainLoss >= 0 ? '+' : ''}{r.unrealizedGainLoss} SAR
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 6: Recurring Journals Engine */}
      {activeTab === 'recurring' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recurring Journal Schedules Engine</h2>
              <p className="text-xs text-slate-500 mt-0.5">Automated Monthly / Quarterly Recurring Posting Templates</p>
            </div>

            <button
              onClick={handleExecuteRecurring}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Trigger Due Recurring Runs
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Schedule Code</th>
                  <th className="py-3 px-4">Template Name</th>
                  <th className="py-3 px-4">Frequency</th>
                  <th className="py-3 px-4">Next Execution Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recurringSchedules.map(sched => (
                  <tr key={sched.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-indigo-900 font-mono">{sched.scheduleCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{sched.name}</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold">{sched.frequency}</span></td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{sched.nextExecutionDate}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                        ACTIVE
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{sched.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 7: Audit Vault & Integrity */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Immutable Audit Trail & Cryptographic Vault</h2>
            <p className="text-xs text-slate-500 mt-0.5">Append-Only SHA-256 Hashed Event Ledger with Correlation IDs</p>
          </div>

          <div className="space-y-3">
            {auditLogs.map(aud => (
              <div key={aud.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>{aud.action}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-normal">{aud.userName}</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{new Date(aud.timestamp).toLocaleString()}</span>
                </div>

                <p className="text-xs text-slate-700 font-medium">{aud.details}</p>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-200/50">
                  <span>Correlation ID: <strong className="text-slate-600">{aud.correlationId}</strong></span>
                  <span>Hash: <strong className="text-indigo-600">{aud.hash}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Create GL Account */}
      {isNewAccountModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Add Chart of Accounts GL Account</h3>
              <button onClick={() => setIsNewAccountModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-4 text-xs font-medium text-slate-700">
              <div>
                <label className="block text-slate-500 mb-1">Account Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5050"
                  value={newAccCode}
                  onChange={e => setNewAccCode(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Account Name (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Hosting & Server Expenses"
                  value={newAccName}
                  onChange={e => setNewAccName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Account Name (Arabic)</label>
                <input
                  type="text"
                  placeholder="e.g. مصاريف استضافة السحاب والخوادم"
                  value={newAccNameAr}
                  onChange={e => setNewAccNameAr(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Group</label>
                  <select
                    value={newAccGroup}
                    onChange={e => setNewAccGroup(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Assets">Assets</option>
                    <option value="Liabilities">Liabilities</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="OperatingExpense">Operating Expense</option>
                    <option value="CostOfSales">Cost of Sales</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Posting Restriction</label>
                  <select
                    value={newAccRestriction}
                    onChange={e => setNewAccRestriction(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="POSTING_ALLOWED">Allowed</option>
                    <option value="CONTROL_ACCOUNT_ONLY">Control Only</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ctrlCheck"
                  checked={newAccIsControl}
                  onChange={e => setNewAccIsControl(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="ctrlCheck" className="text-xs text-slate-700">Is Control Account (AR/AP/INV/TAX)</label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewAccountModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-md"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Manual Journal Entry */}
      {isNewJournalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Create Double-Entry Manual Journal</h3>
              <button onClick={() => setIsNewJournalModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateJournal} className="p-6 space-y-4 text-xs font-medium text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Document Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. REF-AUDIT-2026-01"
                    value={newJeRef}
                    onChange={e => setNewJeRef(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Month-End Expense Accrual Adjustment"
                    value={newJeDesc}
                    onChange={e => setNewJeDesc(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Lines */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Journal Lines</span>
                  <button
                    type="button"
                    onClick={() => setNewJeLines([...newJeLines, { accountCode: '1010', description: 'New Line', debit: 0, credit: 0 }])}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-[11px] font-bold"
                  >
                    + Add Line
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {newJeLines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="col-span-4">
                        <select
                          value={line.accountCode}
                          onChange={e => {
                            const updated = [...newJeLines];
                            updated[idx].accountCode = e.target.value;
                            setNewJeLines(updated);
                          }}
                          className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                        >
                          {accounts.map(a => (
                            <option key={a.id} value={a.code}>{a.code} - {a.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Description"
                          value={line.description}
                          onChange={e => {
                            const updated = [...newJeLines];
                            updated[idx].description = e.target.value;
                            setNewJeLines(updated);
                          }}
                          className="w-full p-1.5 border border-slate-200 rounded text-xs"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Debit"
                          value={line.debit}
                          onChange={e => {
                            const updated = [...newJeLines];
                            updated[idx].debit = Number(e.target.value);
                            setNewJeLines(updated);
                          }}
                          className="w-full p-1.5 border border-slate-200 rounded text-xs font-mono"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Credit"
                          value={line.credit}
                          onChange={e => {
                            const updated = [...newJeLines];
                            updated[idx].credit = Number(e.target.value);
                            setNewJeLines(updated);
                          }}
                          className="w-full p-1.5 border border-slate-200 rounded text-xs font-mono"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => setNewJeLines(newJeLines.filter((_, i) => i !== idx))}
                          className="text-rose-600 hover:text-rose-800 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Balance Counter */}
              {(() => {
                const totDeb = newJeLines.reduce((s, l) => s + Number(l.debit || 0), 0);
                const totCred = newJeLines.reduce((s, l) => s + Number(l.credit || 0), 0);
                const isBal = Math.abs(totDeb - totCred) < 0.01;

                return (
                  <div className={`p-3 rounded-lg border text-xs flex items-center justify-between font-bold ${
                    isBal ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <span>Total Debits: {totDeb.toLocaleString()} SAR | Total Credits: {totCred.toLocaleString()} SAR</span>
                    <span>{isBal ? 'BALANCED ✓' : `OUT OF BALANCE (${Math.abs(totDeb - totCred).toLocaleString()} SAR)`}</span>
                  </div>
                );
              })()}

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewJournalModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-md"
                >
                  Save Draft Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Journal Details View */}
      {isJournalDetailsModalOpen && selectedJournal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Journal Entry {selectedJournal.entryNumber}</h3>
                <p className="text-xs text-indigo-200">{selectedJournal.description}</p>
              </div>
              <button onClick={() => setIsJournalDetailsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 font-medium">
                <div><span className="text-slate-400 block">Status:</span><span className="font-bold text-indigo-950">{selectedJournal.status}</span></div>
                <div><span className="text-slate-400 block">Posting Date:</span><span className="font-bold text-indigo-950">{selectedJournal.postingDate}</span></div>
                <div><span className="text-slate-400 block">Type:</span><span className="font-bold text-indigo-950">{selectedJournal.journalType}</span></div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-3">Line #</th>
                      <th className="py-2.5 px-3">Account Code</th>
                      <th className="py-2.5 px-3">Account Name</th>
                      <th className="py-2.5 px-3 text-right">Debit (SAR)</th>
                      <th className="py-2.5 px-3 text-right">Credit (SAR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium">
                    {selectedJournal.lines.map((l, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 text-slate-400 font-mono">{l.lineNo || i + 1}</td>
                        <td className="py-2 px-3 font-bold font-mono text-indigo-950">{l.accountCode}</td>
                        <td className="py-2 px-3">{l.accountName}</td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700">{l.debit > 0 ? l.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                        <td className="py-2 px-3 text-right font-mono text-indigo-700">{l.credit > 0 ? l.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1 font-mono text-[11px]">
                <div>Correlation ID: <span className="text-indigo-300">{selectedJournal.correlationId}</span></div>
                <div className="truncate">SHA-256 Hash: <span className="text-emerald-300">{selectedJournal.auditHash}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
