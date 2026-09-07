/**
 * AM Business Platform - Phase 3.1 Regional Tax & Statutory Compliance Hub
 * Architecture Baseline: v2.8
 * Plug-and-play Compliance Adapters for Egypt ETA (e-Invoice & e-Receipt), Saudi ZATCA Phase 2 & UAE FTA.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  FileCode,
  QrCode,
  Lock,
  Globe,
  ArrowRight,
  Send,
  Zap,
  Layers,
  Copy,
  Check
} from 'lucide-react';

interface ComplianceAdapterTabProps {
  isAr: boolean;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ComplianceAdapterTab: React.FC<ComplianceAdapterTabProps> = ({ isAr, onNotify }) => {
  const [activeJurisdiction, setActiveJurisdiction] = useState<'KSA' | 'EGY' | 'UAE'>('KSA');
  const [loading, setLoading] = useState(false);
  const [complianceResult, setComplianceResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Test Sample Data
  const sampleInvoice = {
    invoiceNumber: 'INV-2026-00445',
    invoiceDate: new Date().toISOString().slice(0, 10),
    sellerName: 'AM Enterprise Platform KSA LLC',
    sellerVatNumber: '310123456700003',
    sellerActivityCode: '6201',
    buyerName: 'Al-Mansoor Trading Est',
    buyerVatNumber: '300987654300003',
    buyerIdNumber: '1098765432',
    lines: [
      {
        itemSku: 'SW-ERP-USR',
        itemDescription: 'AM Enterprise Cloud ERP 1-Year License',
        gs1Code: '6281001002003',
        quantity: 5,
        unitPrice: 12000,
        taxRate: 0.15,
        taxAmount: 9000,
        lineTotal: 69000
      }
    ],
    subtotal: 60000,
    taxTotal: 9000,
    grandTotal: 69000
  };

  const handleValidateCompliance = async () => {
    setLoading(true);
    setComplianceResult(null);
    try {
      let endpoint = '';
      if (activeJurisdiction === 'KSA') {
        endpoint = '/api/v1/sales/compliance/zatca/generate';
      } else if (activeJurisdiction === 'EGY') {
        endpoint = '/api/v1/sales/compliance/eta/validate';
      } else {
        endpoint = '/api/v1/sales/compliance/uae/validate';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleInvoice)
      });
      const data = await res.json();
      if (data.success) {
        setComplianceResult(data);
        onNotify(
          isAr
            ? `تمت معالجة وتوليد حزمة الامتثال الضريبي وفق متطلبات ${activeJurisdiction}`
            : `Statutory compliance payload generated for ${activeJurisdiction} with cryptographic validation!`,
          'success'
        );
      } else {
        onNotify(data.error || 'Compliance validation failed', 'error');
      }
    } catch (err) {
      onNotify('Network error running compliance adapter', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>{isAr ? 'مركز محولات الامتثال الضريبي الإقليمي (Regional Tax Compliance Adapters)' : 'Regional Statutory Compliance & E-Invoicing Engine'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'محولات معزولة غير مقحمة في نواة النظام تدعم متطلبات مصلحة الضرائب المصرية (ETA)، هيئة الزكاة والضريبة والجمارك (ZATCA)، والهيئة الاتحادية للضرائب (FTA)'
              : 'Isolated plug-and-play statutory adapters for Saudi ZATCA Phase 2, Egypt ETA e-Invoicing/e-Receipt, and UAE FTA.'}
          </p>
        </div>

        {/* Country Selector Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'KSA', label: 'Saudi Arabia (ZATCA Phase 2)' },
            { id: 'EGY', label: 'Egypt (ETA E-Invoice & E-Receipt)' },
            { id: 'UAE', label: 'UAE (FTA TRN & VAT)' }
          ].map(j => (
            <button
              key={j.id}
              onClick={() => {
                setActiveJurisdiction(j.id as any);
                setComplianceResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeJurisdiction === j.id
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {j.label}
            </button>
          ))}
        </div>
      </div>

      {/* Jurisdiction Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-2xl border space-y-2 transition ${
          activeJurisdiction === 'KSA' ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono text-slate-900 dark:text-white uppercase">Saudi Arabia (ZATCA Phase 2)</h3>
            <span className="text-xs font-bold text-emerald-500 font-mono">15% VAT</span>
          </div>
          <ul className="text-[11px] text-slate-500 space-y-1">
            <li>• UBL 2.1 XML syntax transformation</li>
            <li>• ECDSA secp256k1 digital signatures</li>
            <li>• Base64 TLV Encoded QR codes with SHA-256</li>
            <li>• Cryptographic invoice hash chaining (PIH)</li>
          </ul>
        </div>

        <div className={`p-4 rounded-2xl border space-y-2 transition ${
          activeJurisdiction === 'EGY' ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono text-slate-900 dark:text-white uppercase">Egypt (ETA SDK)</h3>
            <span className="text-xs font-bold text-emerald-500 font-mono">14% VAT / T1</span>
          </div>
          <ul className="text-[11px] text-slate-500 space-y-1">
            <li>• ETA JSON Document v1.0 canonical format</li>
            <li>• EGS / GS1 standard classification code verification</li>
            <li>• ETA Activity Code (ISIC4) integration</li>
            <li>• B2B e-Invoice & B2C e-Receipt API formatting</li>
          </ul>
        </div>

        <div className={`p-4 rounded-2xl border space-y-2 transition ${
          activeJurisdiction === 'UAE' ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono text-slate-900 dark:text-white uppercase">UAE (FTA Tax Hub)</h3>
            <span className="text-xs font-bold text-emerald-500 font-mono">5% VAT</span>
          </div>
          <ul className="text-[11px] text-slate-500 space-y-1">
            <li>• 15-digit TRN statutory format validation</li>
            <li>• Standard, zero-rated & exempt tax categorizations</li>
            <li>• Reverse Charge Mechanism (RCM) checks</li>
            <li>• Arabic / English bilingual invoice mandate</li>
          </ul>
        </div>
      </div>

      {/* Simulator & Result Viewer */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <span>{isAr ? 'محاكاة توليد الحزمة والختم الرقمي' : `Test Compliance Adapter for ${activeJurisdiction}`}</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Sample Invoice Payload: {sampleInvoice.invoiceNumber} ({sampleInvoice.grandTotal.toLocaleString()} SAR/EGP/AED)</span>
          </div>

          <button
            onClick={handleValidateCompliance}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition"
          >
            <Zap className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Processing...' : (isAr ? 'توليد وفحص حزمة الامتثال' : 'Execute Compliance Transformation')}</span>
          </button>
        </div>

        {/* Response Visualization */}
        {complianceResult && (
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold font-mono text-xs border border-emerald-500/20">
                  STATUS: CERTIFIED STATUTORY VALID
                </span>
                {complianceResult.zatcaUuid && (
                  <span className="text-xs font-mono text-slate-400">UUID: {complianceResult.zatcaUuid}</span>
                )}
                {complianceResult.etaDocumentId && (
                  <span className="text-xs font-mono text-slate-400">ETA Doc ID: {complianceResult.etaDocumentId}</span>
                )}
              </div>

              <button
                onClick={() => copyToClipboard(JSON.stringify(complianceResult, null, 2))}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Payload!' : 'Copy Payload'}</span>
              </button>
            </div>

            {/* Cryptographic QR Code & Hash Preview if KSA */}
            {activeJurisdiction === 'KSA' && complianceResult.qrCodeBase64Tlv && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <QrCode className="w-8 h-8 text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">ZATCA Base64 TLV Security Tag</div>
                    <div className="text-[11px] font-mono text-slate-500 truncate max-w-sm">{complianceResult.qrCodeBase64Tlv}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Invoice Hash (SHA-256)</div>
                  <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{complianceResult.invoiceHashSha256}</div>
                </div>
              </div>
            )}

            {/* Formatted Output Payload */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Certified Compliant Output
              </span>
              <pre className="text-xs font-mono text-slate-800 dark:text-slate-200 overflow-x-auto p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-h-96">
                {complianceResult.ublXml || JSON.stringify(complianceResult, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
