/**
 * AM Business Platform - Financial Accounting Module
 * SAP / Oracle ERP Cloud Class Architecture
 * Event-Driven Financial Engine, Configurable Posting Rules Engine, Chart of Accounts, Journal Ledger, P&L, Balance Sheet
 */

import React, { useEffect, useState } from 'react';
import { 
  Calculator, 
  PlusCircle, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  X,
  Zap,
  Sliders,
  Activity
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { ApiClient } from '../../services/apiClient';
import { Account, JournalEntry, JournalLine, PostingRule, FinancialEvent } from '../../types';
import { GeneralLedgerManagementView } from './GeneralLedgerManagementView';

export const AccountingView: React.FC = () => {
  const { lang, triggerReload, reloadTrigger } = usePlatform();
  const isAr = lang === 'ar';

  const [subTab, setSubTab] = useState<'gl_engine' | 'journals' | 'postingRules' | 'financialEvents' | 'coa' | 'trial' | 'pl' | 'balanceSheet'>('gl_engine');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [postingRules, setPostingRules] = useState<PostingRule[]>([]);
  const [financialEvents, setFinancialEvents] = useState<FinancialEvent[]>([]);

  // Create Manual Adjusting Journal Entry Modal
  const [isCreateJeOpen, setIsCreateJeOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [jeLines, setJeLines] = useState<JournalLine[]>([
    { id: '1', accountCode: '1010', accountName: 'Cash on Hand & Bank', description: '', debit: 0, credit: 0 },
    { id: '2', accountCode: '4010', accountName: 'Sales Revenue - Cloud SaaS', description: '', debit: 0, credit: 0 }
  ]);
  const [jeError, setJeError] = useState('');

  // Create Account Modal
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [newAccCode, setNewAccCode] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccNameAr, setNewAccNameAr] = useState('');
  const [newAccCategory, setNewAccCategory] = useState<'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense'>('Expense');

  useEffect(() => {
    async function loadData() {
      try {
        const [coaRes, jeRes, prRes, feRes] = await Promise.all([
          ApiClient.getChartOfAccounts(),
          ApiClient.getJournalEntries(),
          ApiClient.getPostingRules(),
          ApiClient.getFinancialEvents()
        ]);
        setAccounts(coaRes);
        setJournals(jeRes);
        setPostingRules(prRes);
        setFinancialEvents(feRes);
      } catch (err) {
        console.error('Failed loading accounting data:', err);
      }
    }
    loadData();
  }, [reloadTrigger]);

  // Line item helpers for JE creation
  const addJeLine = () => {
    setJeLines([
      ...jeLines,
      { id: String(Date.now()), accountCode: '5010', accountName: 'Cost of Goods Sold (COGS)', description: '', debit: 0, credit: 0 }
    ]);
  };

  const removeJeLine = (id: string) => {
    if (jeLines.length > 2) {
      setJeLines(jeLines.filter(l => l.id !== id));
    }
  };

  const updateJeLine = (id: string, field: keyof JournalLine, value: any) => {
    setJeLines(jeLines.map(l => {
      if (l.id === id) {
        const updated = { ...l, [field]: value };
        if (field === 'accountCode') {
          const acc = accounts.find(a => a.code === value);
          if (acc) updated.accountName = acc.name;
        }
        return updated;
      }
      return l;
    }));
  };

  // Submit Manual Adjusting JE
  const handleSubmitJe = async () => {
    setJeError('');
    let totalD = 0;
    let totalC = 0;
    jeLines.forEach(l => {
      totalD += Number(l.debit || 0);
      totalC += Number(l.credit || 0);
    });

    if (Math.abs(totalD - totalC) > 0.01) {
      setJeError(isAr ? `خطأ القيد المزدوج: إجمالي المدين (${totalD.toLocaleString()}) يجب أن يساوي إجمالي الدائن (${totalC.toLocaleString()})` : `Double-entry validation error: Debits (${totalD.toLocaleString()}) must equal Credits (${totalC.toLocaleString()})`);
      return;
    }

    if (!description.trim()) {
      setJeError(isAr ? 'يرجى كتابة بيان القيد المحاسبي' : 'Journal entry description is required');
      return;
    }

    try {
      await ApiClient.createJournalEntry({
        description: `[Manual Adjustment] ${description}`,
        reference,
        lines: jeLines,
        createdBy: 'usr-001',
        createdByName: 'Ahmed Mounir'
      });
      setIsCreateJeOpen(false);
      setDescription('');
      setReference('');
      triggerReload();
    } catch (err: any) {
      setJeError(err.message);
    }
  };

  // Create Account
  const handleCreateAccount = async () => {
    if (!newAccCode || !newAccName) return;
    await ApiClient.createAccount({
      code: newAccCode,
      name: newAccName,
      nameAr: newAccNameAr || newAccName,
      category: newAccCategory,
      accountType: newAccCategory,
      balance: 0,
      currency: 'SAR',
      isActive: true,
      level: 1
    });
    setIsCreateAccountOpen(false);
    setNewAccCode('');
    setNewAccName('');
    setNewAccNameAr('');
    triggerReload();
  };

  // Financial Computations for Reports
  const totalAssets = accounts.filter(a => a.category === 'Asset').reduce((acc, a) => acc + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.category === 'Liability').reduce((acc, a) => acc + a.balance, 0);
  const totalEquity = accounts.filter(a => a.category === 'Equity').reduce((acc, a) => acc + a.balance, 0);
  const totalRevenue = accounts.filter(a => a.category === 'Revenue').reduce((acc, a) => acc + a.balance, 0);
  const totalExpenses = accounts.filter(a => a.category === 'Expense').reduce((acc, a) => acc + a.balance, 0);
  const netIncome = totalRevenue - totalExpenses;

  return (
    <div className="report-shell p-6 space-y-7">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-navy text-brand-gold shadow-sm">
              <Calculator className="w-5 h-5" />
            </span>
            <span>{isAr ? 'المحاسبة المالية' : 'Financial accounting'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr ? 'إدارة الحسابات والقيود والتقارير المالية من سجل موحد.' : 'Manage accounts, journals, and financial reports from one ledger.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateJeOpen(true)}
            className="btn-am-primary flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isAr ? 'قيد تعديل يدوي استثنائي' : 'Manual Adjusting Entry'}</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-xl text-xs font-semibold w-fit flex-wrap border border-slate-200/70 dark:border-slate-700/70">
        <button
          onClick={() => setSubTab('gl_engine')}
          className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 font-bold ${
            subTab === 'gl_engine' ? 'bg-brand-navy text-brand-gold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-700/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{isAr ? 'دفتر الأستاذ العام وإغلاق الحسابات' : 'General Ledger & Financial Closing'}</span>
        </button>

        <button
          onClick={() => setSubTab('journals')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            subTab === 'journals' ? 'bg-brand-navy text-brand-gold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-700/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{isAr ? 'دفتر قيود اليومية' : 'Journal Entries Ledger'}</span>
        </button>

        <button
          onClick={() => setSubTab('postingRules')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            subTab === 'postingRules' ? 'bg-brand-navy text-brand-gold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-700/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{isAr ? 'قواعد الترحيل الآلي' : 'Automated Posting Rules'}</span>
        </button>

        <button
          onClick={() => setSubTab('financialEvents')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            subTab === 'financialEvents' ? 'bg-brand-navy text-brand-gold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-700/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isAr ? 'سجل الفعاليات المالية' : 'Financial Events Stream'}</span>
        </button>

        <button
          onClick={() => setSubTab('coa')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
            subTab === 'coa' ? 'bg-brand-navy text-brand-gold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-700/60'
          }`}
        >
          {isAr ? 'دليل الحسابات' : 'Chart of Accounts'}
        </button>

        <button
          onClick={() => setSubTab('trial')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
            subTab === 'trial' ? 'bg-brand-navy text-brand-gold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-700/60'
          }`}
        >
          {isAr ? 'ميزان المراجعة' : 'Trial Balance'}
        </button>

        <button
          onClick={() => setSubTab('pl')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
            subTab === 'pl' ? 'bg-brand-navy text-brand-gold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-700/60'
          }`}
        >
          {isAr ? 'قائمة الدخل (P&L)' : 'Profit & Loss'}
        </button>

        <button
          onClick={() => setSubTab('balanceSheet')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
            subTab === 'balanceSheet' ? 'bg-brand-navy text-brand-gold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-700/60'
          }`}
        >
          {isAr ? 'الميزانية العمومية' : 'Balance Sheet'}
        </button>
      </div>

      {/* SUBTAB 0: General Ledger Engine & Financial Closing */}
      {subTab === 'gl_engine' && (
        <GeneralLedgerManagementView />
      )}

      {/* SUBTAB 1: Journal Entries Ledger */}
      {subTab === 'journals' && (
        <div className="report-card rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span>{isAr ? 'سجل قيود اليومية المعتمدة' : 'General Ledger Journal Entries'}</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Total: {journals.length} entries
            </span>
          </div>

          <div className="space-y-4">
            {journals.map((je) => (
              <div
                key={je.id}
                className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/30 dark:bg-slate-800/20"
              >
                {/* Entry Header */}
                <div className="bg-slate-100/80 dark:bg-slate-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                      {je.entryNumber}
                    </span>

                    {je.isAutoGenerated ? (
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-indigo-600" />
                        <span>Auto-Event Post</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        Manual Adjustment
                      </span>
                    )}

                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      je.status === 'Posted' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    }`}>
                      {je.status}
                    </span>

                    {je.reference && (
                      <span className="text-slate-500 font-mono">
                        Ref: {je.reference}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-slate-500">
                    <span>Date: <strong className="text-slate-900 dark:text-white">{je.date}</strong></span>
                    <span>Created By: <strong className="text-slate-900 dark:text-white">{je.createdByName}</strong></span>
                  </div>
                </div>

                {/* Description */}
                <div className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900">
                  {je.description}
                </div>

                {/* Lines Table */}
                <table className="report-table w-full text-left rtl:text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-2">{isAr ? 'رمز الحساب' : 'Account Code'}</th>
                      <th className="px-4 py-2">{isAr ? 'اسم الحساب' : 'Account Name'}</th>
                      <th className="px-4 py-2 text-right rtl:text-left">{isAr ? 'مدين (Debit SAR)' : 'Debit (SAR)'}</th>
                      <th className="px-4 py-2 text-right rtl:text-left">{isAr ? 'دائن (Credit SAR)' : 'Credit (SAR)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                    {je.lines.map((l, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 font-mono font-bold text-slate-800 dark:text-slate-200">{l.accountCode}</td>
                        <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{l.accountName}</td>
                        <td className="px-4 py-2 text-right rtl:text-left font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {l.debit > 0 ? l.debit.toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-2 text-right rtl:text-left font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {l.credit > 0 ? l.credit.toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-800/60 font-mono font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800">
                    <tr>
                      <td colSpan={2} className="px-4 py-2 text-right rtl:text-left uppercase font-sans text-slate-500">
                        {isAr ? 'الإجمالي المتوازن:' : 'Balanced Total:'}
                      </td>
                      <td className="px-4 py-2 text-right rtl:text-left text-emerald-600 dark:text-emerald-400">
                        {je.totalDebit.toLocaleString()} SAR
                      </td>
                      <td className="px-4 py-2 text-right rtl:text-left text-indigo-600 dark:text-indigo-400">
                        {je.totalCredit.toLocaleString()} SAR
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: Posting Rules Engine */}
      {subTab === 'postingRules' && (
        <div className="report-card rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>{isAr ? 'قواعد الترحيل الآلي للمستندات' : 'Configurable Posting Rules'}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'تحدد قواعد الترحيل الحسابات التي تتأثر عند اعتماد المستندات التجارية دون تعديل برمجي' : 'Defines Debit, Credit, Tax, and Discount GL Account mappings for each Document Type'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="report-table w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">{isAr ? 'نوع المستند' : 'Document Type'}</th>
                  <th className="px-4 py-3">{isAr ? 'اسم القاعدة' : 'Rule Name'}</th>
                  <th className="px-4 py-3">{isAr ? 'حساب المدين (Debit)' : 'Debit Account'}</th>
                  <th className="px-4 py-3">{isAr ? 'حساب الدائن (Credit)' : 'Credit Account'}</th>
                  <th className="px-4 py-3">{isAr ? 'حساب الضريبة (Tax)' : 'Tax Account'}</th>
                  <th className="px-4 py-3">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {postingRules.map((pr) => (
                  <tr key={pr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {pr.documentType}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {pr.name}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                      {pr.debitAccountCode} ({accounts.find(a => a.code === pr.debitAccountCode)?.name || 'Debit Acc'})
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                      {pr.creditAccountCode} ({accounts.find(a => a.code === pr.creditAccountCode)?.name || 'Credit Acc'})
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-500">
                      {pr.taxAccountCode ? `${pr.taxAccountCode} (VAT Output)` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Financial Events Log */}
      {subTab === 'financialEvents' && (
        <div className="report-card rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'الحركات المالية' : 'Financial activity'}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'سجل تتبع لحظي لجميع الأحداث المالية الواردة من المبيعات، المشتريات، والمخزون' : 'Real-time financial event publisher stream mapping business transactions to GL Entries'}
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Processed: {financialEvents.length} events</span>
          </div>

          <div className="space-y-3">
            {financialEvents.map((fe) => (
              <div key={fe.id} className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-emerald-600">{fe.eventType}</span>
                    <span className="text-slate-400">|</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{fe.sourceDocumentNumber}</span>
                  </div>
                  <span className="font-mono text-slate-400">{fe.eventDate}</span>
                </div>

                <div className="text-slate-600 dark:text-slate-300 font-medium">
                  {fe.description}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                  <span className="font-mono text-slate-500">Party: {fe.partyName || 'N/A'}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">Amount: {fe.amount.toLocaleString()} {fe.currency}</span>
                  <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 text-[10px]">
                    GL Entry: {fe.journalEntryId || 'PROCESSED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: Chart of Accounts */}
      {subTab === 'coa' && (
        <div className="report-card rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {isAr ? 'شجرة دليل الحسابات الموحد' : 'Hierarchical Chart of Accounts (COA)'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'الأصول، الالتزامات، حقوق الملكية، الإيرادات، والمصاريف' : 'Categorized Financial Accounts according to IFRS Standards'}
              </p>
            </div>

            <button
              onClick={() => setIsCreateAccountOpen(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isAr ? 'إضافة حساب جديد' : 'Add Account'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="report-table w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">{isAr ? 'رمز الحساب' : 'Code'}</th>
                  <th className="px-4 py-3">{isAr ? 'اسم الحساب' : 'Account Name'}</th>
                  <th className="px-4 py-3">{isAr ? 'الفئة' : 'Category'}</th>
                  <th className="px-4 py-3 text-right rtl:text-left">{isAr ? 'الرصيد الحالي' : 'Current Balance'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {acc.code}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {isAr ? acc.nameAr : acc.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        acc.category === 'Asset' ? 'bg-emerald-100 text-emerald-800' :
                        acc.category === 'Liability' ? 'bg-rose-100 text-rose-800' :
                        acc.category === 'Revenue' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {acc.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-slate-900 dark:text-white">
                      {acc.balance.toLocaleString()} {acc.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 5: Trial Balance */}
      {subTab === 'trial' && (
        <div className="report-card rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            {isAr ? 'ميزان المراجعة بالأرصدة والمدين/الدائن' : 'Trial Balance Report'}
          </h3>

          <div className="overflow-x-auto">
            <table className="report-table w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">{isAr ? 'رمز الحساب' : 'Code'}</th>
                  <th className="px-4 py-3">{isAr ? 'اسم الحساب' : 'Account Name'}</th>
                  <th className="px-4 py-3 text-right rtl:text-left">{isAr ? 'أرصدة مدينة (Debit SAR)' : 'Debit Balance'}</th>
                  <th className="px-4 py-3 text-right rtl:text-left">{isAr ? 'أرصدة دائنة (Credit SAR)' : 'Credit Balance'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {accounts.map((acc) => {
                  const isDebitCategory = acc.category === 'Asset' || acc.category === 'Expense';
                  return (
                    <tr key={acc.id}>
                      <td className="px-4 py-2.5 font-mono font-bold">{acc.code}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200">{isAr ? acc.nameAr : acc.name}</td>
                      <td className="px-4 py-2.5 text-right rtl:text-left font-mono font-bold text-emerald-600">
                        {isDebitCategory ? acc.balance.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right rtl:text-left font-mono font-bold text-indigo-600">
                        {!isDebitCategory ? acc.balance.toLocaleString() : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 6: P&L Statement */}
      {subTab === 'pl' && (
        <div className="report-card rounded-xl p-6 shadow-sm max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 text-center">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'قائمة الدخل - الأرباح والخسائر' : 'Income Statement (Profit & Loss)'}
            </h2>
            <p className="text-xs text-slate-500">For Fiscal Period 2026 YTD | Currency: SAR</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Revenue Section */}
            <div>
              <div className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2 border-b border-indigo-100 dark:border-indigo-950 pb-1">
                {isAr ? '1. إيرادات المبيعات والخدمات' : '1. Operating Revenues'}
              </div>
              {accounts.filter(a => a.category === 'Revenue').map(a => (
                <div key={a.id} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-700 dark:text-slate-300">{isAr ? a.nameAr : a.name}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{a.balance.toLocaleString()} SAR</span>
                </div>
              ))}
              <div className="flex justify-between py-2 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 rounded-lg mt-2">
                <span>{isAr ? 'إجمالي الإيرادات:' : 'Total Revenues:'}</span>
                <span className="font-mono">{totalRevenue.toLocaleString()} SAR</span>
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <div className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2 border-b border-rose-100 dark:border-rose-950 pb-1">
                {isAr ? '2. المصاريف التشغيلية والإدارية' : '2. Operating Expenses & COGS'}
              </div>
              {accounts.filter(a => a.category === 'Expense').map(a => (
                <div key={a.id} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-700 dark:text-slate-300">{isAr ? a.nameAr : a.name}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{a.balance.toLocaleString()} SAR</span>
                </div>
              ))}
              <div className="flex justify-between py-2 font-bold text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 px-2 rounded-lg mt-2">
                <span>{isAr ? 'إجمالي المصاريف:' : 'Total Expenses:'}</span>
                <span className="font-mono">{totalExpenses.toLocaleString()} SAR</span>
              </div>
            </div>

            {/* Net Profit Summary */}
            <div className="p-4 rounded-xl bg-brand-navy border border-brand-navy-light text-white flex justify-between items-center text-sm font-bold shadow-sm">
              <span>{isAr ? 'صافي الربح قبل الضريبة:' : 'Net Operating Income:'}</span>
              <span className="font-mono text-emerald-400 text-lg">{netIncome.toLocaleString()} SAR</span>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 7: Balance Sheet */}
      {subTab === 'balanceSheet' && (
        <div className="report-card rounded-xl p-6 shadow-sm max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 text-center">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'الميزانية العمومية المركزية' : 'Statement of Financial Position (Balance Sheet)'}
            </h2>
            <p className="text-xs text-slate-500">Assets = Liabilities + Owner Equity | SAR</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Assets */}
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30">
              <h3 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm border-b border-emerald-200 dark:border-emerald-900 pb-1">
                {isAr ? 'الأصول (Assets)' : 'Assets'}
              </h3>
              {accounts.filter(a => a.category === 'Asset').map(a => (
                <div key={a.id} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>{isAr ? a.nameAr : a.name}</span>
                  <span className="font-mono font-bold">{a.balance.toLocaleString()} SAR</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                <span>{isAr ? 'إجمالي الأصول:' : 'Total Assets:'}</span>
                <span className="font-mono">{totalAssets.toLocaleString()} SAR</span>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30">
              <h3 className="font-bold text-indigo-600 dark:text-indigo-400 text-sm border-b border-indigo-200 dark:border-indigo-900 pb-1">
                {isAr ? 'الالتزامات وحقوق الملكية' : 'Liabilities & Equity'}
              </h3>
              {accounts.filter(a => a.category === 'Liability' || a.category === 'Equity').map(a => (
                <div key={a.id} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>{isAr ? a.nameAr : a.name}</span>
                  <span className="font-mono font-bold">{a.balance.toLocaleString()} SAR</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-bold text-indigo-700 dark:text-indigo-300 text-sm">
                <span>{isAr ? 'إجمالي الالتزامات والملكية:' : 'Total Liabilities & Equity:'}</span>
                <span className="font-mono">{(totalLiabilities + totalEquity).toLocaleString()} SAR</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MANUAL ADJUSTING JOURNAL ENTRY MODAL */}
      {isCreateJeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="report-card w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                <span>{isAr ? 'إنشاء قيد تعديل يدوي استثنائي' : 'Create Manual Adjusting Entry'}</span>
              </h3>
              <button onClick={() => setIsCreateJeOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {jeError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{jeError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {isAr ? 'بيان القيد الاستثنائي' : 'Adjustment Description'}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Year-End Depreciation Adjustment or Auditor Reclassification"
                  className="w-full am-control bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {isAr ? 'المرجع / رقم المستند' : 'Reference Number'}
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="AUDIT-2026-ADJ"
                  className="w-full am-control bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>

              {/* Lines Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span>{isAr ? 'أسطر القيد (Debits & Credits)' : 'Journal Lines'}</span>
                  <button onClick={addJeLine} className="text-indigo-600 font-bold hover:underline cursor-pointer">
                    + {isAr ? 'إضافة سطر' : 'Add Line'}
                  </button>
                </div>

                {jeLines.map((line) => (
                  <div key={line.id} className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 p-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/40">
                    <select
                      value={line.accountCode}
                      onChange={(e) => updateJeLine(line.id, 'accountCode', e.target.value)}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-mono w-1/2"
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.code}>{a.code} - {a.name}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      placeholder="Debit"
                      value={line.debit || ''}
                      onChange={(e) => updateJeLine(line.id, 'debit', Number(e.target.value))}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 font-mono text-xs w-1/4 text-emerald-600 font-bold"
                    />

                    <input
                      type="number"
                      placeholder="Credit"
                      value={line.credit || ''}
                      onChange={(e) => updateJeLine(line.id, 'credit', Number(e.target.value))}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 font-mono text-xs w-1/4 text-indigo-600 font-bold"
                    />

                    <button onClick={() => removeJeLine(line.id)} className="text-slate-400 hover:text-rose-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                Debits: <span className="text-emerald-600">{jeLines.reduce((a, b) => a + (Number(b.debit)||0), 0).toLocaleString()}</span> | Credits: <span className="text-indigo-600">{jeLines.reduce((a, b) => a + (Number(b.credit)||0), 0).toLocaleString()}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsCreateJeOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitJe}
                  className="btn-am-primary px-4 py-2 rounded-lg text-xs cursor-pointer shadow-sm"
                >
                  {isAr ? 'ترحيل القيد الاستثنائي' : 'Post Adjustment'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CREATE ACCOUNT MODAL */}
      {isCreateAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="report-card w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isAr ? 'إضافة حساب جديد بالدليل' : 'Add New Account to COA'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Account Code</label>
                <input
                  type="text"
                  placeholder="e.g. 5040"
                  value={newAccCode}
                  onChange={(e) => setNewAccCode(e.target.value)}
                  className="w-full am-control bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Account Name (EN)</label>
                <input
                  type="text"
                  placeholder="e.g. Legal & Professional Fees"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full am-control bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Account Name (AR)</label>
                <input
                  type="text"
                  placeholder="أتعاب استشارية وقانونية"
                  value={newAccNameAr}
                  onChange={(e) => setNewAccNameAr(e.target.value)}
                  className="w-full am-control bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={newAccCategory}
                  onChange={(e) => setNewAccCategory(e.target.value as any)}
                  className="w-full am-control bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                  <option value="Revenue">Revenue</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCreateAccountOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAccount}
                className="btn-am-primary px-4 py-2 rounded-lg text-xs cursor-pointer shadow-sm"
              >
                Save Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
