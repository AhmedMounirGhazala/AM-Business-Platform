/**
 * Centralized Enterprise Configuration Engine (System Brain)
 * SAP/Oracle/Dynamics-grade hierarchical configuration framework with inheritance
 * Controls all system behavior, parameters, feature flags & localization without source code modification
 */

import {
  ConfigScopeLevel,
  FeatureFlag,
  FinancialConfig,
  GeneralSystemConfig,
  InventoryConfig,
  LocalizationPack,
  ProductEdition,
  PurchasingConfig,
  SalesConfig,
  SecurityConfig,
  SystemConfigValue
} from '../types';

export interface ConfigurationScope {
  tenantId: string;
  companyId?: string;
  branchId?: string;
  warehouseId?: string;
  departmentId?: string;
  userId?: string;
}

export class ConfigurationEngine {
  private static currentEdition: ProductEdition = 'Enterprise';

  // In-memory configuration store supporting hierarchical overrides
  private static configStore: SystemConfigValue[] = [
    // PLATFORM DEFAULTS
    {
      id: 'cfg-plat-001',
      scopeLevel: 'PLATFORM',
      scopeId: 'PLATFORM_DEFAULT',
      category: 'GENERAL',
      key: 'general.systemLanguage',
      value: 'en',
      dataType: 'string',
      description: 'Default platform system UI language',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'cfg-plat-002',
      scopeLevel: 'PLATFORM',
      scopeId: 'PLATFORM_DEFAULT',
      category: 'GENERAL',
      key: 'general.defaultCurrency',
      value: 'SAR',
      dataType: 'string',
      description: 'Default platform functional base currency',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'cfg-plat-003',
      scopeLevel: 'PLATFORM',
      scopeId: 'PLATFORM_DEFAULT',
      category: 'GENERAL',
      key: 'general.decimalPrecision',
      value: 2,
      dataType: 'number',
      description: 'Default financial calculation decimal precision',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'cfg-plat-004',
      scopeLevel: 'PLATFORM',
      scopeId: 'PLATFORM_DEFAULT',
      category: 'INVENTORY',
      key: 'inventory.defaultCostingMethod',
      value: 'FIFO',
      dataType: 'string',
      description: 'Default inventory valuation costing method',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'cfg-plat-005',
      scopeLevel: 'PLATFORM',
      scopeId: 'PLATFORM_DEFAULT',
      category: 'INVENTORY',
      key: 'inventory.negativeInventoryPolicy',
      value: 'BLOCK',
      dataType: 'string',
      description: 'Policy when inventory falls below zero',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'cfg-plat-006',
      scopeLevel: 'PLATFORM',
      scopeId: 'PLATFORM_DEFAULT',
      category: 'SALES',
      key: 'sales.discountPolicy',
      value: 'MAX_15_PERCENT_UNAPPROVED',
      dataType: 'string',
      description: 'Sales discount approval policy threshold',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'cfg-plat-007',
      scopeLevel: 'PLATFORM',
      scopeId: 'PLATFORM_DEFAULT',
      category: 'PURCHASING',
      key: 'purchasing.poApprovalLimit',
      value: 50000,
      dataType: 'number',
      description: 'Auto-approval threshold limit for POs',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'cfg-plat-008',
      scopeLevel: 'PLATFORM',
      scopeId: 'PLATFORM_DEFAULT',
      category: 'FINANCIAL',
      key: 'financial.coaStructure',
      value: 'STANDARD_4_LEVEL',
      dataType: 'string',
      description: 'Chart of accounts tree depth structure',
      updatedAt: '2026-01-01T00:00:00Z'
    },

    // TENANT OVERRIDES (ten-001)
    {
      id: 'cfg-ten-001',
      scopeLevel: 'TENANT',
      scopeId: 'ten-001',
      category: 'GENERAL',
      key: 'general.systemLanguage',
      value: 'en',
      dataType: 'string',
      description: 'Tenant specific language setting',
      updatedAt: '2026-08-01T00:00:00Z'
    },
    {
      id: 'cfg-ten-002',
      scopeLevel: 'TENANT',
      scopeId: 'ten-001',
      category: 'GENERAL',
      key: 'general.regionalLocalization',
      value: 'SA',
      dataType: 'string',
      description: 'Saudi Arabia ZATCA tax & compliance localization',
      updatedAt: '2026-08-01T00:00:00Z'
    }
  ];

