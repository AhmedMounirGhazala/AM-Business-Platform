/**
 * AM Business Platform - Phase 3.1 Failed Sync Recovery Center
 * Architecture Baseline: v2.8
 * Quarantine inspection, manual retry & rejection governance for interrupted transactions.
 */

import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Play,
  Trash2,
  Layers,
  ArrowRight,
  ShieldAlert,
  Search
} from 'lucide-react';
import { OfflineTransactionQueueItem } from '../../types/sales';

interface RecoveryCenterTabProps {
  isAr: boolean;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const RecoveryCenterTab: React.FC<RecoveryCenterTabProps> = ({ isAr, onNotify }) => {
  const [failedItems, setFailedItems] = useState<OfflineTransactionQueueItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<OfflineTransactionQueueItem | null>(null);
  const [loading, setLoading] = useState(false);

  const loadFailed = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/sales/recovery/failed');
      const data = await res.json();
      if (data.success) {
        setFailedItems(data.failedItems);
      }
    } catch (err) {
      onNotify('Failed to load quarantine items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFailed();
  }, []);

  const handleRetry = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/sales/recovery/${id}/retry`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onNotify(isAr ? 'تمت إعادة محاولة المزامنة بنجاح' : data.message);
        loadFailed();
        setSelectedItem(null);
      } else {
        onNotify(data.error || 'Retry failed', 'error');
      }
    } catch (err) {
      onNotify('Network error on retry', 'error');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/sales/recovery/${id}/reject`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onNotify(isAr ? 'تم إلغاء واستبعاد المعاملة بنجاح مع تسجيل سبب التدقيق' : data.message, 'info');
        loadFailed();
        setSelectedItem(null);
      } else {
        onNotify(data.error || 'Rejection failed', 'error');
      }
    } catch (err) {
      onNotify('Network error on rejection', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <span>{isAr ? 'مركز استرجاع ومعالجة المعاملات المتعثرة (Quarantine & Recovery Center)' : 'Failed Sync Recovery & Quarantine Hub'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'إدارة المعاملات المقطوعة أو المتعثرة، وإعادة المحاولة مع الالتزام بقواعد عدم حذف المعاملات المالية دون سجل تدقيقي'
              : 'Safely inspect quarantined transactions, trigger exponential backoff retries, or execute auditable rejections.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-rose-500/10 text-rose-600 font-mono text-xs font-bold border border-rose-500/20">
            {failedItems.length} Quarantined Items
          </span>
        </div>
      </div>

      {failedItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {isAr ? 'قائمة الاسترجاع خالية تماماً' : 'No Quarantined Transactions'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isAr ? 'لا توجد أي معاملات متعثرة أو فاشلة في المزامنة.' : 'All offline transactions are processed smoothly with 0 network dropped packets.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Failed Items List */}
          <div className="lg:col-span-1 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isAr ? 'المعاملات المعزولة' : 'Quarantined Items'}
            </h3>

            <div className="space-y-2">
              {failedItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    selectedItem?.id === item.id
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{item.tempDocumentNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/10 text-rose-600">
                      {item.syncStatus}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{item.transactionType} • {item.userName}</div>
                  <div className="text-[11px] text-rose-500 mt-1 truncate">{item.errorMessage || item.conflictDetails}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Details & Actions Panel */}
          {selectedItem && (
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{selectedItem.tempDocumentNumber}</span>
                  <div className="text-xs text-slate-500">Device ID: {selectedItem.deviceId} • Retry Count: {selectedItem.retryCount}</div>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Payload State</span>
                <pre className="text-xs font-mono text-slate-800 dark:text-slate-200 overflow-x-auto p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mt-1">
                  {JSON.stringify(selectedItem.payload, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => handleReject(selectedItem.id)}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isAr ? 'إلغاء واستبعاد المعاملة' : 'Reject & Void Transaction'}</span>
                </button>

                <button
                  onClick={() => handleRetry(selectedItem.id)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isAr ? 'إعادة المحاولة الفورية' : 'Force Retry Promotion'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
