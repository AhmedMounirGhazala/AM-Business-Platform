/**
 * AM ERP — Enterprise Master Data Services
 * Architecture Baseline: v2.8 (Phase 3.2A)
 * Canonical Master Data Services for Products, Variants, Attributes, UOMs, Barcodes, Tax Categories, and Audit.
 */

import {
  ProductTemplate,
  ProductVariant,
  AttributeDefinition,
  AttributeSet,
  AttributeValue,
  UOMCategory,
  UnitOfMeasure,
  UOMConversionRule,
  ProductBarcode,
  BarcodeType,
  TaxCategory,
  MasterDataAuditLog,
  MasterDataActionType,
  UOMCategoryType,
  MasterEntityBase
} from '../types/masterData';
import { InventoryItem } from '../types';

// ==================== SEED / IN-MEMORY STORE ====================

const INITIAL_TAX_CATEGORIES: TaxCategory[] = [
  {
    id: 'tax-cat-std',
    tenantId: 'ten-001',
    code: 'TAX_CAT_STD',
    name: 'Standard VAT Category (15%)',
    nameAr: 'الفئة القياسية لضريبة القيمة المضافة (15%)',
    description: 'Standard taxable supplies under VAT regulations',
    isExempt: false,
    isZeroRated: false,
    active: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'tax-cat-zero',
    tenantId: 'ten-001',
    code: 'TAX_CAT_ZERO',
    name: 'Zero-Rated VAT Category (0%)',
    nameAr: 'الفئة الصفرية لضريبة القيمة المضافة (0%)',
    description: 'Supplies taxed at 0% (Exports, qualifying medicines)',
    isExempt: false,
    isZeroRated: true,
    active: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'tax-cat-exempt',
    tenantId: 'ten-001',
    code: 'TAX_CAT_EXEMPT',
    name: 'VAT Exempt Category',
    nameAr: 'فئة معفاة من ضريبة القيمة المضافة',
    description: 'Exempt financial services, residential lease',
    isExempt: true,
    isZeroRated: false,
    active: true,
    createdAt: '2026-01-01T00:00:00Z'
  }
];

const INITIAL_UOM_CATEGORIES: UOMCategory[] = [
  { id: 'uom-cat-count', tenantId: 'ten-001', code: 'COUNT', name: 'Units / Count', nameAr: 'الوحدات والعدد', baseUomCode: 'PCS', active: true },
  { id: 'uom-cat-weight', tenantId: 'ten-001', code: 'WEIGHT', name: 'Mass & Weight', nameAr: 'الكتلة والوزن', baseUomCode: 'KG', active: true },
  { id: 'uom-cat-volume', tenantId: 'ten-001', code: 'VOLUME', name: 'Volume & Liquids', nameAr: 'الحجم والسوائل', baseUomCode: 'LTR', active: true },
  { id: 'uom-cat-length', tenantId: 'ten-001', code: 'LENGTH', name: 'Length & Distance', nameAr: 'الطول والمسافة', baseUomCode: 'MTR', active: true },
  { id: 'uom-cat-digital', tenantId: 'ten-001', code: 'DIGITAL', name: 'Digital & Licenses', nameAr: 'الرقمي والتراخيص', baseUomCode: 'LIC', active: true }
];

const INITIAL_UOMS: UnitOfMeasure[] = [
  { id: 'uom-pcs', tenantId: 'ten-001', code: 'PCS', name: 'Piece', nameAr: 'قطعة / حبة', symbol: 'pcs', uomCategory: 'COUNT', isBaseUom: true, decimalPrecision: 0, active: true },
  { id: 'uom-box', tenantId: 'ten-001', code: 'BOX', name: 'Box', nameAr: 'علبة / صندوق', symbol: 'box', uomCategory: 'COUNT', isBaseUom: false, decimalPrecision: 0, active: true },
  { id: 'uom-ctn', tenantId: 'ten-001', code: 'CTN', name: 'Carton', nameAr: 'كرتون', symbol: 'ctn', uomCategory: 'COUNT', isBaseUom: false, decimalPrecision: 0, active: true },
  { id: 'uom-doz', tenantId: 'ten-001', code: 'DOZ', name: 'Dozen', nameAr: 'درزن (12 حبة)', symbol: 'doz', uomCategory: 'COUNT', isBaseUom: false, decimalPrecision: 0, active: true },
  { id: 'uom-kg', tenantId: 'ten-001', code: 'KG', name: 'Kilogram', nameAr: 'كيلوجرام', symbol: 'kg', uomCategory: 'WEIGHT', isBaseUom: true, decimalPrecision: 3, active: true },
  { id: 'uom-g', tenantId: 'ten-001', code: 'G', name: 'Gram', nameAr: 'جرام', symbol: 'g', uomCategory: 'WEIGHT', isBaseUom: false, decimalPrecision: 2, active: true },
  { id: 'uom-ton', tenantId: 'ten-001', code: 'TON', name: 'Metric Ton', nameAr: 'طن متري', symbol: 'ton', uomCategory: 'WEIGHT', isBaseUom: false, decimalPrecision: 3, active: true },
  { id: 'uom-ltr', tenantId: 'ten-001', code: 'LTR', name: 'Liter', nameAr: 'لتر', symbol: 'L', uomCategory: 'VOLUME', isBaseUom: true, decimalPrecision: 3, active: true },
  { id: 'uom-ml', tenantId: 'ten-001', code: 'ML', name: 'Milliliter', nameAr: 'مليلتر', symbol: 'ml', uomCategory: 'VOLUME', isBaseUom: false, decimalPrecision: 2, active: true },
  { id: 'uom-mtr', tenantId: 'ten-001', code: 'MTR', name: 'Meter', nameAr: 'متر', symbol: 'm', uomCategory: 'LENGTH', isBaseUom: true, decimalPrecision: 2, active: true },
  { id: 'uom-cm', tenantId: 'ten-001', code: 'CM', name: 'Centimeter', nameAr: 'سنتيمتر', symbol: 'cm', uomCategory: 'LENGTH', isBaseUom: false, decimalPrecision: 2, active: true },
  { id: 'uom-lic', tenantId: 'ten-001', code: 'LIC', name: 'User License', nameAr: 'ترخيص مستخدم', symbol: 'lic', uomCategory: 'DIGITAL', isBaseUom: true, decimalPrecision: 0, active: true }
];

