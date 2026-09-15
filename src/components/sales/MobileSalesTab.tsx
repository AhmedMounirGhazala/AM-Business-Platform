/**
 * AM Business Platform - Phase 3.1 Mobile Field Sales Workspace
 * Architecture Baseline: v2.8
 * Van Sales & Direct Store Delivery (DSD), cached catalog & customer balances, field order entry, and rep quotas.
 */

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Truck,
  Users,
  Boxes,
  Target,
  MapPin,
  CheckCircle2,
  Plus,
  DollarSign,
  TrendingUp,
  Award,
  Search,
  Zap,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  MobileCustomerSnapshot,
  MobileProductAvailabilitySnapshot,
  SalesRepresentativeTarget,
  SalesRepresentativeActivity
} from '../../types/sales';
import { TaxEngine } from '../../engine/taxEngine';

interface MobileSalesTabProps {
  isAr: boolean;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const MobileSalesTab: React.FC<MobileSalesTabProps> = ({ isAr, onNotify }) => {
  const [customers, setCustomers] = useState<MobileCustomerSnapshot[]>([]);
  const [products, setProducts] = useState<MobileProductAvailabilitySnapshot[]>([]);
  const [targets, setTargets] = useState<SalesRepresentativeTarget[]>([]);
  const [activities, setActivities] = useState<SalesRepresentativeActivity[]>([]);
  const [loading, setLoading] = useState(false);

  // Field Activity Modal
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [actType, setActType] = useState<'VISIT_CHECKIN' | 'PAYMENT_COLLECTION' | 'ORDER_BOOKING' | 'STOCK_AUDIT'>('VISIT_CHECKIN');
  const [actCust, setActCust] = useState('Al-Mansoor Trading Est');
  const [actNotes, setActNotes] = useState('');

  // Quick Order Modal
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [orderCustId, setOrderCustId] = useState('cust-101');
  const [orderProductSku, setOrderProductSku] = useState('SW-ERP-USR');
  const [orderQty, setOrderQty] = useState(5);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, pRes, tRes, aRes] = await Promise.all([
        fetch('/api/v1/sales/mobile/customers').then(r => r.json()),
        fetch('/api/v1/sales/mobile/products').then(r => r.json()),
        fetch('/api/v1/sales/mobile/targets').then(r => r.json()),
        fetch('/api/v1/sales/mobile/activities').then(r => r.json())
      ]);

