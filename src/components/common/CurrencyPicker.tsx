import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Coins } from 'lucide-react';
import { Currency } from '../../types';

interface CurrencyPickerProps {
  currencies: Currency[];
  selectedCurrencyCode: string;
  onSelect: (currency: Currency) => void;
  isAr?: boolean;
  label?: string;
  disabled?: boolean;
}

export const CurrencyPicker: React.FC<CurrencyPickerProps> = ({
  currencies,
  selectedCurrencyCode,
  onSelect,
  isAr = false,
  label,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCurr = currencies.find(
    c => c.code.toLowerCase() === selectedCurrencyCode?.toLowerCase()
  ) || currencies[0] || { code: 'SAR', name: 'Saudi Riyal', nameAr: 'ريال سعودي', symbol: 'SAR', isBaseCurrency: true };

  const filteredCurrencies = currencies.filter(c => {
    const query = search.toLowerCase().trim();
    return (
      c.code.toLowerCase().includes(query) ||
      c.name.toLowerCase().includes(query) ||
      c.nameAr.includes(query) ||
      c.symbol.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-emerald-500" />
            <span>{label}</span>
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
            {selectedCurr?.code}
          </span>
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border transition flex items-center justify-between gap-2 text-left bg-white dark:bg-slate-900 shadow-xs cursor-pointer ${
          isOpen
            ? 'border-emerald-600 ring-2 ring-emerald-500/20 dark:border-emerald-500'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-300 text-xs shrink-0 font-mono">
            {selectedCurr?.symbol || selectedCurr?.code}
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {selectedCurr?.code} - {isAr ? selectedCurr?.nameAr : selectedCurr?.name}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {isAr ? 'العملة الرسمية للمعاملات' : 'Company Operating Currency'}
            </div>
          </div>
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isAr ? 'ابحث عن العملة كود أو اسم...' : 'Search currency code or name...'}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto p-1 space-y-0.5">
            {filteredCurrencies.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {isAr ? 'لم يتم العثور على عملات' : 'No currencies found'}
              </div>
            ) : (
              filteredCurrencies.map(c => {
                const isSelected = c.code.toLowerCase() === selectedCurrencyCode?.toLowerCase();
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onSelect(c);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-emerald-100 dark:bg-emerald-900/60 font-mono font-bold text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-center shrink-0">
                        {c.symbol}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          <span className="font-mono font-bold mr-1.5">{c.code}</span>
                          <span>{isAr ? c.nameAr : c.name}</span>
                        </div>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
