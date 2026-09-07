import React, { useState } from 'react';
import { 
  QrCode, 
  Layers, 
  Calendar, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Clock 
} from 'lucide-react';
import { ApiClient } from '../../../services/apiClient';
import { BatchLot, SerialNumber, InventoryItem, Warehouse } from '../../../types';

interface Props {
  batchLots: BatchLot[];
  serials: SerialNumber[];
  items: InventoryItem[];
  warehouses: Warehouse[];
  isAr: boolean;
  canEdit: boolean;
  onRefresh: () => void;
}

export const InventoryIdentitySubView: React.FC<Props> = ({
  batchLots,
  serials,
  items,
  warehouses,
  isAr,
  canEdit,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'batch' | 'serials'>('batch');

  // New Batch Modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchNumber, setBatchNumber] = useState('');
  const [selectedSku, setSelectedSku] = useState(items[0]?.sku || '');
  const [mfgDate, setMfgDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [batchQty, setBatchQty] = useState(100);

  // New Serial Modal
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [serialNum, setSerialNum] = useState('');
  const [selectedSerialSku, setSelectedSerialSku] = useState(items[0]?.sku || '');
  const [selectedWhId, setSelectedWhId] = useState(warehouses[0]?.id || 'wh-001');

  const handleCreateBatch = async () => {
    if (!batchNumber || !selectedSku) return;
    const item = items.find(i => i.sku === selectedSku);

    await ApiClient.createBatchLot({
      batchNumber,
      itemSku: selectedSku,
      itemName: item ? item.name : 'Sample Item',
      manufacturingDate: mfgDate,
      expiryDate,
      totalQty: batchQty,
      availableQty: batchQty,
      status: 'Active'
    });

    setIsBatchModalOpen(false);
    onRefresh();
  };

  const handleCreateSerial = async () => {
    if (!serialNum || !selectedSerialSku) return;
    const item = items.find(i => i.sku === selectedSerialSku);
    const wh = warehouses.find(w => w.id === selectedWhId);

    await ApiClient.createSerialNumber({
      serialNumber: serialNum,
      itemSku: selectedSerialSku,
      itemName: item ? item.name : 'Sample Item',
      warehouseId: selectedWhId,
      warehouseName: wh ? wh.name : 'Central Warehouse',
      binCode: 'BIN-STORAGE-01',
      status: 'Available'
    });

    setIsSerialModalOpen(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      
      {/* Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'batch' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isAr ? 'تتبع التشغيلات واللوت (Batch/Lot Tracking)' : 'Batch & Lot Tracking'}
          </button>
          <button
            onClick={() => setActiveTab('serials')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'serials' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isAr ? 'الأرقام التسلسلية (Serial Numbers)' : 'Serial Numbers Tracking'}
          </button>
        </div>

        {canEdit && (
          <button
            onClick={() => activeTab === 'batch' ? setIsBatchModalOpen(true) : setIsSerialModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'batch' ? (isAr ? 'إنشاء دفعة تشغيل Lot' : 'Register New Batch') : (isAr ? 'تسجيل رقم تسلسلي' : 'Register Serial')}</span>
          </button>
        )}
      </div>

      {/* Batch Lots List */}
      {activeTab === 'batch' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
            <span>{isAr ? 'سجل تشغيلات ودفوعات المخزون (Batch Lots Directory)' : 'Batch Lots Directory'}</span>
            <span className="text-xs text-slate-400 font-normal">FIFO / FEFO Enforced</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Batch / Lot No</th>
                  <th className="px-4 py-3">{isAr ? 'الصنف المرتبط' : 'Item SKU & Name'}</th>
                  <th className="px-4 py-3">{isAr ? 'تاريخ الإنتاج' : 'Mfg Date'}</th>
                  <th className="px-4 py-3">{isAr ? 'تاريخ انتهاء الصلاحية' : 'Expiry Date'}</th>
                  <th className="px-4 py-3 text-right rtl:text-left">{isAr ? 'الكمية الإجمالية' : 'Total Qty'}</th>
                  <th className="px-4 py-3 text-right rtl:text-left">{isAr ? 'المتاح' : 'Available Qty'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'حالة الصلاحية' : 'Expiry Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {batchLots.map(b => {
                  const today = new Date().toISOString().split('T')[0];
                  const isExpired = b.expiryDate < today;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {b.batchNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        <div>{b.itemName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{b.itemSku}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">{b.manufacturingDate}</td>
                      <td className="px-4 py-3 font-mono text-slate-900 dark:text-white font-semibold">{b.expiryDate}</td>
                      <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold">{b.totalQty}</td>
                      <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-emerald-600">{b.availableQty}</td>
                      <td className="px-4 py-3 text-center">
                        {isExpired ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            Expired (Quarantine)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Valid / Active
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Serial Numbers List */}
      {activeTab === 'serials' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white">
            {isAr ? 'سجل الأرقام التسلسلية الفردية (Serial Numbers Ledger)' : 'Serial Numbers Directory'}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Serial Number</th>
                  <th className="px-4 py-3">{isAr ? 'الصنف' : 'Item SKU & Name'}</th>
                  <th className="px-4 py-3">{isAr ? 'المستودع والموقع' : 'Warehouse & Bin'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {serials.map(sn => (
                  <tr key={sn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {sn.serialNumber}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      <div>{sn.itemName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{sn.itemSku}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <div>{sn.warehouseName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{sn.binCode || 'BIN-01'}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sn.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {sn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Batch Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Register Batch Lot</h3>
              <button onClick={() => setIsBatchModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Batch / Lot Number</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="LOT-2026-001"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Item SKU</label>
                <select
                  value={selectedSku}
                  onChange={(e) => setSelectedSku(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  {items.map(i => <option key={i.id} value={i.sku}>{i.sku} - {i.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Manufacturing Date</label>
                <input
                  type="date"
                  value={mfgDate}
                  onChange={(e) => setMfgDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Batch Lot Quantity</label>
                <input
                  type="number"
                  value={batchQty}
                  onChange={(e) => setBatchQty(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBatch}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs"
              >
                Save Batch Lot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Serial Modal */}
      {isSerialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Register Serial Number</h3>
              <button onClick={() => setIsSerialModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Serial Number</label>
                <input
                  type="text"
                  value={serialNum}
                  onChange={(e) => setSerialNum(e.target.value)}
                  placeholder="SN-HW-2026-0001"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Item SKU</label>
                <select
                  value={selectedSerialSku}
                  onChange={(e) => setSelectedSerialSku(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  {items.map(i => <option key={i.id} value={i.sku}>{i.sku} - {i.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Target Warehouse</label>
                <select
                  value={selectedWhId}
                  onChange={(e) => setSelectedWhId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSerialModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSerial}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs"
              >
                Save Serial Number
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
