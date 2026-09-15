/**
 * AM Business Platform — P0-06 Industry Vertical Runtime Types
 * Defines runtime structures for the 8 approved Pilot Industry Profiles:
 * 1. Commercial Trading / Distribution
 * 2. Restaurant / F&B
 * 3. Retail — Mobile Phones
 * 4. Retail — Women's Clothing
 * 5. Retail — Children's Clothing
 * 6. Manufacturing — Women's Apparel
 * 7. Manufacturing — Men's Apparel
 * 8. Manufacturing — Children's Apparel
 */

// ============================================================================
// 1. INDUSTRY PROFILE FRAMEWORK DEFINITION
// ============================================================================

export type PilotIndustryProfileId =
  | 'COMMERCIAL_DISTRIBUTION'
  | 'RESTAURANT_FNB'
  | 'RETAIL_MOBILE_PHONES'
  | 'RETAIL_WOMENS_CLOTHING'
  | 'RETAIL_CHILDRENS_CLOTHING'
  | 'MFG_WOMENS_APPAREL'
  | 'MFG_MENS_APPAREL'
  | 'MFG_CHILDRENS_APPAREL';

export type IndustryFamily =
  | 'COMMERCE_DISTRIBUTION'
  | 'HOSPITALITY_FNB'
  | 'RETAIL_SPECIALTY'
  | 'RETAIL_FASHION'
  | 'MANUFACTURING_APPAREL';

export type BusinessModelType = 'B2B' | 'B2C' | 'HYBRID_B2B_B2C' | 'MAKE_TO_ORDER' | 'MAKE_TO_STOCK';

export interface ProfileCoaAccountTemplate {
  code: string;
  name: string;
  nameAr: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  category: string;
  description: string;
}

export interface OperationalKpiDefinition {
  id: string;
  name: string;
  nameAr: string;
  calculationMethod: string;
  targetDirection: 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER' | 'RANGE';
  unit: 'PERCENT' | 'CURRENCY' | 'COUNT' | 'DAYS' | 'HOURS';
}

export interface DynamicWizardStepDefinition {
  stepNumber: number;
  stepKey: string;
  title: string;
  titleAr: string;
  description: string;
  isRequired: boolean;
  fields: {
    key: string;
    label: string;
    labelAr: string;
    type: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTI_SELECT' | 'BOOLEAN' | 'TABLE_BUILDER';
    defaultValue?: any;
    options?: { label: string; value: any }[];
    required: boolean;
  }[];
}

export interface IndustryProfileDefinition {
  profileId: PilotIndustryProfileId;
  name: string;
  nameAr: string;
  family: IndustryFamily;
  businessModel: BusinessModelType;
  requiredModules: string[];
  optionalModules: string[];
  requiredMasters: string[];
  requiredAttributes: string[];
  requiredDocuments: string[];
  requiredWorkflows: string[];
  inventoryModel: 'PERIODIC' | 'PERPETUAL_FIFO' | 'PERPETUAL_AVCO' | 'SERIAL_IMEI' | 'VARIANT_MATRIX' | 'LOT_BATCH';
  costingModel: 'STANDARD_COST' | 'MOVING_AVERAGE' | 'ACTUAL_JOB_ORDER' | 'RECIPE_THEORETICAL_ACTUAL' | 'PIECE_RATE_LABOUR';
  revenueModel: 'POS_CHECKOUT' | 'TABLE_SERVICE' | 'TERRITORY_WHOLESALE' | 'JOB_CARD_BILLING' | 'RETAIL_STORE';
  purchasingModel: 'STANDARD_PO' | 'FRESH_PERISHABLE_DAILY' | 'SEASONAL_BULK' | 'TRADE_IN_PURCHASE' | 'FABRIC_TRIM_CONTRACT';
  salesModel: 'DIRECT_RETAIL' | 'DISTRIBUTION_ROUTE' | 'DINE_IN_TAKEAWAY' | 'SPECIALTY_DEVICE' | 'MADE_TO_MEASURE';
  productionModel?: 'DISCRETE_JOB' | 'APPAREL_CUT_AND_SEW' | 'RECIPE_ASSEMBLY';
  warehouseModel: 'CENTRAL_DISTRIBUTION' | 'KITCHEN_PANTRY' | 'RETAIL_BACKSTORE' | 'FABRIC_ROLL_STORAGE';
  pricingModel: 'LIST_PRICE' | 'WHOLESALE_TIERED' | 'SEASONAL_MARKDOWN' | 'PROMO_BUY_X_GET_Y' | 'PORTION_PRICING';
  taxConfiguration: {
    recommendedJurisdiction: string;
    standardVatRate: number;
    withholdingTaxApplicable: boolean;
    zeroRatedCategories: string[];
    exemptCategories: string[];
  };
  defaultCoaTemplate: ProfileCoaAccountTemplate[];
  coaTemplate?: ProfileCoaAccountTemplate[];
  accountingMappings: Record<string, string>;
  operationalKpis: OperationalKpiDefinition[];
  defaultKpis?: OperationalKpiDefinition[];
  reports: string[];
  dashboardWidgets: string[];
  permissions: string[];
  wizardSteps: DynamicWizardStepDefinition[];
  validationRules: { ruleId: string; description: string; severity: 'ERROR' | 'WARNING' }[];
}

