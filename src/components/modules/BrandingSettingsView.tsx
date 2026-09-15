/**
 * AM Business Platform — Tenant Identity & White-Label Branding Administration
 * P0-08 Milestone Certification View
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, 
  Check, 
  RotateCcw, 
  Upload, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Shield,
  FileText, 
  Layout, 
  Lock, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Sun,
  Moon,
  Info,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { ApiClient } from '../../services/apiClient';
import { 
  TenantBranding, 
  ALLOWED_FONT_FAMILIES, 
  AllowedFontFamily, 
  BrandingValidationResult,
  ContrastEvaluationReport 
} from '../../types/branding';

export const BrandingSettingsView: React.FC = () => {
  const { 
    lang, 
    activeTenant, 
    activeCompany, 
    currentUser, 
    branding: platformBranding, 
    refreshBranding 
  } = usePlatform();
  const isAr = lang === 'ar';

  const isAuthorized = currentUser?.role === 'Tenant Admin' || currentUser?.role === 'Super Admin';

  // Form State
  const [formData, setFormData] = useState<Partial<TenantBranding>>({});
  const [initialData, setInitialData] = useState<Partial<TenantBranding>>({});
  const [activePreviewTab, setActivePreviewTab] = useState<'shell' | 'login' | 'receipt' | 'contrast'>('shell');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');

  // Status & Validation
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);
  const [validationReport, setValidationReport] = useState<BrandingValidationResult | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [lastAuditRef, setLastAuditRef] = useState<string | null>(null);

  // Asset Uploading
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [assetUploadError, setAssetUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadTargetField, setUploadTargetField] = useState<'logoUrl' | 'darkLogoUrl' | 'faviconUrl'>('logoUrl');

  // Load Initial Branding from Platform/Server
  useEffect(() => {
    async function loadCurrent() {
      setLoading(true);
      try {
        const tenantId = activeTenant?.id || 'ten-001';
        const res = await ApiClient.getBranding(tenantId, activeCompany?.id);
        if (res && res.branding) {
          setFormData(res.branding);
          setInitialData(res.branding);
          setLastAuditRef(res.branding.auditReference || null);
          // Run initial preview validation
          const prev = await ApiClient.previewBranding(res.branding);
          setValidationReport(prev);
        }
      } catch (err: any) {
        setSaveErrorMsg(err.message || 'Failed to load tenant branding configuration.');
      } finally {
        setLoading(false);
      }
    }
    loadCurrent();
  }, [activeTenant?.id, activeCompany?.id]);

  // Live Contrast & Payload Validation on Form Change
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.primaryColor && formData.surfaceColor && formData.textColor) {
        try {
          const report = await ApiClient.previewBranding(formData);
          setValidationReport(report);
        } catch {
          // Ignore live preview validation hiccups
        }
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [formData]);

  const handleInputChange = (field: keyof TenantBranding, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
  };

  const handleSaveChanges = async () => {
    if (!isAuthorized) return;
    setSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const res = await ApiClient.updateBranding(formData);
      if (res.success) {
        setFormData(res.branding);
        setInitialData(res.branding);
        setLastAuditRef(res.auditHash);
        setSaveSuccessMsg(isAr ? 'تم حفظ وتطبيق الهوية المؤسسية بنجاح!' : 'Enterprise branding saved & activated successfully!');
        await refreshBranding();
      }
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Failed to save branding changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!isAuthorized) return;
    if (!window.confirm(isAr ? 'هل تريد استعادة إعدادات الهوية الافتراضية للنظام؟' : 'Are you sure you want to reset to enterprise platform defaults?')) {
      return;
    }
    setResetting(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const res = await ApiClient.resetBranding(activeCompany?.id);
      if (res.success) {
        setFormData(res.branding);
        setInitialData(res.branding);
        setLastAuditRef(res.auditHash);
        setSaveSuccessMsg(isAr ? 'تمت استعادة الإعدادات الافتراضية بنجاح!' : 'Branding restored to safe defaults successfully.');
        await refreshBranding();
      }
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Failed to reset branding.');
    } finally {
      setResetting(false);
    }
  };

  const handleCancelChanges = () => {
    setFormData(initialData);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
  };

  // Asset File Upload Handling
  const triggerFileUpload = (targetField: 'logoUrl' | 'darkLogoUrl' | 'faviconUrl') => {
    setUploadTargetField(targetField);
    setAssetUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setAssetUploadError(isAr ? 'حجم الملف يتجاوز الحد المسموح (2 ميجابايت)' : 'File size exceeds 2MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setIsUploadingLogo(true);
      try {
        const assetType = uploadTargetField === 'faviconUrl' ? 'favicon' : uploadTargetField === 'darkLogoUrl' ? 'darkLogo' : 'logo';
        const res = await ApiClient.uploadBrandingAsset({
          assetType,
          fileName: file.name,
          mimeType: file.type || 'image/png',
          fileDataBase64: base64Data,
          tenantId: activeTenant?.id
        });
        if (res.success && res.asset) {
          handleInputChange(uploadTargetField, res.asset.storagePath);
          setSaveSuccessMsg(isAr ? 'تم رفع الشعار وحفظه بنجاح.' : 'Asset uploaded & stored securely.');
        }
      } catch (err: any) {
        setAssetUploadError(err.message || 'Asset upload failed.');
      } finally {
        setIsUploadingLogo(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {isAr ? 'جاري تحميل إعدادات الهوية المؤسسية...' : 'Loading Tenant Identity & Branding Runtime...'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Hidden File Input for Secure Asset Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelected} 
        accept="image/png,image/jpeg,image/webp,image/svg+xml" 
        className="hidden" 
      />

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {isAr ? 'إدارة الهوية المؤسسية والعلامة التجارية (White-Label)' : 'Tenant Identity & White-Label Runtime'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                P0-08 Certified
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isAr 
                ? 'تخصيص الهوية البصرية، الألوان المتوافقة مع WCAG AA، الشعارات، والنصوص القانونية بمعزل تام لكل مستأجر.'
                : 'Authoritative tenant-scoped identity, WCAG AA contrast compliance, logos, and document branding.'}
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={!isAuthorized || resetting}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Reset to safe defaults"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'استعادة الافتراضي' : 'Restore Defaults'}</span>
          </button>

          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleCancelChanges}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={!isAuthorized || saving || !hasUnsavedChanges || (validationReport ? !validationReport.valid : false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ وتطبيق التغييرات' : 'Save & Apply')}</span>
          </button>
        </div>
      </div>

      {/* AM Platform Identity & Architectural Governance Card */}
      <div className="bg-[#0B1F3A] text-white rounded-2xl p-5 border border-[#153258] shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#0B1F3A] border-2 border-[#F28C28] flex items-center justify-center font-black text-lg text-[#F28C28] shadow-md shrink-0">
              AM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  AM ERP • Ahmed Mounir
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F28C28]/20 text-[#F28C28] border border-[#F28C28]/40">
                  Fixed Master Identity
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  P0-08 Certified
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAr ? 'محاسب مالي | محلل أعمال — الهوية المركزية للمنصة ومحرك التشغيل' : 'Financial Accountant | Business Analyst — Platform Source of Truth'}
              </p>
            </div>
          </div>

          <div className="text-left rtl:text-right md:text-right rtl:md:text-left bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
              {isAr ? 'شعار المنصة المعتمد' : 'Official Brand Motto'}
            </span>
            <span className="text-xs font-bold text-[#F28C28]">
              {isAr ? '«كل قرار ناجح يبدأ برقم صحيح»' : '"Every successful decision begins with an accurate number"'}
            </span>
          </div>
        </div>

        {/* Color Palette & Token Source of Truth */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md border border-white/20 shrink-0" style={{ backgroundColor: '#0B1F3A' }} />
              <span className="font-bold text-[11px] text-white">Navy Primary</span>
            </div>
            <div className="text-[10px] font-mono text-slate-300">#0B1F3A</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md border border-white/20 shrink-0" style={{ backgroundColor: '#153258' }} />
              <span className="font-bold text-[11px] text-white">Navy Secondary</span>
            </div>
            <div className="text-[10px] font-mono text-slate-300">#153258</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md border border-white/20 shrink-0" style={{ backgroundColor: '#F28C28' }} />
              <span className="font-bold text-[11px] text-white">Accent Amber</span>
            </div>
            <div className="text-[10px] font-mono text-slate-300">#F28C28</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md border border-white/20 shrink-0" style={{ backgroundColor: '#F8FAFC' }} />
              <span className="font-bold text-[11px] text-white">Neutral Canvas</span>
            </div>
            <div className="text-[10px] font-mono text-slate-300">#F8FAFC</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md border border-white/20 shrink-0" style={{ backgroundColor: '#E2E8F0' }} />
              <span className="font-bold text-[11px] text-white">Border Light</span>
            </div>
            <div className="text-[10px] font-mono text-slate-300">#E2E8F0</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Typography</span>
            <div className="text-[10px] text-white font-bold truncate">Plus Jakarta / Cairo</div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] text-slate-300 flex items-start gap-2">
          <Shield className="w-4 h-4 text-[#F28C28] shrink-0 mt-0.5" />
          <span>
            {isAr
              ? 'حوكمة التعددية المؤسسية: هوية المنصة إيه إم غير قابلة للتحريف أو التبديل بواسطة المستأجرين. تخصيص المستأجر يقتصر على مساحات عمله وفواتيره وشاشات العميل مع الحفاظ على توقيع وموثوقية المنصة.'
              : 'Multi-Tenant Governance: The AM master platform identity is immutable and serves as the trusted kernel anchor. Tenant white-label customization applies to tenant workspaces and documents without compromising security or platform integrity.'}
          </span>
        </div>
      </div>

      {/* Role Authorization Alert */}
      {!isAuthorized && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
          <Lock className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-bold">{isAr ? 'صلاحيات للقراءة فقط: ' : 'Read-Only Permission: '}</span>
            {isAr 
              ? 'أنت مسجل كمستخدم غير مصرح له بتعديل إعدادات الهوية المؤسسية. يجب توفر دور Tenant Admin أو Super Admin.' 
              : 'You are signed in with a non-administrative role. Only Tenant Admins or Super Admins can alter branding.'}
          </div>
        </div>
      )}

      {/* Notification Alerts */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
          {lastAuditRef && (
            <span className="text-[10px] font-mono opacity-80 ms-auto">
              SHA: {lastAuditRef.slice(0, 16)}...
            </span>
          )}
        </div>
      )}

      {saveErrorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex items-center gap-2 text-xs text-rose-800 dark:text-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{saveErrorMsg}</span>
        </div>
      )}

      {/* Main Grid: Left Controls, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ================================================================ */}
        {/* COLUMN 1: CONFIGURATION CONTROLS (7 Cols) */}
        {/* ================================================================ */}
        <div className="lg:col-span-7 space-y-6">

          {/* Card 1: Identity & Naming */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>{isAr ? 'الاسم والهوية المؤسسية' : 'Identity & Platform Naming'}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'اسم المنصة (إنجليزي)' : 'Application Display Name'}
                </label>
                <input
                  type="text"
                  value={formData.appName || ''}
                  disabled={!isAuthorized}
                  onChange={e => handleInputChange('appName', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g. Apex Commercial ERP"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'اسم المنصة (عربي)' : 'Application Name (Arabic)'}
                </label>
                <input
                  type="text"
                  value={formData.appNameAr || ''}
                  disabled={!isAuthorized}
                  onChange={e => handleInputChange('appNameAr', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  placeholder="مثال: نظام أبيكس للأعمال"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الاسم المختصر / الشعار (Monogram)' : 'Short Monogram (2-8 Chars)'}
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={formData.shortName || ''}
                  disabled={!isAuthorized}
                  onChange={e => handleInputChange('shortName', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 uppercase"
                  placeholder="e.g. APEX"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الاسم التجاري (Trading Name)' : 'Commercial Trading Name'}
                </label>
                <input
                  type="text"
                  value={formData.tradingName || ''}
                  disabled={!isAuthorized}
                  onChange={e => handleInputChange('tradingName', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g. Apex Industrial Solutions Ltd."
                />
              </div>
            </div>
          </div>

          {/* Card 2: Visual Assets (Logos & Favicon) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-500" />
              <span>{isAr ? 'الشعارات والأيقونات (Scoped Assets)' : 'Visual Logos & Favicon'}</span>
            </h2>

            {assetUploadError && (
              <p className="text-xs text-rose-500">{assetUploadError}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Light Logo */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'شعار النمط الفاتح (Light Mode Logo)' : 'Light Mode Logo'}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className="max-h-12 max-w-12 object-contain" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">{formData.shortName || 'LOGO'}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      disabled={!isAuthorized || isUploadingLogo}
                      onClick={() => triggerFileUpload('logoUrl')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{isAr ? 'رفع شعار...' : 'Upload Logo'}</span>
                    </button>
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => handleInputChange('logoUrl', '')}
                        className="text-[10px] text-rose-500 hover:underline block"
                      >
                        {isAr ? 'إزالة' : 'Remove'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Dark Logo */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'شعار النمط الداكن (Dark Mode Logo)' : 'Dark Mode Logo'}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden shrink-0">
                    {formData.darkLogoUrl ? (
                      <img src={formData.darkLogoUrl} alt="Dark Logo" className="max-h-12 max-w-12 object-contain" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                    ) : (
                      <span className="text-xs font-bold text-amber-500">{formData.shortName || 'DARK'}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      disabled={!isAuthorized || isUploadingLogo}
                      onClick={() => triggerFileUpload('darkLogoUrl')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{isAr ? 'رفع شعار...' : 'Upload Logo'}</span>
                    </button>
                    {formData.darkLogoUrl && (
                      <button
                        type="button"
                        onClick={() => handleInputChange('darkLogoUrl', '')}
                        className="text-[10px] text-rose-500 hover:underline block"
                      >
                        {isAr ? 'إزالة' : 'Remove'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Card 3: Design Tokens & Palette (Strict Hex + Contrast Validation) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-500" />
              <span>{isAr ? 'لوحة الألوان ورموز التصميم (Design Tokens)' : 'Color Tokens & Accessibility'}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Primary Brand Color */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? 'اللون الأساسي (Primary)' : 'Primary Color'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor || '#0B1F3A'}
                    disabled={!isAuthorized}
                    onChange={e => handleInputChange('primaryColor', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor || '#0B1F3A'}
                    disabled={!isAuthorized}
                    onChange={e => handleInputChange('primaryColor', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 uppercase"
                  />
                </div>
              </div>

              {/* Secondary Brand Color */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? 'اللون الثانوي (Secondary)' : 'Secondary Color'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.secondaryColor || '#1E3A8A'}
                    disabled={!isAuthorized}
                    onChange={e => handleInputChange('secondaryColor', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.secondaryColor || '#1E3A8A'}
                    disabled={!isAuthorized}
                    onChange={e => handleInputChange('secondaryColor', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 uppercase"
                  />
                </div>
              </div>

              {/* Accent Brand Color */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? 'لون التمييز (Accent)' : 'Accent Color'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.accentColor || '#F28C28'}
                    disabled={!isAuthorized}
                    onChange={e => handleInputChange('accentColor', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.accentColor || '#F28C28'}
                    disabled={!isAuthorized}
                    onChange={e => handleInputChange('accentColor', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 uppercase"
                  />
                </div>
              </div>

              {/* Surface Color */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? 'لون الخلفية (Surface)' : 'Surface Background'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.surfaceColor || '#FFFFFF'}
                    disabled={!isAuthorized}
                    onChange={e => handleInputChange('surfaceColor', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.surfaceColor || '#FFFFFF'}
                    disabled={!isAuthorized}
                    onChange={e => handleInputChange('surfaceColor', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 uppercase"
                  />
                </div>
              </div>

              {/* Text Color */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? 'لون النص (Foreground Text)' : 'Text Color'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.textColor || '#0F172A'}
                    disabled={!isAuthorized}
                    onChange={e => handleInputChange('textColor', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.textColor || '#0F172A'}
                    disabled={!isAuthorized}
                    onChange={e => handleInputChange('textColor', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 uppercase"
                  />
                </div>
              </div>

              {/* Font Family Allowlist */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? 'نوع الخط (Approved Font)' : 'Font Family'}
                </label>
                <select
                  value={formData.fontFamily || 'Inter'}
                  disabled={!isAuthorized}
                  onChange={e => handleInputChange('fontFamily', e.target.value as AllowedFontFamily)}
                  className="w-full px-2 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  {ALLOWED_FONT_FAMILIES.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Contrast Feedback Box */}
            {validationReport && (
              <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                validationReport.contrastReport.passed 
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    {validationReport.contrastReport.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                    <span>{validationReport.contrastReport.passed ? 'WCAG 2.1 AA Contrast Compliance Certified' : 'Accessibility Contrast Error'}</span>
                  </span>
                  <span className="font-mono text-[11px]">
                    Text on Surface: {validationReport.contrastReport.scores.textOnSurface.ratio}:1
                  </span>
                </div>

                {!validationReport.contrastReport.passed && validationReport.contrastReport.errors.length > 0 && (
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {validationReport.contrastReport.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Card 4: Document Footers & Platform Policy */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>{isAr ? 'الامتثال والنصوص القانونية للفواتير' : 'Legal & Document Footers'}</span>
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'تذييل الفواتير الضريبية وإيصالات POS' : 'Tax Invoice & POS Receipt Footer'}
                </label>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={formData.invoiceFooterText || ''}
                  disabled={!isAuthorized}
                  onChange={e => handleInputChange('invoiceFooterText', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  placeholder="Thank you for your business. For support, contact..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'التذييل القانوني للمنصة والتقارير' : 'Platform & Financial Report Legal Footer'}
                </label>
                <input
                  type="text"
                  maxLength={300}
                  value={formData.legalFooterText || ''}
                  disabled={!isAuthorized}
                  onChange={e => handleInputChange('legalFooterText', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  placeholder="Authorized Enterprise SaaS. Certified IFRS & ZATCA Compliant."
                />
              </div>

              {/* Show Powered-By Switch */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {isAr ? 'إظهار علامة منصة إيه إم للأعمال (Powered by AM Platform)' : 'Show "Powered by AM Platform"'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr ? 'متاح للتحكم لعملاء باقة المؤسسات Enterprise Edition' : 'White-label control governed by edition policy'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showPoweredBy ?? true}
                    disabled={!isAuthorized}
                    onChange={e => handleInputChange('showPoweredBy', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* ================================================================ */}
        {/* COLUMN 2: REAL-TIME INTERACTIVE PREVIEWS (5 Cols) */}
        {/* ================================================================ */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Preview Navigation Tabs */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActivePreviewTab('shell')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activePreviewTab === 'shell' 
                    ? 'bg-amber-500 text-white' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isAr ? 'واجهة النظام' : 'App Shell'}
              </button>

              <button
                type="button"
                onClick={() => setActivePreviewTab('login')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activePreviewTab === 'login' 
                    ? 'bg-amber-500 text-white' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isAr ? 'تسجيل الدخول' : 'Login'}
              </button>

              <button
                type="button"
                onClick={() => setActivePreviewTab('receipt')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activePreviewTab === 'receipt' 
                    ? 'bg-amber-500 text-white' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isAr ? 'الفاتورة والإيصال' : 'Receipt / PDF'}
              </button>
            </div>

            {/* Theme Toggle for Preview */}
            <button
              type="button"
              onClick={() => setPreviewTheme(prev => prev === 'light' ? 'dark' : 'light')}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Toggle preview theme"
            >
              {previewTheme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          </div>

          {/* Live Preview Screen Container */}
          <div className={`rounded-2xl border border-slate-300 dark:border-slate-800 p-4 shadow-sm overflow-hidden transition-colors ${
            previewTheme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
          }`}>

            {/* TAB 1: APPLICATION SHELL PREVIEW */}
            {activePreviewTab === 'shell' && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isAr ? 'معاينة شريط العنوان وشريط التنقل' : 'Live Header & Sidebar Preview'}
                </span>

                {/* Mock Header */}
                <div 
                  className="rounded-xl p-3 border shadow-xs flex items-center justify-between"
                  style={{
                    backgroundColor: previewTheme === 'dark' ? '#0F172A' : (formData.surfaceColor || '#FFFFFF'),
                    borderColor: previewTheme === 'dark' ? '#334155' : '#E2E8F0'
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-xs"
                      style={{ backgroundColor: formData.primaryColor || '#0B1F3A' }}
                    >
                      {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo" className="max-h-6 max-w-6 object-contain" />
                      ) : (
                        <span style={{ color: formData.accentColor || '#F28C28' }}>
                          {formData.shortName || 'AM'}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs leading-tight" style={{ color: previewTheme === 'dark' ? '#FFFFFF' : (formData.textColor || '#0F172A') }}>
                        {isAr ? (formData.appNameAr || formData.appName) : (formData.appName || 'AM Business Platform')}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {formData.tradingName || 'Enterprise Operating Platform'}
                      </div>
                    </div>
                  </div>

                  <span 
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                    style={{ 
                      backgroundColor: `${formData.accentColor || '#F28C28'}22`, 
                      color: formData.accentColor || '#F28C28' 
                    }}
                  >
                    Enterprise
                  </span>
                </div>

                {/* Mock Sidebar Sample */}
                <div 
                  className="rounded-xl p-3 border space-y-2 text-xs"
                  style={{
                    backgroundColor: previewTheme === 'dark' ? '#0F172A' : (formData.surfaceColor || '#FFFFFF'),
                    borderColor: previewTheme === 'dark' ? '#334155' : '#E2E8F0'
                  }}
                >
                  <div 
                    className="p-2 rounded-lg font-bold flex items-center justify-between"
                    style={{
                      backgroundColor: formData.primaryColor || '#0B1F3A',
                      color: '#FFFFFF'
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Layout className="w-3.5 h-3.5" style={{ color: formData.accentColor || '#F28C28' }} />
                      <span>{isAr ? 'لوحة التحكم التنفيذية' : 'Executive Dashboard'}</span>
                    </span>
                    <ChevronRight className="w-3 h-3" style={{ color: formData.accentColor || '#F28C28' }} />
                  </div>

                  <div className="p-2 rounded-lg text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isAr ? 'المحاسبة والمالية' : 'Finance & Accounting'}</span>
                  </div>

                  {formData.showPoweredBy && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[9px] text-slate-400 text-center">
                      Powered by AM Business Platform
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: LOGIN VIEW PREVIEW */}
            {activePreviewTab === 'login' && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isAr ? 'معاينة شاشة تسجيل الدخول المخصصة' : 'Live Login Portal Preview'}
                </span>

                <div 
                  className="rounded-xl p-6 border shadow-xs text-center space-y-4"
                  style={{
                    backgroundColor: previewTheme === 'dark' ? '#0F172A' : (formData.surfaceColor || '#FFFFFF'),
                    borderColor: previewTheme === 'dark' ? '#334155' : '#E2E8F0'
                  }}
                >
                  <div 
                    className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center font-bold text-white shadow-md"
                    style={{ backgroundColor: formData.primaryColor || '#0B1F3A' }}
                  >
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className="max-h-8 max-w-8 object-contain" />
                    ) : (
                      <span className="text-lg" style={{ color: formData.accentColor || '#F28C28' }}>
                        {formData.shortName || 'AM'}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm" style={{ color: previewTheme === 'dark' ? '#FFFFFF' : (formData.textColor || '#0F172A') }}>
                      {isAr ? (formData.appNameAr || formData.appName) : (formData.appName || 'Enterprise Portal')}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {isAr ? 'تسجيل الدخول الآمن للمؤسسة' : 'Secure Enterprise Single Sign-On'}
                    </p>
                  </div>

                  <div className="space-y-2 text-start text-xs">
                    <div className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 flex items-center text-slate-400 text-[11px]">
                      user@company.com
                    </div>
                    <div className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 flex items-center text-slate-400 text-[11px]">
                      ••••••••••••
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full py-2 rounded-xl text-xs font-bold text-white transition shadow-xs"
                    style={{ backgroundColor: formData.primaryColor || '#0B1F3A' }}
                  >
                    {isAr ? 'تسجيل الدخول' : 'Sign In'}
                  </button>

                  {formData.showPoweredBy && (
                    <div className="text-[9px] text-slate-400">
                      Protected by AM Platform Security Engine
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: RECEIPT / PDF DOCUMENT PREVIEW */}
            {activePreviewTab === 'receipt' && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isAr ? 'معاينة إيصال نقاط البيع والفاتورة 80mm' : '80mm POS Thermal Receipt Preview'}
                </span>

                <div className="bg-white text-black p-4 rounded-xl border border-slate-300 font-mono text-[11px] space-y-2 shadow-inner">
                  <div className="text-center border-b border-dashed border-slate-400 pb-2">
                    <div className="font-bold text-xs uppercase tracking-wider">
                      {formData.tradingName || formData.appName || 'ENTERPRISE ERP'}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      {formData.addressDisplay || 'Kingdom of Saudi Arabia'}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      VAT: 310123456700003
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px]">
                    <span>Receipt #: POS-2026-9811</span>
                    <span>2026-09-13</span>
                  </div>

                  <div className="border-t border-b border-dashed border-slate-300 py-1 space-y-1">
                    <div className="flex justify-between">
                      <span>Enterprise Software License</span>
                      <span>1,200.00 SAR</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Standard VAT (15%)</span>
                      <span>180.00 SAR</span>
                    </div>
                  </div>

                  <div className="flex justify-between font-bold text-xs">
                    <span>GRAND TOTAL:</span>
                    <span>1,380.00 SAR</span>
                  </div>

                  <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-600">
                    <p>{formData.invoiceFooterText || 'Thank you for your business!'}</p>
                    <p className="mt-1 text-[9px]">{formData.legalFooterText || 'ZATCA Phase 2 Cryptographic E-Invoice'}</p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Audit Reference Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'إصدار الهوية الحالي:' : 'Active Version:'}
              </span>
              <span className="font-mono font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
                v{formData.brandingVersion || 1}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'آخر تحديث بواسطة:' : 'Updated By:'}
              </span>
              <span className="text-slate-500 font-mono">
                {formData.updatedBy || 'system'}
              </span>
            </div>

            {formData.auditReference && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                  {isAr ? 'تجزئة التدقيق المشفرة (Audit Hash):' : 'Tamper-Evident SHA-256 Chain Reference:'}
                </span>
                <span className="font-mono text-[10px] text-slate-500 break-all select-all block bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  {formData.auditReference}
                </span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
