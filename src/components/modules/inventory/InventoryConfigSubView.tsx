import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Sliders 
} from 'lucide-react';
import { ApiClient } from '../../../services/apiClient';
import { InventoryRuleConfig } from '../../../types';

interface Props {
  config: InventoryRuleConfig;
  isAr: boolean;
  canEdit: boolean;
  onRefresh: () => void;
}

export const InventoryConfigSubView: React.FC<Props> = ({
  config,
  isAr,
  canEdit,
  onRefresh
}) => {
  const [formConfig, setFormConfig] = useState<InventoryRuleConfig>({ ...config });
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveConfig = async () => {
    try {
      await ApiClient.updateInventoryConfig(formConfig);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
      
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <span>{isAr ? 'سياسات وإعدادات قواعد المخزون' : 'Inventory Rules & Module Policy Configuration'}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr ? 'ضبط القواعد التشغيلية، الخصم بالسالب، التتبع بالدفعة والسيريال، وأسلوب التقييم' : 'Configure operational safeguards, negative stock policy, batch/serial tracking enforcement, and valuation rules'}
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleSaveConfig}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{isAr ? 'حفظ السياسات' : 'Save Policies'}</span>
          </button>
        )}
      </div>

      {isSaved && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{isAr ? 'تم حفظ إعدادات قواعد المخزون بنجاح' : 'Inventory policy rules updated successfully.'}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        
        {/* Negative Stock & Quant Policy */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm border-b border-slate-200 dark:border-slate-800 pb-2">
            {isAr ? 'قواعد الرصيد والكميات' : 'Quant & Balance Enforcement'}
          </h4>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">{isAr ? 'السماح بالصرف بالسالب (Negative Stock)' : 'Allow Negative Stock Balance'}</div>
              <div className="text-slate-500 text-[11px]">{isAr ? 'السماح بإصدار بضاعة عند عدم توفر رصيد مادي' : 'Permit stock issues when physical on-hand quantity is 0'}</div>
            </div>
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={formConfig.allowNegativeStock}
              onChange={(e) => setFormConfig({ ...formConfig, allowNegativeStock: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">{isAr ? 'تحديث تلقائي لرصيد الكوانت Quant' : 'Auto Stock Quant Re-indexing'}</div>
              <div className="text-slate-500 text-[11px]">{isAr ? 'مزامنة كوانت الرفوف فورا مع المستندات' : 'Sync bin quant balances instantly upon posting GRN or Issue'}</div>
            </div>
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={formConfig.autoGenerateQuantOnReceipt}
              onChange={(e) => setFormConfig({ ...formConfig, autoGenerateQuantOnReceipt: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Serial & Batch Enforcements */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm border-b border-slate-200 dark:border-slate-800 pb-2">
            {isAr ? 'قواعد التتبع بالدفعة والسيريال' : 'Batch & Serial Tracking Rules'}
          </h4>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">{isAr ? 'إلزامية تحديد رقم الدفعة Lot' : 'Require Mandatory Batch / Lot'}</div>
              <div className="text-slate-500 text-[11px]">{isAr ? 'منع حركات الاستلام والصرف للأصناف الحساسة بدون دفعة' : 'Enforce lot assignment on all movement postings'}</div>
            </div>
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={formConfig.requireBatchLotForPerishables}
              onChange={(e) => setFormConfig({ ...formConfig, requireBatchLotForPerishables: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">{isAr ? 'إلزامية السيريال للأصول' : 'Require Serial Numbers on High Value'}</div>
              <div className="text-slate-500 text-[11px]">{isAr ? 'مطالبة بإدخال أرقام سيريال فردية للأجهزة والآلات' : 'Mandate individual serial entry for high-value hardware'}</div>
            </div>
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={formConfig.requireSerialNumberForHighValue}
              onChange={(e) => setFormConfig({ ...formConfig, requireSerialNumberForHighValue: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Valuation & Alert Parameters */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm border-b border-slate-200 dark:border-slate-800 pb-2">
            {isAr ? 'التقييم والتنبيهات' : 'Valuation & Expiry Thresholds'}
          </h4>

          <div>
            <label className="block font-semibold mb-1 text-slate-900 dark:text-white">
              {isAr ? 'طريقة التقييم الافتراضية للمؤسسة' : 'Default Valuation Method'}
            </label>
            <select
              disabled={!canEdit}
              value={formConfig.defaultValuationMethod}
              onChange={(e) => setFormConfig({ ...formConfig, defaultValuationMethod: e.target.value as any })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-mono font-bold"
            >
              <option value="FIFO">FIFO (First In, First Out)</option>
              <option value="AVCO">Weighted Average Cost (AVCO)</option>
              <option value="STANDARD">Standard Costing</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-900 dark:text-white">
              {isAr ? 'تنبيه انتهاء الصلاحية قبل (أيام)' : 'Expiry Warning Alert Days'}
            </label>
            <input
              type="number"
              disabled={!canEdit}
              value={formConfig.expiryAlertThresholdDays}
              onChange={(e) => setFormConfig({ ...formConfig, expiryAlertThresholdDays: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-mono font-bold"
            />
          </div>
        </div>

        {/* SKU Auto Generation Rules */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm border-b border-slate-200 dark:border-slate-800 pb-2">
            {isAr ? 'قواعد التكويد والبادئة (SKU Prefix Engine)' : 'SKU Generator & Prefix Rules'}
          </h4>

          <div>
            <label className="block font-semibold mb-1 text-slate-900 dark:text-white">
              {isAr ? 'بادئة التكويد الافتراضية SKU Prefix' : 'Default SKU Prefix Pattern'}
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={formConfig.skuPrefixPattern}
              onChange={(e) => setFormConfig({ ...formConfig, skuPrefixPattern: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-mono font-bold text-indigo-600"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">{isAr ? 'توليد باركود تلقائي EAN-13' : 'Auto Generate Barcode EAN-13'}</div>
              <div className="text-slate-500 text-[11px]">{isAr ? 'إنشاء رمز باركود تلقائي عند إضافة صنف جديد' : 'Generate EAN-13 barcode digits when creating new items'}</div>
            </div>
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={formConfig.enableAutoSkuGeneration}
              onChange={(e) => setFormConfig({ ...formConfig, enableAutoSkuGeneration: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>

      </div>

    </div>
  );
};
