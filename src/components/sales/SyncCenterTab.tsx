/**
 * AM Business Platform - Phase 3.1 Offline POS & Sync Center
 * Architecture Baseline: v2.8
 * Live Device Governance, Offline Queue Inspection, Manual/Auto Batch Sync & Cryptographic Seal Verification
 */

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap,
  Play,
  RotateCcw,
  Plus,
  Layers,
  ArrowRight,
  Search,
  Lock,
  Wifi,
  WifiOff,
  Server
} from 'lucide-react';
import {
  POSDeviceMaster,
  OfflineTransactionQueueItem,
  SyncAuditRecord,
  SyncBatchRequest,
  OfflineDocumentLineage
} from '../../types/sales';

interface SyncCenterTabProps {
  isAr: boolean;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SyncCenterTab: React.FC<SyncCenterTabProps> = ({ isAr, onNotify }) => {
  const [devices, setDevices] = useState<POSDeviceMaster[]>([]);
  const [queue, setQueue] = useState<OfflineTransactionQueueItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<SyncAuditRecord[]>([]);
  const [lineages, setLineages] = useState<OfflineDocumentLineage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [integrityResult, setIntegrityResult] = useState<any>(null);

  // New Device Register Modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newDevName, setNewDevName] = useState('');
  const [newDevType, setNewDevType] = useState<'DESKTOP_POS' | 'TABLET' | 'MOBILE_PHONE' | 'HANDHELD_TERMINAL'>('TABLET');
  const [newDevUser, setNewDevUser] = useState('Tariq Al-Mansoor');

  // New Offline Tx Modal
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'SALE' | 'CUSTOMER_ORDER' | 'CASH_COLLECTION' | 'RETURN'>('CUSTOMER_ORDER');
  const [txAmount, setTxAmount] = useState(4500);

  const loadData = async () => {
    setLoading(true);
    try {
      const [devRes, qRes, audRes] = await Promise.all([
        fetch('/api/v1/sales/devices').then(r => r.json()),
        fetch('/api/v1/sales/sync/queue').then(r => r.json()),
        fetch('/api/v1/sales/sync/audit').then(r => r.json())
      ]);

      if (devRes.success) setDevices(devRes.devices);
      if (qRes.success) setQueue(qRes.queue);
      if (audRes.success) {
        setAuditLogs(audRes.auditLogs);
        if (audRes.lineages) setLineages(audRes.lineages);
      }
    } catch (err) {
      console.error(err);
      onNotify('Failed to fetch sync data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Trigger Immediate Batch Sync
  const handleTriggerSync = async () => {
    const queuedItems = queue.filter(q => q.syncStatus === 'QUEUED' || q.syncStatus === 'FAILED');
    if (queuedItems.length === 0) {
      onNotify(isAr ? 'لا توجد معاملات مؤجلة في قائمة الانتظار للمزامنة' : 'No queued offline transactions to synchronize.', 'info');
      return;
    }

    setIsSyncing(true);
    try {
      const batchRequest: SyncBatchRequest = {
        batchId: `batch-${Date.now()}`,
        deviceId: queuedItems[0].deviceId,
        userId: 'usr-002',
        companyId: 'comp-001',
        branchId: 'br-001',
        sentAt: new Date().toISOString(),
        items: queuedItems
      };

      const res = await fetch('/api/v1/sales/sync/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchRequest)
      });
      const data = await res.json();
      if (data.success) {
        const resp = data.response;
        onNotify(
          isAr
            ? `اكتملت المزامنة: ${resp.successCount} ناجحة، ${resp.duplicateCount} مكررة مستبعدة، ${resp.conflictCount} تعارضات`
            : `Sync Completed: ${resp.successCount} promoted, ${resp.duplicateCount} duplicates ignored, ${resp.conflictCount} conflicts detected.`,
          resp.conflictCount > 0 ? 'info' : 'success'
        );
        loadData();
      } else {
        onNotify(data.error || 'Sync batch processing failed', 'error');
      }
    } catch (err) {
      onNotify('Network error during sync batch', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Cryptographic Integrity Verification
  const handleVerifyIntegrity = async () => {
    try {
      const res = await fetch('/api/v1/sales/sync/verify-integrity');
      const data = await res.json();
      if (data.success) {
        setIntegrityResult(data.integrityReport);
        onNotify(
          data.integrityReport.isTamperFree
            ? (isAr ? 'تم التحقق: سجل المزامنة سليم تماماً وبدون أي تلاعب رقمي' : 'Integrity Verified: Audit trail is 100% tamper-free with valid SHA-256 seal.')
            : (isAr ? 'تحذير: تم اكتشاف سجلات غير مطابقة' : 'Warning: Tampered records detected in audit logs!'),
          data.integrityReport.isTamperFree ? 'success' : 'error'
        );
      }
    } catch (err) {
      onNotify('Integrity verification failed', 'error');
    }
  };

  // Register New Device
  const handleRegisterDevice = async () => {
    if (!newDevName) return;
    try {
      const res = await fetch('/api/v1/sales/devices/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceName: newDevName,
          deviceType: newDevType,
          assignedUserName: newDevUser,
          macAddressOrFingerprint: `00:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:FF:EE:11`
        })
      });
      const data = await res.json();
      if (data.success) {
        onNotify(isAr ? `تم تسجيل الجهاز ${data.device.deviceCode} بنجاح` : `Device ${data.device.deviceCode} registered successfully!`);
        setIsRegisterModalOpen(false);
        setNewDevName('');
        loadData();
      }
    } catch (err) {
      onNotify('Device registration failed', 'error');
    }
  };

  // Create Mock Offline Tx
  const handleCreateOfflineTx = async () => {
    try {
      const res = await fetch('/api/v1/sales/sync/queue/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: devices[0]?.id || 'dev-pos-01',
          transactionType: txType,
          userName: 'Tariq Al-Mansoor',
          userId: 'usr-002',
          payload: {
            customerId: 'cust-101',
            customerName: 'Al-Mansoor Trading Est',
            grandTotal: txAmount,
            amountCollected: txAmount,
            lines: [{ itemSku: 'POS-TRM-T5', itemName: 'Smart POS Touch Terminal T5', quantityOrdered: 2, unitPrice: txAmount / 2 }]
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        onNotify(isAr ? `تم إنشاء المعاملة غير المتصلة ${data.queueItem.tempDocumentNumber}` : `Offline Tx ${data.queueItem.tempDocumentNumber} queued!`);
        setIsNewTxModalOpen(false);
        loadData();
      }
    } catch (err) {
      onNotify('Failed to queue offline transaction', 'error');
    }
  };

  // Toggle Device Authorization
  const handleToggleAuth = async (dev: POSDeviceMaster) => {
    const endpoint = dev.isAuthorized ? `/api/v1/sales/devices/${dev.id}/deauthorize` : `/api/v1/sales/devices/${dev.id}/authorize`;
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onNotify(isAr ? `تم تعديل حالة ترخيص الجهاز ${dev.deviceCode}` : `Device ${dev.deviceCode} authorization updated.`);
        loadData();
      }
    } catch (err) {
      onNotify('Failed to update device authorization', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>{isAr ? 'مركز المزامنة وإدارة أجهزة نقاط البيع والمبيعات الميدانية' : 'Offline POS & Field Sales Synchronization Hub'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'محرك المزامنة الآلي، معالجة الدفعات، فحص المفاتيح الفريدة Idempotency، والأختام الرقمية SHA-256'
              : 'Device-aware temporary numbering, automated batch promotion, idempotency enforcement & cryptographic audit sealing.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleVerifyIntegrity}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{isAr ? 'فحص سلامة السجل (SHA-256)' : 'Verify Audit Integrity'}</span>
          </button>

          <button
            onClick={() => setIsNewTxModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'محاكاة معاملة أوفلاين' : 'Queue Offline Tx'}</span>
          </button>

          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition"
          >
            <Zap className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? (isAr ? 'جارِ المزامنة...' : 'Syncing Batch...') : (isAr ? 'مزامنة المعاملات المعلقة' : 'Execute Batch Sync')}</span>
          </button>
        </div>
      </div>

      {/* Cryptographic Integrity Banner */}
      {integrityResult && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-4 ${
          integrityResult.isTamperFree
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
        }`}>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <div>
              <span className="font-bold font-mono">
                {integrityResult.isTamperFree ? 'CRYPTOGRAPHIC AUDIT INTEGRITY: CERTIFIED 100% UNTAMPERED' : 'INTEGRITY BREACH DETECTED'}
              </span>
              <div className="text-[11px] opacity-80 mt-0.5 font-mono">
                Records Verified: {integrityResult.totalRecordsChecked} | Seal: {integrityResult.verificationSealSha256}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-mono opacity-80">{new Date(integrityResult.verifiedAt).toLocaleTimeString()}</span>
        </div>
      )}

      {/* Grid: Devices Master & Offline Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Governance Panel */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-500" />
              <span>{isAr ? 'الأجهزة والمحطات المعتمدة' : 'Authorized Devices & Terminals'}</span>
            </h3>
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {devices.map(dev => (
              <div
                key={dev.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{dev.deviceCode}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        dev.connectivityStatus === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}>
                        {dev.connectivityStatus}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{dev.deviceName}</div>
                  </div>
                  <button
                    onClick={() => handleToggleAuth(dev)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                      dev.isAuthorized
                        ? 'bg-emerald-500/10 text-emerald-600 hover:bg-rose-500/10 hover:text-rose-600'
                        : 'bg-rose-500/10 text-rose-600 hover:bg-emerald-500/10 hover:text-emerald-600'
                    }`}
                  >
                    {dev.isAuthorized ? 'Authorized' : 'Deauthorized'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <div>Assigned: <span className="font-medium text-slate-700 dark:text-slate-300">{dev.assignedUserName.split(' ')[0]}</span></div>
                  <div>Pending: <span className="font-mono font-bold text-amber-500">{dev.localPendingQueueCount} items</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Offline Queue Active Stream */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>{isAr ? 'قائمة المعاملات المحلية المعلقة (Local Queue)' : 'Offline Local Transaction Queue'}</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-mono font-bold">
              {queue.length} Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Temp Document #</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Device / User</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Lineage / Seal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {queue.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {item.tempDocumentNumber}
                      <div className="text-[10px] text-slate-400 font-normal font-sans">{new Date(item.timestamp).toLocaleTimeString()}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        {item.transactionType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{item.userName}</div>
                      <div className="text-[10px] text-slate-400">{item.deviceId}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {item.payload.grandTotal || item.payload.amountCollected || 0} SAR
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        item.syncStatus === 'SYNCED' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        item.syncStatus === 'QUEUED' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                        item.syncStatus === 'CONFLICT' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' :
                        'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                      }`}>
                        {item.syncStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[10px] text-slate-500">
                      {item.finalServerDocumentNumber ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">→ {item.finalServerDocumentNumber}</span>
                      ) : (
                        <span className="text-slate-400">Encrypted Sealed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sync Audit Trail & Document Lineage Stream */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{isAr ? 'سجل تدقيق المزامنة وسلسلة التتبع (Sync Audit Trail & Lineage)' : 'Immutable Sync Audit Trail & Document Lineage'}</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">Real-time Certified Stream</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Audit Event ID</th>
                <th className="py-2.5 px-3">Device & User</th>
                <th className="py-2.5 px-3">Temp Document</th>
                <th className="py-2.5 px-3">Promoted Server Doc</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3">SHA-256 Checksum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-mono text-slate-900 dark:text-white font-bold">{log.id}</td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{log.userName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{log.deviceId}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">{log.tempDocNumber}</td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {log.finalDocNumber || '—'}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      log.syncResult === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-600' :
                      log.syncResult === 'DUPLICATE_RESOLVED' ? 'bg-blue-500/10 text-blue-600' :
                      'bg-rose-500/10 text-rose-600'
                    }`}>
                      {log.syncResult}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[10px] text-slate-400 truncate max-w-[160px]">
                    {log.payloadChecksumSha256}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register Device */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'تسجيل جهاز نقطة بيع أو مندوب جديد' : 'Register New POS Device or Tablet'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Device Friendly Name</label>
                <input
                  type="text"
                  value={newDevName}
                  onChange={e => setNewDevName(e.target.value)}
                  placeholder="e.g. Sales Van #05 Tablet"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Device Hardware Type</label>
                <select
                  value={newDevType}
                  onChange={e => setNewDevType(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-indigo-500"
                >
                  <option value="TABLET">Tablet (iPad / Android)</option>
                  <option value="DESKTOP_POS">Desktop Touch POS</option>
                  <option value="MOBILE_PHONE">Representative Smartphone</option>
                  <option value="HANDHELD_TERMINAL">Handheld Barcode Terminal</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Assigned Representative / Cashier</label>
                <input
                  type="text"
                  value={newDevUser}
                  onChange={e => setNewDevUser(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRegisterDevice}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
              >
                Register & Authorize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Queue Mock Offline Tx */}
      {isNewTxModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'إنشاء معاملة غير متصلة (محاكاة الأوفلاين)' : 'Simulate Offline Transaction'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Transaction Type</label>
                <select
                  value={txType}
                  onChange={e => setTxType(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-indigo-500"
                >
                  <option value="CUSTOMER_ORDER">Customer Order (SO)</option>
                  <option value="SALE">POS Receipt / Direct Sale</option>
                  <option value="CASH_COLLECTION">Cash Collection</option>
                  <option value="RETURN">Sales Return</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total Amount (SAR)</label>
                <input
                  type="number"
                  value={txAmount}
                  onChange={e => setTxAmount(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium font-mono focus:outline-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNewTxModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOfflineTx}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold cursor-pointer"
              >
                Queue Offline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
