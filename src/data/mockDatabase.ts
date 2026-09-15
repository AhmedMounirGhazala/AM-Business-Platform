/**
 * AM Business Platform - Seed Data Repository & Memory Store
 * Real enterprise dataset with dual-language support (AR / EN)
 * Compliant with SAP / Oracle ERP Cloud / Dynamics 365 Architecture
 */

import { 
  Account, 
  ApprovalRequest, 
  AuditLog, 
  Branch,
  Company, 
  CostCenter,
  Currency,
  Customer, 
  CustomerPayment,
  Department,
  DocumentNumberingRule, 
  Employee, 
  ExchangeRate,
  FinancialEvent,
  FiscalYear,
  FiscalPeriod,
  InventoryItem, 
  ItemCategory,
  JournalEntry, 
  Lead, 
  PaymentTerm,
  PostingRule,
  ProfitCenter,
  Project,
  PurchaseInvoice,
  PurchaseOrder, 
  SalesInvoice, 
  StockMovement, 
  SupplierPayment,
  TaxRule,
  Tenant, 
  UnitOfMeasure,
  User, 
  Vendor, 
  Warehouse, 
  WorkflowRule,
  CountryMaster,
  TaxSystemMaster,
  StateProvinceMaster,
  CityMaster,
  TimezoneMaster,
  LanguageMaster,
  FiscalCalendarMaster
} from '../types';

import { 
  VendorMaster, 
  PurchaseRequisition, 
  RequestForQuotation, 
  RFQSupplierInvitation,
  VendorQuotation, 
  RFQAward,
  PurchaseOrder as ProcurementPurchaseOrder,
  VendorCategory,
  PaymentTerms,
  Incoterms,
  BuyerGroup,
  PurchasingOrganization,
  PurchaseOrderAmendment,
  GoodsReceiptNote,
  GoodsReceiptItem,
  VendorReturnNote,
  PurchaseAuditRecord,
  PurchaseApprovalRule,
  VendorPriceHistoryRecord
} from '../types/procurement';

import {
  SupplierInvoice,
  APVoucher,
  SupplierCreditNote,
  PaymentProposal,
  PaymentBatch,
  APAuditRecord
} from '../types/accountsPayable';

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'ten-001',
    name: 'AM Holding Group',
    code: 'AMHG',
    edition: 'Enterprise',
    ownerEmail: 'a.mounir369@gmail.com',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'ten-002',
    name: 'Al-Badr Trading & Logistics',
    code: 'ABTL',
    edition: 'Professional',
    ownerEmail: 'ceo@albadr.sa',
    active: true,
    createdAt: '2026-02-15T10:00:00Z',
  }
];

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-001',
    tenantId: 'ten-001',
    name: 'AM Tech Solutions - HQ',
    nameAr: 'مجموعة إيه إم للحلول التقنية - المقر الرئيسي',
    code: 'AMHQ',
    taxNumber: '310984728100003',
    currency: 'SAR',
    country: 'Saudi Arabia',
    countryCode: 'SA',
    state: 'Riyadh Province',
    city: 'Riyadh',
    taxSystemId: 'tax-sys-sa-vat',
    taxSystemName: 'Saudi Arabia VAT (15% ZATCA Phase 2)',
    taxRate: 15,
    timezone: 'Asia/Riyadh',
    dateFormat: 'YYYY-MM-DD',
    numberFormat: '1,234.56',
    language: 'ar',
    fiscalYearStart: '01-01',
    address: 'King Fahd Road, Olaya District, Riyadh, KSA',
    phone: '+966 11 482 9100',
    email: 'info@amtech.sa',
    website: 'https://amtech.sa'
  },
  {
    id: 'comp-002',
    tenantId: 'ten-001',
    name: 'AM General Trading UAE',
    nameAr: 'إيه إم للتجارة العامة الإمارات',
    code: 'AMUAE',
    taxNumber: '100482910400003',
    currency: 'AED',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    state: 'Dubai',
    city: 'Dubai',
    taxSystemId: 'tax-sys-uae-vat',
    taxSystemName: 'UAE VAT (5% FTA)',
    taxRate: 5,
    timezone: 'Asia/Dubai',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,234.56',
    language: 'ar',
    fiscalYearStart: '01-01',
    address: 'Business Bay Tower, Dubai, UAE',
    phone: '+971 4 391 8200',
    email: 'dubai@amtrading.ae',
    website: 'https://amtrading.ae'
  },
  {
    id: 'comp-003',
    tenantId: 'ten-001',
    name: 'AM Nile Tech Egypt',
    nameAr: 'إيه إم تقنية النيل مصر',
    code: 'AMEGY',
    taxNumber: '492810482',
    currency: 'EGP',
    country: 'Egypt',
    countryCode: 'EG',
    state: 'Cairo Governorate',
    city: 'Cairo',
    taxSystemId: 'tax-sys-eg-vat',
    taxSystemName: 'Egypt VAT (14% ETA e-Invoicing)',
    taxRate: 14,
    timezone: 'Africa/Cairo',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,234.56',
    language: 'ar',
    fiscalYearStart: '07-01',
    address: '90th Street North, Fifth Settlement, New Cairo, Egypt',
    phone: '+20 2 2819 4000',
    email: 'egypt@amtech.com.eg',
    website: 'https://amtech.com.eg'
  }
];

export const INITIAL_BRANCHES: Branch[] = [
  { id: 'br-001', tenantId: 'ten-001', companyId: 'comp-001', code: 'BR-RYD', name: 'Riyadh Main Branch', nameAr: 'فرع الرياض الرئيسي', city: 'Riyadh', active: true },
  { id: 'br-002', tenantId: 'ten-001', companyId: 'comp-001', code: 'BR-JED', name: 'Jeddah Commercial Branch', nameAr: 'فرع جدة التجاري', city: 'Jeddah', active: true }
];

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-01', tenantId: 'ten-001', companyId: 'comp-001', code: 'DEPT-EXEC', name: 'Executive Management', nameAr: 'الإدارة التنفيذية' },
  { id: 'dept-02', tenantId: 'ten-001', companyId: 'comp-001', code: 'DEPT-FIN', name: 'Finance & Treasury', nameAr: 'المالية والخزينة' },
  { id: 'dept-03', tenantId: 'ten-001', companyId: 'comp-001', code: 'DEPT-LOG', name: 'Logistics & Supply Chain', nameAr: 'الخدمات اللوجستية وسلاسل الإمداد' },
  { id: 'dept-04', tenantId: 'ten-001', companyId: 'comp-001', code: 'DEPT-SALES', name: 'Commercial Sales', nameAr: 'المبيعات التجارية' }
];

export const INITIAL_COST_CENTERS: CostCenter[] = [
  { id: 'cc-001', tenantId: 'ten-001', companyId: 'comp-001', code: 'CC-ADMIN', name: 'General & Administrative', nameAr: 'المصاريف العمومية والإدارية', departmentId: 'dept-01', active: true },
  { id: 'cc-002', tenantId: 'ten-001', companyId: 'comp-001', code: 'CC-IT', name: 'IT Infrastructure & Cloud', nameAr: 'مركز تقنية المعلومات والسحابة', departmentId: 'dept-02', active: true },
  { id: 'cc-003', tenantId: 'ten-001', companyId: 'comp-001', code: 'CC-MARKETING', name: 'Marketing & Sales Growth', nameAr: 'مركز التسويق والمبيعات', departmentId: 'dept-04', active: true }
];

export const INITIAL_PROFIT_CENTERS: ProfitCenter[] = [
  { id: 'pc-001', tenantId: 'ten-001', companyId: 'comp-001', code: 'PC-SAAS', name: 'Cloud SaaS Operations', nameAr: 'مركز أرباح الاشتراكات السحابية', active: true },
  { id: 'pc-002', tenantId: 'ten-001', companyId: 'comp-001', code: 'PC-HW', name: 'Hardware & Infrastructure Distribution', nameAr: 'مركز أرباح توزيع المعدات والشبكات', active: true }
];

export const INITIAL_PROJECTS: Project[] = [
  { id: 'prj-001', tenantId: 'ten-001', companyId: 'comp-001', code: 'PRJ-NEOM-01', name: 'NEOM Smart Gate Deployment', nameAr: 'مشروع بوابات نيوم الذكية', budget: 1500000, status: 'Active' },
  { id: 'prj-002', tenantId: 'ten-001', companyId: 'comp-001', code: 'PRJ-ARAMCO-22', name: 'Aramco Cyber-Shield Integration', nameAr: 'مشروع ربط نظام أرامكو السيبراني', budget: 850000, status: 'Active' }
];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  { id: 'wh-001', tenantId: 'ten-001', companyId: 'comp-001', branchId: 'br-001', name: 'Central Warehouse - Riyadh', nameAr: 'المستودع المركزي - الرياض', code: 'WH-RYD-01', isMain: true },
  { id: 'wh-002', tenantId: 'ten-001', companyId: 'comp-001', branchId: 'br-002', name: 'Jeddah Regional Logistics Hub', nameAr: 'مركز الميناء واللوجستيات - جدة', code: 'WH-JED-02', isMain: false }
];

export const INITIAL_CURRENCIES: Currency[] = [
  { code: 'SAR', name: 'Saudi Riyal', nameAr: 'ريال سعودي', symbol: 'ر.س', isBaseCurrency: true },
  { code: 'AED', name: 'UAE Dirham', nameAr: 'درهم إماراتي', symbol: 'د.إ', isBaseCurrency: false },
  { code: 'USD', name: 'US Dollar', nameAr: 'دولار أمريكي', symbol: '$', isBaseCurrency: false },
  { code: 'EUR', name: 'Euro', nameAr: 'يورو', symbol: '€', isBaseCurrency: false }
];

export const INITIAL_EXCHANGE_RATES: ExchangeRate[] = [
  { id: 'fx-1', tenantId: 'ten-001', fromCurrency: 'USD', toCurrency: 'SAR', rate: 3.75, effectiveDate: '2026-01-01' },
  { id: 'fx-2', tenantId: 'ten-001', fromCurrency: 'AED', toCurrency: 'SAR', rate: 1.02, effectiveDate: '2026-01-01' },
  { id: 'fx-3', tenantId: 'ten-001', fromCurrency: 'EUR', toCurrency: 'SAR', rate: 4.08, effectiveDate: '2026-01-01' }
];

export const INITIAL_FISCAL_YEARS: FiscalYear[] = [
  { id: 'fy-2026', tenantId: 'ten-001', companyId: 'comp-001', year: 2026, startDate: '2026-01-01', endDate: '2026-12-31', isClosed: false }
];

export const INITIAL_FISCAL_PERIODS: FiscalPeriod[] = Array.from({ length: 12 }, (_, i) => {
  const month = String(i + 1).padStart(2, '0');
  return {
    id: `fp-2026-${month}`,
    fiscalYearId: 'fy-2026',
    periodNumber: i + 1,
    startDate: `2026-${month}-01`,
    endDate: `2026-${month}-28`,
    isLocked: i < 7 // Lock past months up to July
  };
});

export const INITIAL_TAX_RULES: TaxRule[] = [
  { id: 'tax-ksa-15', tenantId: 'ten-001', companyId: 'comp-001', code: 'VAT15', name: 'KSA Standard VAT 15%', nameAr: 'ضريبة القيمة المضافة 15%', rate: 0.15, taxAccountCode: '2020', isActive: true, countryCode: 'SA', taxSystemId: 'tax-sys-sa-vat', taxCategory: 'STANDARD', effectiveFrom: '2020-07-01' },
  { id: 'tax-ksa-05-hist', tenantId: 'ten-001', companyId: 'comp-001', code: 'VAT5_HIST', name: 'KSA Historical VAT 5%', nameAr: 'ضريبة القيمة المضافة السابقة 5%', rate: 0.05, taxAccountCode: '2020', isActive: true, countryCode: 'SA', taxSystemId: 'tax-sys-sa-vat', taxCategory: 'STANDARD', effectiveFrom: '2018-01-01', effectiveTo: '2020-06-30' },
  { id: 'tax-egy-14', tenantId: 'ten-001', companyId: 'comp-001', code: 'VAT14', name: 'Egypt Standard VAT 14%', nameAr: 'ضريبة القيمة المضافة مصر 14%', rate: 0.14, taxAccountCode: '2020', isActive: true, countryCode: 'EG', taxSystemId: 'tax-sys-eg-vat', taxCategory: 'STANDARD', effectiveFrom: '2016-09-08' },
  { id: 'tax-zero', tenantId: 'ten-001', companyId: 'comp-001', code: 'VAT0', name: 'Zero Rated / Export', nameAr: 'معفى / صادر معفى', rate: 0, taxAccountCode: '2020', isActive: true, taxCategory: 'ZERO_RATED', effectiveFrom: '2018-01-01' },
  { id: 'tax-exempt', tenantId: 'ten-001', companyId: 'comp-001', code: 'VAT_EXEMPT', name: 'Tax Exempt', nameAr: 'معفى ضريبياً', rate: 0, taxAccountCode: '2020', isActive: true, taxCategory: 'EXEMPT', effectiveFrom: '2018-01-01' },
  { id: 'tax-wht-1', tenantId: 'ten-001', companyId: 'comp-001', code: 'WHT1', name: 'Withholding Tax 1%', nameAr: 'ضريبة الاستقطاع 1%', rate: 0.01, taxAccountCode: '2020', isActive: true, effectiveFrom: '2018-01-01' }
];

export const INITIAL_UNITS_OF_MEASURE: UnitOfMeasure[] = [
  { id: 'uom-01', tenantId: 'ten-001', code: 'PCS', name: 'Pieces', nameAr: 'حبة' },
  { id: 'uom-02', tenantId: 'ten-001', code: 'LIC', name: 'Licenses', nameAr: 'رخصة' },
  { id: 'uom-03', tenantId: 'ten-001', code: 'BOX', name: 'Box / Carton', nameAr: 'صندوق' },
  { id: 'uom-04', tenantId: 'ten-001', code: 'HRS', name: 'Consulting Hours', nameAr: 'ساعة استشارية' }
];

export const INITIAL_ITEM_CATEGORIES: ItemCategory[] = [
  { id: 'cat-01', tenantId: 'ten-001', code: 'CAT-HW', name: 'Hardware & Infrastructure', nameAr: 'المعدات والأجهزة والشبكات', inventoryAccountCode: '1030', cogsAccountCode: '5010', revenueAccountCode: '4010', valuationMethod: 'FIFO' },
  { id: 'cat-02', tenantId: 'ten-001', code: 'CAT-SW', name: 'Software Licenses', nameAr: 'التراخيص والبرمجيات', inventoryAccountCode: '1030', cogsAccountCode: '5010', revenueAccountCode: '4010', valuationMethod: 'Weighted Average' }
];

export const INITIAL_PAYMENT_TERMS: PaymentTerm[] = [
  { id: 'pt-01', tenantId: 'ten-001', code: 'NET30', name: 'Net 30 Days', nameAr: 'سداد خلال 30 يوماً', dueDays: 30 },
  { id: 'pt-02', tenantId: 'ten-001', code: 'IMMEDIATE', name: 'Due Upon Receipt', nameAr: 'دفع فور الاستلام', dueDays: 0 },
  { id: 'pt-03', tenantId: 'ten-001', code: 'NET60', name: 'Net 60 Days', nameAr: 'سداد خلال 60 يوماً', dueDays: 60 }
];

export const INITIAL_POSTING_RULES: PostingRule[] = [
  {
    id: 'pr-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    documentType: 'SalesInvoice',
    name: 'Standard Sales Invoice Posting Rule',
    debitAccountCode: '1020',  // Accounts Receivable
    creditAccountCode: '4010', // Sales Revenue
    taxAccountCode: '2020',    // Output VAT
    isActive: true
  },
  {
    id: 'pr-002',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    documentType: 'StockReceipt',
    name: 'Goods Receipt Purchase Rule',
    debitAccountCode: '1030',  // Inventory
    creditAccountCode: '2010', // Accounts Payable
    isActive: true
  },
  {
    id: 'pr-003',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    documentType: 'StockIssue',
    name: 'Stock Issue / COGS Posting Rule',
    debitAccountCode: '5010',  // COGS
    creditAccountCode: '1030', // Inventory
    isActive: true
  },
  {
    id: 'pr-004',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    documentType: 'CustomerPayment',
    name: 'Customer Cash / Bank Receipt Rule',
    debitAccountCode: '1010',  // Cash / Bank
    creditAccountCode: '1020', // Accounts Receivable
    isActive: true
  },
  {
    id: 'pr-005',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    documentType: 'SupplierPayment',
    name: 'Supplier Disbursement Payment Rule',
    debitAccountCode: '2010',  // Accounts Payable
    creditAccountCode: '1010', // Cash / Bank
    isActive: true
  },
  {
    id: 'pr-006',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    documentType: 'PurchaseInvoice',
    name: 'Standard Purchase Invoice Posting Rule',
    debitAccountCode: '1030',  // Inventory / Expense
    creditAccountCode: '2010', // Accounts Payable
    taxAccountCode: '1040',    // Input VAT Recoverable (Debit)
    isActive: true
  }
];

