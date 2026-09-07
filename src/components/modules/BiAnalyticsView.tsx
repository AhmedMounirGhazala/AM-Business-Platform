import React, { useState } from 'react';
import { 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  Sliders, 
  Filter, 
  Download, 
  Calendar, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Building2,
  Table,
  Zap,
  Sparkles
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const BiAnalyticsView: React.FC = () => {
  const { lang, activeCompany } = usePlatform();
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'executive' | 'financial' | 'sales' | 'inventory' | 'pivot'>('executive');
  const [dateRange, setDateRange] = useState('FY2026-Q1');

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold border border-emerald-500/20">
              INTELLIGENCE WORKSPACE
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">Enterprise BI & Analytics Engine</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2.5">
            <PieChart className="w-7 h-7 text-emerald-600" />
            <span>{isAr ? 'مركز ذكاء الأعمال والتحليلات المتقدمة' : 'BI & Advanced Business Analytics'}</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <option value="FY2026-Q1">FY2026 - Q1 (Current)</option>
            <option value="FY2025-ALL">FY2025 Full Year</option>
            <option value="MONTH-CURRENT">This Month (August 2026)</option>
          </select>

          <button 
            onClick={() => alert(isAr ? 'جاري تصدير التقرير التحليلي بدقة عالية' : 'Exporting BI Analytical Suite...')}
            className="px-4 py-2 rounded-xl bg-[#0B1F3A] text-white hover:bg-slate-800 font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer border border-[#F28C28]/30"
          >
            <Download className="w-4 h-4 text-[#F28C28]" />
            <span>{isAr ? 'تصدير التحليلات' : 'Export BI Analytics'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'executive', labelEn: 'Executive Dashboard', labelAr: 'اللوحة التنفيذية العليا', icon: PieChart },
          { id: 'financial', labelEn: 'Financial Analytics', labelAr: 'التحليلات المالية والربحية', icon: DollarSign },
          { id: 'sales', labelEn: 'Sales & Margin Matrix', labelAr: 'مصفوفة المبيعات والهامش', icon: ShoppingBag },
          { id: 'inventory', labelEn: 'Inventory Turnover', labelAr: 'دوران المخزون والاحتياج', icon: Package },
          { id: 'pivot', labelEn: 'Interactive Pivot Matrix', labelAr: 'جدول التحليل التفاعلي Pivot', icon: Table }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">{isAr ? 'صافي هامش الربح' : 'Net Profit Margin'}</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">28.4%</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">▲ +3.2% vs previous period</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">{isAr ? 'معدل دوران المخزون' : 'Inventory Turnover Ratio'}</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">6.8x</div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">Optimal 53 days inventory hold</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">{isAr ? 'تكلفة اكتساب العميل' : 'Customer Acquisition Cost (CAC)'}</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            2,450 <span className="text-xs font-normal text-slate-400">SAR</span>
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">LTV / CAC Ratio: 4.8x</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">{isAr ? 'العائد على الاستثمار (ROE)' : 'Return on Equity (ROE)'}</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">21.8%</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Top Industry Benchmark</div>
        </div>
      </div>

      {/* Main Analytics Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Revenue vs Cost Breakdown */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span>{isAr ? 'تحليل الإيرادات والتكاليف الشهرية' : 'Monthly Revenue vs Cost Distribution'}</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Values in SAR</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { month: 'Jan 2026', rev: 450000, cost: 290000, margin: '35.5%' },
              { month: 'Feb 2026', rev: 520000, cost: 330000, margin: '36.5%' },
              { month: 'Mar 2026', rev: 610000, cost: 380000, margin: '37.7%' },
              { month: 'Apr 2026', rev: 580000, cost: 360000, margin: '37.9%' },
              { month: 'May 2026', rev: 690000, cost: 410000, margin: '40.5%' }
            ].map(m => (
              <div key={m.month} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{m.month}</span>
                  <span className="text-emerald-600 font-bold">{m.rev.toLocaleString()} SAR (Margin: {m.margin})</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: `${(m.rev / 700000) * 100}%` }} />
                  <div className="bg-rose-400 h-full" style={{ width: `${(m.cost / 700000) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pivot Matrix Simulation */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-blue-500" />
              <span>{isAr ? 'مصفوفة التكاليف حسب خط الإنتاج والفرع' : 'Product Line & Branch Margin Pivot'}</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
              Live Data
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-mono text-[10px]">
                <tr>
                  <th className="p-2">{isAr ? 'خط المنتجات' : 'Product Line'}</th>
                  <th className="p-2">{isAr ? 'فرع الرياض' : 'Riyadh Branch'}</th>
                  <th className="p-2">{isAr ? 'فرع جدة' : 'Jeddah Branch'}</th>
                  <th className="p-2">{isAr ? 'الإجمالي' : 'Total Revenue'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                <tr>
                  <td className="p-2 font-bold text-slate-900 dark:text-white">Enterprise Software</td>
                  <td className="p-2">1,200,000 SAR</td>
                  <td className="p-2">850,000 SAR</td>
                  <td className="p-2 font-bold text-emerald-600">2,050,000 SAR</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-slate-900 dark:text-white">Hardware & Racks</td>
                  <td className="p-2">950,000 SAR</td>
                  <td className="p-2">620,000 SAR</td>
                  <td className="p-2 font-bold text-emerald-600">1,570,000 SAR</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-slate-900 dark:text-white">Cloud Hosting Services</td>
                  <td className="p-2">480,000 SAR</td>
                  <td className="p-2">310,000 SAR</td>
                  <td className="p-2 font-bold text-emerald-600">790,000 SAR</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