const INITIAL_CONVERSIONS: UOMConversionRule[] = [
  { id: 'uom-conv-1', tenantId: 'ten-001', uomCategory: 'COUNT', fromUom: 'BOX', toUom: 'PCS', operator: 'MULTIPLY', factor: 10, precision: 0, active: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'uom-conv-2', tenantId: 'ten-001', uomCategory: 'COUNT', fromUom: 'CTN', toUom: 'BOX', operator: 'MULTIPLY', factor: 5, precision: 0, active: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'uom-conv-3', tenantId: 'ten-001', uomCategory: 'COUNT', fromUom: 'DOZ', toUom: 'PCS', operator: 'MULTIPLY', factor: 12, precision: 0, active: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'uom-conv-4', tenantId: 'ten-001', uomCategory: 'WEIGHT', fromUom: 'G', toUom: 'KG', operator: 'DIVIDE', factor: 1000, precision: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'uom-conv-5', tenantId: 'ten-001', uomCategory: 'WEIGHT', fromUom: 'TON', toUom: 'KG', operator: 'MULTIPLY', factor: 1000, precision: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'uom-conv-6', tenantId: 'ten-001', uomCategory: 'VOLUME', fromUom: 'ML', toUom: 'LTR', operator: 'DIVIDE', factor: 1000, precision: 3, active: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'uom-conv-7', tenantId: 'ten-001', uomCategory: 'LENGTH', fromUom: 'CM', toUom: 'MTR', operator: 'DIVIDE', factor: 100, precision: 2, active: true, createdAt: '2026-01-01T00:00:00Z' }
];

const INITIAL_ATTRIBUTES: AttributeDefinition[] = [
  {
    id: 'attr-color',
    tenantId: 'ten-001',
    code: 'COLOR',
    name: 'Color',
    nameAr: 'اللون',
    valueType: 'COLOR_HEX',
    isRequired: false,
    active: true,
    allowedValues: [
      { id: 'val-col-blk', attributeCode: 'COLOR', code: 'BLK', label: 'Black', labelAr: 'أسود', hexColor: '#000000', displayOrder: 1, active: true },
      { id: 'val-col-wht', attributeCode: 'COLOR', code: 'WHT', label: 'White', labelAr: 'أبيض', hexColor: '#FFFFFF', displayOrder: 2, active: true },
      { id: 'val-col-blu', attributeCode: 'COLOR', code: 'BLU', label: 'Navy Blue', labelAr: 'أزرق كحلي', hexColor: '#000080', displayOrder: 3, active: true },
      { id: 'val-col-red', attributeCode: 'COLOR', code: 'RED', label: 'Crimson Red', labelAr: 'أحمر قرمزي', hexColor: '#DC143C', displayOrder: 4, active: true },
      { id: 'val-col-gry', attributeCode: 'COLOR', code: 'GRY', label: 'Space Gray', labelAr: 'رمادي فضائي', hexColor: '#808080', displayOrder: 5, active: true }
    ]
  },
  {
    id: 'attr-size',
    tenantId: 'ten-001',
    code: 'SIZE',
    name: 'Apparel Size',
    nameAr: 'المقاس',
    valueType: 'STRING',
    isRequired: false,
    active: true,
    allowedValues: [
      { id: 'val-sz-s', attributeCode: 'SIZE', code: 'S', label: 'Small', labelAr: 'صغير', displayOrder: 1, active: true },
      { id: 'val-sz-m', attributeCode: 'SIZE', code: 'M', label: 'Medium', labelAr: 'متوسط', displayOrder: 2, active: true },
      { id: 'val-sz-l', attributeCode: 'SIZE', code: 'L', label: 'Large', labelAr: 'كبير', displayOrder: 3, active: true },
      { id: 'val-sz-xl', attributeCode: 'SIZE', code: 'XL', label: 'Extra Large', labelAr: 'كبير جداً', displayOrder: 4, active: true }
    ]
  },
  {
    id: 'attr-storage',
    tenantId: 'ten-001',
    code: 'STORAGE',
    name: 'Internal Storage Capacity',
    nameAr: 'السعة التخزينية',
    valueType: 'STRING',
    isRequired: false,
    active: true,
    allowedValues: [
      { id: 'val-stg-128', attributeCode: 'STORAGE', code: '128GB', label: '128 GB', labelAr: '128 جيجابايت', displayOrder: 1, active: true },
      { id: 'val-stg-256', attributeCode: 'STORAGE', code: '256GB', label: '256 GB', labelAr: '256 جيجابايت', displayOrder: 2, active: true },
      { id: 'val-stg-512', attributeCode: 'STORAGE', code: '512GB', label: '512 GB', labelAr: '512 جيجابايت', displayOrder: 3, active: true },
      { id: 'val-stg-1tb', attributeCode: 'STORAGE', code: '1TB', label: '1 TB', labelAr: '1 تيرابايت', displayOrder: 4, active: true }
    ]
  },
  {
    id: 'attr-ram',
    tenantId: 'ten-001',
    code: 'RAM',
    name: 'RAM Memory',
    nameAr: 'ذاكرة الوصول العشوائي',
    valueType: 'STRING',
    isRequired: false,
    active: true,
    allowedValues: [
      { id: 'val-ram-8', attributeCode: 'RAM', code: '8GB', label: '8 GB RAM', labelAr: '8 جيجابايت رام', displayOrder: 1, active: true },
      { id: 'val-ram-16', attributeCode: 'RAM', code: '16GB', label: '16 GB RAM', labelAr: '16 جيجابايت رام', displayOrder: 2, active: true },
      { id: 'val-ram-32', attributeCode: 'RAM', code: '32GB', label: '32 GB RAM', labelAr: '32 جيجابايت رام', displayOrder: 3, active: true }
    ]
  }
];

