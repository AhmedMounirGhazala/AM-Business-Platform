/**
 * AM Business Platform — P0-06 Vertical Profile Registry
 * Formally registers the 8 approved Pilot Industry Profiles with deep metadata,
 * standard Chart of Accounts (COA) templates, operational KPIs, and wizard workflows.
 */

import {
  IndustryProfileDefinition,
  PilotIndustryProfileId
} from './types';

export class VerticalProfileRegistry {
  private static readonly PROFILES: Record<PilotIndustryProfileId, IndustryProfileDefinition> = {
    // ========================================================================
    // PROFILE 01: COMMERCIAL TRADING / DISTRIBUTION
    // ========================================================================
    COMMERCIAL_DISTRIBUTION: {
      profileId: 'COMMERCIAL_DISTRIBUTION',
      name: 'Commercial Trading & B2B Distribution',
      nameAr: 'التجارة العامة والتوزيع بالجملة',
      family: 'COMMERCE_DISTRIBUTION',
      businessModel: 'B2B',
      requiredModules: ['SALES', 'PURCHASING', 'INVENTORY', 'ACCOUNTING', 'TREASURY'],
      optionalModules: ['CRM', 'LOGISTICS', 'COMPLIANCE'],
      requiredMasters: ['PRODUCTS', 'SUPPLIERS', 'CUSTOMERS', 'BRANDS', 'CATEGORIES', 'PRICE_LISTS', 'TERRITORIES', 'ROUTES', 'SALES_REPS'],
      requiredAttributes: ['BRAND', 'CATEGORY', 'MULTIPLE_UOM', 'CUSTOMER_TIER', 'CREDIT_LIMIT'],
      requiredDocuments: ['PURCHASE_REQUISITION', 'RFQ', 'PURCHASE_ORDER', 'GRN', 'SUPPLIER_INVOICE', 'SALES_QUOTATION', 'SALES_ORDER', 'PICKING_SLIP', 'DELIVERY_NOTE', 'TAX_INVOICE'],
      requiredWorkflows: ['PROCURE_TO_PAY', 'ORDER_TO_CASH', 'VAN_SALES_DISPATCH', 'COLLECTIONS_RECONCILIATION'],
      inventoryModel: 'PERPETUAL_AVCO',
      costingModel: 'MOVING_AVERAGE',
      revenueModel: 'TERRITORY_WHOLESALE',
      purchasingModel: 'STANDARD_PO',
      salesModel: 'DISTRIBUTION_ROUTE',
      warehouseModel: 'CENTRAL_DISTRIBUTION',
      pricingModel: 'WHOLESALE_TIERED',
      taxConfiguration: {
        recommendedJurisdiction: 'EGYPT_ETA',
        standardVatRate: 0.14,
        withholdingTaxApplicable: true,
        zeroRatedCategories: ['BASIC_FOODSTUFF', 'EXPORT_GOODS'],
        exemptCategories: ['FINANCIAL_SERVICES']
      },
      defaultCoaTemplate: [
        { code: '1110', name: 'Cash on Hand - Sales Reps / Vans', nameAr: 'نقدية عهد المناديب وسيارات التوزيع', type: 'ASSET', category: 'CASH', description: 'Cash collected by delivery reps in transit' },
        { code: '1120', name: 'Bank Operating Account', nameAr: 'حساب البنك التشغيلي', type: 'ASSET', category: 'BANK', description: 'Primary wholesale collections account' },
        { code: '1210', name: 'Trade Accounts Receivable', nameAr: 'العملاء وحسابات القبض التجارية', type: 'ASSET', category: 'RECEIVABLE', description: 'Wholesale customer credit balances' },
        { code: '1310', name: 'Commercial Merchandise Inventory', nameAr: 'مخزون بضاعة بغرض البيع', type: 'ASSET', category: 'INVENTORY', description: 'Finished goods in warehouse and vans' },
        { code: '2110', name: 'Trade Accounts Payable', nameAr: 'الموردين وحسابات الدفع', type: 'LIABILITY', category: 'PAYABLE', description: 'Supplier trade liabilities' },
        { code: '2210', name: 'Output VAT Payable', nameAr: 'ضريبة القيمة المضافة المحصلة', type: 'LIABILITY', category: 'TAX', description: 'Sales VAT liability' },
        { code: '4110', name: 'Wholesale Commercial Revenue', nameAr: 'إيرادات مبيعات الجملة والتوزيع', type: 'REVENUE', category: 'OPERATING_REVENUE', description: 'Primary trading revenue' },
        { code: '4190', name: 'Sales Discounts & Volume Rebates', nameAr: 'الخصومات الممنوحة ومردودات المبيعات', type: 'REVENUE', category: 'CONTRA_REVENUE', description: 'Early settlement discounts and tier volume rebates' },
        { code: '5110', name: 'Cost of Goods Sold - Commercial', nameAr: 'تكلفة البضاعة المباعة - تجاري', type: 'EXPENSE', category: 'COGS', description: 'Direct acquisition cost of goods sold' },
        { code: '5210', name: 'Delivery Route & Vehicle Expenses', nameAr: 'مصروفات خطوط التوزيع وسيارات النقل', type: 'EXPENSE', category: 'SELLING_EXPENSE', description: 'Fuel, maintenance, and van routing costs' }
      ],
      accountingMappings: {
        inventoryAssetAccount: '1310',
        cogsAccount: '5110',
        salesRevenueAccount: '4110',
        salesDiscountAccount: '4190',
        receivableControlAccount: '1210',
        payableControlAccount: '2110',
        vanTransitAccount: '1110'
      },
      operationalKpis: [
        { id: 'KPI-DST-01', name: 'Route Delivery Fulfillment Rate', nameAr: 'معدل إنجاز خطوط التوزيع', calculationMethod: 'DeliveredOrders / TotalPlannedOrders * 100', targetDirection: 'HIGHER_IS_BETTER', unit: 'PERCENT' },
        { id: 'KPI-DST-02', name: 'Days Sales Outstanding (DSO)', nameAr: 'فترة تحصيل ديون العملاء', calculationMethod: 'AccountsReceivable / DailySales', targetDirection: 'LOWER_IS_BETTER', unit: 'DAYS' },
        { id: 'KPI-DST-03', name: 'Inventory Turnover Ratio', nameAr: 'معدل دوران المخزون', calculationMethod: 'COGS / AverageInventory', targetDirection: 'HIGHER_IS_BETTER', unit: 'COUNT' }
      ],
      reports: ['Sales by Customer', 'Sales by Territory', 'Sales Rep Performance', 'Gross Margin Analytics', 'Inventory Movement & Valuation', 'Customer Aging Ledger', 'Supplier Aging Ledger', 'Route Performance Analysis', 'Stock Turnover Analysis'],
      dashboardWidgets: ['Route Fulfillment Gauge', 'Top Territories Bar Chart', 'Overdue Collections Warning', 'Low Stock Reorder Alert'],
      permissions: ['DISTRIBUTION_DISPATCH', 'ROUTE_ALLOCATE', 'CREDIT_OVERRIDE', 'PRICE_LIST_MANAGE'],
      wizardSteps: [
        {
          stepNumber: 15,
          stepKey: 'distribution_routes',
          title: 'Territories & Delivery Routes',
          titleAr: 'تكويد المناطق وخطوط التوزيع',
          description: 'Configure initial delivery routes, territories, and sales rep assignments.',
          isRequired: true,
          fields: [
            { key: 'primaryTerritoryName', label: 'Primary Territory Name', labelAr: 'اسم المنطقة الرئيسية', type: 'TEXT', defaultValue: 'Cairo Metro / Giza', required: true },
            { key: 'defaultRouteCode', label: 'Default Route Code', labelAr: 'رمز خط السير الافتراضي', type: 'TEXT', defaultValue: 'ROUTE-01', required: true },
            { key: 'enableVanStock', label: 'Enable Van Stock & Mobile POS', labelAr: 'تفعيل جرد سيارات التوزيع', type: 'BOOLEAN', defaultValue: true, required: false }
          ]
        }
      ],
      validationRules: [
        { ruleId: 'VAL-DST-01', description: 'Customer credit limit must be positive number or 0 for cash-only', severity: 'ERROR' },
        { ruleId: 'VAL-DST-02', description: 'Every delivery route must belong to a registered territory', severity: 'ERROR' }
      ]
    },

    // ========================================================================
    // PROFILE 02: RESTAURANT / F&B
    // ========================================================================
    RESTAURANT_FNB: {
      profileId: 'RESTAURANT_FNB',
      name: 'Restaurant, Cafe & Food Services (F&B)',
      nameAr: 'المطاعم والكافيهات والأغذية والمشروبات',
      family: 'HOSPITALITY_FNB',
      businessModel: 'B2C',
      requiredModules: ['POS', 'INVENTORY', 'ACCOUNTING'],
      optionalModules: ['PURCHASING', 'TREASURY', 'REPORTING'],
      requiredMasters: ['MENU_ITEMS', 'RECIPES', 'INGREDIENTS', 'MODIFIERS', 'TABLES', 'DINING_AREAS', 'KITCHEN_STATIONS', 'EMPLOYEES'],
      requiredAttributes: ['PORTION_SIZE', 'KITCHEN_STATION', 'RECIPE_YIELD', 'TABLE_SECTION', 'MODIFIER_GROUP'],
      requiredDocuments: ['KITCHEN_ORDER_TICKET', 'TABLE_CHECK', 'GUEST_BILL', 'RECIPE_BOM', 'WASTE_LOG', 'DAILY_Z_REPORT'],
      requiredWorkflows: ['TABLE_SERVICE_LIFECYCLE', 'KITCHEN_DISPLAY_ROUTING', 'RECIPE_AUTO_CONSUMPTION', 'WASTE_RECORDING'],
      inventoryModel: 'PERPETUAL_FIFO',
      costingModel: 'RECIPE_THEORETICAL_ACTUAL',
      revenueModel: 'TABLE_SERVICE',
      purchasingModel: 'FRESH_PERISHABLE_DAILY',
      salesModel: 'DINE_IN_TAKEAWAY',
      warehouseModel: 'KITCHEN_PANTRY',
      pricingModel: 'PORTION_PRICING',
      taxConfiguration: {
        recommendedJurisdiction: 'ZATCA_PHASE2',
        standardVatRate: 0.15,
        withholdingTaxApplicable: false,
        zeroRatedCategories: [],
        exemptCategories: []
      },
      defaultCoaTemplate: [
        { code: '1110', name: 'Cash Register Float & Vault', nameAr: 'نقدية صناديق ونقاط البيع', type: 'ASSET', category: 'CASH', description: 'POS cash drawers and change funds' },
        { code: '1310', name: 'Raw Food Ingredients Inventory', nameAr: 'مخزون المواد الأولية الغذائية', type: 'ASSET', category: 'INVENTORY', description: 'Meats, dairy, vegetables, dry goods' },
        { code: '1320', name: 'Beverage & Bar Inventory', nameAr: 'مخزون المشروبات والمواد السائلة', type: 'ASSET', category: 'INVENTORY', description: 'Coffee, tea, syrups, juices, soft drinks' },
        { code: '1330', name: 'Packaging & Disposables Inventory', nameAr: 'مخزون أدوات التعبئة والتغليف', type: 'ASSET', category: 'INVENTORY', description: 'Takeaway boxes, cups, bags, napkins' },
        { code: '2210', name: 'Output VAT Payable', nameAr: 'ضريبة القيمة المضافة المحصلة', type: 'LIABILITY', category: 'TAX', description: 'F&B sales VAT' },
        { code: '4110', name: 'Dine-In Food Sales Revenue', nameAr: 'إيرادات مبيعات الصالة (تناول داخلي)', type: 'REVENUE', category: 'OPERATING_REVENUE', description: 'Table orders food revenue' },
        { code: '4120', name: 'Takeaway & Delivery Sales Revenue', nameAr: 'إيرادات الطلبات الخارجية والتوصيل', type: 'REVENUE', category: 'OPERATING_REVENUE', description: 'To-go and delivery revenue' },
        { code: '5110', name: 'Food Cost of Sales (Raw Ingredients)', nameAr: 'تكلفة الأغذية المباعة (المكونات)', type: 'EXPENSE', category: 'COGS', description: 'Theoretical & actual ingredient consumption' },
        { code: '5120', name: 'Beverage Cost of Sales', nameAr: 'تكلفة المشروبات المباعة', type: 'EXPENSE', category: 'COGS', description: 'Direct beverage ingredients cost' },
        { code: '5210', name: 'Kitchen Spoilage & Waste Expense', nameAr: 'مصروفات التالف والهالك في المطبخ', type: 'EXPENSE', category: 'OPERATING_EXPENSE', description: 'Spoiled, dropped, and expired food cost' }
      ],
      accountingMappings: {
        rawFoodInventoryAccount: '1310',
        beverageInventoryAccount: '1320',
        packagingInventoryAccount: '1330',
        foodCogsAccount: '5110',
        beverageCogsAccount: '5120',
        wasteExpenseAccount: '5210',
        foodRevenueAccount: '4110',
        takeawayRevenueAccount: '4120'
      },
      operationalKpis: [
        { id: 'KPI-FNB-01', name: 'Food Cost Percentage', nameAr: 'نسبة تكلفة الطعام للمبيعات', calculationMethod: 'ActualFoodCost / FoodRevenue * 100', targetDirection: 'LOWER_IS_BETTER', unit: 'PERCENT' },
        { id: 'KPI-FNB-02', name: 'Average Ticket / Cover Size', nameAr: 'متوسط الفاتورة للضيف', calculationMethod: 'TotalRevenue / GuestCount', targetDirection: 'HIGHER_IS_BETTER', unit: 'CURRENCY' },
        { id: 'KPI-FNB-03', name: 'Kitchen Waste Ratio', nameAr: 'نسبة الهدر في المطبخ', calculationMethod: 'WasteCost / TotalPurchasedIngredients * 100', targetDirection: 'LOWER_IS_BETTER', unit: 'PERCENT' },
        { id: 'KPI-FNB-04', name: 'Average Table Turn Time', nameAr: 'متوسط وقت إشغال الطاولة', calculationMethod: 'TotalDiningMinutes / OccupiedTablesCount', targetDirection: 'LOWER_IS_BETTER', unit: 'HOURS' }
      ],
      reports: ['Daily F&B Sales Summary', 'Menu Engineering Matrix (Stars, Plows, Dogs)', 'Kitchen Order Preparation Times (KDS)', 'Food Cost Variance (Theoretical vs Actual)', 'Kitchen Spoilage & Waste Ledger', 'Table Revenue & Occupancy Analysis', 'Ingredient Depletion Report'],
      dashboardWidgets: ['Live Table Floor Plan', 'Active KDS Tickets Count', 'Today Food Cost % Real-Time', 'Top Selling Dishes'],
      permissions: ['TABLE_VOID', 'SPLIT_BILL', 'KDS_OPERATE', 'RECIPE_EDIT', 'WASTE_APPROVE'],
      wizardSteps: [
        {
          stepNumber: 15,
          stepKey: 'restaurant_floor_plan',
          title: 'Dining Areas & Tables Setup',
          titleAr: 'تهيئة الصالات وتوزيع الطاولات',
          description: 'Setup initial dining sections and table counts for your restaurant.',
          isRequired: true,
          fields: [
            { key: 'diningAreaName', label: 'Main Dining Area Name', labelAr: 'اسم الصالة الرئيسية', type: 'TEXT', defaultValue: 'Ground Floor Dining', required: true },
            { key: 'totalTablesCount', label: 'Initial Tables Count', labelAr: 'عدد الطاولات المبدئي', type: 'NUMBER', defaultValue: 12, required: true },
            { key: 'enableKds', label: 'Activate Kitchen Display Stations', labelAr: 'تفعيل شاشات المطبخ KDS', type: 'BOOLEAN', defaultValue: true, required: false }
          ]
        }
      ],
      validationRules: [
        { ruleId: 'VAL-FNB-01', description: 'Table capacity must be at least 1 guest', severity: 'ERROR' },
        { ruleId: 'VAL-FNB-02', description: 'Waste quantity cannot exceed ingredient available stock', severity: 'ERROR' }
      ]
    },

    // ========================================================================
    // PROFILE 03: RETAIL — MOBILE PHONES
    // ========================================================================
    RETAIL_MOBILE_PHONES: {
      profileId: 'RETAIL_MOBILE_PHONES',
      name: 'Specialty Retail — Mobile Phones & Electronics',
      nameAr: 'تجارة التجزئة — الهواتف المحمولة والإلكترونيات',
      family: 'RETAIL_SPECIALTY',
      businessModel: 'B2C',
      requiredModules: ['POS', 'INVENTORY', 'ACCOUNTING'],
      optionalModules: ['PURCHASING', 'CRM', 'TREASURY'],
      requiredMasters: ['DEVICES', 'BRANDS', 'MODELS', 'CUSTOMERS', 'TECHNICIANS', 'SPARE_PARTS', 'WARRANTY_TERMS'],
      requiredAttributes: ['IMEI_1', 'IMEI_2', 'SERIAL_NUMBER', 'STORAGE_CAPACITY', 'RAM', 'CONDITION_GRADE', 'BATTERY_HEALTH'],
      requiredDocuments: ['IMEI_RECEIPT', 'TRADE_IN_INSPECTION_SHEET', 'REPAIR_JOB_CARD', 'WARRANTY_CERTIFICATE', 'DEVICE_EXCHANGE_NOTE'],
      requiredWorkflows: ['SERIAL_IMEI_SCANNING_POS', 'USED_DEVICE_TRADE_IN', 'REPAIR_SERVICE_JOB_ORDER', 'WARRANTY_VALIDATION'],
      inventoryModel: 'SERIAL_IMEI',
      costingModel: 'STANDARD_COST',
      revenueModel: 'RETAIL_STORE',
      purchasingModel: 'TRADE_IN_PURCHASE',
      salesModel: 'SPECIALTY_DEVICE',
      warehouseModel: 'RETAIL_BACKSTORE',
      pricingModel: 'LIST_PRICE',
      taxConfiguration: {
        recommendedJurisdiction: 'EGYPT_ETA',
        standardVatRate: 0.14,
        withholdingTaxApplicable: false,
        zeroRatedCategories: [],
        exemptCategories: ['USED_GOODS_MARGIN_SCHEME']
      },
      defaultCoaTemplate: [
        { code: '1110', name: 'Cash Register - POS', nameAr: 'نقدية نقطة البيع', type: 'ASSET', category: 'CASH', description: 'Store cash drawer' },
        { code: '1310', name: 'Inventory - Brand New Devices', nameAr: 'مخزون الأجهزة الجديدة (بالسيريال)', type: 'ASSET', category: 'INVENTORY', description: 'Brand new phones with serials' },
        { code: '1320', name: 'Inventory - Pre-Owned & Trade-In Devices', nameAr: 'مخزون الأجهزة المستعملة والمستبدلة', type: 'ASSET', category: 'INVENTORY', description: 'Used phones acquired from customers' },
        { code: '1330', name: 'Inventory - Spare Parts & Accessories', nameAr: 'مخزون قطع الغيار والإكسسوارات', type: 'ASSET', category: 'INVENTORY', description: 'Screens, batteries, chargers, cases' },
        { code: '4110', name: 'Device Sales Revenue - New', nameAr: 'إيرادات مبيعات الأجهزة الجديدة', type: 'REVENUE', category: 'OPERATING_REVENUE', description: 'Brand new device revenue' },
        { code: '4120', name: 'Device Sales Revenue - Pre-Owned', nameAr: 'إيرادات مبيعات الأجهزة المستعملة', type: 'REVENUE', category: 'OPERATING_REVENUE', description: 'Resale of trade-in devices' },
        { code: '4210', name: 'Maintenance & Repair Labor Income', nameAr: 'إيرادات خدمات الصيانة وقطع الغيار', type: 'REVENUE', category: 'SERVICE_REVENUE', description: 'Job card labor and repair charges' },
        { code: '5110', name: 'Cost of Devices Sold - New', nameAr: 'تكلفة مبيعات الأجهزة الجديدة', type: 'EXPENSE', category: 'COGS', description: 'Device acquisition cost' },
        { code: '5120', name: 'Cost of Devices Sold - Pre-Owned', nameAr: 'تكلفة مبيعات الأجهزة المستعملة', type: 'EXPENSE', category: 'COGS', description: 'Valuation purchase cost of trade-ins' },
        { code: '5130', name: 'Cost of Repair Spare Parts Consumed', nameAr: 'تكلفة قطع الغيار المستهلكة في الصيانة', type: 'EXPENSE', category: 'COGS', description: 'Screens, batteries used in repairs' }
      ],
      accountingMappings: {
        newDeviceInventoryAccount: '1310',
        usedDeviceInventoryAccount: '1320',
        sparePartsInventoryAccount: '1330',
        newDeviceCogsAccount: '5110',
        usedDeviceCogsAccount: '5120',
        repairIncomeAccount: '4210',
        repairPartsCogsAccount: '5130'
      },
      operationalKpis: [
        { id: 'KPI-MOB-01', name: 'Average Device Gross Margin', nameAr: 'متوسط هامش ربح الجهاز', calculationMethod: '(DeviceRevenue - DeviceCost) / DeviceRevenue * 100', targetDirection: 'HIGHER_IS_BETTER', unit: 'PERCENT' },
        { id: 'KPI-MOB-02', name: 'Trade-In Valuation Margin', nameAr: 'هامش ربحية الأجهزة المستبدلة', calculationMethod: '(ResalePrice - TradeInCost) / ResalePrice * 100', targetDirection: 'HIGHER_IS_BETTER', unit: 'PERCENT' },
        { id: 'KPI-MOB-03', name: 'Repair Turnaround Time', nameAr: 'زمن إنجاز عمليات الصيانة', calculationMethod: 'CompletedJobsHours / TotalJobsCount', targetDirection: 'LOWER_IS_BETTER', unit: 'HOURS' }
      ],
      reports: ['IMEI Serial Stock Ledger', 'Device Margin & Profitability', 'New vs Used Device Performance', 'Trade-In Acquisition & Resale Analysis', 'Warranty Expiration & Claims Audit', 'Repair Job Card Profitability', 'Slow-Moving Devices Aging'],
      dashboardWidgets: ['In-Stock Devices by Brand', 'Active Repair Job Cards', 'Trade-In Today Volume', 'Warranty Claims Summary'],
      permissions: ['IMEI_OVERRIDE', 'TRADE_IN_EVALUATE', 'JOB_CARD_CLOSE', 'WARRANTY_EXTEND'],
      wizardSteps: [
        {
          stepNumber: 15,
          stepKey: 'mobile_retail_setup',
          title: 'Mobile POS & Serial Validation',
          titleAr: 'إعدادات مسح السيريال والأجهزة',
          description: 'Configure mandatory IMEI verification and trade-in defaults.',
          isRequired: true,
          fields: [
            { key: 'mandatoryImeiScanning', label: 'Enforce Dual IMEI Scanning at POS', labelAr: 'إلزام مسح رقم IMEI عند البيع', type: 'BOOLEAN', defaultValue: true, required: true },
            { key: 'defaultWarrantyMonths', label: 'Default Device Warranty (Months)', labelAr: 'مدة الضمان الافتراضية بالأشهر', type: 'NUMBER', defaultValue: 12, required: true },
            { key: 'enableTradeIn', label: 'Enable Trade-In Module', labelAr: 'تفعيل خدمة الاستبدال', type: 'BOOLEAN', defaultValue: true, required: false }
          ]
        }
      ],
      validationRules: [
        { ruleId: 'VAL-MOB-01', description: 'IMEI must be 15 digits numeric string with valid Luhn check structure', severity: 'ERROR' },
        { ruleId: 'VAL-MOB-02', description: 'Duplicate IMEI cannot exist in active stock simultaneously', severity: 'ERROR' }
      ]
    },

    // ========================================================================
    // PROFILE 04: RETAIL — WOMEN'S CLOTHING
    // ========================================================================
    RETAIL_WOMENS_CLOTHING: {
      profileId: 'RETAIL_WOMENS_CLOTHING',
      name: "Fashion Retail — Women's Apparel & Boutique",
      nameAr: 'تجارة الأزياء — الملابس النسائية والفساتين',
      family: 'RETAIL_FASHION',
      businessModel: 'B2C',
      requiredModules: ['POS', 'INVENTORY', 'ACCOUNTING'],
      optionalModules: ['PURCHASING', 'CRM', 'REPORTING'],
      requiredMasters: ['STYLES', 'COLORS', 'SIZES', 'BRANDS', 'SEASONS', 'COLLECTIONS', 'FITTING_ROOMS'],
      requiredAttributes: ['STYLE_CODE', 'COLOR_CODE', 'SIZE', 'SEASON', 'MATERIAL_COMPOSITION', 'CARE_INSTRUCTIONS'],
      requiredDocuments: ['POS_RECEIPT', 'FITTING_ROOM_HOLD_TICKET', 'CUSTOMER_RESERVATION_RECEIPT', 'MARKDOWN_NOTICE', 'EXCHANGE_VOUCHER'],
      requiredWorkflows: ['VARIANT_MATRIX_POS_SELECTION', 'FITTING_ROOM_HOLD', 'CUSTOMER_RESERVATION_DEPOSIT', 'SEASONAL_MARKDOWN'],
      inventoryModel: 'VARIANT_MATRIX',
      costingModel: 'STANDARD_COST',
      revenueModel: 'RETAIL_STORE',
      purchasingModel: 'SEASONAL_BULK',
      salesModel: 'DIRECT_RETAIL',
      warehouseModel: 'RETAIL_BACKSTORE',
      pricingModel: 'SEASONAL_MARKDOWN',
      taxConfiguration: {
        recommendedJurisdiction: 'EGYPT_ETA',
        standardVatRate: 0.14,
        withholdingTaxApplicable: false,
        zeroRatedCategories: [],
        exemptCategories: []
      },
      defaultCoaTemplate: [
        { code: '1110', name: 'Cash Register - Boutique POS', nameAr: 'نقدية نقطة البيع للمتجر', type: 'ASSET', category: 'CASH', description: 'Boutique cash registers' },
        { code: '1210', name: 'Accounts Receivable - Fashion Customers', nameAr: 'العملاء وحسابات القبض', type: 'ASSET', category: 'RECEIVABLES', description: 'Receivables for corporate fashion orders' },
        { code: '1310', name: "Merchandise Inventory - Women's Wear", nameAr: 'مخزون الأزياء والملابس النسائية', type: 'ASSET', category: 'INVENTORY', description: 'Dresses, abayas, tops, skirts, pants' },
        { code: '1320', name: 'Merchandise Inventory - Accessories & Shoes', nameAr: 'مخزون الإكسسوارات والأحذية', type: 'ASSET', category: 'INVENTORY', description: 'Bags, belts, scarves, footwear' },
        { code: '2110', name: 'Accounts Payable - Apparel Suppliers', nameAr: 'الموردون ومصنعو الملابس', type: 'LIABILITY', category: 'CURRENT_LIABILITY', description: 'Trade payables for garment collections' },
        { code: '2190', name: 'Customer Reservation Deposits Liability', nameAr: 'عربونات وحجوزات العملاء المعلقة', type: 'LIABILITY', category: 'CURRENT_LIABILITY', description: 'Advance deposits for held garments' },
        { code: '2210', name: 'Output VAT - Fashion Sales', nameAr: 'ضريبة القيمة المضافة المستحقة', type: 'LIABILITY', category: 'TAX', description: 'VAT payable on apparel sales' },
        { code: '4110', name: "Apparel Sales Revenue - Women's Wear", nameAr: 'إيرادات مبيعات الملابس النسائية', type: 'REVENUE', category: 'OPERATING_REVENUE', description: 'Full price garment sales' },
        { code: '4190', name: 'Promotional Discounts & Seasonal Markdowns', nameAr: 'تخفيضات المواسم والأوكازيون الممنوحة', type: 'REVENUE', category: 'CONTRA_REVENUE', description: 'End-of-season clearance markdowns' },
        { code: '5110', name: 'Cost of Apparel Sold', nameAr: 'تكلفة الأزياء والملابس المباعة', type: 'EXPENSE', category: 'COGS', description: 'Acquisition/production cost of garments' }
      ],
      accountingMappings: {
        inventoryAssetAccount: '1310',
        cogsAccount: '5110',
        revenueAccount: '4110',
        markdownContraAccount: '4190',
        reservationDepositAccount: '2190'
      },
      operationalKpis: [
        { id: 'KPI-FSH-01', name: 'Sell-Through Rate by Season', nameAr: 'معدل التصريف الموسمي (Sell-Through)', calculationMethod: 'UnitsSold / TotalUnitsReceived * 100', targetDirection: 'HIGHER_IS_BETTER', unit: 'PERCENT' },
        { id: 'KPI-FSH-02', name: 'Markdown Impact on Gross Margin', nameAr: 'أثر التخفيضات على هامش الربح', calculationMethod: 'MarkdownDiscounts / GrossRevenue * 100', targetDirection: 'LOWER_IS_BETTER', unit: 'PERCENT' },
        { id: 'KPI-FSH-03', name: 'Fitting Room Conversion Rate', nameAr: 'معدل التحويل من غرف القياس للشراء', calculationMethod: 'PurchasedHeldItems / TotalFittingRoomItems * 100', targetDirection: 'HIGHER_IS_BETTER', unit: 'PERCENT' }
      ],
      reports: ['Variant Matrix Stock Summary (Style x Color x Size)', 'Sell-Through Rate by Season', 'Size & Color Sales Distribution', 'Seasonal Markdown Performance', 'Fitting Room Conversion Analysis', 'Customer Reservations Ledger', 'Dead Stock & Clearance Candidates'],
      dashboardWidgets: ['Size Matrix Distribution', 'Current Season Sell-Through Gauge', 'Fitting Room Active Holds', 'Today Markdown Revenue'],
      permissions: ['PRICE_MARKDOWN_APPLY', 'FITTING_ROOM_MANAGE', 'RESERVATION_CREATE', 'SIZE_MATRIX_EDIT'],
      wizardSteps: [
        {
          stepNumber: 15,
          stepKey: 'womens_fashion_setup',
          title: 'Color & Size Matrix Standards',
          titleAr: 'تكويد مقاسات وألوان الأزياء النسائية',
          description: 'Configure initial size ranges and color palettes for matrix creation.',
          isRequired: true,
          fields: [
            { key: 'defaultSizeScale', label: 'Default Size Scale', labelAr: 'مقياس المقاسات المعتمد', type: 'SELECT', defaultValue: 'INTL_XS_TO_XXL', options: [{ label: 'XS, S, M, L, XL, XXL', value: 'INTL_XS_TO_XXL' }, { label: 'European 36, 38, 40, 42, 44', value: 'EU_36_TO_44' }], required: true },
            { key: 'enableFittingRoomHold', label: 'Activate Fitting Room Hold System', labelAr: 'تفعيل حجز غرف القياس', type: 'BOOLEAN', defaultValue: true, required: false }
          ]
        }
      ],
      validationRules: [
        { ruleId: 'VAL-WCL-01', description: 'Style code and variant combination must uniquely identify a distinct SKU', severity: 'ERROR' }
      ]
    },

    // ========================================================================
    // PROFILE 05: RETAIL — CHILDREN'S CLOTHING
    // ========================================================================
    RETAIL_CHILDRENS_CLOTHING: {
      profileId: 'RETAIL_CHILDRENS_CLOTHING',
      name: "Fashion Retail — Children's Apparel & Babywear",
      nameAr: 'تجارة الأزياء — ملابس الأطفال والمواليد',
      family: 'RETAIL_FASHION',
      businessModel: 'B2C',
      requiredModules: ['POS', 'INVENTORY', 'ACCOUNTING'],
      optionalModules: ['PURCHASING', 'CRM', 'REPORTING'],
      requiredMasters: ['STYLES', 'AGE_GROUPS', 'COLORS', 'SIZES', 'SAFETY_CERTIFICATIONS', 'GIFT_BOXES'],
      requiredAttributes: ['AGE_GROUP_RANGE', 'SAFETY_TAG', 'MATERIAL_ORGANIC_COTTON', 'CARE_INSTRUCTIONS', 'GIFT_ELIGIBILITY'],
      requiredDocuments: ['POS_RECEIPT', 'GIFT_RECEIPT', 'SAFETY_COMPLIANCE_LABEL', 'EXCHANGE_VOUCHER'],
      requiredWorkflows: ['AGE_GROUP_MATRIX_SELECTION', 'GIFT_RECEIPT_ISSUANCE', 'SAFETY_TAG_VERIFICATION', 'RESERVATION_HOLD'],
      inventoryModel: 'VARIANT_MATRIX',
      costingModel: 'STANDARD_COST',
      revenueModel: 'RETAIL_STORE',
      purchasingModel: 'SEASONAL_BULK',
      salesModel: 'DIRECT_RETAIL',
      warehouseModel: 'RETAIL_BACKSTORE',
      pricingModel: 'SEASONAL_MARKDOWN',
      taxConfiguration: {
        recommendedJurisdiction: 'EGYPT_ETA',
        standardVatRate: 0.14,
        withholdingTaxApplicable: false,
        zeroRatedCategories: ['BABY_ESSENTIALS_ZERO_VAT'],
        exemptCategories: []
      },
      defaultCoaTemplate: [
        { code: '1110', name: 'Cash Register - Kids Store', nameAr: 'نقدية متجر ملابس الأطفال', type: 'ASSET', category: 'CASH', description: 'Store POS drawer' },
        { code: '1210', name: 'Accounts Receivable - Corporate & Nursery Clients', nameAr: 'العملاء وحسابات القبض', type: 'ASSET', category: 'RECEIVABLES', description: 'Nursery and school bulk accounts' },
        { code: '1310', name: "Merchandise Inventory - Children's Apparel", nameAr: 'مخزون ملابس الأطفال والمواليد', type: 'ASSET', category: 'INVENTORY', description: 'Babywear, toddler, kids apparel' },
        { code: '1320', name: 'Merchandise Inventory - Gift Boxes & Sets', nameAr: 'مخزون هدايا المواليد والأطقم', type: 'ASSET', category: 'INVENTORY', description: 'Gift hampers, gift wrap, accessories' },
        { code: '2110', name: 'Accounts Payable - Kids Wear Suppliers', nameAr: 'الموردون ومصنعو ملابس الأطفال', type: 'LIABILITY', category: 'CURRENT_LIABILITY', description: 'Suppliers of babywear and organic garments' },
        { code: '2210', name: 'Output VAT - Children Wear Sales', nameAr: 'ضريبة القيمة المضافة المستحقة', type: 'LIABILITY', category: 'TAX', description: 'Output VAT' },
        { code: '4110', name: "Children's Wear Sales Revenue", nameAr: 'إيرادات مبيعات ملابس الأطفال', type: 'REVENUE', category: 'OPERATING_REVENUE', description: 'Kids garments sales' },
        { code: '4120', name: 'Gift Sets & Accessories Revenue', nameAr: 'إيرادات مبيعات الهدايا والأطقم', type: 'REVENUE', category: 'OPERATING_REVENUE', description: 'Baby shower and gift set sales' },
        { code: '4190', name: 'Sales Discounts & Seasonal Markdown', nameAr: 'تخفيضات المبيعات والأوكازيون', type: 'REVENUE', category: 'CONTRA_REVENUE', description: 'Discounts granted' },
        { code: '5110', name: "Cost of Children's Wear Sold", nameAr: 'تكلفة مبيعات ملابس الأطفال', type: 'EXPENSE', category: 'COGS', description: 'Garment costs' }
      ],
      accountingMappings: {
        inventoryAssetAccount: '1310',
        giftInventoryAccount: '1320',
        cogsAccount: '5110',
        revenueAccount: '4110',
        giftRevenueAccount: '4120'
      },
      operationalKpis: [
        { id: 'KPI-KID-01', name: 'Sales by Age Bracket (0-1Y, 1-3Y, 4-8Y)', nameAr: 'توزيع المبيعات حسب الفئات العمرية', calculationMethod: 'SalesByAgeGroup / TotalSales * 100', targetDirection: 'RANGE', unit: 'PERCENT' },
        { id: 'KPI-KID-02', name: 'Gift Receipt Issuance Ratio', nameAr: 'نسبة إصدار فواتير الهدايا', calculationMethod: 'GiftReceiptsCount / TotalTransactions * 100', targetDirection: 'HIGHER_IS_BETTER', unit: 'PERCENT' },
        { id: 'KPI-KID-03', name: 'Organic / Hypoallergenic Sales Share', nameAr: 'حصة المنتجات العضوية والقطنية', calculationMethod: 'OrganicRevenue / TotalRevenue * 100', targetDirection: 'HIGHER_IS_BETTER', unit: 'PERCENT' }
      ],
      reports: ["Children's Apparel Variant Matrix (Age x Color)", 'Sales Distribution by Age Group', 'Gift Receipt Exchanges Ledger', 'Safety Compliance Audit', 'Sell-Through by Season'],
      dashboardWidgets: ['Age Group Sales Donut', 'Gift Receipts Today', 'Babywear Stock Levels'],
      permissions: ['GIFT_RECEIPT_ISSUE', 'SAFETY_TAG_VALIDATE', 'AGE_SCALE_MANAGE'],
      wizardSteps: [
        {
          stepNumber: 15,
          stepKey: 'childrens_sizing_setup',
          title: 'Configurable Age & Sizing Scales',
          titleAr: 'إعداد مقاييس الأعمار والمقاسات للأطفال',
          description: 'Configure standard age scales (0-3M, 3-6M, 1Y, 2Y, Toddler, Kids).',
          isRequired: true,
          fields: [
            { key: 'ageScaleTemplate', label: 'Child Age Sizing Template', labelAr: 'قالب المقاسات العمرية', type: 'SELECT', defaultValue: 'NEWBORN_TO_14Y', options: [{ label: 'Full Scale: 0-3M to 14Y', value: 'NEWBORN_TO_14Y' }, { label: 'Toddlers Only: 1Y to 5Y', value: 'TODDLERS_1Y_5Y' }], required: true },
            { key: 'enableGiftReceipts', label: 'Support Gift Receipts without Prices', labelAr: 'دعم إيصالات الهدايا بدون سعر', type: 'BOOLEAN', defaultValue: true, required: false }
          ]
        }
      ],
      validationRules: [
        { ruleId: 'VAL-KCL-01', description: 'Age group range must be specified for every children garment', severity: 'ERROR' }
      ]
    },

    // ========================================================================
    // PROFILE 06: MANUFACTURING — WOMEN'S APPAREL
    // ========================================================================
    MFG_WOMENS_APPAREL: {
      profileId: 'MFG_WOMENS_APPAREL',
      name: "Industrial Manufacturing — Women's Apparel",
      nameAr: 'التصنيع الصناعي — الملابس الجاهزة والنسائية',
      family: 'MANUFACTURING_APPAREL',
      businessModel: 'MAKE_TO_ORDER',
      requiredModules: ['MANUFACTURING', 'INVENTORY', 'ACCOUNTING', 'PURCHASING'],
      optionalModules: ['SALES', 'QUALITY', 'PLM'],
      requiredMasters: ['STYLES', 'FABRICS', 'TRIMS', 'CUT_TABLES', 'SEWING_LINES', 'OPERATIONS', 'PIECE_RATES'],
      requiredAttributes: ['FABRIC_WIDTH_CM', 'MARKER_YIELD_PERCENT', 'PATTERN_PIECES', 'SEWING_SAM', 'BUNDLE_NUMBER'],
      requiredDocuments: ['MARKER_PLAN', 'CUT_ORDER', 'BUNDLE_TICKET', 'PIECE_RATE_SHEET', 'QUALITY_AUDIT_REPORT', 'FG_TRANSFER_NOTE'],
      requiredWorkflows: ['STYLE_BOM_EXPLOSION', 'CUT_ORDER_GENERATION', 'BUNDLE_TICKET_TRACKING', 'PIECE_RATE_LABOUR_LOGGING', 'WIP_SETTLEMENT'],
      inventoryModel: 'LOT_BATCH',
      costingModel: 'PIECE_RATE_LABOUR',
      revenueModel: 'TERRITORY_WHOLESALE',
      purchasingModel: 'FABRIC_TRIM_CONTRACT',
      salesModel: 'DIRECT_RETAIL',
      productionModel: 'APPAREL_CUT_AND_SEW',
      warehouseModel: 'FABRIC_ROLL_STORAGE',
      pricingModel: 'LIST_PRICE',
      taxConfiguration: {
        recommendedJurisdiction: 'EGYPT_ETA',
        standardVatRate: 0.14,
        withholdingTaxApplicable: true,
        zeroRatedCategories: ['EXPORT_APPAREL_MANUFACTURING'],
        exemptCategories: []
      },
      defaultCoaTemplate: [
        { code: '1110', name: 'Operating Bank Account - Apparel Factory', nameAr: 'الحساب البنكي الجاري للمصنع', type: 'ASSET', category: 'CASH', description: 'Factory commercial bank account' },
        { code: '1310', name: 'Raw Materials - Fabric Rolls Inventory', nameAr: 'مخزون الأقمشة ورولات القماش الخام', type: 'ASSET', category: 'INVENTORY', description: 'Fabrics (silk, cotton, polyester)' },
        { code: '1320', name: 'Raw Materials - Trims, Zippers & Buttons', nameAr: 'مخزون الكلف والإكسسوارات والسحابات والأزرار', type: 'ASSET', category: 'INVENTORY', description: 'Trims, threads, interlining, buttons' },
        { code: '1350', name: 'Work in Process (WIP) - Cutting & Sewing Lines', nameAr: 'إنتاج تحت التشغيل - خطوط القص والحياكة', type: 'ASSET', category: 'INVENTORY', description: 'Cut bundles and partially sewn garments' },
        { code: '1380', name: 'Finished Goods - Manufactured Garments', nameAr: 'مخزون الإنتاج التام - الملابس الجاهزة', type: 'ASSET', category: 'INVENTORY', description: 'Completed, pressed, and packed garments' },
        { code: '2130', name: 'Accrued Piece-Rate Sewing Wages Payable', nameAr: 'أجور عمال الحياكة المستحقة (بالقطعة)', type: 'LIABILITY', category: 'CURRENT_LIABILITY', description: 'Piece-rate earnings owed to operators' },
        { code: '4110', name: 'Wholesale Manufactured Apparel Revenue', nameAr: 'إيرادات مبيعات الملابس المصنعة بالجملة', type: 'REVENUE', category: 'OPERATING_REVENUE', description: 'Finished garments wholesale shipments' },
        { code: '5110', name: 'Direct Fabric Consumption Cost', nameAr: 'تكلفة استهلاك الأقمشة المباشرة', type: 'EXPENSE', category: 'COGS', description: 'Meters of fabric consumed in cut orders' },
        { code: '5120', name: 'Direct Trims & Accessories Cost', nameAr: 'تكلفة استهلاك الكلف ومستلزمات الإنتاج', type: 'EXPENSE', category: 'COGS', description: 'Buttons, zippers, threads' },
        { code: '5130', name: 'Direct Piece-Rate Manufacturing Labour', nameAr: 'الأجور المباشرة لتشغيل الملابس (بالقطعة)', type: 'EXPENSE', category: 'COGS', description: 'Cutters, sewers, ironers piece-rate wages' },
        { code: '5140', name: 'Factory Overhead & Cutting Scrap Expense', nameAr: 'أعباء المصنع وهوالك أطراف القص', type: 'EXPENSE', category: 'COGS', description: 'Fabric wastage and factory utility allocation' }
      ],
      accountingMappings: {
        rawFabricAccount: '1310',
        rawTrimsAccount: '1320',
        wipAccount: '1350',
        finishedGoodsAccount: '1380',
        pieceRateWagesPayableAccount: '2130',
        fabricCogsAccount: '5110',
        trimsCogsAccount: '5120',
        pieceRateLabourCogsAccount: '5130',
        scrapExpenseAccount: '5140'
      },
      operationalKpis: [
        { id: 'KPI-MWA-01', name: 'Marker Fabric Yield Efficiency %', nameAr: 'كفاءة التعشيق وهدر القماش %', calculationMethod: 'PatternArea / MarkerArea * 100', targetDirection: 'HIGHER_IS_BETTER', unit: 'PERCENT' },
        { id: 'KPI-MWA-02', name: 'Sewing Operator Piece-Rate Productivity', nameAr: 'إنتاجية عامل الحياكة (قطعة/يوم)', calculationMethod: 'CompletedPieces / OperatorWorkingDays', targetDirection: 'HIGHER_IS_BETTER', unit: 'COUNT' },
        { id: 'KPI-MWA-03', name: 'End-of-Line Quality Defect Rate', nameAr: 'نسبة عيوب الجودة نهاية الخط', calculationMethod: 'RejectedGarments / TotalCutGarments * 100', targetDirection: 'LOWER_IS_BETTER', unit: 'PERCENT' }
      ],
      reports: ['Cut Order Execution & Yield Variance', 'Bundle Tickets Tracking & Floor WIP', 'Operator Piece-Rate Payroll Calculation', 'Garment Cost Rollup (Fabric + Trim + Labor + Overhead)', 'Quality Inspection Defect Analysis', 'Finished Goods Warehouse Receipt Log'],
      dashboardWidgets: ['Active Cut Orders by Line', 'Fabric Utilization Rate Gauge', 'WIP Bundles on Floor', 'Daily Output vs Target'],
      permissions: ['CUT_ORDER_ISSUE', 'BUNDLE_TICKET_PRINT', 'PIECE_RATE_APPROVE', 'QC_RELEASE_FG'],
      wizardSteps: [
        {
          stepNumber: 15,
          stepKey: 'apparel_mfg_setup',
          title: 'Cutting Tables & Sewing Lines',
          titleAr: 'طاولات القص وخطوط الحياكة',
          description: 'Configure cutting tables, sewing lines, and piece-rate standards.',
          isRequired: true,
          fields: [
            { key: 'cuttingTablesCount', label: 'Number of Cutting Tables', labelAr: 'عدد طاولات القص', type: 'NUMBER', defaultValue: 2, required: true },
            { key: 'sewingLinesCount', label: 'Number of Sewing Lines', labelAr: 'عدد خطوط الحياكة والتشغيل', type: 'NUMBER', defaultValue: 4, required: true },
            { key: 'enablePieceRate', label: 'Enable Piece-Rate Labor Accounting', labelAr: 'تفعيل حساب الأجور بالقطعة', type: 'BOOLEAN', defaultValue: true, required: false }
          ]
        }
      ],
      validationRules: [
        { ruleId: 'VAL-MWA-01', description: 'Actual cut pieces cannot exceed planned cut pieces without supervisor approval', severity: 'WARNING' },
        { ruleId: 'VAL-MWA-02', description: 'Fabric yield marker percentage must be between 50% and 98%', severity: 'ERROR' }
      ]
    },

    // ========================================================================
    // PROFILE 07: MANUFACTURING — MEN'S APPAREL
    // ========================================================================
    MFG_MENS_APPAREL: {
      profileId: 'MFG_MENS_APPAREL',
      name: "Industrial Manufacturing — Men's Tailoring & Suiting",
      nameAr: 'التصنيع الصناعي — البدلات والملابس الرجالية',
      family: 'MANUFACTURING_APPAREL',
      businessModel: 'MAKE_TO_ORDER',
      requiredModules: ['MANUFACTURING', 'INVENTORY', 'ACCOUNTING', 'PURCHASING'],
      optionalModules: ['SALES', 'QUALITY', 'PLM'],
      requiredMasters: ['STYLES', 'FABRICS', 'INTERLININGS', 'SHOULDER_PADS', 'TAILORING_SPECS', 'CUT_TABLES', 'OPERATIONS'],
      requiredAttributes: ['FIT_TYPE', 'FABRIC_SHRINKAGE_PERCENT', 'CHEST_MEASUREMENT', 'WAIST_MEASUREMENT', 'CANVAS_CONSTRUCTION'],
      requiredDocuments: ['CUSTOM_MEASUREMENT_CARD', 'CUT_ORDER', 'BUNDLE_TICKET', 'PIECE_RATE_SHEET', 'TAILORING_QC_REPORT'],
      requiredWorkflows: ['CUSTOM_TAILORING_SPECS_CAPTURE', 'FABRIC_SHRINKAGE_COMPENSATION', 'MULTI_STAGE_PRESSING', 'PIECE_RATE_TRACKING'],
      inventoryModel: 'LOT_BATCH',
      costingModel: 'PIECE_RATE_LABOUR',
      revenueModel: 'TERRITORY_WHOLESALE',
      purchasingModel: 'FABRIC_TRIM_CONTRACT',
      salesModel: 'MADE_TO_MEASURE',
      productionModel: 'APPAREL_CUT_AND_SEW',
      warehouseModel: 'FABRIC_ROLL_STORAGE',
      pricingModel: 'LIST_PRICE',
      taxConfiguration: {
        recommendedJurisdiction: 'EGYPT_ETA',
        standardVatRate: 0.14,
        withholdingTaxApplicable: true,
        zeroRatedCategories: ['EXPORT_APPAREL_MANUFACTURING'],
        exemptCategories: []
      },
      defaultCoaTemplate: [
        { code: '1110', name: 'Operating Bank Account - Men Tailoring', nameAr: 'الحساب البنكي الجاري للمصنع', type: 'ASSET', category: 'CASH', description: 'Factory commercial bank account' },
        { code: '1210', name: 'Accounts Receivable - Suiting Clients', nameAr: 'العملاء وحسابات القبض', type: 'ASSET', category: 'RECEIVABLES', description: 'Wholesale and corporate client accounts' },
        { code: '1310', name: 'Raw Wool & Suit Fabric Inventory', nameAr: 'مخزون أصواف وأقمشة البدلات الرجالية', type: 'ASSET', category: 'INVENTORY', description: 'Wool, linen, blend suiting rolls' },
        { code: '1320', name: 'Linings, Horsehair Canvas & Pads', nameAr: 'مخزون البطانات وحشوات الصدر والكتف', type: 'ASSET', category: 'INVENTORY', description: 'Suit construction components' },
        { code: '1350', name: 'WIP - Suiting & Jacket Assembly', nameAr: 'إنتاج تحت التشغيل - تجميع البدلات والجاكيت', type: 'ASSET', category: 'INVENTORY', description: 'Jackets and trousers in tailoring lines' },
        { code: '1380', name: 'Finished Goods - Tailored Men Suits', nameAr: 'مخزون الإنتاج التام - البدلات والقمصان الرجالية', type: 'ASSET', category: 'INVENTORY', description: 'Suits, blazers, trousers, shirts' },
        { code: '2110', name: 'Accounts Payable - Fabric Mills & Trims', nameAr: 'الموردون ومصانع الغزل والنسيج', type: 'LIABILITY', category: 'CURRENT_LIABILITY', description: 'Suppliers of wool rolls and suiting accessories' },
        { code: '4110', name: 'Men Suiting Wholesale Revenue', nameAr: 'إيرادات مبيعات البدلات والملابس الرجالية', type: 'REVENUE', category: 'OPERATING_REVENUE', description: 'Tailored suits revenue' },
        { code: '5110', name: 'Suiting Fabric Consumption Cost', nameAr: 'تكلفة استهلاك أقمشة البدلات', type: 'EXPENSE', category: 'COGS', description: 'Direct fabric usage' },
        { code: '5120', name: 'Tailoring Canvas & Linings Cost', nameAr: 'تكلفة الحشوات والبطانات', type: 'EXPENSE', category: 'COGS', description: 'Canvas and pads' },
        { code: '5130', name: 'Master Tailor & Sewing Labor Cost', nameAr: 'أجور الترزية وعمال الحياكة المتخصصة', type: 'EXPENSE', category: 'COGS', description: 'Direct labor' }
      ],
      accountingMappings: {
        rawFabricAccount: '1310',
        rawLiningsAccount: '1320',
        wipAccount: '1350',
        finishedGoodsAccount: '1380',
        fabricCogsAccount: '5110',
        liningsCogsAccount: '5120',
        tailoringLaborCogsAccount: '5130'
      },
      operationalKpis: [
        { id: 'KPI-MMA-01', name: 'Fitting First-Time Pass Rate', nameAr: 'نسبة مطابقة المقاسات من أول بروفة', calculationMethod: 'FirstTimePassGarments / TotalFittedGarments * 100', targetDirection: 'HIGHER_IS_BETTER', unit: 'PERCENT' },
        { id: 'KPI-MMA-02', name: 'Fabric Shrinkage Recovery Accuracy', nameAr: 'دقة معالجة انكماش القماش', calculationMethod: 'ActualShrinkage / EstimatedShrinkage * 100', targetDirection: 'RANGE', unit: 'PERCENT' },
        { id: 'KPI-MMA-03', name: 'Tailoring Order Cycle Time', nameAr: 'متوسط دورة إنجاز بدلة مفصلة (أيام)', calculationMethod: 'TotalDaysSpent / TotalSuitsCompleted', targetDirection: 'LOWER_IS_BETTER', unit: 'DAYS' }
      ],
      reports: ['Men Tailoring Specifications Ledger', 'Fabric Shrinkage Allowance Variance', 'Cut Order and Bundle Yield', 'Tailoring Line Production Output', 'Quality Control & Fitment Inspection'],
      dashboardWidgets: ['Suiting Orders in WIP', 'Tailoring Fitment Rate', 'Fabric Roll Inventory'],
      permissions: ['TAILORING_SPEC_EDIT', 'SHRINKAGE_ALLOWANCE_SET', 'SUIT_QC_RELEASE'],
      wizardSteps: [
        {
          stepNumber: 15,
          stepKey: 'mens_tailoring_setup',
          title: 'Tailoring Fit & Construction Options',
          titleAr: 'خيارات قصات البدلات وتفصيل الحشوات',
          description: 'Configure standard fit types (Slim, Regular, Tailored) and canvas builds.',
          isRequired: true,
          fields: [
            { key: 'defaultFitType', label: 'Default Fit Style', labelAr: 'القصة المعتمدة الافتراضية', type: 'SELECT', defaultValue: 'TAILORED', options: [{ label: 'Tailored Fit', value: 'TAILORED' }, { label: 'Slim Fit', value: 'SLIM' }, { label: 'Regular Classic', value: 'REGULAR' }], required: true },
            { key: 'defaultShrinkageAllowance', label: 'Default Fabric Shrinkage Allowance (%)', labelAr: 'نسبة سماحية انكماش القماش %', type: 'NUMBER', defaultValue: 3.5, required: true }
          ]
        }
      ],
      validationRules: [
        { ruleId: 'VAL-MMA-01', description: 'Tailoring specs must specify both chest and waist measurements', severity: 'ERROR' }
      ]
    },

    // ========================================================================
    // PROFILE 08: MANUFACTURING — CHILDREN'S APPAREL
    // ========================================================================
    MFG_CHILDRENS_APPAREL: {
      profileId: 'MFG_CHILDRENS_APPAREL',
      name: "Industrial Manufacturing — Children's Wear & Safety Compliance",
      nameAr: 'التصنيع الصناعي — ملابس الأطفال واشتراطات الأمان',
      family: 'MANUFACTURING_APPAREL',
      businessModel: 'MAKE_TO_STOCK',
      requiredModules: ['MANUFACTURING', 'INVENTORY', 'ACCOUNTING', 'QUALITY', 'PURCHASING'],
      optionalModules: ['SALES', 'PLM'],
      requiredMasters: ['STYLES', 'ORGANIC_FABRICS', 'SAFETY_SNAPS', 'PULL_TEST_STATIONS', 'NEEDLE_DETECTORS', 'CUT_TABLES'],
      requiredAttributes: ['AGE_BRACKET', 'BUTTON_PULL_FORCE_NEWTONS', 'CHOKING_HAZARD_FREE', 'NON_TOXIC_DYE_CERT', 'DRAWSTRING_FREE'],
      requiredDocuments: ['CHILD_SAFETY_QA_CERTIFICATE', 'NEEDLE_DETECTOR_LOG', 'CUT_ORDER', 'BUNDLE_TICKET', 'FG_SAFETY_RELEASE'],
      requiredWorkflows: ['SMALL_PARTS_PULL_TEST_QA', 'FERROUS_NEEDLE_DETECTION_SCAN', 'ORGANIC_DYE_TRACEABILITY', 'BUNDLE_TRACKING'],
      inventoryModel: 'LOT_BATCH',
      costingModel: 'STANDARD_COST',
      revenueModel: 'TERRITORY_WHOLESALE',
      purchasingModel: 'FABRIC_TRIM_CONTRACT',
      salesModel: 'DIRECT_RETAIL',
      productionModel: 'APPAREL_CUT_AND_SEW',
      warehouseModel: 'FABRIC_ROLL_STORAGE',
      pricingModel: 'LIST_PRICE',
      taxConfiguration: {
        recommendedJurisdiction: 'EGYPT_ETA',
        standardVatRate: 0.14,
        withholdingTaxApplicable: true,
        zeroRatedCategories: ['CHILDREN_SAFETY_ESSENTIALS'],
        exemptCategories: []
      },
      defaultCoaTemplate: [
        { code: '1110', name: 'Operating Bank Account - Children Apparel Factory', nameAr: 'الحساب البنكي الجاري للمصنع', type: 'ASSET', category: 'CASH', description: 'Factory commercial bank account' },
        { code: '1210', name: 'Accounts Receivable - Wholesale Customers', nameAr: 'العملاء وحسابات القبض', type: 'ASSET', category: 'RECEIVABLES', description: 'Wholesale kids apparel distributors' },
        { code: '1310', name: 'Raw Materials - Organic Certified Fabric', nameAr: 'مخزون الأقمشة القطنية العضوية المعتمدة', type: 'ASSET', category: 'INVENTORY', description: 'Non-toxic, organic certified fabrics' },
        { code: '1320', name: 'Raw Materials - Safety Snaps & Trims', nameAr: 'مخزون كباسين وأزرار الأمان الخالية من الرصاص', type: 'ASSET', category: 'INVENTORY', description: 'Lead-free snaps, soft elastics' },
        { code: '1350', name: 'WIP - Children Garments Lines', nameAr: 'إنتاج تحت التشغيل - خطوط ملابس الأطفال', type: 'ASSET', category: 'INVENTORY', description: 'Cut and sewing bundles on floor' },
        { code: '1380', name: 'Finished Goods - Inspected Kids Apparel', nameAr: 'مخزون الإنتاج التام - ملابس الأطفال المفحوصة', type: 'ASSET', category: 'INVENTORY', description: 'Ready garments passed needle & pull test' },
        { code: '2110', name: 'Accounts Payable - Organic Fabric Suppliers', nameAr: 'الموردون ومصانع الغزول العضوية', type: 'LIABILITY', category: 'CURRENT_LIABILITY', description: 'Trade payables for certified cotton' },
        { code: '4110', name: 'Children Apparel Manufacturing Revenue', nameAr: 'إيرادات تصنيع وتوريد ملابس الأطفال', type: 'REVENUE', category: 'OPERATING_REVENUE', description: 'Wholesale sales of children garments' },
        { code: '5110', name: 'Direct Fabric Consumption Cost', nameAr: 'تكلفة استهلاك الأقمشة القطنية', type: 'EXPENSE', category: 'COGS', description: 'Fabric usage' },
        { code: '5120', name: 'Safety Trims & Accessories Cost', nameAr: 'تكلفة كباسين ومستلزمات الأمان', type: 'EXPENSE', category: 'COGS', description: 'Snaps and threads' },
        { code: '5210', name: 'Safety QA Inspection & Laboratory Testing', nameAr: 'مصروفات فحص الجودة واختبارات الأمان', type: 'EXPENSE', category: 'OPERATING_EXPENSE', description: 'Pull tests, chemical and dye lab assays' }
      ],
      accountingMappings: {
        rawFabricAccount: '1310',
        rawTrimsAccount: '1320',
        wipAccount: '1350',
        finishedGoodsAccount: '1380',
        fabricCogsAccount: '5110',
        trimsCogsAccount: '5120',
        qaExpenseAccount: '5210'
      },
      operationalKpis: [
        { id: 'KPI-KMA-01', name: 'Safety QA 100% Inspection Pass Rate', nameAr: 'نسبة اجتياز اختبارات الأمان والسلامة %', calculationMethod: 'PassedSafetyAudits / TotalAudits * 100', targetDirection: 'HIGHER_IS_BETTER', unit: 'PERCENT' },
        { id: 'KPI-KMA-02', name: 'Needle Detector Clear Scan Rate', nameAr: 'نسبة الخلو من الإبر والشظايا المعدنية %', calculationMethod: 'ClearedGarments / ScannedGarments * 100', targetDirection: 'HIGHER_IS_BETTER', unit: 'PERCENT' },
        { id: 'KPI-KMA-03', name: 'Snap Pull-Force Compliance Rate', nameAr: 'نسبة مطابقة قوة شد الكباسين %', calculationMethod: 'CompliantSnaps / TotalTestedSnaps * 100', targetDirection: 'HIGHER_IS_BETTER', unit: 'PERCENT' }
      ],
      reports: ['Child Safety QA & Pull-Test Audit Certificate', 'Needle Detector Calibration & Scan Log', 'Cut Order Yield & Bundle Report', 'Material Compliance & Non-Toxic Dye Log', 'Finished Goods Safety Release Ledger'],
      dashboardWidgets: ['Safety QA Pass Rate Gauge', 'Needle Detector Daily Scans', 'WIP Children Bundles'],
      permissions: ['SAFETY_QA_SIGN_OFF', 'PULL_TEST_RECORD', 'NEEDLE_SCAN_OVERSEE', 'SAFETY_RELEASE_FG'],
      wizardSteps: [
        {
          stepNumber: 15,
          stepKey: 'children_safety_setup',
          title: 'Safety Standards & Testing Checkpoints',
          titleAr: 'معايير أمان ملابس الأطفال ونقاط الفحص',
          description: 'Setup mandatory pull-force thresholds (e.g. 70 Newtons) and needle detection scans.',
          isRequired: true,
          fields: [
            { key: 'minimumPullForceNewtons', label: 'Minimum Button Pull Force (Newtons)', labelAr: 'الحد الأدنى لقوة شد الأزرار (نيوتن)', type: 'NUMBER', defaultValue: 70, required: true },
            { key: 'mandatoryNeedleScan', label: 'Mandatory Needle Detector Scan before FG Release', labelAr: 'إلزام الفحص بكاشف الإبر قبل الإفراج', type: 'BOOLEAN', defaultValue: true, required: true }
          ]
        }
      ],
      validationRules: [
        { ruleId: 'VAL-KMA-01', description: 'Children finished goods cannot be released without passed safety QA audit', severity: 'ERROR' },
        { ruleId: 'VAL-KMA-02', description: 'Drawstrings on hood and neck are strictly prohibited for infant/toddler wear', severity: 'ERROR' }
      ]
    }
  };

