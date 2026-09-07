/**
 * AM Business Platform - Global React State Context
 * Handles Multi-Tenant switching, Language (AR/EN), RTL, Themes, & Module Navigation
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Company, Tenant, User, Warehouse } from '../types';
import { ApiClient } from '../services/apiClient';

export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light';
export type ModuleView = 
  | 'dashboard'
  | 'core'
  | 'accounting'
  | 'inventory'
  | 'sales'
  | 'purchasing'
  | 'crm'
  | 'hr'
  | 'ai'
  | 'banking'
  | 'manufacturing'
  | 'pos'
  | 'projects'
  | 'fixed_assets'
  | 'bi_analytics'
  | 'reports'
  | 'workflows'
  | 'documents'
  | 'master_data'
  | 'settings'
  | 'users_security'
  | 'audit_center'
  | 'configuration_center'
  | 'platform_readiness'
  | 'maintenance'
  | 'rental'
  | 'fleet'
  | 'service_management'
  | 'quality_management'
  | 'production_planning'
  | 'ecommerce';

interface PlatformContextType {
  lang: Language;
  dir: 'rtl' | 'ltr';
  setLang: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  activeModule: ModuleView;
  setActiveModule: (mod: ModuleView) => void;
  
  // Contexts
  tenants: Tenant[];
  activeTenant: Tenant | null;
  setActiveTenant: (t: Tenant) => void;
  
  companies: Company[];
  activeCompany: Company | null;
  setActiveCompany: (c: Company) => void;
  
  warehouses: Warehouse[];
  activeWarehouse: Warehouse | null;
  setActiveWarehouse: (w: Warehouse) => void;
  
  currentUser: User | null;
  
  // State Triggers
  pendingApprovalsCount: number;
  anomaliesCount: number;
  reloadTrigger: number;
  triggerReload: () => void;

  // Search Modal
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Favorites
  favorites: ModuleView[];
  toggleFavorite: (mod: ModuleView) => void;
  isFavorite: (mod: ModuleView) => boolean;

  // Recently Used
  recentPages: Array<{ id: ModuleView; titleEn: string; titleAr: string; timestamp: number }>;
  addRecentPage: (id: ModuleView, titleEn: string, titleAr: string) => void;

  // Enterprise Notifications
  notifications: Array<{
    id: string;
    titleEn: string;
    titleAr: string;
    messageEn: string;
    messageAr: string;
    priority: 'critical' | 'high' | 'medium' | 'info';
    timestamp: string;
    read: boolean;
    category: string;
    actionModule?: ModuleView;
  }>;
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Role Personalization
  activeRole: 'ceo' | 'finance' | 'warehouse' | 'sales' | 'purchasing' | 'hr' | 'management';
  setActiveRole: (role: 'ceo' | 'finance' | 'warehouse' | 'sales' | 'purchasing' | 'hr' | 'management') => void;

  // Workspace Personalization
  dashboardWidgets: Array<{ id: string; titleEn: string; titleAr: string; visible: boolean; order: number }>;
  toggleWidgetVisibility: (id: string) => void;
  resetWidgetLayout: () => void;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [activeModule, setActiveModuleState] = useState<ModuleView>('dashboard');

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [activeWarehouse, setActiveWarehouse] = useState<Warehouse | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [anomaliesCount, setAnomaliesCount] = useState<number>(0);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Favorites state
  const [favorites, setFavorites] = useState<ModuleView[]>(() => {
    try {
      const saved = localStorage.getItem('am_erp_favorites');
      return saved ? JSON.parse(saved) : ['accounting', 'inventory', 'sales', 'reports'];
    } catch {
      return ['accounting', 'inventory', 'sales', 'reports'];
    }
  });

  // Recently used pages state
  const [recentPages, setRecentPages] = useState<Array<{ id: ModuleView; titleEn: string; titleAr: string; timestamp: number }>>(() => {
    try {
      const saved = localStorage.getItem('am_erp_recents');
      return saved ? JSON.parse(saved) : [
        { id: 'accounting', titleEn: 'Finance & Accounting', titleAr: 'المالية والمحاسبة', timestamp: Date.now() - 3600000 },
        { id: 'inventory', titleEn: 'Inventory', titleAr: 'المخزون', timestamp: Date.now() - 7200000 },
        { id: 'sales', titleEn: 'Sales & CRM', titleAr: 'المبيعات والعملاء', timestamp: Date.now() - 10800000 }
      ];
    } catch {
      return [];
    }
  });

  // Role personalization state
  const [activeRole, setActiveRoleState] = useState<'ceo' | 'finance' | 'warehouse' | 'sales' | 'purchasing' | 'hr' | 'management'>('ceo');

  // Enterprise Notifications
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    titleEn: string;
    titleAr: string;
    messageEn: string;
    messageAr: string;
    priority: 'critical' | 'high' | 'medium' | 'info';
    timestamp: string;
    read: boolean;
    category: string;
    actionModule?: ModuleView;
  }>>([
    {
      id: 'notif-1',
      titleEn: 'Pending Purchase Order Approval',
      titleAr: 'طلب موافقة أمر شراء معلق',
      messageEn: 'PO-2026-0098 for SAR 142,500 requires CFO authorization',
      messageAr: 'أمر الشراء PO-2026-0098 بمبلغ 142,500 ريال يتطلب اعتماد المدير المالي',
      priority: 'high',
      timestamp: '10 mins ago',
      read: false,
      category: 'Workflow',
      actionModule: 'workflows'
    },
    {
      id: 'notif-[#2]',
      titleEn: 'Low Stock Alert',
      titleAr: 'تنبيه انخفاض المخزون',
      messageEn: 'Item SKU-1002 (Enterprise Server Rack) fell below reorder threshold (2 units left)',
      messageAr: 'الصنف SKU-1002 انخفض عن حد إعادة الطلب (المتبقي 2 وحدة)',
      priority: 'high',
      timestamp: '25 mins ago',
      read: false,
      category: 'Inventory',
      actionModule: 'inventory'
    },
    {
      id: 'notif-3',
      titleEn: 'ZATCA E-Invoicing Sync Verified',
      titleAr: 'مزامنة الفوترة الإلكترونية مع زكاة',
      messageEn: 'Phase 2 cryptographic stamp verified for 24 batch invoices',
      messageAr: 'تم التثبت من الختم المشفر لمرحلة هيئة الزكاة الثانية لـ 24 فاتورة',
      priority: 'info',
      timestamp: '1 hour ago',
      read: true,
      category: 'Compliance',
      actionModule: 'accounting'
    },
    {
      id: 'notif-4',
      titleEn: 'Customer Credit Limit Warning',
      titleAr: 'تحذير حد الائتمان للعميل',
      messageEn: 'Al Olayan Group exceeded approved 30-day credit limit by SAR 18,400',
      messageAr: 'مجموعة العليان تجاوزت حد الائتمان المعتمد بمبلغ 18,400 ريال',
      priority: 'critical',
      timestamp: '2 hours ago',
      read: false,
      category: 'Credit Risk',
      actionModule: 'sales'
    }
  ]);

  // Dashboard widget customizer state
  const defaultWidgets = [
    { id: 'kpi_strip', titleEn: 'Executive Key Metrics', titleAr: 'المؤشرات الرئيسية Executive KPIs', visible: true, order: 1 },
    { id: 'revenue_chart', titleEn: 'Revenue & Margin Trends', titleAr: 'اتجاهات الإيرادات والبهامش', visible: true, order: 2 },
    { id: 'quick_actions', titleEn: 'Quick Execution Shortcuts', titleAr: 'اختصارات التنفيذ السريع', visible: true, order: 3 },
    { id: 'approval_inbox', titleEn: 'Workflow Approval Inbox', titleAr: 'صندوق واعتمادات سير العمل', visible: true, order: 4 },
    { id: 'financial_events', titleEn: 'Live Financial Event Engine Stream', titleAr: 'بث محرك الأحداث المالية الحية', visible: true, order: 5 },
    { id: 'recent_activities', titleEn: 'Audit Center Activity Feed', titleAr: 'تلقيم مركز تدقيق الأنشطة', visible: true, order: 6 }
  ];

  const [dashboardWidgets, setDashboardWidgets] = useState(defaultWidgets);

  const toggleWidgetVisibility = (id: string) => {
    setDashboardWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const resetWidgetLayout = () => {
    setDashboardWidgets(defaultWidgets);
  };

  const toggleFavorite = (mod: ModuleView) => {
    setFavorites(prev => {
      const updated = prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod];
      try { localStorage.setItem('am_erp_favorites', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const isFavorite = (mod: ModuleView) => favorites.includes(mod);

  const addRecentPage = (id: ModuleView, titleEn: string, titleAr: string) => {
    setRecentPages(prev => {
      const filtered = prev.filter(p => p.id !== id);
      const updated = [{ id, titleEn, titleAr, timestamp: Date.now() }, ...filtered].slice(0, 8);
      try { localStorage.setItem('am_erp_recents', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const setActiveModule = (mod: ModuleView) => {
    setActiveModuleState(mod);
    // Add to recent pages automatically
    const moduleTitles: Record<string, { en: string; ar: string }> = {
      dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
      accounting: { en: 'Finance & Accounting', ar: 'المالية والمحاسبة' },
      inventory: { en: 'Inventory', ar: 'المخزون' },
      sales: { en: 'Sales & CRM', ar: 'المبيعات والعملاء' },
      purchasing: { en: 'Purchasing', ar: 'المشتريات والتوريد' },
      hr: { en: 'HR & Payroll', ar: 'الموارد البشرية والرواتب' },
      banking: { en: 'Banking & Treasury', ar: 'البنوك والخزينة' },
      pos: { en: 'POS & Retail', ar: 'نقاط البيع والتجزئة' },
      projects: { en: 'Projects', ar: 'إدارة المشاريع' },
      fixed_assets: { en: 'Fixed Assets', ar: 'الأصول الثابتة' },
      bi_analytics: { en: 'BI & Analytics', ar: 'الذكاء والتحليلات' },
      ai: { en: 'ERP Business Copilot', ar: 'المساعد الذكي للمؤسسة' },
      reports: { en: 'Reports Center', ar: 'مركز التقارير' },
      master_data: { en: 'Master Data', ar: 'البيانات الأساسية' },
      settings: { en: 'Settings & Localization', ar: 'الإعدادات والتوطين' },
      users_security: { en: 'Users & Security', ar: 'المستخدمين والأمان' },
      audit_center: { en: 'Audit Center', ar: 'مركز التدقيق' }
    };
    const t = moduleTitles[mod] || { en: mod.toUpperCase(), ar: mod.toUpperCase() };
    addRecentPage(mod, t.en, t.ar);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const setActiveRole = (role: 'ceo' | 'finance' | 'warehouse' | 'sales' | 'purchasing' | 'hr' | 'management') => {
    setActiveRoleState(role);
  };

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  const triggerReload = () => setReloadTrigger(prev => prev + 1);

  // Keyboard shortcut for Global Search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch initial Context Data
  useEffect(() => {
    async function initPlatform() {
      try {
        const [authRes, tenantsRes, compRes, whRes, approvalsRes, anomaliesRes] = await Promise.all([
          ApiClient.getAuthMe(),
          ApiClient.getTenants(),
          ApiClient.getCompanies(),
          ApiClient.getWarehouses(),
          ApiClient.getApprovalRequests(),
          ApiClient.getAnomalies()
        ]);

        setCurrentUser(authRes.user);
        setTenants(tenantsRes);
        setActiveTenant(authRes.tenant || tenantsRes[0] || null);

        setCompanies(compRes);
        setActiveCompany(authRes.company || compRes[0] || null);

        setWarehouses(whRes);
        setActiveWarehouse(whRes[0] || null);

        const pending = approvalsRes.filter(a => a.status === 'Pending').length;
        setPendingApprovalsCount(pending);

        setAnomaliesCount(anomaliesRes.length);
      } catch (err) {
        console.error('Platform initialization failed:', err);
      }
    }

    initPlatform();
  }, [reloadTrigger]);

  return (
    <PlatformContext.Provider
      value={{
        lang,
        dir,
        setLang,
        theme,
        setTheme,
        activeModule,
        setActiveModule,
        tenants,
        activeTenant,
        setActiveTenant,
        companies,
        activeCompany,
        setActiveCompany,
        warehouses,
        activeWarehouse,
        setActiveWarehouse,
        currentUser,
        pendingApprovalsCount,
        anomaliesCount,
        reloadTrigger,
        triggerReload,
        isSearchOpen,
        setIsSearchOpen,
        favorites,
        toggleFavorite,
        isFavorite,
        recentPages,
        addRecentPage,
        notifications,
        unreadNotificationsCount,
        markNotificationRead,
        clearAllNotifications,
        activeRole,
        setActiveRole,
        dashboardWidgets,
        toggleWidgetVisibility,
        resetWidgetLayout
      }}
    >
      <div className={theme === 'dark' ? 'dark bg-slate-950 text-slate-100 min-h-screen' : 'bg-slate-50 text-slate-900 min-h-screen'} dir={dir}>
        {children}
      </div>
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
};
