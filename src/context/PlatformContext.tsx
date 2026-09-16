/**
 * AM Business Platform - Global React State Context
 * Handles Multi-Tenant switching, Language (AR/EN), RTL, Themes, & Module Navigation
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Company, Tenant, User, Warehouse, TenantBranding, AMPlatformIdentity, APPROVED_AM_IDENTITY } from '../types';
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
  | 'ecommerce'
  | 'onboarding_wizard'
  | 'branding';

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

  // Platform Initialization & Onboarding Gate (P0-07 First-Run Architecture)
  isPlatformInitializing: boolean;
  platformInitError: string | null;
  retryPlatformInit: () => void;
  isOnboardingCompleted: boolean | null;
  onboardingState: {
    totalSteps: number;
    currentStep: number;
    isCompleted: boolean;
    activeProfile?: any;
    steps: any[];
    wizardData?: Record<string, any>;
  } | null;
  markOnboardingCompleted: () => void;
  refreshOnboardingState: () => Promise<void>;

  // Tenant Identity & Branding Runtime (P0-08)
  branding: TenantBranding | null;
  refreshBranding: () => Promise<void>;
  isBrandingLoading: boolean;
  platformIdentity: AMPlatformIdentity;
  
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

// Safe baseline enterprise defaults to ensure seamless resilience against cold boots
const DEFAULT_USER: User = {
  id: 'usr-001',
  tenantId: 'ten-001',
  companyId: 'comp-001',
  branchId: 'br-001',
  name: 'Ahmed Mounir',
  email: 'a.mounir369@gmail.com',
  role: 'Super Admin',
  active: true,
  createdAt: '2026-01-01T08:00:00Z',
  permissions: [{ module: 'all', actions: ['create', 'read', 'update', 'delete', 'approve', 'export'] }]
};

const DEFAULT_TENANT: Tenant = {
  id: 'ten-001',
  name: 'AM Holding Group',
  code: 'AMHG',
  edition: 'Enterprise',
  ownerEmail: 'a.mounir369@gmail.com',
  active: true,
  createdAt: '2026-01-01T08:00:00Z'
};

const DEFAULT_COMPANY: Company = {
  id: 'comp-001',
  tenantId: 'ten-001',
  name: 'AM Tech Solutions - HQ',
  nameAr: 'مجموعة إيه إم للحلول التقنية - المقر الرئيسي',
  code: 'AMHQ',
  taxNumber: '310984728100003',
  currency: 'SAR',
  country: 'Saudi Arabia',
  countryCode: 'SA',
  state: 'Riyadh Province',
  city: 'Riyadh',
  taxSystemId: 'tax-sys-sa-vat',
  taxSystemName: 'Saudi Arabia VAT (15% ZATCA Phase 2)',
  taxRate: 15,
  timezone: 'Asia/Riyadh',
  dateFormat: 'YYYY-MM-DD',
  numberFormat: '1,234.56',
  language: 'ar',
  fiscalYearStart: '01-01',
  address: 'King Fahd Road, Olaya District, Riyadh, KSA',
  phone: '+966 11 482 9100',
  email: 'info@amtech.sa',
  website: 'https://amtech.sa'
};

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [activeModule, setActiveModuleState] = useState<ModuleView>('dashboard');

  const [tenants, setTenants] = useState<Tenant[]>([DEFAULT_TENANT]);
  const [activeTenant, setActiveTenantState] = useState<Tenant | null>(DEFAULT_TENANT);

  const [companies, setCompanies] = useState<Company[]>([DEFAULT_COMPANY]);
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(DEFAULT_COMPANY);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [activeWarehouse, setActiveWarehouse] = useState<Warehouse | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(DEFAULT_USER);

  // Platform Initialization & Onboarding Gate (Enterprise First-Run Architecture)
  const [isPlatformInitializing, setIsPlatformInitializing] = useState<boolean>(true);
  const [platformInitError, setPlatformInitError] = useState<string | null>(null);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [onboardingState, setOnboardingState] = useState<{
    totalSteps: number;
    currentStep: number;
    isCompleted: boolean;
    activeProfile?: any;
    steps: any[];
    wizardData?: Record<string, any>;
  } | null>(null);

  const activeCompanyIdRef = useRef<string>('comp-001');

  // Tenant Identity & Branding Runtime (P0-08)
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [isBrandingLoading, setIsBrandingLoading] = useState<boolean>(false);

  const refreshBranding = useCallback(async () => {
    const targetTenantId = activeTenant?.id || 'ten-001';
    setIsBrandingLoading(true);
    try {
      const res = await ApiClient.getBranding(targetTenantId, activeCompany?.id);
      if (res && res.branding) {
        setBranding(res.branding);
      }
    } catch (err) {
      console.warn('Failed to refresh tenant branding:', err);
    } finally {
      setIsBrandingLoading(false);
    }
  }, [activeTenant?.id, activeCompany?.id]);

  // Apply dynamic CSS variables & runtime tokens
  useEffect(() => {
    if (!branding) return;
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', branding.primaryColor);
    root.style.setProperty('--brand-secondary', branding.secondaryColor);
    root.style.setProperty('--brand-accent', branding.accentColor);
    root.style.setProperty('--brand-surface', branding.surfaceColor || '#FFFFFF');
    root.style.setProperty('--brand-text', branding.textColor || '#0F172A');
    root.style.setProperty('--brand-font', branding.fontFamily);
    const radiusMap: Record<string, string> = {
      none: '0px',
      sm: '2px',
      md: '6px',
      lg: '8px',
      xl: '12px',
      full: '9999px'
    };
    root.style.setProperty('--brand-radius', radiusMap[branding.borderRadius] || '8px');

    if (branding.appName) {
      document.title = `${branding.appName} | Enterprise Operating Platform`;
    }

    if (branding.faviconUrl) {
      try {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = branding.faviconUrl;
      } catch {}
    }
  }, [branding]);

  // Re-fetch branding when tenant or company changes
  useEffect(() => {
    if (activeTenant?.id) {
      refreshBranding();
    }
  }, [activeTenant?.id, activeCompany?.id, refreshBranding]);

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
      return saved ? JSON.parse(saved) : [];
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
  }>>([]);

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

  const verifyCompanyOnboarding = useCallback(async (compId: string, tenId: string) => {
    activeCompanyIdRef.current = compId;
    try {
      const res = await ApiClient.getOnboardingWizardState(compId, tenId);
      // Prevent race conditions if user rapidly switched companies
      if (activeCompanyIdRef.current !== compId) return;

      if (res && res.wizardState) {
        const isCompleted = Boolean(res.wizardState.isCompleted);
        setIsOnboardingCompleted(isCompleted);
        setOnboardingState(res.wizardState);

        if (!isCompleted) {
          setActiveModuleState('onboarding_wizard');
        } else {
          setActiveModuleState(prev => prev === 'onboarding_wizard' ? 'dashboard' : prev);
        }
      }
    } catch (err: any) {
      if (activeCompanyIdRef.current !== compId) return;
      console.warn('Failed to verify company onboarding status:', compId, err);
      setIsOnboardingCompleted(false);
      setActiveModuleState('onboarding_wizard');
    }
  }, []);

  const setActiveCompany = useCallback((company: Company) => {
    setActiveCompanyState(company);
    verifyCompanyOnboarding(company.id, activeTenant?.id || company.tenantId || 'ten-001');
  }, [activeTenant, verifyCompanyOnboarding]);

  const setActiveTenant = useCallback((tenant: Tenant) => {
    setActiveTenantState(tenant);
    const tenantCompanies = companies.filter(c => c.tenantId === tenant.id);
    const targetComp = tenantCompanies[0] || activeCompany;
    if (targetComp) {
      setActiveCompanyState(targetComp);
      verifyCompanyOnboarding(targetComp.id, tenant.id);
    }
  }, [companies, activeCompany, verifyCompanyOnboarding]);

  const markOnboardingCompleted = useCallback(() => {
    setIsOnboardingCompleted(true);
    setActiveModuleState('dashboard');
    triggerReload();
  }, []);

  const refreshOnboardingState = useCallback(async () => {
    if (!activeCompany) return;
    await verifyCompanyOnboarding(activeCompany.id, activeTenant?.id || activeCompany.tenantId || 'ten-001');
  }, [activeCompany, activeTenant, verifyCompanyOnboarding]);

  const retryPlatformInit = useCallback(() => {
    setIsPlatformInitializing(true);
    setPlatformInitError(null);
    triggerReload();
  }, []);

  const addRecentPage = (id: ModuleView, titleEn: string, titleAr: string) => {
    setRecentPages(prev => {
      const filtered = prev.filter(p => p.id !== id);
      const updated = [{ id, titleEn, titleAr, timestamp: Date.now() }, ...filtered].slice(0, 8);
      try { localStorage.setItem('am_erp_recents', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const setActiveModule = (mod: ModuleView) => {
    // If onboarding is not completed for active company, lock strictly to Onboarding Wizard
    if (isOnboardingCompleted === false && mod !== 'onboarding_wizard') {
      setActiveModuleState('onboarding_wizard');
      return;
    }

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

  // Fetch initial Context Data with automatic resilience against container warmups & Onboarding Gate
  useEffect(() => {
    let isCancelled = false;

    async function initPlatform(attempt = 0) {
      try {
        const [authSettled, tenantsSettled, compSettled, whSettled, approvalsSettled, anomaliesSettled] = await Promise.allSettled([
          ApiClient.getAuthMe(),
          ApiClient.getTenants(),
          ApiClient.getCompanies(),
          ApiClient.getWarehouses(),
          ApiClient.getApprovalRequests(),
          ApiClient.getAnomalies()
        ]);

        if (isCancelled) return;

        let resolvedTenant: Tenant = activeTenant || DEFAULT_TENANT;
        let resolvedCompany: Company = activeCompany || DEFAULT_COMPANY;

        if (authSettled.status === 'fulfilled') {
          const authRes = authSettled.value;
          if (authRes.user) setCurrentUser(authRes.user);
          if (authRes.tenant) {
            resolvedTenant = authRes.tenant;
            setActiveTenantState(authRes.tenant);
          }
          if (authRes.company) {
            resolvedCompany = authRes.company;
            setActiveCompanyState(authRes.company);
          }
        }

        if (tenantsSettled.status === 'fulfilled' && tenantsSettled.value.length > 0) {
          setTenants(tenantsSettled.value);
          if (authSettled.status !== 'fulfilled' || !authSettled.value.tenant) {
            resolvedTenant = tenantsSettled.value[0];
            setActiveTenantState(resolvedTenant);
          }
        }

        if (compSettled.status === 'fulfilled' && compSettled.value.length > 0) {
          setCompanies(compSettled.value);
          if (authSettled.status !== 'fulfilled' || !authSettled.value.company) {
            resolvedCompany = compSettled.value[0];
            setActiveCompanyState(resolvedCompany);
          }
        }

        if (whSettled.status === 'fulfilled' && whSettled.value.length > 0) {
          setWarehouses(whSettled.value);
          setActiveWarehouse(whSettled.value[0] || null);
        }

        if (approvalsSettled.status === 'fulfilled') {
          const pending = approvalsSettled.value.filter(a => a.status === 'Pending').length;
          setPendingApprovalsCount(pending);
        }

        if (anomaliesSettled.status === 'fulfilled') {
          setAnomaliesCount(anomaliesSettled.value.length);
        }

        // Strict Gate: Query SQLite for actual wizard state of resolved active company & tenant
        const targetCompId = resolvedCompany.id;
        const targetTenId = resolvedTenant.id;
        activeCompanyIdRef.current = targetCompId;

        const wizardRes = await ApiClient.getOnboardingWizardState(targetCompId, targetTenId);

        if (isCancelled) return;

        if (wizardRes && wizardRes.wizardState) {
          const isDone = Boolean(wizardRes.wizardState.isCompleted);
          setIsOnboardingCompleted(isDone);
          setOnboardingState(wizardRes.wizardState);

          if (!isDone) {
            setActiveModuleState('onboarding_wizard');
          } else {
            setActiveModuleState('dashboard');
          }

          setPlatformInitError(null);
          setIsPlatformInitializing(false);
        } else {
          throw new Error('Invalid onboarding wizard state received from backend.');
        }

      } catch (err: any) {
        if (isCancelled) return;
        if (attempt < 3) {
          setTimeout(() => {
            if (!isCancelled) initPlatform(attempt + 1);
          }, 800 * (attempt + 1));
        } else {
          console.error('Platform initialization gate error:', err);
          setPlatformInitError(err?.message || 'Failed to verify company onboarding status.');
          setIsPlatformInitializing(false);
        }
      }
    }

    initPlatform();
    return () => { isCancelled = true; };
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
        isPlatformInitializing,
        platformInitError,
        retryPlatformInit,
        isOnboardingCompleted,
        onboardingState,
        markOnboardingCompleted,
        refreshOnboardingState,
        branding,
        refreshBranding,
        isBrandingLoading,
        platformIdentity: APPROVED_AM_IDENTITY,
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
