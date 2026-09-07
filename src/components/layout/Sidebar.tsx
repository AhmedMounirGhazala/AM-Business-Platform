/**
 * AM Business Platform - Navigation Sidebar
 * Organized by official Enterprise ERP Business Domains:
 * CORE, OPERATIONS, INTELLIGENCE, ADMINISTRATION, FUTURE
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Building, 
  Calculator, 
  Package, 
  ShoppingBag, 
  Truck, 
  Users, 
  UserCheck, 
  Bot, 
  Landmark,
  Factory,
  Store,
  Briefcase,
  Building2,
  PieChart,
  FileSpreadsheet,
  Workflow,
  FolderGit2,
  Database,
  Settings,
  ShieldCheck,
  ClipboardList,
  Sliders,
  Wrench,
  KeyRound,
  Car,
  Headphones,
  CheckCircle2,
  Cpu,
  Globe,
  ChevronDown,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { ModuleView, usePlatform } from '../../context/PlatformContext';

interface NavItem {
  id: ModuleView;
  labelEn: string;
  labelAr: string;
  icon: React.ComponentType<{ className?: string }>;
  isFuture?: boolean;
  badge?: string | number;
  badgeColor?: string;
}

interface NavCategory {
  titleEn: string;
  titleAr: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { lang, activeModule, setActiveModule, pendingApprovalsCount, anomaliesCount } = usePlatform();
  const isAr = lang === 'ar';

  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (title: string) => {
    setCollapsedCategories(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const navCategories: NavCategory[] = [
    {
      titleEn: 'CORE',
      titleAr: 'الوظائف الأساسية',
      items: [
        {
          id: 'dashboard',
          labelEn: 'Dashboard',
          labelAr: 'لوحة التحكم',
          icon: LayoutDashboard
        },
        {
          id: 'accounting',
          labelEn: 'Finance & Accounting',
          labelAr: 'المالية والمحاسبة',
          icon: Calculator
        },
        {
          id: 'inventory',
          labelEn: 'Inventory',
          labelAr: 'المخزون',
          icon: Package
        },
        {
          id: 'purchasing',
          labelEn: 'Purchasing',
          labelAr: 'المشتريات والتوريد',
          icon: Truck
        },
        {
          id: 'sales',
          labelEn: 'Sales & CRM',
          labelAr: 'المبيعات والعملاء',
          icon: ShoppingBag
        },
        {
          id: 'banking',
          labelEn: 'Banking & Treasury',
          labelAr: 'البنوك والخزينة',
          icon: Landmark
        }
      ]
    },
    {
      titleEn: 'OPERATIONS',
      titleAr: 'العمليات التشغيلية',
      items: [
        {
          id: 'manufacturing',
          labelEn: 'Manufacturing',
          labelAr: 'التصنيع',
          icon: Factory
        },
        {
          id: 'pos',
          labelEn: 'POS & Retail',
          labelAr: 'نقاط البيع والتجزئة',
          icon: Store,
          badge: 'POS',
          badgeColor: 'bg-[#F28C28] text-white'
        },
        {
          id: 'projects',
          labelEn: 'Projects',
          labelAr: 'إدارة المشاريع',
          icon: Briefcase,
          isFuture: true
        },
        {
          id: 'fixed_assets',
          labelEn: 'Fixed Assets',
          labelAr: 'الأصول الثابتة',
          icon: Building2
        },
        {
          id: 'hr',
          labelEn: 'HR & Payroll',
          labelAr: 'الموارد البشرية والرواتب',
          icon: UserCheck
        }
      ]
    },
    {
      titleEn: 'INTELLIGENCE',
      titleAr: 'الذكاء والتقارير',
      items: [
        {
          id: 'bi_analytics',
          labelEn: 'BI & Analytics',
          labelAr: 'الذكاء والتحليلات',
          icon: PieChart
        },
        {
          id: 'ai',
          labelEn: 'AI Assistant',
          labelAr: 'المساعد الذكي',
          icon: Bot,
          badge: anomaliesCount > 0 ? anomaliesCount : undefined,
          badgeColor: 'bg-amber-500 text-white'
        },
        {
          id: 'reports',
          labelEn: 'Reports Center',
          labelAr: 'مركز التقارير',
          icon: FileSpreadsheet
        },
        {
          id: 'workflows',
          labelEn: 'Workflow & Approvals',
          labelAr: 'الموافقات والدورات',
          icon: Workflow,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
          badgeColor: 'bg-rose-500 text-white'
        },
        {
          id: 'documents',
          labelEn: 'Document Management',
          labelAr: 'إدارة المستندات',
          icon: FolderGit2
        }
      ]
    },
    {
      titleEn: 'ADMINISTRATION',
      titleAr: 'الإدارة والحوكمة',
      items: [
        {
          id: 'master_data',
          labelEn: 'Master Data',
          labelAr: 'البيانات الأساسية',
          icon: Database
        },
        {
          id: 'settings',
          labelEn: 'Settings & Localization',
          labelAr: 'الإعدادات والتوطين',
          icon: Settings
        },
        {
          id: 'users_security',
          labelEn: 'Users & Security',
          labelAr: 'المستخدمين والأمان',
          icon: ShieldCheck
        },
        {
          id: 'audit_center',
          labelEn: 'Audit Center',
          labelAr: 'مركز التدقيق',
          icon: ClipboardList
        },
        {
          id: 'configuration_center',
          labelEn: 'Configuration Center',
          labelAr: 'مركز التهيئة',
          icon: Sliders
        },
        {
          id: 'platform_readiness',
          labelEn: 'Platform Readiness (100%)',
          labelAr: 'جاهزية المنصة والتشغيل',
          icon: ShieldCheck,
          badge: '100%',
          badgeColor: 'bg-emerald-500 text-white'
        }
      ]
    },
    {
      titleEn: 'FUTURE',
      titleAr: 'الوحدات المستقبلية',
      items: [
        {
          id: 'maintenance',
          labelEn: 'Maintenance',
          labelAr: 'الصيانة',
          icon: Wrench,
          isFuture: true
        },
        {
          id: 'rental',
          labelEn: 'Rental',
          labelAr: 'التأجير',
          icon: KeyRound,
          isFuture: true
        },
        {
          id: 'fleet',
          labelEn: 'Fleet Logistics',
          labelAr: 'الأسطول والسيارات',
          icon: Car,
          isFuture: true
        },
        {
          id: 'service_management',
          labelEn: 'Service Management',
          labelAr: 'إدارة الخدمات',
          icon: Headphones,
          isFuture: true
        },
        {
          id: 'quality_management',
          labelEn: 'Quality Management',
          labelAr: 'إدارة الجودة',
          icon: CheckCircle2,
          isFuture: true
        },
        {
          id: 'production_planning',
          labelEn: 'Production Planning',
          labelAr: 'تخطيط الإنتاج',
          icon: Cpu,
          isFuture: true
        },
        {
          id: 'ecommerce',
          labelEn: 'E-Commerce',
          labelAr: 'التجارة الإلكترونية',
          icon: Globe,
          isFuture: true
        }
      ]
    }
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hidden md:flex flex-col justify-between select-none overflow-y-auto max-h-[calc(100vh-64px)]">
      <div className="space-y-4">
        {navCategories.map((cat) => {
          const isCollapsed = collapsedCategories[cat.titleEn];

          return (
            <div key={cat.titleEn} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleCategory(cat.titleEn)}
                className="w-full px-2 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"
              >
                <span>{isAr ? cat.titleAr : cat.titleEn}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
              </button>

              {!isCollapsed && (
                <nav className="space-y-0.5">
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeModule === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveModule(item.id)}
                        className={`w-full min-h-[40px] flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition cursor-pointer ${
                          isActive
                            ? 'bg-[#0B1F3A] text-white shadow-md shadow-[#0B1F3A]/20 font-bold border border-[#F28C28]/30'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#F28C28]' : 'text-slate-500 dark:text-slate-400'}`} />
                          <span className="truncate text-xs font-semibold">
                            {isAr ? item.labelAr : item.labelEn}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.isFuture ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {isAr ? 'قريباً' : 'Soon'}
                            </span>
                          ) : item.badge ? (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-[#F28C28] text-white'}`}>
                              {item.badge}
                            </span>
                          ) : (
                            isActive && <ChevronRight className="w-3.5 h-3.5 text-[#F28C28] rtl:rotate-180" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </nav>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Branding */}
      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-900 dark:text-white font-semibold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F28C28]" />
              <span className="font-bold">{isAr ? 'منصة إيه إم للأعمال' : 'AM Business Platform'}</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-[#F28C28] bg-[#F28C28]/10 px-1.5 py-0.5 rounded-md border border-[#F28C28]/20">
              v2.8.0
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
            {isAr 
              ? 'نظام تشغيل المؤسسات وفق معايير IFRS مع التوطين الكامل' 
              : 'IFRS-Compliant Commercial ERP Engine'}
          </p>
        </div>
      </div>
    </aside>
  );
};
