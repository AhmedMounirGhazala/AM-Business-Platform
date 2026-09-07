/**
 * AM Business Platform - Phase 2.2.5
 * Enterprise Inventory Closing & Inventory Control Center
 * 
 * SAP MM & Oracle SCM Compliant Inventory Control Architecture:
 * 1. Inventory Period Closing Engine (Open, Closing, Closed, Reopened)
 * 2. Fiscal Inventory Lock (Company, Branch, Warehouse)
 * 3. Physical Inventory Cycle (Count Sessions, Count Sheets, Blind Count, Recount, Approval)
 * 4. Inventory Reconciliation Engine (Emits Business Events ONLY)
 * 5. Inventory Health Dashboard (Negative Stock, Dead Stock, Expiry, Utilization)
 * 6. Inventory Integrity Validation (7-Point Automated Verification Suite)
 * 7. Inventory Certification Report (Health Score %, Accuracy %, Completeness %)
 * 8. Immutable Audit Trail Center
 */

import React, { useEffect, useState } from 'react';
import {
  Lock,
  Unlock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  FileCheck,
  History,
  RotateCcw,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Search,
  Zap,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Warehouse,
  Award,
  Check,
  Sparkles,
  Download
} from 'lucide-react';
import { usePlatform } from '../../../context/PlatformContext';
import { ApiClient } from '../../../services/apiClient';
import {
  InventoryPeriod,
  FiscalInventoryLock,
  InventoryCountSession,
  CountSheetItem,
  InventoryReconciliationProposal,
  InventoryHealthMetrics,
  InventoryIntegrityReport,
  InventoryCertificationReport,
  InventoryClosingAuditRecord,
  Warehouse as WarehouseType
} from '../../../types';

