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
  Palette,
  Wrench,
  KeyRound,
  Car,
  Headphones,
  CheckCircle2,
  Cpu,
  Globe,
  ChevronDown,
  Sparkles,
  Award,
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
  const { 
    lang, 
    activeModule, 
    setActiveModule, 
    pendingApprovalsCount, 
    anomaliesCount, 
    branding, 
    activeCompany 
  } = usePlatform();
  const isAr = lang === 'ar';

  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (title: string) => {
    setCollapsedCategories(prev => ({ ...prev, [title]: !prev[title] }));
  };

  // Feature Gating: Vertical-aware logic
  const isManufacturingEnabled = Boolean(
    (activeCompany as any)?.vertical?.includes('MFG') ||
    (activeCompany as any)?.industry === 'MANUFACTURING' ||
    (activeCompany as any)?.vertical === 'GARMENT_MANUFACTURING' ||
    (activeCompany as any)?.enableManufacturing ||
    activeCompany?.name?.toLowerCase().includes('manufacturing') ||
    activeCompany?.nameAr?.includes('تصنيع') ||
    activeModule === 'manufacturing'
  );

  const rawCategories: (NavCategory & { isVisible?: boolean })[] = [
    {
      titleEn: 'WORKSPACE',
      titleAr: 'مساحة العمل والذكاء',
      items: [
        {
          id: 'dashboard',
          labelEn: 'Executive Dashboard',
          labelAr: 'لوحة القيادة التنفيذية',
          icon: LayoutDashboard
        },
        {
          id: 'ai',
          labelEn: 'AI Copilot & Auditing',
          labelAr: 'المساعد الذكي والتدقيق',
          icon: Bot,
          badge: anomaliesCount > 0 ? anomaliesCount : undefined,
          badgeColor: 'bg-amber-500 text-white'
        },
        {
          id: 'bi_analytics',
          labelEn: 'BI & Financial Analytics',
          labelAr: 'الذكاء المالي والتحليلات',
          icon: PieChart
        },
        {
          id: 'reports',
          labelEn: 'Executive Reports Center',
          labelAr: 'مركز التقارير التنفيذية',
          icon: FileSpreadsheet
        }
      ]
    },
    {
      titleEn: 'SALES & DISTRIBUTION',
      titleAr: 'المبيعات والتوزيع',
      items: [
        {
          id: 'sales',
          labelEn: 'Sales & CRM Invoicing',
          labelAr: 'المبيعات والعملاء والفواتير',
          icon: ShoppingBag
        },
        {
          id: 'pos',
          labelEn: 'POS & Retail Counters',
          labelAr: 'نقاط البيع والتجزئة',
          icon: Store,
          badge: 'POS',
          badgeColor: 'bg-[#C9A227] text-slate-950 font-black'
        },
        {
          id: 'documents',
          labelEn: 'Commercial Documents & Archive',
          labelAr: 'أرشيف المستندات التجارية',
          icon: FolderGit2
        }
      ]
    },
    {
      titleEn: 'PROCUREMENT & SUPPLY',
      titleAr: 'المشتريات والمخازن',
      items: [
        {
          id: 'purchasing',
          labelEn: 'Purchasing & Vendor Bills',
          labelAr: 'المشتريات وفواتير الموردين',
          icon: Truck
        },
        {
          id: 'inventory',
          labelEn: 'Multi-Warehouse Inventory',
          labelAr: 'إدارة المخازن والمستودعات',
          icon: Package
        }
      ]
    },
    {
      titleEn: 'MANUFACTURING & PRODUCTION',
      titleAr: 'التصنيع والإنتاج',
      isVisible: isManufacturingEnabled,
      items: [
        {
          id: 'manufacturing',
          labelEn: 'Garment & Assembly Operations',
          labelAr: 'إدارة التصنيع والملابس',
          icon: Factory,
          badge: isAr ? 'إنتاج' : 'MFG',
          badgeColor: 'bg-indigo-600 text-white'
        }
      ]
    },
    {
      titleEn: 'FINANCE & TREASURY',
      titleAr: 'المالية والخزينة',
      items: [
        {
          id: 'accounting',
          labelEn: 'General Ledger & Chart of Accounts',
          labelAr: 'الأستاذ العام ودليل الحسابات',
          icon: Calculator
        },
        {
          id: 'banking',
          labelEn: 'Banking & Treasury Flow',
          labelAr: 'الحسابات البنكية والخزينة',
          icon: Landmark
        },
        {
          id: 'fixed_assets',
          labelEn: 'Fixed Assets & Depreciation',
          labelAr: 'الأصول الثابتة والإهلاك',
          icon: Building2
        },
        {
          id: 'hr',
          labelEn: 'HR & Payroll Management',
          labelAr: 'الموارد البشرية ومسير الرواتب',
          icon: UserCheck
        }
      ]
    },
    {
      titleEn: 'GOVERNANCE & COMPLIANCE',
      titleAr: 'الحوكمة والامتثال',
      items: [
        {
          id: 'workflows',
          labelEn: 'Approval Workflows & Dual Sig',
          labelAr: 'دورات الاعتماد والتوقيع المزدوج',
          icon: Workflow,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
          badgeColor: 'bg-rose-500 text-white font-bold'
        },
        {
          id: 'audit_center',
          labelEn: 'Immutable Audit Trail',
          labelAr: 'مركز التدقيق وسجل الحركات',
          icon: ClipboardList
        },
        {
          id: 'users_security',
          labelEn: 'RBAC Users & Permissions',
          labelAr: 'المستخدمين والصلاحيات (RBAC)',
          icon: ShieldCheck
        }
      ]
    },
    {
      titleEn: 'ADMINISTRATION & SYSTEM',
      titleAr: 'الإدارة والنظام',
      items: [
        {
          id: 'master_data',
          labelEn: 'Enterprise Master Data',
          labelAr: 'البيانات الأساسية الموحدة',
          icon: Database
        },
        {
          id: 'settings',
          labelEn: 'Taxes, ZATCA & Regional Settings',
          labelAr: 'الضرائب وإعدادات التوطين',
          icon: Settings
        },
        {
          id: 'configuration_center',
          labelEn: 'Fiscal Configuration Center',
          labelAr: 'مركز التهيئة والسنوات المالية',
          icon: Sliders
        },
        {
          id: 'branding',
          labelEn: 'Tenant Identity & White-Label',
          labelAr: 'الهوية المؤسسية والشعار',
          icon: Palette
        },
        {
          id: 'platform_readiness',
          labelEn: 'Enterprise Operational Readiness',
          labelAr: 'جاهزية المنصة التشغيلية',
          icon: ShieldCheck,
          badge: '100%',
          badgeColor: 'bg-emerald-600 text-white font-bold'
        },
        {
          id: 'onboarding_wizard',
          labelEn: 'First-Run Setup Wizard',
          labelAr: 'معالج التهيئة الأولية',
          icon: Award
        }
      ]
    },
    {
      titleEn: 'EXTENSIONS & SERVICES',
      titleAr: 'الوحدات الممتدة والخدمات',
      items: [
        {
          id: 'projects',
          labelEn: 'Project Costing & WBS',
          labelAr: 'إدارة المشاريع والتكاليف',
          icon: Briefcase,
          isFuture: true
        },
        {
          id: 'maintenance',
          labelEn: 'Plant & Equipment Maintenance',
          labelAr: 'الصيانة الوقائية والمعدات',
          icon: Wrench,
          isFuture: true
        },
        {
          id: 'rental',
          labelEn: 'Equipment & Asset Rental',
          labelAr: 'إدارة التأجير والعقود',
          icon: KeyRound,
          isFuture: true
        },
        {
          id: 'fleet',
          labelEn: 'Fleet & Dispatch Logistics',
          labelAr: 'إدارة الأسطول واللوجستيات',
          icon: Car,
          isFuture: true
        },
        {
          id: 'service_management',
          labelEn: 'Field & Customer Service',
          labelAr: 'إدارة الخدمات الميدانية',
          icon: Headphones,
          isFuture: true
        },
        {
          id: 'quality_management',
          labelEn: 'Quality Assurance & ISO',
          labelAr: 'إدارة الجودة الشاملة',
          icon: CheckCircle2,
          isFuture: true
        },
        {
          id: 'production_planning',
          labelEn: 'Advanced MPS & MRP Planning',
          labelAr: 'تخطيط الاحتياجات (MRP/MPS)',
          icon: Cpu,
          isFuture: true
        },
        {
          id: 'ecommerce',
          labelEn: 'B2B & Omnichannel Commerce',
          labelAr: 'التجارة الإلكترونية المترابطة',
          icon: Globe,
          isFuture: true
        }
      ]
    }
  ];

  const navCategories = rawCategories.filter(cat => cat.isVisible !== false);

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
                  {cat.items.filter(item => !item.isFuture).map((item) => {
                    const Icon = item.icon;
                    const isActive = activeModule === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveModule(item.id)}
                        style={isActive ? {
                          backgroundColor: branding?.primaryColor || '#0B1F3A',
                          borderColor: `${branding?.accentColor || '#C9A227'}4D`
                        } : {}}
                        className={`w-full min-h-[40px] flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition cursor-pointer ${
                          isActive
                            ? 'text-white shadow-md font-bold border'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate min-w-0">
                          <Icon 
                            className="w-4 h-4 shrink-0" 
                            style={isActive ? { color: branding?.accentColor || '#C9A227' } : {}} 
                          />
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
                            <span 
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'text-white'}`}
                              style={!item.badgeColor ? { backgroundColor: branding?.accentColor || '#C9A227' } : {}}
                            >
                              {item.badge}
                            </span>
                          ) : (
                            isActive && (
                              <ChevronRight 
                                className="w-3.5 h-3.5 rtl:rotate-180" 
                                style={{ color: branding?.accentColor || '#C9A227' }} 
                              />
                            )
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
              <Sparkles className="w-3.5 h-3.5" style={{ color: branding?.accentColor || '#C9A227' }} />
              <span className="font-bold truncate max-w-[140px]">
                {isAr 
                  ? (branding?.appNameAr || branding?.appName || 'منصة إيه إم للأعمال')
                  : (branding?.appName || 'AM Business OS')}
              </span>
            </span>
            <span 
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border"
              style={{
                color: branding?.accentColor || '#C9A227',
                backgroundColor: `${branding?.accentColor || '#C9A227'}1A`,
                borderColor: `${branding?.accentColor || '#C9A227'}33`
              }}
            >
              v2.8.0
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
            {branding?.tradingName || (isAr 
              ? 'نظام تشغيل المؤسسات وفق معايير IFRS مع التوطين الكامل' 
              : 'IFRS-Compliant Commercial ERP Engine')}
          </p>
          {(branding?.showPoweredBy ?? true) && (
            <div className="text-[9px] text-slate-400 pt-1.5 border-t border-slate-200 dark:border-slate-700/60 space-y-0.5">
              <div className="font-semibold text-slate-500 dark:text-slate-300">
                {isAr ? 'مدعوم بواسطة إيه إم • أحمد منير' : 'Powered by AM Business OS • Ahmed Mounir'}
              </div>
              <div className="text-[8.5px] text-[#C9A227] italic">
                {isAr ? '«كل قرار ناجح يبدأ برقم صحيح»' : '"Every successful decision begins with an accurate number"'}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
