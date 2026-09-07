import React, { useState, useEffect } from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Plus, 
  Search, 
  Filter, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  FileText, 
  Building2, 
  User, 
  Barcode, 
  Clock, 
  ShieldAlert, 
  Activity,
  PackageCheck,
  PackageMinus,
  Box,
  ChevronRight,
  Info,
  X
} from 'lucide-react';
import { ApiClient } from '../../../services/apiClient';
import { 
  StockLedgerEntry, 
  InventoryMovementType, 
  InventoryMovementTypeConfig, 
  InventoryItem, 
  Warehouse, 
  BinLocation 
} from '../../../types';

export const StockLedgerSubView: React.FC = () => {
  const [ledgerEntries, setLedgerEntries] = useState<StockLedgerEntry[]>([]);
  const [movementTypes, setMovementTypes] = useState<InventoryMovementTypeConfig[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [bins, setBins] = useState<BinLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMovementType, setSelectedMovementType] = useState<string>('ALL');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [selectedItem, setSelectedItem] = useState<string>('ALL');

  // Execution Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [executionMode, setExecutionMode] = useState<'GRN' | 'GIN' | 'GENERIC'>('GRN');
  const [selectedLedgerEntry, setSelectedLedgerEntry] = useState<StockLedgerEntry | null>(null);

  // Form State for Execution
  const [formData, setFormData] = useState({
    movementType: 'GOODS_RECEIPT' as InventoryMovementType,
    itemSku: '',
    warehouseId: '',
    binId: '',
    binCode: '',
    batchNumber: '',
    serialNumber: '',
    quantity: 1,
    unitCost: 0,
    sourceDocumentType: 'GoodsReceiptNote',
    sourceDocumentNumber: '',
    reference: '',
    reason: ''
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ledgerData, typesData, itemsData, whData, binData] = await Promise.all([
        ApiClient.getStockLedger(),
        ApiClient.getMovementTypeConfigs(),
        ApiClient.getInventoryItems(),
        ApiClient.getWarehouses(),
        ApiClient.getBinLocations()
      ]);

      setLedgerEntries(ledgerData || []);
      setMovementTypes(typesData || []);
      setItems(itemsData || []);
      setWarehouses(whData || []);
      setBins(binData || []);

      if (itemsData && itemsData.length > 0) {
        setFormData(prev => ({
          ...prev,
          itemSku: itemsData[0].sku,
          unitCost: itemsData[0].costPrice
        }));
      }
      if (whData && whData.length > 0) {
        setFormData(prev => ({ ...prev, warehouseId: whData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load stock ledger data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openExecutionModal = (mode: 'GRN' | 'GIN' | 'GENERIC') => {
    setExecutionMode(mode);
    setFormError(null);

    const defaultType: InventoryMovementType = 
      mode === 'GRN' ? 'GOODS_RECEIPT' :
      mode === 'GIN' ? 'GOODS_ISSUE' : 'GOODS_RECEIPT';

    const defaultDocType = 
      mode === 'GRN' ? 'GoodsReceiptNote' :
      mode === 'GIN' ? 'GoodsIssueNote' : 'InventoryMovement';

    const firstItem = items[0];
    const firstWh = warehouses[0];

    setFormData({
      movementType: defaultType,
      itemSku: firstItem ? firstItem.sku : '',
      warehouseId: firstWh ? firstWh.id : '',
      binId: '',
      binCode: '',
      batchNumber: '',
      serialNumber: '',
      quantity: 1,
      unitCost: firstItem ? firstItem.costPrice : 0,
      sourceDocumentType: defaultDocType,
      sourceDocumentNumber: `${mode}-${Date.now().toString().slice(-6)}`,
      reference: '',
      reason: ''
    });

    setIsModalOpen(true);
  };

  const handleItemChange = (sku: string) => {
    const selected = items.find(i => i.sku === sku);
    setFormData(prev => ({
      ...prev,
      itemSku: sku,
      unitCost: selected ? selected.costPrice : prev.unitCost
    }));
  };

  const handleExecuteMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.itemSku) {
      setFormError('Please select an item SKU.');
      return;
    }
    if (!formData.warehouseId) {
      setFormError('Please select a warehouse.');
      return;
    }
    if (formData.quantity <= 0) {
      setFormError('Quantity must be greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      if (executionMode === 'GRN') {
        await ApiClient.executeGoodsReceipt({
          ...formData,
          userName: 'Ahmed Mounir'
        });
      } else if (executionMode === 'GIN') {
        await ApiClient.executeGoodsIssue({
          ...formData,
          userName: 'Ahmed Mounir'
        });
      } else {
        await ApiClient.executeInventoryMovement({
          ...formData,
          userName: 'Ahmed Mounir'
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Execution failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Logic
  const filteredLedger = ledgerEntries.filter(entry => {
    const matchesSearch = 
      entry.movementNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.itemSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.sourceDocumentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.reference && entry.reference.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedMovementType === 'ALL' || entry.movementType === selectedMovementType;
    const matchesWarehouse = selectedWarehouse === 'ALL' || entry.warehouseId === selectedWarehouse;
    const matchesItem = selectedItem === 'ALL' || entry.itemSku === selectedItem;

    return matchesSearch && matchesType && matchesWarehouse && matchesItem;
  });

  // Calculate Metrics
  const totalEntries = ledgerEntries.length;
  const totalReceiptsVal = ledgerEntries
    .filter(e => e.quantityImpact > 0)
    .reduce((sum, e) => sum + e.totalCost, 0);
  const totalIssuesVal = ledgerEntries
    .filter(e => e.quantityImpact < 0)
    .reduce((sum, e) => sum + e.totalCost, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0B1F3A] border border-[#153258] rounded-2xl p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#153258] text-[#F28C28] text-xs px-2.5 py-1 rounded-full border border-[#F28C28]/30 font-mono uppercase tracking-wider">
                Phase 2.2.1 Execution Engine
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-1 rounded-full border border-emerald-500/30 font-medium">
                Immutable Stock Ledger
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Stock Ledger & Inventory Execution Engine</h2>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Real-time Stock Quant Engine with append-only stock movement logging. Emits business events and decoupled financial events for SAP S/4HANA & Oracle SCM alignment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => openExecutionModal('GRN')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-900/30 text-sm"
            >
              <PackageCheck className="w-4 h-4" />
              Goods Receipt (GRN)
            </button>
            <button
              onClick={() => openExecutionModal('GIN')}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-rose-900/30 text-sm"
            >
              <PackageMinus className="w-4 h-4" />
              Goods Issue (GIN)
            </button>
            <button
              onClick={() => openExecutionModal('GENERIC')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-900/30 text-sm"
            >
              <Plus className="w-4 h-4" />
              Record Movement
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Movements</span>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalEntries}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Append-only ledger records</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Inbound Value (GRN)</span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalReceiptsVal.toLocaleString()} SAR</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total goods received</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Outbound Value (GIN)</span>
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 rounded-xl text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{totalIssuesVal.toLocaleString()} SAR</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total goods issued</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Movement Types</span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{movementTypes.length || 9} Configured</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">GRN, GIN, Transfer, Adjustment, Return</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Movement #, SKU, Ref, Doc..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          {/* Movement Type Filter */}
          <div>
            <select
              value={selectedMovementType}
              onChange={(e) => setSelectedMovementType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            >
              <option value="ALL">All Movement Types</option>
              {movementTypes.map(m => (
                <option key={m.code} value={m.code}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Warehouse Filter */}
          <div>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            >
              <option value="ALL">All Warehouses</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Item SKU Filter */}
          <div>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            >
              <option value="ALL">All Items</option>
              {items.map(i => (
                <option key={i.sku} value={i.sku}>{i.sku} - {i.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stock Ledger Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-white">Immutable Stock Ledger</h3>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
              {filteredLedger.length} Records
            </span>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-sm text-slate-500 mt-2">Loading Stock Ledger entries...</p>
          </div>
        ) : filteredLedger.length === 0 ? (
          <div className="p-12 text-center">
            <Box className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-700 dark:text-slate-300 font-medium">No Stock Ledger entries found</p>
            <p className="text-slate-500 text-xs mt-1">Execute a Goods Receipt (GRN) or Goods Issue (GIN) to create append-only ledger entries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Movement # & Date</th>
                  <th className="py-3.5 px-4">Movement Type</th>
                  <th className="py-3.5 px-4">Item SKU & Name</th>
                  <th className="py-3.5 px-4">Warehouse / Bin</th>
                  <th className="py-3.5 px-4">Batch / Serial</th>
                  <th className="py-3.5 px-4 text-right">Qty Impact</th>
                  <th className="py-3.5 px-4 text-right">Unit & Total Cost</th>
                  <th className="py-3.5 px-4">Source Doc</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {filteredLedger.map((entry) => {
                  const isPositive = entry.quantityImpact > 0;
                  return (
                    <tr 
                      key={entry.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="font-semibold text-slate-900 dark:text-white">{entry.movementNumber}</div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                          isPositive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                        }`}>
                          {isPositive ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {entry.movementType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">{entry.itemName}</div>
                        <div className="text-slate-500 text-xs font-mono">{entry.itemSku}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 dark:text-white text-xs">{entry.warehouseName}</div>
                        <div className="text-slate-500 text-[11px] font-mono">{entry.binCode || 'BIN-DEFAULT'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600 dark:text-slate-400">
                        {entry.batchNumber && <div>Batch: {entry.batchNumber}</div>}
                        {entry.serialNumber && <div>S/N: {entry.serialNumber}</div>}
                        {!entry.batchNumber && !entry.serialNumber && <span className="text-slate-400">-</span>}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold">
                        <span className={isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {isPositive ? `+${entry.quantity}` : `-${entry.quantity}`} {entry.uom}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="text-slate-900 dark:text-white font-medium">{entry.totalCost.toLocaleString()} SAR</div>
                        <div className="text-slate-500 text-[11px]">@{entry.unitCost} SAR</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{entry.sourceDocumentNumber}</div>
                        <div className="text-slate-500 text-[11px]">{entry.sourceDocumentType}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="text-slate-900 dark:text-white font-medium">{entry.userName}</div>
                        <div className="text-slate-500 text-[11px]">{entry.userRole || 'Inventory Manager'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedLedgerEntry(entry)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                          title="View Business Event & Financial Event Logs"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Inspector Modal */}
      {selectedLedgerEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-mono px-2.5 py-0.5 rounded-full font-bold">
                    {selectedLedgerEntry.movementNumber}
                  </span>
                  <span className="text-xs text-slate-500">Append-Only Stock Ledger Record</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  Inventory Execution Event Audit Detail
                </h3>
              </div>
              <button 
                onClick={() => setSelectedLedgerEntry(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Event Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 block">Movement Type:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedLedgerEntry.movementType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Source Document:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedLedgerEntry.sourceDocumentType} ({selectedLedgerEntry.sourceDocumentNumber})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Item SKU & Name:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedLedgerEntry.itemSku} - {selectedLedgerEntry.itemName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Warehouse & Bin:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedLedgerEntry.warehouseName} ({selectedLedgerEntry.binCode})</span>
                </div>
              </div>

              {/* Business Event Payload */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Generated Business Event</h4>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-xs font-mono overflow-x-auto">
{JSON.stringify({
  eventType: selectedLedgerEntry.quantityImpact > 0 ? 'EVT_GOODS_RECEIPT' : 'EVT_GOODS_ISSUE',
  movementId: selectedLedgerEntry.id,
  movementNumber: selectedLedgerEntry.movementNumber,
  sku: selectedLedgerEntry.itemSku,
  quantity: selectedLedgerEntry.quantity,
  unitCost: selectedLedgerEntry.unitCost,
  totalCost: selectedLedgerEntry.totalCost,
  timestamp: selectedLedgerEntry.timestamp,
  user: selectedLedgerEntry.userName
}, null, 2)}
                </pre>
              </div>

              {/* Decoupled Financial Event Payload */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="w-4 h-4 text-emerald-500" />
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Emitted Financial Event (Perpetual Inventory)</h4>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-xs font-mono overflow-x-auto">
{JSON.stringify({
  financialEventType: selectedLedgerEntry.quantityImpact > 0 ? 'STOCK_RECEIPT_POSTED' : 'STOCK_ISSUE_POSTED',
  amount: selectedLedgerEntry.totalCost,
  currency: 'SAR',
  targetEngine: 'FinancialEventEngine (No direct GL posting)',
  status: 'EMITTED_SUCCESSFULLY'
}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Movement Execution Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-mono px-2.5 py-0.5 rounded-full font-bold">
                  Phase 2.2.1 Execution
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {executionMode === 'GRN' ? 'Execute Goods Receipt (GRN)' :
                   executionMode === 'GIN' ? 'Execute Goods Issue (GIN)' : 'Record Inventory Movement'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteMovement} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Movement Type Selection (Only for Generic mode) */}
              {executionMode === 'GENERIC' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Movement Type</label>
                  <select
                    value={formData.movementType}
                    onChange={(e) => setFormData(prev => ({ ...prev, movementType: e.target.value as InventoryMovementType }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  >
                    {movementTypes.map(m => (
                      <option key={m.code} value={m.code}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Item SKU Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Item SKU</label>
                <select
                  value={formData.itemSku}
                  onChange={(e) => handleItemChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                >
                  {items.map(i => (
                    <option key={i.sku} value={i.sku}>{i.sku} - {i.name} (Qty: {i.stockQty} {i.uom})</option>
                  ))}
                </select>
              </div>

              {/* Warehouse & Bin */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Warehouse</label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData(prev => ({ ...prev, warehouseId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bin Location Code</label>
                  <input
                    type="text"
                    value={formData.binCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, binCode: e.target.value }))}
                    placeholder="e.g. BIN-BLK-A1"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Quantity & Unit Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit Cost (SAR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Batch / Lot & Serial Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Batch Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                    placeholder="BATCH-2026-08A"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Serial Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                    placeholder="SRV-DELL-99001"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Document Reference & Reason */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Source Doc #</label>
                  <input
                    type="text"
                    value={formData.sourceDocumentNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, sourceDocumentNumber: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason / Notes</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Reason for movement"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-900/20 disabled:opacity-50"
                >
                  {submitting ? 'Executing...' : 'Post Stock Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
