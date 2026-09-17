import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, ShieldCheck, Receipt } from 'lucide-react';
import { TaxSystemMaster } from '../../types';

interface TaxSystemPickerProps {
  taxSystems: TaxSystemMaster[];
  selectedTaxSystemId: string;
  onSelect: (taxSys: TaxSystemMaster) => void;
  isAr?: boolean;
  label?: string;
  disabled?: boolean;
}

export const TaxSystemPicker: React.FC<TaxSystemPickerProps> = ({
  taxSystems,
  selectedTaxSystemId,
  onSelect,
  isAr = false,
  label,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedTaxSys = taxSystems.find(
    t => t.id === selectedTaxSystemId || t.code === selectedTaxSystemId
  ) || taxSystems[0];

  const filteredTaxSystems = taxSystems.filter(t => {
    const query = search.toLowerCase().trim();
    return (
      t.name.toLowerCase().includes(query) ||
      t.nameAr.includes(query) ||
      t.code.toLowerCase().includes(query) ||
      t.authorityName.toLowerCase().includes(query)
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
            <Receipt className="w-3.5 h-3.5 text-amber-500" />
            <span>{label}</span>
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
            {isAr ? 'المنظومة الضريبية' : 'Tax Framework'}
          </span>
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border transition flex items-center justify-between gap-2 text-start bg-white dark:bg-slate-900 am-control am-focus-ring cursor-pointer ${
          isOpen
            ? 'border-amber-500 ring-2 ring-amber-500/20 dark:border-amber-400'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-bold text-amber-700 dark:text-amber-400 text-xs shrink-0">
            {selectedTaxSys?.standardRate}%
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {isAr ? selectedTaxSys?.nameAr : selectedTaxSys?.name}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>{selectedTaxSys?.authorityName}</span>
              {selectedTaxSys?.requiresEinvoicing && (
                <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-[9px]">
                  e-Invoice
                </span>
              )}
            </div>
          </div>
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 am-popover overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isAr ? 'ابحث باسم النظام الضريبي أو الهيئة...' : 'Search tax system, authority, rate...'}
                className="w-full ps-8 pe-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs am-control focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 focus:border-amber-500 dark:text-white"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto p-1 space-y-0.5">
            {filteredTaxSystems.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {isAr ? 'لم يتم العثور على أنظمة ضريبية' : 'No tax systems found'}
              </div>
            ) : (
              filteredTaxSystems.map(t => {
                const isSelected = t.id === selectedTaxSys?.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onSelect(t);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full min-h-[44px] px-3 py-2.5 rounded-lg text-start transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 flex items-center justify-center font-bold text-amber-800 dark:text-amber-300 text-xs shrink-0">
                        {t.standardRate}%
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {isAr ? t.nameAr : t.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span>{t.authorityName}</span>
                          {t.einvoicingStandard && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                              • {t.einvoicingStandard}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />}
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