export const INITIAL_FINANCIAL_EVENTS: FinancialEvent[] = [
  {
    id: 'fe-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    eventType: 'SALES_INVOICE_POSTED',
    sourceDocumentType: 'SalesInvoice',
    sourceDocumentId: 'inv-001',
    sourceDocumentNumber: 'INV-2026-00104',
    amount: 250000,
    taxAmount: 37500,
    currency: 'SAR',
    eventDate: '2026-08-01',
    partyId: 'cust-001',
    partyName: 'Saudi Aramco Technology Ventures',
    description: 'Auto-posted financial event for Sales Invoice INV-2026-00104',
    triggeredBy: 'usr-001',
    status: 'PROCESSED',
    journalEntryId: 'je-001'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    name: 'Ahmed Mounir',
    email: 'a.mounir369@gmail.com',
    role: 'Super Admin',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
    permissions: [
      { module: 'all', actions: ['create', 'read', 'update', 'delete', 'approve', 'export'] }
    ]
  },
  {
    id: 'usr-002',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    name: 'Sari Mansour',
    email: 'sari.finance@am-platform.com',
    role: 'Finance Manager',
    active: true,
    createdAt: '2026-01-10T09:30:00Z',
    permissions: [
      { module: 'accounting', actions: ['create', 'read', 'update', 'approve', 'export'] }
    ]
  },
  {
    id: 'usr-003',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-002',
    name: 'Fatima Al-Zahra',
    email: 'fatima.auditor@am-platform.com',
    role: 'Auditor',
    active: true,
    createdAt: '2026-02-01T11:00:00Z',
    permissions: [
      { module: 'audit', actions: ['read', 'export'] },
      { module: 'accounting', actions: ['read', 'export'] }
    ]
  }
];

export const INITIAL_ACCOUNTS: Account[] = [
  // Assets
  { id: 'acc-1010', tenantId: 'ten-001', companyId: 'comp-001', code: '1010', name: 'Cash on Hand & Bank', nameAr: 'النقد في الخزينة والبنوك', category: 'Asset', accountType: 'Cash', balance: 1450000, currency: 'SAR', isActive: true, level: 1 },
  { id: 'acc-1020', tenantId: 'ten-001', companyId: 'comp-001', code: '1020', name: 'Accounts Receivable (AR)', nameAr: 'العملاء وحسابات القبض', category: 'Asset', accountType: 'Receivable', balance: 680000, currency: 'SAR', isActive: true, level: 1 },
  { id: 'acc-1030', tenantId: 'ten-001', companyId: 'comp-001', code: '1030', name: 'Merchandise Inventory', nameAr: 'مخزون البضائع للبيع', category: 'Asset', accountType: 'Inventory', balance: 920000, currency: 'SAR', isActive: true, level: 1 },
  { id: 'acc-1040', tenantId: 'ten-001', companyId: 'comp-001', code: '1040', name: 'Input VAT Recoverable', nameAr: 'ضريبة القيمة المضافة المدخلة القابلة للاسترداد', category: 'Asset', accountType: 'TaxReceivable', balance: 45000, currency: 'SAR', isActive: true, level: 1 },
  { id: 'acc-1050', tenantId: 'ten-001', companyId: 'comp-001', code: '1050', name: 'Fixed Assets - IT Equipment', nameAr: 'الأصول الثابتة - أجهزة وتقنية', category: 'Asset', accountType: 'Property', balance: 340000, currency: 'SAR', isActive: true, level: 1 },
  
  // Liabilities
  { id: 'acc-2010', tenantId: 'ten-001', companyId: 'comp-001', code: '2010', name: 'Accounts Payable (AP)', nameAr: 'الموردون وحسابات الدفع', category: 'Liability', accountType: 'Payable', balance: 410000, currency: 'SAR', isActive: true, level: 1 },
  { id: 'acc-2020', tenantId: 'ten-001', companyId: 'comp-001', code: '2020', name: 'Output VAT Payable (15%)', nameAr: 'ضريبة القيمة المضافة المستحقة (15%)', category: 'Liability', accountType: 'TaxPayable', balance: 87500, currency: 'SAR', isActive: true, level: 1 },
  
  // Equity
  { id: 'acc-3010', tenantId: 'ten-001', companyId: 'comp-001', code: '3010', name: 'Share Capital', nameAr: 'رأس المال المدفوع', category: 'Equity', accountType: 'Equity', balance: 2000000, currency: 'SAR', isActive: true, level: 1 },
  { id: 'acc-3020', tenantId: 'ten-001', companyId: 'comp-001', code: '3020', name: 'Retained Earnings', nameAr: 'الأرباح المبقاة', category: 'Equity', accountType: 'Equity', balance: 892500, currency: 'SAR', isActive: true, level: 1 },
  
  // Revenue
  { id: 'acc-4010', tenantId: 'ten-001', companyId: 'comp-001', code: '4010', name: 'Sales Revenue - Cloud SaaS', nameAr: 'إيرادات مبيعات الاشتراكات السحابية', category: 'Revenue', accountType: 'Revenue', balance: 1250000, currency: 'SAR', isActive: true, level: 1 },
  { id: 'acc-4020', tenantId: 'ten-001', companyId: 'comp-001', code: '4020', name: 'Professional Services & Consulting', nameAr: 'إيرادات الخدمات الاستشارية والتدريب', category: 'Revenue', accountType: 'Revenue', balance: 340000, currency: 'SAR', isActive: true, level: 1 },
  
  // Expenses
  { id: 'acc-5010', tenantId: 'ten-001', companyId: 'comp-001', code: '5010', name: 'Cost of Goods Sold (COGS)', nameAr: 'تكلفة البضاعة والخدمات المباعة', category: 'Expense', accountType: 'Expense', balance: 420000, currency: 'SAR', isActive: true, level: 1 },
  { id: 'acc-5020', tenantId: 'ten-001', companyId: 'comp-001', code: '5020', name: 'Salaries & Employee Benefits', nameAr: 'الرواتب والأجور ومستحقات الموظفين', category: 'Expense', accountType: 'Expense', balance: 380000, currency: 'SAR', isActive: true, level: 1 },
  { id: 'acc-5030', tenantId: 'ten-001', companyId: 'comp-001', code: '5030', name: 'Cloud Infrastructure & Server Hosting', nameAr: 'مصاريف الاستضافة والسحب الحوسبية', category: 'Expense', accountType: 'Expense', balance: 95000, currency: 'SAR', isActive: true, level: 1 }
];

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'je-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    entryNumber: 'JE-2026-0001',
    date: '2026-08-01',
    postingDate: '2026-08-01',
    reference: 'INV-2026-00104',
    description: 'Auto-posted from Sales Invoice INV-2026-00104 - Saudi Aramco Tech',
    status: 'Posted',
    lines: [
      { id: 'jl-1', accountCode: '1020', accountName: 'Accounts Receivable (AR)', description: 'Invoice Balance Due', debit: 287500, credit: 0 },
      { id: 'jl-2', accountCode: '4010', accountName: 'Sales Revenue - Cloud SaaS', description: 'SaaS License Revenue', debit: 0, credit: 250000 },
      { id: 'jl-3', accountCode: '2020', accountName: 'Output VAT Payable (15%)', description: 'KSA VAT 15%', debit: 0, credit: 37500 }
    ],
    totalDebit: 287500,
    totalCredit: 287500,
    originatingDocumentType: 'SalesInvoice',
    originatingDocumentId: 'inv-001',
    isAutoGenerated: true,
    createdBy: 'usr-001',
    createdByName: 'Ahmed Mounir',
    createdAt: '2026-08-01T10:15:00Z',
    approvedBy: 'usr-001',
    approvedAt: '2026-08-01T10:18:00Z',
    attachmentsCount: 2
  },
  {
    id: 'je-002',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    entryNumber: 'JE-2026-0002',
    date: '2026-08-05',
    postingDate: '2026-08-05',
    reference: 'PO-2026-0051',
    description: 'Auto-posted from Purchase Order PO-2026-0051 - Google Cloud Run & Spanner',
    status: 'Posted',
    lines: [
      { id: 'jl-4', accountCode: '5030', accountName: 'Cloud Infrastructure & Server Hosting', description: 'GCP August Invoice', debit: 45000, credit: 0 },
      { id: 'jl-5', accountCode: '1010', accountName: 'Cash on Hand & Bank', description: 'Corporate Card Payment', debit: 0, credit: 45000 }
    ],
    totalDebit: 45000,
    totalCredit: 45000,
    originatingDocumentType: 'PurchaseOrder',
    originatingDocumentId: 'po-001',
    isAutoGenerated: true,
    createdBy: 'usr-002',
    createdByName: 'Sari Mansour',
    createdAt: '2026-08-05T14:20:00Z',
    approvedBy: 'usr-001',
    approvedAt: '2026-08-05T14:25:00Z',
    attachmentsCount: 1
  },
  {
    id: 'je-003',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    entryNumber: 'JE-2026-0003',
    date: '2026-08-09',
    postingDate: '2026-08-09',
    reference: 'EXP-OFFICE-88',
    description: 'Manual Audit Adjustment: Security Audit & Penetration Testing Retainer',
    status: 'Pending Approval',
    lines: [
      { id: 'jl-6', accountCode: '5020', accountName: 'Salaries & Employee Benefits', description: 'External Security Auditor Retainer', debit: 65000, credit: 0 },
      { id: 'jl-7', accountCode: '2010', accountName: 'Accounts Payable (AP)', description: 'CyberGuard KSA Vendor', debit: 0, credit: 65000 }
    ],
    totalDebit: 65000,
    totalCredit: 65000,
    isAutoGenerated: false,
    createdBy: 'usr-002',
    createdByName: 'Sari Mansour',
    createdAt: '2026-08-09T16:00:00Z',
    attachmentsCount: 1
  }
];

export const INITIAL_NUMBERING_RULES: DocumentNumberingRule[] = [
  { id: 'dn-1', tenantId: 'ten-001', entityType: 'JE', prefix: 'JE-2026-', nextNumber: 4, zeroPad: 4, yearPrefix: true, lastGeneratedFormat: 'JE-2026-0003' },
  { id: 'dn-2', tenantId: 'ten-001', entityType: 'INV', prefix: 'INV-2026-', nextNumber: 105, zeroPad: 5, yearPrefix: true, lastGeneratedFormat: 'INV-2026-00104' },
  { id: 'dn-3', tenantId: 'ten-001', entityType: 'PO', prefix: 'PO-2026-', nextNumber: 52, zeroPad: 4, yearPrefix: true, lastGeneratedFormat: 'PO-2026-0051' },
  { id: 'dn-4', tenantId: 'ten-001', entityType: 'PI', prefix: 'PI-2026-', nextNumber: 12, zeroPad: 4, yearPrefix: true, lastGeneratedFormat: 'PI-2026-0011' },
  { id: 'dn-5', tenantId: 'ten-001', entityType: 'SO', prefix: 'SO-2026-', nextNumber: 88, zeroPad: 4, yearPrefix: true, lastGeneratedFormat: 'SO-2026-0087' },
  { id: 'dn-6', tenantId: 'ten-001', entityType: 'GRN', prefix: 'GRN-2026-', nextNumber: 31, zeroPad: 4, yearPrefix: true, lastGeneratedFormat: 'GRN-2026-0030' },
  { id: 'dn-7', tenantId: 'ten-001', entityType: 'SM', prefix: 'SM-2026-', nextNumber: 15, zeroPad: 4, yearPrefix: true, lastGeneratedFormat: 'SM-2026-0014' },
  { id: 'dn-8', tenantId: 'ten-001', entityType: 'CP', prefix: 'CP-2026-', nextNumber: 20, zeroPad: 4, yearPrefix: true, lastGeneratedFormat: 'CP-2026-0019' },
  { id: 'dn-9', tenantId: 'ten-001', entityType: 'SP', prefix: 'SP-2026-', nextNumber: 18, zeroPad: 4, yearPrefix: true, lastGeneratedFormat: 'SP-2026-0017' }
];

export const INITIAL_WORKFLOW_RULES: WorkflowRule[] = [
  {
    id: 'wf-1',
    tenantId: 'ten-001',
    name: 'High Value Journal Entry Approval (>50,000 SAR)',
    entityType: 'JournalEntry',
    thresholdAmount: 50000,
    requiredRole: 'Super Admin',
    isActive: true,
    stepName: 'Executive Finance Committee Approval'
  },
  {
    id: 'wf-2',
    tenantId: 'ten-001',
    name: 'Purchase Order Approval (>20,000 SAR)',
    entityType: 'PurchaseOrder',
    thresholdAmount: 20000,
    requiredRole: 'Finance Manager',
    isActive: true,
    stepName: 'Finance Verification'
  },
  {
    id: 'wf-3',
    tenantId: 'ten-001',
    name: 'Sales Invoice Approval (>100,000 SAR)',
    entityType: 'SalesInvoice',
    thresholdAmount: 100000,
    requiredRole: 'Finance Manager',
    isActive: true,
    stepName: 'Commercial Risk Approval'
  }
];

export const INITIAL_APPROVAL_REQUESTS: ApprovalRequest[] = [
  {
    id: 'app-001',
    tenantId: 'ten-001',
    workflowRuleId: 'wf-1',
    entityType: 'JournalEntry',
    entityId: 'je-003',
    entityNumber: 'JE-2026-0003',
    requestedBy: 'usr-002',
    requestedByName: 'Sari Mansour',
    requestedAt: '2026-08-09T16:00:00Z',
    amount: 65000,
    description: 'Special Security Audit & Penetration Testing Retainer',
    status: 'Pending',
    currentApproverRole: 'Super Admin'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-001',
    tenantId: 'ten-001',
    timestamp: '2026-08-01T10:15:00Z',
    userId: 'usr-001',
    userName: 'Ahmed Mounir',
    userRole: 'Super Admin',
    action: 'POST',
    entityType: 'SalesInvoice',
    entityId: 'inv-001',
    entityNumber: 'INV-2026-00104',
    ipAddress: '197.38.12.89',
    details: 'Auto-posted Sales Invoice INV-2026-00104 via Financial Events Engine. Generated JE-2026-0001 (287,500 SAR)'
  },
  {
    id: 'aud-002',
    tenantId: 'ten-001',
    timestamp: '2026-08-05T14:20:00Z',
    userId: 'usr-002',
    userName: 'Sari Mansour',
    userRole: 'Finance Manager',
    action: 'POST',
    entityType: 'PurchaseOrder',
    entityId: 'po-001',
    entityNumber: 'PO-2026-0051',
    ipAddress: '212.118.140.2',
    details: 'Posted Purchase Order PO-2026-0051. Auto-generated Journal Entry JE-2026-0002 (45,000 SAR)'
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'item-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    sku: 'HW-SRV-01',
    barcode: '628100293012',
    name: 'Enterprise Edge Server Blade Gen11',
    nameAr: 'خادم حوسبة طرفية نصلية - الجيل الحادي عشر',
    categoryId: 'cat-01',
    categoryName: 'Hardware & Infrastructure',
    uom: 'PCS',
    costPrice: 18500,
    sellingPrice: 26000,
    stockQty: 42,
    reorderPoint: 10,
    warehouseId: 'wh-001',
    valuationMethod: 'FIFO',
    itemType: 'Stock Item',
    active: true
  },
  {
    id: 'item-002',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    sku: 'SW-ERP-USR',
    barcode: '628100293043',
    name: 'AM ERP Enterprise Perpetual License',
    nameAr: 'ترخيص نظام إيه إم لإدارة الموارد - دائم',
    categoryId: 'cat-02',
    categoryName: 'Software Licenses',
    uom: 'LIC',
    costPrice: 4500,
    sellingPrice: 12000,
    stockQty: 150,
    reorderPoint: 20,
    warehouseId: 'wh-001',
    valuationMethod: 'Weighted Average',
    itemType: 'Service',
    active: true
  },
  {
    id: 'item-003',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    sku: 'NET-RTR-10G',
    barcode: '628100293099',
    name: '10Gbps High-Speed Optical Fiber Router',
    nameAr: 'موجه ألياف بصرية عالي السرعة 10 جيجابت',
    categoryId: 'cat-01',
    categoryName: 'Hardware & Infrastructure',
    uom: 'PCS',
    costPrice: 3200,
    sellingPrice: 4800,
    stockQty: 8,
    reorderPoint: 12,
    warehouseId: 'wh-001',
    valuationMethod: 'FIFO',
    itemType: 'Stock Item',
    active: true
  }
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'sm-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    movementNumber: 'GRN-2026-0030',
    date: '2026-08-02',
    itemSku: 'HW-SRV-01',
    itemName: 'Enterprise Edge Server Blade Gen11',
    warehouseId: 'wh-001',
    warehouseName: 'Central Warehouse - Riyadh',
    movementType: 'Receipt',
    quantity: 20,
    unitCost: 18500,
    totalCost: 370000,
    reference: 'PO-2026-0045',
    status: 'Posted',
    performedBy: 'Sari Mansour',
    createdAt: '2026-08-02T11:00:00Z'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'CUST-001',
    name: 'Saudi Aramco Technology Ventures',
    nameAr: 'شركة أرامكو السعودية للاستثمار التقني',
    taxNumber: '300029103900003',
    email: 'procurement@aramcotech.sa',
    phone: '+966 11 482 9900',
    creditLimit: 1000000,
    balance: 287500,
    receivableAccountCode: '1020'
  },
  {
    id: 'cust-002',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'CUST-002',
    name: 'Riyadh Bank Digital Innovation',
    nameAr: 'بنك الرياض - قطاع الابتكار الرقمي',
    taxNumber: '300088192000003',
    email: 'digital@riyadhbank.com',
    phone: '+966 11 210 1111',
    creditLimit: 500000,
    balance: 145000,
    receivableAccountCode: '1020'
  }
];