const INITIAL_ATTRIBUTE_SETS: AttributeSet[] = [
  {
    id: 'attr-set-apparel',
    tenantId: 'ten-001',
    code: 'APPAREL_SET',
    name: 'Apparel & Fashion (Color + Size)',
    nameAr: 'الملابس والأزياء (اللون + المقاس)',
    attributeCodes: ['COLOR', 'SIZE'],
    active: true
  },
  {
    id: 'attr-set-mobile',
    tenantId: 'ten-001',
    code: 'SMARTPHONE_SET',
    name: 'Smartphone Specs (Color + Storage + RAM)',
    nameAr: 'مواصفات الهواتف (اللون + السعة + الرام)',
    attributeCodes: ['COLOR', 'STORAGE', 'RAM'],
    active: true
  }
];

const INITIAL_PRODUCTS: ProductTemplate[] = [
  {
    id: 'prod-001',
    tenantId: 'ten-001',
    sku: 'HW-SRV-01',
    name: 'Enterprise Edge Server Blade Gen11',
    nameAr: 'خادم حوسبة طرفية نصلية - الجيل الحادي عشر',
    description: 'High-density 1U dual-socket compute blade with redundant power supplies',
    productType: 'STOCK',
    categoryId: 'cat-01',
    categoryName: 'Hardware & Infrastructure',
    brandId: 'brd-01',
    brandName: 'EdgeComputing Global',
    taxCategoryId: 'tax-cat-std',
    baseUom: 'PCS',
    purchaseUom: 'PCS',
    salesUom: 'PCS',
    trackingPolicy: 'SERIAL',
    baseCostPrice: 18500,
    baseSellingPrice: 26000,
    minSellingPrice: 22000,
    reorderPoint: 10,
    safetyStockQty: 4,
    maxStockQty: 50,
    leadTimeDays: 14,
    defaultWarehouseId: 'wh-001',
    isConfigurable: false,
    active: true,
    version: 1,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'prod-002',
    tenantId: 'ten-001',
    sku: 'SW-ERP-USR',
    name: 'AM ERP Enterprise Perpetual License',
    nameAr: 'ترخيص نظام إيه إم لإدارة الموارد - دائم',
    description: 'Per-seat perpetual license for AM Enterprise ERP with full module access',
    productType: 'SERVICE',
    categoryId: 'cat-02',
    categoryName: 'Software Licenses',
    brandId: 'brd-02',
    brandName: 'AM Platform',
    taxCategoryId: 'tax-cat-std',
    baseUom: 'LIC',
    purchaseUom: 'LIC',
    salesUom: 'LIC',
    trackingPolicy: 'STANDARD',
    baseCostPrice: 4500,
    baseSellingPrice: 12000,
    minSellingPrice: 9500,
    reorderPoint: 0,
    isConfigurable: false,
    active: true,
    version: 1,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'prod-003',
    tenantId: 'ten-001',
    sku: 'APP-POLO-01',
    name: 'Executive Cotton Pique Polo Shirt',
    nameAr: 'قميص بولو قطني تنفيذي فاخر',
    description: '100% Egyptian Giza Cotton breathable executive polo shirt',
    productType: 'STOCK',
    categoryId: 'cat-03',
    categoryName: 'Apparel & Uniforms',
    brandId: 'brd-03',
    brandName: 'ExecutiveWear',
    taxCategoryId: 'tax-cat-std',
    baseUom: 'PCS',
    purchaseUom: 'CTN',
    salesUom: 'PCS',
    trackingPolicy: 'STANDARD',
    baseCostPrice: 65,
    baseSellingPrice: 160,
    minSellingPrice: 130,
    reorderPoint: 50,
    safetyStockQty: 20,
    isConfigurable: true,
    attributeSetCode: 'APPAREL_SET',
    active: true,
    version: 1,
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-15T09:00:00Z'
  },
  {
    id: 'prod-004',
    tenantId: 'ten-001',
    sku: 'MOB-PRO-5G',
    name: 'AM Ultra Smartphone 5G Pro',
    nameAr: 'هاتف ذكي إيه إم ألترا 5G برو',
    description: 'Flagship enterprise smartphone with hardware biometric cryptographic security',
    productType: 'STOCK',
    categoryId: 'cat-04',
    categoryName: 'Mobile & Electronics',
    brandId: 'brd-04',
    brandName: 'AM Devices',
    taxCategoryId: 'tax-cat-std',
    baseUom: 'PCS',
    purchaseUom: 'BOX',
    salesUom: 'PCS',
    trackingPolicy: 'SERIAL',
    baseCostPrice: 2800,
    baseSellingPrice: 4200,
    minSellingPrice: 3800,
    reorderPoint: 25,
    safetyStockQty: 10,
    isConfigurable: true,
    attributeSetCode: 'SMARTPHONE_SET',
    active: true,
    version: 1,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  }
];

