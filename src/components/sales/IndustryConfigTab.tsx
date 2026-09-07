/**
 * AM Business Platform - Phase 3.1 Industry Vertical Configuration Center
 * Architecture Baseline: v2.8
 * 9 Standard Industry Profiles with dynamic POS/Sales feature toggles and compliance mapping.
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  CheckCircle2,
  Sliders,
  Sparkles,
  ShoppingBag,
  Scissors,
  Smartphone,
  Truck,
  Factory,
  Utensils,
  Briefcase,
  HardHat,
  Ship,
  Check,
  ShieldCheck
} from 'lucide-react';
import { IndustryProfileConfig, IndustryVerticalType } from '../../types/sales';

interface IndustryConfigTabProps {
  isAr: boolean;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const IndustryConfigTab: React.FC<IndustryConfigTabProps> = ({ isAr, onNotify }) => {
  const [profiles, setProfiles] = useState<IndustryProfileConfig[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<IndustryProfileConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/sales/industry/profiles');
      const data = await res.json();
      if (data.success) {
        setProfiles(data.profiles);
        const active = data.profiles.find((p: IndustryProfileConfig) => p.isActive) || data.profiles[0];
        setSelectedProfile(active);
      }
    } catch (err) {
      onNotify('Failed to load industry profiles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleActivateProfile = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/sales/industry/profiles/${id}/activate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onNotify(isAr ? `تم تفعيل الملف القطاعي ${data.activeProfile.name} بنجاح` : `Activated ${data.activeProfile.name} Industry Profile!`);
        setProfiles(data.profiles);
        setSelectedProfile(data.activeProfile);
      } else {
        onNotify(data.error || 'Failed to activate profile', 'error');
      }
    } catch (err) {
      onNotify('Network error activating profile', 'error');
    }
  };

  const getVerticalIcon = (vertical?: string) => {
    switch (vertical) {
      case 'RETAIL': return <ShoppingBag className="w-5 h-5 text-emerald-500" />;
      case 'FASHION': return <Scissors className="w-5 h-5 text-pink-500" />;
      case 'MOBILE_ACCESSORIES': return <Smartphone className="w-5 h-5 text-blue-500" />;
      case 'WHOLESALE': return <Truck className="w-5 h-5 text-amber-500" />;
      case 'MANUFACTURING': return <Factory className="w-5 h-5 text-purple-500" />;
      case 'RESTAURANT': return <Utensils className="w-5 h-5 text-orange-500" />;
      case 'SERVICE_CENTER': return <Briefcase className="w-5 h-5 text-indigo-500" />;
      case 'CONSTRUCTION': return <HardHat className="w-5 h-5 text-yellow-500" />;
      case 'IMPORT_EXPORT': return <Ship className="w-5 h-5 text-cyan-500" />;
      default: return <Layers className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>{isAr ? 'مركز إعدادات القطاعات والأنشطة التجارية (Industry Configuration Hub)' : 'Industry Vertical Configuration Hub'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? '9 قوالب تشغيلية متخصصة مع تكييف كامل لواجهات نقاط البيع، حوكمة الأسعار، وتدفقات العمل بدون كتابة أكواد'
              : '9 Pre-configured industry operational profiles with no-code POS layout toggles, batch/serial tracking, and workflow adaptations.'}
          </p>
        </div>

        {selectedProfile && selectedProfile.isActive && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 font-mono text-xs font-bold border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
            <span>Active: {selectedProfile.name}</span>
          </div>
        )}
      </div>

      {/* Profiles Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profiles.map(prof => (
          <div
            key={prof.id}
            onClick={() => setSelectedProfile(prof)}
            className={`p-5 rounded-2xl border cursor-pointer transition relative space-y-3 ${
              selectedProfile?.id === prof.id
                ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                {getVerticalIcon(prof.profileType)}
              </div>
              {prof.isActive && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-mono text-[10px] font-bold">
                  ACTIVE
                </span>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{prof.name}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{prof.description}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                {prof.profileType}
              </span>
              {!prof.isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActivateProfile(prof.id);
                  }}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition"
                >
                  Activate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Profile Detailed Feature Inspection */}
      {selectedProfile && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                {getVerticalIcon(selectedProfile.profileType)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedProfile.name}</h3>
                <div className="text-xs text-slate-500 font-mono">Vertical ID: {selectedProfile.profileType}</div>
              </div>
            </div>

            {!selectedProfile.isActive && (
              <button
                onClick={() => handleActivateProfile(selectedProfile.id)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer transition"
              >
                Set as Active Organization Profile
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">POS Mode & Scanner</span>
              <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                {selectedProfile.posConfig?.enableBarcodeScanner ? 'Fast Scan Mode' : 'Standard Manual'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Price Override Governance</span>
              <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                {selectedProfile.posConfig?.allowPriceOverride ? 'Override Allowed' : 'Strict (Locked)'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Default Price Tier</span>
              <div className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {selectedProfile.salesConfig?.defaultPriceListType || 'RETAIL'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Credit Limit Policy</span>
              <div className="text-xs font-bold font-mono text-emerald-600">
                {selectedProfile.governanceConfig?.creditLimitBlockPolicy || 'HARD_BLOCK'}
              </div>
            </div>
          </div>

          {/* Module Feature Flags Checklist */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              {isAr ? 'الميزات التشغيلية المفعلة لهذا القطاع' : 'Active Vertical Capabilities & Governance Toggles'}
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                { label: isAr ? 'ماسح الباركود السريع' : 'Barcode Scanner Fast Mode', active: !!selectedProfile.posConfig?.enableBarcodeScanner },
                { label: isAr ? 'مصفوفة المتغيرات (الألوان والمقاسات)' : 'Variant Matrix (Color/Size)', active: !!selectedProfile.posConfig?.requireVariantSelection },
                { label: isAr ? 'تتبع السيريال والأجهزة IMEI' : 'IMEI / Serial Tracking', active: !!selectedProfile.posConfig?.enableImeiSerialTracking },
                { label: isAr ? 'إدارة الطاولات والصالات' : 'Table / Dine-In Management', active: !!selectedProfile.posConfig?.enableTableManagement },
                { label: isAr ? 'شاشات عرض المطبخ KDS' : 'Kitchen Display System (KDS)', active: !!selectedProfile.posConfig?.enableKitchenDisplaySystem },
                { label: isAr ? 'تكامل الموازين الإلكترونية' : 'Weight Scale Integration', active: !!selectedProfile.posConfig?.enableWeighingScaleIntegration },
                { label: isAr ? 'أزرار النقد السريع' : 'Fast Cash Buttons', active: !!selectedProfile.posConfig?.enableFastCashButtons },
                { label: isAr ? 'خصومات الفئات والكميات' : 'Volume Tier Discounts', active: !!selectedProfile.salesConfig?.enableVolumeTierDiscounts },
                { label: isAr ? 'تكامل أوامر الشغل والصيانة' : 'Job Order Integration', active: !!selectedProfile.salesConfig?.enableJobOrderIntegration },
                { label: isAr ? 'بيانات الإفراج الجمركي' : 'Customs Declaration Tracking', active: !!selectedProfile.salesConfig?.enableCustomsDeclarationField },
                { label: isAr ? 'جداول الكميات ومكونات التصنيع' : 'Bill of Quantities (BOM)', active: !!selectedProfile.salesConfig?.enableBillOfQuantitiesBOM },
                { label: isAr ? 'تتبع الضمانات وبطاقات الخدمة' : 'Warranty Tracking', active: !!selectedProfile.salesConfig?.enableWarrantyTracking },
                { label: isAr ? 'العمليات أوفلاين بدون اتصال' : 'Offline Mode Operation', active: !!selectedProfile.governanceConfig?.allowOfflineOperations }
              ].map((feat, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                    feat.active
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  {feat.active ? <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> : <span className="w-3.5 h-3.5 block text-center">—</span>}
                  <span className="truncate">{feat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