export const InventoryClosingControlSubView: React.FC = () => {
  const { lang, activeUser } = usePlatform();
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'periods' | 'locks' | 'counts' | 'reconciliation' | 'health' | 'integrity' | 'certification' | 'audit'>('periods');

  // State collections
  const [periods, setPeriods] = useState<InventoryPeriod[]>([]);
  const [locks, setLocks] = useState<FiscalInventoryLock[]>([]);
  const [sessions, setSessions] = useState<InventoryCountSession[]>([]);
  const [proposals, setProposals] = useState<InventoryReconciliationProposal[]>([]);
  const [health, setHealth] = useState<InventoryHealthMetrics | null>(null);
  const [integrity, setIntegrity] = useState<InventoryIntegrityReport | null>(null);
  const [certification, setCertification] = useState<InventoryCertificationReport | null>(null);
  const [auditLogs, setAuditLogs] = useState<InventoryClosingAuditRecord[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Action States
  const [isNewPeriodModalOpen, setIsNewPeriodModalOpen] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState('SEP-2026');
  const [newPeriodYear, setNewPeriodYear] = useState(2026);
  const [newPeriodNum, setNewPeriodNum] = useState(9);

  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState('');

  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [sessionWarehouseId, setSessionWarehouseId] = useState('wh-001');
  const [sessionTitle, setSessionTitle] = useState('Monthly Cycle Count Session');
  const [isBlindCount, setIsBlindCount] = useState(true);

  const [selectedSession, setSelectedSession] = useState<InventoryCountSession | null>(null);
  const [countSheetModalOpen, setCountSheetModalOpen] = useState(false);
  const [editingPhysicalQty, setEditingPhysicalQty] = useState<Record<string, number>>({});

  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [
        periodsData,
        locksData,
        sessionsData,
        proposalsData,
        healthData,
        integrityData,
        certData,
        auditData,
        whData
      ] = await Promise.all([
        ApiClient.getInventoryPeriods().catch(() => []),
        ApiClient.getFiscalLocks().catch(() => []),
        ApiClient.getCountSessions().catch(() => []),
        ApiClient.getReconciliationProposals().catch(() => []),
        ApiClient.getInventoryHealthMetrics().catch(() => null),
        ApiClient.runInventoryIntegrityCheck().catch(() => null),
        ApiClient.getInventoryCertificationReport().catch(() => null),
        ApiClient.getInventoryClosingAudit().catch(() => []),
        ApiClient.getWarehouses().catch(() => [])
      ]);

      setPeriods(periodsData);
      setLocks(locksData);
      setSessions(sessionsData);
      setProposals(proposalsData);
      setHealth(healthData);
      setIntegrity(integrityData);
      setCertification(certData);
      setAuditLogs(auditData);
      setWarehouses(whData);
    } catch (err) {
      console.error('Failed to load Inventory Closing & Control data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handlers
  const handleCreatePeriod = async () => {
    try {
      await ApiClient.createInventoryPeriod({
        periodName: newPeriodName,
        fiscalYear: newPeriodYear,
        fiscalPeriod: newPeriodNum,
        startDate: new Date(newPeriodYear, newPeriodNum - 1, 1).toISOString(),
        endDate: new Date(newPeriodYear, newPeriodNum, 0).toISOString()
      });
      setIsNewPeriodModalOpen(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to create period');
    }
  };

  const handleClosePeriod = async (periodId: string) => {
    if (!confirm(isAr ? 'هل أنت تأكد من إغلاق الفترة المخزنية؟ لن تتم إمكانية تسجيل أي حركة مخزنية خلال هذه الفترة.' : 'Are you sure you want to CLOSE this inventory period? Transaction posting will be restricted.')) return;
    try {
      await ApiClient.closeInventoryPeriod(periodId, activeUser?.name || 'Ahmed Mounir');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to close period');
    }
  };

  const handleReopenPeriod = async () => {
    if (!selectedPeriodId || !reopenReason) return;
    try {
      await ApiClient.reopenInventoryPeriod(selectedPeriodId, activeUser?.name || 'Ahmed Mounir', reopenReason);
      setIsReopenModalOpen(false);
      setReopenReason('');
      setSelectedPeriodId(null);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to reopen period');
    }
  };

  const handleToggleLock = async (lock: FiscalInventoryLock) => {
    const nextStatus = lock.status === 'Locked' ? 'Unlocked' : 'Locked';
    try {
      await ApiClient.toggleFiscalLock({
        targetLevel: lock.lockLevel,
        targetId: lock.targetId,
        targetName: lock.targetName,
        status: nextStatus,
        userId: activeUser?.name || 'Ahmed Mounir',
        reason: `Fiscal lock changed to ${nextStatus}`
      });
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle fiscal lock');
    }
  };

  const handleCreateCountSession = async () => {
    try {
      await ApiClient.createCountSession({
        warehouseId: sessionWarehouseId,
        title: sessionTitle,
        isBlindCount,
        createdBy: activeUser?.name || 'Ahmed Mounir'
      });
      setIsNewSessionModalOpen(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to create count session');
    }
  };

  const handleOpenCountSheet = (session: InventoryCountSession) => {
    setSelectedSession(session);
    const initialMap: Record<string, number> = {};
    session.items.forEach(i => {
      initialMap[i.id] = i.physicalQuantity !== undefined ? i.physicalQuantity : i.bookQuantity;
    });
    setEditingPhysicalQty(initialMap);
    setCountSheetModalOpen(true);
  };

  const handleSaveCountSheet = async () => {
    if (!selectedSession) return;
    const updatedItems = selectedSession.items.map(i => ({
      ...i,
      physicalQuantity: editingPhysicalQty[i.id] !== undefined ? Number(editingPhysicalQty[i.id]) : i.bookQuantity
    }));
    try {
      await ApiClient.updateCountSessionItems(selectedSession.id, updatedItems, 'VarianceReview');
      setCountSheetModalOpen(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update count sheet');
    }
  };

  const handleApproveCountSession = async (sessionId: string) => {
    if (!confirm(isAr ? 'هل تريد اعتماد نتيجة الجرد والتوصية بالتسويات المخزنية؟' : 'Approve count session and generate reconciliation proposals?')) return;
    try {
      await ApiClient.approveCountSession(sessionId, activeUser?.name || 'Ahmed Mounir');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve count session');
    }
  };

  const handlePostReconciliationProposal = async (proposalId: string) => {
    try {
      await ApiClient.postReconciliationProposal(proposalId, activeUser?.name || 'Ahmed Mounir');
      loadAllData();
      alert(isAr ? 'تم إرسال حدث التسوية إلى طابور التكامل المالي بنجاح!' : 'Reconciliation event queued in Financial Integration Engine successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to post reconciliation proposal');
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <span>{isAr ? 'محرك الإغلاق والرقابة المخزنية - المرحلة 2.2.5' : 'Inventory Closing & Inventory Control Engine - Phase 2.2.5'}</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              SAP MM & Oracle SCM Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAr ? 'إغلاق الفترات، أقفال المستودعات، الجرد الفعلي، مطابقة الفروقات، تشخيص النزاهة وتقرير التوثيق' : 'Configurable Periods, Fiscal Locks, Physical Counting, Variance Reconciliation, 7-Point Integrity Validation & Certification'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isAr ? 'تحديث البيانات' : 'Refresh Engine'}</span>
          </button>

          <button
            onClick={() => setIsCertModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>{isAr ? 'تقرير الاعتماد والتوثيق' : 'Inventory Certification'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
        {[
          { id: 'periods', labelAr: 'فترات الجرد الإغلاق', labelEn: 'Period Closing', icon: Calendar },
          { id: 'locks', labelAr: 'الأقفال المخزنية', labelEn: 'Fiscal Locks', icon: Lock },
          { id: 'counts', labelAr: 'الجرد الفعلي', labelEn: 'Physical Cycle Count', icon: ClipboardList },
          { id: 'reconciliation', labelAr: 'مطابقة الفروقات', labelEn: 'Reconciliation Engine', icon: Zap },
          { id: 'health', labelAr: 'مؤشرات سلامة المخزون', labelEn: 'Inventory Health', icon: BarChart3 },
          { id: 'integrity', labelAr: 'تشخيص النزاهة 7-Points', labelEn: 'Integrity Validation', icon: FileCheck },
          { id: 'certification', labelAr: 'شهادة جودة المخزون', labelEn: 'Certification Report', icon: Award },
          { id: 'audit', labelAr: 'سجل التغييرات الموثق', labelEn: 'Audit Center', icon: History }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: INVENTORY PERIOD CLOSING ENGINE */}
      {activeTab === 'periods' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>{isAr ? 'فترات الجرد والمحاسبة المخزنية' : 'Configurable Inventory Periods'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'عند إغلاق الفترة المخزنية يتم منع كافة حركات الصرف والإضافة تلقائياً لحماية التقييم' : 'Closing inventory periods prevents all stock postings unless explicit override rights exist.'}
              </p>
            </div>

            <button
              onClick={() => setIsNewPeriodModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إنشاء فترة مخزنية جديدة' : 'New Inventory Period'}</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3.5">{isAr ? 'اسم الفترة' : 'Period Name'}</th>
                  <th className="p-3.5">{isAr ? 'السنة المالية' : 'Fiscal Year'}</th>
                  <th className="p-3.5">{isAr ? 'تاريخ البداية' : 'Start Date'}</th>
                  <th className="p-3.5">{isAr ? 'تاريخ النهاية' : 'End Date'}</th>
                  <th className="p-3.5">{isAr ? 'حالة الفترة' : 'Status'}</th>
                  <th className="p-3.5">{isAr ? 'المستخدم المعتمد' : 'Closed/Reopened By'}</th>
                  <th className="p-3.5 text-right">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {periods.map(period => (
                  <tr key={period.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{period.periodName}</span>
                      {period.status === 'Open' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      FY{period.fiscalYear} - P{period.fiscalPeriod}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {new Date(period.startDate).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {new Date(period.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        period.status === 'Open'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : period.status === 'Closed'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}>
                        {period.status === 'Open' && <CheckCircle className="w-3 h-3" />}
                        {period.status === 'Closed' && <Lock className="w-3 h-3" />}
                        {period.status === 'Reopened' && <RotateCcw className="w-3 h-3" />}
                        <span>{period.status}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {period.closedBy || period.reopenedBy || 'System Admin'}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {period.status === 'Open' ? (
                        <button
                          onClick={() => handleClosePeriod(period.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition shadow-xs"
                        >
                          {isAr ? 'إغلاق الفترة' : 'Close Period'}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedPeriodId(period.id);
                            setIsReopenModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer transition shadow-xs"
                        >
                          {isAr ? 'إعادة فتح الفترة' : 'Reopen Period'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FISCAL INVENTORY LOCKS */}
      {activeTab === 'locks' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              <span>{isAr ? 'الأقفال المخزنية المستقلة (Fiscal Locks)' : 'Fiscal Inventory Locks'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'قفل اختياري على مستوى الشركة أو الفرع أو المستودع لإجراء عمليات الجرد السنوية' : 'Lock individual warehouses or branches independently during audit or physical cycle counts.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locks.map(lock => (
              <div
                key={lock.id}
                className={`p-5 rounded-2xl border transition shadow-xs flex flex-col justify-between space-y-4 ${
                  lock.status === 'Locked'
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {lock.lockLevel} Level
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {lock.targetName}
                    </h3>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                    lock.status === 'Locked'
                      ? 'bg-rose-600 text-white'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    {lock.status === 'Locked' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    <span>{lock.status}</span>
                  </span>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <p><span className="font-semibold text-slate-700 dark:text-slate-300">{isAr ? 'السبب:' : 'Reason:'}</span> {lock.lockReason || 'N/A'}</p>
                  {lock.lockedBy && <p><span className="font-semibold text-slate-700 dark:text-slate-300">{isAr ? 'بواسطة:' : 'By:'}</span> {lock.lockedBy}</p>}
                </div>

                <button
                  onClick={() => handleToggleLock(lock)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    lock.status === 'Locked'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  {lock.status === 'Locked' ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إلغاء القفل (Unlock)' : 'Unlock Warehouse'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تفعيل القفل (Lock)' : 'Lock Warehouse'}</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PHYSICAL INVENTORY CYCLE */}
      {activeTab === 'counts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>{isAr ? 'دورة الجرد الفعلي وتقارير العد' : 'Physical Inventory Cycle & Count Sessions'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'جلسات العد الفعلي، الجرد الأعمى (Blind Count)، وإعادة العد والحساب عند وجود فروقات' : 'Manage physical count sheets, blind counting mode, recount triggers, and final approvals.'}
              </p>
            </div>

            <button
              onClick={() => setIsNewSessionModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إنشاء جلسة جرد جديدة' : 'New Count Session'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map(s => (
              <div key={s.id} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {s.sessionNumber}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {s.title}
                    </h3>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                    s.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : s.status === 'VarianceReview'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                  }`}>
                    {s.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>{isAr ? 'المستودع:' : 'Warehouse:'}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{s.warehouseName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isAr ? 'نمط الجرد:' : 'Count Mode:'}</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {s.isBlindCount ? (isAr ? 'أعمى (Blind)' : 'Blind Count') : (isAr ? 'قياسي' : 'Standard')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isAr ? 'القيمة الدفترية:' : 'Book Value:'}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{s.totalBookValue.toLocaleString()} SAR</span>
                  </div>
                  {s.totalVarianceValue !== 0 && (
                    <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold">
                      <span>{isAr ? 'قيمة الفروقات:' : 'Variance Value:'}</span>
                      <span>{s.totalVarianceValue.toLocaleString()} SAR</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenCountSheet(s)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isAr ? 'فتح كشف الجرد' : 'View Count Sheet'}</span>
                  </button>

                  {s.status !== 'Approved' && (
                    <button
                      onClick={() => handleApproveCountSession(s.id)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isAr ? 'اعتماد' : 'Approve'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: INVENTORY RECONCILIATION ENGINE */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>{isAr ? 'محرك تسوية الفروقات المخزنية' : 'Inventory Reconciliation Engine'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'توليد توصيات العجز والزيادة وإرسال فعاليات الأعمال فقط إلى طابور التكامل المالي (دون إنشاء قيد مباشر)' : 'Generates Gain/Loss proposals and emits Business Events ONLY (EVT_ADJUSTMENT_PLUS, EVT_ADJUSTMENT_MINUS).'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3.5">{isAr ? 'الصنف SKU' : 'Item SKU'}</th>
                  <th className="p-3.5">{isAr ? 'اسم الصنف' : 'Item Name'}</th>
                  <th className="p-3.5">{isAr ? 'الكمية الدفترية' : 'Book Qty'}</th>
                  <th className="p-3.5">{isAr ? 'الكمية الفعلية' : 'Physical Qty'}</th>
                  <th className="p-3.5">{isAr ? 'الفروقات (الفرق)' : 'Variance Qty'}</th>
                  <th className="p-3.5">{isAr ? 'نوع التسوية' : 'Adjustment Type'}</th>
                  <th className="p-3.5">{isAr ? 'الفعالية المخزنية' : 'Business Event'}</th>
                  <th className="p-3.5">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="p-3.5 text-right">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {proposals.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">{p.itemSku}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">{p.itemName}</td>
                    <td className="p-3.5 text-slate-900 dark:text-white">{p.bookQuantity}</td>
                    <td className="p-3.5 text-slate-900 dark:text-white">{p.physicalQuantity}</td>
                    <td className={`p-3.5 font-bold ${p.varianceQuantity < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {p.varianceQuantity > 0 ? `+${p.varianceQuantity}` : p.varianceQuantity}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded font-extrabold ${
                        p.type === 'Gain'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                      {p.proposedEventType}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        p.status === 'Posted'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {p.status === 'Pending' ? (
                        <button
                          onClick={() => handlePostReconciliationProposal(p.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition shadow-xs flex items-center gap-1 ml-auto"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>{isAr ? 'ترحيل الفعالية للطابور' : 'Post Business Event'}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs italic">{isAr ? 'مرحّل للطابور' : 'Event Queued'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: INVENTORY HEALTH DASHBOARD */}
      {activeTab === 'health' && health && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>{isAr ? 'لوحة قيادة وصحة المخزون' : 'Inventory Health Dashboard'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'مؤشرات حركة المخزون، الراكد، الميت، المخزون السلبي، أخطار انتهاء الصلاحية ونسبة استغلال المستودعات' : 'Real-time inventory intelligence covering dead stock, slow moving items, near-expiry alerts, and warehouse utilization.'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">{isAr ? 'المخزون السلبي' : 'Negative Stock'}</span>
              <div className="text-xl font-extrabold text-rose-600 mt-1">{health.negativeStockCount}</div>
              <span className="text-[10px] text-slate-400">{health.negativeStockValue.toLocaleString()} SAR</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">{isAr ? 'المخزون الميت (>90d)' : 'Dead Stock (>90d)'}</span>
              <div className="text-xl font-extrabold text-amber-600 mt-1">{health.deadStockCount}</div>
              <span className="text-[10px] text-slate-400">{health.deadStockValue.toLocaleString()} SAR</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">{isAr ? 'قريب الصلاحية' : 'Near Expiry (<30d)'}</span>
              <div className="text-xl font-extrabold text-amber-500 mt-1">{health.nearExpiryCount}</div>
              <span className="text-[10px] text-slate-400">{isAr ? 'تشغيلة محددة' : 'Batches tracked'}</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">{isAr ? 'القيمة الكلية للمخزون' : 'Total Valuation'}</span>
              <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                {(health.totalInventoryValue / 1000000).toFixed(2)}M SAR
              </div>
              <span className="text-[10px] text-slate-400">{isAr ? 'تقييم شامل' : 'All Warehouses'}</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">{isAr ? 'استغلال المستودعات' : 'Utilization %'}</span>
              <div className="text-xl font-extrabold text-emerald-600 mt-1">{health.warehouseUtilizationPercent}%</div>
              <span className="text-[10px] text-slate-400">{isAr ? 'سعة الأرفف والمواقع' : 'Occupied Bins'}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: INVENTORY INTEGRITY VALIDATION (7-POINT SUITE) */}
      {activeTab === 'integrity' && integrity && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>{isAr ? 'فحص نزاهة وصحة البيانات (7-Point Integrity Check)' : '7-Point Inventory Integrity Validation Suite'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'التحقق التلقائي من عدم وجود quants يتيمة، تسلسل FIFO، تكرار السيريال أو الدفعات وفروقات التقييم' : 'Automated checks for orphan quants, negative stock, broken FIFO layers, serial/batch duplicates, and valuation mismatches.'}
              </p>
            </div>

            <button
              onClick={async () => {
                const rep = await ApiClient.runInventoryIntegrityCheck();
                setIntegrity(rep);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة الفحص الآن' : 'Run Integrity Scan'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrity.results.map((check, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition shadow-xs space-y-3 ${
                  check.passed
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {check.passed ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{check.checkName}</h3>
                      <span className="text-[10px] font-semibold text-slate-400">{check.category}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                    check.passed
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {check.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">{check.message}</p>

                {check.details.length > 0 && (
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] font-mono text-slate-700 dark:text-slate-300 space-y-1 max-h-24 overflow-y-auto">
                    {check.details.map((d, i) => (
                      <div key={i}>• {d}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: INVENTORY CERTIFICATION REPORT */}
      {activeTab === 'certification' && certification && (
        <div className="space-y-6">
          <div className="p-6 bg-[#0B1F3A] text-white rounded-2xl border border-[#153258] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#153258] pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-[#F28C28]" />
                  <h2 className="text-lg font-bold">{isAr ? 'تقرير توثيق واعتماد جاهزية المخزون' : 'Inventory Certification & Closing Readiness Report'}</h2>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {certification.companyName} — Period {certification.periodName}
                </p>
              </div>

              <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wide uppercase shadow-md ${
                certification.overallStatus === 'CERTIFIED'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}>
                {certification.overallStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <span className="text-xs font-semibold text-indigo-300">{isAr ? 'درجة صحة المخزون' : 'Health Score'}</span>
                <div className="text-3xl font-extrabold text-amber-400">{certification.inventoryHealthScore}%</div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <span className="text-xs font-semibold text-indigo-300">{isAr ? 'دقة الجرد الفعلي' : 'Inventory Accuracy'}</span>
                <div className="text-3xl font-extrabold text-emerald-400">{certification.inventoryAccuracyPercent}%</div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <span className="text-xs font-semibold text-indigo-300">{isAr ? 'معدل اكتمال التوثيق' : 'Completeness'}</span>
                <div className="text-3xl font-extrabold text-indigo-400">{certification.inventoryCompletenessPercent}%</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">{isAr ? 'التوصيات والمشترطات قبل الإغلاق النهائي:' : 'System Recommendations:'}</h3>
              <ul className="space-y-2 text-xs">
                {certification.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: AUDIT CENTER */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>{isAr ? 'سجل الرقابة والتغييرات الموثق (Immutable Audit Log)' : 'Immutable Control Audit Center'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'سجل توثيق شامل لا يقبل التعديل لإغلاق الفترات، تغيير الأقفال، اعتمادات الجرد والتسويات' : 'Tamper-proof audit history recording period closes, reopenings, lock changes, and approvals.'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3.5">{isAr ? 'التاريخ والوقت' : 'Timestamp'}</th>
                  <th className="p-3.5">{isAr ? 'نوع الإجراء' : 'Action Type'}</th>
                  <th className="p-3.5">{isAr ? 'المستخدم' : 'User'}</th>
                  <th className="p-3.5">{isAr ? 'تفاصيل الإجراء' : 'Audit Details'}</th>
                  <th className="p-3.5 font-mono">{isAr ? 'التوقيع الرقمي' : 'Hash Signature'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {new Date(log.performedAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                      {log.actionType}
                    </td>
                    <td className="p-3.5 text-slate-900 dark:text-white">{log.performedBy}</td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">{log.details}</td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-400">{log.hash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: NEW PERIOD */}
      {isNewPeriodModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{isAr ? 'إنشاء فترة مخزنية جديدة' : 'Create New Inventory Period'}</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold">{isAr ? 'اسم الفترة' : 'Period Name'}</label>
                <input
                  type="text"
                  value={newPeriodName}
                  onChange={e => setNewPeriodName(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold">{isAr ? 'السنة المالية' : 'Fiscal Year'}</label>
                  <input
                    type="number"
                    value={newPeriodYear}
                    onChange={e => setNewPeriodYear(Number(e.target.value))}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold">{isAr ? 'رقم الفترة (1-12)' : 'Fiscal Period'}</label>
                  <input
                    type="number"
                    value={newPeriodNum}
                    onChange={e => setNewPeriodNum(Number(e.target.value))}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsNewPeriodModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800">Cancel</button>
              <button onClick={handleCreatePeriod} className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white">Save Period</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REOPEN PERIOD REASON */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{isAr ? 'إعادة فتح فترة جرد مغلقة' : 'Reopen Closed Period'}</h3>
            <p className="text-xs text-slate-500">{isAr ? 'يتطلب إعادة فتح الفترة تبريراً رقابياً موثقاً في سجل التغييرات' : 'Requires official audit justification reason.'}</p>
            <textarea
              value={reopenReason}
              onChange={e => setReopenReason(e.target.value)}
              placeholder="Enter audit justification..."
              rows={3}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsReopenModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800">Cancel</button>
              <button onClick={handleReopenPeriod} className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white">Reopen Period</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: NEW COUNT SESSION */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{isAr ? 'إنشاء جلسة جرد فعلي جديدة' : 'New Physical Count Session'}</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold">{isAr ? 'عنوان الجلسة' : 'Session Title'}</label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={e => setSessionTitle(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="font-semibold">{isAr ? 'المستودع المستهدف' : 'Target Warehouse'}</label>
                <select
                  value={sessionWarehouseId}
                  onChange={e => setSessionWarehouseId(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-semibold pt-2">
                <input
                  type="checkbox"
                  checked={isBlindCount}
                  onChange={e => setIsBlindCount(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>{isAr ? 'تفعيل الجرد الأعمى (إخفاء الكميات الدفترية أثناء العد)' : 'Enable Blind Count (Hide book quantities during counting)'}</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsNewSessionModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800">Cancel</button>
              <button onClick={handleCreateCountSession} className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white">Create Session</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: COUNT SHEET VIEWER & EDITOR */}
      {countSheetModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedSession.title} ({selectedSession.sessionNumber})</h3>
                <span className="text-xs text-slate-500">{selectedSession.warehouseName}</span>
              </div>
              <button onClick={() => setCountSheetModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3">{isAr ? 'الصنف SKU' : 'Item SKU'}</th>
                  <th className="p-3">{isAr ? 'اسم الصنف' : 'Item Name'}</th>
                  {!selectedSession.isBlindCount && <th className="p-3">{isAr ? 'الكمية الدفترية' : 'Book Qty'}</th>}
                  <th className="p-3">{isAr ? 'الكمية الفعالية' : 'Physical Qty'}</th>
                  <th className="p-3">{isAr ? 'تكلفة الوحدة' : 'Unit Cost'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {selectedSession.items.map(item => (
                  <tr key={item.id}>
                    <td className="p-3 font-bold">{item.itemSku}</td>
                    <td className="p-3">{item.itemName}</td>
                    {!selectedSession.isBlindCount && <td className="p-3 font-bold">{item.bookQuantity}</td>}
                    <td className="p-3">
                      <input
                        type="number"
                        value={editingPhysicalQty[item.id] !== undefined ? editingPhysicalQty[item.id] : item.bookQuantity}
                        onChange={e => setEditingPhysicalQty({ ...editingPhysicalQty, [item.id]: Number(e.target.value) })}
                        className="w-24 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-indigo-600"
                      />
                    </td>
                    <td className="p-3">{item.unitCost} SAR</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => setCountSheetModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800">Cancel</button>
              <button onClick={handleSaveCountSheet} className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white">Save Count Sheet</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