const INITIAL_VARIANTS: ProductVariant[] = [
  {
    id: 'var-polo-blk-m',
    tenantId: 'ten-001',
    productId: 'prod-003',
    baseProductSku: 'APP-POLO-01',
    sku: 'APP-POLO-01-BLK-M',
    variantName: 'Executive Cotton Polo - Black / Medium',
    variantNameAr: 'قميص بولو تنفيذي - أسود / مقاس M',
    attributeValues: { COLOR: 'BLK', SIZE: 'M' },
    barcode: '628100551011',
    stockQty: 45,
    active: true,
    createdAt: '2026-01-15T09:30:00Z'
  },
  {
    id: 'var-polo-blk-l',
    tenantId: 'ten-001',
    productId: 'prod-003',
    baseProductSku: 'APP-POLO-01',
    sku: 'APP-POLO-01-BLK-L',
    variantName: 'Executive Cotton Polo - Black / Large',
    variantNameAr: 'قميص بولو تنفيذي - أسود / مقاس L',
    attributeValues: { COLOR: 'BLK', SIZE: 'L' },
    barcode: '628100551012',
    stockQty: 30,
    active: true,
    createdAt: '2026-01-15T09:30:00Z'
  },
  {
    id: 'var-polo-wht-m',
    tenantId: 'ten-001',
    productId: 'prod-003',
    baseProductSku: 'APP-POLO-01',
    sku: 'APP-POLO-01-WHT-M',
    variantName: 'Executive Cotton Polo - White / Medium',
    variantNameAr: 'قميص بولو تنفيذي - أبيض / مقاس M',
    attributeValues: { COLOR: 'WHT', SIZE: 'M' },
    barcode: '628100551013',
    stockQty: 50,
    active: true,
    createdAt: '2026-01-15T09:30:00Z'
  }
];

const INITIAL_BARCODES: ProductBarcode[] = [
  {
    id: 'bc-001',
    tenantId: 'ten-001',
    productId: 'prod-001',
    productSku: 'HW-SRV-01',
    barcode: '628100293012',
    barcodeType: 'CODE128',
    isPrimary: true,
    uomCode: 'PCS',
    active: true,
    createdAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'bc-002',
    tenantId: 'ten-001',
    productId: 'prod-002',
    productSku: 'SW-ERP-USR',
    barcode: '628100293043',
    barcodeType: 'CODE128',
    isPrimary: true,
    uomCode: 'LIC',
    active: true,
    createdAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'bc-003',
    tenantId: 'ten-001',
    productId: 'prod-003',
    productSku: 'APP-POLO-01',
    variantId: 'var-polo-blk-m',
    variantSku: 'APP-POLO-01-BLK-M',
    barcode: '628100551011',
    barcodeType: 'EAN13',
    isPrimary: true,
    uomCode: 'PCS',
    active: true,
    createdAt: '2026-01-15T09:30:00Z'
  }
];

const INITIAL_AUDIT_LOGS: MasterDataAuditLog[] = [];

// ==================== MASTER DATA SERVICES ====================

export class MasterDataService {
  private static products: ProductTemplate[] = [...INITIAL_PRODUCTS];
  private static variants: ProductVariant[] = [...INITIAL_VARIANTS];
  private static attributes: AttributeDefinition[] = [...INITIAL_ATTRIBUTES];
  private static attributeSets: AttributeSet[] = [...INITIAL_ATTRIBUTE_SETS];
  private static uomCategories: UOMCategory[] = [...INITIAL_UOM_CATEGORIES];
  private static uoms: UnitOfMeasure[] = [...INITIAL_UOMS];
  private static conversions: UOMConversionRule[] = [...INITIAL_CONVERSIONS];
  private static barcodes: ProductBarcode[] = [...INITIAL_BARCODES];
  private static taxCategories: TaxCategory[] = [...INITIAL_TAX_CATEGORIES];
  private static auditLogs: MasterDataAuditLog[] = [...INITIAL_AUDIT_LOGS];
  private static mutationListener?: (entityType: string, entity: any) => void;

  public static setMutationListener(listener: (entityType: string, entity: any) => void): void {
    this.mutationListener = listener;
  }

  public static hydrate(state: {
    products?: ProductTemplate[];
    variants?: ProductVariant[];
    attributes?: AttributeDefinition[];
    attributeSets?: AttributeSet[];
    uomCategories?: UOMCategory[];
    uoms?: UnitOfMeasure[];
    conversions?: UOMConversionRule[];
    barcodes?: ProductBarcode[];
    taxCategories?: TaxCategory[];
    auditLogs?: MasterDataAuditLog[];
  }): void {
    if (state.products && state.products.length > 0) this.products = [...state.products];
    if (state.variants && state.variants.length > 0) this.variants = [...state.variants];
    if (state.attributes && state.attributes.length > 0) this.attributes = [...state.attributes];
    if (state.attributeSets && state.attributeSets.length > 0) this.attributeSets = [...state.attributeSets];
    if (state.uomCategories && state.uomCategories.length > 0) this.uomCategories = [...state.uomCategories];
    if (state.uoms && state.uoms.length > 0) this.uoms = [...state.uoms];
    if (state.conversions && state.conversions.length > 0) this.conversions = [...state.conversions];
    if (state.barcodes && state.barcodes.length > 0) this.barcodes = [...state.barcodes];
    if (state.taxCategories && state.taxCategories.length > 0) this.taxCategories = [...state.taxCategories];
    if (state.auditLogs && state.auditLogs.length > 0) this.auditLogs = [...state.auditLogs];
  }

