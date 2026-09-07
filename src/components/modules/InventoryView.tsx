/**
 * AM Business Platform - Phase 2.1 Inventory Foundation
 * Complete ERP Architecture: Item Master, Categories, Groups, Brands, Models,
 * Units of Measure & Conversions, Packaging Units, Barcode Engine, SKU Generator,
 * Multi-Warehouse, Zones, Bin Locations, Batch/Lot Tracking, Serial Numbers, Traceability,
 * Stock Quant Engine (Single Source of Truth), Financial Event Triggering & Perpetual GL.
 */

import React, { useEffect, useState } from 'react';
import { 
  Package, 
  PlusCircle, 
  Warehouse as WarehouseIcon, 
  Truck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle,
  X,
  Database,
  Layers,
  Settings,
  ShieldCheck,
  QrCode,
  Tag
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { ApiClient } from '../../services/apiClient';
import { 
  InventoryItem, 
  StockMovement, 
  Warehouse, 
  ItemCategory, 
  WarehouseZone, 
  BinLocation, 
  BatchLot, 
  SerialNumber, 
  StockQuant, 
  InventoryRuleConfig 
} from '../../types';

import { ItemMasterSubView } from './inventory/ItemMasterSubView';
import { WarehouseSubView } from './inventory/WarehouseSubView';
import { InventoryIdentitySubView } from './inventory/InventoryIdentitySubView';
import { StockQuantSubView } from './inventory/StockQuantSubView';
import { InventoryConfigSubView } from './inventory/InventoryConfigSubView';
import { StockLedgerSubView } from './inventory/StockLedgerSubView';
import { InventoryCostingSubView } from './inventory/InventoryCostingSubView';
import { InventoryFinancialIntegrationSubView } from './inventory/InventoryFinancialIntegrationSubView';
import { InventoryClosingControlSubView } from './inventory/InventoryClosingControlSubView';

export const InventoryView: React.FC = () => {
  const { lang, triggerReload, reloadTrigger, activeUser } = usePlatform();
  const isAr = lang === 'ar';

  const userRole = activeUser?.role || 'Super Admin';
  const isViewer = userRole === 'Viewer';
  const canEdit = !isViewer;
  const canManageConfig = userRole === 'Super Admin' || userRole === 'Inventory Manager' || userRole === 'Tenant Admin';

  const [activeTab, setActiveTab] = useState<'master' | 'warehouse' | 'identity' | 'quants' | 'movements' | 'costing' | 'financial' | 'closing_control' | 'config'>('master');


  // State Collections
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [itemGroups, setItemGroups] = useState<any[]>([]);
  const [uoms, setUoms] = useState<any[]>([]);
  
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [zones, setZones] = useState<WarehouseZone[]>([]);
  const [bins, setBins] = useState<BinLocation[]>([]);

  const [batchLots, setBatchLots] = useState<BatchLot[]>([]);
  const [serials, setSerials] = useState<SerialNumber[]>([]);
  
  const [quants, setQuants] = useState<StockQuant[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [config, setConfig] = useState<InventoryRuleConfig>({
    tenantId: 'ten-001',
    allowNegativeStock: false,
    autoGenerateQuantOnReceipt: true,
    requireBatchLotForPerishables: true,
    requireSerialNumberForHighValue: true,
    defaultValuationMethod: 'FIFO',
    expiryAlertThresholdDays: 30,
    enableAutoSkuGeneration: true,
    skuPrefixPattern: 'SKU-{CAT}-{SEQ}'
  });

  // Movement Modal State
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedSku, setSelectedSku] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [movementType, setMovementType] = useState<'Receipt' | 'Issue'>('Receipt');
  const [quantity, setQuantity] = useState(10);
  const [unitCost, setUnitCost] = useState(0);
  const [reference, setReference] = useState('');

  const loadAllInventoryData = async () => {
    try {
      const [
        itemsRes,
        catsRes,
        brandsRes,
        modelsRes,
        groupsRes,
        uomsRes,
        whRes,
        zonesRes,
        binsRes,
        batchRes,
        serialRes,
        quantRes,
        movRes,
        cfgRes
      ] = await Promise.all([
        ApiClient.getInventoryItems(),
        ApiClient.getItemCategories(),
        ApiClient.getBrands().catch(() => []),
        ApiClient.getModels().catch(() => []),
        ApiClient.getItemGroups().catch(() => []),
        ApiClient.getUnitsOfMeasure(),
        ApiClient.getWarehouses(),
        ApiClient.getWarehouseZones().catch(() => []),
        ApiClient.getBinLocations().catch(() => []),
        ApiClient.getBatchLots().catch(() => []),
        ApiClient.getSerialNumbers().catch(() => []),
        ApiClient.getStockQuants().catch(() => []),
        ApiClient.getStockMovements(),
        ApiClient.getInventoryConfig().catch(() => config)
      ]);

      setItems(itemsRes);
      setCategories(catsRes);
      setBrands(brandsRes);
      setModels(modelsRes);
      setItemGroups(groupsRes);
      setUoms(uomsRes);
      setWarehouses(whRes);
      setZones(zonesRes);
      setBins(binsRes);
      setBatchLots(batchRes);
      setSerials(serialRes);
      setQuants(quantRes);
      setMovements(movRes);
      if (cfgRes) setConfig(cfgRes);

      if (itemsRes.length > 0 && !selectedSku) setSelectedSku(itemsRes[0].sku);
      if (whRes.length > 0 && !selectedWarehouseId) setSelectedWarehouseId(whRes[0].id);
    } catch (err) {
      console.error('Failed loading Phase 2.1 inventory data:', err);
    }
  };

  useEffect(() => {
    loadAllInventoryData();
  }, [reloadTrigger]);

  const handleRecordMovement = async () => {
    if (!selectedSku || quantity <= 0) return;
    try {
      await ApiClient.createStockMovement({
        itemSku: selectedSku,
        warehouseId: selectedWarehouseId,
        movementType,
        quantity,
        unitCost,
        reference,
        performedBy: activeUser?.name || 'Ahmed Mounir'
      });
      setIsMovementModalOpen(false);
      triggerReload();
    } catch (err: any) {
      alert(err.message || 'Movement failed');
    }
  };

  const totalStockValuation = items.reduce((acc, i) => acc + (i.stockQty * i.costPrice), 0);

  return (
    <div className="p-6 space-y-6">
      
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <span>{isAr ? 'المخزون وسلسلة الإمداد والمستودعات - المرحلة 2.1' : 'Inventory & Warehouse Foundation - Phase 2.1'}</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              ERP Foundation
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr ? 'كارت الأصناف، المستودعات، العلبة، التراكيب، التتبع بالدفعة والسيريال، ومحرك الكوانت' : 'Item Master, Categories, Brands, Models, Multi-Warehouse, Bin Locations, Batches, Serials, and Stock Quant Engine'}
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsMovementModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isAr ? 'تسجيل حركة مخزنية (GRN / Issue)' : 'Record Stock Movement'}</span>
          </button>
        )}
      </div>

      {/* Main Module Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('master')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'master' 
              ? 'bg-indigo-600 text-white shadow-xs' 
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>{isAr ? 'كارت الأصناف والمعايير' : 'Master Data Catalog'}</span>
        </button>

        <button
          onClick={() => setActiveTab('warehouse')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'warehouse' 
              ? 'bg-indigo-600 text-white shadow-xs' 
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <WarehouseIcon className="w-4 h-4" />
          <span>{isAr ? 'المستودعات والرفوف (Bins)' : 'Warehouse & Bins'}</span>
        </button>

        <button
          onClick={() => setActiveTab('identity')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'identity' 
              ? 'bg-indigo-600 text-white shadow-xs' 
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>{isAr ? 'التشغيلات والسيريال (Batches)' : 'Batches & Serials'}</span>
        </button>

        <button
          onClick={() => setActiveTab('quants')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'quants' 
              ? 'bg-indigo-600 text-white shadow-xs' 
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>{isAr ? 'محرك الكوانت (Stock Quants)' : 'Stock Quant Engine'}</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'movements' 
              ? 'bg-indigo-600 text-white shadow-xs' 
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>{isAr ? 'حركات البضائع والمستندات (GRN)' : 'Movements & Ledger'}</span>
        </button>

        <button
          onClick={() => setActiveTab('costing')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'costing' 
              ? 'bg-amber-600 text-white shadow-xs' 
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isAr ? 'محرك التكلفة والتقييم (Cost Engine)' : 'Cost Engine & Valuation'}</span>
        </button>

        <button
          onClick={() => setActiveTab('financial')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'financial' 
              ? 'bg-indigo-600 text-white shadow-xs' 
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? 'مركز التكامل المالي (Financial Integration)' : 'Financial Integration Center'}</span>
        </button>

        <button
          onClick={() => setActiveTab('closing_control')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'closing_control' 
              ? 'bg-emerald-600 text-white shadow-xs' 
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'الإغلاق والرقابة المخزنية (Closing & Control)' : 'Closing & Control Engine'}</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'config' 
              ? 'bg-indigo-600 text-white shadow-xs' 
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{isAr ? 'إعدادات وقواعد المخزون' : 'Inventory Policies'}</span>
        </button>

      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">{isAr ? 'تقييم المخزون الإجمالي' : 'Total Inventory Valuation'}</div>
          <div className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-1">
            {totalStockValuation.toLocaleString()} SAR
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">{isAr ? 'الأصناف الفعالة (SKUs)' : 'Active Master SKUs'}</div>
          <div className="text-xl font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {items.length} SKUs
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">{isAr ? 'سجلات الكوانت (Quants)' : 'Active Quants'}</div>
          <div className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-1">
            {quants.length} Quants
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">{isAr ? 'المستودعات والرفوف' : 'Warehouses & Bins'}</div>
          <div className="text-xl font-mono font-bold text-emerald-600 mt-1">
            {warehouses.length} Wh / {bins.length} Bins
          </div>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'master' && (
        <ItemMasterSubView
          items={items}
          categories={categories}
          brands={brands}
          models={models}
          itemGroups={itemGroups}
          uoms={uoms}
          isAr={isAr}
          canEdit={canEdit}
          onRefresh={loadAllInventoryData}
        />
      )}

      {activeTab === 'warehouse' && (
        <WarehouseSubView
          warehouses={warehouses}
          zones={zones}
          bins={bins}
          isAr={isAr}
          canEdit={canEdit}
          onRefresh={loadAllInventoryData}
        />
      )}

      {activeTab === 'identity' && (
        <InventoryIdentitySubView
          batchLots={batchLots}
          serials={serials}
          items={items}
          warehouses={warehouses}
          isAr={isAr}
          canEdit={canEdit}
          onRefresh={loadAllInventoryData}
        />
      )}

      {activeTab === 'quants' && (
        <StockQuantSubView
          quants={quants}
          warehouses={warehouses}
          bins={bins}
          isAr={isAr}
          canEdit={canEdit}
          onRefresh={loadAllInventoryData}
        />
      )}

      {activeTab === 'movements' && (
        <StockLedgerSubView />
      )}

      {activeTab === 'costing' && (
        <InventoryCostingSubView
          items={items}
          categories={categories}
          isAr={isAr}
          canEdit={canEdit}
          onRefresh={loadAllInventoryData}
        />
      )}

      {activeTab === 'financial' && (
        <InventoryFinancialIntegrationSubView
          isAr={isAr}
          canEdit={canEdit}
          items={items}
          onRefresh={loadAllInventoryData}
        />
      )}

      {activeTab === 'closing_control' && (
        <InventoryClosingControlSubView />
      )}

      {activeTab === 'config' && (

        <InventoryConfigSubView
          config={config}
          isAr={isAr}
          canEdit={canManageConfig}
          onRefresh={loadAllInventoryData}
        />
      )}

      {/* Movement Recording Modal */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Record Stock Movement</h3>
              <button onClick={() => setIsMovementModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Item SKU</label>
                <select
                  value={selectedSku}
                  onChange={(e) => {
                    setSelectedSku(e.target.value);
                    const it = items.find(i => i.sku === e.target.value);
                    if (it) setUnitCost(it.costPrice);
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  {items.map(i => <option key={i.id} value={i.sku}>{i.sku} - {i.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Target Warehouse</label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Movement Type</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  <option value="Receipt">Stock In (Goods Receipt)</option>
                  <option value="Issue">Stock Out (Issue / Dispatch)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Unit Cost (SAR)</label>
                <input
                  type="number"
                  value={unitCost}
                  onChange={(e) => setUnitCost(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Reference Document / Note</label>
                <input
                  type="text"
                  placeholder="PO-2026-8801"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordMovement}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs"
              >
                Post Stock Movement
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