      if (cRes.success) setCustomers(cRes.customers);
      if (pRes.success) setProducts(pRes.products);
      if (tRes.success) setTargets(tRes.targets);
      if (aRes.success) setActivities(aRes.activities);
    } catch (err) {
      onNotify('Failed to load mobile sales data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordActivity = async () => {
    try {
      const res = await fetch('/api/v1/sales/mobile/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: actType,
          customerName: actCust,
          notes: actNotes || 'Routine on-field customer visit logged',
          location: { latitude: 24.7136, longitude: 46.6753, address: 'King Fahd Road, Riyadh' }
        })
      });
      const data = await res.json();
      if (data.success) {
        onNotify(isAr ? 'تم تسجيل النشاط الميداني بنجاح مع إحداثيات GPS' : 'Field activity recorded with GPS location tag!');
        setIsActivityModalOpen(false);
        setActNotes('');
        loadData();
      }
    } catch (err) {
      onNotify('Failed to record field activity', 'error');
    }
  };

  const handleCreateFieldOrder = async () => {
    const prod = products.find(p => p.sku === orderProductSku) || products[0];
    const cust = customers.find(c => c.id === orderCustId) || customers[0];
    const lineTotal = prod.price * orderQty;

    try {
      const taxRes = TaxEngine.resolveTaxRate({ countryOrJurisdiction: 'SA' });
      const lineCalc = TaxEngine.calculateLineTax({
        quantity: orderQty,
        unitPrice: prod.price,
        taxRate: taxRes.taxRate
      });
      const res = await fetch('/api/v1/sales/sync/queue/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'dev-pos-02',
          transactionType: 'CUSTOMER_ORDER',
          userName: 'Tariq Al-Mansoor',
          userId: 'usr-002',
          payload: {
            customerId: cust.id,
            customerName: cust.name,
            grandTotal: lineCalc.grossAmount,
            subtotal: lineCalc.taxableAmount,
            taxTotal: lineCalc.taxAmount,
            lines: [{
              itemSku: prod.sku,
              itemName: prod.name,
              quantityOrdered: orderQty,
              unitPrice: prod.price,
              taxCode: taxRes.taxCode,
              taxRate: taxRes.taxRate,
              taxAmount: lineCalc.taxAmount,
              lineTotal: lineCalc.grossAmount
            }]
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        onNotify(isAr ? `تم حفظ أمر البيع الميداني ${data.queueItem.tempDocumentNumber} محلياً في وضع عدم الاتصال` : `Field Sales Order ${data.queueItem.tempDocumentNumber} booked in offline mode!`);
        setIsQuickOrderOpen(false);
      }
    } catch (err) {
      onNotify('Failed to book field order', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>{isAr ? 'منظومة مبيعات الفانات والمندوبين الميدانيين (Van Sales & DSD)' : 'Mobile Field Sales & Van Sales Workspace'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'الكتالوج المحلي غير المتصل، أرصدة العملاء وسقوف الائتمان، تسجيل الزيارات ونقاط البيع المتنقلة'
              : 'Direct Store Delivery (DSD), offline product availability cache, customer credit checks & rep performance tracking.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsActivityModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
          >
            <MapPin className="w-4 h-4 text-rose-500" />
            <span>{isAr ? 'تسجيل زيارة ميدانية' : 'Log Field Visit'}</span>
          </button>

          <button
            onClick={() => setIsQuickOrderOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'أمر بيع متنقل (Van Order)' : 'Book Field Order'}</span>
          </button>
        </div>
      </div>

      {/* Rep Targets & Quota Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {targets.map(tar => (
          <div key={tar.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{tar.salesRepName}</h3>
                  <div className="text-[11px] text-slate-400 font-mono">{tar.period} Quota Performance</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold font-mono text-xs">
                {tar.targetAchievementPercent}% Achieved
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, tar.targetAchievementPercent)}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Target</span>
                <div className="font-bold font-mono text-slate-800 dark:text-slate-200">{tar.monthlyTargetSales.toLocaleString()} SAR</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Actual</span>
                <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{tar.actualSalesClosed.toLocaleString()} SAR</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Visits</span>
                <div className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{tar.visitsCompleted} / {tar.plannedVisits}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid: Cached Customers & Cached Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offline Customers Snapshot */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>{isAr ? 'سجل العملاء المحلي المحفوظ (Offline Snapshots)' : 'Cached Customer Credit & Balances'}</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{customers.length} Cached</span>
          </div>

          <div className="space-y-3">
            {customers.map(cust => (
              <div key={cust.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{cust.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">Limit: {cust.creditLimit.toLocaleString()} SAR • {cust.paymentTerms}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">{cust.outstandingBalance.toLocaleString()} SAR</div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    cust.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                  }`}>
                    {cust.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Offline Product Catalog Snapshot */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-500" />
              <span>{isAr ? 'كتالوج المنتجات ومخزون الفان المتنقل (Van Stock)' : 'Van Stock & Local Catalog Cache'}</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{products.length} Products</span>
          </div>

          <div className="space-y-3">
            {products.map(prod => (
              <div key={prod.sku} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{prod.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">SKU: {prod.sku}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">{prod.price.toLocaleString()} SAR</div>
                  <div className="text-[10px] font-mono text-slate-500">Available: <span className="font-bold text-emerald-600">{prod.availableStock}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Field Activity Logs */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MapPin className="w-4 h-4 text-rose-500" />
          <span>{isAr ? 'سجل الزيارات والأنشطة الميدانية الحديثة' : 'Recent GPS Field Activities & Check-ins'}</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Sales Rep</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Activity Type</th>
                <th className="py-2.5 px-3">Location Tag</th>
                <th className="py-2.5 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {activities.map(act => (
                <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-mono text-slate-500">{new Date(act.timestamp).toLocaleTimeString()}</td>
                  <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">{act.salesRepName}</td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{act.customerName}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 font-mono text-[10px] font-bold">
                      {act.activityType}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{act.location?.address || 'GPS Verified'}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{act.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Field Visit */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'تسجيل زيارة ميدانية لمندوب المبيعات' : 'Record Field Visit & GPS Check-in'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Activity Type</label>
                <select
                  value={actType}
                  onChange={e => setActType(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-indigo-500"
                >
                  <option value="VISIT_CHECKIN">Visit & Route Check-in</option>
                  <option value="PAYMENT_COLLECTION">Payment / Cash Collection</option>
                  <option value="ORDER_BOOKING">Direct Order Booking</option>
                  <option value="STOCK_AUDIT">Customer Shelf Stock Audit</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Customer Account</label>
                <select
                  value={actCust}
                  onChange={e => setActCust(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-indigo-500"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Visit Summary Notes</label>
                <textarea
                  value={actNotes}
                  onChange={e => setActNotes(e.target.value)}
                  placeholder="e.g. Discussed Q4 contract renewal and inspected store display."
                  rows={3}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordActivity}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
              >
                Record Visit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Order */}
      {isQuickOrderOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'حجز أمر بيع فانات متنقل (Van Sales Order)' : 'Book Van Direct Store Order'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Customer Account</label>
                <select
                  value={orderCustId}
                  onChange={e => setOrderCustId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-indigo-500"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (Limit: {c.creditLimit} SAR)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Product Item</label>
                <select
                  value={orderProductSku}
                  onChange={e => setOrderProductSku(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-indigo-500"
                >
                  {products.map(p => (
                    <option key={p.sku} value={p.sku}>{p.name} ({p.price} SAR)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Order Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={orderQty}
                  onChange={e => setOrderQty(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium font-mono focus:outline-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsQuickOrderOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFieldOrder}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
              >
                Book Offline Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