  public static exportState() {
    return {
      products: this.products,
      variants: this.variants,
      attributes: this.attributes,
      attributeSets: this.attributeSets,
      uomCategories: this.uomCategories,
      uoms: this.uoms,
      conversions: this.conversions,
      barcodes: this.barcodes,
      taxCategories: this.taxCategories,
      auditLogs: this.auditLogs
    };
  }

  // ---------- AUDIT LOGGING ----------
  public static logAudit(
    tenantId: string,
    action: MasterDataActionType,
    entityType: 'Product' | 'Variant' | 'Attribute' | 'UOM' | 'Barcode' | 'PriceList' | 'TaxCategory',
    entityId: string,
    entityCode: string,
    userId: string,
    userName: string,
    previousState?: any,
    newState?: any,
    changeReason?: string,
    companyId?: string,
    branchId?: string
  ): MasterDataAuditLog {
    const log: MasterDataAuditLog = {
      id: `mda-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      companyId,
      branchId,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      action,
      entityType,
      entityId,
      entityCode,
      previousState,
      newState,
      changeReason,
      correlationId: `CORR-MD-${Date.now()}`
    };
    this.auditLogs.unshift(log);
    if (this.mutationListener) {
      try {
        this.mutationListener(entityType, newState || { id: entityId, code: entityCode });
      } catch {}
    }
    return log;
  }

  public static getAuditLogs(tenantId: string): MasterDataAuditLog[] {
    return this.auditLogs.filter(l => l.tenantId === tenantId);
  }

  // ---------- TAX CATEGORIES ----------
  public static getTaxCategories(tenantId: string): TaxCategory[] {
    return this.taxCategories.filter(t => t.tenantId === tenantId && t.active);
  }

  // ---------- UOM & CONVERSION ENGINE ----------
  public static getUOMCategories(tenantId: string): UOMCategory[] {
    return this.uomCategories.filter(c => c.tenantId === tenantId && c.active);
  }

  public static getUOMs(tenantId: string): UnitOfMeasure[] {
    return this.uoms.filter(u => u.tenantId === tenantId && u.active);
  }

  public static getUOMConversions(tenantId: string): UOMConversionRule[] {
    return this.conversions.filter(c => c.tenantId === tenantId && c.active);
  }

  public static addUOM(uom: Omit<UnitOfMeasure, 'id'>, userId: string): UnitOfMeasure {
    const normalizedCode = uom.code.trim().toUpperCase();
    if (this.uoms.some(u => u.tenantId === uom.tenantId && u.code === normalizedCode && u.active)) {
      throw new Error(`UOM code '${normalizedCode}' already exists for this tenant.`);
    }

    const newUom: UnitOfMeasure = {
      ...uom,
      id: `uom-${Date.now()}`,
      code: normalizedCode
    };

    this.uoms.push(newUom);
    this.logAudit(uom.tenantId, 'CREATE', 'UOM', newUom.id, newUom.code, userId, 'Admin User', undefined, newUom);
    return newUom;
  }

  public static addUOMConversion(conv: Omit<UOMConversionRule, 'id' | 'createdAt'>, userId: string): UOMConversionRule {
    if (conv.factor <= 0) {
      throw new Error('Conversion factor must be greater than zero.');
    }
    if (conv.fromUom === conv.toUom) {
      throw new Error('From UOM and To UOM cannot be the same unit.');
    }

    const fromObj = this.uoms.find(u => u.tenantId === conv.tenantId && u.code === conv.fromUom);
    const toObj = this.uoms.find(u => u.tenantId === conv.tenantId && u.code === conv.toUom);

    if (!fromObj || !toObj) {
      throw new Error(`Invalid UOM codes: ${conv.fromUom} or ${conv.toUom} not found.`);
    }

    if (fromObj.uomCategory !== toObj.uomCategory && !conv.itemSpecificSku) {
      throw new Error(`Incompatible UOM conversion: Cannot convert ${fromObj.uomCategory} (${fromObj.code}) to ${toObj.uomCategory} (${toObj.code}) without SKU-specific density rule.`);
    }

    const newRule: UOMConversionRule = {
      ...conv,
      id: `uom-conv-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    this.conversions.push(newRule);
    this.logAudit(conv.tenantId, 'CREATE', 'UOM', newRule.id, `${newRule.fromUom}->${newRule.toUom}`, userId, 'Admin User', undefined, newRule);
    return newRule;
  }

  /**
   * Authoritative UOM Conversion Engine
   * Supports direct and transitive conversions with precision-safe rounding
   */
  public static convertQuantity(
    fromUomCode: string,
    toUomCode: string,
    quantity: number,
    tenantId: string = 'ten-001',
    itemSku?: string
  ): { convertedQuantity: number; factorUsed: number; formula: string; precision: number } {
    if (fromUomCode === toUomCode) {
      return { convertedQuantity: quantity, factorUsed: 1, formula: `${quantity} ${fromUomCode} = ${quantity} ${toUomCode}`, precision: 2 };
    }

    const fromUom = this.uoms.find(u => u.tenantId === tenantId && u.code === fromUomCode);
    const toUom = this.uoms.find(u => u.tenantId === tenantId && u.code === toUomCode);

    if (!fromUom || !toUom) {
      throw new Error(`UOM resolution error: ${fromUomCode} or ${toUomCode} not found in tenant dictionary.`);
    }

    if (fromUom.uomCategory !== toUom.uomCategory && !itemSku) {
      throw new Error(`Incompatible UOM conversion: Cannot convert ${fromUom.uomCategory} (${fromUomCode}) to ${toUom.uomCategory} (${toUomCode}).`);
    }

    // 1. Direct match
    const directRule = this.conversions.find(
      c => c.tenantId === tenantId && c.active && c.fromUom === fromUomCode && c.toUom === toUomCode && (!itemSku || !c.itemSpecificSku || c.itemSpecificSku === itemSku)
    );

    if (directRule) {
      const rawVal = directRule.operator === 'MULTIPLY' ? quantity * directRule.factor : quantity / directRule.factor;
      const rounded = Number(rawVal.toFixed(toUom.decimalPrecision));
      return {
        convertedQuantity: rounded,
        factorUsed: directRule.factor,
        formula: `${quantity} ${fromUomCode} ${directRule.operator === 'MULTIPLY' ? '×' : '÷'} ${directRule.factor} = ${rounded} ${toUomCode}`,
        precision: toUom.decimalPrecision
      };
    }

    // 2. Inverse direct match
    const inverseRule = this.conversions.find(
      c => c.tenantId === tenantId && c.active && c.fromUom === toUomCode && c.toUom === fromUomCode && (!itemSku || !c.itemSpecificSku || c.itemSpecificSku === itemSku)
    );

    if (inverseRule) {
      const rawVal = inverseRule.operator === 'MULTIPLY' ? quantity / inverseRule.factor : quantity * inverseRule.factor;
      const rounded = Number(rawVal.toFixed(toUom.decimalPrecision));
      return {
        convertedQuantity: rounded,
        factorUsed: 1 / inverseRule.factor,
        formula: `${quantity} ${fromUomCode} (Inverse) = ${rounded} ${toUomCode}`,
        precision: toUom.decimalPrecision
      };
    }

    // 3. Multi-step Transitive Graph Search (BFS)
    interface QueueItem {
      uom: string;
      currentQty: number;
      factorProduct: number;
      path: { uom: string; qty: number }[];
    }

    const queue: QueueItem[] = [
      { uom: fromUomCode, currentQty: quantity, factorProduct: 1, path: [{ uom: fromUomCode, qty: quantity }] }
    ];
    const visited = new Set<string>([fromUomCode]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.uom === toUomCode) {
        const rounded = Number(current.currentQty.toFixed(toUom.decimalPrecision));
        const formula = current.path.map(p => `${p.qty} ${p.uom}`).join(' → ');
        return {
          convertedQuantity: rounded,
          factorUsed: current.factorProduct,
          formula: `${formula} = ${rounded} ${toUomCode}`,
          precision: toUom.decimalPrecision
        };
      }

      // Find all adjacent conversion edges
      for (const rule of this.conversions) {
        if (!rule.active || rule.tenantId !== tenantId) continue;
        if (itemSku && rule.itemSpecificSku && rule.itemSpecificSku !== itemSku) continue;

        // Forward edge
        if (rule.fromUom === current.uom && !visited.has(rule.toUom)) {
          visited.add(rule.toUom);
          const nextQty = rule.operator === 'MULTIPLY' ? current.currentQty * rule.factor : current.currentQty / rule.factor;
          const edgeFactor = rule.operator === 'MULTIPLY' ? rule.factor : 1 / rule.factor;
          queue.push({
            uom: rule.toUom,
            currentQty: nextQty,
            factorProduct: current.factorProduct * edgeFactor,
            path: [...current.path, { uom: rule.toUom, qty: nextQty }]
          });
        }

        // Reverse / Inverse edge
        if (rule.toUom === current.uom && !visited.has(rule.fromUom)) {
          visited.add(rule.fromUom);
          const nextQty = rule.operator === 'MULTIPLY' ? current.currentQty / rule.factor : current.currentQty * rule.factor;
          const edgeFactor = rule.operator === 'MULTIPLY' ? 1 / rule.factor : rule.factor;
          queue.push({
            uom: rule.fromUom,
            currentQty: nextQty,
            factorProduct: current.factorProduct * edgeFactor,
            path: [...current.path, { uom: rule.fromUom, qty: nextQty }]
          });
        }
      }
    }

    throw new Error(`No valid conversion pathway found from ${fromUomCode} to ${toUomCode}.`);
  }

