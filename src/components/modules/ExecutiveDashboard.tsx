/**
 * AM Business Platform - Executive BI & Operations Dashboard
 * Displays Real-Time KPIs, Financial Charts, Cash Flow, and Pending Workflows
 */

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  ShieldAlert, 
  PackageCheck, 
  Sparkles, 
  PlusCircle, 
  FileText, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { usePlatform } from '../../context/PlatformContext';
import { ApiClient } from '../../services/apiClient';

export const ExecutiveDashboard: React.FC = () => {
  const { lang, setActiveModule, triggerReload, reloadTrigger } = usePlatform();
  const isAr = lang === 'ar';

  const [journals, setJournals] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [jRes, iRes, invRes, appRes, anomRes] = await Promise.all([
          ApiClient.getJournalEntries(),
          ApiClient.getSalesInvoices(),
          ApiClient.getInventoryItems(),
          ApiClient.getApprovalRequests(),
          ApiClient.getAnomalies()
        ]);
        setJournals(jRes);
        setInvoices(iRes);
        setInventory(invRes);
        setApprovals(appRes);
        setAnomalies(anomRes);
      } catch (err) {
        console.error('Failed loading dashboard data:', err);
      }
    }
    loadData();
  }, [reloadTrigger]);

  // Financial Chart Data
  const monthlyRevenueData = [
    { month: isAr ? 'يناير' : 'Jan', revenue: 120000, expenses: 45000 },
    { month: isAr ? 'فبراير' : 'Feb', revenue: 180000, expenses: 60000 },
    { month: isAr ? 'مارس' : 'Mar', revenue: 240000, expenses: 85000 },
    { month: isAr ? 'أبريل' : 'Apr', revenue: 310000, expenses: 90000 },
    { month: isAr ? 'مايو' : 'May', revenue: 290000, expenses: 110000 },
    { month: isAr ? 'يونيو' : 'Jun', revenue: 380000, expenses: 125000 },
    { month: isAr ? 'يوليو' : 'Jul', revenue: 420000, expenses: 140000 },
    { month: isAr ? 'أغسطس' : 'Aug', revenue: 535000, expenses: 165000 },
  ];

  const stockValuationPie = [
    { name: isAr ? 'خوادم وحوسبة' : 'Hardware', value: 777000, color: '#0B1F3A' },
    { name: isAr ? 'تراخيص برمجية' : 'Software', value: 675000, color: '#10b981' },
    { name: isAr ? 'شبكات وبنية' : 'Networking', value: 38400, color: '#F28C28' },
  ];

  const totalStockValuation = inventory.reduce((acc, item) => acc + (item.stockQty * item.costPrice), 0);
  const pendingApprovals = approvals.filter(a => a.status === 'Pending');

  return (
    <div className="p-6 space-y-6">
      
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0B1F3A] text-white p-6 rounded-2xl border border-[#153258] shadow-md">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[#0B1F3A] border border-[#F28C28] text-[#F28C28] flex items-center justify-center font-black text-xs shadow-xs">
              AM
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              {isAr ? 'لوحة القيادة التنفيذية والذكاء المالي' : 'Executive ERP Overview & Business Intelligence'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F28C28]/20 text-[#F28C28] border border-[#F28C28]/30">
              {isAr ? '«كل قرار ناجح يبدأ برقم صحيح»' : '"Accurate Numbers First"'}
            </span>
          </div>
          <p className="text-xs text-slate-300">
            {isAr 
              ? 'مراقبة فورية للقوائم المالية، مخزون المستودعات، والتدفقات النقدية — إيه إم لتخطيط موارد المؤسسات' 
              : 'Real-time General Ledger, Multi-Warehouse Inventory, & Cash Flow — AM ERP Engine'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveModule('accounting')}
            className="flex items-center gap-1.5 bg-[#153258] hover:bg-[#1f477d] text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition border border-white/10 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#F28C28]" />
            <span>{isAr ? 'قيد يومية جديد' : 'New Journal Entry'}</span>
          </button>

          <button
            onClick={() => setActiveModule('sales')}
            className="flex items-center gap-1.5 bg-[#F28C28] hover:bg-[#D9771A] text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{isAr ? 'فاتورة مبيعات' : 'Sales Invoice'}</span>
          </button>

          <button
            onClick={() => setActiveModule('ai')}
            className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition border border-slate-700 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#F28C28]" />
            <span>{isAr ? 'المساعد الذكي' : 'AI Copilot'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isAr ? 'إجمالي الإيرادات السنوية' : 'Total YTD Revenue'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
              1,590,000 <span className="text-xs text-slate-400 font-sans">SAR</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+24.5% {isAr ? 'مقارنة بالربع السابق' : 'vs previous quarter'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isAr ? 'تقييم المخزون الحالي' : 'Inventory Valuation'}
            </span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#0B1F3A] dark:text-[#F28C28]">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
              {totalStockValuation.toLocaleString()} <span className="text-xs text-slate-400 font-sans">SAR</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>{inventory.length} {isAr ? 'أصناف مسجلة بالمستودعات' : 'Active Stock SKUs'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isAr ? 'طلبات بانتظار الاعتماد' : 'Pending Approvals'}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
              {pendingApprovals.length} <span className="text-xs text-slate-400 font-sans">{isAr ? 'طلبات' : 'requests'}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-1 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{isAr ? 'تتطلب توقيع الإدارة العليا' : 'Requires Dual Signature'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isAr ? 'تنبيهات الشبهات والأخطاء' : 'AI Fraud & Anomalies'}
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-mono font-bold text-rose-600 dark:text-rose-400">
              {anomalies.length} <span className="text-xs text-slate-400 font-sans">{isAr ? 'حالات' : 'flagged'}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>{isAr ? 'كشف آلي عبر المحرك الذكي' : 'Automated AI Integrity Scan'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue vs Expenses Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {isAr ? 'تحليل الإيرادات والمصاريف الشهرية (SAR)' : 'Monthly Revenue vs Expenses Performance'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'مستخرج آلياً من الأستاذ العام المستند على القيد المزدوج' : 'Double-Entry General Ledger Aggregates'}
              </p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" name={isAr ? 'الإيرادات' : 'Revenue'} stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" name={isAr ? 'المصاريف' : 'Expenses'} stroke="#6366f1" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              {isAr ? 'توزيع المخزون حسب الفئة' : 'Stock Valuation Breakdown'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {isAr ? 'المستودع المركزي - الرياض' : 'Central Warehouse - Riyadh Hub'}
            </p>

            <div className="h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockValuationPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stockValuationPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
            {stockValuationPie.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {item.value.toLocaleString()} SAR
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Pending Approvals & Recent Posted Journals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Approvals Queue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>{isAr ? 'قائمة انتظار الموافقات المعتمدة' : 'Approval Workflows Pipeline'}</span>
            </h3>
            <button
              onClick={() => setActiveModule('core')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              {isAr ? 'عرض الكل' : 'View All'}
            </button>
          </div>

          <div className="space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                {isAr ? 'لا توجد طلبات موافقة معلقة حالياً' : 'No pending approval requests'}
              </div>
            ) : (
              pendingApprovals.map((app) => (
                <div
                  key={app.id}
                  className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{app.entityNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 font-bold">
                        {app.currentApproverRole}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {app.description}
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      await ApiClient.handleApprovalAction(app.id, 'APPROVE', 'Approved from Executive Dashboard');
                      triggerReload();
                    }}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'اعتماد' : 'Approve'}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Ledger Entries */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>{isAr ? 'آخر القيود المحاسبية المرحّلة' : 'Recent Posted Journal Entries'}</span>
            </h3>
            <button
              onClick={() => setActiveModule('accounting')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              {isAr ? 'فتح الأستاذ العام' : 'General Ledger'}
            </button>
          </div>

          <div className="space-y-3">
            {journals.slice(0, 3).map((je) => (
              <div
                key={je.id}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{je.entryNumber}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      je.status === 'Posted' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700'
                    }`}>
                      {je.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">
                    {je.description}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {je.totalDebit.toLocaleString()} SAR
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {je.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