  // Feature Flags Catalog
  private static featureFlags: FeatureFlag[] = [
    {
      featureKey: 'MODULE_ACCOUNTING_GL',
      featureName: 'General Ledger & Financial Accounting',
      description: 'Core double-entry GL, Chart of Accounts, Journal Entries & Financial Reports',
      minEditionRequired: 'Community',
      isEnabled: true
    },
    {
      featureKey: 'MODULE_SALES',
      featureName: 'Sales Management & Quotations',
      description: 'Quotations, Sales Orders, Customer Invoicing & Credit Limits',
      minEditionRequired: 'Community',
      isEnabled: true
    },
    {
      featureKey: 'MODULE_PURCHASING',
      featureName: 'Purchasing & Supplier Management',
      description: 'Purchase Orders, Goods Receipt Notes, Supplier Bills & Approvals',
      minEditionRequired: 'Community',
      isEnabled: true
    },
    {
      featureKey: 'MODULE_INVENTORY',
      featureName: 'Multi-Warehouse Inventory & Costing',
      description: 'Stock Movements, FIFO Costing, Serial/Batch tracking & Reorder points',
      minEditionRequired: 'Community',
      isEnabled: true
    },
    {
      featureKey: 'MODULE_HR_PAYROLL',
      featureName: 'HR & Payroll Management',
      description: 'Employee Directory, Leave Management, WPS Payroll & Department hierarchies',
      minEditionRequired: 'Professional',
      isEnabled: true
    },
    {
      featureKey: 'MODULE_CRM',
      featureName: 'Enterprise CRM & Pipeline',
      description: 'Leads, Opportunities, Sales Pipeline Kanban & Customer 360',
      minEditionRequired: 'Professional',
      isEnabled: true
    },
    {
      featureKey: 'MODULE_WORKFLOW_RULES',
      featureName: 'Multi-Level Workflow & Business Rules Engine',
      description: 'Configurable approval matrices, automated escalations & rule evaluation',
      minEditionRequired: 'Enterprise',
      isEnabled: true
    },
    {
      featureKey: 'MODULE_AI_ASSISTANT',
      featureName: 'Enterprise AI Assistant & Copilot',
      description: 'Natural language queries, anomaly detection, smart drafting & analytics',
      minEditionRequired: 'Enterprise',
      isEnabled: true
    },
    {
      featureKey: 'MODULE_BACKGROUND_JOBS',
      featureName: 'Automated Background Scheduler & Jobs Engine',
      description: 'Cron jobs, batch postings, recurring invoices & automated reminders',
      minEditionRequired: 'Enterprise',
      isEnabled: true
    }
  ];

  // Localization Packs Catalog
  private static localizationPacks: LocalizationPack[] = [
    {
      code: 'SA',
      countryName: 'Saudi Arabia',
      currency: 'SAR',
      taxPacks: [
        { name: 'ZATCA Standard VAT (15%)', defaultRate: 15, code: 'VAT15' },
        { name: 'Zero Rated VAT (0%)', defaultRate: 0, code: 'VAT0' },
        { name: 'Exempt VAT', defaultRate: 0, code: 'VAT_EXEMPT' }
      ],
      languagePacks: ['en', 'ar'],
      documentTemplates: [
        { templateId: 'zatca-tax-invoice-v2', templateName: 'ZATCA Phase 2 E-Invoice Standard' }
      ]
    },
    {
      code: 'AE',
      countryName: 'United Arab Emirates',
      currency: 'AED',
      taxPacks: [
        { name: 'UAE Standard VAT (5%)', defaultRate: 5, code: 'UAE_VAT5' },
        { name: 'Zero Rated VAT (0%)', defaultRate: 0, code: 'UAE_VAT0' }
      ],
      languagePacks: ['en', 'ar'],
      documentTemplates: [
        { templateId: 'uae-fta-tax-invoice', templateName: 'FTA Standard Tax Invoice' }
      ]
    }
  ];

  /**
   * Evaluate a specific config key with Hierarchical Inheritance:
   * USER -> DEPARTMENT -> WAREHOUSE -> BRANCH -> COMPANY -> TENANT -> PLATFORM
   */
  static getValue(key: string, scope: ConfigurationScope, defaultValue?: any): any {
    const hierarchy: { level: ConfigScopeLevel; id?: string }[] = [
      { level: 'USER', id: scope.userId },
      { level: 'DEPARTMENT', id: scope.departmentId },
      { level: 'WAREHOUSE', id: scope.warehouseId },
      { level: 'BRANCH', id: scope.branchId },
      { level: 'COMPANY', id: scope.companyId },
      { level: 'TENANT', id: scope.tenantId },
      { level: 'PLATFORM', id: 'PLATFORM_DEFAULT' }
    ];

    for (const h of hierarchy) {
      if (!h.id) continue;
      const match = this.configStore.find(c => c.scopeLevel === h.level && c.scopeId === h.id && c.key === key);
      if (match && match.value !== undefined) {
        return match.value;
      }
    }

    return defaultValue;
  }

