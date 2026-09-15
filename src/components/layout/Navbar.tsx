/**
 * AM Business Platform - Top Navigation Bar
 * Features Tenant/Company context switcher, Ctrl+K search, Language toggle, Notifications, Profile
 */

import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Globe, 
  Moon, 
  Sun, 
  Bell, 
  ShieldCheck, 
  UserCheck, 
  Layers,
  Menu,
  X,
  Sparkles,
  LayoutDashboard,
  Building,
  Calculator,
  Package,
  ShoppingBag,
  Truck,
  Users,
  Bot,
  Star,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown
} from 'lucide-react';
import { usePlatform, ModuleView } from '../../context/PlatformContext';
import { LoginModal } from '../common/LoginModal';

export const Navbar: React.FC = () => {
  const { 
    lang, 
    setLang, 
    theme, 
    setTheme, 
    tenants, 
    activeTenant, 
    setActiveTenant,
    companies,
    activeCompany,
    setActiveCompany,
    currentUser,
    pendingApprovalsCount,
    setIsSearchOpen,
    activeModule,
    setActiveModule,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    clearAllNotifications,
    activeRole,
    setActiveRole,
    favorites,
    branding
  } = usePlatform();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const isAr = lang === 'ar';

  const roleLabels: Record<string, { en: string; ar: string }> = {
    ceo: { en: 'CEO / Executive', ar: 'الرئيس التنفيذي / الإدارة العليا' },
    finance: { en: 'Finance Director', ar: 'المدير المالي' },
    warehouse: { en: 'Warehouse Manager', ar: 'مدير المستودعات' },
    sales: { en: 'Sales Director', ar: 'مدير المبيعات' },
    purchasing: { en: 'Procurement Head', ar: 'رئيس المشتريات' },
    hr: { en: 'HR Lead', ar: 'مدير الموارد البشرية' },
    management: { en: 'General Manager', ar: 'المدير العام' }
  };

  const mobileNavItems: { id: ModuleView; labelEn: string; labelAr: string; icon: any }[] = [
    { id: 'dashboard', labelEn: 'Executive Overview & BI', labelAr: 'نظرة عامة والذكاء التشغيلي', icon: LayoutDashboard },
    { id: 'core', labelEn: 'Core Platform & Governance', labelAr: 'إدارة المنصة والحوكمة', icon: Building },
    { id: 'accounting', labelEn: 'Financial Accounting', labelAr: 'المحاسبة المالية والمالية العامة', icon: Calculator },
    { id: 'inventory', labelEn: 'Inventory & Supply Chain', labelAr: 'المخزون وسلسلة الإمداد', icon: Package },
    { id: 'sales', labelEn: 'Sales & Distribution', labelAr: 'المبيعات والتوزيع', icon: ShoppingBag },
    { id: 'purchasing', labelEn: 'Purchasing & Procurement', labelAr: 'المشتريات والتوريد', icon: Truck },
    { id: 'crm', labelEn: 'CRM & Lead Pipeline', labelAr: 'إدارة علاقات العملاء والفرص', icon: Users },
    { id: 'hr', labelEn: 'HR & Payroll Engine', labelAr: 'الموارد البشرية والرواتب', icon: UserCheck },
    { id: 'ai', labelEn: 'AI Copilot & Anomalies', labelAr: 'الذكاء الاصطناعي وكشف الخلل', icon: Bot },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-xs transition-colors">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Left: Mobile Menu Toggle & Brand Identity */}
        <div className="flex items-center gap-3">
          
          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-amber-500" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveModule('dashboard')}>
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-black shadow-md border overflow-hidden shrink-0"
              style={{ 
                backgroundColor: branding?.primaryColor || '#0B1F3A',
                borderColor: `${branding?.accentColor || '#F28C28'}66` 
              }}
            >
              {(theme === 'dark' && branding?.darkLogoUrl) ? (
                <img src={branding.darkLogoUrl} alt="Logo" className="max-h-8 max-w-8 object-contain" onError={(e) => { (e.target as any).style.display = 'none'; }} />
              ) : branding?.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="max-h-8 max-w-8 object-contain" onError={(e) => { (e.target as any).style.display = 'none'; }} />
              ) : (
                <span className="text-lg tracking-wider" style={{ color: branding?.accentColor || '#F28C28' }}>
                  {branding?.shortName || 'AM'}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                  {isAr 
                    ? (branding?.appNameAr || branding?.appName || 'منصة إيه إم للأعمال')
                    : (branding?.appName || 'AM Business Platform')}
                </span>
                <span 
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold border"
                  style={{ 
                    backgroundColor: `${branding?.accentColor || '#F28C28'}1A`,
                    color: branding?.accentColor || '#F28C28',
                    borderColor: `${branding?.accentColor || '#F28C28'}4D`
                  }}
                >
                  {activeTenant?.edition || 'Enterprise'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                {branding?.tradingName || (isAr ? 'نظام تشغيل وإدارة الموارد السحابي' : 'Cloud Enterprise SaaS & ERP Engine')}
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 border-l border-r border-slate-200 dark:border-slate-800 px-4 py-1 mx-2">
            {/* Tenant Selector */}
            <div className="flex items-center gap-2 text-xs">
              <Layers className="w-4 h-4 text-[#F28C28]" />
              <select
                value={activeTenant?.id || ''}
                onChange={(e) => {
                  const t = tenants.find(item => item.id === e.target.value);
                  if (t) setActiveTenant(t);
                }}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 border-none focus:outline-hidden cursor-pointer"
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.id} className="dark:bg-slate-900">{t.name}</option>
                ))}
              </select>
            </div>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            {/* Company Selector */}
            <div className="flex items-center gap-2 text-xs">
              <Building2 className="w-4 h-4 text-emerald-500" />
              <select
                value={activeCompany?.id || ''}
                onChange={(e) => {
                  const c = companies.find(item => item.id === e.target.value);
                  if (c) setActiveCompany(c);
                }}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 border-none focus:outline-hidden cursor-pointer max-w-[200px] truncate"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id} className="dark:bg-slate-900">
                    {isAr ? c.nameAr : c.name} ({c.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Center: Global Search Trigger */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#F28C28]" />
              <span>{isAr ? 'ابحث في الحسابات، الفواتير، والقيود... (Ctrl+K)' : 'Search accounts, invoices, entries... (Ctrl+K)'}</span>
            </div>
            <kbd className="hidden sm:inline-block rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Mobile Search, Lang, Theme, Role, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Mobile Search Icon */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
            title="Search"
          >
            <Search className="w-4 h-4 text-[#F28C28]" />
          </button>

          {/* Role Persona Switcher */}
          <div className="hidden xl:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'الدور:' : 'Role:'}</span>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as any)}
              className="bg-transparent font-bold text-slate-800 dark:text-slate-200 border-none focus:outline-hidden cursor-pointer"
            >
              {Object.entries(roleLabels).map(([key, val]) => (
                <option key={key} value={key} className="dark:bg-slate-900">
                  {isAr ? val.ar : val.en}
                </option>
              ))}
            </select>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={isAr ? 'تغيير اللغة إلى الإنجليزية' : 'Switch to Arabic'}
          >
            <Globe className="w-4 h-4 text-[#F28C28]" />
            <span className="hidden sm:inline">{lang === 'en' ? 'العربية 🇸🇦' : 'English 🇬🇧'}</span>
            <span className="sm:hidden">{lang === 'en' ? 'AR' : 'EN'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="rounded-lg border border-slate-200 dark:border-slate-800 p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Notifications / Approvals Popover Toggle */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative rounded-lg border border-slate-200 dark:border-slate-800 p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={isAr ? 'مركز التنبيهات والإشعارات' : 'Notification & Priority Center'}
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Notification Center Popover */}
            {notifOpen && (
              <div className="absolute right-0 ltr:right-0 rtl:left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#F28C28]" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {isAr ? 'مركز التنبيهات والأحداث' : 'Enterprise Notification Hub'}
                    </span>
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <button 
                      onClick={() => clearAllNotifications()}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {isAr ? 'تحديد الكل كمقروء' : 'Mark all read'}
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {notifications.map(n => (
                    <div 
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.actionModule) setActiveModule(n.actionModule);
                        setNotifOpen(false);
                      }}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition space-y-1 ${
                        n.read 
                          ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-500' 
                          : 'bg-white dark:bg-slate-800 border-amber-500/30 font-semibold text-slate-900 dark:text-white shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          n.priority === 'critical' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
                          n.priority === 'warning' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                          'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                        }`}>
                          {n.category} • {n.priority}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{n.timestamp}</span>
                      </div>
                      <div className="font-bold text-xs pt-1">
                        {isAr ? n.titleAr : n.titleEn}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {isAr ? n.messageAr : n.messageEn}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Current User Badge & Auth Switcher */}
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1.5 rounded-xl transition cursor-pointer text-left rtl:text-right"
            title={isAr ? 'تبديل المستخدم أو تسجيل الدخول المؤسسي' : 'Switch Account / Enterprise Login'}
            id="nav-user-profile-btn"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0B1F3A] text-[#F28C28] font-bold text-xs border border-[#F28C28]/40">
              AM
            </div>
            <div className="text-left rtl:text-right text-xs">
              <div className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
                <span>{currentUser?.name || 'Ahmed Mounir'}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {roleLabels[activeRole]?.en || 'Super Admin'}
              </p>
            </div>
          </button>

        </div>

      </div>

      {/* MOBILE DRAWER NAVIGATION */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 animate-in slide-in-from-top duration-200">
          
          {/* Tenant & Company Switchers for Mobile */}
          <div className="grid grid-cols-2 gap-2 text-xs pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Tenant</label>
              <select
                value={activeTenant?.id || ''}
                onChange={(e) => {
                  const t = tenants.find(item => item.id === e.target.value);
                  if (t) setActiveTenant(t);
                }}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2 font-semibold text-slate-800 dark:text-slate-200"
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Company</label>
              <select
                value={activeCompany?.id || ''}
                onChange={(e) => {
                  const c = companies.find(item => item.id === e.target.value);
                  if (c) setActiveCompany(c);
                }}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2 font-semibold text-slate-800 dark:text-slate-200"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {isAr ? c.nameAr : c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Module Navigation List */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
              {isAr ? 'الوحدات والمجالات' : 'ENTERPRISE MODULES'}
            </div>
            <div className="grid grid-cols-1 gap-1">
              {mobileNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive 
                        ? 'bg-[#0B1F3A] text-white shadow-md' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#F28C28]' : 'text-slate-500'}`} />
                    <span>{isAr ? item.labelAr : item.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Canonical AM ERP Login & Multi-Tenant Authentication Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </header>
  );
};


