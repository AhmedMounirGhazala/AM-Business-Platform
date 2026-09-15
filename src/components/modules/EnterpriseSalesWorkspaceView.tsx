/**
 * AM Business Platform - Phase 3.1 Enterprise Sales Workspace
 * Architecture Baseline: v2.8
 * Comprehensive Sales Quotations, Orders Lifecycle State Machine, ATP, Pricing & Promotions
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShoppingBag,
  TrendingUp,
  Tag,
  Gift,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
  Plus,
  Eye,
  Check,
  FileCheck,
  Send,
  Boxes,
  Zap,
  DollarSign,
  Percent,
  Sliders,
  Receipt,
  X,
  Lock,
  Smartphone,
  RefreshCw,
  GitCompare,
  AlertOctagon,
  ShieldAlert,
  Globe,
  Download,
  Award
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import {
  SalesQuotation,
  SalesOrder,
  EnterprisePriceList,
  DiscountRule,
  PromotionCampaign,
  SalesReturn,
  SalesOrderStatus
} from '../../types/sales';
import { SyncCenterTab } from '../sales/SyncCenterTab';
import { ConflictResolutionTab } from '../sales/ConflictResolutionTab';
import { RecoveryCenterTab } from '../sales/RecoveryCenterTab';
import { MobileSalesTab } from '../sales/MobileSalesTab';
import { IndustryConfigTab } from '../sales/IndustryConfigTab';
import { ComplianceAdapterTab } from '../sales/ComplianceAdapterTab';
import { UniversalExportTab } from '../sales/UniversalExportTab';
import { HardeningTestSuiteTab } from '../sales/HardeningTestSuiteTab';
import { TaxEngine } from '../../engine/taxEngine';

export const EnterpriseSalesWorkspaceView: React.FC = () => {
  const { lang, activeCompany } = usePlatform();
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<
    'orders' | 'quotations' | 'mobile_sales' | 'sync_center' | 'conflicts' | 'recovery' | 'pricelists' | 'discounts' | 'promotions' | 'returns' | 'industry_config' | 'compliance' | 'export' | 'testing' | 'analytics'
  >('orders');
  const [loading, setLoading] = useState(false);

  // Domain Data State
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [quotations, setQuotations] = useState<SalesQuotation[]>([]);
  const [priceLists, setPriceLists] = useState<EnterprisePriceList[]>([]);
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [promotions, setPromotions] = useState<PromotionCampaign[]>([]);
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Selected Item / Modals
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<SalesOrderStatus>('CONFIRMED');
  const [transitionReason, setTransitionReason] = useState('');
  const [holdReason, setHoldReason] = useState('');

  // ATP Modal
  const [atpData, setAtpData] = useState<any>(null);
  const [isAtpModalOpen, setIsAtpModalOpen] = useState(false);

  // New Order / Quotation Modal
  const [isNewQuotationModalOpen, setIsNewQuotationModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('Saudi Electricity Company (SEC)');
  const [newCustSku, setNewCustSku] = useState('SW-ERP-USR');
  const [newCustQty, setNewCustQty] = useState(15);
  const [newCustPrice, setNewCustPrice] = useState(11000);

  // Pricing Sandbox
  const [sandboxSku, setSandboxSku] = useState('SW-ERP-USR');
  const [sandboxQty, setSandboxQty] = useState(25);
  const [sandboxResolvedPrice, setSandboxResolvedPrice] = useState<any>(null);

  // Feedback Notification
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [oRes, qRes, pRes, dRes, prRes, rRes, aRes] = await Promise.all([
        fetch('/api/v1/sales/orders').then(r => r.json()),
        fetch('/api/v1/sales/quotations').then(r => r.json()),
        fetch('/api/v1/sales/pricelists').then(r => r.json()),
        fetch('/api/v1/sales/discounts/rules').then(r => r.json()),
        fetch('/api/v1/sales/promotions').then(r => r.json()),
        fetch('/api/v1/sales/returns').then(r => r.json()),
        fetch('/api/v1/sales/analytics/summary').then(r => r.json())
      ]);

      if (oRes.success) setOrders(oRes.orders);
      if (qRes.success) setQuotations(qRes.quotations);
      if (pRes.success) setPriceLists(pRes.priceLists);
      if (dRes.success) setDiscountRules(dRes.discountRules);
      if (prRes.success) setPromotions(prRes.promotions);
      if (rRes.success) setReturns(rRes.returns);
      if (aRes.success) setAnalytics(aRes.metrics);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      showNotification('Failed to load Sales domain data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Quotation Conversion
  const handleConvertQuotation = async (qId: string) => {
    try {
      const res = await fetch(`/api/v1/sales/quotations/${qId}/convert-to-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          performedBy: { id: 'usr-002', name: 'Tariq Al-Mansoor', role: 'Sales Lead' }
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(isAr ? `تم تحويل عرض السعر إلى أمر البيع ${data.order.orderNumber} بنجاح` : `Quotation converted to Sales Order ${data.order.orderNumber} with SHA-256 seal!`);
        loadData();
      } else {
        showNotification(data.error || 'Conversion failed', 'error');
      }
    } catch (err) {
      showNotification('Network error converting quotation', 'error');
    }
  };

  // Handle Order State Transition
  const handleExecuteTransition = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch(`/api/v1/sales/orders/${selectedOrder.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toStatus: targetStatus,
          reason: transitionReason || `Workflow transition to ${targetStatus}`,
          holdReason: targetStatus === 'ON_HOLD' ? holdReason : undefined,
          performedBy: { id: 'usr-001', name: 'Ahmad Mounir (CFO)', role: 'Executive Approver' }
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(isAr ? `تم تحديث حالة أمر البيع إلى ${targetStatus}` : `Order transitioned to ${targetStatus} with SHA-256 digital audit record!`);
        setIsTransitionModalOpen(false);
        setSelectedOrder(data.order);
        loadData();
      } else {
        showNotification(data.error || 'Transition denied by state machine', 'error');
      }
    } catch (err) {
      showNotification('Network error on state transition', 'error');
    }
  };

  // Handle Available-To-Promise (ATP) Check
  const handleCheckAtp = async (order: SalesOrder) => {
    try {
      const res = await fetch(`/api/v1/sales/orders/${order.id}/atp-check`);
      const data = await res.json();
      if (data.success) {
        setAtpData(data);
        setIsAtpModalOpen(true);
      }
    } catch (err) {
      showNotification('Failed to check ATP', 'error');
    }
  };

  // Handle Stock Reservation
  const handleReserveStock = async (orderId: string) => {
    try {
      const res = await fetch(`/api/v1/sales/orders/${orderId}/reserve-stock`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification(isAr ? 'تم حجز الكميات بالمستودع بنجاح' : 'Warehouse stock allocated and reserved successfully!');
        loadData();
      }
    } catch (err) {
      showNotification('Stock reservation failed', 'error');
    }
  };

  // Handle Generate AR Invoice
  const handleGenerateInvoice = async (orderId: string) => {
    try {
      const res = await fetch(`/api/v1/sales/orders/${orderId}/generate-invoice`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification(isAr ? `تم إصدار الفاتورة الضريبية ${data.invoice.invoiceNumber} وإثبات الإيراد تلقائياً` : `AR Sales Invoice ${data.invoice.invoiceNumber} generated & Revenue Recognized via Financial Event!`);
        loadData();
      }
    } catch (err) {
      showNotification('Invoice generation failed', 'error');
    }
  };

  // Handle Create New Quotation
  const handleCreateQuotation = async () => {
    const taxRes = TaxEngine.resolveTaxRate({
      tenantId: activeCompany?.tenantId || 'ten-001',
      companyId: activeCompany?.id || 'comp-001',
      countryOrJurisdiction: activeCompany?.countryCode || 'SA'
    });
    const lineCalc = TaxEngine.calculateLineTax({
      quantity: newCustQty,
      unitPrice: newCustPrice,
      discountAmount: 0,
      taxRate: taxRes.taxRate
    });
    const subtotal = lineCalc.taxableAmount;
    const tax = lineCalc.taxAmount;
    const total = lineCalc.grossAmount;

    try {
      const res = await fetch('/api/v1/sales/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: 'cust-sec-01',
          customerName: newCustName,
          customerEmail: 'rfq@sec.com.sa',
          customerPhone: '+966 11 807 7777',
          subtotal,
          discountTotal: 0,
          taxTotal: tax,
          grandTotal: total,
          lines: [
            {
              id: `line-${Date.now()}`,
              itemSku: newCustSku,
              itemName: newCustSku === 'SW-ERP-USR' ? 'AM Enterprise ERP License' : 'Dell Enterprise Rack Server',
              uom: 'UNIT',
              quantity: newCustQty,
              unitPrice: newCustPrice,
              discountRate: 0,
              discountAmount: 0,
              taxCode: taxRes.taxCode,
              taxRate: taxRes.taxRate,
              taxAmount: tax,
              lineTotal: total,
              availableStock: 50
            }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(isAr ? `تم إصدار عرض السعر ${data.quotation.quotationNumber}` : `Quotation ${data.quotation.quotationNumber} created!`);
        setIsNewQuotationModalOpen(false);
        loadData();
      }
    } catch (err) {
      showNotification('Failed to create quotation', 'error');
    }
  };

  // Test Pricing Resolution in Sandbox
  const handleResolvePricingSandbox = async () => {
    try {
      const res = await fetch('/api/v1/sales/pricing/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemSku: sandboxSku,
          quantity: sandboxQty,
          basePrice: 12000,
          customerDiscountPercent: 5
        })
      });
      const data = await res.json();
      if (data.success) {
        setSandboxResolvedPrice(data.pricing);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg transition-all animate-fadeIn ${
          notification.type === 'success' ? 'bg-emerald-600 text-white' :
          notification.type === 'error' ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
        }`}>
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] font-bold border border-indigo-500/20">
              PHASE 3.1 ENTERPRISE SALES & POS
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">Architecture Baseline v2.8 Certified</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>{isAr ? 'إدارة المبيعات المؤسسية وأوامر البيع' : 'Enterprise Sales & Order-to-Cash Hub'}</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>SHA-256 Audit Seal Engine</span>
          </div>

          <button
            onClick={() => setIsNewQuotationModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'عرض سعر جديد' : 'New Quotation'}</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{isAr ? 'إجمالي المبيعات' : 'Gross Sales Volume'}</span>
            <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {analytics.totalGrossSales.toLocaleString()} SAR
            </div>
            <div className="text-[10px] text-slate-500">Net Sales: {analytics.totalNetSales.toLocaleString()} SAR</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{isAr ? 'أوامر المبيعات' : 'Sales Orders'}</span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {analytics.totalOrdersCount} <span className="text-xs font-normal text-slate-400">Orders</span>
            </div>
            <div className="text-[10px] text-amber-500 font-semibold">{analytics.pendingOrderApprovalsCount} Pending Approval</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{isAr ? 'عروض الأسعار النشطة' : 'Active Quotations'}</span>
            <div className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {analytics.activeQuotationsCount} <span className="text-xs font-normal text-slate-400">Active</span>
            </div>
            <div className="text-[10px] text-slate-500">Avg Value: {analytics.averageOrderValue.toLocaleString()} SAR</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{isAr ? 'معدل المرتجعات' : 'Returns Rate'}</span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {analytics.returnRatePercentage}%
            </div>
            <div className="text-[10px] text-emerald-500 font-semibold">Quality Verified</div>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'orders', labelEn: 'Sales Orders Lifecycle', labelAr: 'دورة أوامر البيع', icon: ShoppingBag, count: orders.length },
          { id: 'quotations', labelEn: 'Quotations & Proposals', labelAr: 'عروض الأسعار', icon: FileText, count: quotations.length },
          { id: 'mobile_sales', labelEn: 'Mobile Field Sales & Van', labelAr: 'مبيعات الفانات والميداني', icon: Smartphone },
          { id: 'sync_center', labelEn: 'Offline Sync & Devices', labelAr: 'المزامنة وأجهزة نقاط البيع', icon: RefreshCw },
          { id: 'conflicts', labelEn: 'Conflict Resolution', labelAr: 'تسوية التعارضات', icon: GitCompare },
          { id: 'recovery', labelEn: 'Quarantine & Recovery', labelAr: 'معالجة المعاملات المتعثرة', icon: ShieldAlert },
          { id: 'pricelists', labelEn: 'Enterprise Price Lists', labelAr: 'قوائم الأسعار المؤسسية', icon: Tag, count: priceLists.length },
          { id: 'discounts', labelEn: 'Discount Governance', labelAr: 'حوكمة الخصومات', icon: Percent, count: discountRules.length },
          { id: 'promotions', labelEn: 'Promotions & Coupons', labelAr: 'العروض الترويجية والكوبونات', icon: Gift, count: promotions.length },
          { id: 'returns', labelEn: 'Returns & RMA', labelAr: 'المرتجعات والتبديل', icon: RotateCcw, count: returns.length },
          { id: 'industry_config', labelEn: 'Industry Verticals', labelAr: 'إعدادات القطاعات', icon: Sliders },
          { id: 'compliance', labelEn: 'Tax & Compliance', labelAr: 'الامتثال الضريبي الإقليمي', icon: Globe },
          { id: 'export', labelEn: 'Universal Export', labelAr: 'تصدير البيانات الموثقة', icon: Download },
          { id: 'testing', labelEn: '20-Scenario Tests', labelAr: 'حزمة اختبارات الصلابة', icon: Award },
          { id: 'analytics', labelEn: 'Sales Analytics & BI', labelAr: 'التحليلات ومؤشرات الأداء', icon: TrendingUp }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==================== TAB 1: SALES ORDERS ==================== */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-500" />
                <span>{isAr ? 'سجل أوامر البيع وسلسلة التدقيق' : 'Sales Orders Ledger & State Machine Engine'}</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">Real-time Stock & AR Integration</span>
            </div>

            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">{order.orderNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                        order.status === 'FULFILLED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        order.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        order.status === 'ON_HOLD' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                        'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {order.status}
                      </span>
                      {order.stockReservationStatus === 'FULLY_RESERVED' && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-bold flex items-center gap-1 border border-emerald-500/20">
                          <Boxes className="w-3 h-3" /> Stock Reserved
                        </span>
                      )}
                      {order.arInvoiceNumber && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 text-[10px] font-bold flex items-center gap-1 border border-purple-500/20">
                          <Receipt className="w-3 h-3" /> AR Invoiced: {order.arInvoiceNumber}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCheckAtp(order)}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Boxes className="w-3.5 h-3.5 text-indigo-500" /> ATP Check
                      </button>

                      {order.stockReservationStatus !== 'FULLY_RESERVED' && (
                        <button
                          onClick={() => handleReserveStock(order.id)}
                          className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Boxes className="w-3.5 h-3.5" /> Reserve Stock
                        </button>
                      )}

                      {!order.arInvoiceNumber && order.status === 'FULFILLED' && (
                        <button
                          onClick={() => handleGenerateInvoice(order.id)}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Receipt className="w-3.5 h-3.5" /> Issue AR Invoice
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsTransitionModalOpen(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Sliders className="w-3.5 h-3.5" /> Transition State
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Customer</span>
                      <div className="font-bold text-slate-900 dark:text-white">{order.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Tax: {order.customerTaxNumber || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Sales Representative</span>
                      <div className="font-medium">{order.salespersonName}</div>
                      <div className="text-[10px] text-slate-400">Order Date: {order.orderDate}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Payment Terms</span>
                      <div className="font-mono font-medium">{order.paymentTermsCode} • {order.paymentMethodType}</div>
                      <div className="text-[10px] text-slate-400">Delivery: {order.requestedDeliveryDate}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Grand Total (incl. VAT 15%)</span>
                      <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                        {order.grandTotal.toLocaleString()} {order.currency}
                      </div>
                      <div className="text-[10px] text-slate-400">VAT: {order.taxTotal.toLocaleString()} SAR</div>
                    </div>
                  </div>

                  {/* Order Items Table */}
                  <div className="bg-white dark:bg-slate-900/80 rounded-xl p-3 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Order Line Items ({order.lines.length})</span>
                      <span className="font-mono text-[10px]">SHA-256 Seal: {order.sha256AuditSeal.substring(0, 24)}...</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] text-left">
                        <thead className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            <th className="pb-1">Item / SKU</th>
                            <th className="pb-1">Warehouse</th>
                            <th className="pb-1 text-center">Qty Ordered</th>
                            <th className="pb-1 text-center">Qty Reserved</th>
                            <th className="pb-1 text-right">Unit Price</th>
                            <th className="pb-1 text-right">Tax</th>
                            <th className="pb-1 text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {order.lines.map(l => (
                            <tr key={l.id} className="text-slate-700 dark:text-slate-200">
                              <td className="py-1.5 font-medium">
                                <div>{l.itemName}</div>
                                <div className="text-[10px] font-mono text-slate-400">{l.itemSku}</div>
                              </td>
                              <td className="py-1.5 font-mono text-[10px] text-slate-500">{l.warehouseName || l.warehouseId}</td>
                              <td className="py-1.5 text-center font-mono font-bold">{l.quantityOrdered}</td>
                              <td className="py-1.5 text-center font-mono text-emerald-600 font-bold">{l.quantityReserved}</td>
                              <td className="py-1.5 text-right font-mono">{l.unitPrice.toLocaleString()} SAR</td>
                              <td className="py-1.5 text-right font-mono text-slate-400">{l.taxAmount.toLocaleString()} SAR</td>
                              <td className="py-1.5 text-right font-mono font-bold text-slate-900 dark:text-white">{l.lineTotal.toLocaleString()} SAR</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Audit Trail Timeline */}
                  {order.stateTransitions && order.stateTransitions.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-[10px] text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="font-semibold text-slate-500 shrink-0">State History:</span>
                      {order.stateTransitions.map((tr, idx) => (
                        <div key={tr.id} className="flex items-center gap-1 shrink-0">
                          <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">{tr.toStatus}</span>
                          <span className="text-slate-400">by {tr.performedByName}</span>
                          {idx < order.stateTransitions.length - 1 && <span className="text-slate-300">→</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: QUOTATIONS ==================== */}
      {activeTab === 'quotations' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>{isAr ? 'عروض الأسعار والمقترحات الفنية' : 'Sales Quotations & Proposals'}</span>
              </h3>
              <button
                onClick={() => setIsNewQuotationModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Quotation</span>
              </button>
            </div>

            <div className="space-y-3">
              {quotations.map(q => (
                <div key={q.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">{q.quotationNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        q.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        q.status === 'CONVERTED_TO_ORDER' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                        q.status === 'SENT_TO_CUSTOMER' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                        'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {q.status}
                      </span>
                      {q.convertedSalesOrderNumber && (
                        <span className="text-[10px] font-mono text-purple-600 font-bold">
                          Converted: {q.convertedSalesOrderNumber}
                        </span>
                      )}
                    </div>

                    {q.status !== 'CONVERTED_TO_ORDER' && (
                      <button
                        onClick={() => handleConvertQuotation(q.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Convert to Sales Order</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Client</span>
                      <div className="font-bold text-slate-900 dark:text-white">{q.customerName}</div>
                      <div className="text-[10px] text-slate-500">{q.customerEmail}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Validity</span>
                      <div className="font-medium text-slate-700 dark:text-slate-300">Until {q.validUntil}</div>
                      <div className="text-[10px] text-slate-400">Issued: {q.issueDate}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Sales Representative</span>
                      <div className="font-medium">{q.salespersonName}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Grand Total (incl. VAT)</span>
                      <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                        {q.grandTotal.toLocaleString()} {q.currency}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 text-[11px] text-slate-500 font-mono">
                    Terms: {q.termsAndConditions}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: PRICE LISTS & TIERS ==================== */}
      {activeTab === 'pricelists' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {priceLists.map(pl => (
              <div key={pl.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{pl.name}</h4>
                      {pl.isDefault && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">{pl.code} • Currency: {pl.currency}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                    {pl.priceListType}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Item Pricing & Volume Tiers</span>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {pl.itemPrices.map(ip => (
                      <div key={ip.itemSku} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-slate-900 dark:text-white">{ip.itemName}</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">{ip.basePrice.toLocaleString()} {pl.currency}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">SKU: {ip.itemSku}</div>

                        {ip.volumeTiers && ip.volumeTiers.length > 0 && (
                          <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/60 mt-1 space-y-1">
                            <span className="text-[10px] text-indigo-500 font-bold uppercase">Volume Discounts:</span>
                            {ip.volumeTiers.map((t, idx) => (
                              <div key={idx} className="flex justify-between text-[10px] text-slate-500 font-mono">
                                <span>{t.minQuantity} - {t.maxQuantity || '∞'} units:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">{t.unitPrice.toLocaleString()} SAR ({t.discountPercent}% OFF)</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Engine Sandbox Resolver */}
          <div className="bg-indigo-50/40 dark:bg-slate-900/80 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl p-5 space-y-4">
            <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600" />
              <span>Interactive Pricing Engine Matrix Simulator</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500">Product SKU</label>
                <input
                  type="text"
                  value={sandboxSku}
                  onChange={e => setSandboxSku(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500">Purchase Quantity</label>
                <input
                  type="number"
                  value={sandboxQty}
                  onChange={e => setSandboxQty(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono mt-1"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleResolvePricingSandbox}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Resolve Unit Price
                </button>
              </div>
            </div>

            {sandboxResolvedPrice && (
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900 text-xs flex flex-wrap items-center justify-between gap-3 font-mono">
                <div>
                  <span className="text-slate-400">Resolved Unit Price: </span>
                  <span className="font-black text-emerald-600 text-sm">{sandboxResolvedPrice.resolvedUnitPrice.toLocaleString()} SAR</span>
                </div>
                <div>
                  <span className="text-slate-400">Total Pre-Tax: </span>
                  <span className="font-bold text-slate-900 dark:text-white">{(sandboxResolvedPrice.resolvedUnitPrice * sandboxQty).toLocaleString()} SAR</span>
                </div>
                <div>
                  <span className="text-slate-400">Applied Tier Discount: </span>
                  <span className="font-bold text-indigo-500">{sandboxResolvedPrice.tierDiscountPercent}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: DISCOUNTS GOVERNANCE ==================== */}
      {activeTab === 'discounts' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Percent className="w-4 h-4 text-indigo-500" />
              <span>{isAr ? 'قواعد وحوكمة الخصومات وسقوف الصلاحيات' : 'Discount Authorization & Threshold Governance'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {discountRules.map(rule => (
                <div key={rule.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{rule.name}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold">
                      {rule.discountType}
                    </span>
                  </div>
                  <div className="space-y-1.5 font-mono text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Standard Value:</span>
                      <span className="font-bold text-emerald-600">{rule.value}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Representative Ceiling:</span>
                      <span className="font-bold">{rule.maxDiscountThreshold}%</span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Supervisor Signoff Above:</span>
                      <span className="font-bold">{rule.requiresSupervisorApprovalAbove}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: PROMOTIONS & COUPONS ==================== */}
      {activeTab === 'promotions' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Gift className="w-4 h-4 text-indigo-500" />
              <span>{isAr ? 'الحملات الترويجية وقسائم الشراء' : 'Promotional Campaigns & Coupon Vouchers'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {promotions.map(p => (
                <div key={p.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold">
                      {p.type}
                    </span>
                  </div>

                  {p.couponCode && (
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-dashed border-indigo-400 text-center font-mono font-bold text-indigo-600 text-xs">
                      PROMO CODE: {p.couponCode}
                    </div>
                  )}

                  <div className="space-y-1 font-mono text-[11px] text-slate-500">
                    <div>Valid: {p.startDate} to {p.endDate}</div>
                    {p.buyQuantityRequired && <div>Rule: Buy {p.buyQuantityRequired} → Get {p.freeQuantityGranted} Free</div>}
                    {p.minCartValue && <div>Min Order: {p.minCartValue.toLocaleString()} SAR</div>}
                    <div className="text-emerald-600 font-bold">Redemptions: {p.redemptionsCount} total</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 6: RETURNS & RMA ==================== */}
      {activeTab === 'returns' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-indigo-500" />
              <span>{isAr ? 'سجل مرتجلات المبيعات وإشعارات الخصم' : 'Sales Returns & Customer Credit Notes'}</span>
            </h3>

            <div className="space-y-3">
              {returns.map(ret => (
                <div key={ret.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-rose-600">{ret.returnNumber}</span>
                      <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-[10px]">
                        {ret.returnType}
                      </span>
                    </div>
                    <span className="font-mono text-slate-400">Ref: {ret.originalDocumentNumber}</span>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <div>
                      <span>Customer: </span>
                      <span className="font-bold text-slate-900 dark:text-white">{ret.customerName}</span>
                    </div>
                    <div>
                      <span>Refund Method: </span>
                      <span className="font-mono font-bold text-emerald-600">{ret.refundMethod}</span>
                    </div>
                    <div className="font-mono font-bold text-rose-600">
                      Total Refund: {ret.refundGrandTotal.toLocaleString()} SAR
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 7: ANALYTICS & BI ==================== */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <span>Sales Revenue by Channel Breakdown</span>
              </h4>
              <div className="space-y-3">
                {analytics.salesByChannel.map((ch: any) => (
                  <div key={ch.channel} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{ch.channel === 'ENTERPRISE_B2B' ? 'Enterprise B2B Contracts' : 'Retail Point of Sale (POS)'}</span>
                      <span className="font-mono font-bold">{ch.amount.toLocaleString()} SAR ({ch.percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${ch.channel === 'ENTERPRISE_B2B' ? 'bg-indigo-600' : 'bg-teal-500'}`}
                        style={{ width: `${ch.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-500" />
                <span>Top Selling Products & Revenue Drivers</span>
              </h4>
              <div className="space-y-2">
                {analytics.topSellingProducts.map((p: any) => (
                  <div key={p.sku} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{p.sku} • {p.quantitySold} units sold</div>
                    </div>
                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {p.revenue.toLocaleString()} SAR
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB: MOBILE FIELD SALES & VAN ==================== */}
      {activeTab === 'mobile_sales' && (
        <MobileSalesTab isAr={isAr} onNotify={showNotification} />
      )}

      {/* ==================== TAB: SYNC CENTER & DEVICES ==================== */}
      {activeTab === 'sync_center' && (
        <SyncCenterTab isAr={isAr} onNotify={showNotification} />
      )}

      {/* ==================== TAB: CONFLICT RESOLUTION ==================== */}
      {activeTab === 'conflicts' && (
        <ConflictResolutionTab isAr={isAr} onNotify={showNotification} />
      )}

      {/* ==================== TAB: QUARANTINE & RECOVERY ==================== */}
      {activeTab === 'recovery' && (
        <RecoveryCenterTab isAr={isAr} onNotify={showNotification} />
      )}

      {/* ==================== TAB: INDUSTRY VERTICAL CONFIG ==================== */}
      {activeTab === 'industry_config' && (
        <IndustryConfigTab isAr={isAr} onNotify={showNotification} />
      )}

      {/* ==================== TAB: STATUTORY COMPLIANCE ==================== */}
      {activeTab === 'compliance' && (
        <ComplianceAdapterTab isAr={isAr} onNotify={showNotification} />
      )}

      {/* ==================== TAB: UNIVERSAL DATA EXPORT ==================== */}
      {activeTab === 'export' && (
        <UniversalExportTab isAr={isAr} onNotify={showNotification} />
      )}

      {/* ==================== TAB: 20-SCENARIO HARDENING TEST SUITE ==================== */}
      {activeTab === 'testing' && (
        <HardeningTestSuiteTab isAr={isAr} onNotify={showNotification} />
      )}

      {/* ==================== STATE TRANSITION MODAL ==================== */}
      {isTransitionModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  <span>Transition Order State</span>
                </h3>
                <span className="font-mono text-xs text-indigo-600">{selectedOrder.orderNumber} (Current: {selectedOrder.status})</span>
              </div>
              <button onClick={() => setIsTransitionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Select Target State</label>
                <select
                  value={targetStatus}
                  onChange={e => setTargetStatus(e.target.value as SalesOrderStatus)}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="ON_HOLD">ON_HOLD</option>
                  <option value="PARTIALLY_FULFILLED">PARTIALLY_FULFILLED</option>
                  <option value="FULFILLED">FULFILLED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              {targetStatus === 'ON_HOLD' && (
                <div>
                  <label className="text-xs font-semibold text-slate-500">Hold Reason</label>
                  <input
                    type="text"
                    value={holdReason}
                    onChange={e => setHoldReason(e.target.value)}
                    placeholder="e.g., Credit limit breach or inventory re-verification"
                    className="w-full mt-1 p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500">Transition Justification / Reason</label>
                <textarea
                  value={transitionReason}
                  onChange={e => setTransitionReason(e.target.value)}
                  placeholder="Enter business approval or logistics dispatch notes..."
                  rows={3}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Deterministic SHA-256 Audit Seal</span>
                </div>
                <div>A cryptographically verifiable audit record will be permanently appended to the Sales Order ledger.</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsTransitionModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteTransition}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Execute Transition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ATP MODAL ==================== */}
      {isAtpModalOpen && atpData && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-teal-600" />
                  <span>Available-To-Promise (ATP) Analysis</span>
                </h3>
                <span className="font-mono text-xs text-slate-500">Order: {atpData.orderNumber}</span>
              </div>
              <button onClick={() => setIsAtpModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {atpData.lines.map((l: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-900 dark:text-white">{l.itemName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${l.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {l.isAvailable ? 'READY TO PROMISE' : 'SHORTAGE'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Ordered</span>
                      <span className="font-bold">{l.quantityOrdered}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Current ATP</span>
                      <span className="font-bold text-teal-600">{l.atpQuantity}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Reserved</span>
                      <span className="font-bold">{l.stockBreakdown.reserved}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsAtpModalOpen(false)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CREATE QUOTATION MODAL ==================== */}
      {isNewQuotationModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>Issue New Sales Quotation</span>
                </h3>
                <span className="text-xs text-slate-400">Sequential QT-2026-XXXX generation</span>
              </div>
              <button onClick={() => setIsNewQuotationModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-500">Customer Name</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-500">Product Line</label>
                <select
                  value={newCustSku}
                  onChange={e => {
                    setNewCustSku(e.target.value);
                    if (e.target.value === 'SW-ERP-USR') setNewCustPrice(11000);
                    else setNewCustPrice(26000);
                  }}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="SW-ERP-USR">AM Enterprise ERP License (SW-ERP-USR)</option>
                  <option value="HW-SRV-RACK">Dell PowerEdge R750 Server (HW-SRV-RACK)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-500">Quantity</label>
                  <input
                    type="number"
                    value={newCustQty}
                    onChange={e => setNewCustQty(Number(e.target.value))}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-500">Unit Price (SAR)</label>
                  <input
                    type="number"
                    value={newCustPrice}
                    onChange={e => setNewCustPrice(Number(e.target.value))}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              {(() => {
                const taxRes = TaxEngine.resolveTaxRate({
                  countryOrJurisdiction: activeCompany?.countryCode || 'SA'
                });
                const lineCalc = TaxEngine.calculateLineTax({
                  quantity: newCustQty,
                  unitPrice: newCustPrice,
                  taxRate: taxRes.taxRate
                });
                return (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono space-y-1">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal:</span>
                      <span>{lineCalc.taxableAmount.toLocaleString()} SAR</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>VAT ({Math.round(taxRes.taxRate * 100)}%):</span>
                      <span>{lineCalc.taxAmount.toLocaleString()} SAR</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span>Grand Total:</span>
                      <span className="text-emerald-600">{lineCalc.grossAmount.toLocaleString()} SAR</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsNewQuotationModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuotation}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Create Quotation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
