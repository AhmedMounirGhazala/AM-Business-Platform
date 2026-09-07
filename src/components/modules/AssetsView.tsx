import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Calculator, 
  TrendingDown, 
  RefreshCw, 
  Plus, 
  Search, 
  Sliders, 
  FileSpreadsheet,
  Trash2,
  ArrowRightLeft,
  QrCode,
  Barcode,
  Wrench,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  History,
  Layers,
  DollarSign,
  Activity,
  FileText,
  ScanLine,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { ApiClient } from '../../services/apiClient';
import { 
  FixedAssetMaster, 
  AssetClass, 
  AcquisitionType, 
  DepreciationMethod, 
  TransferType, 
  DisposalType, 
  MaintenanceType,
  PhysicalVerificationSession,
  AssetAuditLogRecord
} from '../../types/fixedAssets';

export const AssetsView: React.FC = () => {
  const { lang, activeCompany } = usePlatform();
  const isAr = lang === 'ar';

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'registry'
    | 'acquisitions'
    | 'depreciation'
    | 'transfers'
    | 'disposals_reval'
    | 'maintenance'
    | 'verification'
    | 'reports'
  >('dashboard');

  // Master Data & State
  const [assets, setAssets] = useState<FixedAssetMaster[]>([]);
  const [assetClasses, setAssetClasses] = useState<AssetClass[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AssetAuditLogRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Filters & Selected State
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAsset, setSelectedAsset] = useState<FixedAssetMaster | null>(null);
  const [depSchedule, setDepSchedule] = useState<any[]>([]);

  // Modals & Action Controls
  const [showAcqModal, setShowAcqModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDisposalModal, setShowDisposalModal] = useState(false);
  const [showRevalModal, setShowRevalModal] = useState(false);
  const [showImpairmentModal, setShowImpairmentModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);

  // Form States
  const [newAssetData, setNewAssetData] = useState({
    name: '',
    nameAr: '',
    assetClassId: 'AC-400',
    locationId: 'loc-001',
    departmentId: 'dept-002',
    costCenterId: 'cc-002',
    responsibleEmployeeId: 'emp-101',
    supplierId: 'vendor-001',
    manufacturer: '',
    model: '',
    serialNumber: '',
    acquisitionType: 'PURCHASE' as AcquisitionType,
    acquisitionDate: new Date().toISOString().split('T')[0],
    operationalDate: new Date().toISOString().split('T')[0],
    purchaseCost: 100000,
    salvageValue: 5000,
    usefulLifeYears: 5,
    depreciationMethod: 'STRAIGHT_LINE' as DepreciationMethod,
    depreciationFrequency: 'MONTHLY' as any,
    companyId: activeCompany?.id || 'comp-001',
    branchId: 'br-001',
    currency: 'SAR'
  });

  const [transferForm, setTransferForm] = useState({
    assetId: '',
    transferType: 'LOCATION' as TransferType,
    toLocationId: 'loc-002',
    toDepartmentId: 'dept-003',
    toCostCenterId: 'cc-003',
    toEmployeeId: 'emp-102',
    reason: 'Departmental reallocation & site transfer',
    approvedBy: 'Chief Operating Officer'
  });

  const [disposalForm, setDisposalForm] = useState({
    assetId: '',
    disposalType: 'SALE' as DisposalType,
    disposalDate: new Date().toISOString().split('T')[0],
    proceedsAmount: 50000,
    buyerName: 'Al-Madina Refurbishers & Salvage Co',
    remarks: 'Asset decommissioning & replacement sale',
    approvedBy: 'Chief Financial Officer'
  });

  const [revalForm, setRevalForm] = useState({
    assetId: '',
    revaluationDate: new Date().toISOString().split('T')[0],
    appraisalValue: 120000,
    valuerName: 'KPMG Independent Valuations KSA',
    valuerReportReference: 'KPMG-VAL-2026-88',
    remarks: 'IAS 16 Periodic Fair Market Revaluation',
    approvedBy: 'Audit Committee Chair'
  });

  const [impairmentForm, setImpairmentForm] = useState({
    assetId: '',
    impairmentDate: new Date().toISOString().split('T')[0],
    recoverableAmount: 40000,
    valuationMethod: 'VALUE_IN_USE' as 'FAIR_VALUE' | 'VALUE_IN_USE',
    isReversal: false,
    reason: 'Technological obsolescence & market capacity drop',
    approvedBy: 'Chief Financial Officer'
  });

  const [maintForm, setMaintForm] = useState({
    assetId: '',
    maintenanceType: 'PREVENTIVE' as MaintenanceType,
    maintenanceDate: new Date().toISOString().split('T')[0],
    vendorName: 'Saudi Industrial Maintenance Corp',
    description: 'Quarterly system overhaul & filter replacement',
    cost: 8500,
    downtimeHours: 4,
    performedBy: 'Lead Maintenance Engineer'
  });

  // Physical Count Session State
  const [verificationSession, setVerificationSession] = useState<PhysicalVerificationSession | null>(null);
  const [scanInput, setScanInput] = useState('');

  // Report State
  const [rollForwardReport, setRollForwardReport] = useState<any>(null);

  // Fetch Initial Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [assetsRes, masterDataRes, maintRes, auditRes, rollForwardRes] = await Promise.all([
        ApiClient.getFixedAssets(activeCompany?.id || 'comp-001'),
        ApiClient.getFixedAssetMasterData(),
        ApiClient.getAssetMaintenances(),
        ApiClient.getAssetAuditTrail(),
        ApiClient.getAssetRollForwardReport({ companyId: activeCompany?.id || 'comp-001' })
      ]);

      if (assetsRes?.data) setAssets(assetsRes.data);
      if (masterDataRes?.assetClasses) setAssetClasses(masterDataRes.assetClasses);
      if (masterDataRes?.locations) setLocations(masterDataRes.locations);
      if (masterDataRes?.departments) setDepartments(masterDataRes.departments);
      if (masterDataRes?.costCenters) setCostCenters(masterDataRes.costCenters);
      if (masterDataRes?.employees) setEmployees(masterDataRes.employees);
      if (maintRes?.data) setMaintenances(maintRes.data);
      if (auditRes?.data) setAuditLogs(auditRes.data);
      if (rollForwardRes) setRollForwardReport(rollForwardRes);

      if (assetsRes?.data?.length > 0 && !selectedAsset) {
        setSelectedAsset(assetsRes.data[0]);
        loadDepSchedule(assetsRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load asset domain data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompany?.id]);

  const loadDepSchedule = async (assetId: string) => {
    try {
      const res = await ApiClient.getAssetDepreciationSchedule(assetId);
      if (res?.schedule) setDepSchedule(res.schedule);
    } catch (err) {
      console.error('Failed to load depreciation schedule:', err);
    }
  };

  // Action Handlers
  const handleRunMonthlyDepreciation = async () => {
    try {
      const period = '2026-08';
      const res = await ApiClient.runAssetDepreciation(activeCompany?.id || 'comp-001', period, 'CFO / System');
      setStatusMessage(`Monthly Depreciation Posting Executed for ${period}! Total Posted: ${res.depreciationRunResult.totalDepreciationAmount.toLocaleString()} SAR`);
      loadData();
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err: any) {
      alert(`Depreciation Run Error: ${err.message}`);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.createFixedAsset({
        assetData: {
          ...newAssetData,
          companyId: activeCompany?.id || 'comp-001'
        },
        createdBy: 'usr-001'
      });
      setStatusMessage(`Asset Capitalized: ${res.asset.assetNumber} - ${res.asset.name}`);
      setShowAcqModal(false);
      loadData();
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err: any) {
      alert(`Asset Registration Error: ${err.message}`);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.postAssetTransfer({
        ...transferForm,
        approvedBy: 'Chief Operating Officer'
      });
      setStatusMessage(`Transfer Recorded for Asset: ${res.updatedAsset.assetNumber}`);
      setShowTransferModal(false);
      loadData();
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err: any) {
      alert(`Transfer Error: ${err.message}`);
    }
  };

  const handleDisposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.postAssetDisposal({
        ...disposalForm,
        approvedBy: 'Chief Financial Officer'
      });
      setStatusMessage(`Asset ${res.updatedAsset.assetNumber} Disposed. Gain/Loss: ${res.disposalRecord.gainLossAmount.toLocaleString()} SAR`);
      setShowDisposalModal(false);
      loadData();
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err: any) {
      alert(`Disposal Error: ${err.message}`);
    }
  };

  const handleRevaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.postAssetRevaluation({
        ...revalForm,
        approvedBy: 'Audit Committee Chair'
      });
      setStatusMessage(`IAS 16 Revaluation Applied for ${res.updatedAsset.assetNumber}. New NBV: ${res.updatedAsset.netBookValue.toLocaleString()} SAR`);
      setShowRevalModal(false);
      loadData();
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err: any) {
      alert(`Revaluation Error: ${err.message}`);
    }
  };

  const handleImpairment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.postAssetImpairment({
        ...impairmentForm,
        approvedBy: 'Chief Financial Officer'
      });
      setStatusMessage(`IAS 36 Impairment Processed for ${res.updatedAsset.assetNumber}.`);
      setShowImpairmentModal(false);
      loadData();
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err: any) {
      alert(`Impairment Error: ${err.message}`);
    }
  };

  const handleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.logAssetMaintenance({
        ...maintForm,
        performedBy: 'Lead Maintenance Engineer'
      });
      setStatusMessage(`Maintenance Logged for Asset ${res.maintenanceRecord.assetNumber}`);
      setShowMaintModal(false);
      loadData();
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err: any) {
      alert(`Maintenance Logging Error: ${err.message}`);
    }
  };

  const handleStartVerificationSession = async () => {
    try {
      const res = await ApiClient.createPhysicalVerificationSession({
        locationId: 'loc-001',
        locationName: 'Riyadh HQ Data Center',
        conductedBy: 'Auditor Tariq Al-Mansoor'
      });
      setVerificationSession(res.session);
    } catch (err: any) {
      alert(`Verification Session Error: ${err.message}`);
    }
  };

  const handleScanBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationSession || !scanInput.trim()) return;

    try {
      const res = await ApiClient.scanPhysicalVerificationBarcode({
        sessionId: verificationSession.id,
        scannedBarcode: scanInput.trim(),
        actualLocationId: verificationSession.locationId,
        notes: 'Handheld Laser Barcode Scan'
      });
      setVerificationSession(res.updatedSession);
      setScanInput('');
    } catch (err: any) {
      alert(`Scan Error: ${err.message}`);
    }
  };

  // Calculations for Metrics
  const totalCost = assets.reduce((sum, a) => sum + a.purchaseCost, 0);
  const totalAccumDep = assets.reduce((sum, a) => sum + a.totalAccumulatedDepreciation, 0);
  const totalNBV = assets.reduce((sum, a) => sum + a.netBookValue, 0);
  const activeCount = assets.filter(a => a.status === 'ACTIVE').length;
  const maintenanceCostTotal = maintenances.reduce((sum, m) => sum + m.cost, 0);

  // Filtered Assets datagrid
  const filteredAssets = assets.filter(a => {
    const matchesSearch = 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.assetNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'ALL' || a.assetClassId === classFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Notifications Banner */}
      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-fadeIn shadow-md">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-sm">{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-600 font-bold hover:underline text-xs">
            {isAr ? 'إغلاق' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[11px] font-bold border border-purple-500/20">
              ENTERPRISE ASSET MANAGEMENT (IAS 16 / IAS 36)
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">SAP S/4HANA FI-AA & Oracle Assets Standards</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-purple-600" />
            <span>{isAr ? 'أصول المؤسسة ودورة حياة الأصول الثابتة' : 'Fixed Assets & Asset Lifecycle Workspace'}</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={handleRunMonthlyDepreciation}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isAr ? 'تشغيل الإهلاك الشهري' : 'Run Monthly Depreciation'}</span>
          </button>
          
          <button 
            onClick={() => setShowAcqModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer border border-[#F28C28]/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#F28C28]" />
            <span>{isAr ? 'تسجيل أصل جديد' : 'Register New Asset'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-2 scrollbar-none">
        {[
          { id: 'dashboard', label: isAr ? 'لوحة المراقبة' : 'Executive Dashboard', icon: Activity },
          { id: 'registry', label: isAr ? 'سجل الأصول' : 'Asset Register', icon: Building2 },
          { id: 'acquisitions', label: isAr ? 'الاستحواذ والرأسمالة' : 'Acquisitions', icon: Plus },
          { id: 'depreciation', label: isAr ? 'جدول الإهلاك' : 'Depreciation Schedule', icon: Calculator },
          { id: 'transfers', label: isAr ? 'تحويلات الأصول' : 'Transfers Engine', icon: ArrowRightLeft },
          { id: 'disposals_reval', label: isAr ? 'استبعاد وتقييم (IAS 16/36)' : 'Disposals & Revaluations', icon: ShieldAlert },
          { id: 'maintenance', label: isAr ? 'الصيانة والتشغيل' : 'Maintenance Log', icon: Wrench },
          { id: 'verification', label: isAr ? 'الجرد والتأكيد الفعلي' : 'Physical Audit', icon: ScanLine },
          { id: 'reports', label: isAr ? 'التقارير وسلسلة التتبع' : 'Reports & Audit', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================== TAB 1: EXECUTIVE DASHBOARD ==================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Executive Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>{isAr ? 'إجمالي تكلفة الأصول' : 'Total Asset Cost'}</span>
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {totalCost.toLocaleString()} <span className="text-xs font-normal text-slate-400">SAR</span>
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>IAS 16 Gross Historical Cost</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>{isAr ? 'مجمع الإهلاك التراكمي' : 'Accumulated Depreciation'}</span>
                <TrendingDown className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {totalAccumDep.toLocaleString()} <span className="text-xs font-normal text-slate-400">SAR</span>
              </div>
              <div className="text-[11px] text-amber-600 font-semibold mt-1">
                <span>{((totalAccumDep / (totalCost || 1)) * 100).toFixed(1)}% Depreciation Rate</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#F28C28]/40 dark:border-[#F28C28]/40 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>{isAr ? 'صافي القيمة الدفترية' : 'Net Book Value (NBV)'}</span>
                <ShieldCheck className="w-5 h-5 text-[#F28C28]" />
              </div>
              <div className="text-2xl font-black text-[#0B1F3A] dark:text-[#F28C28] mt-2">
                {totalNBV.toLocaleString()} <span className="text-xs font-normal text-slate-400">SAR</span>
              </div>
              <div className="text-[11px] text-[#F28C28] font-semibold mt-1">
                <span>Balance Sheet Carrying Amount</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>{isAr ? 'الأصول النشطة والصيانة' : 'Active Assets & Maintenance'}</span>
                <Building2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {activeCount} <span className="text-xs font-normal text-slate-400">Active Units</span>
              </div>
              <div className="text-[11px] text-slate-500 font-semibold mt-1">
                <span>Total Maintenance YTD: {maintenanceCostTotal.toLocaleString()} SAR</span>
              </div>
            </div>
          </div>

          {/* Asset Distribution & Lifecycle Status Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-purple-600" />
                <span>{isAr ? 'توزيع الأصول حسب فئة الأصل' : 'Asset Breakdown by Class'}</span>
              </h2>

              <div className="space-y-4">
                {assetClasses.map(ac => {
                  const classAssets = assets.filter(a => a.assetClassId === ac.id);
                  const classCost = classAssets.reduce((s, a) => s + a.purchaseCost, 0);
                  const pct = totalCost > 0 ? (classCost / totalCost) * 100 : 0;
                  return (
                    <div key={ac.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>{ac.name}</span>
                        <span>{classCost.toLocaleString()} SAR ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-purple-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-emerald-600" />
                <span>{isAr ? 'الأصول المسجلة مؤخراً' : 'Recent Asset Registrations'}</span>
              </h2>

              <div className="space-y-3">
                {assets.slice(0, 4).map(ast => (
                  <div key={ast.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">{ast.assetNumber}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{ast.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {ast.locationName} • {ast.usefulLifeYears} Yrs ({ast.depreciationMethod})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xs text-slate-900 dark:text-white">{ast.purchaseCost.toLocaleString()} SAR</div>
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{ast.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: ASSET REGISTRY Datagrid ==================== */}
      {activeTab === 'registry' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Datagrid Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={isAr ? 'البحث برقم الأصل أو الاسم أو البارکود...' : 'Search by asset number, name, barcode...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                <option value="ALL">All Asset Classes</option>
                {assetClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="UNDER_CONSTRUCTION">UNDER_CONSTRUCTION</option>
                <option value="FULLY_DEPRECIATED">FULLY_DEPRECIATED</option>
                <option value="TRANSFERRED">TRANSFERRED</option>
                <option value="DISPOSED">DISPOSED</option>
                <option value="IMPAIRED">IMPAIRED</option>
              </select>
            </div>
          </div>

          {/* Master Datagrid Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">{isAr ? 'رمز الأصل والبار كود' : 'Asset Code & Barcode'}</th>
                    <th className="p-4">{isAr ? 'اسم الأصل والفئة' : 'Asset Description & Class'}</th>
                    <th className="p-4">{isAr ? 'الموقع والقسم' : 'Location & Dept'}</th>
                    <th className="p-4">{isAr ? 'تاريخ الشراء' : 'Acq. Date'}</th>
                    <th className="p-4">{isAr ? 'العمر والتكلفة' : 'Useful Life & Cost'}</th>
                    <th className="p-4">{isAr ? 'الإهلاك التراكمي' : 'Accum. Dep.'}</th>
                    <th className="p-4">{isAr ? 'صافي القيمة الدفترية' : 'Net Book Value'}</th>
                    <th className="p-4">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="p-4 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAssets.map(ast => (
                    <tr 
                      key={ast.id}
                      onClick={() => { setSelectedAsset(ast); loadDepSchedule(ast.id); }}
                      className={`hover:bg-purple-50/50 dark:hover:bg-purple-950/20 cursor-pointer transition-colors ${
                        selectedAsset?.id === ast.id ? 'bg-purple-50/80 dark:bg-purple-950/40' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="font-mono font-black text-purple-600 dark:text-purple-400 text-xs">{ast.assetNumber}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Barcode className="w-3 h-3" />
                          <span>{ast.barcode}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{ast.name}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{ast.assetClassName || ast.assetClassId}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-800 dark:text-slate-200 font-semibold text-xs">{ast.locationName}</div>
                        <div className="text-[10px] text-slate-400">{ast.departmentName}</div>
                      </td>
                      <td className="p-4 font-mono text-slate-600 dark:text-slate-400 text-xs">
                        {ast.acquisitionDate}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{ast.purchaseCost.toLocaleString()} SAR</div>
                        <div className="text-[10px] text-slate-500">{ast.usefulLifeYears} Yrs ({ast.depreciationMethod})</div>
                      </td>
                      <td className="p-4 font-mono text-amber-600 dark:text-amber-400 font-bold text-xs">
                        {ast.totalAccumulatedDepreciation.toLocaleString()} SAR
                      </td>
                      <td className="p-4 font-mono text-purple-600 dark:text-purple-400 font-black text-xs">
                        {ast.netBookValue.toLocaleString()} SAR
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          ast.status === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : ast.status === 'DISPOSED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300'
                        }`}>
                          {ast.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAsset(ast);
                            loadDepSchedule(ast.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 text-slate-700 dark:text-slate-300 font-bold text-[11px]"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Asset Inspection Card & Depreciation Preview */}
          {selectedAsset && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-purple-500/30 shadow-lg animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">{selectedAsset.assetNumber}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-500">{selectedAsset.assetClassName}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{selectedAsset.name}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => { setTransferForm(prev => ({ ...prev, assetId: selectedAsset.id })); setShowTransferModal(true); }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Transfer Asset</span>
                  </button>

                  <button 
                    onClick={() => { setRevalForm(prev => ({ ...prev, assetId: selectedAsset.id })); setShowRevalModal(true); }}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 border border-blue-200 dark:border-blue-800"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>IAS 16 Revaluation</span>
                  </button>

                  <button 
                    onClick={() => { setImpairmentForm(prev => ({ ...prev, assetId: selectedAsset.id })); setShowImpairmentModal(true); }}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 font-bold text-xs flex items-center gap-1.5 border border-amber-200 dark:border-amber-800"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>IAS 36 Impairment</span>
                  </button>

                  <button 
                    onClick={() => { setDisposalForm(prev => ({ ...prev, assetId: selectedAsset.id })); setShowDisposalModal(true); }}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-bold text-xs flex items-center gap-1.5 border border-rose-200 dark:border-rose-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Dispose / Scrap</span>
                  </button>
                </div>
              </div>

              {/* Asset Technical Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">{isAr ? 'الباركود والرمز' : 'Barcode & QR'}</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedAsset.barcode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">{isAr ? 'المُصنّع والطراز' : 'Manufacturer & Model'}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAsset.manufacturer || 'N/A'} {selectedAsset.model}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">{isAr ? 'العمر الافتراضي والطريقة' : 'Useful Life & Method'}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAsset.usefulLifeYears} Years ({selectedAsset.depreciationMethod})</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">{isAr ? 'قيمة الخردة / المتبقية' : 'Salvage Value'}</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedAsset.salvageValue.toLocaleString()} SAR</span>
                </div>
              </div>

              {/* Preview First 5 Schedule Lines */}
              <div className="mt-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span>Depreciation Schedule Preview</span>
                  <span className="text-[11px] text-purple-600 font-semibold cursor-pointer hover:underline" onClick={() => setActiveTab('depreciation')}>
                    View Full Schedule →
                  </span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  {depSchedule.slice(0, 5).map(s => (
                    <div key={s.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-mono">Period {s.periodNumber} ({s.periodStartDate})</div>
                      <div className="font-bold text-purple-600 dark:text-purple-400 mt-1">{s.depreciationAmount.toLocaleString()} SAR</div>
                      <div className="text-[10px] font-semibold text-slate-500 mt-0.5">NBV: {s.closingBookValue.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 3: ASSET ACQUISITIONS ==================== */}
      {activeTab === 'acquisitions' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-fadeIn">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-600" />
              <span>{isAr ? 'تسجيل واستحواذ الأصول الثابتة' : 'Asset Acquisition & Capitalization Form'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Supports Purchase, Construction (CWIP), Opening Balance, Donation, Capital Lease, Project Transfer, and Intercompany Transfer
            </p>
          </div>

          <form onSubmit={handleCreateAsset} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'اسم الأصل (إنجليزي)' : 'Asset Description (English)'}
              </label>
              <input
                type="text"
                required
                value={newAssetData.name}
                onChange={e => setNewAssetData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Caterpillar Heavy Excavator Unit"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'اسم الأصل (عربي)' : 'Asset Description (Arabic)'}
              </label>
              <input
                type="text"
                value={newAssetData.nameAr}
                onChange={e => setNewAssetData(prev => ({ ...prev, nameAr: e.target.value }))}
                placeholder="حفار كاترپيلار الثقيل"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'فئة الأصل الثابت' : 'Asset Class'}
              </label>
              <select
                value={newAssetData.assetClassId}
                onChange={e => setNewAssetData(prev => ({ ...prev, assetClassId: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
              >
                {assetClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'نوع الاستحواذ' : 'Acquisition Type'}
              </label>
              <select
                value={newAssetData.acquisitionType}
                onChange={e => setNewAssetData(prev => ({ ...prev, acquisitionType: e.target.value as AcquisitionType }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
              >
                <option value="PURCHASE">PURCHASE (Direct Vendor Buy)</option>
                <option value="CONSTRUCTION">CONSTRUCTION (CWIP Capitalized)</option>
                <option value="OPENING_BALANCE">OPENING BALANCE (Historical Migration)</option>
                <option value="DONATION">DONATION (Contributed Asset)</option>
                <option value="LEASE_CAPITALIZATION">LEASE CAPITALIZATION (IFRS 16 ROU)</option>
                <option value="PROJECT_TRANSFER">PROJECT TRANSFER (WIP Capitalization)</option>
                <option value="INTERCOMPANY_TRANSFER">INTERCOMPANY TRANSFER</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'تكلفة الشراء (SAR)' : 'Purchase Cost / Capitalized Amount'}
              </label>
              <input
                type="number"
                required
                value={newAssetData.purchaseCost}
                onChange={e => setNewAssetData(prev => ({ ...prev, purchaseCost: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'قيمة الخردة / الإنقاذ' : 'Salvage Value / Residual Value'}
              </label>
              <input
                type="number"
                value={newAssetData.salvageValue}
                onChange={e => setNewAssetData(prev => ({ ...prev, salvageValue: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'العمر الافتراضي (سنوات)' : 'Useful Life (Years)'}
              </label>
              <input
                type="number"
                required
                value={newAssetData.usefulLifeYears}
                onChange={e => setNewAssetData(prev => ({ ...prev, usefulLifeYears: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'طريقة الإهلاك' : 'Depreciation Method'}
              </label>
              <select
                value={newAssetData.depreciationMethod}
                onChange={e => setNewAssetData(prev => ({ ...prev, depreciationMethod: e.target.value as DepreciationMethod }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
              >
                <option value="STRAIGHT_LINE">STRAIGHT_LINE (IAS 16 Standard)</option>
                <option value="DECLINING_BALANCE">DECLINING_BALANCE</option>
                <option value="DOUBLE_DECLINING">DOUBLE_DECLINING</option>
                <option value="UNITS_OF_PRODUCTION">UNITS_OF_PRODUCTION</option>
                <option value="NO_DEPRECIATION">NO_DEPRECIATION (Land / Artwork)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'الموقع الجغرافي' : 'Asset Location'}
              </label>
              <select
                value={newAssetData.locationId}
                onChange={e => setNewAssetData(prev => ({ ...prev, locationId: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'رأسمالة وإضافة الأصل' : 'Capitalize & Register Fixed Asset'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== TAB 4: DEPRECIATION SCHEDULE & RUN ==================== */}
      {activeTab === 'depreciation' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-600" />
                <span>{isAr ? 'محرك الإهلاك التلقائي والجدولة' : 'Automatic Depreciation Run & Schedule Engine'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Generates depreciation schedules, posts periodic depreciation entries, and publishes DEPRECIATION_POSTED events.
              </p>
            </div>

            <button
              onClick={handleRunMonthlyDepreciation}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{isAr ? 'تشغيل الإهلاك الشهري الآن' : 'Execute Monthly Depreciation Run'}</span>
            </button>
          </div>

          {/* Schedule Table for Selected Asset */}
          {selectedAsset && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Schedule for: <span className="text-purple-600">{selectedAsset.assetNumber} - {selectedAsset.name}</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">{selectedAsset.usefulLifeYears} Years Schedule</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3">Period</th>
                      <th className="p-3">Start - End Date</th>
                      <th className="p-3">Opening Book Value</th>
                      <th className="p-3">Depreciation Amount</th>
                      <th className="p-3">Accumulated Dep.</th>
                      <th className="p-3">Closing Book Value</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {depSchedule.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-mono font-bold">P{s.periodNumber}</td>
                        <td className="p-3 text-slate-500 font-mono">{s.periodStartDate} to {s.periodEndDate}</td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{s.openingBookValue.toLocaleString()} SAR</td>
                        <td className="p-3 font-mono font-bold text-purple-600">{s.depreciationAmount.toLocaleString()} SAR</td>
                        <td className="p-3 font-mono text-amber-600">{s.accumulatedDepreciation.toLocaleString()} SAR</td>
                        <td className="p-3 font-mono font-bold text-emerald-600">{s.closingBookValue.toLocaleString()} SAR</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.status === 'POSTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 5: TRANSFERS ENGINE ==================== */}
      {activeTab === 'transfers' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-fadeIn">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-purple-600" />
                <span>{isAr ? 'محرك تحويلات وتغيير مواقع الأصول' : 'Asset Transfer & Allocation Engine'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Transfers assets across Companies, Branches, Departments, Cost Centers, Locations, and Responsible Employees.
              </p>
            </div>

            <button
              onClick={() => setShowTransferModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إجراء تحويل جديد' : 'New Asset Transfer'}</span>
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Asset Active Allocations & Locations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map(a => (
                <div key={a.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-purple-600">{a.assetNumber}</span>
                    <span className="text-[10px] font-bold text-emerald-600">{a.status}</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">{a.name}</div>
                  <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <div>📍 Location: <span className="font-semibold text-slate-800 dark:text-slate-200">{a.locationName}</span></div>
                    <div>🏢 Dept: <span className="font-semibold text-slate-800 dark:text-slate-200">{a.departmentName}</span></div>
                    <div>👤 Responsible: <span className="font-semibold text-slate-800 dark:text-slate-200">{a.responsibleEmployeeName || 'Unassigned'}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 6: DISPOSALS & REVALUATIONS ==================== */}
      {activeTab === 'disposals_reval' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowDisposalModal(true)}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-500/30 hover:border-rose-500 shadow-sm text-left transition-all cursor-pointer"
            >
              <Trash2 className="w-6 h-6 text-rose-600 mb-2" />
              <div className="font-bold text-sm text-slate-900 dark:text-white">Asset Disposal & Scrap</div>
              <div className="text-xs text-slate-500 mt-1">Sale, Scrap, Loss, Donation, Write-off with Gain/Loss math</div>
            </button>

            <button
              onClick={() => setShowRevalModal(true)}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-500/30 hover:border-blue-500 shadow-sm text-left transition-all cursor-pointer"
            >
              <Sparkles className="w-6 h-6 text-blue-600 mb-2" />
              <div className="font-bold text-sm text-slate-900 dark:text-white">IAS 16 Asset Revaluation</div>
              <div className="text-xs text-slate-500 mt-1">Fair value revaluation, Revaluation Surplus reserve</div>
            </button>

            <button
              onClick={() => setShowImpairmentModal(true)}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/30 hover:border-amber-500 shadow-sm text-left transition-all cursor-pointer"
            >
              <AlertTriangle className="w-6 h-6 text-amber-600 mb-2" />
              <div className="font-bold text-sm text-slate-900 dark:text-white">IAS 36 Asset Impairment</div>
              <div className="text-xs text-slate-500 mt-1">Carrying Amount vs Recoverable Amount & Reversals</div>
            </button>
          </div>
        </div>
      )}

      {/* ==================== TAB 7: MAINTENANCE LOG ==================== */}
      {activeTab === 'maintenance' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-purple-600" />
                <span>{isAr ? 'سجل الصيانة والقطع والتوقف' : 'Asset Maintenance & Downtime History'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track preventive & corrective maintenance, spare parts usage, downtime hours, and vendor service costs.
              </p>
            </div>

            <button
              onClick={() => setShowMaintModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Log Maintenance Event</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-3">Asset</th>
                  <th className="p-3">Type & Date</th>
                  <th className="p-3">Vendor / Performed By</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Downtime</th>
                  <th className="p-3">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {maintenances.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-purple-600">{m.assetNumber}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{m.maintenanceType}</div>
                      <div className="text-[10px] text-slate-400">{m.maintenanceDate}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{m.vendorName || m.performedBy}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{m.description}</td>
                    <td className="p-3 font-mono text-amber-600 font-bold">{m.downtimeHours} Hrs</td>
                    <td className="p-3 font-mono font-black text-slate-900 dark:text-white">{m.cost.toLocaleString()} SAR</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 8: PHYSICAL VERIFICATION ==================== */}
      {activeTab === 'verification' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-purple-600" />
                <span>{isAr ? 'الجرد والتحقق الفعلي بالبار كود' : 'Physical Asset Count & Verification'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                BarCode / QR Code scan readiness, reconciliation of Matched, Missing, Discrepancy, and Found unrecorded assets.
              </p>
            </div>

            {!verificationSession && (
              <button
                onClick={handleStartVerificationSession}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
              >
                <ScanLine className="w-4 h-4" />
                <span>Start Count Session</span>
              </button>
            )}
          </div>

          {verificationSession ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-500/30 flex justify-between items-center">
                <div>
                  <div className="font-mono text-xs font-bold text-purple-600">{verificationSession.sessionNumber}</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">Location: {verificationSession.locationName}</div>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="text-emerald-600">Matched: {verificationSession.matchedCount}</div>
                  <div className="text-amber-600">Discrepancies: {verificationSession.discrepancyCount}</div>
                  <div className="text-slate-600">Scanned Total: {verificationSession.totalAssetsScanned}</div>
                </div>
              </div>

              {/* Barcode Simulator Form */}
              <form onSubmit={handleScanBarcode} className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Barcode className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Scan or enter Barcode e.g. BAR-AST-2026-0001..."
                    value={scanInput}
                    onChange={e => setScanInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono text-xs border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                >
                  Submit Scan
                </button>
              </form>

              {/* Scanned Items Log */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Scanned Session Logs</h4>
                {verificationSession.scans.map(s => (
                  <div key={s.scanId} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{s.scannedBarcode}</span>
                      <span className="text-slate-400 text-[10px] ml-2">{s.scannedAt}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.scanStatus === 'MATCHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {s.scanStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs font-semibold">
              No active count session running. Click "Start Count Session" to initiate physical verification scan.
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 9: REPORTS & AUDIT TRAIL ==================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Roll Forward Summary */}
          {rollForwardReport && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                <span>{isAr ? 'تقرير حركة الأصول الثابتة (Roll-Forward)' : 'Asset Roll-Forward Schedule (IAS 16 Disclosure)'}</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3">Asset Class</th>
                      <th className="p-3">Opening Cost</th>
                      <th className="p-3">Disposals Cost</th>
                      <th className="p-3">Closing Cost</th>
                      <th className="p-3">Closing Dep.</th>
                      <th className="p-3">Closing NBV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rollForwardReport.lines.map((l: any) => (
                      <tr key={l.assetClassId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 font-mono">
                        <td className="p-3 font-sans font-bold">{l.assetClassName}</td>
                        <td className="p-3">{l.openingCost.toLocaleString()} SAR</td>
                        <td className="p-3 text-rose-600">{l.disposalsCost.toLocaleString()} SAR</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{l.closingCost.toLocaleString()} SAR</td>
                        <td className="p-3 text-amber-600">{l.closingAccumDep.toLocaleString()} SAR</td>
                        <td className="p-3 font-bold text-purple-600">{l.closingNBV.toLocaleString()} SAR</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Immutable Audit Trail Log */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
              <span>{isAr ? 'سجل التتبع والمراجعة المشفر SHA-256' : 'Immutable SHA-256 Asset Audit Trail'}</span>
            </h2>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {auditLogs.map(log => (
                <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-600">{log.assetNumber}</span>
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">{log.eventType}</span>
                      <span className="text-slate-400 text-[11px]">{log.timestamp}</span>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 mt-1 font-medium">{log.details}</div>
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                    {log.sha256Hash}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 1: TRANSFER ASSET ==================== */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-purple-600" />
              <span>Execute Asset Transfer</span>
            </h3>

            <form onSubmit={handleTransfer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Select Asset</label>
                <select
                  value={transferForm.assetId}
                  onChange={e => setTransferForm(prev => ({ ...prev, assetId: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.assetNumber} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Transfer Type</label>
                <select
                  value={transferForm.transferType}
                  onChange={e => setTransferForm(prev => ({ ...prev, transferType: e.target.value as TransferType }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                >
                  <option value="LOCATION">LOCATION Transfer</option>
                  <option value="DEPARTMENT">DEPARTMENT Transfer</option>
                  <option value="COST_CENTER">COST_CENTER Transfer</option>
                  <option value="EMPLOYEE">RESPONSIBLE EMPLOYEE Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">New Target Location</label>
                <select
                  value={transferForm.toLocationId}
                  onChange={e => setTransferForm(prev => ({ ...prev, toLocationId: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                >
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Reason for Transfer</label>
                <textarea
                  value={transferForm.reason}
                  onChange={e => setTransferForm(prev => ({ ...prev, reason: e.target.value }))}
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold">Process Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: DISPOSAL ==================== */}
      {showDisposalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900 p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              <span>Asset Disposal & Gain/Loss Settlement</span>
            </h3>

            <form onSubmit={handleDisposal} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Select Asset</label>
                <select
                  value={disposalForm.assetId}
                  onChange={e => setDisposalForm(prev => ({ ...prev, assetId: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.assetNumber} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Disposal Method</label>
                <select
                  value={disposalForm.disposalType}
                  onChange={e => setDisposalForm(prev => ({ ...prev, disposalType: e.target.value as DisposalType }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                >
                  <option value="SALE">SALE (With Proceeds)</option>
                  <option value="SCRAP">SCRAP (Zero Value)</option>
                  <option value="WRITE_OFF">WRITE_OFF (Full Impairment)</option>
                  <option value="DONATION">DONATION</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Proceeds Amount (SAR)</label>
                <input
                  type="number"
                  value={disposalForm.proceedsAmount}
                  onChange={e => setDisposalForm(prev => ({ ...prev, proceedsAmount: Number(e.target.value) }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowDisposalModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold">Confirm Disposal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: REVALUATION (IAS 16) ==================== */}
      {showRevalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900 p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>IAS 16 Asset Revaluation</span>
            </h3>

            <form onSubmit={handleRevaluation} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Select Asset</label>
                <select
                  value={revalForm.assetId}
                  onChange={e => setRevalForm(prev => ({ ...prev, assetId: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.assetNumber} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Appraised Fair Market Value (SAR)</label>
                <input
                  type="number"
                  required
                  value={revalForm.appraisalValue}
                  onChange={e => setRevalForm(prev => ({ ...prev, appraisalValue: Number(e.target.value) }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Valuer Firm Name</label>
                <input
                  type="text"
                  value={revalForm.valuerName}
                  onChange={e => setRevalForm(prev => ({ ...prev, valuerName: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowRevalModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold">Apply Revaluation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 4: IMPAIRMENT (IAS 36) ==================== */}
      {showImpairmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900 p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>IAS 36 Impairment Test & Reversal</span>
            </h3>

            <form onSubmit={handleImpairment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Select Asset</label>
                <select
                  value={impairmentForm.assetId}
                  onChange={e => setImpairmentForm(prev => ({ ...prev, assetId: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.assetNumber} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Recoverable Amount (Max of Value in Use & Fair Value)</label>
                <input
                  type="number"
                  required
                  value={impairmentForm.recoverableAmount}
                  onChange={e => setImpairmentForm(prev => ({ ...prev, recoverableAmount: Number(e.target.value) }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Reason for Impairment</label>
                <textarea
                  value={impairmentForm.reason}
                  onChange={e => setImpairmentForm(prev => ({ ...prev, reason: e.target.value }))}
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowImpairmentModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold">Post Impairment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 5: MAINTENANCE ==================== */}
      {showMaintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-purple-600" />
              <span>Log Maintenance Event</span>
            </h3>

            <form onSubmit={handleMaintenance} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Select Asset</label>
                <select
                  value={maintForm.assetId}
                  onChange={e => setMaintForm(prev => ({ ...prev, assetId: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.assetNumber} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Maintenance Type</label>
                <select
                  value={maintForm.maintenanceType}
                  onChange={e => setMaintForm(prev => ({ ...prev, maintenanceType: e.target.value as MaintenanceType }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                >
                  <option value="PREVENTIVE">PREVENTIVE (Routine Overhaul)</option>
                  <option value="CORRECTIVE">CORRECTIVE (Breakdown Repair)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Maintenance Cost (SAR)</label>
                <input
                  type="number"
                  value={maintForm.cost}
                  onChange={e => setMaintForm(prev => ({ ...prev, cost: Number(e.target.value) }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Downtime Hours</label>
                <input
                  type="number"
                  value={maintForm.downtimeHours}
                  onChange={e => setMaintForm(prev => ({ ...prev, downtimeHours: Number(e.target.value) }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Description / Notes</label>
                <textarea
                  value={maintForm.description}
                  onChange={e => setMaintForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowMaintModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold">Save Maintenance Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