  // ---------- ATTRIBUTE SYSTEM ----------
  public static getAttributes(tenantId: string): AttributeDefinition[] {
    return this.attributes.filter(a => a.tenantId === tenantId && a.active);
  }

  public static getAttributeSets(tenantId: string): AttributeSet[] {
    return this.attributeSets.filter(s => s.tenantId === tenantId && s.active);
  }

  public static createAttribute(attr: Omit<AttributeDefinition, 'id' | 'createdAt'>, userId: string): AttributeDefinition {
    const code = attr.code.trim().toUpperCase();
    if (this.attributes.some(a => a.tenantId === attr.tenantId && a.code === code && a.active)) {
      throw new Error(`Attribute with code '${code}' already exists.`);
    }

    const newAttr: AttributeDefinition = {
      ...attr,
      id: `attr-${Date.now()}`,
      code,
      createdAt: new Date().toISOString()
    };

    this.attributes.push(newAttr);
    this.logAudit(attr.tenantId, 'CREATE', 'Attribute', newAttr.id, newAttr.code, userId, 'Admin User', undefined, newAttr);
    return newAttr;
  }

  public static createAttributeSet(set: Omit<AttributeSet, 'id' | 'createdAt'>, userId: string): AttributeSet {
    const code = set.code.trim().toUpperCase();
    if (this.attributeSets.some(s => s.tenantId === set.tenantId && s.code === code && s.active)) {
      throw new Error(`Attribute Set with code '${code}' already exists.`);
    }

    const newSet: AttributeSet = {
      ...set,
      id: `attr-set-${Date.now()}`,
      code,
      createdAt: new Date().toISOString()
    };

    this.attributeSets.push(newSet);
    this.logAudit(set.tenantId, 'CREATE', 'Attribute', newSet.id, newSet.code, userId, 'Admin User', undefined, newSet);
    return newSet;
  }

