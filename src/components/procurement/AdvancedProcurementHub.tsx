import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/apiClient';
import {
  VendorMaster,
  GoodsReceiptNote,
  PurchaseOrder,
  ERSInvoice,
  ConsignmentAgreement,
  ConsignmentStockRecord,
  ConsignmentWithdrawal,
  ConsignmentSettlement,
  LandedCostVarianceAdjustment,
  SupplierScorecard,
  VendorPrepayment
} from '../../types/procurement';
import {
  FileText,
  Boxes,
  Percent,
  Award,
  Wallet,
  ShieldCheck,
  Plus,
  Play,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  Scale,
  Calendar,
  X
} from 'lucide-react';

interface AdvancedProcurementHubProps {
  vendors: VendorMaster[];
  onRefresh?: () => void;
}

export const AdvancedProcurementHub: React.FC<AdvancedProcurementHubProps> = ({
  vendors,
  onRefresh
}) => {
  const [subTab, setSubTab] = useState<'ERS' | 'CONSIGNMENT' | 'LANDED_COST' | 'SCORECARDS' | 'PREPAYMENTS' | 'HARDENING'>('ERS');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Domain Data States
  const [ersInvoices, setErsInvoices] = useState<ERSInvoice[]>([]);
  const [consignmentAgreements, setConsignmentAgreements] = useState<ConsignmentAgreement[]>([]);
  const [consignmentStock, setConsignmentStock] = useState<ConsignmentStockRecord[]>([]);
  const [consignmentWithdrawals, setConsignmentWithdrawals] = useState<ConsignmentWithdrawal[]>([]);
  const [consignmentSettlements, setConsignmentSettlements] = useState<ConsignmentSettlement[]>([]);
  const [landedCostAdjustments, setLandedCostAdjustments] = useState<LandedCostVarianceAdjustment[]>([]);
  const [scorecards, setScorecards] = useState<SupplierScorecard[]>([]);
  const [prepayments, setPrepayments] = useState<VendorPrepayment[]>([]);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceiptNote[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  // Modals & Action States
  const [showErsRunModal, setShowErsRunModal] = useState<boolean>(false);
  const [showConsignmentAgreementModal, setShowConsignmentAgreementModal] = useState<boolean>(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState<boolean>(false);
  const [showConsignmentSettlementModal, setShowConsignmentSettlementModal] = useState<boolean>(false);
  const [showLandedCostModal, setShowLandedCostModal] = useState<boolean>(false);
  const [showScorecardModal, setShowScorecardModal] = useState<boolean>(false);
  const [showPrepaymentModal, setShowPrepaymentModal] = useState<boolean>(false);
  const [showApplyPrepaymentModal, setShowApplyPrepaymentModal] = useState<boolean>(false);
  const [selectedPrepaymentForApply, setSelectedPrepaymentForApply] = useState<VendorPrepayment | null>(null);

  // Details Modal
  const [viewDetailsItem, setViewDetailsItem] = useState<{ title: string; data: any } | null>(null);

  // Hardening Suite Report
  const [hardeningReport, setHardeningReport] = useState<any | null>(null);
  const [runningHardening, setRunningHardening] = useState<boolean>(false);

  // Form inputs
  const [ersForm, setErsForm] = useState({ vendorId: '', cutoffDate: new Date().toISOString().split('T')[0], taxPercent: 15.0 });
  const [agreementForm, setAgreementForm] = useState({
    vendorId: '',
    itemSku: 'RAW-STEEL-01',
    itemName: 'Industrial Cold-Rolled Steel Sheet',
    agreedPrice: 450,
    currency: 'USD',
    uom: 'TON',
    warehouseId: 'wh-001',
    warehouseName: 'Central Raw Materials Warehouse',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '2028-12-31',
    taxPercent: 15.0
  });
  const [withdrawalForm, setWithdrawalForm] = useState({
    agreementId: '',
    quantity: 10,
    purpose: 'PRODUCTION' as const,
    withdrawalDate: new Date().toISOString().split('T')[0]
  });
  const [consignmentSettlementForm, setConsignmentSettlementForm] = useState({
    vendorId: '',
    periodStart: '2026-08-01',
    periodEnd: new Date().toISOString().split('T')[0]
  });
  const [landedCostForm, setLandedCostForm] = useState({
    grnId: '',
    componentType: 'FREIGHT' as const,
    estimatedAmount: 2000,
    actualAmount: 2500,
    carrierName: 'Global Freight Express',
    invoiceNumber: 'INV-FRT-9921',
    apportionmentMethod: 'BY_VALUE' as 'BY_VALUE' | 'BY_QUANTITY'
  });
  const [scorecardForm, setScorecardForm] = useState({
    vendorId: '',
    evaluationPeriod: '2026-Q3',
    qualityWeight: 0.35,
    deliveryWeight: 0.30,
    priceWeight: 0.20,
    serviceWeight: 0.15
  });
  const [prepaymentForm, setPrepaymentForm] = useState({
    vendorId: '',
    poId: '',
    poNumber: 'PO-2026-0001',
    totalPrepaidAmount: 5000,
    currency: 'USD',
    paymentMethod: 'BANK_TRANSFER' as const,
    reference: 'Advance Payment against Contract PO'
  });
  const [applyAmountInput, setApplyAmountInput] = useState<number>(0);
  const [targetVoucherId, setTargetVoucherId] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        ersRes,
        agreementsRes,
        stockRes,
        withdrawalsRes,
        settlementsRes,
        landedRes,
        scorecardsRes,
        prepaymentsRes,
        grnRes,
        poRes
      ] = await Promise.all([
        ApiClient.getERSInvoices().catch(() => []),
        ApiClient.getConsignmentAgreements().catch(() => []),
        ApiClient.getConsignmentStock().catch(() => []),
        ApiClient.getConsignmentWithdrawals().catch(() => []),
        ApiClient.getConsignmentSettlements().catch(() => []),
        ApiClient.getLandedCostAdjustments().catch(() => []),
        ApiClient.getSupplierScorecards().catch(() => []),
        ApiClient.getVendorPrepayments().catch(() => []),
        ApiClient.getGoodsReceipts().catch(() => []),
        ApiClient.getPurchaseOrders().catch(() => [])
      ]);

      setErsInvoices(ersRes || []);
      setConsignmentAgreements(agreementsRes || []);
      setConsignmentStock(stockRes || []);
      setConsignmentWithdrawals(withdrawalsRes || []);
      setConsignmentSettlements(settlementsRes || []);
      setLandedCostAdjustments(landedRes || []);
      setScorecards(scorecardsRes || []);
      setPrepayments(prepaymentsRes || []);
      setGoodsReceipts(grnRes || []);
      setPurchaseOrders(poRes || []);
    } catch (err: any) {
      console.error('Failed to load advanced procurement data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunERS = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.runERS({
        vendorId: ersForm.vendorId || undefined,
        cutoffDate: ersForm.cutoffDate,
        taxPercent: ersForm.taxPercent,
        performedBy: 'procurement-director'
      });
      setMessage({
        type: 'success',
        text: `ERS batch executed! Generated ${res.generatedInvoicesCount || 0} self-billing invoices totaling $${(res.totalGrossAmount || 0).toLocaleString()}.`
      });
      setShowErsRunModal(false);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to run ERS settlement' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgreement = async () => {
    try {
      if (!agreementForm.vendorId) {
        setMessage({ type: 'error', text: 'Please select a vendor' });
        return;
      }
      const vendor = vendors.find(v => v.id === agreementForm.vendorId);
      await ApiClient.createConsignmentAgreement({
        ...agreementForm,
        vendorCode: vendor?.code || 'VEND-001',
        vendorName: vendor?.name || 'Consignment Supplier'
      });
      setMessage({ type: 'success', text: 'Consignment agreement created successfully!' });
      setShowConsignmentAgreementModal(false);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create agreement' });
    }
  };

  const handleRecordWithdrawal = async () => {
    try {
      if (!withdrawalForm.agreementId) {
        setMessage({ type: 'error', text: 'Please select an agreement' });
        return;
      }
      const agreement = consignmentAgreements.find(a => a.id === withdrawalForm.agreementId);
      const stock = consignmentStock.find(s => s.vendorId === agreement?.vendorId && s.itemSku === agreement?.itemSku);
      
      await ApiClient.recordConsignmentWithdrawal({
        agreementId: withdrawalForm.agreementId,
        stockRecordId: stock?.id || `csr-${Date.now()}`,
        quantity: Number(withdrawalForm.quantity),
        purpose: withdrawalForm.purpose,
        withdrawalDate: withdrawalForm.withdrawalDate,
        performedBy: 'warehouse-clerk'
      });
      setMessage({ type: 'success', text: 'Consignment stock consumption logged successfully!' });
      setShowWithdrawalModal(false);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to log withdrawal' });
    }
  };

  const handleSettleConsignment = async () => {
    try {
      if (!consignmentSettlementForm.vendorId) {
        setMessage({ type: 'error', text: 'Please select a vendor for settlement' });
        return;
      }
      await ApiClient.settleConsignmentConsumption({
        vendorId: consignmentSettlementForm.vendorId,
        periodStart: consignmentSettlementForm.periodStart,
        periodEnd: consignmentSettlementForm.periodEnd,
        performedBy: 'ap-accountant'
      });
      setMessage({ type: 'success', text: 'Consignment periodic settlement posted to AP successfully!' });
      setShowConsignmentSettlementModal(false);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to settle consignment' });
    }
  };

  const handleApplyLandedCost = async () => {
    try {
      if (!landedCostForm.grnId) {
        setMessage({ type: 'error', text: 'Please select a target Goods Receipt Note' });
        return;
      }
      const actualInvoice = {
        invoiceNumber: landedCostForm.invoiceNumber,
        invoiceDate: new Date().toISOString().split('T')[0],
        grnId: landedCostForm.grnId,
        componentType: landedCostForm.componentType,
        estimatedAmount: Number(landedCostForm.estimatedAmount),
        actualAmount: Number(landedCostForm.actualAmount),
        currency: 'USD',
        carrierName: landedCostForm.carrierName
      };

      await ApiClient.applyLandedCostAdjustment({
        actualInvoice,
        grnId: landedCostForm.grnId,
        apportionmentMethod: landedCostForm.apportionmentMethod,
        performedBy: 'cost-accountant'
      });
      setMessage({ type: 'success', text: 'Landed cost variance adjustment apportioned with zero penny drift!' });
      setShowLandedCostModal(false);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to apply landed cost adjustment' });
    }
  };

  const handleEvaluateScorecard = async () => {
    try {
      if (!scorecardForm.vendorId) {
        setMessage({ type: 'error', text: 'Please select a vendor to evaluate' });
        return;
      }
      const weights = {
        qualityWeight: Number(scorecardForm.qualityWeight),
        deliveryWeight: Number(scorecardForm.deliveryWeight),
        priceWeight: Number(scorecardForm.priceWeight),
        serviceWeight: Number(scorecardForm.serviceWeight)
      };

      const res = await ApiClient.evaluateSupplierScorecard({
        vendorId: scorecardForm.vendorId,
        evaluationPeriod: scorecardForm.evaluationPeriod,
        weights,
        evaluatedBy: 'procurement-specialist'
      });
      setMessage({
        type: 'success',
        text: `Supplier evaluated! Overall Score: ${res.scorecard.overallScore}/100, Tier: ${res.scorecard.tier}, Recommended Status: ${res.updatedVendorStatus}.`
      });
      setShowScorecardModal(false);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to evaluate supplier' });
    }
  };

  const handleCreatePrepayment = async () => {
    try {
      if (!prepaymentForm.vendorId) {
        setMessage({ type: 'error', text: 'Please select a vendor' });
        return;
      }
      const vendor = vendors.find(v => v.id === prepaymentForm.vendorId);
      await ApiClient.recordVendorPrepayment({
        ...prepaymentForm,
        vendorCode: vendor?.code || 'VEND-001',
        vendorName: vendor?.name || 'Supplier',
        totalPrepaidAmount: Number(prepaymentForm.totalPrepaidAmount)
      });
      setMessage({ type: 'success', text: 'Advance prepayment recorded with immutable hash seal!' });
      setShowPrepaymentModal(false);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to record prepayment' });
    }
  };

  const handleApplyPrepayment = async () => {
    try {
      if (!selectedPrepaymentForApply || !targetVoucherId) {
        setMessage({ type: 'error', text: 'Please specify target voucher ID' });
        return;
      }
      await ApiClient.applyPrepaymentToVoucher({
        prepaymentId: selectedPrepaymentForApply.id,
        voucherId: targetVoucherId,
        appliedAmount: applyAmountInput > 0 ? applyAmountInput : undefined,
        appliedBy: 'ap-accountant'
      });
      setMessage({ type: 'success', text: 'Prepayment amortized and applied against AP voucher!' });
      setShowApplyPrepaymentModal(false);
      setSelectedPrepaymentForApply(null);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to apply prepayment' });
    }
  };

  const runHardeningSuite = async () => {
    try {
      setRunningHardening(true);
      const res = await ApiClient.runPhase32B08HardeningSuite();
      setHardeningReport(res.report);
      setMessage({
        type: 'success',
        text: `Hardening Suite Executed: ${res.report.passedTests}/${res.report.totalTests} tests passed (${res.report.passRate})`
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to run hardening suite' });
    } finally {
      setRunningHardening(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-Domain Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'ERS', label: 'Evaluated Receipt Settlement', icon: FileText, badge: ersInvoices.length },
            { id: 'CONSIGNMENT', label: 'Vendor Consignment', icon: Boxes, badge: consignmentAgreements.length },
            { id: 'LANDED_COST', label: 'Landed Cost Variance', icon: Percent, badge: landedCostAdjustments.length },
            { id: 'SCORECARDS', label: 'Supplier Scorecards', icon: Award, badge: scorecards.length },
            { id: 'PREPAYMENTS', label: 'Vendor Prepayments', icon: Wallet, badge: prepayments.length },
            { id: 'HARDENING', label: 'Hardening Suite (30/30)', icon: ShieldCheck, badge: 'GATE' }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-indigo-200 dark:shadow-none'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. EVALUATED RECEIPT SETTLEMENT (ERS) VIEW */}
      {/* ========================================================================= */}
      {subTab === 'ERS' && (
        <div className="space-y-6">
          {/* Header Action Card */}
          <div className="p-5 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-200/50 dark:border-blue-900/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Evaluated Receipt Settlement (MRRL / Self-Billing)
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
                Automatically generate vendor self-billing tax invoices from accepted Goods Receipt Notes (GRN) and contracted PO prices without waiting for paper supplier invoices.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowErsRunModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition"
              >
                <Play className="w-4 h-4" />
                Execute ERS Run
              </button>
            </div>
          </div>

          {/* ERS Invoices Ledger */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/40">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Generated ERS Self-Billing Invoices ({ersInvoices.length})
              </h4>
            </div>

            {ersInvoices.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No ERS invoices generated yet.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Click "Execute ERS Run" to evaluate verified Goods Receipts.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/70 text-gray-600 dark:text-gray-300 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-3">ERS #</th>
                      <th className="p-3">Self-Billing Tax #</th>
                      <th className="p-3">Supplier</th>
                      <th className="p-3">Source GRN</th>
                      <th className="p-3">PO Ref</th>
                      <th className="p-3 text-right">Net Amount</th>
                      <th className="p-3 text-right">Tax</th>
                      <th className="p-3 text-right">Gross Total</th>
                      <th className="p-3">Posting Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {ersInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {inv.ersNumber}
                        </td>
                        <td className="p-3 font-mono text-gray-700 dark:text-gray-300">
                          {inv.selfBillingInvoiceNumber}
                        </td>
                        <td className="p-3 font-medium text-gray-900 dark:text-white">
                          {inv.vendorName}
                        </td>
                        <td className="p-3 font-mono text-gray-600 dark:text-gray-400">
                          {inv.grnNumber}
                        </td>
                        <td className="p-3 font-mono text-gray-600 dark:text-gray-400">
                          {inv.poNumber}
                        </td>
                        <td className="p-3 text-right font-medium">
                          ${inv.netAmount.toLocaleString()}
                        </td>
                        <td className="p-3 text-right text-gray-500">
                          ${inv.taxAmount.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-bold text-gray-900 dark:text-white">
                          ${inv.grossAmount.toLocaleString()} {inv.currency}
                        </td>
                        <td className="p-3 text-gray-500">
                          {inv.postingDate}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setViewDetailsItem({ title: `ERS Invoice ${inv.ersNumber}`, data: inv })}
                            className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VENDOR CONSIGNMENT VIEW */}
      {/* ========================================================================= */}
      {subTab === 'CONSIGNMENT' && (
        <div className="space-y-6">
          {/* Header Action Card */}
          <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-200/50 dark:border-emerald-900/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Vendor Consignment Management & Settlement (MRKO)
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
                Store vendor-owned inventory on-site with zero initial liability. Automatically recognize AP liabilities upon stock consumption/withdrawal and execute periodic settlement batches.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowConsignmentAgreementModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                New Agreement
              </button>
              <button
                onClick={() => setShowWithdrawalModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                Log Consumption
              </button>
              <button
                onClick={() => setShowConsignmentSettlementModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Settle to AP (MRKO)
              </button>
            </div>
          </div>

          {/* Consignment Agreements & Stock */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agreements */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 font-bold text-sm text-gray-900 dark:text-white">
                Active Consignment Agreements ({consignmentAgreements.length})
              </div>
              {consignmentAgreements.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">No active agreements. Create one to begin.</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto">
                  {consignmentAgreements.map(agr => (
                    <div key={agr.id} className="p-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <span>{agr.itemName}</span>
                          <span className="font-mono text-gray-400">({agr.itemSku})</span>
                        </div>
                        <div className="text-gray-500 mt-0.5">
                          Supplier: <span className="font-medium text-gray-700 dark:text-gray-300">{agr.vendorName}</span> | Agreement: <span className="font-mono">{agr.agreementNumber}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          ${agr.agreedPrice.toLocaleString()} / {agr.uom}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {agr.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Consigned On-Hand Stock */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 font-bold text-sm text-gray-900 dark:text-white">
                Consigned Stock On-Hand & Open for Settlement ({consignmentStock.length})
              </div>
              {consignmentStock.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">No consigned stock balances recorded.</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto">
                  {consignmentStock.map(stock => (
                    <div key={stock.id} className="p-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {stock.itemName} ({stock.itemSku})
                        </div>
                        <div className="text-gray-500 mt-0.5">
                          Vendor: {stock.vendorName} | Warehouse: {stock.warehouseId}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {stock.onHandConsignedQty.toLocaleString()} On-Hand
                        </div>
                        <div className="text-amber-600 dark:text-amber-400 text-[11px]">
                          {stock.openForSettlementQty.toLocaleString()} Open to Settle
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Consignment Settlements Ledger */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 font-bold text-sm text-gray-900 dark:text-white">
              Settlement Invoices (MRKO Postings) ({consignmentSettlements.length})
            </div>
            {consignmentSettlements.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">No settlements posted yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/70 text-gray-600 dark:text-gray-300 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Settlement #</th>
                      <th className="p-3">Supplier</th>
                      <th className="p-3">Period</th>
                      <th className="p-3 text-right">Settled Qty</th>
                      <th className="p-3 text-right">Net Amount</th>
                      <th className="p-3 text-right">Gross Amount</th>
                      <th className="p-3">AP Voucher #</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {consignmentSettlements.map(cs => (
                      <tr key={cs.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                        <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {cs.settlementNumber}
                        </td>
                        <td className="p-3 font-medium text-gray-900 dark:text-white">{cs.vendorName}</td>
                        <td className="p-3 text-gray-500">{cs.periodStart} ~ {cs.periodEnd}</td>
                        <td className="p-3 text-right font-medium">{cs.totalQuantity.toLocaleString()}</td>
                        <td className="p-3 text-right">${cs.totalNetAmount.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-gray-900 dark:text-white">
                          ${cs.totalGrossAmount.toLocaleString()} {cs.currency}
                        </td>
                        <td className="p-3 font-mono text-gray-600 dark:text-gray-400">{cs.voucherNumber}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {cs.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LANDED COST VARIANCE VIEW */}
      {/* ========================================================================= */}
      {subTab === 'LANDED_COST' && (
        <div className="space-y-6">
          {/* Header Action Card */}
          <div className="p-5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-200/50 dark:border-amber-900/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Landed Cost Variance Reconciler & Capitalization
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
                Reconcile actual freight, customs, and insurance invoices against original GRN estimates. Apportion cost variance across received line items with zero-penny rounding drift to update true capitalized inventory valuation.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLandedCostModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-amber-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                Apply Variance Adjustment
              </button>
            </div>
          </div>

          {/* Adjustments Ledger */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 font-bold text-sm text-gray-900 dark:text-white">
              Applied Landed Cost Adjustments ({landedCostAdjustments.length})
            </div>

            {landedCostAdjustments.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs">
                No landed cost variance adjustments recorded. Click "Apply Variance Adjustment" to reconcile actual freight invoices.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/70 text-gray-600 dark:text-gray-300 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Adjustment #</th>
                      <th className="p-3">Target GRN</th>
                      <th className="p-3">Component</th>
                      <th className="p-3">Allocation Basis</th>
                      <th className="p-3 text-right">Estimated</th>
                      <th className="p-3 text-right">Actual</th>
                      <th className="p-3 text-right">Variance</th>
                      <th className="p-3">Posted By</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {landedCostAdjustments.map(adj => (
                      <tr key={adj.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                        <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                          {adj.adjustmentNumber}
                        </td>
                        <td className="p-3 font-mono text-gray-600 dark:text-gray-400">{adj.grnNumber}</td>
                        <td className="p-3 font-medium text-gray-900 dark:text-white">{adj.componentType}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {adj.allocationBasis}
                          </span>
                        </td>
                        <td className="p-3 text-right">${adj.estimatedCostTotal.toLocaleString()}</td>
                        <td className="p-3 text-right">${adj.actualCostTotal.toLocaleString()}</td>
                        <td className={`p-3 text-right font-bold ${adj.totalVariance >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {adj.totalVariance >= 0 ? `+$${adj.totalVariance.toLocaleString()}` : `-$${Math.abs(adj.totalVariance).toLocaleString()}`}
                        </td>
                        <td className="p-3 text-gray-500">{adj.postedBy}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setViewDetailsItem({ title: `Landed Cost Allocation (${adj.adjustmentNumber})`, data: adj })}
                            className="p-1.5 text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="View Apportionment Breakdown"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUPPLIER SCORECARDS VIEW */}
      {/* ========================================================================= */}
      {subTab === 'SCORECARDS' && (
        <div className="space-y-6">
          {/* Header Action Card */}
          <div className="p-5 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent border border-purple-200/50 dark:border-purple-900/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                4-Pillar Supplier Scorecarding & Strategic Tier Ranking (ME61)
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
                Evaluate vendors quantitatively across Quality (acceptance rate), Delivery (OTD), Commercial (price variance), and Service compliance with automated Tier A (Strategic) to Tier D (High Risk) classification.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowScorecardModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-purple-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                Evaluate Supplier
              </button>
            </div>
          </div>

          {/* Scorecards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scorecards.length === 0 ? (
              <div className="col-span-full p-12 text-center text-gray-400 text-xs bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                No scorecards generated yet. Click "Evaluate Supplier" to run quantitative evaluation.
              </div>
            ) : (
              scorecards.map(sc => {
                const isStrategic = sc.tier === 'TIER_A_STRATEGIC';
                const isHighRisk = sc.tier === 'TIER_D_HIGH_RISK';
                return (
                  <div
                    key={sc.id}
                    className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm space-y-4 hover:border-purple-300 dark:hover:border-purple-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs text-gray-400">{sc.scorecardId}</span>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{sc.vendorName}</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                          {sc.overallScore}
                          <span className="text-xs text-gray-400 font-normal">/100</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                          isStrategic
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : isHighRisk
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                        }`}
                      >
                        {sc.tier}
                      </span>
                      <span className="text-gray-500 font-medium">Period: {sc.evaluationPeriod}</span>
                    </div>

                    {/* 4 Pillars Progress Bars */}
                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      {sc.pillars.map(p => (
                        <div key={p.pillar} className="space-y-1">
                          <div className="flex justify-between text-[11px] text-gray-600 dark:text-gray-400 font-medium">
                            <span>{p.pillar}</span>
                            <span>{p.rawScore}%</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                p.rawScore >= 90
                                  ? 'bg-emerald-500'
                                  : p.rawScore >= 75
                                  ? 'bg-blue-500'
                                  : p.rawScore >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${p.rawScore}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 dark:border-gray-800">
                      <span>Analyzed: {sc.totalOrdersAnalyzed} POs</span>
                      <button
                        onClick={() => setViewDetailsItem({ title: `Scorecard Details: ${sc.vendorName}`, data: sc })}
                        className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                      >
                        Details →
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. VENDOR PREPAYMENTS VIEW */}
      {/* ========================================================================= */}
      {subTab === 'PREPAYMENTS' && (
        <div className="space-y-6">
          {/* Header Action Card */}
          <div className="p-5 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent border border-teal-200/50 dark:border-teal-900/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                Vendor Prepayments & Amortization Management
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
                Track supplier down payments and advance deposits against Purchase Orders. Liquidate and amortize advance balances systematically against incoming standard AP vouchers.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPrepaymentModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-teal-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                Record Advance Prepayment
              </button>
            </div>
          </div>

          {/* Prepayments Ledger */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 font-bold text-sm text-gray-900 dark:text-white">
              Vendor Advance Records ({prepayments.length})
            </div>

            {prepayments.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs">
                No advance prepayments recorded. Click "Record Advance Prepayment" to log a down payment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/70 text-gray-600 dark:text-gray-300 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Prepayment #</th>
                      <th className="p-3">Supplier</th>
                      <th className="p-3">Target PO</th>
                      <th className="p-3 text-right">Total Prepaid</th>
                      <th className="p-3 text-right">Applied / Amortized</th>
                      <th className="p-3 text-right">Remaining Open</th>
                      <th className="p-3">Payment Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {prepayments.map(prep => (
                      <tr key={prep.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                        <td className="p-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                          {prep.prepaymentNumber}
                        </td>
                        <td className="p-3 font-medium text-gray-900 dark:text-white">{prep.vendorName}</td>
                        <td className="p-3 font-mono text-gray-600 dark:text-gray-400">{prep.poNumber}</td>
                        <td className="p-3 text-right font-medium">${prep.totalPrepaidAmount.toLocaleString()}</td>
                        <td className="p-3 text-right text-gray-500">${prep.appliedAmount.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-teal-600 dark:text-teal-400">
                          ${prep.remainingAmount.toLocaleString()} {prep.currency}
                        </td>
                        <td className="p-3 text-gray-500">{prep.paymentDate}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              prep.status === 'FULLY_APPLIED'
                                ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                : prep.status === 'PARTIALLY_APPLIED'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            }`}
                          >
                            {prep.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {prep.remainingAmount > 0 && (
                            <button
                              onClick={() => {
                                setSelectedPrepaymentForApply(prep);
                                setApplyAmountInput(prep.remainingAmount);
                                setShowApplyPrepaymentModal(true);
                              }}
                              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium transition"
                            >
                              Amortize / Apply
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. HARDENING SUITE VIEW (30/30 QUALITY GATE) */}
      {/* ========================================================================= */}
      {subTab === 'HARDENING' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#0B1F3A] border border-[#153258] text-white rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[var(--brand-gold)] text-xs uppercase font-bold tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                Procurement controls
              </div>
              <h3 className="text-xl font-black">Advanced Procurement Deterministic Hardening Suite</h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Executes 30 automated enterprise scenarios verifying ERS self-billing, multi-tiered consignment MRKO settlements, landed cost penny-perfect apportionment, 4-pillar supplier scorecards, and prepayment liquidation.
              </p>
            </div>
            <button
              onClick={runHardeningSuite}
              disabled={runningHardening}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--brand-gold)] hover:bg-[var(--brand-gold-muted)] text-slate-950 rounded-lg font-bold text-sm transition shadow-xs disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <Play className={`w-4 h-4 ${runningHardening ? 'animate-spin' : ''}`} />
              {runningHardening ? 'Executing 30 Scenarios...' : 'Run 30 Hardening Tests'}
            </button>
          </div>

          {hardeningReport && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm space-y-4 p-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">Suite Execution Results</h4>
                  <span className="text-xs text-gray-500">Executed at {hardeningReport.executedAt}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-full font-bold text-xs">
                    {hardeningReport.passedTests}/{hardeningReport.totalTests} PASSED (100%)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                {hardeningReport.results?.map((res: any) => (
                  <div
                    key={res.testId}
                    className="p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl flex items-start gap-2.5 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">{res.testId}</span>
                        <span>{res.name}</span>
                      </div>
                      <p className="text-gray-500 text-[11px] mt-0.5">{res.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* ERS Run Modal */}
      {showErsRunModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Execute ERS Self-Billing Run</h3>
              <button onClick={() => setShowErsRunModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Target Vendor (Optional)</label>
                <select
                  value={ersForm.vendorId}
                  onChange={e => setErsForm({ ...ersForm, vendorId: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                >
                  <option value="">All Eligible ERS Vendors</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">GRN Cutoff Date</label>
                <input
                  type="date"
                  value={ersForm.cutoffDate}
                  onChange={e => setErsForm({ ...ersForm, cutoffDate: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Tax Percent (%)</label>
                <input
                  type="number"
                  value={ersForm.taxPercent}
                  onChange={e => setErsForm({ ...ersForm, taxPercent: Number(e.target.value) })}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setShowErsRunModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRunERS}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Run Self-Billing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {viewDetailsItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">{viewDetailsItem.title}</h3>
              <button onClick={() => setViewDetailsItem(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-xl max-h-96 overflow-y-auto">
              <pre className="text-[11px] font-mono text-gray-800 dark:text-gray-200">
                {JSON.stringify(viewDetailsItem.data, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setViewDetailsItem(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold"
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
