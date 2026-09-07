/**
 * AM Business Platform - Core Platform & Enterprise Governance Module
 * Handles Multi-Tenant settings, Master Data Foundation (Branches, Cost/Profit Centers, Tax Rules, Currencies, Fiscal Periods),
 * Document Numbering Engine, Workflow Rules, & Audit Trail
 */

import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Hash, 
  GitBranch, 
  ShieldCheck, 
  History, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Layers,
  FileCheck,
  Database,
  Globe,
  Briefcase,
  PieChart,
  DollarSign,
  Calendar,
  Percent,
  Cpu,
  Settings,
  Sliders,
  Flag,
  Check
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { ApiClient } from '../../services/apiClient';
import { 
  ApprovalRequest, 
  AuditLog, 
  Branch, 
  Company, 
  CostCenter, 
  Currency, 
  DocumentNumberingRule, 
  FiscalYear, 
  ItemCategory, 
  PaymentTerm, 
  ProfitCenter, 
  Project, 
  TaxRule, 
  Tenant, 
  UnitOfMeasure, 
  WorkflowRule,
  CountryMaster,
  TaxSystemMaster,
  StateProvinceMaster,
  CityMaster,
  TimezoneMaster,
  LanguageMaster,
  FiscalCalendarMaster
} from '../../types';
import { CompanyModal } from './CompanyModal';
import { PlatformIntegrationView } from './PlatformIntegrationView';