  /**
   * Returns all 8 approved pilot industry profiles
   */
  public static getAllProfiles(): IndustryProfileDefinition[] {
    return Object.values(this.PROFILES).map(p => ({
      ...p,
      coaTemplate: p.defaultCoaTemplate,
      defaultKpis: p.operationalKpis
    }));
  }

  /**
   * Retrieves profile definition by ID
   */
  public static getProfile(profileId: PilotIndustryProfileId): IndustryProfileDefinition {
    const profile = this.PROFILES[profileId];
    if (!profile) {
      throw new Error(`Industry profile "${profileId}" is not registered.`);
    }
    return {
      ...profile,
      coaTemplate: profile.defaultCoaTemplate,
      defaultKpis: profile.operationalKpis
    };
  }

  /**
   * Returns standard COA template for given profile
   */
  public static getCoaTemplate(profileId: PilotIndustryProfileId) {
    return this.getProfile(profileId).defaultCoaTemplate;
  }

  /**
   * Returns dynamic wizard steps for given profile
   */
  public static getWizardSteps(profileId: PilotIndustryProfileId) {
    return this.getProfile(profileId).wizardSteps;
  }

  /**
   * Validates profile configuration
   */
  public static validateProfileIntegrity(profile: IndustryProfileDefinition): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!profile.profileId) errors.push('Profile ID is required');
    if (!profile.name) errors.push('Profile Name is required');
    if (!profile.defaultCoaTemplate || profile.defaultCoaTemplate.length === 0) errors.push('COA template is required');
    if (!profile.operationalKpis || profile.operationalKpis.length === 0) errors.push('Operational KPIs are required');
    return { isValid: errors.length === 0, errors };
  }
}
