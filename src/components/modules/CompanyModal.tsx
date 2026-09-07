import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  X, 
  Sparkles, 
  Globe, 
  Receipt, 
  Coins, 
  Clock, 
  Calendar, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Languages
} from 'lucide-react';
import { 
  Company, 
  CountryMaster, 
  TaxSystemMaster, 
  StateProvinceMaster, 
  CityMaster, 
  TimezoneMaster, 
  LanguageMaster, 
  FiscalCalendarMaster,
  Currency 
} from '../../types';
import { ApiClient } from '../../services/apiClient';
import { CountryPicker } from '../common/CountryPicker';
import { TaxSystemPicker } from '../common/TaxSystemPicker';
import { CurrencyPicker } from '../common/CurrencyPicker';
import { SearchableSelect, SearchableOption } from '../common/SearchableSelect';

interface CompanyModalProps {
  company: Company | null; // null for creation, object for edit
  countries: CountryMaster[];
  taxSystems: TaxSystemMaster[];
  currencies: Currency[];
  states: StateProvinceMaster[];
  cities: CityMaster[];
  timezones: TimezoneMaster[];
  languages: LanguageMaster[];
  fiscalCalendars: FiscalCalendarMaster[];
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  isAr?: boolean;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  company,
  countries,
  taxSystems,
  currencies,
  states,
  cities,
  timezones,
  languages,
  fiscalCalendars,
  isOpen,
  onClose,
  onSaveSuccess,
  isAr = false
}) => {
  const [formData, setFormData] = useState<Partial<Company>>({
    name: '',
    nameAr: '',
    code: '',
    taxNumber: '',
    country: 'Saudi Arabia',
    countryCode: 'SA',
    currency: 'SAR',
    state: '',
    city: '',
    taxSystemId: 'tax-sys-sa-vat',
    taxSystemName: 'Saudi Arabia VAT (15% ZATCA Phase 2)',
    taxRate: 15,
    timezone: 'Asia/Riyadh',
    dateFormat: 'YYYY-MM-DD',
    numberFormat: '1,234.56',
    language: 'ar',
    fiscalYearStart: '01-01',
    address: '',
    phone: '',
    email: '',
    website: ''
  });

  const [suggestedMsg, setSuggestedMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({ ...company });
    } else {
      // Default to Saudi Arabia or first country
      const initialCountry = countries.find(c => c.code === 'SA') || countries[0];
      if (initialCountry) {
        applyCountryDefaults(initialCountry, false);
      }
    }
  }, [company, countries]);

  const applyCountryDefaults = (c: CountryMaster, showBanner: boolean = true) => {
    const matchedTaxSys = taxSystems.find(t => t.id === c.defaultTaxSystemId || t.countryCode === c.code) || taxSystems[0];

    setFormData(prev => ({
      ...prev,
      country: c.name,
      countryCode: c.code,
      currency: c.defaultCurrency,
      timezone: c.defaultTimezone,
      language: c.defaultLanguage,
      dateFormat: c.defaultDateFormat,
      numberFormat: c.defaultNumberFormat,
      taxSystemId: matchedTaxSys?.id || 'tax-sys-sa-vat',
      taxSystemName: matchedTaxSys?.name || 'Standard VAT',
      taxRate: matchedTaxSys?.standardRate || 15,
      fiscalYearStart: c.fiscalYearStartMonth === 7 ? '07-01' : '01-01',
      state: '',
      city: ''
    }));

    if (showBanner) {
      setSuggestedMsg(
        isAr 
          ? `تم تطبيق الإعدادات المحلية الافتراضية لـ ${c.flag} ${c.nameAr}. جميع الخيارات متاحة للتعديل حسب حاجة المؤسسة.`
          : `Localization defaults automatically suggested for ${c.flag} ${c.name}. All parameters remain 100% editable.`
      );
      setTimeout(() => setSuggestedMsg(null), 6000);
    }
  };

  const handleCountryChange = (selected: CountryMaster) => {
    applyCountryDefaults(selected, true);
  };

  const handleTaxSystemChange = (taxSys: TaxSystemMaster) => {
    setFormData(prev => ({
      ...prev,
      taxSystemId: taxSys.id,
      taxSystemName: taxSys.name,
      taxRate: taxSys.standardRate
    }));
  };

  const handleCurrencyChange = (curr: Currency) => {
    setFormData(prev => ({
      ...prev,
      currency: curr.code
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    setIsSaving(true);
    try {
      if (company?.id) {
        await ApiClient.updateCompany(company.id, formData);
      } else {
        await ApiClient.createCompany(formData);
      }
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('Failed saving company:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentStates = states.filter(s => s.countryCode === formData.countryCode);
  const currentCities = cities.filter(c => c.countryCode === formData.countryCode);

  const stateOptions: SearchableOption[] = currentStates.map(s => ({
    value: s.name,
    label: s.name,
    labelAr: s.nameAr,
    badge: s.code
  }));

  const cityOptions: SearchableOption[] = currentCities.map(c => ({
    value: c.name,
    label: c.name,
    labelAr: c.nameAr
  }));

  const timezoneOptions: SearchableOption[] = timezones.map(t => ({
    value: t.code,
    label: t.name,
    subLabel: `Offset: ${t.offset}`
  }));

  const languageOptions: SearchableOption[] = languages.map(l => ({
    value: l.code,
    label: l.name,
    labelAr: l.nativeName,
    badge: l.direction.toUpperCase()
  }));

  const dateFormatOptions: SearchableOption[] = [
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO Standard)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (UK / Arab Standard)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US Standard)' },
    { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (German Standard)' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#0B1F3A] text-white flex items-center justify-between border-b border-[#153258]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#153258] border border-[#F28C28]/40 text-[#F28C28]">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{company ? (isAr ? 'تعديل بيانات الشركة والتهيئة المحلية' : 'Edit Company & Localization Setup') : (isAr ? 'إضافة شركة جديدة وتحديد الدولة والعملة والضرائب' : 'Create New Company & Country Setup')}</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAr ? 'تهيئة متكاملة غير مسجلة صلباً للمنظومة الضريبية، العملة التشغيلية، والمنطقة الزمنية' : 'Configurable multi-country architecture without any hardcoded localization rules'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Smart Auto-Suggestion Notification */}
          {suggestedMsg && (
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold mb-0.5">{isAr ? 'محرك التهيئة التلقائي' : 'Smart Localization Auto-Engine'}</div>
                <div>{suggestedMsg}</div>
              </div>
            </div>
          )}

          {/* Section 1: Core Company Profile */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span>{isAr ? 'هوية الشركة والملف الأساسي' : 'Company Identity & Core Profile'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'اسم الشركة (بالإنكليزية)' : 'Company Name (English)'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. AM Nile Solutions HQ"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:border-indigo-600 focus:outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'اسم الشركة (بالعربية)' : 'Company Name (Arabic)'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nameAr || ''}
                  onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="مثال: شركة إيه إم لحلول التقنية"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:border-indigo-600 focus:outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'كود الشركة' : 'Company Code'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code || ''}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. AMEGY"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:border-indigo-600 focus:outline-none dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Country & Localization Engine */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{isAr ? 'إعدادات الدولة والتوطين الديناميكي' : 'Country Selection & Dynamic Localization Engine'}</span>
              </h3>
              <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-[10px] font-mono font-bold">
                Unlimited Countries Supported
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Country Picker */}
              <div className="md:col-span-1">
                <CountryPicker
                  countries={countries}
                  selectedCountryCode={formData.countryCode || 'SA'}
                  onSelect={handleCountryChange}
                  isAr={isAr}
                  label={isAr ? 'الدولة المستهدفة' : 'Operating Country'}
                />
              </div>

              {/* Operating Currency Picker */}
              <div className="md:col-span-1">
                <CurrencyPicker
                  currencies={currencies}
                  selectedCurrencyCode={formData.currency || 'SAR'}
                  onSelect={handleCurrencyChange}
                  isAr={isAr}
                  label={isAr ? 'العملة التشغيلية المعتمدة' : 'Company Currency'}
                />
              </div>

              {/* Tax System Picker */}
              <div className="md:col-span-1">
                <TaxSystemPicker
                  taxSystems={taxSystems}
                  selectedTaxSystemId={formData.taxSystemId || 'tax-sys-sa-vat'}
                  onSelect={handleTaxSystemChange}
                  isAr={isAr}
                  label={isAr ? 'المنظومة الضريبية المعتمدة' : 'Tax System & Authority'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* State / Province */}
              <div>
                <SearchableSelect
                  options={stateOptions.length > 0 ? stateOptions : [{ value: formData.state || 'Main Region', label: formData.state || 'Main Region' }]}
                  selectedValue={formData.state || ''}
                  onSelect={(val) => setFormData({ ...formData, state: val })}
                  label={isAr ? 'المنطقة / المحافظة' : 'State / Province'}
                  placeholder={isAr ? 'اختر المحافظة...' : 'Select State/Province...'}
                  isAr={isAr}
                  icon={<MapPin className="w-3.5 h-3.5 text-slate-400" />}
                />
              </div>

              {/* City */}
              <div>
                <SearchableSelect
                  options={cityOptions.length > 0 ? cityOptions : [{ value: formData.city || 'Main City', label: formData.city || 'Main City' }]}
                  selectedValue={formData.city || ''}
                  onSelect={(val) => setFormData({ ...formData, city: val })}
                  label={isAr ? 'المدينة' : 'City'}
                  placeholder={isAr ? 'اختر المدينة...' : 'Select City...'}
                  isAr={isAr}
                  icon={<MapPin className="w-3.5 h-3.5 text-slate-400" />}
                />
              </div>

              {/* Tax Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isAr ? 'الرقم الضريبي / TRN / TIN' : 'Tax Registration Number (TRN)'}</span>
                </label>
                <input
                  type="text"
                  value={formData.taxNumber || ''}
                  onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                  placeholder="e.g. 310984728100003"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-semibold focus:border-indigo-600 focus:outline-none dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Timezone, Formats & Fiscal Preferences */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>{isAr ? 'المنطقة الزمنية وتنسيق الأرقام والتقويم المالي' : 'Timezone, Date Format & Fiscal Preferences'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <SearchableSelect
                  options={timezoneOptions}
                  selectedValue={formData.timezone || 'Asia/Riyadh'}
                  onSelect={(val) => setFormData({ ...formData, timezone: val })}
                  label={isAr ? 'المنطقة الزمنية' : 'Timezone'}
                  isAr={isAr}
                  icon={<Clock className="w-3.5 h-3.5 text-slate-400" />}
                />
              </div>

              <div>
                <SearchableSelect
                  options={languageOptions}
                  selectedValue={formData.language || 'ar'}
                  onSelect={(val) => setFormData({ ...formData, language: val })}
                  label={isAr ? 'لغة التقارير الافتراضية' : 'Default Language'}
                  isAr={isAr}
                  icon={<Languages className="w-3.5 h-3.5 text-slate-400" />}
                />
              </div>

              <div>
                <SearchableSelect
                  options={dateFormatOptions}
                  selectedValue={formData.dateFormat || 'YYYY-MM-DD'}
                  onSelect={(val) => setFormData({ ...formData, dateFormat: val })}
                  label={isAr ? 'تنسيق التاريخ' : 'Date Format'}
                  isAr={isAr}
                  icon={<Calendar className="w-3.5 h-3.5 text-slate-400" />}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Address & Contact Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500" />
              <span>{isAr ? 'العنوان وتفاصيل الاتصال' : 'Official Address & Contact Information'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'العنوان التفصيلي' : 'Official Address'}
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Olaya Street, Building 42, Riyadh, Saudi Arabia"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:border-indigo-600 focus:outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'رقم الهاتف' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+966 11 000 0000"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono focus:border-indigo-600 focus:outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'البريد الإلكتروني' : 'Official Email'}
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@company.com"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:border-indigo-600 focus:outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الموقع الإلكتروني' : 'Website'}
                </label>
                <input
                  type="text"
                  value={formData.website || ''}
                  onChange={e => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://company.com"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:border-indigo-600 focus:outline-none dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0B1F3A] hover:bg-[#153258] text-white transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <CheckCircle2 className="w-4 h-4 text-[#F28C28]" />
              <span>{isSaving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (company ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إنشاء الشركة' : 'Create Company'))}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
