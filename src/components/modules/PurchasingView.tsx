/**
 * AM Business Platform - Purchasing, Procurement & Accounts Payable Module
 * Enterprise DDD Architecture
 */

import React, { useState } from 'react';
import { ProcurementManagementView } from '../ProcurementManagementView';
import { AccountsPayableManagementView } from '../AccountsPayableManagementView';
import { ShoppingCart, Receipt } from 'lucide-react';

export const PurchasingView: React.FC = () => {
  const [domainMode, setDomainMode] = useState<'PROCUREMENT' | 'ACCOUNTS_PAYABLE'>('ACCOUNTS_PAYABLE');

  return (
    <div>
      {/* Top Domain Switcher Bar */}
      <div className="bg-slate-900 text-white px-6 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Purchasing & Financials Domain:</span>
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setDomainMode('PROCUREMENT')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                domainMode === 'PROCUREMENT'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Procurement & Purchasing (v1.0)
            </button>
            <button
              onClick={() => setDomainMode('ACCOUNTS_PAYABLE')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                domainMode === 'ACCOUNTS_PAYABLE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Accounts Payable & Financial Matching (Phase 2.4)
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          {domainMode === 'PROCUREMENT' ? 'Domain State: CERTIFIED v1.0' : 'Domain State: PHASE 2.4 IN-PROGRESS'}
        </div>
      </div>

      {/* Main View Display */}
      {domainMode === 'PROCUREMENT' ? <ProcurementManagementView /> : <AccountsPayableManagementView />}
    </div>
  );
};


