/**
 * AM Business Platform - Phase 3.1 Conflict Resolution Center
 * Architecture Baseline: v2.8
 * Side-by-side state comparison, diff highlighting, manual/automated conflict resolution & cryptographic audit sealing.
 */

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  GitCompare,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sliders,
  DollarSign,
  Boxes,
  UserX,
  FileCheck
} from 'lucide-react';
import { SyncConflictRecord, SyncConflictResolution } from '../../types/sales';

interface ConflictResolutionTabProps {
  isAr: boolean;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ConflictResolutionTab: React.FC<ConflictResolutionTabProps> = ({ isAr, onNotify }) => {
  const [conflicts, setConflicts] = useState<SyncConflictRecord[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflictRecord | null>(null);
  const [resolutionType, setResolutionType] = useState<SyncConflictResolution>('SERVER_WINS');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [overridePrice, setOverridePrice] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);

  const loadConflicts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/sales/conflicts');
      const data = await res.json();
      if (data.success) {
        setConflicts(data.conflicts);
        if (data.conflicts.length > 0 && !selectedConflict) {
          setSelectedConflict(data.conflicts[0]);
        }
      }
    } catch (err) {
      onNotify('Failed to load conflict records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConflicts();
  }, []);

  const handleExecuteResolution = async () => {
    if (!selectedConflict) return;
    try {
      const res = await fetch(`/api/v1/sales/conflicts/${selectedConflict.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution: resolutionType,
          notes: resolutionNotes || `Applied ${resolutionType} by supervisor`,
          overridePrice,
          approvedBy: 'usr-001'
        })
      });
      const data = await res.json();
      if (data.success) {
        onNotify(
          isAr
            ? `تمت تسوية التعارض بنجاح وتطبيق قرار ${resolutionType}`
            : `Conflict resolved successfully applying ${resolutionType} with SHA-256 seal!`
        );
        loadConflicts();
        setSelectedConflict(null);
      } else {
        onNotify(data.error || 'Failed to resolve conflict', 'error');
      }
    } catch (err) {
      onNotify('Network error while resolving conflict', 'error');
    }
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'PRICE_MISMATCH': return <DollarSign className="w-4 h-4 text-amber-500" />;
      case 'INSUFFICIENT_STOCK': return <Boxes className="w-4 h-4 text-rose-500" />;
      case 'CUSTOMER_SUSPENDED': return <UserX className="w-4 h-4 text-purple-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>{isAr ? 'مركز فض وإدارة تعارضات المزامنة (Conflict Resolution Center)' : 'Sync Conflict Resolution & Arbitrage Center'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'مقارنة الفوارق جنباً إلى جنب بين حالة العميل والخادم، والتسوية اليدوية أو الآلية مع الحفاظ على الأختام الرقمية'
              : 'Side-by-side client vs server state diffing, supervisor override workflows, and immutable arbitration audit seals.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 font-mono text-xs font-bold border border-amber-500/20">
            {conflicts.filter(c => c.resolutionStatus === 'PENDING').length} Pending Review
          </span>
        </div>
      </div>

      {conflicts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {isAr ? 'لا توجد تعارضات معلقة في المزامنة' : 'Zero Active Sync Conflicts'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isAr ? 'جميع المعاملات غير المتصلة تمت مزامنتها بسلاسة وتطابق كامل مع قواعد الخادم.' : 'All synchronized transactions match server stock, pricing rules, and credit limits perfectly.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conflicts List */}
          <div className="lg:col-span-1 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isAr ? 'التعارضات المسجلة' : 'Detected Conflicts'}
            </h3>

            <div className="space-y-2">
              {conflicts.map(conf => (
                <div
                  key={conf.id}
                  onClick={() => setSelectedConflict(conf)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    selectedConflict?.id === conf.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getConflictIcon(conf.conflictType)}
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{conf.conflictType}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      conf.resolutionStatus === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {conf.resolutionStatus}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono">{conf.tempDocNumber}</div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{conf.differenceExplanation}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Conflict Inspection & Resolution Workspace */}
          {selectedConflict && (
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 text-xs font-mono font-bold">
                      {selectedConflict.conflictType}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{selectedConflict.tempDocNumber}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {selectedConflict.differenceExplanation}
                  </h3>
                </div>
              </div>

              {/* Side-by-Side Comparison Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Client Offline State (Mobile)</span>
                    <span className="font-mono text-[10px] text-amber-500">REQUESTED</span>
                  </div>
                  <pre className="text-xs font-mono text-slate-800 dark:text-slate-200 overflow-x-auto p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    {JSON.stringify(selectedConflict.clientState, null, 2)}
                  </pre>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Server Certified State (Core ERP)</span>
                    <span className="font-mono text-[10px] text-emerald-500">AUTHORITY</span>
                  </div>
                  <pre className="text-xs font-mono text-slate-800 dark:text-slate-200 overflow-x-auto p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    {JSON.stringify(selectedConflict.serverState, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Resolution Decision Panel */}
              {selectedConflict.resolutionStatus === 'PENDING' ? (
                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-4">
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                    {isAr ? 'اتخاذ قرار التسوية والحوكمة' : 'Supervisor Arbitration & Resolution'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'SERVER_WINS', label: 'Enforce Server Authority', desc: 'Override with server pricing/credit rules' },
                      { id: 'CLIENT_WINS', label: 'Honor Offline Offer', desc: 'Accept field representative promotion' },
                      { id: 'CANCEL_OFFLINE_TX', label: 'Reject & Void Tx', desc: 'Cancel transaction and notify user' }
                    ].map(res => (
                      <button
                        key={res.id}
                        onClick={() => setResolutionType(res.id as any)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                          resolutionType === res.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{res.label}</div>
                        <div className={`text-[10px] mt-1 ${resolutionType === res.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {res.desc}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Resolution Audit Notes / Approval Justification</label>
                    <input
                      type="text"
                      value={resolutionNotes}
                      onChange={e => setResolutionNotes(e.target.value)}
                      placeholder="e.g. Approved 10% special clearance discount per Sales VP policy."
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={handleExecuteResolution}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isAr ? 'اعتماد قرار التسوية وتوليد الختم الرقمي' : 'Apply Arbitration & Seal Resolution'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <span className="font-bold">RESOLVED: {selectedConflict.appliedResolution}</span>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      Resolved by {selectedConflict.resolvedBy} at {new Date(selectedConflict.resolvedAt || '').toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
