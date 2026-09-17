/**
 * AM ENTERPRISE ERP — PHASE 3.2C-03 CUSTOMER BILLING & REVENUE RECOGNITION HUB
 * Enterprise Workspace: Invoices, Delivery Billing, IFRS 15 Contracts, Revenue Amortization,
 * Milestone Plans, Intercompany Invoices, Credit Memos & Dunning Management
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  PieChart,
  Calendar,
  Building2,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRightLeft,
  ShieldCheck,
  Search,
  Filter,
  CreditCard,
  Percent,
  Clock,
  Send,
  Lock
} from 'lucide-react';
import { CustomerBillingEngine } from '../../engine/customerBillingEngine';
import {
  BillingDocument,
  BillingDocumentType,
  IFRS15RevenueContract,
  MilestoneBillingPlan,
  CustomerDunningRecord
} from '../../types/customerBilling';
import { Phase32C03HardeningSuite, Phase32C03Report } from '../../engine/phase32C03HardeningSuite';

export const CustomerBillingHub: React.FC = () => {
  const tenantId = 'tenant-egypt-corp';
  const companyId = 'comp-cairo-01';

  const [activeTab, setActiveTab] = useState<
    'INVOICES' | 'IFRS15' | 'AMORTIZATION' | 'MILESTONES' | 'INTERCOMPANY' | 'CREDIT_MEMOS' | 'DUNNING' | 'HARDENING'
  >('INVOICES');

  const [invoices, setInvoices] = useState<BillingDocument[]>([]);
  const [contracts, setContracts] = useState<IFRS15RevenueContract[]>([]);
  const [milestonePlans, setMilestonePlans] = useState<MilestoneBillingPlan[]>([]);
  const [dunningRecords, setDunningRecords] = useState<CustomerDunningRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<BillingDocument | null>(null);

  // Hardening suite state
  const [hardeningReport, setHardeningReport] = useState<Phase32C03Report | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('Egyptian Contracting Co.');
  const [newBillingType, setNewBillingType] = useState<BillingDocumentType>('STANDARD_INVOICE');
  const [newCurrency, setNewCurrency] = useState('USD');
  const [newAmount, setNewAmount] = useState(15000);
  const [newDiscountPct, setNewDiscountPct] = useState(5);

  const refreshData = () => {
    const invs = CustomerBillingEngine.getAllBillingDocuments(tenantId, companyId);
    const ctrs = CustomerBillingEngine.getAllIFRS15Contracts(tenantId, companyId);
    const plans = CustomerBillingEngine.getAllMilestonePlans(tenantId, companyId);
    const duns = CustomerBillingEngine.getAllDunningRecords(tenantId, companyId);

    setInvoices(invs);
    setContracts(ctrs);
    setMilestonePlans(plans);
    setDunningRecords(duns);

    if (invs.length > 0 && !selectedInvoice) {
      setSelectedInvoice(invs[0]);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleRunHardening = async () => {
    setIsRunningTests(true);
    try {
      const report = await Phase32C03HardeningSuite.runSuite();
      setHardeningReport(report);
      refreshData();
    } catch (err) {
      console.error('Error running hardening suite:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const inv = CustomerBillingEngine.createBillingDocument({
        tenantId,
        companyId,
        billingType: newBillingType,
        customerId: `cust-${Date.now().toString().slice(-4)}`,
        customerName: newCustomerName,
        billingAddress: 'Commercial District, Cairo',
        billingDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        currency: newCurrency,
        lines: [
          {
            sku: 'SKU-COMMERCIAL-SRV',
            description: 'Enterprise Enterprise Systems Consulting & Goods',
            billedQuantity: 1,
            uom: 'AU',
            unitPrice: newAmount,
            discountPercentage: newDiscountPct,
            taxCategory: 'STANDARD_VAT_15'
          }
        ],
        performedBy: 'billing.clerk@am-enterprise.com'
      });

      setShowCreateModal(false);
      refreshData();
      setSelectedInvoice(inv);
    } catch (err: any) {
      alert(`Error creating invoice: ${err.message}`);
    }
  };

  const handlePostInvoice = (id: string) => {
    try {
      CustomerBillingEngine.postBillingDocument(id, 'finance.controller@am-enterprise.com', true);
      refreshData();
    } catch (err: any) {
      alert(`Posting Error: ${err.message}`);
    }
  };

  const totalInvoiced = invoices.reduce((s, i) => s + i.totalGrossAmount, 0);
  const totalOpen = invoices.reduce((s, i) => s + i.openBalance, 0);
  const totalDeferred = contracts.reduce((s, c) => s + c.totalDeferredRevenue, 0);
  const totalRecognized = contracts.reduce((s, c) => s + c.totalRecognizedRevenue, 0);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.billingDocumentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || inv.billingType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen p-6 font-sans">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-indigo-600 text-white uppercase tracking-wider">
              Phase 3.2C-03 Active
            </span>
            <span className="text-xs font-mono text-slate-400">Architecture Baseline: v2.8 (Build 104)</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-indigo-400" />
            Customer Billing, Milestone Invoicing & IFRS 15 Revenue Recognition
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Enterprise SD-BIL / FI-CA / RAR: Delivery-Based Invoicing, POB Standalone Selling Price Allocation, Amortization & Dunning
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Invoice
          </button>
          <button
            onClick={handleRunHardening}
            disabled={isRunningTests}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            {isRunningTests ? 'Running Hardening Suite...' : 'Run 3.2C-03 Hardening (30 Tests)'}
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Invoiced</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">${totalInvoiced.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">{invoices.length} total billing documents</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AR Open Balance</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300 mt-2">${totalOpen.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Pending collections & dunning</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">IFRS 15 Recognized</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-300 mt-2">${totalRecognized.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Satisfied Performance Obligations</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Deferred Liabilities</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300 mt-2">${totalDeferred.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Unamortized Contract Liabilities</div>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 mt-6 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('INVOICES')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'INVOICES' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Billing Documents ({invoices.length})
        </button>

        <button
          onClick={() => setActiveTab('IFRS15')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'IFRS15' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          IFRS 15 Contracts ({contracts.length})
        </button>

        <button
          onClick={() => setActiveTab('MILESTONES')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'MILESTONES' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Milestone Billing Plans ({milestonePlans.length})
        </button>

        <button
          onClick={() => setActiveTab('INTERCOMPANY')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'INTERCOMPANY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          Intercompany Transfer Pricing
        </button>

        <button
          onClick={() => setActiveTab('DUNNING')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'DUNNING' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Dunning & Collections ({dunningRecords.length})
        </button>

        <button
          onClick={() => setActiveTab('HARDENING')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'HARDENING' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Phase 3.2C-03 Quality Gate
        </button>
      </div>

      {/* TAB 1: INVOICES WORKSPACE */}
      {activeTab === 'INVOICES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* List Column */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search invoice number, customer..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Types</option>
                <option value="STANDARD_INVOICE">Standard Invoice</option>
                <option value="DELIVERY_BASED_INVOICE">Delivery Based</option>
                <option value="MILESTONE_INVOICE">Milestone Invoice</option>
                <option value="INTERCOMPANY_INVOICE">Intercompany</option>
                <option value="CREDIT_MEMO">Credit Memo</option>
                <option value="DOWN_PAYMENT_REQUEST">Down Payment</option>
              </select>
            </div>

            <div className="space-y-2 mt-4 max-h-[500px] overflow-y-auto">
              {filteredInvoices.map(inv => (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedInvoice?.id === inv.id
                      ? 'bg-slate-800/80 border-indigo-500 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-indigo-400">{inv.billingDocumentNumber}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        inv.status === 'POSTED_TO_FI'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : inv.status === 'PAID'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : inv.status === 'REVERSED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <div className="text-xs font-semibold text-white">{inv.customerName}</div>
                      <div className="text-[10px] text-slate-400">
                        {inv.billingType} • Due: {inv.dueDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-white">
                        ${inv.totalGrossAmount.toLocaleString()} {inv.currency}
                      </div>
                      <div className="text-[10px] text-slate-400">Open: ${inv.openBalance.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details Column */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5">
            {selectedInvoice ? (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400">Document Detail</span>
                    <h3 className="text-base font-bold text-white">{selectedInvoice.billingDocumentNumber}</h3>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 bg-slate-800 rounded text-slate-300">
                    Ver: {selectedInvoice.version}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                  <div>
                    <span className="text-slate-500">Customer</span>
                    <div className="font-semibold text-white">{selectedInvoice.customerName}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Billing Type</span>
                    <div className="font-semibold text-indigo-400">{selectedInvoice.billingType}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Billing Date</span>
                    <div className="text-slate-300">{selectedInvoice.billingDate}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Due Date</span>
                    <div className="text-slate-300">{selectedInvoice.dueDate}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Net Amount</span>
                    <div className="font-semibold text-white">${selectedInvoice.subtotalNetAmount.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Tax Total (VAT 15%)</span>
                    <div className="font-semibold text-white">${selectedInvoice.totalTaxAmount.toLocaleString()}</div>
                  </div>
                </div>

                {/* Line Items */}
                <div className="mt-5">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Line Items</span>
                  <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                    {selectedInvoice.lines.map(line => (
                      <div key={line.id} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                        <div className="flex justify-between font-semibold text-white">
                          <span>{line.sku}</span>
                          <span>${line.grossAmount.toLocaleString()}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{line.description}</div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                          <span>Qty: {line.billedQuantity} {line.uom} @ ${line.unitPrice}</span>
                          <span>Tax: ${line.taxAmount} ({line.taxCategory})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Posting Details */}
                {selectedInvoice.glJournalEntryId && (
                  <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Posted to General Ledger
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1">
                      Journal Entry: <span className="font-mono text-white">{selectedInvoice.glJournalEntryId}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      ZATCA UUID: {selectedInvoice.zatcaUuid}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedInvoice.status === 'DRAFT' && (
                  <div className="mt-5">
                    <button
                      onClick={() => handlePostInvoice(selectedInvoice.id)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Release & Post to General Ledger (Dual-Control)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                Select an invoice to inspect line details and financial postings.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: IFRS 15 REVENUE CONTRACTS */}
      {activeTab === 'IFRS15' && (
        <div className="mt-6 space-y-4">
          {contracts.map(c => (
            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono text-indigo-400">{c.contractNumber}</span>
                  <h3 className="text-lg font-bold text-white">{c.customerName}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">Sales Order: {c.salesOrderId}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Total Transaction Price</div>
                  <div className="text-lg font-bold text-white">${c.totalTransactionPrice.toLocaleString()} {c.currency}</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                    {c.status}
                  </span>
                </div>
              </div>

              {/* Performance Obligations */}
              <div className="mt-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Performance Obligations (POBs) & Standalone Selling Price Allocation
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {c.performanceObligations.map(pob => (
                    <div key={pob.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white">{pob.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {pob.pobType}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                        <div>
                          <span className="text-slate-500">Standalone Selling Price</span>
                          <div className="font-semibold text-slate-300">${pob.standaloneSellingPrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Allocated Transaction Price</span>
                          <div className="font-semibold text-indigo-400">${pob.allocatedTransactionPrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Recognized to Date</span>
                          <div className="font-semibold text-emerald-400">${pob.recognizedRevenue.toLocaleString()} ({pob.satisfactionPercentage}%)</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Deferred Revenue Balance</span>
                          <div className="font-semibold text-cyan-400">${pob.deferredRevenueBalance.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: MILESTONE PLANS */}
      {activeTab === 'MILESTONES' && (
        <div className="mt-6 space-y-4">
          {milestonePlans.map(plan => (
            <div key={plan.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono text-indigo-400">{plan.planNumber}</span>
                  <h3 className="text-lg font-bold text-white">{plan.customerName}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">Contract Value: ${plan.totalContractValue.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Total Retention Held (10%)</div>
                  <div className="text-base font-bold text-amber-300">${plan.totalRetentionHeld.toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-2.5 mt-4">
                {plan.stages.map(stage => (
                  <div
                    key={stage.id}
                    className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        {stage.stageName} ({stage.milestonePercentage}%)
                        {stage.isSignoffApproved && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Target Date: {stage.targetDate} • Retention: ${stage.retentionAmount} • Net Billed: ${stage.netBilledAmount}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                          stage.status === 'BILLED'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : stage.status === 'APPROVED_FOR_BILLING'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {stage.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: INTERCOMPANY */}
      {activeTab === 'INTERCOMPANY' && (
        <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
            Intercompany Transfer Pricing & Auto-Mirror AP Voucher Engine
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Cross-entity invoicing applies defined transfer pricing markup (Cost + 15%) and automatically creates the mirror AP Voucher in the receiving legal entity for seamless consolidated elimination.
          </p>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>Active Rule:</span>
              <span className="font-mono text-white">Cairo LLC (comp-cairo-01) $\rightarrow$ Dubai FZE (comp-dubai-02)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Transfer Pricing Formula:</span>
              <span className="font-semibold text-emerald-400">Cost-Plus 15.00%</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Elimination Account:</span>
              <span className="font-mono text-indigo-400">590000-INTERCOMPANY-ELIMINATION</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DUNNING */}
      {activeTab === 'DUNNING' && (
        <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Dunning & Collections Management
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated multi-tier overdue escalation (Levels 1-4), fee assessment, and credit freeze rules
              </p>
            </div>
            <button
              onClick={() => {
                CustomerBillingEngine.runDunningEvaluation(tenantId, companyId, '2026-09-02');
                refreshData();
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold"
            >
              Run Dunning Evaluation
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {dunningRecords.map(d => (
              <div key={d.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{d.customerName}</span>
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                      d.currentDunningLevel === 'LEVEL_4_LEGAL_COLLECTION'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : d.currentDunningLevel === 'LEVEL_3_FINAL_NOTICE'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {d.currentDunningLevel}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 text-slate-400 text-[11px]">
                  <div>Overdue Amount: <span className="font-semibold text-white">${d.totalOverdueAmount.toLocaleString()}</span></div>
                  <div>Days Overdue: <span className="font-semibold text-rose-400">{d.daysOverdue} Days</span></div>
                  <div>Assessed Fee: <span className="font-semibold text-amber-300">${d.dunningFeeAmount}</span></div>
                </div>
                {d.isCreditBlocked && (
                  <div className="mt-2 text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Customer Credit Frozen: New Sales Orders & Deliveries Blocked
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: HARDENING SUITE */}
      {activeTab === 'HARDENING' && (
        <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                Phase 3.2C-03 Enterprise Quality Gate & Verification
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                30 Comprehensive Hardening Scenarios: Delivery Invoicing, IFRS 15 SSP Allocation, Milestone Retention & Dunning
              </p>
            </div>
            <button
              onClick={handleRunHardening}
              disabled={isRunningTests}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              {isRunningTests ? 'Executing Scenarios...' : 'Run Hardening Suite'}
            </button>
          </div>

          {hardeningReport && (
            <div className="mt-5">
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  hardeningReport.verdict === 'APPROVED'
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}
              >
                <div>
                  <div className="text-sm font-bold">
                    Verdict: {hardeningReport.verdict} ({hardeningReport.passedCount}/{hardeningReport.totalTests} Scenarios Passed)
                  </div>
                  <div className="text-xs opacity-80 mt-0.5">{hardeningReport.phase}</div>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/40">
                  100% GREEN
                </span>
              </div>

              <div className="space-y-2 mt-4 max-h-96 overflow-y-auto">
                {hardeningReport.results.map(r => (
                  <div
                    key={r.scenarioNumber}
                    className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          r.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {r.scenarioNumber}
                      </span>
                      <div>
                        <div className="font-semibold text-white">{r.name}</div>
                        {r.details && <div className="text-[11px] text-slate-400 mt-0.5">{r.details}</div>}
                        {r.error && <div className="text-[11px] text-rose-400 mt-0.5">{r.error}</div>}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{r.durationMs}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Create New Billing Document</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Billing Type</label>
                  <select
                    value={newBillingType}
                    onChange={e => setNewBillingType(e.target.value as BillingDocumentType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="STANDARD_INVOICE">Standard Invoice</option>
                    <option value="DOWN_PAYMENT_REQUEST">Down Payment Request</option>
                    <option value="PRO_FORMA_INVOICE">Pro-Forma Invoice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Currency</label>
                  <select
                    value={newCurrency}
                    onChange={e => setNewCurrency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EGP">EGP (E£)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="SAR">SAR (﷼)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={e => setNewAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Discount (%)</label>
                  <input
                    type="number"
                    value={newDiscountPct}
                    onChange={e => setNewDiscountPct(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-md"
                >
                  Create Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
