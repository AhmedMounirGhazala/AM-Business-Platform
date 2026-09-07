import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertTriangle, 
  Edit3, 
  X, 
  DollarSign, 
  Layers 
} from 'lucide-react';
import { ApiClient } from '../../../services/apiClient';
import { StockQuant, Warehouse, BinLocation } from '../../../types';

interface Props {
  quants: StockQuant[];
  warehouses: Warehouse[];
  bins: BinLocation[];
  isAr: boolean;
  canEdit: boolean;
  onRefresh: () => void;
}

export const StockQuantSubView: React.FC<Props> = ({
  quants,
  warehouses,
  bins,
  isAr,
  canEdit,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('ALL');
  
  // Edit Quant Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuant, setEditingQuant] = useState<StockQuant | null>(null);
  const [qtyOnHand, setQtyOnHand] = useState(0);
  const [qtyReserved, setQtyReserved] = useState(0);
  const [unitCost, setUnitCost] = useState(0);

  const handleSaveQuant = async () => {
    if (!editingQuant) return;
    try {
      await ApiClient.updateStockQuant(editingQuant.id, {
        qtyOnHand,
        qtyAvailable: Math.max(0, qtyOnHand - qtyReserved),
        qtyReserved,
        unitCost
      });
      setIsEditModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredQuants = quants.filter(q => {
    const matchesSearch = q.itemSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.binCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWh = selectedWarehouseId === 'ALL' || q.warehouseId === selectedWarehouseId;
    return matchesSearch && matchesWh;
  });

  const totalOnHandUnits = filteredQuants.reduce((acc, q) => acc + q.qtyOnHand, 0);
  const totalStockValuation = filteredQuants.reduce((acc, q) => acc + q.totalValue, 0);

  return (
    <div className="space-y-4">
      
      {/* Metric summary bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">{isAr ? 'إجمالي عدد الكوانت (Stock Quants)' : 'Total Quant Records'}</div>
          <div className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-0.5">{filteredQuants.length} Records</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">{isAr ? 'الوحدات المتوفرة بالمخازن' : 'Total Units On-Hand'}</div>
          <div className="text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{totalOnHandUnits.toLocaleString()} Units</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">{isAr ? 'تقييم كوانت المخزون' : 'Stock Quant Valuation'}</div>
          <div className="text-lg font-mono font-bold text-emerald-600 mt-0.5">{totalStockValuation.toLocaleString()} SAR</div>
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            placeholder={isAr ? 'البحث بالرمز، الصنف، أو الرف Bin...' : 'Search SKU, Item, or Bin...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">{isAr ? 'المستودع:' : 'Warehouse:'}</span>
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5"
          >
            <option value="ALL">{isAr ? 'جميع المستودعات' : 'All Warehouses'}</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      </div>

      {/* Stock Quant Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Quant ID / Item SKU</th>
                <th className="px-4 py-3">{isAr ? 'اسم الصنف' : 'Item Name'}</th>
                <th className="px-4 py-3">{isAr ? 'المستودع والرف' : 'Warehouse & Bin'}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{isAr ? 'المتوفر المادي' : 'On-Hand'}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{isAr ? 'المتاح للبيع' : 'Available'}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{isAr ? 'المحجوز' : 'Reserved'}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{isAr ? 'تكلفة القيمة' : 'Unit Cost & Value'}</th>
                <th className="px-4 py-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                {canEdit && <th className="px-4 py-3 text-center">{isAr ? 'تعديل' : 'Edit'}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredQuants.map(q => (
                <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">{q.itemSku}</div>
                    <div className="text-[10px] text-slate-400">{q.id}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {q.itemName}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{q.warehouseName}</div>
                    <div className="font-mono font-bold text-indigo-500 text-[10px]">{q.binCode}</div>
                  </td>
                  <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-slate-900 dark:text-white">
                    {q.qtyOnHand} {q.uom}
                  </td>
                  <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-emerald-600">
                    {q.qtyAvailable} {q.uom}
                  </td>
                  <td className="px-4 py-3 text-right rtl:text-left font-mono text-amber-600 font-semibold">
                    {q.qtyReserved} {q.uom}
                  </td>
                  <td className="px-4 py-3 text-right rtl:text-left font-mono">
                    <div className="text-slate-900 dark:text-white font-bold">{q.totalValue.toLocaleString()} SAR</div>
                    <div className="text-[10px] text-slate-400">@ {q.unitCost} SAR</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {q.status}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setEditingQuant(q);
                          setQtyOnHand(q.qtyOnHand);
                          setQtyReserved(q.qtyReserved);
                          setUnitCost(q.unitCost);
                          setIsEditModalOpen(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Quant Modal */}
      {isEditModalOpen && editingQuant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Adjust Stock Quant</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Item SKU & Bin</label>
                <div className="font-mono font-bold text-indigo-600">{editingQuant.itemSku} - {editingQuant.itemName} ({editingQuant.binCode})</div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Physical Qty On-Hand</label>
                <input
                  type="number"
                  value={qtyOnHand}
                  onChange={(e) => setQtyOnHand(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Reserved Quantity</label>
                <input
                  type="number"
                  value={qtyReserved}
                  onChange={(e) => setQtyReserved(Number(e.target.value))}
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
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuant}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs"
              >
                Save Quant Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
