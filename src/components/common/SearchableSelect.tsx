import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  labelAr?: string;
  subLabel?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  selectedValue: string;
  onSelect: (value: string, option?: SearchableOption) => void;
  placeholder?: string;
  isAr?: boolean;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  selectedValue,
  onSelect,
  placeholder = 'Select option...',
  isAr = false,
  label,
  icon,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOpt = options.find(o => o.value === selectedValue) || options[0];

  const filteredOptions = options.filter(o => {
    const query = search.toLowerCase().trim();
    return (
      o.label.toLowerCase().includes(query) ||
      (o.labelAr && o.labelAr.includes(query)) ||
      o.value.toLowerCase().includes(query) ||
      (o.subLabel && o.subLabel.toLowerCase().includes(query))
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
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
          {icon}
          <span>{label}</span>
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
        <div className="flex items-center gap-2 min-w-0">
          {selectedOpt?.icon}
          <div className="truncate">
            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {isAr ? selectedOpt?.labelAr || selectedOpt?.label : selectedOpt?.label || placeholder}
            </div>
            {selectedOpt?.subLabel && (
              <div className="text-[10px] text-slate-400 font-mono truncate">
                {selectedOpt.subLabel}
              </div>
            )}
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
                placeholder={isAr ? 'بحث...' : 'Search...'}
                className="w-full ps-8 pe-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs am-control focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus:border-indigo-500 dark:text-white"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {isAr ? 'لا توجد خيارات مطابقة' : 'No options match search'}
              </div>
            ) : (
              filteredOptions.map(o => {
                const isSelected = o.value === selectedValue;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onSelect(o.value, o);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full min-h-[40px] px-3 py-2 rounded-lg text-start transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {o.icon}
                      <div className="truncate">
                        <div className="text-xs font-medium text-slate-900 dark:text-white truncate">
                          {isAr ? o.labelAr || o.label : o.label}
                        </div>
                        {o.subLabel && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {o.subLabel}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {o.badge && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[9px]">
                          {o.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                    </div>
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
