import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/apiClient';
import {
  PurchaseOrder,
  VendorMaster,
  PurchaseRequisition,
  RequestForQuotation,
  PurchaseApprovalRule,
  PurchaseOrderAmendment,
  PaymentTerms,
  Incoterms,
  BuyerGroup,
  PurchasingOrganization
} from '../../types/procurement';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Send,
  X,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Clock,
  Layers,
  ChevronRight,
  DollarSign,
  FileText,
  Truck,
  Check,
  History,
  FileSpreadsheet,
  Building2,
  Calendar,
  Lock,
  Tag,
  ArrowRight
} from 'lucide-react';

interface PurchaseOrderHubProps {
  vendors: VendorMaster[];
  requisitions: PurchaseRequisition[];
  rfqs: RequestForQuotation[];
  paymentTerms: PaymentTerms[];
  incoterms: Incoterms[];
  buyerGroups: BuyerGroup[];
  purchasingOrgs: PurchasingOrganization[];
  productsList: any[];
  uomsList: any[];
  onRefresh: () => void;
  onSelectForReceipt?: (po: PurchaseOrder) => void;
  onSelectForAmend?: (po: PurchaseOrder) => void;
}

export const PurchaseOrderHub: React.FC<PurchaseOrderHubProps> = ({
  vendors,
  requisitions,
  rfqs,
  paymentTerms,
  incoterms,
  buyerGroups,
  purchasingOrgs,
  productsList,
  uomsList,
  onRefresh,
  onSelectForReceipt,
  onSelectForAmend
}) => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [poTypeFilter, setPoTypeFilter] = useState<string>('ALL');
  const [vendorFilter, setVendorFilter] = useState<string>('ALL');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showConvertPrModal, setShowConvertPrModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [poApprovalHistory, setPoApprovalHistory] = useState<{ approvalSteps: any[]; auditHistory: any[] } | null>(null);

  // Action Modals
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [approveStep, setApproveStep] = useState<number>(1);
  const [approveComments, setApproveComments] = useState<string>('Approved in accordance with procurement limits');
  const [approverRole, setApproverRole] = useState<string>('Procurement Manager');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('Commercial pricing discrepancy');
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false);
  const [transmissionMethod, setTransmissionMethod] = useState<'EMAIL' | 'EDI' | 'PORTAL' | 'MANUAL'>('EMAIL');
  const [showAckModal, setShowAckModal] = useState<boolean>(false);
  const [ackRef, setAckRef] = useState<string>('');
  const [ackEta, setAckEta] = useState<string>('');
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Operational cancellation');

  // Hardening Suite Modal
  const [showHardeningModal, setShowHardeningModal] = useState<boolean>(false);
  const [hardeningReport, setHardeningReport] = useState<any>(null);
  const [runningHardening, setRunningHardening] = useState<boolean>(false);

  // Direct PO Creation Form State
  const [newPoHeader, setNewPoHeader] = useState<{
    poType: 'STANDARD' | 'BLANKET' | 'CONTRACT' | 'SERVICES';
    vendorId: string;
    currency: string;
    paymentTermsId: string;
    incotermId: string;
    buyerGroupId: string;
    purchasingOrgId: string;
    departmentId: string;
    departmentName: string;
    costCenterId: string;
    costCenterName: string;
    warehouseId: string;
    warehouseName: string;
    targetDeliveryDate: string;
    notes: string;
  }>({
    poType: 'STANDARD',
    vendorId: vendors[0]?.id || '',
    currency: 'SAR',
    paymentTermsId: paymentTerms[0]?.id || 'pt-30',
    incotermId: incoterms[0]?.id || 'inco-cif',
    buyerGroupId: buyerGroups[0]?.id || 'bg-it',
    purchasingOrgId: purchasingOrgs[0]?.id || 'porg-001',
    departmentId: 'dept-02',
    departmentName: 'Finance & Treasury',
    costCenterId: 'cc-002',
    costCenterName: 'IT Infrastructure & Cloud',
    warehouseId: 'wh-001',
    warehouseName: 'Central Warehouse - Riyadh',
    targetDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    notes: 'Standard PO generated per Master Supply Agreement'
  });

  const [newPoItems, setNewPoItems] = useState<Array<{
    productId: string;
    itemSku: string;
    itemName: string;
    orderedQty: number;
    uom: string;
    unitPrice: number;
    discountPercent: number;
    taxRatePercent: number;
    priceTierApplied?: string;
    targetDeliveryDate?: string;
    deliverySchedules?: Array<{ scheduleNumber: number; plannedQty: number; promisedDeliveryDate: string }>;
  }>>([
    {
      productId: 'prod-srv-01',
      itemSku: 'HW-SRV-01',
      itemName: 'Enterprise Rack Server PowerEdge R750',
      orderedQty: 5,
      uom: 'PCS',
      unitPrice: 18500,
      discountPercent: 0,
      taxRatePercent: 15,
      priceTierApplied: 'BASE_MASTER_PRICE',
      deliverySchedules: [
        {
          scheduleNumber: 1,
          plannedQty: 5,
          promisedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
        }
      ]
    }
  ]);

  // PR to PO Conversion State
  const [selectedPrId, setSelectedPrId] = useState<string>('');
  const [convertVendorId, setConvertVendorId] = useState<string>('');

  useEffect(() => {
    loadPOs();
  }, []);

  const loadPOs = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getProcurementPurchaseOrders();
      setPurchaseOrders(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load purchase orders' });
    } finally {
      setLoading(false);
    }
  };

  const handleResolvePricing = async (index: number, vendorId: string, sku: string, qty: number, basePrice: number) => {
    try {
      const res = await ApiClient.resolveContractPricing({
        vendorId,
        itemSku: sku,
        quantity: qty,
        currency: newPoHeader.currency,
        basePrice,
        tenantId: 'ten-001'
      });
      const updated = [...newPoItems];
      if (res && updated[index]) {
        updated[index].unitPrice = res.unitPrice;
        updated[index].discountPercent = res.discountPercent || 0;
        updated[index].priceTierApplied = res.appliedTier;
        setNewPoItems(updated);
      }
    } catch (e) {
      console.warn('Pricing resolution fallback', e);
    }
  };

  const handleAddItem = () => {
    const firstProd = productsList[0] || { id: 'prod-srv-01', sku: 'HW-SRV-01', name: 'Enterprise Rack Server PowerEdge R750', baseUom: 'PCS', costPrice: 18500 };
    const newItem = {
      productId: firstProd.id,
      itemSku: firstProd.sku,
      itemName: firstProd.name,
      orderedQty: 1,
      uom: firstProd.baseUom || 'PCS',
      unitPrice: firstProd.costPrice || 1000,
      discountPercent: 0,
      taxRatePercent: 15,
      priceTierApplied: 'BASE_MASTER_PRICE',
      deliverySchedules: [
        {
          scheduleNumber: 1,
          plannedQty: 1,
          promisedDeliveryDate: newPoHeader.targetDeliveryDate
        }
      ]
    };
    setNewPoItems([...newPoItems, newItem]);
    if (newPoHeader.vendorId) {
      handleResolvePricing(newPoItems.length, newPoHeader.vendorId, newItem.itemSku, newItem.orderedQty, newItem.unitPrice);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (newPoItems.length <= 1) {
      setMessage({ type: 'error', text: 'A Purchase Order must contain at least one line item.' });
      return;
    }
    setNewPoItems(newPoItems.filter((_, idx) => idx !== index));
  };

  const handleProductChange = (index: number, prodId: string) => {
    const prod = productsList.find(p => p.id === prodId);
    if (!prod) return;
    const updated = [...newPoItems];
    updated[index] = {
      ...updated[index],
      productId: prod.id,
      itemSku: prod.sku,
      itemName: prod.name,
      uom: prod.baseUom || 'PCS',
      unitPrice: prod.costPrice || 1000
    };
    setNewPoItems(updated);
    if (newPoHeader.vendorId) {
      handleResolvePricing(index, newPoHeader.vendorId, prod.sku, updated[index].orderedQty, prod.costPrice || 1000);
    }
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedVendor = vendors.find(v => v.id === newPoHeader.vendorId);
      const res = await ApiClient.createPurchaseOrder(
        {
          ...newPoHeader,
          vendorName: selectedVendor?.name || 'Selected Vendor',
          tenantId: 'ten-001',
          companyId: 'comp-sa-01',
          branchId: 'br-ryd-01'
        },
        newPoItems
      );
      setMessage({ type: 'success', text: `Purchase Order ${res.poNumber} created successfully.` });
      setShowCreateModal(false);
      loadPOs();
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create PO' });
    }
  };

  const handleConvertPr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrId || !convertVendorId) {
      setMessage({ type: 'error', text: 'Please select both an Approved Requisition and a Vendor.' });
      return;
    }
    try {
      const res = await ApiClient.convertPRToPO(selectedPrId, convertVendorId);
      setMessage({ type: 'success', text: `Successfully converted PR into PO ${res.poNumber}.` });
      setShowConvertPrModal(false);
      loadPOs();
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to convert PR to PO' });
    }
  };

  const handleViewDetail = async (po: PurchaseOrder) => {
    setSelectedPo(po);
    setShowDetailModal(true);
    try {
      const history = await ApiClient.getPOApprovalHistory(po.id);
      setPoApprovalHistory(history);
    } catch (e) {
      console.warn('Failed to load approval history', e);
    }
  };

  const handleSubmitPo = async (po: PurchaseOrder) => {
    try {
      const res = await ApiClient.submitPurchaseOrder(po.id, po.version);
      setMessage({ type: 'success', text: `PO ${po.poNumber} submitted for approval.` });
      loadPOs();
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit PO' });
    }
  };

  const handleApprovePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPo) return;
    try {
      const res = await ApiClient.approvePurchaseOrder(
        selectedPo.id,
        approveStep,
        approveComments,
        selectedPo.version,
        approverRole,
        'usr-approver-01',
        'Sarah Al-Otaibi'
      );
      setMessage({ type: 'success', text: `PO ${selectedPo.poNumber} approved successfully (Step ${approveStep}).` });
      setShowApproveModal(false);
      loadPOs();
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to approve PO' });
    }
  };

  const handleRejectPo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPo) return;
    try {
      await ApiClient.rejectPurchaseOrder(
        selectedPo.id,
        rejectReason,
        selectedPo.version,
        'Procurement Manager'
      );
      setMessage({ type: 'success', text: `PO ${selectedPo.poNumber} rejected.` });
      setShowRejectModal(false);
      loadPOs();
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to reject PO' });
    }
  };

  const handleIssuePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPo) return;
    try {
      await ApiClient.issuePOToVendor(selectedPo.id, transmissionMethod, selectedPo.version);
      setMessage({ type: 'success', text: `PO ${selectedPo.poNumber} issued to vendor via ${transmissionMethod}.` });
      setShowIssueModal(false);
      loadPOs();
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to issue PO' });
    }
  };

  const handleAcknowledgePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPo) return;
    try {
      await ApiClient.acknowledgePO(
        selectedPo.id,
        ackRef || `CONF-${Date.now()}`,
        ackEta || new Date(Date.now() + 14 * 86400000).toISOString(),
        selectedPo.version
      );
      setMessage({ type: 'success', text: `PO ${selectedPo.poNumber} acknowledged by vendor.` });
      setShowAckModal(false);
      loadPOs();
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to record vendor acknowledgment' });
    }
  };

  const handleCancelPo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPo) return;
    try {
      await ApiClient.cancelPurchaseOrder(selectedPo.id, cancelReason, selectedPo.version);
      setMessage({ type: 'success', text: `PO ${selectedPo.poNumber} cancelled.` });
      setShowCancelModal(false);
      loadPOs();
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to cancel PO' });
    }
  };

  const handleCheckBudget = async (po: PurchaseOrder) => {
    try {
      const res = await ApiClient.checkPOBudget(po.id);
      if (res.budgetResult.isWithinBudget) {
        setMessage({ type: 'success', text: `Budget Check Passed! Policy: ${res.budgetResult.budgetPolicy}. Available: $${res.budgetResult.availableBudget?.toLocaleString()}` });
      } else {
        setMessage({ type: 'error', text: `Budget Check Alert: ${res.budgetResult.validationErrors.join(', ')}` });
      }
      loadPOs();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Budget check failed' });
    }
  };

  const handleRunHardeningSuite = async () => {
    setRunningHardening(true);
    setShowHardeningModal(true);
    try {
      const res = await ApiClient.runPhase32B03HardeningSuite();
      if (res.success && res.report) {
        setHardeningReport(res.report);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Hardening suite execution failed' });
    } finally {
      setRunningHardening(false);
    }
  };

  // Filtered List
  const filteredPOs = purchaseOrders.filter(p => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (poTypeFilter !== 'ALL' && p.poType !== poTypeFilter) return false;
    if (vendorFilter !== 'ALL' && p.vendorId !== vendorFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchNum = p.poNumber.toLowerCase().includes(q);
      const matchVendor = p.vendorName.toLowerCase().includes(q);
      const matchNotes = p.notes && p.notes.toLowerCase().includes(q);
      if (!matchNum && !matchVendor && !matchNotes) return false;
    }
    return true;
  });

  const approvedRequisitions = requisitions.filter(r => r.status === 'APPROVED');

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <ShoppingCart className="w-6 h-6 text-blue-400" />
              Purchase Orders & Contract Pricing Hub
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Phase 3.2B-03
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative commercial commitments, 4-tier contract pricing resolution, digital seals & multi-tier approval hierarchy
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRunHardeningSuite}
            className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" /> Run Phase 3.2B-03 Hardening
          </button>
          <button
            onClick={() => setShowConvertPrModal(true)}
            className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <Layers className="w-4 h-4 text-emerald-400" /> Convert PR to PO
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> Create Direct PO
          </button>
        </div>
      </div>

      {/* NOTIFICATION FEEDBACK BANNER */}
      {message && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          message.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search PO #, Vendor, Notes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg pl-9 pr-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Statuses ({purchaseOrders.length})</option>
            <option value="DRAFT">DRAFT</option>
            <option value="BUDGET_CHECKED">BUDGET_CHECKED</option>
            <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
            <option value="APPROVED">APPROVED</option>
            <option value="ISSUED_TO_VENDOR">ISSUED_TO_VENDOR</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="PARTIALLY_RECEIVED">PARTIALLY_RECEIVED</option>
            <option value="FULLY_RECEIVED">FULLY_RECEIVED</option>
            <option value="CLOSED">CLOSED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div>
          <select
            value={poTypeFilter}
            onChange={e => setPoTypeFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Types (STANDARD, BLANKET, etc.)</option>
            <option value="STANDARD">STANDARD</option>
            <option value="BLANKET">BLANKET</option>
            <option value="CONTRACT">CONTRACT</option>
            <option value="SERVICES">SERVICES</option>
          </select>
        </div>

        <div>
          <select
            value={vendorFilter}
            onChange={e => setVendorFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Vendors ({vendors.length})</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* PO LISTING TABLE */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4">PO Identifier</th>
                <th className="p-4">Vendor & Terms</th>
                <th className="p-4">Date & Version</th>
                <th className="p-4">Lines & Items</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Workflow Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Loading Purchase Orders...
                  </td>
                </tr>
              ) : filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No Purchase Orders found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredPOs.map(po => {
                  const isDraftOrChecked = po.status === 'DRAFT' || po.status === 'BUDGET_CHECKED';
                  const isPending = po.status === 'PENDING_APPROVAL';
                  const isApproved = po.status === 'APPROVED';
                  const isIssued = po.status === 'ISSUED_TO_VENDOR';
                  const isAcknowledged = po.status === 'ACKNOWLEDGED';

                  return (
                    <tr key={po.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-mono font-bold text-blue-400 text-sm">{po.poNumber}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold">{po.poType}</span>
                          {po.prNumber && <span className="font-mono text-indigo-400">PR: {po.prNumber}</span>}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-white text-sm">{po.vendorName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>{po.incoterms || 'CIF'}</span> • <span>{po.paymentTerms || 'Net 30'}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="text-slate-200">{new Date(po.poDate).toLocaleDateString()}</div>
                        <div className="text-[11px] font-mono text-slate-500">Rev: v{po.version || 1}</div>
                      </td>

                      <td className="p-4">
                        <div className="text-slate-200 font-medium">{po.items?.length || 0} Lines</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {po.items?.map(i => i.itemName).join(', ')}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="text-sm font-bold font-mono text-emerald-400">
                          {po.currency} {po.totalAmount?.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Sub: {po.currency} {po.subtotal?.toLocaleString()}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${
                          po.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          po.status === 'ISSUED_TO_VENDOR' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                          po.status === 'ACKNOWLEDGED' ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' :
                          po.status === 'PENDING_APPROVAL' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          po.status === 'FULLY_RECEIVED' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                          po.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/30'
                        }`}>
                          {po.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                          {po.status === 'PENDING_APPROVAL' && <Clock className="w-3 h-3" />}
                          {po.status}
                        </span>
                      </td>

                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetail(po)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
                          title="View PO Details"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" /> View
                        </button>

                        {isDraftOrChecked && (
                          <>
                            <button
                              onClick={() => handleCheckBudget(po)}
                              className="px-2 py-1 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 rounded-lg text-xs font-medium"
                              title="Evaluate Budget"
                            >
                              Budget
                            </button>
                            <button
                              onClick={() => handleSubmitPo(po)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs"
                              title="Submit for Multi-Tier Approval"
                            >
                              <Send className="w-3.5 h-3.5 inline mr-1" /> Submit
                            </button>
                          </>
                        )}

                        {isPending && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedPo(po);
                                setShowApproveModal(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPo(po);
                                setShowRejectModal(true);
                              }}
                              className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            onClick={() => {
                              setSelectedPo(po);
                              setShowIssueModal(true);
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                          >
                            <Send className="w-3.5 h-3.5 inline mr-1" /> Issue PO
                          </button>
                        )}

                        {isIssued && (
                          <button
                            onClick={() => {
                              setSelectedPo(po);
                              setShowAckModal(true);
                            }}
                            className="px-2.5 py-1 bg-teal-600/20 text-teal-300 border border-teal-500/30 hover:bg-teal-600/30 rounded-lg text-xs font-semibold"
                          >
                            Acknowledge
                          </button>
                        )}

                        {(isIssued || isAcknowledged || po.status === 'PARTIALLY_RECEIVED') && (
                          <button
                            onClick={() => onSelectForReceipt && onSelectForReceipt(po)}
                            className="px-2.5 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 rounded-lg text-xs font-medium"
                          >
                            <Truck className="w-3.5 h-3.5 inline mr-1" /> Receive
                          </button>
                        )}

                        {(po.status === 'ISSUED_TO_VENDOR' || po.status === 'APPROVED') && (
                          <button
                            onClick={() => onSelectForAmend && onSelectForAmend(po)}
                            className="px-2 py-1 bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 rounded-lg text-xs font-medium"
                          >
                            Amend
                          </button>
                        )}

                        {(isDraftOrChecked || isPending) && (
                          <button
                            onClick={() => {
                              setSelectedPo(po);
                              setShowCancelModal(true);
                            }}
                            className="px-2 py-1 text-slate-500 hover:text-rose-400 rounded-lg text-xs"
                            title="Cancel PO"
                          >
                            <X className="w-3.5 h-3.5 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: DIRECT PO CREATION */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl w-full my-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-400" />
                  Create Commercial Purchase Order
                </h3>
                <p className="text-xs text-slate-400">Multi-tier contract pricing resolution, delivery schedule planning, and digital seal commitment</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-5">
              {/* SECTION A: PO HEADER & ORGANIZATIONAL SCOPE */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-400">1. Commercial & Organizational Header</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400">Target Vendor</label>
                    <select
                      value={newPoHeader.vendorId}
                      onChange={e => {
                        const vId = e.target.value;
                        setNewPoHeader({ ...newPoHeader, vendorId: vId });
                        // Re-resolve pricing for all items
                        newPoItems.forEach((it, idx) => {
                          handleResolvePricing(idx, vId, it.itemSku, it.orderedQty, it.unitPrice);
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs"
                      required
                    >
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">PO Type</label>
                    <select
                      value={newPoHeader.poType}
                      onChange={e => setNewPoHeader({ ...newPoHeader, poType: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs font-semibold text-blue-400"
                    >
                      <option value="STANDARD">STANDARD</option>
                      <option value="BLANKET">BLANKET</option>
                      <option value="CONTRACT">CONTRACT</option>
                      <option value="SERVICES">SERVICES</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Currency</label>
                    <select
                      value={newPoHeader.currency}
                      onChange={e => setNewPoHeader({ ...newPoHeader, currency: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs"
                    >
                      <option value="SAR">SAR - Saudi Riyal</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="AED">AED - UAE Dirham</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Payment Terms</label>
                    <select
                      value={newPoHeader.paymentTermsId}
                      onChange={e => setNewPoHeader({ ...newPoHeader, paymentTermsId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs"
                    >
                      {paymentTerms.map(pt => (
                        <option key={pt.id} value={pt.id}>{pt.name} ({pt.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Incoterms</label>
                    <select
                      value={newPoHeader.incotermId}
                      onChange={e => setNewPoHeader({ ...newPoHeader, incotermId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs"
                    >
                      {incoterms.map(inco => (
                        <option key={inco.id} value={inco.id}>{inco.code} - {inco.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Target Delivery Date</label>
                    <input
                      type="date"
                      value={newPoHeader.targetDeliveryDate}
                      onChange={e => setNewPoHeader({ ...newPoHeader, targetDeliveryDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Department</label>
                    <select
                      value={newPoHeader.departmentId}
                      onChange={e => setNewPoHeader({
                        ...newPoHeader,
                        departmentId: e.target.value,
                        departmentName: e.target.options[e.target.selectedIndex].text
                      })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs"
                    >
                      <option value="dept-02">Finance & Treasury</option>
                      <option value="dept-it">IT Infrastructure</option>
                      <option value="dept-ops">Operations & Logistics</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Cost Center</label>
                    <select
                      value={newPoHeader.costCenterId}
                      onChange={e => setNewPoHeader({
                        ...newPoHeader,
                        costCenterId: e.target.value,
                        costCenterName: e.target.options[e.target.selectedIndex].text
                      })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs"
                    >
                      <option value="cc-002">IT Infrastructure & Cloud (cc-002)</option>
                      <option value="cc-001">HQ Admin & Operations (cc-001)</option>
                      <option value="cc-003">Operations & Maintenance (cc-003)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Destination Warehouse</label>
                    <select
                      value={newPoHeader.warehouseId}
                      onChange={e => setNewPoHeader({
                        ...newPoHeader,
                        warehouseId: e.target.value,
                        warehouseName: e.target.options[e.target.selectedIndex].text
                      })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs"
                    >
                      <option value="wh-001">Central Warehouse - Riyadh</option>
                      <option value="wh-002">Jeddah Logistics Distribution Center</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Order Notes / Commercial Instructions</label>
                  <input
                    type="text"
                    value={newPoHeader.notes}
                    onChange={e => setNewPoHeader({ ...newPoHeader, notes: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs"
                    placeholder="Enter contractual terms, delivery requirements, or vendor instructions..."
                  />
                </div>
              </div>

              {/* SECTION B: PO LINE ITEMS WITH CONTRACT PRICING */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    2. Purchase Order Items ({newPoItems.length})
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 rounded-lg text-xs flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line Item
                  </button>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-[11px] font-semibold uppercase text-slate-400 sticky top-0">
                      <tr>
                        <th className="p-2.5">Catalog SKU</th>
                        <th className="p-2.5">Qty</th>
                        <th className="p-2.5">Unit Price</th>
                        <th className="p-2.5">Pricing Tier</th>
                        <th className="p-2.5">Tax %</th>
                        <th className="p-2.5">Line Total</th>
                        <th className="p-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {newPoItems.map((item, idx) => {
                        const netPrice = item.unitPrice * (1 - (item.discountPercent || 0) / 100);
                        const taxAmt = (netPrice * item.orderedQty * (item.taxRatePercent || 0)) / 100;
                        const lineTotal = netPrice * item.orderedQty + taxAmt;

                        return (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="p-2.5">
                              {productsList.length > 0 ? (
                                <select
                                  value={item.productId}
                                  onChange={e => handleProductChange(idx, e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs"
                                >
                                  {productsList.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={item.itemName}
                                  onChange={e => {
                                    const updated = [...newPoItems];
                                    updated[idx].itemName = e.target.value;
                                    setNewPoItems(updated);
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs"
                                />
                              )}
                            </td>
                            <td className="p-2.5 w-20">
                              <input
                                type="number"
                                min="1"
                                value={item.orderedQty}
                                onChange={e => {
                                  const qty = Number(e.target.value) || 1;
                                  const updated = [...newPoItems];
                                  updated[idx].orderedQty = qty;
                                  setNewPoItems(updated);
                                  if (newPoHeader.vendorId) {
                                    handleResolvePricing(idx, newPoHeader.vendorId, item.itemSku, qty, item.unitPrice);
                                  }
                                }}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs font-mono"
                              />
                            </td>
                            <td className="p-2.5 w-28">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={e => {
                                  const updated = [...newPoItems];
                                  updated[idx].unitPrice = Number(e.target.value) || 0;
                                  setNewPoItems(updated);
                                }}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs font-mono"
                              />
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/30 text-blue-300 font-mono text-[10px] font-semibold">
                                {item.priceTierApplied || 'TIER 1: CONTRACT'}
                              </span>
                            </td>
                            <td className="p-2.5 w-20">
                              <input
                                type="number"
                                value={item.taxRatePercent}
                                onChange={e => {
                                  const updated = [...newPoItems];
                                  updated[idx].taxRatePercent = Number(e.target.value) || 0;
                                  setNewPoItems(updated);
                                }}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs font-mono"
                              />
                            </td>
                            <td className="p-2.5 font-mono font-bold text-emerald-400">
                              ${lineTotal.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-slate-500 hover:text-rose-400 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                <div className="text-xs text-slate-400">
                  Total Lines: <span className="text-white font-bold">{newPoItems.length}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20"
                  >
                    Create Purchase Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PR TO PO CONVERTER */}
      {showConvertPrModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  Convert Approved Requisition to Purchase Order
                </h3>
                <p className="text-xs text-slate-400">Auto-populates items, applies tier pricing & updates PR fulfillment status</p>
              </div>
              <button onClick={() => setShowConvertPrModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConvertPr} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400">Select Approved Purchase Requisition</label>
                <select
                  value={selectedPrId}
                  onChange={e => setSelectedPrId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs font-mono"
                  required
                >
                  <option value="">-- Choose Requisition --</option>
                  {approvedRequisitions.map(pr => (
                    <option key={pr.id} value={pr.id}>
                      {pr.prNumber} • {pr.purpose || 'General Req'} • ${pr.estimatedTotalAmount?.toLocaleString()} ({pr.lines?.length} lines)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Assign Vendor</label>
                <select
                  value={convertVendorId}
                  onChange={e => setConvertVendorId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs"
                  required
                >
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowConvertPrModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20"
                >
                  Generate Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PURCHASE ORDER DETAIL & DIGITAL SEAL VIEWER */}
      {showDetailModal && selectedPo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl w-full my-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold font-mono text-blue-400">{selectedPo.poNumber}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    selectedPo.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    selectedPo.status === 'PENDING_APPROVAL' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                    'bg-slate-500/10 text-slate-400 border border-slate-500/30'
                  }`}>
                    {selectedPo.status}
                  </span>
                  <span className="text-xs font-mono text-slate-400">Rev: v{selectedPo.version || 1}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Vendor: {selectedPo.vendorName} • Created by: {selectedPo.createdByName || 'Purchaser'}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FINANCIAL SUMMARY CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                <div className="text-[11px] text-slate-400 font-semibold">Subtotal</div>
                <div className="text-base font-bold font-mono text-white mt-1">
                  {selectedPo.currency} {selectedPo.subtotal?.toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                <div className="text-[11px] text-slate-400 font-semibold">Total Discount</div>
                <div className="text-base font-bold font-mono text-amber-400 mt-1">
                  {selectedPo.currency} {selectedPo.totalDiscount?.toLocaleString() || 0}
                </div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                <div className="text-[11px] text-slate-400 font-semibold">Total Tax</div>
                <div className="text-base font-bold font-mono text-slate-200 mt-1">
                  {selectedPo.currency} {selectedPo.totalTax?.toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-950/60 border border-emerald-500/30 p-3.5 rounded-xl bg-emerald-950/10">
                <div className="text-[11px] text-emerald-400 font-semibold">Total Commitment</div>
                <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                  {selectedPo.currency} {selectedPo.totalAmount?.toLocaleString()}
                </div>
              </div>
            </div>

            {/* DIGITAL SEAL & CONTRACT PRICING BANNER */}
            {selectedPo.digitalSignature && (
              <div className="bg-purple-950/20 border border-purple-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  Authoritative SHA-256 Digital Seal
                </div>
                <div className="font-mono text-[11px] text-purple-200 break-all bg-purple-950/40 p-2 rounded-lg border border-purple-500/20">
                  {selectedPo.digitalSignature}
                </div>
              </div>
            )}

            {/* LINE ITEMS TABLE */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Purchased Line Items ({selectedPo.items?.length})</h4>
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-[11px] font-semibold uppercase text-slate-400">
                    <tr>
                      <th className="p-3">SKU & Item</th>
                      <th className="p-3">Ordered Qty</th>
                      <th className="p-3">Unit Price</th>
                      <th className="p-3">Discount</th>
                      <th className="p-3">Line Total</th>
                      <th className="p-3">Fulfilled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {selectedPo.items?.map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/20">
                        <td className="p-3">
                          <div className="font-semibold text-white">{item.itemName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{item.itemSku} • UOM: {item.uom}</div>
                        </td>
                        <td className="p-3 font-mono font-medium">{item.orderedQty}</td>
                        <td className="p-3 font-mono">${item.unitPrice?.toLocaleString()}</td>
                        <td className="p-3 font-mono text-amber-400">{item.discountPercent || 0}%</td>
                        <td className="p-3 font-mono font-bold text-emerald-400">${item.lineTotal?.toLocaleString()}</td>
                        <td className="p-3 font-mono text-slate-300">
                          {item.receivedQty || 0} / {item.orderedQty} (Open: {item.openQty})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* APPROVAL HIERARCHY TIMELINE */}
            {poApprovalHistory && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Approval Hierarchy & Digital Signatures</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {poApprovalHistory.approvalSteps?.map((step, idx) => (
                    <div key={idx} className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      step.status === 'APPROVED' ? 'bg-emerald-950/20 border-emerald-500/30' :
                      step.status === 'PENDING' ? 'bg-amber-950/20 border-amber-500/30' :
                      'bg-slate-950 border-slate-800'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-white">Step {step.stepNumber}: {step.role}</div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          step.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {step.status}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Approver: <span className="text-slate-200">{step.approverName || 'Pending'}</span>
                      </div>
                      {step.comments && (
                        <div className="text-slate-400 text-[11px] italic">
                          "{step.comments}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: APPROVE PO */}
      {showApproveModal && selectedPo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Approve Purchase Order
            </h3>
            <p className="text-xs text-slate-400">
              Authorizing PO <span className="font-mono text-blue-400 font-bold">{selectedPo.poNumber}</span> for amount <span className="font-mono text-emerald-400 font-bold">{selectedPo.currency} {selectedPo.totalAmount?.toLocaleString()}</span>.
            </p>

            <form onSubmit={handleApprovePo} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400">Approver Role</label>
                <select
                  value={approverRole}
                  onChange={e => setApproverRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs"
                >
                  <option value="Procurement Manager">Procurement Manager</option>
                  <option value="Finance Director">Finance Director</option>
                  <option value="CFO">CFO / Executive</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Approval Comments</label>
                <textarea
                  value={approveComments}
                  onChange={e => setApproveComments(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20"
                >
                  Confirm Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: REJECT PO */}
      {showRejectModal && selectedPo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Reject Purchase Order
            </h3>

            <form onSubmit={handleRejectPo} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400">Reason for Rejection</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20"
                >
                  Reject Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: ISSUE PO TO VENDOR */}
      {showIssueModal && selectedPo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-400" />
              Issue Purchase Order to Vendor
            </h3>
            <p className="text-xs text-slate-400">
              Transmit commercial PO <span className="font-mono text-blue-400 font-bold">{selectedPo.poNumber}</span> to vendor <span className="text-white font-bold">{selectedPo.vendorName}</span>.
            </p>

            <form onSubmit={handleIssuePo} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400">Transmission Method</label>
                <select
                  value={transmissionMethod}
                  onChange={e => setTransmissionMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs"
                >
                  <option value="EMAIL">Email Dispatch (PDF + Digital Seal)</option>
                  <option value="EDI">EDI AS2 / Electronic Data Interchange</option>
                  <option value="PORTAL">Supplier Self-Service Portal</option>
                  <option value="MANUAL">Manual Offline Handover</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20"
                >
                  Transmit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: VENDOR ACKNOWLEDGMENT */}
      {showAckModal && selectedPo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Check className="w-5 h-5 text-teal-400" />
              Vendor Order Acknowledgment
            </h3>

            <form onSubmit={handleAcknowledgePo} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400">Supplier Order Confirmation Ref</label>
                <input
                  type="text"
                  value={ackRef}
                  onChange={e => setAckRef(e.target.value)}
                  placeholder="e.g., SO-CONF-9842"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Promised Estimated Delivery Date (ETA)</label>
                <input
                  type="date"
                  value={ackEta}
                  onChange={e => setAckEta(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAckModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-500/20"
                >
                  Save Acknowledgment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: PHASE 3.2B-03 HARDENING SUITE REPORT */}
      {showHardeningModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl w-full my-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  Phase 3.2B-03 Purchase Orders & Contract Pricing Hardening Report
                </h3>
                <p className="text-xs text-slate-400">Authoritative automated test suite execution (30 Hardening Tests)</p>
              </div>
              <button onClick={() => setShowHardeningModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {runningHardening ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="text-sm font-semibold text-purple-300">Running Phase 3.2B-03 Hardening Suite...</div>
              </div>
            ) : hardeningReport ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-400">Total Assertions</div>
                    <div className="text-2xl font-bold font-mono text-white mt-1">{hardeningReport.totalTests}</div>
                  </div>
                  <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/30">
                    <div className="text-xs text-emerald-400 font-semibold">Passed</div>
                    <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{hardeningReport.passedTests}</div>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-400">Pass Rate</div>
                    <div className="text-2xl font-bold font-mono text-purple-400 mt-1">{hardeningReport.passRate}</div>
                  </div>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-[11px] font-semibold uppercase text-slate-400 sticky top-0">
                      <tr>
                        <th className="p-3">Test Code</th>
                        <th className="p-3">Requirement & Test Name</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {hardeningReport.results?.map((res: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-3 font-mono font-bold text-blue-400">{res.testId}</td>
                          <td className="p-3">
                            <div className="text-white font-medium">{res.name}</div>
                            {res.error && <div className="text-rose-400 text-[11px] mt-0.5">{res.error}</div>}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              {res.status}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-400">{res.durationMs}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
