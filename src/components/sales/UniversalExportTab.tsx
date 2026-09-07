/**
 * AM Business Platform - Phase 3.1 Universal Relational Data Export Engine
 * Architecture Baseline: v2.8
 * Multi-format export (JSON, CSV, XML, XLSX schema) with SHA-256 integrity seal generation.
 */

import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Sparkles,
  Zap,
  Boxes,
  Database
} from 'lucide-react';
import { ExportDatasetType, ExportFormatType } from '../../types/sales';

interface UniversalExportTabProps {
  isAr: boolean;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const UniversalExportTab: React.FC<UniversalExportTabProps> = ({ isAr, onNotify }) => {
  const [dataset, setDataset] = useState<ExportDatasetType>('ALL_COMPLETE_SALES_BUNDLE');
  const [format, setFormat] = useState<ExportFormatType>('JSON');
  const [includeSeals, setIncludeSeals] = useState(true);
  const [loading, setLoading] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);

  const handleExecuteExport = async () => {
    setLoading(true);
    setExportResult(null);
    try {
      const res = await fetch('/api/v1/sales/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset,
          format,
          includeAuditSeals: includeSeals
        })
      });
      const data = await res.json();
      if (data.success) {
        setExportResult(data.exportResult);
        onNotify(
          isAr
            ? `تم تصدير البيانات بنجاح بصيغة ${format} مع ختم رقمي SHA-256`
            : `Export completed in ${format} format with cryptographic seal!`,
          'success'
        );
      } else {
        onNotify(data.error || 'Export failed', 'error');
      }
    } catch (err) {
      onNotify('Network error running export engine', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = () => {
    if (!exportResult) return;
    const blob = new Blob([exportResult.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>{isAr ? 'مركز تصدير البيانات الشامل والموثق (Universal Relational Export Hub)' : 'Universal Data Export & Certified Archiving Hub'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'تصدير البيانات المترابطة لقطاع المبيعات بصيغ متعددة مع توليد الأختام الرقمية SHA-256 للمطابقة والتدقيق'
              : 'Multi-format relational exports (JSON, CSV, XML, XLSX structures) with cryptographic tamper-proofing.'}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 font-mono text-xs font-bold border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4" />
          <span>SHA-256 Tamper-Proof Output</span>
        </div>
      </div>

      {/* Export Configuration Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dataset Selector */}
          <div>
            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block mb-2">
              Select Sales Data Bundle
            </label>
            <div className="space-y-2">
              {[
                { id: 'ALL_COMPLETE_SALES_BUNDLE', label: 'Complete Sales & POS Bundle (All Tables)', desc: 'Orders, Receipts, Price Lists, Returns & Audit' },
                { id: 'SALES_ORDERS_WITH_LINES', label: 'Sales Orders & Contract Lines', desc: 'B2B orders, customer metadata & line totals' },
                { id: 'POS_RECEIPTS_WITH_PAYMENTS', label: 'POS Receipts & Shift Cashiers', desc: 'Retail receipts, payments breakdown & tax totals' },
                { id: 'ENTERPRISE_PRICE_LISTS', label: 'Enterprise Price Lists & Matrix Rules', desc: 'Active customer tiers, volume rules & dates' },
                { id: 'SYNC_AUDIT_LOGS_AND_LINEAGE', label: 'Offline Sync Audit Trail & Lineage', desc: 'Full device traces, checksums & server doc mappings' }
              ].map(d => (
                <div
                  key={d.id}
                  onClick={() => setDataset(d.id as any)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    dataset === d.id
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{d.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{d.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Format Selector & Execution */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
              Target File Format
            </label>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'JSON', label: 'JSON Relational Graph', icon: FileCode, desc: 'Full nested document tree' },
                { id: 'CSV', label: 'Standard CSV', icon: FileText, desc: 'Flat tabular RFC-4180' },
                { id: 'XML', label: 'Structured XML', icon: Layers, desc: 'Hierarchical XML dataset' },
                { id: 'XLSX', label: 'Excel Workbook (XLSX)', icon: FileSpreadsheet, desc: 'Multi-sheet schema format' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id as any)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                    format === f.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <f.icon className="w-4 h-4" />
                    <span className="text-xs font-bold">{f.label}</span>
                  </div>
                  <div className={`text-[10px] mt-1 ${format === f.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {f.desc}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Embed Cryptographic Audit Seal</div>
                <div className="text-[11px] text-slate-500">Injects SHA-256 seal directly into header metadata</div>
              </div>
              <input
                type="checkbox"
                checked={includeSeals}
                onChange={e => setIncludeSeals(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
            </div>

            <button
              onClick={handleExecuteExport}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition"
            >
              <Zap className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Generating Export...' : (isAr ? 'توليد حزمة التصدير الآن' : 'Execute & Seal Data Export')}</span>
            </button>
          </div>
        </div>

        {/* Export Output Preview & Download Action */}
        {exportResult && (
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 font-mono">
                    {exportResult.filename} ({exportResult.recordCount} Records • {Math.round(exportResult.fileSizeBytes / 1024)} KB)
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                    SHA-256 Seal: {exportResult.checksumSha256}
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownloadFile}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تحميل الملف الموثق' : 'Download File'}</span>
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Raw Content Preview (First 50 lines)
              </span>
              <pre className="text-xs font-mono text-slate-800 dark:text-slate-200 overflow-x-auto p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-h-72">
                {exportResult.content.slice(0, 3000)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