export const CorePlatformView: React.FC = () => {
  const { lang, activeTenant, triggerReload, reloadTrigger } = usePlatform();
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'configEngine' | 'masterData' | 'numbering' | 'workflows' | 'audit' | 'tenants' | 'platformIntegration'>('configEngine');

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [profitCenters, setProfitCenters] = useState<ProfitCenter[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<UnitOfMeasure[]>([]);
  const [itemCategories, setItemCategories] = useState<ItemCategory[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);

  // Master Localization States
  const [countriesMaster, setCountriesMaster] = useState<CountryMaster[]>([]);
  const [taxSystemsMaster, setTaxSystemsMaster] = useState<TaxSystemMaster[]>([]);
  const [statesMaster, setStatesMaster] = useState<StateProvinceMaster[]>([]);
  const [citiesMaster, setCitiesMaster] = useState<CityMaster[]>([]);
  const [timezonesMaster, setTimezonesMaster] = useState<TimezoneMaster[]>([]);
  const [languagesMaster, setLanguagesMaster] = useState<LanguageMaster[]>([]);
  const [fiscalCalendarsMaster, setFiscalCalendarsMaster] = useState<FiscalCalendarMaster[]>([]);

  // Company Modal State
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [selectedCompanyForEdit, setSelectedCompanyForEdit] = useState<Company | null>(null);

  const [numberingRules, setNumberingRules] = useState<DocumentNumberingRule[]>([]);
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Numbering Rule Editing state
  const [editingRule, setEditingRule] = useState<DocumentNumberingRule | null>(null);

  // Phase 4 Enterprise Configuration Engine State
  const [configValues, setConfigValues] = useState<any[]>([]);
  const [effectiveConfig, setEffectiveConfig] = useState<any>(null);
  const [featureFlags, setFeatureFlags] = useState<any[]>([]);
  const [productEdition, setProductEdition] = useState<'Community' | 'Professional' | 'Enterprise'>('Enterprise');
  const [localizationPacks, setLocalizationPacks] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'GENERAL' | 'FINANCIAL' | 'INVENTORY' | 'SALES' | 'PURCHASING' | 'SECURITY'>('GENERAL');
  const [selectedScopeLevel, setSelectedScopeLevel] = useState<string>('TENANT');
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadCoreData() {
      try {
        const [
          tRes, cRes, bRes, ccRes, pcRes, projRes, curRes, fyRes, trRes, uomRes, catRes, ptRes,
          nRes, wRes, appRes, audRes, cfgRes, effRes, ffRes, locRes,
          countriesRes, taxSysRes, statesRes, citiesRes, tzRes, langRes, fcRes
        ] = await Promise.all([
          ApiClient.getTenants(),
          ApiClient.getCompanies(),
          ApiClient.getBranches(),
          ApiClient.getCostCenters(),
          ApiClient.getProfitCenters(),
          ApiClient.getProjects(),
          ApiClient.getCurrencies(),
          ApiClient.getFiscalYears(),
          ApiClient.getTaxRules(),
          ApiClient.getUnitsOfMeasure(),
          ApiClient.getItemCategories(),
          ApiClient.getPaymentTerms(),
          ApiClient.getNumberingRules(),
          ApiClient.getWorkflowRules(),
          ApiClient.getApprovalRequests(),
          ApiClient.getAuditLogs(),
          ApiClient.getConfigValues(),
          ApiClient.getEffectiveConfig({ tenantId: 'ten-001', category: 'ALL' }),
          ApiClient.getFeatureFlags(),
          ApiClient.getLocalizationPacks(),
          ApiClient.getCountriesMaster(),
          ApiClient.getTaxSystemsMaster(),
          ApiClient.getStatesMaster(),
          ApiClient.getCitiesMaster(),
          ApiClient.getTimezonesMaster(),
          ApiClient.getLanguagesMaster(),
          ApiClient.getFiscalCalendarsMaster()
        ]);
        setTenants(tRes);
        setCompanies(cRes);
        setBranches(bRes);
        setCostCenters(ccRes);
        setProfitCenters(pcRes);
        setProjects(projRes);
        setCurrencies(curRes);
        setFiscalYears(fyRes);
        setTaxRules(trRes);
        setUnitsOfMeasure(uomRes);
        setItemCategories(catRes);
        setPaymentTerms(ptRes);
        setNumberingRules(nRes);
        setWorkflowRules(wRes);
        setApprovals(appRes);
        setAuditLogs(audRes);
        setCountriesMaster(countriesRes);
        setTaxSystemsMaster(taxSysRes);
        setStatesMaster(statesRes);
        setCitiesMaster(citiesRes);
        setTimezonesMaster(tzRes);
        setLanguagesMaster(langRes);
        setFiscalCalendarsMaster(fcRes);

        setConfigValues(cfgRes);
        setEffectiveConfig(effRes?.effectiveConfig || effRes);
        setFeatureFlags(ffRes?.featureFlags || []);
        setProductEdition((ffRes?.currentEdition as any) || 'Enterprise');
        setLocalizationPacks(locRes || []);
      } catch (err) {
        console.error('Failed loading core platform data:', err);
      }
    }
    loadCoreData();
  }, [reloadTrigger]);

  const handleSaveConfigValue = async (key: string, value: any, category: string, dataType: string = 'string') => {
    try {
      await ApiClient.setConfigValue({
        key,
        value,
        scopeLevel: selectedScopeLevel,
        scopeId: 'ten-001',
        category,
        dataType
      });
      setConfigSuccessMsg(isAr ? 'تم تحديث الإعدادات المركزية بنجاح' : 'Central Configuration Updated Successfully');
      setTimeout(() => setConfigSuccessMsg(null), 3000);
      triggerReload();
    } catch (err) {
      console.error('Failed to update config:', err);
    }
  };

  const handleEditionChange = async (newEdition: 'Community' | 'Professional' | 'Enterprise') => {
    try {
      const res = await ApiClient.setProductEdition(newEdition);
      setProductEdition(res.currentEdition);
      setFeatureFlags(res.featureFlags);
      triggerReload();
    } catch (err) {
      console.error('Failed changing edition:', err);
    }
  };

  const handleSaveNumberingRule = async () => {
    if (!editingRule) return;
    await ApiClient.updateNumberingRule(editingRule.id, editingRule);
    setEditingRule(null);
    triggerReload();
  };

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    await ApiClient.handleApprovalAction(id, action, action === 'APPROVE' ? 'Approved by Admin' : 'Rejected');
    triggerReload();
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Title & Domain Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>{isAr ? 'إدارة المنصة والبيانات الأساسية والحوكمة' : 'Core Platform & Master Data Foundation'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr ? 'البنية التحتية للمستأجرين، الفروع، مراكز التكلفة، الضرائب، الترقيم، وقواعد الاعتماد' : 'Multi-Tenant setup, Master Data (Branches, Cost/Profit Centers, Tax Rules), Auto-Numbering & Audit'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold flex-wrap">
          <button
            onClick={() => setActiveTab('configEngine')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'configEngine' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{isAr ? 'محرك الإعدادات المركزي (System Brain)' : 'Configuration Engine (System Brain)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('masterData')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'masterData' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isAr ? 'البيانات الأساسية (Master Data)' : 'Master Data Foundation'}</span>
          </button>

          <button
            onClick={() => setActiveTab('numbering')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'numbering' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>{isAr ? 'ترقيم المستندات' : 'Doc Numbering'}</span>
          </button>

          <button
            onClick={() => setActiveTab('workflows')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'workflows' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>{isAr ? 'قواعد الموافقة' : 'Approvals & Workflows'}</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{isAr ? 'سجل التدقيق' : 'Audit Trail'}</span>
          </button>

          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tenants' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'المؤسسات والشركات' : 'Tenants & Companies'}</span>
          </button>

          <button
            onClick={() => setActiveTab('platformIntegration')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'platformIntegration' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isAr ? 'جاهزية المنصة والتشغيل (Phase 3.0)' : 'Platform Readiness (Phase 3.0)'}</span>
          </button>
        </div>
      </div>

      {/* SUCCESS NOTIFICATION */}
      {configSuccessMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{configSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* TAB 0: Enterprise Configuration Engine (System Brain) */}
      {activeTab === 'configEngine' && (
        <div className="space-y-6">
          
          {/* Header Banner */}
          <div className="bg-[#0B1F3A] border border-[#153258] rounded-2xl p-6 text-white shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#153258] border border-[#F28C28]/30 text-[#F28C28] text-xs font-mono mb-2">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>PHASE 4 SYSTEM BRAIN ENGINE</span>
                </div>
                <h2 className="text-lg font-bold text-white">
                  {isAr ? 'محرك الإعدادات المركزي وإدارة إصدار المنصة' : 'Hierarchical Configuration Engine & Platform Edition Brain'}
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                  {isAr 
                    ? 'يتحكم في سلوك النظام عبر التسلسل الهرمي (Platform -> Tenant -> Company -> Branch -> Warehouse -> Department -> User) بدون أي تعديل في الكود.'
                    : 'Controls system-wide behavior hierarchically (Platform -> Tenant -> Company -> Branch -> Warehouse -> Department -> User) with instant configuration override.'}
                </p>
              </div>

              {/* Product Edition Switcher */}
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 space-y-2 shrink-0">
                <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
                  {isAr ? 'إصدار المنصة الحالي' : 'Active Product Edition'}
                </span>
                <div className="flex items-center gap-1.5">
                  {(['Community', 'Professional', 'Enterprise'] as const).map((ed) => (
                    <button
                      key={ed}
                      onClick={() => handleEditionChange(ed)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        productEdition === ed 
                          ? 'bg-indigo-500 text-white shadow-md' 
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {ed}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Categories & Scope Hierarchy Filter */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Nav: Domain Categories */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider px-2">
                {isAr ? 'مجالات الإعدادات' : 'Config Domains'}
              </h3>
              <div className="space-y-1">
                {[
                  { id: 'GENERAL', nameEn: 'General System', nameAr: 'النظام العام', icon: Settings },
                  { id: 'FINANCIAL', nameEn: 'Financial & Accounting', nameAr: 'المالية والحسابات', icon: DollarSign },
                  { id: 'INVENTORY', nameEn: 'Inventory & WMS', nameAr: 'المخزون والمستودعات', icon: Database },
                  { id: 'SALES', nameEn: 'Sales & CRM', nameAr: 'المبيعات والعملاء', icon: Briefcase },
                  { id: 'PURCHASING', nameEn: 'Procurement & SRM', nameAr: 'المشتريات والموردين', icon: Building2 },
                  { id: 'SECURITY', nameEn: 'Security & Compliance', nameAr: 'الأمان والامتثال', icon: ShieldCheck }
                ].map((cat) => {
                  const Icon = cat.icon;
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                        active 
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{isAr ? cat.nameAr : cat.nameEn}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 px-2">
                  {isAr ? 'مستوى التوريث الهرمي' : 'Target Scope Level'}
                </label>
                <select
                  value={selectedScopeLevel}
                  onChange={(e) => setSelectedScopeLevel(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2.5"
                >
                  <option value="PLATFORM">PLATFORM (Global System Default)</option>
                  <option value="TENANT">TENANT (Tenant Wide)</option>
                  <option value="COMPANY">COMPANY (Legal Entity)</option>
                  <option value="BRANCH">BRANCH (Operational Branch)</option>
                  <option value="WAREHOUSE">WAREHOUSE (Location Specific)</option>
                  <option value="DEPARTMENT">DEPARTMENT (Organizational)</option>
                  <option value="USER">USER (Personalized)</option>
                </select>
              </div>
            </div>

            {/* Right Main Panel: Domain Settings Editor */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Active Effective Config Panel */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {selectedCategory} {isAr ? 'الإعدادات النافذة (Effective Configuration)' : 'Effective Settings'}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                    Scope: {selectedScopeLevel}
                  </span>
                </div>

                {/* Configuration Parameter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  
                  {selectedCategory === 'GENERAL' && (
                    <>
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <label className="font-bold text-slate-900 dark:text-white block">Default Currency Code</label>
                        <input
                          type="text"
                          defaultValue={effectiveConfig?.general?.defaultCurrency || 'SAR'}
                          onBlur={(e) => handleSaveConfigValue('GENERAL.DEFAULT_CURRENCY', e.target.value, 'GENERAL')}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-mono font-semibold"
                        />
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <label className="font-bold text-slate-900 dark:text-white block">Default Country Code</label>
                        <input
                          type="text"
                          defaultValue={effectiveConfig?.general?.defaultCountry || 'SA'}
                          onBlur={(e) => handleSaveConfigValue('GENERAL.DEFAULT_COUNTRY', e.target.value, 'GENERAL')}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-mono font-semibold"
                        />
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <label className="font-bold text-slate-900 dark:text-white block">Timezone</label>
                        <input
                          type="text"
                          defaultValue={effectiveConfig?.general?.timezone || 'Asia/Riyadh'}
                          onBlur={(e) => handleSaveConfigValue('GENERAL.TIMEZONE', e.target.value, 'GENERAL')}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-mono font-semibold"
                        />
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <label className="font-bold text-slate-900 dark:text-white block">Fiscal Year Start Month</label>
                        <input
                          type="number"
                          defaultValue={effectiveConfig?.general?.fiscalYearStartMonth || 1}
                          onBlur={(e) => handleSaveConfigValue('GENERAL.FISCAL_YEAR_START_MONTH', Number(e.target.value), 'GENERAL', 'number')}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-mono font-semibold"
                        />
                      </div>
                    </>
                  )}

                  {selectedCategory === 'FINANCIAL' && (
                    <>
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <label className="font-bold text-slate-900 dark:text-white block">Allow Backdated Transactions</label>
                        <select
                          defaultValue={String(effectiveConfig?.financial?.allowBackdatedTransactions ?? true)}
                          onChange={(e) => handleSaveConfigValue('FINANCIAL.ALLOW_BACKDATED', e.target.value === 'true', 'FINANCIAL', 'boolean')}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-semibold"
                        >
                          <option value="true">Enabled (Allowed within open fiscal period)</option>
                          <option value="false">Disabled (Strict current-date posting)</option>
                        </select>
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <label className="font-bold text-slate-900 dark:text-white block">Auto Post Approved Journals</label>
                        <select
                          defaultValue={String(effectiveConfig?.financial?.autoPostApprovedJournals ?? true)}
                          onChange={(e) => handleSaveConfigValue('FINANCIAL.AUTO_POST_JOURNALS', e.target.value === 'true', 'FINANCIAL', 'boolean')}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-semibold"
                        >
                          <option value="true">Yes (Post directly on approval)</option>
                          <option value="false">No (Require explicit manual posting step)</option>
                        </select>
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <label className="font-bold text-slate-900 dark:text-white block">Tax Calculation Method</label>
                        <select
                          defaultValue={effectiveConfig?.financial?.taxCalculationMethod || 'LINE_EXACT'}
                          onChange={(e) => handleSaveConfigValue('FINANCIAL.TAX_CALC_METHOD', e.target.value, 'FINANCIAL')}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-semibold"
                        >
                          <option value="LINE_EXACT">Line-by-Line Exact Rounding</option>
                          <option value="DOCUMENT_TOTAL">Document Total Rounding</option>
                        </select>
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <label className="font-bold text-slate-900 dark:text-white block">Lock Date for Closed Books</label>
                        <input
                          type="date"
                          defaultValue={effectiveConfig?.financial?.closedPeriodLockDate || '2025-12-31'}
                          onBlur={(e) => handleSaveConfigValue('FINANCIAL.CLOSED_LOCK_DATE', e.target.value, 'FINANCIAL')}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-mono font-semibold"
                        />
                      </div>
                    </>
                  )}

                  {selectedCategory === 'INVENTORY' && (
                    <>
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <label className="font-bold text-slate-900 dark:text-white block">Costing Method</label>
                        <select
                          defaultValue={effectiveConfig?.inventory?.costingMethod || 'FIFO'}
                          onChange={(e) => handleSaveConfigValue('INVENTORY.COSTING_METHOD', e.target.value, 'INVENTORY')}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-semibold"
                        >
                          <option value="FIFO">FIFO (First In First Out)</option>
                          <option value="MOVING_AVERAGE">Moving Average Cost</option>
                          <option value="STANDARD_COST">Standard Fixed Cost</option>
                        </select>
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <label className="font-bold text-slate-900 dark:text-white block">Allow Negative Stock Balance</label>
                        <select
                          defaultValue={String(effectiveConfig?.inventory?.allowNegativeStock ?? false)}
                          onChange={(e) => handleSaveConfigValue('INVENTORY.ALLOW_NEGATIVE_STOCK', e.target.value === 'true', 'INVENTORY', 'boolean')}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-semibold"
                        >
                          <option value="false">Strict Prohibition (Prevent Negative Stock)</option>
                          <option value="true">Allowed (Warning only)</option>
                        </select>
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <label className="font-bold text-slate-900 dark:text-white block">Batch / Serial Tracking Required</label>
                        <select
                          defaultValue={String(effectiveConfig?.inventory?.requireSerialTracking ?? true)}
                          onChange={(e) => handleSaveConfigValue('INVENTORY.REQUIRE_SERIAL', e.target.value === 'true', 'INVENTORY', 'boolean')}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-semibold"
                        >
                          <option value="true">Mandatory on Receipt & Dispatch</option>
                          <option value="false">Optional</option>
                        </select>
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <label className="font-bold text-slate-900 dark:text-white block">Default Warehousing Strategy</label>
                        <select
                          defaultValue={effectiveConfig?.inventory?.defaultStrategy || 'MULTI_LOCATION'}
                          onChange={(e) => handleSaveConfigValue('INVENTORY.DEFAULT_STRATEGY', e.target.value, 'INVENTORY')}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-semibold"
                        >
                          <option value="MULTI_LOCATION">Multi-Location Bin & Zone Management</option>
                          <option value="SINGLE_WAREHOUSE">Single Warehouse Simplified</option>
                        </select>
                      </div>
                    </>
                  )}

                  {selectedCategory === 'SALES' && (
                    <>
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <label className="font-bold text-slate-900 dark:text-white block">Credit Limit Enforcement</label>
                        <select
                          defaultValue={effectiveConfig?.sales?.creditCheckMode || 'BLOCK_ON_EXCEED'}
                          onChange={(e) => handleSaveConfigValue('SALES.CREDIT_CHECK_MODE', e.target.value, 'SALES')}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-semibold"
                        >
                          <option value="BLOCK_ON_EXCEED">Block New Sales Order on Limit Exceeded</option>
                          <option value="WARN_ONLY">Display Warning Only</option>
                          <option value="REQUIRE_APPROVAL">Require Finance Approval</option>
                        </select>
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <label className="font-bold text-slate-900 dark:text-white block">Default Payment Term Days</label>
                        <input
                          type="number"
                          defaultValue={effectiveConfig?.sales?.defaultPaymentTermDays || 30}
                          onBlur={(e) => handleSaveConfigValue('SALES.DEFAULT_PAYMENT_TERM_DAYS', Number(e.target.value), 'SALES', 'number')}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-mono font-semibold"
                        />
                      </div>
                    </>
                  )}

                  {selectedCategory === 'PURCHASING' && (
                    <>
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <label className="font-bold text-slate-900 dark:text-white block">3-Way Invoice Matching Rule</label>
                        <select
                          defaultValue={effectiveConfig?.purchasing?.matchingRule || 'STRICT_3_WAY'}
                          onChange={(e) => handleSaveConfigValue('PURCHASING.MATCHING_RULE', e.target.value, 'PURCHASING')}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-semibold"
                        >
                          <option value="STRICT_3_WAY">Strict 3-Way Match (PO + Receipt + Vendor Bill)</option>
                          <option value="TWO_WAY">2-Way Match (PO + Vendor Bill)</option>
                        </select>
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <label className="font-bold text-slate-900 dark:text-white block">Purchase Order Approval Threshold ($)</label>
                        <input
                          type="number"
                          defaultValue={effectiveConfig?.purchasing?.approvalThreshold || 5000}
                          onBlur={(e) => handleSaveConfigValue('PURCHASING.APPROVAL_THRESHOLD', Number(e.target.value), 'PURCHASING', 'number')}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-mono font-semibold"
                        />
                      </div>
                    </>
                  )}

                  {selectedCategory === 'SECURITY' && (
                    <>
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <label className="font-bold text-slate-900 dark:text-white block">Multi-Factor Authentication (MFA)</label>
                        <select
                          defaultValue={String(effectiveConfig?.security?.requireMFA ?? true)}
                          onChange={(e) => handleSaveConfigValue('SECURITY.REQUIRE_MFA', e.target.value === 'true', 'SECURITY', 'boolean')}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-semibold"
                        >
                          <option value="true">Enforced for all Users</option>
                          <option value="false">Optional</option>
                        </select>
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <label className="font-bold text-slate-900 dark:text-white block">Session Timeout (Minutes)</label>
                        <input
                          type="number"
                          defaultValue={effectiveConfig?.security?.sessionTimeoutMinutes || 30}
                          onBlur={(e) => handleSaveConfigValue('SECURITY.SESSION_TIMEOUT', Number(e.target.value), 'SECURITY', 'number')}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-mono font-semibold"
                        />
                      </div>
                    </>
                  )}

                </div>
              </div>

              {/* Feature Flags Matrix for Current Edition */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {isAr ? 'مصفوفة الميزات حسب الإصدار (Feature Flags Catalog)' : 'Feature Flags Catalog'}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    Active Edition: <span className="font-bold text-indigo-600">{productEdition}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {featureFlags.map((ff: any, idx: number) => {
                    const flagKey = ff.featureKey || ff.key || `ff_${idx}`;
                    const isEnabled = ff.isEnabled ?? ff.enabled;
                    const minEdition = ff.minEditionRequired || ff.minEdition || 'Community';
                    const name = ff.featureName || ff.name || flagKey;

                    return (
                      <div
                        key={flagKey}
                        className={`p-3 rounded-xl border transition flex items-start gap-3 ${
                          isEnabled 
                            ? 'border-indigo-100 dark:border-indigo-950 bg-indigo-50/30 dark:bg-indigo-950/20' 
                            : 'border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 opacity-60'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${isEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-600 dark:bg-slate-800'}`}>
                          {isEnabled ? <Check className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white font-mono text-[11px]">{name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                              Req: {minEdition}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-normal">{ff.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Localization Engine & Compliance Packs */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {isAr ? 'حزم التوطين والامتثال الضريبي والدولي (Localization Packs)' : 'Country Localization & Tax Compliance Packs'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {localizationPacks.map((pack: any, idx: number) => {
                    const countryCode = pack.countryCode || pack.code || 'SYS';
                    const taxName = pack.taxSystem?.systemName || pack.taxPacks?.[0]?.name || 'Standard Tax System';
                    const taxRate = pack.taxSystem?.defaultTaxRate ?? pack.taxPacks?.[0]?.defaultRate ?? 15;
                    const eInvoicing = pack.taxSystem?.eInvoicingStandard || pack.documentTemplates?.[0]?.templateName || 'E-Invoicing Standard';
                    const languages = (pack.supportedLanguages || pack.languagePacks || []).join(', ');
                    const currency = pack.currencyCode || pack.currency || 'SAR';

                    return (
                      <div key={pack.id || countryCode || `loc-pack-${idx}`} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{pack.countryName} ({countryCode})</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                            INSTALLED
                          </span>
                        </div>
                        <div className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                          <div>• Tax System: <span className="font-mono font-bold text-indigo-600">{taxName} ({taxRate}%)</span></div>
                          <div>• Electronic Invoicing: <span className="font-semibold">{eInvoicing}</span></div>
                          <div>• Primary Languages: <span className="font-mono">{languages}</span></div>
                          <div>• Default Currency: <span className="font-bold">{currency}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB 1: Master Data Foundation */}
      {activeTab === 'masterData' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Branches */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <GitBranch className="w-4 h-4 text-indigo-600" />
                <span>{isAr ? 'الفروع المعتمدة (Branches)' : 'Branches'}</span>
              </h3>
              <div className="space-y-2 text-xs">
                {branches.map(b => (
                  <div key={b.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="font-bold text-slate-900 dark:text-white">{isAr ? b.nameAr : b.name} ({b.code})</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{b.city}, {b.country} | Tax Reg: {b.taxRegistrationNumber || 'Default'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Centers */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <PieChart className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'مراكز التكلفة (Cost Centers)' : 'Cost Centers'}</span>
              </h3>
              <div className="space-y-2 text-xs">
                {costCenters.map(cc => (
                  <div key={cc.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="font-bold text-slate-900 dark:text-white font-mono">{cc.code} - {isAr ? cc.nameAr : cc.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Parent: {cc.parentCode || 'Root'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Profit Centers & Projects */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Briefcase className="w-4 h-4 text-amber-600" />
                <span>{isAr ? 'مراكز الربحية والمشاريع' : 'Profit Centers & Projects'}</span>
              </h3>
              <div className="space-y-2 text-xs">
                {profitCenters.map(pc => (
                  <div key={pc.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="font-bold text-slate-900 dark:text-white font-mono">{pc.code} - {isAr ? pc.nameAr : pc.name}</div>
                  </div>
                ))}
                {projects.map(p => (
                  <div key={p.id} className="p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-950 bg-indigo-50/30 dark:bg-indigo-950/20">
                    <div className="font-bold text-indigo-950 dark:text-indigo-200 font-mono">{p.code} - {p.name}</div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">Status: {p.status}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Tax Rules & ZATCA Compliance */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Percent className="w-4 h-4 text-indigo-600" />
                <span>{isAr ? 'قواعد ضريبة القيمة المضافة (ZATCA VAT Rules)' : 'Tax & ZATCA VAT Rules'}</span>
              </h3>
              <div className="space-y-2 text-xs">
                {taxRules.map(tr => (
                  <div key={tr.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="font-bold text-slate-900 dark:text-white">{tr.name} ({tr.code})</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Rate: <strong className="text-indigo-600">{tr.rate}%</strong> | GL Acc: {tr.accountCode}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Currencies & Fiscal Years */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'العملات والسنوات المالية' : 'Currencies & Fiscal Years'}</span>
              </h3>
              <div className="space-y-2 text-xs">
                {currencies.map(cur => (
                  <div key={cur.id} className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
                    <span className="font-bold font-mono text-slate-900 dark:text-white">{cur.code} - {cur.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">{cur.isBaseCurrency ? 'Base' : 'Fx'}</span>
                  </div>
                ))}
                {fiscalYears.map(fy => (
                  <div key={fy.id} className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">{fy.code} ({fy.startDate} to {fy.endDate})</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">{fy.isClosed ? 'Closed' : 'Active FY'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Units of Measure & Payment Terms */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <DollarSign className="w-4 h-4 text-slate-600" />
                <span>{isAr ? 'شروط الدفع ووحدات القياس' : 'Payment Terms & UOM'}</span>
              </h3>
              <div className="space-y-2 text-xs">
                {paymentTerms.map(pt => (
                  <div key={pt.id} className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">{pt.name}</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-600">{pt.dueDays} Days</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  {unitsOfMeasure.map(u => (
                    <span key={u.id} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                      {u.code} ({u.name})
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: Document Numbering Engine */}
      {activeTab === 'numbering' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1 flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-500" />
              <span>{isAr ? 'محرك ترقيم المستندات التلقائي' : 'Document Auto-Numbering Engine Rules'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {isAr ? 'ضبط قواعد التسلسل الفريد للقيود المحاسبية، الفواتير، وأوامر الشراء' : 'Configure strict document prefix formats, zero padding, and next sequence IDs per tenant'}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">{isAr ? 'نوع المستند' : 'Entity Type'}</th>
                    <th className="px-4 py-3">{isAr ? 'البادئة (Prefix)' : 'Prefix'}</th>
                    <th className="px-4 py-3">{isAr ? 'التسلسل القادم' : 'Next Number'}</th>
                    <th className="px-4 py-3">{isAr ? 'خانات الصفر' : 'Zero Pad'}</th>
                    <th className="px-4 py-3">{isAr ? 'آخر صيغة منشأة' : 'Last Generated Format'}</th>
                    <th className="px-4 py-3 text-right rtl:text-left">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {numberingRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white font-mono">
                        {rule.entityType}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {rule.prefix}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {rule.nextNumber}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {rule.paddingLength}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {rule.prefix}{String(rule.nextNumber).padStart(rule.paddingLength, '0')}
                      </td>
                      <td className="px-4 py-3 text-right rtl:text-left">
                        <button
                          onClick={() => setEditingRule(rule)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Workflow Rules & Approvals */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          
          {/* Workflow Rules Config */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-500" />
              <span>{isAr ? 'قواعد الموافقات والتفويض المالي' : 'Configurable Multi-Level Approval Workflows'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workflowRules.map((wr) => (
                <div
                  key={wr.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>{wr.ruleName}</span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-indigo-100 text-indigo-800 text-[10px]">
                      {wr.entityType}
                    </span>
                  </div>

                  <p className="text-slate-500 text-[11px]">
                    Threshold: Trigger approval if document amount &gt; <strong className="text-slate-900 dark:text-white">{wr.minAmount.toLocaleString()} SAR</strong>
                  </p>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Approver Role: <span className="font-bold text-indigo-600 dark:text-indigo-400">{wr.approverRole}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Approval Inbox */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-500" />
              <span>{isAr ? 'صندوق طلبات الاعتماد المعلقة' : 'Pending Approvals Inbox'}</span>
            </h3>

            <div className="space-y-3">
              {approvals.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">
                  {isAr ? 'لا توجد طلبات موافقة معلقة' : 'No approval requests pending'}
                </div>
              ) : (
                approvals.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{app.entityNumber}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          app.status === 'Pending' ? 'bg-amber-100 text-amber-800' : app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {app.description}
                      </p>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Requested by: <span className="font-semibold text-slate-700 dark:text-slate-300">{app.requestedByName}</span> on {app.requestedAt.split('T')[0]}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right mr-2 font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {app.amount.toLocaleString()} SAR
                      </div>

                      {app.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleAction(app.id, 'APPROVE')}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'اعتماد' : 'Approve'}</span>
                          </button>
                          <button
                            onClick={() => handleAction(app.id, 'REJECT')}
                            className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{isAr ? 'رفض' : 'Reject'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: Immutable Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              <span>{isAr ? 'سجل التدقيق الإلكتروني غير القابل للتعديل' : 'Immutable Transaction Audit Trail & Activity Timeline'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr ? 'يسجل آلياً جميع عمليات الإنشاء، الترحيل، والاعتماد مع بيانات المستخدم وعنوان IP' : 'Logs WHO, WHAT, WHEN, IP Address, and Action Details according to ISO 27001 standards'}
            </p>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs flex items-start gap-3"
              >
                <div className={`p-2 rounded-xl text-white font-bold text-[10px] shrink-0 ${
                  log.action === 'CREATE' ? 'bg-indigo-600' : log.action === 'POST' ? 'bg-emerald-600' : log.action === 'APPROVE' ? 'bg-amber-600' : 'bg-slate-700'
                }`}>
                  {log.action}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {log.userName} ({log.userRole})
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {log.timestamp.replace('T', ' ').substring(0, 19)} | IP: {log.ipAddress}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300">
                    {log.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Tenants & Companies */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0B1F3A] border border-[#153258] text-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#153258] border border-[#F28C28]/40 text-[#F28C28]">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{isAr ? 'إدارة الكيانات القانونية والتهيئة الدولية' : 'Legal Entities & Global Companies Management'}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#F28C28] text-slate-950 font-bold">
                    Multi-Country Ready
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  {isAr ? 'دعم كامل لدول، عملات، وأنظمة ضريبية غير محدودة دون أي قيم مسجلة صلباً' : 'Configurable country architecture supporting dynamic currencies, tax frameworks, and timezones'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedCompanyForEdit(null);
                setIsCompanyModalOpen(true);
              }}
              className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#F28C28] hover:bg-[#d9791c] text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0"
            >
              <Building2 className="w-4 h-4" />
              <span>{isAr ? 'إضافة شركة جديدة' : 'Create New Company'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tenants Column */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>{isAr ? 'المستأجرون (Tenants)' : 'Tenants Directory'}</span>
              </h3>
              <div className="space-y-3">
                {tenants.map(t => (
                  <div key={t.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs space-y-2">
                    <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between">
                      <span>{t.name}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold">{t.code}</span>
                    </div>
                    <div className="text-slate-500">Edition: <span className="font-bold text-indigo-600">{t.edition}</span></div>
                    <div className="text-slate-400 text-[10px]">Owner: {t.ownerEmail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Companies Grid */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <span>{isAr ? 'دليل الشركات والكيانات التابعة' : 'Companies & Legal Entities Catalog'}</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono font-semibold">
                    {companies.length} Registered Companies
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companies.map(c => {
                    const countryObj = countriesMaster.find(cm => cm.code === c.countryCode || cm.name === c.country);
                    return (
                      <div key={c.id} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-2xl leading-none">{countryObj?.flag || '🌐'}</span>
                              <div className="truncate">
                                <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                  {isAr ? c.nameAr || c.name : c.name}
                                </h4>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Code: {c.code} • Country: {c.countryCode || 'SA'}
                                </div>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold shrink-0">
                              {c.currency}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">{isAr ? 'المنظومة الضريبية:' : 'Tax Framework:'}</span>
                              <span className="font-semibold text-amber-600 dark:text-amber-400">{c.taxSystemName || 'Standard VAT'} ({c.taxRate || 15}%)</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">{isAr ? 'الرقم الضريبي:' : 'TRN / Tax No:'}</span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">{c.taxNumber || 'Not set'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">{isAr ? 'المنطقة الزمنية:' : 'Timezone:'}</span>
                              <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">{c.timezone || 'Asia/Riyadh'}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedCompanyForEdit(c);
                            setIsCompanyModalOpen(true);
                          }}
                          className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تعديل البيانات والتهيئة المحلية' : 'Configure Localization & Setup'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLATFORM INTEGRATION & PILOT READINESS (PHASE 3.0) */}
      {activeTab === 'platformIntegration' && (
        <PlatformIntegrationView />
      )}

      {/* EDIT NUMBERING RULE MODAL */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isAr ? 'تعديل قاعدة الترقيم التلقائي' : 'Edit Numbering Sequence Rule'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Entity Type</label>
                <input
                  type="text"
                  disabled
                  value={editingRule.entityType}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-3 py-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Prefix</label>
                <input
                  type="text"
                  value={editingRule.prefix}
                  onChange={(e) => setEditingRule({ ...editingRule, prefix: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Next Sequence Number</label>
                <input
                  type="number"
                  value={editingRule.nextNumber}
                  onChange={(e) => setEditingRule({ ...editingRule, nextNumber: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Padding Length</label>
                <input
                  type="number"
                  value={editingRule.paddingLength}
                  onChange={(e) => setEditingRule({ ...editingRule, paddingLength: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNumberingRule}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs"
              >
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPANY CREATION & LOCALIZATION MODAL */}
      <CompanyModal
        company={selectedCompanyForEdit}
        countries={countriesMaster}
        taxSystems={taxSystemsMaster}
        currencies={currencies}
        states={statesMaster}
        cities={citiesMaster}
        timezones={timezonesMaster}
        languages={languagesMaster}
        fiscalCalendars={fiscalCalendarsMaster}
        isOpen={isCompanyModalOpen}
        onClose={() => {
          setIsCompanyModalOpen(false);
          setSelectedCompanyForEdit(null);
        }}
        onSaveSuccess={() => {
          triggerReload();
        }}
        isAr={isAr}
      />

    </div>
  );
};
