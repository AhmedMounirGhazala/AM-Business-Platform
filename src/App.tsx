/**
 * AM Business Platform - Master Shell
 * Binds Navbar, Sidebar, Module Router, & Global Search Shortcut (Ctrl+K)
 */

import React, { useEffect } from 'react';
import { RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';

// Modules
import { ExecutiveDashboard } from './components/modules/ExecutiveDashboard';
import { CorePlatformView } from './components/modules/CorePlatformView';
import { AccountingView } from './components/modules/AccountingView';
import { InventoryView } from './components/modules/InventoryView';
import { SalesView } from './components/modules/SalesView';
import { PurchasingView } from './components/modules/PurchasingView';
import { CrmView } from './components/modules/CrmView';
import { HrPayrollView } from './components/modules/HrPayrollView';
import { AiAssistantView } from './components/modules/AiAssistantView';
import { ProjectsView } from './components/modules/ProjectsView';
import { AssetsView } from './components/modules/AssetsView';
import { TreasuryView } from './components/modules/TreasuryView';
import { BiAnalyticsView } from './components/modules/BiAnalyticsView';
import { PosView } from './components/modules/PosView';
import { PlatformIntegrationView } from './components/modules/PlatformIntegrationView';
import { MasterDataWorkspaceView } from './components/modules/MasterDataWorkspaceView';
import { ManufacturingManagementView } from './components/modules/ManufacturingManagementView';
import { CustomerFacingDisplayView } from './components/modules/CustomerFacingDisplayView';
import { EnterpriseOnboardingWizard } from './components/modules/EnterpriseOnboardingWizard';
import { BrandingSettingsView } from './components/modules/BrandingSettingsView';
import { ComingSoonView } from './components/modules/ComingSoonView';

const MainLayout: React.FC = () => {
  const {
    activeModule,
    dir,
    lang,
    setIsSearchOpen,
    isPlatformInitializing,
    platformInitError,
    retryPlatformInit,
    isOnboardingCompleted,
    branding
  } = usePlatform();
  const isAr = lang === 'ar';

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchOpen]);

  // First-Run / Onboarding Gate Initialization Screen (Zero-Flicker Gate)
  if (isPlatformInitializing) {
    return (
      <div
        className="min-h-screen bg-brand-navy-dark text-white flex flex-col items-center justify-center p-6 select-none"
        dir={dir}
        id="am-platform-initialization-gate"
      >
        <div className="max-w-md w-full text-center space-y-6">
          {/* AM Platform Monogram */}
          <div className="mx-auto w-16 h-16 rounded-lg bg-brand-navy border border-brand-navy-light flex items-center justify-center relative">
            <span className="text-2xl font-black tracking-tight text-white">AM</span>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-brand-orange ring-4 ring-[#061224]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              {isAr ? (branding?.appNameAr || 'منصة إيه إم للأعمال') : (branding?.appName || 'AM Business Platform')}
            </h1>
            <p className="text-xs font-mono text-slate-400 tracking-wider uppercase">
              {isAr ? 'التحقق من حالة الإعداد المؤسسي والجاهزية...' : 'Verifying Enterprise Configuration & Onboarding Gate...'}
            </p>
          </div>

          {/* Clean Spinner and Status */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-orange" />
            <span className="text-xs text-slate-400 font-mono">
              {isAr ? 'التحقق من سجلات المنشأة في قاعدة البيانات...' : 'Querying SQLite onboarding status for active company...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Initialization Failure / Backend Unreachable Screen
  if (platformInitError) {
    return (
      <div
        className="min-h-screen bg-brand-navy-dark text-white flex flex-col items-center justify-center p-6 select-none"
        dir={dir}
        id="am-platform-gate-error"
      >
        <div className="max-w-md w-full bg-brand-navy border border-red-900/50 rounded-lg p-6 space-y-5 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-red-950/60 border border-red-800 text-red-400 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-100">
              {isAr ? 'تعذر التحقق من حالة الإعداد' : 'Initialization & Onboarding Gate Notice'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'لم يتمكن النظام من التحقق من حالة إعداد المنشأة في قاعدة البيانات. يرجى إعادة المحاولة.'
                : 'The platform could not verify the company onboarding status with the backend engine. Please retry.'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-slate-800 font-mono text-[11px] text-red-300 break-all text-left rtl:text-right">
            {platformInitError}
          </div>

          <button
            onClick={retryPlatformInit}
            className="w-full py-2.5 px-4 rounded-md bg-brand-orange hover:bg-brand-orange-hover text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            {isAr ? 'إعادة المحاولة الآن' : 'Retry Verification Now'}
          </button>
        </div>
      </div>
    );
  }

  const renderActiveModule = () => {
    // If onboarding is incomplete for the active company, lock strictly to EnterpriseOnboardingWizard
    if (isOnboardingCompleted === false) {
      return <EnterpriseOnboardingWizard />;
    }

    switch (activeModule) {
      case 'dashboard':
        return <ExecutiveDashboard />;
      case 'onboarding_wizard':
        return <EnterpriseOnboardingWizard />;
      case 'branding':
        return <BrandingSettingsView />;
      case 'platform_readiness':
        return <PlatformIntegrationView />;
      case 'master_data':
        return <MasterDataWorkspaceView />;
      case 'core':
      case 'settings':
      case 'users_security':
      case 'audit_center':
      case 'configuration_center':
      case 'workflows':
      case 'documents':
      case 'reports':
        return <CorePlatformView />;
      case 'accounting':
        return <AccountingView />;
      case 'banking':
      case 'treasury' as any:
        return <TreasuryView />;
      case 'fixed_assets':
      case 'assets':
        return <AssetsView />;
      case 'projects':
        return <ProjectsView />;
      case 'bi_analytics':
        return <BiAnalyticsView />;
      case 'pos':
        return <PosView />;
      case 'customer_display' as any:
        return <CustomerFacingDisplayView />;
      case 'inventory':
        return <InventoryView />;
      case 'sales':
        return <SalesView />;
      case 'purchasing':
        return <PurchasingView />;
      case 'crm':
        return <CrmView />;
      case 'manufacturing':
        return <ManufacturingManagementView />;
      case 'hr':
        return <HrPayrollView />;
      case 'ai':
        return <AiAssistantView />;
      default:
        return <ComingSoonView moduleId={activeModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200" dir={dir}>

      {/* Top Bar */}
      <Navbar />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">

        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Scrollable Main Application Canvas */}
        <main className="flex-1 overflow-y-auto bg-slate-50/80 dark:bg-slate-950">
          {renderActiveModule()}
        </main>

      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal />

    </div>
  );
};

export function App() {
  const isCustomerDisplay = typeof window !== 'undefined' && (
    window.location.search.includes('view=customer-display') ||
    window.location.hash.includes('customer-display')
  );

  if (isCustomerDisplay) {
    return (
      <PlatformProvider>
        <CustomerFacingDisplayView isStandaloneWindow={true} />
      </PlatformProvider>
    );
  }

  return (
    <PlatformProvider>
      <MainLayout />
    </PlatformProvider>
  );
}

export default App;