// ============================================================================
// 2. PROFILE 01: COMMERCIAL TRADING / DISTRIBUTION
// ============================================================================

export interface DeliveryTerritory {
  id: string;
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  nameAr: string;
  region: string;
  city: string;
  activeRoutesCount: number;
  assignedRepIds: string[];
}

export interface DeliveryRoute {
  id: string;
  tenantId: string;
  companyId: string;
  territoryId: string;
  code: string;
  name: string;
  nameAr: string;
  vehiclePlateNumber?: string;
  defaultSalespersonId: string;
  stopsCount: number;
  customerIds: string[];
  dayOfWeekFrequency: number[]; // 1=Mon, 7=Sun
  status: 'ACTIVE' | 'INACTIVE';
}

export interface VanStockAllocation {
  id: string;
  tenantId: string;
  companyId: string;
  routeId: string;
  vehicleId: string;
  salespersonId: string;
  dispatchWarehouseId: string;
  dispatchDate: string;
  items: {
    itemSku: string;
    itemName: string;
    uom: string;
    quantityLoaded: number;
    quantitySold: number;
    quantityReturned: number;
    quantityDamaged: number;
    unitCost: number;
  }[];
  status: 'DISPATCHED' | 'IN_TRANSIT' | 'RECONCILED' | 'CLOSED';
}

export interface WholesaleTierPriceRule {
  id?: string;
  itemSku?: string;
  customerTier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'STANDARD';
  minQuantity: number;
  discountPercentage: number;
  customPrice?: number;
}

