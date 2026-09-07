import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/apiClient';
import { MasterDataService } from '../engine/masterDataService';
import { PurchaseOrderHub } from './procurement/PurchaseOrderHub';
import { AdvancedProcurementHub } from './procurement/AdvancedProcurementHub';
import {
  VendorMaster,
  VendorCategory,
  PaymentTerms,
  Incoterms,
  BuyerGroup,
  PurchasingOrganization,
  PurchaseRequisition,
  PurchaseRequisitionLine,
  RequestForQuotation,
  VendorQuotation,
  QuotationComparisonMatrixItem,
  PurchaseOrder,
  PurchaseOrderAmendment,
  VendorReturnNote,
  PurchaseAuditRecord,
  ProcurementBudgetCheckResult
} from '../types/procurement';
import {
  Building2,
  FileText,
  HelpCircle,
  BarChart3,
  ShoppingCart,
  CheckCircle2,
  GitCommit,
  Truck,
  RotateCcw,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  Send,
  Check,
  X,
  FileSpreadsheet,
  Clock,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Eye,
  Trash2,
  History,
  Layers,
  Sparkles
} from 'lucide-react';

export const ProcurementManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VENDORS' | 'REQUISITIONS' | 'RFQS' | 'QUOTATIONS' | 'ORDERS' | 'AMENDMENTS' | 'RECEIPTS' | 'RETURNS' | 'ADVANCED' | 'AUDIT'>('OVERVIEW');

  // Master Data State
  const [vendors, setVendors] = useState<VendorMaster[]>([]);
  const [vendorCategories, setVendorCategories] = useState<VendorCategory[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms[]>([]);
  const [incoterms, setIncoterms] = useState<Incoterms[]>([]);
  const [buyerGroups, setBuyerGroups] = useState<BuyerGroup[]>([]);
  const [purchasingOrgs, setPurchasingOrgs] = useState<PurchasingOrganization[]>([]);

  // Master Data Products & UOMs for PR Line Builder
  const [productsList, setProductsList] = useState<any[]>([]);
  const [uomsList, setUomsList] = useState<any[]>([]);

  // Transactional Data State
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [rfqs, setRfqs] = useState<RequestForQuotation[]>([]);
  const [quotations, setQuotations] = useState<VendorQuotation[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [amendments, setAmendments] = useState<PurchaseOrderAmendment[]>([]);
  const [returns, setReturns] = useState<VendorReturnNote[]>([]);
  const [auditLogs, setAuditLogs] = useState<PurchaseAuditRecord[]>([]);

  // Selection & UI State
  const [selectedRfqForMatrix, setSelectedRfqForMatrix] = useState<string>('');
  const [comparisonMatrix, setComparisonMatrix] = useState<QuotationComparisonMatrixItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // PR Filters
  const [prStatusFilter, setPrStatusFilter] = useState<string>('ALL');
  const [prDeptFilter, setPrDeptFilter] = useState<string>('ALL');

  // Modal Dialog States
  const [showVendorModal, setShowVendorModal] = useState<boolean>(false);
  const [showPrModal, setShowPrModal] = useState<boolean>(false);
  const [showPoModal, setShowPoModal] = useState<boolean>(false);
  const [showRfqModal, setShowRfqModal] = useState<boolean>(false);
  const [showQuoteModal, setShowQuoteModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [showAmendModal, setShowAmendModal] = useState<boolean>(false);

  // PR Drilldown / Actions Modal States
  const [selectedPrForDetail, setSelectedPrForDetail] = useState<PurchaseRequisition | null>(null);
  const [prApprovalHistory, setPrApprovalHistory] = useState<{ approvalSteps: any[]; auditHistory: any[] } | null>(null);
  const [selectedPrForApprove, setSelectedPrForApprove] = useState<PurchaseRequisition | null>(null);
  const [approveComments, setApproveComments] = useState<string>('Reviewed and approved for standard procurement');
  const [approveUserRole, setApproveUserRole] = useState<string>('Finance Director');
  const [selectedPrForReject, setSelectedPrForReject] = useState<PurchaseRequisition | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Budget realignment required');

  // Form State Containers
  const [newVendor, setNewVendor] = useState<Partial<VendorMaster>>({
    name: '', code: '', taxNumber: '', commercialRegNo: '', vendorCategoryId: '', paymentTermsId: '', currency: 'SAR', creditLimit: 100000
  });

  // Enterprise PR Form State
  const [newPrHeader, setNewPrHeader] = useState<{
    departmentId: string;
    departmentName: string;
    warehouseId: string;
    warehouseName: string;
    costCenterId: string;
    costCenterName: string;
    projectId: string;
    projectName: string;
    purchasingOrgId: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    purpose: string;
    notes: string;
    currency: string;
  }>({
    departmentId: 'dept-02',
    departmentName: 'Finance & Treasury',
    warehouseId: 'wh-001',
    warehouseName: 'Central Warehouse - Riyadh',
    costCenterId: 'cc-it-ops',
    costCenterName: 'IT Operations & Infrastructure',
    projectId: 'proj-cloud-mig',
    projectName: 'Cloud Infrastructure Modernization',
    purchasingOrgId: 'porg-001',
    priority: 'HIGH',
    purpose: 'Procurement of mission-critical IT infrastructure hardware and software components',
    notes: 'Approved under FY2026 Q1 Technology CAPEX plan',
    currency: 'SAR'
  });

  const [newPrLines, setNewPrLines] = useState<Array<{
    productId: string;
    itemSku: string;
    variantId?: string;
    variantSku?: string;
    itemName: string;
    requestedQty: number;
    requestedUOM: string;
    estimatedUnitPrice: number;
    costCenterId?: string;
    projectId?: string;
  }>>([
    {
      productId: 'prod-srv-01',
      itemSku: 'HW-SRV-01',
      itemName: 'Enterprise Rack Server PowerEdge R750',
      requestedQty: 5,
      requestedUOM: 'PCS',
      estimatedUnitPrice: 18500,
      costCenterId: 'cc-it-ops',
      projectId: 'proj-cloud-mig'
    }
  ]);

  const [selectedPoForReceipt, setSelectedPoForReceipt] = useState<PurchaseOrder | null>(null);
  const [receiptQtyMap, setReceiptQtyMap] = useState<Record<string, number>>({});

  const [selectedPoForAmend, setSelectedPoForAmend] = useState<PurchaseOrder | null>(null);
  const [amendmentReason, setAmendmentReason] = useState<string>('');
  const [amendedQty, setAmendedQty] = useState<number>(10);
  const [amendedPrice, setAmendedPrice] = useState<number>(18000);

  const [selectedPoForReturn, setSelectedPoForReturn] = useState<PurchaseOrder | null>(null);
  const [returnReason, setReturnReason] = useState<'DEFECTIVE' | 'OVER_DELIVERY' | 'WRONG_SPECIFICATION' | 'DAMAGED_IN_TRANSIT'>('DEFECTIVE');
  const [returnQty, setReturnQty] = useState<number>(1);

  const [rfqPrId, setRfqPrId] = useState<string>('');
  const [rfqSelectedVendorIds, setRfqSelectedVendorIds] = useState<string[]>([]);

  const [newPoVendorId, setNewPoVendorId] = useState<string>('');
  const [newPoItemSku, setNewPoItemSku] = useState<string>('HW-SRV-01');
  const [newPoItemName, setNewPoItemName] = useState<string>('Enterprise Rack Server PowerEdge R750');
  const [newPoQty, setNewPoQty] = useState<number>(5);
  const [newPoPrice, setNewPoPrice] = useState<number>(18000);

  useEffect(() => {
    loadAllProcurementData();
    // Load Master Data products & UOMs for line builder
    try {
      const prods = MasterDataService.getProducts('ten-001');
      const uoms = MasterDataService.getUOMs('ten-001');
      setProductsList(prods);
      setUomsList(uoms);
    } catch (e) {
      console.warn('MasterDataService local lookup fallback', e);
    }
  }, []);

  const loadAllProcurementData = async () => {
    setLoading(true);
    try {
      const [
        vRes, vcatRes, ptRes, incoRes, bgRes, porgRes,
        prRes, rfqRes, quoteRes, poRes, retRes, auditRes
      ] = await Promise.all([
        ApiClient.getProcurementVendors(),
        ApiClient.getVendorCategories(),
        ApiClient.getProcurementPaymentTerms(),
        ApiClient.getIncoterms(),
        ApiClient.getBuyerGroups(),
        ApiClient.getPurchasingOrganizations(),
        ApiClient.getPurchaseRequisitions(),
        ApiClient.getRFQs(),
        ApiClient.getVendorQuotations(),
        ApiClient.getProcurementPurchaseOrders(),
        ApiClient.getVendorReturns(),
        ApiClient.getPurchaseAuditLogs()
      ]);

      setVendors(vRes);
      setVendorCategories(vcatRes);
      setPaymentTerms(ptRes);
      setIncoterms(incoRes);
      setBuyerGroups(bgRes);
      setPurchasingOrgs(porgRes);

      setRequisitions(prRes);
      setRfqs(rfqRes);
      setQuotations(quoteRes);
      setPurchaseOrders(poRes);
      setReturns(retRes);
      setAuditLogs(auditRes);

      if (rfqRes.length > 0) {
        setSelectedRfqForMatrix(rfqRes[0].id);
        const matrix = await ApiClient.getQuotationComparisonMatrix(rfqRes[0].id);
        setComparisonMatrix(matrix);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load procurement datasets' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRfqMatrix = async (rfqId: string) => {
    setSelectedRfqForMatrix(rfqId);
    try {
      const matrix = await ApiClient.getQuotationComparisonMatrix(rfqId);
      setComparisonMatrix(matrix);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to generate comparison matrix.' });
    }
  };

  // Actions
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.createVendor(newVendor);
      setMessage({ type: 'success', text: `Vendor ${newVendor.name} created successfully.` });
      setShowVendorModal(false);
      loadAllProcurementData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleAddPrLine = () => {
    const firstProd = productsList[0] || { id: 'prod-srv-01', sku: 'HW-SRV-01', name: 'Enterprise Rack Server PowerEdge R750', baseUom: 'PCS' };
    setNewPrLines([
      ...newPrLines,
      {
        productId: firstProd.id,
        itemSku: firstProd.sku,
        itemName: firstProd.name,
        requestedQty: 1,
        requestedUOM: firstProd.baseUom || 'PCS',
        estimatedUnitPrice: 5000,
        costCenterId: newPrHeader.costCenterId,
        projectId: newPrHeader.projectId
      }
    ]);
  };

  const handleRemovePrLine = (index: number) => {
    if (newPrLines.length <= 1) {
      setMessage({ type: 'error', text: 'A Purchase Requisition must contain at least one line item.' });
      return;
    }
    setNewPrLines(newPrLines.filter((_, idx) => idx !== index));
  };

  const handlePrLineProductChange = (index: number, productId: string) => {
    const prod = productsList.find(p => p.id === productId);
    if (!prod) return;
    const updated = [...newPrLines];
    updated[index] = {
      ...updated[index],
      productId: prod.id,
      itemSku: prod.sku,
      itemName: prod.name,
      requestedUOM: prod.baseUom || 'PCS',
      variantId: undefined,
      variantSku: undefined
    };
    setNewPrLines(updated);
  };

  const handleCreatePr = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.createPurchaseRequisition(
        newPrHeader,
        newPrLines
      );
      setMessage({ type: 'success', text: 'Purchase Requisition created successfully with active Master Data verification and budget validation.' });
      setShowPrModal(false);
      loadAllProcurementData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCheckPrBudget = async (prId: string) => {
    try {
      const res = await ApiClient.checkRequisitionBudget(prId);
      const bRes = res.budgetResult as ProcurementBudgetCheckResult;
      setMessage({
        type: bRes.isBlocked ? 'error' : 'success',
        text: `Budget Evaluated: ${bRes.status} (Policy: ${bRes.policy}). Allocated: ${bRes.allocatedBudget.toLocaleString()} SAR, Available: ${bRes.availableBudget.toLocaleString()} SAR, Variance: ${bRes.variance.toLocaleString()} SAR`
      });
      loadAllProcurementData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleSubmitPr = async (pr: PurchaseRequisition) => {
    try {
      await ApiClient.submitPurchaseRequisition(pr.id, pr.version);
      setMessage({ type: 'success', text: `Requisition ${pr.prNumber} submitted for workflow routing.` });
      loadAllProcurementData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleApprovePr = async () => {
    if (!selectedPrForApprove) return;
    try {
      await ApiClient.approvePurchaseRequisition(
        selectedPrForApprove.id,
        1,
        approveComments,
        selectedPrForApprove.version,
        approveUserRole
      );
      setMessage({ type: 'success', text: `Purchase Requisition ${selectedPrForApprove.prNumber} approved with digital signature verification.` });
      setSelectedPrForApprove(null);
      loadAllProcurementData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleRejectPr = async () => {
    if (!selectedPrForReject) return;
    try {
      await ApiClient.rejectPurchaseRequisition(
        selectedPrForReject.id,
        rejectionReason,
        selectedPrForReject.version
      );
      setMessage({ type: 'success', text: `Purchase Requisition ${selectedPrForReject.prNumber} marked as REJECTED.` });
      setSelectedPrForReject(null);
      loadAllProcurementData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCancelPr = async (pr: PurchaseRequisition) => {
    try {
      await ApiClient.cancelPurchaseRequisition(pr.id, 'Cancelled by user', pr.version);
      setMessage({ type: 'success', text: `Purchase Requisition ${pr.prNumber} cancelled.` });
      loadAllProcurementData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vendorId = newPoVendorId || vendors[0]?.id;
      const vendor = vendors.find(v => v.id === vendorId);
      await ApiClient.createPurchaseOrder(
        {
          vendorId: vendorId || 'v-001',
          vendorName: vendor?.name || 'Primary Hardware Supplier',
          warehouseId: 'wh-001',
          paymentTermsId: vendor?.paymentTermsId || 'pt-30',
          incotermCode: 'DAP'
        },
        [
          {
            itemSku: newPoItemSku,
            itemName: newPoItemName,
            orderedQty: newPoQty,
            uom: 'PCS',
            unitPrice: newPoPrice,
            taxRate: 15,
            deliveryDate: new Date(Date.now() + 14 * 86400000).toISOString()
          }
        ]
      );
      setMessage({ type: 'success', text: 'Purchase Order created successfully.' });
      setShowPoModal(false);
      loadAllProcurementData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleViewPrDetail = async (pr: PurchaseRequisition) => {
    setSelectedPrForDetail(pr);
    try {
      const hist = await ApiClient.getRequisitionApprovalHistory(pr.id);
      setPrApprovalHistory(hist);
    } catch (e) {
      console.warn('Failed to load PR history', e);
    }
  };

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqPrId || rfqSelectedVendorIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select a Requisition and at least one Vendor.' });
      return;
    }
    try {
      await ApiClient.createRFQFromPR(rfqPrId, rfqSelectedVendorIds);
      setMessage({ type: 'success', text: 'RFQ issued to selected vendors successfully.' });
      setShowRfqModal(false);
      loadAllProcurementData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleApprovePo = async (poId: string) => {
    try {
      await ApiClient.approvePurchaseOrder(poId, 'Super Admin', 'usr-001', 'Ahmed Mounir');
      setMessage({ type: 'success', text: 'Purchase Order approved successfully.' });
      loadAllProcurementData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleRecordReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoForReceipt) return;

    const receivedLines = selectedPoForReceipt.items.map(item => ({
      poItemId: item.id,
      itemSku: item.itemSku,
      quantityReceived: receiptQtyMap[item.id] || item.openQty
    }));

    try {
      await ApiClient.recordPartialDelivery(selectedPoForReceipt.id, receivedLines);
      setMessage({ type: 'success', text: 'Goods Receipt recorded and PO status updated.' });
      setShowReceiptModal(false);
      loadAllProcurementData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleAmendPo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoForAmend) return;

    try {
      await ApiClient.amendPurchaseOrder(
        selectedPoForAmend.id,
        amendmentReason,
        {},
        [
          {
            ...selectedPoForAmend.items[0],
            orderedQty: Number(amendedQty),
            unitPrice: Number(amendedPrice)
          }
        ]
      );
      setMessage({ type: 'success', text: 'PO Amendment recorded successfully.' });
      setShowAmendModal(false);
      loadAllProcurementData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoForReturn) return;

    try {
      await ApiClient.createVendorReturn(
        selectedPoForReturn.id,
        returnReason,
        [
          {
            itemSku: selectedPoForReturn.items[0].itemSku,
            itemName: selectedPoForReturn.items[0].itemName,
            returnedQty: Number(returnQty),
            unitCost: selectedPoForReturn.items[0].netUnitPrice
          }
        ]
      );
      setMessage({ type: 'success', text: 'Vendor Return note generated successfully.' });
      setShowReturnModal(false);
      loadAllProcurementData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Summary Metrics
  const totalVendors = vendors.length;
  const openPrs = requisitions.filter(p => p.status === 'APPROVED' || p.status === 'DRAFT').length;
  const pendingPos = purchaseOrders.filter(p => p.status === 'PENDING_APPROVAL' || p.status === 'DRAFT').length;
  const totalPoSpend = purchaseOrders.reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="p-6 bg-slate-900 text-slate-100 min-h-screen space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Procurement & Purchasing Engine
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  SAP S/4HANA Aligned
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                End-to-End Enterprise Procurement Lifecycle & Event-Driven Purchasing Domain
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPrModal(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" /> New Requisition
          </button>
          <button
            onClick={() => setShowPoModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-lg shadow-blue-600/20"
          >
            <ShoppingCart className="w-4 h-4" /> Create PO
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {message && (
        <div className={`p-4 rounded-lg border flex items-center justify-between text-sm ${
          message.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 overflow-x-auto pb-px">
        {[
          { id: 'OVERVIEW', label: 'Executive Overview', icon: BarChart3 },
          { id: 'VENDORS', label: 'Vendor Master', icon: Building2 },
          { id: 'REQUISITIONS', label: 'Requisitions (PR)', icon: FileText },
          { id: 'RFQS', label: 'RFQs', icon: HelpCircle },
          { id: 'QUOTATIONS', label: 'Quotation Matrix', icon: FileSpreadsheet },
          { id: 'ORDERS', label: 'Purchase Orders (PO)', icon: ShoppingCart },
          { id: 'ADVANCED', label: 'Advanced Procurement (ERS/Consign)', icon: Sparkles },
          { id: 'AMENDMENTS', label: 'Amendments', icon: GitCommit },
          { id: 'RECEIPTS', label: 'Partial Deliveries', icon: Truck },
          { id: 'RETURNS', label: 'Vendor Returns', icon: RotateCcw },
          { id: 'AUDIT', label: 'Audit Trail', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                isActive
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Active Vendors</div>
              <div className="text-2xl font-bold text-white mt-1">{totalVendors}</div>
              <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approved Master Data
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Open Requisitions</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">{openPrs}</div>
              <div className="text-xs text-slate-400 mt-2">Ready for RFQ / PO Conversion</div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Approval POs</div>
              <div className="text-2xl font-bold text-blue-400 mt-1">{pendingPos}</div>
              <div className="text-xs text-blue-400 mt-2">Awaiting Manager Threshold Approval</div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Approved PO Commitments</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">${totalPoSpend.toLocaleString()}</div>
              <div className="text-xs text-slate-400 mt-2">Multi-Currency Base Total</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Procurement Pipeline */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" /> Active Procurement Pipeline
              </h3>
              <div className="space-y-3">
                {requisitions.map(pr => (
                  <div key={pr.id} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between text-sm">
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        {pr.prNumber}
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {pr.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Requested by {pr.requestedByName} • Est: ${pr.totalEstimatedAmount.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSubmitPr(pr.id)}
                      disabled={pr.status !== 'DRAFT'}
                      className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded text-xs font-medium disabled:opacity-40"
                    >
                      Submit PR
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Vendor Performance & Ratings */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" /> Key Enterprise Vendors
              </h3>
              <div className="space-y-3">
                {vendors.map(v => (
                  <div key={v.id} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between text-sm">
                    <div>
                      <div className="font-semibold text-white">{v.name} ({v.code})</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Tax: {v.taxNumber || 'N/A'} • Terms: {v.paymentTermsName} • Incoterm: {v.incotermsCode}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-amber-400">Rating: {v.rating}/5</div>
                      <div className="text-xs text-slate-500 mt-0.5">Limit: ${v.creditLimit.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VENDORS */}
      {activeTab === 'VENDORS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Vendor Master Database</h2>
            <button
              onClick={() => setShowVendorModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Enterprise Vendor
            </button>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Vendor Code & Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Tax / Commercial Reg</th>
                  <th className="p-4">Payment Terms & Incoterms</th>
                  <th className="p-4">Credit Limit</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {vendors.map(v => (
                  <tr key={v.id} className="hover:bg-slate-800/30">
                    <td className="p-4">
                      <div className="font-semibold text-white">{v.name}</div>
                      <div className="text-xs text-slate-400">{v.code} • {v.email}</div>
                    </td>
                    <td className="p-4 text-slate-300">{v.vendorCategoryName}</td>
                    <td className="p-4 text-slate-400 font-mono text-xs">
                      Tax: {v.taxNumber}<br />CR: {v.commercialRegNo || 'N/A'}
                    </td>
                    <td className="p-4 text-slate-300 text-xs">
                      {v.paymentTermsName}<br />
                      <span className="text-blue-400 font-mono">{v.incotermsCode}</span>
                    </td>
                    <td className="p-4 text-slate-200 font-medium">${v.creditLimit.toLocaleString()}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REQUISITIONS */}
      {activeTab === 'REQUISITIONS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Purchase Requisitions (PR)
              </h2>
              <p className="text-xs text-slate-400">Enterprise Procurement Requisitions with UOM Snapshots & Multi-Tier Budget Validation</p>
            </div>
            <button
              onClick={() => setShowPrModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Create Requisition
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Status:</span>
                <select
                  value={prStatusFilter}
                  onChange={e => setPrStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1 text-xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="BUDGET_CHECKED">BUDGET_CHECKED</option>
                  <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Department:</span>
                <select
                  value={prDeptFilter}
                  onChange={e => setPrDeptFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1 text-xs"
                >
                  <option value="ALL">All Departments</option>
                  <option value="dept-02">Finance & Treasury</option>
                  <option value="dept-it">IT Infrastructure</option>
                  <option value="dept-ops">Operations & Facilities</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Showing {requisitions.filter(pr => (prStatusFilter === 'ALL' || pr.status === prStatusFilter) && (prDeptFilter === 'ALL' || pr.departmentId === prDeptFilter)).length} Requisitions
            </div>
          </div>

          {/* Requisitions Data Table */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5">PR Details</th>
                  <th className="p-3.5">Department & Org</th>
                  <th className="p-3.5">Items & Lines</th>
                  <th className="p-3.5">Est. Total</th>
                  <th className="p-3.5">Budget Status</th>
                  <th className="p-3.5">PR Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requisitions
                  .filter(pr => (prStatusFilter === 'ALL' || pr.status === prStatusFilter) && (prDeptFilter === 'ALL' || pr.departmentId === prDeptFilter))
                  .map(pr => (
                    <tr key={pr.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-blue-400">{pr.prNumber}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700">
                            v{pr.version || 1}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          By <span className="text-slate-200">{pr.requestedByName || pr.requesterName}</span> • {new Date(pr.requisitionDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-xs text-slate-200 font-medium">{pr.departmentName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {pr.costCenterName || pr.costCenterId || 'General CC'} {pr.projectName ? `• ${pr.projectName}` : ''}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-xs text-slate-300 font-medium">
                          {(pr.lines || pr.items || []).length} Line Items
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                          {(pr.lines || pr.items || [])[0]?.itemName || 'General goods'}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-100 font-semibold">
                          {pr.totalEstimatedAmount.toLocaleString()} {pr.currency || 'SAR'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Priority: <span className="text-amber-400">{pr.priority}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          pr.budgetStatus === 'WITHIN_BUDGET' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          pr.budgetStatus === 'BUDGET_WARNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          pr.budgetStatus === 'BUDGET_BLOCKED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          'bg-slate-700/40 text-slate-300 border border-slate-600/30'
                        }`}>
                          {pr.budgetStatus || 'UNCHECKED'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          pr.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          pr.status === 'PENDING_APPROVAL' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          pr.status === 'BUDGET_CHECKED' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                          pr.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          pr.status === 'CANCELLED' ? 'bg-slate-700/40 text-slate-400 border border-slate-600/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {pr.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleViewPrDetail(pr)}
                          title="View Requisition Details"
                          className="px-2 py-1 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 inline" /> Details
                        </button>

                        {(pr.status === 'DRAFT' || pr.status === 'BUDGET_CHECKED') && (
                          <>
                            <button
                              onClick={() => handleCheckPrBudget(pr.id)}
                              title="Evaluate Budget"
                              className="px-2 py-1 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 rounded text-xs font-medium"
                            >
                              Check Budget
                            </button>
                            <button
                              onClick={() => handleSubmitPr(pr)}
                              title="Submit for Multi-Tier Approval"
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium shadow-xs"
                            >
                              Submit
                            </button>
                          </>
                        )}

                        {pr.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              onClick={() => setSelectedPrForApprove(pr)}
                              title="Approve Requisition Step"
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setSelectedPrForReject(pr)}
                              title="Reject Requisition"
                              className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded text-xs font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {pr.status === 'APPROVED' && (
                          <button
                            onClick={() => {
                              setRfqPrId(pr.id);
                              setShowRfqModal(true);
                            }}
                            className="px-2.5 py-1 bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 rounded text-xs font-medium"
                          >
                            Generate RFQ
                          </button>
                        )}

                        {(pr.status === 'DRAFT' || pr.status === 'BUDGET_CHECKED' || pr.status === 'PENDING_APPROVAL') && (
                          <button
                            onClick={() => handleCancelPr(pr)}
                            title="Cancel Requisition"
                            className="px-1.5 py-1 text-slate-400 hover:text-rose-400 rounded text-xs"
                          >
                            <X className="w-3.5 h-3.5 inline" />
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

      {/* TAB 4: RFQS */}
      {activeTab === 'RFQS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Requests for Quotation (RFQ)</h2>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">RFQ Number</th>
                  <th className="p-4">PR Ref</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Closing Date</th>
                  <th className="p-4">Invited Vendors</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rfqs.map(rfq => (
                  <tr key={rfq.id} className="hover:bg-slate-800/30">
                    <td className="p-4 font-mono font-semibold text-blue-400">{rfq.rfqNumber}</td>
                    <td className="p-4 font-mono text-slate-400">{rfq.prNumber}</td>
                    <td className="p-4 text-white font-medium">{rfq.title}</td>
                    <td className="p-4 text-slate-400 text-xs">{new Date(rfq.closingDate).toLocaleDateString()}</td>
                    <td className="p-4 text-slate-300 font-mono text-xs">{rfq.vendorIds.length} Vendors Invited</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {rfq.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: QUOTATION COMPARISON MATRIX */}
      {activeTab === 'QUOTATIONS' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Vendor Quotation Comparison Matrix</h2>
              <p className="text-xs text-slate-400">Commercial & Technical Multi-Vendor Evaluation</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Select RFQ:</span>
              <select
                value={selectedRfqForMatrix}
                onChange={(e) => handleSelectRfqMatrix(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono"
              >
                {rfqs.map(r => (
                  <option key={r.id} value={r.id}>{r.rfqNumber} - {r.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {comparisonMatrix.map((item, idx) => (
              <div key={idx} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">{item.itemName}</h3>
                    <span className="text-xs font-mono text-slate-400">SKU: {item.itemSku} • Requested Qty: {item.requestedQty} {item.uom}</span>
                  </div>
                  {item.winningVendorName && (
                    <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Recommended Winner: {item.winningVendorName}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {item.quotes.map((q, qIdx) => (
                    <div key={qIdx} className={`p-4 rounded-lg border text-sm space-y-2 ${
                      q.isSelected ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-slate-900/60 border-slate-800'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-white">{q.vendorName}</div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                          Score: {q.overallScore}/100
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                        <div>Unit Price: <span className="text-white font-mono font-medium">${q.unitPrice.toLocaleString()}</span></div>
                        <div>Total: <span className="text-emerald-400 font-mono font-bold">${q.totalPrice.toLocaleString()}</span></div>
                        <div>Tech Score: <span className="text-slate-200 font-mono">{q.technicalScore}</span></div>
                        <div>Lead Time: <span className="text-slate-200 font-mono">{q.leadTimeDays} days</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: PURCHASE ORDERS & CONTRACT PRICING (PHASE 3.2B-03) */}
      {activeTab === 'ORDERS' && (
        <PurchaseOrderHub
          vendors={vendors}
          requisitions={requisitions}
          rfqs={rfqs}
          paymentTerms={paymentTerms}
          incoterms={incoterms}
          buyerGroups={buyerGroups}
          purchasingOrgs={purchasingOrgs}
          productsList={productsList}
          uomsList={uomsList}
          onRefresh={loadAllProcurementData}
          onSelectForReceipt={(po) => {
            setSelectedPoForReceipt(po);
            setShowReceiptModal(true);
          }}
          onSelectForAmend={(po) => {
            setSelectedPoForAmend(po);
            setShowAmendModal(true);
          }}
        />
      )}

      {/* TAB 7: AMENDMENTS */}
      {activeTab === 'AMENDMENTS' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">PO Amendments & Version History</h2>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Amendment Ref</th>
                  <th className="p-4">PO Ref</th>
                  <th className="p-4">Version</th>
                  <th className="p-4">Requested By</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Amount Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {amendments.map(amd => (
                  <tr key={amd.id} className="hover:bg-slate-800/30">
                    <td className="p-4 font-mono font-semibold text-blue-400">{amd.amendmentNumber}</td>
                    <td className="p-4 font-mono text-slate-300">{amd.poNumber}</td>
                    <td className="p-4 font-mono text-slate-200">v{amd.version}</td>
                    <td className="p-4 text-white">{amd.requestedByName}</td>
                    <td className="p-4 text-slate-300 text-xs">{amd.amendmentReason}</td>
                    <td className="p-4 font-mono text-emerald-400">${amd.newTotalAmount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: PARTIAL DELIVERIES */}
      {activeTab === 'RECEIPTS' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Partial Deliveries & Goods Receipts</h2>
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
            <div className="text-sm text-slate-300">Select an active PO to record partial or full goods receipt line-by-line:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {purchaseOrders.map(po => (
                <div key={po.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-blue-400 font-mono">{po.poNumber}</div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">{po.status}</span>
                  </div>
                  <div className="text-xs text-slate-400">Vendor: {po.vendorName}</div>
                  <div className="space-y-2 pt-1">
                    {po.items.map(i => (
                      <div key={i.id} className="text-xs flex items-center justify-between bg-slate-950/40 p-2 rounded border border-slate-800">
                        <span>{i.itemSku} ({i.itemName})</span>
                        <span className="font-mono text-emerald-400">Rec: {i.receivedQty} / {i.orderedQty} (Open: {i.openQty})</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPoForReceipt(po);
                      setShowReceiptModal(true);
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
                  >
                    Post Goods Receipt
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: VENDOR RETURNS */}
      {activeTab === 'RETURNS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Vendor Return Notes</h2>
            <button
              onClick={() => {
                if (purchaseOrders.length > 0) setSelectedPoForReturn(purchaseOrders[0]);
                setShowReturnModal(true);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Initiate Vendor Return
            </button>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Return Ref</th>
                  <th className="p-4">PO Ref</th>
                  <th className="p-4">Vendor</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {returns.map(ret => (
                  <tr key={ret.id} className="hover:bg-slate-800/30">
                    <td className="p-4 font-mono font-semibold text-rose-400">{ret.returnNumber}</td>
                    <td className="p-4 font-mono text-slate-300">{ret.poNumber}</td>
                    <td className="p-4 text-white">{ret.vendorName}</td>
                    <td className="p-4 text-slate-300 text-xs">{ret.reason}</td>
                    <td className="p-4 font-mono text-rose-400">${ret.totalReturnAmount.toLocaleString()}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {ret.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: ADVANCED PROCUREMENT */}
      {activeTab === 'ADVANCED' && (
        <AdvancedProcurementHub
          vendors={vendors}
          onRefresh={loadAllProcurementData}
        />
      )}

      {/* TAB 10: AUDIT TRAIL */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Immutable Procurement Audit Trail</h2>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Performed By</th>
                  <th className="p-4">Target Doc</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Security Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.map(a => (
                  <tr key={a.id} className="hover:bg-slate-800/30">
                    <td className="p-4 text-xs text-slate-400">{new Date(a.performedAt).toLocaleString()}</td>
                    <td className="p-4 font-semibold text-blue-400">{a.actionType}</td>
                    <td className="p-4 text-white">{a.performedByName}</td>
                    <td className="p-4 font-mono text-slate-300">{a.targetDocumentNumber}</td>
                    <td className="p-4 text-xs text-slate-300">{a.details}</td>
                    <td className="p-4 font-mono text-xs text-slate-500">{a.immutableHash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 0A: NEW VENDOR */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Add Enterprise Vendor</h3>
            <form onSubmit={handleCreateVendor} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Vendor Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., VEN-ORACLE-01"
                  value={newVendor.code || ''}
                  onChange={e => setNewVendor({ ...newVendor, code: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Vendor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Oracle Systems Corp"
                  value={newVendor.name || ''}
                  onChange={e => setNewVendor({ ...newVendor, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Tax ID / VAT Registration</label>
                <input
                  type="text"
                  placeholder="e.g., 300182910200003"
                  value={newVendor.taxNumber || ''}
                  onChange={e => setNewVendor({ ...newVendor, taxNumber: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Vendor Category</label>
                <select
                  value={newVendor.vendorCategoryId || vendorCategories[0]?.id || 'vcat-001'}
                  onChange={e => setNewVendor({ ...newVendor, vendorCategoryId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm"
                >
                  {vendorCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowVendorModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium">Create Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 0B: NEW PURCHASE ORDER */}
      {showPoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Create Purchase Order</h3>
            <form onSubmit={handleCreatePo} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Select Vendor</label>
                <select
                  value={newPoVendorId || vendors[0]?.id}
                  onChange={e => setNewPoVendorId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm"
                >
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Item SKU</label>
                <input
                  type="text"
                  value={newPoItemSku}
                  onChange={e => setNewPoItemSku(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Item Description</label>
                <input
                  type="text"
                  value={newPoItemName}
                  onChange={e => setNewPoItemName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Quantity</label>
                  <input
                    type="number"
                    value={newPoQty}
                    onChange={e => setNewPoQty(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Unit Price ($)</label>
                  <input
                    type="number"
                    value={newPoPrice}
                    onChange={e => setNewPoPrice(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPoModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium">Create PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: ENTERPRISE PURCHASE REQUISITION CREATION */}
      {showPrModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-4xl w-full my-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Create Enterprise Purchase Requisition
                </h3>
                <p className="text-xs text-slate-400">Master Data verification, authoritative UOM snapshotting, and dimensional budget validation</p>
              </div>
              <button onClick={() => setShowPrModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePr} className="space-y-5">
              {/* SECTION A: HEADER & ORGANIZATIONAL DIMENSIONS */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-4 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">1. Organizational & Financial Scope</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400">Department</label>
                    <select
                      value={newPrHeader.departmentId}
                      onChange={e => setNewPrHeader({
                        ...newPrHeader,
                        departmentId: e.target.value,
                        departmentName: e.target.options[e.target.selectedIndex].text
                      })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-xs"
                    >
                      <option value="dept-02">Finance & Treasury</option>
                      <option value="dept-it">IT Infrastructure</option>
                      <option value="dept-ops">Operations & Facilities</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Cost Center</label>
                    <select
                      value={newPrHeader.costCenterId}
                      onChange={e => setNewPrHeader({
                        ...newPrHeader,
                        costCenterId: e.target.value,
                        costCenterName: e.target.options[e.target.selectedIndex].text
                      })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-xs"
                    >
                      <option value="cc-002">IT Infrastructure & Cloud (cc-002)</option>
                      <option value="cc-001">HQ Admin & Operations (cc-001)</option>
                      <option value="cc-003">Operations & Maintenance (cc-003)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Project Dimension (Optional)</label>
                    <select
                      value={newPrHeader.projectId}
                      onChange={e => setNewPrHeader({
                        ...newPrHeader,
                        projectId: e.target.value,
                        projectName: e.target.options[e.target.selectedIndex].text
                      })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-xs"
                    >
                      <option value="prj-001">NEOM Smart Gate Deployment (prj-001)</option>
                      <option value="prj-002">Riyadh Metro Line 3 Automation (prj-002)</option>
                      <option value="">No Project Assigned</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Target Warehouse</label>
                    <select
                      value={newPrHeader.warehouseId}
                      onChange={e => setNewPrHeader({
                        ...newPrHeader,
                        warehouseId: e.target.value,
                        warehouseName: e.target.options[e.target.selectedIndex].text
                      })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-xs"
                    >
                      <option value="wh-001">Central Warehouse - Riyadh</option>
                      <option value="wh-002">Jeddah Logistics Distribution Center</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Priority</label>
                    <select
                      value={newPrHeader.priority}
                      onChange={e => setNewPrHeader({ ...newPrHeader, priority: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-xs font-semibold text-amber-400"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Purchasing Organization</label>
                    <select
                      value={newPrHeader.purchasingOrgId}
                      onChange={e => setNewPrHeader({ ...newPrHeader, purchasingOrgId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-xs"
                    >
                      {purchasingOrgs.map(org => (
                        <option key={org.id} value={org.id}>{org.name} ({org.code})</option>
                      ))}
                      {purchasingOrgs.length === 0 && (
                        <option value="porg-001">Global Central Purchasing Org (porg-001)</option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Business Purpose / Procurement Justification</label>
                  <input
                    type="text"
                    value={newPrHeader.purpose}
                    onChange={e => setNewPrHeader({ ...newPrHeader, purpose: e.target.value })}
                    placeholder="Describe the operational need for this requisition..."
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-xs"
                    required
                  />
                </div>
              </div>

              {/* SECTION B: MULTI-LINE ITEMS BUILDER */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                    2. Requisition Line Items ({newPrLines.length})
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPrLine}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded text-xs flex items-center gap-1 font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line
                  </button>
                </div>

                <div className="border border-slate-700/80 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800 text-[11px] font-semibold uppercase text-slate-400 sticky top-0">
                      <tr>
                        <th className="p-2.5">Product SKU / Catalog</th>
                        <th className="p-2.5">Qty</th>
                        <th className="p-2.5">UOM</th>
                        <th className="p-2.5">Est. Unit Price ({newPrHeader.currency})</th>
                        <th className="p-2.5">Est. Total</th>
                        <th className="p-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {newPrLines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-2.5">
                            {productsList.length > 0 ? (
                              <select
                                value={line.productId}
                                onChange={e => handlePrLineProductChange(idx, e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs"
                              >
                                {productsList.map(p => (
                                  <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={line.itemSku}
                                onChange={e => {
                                  const updated = [...newPrLines];
                                  updated[idx].itemSku = e.target.value;
                                  updated[idx].itemName = e.target.value;
                                  setNewPrLines(updated);
                                }}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs"
                              />
                            )}
                          </td>
                          <td className="p-2.5 w-24">
                            <input
                              type="number"
                              min="1"
                              value={line.requestedQty}
                              onChange={e => {
                                const updated = [...newPrLines];
                                updated[idx].requestedQty = Number(e.target.value);
                                setNewPrLines(updated);
                              }}
                              className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs font-mono"
                            />
                          </td>
                          <td className="p-2.5 w-28">
                            <select
                              value={line.requestedUOM}
                              onChange={e => {
                                const updated = [...newPrLines];
                                updated[idx].requestedUOM = e.target.value;
                                setNewPrLines(updated);
                              }}
                              className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs font-mono"
                            >
                              <option value="PCS">PCS</option>
                              <option value="BOX">BOX</option>
                              <option value="KG">KG</option>
                              <option value="SET">SET</option>
                              <option value="PALLET">PALLET</option>
                            </select>
                          </td>
                          <td className="p-2.5 w-32">
                            <input
                              type="number"
                              min="0"
                              value={line.estimatedUnitPrice}
                              onChange={e => {
                                const updated = [...newPrLines];
                                updated[idx].estimatedUnitPrice = Number(e.target.value);
                                setNewPrLines(updated);
                              }}
                              className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs font-mono"
                            />
                          </td>
                          <td className="p-2.5 font-semibold text-slate-100 whitespace-nowrap">
                            {(line.requestedQty * line.estimatedUnitPrice).toLocaleString()} {newPrHeader.currency}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePrLine(idx)}
                              className="text-slate-500 hover:text-rose-400 transition-colors"
                              title="Remove Line"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total Summary */}
                <div className="flex items-center justify-between bg-slate-800/80 border border-slate-700 p-3 rounded-lg">
                  <div className="text-xs text-slate-300">
                    Total Estimated Amount across <span className="font-semibold text-white">{newPrLines.length}</span> line item(s):
                  </div>
                  <div className="text-base font-bold text-emerald-400">
                    {newPrLines.reduce((sum, l) => sum + (l.requestedQty * l.estimatedUnitPrice), 0).toLocaleString()} {newPrHeader.currency}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPrModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold shadow-md transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Create Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1B: PURCHASE REQUISITION DETAILS & AUDIT DRAWER */}
      {selectedPrForDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-4xl w-full my-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white font-mono">{selectedPrForDetail.prNumber}</h3>
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    v{selectedPrForDetail.version}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    selectedPrForDetail.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    selectedPrForDetail.status === 'PENDING_APPROVAL' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    selectedPrForDetail.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {selectedPrForDetail.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Requested by <span className="text-slate-200">{selectedPrForDetail.requestedByName || selectedPrForDetail.requesterName}</span> on {new Date(selectedPrForDetail.requisitionDate).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setSelectedPrForDetail(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dimensional Header Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/40 border border-slate-700/60 p-3.5 rounded-lg text-xs">
              <div>
                <span className="text-slate-400 block">Department:</span>
                <span className="text-slate-200 font-medium">{selectedPrForDetail.departmentName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Cost Center:</span>
                <span className="text-slate-200 font-mono font-medium">{selectedPrForDetail.costCenterName || selectedPrForDetail.costCenterId || 'General CC'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Project:</span>
                <span className="text-slate-200 font-medium">{selectedPrForDetail.projectName || selectedPrForDetail.projectId || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Warehouse:</span>
                <span className="text-slate-200 font-medium">{selectedPrForDetail.warehouseName || selectedPrForDetail.warehouseId}</span>
              </div>
            </div>

            {/* Budget Status Banner */}
            <div className={`p-4 rounded-lg border flex items-start gap-3 text-xs ${
              selectedPrForDetail.budgetStatus === 'WITHIN_BUDGET' ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' :
              selectedPrForDetail.budgetStatus === 'BUDGET_WARNING' ? 'bg-amber-950/30 border-amber-500/30 text-amber-300' :
              selectedPrForDetail.budgetStatus === 'BUDGET_BLOCKED' ? 'bg-rose-950/30 border-rose-500/30 text-rose-300' :
              'bg-slate-800 border-slate-700 text-slate-300'
            }`}>
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">
                  Budget Check: {selectedPrForDetail.budgetStatus || 'UNCHECKED'} (Policy: {selectedPrForDetail.budgetPolicy || 'NONE'})
                </div>
                <div className="mt-1 opacity-90">
                  {selectedPrForDetail.budgetCheckResult?.reason || 'Evaluated against company dimensional allocations without direct GL mutation.'}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Authoritative Requisition Lines ({(selectedPrForDetail.lines || selectedPrForDetail.items || []).length})
              </div>
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Item / SKU</th>
                      <th className="p-2.5">Requested Qty & UOM</th>
                      <th className="p-2.5">Base Qty & UOM</th>
                      <th className="p-2.5">Est. Unit Price</th>
                      <th className="p-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {(selectedPrForDetail.lines || selectedPrForDetail.items || []).map((l, i) => (
                      <tr key={i} className="hover:bg-slate-800/20">
                        <td className="p-2.5">
                          <div className="font-semibold text-white">{l.itemName}</div>
                          <div className="text-[11px] font-mono text-blue-400">{l.itemSku}</div>
                        </td>
                        <td className="p-2.5 font-mono">
                          {l.requestedQuantity || l.requestedQty} {l.requestedUOM || l.uom}
                        </td>
                        <td className="p-2.5 font-mono text-slate-400">
                          {l.baseQuantity || l.requestedQuantity || l.requestedQty} {l.baseUOM || l.requestedUOM || l.uom}
                          {l.uomConversionFactor && l.uomConversionFactor !== 1 ? ` (Factor: ${l.uomConversionFactor})` : ''}
                        </td>
                        <td className="p-2.5 font-mono">
                          {l.estimatedUnitPrice?.toLocaleString()} {selectedPrForDetail.currency}
                        </td>
                        <td className="p-2.5 text-right font-semibold text-slate-100 font-mono">
                          {(l.estimatedLineAmount || l.estimatedTotalPrice || 0).toLocaleString()} {selectedPrForDetail.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Workflow & Approval Steps */}
            {selectedPrForDetail.approvalHistory && selectedPrForDetail.approvalHistory.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Multi-Tier Workflow Signatures
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedPrForDetail.approvalHistory.map((step, idx) => (
                    <div key={idx} className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">Tier {step.stepNumber}: {step.approverRole}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          step.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                          step.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {step.status}
                        </span>
                      </div>
                      {step.approverName && (
                        <div className="text-slate-300">Signed by: {step.approverName}</div>
                      )}
                      {step.digitalSignature && (
                        <div className="text-[10px] font-mono text-emerald-400 truncate">
                          Signature: {step.digitalSignature}
                        </div>
                      )}
                      {step.comments && (
                        <div className="text-slate-400 italic">"{step.comments}"</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedPrForDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1C: APPROVE REQUISITION STEP WITH SOD */}
      {selectedPrForApprove && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Approve Requisition - {selectedPrForApprove.prNumber}
            </h3>
            <div className="bg-slate-800/40 p-3 rounded-lg text-xs space-y-1 text-slate-300 border border-slate-700/60">
              <div>Est. Amount: <span className="font-semibold text-white">{selectedPrForApprove.totalEstimatedAmount.toLocaleString()} {selectedPrForApprove.currency}</span></div>
              <div>Department: <span className="text-slate-200">{selectedPrForApprove.departmentName}</span></div>
              <div className="text-emerald-400 flex items-center gap-1 pt-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Segregation of Duties (SoD) & Digital Signature Verified
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Approver Role Authority</label>
                <select
                  value={approveUserRole}
                  onChange={e => setApproveUserRole(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-xs"
                >
                  <option value="Finance Director">Finance Director</option>
                  <option value="Procurement Manager">Procurement Manager</option>
                  <option value="VP Engineering">VP Engineering</option>
                  <option value="Department Manager">Department Manager</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Approval Comments / Audit Notes</label>
                <textarea
                  value={approveComments}
                  onChange={e => setApproveComments(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPrForApprove(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprovePr}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1D: REJECT REQUISITION */}
      {selectedPrForReject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Reject Requisition - {selectedPrForReject.prNumber}
            </h3>
            <p className="text-xs text-slate-400">
              Provide an authoritative justification for rejecting this procurement requisition.
            </p>

            <div>
              <label className="text-xs text-slate-400">Rejection Reason</label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-xs"
                placeholder="Specify reason for rejection..."
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPrForReject(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectPr}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold"
              >
                Reject Requisition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GOODS RECEIPT */}
      {showReceiptModal && selectedPoForReceipt && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Record Goods Receipt - {selectedPoForReceipt.poNumber}</h3>
            <form onSubmit={handleRecordReceipt} className="space-y-4">
              <div className="space-y-3">
                {selectedPoForReceipt.items.map(item => (
                  <div key={item.id} className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg space-y-2">
                    <div className="text-sm font-semibold text-white">{item.itemName} ({item.itemSku})</div>
                    <div className="text-xs text-slate-400">Ordered: {item.orderedQty} | Prev Received: {item.receivedQty} | Open: {item.openQty}</div>
                    <input
                      type="number"
                      max={item.openQty}
                      defaultValue={item.openQty}
                      onChange={e => setReceiptQtyMap({ ...receiptQtyMap, [item.id]: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-sm font-mono"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowReceiptModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium">Post Goods Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RFQ CREATION */}
      {showRfqModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Issue RFQ to Vendors</h3>
            <form onSubmit={handleCreateRfq} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Select Vendors to Invite</label>
                <div className="space-y-2 mt-2">
                  {vendors.map(v => (
                    <label key={v.id} className="flex items-center gap-2 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={rfqSelectedVendorIds.includes(v.id)}
                        onChange={e => {
                          if (e.target.checked) setRfqSelectedVendorIds([...rfqSelectedVendorIds, v.id]);
                          else setRfqSelectedVendorIds(rfqSelectedVendorIds.filter(id => id !== v.id));
                        }}
                      />
                      {v.name} ({v.code})
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowRfqModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded text-sm font-medium">Issue RFQ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: AMENDMENT */}
      {showAmendModal && selectedPoForAmend && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Amend PO - {selectedPoForAmend.poNumber}</h3>
            <form onSubmit={handleAmendPo} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Mandatory Amendment Reason</label>
                <textarea
                  value={amendmentReason}
                  onChange={e => setAmendmentReason(e.target.value)}
                  placeholder="e.g., Supplier requested unit price adjustment due to shipping costs..."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm h-20"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">New Quantity</label>
                  <input
                    type="number"
                    value={amendedQty}
                    onChange={e => setAmendedQty(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">New Unit Price ($)</label>
                  <input
                    type="number"
                    value={amendedPrice}
                    onChange={e => setAmendedPrice(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAmendModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded text-sm font-medium">Apply Amendment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: VENDOR RETURN */}
      {showReturnModal && selectedPoForReturn && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Initiate Vendor Return</h3>
            <form onSubmit={handleCreateReturn} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Reason for Return</label>
                <select
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm"
                >
                  <option value="DEFECTIVE">Defective Goods / Quality Issues</option>
                  <option value="OVER_DELIVERY">Over Delivery Beyond PO Limit</option>
                  <option value="WRONG_SPECIFICATION">Wrong Technical Specification</option>
                  <option value="DAMAGED_IN_TRANSIT">Damaged in Transit</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Return Quantity</label>
                <input
                  type="number"
                  value={returnQty}
                  onChange={e => setReturnQty(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowReturnModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded text-sm font-medium">Generate Return Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
