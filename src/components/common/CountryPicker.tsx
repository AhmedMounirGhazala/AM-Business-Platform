import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Globe } from 'lucide-react';
import { CountryMaster } from '../../types';

interface CountryPickerProps {
  countries: CountryMaster[];
  selectedCountryCode: string;
  onSelect: (country: CountryMaster) => void;
  isAr?: boolean;
  label?: string;
  disabled?: boolean;
}

export const CountryPicker: React.FC<CountryPickerProps> = ({
  countries,
  selectedCountryCode,
  onSelect,
  isAr = false,
  label,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry = countries.find(
    c => c.code.toLowerCase() === selectedCountryCode?.toLowerCase()
  ) || countries[0];

  const filteredCountries = countries.filter(c => {
    const query = search.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(query) ||
      c.nameAr.includes(query) ||
      c.code.toLowerCase().includes(query) ||
      c.defaultCurrency.toLowerCase().includes(query)
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
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span>{label}</span>
          </span>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
            {isAr ? 'بيانات أساسية مخصصة' : 'Configurable Master'}
          </span>
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border transition flex items-center justify-between gap-2 text-start bg-white dark:bg-slate-900 am-control am-focus-ring cursor-pointer ${
          isOpen
            ? 'border-indigo-600 ring-2 ring-indigo-500/20 dark:border-indigo-500'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0 leading-none">{selectedCountry?.flag || '🌐'}</span>
          <div className="truncate">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {isAr ? selectedCountry?.nameAr : selectedCountry?.name}
            </div>
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>ISO: {selectedCountry?.code}</span>
              <span>•</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{selectedCountry?.defaultCurrency}</span>
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
                placeholder={isAr ? 'ابحث باسم الدولة أو الكود...' : 'Search country name, ISO, currency...'}
                className="w-full ps-8 pe-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs am-control focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus:border-indigo-500 dark:text-white"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto p-1 space-y-0.5">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {isAr ? 'لم يتم العثور على نتائج' : 'No countries found'}
              </div>
            ) : (
              filteredCountries.map(c => {
                const isSelected = c.code.toLowerCase() === selectedCountryCode?.toLowerCase();
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelect(c);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full min-h-[44px] px-3 py-2 rounded-lg text-start transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl leading-none">{c.flag}</span>
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {isAr ? c.nameAr : c.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {c.code} ({c.code3}) • {c.defaultCurrency} • {c.defaultTimezone}
                        </div>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
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