export interface BuyXGetYPromotion {
  id: string;
  code?: string;
  name: string;
  qualifyingSku: string;
  qualifyingQuantity: number;
  rewardSku: string;
  rewardQuantity: number;
  discountOnRewardPercent: number; // 100 for free
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

// ============================================================================
// 3. PROFILE 02: RESTAURANT / F&B
// ============================================================================

export interface DiningArea {
  id: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  name: string;
  nameAr: string;
  floorLevel: string;
  smokingAllowed: boolean;
}

export interface RestaurantTableRuntime {
  id: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  diningAreaId: string;
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BILL_REQUESTED' | 'DIRTY';
  currentOrderId?: string;
  activeGuestsCount?: number;
  openedAt?: string;
  serverStaffId?: string;
  totalBillAmount?: number;
  mergedWithTableId?: string;
}

export interface TableOrderItemModifier {
  modifierId: string;
  name: string;
  additionalPrice: number;
}

export interface TableOrderItem {
  itemId: string;
  itemSku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  modifiers: TableOrderItemModifier[];
  kitchenNotes?: string;
  kitchenStatus: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
  station: 'HOT_KITCHEN' | 'COLD_PREP' | 'BEVERAGES' | 'BAKERY' | 'DESSERT';
  seatNumber?: number;
}

export interface TableBillSplit {
  splitId: string;
  splitType: 'EQUAL' | 'BY_SEAT' | 'CUSTOM_ITEMS';
  shares: {
    shareNumber: number;
    guestName?: string;
    items?: { itemId: string; quantity: number }[];
    percentage?: number;
    amount: number;
    taxAmount: number;
    paid: boolean;
    paymentMethod?: string;
  }[];
}

export interface RecipeIngredient {
  rawItemSku: string;
  rawItemName: string;
  consumptionQuantity: number;
  uom: string;
  unitCost: number;
  shrinkagePercent: number;
}

export interface RecipeBOM {
  id: string;
  tenantId?: string;
  companyId?: string;
  menuItemSku: string;
  menuItemName?: string;
  portionYield: number;
  ingredients: RecipeIngredient[];
  preparationInstructions?: string;
  preparationStation?: string;
  portionCost?: number;
  targetSellingPrice?: number;
  theoreticalFoodCostPercent?: number;
}

export interface RestaurantWasteRecord {
  id: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  wasteDate: string;
  itemSku: string;
  itemName: string;
  quantity: number;
  uom: string;
  unitCost: number;
  totalCostAmount: number;
  reason: 'SPOILAGE' | 'PREPARATION_ERROR' | 'CUSTOMER_RETURN' | 'EXPIRED' | 'OVER_PORTIONED';
  reportedBy: string;
  financialEventId?: string;
}

// ============================================================================
// 4. PROFILE 03: RETAIL — MOBILE PHONES
// ============================================================================

export interface MobileDeviceRecord {
  id: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  brand: string;
  model: string;
  storage: string; // e.g. "256GB"
  ram: string; // e.g. "8GB"
  color: string;
  condition: 'BRAND_NEW' | 'OPEN_BOX' | 'REFURBISHED_GRADE_A' | 'USED_GRADE_B' | 'USED_GRADE_C';
  imei1: string;
  imei2?: string;
  serialNumber: string;
  batteryHealthPercent?: number;
  warrantyMonths: number;
  warrantyExpirationDate?: string;
  supplierId: string;
  purchaseCost: number;
  salePrice: number;
  status: 'IN_STOCK' | 'SOLD' | 'RESERVED' | 'IN_REPAIR' | 'RETURNED' | 'DISPOSED';
  associatedCustomerId?: string;
  soldAtInvoiceNumber?: string;
  createdAt: string;
}

export interface TradeInInspectionItem {
  component: 'SCREEN' | 'BATTERY' | 'BODY_CASING' | 'CAMERA' | 'FACE_ID' | 'SPEAKER';
  conditionRating?: 'PERFECT' | 'MINOR_SCRATCH' | 'CRACKED' | 'DEFECTIVE';
  condition?: string;
  notes?: string;
  deductionAmount: number;
}

export interface MobileTradeInRecord {
  id: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  tradeInNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerNationalId?: string;
  deviceBrand: string;
  deviceModel: string;
  imei1: string;
  serialNumber?: string;
  grade: 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'SCRAP';
  baseMarketValuation: number;
  inspections: TradeInInspectionItem[];
  totalDeductions: number;
  finalOfferedAmount: number;
  customerAccepted: boolean;
  payoutMethod: 'STORE_CREDIT_VOUCHER' | 'CASH_PAYOUT' | 'OFFSET_AGAINST_NEW_DEVICE';
  inventoryDeviceGeneratedId?: string;
  financialEventId?: string;
  processedBy: string;
  timestamp: string;
}

export interface MobileRepairJobCard {
  id: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  jobCardNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deviceBrand: string;
  deviceModel: string;
  imeiOrSerial: string;
  reportedProblem: string;
  assignedTechnicianId: string;
  assignedTechnicianName: string;
  partsUsed: {
    partSku: string;
    partName: string;
    quantity: number;
    unitCost: number;
    sellingPrice: number;
  }[];
  laborHours: number;
  laborHourlyRate: number;
  totalLaborCharge: number;
  totalPartsCharge: number;
  estimatedCost: number;
  finalInvoiceAmount: number;
  status: 'RECEIVED' | 'DIAGNOSING' | 'AWAITING_APPROVAL' | 'IN_REPAIR' | 'QUALITY_TESTING' | 'READY_FOR_PICKUP' | 'DELIVERED' | 'CANCELLED';
  warrantyDaysProvided: number;
  financialEventId?: string;
  createdAt: string;
  completedAt?: string;
}

// ============================================================================
// 5. PROFILE 04 & 05: RETAIL — WOMEN'S & CHILDREN'S CLOTHING
// ============================================================================

export interface ApparelStyleMaster {
  id: string;
  tenantId: string;
  companyId: string;
  styleCode: string;
  styleName: string;
  styleNameAr?: string;
  brand: string;
  category: 'WOMENS_WEAR' | 'CHILDRENS_WEAR' | 'MENS_WEAR';
  subCategory: string; // e.g. "Dresses", "Blouses", "Pajamas"
  season: string; // e.g. "Summer 2026", "Eid 2026"
  collection: string;
  materialComposition: string; // e.g. "95% Cotton, 5% Elastane"
  careInstructions?: string;
  baseCost: number;
  baseRetailPrice: number;
  availableColors: { colorCode: string; colorName: string; hexCode?: string }[];
  availableSizes: string[];
  // Children-specific configurable fields
  isChildrenWear?: boolean;
  ageGroupRange?: string; // e.g. "3M-6M", "Toddler", "4Y-6Y"
  safetyCertifications?: string[]; // e.g. "OEKO-TEX Standard 100", "CPSIA Compliant"
}

export interface ApparelVariantSKU {
  id: string;
  styleId: string;
  styleCode: string;
  colorCode: string;
  colorName: string;
  size: string;
  sku: string; // e.g. "STY-DRS-01-BLK-M"
  barcode: string; // EAN-13
  stockOnHand: number;
  reservedStock: number;
  unitCost: number;
  retailPrice: number;
  currentMarkdownPercent: number;
}

export interface FittingRoomHoldTicket {
  id: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  ticketNumber: string;
  fittingRoomNumber: number;
  customerName?: string;
  items: {
    variantSku: string;
    styleCode: string;
    color: string;
    size: string;
    quantity: number;
  }[];
  heldAt: string;
  expiresAt: string;
  status: 'ACTIVE_HOLD' | 'RETURNED_TO_RACK' | 'PURCHASED' | 'EXPIRED';
}

export interface CustomerReservation {
  id: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  reservationNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  reservedItems: {
    variantSku: string;
    quantity: number;
    unitPrice: number;
  }[];
  totalDepositPaid: number;
  balanceRemaining: number;
  validUntil: string;
  status: 'ACTIVE' | 'FULFILLED' | 'CANCELLED_REFUNDED' | 'FORFEITED';
  financialEventId?: string;
}

export interface SeasonalMarkdownRule {
  id?: string;
  name?: string;
  ruleName?: string;
  seasonCode?: string;
  season?: string;
  category?: string;
  daysSinceIntroduction?: number;
  discountPercentage: number;
  isActive?: boolean;
}

// ============================================================================
// 6. PROFILE 06, 07, 08: APPAREL MANUFACTURING (WOMEN'S, MEN'S, CHILDREN'S)
// ============================================================================

export interface FabricYieldMarkerPlan {
  id: string;
  markerCode: string;
  styleCode: string;
  fabricWidthCm: number;
  patternPiecesCount: number;
  markerLengthMeters: number;
  fabricYieldPercentage: number; // e.g. 88.5%
  wastePercentage: number;
  fabricRequiredPerGarmentMeters: number;
  shrinkageAllowancePercentage?: number; // Men's & apparel allowance
}

export interface ApparelCutOrder {
  id: string;
  tenantId: string;
  companyId: string;
  cutOrderNumber: string;
  styleCode: string;
  styleName: string;
  category: 'WOMENS_APPAREL' | 'MENS_APPAREL' | 'CHILDRENS_APPAREL';
  season: string;
  productionWorkOrderId: string;
  fabricRollsUsed: {
    rollId: string;
    fabricLotNumber: string;
    metersConsumed: number;
    costPerMeter: number;
  }[];
  sizeBreakdown: {
    size: string;
    plannedQuantity: number;
    actualCutQuantity: number;
  }[];
  totalCutQuantity: number;
  markerPlanId: string;
  cuttingTableNumber: string;
  cutDate: string;
  cutterStaffName: string;
  status: 'PLANNED' | 'IN_CUTTING' | 'BUNDLED' | 'CLOSED';
}

export interface ApparelBundleTicket {
  id: string;
  cutOrderId: string;
  bundleNumber: string; // e.g. "CUT-101-BND-05"
  styleCode: string;
  colorName: string;
  size: string;
  quantity: number;
  currentOperation: 'CUTTING' | 'FUSING' | 'COLLAR_PREP' | 'SLEEVE_ATTACH' | 'MAIN_SEWING' | 'BUTTONHOLE' | 'PRESSING' | 'QC_INSPECTION' | 'PACKAGING';
  assignedOperatorId?: string;
  operationHistory: {
    operation: string;
    operatorId: string;
    operatorName: string;
    completedQuantity: number;
    pieceRateEarned: number;
    timestamp: string;
  }[];
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'REWORK_REQUIRED';
}

export interface PieceRateLabourRate {
  id: string;
  operationCode: string;
  operationName: string;
  ratePerPiece: number;
  standardMinutesPerPiece: number;
}

export interface MensTailoringSpec {
  styleCode: string;
  fitType: 'SUPER_SLIM' | 'SLIM' | 'REGULAR' | 'TAILORED' | 'RELAXED';
  measurements: {
    chestCm: number;
    waistCm: number;
    shoulderWidthCm: number;
    sleeveLengthCm: number;
    jacketLengthCm: number;
    trouserInseamCm: number;
    trouserWaistCm: number;
  };
  interliningSpec: string;
  canvasType: 'FULL_CANVAS' | 'HALF_CANVAS' | 'FUSED';
  trimDetails: string[];
}

export interface ChildrenSafetyQACheckpoint {
  id: string;
  cutOrderId: string;
  styleCode: string;
  ageGroup: string;
  checkDate: string;
  inspectorName: string;
  pullTestButtonsPassed: boolean; // Minimum 70 Newtons force
  pullTestSnapsPassed: boolean;
  chokingHazardPartsAbsent: boolean;
  sharpEdgesOrNeedlesAbsent: boolean; // Needle detector pass
  drawstringsCompliancePassed: boolean; // No loose cords on hood/neck
  nonToxicDyeCertificationVerified: boolean;
  overallSafetyApproval: 'PASSED' | 'FAILED_QUARANTINED';
  notes?: string;
}

export interface ApparelProductionCostSummary {
  styleCode: string;
  cutOrderNumber: string;
  totalUnitsProduced: number;
  totalFabricCost: number;
  totalTrimAndAccessoryCost: number;
  totalPieceRateLabourCost: number;
  allocatedFactoryOverhead: number;
  totalActualCost: number;
  costPerUnit: number;
  standardTargetCostPerUnit: number;
  costVarianceAmount: number;
  variancePercentage: number;
}

// ============================================================================
// 10. ENTERPRISE ONBOARDING WIZARD & READINESS CERTIFICATION TYPES (P0-07)
// ============================================================================

export type ReadinessCheckStatus = 'PASS' | 'FAIL' | 'WARN';

export interface ReadinessCheckItem {
  id: string;
  name: string;
  nameAr: string;
  status: ReadinessCheckStatus;
  message: string;
  messageAr: string;
  blockingReason?: string;
  details?: Record<string, any>;
}

export interface EnterpriseReadinessReport {
  overallStatus: 'READY' | 'NOT_READY' | 'WARNING';
  isReady: boolean;
  completedChecks: ReadinessCheckItem[];
  passedChecks?: ReadinessCheckItem[];
  failedChecks: ReadinessCheckItem[];
  warnings: string[];
  blockingReasons: string[];
  nextRequiredAction: string;
  timestamp: string;
  scope: {
    tenantId: string;
    companyId: string;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    warned: number;
  };
}

export interface OnboardingStepDefinition {
  stepNumber: number;
  stepKey: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  category: 'FOUNDATION' | 'STRUCTURE' | 'FINANCE' | 'COMPLIANCE' | 'OPERATIONS' | 'SECURITY' | 'VERIFICATION';
  isDynamicVerticalStep?: boolean;
  isRequired: boolean;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface OnboardingCompletionCertificate {
  id?: string;
  certificateId: string;
  certificateNumber?: string;
  cryptographicHash?: string;
  companyId: string;
  tenantId: string;
  companyName: string;
  tradeName?: string;
  country: string;
  baseCurrency: string;
  certifiedProfile: PilotIndustryProfileId;
  certifiedAt: string;
  certifiedBy: string;
  auditBlockIndex: number;
  auditHash: string;
  readinessScore: number;
  operationalStatus: 'PILOT_READY' | 'ACTIVE';
}

