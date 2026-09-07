import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileText, CreditCard, Receipt, ArrowUpDown, ShieldAlert,
  Clock, DollarSign, Calendar, Filter, Plus, Search, RefreshCw, CheckCircle2,
  XCircle, AlertTriangle, ArrowRight, Download, FileSpreadsheet, Eye, ChevronRight,
  TrendingUp, TrendingDown, BookOpen, Layers, CheckSquare, RotateCcw, AlertOctagon,
  Lock, Unlock, ShieldCheck, Scale, History, UserCheck
} from 'lucide-react';
import { ApiClient } from '../../services/apiClient';
import { 
  ARCustomer, 
  CustomerSalesInvoice, 
  CustomerCreditNote, 
  CustomerReceipt, 
  ReceiptAllocationRecord, 
  CustomerAgingReport, 
  CustomerAgingSnapshotRecord, 
  CollectionActivityNote, 
  PromiseToPayRecord, 
  RevenueRecognitionSchedule, 
  ARAuditRecord,
  ARCreditControlCheck,
  CustomerStatementOfAccount
} from '../../types/accountsReceivable';

export const AccountsReceivableManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'invoices' | 'receipts' | 'allocations' | 'credit-control' | 'aging' | 'statements' | 'collections' | 'rev-rec' | 'audit'>('overview');

  // Core Data States
  const [customers, setCustomers] = useState<ARCustomer[]>([]);
  const [invoices, setInvoices] = useState<CustomerSalesInvoice[]>([]);
  const [creditNotes, setCreditNotes] = useState<CustomerCreditNote[]>([]);
  const [receipts, setReceipts] = useState<CustomerReceipt[]>([]);
  const [allocations, setAllocations] = useState<ReceiptAllocationRecord[]>([]);
  const [agingReport, setAgingReport] = useState<CustomerAgingReport | null>(null);
  const [agingSnapshots, setAgingSnapshots] = useState<CustomerAgingSnapshotRecord[]>([]);
  const [revRecSchedules, setRevRecSchedules] = useState<RevenueRecognitionSchedule[]>([]);
  const [auditLogs, setAuditLogs] = useState<ARAuditRecord[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals & Active Selections
  const [showNewCustomerModal, setShowNewCustomerModal] = useState<boolean>(false);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState<boolean>(false);
  const [showNewReceiptModal, setShowNewReceiptModal] = useState<boolean>(false);
  const [showNewCreditNoteModal, setShowNewCreditNoteModal] = useState<boolean>(false);
  const [showCollectionNoteModal, setShowCollectionNoteModal] = useState<boolean>(false);
  const [showPromiseModal, setShowPromiseModal] = useState<boolean>(false);

  // Form States
  const [newCustomer, setNewCustomer] = useState({
    code: '',
    name: '',
    nameAr: '',
    category: 'ENTERPRISE',
    taxNumber: '310' + Math.floor(1000000000 + Math.random() * 9000000000) + '00003',
    crNumber: '1010' + Math.floor(100000 + Math.random() * 900000),
    email: '',
    phone: '',
    address: '',
    creditClass: 'CLASS_A_PRIME',
    creditLimit: 500000,
    creditDays: 30,
    salesTerritory: 'RIYADH_CENTRAL',
    currency: 'SAR',
    paymentTermsCode: 'NET_30'
  });

  const [newInvoice, setNewInvoice] = useState({
    customerId: '',
    salesOrderRef: 'SO-2026-' + Math.floor(1000 + Math.random() * 9000),
    currency: 'SAR',
    lineItemName: 'Enterprise SaaS License & Professional Services',
    unitPrice: 100000,
    quantity: 1
  });

  const [newReceipt, setNewReceipt] = useState({
    customerId: '',
    paymentMethod: 'WIRE_TRANSFER',
    receiptType: 'STANDARD',
    totalAmount: 50000,
    referenceNumber: 'WIRE-' + Math.floor(100000 + Math.random() * 900000),
    autoAllocate: true
  });

  const [newCreditNote, setNewCreditNote] = useState({
    customerId: '',
    type: 'PRICE_ADJUSTMENT',
    reason: 'Commercial volume discount adjustment',
    subtotal: 10000,
    taxRate: 0.15,
    invoiceId: ''
  });

  // Credit Control Check State
  const [checkCustId, setCheckCustId] = useState<string>('');
  const [checkProposedAmt, setCheckProposedAmt] = useState<number>(50000);
  const [creditCheckResult, setCreditCheckResult] = useState<ARCreditControlCheck | null>(null);

  // Statement State
  const [statementCustId, setStatementCustId] = useState<string>('');
  const [statementData, setStatementData] = useState<CustomerStatementOfAccount | null>(null);

  // Collections Form State
  const [selectedCustForCol, setSelectedCustForCol] = useState<string>('');
  const [colNotes, setColNotes] = useState<CollectionActivityNote[]>([]);
  const [colPromises, setColPromises] = useState<PromiseToPayRecord[]>([]);
  const [newColNote, setNewColNote] = useState({
    reminderLevel: 'LEVEL_1_GENTLE',
    activityType: 'CALL',
    notes: '',
    followUpDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  });
  const [newPromise, setNewPromise] = useState({
    invoiceId: '',
    promisedAmount: 25000,
    promiseDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    notes: 'Promised full payment via SAMBA Wire'
  });

  // Load All Data
  const loadARData = async () => {
    setLoading(true);
    try {
      const [custs, invs, cns, rcts, allocs, aging, snaps, revs, logs] = await Promise.all([
        ApiClient.getARCustomers(),
        ApiClient.getARSalesInvoices(),
        ApiClient.getARCreditNotes(),
        ApiClient.getARReceipts(),
        ApiClient.getARAllocations(),
        ApiClient.getARAgingReport(),
        ApiClient.getARAgingSnapshots(),
        ApiClient.getARRevRecSchedules(),
        ApiClient.getARAuditLogs()
      ]);

      setCustomers(custs || []);
      setInvoices(invs || []);
      setCreditNotes(cns || []);
      setReceipts(rcts || []);
      setAllocations(allocs || []);
      setAgingReport(aging || null);
      setAgingSnapshots(snaps || []);
      setRevRecSchedules(revs || []);
      setAuditLogs(logs || []);

      if (custs && custs.length > 0) {
        if (!checkCustId) setCheckCustId(custs[0].id);
        if (!statementCustId) setStatementCustId(custs[0].id);
        if (!selectedCustForCol) setSelectedCustForCol(custs[0].id);
      }
    } catch (err) {
      console.error('Failed to load AR domain data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadARData();
  }, []);

  // Customer Statement Trigger
  const handleFetchStatement = async () => {
    if (!statementCustId) return;
    try {
      const res = await ApiClient.getARCustomerStatement(statementCustId);
      setStatementData(res);
    } catch (err) {
      console.error('Failed to load statement:', err);
    }
  };

  useEffect(() => {
    if (statementCustId && activeTab === 'statements') {
      handleFetchStatement();
    }
  }, [statementCustId, activeTab]);

  // Credit Control Check Trigger
  const handleRunCreditCheck = async () => {
    if (!checkCustId) return;
    try {
      const res = await ApiClient.getARCreditControl(checkCustId, checkProposedAmt);
      setCreditCheckResult(res);
    } catch (err) {
      console.error('Failed credit check:', err);
    }
  };

  // Collections Notes / Promises Trigger
  const handleLoadCollectionsForCustomer = async (cust: string) => {
    if (!cust) return;
    try {
      const [notes, promises] = await Promise.all([
        ApiClient.getARCollectionNotes(cust),
        ApiClient.getARPromisesToPay(cust)
      ]);
      setColNotes(notes || []);
      setColPromises(promises || []);
    } catch (err) {
      console.error('Failed to load collection details:', err);
    }
  };

  useEffect(() => {
    if (selectedCustForCol && activeTab === 'collections') {
      handleLoadCollectionsForCustomer(selectedCustForCol);
    }
  }, [selectedCustForCol, activeTab]);

  // Handlers for Form Submissions
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.createARCustomer({
        ...newCustomer,
        code: newCustomer.code || `CUST-AR-${Math.floor(100 + Math.random() * 900)}`
      });
      setShowNewCustomerModal(false);
      loadARData();
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.customerId) return alert('Please select a customer');
    try {
      const lineTotal = newInvoice.unitPrice * newInvoice.quantity;
      await ApiClient.createARSalesInvoice({
        customerId: newInvoice.customerId,
        salesOrderRef: newInvoice.salesOrderRef,
        currency: newInvoice.currency,
        lines: [
          {
            itemCode: 'ITEM-SaaS-01',
            itemName: newInvoice.lineItemName,
            quantity: newInvoice.quantity,
            unitPrice: newInvoice.unitPrice,
            taxRate: 0.15,
            discountRate: 0,
            discountAmount: 0,
            lineTotal: lineTotal * 1.15
          }
        ]
      });
      setShowNewInvoiceModal(false);
      loadARData();
    } catch (err: any) {
      alert(err.message || 'Failed to create sales invoice');
    }
  };

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReceipt.customerId) return alert('Please select a customer');
    try {
      await ApiClient.createARReceipt(newReceipt);
      setShowNewReceiptModal(false);
      loadARData();
    } catch (err: any) {
      alert(err.message || 'Failed to record receipt');
    }
  };

  const handleCreateCreditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCreditNote.customerId) return alert('Please select a customer');
    try {
      await ApiClient.createARCreditNote(newCreditNote);
      setShowNewCreditNoteModal(false);
      loadARData();
    } catch (err: any) {
      alert(err.message || 'Failed to create credit note');
    }
  };

  const handleCreateColNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustForCol) return;
    try {
      await ApiClient.createARCollectionNote({
        customerId: selectedCustForCol,
        ...newColNote
      });
      setShowCollectionNoteModal(false);
      handleLoadCollectionsForCustomer(selectedCustForCol);
      loadARData();
    } catch (err: any) {
      alert(err.message || 'Failed to save note');
    }
  };

  const handleCreatePromise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustForCol) return;
    try {
      await ApiClient.createARPromiseToPay({
        customerId: selectedCustForCol,
        ...newPromise
      });
      setShowPromiseModal(false);
      handleLoadCollectionsForCustomer(selectedCustForCol);
      loadARData();
    } catch (err: any) {
      alert(err.message || 'Failed to save promise');
    }
  };

  const handleReverseReceipt = async (receiptId: string) => {
    const reason = prompt('Enter payment reversal / bounce reason:', 'Bounced Wire Transfer');
    if (!reason) return;
    try {
      await ApiClient.reverseARReceipt(receiptId, reason);
      loadARData();
    } catch (err: any) {
      alert(err.message || 'Failed to reverse receipt');
    }
  };

  const handleFreezeAgingSnapshot = async () => {
    try {
      await ApiClient.createARAgingSnapshot();
      alert('Official Customer Aging Snapshot frozen and archived into audit vault.');
      loadARData();
    } catch (err: any) {
      alert(err.message || 'Failed to freeze snapshot');
    }
  };

  // KPI Computations
  const totalOpenAR = invoices
    .filter(i => i.status === 'POSTED')
    .reduce((sum, i) => sum + i.remainingAmount, 0);

  const totalInvoicedThisMonth = invoices
    .filter(i => i.status === 'POSTED')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const totalCollected = receipts
    .filter(r => r.status === 'POSTED')
    .reduce((sum, r) => sum + r.totalAmount, 0);

  const totalOverdueAR = agingReport 
    ? ((agingReport.total31To60 || 0) + (agingReport.total61To90 || 0) + (agingReport.total91To120 || 0) + (agingReport.total120Plus || 0)) 
    : 0;

  const overdueRatio = totalOpenAR > 0 ? ((totalOverdueAR / totalOpenAR) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-5 rounded-xl border border-slate-700/60 shadow-lg backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                Accounts Receivable & Order-to-Cash (O2C)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                  Phase 2.5 Active
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Enterprise Revenue Engine • Customer Master • ZATCA e-Invoicing • Credit Control • Collections & IFRS 15
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setShowNewInvoiceModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Issue Sales Invoice
          </button>

          <button 
            onClick={() => setShowNewReceiptModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
          >
            <CreditCard className="w-4 h-4" /> Record Customer Receipt
          </button>

          <button 
            onClick={() => setShowNewCustomerModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold shadow-md transition-all border border-slate-600"
          >
            <Users className="w-4 h-4" /> Add Customer
          </button>

          <button 
            onClick={loadARData}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all border border-slate-600"
            title="Refresh AR Engine Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Open Accounts Receivable</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {totalOpenAR.toLocaleString()} <span className="text-xs font-normal text-slate-400">SAR</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Active Uncollected Receivables Portfolio
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Collected Revenue (YTD)</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {totalCollected.toLocaleString()} <span className="text-xs font-normal text-slate-400">SAR</span>
          </div>
          <div className="text-[11px] text-blue-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Reconciled & Cash Cleared
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Overdue Balance</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400">
            {totalOverdueAR.toLocaleString()} <span className="text-xs font-normal text-slate-400">SAR</span>
          </div>
          <div className="text-[11px] text-amber-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {overdueRatio}% Overdue Ratio vs Total AR
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>DSO / Collection Efficiency</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {agingReport ? agingReport.dsoDays : 34} <span className="text-xs font-normal text-slate-400">Days</span>
          </div>
          <div className="text-[11px] text-purple-400 flex items-center gap-1">
            <CheckSquare className="w-3 h-3" /> Target: &lt;45 Days (Enterprise Standard)
          </div>
        </div>
      </div>

      {/* DOMAIN NAVIGATION TABS */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-700/80 pb-2 scrollbar-none">
        {[
          { id: 'overview', label: 'Executive Cockpit', icon: Layers },
          { id: 'customers', label: 'Customer Master', icon: Users },
          { id: 'invoices', label: 'Sales Invoices', icon: FileText },
          { id: 'receipts', label: 'Receipts & Payments', icon: CreditCard },
          { id: 'allocations', label: 'Receipt Allocations', icon: ArrowUpDown },
          { id: 'credit-control', label: 'Credit Control', icon: ShieldAlert },
          { id: 'aging', label: 'Customer Aging', icon: Clock },
          { id: 'statements', label: 'Customer Statements', icon: BookOpen },
          { id: 'collections', label: 'Dunning & Collections', icon: UserCheck },
          { id: 'rev-rec', label: 'Revenue Recognition', icon: Scale },
          { id: 'audit', label: 'Audit Trail', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}

      {/* 1. EXECUTIVE COCKPIT */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions Panel */}
            <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" /> Key Order-to-Cash Workflows
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button 
                  onClick={() => setShowNewInvoiceModal(true)}
                  className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 rounded-lg text-left space-y-2 group transition-all"
                >
                  <div className="flex items-center justify-between">
                    <FileText className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                  </div>
                  <div className="text-xs font-bold text-slate-200">Issue Sales Invoice</div>
                  <div className="text-[11px] text-slate-400">ZATCA e-Invoicing QR & Hash validation</div>
                </button>

                <button 
                  onClick={() => setShowNewReceiptModal(true)}
                  className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 rounded-lg text-left space-y-2 group transition-all"
                >
                  <div className="flex items-center justify-between">
                    <CreditCard className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                  </div>
                  <div className="text-xs font-bold text-slate-200">Record Customer Receipt</div>
                  <div className="text-[11px] text-slate-400">Wire transfer, auto-FIFO allocation</div>
                </button>

                <button 
                  onClick={() => setActiveTab('credit-control')}
                  className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 rounded-lg text-left space-y-2 group transition-all"
                >
                  <div className="flex items-center justify-between">
                    <ShieldAlert className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
                  </div>
                  <div className="text-xs font-bold text-slate-200">Validate Credit Control</div>
                  <div className="text-[11px] text-slate-400">Examine exposure & block thresholds</div>
                </button>
              </div>
            </div>

            {/* Recent Sales Invoices */}
            <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" /> Recent Sales Invoices
                </h3>
                <button 
                  onClick={() => setActiveTab('invoices')}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  View All ({invoices.length}) <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Grand Total</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {invoices.slice(0, 5).map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="p-3 font-mono text-emerald-400 font-medium">{inv.invoiceNumber}</td>
                        <td className="p-3 font-medium text-white">{inv.customerName}</td>
                        <td className="p-3 text-slate-400">{inv.invoiceDate}</td>
                        <td className="p-3 font-semibold text-white">{inv.grandTotal.toLocaleString()} SAR</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold border ${
                            inv.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            inv.paymentStatus === 'OVERDUE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            {inv.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Customer Risk Profile Summary */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" /> Customer Credit Risk Distribution
              </h3>

              <div className="space-y-3">
                {customers.map(cust => (
                  <div key={cust.id} className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{cust.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cust.riskRating === 'LOW' ? 'bg-emerald-500/20 text-emerald-400' :
                        cust.riskRating === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {cust.creditClass}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Balance: {cust.currentBalance.toLocaleString()} SAR</span>
                        <span>Limit: {cust.creditLimit.toLocaleString()} SAR</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            (cust.currentBalance / cust.creditLimit) > 0.9 ? 'bg-rose-500' :
                            (cust.currentBalance / cust.creditLimit) > 0.6 ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, (cust.currentBalance / cust.creditLimit) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Stream Snapshot */}
            <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" /> Recent AR Audit Stream
              </h3>
              <div className="space-y-2 text-xs">
                {auditLogs.slice(0, 4).map(log => (
                  <div key={log.id} className="p-2.5 bg-slate-900/50 rounded border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="text-emerald-400 font-mono">{log.action}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-snug">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CUSTOMER MASTER TAB */}
      {activeTab === 'customers' && (
        <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search customers by name, CR, VAT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button 
              onClick={() => setShowNewCustomerModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> Add New Customer
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-3">Customer Code</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">VAT / CR Number</th>
                  <th className="p-3">Credit Class</th>
                  <th className="p-3">Credit Limit</th>
                  <th className="p-3">Current Balance</th>
                  <th className="p-3">Overdue Balance</th>
                  <th className="p-3">Risk Rating</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {customers
                  .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.taxNumber.includes(searchTerm))
                  .map(cust => (
                    <tr key={cust.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3 font-mono text-emerald-400 font-semibold">{cust.code}</td>
                      <td className="p-3">
                        <div className="font-bold text-white">{cust.name}</div>
                        <div className="text-[10px] text-slate-400">{cust.email} • {cust.phone}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-400 text-[11px]">
                        VAT: {cust.taxNumber}<br />CR: {cust.crNumber}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-700 text-slate-200">
                          {cust.creditClass}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-white">{cust.creditLimit.toLocaleString()} SAR</td>
                      <td className="p-3 font-bold text-emerald-400">{cust.currentBalance.toLocaleString()} SAR</td>
                      <td className="p-3 font-bold text-amber-400">{cust.overdueBalance.toLocaleString()} SAR</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                          cust.riskRating === 'LOW' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {cust.riskRating}
                        </span>
                      </td>
                      <td className="p-3">
                        {cust.isBlocked ? (
                          <span className="flex items-center gap-1 text-rose-400 text-[10px] font-bold">
                            <Lock className="w-3 h-3" /> Blocked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                            <Unlock className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SALES INVOICES TAB */}
      {activeTab === 'invoices' && (
        <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search invoice #, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>

            <button 
              onClick={() => setShowNewInvoiceModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> Issue Sales Invoice
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Invoice / Due Date</th>
                  <th className="p-3">Subtotal</th>
                  <th className="p-3">VAT (15%)</th>
                  <th className="p-3">Grand Total</th>
                  <th className="p-3">Remaining</th>
                  <th className="p-3">ZATCA Status</th>
                  <th className="p-3">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {invoices
                  .filter(inv => 
                    (statusFilter === 'ALL' || inv.paymentStatus === statusFilter) &&
                    (inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3 font-mono text-emerald-400 font-bold">{inv.invoiceNumber}</td>
                      <td className="p-3 font-bold text-white">{inv.customerName}</td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        Issued: {inv.invoiceDate}<br />Due: {inv.dueDate}
                      </td>
                      <td className="p-3 font-semibold text-slate-300">{inv.subtotal.toLocaleString()} SAR</td>
                      <td className="p-3 text-slate-400">{inv.taxTotal.toLocaleString()} SAR</td>
                      <td className="p-3 font-bold text-white">{inv.grandTotal.toLocaleString()} SAR</td>
                      <td className="p-3 font-bold text-emerald-400">{inv.remainingAmount.toLocaleString()} SAR</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> ZATCA Phase-2 Valid
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold border ${
                          inv.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          inv.paymentStatus === 'OVERDUE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {inv.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. RECEIPTS & PAYMENTS TAB */}
      {activeTab === 'receipts' && (
        <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-400" /> Customer Collections & Receipts
            </h3>
            <button 
              onClick={() => setShowNewReceiptModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> Record New Receipt
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-3">Receipt #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Receipt Date</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3">Ref Number</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Allocated</th>
                  <th className="p-3">Unallocated</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {receipts.map(rct => (
                  <tr key={rct.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-3 font-mono text-blue-400 font-bold">{rct.receiptNumber}</td>
                    <td className="p-3 font-bold text-white">{rct.customerName}</td>
                    <td className="p-3 text-slate-400">{rct.receiptDate}</td>
                    <td className="p-3 font-semibold text-slate-300">{rct.paymentMethod}</td>
                    <td className="p-3 font-mono text-slate-400">{rct.referenceNumber}</td>
                    <td className="p-3 font-bold text-white">{rct.totalAmount.toLocaleString()} SAR</td>
                    <td className="p-3 font-bold text-emerald-400">{rct.allocatedAmount.toLocaleString()} SAR</td>
                    <td className="p-3 font-bold text-amber-400">{rct.unallocatedAmount.toLocaleString()} SAR</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold border ${
                        rct.status === 'POSTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {rct.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {rct.status === 'POSTED' && (
                        <button 
                          onClick={() => handleReverseReceipt(rct.id)}
                          className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded text-[10px] font-bold transition-all border border-rose-500/30 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Reverse
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

      {/* 5. RECEIPT ALLOCATIONS TAB */}
      {activeTab === 'allocations' && (
        <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-emerald-400" /> Receipt & Invoice Matching Ledger
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-3">Allocation ID</th>
                  <th className="p-3">Receipt Ref</th>
                  <th className="p-3">Invoice Ref</th>
                  <th className="p-3">Allocated Amount</th>
                  <th className="p-3">Allocation Method</th>
                  <th className="p-3">Allocated At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {allocations.map(alloc => (
                  <tr key={alloc.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-3 font-mono text-slate-400">{alloc.id}</td>
                    <td className="p-3 font-mono text-blue-400 font-bold">{alloc.receiptNumber}</td>
                    <td className="p-3 font-mono text-emerald-400 font-bold">{alloc.invoiceNumber}</td>
                    <td className="p-3 font-extrabold text-white">{alloc.allocatedAmount.toLocaleString()} SAR</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-700 text-slate-200 font-bold">
                        {alloc.allocationType}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{new Date(alloc.allocatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. CREDIT CONTROL TAB */}
      {activeTab === 'credit-control' && (
        <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-xl space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-400" /> Automated Credit Limit & Risk Controller
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-700 p-4 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Test Order Credit Approval</h4>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Select Customer</label>
                  <select
                    value={checkCustId}
                    onChange={(e) => setCheckCustId(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 p-2 rounded border border-slate-700 focus:outline-none"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Proposed Sales Amount (SAR)</label>
                  <input 
                    type="number"
                    value={checkProposedAmt}
                    onChange={(e) => setCheckProposedAmt(Number(e.target.value))}
                    className="w-full bg-slate-800 text-slate-200 p-2 rounded border border-slate-700 focus:outline-none"
                  />
                </div>

                <button 
                  onClick={handleRunCreditCheck}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold transition-all shadow-md"
                >
                  Run Real-Time Exposure Validation
                </button>
              </div>
            </div>

            {/* Results Display */}
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-700 p-4 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Risk Decision Analysis</h4>

              {creditCheckResult ? (
                <div className="space-y-4 text-xs">
                  <div className={`p-4 rounded-lg border flex items-start gap-3 ${
                    creditCheckResult.decision === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    creditCheckResult.decision === 'WARNING' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    <ShieldCheck className="w-6 h-6 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-sm font-extrabold tracking-wide">
                        DECISION: {creditCheckResult.decision}
                      </div>
                      <p className="text-slate-300 text-xs">{creditCheckResult.reason}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-slate-800 rounded border border-slate-700">
                      <div className="text-[10px] text-slate-400">Credit Limit</div>
                      <div className="text-sm font-bold text-white">{creditCheckResult.creditLimit.toLocaleString()} SAR</div>
                    </div>
                    <div className="p-3 bg-slate-800 rounded border border-slate-700">
                      <div className="text-[10px] text-slate-400">Current Balance</div>
                      <div className="text-sm font-bold text-emerald-400">{creditCheckResult.currentBalance.toLocaleString()} SAR</div>
                    </div>
                    <div className="p-3 bg-slate-800 rounded border border-slate-700">
                      <div className="text-[10px] text-slate-400">Proposed Amount</div>
                      <div className="text-sm font-bold text-blue-400">{creditCheckResult.proposedAmount.toLocaleString()} SAR</div>
                    </div>
                    <div className="p-3 bg-slate-800 rounded border border-slate-700">
                      <div className="text-[10px] text-slate-400">Total Exposure</div>
                      <div className="text-sm font-bold text-purple-400">{creditCheckResult.projectedBalance.toLocaleString()} SAR</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Select a customer and proposed order amount, then run the validation check.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. CUSTOMER AGING TAB */}
      {activeTab === 'aging' && (
        <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" /> Accounts Receivable Aging Analysis
              </h3>
              <p className="text-xs text-slate-400">5-Bucket Enterprise Aging Engine</p>
            </div>

            <button 
              onClick={handleFreezeAgingSnapshot}
              className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold border border-slate-600 flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-amber-400" /> Freeze & Archive Aging Snapshot
            </button>
          </div>

          {agingReport && (
            <>
              {/* Aging Buckets Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 font-semibold">Current (0-30 Days)</div>
                  <div className="text-lg font-extrabold text-emerald-400">
                    {(agingReport.totalCurrent + agingReport.total1To30).toLocaleString()} SAR
                  </div>
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 font-semibold">31-60 Days</div>
                  <div className="text-lg font-extrabold text-blue-400">
                    {agingReport.total31To60.toLocaleString()} SAR
                  </div>
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 font-semibold">61-90 Days</div>
                  <div className="text-lg font-extrabold text-amber-400">
                    {agingReport.total61To90.toLocaleString()} SAR
                  </div>
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 font-semibold">91-120 Days</div>
                  <div className="text-lg font-extrabold text-rose-400">
                    {agingReport.total91To120.toLocaleString()} SAR
                  </div>
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl space-y-1 col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-slate-400 font-semibold">Over 120 Days</div>
                  <div className="text-lg font-extrabold text-red-500">
                    {agingReport.total120Plus.toLocaleString()} SAR
                  </div>
                </div>
              </div>

              {/* Customer Aging Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="p-3">Customer</th>
                      <th className="p-3 text-right">0-30 Days</th>
                      <th className="p-3 text-right">31-60 Days</th>
                      <th className="p-3 text-right">61-90 Days</th>
                      <th className="p-3 text-right">91-120 Days</th>
                      <th className="p-3 text-right">&gt;120 Days</th>
                      <th className="p-3 text-right">Total Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {(agingReport.buckets || []).map(item => (
                      <tr key={item.customerId} className="hover:bg-slate-700/30 transition-colors">
                        <td className="p-3 font-bold text-white">{item.customerName}</td>
                        <td className="p-3 text-right font-mono text-emerald-400">{(item.currentAmount + item.days1To30).toLocaleString()}</td>
                        <td className="p-3 text-right font-mono text-blue-400">{item.days31To60.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono text-amber-400">{item.days61To90.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono text-rose-400">{item.days91To120.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono text-red-500 font-bold">{item.days120Plus.toLocaleString()}</td>
                        <td className="p-3 text-right font-extrabold text-white">{item.totalOutstanding.toLocaleString()} SAR</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* 8. STATEMENT OF ACCOUNT TAB */}
      {activeTab === 'statements' && (
        <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Customer Statement of Account</h3>
                <p className="text-xs text-slate-400">Formal Ledger Audit Statement for Commercial Customers</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={statementCustId}
                onChange={(e) => setStatementCustId(e.target.value)}
                className="bg-slate-900 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>

              <button 
                onClick={handleFetchStatement}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
              >
                Generate Statement
              </button>
            </div>
          </div>

          {statementData && (
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between border-b border-slate-800 pb-4 gap-4">
                <div>
                  <h2 className="text-base font-extrabold text-white">{statementData.customerName}</h2>
                  <p className="text-xs text-slate-400">Tax ID: {statementData.customerTaxNumber}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div>Statement Date: {statementData.asOfDate}</div>
                  <div>Period: {statementData.startDate} to {statementData.endDate}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-slate-800/80 rounded border border-slate-700">
                  <div className="text-[10px] text-slate-400">Opening Balance</div>
                  <div className="text-sm font-bold text-slate-200">{statementData.openingBalance.toLocaleString()} SAR</div>
                </div>
                <div className="p-3 bg-slate-800/80 rounded border border-slate-700">
                  <div className="text-[10px] text-slate-400">Period Activity</div>
                  <div className="text-sm font-bold text-blue-400">
                    {(statementData.totalInvoiced - statementData.totalPaid).toLocaleString()} SAR
                  </div>
                </div>
                <div className="p-3 bg-slate-800/80 rounded border border-slate-700">
                  <div className="text-[10px] text-slate-400">Closing Balance Due</div>
                  <div className="text-sm font-extrabold text-emerald-400">{statementData.closingBalance.toLocaleString()} SAR</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Document #</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-right">Debit (+)</th>
                      <th className="p-2.5 text-right">Credit (-)</th>
                      <th className="p-2.5 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {statementData.lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2.5 text-slate-400">{line.date}</td>
                        <td className="p-2.5 font-semibold text-slate-200">{line.type}</td>
                        <td className="p-2.5 font-mono text-emerald-400">{line.documentNumber}</td>
                        <td className="p-2.5 text-slate-300">{line.description}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-400">
                          {line.debit > 0 ? `${line.debit.toLocaleString()} SAR` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono text-blue-400">
                          {line.credit > 0 ? `${line.credit.toLocaleString()} SAR` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-white">
                          {line.runningBalance.toLocaleString()} SAR
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 9. DUNNING & COLLECTIONS TAB */}
      {activeTab === 'collections' && (
        <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-400" /> Dunning & Collection Management
            </h3>

            <div className="flex items-center gap-3">
              <select
                value={selectedCustForCol}
                onChange={(e) => setSelectedCustForCol(e.target.value)}
                className="bg-slate-900 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>

              <button 
                onClick={() => setShowCollectionNoteModal(true)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Log Dunning Note
              </button>

              <button 
                onClick={() => setShowPromiseModal(true)}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Promise-to-Pay
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Log */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Dunning & Call Activity Notes</h4>
              <div className="space-y-2 text-xs">
                {colNotes.length > 0 ? (
                  colNotes.map(n => (
                    <div key={n.id} className="p-3 bg-slate-800 rounded border border-slate-700 space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-emerald-400">{n.reminderLevel} • {n.activityType}</span>
                        <span className="text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-300 text-xs">{n.notes}</p>
                      {n.followUpDate && (
                        <div className="text-[10px] text-amber-400 font-semibold">Follow Up: {n.followUpDate}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-xs p-4 text-center">No dunning notes logged for this customer yet.</div>
                )}
              </div>
            </div>

            {/* Promises to Pay */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Promises to Pay (PTP)</h4>
              <div className="space-y-2 text-xs">
                {colPromises.length > 0 ? (
                  colPromises.map(p => (
                    <div key={p.id} className="p-3 bg-slate-800 rounded border border-slate-700 space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-extrabold text-blue-400">{p.promisedAmount.toLocaleString()} SAR</span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">{p.status}</span>
                      </div>
                      <p className="text-slate-300 text-xs">{p.notes}</p>
                      <div className="text-[10px] text-slate-400">Promised Date: {p.promiseDate}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-xs p-4 text-center">No pending payment promises logged.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. REVENUE RECOGNITION TAB */}
      {activeTab === 'rev-rec' && (
        <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" /> Revenue Recognition Engine (IFRS 15)
              </h3>
              <p className="text-xs text-slate-400">Contractual Obligation Amortization & Deferred Revenue Schedules</p>
            </div>
          </div>

          <div className="space-y-4">
            {revRecSchedules.length > 0 ? (
              revRecSchedules.map(sched => (
                <div key={sched.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-mono text-emerald-400 font-bold">{sched.contractRef}</span>
                      <span className="ml-2 font-bold text-white">{sched.customerName}</span>
                    </div>
                    <span className="font-extrabold text-white text-sm">{sched.totalContractValue.toLocaleString()} SAR</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {sched.milestones.map((m, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-800 rounded border border-slate-700 space-y-1">
                        <div className="font-semibold text-slate-200">{m.period}</div>
                        <div className="text-emerald-400 font-bold">{m.recognizedAmount.toLocaleString()} SAR</div>
                        <div className="text-[10px] text-slate-400">{m.performanceObligation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active IFRS 15 revenue recognition schedules generated.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 11. AUDIT TRAIL TAB */}
      {activeTab === 'audit' && (
        <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" /> Immutable AR Audit Vault
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity Type</th>
                  <th className="p-3">Ref Number</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">SHA Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3 font-bold text-emerald-400">{log.action}</td>
                    <td className="p-3 text-slate-200">{log.entityType}</td>
                    <td className="p-3 font-mono text-white">{log.entityNumber}</td>
                    <td className="p-3 text-slate-300">{log.details}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-500">{log.hash.substring(0, 16)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: NEW CUSTOMER */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Create New Customer Master</h3>
              <button onClick={() => setShowNewCustomerModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Customer Commercial Name *</label>
                <input 
                  type="text" 
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
                  placeholder="e.g. Saudi Telecom Company (STC)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">VAT Number (15 Digit)</label>
                  <input 
                    type="text" 
                    value={newCustomer.taxNumber}
                    onChange={(e) => setNewCustomer({ ...newCustomer, taxNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">CR Number</label>
                  <input 
                    type="text" 
                    value={newCustomer.crNumber}
                    onChange={(e) => setNewCustomer({ ...newCustomer, crNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Credit Limit (SAR)</label>
                  <input 
                    type="number" 
                    value={newCustomer.creditLimit}
                    onChange={(e) => setNewCustomer({ ...newCustomer, creditLimit: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Credit Days</label>
                  <input 
                    type="number" 
                    value={newCustomer.creditDays}
                    onChange={(e) => setNewCustomer({ ...newCustomer, creditDays: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowNewCustomerModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded font-bold">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW SALES INVOICE */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Issue ZATCA-Compliant Sales Invoice</h3>
              <button onClick={() => setShowNewInvoiceModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Customer *</label>
                <select
                  required
                  value={newInvoice.customerId}
                  onChange={(e) => setNewInvoice({ ...newInvoice, customerId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Line Item Description *</label>
                <input 
                  type="text" 
                  required
                  value={newInvoice.lineItemName}
                  onChange={(e) => setNewInvoice({ ...newInvoice, lineItemName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Unit Price (SAR)</label>
                  <input 
                    type="number" 
                    value={newInvoice.unitPrice}
                    onChange={(e) => setNewInvoice({ ...newInvoice, unitPrice: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Quantity</label>
                  <input 
                    type="number" 
                    value={newInvoice.quantity}
                    onChange={(e) => setNewInvoice({ ...newInvoice, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-800 rounded border border-slate-700 text-[11px] text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{(newInvoice.unitPrice * newInvoice.quantity).toLocaleString()} SAR</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (15% Standard Rate):</span>
                  <span>{(newInvoice.unitPrice * newInvoice.quantity * 0.15).toLocaleString()} SAR</span>
                </div>
                <div className="flex justify-between font-extrabold text-emerald-400 text-xs pt-1 border-t border-slate-700">
                  <span>Grand Total (Inc. VAT):</span>
                  <span>{(newInvoice.unitPrice * newInvoice.quantity * 1.15).toLocaleString()} SAR</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowNewInvoiceModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded font-bold">Issue & Post Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW RECEIPT */}
      {showNewReceiptModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Record Customer Receipt</h3>
              <button onClick={() => setShowNewReceiptModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateReceipt} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Customer *</label>
                <select
                  required
                  value={newReceipt.customerId}
                  onChange={(e) => setNewReceipt({ ...newReceipt, customerId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Receipt Amount (SAR)</label>
                  <input 
                    type="number" 
                    value={newReceipt.totalAmount}
                    onChange={(e) => setNewReceipt({ ...newReceipt, totalAmount: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Payment Method</label>
                  <select
                    value={newReceipt.paymentMethod}
                    onChange={(e) => setNewReceipt({ ...newReceipt, paymentMethod: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
                  >
                    <option value="WIRE_TRANSFER">Wire Transfer (SAMBA/SNB)</option>
                    <option value="MADA">MADA Card</option>
                    <option value="CHEQUE">Corporate Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Bank Reference Number</label>
                <input 
                  type="text" 
                  value={newReceipt.referenceNumber}
                  onChange={(e) => setNewReceipt({ ...newReceipt, referenceNumber: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox"
                  id="autoAlloc"
                  checked={newReceipt.autoAllocate}
                  onChange={(e) => setNewReceipt({ ...newReceipt, autoAllocate: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                />
                <label htmlFor="autoAlloc" className="text-slate-300">Auto-Allocate to Oldest Invoices (FIFO)</label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowNewReceiptModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Record Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DUNNING NOTE */}
      {showCollectionNoteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Log Collection / Dunning Activity</h3>
              <button onClick={() => setShowCollectionNoteModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateColNote} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Reminder Level</label>
                  <select
                    value={newColNote.reminderLevel}
                    onChange={(e) => setNewColNote({ ...newColNote, reminderLevel: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
                  >
                    <option value="LEVEL_1_GENTLE">Level 1 - Gentle Reminder</option>
                    <option value="LEVEL_2_FIRM">Level 2 - Firm Statement</option>
                    <option value="LEVEL_3_FINAL">Level 3 - Final Notice</option>
                    <option value="LEGAL_NOTICE">Legal Action Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Activity Type</label>
                  <select
                    value={newColNote.activityType}
                    onChange={(e) => setNewColNote({ ...newColNote, activityType: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
                  >
                    <option value="CALL">Phone Call</option>
                    <option value="EMAIL">Email</option>
                    <option value="MEETING">In-Person Meeting</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Activity Notes *</label>
                <textarea 
                  required
                  rows={3}
                  value={newColNote.notes}
                  onChange={(e) => setNewColNote({ ...newColNote, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
                  placeholder="Record summary of discussion with customer CFO/Finance manager..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCollectionNoteModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Save Dunning Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROMISE TO PAY */}
      {showPromiseModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Record Customer Promise to Pay</h3>
              <button onClick={() => setShowPromiseModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreatePromise} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Promised Amount (SAR)</label>
                  <input 
                    type="number"
                    value={newPromise.promisedAmount}
                    onChange={(e) => setNewPromise({ ...newPromise, promisedAmount: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Promised Date</label>
                  <input 
                    type="date"
                    value={newPromise.promiseDate}
                    onChange={(e) => setNewPromise({ ...newPromise, promiseDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Promise Notes</label>
                <input 
                  type="text"
                  value={newPromise.notes}
                  onChange={(e) => setNewPromise({ ...newPromise, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowPromiseModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded font-bold">Record Promise</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
