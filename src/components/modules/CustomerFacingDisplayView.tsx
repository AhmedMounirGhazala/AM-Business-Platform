/**
 * AM Business Platform - Customer-Facing Display (Secondary Screen / Pole Monitor)
 * Architecture Baseline: Pilot Readiness 3C
 * 
 * High-visibility, read-only display for customer checkout counters.
 * Displays live itemized cart, real-time discounts, VAT breakdown,
 * payment progression, and ZATCA Phase 2 electronic receipt QR.
 * 
 * STRICT: ZERO cashier controls. Read-only presentation only.
 */

import React, { useEffect, useState } from 'react';
import { 
  CustomerDisplaySyncService, 
  CustomerDisplayData, 
  DEFAULT_CUSTOMER_DISPLAY_DATA 
} from '../../services/customerDisplaySyncService';
import { 
  Store, 
  ShoppingBag, 
  CheckCircle2, 
  CreditCard, 
  Receipt, 
  Sparkles, 
  Clock, 
  Maximize2, 
  QrCode,
  Globe
} from 'lucide-react';

interface CustomerFacingDisplayViewProps {
  isStandaloneWindow?: boolean;
}

export const CustomerFacingDisplayView: React.FC<CustomerFacingDisplayViewProps> = ({
  isStandaloneWindow = false
}) => {
  const [data, setData] = useState<CustomerDisplayData>(DEFAULT_CUSTOMER_DISPLAY_DATA);
  const [isArabic, setIsArabic] = useState<boolean>(true);
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const syncService = CustomerDisplaySyncService.getInstance();
    const unsubscribe = syncService.subscribe((updated) => {
      setData(updated);
    });

    const timer = setInterval(() => {
      setTimeString(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Could not enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.warn('Could not exit fullscreen:', err);
      });
    }
  };

  const getStatusBadge = () => {
    switch (data.state) {
      case 'SCANNING':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-pulse">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isArabic ? 'جاري مسح الأصناف والوزن' : 'Scanning Items in Progress'}</span>
          </div>
        );
      case 'PAYMENT_IN_PROGRESS':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <CreditCard className="w-3.5 h-3.5 text-[#F28C28]" />
            <span>{isArabic ? 'جاري معالجة الدفع' : 'Payment Processing'}</span>
          </div>
        );
      case 'COMPLETED':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
            <span>{isArabic ? 'تمت العملية بنجاح' : 'Transaction Completed'}</span>
          </div>
        );
      case 'IDLE':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-500 dark:text-slate-400 text-xs font-bold">
            <Store className="w-3.5 h-3.5" />
            <span>{isArabic ? 'نقطة البيع جاهزة' : 'Counter Ready'}</span>
          </div>
        );
    }
  };

  return (
    <div 
      className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans select-none overflow-x-hidden" 
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Top Header Bar */}
      <header className="bg-[#0B1F3A] text-white px-6 py-4 shadow-md flex items-center justify-between border-b border-[#153258]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#F28C28] flex items-center justify-center font-bold text-slate-950 text-xl shadow-xs">
            AM
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight">
              {data.companyName}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>{data.branchName}</span>
              <span>•</span>
              <span className="font-mono text-[#F28C28] font-bold">{data.terminalCode}</span>
            </div>
          </div>
        </div>

        {/* Header Right: Status, Time, Language & Fullscreen */}
        <div className="flex items-center gap-3">
          {getStatusBadge()}

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#153258] text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-[#F28C28]" />
            <span>{timeString}</span>
          </div>

          <button
            onClick={() => setIsArabic(!isArabic)}
            className="px-2.5 py-1.5 rounded-xl bg-[#153258] hover:bg-[#1f4375] text-xs font-bold flex items-center gap-1.5 text-slate-200 transition cursor-pointer"
            title="Toggle Language / تبديل اللغة"
          >
            <Globe className="w-3.5 h-3.5 text-[#F28C28]" />
            <span>{isArabic ? 'English' : 'عربي'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-[#153258] hover:bg-[#1f4375] text-slate-200 transition cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT / CENTER: Live Itemized Lines (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Welcome Screen when IDLE */}
          {data.state === 'IDLE' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[480px]">
              <div className="w-20 h-20 rounded-3xl bg-[#0B1F3A]/5 dark:bg-[#F28C28]/10 text-[#F28C28] flex items-center justify-center mb-6">
                <Store className="w-10 h-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3">
                {isArabic ? (data.welcomeMessageAr || 'أهلاً وسهلاً بكم') : (data.welcomeMessageEn || 'Welcome to AM Retail')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8">
                {isArabic 
                  ? 'يرجى وضع المشتريات على منصة المحاسبة. نرحب بخدمتكم ونتمنى لكم تجربة تسوق ممتعة.'
                  : 'Please place your items on the counter. We are pleased to serve you today.'}
              </p>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300">
                <Sparkles className="w-4 h-4 text-[#F28C28]" />
                <span>{isArabic ? 'كاشير المحطة: ' : 'Cashier on duty: '}</span>
                <span className="font-bold text-slate-900 dark:text-white">{data.cashierName}</span>
              </div>
            </div>
          )}

          {/* Live Scanning or Completed Lines Table */}
          {data.state !== 'IDLE' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col min-h-[480px]">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#0B1F3A] dark:text-[#F28C28]" />
                  <h2 className="font-bold text-base text-slate-900 dark:text-white">
                    {isArabic ? 'سلة المشتريات الحالية' : 'Itemized Receipt Lines'}
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#0B1F3A]/5 dark:bg-[#F28C28]/10 text-[#0B1F3A] dark:text-[#F28C28] font-mono text-xs font-bold">
                  {data.lines.length} {isArabic ? 'أصناف' : 'items'}
                </span>
              </div>

              {/* Scrollable Items List */}
              <div className="flex-1 overflow-y-auto max-h-[420px] space-y-2 pr-1">
                {data.lines.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-sm">
                    {isArabic ? 'في انتظار مسح الصنف الأول...' : 'Awaiting first scanned item...'}
                  </div>
                ) : (
                  data.lines.map((line, idx) => (
                    <div 
                      key={line.id || idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between transition-all animate-in fade-in duration-200"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#0B1F3A] text-white text-[10px] font-bold flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {isArabic && line.nameAr ? line.nameAr : line.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                          <span>{line.itemSku}</span>
                          <span>•</span>
                          <span>
                            {line.quantity} {line.uom || 'UNIT'} × {line.unitPrice.toFixed(2)} {data.currency}
                          </span>
                          {line.discountAmount && line.discountAmount > 0 ? (
                            <span className="text-rose-500 font-bold">
                              (-{line.discountAmount.toFixed(2)} {data.currency})
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-end font-mono">
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {line.lineTotal.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400 ms-1">{data.currency}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Status Message Footer */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>{isArabic ? 'الأسعار تشمل ضريبة القيمة المضافة 15%' : 'Prices include 15% VAT'}</span>
                <span className="font-mono font-bold text-[#0B1F3A] dark:text-[#F28C28]">
                  {data.lines.reduce((acc, l) => acc + l.quantity, 0).toFixed(3)} {isArabic ? 'إجمالي الكمية' : 'Total Qty'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Financial Totals, VAT Breakdown & Payment Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              {isArabic ? 'ملخص الحساب والفاتورة' : 'Order & Tax Summary'}
            </h3>

            {/* Subtotal & Discount */}
            <div className="space-y-2 text-sm font-mono pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>{isArabic ? 'المجموع الخاضع للضريبة' : 'Taxable Subtotal'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {data.subtotal.toFixed(2)} {data.currency}
                </span>
              </div>

              {data.discountTotal > 0 && (
                <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                  <span>{isArabic ? 'إجمالي الخصم الترويجي' : 'Total Discount'}</span>
                  <span className="font-bold">
                    -{data.discountTotal.toFixed(2)} {data.currency}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>{isArabic ? 'ضريبة القيمة المضافة (15%)' : 'VAT (15%)'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {data.taxAmount.toFixed(2)} {data.currency}
                </span>
              </div>
            </div>

            {/* GRAND TOTAL DISPLAY (High Contrast & Large Font) */}
            <div className="p-5 rounded-2xl bg-[#0B1F3A] text-white border-2 border-[#F28C28] shadow-lg space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                {isArabic ? 'المبلغ الإجمالي المطلوب' : 'Total Amount Due'}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                  {data.grandTotal.toFixed(2)}
                </span>
                <span className="text-xl font-bold text-[#F28C28] font-mono">{data.currency}</span>
              </div>
            </div>

            {/* Payment Progression & Change Due */}
            {data.state === 'PAYMENT_IN_PROGRESS' && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                  <CreditCard className="w-4 h-4 text-[#F28C28]" />
                  <span>{isArabic ? 'الدفع قيد التنفيذ' : 'Payment in Progress'}</span>
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-400">
                  {isArabic 
                    ? 'يرجى تمرير البطاقة (مدى / فيزا) على جهاز الدفع الإلكتروني أو تقديم المبلغ النقدي للمحاسب.'
                    : 'Please tap your card (Mada / Visa) on the payment terminal or hand cash to the cashier.'}
                </div>
                {data.payments.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-amber-200 dark:border-amber-800/40 font-mono text-xs">
                    {data.payments.map((p, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{p.method}</span>
                        <span className="font-bold">{p.amount.toFixed(2)} {data.currency}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Completed Receipt & Change Due Card */}
            {data.state === 'COMPLETED' && (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-4">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-base">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isArabic ? 'شكراً لزيارتكم! اكتملت الفاتورة' : 'Thank You! Sale Completed'}</span>
                </div>

                {data.changeDue > 0 && (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 flex justify-between items-center font-mono">
                    <span className="text-xs text-slate-500 font-bold">
                      {isArabic ? 'المتبقي المستحق للعميل:' : 'Change Due:'}
                    </span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      {data.changeDue.toFixed(2)} {data.currency}
                    </span>
                  </div>
                )}

                {data.completedReceipt && (
                  <div className="space-y-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/50">
                    <div className="flex justify-between text-xs font-mono text-slate-600 dark:text-slate-300">
                      <span>{isArabic ? 'رقم الإيصال ZATCA:' : 'Receipt Number:'}</span>
                      <span className="font-bold text-[#0B1F3A] dark:text-white">
                        {data.completedReceipt.receiptNumber}
                      </span>
                    </div>

                    {/* QR Code Indicator */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#0B1F3A] dark:text-[#F28C28]">
                        <QrCode className="w-8 h-8" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {isArabic ? 'رمز الاستجابة السريعة لهيئة الزكاة' : 'ZATCA Compliance QR Code'}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          {isArabic ? 'تم تضمين الرمز الإلكتروني في إيصال الاستلام' : 'Encoded onto printed receipt'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Branding Bar */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3 px-6 text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#0B1F3A] dark:text-slate-200">
            {isArabic ? 'إيه إم لتخطيط موارد المؤسسات' : 'AM ERP Engine'}
          </span>
          <span>•</span>
          <span className="text-[#F28C28] font-sans font-semibold">
            {isArabic ? '«كل قرار ناجح يبدأ برقم صحيح»' : '"Every successful decision begins with an accurate number"'}
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          {isArabic ? 'محطة شاشة العميل • وضع العرض فقط • أحمد منير' : 'Customer Display Terminal • Read-Only • Ahmed Mounir'}
        </div>
      </footer>
    </div>
  );
};
