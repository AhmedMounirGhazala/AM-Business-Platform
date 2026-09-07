import React, { useState } from 'react';
import { 
  Briefcase, 
  Layers, 
  DollarSign, 
  Clock, 
  Users, 
  TrendingUp, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Search, 
  FileText,
  PieChart
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const ProjectsView: React.FC = () => {
  const { lang, activeCompany } = usePlatform();
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'projects' | 'wbs' | 'jobCosting' | 'resources' | 'timesheets'>('projects');
  const [searchQuery, setSearchQuery] = useState('');

  const mockProjects = [
    {
      id: 'PRJ-2026-001',
      nameEn: 'Riyadh Metro Station Data Integration',
      nameAr: 'ربط بيانات محطة مترو الرياض',
      customer: 'Riyadh Development Authority',
      budget: 1450000,
      spent: 820000,
      progress: 68,
      status: 'On Track',
      manager: 'Eng. Khalid Al-Mansoor',
      deadline: '2026-11-30'
    },
    {
      id: 'PRJ-2026-002',
      nameEn: 'NEOM Logistics Warehouse Automation',
      nameAr: 'أتمتة مستودع اللوجستيات في نيوم',
      customer: 'NEOM Tech & Digital',
      budget: 3200000,
      spent: 2950000,
      progress: 88,
      status: 'At Risk',
      manager: 'Eng. Sarah Al-Otaibi',
      deadline: '2026-09-15'
    },
    {
      id: 'PRJ-2026-003',
      nameEn: 'Red Sea Global Solar Grid Integration',
      nameAr: 'تركيب شبكة الطاقة الشمسية للبحر الأحمر',
      customer: 'Red Sea Global Development',
      budget: 2800000,
      spent: 450000,
      progress: 22,
      status: 'On Track',
      manager: 'Eng. Tariq Ziad',
      deadline: '2027-03-31'
    }
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[11px] font-bold border border-blue-500/20">
              OPERATIONS WORKSPACE
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">Job Costing & WBS Hub</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-blue-600" />
            <span>{isAr ? 'إدارة المشاريع وتكلفة عقود الأعمال' : 'Projects & Job Costing Workspace'}</span>
          </h1>
        </div>

        <button 
          onClick={() => alert(isAr ? 'فتح نموذج مشروع جديد' : 'New Project Wizard initialized')}
          className="px-4 py-2.5 rounded-xl bg-[#0B1F3A] text-white hover:bg-slate-800 font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer border border-[#F28C28]/30"
        >
          <Plus className="w-4 h-4 text-[#F28C28]" />
          <span>{isAr ? 'مشروع جديد' : 'New Enterprise Project'}</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'projects', labelEn: 'Project List', labelAr: 'قائمة المشاريع', icon: Briefcase },
          { id: 'wbs', labelEn: 'Work Breakdown (WBS)', labelAr: 'هيكل العمل (WBS)', icon: Layers },
          { id: 'jobCosting', labelEn: 'Job Costing & Budget', labelAr: 'تكلفة المشروع والميزانية', icon: DollarSign },
          { id: 'resources', labelEn: 'Resource Allocation', labelAr: 'تخصيص الموارد والمهام', icon: Users },
          { id: 'timesheets', labelEn: 'Timesheets & Progress', labelAr: 'ساعات العمل والإنجاز', icon: Clock }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
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
          <div className="text-[11px] font-bold text-slate-400 uppercase">{isAr ? 'المشاريع النشطة' : 'Active Projects'}</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">12 Projects</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">✓ 10 On Track, 2 At Risk</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">{isAr ? 'إجمالي ميزانية العقود' : 'Total Contract Value'}</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            7,450,000 <span className="text-xs font-normal text-slate-400">{activeCompany?.currency || 'SAR'}</span>
          </div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">Earned Value (EV): 4,210,000 SAR</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">{isAr ? 'التكاليف الفعلية الملتزم بها' : 'Actual Spent vs Budget'}</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            4,220,000 <span className="text-xs font-normal text-slate-400">SAR</span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">Cost Performance Index (CPI): 0.99</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">{isAr ? 'متوسط نسبة الإنجاز' : 'Avg Completion Progress'}</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">59.3%</div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: '59.3%' }} />
          </div>
        </div>
      </div>

      {/* Main Content View */}
      {activeTab === 'projects' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث عن اسم المشروع أو العميل...' : 'Filter by project name or customer...'}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Showing {mockProjects.length} Enterprise Contracts
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-3">{isAr ? 'رقم المشروع' : 'Project ID'}</th>
                  <th className="p-3">{isAr ? 'اسم المشروع' : 'Project Name'}</th>
                  <th className="p-3">{isAr ? 'العميل' : 'Customer'}</th>
                  <th className="p-3">{isAr ? 'الميزانية' : 'Budget'}</th>
                  <th className="p-3">{isAr ? 'المصروف' : 'Spent'}</th>
                  <th className="p-3">{isAr ? 'الإنجاز' : 'Progress'}</th>
                  <th className="p-3">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="p-3">{isAr ? 'المسؤول' : 'Manager'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {mockProjects.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{p.id}</td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      {isAr ? p.nameAr : p.nameEn}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{p.customer}</td>
                    <td className="p-3 font-mono">{p.budget.toLocaleString()} SAR</td>
                    <td className="p-3 font-mono">{p.spent.toLocaleString()} SAR</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono">{p.progress}%</span>
                        <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full" style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        p.status === 'On Track' 
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{p.manager}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'wbs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" />
            <span>{isAr ? 'تفصيل هيكل العمل للمشروع (WBS Tree Breakdown)' : 'Work Breakdown Structure (WBS) Hierarchy'}</span>
          </h2>
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-slate-900 dark:text-white">1.0 Engineering & Site Survey (Budget: 350,000 SAR)</div>
              <div className="pl-4 rtl:pr-4 pt-2 space-y-1 text-slate-600 dark:text-slate-300">
                <div>1.1 Topographical Fiber Survey — <span className="text-emerald-600 font-bold">100% Completed</span></div>
                <div>1.2 Environmental Impact Assessment — <span className="text-emerald-600 font-bold">100% Completed</span></div>
                <div>1.3 System Architecture Design — <span className="text-blue-600 font-bold">85% In Progress</span></div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-slate-900 dark:text-white">2.0 Hardware Procurement & Fiber Cabling (Budget: 600,000 SAR)</div>
              <div className="pl-4 rtl:pr-4 pt-2 space-y-1 text-slate-600 dark:text-slate-300">
                <div>2.1 Cisco Industrial Switch Racks — <span className="text-emerald-600 font-bold">Delivered</span></div>
                <div>2.2 Fiber Optic Underground Trenching — <span className="text-amber-600 font-bold">45% In Progress</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'jobCosting' || activeTab === 'resources' || activeTab === 'timesheets') && (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
          <Clock className="w-10 h-10 text-blue-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isAr ? 'وحدة التكلفة وتتبع الساعات التلقائي' : 'Real-Time Job Costing & Timesheet Engine'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isAr 
              ? 'مربوطة تلقائياً مع محرك الفعالية المالية للمشتريات ورواتب الموظفين لحساب التكلفة الحقيقية بدون إدخال يدوي مكرر.'
              : 'Seamlessly linked with Purchasing & Payroll financial events for automatic job cost posting and earn-value tracking.'
            }
          </p>
        </div>
      )}

    </div>
  );
};
