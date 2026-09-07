import React, { useState, useEffect } from 'react';
import {
  InventoryBusinessEventType,
  FinancialEventType,
  PostingProfile,
  JournalTemplate,
  InventoryFinancialQueueItem,
  InventoryFinancialEventMapRule,
  InventoryFinancialAuditRecord,
  InventoryItem
} from '../../../types';
import { ApiClient } from '../../../services/apiClient';
import {
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  Settings,
  FileCode,
  ShieldCheck,
  History,
  Send,
  ArrowRight,
  Filter,
  Eye,
  PlusCircle,
  Activity,
  ChevronRight,
  Zap
} from 'lucide-react';

interface Props {
  isAr: boolean;
  canEdit: boolean;
  items: InventoryItem[];
  onRefresh?: () => void;
}

export const InventoryFinancialIntegrationSubView: React.FC<Props> = ({
  isAr,
  canEdit,
  items,
  onRefresh
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'mapping' | 'profiles' | 'templates' | 'audit'>('queue');
  const [loading, setLoading] = useState(false);
  const [queueItems, setQueueItems] = useState<InventoryFinancialQueueItem[]>([]);
  const [mappingRules, setMappingRules] = useState<InventoryFinancialEventMapRule[]>([]);
  const [postingProfiles, setPostingProfiles] = useState<PostingProfile[]>([]);
  const [journalTemplates, setJournalTemplates] = useState<JournalTemplate[]>([]);
  const [auditRecords, setAuditRecords] = useState<InventoryFinancialAuditRecord[]>([]);

  // Selected item modal / drawer
  const [selectedQueueItem, setSelectedQueueItem] = useState<InventoryFinancialQueueItem | null>(null);

  // Simulator Form State
  const [simSku, setSimSku] = useState<string>(items[0]?.sku || 'HW-SRV-01');
  const [simQty, setSimQty] = useState<number>(5);
  const [simUnitCost, setSimUnitCost] = useState<number>(1500);
  const [simBusinessEvent, setSimBusinessEvent] = useState<InventoryBusinessEventType>('EVT_GOODS_RECEIPT');
  const [simDocNum, setSimDocNum] = useState<string>(`GRN-SIM-${Date.now().toString().slice(-4)}`);
  const [simFeedback, setSimFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [queueRes, eventsRes, profilesRes, templatesRes, historyRes] = await Promise.all([
        ApiClient.getFinancialQueue(),
        ApiClient.getFinancialIntegrationEvents(),
        ApiClient.getPostingProfiles(),
        ApiClient.getJournalTemplates(),
        ApiClient.getFinancialIntegrationHistory()
      ]);

      setQueueItems(queueRes || []);
      if (eventsRes?.mappingRules) setMappingRules(eventsRes.mappingRules);
      setPostingProfiles(profilesRes || []);
      setJournalTemplates(templatesRes || []);
      if (historyRes?.auditRecords) setAuditRecords(historyRes.auditRecords);
    } catch (err) {
      console.error('Failed to load financial integration data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRetry = async (queueItemId: string) => {
    try {
      setLoading(true);
      const res = await ApiClient.retryFinancialQueueItem(queueItemId);
      if (res.success) {
        setSimFeedback({ type: 'success', message: isAr ? 'تم إعادة الترحيل بنجاح إلى شجرة الحسابات!' : 'Event successfully posted to General Ledger!' });
      } else {
        setSimFeedback({ type: 'error', message: res.error || 'Retry failed' });
      }
      await loadData();
    } catch (err: any) {
      setSimFeedback({ type: 'error', message: err.message || 'Retry failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimFeedback(null);
    setLoading(true);

    const totalCost = simQty * simUnitCost;
    const selectedItem = items.find(i => i.sku === simSku);

    try {
      const res = await ApiClient.processFinancialIntegrationEvent({
        eventId: `fev-sim-${Date.now()}`,
        tenantId: 'ten-001',
        companyId: 'comp-001',
        branchId: 'br-001',
        warehouseId: 'wh-001',
        itemId: selectedItem?.id || 'item-01',
        itemSku: simSku,
        quantity: simQty,
        unitCost: simUnitCost,
        totalCost,
        currency: 'SAR',
        businessEvent: simBusinessEvent,
        financialEventType: 'GOODS_RECEIPT', // Will be remapped by engine
        sourceDocumentType: simBusinessEvent === 'EVT_GOODS_RECEIPT' ? 'GoodsReceiptNote' : 'GoodsIssueNote',
        sourceDocumentId: `doc-sim-${Date.now()}`,
        sourceDocumentNumber: simDocNum,
        createdBy: 'usr-001',
        createdAt: new Date().toISOString(),
        auditMetadata: { simulatorRun: true }
      });

      if (res.validation?.isValid) {
        setSimFeedback({
          type: 'success',
          message: isAr
            ? `تم إصدار حدث الأعمال [${simBusinessEvent}] بنجاح، وربطه بملف الترحيل وقيد اليومية ${res.queueItem?.journalEntryId || 'المعالج'}`
            : `Business Event [${simBusinessEvent}] emitted and processed into Financial Event Queue successfully!`
        });
        setSimDocNum(`SIM-DOC-${Math.floor(1000 + Math.random() * 9000)}`);
      } else {
        setSimFeedback({
          type: 'error',
          message: res.validation?.errors?.map((e: any) => e.message).join(' | ') || 'Validation error'
        });
      }

      await loadData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setSimFeedback({ type: 'error', message: err.message || 'Simulation execution failed' });
    } finally {
      setLoading(false);
    }
  };

  const completedCount = queueItems.filter(i => i.status === 'Completed').length;
  const pendingCount = queueItems.filter(i => i.status === 'Pending' || i.status === 'Processing').length;
  const failedCount = queueItems.filter(i => i.status === 'Failed').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0B1F3A] text-white rounded-2xl p-6 shadow-sm border border-[#153258]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#153258] text-[#F28C28] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#F28C28]/30">
                Phase 2.2.4 Active
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                {isAr ? 'معيار الحسابات المزدوجة (IFRS Ready)' : 'Pure Event-Driven ERP'}
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {isAr ? 'مركز التكامل المالي للمخزون (Inventory Financial Integration Center)' : 'Inventory Financial Integration Center'}
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              {isAr
                ? 'تحويل أحداث الأعمال المخزنية المستقلة إلى أحداث مالية وقيود محاسبية عبر محرك ملفات الترحيل وقوالب اليومية المشفرة بدقة'
                : 'Maps operational inventory events into financial events, posting profiles, and balanced journal entries via an asynchronous event queue.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'تحديث البيانات' : 'Refresh Queue'}</span>
            </button>
          </div>
        </div>

        {/* Operational Isolation Guarantee Statement */}
        <div className="mt-4 pt-4 border-t border-indigo-800/50 text-xs text-indigo-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {isAr
              ? 'ضمان المعيار المؤسسي: قسم المخزون تشغيلي خالص ولا يضيف أو ينشئ قيود محاسبية مباشرة في العامة بل يرسل أحداث أعمال (Business Events) فقط.'
              : 'Strict Enterprise Isolation: Inventory domain is purely operational and NEVER posts directly to GL. It emits Business Events processed exclusively by the Financial Event Engine.'}
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-[#101010] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'إجمالي أحداث الانتظار' : 'Total Queue Items'}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {queueItems.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'تم المرحل والمرحل التلقائي' : 'Completed & Posted'}
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {completedCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'قيد المعالجة والانتظار' : 'Pending & Processing'}
            </p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {pendingCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'الأحداث المتعثرة / تتطلب إجراء' : 'Failed / Requires Action'}
            </p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {failedCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
            activeSubTab === 'queue'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{isAr ? 'طابور المعالجة المالية (Queue & Monitor)' : 'Queue & Event Monitor'}</span>
          <span className="ml-1 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{queueItems.length}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('mapping')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
            activeSubTab === 'mapping'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>{isAr ? 'محرك ربط الأحداث (Event Mapping)' : 'Event Mapping Rules'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('profiles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
            activeSubTab === 'profiles'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{isAr ? 'ملفات الترحيل (Posting Profiles)' : 'Posting Profiles'}</span>
          <span className="ml-1 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{postingProfiles.length}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('templates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
            activeSubTab === 'templates'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>{isAr ? 'قوالب اليومية (Journal Templates)' : 'Journal Templates'}</span>
          <span className="ml-1 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{journalTemplates.length}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
            activeSubTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{isAr ? 'سجل التدقيق وقواعد التحقق' : 'Validation & Audit Log'}</span>
        </button>
      </div>

      {/* SUB-TAB 1: QUEUE & EVENT MONITOR */}
      {activeSubTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Queue Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {isAr ? 'طابور الأحداث المالية المترتبة' : 'Financial Event Queue Streams'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'قائمة الأحداث المنبثقة من عمليات حركة المخزون وجاهزيتها للترحيل' : 'Live stream of business events awaiting or finished GL posting.'}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right dir-rtl">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs uppercase border-y border-slate-200 dark:border-slate-800">
                      <th className="py-3 px-3 text-left dir-ltr">Queue ID / Document</th>
                      <th className="py-3 px-3">Business Event</th>
                      <th className="py-3 px-3">SKU & Value</th>
                      <th className="py-3 px-3">Posting Behavior</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {queueItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          {isAr ? 'لا توجد أحداث في طابور المعالجة حالياً' : 'No events in processing queue.'}
                        </td>
                      </tr>
                    ) : (
                      queueItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 text-left dir-ltr">
                            <div className="font-semibold text-indigo-600 dark:text-indigo-400">{item.id}</div>
                            <div className="text-xs text-slate-500">{item.payload.sourceDocumentNumber}</div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md">
                              {item.payload.businessEvent}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-medium text-slate-900 dark:text-white">{item.payload.itemSku}</div>
                            <div className="text-xs text-slate-500">
                              {item.payload.quantity} units @ {item.payload.totalCost.toLocaleString()} {item.payload.currency}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400">
                            {item.postingProfile?.postingBehavior || 'AUTO_POST'}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                item.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : item.status === 'Pending' || item.status === 'Processing' || item.status === 'Retry'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : item.status === 'DeadLetter'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {item.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                              {(item.status === 'Pending' || item.status === 'Processing' || item.status === 'Retry') && <Clock className="w-3 h-3" />}
                              {(item.status === 'Failed' || item.status === 'DeadLetter') && <AlertTriangle className="w-3 h-3" />}
                              <span>{item.status}</span>
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {item.status === 'Failed' && (
                                <button
                                  onClick={() => handleRetry(item.id)}
                                  disabled={loading}
                                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedQueueItem(item)}
                                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                                title="View Audit Trail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Interactive Event Simulator */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Play className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {isAr ? 'محاكي إصدار أحداث المخزون' : 'Event Integration Simulator'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {isAr
                  ? 'قم بإصدار حدث حركة مخزنية واختبر المسار التلقائي للتحقق والترحيل بالطابور'
                  : 'Emit a test inventory event to watch payload validation, posting profile resolution, and GL posting.'}
              </p>

              {simFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs mb-4 flex items-start gap-2 ${
                    simFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {simFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{simFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleRunSimulation} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'نوع حدث الأعمال (Business Event)' : 'Business Event Type'}
                  </label>
                  <select
                    value={simBusinessEvent}
                    onChange={(e) => setSimBusinessEvent(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="EVT_GOODS_RECEIPT">EVT_GOODS_RECEIPT (Goods Receipt GRN)</option>
                    <option value="EVT_GOODS_ISSUE">EVT_GOODS_ISSUE (Goods Issue GIN)</option>
                    <option value="EVT_ADJUSTMENT_PLUS">EVT_ADJUSTMENT_PLUS (Stock Take +)</option>
                    <option value="EVT_ADJUSTMENT_MINUS">EVT_ADJUSTMENT_MINUS (Stock Take -)</option>
                    <option value="EVT_OPENING_STOCK">EVT_OPENING_STOCK (Opening Balance)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الصنف المستهدف (Item SKU)' : 'Target Item SKU'}
                  </label>
                  <select
                    value={simSku}
                    onChange={(e) => setSimSku(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {items.map(i => (
                      <option key={i.id} value={i.sku}>
                        {i.sku} - {i.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'الكمية' : 'Quantity'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={simQty}
                      onChange={(e) => setSimQty(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'تكلفة الوحدة (SAR)' : 'Unit Cost (SAR)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={simUnitCost}
                      onChange={(e) => setSimUnitCost(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'رقم وثيقة الإسناد' : 'Source Reference Doc'}
                  </label>
                  <input
                    type="text"
                    value={simDocNum}
                    onChange={(e) => setSimDocNum(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isAr ? 'إصدار حدث المخزون وحساب الأثر' : 'Emit Event & Process Integration'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: EVENT MAPPING RULES */}
      {activeSubTab === 'mapping' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {isAr ? 'قواعد ربط أحداث المخزون بالأحداث المالية' : 'Inventory Event Mapping Registry'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'قواعد معالجة ديناميكية لتحويل أحداث الحركة إلى أحداث محاسبية معتمدة' : 'Configuration-driven mappings from Business Events to Financial Event Types.'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right dir-rtl">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs uppercase border-y border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-3 text-left dir-ltr">Rule ID</th>
                  <th className="py-3 px-3">Business Event Type</th>
                  <th className="py-3 px-3">Mapped Financial Event</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {mappingRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 text-left dir-ltr font-mono text-xs text-indigo-600 dark:text-indigo-400">
                      {rule.id}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">
                        {rule.businessEventType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded text-xs font-semibold">
                        {rule.financialEventType}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400">
                      {isAr ? rule.descriptionAr : rule.description}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full text-xs font-medium">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: POSTING PROFILES */}
      {activeSubTab === 'profiles' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {isAr ? 'ملفات الترحيل المعتمدة (Posting Profiles)' : 'Configurable Posting Profiles'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'تحدد الشركة والفرع وقالب اليومية وسلوك الترحيل التلقائي' : 'Controls company, branch, inventory category, template routing, and auto-posting behavior.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {postingProfiles.map((profile) => (
              <div key={profile.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">{profile.code}</span>
                  <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                    {profile.postingBehavior}
                  </span>
                </div>

                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                  {isAr ? profile.nameAr : profile.name}
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="text-slate-400">{isAr ? 'الشركة: ' : 'Company: '}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{profile.companyId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">{isAr ? 'الفرع: ' : 'Branch: '}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{profile.branchId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">{isAr ? 'حدث الأعمال: ' : 'Business Event: '}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{profile.businessEventType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">{isAr ? 'قالب اليومية: ' : 'Template ID: '}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{profile.journalTemplateId}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: JOURNAL TEMPLATES */}
      {activeSubTab === 'templates' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {isAr ? 'سجل قوالب قيود اليومية (Journal Template Registry)' : 'Journal Template Registry'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'نماذج الحسابات المدينة والدائنة لتقييم وفروقات وإعدام المخزون' : 'Configurable journal entry line templates for inventory receipts, adjustments, write-offs, and transfers.'}
            </p>
          </div>

          <div className="space-y-4">
            {journalTemplates.map((tmpl) => (
              <div key={tmpl.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">{tmpl.code}</span>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                      {isAr ? tmpl.nameAr : tmpl.name}
                    </h4>
                  </div>
                  <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs px-2.5 py-0.5 rounded-full">
                    {tmpl.category}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right dir-rtl">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-y border-slate-200 dark:border-slate-800">
                        <th className="py-2 px-2 text-center">#</th>
                        <th className="py-2 px-2">Account Role</th>
                        <th className="py-2 px-2 text-center">Default Code</th>
                        <th className="py-2 px-2 text-center">Side</th>
                        <th className="py-2 px-2">Pattern Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {tmpl.lines.map((line) => (
                        <tr key={line.id}>
                          <td className="py-2 px-2 text-center font-mono">{line.lineNo}</td>
                          <td className="py-2 px-2 font-medium text-slate-900 dark:text-white">{line.accountType}</td>
                          <td className="py-2 px-2 text-center font-mono text-indigo-600 dark:text-indigo-400">{line.accountCodeDefault}</td>
                          <td className="py-2 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${line.side === 'DEBIT' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                              {line.side}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-slate-500">{line.descriptionPattern}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: VALIDATION & AUDIT LOG */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          {/* Validation Matrix */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {isAr ? 'مصفوفة قواعد التحقق قبل الترحيل' : 'Pre-Posting Validation Rules Matrix'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">1. Posting Profile Active Resolution</p>
                  <p className="text-slate-600 dark:text-slate-400">Verifies matching active profile for Company + Branch + Inventory Category.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">2. Currency & Exchange Rate Consistency</p>
                  <p className="text-slate-600 dark:text-slate-400">Mandates ISO currency code and base conversion compatibility.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">3. Non-Negative Quantity & Value Protection</p>
                  <p className="text-slate-600 dark:text-slate-400">Ensures Quantity &gt; 0 and Total Cost &ge; 0 prior to GL payload dispatch.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">4. Audit Reference Document Integrity</p>
                  <p className="text-slate-600 dark:text-slate-400">Validates source GRN, GIN, or Adjustment document number for 100% auditability.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Integration Audit Trail */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {isAr ? 'سجل أحداث التدقيق المالي للمخزون' : 'Immutable Financial Integration Audit History'}
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditRecords.map((rec) => (
                <div key={rec.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{rec.sourceDocumentNumber}</span>
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-medium">{rec.actionTaken}</span>
                      <span className="text-slate-400">{new Date(rec.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-1">{rec.details}</p>
                  </div>

                  <span className={`px-2 py-0.5 rounded font-medium ${rec.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                    {rec.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Queue Item Audit Modal / Detail Drawer */}
      {selectedQueueItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isAr ? 'تفاصيل ومعاملات حدث التكامل المالي' : 'Queue Item Financial Traceability'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">{selectedQueueItem.id}</p>
              </div>
              <button
                onClick={() => setSelectedQueueItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl col-span-2">
                <span className="text-slate-400">{isAr ? 'معرف الارتباط (Correlation ID): ' : 'Correlation ID: '}</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedQueueItem.correlationId || selectedQueueItem.payload.correlationId || 'N/A'}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl col-span-2">
                <span className="text-slate-400">{isAr ? 'مفتاح عدم التكرار (Idempotency Key): ' : 'Idempotency Key: '}</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 break-all">{selectedQueueItem.idempotencyKey || selectedQueueItem.payload.idempotencyKey || 'N/A'}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400">{isAr ? 'إصدار الحدث والمخطط: ' : 'Event / Schema Version: '}</span>
                <span className="font-bold text-slate-900 dark:text-white">v{selectedQueueItem.payload.eventVersion || '1.0'} / {selectedQueueItem.payload.schemaVersion || 'v1.0'}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400">{isAr ? 'حالة القفل والمنطقة: ' : 'Lock & DLQ Status: '}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedQueueItem.isDeadLetter ? 'DLQ (Dead Letter)' : selectedQueueItem.isLocked ? 'Locked' : 'Unlocked'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400">{isAr ? 'حدث الأعمال: ' : 'Business Event: '}</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedQueueItem.payload.businessEvent}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400">{isAr ? 'الحدث المالي: ' : 'Financial Event: '}</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedQueueItem.payload.financialEventType}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400">{isAr ? 'وثيقة المصدر: ' : 'Source Document: '}</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedQueueItem.payload.sourceDocumentNumber}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400">{isAr ? 'القيمة الإجمالية: ' : 'Total Amount: '}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedQueueItem.payload.totalCost.toLocaleString()} {selectedQueueItem.payload.currency}
                </span>
              </div>
            </div>

            {selectedQueueItem.failureReason && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300">
                <span className="font-bold">{isAr ? 'سبب التعثر: ' : 'Failure Reason: '}</span>
                <span>{selectedQueueItem.failureReason}</span>
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                {isAr ? 'تسلسل الخطوات وسجل التدقيق الزمني' : 'Timeline Audit Trace'}
              </h4>
              <div className="space-y-2 text-xs border-l-2 border-indigo-500 pl-3 dir-ltr">
                {selectedQueueItem.auditHistory.map((ah) => (
                  <div key={ah.id} className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{ah.action}</span>
                      <span className="text-[10px] text-slate-400">{new Date(ah.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">{ah.details}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedQueueItem(null)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