export const INITIAL_SALES_INVOICES: SalesInvoice[] = [
  {
    id: 'inv-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    invoiceNumber: 'INV-2026-00104',
    customerId: 'cust-001',
    customerName: 'Saudi Aramco Technology Ventures',
    date: '2026-08-01',
    dueDate: '2026-08-31',
    status: 'Posted',
    paymentStatus: 'Unpaid',
    lines: [
      { itemSku: 'SW-ERP-USR', itemName: 'AM ERP Enterprise License (20 Seats)', quantity: 20, unitPrice: 12500, discount: 0, taxRate: 0.15, taxAmount: 37500, total: 287500 }
    ],
    subtotal: 250000,
    taxTotal: 37500,
    grandTotal: 287500,
    journalEntryId: 'je-001',
    createdBy: 'usr-001',
    createdAt: '2026-08-01T10:00:00Z'
  }
];

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'vend-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'VEND-001',
    name: 'Google Cloud Platform KSA',
    nameAr: 'جوجل كلاود المملكة العربية السعودية',
    taxNumber: '310192830100003',
    email: 'billing-ksa@cloud.google.com',
    phone: '+966 11 800 1234',
    balance: 45000,
    payableAccountCode: '2010'
  },
  {
    id: 'vend-002',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'VEND-002',
    name: 'CyberGuard Solutions Middle East',
    nameAr: 'حلول سايبرجارد الشرق الأوسط',
    taxNumber: '310992810200003',
    email: 'info@cyberguard.me',
    phone: '+966 11 992 0011',
    balance: 65000,
    payableAccountCode: '2010'
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    poNumber: 'PO-2026-0051',
    vendorId: 'vend-001',
    vendorName: 'Google Cloud Platform KSA',
    date: '2026-08-01',
    expectedDate: '2026-08-05',
    status: 'Approved',
    totalAmount: 45000,
    createdBy: 'usr-002',
    createdAt: '2026-08-01T14:00:00Z'
  }
];

export const INITIAL_PURCHASE_INVOICES: PurchaseInvoice[] = [
  {
    id: 'pi-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    invoiceNumber: 'PI-2026-0011',
    vendorId: 'vend-001',
    vendorName: 'Google Cloud Platform KSA',
    purchaseOrderId: 'po-001',
    date: '2026-08-05',
    dueDate: '2026-09-05',
    status: 'Posted',
    paymentStatus: 'Unpaid',
    subtotal: 45000,
    taxTotal: 0,
    grandTotal: 45000,
    journalEntryId: 'je-002',
    createdBy: 'usr-002',
    createdAt: '2026-08-05T14:20:00Z'
  }
];

export const INITIAL_CUSTOMER_PAYMENTS: CustomerPayment[] = [];
export const INITIAL_SUPPLIER_PAYMENTS: SupplierPayment[] = [];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-001',
    tenantId: 'ten-001',
    companyName: 'NEOM Smart Infrastructure Authority',
    contactName: 'Eng. Khalid Al-Faisal',
    email: 'khalid@neom.gov.sa',
    phone: '+966 50 112 3344',
    value: 750000,
    stage: 'Proposal',
    assignedTo: 'Ahmed Mounir',
    createdAt: '2026-08-03T11:00:00Z'
  },
  {
    id: 'lead-002',
    tenantId: 'ten-001',
    companyName: 'Bテック AI Capital UAE',
    contactName: 'Sarah Al-Mansoori',
    email: 'sarah@btech-ai.ae',
    phone: '+971 50 882 1199',
    value: 420000,
    stage: 'Negotiation',
    assignedTo: 'Sari Mansour',
    createdAt: '2026-08-06T09:15:00Z'
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    tenantId: 'ten-001',
    employeeCode: 'EMP-1001',
    name: 'Ahmed Mounir',
    nameAr: 'أحمد منير',
    department: 'Executive Board',
    jobTitle: 'Chief Software Architect',
    basicSalary: 35000,
    housingAllowance: 10000,
    transportAllowance: 3000,
    joiningDate: '2025-01-01',
    status: 'Active'
  },
  {
    id: 'emp-002',
    tenantId: 'ten-001',
    employeeCode: 'EMP-1002',
    name: 'Sari Mansour',
    nameAr: 'ساري منصور',
    department: 'Finance & Accounting',
    jobTitle: 'Senior Finance Director',
    basicSalary: 24000,
    housingAllowance: 7000,
    transportAllowance: 2000,
    joiningDate: '2025-03-15',
    status: 'Active'
  }
];

export const INITIAL_DOCUMENT_RELATIONSHIPS = [
  {
    id: 'rel-001',
    tenantId: 'ten-001',
    sourceDocType: 'SalesOrder',
    sourceDocId: 'so-001',
    sourceDocNumber: 'SO-2026-0087',
    targetDocType: 'SalesInvoice',
    targetDocId: 'inv-001',
    targetDocNumber: 'INV-2026-00104',
    relationshipType: 'SO_TO_INV',
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'rel-002',
    tenantId: 'ten-001',
    sourceDocType: 'PurchaseOrder',
    sourceDocId: 'po-001',
    sourceDocNumber: 'PO-2026-0051',
    targetDocType: 'PurchaseInvoice',
    targetDocId: 'pi-001',
    targetDocNumber: 'PI-2026-0011',
    relationshipType: 'PO_TO_PI',
    createdAt: '2026-08-05T14:20:00Z'
  }
];

export const INITIAL_BRANDS = [
  { id: 'brd-001', tenantId: 'ten-001', code: 'BRD-DELL', name: 'Dell Technologies', nameAr: 'ديل للتكنولوجيا', active: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'brd-002', tenantId: 'ten-001', code: 'BRD-CSCO', name: 'Cisco Systems', nameAr: 'سيسكو سيستمز', active: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'brd-003', tenantId: 'ten-001', code: 'BRD-AM', name: 'AM Tech Hardware', nameAr: 'إيه إم للأجهزة المتقدمة', active: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'brd-004', tenantId: 'ten-001', code: 'BRD-APL', name: 'Apple Inc.', nameAr: 'آبل', active: true, createdAt: '2026-01-01T00:00:00Z' }
];

export const INITIAL_MODELS = [
  { id: 'mdl-001', tenantId: 'ten-001', brandId: 'brd-001', brandName: 'Dell Technologies', code: 'MDL-R750', name: 'PowerEdge R750 Blade', nameAr: 'خادم باور إيدج R750', active: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'mdl-002', tenantId: 'ten-001', brandId: 'brd-002', brandName: 'Cisco Systems', code: 'MDL-C9300', name: 'Catalyst 9300 Switch', nameAr: 'مبدل كيتاليست 9300', active: true, createdAt: '2026-01-01T00:00:00Z' }
];

export const INITIAL_ITEM_GROUPS = [
  { id: 'grp-001', tenantId: 'ten-001', categoryId: 'cat-01', categoryName: 'Hardware & Infrastructure', code: 'GRP-SRV', name: 'Compute Servers & Blades', nameAr: 'خوادم الحوسبة', active: true },
  { id: 'grp-002', tenantId: 'ten-001', categoryId: 'cat-01', categoryName: 'Hardware & Infrastructure', code: 'GRP-NET', name: 'Enterprise Networking & Fiber', nameAr: 'معدات شبكات وألياف بصرية', active: true },
  { id: 'grp-003', tenantId: 'ten-001', categoryId: 'cat-02', categoryName: 'Software Licenses', code: 'GRP-SFT', name: 'ERP & Cloud Subscriptions', nameAr: 'برمجيات واشتراكات سحابية', active: true }
];

export const INITIAL_UOM_CONVERSIONS = [
  { id: 'uomc-01', tenantId: 'ten-001', fromUom: 'BOX', toUom: 'PCS', conversionRatio: 10, active: true },
  { id: 'uomc-02', tenantId: 'ten-001', fromUom: 'PALLET', toUom: 'BOX', conversionRatio: 20, active: true },
  { id: 'uomc-03', tenantId: 'ten-001', fromUom: 'CARTON', toUom: 'PCS', conversionRatio: 24, active: true }
];

export const INITIAL_PACKAGING_UNITS = [
  { id: 'pkg-01', tenantId: 'ten-001', code: 'BOX-10', name: 'Standard Box (10 Pcs)', nameAr: 'صندوق قياسي (10 حبات)', baseUom: 'PCS', capacity: 10, active: true },
  { id: 'pkg-02', tenantId: 'ten-001', code: 'PALLET-EUR', name: 'Euro Pallet (500 Pcs)', nameAr: 'منصة أوروبية (500 حبة)', baseUom: 'PCS', capacity: 500, active: true }
];

export const INITIAL_WAREHOUSE_ZONES = [
  { id: 'zone-01', tenantId: 'ten-001', warehouseId: 'wh-001', code: 'Z-REC', name: 'Receiving Inspection Zone', nameAr: 'منطقة الفحص والاستلام', zoneType: 'Receiving', active: true },
  { id: 'zone-02', tenantId: 'ten-001', warehouseId: 'wh-001', code: 'Z-BLK-A', name: 'Bulk High Bay Rack A', nameAr: 'منطقة التخزين الضخم - رف أ', zoneType: 'Bulk', active: true },
  { id: 'zone-03', tenantId: 'ten-001', warehouseId: 'wh-001', code: 'Z-PCK-B', name: 'Fast Picking Zone B', nameAr: 'منطقة السحب السريع - رف ب', zoneType: 'Picking', active: true },
  { id: 'zone-04', tenantId: 'ten-001', warehouseId: 'wh-001', code: 'Z-QRN', name: 'Quarantine & Hold Zone', nameAr: 'منطقة الحجر الصحي والتحفظ', zoneType: 'Quarantine', active: true },
  { id: 'zone-05', tenantId: 'ten-001', warehouseId: 'wh-001', code: 'Z-SHP', name: 'Outbound Shipping Staging', nameAr: 'منطقة التجهيز للشحن الخارجي', zoneType: 'Shipping', active: true },
  { id: 'zone-06', tenantId: 'ten-001', warehouseId: 'wh-002', code: 'Z-JED-MAIN', name: 'Jeddah Main Storage Zone', nameAr: 'منطقة تخزين جدة الرئيسية', zoneType: 'Bulk', active: true }
];

export const INITIAL_BIN_LOCATIONS = [
  { id: 'bin-01', tenantId: 'ten-001', warehouseId: 'wh-001', zoneId: 'zone-01', code: 'BIN-REC-01', name: 'Receiving Dock Bin 1', nameAr: 'حاوية رصيف الاستلام 1', aisle: 'A1', rack: 'R01', shelf: 'S01', bin: 'B01', barcode: '628900010011', isDefaultReceiving: true, isDefaultShipping: false, maxWeightCapacity: 5000, active: true },
  { id: 'bin-02', tenantId: 'ten-001', warehouseId: 'wh-001', zoneId: 'zone-02', code: 'BIN-BLK-A1', name: 'Bulk Rack A - Shelf 2', nameAr: 'التخزين الضخم أ - رف 2', aisle: 'A1', rack: 'R04', shelf: 'S02', bin: 'B12', barcode: '628900010022', isDefaultReceiving: false, isDefaultShipping: false, maxWeightCapacity: 2000, active: true },
  { id: 'bin-03', tenantId: 'ten-001', warehouseId: 'wh-001', zoneId: 'zone-03', code: 'BIN-PCK-B1', name: 'Picking Bin B1', nameAr: 'حاوية الانتقاء ب1', aisle: 'B1', rack: 'R01', shelf: 'S01', bin: 'B01', barcode: '628900010033', isDefaultReceiving: false, isDefaultShipping: false, maxWeightCapacity: 500, active: true },
  { id: 'bin-04', tenantId: 'ten-001', warehouseId: 'wh-001', zoneId: 'zone-04', code: 'BIN-QRN-01', name: 'Quarantine Bin Q1', nameAr: 'حاوية الحجر Q1', aisle: 'Q1', rack: 'R01', shelf: 'S01', bin: 'B01', barcode: '628900010044', isDefaultReceiving: false, isDefaultShipping: false, maxWeightCapacity: 1000, active: true },
  { id: 'bin-05', tenantId: 'ten-001', warehouseId: 'wh-001', zoneId: 'zone-05', code: 'BIN-SHP-01', name: 'Shipping Stage Bin 1', nameAr: 'منصة الشحن ب1', aisle: 'S1', rack: 'R01', shelf: 'S01', bin: 'B01', barcode: '628900010055', isDefaultReceiving: false, isDefaultShipping: true, maxWeightCapacity: 3000, active: true },
  { id: 'bin-06', tenantId: 'ten-001', warehouseId: 'wh-002', zoneId: 'zone-06', code: 'BIN-JED-01', name: 'Jeddah Main Rack 1', nameAr: 'رف جدة الرئيسي 1', aisle: 'J1', rack: 'R01', shelf: 'S01', bin: 'B01', barcode: '628900020011', isDefaultReceiving: true, isDefaultShipping: true, maxWeightCapacity: 4000, active: true }
];

export const INITIAL_BATCH_LOTS = [
  { id: 'batch-01', tenantId: 'ten-001', itemSku: 'HW-SRV-01', itemName: 'Enterprise Edge Server Blade Gen11', batchNumber: 'BATCH-2026-08A', mfgDate: '2026-01-15', expiryDate: '2029-01-15', shelfLifeDays: 1095, supplierBatchRef: 'DELL-LOT-998', initialQty: 30, currentQty: 25, status: 'Active', notes: 'Certified High Performance Batch' },
  { id: 'batch-02', tenantId: 'ten-001', itemSku: 'HW-SRV-01', itemName: 'Enterprise Edge Server Blade Gen11', batchNumber: 'BATCH-2026-09B', mfgDate: '2026-03-01', expiryDate: '2029-03-01', shelfLifeDays: 1095, supplierBatchRef: 'DELL-LOT-999', initialQty: 20, currentQty: 17, status: 'Active', notes: 'Secondary Shipment Batch' },
  { id: 'batch-03', tenantId: 'ten-001', itemSku: 'NET-RTR-10G', itemName: '10Gbps High-Speed Optical Fiber Router', batchNumber: 'BATCH-CSCO-22', mfgDate: '2025-08-10', expiryDate: '2026-08-20', shelfLifeDays: 375, supplierBatchRef: 'CSCO-Q4-01', initialQty: 10, currentQty: 8, status: 'Active', notes: 'Expiring Soon Batch Notice' }
];

export const INITIAL_SERIAL_NUMBERS = [
  { id: 'sn-01', tenantId: 'ten-001', itemSku: 'HW-SRV-01', itemName: 'Enterprise Edge Server Blade Gen11', serialNumber: 'SRV-DELL-99001', batchNumber: 'BATCH-2026-08A', warehouseId: 'wh-001', binId: 'bin-02', status: 'Available', warrantyExpiryDate: '2029-01-15', createdAt: '2026-01-20T10:00:00Z' },
  { id: 'sn-02', tenantId: 'ten-001', itemSku: 'HW-SRV-01', itemName: 'Enterprise Edge Server Blade Gen11', serialNumber: 'SRV-DELL-99002', batchNumber: 'BATCH-2026-08A', warehouseId: 'wh-001', binId: 'bin-02', status: 'Available', warrantyExpiryDate: '2029-01-15', createdAt: '2026-01-20T10:00:00Z' },
  { id: 'sn-03', tenantId: 'ten-001', itemSku: 'HW-SRV-01', itemName: 'Enterprise Edge Server Blade Gen11', serialNumber: 'SRV-DELL-99003', batchNumber: 'BATCH-2026-08A', warehouseId: 'wh-001', binId: 'bin-04', status: 'Damaged', warrantyExpiryDate: '2029-01-15', createdAt: '2026-01-20T10:00:00Z' },
  { id: 'sn-04', tenantId: 'ten-001', itemSku: 'NET-RTR-10G', itemName: '10Gbps High-Speed Optical Fiber Router', serialNumber: 'RTR-CSCO-88101', batchNumber: 'BATCH-CSCO-22', warehouseId: 'wh-001', binId: 'bin-03', status: 'Available', warrantyExpiryDate: '2026-08-20', createdAt: '2025-08-15T12:00:00Z' }
];

