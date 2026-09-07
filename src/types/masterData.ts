/**
 * AM ERP — Enterprise Master Data & Pricing Types
 * Architecture Baseline: v2.8 (Phase 3.2A)
 * Canonical Master Data interfaces for Products, Variants, Attributes, UOMs, Barcodes, Tax Categories, and Pricing.
 */

export interface MasterEntityBase {
  id: string;
  tenantId: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== ATTRIBUTE SYSTEM ====================

export type AttributeValueType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'COLOR_HEX';

export interface AttributeValue {
  id: string;
  attributeCode: string;
  code: string;
  label: string;
  labelAr?: string;
  numericValue?: number;
  hexColor?: string;
  displayOrder: number;
  active: boolean;
}

export interface AttributeDefinition extends MasterEntityBase {
  code: string;
  name: string;
  nameAr?: string;
  valueType: AttributeValueType;
  allowedValues: AttributeValue[];
  isRequired?: boolean;
  active: boolean;
}

export interface AttributeSet extends MasterEntityBase {
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  attributeCodes: string[];
  active: boolean;
}

export interface ProductAttributeAssignment {
  attributeCode: string;
  attributeValueCode: string;
  customValue?: string;
}

// ==================== UNIT OF MEASURE (UOM) ====================

export type UOMCategoryType = 'COUNT' | 'WEIGHT' | 'VOLUME' | 'LENGTH' | 'TIME' | 'AREA' | 'DIGITAL';

export interface UOMCategory {
  id: string;
  tenantId: string;
  code: UOMCategoryType;
  name: string;
  nameAr: string;
  baseUomCode: string;
  description?: string;
  active: boolean;
}

export interface UnitOfMeasure {
  id: string;
  tenantId: string;
  code: string; // e.g. PCS, KG, G, LTR, MTR, BOX, CTN
  name: string;
  nameAr: string;
  symbol: string;
  uomCategory: UOMCategoryType;
  isBaseUom: boolean;
  decimalPrecision: number; // e.g. 0 for PCS, 3 for KG
  active: boolean;
}

export interface UOMConversionRule {
  id: string;
  tenantId: string;
  uomCategory: UOMCategoryType;
  fromUom: string;
  toUom: string;
  operator: 'MULTIPLY' | 'DIVIDE';
  factor: number; // e.g. 1 CTN = 24 PCS -> factor: 24, operator: 'MULTIPLY'
  precision: number;
  itemSpecificSku?: string; // Optional SKU-specific conversion (e.g. 1 Box of Item X = 12 PCS)
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ==================== BARCODE SYSTEM ====================

export type BarcodeType = 'EAN13' | 'EAN8' | 'UPCA' | 'CODE128' | 'QR' | 'GS1';

export interface ProductBarcode {
  id: string;
  tenantId: string;
  productId: string;
  productSku: string;
  variantId?: string;
  variantSku?: string;
  barcode: string;
  barcodeType: BarcodeType;
  isPrimary: boolean;
  uomCode?: string;
  packagingUnitId?: string;
  active: boolean;
  createdAt: string;
}

// ==================== TAX CLASSIFICATION ====================

export interface TaxCategory extends MasterEntityBase {
  code: string; // e.g. TAX_CAT_STD, TAX_CAT_ZERO, TAX_CAT_EXEMPT, TAX_CAT_REDUCED
  name: string;
  nameAr: string;
  description?: string;
  defaultSalesTaxRuleCode?: string;
  defaultPurchaseTaxRuleCode?: string;
  isExempt: boolean;
  isZeroRated: boolean;
  active: boolean;
}

// ==================== PRODUCT VARIANT ====================

export interface ProductVariant {
  id: string;
  tenantId: string;
  productId: string;
  baseProductSku: string;
  sku: string;
  variantName: string;
  variantNameAr?: string;
  attributeValues: Record<string, string>; // e.g. { COLOR: 'BLK', SIZE: 'M' }
  barcode?: string;
  multipleBarcodes?: string[];
  costPriceOverride?: number;
  sellingPriceOverride?: number;
  weightOverride?: number;
  dimensionsOverride?: string;
  stockQty?: number;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ==================== PRODUCT MASTER (CANONICAL TEMPLATE) ====================

export type ProductType = 'STOCK' | 'SERVICE' | 'NON_STOCK' | 'BUNDLE' | 'KIT' | 'RAW_MATERIAL';
export type TrackingPolicy = 'STANDARD' | 'SERIAL' | 'BATCH' | 'EXPIRY' | 'SERIAL_AND_BATCH';

export interface ProductTemplate extends MasterEntityBase {
  sku: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  productType: ProductType;
  categoryId: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  taxCategoryId: string;
  baseUom: string;
  purchaseUom?: string;
  salesUom?: string;
  trackingPolicy: TrackingPolicy;
  baseCostPrice: number;
  baseSellingPrice: number;
  minSellingPrice?: number;
  reorderPoint: number;
  safetyStockQty?: number;
  maxStockQty?: number;
  leadTimeDays?: number;
  defaultWarehouseId?: string;
  defaultBinLocationId?: string;
  isConfigurable: boolean; // Has variants
  attributeSetCode?: string;
  variants?: ProductVariant[];
  barcodes?: ProductBarcode[];
  active: boolean;
  version: number;
}

// ==================== ADVANCED PRICING ENGINE ====================

export type PriceListType = 'STANDARD_SALES' | 'WHOLESALE' | 'KEY_ACCOUNT' | 'PROMOTIONAL' | 'PURCHASE';
export type PricingPriorityTier = 1 | 2 | 3 | 4;
export type PricingPriorityName = 'CONTRACT' | 'CUSTOMER_TIER' | 'PROMOTION' | 'BASE_PRICE';

export interface PriceListHeader extends MasterEntityBase {
  code: string;
  name: string;
  nameAr?: string;
  type: PriceListType;
  currency: string;
  priority: number; // 1 to 100, higher number = higher precedence within same tier
  effectiveFrom: string;
  effectiveTo?: string;
  companyScope?: string[]; // Empty = Global in Tenant
  branchScope?: string[];
  customerGroupScope?: string[]; // e.g. 'WHOLESALE', 'RETAIL', 'VIP'
  isDefault: boolean;
  active: boolean;
}

export interface PriceListLine {
  id: string;
  tenantId: string;
  priceListId: string;
  itemSku: string;
  variantSku?: string;
  uom: string;
  minQuantity: number; // Quantity break threshold
  unitPrice: number;
  discountPercentage?: number;
  fixedDiscountAmount?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  active: boolean;
  createdAt: string;
}

export interface ContractPriceRule extends MasterEntityBase {
  customerId: string;
  customerName?: string;
  itemSku: string;
  variantSku?: string;
  contractNumber: string;
  contractPrice: number;
  currency: string;
  uom: string;
  minQuantity: number;
  maxQuantity?: number;
  effectiveFrom: string;
  effectiveTo: string;
  active: boolean;
}

export interface PricingRule {
  id: string;
  tenantId: string;
  name: string;
  priorityTier: PricingPriorityTier;
  priorityName: PricingPriorityName;
  customerSegment?: string;
  customerId?: string;
  itemSku?: string;
  variantSku?: string;
  priceListId?: string;
  minQty: number;
  unitPrice?: number;
  discountPercent?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  active: boolean;
}

export interface PriceCalculationParams {
  tenantId: string;
  companyId?: string;
  branchId?: string;
  itemSku: string;
  variantSku?: string;
  quantity: number;
  uom?: string;
  customerId?: string;
  customerGroup?: string;
  priceListId?: string;
  targetCurrency?: string;
  transactionDate?: string;
  baseUnitPrice?: number;
}

export interface ExplainablePricingResult {
  baseUnitPrice: number;
  finalUnitPrice: number;
  appliedDiscountPercent: number;
  appliedDiscountAmount: number;
  appliedPriority: PricingPriorityTier;
  appliedPriorityName: PricingPriorityName;
  sourceRuleId: string;
  sourcePriceListName?: string;
  currency: string;
  exchangeRateUsed: number;
  baseCurrencyPrice: number;
  quantityBreakApplied?: number;
  uomUsed: string;
  lineTotal: number;
  auditTrail: string[];
  calculatedAt: string;
}

// ==================== MASTER DATA AUDIT LOG ====================

export type MasterDataActionType = 'CREATE' | 'UPDATE' | 'DEACTIVATE' | 'PRICE_CHANGE' | 'VARIANT_GENERATE';

export interface MasterDataAuditLog {
  id: string;
  tenantId: string;
  companyId?: string;
  branchId?: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: MasterDataActionType;
  entityType: 'Product' | 'Variant' | 'Attribute' | 'UOM' | 'Barcode' | 'PriceList' | 'TaxCategory';
  entityId: string;
  entityCode: string;
  previousState?: any;
  newState?: any;
  changeReason?: string;
  correlationId?: string;
}