  // ---------- VARIANT GENERATION ENGINE ----------
  /**
   * Deterministic Cartesian Variant Generator
   * Computes V1 × V2 × ... × Vn combinations with safety caps and duplicate prevention.
   */
  public static generateVariantMatrix(
    baseProductSku: string,
    selectedDimensions: { attributeCode: string; selectedValueCodes: string[] }[],
    tenantId: string = 'ten-001',
    options?: { forceOverrideSafetyCap?: boolean; customPriceOverrides?: Record<string, number> }
  ): {
    previewVariants: ProductVariant[];
    totalCombinations: number;
    warningMessage?: string;
  } {
    const product = this.products.find(p => p.tenantId === tenantId && p.sku === baseProductSku);
    if (!product) {
      throw new Error(`Product with SKU '${baseProductSku}' not found.`);
    }

    const validDimensions = selectedDimensions.filter(d => d.selectedValueCodes && d.selectedValueCodes.length > 0);
    if (validDimensions.length === 0) {
      return { previewVariants: [], totalCombinations: 0 };
    }

    // Cartesian product algorithm
    let combinations: Record<string, string>[] = [{}];
    for (const dim of validDimensions) {
      const nextLevel: Record<string, string>[] = [];
      for (const existingComb of combinations) {
        for (const valCode of dim.selectedValueCodes) {
          nextLevel.push({ ...existingComb, [dim.attributeCode]: valCode });
        }
      }
      combinations = nextLevel;
    }

    const totalCombinations = combinations.length;

    // Safety checks
    if (totalCombinations > 500 && !options?.forceOverrideSafetyCap) {
      throw new Error(`Safety Cap Exceeded: Requested generation of ${totalCombinations} variants exceeds the 500 variant limit. Please refine your selections or provide explicit override.`);
    }

    let warningMessage: string | undefined;
    if (totalCombinations > 100) {
      warningMessage = `High Variant Volume Warning: Generating ${totalCombinations} variants may increase database load.`;
    }

    // Existing variants map for duplicate prevention
    const existingSkuSet = new Set(this.variants.filter(v => v.tenantId === tenantId && v.baseProductSku === baseProductSku).map(v => v.sku));

    const previewVariants: ProductVariant[] = combinations.map((comb, index) => {
      // Deterministic SKU formatting: BASESKU-VAL1-VAL2...
      const suffix = Object.keys(comb).sort().map(k => comb[k]).join('-');
      const variantSku = `${product.sku}-${suffix}`.toUpperCase().replace(/\s+/g, '_');
      
      const isDuplicate = existingSkuSet.has(variantSku);
      const nameSuffix = Object.keys(comb).sort().map(k => comb[k]).join(' / ');

      return {
        id: `var-gen-${Date.now()}-${index}`,
        tenantId,
        productId: product.id,
        baseProductSku: product.sku,
        sku: variantSku,
        variantName: `${product.name} - ${nameSuffix}`,
        variantNameAr: product.nameAr ? `${product.nameAr} - ${nameSuffix}` : undefined,
        attributeValues: comb,
        barcode: `628${Math.floor(100000000 + Math.random() * 900000000)}`,
        costPriceOverride: product.baseCostPrice,
        sellingPriceOverride: options?.customPriceOverrides?.[variantSku] || product.baseSellingPrice,
        stockQty: 0,
        active: !isDuplicate,
        createdAt: new Date().toISOString()
      };
    });

    return { previewVariants, totalCombinations, warningMessage };
  }