export const INITIAL_STOCK_QUANTS = [
  {
    id: 'quant-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    itemSku: 'HW-SRV-01',
    itemName: 'Enterprise Edge Server Blade Gen11',
    categoryId: 'cat-01',
    categoryName: 'Hardware & Infrastructure',
    warehouseId: 'wh-001',
    warehouseName: 'Central Warehouse - Riyadh',
    zoneId: 'zone-02',
    zoneName: 'Bulk High Bay Rack A',
    binId: 'bin-02',
    binCode: 'BIN-BLK-A1',
    batchNumber: 'BATCH-2026-08A',
    qtyOnHand: 25,
    qtyAvailable: 20,
    qtyReserved: 5,
    qtyInTransit: 0,
    qtyDamaged: 0,
    qtyReturned: 0,
    unitCost: 18500,
    totalValue: 462500,
    uom: 'PCS',
    status: 'Available',
    lastCountDate: '2026-08-01',
    updatedAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'quant-002',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    itemSku: 'HW-SRV-01',
    itemName: 'Enterprise Edge Server Blade Gen11',
    categoryId: 'cat-01',
    categoryName: 'Hardware & Infrastructure',
    warehouseId: 'wh-001',
    warehouseName: 'Central Warehouse - Riyadh',
    zoneId: 'zone-04',
    zoneName: 'Quarantine & Hold Zone',
    binId: 'bin-04',
    binCode: 'BIN-QRN-01',
    batchNumber: 'BATCH-2026-08A',
    serialNumber: 'SRV-DELL-99003',
    qtyOnHand: 2,
    qtyAvailable: 0,
    qtyReserved: 0,
    qtyInTransit: 0,
    qtyDamaged: 2,
    qtyReturned: 0,
    unitCost: 18500,
    totalValue: 37000,
    uom: 'PCS',
    status: 'Damaged',
    lastCountDate: '2026-08-05',
    updatedAt: '2026-08-05T14:00:00Z'
  },
  {
    id: 'quant-003',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    itemSku: 'HW-SRV-01',
    itemName: 'Enterprise Edge Server Blade Gen11',
    categoryId: 'cat-01',
    categoryName: 'Hardware & Infrastructure',
    warehouseId: 'wh-002',
    warehouseName: 'Jeddah Regional Logistics Hub',
    zoneId: 'zone-06',
    zoneName: 'Jeddah Main Storage Zone',
    binId: 'bin-06',
    binCode: 'BIN-JED-01',
    batchNumber: 'BATCH-2026-09B',
    qtyOnHand: 15,
    qtyAvailable: 15,
    qtyReserved: 0,
    qtyInTransit: 0,
    qtyDamaged: 0,
    qtyReturned: 0,
    unitCost: 18500,
    totalValue: 277500,
    uom: 'PCS',
    status: 'Available',
    lastCountDate: '2026-08-03',
    updatedAt: '2026-08-03T11:00:00Z'
  },
  {
    id: 'quant-004',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    itemSku: 'SW-ERP-USR',
    itemName: 'AM ERP Enterprise Perpetual License',
    categoryId: 'cat-02',
    categoryName: 'Software Licenses',
    warehouseId: 'wh-001',
    warehouseName: 'Central Warehouse - Riyadh',
    binCode: 'DIGITAL-VAULT',
    qtyOnHand: 150,
    qtyAvailable: 140,
    qtyReserved: 10,
    qtyInTransit: 0,
    qtyDamaged: 0,
    qtyReturned: 0,
    unitCost: 4500,
    totalValue: 675000,
    uom: 'LIC',
    status: 'Available',
    lastCountDate: '2026-08-01',
    updatedAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'quant-005',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    itemSku: 'NET-RTR-10G',
    itemName: '10Gbps High-Speed Optical Fiber Router',
    categoryId: 'cat-01',
    categoryName: 'Hardware & Infrastructure',
    warehouseId: 'wh-001',
    warehouseName: 'Central Warehouse - Riyadh',
    zoneId: 'zone-03',
    zoneName: 'Fast Picking Zone B',
    binId: 'bin-03',
    binCode: 'BIN-PCK-B1',
    batchNumber: 'BATCH-CSCO-22',
    serialNumber: 'RTR-CSCO-88101',
    qtyOnHand: 8,
    qtyAvailable: 8,
    qtyReserved: 0,
    qtyInTransit: 0,
    qtyDamaged: 0,
    qtyReturned: 0,
    unitCost: 3200,
    totalValue: 25600,
    uom: 'PCS',
    status: 'Available',
    lastCountDate: '2026-08-04',
    updatedAt: '2026-08-04T09:00:00Z'
  }
];

export const INITIAL_INVENTORY_CONFIG = {
  negativeStockPolicy: 'Block' as const,
  serialTrackingMode: 'Mandatory' as const,
  batchTrackingMode: 'Mandatory' as const,
  expiryTrackingMode: 'Optional' as const,
  barcodeRulePattern: '628{SKU}{RAND}',
  skuRulePattern: '{CAT}-{BRD}-{SEQ}',
  defaultCostMethod: 'FIFO' as const,
  defaultWarehouseId: 'wh-001',
  defaultUomCode: 'PCS',
  autoGenerateSku: true,
  autoGenerateBarcode: true
};

export const INITIAL_ASSETS: any[] = [
  { id: 'ast-001', tenantId: 'ten-001', companyId: 'comp-001', code: 'AST-BLD-01', name: 'Riyadh HQ Building', category: 'Real Estate', purchaseValue: 15000000, currentValue: 14200000 }
];

export const INITIAL_BANKS: any[] = [
  { id: 'bnk-001', tenantId: 'ten-001', companyId: 'comp-001', name: 'Al Rajhi Bank', code: 'RJHI', iban: 'SA0380000000123456789012' },
  { id: 'bnk-002', tenantId: 'ten-001', companyId: 'comp-001', name: 'Saudi National Bank (SNB)', code: 'SNBC', iban: 'SA4410000000987654321098' }
];

export const INITIAL_CITIES: any[] = [
  { id: 'cty-01', name: 'Riyadh', countryCode: 'SA' },
  { id: 'cty-02', name: 'Jeddah', countryCode: 'SA' },
  { id: 'cty-03', name: 'Dammam', countryCode: 'SA' },
  { id: 'cty-04', name: 'Dubai', countryCode: 'AE' }
];

export const INITIAL_COLORS: any[] = [
  { id: 'clr-01', code: 'BLK', name: 'Midnight Black' },
  { id: 'clr-02', code: 'SLV', name: 'Silver Metallic' },
  { id: 'clr-03', code: 'WHT', name: 'Pure White' }
];

