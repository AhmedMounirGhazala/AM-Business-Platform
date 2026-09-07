/**
 * AM Business Platform - Offline POS & IndexedDB Sync Panel
 * Architecture Baseline: v2.8 | Pilot Readiness Phase 2
 * Visualizes IndexedDB offline transaction queue, crash recovery, sync status states,
 * conflict inspection, and authoritative SQLite server reconciliation.
 */

import React, { useState } from 'react';
import {
  Database,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Check,
  Eye,
  X,
  FileText
} from 'lucide-react';
import { OfflineTransactionQueueItem, OfflineTransactionStatus } from '../../types/sales';
import { OfflineSyncSummary } from '../../services/offlinePosManager';

interface OfflinePosSyncPanelProps {
  isAr: boolean;
  isOfflineMode: boolean;
  onToggleOfflineMode: () => void;
  queueItems: OfflineTransactionQueueItem[];
  summary: OfflineSyncSummary;
  onSync: () => Promise<void>;
  onSimulateRestart: () => Promise<void>;
  onRetry: (id: string) => Promise<void>;
  onClearSynced: () => Promise<void>;
  syncing: boolean;
  notification: string | null;
}

export const OfflinePosSyncPanel: React.FC<OfflinePosSyncPanelProps> = ({
  isAr,
  isOfflineMode,
  onToggleOfflineMode,
  queueItems,
  summary,
  onSync,
  onSimulateRestart,
  onRetry,
  onClearSynced,
  syncing,
  notification
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | OfflineTransactionStatus>('ALL');
  const [inspectingItem, setInspectingItem] = useState<OfflineTransactionQueueItem | null>(null);

  const filteredItems = queueItems.filter(item => {
    if (statusFilter === 'ALL') return true;
    return item.syncStatus === statusFilter;
  });

  const getStatusBadge = (item: OfflineTransactionQueueItem) => {
    switch (item.syncStatus) {
      case 'QUEUED':
      case 'SYNCING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>{isAr ? 'في انتظار المزامنة' : 'Pending Sync'}</span>
          </span>
        );
      case 'SYNCED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>{isAr ? 'تمت المزامنة' : 'Synced'}</span>
          </span>
        );
      case 'CONFLICT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-500/30">
            <AlertTriangle className="w-3 h-3 text-purple-500" />
            <span>{isAr ? 'تعارض بيانات' : 'Conflict'}</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-500/30">
            <RotateCcw className="w-3 h-3 text-rose-500" />
            <span>{isAr ? 'فشل / إعادة المحاولة' : 'Failed / Retry'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <span>{item.syncStatus}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notification */}
      {notification && (
        <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between text-teal-700 dark:text-teal-300 text-xs font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-500" />
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* Persistence Engine Telemetry Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {isAr ? 'محرك التخزين المحلي والمزامنة (IndexedDB & SQLite)' : 'Offline POS Persistence & Sync Engine'}
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                IndexedDB Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'حفظ المبيعات والمرتجعات محلياً بترميز SHA-256 وحماية عدم تكرار القيد (Idempotency) ومقاومة إعادة تشغيل المتصفح'
                : 'Crash-resilient local queuing with SHA-256 seals, idempotency protection, and authoritative SQLite server sync'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onToggleOfflineMode}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer border ${
                isOfflineMode
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              {isOfflineMode ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4 text-emerald-500" />}
              <span>{isOfflineMode ? (isAr ? 'وضع عدم الاتصال نشط' : 'Offline Mode Active') : (isAr ? 'محاكاة وضع عدم الاتصال' : 'Force Offline Mode')}</span>
            </button>

            <button
              onClick={onSimulateRestart}
              className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer border border-slate-700 shadow-xs"
              title="Closes storage connection, resets memory caches, and reloads from disk"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'محاكاة إعادة تشغيل المتصفح' : 'Simulate Browser Reload'}</span>
            </button>

            <button
              onClick={onSync}
              disabled={syncing || summary.pendingCount === 0}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? (isAr ? 'جارِ المزامنة...' : 'Syncing...') : (isAr ? `مزامنة المعاملات (${summary.pendingCount})` : `Sync Pending (${summary.pendingCount})`)}</span>
            </button>

            {summary.syncedCount > 0 && (
              <button
                onClick={onClearSynced}
                className="px-3 py-2 rounded-xl text-slate-400 hover:text-rose-500 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Remove synced items from IndexedDB"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isAr ? 'تنظيف المكتمل' : 'Clear Synced'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div
            onClick={() => setStatusFilter('ALL')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-teal-500/10 border-teal-500/40 dark:bg-teal-950/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="text-[11px] font-bold text-slate-500">{isAr ? 'إجمالي المعاملات' : 'Total Queue'}</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{summary.total}</div>
            <span className="text-[10px] text-slate-400 font-mono">IndexedDB local</span>
          </div>

          <div
            onClick={() => setStatusFilter('QUEUED')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'QUEUED'
                ? 'bg-amber-500/10 border-amber-500/40 dark:bg-amber-950/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-amber-400/50'
            }`}
          >
            <span className="text-[11px] font-bold text-amber-600">{isAr ? 'في انتظار المزامنة' : 'Pending Sync'}</span>
            <div className="text-xl font-black text-amber-600 mt-1">{summary.pendingCount}</div>
            <span className="text-[10px] text-amber-500 font-mono">Will sync on connect</span>
          </div>

          <div
            onClick={() => setStatusFilter('SYNCED')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'SYNCED'
                ? 'bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-950/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-emerald-400/50'
            }`}
          >
            <span className="text-[11px] font-bold text-emerald-600">{isAr ? 'تمت المزامنة بنجاح' : 'Synced'}</span>
            <div className="text-xl font-black text-emerald-600 mt-1">{summary.syncedCount}</div>
            <span className="text-[10px] text-emerald-500 font-mono">In Server SQLite</span>
          </div>

          <div
            onClick={() => setStatusFilter('CONFLICT')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'CONFLICT'
                ? 'bg-purple-500/10 border-purple-500/40 dark:bg-purple-950/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-purple-400/50'
            }`}
          >
            <span className="text-[11px] font-bold text-purple-600">{isAr ? 'تعارض بيانات' : 'Conflicts'}</span>
            <div className="text-xl font-black text-purple-600 mt-1">{summary.conflictCount}</div>
            <span className="text-[10px] text-purple-500 font-mono">Price/Credit review</span>
          </div>

          <div
            onClick={() => setStatusFilter('FAILED')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'FAILED'
                ? 'bg-rose-500/10 border-rose-500/40 dark:bg-rose-950/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-rose-400/50'
            }`}
          >
            <span className="text-[11px] font-bold text-rose-600">{isAr ? 'فشل الإرسال' : 'Failed / Retry'}</span>
            <div className="text-xl font-black text-rose-600 mt-1">{summary.failedCount}</div>
            <span className="text-[10px] text-rose-500 font-mono">Auto-retry queue</span>
          </div>
        </div>
      </div>

      {/* Interactive Queue Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'قائمة المعاملات غير المتزامنة' : 'IndexedDB Offline Transaction Queue'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
            <span>Authoritative backend:</span>
            <span className="text-teal-600 font-bold">SQLite /data/pilot_erp.db</span>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Database className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-xs font-bold text-slate-500">
              {isAr ? 'لا توجد معاملات في القائمة بالفلتر الحالي' : 'No offline transactions found for the selected filter.'}
            </p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              {isAr
                ? 'قم بتفعيل وضع عدم الاتصال وإجراء عملية بيع أو إرجاع لمشاهدة التخزين المحلي والمزامنة'
                : 'Toggle Offline Mode and complete a checkout, return, or cash movement to observe local queuing and sync.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-[11px] text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Temporary Doc Number</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Idempotency Key</th>
                  <th className="p-3.5">Created Offline</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                {filteredItems.map(item => {
                  const amount = item.payload?.grandTotal || item.payload?.refundGrandTotal || item.payload?.amount || 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {item.tempDocumentNumber}
                        </div>
                        {item.finalServerDocumentNumber && (
                          <div className="text-[10px] font-mono text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                            <Check className="w-3 h-3" />
                            <span>Server Doc: {item.finalServerDocumentNumber}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.transactionType}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1">
                          {getStatusBadge(item)}
                          {item.errorMessage && (
                            <div className="text-[10px] text-rose-500 font-mono truncate max-w-[180px]">
                              {item.errorMessage} (Retries: {item.retryCount})
                            </div>
                          )}
                          {item.conflictDetails && (
                            <div className="text-[10px] text-purple-600 font-mono truncate max-w-[180px]">
                              {item.conflictDetails.conflictType}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {amount.toLocaleString()} SAR
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {item.idempotencyKey.slice(0, 18)}...
                        </span>
                      </td>

                      <td className="p-3.5 text-[11px] text-slate-400 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.syncStatus === 'FAILED' && (
                            <button
                              onClick={() => onRetry(item.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              title="Retry syncing this transaction"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Retry</span>
                            </button>
                          )}

                          <button
                            onClick={() => setInspectingItem(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                            title="Inspect Transaction Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {inspectingItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Transaction Lineage & Seal</h3>
                <span className="font-mono text-xs text-teal-600 font-bold">{inspectingItem.tempDocumentNumber}</span>
              </div>
              <button onClick={() => setInspectingItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl font-mono text-[11px]">
                <div><span className="text-slate-400">Device ID:</span> <span className="font-bold">{inspectingItem.deviceId}</span></div>
                <div><span className="text-slate-400">Sequence:</span> <span className="font-bold">#{inspectingItem.localSequence}</span></div>
                <div><span className="text-slate-400">Status:</span> <span className="font-bold">{inspectingItem.syncStatus}</span></div>
                <div><span className="text-slate-400">Retries:</span> <span className="font-bold">{inspectingItem.retryCount} / {inspectingItem.maxRetries}</span></div>
                <div className="col-span-2"><span className="text-slate-400">Idempotency Key:</span> <span className="font-bold">{inspectingItem.idempotencyKey}</span></div>
                <div className="col-span-2"><span className="text-slate-400">SHA-256 Seal:</span> <span className="font-bold">{inspectingItem.encryptedChecksumSha256}</span></div>
                {inspectingItem.finalServerDocumentNumber && (
                  <div className="col-span-2 text-emerald-600 font-bold">
                    <span>Authoritative Server Document: </span>
                    <span>{inspectingItem.finalServerDocumentNumber}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Transaction Payload (JSON)</label>
                <pre className="mt-1 p-3 rounded-xl bg-slate-950 text-slate-200 text-[10px] font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(inspectingItem.payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setInspectingItem(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
