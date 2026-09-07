/**
 * AM ERP — Enterprise Master Data & Advanced Pricing Workspace
 * Architecture Baseline: v2.8 (Phase 3.2A)
 * Unified Master Data Control Center for Products, Variants, Attributes, UOMs, Barcodes, Pricing & Hardening Suite.
 */

import React, { useState, useEffect } from 'react';
import {
  Package,
  Layers,
  Tag,
  Scale,
  Barcode,
  DollarSign,
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RotateCw,
  Sliders,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Cpu,
  Boxes,
  Info,
  Clock,
  Sparkles,
  Store
} from 'lucide-react';
import {
  ProductTemplate,
  ProductVariant,
  AttributeDefinition,
  AttributeSet,
  UnitOfMeasure,
  UOMCategory,
  UOMConversionRule,
  ProductBarcode,
  TaxCategory,
  PriceListHeader,
  ContractPriceRule,
  ExplainablePricingResult
} from '../../types';
import { MasterDataService } from '../../engine/masterDataService';
import { PricingEngine } from '../../engine/pricingEngine';
import { Phase32AHardeningSuite, Phase32ASuiteReport } from '../../engine/phase32AHardeningSuite';
import { RetailPilotDeploymentHub } from './RetailPilotDeploymentHub';

export const MasterDataWorkspaceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'variants' | 'pricing' | 'uom' | 'attributes' | 'barcodes' | 'hardening' | 'pilot_onboarding'>('products');
  
  // Data States
  const [products, setProducts] = useState<ProductTemplate[]>([]);
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [attributeSets, setAttributeSets] = useState<AttributeSet[]>([]);
  const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);
  const [uomCategories, setUomCategories] = useState<UOMCategory[]>([]);
  const [conversions, setConversions] = useState<UOMConversionRule[]>([]);
  const [barcodes, setBarcodes] = useState<ProductBarcode[]>([]);
  const [taxCategories, setTaxCategories] = useState<TaxCategory[]>([]);
  const [priceLists, setPriceLists] = useState<PriceListHeader[]>([]);
  const [contracts, setContracts] = useState<ContractPriceRule[]>([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Variant Generator State
  const [selectedBaseSku, setSelectedBaseSku] = useState<string>('APP-POLO-01');
  const [selectedDimValues, setSelectedDimValues] = useState<Record<string, string[]>>({
    COLOR: ['BLK', 'WHT'],
    SIZE: ['M', 'L']
  });
  const [variantPreview, setVariantPreview] = useState<ProductVariant[]>([]);
  const [variantGenMessage, setVariantGenMessage] = useState<string | null>(null);

  // Pricing Simulator State
  const [simSku, setSimSku] = useState<string>('HW-SRV-01');
  const [simCustomer, setSimCustomer] = useState<string>('cust-001');
  const [simCustomerGroup, setSimCustomerGroup] = useState<string>('WHOLESALE');
  const [simQty, setSimQty] = useState<number>(5);
  const [simCurrency, setSimCurrency] = useState<string>('SAR');
  const [simResult, setSimResult] = useState<ExplainablePricingResult | null>(null);

  // UOM Test State
  const [uomFrom, setUomFrom] = useState<string>('CTN');
  const [uomTo, setUomTo] = useState<string>('PCS');
  const [uomQty, setUomQty] = useState<number>(2);
  const [uomResult, setUomResult] = useState<{ convertedQuantity: number; factorUsed: number; formula: string } | null>(null);

  // Barcode Test State
  const [testBarcode, setTestBarcode] = useState<string>('628100293012');
  const [barcodeResolveResult, setBarcodeResolveResult] = useState<any | null>(null);
  const [eanCheckInput, setEanCheckInput] = useState<string>('6281005510112');
  const [eanValid, setEanValid] = useState<boolean | null>(null);

  // Hardening Suite State
  const [runningHardening, setRunningHardening] = useState<boolean>(false);
  const [hardeningReport, setHardeningReport] = useState<Phase32ASuiteReport | null>(null);

  // Create Product Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newProductForm, setNewProductForm] = useState({
    sku: '',
    name: '',
    nameAr: '',
    productType: 'STOCK' as const,
    categoryId: 'cat-01',
    taxCategoryId: 'tax-cat-std',
    baseUom: 'PCS',
    trackingPolicy: 'STANDARD' as const,
    baseCostPrice: 100,
    baseSellingPrice: 150,
    reorderPoint: 10
  });

  const loadData = () => {
    setProducts(MasterDataService.getProducts('ten-001'));
    setAttributes(MasterDataService.getAttributes('ten-001'));
    setAttributeSets(MasterDataService.getAttributeSets('ten-001'));
    setUoms(MasterDataService.getUOMs('ten-001'));
    setUomCategories(MasterDataService.getUOMCategories('ten-001'));
    setConversions(MasterDataService.getUOMConversions('ten-001'));
    setBarcodes(MasterDataService.getBarcodes('ten-001'));
    setTaxCategories(MasterDataService.getTaxCategories('ten-001'));
    setPriceLists(PricingEngine.getPriceLists('ten-001'));
    setContracts(PricingEngine.getContractRules('ten-001'));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Run initial pricing calculation on load
  useEffect(() => {
    handleRunPricingSim();
    handleRunUomConversion();
    handleCheckEan();
  }, []);

  const handleRunPricingSim = () => {
    const p = products.find(prod => prod.sku === simSku) || MasterDataService.getProductById('prod-001', 'ten-001');
    const basePrice = p ? p.baseSellingPrice : 100;
    const res = PricingEngine.calculatePrice({
      tenantId: 'ten-001',
      itemSku: simSku,
      customerId: simCustomer || undefined,
      customerGroup: simCustomerGroup || undefined,
      quantity: simQty,
      targetCurrency: simCurrency,
      baseUnitPrice: basePrice
    });
    setSimResult(res);
  };

  const handleRunUomConversion = () => {
    try {
      const res = MasterDataService.convertQuantity(uomFrom, uomTo, uomQty, 'ten-001');
      setUomResult(res);
    } catch (err: any) {
      setUomResult({ convertedQuantity: 0, factorUsed: 0, formula: err.message });
    }
  };

  const handleCheckEan = () => {
    const isValid = MasterDataService.validateEan13(eanCheckInput);
    setEanValid(isValid);
  };

  const handleResolveBarcode = () => {
    try {
      const res = MasterDataService.resolveBarcode(testBarcode, 'ten-001');
      setBarcodeResolveResult(res);
    } catch (err: any) {
      setBarcodeResolveResult({ error: err.message });
    }
  };

  const handleGenerateVariantPreview = () => {
    const dims = Object.keys(selectedDimValues).map(k => ({
      attributeCode: k,
      selectedValueCodes: selectedDimValues[k]
    }));
    try {
      const gen = MasterDataService.generateVariantMatrix(selectedBaseSku, dims, 'ten-001');
      setVariantPreview(gen.previewVariants);
      setVariantGenMessage(gen.warningMessage || `Successfully calculated ${gen.totalCombinations} variant combinations.`);
    } catch (err: any) {
      setVariantGenMessage(`Error: ${err.message}`);
    }
  };

  const handleCommitVariants = () => {
    if (variantPreview.length === 0) return;
    const committed = MasterDataService.commitGeneratedVariants(variantPreview, 'usr-001');
    alert(`Committed ${committed.length} variants to database.`);
    loadData();
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      MasterDataService.createProduct({
        tenantId: 'ten-001',
        sku: newProductForm.sku,
        name: newProductForm.name,
        nameAr: newProductForm.nameAr,
        productType: newProductForm.productType,
        categoryId: newProductForm.categoryId,
        taxCategoryId: newProductForm.taxCategoryId,
        baseUom: newProductForm.baseUom,
        trackingPolicy: newProductForm.trackingPolicy,
        baseCostPrice: Number(newProductForm.baseCostPrice),
        baseSellingPrice: Number(newProductForm.baseSellingPrice),
        reorderPoint: Number(newProductForm.reorderPoint),
        isConfigurable: false,
        active: true
      }, 'usr-001');
      setShowCreateModal(false);
      loadData();
      alert(`Product ${newProductForm.sku} created successfully.`);
    } catch (err: any) {
      alert(`Error creating product: ${err.message}`);
    }
  };

  const handleRunHardeningSuite = async () => {
    setRunningHardening(true);
    const report = await Phase32AHardeningSuite.runSuite();
    setHardeningReport(report);
    setRunningHardening(false);
  };

  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || (p.nameAr && p.nameAr.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-6" id="master-data-workspace">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Enterprise Master Data & Advanced Pricing</h1>
              <p className="text-sm text-slate-400">Canonical Product Templates, Multi-Dimensional Matrix, UOM Engine & 4-Tier Pricing</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('hardening')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg font-medium text-sm transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Hardening Suite (30/30)</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-all shadow-md hover:shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Product Master</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 overflow-x-auto pb-1">
        {[
          { id: 'products', label: 'Product Master Catalog', icon: Package, count: products.length },
          { id: 'pilot_onboarding', label: 'Retail Pilot Onboarding (CSV & SQLite)', icon: Store, badge: 'Phase 1' },
          { id: 'variants', label: 'Variant Matrix Generator', icon: Layers },
          { id: 'pricing', label: 'Advanced Pricing & Simulator', icon: DollarSign },
          { id: 'uom', label: 'Units of Measure & Conversions', icon: Scale },
          { id: 'attributes', label: 'Attribute Dictionary', icon: Sliders },
          { id: 'barcodes', label: 'Barcodes & Scanner Hub', icon: Barcode },
          { id: 'hardening', label: 'Phase 3.2A Quality Gate', icon: ShieldCheck, badge: '30 Tests' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 rounded-t-lg'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PRODUCT MASTER CATALOG */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by SKU, English name, or Arabic name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Categories</option>
                <option value="cat-01">Hardware & Infrastructure</option>
                <option value="cat-02">Software Licenses</option>
                <option value="cat-03">Apparel & Uniforms</option>
                <option value="cat-04">Mobile & Electronics</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">SKU & Identification</th>
                    <th className="py-3.5 px-4">Product Name & Category</th>
                    <th className="py-3.5 px-4">Type / Tracking</th>
                    <th className="py-3.5 px-4">Base UOM</th>
                    <th className="py-3.5 px-4 text-right">Cost Price</th>
                    <th className="py-3.5 px-4 text-right">Standard Selling Price</th>
                    <th className="py-3.5 px-4 text-center">Configurable</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {p.sku}
                        <div className="text-xs text-slate-400 font-normal">Ver: {p.version}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{p.name}</div>
                        {p.nameAr && <div className="text-xs text-slate-500" dir="rtl">{p.nameAr}</div>}
                        <div className="text-xs text-slate-400 mt-0.5">{p.categoryName || p.categoryId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mr-1.5">
                          {p.productType}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                          {p.trackingPolicy}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {p.baseUom}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {p.baseCostPrice.toLocaleString()} SAR
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {p.baseSellingPrice.toLocaleString()} SAR
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.isConfigurable ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                            Matrix Active
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Simple Item</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                            <XCircle className="w-3.5 h-3.5" /> Deactivated
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VARIANT MATRIX GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === 'variants' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dimension Selection Panel */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-500" />
                <span>1. Select Matrix Dimensions</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Base Configurable Product</label>
                <select
                  value={selectedBaseSku}
                  onChange={e => setSelectedBaseSku(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium"
                >
                  {products.filter(p => p.isConfigurable).map(p => (
                    <option key={p.id} value={p.sku}>{p.sku} — {p.name}</option>
                  ))}
                </select>
              </div>

              {/* Attributes & Allowed Values Checkboxes */}
              <div className="space-y-3 pt-2">
                {attributes.map(attr => (
                  <div key={attr.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/60">
                    <div className="font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase mb-2 flex items-center justify-between">
                      <span>{attr.name} ({attr.code})</span>
                      <span className="text-[10px] text-slate-400 font-mono">{attr.valueType}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {attr.allowedValues.map(val => {
                        const isSelected = selectedDimValues[attr.code]?.includes(val.code);
                        return (
                          <button
                            key={val.id}
                            type="button"
                            onClick={() => {
                              const curr = selectedDimValues[attr.code] || [];
                              const updated = isSelected ? curr.filter(c => c !== val.code) : [...curr, val.code];
                              setSelectedDimValues({ ...selectedDimValues, [attr.code]: updated });
                            }}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {val.hexColor && (
                              <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: val.hexColor }} />
                            )}
                            <span>{val.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerateVariantPreview}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Compute Cartesian Matrix</span>
                </button>
              </div>
            </div>

            {/* Matrix Preview Panel */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-500" />
                    <span>2. Cartesian Combinations Preview ({variantPreview.length})</span>
                  </h3>
                  {variantPreview.length > 0 && (
                    <button
                      onClick={handleCommitVariants}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Commit to Database</span>
                    </button>
                  )}
                </div>

                {variantGenMessage && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>{variantGenMessage}</span>
                  </div>
                )}

                {variantPreview.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No matrix computed yet. Select dimensions and click Compute.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[420px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Variant SKU</th>
                          <th className="py-2.5 px-3">Variant Name</th>
                          <th className="py-2.5 px-3">Attributes Matrix</th>
                          <th className="py-2.5 px-3">Generated Barcode</th>
                          <th className="py-2.5 px-3 text-right">Price Override</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {variantPreview.map(v => (
                          <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{v.sku}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{v.variantName}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                              {JSON.stringify(v.attributeValues)}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">{v.barcode}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600">
                              {v.sellingPriceOverride} SAR
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ADVANCED PRICING & SIMULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          {/* Top Row: Pricing Hierarchy Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { tier: 1, name: 'CONTRACT', desc: 'Special Customer Agreements (Absolute Precedence)', color: 'border-purple-500 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300' },
              { tier: 2, name: 'CUSTOMER_TIER', desc: 'Wholesale / Key Account / Volume Breaks', color: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300' },
              { tier: 3, name: 'PROMOTION', desc: 'Active Promotional Campaigns & Flash Sales', color: 'border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300' },
              { tier: 4, name: 'BASE_PRICE', desc: 'Product Master Standard Selling Price', color: 'border-slate-400 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300' }
            ].map(h => (
              <div key={h.tier} className={`p-4 rounded-xl border-2 ${h.color} space-y-1`}>
                <div className="flex items-center justify-between font-mono font-bold text-xs">
                  <span>PRIORITY TIER {h.tier}</span>
                  <span className="px-1.5 py-0.5 rounded bg-black/10 text-[10px]">{h.name}</span>
                </div>
                <div className="text-xs font-medium leading-relaxed">{h.desc}</div>
              </div>
            ))}
          </div>

          {/* Interactive Pricing Resolution Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-500" />
                <span>Pricing Resolution Simulator</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Target Product SKU</label>
                  <select
                    value={simSku}
                    onChange={e => setSimSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.sku}>{p.sku} — {p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Customer Account</label>
                  <select
                    value={simCustomer}
                    onChange={e => setSimCustomer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value="">(Anonymous Customer / Direct Walk-in)</option>
                    <option value="cust-001">cust-001 — Saudi Aramco Technology Ventures (Has Contract)</option>
                    <option value="cust-002">cust-002 — Riyadh Bank Digital Innovation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Customer Group / Tier</label>
                  <select
                    value={simCustomerGroup}
                    onChange={e => setSimCustomerGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value="STANDARD">STANDARD (Retail / Base)</option>
                    <option value="WHOLESALE">WHOLESALE (Tier 1 Volume)</option>
                    <option value="KEY_ACCOUNT">KEY_ACCOUNT</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={simQty}
                      onChange={e => setSimQty(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Currency</label>
                    <select
                      value={simCurrency}
                      onChange={e => setSimCurrency(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                    >
                      <option value="SAR">SAR (Base)</option>
                      <option value="USD">USD (Converted)</option>
                      <option value="EUR">EUR (Converted)</option>
                      <option value="AED">AED (Converted)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunPricingSim}
                  className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute Price Resolution</span>
                </button>
              </div>
            </div>

            {/* Resolution Output & Audit Trail */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>Explainable Pricing Output</span>
                </span>
                {simResult && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                    simResult.appliedPriority === 1 ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' :
                    simResult.appliedPriority === 2 ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' :
                    simResult.appliedPriority === 3 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    Priority {simResult.appliedPriority} [{simResult.appliedPriorityName}]
                  </span>
                )}
              </h3>

              {simResult ? (
                <div className="space-y-4">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
                      <div className="text-[11px] text-slate-400">Unit Price</div>
                      <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {simResult.finalUnitPrice.toLocaleString()} {simResult.currency}
                      </div>
                      <div className="text-[10px] text-slate-400">Base: {simResult.baseUnitPrice} SAR</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
                      <div className="text-[11px] text-slate-400">Line Total ({simQty} {simResult.uomUsed})</div>
                      <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                        {simResult.lineTotal.toLocaleString()} {simResult.currency}
                      </div>
                      <div className="text-[10px] text-slate-400">Rate: {simResult.exchangeRateUsed}</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
                      <div className="text-[11px] text-slate-400">Applied Rule</div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-1">
                        {simResult.sourcePriceListName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{simResult.sourceRuleId}</div>
                    </div>
                  </div>

                  {/* Step-by-Step Audit Trail */}
                  <div>
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Resolution Audit Steps:</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 space-y-1.5 max-h-48 overflow-y-auto">
                      {simResult.auditTrail.map((step, idx) => (
                        <div key={idx} className={`leading-relaxed ${step.startsWith('[MATCH') ? 'text-emerald-400 font-bold' : step.startsWith('[Step 1 PASS') ? 'text-slate-500' : 'text-slate-300'}`}>
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">Click Execute to inspect price resolution.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: UNITS OF MEASURE (UOM) & CONVERSIONS */}
      {/* ========================================================================= */}
      {activeTab === 'uom' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interactive Calculator */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-500" />
                <span>Live UOM Conversion Engine</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={uomQty}
                    onChange={e => setUomQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">From Unit</label>
                    <select
                      value={uomFrom}
                      onChange={e => setUomFrom(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                    >
                      {uoms.map(u => (
                        <option key={u.id} value={u.code}>{u.code} ({u.name})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">To Unit</label>
                    <select
                      value={uomTo}
                      onChange={e => setUomTo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                    >
                      {uoms.map(u => (
                        <option key={u.id} value={u.code}>{u.code} ({u.name})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunUomConversion}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Convert Quantity</span>
                </button>

                {uomResult && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1 mt-2">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Calculation Result</div>
                    <div className="text-base font-bold font-mono text-blue-600 dark:text-blue-400">
                      {uomResult.convertedQuantity} {uomTo}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">{uomResult.formula}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Standard UOM Dictionary Table */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>Authoritative Units of Measure Dictionary ({uoms.length})</span>
              </h3>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3 text-center">Base UOM</th>
                      <th className="py-2.5 px-3 text-center">Decimals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {uoms.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{u.code}</td>
                        <td className="py-2 px-3 font-medium">{u.name}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">
                            {u.uomCategory}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500">{u.symbol}</td>
                        <td className="py-2 px-3 text-center">
                          {u.isBaseUom ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                              BASE
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-mono">{u.decimalPrecision}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ATTRIBUTES & SETS */}
      {/* ========================================================================= */}
      {activeTab === 'attributes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {attributes.map(attr => (
            <div key={attr.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{attr.name}</span>
                    <span className="font-mono text-xs text-blue-600 dark:text-blue-400">({attr.code})</span>
                  </h4>
                  {attr.nameAr && <div className="text-xs text-slate-400" dir="rtl">{attr.nameAr}</div>}
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {attr.valueType}
                </span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-400 uppercase">Allowed Values ({attr.allowedValues.length})</div>
                <div className="flex flex-wrap gap-2">
                  {attr.allowedValues.map(val => (
                    <div
                      key={val.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      {val.hexColor && (
                        <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: val.hexColor }} />
                      )}
                      <span>{val.label}</span>
                      <span className="text-[10px] font-mono text-slate-400">({val.code})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: BARCODES & SCANNER HUB */}
      {/* ========================================================================= */}
      {activeTab === 'barcodes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* EAN-13 Algorithm Validator */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Barcode className="w-4 h-4 text-blue-500" />
                <span>EAN-13 Modulo-10 Checksum Algorithm</span>
              </h3>

              <div className="space-y-2 text-xs">
                <label className="block font-semibold text-slate-600 dark:text-slate-400">13-Digit Barcode Input</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={eanCheckInput}
                    onChange={e => setEanCheckInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-sm font-bold"
                  />
                  <button
                    onClick={handleCheckEan}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs"
                  >
                    Validate
                  </button>
                </div>
                {eanValid !== null && (
                  <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    eanValid
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                  }`}>
                    {eanValid ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>{eanValid ? 'Valid EAN-13 Checksum Pass' : 'Invalid EAN-13 Checksum (Corrupted Check Digit)'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fast Barcode Resolver Simulator */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-500" />
                <span>Deterministic Scanner Lookup Hub</span>
              </h3>

              <div className="space-y-2 text-xs">
                <label className="block font-semibold text-slate-600 dark:text-slate-400">Scan Barcode (e.g. 628100293012)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testBarcode}
                    onChange={e => setTestBarcode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-sm font-bold"
                  />
                  <button
                    onClick={handleResolveBarcode}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs"
                  >
                    Resolve Item
                  </button>
                </div>

                {barcodeResolveResult && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs space-y-1">
                    {barcodeResolveResult.error ? (
                      <div className="text-rose-500 font-semibold">{barcodeResolveResult.error}</div>
                    ) : (
                      <>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          Product: {barcodeResolveResult.product?.name} ({barcodeResolveResult.product?.sku})
                        </div>
                        <div className="text-slate-500">Base UOM: {barcodeResolveResult.uom}</div>
                        <div className="text-slate-500 font-mono text-[11px]">
                          Type: {barcodeResolveResult.barcodeRecord.barcodeType} | Primary: {barcodeResolveResult.barcodeRecord.isPrimary ? 'YES' : 'NO'}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PHASE 3.2A QUALITY GATE & HARDENING SUITE */}
      {/* ========================================================================= */}
      {activeTab === 'hardening' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>Phase 3.2A Hardening & Quality Gate Suite</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                30 automated tests covering Master Data Lifecycle, Variant Matrices, EAN-13, UOM Conversions, 4-Tier Pricing & Phase 3.1 Regression
              </p>
            </div>
            <button
              onClick={handleRunHardeningSuite}
              disabled={runningHardening}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white rounded-lg font-semibold text-sm shadow-md transition-all"
            >
              {runningHardening ? <RotateCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{runningHardening ? 'Executing 30 Scenarios...' : 'Run 30-Scenario Quality Gate'}</span>
            </button>
          </div>

          {hardeningReport && (
            <div className="space-y-4">
              {/* Verdict Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                hardeningReport.verdict === 'APPROVED'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${hardeningReport.verdict === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                    {hardeningReport.verdict === 'APPROVED' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="font-bold text-base">
                      {hardeningReport.verdict === 'APPROVED' ? 'Phase 3.2A Quality Gate PASSED (30/30 PASS)' : 'Quality Gate FAILED'}
                    </div>
                    <div className="text-xs opacity-90">
                      Success Rate: {hardeningReport.successRate} | Phase 3.1 Regression: {hardeningReport.phase31RegressionPassed ? 'VERIFIED (20/20)' : 'FAILED'}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono text-xs">
                  <div>Timestamp: {new Date(hardeningReport.timestamp).toLocaleTimeString()}</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">{hardeningReport.passedCount} / {hardeningReport.totalScenarios} PASSED</div>
                </div>
              </div>

              {/* Scenarios List */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {hardeningReport.results.map(r => (
                    <div key={r.scenarioId} className="p-3.5 flex items-start justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">{r.scenarioId}</span>
                          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">{r.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {r.category}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{r.details}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-slate-400">{r.executionTimeMs}ms</span>
                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                          r.status === 'PASS'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: RETAIL PILOT ONBOARDING & SQLITE PERSISTENCE */}
      {/* ========================================================================= */}
      {activeTab === 'pilot_onboarding' && (
        <RetailPilotDeploymentHub />
      )}

      {/* ========================================================================= */}
      {/* CREATE PRODUCT MODAL */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Create New Product Master</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Product SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NET-SW-48G"
                    value={newProductForm.sku}
                    onChange={e => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Base UOM</label>
                  <select
                    value={newProductForm.baseUom}
                    onChange={e => setNewProductForm({ ...newProductForm, baseUom: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    {uoms.map(u => <option key={u.id} value={u.code}>{u.code} ({u.name})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Product Name (EN) *</label>
                <input
                  type="text"
                  required
                  placeholder="Enterprise 48-Port Managed Switch"
                  value={newProductForm.name}
                  onChange={e => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Product Name (AR)</label>
                <input
                  type="text"
                  placeholder="مبدل شبكة سحابي مدار 48 منفذ"
                  dir="rtl"
                  value={newProductForm.nameAr}
                  onChange={e => setNewProductForm({ ...newProductForm, nameAr: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Cost Price (SAR)</label>
                  <input
                    type="number"
                    value={newProductForm.baseCostPrice}
                    onChange={e => setNewProductForm({ ...newProductForm, baseCostPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Selling Price (SAR)</label>
                  <input
                    type="number"
                    value={newProductForm.baseSellingPrice}
                    onChange={e => setNewProductForm({ ...newProductForm, baseSellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs shadow-md"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