  public static commitGeneratedVariants(variants: ProductVariant[], userId: string): ProductVariant[] {
    const committed: ProductVariant[] = [];

    for (const v of variants) {
      const existing = this.variants.find(existingV => existingV.tenantId === v.tenantId && existingV.sku === v.sku);
      if (!existing) {
        this.variants.push(v);
        committed.push(v);

        // Auto-register primary barcode if present
        if (v.barcode) {
          this.barcodes.push({
            id: `bc-var-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            tenantId: v.tenantId,
            productId: v.productId,
            productSku: v.baseProductSku,
            variantId: v.id,
            variantSku: v.sku,
            barcode: v.barcode,
            barcodeType: 'EAN13',
            isPrimary: true,
            uomCode: 'PCS',
            active: true,
            createdAt: new Date().toISOString()
          });
        }

        this.logAudit(v.tenantId, 'VARIANT_GENERATE', 'Variant', v.id, v.sku, userId, 'Admin User', undefined, v);
      }
    }

    return committed;
  }

  // ---------- BARCODE SYSTEM ----------
  public static validateEan13(barcode: string): boolean {
    if (!/^\d{13}$/.test(barcode)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(barcode[i], 10);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(barcode[12], 10);
  }

  public static getBarcodes(tenantId: string): ProductBarcode[] {
    return this.barcodes.filter(b => b.tenantId === tenantId && b.active);
  }

  public static registerBarcode(bc: Omit<ProductBarcode, 'id' | 'createdAt'>, userId: string): ProductBarcode {
    const rawBarcode = bc.barcode.trim();
    if (bc.barcodeType === 'EAN13' && !this.validateEan13(rawBarcode)) {
      throw new Error(`Invalid EAN-13 barcode: Checksum validation failed for '${rawBarcode}'.`);
    }

    // Uniqueness within tenant
    if (this.barcodes.some(b => b.tenantId === bc.tenantId && b.barcode === rawBarcode && b.active)) {
      throw new Error(`Barcode '${rawBarcode}' is already registered to another item in this tenant.`);
    }

    const newBc: ProductBarcode = {
      ...bc,
      id: `bc-${Date.now()}`,
      barcode: rawBarcode,
      createdAt: new Date().toISOString()
    };

    this.barcodes.push(newBc);
    this.logAudit(bc.tenantId, 'CREATE', 'Barcode', newBc.id, newBc.barcode, userId, 'Admin User', undefined, newBc);
    return newBc;
  }

  public static resolveBarcode(barcode: string, tenantId: string = 'ten-001'): {
    product?: ProductTemplate;
    variant?: ProductVariant;
    barcodeRecord: ProductBarcode;
    uom: string;
  } {
    const clean = barcode.trim();
    const bcRecord = this.barcodes.find(b => b.tenantId === tenantId && b.barcode === clean && b.active);
    if (!bcRecord) {
      throw new Error(`Barcode '${clean}' not found in tenant catalog.`);
    }

    const product = this.products.find(p => p.tenantId === tenantId && p.sku === bcRecord.productSku);
    const variant = bcRecord.variantSku ? this.variants.find(v => v.tenantId === tenantId && v.sku === bcRecord.variantSku) : undefined;

    return {
      product,
      variant,
      barcodeRecord: bcRecord,
      uom: bcRecord.uomCode || product?.baseUom || 'PCS'
    };
  }

  // ---------- PRODUCT MASTER CRUD ----------
  public static getProducts(
    tenantId: string,
    filters?: { categoryId?: string; search?: string; activeOnly?: boolean }
  ): ProductTemplate[] {
    return this.products.filter(p => {
      if (p.tenantId !== tenantId) return false;
      if (filters?.activeOnly && !p.active) return false;
      if (filters?.categoryId && p.categoryId !== filters.categoryId) return false;
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesName = p.name.toLowerCase().includes(q) || (p.nameAr && p.nameAr.toLowerCase().includes(q));
        if (!matchesSku && !matchesName) return false;
      }
      return true;
    });
  }

  public static getProductById(id: string, tenantId: string): ProductTemplate | undefined {
    const product = this.products.find(p => p.id === id && p.tenantId === tenantId);
    if (!product) return undefined;

    // Attach current variants and barcodes
    const productVariants = this.variants.filter(v => v.tenantId === tenantId && v.productId === product.id && v.active);
    const productBarcodes = this.barcodes.filter(b => b.tenantId === tenantId && b.productId === product.id && b.active);

    return {
      ...product,
      variants: productVariants,
      barcodes: productBarcodes
    };
  }

  public static createProduct(prod: Omit<ProductTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>, userId: string): ProductTemplate {
    const normalizedSku = prod.sku.trim().toUpperCase();
    if (!normalizedSku) {
      throw new Error('Product SKU is required.');
    }

    // Uniqueness includes inactive records per tenant
    if (this.products.some(p => p.tenantId === prod.tenantId && p.sku.toUpperCase() === normalizedSku)) {
      throw new Error(`SKU collision: Product SKU '${normalizedSku}' is already registered (or previously deactivated) in this tenant.`);
    }

    const newProduct: ProductTemplate = {
      ...prod,
      id: `prod-${Date.now()}`,
      sku: normalizedSku,
      version: 1,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.products.push(newProduct);
    this.logAudit(prod.tenantId, 'CREATE', 'Product', newProduct.id, newProduct.sku, userId, 'Admin User', undefined, newProduct);
    return newProduct;
  }

  public static updateProduct(id: string, updates: Partial<ProductTemplate>, userId: string): ProductTemplate {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Product with ID '${id}' not found.`);
    }

    const current = this.products[index];
    if (updates.sku && updates.sku.trim().toUpperCase() !== current.sku) {
      const newSku = updates.sku.trim().toUpperCase();
      if (this.products.some(p => p.tenantId === current.tenantId && p.id !== id && p.sku.toUpperCase() === newSku)) {
        throw new Error(`Cannot rename SKU: '${newSku}' is already taken.`);
      }
    }

    const previousState = { ...current };
    const updated: ProductTemplate = {
      ...current,
      ...updates,
      sku: updates.sku ? updates.sku.trim().toUpperCase() : current.sku,
      version: current.version + 1,
      updatedAt: new Date().toISOString()
    };

    this.products[index] = updated;
    this.logAudit(current.tenantId, 'UPDATE', 'Product', updated.id, updated.sku, userId, 'Admin User', previousState, updated);
    return updated;
  }

  public static deactivateProduct(id: string, userId: string, reason?: string): ProductTemplate {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Product with ID '${id}' not found.`);
    }

    const current = this.products[index];
    const previousState = { ...current };
    current.active = false;
    current.version += 1;
    current.updatedAt = new Date().toISOString();

    this.logAudit(current.tenantId, 'DEACTIVATE', 'Product', current.id, current.sku, userId, 'Admin User', previousState, current, reason || 'Logical Deactivation');
    return current;
  }
}
