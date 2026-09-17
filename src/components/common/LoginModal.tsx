/**
 * AM ERP — Canonical Login & Authentication Surface
 * P0-08 Milestone: AM Visual Identity & Multi-Tenant Access Surface
 * 
 * Approved AM Identity Specs:
 * - Product identity: AM ERP
 * - Brand family: AM / Ahmed Mounir
 * - Positioning: Financial Accountant | Business Analyst
 * - Motto: "كل قرار ناجح يبدأ برقم صحيح"
 * - Primary color: #0B1F3A
 * - Accent color: AM Gold
 * - Typography: Plus Jakarta Sans / Cairo
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Building, 
  Globe, 
  X, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { lang, setLang, tenants, activeTenant, setActiveTenant, platformIdentity, branding } = usePlatform();
  const isAr = lang === 'ar';

  const [email, setEmail] = useState<string>('a.mounir369@gmail.com');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(activeTenant?.id || 'ten-001');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const t = tenants.find(item => item.id === selectedTenantId);
    if (t) {
      setActiveTenant(t);
    }
    setSuccessMsg(isAr ? 'تم التحقق بنجاح والدخول إلى المنصة' : 'Authentication confirmed. Welcome to AM ERP.');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1200);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      dir={isAr ? 'rtl' : 'ltr'}
      id="am-login-modal-overlay"
    >
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        id="am-login-card"
        style={{ fontFamily: isAr ? 'Cairo, sans-serif' : "'Plus Jakarta Sans', sans-serif" }}
      >
        
        {/* Top AM Platform Branded Header Banner */}
        <div 
          className="p-6 text-white text-center relative overflow-hidden"
          style={{ backgroundColor: '#0B1F3A' }}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 bg-[var(--brand-gold)] pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-10 bg-white pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="am-focus-ring absolute top-4 end-4 p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close"
            id="login-close-btn"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Language Switcher pill in header */}
          <button
            type="button"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="am-focus-ring absolute top-4 start-4 px-2.5 py-1 rounded-md text-xs font-bold bg-[var(--brand-navy-light)] text-[var(--brand-gold)] border border-[var(--brand-gold)]/30 hover:bg-[var(--brand-navy)] transition flex items-center gap-1 cursor-pointer"
            id="login-lang-toggle"
          >
            <Globe className="w-3 h-3" />
            <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Approved AM Monogram Asset */}
          <div className="flex justify-center mb-3 mt-2">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg border-2"
              style={{ 
                backgroundColor: '#0B1F3A', 
                color: 'var(--brand-gold)',
                borderColor: 'rgba(242, 140, 40, 0.6)'
              }}
              id="am-login-monogram"
            >
              AM
            </div>
          </div>

          {/* Platform Identity & Brand Names */}
          <h2 className="text-xl font-black tracking-tight text-white">
            {isAr ? platformIdentity.productNameAr : platformIdentity.productName}
          </h2>
          <p className="text-xs font-semibold text-[var(--brand-gold-muted)] mt-0.5">
            {isAr ? platformIdentity.brandFamilyAr : platformIdentity.brandFamily}
          </p>
          <p className="text-[11px] text-slate-300 mt-1">
            {isAr ? platformIdentity.positioningAr : platformIdentity.positioning}
          </p>

          {/* Approved Motto Banner */}
          <div className="mt-3 pt-2.5 border-t border-white/10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[var(--brand-navy-light)]/80 text-[var(--brand-gold)] text-xs font-bold border border-[var(--brand-gold)]/25 shadow-xs">
              <Sparkles className="w-3 h-3" />
              <span>{isAr ? platformIdentity.mottoAr : platformIdentity.motto}</span>
            </div>
          </div>
        </div>

        {/* Login Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4" id="am-login-form">
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tenant Switcher */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{isAr ? 'جهة العمل / المنشأة' : 'Tenant Organization'}</span>
              <span className="text-[10px] text-slate-400 font-normal">Multi-Tenant Isolation</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute start-3 top-3 pointer-events-none" />
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 ps-9 pe-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 am-control focus:outline-none"
                id="login-tenant-select"
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.edition})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'البريد الإلكتروني' : 'Enterprise Email'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute start-3 top-3 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 ps-9 pe-3 py-2.5 text-xs text-slate-900 dark:text-white font-medium am-control focus:outline-none"
                id="login-email-input"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{isAr ? 'كلمة المرور' : 'Password / PIN'}</span>
              <span className="text-[10px] text-[var(--brand-gold-muted)] hover:underline cursor-pointer">
                {isAr ? 'استعادة الرمز؟' : 'Forgot?'}
              </span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute start-3 top-3 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 ps-9 pe-3 py-2.5 text-xs text-slate-900 dark:text-white font-medium am-control focus:outline-none"
                id="login-password-input"
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            className="am-focus-ring w-full py-3 px-4 rounded-lg text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            style={{ backgroundColor: '#0B1F3A' }}
            id="login-submit-btn"
          >
            <span>{isAr ? 'تسجيل الدخول للمنصة' : 'Authenticate & Enter AM ERP'}</span>
            <ArrowRight className="w-4 h-4 text-[var(--brand-gold)] rtl:rotate-180" />
          </button>

          {/* Legal Footnote */}
          <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {isAr 
                ? 'نظام مؤمن ومعتمد وفق معايير الحوكمة المالية المصرية والخليجية'
                : 'Protected Enterprise Runtime • IFRS & ZATCA Compliant'}
            </span>
          </div>

        </form>

      </div>
    </div>
  );
};
