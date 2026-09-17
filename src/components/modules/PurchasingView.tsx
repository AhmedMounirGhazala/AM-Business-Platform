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
    <div className="purchasing-shell">
      {/* Workspace switcher */}
      <div className="purchasing-switcher px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="purchasing-switcher-label">Purchasing workspace</span>
            <div className="purchasing-segmented-control">
            <button
              onClick={() => setDomainMode('PROCUREMENT')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                domainMode === 'PROCUREMENT'
                ? 'is-active'
                : ''
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Procurement
            </button>
            <button
              onClick={() => setDomainMode('ACCOUNTS_PAYABLE')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                domainMode === 'ACCOUNTS_PAYABLE'
                ? 'is-active is-success'
                : ''
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Accounts payable
            </button>
            </div>
          </div>
          <span className="purchasing-context">
            {domainMode === 'PROCUREMENT' ? 'Sourcing, orders & supplier performance' : 'Invoice matching, payments & vendor balances'}
          </span>
        </div>
      </div>

      {/* Main View Display */}
      {domainMode === 'PROCUREMENT' ? <ProcurementManagementView /> : <AccountsPayableManagementView />}
    </div>
  );
};