export const INITIAL_COUNTRIES: any[] = [
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية' },
  { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة' }
];

export const INITIAL_PAYMENT_METHODS: any[] = [
  { id: 'pm-01', code: 'BANK', name: 'Bank Wire Transfer' },
  { id: 'pm-02', code: 'SADAD', name: 'SADAD Payment Gateway' },
  { id: 'pm-03', code: 'CASH', name: 'Cash on Delivery / Petty Cash' }
];

export const INITIAL_REGIONS: any[] = [
  { id: 'reg-01', code: 'CENTRAL', name: 'Central Region (Riyadh)' },
  { id: 'reg-02', code: 'WESTERN', name: 'Western Region (Makkah / Jeddah)' }
];

export const INITIAL_SIZES: any[] = [
  { id: 'sz-01', code: 'STD', name: 'Standard Size' },
  { id: 'sz-02', code: '1U', name: '1U Rack Unit' },
  { id: 'sz-03', code: '2U', name: '2U Rack Unit' }
];

export const INITIAL_COUNTRIES_MASTER: CountryMaster[] = [
  {
    id: 'cnt-eg',
    code: 'EG',
    code3: 'EGY',
    name: 'Egypt',
    nameAr: 'جمهورية مصر العربية',
    flag: '🇪🇬',
    defaultCurrency: 'EGP',
    defaultTimezone: 'Africa/Cairo',
    defaultLanguage: 'ar',
    defaultDateFormat: 'DD/MM/YYYY',
    defaultNumberFormat: '1,234.56',
    defaultTaxSystemId: 'tax-sys-eg-vat',
    fiscalYearStartMonth: 7
  },
  {
    id: 'cnt-sa',
    code: 'SA',
    code3: 'SAU',
    name: 'Saudi Arabia',
    nameAr: 'المملكة العربية السعودية',
    flag: '🇸🇦',
    defaultCurrency: 'SAR',
    defaultTimezone: 'Asia/Riyadh',
    defaultLanguage: 'ar',
    defaultDateFormat: 'YYYY-MM-DD',
    defaultNumberFormat: '1,234.56',
    defaultTaxSystemId: 'tax-sys-sa-vat',
    fiscalYearStartMonth: 1
  },
  {
    id: 'cnt-ae',
    code: 'AE',
    code3: 'ARE',
    name: 'United Arab Emirates',
    nameAr: 'الإمارات العربية المتحدة',
    flag: '🇦🇪',
    defaultCurrency: 'AED',
    defaultTimezone: 'Asia/Dubai',
    defaultLanguage: 'ar',
    defaultDateFormat: 'DD/MM/YYYY',
    defaultNumberFormat: '1,234.56',
    defaultTaxSystemId: 'tax-sys-uae-vat',
    fiscalYearStartMonth: 1
  },
  {
    id: 'cnt-us',
    code: 'US',
    code3: 'USA',
    name: 'United States',
    nameAr: 'الولايات المتحدة الأمريكية',
    flag: '🇺🇸',
    defaultCurrency: 'USD',
    defaultTimezone: 'America/New_York',
    defaultLanguage: 'en',
    defaultDateFormat: 'MM/DD/YYYY',
    defaultNumberFormat: '1,234.56',
    defaultTaxSystemId: 'tax-sys-us-sales',
    fiscalYearStartMonth: 1
  },
  {
    id: 'cnt-gb',
    code: 'GB',
    code3: 'GBR',
    name: 'United Kingdom',
    nameAr: 'المملكة المتحدة',
    flag: '🇬🇧',
    defaultCurrency: 'GBP',
    defaultTimezone: 'Europe/London',
    defaultLanguage: 'en',
    defaultDateFormat: 'DD/MM/YYYY',
    defaultNumberFormat: '1,234.56',
    defaultTaxSystemId: 'tax-sys-uk-vat',
    fiscalYearStartMonth: 4
  },
  {
    id: 'cnt-de',
    code: 'DE',
    code3: 'DEU',
    name: 'Germany',
    nameAr: 'ألمانيا',
    flag: '🇩🇪',
    defaultCurrency: 'EUR',
    defaultTimezone: 'Europe/Berlin',
    defaultLanguage: 'de',
    defaultDateFormat: 'DD.MM.YYYY',
    defaultNumberFormat: '1.234,56',
    defaultTaxSystemId: 'tax-sys-eu-vat',
    fiscalYearStartMonth: 1
  },
  {
    id: 'cnt-fr',
    code: 'FR',
    code3: 'FRA',
    name: 'France',
    nameAr: 'فرنسا',
    flag: '🇫🇷',
    defaultCurrency: 'EUR',
    defaultTimezone: 'Europe/Paris',
    defaultLanguage: 'fr',
    defaultDateFormat: 'DD/MM/YYYY',
    defaultNumberFormat: '1 234,56',
    defaultTaxSystemId: 'tax-sys-eu-vat',
    fiscalYearStartMonth: 1
  },
  {
    id: 'cnt-kw',
    code: 'KW',
    code3: 'KWT',
    name: 'Kuwait',
    nameAr: 'دولة الكويت',
    flag: '🇰🇼',
    defaultCurrency: 'KWD',
    defaultTimezone: 'Asia/Kuwait',
    defaultLanguage: 'ar',
    defaultDateFormat: 'YYYY-MM-DD',
    defaultNumberFormat: '1,234.56',
    defaultTaxSystemId: 'tax-sys-kw-corp',
    fiscalYearStartMonth: 4
  },
  {
    id: 'cnt-qa',
    code: 'QA',
    code3: 'QAT',
    name: 'Qatar',
    nameAr: 'دولة قطر',
    flag: '🇶🇦',
    defaultCurrency: 'QAR',
    defaultTimezone: 'Asia/Qatar',
    defaultLanguage: 'ar',
    defaultDateFormat: 'YYYY-MM-DD',
    defaultNumberFormat: '1,234.56',
    defaultTaxSystemId: 'tax-sys-qa-vat',
    fiscalYearStartMonth: 1
  },
  {
    id: 'cnt-om',
    code: 'OM',
    code3: 'OMN',
    name: 'Oman',
    nameAr: 'سلطنة عمان',
    flag: '🇴🇲',
    defaultCurrency: 'OMR',
    defaultTimezone: 'Asia/Muscat',
    defaultLanguage: 'ar',
    defaultDateFormat: 'DD/MM/YYYY',
    defaultNumberFormat: '1,234.56',
    defaultTaxSystemId: 'tax-sys-om-vat',
    fiscalYearStartMonth: 1
  },
  {
    id: 'cnt-bh',
    code: 'BH',
    code3: 'BHR',
    name: 'Bahrain',
    nameAr: 'مملكة البحرين',
    flag: '🇧🇭',
    defaultCurrency: 'BHD',
    defaultTimezone: 'Asia/Bahrain',
    defaultLanguage: 'ar',
    defaultDateFormat: 'DD/MM/YYYY',
    defaultNumberFormat: '1,234.56',
    defaultTaxSystemId: 'tax-sys-bh-vat',
    fiscalYearStartMonth: 1
  },
  {
    id: 'cnt-jo',
    code: 'JO',
    code3: 'JOR',
    name: 'Jordan',
    nameAr: 'المملكة الأردنية الهاشمية',
    flag: '🇯🇴',
    defaultCurrency: 'JOD',
    defaultTimezone: 'Asia/Amman',
    defaultLanguage: 'ar',
    defaultDateFormat: 'DD/MM/YYYY',
    defaultNumberFormat: '1,234.56',
    defaultTaxSystemId: 'tax-sys-jo-vat',
    fiscalYearStartMonth: 1
  },
  {
    id: 'cnt-ma',
    code: 'MA',
    code3: 'MAR',
    name: 'Morocco',
    nameAr: 'المملكة المغربية',
    flag: '🇲🇦',
    defaultCurrency: 'MAD',
    defaultTimezone: 'Africa/Casablanca',
    defaultLanguage: 'fr',
    defaultDateFormat: 'DD/MM/YYYY',
    defaultNumberFormat: '1 234,56',
    defaultTaxSystemId: 'tax-sys-ma-vat',
    fiscalYearStartMonth: 1
  }
];

export const INITIAL_TAX_SYSTEMS_MASTER: TaxSystemMaster[] = [
  {
    id: 'tax-sys-eg-vat',
    countryCode: 'EG',
    code: 'EG_VAT_14',
    name: 'Egypt Value Added Tax (ETA e-Invoicing)',
    nameAr: 'ضريبة القيمة المضافة المصرية (الفاتورة الإلكترونية 14%)',
    authorityName: 'Egyptian Tax Authority (ETA)',
    standardRate: 14,
    requiresEinvoicing: true,
    einvoicingStandard: 'ETA Portal V1.0 SDK',
    isActive: true
  },
  {
    id: 'tax-sys-sa-vat',
    countryCode: 'SA',
    code: 'SA_VAT_15_ZATCA',
    name: 'Saudi Arabia VAT (ZATCA Phase 2 Integration)',
    nameAr: 'ضريبة القيمة المضافة السعودية (زكاة وضريبة - المرحلة الثانية 15%)',
    authorityName: 'Zakat, Tax and Customs Authority (ZATCA)',
    standardRate: 15,
    requiresEinvoicing: true,
    einvoicingStandard: 'ZATCA Phase 2 (Fatoora)',
    isActive: true
  },
  {
    id: 'tax-sys-uae-vat',
    countryCode: 'AE',
    code: 'UAE_VAT_5',
    name: 'UAE Federal Value Added Tax (FTA)',
    nameAr: 'ضريبة القيمة المضافة الاتحادية الإماراتية (5%)',
    authorityName: 'Federal Tax Authority (FTA)',
    standardRate: 5,
    requiresEinvoicing: true,
    einvoicingStandard: 'FTA E-Invoicing System',
    isActive: true
  },
  {
    id: 'tax-sys-us-sales',
    countryCode: 'US',
    code: 'US_SALES_TAX_8.5',
    name: 'US State & Local Sales Tax System',
    nameAr: 'نظام ضريبة المبيعات الأمريكية الولاياتية',
    authorityName: 'State Revenue Department',
    standardRate: 8.5,
    requiresEinvoicing: false,
    isActive: true
  },
  {
    id: 'tax-sys-uk-vat',
    countryCode: 'GB',
    code: 'UK_VAT_20',
    name: 'UK Value Added Tax (HMRC Making Tax Digital)',
    nameAr: 'ضريبة القيمة المضافة البريطانية (20%)',
    authorityName: 'HM Revenue & Customs (HMRC)',
    standardRate: 20,
    requiresEinvoicing: true,
    einvoicingStandard: 'HMRC MTD API',
    isActive: true
  },
  {
    id: 'tax-sys-eu-vat',
    countryCode: 'DE',
    code: 'EU_VAT_19',
    name: 'European Union Standard VAT (VIES System)',
    nameAr: 'ضريبة القيمة المضافة الأوروبية القياسية (19%)',
    authorityName: 'European Commission Tax Directorate',
    standardRate: 19,
    requiresEinvoicing: true,
    einvoicingStandard: 'EU Peppol BIS Billing 3.0',
    isActive: true
  },
  {
    id: 'tax-sys-kw-corp',
    countryCode: 'KW',
    code: 'KW_CORP_TAX_0',
    name: 'Kuwait Corporate & Municipal Tax Framework',
    nameAr: 'النظام الضريبي الكويتي للشركات (0% ضريبة مضافة)',
    authorityName: 'Kuwait Ministry of Finance Tax Dept',
    standardRate: 0,
    requiresEinvoicing: false,
    isActive: true
  },
  {
    id: 'tax-sys-qa-vat',
    countryCode: 'QA',
    code: 'QA_VAT_5',
    name: 'Qatar Value Added Tax System',
    nameAr: 'نظام ضريبة القيمة المضافة القطري (5%)',
    authorityName: 'General Tax Authority (GTA Qatar)',
    standardRate: 5,
    requiresEinvoicing: true,
    isActive: true
  },
  {
    id: 'tax-sys-om-vat',
    countryCode: 'OM',
    code: 'OM_VAT_5',
    name: 'Oman Value Added Tax System',
    nameAr: 'نظام ضريبة القيمة المضافة العماني (5%)',
    authorityName: 'Oman Tax Authority',
    standardRate: 5,
    requiresEinvoicing: true,
    isActive: true
  },
  {
    id: 'tax-sys-bh-vat',
    countryCode: 'BH',
    code: 'BH_VAT_10',
    name: 'Bahrain Value Added Tax System',
    nameAr: 'نظام ضريبة القيمة المضافة البحريني (10%)',
    authorityName: 'National Bureau for Revenue (NBR)',
    standardRate: 10,
    requiresEinvoicing: true,
    isActive: true
  },
  {
    id: 'tax-sys-jo-vat',
    countryCode: 'JO',
    code: 'JO_VAT_16',
    name: 'Jordan General Sales Tax System',
    nameAr: 'ضريبة المبيعات العامة الأردنية (16%)',
    authorityName: 'Income and Sales Tax Department (ISTD)',
    standardRate: 16,
    requiresEinvoicing: true,
    isActive: true
  },
  {
    id: 'tax-sys-custom',
    countryCode: 'CUSTOM',
    code: 'CUSTOM_TAX',
    name: 'Custom Universal Configurable Tax System',
    nameAr: 'نظام ضريبي عام مخصص قابل للتهيئة',
    authorityName: 'Custom Tax Authority',
    standardRate: 10,
    requiresEinvoicing: false,
    isActive: true
  }
];

export const INITIAL_STATES_PROVINCES_MASTER: StateProvinceMaster[] = [
  // Egypt
  { id: 'st-eg-cai', countryCode: 'EG', code: 'CAI', name: 'Cairo Governorate', nameAr: 'محافظة القاهرة' },
  { id: 'st-eg-giz', countryCode: 'EG', code: 'GIZ', name: 'Giza Governorate', nameAr: 'محافظة الجيزة' },
  { id: 'st-eg-alex', countryCode: 'EG', code: 'ALX', name: 'Alexandria Governorate', nameAr: 'محافظة الإسكندرية' },
  { id: 'st-eg-shg', countryCode: 'EG', code: 'SHG', name: 'Sharqia Governorate', nameAr: 'محافظة الشرقية' },
  { id: 'st-eg-daq', countryCode: 'EG', code: 'DAQ', name: 'Dakahlia Governorate', nameAr: 'محافظة الدقهلية' },
  // Saudi Arabia
  { id: 'st-sa-ryd', countryCode: 'SA', code: 'RYD', name: 'Riyadh Province', nameAr: 'منطقة الرياض' },
  { id: 'st-sa-mak', countryCode: 'SA', code: 'MAK', name: 'Makkah Al Mukarramah Province', nameAr: 'منطقة مكة المكرمة' },
  { id: 'st-sa-eas', countryCode: 'SA', code: 'EAS', name: 'Eastern Province', nameAr: 'المنطقة الشرقية' },
  { id: 'st-sa-med', countryCode: 'SA', code: 'MED', name: 'Madinah Province', nameAr: 'منطقة المدينة المنورة' },
  // UAE
  { id: 'st-ae-dxb', countryCode: 'AE', code: 'DXB', name: 'Dubai', nameAr: 'إمارة دبي' },
  { id: 'st-ae-auh', countryCode: 'AE', code: 'AUH', name: 'Abu Dhabi', nameAr: 'إمارة أبوظبي' },
  { id: 'st-ae-shj', countryCode: 'AE', code: 'SHJ', name: 'Sharjah', nameAr: 'إمارة الشارقة' },
  // USA
  { id: 'st-us-ny', countryCode: 'US', code: 'NY', name: 'New York', nameAr: 'نيويورك' },
  { id: 'st-us-ca', countryCode: 'US', code: 'CA', name: 'California', nameAr: 'كاليفورنيا' },
  { id: 'st-us-tx', countryCode: 'US', code: 'TX', name: 'Texas', nameAr: 'تكساس' },
  // UK
  { id: 'st-gb-ldn', countryCode: 'GB', code: 'LDN', name: 'Greater London', nameAr: 'لندن الكبرى' },
  // Germany
  { id: 'st-de-bay', countryCode: 'DE', code: 'BAY', name: 'Bavaria (Bayern)', nameAr: 'بافاريا' }
];

export const INITIAL_CITIES_MASTER: CityMaster[] = [
  // Egypt
  { id: 'cty-eg-01', countryCode: 'EG', stateCode: 'CAI', name: 'Cairo', nameAr: 'القاهرة' },
  { id: 'cty-eg-02', countryCode: 'EG', stateCode: 'CAI', name: 'New Cairo (Fifth Settlement)', nameAr: 'القاهرة الجديدة (التجمع الخامس)' },
  { id: 'cty-eg-03', countryCode: 'EG', stateCode: 'GIZ', name: 'Giza / 6th of October', nameAr: 'الجيزة / السادس من أكتوبر' },
  { id: 'cty-eg-04', countryCode: 'EG', stateCode: 'ALX', name: 'Alexandria', nameAr: 'الإسكندرية' },
  { id: 'cty-eg-05', countryCode: 'EG', stateCode: 'DAQ', name: 'Mansoura', nameAr: 'المنصورة' },
  // Saudi Arabia
  { id: 'cty-sa-01', countryCode: 'SA', stateCode: 'RYD', name: 'Riyadh', nameAr: 'الرياض' },
  { id: 'cty-sa-02', countryCode: 'SA', stateCode: 'MAK', name: 'Jeddah', nameAr: 'جدة' },
  { id: 'cty-sa-03', countryCode: 'SA', stateCode: 'MAK', name: 'Makkah', nameAr: 'مكة المكرمة' },
  { id: 'cty-sa-04', countryCode: 'SA', stateCode: 'EAS', name: 'Dammam', nameAr: 'الدمام' },
  { id: 'cty-sa-05', countryCode: 'SA', stateCode: 'EAS', name: 'Khobar', nameAr: 'الخبر' },
  // UAE
  { id: 'cty-ae-01', countryCode: 'AE', stateCode: 'DXB', name: 'Dubai', nameAr: 'دبي' },
  { id: 'cty-ae-02', countryCode: 'AE', stateCode: 'AUH', name: 'Abu Dhabi', nameAr: 'أبوظبي' },
  { id: 'cty-ae-03', countryCode: 'AE', stateCode: 'SHJ', name: 'Sharjah', nameAr: 'الشارقة' },
  // US & UK
  { id: 'cty-us-01', countryCode: 'US', stateCode: 'NY', name: 'New York City', nameAr: 'مدينة نيويورك' },
  { id: 'cty-us-02', countryCode: 'US', stateCode: 'CA', name: 'Los Angeles', nameAr: 'لوس أنجلوس' },
  { id: 'cty-gb-01', countryCode: 'GB', stateCode: 'LDN', name: 'London', nameAr: 'لندن' }
];

export const INITIAL_TIMEZONES_MASTER: TimezoneMaster[] = [
  { code: 'Africa/Cairo', name: 'Cairo, Egypt (GMT+02:00 / GMT+03:00)', offset: '+02:00' },
  { code: 'Asia/Riyadh', name: 'Riyadh, Saudi Arabia (GMT+03:00)', offset: '+03:00' },
  { code: 'Asia/Dubai', name: 'Dubai, UAE (GMT+04:00)', offset: '+04:00' },
  { code: 'Asia/Kuwait', name: 'Kuwait City (GMT+03:00)', offset: '+03:00' },
  { code: 'Europe/London', name: 'London, UK (GMT+00:00)', offset: '+00:00' },
  { code: 'Europe/Berlin', name: 'Berlin, Germany (GMT+01:00)', offset: '+01:00' },
  { code: 'America/New_York', name: 'New York, US (GMT-05:00)', offset: '-05:00' },
  { code: 'UTC', name: 'Universal Coordinated Time (UTC)', offset: '+00:00' }
];

export const INITIAL_LANGUAGES_MASTER: LanguageMaster[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr' }
];

export const INITIAL_FISCAL_CALENDARS_MASTER: FiscalCalendarMaster[] = [
  { id: 'fcal-jan', name: 'Standard Calendar Year (Jan 01 - Dec 31)', nameAr: 'السنة التقويمية القياسية (1 يناير - 31 ديسمبر)', startMonth: 1, startDay: 1 },
  { id: 'fcal-jul', name: 'Fiscal Year (July 01 - June 30) - Egypt / Australia Standard', nameAr: 'السنة المالية (1 يوليو - 30 يونيو) - معيار مصر وأستراليا', startMonth: 7, startDay: 1 },
  { id: 'fcal-apr', name: 'Fiscal Year (April 01 - March 31) - UK / India Standard', nameAr: 'السنة المالية (1 أبريل - 31 مارس) - معيار بريطانيا والهند', startMonth: 4, startDay: 1 },
  { id: 'fcal-oct', name: 'Fiscal Year (October 01 - September 30) - Federal Standard', nameAr: 'السنة المالية (1 أكتوبر - 30 سبتمبر)', startMonth: 10, startDay: 1 }
];

export const INITIAL_WAREHOUSE_LOCATIONS: any[] = [
  { id: 'loc-01', warehouseId: 'wh-001', code: 'BIN-REC-01', name: 'Receiving Dock 01' },
  { id: 'loc-02', warehouseId: 'wh-001', code: 'BIN-SHIP-01', name: 'Dispatch Bay 01' }
];

// ==================== PHASE 2.2.4 INVENTORY FINANCIAL INTEGRATION SEED DATA ====================

export const INITIAL_EVENT_MAPPING_RULES: any[] = [
  { id: 'map-01', tenantId: 'ten-001', businessEventType: 'EVT_GOODS_RECEIPT', financialEventType: 'GOODS_RECEIPT', description: 'Goods Receipt GRN -> Inventory Asset Debit / GR-IR Credit', descriptionAr: 'استلام بضاعة -> أصل مخزون مدين / حساب تسوية الموردين دائن', active: true },
  { id: 'map-02', tenantId: 'ten-001', businessEventType: 'EVT_GOODS_ISSUE', financialEventType: 'GOODS_ISSUE', description: 'Goods Issue GIN -> COGS Debit / Inventory Asset Credit', descriptionAr: 'صرف بضاعة -> تكلفة المبيعات مدين / أصل المخزون دائن', active: true },
  { id: 'map-03', tenantId: 'ten-001', businessEventType: 'EVT_ADJUSTMENT_PLUS', financialEventType: 'INVENTORY_ADJUSTMENT', description: 'Stock Adjustment (+) -> Inventory Asset Debit / Inventory Adjustment Credit', descriptionAr: 'تعديل مخزون (+) -> أصل المخزون مدين / تسوية المخزون دائن', active: true },
  { id: 'map-04', tenantId: 'ten-001', businessEventType: 'EVT_ADJUSTMENT_MINUS', financialEventType: 'INVENTORY_ADJUSTMENT', description: 'Stock Adjustment (-) -> Inventory Adjustment Debit / Inventory Asset Credit', descriptionAr: 'تعديل مخزون (-) -> تسوية المخزون مدين / أصل المخزون دائن', active: true },
  { id: 'map-05', tenantId: 'ten-001', businessEventType: 'EVT_OPENING_STOCK', financialEventType: 'OPENING_BALANCE', description: 'Opening Balance -> Inventory Asset Debit / Opening Balance Equity Credit', descriptionAr: 'رصيد افتتاح ل -> أصل المخزون مدين / رأس المال الافتتاحي دائن', active: true },
  { id: 'map-06', tenantId: 'ten-001', businessEventType: 'EVT_TRANSFER', financialEventType: 'INVENTORY_TRANSFER', description: 'Inter-Warehouse Transfer -> In-Transit Inventory Clearing', descriptionAr: 'نقل بين المستودعات -> حساب الترانزيت/التسوية', active: true },
  { id: 'map-07', tenantId: 'ten-001', businessEventType: 'EVT_RETURN_IN', financialEventType: 'GOODS_RECEIPT', description: 'Customer Return In -> Inventory Asset Debit / COGS Credit', descriptionAr: 'مرتجع عملاء -> أصل المخزون مدين / تكلفة مبيعات دائن', active: true },
  { id: 'map-08', tenantId: 'ten-001', businessEventType: 'EVT_RETURN_OUT', financialEventType: 'GOODS_ISSUE', description: 'Vendor Return Out -> GR-IR Debit / Inventory Asset Credit', descriptionAr: 'مرتجع موردين -> تسوية الموردين مدين / أصل المخزون دائن', active: true }
];

export const INITIAL_JOURNAL_TEMPLATES: any[] = [
  {
    id: 'tmpl-inv-asset',
    tenantId: 'ten-001',
    code: 'JT-INV-ASSET',
    name: 'Inventory Asset Valuation Template',
    nameAr: 'قالب تقييم أصل المخزون (استلام)',
    category: 'Inventory Asset',
    active: true,
    lines: [
      { id: 'jtl-101', lineNo: 1, accountType: 'INVENTORY_ASSET', accountCodeDefault: '1030', side: 'DEBIT', percentage: 100, descriptionPattern: 'Inventory Asset Debit - Receipt Valuation' },
      { id: 'jtl-102', lineNo: 2, accountType: 'GR_IR_CLEARING', accountCodeDefault: '2020', side: 'CREDIT', percentage: 100, descriptionPattern: 'GR/IR Accrual Clearing Credit' }
    ]
  },
  {
    id: 'tmpl-inv-adj',
    tenantId: 'ten-001',
    code: 'JT-INV-ADJ',
    name: 'Inventory Adjustment Template',
    nameAr: 'قالب وتسويات فروقات المخزون',
    category: 'Inventory Adjustment',
    active: true,
    lines: [
      { id: 'jtl-201', lineNo: 1, accountType: 'INVENTORY_ASSET', accountCodeDefault: '1030', side: 'DEBIT', percentage: 100, descriptionPattern: 'Inventory Asset Value Adjustment' },
      { id: 'jtl-202', lineNo: 2, accountType: 'INVENTORY_ADJUSTMENT', accountCodeDefault: '5020', side: 'CREDIT', percentage: 100, descriptionPattern: 'Inventory Adjustment Gain/Loss Account' }
    ]
  },
  {
    id: 'tmpl-inv-diff',
    tenantId: 'ten-001',
    code: 'JT-INV-DIFF',
    name: 'Inventory Stock Count Difference Template',
    nameAr: 'قالب جرد وفروقات الكميات',
    category: 'Inventory Difference',
    active: true,
    lines: [
      { id: 'jtl-301', lineNo: 1, accountType: 'INVENTORY_DIFFERENCE', accountCodeDefault: '5020', side: 'DEBIT', percentage: 100, descriptionPattern: 'Stock Take Discrepancy Expense' },
      { id: 'jtl-302', lineNo: 2, accountType: 'INVENTORY_ASSET', accountCodeDefault: '1030', side: 'CREDIT', percentage: 100, descriptionPattern: 'Inventory Balance Discrepancy Credit' }
    ]
  },
  {
    id: 'tmpl-inv-transfer',
    tenantId: 'ten-001',
    code: 'JT-INV-XFER',
    name: 'Inter-Warehouse Transfer Clearing Template',
    nameAr: 'قالب النقل والتسوية بين الفروع',
    category: 'Inventory Transfer',
    active: true,
    lines: [
      { id: 'jtl-401', lineNo: 1, accountType: 'INVENTORY_TRANSFER_CLEARING', accountCodeDefault: '1035', side: 'DEBIT', percentage: 100, descriptionPattern: 'In-Transit Stock Clearing Debit' },
      { id: 'jtl-402', lineNo: 2, accountType: 'INVENTORY_ASSET', accountCodeDefault: '1030', side: 'CREDIT', percentage: 100, descriptionPattern: 'Source Warehouse Asset Credit' }
    ]
  },
  {
    id: 'tmpl-inv-opening',
    tenantId: 'ten-001',
    code: 'JT-INV-OPENING',
    name: 'Opening Stock Equity Valuation Template',
    nameAr: 'قالب قيد الأرصدة الافتتاحية للمخزون',
    category: 'Inventory Opening',
    active: true,
    lines: [
      { id: 'jtl-501', lineNo: 1, accountType: 'INVENTORY_ASSET', accountCodeDefault: '1030', side: 'DEBIT', percentage: 100, descriptionPattern: 'Opening Inventory Asset Value' },
      { id: 'jtl-502', lineNo: 2, accountType: 'OPENING_BALANCE_EQUITY', accountCodeDefault: '3010', side: 'CREDIT', percentage: 100, descriptionPattern: 'Opening Balance Equity Partner Capital' }
    ]
  },
  {
    id: 'tmpl-inv-return',
    tenantId: 'ten-001',
    code: 'JT-INV-RETURN',
    name: 'Inventory Returns Valuation Template',
    nameAr: 'قالب تقييم مرتجعات المخزون',
    category: 'Inventory Return',
    active: true,
    lines: [
      { id: 'jtl-601', lineNo: 1, accountType: 'INVENTORY_ASSET', accountCodeDefault: '1030', side: 'DEBIT', percentage: 100, descriptionPattern: 'Restocked Inventory Asset Value' },
      { id: 'jtl-602', lineNo: 2, accountType: 'COGS', accountCodeDefault: '5010', side: 'CREDIT', percentage: 100, descriptionPattern: 'COGS Reversal on Return' }
    ]
  },
  {
    id: 'tmpl-inv-writeoff',
    tenantId: 'ten-001',
    code: 'JT-INV-WRITEOFF',
    name: 'Inventory Scrap & Write-off Template',
    nameAr: 'قالب إعدام وتخريد المواد التالفة',
    category: 'Inventory Write-Off',
    active: true,
    lines: [
      { id: 'jtl-701', lineNo: 1, accountType: 'WRITE_OFF_EXPENSE', accountCodeDefault: '5020', side: 'DEBIT', percentage: 100, descriptionPattern: 'Inventory Damaged Goods Expense' },
      { id: 'jtl-702', lineNo: 2, accountType: 'INVENTORY_ASSET', accountCodeDefault: '1030', side: 'CREDIT', percentage: 100, descriptionPattern: 'Inventory Write-Off Asset Reduction' }
    ]
  }
];

export const INITIAL_POSTING_PROFILES: any[] = [
  {
    id: 'prof-01',
    tenantId: 'ten-001',
    code: 'PROF-GRN-STD',
    name: 'Standard Goods Receipt Posting Profile',
    nameAr: 'ملف الترحيل القياسي لاستلام البضائع',
    companyId: 'comp-001',
    branchId: '*',
    inventoryCategoryId: '*',
    businessEventType: 'EVT_GOODS_RECEIPT',
    financialEventType: 'GOODS_RECEIPT',
    journalTemplateId: 'tmpl-inv-asset',
    currency: 'SAR',
    postingBehavior: 'AUTO_POST',
    active: true
  },
  {
    id: 'prof-02',
    tenantId: 'ten-001',
    code: 'PROF-GIN-STD',
    name: 'Standard Goods Issue Posting Profile',
    nameAr: 'ملف الترحيل القياسي لصرف البضائع',
    companyId: 'comp-001',
    branchId: '*',
    inventoryCategoryId: '*',
    businessEventType: 'EVT_GOODS_ISSUE',
    financialEventType: 'GOODS_ISSUE',
    journalTemplateId: 'tmpl-inv-asset',
    currency: 'SAR',
    postingBehavior: 'AUTO_POST',
    active: true
  },
  {
    id: 'prof-03',
    tenantId: 'ten-001',
    code: 'PROF-ADJ-STD',
    name: 'Inventory Adjustment Profile',
    nameAr: 'ملف ترحيل التسويات المخزنية',
    companyId: 'comp-001',
    branchId: '*',
    inventoryCategoryId: '*',
    businessEventType: 'EVT_ADJUSTMENT_PLUS',
    financialEventType: 'INVENTORY_ADJUSTMENT',
    journalTemplateId: 'tmpl-inv-adj',
    currency: 'SAR',
    postingBehavior: 'AUTO_POST',
    active: true
  },
  {
    id: 'prof-04',
    tenantId: 'ten-001',
    code: 'PROF-OPN-STD',
    name: 'Opening Stock Posting Profile',
    nameAr: 'ملف ترحيل الأرصدة الافتتاحية للمخزون',
    companyId: 'comp-001',
    branchId: '*',
    inventoryCategoryId: '*',
    businessEventType: 'EVT_OPENING_STOCK',
    financialEventType: 'OPENING_BALANCE',
    journalTemplateId: 'tmpl-inv-opening',
    currency: 'SAR',
    postingBehavior: 'AUTO_POST',
    active: true
  }
];

export const INITIAL_FINANCIAL_QUEUE: any[] = [
  {
    id: 'fq-2026-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    eventId: 'fev-1001',
    correlationId: 'CORR-GRN-2026-001-1001',
    idempotencyKey: 'IDEMP-GRN-2026-001-EVT_GOODS_RECEIPT-HW-SRV-01-10-185000',
    status: 'Completed',
    retryCount: 0,
    maxRetries: 3,
    retryDelayMs: 1000,
    isLocked: false,
    isDeadLetter: false,
    queuedAt: '2026-08-11T10:00:00.000Z',
    processedAt: '2026-08-11T10:00:02.000Z',
    journalEntryId: 'je-auto-1001',
    payload: {
      eventId: 'fev-1001',
      correlationId: 'CORR-GRN-2026-001-1001',
      idempotencyKey: 'IDEMP-GRN-2026-001-EVT_GOODS_RECEIPT-HW-SRV-01-10-185000',
      eventVersion: '1.0',
      schemaVersion: 'v1.0',
      eventTypeVersion: 'v1.0',
      tenantId: 'ten-001',
      companyId: 'comp-001',
      branchId: 'br-001',
      warehouseId: 'wh-001',
      itemId: 'item-01',
      itemSku: 'HW-SRV-01',
      quantity: 10,
      unitCost: 18500,
      totalCost: 185000,
      currency: 'SAR',
      businessEvent: 'EVT_GOODS_RECEIPT',
      financialEventType: 'GOODS_RECEIPT',
      postingProfileId: 'prof-01',
      journalTemplateId: 'tmpl-inv-asset',
      sourceDocumentType: 'GoodsReceiptNote',
      sourceDocumentId: 'grn-2026-001',
      sourceDocumentNumber: 'GRN-2026-001',
      createdBy: 'usr-001',
      createdAt: '2026-08-11T10:00:00.000Z',
      auditMetadata: { fifoLayerId: 'layer-01' }
    },
    auditHistory: [
      { id: 'ah-1', timestamp: '2026-08-11T10:00:00.000Z', action: 'EVENT_QUEUED', user: 'System', details: 'Enqueued via Receipt Engine' },
      { id: 'ah-2', timestamp: '2026-08-11T10:00:02.000Z', action: 'POSTING_COMPLETED', user: 'Financial Event Engine', details: 'GL Journal Entry JE-2026-1001 created successfully' }
    ]
  },
  {
    id: 'fq-2026-002',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    eventId: 'fev-1002',
    correlationId: 'CORR-GIN-2026-002-1002',
    idempotencyKey: 'IDEMP-GIN-2026-002-EVT_GOODS_ISSUE-SW-LIC-01-5-12000',
    status: 'Pending',
    retryCount: 0,
    maxRetries: 3,
    retryDelayMs: 1000,
    isLocked: false,
    isDeadLetter: false,
    queuedAt: '2026-08-11T12:30:00.000Z',
    payload: {
      eventId: 'fev-1002',
      correlationId: 'CORR-GIN-2026-002-1002',
      idempotencyKey: 'IDEMP-GIN-2026-002-EVT_GOODS_ISSUE-SW-LIC-01-5-12000',
      eventVersion: '1.0',
      schemaVersion: 'v1.0',
      eventTypeVersion: 'v1.0',
      tenantId: 'ten-001',
      companyId: 'comp-001',
      branchId: 'br-001',
      warehouseId: 'wh-001',
      itemId: 'item-02',
      itemSku: 'SW-LIC-01',
      quantity: 5,
      unitCost: 2400,
      totalCost: 12000,
      currency: 'SAR',
      businessEvent: 'EVT_GOODS_ISSUE',
      financialEventType: 'GOODS_ISSUE',
      postingProfileId: 'prof-02',
      journalTemplateId: 'tmpl-inv-asset',
      sourceDocumentType: 'GoodsIssueNote',
      sourceDocumentId: 'gin-2026-002',
      sourceDocumentNumber: 'GIN-2026-002',
      createdBy: 'usr-001',
      createdAt: '2026-08-11T12:30:00.000Z',
      auditMetadata: { costEngineMethod: 'AVCO' }
    },
    auditHistory: [
      { id: 'ah-3', timestamp: '2026-08-11T12:30:00.000Z', action: 'EVENT_QUEUED', user: 'System', details: 'Enqueued via Issue Valuation Engine' }
    ]
  }
];

export const INITIAL_FINANCIAL_AUDIT_RECORDS: any[] = [
  {
    id: 'faudit-001',
    tenantId: 'ten-001',
    eventId: 'fev-1001',
    correlationId: 'CORR-GRN-2026-001-1001',
    idempotencyKey: 'IDEMP-GRN-2026-001-EVT_GOODS_RECEIPT-HW-SRV-01-10-185000',
    eventVersion: '1.0',
    queueItemId: 'fq-2026-001',
    businessEventType: 'EVT_GOODS_RECEIPT',
    financialEventType: 'GOODS_RECEIPT',
    sourceDocumentNumber: 'GRN-2026-001',
    status: 'Completed',
    actionTaken: 'GL_POSTED',
    performedBy: 'System Auto-Poster',
    timestamp: '2026-08-11T10:00:02.000Z',
    details: 'Converted Inventory Receipt event to Financial Event and posted GL Entry JE-2026-1001 (CorrID: CORR-GRN-2026-001-1001)'
  }
];

// ==========================================================
// Phase 2.2.5 Mock Data — Inventory Closing & Control Engine
// ==========================================================

export const INITIAL_INVENTORY_PERIODS: any[] = [
  {
    id: 'period-2026-07',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    periodName: 'JUL-2026',
    fiscalYear: 2026,
    fiscalPeriod: 7,
    startDate: '2026-07-01T00:00:00.000Z',
    endDate: '2026-07-31T23:59:59.000Z',
    status: 'Closed',
    closedBy: 'Ahmed Mounir',
    closedAt: '2026-08-01T08:00:00.000Z',
    allowOverrideUsers: ['usr-admin', 'Super Admin']
  },
  {
    id: 'period-2026-08',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    periodName: 'AUG-2026',
    fiscalYear: 2026,
    fiscalPeriod: 8,
    startDate: '2026-08-01T00:00:00.000Z',
    endDate: '2026-08-31T23:59:59.000Z',
    status: 'Open',
    allowOverrideUsers: ['usr-admin', 'Super Admin', 'Inventory Manager']
  },
  {
    id: 'period-2026-09',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    periodName: 'SEP-2026',
    fiscalYear: 2026,
    fiscalPeriod: 9,
    startDate: '2026-09-01T00:00:00.000Z',
    endDate: '2026-09-30T23:59:59.000Z',
    status: 'Open',
    allowOverrideUsers: ['usr-admin', 'Super Admin']
  }
];

export const INITIAL_FISCAL_INVENTORY_LOCKS: any[] = [
  {
    id: 'flock-wh-003',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    lockLevel: 'Warehouse',
    targetId: 'wh-003',
    targetName: 'Dammam Regional Hub',
    status: 'Locked',
    lockedBy: 'Ahmed Mounir',
    lockedAt: '2026-08-10T14:00:00.000Z',
    lockReason: 'Annual Physical Inventory Count & Variance Audit'
  },
  {
    id: 'flock-wh-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    lockLevel: 'Warehouse',
    targetId: 'wh-001',
    targetName: 'Riyadh Central Distribution Center',
    status: 'Unlocked',
    lockReason: 'Regular Operations'
  }
];

export const INITIAL_INVENTORY_COUNT_SESSIONS: any[] = [
  {
    id: 'cs-2026-001',
    sessionNumber: 'CS-2026-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    warehouseId: 'wh-001',
    warehouseName: 'Riyadh Central Distribution Center',
    periodId: 'period-2026-08',
    title: 'Q3 Physical Inventory Audit & Cycle Count',
    isBlindCount: true,
    status: 'VarianceReview',
    totalBookValue: 2450000,
    totalPhysicalValue: 2442500,
    totalVarianceValue: -7500,
    createdBy: 'Ahmed Mounir',
    createdAt: '2026-08-09T09:00:00.000Z',
    items: [
      {
        id: 'csi-001',
        itemId: 'item-01',
        itemSku: 'HW-SRV-01',
        itemName: 'Enterprise Server Pro X1',
        warehouseId: 'wh-001',
        zoneId: 'zone-01',
        binId: 'bin-01',
        batchNumber: 'LOT-2026-A1',
        bookQuantity: 15,
        physicalQuantity: 15,
        varianceQuantity: 0,
        unitCost: 18500,
        varianceValue: 0,
        isBlindCount: true,
        countedBy: 'Count Team Alpha',
        countedAt: '2026-08-09T11:30:00.000Z',
        status: 'Verified'
      },
      {
        id: 'csi-002',
        itemId: 'item-02',
        itemSku: 'SW-LIC-01',
        itemName: 'Enterprise Cloud License 1Y',
        warehouseId: 'wh-001',
        zoneId: 'zone-01',
        binId: 'bin-02',
        bookQuantity: 50,
        physicalQuantity: 47,
        varianceQuantity: -3,
        unitCost: 2400,
        varianceValue: -7200,
        isBlindCount: true,
        countedBy: 'Count Team Beta',
        countedAt: '2026-08-09T12:00:00.000Z',
        notes: '3 units damaged/missing in Bin B-02',
        status: 'RecountNeeded'
      }
    ]
  }
];

export const INITIAL_RECONCILIATION_PROPOSALS: any[] = [
  {
    id: 'rec-prop-001',
    countSessionId: 'cs-2026-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    warehouseId: 'wh-001',
    itemSku: 'SW-LIC-01',
    itemName: 'Enterprise Cloud License 1Y',
    bookQuantity: 50,
    physicalQuantity: 47,
    varianceQuantity: -3,
    unitCost: 2400,
    varianceValue: -7200,
    type: 'Loss',
    proposedEventType: 'EVT_ADJUSTMENT_MINUS',
    status: 'Pending'
  }
];

export const INITIAL_INVENTORY_CLOSING_AUDIT_RECORDS: any[] = [
  {
    id: 'audit-ic-001',
    tenantId: 'ten-001',
    actionType: 'PERIOD_CLOSED',
    performedBy: 'Ahmed Mounir',
    performedAt: '2026-08-01T08:00:00.000Z',
    targetRef: 'period-2026-07',
    details: 'Inventory Period JUL-2026 officially closed with zero open variances.',
    previousState: 'Open',
    newState: 'Closed',
    hash: 'HASH-20260801-JUL2026-CLOSED'
  },
  {
    id: 'audit-ic-002',
    tenantId: 'ten-001',
    actionType: 'FISCAL_LOCK_CHANGED',
    performedBy: 'Ahmed Mounir',
    performedAt: '2026-08-10T14:00:00.000Z',
    targetRef: 'flock-wh-003',
    details: 'Warehouse Dammam Regional Hub locked for Physical Cycle Count.',
    previousState: 'Unlocked',
    newState: 'Locked',
    hash: 'HASH-20260810-WH003-LOCKED'
  }
];

export const INITIAL_INVENTORY_CLOSING_SNAPSHOTS: any[] = [
  {
    id: 'snap-2026-07',
    snapshotNumber: 'SNAP-2026-07-001',
    periodId: 'period-2026-07',
    periodName: 'JUL-2026',
    companyId: 'comp-001',
    createdAt: '2026-08-01T08:00:00.000Z',
    createdBy: 'Ahmed Mounir',
    inventorySnapshot: [],
    stockQuantSnapshot: [],
    fifoLayerSnapshot: [],
    avcoSnapshot: [{ itemSku: 'HW-SRV-01', avcoCost: 18500, stockQty: 25 }],
    standardCostSnapshot: [{ itemSku: 'HW-SRV-01', standardCost: 18500 }],
    inventoryValueSnapshot: {
      totalValue: 582500,
      warehouseValues: { 'wh-001': 420000, 'wh-002': 162500 },
      itemCategoryValues: { 'Hardware': 420000, 'Software': 162500 }
    },
    hash: 'HASH-SNAP-2026-07-IMMUTABLE'
  }
];

export const INITIAL_INVENTORY_CERTIFICATES: any[] = [
  {
    id: 'cert-2026-07',
    certificateNumber: 'CERT-INV-2026-07-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    warehouseId: 'ALL',
    closingPeriod: 'JUL-2026',
    inventoryValue: 582500,
    healthScore: 98,
    accuracyPercent: 99,
    completenessPercent: 100,
    closingUser: 'Ahmed Mounir',
    closingDate: '2026-08-01T08:00:00.000Z',
    snapshotReference: 'snap-2026-07',
    auditReference: 'audit-ic-001',
    overallStatus: 'CERTIFIED',
    immutableHash: 'HASH-CERT-2026-07-IMMUTABLE'
  }
];

// ==================== PHASE 2.3 PROCUREMENT MOCK DATASETS ====================

export const INITIAL_VENDOR_CATEGORIES: VendorCategory[] = [
  { id: 'vcat-001', tenantId: 'ten-001', code: 'CAT-HW', name: 'Hardware & Infrastructure Suppliers', nameAr: 'موردي الأجهزة والبنية التحتية', description: 'Enterprise hardware, servers, networking gear', active: true },
  { id: 'vcat-002', tenantId: 'ten-001', code: 'CAT-SW', name: 'Software & Cloud Vendors', nameAr: 'موردي البرامج والسحاب', description: 'Software licensing, SaaS, Cloud services', active: true },
  { id: 'vcat-003', tenantId: 'ten-001', code: 'CAT-RAW', name: 'Raw Materials & Components', nameAr: 'المواد الخام والمكونات', description: 'Industrial components and materials', active: true },
  { id: 'vcat-004', tenantId: 'ten-001', code: 'CAT-SVC', name: 'Professional Services', nameAr: 'الخدمات المهنية والاستشارية', description: 'Consulting, logistics, maintenance', active: true }
];

export const INITIAL_PROCUREMENT_PAYMENT_TERMS: PaymentTerms[] = [
  { id: 'pterm-001', tenantId: 'ten-001', code: 'NET30', name: 'Net 30 Days', nameAr: 'صافي 30 يوم', dueDays: 30, discountDays: 10, discountPercent: 2, active: true },
  { id: 'pterm-002', tenantId: 'ten-001', code: 'NET60', name: 'Net 60 Days', nameAr: 'صافي 60 يوم', dueDays: 60, discountDays: 0, discountPercent: 0, active: true },
  { id: 'pterm-003', tenantId: 'ten-001', code: 'COD', name: 'Cash on Delivery', nameAr: 'الدفع عند التسليم', dueDays: 0, discountDays: 0, discountPercent: 0, active: true },
  { id: 'pterm-004', tenantId: 'ten-001', code: 'ADV50', name: '50% Advance, 50% Delivery', nameAr: '50% مقدم و 50% عند الاستلام', dueDays: 15, discountDays: 0, discountPercent: 0, active: true }
];

export const INITIAL_INCOTERMS: Incoterms[] = [
  { id: 'inco-001', tenantId: 'ten-001', code: 'FOB', name: 'Free on Board', nameAr: 'التسليم على ظهر السفينة', description: 'Seller delivers goods on board the vessel nominated by buyer', active: true },
  { id: 'inco-002', tenantId: 'ten-001', code: 'CIF', name: 'Cost, Insurance & Freight', nameAr: 'التكلفة والتأمين وشحن البضائع', description: 'Seller pays cost, insurance and freight to destination port', active: true },
  { id: 'inco-003', tenantId: 'ten-001', code: 'EXW', name: 'Ex Works', nameAr: 'التسليم في مصنع البائع', description: 'Buyer incurs all costs and risks in taking goods to destination', active: true },
  { id: 'inco-004', tenantId: 'ten-001', code: 'DDP', name: 'Delivered Duty Paid', nameAr: 'التسليم شاملاً الرسوم الجمركية', description: 'Seller assumes maximum responsibility for transport and customs', active: true }
];

export const INITIAL_PROCUREMENT_CATEGORIES = [
  { id: 'pcat-001', tenantId: 'ten-001', code: 'PC-HW', name: 'IT Hardware & Equipment', nameAr: 'أجهزة ومعدات تقنية المعلومات', active: true },
  { id: 'pcat-002', tenantId: 'ten-001', code: 'PC-NET', name: 'Telecommunications & Networking', nameAr: 'الاتصالات والشبكات', active: true },
  { id: 'pcat-003', tenantId: 'ten-001', code: 'PC-OFF', name: 'Office Supplies & Furniture', nameAr: 'المستلزمات والأثاث المكتبي', active: true }
];

export const INITIAL_BUYER_GROUPS: BuyerGroup[] = [
  { id: 'bg-001', tenantId: 'ten-001', code: 'BG-IT', name: 'IT Procurement Team', nameAr: 'فريق مشتريات تقنية المعلومات', description: 'Handles all hardware, software and infrastructure POs', active: true },
  { id: 'bg-002', tenantId: 'ten-001', code: 'BG-OPS', name: 'Operations & Facilities Team', nameAr: 'فريق المشتريات والتشغيل', description: 'Handles equipment, office, and facilities PRs/POs', active: true }
];

export const INITIAL_PURCHASING_ORGS: PurchasingOrganization[] = [
  { id: 'porg-001', tenantId: 'ten-001', companyId: 'comp-001', code: 'PORG-GLOBAL', name: 'Global Central Purchasing Org', nameAr: 'منظمة المشتريات المركزية العالمية', isCompanyLevel: true, active: true },
  { id: 'porg-002', tenantId: 'ten-001', companyId: 'comp-001', code: 'PORG-LOCAL-01', name: 'Cairo Branch Purchasing Org', nameAr: 'منظمة مشتريات فرع القاهرة', isCompanyLevel: false, active: true }
];

export const INITIAL_PROCUREMENT_VENDORS: VendorMaster[] = [
  {
    id: 'ven-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'VEN-DELL-01',
    name: 'Dell Technologies Global',
    nameAr: 'شركة ديل تكنولوجيز العالمية',
    taxNumber: '100492819200003',
    commercialRegNo: 'CR-9920182',
    vendorCategoryId: 'vcat-001',
    vendorCategoryName: 'Hardware & Infrastructure Suppliers',
    paymentTermsId: 'pterm-001',
    paymentTermsName: 'Net 30 Days',
    incotermsId: 'inco-001',
    incotermsCode: 'FOB',
    purchasingOrgId: 'porg-001',
    purchasingOrgName: 'Global Central Purchasing Org',
    currency: 'USD',
    email: 'enterprise-orders@dell.com',
    phone: '+1-800-456-3355',
    contactPerson: 'Sarah Jenkins',
    address: 'One Dell Way, Round Rock, TX 78682',
    country: 'United States',
    city: 'Round Rock',
    bankName: 'JPMorgan Chase',
    bankIban: 'US39JPMC1002938192001',
    creditLimit: 500000,
    rating: 5,
    performanceKPIs: {
      onTimeDeliveryRate: 98.5,
      averageLeadTimeDays: 10,
      qualityRating: 99.1,
      rejectionRate: 0.8,
      totalOrdersCompleted: 42,
      totalAmountProcured: 1250000,
      lastEvaluatedAt: '2026-08-01T08:00:00.000Z'
    },
    status: 'ACTIVE',
    notes: 'Preferred vendor for Enterprise Rack Servers and Workstations.',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'ven-002',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'VEN-CISCO-02',
    name: 'Cisco Systems Middle East',
    nameAr: 'شركة سيسكو سيستمز الشرق الأوسط',
    taxNumber: '300182746100003',
    commercialRegNo: 'CR-8827361',
    vendorCategoryId: 'vcat-001',
    vendorCategoryName: 'Hardware & Infrastructure Suppliers',
    paymentTermsId: 'pterm-002',
    paymentTermsName: 'Net 60 Days',
    incotermsId: 'inco-002',
    incotermsCode: 'CIF',
    purchasingOrgId: 'porg-001',
    purchasingOrgName: 'Global Central Purchasing Org',
    currency: 'USD',
    email: 'me-procurement@cisco.com',
    phone: '+971-4-390-1000',
    contactPerson: 'Tariq Al-Mansoor',
    address: 'Dubai Internet City, Building 14',
    country: 'United Arab Emirates',
    city: 'Dubai',
    bankName: 'HSBC Middle East',
    bankIban: 'AE82HSBC0000001238471',
    creditLimit: 300000,
    rating: 4,
    performanceKPIs: {
      onTimeDeliveryRate: 96.2,
      averageLeadTimeDays: 14,
      qualityRating: 98.4,
      rejectionRate: 1.2,
      totalOrdersCompleted: 28,
      totalAmountProcured: 840000,
      lastEvaluatedAt: '2026-08-01T08:00:00.000Z'
    },
    status: 'ACTIVE',
    notes: 'Primary vendor for Core Switches and Enterprise Firewalls.',
    createdAt: '2026-02-15T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'ven-003',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'VEN-LOGI-03',
    name: 'Logitech Middle East FZCO',
    nameAr: 'لوجيتك الشرق الأوسط',
    taxNumber: '310928374100003',
    vendorCategoryId: 'vcat-001',
    vendorCategoryName: 'Hardware & Infrastructure Suppliers',
    paymentTermsId: 'pterm-001',
    paymentTermsName: 'Net 30 Days',
    incotermsId: 'inco-004',
    incotermsCode: 'DDP',
    purchasingOrgId: 'porg-002',
    purchasingOrgName: 'Cairo Branch Purchasing Org',
    currency: 'USD',
    email: 'b2b-me@logitech.com',
    phone: '+20-2-2790-1000',
    contactPerson: 'Khaled Hassan',
    address: 'Smart Village, Building B12',
    country: 'Egypt',
    city: 'Cairo',
    bankName: 'CIB Egypt',
    bankIban: 'EG29CIB001002003004005',
    creditLimit: 100000,
    rating: 4,
    performanceKPIs: {
      onTimeDeliveryRate: 94.0,
      averageLeadTimeDays: 7,
      qualityRating: 97.5,
      rejectionRate: 1.5,
      totalOrdersCompleted: 15,
      totalAmountProcured: 210000,
      lastEvaluatedAt: '2026-08-01T08:00:00.000Z'
    },
    status: 'ACTIVE',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z'
  }
];

export const INITIAL_VENDOR_PRICE_HISTORY: VendorPriceHistoryRecord[] = [
  {
    id: 'vph-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    vendorId: 'ven-001',
    vendorName: 'Dell Technologies Global',
    itemSku: 'HW-SRV-01',
    itemName: 'Enterprise Edge Server Blade Gen11',
    unitPrice: 18500,
    currency: 'USD',
    effectiveDate: '2026-01-15T00:00:00.000Z',
    sourceDocumentType: 'PO',
    sourceDocumentNumber: 'PO-2026-0001',
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'vph-002',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    vendorId: 'ven-002',
    vendorName: 'Cisco Systems Middle East',
    itemSku: 'NET-RTR-10G',
    itemName: '10Gbps High-Speed Optical Fiber Router',
    unitPrice: 12000,
    currency: 'USD',
    effectiveDate: '2026-02-01T00:00:00.000Z',
    sourceDocumentType: 'QUOTATION',
    sourceDocumentNumber: 'VQ-2026-0001',
    createdAt: '2026-02-01T08:00:00.000Z'
  }
];

export const INITIAL_PURCHASE_REQUISITIONS: PurchaseRequisition[] = [
  {
    id: 'pr-2026-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    prNumber: 'PR-2026-0001',
    requestedBy: 'usr-002',
    requestedByName: 'Mostafa Hassan',
    requesterName: 'Mostafa Hassan',
    departmentId: 'dept-02',
    departmentName: 'Finance & IT',
    costCenterId: 'cc-002',
    costCenterName: 'IT Infrastructure & Cloud',
    profitCenterId: 'pc-002',
    profitCenterName: 'Hardware & Infrastructure Distribution',
    projectId: 'prj-001',
    projectName: 'NEOM Smart Gate Deployment',
    supplierId: 'ven-001',
    supplierName: 'Dell Technologies Global',
    warehouseId: 'wh-001',
    warehouseName: 'Central Warehouse - Riyadh',
    purchasingOrgId: 'porg-001',
    buyerGroupId: 'bg-001',
    requisitionDate: '2026-08-05T09:00:00.000Z',
    requiredDate: '2026-08-25T00:00:00.000Z',
    priority: 'HIGH',
    purpose: 'Required for Q3 Data Center Capacity Expansion',
    status: 'APPROVED',
    totalEstimatedAmount: 185000,
    currency: 'USD',
    budgetStatus: 'WITHIN_BUDGET',
    budgetPolicy: 'WARNING',
    version: 1,
    correlationId: 'corr-init-pr-001',
    notes: 'Required for Q3 Data Center Capacity Expansion',
    lines: [
      {
        id: 'pr-item-001',
        requisitionId: 'pr-2026-001',
        prId: 'pr-2026-001',
        productId: 'prod-srv-01',
        itemSku: 'HW-SRV-01',
        itemName: 'Enterprise Rack Server PowerEdge R750',
        itemNameAr: 'خادم مؤسسي PowerEdge R750',
        requestedQuantity: 10,
        requestedQty: 10,
        requestedUOM: 'PCS',
        uom: 'PCS',
        baseQuantity: 10,
        baseUOM: 'PCS',
        uomConversionFactor: 1,
        estimatedUnitPrice: 18500,
        estimatedLineAmount: 185000,
        estimatedTotalPrice: 185000,
        warehouseId: 'wh-001',
        warehouseName: 'Central Warehouse - Riyadh',
        departmentId: 'dept-02',
        costCenterId: 'cc-002',
        profitCenterId: 'pc-002',
        projectId: 'prj-001',
        supplierId: 'ven-001',
        supplierName: 'Dell Technologies Global',
        requiredDate: '2026-08-25T00:00:00.000Z',
        status: 'OPEN'
      }
    ],
    items: [
      {
        id: 'pr-item-001',
        requisitionId: 'pr-2026-001',
        prId: 'pr-2026-001',
        productId: 'prod-srv-01',
        itemSku: 'HW-SRV-01',
        itemName: 'Enterprise Rack Server PowerEdge R750',
        itemNameAr: 'خادم مؤسسي PowerEdge R750',
        requestedQuantity: 10,
        requestedQty: 10,
        requestedUOM: 'PCS',
        uom: 'PCS',
        baseQuantity: 10,
        baseUOM: 'PCS',
        uomConversionFactor: 1,
        estimatedUnitPrice: 18500,
        estimatedLineAmount: 185000,
        estimatedTotalPrice: 185000,
        warehouseId: 'wh-001',
        warehouseName: 'Central Warehouse - Riyadh',
        departmentId: 'dept-02',
        costCenterId: 'cc-002',
        profitCenterId: 'pc-002',
        projectId: 'prj-001',
        supplierId: 'ven-001',
        supplierName: 'Dell Technologies Global',
        requiredDate: '2026-08-25T00:00:00.000Z',
        status: 'OPEN'
      }
    ],
    createdAt: '2026-08-05T09:00:00.000Z',
    updatedAt: '2026-08-06T10:00:00.000Z'
  }
];

export const INITIAL_RFQS: RequestForQuotation[] = [
  {
    id: 'rfq-2026-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    rfqNumber: 'RFQ-2026-0001',
    prId: 'pr-2026-001',
    prNumber: 'PR-2026-0001',
    title: 'RFQ - Enterprise Servers R750 for Q3 DC Expansion',
    departmentId: 'dept-01',
    departmentName: 'IT & Infrastructure',
    buyerId: 'usr-buyer-01',
    buyerName: 'Tariq Al-Mansoor',
    currency: 'SAR',
    issuedDate: '2026-08-06T11:00:00.000Z',
    closingDate: '2026-08-15T18:00:00.000Z',
    status: 'ISSUED',
    vendorIds: ['ven-001', 'ven-002'],
    items: [
      {
        id: 'rfq-item-001',
        rfqId: 'rfq-2026-001',
        prLineId: 'pr-item-001',
        prItemId: 'pr-item-001',
        productId: 'prod-001',
        itemSku: 'HW-SRV-01',
        itemName: 'Enterprise Rack Server PowerEdge R750',
        targetQuantity: 10,
        requestedQty: 10,
        targetUOM: 'PCS',
        uom: 'PCS',
        baseQuantity: 10,
        baseUOM: 'PCS',
        uomConversionFactor: 1,
        targetUnitPrice: 18500,
        targetDeliveryDate: '2026-08-25T00:00:00.000Z',
        specifications: 'Dual Xeon Gold, 256GB RAM, 4x 1.92TB NVMe, Dual Redundant PSU',
        status: 'OPEN',
        awardedQuantity: 0,
        remainingQuantity: 10
      }
    ],
    lines: [
      {
        id: 'rfq-item-001',
        rfqId: 'rfq-2026-001',
        prLineId: 'pr-item-001',
        prItemId: 'pr-item-001',
        productId: 'prod-001',
        itemSku: 'HW-SRV-01',
        itemName: 'Enterprise Rack Server PowerEdge R750',
        targetQuantity: 10,
        requestedQty: 10,
        targetUOM: 'PCS',
        uom: 'PCS',
        baseQuantity: 10,
        baseUOM: 'PCS',
        uomConversionFactor: 1,
        targetUnitPrice: 18500,
        targetDeliveryDate: '2026-08-25T00:00:00.000Z',
        specifications: 'Dual Xeon Gold, 256GB RAM, 4x 1.92TB NVMe, Dual Redundant PSU',
        status: 'OPEN',
        awardedQuantity: 0,
        remainingQuantity: 10
      }
    ],
    version: 1,
    createdAt: '2026-08-06T11:00:00.000Z',
    updatedAt: '2026-08-06T11:00:00.000Z'
  }
];

export const INITIAL_RFQ_INVITATIONS: RFQSupplierInvitation[] = [
  {
    id: 'inv-001',
    rfqId: 'rfq-2026-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    supplierId: 'ven-001',
    supplierCode: 'VEN-DELL-01',
    supplierName: 'Dell Technologies Global',
    supplierEmail: 'bids@dell.com',
    invitedAt: '2026-08-06T11:30:00.000Z',
    invitedBy: 'usr-buyer-01',
    invitedByName: 'Tariq Al-Mansoor',
    responseDeadline: '2026-08-15T18:00:00.000Z',
    invitationStatus: 'RESPONDED',
    respondedAt: '2026-08-08T10:00:00.000Z',
    quotationId: 'vq-2026-001'
  },
  {
    id: 'inv-002',
    rfqId: 'rfq-2026-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    supplierId: 'ven-002',
    supplierCode: 'VEN-HPE-01',
    supplierName: 'Hewlett Packard Enterprise KSA',
    supplierEmail: 'sales.ksa@hpe.com',
    invitedAt: '2026-08-06T11:30:00.000Z',
    invitedBy: 'usr-buyer-01',
    invitedByName: 'Tariq Al-Mansoor',
    responseDeadline: '2026-08-15T18:00:00.000Z',
    invitationStatus: 'INVITED'
  }
];

export const INITIAL_VENDOR_QUOTATIONS: VendorQuotation[] = [
  {
    id: 'vq-2026-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    quotationNumber: 'VQ-DELL-2026-01',
    internalQuotationNumber: 'SQ-2026-0001',
    rfqId: 'rfq-2026-001',
    rfqNumber: 'RFQ-2026-0001',
    supplierId: 'ven-001',
    vendorId: 'ven-001',
    supplierCode: 'VEN-DELL-01',
    supplierName: 'Dell Technologies Global',
    vendorName: 'Dell Technologies Global',
    quotationDate: '2026-08-08T10:00:00.000Z',
    validUntil: '2026-09-08T00:00:00.000Z',
    currency: 'USD',
    exchangeRate: 3.75,
    exchangeRateDate: '2026-08-08T10:00:00.000Z',
    paymentTermsId: 'pterm-001',
    paymentTermsName: 'Net 30 Days',
    incotermsId: 'inco-001',
    incotermsCode: 'FOB',
    deliveryLeadTimeDays: 14,
    subtotalAmount: 180000,
    discountAmount: 0,
    freightAmount: 0,
    taxAmount: 0,
    totalAmount: 180000,
    totalGrossAmount: 180000,
    totalGrossAmountBaseCurrency: 675000,
    status: 'SUBMITTED',
    overallScore: 95,
    items: [
      {
        id: 'vq-item-001',
        quotationId: 'vq-2026-001',
        rfqLineId: 'rfq-item-001',
        rfqItemId: 'rfq-item-001',
        productId: 'prod-001',
        itemSku: 'HW-SRV-01',
        itemName: 'Enterprise Rack Server PowerEdge R750',
        quotedQuantity: 10,
        offeredQty: 10,
        quotedUOM: 'PCS',
        uom: 'PCS',
        baseQuantity: 10,
        baseUOM: 'PCS',
        uomConversionFactor: 1,
        unitPrice: 18000,
        normalizedUnitPrice: 67500,
        discountPercent: 0,
        discountAmount: 0,
        taxRate: 0,
        taxAmount: 0,
        lineTotal: 180000,
        totalPrice: 180000,
        lineTotalBaseCurrency: 675000,
        deliveryLeadTimeDays: 14,
        promisedDeliveryDate: '2026-08-22T00:00:00.000Z',
        deliveryDate: '2026-08-22T00:00:00.000Z',
        technicalScore: 98,
        commercialScore: 92,
        overallScore: 95,
        complianceConfirmed: true,
        isAwarded: false,
        awardedQuantity: 0
      }
    ],
    revisionNumber: 1,
    version: 1,
    notes: 'Includes 3-Year ProSupport Plus and Onsite NBD Service.',
    createdAt: '2026-08-08T10:00:00.000Z'
  }
];

export const INITIAL_RFQ_AWARDS: RFQAward[] = [];

export const INITIAL_PROCUREMENT_PURCHASE_ORDERS: ProcurementPurchaseOrder[] = [
  {
    id: 'po-2026-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    poNumber: 'PO-2026-0001',
    vendorId: 'ven-001',
    vendorCode: 'VEN-DELL-01',
    vendorName: 'Dell Technologies Global',
    prId: 'pr-2026-001',
    prNumber: 'PR-2026-0001',
    rfqId: 'rfq-2026-001',
    rfqNumber: 'RFQ-2026-0001',
    purchasingOrgId: 'porg-001',
    buyerGroupId: 'bg-001',
    poDate: '2026-08-09T08:00:00.000Z',
    expectedDeliveryDate: '2026-08-23T00:00:00.000Z',
    paymentTermsId: 'pterm-001',
    paymentTermsName: 'Net 30 Days',
    incotermsId: 'inco-001',
    incotermsCode: 'FOB',
    currency: 'USD',
    exchangeRate: 1.0,
    subtotalAmount: 180000,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 180000,
    baseCurrencyTotal: 180000,
    status: 'ISSUED_TO_VENDOR',
    approvalStatus: 'APPROVED',
    approvalLevel: 2,
    version: 1,
    currentVersion: 1,
    amendmentCount: 0,
    createdBy: 'usr-001',
    createdByName: 'Ahmed Mounir',
    createdAt: '2026-08-09T08:00:00.000Z',
    updatedAt: '2026-08-09T09:30:00.000Z',
    items: [
      {
        id: 'po-item-001',
        poId: 'po-2026-001',
        itemSku: 'HW-SRV-01',
        itemName: 'Enterprise Rack Server PowerEdge R750',
        description: 'Rack Server with 3Yr ProSupport',
        warehouseId: 'wh-001',
        warehouseName: 'Main WareHouse Cairo',
        orderedQty: 10,
        receivedQty: 0,
        returnedQty: 0,
        openQty: 10,
        uom: 'PCS',
        unitPrice: 18000,
        taxRate: 0,
        taxAmount: 0,
        discountPercent: 0,
        discountAmount: 0,
        netUnitPrice: 18000,
        totalAmount: 180000,
        requiredDeliveryDate: '2026-08-23T00:00:00.000Z',
        status: 'OPEN'
      }
    ]
  }
];


export const INITIAL_PURCHASE_APPROVAL_RULES: PurchaseApprovalRule[] = [
  { id: 'appr-rule-01', tenantId: 'ten-001', companyId: 'comp-001', documentType: 'PR', minAmount: 0, maxAmount: 50000, requiredRoles: ['Purchasing Agent'], stepNumber: 1, isActive: true },
  { id: 'appr-rule-02', tenantId: 'ten-001', companyId: 'comp-001', documentType: 'PR', minAmount: 50000.01, maxAmount: 500000, requiredRoles: ['Finance Manager'], stepNumber: 2, isActive: true },
  { id: 'appr-rule-03', tenantId: 'ten-001', companyId: 'comp-001', documentType: 'PO', minAmount: 0, maxAmount: 25000, requiredRoles: ['Purchasing Agent'], stepNumber: 1, isActive: true },
  { id: 'appr-rule-04', tenantId: 'ten-001', companyId: 'comp-001', documentType: 'PO', minAmount: 25000.01, maxAmount: 250000, requiredRoles: ['Finance Manager'], stepNumber: 2, isActive: true },
  { id: 'appr-rule-05', tenantId: 'ten-001', companyId: 'comp-001', documentType: 'PO', minAmount: 250000.01, maxAmount: 10000000, requiredRoles: ['Super Admin', 'Finance Manager'], stepNumber: 3, isActive: true }
];

export const INITIAL_PURCHASE_AMENDMENTS: PurchaseOrderAmendment[] = [];

export const INITIAL_VENDOR_RETURNS: VendorReturnNote[] = [];

export const INITIAL_PURCHASE_AUDIT_LOGS: PurchaseAuditRecord[] = [
  {
    id: 'paudit-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    actionType: 'PO_CREATED',
    performedBy: 'usr-001',
    performedByName: 'Ahmed Mounir',
    performedAt: '2026-08-09T08:00:00.000Z',
    targetDocumentType: 'PO',
    targetDocumentId: 'po-2026-001',
    targetDocumentNumber: 'PO-2026-0001',
    details: 'Purchase Order PO-2026-0001 created for Dell Technologies Global (Total: $180,000)',
    previousState: 'Draft',
    newState: 'PendingApproval',
    immutableHash: 'HASH-PAUDIT-001-PO-CREATED'
  },
  {
    id: 'paudit-002',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    actionType: 'PO_APPROVED',
    performedBy: 'usr-001',
    performedByName: 'Ahmed Mounir',
    performedAt: '2026-08-09T09:30:00.000Z',
    targetDocumentType: 'PO',
    targetDocumentId: 'po-2026-001',
    targetDocumentNumber: 'PO-2026-0001',
    details: 'Purchase Order PO-2026-0001 approved by Finance Manager (Level 2)',
    previousState: 'PendingApproval',
    newState: 'IssuedToVendor',
    immutableHash: 'HASH-PAUDIT-002-PO-APPROVED'
  }
];

export const INITIAL_SUPPLIER_INVOICES: SupplierInvoice[] = [
  {
    id: 'sinv-2026-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    invoiceNumber: 'SINV-2026-0001',
    vendorInvoiceNumber: 'DELL-INV-88901',
    vendorId: 'ven-001',
    vendorCode: 'VEND-0001',
    vendorName: 'Dell Technologies Global',
    poId: 'po-2026-001',
    poNumber: 'PO-2026-0001',
    grnId: 'grn-2026-001',
    grnNumber: 'GRN-2026-0001',
    invoiceDate: '2026-08-10',
    postingDate: '2026-08-10',
    dueDate: '2026-09-09',
    paymentTermsName: 'Net 30 Days',
    currency: 'USD',
    exchangeRate: 1.0,
    netAmount: 185000,
    taxAmount: 0,
    grossAmount: 185000,
    discountAmount: 0,
    taxRegistrationNumber: 'US310984728',
    status: 'MATCHED',
    threeWayMatchStatus: 'MATCHED',
    matchingDetails: {
      poNumber: 'PO-2026-0001',
      grnNumber: 'GRN-2026-0001',
      poTotalAmount: 185000,
      grnTotalAmount: 185000,
      invoiceTotalAmount: 185000,
      priceVariance: 0,
      quantityVariance: 0,
      amountVariance: 0,
      isWithinTolerance: true,
      matchedAt: '2026-08-10T10:00:00.000Z',
      discrepancies: []
    },
    items: [
      {
        id: 'sinv-item-001',
        invoiceId: 'sinv-2026-001',
        poItemId: 'po-item-001',
        itemSku: 'HW-SRV-01',
        itemName: 'Enterprise Edge Server Blade Gen11',
        description: 'Rack Server with 3Yr ProSupport',
        billedQty: 10,
        unitPrice: 18500,
        taxRate: 0,
        taxAmount: 0,
        lineTotal: 185000,
        poUnitPrice: 18500,
        receivedQty: 10
      }
    ],
    approvedBy: 'usr-001',
    approvedAt: '2026-08-10T10:00:00.000Z',
    createdAt: '2026-08-10T09:00:00.000Z',
    updatedAt: '2026-08-10T10:00:00.000Z'
  }
];

export const INITIAL_AP_VOUCHERS: APVoucher[] = [
  {
    id: 'apv-2026-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    voucherNumber: 'APV-SINV-2026-0001',
    supplierInvoiceId: 'sinv-2026-001',
    supplierInvoiceNumber: 'SINV-2026-0001',
    vendorInvoiceNumber: 'DELL-INV-88901',
    vendorId: 'ven-001',
    vendorCode: 'VEND-0001',
    vendorName: 'Dell Technologies Global',
    voucherDate: '2026-08-10',
    dueDate: '2026-09-09',
    currency: 'USD',
    grossAmount: 185000,
    netAmount: 185000,
    paidAmount: 0,
    remainingAmount: 185000,
    earlyDiscountDeadline: '2026-08-20',
    earlyDiscountPercent: 2.0,
    earlyDiscountAmount: 3700,
    status: 'UNPAID',
    createdAt: '2026-08-10T10:00:00.000Z'
  }
];

export const INITIAL_SUPPLIER_CREDIT_NOTES: SupplierCreditNote[] = [];

export const INITIAL_PAYMENT_PROPOSALS: PaymentProposal[] = [];

export const INITIAL_PAYMENT_BATCHES: PaymentBatch[] = [];

export const INITIAL_AP_AUDIT_LOGS: APAuditRecord[] = [
  {
    id: 'apaudit-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    actionType: 'PROCESS_SUPPLIER_INVOICE_3WAY_MATCH',
    performedBy: 'usr-001',
    performedByName: 'Ahmed Mounir',
    performedAt: '2026-08-10T10:00:00.000Z',
    targetDocumentType: 'SupplierInvoice',
    targetDocumentId: 'sinv-2026-001',
    targetDocumentNumber: 'SINV-2026-0001',
    details: '3-Way Match executed with status MATCHED for Dell Technologies Global (Gross Amount: $185,000)',
    immutableHash: 'AP-HASH-SINV-001-MATCHED'
  }
];

export const INITIAL_GOODS_RECEIPT_NOTES: GoodsReceiptNote[] = [
  {
    id: 'grn-2026-001',
    grnNumber: 'GRN-2026-0051-0001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    warehouseId: 'wh-001',
    warehouseName: 'Riyadh Central Distribution Center',
    vendorId: 'ven-001',
    vendorName: 'Dell Technologies Global',
    poId: 'po-001',
    poNumber: 'PO-2026-0051',
    receivedAt: '2026-08-11T10:00:00.000Z',
    receivedBy: 'usr-001',
    receivedByName: 'Ahmed Mounir',
    status: 'POSTED',
    qualityStatus: 'APPROVED',
    items: [
      {
        id: 'grn-item-001',
        grnId: 'grn-2026-001',
        poId: 'po-001',
        poItemId: 'poi-1',
        itemSku: 'HW-SRV-01',
        itemName: 'Enterprise Edge Server Blade Gen11',
        productId: 'prod-001',
        requestedUOM: 'PCS',
        receivedUOM: 'PCS',
        receivedQty: 10,
        baseQuantity: 10,
        baseUOM: 'PCS',
        uomConversionFactor: 1.0,
        unitCost: 18500,
        totalCost: 185000,
        warehouseId: 'wh-001',
        warehouseName: 'Riyadh Central Distribution Center',
        locationId: 'bin-02',
        binId: 'bin-02',
        binCode: 'BIN-BLK-A1',
        batchNumber: 'BATCH-2026-08A',
        lotNumber: 'LOT-DELL-998',
        serialNumbers: ['SRV-DELL-99001', 'SRV-DELL-99002'],
        expiryDate: '2029-01-15',
        qualityStatus: 'APPROVED',
        acceptedQty: 10,
        rejectedQty: 0,
        quarantinedQty: 0,
        landedCostAllocated: 1500,
        capitalizedUnitCost: 18650,
        capitalizedTotalCost: 186500,
        status: 'ACCEPTED',
        version: 1
      }
    ],
    totalReceivedQuantity: 10,
    totalReceivedAmount: 185000,
    landedCosts: [
      {
        id: 'lc-001',
        componentType: 'FREIGHT',
        description: 'International Air Freight & Handling',
        amount: 1500,
        currency: 'USD',
        allocationBasis: 'BY_VALUE'
      }
    ],
    landedCostTotal: 1500,
    capitalizedGrandTotal: 186500,
    currency: 'USD',
    exchangeRate: 3.75,
    baseCurrencyTotal: 693750,
    financialEventId: 'FE-GRN-2026-0051-0001',
    journalEntryId: 'je-auto-1001',
    inventoryMovementReference: 'STOCK-REC-2026-001',
    notes: 'Primary shipment received in excellent condition at Riyadh Central CDC.',
    version: 1,
    digitalSignature: 'SIG-SHA256-4FA899B1-2026-08-11',
    correlationId: 'CORR-GRN-2026-001-1001',
    sourceDocumentType: 'GoodsReceiptNote',
    sourceDocumentId: 'grn-2026-001',
    createdAt: '2026-08-11T10:00:00.000Z',
    updatedAt: '2026-08-11T10:00:02.000Z'
  }
];