  /**
   * Set or override a system parameter
   */
  static setValue(
    key: string,
    value: any,
    scopeLevel: ConfigScopeLevel,
    scopeId: string,
    category: SystemConfigValue['category'],
    dataType: SystemConfigValue['dataType'],
    description?: string,
    updatedBy: string = 'usr-001'
  ): SystemConfigValue {
    const existingIndex = this.configStore.findIndex(
      c => c.scopeLevel === scopeLevel && c.scopeId === scopeId && c.key === key
    );

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      this.configStore[existingIndex].value = value;
      this.configStore[existingIndex].updatedAt = now;
      this.configStore[existingIndex].updatedBy = updatedBy;
      return this.configStore[existingIndex];
    }

    const newConfig: SystemConfigValue = {
      id: `cfg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      scopeLevel,
      scopeId,
      category,
      key,
      value,
      dataType,
      description,
      updatedAt: now,
      updatedBy
    };

    this.configStore.push(newConfig);
    return newConfig;
  }

  /**
   * Get Computed General System Config for a given scope
   */
  static getGeneralConfig(scope: ConfigurationScope): GeneralSystemConfig {
    return {
      systemLanguage: this.getValue('general.systemLanguage', scope, 'en'),
      defaultCurrency: this.getValue('general.defaultCurrency', scope, 'SAR'),
      timeZone: this.getValue('general.timeZone', scope, 'Asia/Riyadh'),
      dateFormat: this.getValue('general.dateFormat', scope, 'YYYY-MM-DD'),
      numberFormat: this.getValue('general.numberFormat', scope, 'en-US'),
      decimalPrecision: this.getValue('general.decimalPrecision', scope, 2),
      defaultCompanyId: this.getValue('general.defaultCompanyId', scope, 'comp-001'),
      defaultBranchId: this.getValue('general.defaultBranchId', scope, 'br-001'),
      defaultWarehouseId: this.getValue('general.defaultWarehouseId', scope, 'wh-001'),
      theme: this.getValue('general.theme', scope, 'light'),
      direction: this.getValue('general.direction', scope, 'ltr'),
      regionalLocalization: this.getValue('general.regionalLocalization', scope, 'SA')
    };
  }

  /**
   * Get Computed Financial Config
   */
  static getFinancialConfig(scope: ConfigurationScope): FinancialConfig {
    return {
      coaStructure: this.getValue('financial.coaStructure', scope, 'STANDARD_4_LEVEL'),
      defaultReceivableAccountCode: this.getValue('financial.defaultReceivableAccountCode', scope, '1020'),
      defaultPayableAccountCode: this.getValue('financial.defaultPayableAccountCode', scope, '2010'),
      defaultTaxAccountCode: this.getValue('financial.defaultTaxAccountCode', scope, '2020'),
      defaultBankAccountCode: this.getValue('financial.defaultBankAccountCode', scope, '1010'),
      defaultRevenueAccountCode: this.getValue('financial.defaultRevenueAccountCode', scope, '4000'),
      defaultCostOfGoodsAccountCode: this.getValue('financial.defaultCostOfGoodsAccountCode', scope, '5000'),
      fiscalPeriodLocking: this.getValue('financial.fiscalPeriodLocking', scope, true),
      yearClosingPolicy: this.getValue('financial.yearClosingPolicy', scope, 'AUTOMATIC_RETAINED_EARNINGS'),
      openingBalancePolicy: this.getValue('financial.openingBalancePolicy', scope, 'REQUIRE_AUDIT_APPROVAL'),
      exchangeRatePolicy: this.getValue('financial.exchangeRatePolicy', scope, 'DAILY_CENTRAL_BANK'),
      multiCurrencyEnabled: this.getValue('financial.multiCurrencyEnabled', scope, true),
      roundingMethod: this.getValue('financial.roundingMethod', scope, 'HALF_EVEN'),
      journalApprovalThreshold: this.getValue('financial.journalApprovalThreshold', scope, 10000)
    };
  }

  /**
   * Get Computed Inventory Config
   */
  static getInventoryConfig(scope: ConfigurationScope): InventoryConfig {
    return {
      defaultCostingMethod: this.getValue('inventory.defaultCostingMethod', scope, 'FIFO'),
      negativeInventoryPolicy: this.getValue('inventory.negativeInventoryPolicy', scope, 'BLOCK'),
      reservationPolicy: this.getValue('inventory.reservationPolicy', scope, 'ON_SALES_ORDER'),
      backorderPolicy: this.getValue('inventory.backorderPolicy', scope, 'ALLOW'),
      lotTrackingEnabled: this.getValue('inventory.lotTrackingEnabled', scope, true),
      serialTrackingEnabled: this.getValue('inventory.serialTrackingEnabled', scope, true),
      expiryTrackingEnabled: this.getValue('inventory.expiryTrackingEnabled', scope, true),
      autoReplenishmentEnabled: this.getValue('inventory.autoReplenishmentEnabled', scope, true),
      physicalCountPolicy: this.getValue('inventory.physicalCountPolicy', scope, 'CYCLE_COUNT')
    };
  }

  /**
   * Get Computed Sales Config
   */
  static getSalesConfig(scope: ConfigurationScope): SalesConfig {
    return {
      quotationExpiryDays: this.getValue('sales.quotationExpiryDays', scope, 30),
      defaultPriceListId: this.getValue('sales.defaultPriceListId', scope, 'pl-001'),
      discountPolicy: this.getValue('sales.discountPolicy', scope, 'MAX_15_PERCENT_UNAPPROVED'),
      creditLimitEnforcement: this.getValue('sales.creditLimitEnforcement', scope, 'STRICT_BLOCK'),
      deliveryPolicy: this.getValue('sales.deliveryPolicy', scope, 'CREDIT_TERMS'),
      taxDefaultMethod: this.getValue('sales.taxDefaultMethod', scope, 'Exclusive'),
      customerApprovalRequired: this.getValue('sales.customerApprovalRequired', scope, false)
    };
  }

  /**
   * Get Computed Purchasing Config
   */
  static getPurchasingConfig(scope: ConfigurationScope): PurchasingConfig {
    return {
      poApprovalLimit: this.getValue('purchasing.poApprovalLimit', scope, 50000),
      vendorApprovalRequired: this.getValue('purchasing.vendorApprovalRequired', scope, true),
      receivingPolicy: this.getValue('purchasing.receivingPolicy', scope, 'ALLOW_TOLERANCE'),
      partialReceiptAllowed: this.getValue('purchasing.partialReceiptAllowed', scope, true),
      priceVarianceTolerancePercent: this.getValue('purchasing.priceVarianceTolerancePercent', scope, 5),
      threeWayInvoiceMatching: this.getValue('purchasing.threeWayInvoiceMatching', scope, true)
    };
  }

  /**
   * Get Computed Security Config
   */
  static getSecurityConfig(scope: ConfigurationScope): SecurityConfig {
    return {
      passwordMinLength: this.getValue('security.passwordMinLength', scope, 8),
      passwordRequireSpecialChar: this.getValue('security.passwordRequireSpecialChar', scope, true),
      sessionTimeoutMinutes: this.getValue('security.sessionTimeoutMinutes', scope, 60),
      twoFactorAuthRequired: this.getValue('security.twoFactorAuthRequired', scope, false),
      ipRestrictionEnabled: this.getValue('security.ipRestrictionEnabled', scope, false),
      allowedIpAddresses: this.getValue('security.allowedIpAddresses', scope, []),
      auditRetentionDays: this.getValue('security.auditRetentionDays', scope, 365)
    };
  }

  /**
   * Feature Flag Engine
   */
  static getFeatureFlags(edition: ProductEdition = this.currentEdition): FeatureFlag[] {
    const editionPriority: Record<ProductEdition, number> = {
      Community: 1,
      Professional: 2,
      Enterprise: 3
    };

    const currentPriority = editionPriority[edition];

    return this.featureFlags.map(f => ({
      ...f,
      isEnabled: f.isEnabled && editionPriority[f.minEditionRequired] <= currentPriority
    }));
  }

  static isFeatureEnabled(featureKey: string, edition: ProductEdition = this.currentEdition): boolean {
    const flags = this.getFeatureFlags(edition);
    const match = flags.find(f => f.featureKey === featureKey);
    return match ? match.isEnabled : false;
  }

  static setProductEdition(edition: ProductEdition): ProductEdition {
    this.currentEdition = edition;
    return this.currentEdition;
  }

  static getProductEdition(): ProductEdition {
    return this.currentEdition;
  }

  /**
   * Localization Packs
   */
  static getLocalizationPacks(): LocalizationPack[] {
    return this.localizationPacks;
  }

  static getLocalizationPack(code: string): LocalizationPack | undefined {
    return this.localizationPacks.find(p => p.code === code);
  }

  /**
   * Get Raw Config Store for UI Configuration Management
   */
  static getAllConfigValues(): SystemConfigValue[] {
    return this.configStore;
  }
}
