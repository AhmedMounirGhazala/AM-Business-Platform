import React, { useState } from 'react';
import { 
  Warehouse as WarehouseIcon, 
  Layers, 
  MapPin, 
  Plus, 
  CheckCircle, 
  Lock, 
  Unlock, 
  X, 
  Server 
} from 'lucide-react';
import { ApiClient } from '../../../services/apiClient';
import { Warehouse, WarehouseZone, BinLocation } from '../../../types';

interface Props {
  warehouses: Warehouse[];
  zones: WarehouseZone[];
  bins: BinLocation[];
  isAr: boolean;
  canEdit: boolean;
  onRefresh: () => void;
}

export const WarehouseSubView: React.FC<Props> = ({
  warehouses,
  zones,
  bins,
  isAr,
  canEdit,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'hubs' | 'zones' | 'bins'>('hubs');
  
  // Bin Location Modal
  const [isBinModalOpen, setIsBinModalOpen] = useState(false);
  const [binCode, setBinCode] = useState('');
  const [binName, setBinName] = useState('');
  const [selectedWhId, setSelectedWhId] = useState(warehouses[0]?.id || 'wh-001');
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id || '');
  const [storageType, setStorageType] = useState<'Standard Shelf' | 'Cold Storage' | 'Pallet Rack' | 'Bulk Bay'>('Standard Shelf');
  const [maxWeightKg, setMaxWeightKg] = useState(500);

  const handleCreateBin = async () => {
    if (!binCode || !binName) return;
    const wh = warehouses.find(w => w.id === selectedWhId);
    const zn = zones.find(z => z.id === selectedZoneId);

    await ApiClient.createBinLocation({
      code: binCode,
      name: binName,
      warehouseId: selectedWhId,
      warehouseName: wh ? wh.name : 'Central Warehouse',
      zoneId: selectedZoneId,
      zoneName: zn ? zn.name : 'Zone A',
      storageType,
      isDefaultReceiving: false,
      isDefaultShipping: false,
      isLocked: false,
      maxWeightKg
    });

    setIsBinModalOpen(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      
      {/* Sub tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('hubs')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'hubs' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isAr ? 'دليل المستودعات (Warehouses)' : 'Warehouses & Facilities'}
          </button>
          <button
            onClick={() => setActiveTab('zones')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'zones' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isAr ? 'المناطق والمساحات (Zones)' : 'Warehouse Zones'}
          </button>
          <button
            onClick={() => setActiveTab('bins')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'bins' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isAr ? 'مواقع التخزين والرفوف (Bin Locations)' : 'Bin Locations & Shelves'}
          </button>
        </div>

        {canEdit && activeTab === 'bins' && (
          <button
            onClick={() => setIsBinModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة موقع تخزين Bin' : 'Add Bin Location'}</span>
          </button>
        )}
      </div>

      {/* Warehouses Hubs */}
      {activeTab === 'hubs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map(wh => (
            <div key={wh.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold">
                    <WarehouseIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{wh.name}</h4>
                    <span className="text-[10px] font-mono font-bold text-indigo-500">{wh.code}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  wh.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  {wh.type || 'Physical'}
                </span>
              </div>

              <div className="text-xs space-y-1 text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{wh.location || 'Riyadh Central Logistics Zone'}</span>
                </div>
                <div>Manager: <span className="font-semibold text-slate-800 dark:text-slate-200">{wh.managerName || 'Operations Team'}</span></div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-400 block text-[9px] uppercase">Default Recv Bin</span>
                  <span className="font-bold text-indigo-600">BIN-REC-01</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-400 block text-[9px] uppercase">Default Ship Bin</span>
                  <span className="font-bold text-emerald-600">BIN-SHIP-01</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zones */}
      {activeTab === 'zones' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{isAr ? 'مناطق التخزين والمساحات الفنية' : 'Warehouse Storage Zones'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {zones.map(z => (
              <div key={z.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold font-mono text-indigo-600">{z.code} - {z.name}</span>
                  <span className="text-[10px] font-semibold text-slate-400">{z.storageType}</span>
                </div>
                <p className="text-slate-500 text-[11px]">{z.description}</p>
                <div className="text-[10px] text-slate-400 pt-1">Warehouse: <span className="font-semibold">{z.warehouseName}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bin Locations */}
      {activeTab === 'bins' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white">
            {isAr ? 'مواقع التخزين المحددة (Bin Locations Directory)' : 'Bin Locations Directory'}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Bin Code</th>
                  <th className="px-4 py-3">{isAr ? 'اسم الموقع' : 'Bin Name'}</th>
                  <th className="px-4 py-3">{isAr ? 'المستودع والمنطقة' : 'Warehouse & Zone'}</th>
                  <th className="px-4 py-3">{isAr ? 'نوع التخزين' : 'Storage Type'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'استخدام افتراضي' : 'Default Use'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bins.map(bin => (
                  <tr key={bin.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {bin.code}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {bin.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <div>{bin.warehouseName}</div>
                      <div className="text-[10px] text-slate-400">{bin.zoneName}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">
                      {bin.storageType}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {bin.isDefaultReceiving && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 mr-1">Receiving</span>}
                      {bin.isDefaultShipping && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Shipping</span>}
                      {!bin.isDefaultReceiving && !bin.isDefaultShipping && <span className="text-slate-400 text-[10px]">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {bin.isLocked ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[10px] bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px] bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                          <Unlock className="w-3 h-3" /> Open
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bin Modal */}
      {isBinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">New Bin Location</h3>
              <button onClick={() => setIsBinModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Bin Code (e.g. BIN-A-101)</label>
                <input
                  type="text"
                  value={binCode}
                  onChange={(e) => setBinCode(e.target.value)}
                  placeholder="BIN-A-101"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Bin Location Name</label>
                <input
                  type="text"
                  value={binName}
                  onChange={(e) => setBinName(e.target.value)}
                  placeholder="Shelf A1 Level 01"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Warehouse</label>
                <select
                  value={selectedWhId}
                  onChange={(e) => setSelectedWhId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Zone</label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Storage Type</label>
                <select
                  value={storageType}
                  onChange={(e) => setStorageType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  <option value="Standard Shelf">Standard Shelf</option>
                  <option value="Pallet Rack">Pallet Rack</option>
                  <option value="Cold Storage">Cold Storage (-20C)</option>
                  <option value="Bulk Bay">Bulk Staging Bay</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBinModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBin}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs"
              >
                Save Bin Location
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
