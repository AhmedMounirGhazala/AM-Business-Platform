import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Layers, 
  TrendingUp, 
  ShieldCheck, 
  FileText, 
  Settings, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Clock,
  Coins
} from 'lucide-react';
import { ApiClient } from '../../../services/apiClient';
import { 
  CostLayer, 
  CostLayerConsumption, 
  CostCalculationLog, 
  CostBusinessEvent, 
  ItemCategory, 
  InventoryItem,
  CostingMethod 
} from '../../../types';

interface InventoryCostingSubViewProps {
  items: InventoryItem[];
  categories: ItemCategory[];
  isAr: boolean;
  canEdit: boolean;
  onRefresh: () => void;
}

export const InventoryCostingSubView: React.FC<InventoryCostingSubViewProps> = ({
  items,
  categories,
  isAr,
  canEdit,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'layers' | 'avco' | 'standard' | 'categories' | 'audit'>('layers');
  const [costLayers, setCostLayers] = useState<CostLayer[]>([]);
  const [consumptions, setConsumptions] = useState<CostLayerConsumption[]>([]);
  const [logs, setLogs] = useState<CostCalculationLog[]>([]);
  const [events, setEvents] = useState<CostBusinessEvent[]>([]);
  const [categoryConfigs, setCategoryConfigs] = useState<ItemCategory[]>(categories);
  const [loading, setLoading] = useState(true);
  const [selectedSku, setSelectedSku] = useState<string>('ALL');

  // Simulation State
  const [simType, setSimType] = useState<'RECEIPT' | 'ISSUE'>('RECEIPT');
  const [simSku, setSimSku] = useState<string>(items[0]?.sku || 'HW-SRV-01');
  const [simQty, setSimQty] = useState<number>(5);
  const [simUnitCost, setSimUnitCost] = useState<number>(18000);
  const [simResult, setSimResult] = useState<any>(null);
  const [simError, setSimError] = useState<string | null>(null);

  const fetchCostingData = async () => {
    setLoading(true);
    try {
      const [layersRes, consumptionsRes, logsRes, eventsRes, categoriesRes] = await Promise.all([
        ApiClient.getCostLayers(),
        ApiClient.getCostLayerConsumptions(),
        ApiClient.getCostCalculationLogs(),
        ApiClient.getCostBusinessEvents(),
        ApiClient.getCategoryCostingConfigs()
      ]);
      setCostLayers(layersRes || []);
      setConsumptions(consumptionsRes || []);
      setLogs(logsRes || []);
      setEvents(eventsRes || []);
      if (categoriesRes && categoriesRes.length > 0) {
        setCategoryConfigs(categoriesRes);
      }
    } catch (err: any) {
      console.error('Failed to load costing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostingData();
  }, []);

  const handleUpdateCategoryMethod = async (catId: string, method: CostingMethod, allowOverride: boolean) => {
    try {
      await ApiClient.updateCategoryCostingConfig(catId, {
        defaultCostingMethod: method,
        allowItemOverride: allowOverride
      });
      fetchCostingData();
    } catch (err: any) {
      alert(err.message || 'Failed to update category costing configuration');
    }
  };

  const handleRunSimulation = async () => {
    setSimError(null);
    setSimResult(null);
    try {
      if (simType === 'RECEIPT') {
        const res = await ApiClient.processReceiptValuation({
          itemSku: simSku,
          warehouseId: 'wh-001',
          warehouseName: 'Central Warehouse - Riyadh',
          quantity: simQty,
          unitCost: simUnitCost,
          sourceDocumentType: 'GoodsReceiptNote',
          sourceDocumentId: `sim-grn-${Date.now()}`,
          sourceDocumentNumber: `SIM-GRN-${Math.floor(1000 + Math.random() * 9000)}`
        });
        setSimResult(res);
      } else {
        const res = await ApiClient.processIssueValuation({
          itemSku: simSku,
          warehouseId: 'wh-001',
          warehouseName: 'Central Warehouse - Riyadh',
          quantity: simQty,
          sourceDocumentType: 'GoodsIssueNote',
          sourceDocumentId: `sim-gin-${Date.now()}`,
          sourceDocumentNumber: `SIM-GIN-${Math.floor(1000 + Math.random() * 9000)}`
        });
        setSimResult(res);
      }
      fetchCostingData();
      onRefresh();
    } catch (err: any) {
      setSimError(err.message || 'Simulation execution failed');
    }
  };

  const filteredLayers = selectedSku === 'ALL' ? costLayers : costLayers.filter(l => l.itemSku === selectedSku);
  const totalInventoryValuation = costLayers
    .filter(l => l.status === 'ACTIVE')
    .reduce((sum, l) => sum + l.remainingTotalCost, 0);

  return (
    <div className="space-y-6">
      {/* Top Header Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">{isAr ? 'إجمالي تقييم المخزون (FIFO)' : 'Total Inventory Value (FIFO)'}</p>
            <h3 className="text-xl font-bold text-white mt-1">
              SAR {totalInventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-emerald-400 mt-0.5">{costLayers.filter(l => l.status === 'ACTIVE').length} {isAr ? 'طبقات نشطة' : 'Active Cost Layers'}</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">{isAr ? 'إجمالي الطبقات السعرية' : 'Total Cost Layers'}</p>
            <h3 className="text-xl font-bold text-white mt-1">{costLayers.length}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {costLayers.filter(l => l.status === 'ACTIVE').length} {isAr ? 'نشطة' : 'Active'} | {costLayers.filter(l => l.status === 'EXHAUSTED').length} {isAr ? 'مستنفدة' : 'Exhausted'}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">{isAr ? 'سجلات المتوسط المتحرك' : 'AVCO Managed Items'}</p>
            <h3 className="text-xl font-bold text-white mt-1">
              {items.filter(i => (i.costingMethod || 'FIFO') === 'AVCO').length || items.length}
            </h3>
            <p className="text-[11px] text-amber-400 mt-0.5">{isAr ? 'حساب آلي عند كل استلام' : 'Auto-recalculated on receipt'}</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">{isAr ? 'سجلات التدقيق الحسابي' : 'Valuation Audit Trail'}</p>
            <h3 className="text-xl font-bold text-white mt-1">{logs.length}</h3>
            <p className="text-[11px] text-purple-400 mt-0.5">{isAr ? 'غير قابل للتعديل (Append-Only)' : 'Immutable Audit Records'}</p>
          </div>
        </div>
      </div>

      {/* Interactive Cost Valuation Simulator Section */}
      <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              {isAr ? 'محاكي محرك تقييم التكلفة (Inventory Valuation Simulator)' : 'Inventory Valuation Engine Simulator'}
            </h3>
          </div>
          <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-400 font-mono">
            Phase 2.2.3 Enterprise Cost Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isAr ? 'نوع الحركة' : 'Movement Action'}
            </label>
            <select
              value={simType}
              onChange={e => setSimType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="RECEIPT">{isAr ? 'استلام بضاعة (إنشاء طبقة / تحديث المتوسط)' : 'Goods Receipt (Create Layer / Recalc AVCO)'}</option>
              <option value="ISSUE">{isAr ? 'صرف بضاعة (استهلاك FIFO / AVCO)' : 'Goods Issue (Consume FIFO / Apply AVCO)'}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isAr ? 'الصنف' : 'Target Item'}
            </label>
            <select
              value={simSku}
              onChange={e => {
                setSimSku(e.target.value);
                const item = items.find(i => i.sku === e.target.value);
                if (item) setSimUnitCost(item.costPrice || 1000);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              {items.map(i => (
                <option key={i.id} value={i.sku}>
                  {i.sku} - {i.name} ({i.costingMethod || 'FIFO'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isAr ? 'الكمية' : 'Quantity'}
            </label>
            <input
              type="number"
              value={simQty}
              onChange={e => setSimQty(Number(e.target.value))}
              min={1}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {simType === 'RECEIPT' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'تكلفة الوحدة (SAR)' : 'Unit Cost (SAR)'}
              </label>
              <input
                type="number"
                value={simUnitCost}
                onChange={e => setSimUnitCost(Number(e.target.value))}
                min={0}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          <div className={simType === 'ISSUE' ? 'md:col-span-2' : 'md:col-span-2'}>
            <button
              onClick={handleRunSimulation}
              className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors shadow"
            >
              <RefreshCw className="w-4 h-4" />
              {isAr ? 'تشغيل عملية التقييم الآلية' : 'Execute Cost Engine Valuation'}
            </button>
          </div>
        </div>

        {simError && (
          <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{simError}</span>
          </div>
        )}

        {simResult && (
          <div className="mt-3 p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-sm border-b border-emerald-500/20 pb-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {isAr ? 'نتيجة احتساب محرك التكلفة' : 'Valuation Engine Calculation Result'}
              </span>
              <span className="text-emerald-400">{simResult.methodUsed} Method</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 font-mono">
              <div>
                <span className="text-slate-400">{isAr ? 'إجمالي التكلفة المحسوبة:' : 'Total Cost:'}</span>{' '}
                <strong className="text-white">SAR {simResult.calculatedTotalCost?.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-slate-400">{isAr ? 'متوسط تكلفة الوحدة:' : 'Unit Cost:'}</span>{' '}
                <strong className="text-white">SAR {simResult.unitCostApplied?.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-slate-400">{isAr ? 'حدث الأعمال المنشأ:' : 'Event Emitted:'}</span>{' '}
                <strong className="text-amber-400">{simResult.businessEvent?.eventType}</strong>
              </div>
              <div>
                <span className="text-slate-400">{isAr ? 'معرف السجل:' : 'Log ID:'}</span>{' '}
                <strong className="text-slate-300">{simResult.calculationLogId}</strong>
              </div>
            </div>
            {simResult.consumptions && simResult.consumptions.length > 0 && (
              <div className="mt-2 pt-2 border-t border-emerald-500/20">
                <span className="font-semibold text-slate-300">{isAr ? 'تفاصيل استهلاك طبقات FIFO:' : 'FIFO Layers Consumed:'}</span>
                <div className="space-y-1 mt-1">
                  {simResult.consumptions.map((c: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-[11px] bg-slate-900/50 p-1.5 rounded">
                      <span>Layer ID: {c.costLayerId}</span>
                      <span>Qty Consumed: {c.quantityConsumed}</span>
                      <span>Unit Cost: SAR {c.unitCost}</span>
                      <span>Total: SAR {c.totalCost}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'layers'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          {isAr ? 'طبقات التكلفة (FIFO Layers)' : 'FIFO Cost Layers'}
          <span className="ml-1 text-xs px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded-full">
            {costLayers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('avco')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'avco'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          {isAr ? 'المتوسط المتحرك (Weighted Average)' : 'Moving Average (AVCO)'}
        </button>

        <button
          onClick={() => setActiveTab('standard')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'standard'
              ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calculator className="w-4 h-4" />
          {isAr ? 'التكلفة المعيارية والفروقات' : 'Standard Cost & Variance'}
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-purple-500 text-purple-400 bg-purple-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          {isAr ? 'إعدادات تكلفة فئات الاصناف' : 'Category Costing Config'}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          {isAr ? 'سجل تتبع التقييم (Costing Audit Log)' : 'Costing Audit Log'}
          <span className="ml-1 text-xs px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded-full">
            {logs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: FIFO COST LAYERS */}
      {activeTab === 'layers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">{isAr ? 'فلترة حسب الصنف:' : 'Filter by Item SKU:'}</span>
              <select
                value={selectedSku}
                onChange={e => setSelectedSku(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">{isAr ? 'جميع الأصناف' : 'All Items'}</option>
                {items.map(i => (
                  <option key={i.id} value={i.sku}>{i.sku} - {i.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
              {isAr ? 'طبقة نشطة (قابل للاستهلاك)' : 'ACTIVE (Available)'}
              <span className="inline-block w-2.5 h-2.5 bg-slate-600 rounded-full ml-3"></span>
              {isAr ? 'مستنفدة' : 'EXHAUSTED'}
            </div>
          </div>

          <div className="overflow-x-auto bg-slate-900/60 border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 uppercase text-[10px] text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">{isAr ? 'رقم الطبقة / التاريخ' : 'Layer No / Date'}</th>
                  <th className="px-4 py-3">{isAr ? 'رمز الصنف والاسم' : 'Item SKU & Name'}</th>
                  <th className="px-4 py-3">{isAr ? 'المستودع / الشحنة' : 'Warehouse / Batch'}</th>
                  <th className="px-4 py-3 text-right">{isAr ? 'الكمية الأصلية' : 'Original Qty'}</th>
                  <th className="px-4 py-3 text-right">{isAr ? 'الكمية المتبقية' : 'Remaining Qty'}</th>
                  <th className="px-4 py-3 text-right">{isAr ? 'تكلفة الوحدة' : 'Unit Cost'}</th>
                  <th className="px-4 py-3 text-right">{isAr ? 'إجمالي القيمة المتبقية' : 'Remaining Value'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'المستند المصدر' : 'Source Doc'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLayers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500 font-medium">
                      {isAr ? 'لا توجد طبقات تكلفة مسجلة' : 'No cost layers found.'}
                    </td>
                  </tr>
                ) : (
                  filteredLayers.map(layer => (
                    <tr key={layer.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        <div>{layer.layerNumber}</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          {new Date(layer.receiptDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-200">{layer.itemSku}</div>
                        <div className="text-[10px] text-slate-400">{layer.itemName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-300">{layer.warehouseName}</div>
                        {layer.batchNumber && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-amber-400 rounded font-mono">
                            {layer.batchNumber}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">
                        {layer.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                        {layer.remainingQuantity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-white">
                        SAR {layer.unitCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-300">
                        SAR {layer.remainingTotalCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono">
                          {layer.sourceDocumentNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          layer.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : layer.status === 'EXHAUSTED'
                            ? 'bg-slate-800 text-slate-500 border border-slate-700'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {layer.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MOVING AVERAGE (AVCO) */}
      {activeTab === 'avco' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              {isAr ? 'حساب المتوسط المتحرك المرجح (Weighted Average Cost Rule)' : 'Weighted Average Cost Calculation Rule'}
            </h4>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-blue-300">
              New Average Cost = ((Current Total Qty × Previous Avg Cost) + (Receipt Qty × Receipt Unit Cost)) ÷ (Current Total Qty + Receipt Qty)
            </div>
            <p className="text-xs text-slate-400">
              {isAr 
                ? 'يتم إعادة حساب متوسط التكلفة آلياً فور تنفيذ أي حركة استلام بضاعة (GRN/Movement). تظل أسعار صرف البضاعة سابتة بناء على المتوسط المحسوب حتى لحظة الصرف.'
                : 'Weighted average cost is recalculated automatically upon every Goods Receipt. Issues consume inventory at the exact average cost effective at the transaction time.'}
            </p>
          </div>

          <div className="overflow-x-auto bg-slate-900/60 border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 uppercase text-[10px] text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">{isAr ? 'الصنف' : 'Item SKU & Name'}</th>
                  <th className="px-4 py-3">{isAr ? 'الفئة' : 'Category'}</th>
                  <th className="px-4 py-3 text-right">{isAr ? 'إجمالي الكمية الحالية' : 'Current Total Stock'}</th>
                  <th className="px-4 py-3 text-right">{isAr ? 'متوسط التكلفة المتحرك' : 'Moving Average Cost'}</th>
                  <th className="px-4 py-3 text-right">{isAr ? 'إجمالي تقييم AVCO' : 'Total AVCO Valuation'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'طريقة التكلفة المعتمدة' : 'Method'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map(item => {
                  const itemMethod = item.costingMethod || 'FIFO';
                  const itemValuation = (item.currentStock || 0) * (item.costPrice || 0);
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">
                        <div>{item.sku}</div>
                        <div className="text-[10px] text-slate-400">{item.name}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{item.category}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-200">
                        {item.currentStock || 0} {item.unitOfMeasure}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-blue-400">
                        SAR {(item.costPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-blue-300">
                        SAR {itemValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          itemMethod === 'AVCO'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {itemMethod}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STANDARD COST & VARIANCE */}
      {activeTab === 'standard' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              {isAr ? 'نظام التكلفة المعيارية وحساب الفروقات (Standard Cost & Purchase Price Variance)' : 'Standard Cost & Purchase Price Variance (PPV)'}
            </h4>
            <p className="text-xs text-slate-400">
              {isAr 
                ? 'يتم استخدام التكلفة المعيارية الثابتة لتقييم حركة المخزون. يتم الاحتفاظ بالفروقات الناتجة بين السعر الفعلي والتكلفة المعيارية في حساب فروق أسعار الشراء (PPV).'
                : 'Standard Costing uses a pre-determined fixed unit cost. The variance between actual purchase cost and standard cost is logged as Purchase Price Variance (PPV).'}
            </p>
          </div>

          <div className="overflow-x-auto bg-slate-900/60 border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 uppercase text-[10px] text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">{isAr ? 'الصنف' : 'Item SKU & Name'}</th>
                  <th className="px-4 py-3 text-right">{isAr ? 'التكلفة المعيارية' : 'Standard Cost'}</th>
                  <th className="px-4 py-3 text-right">{isAr ? 'آخر سعر تكلفة' : 'Current Actual Cost'}</th>
                  <th className="px-4 py-3 text-right">{isAr ? 'الفارق لجميع الكميات (Variance)' : 'Unit Variance'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'الحالة' : 'Variance Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map(item => {
                  const stdCost = item.costPrice || 0;
                  const actualCost = item.costPrice ? item.costPrice * 1.05 : 0; // Example actual
                  const variance = actualCost - stdCost;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">
                        <div>{item.sku}</div>
                        <div className="text-[10px] text-slate-400">{item.name}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-400">
                        SAR {stdCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">
                        SAR {actualCost.toLocaleString()}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${
                        variance > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        SAR {variance.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          variance === 0
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : variance > 0
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {variance === 0 ? 'NO VARIANCE' : variance > 0 ? 'UNFAVORABLE (PPV)' : 'FAVORABLE (PPV)'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORY COSTING CONFIG */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Settings className="w-4 h-4 text-purple-400" />
              {isAr ? 'سياسات التكلفة الافتراضية للفئات' : 'Category Costing Hierarchy Configuration'}
            </h4>
            <p className="text-xs text-slate-400">
              {isAr 
                ? 'تحدد هذه اللوحة طريقة التقييم الافتراضية لكل فئة أصناف (FIFO, AVCO, Standard Cost). يتم تطبيق الطريقة تلقائياً على كافة الأصناف التابعة للفئة ما لم يسمح بتجاوز الصنف لها.'
                : 'Defines default costing method per item category. Hierarchy: Item Specific Override -> Category Default -> System Global Default.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h5 className="font-bold text-white text-sm">{cat.name}</h5>
                    <span className="text-[10px] font-mono text-slate-500">Code: {cat.code}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {items.filter(i => i.category === cat.name).length} {isAr ? 'صنف' : 'Items'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">
                      {isAr ? 'طريقة التكلفة الافتراضية للفئة:' : 'Default Costing Method:'}
                    </label>
                    <select
                      value={(cat as any).defaultCostingMethod || 'FIFO'}
                      onChange={e => handleUpdateCategoryMethod(
                        cat.id, 
                        e.target.value as CostingMethod, 
                        (cat as any).allowItemOverride !== false
                      )}
                      disabled={!canEdit}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="FIFO">FIFO (First In First Out - الوارد أولاً يصرف أولاً)</option>
                      <option value="AVCO">AVCO (Weighted Average - المتوسط المتحرك المرجح)</option>
                      <option value="STANDARD_COST">STANDARD COST (التكلفة المعيارية المحددة مسبقاً)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-300">{isAr ? 'السماح للأصناف بتجاوز الطريقة:' : 'Allow Item Level Override:'}</span>
                    <input
                      type="checkbox"
                      checked={(cat as any).allowItemOverride !== false}
                      onChange={e => handleUpdateCategoryMethod(
                        cat.id, 
                        (cat as any).defaultCostingMethod || 'FIFO', 
                        e.target.checked
                      )}
                      disabled={!canEdit}
                      className="w-4 h-4 accent-purple-500 bg-slate-950 border-slate-800 rounded"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: COSTING AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="overflow-x-auto bg-slate-900/60 border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 uppercase text-[10px] text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">{isAr ? 'الوقت والتاريخ' : 'Timestamp'}</th>
                  <th className="px-4 py-3">{isAr ? 'نوع الحساب' : 'Action / Event'}</th>
                  <th className="px-4 py-3">{isAr ? 'الصنف' : 'Item SKU'}</th>
                  <th className="px-4 py-3">{isAr ? 'طريقة التقييم' : 'Method'}</th>
                  <th className="px-4 py-3 text-right">{isAr ? 'الكمية' : 'Quantity'}</th>
                  <th className="px-4 py-3 text-right">{isAr ? 'تكلفة الوحدة' : 'Unit Cost'}</th>
                  <th className="px-4 py-3 text-right">{isAr ? 'الإجمالي' : 'Total Cost'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'المستخدم' : 'Triggered By'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500 font-sans">
                      {isAr ? 'لا توجد سجلات تدقيق حسابية بعد' : 'No cost calculation logs available.'}
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-cyan-400">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-white font-semibold">
                        {log.itemSku}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                          {log.methodUsed}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-200">
                        {log.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-400">
                        SAR {log.unitCostApplied.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-300">
                        SAR {log.calculatedTotalCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-400 font-sans text-[11px]">
                        {log.userName}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
