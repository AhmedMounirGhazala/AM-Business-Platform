/**
 * AM ENTERPRISE ERP — PHASE 3.2C-04 CASH APPLICATION, LOCKBOX & DISPUTES HUB
 * Enterprise Workspace: Lockbox Ingestion, Auto-Matching, Cash Clearing,
 * Dispute Deduction Management, Credit Memo Netting & Promise-to-Pay (P2P) Tracking
 */

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Plus,
  ArrowRightLeft,
  ShieldCheck,
  Search,
  Scale,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { CashApplicationEngine } from '../../engine/cashApplicationEngine';
import {
  LockboxBatch,
  CashApplicationRecord,
  DisputeDeductionCase,
  CustomerPromiseToPay
} from '../../types/cashApplication';
import { Phase32C04HardeningSuite, Phase32C04Report } from '../../engine/phase32C04HardeningSuite';

export const CashApplicationHub: React.FC = () => {
  const tenantId = 'tenant-egypt-corp';
  const companyId = 'comp-cairo-01';

  const [activeTab, setActiveTab] = useState<
    'LOCKBOX' | 'APPLICATIONS' | 'DISPUTES' | 'P2P' | 'NETTING' | 'HARDENING'
  >('LOCKBOX');

  const [lockboxBatches, setLockboxBatches] = useState<LockboxBatch[]>([]);
  const [cashApplications, setCashApplications] = useState<CashApplicationRecord[]>([]);
  const [disputes, setDisputes] = useState<DisputeDeductionCase[]>([]);
  const [promisesToPay, setPromisesToPay] = useState<CustomerPromiseToPay[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Hardening suite state
  const [hardeningReport, setHardeningReport] = useState<Phase32C04Report | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Modals / forms
  const [showImportLockboxModal, setShowImportLockboxModal] = useState(false);
  const [showCreateDisputeModal, setShowCreateDisputeModal] = useState(false);
  const [showP2PModal, setShowP2PModal] = useState(false);

  const loadData = () => {
    try {
      const batches = CashApplicationEngine.getLockboxBatches(tenantId, companyId);
      const apps = CashApplicationEngine.getCashApplications(tenantId, companyId);
      const disp = CashApplicationEngine.getDisputeCases(tenantId, companyId);
      const p2p = CashApplicationEngine.getPromisesToPay(tenantId, companyId);

      setLockboxBatches(batches);
      setCashApplications(apps);
      setDisputes(disp);
      setPromisesToPay(p2p);
    } catch (err) {
      console.error('Error loading Cash Application data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const runHardeningSuite = async () => {
    setIsRunningTests(true);
    try {
      const report = await Phase32C04HardeningSuite.runSuite();
      setHardeningReport(report);
      loadData();
    } catch (err) {
      console.error('Failed to run hardening suite:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleAutoMatch = (batchId: string) => {
    try {
      CashApplicationEngine.executeAutoMatch(batchId, 'treasury.bot@am-enterprise.com');
      loadData();
    } catch (err: any) {
      alert(`Auto-match error: ${err.message}`);
    }
  };

  // Metrics
  const totalClearedAmount = lockboxBatches.reduce((sum, b) => sum + (b.totalClearedAmount || 0), 0);
  const totalOpenDisputes = disputes.filter(d => ['OPEN', 'UNDER_INVESTIGATION', 'PENDING_SOD_APPROVAL'].includes(d.status)).length;
  const totalActiveP2P = promisesToPay.filter(p => p.status === 'ACTIVE').length;

  return (
    <div id="cash-application-hub-root" className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Customer Cash Applications, Lockbox Automation & Dispute Management
                </h1>
                <p className="text-sm text-slate-400">
                  Phase 3.2C-04 • BAI2/MT940 Lockbox Ingestion, Automated Matching, Deduction Disputes, Credit Netting & P2P
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={runHardeningSuite}
              disabled={isRunningTests}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRunningTests ? 'animate-spin' : ''}`} />
              {isRunningTests ? 'Running Hardening Suite...' : 'Run Phase 3.2C-04 Suite (30/30)'}
            </button>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lockbox Batches</span>
            <div className="text-2xl font-bold text-white mt-1">{lockboxBatches.length}</div>
            <span className="text-xs text-emerald-400 mt-1 block font-mono">
              ${totalClearedAmount.toLocaleString()} Cleared
            </span>
          </div>
          <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cash Applications</span>
            <div className="text-2xl font-bold text-white mt-1">{cashApplications.length}</div>
            <span className="text-xs text-blue-400 mt-1 block font-mono">Real-time FI Integration</span>
          </div>
          <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Open Dispute Cases</span>
            <div className="text-2xl font-bold text-white mt-1">{totalOpenDisputes}</div>
            <span className="text-xs text-amber-400 mt-1 block font-mono">SoD Enforced</span>
          </div>
          <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Promises-to-Pay</span>
            <div className="text-2xl font-bold text-white mt-1">{totalActiveP2P}</div>
            <span className="text-xs text-purple-400 mt-1 block font-mono">Installment Tracked</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('LOCKBOX')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'LOCKBOX'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Lockbox Processing ({lockboxBatches.length})
        </button>
        <button
          onClick={() => setActiveTab('APPLICATIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'APPLICATIONS'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          Cash Applications ({cashApplications.length})
        </button>
        <button
          onClick={() => setActiveTab('DISPUTES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'DISPUTES'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Deductions & Disputes ({disputes.length})
        </button>
        <button
          onClick={() => setActiveTab('P2P')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'P2P'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Promises-to-Pay ({promisesToPay.length})
        </button>
        <button
          onClick={() => setActiveTab('HARDENING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'HARDENING'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Phase 3.2C-04 Hardening Report
        </button>
      </div>

      {/* Tab: LOCKBOX */}
      {activeTab === 'LOCKBOX' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search batches by number, bank, or ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Format & Bank</th>
                  <th className="py-3 px-4">Transactions</th>
                  <th className="py-3 px-4">Total Remitted</th>
                  <th className="py-3 px-4">Cleared / On-Account</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {lockboxBatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No lockbox batches loaded. Click "Run Phase 3.2C-04 Suite" to generate live enterprise records.
                    </td>
                  </tr>
                ) : (
                  lockboxBatches.map(batch => (
                    <tr key={batch.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-bold text-white">{batch.batchNumber}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-200">{batch.bankName}</span>
                        <span className="block text-[10px] text-slate-500">{batch.format} • {batch.currency}</span>
                      </td>
                      <td className="py-3 px-4">{batch.transactionCount} txns</td>
                      <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                        ${batch.totalDepositAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="text-emerald-300">${batch.totalClearedAmount.toLocaleString()}</span> /{' '}
                        <span className="text-blue-300">${batch.totalOnAccountAmount.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            batch.status === 'AUTO_CLEARED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : batch.status === 'REQUIRES_REVIEW'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {batch.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {batch.status === 'IMPORTED' && (
                          <button
                            onClick={() => handleAutoMatch(batch.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                          >
                            Auto-Match
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: APPLICATIONS */}
      {activeTab === 'APPLICATIONS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Application #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4">Received Amount</th>
                <th className="py-3 px-4">Allocated / FX</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">FI Journal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {cashApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No cash applications available.
                  </td>
                </tr>
              ) : (
                cashApplications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-white">{app.applicationNumber}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200">{app.customerName}</span>
                      <span className="block text-[10px] text-slate-500">{app.customerCode}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-300">{app.paymentReference}</span>
                      <span className="block text-[10px] text-slate-500">{app.paymentMethod}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                      ${app.totalReceivedAmount.toLocaleString()} {app.currency}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span>${app.totalAllocatedAmount.toLocaleString()}</span>
                      {app.totalFxGainLoss !== 0 && (
                        <span className={`block text-[10px] ${app.totalFxGainLoss > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          FX: {app.totalFxGainLoss > 0 ? '+' : ''}${app.totalFxGainLoss}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          app.status === 'POSTED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {app.glJournalEntryId || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: DISPUTES */}
      {activeTab === 'DISPUTES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Dispute #</th>
                <th className="py-3 px-4">Customer & Invoice</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Disputed Amount</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">SoD Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {disputes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No dispute cases registered.
                  </td>
                </tr>
              ) : (
                disputes.map(disp => (
                  <tr key={disp.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-white">{disp.disputeNumber}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200">{disp.customerName}</span>
                      <span className="block text-[10px] text-slate-500">Inv: {disp.billingDocumentNumber}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-amber-300">{disp.reasonCode}</td>
                    <td className="py-3 px-4 font-mono text-rose-400 font-semibold">
                      ${disp.disputedAmount.toLocaleString()} {disp.currency}
                    </td>
                    <td className="py-3 px-4">{disp.assignedDepartment}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          disp.status.includes('APPROVED')
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : disp.status.includes('REJECTED')
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {disp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {disp.requiresSoDApproval ? (
                        <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded text-[10px] font-semibold">
                          Yes (&gt; $10k)
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Standard</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: P2P */}
      {activeTab === 'P2P' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">P2P Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Promised Amount</th>
                <th className="py-3 px-4">Installments</th>
                <th className="py-3 px-4">Target Pay Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {promisesToPay.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No promise-to-pay records found.
                  </td>
                </tr>
              ) : (
                promisesToPay.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-white">{p.p2pNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{p.customerName}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                      ${p.totalPromisedAmount.toLocaleString()} {p.currency}
                    </td>
                    <td className="py-3 px-4">{p.installmentCount} schedule(s)</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{p.promisedPayDate}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === 'FULFILLED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : p.status === 'BROKEN'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: HARDENING REPORT */}
      {activeTab === 'HARDENING' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Phase 3.2C-04 Enterprise Hardening Quality Gate</h2>
              <p className="text-xs text-slate-400">
                30 Mission-Critical Scenarios: Lockbox Ingestion, AutoMatch, Dispute Lifecycle & Collections
              </p>
            </div>
            {hardeningReport && (
              <div
                className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                  hardeningReport.verdict === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {hardeningReport.passedCount} / {hardeningReport.totalTests} TESTS PASS ({hardeningReport.verdict})
              </div>
            )}
          </div>

          {hardeningReport ? (
            <div className="space-y-2">
              {hardeningReport.results.map(r => (
                <div
                  key={r.scenarioNumber}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                    r.passed
                      ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-800/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {r.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <span className="font-mono font-bold mr-2">
                        SCENARIO {String(r.scenarioNumber).padStart(2, '0')}:
                      </span>
                      <span className="font-semibold text-white">{r.name}</span>
                      {r.details && <p className="text-[11px] text-slate-400 mt-0.5">{r.details}</p>}
                      {r.error && <p className="text-[11px] text-rose-400 mt-0.5">Error: {r.error}</p>}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">{r.durationMs}ms</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <p>Hardening report not yet executed in this session.</p>
              <button
                onClick={runHardeningSuite}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                Run Hardening Suite Now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
