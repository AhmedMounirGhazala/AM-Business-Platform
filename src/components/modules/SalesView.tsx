/**
 * AM Business Platform - Sales & Distribution Module
 * Customer Master, Quotations, Sales Invoices with VAT Engine (15%)
 */

import React, { useEffect, useState } from 'react';
import { 
  ShoppingBag, 
  PlusCircle, 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  X,
  Trash2,
  Receipt
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { ApiClient } from '../../services/apiClient';
import { Customer, SalesInvoice, SalesInvoiceLine } from '../../types';
import { AccountsReceivableManagementView } from './AccountsReceivableManagementView';
import { EnterpriseSalesWorkspaceView } from './EnterpriseSalesWorkspaceView';
import { AdvancedSalesOrderHub } from '../sales/AdvancedSalesOrderHub';
import { OutboundLogisticsHub } from '../logistics/OutboundLogisticsHub';
import { CustomerBillingHub } from '../billing/CustomerBillingHub';
import { CashApplicationHub } from '../billing/CashApplicationHub';
import { Truck, DollarSign, Layers } from 'lucide-react';

export const SalesView: React.FC = () => {
  const [domainMode, setDomainMode] = useState<'CASH_APPLICATION' | 'CUSTOMER_BILLING' | 'OUTBOUND_LOGISTICS' | 'ADVANCED_O2C' | 'ENTERPRISE_SALES' | 'ACCOUNTS_RECEIVABLE' | 'SALES_DISTRIBUTION'>('CASH_APPLICATION');
  const { lang, triggerReload, reloadTrigger } = usePlatform();
  const isAr = lang === 'ar';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);

  // Create Invoice Modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [lineItems, setLineItems] = useState<SalesInvoiceLine[]>([
    { itemSku: 'SW-ERP-USR', itemName: 'AM ERP License Perpetual', quantity: 10, unitPrice: 12000, discount: 0, taxRate: 0.15, total: 138000 }
  ]);

  useEffect(() => {
    async function loadSalesData() {
      try {
        const [cRes, iRes] = await Promise.all([
          ApiClient.getCustomers(),
          ApiClient.getSalesInvoices()
        ]);
        setCustomers(cRes);
        setInvoices(iRes);
        if (cRes.length > 0) setSelectedCustomerId(cRes[0].id);
      } catch (err) {
        console.error('Failed loading sales data:', err);
      }
    }
    loadSalesData();
  }, [reloadTrigger]);

  const handleCreateInvoice = async () => {
    if (!selectedCustomerId || lineItems.length === 0) return;
    await ApiClient.createSalesInvoice({
      customerId: selectedCustomerId,
      lines: lineItems,
      createdBy: 'usr-001'
    });
    setIsInvoiceModalOpen(false);
    triggerReload();
  };

  const totalInvoicedValue = invoices.reduce((acc, i) => acc + i.grandTotal, 0);

  return (
    <div>
      {/* Top Domain Switcher Bar */}
      <div className="bg-slate-900 text-white px-6 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sales & Revenue Domain:</span>
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 overflow-x-auto">
            <button
              onClick={() => setDomainMode('CASH_APPLICATION')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                domainMode === 'CASH_APPLICATION'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              Cash Apps & Lockbox (Phase 3.2C-04)
            </button>
            <button
              onClick={() => setDomainMode('CUSTOMER_BILLING')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                domainMode === 'CUSTOMER_BILLING'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              Customer Billing & Revenue (Phase 3.2C-03)
            </button>
            <button
              onClick={() => setDomainMode('OUTBOUND_LOGISTICS')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                domainMode === 'OUTBOUND_LOGISTICS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Outbound Logistics & Delivery (Phase 3.2C-02)
            </button>
            <button
              onClick={() => setDomainMode('ADVANCED_O2C')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                domainMode === 'ADVANCED_O2C'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Advanced Order-to-Cash (Phase 3.2C-01)
            </button>
            <button
              onClick={() => setDomainMode('ENTERPRISE_SALES')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                domainMode === 'ENTERPRISE_SALES'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Enterprise Sales & Orders (Phase 3.1)
            </button>
            <button
              onClick={() => setDomainMode('ACCOUNTS_RECEIVABLE')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                domainMode === 'ACCOUNTS_RECEIVABLE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Accounts Receivable & OTC (Phase 2.5)
            </button>
            <button
              onClick={() => setDomainMode('SALES_DISTRIBUTION')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                domainMode === 'SALES_DISTRIBUTION'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Sales Master (v1.0)
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          {domainMode === 'CASH_APPLICATION' ? 'Domain State: PHASE 3.2C-04 ACTIVE' :
           domainMode === 'CUSTOMER_BILLING' ? 'Domain State: PHASE 3.2C-03 ACTIVE' :
           domainMode === 'OUTBOUND_LOGISTICS' ? 'Domain State: PHASE 3.2C-02 ACTIVE' :
           domainMode === 'ADVANCED_O2C' ? 'Domain State: PHASE 3.2C-01 ACTIVE' :
           domainMode === 'ENTERPRISE_SALES' ? 'Domain State: PHASE 3.1 ACTIVE' :
           domainMode === 'ACCOUNTS_RECEIVABLE' ? 'Domain State: PHASE 2.5 ACTIVE' : 'Domain State: CERTIFIED v1.0'}
        </div>
      </div>

      {/* Render Selected Sub-Domain View */}
      {domainMode === 'CASH_APPLICATION' ? (
        <CashApplicationHub />
      ) : domainMode === 'CUSTOMER_BILLING' ? (
        <CustomerBillingHub />
      ) : domainMode === 'OUTBOUND_LOGISTICS' ? (
        <OutboundLogisticsHub />
      ) : domainMode === 'ADVANCED_O2C' ? (
        <AdvancedSalesOrderHub />
      ) : domainMode === 'ENTERPRISE_SALES' ? (
        <EnterpriseSalesWorkspaceView />
      ) : domainMode === 'ACCOUNTS_RECEIVABLE' ? (
        <AccountsReceivableManagementView />
      ) : (
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>{isAr ? 'إدارة المبيعات والتوزيع وفواتير العملاء' : 'Sales & Distribution Management'}</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr ? 'عروض الأسعار، فواتير المبيعات مع محرك ضريبة القيمة المضافة 15%، وحسابات العملاء' : 'Customer 360, VAT 15% Tax Invoicing Engine, & Payment Tracking'}
              </p>
            </div>

            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isAr ? 'إصدار فاتورة مبيعات' : 'Issue Sales Invoice'}</span>
            </button>
          </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">{isAr ? 'إجمالي المبيعات المفلترة' : 'Total Invoiced Sales'}</div>
          <div className="text-xl font-mono font-bold text-emerald-600 mt-1">
            {totalInvoicedValue.toLocaleString()} SAR
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">{isAr ? 'عدد العملاء النشطين' : 'Active Enterprise Customers'}</div>
          <div className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-1">
            {customers.length} Accounts
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">{isAr ? 'معدل الالتزام الضريبي' : 'VAT Tax Rate'}</div>
          <div className="text-xl font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            15% KSA Standard
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          <span>{isAr ? 'سجل العملاء المعتمدين (Customer 360)' : 'Master Customers Directory'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customers.map((c) => (
            <div key={c.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between">
                <span>{isAr ? c.nameAr : c.name}</span>
                <span className="font-mono text-xs text-indigo-600">{c.code}</span>
              </div>
              <div className="text-slate-500 font-mono">Tax Number: {c.taxNumber}</div>
              <div className="text-slate-500">Email: {c.email} | Phone: {c.phone}</div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 font-semibold">
                <span className="text-slate-400">Current AR Balance:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{c.balance.toLocaleString()} SAR</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales Invoices List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-500" />
          <span>{isAr ? 'سجل فواتير المبيعات والضرائب' : 'Sales Invoices Ledger'}</span>
        </h3>

        <div className="space-y-3">
          {invoices.map((inv) => (
            <div key={inv.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">{inv.invoiceNumber}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 font-bold text-[10px]">
                    {inv.paymentStatus}
                  </span>
                </div>
                <div className="text-slate-500 font-mono">
                  Date: {inv.date} | Due: {inv.dueDate}
                </div>
              </div>

              <div className="font-semibold text-slate-900 dark:text-white">
                Customer: {inv.customerName}
              </div>

              <div className="flex justify-between items-center pt-2 font-mono border-t border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400 font-sans">Subtotal: {inv.subtotal.toLocaleString()} SAR | VAT 15%: {inv.taxTotal.toLocaleString()} SAR</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">Grand Total: {inv.grandTotal.toLocaleString()} SAR</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Invoice Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Issue Sales Invoice</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Invoice Item Description</label>
                <input
                  type="text"
                  value={lineItems[0]?.itemName || ''}
                  onChange={(e) => {
                    const copy = [...lineItems];
                    copy[0].itemName = e.target.value;
                    setLineItems(copy);
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    value={lineItems[0]?.quantity || 1}
                    onChange={(e) => {
                      const copy = [...lineItems];
                      copy[0].quantity = Number(e.target.value);
                      setLineItems(copy);
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Unit Price (SAR)</label>
                  <input
                    type="number"
                    value={lineItems[0]?.unitPrice || 0}
                    onChange={(e) => {
                      const copy = [...lineItems];
                      copy[0].unitPrice = Number(e.target.value);
                      setLineItems(copy);
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs"
              >
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}

    </div>
  );
};
