/**
 * AM Business Platform - Master Shell
 * Binds Navbar, Sidebar, Module Router, & Global Search Shortcut (Ctrl+K)
 */

import React, { useEffect } from 'react';
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
import { ComingSoonView } from './components/modules/ComingSoonView';

const MainLayout: React.FC = () => {
  const { activeModule, dir, setIsSearchOpen } = usePlatform();

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

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <ExecutiveDashboard />;
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
        <main className="flex-1 overflow-y-auto">
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
