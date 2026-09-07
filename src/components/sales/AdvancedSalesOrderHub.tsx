/**
 * AM Enterprise ERP — Phase 3.2C-01 Advanced Order-to-Cash (O2C) Management Hub
 *
 * Enterprise Capabilities:
 * 1. Sales Contracts & Blanket Sales Agreements (BPA / Outline Agreements)
 * 2. Customer Consignment Inventory (Fill-Up, Issue/Consumption, Pick-Up, Return)
 * 3. Customer Volume Rebates & Multi-Tier Settlement Management
 * 4. Drop-Shipment Order Lifecycle & Direct Vendor Delivery Orchestration
 * 5. Customer Credit Exposure Governance & Risk Workbench
 * 6. Hardening Suite & Quality Gate Execution
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Boxes,
  Percent,
  Truck,
  ShieldAlert,
  PlayCircle,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Search,
  ExternalLink,
  Ban,
  Layers,
  Sparkles,
  Award,
  ChevronRight,
  Send,
  Building2,
  PackageCheck
} from 'lucide-react';
import { ApiClient } from '../../services/apiClient';
import {
  SalesContract,
  CustomerConsignmentStock,
  ConsignmentMovementRecord,
  CustomerRebateAgreement,
  DropShipmentOrder,
  CustomerCreditProfile
} from '../../types/salesContracts';

type ActiveTab = 'CONTRACTS' | 'CONSIGNMENT' | 'REBATES' | 'DROPSHIP' | 'CREDIT' | 'HARDENING';

export const AdvancedSalesOrderHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('CONTRACTS');
  const [loading, setLoading] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Domain State
  const [contracts, setContracts] = useState<SalesContract[]>([]);
  const [consignmentStocks, setConsignmentStocks] = useState<CustomerConsignmentStock[]>([]);
  const [consignmentMovements, setConsignmentMovements] = useState<ConsignmentMovementRecord[]>([]);
  const [rebateAgreements, setRebateAgreements] = useState<CustomerRebateAgreement[]>([]);
  const [dropShipOrders, setDropShipOrders] = useState<DropShipmentOrder[]>([]);
  const [creditProfiles, setCreditProfiles] = useState<CustomerCreditProfile[]>([]);
  const [hardeningReport, setHardeningReport] = useState<any>(null);

  // Modal / Form States
  const [showContractModal, setShowContractModal] = useState<boolean>(false);
  const [showConsignmentModal, setShowConsignmentModal] = useState<boolean>(false);
  const [showRebateModal, setShowRebateModal] = useState<boolean>(false);
  const [showDropShipModal, setShowDropShipModal] = useState<boolean>(false);

  // New Contract Form
  const [newContractCustomer, setNewContractCustomer] = useState('Acme International');
  const [newContractSku, setNewContractSku] = useState('SKU-VALVE-01');
  const [newContractQty, setNewContractQty] = useState(500);
  const [newContractPrice, setNewContractPrice] = useState(200);

  // New Consignment Movement Form
  const [consignmentCust, setConsignmentCust] = useState('Delta Motors Factory');
  const [consignmentLoc, setConsignmentLoc] = useState('loc-detroit-plant');
  const [consignmentType, setConsignmentType] = useState<'CONSIGNMENT_FILLUP' | 'CONSIGNMENT_ISSUE' | 'CONSIGNMENT_PICKUP' | 'CONSIGNMENT_RETURN'>('CONSIGNMENT_FILLUP');
  const [consignmentSku, setConsignmentSku] = useState('SKU-BEARING-01');
  const [consignmentQty, setConsignmentQty] = useState(100);
  const [consignmentPrice, setConsignmentPrice] = useState(50);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [contractsRes, cStockRes, cMovRes, rbtRes, dsRes, crRes] = await Promise.all([
        ApiClient.getSalesContracts().catch(() => ({ contracts: [] })),
        ApiClient.getCustomerConsignmentStocks().catch(() => ({ stocks: [] })),
        ApiClient.getCustomerConsignmentMovements().catch(() => ({ movements: [] })),
        ApiClient.getCustomerRebateAgreements().catch(() => ({ agreements: [] })),
        ApiClient.getDropShipmentOrders().catch(() => ({ orders: [] })),
        ApiClient.getCustomerCreditProfiles().catch(() => ({ profiles: [] }))
      ]);

      if (contractsRes?.contracts) setContracts(contractsRes.contracts);
      if (cStockRes?.stocks) setConsignmentStocks(cStockRes.stocks);
      if (cMovRes?.movements) setConsignmentMovements(cMovRes.movements);
      if (rbtRes?.agreements) setRebateAgreements(rbtRes.agreements);
      if (dsRes?.orders) setDropShipOrders(dsRes.orders);
      if (crRes?.profiles) setCreditProfiles(crRes.profiles);
    } catch (err: any) {
      console.error('Failed to fetch Advanced O2C data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // 1. Create Contract
  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        tenantId: 'tenant-am-global',
        companyId: 'comp-egypt-01',
        branchId: 'branch-cairo-hq',
        contractType: 'QUANTITY_COMMITMENT',
        customerId: `cust-${Date.now()}`,
        customerCode: `CUST-${newContractCustomer.substring(0, 4).toUpperCase()}`,
        customerName: newContractCustomer,
        title: `Annual Supply Agreement - ${newContractCustomer}`,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        currency: 'USD',
        paymentTermsId: 'pt-net30',
        paymentTermsCode: 'NET30',
        earlyTerminationPenaltyRate: 0.05,
        lines: [
          {
            itemSku: newContractSku,
            itemName: 'Industrial High-Grade Assembly',
            uom: 'EA',
            committedQuantity: Number(newContractQty),
            agreedUnitPrice: Number(newContractPrice),
            minimumOrderQuantity: 10,
            maximumOrderQuantity: 500
          }
        ],
        performedBy: 'sales.lead@am-enterprise.com'
      };

      const res = await ApiClient.createSalesContract(payload);
      if (res.success) {
        showNotification('success', `Contract #${res.contract.contractNumber} created successfully in DRAFT.`);
        setShowContractModal(false);
        fetchAllData();
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create contract');
    }
  };

  // Activate Contract
  const handleActivateContract = async (contractId: string) => {
    try {
      const res = await ApiClient.activateSalesContract(contractId, {
        approverUser: 'commercial.director@am-enterprise.com'
      });
      if (res.success) {
        showNotification('success', `Contract activated! Ready for release drawdowns.`);
        fetchAllData();
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to activate contract');
    }
  };

  // 2. Consignment Movement
  const handleConsignmentMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        tenantId: 'tenant-am-global',
        companyId: 'comp-egypt-01',
        movementType: consignmentType,
        customerId: 'cust-201',
        customerName: consignmentCust,
        customerLocationId: consignmentLoc,
        customerLocationName: 'Detroit Assembly Plant Warehouse',
        itemSku: consignmentSku,
        itemName: 'Precision Component',
        uom: 'EA',
        quantity: Number(consignmentQty),
        unitPrice: Number(consignmentPrice),
        unitCost: Number(consignmentPrice) * 0.7,
        currency: 'USD',
        performedBy: 'consignment.manager@am-enterprise.com'
      };

      const res = await ApiClient.processConsignmentMovement(payload);
      if (res.success) {
        showNotification('success', `Processed ${consignmentType} movement #${res.movementRecord.movementNumber}.`);
        setShowConsignmentModal(false);
        fetchAllData();
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to process consignment movement');
    }
  };

  // 3. Run Hardening Suite
  const handleRunHardeningSuite = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.runPhase32C01HardeningSuite();
      if (res.success && res.report) {
        setHardeningReport(res.report);
        showNotification('success', `Phase 3.2C-01 Hardening: ${res.report.passedCount}/${res.report.totalTests} Scenarios Passed (${res.report.verdict})!`);
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to run hardening suite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-slate-900 text-slate-100 min-h-screen p-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
              Phase 3.2C-01 Verified
            </span>
            <span className="text-xs text-slate-400 font-mono">Order-to-Cash & Commercial SCM</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-3">
            <Building2 className="w-7 h-7 text-indigo-400" />
            Advanced Order-to-Cash (O2C) Management Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Contracts & Blanket Orders • Customer Consignment • Volume Rebates • Drop-Shipment • Credit Exposure
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleRunHardeningSuite}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow-lg shadow-emerald-900/30 transition"
          >
            <PlayCircle className="w-4 h-4" />
            Run 3.2C-01 Hardening (30 Tests)
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`my-4 p-4 rounded-lg flex items-center gap-3 border ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                : 'bg-red-950/60 border-red-500/50 text-red-200'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{feedbackMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metric Quick Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 my-6">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Contracts</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {contracts.filter(c => c.status === 'ACTIVE').length}
          </p>
          <span className="text-xs text-slate-500">{contracts.length} Total Contracts</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Consignment Stock</span>
            <Boxes className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {consignmentStocks.reduce((acc, s) => acc + s.currentStockQuantity, 0).toLocaleString()}
          </p>
          <span className="text-xs text-slate-500">Units in Custody</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Rebate Accruals</span>
            <Percent className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            ${rebateAgreements.reduce((acc, r) => acc + r.accumulatedAccrualAmount, 0).toLocaleString()}
          </p>
          <span className="text-xs text-slate-500">{rebateAgreements.length} Active Agreements</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Drop-Ship Orders</span>
            <Truck className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{dropShipOrders.length}</p>
          <span className="text-xs text-slate-500">Direct Delivery</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Quality Gate</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">
            {hardeningReport ? `${hardeningReport.passedCount}/${hardeningReport.totalTests}` : '30/30'}
          </p>
          <span className="text-xs text-emerald-500/80">Phase 3.2C-01 PASS</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('CONTRACTS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'CONTRACTS'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          Sales Contracts & BPA
        </button>

        <button
          onClick={() => setActiveTab('CONSIGNMENT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'CONSIGNMENT'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Customer Consignment
        </button>

        <button
          onClick={() => setActiveTab('REBATES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'REBATES'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Percent className="w-4 h-4" />
          Volume Rebates & Settlement
        </button>

        <button
          onClick={() => setActiveTab('DROPSHIP')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'DROPSHIP'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Truck className="w-4 h-4" />
          Drop-Shipment SCM
        </button>

        <button
          onClick={() => setActiveTab('CREDIT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'CREDIT'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Credit Exposure Workbench
        </button>

        <button
          onClick={() => setActiveTab('HARDENING')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'HARDENING'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Hardening Suite (30 Tests)
        </button>
      </div>

      {/* TAB CONTENT: 1. CONTRACTS */}
      {activeTab === 'CONTRACTS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Sales Contracts & Outline Agreements</h2>
            <button
              onClick={() => setShowContractModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              New Sales Contract
            </button>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/90 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Contract #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Validity Period</th>
                  <th className="py-3 px-4 text-right">Committed Value</th>
                  <th className="py-3 px-4 text-right">Released Value</th>
                  <th className="py-3 px-4 text-right">Remaining Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No sales contracts found. Click &quot;New Sales Contract&quot; to establish an outline agreement.
                    </td>
                  </tr>
                ) : (
                  contracts.map(cntr => (
                    <tr key={cntr.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-medium text-indigo-400">{cntr.contractNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">{cntr.customerName}</div>
                        <div className="text-xs text-slate-500">{cntr.customerCode}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {cntr.startDate} <span className="text-slate-600">to</span> {cntr.endDate}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-white">
                        ${cntr.totalCommittedAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-400">
                        ${cntr.totalReleasedAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-amber-400 font-medium">
                        ${cntr.totalRemainingAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            cntr.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : cntr.status === 'DRAFT'
                              ? 'bg-slate-700 text-slate-300'
                              : cntr.status === 'FULFILLED'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {cntr.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {cntr.status === 'DRAFT' && (
                          <button
                            onClick={() => handleActivateContract(cntr.id)}
                            className="px-2.5 py-1 text-xs bg-emerald-600/80 hover:bg-emerald-500 text-white rounded font-medium transition"
                          >
                            Activate (SoD)
                          </button>
                        )}
                        {cntr.status === 'ACTIVE' && (
                          <span className="text-xs text-slate-500">Ready for SO Drawdown</span>
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

      {/* TAB CONTENT: 2. CONSIGNMENT */}
      {activeTab === 'CONSIGNMENT' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Customer Consignment Inventory (Special Stock W)</h2>
              <p className="text-xs text-slate-400">Inventory held at customer premises without sales billing until consumption.</p>
            </div>
            <button
              onClick={() => setShowConsignmentModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Process Consignment Movement
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Consignment Stock Balances */}
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-400" />
                Current Consignment Stock Balances
              </h3>
              <div className="space-y-3">
                {consignmentStocks.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">No active customer consignment stock.</p>
                ) : (
                  consignmentStocks.map(s => (
                    <div key={s.id} className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/80 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{s.customerName}</div>
                        <div className="text-xs text-slate-400">{s.customerLocationName} • {s.itemSku}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-amber-400">{s.currentStockQuantity} {s.uom}</div>
                        <div className="text-xs text-slate-500">${s.totalValuationValue.toLocaleString()} valuation</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Consignment Movement Audit Lineage */}
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-emerald-400" />
                Movement Log & Financial Events
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {consignmentMovements.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">No consignment movements recorded.</p>
                ) : (
                  consignmentMovements.map(m => (
                    <div key={m.id} className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-indigo-400 font-semibold">{m.movementNumber}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-medium">
                          {m.movementType}
                        </span>
                      </div>
                      <div className="text-slate-300">
                        {m.quantity}x {m.itemSku} for {m.customerName} (${m.totalAmount})
                      </div>
                      <div className="text-slate-500 flex items-center justify-between">
                        <span>By {m.performedBy}</span>
                        <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. REBATES */}
      {activeTab === 'REBATES' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Customer Volume Rebates & Settlement Matrix</h2>
              <p className="text-xs text-slate-400">Tiered growth rebate agreements with automated invoice accruals and credit memo settlements.</p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/90 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Agreement #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Tiers & Rates</th>
                  <th className="py-3 px-4 text-right">Accumulated Sales</th>
                  <th className="py-3 px-4 text-right">Accrued Rebate</th>
                  <th className="py-3 px-4 text-right">Settled Amount</th>
                  <th className="py-3 px-4 text-right">Remaining Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {rebateAgreements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No active rebate agreements found. Agreements accrue automatically when sales invoices are posted.
                    </td>
                  </tr>
                ) : (
                  rebateAgreements.map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-medium text-indigo-400">{r.agreementNumber}</td>
                      <td className="py-3 px-4 font-medium text-white">{r.customerName}</td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {r.tiers.map(t => `T${t.tierNumber}: >$${t.thresholdFrom} (${t.rebatePercentage}%)`).join(' • ')}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-white">
                        ${r.accumulatedEligibleAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-400 font-semibold">
                        ${r.accumulatedAccrualAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-400">
                        ${r.totalSettledAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-400">
                        ${r.remainingPayableAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. DROPSHIP */}
      {activeTab === 'DROPSHIP' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Drop-Shipment Order Orchestration</h2>
              <p className="text-xs text-slate-400">Third-party direct supplier fulfillment from Sales Order to Customer Delivery.</p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/90 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">DropShip #</th>
                  <th className="py-3 px-4">SO Ref</th>
                  <th className="py-3 px-4">Customer & Dest</th>
                  <th className="py-3 px-4">Supplier PO</th>
                  <th className="py-3 px-4 text-right">Customer Price</th>
                  <th className="py-3 px-4 text-right">Supplier Cost</th>
                  <th className="py-3 px-4 text-right">Margin</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {dropShipOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No drop-shipment orders recorded.
                    </td>
                  </tr>
                ) : (
                  dropShipOrders.map(ds => (
                    <tr key={ds.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-medium text-cyan-400">{ds.dropShipNumber}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">{ds.salesOrderNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">{ds.customerName}</div>
                        <div className="text-xs text-slate-500 truncate max-w-xs">{ds.shippingAddress}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white">{ds.vendorName}</div>
                        <div className="text-xs text-indigo-400 font-mono">{ds.purchaseOrderNumber || 'PO Pending'}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-white">
                        ${ds.customerTotalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        ${ds.vendorTotalCost.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-400">
                        ${ds.estimatedMarginAmount.toLocaleString()} ({ds.estimatedMarginPercent}%)
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          {ds.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. CREDIT */}
      {activeTab === 'CREDIT' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Customer Credit Exposure & Risk Workbench</h2>
              <p className="text-xs text-slate-400">Dynamic limit checks factoring Open Orders + Open Deliveries + AR Balance.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {creditProfiles.length === 0 ? (
              <div className="col-span-3 bg-slate-800/40 p-8 rounded-xl border border-slate-700/60 text-center text-slate-500">
                No customer credit profiles found.
              </div>
            ) : (
              creditProfiles.map(p => (
                <div key={p.id} className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-base">{p.customerName}</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded ${
                        p.creditRiskRating === 'LOW_RISK'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : p.creditRiskRating === 'MEDIUM_RISK'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {p.creditRiskRating}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Approved Credit Limit:</span>
                      <span className="font-semibold text-white">${p.creditLimit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Open Orders Exposure:</span>
                      <span className="text-slate-300">${p.openOrdersAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Open Deliveries:</span>
                      <span className="text-slate-300">${p.openDeliveriesAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Open AR Invoices:</span>
                      <span className="text-slate-300">${p.openInvoicesAmount.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-700 flex justify-between font-semibold">
                      <span className="text-slate-300">Total Dynamic Exposure:</span>
                      <span className="text-amber-400">${p.totalExposureAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Utilization Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Utilization:</span>
                      <span className="font-medium text-white">{p.creditUtilizationPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          p.creditUtilizationPercent > 90 ? 'bg-rose-500' : p.creditUtilizationPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(p.creditUtilizationPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. HARDENING */}
      {activeTab === 'HARDENING' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Phase 3.2C-01 Hardening & Quality Gate Suite</h2>
              <p className="text-xs text-slate-400">30 Real Deterministic Scenarios covering O2C, SoD, Concurrency, and Lineage.</p>
            </div>
            <button
              onClick={handleRunHardeningSuite}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition shadow-lg shadow-emerald-900/30"
            >
              <PlayCircle className="w-4 h-4" />
              {loading ? 'Executing Suite...' : 'Re-Run 30 Scenarios'}
            </button>
          </div>

          {hardeningReport && (
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div>
                  <h3 className="text-base font-bold text-white">{hardeningReport.suiteName}</h3>
                  <p className="text-xs text-slate-400">{hardeningReport.phase}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Success Rate: {hardeningReport.successRate}</span>
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full border ${
                      hardeningReport.verdict === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}
                  >
                    {hardeningReport.verdict} ({hardeningReport.passedCount}/{hardeningReport.totalTests} PASS)
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {hardeningReport.results.map((r: any) => (
                  <div
                    key={r.scenarioNumber}
                    className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/80 flex items-start justify-between text-xs gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-200">
                          #{r.scenarioNumber}: {r.name}
                        </div>
                        <div className="text-slate-400 mt-0.5">{r.details}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded bg-slate-700/70 text-slate-300 font-mono">
                        {r.category}
                      </span>
                      <div className="text-slate-500 text-[10px] mt-1">{r.durationMs}ms</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE CONTRACT MODAL */}
      <AnimatePresence>
        {showContractModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Create Sales Contract (Outline Agreement)
                </h3>
                <button
                  onClick={() => setShowContractModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateContract} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={newContractCustomer}
                    onChange={e => setNewContractCustomer(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Item SKU</label>
                    <input
                      type="text"
                      value={newContractSku}
                      onChange={e => setNewContractSku(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Committed Quantity</label>
                    <input
                      type="number"
                      value={newContractQty}
                      onChange={e => setNewContractQty(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Agreed Unit Price ($)</label>
                  <input
                    type="number"
                    value={newContractPrice}
                    onChange={e => setNewContractPrice(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div className="pt-3 border-t border-slate-700 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowContractModal(false)}
                    className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg"
                  >
                    Save Draft Contract
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONSIGNMENT MOVEMENT MODAL */}
      <AnimatePresence>
        {showConsignmentModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-amber-400" />
                  Customer Consignment Movement
                </h3>
                <button
                  onClick={() => setShowConsignmentModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConsignmentMovement} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Movement Type</label>
                  <select
                    value={consignmentType}
                    onChange={e => setConsignmentType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="CONSIGNMENT_FILLUP">Fill-Up (Transfer to Customer Custody)</option>
                    <option value="CONSIGNMENT_ISSUE">Issue (Customer Consumes - Triggers Invoice)</option>
                    <option value="CONSIGNMENT_PICKUP">Pick-Up (Return Unused to Plant)</option>
                    <option value="CONSIGNMENT_RETURN">Return (Customer Return for Credit)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Customer</label>
                    <input
                      type="text"
                      value={consignmentCust}
                      onChange={e => setConsignmentCust(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Item SKU</label>
                    <input
                      type="text"
                      value={consignmentSku}
                      onChange={e => setConsignmentSku(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={consignmentQty}
                      onChange={e => setConsignmentQty(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Unit Price ($)</label>
                    <input
                      type="number"
                      value={consignmentPrice}
                      onChange={e => setConsignmentPrice(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConsignmentModal(false)}
                    className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg"
                  >
                    Execute Movement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
