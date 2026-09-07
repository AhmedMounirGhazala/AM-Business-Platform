import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Barcode, 
  Layers, 
  Tag, 
  CheckCircle, 
  AlertCircle, 
  X, 
  RefreshCw 
} from 'lucide-react';
import { ApiClient } from '../../../services/apiClient';
import { InventoryItem, ItemCategory } from '../../../types';

interface Props {
  items: InventoryItem[];
  categories: ItemCategory[];
  brands: any[];
  models: any[];
  itemGroups: any[];
  uoms: any[];
  isAr: boolean;
  canEdit: boolean;
  onRefresh: () => void;
}

export const ItemMasterSubView: React.FC<Props> = ({
  items,
  categories,
  brands,
  models,
  itemGroups,
  uoms,
  isAr,
  canEdit,
  onRefresh
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'categories' | 'groups' | 'brands' | 'models' | 'uoms' | 'packaging'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-01');
  const [brandId, setBrandId] = useState(brands[0]?.id || '');
  const [modelId, setModelId] = useState(models[0]?.id || '');
  const [groupId, setGroupId] = useState(itemGroups[0]?.id || '');
  const [uom, setUom] = useState('PCS');
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [stockQty, setStockQty] = useState(0);
  const [reorderPoint, setReorderPoint] = useState(10);
  const [valuationMethod, setValuationMethod] = useState<'FIFO' | 'LIFO' | 'AVCO' | 'STANDARD'>('FIFO');

  const handleOpenCreateModal = async () => {
    setEditingItem(null);
    setErrorMessage('');
    setName('');
    setNameAr('');
    setCostPrice(100);
    setSellingPrice(150);
    setStockQty(0);
    setReorderPoint(10);

    // Auto-generate SKU & Barcode via Rule Engine
    try {
      const cat = categories.find(c => c.id === categoryId);
      const brd = brands.find(b => b.id === brandId);
      const mdl = models.find(m => m.id === modelId);
      const gen = await ApiClient.generateSkuAndBarcode({
        categoryCode: cat?.code || 'HW',
        brandCode: brd?.code || 'AM',
        modelCode: mdl?.code || 'GEN'
      });
      setSku(gen.sku);
      setBarcode(gen.barcode);
    } catch {
      setSku(`SKU-${Date.now()}`);
      setBarcode(`628${Math.floor(100000000 + Math.random() * 900000000)}`);
    }

    setIsItemModalOpen(true);
  };

  const handleSaveItem = async () => {
    setErrorMessage('');
    try {
      const cat = categories.find(c => c.id === categoryId);
      const brd = brands.find(b => b.id === brandId);
      const mdl = models.find(m => m.id === modelId);

      const payload = {
        sku,
        barcode,
        name,
        nameAr: nameAr || name,
        categoryId,
        categoryName: cat?.name || 'General',
        brandId,
        brandName: brd?.name || 'Generic',
        modelId,
        modelName: mdl?.name || 'Standard',
        uom,
        costPrice,
        sellingPrice,
        stockQty,
        reorderPoint,
        valuationMethod,
        warehouseId: 'wh-001'
      };

      if (editingItem) {
        await ApiClient.updateInventoryItem(editingItem.id, payload);
      } else {
        await ApiClient.createInventoryItem(payload);
      }

      setIsItemModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save item master record.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm(isAr ? 'هل أنت تأكد من حذف هذا الصنف؟' : 'Are you sure you want to delete this item?')) return;
    try {
      await ApiClient.deleteInventoryItem(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.barcode && item.barcode.includes(searchQuery));
    const matchesCat = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-4">
      
      {/* Sub-Tabs Nav */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('items')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'items' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isAr ? 'دليل الأصناف (Item Master)' : 'Item Master Catalog'}
          </button>
          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'categories' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isAr ? 'فئات المنتجات (Categories)' : 'Item Categories'}
          </button>
          <button
            onClick={() => setActiveSubTab('groups')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'groups' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isAr ? 'مجموعات الأصناف (Item Groups)' : 'Item Groups'}
          </button>
          <button
            onClick={() => setActiveSubTab('brands')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'brands' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isAr ? 'العلامات التجارية (Brands)' : 'Brands'}
          </button>
          <button
            onClick={() => setActiveSubTab('models')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'models' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isAr ? 'الموديلات والمديل (Models)' : 'Models & Variants'}
          </button>
          <button
            onClick={() => setActiveSubTab('uoms')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'uoms' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isAr ? 'وحدات القياس التحويلات (UOM & Conversions)' : 'UOM & Conversions'}
          </button>
        </div>

        {canEdit && activeSubTab === 'items' && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة صنف جديد' : 'New Item Master'}</span>
          </button>
        )}
      </div>

      {/* Main Items Catalog Content */}
      {activeSubTab === 'items' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 rtl:left-auto rtl:right-3" />
              <input
                type="text"
                placeholder={isAr ? 'البحث بالرمز SKU أو البار كود أو الاسم...' : 'Search SKU, Barcode, or Name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500">{isAr ? 'تصفية حسب الفئة:' : 'Category:'}</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5"
              >
                <option value="ALL">{isAr ? 'جميع الفئات' : 'All Categories'}</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">SKU / Barcode</th>
                    <th className="px-4 py-3">{isAr ? 'اسم الصنف' : 'Item Name'}</th>
                    <th className="px-4 py-3">{isAr ? 'الفئة والعلامة' : 'Category & Brand'}</th>
                    <th className="px-4 py-3 text-center">{isAr ? 'طريقة التقييم' : 'Valuation'}</th>
                    <th className="px-4 py-3 text-right rtl:text-left">{isAr ? 'الكمية الرصيد' : 'Stock Qty'}</th>
                    <th className="px-4 py-3 text-right rtl:text-left">{isAr ? 'سعر التكلفة' : 'Cost Price'}</th>
                    <th className="px-4 py-3 text-right rtl:text-left">{isAr ? 'سعر البيع' : 'Selling Price'}</th>
                    {canEdit && <th className="px-4 py-3 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredItems.map(item => {
                    const isLowStock = item.stockQty <= item.reorderPoint;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{item.sku}</div>
                          {item.barcode && (
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <Barcode className="w-3 h-3 text-slate-400" />
                              <span>{item.barcode}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {isAr ? item.nameAr || item.name : item.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            UOM: {item.uom} | Reorder: {item.reorderPoint}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-700 dark:text-slate-300 font-medium">{item.categoryName || 'General'}</div>
                          {item.brandName && (
                            <div className="text-[10px] text-indigo-500 font-semibold">{item.brandName}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {item.valuationMethod || 'FIFO'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            isLowStock 
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold' 
                              : 'text-slate-900 dark:text-white'
                          }`}>
                            {item.stockQty} {item.uom}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right rtl:text-left font-mono text-slate-600 dark:text-slate-400">
                          {item.costPrice.toLocaleString()} SAR
                        </td>
                        <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-emerald-600">
                          {item.sellingPrice.toLocaleString()} SAR
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setSku(item.sku);
                                  setBarcode(item.barcode || '');
                                  setName(item.name);
                                  setNameAr(item.nameAr || item.name);
                                  setCategoryId(item.categoryId || '');
                                  setBrandId(item.brandId || '');
                                  setModelId(item.modelId || '');
                                  setUom(item.uom);
                                  setCostPrice(item.costPrice);
                                  setSellingPrice(item.sellingPrice);
                                  setStockQty(item.stockQty);
                                  setReorderPoint(item.reorderPoint);
                                  setValuationMethod(item.valuationMethod || 'FIFO');
                                  setIsItemModalOpen(true);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tabs: Categories, Groups, Brands, Models, UOMs */}
      {activeSubTab === 'categories' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{isAr ? 'دليل الفئات الرئيسية' : 'Item Categories Directory'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map(c => (
              <div key={c.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs flex justify-between items-center">
                <div>
                  <div className="font-bold font-mono text-indigo-600">{c.code} - {c.name}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{c.description || 'Category classification'}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Active</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'groups' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{isAr ? 'مجموعات الاصناف' : 'Item Groups'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {itemGroups.map(g => (
              <div key={g.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                <div className="font-bold font-mono text-indigo-600">{g.code} - {g.name}</div>
                <div className="text-slate-400 text-[11px] mt-0.5">{g.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'brands' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{isAr ? 'العلامات التجارية' : 'Brands Registry'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {brands.map(b => (
              <div key={b.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{b.name}</div>
                  <div className="text-slate-400 text-[11px]">Code: {b.code} | Origin: {b.manufacturerCountry || 'Global'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'models' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{isAr ? 'الموديلات والمديلات' : 'Models & Specifications'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {models.map(m => (
              <div key={m.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                <div className="font-bold text-slate-900 dark:text-white">{m.name}</div>
                <div className="text-slate-400 text-[11px]">Brand Code: {m.brandCode} | Code: {m.code}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'uoms' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{isAr ? 'وحدات القياس والمعاملات' : 'Units of Measure Directory'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {uoms.map(u => (
              <div key={u.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-mono">
                <div className="font-bold text-indigo-600">{u.code} - {u.name}</div>
                <div className="text-slate-400 text-[11px]">Category: {u.category || 'Count'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for Item Master Create / Edit */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingItem ? (isAr ? 'تعديل بيانات الصنف' : 'Edit Item Master Record') : (isAr ? 'إضافة صنف جديد' : 'New Item Master Record')}
              </h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">SKU Number (Unique)</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono font-bold text-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Barcode (EAN-13 / UPC)</label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Item Name (English)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">اسم الصنف (بالعربية)</label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Brand</label>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  <option value="">None / Generic</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Unit of Measure (UOM)</label>
                <select
                  value={uom}
                  onChange={(e) => setUom(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                >
                  <option value="PCS">PCS - Pieces</option>
                  <option value="BOX">BOX - Box (12 PCS)</option>
                  <option value="KG">KG - Kilogram</option>
                  <option value="MTR">MTR - Meter</option>
                  <option value="SET">SET - Set</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Valuation Method</label>
                <select
                  value={valuationMethod}
                  onChange={(e) => setValuationMethod(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                >
                  <option value="FIFO">FIFO (First In, First Out)</option>
                  <option value="AVCO">Weighted Average (AVCO)</option>
                  <option value="STANDARD">Standard Costing</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Standard Cost Price (SAR)</label>
                <input
                  type="number"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">List Selling Price (SAR)</label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono text-emerald-600 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Initial Opening Quantity</label>
                <input
                  type="number"
                  disabled={Boolean(editingItem)}
                  value={stockQty}
                  onChange={(e) => setStockQty(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Reorder Threshold Point</label>
                <input
                  type="number"
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs"
              >
                Save Item Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
