/**
 * AM Business Platform - Accounts Payable & Financial Matching Management View
 * Enterprise UI for 3-Way Matching, GR/IR Clearing, AP Vouchers, Credit Notes, Payment Proposals, Vendor Statements, Aging & Accruals
 */

import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/apiClient';
import {
  SupplierInvoice,
  APVoucher,
  SupplierCreditNote,
  PaymentProposal,
  PaymentBatch,
  VendorStatement,
  VendorAgingReport,
  PurchaseAccrual,
  APAuditRecord,
  GRIRClearingRecord
} from '../types/accountsPayable';
import {
  Receipt,
  CheckCircle,
  AlertTriangle,
  FileText,
  CreditCard,
  DollarSign,
  TrendingDown,
  Calendar,
  Lock,
  RefreshCw,
  Plus,
  ArrowRight,
  ChevronRight,
  Search,
  ShieldCheck,
  Building,
  UserCheck,
  Zap,
  BarChart2,
  FileCheck,
  Clock,
  Layers,
  XCircle,
  HelpCircle
} from 'lucide-react';

export const AccountsPayableManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'INVOICES' | 'GRIR' | 'VOUCHERS' | 'CREDIT_NOTES' | 'PROPOSALS' | 'STATEMENTS' | 'AGING' | 'ACCRUALS' | 'AUDIT'
  >('INVOICES');

  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [grirRecords, setGrirRecords] = useState<GRIRClearingRecord[]>([]);
  const [vouchers, setVouchers] = useState<APVoucher[]>([]);
  const [creditNotes, setCreditNotes] = useState<SupplierCreditNote[]>([]);
  const [proposals, setProposals] = useState<PaymentProposal[]>([]);
  const [batches, setBatches] = useState<PaymentBatch[]>([]);
  const [agingReport, setAgingReport] = useState<VendorAgingReport | null>(null);
  const [accruals, setAccruals] = useState<PurchaseAccrual[]>([]);
  const [auditLogs, setAuditLogs] = useState<APAuditRecord[]>([]);

  // Selected vendor statement state
  const [selectedVendorForStatement, setSelectedVendorForStatement] = useState<string>('ven-001');
  const [vendorStatement, setVendorStatement] = useState<VendorStatement | null>(null);

  // New Invoice Modal
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    vendorInvoiceNumber: '',
    vendorId: 'ven-001',
    vendorCode: 'VEND-0001',
    vendorName: 'Dell Technologies Global',
    poNumber: 'PO-2026-0001',
    grnNumber: 'GRN-2026-0001',
    invoiceDate: new Date().toISOString().split('T')[0],
    postingDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    currency: 'USD',
    grossAmount: 185000,
    taxAmount: 0,
    netAmount: 185000,
    itemSku: 'HW-SRV-01',
    itemName: 'Enterprise Edge Server Blade Gen11',
    billedQty: 10,
    unitPrice: 18500
  });

  // Release Variance Modal
  const [selectedInvoiceForRelease, setSelectedInvoiceForRelease] = useState<SupplierInvoice | null>(null);
  const [releaseReason, setReleaseReason] = useState('');

  // Payment Proposal Modal
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalCutoffDate, setProposalCutoffDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'STATEMENTS' && selectedVendorForStatement) {
      loadVendorStatement(selectedVendorForStatement);
    }
  }, [activeTab, selectedVendorForStatement]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        invRes,
        grirRes,
        vchRes,
        cnRes,
        propRes,
        batRes,
        agingRes,
        accRes,
        auditRes
      ] = await Promise.all([
        ApiClient.getSupplierInvoices().catch(() => []),
        ApiClient.getGRIRClearing().catch(() => []),
        ApiClient.getAPVouchers().catch(() => []),
        ApiClient.getSupplierCreditNotes().catch(() => []),
        ApiClient.getPaymentProposals().catch(() => []),
        ApiClient.getPaymentBatches().catch(() => []),
        ApiClient.getVendorAgingReport().catch(() => null),
        ApiClient.getPurchaseAccruals().catch(() => []),
        ApiClient.getAPAuditLogs().catch(() => [])
      ]);

      setInvoices(invRes);
      setGrirRecords(grirRes);
      setVouchers(vchRes);
      setCreditNotes(cnRes);
      setProposals(propRes);
      setBatches(batRes);
      setAgingReport(agingRes);
      setAccruals(accRes);
      setAuditLogs(auditRes);
    } catch (err) {
      console.error('Failed to load AP data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVendorStatement = async (vendorId: string) => {
    try {
      const stmt = await ApiClient.getVendorStatement(vendorId, '2026-01-01', new Date().toISOString().split('T')[0]);
      setVendorStatement(stmt);
    } catch (err) {
      console.error('Failed to load vendor statement:', err);
    }
  };

  const handleCreateSupplierInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        tenantId: 'ten-001',
        companyId: 'comp-001',
        branchId: 'br-001',
        invoiceNumber: `SINV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        vendorInvoiceNumber: newInvoiceForm.vendorInvoiceNumber || `DELL-INV-${Math.floor(10000 + Math.random() * 90000)}`,
        vendorId: newInvoiceForm.vendorId,
        vendorCode: newInvoiceForm.vendorCode,
        vendorName: newInvoiceForm.vendorName,
        poNumber: newInvoiceForm.poNumber,
        grnNumber: newInvoiceForm.grnNumber,
        invoiceDate: newInvoiceForm.invoiceDate,
        postingDate: newInvoiceForm.postingDate,
        dueDate: newInvoiceForm.dueDate,
        currency: newInvoiceForm.currency,
        exchangeRate: 1.0,
        netAmount: Number(newInvoiceForm.netAmount),
        taxAmount: Number(newInvoiceForm.taxAmount),
        grossAmount: Number(newInvoiceForm.grossAmount),
        discountAmount: 0,
        taxRegistrationNumber: '310984728100003',
        items: [
          {
            id: `item-${Date.now()}`,
            invoiceId: '',
            itemSku: newInvoiceForm.itemSku,
            itemName: newInvoiceForm.itemName,
            description: newInvoiceForm.itemName,
            billedQty: Number(newInvoiceForm.billedQty),
            unitPrice: Number(newInvoiceForm.unitPrice),
            taxRate: 0,
            taxAmount: Number(newInvoiceForm.taxAmount),
            lineTotal: Number(newInvoiceForm.grossAmount)
          }
        ]
      };

      await ApiClient.createSupplierInvoice(payload);
      setShowNewInvoiceModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to create supplier invoice');
    }
  };

  const handleReleaseVariance = async () => {
    if (!selectedInvoiceForRelease) return;
    try {
      await ApiClient.releaseInvoiceVariance(
        selectedInvoiceForRelease.id,
        'usr-001',
        releaseReason || 'Manager Justified Variance'
      );
      setSelectedInvoiceForRelease(null);
      setReleaseReason('');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to release variance block');
    }
  };

  const handlePostInvoice = async (id: string) => {
    try {
      await ApiClient.postSupplierInvoice(id);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to post invoice');
    }
  };

  const handleGenerateProposal = async () => {
    try {
      await ApiClient.createPaymentProposal(proposalCutoffDate);
      setShowProposalModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate proposal');
    }
  };

  const handleExecutePaymentBatch = async (proposalId: string) => {
    try {
      await ApiClient.executePaymentBatch(proposalId, 'BANK_TRANSFER', 'bank-001');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to execute payment batch');
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Phase 2.4 Domain Active
            </span>
            <span className="text-xs text-slate-500 font-mono">IFRS / ZATCA Compliant</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-emerald-600" />
            Accounts Payable & Financial Matching Domain
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            3-Way Matching Engine, GR/IR Reconciliation, AP Vouchers, Credit Memos, Payment Proposals & Vendor Ledger Analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllData}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Engine State
          </button>
          <button
            onClick={() => setShowNewInvoiceModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            New Supplier Invoice
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Supplier Invoices</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{invoices.length}</p>

            <span className="text-xs text-emerald-600 font-medium">
              {invoices.filter(i => i.status === 'MATCHED' || i.status === 'POSTED').length} Matched/Posted
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Open AP Vouchers</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ${vouchers.reduce((acc, v) => acc + v.remainingAmount, 0).toLocaleString()}
            </p>
            <span className="text-xs text-blue-600 font-medium">{vouchers.filter(v => v.remainingAmount > 0).length} Unpaid</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">GR/IR Open Clearing</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              ${grirRecords.reduce((acc, g) => acc + g.openAmount, 0).toLocaleString()}
            </p>
            <span className="text-xs text-amber-700 font-medium">{grirRecords.filter(g => g.status === 'OPEN').length} Pending Invoices</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Pending Proposals</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">{proposals.filter(p => p.status === 'DRAFT').length}</p>

            <span className="text-xs text-purple-600 font-medium">Early Discounts Available</span>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 mb-6 bg-white rounded-xl p-1 shadow-sm overflow-x-auto gap-1">
        {[
          { id: 'INVOICES', label: 'Supplier Invoices (3-Way)', icon: FileText },
          { id: 'GRIR', label: 'GR/IR Reconciliation', icon: Layers },
          { id: 'VOUCHERS', label: 'AP Vouchers', icon: CreditCard },
          { id: 'CREDIT_NOTES', label: 'Credit Notes', icon: TrendingDown },
          { id: 'PROPOSALS', label: 'Payment Proposals', icon: DollarSign },
          { id: 'STATEMENTS', label: 'Vendor Statements', icon: Building },
          { id: 'AGING', label: 'Vendor Aging Report', icon: BarChart2 },
          { id: 'ACCRUALS', label: 'Purchase Accruals', icon: Clock },
          { id: 'AUDIT', label: 'Cryptographic Audit Trail', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SUPPLIER INVOICES (3-WAY MATCHING) */}
      {activeTab === 'INVOICES' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Supplier Invoices & Three-Way Matching Engine
            </h2>
            <span className="text-xs text-slate-500">Automated PO ➔ Goods Receipt ➔ Supplier Invoice Validation</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <th className="p-3">Invoice Number</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">PO / GRN Reference</th>
                  <th className="p-3">Posting Date</th>
                  <th className="p-3">Billed Gross</th>
                  <th className="p-3">3-Way Match Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      No supplier invoices found. Click "New Supplier Invoice" to process a 3-way match.
                    </td>
                  </tr>
                ) : (
                  invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">
                        {inv.invoiceNumber}
                        <div className="text-[10px] text-slate-500">Vendor Ref: {inv.vendorInvoiceNumber}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-900">{inv.vendorName}</div>
                        <div className="text-[10px] text-slate-500">{inv.vendorCode}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {inv.poNumber || 'N/A'} / {inv.grnNumber || 'N/A'}
                      </td>
                      <td className="p-3 text-slate-600">{inv.postingDate}</td>
                      <td className="p-3 font-semibold text-slate-900">${inv.grossAmount.toLocaleString()}</td>
                      <td className="p-3">
                        {inv.status === 'MATCHED' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> MATCHED
                          </span>
                        )}
                        {inv.status === 'BLOCKED_VARIANCE' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> VARIANCE BLOCKED
                          </span>
                        )}
                        {inv.status === 'POSTED' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
                            <FileCheck className="w-3 h-3" /> POSTED TO AP
                          </span>
                        )}
                        {inv.status === 'APPROVED' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200 inline-flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> RELEASED
                          </span>
                        )}
                      </td>
                      <td className="p-3 space-x-2">
                        {inv.status === 'BLOCKED_VARIANCE' && (
                          <button
                            onClick={() => setSelectedInvoiceForRelease(inv)}
                            className="px-2.5 py-1 bg-amber-600 text-white rounded text-[11px] font-semibold hover:bg-amber-700"
                          >
                            Release Variance
                          </button>
                        )}
                        {(inv.status === 'MATCHED' || inv.status === 'APPROVED') && (
                          <button
                            onClick={() => handlePostInvoice(inv.id)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700"
                          >
                            Post to AP Voucher
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

      {/* TAB 2: GR/IR RECONCILIATION */}
      {activeTab === 'GRIR' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              Goods Receipt / Invoice Receipt (GR/IR) Clearing Ledger
            </h2>
            <span className="text-xs text-slate-500">Uninvoiced Goods Received & Open Clearing Balances</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <th className="p-3">PO & Line SKU</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">GRN Qty & Amount</th>
                  <th className="p-3">Invoice Qty & Amount</th>
                  <th className="p-3">Open GR/IR Balance</th>
                  <th className="p-3">Clearing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {grirRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      No open GR/IR clearing records found.
                    </td>
                  </tr>
                ) : (
                  grirRecords.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{rec.poNumber}</div>
                        <div className="text-[10px] text-slate-500">{rec.itemName} ({rec.itemSku})</div>
                      </td>
                      <td className="p-3 font-medium text-slate-800">{rec.vendorName}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{rec.grnQty} units</div>
                        <div className="text-[10px] text-slate-500">${rec.grnAmount.toLocaleString()}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{rec.invoiceQty || 0} units</div>
                        <div className="text-[10px] text-slate-500">${(rec.invoiceAmount || 0).toLocaleString()}</div>
                      </td>
                      <td className="p-3 font-bold text-amber-600">
                        ${rec.openAmount.toLocaleString()} ({rec.openQty} open)
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            rec.status === 'FULLY_CLEARED'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {rec.status}
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

      {/* TAB 3: AP VOUCHERS */}
      {activeTab === 'VOUCHERS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Accounts Payable Vouchers Ledger
            </h2>
            <span className="text-xs text-slate-500">Approved Payables & Early Payment Discounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <th className="p-3">Voucher Number</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Early Discount</th>
                  <th className="p-3">Gross Amount</th>
                  <th className="p-3">Remaining Owed</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      No AP vouchers created yet.
                    </td>
                  </tr>
                ) : (
                  vouchers.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">
                        {v.voucherNumber}
                        <div className="text-[10px] text-slate-500">Inv: {v.vendorInvoiceNumber}</div>
                      </td>
                      <td className="p-3 font-medium text-slate-800">{v.vendorName}</td>
                      <td className="p-3 text-slate-600">{v.dueDate}</td>
                      <td className="p-3">
                        <span className="text-emerald-700 font-semibold">{v.earlyDiscountPercent}% ($${v.earlyDiscountAmount})</span>
                        <div className="text-[10px] text-slate-500">By {v.earlyDiscountDeadline}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">${v.grossAmount.toLocaleString()}</td>
                      <td className="p-3 font-bold text-blue-700">${v.remainingAmount.toLocaleString()}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            v.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}
                        >
                          {v.status}
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

      {/* TAB 5: PAYMENT PROPOSALS & BATCH PREPARATION */}
      {activeTab === 'PROPOSALS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              Automated Payment Proposal & Batch Preparation
            </h2>
            <button
              onClick={() => setShowProposalModal(true)}
              className="px-3.5 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 shadow-sm"
            >
              Generate New Payment Proposal
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Active Payment Proposals</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                      <th className="p-3">Proposal Number</th>
                      <th className="p-3">Cutoff Date</th>
                      <th className="p-3">Proposed Amount</th>
                      <th className="p-3">Discounts Captured</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {proposals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-500">
                          No payment proposals generated.
                        </td>
                      </tr>
                    ) : (
                      proposals.map(prop => (
                        <tr key={prop.id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-900">{prop.proposalNumber}</td>
                          <td className="p-3 text-slate-600">{prop.cutoffDueDate}</td>
                          <td className="p-3 font-semibold text-slate-900">${prop.totalProposedAmount.toLocaleString()}</td>
                          <td className="p-3 font-semibold text-emerald-600">${prop.totalEarlyDiscountCaptured.toLocaleString()}</td>
                          <td className="p-3 font-semibold text-purple-800">{prop.status}</td>
                          <td className="p-3">
                            {prop.status === 'DRAFT' && (
                              <button
                                onClick={() => handleExecutePaymentBatch(prop.id)}
                                className="px-3 py-1 bg-emerald-600 text-white text-[11px] font-semibold rounded hover:bg-emerald-700"
                              >
                                Execute Payment Batch
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

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Executed Payment Batches</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                      <th className="p-3">Batch Number</th>
                      <th className="p-3">Payment Method</th>
                      <th className="p-3">Total Released</th>
                      <th className="p-3">Payment Date</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {batches.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500">
                          No payment batches executed yet.
                        </td>
                      </tr>
                    ) : (
                      batches.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-900">{b.batchNumber}</td>
                          <td className="p-3 font-medium text-slate-700">{b.paymentMethod}</td>
                          <td className="p-3 font-bold text-emerald-700">${b.totalAmount.toLocaleString()}</td>
                          <td className="p-3 text-slate-600">{b.paymentDate}</td>
                          <td className="p-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: VENDOR STATEMENTS */}
      {activeTab === 'STATEMENTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              Vendor Statement Engine
            </h2>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Select Vendor:</span>
              <select
                value={selectedVendorForStatement}
                onChange={e => setSelectedVendorForStatement(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-800 bg-white"
              >
                <option value="ven-001">Dell Technologies Global (VEND-0001)</option>
                <option value="ven-002">Cisco Systems Middle East (VEND-0002)</option>
              </select>
            </div>
          </div>

          {vendorStatement && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Opening Balance</div>
                  <div className="text-lg font-bold text-slate-900">${vendorStatement.openingBalance.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Total Invoices (+)</div>
                  <div className="text-lg font-bold text-blue-600">${vendorStatement.totalInvoices.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Total Payments (-)</div>
                  <div className="text-lg font-bold text-emerald-600">${vendorStatement.totalPayments.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Closing Balance Owed</div>
                  <div className="text-lg font-bold text-slate-900">${vendorStatement.closingBalance.toLocaleString()}</div>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                      <th className="p-3">Date</th>
                      <th className="p-3">Document Type</th>
                      <th className="p-3">Document Number</th>
                      <th className="p-3">Reference</th>
                      <th className="p-3 text-right">Debit (-)</th>
                      <th className="p-3 text-right">Credit (+)</th>
                      <th className="p-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {vendorStatement.lines.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-500">
                          No transactions found for this period.
                        </td>
                      </tr>
                    ) : (
                      vendorStatement.lines.map(line => (
                        <tr key={line.id} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-600">{line.date}</td>
                          <td className="p-3 font-semibold text-slate-800">{line.documentType}</td>
                          <td className="p-3 font-mono text-slate-900">{line.documentNumber}</td>
                          <td className="p-3 text-slate-600">{line.reference}</td>
                          <td className="p-3 text-right font-medium text-emerald-600">
                            {line.debit > 0 ? `$${line.debit.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-3 text-right font-medium text-blue-600">
                            {line.credit > 0 ? `$${line.credit.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900">${line.runningBalance.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: VENDOR AGING REPORT */}
      {activeTab === 'AGING' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              Vendor Accounts Payable Aging Matrix
            </h2>
            <span className="text-xs text-slate-500">5 Multi-Bucket Aging Analysis & Weighted Overdue Metrics</span>
          </div>

          {agingReport && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <th className="p-3">Vendor</th>
                    <th className="p-3 text-right">Current</th>
                    <th className="p-3 text-right">1-30 Days</th>
                    <th className="p-3 text-right">31-60 Days</th>
                    <th className="p-3 text-right">61-90 Days</th>
                    <th className="p-3 text-right">91-120 Days</th>
                    <th className="p-3 text-right">120+ Days</th>
                    <th className="p-3 text-right">Total Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {agingReport.vendors.map(v => (
                    <tr key={v.vendorId} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{v.vendorName}</td>
                      <td className="p-3 text-right text-slate-700">${v.current.toLocaleString()}</td>
                      <td className="p-3 text-right text-amber-600">${v.days1To30.toLocaleString()}</td>
                      <td className="p-3 text-right text-amber-700">${v.days31To60.toLocaleString()}</td>
                      <td className="p-3 text-right text-red-600">${v.days61To90.toLocaleString()}</td>
                      <td className="p-3 text-right text-red-700">${v.days91To120.toLocaleString()}</td>
                      <td className="p-3 text-right text-red-900 font-bold">${v.over120.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-slate-900">${v.totalDue.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <td className="p-3">TOTAL ENTERPRISE AP</td>
                    <td className="p-3 text-right">${agingReport.totalCurrent.toLocaleString()}</td>
                    <td className="p-3 text-right text-amber-600">${agingReport.total1To30.toLocaleString()}</td>
                    <td className="p-3 text-right text-amber-700">${agingReport.total31To60.toLocaleString()}</td>
                    <td className="p-3 text-right text-red-600">${agingReport.total61To90.toLocaleString()}</td>
                    <td className="p-3 text-right text-red-700">${agingReport.total91To120.toLocaleString()}</td>
                    <td className="p-3 text-right text-red-900">${agingReport.totalOver120.toLocaleString()}</td>
                    <td className="p-3 text-right text-emerald-700">${agingReport.grandTotal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 8: PURCHASE ACCRUALS */}
      {activeTab === 'ACCRUALS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Period-End Purchase Accruals Engine (Uninvoiced Goods)
            </h2>
            <span className="text-xs text-slate-500">IFRS Goods Received / Invoice Pending Accrual Ledger</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <th className="p-3">Accrual Ref</th>
                  <th className="p-3">Period</th>
                  <th className="p-3">GRN Reference</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Accrued Amount</th>
                  <th className="p-3">Posting Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {accruals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      No purchase accruals calculated for current period.
                    </td>
                  </tr>
                ) : (
                  accruals.map(acc => (
                    <tr key={acc.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{acc.accrualNumber}</td>
                      <td className="p-3 text-slate-600">{acc.period}</td>
                      <td className="p-3 font-mono text-slate-700">{acc.grnNumber}</td>
                      <td className="p-3 font-medium text-slate-800">{acc.vendorName}</td>
                      <td className="p-3 font-bold text-purple-700">${acc.accruedAmount.toLocaleString()}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800">
                          {acc.status}
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

      {/* TAB 9: AUDIT TRAIL */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Cryptographic Audit Trail (SHA-256 Hashed)
            </h2>
            <span className="text-xs text-slate-500 font-mono">Immutable AP Audit Ledger</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Target Document</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">Cryptographic SHA-256 Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-600">{log.performedAt}</td>
                    <td className="p-3 font-bold text-slate-900">{log.actionType}</td>
                    <td className="p-3 font-mono text-slate-800">{log.targetDocumentNumber}</td>
                    <td className="p-3 text-slate-600">{log.details}</td>
                    <td className="p-3 font-mono text-[10px] text-emerald-700">{log.immutableHash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: NEW SUPPLIER INVOICE */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Create Supplier Invoice & Run 3-Way Match
            </h3>

            <form onSubmit={handleCreateSupplierInvoice} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Vendor Invoice Ref #</label>
                  <input
                    type="text"
                    required
                    value={newInvoiceForm.vendorInvoiceNumber}
                    onChange={e => setNewInvoiceForm({ ...newInvoiceForm, vendorInvoiceNumber: e.target.value })}
                    placeholder="e.g. DELL-INV-88901"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">PO Reference #</label>
                  <input
                    type="text"
                    required
                    value={newInvoiceForm.poNumber}
                    onChange={e => setNewInvoiceForm({ ...newInvoiceForm, poNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">GRN Reference #</label>
                  <input
                    type="text"
                    required
                    value={newInvoiceForm.grnNumber}
                    onChange={e => setNewInvoiceForm({ ...newInvoiceForm, grnNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Gross Billed Amount ($)</label>
                  <input
                    type="number"
                    required
                    value={newInvoiceForm.grossAmount}
                    onChange={e =>
                      setNewInvoiceForm({
                        ...newInvoiceForm,
                        grossAmount: Number(e.target.value),
                        netAmount: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
                >
                  Run 3-Way Match & Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RELEASE VARIANCE BLOCK */}
      {selectedInvoiceForRelease && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Release Invoice Variance Block
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Invoice <span className="font-semibold">{selectedInvoiceForRelease.invoiceNumber}</span> is blocked due to price/quantity variance. Provide a manager justification to release for payment.
            </p>

            <textarea
              required
              rows={3}
              value={releaseReason}
              onChange={e => setReleaseReason(e.target.value)}
              placeholder="Enter finance manager release justification..."
              className="w-full p-3 text-xs border border-slate-300 rounded-lg mb-4"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedInvoiceForRelease(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReleaseVariance}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700"
              >
                Release Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GENERATE PAYMENT PROPOSAL */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              Generate Payment Proposal
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Scans all open AP Vouchers due on or before the cutoff date and captures eligible early payment discounts.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">Cutoff Due Date</label>
              <input
                type="date"
                value={proposalCutoffDate}
                onChange={e => setProposalCutoffDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowProposalModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateProposal}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                Generate Proposal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
