/**
 * AM Business Platform - API Client Service
 * Bridges React UI components to Express REST endpoints
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
  CostLayer,
  CostLayerConsumption,
  CostCalculationLog,
  CostBusinessEvent,
  CostingMethod,
  CountryMaster,
  TaxSystemMaster,
  StateProvinceMaster,
  CityMaster,
  TimezoneMaster,
  LanguageMaster,
  FiscalCalendarMaster,
  StockLedgerEntry,
  InventoryMovementTypeConfig,
  InventoryFinancialQueueItem,
  PostingProfile,
  JournalTemplate,
  InventoryFinancialEventPayload,
  InventoryPeriod,
  FiscalInventoryLock,
  FiscalLockLevel,
  FiscalLockStatus,
  InventoryCountSession,
  CountSheetItem,
  CountSessionStatus,
  InventoryReconciliationProposal,
  InventoryHealthMetrics,
  InventoryIntegrityReport,
  InventoryCertificationReport,
  InventoryClosingAuditRecord,
  TenantBranding,
  BrandingPublicMetadata,
  BrandingValidationResult,
  TenantAssetMetadata,
  AMPlatformIdentity
} from '../types';


export class ApiClient {
  private static token: string | null = null;

  public static setToken(token: string | null): void {
    this.token = token;
  }

  public static getToken(): string | null {
    return this.token;
  }

  private static async request<T>(endpoint: string, options?: RequestInit, retryCount = 0): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options?.headers as Record<string, string>) || {}),
    };

    if (this.token && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(`/api/v1${endpoint}`, {
        ...options,
        headers,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      return res.json();
    } catch (err: any) {
      // Retry once on transient network disconnects / cold server boot
      const isGet = !options?.method || options.method.toUpperCase() === 'GET';
      if (retryCount < 2 && isGet && (err.name === 'TypeError' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError'))) {
        await new Promise(r => setTimeout(r, 400 * Math.pow(2, retryCount)));
        return this.request<T>(endpoint, options, retryCount + 1);
      }
      throw err;
    }
  }

  // Auth & System Context
  static async getOnboardingWizardState(companyId: string, tenantId: string): Promise<{
    success: boolean;
    wizardState: {
      totalSteps: number;
      currentStep: number;
      isCompleted: boolean;
      activeProfile?: any;
      steps: any[];
      wizardData?: Record<string, any>;
    };
    readiness?: any;
  }> {
    return this.request<{
      success: boolean;
      wizardState: {
        totalSteps: number;
        currentStep: number;
        isCompleted: boolean;
        activeProfile?: any;
        steps: any[];
        wizardData?: Record<string, any>;
      };
      readiness?: any;
    }>(`/onboarding/wizard/state?companyId=${encodeURIComponent(companyId)}&tenantId=${encodeURIComponent(tenantId)}`);
  }

  static async getAuthMe(): Promise<{ user: User; tenant: Tenant; company: Company; token?: string }> {
    const data = await this.request<{ user: User; tenant: Tenant; company: Company; token?: string }>('/auth/me');
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  static async login(email: string, password: string): Promise<{ success: boolean; user: User; token: string }> {
    const res = await this.request<{ success: boolean; user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  static async verifyPin(userId: string, pin: string): Promise<{ success: boolean; authorized: boolean; cashier: User; token: string }> {
    const res = await this.request<{ success: boolean; authorized: boolean; cashier: User; token: string }>('/auth/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ userId, pin }),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ userId, currentPassword, newPassword }),
    });
  }

  static async changePin(userId: string, currentPin: string, newPin: string): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/change-pin', {
      method: 'POST',
      body: JSON.stringify({ userId, currentPin, newPin }),
    });
  }

  static async getTenants(): Promise<Tenant[]> {
    return this.request('/tenants');
  }

  static async getCompanies(): Promise<Company[]> {
    return this.request('/companies');
  }

  static async createCompany(data: Partial<Company>): Promise<Company> {
    return this.request('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
    return this.request(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Master Localization Services
  static async getCountriesMaster(): Promise<CountryMaster[]> {
    return this.request('/master/countries');
  }

  static async getTaxSystemsMaster(): Promise<TaxSystemMaster[]> {
    return this.request('/master/tax-systems');
  }

  static async getStatesMaster(countryCode?: string): Promise<StateProvinceMaster[]> {
    return this.request(countryCode ? `/master/states?countryCode=${countryCode}` : '/master/states');
  }

  static async getCitiesMaster(countryCode?: string): Promise<CityMaster[]> {
    return this.request(countryCode ? `/master/cities?countryCode=${countryCode}` : '/master/cities');
  }

  static async getTimezonesMaster(): Promise<TimezoneMaster[]> {
    return this.request('/master/timezones');
  }

  static async getLanguagesMaster(): Promise<LanguageMaster[]> {
    return this.request('/master/languages');
  }

  static async getFiscalCalendarsMaster(): Promise<FiscalCalendarMaster[]> {
    return this.request('/master/fiscal-calendars');
  }

  // Master Data Services
  static async getBranches(): Promise<Branch[]> {
    return this.request('/master/branches');
  }

  static async getDepartments(): Promise<Department[]> {
    return this.request('/master/departments');
  }

  static async getCostCenters(): Promise<CostCenter[]> {
    return this.request('/master/cost-centers');
  }

  static async getProfitCenters(): Promise<ProfitCenter[]> {
    return this.request('/master/profit-centers');
  }

  static async getProjects(): Promise<Project[]> {
    return this.request('/master/projects');
  }

  static async getCurrencies(): Promise<Currency[]> {
    return this.request('/master/currencies');
  }

  static async getExchangeRates(): Promise<ExchangeRate[]> {
    return this.request('/master/exchange-rates');
  }

  static async getFiscalYears(): Promise<FiscalYear[]> {
    return this.request('/master/fiscal-years');
  }

  static async getTaxRules(): Promise<TaxRule[]> {
    return this.request('/master/tax-rules');
  }

  static async getUnitsOfMeasure(): Promise<UnitOfMeasure[]> {
    return this.request('/master/units-of-measure');
  }

  static async getItemCategories(): Promise<ItemCategory[]> {
    return this.request('/master/item-categories');
  }

  static async getPaymentTerms(): Promise<PaymentTerm[]> {
    return this.request('/master/payment-terms');
  }

  static async getWarehouses(): Promise<Warehouse[]> {
    return this.request('/warehouses');
  }

  static async getUsers(): Promise<User[]> {
    return this.request('/users');
  }

  // Posting Rules & Event-Driven Financial Engine
  static async getPostingRules(): Promise<PostingRule[]> {
    return this.request('/master/posting-rules');
  }

  static async createPostingRule(rule: Partial<PostingRule>): Promise<PostingRule> {
    return this.request('/master/posting-rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  static async updatePostingRule(id: string, rule: Partial<PostingRule>): Promise<PostingRule> {
    return this.request(`/master/posting-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule),
    });
  }

  static async getFinancialEvents(): Promise<FinancialEvent[]> {
    return this.request('/financial-events');
  }

  static async publishFinancialEvent(eventData: any): Promise<any> {
    return this.request('/financial-events/publish', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  static async getAccountingDimensions(): Promise<any> {
    return this.request('/dimensions');
  }

  static async getDocumentRelationships(): Promise<any[]> {
    return this.request('/relationships');
  }

  static async createDocumentRelationship(relData: any): Promise<any> {
    return this.request('/relationships', {
      method: 'POST',
      body: JSON.stringify(relData),
    });
  }

  static async getDocumentLineage(docId: string): Promise<any> {
    return this.request(`/relationships/lineage/${docId}`);
  }

  static async calculateTaxes(taxParams: any): Promise<any> {
    return this.request('/taxes/calculate', {
      method: 'POST',
      body: JSON.stringify(taxParams),
    });
  }

  static async convertCurrency(amount: number, from: string, to: string): Promise<any> {
    return this.request(`/currencies/convert?amount=${amount}&from=${from}&to=${to}`);
  }

  static async revalueCurrencies(): Promise<any> {
    return this.request('/currencies/revalue', { method: 'POST' });
  }

  static async calculateIssueCost(sku: string, quantity: number): Promise<any> {
    return this.request('/inventory/costing/issue', {
      method: 'POST',
      body: JSON.stringify({ sku, quantity }),
    });
  }

  // Normalized Accounting Reports Engine SDK
  static async getTrialBalance(): Promise<any> {
    return this.request('/reports/trial-balance');
  }

  static async getBalanceSheet(): Promise<any> {
    return this.request('/reports/balance-sheet');
  }

  static async getIncomeStatement(): Promise<any> {
    return this.request('/reports/income-statement');
  }

  static async getAgedReceivables(): Promise<any> {
    return this.request('/reports/aged-receivables');
  }

  static async getAgedPayables(): Promise<any> {
    return this.request('/reports/aged-payables');
  }

  static async getInventoryValuationReport(): Promise<any> {
    return this.request('/reports/inventory-valuation');
  }

  // Background Processing Jobs Engine SDK
  static async getBackgroundJobs(): Promise<any[]> {
    return this.request('/jobs');
  }

  static async enqueueBackgroundJob(jobType: string, title: string, payload?: any): Promise<any> {
    return this.request('/jobs/enqueue', {
      method: 'POST',
      body: JSON.stringify({ jobType, title, payload }),
    });
  }

  // ==================== PHASE 3 ENTERPRISE ENGINES SDK ====================

  // 1. Business Rules Engine
  static async getBusinessRules(): Promise<any[]> {
    return this.request('/business-rules');
  }

  static async evaluateBusinessRules(context: any): Promise<any[]> {
    return this.request('/business-rules/evaluate', {
      method: 'POST',
      body: JSON.stringify(context),
    });
  }

  // 2. Master Data Framework
  static async getMasterDataFramework(): Promise<any> {
    return this.request('/master-data/framework');
  }

  // 3. Pricing Engine
  static async getPriceLists(): Promise<any[]> {
    return this.request('/pricing/price-lists');
  }

  static async calculatePricing(params: any): Promise<any> {
    return this.request('/pricing/calculate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // 4. Notification Engine
  static async getNotifications(userId: string = 'usr-001'): Promise<any[]> {
    return this.request(`/notifications?userId=${userId}`);
  }

  static async sendNotification(title: string, message: string, channel: string = 'In-App', entityType?: string, entityId?: string): Promise<any> {
    return this.request('/notifications/send', {
      method: 'POST',
      body: JSON.stringify({ title, message, channel, entityType, entityId }),
    });
  }

  static async markNotificationRead(id: string): Promise<any> {
    return this.request(`/notifications/${id}/read`, { method: 'POST' });
  }

  // 5. Attachment Engine
  static async getAttachments(entityType: string, entityId: string): Promise<any[]> {
    return this.request(`/attachments/${entityType}/${entityId}`);
  }

  static async uploadAttachment(data: any): Promise<any> {
    return this.request('/attachments/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 6. Comment & Activity Timeline Engine
  static async getComments(entityType: string, entityId: string): Promise<any[]> {
    return this.request(`/comments/${entityType}/${entityId}`);
  }

  static async addComment(data: any): Promise<any> {
    return this.request('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getActivityLogs(entityType: string, entityId: string): Promise<any[]> {
    return this.request(`/activity-logs/${entityType}/${entityId}`);
  }

  // 7. Global Enterprise Search
  static async globalSearch(query: string): Promise<any[]> {
    return this.request(`/search/global?q=${encodeURIComponent(query)}`);
  }

  // 8. Business Validation Engine
  static async validateDocument(documentType: string, documentData: any): Promise<any> {
    return this.request('/validation/check', {
      method: 'POST',
      body: JSON.stringify({ documentType, documentData }),
    });
  }

  // ==================== PHASE 4 ENTERPRISE CONFIGURATION ENGINE SDK ====================

  static async getConfigValues(): Promise<any[]> {
    return this.request('/config/values');
  }

  static async getEffectiveConfig(scopeAndCategory: {
    tenantId?: string;
    companyId?: string;
    branchId?: string;
    warehouseId?: string;
    departmentId?: string;
    userId?: string;
    category?: 'GENERAL' | 'FINANCIAL' | 'INVENTORY' | 'SALES' | 'PURCHASING' | 'SECURITY' | 'ALL';
  }): Promise<any> {
    return this.request('/config/effective', {
      method: 'POST',
      body: JSON.stringify(scopeAndCategory),
    });
  }

  static async setConfigValue(data: {
    key: string;
    value: any;
    scopeLevel?: string;
    scopeId?: string;
    category?: string;
    dataType?: string;
    description?: string;
  }): Promise<any> {
    return this.request('/config/set', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getFeatureFlags(edition?: string): Promise<{ currentEdition: string; featureFlags: any[] }> {
    const query = edition ? `?edition=${edition}` : '';
    return this.request(`/features${query}`);
  }

  static async setProductEdition(edition: 'Community' | 'Professional' | 'Enterprise'): Promise<any> {
    return this.request('/features/edition', {
      method: 'POST',
      body: JSON.stringify({ edition }),
    });
  }

  static async getLocalizationPacks(): Promise<any[]> {
    return this.request('/localization/packs');
  }

  static async getLocalizationPack(code: string): Promise<any> {
    return this.request(`/localization/packs/${code}`);
  }

  // Document Numbering
  static async getNumberingRules(): Promise<DocumentNumberingRule[]> {
    return this.request('/numbering/rules');
  }

  static async updateNumberingRule(id: string, rule: Partial<DocumentNumberingRule>): Promise<DocumentNumberingRule> {
    return this.request(`/numbering/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule),
    });
  }

  // Workflows & Approvals
  static async getWorkflowRules(): Promise<WorkflowRule[]> {
    return this.request('/workflows/rules');
  }

  static async getApprovalRequests(): Promise<ApprovalRequest[]> {
    return this.request('/workflows/approvals');
  }

  static async handleApprovalAction(id: string, action: 'APPROVE' | 'REJECT', comments?: string): Promise<any> {
    return this.request(`/workflows/approvals/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, comments }),
    });
  }

  // Audit Trail
  static async getAuditLogs(): Promise<AuditLog[]> {
    return this.request('/audit/logs');
  }

  // Accounting
  static async getChartOfAccounts(): Promise<Account[]> {
    return this.request('/accounting/coa');
  }

  static async createAccount(account: Partial<Account>): Promise<Account> {
    return this.request('/accounting/coa', {
      method: 'POST',
      body: JSON.stringify(account),
    });
  }

  static async getJournalEntries(): Promise<JournalEntry[]> {
    return this.request('/accounting/journals');
  }

  static async createJournalEntry(entry: Partial<JournalEntry>): Promise<JournalEntry> {
    return this.request('/accounting/journals', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  // Inventory Foundation
  static async getInventoryItems(): Promise<InventoryItem[]> {
    return this.request('/inventory/items');
  }

  static async createInventoryItem(item: Partial<InventoryItem>): Promise<InventoryItem> {
    return this.request('/inventory/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  static async updateInventoryItem(id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    return this.request(`/inventory/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  static async deleteInventoryItem(id: string): Promise<any> {
    return this.request(`/inventory/items/${id}`, {
      method: 'DELETE',
    });
  }

  static async getBrands(): Promise<any[]> {
    return this.request('/inventory/brands');
  }

  static async createBrand(brand: any): Promise<any> {
    return this.request('/inventory/brands', {
      method: 'POST',
      body: JSON.stringify(brand),
    });
  }

  static async getModels(): Promise<any[]> {
    return this.request('/inventory/models');
  }

  static async createModel(model: any): Promise<any> {
    return this.request('/inventory/models', {
      method: 'POST',
      body: JSON.stringify(model),
    });
  }

  static async getItemGroups(): Promise<any[]> {
    return this.request('/inventory/item-groups');
  }

  static async createItemGroup(group: any): Promise<any> {
    return this.request('/inventory/item-groups', {
      method: 'POST',
      body: JSON.stringify(group),
    });
  }

  static async getUomConversions(): Promise<any[]> {
    return this.request('/inventory/uom-conversions');
  }

  static async createUomConversion(conv: any): Promise<any> {
    return this.request('/inventory/uom-conversions', {
      method: 'POST',
      body: JSON.stringify(conv),
    });
  }

  static async getPackagingUnits(): Promise<any[]> {
    return this.request('/inventory/packaging-units');
  }

  static async createPackagingUnit(pkg: any): Promise<any> {
    return this.request('/inventory/packaging-units', {
      method: 'POST',
      body: JSON.stringify(pkg),
    });
  }

  static async getWarehouseZones(): Promise<any[]> {
    return this.request('/inventory/warehouse-zones');
  }

  static async createWarehouseZone(zone: any): Promise<any> {
    return this.request('/inventory/warehouse-zones', {
      method: 'POST',
      body: JSON.stringify(zone),
    });
  }

  static async getBinLocations(): Promise<any[]> {
    return this.request('/inventory/bin-locations');
  }

  static async createBinLocation(bin: any): Promise<any> {
    return this.request('/inventory/bin-locations', {
      method: 'POST',
      body: JSON.stringify(bin),
    });
  }

  static async getBatchLots(): Promise<any[]> {
    return this.request('/inventory/batch-lots');
  }

  static async createBatchLot(batch: any): Promise<any> {
    return this.request('/inventory/batch-lots', {
      method: 'POST',
      body: JSON.stringify(batch),
    });
  }

  static async getSerialNumbers(): Promise<any[]> {
    return this.request('/inventory/serial-numbers');
  }

  static async createSerialNumber(sn: any): Promise<any> {
    return this.request('/inventory/serial-numbers', {
      method: 'POST',
      body: JSON.stringify(sn),
    });
  }

  static async getStockQuants(): Promise<any[]> {
    return this.request('/inventory/quants');
  }

  static async updateStockQuant(id: string, quantData: any): Promise<any> {
    return this.request(`/inventory/quants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(quantData),
    });
  }

  static async getInventoryConfig(): Promise<any> {
    return this.request('/inventory/config');
  }

  static async updateInventoryConfig(configData: any): Promise<any> {
    return this.request('/inventory/config', {
      method: 'PUT',
      body: JSON.stringify(configData),
    });
  }

  static async generateSkuAndBarcode(params: { categoryCode?: string; brandCode?: string; modelCode?: string }): Promise<{ sku: string; barcode: string }> {
    return this.request('/inventory/sku-barcode-gen', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async getStockMovements(): Promise<StockMovement[]> {
    return this.request('/inventory/movements');
  }

  static async createStockMovement(movement: any): Promise<any> {
    return this.request('/inventory/movements', {
      method: 'POST',
      body: JSON.stringify(movement),
    });
  }

  // Phase 2.2.1 Execution Engine Methods
  static async getStockLedger(): Promise<StockLedgerEntry[]> {
    return this.request('/inventory/ledger');
  }

  static async getMovementTypeConfigs(): Promise<InventoryMovementTypeConfig[]> {
    return this.request('/inventory/movement-types');
  }

  static async executeGoodsReceipt(grnData: any): Promise<any> {
    return this.request('/inventory/goods-receipt', {
      method: 'POST',
      body: JSON.stringify(grnData),
    });
  }

  static async executeGoodsIssue(ginData: any): Promise<any> {
    return this.request('/inventory/goods-issue', {
      method: 'POST',
      body: JSON.stringify(ginData),
    });
  }

  static async executeInventoryMovement(movementData: any): Promise<any> {
    return this.request('/inventory/execution-movement', {
      method: 'POST',
      body: JSON.stringify(movementData),
    });
  }

  // Sales
  static async getCustomers(): Promise<Customer[]> {
    return this.request('/sales/customers');
  }

  static async getSalesInvoices(): Promise<SalesInvoice[]> {
    return this.request('/sales/invoices');
  }

  static async createSalesInvoice(invoiceData: any): Promise<SalesInvoice> {
    return this.request('/sales/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  static async getCustomerPayments(): Promise<CustomerPayment[]> {
    return this.request('/sales/payments');
  }

  static async createCustomerPayment(paymentData: any): Promise<CustomerPayment> {
    return this.request('/sales/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // Purchasing
  static async getVendors(): Promise<Vendor[]> {
    return this.request('/purchasing/vendors');
  }

  static async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return this.request('/purchasing/orders');
  }

  static async getPurchaseInvoices(): Promise<PurchaseInvoice[]> {
    return this.request('/purchasing/invoices');
  }

  // CRM & HR
  static async getLeads(): Promise<Lead[]> {
    return this.request('/crm/leads');
  }

  static async updateLeadStage(id: string, stage: string): Promise<Lead> {
    return this.request(`/crm/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    });
  }

  static async getEmployees(): Promise<Employee[]> {
    return this.request('/hr/employees');
  }

  // AI Copilot
  static async askAiAssistant(prompt: string, lang: 'ar' | 'en'): Promise<{ reply: string; insights?: string[] }> {
    return this.request('/ai/assistant', {
      method: 'POST',
      body: JSON.stringify({ prompt, lang }),
    });
  }

  static async askCopilot(prompt: string, lang: 'ar' | 'en'): Promise<{ reply: string; insights?: string[] }> {
    return this.askAiAssistant(prompt, lang);
  }

  static async getAnomalies(): Promise<any[]> {
    return this.request('/ai/anomalies');
  }

  // ==================== PHASE 2.2.3 COSTING ENGINE SDK ====================
  static async getCostLayers(params?: { itemSku?: string; warehouseId?: string; status?: string }): Promise<CostLayer[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/inventory/costing/layers${query ? `?${query}` : ''}`);
  }

  static async getCostLayerConsumptions(params?: { itemSku?: string; costLayerId?: string }): Promise<CostLayerConsumption[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/inventory/costing/consumptions${query ? `?${query}` : ''}`);
  }

  static async getCostCalculationLogs(): Promise<CostCalculationLog[]> {
    return this.request('/inventory/costing/logs');
  }

  static async getCostBusinessEvents(): Promise<CostBusinessEvent[]> {
    return this.request('/inventory/costing/events');
  }

  static async getCategoryCostingConfigs(): Promise<ItemCategory[]> {
    return this.request('/inventory/costing/categories');
  }

  static async updateCategoryCostingConfig(categoryId: string, configData: { defaultCostingMethod?: CostingMethod; allowItemOverride?: boolean }): Promise<ItemCategory> {
    return this.request(`/inventory/costing/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(configData),
    });
  }

  static async processReceiptValuation(receiptData: any): Promise<any> {
    return this.request('/inventory/costing/process-receipt', {
      method: 'POST',
      body: JSON.stringify(receiptData),
    });
  }

  static async processIssueValuation(issueData: any): Promise<any> {
    return this.request('/inventory/costing/process-issue', {
      method: 'POST',
      body: JSON.stringify(issueData),
    });
  }

  // ==================== PHASE 2.2.4 INVENTORY FINANCIAL INTEGRATION SDK ====================
  static async getFinancialIntegrationEvents(): Promise<any> {
    return this.request('/financial-integration/events');
  }

  static async getFinancialQueue(): Promise<InventoryFinancialQueueItem[]> {
    return this.request('/financial-integration/queue');
  }

  static async getPostingProfiles(): Promise<PostingProfile[]> {
    return this.request('/financial-integration/posting-profiles');
  }

  static async createPostingProfile(profileData: Partial<PostingProfile>): Promise<PostingProfile> {
    return this.request('/financial-integration/posting-profiles', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
  }

  static async updatePostingProfile(id: string, profileData: Partial<PostingProfile>): Promise<PostingProfile> {
    return this.request(`/financial-integration/posting-profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  static async getJournalTemplates(): Promise<JournalTemplate[]> {
    return this.request('/financial-integration/journal-templates');
  }

  static async createJournalTemplate(templateData: Partial<JournalTemplate>): Promise<JournalTemplate> {
    return this.request('/financial-integration/journal-templates', {
      method: 'POST',
      body: JSON.stringify(templateData)
    });
  }

  static async updateJournalTemplate(id: string, templateData: Partial<JournalTemplate>): Promise<JournalTemplate> {
    return this.request(`/financial-integration/journal-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(templateData)
    });
  }

  static async processFinancialIntegrationEvent(payload: Partial<InventoryFinancialEventPayload>): Promise<any> {
    return this.request('/financial-integration/process-event', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async retryFinancialQueueItem(queueItemId: string): Promise<any> {
    return this.request(`/financial-integration/queue/${queueItemId}/retry`, {
      method: 'POST'
    });
  }

  static async getFinancialIntegrationHistory(): Promise<any> {
    return this.request('/financial-integration/history');
  }

  // ==================== PHASE 2.2.5 INVENTORY CLOSING & CONTROL API METHODS ====================

  static async getInventoryPeriods(): Promise<InventoryPeriod[]> {
    return this.request('/inventory/periods');
  }

  static async createInventoryPeriod(periodData: Partial<InventoryPeriod>): Promise<InventoryPeriod> {
    return this.request('/inventory/periods', {
      method: 'POST',
      body: JSON.stringify(periodData)
    });
  }

  static async closeInventoryPeriod(id: string, userId?: string): Promise<InventoryPeriod> {
    return this.request(`/inventory/periods/${id}/close`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  static async reopenInventoryPeriod(id: string, userId?: string, reason?: string): Promise<InventoryPeriod> {
    return this.request(`/inventory/periods/${id}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ userId, reason })
    });
  }

  static async getFiscalLocks(): Promise<FiscalInventoryLock[]> {
    return this.request('/inventory/fiscal-locks');
  }

  static async toggleFiscalLock(data: {
    targetLevel: FiscalLockLevel;
    targetId: string;
    targetName: string;
    status: FiscalLockStatus;
    userId?: string;
    reason?: string;
  }): Promise<FiscalInventoryLock> {
    return this.request('/inventory/fiscal-locks/toggle', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getCountSessions(): Promise<InventoryCountSession[]> {
    return this.request('/inventory/count-sessions');
  }

  static async createCountSession(data: {
    warehouseId: string;
    title?: string;
    isBlindCount?: boolean;
    createdBy?: string;
  }): Promise<InventoryCountSession> {
    return this.request('/inventory/count-sessions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateCountSessionItems(id: string, items: CountSheetItem[], status?: CountSessionStatus): Promise<InventoryCountSession> {
    return this.request(`/inventory/count-sessions/${id}/items`, {
      method: 'PUT',
      body: JSON.stringify({ items, status })
    });
  }

  static async approveCountSession(id: string, approvedBy?: string): Promise<InventoryCountSession> {
    return this.request(`/inventory/count-sessions/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvedBy })
    });
  }

  static async getReconciliationProposals(): Promise<InventoryReconciliationProposal[]> {
    return this.request('/inventory/reconciliation-proposals');
  }

  static async postReconciliationProposal(id: string, approvedBy?: string): Promise<{ proposal: InventoryReconciliationProposal; queueItem: any }> {
    return this.request(`/inventory/reconciliation-proposals/${id}/post`, {
      method: 'POST',
      body: JSON.stringify({ approvedBy })
    });
  }

  static async getInventoryHealthMetrics(): Promise<InventoryHealthMetrics> {
    return this.request('/inventory/health-metrics');
  }

  static async runInventoryIntegrityCheck(): Promise<InventoryIntegrityReport> {
    return this.request('/inventory/integrity-check');
  }

  static async getInventoryCertificationReport(): Promise<InventoryCertificationReport> {
    return this.request('/inventory/certification-report');
  }

  static async getInventoryClosingAudit(): Promise<InventoryClosingAuditRecord[]> {
    return this.request('/inventory/closing-audit');
  }

  // ==================== PHASE 2.3 PROCUREMENT & PURCHASING DOMAIN ====================

  static async getProcurementVendors(): Promise<any[]> {
    return this.request('/procurement/vendors');
  }

  static async createVendor(data: any): Promise<any> {
    return this.request('/procurement/vendors', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getVendorCategories(): Promise<any[]> {
    return this.request('/procurement/vendor-categories');
  }

  static async getProcurementPaymentTerms(): Promise<any[]> {
    return this.request('/procurement/payment-terms');
  }

  static async getIncoterms(): Promise<any[]> {
    return this.request('/procurement/incoterms');
  }

  static async getBuyerGroups(): Promise<any[]> {
    return this.request('/procurement/buyer-groups');
  }

  static async getPurchasingOrganizations(): Promise<any[]> {
    return this.request('/procurement/purchasing-organizations');
  }

  static async getPurchaseRequisitions(filters?: any): Promise<any[]> {
    let url = '/procurement/requisitions';
    if (filters) {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(k => {
        if (filters[k] !== undefined && filters[k] !== '') {
          params.append(k, String(filters[k]));
        }
      });
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }
    return this.request(url);
  }

  static async getPurchaseRequisition(id: string): Promise<any> {
    return this.request(`/procurement/requisitions/${id}`);
  }

  static async createPurchaseRequisition(data: any, items: any[]): Promise<any> {
    return this.request('/procurement/requisitions', {
      method: 'POST',
      body: JSON.stringify({ data, items, lines: items })
    });
  }

  static async updatePurchaseRequisition(id: string, updates: any, items?: any[], expectedVersion?: number): Promise<any> {
    return this.request(`/procurement/requisitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ updates, items, lines: items, expectedVersion })
    });
  }

  static async submitPurchaseRequisition(id: string, expectedVersion?: number): Promise<any> {
    return this.request(`/procurement/requisitions/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ expectedVersion })
    });
  }

  static async approvePurchaseRequisition(id: string, stepNumber: number = 1, comments: string = 'Approved', expectedVersion?: number, userRole?: string): Promise<any> {
    return this.request(`/procurement/requisitions/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ stepNumber, comments, expectedVersion, userRole })
    });
  }

  static async rejectPurchaseRequisition(id: string, reason: string, expectedVersion?: number): Promise<any> {
    return this.request(`/procurement/requisitions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, expectedVersion })
    });
  }

  static async cancelPurchaseRequisition(id: string, reason: string = 'Cancelled', expectedVersion?: number): Promise<any> {
    return this.request(`/procurement/requisitions/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason, expectedVersion })
    });
  }

  static async checkRequisitionBudget(id: string, customAllocatedAmount?: number, customPolicy?: string): Promise<any> {
    return this.request(`/procurement/requisitions/${id}/budget-check`, {
      method: 'POST',
      body: JSON.stringify({ customAllocatedAmount, customPolicy })
    });
  }

  static async getRequisitionApprovalHistory(id: string): Promise<any> {
    return this.request(`/procurement/requisitions/${id}/approval-history`);
  }

  static async getRFQs(): Promise<any[]> {
    return this.request('/procurement/rfqs');
  }

  static async createRFQFromPR(prId: string, vendorIds: string[], closingDate?: string): Promise<any> {
    return this.request('/procurement/rfqs', {
      method: 'POST',
      body: JSON.stringify({ prId, vendorIds, closingDate })
    });
  }

  static async getVendorQuotations(rfqId?: string): Promise<any[]> {
    const url = rfqId ? `/procurement/quotations?rfqId=${rfqId}` : '/procurement/quotations';
    return this.request(url);
  }

  static async submitVendorQuotation(data: any, items: any[]): Promise<any> {
    return this.request('/procurement/quotations', {
      method: 'POST',
      body: JSON.stringify({ data, items })
    });
  }

  static async getQuotationComparisonMatrix(rfqId: string): Promise<any[]> {
    return this.request(`/procurement/quotations/comparison-matrix?rfqId=${rfqId}`);
  }

  static async getProcurementPurchaseOrders(filters?: any): Promise<any[]> {
    let url = '/procurement/purchase-orders';
    if (filters) {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(k => {
        if (filters[k] !== undefined && filters[k] !== '') {
          params.append(k, String(filters[k]));
        }
      });
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }
    return this.request(url);
  }

  static async getPurchaseOrder(id: string): Promise<any> {
    return this.request(`/procurement/purchase-orders/${id}`);
  }

  static async createPurchaseOrder(data: any, items: any[]): Promise<any> {
    return this.request('/procurement/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({ data, items })
    });
  }

  static async convertPRToPO(prId: string, vendorId: string, selectedLineIds?: string[]): Promise<any> {
    return this.request('/procurement/purchase-orders/convert-from-pr', {
      method: 'POST',
      body: JSON.stringify({ prId, vendorId, selectedLineIds })
    });
  }

  static async convertAwardToPO(award: any): Promise<any> {
    return this.request('/procurement/purchase-orders/convert-from-award', {
      method: 'POST',
      body: JSON.stringify({ award })
    });
  }

  static async updateDraftPO(id: string, data: any, items?: any[], expectedVersion?: number): Promise<any> {
    return this.request(`/procurement/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data, items, expectedVersion })
    });
  }

  static async submitPurchaseOrder(id: string, expectedVersion?: number): Promise<any> {
    return this.request(`/procurement/purchase-orders/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ expectedVersion })
    });
  }

  static async approvePurchaseOrder(
    id: string,
    stepNumberOrRole: number | string = 1,
    commentsOrUserId: string = 'Approved',
    expectedVersionOrUserName?: number | string,
    approverRole?: string,
    approverUserId?: string,
    approverName?: string
  ): Promise<any> {
    let payload: any = {};
    if (typeof stepNumberOrRole === 'number') {
      payload = {
        stepNumber: stepNumberOrRole,
        comments: commentsOrUserId,
        expectedVersion: typeof expectedVersionOrUserName === 'number' ? expectedVersionOrUserName : undefined,
        approverRole,
        approverUserId,
        approverName
      };
    } else {
      payload = {
        stepNumber: 1,
        approverRole: stepNumberOrRole,
        approverUserId: commentsOrUserId,
        approverName: typeof expectedVersionOrUserName === 'string' ? expectedVersionOrUserName : undefined
      };
    }
    return this.request(`/procurement/purchase-orders/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async rejectPurchaseOrder(id: string, reason: string, expectedVersion?: number, approverRole?: string): Promise<any> {
    return this.request(`/procurement/purchase-orders/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, expectedVersion, approverRole })
    });
  }

  static async issuePOToVendor(id: string, transmissionMethod: string = 'EMAIL', expectedVersion?: number): Promise<any> {
    return this.request(`/procurement/purchase-orders/${id}/issue`, {
      method: 'POST',
      body: JSON.stringify({ transmissionMethod, expectedVersion })
    });
  }

  static async acknowledgePO(id: string, confirmationRef?: string, estimatedDeliveryDate?: string, expectedVersion?: number): Promise<any> {
    return this.request(`/procurement/purchase-orders/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ confirmationRef, estimatedDeliveryDate, expectedVersion })
    });
  }

  static async amendPurchaseOrder(id: string, amendmentReason: string, updatedFields?: any, updatedItems?: any[], expectedVersion?: number): Promise<any> {
    return this.request(`/procurement/purchase-orders/${id}/amend`, {
      method: 'POST',
      body: JSON.stringify({ amendmentReason, updatedFields, updatedItems, expectedVersion })
    });
  }

  static async cancelPurchaseOrder(id: string, reason: string = 'Cancelled', expectedVersion?: number): Promise<any> {
    return this.request(`/procurement/purchase-orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason, expectedVersion })
    });
  }

  static async closePurchaseOrder(id: string, reason: string = 'Closed', expectedVersion?: number): Promise<any> {
    return this.request(`/procurement/purchase-orders/${id}/close`, {
      method: 'POST',
      body: JSON.stringify({ reason, expectedVersion })
    });
  }

  static async updatePODeliverySchedules(id: string, poItemId: string, schedules: any[]): Promise<any> {
    return this.request(`/procurement/purchase-orders/${id}/delivery-schedules`, {
      method: 'POST',
      body: JSON.stringify({ poItemId, schedules })
    });
  }

  static async checkPOBudget(id: string, customAllocatedAmount?: number, customPolicy?: string): Promise<any> {
    return this.request(`/procurement/purchase-orders/${id}/budget-check`, {
      method: 'POST',
      body: JSON.stringify({ customAllocatedAmount, customPolicy })
    });
  }

  static async getPOApprovalHistory(id: string): Promise<any> {
    return this.request(`/procurement/purchase-orders/${id}/approval-history`);
  }

  static async resolveContractPricing(params: {
    vendorId: string;
    itemSku: string;
    quantity?: number;
    currency?: string;
    basePrice?: number;
    tenantId?: string;
    priceListId?: string;
    awardedUnitPrice?: number;
  }): Promise<any> {
    return this.request('/procurement/contract-pricing/resolve', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  static async runPhase32B03HardeningSuite(): Promise<any> {
    return this.request('/procurement/hardening/run-suite-32b03');
  }

  static async recordPartialDelivery(poId: string, receivedLines: any[]): Promise<any> {
    return this.request(`/procurement/purchase-orders/${poId}/partial-delivery`, {
      method: 'POST',
      body: JSON.stringify({ receivedLines })
    });
  }

  static async getVendorReturns(): Promise<any[]> {
    return this.request('/procurement/vendor-returns');
  }

  static async createVendorReturn(poId: string, reason: string, items: any[]): Promise<any> {
    return this.request('/procurement/vendor-returns', {
      method: 'POST',
      body: JSON.stringify({ poId, reason, items })
    });
  }

  static async getPurchaseAuditLogs(): Promise<any[]> {
    return this.request('/procurement/audit-logs');
  }

  // ==================== PHASE 2.4 ACCOUNTS PAYABLE API CLIENT ====================

  static async getSupplierInvoices(status?: string, vendorId?: string, poId?: string): Promise<any[]> {
    let q = [];
    if (status) q.push(`status=${status}`);
    if (vendorId) q.push(`vendorId=${vendorId}`);
    if (poId) q.push(`poId=${poId}`);
    const queryStr = q.length ? `?${q.join('&')}` : '';
    return this.request(`/ap/supplier-invoices${queryStr}`);
  }

  static async createSupplierInvoice(invoiceData: any): Promise<any> {
    return this.request('/ap/supplier-invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData)
    });
  }

  static async releaseInvoiceVariance(id: string, releasedBy?: string, reason?: string): Promise<any> {
    return this.request(`/ap/supplier-invoices/${id}/release-variance`, {
      method: 'POST',
      body: JSON.stringify({ releasedBy, reason })
    });
  }

  static async postSupplierInvoice(id: string): Promise<any> {
    return this.request(`/ap/supplier-invoices/${id}/post`, {
      method: 'POST'
    });
  }

  static async getGRIRClearing(): Promise<any[]> {
    return this.request('/ap/grir-clearing');
  }

  static async getAPVouchers(vendorId?: string, status?: string): Promise<any[]> {
    let q = [];
    if (vendorId) q.push(`vendorId=${vendorId}`);
    if (status) q.push(`status=${status}`);
    const queryStr = q.length ? `?${q.join('&')}` : '';
    return this.request(`/ap/vouchers${queryStr}`);
  }

  static async getSupplierCreditNotes(): Promise<any[]> {
    return this.request('/ap/credit-notes');
  }

  static async createSupplierCreditNote(data: any): Promise<any> {
    return this.request('/ap/credit-notes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getPaymentProposals(): Promise<any[]> {
    return this.request('/ap/payment-proposals');
  }

  static async createPaymentProposal(cutoffDueDate?: string, vendorId?: string): Promise<any> {
    return this.request('/ap/payment-proposals', {
      method: 'POST',
      body: JSON.stringify({ cutoffDueDate, vendorId })
    });
  }

  static async getPaymentBatches(): Promise<any[]> {
    return this.request('/ap/payment-batches');
  }

  static async executePaymentBatch(proposalId: string, paymentMethod: string, bankAccountId?: string): Promise<any> {
    return this.request('/ap/payment-batches', {
      method: 'POST',
      body: JSON.stringify({ proposalId, paymentMethod, bankAccountId })
    });
  }

  static async getVendorStatement(vendorId: string, startDate?: string, endDate?: string): Promise<any> {
    let q = [];
    if (startDate) q.push(`startDate=${startDate}`);
    if (endDate) q.push(`endDate=${endDate}`);
    const queryStr = q.length ? `?${q.join('&')}` : '';
    return this.request(`/ap/vendor-statements/${vendorId}${queryStr}`);
  }

  static async getVendorAgingReport(reportDate?: string): Promise<any> {
    const queryStr = reportDate ? `?reportDate=${reportDate}` : '';
    return this.request(`/ap/vendor-aging${queryStr}`);
  }

  static async getPurchaseAccruals(period?: string): Promise<any[]> {
    const queryStr = period ? `?period=${period}` : '';
    return this.request(`/ap/purchase-accruals${queryStr}`);
  }

  static async getAPAuditLogs(): Promise<any[]> {
    return this.request('/ap/audit-logs');
  }

  static async transitionInvoiceState(id: string, newStatus: string, user?: string, reason?: string, correlationId?: string): Promise<any> {
    return this.request(`/ap/supplier-invoices/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify({ newStatus, user, reason, correlationId })
    });
  }

  static async allocatePayment(data: { vendorId: string; vendorName?: string; paymentAmount: number; allocationType?: string; targetVoucherIds?: string[]; user?: string }): Promise<any> {
    return this.request('/ap/allocations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getPaymentAllocations(): Promise<any[]> {
    return this.request('/ap/allocations');
  }

  static async getVendorCreditControl(vendorId: string, newInvoiceAmount?: number): Promise<any> {
    const q = newInvoiceAmount ? `?newInvoiceAmount=${newInvoiceAmount}` : '';
    return this.request(`/ap/credit-control/${vendorId}${q}`);
  }

  static async calculateExchangeRateDiff(data: { docCurrency?: string; docExchangeRate?: number; paymentExchangeRate?: number; documentAmountInDocCurrency?: number }): Promise<any> {
    return this.request('/ap/exchange-rate-diff', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async checkEarlyDiscount(data: { grossAmount: number; invoiceDate?: string; paymentDate?: string; paymentTermsCode?: string }): Promise<any> {
    return this.request('/ap/early-discount-check', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getAgingSnapshots(): Promise<any[]> {
    return this.request('/ap/vendor-aging/snapshots');
  }

  static async createAgingSnapshot(): Promise<any> {
    return this.request('/ap/vendor-aging/snapshot', {
      method: 'POST'
    });
  }

  static async reversePaymentBatch(id: string, reason?: string, user?: string): Promise<any> {
    return this.request(`/ap/payment-batches/${id}/reverse`, {
      method: 'POST',
      body: JSON.stringify({ reason, user })
    });
  }

  static async getPaymentReversals(): Promise<any[]> {
    return this.request('/ap/payment-reversals');
  }

  // ==================== PHASE 2.5 ACCOUNTS RECEIVABLE & ORDER-TO-CASH SDK ====================

  static async getARCustomers(): Promise<any[]> {
    return this.request('/ar/customers');
  }

  static async createARCustomer(customerData: any): Promise<any> {
    return this.request('/ar/customers', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
  }

  static async updateARCustomer(id: string, customerData: any): Promise<any> {
    return this.request(`/ar/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData)
    });
  }

  static async getARSalesInvoices(): Promise<any[]> {
    return this.request('/ar/invoices');
  }

  static async createARSalesInvoice(invoiceData: any): Promise<any> {
    return this.request('/ar/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData)
    });
  }

  static async transitionARInvoiceState(id: string, status: string, reason?: string): Promise<any> {
    return this.request(`/ar/invoices/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify({ status, reason })
    });
  }

  static async getARCreditNotes(): Promise<any[]> {
    return this.request('/ar/credit-notes');
  }

  static async createARCreditNote(creditNoteData: any): Promise<any> {
    return this.request('/ar/credit-notes', {
      method: 'POST',
      body: JSON.stringify(creditNoteData)
    });
  }

  static async getARReceipts(): Promise<any[]> {
    return this.request('/ar/receipts');
  }

  static async createARReceipt(receiptData: any): Promise<any> {
    return this.request('/ar/receipts', {
      method: 'POST',
      body: JSON.stringify(receiptData)
    });
  }

  static async reverseARReceipt(id: string, reason?: string): Promise<any> {
    return this.request(`/ar/receipts/${id}/reverse`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  static async getARAllocations(): Promise<any[]> {
    return this.request('/ar/allocations');
  }

  static async createARAllocation(allocationData: any): Promise<any> {
    return this.request('/ar/allocations', {
      method: 'POST',
      body: JSON.stringify(allocationData)
    });
  }

  static async getARCreditControl(customerId: string, newAmount?: number): Promise<any> {
    const q = newAmount ? `?newAmount=${newAmount}` : '';
    return this.request(`/ar/credit-control/${customerId}${q}`);
  }

  static async getARAgingReport(asOfDate?: string): Promise<any> {
    const q = asOfDate ? `?asOfDate=${asOfDate}` : '';
    return this.request(`/ar/aging${q}`);
  }

  static async getARAgingSnapshots(): Promise<any[]> {
    return this.request('/ar/aging/snapshots');
  }

  static async createARAgingSnapshot(): Promise<any> {
    return this.request('/ar/aging/snapshot', {
      method: 'POST'
    });
  }

  static async getARCustomerStatement(customerId: string, startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/ar/statements/${customerId}${q}`);
  }

  static async getARCollectionNotes(customerId: string): Promise<any[]> {
    return this.request(`/ar/collections/notes/${customerId}`);
  }

  static async createARCollectionNote(noteData: any): Promise<any> {
    return this.request('/ar/collections/notes', {
      method: 'POST',
      body: JSON.stringify(noteData)
    });
  }

  static async getARPromisesToPay(customerId: string): Promise<any[]> {
    return this.request(`/ar/collections/promises/${customerId}`);
  }

  static async createARPromiseToPay(promiseData: any): Promise<any> {
    return this.request('/ar/collections/promises', {
      method: 'POST',
      body: JSON.stringify(promiseData)
    });
  }

  static async updateARPromiseToPayStatus(id: string, status: string, notes?: string): Promise<any> {
    return this.request(`/ar/collections/promises/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes })
    });
  }

  static async calculateARSettlementFX(fxData: any): Promise<any> {
    return this.request('/ar/settlement-fx', {
      method: 'POST',
      body: JSON.stringify(fxData)
    });
  }

  static async getARRevRecSchedules(): Promise<any[]> {
    return this.request('/ar/rev-rec/schedules');
  }

  static async createARRevRecSchedule(scheduleData: any): Promise<any> {
    return this.request('/ar/rev-rec/schedule', {
      method: 'POST',
      body: JSON.stringify(scheduleData)
    });
  }

  static async getARAuditLogs(): Promise<any[]> {
    return this.request('/ar/audit-logs');
  }

  // ==================== PHASE 2.6 GENERAL LEDGER APIS ====================
  static async getGLAccounts(): Promise<any[]> {
    return this.request('/gl/accounts');
  }

  static async createGLAccount(accountData: any): Promise<any> {
    return this.request('/gl/accounts', {
      method: 'POST',
      body: JSON.stringify(accountData)
    });
  }

  static async updateGLAccount(id: string, data: any): Promise<any> {
    return this.request(`/gl/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async getGLJournals(filters?: { status?: string; journalType?: string; period?: number; year?: number }): Promise<any[]> {
    let query = '';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.journalType) params.append('journalType', filters.journalType);
      if (filters.period) params.append('period', String(filters.period));
      if (filters.year) params.append('year', String(filters.year));
      query = `?${params.toString()}`;
    }
    return this.request(`/gl/journals${query}`);
  }

  static async createGLJournal(journalData: any): Promise<any> {
    return this.request('/gl/journals', {
      method: 'POST',
      body: JSON.stringify(journalData)
    });
  }

  static async postGLJournal(id: string, approvedBy?: string): Promise<any> {
    return this.request(`/gl/journals/${id}/post`, {
      method: 'POST',
      body: JSON.stringify({ approvedBy })
    });
  }

  static async reverseGLJournal(id: string, reversalData: any): Promise<any> {
    return this.request(`/gl/journals/${id}/reverse`, {
      method: 'POST',
      body: JSON.stringify(reversalData)
    });
  }

  static async getGLPostingRules(): Promise<any[]> {
    return this.request('/gl/posting-rules');
  }

  static async createGLPostingRule(ruleData: any): Promise<any> {
    return this.request('/gl/posting-rules', {
      method: 'POST',
      body: JSON.stringify(ruleData)
    });
  }

  static async getGLFiscalYears(): Promise<any[]> {
    return this.request('/gl/fiscal-years');
  }

  static async createGLFiscalYear(yearData: any): Promise<any> {
    return this.request('/gl/fiscal-years', {
      method: 'POST',
      body: JSON.stringify(yearData)
    });
  }

  static async getGLFiscalPeriods(): Promise<any[]> {
    return this.request('/gl/fiscal-periods');
  }

  static async updateGLFiscalPeriodStatus(id: string, status: string, lockedBy?: string, reason?: string): Promise<any> {
    return this.request(`/gl/fiscal-periods/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, lockedBy, reason })
    });
  }

  static async reopenGLFiscalPeriod(id: string, reopenedBy?: string, reason?: string): Promise<any> {
    return this.request(`/gl/fiscal-periods/${id}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ reopenedBy, reason })
    });
  }

  static async getGLRecurringSchedules(): Promise<any[]> {
    return this.request('/gl/recurring-schedules');
  }

  static async createGLRecurringSchedule(scheduleData: any): Promise<any> {
    return this.request('/gl/recurring-schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData)
    });
  }

  static async executeGLRecurringSchedules(): Promise<any> {
    return this.request('/gl/recurring-schedules/execute', {
      method: 'POST'
    });
  }

  static async getGLTrialBalance(params?: { periodNumber?: number; fiscalYear?: number; companyId?: string; branchId?: string; costCenterId?: string }): Promise<any> {
    let query = '';
    if (params) {
      const q = new URLSearchParams();
      if (params.periodNumber) q.append('periodNumber', String(params.periodNumber));
      if (params.fiscalYear) q.append('fiscalYear', String(params.fiscalYear));
      if (params.companyId) q.append('companyId', params.companyId);
      if (params.branchId) q.append('branchId', params.branchId);
      if (params.costCenterId) q.append('costCenterId', params.costCenterId);
      query = `?${q.toString()}`;
    }
    return this.request(`/gl/trial-balance${query}`);
  }

  static async getGLPreCloseChecklist(periodId: string): Promise<any> {
    return this.request(`/gl/closing/checklist/${periodId}`);
  }

  static async executeGLPeriodClose(periodId: string, closedBy?: string): Promise<any> {
    return this.request('/gl/closing/period-close', {
      method: 'POST',
      body: JSON.stringify({ periodId, closedBy })
    });
  }

  static async executeGLYearEndClose(year: number, retainedEarningsAccountCode?: string, closedBy?: string): Promise<any> {
    return this.request('/gl/closing/year-end-close', {
      method: 'POST',
      body: JSON.stringify({ year, retainedEarningsAccountCode, closedBy })
    });
  }

  static async calculateGLIAS21Revaluation(spotRates?: Record<string, number>): Promise<any> {
    return this.request('/api/v1/gl/ias21-revaluation', {
      method: 'POST',
      body: JSON.stringify({ spotRates })
    });
  }

  static async getGLAuditLogs(): Promise<any[]> {
    return this.request('/gl/audit-logs');
  }

  // ==================== PHASE 2.7 FINANCIAL REPORTING & BI ====================

  static async getFinancialBalanceSheet(params?: { asOfDate?: string; companyId?: string; currency?: string }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    return this.request(`/reports/financial/balance-sheet${q ? '?' + q : ''}`);
  }

  static async getFinancialIncomeStatement(params?: { startDate?: string; endDate?: string; companyId?: string; currency?: string }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    return this.request(`/reports/financial/income-statement${q ? '?' + q : ''}`);
  }

  static async getFinancialCashFlowStatement(params?: { startDate?: string; endDate?: string; companyId?: string }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    return this.request(`/reports/financial/cash-flow${q ? '?' + q : ''}`);
  }

  static async getFinancialChangesInEquity(params?: { startDate?: string; endDate?: string; companyId?: string }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    return this.request(`/reports/financial/changes-in-equity${q ? '?' + q : ''}`);
  }

  static async getFinancialTrialBalance(params?: { type?: string; asOfDate?: string; companyId?: string }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    return this.request(`/reports/trial-balance${q ? '?' + q : ''}`);
  }

  static async getFinancialRatios(params?: { asOfDate?: string; companyId?: string }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    return this.request(`/reports/ratios${q ? '?' + q : ''}`);
  }

  static async getExecutiveDashboard(params?: { asOfDate?: string; companyId?: string }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    return this.request(`/reports/executive-dashboard${q ? '?' + q : ''}`);
  }

  static async getBudgetVsActualReport(params?: { budgetId?: string; fiscalYear?: number }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    return this.request(`/reports/budget-vs-actual${q ? '?' + q : ''}`);
  }

  static async getCostCenterReport(params?: { companyId?: string }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    return this.request(`/reports/cost-centers${q ? '?' + q : ''}`);
  }

  static async getProfitCenterReport(params?: { companyId?: string }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    return this.request(`/reports/profit-centers${q ? '?' + q : ''}`);
  }

  static async getConsolidatedReport(params?: { groupName?: string; parentCompanyId?: string }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    return this.request(`/reports/consolidated${q ? '?' + q : ''}`);
  }

  static async getBIDataset(params?: { reportName?: string }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    return this.request(`/reports/bi-dataset${q ? '?' + q : ''}`);
  }

  static async exportFinancialReport(exportPayload: { reportData: any; format: string; customTitle?: string }): Promise<any> {
    return this.request('/reports/export', {
      method: 'POST',
      body: JSON.stringify(exportPayload)
    });
  }

  static async createReportSnapshot(snapshotPayload: any): Promise<any> {
    return this.request('/reports/snapshots', {
      method: 'POST',
      body: JSON.stringify(snapshotPayload)
    });
  }

  static async getReportSnapshots(params?: { reportType?: string; companyId?: string }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    return this.request(`/reports/snapshots${q ? '?' + q : ''}`);
  }

  static async verifySnapshotIntegrity(snapshotId: string): Promise<any> {
    return this.request(`/reports/snapshots/${snapshotId}/verify`);
  }

  static async getKPILineage(kpiId: string, companyId?: string): Promise<any> {
    const q = companyId ? `?companyId=${companyId}` : '';
    return this.request(`/reports/kpi-lineage/${kpiId}${q}`);
  }

  static async getComparativeMoM(params?: { companyId?: string; month1?: string; month2?: string }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    return this.request(`/reports/comparative/mom${q ? '?' + q : ''}`);
  }

  static async getComparativeYoY(params?: { companyId?: string; year1?: number; year2?: number }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    return this.request(`/reports/comparative/yoy${q ? '?' + q : ''}`);
  }

  static async runPhase27QualityGate(): Promise<any> {
    return this.request('/reports/quality-gate');
  }

  // ==================== FIXED ASSETS & ASSET LIFECYCLE APIS ====================

  static async getFixedAssets(companyId?: string): Promise<any> {
    const q = companyId ? `?companyId=${companyId}` : '';
    return this.request(`/assets${q}`);
  }

  static async getFixedAssetById(id: string): Promise<any> {
    return this.request(`/assets/${id}`);
  }

  static async getFixedAssetMasterData(): Promise<any> {
    return this.request('/assets/master-data');
  }

  static async createFixedAsset(assetData: any): Promise<any> {
    return this.request('/assets', {
      method: 'POST',
      body: JSON.stringify(assetData)
    });
  }

  static async postAssetAcquisition(payload: any): Promise<any> {
    return this.request('/assets/acquisitions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async runAssetDepreciation(companyId: string, period: string, runBy: string = 'System'): Promise<any> {
    return this.request('/assets/depreciation/run', {
      method: 'POST',
      body: JSON.stringify({ companyId, period, runBy })
    });
  }

  static async getAssetDepreciationSchedule(assetId: string): Promise<any> {
    return this.request(`/assets/depreciation/schedule/${assetId}`);
  }

  static async postAssetTransfer(payload: any): Promise<any> {
    return this.request('/assets/transfers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async postAssetDisposal(payload: any): Promise<any> {
    return this.request('/assets/disposals', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async postAssetRevaluation(payload: any): Promise<any> {
    return this.request('/assets/revaluations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async postAssetImpairment(payload: any): Promise<any> {
    return this.request('/assets/impairments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async logAssetMaintenance(payload: any): Promise<any> {
    return this.request('/assets/maintenances', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getAssetMaintenances(assetId?: string): Promise<any> {
    const q = assetId ? `?assetId=${assetId}` : '';
    return this.request(`/assets/maintenances${q}`);
  }

  static async createPhysicalVerificationSession(payload: any): Promise<any> {
    return this.request('/assets/verification/sessions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async scanPhysicalVerificationBarcode(payload: any): Promise<any> {
    return this.request('/assets/verification/scan', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getAssetRegisterReport(companyId?: string): Promise<any> {
    const q = companyId ? `?companyId=${companyId}` : '';
    return this.request(`/assets/reports/register${q}`);
  }

  static async getAssetRollForwardReport(params?: { companyId?: string; periodStart?: string; periodEnd?: string }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    return this.request(`/assets/reports/roll-forward${q ? '?' + q : ''}`);
  }

  static async getAssetAuditTrail(assetId?: string): Promise<any> {
    const q = assetId ? `?assetId=${assetId}` : '';
    return this.request(`/assets/audit-trail${q}`);
  }

  // ============================================================================
  // PHASE 2.9: BANKING, CASH MANAGEMENT & TREASURY API CLIENT METHODS
  // ============================================================================

  static async getTreasuryBanks(): Promise<any> {
    return this.request('/treasury/banks');
  }

  static async createTreasuryBank(payload: any): Promise<any> {
    return this.request('/treasury/banks', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getTreasuryBankAccounts(companyId?: string): Promise<any> {
    const q = companyId ? `?companyId=${companyId}` : '';
    return this.request(`/treasury/bank-accounts${q}`);
  }

  static async createTreasuryBankAccount(payload: any): Promise<any> {
    return this.request('/treasury/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getTreasuryCashAccounts(companyId?: string): Promise<any> {
    const q = companyId ? `?companyId=${companyId}` : '';
    return this.request(`/treasury/cash-accounts${q}`);
  }

  static async createTreasuryCashAccount(payload: any): Promise<any> {
    return this.request('/treasury/cash-accounts', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getTreasuryTransactions(params?: any): Promise<any> {
    const q = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/treasury/transactions${q}`);
  }

  static async createTreasuryTransaction(payload: any): Promise<any> {
    return this.request('/treasury/transactions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getTreasuryCheques(params?: any): Promise<any> {
    const q = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/treasury/cheques${q}`);
  }

  static async createTreasuryCheque(payload: any): Promise<any> {
    return this.request('/treasury/cheques', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async clearTreasuryCheque(id: string, payload: any): Promise<any> {
    return this.request(`/treasury/cheques/${id}/clear`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async dishonourTreasuryCheque(id: string, payload: any): Promise<any> {
    return this.request(`/treasury/cheques/${id}/dishonour`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getTreasuryChequeBooks(bankAccountId?: string): Promise<any> {
    const q = bankAccountId ? `?bankAccountId=${bankAccountId}` : '';
    return this.request(`/treasury/cheque-books${q}`);
  }

  static async createTreasuryChequeBook(payload: any): Promise<any> {
    return this.request('/treasury/cheque-books', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async importBankStatement(payload: any): Promise<any> {
    return this.request('/treasury/reconciliations/statements/import', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async autoMatchReconciliation(payload: any): Promise<any> {
    return this.request('/treasury/reconciliations/auto-match', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getTreasuryReconciliations(bankAccountId?: string): Promise<any> {
    const q = bankAccountId ? `?bankAccountId=${bankAccountId}` : '';
    return this.request(`/treasury/reconciliations${q}`);
  }

  static async getTreasuryCashForecast(params?: { horizon?: string; companyId?: string }): Promise<any> {
    const q = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/treasury/forecasting/liquidity${q}`);
  }

  static async getTreasuryPaymentCalendar(companyId?: string): Promise<any> {
    const q = companyId ? `?companyId=${companyId}` : '';
    return this.request(`/treasury/calendar/payments${q}`);
  }

  static async postTreasuryBankCharge(payload: any): Promise<any> {
    return this.request('/treasury/charges/post', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getTreasuryBankCharges(bankAccountId?: string): Promise<any> {
    const q = bankAccountId ? `?bankAccountId=${bankAccountId}` : '';
    return this.request(`/treasury/charges${q}`);
  }

  static async getTreasuryFxRates(): Promise<any> {
    return this.request('/treasury/fx/rates');
  }

  static async postTreasuryFxRevaluation(payload: any): Promise<any> {
    return this.request('/treasury/fx/revaluation', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getTreasuryDashboard(companyId?: string): Promise<any> {
    const q = companyId ? `?companyId=${companyId}` : '';
    return this.request(`/treasury/dashboard${q}`);
  }

  static async getTreasuryQualityGateReport(companyId?: string): Promise<any> {
    const q = companyId ? `?companyId=${companyId}` : '';
    return this.request(`/treasury/quality-gate${q}`);
  }

  static async runTreasuryQualityGate(payload: { companyId?: string; auditor?: string; fiscalPeriod?: string }): Promise<any> {
    return this.request('/treasury/quality-gate/run', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getTreasurySnapshots(companyId?: string): Promise<any> {
    const q = companyId ? `?companyId=${companyId}` : '';
    return this.request(`/treasury/snapshots${q}`);
  }

  static async sealTreasurySnapshot(payload: { companyId?: string; snapshotDate?: string; baseCurrency?: string; sealedBy?: string }): Promise<any> {
    return this.request('/treasury/snapshots', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getTreasuryAuditTrail(companyId?: string): Promise<any> {
    const q = companyId ? `?companyId=${companyId}` : '';
    return this.request(`/treasury/audit-trail${q}`);
  }

  // ==================== PHASE 3.0 PLATFORM INTEGRATION CLIENT API ====================

  static async getPlatformWorkflows(companyId?: string): Promise<any> {
    const q = companyId ? `?companyId=${companyId}` : '';
    return this.request(`/platform/workflows${q}`);
  }

  static async getPlatformWorkflowInstances(companyId?: string): Promise<any> {
    const q = companyId ? `?companyId=${companyId}` : '';
    return this.request(`/platform/workflow-instances${q}`);
  }

  static async getPlatformDelegations(userId?: string): Promise<any> {
    const q = userId ? `?userId=${userId}` : '';
    return this.request(`/platform/delegations${q}`);
  }

  static async createPlatformWorkflow(payload: any): Promise<any> {
    return this.request('/platform/workflows', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async processPlatformApprovalDecision(payload: {
    instanceId: string;
    stepIndex: number;
    decision: 'APPROVED' | 'REJECTED';
    approverUserId: string;
    approverName: string;
    approverRole: string;
    comments?: string;
  }): Promise<any> {
    return this.request('/platform/workflow-instances/decision', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getPlatformNotifications(userId?: string): Promise<any> {
    const q = userId ? `?userId=${userId}` : '';
    return this.request(`/platform/notifications${q}`);
  }

  static async sendPlatformNotification(payload: any): Promise<any> {
    return this.request('/platform/notifications', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async markPlatformNotificationAsRead(id: string): Promise<any> {
    return this.request(`/platform/notifications/${id}/read`, {
      method: 'PUT'
    });
  }

  static async getPlatformScheduledJobs(): Promise<any> {
    return this.request('/platform/jobs');
  }

  static async createPlatformScheduledJob(payload: any): Promise<any> {
    return this.request('/platform/jobs', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async executePlatformJob(id: string): Promise<any> {
    return this.request(`/platform/jobs/${id}/run`, {
      method: 'POST'
    });
  }

  static async executePlatformGlobalSearch(payload: { q: string; category?: string; status?: string; limit?: number }): Promise<any> {
    return this.request('/platform/search', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getPlatformAttachments(entityType?: string, entityId?: string): Promise<any> {
    const params = new URLSearchParams();
    if (entityType) params.append('entityType', entityType);
    if (entityId) params.append('entityId', entityId);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/platform/attachments${q}`);
  }

  static async createPlatformAttachment(payload: any): Promise<any> {
    return this.request('/platform/attachments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async verifyPlatformAttachmentIntegrity(id: string): Promise<any> {
    return this.request(`/platform/attachments/${id}/verify`);
  }

  static async getPlatformActivityTimeline(entityType?: string, entityId?: string): Promise<any> {
    const params = new URLSearchParams();
    if (entityType) params.append('entityType', entityType);
    if (entityId) params.append('entityId', entityId);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/platform/timeline${q}`);
  }

  static async getPlatformDashboardMetrics(role?: string): Promise<any> {
    const q = role ? `?role=${role}` : '';
    return this.request(`/platform/dashboard/metrics${q}`);
  }

  static async getPlatformHealthReport(): Promise<any> {
    return this.request('/platform/health');
  }

  static async getPlatformBackups(companyId?: string): Promise<any> {
    const q = companyId ? `?companyId=${companyId}` : '';
    return this.request(`/platform/backups${q}`);
  }

  static async createPlatformBackup(payload: { companyId?: string; backupType?: string; createdBy?: string }): Promise<any> {
    return this.request('/platform/backups', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async simulatePlatformRestore(id: string): Promise<any> {
    return this.request(`/platform/backups/${id}/simulate-restore`, {
      method: 'POST'
    });
  }

  static async getPlatformPilotReadiness(): Promise<any> {
    return this.request('/platform/pilot-readiness');
  }

  static async validatePlatformImport(payload: { entityType: string; rows: any[] }): Promise<any> {
    return this.request('/platform/import/validate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async executePlatformExport(payload: { entityType: string; format: string; dateRange?: any }): Promise<any> {
    return this.request('/platform/export', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getPlatformCacheMetrics(): Promise<any> {
    return this.request('/platform/performance/cache');
  }

  static async runPhase32B01HardeningSuite(): Promise<any> {
    return this.request('/procurement/hardening/run-suite');
  }

  static async runPhase32B04HardeningSuite(): Promise<any> {
    return this.request('/procurement/hardening/run-suite-32b04');
  }

  static async runPhase32B05HardeningSuite(): Promise<any> {
    return this.request('/procurement/hardening/run-suite-32b05');
  }

  static async runPhase32B06HardeningSuite(): Promise<any> {
    return this.request('/procurement/hardening/run-suite-32b06');
  }

  static async runPhase32B07HardeningSuite(): Promise<any> {
    return this.request('/procurement/hardening/run-suite-32b07');
  }

  // ==================== PHASE 3.2B-08 ADVANCED PROCUREMENT API CLIENT ====================

  static async runERSBatch(payload: { vendorId?: string; cutoffDate: string; taxPercent?: number }): Promise<any> {
    return this.request('/procurement/ers/run', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async runERS(payload: any): Promise<any> {
    return this.request('/procurement/ers/run', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getGoodsReceipts(): Promise<any[]> {
    return this.request('/procurement/goods-receipts');
  }

  static async getERSInvoices(): Promise<any[]> {
    return this.request('/procurement/ers/invoices');
  }

  static async getConsignmentAgreements(): Promise<any[]> {
    return this.request('/procurement/consignment/agreements');
  }

  static async createConsignmentAgreement(payload: any): Promise<any> {
    return this.request('/procurement/consignment/agreements', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getConsignmentStock(): Promise<any[]> {
    return this.request('/procurement/consignment/stock');
  }

  static async getConsignmentWithdrawals(): Promise<any[]> {
    return this.request('/procurement/consignment/withdrawals');
  }

  static async recordConsignmentWithdrawal(payload: any): Promise<any> {
    return this.request('/procurement/consignment/withdrawals', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async settleConsignmentWithdrawals(payload: any): Promise<any> {
    return this.request('/procurement/consignment/settlements', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async settleConsignmentConsumption(payload: any): Promise<any> {
    return this.request('/procurement/consignment/settlements', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getConsignmentSettlements(): Promise<any[]> {
    return this.request('/procurement/consignment/settlements');
  }

  static async getLandedCostAdjustments(): Promise<any[]> {
    return this.request('/procurement/landed-cost/adjustments');
  }

  static async createLandedCostAdjustment(payload: any): Promise<any> {
    return this.request('/procurement/landed-cost/adjustments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async applyLandedCostAdjustment(payload: any): Promise<any> {
    return this.request('/procurement/landed-cost/adjustments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getSupplierScorecards(vendorId?: string): Promise<any[]> {
    const q = vendorId ? `?vendorId=${vendorId}` : '';
    return this.request(`/procurement/scorecards${q}`);
  }

  static async generateSupplierScorecard(payload: any): Promise<any> {
    return this.request('/procurement/scorecards/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async evaluateSupplierScorecard(payload: any): Promise<any> {
    return this.request('/procurement/scorecards/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getVendorPrepayments(vendorId?: string): Promise<any[]> {
    const q = vendorId ? `?vendorId=${vendorId}` : '';
    return this.request(`/procurement/prepayments${q}`);
  }

  static async recordVendorPrepayment(payload: any): Promise<any> {
    return this.request('/procurement/prepayments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async applyVendorPrepayment(payload: any): Promise<any> {
    return this.request('/procurement/prepayments/apply', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async applyPrepaymentToVoucher(payload: any): Promise<any> {
    return this.request('/procurement/prepayments/apply', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async runPhase32B08HardeningSuite(): Promise<any> {
    return this.request('/procurement/hardening/run-suite-32b08');
  }

  // ==================== PHASE 3.2C-01 ADVANCED ORDER-TO-CASH APIS ====================

  static async runPhase32C01HardeningSuite(): Promise<any> {
    return this.request('/sales/hardening/run-suite-32c01');
  }

  // Sales Contracts & Blanket Agreements
  static async getSalesContracts(customerId?: string, status?: string): Promise<any> {
    const params = new URLSearchParams();
    if (customerId) params.append('customerId', customerId);
    if (status) params.append('status', status);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/sales/contracts${q}`);
  }

  static async createSalesContract(payload: any): Promise<any> {
    return this.request('/sales/contracts', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async activateSalesContract(id: string, payload: any): Promise<any> {
    return this.request(`/sales/contracts/${id}/activate`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async executeContractDrawdown(id: string, payload: any): Promise<any> {
    return this.request(`/sales/contracts/${id}/drawdown`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async terminateSalesContract(id: string, payload: any): Promise<any> {
    return this.request(`/sales/contracts/${id}/terminate`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Customer Consignment Inventory
  static async getCustomerConsignmentStocks(customerId?: string): Promise<any> {
    const q = customerId ? `?customerId=${customerId}` : '';
    return this.request(`/sales/consignment/stocks${q}`);
  }

  static async getCustomerConsignmentMovements(): Promise<any> {
    return this.request('/sales/consignment/movements');
  }

  static async processConsignmentMovement(payload: any): Promise<any> {
    return this.request('/sales/consignment/movements', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Customer Volume Rebates
  static async getCustomerRebateAgreements(customerId?: string): Promise<any> {
    const q = customerId ? `?customerId=${customerId}` : '';
    return this.request(`/sales/rebates/agreements${q}`);
  }

  static async createCustomerRebateAgreement(payload: any): Promise<any> {
    return this.request('/sales/rebates/agreements', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async evaluateInvoiceRebates(payload: any): Promise<any> {
    return this.request('/sales/rebates/evaluate-invoice', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async settleRebateAgreement(id: string, payload: any): Promise<any> {
    return this.request(`/sales/rebates/${id}/settle`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Drop-Shipment Direct Vendor Delivery
  static async getDropShipmentOrders(): Promise<any> {
    return this.request('/sales/dropship/orders');
  }

  static async createDropShipmentOrder(payload: any): Promise<any> {
    return this.request('/sales/dropship/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async linkDropShipPurchaseOrder(id: string, payload: any): Promise<any> {
    return this.request(`/sales/dropship/orders/${id}/link-po`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async confirmDropShipVendorDispatch(id: string, payload: any): Promise<any> {
    return this.request(`/sales/dropship/orders/${id}/dispatch`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async confirmDropShipCustomerReceipt(id: string, payload: any): Promise<any> {
    return this.request(`/sales/dropship/orders/${id}/deliver`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Customer Credit Exposure Governance
  static async getCustomerCreditProfiles(): Promise<any> {
    return this.request('/sales/credit/profiles');
  }

  static async checkCustomerCredit(payload: any): Promise<any> {
    return this.request('/sales/credit/check', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async applyCustomerCreditOverride(payload: any): Promise<any> {
    return this.request('/sales/credit/override', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // ==========================================================================
  // P0-08 TENANT IDENTITY & WHITE-LABEL BRANDING RUNTIME
  // ==========================================================================

  static async getBranding(tenantId?: string, companyId?: string): Promise<{ success: boolean; branding: TenantBranding }> {
    const params = new URLSearchParams();
    if (tenantId) params.append('tenantId', tenantId);
    if (companyId) params.append('companyId', companyId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/branding${query}`);
  }

  static async getPublicBranding(tenantId: string): Promise<{ success: boolean; branding: BrandingPublicMetadata }> {
    return this.request(`/branding/public/${encodeURIComponent(tenantId)}`);
  }

  static async updateBranding(payload: Partial<TenantBranding>): Promise<{ success: boolean; branding: TenantBranding; auditHash: string }> {
    return this.request('/branding', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  static async resetBranding(companyId?: string): Promise<{ success: boolean; branding: TenantBranding; auditHash: string }> {
    return this.request('/branding/reset', {
      method: 'POST',
      body: JSON.stringify({ companyId })
    });
  }

  static async previewBranding(payload: Partial<TenantBranding>): Promise<BrandingValidationResult> {
    return this.request('/branding/preview', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async uploadBrandingAsset(payload: {
    assetType: 'logo' | 'darkLogo' | 'favicon' | 'documentHeader';
    fileName: string;
    mimeType: string;
    fileDataBase64: string;
    tenantId?: string;
  }): Promise<{ success: boolean; asset: TenantAssetMetadata }> {
    return this.request('/branding/assets', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getPlatformBranding(): Promise<{ success: boolean; platformIdentity: AMPlatformIdentity; platformBranding: TenantBranding }> {
    return this.request('/branding/platform');
  }
}



