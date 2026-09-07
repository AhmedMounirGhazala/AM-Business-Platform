/**
 * AM Business Platform - Global Search Modal (Ctrl+K)
 * Real-time filter across Journal Entries, Invoices, Items, Vendors, Customers
 */

import React, { useState, useEffect } from 'react';
import { Search, X, Calculator, ShoppingBag, Package, Users, Truck } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { ApiClient } from '../../services/apiClient';

export const GlobalSearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, lang, setActiveModule } = usePlatform();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    journals: any[];
    invoices: any[];
    items: any[];
    customers: any[];
  }>({ journals: [], invoices: [], items: [], customers: [] });

  const isAr = lang === 'ar';

  useEffect(() => {
    if (!isSearchOpen || !query.trim()) {
      setResults({ journals: [], invoices: [], items: [], customers: [] });
      return;
    }

    async function doSearch() {
      const q = query.toLowerCase();
      const [journals, invoices, items, customers] = await Promise.all([
        ApiClient.getJournalEntries(),
        ApiClient.getSalesInvoices(),
        ApiClient.getInventoryItems(),
        ApiClient.getCustomers()
      ]);

      const matchedJ = journals.filter(j => 
        j.entryNumber.toLowerCase().includes(q) || 
        j.description.toLowerCase().includes(q)
      );

      const matchedInv = invoices.filter(i => 
        i.invoiceNumber.toLowerCase().includes(q) || 
        i.customerName.toLowerCase().includes(q)
      );

      const matchedItems = items.filter(i => 
        i.sku.toLowerCase().includes(q) || 
        i.name.toLowerCase().includes(q) || 
        (i.nameAr && i.nameAr.includes(q))
      );

      const matchedCust = customers.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.code.toLowerCase().includes(q)
      );

      setResults({
        journals: matchedJ,
        invoices: matchedInv,
        items: matchedItems,
        customers: matchedCust
      });
    }

    const timer = setTimeout(doSearch, 200);
    return () => clearTimeout(timer);
  }, [query, isSearchOpen]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        
        {/* Input Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <Search className="w-5 h-5 text-[#F28C28]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isAr ? 'ابحث برقم القيد، الحساب، الفاتورة، أو اسم المادة...' : 'Type to search journal number, invoice, item SKU, customer...'}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white focus:outline-hidden placeholder:text-slate-400"
            autoFocus
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results list */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!query.trim() && (
            <div className="text-center py-8 text-xs text-slate-400">
              {isAr ? 'ابدأ الكتابة للبحث في السجلات المحاسبية والعمليات' : 'Start typing to search global ERP database'}
            </div>
          )}

          {/* Journals */}
          {results.journals.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-indigo-500" />
                <span>{isAr ? 'قيود اليومية' : 'Journal Entries'}</span>
              </div>
              <div className="space-y-1">
                {results.journals.map(j => (
                  <div
                    key={j.id}
                    onClick={() => {
                      setActiveModule('accounting');
                      setIsSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{j.entryNumber}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                          {j.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md">
                        {j.description}
                      </div>
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {j.totalDebit.toLocaleString()} SAR
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sales Invoices */}
          {results.invoices.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isAr ? 'فواتير المبيعات' : 'Sales Invoices'}</span>
              </div>
              <div className="space-y-1">
                {results.invoices.map(inv => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      setActiveModule('sales');
                      setIsSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900 dark:text-white">
                        {inv.invoiceNumber} - {inv.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {inv.date} ({inv.paymentStatus})
                      </div>
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {inv.grandTotal.toLocaleString()} SAR
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Items */}
          {results.items.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-500" />
                <span>{isAr ? 'المواد والمخزون' : 'Inventory Items'}</span>
              </div>
              <div className="space-y-1">
                {results.items.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveModule('inventory');
                      setIsSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900 dark:text-white">
                        {item.sku} - {isAr ? item.nameAr : item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        {item.stockQty} {item.uom}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.sellingPrice.toLocaleString()} SAR
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
