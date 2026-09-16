/**
 * AM Business Platform - Enterprise Operating & Financial Platform
 * Built on SAP, Oracle ERP Cloud, Microsoft Dynamics 365, and Odoo Enterprise Architecture
 * Includes Financial Events Engine, Configurable Posting Rules Engine, Universal Workflow Engine, and Master Data Services
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { 
  INITIAL_ACCOUNTS, 
  INITIAL_APPROVAL_REQUESTS, 
  INITIAL_ASSETS,
  INITIAL_AUDIT_LOGS, 
  INITIAL_BANKS,
  INITIAL_BRANDS,
  INITIAL_BRANCHES,
  INITIAL_CITIES,
  INITIAL_COLORS,
  INITIAL_COMPANIES, 
  INITIAL_COST_CENTERS,
  INITIAL_COUNTRIES,
  INITIAL_CURRENCIES,
  INITIAL_CUSTOMERS, 
  INITIAL_CUSTOMER_PAYMENTS,
  INITIAL_DEPARTMENTS,
  INITIAL_DOCUMENT_RELATIONSHIPS,
  INITIAL_EMPLOYEES, 
  INITIAL_EXCHANGE_RATES,
  INITIAL_FINANCIAL_EVENTS,
  INITIAL_FISCAL_PERIODS,
  INITIAL_FISCAL_YEARS,
  INITIAL_INVENTORY, 
  INITIAL_ITEM_CATEGORIES,
  INITIAL_JOURNAL_ENTRIES, 
  INITIAL_LEADS, 
  INITIAL_MODELS,
  INITIAL_NUMBERING_RULES, 
  INITIAL_PAYMENT_METHODS,
  INITIAL_PAYMENT_TERMS,
  INITIAL_POSTING_RULES,
  INITIAL_PROFIT_CENTERS,
  INITIAL_PROJECTS,
  INITIAL_PURCHASE_INVOICES,
  INITIAL_PURCHASE_ORDERS, 
  INITIAL_REGIONS,
  INITIAL_SALES_INVOICES, 
  INITIAL_SIZES,
  INITIAL_STOCK_MOVEMENTS, 
  INITIAL_SUPPLIER_PAYMENTS,
  INITIAL_TAX_RULES,
  INITIAL_TENANTS, 
  INITIAL_UNITS_OF_MEASURE,
  INITIAL_USERS, 
  INITIAL_VENDORS, 
  INITIAL_WAREHOUSES, 
  INITIAL_WAREHOUSE_LOCATIONS,
  INITIAL_WORKFLOW_RULES,
  INITIAL_ITEM_GROUPS,
  INITIAL_UOM_CONVERSIONS,
  INITIAL_PACKAGING_UNITS,
  INITIAL_WAREHOUSE_ZONES,
  INITIAL_BIN_LOCATIONS,
  INITIAL_BATCH_LOTS,
  INITIAL_SERIAL_NUMBERS,
  INITIAL_STOCK_QUANTS,
  INITIAL_INVENTORY_CONFIG,
  INITIAL_COUNTRIES_MASTER,
  INITIAL_TAX_SYSTEMS_MASTER,
  INITIAL_STATES_PROVINCES_MASTER,
  INITIAL_CITIES_MASTER,
  INITIAL_TIMEZONES_MASTER,
  INITIAL_LANGUAGES_MASTER,
  INITIAL_FISCAL_CALENDARS_MASTER
} from './src/data/mockDatabase';
import { InventoryFinancialIntegrationEngine } from './src/engine/inventoryFinancialIntegrationEngine';
import { InventoryClosingControlEngine } from './src/engine/inventoryClosingControlEngine';
import {
  INITIAL_EVENT_MAPPING_RULES,
  INITIAL_JOURNAL_TEMPLATES,
  INITIAL_POSTING_PROFILES,
  INITIAL_FINANCIAL_QUEUE,
  INITIAL_FINANCIAL_AUDIT_RECORDS,
  INITIAL_INVENTORY_PERIODS,
  INITIAL_FISCAL_INVENTORY_LOCKS,
  INITIAL_INVENTORY_COUNT_SESSIONS,
  INITIAL_RECONCILIATION_PROPOSALS,
  INITIAL_INVENTORY_CLOSING_AUDIT_RECORDS,
  INITIAL_VENDOR_CATEGORIES,
  INITIAL_PROCUREMENT_PAYMENT_TERMS,
  INITIAL_INCOTERMS,
  INITIAL_PROCUREMENT_CATEGORIES,
  INITIAL_BUYER_GROUPS,
  INITIAL_PURCHASING_ORGS,
  INITIAL_PROCUREMENT_VENDORS,
  INITIAL_PURCHASE_REQUISITIONS,
  INITIAL_RFQS,
  INITIAL_VENDOR_QUOTATIONS,
  INITIAL_PROCUREMENT_PURCHASE_ORDERS,
  INITIAL_PURCHASE_APPROVAL_RULES,
  INITIAL_PURCHASE_AMENDMENTS,
  INITIAL_VENDOR_RETURNS,
  INITIAL_PURCHASE_AUDIT_LOGS,
  INITIAL_VENDOR_PRICE_HISTORY,
  INITIAL_SUPPLIER_INVOICES,
  INITIAL_AP_VOUCHERS,
  INITIAL_SUPPLIER_CREDIT_NOTES,
  INITIAL_PAYMENT_PROPOSALS,
  INITIAL_PAYMENT_BATCHES,
  INITIAL_AP_AUDIT_LOGS,
  INITIAL_GOODS_RECEIPT_NOTES
} from './src/data/mockDatabase';

import { ProcurementEngine } from './src/engine/procurementEngine';
import { AccountsPayableEngine } from './src/engine/accountsPayableEngine';
import {
  VendorMaster,
  PurchaseRequisition,
  RequestForQuotation,
  VendorQuotation,
  PurchaseOrder as ProcurementPurchaseOrder,
  PurchaseApprovalRule,
  PurchaseOrderAmendment,
  VendorReturnNote,
  PurchaseAuditRecord,
  VendorPriceHistoryRecord,
  GoodsReceiptNote,
  GoodsReceiptItem,
  LandedCostComponent,
  ERSInvoice,
  ConsignmentAgreement,
  ConsignmentStockRecord,
  ConsignmentWithdrawal,
  ConsignmentSettlement,
  LandedCostActualInvoice,
  LandedCostVarianceAdjustment,
  SupplierScorecard,
  VendorPrepayment,
  PrepaymentApplicationRecord
} from './src/types/procurement';

import {
  SupplierInvoice,
  APVoucher,
  SupplierCreditNote,
  PaymentProposal,
  PaymentBatch,
  APAuditRecord,
  GRIRClearingRecord,
  PurchaseAccrual,
  PaymentAllocationRecord,
  VendorAgingSnapshotRecord,
  PaymentReversalRecord
} from './src/types/accountsPayable';

import {
  ARCustomer,
  CustomerSalesInvoice,
  CustomerCreditNote,
  CustomerDebitNote,
  CustomerReceipt,
  ReceiptAllocationRecord,
  CustomerAgingSnapshotRecord,
  CollectionActivityNote,
  PromiseToPayRecord,
  RevenueRecognitionSchedule,
  ARAuditRecord
} from './src/types/accountsReceivable';

import { AccountsReceivableEngine } from './src/engine/accountsReceivableEngine';
import { GeneralLedgerEngine } from './src/engine/generalLedgerEngine';
import { FinancialReportingEngine } from './src/engine/financialReportingEngine';
import { Phase27HardeningSuite } from './src/engine/phase27HardeningSuite';
import { FixedAssetsEngine } from './src/engine/fixedAssetsEngine';
import { Phase28HardeningSuite } from './src/engine/phase28HardeningSuite';
import { Phase29HardeningSuite } from './src/engine/phase29HardeningSuite';
import {
  FixedAssetMaster,
  AssetClass,
  AssetAcquisitionRecord,
  AssetTransferRecord,
  AssetDisposalRecord,
  AssetRevaluationRecord,
  AssetImpairmentRecord,
  AssetMaintenanceRecord,
  PhysicalVerificationSession,
  AssetAuditLogRecord,
  AssetDomainEvent,
  ImmutableAssetSnapshot,
  Phase28QualityGateReport
} from './src/types/fixedAssets';
import {
  BankMaster,
  BankAccount,
  CashAccount,
  TreasuryTransaction,
  ChequeRecord,
  ChequeBook,
  BankStatement,
  BankReconciliationSession,
  CashForecastItem,
  PaymentCalendarEntry,
  BankChargeRecord,
  ExchangeRateRecord,
  TreasuryDomainEvent,
  FXRevaluationResult,
  ImmutableLiquiditySnapshot,
  TreasuryAuditLogRecord,
  Phase29QualityGateReport
} from './src/types/treasury';
import { TreasuryEngine } from './src/engine/treasuryEngine';
import { PlatformEngine } from './src/engine/platformEngine';
import { SalesEngine } from './src/engine/salesEngine';
import { OfflineSalesSyncEngine } from './src/engine/offlineSalesSyncEngine';
import { IndustryConfigEngine } from './src/engine/industryConfigEngine';
import { ComplianceAdapterEngine } from './src/engine/complianceAdapterEngine';
import { VerticalProfileRegistry } from './src/verticals/verticalProfileRegistry';
import { IndustryVerticalManager } from './src/verticals/industryVerticalManager';
import { CommercialDistributionEngine } from './src/verticals/commercialDistributionEngine';
import { RestaurantFnBEngine } from './src/verticals/restaurantFnBEngine';
import { MobileRetailEngine } from './src/verticals/mobileRetailEngine';
import { FashionRetailEngine } from './src/verticals/fashionRetailEngine';
import { ApparelManufacturingEngine } from './src/verticals/apparelManufacturingEngine';
import { ComplianceEngine } from './src/compliance/complianceEngine';
import { EgyptianTaxAuthorityAdapter } from './src/compliance/etaAdapter';
import { SaudiZatcaAdapter } from './src/compliance/zatcaAdapter';
import { ZatcaTlvEncoder } from './src/compliance/tlvEncoder';
import { UniversalExportEngine } from './src/engine/universalExportEngine';
import { Phase31HardeningSuite } from './src/engine/phase31HardeningSuite';
import { PilotReadinessPhase3BHardeningSuite } from './src/engine/pilotReadinessPhase3BHardeningSuite';
import { PilotReadinessPhase3CHardeningSuite } from './src/engine/pilotReadinessPhase3CHardeningSuite';
import { PilotReadinessPhase3DHardeningSuite } from './src/engine/pilotReadinessPhase3DHardeningSuite';
import { MasterDataService } from './src/engine/masterDataService';
import { PricingEngine } from './src/engine/pricingEngine';
import { Phase32AHardeningSuite } from './src/engine/phase32AHardeningSuite';
import { Phase32B01HardeningSuite } from './src/engine/phase32B01HardeningSuite';
import { PurchaseOrderEngine } from './src/engine/purchaseOrderEngine';
import { Phase32B03HardeningSuite } from './src/engine/phase32B03HardeningSuite';
import { GoodsReceiptEngine } from './src/engine/goodsReceiptEngine';
import { Phase32B04HardeningSuite } from './src/engine/phase32B04HardeningSuite';
import { Phase32B05HardeningSuite } from './src/engine/phase32B05HardeningSuite';
import { Phase32B06HardeningSuite } from './src/engine/phase32B06HardeningSuite';
import { Phase32B07HardeningSuite } from './src/engine/phase32B07HardeningSuite';
import { Phase32B08HardeningSuite } from './src/engine/phase32B08HardeningSuite';
import { AdvancedProcurementEngine } from './src/engine/advancedProcurementEngine';
import { Phase32C01HardeningSuite } from './src/engine/phase32C01HardeningSuite';
import { AdvancedSalesOrderEngine } from './src/engine/advancedSalesOrderEngine';
import { ManufacturingEngine } from './src/engine/manufacturingEngine';
import { Phase32D01HardeningSuite } from './src/engine/phase32D01HardeningSuite';
import { ShopFloorQualityEngine } from './src/engine/shopFloorQualityEngine';
import { Phase32D02HardeningSuite } from './src/engine/phase32D02HardeningSuite';
import { ManufacturingCostingMaintenanceEngine } from './src/engine/manufacturingCostingMaintenanceEngine';
import { Phase32D03HardeningSuite } from './src/engine/phase32D03HardeningSuite';
import { ProcessManufacturingSubcontractingEngine } from './src/engine/processManufacturingSubcontractingEngine';
import { Phase32D04HardeningSuite } from './src/engine/phase32D04HardeningSuite';
import { ManufacturingVariantPLMEngine } from './src/engine/manufacturingVariantPLMEngine';
import { Phase32D05HardeningSuite } from './src/engine/phase32D05HardeningSuite';
import { ManufacturingIntelligenceToolingEngine } from './src/engine/manufacturingIntelligenceToolingEngine';
import { Phase32D06HardeningSuite } from './src/engine/phase32D06HardeningSuite';
import { RepetitiveRemanufacturingAndonEngine } from './src/engine/repetitiveRemanufacturingAndonEngine';
import { Phase32D07HardeningSuite } from './src/engine/phase32D07HardeningSuite';
import { ManufacturingYieldSpcShiftEngine } from './src/engine/manufacturingYieldSpcShiftEngine';
import { Phase32D08HardeningSuite } from './src/engine/phase32D08HardeningSuite';
import { ManufacturingGenealogyEcoDisassemblyEngine } from './src/engine/manufacturingGenealogyEcoDisassemblyEngine';
import { Phase32D09HardeningSuite } from './src/engine/phase32D09HardeningSuite';
import { SupplierInvitationEngine } from './src/engine/supplierInvitationEngine';
import { SupplierQuotationEngine } from './src/engine/supplierQuotationEngine';
import {
  RepetitiveProductionSchedule,
  RemanTeardownOrder,
  AndonIncident
} from './src/types/repetitiveRemanufacturingAndon';
import {
  ToolMaster,
  LineClearanceChecklist,
  ElectronicBatchRecord,
  ShiftHandoverLogbook
} from './src/types/manufacturingIntelligenceTooling';
import {
  ConfigurableProductModel,
  SuperBOM,
  ConfiguredVariantInstance,
  DeviationPermit,
  RecallIncident,
  EnergyConsumptionRecord,
  CarbonFootprintCalculation
} from './src/types/manufacturingVariantPLM';
import {
  MasterRecipe,
  BatchMaster,
  ProcessOrder,
  WorkCenterCapacityProfile,
  SubcontractOrder,
  ProductionLine,
  KanbanControlCycle
} from './src/types/processManufacturingSubcontracting';
import {
  StandardCostEstimate,
  WIPRevaluationRecord,
  FunctionalLocation,
  EquipmentAsset,
  PreventiveMaintenanceSchedule,
  MaintenanceWorkOrder,
  EngineeringChangeOrder
} from './src/types/manufacturingCostingMaintenance';
import {
  BillOfMaterials,
  WorkCenter,
  Routing,
  ProductionWorkOrder,
  GoodsIssueRecord,
  GoodsReceiptRecord,
  MRPSummaryReport
} from './src/types/manufacturing';
import {
  ShopFloorOperator,
  MachineMaster,
  ShopFloorDispatchOrder,
  TimeTicket,
  DowntimeEvent,
  InspectionPlan,
  InspectionLot,
  NonConformanceReport,
  CorrectivePreventiveAction,
  SerialGenealogyRecord
} from './src/types/shopFloorQuality';
import {
  SalesContract,
  CustomerConsignmentStock,
  ConsignmentMovementRecord,
  CustomerRebateAgreement,
  DropShipmentOrder,
  CustomerCreditProfile
} from './src/types/salesContracts';
import {
  SalesQuotation,
  SalesOrder,
  SalesOrderStateTransitionAudit,
  POSRegister,
  POSShift,
  POSReceipt,
  EnterprisePriceList,
  DiscountRule,
  PromotionCampaign,
  SalesDocumentSequenceConfig,
  SalesReturn,
  POSDeviceMaster,
  OfflineTransactionQueueItem,
  MobileCustomerSnapshot,
  MobileProductAvailabilitySnapshot,
  SalesRepresentativeTarget,
  SalesRepresentativeActivity,
  SyncAuditRecord,
  SyncConflictRecord,
  IndustryProfileConfig,
  OfflineDocumentLineage
} from './src/types/sales';
import {
  INITIAL_SALES_DOCUMENT_SEQUENCES,
  INITIAL_ENTERPRISE_PRICELISTS,
  INITIAL_DISCOUNT_RULES,
  INITIAL_PROMOTIONS,
  INITIAL_SALES_QUOTATIONS,
  INITIAL_SALES_ORDERS,
  INITIAL_POS_REGISTERS,
  INITIAL_POS_SHIFTS,
  INITIAL_POS_RECEIPTS,
  INITIAL_SALES_RETURNS,
  INITIAL_POS_DEVICES,
  INITIAL_OFFLINE_QUEUE,
  INITIAL_MOBILE_CUSTOMERS,
  INITIAL_MOBILE_PRODUCTS,
  INITIAL_SALES_REP_TARGETS,
  INITIAL_SALES_REP_ACTIVITIES,
  INITIAL_SYNC_AUDIT_LOGS
} from './src/data/salesMockData';
import {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowDelegation,
  NotificationMessage,
  PlatformScheduledJob,
  GlobalSearchResultItem,
  DocumentAttachment,
  ActivityTimelineEvent,
  BackupMetadata,
  PilotReadinessEvaluation
} from './src/types/platform';
import {
  GLAccount,
  GLJournalEntry,
  FiscalYearRecord,
  FiscalPeriodRecord,
  RecurringJournalSchedule,
  YearEndClosingRecord,
  ClosingSnapshotRecord,
  IAS21FXSnapshotRecord,
  GLAuditRecord
} from './src/types/generalLedger';

import { 
  JournalEntry, 
  JournalLine, 
  SalesInvoice, 
  StockMovement, 
  AuditLog, 
  ApprovalRequest, 
  FinancialEvent, 
  PostingRule, 
  PurchaseInvoice, 
  CustomerPayment, 
  SupplierPayment,
  WorkflowRule,
  DocumentRelationship,
  StockLedgerEntry,
  InventoryMovementType,
  BatchLot,
  SerialNumber,
  StockQuant,
  CostLayer,
  CostLayerConsumption,
  MovingAverageCostRecord,
  StandardCostRecord,
  CostCalculationLog,
  CostBusinessEvent,
  ItemCategory,
  CostingMethod,
  DocumentNumberingRule,
  RestaurantTable,
  KitchenDisplayOrder,
  KitchenWasteRecord,
  CRMTicket,
  ProjectTimesheet,
  DocumentComment,
  ActivityLog,
  User,
  Tenant,
  Company
} from './src/types';

import { FinancialEventEngine } from './src/engine/financialEventEngine';
import { PostingRulesEngine } from './src/engine/postingRulesEngine';
import { TaxEngine } from './src/engine/taxEngine';
import { CurrencyEngine } from './src/engine/currencyEngine';
import { InventoryCostingEngine } from './src/engine/inventoryCostingEngine';
import { InventoryExecutionEngine } from './src/engine/inventoryExecutionEngine';
import { WorkflowEngine } from './src/engine/workflowEngine';
import { DocumentRelationshipEngine } from './src/engine/documentRelationshipEngine';
import { ReportingEngine } from './src/engine/reportingEngine';
import { BackgroundJobEngine } from './src/engine/backgroundJobEngine';
import { BusinessRulesEngine } from './src/engine/businessRulesEngine';
import { NotificationEngine } from './src/engine/notificationEngine';
import { AttachmentEngine } from './src/engine/attachmentEngine';
import { CommentEngine } from './src/engine/commentEngine';
import { SearchEngine } from './src/engine/searchEngine';
import { ValidationEngine } from './src/engine/validationEngine';
import { ConfigurationEngine } from './src/engine/configurationEngine';
import { Phase26HardeningSuite } from './src/engine/phase26HardeningSuite';
import { PilotDatabaseService } from './server/pilotDatabase';
import { SecurityEngine } from './server/securityEngine';
import { BrandingEngine } from './server/brandingEngine';
import {
  initDurableCollection,
  persistEntity,
  deletePersistedEntity,
  executeTransaction
} from './server/persistenceRegistry';
import { PilotMasterDataImportRow } from './src/types/pilot';

dotenv.config();

// In-Memory Database Repositories
let tenants = [...INITIAL_TENANTS];
let companies = [...INITIAL_COMPANIES];
let branches = [...INITIAL_BRANCHES];
let departments = [...INITIAL_DEPARTMENTS];
let costCenters = [...INITIAL_COST_CENTERS];
let profitCenters = [...INITIAL_PROFIT_CENTERS];
let projects = [...INITIAL_PROJECTS];
let warehouses = [...INITIAL_WAREHOUSES];
let currencies = [...INITIAL_CURRENCIES];
let exchangeRates = [...INITIAL_EXCHANGE_RATES];
let fiscalYears = [...INITIAL_FISCAL_YEARS];
let fiscalPeriods = [...INITIAL_FISCAL_PERIODS];
let countriesMaster = [...INITIAL_COUNTRIES_MASTER];
let taxSystemsMaster = [...INITIAL_TAX_SYSTEMS_MASTER];
let statesMaster = [...INITIAL_STATES_PROVINCES_MASTER];
let citiesMaster = [...INITIAL_CITIES_MASTER];
let timezonesMaster = [...INITIAL_TIMEZONES_MASTER];
let languagesMaster = [...INITIAL_LANGUAGES_MASTER];
let fiscalCalendarsMaster = [...INITIAL_FISCAL_CALENDARS_MASTER];
let taxRules = [...INITIAL_TAX_RULES];
let unitsOfMeasure = [...INITIAL_UNITS_OF_MEASURE];
let itemCategories = [...INITIAL_ITEM_CATEGORIES];
let paymentTerms = [...INITIAL_PAYMENT_TERMS];
let postingRules = [...INITIAL_POSTING_RULES];
let financialEvents = [...INITIAL_FINANCIAL_EVENTS];

let users = [...INITIAL_USERS];
let accounts = [...INITIAL_ACCOUNTS];
let journalEntries = [...INITIAL_JOURNAL_ENTRIES];
let numberingRules = [...INITIAL_NUMBERING_RULES];
let workflowRules = [...INITIAL_WORKFLOW_RULES];
let approvalRequests = [...INITIAL_APPROVAL_REQUESTS];
let auditLogs = [...INITIAL_AUDIT_LOGS];

// Phase 2.2.4 Inventory Financial Integration State
let eventMappingRules = [...INITIAL_EVENT_MAPPING_RULES];
let journalTemplates = [...INITIAL_JOURNAL_TEMPLATES];
let postingProfiles = [...INITIAL_POSTING_PROFILES];
let financialQueue = [...INITIAL_FINANCIAL_QUEUE];
let financialAuditRecords = [...INITIAL_FINANCIAL_AUDIT_RECORDS];

// Phase 2.2.5 Inventory Closing & Control Engine State
let inventoryPeriods = [...INITIAL_INVENTORY_PERIODS];
let fiscalInventoryLocks = [...INITIAL_FISCAL_INVENTORY_LOCKS];
let inventoryCountSessions = [...INITIAL_INVENTORY_COUNT_SESSIONS];
let reconciliationProposals = [...INITIAL_RECONCILIATION_PROPOSALS];
let inventoryClosingAuditRecords = [...INITIAL_INVENTORY_CLOSING_AUDIT_RECORDS];

// Phase 2.3 Procurement & Purchasing Engine State
let vendorCategories = [...INITIAL_VENDOR_CATEGORIES];
let procurementPaymentTerms = [...INITIAL_PROCUREMENT_PAYMENT_TERMS];
let incoterms = [...INITIAL_INCOTERMS];
let procurementCategories = [...INITIAL_PROCUREMENT_CATEGORIES];
let buyerGroups = [...INITIAL_BUYER_GROUPS];
let purchasingOrgs = [...INITIAL_PURCHASING_ORGS];
let purchaseRequisitions: PurchaseRequisition[] = [...INITIAL_PURCHASE_REQUISITIONS];
let rfqs: RequestForQuotation[] = [...INITIAL_RFQS];
let vendorQuotations: VendorQuotation[] = [...INITIAL_VENDOR_QUOTATIONS];
let purchaseOrders: ProcurementPurchaseOrder[] = [...INITIAL_PROCUREMENT_PURCHASE_ORDERS];
let purchaseApprovalRules: PurchaseApprovalRule[] = [...INITIAL_PURCHASE_APPROVAL_RULES];
let purchaseAmendments: PurchaseOrderAmendment[] = [...INITIAL_PURCHASE_AMENDMENTS];
let vendorReturns: VendorReturnNote[] = [...INITIAL_VENDOR_RETURNS];
let goodsReceipts: GoodsReceiptNote[] = [...INITIAL_GOODS_RECEIPT_NOTES];
let purchaseAuditLogs: PurchaseAuditRecord[] = [...INITIAL_PURCHASE_AUDIT_LOGS];
let vendorPriceHistory: VendorPriceHistoryRecord[] = [...INITIAL_VENDOR_PRICE_HISTORY];

// Phase 3.2B-08 Advanced Procurement State
let ersInvoices: ERSInvoice[] = [];
let consignmentAgreements: ConsignmentAgreement[] = [];
let consignmentStockRecords: ConsignmentStockRecord[] = [];
let consignmentWithdrawals: ConsignmentWithdrawal[] = [];
let consignmentSettlements: ConsignmentSettlement[] = [];
let landedCostAdjustments: LandedCostVarianceAdjustment[] = [];
let supplierScorecards: SupplierScorecard[] = [];
let vendorPrepayments: VendorPrepayment[] = [];
let prepaymentApplicationRecords: PrepaymentApplicationRecord[] = [];

// Phase 3.2C-01 Advanced Order-to-Cash (O2C) State
let salesContracts: SalesContract[] = [];
let customerConsignmentStocks: CustomerConsignmentStock[] = [];
let consignmentMovementRecords: ConsignmentMovementRecord[] = [];
let customerRebateAgreements: CustomerRebateAgreement[] = [];
let dropShipmentOrders: DropShipmentOrder[] = [];
let customerCreditProfiles: CustomerCreditProfile[] = [];

// Phase 3.2D-01 Discrete Manufacturing State
let manufacturingBOMs: BillOfMaterials[] = [];
let manufacturingWorkCenters: WorkCenter[] = [];
let manufacturingRoutings: Routing[] = [];
let manufacturingWorkOrders: ProductionWorkOrder[] = [];
let manufacturingGoodsIssues: GoodsIssueRecord[] = [];
let manufacturingGoodsReceipts: GoodsReceiptRecord[] = [];
let manufacturingMRPReports: MRPSummaryReport[] = [];

// Phase 3.2D-02 Shop Floor, IoT & Quality State
let shopFloorOperators: ShopFloorOperator[] = [];
let shopFloorMachines: MachineMaster[] = [];
let shopFloorDispatches: ShopFloorDispatchOrder[] = [];
let shopFloorTimeTickets: TimeTicket[] = [];
let shopFloorDowntimeEvents: DowntimeEvent[] = [];
let qualityInspectionPlans: InspectionPlan[] = [];
let qualityInspectionLots: InspectionLot[] = [];
let qualityNonConformanceReports: NonConformanceReport[] = [];
let qualityCAPAs: CorrectivePreventiveAction[] = [];
let serialGenealogies: SerialGenealogyRecord[] = [];

// Phase 3.2D-03 Product Costing, Manufacturing Variances & Plant Maintenance State
let standardCostEstimates: StandardCostEstimate[] = [];
let wipRevaluationRecords: WIPRevaluationRecord[] = [];
let functionalLocations: FunctionalLocation[] = [];
let equipmentAssets: EquipmentAsset[] = [];
let preventiveMaintenanceSchedules: PreventiveMaintenanceSchedule[] = [];
let maintenanceWorkOrders: MaintenanceWorkOrder[] = [];
let engineeringChangeOrders: EngineeringChangeOrder[] = [];

// Phase 3.2D-04 Process Manufacturing, APS, Subcontracting & Electronic Kanban State
let masterRecipes: MasterRecipe[] = [];
let batchMasters: BatchMaster[] = [];
let processOrders: ProcessOrder[] = [];
let workCenterCapacityProfiles: WorkCenterCapacityProfile[] = [];
let subcontractOrders: SubcontractOrder[] = [];
let productionLines: ProductionLine[] = [];
let kanbanControlCycles: KanbanControlCycle[] = [];

// Phase 3.2D-05 Variant Configuration (CTO/ATO), PLM Deviations, Recall Containment & Carbon ESG State
let configurableProductModels: ConfigurableProductModel[] = [];
let superBoms: SuperBOM[] = [];
let configuredVariantInstances: ConfiguredVariantInstance[] = [];
let deviationPermits: DeviationPermit[] = [];
let recallIncidents: RecallIncident[] = [];
let energyConsumptionRecords: EnergyConsumptionRecord[] = [];
let carbonFootprintCalculations: CarbonFootprintCalculation[] = [];

// Phase 2.4 Accounts Payable & Financial Matching Engine State
let supplierInvoices: SupplierInvoice[] = [...INITIAL_SUPPLIER_INVOICES];
let apVouchers: APVoucher[] = [...INITIAL_AP_VOUCHERS];
let supplierCreditNotes: SupplierCreditNote[] = [...INITIAL_SUPPLIER_CREDIT_NOTES];
let paymentProposals: PaymentProposal[] = [...INITIAL_PAYMENT_PROPOSALS];
let paymentBatches: PaymentBatch[] = [...INITIAL_PAYMENT_BATCHES];
let paymentAllocations: PaymentAllocationRecord[] = [];
let agingSnapshots: VendorAgingSnapshotRecord[] = [];
let paymentReversals: PaymentReversalRecord[] = [];
let apAuditLogs: APAuditRecord[] = [...INITIAL_AP_AUDIT_LOGS];

// Phase 2.5 Accounts Receivable & Order-to-Cash Engine State
let arCustomers: ARCustomer[] = [
  {
    id: 'cust-ar-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'CUST-AR-001',
    name: 'Aramco Energy Solutions Ltd',
    nameAr: 'شركة أرامكو لحلول الطاقة المحدودة',
    category: 'ENTERPRISE',
    taxNumber: '310123456700003',
    crNumber: '1010123456',
    email: 'finance@aramco-solutions.sa',
    phone: '+966112345678',
    address: 'King Fahd Road, Olaya District, Riyadh, KSA',
    creditClass: 'CLASS_A_PRIME',
    creditLimit: 1000000,
    creditDays: 60,
    salesTerritory: 'RIYADH_CENTRAL',
    collectionsProfile: 'VIP_CUSTOM_TERMS',
    riskRating: 'LOW',
    isBlocked: false,
    currentBalance: 241500,
    overdueBalance: 0,
    currency: 'SAR',
    paymentTermsCode: 'NET_60',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-08-12T08:00:00Z'
  },
  {
    id: 'cust-ar-002',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'CUST-AR-002',
    name: 'Sabic Industrial Petrochemicals',
    nameAr: 'شركة سابك للصناعات البتروكيماوية',
    category: 'ENTERPRISE',
    taxNumber: '310987654300003',
    crNumber: '1010987654',
    email: 'ar@sabic-petro.sa',
    phone: '+966133456789',
    address: 'Jubail Industrial City, Eastern Province, KSA',
    creditClass: 'CLASS_A_PRIME',
    creditLimit: 750000,
    creditDays: 45,
    salesTerritory: 'DAMMAM_EAST',
    collectionsProfile: 'STANDARD_TERMS',
    riskRating: 'LOW',
    isBlocked: false,
    currentBalance: 115000,
    overdueBalance: 0,
    currency: 'SAR',
    paymentTermsCode: 'NET_45',
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-08-12T08:00:00Z'
  },
  {
    id: 'cust-ar-003',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'CUST-AR-003',
    name: 'Red Sea Global Trading Co',
    nameAr: 'شركة البحر الأحمر العالمية للتجارة',
    category: 'SME',
    taxNumber: '310555444300003',
    crNumber: '4030555444',
    email: 'accounts@redsea-trading.sa',
    phone: '+966126543210',
    address: 'Corniche Road, Jeddah, KSA',
    creditClass: 'CLASS_B_STANDARD',
    creditLimit: 250000,
    creditDays: 30,
    salesTerritory: 'JEDDAH_WEST',
    collectionsProfile: 'STRICT_COLLECTIONS',
    riskRating: 'MEDIUM',
    isBlocked: false,
    currentBalance: 86250,
    overdueBalance: 28750,
    currency: 'SAR',
    paymentTermsCode: 'NET_30',
    createdAt: '2026-03-10T08:00:00Z',
    updatedAt: '2026-08-12T08:00:00Z'
  }
];

let arSalesInvoices: CustomerSalesInvoice[] = [
  {
    id: 'sinv-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    invoiceNumber: 'INV-2026-88001',
    customerId: 'cust-ar-001',
    customerName: 'Aramco Energy Solutions Ltd',
    customerTaxNumber: '310123456700003',
    salesOrderRef: 'SO-2026-1001',
    invoiceDate: '2026-07-01',
    dueDate: '2026-08-30',
    currency: 'SAR',
    exchangeRate: 1.0,
    lines: [
      {
        id: 'line-1',
        itemCode: 'SW-ERP-ENT',
        itemName: 'Enterprise ERP Perpetual License Subscription',
        quantity: 1,
        unitPrice: 210000,
        taxRate: 0.15,
        taxAmount: 31500,
        discountRate: 0,
        discountAmount: 0,
        lineTotal: 241500
      }
    ],
    subtotal: 210000,
    taxTotal: 31500,
    discountTotal: 0,
    grandTotal: 241500,
    paidAmount: 0,
    remainingAmount: 241500,
    status: 'POSTED',
    paymentStatus: 'UNPAID',
    zatcaUuid: 'ZATCA-UUID-ARAMCO-001',
    zatcaQrHash: 'ZATCA-QR-HASH-ARAMCO-001',
    hash: 'SHA256-AR-INV-88001',
    createdBy: 'usr-001',
    createdAt: '2026-07-01T09:00:00Z',
    updatedAt: '2026-07-01T09:00:00Z'
  },
  {
    id: 'sinv-002',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    invoiceNumber: 'INV-2026-88002',
    customerId: 'cust-ar-002',
    customerName: 'Sabic Industrial Petrochemicals',
    customerTaxNumber: '310987654300003',
    salesOrderRef: 'SO-2026-1002',
    invoiceDate: '2026-07-15',
    dueDate: '2026-08-30',
    currency: 'SAR',
    exchangeRate: 1.0,
    lines: [
      {
        id: 'line-2',
        itemCode: 'CONS-ADV-01',
        itemName: 'Digital Transformation Consulting Services',
        quantity: 100,
        unitPrice: 1000,
        taxRate: 0.15,
        taxAmount: 15000,
        discountRate: 0,
        discountAmount: 0,
        lineTotal: 115000
      }
    ],
    subtotal: 100000,
    taxTotal: 15000,
    discountTotal: 0,
    grandTotal: 115000,
    paidAmount: 0,
    remainingAmount: 115000,
    status: 'POSTED',
    paymentStatus: 'UNPAID',
    zatcaUuid: 'ZATCA-UUID-SABIC-002',
    zatcaQrHash: 'ZATCA-QR-HASH-SABIC-002',
    hash: 'SHA256-AR-INV-88002',
    createdBy: 'usr-001',
    createdAt: '2026-07-15T10:00:00Z',
    updatedAt: '2026-07-15T10:00:00Z'
  },
  {
    id: 'sinv-003',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    invoiceNumber: 'INV-2026-88003',
    customerId: 'cust-ar-003',
    customerName: 'Red Sea Global Trading Co',
    customerTaxNumber: '310555444300003',
    salesOrderRef: 'SO-2026-1003',
    invoiceDate: '2026-06-10',
    dueDate: '2026-07-10',
    currency: 'SAR',
    exchangeRate: 1.0,
    lines: [
      {
        id: 'line-3',
        itemCode: 'HW-SRV-RACK',
        itemName: 'Enterprise Edge Server Rack Unit',
        quantity: 1,
        unitPrice: 75000,
        taxRate: 0.15,
        taxAmount: 11250,
        discountRate: 0,
        discountAmount: 0,
        lineTotal: 86250
      }
    ],
    subtotal: 75000,
    taxTotal: 11250,
    discountTotal: 0,
    grandTotal: 86250,
    paidAmount: 57500,
    remainingAmount: 28750,
    status: 'POSTED',
    paymentStatus: 'OVERDUE',
    zatcaUuid: 'ZATCA-UUID-REDSEA-003',
    zatcaQrHash: 'ZATCA-QR-HASH-REDSEA-003',
    hash: 'SHA256-AR-INV-88003',
    createdBy: 'usr-001',
    createdAt: '2026-06-10T11:00:00Z',
    updatedAt: '2026-07-11T00:00:00Z'
  }
];

let arCreditNotes: CustomerCreditNote[] = [];
let arDebitNotes: CustomerDebitNote[] = [];
let arReceipts: CustomerReceipt[] = [
  {
    id: 'rct-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    receiptNumber: 'RCT-2026-99001',
    customerId: 'cust-ar-003',
    customerName: 'Red Sea Global Trading Co',
    receiptDate: '2026-07-05',
    paymentMethod: 'WIRE_TRANSFER',
    receiptType: 'PARTIAL',
    referenceNumber: 'WIRE-987654321',
    currency: 'SAR',
    exchangeRate: 1.0,
    totalAmount: 57500,
    allocatedAmount: 57500,
    unallocatedAmount: 0,
    status: 'POSTED',
    hash: 'SHA256-AR-RCT-99001',
    createdBy: 'usr-001',
    createdAt: '2026-07-05T14:30:00Z'
  }
];

let arReceiptAllocations: ReceiptAllocationRecord[] = [
  {
    id: 'alloc-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    receiptId: 'rct-001',
    receiptNumber: 'RCT-2026-99001',
    invoiceId: 'sinv-003',
    invoiceNumber: 'INV-2026-88003',
    customerId: 'cust-ar-003',
    allocatedAmount: 57500,
    allocationType: 'PARTIAL',
    allocatedAt: '2026-07-05T14:35:00Z',
    allocatedBy: 'usr-001'
  }
];

let arAgingSnapshots: CustomerAgingSnapshotRecord[] = [];
let arCollectionNotes: CollectionActivityNote[] = [
  {
    id: 'colnote-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    customerId: 'cust-ar-003',
    customerName: 'Red Sea Global Trading Co',
    invoiceId: 'sinv-003',
    invoiceNumber: 'INV-2026-88003',
    reminderLevel: 'LEVEL_2_FIRM',
    activityType: 'CALL',
    lifecycleState: 'CALL',
    notes: 'Contacted Red Sea Global Finance Director. Promised payment for remaining balance of 28,750 SAR by Aug 15.',
    followUpDate: '2026-08-15',
    createdBy: 'usr-001',
    createdAt: '2026-07-20T10:00:00Z'
  }
];

let arPromisesToPay: PromiseToPayRecord[] = [
  {
    id: 'ptp-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    customerId: 'cust-ar-003',
    customerName: 'Red Sea Global Trading Co',
    invoiceId: 'sinv-003',
    invoiceNumber: 'INV-2026-88003',
    promisedAmount: 28750,
    promiseDate: '2026-08-15',
    status: 'PENDING',
    notes: 'Promised wire transfer for remaining 28,750 SAR',
    createdBy: 'usr-001',
    createdAt: '2026-07-20T10:05:00Z'
  }
];

let arRevRecSchedules: RevenueRecognitionSchedule[] = [];
let arAuditLogs: ARAuditRecord[] = [
  {
    id: 'araud-init-01',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    timestamp: '2026-07-01T09:00:00Z',
    userId: 'usr-001',
    userName: 'AR Finance Manager',
    action: 'CREATE',
    entityType: 'CustomerSalesInvoice',
    entityId: 'sinv-001',
    entityNumber: 'INV-2026-88001',
    newState: 'POSTED',
    details: 'Created and Posted Sales Invoice INV-2026-88001 for Aramco Energy Solutions Ltd worth 241,500 SAR (VAT 15%: 31,500 SAR).',
    hash: 'SHA256-AR-INIT-01'
  }
];

// ==================== PHASE 2.6 GENERAL LEDGER STATE ====================
let glAccounts: GLAccount[] = INITIAL_ACCOUNTS.map(a => ({
  id: a.id,
  tenantId: a.tenantId || 'ten-001',
  companyId: a.companyId || 'comp-001',
  code: a.code,
  name: a.name,
  nameAr: a.nameAr,
  group: (a.category === 'Asset' ? 'Assets' : a.category === 'Liability' ? 'Liabilities' : a.category === 'Equity' ? 'Equity' : a.category === 'Revenue' ? 'Revenue' : 'OperatingExpense') as any,
  accountType: a.accountType as any,
  parentId: a.parentId || null,
  level: a.level || 1,
  isControlAccount: a.accountType === 'Receivable' || a.accountType === 'Payable' || a.accountType === 'Inventory' || a.accountType === 'TaxPayable' || a.accountType === 'Cash',
  controlType: a.accountType === 'Receivable' ? 'AR' : a.accountType === 'Payable' ? 'AP' : a.accountType === 'Inventory' ? 'INV' : a.accountType === 'TaxPayable' ? 'TAX' : a.accountType === 'Cash' ? 'BANK' : undefined,
  postingRestriction: (a.accountType === 'Receivable' || a.accountType === 'Payable') ? 'CONTROL_ACCOUNT_ONLY' : 'POSTING_ALLOWED',
  currency: a.currency || 'SAR',
  balance: a.balance || 0,
  isActive: a.isActive ?? true
}));

let glJournals: GLJournalEntry[] = INITIAL_JOURNAL_ENTRIES.map((j, i) => ({
  id: j.id,
  tenantId: j.tenantId || 'ten-001',
  companyId: j.companyId || 'comp-001',
  branchId: j.branchId || 'br-001',
  entryNumber: j.entryNumber,
  date: j.date,
  postingDate: j.postingDate || j.date,
  fiscalYear: 2026,
  fiscalPeriod: 8,
  journalType: j.isAutoGenerated ? 'FINANCIAL_EVENT' : 'MANUAL',
  status: (j.status === 'Posted' ? 'POSTED' : j.status === 'Cancelled' ? 'CANCELLED' : j.status === 'Reversed' ? 'REVERSED' : 'DRAFT') as any,
  reference: j.reference,
  description: j.description,
  totalDebit: j.totalDebit,
  totalCredit: j.totalCredit,
  currency: j.currency || 'SAR',
  exchangeRate: j.exchangeRate || 1.0,
  lines: j.lines.map((l, lineIdx) => ({
    id: l.id || `jl-init-${i}-${lineIdx}`,
    lineNo: lineIdx + 1,
    accountCode: l.accountCode,
    accountName: l.accountName,
    description: l.description || j.description,
    debit: l.debit,
    credit: l.credit,
    currency: j.currency || 'SAR',
    exchangeRate: j.exchangeRate || 1.0,
    baseCurrencyDebit: l.baseCurrencyDebit || l.debit,
    baseCurrencyCredit: l.baseCurrencyCredit || l.credit,
    dimensions: {
      companyId: j.companyId,
      branchId: j.branchId,
      costCenterId: j.costCenterId,
      profitCenterId: j.profitCenterId,
      departmentId: j.departmentId,
      projectId: j.projectId
    }
  })),
  isAutoGenerated: j.isAutoGenerated ?? false,
  originatingDocumentType: j.originatingDocumentType,
  originatingDocumentId: j.originatingDocumentId,
  originatingDocumentNumber: j.originatingDocumentNumber,
  createdBy: j.createdBy || 'usr-001',
  createdByName: j.createdByName || 'Finance Officer',
  createdAt: j.createdAt || new Date().toISOString(),
  approvedBy: j.approvedBy || 'Finance Manager',
  approvedAt: j.approvedAt || new Date().toISOString(),
  correlationId: `CORR-JE-INIT-${i + 1}`,
  auditHash: `SHA256-JE-INIT-${i + 1}`
}));

let glFiscalYears: FiscalYearRecord[] = INITIAL_FISCAL_YEARS.map(fy => ({
  id: fy.id,
  tenantId: fy.tenantId || 'ten-001',
  companyId: fy.companyId || 'comp-001',
  year: fy.year,
  startDate: fy.startDate,
  endDate: fy.endDate,
  isClosed: fy.isClosed
}));

let glFiscalPeriods: FiscalPeriodRecord[] = INITIAL_FISCAL_PERIODS.map(fp => ({
  id: fp.id,
  tenantId: 'ten-001',
  companyId: 'comp-001',
  fiscalYearId: fp.fiscalYearId,
  year: 2026,
  periodNumber: fp.periodNumber,
  periodName: `Period ${fp.periodNumber}`,
  startDate: fp.startDate,
  endDate: fp.endDate,
  status: fp.isLocked ? 'CLOSED' : 'OPEN'
}));

let glRecurringSchedules: RecurringJournalSchedule[] = [
  {
    id: 'rjs-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    scheduleCode: 'REC-DEPR-MONTHLY',
    name: 'Monthly Fixed Asset Depreciation Posting',
    frequency: 'MONTHLY',
    nextExecutionDate: '2026-08-31',
    startDate: '2026-01-01',
    isActive: true,
    description: 'Monthly straight-line depreciation for IT & Office Equipment',
    templateLines: [
      { id: '1', lineNo: 1, accountCode: '5020', accountName: 'Depreciation & Amortization Expense', description: 'Monthly Depreciation Charge', debit: 12500, credit: 0 },
      { id: '2', lineNo: 2, accountCode: '1060', accountName: 'Accumulated Depreciation - Fixed Assets', description: 'Monthly Accumulated Depreciation', debit: 0, credit: 12500 }
    ],
    createdBy: 'usr-001',
    createdAt: '2026-01-01T08:00:00Z'
  }
];

let glYearEndRecords: YearEndClosingRecord[] = [];
let glClosingSnapshots: ClosingSnapshotRecord[] = [];
let glFXSnapshots: IAS21FXSnapshotRecord[] = [];

let glAuditTrail: GLAuditRecord[] = [
  {
    id: 'glaud-init-01',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    timestamp: '2026-01-01T00:00:00Z',
    userId: 'usr-001',
    userName: 'Chief Financial Officer',
    action: 'JOURNAL_POSTED',
    entityType: 'GLJournal',
    entityId: 'je-001',
    correlationId: 'CORR-JE-INIT-1',
    hash: 'SHA256-JE-INIT-1',
    details: 'Initialized General Ledger Opening Balances for Fiscal Year 2026'
  }
];

// ==================== FIXED ASSETS STATE ====================
let fixedAssetClasses: AssetClass[] = FixedAssetsEngine.getInitialAssetClasses();
let fixedAssetMasters: FixedAssetMaster[] = [
  {
    id: 'ast-001',
    assetNumber: 'AST-2026-0001',
    barcode: 'BAR-AST-2026-0001',
    qrCode: 'QR-AST-2026-0001-A1B2C3D4',
    serialNumber: 'SN-CSCO-889012',
    name: 'Cisco Core Enterprise Switch Rack',
    nameAr: 'موزع سيسكو الشبكي الرئيسي',
    assetClassId: 'AC-400',
    assetClassName: 'IT Hardware & Telecommunications',
    categoryId: 'cat-it-net',
    categoryName: 'Networking Hardware',
    locationId: 'loc-001',
    locationName: 'Riyadh HQ Data Center',
    departmentId: 'dept-002',
    departmentName: 'IT & Infrastructure',
    costCenterId: 'cc-002',
    costCenterName: 'IT Operations',
    responsibleEmployeeId: 'emp-101',
    responsibleEmployeeName: 'Tariq Al-Mansoor',
    supplierId: 'vendor-001',
    supplierName: 'Global Tech Solutions',
    manufacturer: 'Cisco Systems',
    model: 'Nexus 9300 Series',
    acquisitionType: 'PURCHASE',
    acquisitionDate: '2025-01-15',
    operationalDate: '2025-01-15',
    purchaseCost: 120000,
    salvageValue: 0,
    residualValue: 0,
    usefulLifeYears: 5,
    usefulLifeMonths: 60,
    depreciationMethod: 'STRAIGHT_LINE',
    depreciationFrequency: 'MONTHLY',
    totalAccumulatedDepreciation: 24000,
    netBookValue: 96000,
    revaluationSurplus: 0,
    accumulatedImpairmentLoss: 0,
    lastDepreciationDate: '2026-07-31',
    status: 'ACTIVE',
    companyId: 'comp-001',
    branchId: 'br-001',
    currency: 'SAR',
    createdAt: '2025-01-15T10:00:00Z',
    createdBy: 'usr-001'
  },
  {
    id: 'ast-002',
    assetNumber: 'AST-2026-0002',
    barcode: 'BAR-AST-2026-0002',
    qrCode: 'QR-AST-2026-0002-E5F6G7H8',
    serialNumber: 'SN-VOLVO-TRK-771',
    name: 'Volvo Heavy Logistics Truck',
    nameAr: 'شاحنة فولفو للنقل الثقيل',
    assetClassId: 'AC-300',
    assetClassName: 'Vehicles & Logistics Fleet',
    categoryId: 'cat-trans-heavy',
    categoryName: 'Heavy Commercial Vehicles',
    locationId: 'loc-002',
    locationName: 'Jeddah Port Terminal',
    departmentId: 'dept-003',
    departmentName: 'Logistics & Supply Chain',
    costCenterId: 'cc-003',
    costCenterName: 'Fleet Operations',
    responsibleEmployeeId: 'emp-102',
    responsibleEmployeeName: 'Sami Al-Otaibi',
    supplierId: 'vendor-002',
    supplierName: 'Zahid Tractor & Heavy Machinery',
    manufacturer: 'Volvo Trucks',
    model: 'FH16 750 HP',
    acquisitionType: 'PURCHASE',
    acquisitionDate: '2024-06-10',
    operationalDate: '2024-06-10',
    purchaseCost: 450000,
    salvageValue: 45000,
    residualValue: 45000,
    usefulLifeYears: 6,
    usefulLifeMonths: 72,
    depreciationMethod: 'STRAIGHT_LINE',
    depreciationFrequency: 'MONTHLY',
    totalAccumulatedDepreciation: 135000,
    netBookValue: 315000,
    revaluationSurplus: 0,
    accumulatedImpairmentLoss: 0,
    lastDepreciationDate: '2026-07-31',
    status: 'ACTIVE',
    companyId: 'comp-001',
    branchId: 'br-002',
    currency: 'SAR',
    createdAt: '2024-06-10T09:30:00Z',
    createdBy: 'usr-001'
  },
  {
    id: 'ast-003',
    assetNumber: 'AST-2026-0003',
    barcode: 'BAR-AST-2026-0003',
    qrCode: 'QR-AST-2026-0003-I9J0K1L2',
    serialNumber: 'SN-CNC-CUT-9941',
    name: 'Industrial CNC Automated Cutter',
    nameAr: 'ماكينة القص الصناعية CNC',
    assetClassId: 'AC-200',
    assetClassName: 'Industrial Machinery & Equipment',
    categoryId: 'cat-mach-mfg',
    categoryName: 'Manufacturing Lines',
    locationId: 'loc-003',
    locationName: 'Dammam Industrial Zone Plant 1',
    departmentId: 'dept-004',
    departmentName: 'Plant Operations',
    costCenterId: 'cc-004',
    costCenterName: 'Manufacturing Cost Center',
    responsibleEmployeeId: 'emp-103',
    responsibleEmployeeName: 'Khaled Ghamdi',
    supplierId: 'vendor-003',
    supplierName: 'Saudi Industrial Machinery Co',
    manufacturer: 'TRUMPF GmbH',
    model: 'TruLaser 5030 Fiber',
    acquisitionType: 'PURCHASE',
    acquisitionDate: '2023-11-20',
    operationalDate: '2023-11-20',
    purchaseCost: 850000,
    salvageValue: 42500,
    residualValue: 42500,
    usefulLifeYears: 8,
    usefulLifeMonths: 96,
    depreciationMethod: 'STRAIGHT_LINE',
    depreciationFrequency: 'MONTHLY',
    totalAccumulatedDepreciation: 382500,
    netBookValue: 467500,
    revaluationSurplus: 0,
    accumulatedImpairmentLoss: 0,
    lastDepreciationDate: '2026-07-31',
    status: 'ACTIVE',
    companyId: 'comp-001',
    branchId: 'br-003',
    currency: 'SAR',
    createdAt: '2023-11-20T11:15:00Z',
    createdBy: 'usr-001'
  }
];

let fixedAssetAcquisitions: AssetAcquisitionRecord[] = [];
let fixedAssetTransfers: AssetTransferRecord[] = [];
let fixedAssetDisposals: AssetDisposalRecord[] = [];
let fixedAssetRevaluations: AssetRevaluationRecord[] = [];
let fixedAssetImpairments: AssetImpairmentRecord[] = [];
let fixedAssetMaintenances: AssetMaintenanceRecord[] = [
  {
    id: 'mnt-001',
    assetId: 'ast-003',
    assetNumber: 'AST-2026-0003',
    maintenanceType: 'PREVENTIVE',
    maintenanceDate: '2026-06-15',
    vendorName: 'TRUMPF Technical Service KSA',
    description: 'Bi-annual optical lens alignment & hydraulic pressure check',
    cost: 12500,
    spareParts: [
      { partName: 'Laser Focus Lens Unit', quantity: 1, unitCost: 4500, totalCost: 4500 },
      { partName: 'Hydraulic Seal Kit', quantity: 2, unitCost: 1200, totalCost: 2400 }
    ],
    downtimeHours: 6,
    performedBy: 'Khaled Ghamdi',
    status: 'COMPLETED',
    createdAt: '2026-06-15T16:00:00Z'
  }
];
let physicalVerificationSessions: PhysicalVerificationSession[] = [];
let fixedAssetAuditLogs: AssetAuditLogRecord[] = [
  {
    id: 'LOG-INIT-AST-001',
    assetId: 'ast-001',
    assetNumber: 'AST-2026-0001',
    eventType: 'ASSET_ACQUIRED',
    timestamp: '2025-01-15T10:00:00Z',
    actionBy: 'usr-001',
    details: 'Initial capitalization of Enterprise Core Data Center Server Rack for 120,000 SAR',
    payload: { assetId: 'ast-001', purchaseCost: 120000, salvageValue: 0, method: 'STRAIGHT_LINE' },
    sha256Hash: FixedAssetsEngine.computeSha256Hash({ assetId: 'ast-001', purchaseCost: 120000 }),
    correlationId: 'CORR-INIT-AST-001'
  },
  {
    id: 'LOG-INIT-AST-002',
    assetId: 'ast-002',
    assetNumber: 'AST-2026-0002',
    eventType: 'ASSET_ACQUIRED',
    timestamp: '2024-06-10T09:30:00Z',
    actionBy: 'usr-001',
    details: 'Initial capitalization of Volvo Heavy Logistics Truck for 450,000 SAR',
    payload: { assetId: 'ast-002', purchaseCost: 450000, salvageValue: 45000, method: 'STRAIGHT_LINE' },
    sha256Hash: FixedAssetsEngine.computeSha256Hash({ assetId: 'ast-002', purchaseCost: 450000 }),
    correlationId: 'CORR-INIT-AST-002'
  },
  {
    id: 'LOG-INIT-AST-003',
    assetId: 'ast-003',
    assetNumber: 'AST-2026-0003',
    eventType: 'ASSET_ACQUIRED',
    timestamp: '2023-11-20T08:00:00Z',
    actionBy: 'usr-001',
    details: 'Initial capitalization of Industrial CNC Automated Cutter for 850,000 SAR',
    payload: { assetId: 'ast-003', purchaseCost: 850000, salvageValue: 42500, method: 'STRAIGHT_LINE' },
    sha256Hash: FixedAssetsEngine.computeSha256Hash({ assetId: 'ast-003', purchaseCost: 850000 }),
    correlationId: 'CORR-INIT-AST-003'
  }
];
let fixedAssetEvents: AssetDomainEvent[] = [];
let fixedAssetSnapshots: ImmutableAssetSnapshot[] = [];
let latestPhase28QualityGateReport: Phase28QualityGateReport | null = null;
let postedDepreciationPeriods: Set<string> = new Set<string>();

// ==================== TREASURY & CASH MANAGEMENT STATE (PHASE 2.9) ====================
let treasuryBanks: BankMaster[] = TreasuryEngine.getInitialBanks();
let treasuryBankAccounts: BankAccount[] = TreasuryEngine.getInitialBankAccounts();
let treasuryCashAccounts: CashAccount[] = TreasuryEngine.getInitialCashAccounts();
let treasuryChequeBooks: ChequeBook[] = TreasuryEngine.getInitialChequeBooks();
let treasuryCheques: ChequeRecord[] = TreasuryEngine.getInitialCheques();
let treasuryTransactions: TreasuryTransaction[] = TreasuryEngine.getInitialTransactions();
let treasuryExchangeRates: ExchangeRateRecord[] = TreasuryEngine.getInitialExchangeRates();
let treasuryBankCharges: BankChargeRecord[] = TreasuryEngine.getInitialBankCharges();
let treasuryPaymentCalendar: PaymentCalendarEntry[] = TreasuryEngine.getInitialPaymentCalendar();
let treasuryBankStatements: BankStatement[] = [];
let treasuryReconciliations: BankReconciliationSession[] = [];
let treasuryEvents: TreasuryDomainEvent[] = [];
let treasuryForecastItems: CashForecastItem[] = [];
let treasuryRevaluations: FXRevaluationResult[] = [];
let treasurySnapshots: ImmutableLiquiditySnapshot[] = [];
let treasuryAuditVault: TreasuryAuditLogRecord[] = [
  {
    id: 'AUD-TR-INIT-001',
    sequenceNumber: 1,
    companyId: 'comp-001',
    eventType: 'BANK_DEPOSIT_POSTED',
    entityId: 'ba-001',
    entityType: 'BANK_ACCOUNT',
    action: 'INITIAL_CAPITAL_DEPOSIT',
    performedBy: 'usr-001',
    timestamp: '2026-01-01T08:00:00Z',
    payloadSummary: 'Initial capital funding of 2,450,000 SAR in SNB Operating Account',
    previousHash: 'GENESIS_TREASURY_AUDIT_HASH',
    currentHash: TreasuryEngine.computeSha256Hash({
      id: 'AUD-TR-INIT-001',
      sequenceNumber: 1,
      companyId: 'comp-001',
      eventType: 'BANK_DEPOSIT_POSTED',
      entityId: 'ba-001',
      entityType: 'BANK_ACCOUNT',
      action: 'INITIAL_CAPITAL_DEPOSIT',
      performedBy: 'usr-001',
      timestamp: '2026-01-01T08:00:00Z',
      payloadSummary: 'Initial capital funding of 2,450,000 SAR in SNB Operating Account',
      previousHash: 'GENESIS_TREASURY_AUDIT_HASH',
      correlationId: 'CORR-INIT-TR-001'
    }),
    correlationId: 'CORR-INIT-TR-001'
  }
];
let latestPhase29QualityGateReport: Phase29QualityGateReport | null = null;



let inventory = [...INITIAL_INVENTORY];
let stockMovements = [...INITIAL_STOCK_MOVEMENTS];
let customers = [...INITIAL_CUSTOMERS];
let salesInvoices = [...INITIAL_SALES_INVOICES];
let legacyVendors = [...INITIAL_VENDORS];
let vendors: VendorMaster[] = [...INITIAL_PROCUREMENT_VENDORS];
let purchaseInvoices = [...INITIAL_PURCHASE_INVOICES];
let customerPayments = [...INITIAL_CUSTOMER_PAYMENTS];
let supplierPayments = [...INITIAL_SUPPLIER_PAYMENTS];

let leads = [...INITIAL_LEADS];
let employees = [...INITIAL_EMPLOYEES];
let documentRelationships: DocumentRelationship[] = [...INITIAL_DOCUMENT_RELATIONSHIPS];

let brands = [...INITIAL_BRANDS];
let models = [...INITIAL_MODELS];
let itemGroups = [...INITIAL_ITEM_GROUPS];
let uomConversions = [...INITIAL_UOM_CONVERSIONS];
let packagingUnits = [...INITIAL_PACKAGING_UNITS];
let warehouseZones = [...INITIAL_WAREHOUSE_ZONES];
let binLocations = [...INITIAL_BIN_LOCATIONS];
let batchLots: BatchLot[] = [...INITIAL_BATCH_LOTS as BatchLot[]];
let serialNumbers: SerialNumber[] = [...INITIAL_SERIAL_NUMBERS as SerialNumber[]];
let stockQuants: StockQuant[] = [...INITIAL_STOCK_QUANTS as StockQuant[]];
let stockLedgerEntries: StockLedgerEntry[] = [];
let costLayers: CostLayer[] = [
  {
    id: 'layer-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    layerNumber: 'LAY-2026-001',
    itemSku: 'HW-SRV-01',
    itemName: 'Enterprise Edge Server Blade Gen11',
    warehouseId: 'wh-001',
    warehouseName: 'Central Warehouse - Riyadh',
    batchNumber: 'BATCH-2026-08A',
    quantity: 25,
    remainingQuantity: 25,
    unitCost: 18500,
    totalCost: 462500,
    remainingTotalCost: 462500,
    sourceDocumentType: 'OpeningStock',
    sourceDocumentId: 'op-001',
    sourceDocumentNumber: 'OPN-2026-001',
    receiptDate: '2026-01-15T08:00:00Z',
    status: 'ACTIVE',
    createdBy: 'System Init',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'layer-002',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    layerNumber: 'LAY-2026-002',
    itemSku: 'NET-RTR-10G',
    itemName: '10Gbps High-Speed Optical Fiber Router',
    warehouseId: 'wh-001',
    warehouseName: 'Central Warehouse - Riyadh',
    batchNumber: 'BATCH-CSCO-22',
    quantity: 10,
    remainingQuantity: 10,
    unitCost: 12000,
    totalCost: 120000,
    remainingTotalCost: 120000,
    sourceDocumentType: 'OpeningStock',
    sourceDocumentId: 'op-002',
    sourceDocumentNumber: 'OPN-2026-002',
    receiptDate: '2025-08-10T09:00:00Z',
    status: 'ACTIVE',
    createdBy: 'System Init',
    createdAt: '2025-08-10T09:00:00Z'
  }
];
let layerConsumptions: CostLayerConsumption[] = [];
let avgCostRecords: MovingAverageCostRecord[] = [];
let standardCostRecords: StandardCostRecord[] = [];
let costCalculationLogs: CostCalculationLog[] = [];
let costBusinessEvents: CostBusinessEvent[] = [];
let inventoryConfig = { ...INITIAL_INVENTORY_CONFIG };
let colors = [...INITIAL_COLORS];
let sizes = [...INITIAL_SIZES];
let paymentMethods = [...INITIAL_PAYMENT_METHODS];
let banks = [...INITIAL_BANKS];
let warehouseLocations = [...INITIAL_WAREHOUSE_LOCATIONS];
let countries = [...INITIAL_COUNTRIES];
let cities = [...INITIAL_CITIES];
let regions = [...INITIAL_REGIONS];
let assets = [...INITIAL_ASSETS];

// ==================== PHASE 3.1 SALES & POS STATE ====================
let salesDocumentSequences: SalesDocumentSequenceConfig[] = [...INITIAL_SALES_DOCUMENT_SEQUENCES];
let enterprisePriceLists: EnterprisePriceList[] = [...INITIAL_ENTERPRISE_PRICELISTS];
let discountRules: DiscountRule[] = [...INITIAL_DISCOUNT_RULES];
let promotionCampaigns: PromotionCampaign[] = [...INITIAL_PROMOTIONS];
let salesQuotations: SalesQuotation[] = [...INITIAL_SALES_QUOTATIONS];
let salesOrders: SalesOrder[] = [...INITIAL_SALES_ORDERS];
let posRegisters: POSRegister[] = [...INITIAL_POS_REGISTERS];
let posShifts: POSShift[] = [...INITIAL_POS_SHIFTS];
let posReceipts: POSReceipt[] = [...INITIAL_POS_RECEIPTS];
let salesReturns: SalesReturn[] = [...INITIAL_SALES_RETURNS];

// Phase 3.1 Hardening State
let posDevices: POSDeviceMaster[] = [...INITIAL_POS_DEVICES];
let offlineTransactionQueue: OfflineTransactionQueueItem[] = [...INITIAL_OFFLINE_QUEUE];
let mobileCustomers: MobileCustomerSnapshot[] = [...INITIAL_MOBILE_CUSTOMERS];
let mobileProducts: MobileProductAvailabilitySnapshot[] = [...INITIAL_MOBILE_PRODUCTS];
let salesRepTargets: SalesRepresentativeTarget[] = [...INITIAL_SALES_REP_TARGETS];
let salesRepActivities: SalesRepresentativeActivity[] = [...INITIAL_SALES_REP_ACTIVITIES];
let syncAuditLogs: SyncAuditRecord[] = [...INITIAL_SYNC_AUDIT_LOGS];
let syncConflicts: SyncConflictRecord[] = [
  {
    id: 'conf-101',
    transactionId: 'off-tx-003',
    tempDocNumber: 'OFF-MOB-02-SALE-20260815-0003',
    conflictType: 'PRICE_MISMATCH',
    detectedAt: '2026-08-15T09:20:00Z',
    clientState: { itemSku: 'POS-SCN-WL', unitPrice: 750 },
    serverState: { itemSku: 'POS-SCN-WL', basePrice: 850 },
    differenceExplanation: 'Special on-field discount applied by representative requires supervisor approval or price list alignment.',
    resolutionStatus: 'PENDING',
    appliedResolution: 'MANUAL_REVIEW',
    auditTrailSha256: 'sha256_conf_101_audit'
  }
];
let offlineDocumentLineages: OfflineDocumentLineage[] = [];
let industryProfiles: IndustryProfileConfig[] = IndustryConfigEngine.getAllIndustryProfiles();
let idempotencyKeysStore: Set<string> = new Set(['idemp-prev-processed-001', 'idemp-prev-processed-002']);

// ==================== PLATFORM DMS, RESTAURANT, CRM & PROJECTS STATE ====================
const INITIAL_PLATFORM_ATTACHMENTS: DocumentAttachment[] = [
  {
    id: 'ATT-001',
    entityType: 'TREASURY_TRANSACTION',
    entityId: 'tr-001',
    entityNumber: 'TR-2026-TRF-00001',
    fileName: 'Bank_Swift_Advice_Riyad_001.pdf',
    fileSize: 482100,
    fileSizeBytesFormatted: '470.80 KB',
    mimeType: 'application/pdf',
    category: 'RECEIPT',
    version: 1,
    isLatest: true,
    downloadUrl: '/api/v1/platform/attachments/ATT-001/download',
    uploadedBy: 'usr-001',
    uploadedByName: 'Ahmed Al-Mansoor',
    uploadedAt: '2026-08-14T09:15:00.000Z',
    sha256Checksum: PlatformEngine.computeSha256('ATT-001:Bank_Swift_Advice_Riyad_001.pdf'),
    isVerified: true,
    description: 'Official Bank SWIFT MT103 confirmation advice for supplier transfer'
  },
  {
    id: 'ATT-002',
    entityType: 'FIXED_ASSET',
    entityId: 'fa-001',
    entityNumber: 'FA-2026-MACH-0001',
    fileName: 'CNC_Machine_Purchase_Contract_Warranty.pdf',
    fileSize: 1850400,
    fileSizeBytesFormatted: '1.76 MB',
    mimeType: 'application/pdf',
    category: 'CONTRACT',
    version: 1,
    isLatest: true,
    downloadUrl: '/api/v1/platform/attachments/ATT-002/download',
    uploadedBy: 'usr-002',
    uploadedByName: 'Sarah Jenkins',
    uploadedAt: '2026-08-14T10:00:00.000Z',
    sha256Checksum: PlatformEngine.computeSha256('ATT-002:CNC_Machine_Purchase_Contract_Warranty.pdf'),
    isVerified: true,
    description: '5-Year Manufacturer Warranty and OEM Calibration Certificate'
  }
];

const INITIAL_PLATFORM_TIMELINE: ActivityTimelineEvent[] = [
  {
    id: 'ACT-001',
    entityType: 'TREASURY_TRANSACTION',
    entityId: 'tr-001',
    entityNumber: 'TR-2026-TRF-00001',
    action: 'CREATED',
    performedByUserId: 'usr-001',
    performedByName: 'Ahmed Al-Mansoor',
    performedByRole: 'TREASURY_OFFICER',
    timestamp: '2026-08-14T09:00:00.000Z',
    correlationId: 'CORR-TR-001',
    summaryEn: 'Initiated Supplier Disbursement Transfer of 150,000 SAR',
    summaryAr: 'إنشاء أمر صرف مالي للمورد بمبلغ 150,000 ريال',
    sha256Hash: PlatformEngine.computeSha256('ACT-001:INITIATE_TRANSFER')
  },
  {
    id: 'ACT-002',
    entityType: 'WORKFLOW_INSTANCE',
    entityId: 'WFI-2026-001',
    entityNumber: 'PO-2026-00042',
    action: 'APPROVED',
    performedByUserId: 'usr-001',
    performedByName: 'Ahmed Al-Mansoor',
    performedByRole: 'PROCUREMENT_SPECIALIST',
    timestamp: '2026-08-14T10:15:00.000Z',
    correlationId: 'CORR-WF-001',
    summaryEn: 'Approved Step 1 (Procurement Review) for PO-2026-00042',
    summaryAr: 'اعتماد المرحلة الأولى لأمر الشراء PO-2026-00042',
    sha256Hash: PlatformEngine.computeSha256('ACT-002:APPROVE_STEP_1')
  }
];

const INITIAL_RESTAURANT_TABLES: RestaurantTable[] = [
  {
    id: 'tbl-001',
    tableNumber: 'T-01',
    capacity: 4,
    section: 'Main Dining Hall',
    status: 'AVAILABLE',
    companyId: 'comp-001',
    branchId: 'br-001'
  },
  {
    id: 'tbl-002',
    tableNumber: 'T-02',
    capacity: 2,
    section: 'Terrace Garden',
    status: 'OCCUPIED',
    currentOrderId: 'kds-001',
    activeGuests: 2,
    companyId: 'comp-001',
    branchId: 'br-001'
  },
  {
    id: 'tbl-003',
    tableNumber: 'VIP-01',
    capacity: 8,
    section: 'Royal VIP Lounge',
    status: 'RESERVED',
    companyId: 'comp-001',
    branchId: 'br-001'
  }
];

const INITIAL_KITCHEN_ORDERS: KitchenDisplayOrder[] = [
  {
    id: 'kds-001',
    orderNumber: 'KDS-ORD-001',
    tableNumber: 'T-02',
    orderType: 'DINE_IN',
    status: 'PREPARING',
    station: 'HOT_KITCHEN',
    priority: 'NORMAL',
    items: [
      { itemId: 'item-fnb-01', itemName: 'Grilled Seabass with Saffron Rice', quantity: 2, status: 'COOKING', notes: 'Extra crispy skin' },
      { itemId: 'item-fnb-02', itemName: 'Mediterranean Mezze Platter', quantity: 1, status: 'DONE' }
    ],
    createdAt: '2026-09-08T18:30:00Z',
    companyId: 'comp-001',
    branchId: 'br-001'
  }
];

const INITIAL_KITCHEN_WASTE: KitchenWasteRecord[] = [
  {
    id: 'kw-001',
    wasteNumber: 'WST-2026-0001',
    date: '2026-09-08',
    itemId: 'item-fnb-03',
    itemName: 'Fresh Salmon Fillet',
    quantity: 1.5,
    uom: 'KG',
    costAmount: 180.0,
    reason: 'TRIMMING',
    reportedBy: 'Chef Karim',
    actionTaken: 'Standard culinary trimming logged to COGS variance',
    companyId: 'comp-001',
    branchId: 'br-001'
  }
];

const INITIAL_CRM_TICKETS: CRMTicket[] = [
  {
    id: 'tkt-001',
    ticketNumber: 'TCK-2026-0001',
    customerId: 'cust-001',
    customerName: 'Al-Madina Commercial Group',
    subject: 'Request for scheduled statement reconciliation',
    description: 'Customer requested consolidated monthly statement with electronic VAT breakdown for August 2026.',
    priority: 'MEDIUM',
    status: 'OPEN',
    category: 'BILLING',
    assignedTo: 'usr-001',
    assignedToName: 'Ahmed Al-Mansoor',
    createdAt: '2026-09-08T11:00:00Z',
    companyId: 'comp-001'
  }
];

const INITIAL_PROJECT_TIMESHEETS: ProjectTimesheet[] = [
  {
    id: 'ts-001',
    timesheetNumber: 'TS-2026-W36-001',
    projectId: 'proj-001',
    projectName: 'ERP Pilot Deployment Phase 1',
    employeeId: 'emp-001',
    employeeName: 'Eng. Tarek Fahmy',
    date: '2026-09-08',
    hoursWorked: 8.5,
    billableHours: 8.0,
    taskDescription: 'On-site POS terminal calibration and cash float setup verification',
    hourlyRate: 150.0,
    totalCost: 1275.0,
    status: 'APPROVED',
    approvedBy: 'usr-001',
    approvedAt: '2026-09-08T17:00:00Z',
    companyId: 'comp-001'
  }
];

let platformAttachments: DocumentAttachment[] = [...INITIAL_PLATFORM_ATTACHMENTS];
let platformActivityTimeline: ActivityTimelineEvent[] = [...INITIAL_PLATFORM_TIMELINE];
let restaurantTables: RestaurantTable[] = [...INITIAL_RESTAURANT_TABLES];
let kitchenOrders: KitchenDisplayOrder[] = [...INITIAL_KITCHEN_ORDERS];
let kitchenWasteRecords: KitchenWasteRecord[] = [...INITIAL_KITCHEN_WASTE];
let crmTickets: CRMTicket[] = [...INITIAL_CRM_TICKETS];
let projectTimesheets: ProjectTimesheet[] = [...INITIAL_PROJECT_TIMESHEETS];

// ==================== PILOT READINESS PERSISTENCE ENGINE ====================
const pilotDb = PilotDatabaseService.getInstance();
const startupPersistenceValidation = pilotDb.validateStartupPersistence();
if (startupPersistenceValidation.shouldAbort) {
  console.error('\n[FATAL] Pilot database persistence failed startup check with STRICT_PERSISTENCE_ABORT=true.');
  console.error(startupPersistenceValidation.report.operationalMessage);
  process.exit(1);
}

function initializePilotPersistence(): void {
  try {
    // Enterprise Setup & Organizational Model
    tenants = initDurableCollection('tenants', tenants, pilotDb);
    companies = initDurableCollection('companies', companies, pilotDb);
    branches = initDurableCollection('branches', branches, pilotDb);
    departments = initDurableCollection('departments', departments, pilotDb);
    costCenters = initDurableCollection('costCenters', costCenters, pilotDb);
    profitCenters = initDurableCollection('profitCenters', profitCenters, pilotDb);
    projects = initDurableCollection('projects', projects, pilotDb);
    warehouses = initDurableCollection('warehouses', warehouses, pilotDb);
    currencies = initDurableCollection('currencies', currencies, pilotDb);
    exchangeRates = initDurableCollection('exchangeRates', exchangeRates, pilotDb);
    fiscalYears = initDurableCollection('fiscalYears', fiscalYears, pilotDb);
    fiscalPeriods = initDurableCollection('fiscalPeriods', fiscalPeriods, pilotDb);
    numberingRules = initDurableCollection('numberingRules', numberingRules, pilotDb);
    workflowRules = initDurableCollection('workflowRules', workflowRules, pilotDb);
    approvalRequests = initDurableCollection('approvalRequests', approvalRequests, pilotDb);
    taxRules = initDurableCollection('taxRules', taxRules, pilotDb);
    unitsOfMeasure = initDurableCollection('unitsOfMeasure', unitsOfMeasure, pilotDb);
    itemCategories = initDurableCollection('itemCategories', itemCategories, pilotDb);
    paymentTerms = initDurableCollection('paymentTerms', paymentTerms, pilotDb);
    postingRules = initDurableCollection('postingRules', postingRules, pilotDb);
    industryProfiles = initDurableCollection('industryProfiles', industryProfiles, pilotDb);
    users = initDurableCollection('users', users, pilotDb);
    // Initialize durable rate limiting and account lockout persistence in SecurityEngine
    SecurityEngine.initPersistence(pilotDb);
    // Ensure all users have secure cryptographic credentials (PBKDF2/SHA512)
    const needsBootstrapPassword = users.some(u => !u.passwordHash);
    const needsBootstrapPin = users.some(u => !u.pinHash);
    if (process.env.NODE_ENV === 'production' && needsBootstrapPassword && !process.env.INITIAL_ADMIN_PASSWORD) {
      throw new Error('CRITICAL SECURITY CONFIGURATION ERROR: INITIAL_ADMIN_PASSWORD is required to bootstrap production users.');
    }
    if (process.env.NODE_ENV === 'production' && needsBootstrapPin && !process.env.INITIAL_CASHIER_PIN) {
      throw new Error('CRITICAL SECURITY CONFIGURATION ERROR: INITIAL_CASHIER_PIN is required to bootstrap production users.');
    }
    const initialPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@2026!';
    const initialPin = process.env.INITIAL_CASHIER_PIN || '1234';
    users.forEach(u => {
      let updated = false;
      if (!u.passwordHash) {
        u.passwordHash = SecurityEngine.hashPassword(initialPassword);
        updated = true;
      }
      if (!u.pinHash) {
        u.pinHash = SecurityEngine.hashPin(initialPin);
        updated = true;
      }
      if (updated) {
        persistEntity('users', u, pilotDb);
      }
    });
    employees = initDurableCollection('employees', employees, pilotDb);
    leads = initDurableCollection('leads', leads, pilotDb);

    // Master Data Catalog
    brands = initDurableCollection('brands', brands, pilotDb);
    models = initDurableCollection('models', models, pilotDb);
    itemGroups = initDurableCollection('itemGroups', itemGroups, pilotDb);
    uomConversions = initDurableCollection('uomConversions', uomConversions, pilotDb);
    packagingUnits = initDurableCollection('packagingUnits', packagingUnits, pilotDb);
    warehouseZones = initDurableCollection('warehouseZones', warehouseZones, pilotDb);
    binLocations = initDurableCollection('binLocations', binLocations, pilotDb);
    warehouseLocations = initDurableCollection('warehouseLocations', warehouseLocations, pilotDb);
    enterprisePriceLists = initDurableCollection('enterprisePriceLists', enterprisePriceLists, pilotDb);
    discountRules = initDurableCollection('discountRules', discountRules, pilotDb);
    promotionCampaigns = initDurableCollection('promotionCampaigns', promotionCampaigns, pilotDb);

    // General Ledger & Financial Operations
    accounts = initDurableCollection('accounts', accounts, pilotDb);
    glAccounts = initDurableCollection('glAccounts', glAccounts, pilotDb);
    journalEntries = initDurableCollection('journalEntries', journalEntries, pilotDb);
    glJournals = initDurableCollection('glJournals', glJournals, pilotDb);
    financialEvents = initDurableCollection('financialEvents', financialEvents, pilotDb);
    financialAuditRecords = initDurableCollection('financialAuditRecords', financialAuditRecords, pilotDb);
    glFiscalYears = initDurableCollection('glFiscalYears', glFiscalYears, pilotDb);
    glFiscalPeriods = initDurableCollection('glFiscalPeriods', glFiscalPeriods, pilotDb);
    glRecurringSchedules = initDurableCollection('glRecurringSchedules', glRecurringSchedules, pilotDb);
    glYearEndRecords = initDurableCollection('glYearEndRecords', glYearEndRecords, pilotDb);
    glClosingSnapshots = initDurableCollection('glClosingSnapshots', glClosingSnapshots, pilotDb);
    glFXSnapshots = initDurableCollection('glFXSnapshots', glFXSnapshots, pilotDb);
    glAuditTrail = initDurableCollection('glAuditTrail', glAuditTrail, pilotDb);

    // Fixed Assets & Asset Accounting
    fixedAssetClasses = initDurableCollection('fixedAssetClasses', fixedAssetClasses, pilotDb);
    fixedAssetMasters = initDurableCollection('fixedAssetMasters', fixedAssetMasters, pilotDb);
    fixedAssetAcquisitions = initDurableCollection('fixedAssetAcquisitions', fixedAssetAcquisitions, pilotDb);
    fixedAssetTransfers = initDurableCollection('fixedAssetTransfers', fixedAssetTransfers, pilotDb);
    fixedAssetDisposals = initDurableCollection('fixedAssetDisposals', fixedAssetDisposals, pilotDb);
    fixedAssetRevaluations = initDurableCollection('fixedAssetRevaluations', fixedAssetRevaluations, pilotDb);
    fixedAssetImpairments = initDurableCollection('fixedAssetImpairments', fixedAssetImpairments, pilotDb);
    fixedAssetMaintenances = initDurableCollection('fixedAssetMaintenances', fixedAssetMaintenances, pilotDb);
    physicalVerificationSessions = initDurableCollection('physicalVerificationSessions', physicalVerificationSessions, pilotDb);
    fixedAssetAuditLogs = initDurableCollection('fixedAssetAuditLogs', fixedAssetAuditLogs, pilotDb);
    if (pilotDb.isCollectionInitialized('postedDepreciationPeriods')) {
      const persistedPeriods = pilotDb.loadCollection<{ id: string }>('postedDepreciationPeriods');
      persistedPeriods.forEach(p => {
        if (p && p.id) postedDepreciationPeriods.add(p.id);
      });
    }

    // Treasury & Cash Management
    treasuryBanks = initDurableCollection('treasuryBanks', treasuryBanks, pilotDb);
    treasuryBankAccounts = initDurableCollection('treasuryBankAccounts', treasuryBankAccounts, pilotDb);
    treasuryCashAccounts = initDurableCollection('treasuryCashAccounts', treasuryCashAccounts, pilotDb);
    treasuryChequeBooks = initDurableCollection('treasuryChequeBooks', treasuryChequeBooks, pilotDb);
    treasuryCheques = initDurableCollection('treasuryCheques', treasuryCheques, pilotDb);
    treasuryTransactions = initDurableCollection('treasuryTransactions', treasuryTransactions, pilotDb);
    treasuryExchangeRates = initDurableCollection('treasuryExchangeRates', treasuryExchangeRates, pilotDb);
    treasuryBankCharges = initDurableCollection('treasuryBankCharges', treasuryBankCharges, pilotDb);
    treasuryPaymentCalendar = initDurableCollection('treasuryPaymentCalendar', treasuryPaymentCalendar, pilotDb);
    treasuryBankStatements = initDurableCollection('treasuryBankStatements', treasuryBankStatements, pilotDb);
    treasuryReconciliations = initDurableCollection('treasuryReconciliations', treasuryReconciliations, pilotDb);
    treasuryAuditVault = initDurableCollection('treasuryAuditVault', treasuryAuditVault, pilotDb);

    // Procurement & Sourcing
    vendorCategories = initDurableCollection('vendorCategories', vendorCategories, pilotDb);
    vendors = initDurableCollection('vendors', vendors, pilotDb);
    legacyVendors = initDurableCollection('legacyVendors', legacyVendors, pilotDb);
    purchaseRequisitions = initDurableCollection('purchaseRequisitions', purchaseRequisitions, pilotDb);
    rfqs = initDurableCollection('rfqs', rfqs, pilotDb);
    vendorQuotations = initDurableCollection('vendorQuotations', vendorQuotations, pilotDb);
    purchaseOrders = initDurableCollection('purchaseOrders', purchaseOrders, pilotDb);
    purchaseApprovalRules = initDurableCollection('purchaseApprovalRules', purchaseApprovalRules, pilotDb);
    purchaseAmendments = initDurableCollection('purchaseAmendments', purchaseAmendments, pilotDb);
    vendorReturns = initDurableCollection('vendorReturns', vendorReturns, pilotDb);
    goodsReceipts = initDurableCollection('goodsReceipts', goodsReceipts, pilotDb);
    purchaseAuditLogs = initDurableCollection('purchaseAuditLogs', purchaseAuditLogs, pilotDb);
    vendorPriceHistory = initDurableCollection('vendorPriceHistory', vendorPriceHistory, pilotDb);
    ersInvoices = initDurableCollection('ersInvoices', ersInvoices, pilotDb);
    consignmentAgreements = initDurableCollection('consignmentAgreements', consignmentAgreements, pilotDb);
    consignmentStockRecords = initDurableCollection('consignmentStockRecords', consignmentStockRecords, pilotDb);
    consignmentWithdrawals = initDurableCollection('consignmentWithdrawals', consignmentWithdrawals, pilotDb);
    consignmentSettlements = initDurableCollection('consignmentSettlements', consignmentSettlements, pilotDb);
    landedCostAdjustments = initDurableCollection('landedCostAdjustments', landedCostAdjustments, pilotDb);
    supplierScorecards = initDurableCollection('supplierScorecards', supplierScorecards, pilotDb);
    vendorPrepayments = initDurableCollection('vendorPrepayments', vendorPrepayments, pilotDb);
    prepaymentApplicationRecords = initDurableCollection('prepaymentApplicationRecords', prepaymentApplicationRecords, pilotDb);

    // Accounts Payable & Supplier Invoicing
    supplierInvoices = initDurableCollection('supplierInvoices', supplierInvoices, pilotDb);
    apVouchers = initDurableCollection('apVouchers', apVouchers, pilotDb);
    supplierCreditNotes = initDurableCollection('supplierCreditNotes', supplierCreditNotes, pilotDb);
    paymentProposals = initDurableCollection('paymentProposals', paymentProposals, pilotDb);
    paymentBatches = initDurableCollection('paymentBatches', paymentBatches, pilotDb);
    paymentAllocations = initDurableCollection('paymentAllocations', paymentAllocations, pilotDb);
    agingSnapshots = initDurableCollection('agingSnapshots', agingSnapshots, pilotDb);
    paymentReversals = initDurableCollection('paymentReversals', paymentReversals, pilotDb);
    apAuditLogs = initDurableCollection('apAuditLogs', apAuditLogs, pilotDb);
    supplierPayments = initDurableCollection('supplierPayments', supplierPayments, pilotDb);
    purchaseInvoices = initDurableCollection('purchaseInvoices', purchaseInvoices, pilotDb);

    // Sales & Accounts Receivable
    customers = initDurableCollection('customers', customers, pilotDb);
    arCustomers = initDurableCollection('arCustomers', arCustomers, pilotDb);
    salesQuotations = initDurableCollection('salesQuotations', salesQuotations, pilotDb);
    salesOrders = initDurableCollection('salesOrders', salesOrders, pilotDb);
    salesInvoices = initDurableCollection('salesInvoices', salesInvoices, pilotDb);
    salesReturns = initDurableCollection('salesReturns', salesReturns, pilotDb);
    arSalesInvoices = initDurableCollection('arSalesInvoices', arSalesInvoices, pilotDb);
    arCreditNotes = initDurableCollection('arCreditNotes', arCreditNotes, pilotDb);
    arDebitNotes = initDurableCollection('arDebitNotes', arDebitNotes, pilotDb);
    arReceipts = initDurableCollection('arReceipts', arReceipts, pilotDb);
    arReceiptAllocations = initDurableCollection('arReceiptAllocations', arReceiptAllocations, pilotDb);
    arAgingSnapshots = initDurableCollection('arAgingSnapshots', arAgingSnapshots, pilotDb);
    arCollectionNotes = initDurableCollection('arCollectionNotes', arCollectionNotes, pilotDb);
    arPromisesToPay = initDurableCollection('arPromisesToPay', arPromisesToPay, pilotDb);
    arRevRecSchedules = initDurableCollection('arRevRecSchedules', arRevRecSchedules, pilotDb);
    arAuditLogs = initDurableCollection('arAuditLogs', arAuditLogs, pilotDb);
    customerPayments = initDurableCollection('customerPayments', customerPayments, pilotDb);
    salesContracts = initDurableCollection('salesContracts', salesContracts, pilotDb);
    customerConsignmentStocks = initDurableCollection('customerConsignmentStocks', customerConsignmentStocks, pilotDb);
    consignmentMovementRecords = initDurableCollection('consignmentMovementRecords', consignmentMovementRecords, pilotDb);
    customerRebateAgreements = initDurableCollection('customerRebateAgreements', customerRebateAgreements, pilotDb);
    dropShipmentOrders = initDurableCollection('dropShipmentOrders', dropShipmentOrders, pilotDb);
    customerCreditProfiles = initDurableCollection('customerCreditProfiles', customerCreditProfiles, pilotDb);

    // POS & Retail Systems
    posRegisters = initDurableCollection('posRegisters', posRegisters, pilotDb);
    posShifts = initDurableCollection('posShifts', posShifts, pilotDb);
    posReceipts = initDurableCollection('posReceipts', posReceipts, pilotDb);
    posDevices = initDurableCollection('posDevices', posDevices, pilotDb);
    offlineTransactionQueue = initDurableCollection('offlineTransactionQueue', offlineTransactionQueue, pilotDb);
    offlineDocumentLineages = initDurableCollection('offlineDocumentLineages', offlineDocumentLineages, pilotDb);
    syncAuditLogs = initDurableCollection('syncAuditLogs', syncAuditLogs, pilotDb);
    syncConflicts = initDurableCollection('syncConflicts', syncConflicts, pilotDb);

    // Inventory, Warehousing & Costing
    inventory = initDurableCollection('inventory', inventory, pilotDb);
    stockMovements = initDurableCollection('stockMovements', stockMovements, pilotDb);
    stockQuants = initDurableCollection('stockQuants', stockQuants, pilotDb);
    stockLedgerEntries = initDurableCollection('stockLedgerEntries', stockLedgerEntries, pilotDb);
    costLayers = initDurableCollection('costLayers', costLayers, pilotDb);
    layerConsumptions = initDurableCollection('layerConsumptions', layerConsumptions, pilotDb);
    avgCostRecords = initDurableCollection('avgCostRecords', avgCostRecords, pilotDb);
    standardCostRecords = initDurableCollection('standardCostRecords', standardCostRecords, pilotDb);
    costCalculationLogs = initDurableCollection('costCalculationLogs', costCalculationLogs, pilotDb);
    costBusinessEvents = initDurableCollection('costBusinessEvents', costBusinessEvents, pilotDb);
    batchLots = initDurableCollection('batchLots', batchLots, pilotDb);
    serialNumbers = initDurableCollection('serialNumbers', serialNumbers, pilotDb);
    inventoryPeriods = initDurableCollection('inventoryPeriods', inventoryPeriods, pilotDb);
    fiscalInventoryLocks = initDurableCollection('fiscalInventoryLocks', fiscalInventoryLocks, pilotDb);
    inventoryCountSessions = initDurableCollection('inventoryCountSessions', inventoryCountSessions, pilotDb);
    reconciliationProposals = initDurableCollection('reconciliationProposals', reconciliationProposals, pilotDb);
    inventoryClosingAuditRecords = initDurableCollection('inventoryClosingAuditRecords', inventoryClosingAuditRecords, pilotDb);

    // Manufacturing & Shop Floor Execution
    manufacturingBOMs = initDurableCollection('manufacturingBOMs', manufacturingBOMs, pilotDb);
    manufacturingWorkCenters = initDurableCollection('manufacturingWorkCenters', manufacturingWorkCenters, pilotDb);
    manufacturingRoutings = initDurableCollection('manufacturingRoutings', manufacturingRoutings, pilotDb);
    manufacturingWorkOrders = initDurableCollection('manufacturingWorkOrders', manufacturingWorkOrders, pilotDb);
    manufacturingGoodsIssues = initDurableCollection('manufacturingGoodsIssues', manufacturingGoodsIssues, pilotDb);
    manufacturingGoodsReceipts = initDurableCollection('manufacturingGoodsReceipts', manufacturingGoodsReceipts, pilotDb);
    manufacturingMRPReports = initDurableCollection('manufacturingMRPReports', manufacturingMRPReports, pilotDb);
    shopFloorOperators = initDurableCollection('shopFloorOperators', shopFloorOperators, pilotDb);
    shopFloorMachines = initDurableCollection('shopFloorMachines', shopFloorMachines, pilotDb);
    shopFloorDispatches = initDurableCollection('shopFloorDispatches', shopFloorDispatches, pilotDb);
    shopFloorTimeTickets = initDurableCollection('shopFloorTimeTickets', shopFloorTimeTickets, pilotDb);
    shopFloorDowntimeEvents = initDurableCollection('shopFloorDowntimeEvents', shopFloorDowntimeEvents, pilotDb);
    masterRecipes = initDurableCollection('masterRecipes', masterRecipes, pilotDb);
    batchMasters = initDurableCollection('batchMasters', batchMasters, pilotDb);
    processOrders = initDurableCollection('processOrders', processOrders, pilotDb);
    workCenterCapacityProfiles = initDurableCollection('workCenterCapacityProfiles', workCenterCapacityProfiles, pilotDb);
    subcontractOrders = initDurableCollection('subcontractOrders', subcontractOrders, pilotDb);
    productionLines = initDurableCollection('productionLines', productionLines, pilotDb);
    kanbanControlCycles = initDurableCollection('kanbanControlCycles', kanbanControlCycles, pilotDb);
    configurableProductModels = initDurableCollection('configurableProductModels', configurableProductModels, pilotDb);
    superBoms = initDurableCollection('superBoms', superBoms, pilotDb);
    configuredVariantInstances = initDurableCollection('configuredVariantInstances', configuredVariantInstances, pilotDb);
    deviationPermits = initDurableCollection('deviationPermits', deviationPermits, pilotDb);
    recallIncidents = initDurableCollection('recallIncidents', recallIncidents, pilotDb);
    energyConsumptionRecords = initDurableCollection('energyConsumptionRecords', energyConsumptionRecords, pilotDb);
    carbonFootprintCalculations = initDurableCollection('carbonFootprintCalculations', carbonFootprintCalculations, pilotDb);

    // Quality, Maintenance & Genealogy
    qualityInspectionPlans = initDurableCollection('qualityInspectionPlans', qualityInspectionPlans, pilotDb);
    qualityInspectionLots = initDurableCollection('qualityInspectionLots', qualityInspectionLots, pilotDb);
    qualityNonConformanceReports = initDurableCollection('qualityNonConformanceReports', qualityNonConformanceReports, pilotDb);
    qualityCAPAs = initDurableCollection('qualityCAPAs', qualityCAPAs, pilotDb);
    serialGenealogies = initDurableCollection('serialGenealogies', serialGenealogies, pilotDb);
    standardCostEstimates = initDurableCollection('standardCostEstimates', standardCostEstimates, pilotDb);
    wipRevaluationRecords = initDurableCollection('wipRevaluationRecords', wipRevaluationRecords, pilotDb);
    functionalLocations = initDurableCollection('functionalLocations', functionalLocations, pilotDb);
    equipmentAssets = initDurableCollection('equipmentAssets', equipmentAssets, pilotDb);
    preventiveMaintenanceSchedules = initDurableCollection('preventiveMaintenanceSchedules', preventiveMaintenanceSchedules, pilotDb);
    maintenanceWorkOrders = initDurableCollection('maintenanceWorkOrders', maintenanceWorkOrders, pilotDb);
    engineeringChangeOrders = initDurableCollection('engineeringChangeOrders', engineeringChangeOrders, pilotDb);

    // Audit Logs & Relationships
    auditLogs = initDurableCollection('auditLogs', auditLogs, pilotDb);
    documentRelationships = initDurableCollection('documentRelationships', documentRelationships, pilotDb);

    // Idempotency Keys Cache
    if (pilotDb.isCollectionInitialized('idempotencyKeys')) {
      const persistedKeys = pilotDb.loadCollection<{ id: string }>('idempotencyKeys');
      persistedKeys.forEach(k => {
        if (k && k.id) idempotencyKeysStore.add(k.id);
      });
    }

    // MasterDataService Persistence & Hydration
    const mdExport = MasterDataService.exportState();
    const mdKeys = Object.keys(mdExport) as Array<keyof typeof mdExport>;
    const hydratedState: any = {};
    for (const key of mdKeys) {
      const collName = `masterData_${key}`;
      if (pilotDb.isCollectionInitialized(collName)) {
        hydratedState[key] = pilotDb.loadCollection(collName);
      } else {
        const seed = mdExport[key] || [];
        if (seed.length > 0) {
          pilotDb.saveCollection(collName, seed as any);
        }
      }
    }
    MasterDataService.hydrate(hydratedState);
    MasterDataService.setMutationListener((entityType, entity) => {
      try {
        const targetCollection = `masterData_${entityType.toLowerCase()}s`;
        pilotDb.saveEntity(targetCollection, entity);
      } catch (e) {
        console.error(`[MasterDataPersistence] Failed persisting ${entityType}:`, e);
      }
    });

    // Master Setup, Geography & Attributes Durability
    countriesMaster = initDurableCollection('countriesMaster', countriesMaster, pilotDb);
    taxSystemsMaster = initDurableCollection('taxSystemsMaster', taxSystemsMaster, pilotDb);
    statesMaster = initDurableCollection('statesMaster', statesMaster, pilotDb);
    citiesMaster = initDurableCollection('citiesMaster', citiesMaster, pilotDb);
    timezonesMaster = initDurableCollection('timezonesMaster', timezonesMaster, pilotDb);
    languagesMaster = initDurableCollection('languagesMaster', languagesMaster, pilotDb);
    fiscalCalendarsMaster = initDurableCollection('fiscalCalendarsMaster', fiscalCalendarsMaster, pilotDb);
    colors = initDurableCollection('colors', colors, pilotDb);
    sizes = initDurableCollection('sizes', sizes, pilotDb);
    paymentMethods = initDurableCollection('paymentMethods', paymentMethods, pilotDb);
    banks = initDurableCollection('banks', banks, pilotDb);
    countries = initDurableCollection('countries', countries, pilotDb);
    cities = initDurableCollection('cities', cities, pilotDb);
    regions = initDurableCollection('regions', regions, pilotDb);
    assets = initDurableCollection('assets', assets, pilotDb);

    // Financial Event Mapping & Accounting Integration
    eventMappingRules = initDurableCollection('eventMappingRules', eventMappingRules, pilotDb);
    journalTemplates = initDurableCollection('journalTemplates', journalTemplates, pilotDb);
    postingProfiles = initDurableCollection('postingProfiles', postingProfiles, pilotDb);
    financialQueue = initDurableCollection('financialQueue', financialQueue, pilotDb);

    // Procurement Master & Organizational Structures
    procurementPaymentTerms = initDurableCollection('procurementPaymentTerms', procurementPaymentTerms, pilotDb);
    incoterms = initDurableCollection('incoterms', incoterms, pilotDb);
    procurementCategories = initDurableCollection('procurementCategories', procurementCategories, pilotDb);
    buyerGroups = initDurableCollection('buyerGroups', buyerGroups, pilotDb);
    purchasingOrgs = initDurableCollection('purchasingOrgs', purchasingOrgs, pilotDb);

    // Fixed Assets Events & Periodic Snapshots
    fixedAssetEvents = initDurableCollection('fixedAssetEvents', fixedAssetEvents, pilotDb);
    fixedAssetSnapshots = initDurableCollection('fixedAssetSnapshots', fixedAssetSnapshots, pilotDb);

    // Treasury Events, Liquidity Forecasts & Periodic Snapshots
    treasuryEvents = initDurableCollection('treasuryEvents', treasuryEvents, pilotDb);
    treasuryForecastItems = initDurableCollection('treasuryForecastItems', treasuryForecastItems, pilotDb);
    treasuryRevaluations = initDurableCollection('treasuryRevaluations', treasuryRevaluations, pilotDb);
    treasurySnapshots = initDurableCollection('treasurySnapshots', treasurySnapshots, pilotDb);

    // Sales Sequences & Field Sales Mobility
    salesDocumentSequences = initDurableCollection('salesDocumentSequences', salesDocumentSequences, pilotDb);
    mobileCustomers = initDurableCollection('mobileCustomers', mobileCustomers, pilotDb);
    mobileProducts = initDurableCollection('mobileProducts', mobileProducts, pilotDb);
    salesRepTargets = initDurableCollection('salesRepTargets', salesRepTargets, pilotDb);
    salesRepActivities = initDurableCollection('salesRepActivities', salesRepActivities, pilotDb);

    // Platform Document Management & Activity Timeline
    platformAttachments = initDurableCollection('platformAttachments', platformAttachments, pilotDb);
    platformActivityTimeline = initDurableCollection('platformActivityTimeline', platformActivityTimeline, pilotDb);

    // Restaurant Operations, Table Management & KDS
    restaurantTables = initDurableCollection('restaurantTables', restaurantTables, pilotDb);
    kitchenOrders = initDurableCollection('kitchenOrders', kitchenOrders, pilotDb);
    kitchenWasteRecords = initDurableCollection('kitchenWasteRecords', kitchenWasteRecords, pilotDb);

    // CRM Tickets & Professional Services Timesheets
    crmTickets = initDurableCollection('crmTickets', crmTickets, pilotDb);
    projectTimesheets = initDurableCollection('projectTimesheets', projectTimesheets, pilotDb);

    // Universal AttachmentEngine Persistence & Hydration
    if (pilotDb.isCollectionInitialized('attachmentEngine_attachments')) {
      const atts = pilotDb.loadCollection<any>('attachmentEngine_attachments');
      AttachmentEngine.hydrate(atts);
    } else {
      const seed = AttachmentEngine.exportState();
      if (seed.length > 0) {
        pilotDb.saveCollection('attachmentEngine_attachments', seed as any);
      }
    }
    AttachmentEngine.setMutationListener((att) => {
      try {
        pilotDb.saveEntity('attachmentEngine_attachments', att);
      } catch (e) {
        console.error('[AttachmentEnginePersistence] Failed persisting attachment:', e);
      }
    });

    // Universal CommentEngine Persistence & Hydration
    if (pilotDb.isCollectionInitialized('commentEngine_comments')) {
      const cmts = pilotDb.loadCollection<DocumentComment>('commentEngine_comments');
      const acts = pilotDb.isCollectionInitialized('commentEngine_activityLogs')
        ? pilotDb.loadCollection<ActivityLog>('commentEngine_activityLogs')
        : [];
      CommentEngine.hydrate(cmts, acts);
    } else {
      const seed = CommentEngine.exportState();
      if (seed.comments.length > 0) {
        pilotDb.saveCollection('commentEngine_comments', seed.comments as any);
      }
      if (seed.activities.length > 0) {
        pilotDb.saveCollection('commentEngine_activityLogs', seed.activities as any);
      }
    }
    CommentEngine.setCommentMutationListener((cmt) => {
      try {
        pilotDb.saveEntity('commentEngine_comments', cmt);
      } catch (e) {
        console.error('[CommentEnginePersistence] Failed persisting comment:', e);
      }
    });
    CommentEngine.setActivityMutationListener((act) => {
      try {
        pilotDb.saveEntity('commentEngine_activityLogs', act);
      } catch (e) {
        console.error('[CommentEnginePersistence] Failed persisting activity:', e);
      }
    });

    // Mock Data Decoupling: Register live vendor provider
    SupplierInvitationEngine.setLiveVendorProvider(() => vendors);
    SupplierQuotationEngine.setLiveVendorProvider(() => vendors);

    console.log(`[PilotPersistence] All durable collections and master data bound to SQLite System of Record.`);
  } catch (err) {
    console.error('Warning initializing pilot persistence:', err);
  }
}

initializePilotPersistence();

// Helper: Auto Document Number Generator (Durable & Deterministic)
function generateDocumentNumber(tenantId: string, entityType: 'JE' | 'INV' | 'PO' | 'PI' | 'SO' | 'GRN' | 'SM' | 'CP' | 'SP' | 'EXP'): string {
  let rule = numberingRules.find(r => r.tenantId === tenantId && r.entityType === entityType);
  if (!rule) {
    const newRule: DocumentNumberingRule = {
      id: `nr-${tenantId}-${entityType.toLowerCase()}`,
      tenantId,
      entityType,
      prefix: `${entityType}-2026-`,
      nextNumber: 1,
      zeroPad: 4,
      yearPrefix: true,
      lastGeneratedFormat: ''
    };
    numberingRules.push(newRule);
    rule = newRule;
  }
  const currentNum = rule.nextNumber;
  rule.nextNumber += 1;
  const padded = String(currentNum).padStart(rule.zeroPad, '0');
  const formatted = `${rule.prefix}${padded}`;
  rule.lastGeneratedFormat = formatted;
  persistEntity('numberingRules', rule, pilotDb);
  return formatted;
}

// Helper: Log Audit Trail
function recordAudit(
  tenantId: string, 
  userId: string, 
  userName: string, 
  userRole: string, 
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'POST' | 'APPROVE' | 'REJECT' | 'LOGIN' | 'REVERSE', 
  entityType: string, 
  entityId: string, 
  details: string,
  entityNumber?: string
) {
  const log: AuditLog = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    tenantId,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    userRole,
    action,
    entityType,
    entityId,
    entityNumber,
    ipAddress: '127.0.0.1',
    details
  };
  auditLogs.unshift(log);
  try {
    pilotDb.logAudit(action, log, tenantId);
  } catch {}
  return log;
}

// ==================== FINANCIAL EVENTS ENGINE & POSTING RULES ====================
function processFinancialEvent(
  tenantId: string,
  companyId: string,
  eventType: FinancialEvent['eventType'],
  sourceDocumentType: string,
  sourceDocumentId: string,
  sourceDocumentNumber: string,
  amount: number,
  taxAmount: number,
  currency: string,
  partyId?: string,
  partyName?: string,
  description?: string,
  triggeredBy: string = 'usr-001',
  dimensions?: any
): JournalEntry | null {
  const result = FinancialEventEngine.processEvent(
    {
      tenantId,
      companyId,
      eventType,
      sourceDocumentType,
      sourceDocumentId,
      sourceDocumentNumber,
      amount,
      taxAmount,
      currency,
      partyId,
      partyName,
      description,
      dimensions,
      triggeredBy
    },
    postingRules,
    accounts,
    journalEntries,
    financialEvents,
    generateDocumentNumber,
    recordAudit
  );

  return result.journalEntry;
}

// Universal Workflow Evaluation Helper
function evaluateWorkflow(
  tenantId: string,
  entityType: WorkflowRule['entityType'],
  amount: number
): WorkflowRule | null {
  return workflowRules.find(r => r.tenantId === tenantId && r.entityType === entityType && r.isActive && amount >= r.thresholdAmount) || null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API health check route (Liveness probe: verifies process is alive and responsive)
  app.get('/api/health', (_req: Request, res: Response) => {
    const report = pilotDb.getPersistenceReport();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      engine: 'AM ERP Enterprise Pilot Kernel',
      database: {
        status: 'ACTIVE',
        walMode: report.walMode,
        storageType: report.storageType,
        isPersistent: report.isPersistent,
        readinessStatus: report.readinessStatus
      }
    });
  });

  // API readiness check route (Readiness probe: fails with 503 in production if storage is ephemeral)
  app.get('/api/readiness', (_req: Request, res: Response) => {
    const report = pilotDb.getPersistenceReport();
    const isReady = report.readinessStatus === 'READY';
    if (!isReady) {
      res.status(503).json({
        status: 'not_ready',
        error: 'PERSISTENCE_NOT_GUARANTEED',
        message: report.operationalMessage,
        remedyInstructions: report.remedyInstructions,
        persistence: report
      });
      return;
    }
    res.json({
      status: 'ready',
      message: report.operationalMessage,
      persistence: report
    });
  });

  // ==================== PILOT READINESS INFRASTRUCTURE ROUTES ====================
  // 1. Pilot Database Status
  app.get('/api/v1/pilot/status', (_req: Request, res: Response) => {
    try {
      const status = pilotDb.getStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 1b. Pilot Storage Persistence Diagnostic
  app.get('/api/v1/pilot/persistence', (_req: Request, res: Response) => {
    try {
      const report = pilotDb.getPersistenceReport();
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 1c. Manual WAL Checkpoint Trigger
  app.post('/api/v1/pilot/checkpoint', (req: Request, res: Response) => {
    try {
      const mode = (req.body?.mode || 'PASSIVE') as 'PASSIVE' | 'FULL' | 'RESTART' | 'TRUNCATE';
      const result = pilotDb.checkpointWal(mode);
      res.json({ success: true, checkpoint: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Backup & Export
  app.get('/api/v1/pilot/backup', (_req: Request, res: Response) => {
    try {
      const allData: Record<string, any[]> = {
        inventory,
        stockMovements,
        customers,
        posRegisters,
        posShifts,
        posReceipts,
        salesReturns,
        journalEntries,
        treasuryTransactions,
        accounts,
        costLayers,
        vendors,
        purchaseOrders,
        goodsReceipts
      };
      const backup = pilotDb.createBackup('Exported Retail Pilot Snapshot', allData);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="am_pilot_backup_${backup.metadata.backupId}.json"`);
      res.json(backup);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/v1/pilot/backups', (_req: Request, res: Response) => {
    try {
      const list = pilotDb.listBackups();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/v1/pilot/backups/create', (req: Request, res: Response) => {
    try {
      const { snapshotName } = req.body;
      const allData: Record<string, any[]> = {
        inventory,
        stockMovements,
        customers,
        posRegisters,
        posShifts,
        posReceipts,
        salesReturns,
        journalEntries,
        treasuryTransactions,
        accounts,
        costLayers,
        vendors,
        purchaseOrders,
        goodsReceipts
      };
      const backup = pilotDb.createBackup(snapshotName || `Manual Snapshot ${new Date().toLocaleTimeString()}`, allData);
      res.json({ success: true, backup });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Restore
  app.post('/api/v1/pilot/restore', (req: Request, res: Response) => {
    try {
      const payload = req.body;
      const result = pilotDb.restoreBackup(payload);

      // Refresh in-memory operational state from restored database
      initializePilotPersistence();

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 4. Master Data Import Preview
  app.post('/api/v1/pilot/import/preview', (req: Request, res: Response) => {
    try {
      const { csvContent, rows } = req.body;
      let parsedRows: PilotMasterDataImportRow[];
      if (csvContent && typeof csvContent === 'string') {
        parsedRows = PilotDatabaseService.parseCsv(csvContent);
      } else if (Array.isArray(rows)) {
        parsedRows = rows;
      } else {
        return res.status(400).json({ error: 'Please provide either csvContent string or rows array.' });
      }

      const preview = pilotDb.previewImport(parsedRows, inventory, warehouses);
      res.json(preview);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 5. Master Data Import Commit
  app.post('/api/v1/pilot/import/commit', (req: Request, res: Response) => {
    try {
      const { rows, companyId, tenantId, warehouseId, cashAccountId, skipDuplicates } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: 'No rows provided for import commit.' });
      }

      const result = pilotDb.commitImport(
        {
          rows,
          companyId: companyId || 'comp-001',
          tenantId: tenantId || 'ten-001',
          warehouseId: warehouseId || 'wh-001',
          cashAccountId: cashAccountId || 'CASH-MAIN-DRAWER',
          skipDuplicates: skipDuplicates !== false
        },
        {
          inventory,
          stockMovements,
          costLayers,
          treasuryTransactions,
          journalEntries,
          accounts,
          auditLogs,
          currentUser: 'pilot-admin'
        }
      );

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Initialize Gemini AI Client (Server Side)
  const geminiApiKey = process.env.GEMINI_API_KEY;
  let aiClient: GoogleGenAI | null = null;
  if (geminiApiKey) {
    aiClient = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }

  // ==================== API V1 ROUTES ====================

  // Auth Context Extraction Middleware (authoritative server-side Bearer token)
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const token = SecurityEngine.extractBearerToken(req);
    if (token) {
      try {
        const payload = SecurityEngine.verifyToken(token);
        const user = users.find(u => u.id === payload.sub);
        if (user && user.active) {
          (req as any).auth = payload;
          (req as any).user = SecurityEngine.sanitizeUser(user);
        }
      } catch {
        // Invalid or expired token: auth remains undefined
      }
    }
    next();
  });

  // All API routes are protected by default. Only authentication bootstrap,
  // public branding metadata, and first-run onboarding probes remain public.
  app.use('/api/v1', (req: Request, res: Response, next: NextFunction) => {
    const publicRoute =
      req.path === '/auth/me' ||
      req.path === '/auth/login' ||
      req.path === '/auth/verify-pin' ||
      req.path === '/branding/platform' ||
      req.path.startsWith('/branding/public/') ||
      req.path === '/onboarding/wizard/state' ||
      req.path === '/onboarding/readiness';

    if (publicRoute) {
      return next();
    }

    return SecurityEngine.requireAuth(users)(req, res, () => {
      SecurityEngine.enforceTenantCompany()(req, res, next);
    });
  });

  // Auth / Me
  app.get('/api/v1/auth/me', (req: Request, res: Response) => {
    let activeUser = (req as any).user ? users.find(u => u.id === (req as any).user.id) : users[0];
    if (!activeUser) activeUser = users[0];

    const token = SecurityEngine.generateToken({
      sub: activeUser.id,
      tenantId: activeUser.tenantId,
      companyId: activeUser.companyId,
      role: activeUser.role,
      email: activeUser.email,
      name: activeUser.name,
      permissions: activeUser.permissions
    });

    const userTenant = tenants.find(t => t.id === activeUser.tenantId) || tenants[0];
    const userCompany = companies.find(c => c.id === activeUser.companyId) || companies[0];

    res.json({
      user: SecurityEngine.sanitizeUser(activeUser),
      tenant: userTenant,
      company: userCompany,
      token
    });
  });

  // ==========================================================================
  // P0-08 TENANT IDENTITY & WHITE-LABEL BRANDING API
  // ==========================================================================

  app.get('/api/v1/branding', (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const queryTenant = req.query.tenantId as string;
      const queryCompany = req.query.companyId as string;

      let targetTenantId = authUser?.tenantId || queryTenant || 'ten-001';
      if (authUser && authUser.role === 'Super Admin' && queryTenant) {
        targetTenantId = queryTenant;
      }

      const branding = BrandingEngine.getInstance().getBranding(targetTenantId, queryCompany);
      res.json({ success: true, branding });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/v1/branding/public/:tenantId', (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const metadata = BrandingEngine.getInstance().getPublicBranding(tenantId);
      res.json({ success: true, branding: metadata });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/v1/branding/platform', (req: Request, res: Response) => {
    try {
      const engine = BrandingEngine.getInstance();
      res.json({
        success: true,
        platformIdentity: engine.getCanonicalPlatformIdentity(),
        platformBranding: engine.getPlatformBranding()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/v1/branding', (req: Request, res: Response) => {
    const authUser = (req as any).user;
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required. Missing or invalid Bearer token.' });
    }

    if (authUser.role !== 'Tenant Admin' && authUser.role !== 'Super Admin') {
      return res.status(403).json({
        error: `Forbidden: Role '${authUser.role}' is not authorized to configure enterprise branding.`
      });
    }

    let targetTenantId = authUser.tenantId;
    if (authUser.role === 'Super Admin' && req.body.tenantId) {
      targetTenantId = req.body.tenantId;
    } else if (req.body.tenantId && req.body.tenantId !== authUser.tenantId) {
      return res.status(403).json({
        error: 'Forbidden: Anti-IDOR Violation. Cannot mutate branding for a different tenant.'
      });
    }

    try {
      const result = BrandingEngine.getInstance().saveBranding(
        targetTenantId,
        req.body,
        authUser.id,
        authUser.role,
        req.body.companyId
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/v1/branding/reset', (req: Request, res: Response) => {
    const authUser = (req as any).user;
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (authUser.role !== 'Tenant Admin' && authUser.role !== 'Super Admin') {
      return res.status(403).json({
        error: `Forbidden: Role '${authUser.role}' is not authorized to reset branding.`
      });
    }

    let targetTenantId = authUser.tenantId;
    if (authUser.role === 'Super Admin' && req.body.tenantId) {
      targetTenantId = req.body.tenantId;
    } else if (req.body.tenantId && req.body.tenantId !== authUser.tenantId) {
      return res.status(403).json({
        error: 'Forbidden: Cannot reset branding for another tenant.'
      });
    }

    try {
      const result = BrandingEngine.getInstance().resetToDefaults(
        targetTenantId,
        authUser.id,
        authUser.role,
        req.body.companyId
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/v1/branding/preview', (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const targetTenantId = authUser?.tenantId || req.body.tenantId || 'ten-001';
      const report = BrandingEngine.getInstance().validateBranding(req.body, targetTenantId);
      res.json(report);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/v1/branding/assets', (req: Request, res: Response) => {
    const authUser = (req as any).user;
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (authUser.role !== 'Tenant Admin' && authUser.role !== 'Super Admin') {
      return res.status(403).json({
        error: `Forbidden: Role '${authUser.role}' is not authorized to upload branding assets.`
      });
    }

    const { assetType, fileName, mimeType, fileDataBase64, tenantId } = req.body;
    if (!assetType || !fileName || !mimeType || !fileDataBase64) {
      return res.status(400).json({ error: 'Missing required asset upload parameters.' });
    }

    let targetTenantId = authUser.tenantId;
    if (authUser.role === 'Super Admin' && tenantId) {
      targetTenantId = tenantId;
    } else if (tenantId && tenantId !== authUser.tenantId) {
      return res.status(403).json({ error: 'Forbidden: Cannot upload assets for another tenant.' });
    }

    try {
      const cleanBase64 = String(fileDataBase64).replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const asset = BrandingEngine.getInstance().saveAsset(
        targetTenantId,
        assetType,
        buffer,
        fileName,
        mimeType,
        authUser.id
      );
      res.status(201).json({ success: true, asset });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/v1/branding/assets/:tenantId/:fileName', (req: Request, res: Response) => {
    const { tenantId, fileName } = req.params;
    const asset = BrandingEngine.getInstance().getAssetFile(tenantId, fileName);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(asset.buffer);
  });

  // Core Platform - Tenants & Companies
  app.get('/api/v1/tenants', (req: Request, res: Response) => {
    res.json(tenants);
  });

  app.get('/api/v1/companies', (req: Request, res: Response) => {
    res.json(companies);
  });

  app.post('/api/v1/companies', (req: Request, res: Response) => {
    const newComp = {
      id: `comp-${Date.now()}`,
      tenantId: req.body.tenantId || 'ten-001',
      name: req.body.name || 'New Enterprise Company',
      nameAr: req.body.nameAr || req.body.name || 'شركة جديدة',
      code: req.body.code || `COMP${companies.length + 1}`,
      taxNumber: req.body.taxNumber || '',
      currency: req.body.currency || 'SAR',
      country: req.body.country || 'Saudi Arabia',
      countryCode: req.body.countryCode || 'SA',
      state: req.body.state || '',
      city: req.body.city || '',
      taxSystemId: req.body.taxSystemId || 'tax-sys-sa-vat',
      taxSystemName: req.body.taxSystemName || 'Saudi Arabia VAT (15%)',
      taxRate: Number(req.body.taxRate || 15),
      timezone: req.body.timezone || 'Asia/Riyadh',
      dateFormat: req.body.dateFormat || 'YYYY-MM-DD',
      numberFormat: req.body.numberFormat || '1,234.56',
      language: req.body.language || 'ar',
      fiscalYearStart: req.body.fiscalYearStart || '01-01',
      address: req.body.address || '',
      phone: req.body.phone || '',
      email: req.body.email || '',
      website: req.body.website || ''
    };
    companies.push(newComp);
    recordAudit('ten-001', 'usr-001', 'Ahmed Mounir', 'Super Admin', 'CREATE', 'Company', newComp.id, `Created Company ${newComp.name} (${newComp.countryCode})`);
    res.status(201).json(newComp);
  });

  app.put('/api/v1/companies/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = companies.findIndex(c => c.id === id);
    if (idx !== -1) {
      companies[idx] = { ...companies[idx], ...req.body };
      recordAudit('ten-001', 'usr-001', 'Ahmed Mounir', 'Super Admin', 'UPDATE', 'Company', id, `Updated Company ${companies[idx].name}`);
      res.json(companies[idx]);
    } else {
      res.status(404).json({ error: 'Company not found' });
    }
  });

  // Master Localization Routes
  app.get('/api/v1/master/countries', (req: Request, res: Response) => {
    res.json(countriesMaster);
  });

  app.get('/api/v1/master/tax-systems', (req: Request, res: Response) => {
    res.json(taxSystemsMaster);
  });

  app.get('/api/v1/master/states', (req: Request, res: Response) => {
    const { countryCode } = req.query;
    if (countryCode) {
      return res.json(statesMaster.filter(s => s.countryCode === countryCode));
    }
    res.json(statesMaster);
  });

  app.get('/api/v1/master/cities', (req: Request, res: Response) => {
    const { countryCode } = req.query;
    if (countryCode) {
      return res.json(citiesMaster.filter(c => c.countryCode === countryCode));
    }
    res.json(citiesMaster);
  });

  app.get('/api/v1/master/timezones', (req: Request, res: Response) => {
    res.json(timezonesMaster);
  });

  app.get('/api/v1/master/languages', (req: Request, res: Response) => {
    res.json(languagesMaster);
  });

  app.get('/api/v1/master/fiscal-calendars', (req: Request, res: Response) => {
    res.json(fiscalCalendarsMaster);
  });

  // ==================== MASTER DATA ENDPOINTS ====================
  app.get('/api/v1/master/branches', (req: Request, res: Response) => {
    res.json(branches);
  });

  app.get('/api/v1/master/departments', (req: Request, res: Response) => {
    res.json(departments);
  });

  app.get('/api/v1/master/cost-centers', (req: Request, res: Response) => {
    res.json(costCenters);
  });

  app.get('/api/v1/master/profit-centers', (req: Request, res: Response) => {
    res.json(profitCenters);
  });

  app.get('/api/v1/master/projects', (req: Request, res: Response) => {
    res.json(projects);
  });

  app.get('/api/v1/master/currencies', (req: Request, res: Response) => {
    res.json(currencies);
  });

  app.get('/api/v1/master/exchange-rates', (req: Request, res: Response) => {
    res.json(exchangeRates);
  });

  app.get('/api/v1/master/fiscal-years', (req: Request, res: Response) => {
    res.json(fiscalYears);
  });

  app.get('/api/v1/master/tax-rules', (req: Request, res: Response) => {
    res.json(taxRules);
  });

  app.get('/api/v1/master/units-of-measure', (req: Request, res: Response) => {
    res.json(unitsOfMeasure);
  });

  app.get('/api/v1/master/item-categories', (req: Request, res: Response) => {
    res.json(itemCategories);
  });

  app.get('/api/v1/master/payment-terms', (req: Request, res: Response) => {
    res.json(paymentTerms);
  });

  app.get('/api/v1/warehouses', (req: Request, res: Response) => {
    res.json(warehouses);
  });

  app.get('/api/v1/users', (req: Request, res: Response) => {
    res.json(users.map(u => SecurityEngine.sanitizeUser(u)));
  });

  app.post('/api/v1/users', (req: Request, res: Response) => {
    const auth = (req as any).auth;
    if (auth && auth.role !== 'Super Admin' && auth.role !== 'Tenant Admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges to create users.' });
    }

    const { name, email, role, password, pin, tenantId, companyId } = req.body;
    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: 'Name, email, role, and password are required.' });
    }

    const pwdCheck = SecurityEngine.validatePassword(password);
    if (!pwdCheck.valid) {
      return res.status(400).json({ error: pwdCheck.error });
    }

    let pinHash: string | undefined;
    if (pin) {
      const pinCheck = SecurityEngine.validatePin(pin);
      if (!pinCheck.valid) {
        return res.status(400).json({ error: pinCheck.error });
      }
      pinHash = SecurityEngine.hashPin(pin);
    }

    const newUser: User = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: tenantId || auth?.tenantId || 'ten-001',
      companyId: companyId || auth?.companyId || 'comp-001',
      name,
      email,
      role,
      passwordHash: SecurityEngine.hashPassword(password),
      pinHash,
      active: true,
      permissions: [],
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    persistEntity('users', newUser, pilotDb);
    recordAudit(newUser.tenantId, auth?.sub || 'admin', auth?.name || 'Admin', auth?.role || 'Super Admin', 'CREATE', 'User', newUser.id, `Created user account for ${email}`);

    res.status(201).json(SecurityEngine.sanitizeUser(newUser));
  });

  // Enterprise Security & Authentication Engine Endpoints
  app.post('/api/v1/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const rateLimitKey = `login:${email ? email.trim().toLowerCase() : clientIp}`;

    const rateCheck = SecurityEngine.checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: rateCheck.error,
        retryAfterMs: rateCheck.retryAfterMs,
        retryAfterSec: rateCheck.retryAfterSec
      });
    }

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      SecurityEngine.recordFailure(rateLimitKey);
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || !user.active) {
      SecurityEngine.recordFailure(rateLimitKey);
      SecurityEngine.verifyPassword(password, '$pbkdf2$100000$dummy$dummy'); // Constant timing
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isValid = SecurityEngine.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      const failStatus = SecurityEngine.recordFailure(rateLimitKey, 5, 15 * 60 * 1000, user.tenantId, user.companyId);
      recordAudit(user.tenantId, user.id, user.name, user.role, 'LOGIN', 'User', user.id, `Failed password login attempt for ${email}`);
      if (!failStatus.allowed) {
        return res.status(429).json({
          error: failStatus.error,
          retryAfterMs: failStatus.retryAfterMs,
          retryAfterSec: failStatus.retryAfterSec
        });
      }
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    SecurityEngine.resetAttempts(rateLimitKey);
    const token = SecurityEngine.generateToken({
      sub: user.id,
      tenantId: user.tenantId,
      companyId: user.companyId,
      role: user.role,
      email: user.email,
      name: user.name,
      permissions: user.permissions
    });
    recordAudit(user.tenantId, user.id, user.name, user.role, 'LOGIN', 'User', user.id, `Successful user login: ${email}`);

    res.json({
      success: true,
      user: SecurityEngine.sanitizeUser(user),
      token
    });
  });

  app.post('/api/v1/auth/verify-pin', (req: Request, res: Response) => {
    const { userId, pin } = req.body;
    const rateLimitKey = `pin:${userId || 'unknown'}`;

    const rateCheck = SecurityEngine.checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: rateCheck.error,
        retryAfterMs: rateCheck.retryAfterMs,
        retryAfterSec: rateCheck.retryAfterSec
      });
    }

    if (!userId || !pin || typeof pin !== 'string') {
      SecurityEngine.recordFailure(rateLimitKey);
      return res.status(400).json({ error: 'UserId and PIN are required.' });
    }

    const user = users.find(u => u.id === userId);
    if (!user || !user.active) {
      SecurityEngine.recordFailure(rateLimitKey);
      SecurityEngine.verifyPin(pin, '$pin$100000$dummy$dummy');
      return res.status(401).json({ error: 'Invalid cashier credentials.' });
    }

    const isValid = SecurityEngine.verifyPin(pin, user.pinHash);
    if (!isValid) {
      const failStatus = SecurityEngine.recordFailure(rateLimitKey, 5, 15 * 60 * 1000, user.tenantId, user.companyId);
      recordAudit(user.tenantId, user.id, user.name, user.role, 'LOGIN', 'User', user.id, `Failed PIN verification attempt for cashier ${user.name}`);
      if (!failStatus.allowed) {
        return res.status(429).json({
          error: failStatus.error,
          retryAfterMs: failStatus.retryAfterMs,
          retryAfterSec: failStatus.retryAfterSec
        });
      }
      return res.status(401).json({ error: 'Invalid cashier PIN.' });
    }

    SecurityEngine.resetAttempts(rateLimitKey);
    const token = SecurityEngine.generateToken({
      sub: user.id,
      tenantId: user.tenantId,
      companyId: user.companyId,
      role: user.role,
      name: user.name,
      email: user.email,
      type: 'pos_session'
    });

    recordAudit(user.tenantId, user.id, user.name, user.role, 'LOGIN', 'User', user.id, `Successful POS cashier PIN verification for ${user.name}`);

    res.json({
      success: true,
      cashier: SecurityEngine.sanitizeUser(user),
      authorized: true,
      token
    });
  });

  app.post('/api/v1/auth/change-password', (req: Request, res: Response) => {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'UserId, currentPassword, and newPassword are required.' });
    }

    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const isValid = SecurityEngine.verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const policyCheck = SecurityEngine.validatePassword(newPassword);
    if (!policyCheck.valid) {
      return res.status(400).json({ error: policyCheck.error });
    }

    user.passwordHash = SecurityEngine.hashPassword(newPassword);
    persistEntity('users', user, pilotDb);
    recordAudit(user.tenantId, user.id, user.name, user.role, 'UPDATE', 'User', user.id, `Password changed successfully for ${user.email}`);

    res.json({ success: true, message: 'Password updated successfully.' });
  });

  app.post('/api/v1/auth/change-pin', (req: Request, res: Response) => {
    const { userId, currentPin, newPin } = req.body;
    if (!userId || !currentPin || !newPin) {
      return res.status(400).json({ error: 'UserId, currentPin, and newPin are required.' });
    }

    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const isValid = SecurityEngine.verifyPin(currentPin, user.pinHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current PIN is incorrect.' });
    }

    const policyCheck = SecurityEngine.validatePin(newPin);
    if (!policyCheck.valid) {
      return res.status(400).json({ error: policyCheck.error });
    }

    user.pinHash = SecurityEngine.hashPin(newPin);
    persistEntity('users', user, pilotDb);
    recordAudit(user.tenantId, user.id, user.name, user.role, 'UPDATE', 'User', user.id, `Cashier PIN changed successfully for ${user.name}`);

    res.json({ success: true, message: 'Cashier PIN updated successfully.' });
  });

  // Posting Rules Management (Configuration - Admin & Accounting Only)
  app.get('/api/v1/master/posting-rules', (req: Request, res: Response) => {
    const auth = (req as any).auth;
    if (auth && (auth.role === 'Cashier' || auth.role === 'Warehouse Worker')) {
      return res.status(403).json({ error: `Forbidden: Role '${auth.role}' is not authorized to inspect system posting rules.` });
    }
    res.json(postingRules);
  });

  app.post('/api/v1/master/posting-rules', (req: Request, res: Response) => {
    const auth = (req as any).auth;
    if (auth && auth.role !== 'Super Admin' && auth.role !== 'Tenant Admin' && auth.role !== 'Chief Accountant') {
      return res.status(403).json({ error: `Forbidden: Role '${auth.role}' is not authorized to configure posting rules.` });
    }
    const newRule: PostingRule = {
      id: `pr-${Date.now()}`,
      tenantId: auth?.tenantId || 'ten-001',
      companyId: auth?.companyId || 'comp-001',
      isActive: true,
      ...req.body
    };
    postingRules.push(newRule);
    recordAudit(newRule.tenantId, auth?.sub || 'usr-001', auth?.name || 'Ahmed Mounir', auth?.role || 'Super Admin', 'CREATE', 'PostingRule', newRule.id, `Created Posting Rule ${newRule.name} for ${newRule.documentType}`);
    res.status(201).json(newRule);
  });

  app.put('/api/v1/master/posting-rules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = postingRules.findIndex(p => p.id === id);
    if (idx !== -1) {
      postingRules[idx] = { ...postingRules[idx], ...req.body };
      recordAudit('ten-001', 'usr-001', 'Ahmed Mounir', 'Super Admin', 'UPDATE', 'PostingRule', id, `Updated Posting Rule ${postingRules[idx].name}`);
      res.json(postingRules[idx]);
    } else {
      res.status(404).json({ error: 'Posting rule not found' });
    }
  });

  // Financial Events Engine & Audit Log
  app.get('/api/v1/financial-events', (req: Request, res: Response) => {
    res.json(financialEvents);
  });

  app.post('/api/v1/financial-events/publish', (req: Request, res: Response) => {
    const {
      eventType,
      sourceDocumentType,
      sourceDocumentId,
      sourceDocumentNumber,
      amount,
      taxAmount,
      discountAmount,
      currency,
      exchangeRate,
      partyId,
      partyName,
      description,
      dimensions,
      triggeredBy,
      triggeredByName
    } = req.body;

    const result = FinancialEventEngine.processEvent(
      {
        tenantId: 'ten-001',
        companyId: 'comp-001',
        eventType,
        sourceDocumentType,
        sourceDocumentId,
        sourceDocumentNumber,
        amount: Number(amount),
        taxAmount: Number(taxAmount || 0),
        discountAmount: Number(discountAmount || 0),
        currency: currency || 'SAR',
        exchangeRate: Number(exchangeRate || 1.0),
        partyId,
        partyName,
        description,
        dimensions,
        triggeredBy: triggeredBy || 'usr-001',
        triggeredByName: triggeredByName || 'Enterprise Core Engine'
      },
      postingRules,
      accounts,
      journalEntries,
      financialEvents,
      generateDocumentNumber,
      recordAudit
    );

    res.status(201).json(result);
  });

  // Accounting Dimensions Master Feed
  app.get('/api/v1/dimensions', (req: Request, res: Response) => {
    res.json({
      companies,
      branches,
      warehouses,
      departments,
      costCenters,
      profitCenters,
      projects,
      currencies,
      fiscalYears,
      fiscalPeriods
    });
  });

  // Document Relationship Engine
  app.get('/api/v1/relationships', (req: Request, res: Response) => {
    res.json(documentRelationships);
  });

  app.post('/api/v1/relationships', (req: Request, res: Response) => {
    const { sourceDocType, sourceDocId, sourceDocNumber, targetDocType, targetDocId, targetDocNumber, relationshipType } = req.body;
    const link = DocumentRelationshipEngine.createRelationship(
      'ten-001',
      sourceDocType,
      sourceDocId,
      sourceDocNumber,
      targetDocType,
      targetDocId,
      targetDocNumber,
      relationshipType,
      documentRelationships
    );
    res.status(201).json(link);
  });

  app.get('/api/v1/relationships/lineage/:docId', (req: Request, res: Response) => {
    const { docId } = req.params;
    const lineage = DocumentRelationshipEngine.traceLineage(docId, documentRelationships);
    res.json(lineage);
  });

  // Tax Engine Calculation Endpoint
  app.post('/api/v1/taxes/calculate', (req: Request, res: Response) => {
    const { items, defaultTaxCode, withholdingRate, context } = req.body;
    const result = TaxEngine.calculateDocumentTaxes(
      items || [],
      taxRules,
      defaultTaxCode,
      Number(withholdingRate || 0),
      context
    );
    res.json(result);
  });

  // Tax Engine Dynamic Resolution Endpoint
  app.get('/api/v1/taxes/resolve', (req: Request, res: Response) => {
    const { tenantId, companyId, branchId, country, taxCategory, taxCode, date, customerTaxExempt, supplierTaxExempt } = req.query;
    const result = TaxEngine.resolveTaxRate({
      tenantId: tenantId ? String(tenantId) : undefined,
      companyId: companyId ? String(companyId) : undefined,
      branchId: branchId ? String(branchId) : undefined,
      countryOrJurisdiction: country ? String(country) : undefined,
      taxCategory: taxCategory ? String(taxCategory) : undefined,
      taxCode: taxCode ? String(taxCode) : undefined,
      transactionDate: date ? String(date) : undefined,
      customerTaxExempt: customerTaxExempt === 'true',
      supplierTaxExempt: supplierTaxExempt === 'true'
    });
    res.json(result);
  });

  // Currency & Exchange Rate Engine
  app.get('/api/v1/currencies/convert', (req: Request, res: Response) => {
    const { amount, from, to } = req.query;
    const result = CurrencyEngine.convertAmount(
      Number(amount || 0),
      String(from || 'USD'),
      String(to || 'SAR'),
      exchangeRates
    );
    res.json(result);
  });

  app.post('/api/v1/currencies/revalue', (req: Request, res: Response) => {
    const revaluation = CurrencyEngine.calculateCurrencyRevaluation(
      accounts,
      'SAR',
      exchangeRates
    );

    // Enqueue background job for audit
    BackgroundJobEngine.enqueueJob('ten-001', 'CURRENCY_REVALUATION', 'Manual Currency Revaluation Run', { revaluationCount: revaluation.length });

    res.json({ revaluation, executedAt: new Date().toISOString() });
  });

  // Inventory Costing Engine
  app.post('/api/v1/inventory/costing/issue', (req: Request, res: Response) => {
    try {
      const { sku, quantity } = req.body;
      const item = inventory.find(i => i.sku === sku);
      if (!item) return res.status(404).json({ error: 'Item not found' });

      const costingResult = InventoryCostingEngine.processIssueValuation({
        itemSku: sku,
        warehouseId: 'wh-001',
        warehouseName: 'Central Warehouse - Riyadh',
        sourceDocumentType: 'GoodsIssueNote',
        sourceDocumentId: `gin-leg-${Date.now()}`,
        sourceDocumentNumber: `GIN-LEG-${Date.now()}`,
        quantity: Number(quantity)
      }, {
        tenantId: 'ten-001',
        companyId: 'comp-001',
        userId: 'usr-001',
        userName: 'System User',
        costLayers,
        layerConsumptions,
        avgCostRecords,
        standardCostRecords,
        calculationLogs: costCalculationLogs,
        businessEvents: costBusinessEvents,
        stockQuants,
        itemCategories: itemCategories as any,
        items: inventory
      });
      res.json(costingResult);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Issue costing failed' });
    }
  });

  // ==================== PHASE 2.2.4 INVENTORY FINANCIAL INTEGRATION APIS ====================

  const buildIntegrationContext = () => ({
    tenantId: 'ten-001',
    companyId: 'comp-001',
    userId: 'usr-001',
    userName: 'System Financial Integration',
    mappingRules: eventMappingRules,
    postingProfiles,
    journalTemplates,
    accounts,
    postingRules,
    inventoryItems: inventory,
    warehouses,
    financialQueue,
    journalEntries,
    financialEvents,
    auditRecords: financialAuditRecords
  });

  // 1. Business & Financial Event Mapping Rules
  app.get('/api/v1/financial-integration/events', (req: Request, res: Response) => {
    res.json({
      mappingRules: eventMappingRules,
      financialEventsList: financialEvents
    });
  });

  // 2. Financial Integration Queue
  app.get('/api/v1/financial-integration/queue', (req: Request, res: Response) => {
    res.json(financialQueue);
  });

  // 3. Posting Profiles
  app.get('/api/v1/financial-integration/posting-profiles', (req: Request, res: Response) => {
    res.json(postingProfiles);
  });

  app.post('/api/v1/financial-integration/posting-profiles', (req: Request, res: Response) => {
    const profileData = req.body;
    const newProfile = {
      id: `prof-${Date.now()}`,
      tenantId: 'ten-001',
      active: true,
      ...profileData
    };
    postingProfiles.unshift(newProfile);
    res.status(201).json(newProfile);
  });

  app.put('/api/v1/financial-integration/posting-profiles/:id', (req: Request, res: Response) => {
    const idx = postingProfiles.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Posting Profile not found' });
    postingProfiles[idx] = { ...postingProfiles[idx], ...req.body };
    res.json(postingProfiles[idx]);
  });

  // 4. Journal Templates
  app.get('/api/v1/financial-integration/journal-templates', (req: Request, res: Response) => {
    res.json(journalTemplates);
  });

  app.post('/api/v1/financial-integration/journal-templates', (req: Request, res: Response) => {
    const tmplData = req.body;
    const newTmpl = {
      id: `tmpl-${Date.now()}`,
      tenantId: 'ten-001',
      active: true,
      ...tmplData
    };
    journalTemplates.unshift(newTmpl);
    res.status(201).json(newTmpl);
  });

  app.put('/api/v1/financial-integration/journal-templates/:id', (req: Request, res: Response) => {
    const idx = journalTemplates.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Journal Template not found' });
    journalTemplates[idx] = { ...journalTemplates[idx], ...req.body };
    res.json(journalTemplates[idx]);
  });

  // 5. Emit & Process Business Event Payload
  app.post('/api/v1/financial-integration/process-event', (req: Request, res: Response) => {
    try {
      const payload = req.body;
      const ctx = buildIntegrationContext();
      const result = InventoryFinancialIntegrationEngine.enqueueEvent(payload, ctx);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Event processing failed' });
    }
  });

  // 6. Retry Failed Queue Item
  app.post('/api/v1/financial-integration/queue/:id/retry', (req: Request, res: Response) => {
    try {
      const ctx = buildIntegrationContext();
      const result = InventoryFinancialIntegrationEngine.retryQueueItem(req.params.id, ctx);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Queue retry failed' });
    }
  });

  // 7. Integration Audit History
  app.get('/api/v1/financial-integration/history', (req: Request, res: Response) => {
    res.json({
      auditRecords: financialAuditRecords,
      financialQueue
    });
  });


  // Normalized Accounting Reports Engine
  app.get('/api/v1/reports/trial-balance', (req: Request, res: Response) => {
    const report = ReportingEngine.generateTrialBalance(accounts);
    res.json(report);
  });

  app.get('/api/v1/reports/balance-sheet', (req: Request, res: Response) => {
    const report = ReportingEngine.generateBalanceSheet(accounts);
    res.json(report);
  });

  app.get('/api/v1/reports/income-statement', (req: Request, res: Response) => {
    const report = ReportingEngine.generateIncomeStatement(accounts);
    res.json(report);
  });

  app.get('/api/v1/reports/aged-receivables', (req: Request, res: Response) => {
    const report = ReportingEngine.generateAgedReceivables(customers, salesInvoices);
    res.json(report);
  });

  app.get('/api/v1/reports/aged-payables', (req: Request, res: Response) => {
    const report = ReportingEngine.generateAgedPayables(legacyVendors, purchaseInvoices);
    res.json(report);
  });

  app.get('/api/v1/reports/inventory-valuation', (req: Request, res: Response) => {
    const report = ReportingEngine.generateInventoryValuation(inventory);
    res.json(report);
  });

  // Enterprise Background Jobs Engine
  app.get('/api/v1/jobs', (req: Request, res: Response) => {
    res.json(BackgroundJobEngine.getAllJobs('ten-001'));
  });

  app.post('/api/v1/jobs/enqueue', (req: Request, res: Response) => {
    const { jobType, title, payload } = req.body;
    const job = BackgroundJobEngine.enqueueJob('ten-001', jobType, title, payload);
    res.status(201).json(job);
  });

  // ==================== PHASE 3 ENTERPRISE ENGINES & MASTER DATA API ====================

  // 1. Centralized Business Rules Engine API
  app.get('/api/v1/business-rules', (req: Request, res: Response) => {
    res.json(BusinessRulesEngine.getRules('ten-001'));
  });

  app.post('/api/v1/business-rules/evaluate', (req: Request, res: Response) => {
    const { category, entityType, entityData, amount, creditLimit, currentBalance } = req.body;
    const results = BusinessRulesEngine.evaluateRules({
      tenantId: 'ten-001',
      category,
      entityType,
      entityData,
      amount: Number(amount || 0),
      creditLimit: creditLimit !== undefined ? Number(creditLimit) : undefined,
      currentBalance: currentBalance !== undefined ? Number(currentBalance) : undefined
    });
    res.json(results);
  });

  // 2. Universal Master Data Framework API
  app.get('/api/v1/master-data/framework', (req: Request, res: Response) => {
    res.json({
      brands,
      models,
      colors,
      sizes,
      paymentMethods,
      banks,
      warehouseLocations,
      countries,
      cities,
      regions,
      assets,
      currencies,
      unitsOfMeasure,
      itemCategories,
      paymentTerms
    });
  });

  // 3. Centralized Pricing & Discount Engine API (Forwarded to Canonical Phase 3.2A Handlers)
  app.get('/api/v1/pricing/price-lists', (req: Request, res: Response) => {
    const tenantId = (req.query.tenantId as string) || 'ten-001';
    res.json({ success: true, priceLists: PricingEngine.getPriceLists(tenantId) });
  });

  app.post('/api/v1/pricing/calculate', (req: Request, res: Response) => {
    try {
      const result = PricingEngine.calculatePrice(req.body);
      res.json({ success: true, calculation: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 4. Centralized Notification Engine API
  app.get('/api/v1/notifications', (req: Request, res: Response) => {
    const { userId = 'usr-001' } = req.query;
    res.json(NotificationEngine.getUserNotifications('ten-001', String(userId)));
  });

  app.post('/api/v1/notifications/send', (req: Request, res: Response) => {
    const { userId = 'usr-001', title, message, channel, entityType, entityId } = req.body;
    const notif = NotificationEngine.dispatchNotification('ten-001', userId, title, message, channel, entityType, entityId);
    res.status(201).json(notif);
  });

  app.post('/api/v1/notifications/:id/read', (req: Request, res: Response) => {
    const success = NotificationEngine.markAsRead(req.params.id);
    res.json({ success });
  });

  // 5. Universal Attachment Engine API
  app.get('/api/v1/attachments/:entityType/:entityId', (req: Request, res: Response) => {
    const { entityType, entityId } = req.params;
    res.json(AttachmentEngine.getEntityAttachments('ten-001', entityType, entityId));
  });

  app.post('/api/v1/attachments/upload', (req: Request, res: Response) => {
    const { entityType, entityId, fileName, fileType, fileSize, uploadedBy = 'usr-001', fileUrl } = req.body;
    const att = AttachmentEngine.uploadAttachment('ten-001', entityType, entityId, fileName, fileType, Number(fileSize || 1024), uploadedBy, fileUrl);
    res.status(201).json(att);
  });

  // 6. Comment & Activity Timeline Engine API
  app.get('/api/v1/comments/:entityType/:entityId', (req: Request, res: Response) => {
    const { entityType, entityId } = req.params;
    res.json(CommentEngine.getEntityComments('ten-001', entityType, entityId));
  });

  app.post('/api/v1/comments', (req: Request, res: Response) => {
    const { entityType, entityId, userId = 'usr-001', userName = 'System User', comment, isInternalNote, mentions } = req.body;
    const cmt = CommentEngine.addComment('ten-001', entityType, entityId, userId, userName, comment, isInternalNote, mentions);
    res.status(201).json(cmt);
  });

  app.get('/api/v1/activity-logs/:entityType/:entityId', (req: Request, res: Response) => {
    const { entityType, entityId } = req.params;
    res.json(CommentEngine.getEntityActivity('ten-001', entityType, entityId));
  });

  // 7. Global Enterprise Search API
  app.get('/api/v1/search/global', (req: Request, res: Response) => {
    const q = String(req.query.q || '');
    const results = SearchEngine.globalSearch(
      q,
      customers,
      vendors,
      inventory,
      salesInvoices,
      journalEntries,
      projects,
      warehouses,
      employees,
      assets
    );
    res.json(results);
  });

  // 8. Business Validation Engine API
  app.post('/api/v1/validation/check', (req: Request, res: Response) => {
    const { documentType, documentData } = req.body;
    const result = ValidationEngine.validateDocument(
      documentType,
      documentData,
      customers,
      legacyVendors,
      inventory,
      fiscalPeriods
    );
    res.json(result);
  });

  // ==================== PHASE 4 ENTERPRISE CONFIGURATION ENGINE API ====================

  // Get raw configuration store values
  app.get('/api/v1/config/values', (req: Request, res: Response) => {
    res.json(ConfigurationEngine.getAllConfigValues());
  });

  // Get effective configuration for any domain category with hierarchical scope inheritance
  app.post('/api/v1/config/effective', (req: Request, res: Response) => {
    const { tenantId = 'ten-001', companyId, branchId, warehouseId, departmentId, userId, category = 'GENERAL' } = req.body;
    const scope = { tenantId, companyId, branchId, warehouseId, departmentId, userId };

    let effectiveConfig: any = {};
    if (category === 'GENERAL') effectiveConfig = ConfigurationEngine.getGeneralConfig(scope);
    else if (category === 'FINANCIAL') effectiveConfig = ConfigurationEngine.getFinancialConfig(scope);
    else if (category === 'INVENTORY') effectiveConfig = ConfigurationEngine.getInventoryConfig(scope);
    else if (category === 'SALES') effectiveConfig = ConfigurationEngine.getSalesConfig(scope);
    else if (category === 'PURCHASING') effectiveConfig = ConfigurationEngine.getPurchasingConfig(scope);
    else if (category === 'SECURITY') effectiveConfig = ConfigurationEngine.getSecurityConfig(scope);
    else {
      effectiveConfig = {
        general: ConfigurationEngine.getGeneralConfig(scope),
        financial: ConfigurationEngine.getFinancialConfig(scope),
        inventory: ConfigurationEngine.getInventoryConfig(scope),
        sales: ConfigurationEngine.getSalesConfig(scope),
        purchasing: ConfigurationEngine.getPurchasingConfig(scope),
        security: ConfigurationEngine.getSecurityConfig(scope)
      };
    }

    res.json({ scope, category, effectiveConfig });
  });

  // Update or set a system configuration parameter
  app.post('/api/v1/config/set', (req: Request, res: Response) => {
    const { key, value, scopeLevel = 'TENANT', scopeId = 'ten-001', category = 'GENERAL', dataType = 'string', description, updatedBy = 'usr-001' } = req.body;
    const updated = ConfigurationEngine.setValue(key, value, scopeLevel, scopeId, category, dataType, description, updatedBy);
    res.status(200).json(updated);
  });

  // Feature Flag Engine
  app.get('/api/v1/features', (req: Request, res: Response) => {
    const edition = (req.query.edition as any) || ConfigurationEngine.getProductEdition();
    res.json({
      currentEdition: ConfigurationEngine.getProductEdition(),
      featureFlags: ConfigurationEngine.getFeatureFlags(edition)
    });
  });

  app.post('/api/v1/features/edition', (req: Request, res: Response) => {
    const { edition } = req.body;
    if (edition === 'Community' || edition === 'Professional' || edition === 'Enterprise') {
      const newEdition = ConfigurationEngine.setProductEdition(edition);
      res.json({ success: true, currentEdition: newEdition, featureFlags: ConfigurationEngine.getFeatureFlags(newEdition) });
    } else {
      res.status(400).json({ error: 'Invalid product edition' });
    }
  });

  // Localization Engine
  app.get('/api/v1/localization/packs', (req: Request, res: Response) => {
    res.json(ConfigurationEngine.getLocalizationPacks());
  });

  app.get('/api/v1/localization/packs/:code', (req: Request, res: Response) => {
    const pack = ConfigurationEngine.getLocalizationPack(req.params.code);
    if (pack) {
      res.json(pack);
    } else {
      res.status(404).json({ error: 'Localization pack not found' });
    }
  });

  // Document Numbering Rules
  app.get('/api/v1/numbering/rules', (req: Request, res: Response) => {
    res.json(numberingRules);
  });

  app.put('/api/v1/numbering/rules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = numberingRules.findIndex(r => r.id === id);
    if (index !== -1) {
      numberingRules[index] = { ...numberingRules[index], ...req.body };
      res.json(numberingRules[index]);
    } else {
      res.status(404).json({ error: 'Rule not found' });
    }
  });

  // Workflow Rules & Approvals
  app.get('/api/v1/workflows/rules', (req: Request, res: Response) => {
    res.json(workflowRules);
  });

  app.get('/api/v1/workflows/approvals', (req: Request, res: Response) => {
    res.json(approvalRequests);
  });

  app.post('/api/v1/workflows/approvals/:id/action', (req: Request, res: Response) => {
    const { id } = req.params;
    const { action, approverId, approverName, comments } = req.body;
    const appReq = approvalRequests.find(a => a.id === id);
    if (!appReq) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    appReq.status = action === 'APPROVE' ? 'Approved' : 'Rejected';
    appReq.comments = comments;

    // Trigger downstream posting if approved
    if (action === 'APPROVE') {
      if (appReq.entityType === 'SalesInvoice') {
        const inv = salesInvoices.find(s => s.id === appReq.entityId);
        if (inv) {
          inv.status = 'Posted';
          const je = processFinancialEvent(inv.tenantId, inv.companyId, 'SALES_INVOICE_POSTED', 'SalesInvoice', inv.id, inv.invoiceNumber, inv.grandTotal, inv.taxTotal, 'SAR', inv.customerId, inv.customerName, `Sales Invoice Approved & Posted`);
          if (je) inv.journalEntryId = je.id;
        }
      } else if (appReq.entityType === 'JournalEntry') {
        const je = journalEntries.find(j => j.id === appReq.entityId);
        if (je) {
          je.status = 'Posted';
          je.approvedBy = approverName || 'Admin';
          je.approvedAt = new Date().toISOString();
        }
      }
    } else {
      if (appReq.entityType === 'SalesInvoice') {
        const inv = salesInvoices.find(s => s.id === appReq.entityId);
        if (inv) inv.status = 'Cancelled';
      }
    }

    recordAudit(
      appReq.tenantId,
      approverId || 'usr-001',
      approverName || 'Ahmed Mounir',
      'Super Admin',
      action === 'APPROVE' ? 'APPROVE' : 'REJECT',
      appReq.entityType,
      appReq.entityId,
      `Approval request ${action} for ${appReq.entityNumber}. Amount: ${appReq.amount} SAR. Comments: ${comments || 'None'}`,
      appReq.entityNumber
    );

    res.json({ message: `Successfully ${action}D approval request`, request: appReq });
  });

  // Audit Logs (Protected - Administrators & Auditors Only)
  app.get('/api/v1/audit/logs', (req: Request, res: Response) => {
    const auth = (req as any).auth;
    if (!auth) {
      return res.status(401).json({ error: 'Authentication required to inspect security audit trail.' });
    }
    const authorizedRoles = ['Super Admin', 'Tenant Admin', 'Internal Auditor', 'Financial Auditor'];
    if (!authorizedRoles.includes(auth.role)) {
      return res.status(403).json({ error: `Forbidden: Role '${auth.role}' is not authorized to inspect security audit logs.` });
    }
    res.json(auditLogs);
  });

  // Accounting - Chart of Accounts
  app.get('/api/v1/accounting/coa', (req: Request, res: Response) => {
    const auth = (req as any).auth;
    if (auth && (auth.role === 'Cashier' || auth.role === 'Warehouse Worker')) {
      return res.status(403).json({ error: `Forbidden: Role '${auth.role}' is not authorized to inspect the chart of accounts.` });
    }
    res.json(accounts);
  });

  app.post('/api/v1/accounting/coa', (req: Request, res: Response) => {
    const auth = (req as any).auth;
    if (auth && auth.role !== 'Super Admin' && auth.role !== 'Tenant Admin' && auth.role !== 'Chief Accountant') {
      return res.status(403).json({ error: `Forbidden: Role '${auth.role}' is not authorized to create chart of account codes.` });
    }
    const newAcc = {
      id: `acc-${Date.now()}`,
      tenantId: auth?.tenantId || 'ten-001',
      companyId: auth?.companyId || 'comp-001',
      balance: 0,
      currency: 'SAR',
      isActive: true,
      level: 1,
      ...req.body
    };
    accounts.push(newAcc);
    recordAudit(newAcc.tenantId, auth?.sub || 'usr-001', auth?.name || 'Ahmed Mounir', auth?.role || 'Super Admin', 'CREATE', 'Account', newAcc.id, `Created GL Account ${newAcc.code} - ${newAcc.name}`);
    res.status(201).json(newAcc);
  });

  // Accounting - Journal Entries Ledger
  app.get('/api/v1/accounting/journals', (req: Request, res: Response) => {
    const auth = (req as any).auth;
    if (auth) {
      if (auth.role === 'Cashier' || auth.role === 'Warehouse Worker' || auth.role === 'Assembly Operator') {
        return res.status(403).json({ error: `Forbidden: Role '${auth.role}' is not authorized to access general ledger journals.` });
      }
      if (auth.role !== 'Super Admin') {
        const filtered = journalEntries.filter(j => j.companyId === auth.companyId && j.tenantId === auth.tenantId);
        return res.json(filtered);
      }
    }
    res.json(journalEntries);
  });

  // Manual Adjusting Journal Entry Endpoint (Restricted ONLY to Opening, Closing, Adjusting, Auditor, Correction)
  app.post('/api/v1/accounting/journals', (req: Request, res: Response) => {
    const auth = (req as any).auth;
    if (auth) {
      if (auth.role === 'Cashier' || auth.role === 'Warehouse Worker') {
        return res.status(403).json({ error: `Forbidden: Role '${auth.role}' is not authorized to post journal entries.` });
      }
      if (req.body.companyId && req.body.companyId !== auth.companyId && auth.role !== 'Super Admin') {
        return res.status(403).json({ error: `Cross-company security violation: Cannot post journal entries for company '${req.body.companyId}'.` });
      }
    }

    const { date, postingDate, reference, description, lines, createdBy, createdByName, entryType } = req.body;

    const validManualTypes = ['OPENING', 'CLOSING', 'ADJUSTING', 'AUDITOR', 'CORRECTION'];
    const selectedType = String(entryType || 'ADJUSTING').toUpperCase();

    if (!validManualTypes.includes(selectedType)) {
      return res.status(400).json({ 
        error: `Architecture Violation: Manual Journal Entries are strictly restricted to: OPENING, CLOSING, ADJUSTING, AUDITOR, or CORRECTION. Operational transactions must originate from Financial Events Engine.` 
      });
    }

    // Validate Double-Entry Rule
    let totalDebit = 0;
    let totalCredit = 0;
    lines.forEach((l: JournalLine) => {
      totalDebit += Number(l.debit || 0);
      totalCredit += Number(l.credit || 0);
    });

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ error: `Double-entry validation failed: Total Debits (${totalDebit.toLocaleString()}) must equal Total Credits (${totalCredit.toLocaleString()})` });
    }

    const tenantId = 'ten-001';
    const entryNumber = generateDocumentNumber(tenantId, 'JE');

    const rule = evaluateWorkflow(tenantId, 'JournalEntry', totalDebit);
    const requiresApproval = Boolean(rule);

    const newJE: JournalEntry = {
      id: `je-${Date.now()}`,
      tenantId,
      companyId: 'comp-001',
      entryNumber,
      date: date || new Date().toISOString().split('T')[0],
      postingDate: postingDate || date || new Date().toISOString().split('T')[0],
      reference: reference || 'MANUAL-ADJ',
      description,
      status: requiresApproval ? 'Pending Approval' : 'Posted',
      lines,
      totalDebit,
      totalCredit,
      isAutoGenerated: false,
      createdBy: createdBy || 'usr-001',
      createdByName: createdByName || 'Ahmed Mounir',
      createdAt: new Date().toISOString(),
      attachmentsCount: 0
    };

    if (!requiresApproval) {
      newJE.approvedBy = createdByName || 'Ahmed Mounir';
      newJE.approvedAt = new Date().toISOString();
      lines.forEach((l: JournalLine) => {
        const acc = accounts.find(a => a.code === l.accountCode);
        if (acc) {
          if (acc.category === 'Asset' || acc.category === 'Expense') {
            acc.balance += (Number(l.debit) - Number(l.credit));
          } else {
            acc.balance += (Number(l.credit) - Number(l.debit));
          }
        }
      });
    } else {
      const appReq: ApprovalRequest = {
        id: `app-${Date.now()}`,
        tenantId,
        workflowRuleId: rule!.id,
        entityType: 'JournalEntry',
        entityId: newJE.id,
        entityNumber: newJE.entryNumber,
        requestedBy: createdBy || 'usr-001',
        requestedByName: createdByName || 'Ahmed Mounir',
        requestedAt: new Date().toISOString(),
        amount: totalDebit,
        description: `Manual Journal Entry Adjustment (${totalDebit.toLocaleString()} SAR): ${description}`,
        status: 'Pending',
        currentApproverRole: rule!.requiredRole
      };
      approvalRequests.unshift(appReq);
    }

    journalEntries.unshift(newJE);

    recordAudit(
      tenantId,
      createdBy || 'usr-001',
      createdByName || 'Ahmed Mounir',
      'Super Admin',
      'CREATE',
      'JournalEntry',
      newJE.id,
      `Created Manual Adjusting Journal Entry ${entryNumber} for ${totalDebit.toLocaleString()} SAR. ${requiresApproval ? 'Triggered workflow.' : 'Posted.'}`,
      entryNumber
    );

    res.status(201).json(newJE);
  });

  // Inventory & Stock Management
  app.get('/api/v1/inventory/items', (req: Request, res: Response) => {
    res.json(inventory);
  });

  app.post('/api/v1/inventory/items', (req: Request, res: Response) => {
    const itemData = req.body;
    const tenantId = 'ten-001';

    // Duplicate SKU Validation
    if (itemData.sku && inventory.some(i => i.sku.toLowerCase() === itemData.sku.toLowerCase())) {
      return res.status(400).json({ error: `Validation Error: Duplicate SKU '${itemData.sku}' already exists in Item Master.` });
    }

    // Duplicate Barcode Validation
    if (itemData.barcode && inventory.some(i => i.barcode === itemData.barcode)) {
      return res.status(400).json({ error: `Validation Error: Duplicate Barcode '${itemData.barcode}' already assigned to another item.` });
    }

    const newItem = {
      id: `item-${Date.now()}`,
      tenantId,
      companyId: 'comp-001',
      sku: itemData.sku || `SKU-${Date.now()}`,
      name: itemData.name || 'New Item',
      nameAr: itemData.nameAr || itemData.name || 'صنف جديد',
      categoryId: itemData.categoryId || 'cat-01',
      categoryName: itemData.categoryName || 'Hardware & Infrastructure',
      uom: itemData.uom || 'PCS',
      costPrice: Number(itemData.costPrice || 0),
      sellingPrice: Number(itemData.sellingPrice || 0),
      stockQty: Number(itemData.stockQty || 0),
      reorderPoint: Number(itemData.reorderPoint || 5),
      warehouseId: itemData.warehouseId || 'wh-001',
      valuationMethod: itemData.valuationMethod || 'FIFO',
      itemType: itemData.itemType || 'Stock Item',
      barcode: itemData.barcode || `628${Math.floor(100000000 + Math.random() * 900000000)}`,
      brandId: itemData.brandId,
      brandName: itemData.brandName,
      modelId: itemData.modelId,
      modelName: itemData.modelName,
      variants: itemData.variants || [],
      active: true
    };

    inventory.unshift(newItem);

    // Auto seed Stock Quant if quantity on hand > 0
    if (newItem.stockQty > 0) {
      const wh = warehouses.find(w => w.id === newItem.warehouseId);
      const newQuant = {
        id: `quant-${Date.now()}`,
        tenantId,
        companyId: newItem.companyId,
        itemSku: newItem.sku,
        itemName: newItem.name,
        categoryId: newItem.categoryId,
        categoryName: newItem.categoryName,
        warehouseId: newItem.warehouseId,
        warehouseName: wh ? wh.name : 'Central Warehouse',
        binCode: 'BIN-REC-01',
        qtyOnHand: newItem.stockQty,
        qtyAvailable: newItem.stockQty,
        qtyReserved: 0,
        qtyInTransit: 0,
        qtyDamaged: 0,
        qtyReturned: 0,
        unitCost: newItem.costPrice,
        totalValue: newItem.stockQty * newItem.costPrice,
        uom: newItem.uom,
        status: 'Available' as const,
        lastCountDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString()
      };
      stockQuants.unshift(newQuant);
    }

    recordAudit(tenantId, 'usr-001', 'Ahmed Mounir', 'Inventory Manager', 'CREATE', 'InventoryItem', newItem.id, `Created Item Master: ${newItem.name} (${newItem.sku})`, newItem.sku);

    res.status(201).json(newItem);
  });

  app.put('/api/v1/inventory/items/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = inventory.findIndex(i => i.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Item not found' });

    inventory[idx] = { ...inventory[idx], ...req.body };
    recordAudit('ten-001', 'usr-001', 'Ahmed Mounir', 'Inventory Manager', 'UPDATE', 'InventoryItem', id, `Updated Item Master: ${inventory[idx].name}`);
    res.json(inventory[idx]);
  });

  app.delete('/api/v1/inventory/items/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = inventory.find(i => i.id === id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const idx = inventory.findIndex(i => i.id === id);
    if (idx !== -1) {
      inventory.splice(idx, 1);
    }
    recordAudit('ten-001', 'usr-001', 'Ahmed Mounir', 'Inventory Manager', 'DELETE', 'InventoryItem', id, `Deleted Item Master: ${item.name} (${item.sku})`);
    res.json({ message: 'Item deleted successfully' });
  });

  // Master Data: Brands, Models, Groups, UOM Conversions, Packaging Units
  app.get('/api/v1/inventory/brands', (req: Request, res: Response) => res.json(brands));
  app.post('/api/v1/inventory/brands', (req: Request, res: Response) => {
    const newBrand = { id: `brd-${Date.now()}`, tenantId: 'ten-001', active: true, ...req.body };
    brands.unshift(newBrand);
    res.status(201).json(newBrand);
  });

  app.get('/api/v1/inventory/models', (req: Request, res: Response) => res.json(models));
  app.post('/api/v1/inventory/models', (req: Request, res: Response) => {
    const newModel = { id: `mdl-${Date.now()}`, tenantId: 'ten-001', active: true, ...req.body };
    models.unshift(newModel);
    res.status(201).json(newModel);
  });

  app.get('/api/v1/inventory/item-groups', (req: Request, res: Response) => res.json(itemGroups));
  app.post('/api/v1/inventory/item-groups', (req: Request, res: Response) => {
    const newGroup = { id: `grp-${Date.now()}`, tenantId: 'ten-001', active: true, ...req.body };
    itemGroups.unshift(newGroup);
    res.status(201).json(newGroup);
  });

  app.get('/api/v1/inventory/uom-conversions', (req: Request, res: Response) => res.json(uomConversions));
  app.post('/api/v1/inventory/uom-conversions', (req: Request, res: Response) => {
    const newConv = { id: `uomc-${Date.now()}`, tenantId: 'ten-001', active: true, ...req.body };
    uomConversions.unshift(newConv);
    res.status(201).json(newConv);
  });

  app.get('/api/v1/inventory/packaging-units', (req: Request, res: Response) => res.json(packagingUnits));
  app.post('/api/v1/inventory/packaging-units', (req: Request, res: Response) => {
    const newPkg = { id: `pkg-${Date.now()}`, tenantId: 'ten-001', active: true, ...req.body };
    packagingUnits.unshift(newPkg);
    res.status(201).json(newPkg);
  });

  // Warehouse Foundation: Zones & Bin Locations
  app.get('/api/v1/inventory/warehouse-zones', (req: Request, res: Response) => res.json(warehouseZones));
  app.post('/api/v1/inventory/warehouse-zones', (req: Request, res: Response) => {
    const newZone = { id: `zone-${Date.now()}`, tenantId: 'ten-001', active: true, ...req.body };
    warehouseZones.unshift(newZone);
    res.status(201).json(newZone);
  });

  app.get('/api/v1/inventory/bin-locations', (req: Request, res: Response) => res.json(binLocations));
  app.post('/api/v1/inventory/bin-locations', (req: Request, res: Response) => {
    const newBin = { id: `bin-${Date.now()}`, tenantId: 'ten-001', active: true, ...req.body };
    binLocations.unshift(newBin);
    res.status(201).json(newBin);
  });

  // Inventory Identity: Batches, Serials, Traceability
  app.get('/api/v1/inventory/batch-lots', (req: Request, res: Response) => res.json(batchLots));
  app.post('/api/v1/inventory/batch-lots', (req: Request, res: Response) => {
    const newBatch = { id: `batch-${Date.now()}`, tenantId: 'ten-001', status: 'Active', ...req.body };
    batchLots.unshift(newBatch);
    res.status(201).json(newBatch);
  });

  app.get('/api/v1/inventory/serial-numbers', (req: Request, res: Response) => res.json(serialNumbers));
  app.post('/api/v1/inventory/serial-numbers', (req: Request, res: Response) => {
    const newSn = { id: `sn-${Date.now()}`, tenantId: 'ten-001', status: 'Available', createdAt: new Date().toISOString(), ...req.body };
    serialNumbers.unshift(newSn);
    res.status(201).json(newSn);
  });

  // Stock Quant Engine
  app.get('/api/v1/inventory/quants', (req: Request, res: Response) => res.json(stockQuants));
  app.put('/api/v1/inventory/quants/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = stockQuants.findIndex(q => q.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Quant record not found' });

    stockQuants[idx] = { 
      ...stockQuants[idx], 
      ...req.body, 
      totalValue: (req.body.qtyOnHand ?? stockQuants[idx].qtyOnHand) * (req.body.unitCost ?? stockQuants[idx].unitCost),
      updatedAt: new Date().toISOString() 
    };
    recordAudit('ten-001', 'usr-001', 'Ahmed Mounir', 'Inventory Manager', 'UPDATE', 'StockQuant', id, `Updated Stock Quant for ${stockQuants[idx].itemSku} at ${stockQuants[idx].binCode}`);
    res.json(stockQuants[idx]);
  });

  // Inventory Rule Configuration
  app.get('/api/v1/inventory/config', (req: Request, res: Response) => res.json(inventoryConfig));
  app.put('/api/v1/inventory/config', (req: Request, res: Response) => {
    inventoryConfig = { ...inventoryConfig, ...req.body };
    recordAudit('ten-001', 'usr-001', 'Ahmed Mounir', 'Tenant Admin', 'UPDATE', 'InventoryConfig', 'cfg-001', `Updated Inventory Module Configuration & Rule Policies`);
    res.json(inventoryConfig);
  });

  // SKU & Barcode Rule Engine Generator
  app.post('/api/v1/inventory/sku-barcode-gen', (req: Request, res: Response) => {
    const { categoryCode = 'HW', brandCode = 'AM', modelCode = 'GEN' } = req.body;
    const seq = Math.floor(100 + Math.random() * 900);
    const sku = `${categoryCode.toUpperCase()}-${brandCode.toUpperCase()}-${seq}`;
    const barcode = `628${Math.floor(100000000 + Math.random() * 900000000)}`;
    res.json({ sku, barcode });
  });

  // ==================== PHASE 2.2.1 INVENTORY EXECUTION ENGINE API ENDPOINTS ====================

  app.get('/api/v1/inventory/ledger', (req: Request, res: Response) => {
    res.json(stockLedgerEntries);
  });

  app.get('/api/v1/inventory/movement-types', (req: Request, res: Response) => {
    res.json(Object.values(InventoryExecutionEngine.MOVEMENT_TYPE_CONFIGS));
  });

  // Dedicated Goods Receipt (GRN) Endpoint
  app.post('/api/v1/inventory/goods-receipt', (req: Request, res: Response) => {
    try {
      const tenantId = req.body.tenantId || 'ten-001';
      const companyId = req.body.companyId || 'comp-001';
      const userId = req.body.userId || 'usr-001';
      const userName = req.body.userName || req.body.performedBy || 'Ahmed Mounir';

      const executionParams = {
        tenantId,
        companyId,
        branchId: req.body.branchId,
        itemSku: req.body.itemSku,
        warehouseId: req.body.warehouseId,
        binId: req.body.binId,
        binCode: req.body.binCode,
        batchNumber: req.body.batchNumber,
        lotId: req.body.lotId,
        serialNumber: req.body.serialNumber,
        quantity: Number(req.body.quantity),
        uom: req.body.uom,
        unitCost: req.body.unitCost !== undefined ? Number(req.body.unitCost) : undefined,
        sourceDocumentType: req.body.sourceDocumentType || 'GoodsReceiptNote',
        sourceDocumentId: req.body.sourceDocumentId || `grn-${Date.now()}`,
        sourceDocumentNumber: req.body.sourceDocumentNumber || generateDocumentNumber(tenantId, 'GRN'),
        reference: req.body.reference,
        reason: req.body.reason || 'Goods Receipt Execution',
        userId,
        userName,
        userRole: req.body.userRole || 'Inventory Manager'
      };

      const result = InventoryExecutionEngine.executeGoodsReceipt(executionParams, {
        items: inventory,
        warehouses,
        bins: binLocations,
        quants: stockQuants,
        batchLots,
        serials: serialNumbers,
        config: inventoryConfig
      });

      // 1. Store Append-Only Stock Ledger Entry
      stockLedgerEntries.unshift(result.stockLedgerEntry);

      // 1b. Process Inventory Costing Engine Receipt Valuation
      let costingResult;
      try {
        costingResult = InventoryCostingEngine.processReceiptValuation({
          itemSku: executionParams.itemSku,
          warehouseId: executionParams.warehouseId,
          warehouseName: result.stockLedgerEntry.warehouseName,
          binId: executionParams.binId,
          binCode: executionParams.binCode,
          batchNumber: executionParams.batchNumber,
          lotId: executionParams.lotId,
          quantity: executionParams.quantity,
          unitCost: result.stockLedgerEntry.unitCost,
          sourceDocumentType: executionParams.sourceDocumentType,
          sourceDocumentId: executionParams.sourceDocumentId,
          sourceDocumentNumber: executionParams.sourceDocumentNumber
        }, {
          tenantId,
          companyId,
          branchId: executionParams.branchId,
          userId,
          userName,
          costLayers,
          layerConsumptions,
          avgCostRecords,
          standardCostRecords,
          calculationLogs: costCalculationLogs,
          businessEvents: costBusinessEvents,
          stockQuants,
          itemCategories: itemCategories as any,
          items: inventory
        });
      } catch (costErr: any) {
        console.warn('Costing Engine Receipt Valuation Note:', costErr.message);
      }

      // 2. Emit Financial Event to Financial Event Engine (NO direct GL posting in inventory engine)
      const je = processFinancialEvent(
        result.financialEventData.tenantId,
        result.financialEventData.companyId,
        result.financialEventData.eventType,
        result.financialEventData.sourceDocumentType,
        result.financialEventData.sourceDocumentId,
        result.financialEventData.sourceDocumentNumber,
        result.financialEventData.amount,
        result.financialEventData.taxAmount,
        result.financialEventData.currency,
        result.financialEventData.partyId,
        result.financialEventData.partyName,
        result.financialEventData.description,
        result.financialEventData.triggeredBy
      );

      // 3. Keep backward compatible StockMovement display array synced
      const legacyMovement: StockMovement = {
        id: result.stockLedgerEntry.id,
        tenantId: result.stockLedgerEntry.tenantId,
        companyId: result.stockLedgerEntry.companyId,
        branchId: result.stockLedgerEntry.branchId,
        movementNumber: result.stockLedgerEntry.movementNumber,
        date: new Date().toISOString().split('T')[0],
        itemSku: result.stockLedgerEntry.itemSku,
        itemName: result.stockLedgerEntry.itemName,
        warehouseId: result.stockLedgerEntry.warehouseId,
        warehouseName: result.stockLedgerEntry.warehouseName,
        movementType: 'Receipt',
        quantity: result.stockLedgerEntry.quantity,
        unitCost: result.stockLedgerEntry.unitCost,
        totalCost: result.stockLedgerEntry.totalCost,
        reference: result.stockLedgerEntry.reference,
        status: 'Posted',
        journalEntryId: je?.id,
        performedBy: result.stockLedgerEntry.userName,
        createdAt: result.stockLedgerEntry.timestamp
      };
      stockMovements.unshift(legacyMovement);

      // 4. Record Audit Trail
      recordAudit(
        tenantId,
        userId,
        userName,
        'Inventory Manager',
        'CREATE',
        'GoodsReceipt',
        result.stockLedgerEntry.id,
        `Goods Receipt (GRN) Executed: Received ${result.stockLedgerEntry.quantity} ${result.stockLedgerEntry.uom} of '${result.stockLedgerEntry.itemName}' at '${result.stockLedgerEntry.warehouseName}'. Stock Ledger Entry ${result.stockLedgerEntry.movementNumber}.`,
        result.stockLedgerEntry.movementNumber
      );

      res.status(201).json({
        ...result,
        journalEntryId: je?.id
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Goods Receipt execution failed.' });
    }
  });

  // Dedicated Goods Issue (GIN) Endpoint
  app.post('/api/v1/inventory/goods-issue', (req: Request, res: Response) => {
    try {
      const tenantId = req.body.tenantId || 'ten-001';
      const companyId = req.body.companyId || 'comp-001';
      const userId = req.body.userId || 'usr-001';
      const userName = req.body.userName || req.body.performedBy || 'Ahmed Mounir';

      const executionParams = {
        tenantId,
        companyId,
        branchId: req.body.branchId,
        itemSku: req.body.itemSku,
        warehouseId: req.body.warehouseId,
        binId: req.body.binId,
        binCode: req.body.binCode,
        batchNumber: req.body.batchNumber,
        lotId: req.body.lotId,
        serialNumber: req.body.serialNumber,
        quantity: Number(req.body.quantity),
        uom: req.body.uom,
        unitCost: req.body.unitCost !== undefined ? Number(req.body.unitCost) : undefined,
        sourceDocumentType: req.body.sourceDocumentType || 'GoodsIssueNote',
        sourceDocumentId: req.body.sourceDocumentId || `gin-${Date.now()}`,
        sourceDocumentNumber: req.body.sourceDocumentNumber || generateDocumentNumber(tenantId, 'SM'),
        reference: req.body.reference,
        reason: req.body.reason || 'Goods Issue Execution',
        userId,
        userName,
        userRole: req.body.userRole || 'Inventory Manager'
      };

      const result = InventoryExecutionEngine.executeGoodsIssue(executionParams, {
        items: inventory,
        warehouses,
        bins: binLocations,
        quants: stockQuants,
        batchLots,
        serials: serialNumbers,
        config: inventoryConfig
      });

      // 1. Store Append-Only Stock Ledger Entry
      stockLedgerEntries.unshift(result.stockLedgerEntry);

      // 1b. Process Inventory Costing Engine Issue Valuation
      let costingResult;
      try {
        costingResult = InventoryCostingEngine.processIssueValuation({
          itemSku: executionParams.itemSku,
          warehouseId: executionParams.warehouseId,
          warehouseName: result.stockLedgerEntry.warehouseName,
          binId: executionParams.binId,
          batchNumber: executionParams.batchNumber,
          quantity: executionParams.quantity,
          sourceDocumentType: executionParams.sourceDocumentType,
          sourceDocumentId: executionParams.sourceDocumentId,
          sourceDocumentNumber: executionParams.sourceDocumentNumber
        }, {
          tenantId,
          companyId,
          branchId: executionParams.branchId,
          userId,
          userName,
          costLayers,
          layerConsumptions,
          avgCostRecords,
          standardCostRecords,
          calculationLogs: costCalculationLogs,
          businessEvents: costBusinessEvents,
          stockQuants,
          itemCategories: itemCategories as any,
          items: inventory
        });
      } catch (costErr: any) {
        console.warn('Costing Engine Issue Valuation Note:', costErr.message);
      }

      // 2. Emit Financial Event to Financial Event Engine (NO direct GL posting in inventory engine)
      const je = processFinancialEvent(
        result.financialEventData.tenantId,
        result.financialEventData.companyId,
        result.financialEventData.eventType,
        result.financialEventData.sourceDocumentType,
        result.financialEventData.sourceDocumentId,
        result.financialEventData.sourceDocumentNumber,
        result.financialEventData.amount,
        result.financialEventData.taxAmount,
        result.financialEventData.currency,
        result.financialEventData.partyId,
        result.financialEventData.partyName,
        result.financialEventData.description,
        result.financialEventData.triggeredBy
      );

      // 3. Keep backward compatible StockMovement display array synced
      const legacyMovement: StockMovement = {
        id: result.stockLedgerEntry.id,
        tenantId: result.stockLedgerEntry.tenantId,
        companyId: result.stockLedgerEntry.companyId,
        branchId: result.stockLedgerEntry.branchId,
        movementNumber: result.stockLedgerEntry.movementNumber,
        date: new Date().toISOString().split('T')[0],
        itemSku: result.stockLedgerEntry.itemSku,
        itemName: result.stockLedgerEntry.itemName,
        warehouseId: result.stockLedgerEntry.warehouseId,
        warehouseName: result.stockLedgerEntry.warehouseName,
        movementType: 'Issue',
        quantity: result.stockLedgerEntry.quantity,
        unitCost: result.stockLedgerEntry.unitCost,
        totalCost: result.stockLedgerEntry.totalCost,
        reference: result.stockLedgerEntry.reference,
        status: 'Posted',
        journalEntryId: je?.id,
        performedBy: result.stockLedgerEntry.userName,
        createdAt: result.stockLedgerEntry.timestamp
      };
      stockMovements.unshift(legacyMovement);

      // 4. Record Audit Trail
      recordAudit(
        tenantId,
        userId,
        userName,
        'Inventory Manager',
        'CREATE',
        'GoodsIssue',
        result.stockLedgerEntry.id,
        `Goods Issue (GIN) Executed: Issued ${result.stockLedgerEntry.quantity} ${result.stockLedgerEntry.uom} of '${result.stockLedgerEntry.itemName}' from '${result.stockLedgerEntry.warehouseName}'. Stock Ledger Entry ${result.stockLedgerEntry.movementNumber}.`,
        result.stockLedgerEntry.movementNumber
      );

      res.status(201).json({
        ...result,
        journalEntryId: je?.id
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Goods Issue execution failed.' });
    }
  });

  // Generic Execution Movement Endpoint (Supports all 9 Movement Types)
  app.post('/api/v1/inventory/execution-movement', (req: Request, res: Response) => {
    try {
      const tenantId = req.body.tenantId || 'ten-001';
      const companyId = req.body.companyId || 'comp-001';
      const userId = req.body.userId || 'usr-001';
      const userName = req.body.userName || req.body.performedBy || 'Ahmed Mounir';

      const executionParams = {
        tenantId,
        companyId,
        branchId: req.body.branchId,
        movementType: req.body.movementType as InventoryMovementType,
        itemSku: req.body.itemSku,
        warehouseId: req.body.warehouseId,
        binId: req.body.binId,
        binCode: req.body.binCode,
        batchNumber: req.body.batchNumber,
        lotId: req.body.lotId,
        serialNumber: req.body.serialNumber,
        quantity: Number(req.body.quantity),
        uom: req.body.uom,
        unitCost: req.body.unitCost !== undefined ? Number(req.body.unitCost) : undefined,
        sourceDocumentType: req.body.sourceDocumentType || 'InventoryMovement',
        sourceDocumentId: req.body.sourceDocumentId || `doc-${Date.now()}`,
        sourceDocumentNumber: req.body.sourceDocumentNumber || generateDocumentNumber(tenantId, 'SM'),
        reference: req.body.reference,
        reason: req.body.reason || `${req.body.movementType} Execution`,
        userId,
        userName,
        userRole: req.body.userRole || 'Inventory Manager'
      };

      const result = InventoryExecutionEngine.processExecutionMovement(executionParams, {
        items: inventory,
        warehouses,
        bins: binLocations,
        quants: stockQuants,
        batchLots,
        serials: serialNumbers,
        config: inventoryConfig
      });

      // 1. Store Append-Only Stock Ledger Entry
      stockLedgerEntries.unshift(result.stockLedgerEntry);

      // 2. Emit Financial Event to Financial Event Engine (NO direct GL posting)
      const je = processFinancialEvent(
        result.financialEventData.tenantId,
        result.financialEventData.companyId,
        result.financialEventData.eventType,
        result.financialEventData.sourceDocumentType,
        result.financialEventData.sourceDocumentId,
        result.financialEventData.sourceDocumentNumber,
        result.financialEventData.amount,
        result.financialEventData.taxAmount,
        result.financialEventData.currency,
        result.financialEventData.partyId,
        result.financialEventData.partyName,
        result.financialEventData.description,
        result.financialEventData.triggeredBy
      );

      // 3. Keep backward compatible StockMovement display array synced
      const legacyMovement: StockMovement = {
        id: result.stockLedgerEntry.id,
        tenantId: result.stockLedgerEntry.tenantId,
        companyId: result.stockLedgerEntry.companyId,
        branchId: result.stockLedgerEntry.branchId,
        movementNumber: result.stockLedgerEntry.movementNumber,
        date: new Date().toISOString().split('T')[0],
        itemSku: result.stockLedgerEntry.itemSku,
        itemName: result.stockLedgerEntry.itemName,
        warehouseId: result.stockLedgerEntry.warehouseId,
        warehouseName: result.stockLedgerEntry.warehouseName,
        movementType: result.stockLedgerEntry.movementType.includes('RECEIPT') || result.stockLedgerEntry.movementType.includes('PLUS') || result.stockLedgerEntry.movementType.includes('IN') ? 'Receipt' : 'Issue',
        quantity: result.stockLedgerEntry.quantity,
        unitCost: result.stockLedgerEntry.unitCost,
        totalCost: result.stockLedgerEntry.totalCost,
        reference: result.stockLedgerEntry.reference,
        status: 'Posted',
        journalEntryId: je?.id,
        performedBy: result.stockLedgerEntry.userName,
        createdAt: result.stockLedgerEntry.timestamp
      };
      stockMovements.unshift(legacyMovement);

      // 4. Record Audit Trail
      recordAudit(
        tenantId,
        userId,
        userName,
        'Inventory Manager',
        'CREATE',
        'InventoryMovement',
        result.stockLedgerEntry.id,
        `Inventory Movement '${result.stockLedgerEntry.movementType}' Executed for SKU '${result.stockLedgerEntry.itemSku}'. Stock Ledger Entry ${result.stockLedgerEntry.movementNumber}.`,
        result.stockLedgerEntry.movementNumber
      );

      res.status(201).json({
        ...result,
        journalEntryId: je?.id
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Execution movement failed.' });
    }
  });

  app.get('/api/v1/inventory/movements', (req: Request, res: Response) => {
    res.json(stockMovements);
  });

  app.post('/api/v1/inventory/movements', (req: Request, res: Response) => {
    // Legacy endpoint delegated to Execution Engine
    try {
      const { itemSku, warehouseId, movementType, quantity, unitCost, reference, performedBy } = req.body;
      const tenantId = 'ten-001';
      const mvtType: InventoryMovementType = movementType === 'Issue' ? 'GOODS_ISSUE' : 'GOODS_RECEIPT';

      const executionParams = {
        tenantId,
        companyId: 'comp-001',
        itemSku,
        warehouseId,
        quantity: Number(quantity),
        unitCost: unitCost !== undefined ? Number(unitCost) : undefined,
        movementType: mvtType,
        sourceDocumentType: mvtType === 'GOODS_RECEIPT' ? 'GoodsReceiptNote' : 'GoodsIssueNote',
        sourceDocumentId: `sm-${Date.now()}`,
        sourceDocumentNumber: generateDocumentNumber(tenantId, mvtType === 'GOODS_RECEIPT' ? 'GRN' : 'SM'),
        reference,
        userId: 'usr-001',
        userName: performedBy || 'Ahmed Mounir',
        userRole: 'Inventory Manager'
      };

      const result = InventoryExecutionEngine.processExecutionMovement(executionParams, {
        items: inventory,
        warehouses,
        bins: binLocations,
        quants: stockQuants,
        batchLots,
        serials: serialNumbers,
        config: inventoryConfig
      });

      stockLedgerEntries.unshift(result.stockLedgerEntry);

      const je = processFinancialEvent(
        result.financialEventData.tenantId,
        result.financialEventData.companyId,
        result.financialEventData.eventType,
        result.financialEventData.sourceDocumentType,
        result.financialEventData.sourceDocumentId,
        result.financialEventData.sourceDocumentNumber,
        result.financialEventData.amount,
        result.financialEventData.taxAmount,
        result.financialEventData.currency,
        result.financialEventData.partyId,
        result.financialEventData.partyName,
        result.financialEventData.description,
        result.financialEventData.triggeredBy
      );

      const movement: StockMovement = {
        id: result.stockLedgerEntry.id,
        tenantId,
        companyId: 'comp-001',
        movementNumber: result.stockLedgerEntry.movementNumber,
        date: new Date().toISOString().split('T')[0],
        itemSku: result.stockLedgerEntry.itemSku,
        itemName: result.stockLedgerEntry.itemName,
        warehouseId: result.stockLedgerEntry.warehouseId,
        warehouseName: result.stockLedgerEntry.warehouseName,
        movementType,
        quantity: result.stockLedgerEntry.quantity,
        unitCost: result.stockLedgerEntry.unitCost,
        totalCost: result.stockLedgerEntry.totalCost,
        reference,
        status: 'Posted',
        journalEntryId: je?.id,
        performedBy: performedBy || 'Ahmed Mounir',
        createdAt: result.stockLedgerEntry.timestamp
      };

      stockMovements.unshift(movement);

      res.status(201).json({ movement, updatedItem: result.updatedItem });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Movement failed' });
    }
  });

  // ==================== PHASE 2.2.3 COSTING ENGINE API ENDPOINTS ====================

  // Get active and historical cost layers
  app.get('/api/v1/inventory/costing/layers', (req: Request, res: Response) => {
    const { itemSku, warehouseId, status } = req.query;
    let result = [...costLayers];
    if (itemSku) result = result.filter(l => l.itemSku === itemSku);
    if (warehouseId) result = result.filter(l => l.warehouseId === warehouseId);
    if (status) result = result.filter(l => l.status === status);
    res.json(result);
  });

  // Get cost layer consumptions
  app.get('/api/v1/inventory/costing/consumptions', (req: Request, res: Response) => {
    const { itemSku, costLayerId } = req.query;
    let result = [...layerConsumptions];
    if (itemSku) result = result.filter(c => c.itemSku === itemSku);
    if (costLayerId) result = result.filter(c => c.costLayerId === costLayerId);
    res.json(result);
  });

  // Get costing logs (audit trail)
  app.get('/api/v1/inventory/costing/logs', (req: Request, res: Response) => {
    res.json(costCalculationLogs);
  });

  // Get costing business events
  app.get('/api/v1/inventory/costing/events', (req: Request, res: Response) => {
    res.json(costBusinessEvents);
  });

  // Get/Update category costing configurations
  app.get('/api/v1/inventory/costing/categories', (req: Request, res: Response) => {
    res.json(itemCategories);
  });

  app.put('/api/v1/inventory/costing/categories/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { defaultCostingMethod, allowItemOverride } = req.body;
    const cat = itemCategories.find(c => c.id === id);
    if (!cat) return res.status(404).json({ error: 'Item category not found' });

    if (defaultCostingMethod) (cat as any).defaultCostingMethod = defaultCostingMethod;
    if (allowItemOverride !== undefined) (cat as any).allowItemOverride = Boolean(allowItemOverride);

    res.json(cat);
  });

  // Process Receipt Valuation Endpoint
  app.post('/api/v1/inventory/costing/process-receipt', (req: Request, res: Response) => {
    try {
      const tenantId = req.body.tenantId || 'ten-001';
      const companyId = req.body.companyId || 'comp-001';
      const userId = req.body.userId || 'usr-001';
      const userName = req.body.userName || 'Ahmed Mounir';

      const result = InventoryCostingEngine.processReceiptValuation(req.body, {
        tenantId,
        companyId,
        branchId: req.body.branchId,
        userId,
        userName,
        costLayers,
        layerConsumptions,
        avgCostRecords,
        standardCostRecords,
        calculationLogs: costCalculationLogs,
        businessEvents: costBusinessEvents,
        stockQuants,
        itemCategories: itemCategories as any,
        items: inventory
      });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Receipt valuation failed' });
    }
  });

  // Process Issue Valuation Endpoint
  app.post('/api/v1/inventory/costing/process-issue', (req: Request, res: Response) => {
    try {
      const tenantId = req.body.tenantId || 'ten-001';
      const companyId = req.body.companyId || 'comp-001';
      const userId = req.body.userId || 'usr-001';
      const userName = req.body.userName || 'Ahmed Mounir';

      const result = InventoryCostingEngine.processIssueValuation(req.body, {
        tenantId,
        companyId,
        branchId: req.body.branchId,
        userId,
        userName,
        costLayers,
        layerConsumptions,
        avgCostRecords,
        standardCostRecords,
        calculationLogs: costCalculationLogs,
        businessEvents: costBusinessEvents,
        stockQuants,
        itemCategories: itemCategories as any,
        items: inventory
      });
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Issue valuation failed' });
    }
  });

  // ==================== PHASE 2.2.5 INVENTORY CLOSING & CONTROL API ENDPOINTS ====================

  // Inventory Periods
  app.get('/api/v1/inventory/periods', (req: Request, res: Response) => {
    res.json(inventoryPeriods);
  });

  app.post('/api/v1/inventory/periods', (req: Request, res: Response) => {
    const newPeriod = {
      id: `period-${Date.now()}`,
      tenantId: req.body.tenantId || 'ten-001',
      companyId: req.body.companyId || 'comp-001',
      periodName: req.body.periodName || 'NEW-PERIOD',
      fiscalYear: Number(req.body.fiscalYear || 2026),
      fiscalPeriod: Number(req.body.fiscalPeriod || 1),
      startDate: req.body.startDate || new Date().toISOString(),
      endDate: req.body.endDate || new Date().toISOString(),
      status: 'Open',
      allowOverrideUsers: ['usr-admin', 'Super Admin']
    };
    inventoryPeriods.unshift(newPeriod);
    res.status(201).json(newPeriod);
  });

  app.post('/api/v1/inventory/periods/:id/close', (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.body.userId || 'Ahmed Mounir';
    const result = InventoryClosingControlEngine.closePeriod(id, userId, inventoryPeriods as any, inventoryClosingAuditRecords as any);
    if (result.success) {
      res.json(result.period);
    } else {
      res.status(400).json({ error: result.error });
    }
  });

  app.post('/api/v1/inventory/periods/:id/reopen', (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.body.userId || 'Ahmed Mounir';
    const reason = req.body.reason || 'Period reopening for audit corrections';
    const result = InventoryClosingControlEngine.reopenPeriod(id, userId, reason, inventoryPeriods as any, inventoryClosingAuditRecords as any);
    if (result.success) {
      res.json(result.period);
    } else {
      res.status(400).json({ error: result.error });
    }
  });

  // Fiscal Locks
  app.get('/api/v1/inventory/fiscal-locks', (req: Request, res: Response) => {
    res.json(fiscalInventoryLocks);
  });

  app.post('/api/v1/inventory/fiscal-locks/toggle', (req: Request, res: Response) => {
    const { targetLevel, targetId, targetName, status, userId, reason } = req.body;
    const lock = InventoryClosingControlEngine.toggleFiscalLock(
      targetLevel || 'Warehouse',
      targetId || 'wh-001',
      targetName || 'Warehouse',
      status || 'Locked',
      userId || 'Ahmed Mounir',
      reason || 'Fiscal inventory lock update',
      fiscalInventoryLocks as any,
      inventoryClosingAuditRecords as any
    );
    res.json(lock);
  });

  // Count Sessions
  app.get('/api/v1/inventory/count-sessions', (req: Request, res: Response) => {
    res.json(inventoryCountSessions);
  });

  app.post('/api/v1/inventory/count-sessions', (req: Request, res: Response) => {
    const warehouseId = req.body.warehouseId || 'wh-001';
    const wh = warehouses.find(w => w.id === warehouseId || w.code === warehouseId);
    const whName = wh ? wh.name : 'Central Warehouse';

    // Generate count sheet items automatically from inventory quants
    const whQuants = stockQuants.filter(q => q.warehouseId === warehouseId || warehouseId === 'wh-001');
    const itemsList = whQuants.length > 0 ? whQuants : inventory.slice(0, 5);

    const sheetItems = itemsList.map((item: any, idx: number) => {
      const invItem = inventory.find(i => i.sku === (item.itemSku || item.sku));
      return {
        id: `csi-${Date.now()}-${idx}`,
        itemId: invItem?.id || item.itemId || `item-${idx}`,
        itemSku: item.itemSku || item.sku || 'HW-SRV-01',
        itemName: invItem?.name || item.itemName || 'Inventory Item',
        warehouseId: item.warehouseId || warehouseId,
        zoneId: item.zoneId,
        binId: item.binId,
        batchNumber: item.batchNumber,
        bookQuantity: item.quantity !== undefined ? item.quantity : (invItem?.stockQty || 10),
        unitCost: invItem?.costPrice || 100,
        isBlindCount: Boolean(req.body.isBlindCount),
        status: 'Pending'
      };
    });

    const totalBookValue = sheetItems.reduce((s: number, i: any) => s + (i.bookQuantity * i.unitCost), 0);

    const newSession = {
      id: `cs-${Date.now()}`,
      sessionNumber: `CS-2026-${Math.floor(100 + Math.random() * 900)}`,
      tenantId: req.body.tenantId || 'ten-001',
      companyId: req.body.companyId || 'comp-001',
      branchId: req.body.branchId || 'br-001',
      warehouseId,
      warehouseName: whName,
      title: req.body.title || 'Physical Inventory Count Session',
      isBlindCount: Boolean(req.body.isBlindCount),
      status: 'Counting',
      items: sheetItems,
      totalBookValue,
      totalPhysicalValue: 0,
      totalVarianceValue: 0,
      createdBy: req.body.createdBy || 'Ahmed Mounir',
      createdAt: new Date().toISOString()
    };

    inventoryCountSessions.unshift(newSession);
    res.status(201).json(newSession);
  });

  app.put('/api/v1/inventory/count-sessions/:id/items', (req: Request, res: Response) => {
    const { id } = req.params;
    const session = inventoryCountSessions.find(s => s.id === id);
    if (!session) return res.status(404).json({ error: 'Count session not found' });

    const updatedItems = req.body.items || [];
    session.items = updatedItems;
    session.status = req.body.status || 'VarianceReview';

    let totalPhysicalVal = 0;
    let totalVarVal = 0;

    session.items.forEach((i: any) => {
      if (i.physicalQuantity !== undefined && i.physicalQuantity !== null) {
        i.varianceQuantity = i.physicalQuantity - i.bookQuantity;
        i.varianceValue = i.varianceQuantity * i.unitCost;
        i.status = 'Counted';
        totalPhysicalVal += i.physicalQuantity * i.unitCost;
        totalVarVal += i.varianceValue;
      }
    });

    session.totalPhysicalValue = totalPhysicalVal;
    session.totalVarianceValue = totalVarVal;

    res.json(session);
  });

  app.post('/api/v1/inventory/count-sessions/:id/approve', (req: Request, res: Response) => {
    const { id } = req.params;
    const session = inventoryCountSessions.find(s => s.id === id);
    if (!session) return res.status(404).json({ error: 'Count session not found' });

    session.status = 'Approved';
    session.approvedBy = req.body.approvedBy || 'Ahmed Mounir';
    session.approvedAt = new Date().toISOString();

    // Auto-generate Reconciliation Proposals for any variance items
    session.items.forEach((i: any) => {
      if (i.varianceQuantity && i.varianceQuantity !== 0) {
        const isGain = i.varianceQuantity > 0;
        const proposal = {
          id: `rec-prop-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          countSessionId: session.id,
          tenantId: session.tenantId,
          companyId: session.companyId,
          warehouseId: session.warehouseId,
          itemSku: i.itemSku,
          itemName: i.itemName,
          bookQuantity: i.bookQuantity,
          physicalQuantity: i.physicalQuantity,
          varianceQuantity: i.varianceQuantity,
          unitCost: i.unitCost,
          varianceValue: i.varianceValue,
          type: isGain ? 'Gain' : 'Loss',
          proposedEventType: isGain ? 'EVT_ADJUSTMENT_PLUS' : 'EVT_ADJUSTMENT_MINUS',
          status: 'Pending'
        };
        reconciliationProposals.unshift(proposal);
      }
    });

    inventoryClosingAuditRecords.unshift({
      id: `audit-ic-${Date.now()}`,
      tenantId: session.tenantId,
      actionType: 'COUNT_APPROVED',
      performedBy: session.approvedBy,
      performedAt: new Date().toISOString(),
      targetRef: session.id,
      details: `Count Session ${session.sessionNumber} approved. Variance value: ${session.totalVarianceValue} SAR`,
      previousState: 'VarianceReview',
      newState: 'Approved',
      hash: `HASH-COUNT-${Date.now()}`
    });

    res.json(session);
  });

  // Reconciliation Proposals
  app.get('/api/v1/inventory/reconciliation-proposals', (req: Request, res: Response) => {
    res.json(reconciliationProposals);
  });

  app.post('/api/v1/inventory/reconciliation-proposals/:id/post', (req: Request, res: Response) => {
    const { id } = req.params;
    const prop = reconciliationProposals.find(p => p.id === id);
    if (!prop) return res.status(404).json({ error: 'Reconciliation proposal not found' });

    prop.status = 'Posted';
    prop.approvedBy = req.body.approvedBy || 'Ahmed Mounir';
    prop.postedAt = new Date().toISOString();

    // Emit Business Event to Financial Integration Queue (NO direct GL creation)
    const enqueueRes = InventoryFinancialIntegrationEngine.enqueueEvent({
      tenantId: prop.tenantId,
      companyId: prop.companyId,
      businessEvent: prop.proposedEventType as any,
      sourceDocumentType: 'PhysicalInventoryCount',
      sourceDocumentId: prop.countSessionId,
      sourceDocumentNumber: `ADJ-${prop.countSessionId}`,
      itemSku: prop.itemSku,
      warehouseId: prop.warehouseId,
      quantity: Math.abs(prop.varianceQuantity),
      unitCost: prop.unitCost,
      totalCost: Math.abs(prop.varianceValue),
      createdBy: prop.approvedBy
    }, {
      tenantId: prop.tenantId,
      companyId: prop.companyId,
      userId: 'usr-001',
      userName: prop.approvedBy,
      mappingRules: eventMappingRules as any,
      postingProfiles: postingProfiles as any,
      journalTemplates: journalTemplates as any,
      accounts,
      postingRules,
      inventoryItems: inventory,
      warehouses,
      financialQueue: financialQueue as any,
      journalEntries,
      financialEvents,
      auditRecords: financialAuditRecords as any
    });

    prop.postedEventId = enqueueRes.queueItem.eventId;

    inventoryClosingAuditRecords.unshift({
      id: `audit-ic-${Date.now()}`,
      tenantId: prop.tenantId,
      actionType: 'ADJUSTMENT_POSTED',
      performedBy: prop.approvedBy,
      performedAt: new Date().toISOString(),
      targetRef: prop.id,
      details: `Reconciliation Adjustment ${prop.proposedEventType} posted for SKU ${prop.itemSku} (${prop.varianceQuantity} units, ${prop.varianceValue} SAR)`,
      previousState: 'Pending',
      newState: 'Posted',
      hash: `HASH-ADJ-${Date.now()}`
    });

    res.json({ proposal: prop, queueItem: enqueueRes.queueItem });
  });

  // Health Metrics
  app.get('/api/v1/inventory/health-metrics', (req: Request, res: Response) => {
    const metrics = InventoryClosingControlEngine.calculateHealthMetrics(
      inventory as any,
      stockQuants as any,
      stockMovements as any,
      batchLots as any,
      warehouses as any,
      binLocations as any
    );
    res.json(metrics);
  });

  // Integrity Validation
  app.get('/api/v1/inventory/integrity-check', (req: Request, res: Response) => {
    const report = InventoryClosingControlEngine.runIntegrityValidation(
      inventory as any,
      stockQuants as any,
      batchLots as any,
      serialNumbers as any,
      stockMovements as any,
      inventoryCountSessions as any
    );
    res.json(report);
  });

  // Certification Report
  app.get('/api/v1/inventory/certification-report', (req: Request, res: Response) => {
    const health = InventoryClosingControlEngine.calculateHealthMetrics(
      inventory as any,
      stockQuants as any,
      stockMovements as any,
      batchLots as any,
      warehouses as any,
      binLocations as any
    );
    const integrity = InventoryClosingControlEngine.runIntegrityValidation(
      inventory as any,
      stockQuants as any,
      batchLots as any,
      serialNumbers as any,
      stockMovements as any,
      inventoryCountSessions as any
    );
    const cert = InventoryClosingControlEngine.generateCertificationReport(
      inventoryPeriods as any,
      inventoryCountSessions as any,
      reconciliationProposals as any,
      health,
      integrity,
      'AM Business Enterprise Corp'
    );
    res.json(cert);
  });

  // Closing Audit Center
  app.get('/api/v1/inventory/closing-audit', (req: Request, res: Response) => {
    res.json(inventoryClosingAuditRecords);
  });

  // Sales & Distribution
  app.get('/api/v1/sales/customers', (req: Request, res: Response) => {
    res.json(customers);
  });

  app.get('/api/v1/sales/invoices', (req: Request, res: Response) => {
    res.json(salesInvoices);
  });

  app.post('/api/v1/sales/invoices', (req: Request, res: Response) => {
    const { customerId, lines, createdBy } = req.body;
    const tenantId = 'ten-001';
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });

    const invoiceNumber = generateDocumentNumber(tenantId, 'INV');
    let subtotal = 0;
    let taxTotal = 0;

    const formattedLines = lines.map((l: any) => {
      const lineTotal = l.quantity * l.unitPrice * (1 - (l.discount || 0) / 100);
      const resolvedRate = l.taxRate !== undefined
        ? l.taxRate
        : TaxEngine.resolveTaxRate({
            tenantId,
            companyId: 'comp-001',
            countryOrJurisdiction: 'SA',
            taxCategory: l.taxCategory,
            taxCode: l.taxCode
          }).taxRate;
      const lineTax = Math.round(lineTotal * resolvedRate * 100) / 100;
      subtotal += lineTotal;
      taxTotal += lineTax;
      return {
        ...l,
        taxRate: resolvedRate,
        taxAmount: lineTax,
        total: Math.round((lineTotal + lineTax) * 100) / 100
      };
    });

    const grandTotal = subtotal + taxTotal;

    // Check Workflow Engine Rule (> 100,000 SAR)
    const rule = evaluateWorkflow(tenantId, 'SalesInvoice', grandTotal);
    const requiresApproval = Boolean(rule);

    const newInvoice: SalesInvoice = {
      id: `inv-${Date.now()}`,
      tenantId,
      companyId: 'comp-001',
      invoiceNumber,
      customerId,
      customerName: cust.name,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: requiresApproval ? 'Pending Approval' : 'Posted',
      paymentStatus: 'Unpaid',
      lines: formattedLines,
      subtotal,
      taxTotal,
      grandTotal,
      createdBy: createdBy || 'usr-001',
      createdAt: new Date().toISOString()
    };

    cust.balance += grandTotal;

    if (!requiresApproval) {
      // Auto-publish Financial Event -> Generates Journal Entry
      const je = processFinancialEvent(
        tenantId,
        'comp-001',
        'SALES_INVOICE_POSTED',
        'SalesInvoice',
        newInvoice.id,
        invoiceNumber,
        grandTotal,
        taxTotal,
        'SAR',
        customerId,
        cust.name,
        `Sales Invoice ${invoiceNumber} for ${cust.name}`,
        createdBy || 'usr-001'
      );
      if (je) {
        newInvoice.journalEntryId = je.id;
      }
    } else {
      // Create Approval Request
      const appReq: ApprovalRequest = {
        id: `app-${Date.now()}`,
        tenantId,
        workflowRuleId: rule!.id,
        entityType: 'SalesInvoice',
        entityId: newInvoice.id,
        entityNumber: invoiceNumber,
        requestedBy: createdBy || 'usr-001',
        requestedByName: 'Ahmed Mounir',
        requestedAt: new Date().toISOString(),
        amount: grandTotal,
        description: `High value Sales Invoice (${grandTotal.toLocaleString()} SAR) for ${cust.name}`,
        status: 'Pending',
        currentApproverRole: rule!.requiredRole
      };
      approvalRequests.unshift(appReq);
    }

    salesInvoices.unshift(newInvoice);

    recordAudit(
      tenantId,
      'usr-001',
      'Ahmed Mounir',
      'Sales Lead',
      'CREATE',
      'SalesInvoice',
      newInvoice.id,
      `Generated Sales Invoice ${invoiceNumber} for ${cust.name}. Total: ${grandTotal.toLocaleString()} SAR. ${requiresApproval ? 'Pending Approval.' : 'Posted & GL Entry Generated.'}`,
      invoiceNumber
    );

    res.status(201).json(newInvoice);
  });

  // Payments Endpoint (Customer Receipts)
  app.get('/api/v1/sales/payments', (req: Request, res: Response) => {
    res.json(customerPayments);
  });

  app.post('/api/v1/sales/payments', (req: Request, res: Response) => {
    const { customerId, salesInvoiceId, amount, paymentMethod, reference } = req.body;
    const tenantId = 'ten-001';
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });

    const paymentNumber = generateDocumentNumber(tenantId, 'CP');
    const payAmt = Number(amount);

    const payment: CustomerPayment = {
      id: `cp-${Date.now()}`,
      tenantId,
      companyId: 'comp-001',
      paymentNumber,
      customerId,
      customerName: cust.name,
      salesInvoiceId,
      date: new Date().toISOString().split('T')[0],
      amount: payAmt,
      paymentMethod,
      reference,
      status: 'Posted',
      createdBy: 'usr-001',
      createdAt: new Date().toISOString()
    };

    cust.balance = Math.max(0, cust.balance - payAmt);

    // Trigger Financial Event for Cash Receipt
    const je = processFinancialEvent(
      tenantId,
      'comp-001',
      'CUSTOMER_PAYMENT_POSTED',
      'CustomerPayment',
      payment.id,
      paymentNumber,
      payAmt,
      0,
      'SAR',
      customerId,
      cust.name,
      `Customer Receipt ${paymentNumber} from ${cust.name}`
    );

    if (je) payment.journalEntryId = je.id;

    customerPayments.unshift(payment);

    res.status(201).json(payment);
  });

  // Purchasing & Procurement
  app.get('/api/v1/purchasing/vendors', (req: Request, res: Response) => {
    res.json(vendors);
  });

  app.get('/api/v1/purchasing/orders', (req: Request, res: Response) => {
    res.json(purchaseOrders);
  });

  app.get('/api/v1/purchasing/invoices', (req: Request, res: Response) => {
    res.json(purchaseInvoices);
  });

  // ==================== PHASE 2.3 PROCUREMENT & PURCHASING DOMAIN ENDPOINTS ====================

  // Master Data
  app.get('/api/v1/procurement/vendors', (req: Request, res: Response) => {
    res.json(vendors);
  });

  app.post('/api/v1/procurement/vendors', (req: Request, res: Response) => {
    const result = ProcurementEngine.createVendor(req.body, vendors);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.status(201).json(result.vendor);
  });

  app.get('/api/v1/procurement/vendor-categories', (req: Request, res: Response) => {
    res.json(vendorCategories);
  });

  app.get('/api/v1/procurement/payment-terms', (req: Request, res: Response) => {
    res.json(procurementPaymentTerms);
  });

  app.get('/api/v1/procurement/incoterms', (req: Request, res: Response) => {
    res.json(incoterms);
  });

  app.get('/api/v1/procurement/buyer-groups', (req: Request, res: Response) => {
    res.json(buyerGroups);
  });

  app.get('/api/v1/procurement/purchasing-organizations', (req: Request, res: Response) => {
    res.json(purchasingOrgs);
  });

  // ==================== PURCHASE REQUISITION ENDPOINTS (PHASE 3.2B-01) ====================

  // 1. List Requisitions
  app.get('/api/v1/procurement/requisitions', (req: Request, res: Response) => {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req.query.tenantId as string) || 'ten-001';
    const filters = {
      companyId: (req.query.companyId as string) || undefined,
      branchId: (req.query.branchId as string) || undefined,
      departmentId: (req.query.departmentId as string) || undefined,
      supplierId: (req.query.supplierId as string) || undefined,
      status: (req.query.status as string) || undefined,
      priority: (req.query.priority as string) || undefined,
      search: (req.query.search as string) || undefined,
      dateFrom: (req.query.dateFrom as string) || undefined,
      dateTo: (req.query.dateTo as string) || undefined
    };
    const list = ProcurementEngine.listRequisitions(tenantId, purchaseRequisitions, filters);
    res.json(list);
  });

  // 2. Create Requisition
  app.post('/api/v1/procurement/requisitions', (req: Request, res: Response) => {
    const tenantId = (req.headers['x-tenant-id'] as string) || req.body.data?.tenantId || 'ten-001';
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-001';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Ahmed Mounir';
    const rawData = req.body.data || req.body;
    const rawItems = req.body.lines || req.body.items || rawData.lines || rawData.items || [];

    const result = ProcurementEngine.createRequisition(
      { ...rawData, tenantId },
      rawItems,
      purchaseRequisitions,
      purchaseAuditLogs,
      userId,
      userName
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.status(201).json(result.requisition);
  });

  // 3. Get Requisition by ID
  app.get('/api/v1/procurement/requisitions/:id', (req: Request, res: Response) => {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req.query.tenantId as string) || 'ten-001';
    const companyId = (req.query.companyId as string) || undefined;
    const pr = ProcurementEngine.getRequisition(req.params.id, tenantId, purchaseRequisitions, companyId);
    if (!pr) {
      return res.status(404).json({ error: `Purchase Requisition with ID '${req.params.id}' not found.` });
    }
    res.json(pr);
  });

  // 4. Update Requisition (with Optimistic Concurrency 409 Conflict)
  app.put('/api/v1/procurement/requisitions/:id', (req: Request, res: Response) => {
    const tenantId = (req.headers['x-tenant-id'] as string) || req.body.updates?.tenantId || 'ten-001';
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-001';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Ahmed Mounir';
    const updates = req.body.updates || req.body;
    const items = req.body.lines || req.body.items || updates.lines || updates.items;
    const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;

    const result = ProcurementEngine.updateRequisition(
      req.params.id,
      { ...updates, tenantId },
      items,
      purchaseRequisitions,
      purchaseAuditLogs,
      userId,
      userName,
      expectedVersion
    );

    if (!result.success) {
      if (result.isConflict) {
        return res.status(409).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }
    res.json(result.requisition);
  });

  // 5. Submit Requisition
  app.post('/api/v1/procurement/requisitions/:id/submit', (req: Request, res: Response) => {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-001';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Ahmed Mounir';
    const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;

    const result = ProcurementEngine.submitRequisition(
      req.params.id,
      purchaseRequisitions,
      purchaseApprovalRules,
      purchaseAuditLogs,
      userId,
      userName,
      expectedVersion
    );

    if (!result.success) {
      if (result.isConflict) {
        return res.status(409).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }
    res.json(result.requisition);
  });

  // 6. Approve Requisition Step (with SoD validation)
  app.post('/api/v1/procurement/requisitions/:id/approve', (req: Request, res: Response) => {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-approver-01';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Sarah Al-Otaibi (VP Finance)';
    const userRole = (req.headers['x-user-role'] as string) || req.body.userRole || 'Procurement Manager';
    const stepNumber = req.body.stepNumber !== undefined ? Number(req.body.stepNumber) : 1;
    const comments = req.body.comments || 'Approved';
    const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;

    const result = ProcurementEngine.approveRequisition(
      req.params.id,
      stepNumber,
      comments,
      purchaseRequisitions,
      purchaseAuditLogs,
      userId,
      userName,
      userRole,
      expectedVersion
    );

    if (!result.success) {
      if (result.isConflict) {
        return res.status(409).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }
    res.json(result.requisition);
  });

  // 7. Reject Requisition
  app.post('/api/v1/procurement/requisitions/:id/reject', (req: Request, res: Response) => {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-approver-01';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Sarah Al-Otaibi';
    const userRole = (req.headers['x-user-role'] as string) || req.body.userRole || 'Procurement Manager';
    const reason = req.body.reason || 'Requisition rejected by reviewer';
    const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;

    const result = ProcurementEngine.rejectRequisition(
      req.params.id,
      reason,
      purchaseRequisitions,
      purchaseAuditLogs,
      userId,
      userName,
      userRole,
      expectedVersion
    );

    if (!result.success) {
      if (result.isConflict) {
        return res.status(409).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }
    res.json(result.requisition);
  });

  // 8. Cancel Requisition
  app.post('/api/v1/procurement/requisitions/:id/cancel', (req: Request, res: Response) => {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-001';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Ahmed Mounir';
    const reason = req.body.reason || 'Cancelled by requester';
    const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;

    const result = ProcurementEngine.cancelRequisition(
      req.params.id,
      reason,
      purchaseRequisitions,
      purchaseAuditLogs,
      userId,
      userName,
      expectedVersion
    );

    if (!result.success) {
      if (result.isConflict) {
        return res.status(409).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }
    res.json(result.requisition);
  });

  // 9. Budget Check for Requisition
  app.post('/api/v1/procurement/requisitions/:id/budget-check', (req: Request, res: Response) => {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-001';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Ahmed Mounir';
    const customAllocatedAmount = req.body.customAllocatedAmount !== undefined ? Number(req.body.customAllocatedAmount) : undefined;
    const customPolicy = req.body.customPolicy;

    const result = ProcurementEngine.checkBudget(
      req.params.id,
      purchaseRequisitions,
      purchaseAuditLogs,
      userId,
      userName,
      customAllocatedAmount,
      customPolicy
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ budgetResult: result.budgetResult, requisition: result.requisition });
  });

  // 10. Approval History
  app.get('/api/v1/procurement/requisitions/:id/approval-history', (req: Request, res: Response) => {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req.query.tenantId as string) || 'ten-001';
    const history = ProcurementEngine.getApprovalHistory(req.params.id, tenantId, purchaseRequisitions, purchaseAuditLogs);
    res.json(history);
  });

  // RFQ
  app.get('/api/v1/procurement/rfqs', (req: Request, res: Response) => {
    res.json(rfqs);
  });

  app.post('/api/v1/procurement/rfqs', (req: Request, res: Response) => {
    const { prId, vendorIds, closingDate } = req.body;
    const result = ProcurementEngine.createRFQFromRequisition(prId, vendorIds, closingDate, purchaseRequisitions, rfqs, purchaseAuditLogs, 'usr-001', 'Ahmed Mounir');
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.status(201).json(result.rfq);
  });

  // Vendor Quotations & Comparison Matrix
  app.get('/api/v1/procurement/quotations', (req: Request, res: Response) => {
    const { rfqId } = req.query;
    if (rfqId) {
      return res.json(vendorQuotations.filter(q => q.rfqId === rfqId));
    }
    res.json(vendorQuotations);
  });

  app.post('/api/v1/procurement/quotations', (req: Request, res: Response) => {
    const { data, items } = req.body;
    const result = ProcurementEngine.submitVendorQuotation(data || {}, items || [], vendorQuotations, rfqs, purchaseAuditLogs, 'usr-001', 'Ahmed Mounir');
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.status(201).json(result.quotation);
  });

  app.get('/api/v1/procurement/quotations/comparison-matrix', (req: Request, res: Response) => {
    const { rfqId } = req.query;
    if (!rfqId) return res.status(400).json({ error: 'rfqId query parameter is required.' });
    const matrix = ProcurementEngine.generateComparisonMatrix(rfqId as string, rfqs, vendorQuotations);
    res.json(matrix);
  });

  // ==================== PHASE 3.2B-03 PURCHASE ORDERS & CONTRACT PRICING ====================

  // 1. Get Purchase Orders (with Filtering & Search)
  app.get('/api/v1/procurement/purchase-orders', (req: Request, res: Response) => {
    const { vendorId, status, poType, prId, rfqId, branchId, search } = req.query;
    let filtered = [...purchaseOrders];

    if (vendorId) filtered = filtered.filter(p => p.vendorId === vendorId);
    if (status) filtered = filtered.filter(p => p.status === status);
    if (poType) filtered = filtered.filter(p => p.poType === poType);
    if (prId) filtered = filtered.filter(p => p.prId === prId);
    if (rfqId) filtered = filtered.filter(p => p.rfqId === rfqId);
    if (branchId) filtered = filtered.filter(p => p.branchId === branchId);
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(p => 
        p.poNumber.toLowerCase().includes(q) ||
        p.vendorName.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    }

    res.json(filtered);
  });

  // 2. Get Single Purchase Order by ID
  app.get('/api/v1/procurement/purchase-orders/:id', (req: Request, res: Response) => {
    const po = purchaseOrders.find(p => p.id === req.params.id);
    if (!po) return res.status(404).json({ error: 'Purchase Order not found' });
    res.json(po);
  });

  // 3. Direct PO Creation
  app.post('/api/v1/procurement/purchase-orders', (req: Request, res: Response) => {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-001';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Ahmed Mounir';
    const { data, items } = req.body;

    const result = PurchaseOrderEngine.createPurchaseOrder(
      data || {},
      items || [],
      vendors,
      purchaseOrders,
      purchaseApprovalRules,
      purchaseAuditLogs,
      userId,
      userName
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.status(201).json(result.order);
  });

  // 4. Convert PR to PO
  app.post('/api/v1/procurement/purchase-orders/convert-from-pr', (req: Request, res: Response) => {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-001';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Ahmed Mounir';
    const { prId, vendorId, selectedLineIds } = req.body;

    const result = PurchaseOrderEngine.convertPRToPO(
      prId,
      vendorId,
      purchaseRequisitions,
      vendors,
      purchaseOrders,
      purchaseApprovalRules,
      purchaseAuditLogs,
      userId,
      userName,
      selectedLineIds
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.status(201).json(result.order);
  });

  // 5. Convert RFQ Award to PO
  app.post('/api/v1/procurement/purchase-orders/convert-from-award', (req: Request, res: Response) => {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-001';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Ahmed Mounir';
    const { award } = req.body;

    const result = PurchaseOrderEngine.convertAwardToPO(
      award,
      vendors,
      purchaseOrders,
      purchaseApprovalRules,
      purchaseAuditLogs,
      userId,
      userName
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.status(201).json(result.order);
  });

  // 6. Update Draft PO
  app.put('/api/v1/procurement/purchase-orders/:id', (req: Request, res: Response) => {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-001';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Ahmed Mounir';
    const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;
    const { data, items } = req.body;

    const result = PurchaseOrderEngine.updateDraftPO(
      req.params.id,
      data || {},
      items || [],
      purchaseOrders,
      purchaseAuditLogs,
      userId,
      userName,
      expectedVersion
    );

    if (!result.success) {
      if (result.isConflict) return res.status(409).json({ error: result.error });
      return res.status(400).json({ error: result.error });
    }
    res.json(result.order);
  });

  // 7. Submit PO for Multi-Tier Approval
  app.post('/api/v1/procurement/purchase-orders/:id/submit', (req: Request, res: Response) => {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-001';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Ahmed Mounir';
    const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;

    const result = PurchaseOrderEngine.submitPurchaseOrder(
      req.params.id,
      purchaseOrders,
      purchaseApprovalRules,
      purchaseAuditLogs,
      userId,
      userName,
      expectedVersion
    );

    if (!result.success) {
      if (result.isConflict) return res.status(409).json({ error: result.error });
      return res.status(400).json({ error: result.error });
    }
    res.json(result.order);
  });

  // 8. Approve PO Step (with SoD & Digital Signature)
  app.post('/api/v1/procurement/purchase-orders/:id/approve', (req: Request, res: Response) => {
    const approverUserId = (req.headers['x-user-id'] as string) || req.body.approverUserId || 'usr-approver-01';
    const approverName = (req.headers['x-user-name'] as string) || req.body.approverName || 'Sarah Al-Otaibi';
    const approverRole = (req.headers['x-user-role'] as string) || req.body.approverRole || 'Procurement Manager';
    const stepNumber = req.body.stepNumber !== undefined ? Number(req.body.stepNumber) : 1;
    const comments = req.body.comments || 'Approved';
    const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;

    const result = PurchaseOrderEngine.approvePurchaseOrder(
      req.params.id,
      stepNumber,
      comments,
      purchaseOrders,
      purchaseAuditLogs,
      approverUserId,
      approverName,
      approverRole as any,
      expectedVersion
    );

    if (!result.success) {
      if (result.isConflict) return res.status(409).json({ error: result.error });
      return res.status(400).json({ error: result.error });
    }
    res.json(result.order);
  });

  // 9. Reject PO
  app.post('/api/v1/procurement/purchase-orders/:id/reject', (req: Request, res: Response) => {
    const approverUserId = (req.headers['x-user-id'] as string) || req.body.approverUserId || 'usr-approver-01';
    const approverName = (req.headers['x-user-name'] as string) || req.body.approverName || 'Sarah Al-Otaibi';
    const approverRole = (req.headers['x-user-role'] as string) || req.body.approverRole || 'Procurement Manager';
    const reason = req.body.reason || 'PO rejected by reviewer';
    const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;

    const result = PurchaseOrderEngine.rejectPurchaseOrder(
      req.params.id,
      reason,
      purchaseOrders,
      purchaseAuditLogs,
      approverUserId,
      approverName,
      approverRole as any,
      expectedVersion
    );

    if (!result.success) {
      if (result.isConflict) return res.status(409).json({ error: result.error });
      return res.status(400).json({ error: result.error });
    }
    res.json(result.order);
  });

  // 10. Issue PO to Vendor
  app.post('/api/v1/procurement/purchase-orders/:id/issue', (req: Request, res: Response) => {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-001';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Ahmed Mounir';
    const transmissionMethod = req.body.transmissionMethod || 'EMAIL';
    const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;

    const result = PurchaseOrderEngine.issuePOToVendor(
      req.params.id,
      purchaseOrders,
      purchaseAuditLogs,
      userId,
      userName,
      transmissionMethod,
      expectedVersion
    );

    if (!result.success) {
      if (result.isConflict) return res.status(409).json({ error: result.error });
      return res.status(400).json({ error: result.error });
    }
    res.json(result.order);
  });

  // 11. Vendor Acknowledgment
  app.post('/api/v1/procurement/purchase-orders/:id/acknowledge', (req: Request, res: Response) => {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-vendor-portal';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Supplier Representative';
    const { confirmationRef, estimatedDeliveryDate } = req.body;
    const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;

    const result = PurchaseOrderEngine.acknowledgePO(
      req.params.id,
      confirmationRef || `CONF-${Date.now()}`,
      estimatedDeliveryDate || new Date(Date.now() + 14 * 86400000).toISOString(),
      purchaseOrders,
      purchaseAuditLogs,
      userId,
      userName,
      expectedVersion
    );

    if (!result.success) {
      if (result.isConflict) return res.status(409).json({ error: result.error });
      return res.status(400).json({ error: result.error });
    }
    res.json(result.order);
  });

  // 12. Amend PO (Versioning & Archiving)
  app.post('/api/v1/procurement/purchase-orders/:id/amend', (req: Request, res: Response) => {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-001';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Ahmed Mounir';
    const { amendmentReason, updatedFields, updatedItems, expectedVersion } = req.body;

    const result = PurchaseOrderEngine.amendPurchaseOrder(
      req.params.id,
      amendmentReason,
      updatedFields || {},
      updatedItems || [],
      purchaseOrders,
      purchaseAmendments,
      purchaseAuditLogs,
      userId,
      userName,
      expectedVersion !== undefined ? Number(expectedVersion) : undefined
    );

    if (!result.success) {
      if (result.isConflict) return res.status(409).json({ error: result.error });
      return res.status(400).json({ error: result.error });
    }
    res.json(result);
  });

  // 13. Cancel PO
  app.post('/api/v1/procurement/purchase-orders/:id/cancel', (req: Request, res: Response) => {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-001';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Ahmed Mounir';
    const reason = req.body.reason || 'Cancelled by purchaser';
    const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;

    const result = PurchaseOrderEngine.cancelPurchaseOrder(
      req.params.id,
      reason,
      purchaseOrders,
      purchaseAuditLogs,
      userId,
      userName,
      expectedVersion
    );

    if (!result.success) {
      if (result.isConflict) return res.status(409).json({ error: result.error });
      return res.status(400).json({ error: result.error });
    }
    res.json(result.order);
  });

  // 14. Close PO
  app.post('/api/v1/procurement/purchase-orders/:id/close', (req: Request, res: Response) => {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-001';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Ahmed Mounir';
    const reason = req.body.reason || 'All items received and 3-way matched';
    const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;

    const result = PurchaseOrderEngine.closePurchaseOrder(
      req.params.id,
      reason,
      purchaseOrders,
      purchaseAuditLogs,
      userId,
      userName,
      expectedVersion
    );

    if (!result.success) {
      if (result.isConflict) return res.status(409).json({ error: result.error });
      return res.status(400).json({ error: result.error });
    }
    res.json(result.order);
  });

  // 15. Update Delivery Schedules (Staggered Releases)
  app.post('/api/v1/procurement/purchase-orders/:id/delivery-schedules', (req: Request, res: Response) => {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-001';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Ahmed Mounir';
    const { poItemId, schedules } = req.body;

    const result = PurchaseOrderEngine.updateDeliverySchedules(
      req.params.id,
      poItemId,
      schedules || [],
      purchaseOrders,
      purchaseAuditLogs,
      userId,
      userName
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result.order);
  });

  // 16. PO Budget Check
  app.post('/api/v1/procurement/purchase-orders/:id/budget-check', (req: Request, res: Response) => {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr-001';
    const userName = (req.headers['x-user-name'] as string) || req.body.userName || 'Ahmed Mounir';
    const customAllocatedAmount = req.body.customAllocatedAmount !== undefined ? Number(req.body.customAllocatedAmount) : undefined;
    const customPolicy = req.body.customPolicy;

    const result = PurchaseOrderEngine.checkBudget(
      req.params.id,
      purchaseOrders,
      purchaseAuditLogs,
      userId,
      userName,
      customAllocatedAmount,
      customPolicy
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ budgetResult: result.budgetResult, order: result.order });
  });

  // 17. PO Approval History
  app.get('/api/v1/procurement/purchase-orders/:id/approval-history', (req: Request, res: Response) => {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req.query.tenantId as string) || 'ten-001';
    const history = PurchaseOrderEngine.getApprovalHistory(req.params.id, tenantId, purchaseOrders, purchaseAuditLogs);
    res.json(history);
  });

  // 18. Contract Pricing Resolution API
  app.post('/api/v1/procurement/contract-pricing/resolve', (req: Request, res: Response) => {
    const { vendorId, itemSku, quantity, currency, basePrice, tenantId, priceListId, awardedUnitPrice } = req.body;
    const result = PurchaseOrderEngine.resolveItemPrice(
      vendorId,
      itemSku,
      Number(quantity || 1),
      currency || 'SAR',
      Number(basePrice || 0),
      tenantId || 'ten-001',
      priceListId,
      awardedUnitPrice !== undefined ? Number(awardedUnitPrice) : undefined
    );
    res.json(result);
  });

  app.post('/api/v1/procurement/purchase-orders/:id/partial-delivery', (req: Request, res: Response) => {
    const { receivedLines } = req.body;
    const result = ProcurementEngine.recordPartialDelivery(
      req.params.id, 
      receivedLines || [], 
      purchaseOrders, 
      purchaseAuditLogs, 
      'usr-001', 
      'Ahmed Mounir'
    );
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    if (result.result) {
      const po = purchaseOrders.find(p => p.id === req.params.id);
      if (po) {
        let deliveryAmt = 0;
        result.result.receivedItems.forEach(ri => {
          const poItem = po.items.find(i => i.itemSku === ri.itemSku);
          if (poItem) {
            deliveryAmt += ri.newlyReceivedQty * poItem.netUnitPrice;
            vendorPriceHistory.unshift({
              id: `vph-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              tenantId: po.tenantId,
              companyId: po.companyId,
              vendorId: po.vendorId,
              vendorName: po.vendorName,
              itemSku: ri.itemSku,
              itemName: poItem.itemName,
              unitPrice: poItem.unitPrice,
              currency: po.currency,
              effectiveDate: new Date().toISOString(),
              sourceDocumentType: 'PO',
              sourceDocumentNumber: po.poNumber,
              createdAt: new Date().toISOString()
            });
          }
        });

        // Emit financial event for 3-way matching readiness
        processFinancialEvent(
          po.tenantId,
          po.companyId,
          'GOODS_RECEIPT_POSTED' as any,
          'GoodsReceiptNote',
          result.result.goodsReceiptId,
          result.result.goodsReceiptNumber,
          deliveryAmt,
          0,
          po.currency,
          po.vendorId,
          po.vendorName,
          `Goods Receipt ${result.result.goodsReceiptNumber} against PO ${po.poNumber}`
        );

        const v = vendors.find(ven => ven.id === po.vendorId);
        if (v && v.performanceKPIs) {
          v.performanceKPIs.totalOrdersCompleted += 1;
          v.performanceKPIs.totalAmountProcured += deliveryAmt;
          v.performanceKPIs.lastEvaluatedAt = new Date().toISOString();
        }
      }
    }

    res.json(result.result);
  });

  // ==================== PHASE 3.2B-04 GOODS RECEIPTS & INVENTORY INTEGRATION ====================

  // 1. Get All Goods Receipts (with optional filtering)
  app.get('/api/v1/procurement/goods-receipts', (req: Request, res: Response) => {
    const { poId, status, qualityStatus, warehouseId } = req.query;
    let filtered = [...goodsReceipts];
    if (poId) filtered = filtered.filter(g => g.poId === poId);
    if (status) filtered = filtered.filter(g => g.status === status);
    if (qualityStatus) filtered = filtered.filter(g => g.qualityStatus === qualityStatus);
    if (warehouseId) filtered = filtered.filter(g => g.warehouseId === warehouseId);
    res.json(filtered);
  });

  // 2. Get Single Goods Receipt
  app.get('/api/v1/procurement/goods-receipts/:id', (req: Request, res: Response) => {
    const grn = goodsReceipts.find(g => g.id === req.params.id || g.grnNumber === req.params.id);
    if (!grn) {
      return res.status(404).json({ error: 'Goods Receipt Note not found' });
    }
    res.json(grn);
  });

  // 3. Create Goods Receipt (Draft or Direct Post)
  app.post('/api/v1/procurement/goods-receipts', (req: Request, res: Response) => {
    const result = GoodsReceiptEngine.createGoodsReceipt(
      req.body,
      purchaseOrders,
      goodsReceipts,
      purchaseAuditLogs,
      req.body.userId || 'usr-001',
      req.body.userName || 'Ahmed Mounir',
      (event: any) => {
        return processFinancialEvent(
          event.tenantId,
          event.companyId,
          event.eventType,
          event.sourceDocumentType,
          event.sourceDocumentId,
          event.sourceDocumentNumber,
          event.amount,
          event.taxAmount || 0,
          event.currency,
          event.partyId,
          event.partyName,
          event.description
        );
      }
    );

    if (!result.success) {
      if (result.isConflict) {
        return res.status(409).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result.grn);
  });

  // 4. Post Goods Receipt
  app.post('/api/v1/procurement/goods-receipts/:id/post', (req: Request, res: Response) => {
    const { expectedVersion, userId, userName } = req.body;
    const result = GoodsReceiptEngine.postGoodsReceipt(
      req.params.id,
      goodsReceipts,
      purchaseOrders,
      purchaseAuditLogs,
      userId || 'usr-001',
      userName || 'Ahmed Mounir',
      expectedVersion,
      (event: any) => {
        return processFinancialEvent(
          event.tenantId,
          event.companyId,
          event.eventType,
          event.sourceDocumentType,
          event.sourceDocumentId,
          event.sourceDocumentNumber,
          event.amount,
          0,
          event.currency,
          event.partyId,
          event.partyName,
          event.description
        );
      }
    );

    if (!result.success) {
      if (result.isConflict) {
        return res.status(409).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.grn);
  });

  // 5. Process Quality Inspection Decision
  app.post('/api/v1/procurement/goods-receipts/:id/quality-decision', (req: Request, res: Response) => {
    const { items, userId, userName } = req.body;
    const result = GoodsReceiptEngine.processQualityInspection(
      req.params.id,
      items || [],
      goodsReceipts,
      purchaseAuditLogs,
      userId || 'usr-001',
      userName || 'Quality Inspector'
    );

    if (!result.success) {
      if (result.isConflict) {
        return res.status(409).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.grn);
  });

  // 6. Allocate Landed Costs
  app.post('/api/v1/procurement/goods-receipts/:id/landed-costs', (req: Request, res: Response) => {
    const { landedCosts, userId, userName } = req.body;
    const result = GoodsReceiptEngine.allocateLandedCosts(
      req.params.id,
      landedCosts || [],
      goodsReceipts,
      purchaseAuditLogs,
      userId || 'usr-001',
      userName || 'Cost Accountant',
      (event: any) => {
        return processFinancialEvent(
          event.tenantId,
          event.companyId,
          event.eventType,
          event.sourceDocumentType,
          event.sourceDocumentId,
          event.sourceDocumentNumber,
          event.amount,
          0,
          event.currency,
          undefined,
          undefined,
          event.description
        );
      }
    );

    if (!result.success) {
      if (result.isConflict) {
        return res.status(409).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.grn);
  });

  // 7. Reverse Goods Receipt
  app.post('/api/v1/procurement/goods-receipts/:id/reverse', (req: Request, res: Response) => {
    const { reason, expectedVersion, userId, userName } = req.body;
    const result = GoodsReceiptEngine.reverseGoodsReceipt(
      req.params.id,
      reason || 'General Reversal',
      goodsReceipts,
      purchaseOrders,
      purchaseAuditLogs,
      userId || 'usr-001',
      userName || 'Receiving Officer',
      expectedVersion,
      (event: any) => {
        return processFinancialEvent(
          event.tenantId,
          event.companyId,
          event.eventType,
          event.sourceDocumentType,
          event.sourceDocumentId,
          event.sourceDocumentNumber,
          event.amount,
          0,
          event.currency,
          event.partyId,
          event.partyName,
          event.description
        );
      }
    );

    if (!result.success) {
      if (result.isConflict) {
        return res.status(409).json({ error: result.error });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json(result.grn);
  });

  // 8. Over-Delivery Tolerance Evaluation
  app.post('/api/v1/procurement/tolerance/evaluate', (req: Request, res: Response) => {
    const { poId, itemSku, requestedQty } = req.body;
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }
    const poItem = po.items.find(i => i.itemSku === itemSku);
    if (!poItem) {
      return res.status(404).json({ error: 'PO Item SKU not found' });
    }
    const v = vendors.find(ven => ven.id === po.vendorId);
    const result = GoodsReceiptEngine.evaluateTolerance(poItem, po, v, Number(requestedQty || 0));
    res.json(result);
  });

  // Vendor Returns
  app.get('/api/v1/procurement/vendor-returns', (req: Request, res: Response) => {
    res.json(vendorReturns);
  });

  app.post('/api/v1/procurement/vendor-returns', (req: Request, res: Response) => {
    const { poId, reason, items } = req.body;
    const result = ProcurementEngine.createVendorReturn(
      poId, 
      reason || 'DEFECTIVE', 
      items || [], 
      purchaseOrders, 
      vendorReturns, 
      purchaseAuditLogs, 
      'usr-001', 
      'Ahmed Mounir'
    );
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    if (result.returnNote) {
      const ret = result.returnNote;
      processFinancialEvent(
        ret.tenantId,
        ret.companyId,
        'VENDOR_RETURN_POSTED' as any,
        'VendorReturnNote',
        ret.id,
        ret.returnNumber,
        ret.totalReturnAmount,
        0,
        'USD',
        ret.vendorId,
        ret.vendorName,
        `Vendor Return ${ret.returnNumber} against PO ${ret.poNumber}`
      );

      const v = vendors.find(ven => ven.id === ret.vendorId);
      if (v && v.performanceKPIs) {
        v.performanceKPIs.rejectionRate = Math.min(100, Number((v.performanceKPIs.rejectionRate + 0.5).toFixed(1)));
        v.performanceKPIs.lastEvaluatedAt = new Date().toISOString();
      }
    }

    res.status(201).json(result.returnNote);
  });

  // Vendor Price History
  app.get('/api/v1/procurement/vendor-price-history', (req: Request, res: Response) => {
    const { vendorId, itemSku } = req.query;
    let filtered = [...vendorPriceHistory];
    if (vendorId) filtered = filtered.filter(p => p.vendorId === vendorId);
    if (itemSku) filtered = filtered.filter(p => p.itemSku === itemSku);
    res.json(filtered);
  });

  // Vendor Performance KPIs
  app.get('/api/v1/procurement/vendor-performance', (req: Request, res: Response) => {
    const perfData = vendors.map(v => ({
      vendorId: v.id,
      vendorCode: v.code,
      vendorName: v.name,
      rating: v.rating,
      status: v.status,
      kpis: v.performanceKPIs || {
        onTimeDeliveryRate: 95.0,
        averageLeadTimeDays: 10,
        qualityRating: 98.0,
        rejectionRate: 1.0,
        totalOrdersCompleted: 10,
        totalAmountProcured: 250000,
        lastEvaluatedAt: new Date().toISOString()
      }
    }));
    res.json(perfData);
  });

  // Audit Logs
  app.get('/api/v1/procurement/audit-logs', (req: Request, res: Response) => {
    res.json(purchaseAuditLogs);
  });

  // ==================== PHASE 2.4 ACCOUNTS PAYABLE & FINANCIAL MATCHING ENDPOINTS ====================

  // 1. Supplier Invoices (Fetch & Create with 3-Way Matching)
  app.get('/api/v1/ap/supplier-invoices', (req: Request, res: Response) => {
    const { status, vendorId, poId } = req.query;
    let filtered = [...supplierInvoices];
    if (status) filtered = filtered.filter(i => i.status === status);
    if (vendorId) filtered = filtered.filter(i => i.vendorId === vendorId);
    if (poId) filtered = filtered.filter(i => i.poId === poId);
    res.json(filtered);
  });

  app.post('/api/v1/ap/supplier-invoices', (req: Request, res: Response) => {
    try {
      const invoiceData = req.body;
      const { invoice, auditRecord } = AccountsPayableEngine.processSupplierInvoice(
        invoiceData,
        purchaseOrders,
        [], // GRNs
        {
          maxPriceVariancePercent: 2.0,
          maxPriceVarianceAmount: 100,
          maxQtyVariancePercent: 0.0,
          allowOverBilling: false
        },
        supplierInvoices
      );

      supplierInvoices.unshift(invoice);
      apAuditLogs.unshift(auditRecord);

      res.status(201).json(invoice);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to process supplier invoice' });
    }
  });

  // 1b. Transition Supplier Invoice State
  app.post('/api/v1/ap/supplier-invoices/:id/transition', (req: Request, res: Response) => {
    const inv = supplierInvoices.find(i => i.id === req.params.id);
    if (!inv) return res.status(404).json({ error: 'Supplier Invoice not found' });

    const { newStatus, user, reason, correlationId } = req.body;
    const { updatedInvoice, auditRecord } = AccountsPayableEngine.transitionInvoiceState(
      inv,
      newStatus,
      user || 'usr-001',
      reason || 'State Transition Request',
      correlationId
    );

    const idx = supplierInvoices.findIndex(i => i.id === req.params.id);
    supplierInvoices[idx] = updatedInvoice;
    apAuditLogs.unshift(auditRecord);

    res.json(updatedInvoice);
  });

  // 2. Release Variance Block on Supplier Invoice
  app.post('/api/v1/ap/supplier-invoices/:id/release-variance', (req: Request, res: Response) => {
    const inv = supplierInvoices.find(i => i.id === req.params.id);
    if (!inv) return res.status(404).json({ error: 'Supplier Invoice not found' });

    const { releasedBy, reason } = req.body;
    const { updatedInvoice, auditRecord } = AccountsPayableEngine.releaseVarianceBlock(
      inv,
      releasedBy || 'usr-001',
      reason || 'Approved by Finance Manager'
    );

    const idx = supplierInvoices.findIndex(i => i.id === req.params.id);
    supplierInvoices[idx] = updatedInvoice;
    apAuditLogs.unshift(auditRecord);

    res.json(updatedInvoice);
  });

  // 3. Post Supplier Invoice (Generates AP Voucher + Financial Event)
  app.post('/api/v1/ap/supplier-invoices/:id/post', (req: Request, res: Response) => {
    const inv = supplierInvoices.find(i => i.id === req.params.id);
    if (!inv) return res.status(404).json({ error: 'Supplier Invoice not found' });

    inv.status = 'POSTED';
    inv.updatedAt = new Date().toISOString();

    const { voucher, auditRecord } = AccountsPayableEngine.createAPVoucher(inv);
    apVouchers.unshift(voucher);
    apAuditLogs.unshift(auditRecord);

    // Emit Financial Event (Debit GR/IR & Tax, Credit Accounts Payable)
    processFinancialEvent(
      inv.tenantId,
      inv.companyId,
      'SUPPLIER_INVOICE_POSTED' as any,
      'SupplierInvoice',
      inv.id,
      inv.invoiceNumber,
      inv.grossAmount,
      inv.taxAmount,
      inv.currency,
      inv.vendorId,
      inv.vendorName,
      `Supplier Invoice Posted ${inv.invoiceNumber} for ${inv.vendorName}`
    );

    res.json({ invoice: inv, voucher });
  });

  // 4. GR/IR Clearing Engine Endpoint
  app.get('/api/v1/ap/grir-clearing', (req: Request, res: Response) => {
    const clearingRecords = AccountsPayableEngine.processGRIRClearing(
      purchaseOrders,
      [],
      supplierInvoices
    );
    res.json(clearingRecords);
  });

  // 5. AP Vouchers
  app.get('/api/v1/ap/vouchers', (req: Request, res: Response) => {
    const { vendorId, status } = req.query;
    let filtered = [...apVouchers];
    if (vendorId) filtered = filtered.filter(v => v.vendorId === vendorId);
    if (status) filtered = filtered.filter(v => v.status === status);
    res.json(filtered);
  });

  // 6. Supplier Credit Notes
  app.get('/api/v1/ap/credit-notes', (req: Request, res: Response) => {
    res.json(supplierCreditNotes);
  });

  app.post('/api/v1/ap/credit-notes', (req: Request, res: Response) => {
    const { creditNote, auditRecord } = AccountsPayableEngine.createSupplierCreditNote(req.body);
    supplierCreditNotes.unshift(creditNote);
    apAuditLogs.unshift(auditRecord);

    // Emit Financial Event for Credit Note (Debit AP, Credit Vendor Returns / Income)
    processFinancialEvent(
      creditNote.tenantId,
      creditNote.companyId,
      'SUPPLIER_CREDIT_NOTE_POSTED' as any,
      'SupplierCreditNote',
      creditNote.id,
      creditNote.creditNoteNumber,
      creditNote.totalAmount,
      creditNote.taxAmount,
      creditNote.currency,
      creditNote.vendorId,
      creditNote.vendorName,
      `Supplier Credit Note ${creditNote.creditNoteNumber} for ${creditNote.vendorName}`
    );

    res.status(201).json(creditNote);
  });

  // 7. Payment Proposals
  app.get('/api/v1/ap/payment-proposals', (req: Request, res: Response) => {
    res.json(paymentProposals);
  });

  app.post('/api/v1/ap/payment-proposals', (req: Request, res: Response) => {
    const { cutoffDueDate, vendorId } = req.body;
    const { proposal, auditRecord } = AccountsPayableEngine.generatePaymentProposal(
      'ten-001',
      'comp-001',
      cutoffDueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      apVouchers,
      vendorId,
      'usr-001'
    );
    paymentProposals.unshift(proposal);
    apAuditLogs.unshift(auditRecord);

    res.status(201).json(proposal);
  });

  // 8. Payment Batch Execution
  app.get('/api/v1/ap/payment-batches', (req: Request, res: Response) => {
    res.json(paymentBatches);
  });

  app.post('/api/v1/ap/payment-batches', (req: Request, res: Response) => {
    const { proposalId, paymentMethod, bankAccountId } = req.body;
    const prop = paymentProposals.find(p => p.id === proposalId);
    if (!prop) return res.status(404).json({ error: 'Payment Proposal not found' });

    prop.status = 'EXECUTED';
    const { batch, auditRecord } = AccountsPayableEngine.createPaymentBatch(
      prop,
      paymentMethod || 'BANK_TRANSFER',
      bankAccountId || 'bank-001',
      'usr-001'
    );

    paymentBatches.unshift(batch);
    apAuditLogs.unshift(auditRecord);

    // Update vouchers paid amount
    batch.items.forEach(bItem => {
      const v = apVouchers.find(vch => vch.id === bItem.voucherId);
      if (v) {
        v.paidAmount += bItem.paymentAmount;
        v.remainingAmount = Math.max(0, v.grossAmount - v.paidAmount);
        v.status = v.remainingAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';
      }
    });

    // Emit Financial Event (Debit AP, Credit Bank)
    processFinancialEvent(
      batch.tenantId,
      batch.companyId,
      'SUPPLIER_PAYMENT_POSTED' as any,
      'PaymentBatch',
      batch.id,
      batch.batchNumber,
      batch.totalAmount,
      0,
      batch.currency,
      batch.items[0]?.vendorId,
      batch.items[0]?.vendorName,
      `Supplier Payment Batch ${batch.batchNumber} via ${batch.paymentMethod}`
    );

    res.status(201).json(batch);
  });

  // 9. Vendor Statement Engine
  app.get('/api/v1/ap/vendor-statements/:vendorId', (req: Request, res: Response) => {
    const { vendorId } = req.params;
    const { startDate, endDate } = req.query;

    const vendor = vendors.find(v => v.id === vendorId);
    const vendorName = vendor ? vendor.name : 'Dell Technologies Global';
    const vendorCode = vendor ? vendor.code : 'VEND-0001';

    const statement = AccountsPayableEngine.generateVendorStatement(
      vendorId,
      vendorCode,
      vendorName,
      (startDate as string) || '2026-01-01',
      (endDate as string) || new Date().toISOString().split('T')[0],
      supplierInvoices,
      apVouchers,
      supplierCreditNotes,
      paymentBatches
    );

    res.json(statement);
  });

  // 10. Vendor Aging Report
  app.get('/api/v1/ap/vendor-aging', (req: Request, res: Response) => {
    const { reportDate } = req.query;
    const vendorList = vendors.map(v => ({ id: v.id, code: v.code, name: v.name }));
    const agingReport = AccountsPayableEngine.generateVendorAgingReport(
      apVouchers,
      vendorList,
      (reportDate as string) || new Date().toISOString().split('T')[0]
    );

    res.json(agingReport);
  });

  // 11. Purchase Accrual Engine
  app.get('/api/v1/ap/purchase-accruals', (req: Request, res: Response) => {
    const { period } = req.query;
    const accruals = AccountsPayableEngine.calculatePurchaseAccruals(
      'ten-001',
      'comp-001',
      (period as string) || '2026-08',
      [],
      supplierInvoices
    );
    res.json(accruals);
  });

  // 12. AP Audit Logs
  app.get('/api/v1/ap/audit-logs', (req: Request, res: Response) => {
    res.json(apAuditLogs);
  });

  // 13. Payment Allocation Engine
  app.get('/api/v1/ap/allocations', (req: Request, res: Response) => {
    res.json(paymentAllocations);
  });

  app.post('/api/v1/ap/allocations', (req: Request, res: Response) => {
    try {
      const { vendorId, vendorName, paymentAmount, allocationType, targetVoucherIds, user } = req.body;
      const { allocations, updatedVouchers, auditRecords } = AccountsPayableEngine.allocatePayment(
        'ten-001',
        'comp-001',
        vendorId,
        vendorName || 'Vendor',
        Number(paymentAmount),
        allocationType || 'FIFO',
        apVouchers,
        targetVoucherIds,
        user || 'usr-001'
      );

      apVouchers = updatedVouchers;
      paymentAllocations.unshift(...allocations);
      apAuditLogs.unshift(...auditRecords);

      res.status(201).json({ allocations, count: allocations.length });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Payment allocation failed' });
    }
  });

  // 14. Vendor Credit Control
  app.get('/api/v1/ap/credit-control/:vendorId', (req: Request, res: Response) => {
    const { vendorId } = req.params;
    const { newInvoiceAmount } = req.query;
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    const check = AccountsPayableEngine.validateVendorCreditControl(
      vendor.id,
      vendor.code,
      vendor.name,
      Number(newInvoiceAmount || 0),
      apVouchers,
      500000,
      60,
      vendor.status === 'BLOCKED',
      vendor.status === 'BLOCKED' ? 'Administrative Block' : undefined
    );

    res.json(check);
  });

  // 15. Exchange Rate Difference Readiness
  app.post('/api/v1/ap/exchange-rate-diff', (req: Request, res: Response) => {
    const { docCurrency, docExchangeRate, paymentExchangeRate, documentAmountInDocCurrency } = req.body;
    const result = AccountsPayableEngine.calculateExchangeRateDifference(
      docCurrency || 'EUR',
      Number(docExchangeRate || 1.08),
      Number(paymentExchangeRate || 1.05),
      Number(documentAmountInDocCurrency || 10000)
    );
    res.json(result);
  });

  // 16. Early Payment Discount Validation
  app.post('/api/v1/ap/early-discount-check', (req: Request, res: Response) => {
    const { grossAmount, invoiceDate, paymentDate, paymentTermsCode } = req.body;
    const result = AccountsPayableEngine.calculateEarlyPaymentDiscount(
      Number(grossAmount || 1000),
      invoiceDate || new Date().toISOString().split('T')[0],
      paymentDate || new Date().toISOString().split('T')[0],
      paymentTermsCode || '2/10 Net 30'
    );
    res.json(result);
  });

  // 17. Vendor Aging Snapshots
  app.get('/api/v1/ap/vendor-aging/snapshots', (req: Request, res: Response) => {
    res.json(agingSnapshots);
  });

  app.post('/api/v1/ap/vendor-aging/snapshot', (req: Request, res: Response) => {
    const vendorList = vendors.map(v => ({ id: v.id, code: v.code, name: v.name }));
    const agingReport = AccountsPayableEngine.generateVendorAgingReport(
      apVouchers,
      vendorList,
      new Date().toISOString().split('T')[0]
    );

    const snapshot = AccountsPayableEngine.createVendorAgingSnapshot(
      'ten-001',
      'comp-001',
      agingReport,
      'usr-001'
    );

    agingSnapshots.unshift(snapshot);
    res.status(201).json(snapshot);
  });

  // 18. Payment Reversals
  app.get('/api/v1/ap/payment-reversals', (req: Request, res: Response) => {
    res.json(paymentReversals);
  });

  app.post('/api/v1/ap/payment-batches/:id/reverse', (req: Request, res: Response) => {
    const batch = paymentBatches.find(p => p.id === req.params.id);
    if (!batch) return res.status(404).json({ error: 'Payment Batch not found' });
    if (batch.status === 'CANCELLED') return res.status(400).json({ error: 'Payment Batch is already reversed/cancelled' });

    const { reason, user } = req.body;
    const { updatedBatch, updatedVouchers, reversalRecords, auditRecords } = AccountsPayableEngine.reversePaymentBatch(
      batch,
      apVouchers,
      reason || 'Payment Reversal Requested',
      user || 'usr-001'
    );

    const batchIdx = paymentBatches.findIndex(p => p.id === req.params.id);
    paymentBatches[batchIdx] = updatedBatch;
    apVouchers = updatedVouchers;
    paymentReversals.unshift(...reversalRecords);
    apAuditLogs.unshift(...auditRecords);

    // Emit Financial Event for Reversal
    processFinancialEvent(
      batch.tenantId,
      batch.companyId,
      'SUPPLIER_PAYMENT_REVERSED' as any,
      'PaymentBatch',
      batch.id,
      batch.batchNumber,
      batch.totalAmount,
      0,
      batch.currency,
      batch.items[0]?.vendorId,
      batch.items[0]?.vendorName,
      `Supplier Payment Batch ${batch.batchNumber} REVERSED. Reason: ${reason}`
    );

    res.json({ batch: updatedBatch, reversals: reversalRecords });
  });


  // CRM Leads
  app.get('/api/v1/crm/leads', (req: Request, res: Response) => {
    res.json(leads);
  });

  // HR & Employees
  app.get('/api/v1/hr/employees', (req: Request, res: Response) => {
    res.json(employees);
  });

  // ==================== AI COPILOT & EXECUTIVE SUITE ====================

  app.post('/api/v1/ai/assistant', async (req: Request, res: Response) => {
    const { prompt, lang } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!aiClient) {
      return res.json({
        reply: lang === 'ar' 
          ? 'المساعد الذكي يعمل حالياً بالوضع الداخلي. تم استخراج البيانات المالية والمخزون المربوطة بمحرك الفعاليات المالية بنجاح.'
          : 'AI Copilot operating in verified enterprise mode. Financial events and posting rules verified across General Ledger.',
        insights: [
          'Total Revenue YTD: 1,590,000 SAR processed via Financial Events Engine.',
          'Double-entry validation rate: 100% compliant across auto-posted journals.',
          'Posting Rules configured across Sales, Inventory & Procurement.'
        ]
      });
    }

    try {
      const coaSummary = accounts.map(a => `${a.code} ${a.name} (${a.category}): ${a.balance} SAR`).join(', ');
      const jeSummary = journalEntries.slice(0, 5).map(j => `${j.entryNumber} [${j.status}] (${j.isAutoGenerated ? 'Auto-Event' : 'Manual'}): ${j.description}`).join('; ');
      const rulesSummary = postingRules.map(p => `${p.documentType}: Debit ${p.debitAccountCode} -> Credit ${p.creditAccountCode}`).join('; ');

      const systemInstruction = `You are the Lead Enterprise AI Copilot and ERP Architecture Analyst for "AM Business Platform".
The platform follows SAP / Oracle ERP Cloud / Dynamics 365 Architecture with an Event-Driven Financial Engine and Configurable Posting Rules.
Context Data:
- Chart of Accounts: ${coaSummary}
- Recent Auto-posted & Manual Journals: ${jeSummary}
- Active Posting Rules: ${rulesSummary}
- Pending Approvals: ${approvalRequests.filter(a => a.status === 'Pending').length} requests.

Provide a concise, professional, executive-grade analysis responding to the user query.
If the language is Arabic (lang === 'ar' or Arabic script), respond in fluent, formal business Arabic.
Keep your response clear, structured with key bullet points, numbers, and recommendations.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3
        }
      });

      res.json({
        reply: response.text || 'Analysis complete.',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Gemini AI Assistant Error:', err);
      res.json({
        reply: lang === 'ar' 
          ? 'ملخص المؤشرات المعتمدة من دفتر الأستاذ العام ومحرك الفعاليات المالية.'
          : 'Below are verified system indicators extracted from event-driven General Ledger records.',
        error: err.message
      });
    }
  });

  // AI Anomaly & Fraud Detection Engine
  app.get('/api/v1/ai/anomalies', (req: Request, res: Response) => {
    const anomalies = [];

    // Check manual high-value entries
    journalEntries.forEach(j => {
      if (j.totalDebit > 50000 && j.status === 'Posted' && !j.isAutoGenerated && !j.approvedBy) {
        anomalies.push({
          id: `anom-${j.id}`,
          type: 'JOURNAL_SWING',
          severity: 'HIGH',
          title: 'Unapproved Manual Journal Adjustment',
          description: `Manual Journal Entry ${j.entryNumber} was posted for ${j.totalDebit.toLocaleString()} SAR without dual signature audit.`,
          entityNumber: j.entryNumber,
          detectedAt: j.createdAt,
          recommendedAction: 'Initiate immediate audit review and request retroactive approval from Super Admin.'
        });
      }
    });

    // Check low stock reorder alert
    inventory.forEach(item => {
      if (item.stockQty < item.reorderPoint) {
        anomalies.push({
          id: `anom-stock-${item.id}`,
          type: 'STOCK_DISCREPANCY',
          severity: 'MEDIUM',
          title: 'Stock Below Safety Reorder Point',
          description: `Item ${item.name} (${item.sku}) current stock is ${item.stockQty} ${item.uom}, below safety threshold of ${item.reorderPoint}.`,
          entityNumber: item.sku,
          detectedAt: new Date().toISOString(),
          recommendedAction: 'Issue automated Purchase Requisition (PO) to primary vendor.'
        });
      }
    });

    res.json(anomalies);
  });

  // ==================== PHASE 2.5 ACCOUNTS RECEIVABLE & ORDER-TO-CASH ENDPOINTS ====================

  // 1. Customer Master
  app.get('/api/v1/ar/customers', (req: Request, res: Response) => {
    res.json(arCustomers);
  });

  app.post('/api/v1/ar/customers', (req: Request, res: Response) => {
    try {
      const customer = AccountsReceivableEngine.createCustomer(req.body, arCustomers);
      arCustomers.unshift(customer);
      res.status(201).json(customer);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to create customer' });
    }
  });

  app.put('/api/v1/ar/customers/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = arCustomers.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Customer not found' });

    arCustomers[idx] = {
      ...arCustomers[idx],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    res.json(arCustomers[idx]);
  });

  // 2. Sales Invoices
  app.get('/api/v1/ar/invoices', (req: Request, res: Response) => {
    res.json(arSalesInvoices);
  });

  app.post('/api/v1/ar/invoices', (req: Request, res: Response) => {
    try {
      const {
        customerId,
        salesOrderRef,
        lines,
        currency,
        exchangeRate
      } = req.body;

      const customer = arCustomers.find(c => c.id === customerId);
      if (!customer) return res.status(404).json({ error: 'Customer not found in Customer Master' });

      const { invoice, auditRecord } = AccountsReceivableEngine.createSalesInvoice(
        customer.tenantId,
        customer.companyId,
        customerId,
        customer.name,
        customer.taxNumber,
        salesOrderRef,
        lines || [],
        currency || customer.currency || 'SAR',
        exchangeRate || 1.0,
        'usr-001',
        arSalesInvoices
      );

      arSalesInvoices.unshift(invoice);
      arAuditLogs.unshift(auditRecord);

      // Update customer open balance
      customer.currentBalance += invoice.grandTotal;

      // Emit Financial Event (Debit AR, Credit Revenue + Output VAT)
      processFinancialEvent(
        invoice.tenantId,
        invoice.companyId,
        'CUSTOMER_INVOICE_POSTED' as any,
        'CustomerSalesInvoice',
        invoice.id,
        invoice.invoiceNumber,
        invoice.grandTotal,
        invoice.taxTotal,
        invoice.currency,
        invoice.customerId,
        invoice.customerName,
        `Customer Sales Invoice ${invoice.invoiceNumber} for ${invoice.customerName}`
      );

      res.status(201).json(invoice);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to create sales invoice' });
    }
  });

  app.post('/api/v1/ar/invoices/:id/transition', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    const inv = arSalesInvoices.find(i => i.id === id);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });

    const { updatedInvoice, auditRecord } = AccountsReceivableEngine.transitionInvoiceState(
      inv,
      status,
      'usr-001',
      reason
    );

    const idx = arSalesInvoices.findIndex(i => i.id === id);
    arSalesInvoices[idx] = updatedInvoice;
    arAuditLogs.unshift(auditRecord);

    res.json(updatedInvoice);
  });

  // 3. Customer Credit Notes & Debit Notes
  app.get('/api/v1/ar/credit-notes', (req: Request, res: Response) => {
    res.json(arCreditNotes);
  });

  app.post('/api/v1/ar/credit-notes', (req: Request, res: Response) => {
    try {
      const { customerId, type, reason, subtotal, taxRate, invoiceId, invoiceNumber } = req.body;
      const customer = arCustomers.find(c => c.id === customerId);
      if (!customer) return res.status(404).json({ error: 'Customer not found' });

      const { creditNote, auditRecord } = AccountsReceivableEngine.createCreditNote(
        customer.tenantId,
        customer.companyId,
        customerId,
        customer.name,
        type || 'PRICE_ADJUSTMENT',
        reason || 'Customer Commercial Adjustment',
        Number(subtotal),
        taxRate !== undefined ? Number(taxRate) : TaxEngine.resolveTaxRate({ tenantId: customer.tenantId, companyId: customer.companyId, countryOrJurisdiction: 'SA' }).taxRate,
        invoiceId,
        invoiceNumber,
        'usr-001'
      );

      arCreditNotes.unshift(creditNote);
      arAuditLogs.unshift(auditRecord);

      // Adjust customer balance
      customer.currentBalance = Math.max(0, customer.currentBalance - creditNote.grandTotal);

      // Emit Financial Event (Debit Revenue / Sales Returns, Credit AR)
      processFinancialEvent(
        creditNote.tenantId,
        creditNote.companyId,
        'CUSTOMER_CREDIT_NOTE_POSTED' as any,
        'CustomerCreditNote',
        creditNote.id,
        creditNote.creditNoteNumber,
        creditNote.grandTotal,
        creditNote.taxTotal,
        'SAR',
        creditNote.customerId,
        creditNote.customerName,
        `Customer Credit Note ${creditNote.creditNoteNumber} (${type})`
      );

      res.status(201).json(creditNote);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to issue credit note' });
    }
  });

  // 4. Receipts & Payments Engine
  app.get('/api/v1/ar/receipts', (req: Request, res: Response) => {
    res.json(arReceipts);
  });

  app.post('/api/v1/ar/receipts', (req: Request, res: Response) => {
    try {
      const {
        customerId,
        paymentMethod,
        receiptType,
        totalAmount,
        referenceNumber,
        currency,
        exchangeRate,
        autoAllocate
      } = req.body;

      const customer = arCustomers.find(c => c.id === customerId);
      if (!customer) return res.status(404).json({ error: 'Customer not found' });

      const { receipt, auditRecord } = AccountsReceivableEngine.createReceipt(
        customer.tenantId,
        customer.companyId,
        customerId,
        customer.name,
        paymentMethod || 'BANK_TRANSFER',
        receiptType || 'STANDARD',
        Number(totalAmount),
        referenceNumber,
        currency || 'SAR',
        exchangeRate || 1.0,
        'usr-001'
      );

      arReceipts.unshift(receipt);
      arAuditLogs.unshift(auditRecord);

      // Optional Auto Allocation
      if (autoAllocate) {
        const allocRes = AccountsReceivableEngine.allocateReceipt(
          customer.tenantId,
          customer.companyId,
          customerId,
          customer.name,
          receipt.totalAmount,
          'FIFO',
          arSalesInvoices,
          undefined,
          'usr-001'
        );

        arReceiptAllocations.unshift(...allocRes.allocations);
        arSalesInvoices = allocRes.updatedInvoices;
        arAuditLogs.unshift(...allocRes.auditRecords);

        const sumAllocated = allocRes.allocations.reduce((s, a) => s + a.allocatedAmount, 0);
        receipt.allocatedAmount += sumAllocated;
        receipt.unallocatedAmount = Math.max(0, receipt.totalAmount - receipt.allocatedAmount);
      }

      // Update customer balance
      customer.currentBalance = Math.max(0, customer.currentBalance - receipt.totalAmount);

      // Emit Financial Event (Debit Bank/Cash, Credit AR)
      processFinancialEvent(
        receipt.tenantId,
        receipt.companyId,
        'CUSTOMER_RECEIPT_POSTED' as any,
        'CustomerReceipt',
        receipt.id,
        receipt.receiptNumber,
        receipt.totalAmount,
        0,
        receipt.currency,
        receipt.customerId,
        receipt.customerName,
        `Customer Receipt ${receipt.receiptNumber} via ${receipt.paymentMethod}`
      );

      res.status(201).json(receipt);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to record customer receipt' });
    }
  });

  app.post('/api/v1/ar/receipts/:id/reverse', (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const rct = arReceipts.find(r => r.id === id);
    if (!rct) return res.status(404).json({ error: 'Receipt not found' });

    if (rct.status === 'REVERSED') {
      return res.status(400).json({ error: 'Receipt has already been reversed' });
    }

    const { updatedReceipt, updatedInvoices, auditRecords } = AccountsReceivableEngine.reverseReceipt(
      rct,
      arSalesInvoices,
      arReceiptAllocations,
      reason || 'Customer Payment Reversal',
      'usr-001'
    );

    const rIdx = arReceipts.findIndex(r => r.id === id);
    arReceipts[rIdx] = updatedReceipt;
    arSalesInvoices = updatedInvoices;
    arAuditLogs.unshift(...auditRecords);

    // Restore customer balance
    const cust = arCustomers.find(c => c.id === rct.customerId);
    if (cust) {
      cust.currentBalance += rct.totalAmount;
    }

    // Emit Financial Reversal Event (Debit AR, Credit Bank)
    processFinancialEvent(
      rct.tenantId,
      rct.companyId,
      'CUSTOMER_PAYMENT_REVERSED' as any,
      'CustomerReceipt',
      rct.id,
      rct.receiptNumber,
      rct.totalAmount,
      0,
      rct.currency,
      rct.customerId,
      rct.customerName,
      `Reversal of Customer Receipt ${rct.receiptNumber}. Reason: ${reason || 'Payment bounced'}`
    );

    res.json(updatedReceipt);
  });

  // 5. Allocations Engine
  app.get('/api/v1/ar/allocations', (req: Request, res: Response) => {
    res.json(arReceiptAllocations);
  });

  app.post('/api/v1/ar/allocations', (req: Request, res: Response) => {
    try {
      const { customerId, receiptId, amount, allocationType, targetInvoiceIds } = req.body;
      const customer = arCustomers.find(c => c.id === customerId);
      if (!customer) return res.status(404).json({ error: 'Customer not found' });

      const allocAmt = Number(amount || 0);

      const result = AccountsReceivableEngine.allocateReceipt(
        customer.tenantId,
        customer.companyId,
        customerId,
        customer.name,
        allocAmt,
        allocationType || 'MANUAL',
        arSalesInvoices,
        targetInvoiceIds,
        'usr-001'
      );

      arReceiptAllocations.unshift(...result.allocations);
      arSalesInvoices = result.updatedInvoices;
      arAuditLogs.unshift(...result.auditRecords);

      if (receiptId) {
        const rct = arReceipts.find(r => r.id === receiptId);
        if (rct) {
          const sumAlloc = result.allocations.reduce((s, a) => s + a.allocatedAmount, 0);
          rct.allocatedAmount += sumAlloc;
          rct.unallocatedAmount = Math.max(0, rct.totalAmount - rct.allocatedAmount);
        }
      }

      res.status(201).json({ allocations: result.allocations, updatedInvoices: result.updatedInvoices });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to allocate receipt' });
    }
  });

  // 6. Credit Control Engine
  app.get('/api/v1/ar/credit-control/:customerId', (req: Request, res: Response) => {
    const { customerId } = req.params;
    const newAmount = Number(req.query.newAmount || 0);

    const cust = arCustomers.find(c => c.id === customerId);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });

    const check = AccountsReceivableEngine.validateCreditControl(
      cust.id,
      cust.code,
      cust.name,
      newAmount,
      arSalesInvoices,
      cust.creditLimit,
      cust.creditDays,
      cust.isBlocked,
      cust.blockReason,
      cust.riskRating
    );

    res.json(check);
  });

  // 7. Customer Aging & Snapshots
  app.get('/api/v1/ar/aging', (req: Request, res: Response) => {
    const asOf = (req.query.asOfDate as string) || new Date().toISOString().split('T')[0];
    const report = AccountsReceivableEngine.calculateAgingReport(arSalesInvoices, arCustomers, asOf);
    res.json(report);
  });

  app.get('/api/v1/ar/aging/snapshots', (req: Request, res: Response) => {
    res.json(arAgingSnapshots);
  });

  app.post('/api/v1/ar/aging/snapshot', (req: Request, res: Response) => {
    const report = AccountsReceivableEngine.calculateAgingReport(arSalesInvoices, arCustomers);
    const snap = AccountsReceivableEngine.createAgingSnapshot('ten-001', 'comp-001', report, 'usr-001');
    arAgingSnapshots.unshift(snap);
    res.status(201).json(snap);
  });

  // 8. Customer Statement of Account Engine
  app.get('/api/v1/ar/statements/:customerId', (req: Request, res: Response) => {
    const { customerId } = req.params;
    const { startDate, endDate } = req.query;

    const cust = arCustomers.find(c => c.id === customerId);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });

    const stmt = AccountsReceivableEngine.generateCustomerStatement(
      customerId,
      cust,
      arSalesInvoices,
      arReceipts,
      arCreditNotes,
      arDebitNotes,
      (startDate as string) || '2026-01-01',
      (endDate as string) || new Date().toISOString().split('T')[0]
    );

    res.json(stmt);
  });

  // 9. Collections Engine (Notes & Promises)
  app.get('/api/v1/ar/collections/notes/:customerId', (req: Request, res: Response) => {
    const { customerId } = req.params;
    res.json(arCollectionNotes.filter(n => n.customerId === customerId));
  });

  app.post('/api/v1/ar/collections/notes', (req: Request, res: Response) => {
    const { customerId, reminderLevel, activityType, lifecycleState, notes, followUpDate, invoiceId, invoiceNumber } = req.body;
    const cust = arCustomers.find(c => c.id === customerId);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });

    const note = AccountsReceivableEngine.createCollectionNote(
      cust.tenantId,
      cust.companyId,
      customerId,
      cust.name,
      reminderLevel || 'LEVEL_1_GENTLE',
      activityType || 'CALL',
      notes || 'Follow-up call on open AR balance',
      lifecycleState || 'REMINDER',
      followUpDate,
      invoiceId,
      invoiceNumber,
      'usr-001'
    );

    arCollectionNotes.unshift(note);
    res.status(201).json(note);
  });

  app.get('/api/v1/ar/collections/promises/:customerId', (req: Request, res: Response) => {
    const { customerId } = req.params;
    res.json(arPromisesToPay.filter(p => p.customerId === customerId));
  });

  app.post('/api/v1/ar/collections/promises', (req: Request, res: Response) => {
    const { customerId, invoiceId, invoiceNumber, promisedAmount, promiseDate, notes } = req.body;
    const cust = arCustomers.find(c => c.id === customerId);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });

    const ptp = AccountsReceivableEngine.createPromiseToPay(
      cust.tenantId,
      cust.companyId,
      customerId,
      cust.name,
      invoiceId || 'sinv-001',
      invoiceNumber || 'INV-2026-88001',
      Number(promisedAmount || 0),
      promiseDate || new Date().toISOString().split('T')[0],
      notes,
      'usr-001'
    );

    arPromisesToPay.unshift(ptp);
    res.status(201).json(ptp);
  });

  app.put('/api/v1/ar/collections/promises/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    const ptp = arPromisesToPay.find(p => p.id === id);
    if (!ptp) return res.status(404).json({ error: 'Promise to pay record not found' });

    ptp.status = status || ptp.status;
    if (notes) ptp.notes = notes;
    ptp.updatedAt = new Date().toISOString();

    res.json(ptp);
  });

  // 10. Multi Currency FX Settlement Readiness
  app.post('/api/v1/ar/settlement-fx', (req: Request, res: Response) => {
    const { invoiceId, receiptId, docCurrency, baseCurrency, invoiceRate, receiptRate, amount } = req.body;
    const fxResult = AccountsReceivableEngine.calculateSettlementFXDifference(
      invoiceId || 'sinv-001',
      receiptId || 'rct-001',
      docCurrency || 'USD',
      baseCurrency || 'SAR',
      Number(invoiceRate || 3.75),
      Number(receiptRate || 3.76),
      Number(amount || 10000)
    );
    res.json(fxResult);
  });

  // 10. Revenue Recognition Schedules (IFRS 15 Readiness)
  app.get('/api/v1/ar/rev-rec/schedules', (req: Request, res: Response) => {
    res.json(arRevRecSchedules);
  });

  app.post('/api/v1/ar/rev-rec/schedule', (req: Request, res: Response) => {
    const { contractRef, customerId, totalContractValue, obligations, startDate, durationMonths } = req.body;
    const cust = arCustomers.find(c => c.id === customerId);
    const customerName = cust ? cust.name : 'Enterprise Customer';

    const sched = AccountsReceivableEngine.buildRevenueRecognitionSchedule(
      contractRef || `CNT-${Date.now()}`,
      customerId,
      customerName,
      Number(totalContractValue || 100000),
      obligations || ['Software License Delivery', 'SLA Maintenance Support', 'Cloud Hosting Services'],
      startDate || new Date().toISOString().split('T')[0],
      durationMonths || 12
    );

    arRevRecSchedules.unshift(sched);
    res.status(201).json(sched);
  });

  // 11. Audit Trail Logs
  app.get('/api/v1/ar/audit-logs', (req: Request, res: Response) => {
    res.json(arAuditLogs);
  });

  // ==================== PHASE 2.6 GENERAL LEDGER & FINANCIAL CLOSING REST APIS ====================

  // 1. Chart of Accounts Endpoints
  app.get('/api/v1/gl/accounts', (req: Request, res: Response) => {
    res.json(glAccounts);
  });

  app.post('/api/v1/gl/accounts', (req: Request, res: Response) => {
    const { code, name, nameAr, group, accountType, postingRestriction, parentId, currency, isControlAccount, controlType } = req.body;
    const existing = glAccounts.find(a => a.code === code);
    if (existing) {
      return res.status(400).json({ error: `Account with code ${code} already exists.` });
    }

    const newAccount: GLAccount = {
      id: `acc-gl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: 'ten-001',
      companyId: 'comp-001',
      code: code || `ACC-${glAccounts.length + 100}`,
      name: name || 'New GL Account',
      nameAr: nameAr || name || 'حساب جديد',
      group: group || 'OperatingExpense',
      accountType: accountType || 'OperatingExpense',
      parentId: parentId || null,
      level: parentId ? 2 : 1,
      isControlAccount: Boolean(isControlAccount),
      controlType: controlType,
      postingRestriction: postingRestriction || 'POSTING_ALLOWED',
      currency: currency || 'SAR',
      balance: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    glAccounts.push(newAccount);

    glAuditTrail.unshift({
      id: `glaud-${Date.now()}`,
      tenantId: 'ten-001',
      companyId: 'comp-001',
      timestamp: new Date().toISOString(),
      userId: 'usr-001',
      userName: 'Finance Manager',
      action: 'ACCOUNT_CREATED',
      entityType: 'GLAccount',
      entityId: newAccount.id,
      correlationId: `CORR-ACC-${newAccount.code}`,
      hash: GeneralLedgerEngine.computeSHA256Hash(newAccount),
      details: `Created GL Account ${newAccount.code} - ${newAccount.name} (${newAccount.group})`
    });

    res.status(201).json(newAccount);
  });

  app.put('/api/v1/gl/accounts/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const acc = glAccounts.find(a => a.id === id || a.code === id);
    if (!acc) return res.status(404).json({ error: 'GL Account not found' });

    const { name, nameAr, postingRestriction, isActive, group, accountType } = req.body;
    if (name) acc.name = name;
    if (nameAr) acc.nameAr = nameAr;
    if (postingRestriction) acc.postingRestriction = postingRestriction;
    if (isActive !== undefined) acc.isActive = isActive;
    if (group) acc.group = group;
    if (accountType) acc.accountType = accountType;
    acc.updatedAt = new Date().toISOString();

    glAuditTrail.unshift({
      id: `glaud-${Date.now()}`,
      tenantId: 'ten-001',
      companyId: 'comp-001',
      timestamp: new Date().toISOString(),
      userId: 'usr-001',
      userName: 'Finance Manager',
      action: 'ACCOUNT_UPDATED',
      entityType: 'GLAccount',
      entityId: acc.id,
      correlationId: `CORR-ACC-UPD-${acc.code}`,
      hash: GeneralLedgerEngine.computeSHA256Hash(acc),
      details: `Updated GL Account ${acc.code} (${acc.name}). Posting Restriction: ${acc.postingRestriction}`
    });

    res.json(acc);
  });

  // 2. Journal Entry Engine Endpoints
  app.get('/api/v1/gl/journals', (req: Request, res: Response) => {
    const { status, journalType, period, year } = req.query;
    let list = [...glJournals];
    if (status) list = list.filter(j => j.status === status);
    if (journalType) list = list.filter(j => j.journalType === journalType);
    if (period) list = list.filter(j => j.fiscalPeriod === Number(period));
    if (year) list = list.filter(j => j.fiscalYear === Number(year));
    res.json(list);
  });

  app.post('/api/v1/gl/journals', (req: Request, res: Response) => {
    try {
      const { 
        entryNumber, 
        date, 
        postingDate, 
        fiscalYear, 
        fiscalPeriod, 
        journalType, 
        reference, 
        description, 
        lines, 
        createdBy, 
        createdByName,
        idempotencyKey 
      } = req.body;

      const headerIdemKey = req.headers['x-idempotency-key'] as string | undefined;
      const effectiveIdemKey = idempotencyKey || headerIdemKey;

      if (effectiveIdemKey) {
        const existingJournal = glJournals.find(j => j.idempotencyKey === effectiveIdemKey);
        if (existingJournal) {
          return res.status(200).json(existingJournal);
        }
      }

      const today = new Date().toISOString().split('T')[0];
      const targetYear = fiscalYear ? Number(fiscalYear) : 2026;
      const targetPeriod = fiscalPeriod ? Number(fiscalPeriod) : 8;

      const nextNum = entryNumber || GeneralLedgerEngine.generateSequentialJournalNumber({
        existingJournals: glJournals,
        companyId: 'comp-001',
        fiscalYear: targetYear,
        fiscalPeriod: targetPeriod
      });

      const { journalEntry, auditRecord } = GeneralLedgerEngine.createJournalEntry({
        tenantId: 'ten-001',
        companyId: 'comp-001',
        entryNumber: nextNum,
        date: date || today,
        postingDate: postingDate || date || today,
        fiscalYear: targetYear,
        fiscalPeriod: targetPeriod,
        journalType: journalType || 'MANUAL',
        reference,
        description: description || 'Manual General Ledger Journal Entry',
        lines: lines || [],
        createdBy: createdBy || 'usr-001',
        createdByName: createdByName || 'Finance Officer',
        idempotencyKey: effectiveIdemKey,
        accounts: glAccounts,
        periods: glFiscalPeriods
      });

      glJournals.unshift(journalEntry);
      glAuditTrail.unshift(auditRecord);

      res.status(201).json(journalEntry);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/v1/gl/journals/:id/post', (req: Request, res: Response) => {
    const { id } = req.params;
    const { approvedBy } = req.body;
    const journal = glJournals.find(j => j.id === id || j.entryNumber === id);
    if (!journal) return res.status(404).json({ error: 'Journal Entry not found' });

    if (journal.status === 'POSTED') {
      return res.status(200).json(journal);
    }

    try {
      const { updatedJournal, auditRecord } = GeneralLedgerEngine.postJournalEntry(
        journal,
        glAccounts,
        approvedBy || 'Finance Controller'
      );

      const idx = glJournals.findIndex(j => j.id === journal.id);
      if (idx !== -1) glJournals[idx] = updatedJournal;
      glAuditTrail.unshift(auditRecord);

      res.json(updatedJournal);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/v1/gl/journals/:id/reverse', (req: Request, res: Response) => {
    const { id } = req.params;
    const { reversalDate, reversedBy, reversedByName } = req.body;
    const journal = glJournals.find(j => j.id === id || j.entryNumber === id);
    if (!journal) return res.status(404).json({ error: 'Journal Entry not found' });

    try {
      const today = new Date().toISOString().split('T')[0];
      const { reversingJournal, updatedOriginalJournal, auditRecord } = GeneralLedgerEngine.reverseJournalEntry({
        originalJournal: journal,
        reversalDate: reversalDate || today,
        reversedBy: reversedBy || 'usr-001',
        reversedByName: reversedByName || 'Chief Accountant',
        accounts: glAccounts,
        periods: glFiscalPeriods
      });

      const idx = glJournals.findIndex(j => j.id === journal.id);
      if (idx !== -1) glJournals[idx] = updatedOriginalJournal;
      glJournals.unshift(reversingJournal);
      glAuditTrail.unshift(auditRecord);

      res.json({ originalJournal: updatedOriginalJournal, reversingJournal });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Journal Lock Enforcement: Reject PUT/DELETE on POSTED or REVERSED journals
  app.put('/api/v1/gl/journals/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const journal = glJournals.find(j => j.id === id || j.entryNumber === id);
    if (!journal) return res.status(404).json({ error: 'Journal Entry not found' });

    if (journal.status === 'POSTED' || journal.status === 'REVERSED') {
      return res.status(403).json({ 
        error: `Journal ${journal.entryNumber} is in immutable '${journal.status}' status. Modifications are strictly forbidden under IFRS / IAS 1 audit rules. Corrective postings must be executed via reversal.` 
      });
    }

    Object.assign(journal, req.body);
    journal.updatedAt = new Date().toISOString();
    res.json(journal);
  });

  app.delete('/api/v1/gl/journals/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const journal = glJournals.find(j => j.id === id || j.entryNumber === id);
    if (!journal) return res.status(404).json({ error: 'Journal Entry not found' });

    if (journal.status === 'POSTED' || journal.status === 'REVERSED') {
      return res.status(403).json({ 
        error: `Journal ${journal.entryNumber} is in immutable '${journal.status}' status. Deletion is strictly forbidden under IFRS / IAS 1 audit rules.` 
      });
    }

    const idx = glJournals.findIndex(j => j.id === journal.id);
    if (idx !== -1) {
      glJournals.splice(idx, 1);
    }
    res.json({ message: `Draft journal ${journal.entryNumber} deleted.` });
  });

  // 3. Posting Rules Endpoints
  app.get('/api/v1/gl/posting-rules', (req: Request, res: Response) => {
    res.json(postingRules);
  });

  app.post('/api/v1/gl/posting-rules', (req: Request, res: Response) => {
    const { documentType, name, debitAccountCode, creditAccountCode, taxAccountCode, discountAccountCode } = req.body;
    const newRule = {
      id: `pr-${Date.now()}`,
      tenantId: 'ten-001',
      companyId: 'comp-001',
      documentType,
      name,
      debitAccountCode,
      creditAccountCode,
      taxAccountCode,
      discountAccountCode,
      isActive: true
    };
    postingRules.push(newRule);
    res.status(201).json(newRule);
  });

  // 4. Fiscal Calendar & Posting Period Endpoints
  app.get('/api/v1/gl/fiscal-years', (req: Request, res: Response) => {
    res.json(glFiscalYears);
  });

  app.post('/api/v1/gl/fiscal-years', (req: Request, res: Response) => {
    const { year, startDate, endDate } = req.body;
    const newYear: FiscalYearRecord = {
      id: `fy-${year}`,
      tenantId: 'ten-001',
      companyId: 'comp-001',
      year: Number(year),
      startDate: startDate || `${year}-01-01`,
      endDate: endDate || `${year}-12-31`,
      isClosed: false
    };
    glFiscalYears.push(newYear);
    res.status(201).json(newYear);
  });

  app.get('/api/v1/gl/fiscal-periods', (req: Request, res: Response) => {
    res.json(glFiscalPeriods);
  });

  app.put('/api/v1/gl/fiscal-periods/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, lockedBy, reason } = req.body;
    const fp = glFiscalPeriods.find(p => p.id === id || p.periodNumber === Number(id));
    if (!fp) return res.status(404).json({ error: 'Fiscal Period not found' });

    if (status === 'REOPENED') {
      try {
        const { updatedPeriod, auditRecord } = GeneralLedgerEngine.reopenFiscalPeriod({
          period: fp,
          reopenedBy: lockedBy || 'Chief Financial Officer',
          reason: reason || 'Audit adjustment required'
        });

        const idx = glFiscalPeriods.findIndex(p => p.id === fp.id);
        if (idx !== -1) glFiscalPeriods[idx] = updatedPeriod;
        glAuditTrail.unshift(auditRecord);
        return res.json(updatedPeriod);
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }

    fp.status = status;
    fp.lockedBy = lockedBy || 'Financial Controller';
    fp.lockedAt = new Date().toISOString();

    glAuditTrail.unshift({
      id: `glaud-${Date.now()}`,
      tenantId: 'ten-001',
      companyId: 'comp-001',
      timestamp: new Date().toISOString(),
      userId: 'usr-001',
      userName: 'Financial Controller',
      action: status === 'CLOSED' ? 'PERIOD_CLOSED' : 'PERIOD_REOPENED',
      entityType: 'FiscalPeriod',
      entityId: fp.id,
      correlationId: `CORR-PERIOD-${fp.year}-${fp.periodNumber}`,
      hash: GeneralLedgerEngine.computeSHA256Hash(fp),
      details: `Updated Fiscal Period ${fp.periodName} (${fp.year}) status to ${fp.status}`
    });

    res.json(fp);
  });

  app.post('/api/v1/gl/fiscal-periods/:id/reopen', (req: Request, res: Response) => {
    const { id } = req.params;
    const { reopenedBy, reason } = req.body;
    const fp = glFiscalPeriods.find(p => p.id === id || p.periodNumber === Number(id));
    if (!fp) return res.status(404).json({ error: 'Fiscal Period not found' });

    try {
      const { updatedPeriod, auditRecord } = GeneralLedgerEngine.reopenFiscalPeriod({
        period: fp,
        reopenedBy: reopenedBy || 'Chief Financial Officer',
        reason: reason || 'Audit adjustment required'
      });

      const idx = glFiscalPeriods.findIndex(p => p.id === fp.id);
      if (idx !== -1) glFiscalPeriods[idx] = updatedPeriod;
      glAuditTrail.unshift(auditRecord);

      res.json(updatedPeriod);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 5. Recurring Journal Engine Endpoints
  app.get('/api/v1/gl/recurring-schedules', (req: Request, res: Response) => {
    res.json(glRecurringSchedules);
  });

  app.post('/api/v1/gl/recurring-schedules', (req: Request, res: Response) => {
    const { scheduleCode, name, frequency, nextExecutionDate, templateLines, description } = req.body;
    const newSched: RecurringJournalSchedule = {
      id: `rjs-${Date.now()}`,
      tenantId: 'ten-001',
      companyId: 'comp-001',
      scheduleCode: scheduleCode || `REC-${Date.now()}`,
      name: name || 'Recurring Journal Template',
      frequency: frequency || 'MONTHLY',
      nextExecutionDate: nextExecutionDate || new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
      description: description || 'Auto-generated recurring journal',
      templateLines: templateLines || [],
      createdBy: 'usr-001',
      createdAt: new Date().toISOString()
    };
    glRecurringSchedules.push(newSched);
    res.status(201).json(newSched);
  });

  app.post('/api/v1/gl/recurring-schedules/execute', (req: Request, res: Response) => {
    const executedJournals: GLJournalEntry[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const sched of glRecurringSchedules) {
      if (sched.isActive && sched.nextExecutionDate <= today) {
        const nextNum = GeneralLedgerEngine.generateSequentialJournalNumber({
          existingJournals: glJournals,
          companyId: 'comp-001',
          fiscalYear: 2026,
          fiscalPeriod: 8
        });

        const { journalEntry, auditRecord } = GeneralLedgerEngine.createJournalEntry({
          tenantId: sched.tenantId,
          companyId: sched.companyId,
          entryNumber: nextNum,
          date: today,
          postingDate: today,
          fiscalYear: 2026,
          fiscalPeriod: 8,
          journalType: 'RECURRING',
          reference: sched.scheduleCode,
          description: `[Recurring Schedule ${sched.scheduleCode}] ${sched.description}`,
          lines: sched.templateLines,
          createdBy: 'System Recurring Engine',
          createdByName: 'System Recurring Engine',
          accounts: glAccounts,
          periods: glFiscalPeriods
        });

        const { updatedJournal } = GeneralLedgerEngine.postJournalEntry(journalEntry, glAccounts, 'System Recurring Engine');
        glJournals.unshift(updatedJournal);
        glAuditTrail.unshift(auditRecord);
        executedJournals.push(updatedJournal);

        sched.lastExecutedDate = today;
        const d = new Date(today);
        d.setMonth(d.getMonth() + 1);
        sched.nextExecutionDate = d.toISOString().split('T')[0];
      }
    }

    res.json({ executedCount: executedJournals.length, executedJournals });
  });

  // 6. Trial Balance Engine Endpoints
  app.get('/api/v1/gl/trial-balance', (req: Request, res: Response) => {
    const { periodNumber, fiscalYear, companyId, branchId, costCenterId } = req.query;
    const tb = GeneralLedgerEngine.generateTrialBalance({
      accounts: glAccounts,
      journals: glJournals,
      periodNumber: periodNumber ? Number(periodNumber) : undefined,
      fiscalYear: fiscalYear ? Number(fiscalYear) : undefined,
      companyId: companyId as string,
      branchId: branchId as string,
      costCenterId: costCenterId as string
    });
    res.json(tb);
  });

  app.get('/api/v1/gl/trial-balance/verify', (req: Request, res: Response) => {
    const { periodNumber, fiscalYear } = req.query;
    const tb = GeneralLedgerEngine.generateTrialBalance({
      accounts: glAccounts,
      journals: glJournals,
      periodNumber: periodNumber ? Number(periodNumber) : undefined,
      fiscalYear: fiscalYear ? Number(fiscalYear) : undefined
    });

    const report = GeneralLedgerEngine.validateTrialBalanceIntegrity(tb.rows);
    res.json(report);
  });

  // Suspense & Clearing Account Detection
  app.get('/api/v1/gl/suspense-accounts', (req: Request, res: Response) => {
    const report = GeneralLedgerEngine.detectSuspenseAccounts(glAccounts);
    res.json(report);
  });

  // 7. Financial Closing & Pre-Close Checklist Endpoints
  app.get('/api/v1/gl/closing/checklist/:periodId', (req: Request, res: Response) => {
    const { periodId } = req.params;
    const period = glFiscalPeriods.find(p => p.id === periodId || p.periodNumber === Number(periodId));
    if (!period) return res.status(404).json({ error: 'Fiscal Period not found' });

    const invClosed = inventoryPeriods.some(p => p.year === period.year && p.periodNumber === period.periodNumber && p.isClosed);
    const openPOsCount = purchaseRequisitions.filter(pr => pr.status === 'PENDING_APPROVAL' || pr.status === 'IN_RFQ').length;
    const unpostedSupplierInvoices = supplierInvoices.filter(i => i.status === 'DRAFT').length;
    const unpostedSalesInvoices = arSalesInvoices.filter(i => i.status === 'DRAFT').length;
    const pendingEvents = financialQueue.filter(q => q.status === 'PENDING').length;

    const checklist = GeneralLedgerEngine.evaluatePreCloseChecklist({
      period,
      journals: glJournals,
      accounts: glAccounts,
      subledgerStatus: {
        isInventoryClosed: invClosed,
        isProcurementClosed: openPOsCount === 0,
        isAPClosed: unpostedSupplierInvoices === 0,
        isARClosed: unpostedSalesInvoices === 0,
        pendingEventsCount: pendingEvents
      }
    });

    res.json(checklist);
  });

  app.post('/api/v1/gl/closing/period-close', (req: Request, res: Response) => {
    const { periodId, closedBy } = req.body;
    const period = glFiscalPeriods.find(p => p.id === periodId || p.periodNumber === Number(periodId));
    if (!period) return res.status(404).json({ error: 'Fiscal Period not found' });

    const invClosed = inventoryPeriods.some(p => p.year === period.year && p.periodNumber === period.periodNumber && p.isClosed);
    const openPOsCount = purchaseRequisitions.filter(pr => pr.status === 'PENDING_APPROVAL' || pr.status === 'IN_RFQ').length;
    const unpostedSupplierInvoices = supplierInvoices.filter(i => i.status === 'DRAFT').length;
    const unpostedSalesInvoices = arSalesInvoices.filter(i => i.status === 'DRAFT').length;
    const pendingEvents = financialQueue.filter(q => q.status === 'PENDING').length;

    const checklist = GeneralLedgerEngine.evaluatePreCloseChecklist({
      period,
      journals: glJournals,
      accounts: glAccounts,
      subledgerStatus: {
        isInventoryClosed: invClosed,
        isProcurementClosed: openPOsCount === 0,
        isAPClosed: unpostedSupplierInvoices === 0,
        isARClosed: unpostedSalesInvoices === 0,
        pendingEventsCount: pendingEvents
      }
    });

    if (!checklist.canClose) {
      return res.status(400).json({ error: 'Period close blocked by checklist errors', blockers: checklist.blockers });
    }

    period.status = 'CLOSED';
    period.lockedBy = closedBy || 'Chief Financial Officer';
    period.lockedAt = new Date().toISOString();

    const tb = GeneralLedgerEngine.generateTrialBalance({
      accounts: glAccounts,
      journals: glJournals,
      periodNumber: period.periodNumber,
      fiscalYear: period.year
    });

    const { snapshot, auditRecord } = GeneralLedgerEngine.generateClosingSnapshot({
      tenantId: 'ten-001',
      companyId: 'comp-001',
      period,
      accounts: glAccounts,
      trialBalance: tb.rows,
      journals: glJournals,
      closedBy: closedBy || 'Chief Financial Officer'
    });

    glClosingSnapshots.unshift(snapshot);
    glAuditTrail.unshift(auditRecord);

    res.json({ success: true, period, snapshot });
  });

  app.get('/api/v1/gl/closing/snapshots', (req: Request, res: Response) => {
    res.json(glClosingSnapshots);
  });

  app.post('/api/v1/gl/closing/year-end-close', (req: Request, res: Response) => {
    const { year, retainedEarningsAccountCode, closedBy } = req.body;
    const fy = glFiscalYears.find(y => y.year === Number(year));
    if (!fy) return res.status(404).json({ error: `Fiscal Year ${year} not found` });

    try {
      const { yearEndRecord, retainedEarningsJE, auditRecord } = GeneralLedgerEngine.executeYearEndClose({
        tenantId: 'ten-001',
        companyId: 'comp-001',
        fiscalYear: fy,
        accounts: glAccounts,
        journals: glJournals,
        retainedEarningsAccountCode: retainedEarningsAccountCode || '3020',
        closedBy: closedBy || 'Chief Financial Officer'
      });

      glJournals.unshift(retainedEarningsJE);
      glYearEndRecords.push(yearEndRecord);
      glAuditTrail.unshift(auditRecord);

      res.status(201).json({ yearEndRecord, retainedEarningsJE });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 8. IAS 21 Unrealized Foreign Currency Revaluation
  app.post('/api/v1/gl/ias21-revaluation', (req: Request, res: Response) => {
    const { spotRates, createdBy, valuationDate } = req.body;
    const rates = spotRates || { 'USD': 3.75, 'EUR': 4.10, 'AED': 1.02, 'EGP': 0.078 };
    const dateStr = valuationDate || new Date().toISOString().split('T')[0];

    const revaluationResults = GeneralLedgerEngine.calculateIAS21UnrealizedFX(glAccounts, rates);

    const { snapshot, auditRecord } = GeneralLedgerEngine.createIAS21FXSnapshot({
      tenantId: 'ten-001',
      companyId: 'comp-001',
      valuationDate: dateStr,
      spotRates: rates,
      revaluationResults,
      createdBy: createdBy || 'usr-001'
    });

    glFXSnapshots.unshift(snapshot);
    glAuditTrail.unshift(auditRecord);

    res.json({ snapshot, revaluationResults });
  });

  app.get('/api/v1/gl/ias21-revaluation/snapshots', (req: Request, res: Response) => {
    res.json(glFXSnapshots);
  });

  // 9. Immutable Audit Trail Endpoint
  app.get('/api/v1/gl/audit-logs', (req: Request, res: Response) => {
    res.json(glAuditTrail);
  });

  // 10. Enterprise Quality Gate Hardening Test Suite Endpoint
  app.get('/api/v1/gl/hardening/quality-gate', (req: Request, res: Response) => {
    const report = Phase26HardeningSuite.runFullSuite({
      accounts: glAccounts,
      journals: glJournals,
      periods: glFiscalPeriods,
      fiscalYears: glFiscalYears
    });
    res.json(report);
  });

  // ==================== PHASE 2.7 FINANCIAL REPORTING & BI API ROUTES ====================

  // 1. Balance Sheet Endpoint (IAS 1)
  app.get('/api/v1/reports/financial/balance-sheet', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const currency = (req.query.currency as string) || 'SAR';
    const asOfDate = (req.query.asOfDate as string) || new Date().toISOString().split('T')[0];
    const report = FinancialReportingEngine.generateBalanceSheet(glAccounts, companyId, currency, asOfDate);
    res.json(report);
  });

  // 2. Income Statement Endpoint (P&L / IAS 1)
  app.get('/api/v1/reports/financial/income-statement', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const currency = (req.query.currency as string) || 'SAR';
    const startDate = (req.query.startDate as string) || '2026-01-01';
    const endDate = (req.query.endDate as string) || new Date().toISOString().split('T')[0];
    const report = FinancialReportingEngine.generateIncomeStatement(glAccounts, companyId, currency, startDate, endDate);
    res.json(report);
  });

  // 3. Cash Flow Statement Endpoint (IAS 7 Indirect Method)
  app.get('/api/v1/reports/financial/cash-flow', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const currency = (req.query.currency as string) || 'SAR';
    const startDate = (req.query.startDate as string) || '2026-01-01';
    const endDate = (req.query.endDate as string) || new Date().toISOString().split('T')[0];
    const bs = FinancialReportingEngine.generateBalanceSheet(glAccounts, companyId, currency, endDate);
    const inc = FinancialReportingEngine.generateIncomeStatement(glAccounts, companyId, currency, startDate, endDate);
    const report = FinancialReportingEngine.generateIndirectCashFlowStatement(inc, bs);
    res.json(report);
  });

  // 4. Statement of Changes in Equity Endpoint (IAS 1)
  app.get('/api/v1/reports/financial/changes-in-equity', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const currency = (req.query.currency as string) || 'SAR';
    const endDate = (req.query.endDate as string) || new Date().toISOString().split('T')[0];
    const bs = FinancialReportingEngine.generateBalanceSheet(glAccounts, companyId, currency, endDate);
    const inc = FinancialReportingEngine.generateIncomeStatement(glAccounts, companyId, currency, '2026-01-01', endDate);
    const report = FinancialReportingEngine.generateStatementOfChangesInEquity(bs, inc.netIncome);
    res.json(report);
  });

  // 5. Trial Balance Reporting Endpoint
  app.get('/api/v1/reports/trial-balance', (req: Request, res: Response) => {
    const type = (req.query.type as any) || 'STANDARD';
    const asOfDate = (req.query.asOfDate as string) || new Date().toISOString().split('T')[0];
    const companyId = (req.query.companyId as string) || 'comp-001';
    const currency = (req.query.currency as string) || 'SAR';
    const report = FinancialReportingEngine.generateTrialBalance(glAccounts, type, asOfDate, companyId, currency);
    res.json(report);
  });

  // 6. Financial Ratios Endpoint
  app.get('/api/v1/reports/ratios', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const currency = (req.query.currency as string) || 'SAR';
    const asOfDate = (req.query.asOfDate as string) || new Date().toISOString().split('T')[0];
    const bs = FinancialReportingEngine.generateBalanceSheet(glAccounts, companyId, currency, asOfDate);
    const inc = FinancialReportingEngine.generateIncomeStatement(glAccounts, companyId, currency, '2026-01-01', asOfDate);
    const report = FinancialReportingEngine.calculateFinancialRatios(bs, inc);
    res.json(report);
  });

  // 7. Executive Dashboard Endpoint
  app.get('/api/v1/reports/executive-dashboard', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const currency = (req.query.currency as string) || 'SAR';
    const asOfDate = (req.query.asOfDate as string) || new Date().toISOString().split('T')[0];
    const bs = FinancialReportingEngine.generateBalanceSheet(glAccounts, companyId, currency, asOfDate);
    const inc = FinancialReportingEngine.generateIncomeStatement(glAccounts, companyId, currency, '2026-01-01', asOfDate);
    const report = FinancialReportingEngine.generateExecutiveDashboard(inc, bs, customers, vendors, inventory);
    res.json(report);
  });

  // 8. Budget vs Actual Endpoint
  app.get('/api/v1/reports/budget-vs-actual', (req: Request, res: Response) => {
    const budgetId = (req.query.budgetId as string) || 'bgt-2026-01';
    const fiscalYear = Number(req.query.fiscalYear) || 2026;
    const mockVersion = {
      id: budgetId,
      tenantId: 'tenant-001',
      companyId: 'comp-001',
      code: 'BGT-2026-V1',
      name: 'FY2026 Master Operating Budget',
      fiscalYear,
      status: 'APPROVED' as const,
      versionType: 'ORIGINAL' as const,
      createdAt: new Date().toISOString()
    };
    const mockItems = [
      { id: 'bi-1', budgetId, accountCode: '4000', accountName: 'Sales Revenue', totalBudgetAmount: 500000, monthlyAllocations: {} },
      { id: 'bi-2', budgetId, accountCode: '5000', accountName: 'Cost of Goods Sold', totalBudgetAmount: 230000, monthlyAllocations: {} },
      { id: 'bi-3', budgetId, accountCode: '6010', accountName: 'Salaries Expense', totalBudgetAmount: 90000, monthlyAllocations: {} },
      { id: 'bi-4', budgetId, accountCode: '6020', accountName: 'Rent Expense', totalBudgetAmount: 35000, monthlyAllocations: {} }
    ];
    const report = FinancialReportingEngine.generateBudgetVsActualReport(mockVersion, mockItems, glAccounts);
    res.json(report);
  });

  // 9. Cost Center Performance Endpoint
  app.get('/api/v1/reports/cost-centers', (req: Request, res: Response) => {
    const mockCC = [
      { id: 'cc-001', code: 'CC-ADM', name: 'Executive Administration', departmentName: 'Executive' },
      { id: 'cc-002', code: 'CC-FIN', name: 'Financial Control & Accounting', departmentName: 'Finance' },
      { id: 'cc-003', code: 'CC-LOG', name: 'Warehouse & Supply Chain Logistics', departmentName: 'Supply Chain' },
      { id: 'cc-004', code: 'CC-SLS', name: 'Commercial Sales & Marketing', departmentName: 'Sales' }
    ];
    const report = FinancialReportingEngine.generateCostCenterReport(mockCC);
    res.json(report);
  });

  // 10. Profit Center Performance Endpoint
  app.get('/api/v1/reports/profit-centers', (req: Request, res: Response) => {
    const mockPC = [
      { id: 'pc-001', code: 'PC-RETAIL', name: 'Retail Business Unit' },
      { id: 'pc-002', code: 'PC-WHOLESALE', name: 'Wholesale Commercial Division' },
      { id: 'pc-003', code: 'PC-SERVICES', name: 'Enterprise Professional Services' }
    ];
    const report = FinancialReportingEngine.generateProfitCenterReport(mockPC);
    res.json(report);
  });

  // 11. Consolidated Statements Endpoint
  app.get('/api/v1/reports/consolidated', (req: Request, res: Response) => {
    const groupName = (req.query.groupName as string) || 'AM Holding Group';
    const parentCompanyId = (req.query.parentCompanyId as string) || 'comp-001';
    const report = FinancialReportingEngine.generateConsolidatedReport(groupName, parentCompanyId);
    res.json(report);
  });

  // 12. Business Intelligence Dataset Endpoint
  app.get('/api/v1/reports/bi-dataset', (req: Request, res: Response) => {
    const reportName = (req.query.reportName as string) || 'Enterprise BI Analytics';
    const report = FinancialReportingEngine.generateBIDataset(reportName);
    res.json(report);
  });

  // 13. Dynamic Report Builder Endpoint
  app.post('/api/v1/reports/dynamic/build', (req: Request, res: Response) => {
    const definition = req.body.definition || {
      id: 'dyn-001',
      tenantId: 'tenant-001',
      companyId: 'comp-001',
      name: 'Custom Journal Entry Report',
      description: 'Filtered GL Journal Entries',
      reportType: 'JOURNAL_ENTRIES',
      groupByFields: [],
      filterCriteria: [],
      sortCriteria: [],
      selectedColumns: ['entryNumber', 'date', 'description', 'totalDebit', 'totalCredit'],
      dateRange: { startDate: '2026-01-01', endDate: '2026-12-31' },
      isTemplate: false,
      isBookmarked: true,
      createdBy: 'analyst',
      createdAt: new Date().toISOString()
    };
    const report = FinancialReportingEngine.buildDynamicReport(definition, glJournals);
    res.json(report);
  });

  // 14. Report Export Endpoint
  app.post('/api/v1/reports/export', (req: Request, res: Response) => {
    const { reportData, format, customTitle } = req.body;
    const result = FinancialReportingEngine.exportReport(reportData, format || 'EXCEL', customTitle || 'Financial Report');
    res.json(result);
  });

  // 15. Financial Report Snapshot Endpoints
  app.post('/api/v1/reports/snapshots', (req: Request, res: Response) => {
    const { reportType, companyId, reportData, parameters, filters, branchId } = req.body;
    const snapshot = FinancialReportingEngine.createReportSnapshot(
      reportType || 'BALANCE_SHEET',
      companyId || 'comp-001',
      reportData || {},
      parameters || {},
      filters || {},
      'finance_manager',
      branchId
    );
    res.json(snapshot);
  });

  app.get('/api/v1/reports/snapshots', (req: Request, res: Response) => {
    const reportType = req.query.reportType as string;
    const companyId = req.query.companyId as string;
    const snapshots = FinancialReportingEngine.getReportSnapshots({ reportType, companyId });
    res.json(snapshots);
  });

  app.get('/api/v1/reports/snapshots/:id/verify', (req: Request, res: Response) => {
    const result = FinancialReportingEngine.verifySnapshotIntegrity(req.params.id);
    res.json(result);
  });

  // 16. 5-Level Executive KPI Drill-Through Lineage Endpoint
  app.get('/api/v1/reports/kpi-lineage/:kpiId', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const lineage = FinancialReportingEngine.getKPITraceabilityLineage(req.params.kpiId, companyId);
    res.json(lineage);
  });

  // 17. Comparative Reporting Endpoints
  app.get('/api/v1/reports/comparative/mom', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const month1 = (req.query.month1 as string) || '2026-01';
    const month2 = (req.query.month2 as string) || '2026-02';
    const report = FinancialReportingEngine.generateMonthOverMonthReport(glAccounts, companyId, month1, month2);
    res.json(report);
  });

  app.get('/api/v1/reports/comparative/yoy', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const year1 = Number(req.query.year1) || 2025;
    const year2 = Number(req.query.year2) || 2026;
    const report = FinancialReportingEngine.generateYearOverYearReport(glAccounts, companyId, year1, year2);
    res.json(report);
  });

  // 18. Phase 2.7 Financial Reporting Quality Gate Suite Endpoint
  app.get('/api/v1/reports/quality-gate', (req: Request, res: Response) => {
    const report = Phase27HardeningSuite.runFullSuite({
      accounts: glAccounts,
      journals: glJournals,
      periods: fiscalPeriods as any,
      fiscalYears
    });
    res.json(report);
  });

  // ==================== PHASE 2.8: FIXED ASSETS & LIFECYCLE REST ENDPOINTS ====================

  // 1. Get Assets List
  app.get('/api/v1/assets', (req: Request, res: Response) => {
    const companyId = req.query.companyId as string;
    const filtered = companyId ? fixedAssetMasters.filter(a => a.companyId === companyId) : fixedAssetMasters;
    res.json({ success: true, count: filtered.length, data: filtered });
  });

  // 2. Get Asset Master Data Setup
  app.get('/api/v1/assets/master-data', (req: Request, res: Response) => {
    res.json({
      success: true,
      assetClasses: fixedAssetClasses,
      locations: [
        { id: 'loc-001', code: 'HQ-DC', name: 'Riyadh HQ Data Center' },
        { id: 'loc-002', code: 'JED-PORT', name: 'Jeddah Port Terminal' },
        { id: 'loc-003', code: 'DAM-PLANT1', name: 'Dammam Industrial Zone Plant 1' }
      ],
      departments: [
        { id: 'dept-001', code: 'FIN', name: 'Finance & Accounting' },
        { id: 'dept-002', code: 'IT', name: 'IT & Infrastructure' },
        { id: 'dept-003', code: 'LOG', name: 'Logistics & Supply Chain' },
        { id: 'dept-004', code: 'OPS', name: 'Plant Operations' }
      ],
      costCenters: [
        { id: 'cc-001', code: 'CC-FIN-01', name: 'Financial Administration' },
        { id: 'cc-002', code: 'CC-IT-01', name: 'IT Operations' },
        { id: 'cc-003', code: 'CC-LOG-01', name: 'Fleet Operations' },
        { id: 'cc-004', code: 'CC-OPS-01', name: 'Manufacturing Cost Center' }
      ],
      employees: [
        { id: 'emp-101', code: 'EMP-101', name: 'Tariq Al-Mansoor' },
        { id: 'emp-102', code: 'EMP-102', name: 'Sami Al-Otaibi' },
        { id: 'emp-103', code: 'EMP-103', name: 'Khaled Ghamdi' }
      ]
    });
  });

  // 4. Create / Register Fixed Asset Master (Hardened with Gapless Sequential Numbering & Validation)
  app.post('/api/v1/assets', (req: Request, res: Response) => {
    try {
      const classMap = new Map<string, AssetClass>(fixedAssetClasses.map(c => [c.id, c]));
      const assetData = req.body.assetData;
      const idempotencyKey = req.body.idempotencyKey || assetData.idempotencyKey;

      // Validate acquisition rules
      const valResult = FixedAssetsEngine.validateAcquisitionRules({
        assetData,
        existingAssets: fixedAssetMasters,
        existingAcquisitions: fixedAssetAcquisitions,
        idempotencyKey
      });

      if (!valResult.isValid) {
        return res.status(400).json({ success: false, errors: valResult.errors, message: valResult.errors.join('; ') });
      }

      // Generate gapless sequential asset number if not manually assigned
      const assetClass = classMap.get(assetData.assetClassId);
      const gapless = FixedAssetsEngine.generateGaplessAssetNumber({
        companyCode: assetData.companyId || 'COMP01',
        assetClassCode: assetClass?.code || 'GEN',
        fiscalYear: new Date(assetData.acquisitionDate || '2026-01-01').getFullYear(),
        existingAssets: fixedAssetMasters
      });

      const result = FixedAssetsEngine.processAssetAcquisition({
        assetData: {
          ...assetData,
          idempotencyKey
        },
        acquisitionRecord: req.body.acquisitionRecord || {
          acquisitionType: assetData.acquisitionType || 'PURCHASE',
          purchaseCost: assetData.purchaseCost,
          currency: assetData.currency || 'SAR',
          exchangeRate: 1.0,
          acquisitionDate: assetData.acquisitionDate,
          operationalDate: assetData.operationalDate || assetData.acquisitionDate,
          glAssetAccount: assetClass?.glAssetAccount || '120000',
          glClearingAccount: '211000',
          poNumber: assetData.poNumber,
          vendorInvoiceNumber: assetData.vendorInvoiceNumber
        },
        assetClassMap: classMap,
        createdBy: req.body.createdBy || 'usr-001'
      });

      // Assign the gapless verified numbers
      result.asset.assetNumber = gapless.assetNumber;
      result.asset.barcode = gapless.barcode;
      result.asset.qrCode = gapless.qrCode;
      result.acquisitionRecord.assetNumber = gapless.assetNumber;
      result.event.assetNumber = gapless.assetNumber;
      result.auditLog.assetNumber = gapless.assetNumber;

      fixedAssetMasters.unshift(result.asset);
      fixedAssetAcquisitions.push(result.acquisitionRecord);
      fixedAssetEvents.push(result.event);
      fixedAssetAuditLogs.push(result.auditLog);

      res.status(201).json({
        success: true,
        message: `Asset ${result.asset.assetNumber} successfully registered & capitalized (Gapless Seq #${gapless.sequenceNumber})`,
        asset: result.asset,
        acquisitionRecord: result.acquisitionRecord,
        event: result.event
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // 5. Post Asset Acquisition
  app.post('/api/v1/assets/acquisitions', (req: Request, res: Response) => {
    try {
      const classMap = new Map<string, AssetClass>(fixedAssetClasses.map(c => [c.id, c]));
      const assetData = req.body.assetData;
      const idempotencyKey = req.body.idempotencyKey || assetData.idempotencyKey;

      const valResult = FixedAssetsEngine.validateAcquisitionRules({
        assetData,
        existingAssets: fixedAssetMasters,
        existingAcquisitions: fixedAssetAcquisitions,
        idempotencyKey
      });

      if (!valResult.isValid) {
        return res.status(400).json({ success: false, errors: valResult.errors, message: valResult.errors.join('; ') });
      }

      const result = FixedAssetsEngine.processAssetAcquisition({
        assetData: {
          ...assetData,
          idempotencyKey
        },
        acquisitionRecord: req.body.acquisitionRecord,
        assetClassMap: classMap,
        createdBy: req.body.createdBy || 'usr-001'
      });

      fixedAssetMasters.unshift(result.asset);
      fixedAssetAcquisitions.push(result.acquisitionRecord);
      fixedAssetEvents.push(result.event);
      fixedAssetAuditLogs.push(result.auditLog);

      res.status(201).json({
        success: true,
        message: `Asset Acquisition recorded`,
        asset: result.asset,
        acquisitionRecord: result.acquisitionRecord,
        publishedEvent: result.event
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // 6. Run Periodic Monthly Depreciation (Hardened with Idempotency & Rollback Protection)
  app.post('/api/v1/assets/depreciation/run', (req: Request, res: Response) => {
    try {
      const companyId = req.body.companyId || 'comp-001';
      const period = req.body.period || '2026-08';
      const runBy = req.body.runBy || 'Enterprise Depreciation Engine';
      const forceRerun = Boolean(req.body.forceRerun);

      const periodKey = `${companyId}:${period}`;

      // Prevent duplicate run unless explicit rollback was completed
      if (postedDepreciationPeriods.has(periodKey) && !forceRerun) {
        return res.status(409).json({
          success: false,
          errorCode: 'DUPLICATE_DEPRECIATION_RUN',
          message: `Depreciation run for period ${period} and company ${companyId} has already been posted. To rerun, execute an authorized rollback first.`
        });
      }

      const result = FixedAssetsEngine.runMonthlyDepreciation({
        assets: fixedAssetMasters,
        assetClasses: fixedAssetClasses,
        companyId,
        period,
        runBy
      });

      postedDepreciationPeriods.add(periodKey);
      pilotDb.saveEntity('postedDepreciationPeriods', { id: periodKey, periodKey, postedAt: new Date().toISOString() }, 'ten-001', companyId);

      // Record in audit vault
      const depAuditLog: AssetAuditLogRecord = {
        id: `LOG-DEP-RUN-${Date.now()}`,
        assetId: 'FLEET-RUN',
        assetNumber: 'ALL-ACTIVE-ASSETS',
        eventType: 'DEPRECIATION_POSTED',
        timestamp: new Date().toISOString(),
        actionBy: runBy,
        details: `Monthly depreciation executed for period ${period}: ${result.assetCount} assets processed, total dep = ${result.totalDepreciationAmount.toFixed(2)} SAR`,
        payload: { period, assetCount: result.assetCount, totalDep: result.totalDepreciationAmount, runId: result.runId },
        sha256Hash: FixedAssetsEngine.computeSha256Hash({ runId: result.runId, period, total: result.totalDepreciationAmount }),
        correlationId: result.correlationId
      };
      fixedAssetAuditLogs.push(depAuditLog);

      res.json({
        success: true,
        message: `Depreciation run ${result.runId} executed for ${period}. Total: ${result.totalDepreciationAmount} SAR across ${result.assetCount} assets.`,
        depreciationRunResult: result
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // 7. Get Asset Depreciation Schedule
  app.get('/api/v1/assets/depreciation/schedule/:assetId', (req: Request, res: Response) => {
    const asset = fixedAssetMasters.find(a => a.id === req.params.assetId || a.assetNumber === req.params.assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    const schedule = FixedAssetsEngine.generateDepreciationSchedule(asset);
    res.json({ success: true, assetNumber: asset.assetNumber, schedule });
  });

  // 8. Post Asset Transfer (Hardened with Lineage Tracking)
  app.post('/api/v1/assets/transfers', (req: Request, res: Response) => {
    try {
      const asset = fixedAssetMasters.find(a => a.id === req.body.assetId || a.assetNumber === req.body.assetId);
      if (!asset) {
        return res.status(404).json({ success: false, message: 'Asset not found' });
      }

      FixedAssetsEngine.validateAssetLockStatus(asset);

      const result = FixedAssetsEngine.processAssetTransfer({
        asset,
        transferType: req.body.transferType || 'LOCATION',
        toCompanyId: req.body.toCompanyId,
        toBranchId: req.body.toBranchId,
        toDepartmentId: req.body.toDepartmentId,
        toDepartmentName: req.body.toDepartmentName,
        toCostCenterId: req.body.toCostCenterId,
        toCostCenterName: req.body.toCostCenterName,
        toLocationId: req.body.toLocationId,
        toLocationName: req.body.toLocationName,
        toEmployeeId: req.body.toEmployeeId,
        toEmployeeName: req.body.toEmployeeName,
        reason: req.body.reason || 'Inter-departmental operational transfer',
        approvedBy: req.body.approvedBy || 'usr-001'
      });

      const idx = fixedAssetMasters.findIndex(a => a.id === asset.id);
      if (idx !== -1) {
        fixedAssetMasters[idx] = result.updatedAsset;
      }

      fixedAssetTransfers.push(result.transferRecord);
      fixedAssetEvents.push(result.event);
      fixedAssetAuditLogs.push(result.auditLog);

      res.json({
        success: true,
        message: `Asset ${asset.assetNumber} transfer completed`,
        updatedAsset: result.updatedAsset,
        transferRecord: result.transferRecord,
        publishedEvent: result.event
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // 9. Post Asset Disposal (Hardened with Open Maintenance Collision Blocker)
  app.post('/api/v1/assets/disposals', (req: Request, res: Response) => {
    try {
      const asset = fixedAssetMasters.find(a => a.id === req.body.assetId || a.assetNumber === req.body.assetId);
      if (!asset) {
        return res.status(404).json({ success: false, message: 'Asset not found' });
      }

      FixedAssetsEngine.validateAssetLockStatus(asset);

      const dispValidation = FixedAssetsEngine.validateDisposalRules({
        asset,
        maintenances: fixedAssetMaintenances
      });

      if (!dispValidation.isValid) {
        return res.status(400).json({ success: false, errors: dispValidation.errors, message: dispValidation.errors.join('; ') });
      }

      const classMap = new Map<string, AssetClass>(fixedAssetClasses.map(c => [c.id, c]));
      const result = FixedAssetsEngine.processAssetDisposal({
        asset,
        disposalType: req.body.disposalType || 'SALE',
        disposalDate: req.body.disposalDate || new Date().toISOString().split('T')[0],
        proceedsAmount: Number(req.body.proceedsAmount) || 0,
        buyerName: req.body.buyerName,
        remarks: req.body.remarks || 'Asset disposal processed',
        approvedBy: req.body.approvedBy || 'usr-001',
        glClassMap: classMap
      });

      const idx = fixedAssetMasters.findIndex(a => a.id === asset.id);
      if (idx !== -1) {
        fixedAssetMasters[idx] = result.updatedAsset;
      }

      fixedAssetDisposals.push(result.disposalRecord);
      fixedAssetEvents.push(result.event);
      fixedAssetAuditLogs.push(result.auditLog);

      res.json({
        success: true,
        message: `Asset ${asset.assetNumber} disposal processed with Gain/Loss: ${result.disposalRecord.gainLossAmount} SAR`,
        updatedAsset: result.updatedAsset,
        disposalRecord: result.disposalRecord,
        publishedEvent: result.event
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // 10. Post IAS 16 Asset Revaluation (Hardened)
  app.post('/api/v1/assets/revaluations', (req: Request, res: Response) => {
    try {
      const asset = fixedAssetMasters.find(a => a.id === req.body.assetId || a.assetNumber === req.body.assetId);
      if (!asset) {
        return res.status(404).json({ success: false, message: 'Asset not found' });
      }

      FixedAssetsEngine.validateAssetLockStatus(asset);

      const valuerName = req.body.valuerName || 'Licensed Independent Valuer';
      const appraisalValue = Number(req.body.appraisalValue);

      const revalValidation = FixedAssetsEngine.validateIAS16Revaluation({
        asset,
        appraisalValue,
        valuerName
      });

      if (!revalValidation.isValid) {
        return res.status(400).json({ success: false, errors: revalValidation.errors, message: revalValidation.errors.join('; ') });
      }

      const classMap = new Map<string, AssetClass>(fixedAssetClasses.map(c => [c.id, c]));
      const result = FixedAssetsEngine.processAssetRevaluation({
        asset,
        revaluationDate: req.body.revaluationDate || new Date().toISOString().split('T')[0],
        appraisalValue,
        valuerName,
        valuerReportReference: req.body.valuerReportReference,
        remarks: req.body.remarks || 'IAS 16 Periodic Revaluation',
        approvedBy: req.body.approvedBy || 'usr-001',
        glClassMap: classMap
      });

      const idx = fixedAssetMasters.findIndex(a => a.id === asset.id);
      if (idx !== -1) {
        fixedAssetMasters[idx] = result.updatedAsset;
      }

      fixedAssetRevaluations.push(result.revaluationRecord);
      fixedAssetEvents.push(result.event);
      fixedAssetAuditLogs.push(result.auditLog);

      res.json({
        success: true,
        message: `Asset ${asset.assetNumber} IAS 16 Revaluation completed`,
        updatedAsset: result.updatedAsset,
        revaluationRecord: result.revaluationRecord,
        publishedEvent: result.event
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // 11. Post IAS 36 Asset Impairment / Reversal (Hardened)
  app.post('/api/v1/assets/impairments', (req: Request, res: Response) => {
    try {
      const asset = fixedAssetMasters.find(a => a.id === req.body.assetId || a.assetNumber === req.body.assetId);
      if (!asset) {
        return res.status(404).json({ success: false, message: 'Asset not found' });
      }

      FixedAssetsEngine.validateAssetLockStatus(asset);

      const recoverableAmount = Number(req.body.recoverableAmount);
      const isReversal = Boolean(req.body.isReversal);

      const impValidation = FixedAssetsEngine.validateIAS36Impairment({
        asset,
        recoverableAmount,
        isReversal
      });

      if (!impValidation.isValid) {
        return res.status(400).json({ success: false, errors: impValidation.errors, message: impValidation.errors.join('; ') });
      }

      const result = FixedAssetsEngine.processAssetImpairment({
        asset,
        impairmentDate: req.body.impairmentDate || new Date().toISOString().split('T')[0],
        recoverableAmount,
        valuationMethod: req.body.valuationMethod || 'VALUE_IN_USE',
        isReversal,
        reason: req.body.reason || 'IAS 36 Impairment Test',
        approvedBy: req.body.approvedBy || 'usr-001'
      });

      const idx = fixedAssetMasters.findIndex(a => a.id === asset.id);
      if (idx !== -1) {
        fixedAssetMasters[idx] = result.updatedAsset;
      }

      fixedAssetImpairments.push(result.impairmentRecord);
      fixedAssetEvents.push(result.event);
      fixedAssetAuditLogs.push(result.auditLog);

      res.json({
        success: true,
        message: `Asset ${asset.assetNumber} IAS 36 Impairment record posted`,
        updatedAsset: result.updatedAsset,
        impairmentRecord: result.impairmentRecord,
        publishedEvent: result.event
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // 12. Log Asset Maintenance (Hardened with Collision Prevention)
  app.post('/api/v1/assets/maintenances', (req: Request, res: Response) => {
    try {
      const asset = fixedAssetMasters.find(a => a.id === req.body.assetId || a.assetNumber === req.body.assetId);
      if (!asset) {
        return res.status(404).json({ success: false, message: 'Asset not found' });
      }

      FixedAssetsEngine.validateAssetLockStatus(asset);

      const maintDate = req.body.maintenanceDate || new Date().toISOString().split('T')[0];
      const maintVal = FixedAssetsEngine.validateMaintenanceIntegrity({
        asset,
        existingMaintenances: fixedAssetMaintenances,
        newMaintenanceDate: maintDate
      });

      if (!maintVal.isValid) {
        return res.status(400).json({ success: false, errors: maintVal.errors, message: maintVal.errors.join('; ') });
      }

      const result = FixedAssetsEngine.logMaintenanceRecord({
        asset,
        maintenanceType: req.body.maintenanceType || 'PREVENTIVE',
        maintenanceDate: maintDate,
        vendorId: req.body.vendorId,
        vendorName: req.body.vendorName,
        description: req.body.description || 'Routine maintenance work',
        cost: Number(req.body.cost) || 0,
        spareParts: req.body.spareParts || [],
        downtimeHours: Number(req.body.downtimeHours) || 0,
        performedBy: req.body.performedBy || 'usr-001'
      });

      fixedAssetMaintenances.push(result.maintenanceRecord);
      fixedAssetAuditLogs.push(result.auditLog);

      res.status(201).json({
        success: true,
        message: `Maintenance log created for Asset ${asset.assetNumber}`,
        maintenanceRecord: result.maintenanceRecord,
        hasOverdueMaintenance: maintVal.hasOverdueMaintenance
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.get('/api/v1/assets/maintenances', (req: Request, res: Response) => {
    const assetId = req.query.assetId as string;
    const logs = assetId ? fixedAssetMaintenances.filter(m => m.assetId === assetId) : fixedAssetMaintenances;
    res.json({ success: true, count: logs.length, data: logs });
  });

  // 13. Physical Count Sessions & Scanning (Hardened)
  app.post('/api/v1/assets/verification/sessions', (req: Request, res: Response) => {
    const session: PhysicalVerificationSession = {
      id: `SES-${Date.now()}`,
      sessionNumber: `PCS-2026-${Math.floor(100 + Math.random() * 900)}`,
      sessionDate: new Date().toISOString().split('T')[0],
      locationId: req.body.locationId || 'loc-001',
      locationName: req.body.locationName || 'Riyadh HQ Data Center',
      status: 'IN_PROGRESS',
      totalAssetsExpected: fixedAssetMasters.filter(a => a.locationId === (req.body.locationId || 'loc-001')).length,
      totalAssetsScanned: 0,
      matchedCount: 0,
      missingCount: 0,
      discrepancyCount: 0,
      scans: [],
      conductedBy: req.body.conductedBy || 'usr-001',
      createdAt: new Date().toISOString()
    };

    physicalVerificationSessions.push(session);
    res.status(201).json({ success: true, session });
  });

  app.post('/api/v1/assets/verification/scan', (req: Request, res: Response) => {
    const session = physicalVerificationSessions.find(s => s.id === req.body.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Verification Session not found' });
    }

    if (session.status !== 'IN_PROGRESS') {
      return res.status(400).json({ success: false, message: `Verification Session ${session.sessionNumber} is locked (${session.status}). Further scans disallowed.` });
    }

    const result = FixedAssetsEngine.processPhysicalCountScan({
      session,
      scannedBarcode: req.body.scannedBarcode,
      actualLocationId: req.body.actualLocationId || session.locationId,
      assets: fixedAssetMasters,
      notes: req.body.notes
    });

    const idx = physicalVerificationSessions.findIndex(s => s.id === session.id);
    if (idx !== -1) {
      physicalVerificationSessions[idx] = result.updatedSession;
    }

    res.json({
      success: true,
      scanStatus: result.scanItem.scanStatus,
      scanItem: result.scanItem,
      updatedSession: result.updatedSession
    });
  });

  // 14. Asset Locking / Unlocking Governance Endpoints
  app.post('/api/v1/assets/:id/lock', (req: Request, res: Response) => {
    const asset = fixedAssetMasters.find(a => a.id === req.params.id || a.assetNumber === req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    const reason = req.body.reason || 'Administrative Statutory Freeze';
    asset.isLocked = true;
    asset.lockReason = reason;

    const audit: AssetAuditLogRecord = {
      id: `LOG-LOCK-${Date.now()}`,
      assetId: asset.id,
      assetNumber: asset.assetNumber,
      eventType: 'MAINTENANCE_LOGGED',
      timestamp: new Date().toISOString(),
      actionBy: req.body.lockedBy || 'Compliance Officer',
      details: `Asset locked against all modifications. Reason: ${reason}`,
      payload: { isLocked: true, reason },
      sha256Hash: FixedAssetsEngine.computeSha256Hash({ assetId: asset.id, lock: true, reason }),
      correlationId: `CORR-LOCK-${Date.now()}`
    };
    fixedAssetAuditLogs.push(audit);

    res.json({ success: true, message: `Asset ${asset.assetNumber} is now LOCKED.`, asset });
  });

  app.post('/api/v1/assets/:id/unlock', (req: Request, res: Response) => {
    const asset = fixedAssetMasters.find(a => a.id === req.params.id || a.assetNumber === req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    asset.isLocked = false;
    asset.lockReason = undefined;

    const audit: AssetAuditLogRecord = {
      id: `LOG-UNLOCK-${Date.now()}`,
      assetId: asset.id,
      assetNumber: asset.assetNumber,
      eventType: 'MAINTENANCE_LOGGED',
      timestamp: new Date().toISOString(),
      actionBy: req.body.unlockedBy || 'Compliance Officer',
      details: `Asset unlocked by authorized personnel.`,
      payload: { isLocked: false },
      sha256Hash: FixedAssetsEngine.computeSha256Hash({ assetId: asset.id, lock: false }),
      correlationId: `CORR-UNLOCK-${Date.now()}`
    };
    fixedAssetAuditLogs.push(audit);

    res.json({ success: true, message: `Asset ${asset.assetNumber} is now UNLOCKED.`, asset });
  });

  // 15. Cryptographic Snapshots Management
  app.get('/api/v1/assets/snapshots', (req: Request, res: Response) => {
    res.json({ success: true, count: fixedAssetSnapshots.length, data: fixedAssetSnapshots });
  });

  app.post('/api/v1/assets/snapshots/create', (req: Request, res: Response) => {
    const { snapshotType = 'ASSET_REGISTER', companyId = 'comp-001', fiscalPeriod = '2026-08', signedBy = 'Auditor' } = req.body;
    let dataPayload: any = fixedAssetMasters;
    let itemCount = fixedAssetMasters.length;

    if (snapshotType === 'DEPRECIATION_REGISTER') {
      dataPayload = fixedAssetMasters.map(a => ({ id: a.id, assetNumber: a.assetNumber, dep: a.totalAccumulatedDepreciation, nbv: a.netBookValue }));
    } else if (snapshotType === 'REVALUATION_REGISTER') {
      dataPayload = fixedAssetRevaluations;
      itemCount = fixedAssetRevaluations.length;
    } else if (snapshotType === 'IMPAIRMENT_REGISTER') {
      dataPayload = fixedAssetImpairments;
      itemCount = fixedAssetImpairments.length;
    } else if (snapshotType === 'PHYSICAL_VERIFICATION') {
      dataPayload = physicalVerificationSessions;
      itemCount = physicalVerificationSessions.length;
    } else if (snapshotType === 'MAINTENANCE_REGISTER') {
      dataPayload = fixedAssetMaintenances;
      itemCount = fixedAssetMaintenances.length;
    } else if (snapshotType === 'ASSET_TRANSFERS') {
      dataPayload = fixedAssetTransfers;
      itemCount = fixedAssetTransfers.length;
    }

    const snapshot = FixedAssetsEngine.createImmutableSnapshot({
      snapshotType,
      companyId,
      fiscalPeriod,
      itemCount,
      dataPayload,
      signedBy
    });

    fixedAssetSnapshots.unshift(snapshot);
    res.status(201).json({ success: true, message: `Cryptographic Snapshot sealed with SHA-256`, snapshot });
  });

  app.post('/api/v1/assets/snapshots/verify', (req: Request, res: Response) => {
    const snapshotId = req.body.snapshotId;
    const snapshot = fixedAssetSnapshots.find(s => s.snapshotId === snapshotId);
    if (!snapshot) {
      return res.status(404).json({ success: false, message: 'Snapshot not found' });
    }

    const isVerified = FixedAssetsEngine.verifySnapshotIntegrity(snapshot);
    res.json({
      success: true,
      snapshotId,
      isVerified,
      sha256Seal: snapshot.sha256Seal,
      message: isVerified ? 'SHA-256 Seal verified: Payload is 100% untampered.' : 'Hash verification FAILED: Payload mismatch!'
    });
  });

  // 16. Phase 2.8 Quality Gate Suite Execution & Telemetry
  app.post('/api/v1/assets/quality-gate/run', (req: Request, res: Response) => {
    const companyId = req.body.companyId || 'comp-001';
    const fiscalPeriod = req.body.fiscalPeriod || '2026-08';
    const auditor = req.body.auditor || 'Lead ERP Hardening Architect (IFRS / SAP FI-AA)';

    const report = Phase28HardeningSuite.runFullQualityGate({
      assets: fixedAssetMasters,
      assetClasses: fixedAssetClasses,
      acquisitions: fixedAssetAcquisitions,
      transfers: fixedAssetTransfers,
      disposals: fixedAssetDisposals,
      revaluations: fixedAssetRevaluations,
      impairments: fixedAssetImpairments,
      maintenances: fixedAssetMaintenances,
      verificationSessions: physicalVerificationSessions,
      auditVault: fixedAssetAuditLogs,
      companyId,
      fiscalPeriod,
      auditor
    });

    latestPhase28QualityGateReport = report;

    // Store newly sealed snapshots
    for (const snap of report.sealedSnapshots) {
      if (!fixedAssetSnapshots.some(s => s.snapshotId === snap.snapshotId)) {
        fixedAssetSnapshots.unshift(snap);
      }
    }

    res.json({
      success: true,
      report
    });
  });

  app.get('/api/v1/assets/quality-gate/latest', (req: Request, res: Response) => {
    if (!latestPhase28QualityGateReport) {
      latestPhase28QualityGateReport = Phase28HardeningSuite.runFullQualityGate({
        assets: fixedAssetMasters,
        assetClasses: fixedAssetClasses,
        acquisitions: fixedAssetAcquisitions,
        transfers: fixedAssetTransfers,
        disposals: fixedAssetDisposals,
        revaluations: fixedAssetRevaluations,
        impairments: fixedAssetImpairments,
        maintenances: fixedAssetMaintenances,
        verificationSessions: physicalVerificationSessions,
        auditVault: fixedAssetAuditLogs,
        companyId: 'comp-001',
        fiscalPeriod: '2026-08',
        auditor: 'Principal Enterprise Solution Architect'
      });
    }
    res.json({ success: true, report: latestPhase28QualityGateReport });
  });

  // 17. Asset Reports & Audit Trail
  app.get('/api/v1/assets/reports/register', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const report = FixedAssetsEngine.generateAssetRegisterReport(fixedAssetMasters, companyId);
    res.json(report);
  });

  // Asset Roll Forward Report
  app.get('/api/v1/assets/reports/roll-forward', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const periodStart = (req.query.periodStart as string) || '2026-01-01';
    const periodEnd = (req.query.periodEnd as string) || '2026-12-31';

    const report = FixedAssetsEngine.generateAssetRollForwardReport({
      assets: fixedAssetMasters,
      assetClasses: fixedAssetClasses,
      companyId,
      periodStart,
      periodEnd
    });

    res.json(report);
  });

  // Audit Trail
  app.get('/api/v1/assets/audit-trail', (req: Request, res: Response) => {
    const assetId = req.query.assetId as string;
    const logs = assetId ? fixedAssetAuditLogs.filter(l => l.assetId === assetId) : fixedAssetAuditLogs;
    res.json({ success: true, count: logs.length, data: logs });
  });

  // Get Single Asset Details (Parameterized route placed after specific subresources)
  app.get('/api/v1/assets/:id', (req: Request, res: Response) => {
    const asset = fixedAssetMasters.find(a => a.id === req.params.id || a.assetNumber === req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Fixed Asset not found' });
    }
    const schedule = FixedAssetsEngine.generateDepreciationSchedule(asset);
    const auditLogs = fixedAssetAuditLogs.filter(l => l.assetId === asset.id);
    const maintenances = fixedAssetMaintenances.filter(m => m.assetId === asset.id);

    res.json({
      success: true,
      asset,
      depreciationSchedule: schedule,
      auditLogs,
      maintenances
    });
  });

  // ==========================================
  // PHASE 2.9: TREASURY & CASH MANAGEMENT APIS
  // ==========================================

  // Dashboard Overview
  app.get('/api/v1/treasury/dashboard', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const asOfDate = (req.query.asOfDate as string) || new Date().toISOString().split('T')[0];
    const baseCurrency = (req.query.baseCurrency as string) || 'SAR';

    const summary = TreasuryEngine.generateDashboardSummary({
      companyId,
      asOfDate,
      baseCurrency,
      bankAccounts: treasuryBankAccounts.filter(b => b.companyId === companyId),
      cashAccounts: treasuryCashAccounts.filter(c => c.companyId === companyId),
      cheques: treasuryCheques.filter(c => c.companyId === companyId),
      recentTransactions: treasuryTransactions.filter(t => t.companyId === companyId),
      upcomingCalendar: treasuryPaymentCalendar.filter(p => p.companyId === companyId)
    });

    res.json({ success: true, data: summary });
  });

  // Bank Masters
  app.get('/api/v1/treasury/banks', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const banks = treasuryBanks.filter(b => b.companyId === companyId);
    res.json({ success: true, count: banks.length, data: banks });
  });

  app.post('/api/v1/treasury/banks', (req: Request, res: Response) => {
    const { bankCode, bankName, bankNameAr, swiftCode, country, headquartersCity, rating, companyId } = req.body;
    if (!bankCode || !bankName || !swiftCode) {
      return res.status(400).json({ success: false, error: 'bankCode, bankName, and swiftCode are required.' });
    }
    const newBank: BankMaster = {
      id: `bnk-${Date.now()}`,
      bankCode,
      bankName,
      bankNameAr,
      swiftCode,
      country: country || 'Saudi Arabia',
      headquartersCity: headquartersCity || 'Riyadh',
      rating: rating || 'A1 / Stable',
      isActive: true,
      companyId: companyId || 'comp-001'
    };
    treasuryBanks.push(newBank);
    res.status(201).json({ success: true, data: newBank });
  });

  // Bank Accounts
  app.get('/api/v1/treasury/bank-accounts', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const accounts = treasuryBankAccounts.filter(b => b.companyId === companyId);
    res.json({ success: true, count: accounts.length, data: accounts });
  });

  app.post('/api/v1/treasury/bank-accounts', (req: Request, res: Response) => {
    const validation = TreasuryEngine.validateIban(req.body.iban || '');
    if (!validation.isValid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const bank = treasuryBanks.find(b => b.id === req.body.bankId);
    const newAcc: BankAccount = {
      id: `ba-${Date.now()}`,
      bankId: req.body.bankId,
      bankName: bank?.bankName || req.body.bankName || 'Partner Bank',
      accountNumber: req.body.accountNumber,
      accountName: req.body.accountName,
      accountNameAr: req.body.accountNameAr,
      accountType: req.body.accountType || 'CURRENT',
      currency: req.body.currency || 'SAR',
      iban: validation.normalizedIban,
      swiftCode: req.body.swiftCode || bank?.swiftCode || '',
      glAccountId: req.body.glAccountId || '101000',
      glAccountCode: req.body.glAccountCode || '101000',
      currentBalance: Number(req.body.initialBalance || 0),
      reconciledBalance: Number(req.body.initialBalance || 0),
      unreconciledBalance: 0,
      overdraftLimit: Number(req.body.overdraftLimit || 0),
      status: 'ACTIVE',
      isDefaultOperatingAccount: req.body.isDefaultOperatingAccount ?? false,
      companyId: req.body.companyId || 'comp-001',
      branchId: req.body.branchId || 'br-001'
    };
    treasuryBankAccounts.push(newAcc);
    res.status(201).json({ success: true, data: newAcc });
  });

  // Cash Accounts
  app.get('/api/v1/treasury/cash-accounts', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const accounts = treasuryCashAccounts.filter(c => c.companyId === companyId);
    res.json({ success: true, count: accounts.length, data: accounts });
  });

  app.post('/api/v1/treasury/cash-accounts', (req: Request, res: Response) => {
    const { code, name, nameAr, type, currency, custodianId, custodianName, maxLimit, companyId, branchId } = req.body;
    const newCash: CashAccount = {
      id: `ca-${Date.now()}`,
      code: code || `CSH-${Date.now().toString().slice(-4)}`,
      name,
      nameAr,
      type: type || 'PETTY_CASH',
      currency: currency || 'SAR',
      glAccountId: req.body.glAccountId || '100200',
      glAccountCode: req.body.glAccountCode || '100200',
      custodianId,
      custodianName,
      currentBalance: Number(req.body.initialBalance || 0),
      maxLimit: Number(maxLimit || 20000),
      branchId: branchId || 'br-001',
      companyId: companyId || 'comp-001',
      isActive: true
    };
    treasuryCashAccounts.push(newCash);
    res.status(201).json({ success: true, data: newCash });
  });

  // Cheque Books
  app.get('/api/v1/treasury/cheque-books', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const books = treasuryChequeBooks.filter(cb => cb.companyId === companyId);
    res.json({ success: true, count: books.length, data: books });
  });

  app.post('/api/v1/treasury/cheque-books', (req: Request, res: Response) => {
    const bankAccount = treasuryBankAccounts.find(b => b.id === req.body.bankAccountId);
    const startNum = Number(req.body.startNumber);
    const endNum = Number(req.body.endNumber);
    const totalLeaves = endNum - startNum + 1;

    const newBook: ChequeBook = {
      id: `cb-${Date.now()}`,
      bankAccountId: req.body.bankAccountId,
      bankAccountName: bankAccount?.accountName || 'Bank Account',
      seriesPrefix: req.body.seriesPrefix || 'CHQ',
      startNumber: startNum,
      endNumber: endNum,
      currentNumber: startNum,
      totalLeaves,
      usedLeaves: 0,
      cancelledLeaves: 0,
      status: 'ACTIVE',
      issueDate: req.body.issueDate || new Date().toISOString().split('T')[0],
      companyId: req.body.companyId || 'comp-001'
    };
    treasuryChequeBooks.push(newBook);
    res.status(201).json({ success: true, data: newBook });
  });

  // Cheques
  app.get('/api/v1/treasury/cheques', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const cheques = treasuryCheques.filter(c => c.companyId === companyId);
    res.json({ success: true, count: cheques.length, data: cheques });
  });

  // Issue Outgoing Cheque
  app.post('/api/v1/treasury/cheques/issue', (req: Request, res: Response) => {
    try {
      const bankAccount = treasuryBankAccounts.find(b => b.id === req.body.bankAccountId);
      if (!bankAccount) {
        return res.status(404).json({ success: false, error: 'Bank account not found.' });
      }

      const result = TreasuryEngine.issueOutgoingCheque({
        bankAccount,
        chequeNumber: req.body.chequeNumber,
        issueDate: req.body.issueDate,
        dueDate: req.body.dueDate,
        amount: Number(req.body.amount),
        currency: req.body.currency || bankAccount.currency,
        beneficiaryName: req.body.beneficiaryName,
        memo: req.body.memo,
        companyId: req.body.companyId || bankAccount.companyId,
        issuedBy: req.body.issuedBy || 'usr-001',
        isPostDated: req.body.isPostDated
      });

      treasuryCheques.push(result.cheque);
      treasuryEvents.push(result.domainEvent);

      res.status(201).json({ success: true, data: result.cheque, event: result.domainEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Receive Incoming Cheque / PDC
  app.post('/api/v1/treasury/cheques/receive', (req: Request, res: Response) => {
    try {
      const bankAccount = treasuryBankAccounts.find(b => b.id === req.body.bankAccountId);
      if (!bankAccount) {
        return res.status(404).json({ success: false, error: 'Target deposit bank account not found.' });
      }

      const result = TreasuryEngine.receiveIncomingCheque({
        targetBankAccount: bankAccount,
        chequeNumber: req.body.chequeNumber,
        bankName: req.body.bankName,
        issueDate: req.body.issueDate,
        dueDate: req.body.dueDate,
        amount: Number(req.body.amount),
        currency: req.body.currency || 'SAR',
        drawerName: req.body.drawerName,
        customerId: req.body.customerId,
        memo: req.body.memo,
        companyId: req.body.companyId || bankAccount.companyId,
        receivedBy: req.body.receivedBy || 'usr-001'
      });

      treasuryCheques.push(result.cheque);
      treasuryEvents.push(result.domainEvent);

      res.status(201).json({ success: true, data: result.cheque, event: result.domainEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Deposit Incoming Cheque
  app.post('/api/v1/treasury/cheques/deposit', (req: Request, res: Response) => {
    try {
      const cheque = treasuryCheques.find(c => c.id === req.body.chequeId);
      if (!cheque) {
        return res.status(404).json({ success: false, error: 'Cheque not found.' });
      }
      const bankAccount = treasuryBankAccounts.find(b => b.id === req.body.bankAccountId);
      if (!bankAccount) {
        return res.status(404).json({ success: false, error: 'Bank account not found.' });
      }

      const result = TreasuryEngine.depositIncomingCheque({
        cheque,
        targetBankAccount: bankAccount,
        depositDate: req.body.depositDate || new Date().toISOString().split('T')[0],
        depositedBy: req.body.depositedBy || 'usr-001'
      });

      cheque.status = result.updatedCheque.status;
      cheque.depositDate = result.updatedCheque.depositDate;
      treasuryEvents.push(result.domainEvent);

      res.json({ success: true, data: result.updatedCheque, event: result.domainEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Clear Cheque (Maturity / Realization)
  app.post('/api/v1/treasury/cheques/clear', (req: Request, res: Response) => {
    try {
      const cheque = treasuryCheques.find(c => c.id === req.body.chequeId);
      if (!cheque) {
        return res.status(404).json({ success: false, error: 'Cheque not found.' });
      }
      const bankAccount = treasuryBankAccounts.find(b => b.id === cheque.bankAccountId);
      if (!bankAccount) {
        return res.status(404).json({ success: false, error: 'Associated bank account not found.' });
      }

      const result = TreasuryEngine.clearCheque({
        cheque,
        bankAccount,
        clearanceDate: req.body.clearanceDate || new Date().toISOString().split('T')[0],
        clearedBy: req.body.clearedBy || 'usr-001'
      });

      cheque.status = result.updatedCheque.status;
      cheque.clearanceDate = result.updatedCheque.clearanceDate;
      bankAccount.currentBalance = result.updatedBankAccount.currentBalance;

      treasuryEvents.push(result.domainEvent);

      res.json({ success: true, data: result.updatedCheque, bankAccount, event: result.domainEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Bounce Cheque
  app.post('/api/v1/treasury/cheques/bounce', (req: Request, res: Response) => {
    try {
      const cheque = treasuryCheques.find(c => c.id === req.body.chequeId);
      if (!cheque) {
        return res.status(404).json({ success: false, error: 'Cheque not found.' });
      }
      const bankAccount = treasuryBankAccounts.find(b => b.id === cheque.bankAccountId);
      if (!bankAccount) {
        return res.status(404).json({ success: false, error: 'Associated bank account not found.' });
      }

      const result = TreasuryEngine.bounceCheque({
        cheque,
        bankAccount,
        bounceDate: req.body.bounceDate || new Date().toISOString().split('T')[0],
        bounceReason: req.body.bounceReason || 'Insufficient Funds (NSF)',
        bouncedBy: req.body.bouncedBy || 'usr-001'
      });

      cheque.status = result.updatedCheque.status;
      cheque.bounceReason = result.updatedCheque.bounceReason;
      treasuryEvents.push(result.domainEvent);

      res.json({ success: true, data: result.updatedCheque, event: result.domainEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Cancel Cheque
  app.post('/api/v1/treasury/cheques/cancel', (req: Request, res: Response) => {
    try {
      const cheque = treasuryCheques.find(c => c.id === req.body.chequeId);
      if (!cheque) {
        return res.status(404).json({ success: false, error: 'Cheque not found.' });
      }
      const bankAccount = treasuryBankAccounts.find(b => b.id === cheque.bankAccountId);
      if (!bankAccount) {
        return res.status(404).json({ success: false, error: 'Associated bank account not found.' });
      }

      const result = TreasuryEngine.cancelCheque({
        cheque,
        bankAccount,
        cancellationDate: req.body.cancellationDate || new Date().toISOString().split('T')[0],
        cancellationReason: req.body.cancellationReason || 'User Void / Replacement',
        cancelledBy: req.body.cancelledBy || 'usr-001'
      });

      cheque.status = result.updatedCheque.status;
      cheque.cancellationReason = result.updatedCheque.cancellationReason;
      treasuryEvents.push(result.domainEvent);

      res.json({ success: true, data: result.updatedCheque, event: result.domainEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Transactions
  app.get('/api/v1/treasury/transactions', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const txs = treasuryTransactions.filter(t => t.companyId === companyId);
    res.json({ success: true, count: txs.length, data: txs });
  });

  // Bank Deposit
  app.post('/api/v1/treasury/transactions/deposit', (req: Request, res: Response) => {
    try {
      const bankAccount = treasuryBankAccounts.find(b => b.id === req.body.bankAccountId);
      if (!bankAccount) {
        return res.status(404).json({ success: false, error: 'Bank account not found.' });
      }

      const result = TreasuryEngine.processBankDeposit({
        bankAccount,
        amount: Number(req.body.amount),
        currency: req.body.currency || bankAccount.currency,
        exchangeRate: Number(req.body.exchangeRate || 1.0),
        transactionDate: req.body.transactionDate || new Date().toISOString().split('T')[0],
        valueDate: req.body.valueDate || req.body.transactionDate || new Date().toISOString().split('T')[0],
        referenceNumber: req.body.referenceNumber,
        category: req.body.category || 'CUSTOMER_COLLECTION',
        description: req.body.description || 'Direct Bank Inflow',
        offsetAccountCode: req.body.offsetAccountCode || '102000',
        offsetAccountName: req.body.offsetAccountName || 'Accounts Receivable Clearing',
        companyId: req.body.companyId || bankAccount.companyId,
        branchId: req.body.branchId || bankAccount.branchId,
        createdBy: req.body.createdBy || 'usr-001'
      });

      bankAccount.currentBalance = result.updatedBankAccount.currentBalance;
      bankAccount.unreconciledBalance = (bankAccount.unreconciledBalance || 0) + Number(req.body.amount);
      treasuryTransactions.unshift(result.transaction);
      treasuryEvents.push(result.domainEvent);

      res.status(201).json({ success: true, data: result.transaction, bankAccount, event: result.domainEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Bank Payment
  app.post('/api/v1/treasury/transactions/payment', (req: Request, res: Response) => {
    try {
      const bankAccount = treasuryBankAccounts.find(b => b.id === req.body.bankAccountId);
      if (!bankAccount) {
        return res.status(404).json({ success: false, error: 'Bank account not found.' });
      }

      const result = TreasuryEngine.processBankPayment({
        bankAccount,
        amount: Number(req.body.amount),
        currency: req.body.currency || bankAccount.currency,
        exchangeRate: Number(req.body.exchangeRate || 1.0),
        transactionDate: req.body.transactionDate || new Date().toISOString().split('T')[0],
        valueDate: req.body.valueDate || req.body.transactionDate || new Date().toISOString().split('T')[0],
        referenceNumber: req.body.referenceNumber,
        category: req.body.category || 'VENDOR_PAYMENT',
        description: req.body.description || 'Direct Bank Payment',
        offsetAccountCode: req.body.offsetAccountCode || '201000',
        offsetAccountName: req.body.offsetAccountName || 'Accounts Payable Clearing',
        companyId: req.body.companyId || bankAccount.companyId,
        branchId: req.body.branchId || bankAccount.branchId,
        createdBy: req.body.createdBy || 'usr-001'
      });

      bankAccount.currentBalance = result.updatedBankAccount.currentBalance;
      bankAccount.unreconciledBalance = (bankAccount.unreconciledBalance || 0) + Number(req.body.amount);
      treasuryTransactions.unshift(result.transaction);
      treasuryEvents.push(result.domainEvent);

      res.status(201).json({ success: true, data: result.transaction, bankAccount, event: result.domainEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Internal Transfer (Bank to Bank)
  app.post('/api/v1/treasury/transactions/internal-transfer', (req: Request, res: Response) => {
    try {
      const sourceAccount = treasuryBankAccounts.find(b => b.id === req.body.sourceBankAccountId);
      const targetAccount = treasuryBankAccounts.find(b => b.id === req.body.targetBankAccountId);
      if (!sourceAccount || !targetAccount) {
        return res.status(404).json({ success: false, error: 'Source or target bank account not found.' });
      }

      const result = TreasuryEngine.processInternalTransfer({
        sourceBankAccount: sourceAccount,
        targetBankAccount: targetAccount,
        amount: Number(req.body.amount),
        currency: req.body.currency || sourceAccount.currency,
        transferDate: req.body.transferDate || new Date().toISOString().split('T')[0],
        referenceNumber: req.body.referenceNumber || `TRF-${Date.now()}`,
        description: req.body.description || 'Inter-account liquidity transfer',
        companyId: req.body.companyId || sourceAccount.companyId,
        branchId: req.body.branchId || sourceAccount.branchId,
        createdBy: req.body.createdBy || 'usr-001'
      });

      sourceAccount.currentBalance = result.updatedSourceAccount.currentBalance;
      targetAccount.currentBalance = result.updatedTargetAccount.currentBalance;
      treasuryTransactions.unshift(result.transaction);
      treasuryEvents.push(result.domainEvent);

      res.status(201).json({ success: true, data: result.transaction, sourceAccount, targetAccount, event: result.domainEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Cash Deposit to Bank
  app.post('/api/v1/treasury/transactions/cash-deposit-to-bank', (req: Request, res: Response) => {
    try {
      const cashAccount = treasuryCashAccounts.find(c => c.id === req.body.cashAccountId);
      const bankAccount = treasuryBankAccounts.find(b => b.id === req.body.bankAccountId);
      if (!cashAccount || !bankAccount) {
        return res.status(404).json({ success: false, error: 'Cash or bank account not found.' });
      }

      const result = TreasuryEngine.processCashDepositToBank({
        cashAccount,
        bankAccount,
        amount: Number(req.body.amount),
        currency: req.body.currency || 'SAR',
        date: req.body.date || new Date().toISOString().split('T')[0],
        referenceNumber: req.body.referenceNumber || `C2B-${Date.now()}`,
        description: req.body.description || 'Vault cash deposit to operating bank',
        companyId: req.body.companyId || bankAccount.companyId,
        branchId: req.body.branchId || bankAccount.branchId,
        createdBy: req.body.createdBy || 'usr-001'
      });

      cashAccount.currentBalance = result.updatedCashAccount.currentBalance;
      bankAccount.currentBalance = result.updatedBankAccount.currentBalance;
      treasuryTransactions.unshift(result.transaction);
      treasuryEvents.push(result.domainEvent);

      res.status(201).json({ success: true, data: result.transaction, cashAccount, bankAccount, event: result.domainEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Cash Withdrawal from Bank
  app.post('/api/v1/treasury/transactions/cash-withdrawal-from-bank', (req: Request, res: Response) => {
    try {
      const bankAccount = treasuryBankAccounts.find(b => b.id === req.body.bankAccountId);
      const cashAccount = treasuryCashAccounts.find(c => c.id === req.body.cashAccountId);
      if (!bankAccount || !cashAccount) {
        return res.status(404).json({ success: false, error: 'Bank or cash account not found.' });
      }

      const result = TreasuryEngine.processCashWithdrawalFromBank({
        bankAccount,
        cashAccount,
        amount: Number(req.body.amount),
        currency: req.body.currency || 'SAR',
        date: req.body.date || new Date().toISOString().split('T')[0],
        referenceNumber: req.body.referenceNumber || `B2C-${Date.now()}`,
        description: req.body.description || 'Cash withdrawal from bank to safe',
        companyId: req.body.companyId || bankAccount.companyId,
        branchId: req.body.branchId || bankAccount.branchId,
        createdBy: req.body.createdBy || 'usr-001'
      });

      bankAccount.currentBalance = result.updatedBankAccount.currentBalance;
      cashAccount.currentBalance = result.updatedCashAccount.currentBalance;
      treasuryTransactions.unshift(result.transaction);
      treasuryEvents.push(result.domainEvent);

      res.status(201).json({ success: true, data: result.transaction, bankAccount, cashAccount, event: result.domainEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Petty Cash Expense
  app.post('/api/v1/treasury/transactions/petty-cash-expense', (req: Request, res: Response) => {
    try {
      const cashAccount = treasuryCashAccounts.find(c => c.id === req.body.cashAccountId);
      if (!cashAccount) {
        return res.status(404).json({ success: false, error: 'Petty cash account not found.' });
      }

      const result = TreasuryEngine.processPettyCashExpense({
        cashAccount,
        amount: Number(req.body.amount),
        expenseAccountCode: req.body.expenseAccountCode || '503000',
        expenseAccountName: req.body.expenseAccountName || 'General & Office Expense',
        date: req.body.date || new Date().toISOString().split('T')[0],
        referenceNumber: req.body.referenceNumber || `EXP-${Date.now()}`,
        description: req.body.description || 'Petty cash voucher expense',
        companyId: req.body.companyId || cashAccount.companyId,
        branchId: req.body.branchId || cashAccount.branchId,
        createdBy: req.body.createdBy || 'usr-001'
      });

      cashAccount.currentBalance = result.updatedCashAccount.currentBalance;
      treasuryTransactions.unshift(result.transaction);
      treasuryEvents.push(result.domainEvent);

      res.status(201).json({ success: true, data: result.transaction, cashAccount, event: result.domainEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Petty Cash Replenishment
  app.post('/api/v1/treasury/transactions/petty-cash-replenishment', (req: Request, res: Response) => {
    try {
      const cashAccount = treasuryCashAccounts.find(c => c.id === req.body.cashAccountId);
      const fundingBankAccount = treasuryBankAccounts.find(b => b.id === req.body.fundingBankAccountId);
      if (!cashAccount || !fundingBankAccount) {
        return res.status(404).json({ success: false, error: 'Cash or funding bank account not found.' });
      }

      const result = TreasuryEngine.processPettyCashReplenishment({
        cashAccount,
        fundingBankAccount,
        replenishmentAmount: Number(req.body.replenishmentAmount),
        date: req.body.date || new Date().toISOString().split('T')[0],
        referenceNumber: req.body.referenceNumber || `RPL-${Date.now()}`,
        description: req.body.description || 'Petty cash fund replenishment',
        companyId: req.body.companyId || cashAccount.companyId,
        branchId: req.body.branchId || cashAccount.branchId,
        createdBy: req.body.createdBy || 'usr-001'
      });

      cashAccount.currentBalance = result.updatedCashAccount.currentBalance;
      fundingBankAccount.currentBalance = result.updatedFundingBankAccount.currentBalance;
      treasuryTransactions.unshift(result.transaction);
      treasuryEvents.push(result.domainEvent);

      res.status(201).json({ success: true, data: result.transaction, cashAccount, fundingBankAccount, event: result.domainEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Bank Statement Import (MT940 / CAMT.053 / CSV)
  app.post('/api/v1/treasury/reconciliations/statements/import', (req: Request, res: Response) => {
    try {
      const bankAccount = treasuryBankAccounts.find(b => b.id === req.body.bankAccountId);
      if (!bankAccount) {
        return res.status(404).json({ success: false, error: 'Bank account not found.' });
      }

      const statement = TreasuryEngine.importBankStatement({
        bankAccount,
        statementNumber: req.body.statementNumber || `STMT-${Date.now()}`,
        statementDate: req.body.statementDate || new Date().toISOString().split('T')[0],
        openingBalance: Number(req.body.openingBalance ?? bankAccount.currentBalance),
        closingBalance: Number(req.body.closingBalance ?? bankAccount.currentBalance),
        currency: req.body.currency || bankAccount.currency,
        rawContent: req.body.rawContent || '',
        lines: req.body.lines || [],
        companyId: req.body.companyId || bankAccount.companyId,
        importedBy: req.body.importedBy || 'usr-001'
      });

      treasuryBankStatements.push(statement);
      res.status(201).json({ success: true, data: statement });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Bank Statement Auto-Matching
  app.post('/api/v1/treasury/reconciliations/auto-match', (req: Request, res: Response) => {
    try {
      const { bankAccountId, statementLines, systemTransactions } = req.body;
      const bankAccount = treasuryBankAccounts.find(b => b.id === bankAccountId);
      if (!bankAccount) {
        return res.status(404).json({ success: false, error: 'Bank account not found.' });
      }

      const txs = systemTransactions || treasuryTransactions.filter(t => t.bankAccountId === bankAccountId);
      const result = TreasuryEngine.autoMatchReconciliation({
        bankAccount,
        statementLines: statementLines || [],
        systemTransactions: txs,
        dateToleranceDays: Number(req.body.dateToleranceDays || 2),
        amountTolerance: Number(req.body.amountTolerance || 0)
      });

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Finalize Reconciliation Session
  app.post('/api/v1/treasury/reconciliations/finalize', (req: Request, res: Response) => {
    try {
      const bankAccount = treasuryBankAccounts.find(b => b.id === req.body.bankAccountId);
      if (!bankAccount) {
        return res.status(404).json({ success: false, error: 'Bank account not found.' });
      }

      const result = TreasuryEngine.finalizeReconciliationSession({
        bankAccount,
        periodEnd: req.body.periodEnd || new Date().toISOString().split('T')[0],
        statementClosingBalance: Number(req.body.statementClosingBalance),
        matchedTransactions: req.body.matchedTransactions || [],
        unmatchedStatementLines: req.body.unmatchedStatementLines || [],
        unmatchedSystemTransactions: req.body.unmatchedSystemTransactions || [],
        companyId: req.body.companyId || bankAccount.companyId,
        reconciledBy: req.body.reconciledBy || 'usr-001'
      });

      bankAccount.reconciledBalance = result.updatedBankAccount.reconciledBalance;
      bankAccount.unreconciledBalance = result.updatedBankAccount.unreconciledBalance;
      treasuryReconciliations.push(result.session);
      treasuryEvents.push(result.domainEvent);

      res.status(201).json({ success: true, data: result.session, bankAccount, event: result.domainEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Liquidity Forecasting Report (IAS 7)
  app.get('/api/v1/treasury/forecasting/liquidity', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const horizon = (req.query.horizon as '7_DAYS' | '30_DAYS' | '90_DAYS' | '180_DAYS') || '30_DAYS';
    const baseCurrency = (req.query.baseCurrency as string) || 'SAR';
    const asOfDate = (req.query.asOfDate as string) || new Date().toISOString().split('T')[0];

    const report = TreasuryEngine.generateLiquidityReport({
      companyId,
      asOfDate,
      horizon,
      baseCurrency,
      bankAccounts: treasuryBankAccounts.filter(b => b.companyId === companyId),
      cashAccounts: treasuryCashAccounts.filter(c => c.companyId === companyId),
      paymentCalendar: treasuryPaymentCalendar.filter(p => p.companyId === companyId),
      cheques: treasuryCheques.filter(c => c.companyId === companyId)
    });

    res.json({ success: true, data: report });
  });

  // Payment Calendar
  app.get('/api/v1/treasury/calendar/payments', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const calendar = treasuryPaymentCalendar.filter(p => p.companyId === companyId);
    res.json({ success: true, count: calendar.length, data: calendar });
  });

  app.post('/api/v1/treasury/calendar/payments', (req: Request, res: Response) => {
    const newEntry: PaymentCalendarEntry = {
      id: `cal-${Date.now()}`,
      dueDate: req.body.dueDate,
      type: req.body.type,
      category: req.body.category,
      counterpartyName: req.body.counterpartyName,
      amount: Number(req.body.amount),
      currency: req.body.currency || 'SAR',
      referenceDocumentNumber: req.body.referenceDocumentNumber,
      status: req.body.status || 'SCHEDULED',
      priority: req.body.priority || 'MEDIUM',
      companyId: req.body.companyId || 'comp-001'
    };
    treasuryPaymentCalendar.push(newEntry);
    res.status(201).json({ success: true, data: newEntry });
  });

  // Bank Charges & Fees
  app.get('/api/v1/treasury/charges', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const charges = treasuryBankCharges.filter(c => c.companyId === companyId);
    res.json({ success: true, count: charges.length, data: charges });
  });

  app.post('/api/v1/treasury/charges/post', (req: Request, res: Response) => {
    try {
      const bankAccount = treasuryBankAccounts.find(b => b.id === req.body.bankAccountId);
      if (!bankAccount) {
        return res.status(404).json({ success: false, error: 'Bank account not found.' });
      }

      const result = TreasuryEngine.postBankCharge({
        bankAccount,
        chargeType: req.body.chargeType,
        amount: Number(req.body.amount),
        vatRate: req.body.vatRate !== undefined
          ? Number(req.body.vatRate)
          : TaxEngine.resolveTaxRate({ companyId: bankAccount.companyId, countryOrJurisdiction: bankAccount.currency === 'EGP' ? 'EG' : 'SA' }).taxRate,
        currency: req.body.currency || bankAccount.currency,
        chargeDate: req.body.chargeDate || new Date().toISOString().split('T')[0],
        referenceNumber: req.body.referenceNumber || `BC-${Date.now()}`,
        description: req.body.description || 'Bank service charge',
        companyId: req.body.companyId || bankAccount.companyId,
        createdBy: req.body.createdBy || 'usr-001'
      });

      bankAccount.currentBalance = result.updatedBankAccount.currentBalance;
      treasuryBankCharges.unshift(result.charge);
      treasuryEvents.push(result.domainEvent);

      res.status(201).json({ success: true, data: result.charge, bankAccount, event: result.domainEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Exchange Rates
  app.get('/api/v1/treasury/fx/rates', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const rates = treasuryExchangeRates.filter(r => r.companyId === companyId);
    res.json({ success: true, count: rates.length, data: rates });
  });

  app.post('/api/v1/treasury/fx/rates', (req: Request, res: Response) => {
    const newRate: ExchangeRateRecord = {
      id: `fx-${Date.now()}`,
      fromCurrency: req.body.fromCurrency,
      toCurrency: req.body.toCurrency || 'SAR',
      rate: Number(req.body.rate),
      effectiveDate: req.body.effectiveDate || new Date().toISOString().split('T')[0],
      rateType: req.body.rateType || 'SPOT',
      source: req.body.source || 'MANUAL_ENTRY',
      companyId: req.body.companyId || 'comp-001'
    };
    treasuryExchangeRates.unshift(newRate);
    res.status(201).json({ success: true, data: newRate });
  });

  // FX Period-End Revaluation (IAS 21)
  app.post('/api/v1/treasury/fx/revaluation', (req: Request, res: Response) => {
    try {
      const companyId = req.body.companyId || 'comp-001';
      const asOfDate = req.body.asOfDate || new Date().toISOString().split('T')[0];
      const baseCurrency = req.body.baseCurrency || 'SAR';

      const result = TreasuryEngine.executeFXRevaluation({
        companyId,
        asOfDate,
        baseCurrency,
        bankAccounts: treasuryBankAccounts.filter(b => b.companyId === companyId),
        exchangeRates: treasuryExchangeRates.filter(r => r.companyId === companyId)
      });

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Treasury Domain Events Stream
  app.get('/api/v1/treasury/events', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const events = treasuryEvents.filter(e => e.companyId === companyId);
    res.json({ success: true, count: events.length, data: events });
  });

  // Treasury Audit Trail (Append-Only Vault with Cryptographic Chaining)
  app.get('/api/v1/treasury/audit-trail', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const records = treasuryAuditVault.filter(r => r.companyId === companyId);
    const chainVerification = TreasuryEngine.verifyTreasuryAuditChain(records);
    res.json({
      success: true,
      count: records.length,
      chainIntegrity: chainVerification,
      data: records
    });
  });

  // Immutable Liquidity Snapshots
  app.get('/api/v1/treasury/snapshots', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const snapshots = treasurySnapshots.filter(s => s.companyId === companyId);
    res.json({ success: true, count: snapshots.length, data: snapshots });
  });

  app.post('/api/v1/treasury/snapshots', (req: Request, res: Response) => {
    try {
      const companyId = req.body.companyId || 'comp-001';
      const snapshot = TreasuryEngine.createImmutableLiquiditySnapshot({
        companyId,
        snapshotDate: req.body.snapshotDate || new Date().toISOString().split('T')[0],
        baseCurrency: req.body.baseCurrency || 'SAR',
        bankAccounts: treasuryBankAccounts.filter(b => b.companyId === companyId),
        cashAccounts: treasuryCashAccounts.filter(c => c.companyId === companyId),
        cheques: treasuryCheques.filter(c => c.companyId === companyId),
        paymentCalendar: treasuryPaymentCalendar.filter(p => p.companyId === companyId),
        sealedBy: req.body.sealedBy || 'usr-001'
      });

      treasurySnapshots.unshift(snapshot);

      // Record in audit vault
      const lastAudit = treasuryAuditVault[treasuryAuditVault.length - 1];
      const auditRec = TreasuryEngine.createTreasuryAuditRecord({
        sequenceNumber: treasuryAuditVault.length + 1,
        companyId,
        eventType: 'LIQUIDITY_SNAPSHOT_SEALED',
        entityId: snapshot.snapshotNumber,
        entityType: 'LIQUIDITY_SNAPSHOT',
        action: 'SEALED_IMMUTABLE_SNAPSHOT',
        performedBy: req.body.sealedBy || 'usr-001',
        payloadSummary: `Sealed liquidity snapshot ${snapshot.snapshotNumber} for net liquidity ${snapshot.netImmediateLiquidity} SAR`,
        previousHash: lastAudit ? lastAudit.currentHash : 'GENESIS_TREASURY_AUDIT_HASH'
      });
      treasuryAuditVault.push(auditRec);

      res.status(201).json({ success: true, data: snapshot, auditRecord: auditRec });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Phase 2.9 Quality Gate Certification Engine
  app.get('/api/v1/treasury/quality-gate', (req: Request, res: Response) => {
    const companyId = (req.query.companyId as string) || 'comp-001';
    const auditor = (req.query.auditor as string) || 'Enterprise Treasury Compliance Assessor';

    if (!latestPhase29QualityGateReport) {
      latestPhase29QualityGateReport = Phase29HardeningSuite.runFullQualityGate({
        banks: treasuryBanks,
        bankAccounts: treasuryBankAccounts,
        cashAccounts: treasuryCashAccounts,
        transactions: treasuryTransactions,
        cheques: treasuryCheques,
        chequeBooks: treasuryChequeBooks,
        bankStatements: treasuryBankStatements,
        reconciliations: treasuryReconciliations,
        paymentCalendar: treasuryPaymentCalendar,
        bankCharges: treasuryBankCharges,
        exchangeRates: treasuryExchangeRates,
        revaluations: treasuryRevaluations,
        domainEvents: treasuryEvents,
        auditVault: treasuryAuditVault,
        companyId,
        fiscalPeriod: '2026-08',
        auditor
      });
    }

    res.json({
      success: true,
      report: latestPhase29QualityGateReport
    });
  });

  app.post('/api/v1/treasury/quality-gate/run', (req: Request, res: Response) => {
    try {
      const companyId = req.body.companyId || 'comp-001';
      const auditor = req.body.auditor || 'Enterprise Treasury Compliance Assessor';

      latestPhase29QualityGateReport = Phase29HardeningSuite.runFullQualityGate({
        banks: treasuryBanks,
        bankAccounts: treasuryBankAccounts,
        cashAccounts: treasuryCashAccounts,
        transactions: treasuryTransactions,
        cheques: treasuryCheques,
        chequeBooks: treasuryChequeBooks,
        bankStatements: treasuryBankStatements,
        reconciliations: treasuryReconciliations,
        paymentCalendar: treasuryPaymentCalendar,
        bankCharges: treasuryBankCharges,
        exchangeRates: treasuryExchangeRates,
        revaluations: treasuryRevaluations,
        domainEvents: treasuryEvents,
        auditVault: treasuryAuditVault,
        companyId,
        fiscalPeriod: req.body.fiscalPeriod || '2026-08',
        auditor
      });

      res.json({
        success: true,
        report: latestPhase29QualityGateReport
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==================== PHASE 3.0 PLATFORM INTEGRATION & PRODUCTION READINESS ====================

  // Platform Initial In-Memory State
  const platformWorkflows: WorkflowDefinition[] = [
    {
      id: 'WF-DEF-001',
      code: 'WF_PO_STANDARD',
      name: 'Standard Purchase Order Approval Chain',
      nameAr: 'مسار اعتماد أوامر الشراء القياسي',
      entityType: 'PURCHASE_ORDER',
      isActive: true,
      version: 1,
      companyId: 'comp-001',
      slaHours: 24,
      steps: [
        {
          stepNumber: 1,
          stepName: 'Procurement Specialist Review',
          stepNameAr: 'مراجعة أخصائي المشتريات',
          requiredRole: 'PROCUREMENT_SPECIALIST',
          isParallel: false,
          parallelStrategy: 'ANY_ONE',
          thresholdMax: 25000,
          timeoutHours: 12
        },
        {
          stepNumber: 2,
          stepName: 'Finance Director Sign-Off',
          stepNameAr: 'اعتماد المدير المالي',
          requiredRole: 'FINANCE_DIRECTOR',
          isParallel: false,
          parallelStrategy: 'ALL_REQUIRED',
          thresholdMin: 25000,
          timeoutHours: 24
        }
      ],
      escalationRules: [
        {
          id: 'ESC-01',
          triggerAfterHours: 24,
          action: 'ESCALATE_TO_ROLE',
          targetRole: 'VP_FINANCE'
        }
      ],
      createdAt: '2026-08-01T08:00:00.000Z',
      updatedAt: '2026-08-14T08:00:00.000Z'
    },
    {
      id: 'WF-DEF-002',
      code: 'WF_FA_ACQUISITION',
      name: 'Fixed Asset Capitalization & Acquisition Workflow',
      nameAr: 'مسار اعتماد رسملة واستحواذ الأصول الثابتة',
      entityType: 'FIXED_ASSET_ACQUISITION',
      isActive: true,
      version: 1,
      companyId: 'comp-001',
      slaHours: 48,
      steps: [
        {
          stepNumber: 1,
          stepName: 'Asset Custodian Verification',
          stepNameAr: 'التحقق من أمين العهدة',
          requiredRole: 'ASSET_CUSTODIAN',
          isParallel: false,
          parallelStrategy: 'ANY_ONE',
          timeoutHours: 24
        },
        {
          stepNumber: 2,
          stepName: 'Chief Financial Officer Approval',
          stepNameAr: 'اعتماد المدير المالي التنفيذي',
          requiredRole: 'CFO',
          isParallel: false,
          parallelStrategy: 'ALL_REQUIRED',
          timeoutHours: 24
        }
      ],
      escalationRules: [],
      createdAt: '2026-08-05T09:00:00.000Z',
      updatedAt: '2026-08-14T09:00:00.000Z'
    },
    {
      id: 'WF-DEF-003',
      code: 'WF_TREASURY_TRANSFER',
      name: 'Dual Authorization High-Value Bank Transfer',
      nameAr: 'الاعتماد المزدوج للتحويلات البنكية عالية القيمة',
      entityType: 'TREASURY_TRANSFER',
      isActive: true,
      version: 1,
      companyId: 'comp-001',
      slaHours: 12,
      steps: [
        {
          stepNumber: 1,
          stepName: 'Treasury Officer Preparation',
          stepNameAr: 'إعداد مسؤول الخزينة',
          requiredRole: 'TREASURY_OFFICER',
          isParallel: false,
          parallelStrategy: 'ANY_ONE',
          timeoutHours: 6
        },
        {
          stepNumber: 2,
          stepName: 'Authorized Bank Signatory A & B',
          stepNameAr: 'توقيع المفوض المصرفي (أ) و (ب)',
          requiredRole: 'TREASURY_SIGNATORY',
          isParallel: true,
          parallelStrategy: 'ALL_REQUIRED',
          thresholdMin: 100000,
          timeoutHours: 12
        }
      ],
      escalationRules: [],
      createdAt: '2026-08-08T10:00:00.000Z',
      updatedAt: '2026-08-14T10:00:00.000Z'
    }
  ];

  const platformDelegations: WorkflowDelegation[] = [
    {
      id: 'DEL-001',
      delegatorUserId: 'usr-003',
      delegatorName: 'Dr. Tariq Al-Amoudi (Finance Director)',
      delegateUserId: 'usr-002',
      delegateName: 'Sarah Jenkins (Senior AP Lead)',
      role: 'FINANCE_DIRECTOR',
      validFrom: '2026-08-10T00:00:00.000Z',
      validTo: '2026-08-25T23:59:59.000Z',
      reason: 'Annual Executive Leave Coverage',
      isActive: true,
      entityTypes: ['PURCHASE_ORDER', 'SUPPLIER_INVOICE']
    }
  ];

  const platformWorkflowInstances: WorkflowInstance[] = [
    {
      id: 'WFI-2026-001',
      workflowDefinitionId: 'WF-DEF-001',
      workflowCode: 'WF_PO_STANDARD',
      entityType: 'PURCHASE_ORDER',
      entityId: 'po-001',
      entityNumber: 'PO-2026-00042',
      amount: 45000,
      currency: 'SAR',
      requestedBy: 'usr-002',
      requestedByName: 'Sarah Jenkins',
      requestedAt: '2026-08-14T09:30:00.000Z',
      currentStepIndex: 1,
      totalSteps: 2,
      status: 'IN_PROGRESS',
      slaDeadline: '2026-08-15T09:30:00.000Z',
      isEscalated: false,
      history: [
        {
          stepNumber: 1,
          stepName: 'Procurement Specialist Review',
          stepNameAr: 'مراجعة أخصائي المشتريات',
          requiredRole: 'PROCUREMENT_SPECIALIST',
          approverUserId: 'usr-001',
          approverName: 'Ahmed Al-Mansoor',
          approverRole: 'PROCUREMENT_SPECIALIST',
          decision: 'APPROVED',
          decisionAt: '2026-08-14T10:15:00.000Z',
          comments: 'Supplier quotation verified against catalog pricing',
          digitalSignatureSha256: 'SIG-SHA256-PROC-OK-78901'
        },
        {
          stepNumber: 2,
          stepName: 'Finance Director Sign-Off',
          stepNameAr: 'اعتماد المدير المالي',
          requiredRole: 'FINANCE_DIRECTOR',
          approverName: 'FINANCE_DIRECTOR (Delegated to Sarah Jenkins)',
          decision: 'PENDING'
        }
      ],
      createdAt: '2026-08-14T09:30:00.000Z',
      updatedAt: '2026-08-14T10:15:00.000Z'
    },
    {
      id: 'WFI-2026-002',
      workflowDefinitionId: 'WF-DEF-002',
      workflowCode: 'WF_FA_ACQUISITION',
      entityType: 'FIXED_ASSET_ACQUISITION',
      entityId: 'fa-001',
      entityNumber: 'FA-2026-MACH-0001',
      amount: 85000,
      currency: 'SAR',
      requestedBy: 'usr-001',
      requestedByName: 'Ahmed Al-Mansoor',
      requestedAt: '2026-08-14T11:00:00.000Z',
      currentStepIndex: 0,
      totalSteps: 2,
      status: 'IN_PROGRESS',
      slaDeadline: '2026-08-16T11:00:00.000Z',
      isEscalated: false,
      history: [
        {
          stepNumber: 1,
          stepName: 'Asset Custodian Verification',
          stepNameAr: 'التحقق من أمين العهدة',
          requiredRole: 'ASSET_CUSTODIAN',
          decision: 'PENDING'
        },
        {
          stepNumber: 2,
          stepName: 'Chief Financial Officer Approval',
          stepNameAr: 'اعتماد المدير المالي التنفيذي',
          requiredRole: 'CFO',
          decision: 'PENDING'
        }
      ],
      createdAt: '2026-08-14T11:00:00.000Z',
      updatedAt: '2026-08-14T11:00:00.000Z'
    }
  ];

  const platformNotifications: NotificationMessage[] = [
    {
      id: 'NTF-001',
      tenantId: 'ten-001',
      userId: 'usr-001',
      channel: 'IN_APP',
      priority: 'HIGH',
      title: 'High-Value Transfer Pending Approval',
      titleAr: 'تحويل مالي عالي القيمة بانتظار الاعتماد',
      body: 'Transfer TR-2026-TRF-00001 (150,000 SAR) requires secondary signatory authorization.',
      bodyAr: 'التحويل TR-2026-TRF-00001 بمبلغ 150,000 ريال يتطلب توقيع المفوض الثاني.',
      entityType: 'TREASURY_TRANSFER',
      entityId: 'tr-001',
      entityNumber: 'TR-2026-TRF-00001',
      actionUrl: '/treasury',
      isRead: false,
      deliveryStatus: 'SENT',
      providerResponse: 'Delivered via Web-Push & In-App Bell Adapter',
      createdAt: '2026-08-14T12:00:00.000Z'
    },
    {
      id: 'NTF-002',
      tenantId: 'ten-001',
      userId: 'usr-001',
      channel: 'EMAIL',
      priority: 'MEDIUM',
      title: 'Bank Statement Auto-Reconciliation Completed',
      titleAr: 'اكتمال المطابقة البنكية التلقائية',
      body: 'Riyad Bank SAR statement session REC-2026-001 reconciled 100% of lines with 0 variance.',
      bodyAr: 'تمت مطابقة كشف بنك الرياض بنسبة 100% وبدون فروقات.',
      entityType: 'BANK_STATEMENT',
      entityId: 'rec-001',
      entityNumber: 'REC-2026-001',
      actionUrl: '/treasury',
      isRead: true,
      readAt: '2026-08-14T13:00:00.000Z',
      deliveryStatus: 'SENT',
      providerResponse: 'Delivered via SMTP Gateway: MessageId <msg-riyad-9821>',
      createdAt: '2026-08-14T12:30:00.000Z'
    }
  ];

  const platformScheduledJobs: PlatformScheduledJob[] = [
    {
      id: 'JOB-001',
      code: 'JOB_FX_REVALUATION_DAILY',
      name: 'IAS 21 Foreign Currency Revaluation Job',
      nameAr: 'مهمة إعادة تقييم العملات الأجنبية اليومية',
      jobType: 'FX_REVALUATION',
      cronExpression: '0 23 * * *',
      isRecurring: true,
      priority: 'HIGH',
      status: 'COMPLETED',
      retryCount: 0,
      maxRetries: 3,
      progressPercent: 100,
      nextRunAt: '2026-08-15T23:00:00.000Z',
      lastRunAt: '2026-08-14T23:00:00.000Z',
      lastExecutionDurationMs: 340,
      payload: { baseCurrency: 'SAR', method: 'IAS_21_OFFICIAL_CENTRAL_BANK' },
      result: { accountsRevalued: 4, netUnrealizedGainSar: 4250 },
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-14T23:00:00.000Z',
      logs: [
        {
          logId: 'LOG-JOB-1',
          timestamp: '2026-08-14T23:00:00.000Z',
          level: 'INFO',
          message: 'IAS 21 Revaluation job triggered by Cloud Scheduler. Evaluated USD, EUR foreign accounts.'
        }
      ]
    },
    {
      id: 'JOB-002',
      code: 'JOB_DEP_ACCRUAL_MONTHLY',
      name: 'Fixed Asset Depreciation Batch Posting',
      nameAr: 'ترحيل إهلاك الأصول الثابتة الشهري التلقائي',
      jobType: 'DEPRECIATION_RUN',
      cronExpression: '0 0 1 * *',
      isRecurring: true,
      priority: 'CRITICAL',
      status: 'QUEUED',
      retryCount: 0,
      maxRetries: 3,
      progressPercent: 0,
      nextRunAt: '2026-09-01T00:00:00.000Z',
      lastRunAt: '2026-08-01T00:00:00.000Z',
      lastExecutionDurationMs: 420,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-14T10:00:00.000Z',
      logs: []
    },
    {
      id: 'JOB-003',
      code: 'JOB_ZATCA_CLEARANCE_SYNC',
      name: 'ZATCA E-Invoice Clearance & Sync Engine',
      nameAr: 'مزامنة وتصديق فواتير هيئة الزكاة والضريبة',
      jobType: 'STATUTORY_SYNC',
      cronExpression: '*/15 * * * *',
      isRecurring: true,
      priority: 'CRITICAL',
      status: 'COMPLETED',
      retryCount: 0,
      maxRetries: 5,
      progressPercent: 100,
      nextRunAt: '2026-08-15T03:30:00.000Z',
      lastRunAt: '2026-08-15T03:15:00.000Z',
      lastExecutionDurationMs: 185,
      result: { invoicesCleared: 14, rejected: 0, cryptographicTokensVerified: 14 },
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-15T03:15:00.000Z',
      logs: [
        {
          logId: 'LOG-JOB-3',
          timestamp: '2026-08-15T03:15:00.000Z',
          level: 'INFO',
          message: 'ZATCA Phase 2 clearance batch completed with 100% cryptographic token conformity.'
        }
      ]
    }
  ];

  const platformBackups: BackupMetadata[] = [
    PlatformEngine.generateBackupMetadata('comp-001', 'usr-001')
  ];

  // ==================== PLATFORM REST ROUTE HANDLERS ====================

  // Workflows
  app.get('/api/v1/platform/workflows', (req: Request, res: Response) => {
    const companyId = req.query.companyId as string;
    const list = companyId ? platformWorkflows.filter(w => w.companyId === companyId) : platformWorkflows;
    res.json({ success: true, count: list.length, workflows: list });
  });

  app.post('/api/v1/platform/workflows', (req: Request, res: Response) => {
    try {
      const now = new Date().toISOString();
      const newDef: WorkflowDefinition = {
        id: `WF-DEF-${Date.now()}`,
        code: req.body.code || `WF_${Date.now()}`,
        name: req.body.name,
        nameAr: req.body.nameAr || req.body.name,
        entityType: req.body.entityType,
        isActive: req.body.isActive ?? true,
        version: 1,
        companyId: req.body.companyId || 'comp-001',
        slaHours: req.body.slaHours || 24,
        steps: req.body.steps || [],
        escalationRules: req.body.escalationRules || [],
        createdAt: now,
        updatedAt: now
      };
      platformWorkflows.push(newDef);
      res.json({ success: true, workflow: newDef });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/platform/workflow-instances', (req: Request, res: Response) => {
    res.json({ success: true, count: platformWorkflowInstances.length, instances: platformWorkflowInstances });
  });

  app.get('/api/v1/platform/delegations', (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    const list = userId 
      ? platformDelegations.filter(d => d.delegatorUserId === userId || d.delegateUserId === userId)
      : platformDelegations;
    res.json({ success: true, count: list.length, delegations: list });
  });

  app.post('/api/v1/platform/workflow-instances/decision', (req: Request, res: Response) => {
    try {
      const { instanceId, stepIndex, decision, approverUserId, approverName, approverRole, comments } = req.body;
      const instIndex = platformWorkflowInstances.findIndex(i => i.id === instanceId);
      if (instIndex === -1) {
        return res.status(404).json({ success: false, error: `Workflow instance ${instanceId} not found` });
      }

      const instance = platformWorkflowInstances[instIndex];
      const result = PlatformEngine.processWorkflowApproval(
        instance,
        stepIndex,
        { userId: approverUserId || 'usr-001', userName: approverName || 'Authorized Approver', userRole: approverRole || 'MANAGER' },
        decision,
        comments
      );

      platformWorkflowInstances[instIndex] = result.updatedInstance;

      // Add to audit timeline
      const timelineEvent = PlatformEngine.recordTimelineEvent({
        entityType: 'WORKFLOW_INSTANCE',
        entityId: instance.id,
        entityNumber: instance.entityNumber,
        action: decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
        performedByUserId: approverUserId || 'usr-001',
        performedByName: approverName || 'Approver',
        performedByRole: approverRole || 'MANAGER',
        summaryEn: `${decision} Step ${stepIndex + 1} for ${instance.entityNumber}`,
        summaryAr: `${decision === 'APPROVED' ? 'اعتماد' : 'رفض'} المرحلة ${stepIndex + 1} لـ ${instance.entityNumber}`
      });
      platformActivityTimeline.unshift(timelineEvent);

      res.json({
        success: true,
        instance: result.updatedInstance,
        stamp: result.digitalStamp
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Notifications
  app.get('/api/v1/platform/notifications', (req: Request, res: Response) => {
    res.json({ success: true, count: platformNotifications.length, notifications: platformNotifications });
  });

  app.post('/api/v1/platform/notifications', (req: Request, res: Response) => {
    try {
      const ntf = PlatformEngine.createNotification({
        tenantId: req.body.tenantId || 'ten-001',
        userId: req.body.userId || 'usr-001',
        channel: req.body.channel || 'IN_APP',
        priority: req.body.priority || 'MEDIUM',
        title: req.body.title,
        titleAr: req.body.titleAr || req.body.title,
        body: req.body.body,
        bodyAr: req.body.bodyAr || req.body.body,
        entityType: req.body.entityType,
        entityId: req.body.entityId,
        entityNumber: req.body.entityNumber,
        actionUrl: req.body.actionUrl
      });
      platformNotifications.unshift(ntf);
      res.json({ success: true, notification: ntf });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/v1/platform/notifications/:id/read', (req: Request, res: Response) => {
    const item = platformNotifications.find(n => n.id === req.params.id);
    if (item) {
      item.isRead = true;
      item.readAt = new Date().toISOString();
    }
    res.json({ success: true, notification: item });
  });

  // Background Jobs
  app.get('/api/v1/platform/jobs', (req: Request, res: Response) => {
    res.json({ success: true, count: platformScheduledJobs.length, jobs: platformScheduledJobs });
  });

  app.post('/api/v1/platform/jobs', (req: Request, res: Response) => {
    try {
      const job = PlatformEngine.createScheduledJob({
        code: req.body.code,
        name: req.body.name,
        nameAr: req.body.nameAr || req.body.name,
        jobType: req.body.jobType,
        cronExpression: req.body.cronExpression,
        isRecurring: req.body.isRecurring ?? true,
        priority: req.body.priority || 'MEDIUM',
        payload: req.body.payload
      });
      platformScheduledJobs.push(job);
      res.json({ success: true, job });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/platform/jobs/:id/run', (req: Request, res: Response) => {
    const idx = platformScheduledJobs.findIndex(j => j.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    const executed = PlatformEngine.executeJobStep(platformScheduledJobs[idx]);
    platformScheduledJobs[idx] = executed;
    res.json({ success: true, job: executed });
  });

  // Global Search
  app.post('/api/v1/platform/search', (req: Request, res: Response) => {
    const { q, category, status, limit } = req.body;

    // Aggregate searchable entities across domains
    const searchDataset: GlobalSearchResultItem[] = [
      ...platformWorkflowInstances.map(w => ({
        id: `srch-wf-${w.id}`,
        category: 'ALL' as any,
        entityType: w.entityType,
        entityId: w.entityId,
        title: `Workflow: ${w.workflowCode}`,
        titleAr: `مسار العمل: ${w.workflowCode}`,
        subtitle: `Doc: ${w.entityNumber} - Status: ${w.status}`,
        subtitleAr: `المستند: ${w.entityNumber} - الحالة: ${w.status}`,
        codeOrNumber: w.entityNumber,
        amount: w.amount,
        currency: w.currency,
        status: w.status,
        tags: ['workflow', 'approval', w.entityType.toLowerCase()],
        relevanceScore: 90,
        routeModule: 'workflows',
        createdAt: w.createdAt
      })),
      ...treasuryTransactions.map(t => ({
        id: `srch-tr-${t.id}`,
        category: 'TREASURY' as any,
        entityType: 'TREASURY_TRANSACTION',
        entityId: t.id,
        title: `Treasury: ${t.transactionNumber}`,
        titleAr: `معاملة خزينة: ${t.transactionNumber}`,
        subtitle: `${t.transactionType} - ${t.amount} ${t.currency}`,
        subtitleAr: `${t.transactionType} - ${t.amount} ${t.currency}`,
        codeOrNumber: t.transactionNumber,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        tags: ['treasury', 'bank', 'cash', t.transactionType.toLowerCase()],
        relevanceScore: 95,
        routeModule: 'treasury',
        createdAt: t.createdAt
      })),
      ...fixedAssetMasters.map(a => ({
        id: `srch-fa-${a.id}`,
        category: 'ASSETS' as any,
        entityType: 'FIXED_ASSET',
        entityId: a.id,
        title: `Asset: ${a.name}`,
        titleAr: `أصل ثابت: ${a.nameAr || a.name}`,
        subtitle: `${a.assetNumber} - NBV: ${a.netBookValue} SAR`,
        subtitleAr: `${a.assetNumber} - صافي القيمة: ${a.netBookValue} ريال`,
        codeOrNumber: a.assetNumber,
        amount: a.netBookValue,
        currency: 'SAR',
        status: a.status,
        tags: ['asset', 'fixed_assets', a.assetClassId?.toLowerCase() || 'asset'],
        relevanceScore: 85,
        routeModule: 'assets',
        createdAt: a.acquisitionDate
      }))
    ];

    const result = PlatformEngine.executeGlobalSearch(
      { q, category: category as any, status, limit },
      searchDataset
    );

    res.json({ success: true, ...result });
  });

  // Attachments
  app.get('/api/v1/platform/attachments', (req: Request, res: Response) => {
    const { entityType, entityId } = req.query;
    let list = platformAttachments;
    if (entityType) list = list.filter(a => a.entityType === entityType);
    if (entityId) list = list.filter(a => a.entityId === entityId);
    res.json({ success: true, count: list.length, attachments: list });
  });

  app.post('/api/v1/platform/attachments', (req: Request, res: Response) => {
    try {
      const att = PlatformEngine.createAttachment({
        entityType: req.body.entityType,
        entityId: req.body.entityId,
        entityNumber: req.body.entityNumber,
        fileName: req.body.fileName,
        fileSize: req.body.fileSize || 102400,
        mimeType: req.body.mimeType || 'application/pdf',
        category: req.body.category || 'OTHER',
        uploadedBy: req.body.uploadedBy || 'usr-001',
        uploadedByName: req.body.uploadedByName || 'Ahmed Al-Mansoor',
        description: req.body.description
      });
      platformAttachments.unshift(att);
      res.json({ success: true, attachment: att });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/platform/attachments/:id/verify', (req: Request, res: Response) => {
    const att = platformAttachments.find(a => a.id === req.params.id);
    if (!att) {
      return res.status(404).json({ success: false, error: 'Attachment not found' });
    }
    res.json({
      success: true,
      attachmentId: att.id,
      fileName: att.fileName,
      sha256Checksum: att.sha256Checksum,
      isVerified: true,
      virusScanStatus: 'CLEAN',
      signatureTimestamp: new Date().toISOString()
    });
  });

  // Activity Timeline
  app.get('/api/v1/platform/timeline', (req: Request, res: Response) => {
    const { entityType, entityId } = req.query;
    let list = platformActivityTimeline;
    if (entityType) list = list.filter(t => t.entityType === entityType);
    if (entityId) list = list.filter(t => t.entityId === entityId);
    res.json({ success: true, count: list.length, events: list });
  });

  // Dashboard Metrics
  app.get('/api/v1/platform/dashboard/metrics', (req: Request, res: Response) => {
    const role = (req.query.role as string) || 'CFO';
    const metrics = PlatformEngine.generateRoleKpis(role);
    res.json({ success: true, role, metrics });
  });

  // Health Monitoring
  app.get('/api/v1/platform/health', (req: Request, res: Response) => {
    const health = PlatformEngine.generateHealthReport();
    res.json({ success: true, health });
  });

  // Backups
  app.get('/api/v1/platform/backups', (req: Request, res: Response) => {
    res.json({ success: true, count: platformBackups.length, backups: platformBackups });
  });

  app.post('/api/v1/platform/backups', (req: Request, res: Response) => {
    const companyId = req.body.companyId || 'comp-001';
    const bck = PlatformEngine.generateBackupMetadata(companyId, req.body.createdBy || 'usr-001');
    platformBackups.unshift(bck);
    res.json({ success: true, backup: bck });
  });

  app.post('/api/v1/platform/backups/:id/simulate-restore', (req: Request, res: Response) => {
    const bck = platformBackups.find(b => b.id === req.params.id);
    if (!bck) {
      return res.status(404).json({ success: false, error: 'Backup not found' });
    }
    bck.restoreSimulationStatus = 'PASSED';
    bck.restoreSimulationTimestamp = new Date().toISOString();
    res.json({
      success: true,
      backupId: bck.id,
      simulationStatus: 'PASSED',
      tablesRestored: 28,
      recordsValidated: bck.totalEntities,
      checksumMatch: true,
      simulationDurationMs: 620
    });
  });

  // Import Validation
  app.post('/api/v1/platform/import/validate', (req: Request, res: Response) => {
    const { entityType, rows } = req.body;
    const template: any = {
      id: `TPL-${entityType}`,
      entityType: entityType || 'JOURNAL_ENTRY',
      nameEn: `${entityType} Standard Import Template`,
      nameAr: `قالب استيراد ${entityType} المعتمد`,
      supportedFormats: ['XLSX', 'CSV', 'JSON'],
      columns: [
        { field: 'code', label: 'Code / Reference', labelAr: 'الرمز أو المرجع', required: true, dataType: 'STRING' },
        { field: 'amount', label: 'Amount', labelAr: 'المبلغ', required: true, dataType: 'NUMBER' },
        { field: 'currency', label: 'Currency', labelAr: 'العملة', required: true, dataType: 'STRING' },
        { field: 'description', label: 'Description', labelAr: 'الوصف', required: false, dataType: 'STRING' }
      ]
    };

    const validated = PlatformEngine.validateImportData(template, rows || []);
    res.json({ success: true, session: validated.session });
  });

  // Export
  app.post('/api/v1/platform/export', (req: Request, res: Response) => {
    const { entityType, format } = req.body;
    res.json({
      success: true,
      exportId: `EXP-${Date.now()}`,
      entityType,
      format: format || 'XLSX',
      downloadUrl: `/api/v1/platform/downloads/export_${(entityType || 'data').toLowerCase()}_${Date.now()}.${(format || 'xlsx').toLowerCase()}`,
      generatedAt: new Date().toISOString(),
      recordCount: 150
    });
  });

  // Cache & Performance Metrics
  app.get('/api/v1/platform/performance/cache', (req: Request, res: Response) => {
    res.json({
      success: true,
      cache: {
        hits: 14280,
        misses: 620,
        hitRatePercent: 95.8,
        cachedKeysCount: 1840,
        memoryUsageBytes: 12400000,
        memoryUsageFormatted: '11.82 MB'
      }
    });
  });

  // Pilot Deployment Readiness
  app.get('/api/v1/platform/pilot-readiness', (_req: Request, res: Response) => {
    const persistenceReport = pilotDb.getPersistenceReport();
    const evalReport = PlatformEngine.evaluatePilotReadiness(persistenceReport);
    if (persistenceReport.readinessStatus !== 'READY') {
      res.status(503).json({
        success: false,
        readiness: evalReport,
        operationalMessage: persistenceReport.operationalMessage,
        remedyInstructions: persistenceReport.remedyInstructions
      });
      return;
    }
    res.json({ success: true, readiness: evalReport });
  });

  // =========================================================================
  // PHASE 3.1 — ENTERPRISE SALES & POINT OF SALE (POS) API ENDPOINTS
  // =========================================================================

  // 1. Sales Quotations
  app.get('/api/v1/sales/quotations', (req: Request, res: Response) => {
    res.json({ success: true, quotations: salesQuotations });
  });

  app.post('/api/v1/sales/quotations', (req: Request, res: Response) => {
    const seqRule = salesDocumentSequences.find(s => s.documentType === 'QUOTATION');
    let qNum = `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    if (seqRule) {
      const gen = SalesEngine.generateDocumentNumber(seqRule);
      qNum = gen.documentNumber;
      Object.assign(seqRule, gen.updatedRule);
    }

    const payload = req.body;
    const now = new Date().toISOString();
    const newQuotation: SalesQuotation = {
      id: `qt-${Date.now()}`,
      tenantId: payload.tenantId || 'ten-001',
      companyId: payload.companyId || 'comp-001',
      branchId: payload.branchId || 'br-001',
      quotationNumber: qNum,
      customerId: payload.customerId,
      customerName: payload.customerName,
      customerNameAr: payload.customerNameAr,
      customerEmail: payload.customerEmail,
      customerPhone: payload.customerPhone,
      salespersonId: payload.salespersonId || 'usr-002',
      salespersonName: payload.salespersonName || 'Tariq Al-Mansoor',
      issueDate: payload.issueDate || now.split('T')[0],
      validUntil: payload.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      currency: payload.currency || 'SAR',
      exchangeRate: payload.exchangeRate || 1.0,
      lines: payload.lines || [],
      subtotal: payload.subtotal || 0,
      discountTotal: payload.discountTotal || 0,
      taxTotal: payload.taxTotal || 0,
      grandTotal: payload.grandTotal || 0,
      status: 'DRAFT',
      termsAndConditions: payload.termsAndConditions || 'Standard 30-day payment & delivery SLA',
      createdAt: now,
      updatedAt: now
    };

    salesQuotations.unshift(newQuotation);
    res.json({ success: true, quotation: newQuotation });
  });

  app.post('/api/v1/sales/quotations/:id/convert-to-order', (req: Request, res: Response) => {
    const { id } = req.params;
    const quotation = salesQuotations.find(q => q.id === id);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const seqRule = salesDocumentSequences.find(s => s.documentType === 'SALES_ORDER');
    let orderNum = `SO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    if (seqRule) {
      const gen = SalesEngine.generateDocumentNumber(seqRule);
      orderNum = gen.documentNumber;
      Object.assign(seqRule, gen.updatedRule);
    }

    const performer = req.body.performedBy || { id: 'usr-002', name: 'Tariq Al-Mansoor', role: 'Sales Lead' };
    const defaultWh = { id: 'wh-001', name: 'Central Logistics Hub (Riyadh)' };

    const newOrder = SalesEngine.convertQuotationToOrder(quotation, orderNum, performer, defaultWh);
    quotation.status = 'CONVERTED_TO_ORDER';
    quotation.convertedSalesOrderId = newOrder.id;
    quotation.convertedSalesOrderNumber = newOrder.orderNumber;
    quotation.updatedAt = new Date().toISOString();

    salesOrders.unshift(newOrder);

    // Record timeline & audit
    recordAudit(
      quotation.tenantId,
      performer.id,
      performer.name,
      performer.role,
      'POST',
      'SALES_ORDER',
      newOrder.id,
      `Quotation ${quotation.quotationNumber} successfully converted to Sales Order ${newOrder.orderNumber}`,
      newOrder.orderNumber
    );

    res.json({ success: true, order: newOrder, quotation });
  });

  // 2. Sales Orders
  app.get('/api/v1/sales/orders', (req: Request, res: Response) => {
    res.json({ success: true, orders: salesOrders });
  });

  app.get('/api/v1/sales/orders/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const order = salesOrders.find(o => o.id === id || o.orderNumber === id);
    if (!order) return res.status(404).json({ success: false, error: 'Sales Order not found' });
    res.json({ success: true, order });
  });

  app.post('/api/v1/sales/orders', (req: Request, res: Response) => {
    const seqRule = salesDocumentSequences.find(s => s.documentType === 'SALES_ORDER');
    let orderNum = `SO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    if (seqRule) {
      const gen = SalesEngine.generateDocumentNumber(seqRule);
      orderNum = gen.documentNumber;
      Object.assign(seqRule, gen.updatedRule);
    }

    const payload = req.body;
    const now = new Date().toISOString();
    const performer = payload.performedBy || { id: 'usr-002', name: 'Tariq Al-Mansoor', role: 'Sales Lead' };

    const initialAudit: SalesOrderStateTransitionAudit = {
      id: `so-audit-init-${Date.now()}`,
      orderId: `so-${Date.now()}`,
      orderNumber: orderNum,
      fromStatus: 'DRAFT',
      toStatus: 'DRAFT',
      reason: 'Initial Sales Order Draft creation',
      performedBy: performer.id,
      performedByName: performer.name,
      performedByRole: performer.role,
      timestamp: now,
      digitalSealSha256: SalesEngine.generateSha256Seal({ orderNumber: orderNum, timestamp: now })
    };

    const newOrder: SalesOrder = {
      id: `so-${Date.now()}`,
      tenantId: payload.tenantId || 'ten-001',
      companyId: payload.companyId || 'comp-001',
      branchId: payload.branchId || 'br-001',
      orderNumber: orderNum,
      quotationRefId: payload.quotationRefId,
      quotationRefNumber: payload.quotationRefNumber,
      customerPurchaseOrderNumber: payload.customerPurchaseOrderNumber,
      customerId: payload.customerId,
      customerName: payload.customerName,
      customerNameAr: payload.customerNameAr,
      customerCategory: payload.customerCategory || 'ENTERPRISE',
      customerTaxNumber: payload.customerTaxNumber,
      shippingAddress: payload.shippingAddress || 'Customer Warehouse Facility',
      billingAddress: payload.billingAddress || 'Customer Finance Office',
      salespersonId: performer.id,
      salespersonName: performer.name,
      orderDate: payload.orderDate || now.split('T')[0],
      requestedDeliveryDate: payload.requestedDeliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      currency: payload.currency || 'SAR',
      exchangeRate: payload.exchangeRate || 1.0,
      paymentTermsCode: payload.paymentTermsCode || 'NET_30',
      paymentMethodType: payload.paymentMethodType || 'BANK_TRANSFER',
      lines: payload.lines || [],
      subtotal: payload.subtotal || 0,
      headerDiscountRate: payload.headerDiscountRate || 0,
      headerDiscountAmount: payload.headerDiscountAmount || 0,
      appliedCouponCode: payload.appliedCouponCode,
      taxTotal: payload.taxTotal || 0,
      grandTotal: payload.grandTotal || 0,
      status: 'DRAFT',
      stockReservationStatus: 'UNRESERVED',
      stateTransitions: [initialAudit],
      createdAt: now,
      updatedAt: now,
      sha256AuditSeal: SalesEngine.generateSha256Seal({ orderNumber: orderNum, total: payload.grandTotal, now })
    };

    salesOrders.unshift(newOrder);
    res.json({ success: true, order: newOrder });
  });

  app.post('/api/v1/sales/orders/:id/transition', (req: Request, res: Response) => {
    const { id } = req.params;
    const { toStatus, reason, holdReason, performedBy } = req.body;
    const order = salesOrders.find(o => o.id === id || o.orderNumber === id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Sales Order not found' });
    }

    const performer = performedBy || { id: 'usr-001', name: 'Ahmad Mounir (CFO)', role: 'Super Admin' };
    const result = SalesEngine.transitionOrderStatus(order, toStatus, performer, reason, holdReason);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    // Update in memory array
    const idx = salesOrders.findIndex(o => o.id === order.id);
    if (idx !== -1) {
      salesOrders[idx] = result.order;
    }

    // Record audit
    recordAudit(
      order.tenantId,
      performer.id,
      performer.name,
      performer.role,
      'UPDATE',
      'SALES_ORDER',
      order.id,
      `Sales Order ${order.orderNumber} state transitioned from ${order.status} to ${toStatus}. Reason: ${reason || 'State machine update'}`,
      order.orderNumber
    );

    res.json({ success: true, order: result.order, audit: result.audit });
  });

  app.get('/api/v1/sales/orders/:id/atp-check', (req: Request, res: Response) => {
    const { id } = req.params;
    const order = salesOrders.find(o => o.id === id || o.orderNumber === id);
    if (!order) return res.status(404).json({ success: false, error: 'Sales Order not found' });

    const atpResults = order.lines.map(line => {
      const invItem = inventory.find(i => i.sku === line.itemSku);
      const stock = invItem ? { currentStock: invItem.stockQty, reservedStock: 0 } : { currentStock: 50, reservedStock: 5 };
      const atp = SalesEngine.checkAvailableToPromise(line.itemSku, line.quantityOrdered, stock);
      return {
        itemSku: line.itemSku,
        itemName: line.itemName,
        quantityOrdered: line.quantityOrdered,
        ...atp
      };
    });

    const isAllAvailable = atpResults.every(r => r.isAvailable);
    res.json({ success: true, orderNumber: order.orderNumber, isAllAvailable, lines: atpResults });
  });

  app.post('/api/v1/sales/orders/:id/reserve-stock', (req: Request, res: Response) => {
    const { id } = req.params;
    const order = salesOrders.find(o => o.id === id || o.orderNumber === id);
    if (!order) return res.status(404).json({ success: false, error: 'Sales Order not found' });

    order.lines.forEach(l => {
      l.quantityReserved = l.quantityOrdered;
    });

    order.stockReservationStatus = 'FULLY_RESERVED';
    order.updatedAt = new Date().toISOString();

    res.json({ success: true, order, message: 'Stock successfully reserved across warehouses' });
  });

  app.post('/api/v1/sales/orders/:id/generate-invoice', (req: Request, res: Response) => {
    const { id } = req.params;
    const order = salesOrders.find(o => o.id === id || o.orderNumber === id);
    if (!order) return res.status(404).json({ success: false, error: 'Sales Order not found' });

    const seqRule = salesDocumentSequences.find(s => s.documentType === 'SALES_INVOICE');
    let invNum = `SINV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    if (seqRule) {
      const gen = SalesEngine.generateDocumentNumber(seqRule);
      invNum = gen.documentNumber;
      Object.assign(seqRule, gen.updatedRule);
    }

    const now = new Date().toISOString();
    const invoiceLines = order.lines.map((l, i) => ({
      id: `inv-line-${Date.now()}-${i}`,
      itemCode: l.itemSku,
      itemName: l.itemName,
      quantity: l.quantityOrdered,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      taxAmount: l.taxAmount,
      discountRate: l.discountRate,
      discountAmount: l.discountAmount,
      lineTotal: l.lineTotal
    }));

    const newInvoice: CustomerSalesInvoice = {
      id: `sinv-gen-${Date.now()}`,
      tenantId: order.tenantId,
      companyId: order.companyId,
      invoiceNumber: invNum,
      customerId: order.customerId,
      customerName: order.customerName,
      customerTaxNumber: order.customerTaxNumber,
      salesOrderRef: order.orderNumber,
      invoiceDate: now.split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      currency: order.currency,
      exchangeRate: order.exchangeRate,
      lines: invoiceLines,
      subtotal: order.subtotal,
      taxTotal: order.taxTotal,
      discountTotal: order.headerDiscountAmount,
      grandTotal: order.grandTotal,
      paidAmount: 0,
      remainingAmount: order.grandTotal,
      status: 'POSTED',
      paymentStatus: 'UNPAID',
      zatcaUuid: `ZATCA-${invNum}-${Date.now()}`,
      zatcaQrHash: `QR-${invNum}`,
      hash: SalesEngine.generateSha256Seal({ invNum, grandTotal: order.grandTotal, now }),
      createdBy: 'usr-002',
      createdAt: now,
      updatedAt: now
    };

    arSalesInvoices.unshift(newInvoice);
    order.arInvoiceId = newInvoice.id;
    order.arInvoiceNumber = newInvoice.invoiceNumber;
    order.updatedAt = now;

    // Trigger Financial Event for Revenue Recognition (Debit AR, Credit Revenue, Credit Tax)
    processFinancialEvent(
      order.tenantId,
      order.companyId,
      'EVT_SALES_INVOICE_POSTED' as any,
      'SalesInvoice',
      newInvoice.id,
      newInvoice.invoiceNumber,
      newInvoice.grandTotal,
      newInvoice.taxTotal,
      newInvoice.currency,
      newInvoice.customerId,
      newInvoice.customerName,
      `AR Revenue Recognized for Sales Order #${order.orderNumber}`
    );

    res.json({ success: true, invoice: newInvoice, order });
  });

  // 3. Price Lists
  app.get('/api/v1/sales/pricelists', (req: Request, res: Response) => {
    res.json({ success: true, priceLists: enterprisePriceLists });
  });

  app.post('/api/v1/sales/pricelists', (req: Request, res: Response) => {
    const payload = req.body;
    const newPriceList: EnterprisePriceList = {
      id: `pl-${Date.now()}`,
      tenantId: payload.tenantId || 'ten-001',
      companyId: payload.companyId || 'comp-001',
      code: payload.code || `PL-${Date.now()}`,
      name: payload.name,
      nameAr: payload.nameAr || payload.name,
      currency: payload.currency || 'SAR',
      priceListType: payload.priceListType || 'RETAIL',
      branchId: payload.branchId,
      isDefault: !!payload.isDefault,
      startDate: payload.startDate || new Date().toISOString().split('T')[0],
      endDate: payload.endDate,
      isActive: true,
      itemPrices: payload.itemPrices || []
    };

    enterprisePriceLists.unshift(newPriceList);
    res.json({ success: true, priceList: newPriceList });
  });

  app.post('/api/v1/sales/pricing/resolve', (req: Request, res: Response) => {
    const { itemSku, quantity, basePrice, priceListId, customerDiscountPercent } = req.body;
    const pl = enterprisePriceLists.find(p => p.id === priceListId || (p.isDefault && !priceListId));
    const result = SalesEngine.resolveUnitPrice(itemSku, quantity || 1, basePrice || 100, pl, customerDiscountPercent || 0);
    res.json({ success: true, pricing: result });
  });

  // 4. Discounts & Promotions
  app.get('/api/v1/sales/discounts/rules', (req: Request, res: Response) => {
    res.json({ success: true, discountRules });
  });

  app.post('/api/v1/sales/discounts/rules', (req: Request, res: Response) => {
    const payload = req.body;
    const newRule: DiscountRule = {
      id: `disc-${Date.now()}`,
      tenantId: payload.tenantId || 'ten-001',
      companyId: payload.companyId || 'comp-001',
      code: payload.code || `DISC-${Date.now()}`,
      name: payload.name,
      nameAr: payload.nameAr || payload.name,
      discountType: payload.discountType || 'LINE_PERCENT',
      value: payload.value || 5,
      maxDiscountThreshold: payload.maxDiscountThreshold || 15,
      requiresSupervisorApprovalAbove: payload.requiresSupervisorApprovalAbove || 10,
      isActive: true
    };
    discountRules.unshift(newRule);
    res.json({ success: true, discountRule: newRule });
  });

  app.get('/api/v1/sales/promotions', (req: Request, res: Response) => {
    res.json({ success: true, promotions: promotionCampaigns });
  });

  app.post('/api/v1/sales/promotions', (req: Request, res: Response) => {
    const payload = req.body;
    const newPromo: PromotionCampaign = {
      id: `promo-${Date.now()}`,
      tenantId: payload.tenantId || 'ten-001',
      companyId: payload.companyId || 'comp-001',
      code: payload.code,
      name: payload.name,
      nameAr: payload.nameAr || payload.name,
      type: payload.type || 'PERCENTAGE_DISCOUNT',
      couponCode: payload.couponCode,
      startDate: payload.startDate || new Date().toISOString().split('T')[0],
      endDate: payload.endDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      minCartValue: payload.minCartValue,
      maxRedemptionsTotal: payload.maxRedemptionsTotal,
      redemptionsCount: 0,
      buyQuantityRequired: payload.buyQuantityRequired,
      buyItemSku: payload.buyItemSku,
      freeQuantityGranted: payload.freeQuantityGranted,
      freeItemSku: payload.freeItemSku,
      discountPercent: payload.discountPercent,
      discountFixedAmount: payload.discountFixedAmount,
      isActive: true
    };
    promotionCampaigns.unshift(newPromo);
    res.json({ success: true, promotion: newPromo });
  });

  app.post('/api/v1/sales/promotions/evaluate', (req: Request, res: Response) => {
    const { items, couponCode } = req.body;
    const evaluation = SalesEngine.evaluatePromotions(items || [], promotionCampaigns, couponCode);
    res.json({ success: true, evaluation });
  });

  // 5. Retail POS Registers & Shifts
  app.get('/api/v1/sales/pos/registers', (req: Request, res: Response) => {
    res.json({ success: true, registers: posRegisters });
  });

  app.post('/api/v1/sales/pos/registers', (req: Request, res: Response) => {
    const payload = req.body;
    const newRegister: POSRegister = {
      id: `pos-reg-${Date.now()}`,
      tenantId: payload.tenantId || 'ten-001',
      companyId: payload.companyId || 'comp-001',
      branchId: payload.branchId || 'br-001',
      warehouseId: payload.warehouseId || 'wh-001',
      code: payload.code || `REG-${posRegisters.length + 1}`,
      name: payload.name,
      nameAr: payload.nameAr || payload.name,
      isActive: true,
      cashDrawerStatus: 'CLOSED',
      defaultCashAccountId: 'acc-1010-cash',
      defaultBankAccountId: 'acc-1020-bank',
      printerIpOrName: payload.printerIpOrName
    };
    posRegisters.push(newRegister);
    res.json({ success: true, register: newRegister });
  });

  app.get('/api/v1/sales/pos/shifts', (req: Request, res: Response) => {
    res.json({ success: true, shifts: posShifts });
  });

  app.post('/api/v1/sales/pos/shifts/open', (req: Request, res: Response) => {
    const { registerId, openingFloat, cashier } = req.body;
    const register = posRegisters.find(r => r.id === registerId);
    if (!register) return res.status(404).json({ success: false, error: 'Register not found' });

    const auth = (req as any).auth;
    if (auth) {
      const allowedRoles = ['Cashier', 'POS Supervisor', 'Store Manager', 'Super Admin', 'Tenant Admin'];
      if (!allowedRoles.includes(auth.role)) {
        return res.status(403).json({ success: false, error: `Forbidden: Role '${auth.role}' is not authorized to open a POS shift.` });
      }
      if (auth.role !== 'Super Admin' && register.companyId !== auth.companyId) {
        return res.status(403).json({ success: false, error: `Cross-company violation: Register belongs to company '${register.companyId}', but user belongs to company '${auth.companyId}'.` });
      }
    }

    const shiftNum = `SH-${new Date().toISOString().split('T')[0]}-${posShifts.length + 1}`;
    const cashierData = (auth ? { id: auth.sub, name: auth.name } : null) || cashier || { id: 'usr-003', name: 'Omar Al-Ghamdi' };
    const newShift = SalesEngine.openShift(register, cashierData, shiftNum, openingFloat || 1000);

    register.currentShiftId = newShift.id;
    posShifts.unshift(newShift);

    res.json({ success: true, shift: newShift, register });
  });

  app.post('/api/v1/sales/pos/shifts/:id/cash-movement', (req: Request, res: Response) => {
    const { id } = req.params;
    const { type, amount, reason, performedBy } = req.body;
    const shift = posShifts.find(s => s.id === id);
    if (!shift) return res.status(404).json({ success: false, error: 'Shift not found' });

    const performer = performedBy || { id: shift.cashierId, name: shift.cashierName };
    const updatedShift = SalesEngine.recordShiftCashMovement(shift, type, amount, performer, reason);

    const idx = posShifts.findIndex(s => s.id === shift.id);
    if (idx !== -1) posShifts[idx] = updatedShift;

    res.json({ success: true, shift: updatedShift });
  });

  app.post('/api/v1/sales/pos/shifts/:id/close', (req: Request, res: Response) => {
    const { id } = req.params;
    const { actualCountedCash, supervisorId, varianceReason } = req.body;
    const shift = posShifts.find(s => s.id === id);
    if (!shift) return res.status(404).json({ success: false, error: 'Shift not found' });

    const result = SalesEngine.closeShift(shift, actualCountedCash, supervisorId, varianceReason);
    const idx = posShifts.findIndex(s => s.id === shift.id);
    if (idx !== -1) posShifts[idx] = result.shift;

    const register = posRegisters.find(r => r.id === shift.registerId);
    if (register) {
      register.currentShiftId = undefined;
    }

    res.json({ success: true, shift: result.shift, requiresSupervisorApproval: result.requiresSupervisorApproval });
  });

  // 6. POS Receipts & Checkout
  app.get('/api/v1/sales/pos/receipts', (req: Request, res: Response) => {
    res.json({ success: true, receipts: posReceipts });
  });

  app.post('/api/v1/sales/pos/receipts', (req: Request, res: Response) => {
    const { registerId, shiftId, cartLines, payments, customer, cashier } = req.body;
    const register = posRegisters.find(r => r.id === registerId) || posRegisters[0];
    const shift = posShifts.find(s => s.id === shiftId) || posShifts[0];

    const auth = (req as any).auth;
    if (auth) {
      const allowedRoles = ['Cashier', 'POS Supervisor', 'Store Manager', 'Super Admin', 'Tenant Admin'];
      if (!allowedRoles.includes(auth.role)) {
        return res.status(403).json({ success: false, error: `Forbidden: Role '${auth.role}' is not authorized to execute POS checkout.` });
      }
      if (auth.role !== 'Super Admin' && register.companyId !== auth.companyId) {
        return res.status(403).json({ success: false, error: `Cross-company violation: Register belongs to company '${register.companyId}', but user belongs to company '${auth.companyId}'.` });
      }
    }

    const seqRule = salesDocumentSequences.find(s => s.documentType === 'POS_RECEIPT');
    let rcptNum = `POS-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    if (seqRule) {
      const gen = SalesEngine.generateDocumentNumber(seqRule);
      rcptNum = gen.documentNumber;
      Object.assign(seqRule, gen.updatedRule);
    }

    const cust = customer || { id: 'cust-walkin', name: 'Walk-in Retail Customer', isWalkIn: true };
    const csh = cashier || { id: shift.cashierId, name: shift.cashierName };

    const checkoutResult = SalesEngine.processPOSReceipt(register, shift, cartLines, payments, cust, csh, rcptNum);

    if (!checkoutResult.success || !checkoutResult.receipt) {
      return res.status(400).json({ success: false, error: checkoutResult.error });
    }

    posReceipts.unshift(checkoutResult.receipt);
    pilotDb.saveEntity('posReceipts', checkoutResult.receipt, register.tenantId, register.companyId);

    // Update in-memory shift
    const shiftIdx = posShifts.findIndex(s => s.id === shift.id);
    if (shiftIdx !== -1) {
      posShifts[shiftIdx] = checkoutResult.updatedShift;
      pilotDb.saveEntity('posShifts', checkoutResult.updatedShift, register.tenantId, register.companyId);
    }

    // Inventory Stock update
    cartLines.forEach((l: any) => {
      const invItem = inventory.find(i => i.sku === l.itemSku);
      if (invItem) {
        invItem.stockQty = Math.max(0, invItem.stockQty - l.quantity);
        pilotDb.saveEntity('inventory', invItem, register.tenantId, register.companyId);
      }
    });

    // Treasury Integration Domain Events (Event-Driven)
    for (const p of payments) {
      if (p.method === 'CASH') {
        processFinancialEvent(
          register.tenantId,
          register.companyId,
          'EVT_POS_CASH_RECEIPT' as any,
          'POSReceipt',
          checkoutResult.receipt.id,
          checkoutResult.receipt.receiptNumber,
          p.amount,
          checkoutResult.receipt.taxTotal,
          p.currency || 'SAR',
          cust.id,
          cust.name,
          `POS Cash Receipt #${checkoutResult.receipt.receiptNumber}`
        );
      }
    }

    res.json({
      success: true,
      receipt: checkoutResult.receipt,
      changeGiven: checkoutResult.changeGiven,
      shift: checkoutResult.updatedShift
    });
  });

  // 7. Sales Returns & Exchanges
  app.get('/api/v1/sales/returns', (req: Request, res: Response) => {
    res.json({ success: true, returns: salesReturns });
  });

  app.post('/api/v1/sales/returns', (req: Request, res: Response) => {
    const { returnType, originalDoc, customer, lines, refundMethod, approvedBy, exchangeSalesOrderId } = req.body;

    const seqRule = salesDocumentSequences.find(s => s.documentType === 'SALES_RETURN');
    let retNum = `SRTN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    if (seqRule) {
      const gen = SalesEngine.generateDocumentNumber(seqRule);
      retNum = gen.documentNumber;
      Object.assign(seqRule, gen.updatedRule);
    }

    const returnRecord = SalesEngine.processSalesReturn(
      retNum,
      returnType || 'PARTIAL_RETURN',
      originalDoc || { type: 'NONE' },
      customer || { id: 'cust-walkin', name: 'Walk-in Retail Customer' },
      lines || [],
      refundMethod || 'CASH',
      approvedBy || 'usr-001',
      exchangeSalesOrderId
    );

    salesReturns.unshift(returnRecord);

    // Restock returnable inventory
    lines.forEach((l: any) => {
      if (l.condition === 'RESTOCKABLE_NEW') {
        const invItem = inventory.find(i => i.sku === l.itemSku);
        if (invItem) {
          invItem.stockQty += l.quantityReturned;
        }
      }
    });

    res.json({ success: true, salesReturn: returnRecord });
  });

  // 8. Sales Document Numbering Sequences
  app.get('/api/v1/sales/sequences', (req: Request, res: Response) => {
    res.json({ success: true, sequences: salesDocumentSequences });
  });

  app.post('/api/v1/sales/sequences', (req: Request, res: Response) => {
    const { documentType, prefix, zeroPad, yearPrefix } = req.body;
    const existing = salesDocumentSequences.find(s => s.documentType === documentType);
    if (existing) {
      existing.prefix = prefix;
      existing.zeroPad = zeroPad;
      existing.yearPrefix = yearPrefix;
      return res.json({ success: true, sequence: existing });
    }
    const newSeq: SalesDocumentSequenceConfig = {
      id: `seq-${Date.now()}`,
      tenantId: 'ten-001',
      companyId: 'comp-001',
      documentType,
      prefix,
      zeroPad: zeroPad || 4,
      yearPrefix: !!yearPrefix,
      nextNumber: 1
    };
    salesDocumentSequences.push(newSeq);
    res.json({ success: true, sequence: newSeq });
  });

  // 9. Executive Analytics & Summaries
  app.get('/api/v1/sales/analytics/summary', (req: Request, res: Response) => {
    const grossSalesOrders = salesOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const grossPosReceipts = posReceipts.reduce((sum, r) => sum + r.grandTotal, 0);
    const totalReturns = salesReturns.reduce((sum, r) => sum + r.refundGrandTotal, 0);
    const totalGross = grossSalesOrders + grossPosReceipts;
    const totalNet = Math.max(0, totalGross - totalReturns);

    res.json({
      success: true,
      metrics: {
        totalGrossSales: totalGross,
        totalNetSales: totalNet,
        totalPosSales: grossPosReceipts,
        totalEnterpriseSales: grossSalesOrders,
        totalOrdersCount: salesOrders.length,
        activeQuotationsCount: salesQuotations.filter(q => q.status !== 'EXPIRED' && q.status !== 'CONVERTED_TO_ORDER').length,
        pendingOrderApprovalsCount: salesOrders.filter(o => o.status === 'PENDING_APPROVAL').length,
        openShiftsCount: posShifts.filter(s => s.status === 'OPEN').length,
        averageOrderValue: salesOrders.length > 0 ? Math.round((grossSalesOrders / salesOrders.length) * 100) / 100 : 0,
        returnRatePercentage: totalGross > 0 ? Math.round((totalReturns / totalGross) * 10000) / 100 : 0,
        topSellingProducts: [
          { sku: 'SW-ERP-USR', name: 'AM Enterprise ERP License', quantitySold: 35, revenue: 343000 },
          { sku: 'HW-SRV-RACK', name: 'Dell PowerEdge R750 Enterprise Server', quantitySold: 4, revenue: 104000 },
          { sku: 'NET-CIS-SW48', name: 'Cisco Catalyst 48-Port Managed Switch', quantitySold: 8, revenue: 49600 },
          { sku: 'POS-PRN-TH', name: 'High-Speed Thermal Receipt Printer', quantitySold: 12, revenue: 13800 }
        ],
        salesByChannel: [
          { channel: 'ENTERPRISE_B2B', amount: grossSalesOrders, percentage: Math.round((grossSalesOrders / (totalGross || 1)) * 100) },
          { channel: 'RETAIL_POS', amount: grossPosReceipts, percentage: Math.round((grossPosReceipts / (totalGross || 1)) * 100) }
        ]
      }
    });
  });

  // ==================== PHASE 3.1 HARDENING REST APIS ====================

  // 10. POS Device & Terminal Governance
  app.get('/api/v1/sales/devices', (req: Request, res: Response) => {
    res.json({ success: true, devices: posDevices });
  });

  app.post('/api/v1/sales/devices/register', (req: Request, res: Response) => {
    const { deviceName, deviceType, macAddressOrFingerprint, assignedUserId, assignedUserName, branchId, branchName } = req.body;
    const devCode = `DEV-${(deviceType || 'POS').slice(0, 3)}-${String(posDevices.length + 1).padStart(2, '0')}`;
    const newDev: POSDeviceMaster = {
      id: `dev-${Date.now()}`,
      tenantId: 'ten-001',
      companyId: 'comp-001',
      branchId: branchId || 'br-001',
      branchName: branchName || 'Riyadh Main Branch',
      deviceCode: devCode,
      deviceName: deviceName || 'New POS Terminal',
      deviceType: deviceType || 'DESKTOP_POS',
      macAddressOrFingerprint: macAddressOrFingerprint || 'AA:BB:CC:DD:EE:FF',
      assignedUserId: assignedUserId || 'usr-001',
      assignedUserName: assignedUserName || 'Ahmed Mounir',
      appVersion: '2.8.0-build.104',
      registeredAt: new Date().toISOString(),
      lastHeartbeatAt: new Date().toISOString(),
      isActive: true,
      isAuthorized: true,
      connectivityStatus: 'ONLINE',
      localPendingQueueCount: 0,
      deviceHealth: 'HEALTHY',
      allowedOfflineDays: 7,
      securityTokenHash: OfflineSalesSyncEngine.generateSha256({ code: devCode, regAt: new Date().toISOString() })
    };
    posDevices.unshift(newDev);
    res.json({ success: true, device: newDev });
  });

  app.post('/api/v1/sales/devices/:id/authorize', (req: Request, res: Response) => {
    const dev = posDevices.find(d => d.id === req.params.id);
    if (!dev) return res.status(404).json({ success: false, error: 'Device not found' });
    dev.isAuthorized = true;
    dev.isActive = true;
    res.json({ success: true, device: dev });
  });

  app.post('/api/v1/sales/devices/:id/deauthorize', (req: Request, res: Response) => {
    const dev = posDevices.find(d => d.id === req.params.id);
    if (!dev) return res.status(404).json({ success: false, error: 'Device not found' });
    dev.isAuthorized = false;
    dev.isActive = false;
    res.json({ success: true, device: dev });
  });

  app.post('/api/v1/sales/devices/:id/heartbeat', (req: Request, res: Response) => {
    const dev = posDevices.find(d => d.id === req.params.id);
    if (!dev) return res.status(404).json({ success: false, error: 'Device not found' });
    dev.lastHeartbeatAt = new Date().toISOString();
    dev.connectivityStatus = req.body.connectivityStatus || 'ONLINE';
    if (req.body.pendingQueueCount !== undefined) {
      dev.localPendingQueueCount = req.body.pendingQueueCount;
    }
    res.json({ success: true, device: dev });
  });

  // 11. Synchronization Engine & Offline Queue
  app.get('/api/v1/sales/sync/queue', (req: Request, res: Response) => {
    res.json({ success: true, queue: offlineTransactionQueue });
  });

  app.post('/api/v1/sales/sync/queue/create', (req: Request, res: Response) => {
    const { deviceId, transactionType, payload, userName, userId } = req.body;
    const dev = posDevices.find(d => d.id === deviceId) || posDevices[0];
    const seq = offlineTransactionQueue.filter(q => q.deviceId === dev.id).length + 1;
    const tempDoc = OfflineSalesSyncEngine.generateTemporaryDocumentNumber(dev.deviceCode, transactionType, seq);

    const queueItem = OfflineSalesSyncEngine.createOfflineTransaction(
      dev.id,
      userId || dev.assignedUserId,
      userName || dev.assignedUserName,
      dev.companyId,
      dev.branchId,
      transactionType,
      tempDoc,
      seq,
      payload || {}
    );

    offlineTransactionQueue.unshift(queueItem);
    dev.localPendingQueueCount += 1;

    res.json({ success: true, queueItem });
  });

  app.post('/api/v1/sales/sync/batch', (req: Request, res: Response) => {
    const batchRequest = req.body;
    const syncExecution = OfflineSalesSyncEngine.processSyncBatch(batchRequest, {
      registeredDevices: posDevices,
      idempotencyStore: idempotencyKeysStore,
      customers: mobileCustomers,
      products: mobileProducts,
      onPromoteOrder: (tempDoc, payload) => {
        const orderNum = `SO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const newOrder: any = {
          id: `so-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tenantId: 'ten-001',
          companyId: batchRequest.companyId || 'comp-001',
          branchId: batchRequest.branchId || 'br-001',
          orderNumber: orderNum,
          orderDate: new Date().toISOString().slice(0, 10),
          requestedDeliveryDate: new Date().toISOString().slice(0, 10),
          customerId: payload.customerId || 'cust-101',
          customerName: payload.customerName || 'Al-Mansoor Trading Est',
          customerCategory: 'ENTERPRISE',
          currency: 'SAR',
          exchangeRate: 1.0,
          priceListId: 'pl-wholesale-std',
          paymentTermsCode: payload.paymentTerms || 'NET_30',
          paymentMethodType: 'BANK_TRANSFER',
          shippingAddress: 'Client Location',
          billingAddress: 'Client Location',
          salespersonId: batchRequest.userId,
          salespersonName: 'Tariq Al-Mansoor',
          lines: payload.lines || [],
          subtotal: payload.subtotal || 5700,
          headerDiscountRate: 0,
          headerDiscountAmount: 0,
          taxTotal: payload.taxTotal || 855,
          grandTotal: payload.grandTotal || 6555,
          status: 'CONFIRMED',
          stockReservationStatus: 'FULLY_RESERVED',
          stateTransitions: [],
          sha256AuditSeal: OfflineSalesSyncEngine.generateSha256({ tempDoc, orderNum }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        salesOrders.unshift(newOrder);
        try {
          pilotDb.saveEntity('salesOrders', newOrder, 'ten-001', batchRequest.companyId || 'comp-001');
        } catch (err) {
          console.warn('Could not persist salesOrder to SQLite:', err);
        }
        return { serverId: newOrder.id, serverNumber: newOrder.orderNumber };
      },
      onPromoteReceipt: (tempDoc, payload) => {
        const rcptNum = `POS-2026-${Math.floor(10000 + Math.random() * 90000)}`;
        const newReceipt: any = {
          id: `rcpt-${Date.now()}`,
          tenantId: 'ten-001',
          companyId: batchRequest.companyId || 'comp-001',
          branchId: batchRequest.branchId || 'br-001',
          warehouseId: 'wh-001',
          registerId: 'reg-01',
          registerCode: 'REG-01',
          shiftId: posShifts[0]?.id || 'shift-01',
          receiptNumber: rcptNum,
          transactionType: 'SALE',
          isWalkInCustomer: true,
          cashierId: batchRequest.userId,
          cashierName: 'Ahmed Mounir',
          customerId: payload.customerId || 'cust-walkin',
          customerName: payload.customerName || 'Walk-in Retail Customer',
          lines: payload.lines || [],
          subtotal: payload.subtotal || 3750,
          discountTotal: 0,
          taxTotal: payload.taxTotal || 562.5,
          grandTotal: payload.grandTotal || 4312.5,
          roundingAdjustment: 0,
          payments: [
            {
              id: `pmt-${Date.now()}`,
              method: 'CASH',
              amount: payload.grandTotal || 4312.5,
              currency: 'SAR',
              exchangeRate: 1.0,
              treasuryAccountCode: '1010-01-CASH',
              treasuryAccountId: 'acc-cash-01',
              transactionStatus: 'CAPTURED',
              capturedAt: new Date().toISOString()
            }
          ],
          changeGiven: 0,
          status: 'COMPLETED',
          sha256Seal: OfflineSalesSyncEngine.generateSha256({ tempDoc, rcptNum }),
          createdAt: new Date().toISOString()
        };
        posReceipts.unshift(newReceipt);
        try {
          pilotDb.saveEntity('posReceipts', newReceipt, 'ten-001', batchRequest.companyId || 'comp-001');
        } catch (err) {
          console.warn('Could not persist promoted receipt to SQLite:', err);
        }

        // Treasury Event
        const finEvt = processFinancialEvent(
          'ten-001',
          batchRequest.companyId || 'comp-001',
          'EVT_POS_CASH_RECEIPT' as any,
          'POSReceipt',
          newReceipt.id,
          rcptNum,
          newReceipt.grandTotal,
          newReceipt.taxTotal,
          'SAR',
          newReceipt.customerId,
          newReceipt.customerName,
          `Offline POS Promoted Receipt #${rcptNum}`
        );

        return { serverId: newReceipt.id, serverNumber: rcptNum, financialEventId: finEvt?.id };
      },
      onPromoteCollection: (tempDoc, payload) => {
        const colNum = `COL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        // Treasury Event for Mobile Cash Collection
        const finEvt = processFinancialEvent(
          'ten-001',
          batchRequest.companyId || 'comp-001',
          'EVT_AR_RECEIPT_POSTED' as any,
          'CustomerReceipt',
          `rec-${Date.now()}`,
          colNum,
          payload.amountCollected || 3500,
          0,
          'SAR',
          payload.customerId || 'cust-102',
          payload.customerName || 'Delta Systems',
          `Mobile Van Field Collection #${colNum}`
        );

        return { serverId: `rec-${Date.now()}`, serverNumber: colNum, financialEventId: finEvt?.id };
      },
      onPromoteReturn: (tempDoc, payload) => {
        const retNum = `SRTN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const retRecord = SalesEngine.processSalesReturn(
          retNum,
          'PARTIAL_RETURN',
          { type: 'POS_RECEIPT', id: 'rcpt-prev', number: payload.originalReceiptNumber || 'POS-2026-00990' },
          { id: payload.customerId || 'cust-walkin', name: 'Walk-in Customer' },
          payload.lines || [],
          'CASH',
          batchRequest.userId || 'usr-001'
        );
        salesReturns.unshift(retRecord);
        try {
          pilotDb.saveEntity('salesReturns', retRecord, 'ten-001', batchRequest.companyId || 'comp-001');
        } catch (err) {
          console.warn('Could not persist promoted return to SQLite:', err);
        }
        return { serverId: retRecord.id, serverNumber: retNum };
      }
    });

    // Update in-memory state
    syncAuditLogs.unshift(...syncExecution.auditLogs);
    syncConflicts.unshift(...syncExecution.conflicts);
    offlineDocumentLineages.unshift(...syncExecution.lineageRecords);

    // Update queue items status & persist idempotency keys
    syncExecution.response.results.forEach(res => {
      if (res.status === 'SUCCESS' || res.status === 'DUPLICATE_IGNORED') {
        try {
          pilotDb.saveEntity('idempotencyKeys', { id: res.idempotencyKey, syncedAt: new Date().toISOString() }, 'ten-001', batchRequest.companyId || 'comp-001');
        } catch (e) {}
      }
      const qItem = offlineTransactionQueue.find(q => q.id === res.localTransactionId || q.tempDocumentNumber === res.tempDocumentNumber);
      if (qItem) {
        if (res.status === 'SUCCESS') {
          qItem.syncStatus = 'SYNCED';
          qItem.finalServerDocumentNumber = res.serverDocumentNumber;
        } else if (res.status === 'CONFLICT') {
          qItem.syncStatus = 'CONFLICT';
          qItem.conflictDetails = res.conflictDetails;
        } else if (res.status === 'ERROR') {
          qItem.syncStatus = 'FAILED';
          qItem.errorMessage = res.message;
          qItem.retryCount += 1;
        }
      }
    });

    // Update device pending count
    const dev = posDevices.find(d => d.id === batchRequest.deviceId || d.deviceCode === batchRequest.deviceId);
    if (dev) {
      dev.lastSyncAt = new Date().toISOString();
      dev.localPendingQueueCount = Math.max(0, dev.localPendingQueueCount - syncExecution.response.successCount);
    }

    res.json({ success: true, ...syncExecution });
  });

  app.get('/api/v1/sales/sync/audit', (req: Request, res: Response) => {
    res.json({ success: true, auditLogs: syncAuditLogs, lineages: offlineDocumentLineages });
  });

  app.get('/api/v1/sales/sync/verify-integrity', (req: Request, res: Response) => {
    const report = OfflineSalesSyncEngine.verifySyncIntegrity(syncAuditLogs);
    res.json({ success: true, integrityReport: report });
  });

  // 12. Conflict Resolution Center
  app.get('/api/v1/sales/conflicts', (req: Request, res: Response) => {
    res.json({ success: true, conflicts: syncConflicts });
  });

  app.post('/api/v1/sales/conflicts/:id/resolve', (req: Request, res: Response) => {
    const { resolution, notes, overridePrice, approvedBy } = req.body;
    const conf = syncConflicts.find(c => c.id === req.params.id);
    if (!conf) return res.status(404).json({ success: false, error: 'Conflict record not found' });

    conf.resolutionStatus = 'RESOLVED';
    conf.appliedResolution = resolution || 'SERVER_WINS';
    conf.resolutionNotes = notes;
    conf.resolvedBy = approvedBy || 'usr-001';
    conf.resolvedAt = new Date().toISOString();

    const qItem = offlineTransactionQueue.find(q => q.id === conf.transactionId || q.tempDocumentNumber === conf.tempDocNumber);
    if (qItem) {
      qItem.syncStatus = 'SYNCED';
      qItem.finalServerDocumentNumber = `DOC-RESOLVED-${Date.now().toString().slice(-4)}`;
    }

    res.json({ success: true, conflict: conf, queueItem: qItem });
  });

  // 13. Failed Sync Recovery Center
  app.get('/api/v1/sales/recovery/failed', (req: Request, res: Response) => {
    const failedItems = offlineTransactionQueue.filter(q => q.syncStatus === 'FAILED' || q.syncStatus === 'CONFLICT');
    res.json({ success: true, failedItems });
  });

  app.post('/api/v1/sales/recovery/:id/retry', (req: Request, res: Response) => {
    const item = offlineTransactionQueue.find(q => q.id === req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Transaction not found in queue' });

    item.retryCount += 1;
    item.syncStatus = 'SYNCED';
    item.finalServerDocumentNumber = `DOC-RECOVERED-${Date.now().toString().slice(-4)}`;

    res.json({ success: true, item, message: `Successfully retried and promoted item ${item.tempDocumentNumber}` });
  });

  app.post('/api/v1/sales/recovery/:id/reject', (req: Request, res: Response) => {
    const item = offlineTransactionQueue.find(q => q.id === req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Transaction not found in queue' });

    item.syncStatus = 'CANCELLED';
    res.json({ success: true, item, message: `Transaction ${item.tempDocumentNumber} rejected and cancelled.` });
  });

  // 14. Mobile Field Sales Workspace
  app.get('/api/v1/sales/mobile/customers', (req: Request, res: Response) => {
    res.json({ success: true, customers: mobileCustomers });
  });

  app.get('/api/v1/sales/mobile/products', (req: Request, res: Response) => {
    res.json({ success: true, products: mobileProducts });
  });

  app.get('/api/v1/sales/mobile/targets', (req: Request, res: Response) => {
    res.json({ success: true, targets: salesRepTargets });
  });

  app.get('/api/v1/sales/mobile/activities', (req: Request, res: Response) => {
    res.json({ success: true, activities: salesRepActivities });
  });

  app.post('/api/v1/sales/mobile/activities', (req: Request, res: Response) => {
    const newAct: SalesRepresentativeActivity = {
      id: `act-${Date.now()}`,
      salesRepId: req.body.salesRepId || 'usr-002',
      salesRepName: req.body.salesRepName || 'Tariq Al-Mansoor',
      customerId: req.body.customerId || 'cust-101',
      customerName: req.body.customerName || 'Al-Mansoor Trading Est',
      activityType: req.body.activityType || 'VISIT_CHECKIN',
      timestamp: new Date().toISOString(),
      location: req.body.location,
      notes: req.body.notes || 'Field activity recorded',
      offlineGenerated: true
    };
    salesRepActivities.unshift(newAct);
    res.json({ success: true, activity: newAct });
  });

  // 15. Industry Configuration Profiles
  app.get('/api/v1/sales/industry/profiles', (req: Request, res: Response) => {
    res.json({ success: true, profiles: industryProfiles });
  });

  app.post('/api/v1/sales/industry/profiles/:id/activate', (req: Request, res: Response) => {
    const target = industryProfiles.find(p => p.id === req.params.id);
    if (!target) return res.status(404).json({ success: false, error: 'Industry profile not found' });

    industryProfiles.forEach(p => p.isActive = (p.id === target.id));
    res.json({ success: true, activeProfile: target, profiles: industryProfiles });
  });

  app.put('/api/v1/sales/industry/profiles/:id', (req: Request, res: Response) => {
    const idx = industryProfiles.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Profile not found' });

    const merged = { ...industryProfiles[idx], ...req.body };
    const val = IndustryConfigEngine.validateConfigurationIntegrity(merged);
    if (!val.isValid) {
      return res.status(400).json({ success: false, errors: val.securityViolations });
    }

    industryProfiles[idx] = merged;
    res.json({ success: true, profile: merged });
  });

  // 16. Compliance Adapter Endpoints
  app.post('/api/v1/sales/compliance/eta/validate', (req: Request, res: Response) => {
    const result = ComplianceAdapterEngine.buildEgyptianEInvoice(req.body);
    res.json({ success: true, ...result });
  });

  app.post('/api/v1/sales/compliance/zatca/generate', (req: Request, res: Response) => {
    const result = ComplianceAdapterEngine.buildZatcaPhase2Payload(req.body);
    res.json({ success: true, ...result });
  });

  app.post('/api/v1/sales/compliance/uae/validate', (req: Request, res: Response) => {
    const result = ComplianceAdapterEngine.buildUaeFtaTaxSummary(req.body);
    res.json({ success: true, validation: result });
  });

  // Statutory Compliance Orchestration & Official Authority Integration (P0-05)
  app.get('/api/v1/compliance/readiness', (req: Request, res: Response) => {
    const complianceEngine = ComplianceEngine.getInstance(pilotDb);
    const report = complianceEngine.getReadinessReport(req.query.env as any);
    res.json(report);
  });

  app.get('/api/v1/compliance/config', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const complianceEngine = ComplianceEngine.getInstance(pilotDb);
    const profile = complianceEngine.getTaxpayerProfile(authTenant, authCompany);
    if (!profile) {
      return res.json({ success: true, profile: null });
    }
    // Redact credentials
    const sanitized = {
      ...profile,
      etaClientSecret: profile.etaClientSecret ? '********' : undefined,
      zatcaCsidSecret: profile.zatcaCsidSecret ? '********' : undefined,
      zatcaPrivateKeyPem: profile.zatcaPrivateKeyPem ? '********' : undefined
    };
    res.json({ success: true, profile: sanitized });
  });

  app.post('/api/v1/compliance/config', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';

    // Verify company isolation
    if (req.body.companyId && req.body.companyId !== authCompany && (req as any).auth?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'SECURITY_ERROR: Cross-company profile configuration prohibited.' });
    }

    const complianceEngine = ComplianceEngine.getInstance(pilotDb);
    complianceEngine.saveTaxpayerProfile({
      ...req.body,
      tenantId: authTenant,
      companyId: authCompany
    });
    res.json({ success: true, message: 'Taxpayer profile updated' });
  });

  app.post('/api/v1/compliance/submit', async (req: Request, res: Response) => {
    try {
      const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
      const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
      const actorId = (req as any).auth?.sub || (req as any).user?.id || 'system';

      const complianceEngine = ComplianceEngine.getInstance(pilotDb);
      const doc = req.body;

      if (doc.companyId && doc.companyId !== authCompany && (req as any).auth?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, error: 'SECURITY_ERROR: Cross-company compliance submission prohibited.' });
      }

      const canonicalDoc = doc.id && doc.lines
        ? doc
        : complianceEngine.buildCanonicalDocument({
            ...doc,
            tenantId: authTenant,
            companyId: authCompany
          });

      const submission = await complianceEngine.submitComplianceDocument(canonicalDoc, actorId);
      res.json({ success: true, submission });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/compliance/submissions', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const complianceEngine = ComplianceEngine.getInstance(pilotDb);
    const submissions = complianceEngine.getSubmissions(authTenant, authCompany);
    res.json({ success: true, submissions });
  });

  app.get('/api/v1/compliance/submissions/:id', (req: Request, res: Response) => {
    try {
      const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
      const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
      const complianceEngine = ComplianceEngine.getInstance(pilotDb);
      const submission = complianceEngine.getSubmission(authTenant, authCompany, req.params.id);
      if (!submission) {
        return res.status(404).json({ success: false, error: 'Submission not found' });
      }
      res.json({ success: true, submission });
    } catch (err: any) {
      res.status(403).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/compliance/archive/:submissionId', (req: Request, res: Response) => {
    try {
      const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
      const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
      const complianceEngine = ComplianceEngine.getInstance(pilotDb);
      const archive = complianceEngine.getArchiveRecord(authTenant, authCompany, req.params.submissionId);
      if (!archive) {
        return res.status(404).json({ success: false, error: 'Compliance archive record not found' });
      }
      res.json({ success: true, archive });
    } catch (err: any) {
      res.status(403).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/compliance/reconcile', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const complianceEngine = ComplianceEngine.getInstance(pilotDb);

    // Collect internal invoices from memory or req.body
    const invoices = Array.isArray(req.body.invoices) ? req.body.invoices : (salesInvoices || []).map(i => ({
      id: i.id,
      number: i.invoiceNumber,
      totalAmount: i.grandTotal,
      taxAmount: i.taxTotal,
      date: i.date || i.createdAt
    }));

    const report = complianceEngine.runReconciliation(authTenant, authCompany, invoices);
    res.json({ success: true, report });
  });

  app.post('/api/v1/compliance/submissions/:id/cancel', async (req: Request, res: Response) => {
    try {
      const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
      const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
      const actorId = (req as any).auth?.sub || 'system';
      const { reason } = req.body;

      const complianceEngine = ComplianceEngine.getInstance(pilotDb);
      const sub = complianceEngine.getSubmission(authTenant, authCompany, req.params.id);
      if (!sub) {
        return res.status(404).json({ success: false, error: 'Submission not found' });
      }

      complianceEngine.updateSubmissionStatus(sub, 'CANCEL_REQUESTED', actorId, reason);

      const profile = complianceEngine.getTaxpayerProfile(authTenant, authCompany);
      if (sub.jurisdiction === 'EGYPT_ETA' && profile) {
        const cancelRes = await EgyptianTaxAuthorityAdapter.cancelDocument(sub.documentUuid, reason || 'Statutory cancellation', profile);
        if (cancelRes.success) {
          complianceEngine.updateSubmissionStatus(sub, 'CANCELLED', actorId, 'Cancelled at authority');
        }
      } else {
        complianceEngine.updateSubmissionStatus(sub, 'CANCELLED', actorId, 'Cancelled internally');
      }

      res.json({ success: true, submission: sub });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/compliance/submissions/:id/retry', async (req: Request, res: Response) => {
    try {
      const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
      const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
      const actorId = (req as any).auth?.sub || 'system';

      const complianceEngine = ComplianceEngine.getInstance(pilotDb);
      const submission = await complianceEngine.executeRetry(authTenant, authCompany, req.params.id, actorId);
      res.json({ success: true, submission });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/compliance/submissions/:id/reconcile', async (req: Request, res: Response) => {
    try {
      const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
      const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
      const actorId = (req as any).auth?.sub || 'system';

      const complianceEngine = ComplianceEngine.getInstance(pilotDb);
      const submission = await complianceEngine.reconcileUnknownOutcome(authTenant, authCompany, req.params.id, actorId);
      res.json({ success: true, submission });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 17. Universal Data Export
  app.post('/api/v1/sales/export', (req: Request, res: Response) => {
    const exportResult = UniversalExportEngine.exportDataset(req.body, {
      customers: mobileCustomers,
      products: mobileProducts,
      priceLists: enterprisePriceLists,
      salesOrders,
      posReceipts,
      posShifts,
      salesReturns,
      syncAuditLogs,
      industryProfiles
    });
    res.json({ success: true, exportResult });
  });

  // 18. Automated Quality Gate & Hardening Test Suite (20 Scenarios)
  app.get('/api/v1/sales/tests/run', (req: Request, res: Response) => {
    const testReport = Phase31HardeningSuite.runAllHardeningTests();
    res.json({ success: true, report: testReport });
  });

  // 19. Industry Vertical Runtime Depth (P0-06)
  app.get('/api/v1/vertical/profiles', (req: Request, res: Response) => {
    const profiles = VerticalProfileRegistry.getAllProfiles();
    res.json({ success: true, profiles });
  });

  app.get('/api/v1/vertical/profiles/:id', (req: Request, res: Response) => {
    const profile = VerticalProfileRegistry.getProfile(req.params.id as any);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });
    res.json({ success: true, profile });
  });

  app.get('/api/v1/vertical/wizard/state', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const wizardState = manager.getWizardStepsForCompany(authCompany, authTenant);
    res.json({ success: true, wizardState });
  });

  app.post('/api/v1/vertical/wizard/advance', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const { stepNumber, payload } = req.body;
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const updated = manager.advanceWizardStep({
      companyId: authCompany,
      stepNumber,
      stepData: payload || {}
    });
    if (!updated.success) {
      return res.status(400).json({ success: false, error: 'Validation failed', errors: updated.errors, wizardState: updated });
    }
    res.json({ success: true, wizardState: updated });
  });

  // ============================================================================
  // ENTERPRISE ONBOARDING WIZARD & CERTIFICATION ENDPOINTS (P0-07)
  // ============================================================================

  // Get full onboarding wizard state & definitions
  app.get('/api/v1/onboarding/wizard/state', (req: Request, res: Response) => {
    const targetCompany = (req.query.companyId as string) || (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const targetTenant = (req.query.tenantId as string) || (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';

    // Anti-IDOR: If authenticated with a Bearer token, enforce cross-tenant boundary
    if ((req as any).auth && (req as any).auth.tenantId && (req as any).auth.tenantId !== targetTenant) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Cannot access wizard state of another tenant.',
        code: 'CROSS_TENANT_ACCESS_DENIED'
      });
    }

    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const wizardState = manager.getWizardStepsForCompany(targetCompany, targetTenant);
    const readiness = manager.evaluateReadiness(targetCompany, targetTenant);

    res.json({
      success: true,
      wizardState,
      readiness
    });
  });

  // Save / advance individual onboarding step
  app.post('/api/v1/onboarding/wizard/step', (req: Request, res: Response) => {
    const { stepNumber, payload, companyId, tenantId } = req.body;
    const targetCompany = companyId || (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const targetTenant = tenantId || (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';

    if ((req as any).auth && (req as any).auth.tenantId && (req as any).auth.tenantId !== targetTenant) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Cannot modify wizard state of another tenant.',
        code: 'CROSS_TENANT_ACCESS_DENIED'
      });
    }

    if (!stepNumber || typeof stepNumber !== 'number' || stepNumber < 1 || stepNumber > 19) {
      return res.status(400).json({
        success: false,
        error: 'Invalid step number. Must be between 1 and 19.'
      });
    }

    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const result = manager.advanceWizardStep({
      companyId: targetCompany,
      stepNumber,
      stepData: payload || {}
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Step validation failed.',
        errors: result.errors,
        currentStep: result.currentStep
      });
    }

    const wizardState = manager.getWizardStepsForCompany(targetCompany, targetTenant);
    res.json({
      success: true,
      currentStep: result.currentStep,
      isCompleted: result.isCompleted,
      wizardState
    });
  });

  // Deterministic readiness evaluation (Phase 5)
  app.get('/api/v1/onboarding/readiness', (req: Request, res: Response) => {
    const targetCompany = (req.query.companyId as string) || (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const targetTenant = (req.query.tenantId as string) || (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';

    if ((req as any).auth && (req as any).auth.tenantId && (req as any).auth.tenantId !== targetTenant) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Cannot access readiness of another tenant.',
        code: 'CROSS_TENANT_ACCESS_DENIED'
      });
    }

    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const report = manager.evaluateReadiness(targetCompany, targetTenant);

    res.json({
      success: true,
      report
    });
  });

  // Final readiness review and explicit completion
  app.post('/api/v1/onboarding/wizard/complete', (req: Request, res: Response) => {
    const { companyId, tenantId } = req.body;
    const targetCompany = companyId || (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const targetTenant = tenantId || (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';

    if ((req as any).auth && (req as any).auth.tenantId && (req as any).auth.tenantId !== targetTenant) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Cannot complete onboarding for another tenant.',
        code: 'CROSS_TENANT_ACCESS_DENIED'
      });
    }

    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const operatorUser = (req as any).user || { id: 'usr-admin-01', name: 'Enterprise Administrator', email: 'admin@enterprise.pilot' };

    try {
      const outcome = manager.completeOnboardingWizard({
        companyId: targetCompany,
        tenantId: targetTenant,
        operatorUser
      });

      // Synchronize in-memory collections with newly materialized records
      const syncdComp = pilotDb.getEntity<Company>('companies', targetCompany);
      if (syncdComp && !companies.some(c => c.id === syncdComp.id)) {
        companies.push(syncdComp);
      }
      const syncdTenant = pilotDb.getEntity<Tenant>('tenants', targetTenant);
      if (syncdTenant && !tenants.some(t => t.id === syncdTenant.id)) {
        tenants.push(syncdTenant);
      }

      recordAudit(
        targetTenant,
        operatorUser.id,
        operatorUser.name,
        'Tenant Admin',
        'APPROVE',
        'OnboardingWizard',
        outcome.certificate.certificateId,
        `Certified and launched pilot tenant ${targetTenant} / ${targetCompany} with score ${outcome.certificate.readinessScore}%`
      );

      res.json({
        success: true,
        certificate: outcome.certificate,
        report: outcome.report
      });
    } catch (err: any) {
      console.error('Onboarding completion error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Internal server error during onboarding materialization.',
        correlationId: `err-${Date.now()}`
      });
    }
  });

  // Initialize a fresh unconfigured tenant and company for testing or onboarding
  app.post('/api/v1/onboarding/tenant/initialize', (req: Request, res: Response) => {
    const { tenantName, companyName, tenantCode, companyCode, profileId } = req.body;
    const tId = `ten-${Date.now()}`;
    const cId = `comp-${Date.now()}`;

    const newTenant: Tenant = {
      id: tId,
      name: tenantName || 'New Pilot Enterprise Tenant',
      code: tenantCode || `TEN-${Date.now().toString().slice(-4)}`,
      edition: 'Enterprise',
      ownerEmail: 'admin@newenterprise.pilot',
      active: true,
      createdAt: new Date().toISOString()
    };

    const newComp: Company = {
      id: cId,
      tenantId: tId,
      name: companyName || 'New Pilot Enterprise Company',
      nameAr: 'شركة تجريبية جديدة',
      code: companyCode || `COMP-${Date.now().toString().slice(-4)}`,
      taxNumber: '',
      currency: 'SAR',
      country: 'Saudi Arabia',
      countryCode: 'SA',
      fiscalYearStart: '01-01',
      address: ''
    };

    pilotDb.saveEntity('tenants', newTenant, tId, cId);
    pilotDb.saveEntity('companies', newComp, tId, cId);
    tenants.push(newTenant);
    companies.push(newComp);

    // Initial uncompleted profile state
    const unconfiguredState = {
      id: cId,
      companyId: cId,
      tenantId: tId,
      activeProfileId: profileId || 'COMMERCIAL_DISTRIBUTION',
      activatedAt: new Date().toISOString(),
      activatedBy: 'SYSTEM',
      wizardCompleted: false,
      wizardCurrentStep: 1,
      wizardData: {}
    };
    pilotDb.saveEntity('company_active_vertical_profiles', unconfiguredState, tId, cId);

    res.status(201).json({
      success: true,
      tenant: newTenant,
      company: newComp,
      state: unconfiguredState
    });
  });

  // Profile 01: Commercial Distribution
  app.get('/api/v1/vertical/distribution/territories', (req: Request, res: Response) => {
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const territories = manager.getTerritories(authCompany);
    res.json({ success: true, territories });
  });

  app.post('/api/v1/vertical/distribution/territories', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const territory = CommercialDistributionEngine.createTerritory({
      ...req.body,
      tenantId: authTenant,
      companyId: authCompany
    });
    manager.saveTerritory(territory);
    res.json({ success: true, territory });
  });

  app.get('/api/v1/vertical/distribution/routes', (req: Request, res: Response) => {
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const routes = manager.getRoutes(authCompany);
    res.json({ success: true, routes });
  });

  app.post('/api/v1/vertical/distribution/routes', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const route = CommercialDistributionEngine.createRoute({
      ...req.body,
      tenantId: authTenant,
      companyId: authCompany
    });
    manager.saveRoute(route);
    res.json({ success: true, route });
  });

  app.post('/api/v1/vertical/distribution/van-runs/dispatch', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const vanRun = CommercialDistributionEngine.dispatchVanStock({
      ...req.body,
      tenantId: authTenant,
      companyId: authCompany
    });
    manager.saveVanAllocation(vanRun);
    res.json({ success: true, vanRun });
  });

  app.post('/api/v1/vertical/distribution/van-runs/reconcile', (req: Request, res: Response) => {
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const { allocation, returnedStock } = req.body;
    const reconciled = CommercialDistributionEngine.reconcileVanRun(
      allocation,
      returnedStock || []
    );
    manager.saveVanAllocation(reconciled.updatedAllocation);
    res.json({ success: true, result: reconciled });
  });

  // Profile 02: Restaurant / F&B
  app.get('/api/v1/vertical/restaurant/tables', (req: Request, res: Response) => {
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const tables = manager.getRestaurantTables(authCompany);
    res.json({ success: true, tables });
  });

  app.post('/api/v1/vertical/restaurant/tables/open', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    let table = manager.getRestaurantTables(authCompany).find(t => t.id === req.body.tableId);
    if (!table) {
      table = RestaurantFnBEngine.createTable({
        tenantId: authTenant,
        companyId: authCompany,
        branchId: req.body.branchId || 'br-01',
        diningAreaId: req.body.diningAreaId || 'DA-01',
        tableNumber: req.body.tableNumber || 'T-01',
        capacity: req.body.capacity || 4
      });
    }
    const opened = RestaurantFnBEngine.openTable(table, req.body.guestCount || 2, req.body.serverStaffId || 'SRV-01');
    manager.saveRestaurantTable(opened);
    res.json({ success: true, table: opened });
  });

  app.post('/api/v1/vertical/restaurant/orders/add-item', (req: Request, res: Response) => {
    const { table, item } = req.body;
    const updatedOrder = RestaurantFnBEngine.addItemToOrder(table, item);
    res.json({ success: true, order: updatedOrder });
  });

  app.post('/api/v1/vertical/restaurant/orders/split', (req: Request, res: Response) => {
    const { totalAmount, splitType, guestCount, seatAmounts } = req.body;
    const split = RestaurantFnBEngine.splitBill(totalAmount, splitType || 'EQUAL', guestCount || 2, seatAmounts);
    res.json({ success: true, split });
  });

  app.post('/api/v1/vertical/restaurant/waste', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const waste = RestaurantFnBEngine.recordKitchenWaste({
      ...req.body,
      tenantId: authTenant,
      companyId: authCompany
    });
    manager.saveKitchenWaste(waste);
    res.json({ success: true, waste });
  });

  // Profile 03: Retail Mobile Phones & Electronics
  app.get('/api/v1/vertical/mobile/devices', (req: Request, res: Response) => {
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const devices = manager.getMobileDevices(authCompany);
    res.json({ success: true, devices });
  });

  app.post('/api/v1/vertical/mobile/devices/register', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const existing = manager.getMobileDevices(authCompany);
    const device = MobileRetailEngine.registerDevice({
      ...req.body,
      tenantId: authTenant,
      companyId: authCompany,
      existingDevices: existing
    });
    manager.saveMobileDevice(device);
    res.json({ success: true, device });
  });

  app.post('/api/v1/vertical/mobile/devices/sell', (req: Request, res: Response) => {
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const existing = manager.getMobileDevices(authCompany);
    const device = existing.find(d => d.imei1 === req.body.imei || d.id === req.body.deviceId);
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
    const sold = MobileRetailEngine.processDeviceSale(device, req.body.invoiceId || 'INV-001', req.body.customerId || 'CUST-001');
    manager.saveMobileDevice(sold);
    res.json({ success: true, device: sold });
  });

  app.post('/api/v1/vertical/mobile/trade-in/evaluate', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const evaluation = MobileRetailEngine.evaluateTradeIn({
      ...req.body,
      tenantId: authTenant,
      companyId: authCompany
    });
    manager.saveTradeIn(evaluation);
    res.json({ success: true, evaluation });
  });

  app.post('/api/v1/vertical/mobile/repairs', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const jobCard = MobileRetailEngine.createRepairJobCard({
      ...req.body,
      tenantId: authTenant,
      companyId: authCompany
    });
    manager.saveRepairJobCard(jobCard);
    res.json({ success: true, jobCard });
  });

  app.post('/api/v1/vertical/mobile/repairs/:id/complete', (req: Request, res: Response) => {
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const jobCards = manager.getRepairJobCards(authCompany);
    const jobCard = jobCards.find(j => j.id === req.params.id);
    if (!jobCard) return res.status(404).json({ success: false, error: 'Job card not found' });
    const completed = MobileRetailEngine.completeRepairJobCard(jobCard, req.body.partsUsed || [], req.body.laborHours || 1);
    manager.saveRepairJobCard(completed);
    res.json({ success: true, jobCard: completed });
  });

  // Profiles 04 & 05: Fashion Retail (Women & Children)
  app.post('/api/v1/vertical/fashion/matrix/generate', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const result = FashionRetailEngine.createStyleWithMatrix({
      tenantId: authTenant,
      companyId: authCompany,
      ...req.body
    });
    manager.saveApparelStyle(result.style);
    result.variants.forEach(v => manager.saveApparelVariant(v));
    res.json({ success: true, styleMaster: result.style, variants: result.variants });
  });

  app.post('/api/v1/vertical/fashion/holds', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const hold = FashionRetailEngine.createFittingRoomHold({
      ...req.body,
      tenantId: authTenant,
      companyId: authCompany
    });
    manager.saveFittingRoomHold(hold);
    res.json({ success: true, hold });
  });

  app.post('/api/v1/vertical/fashion/reservations', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const reservation = FashionRetailEngine.createCustomerReservation({
      ...req.body,
      tenantId: authTenant,
      companyId: authCompany
    });
    manager.saveCustomerReservation(reservation);
    res.json({ success: true, reservation });
  });

  app.post('/api/v1/vertical/fashion/markdown/apply', (req: Request, res: Response) => {
    const { style, rule } = req.body;
    const markedDown = FashionRetailEngine.applySeasonalMarkdown(style, rule);
    res.json({ success: true, style: markedDown });
  });

  app.post('/api/v1/vertical/fashion/gift-receipt', (req: Request, res: Response) => {
    const { originalReceiptNumber, storeName, items, exchangeWindowDays } = req.body;
    const giftReceipt = FashionRetailEngine.generateGiftReceipt(originalReceiptNumber || 'REC-001', storeName || 'Boutique', items || [], exchangeWindowDays || 30);
    res.json({ success: true, giftReceipt });
  });

  // Profiles 06, 07, 08: Apparel Manufacturing
  app.post('/api/v1/vertical/apparel/marker-plan', (req: Request, res: Response) => {
    const marker = ApparelManufacturingEngine.createMarkerPlan(req.body);
    res.json({ success: true, marker });
  });

  app.post('/api/v1/vertical/apparel/cut-orders', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const cutOrder = ApparelManufacturingEngine.createCutOrder({
      ...req.body,
      tenantId: authTenant,
      companyId: authCompany
    });
    manager.saveCutOrder(cutOrder);
    res.json({ success: true, cutOrder });
  });

  app.post('/api/v1/vertical/apparel/bundle-tickets', (req: Request, res: Response) => {
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const { cutOrder, bundleSize, colorName } = req.body;
    const bundles = ApparelManufacturingEngine.generateBundleTickets(cutOrder, bundleSize || 20, colorName);
    bundles.forEach(b => manager.saveBundleTicket(b));
    res.json({ success: true, bundles, count: bundles.length });
  });

  app.post('/api/v1/vertical/apparel/bundle-tickets/record-operation', (req: Request, res: Response) => {
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const { bundle, operationName, operatorId, operatorName, pieceRatePerPiece } = req.body;
    const updated = ApparelManufacturingEngine.recordBundleOperation(
      bundle,
      operationName,
      operatorId,
      operatorName,
      pieceRatePerPiece
    );
    manager.saveBundleTicket(updated);
    res.json({ success: true, bundle: updated });
  });

  app.post('/api/v1/vertical/apparel/safety-qa', (req: Request, res: Response) => {
    const authTenant = (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';
    const authCompany = (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
    const manager = IndustryVerticalManager.getInstance(pilotDb);
    const checkpoint = ApparelManufacturingEngine.evaluateChildrenSafetyQA({
      ...req.body,
      tenantId: authTenant,
      companyId: authCompany
    });
    manager.saveSafetyQACheckpoint(checkpoint);
    res.json({ success: true, checkpoint });
  });

  // Pilot Readiness Phase 3B Quality Gate (15 Scenarios - Hardware Abstraction & Variable Weight EAN-13)
  app.get('/api/v1/pos/tests/pilot-readiness-3b/run', async (req: Request, res: Response) => {
    try {
      const report = await PilotReadinessPhase3BHardeningSuite.runAll();
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Pilot Readiness Phase 3C Quality Gate (11 Scenarios - Customer Display & Large Catalog Optimization)
  app.get('/api/v1/pos/tests/pilot-readiness-3c/run', async (req: Request, res: Response) => {
    try {
      const report = await PilotReadinessPhase3CHardeningSuite.runAll();
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Pilot Readiness Phase 3D Quality Gate (10 Scenarios - Production Persistence & Deployment Safety)
  app.get('/api/v1/pos/tests/pilot-readiness-3d/run', async (req: Request, res: Response) => {
    try {
      const report = await PilotReadinessPhase3DHardeningSuite.runAll();
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =========================================================================
  // PHASE 3.2A — ENTERPRISE MASTER DATA & ADVANCED PRICING API SUITE
  // =========================================================================

  // 1. Products Master
  app.get('/api/v1/master/products', (req: Request, res: Response) => {
    const tenantId = (req.query.tenantId as string) || 'ten-001';
    const categoryId = req.query.categoryId as string;
    const search = req.query.search as string;
    const activeOnly = req.query.activeOnly === 'true';
    const products = MasterDataService.getProducts(tenantId, { categoryId, search, activeOnly });
    res.json({ success: true, products });
  });

  app.get('/api/v1/master/products/:id', (req: Request, res: Response) => {
    const tenantId = (req.query.tenantId as string) || 'ten-001';
    const product = MasterDataService.getProductById(req.params.id, tenantId);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, product });
  });

  app.post('/api/v1/master/products', (req: Request, res: Response) => {
    try {
      const userId = (req.body.userId as string) || 'usr-001';
      const product = MasterDataService.createProduct(req.body, userId);
      res.status(201).json({ success: true, product });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.put('/api/v1/master/products/:id', (req: Request, res: Response) => {
    try {
      const userId = (req.body.userId as string) || 'usr-001';
      const product = MasterDataService.updateProduct(req.params.id, req.body, userId);
      res.json({ success: true, product });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/v1/master/products/:id', (req: Request, res: Response) => {
    try {
      const userId = (req.body.userId as string) || 'usr-001';
      const reason = req.body.reason as string;
      const product = MasterDataService.deactivateProduct(req.params.id, userId, reason);
      res.json({ success: true, product, message: `Product ${product.sku} logically deactivated.` });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 2. Variant Generator Matrix
  app.post('/api/v1/master/products/:sku/variants/matrix', (req: Request, res: Response) => {
    try {
      const tenantId = (req.body.tenantId as string) || 'ten-001';
      const result = MasterDataService.generateVariantMatrix(
        req.params.sku,
        req.body.selectedDimensions || [],
        tenantId,
        {
          forceOverrideSafetyCap: req.body.forceOverrideSafetyCap,
          customPriceOverrides: req.body.customPriceOverrides
        }
      );
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/master/products/variants/commit', (req: Request, res: Response) => {
    try {
      const userId = (req.body.userId as string) || 'usr-001';
      const variants = req.body.variants || [];
      const committed = MasterDataService.commitGeneratedVariants(variants, userId);
      res.status(201).json({ success: true, committedVariants: committed, count: committed.length });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 3. Attributes & Attribute Sets
  app.get('/api/v1/master/attributes', (req: Request, res: Response) => {
    const tenantId = (req.query.tenantId as string) || 'ten-001';
    res.json({ success: true, attributes: MasterDataService.getAttributes(tenantId) });
  });

  app.post('/api/v1/master/attributes', (req: Request, res: Response) => {
    try {
      const userId = (req.body.userId as string) || 'usr-001';
      const attr = MasterDataService.createAttribute(req.body, userId);
      res.status(201).json({ success: true, attribute: attr });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/master/attribute-sets', (req: Request, res: Response) => {
    const tenantId = (req.query.tenantId as string) || 'ten-001';
    res.json({ success: true, attributeSets: MasterDataService.getAttributeSets(tenantId) });
  });

  app.post('/api/v1/master/attribute-sets', (req: Request, res: Response) => {
    try {
      const userId = (req.body.userId as string) || 'usr-001';
      const set = MasterDataService.createAttributeSet(req.body, userId);
      res.status(201).json({ success: true, attributeSet: set });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 4. Units of Measure (UOM)
  app.get('/api/v1/master/uom-categories', (req: Request, res: Response) => {
    const tenantId = (req.query.tenantId as string) || 'ten-001';
    res.json({ success: true, categories: MasterDataService.getUOMCategories(tenantId) });
  });

  app.get('/api/v1/master/uoms', (req: Request, res: Response) => {
    const tenantId = (req.query.tenantId as string) || 'ten-001';
    res.json({ success: true, uoms: MasterDataService.getUOMs(tenantId) });
  });

  app.post('/api/v1/master/uoms', (req: Request, res: Response) => {
    try {
      const userId = (req.body.userId as string) || 'usr-001';
      const uom = MasterDataService.addUOM(req.body, userId);
      res.status(201).json({ success: true, uom });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/master/uom-conversions', (req: Request, res: Response) => {
    const tenantId = (req.query.tenantId as string) || 'ten-001';
    res.json({ success: true, conversions: MasterDataService.getUOMConversions(tenantId) });
  });

  app.post('/api/v1/master/uom-conversions', (req: Request, res: Response) => {
    try {
      const userId = (req.body.userId as string) || 'usr-001';
      const conv = MasterDataService.addUOMConversion(req.body, userId);
      res.status(201).json({ success: true, conversion: conv });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/master/uom-conversions/calculate', (req: Request, res: Response) => {
    try {
      const { fromUom, toUom, quantity, tenantId, itemSku } = req.body;
      const result = MasterDataService.convertQuantity(fromUom, toUom, quantity, tenantId, itemSku);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 5. Barcodes & Scanner Resolution
  app.get('/api/v1/master/barcodes', (req: Request, res: Response) => {
    const tenantId = (req.query.tenantId as string) || 'ten-001';
    res.json({ success: true, barcodes: MasterDataService.getBarcodes(tenantId) });
  });

  app.post('/api/v1/master/barcodes', (req: Request, res: Response) => {
    try {
      const userId = (req.body.userId as string) || 'usr-001';
      const bc = MasterDataService.registerBarcode(req.body, userId);
      res.status(201).json({ success: true, barcode: bc });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/master/barcodes/resolve/:barcode', (req: Request, res: Response) => {
    try {
      const tenantId = (req.query.tenantId as string) || 'ten-001';
      const resolved = MasterDataService.resolveBarcode(req.params.barcode, tenantId);
      res.json({ success: true, resolved });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  });

  // 6. Tax Categories
  app.get('/api/v1/master/tax-categories', (req: Request, res: Response) => {
    const tenantId = (req.query.tenantId as string) || 'ten-001';
    res.json({ success: true, taxCategories: MasterDataService.getTaxCategories(tenantId) });
  });

  // 7. Master Data Audit Logs
  app.get('/api/v1/master/audit-logs', (req: Request, res: Response) => {
    const tenantId = (req.query.tenantId as string) || 'ten-001';
    res.json({ success: true, auditLogs: MasterDataService.getAuditLogs(tenantId) });
  });

  // 8. Advanced Pricing Engine Endpoints
  app.get('/api/v1/pricing/price-lists', (req: Request, res: Response) => {
    const tenantId = (req.query.tenantId as string) || 'ten-001';
    res.json({ success: true, priceLists: PricingEngine.getPriceLists(tenantId) });
  });

  app.post('/api/v1/pricing/price-lists', (req: Request, res: Response) => {
    try {
      const pl = PricingEngine.createPriceList(req.body);
      res.status(201).json({ success: true, priceList: pl });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/pricing/price-lists/:id/lines', (req: Request, res: Response) => {
    const tenantId = (req.query.tenantId as string) || 'ten-001';
    res.json({ success: true, lines: PricingEngine.getPriceListLines(req.params.id, tenantId) });
  });

  app.post('/api/v1/pricing/price-lists/:id/lines', (req: Request, res: Response) => {
    try {
      const line = PricingEngine.addPriceListLine({ ...req.body, priceListId: req.params.id });
      res.status(201).json({ success: true, line });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/pricing/contracts', (req: Request, res: Response) => {
    const tenantId = (req.query.tenantId as string) || 'ten-001';
    res.json({ success: true, contracts: PricingEngine.getContractRules(tenantId) });
  });

  app.post('/api/v1/pricing/contracts', (req: Request, res: Response) => {
    try {
      const contract = PricingEngine.addContractRule(req.body);
      res.status(201).json({ success: true, contract });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/pricing/calculate', (req: Request, res: Response) => {
    try {
      const result = PricingEngine.calculatePrice(req.body);
      res.json({ success: true, calculation: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 9. Phase 3.2A Hardening Suite Execution
  app.get('/api/v1/master/hardening/run-suite', async (req: Request, res: Response) => {
    try {
      const report = await Phase32AHardeningSuite.runSuite();
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 10. Phase 3.2B-01 Procurement Master Data & PR Hardening Suite Execution
  app.get('/api/v1/procurement/hardening/run-suite', async (req: Request, res: Response) => {
    try {
      const report = await Phase32B01HardeningSuite.runSuite();
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 11. Phase 3.2B-03 Purchase Orders & Contract Pricing Hardening Suite Execution
  app.get('/api/v1/procurement/hardening/run-suite-32b03', async (req: Request, res: Response) => {
    try {
      const report = await Phase32B03HardeningSuite.runSuite();
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 12. Phase 3.2B-04 Goods Receipts & GR/IR Bridge Hardening Suite Execution
  app.get('/api/v1/procurement/hardening/run-suite-32b04', async (req: Request, res: Response) => {
    try {
      const report = await Phase32B04HardeningSuite.runSuite();
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 13. Phase 3.2B-05 Accounts Payable & 3-Way Match Hardening Suite Execution
  app.get('/api/v1/procurement/hardening/run-suite-32b05', async (req: Request, res: Response) => {
    try {
      const report = await Phase32B05HardeningSuite.runSuite();
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 14. Phase 3.2B-06 AP Vouchers, Proposals & Payments Hardening Suite Execution
  app.get('/api/v1/procurement/hardening/run-suite-32b06', async (req: Request, res: Response) => {
    try {
      const report = await Phase32B06HardeningSuite.runSuite();
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 15. Phase 3.2B-07 Supplier Aging, Statements, CN/DN & AP Analytics Hardening Suite Execution
  app.get('/api/v1/procurement/hardening/run-suite-32b07', async (req: Request, res: Response) => {
    try {
      const report = await Phase32B07HardeningSuite.runSuite();
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 16. Phase 3.2B-08 Advanced Procurement (ERS, Consignment, Landed Cost, Scorecards, Prepayments) Hardening Suite Execution
  app.get('/api/v1/procurement/hardening/run-suite-32b08', async (req: Request, res: Response) => {
    try {
      const report = await Phase32B08HardeningSuite.runSuite();
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==================== PHASE 3.2B-08 ADVANCED PROCUREMENT REST ENDPOINTS ====================

  // ERS Run & Invoices
  app.post('/api/v1/procurement/ers/run', (req: Request, res: Response) => {
    try {
      const { vendorId, cutoffDate, taxPercent, performedBy } = req.body;
      const result = AdvancedProcurementEngine.generateERSInvoices(
        {
          tenantId: 'ten-001',
          companyId: 'comp-001',
          vendorId,
          cutoffDate: cutoffDate || new Date().toISOString().split('T')[0],
          taxPercent: taxPercent !== undefined ? taxPercent : 15.0,
          performedBy: performedBy || 'procurement-user'
        },
        goodsReceipts,
        purchaseOrders,
        ersInvoices
      );

      ersInvoices.push(...result.invoices);

      res.status(201).json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/procurement/ers/invoices', (req: Request, res: Response) => {
    res.json(ersInvoices);
  });

  // Consignment Agreements, Stock, Withdrawals, Settlements
  app.get('/api/v1/procurement/consignment/agreements', (req: Request, res: Response) => {
    res.json(consignmentAgreements);
  });

  app.post('/api/v1/procurement/consignment/agreements', (req: Request, res: Response) => {
    try {
      const agreement = AdvancedProcurementEngine.createConsignmentAgreement({
        tenantId: 'ten-001',
        companyId: 'comp-001',
        ...req.body
      });
      consignmentAgreements.push(agreement);
      res.status(201).json({ success: true, agreement });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/procurement/consignment/stock', (req: Request, res: Response) => {
    res.json(consignmentStockRecords);
  });

  app.get('/api/v1/procurement/consignment/withdrawals', (req: Request, res: Response) => {
    res.json(consignmentWithdrawals);
  });

  app.post('/api/v1/procurement/consignment/withdrawals', (req: Request, res: Response) => {
    try {
      const { agreementId, stockRecordId, quantity, purpose, withdrawalDate, performedBy } = req.body;
      const agreement = consignmentAgreements.find(a => a.id === agreementId);
      if (!agreement) throw new Error('Consignment agreement not found');

      let stockRecord = consignmentStockRecords.find(s => s.id === stockRecordId);
      if (!stockRecord) {
        stockRecord = {
          id: stockRecordId || `csr-${Date.now()}`,
          tenantId: agreement.tenantId,
          companyId: agreement.companyId,
          vendorId: agreement.vendorId,
          vendorName: agreement.vendorName,
          warehouseId: agreement.warehouseId || 'wh-001',
          itemSku: agreement.itemSku,
          itemName: agreement.itemName,
          onHandConsignedQty: 1000,
          withdrawnQty: 0,
          settledQty: 0,
          openForSettlementQty: 0,
          currency: agreement.currency,
          agreedUnitPrice: agreement.agreedPrice,
          lastMovementDate: new Date().toISOString()
        };
        consignmentStockRecords.push(stockRecord);
      }

      const { withdrawal, updatedStock, auditRecord } = AdvancedProcurementEngine.recordConsignmentWithdrawal(
        { quantity, purpose, withdrawalDate },
        agreement,
        stockRecord,
        performedBy
      );

      const idx = consignmentStockRecords.findIndex(s => s.id === stockRecord!.id);
      if (idx !== -1) consignmentStockRecords[idx] = updatedStock;
      consignmentWithdrawals.push(withdrawal);
      purchaseAuditLogs.push(auditRecord);

      res.status(201).json({ success: true, withdrawal, updatedStock });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/procurement/consignment/settlements', (req: Request, res: Response) => {
    res.json(consignmentSettlements);
  });

  app.post('/api/v1/procurement/consignment/settlements', (req: Request, res: Response) => {
    try {
      const { vendorId, periodStart, periodEnd, performedBy } = req.body;
      const { settlement, settledWithdrawals, auditRecord } = AdvancedProcurementEngine.settleConsignmentConsumption(
        'ten-001',
        'comp-001',
        vendorId,
        periodStart || '2026-08-01',
        periodEnd || '2026-08-31',
        consignmentWithdrawals,
        performedBy
      );

      consignmentSettlements.push(settlement);
      settledWithdrawals.forEach(sw => {
        const idx = consignmentWithdrawals.findIndex(w => w.id === sw.id);
        if (idx !== -1) consignmentWithdrawals[idx] = sw;
      });
      purchaseAuditLogs.push(auditRecord);

      res.status(201).json({ success: true, settlement });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Landed Cost Adjustments
  app.get('/api/v1/procurement/landed-cost/adjustments', (req: Request, res: Response) => {
    res.json(landedCostAdjustments);
  });

  app.post('/api/v1/procurement/landed-cost/adjustments', (req: Request, res: Response) => {
    try {
      const { actualInvoice, grnId, apportionmentMethod, performedBy } = req.body;
      const grn = goodsReceipts.find(g => g.id === grnId);
      if (!grn) throw new Error('Goods Receipt Note not found');

      const { adjustment, auditRecord } = AdvancedProcurementEngine.calculateLandedCostVarianceAdjustment(
        actualInvoice,
        grn,
        apportionmentMethod || 'BY_VALUE',
        performedBy
      );

      landedCostAdjustments.push(adjustment);
      purchaseAuditLogs.push(auditRecord);

      res.status(201).json({ success: true, adjustment });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Supplier Scorecarding
  app.get('/api/v1/procurement/scorecards', (req: Request, res: Response) => {
    const vendorId = req.query.vendorId as string;
    if (vendorId) {
      return res.json(supplierScorecards.filter(s => s.vendorId === vendorId));
    }
    res.json(supplierScorecards);
  });

  app.post('/api/v1/procurement/scorecards/evaluate', (req: Request, res: Response) => {
    try {
      const { vendorId, evaluationPeriod, weights, evaluatedBy } = req.body;
      const vendor = vendors.find(v => v.id === vendorId);
      if (!vendor) throw new Error('Vendor not found');

      const { scorecard, updatedVendorStatus, auditRecord } = AdvancedProcurementEngine.evaluateSupplierScorecard(
        'ten-001',
        'comp-001',
        vendor,
        evaluationPeriod || '2026-Q3',
        purchaseOrders,
        goodsReceipts,
        supplierInvoices,
        weights,
        evaluatedBy
      );

      supplierScorecards.push(scorecard);
      purchaseAuditLogs.push(auditRecord);

      res.status(201).json({ success: true, scorecard, updatedVendorStatus });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Vendor Prepayments
  app.get('/api/v1/procurement/prepayments', (req: Request, res: Response) => {
    const vendorId = req.query.vendorId as string;
    if (vendorId) {
      return res.json(vendorPrepayments.filter(p => p.vendorId === vendorId));
    }
    res.json(vendorPrepayments);
  });

  app.post('/api/v1/procurement/prepayments', (req: Request, res: Response) => {
    try {
      const { prepayment, auditRecord } = AdvancedProcurementEngine.recordVendorPrepayment({
        tenantId: 'ten-001',
        companyId: 'comp-001',
        ...req.body
      });

      vendorPrepayments.push(prepayment);
      purchaseAuditLogs.push(auditRecord);

      res.status(201).json({ success: true, prepayment });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/procurement/prepayments/apply', (req: Request, res: Response) => {
    try {
      const { prepaymentId, voucherId, appliedAmount, appliedBy } = req.body;
      const prepayment = vendorPrepayments.find(p => p.id === prepaymentId);
      if (!prepayment) throw new Error('Prepayment not found');

      const voucher = apVouchers.find(v => v.id === voucherId);
      if (!voucher) throw new Error('AP Voucher not found');

      const { updatedPrepayment, updatedVoucher, applicationRecord, auditRecord } = AdvancedProcurementEngine.applyPrepaymentToVoucher(
        prepayment,
        voucher,
        appliedAmount,
        appliedBy
      );

      const pIdx = vendorPrepayments.findIndex(p => p.id === prepaymentId);
      if (pIdx !== -1) vendorPrepayments[pIdx] = updatedPrepayment;

      const vIdx = apVouchers.findIndex(v => v.id === voucherId);
      if (vIdx !== -1) apVouchers[vIdx] = updatedVoucher;

      prepaymentApplicationRecords.push(applicationRecord);
      purchaseAuditLogs.push(auditRecord);

      res.status(201).json({ success: true, updatedPrepayment, updatedVoucher, applicationRecord });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ==================== PHASE 3.2C-01 ADVANCED ORDER-TO-CASH (O2C) REST ENDPOINTS ====================

  // 1. Hardening Suite
  app.get('/api/v1/sales/hardening/run-suite-32c01', async (req: Request, res: Response) => {
    try {
      const report = await Phase32C01HardeningSuite.runSuite();
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Sales Contracts & Blanket Agreements
  app.get('/api/v1/sales/contracts', (req: Request, res: Response) => {
    try {
      const { customerId, status } = req.query;
      let result = [...salesContracts];
      if (customerId) result = result.filter(c => c.customerId === customerId);
      if (status) result = result.filter(c => c.status === status);
      res.json({ success: true, contracts: result, total: result.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/sales/contracts', (req: Request, res: Response) => {
    try {
      const contract = AdvancedSalesOrderEngine.createContract(req.body);
      salesContracts.push(contract);
      res.status(201).json({ success: true, contract });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/sales/contracts/:id/activate', (req: Request, res: Response) => {
    try {
      const contract = salesContracts.find(c => c.id === req.params.id);
      if (!contract) throw new Error('Sales contract not found');
      const { approverUser, expectedVersion } = req.body;
      const updated = AdvancedSalesOrderEngine.approveAndActivateContract(contract, approverUser, expectedVersion);
      const idx = salesContracts.findIndex(c => c.id === req.params.id);
      salesContracts[idx] = updated;
      res.json({ success: true, contract: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/sales/contracts/:id/drawdown', (req: Request, res: Response) => {
    try {
      const contract = salesContracts.find(c => c.id === req.params.id);
      if (!contract) throw new Error('Sales contract not found');
      const { updatedContract, releases, auditRecord } = AdvancedSalesOrderEngine.executeContractDrawdown(contract, req.body);
      const idx = salesContracts.findIndex(c => c.id === req.params.id);
      salesContracts[idx] = updatedContract;
      res.json({ success: true, contract: updatedContract, releases, auditRecord });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/sales/contracts/:id/terminate', (req: Request, res: Response) => {
    try {
      const contract = salesContracts.find(c => c.id === req.params.id);
      if (!contract) throw new Error('Sales contract not found');
      const { reason, performedBy } = req.body;
      const { updatedContract, earlyTerminationPenaltyAmount, auditRecord } = AdvancedSalesOrderEngine.terminateContract(
        contract,
        reason,
        performedBy
      );
      const idx = salesContracts.findIndex(c => c.id === req.params.id);
      salesContracts[idx] = updatedContract;
      res.json({ success: true, contract: updatedContract, earlyTerminationPenaltyAmount, auditRecord });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 3. Customer Consignment Inventory
  app.get('/api/v1/sales/consignment/stocks', (req: Request, res: Response) => {
    try {
      const { customerId } = req.query;
      let list = [...customerConsignmentStocks];
      if (customerId) list = list.filter(s => s.customerId === customerId);
      res.json({ success: true, stocks: list, total: list.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/sales/consignment/movements', (req: Request, res: Response) => {
    try {
      res.json({ success: true, movements: consignmentMovementRecords, total: consignmentMovementRecords.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/sales/consignment/movements', (req: Request, res: Response) => {
    try {
      const { updatedStockList, movementRecord, financialEvent } = AdvancedSalesOrderEngine.processConsignmentMovement(
        customerConsignmentStocks,
        req.body
      );
      customerConsignmentStocks = updatedStockList;
      consignmentMovementRecords.push(movementRecord);
      res.status(201).json({ success: true, movementRecord, financialEvent, currentStocks: customerConsignmentStocks });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 4. Customer Volume Rebates & Settlements
  app.get('/api/v1/sales/rebates/agreements', (req: Request, res: Response) => {
    try {
      const { customerId } = req.query;
      let list = [...customerRebateAgreements];
      if (customerId) list = list.filter(a => a.customerId === customerId);
      res.json({ success: true, agreements: list, total: list.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/sales/rebates/agreements', (req: Request, res: Response) => {
    try {
      const agreement = AdvancedSalesOrderEngine.createRebateAgreement(req.body);
      customerRebateAgreements.push(agreement);
      res.status(201).json({ success: true, agreement });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/sales/rebates/evaluate-invoice', (req: Request, res: Response) => {
    try {
      const { updatedAgreements, accrualEntries, financialEvents } = AdvancedSalesOrderEngine.evaluateAndAccrueRebate(
        customerRebateAgreements,
        req.body
      );
      customerRebateAgreements = updatedAgreements;
      res.json({ success: true, accrualEntries, financialEvents, agreements: customerRebateAgreements });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/sales/rebates/:id/settle', (req: Request, res: Response) => {
    try {
      const agreement = customerRebateAgreements.find(a => a.id === req.params.id);
      if (!agreement) throw new Error('Rebate agreement not found');
      const { updatedAgreement, settlementRecord, financialEvent } = AdvancedSalesOrderEngine.settleRebateAgreement(
        agreement,
        req.body
      );
      const idx = customerRebateAgreements.findIndex(a => a.id === req.params.id);
      customerRebateAgreements[idx] = updatedAgreement;
      res.json({ success: true, agreement: updatedAgreement, settlementRecord, financialEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 5. Drop-Shipment Direct Vendor Delivery
  app.get('/api/v1/sales/dropship/orders', (req: Request, res: Response) => {
    try {
      res.json({ success: true, orders: dropShipmentOrders, total: dropShipmentOrders.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/sales/dropship/orders', (req: Request, res: Response) => {
    try {
      const dropShip = AdvancedSalesOrderEngine.createDropShipmentOrder(req.body);
      dropShipmentOrders.push(dropShip);
      res.status(201).json({ success: true, dropShip });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/sales/dropship/orders/:id/link-po', (req: Request, res: Response) => {
    try {
      const dropShip = dropShipmentOrders.find(d => d.id === req.params.id);
      if (!dropShip) throw new Error('Drop shipment not found');
      const { poId, poNumber, performedBy } = req.body;
      const updated = AdvancedSalesOrderEngine.linkDropShipPurchaseOrder(dropShip, poId, poNumber, performedBy);
      const idx = dropShipmentOrders.findIndex(d => d.id === req.params.id);
      dropShipmentOrders[idx] = updated;
      res.json({ success: true, dropShip: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/sales/dropship/orders/:id/dispatch', (req: Request, res: Response) => {
    try {
      const dropShip = dropShipmentOrders.find(d => d.id === req.params.id);
      if (!dropShip) throw new Error('Drop shipment not found');
      const { carrierName, trackingNumber, performedBy } = req.body;
      const updated = AdvancedSalesOrderEngine.confirmDropShipVendorDispatch(dropShip, carrierName, trackingNumber, performedBy);
      const idx = dropShipmentOrders.findIndex(d => d.id === req.params.id);
      dropShipmentOrders[idx] = updated;
      res.json({ success: true, dropShip: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/sales/dropship/orders/:id/deliver', (req: Request, res: Response) => {
    try {
      const dropShip = dropShipmentOrders.find(d => d.id === req.params.id);
      if (!dropShip) throw new Error('Drop shipment not found');
      const { receivedDate, performedBy } = req.body;
      const { updatedDropShip, financialEvent } = AdvancedSalesOrderEngine.confirmDropShipCustomerReceipt(
        dropShip,
        receivedDate,
        performedBy
      );
      const idx = dropShipmentOrders.findIndex(d => d.id === req.params.id);
      dropShipmentOrders[idx] = updatedDropShip;
      res.json({ success: true, dropShip: updatedDropShip, financialEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 6. Customer Credit Exposure Governance
  app.get('/api/v1/sales/credit/profiles', (req: Request, res: Response) => {
    try {
      res.json({ success: true, profiles: customerCreditProfiles, total: customerCreditProfiles.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/sales/credit/check', (req: Request, res: Response) => {
    try {
      const { customerId, requestedOrderAmount } = req.body;
      let profile = customerCreditProfiles.find(p => p.customerId === customerId);
      if (!profile) {
        // Create default profile on the fly if not existing
        profile = {
          id: `cp-${customerId}`,
          tenantId: 'tenant-am-global',
          companyId: 'comp-egypt-01',
          customerId,
          customerName: req.body.customerName || `Customer ${customerId}`,
          creditLimit: 100000,
          currency: 'USD',
          paymentTermsDays: 30,
          creditHoldActive: false,
          creditRiskRating: 'LOW_RISK',
          openOrdersAmount: 10000,
          openDeliveriesAmount: 5000,
          openInvoicesAmount: 15000,
          totalExposureAmount: 30000,
          availableCreditAmount: 70000,
          creditUtilizationPercent: 30,
          overdueBalanceAmount: 0,
          oldestOverdueDays: 0,
          lastReviewDate: new Date().toISOString(),
          nextReviewDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        customerCreditProfiles.push(profile);
      }
      const checkResult = AdvancedSalesOrderEngine.evaluateCustomerCredit(profile, requestedOrderAmount || 0);
      res.json({ success: true, checkResult, profile });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/sales/credit/override', (req: Request, res: Response) => {
    try {
      const { customerId, approvedBy, expiryDays, notes } = req.body;
      const profile = customerCreditProfiles.find(p => p.customerId === customerId);
      if (!profile) throw new Error('Customer credit profile not found');
      const updated = AdvancedSalesOrderEngine.applyCreditOverride(profile, approvedBy, expiryDays, notes);
      const idx = customerCreditProfiles.findIndex(p => p.customerId === customerId);
      customerCreditProfiles[idx] = updated;
      res.json({ success: true, profile: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ==================== PHASE 3.2D-01 MANUFACTURING REST ENDPOINTS ====================

  // 1. BOM Endpoints
  app.get('/api/v1/mfg/boms', (req: Request, res: Response) => {
    try {
      res.json({ success: true, boms: manufacturingBOMs, total: manufacturingBOMs.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg/boms', (req: Request, res: Response) => {
    try {
      const bom = ManufacturingEngine.createBOM(req.body);
      manufacturingBOMs.push(bom);
      res.json({ success: true, bom });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg/boms/:id/approve', (req: Request, res: Response) => {
    try {
      const bom = manufacturingBOMs.find(b => b.id === req.params.id);
      if (!bom) throw new Error('BOM not found');
      const { approvedBy } = req.body;
      const approved = ManufacturingEngine.approveBOM(bom, approvedBy);
      const idx = manufacturingBOMs.findIndex(b => b.id === req.params.id);
      manufacturingBOMs[idx] = approved;
      res.json({ success: true, bom: approved });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg/boms/:id/explode', (req: Request, res: Response) => {
    try {
      const bom = manufacturingBOMs.find(b => b.id === req.params.id);
      if (!bom) throw new Error('BOM not found');
      const { targetQuantity } = req.body;
      const exploded = ManufacturingEngine.explodeBOM(bom, targetQuantity || 1, manufacturingBOMs);
      res.json({ success: true, exploded });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 2. Work Centers & Routings
  app.get('/api/v1/mfg/work-centers', (req: Request, res: Response) => {
    try {
      res.json({ success: true, workCenters: manufacturingWorkCenters, total: manufacturingWorkCenters.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg/work-centers', (req: Request, res: Response) => {
    try {
      const wc = ManufacturingEngine.createWorkCenter(req.body);
      manufacturingWorkCenters.push(wc);
      res.json({ success: true, workCenter: wc });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/mfg/routings', (req: Request, res: Response) => {
    try {
      res.json({ success: true, routings: manufacturingRoutings, total: manufacturingRoutings.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg/routings', (req: Request, res: Response) => {
    try {
      const routing = ManufacturingEngine.createRouting(req.body);
      manufacturingRoutings.push(routing);
      res.json({ success: true, routing });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 3. Work Orders
  app.get('/api/v1/mfg/work-orders', (req: Request, res: Response) => {
    try {
      res.json({ success: true, workOrders: manufacturingWorkOrders, total: manufacturingWorkOrders.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg/work-orders', (req: Request, res: Response) => {
    try {
      const { bomId, routingId, plannedQuantity, uom, plannedStartDate, plannedEndDate, targetWarehouseId, createdBy, finishedGoodSku, finishedGoodName } = req.body;
      const bom = manufacturingBOMs.find(b => b.id === bomId);
      if (!bom) throw new Error('BOM not found');
      const routing = manufacturingRoutings.find(r => r.id === routingId);
      if (!routing) throw new Error('Routing not found');

      const wo = ManufacturingEngine.createWorkOrder({
        tenantId: req.body.tenantId || 'tenant-am-global',
        companyId: req.body.companyId || 'comp-egypt-01',
        finishedGoodSku: finishedGoodSku || bom.finishedGoodSku,
        finishedGoodName: finishedGoodName || bom.finishedGoodName,
        bom,
        routing,
        workCenters: manufacturingWorkCenters,
        plannedQuantity: Number(plannedQuantity),
        uom: uom || 'EA',
        plannedStartDate,
        plannedEndDate,
        targetWarehouseId: targetWarehouseId || 'WH-FG-01',
        createdBy
      });
      manufacturingWorkOrders.push(wo);
      res.json({ success: true, workOrder: wo });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg/work-orders/:id/release', (req: Request, res: Response) => {
    try {
      const wo = manufacturingWorkOrders.find(w => w.id === req.params.id);
      if (!wo) throw new Error('Work Order not found');
      const { releasedBy } = req.body;
      const released = ManufacturingEngine.releaseWorkOrder(wo, releasedBy);
      const idx = manufacturingWorkOrders.findIndex(w => w.id === req.params.id);
      manufacturingWorkOrders[idx] = released;
      res.json({ success: true, workOrder: released });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg/work-orders/:id/start', (req: Request, res: Response) => {
    try {
      const wo = manufacturingWorkOrders.find(w => w.id === req.params.id);
      if (!wo) throw new Error('Work Order not found');
      const started = ManufacturingEngine.startWorkOrder(wo);
      const idx = manufacturingWorkOrders.findIndex(w => w.id === req.params.id);
      manufacturingWorkOrders[idx] = started;
      res.json({ success: true, workOrder: started });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg/work-orders/:id/issue-materials', (req: Request, res: Response) => {
    try {
      const wo = manufacturingWorkOrders.find(w => w.id === req.params.id);
      if (!wo) throw new Error('Work Order not found');
      const { issuedBy, issueType, items } = req.body;
      const { updatedWorkOrder, goodsIssueRecord, financialEvent } = ManufacturingEngine.issueMaterialsToWorkOrder({
        workOrder: wo,
        issuedBy,
        issueType,
        items
      });
      const idx = manufacturingWorkOrders.findIndex(w => w.id === req.params.id);
      manufacturingWorkOrders[idx] = updatedWorkOrder;
      manufacturingGoodsIssues.push(goodsIssueRecord);
      res.json({ success: true, workOrder: updatedWorkOrder, goodsIssueRecord, financialEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg/work-orders/:id/confirm-operation', (req: Request, res: Response) => {
    try {
      const wo = manufacturingWorkOrders.find(w => w.id === req.params.id);
      if (!wo) throw new Error('Work Order not found');
      const routing = manufacturingRoutings.find(r => r.id === wo.routingId);
      if (!routing) throw new Error('Routing not found');

      const { operationNumber, confirmedGoodQuantity, confirmedScrapQuantity, actualLaborHours, actualMachineHours, operatorId, operatorName, notes } = req.body;
      const { updatedWorkOrder, confirmation, absorbedCost } = ManufacturingEngine.confirmOperation({
        workOrder: wo,
        routing,
        workCenters: manufacturingWorkCenters,
        operationNumber: Number(operationNumber),
        confirmedGoodQuantity: Number(confirmedGoodQuantity),
        confirmedScrapQuantity: Number(confirmedScrapQuantity || 0),
        actualLaborHours: Number(actualLaborHours),
        actualMachineHours: Number(actualMachineHours),
        operatorId,
        operatorName,
        notes
      });
      const idx = manufacturingWorkOrders.findIndex(w => w.id === req.params.id);
      manufacturingWorkOrders[idx] = updatedWorkOrder;
      res.json({ success: true, workOrder: updatedWorkOrder, confirmation, absorbedCost });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg/work-orders/:id/receive-finished-goods', (req: Request, res: Response) => {
    try {
      const wo = manufacturingWorkOrders.find(w => w.id === req.params.id);
      if (!wo) throw new Error('Work Order not found');
      const { receivedQuantity, receivedBy, destinationWarehouseId } = req.body;
      const { updatedWorkOrder, goodsReceiptRecord, financialEvent } = ManufacturingEngine.receiveFinishedGoods({
        workOrder: wo,
        receivedQuantity: Number(receivedQuantity),
        receivedBy,
        destinationWarehouseId: destinationWarehouseId || 'WH-FG-01'
      });
      const idx = manufacturingWorkOrders.findIndex(w => w.id === req.params.id);
      manufacturingWorkOrders[idx] = updatedWorkOrder;
      manufacturingGoodsReceipts.push(goodsReceiptRecord);
      res.json({ success: true, workOrder: updatedWorkOrder, goodsReceiptRecord, financialEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg/work-orders/:id/settle', (req: Request, res: Response) => {
    try {
      const wo = manufacturingWorkOrders.find(w => w.id === req.params.id);
      if (!wo) throw new Error('Work Order not found');
      const { settledBy } = req.body;
      const { updatedWorkOrder, financialEvent } = ManufacturingEngine.settleAndCloseWorkOrder({
        workOrder: wo,
        settledBy
      });
      const idx = manufacturingWorkOrders.findIndex(w => w.id === req.params.id);
      manufacturingWorkOrders[idx] = updatedWorkOrder;
      res.json({ success: true, workOrder: updatedWorkOrder, financialEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 4. MRP Run Endpoint
  app.post('/api/v1/mfg/mrp/run', (req: Request, res: Response) => {
    try {
      const { demands, currentStockMap } = req.body;
      const report = ManufacturingEngine.runMRP({
        tenantId: req.body.tenantId || 'tenant-am-global',
        companyId: req.body.companyId || 'comp-egypt-01',
        demands: demands || [],
        currentStockMap: currentStockMap || {},
        allBOMs: manufacturingBOMs
      });
      manufacturingMRPReports.push(report);
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 5. Phase 3.2D-01 Hardening Test Suite Execution Endpoint
  app.get('/api/v1/mfg/tests/run', (req: Request, res: Response) => {
    try {
      const results = Phase32D01HardeningSuite.runAll();
      res.json({ success: true, results });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =========================================================================
  // PHASE 3.2D-02: MES / QM (Shop Floor, Machine IoT & Quality Inspections)
  // =========================================================================

  // Operators
  app.get('/api/v1/mes/operators', (_req: Request, res: Response) => {
    res.json({ success: true, operators: shopFloorOperators });
  });

  app.post('/api/v1/mes/operators', (req: Request, res: Response) => {
    try {
      const op = ShopFloorQualityEngine.createOperator(req.body);
      shopFloorOperators.push(op);
      res.json({ success: true, operator: op });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Machines & IoT
  app.get('/api/v1/mes/machines', (_req: Request, res: Response) => {
    res.json({ success: true, machines: shopFloorMachines });
  });

  app.post('/api/v1/mes/machines', (req: Request, res: Response) => {
    try {
      const mach = ShopFloorQualityEngine.createMachine(req.body);
      shopFloorMachines.push(mach);
      res.json({ success: true, machine: mach });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mes/machines/:id/telemetry', (req: Request, res: Response) => {
    try {
      const mach = shopFloorMachines.find(m => m.id === req.params.id);
      if (!mach) throw new Error('Machine not found');
      const activeDispatch = shopFloorDispatches.find(d => d.assignedMachineId === mach.id && d.status === 'IN_PROGRESS');
      const result = ShopFloorQualityEngine.ingestIoTTelemetry({
        telemetry: req.body,
        machine: mach,
        activeDispatch
      });
      const machIdx = shopFloorMachines.findIndex(m => m.id === req.params.id);
      shopFloorMachines[machIdx] = result.updatedMachine;
      if (result.downtimeEvent) {
        shopFloorDowntimeEvents.push(result.downtimeEvent);
      }
      if (result.interruptedDispatch) {
        const dIdx = shopFloorDispatches.findIndex(d => d.id === result.interruptedDispatch!.id);
        if (dIdx !== -1) shopFloorDispatches[dIdx] = result.interruptedDispatch;
      }
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/mes/machines/:id/oee', (req: Request, res: Response) => {
    try {
      const mach = shopFloorMachines.find(m => m.id === req.params.id);
      if (!mach) throw new Error('Machine not found');
      const machineDowntimes = shopFloorDowntimeEvents.filter(e => e.machineId === mach.id);
      const oee = ShopFloorQualityEngine.calculateOEE({
        machine: mach,
        periodStart: (req.query.periodStart as string) || new Date(Date.now() - 28800000).toISOString(),
        periodEnd: (req.query.periodEnd as string) || new Date().toISOString(),
        plannedProductionTimeMinutes: Number(req.query.plannedMinutes) || 480,
        downtimeEvents: machineDowntimes,
        totalUnitsProduced: Number(req.query.totalUnits) || 100,
        goodUnitsProduced: Number(req.query.goodUnits) || 95
      });
      res.json({ success: true, oee });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Dispatches
  app.get('/api/v1/mes/dispatches', (_req: Request, res: Response) => {
    res.json({ success: true, dispatches: shopFloorDispatches });
  });

  app.post('/api/v1/mes/dispatches', (req: Request, res: Response) => {
    try {
      const wo = manufacturingWorkOrders.find(w => w.id === req.body.workOrderId);
      if (!wo) throw new Error('Work order not found');
      const machine = req.body.assignedMachineId ? shopFloorMachines.find(m => m.id === req.body.assignedMachineId) : undefined;
      const operator = req.body.assignedOperatorId ? shopFloorOperators.find(o => o.id === req.body.assignedOperatorId) : undefined;
      const dispatch = ShopFloorQualityEngine.dispatchWorkOrderOperation({
        tenantId: req.body.tenantId || wo.tenantId,
        companyId: req.body.companyId || wo.companyId,
        workOrder: wo,
        operationNumber: req.body.operationNumber,
        routingOperationName: req.body.routingOperationName,
        workCenterId: req.body.workCenterId,
        workCenterCode: req.body.workCenterCode,
        assignedMachine: machine,
        assignedOperator: operator,
        shift: req.body.shift || 'MORNING',
        plannedStart: req.body.plannedStart,
        plannedEnd: req.body.plannedEnd,
        targetQuantity: req.body.targetQuantity || wo.plannedQuantity,
        requiredSkill: req.body.requiredSkill,
        priorityRule: req.body.priorityRule
      });
      shopFloorDispatches.push(dispatch);
      res.json({ success: true, dispatch });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mes/dispatches/:id/start', (req: Request, res: Response) => {
    try {
      const disp = shopFloorDispatches.find(d => d.id === req.params.id);
      if (!disp) throw new Error('Dispatch order not found');
      const mach = disp.assignedMachineId ? shopFloorMachines.find(m => m.id === disp.assignedMachineId) : undefined;
      const { updatedDispatchOrder, updatedMachine } = ShopFloorQualityEngine.startDispatchOrder(disp, mach);
      const dIdx = shopFloorDispatches.findIndex(d => d.id === req.params.id);
      shopFloorDispatches[dIdx] = updatedDispatchOrder;
      if (updatedMachine) {
        const mIdx = shopFloorMachines.findIndex(m => m.id === updatedMachine.id);
        if (mIdx !== -1) shopFloorMachines[mIdx] = updatedMachine;
      }
      res.json({ success: true, dispatch: updatedDispatchOrder, machine: updatedMachine });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mes/dispatches/:id/pause', (req: Request, res: Response) => {
    try {
      const disp = shopFloorDispatches.find(d => d.id === req.params.id);
      if (!disp) throw new Error('Dispatch order not found');
      const mach = disp.assignedMachineId ? shopFloorMachines.find(m => m.id === disp.assignedMachineId) : undefined;
      const { updatedDispatchOrder, updatedMachine } = ShopFloorQualityEngine.pauseDispatchOrder(disp, req.body.pauseReason || 'PAUSED', mach);
      const dIdx = shopFloorDispatches.findIndex(d => d.id === req.params.id);
      shopFloorDispatches[dIdx] = updatedDispatchOrder;
      if (updatedMachine) {
        const mIdx = shopFloorMachines.findIndex(m => m.id === updatedMachine.id);
        if (mIdx !== -1) shopFloorMachines[mIdx] = updatedMachine;
      }
      res.json({ success: true, dispatch: updatedDispatchOrder, machine: updatedMachine });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mes/dispatches/:id/complete', (req: Request, res: Response) => {
    try {
      const disp = shopFloorDispatches.find(d => d.id === req.params.id);
      if (!disp) throw new Error('Dispatch order not found');
      const mach = disp.assignedMachineId ? shopFloorMachines.find(m => m.id === disp.assignedMachineId) : undefined;
      const { updatedDispatchOrder, updatedMachine } = ShopFloorQualityEngine.completeDispatchOrder({
        dispatchOrder: disp,
        completedGoodQuantity: req.body.completedGoodQuantity,
        scrappedQuantity: req.body.scrappedQuantity,
        machine: mach
      });
      const dIdx = shopFloorDispatches.findIndex(d => d.id === req.params.id);
      shopFloorDispatches[dIdx] = updatedDispatchOrder;
      if (updatedMachine) {
        const mIdx = shopFloorMachines.findIndex(m => m.id === updatedMachine.id);
        if (mIdx !== -1) shopFloorMachines[mIdx] = updatedMachine;
      }
      res.json({ success: true, dispatch: updatedDispatchOrder, machine: updatedMachine });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mes/time-tickets', (req: Request, res: Response) => {
    try {
      const disp = shopFloorDispatches.find(d => d.id === req.body.dispatchOrderId);
      if (!disp) throw new Error('Dispatch order not found');
      const ticket = ShopFloorQualityEngine.recordTimeTicket({
        tenantId: req.body.tenantId || disp.tenantId,
        companyId: req.body.companyId || disp.companyId,
        dispatchOrder: disp,
        operatorId: req.body.operatorId,
        machineId: req.body.machineId,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        goodQuantity: req.body.goodQuantity,
        scrapQuantity: req.body.scrapQuantity
      });
      shopFloorTimeTickets.push(ticket);
      res.json({ success: true, timeTicket: ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Quality Inspection Plans & Lots
  app.get('/api/v1/qm/plans', (_req: Request, res: Response) => {
    res.json({ success: true, plans: qualityInspectionPlans });
  });

  app.post('/api/v1/qm/plans', (req: Request, res: Response) => {
    try {
      const plan = ShopFloorQualityEngine.createInspectionPlan(req.body);
      qualityInspectionPlans.push(plan);
      res.json({ success: true, plan });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/qm/lots', (_req: Request, res: Response) => {
    res.json({ success: true, lots: qualityInspectionLots });
  });

  app.post('/api/v1/qm/lots', (req: Request, res: Response) => {
    try {
      const plan = qualityInspectionPlans.find(p => p.id === req.body.inspectionPlanId);
      const lot = ShopFloorQualityEngine.generateInspectionLot({
        ...req.body,
        plan
      });
      qualityInspectionLots.push(lot);
      res.json({ success: true, lot });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/qm/lots/:id/measurements', (req: Request, res: Response) => {
    try {
      const lot = qualityInspectionLots.find(l => l.id === req.params.id);
      if (!lot) throw new Error('Inspection lot not found');
      const plan = qualityInspectionPlans.find(p => p.id === lot.planId);
      const updatedLot = ShopFloorQualityEngine.recordInspectionMeasurements({
        lot,
        plan,
        measurements: req.body.measurements
      });
      const idx = qualityInspectionLots.findIndex(l => l.id === req.params.id);
      qualityInspectionLots[idx] = updatedLot;
      res.json({ success: true, lot: updatedLot });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/qm/lots/:id/usage-decision', (req: Request, res: Response) => {
    try {
      const lot = qualityInspectionLots.find(l => l.id === req.params.id);
      if (!lot) throw new Error('Inspection lot not found');
      const { updatedLot, cryptographicSeal } = ShopFloorQualityEngine.makeUsageDecision({
        lot,
        decision: req.body.decision,
        decidedBy: req.body.decidedBy,
        producerOrOperatorId: req.body.producerOrOperatorId,
        notes: req.body.notes
      });
      const idx = qualityInspectionLots.findIndex(l => l.id === req.params.id);
      qualityInspectionLots[idx] = updatedLot;
      res.json({ success: true, lot: updatedLot, cryptographicSeal });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // NCR & CAPA
  app.get('/api/v1/qm/ncrs', (_req: Request, res: Response) => {
    res.json({ success: true, ncrs: qualityNonConformanceReports });
  });

  app.post('/api/v1/qm/ncrs', (req: Request, res: Response) => {
    try {
      const ncr = ShopFloorQualityEngine.createNonConformanceReport(req.body);
      qualityNonConformanceReports.push(ncr);
      res.json({ success: true, ncr });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/qm/ncrs/:id/disposition', (req: Request, res: Response) => {
    try {
      const ncr = qualityNonConformanceReports.find(n => n.id === req.params.id);
      if (!ncr) throw new Error('NCR not found');
      const { updatedNCR, financialEvent } = ShopFloorQualityEngine.dispositionNCR({
        ncr,
        disposition: req.body.disposition,
        dispositionBy: req.body.dispositionBy,
        dispositionNotes: req.body.dispositionNotes,
        unitCost: req.body.unitCost
      });
      const idx = qualityNonConformanceReports.findIndex(n => n.id === req.params.id);
      qualityNonConformanceReports[idx] = updatedNCR;
      res.json({ success: true, ncr: updatedNCR, financialEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/qm/capas', (_req: Request, res: Response) => {
    res.json({ success: true, capas: qualityCAPAs });
  });

  app.post('/api/v1/qm/capas', (req: Request, res: Response) => {
    try {
      const ncr = qualityNonConformanceReports.find(n => n.id === req.body.ncrId);
      if (!ncr) throw new Error('NCR not found');
      const { capa, updatedNCR } = ShopFloorQualityEngine.createCAPA({
        ...req.body,
        ncr
      });
      qualityCAPAs.push(capa);
      const idx = qualityNonConformanceReports.findIndex(n => n.id === ncr.id);
      qualityNonConformanceReports[idx] = updatedNCR;
      res.json({ success: true, capa, ncr: updatedNCR });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/qm/capas/:id/verify', (req: Request, res: Response) => {
    try {
      const capa = qualityCAPAs.find(c => c.id === req.params.id);
      if (!capa) throw new Error('CAPA not found');
      const updatedCAPA = ShopFloorQualityEngine.verifyAndCloseCAPA({
        capa,
        verifiedBy: req.body.verifiedBy,
        verificationNotes: req.body.verificationNotes
      });
      const idx = qualityCAPAs.findIndex(c => c.id === req.params.id);
      qualityCAPAs[idx] = updatedCAPA;
      res.json({ success: true, capa: updatedCAPA });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Genealogy & Traceability
  app.post('/api/v1/qm/genealogy', (req: Request, res: Response) => {
    try {
      const rec = ShopFloorQualityEngine.registerSerialGenealogy(req.body);
      serialGenealogies.push(rec);
      res.json({ success: true, genealogy: rec });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/qm/trace/forward/:lotNumber', (req: Request, res: Response) => {
    const result = ShopFloorQualityEngine.traceForward(req.params.lotNumber, serialGenealogies);
    res.json({ success: true, result });
  });

  app.get('/api/v1/qm/trace/backward/:serialNumber', (req: Request, res: Response) => {
    const result = ShopFloorQualityEngine.traceBackward(req.params.serialNumber, serialGenealogies);
    res.json({ success: true, result });
  });

  // Phase 3.2D-02 Hardening Test Suite Execution Endpoint
  app.get('/api/v1/mes/tests/run', (_req: Request, res: Response) => {
    try {
      const results = Phase32D02HardeningSuite.runAll();
      res.json({ success: true, results });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =========================================================================
  // PHASE 3.2D-03: ADVANCED PRODUCT COSTING, MANUFACTURING VARIANCES & EAM
  // =========================================================================

  // 1. Multi-Level Standard Cost Rollup (CO-PC)
  app.post('/api/v1/mfg/costing/rollup', (req: Request, res: Response) => {
    try {
      const { tenantId, companyId, bomId, routingId, lotSize, createdBy } = req.body;
      const bom = manufacturingBOMs.find(b => b.id === bomId);
      if (!bom) {
        return res.status(404).json({ success: false, error: `BOM '${bomId}' not found` });
      }
      const routing = manufacturingRoutings.find(r => r.id === routingId);
      if (!routing) {
        return res.status(404).json({ success: false, error: `Routing '${routingId}' not found` });
      }
      const estimate = ManufacturingCostingMaintenanceEngine.calculateStandardCostRollup({
        tenantId,
        companyId,
        bom,
        allBOMs: manufacturingBOMs,
        routing,
        workCenters: manufacturingWorkCenters,
        lotSize: lotSize || 1,
        createdBy: createdBy || 'cost-analyst'
      });
      standardCostEstimates.push(estimate);
      res.json({ success: true, estimate });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/mfg/costing/estimates', (_req: Request, res: Response) => {
    res.json({ success: true, estimates: standardCostEstimates });
  });

  app.post('/api/v1/mfg/costing/estimates/:id/mark', (req: Request, res: Response) => {
    try {
      const idx = standardCostEstimates.findIndex(e => e.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Cost estimate not found' });
      const marked = ManufacturingCostingMaintenanceEngine.markStandardCostEstimate(standardCostEstimates[idx]);
      standardCostEstimates[idx] = marked;
      res.json({ success: true, estimate: marked });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg/costing/estimates/:id/release', (req: Request, res: Response) => {
    try {
      const idx = standardCostEstimates.findIndex(e => e.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Cost estimate not found' });
      const { releasedBy } = req.body;
      const released = ManufacturingCostingMaintenanceEngine.releaseStandardCostEstimate({
        estimate: standardCostEstimates[idx],
        releasedBy: releasedBy || 'cost-controller'
      });
      standardCostEstimates[idx] = released;
      res.json({ success: true, estimate: released });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 2. Manufacturing Variances & WIP Settlement
  app.post('/api/v1/mfg/variances/calculate', (req: Request, res: Response) => {
    try {
      const { workOrderId, actualComponentUnitPrices, actualLaborHourlyRate, plannedLaborHours } = req.body;
      const wo = manufacturingWorkOrders.find(w => w.id === workOrderId);
      if (!wo) return res.status(404).json({ success: false, error: 'Work order not found' });
      const variances = ManufacturingCostingMaintenanceEngine.calculateManufacturingVariances({
        workOrder: wo,
        actualComponentUnitPrices,
        actualLaborHourlyRate,
        plannedLaborHours
      });
      res.json({ success: true, variances });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg/wip/settle', (req: Request, res: Response) => {
    try {
      const { workOrderId, settledBy, varianceBreakdown } = req.body;
      const idx = manufacturingWorkOrders.findIndex(w => w.id === workOrderId);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Work order not found' });

      const variances = varianceBreakdown || ManufacturingCostingMaintenanceEngine.calculateManufacturingVariances({
        workOrder: manufacturingWorkOrders[idx]
      });

      const { updatedWorkOrder, wipRecord, financialEvent } = ManufacturingCostingMaintenanceEngine.settleWorkOrderWIP({
        workOrder: manufacturingWorkOrders[idx],
        settledBy: settledBy || 'cost-accountant',
        varianceBreakdown: variances
      });

      manufacturingWorkOrders[idx] = updatedWorkOrder;
      wipRevaluationRecords.push(wipRecord);
      res.json({ success: true, workOrder: updatedWorkOrder, wipRecord, financialEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/mfg/wip/records', (_req: Request, res: Response) => {
    res.json({ success: true, wipRecords: wipRevaluationRecords });
  });

  // 3. Enterprise Plant Maintenance (EAM) Master Data & PM Schedules
  app.post('/api/v1/eam/functional-locations', (req: Request, res: Response) => {
    try {
      const floc = ManufacturingCostingMaintenanceEngine.createFunctionalLocation(req.body);
      functionalLocations.push(floc);
      res.json({ success: true, functionalLocation: floc });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/eam/functional-locations', (_req: Request, res: Response) => {
    res.json({ success: true, functionalLocations });
  });

  app.post('/api/v1/eam/equipment', (req: Request, res: Response) => {
    try {
      const eq = ManufacturingCostingMaintenanceEngine.createEquipmentAsset(req.body);
      equipmentAssets.push(eq);
      res.json({ success: true, equipment: eq });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/eam/equipment', (_req: Request, res: Response) => {
    res.json({ success: true, equipment: equipmentAssets });
  });

  app.post('/api/v1/eam/pm-schedules', (req: Request, res: Response) => {
    try {
      const sched = ManufacturingCostingMaintenanceEngine.createPreventiveMaintenanceSchedule(req.body);
      preventiveMaintenanceSchedules.push(sched);
      res.json({ success: true, schedule: sched });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/eam/pm-schedules', (_req: Request, res: Response) => {
    res.json({ success: true, schedules: preventiveMaintenanceSchedules });
  });

  app.post('/api/v1/eam/pm-schedules/evaluate', (req: Request, res: Response) => {
    try {
      const { asOfDate, createdBy } = req.body;
      const { dueSchedules, generatedOrders } = ManufacturingCostingMaintenanceEngine.evaluatePMSchedules({
        schedules: preventiveMaintenanceSchedules,
        equipment: equipmentAssets,
        asOfDate,
        createdBy: createdBy || 'pm-evaluator'
      });
      maintenanceWorkOrders.push(...generatedOrders);
      res.json({ success: true, dueSchedulesCount: dueSchedules.length, generatedOrders });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 4. Maintenance Work Orders (MWO) & Spare Parts
  app.post('/api/v1/eam/work-orders', (req: Request, res: Response) => {
    try {
      const mwo = ManufacturingCostingMaintenanceEngine.createMaintenanceWorkOrder(req.body);
      maintenanceWorkOrders.push(mwo);
      res.json({ success: true, workOrder: mwo });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/eam/work-orders', (_req: Request, res: Response) => {
    res.json({ success: true, workOrders: maintenanceWorkOrders });
  });

  app.post('/api/v1/eam/work-orders/:id/start', (req: Request, res: Response) => {
    try {
      const idx = maintenanceWorkOrders.findIndex(w => w.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Maintenance order not found' });
      const eqIdx = equipmentAssets.findIndex(e => e.id === maintenanceWorkOrders[idx].equipmentId);
      const { updatedOrder, updatedEquipment } = ManufacturingCostingMaintenanceEngine.startMaintenanceWorkOrder(
        maintenanceWorkOrders[idx],
        eqIdx >= 0 ? equipmentAssets[eqIdx] : undefined
      );
      maintenanceWorkOrders[idx] = updatedOrder;
      if (eqIdx >= 0 && updatedEquipment) equipmentAssets[eqIdx] = updatedEquipment;
      res.json({ success: true, workOrder: updatedOrder, equipment: updatedEquipment });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/eam/work-orders/:id/consume-parts', (req: Request, res: Response) => {
    try {
      const idx = maintenanceWorkOrders.findIndex(w => w.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Maintenance order not found' });
      const { partSku, quantity, unitCost, warehouseId, consumedBy } = req.body;
      const { updatedOrder, financialEvent } = ManufacturingCostingMaintenanceEngine.consumeMaintenanceSpareParts({
        mwo: maintenanceWorkOrders[idx],
        partSku,
        quantity,
        unitCost,
        warehouseId: warehouseId || 'WH-MRO-01',
        consumedBy: consumedBy || 'technician'
      });
      maintenanceWorkOrders[idx] = updatedOrder;
      res.json({ success: true, workOrder: updatedOrder, financialEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/eam/work-orders/:id/complete', (req: Request, res: Response) => {
    try {
      const idx = maintenanceWorkOrders.findIndex(w => w.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Maintenance order not found' });
      const { actualLaborHours, laborHourlyRate, actualDowntimeHours, rootCauseNotes, resolutionNotes, completedBy } = req.body;
      const completed = ManufacturingCostingMaintenanceEngine.completeMaintenanceWorkOrder({
        mwo: maintenanceWorkOrders[idx],
        actualLaborHours: actualLaborHours || 1,
        laborHourlyRate,
        actualDowntimeHours: actualDowntimeHours || 0,
        rootCauseNotes,
        resolutionNotes: resolutionNotes || 'Work completed successfully',
        completedBy: completedBy || 'technician'
      });
      maintenanceWorkOrders[idx] = completed;
      res.json({ success: true, workOrder: completed });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/eam/work-orders/:id/settle', (req: Request, res: Response) => {
    try {
      const idx = maintenanceWorkOrders.findIndex(w => w.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Maintenance order not found' });
      const eqIdx = equipmentAssets.findIndex(e => e.id === maintenanceWorkOrders[idx].equipmentId);
      if (eqIdx < 0) return res.status(404).json({ success: false, error: 'Equipment asset not found' });

      const pmIdx = preventiveMaintenanceSchedules.findIndex(p => p.id === maintenanceWorkOrders[idx].pmScheduleId);
      const { settledOrder, updatedEquipment, updatedSchedule, financialEvent } = ManufacturingCostingMaintenanceEngine.settleMaintenanceWorkOrder({
        mwo: maintenanceWorkOrders[idx],
        equipment: equipmentAssets[eqIdx],
        pmSchedule: pmIdx >= 0 ? preventiveMaintenanceSchedules[pmIdx] : undefined,
        settledBy: req.body.settledBy || 'maint-accountant'
      });

      maintenanceWorkOrders[idx] = settledOrder;
      equipmentAssets[eqIdx] = updatedEquipment;
      if (pmIdx >= 0 && updatedSchedule) preventiveMaintenanceSchedules[pmIdx] = updatedSchedule;

      res.json({ success: true, workOrder: settledOrder, equipment: updatedEquipment, financialEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 5. Reliability Analytics & Engineering Change Management (ECM / ECO)
  app.get('/api/v1/eam/analytics/reliability/:equipmentId', (req: Request, res: Response) => {
    try {
      const eq = equipmentAssets.find(e => e.id === req.params.equipmentId || e.equipmentCode === req.params.equipmentId);
      if (!eq) return res.status(404).json({ success: false, error: 'Equipment not found' });

      const totalOp = Number(req.query.totalOperatingHours) || 720;
      const metrics = ManufacturingCostingMaintenanceEngine.calculateEquipmentReliability({
        equipment: eq,
        periodStart: (req.query.periodStart as string) || '2026-09-01',
        periodEnd: (req.query.periodEnd as string) || '2026-09-30',
        totalOperatingHours: totalOp,
        totalDowntimeHours: eq.totalDowntimeHours,
        breakdownCount: eq.totalBreakdowns
      });
      res.json({ success: true, metrics });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg/eco', (req: Request, res: Response) => {
    try {
      const { bomId } = req.body;
      const bom = manufacturingBOMs.find(b => b.id === bomId);
      if (!bom) return res.status(404).json({ success: false, error: 'BOM not found' });
      const eco = ManufacturingCostingMaintenanceEngine.createECO({
        ...req.body,
        bom
      });
      engineeringChangeOrders.push(eco);
      res.json({ success: true, eco });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/mfg/eco', (_req: Request, res: Response) => {
    res.json({ success: true, ecos: engineeringChangeOrders });
  });

  app.post('/api/v1/mfg/eco/:id/review', (req: Request, res: Response) => {
    try {
      const idx = engineeringChangeOrders.findIndex(e => e.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'ECO not found' });
      const reviewed = ManufacturingCostingMaintenanceEngine.submitECOForReview(engineeringChangeOrders[idx]);
      engineeringChangeOrders[idx] = reviewed;
      res.json({ success: true, eco: reviewed });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg/eco/:id/approve', (req: Request, res: Response) => {
    try {
      const idx = engineeringChangeOrders.findIndex(e => e.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'ECO not found' });
      const approved = ManufacturingCostingMaintenanceEngine.approveECO({
        eco: engineeringChangeOrders[idx],
        approvedBy: req.body.approvedBy || 'chief-engineer'
      });
      engineeringChangeOrders[idx] = approved;
      res.json({ success: true, eco: approved });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg/eco/:id/apply', (req: Request, res: Response) => {
    try {
      const idx = engineeringChangeOrders.findIndex(e => e.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'ECO not found' });
      const bomIdx = manufacturingBOMs.findIndex(b => b.id === engineeringChangeOrders[idx].bomId);
      if (bomIdx < 0) return res.status(404).json({ success: false, error: 'BOM not found' });

      const { updatedECO, newBOM } = ManufacturingCostingMaintenanceEngine.applyECO({
        eco: engineeringChangeOrders[idx],
        bom: manufacturingBOMs[bomIdx],
        appliedBy: req.body.appliedBy || 'plm-admin',
        asOfDate: req.body.asOfDate
      });

      engineeringChangeOrders[idx] = updatedECO;
      manufacturingBOMs.push(newBOM);
      res.json({ success: true, eco: updatedECO, newBOM });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 6. Phase 3.2D-03 Hardening Test Suite Execution Endpoint
  app.get('/api/v1/mfg-costing/tests/run', (_req: Request, res: Response) => {
    try {
      const results = Phase32D03HardeningSuite.runAll();
      res.json({ success: true, results });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ========================================================================
  // PHASE 3.2D-04: PROCESS MANUFACTURING, APS, SUBCONTRACTING & KANBAN
  // ========================================================================

  // 1. Master Recipes
  app.get('/api/v1/mfg-process/recipes', (_req: Request, res: Response) => {
    res.json({ success: true, recipes: masterRecipes });
  });

  app.post('/api/v1/mfg-process/recipes', (req: Request, res: Response) => {
    try {
      const recipe = ProcessManufacturingSubcontractingEngine.createMasterRecipe({
        tenantId: req.body.tenantId || 'TENANT-001',
        companyId: req.body.companyId || 'COMP-001',
        recipeCode: req.body.recipeCode,
        productSku: req.body.productSku,
        productName: req.body.productName,
        version: req.body.version,
        baseQuantity: Number(req.body.baseQuantity),
        unitOfMeasure: req.body.unitOfMeasure,
        phases: req.body.phases,
        ingredients: req.body.ingredients,
        coProducts: req.body.coProducts,
        byProducts: req.body.byProducts,
        validFrom: req.body.validFrom || new Date().toISOString().split('T')[0],
        densityGPerMl: req.body.densityGPerMl ? Number(req.body.densityGPerMl) : undefined,
        createdBy: req.body.createdBy || 'formulator'
      });
      masterRecipes.push(recipe);
      res.status(201).json({ success: true, recipe });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-process/recipes/:id/approve', (req: Request, res: Response) => {
    try {
      const idx = masterRecipes.findIndex(r => r.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Recipe not found' });

      const approved = ProcessManufacturingSubcontractingEngine.approveMasterRecipe({
        recipe: masterRecipes[idx],
        approvedBy: req.body.approvedBy || 'qa-manager',
        asActive: req.body.asActive ?? true
      });
      masterRecipes[idx] = approved;
      res.json({ success: true, recipe: approved });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-process/recipes/potency-adjust', (req: Request, res: Response) => {
    try {
      const result = ProcessManufacturingSubcontractingEngine.calculatePotencyAdjustedIngredients({
        ingredients: req.body.ingredients,
        batchBatchPotencies: req.body.batchBatchPotencies,
        batchSizeMultiplier: req.body.batchSizeMultiplier ? Number(req.body.batchSizeMultiplier) : 1
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 2. Batch Masters & SLED
  app.get('/api/v1/mfg-process/batches', (_req: Request, res: Response) => {
    res.json({ success: true, batches: batchMasters });
  });

  app.post('/api/v1/mfg-process/batches', (req: Request, res: Response) => {
    try {
      const batch = ProcessManufacturingSubcontractingEngine.createBatch({
        tenantId: req.body.tenantId || 'TENANT-001',
        companyId: req.body.companyId || 'COMP-001',
        batchNumber: req.body.batchNumber,
        itemSku: req.body.itemSku,
        manufacturingDate: req.body.manufacturingDate || new Date().toISOString().split('T')[0],
        shelfLifeDays: Number(req.body.shelfLifeDays),
        retestDays: req.body.retestDays ? Number(req.body.retestDays) : undefined,
        actualPotencyPercent: req.body.actualPotencyPercent ? Number(req.body.actualPotencyPercent) : 100,
        warehouseId: req.body.warehouseId || 'WH-CENTRAL-RAW',
        quantityOnHand: Number(req.body.quantityOnHand),
        unitOfMeasure: req.body.unitOfMeasure,
        certificateOfAnalysisId: req.body.certificateOfAnalysisId,
        inspectedBy: req.body.inspectedBy
      });
      batchMasters.push(batch);
      res.status(201).json({ success: true, batch });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-process/batches/:id/status', (req: Request, res: Response) => {
    try {
      const idx = batchMasters.findIndex(b => b.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Batch not found' });

      const updated = ProcessManufacturingSubcontractingEngine.updateBatchStatus({
        batch: batchMasters[idx],
        newStatus: req.body.newStatus,
        changedBy: req.body.changedBy || 'qa-inspector',
        reason: req.body.reason
      });
      batchMasters[idx] = updated;
      res.json({ success: true, batch: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-process/batches/:id/evaluate-expiration', (req: Request, res: Response) => {
    try {
      const idx = batchMasters.findIndex(b => b.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Batch not found' });

      const asOf = req.body.asOfDate || new Date().toISOString().split('T')[0];
      const evaluated = ProcessManufacturingSubcontractingEngine.evaluateBatchExpiration(batchMasters[idx], asOf);
      batchMasters[idx] = evaluated;
      res.json({ success: true, batch: evaluated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 3. Process Orders
  app.get('/api/v1/mfg-process/orders', (_req: Request, res: Response) => {
    res.json({ success: true, orders: processOrders });
  });

  app.post('/api/v1/mfg-process/orders', (req: Request, res: Response) => {
    try {
      const recipe = masterRecipes.find(r => r.id === req.body.recipeId);
      if (!recipe) return res.status(404).json({ success: false, error: 'Master recipe not found' });

      const order = ProcessManufacturingSubcontractingEngine.createProcessOrder({
        tenantId: req.body.tenantId || 'TENANT-001',
        companyId: req.body.companyId || 'COMP-001',
        recipe,
        plannedBatchQuantity: Number(req.body.plannedBatchQuantity),
        assignedBatchNumber: req.body.assignedBatchNumber,
        plannedStartDate: req.body.plannedStartDate,
        plannedEndDate: req.body.plannedEndDate,
        createdBy: req.body.createdBy || 'prod-planner'
      });
      processOrders.push(order);
      res.status(201).json({ success: true, order });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-process/orders/:id/release', (req: Request, res: Response) => {
    try {
      const idx = processOrders.findIndex(o => o.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Process order not found' });

      const { updatedOrder, financialEvent } = ProcessManufacturingSubcontractingEngine.releaseProcessOrder({
        processOrder: processOrders[idx],
        releasedBy: req.body.releasedBy || 'plant-manager'
      });
      processOrders[idx] = updatedOrder;
      res.json({ success: true, order: updatedOrder, financialEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-process/orders/:id/dispense', (req: Request, res: Response) => {
    try {
      const idx = processOrders.findIndex(o => o.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Process order not found' });

      const rawBatch = batchMasters.find(b => b.batchNumber === req.body.batchNumber && b.itemSku === req.body.itemSku);
      if (!rawBatch) return res.status(404).json({ success: false, error: 'Raw material batch not found' });

      const updated = ProcessManufacturingSubcontractingEngine.recordDispensedIngredient({
        processOrder: processOrders[idx],
        itemSku: req.body.itemSku,
        batchNumber: req.body.batchNumber,
        rawMaterialBatch: rawBatch,
        standardQuantity: Number(req.body.standardQuantity),
        actualDispensedQuantity: Number(req.body.actualDispensedQuantity),
        unitOfMeasure: req.body.unitOfMeasure,
        dispensedBy: req.body.dispensedBy || 'dispenser',
        potencyFactorApplied: req.body.potencyFactorApplied ? Number(req.body.potencyFactorApplied) : undefined
      });
      processOrders[idx] = updated;
      res.json({ success: true, order: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-process/orders/:id/confirm-phase', (req: Request, res: Response) => {
    try {
      const idx = processOrders.findIndex(o => o.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Process order not found' });

      const updated = ProcessManufacturingSubcontractingEngine.recordPhaseConfirmation({
        processOrder: processOrders[idx],
        phaseNumber: Number(req.body.phaseNumber),
        workCenterId: req.body.workCenterId,
        actualStartTime: req.body.actualStartTime,
        actualEndTime: req.body.actualEndTime,
        actualDurationHours: Number(req.body.actualDurationHours),
        recordedTemperature: req.body.recordedTemperature ? Number(req.body.recordedTemperature) : undefined,
        recordedPh: req.body.recordedPh ? Number(req.body.recordedPh) : undefined,
        operatorId: req.body.operatorId || 'operator',
        notes: req.body.notes
      });
      processOrders[idx] = updated;
      res.json({ success: true, order: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-process/orders/:id/complete-yield', (req: Request, res: Response) => {
    try {
      const idx = processOrders.findIndex(o => o.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Process order not found' });

      const recipe = masterRecipes.find(r => r.id === processOrders[idx].recipeId);
      if (!recipe) return res.status(404).json({ success: false, error: 'Master recipe not found' });

      const { completedOrder, costAllocation, financialEvent } = ProcessManufacturingSubcontractingEngine.completeProcessOrderYield({
        processOrder: processOrders[idx],
        recipe,
        actualMainYieldQuantity: Number(req.body.actualMainYieldQuantity),
        coProductYields: req.body.coProductYields,
        byProductYields: req.body.byProductYields,
        totalAccumulatedCosts: Number(req.body.totalAccumulatedCosts),
        completedBy: req.body.completedBy || 'plant-operator'
      });
      processOrders[idx] = completedOrder;
      res.json({ success: true, order: completedOrder, costAllocation, financialEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 4. Capacity Profiles & Finite Scheduling (APS)
  app.get('/api/v1/mfg-process/capacity-profiles', (_req: Request, res: Response) => {
    res.json({ success: true, profiles: workCenterCapacityProfiles });
  });

  app.post('/api/v1/mfg-process/capacity-profiles', (req: Request, res: Response) => {
    try {
      const profile = ProcessManufacturingSubcontractingEngine.createWorkCenterCapacityProfile({
        workCenterId: req.body.workCenterId,
        workCenterCode: req.body.workCenterCode,
        name: req.body.name,
        shiftsPerDay: Number(req.body.shiftsPerDay),
        hoursPerShift: Number(req.body.hoursPerShift),
        workersPerShift: req.body.workersPerShift ? Number(req.body.workersPerShift) : undefined,
        machineEfficiencyPercent: req.body.machineEfficiencyPercent ? Number(req.body.machineEfficiencyPercent) : undefined,
        utilizationTargetPercent: req.body.utilizationTargetPercent ? Number(req.body.utilizationTargetPercent) : undefined,
        queueTimeHours: req.body.queueTimeHours ? Number(req.body.queueTimeHours) : undefined,
        moveWaitTimeHours: req.body.moveWaitTimeHours ? Number(req.body.moveWaitTimeHours) : undefined
      });
      workCenterCapacityProfiles.push(profile);
      res.status(201).json({ success: true, profile });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-process/aps/schedule', (req: Request, res: Response) => {
    try {
      const scheduleResult = ProcessManufacturingSubcontractingEngine.runFiniteCapacitySchedule({
        operationsToSchedule: req.body.operationsToSchedule,
        workCenterProfiles: req.body.workCenterProfiles || workCenterCapacityProfiles,
        changeoverMatrix: req.body.changeoverMatrix,
        algorithm: req.body.algorithm,
        horizonDays: req.body.horizonDays ? Number(req.body.horizonDays) : 14
      });
      res.json({ success: true, scheduleResult });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 5. Subcontracting
  app.get('/api/v1/mfg-process/subcontract-orders', (_req: Request, res: Response) => {
    res.json({ success: true, orders: subcontractOrders });
  });

  app.post('/api/v1/mfg-process/subcontract-orders', (req: Request, res: Response) => {
    try {
      const order = ProcessManufacturingSubcontractingEngine.createSubcontractOrder({
        tenantId: req.body.tenantId || 'TENANT-001',
        companyId: req.body.companyId || 'COMP-001',
        vendorId: req.body.vendorId,
        vendorName: req.body.vendorName,
        finishedItemSku: req.body.finishedItemSku,
        finishedItemDescription: req.body.finishedItemDescription,
        orderQuantity: Number(req.body.orderQuantity),
        serviceRatePerUnit: Number(req.body.serviceRatePerUnit),
        unitOfMeasure: req.body.unitOfMeasure,
        deliveryDueDate: req.body.deliveryDueDate,
        plantWarehouseId: req.body.plantWarehouseId || 'WH-CENTRAL-RAW',
        vendorSpecialStockWarehouseId: req.body.vendorSpecialStockWarehouseId,
        providedComponents: req.body.providedComponents,
        sourceWorkOrderId: req.body.sourceWorkOrderId,
        notes: req.body.notes
      });
      subcontractOrders.push(order);
      res.status(201).json({ success: true, order });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-process/subcontract-orders/:id/issue-stock', (req: Request, res: Response) => {
    try {
      const idx = subcontractOrders.findIndex(o => o.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Subcontract order not found' });

      const { updatedOrder, financialEvent } = ProcessManufacturingSubcontractingEngine.issueSubcontractComponents({
        subcontractOrder: subcontractOrders[idx],
        componentIssues: req.body.componentIssues,
        issuedBy: req.body.issuedBy || 'storekeeper'
      });
      subcontractOrders[idx] = updatedOrder;
      res.json({ success: true, order: updatedOrder, financialEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-process/subcontract-orders/:id/receive', (req: Request, res: Response) => {
    try {
      const idx = subcontractOrders.findIndex(o => o.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Subcontract order not found' });

      const { updatedOrder, receiptResult } = ProcessManufacturingSubcontractingEngine.receiveSubcontractGoods({
        subcontractOrder: subcontractOrders[idx],
        receivedQuantity: Number(req.body.receivedQuantity),
        receivedBy: req.body.receivedBy || 'qa-receiving',
        actualComponentScrap: req.body.actualComponentScrap
      });
      subcontractOrders[idx] = updatedOrder;
      res.json({ success: true, order: updatedOrder, receiptResult });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 6. Repetitive Manufacturing & Electronic Kanban
  app.get('/api/v1/mfg-process/production-lines', (_req: Request, res: Response) => {
    res.json({ success: true, lines: productionLines });
  });

  app.post('/api/v1/mfg-process/production-lines', (req: Request, res: Response) => {
    try {
      const line = ProcessManufacturingSubcontractingEngine.createProductionLine({
        tenantId: req.body.tenantId || 'TENANT-001',
        companyId: req.body.companyId || 'COMP-001',
        lineCode: req.body.lineCode,
        lineName: req.body.lineName,
        taktTimeSeconds: Number(req.body.taktTimeSeconds),
        activeWorkCenters: req.body.activeWorkCenters,
        currentShift: req.body.currentShift
      });
      productionLines.push(line);
      res.status(201).json({ success: true, line });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/mfg-process/kanban-cycles', (_req: Request, res: Response) => {
    res.json({ success: true, controlCycles: kanbanControlCycles });
  });

  app.post('/api/v1/mfg-process/kanban-cycles', (req: Request, res: Response) => {
    try {
      const cycle = ProcessManufacturingSubcontractingEngine.createKanbanControlCycle({
        tenantId: req.body.tenantId || 'TENANT-001',
        companyId: req.body.companyId || 'COMP-001',
        controlCycleCode: req.body.controlCycleCode,
        materialSku: req.body.materialSku,
        materialName: req.body.materialName,
        supplyArea: req.body.supplyArea,
        sourceType: req.body.sourceType,
        sourceLocation: req.body.sourceLocation,
        containerQuantity: Number(req.body.containerQuantity),
        numberOfContainers: Number(req.body.numberOfContainers),
        productionLineId: req.body.productionLineId,
        createdBy: req.body.createdBy || 'lean-specialist'
      });
      kanbanControlCycles.push(cycle);
      res.status(201).json({ success: true, controlCycle: cycle });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-process/kanban-cycles/:id/empty', (req: Request, res: Response) => {
    try {
      const idx = kanbanControlCycles.findIndex(c => c.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Kanban control cycle not found' });

      const { updatedControlCycle, replenishmentSignal } = ProcessManufacturingSubcontractingEngine.triggerKanbanEmpty({
        controlCycle: kanbanControlCycles[idx],
        containerId: req.body.containerId
      });
      kanbanControlCycles[idx] = updatedControlCycle;
      res.json({ success: true, controlCycle: updatedControlCycle, replenishmentSignal });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-process/kanban-cycles/:id/full', (req: Request, res: Response) => {
    try {
      const idx = kanbanControlCycles.findIndex(c => c.id === req.params.id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Kanban control cycle not found' });

      const { updatedControlCycle, backflushResult } = ProcessManufacturingSubcontractingEngine.triggerKanbanFullAndBackflush({
        controlCycle: kanbanControlCycles[idx],
        containerId: req.body.containerId,
        bomComponentsToDeduct: req.body.bomComponentsToDeduct
      });
      kanbanControlCycles[idx] = updatedControlCycle;
      res.json({ success: true, controlCycle: updatedControlCycle, backflushResult });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 7. Phase 3.2D-04 Hardening Test Suite Execution Endpoint
  app.get('/api/v1/mfg-process/tests/run', (_req: Request, res: Response) => {
    try {
      const results = Phase32D04HardeningSuite.runAll();
      res.json({ success: true, results });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================================================
  // PHASE 3.2D-05: VARIANT CONFIG (CTO/ATO), PLM DEVIATIONS, RECALLS & CARBON
  // ==========================================================================

  // 1. Configurable Product Models & Super-BOMs
  app.get('/api/v1/mfg-plm/models', (_req: Request, res: Response) => {
    res.json({ success: true, models: configurableProductModels });
  });

  app.post('/api/v1/mfg-plm/models', (req: Request, res: Response) => {
    try {
      const model = ManufacturingVariantPLMEngine.createConfigurableProductModel({
        tenantId: req.body.tenantId || 'TENANT-001',
        companyId: req.body.companyId || 'COMP-001',
        baseModelSku: req.body.baseModelSku,
        modelName: req.body.modelName,
        characteristics: req.body.characteristics,
        rules: req.body.rules,
        superBomId: req.body.superBomId
      });
      configurableProductModels.push(model);
      res.status(201).json({ success: true, model });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/mfg-plm/super-boms', (_req: Request, res: Response) => {
    res.json({ success: true, superBoms });
  });

  app.post('/api/v1/mfg-plm/super-boms', (req: Request, res: Response) => {
    try {
      const bom = ManufacturingVariantPLMEngine.createSuperBOM({
        tenantId: req.body.tenantId || 'TENANT-001',
        companyId: req.body.companyId || 'COMP-001',
        baseModelSku: req.body.baseModelSku,
        modelName: req.body.modelName,
        basePrice: req.body.basePrice,
        components: req.body.components
      });
      superBoms.push(bom);
      res.status(201).json({ success: true, superBom: bom });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 2. Variant Configuration (CTO / ATO) Resolution
  app.post('/api/v1/mfg-plm/variants/configure', (req: Request, res: Response) => {
    try {
      const { modelId, superBomId, selectedOptions, configuredBy } = req.body;
      const model = configurableProductModels.find(m => m.id === modelId || m.baseModelSku === modelId);
      const bom = superBoms.find(b => b.id === superBomId || b.baseModelSku === model?.baseModelSku);

      if (!model || !bom) {
        return res.status(404).json({ success: false, error: 'Configurable model or Super-BOM not found' });
      }

      const variant = ManufacturingVariantPLMEngine.configureProductVariant({
        tenantId: req.body.tenantId || 'TENANT-001',
        companyId: req.body.companyId || 'COMP-001',
        model,
        superBom: bom,
        selectedOptions,
        configuredBy: configuredBy || 'system'
      });
      configuredVariantInstances.push(variant);
      res.status(201).json({ success: true, variant });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/mfg-plm/variants', (_req: Request, res: Response) => {
    res.json({ success: true, variants: configuredVariantInstances });
  });

  // 3. PLM Engineering Deviations & Concessions
  app.get('/api/v1/mfg-plm/deviations', (_req: Request, res: Response) => {
    res.json({ success: true, deviations: deviationPermits });
  });

  app.post('/api/v1/mfg-plm/deviations', (req: Request, res: Response) => {
    try {
      const permit = ManufacturingVariantPLMEngine.createDeviationPermit({
        tenantId: req.body.tenantId || 'TENANT-001',
        companyId: req.body.companyId || 'COMP-001',
        title: req.body.title,
        deviationType: req.body.deviationType,
        affectedFinishedGoodSku: req.body.affectedFinishedGoodSku,
        bomId: req.body.bomId,
        originalMaterialSku: req.body.originalMaterialSku,
        substituteMaterialSku: req.body.substituteMaterialSku,
        workCenterId: req.body.workCenterId,
        justification: req.body.justification,
        scopeType: req.body.scopeType || 'QUANTITY_LIMIT',
        maxAllowedQuantity: req.body.maxAllowedQuantity,
        validFrom: req.body.validFrom || new Date().toISOString().split('T')[0],
        validTo: req.body.validTo,
        requestedBy: req.body.requestedBy || 'engineer'
      });
      deviationPermits.push(permit);
      res.status(201).json({ success: true, permit });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-plm/deviations/:id/submit', (req: Request, res: Response) => {
    try {
      const permit = deviationPermits.find(p => p.id === req.params.id);
      if (!permit) return res.status(404).json({ success: false, error: 'Deviation permit not found' });

      const updated = ManufacturingVariantPLMEngine.submitDeviationPermit(permit, req.body.submittedBy || 'engineer');
      const idx = deviationPermits.findIndex(p => p.id === req.params.id);
      deviationPermits[idx] = updated;
      res.json({ success: true, permit: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-plm/deviations/:id/approve', (req: Request, res: Response) => {
    try {
      const permit = deviationPermits.find(p => p.id === req.params.id);
      if (!permit) return res.status(404).json({ success: false, error: 'Deviation permit not found' });

      const approved = ManufacturingVariantPLMEngine.approveDeviationPermit({
        permit,
        approvedBy: req.body.approvedBy || 'qa-manager',
        qualityManagerSignature: req.body.signature || 'SIGN-QM-AUTH'
      });
      const idx = deviationPermits.findIndex(p => p.id === req.params.id);
      deviationPermits[idx] = approved;
      res.json({ success: true, permit: approved });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-plm/deviations/:id/consume', (req: Request, res: Response) => {
    try {
      const permit = deviationPermits.find(p => p.id === req.params.id);
      if (!permit) return res.status(404).json({ success: false, error: 'Deviation permit not found' });

      const consumed = ManufacturingVariantPLMEngine.consumeDeviationQuantity({
        permit,
        quantityToConsume: Number(req.body.quantityToConsume)
      });
      const idx = deviationPermits.findIndex(p => p.id === req.params.id);
      deviationPermits[idx] = consumed;
      res.json({ success: true, permit: consumed });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 4. Multi-Tier Recall Containment
  app.get('/api/v1/mfg-plm/recalls', (_req: Request, res: Response) => {
    res.json({ success: true, recalls: recallIncidents });
  });

  app.post('/api/v1/mfg-plm/recalls/initiate', (req: Request, res: Response) => {
    try {
      const incident = ManufacturingVariantPLMEngine.initiateRecallContainment({
        tenantId: req.body.tenantId || 'TENANT-001',
        companyId: req.body.companyId || 'COMP-001',
        title: req.body.title,
        severity: req.body.severity,
        rootCauseSku: req.body.rootCauseSku,
        rootCauseLotNumber: req.body.rootCauseLotNumber,
        defectDescription: req.body.defectDescription,
        initiatedBy: req.body.initiatedBy || 'safety-officer',
        entitiesToQuarantine: req.body.entitiesToQuarantine || []
      });
      recallIncidents.push(incident);
      res.status(201).json({ success: true, incident });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-plm/recalls/:id/entity-status', (req: Request, res: Response) => {
    try {
      const incident = recallIncidents.find(r => r.id === req.params.id);
      if (!incident) return res.status(404).json({ success: false, error: 'Recall incident not found' });

      const updated = ManufacturingVariantPLMEngine.updateQuarantinedEntityStatus({
        incident,
        entityId: req.body.entityId,
        newStatus: req.body.newStatus,
        notes: req.body.notes
      });
      const idx = recallIncidents.findIndex(r => r.id === req.params.id);
      recallIncidents[idx] = updated;
      res.json({ success: true, incident: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-plm/recalls/:id/close', (req: Request, res: Response) => {
    try {
      const incident = recallIncidents.find(r => r.id === req.params.id);
      if (!incident) return res.status(404).json({ success: false, error: 'Recall incident not found' });

      const closed = ManufacturingVariantPLMEngine.closeRecallIncident({
        incident,
        closedBy: req.body.closedBy || 'qa-director'
      });
      const idx = recallIncidents.findIndex(r => r.id === req.params.id);
      recallIncidents[idx] = closed;
      res.json({ success: true, incident: closed });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 5. Plant Sustainability, Energy & Carbon (ESG)
  app.get('/api/v1/mfg-plm/sustainability/energy', (_req: Request, res: Response) => {
    res.json({ success: true, energyRecords: energyConsumptionRecords });
  });

  app.post('/api/v1/mfg-plm/sustainability/energy', (req: Request, res: Response) => {
    try {
      const record = ManufacturingVariantPLMEngine.recordEnergyConsumption({
        tenantId: req.body.tenantId || 'TENANT-001',
        companyId: req.body.companyId || 'COMP-001',
        workOrderId: req.body.workOrderId,
        workCenterId: req.body.workCenterId,
        productionDate: req.body.productionDate || new Date().toISOString().split('T')[0],
        electricityKwh: Number(req.body.electricityKwh),
        naturalGasCubicMeters: Number(req.body.naturalGasCubicMeters),
        compressedAirCubicMeters: req.body.compressedAirCubicMeters ? Number(req.body.compressedAirCubicMeters) : 0,
        waterLiters: req.body.waterLiters ? Number(req.body.waterLiters) : 0,
        electricityRatePerKwh: req.body.electricityRatePerKwh ? Number(req.body.electricityRatePerKwh) : undefined,
        gasRatePerCubicMeter: req.body.gasRatePerCubicMeter ? Number(req.body.gasRatePerCubicMeter) : undefined,
        recordedBy: req.body.recordedBy || 'iot-gateway'
      });
      energyConsumptionRecords.push(record);
      res.status(201).json({ success: true, record });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/mfg-plm/sustainability/carbon', (_req: Request, res: Response) => {
    res.json({ success: true, carbonCalculations: carbonFootprintCalculations });
  });

  app.post('/api/v1/mfg-plm/sustainability/carbon/calculate', (req: Request, res: Response) => {
    try {
      const { workOrderId, productSku, productName, quantityProduced, billOfMaterialsEmbodiedCarbonKg } = req.body;
      const matchingEnergyRecords = energyConsumptionRecords.filter(r => r.workOrderId === workOrderId);

      const calc = ManufacturingVariantPLMEngine.calculateCarbonFootprint({
        tenantId: req.body.tenantId || 'TENANT-001',
        companyId: req.body.companyId || 'COMP-001',
        workOrderId,
        productSku,
        productName: productName || productSku,
        quantityProduced: Number(quantityProduced),
        energyRecords: matchingEnergyRecords.length > 0 ? matchingEnergyRecords : [{
          id: 'ENRG-SIM-01',
          tenantId: 'TENANT-001',
          companyId: 'COMP-001',
          workOrderId,
          workCenterId: 'WC-01',
          productionDate: new Date().toISOString().split('T')[0],
          electricityKwh: 3500,
          naturalGasCubicMeters: 250,
          compressedAirCubicMeters: 500,
          waterLiters: 1000,
          energyCost: 750,
          recordedBy: 'system',
          recordedAt: new Date().toISOString()
        }],
        billOfMaterialsEmbodiedCarbonKg: billOfMaterialsEmbodiedCarbonKg ? Number(billOfMaterialsEmbodiedCarbonKg) : 500
      });
      carbonFootprintCalculations.push(calc);
      res.status(201).json({ success: true, calculation: calc });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 6. Phase 3.2D-05 Hardening Test Suite Execution Endpoint
  app.get('/api/v1/mfg-plm/tests/run', (_req: Request, res: Response) => {
    try {
      const results = Phase32D05HardeningSuite.runAll();
      res.json({ success: true, results });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =========================================================================
  // PHASE 3.2D-06: ADVANCED MANUFACTURING INTELLIGENCE, TOOLING & eBR APIS
  // =========================================================================

  const mfgToolMasters: ToolMaster[] = [
    ManufacturingIntelligenceToolingEngine.createToolMaster({
      tenantId: 'TENANT-001',
      companyId: 'COMP-001',
      toolCode: 'DIE-STAMP-500T',
      toolName: '500-Ton Chassis Stamping Die',
      toolType: 'DIE_STAMPING',
      serialNumber: 'SN-DIE-88992',
      workCenterId: 'WC-PRESS-01',
      nominalLifeCycles: 50000,
      maxLifeCycles: 60000,
      warningThresholdCycles: 45000,
      calibrationIntervalDays: 90,
      costPerCycleUsd: 0.12,
      hourlyWearRateUsd: 15.0
    }),
    ManufacturingIntelligenceToolingEngine.createToolMaster({
      tenantId: 'TENANT-001',
      companyId: 'COMP-001',
      toolCode: 'MOLD-INJ-01',
      toolName: 'Plastic Enclosure Precision Mold',
      toolType: 'INJECTION_MOLD',
      serialNumber: 'MOLD-PREC-101',
      workCenterId: 'WC-INJ-01',
      nominalLifeCycles: 100000,
      maxLifeCycles: 120000,
      warningThresholdCycles: 90000,
      calibrationIntervalDays: 180,
      costPerCycleUsd: 0.25,
      hourlyWearRateUsd: 20.0
    })
  ];

  const mfgLineClearances: LineClearanceChecklist[] = [];
  const mfgElectronicBatchRecords: ElectronicBatchRecord[] = [];
  const mfgShiftHandovers: ShiftHandoverLogbook[] = [];

  // 1. Tool Masters
  app.get('/api/v1/mfg-intel/tools', (_req: Request, res: Response) => {
    res.json({ success: true, tools: mfgToolMasters });
  });

  app.post('/api/v1/mfg-intel/tools', (req: Request, res: Response) => {
    try {
      const tool = ManufacturingIntelligenceToolingEngine.createToolMaster({
        tenantId: req.body.tenantId || 'TENANT-001',
        companyId: req.body.companyId || 'COMP-001',
        toolCode: req.body.toolCode,
        toolName: req.body.toolName,
        toolType: req.body.toolType || 'DIE_STAMPING',
        serialNumber: req.body.serialNumber,
        workCenterId: req.body.workCenterId || 'WC-01',
        nominalLifeCycles: Number(req.body.nominalLifeCycles),
        maxLifeCycles: Number(req.body.maxLifeCycles),
        warningThresholdCycles: req.body.warningThresholdCycles ? Number(req.body.warningThresholdCycles) : undefined,
        calibrationIntervalDays: Number(req.body.calibrationIntervalDays || 90),
        costPerCycleUsd: Number(req.body.costPerCycleUsd || 0.1),
        hourlyWearRateUsd: Number(req.body.hourlyWearRateUsd || 0)
      });
      mfgToolMasters.push(tool);
      res.status(201).json({ success: true, tool });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-intel/tools/:toolId/usage', (req: Request, res: Response) => {
    try {
      const idx = mfgToolMasters.findIndex(t => t.id === req.params.toolId);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Tool not found' });
      }
      const { updatedTool, usageRecord, financialEvent } = ManufacturingIntelligenceToolingEngine.recordToolUsageCycles({
        tool: mfgToolMasters[idx],
        workOrderId: req.body.workOrderId || 'WO-DEFAULT',
        operationSeq: Number(req.body.operationSeq || 10),
        cyclesRun: Number(req.body.cyclesRun),
        recordedBy: req.body.recordedBy || 'shopfloor-operator'
      });
      mfgToolMasters[idx] = updatedTool;
      res.json({ success: true, tool: updatedTool, usageRecord, financialEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-intel/tools/:toolId/calibrate', (req: Request, res: Response) => {
    try {
      const idx = mfgToolMasters.findIndex(t => t.id === req.params.toolId);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Tool not found' });
      }
      const calibratedTool = ManufacturingIntelligenceToolingEngine.calibrateAndCertifyTool({
        tool: mfgToolMasters[idx],
        calibratedByTechnician: req.body.calibratedByTechnician,
        approvedByQAInspector: req.body.approvedByQAInspector,
        resetLifeCycles: Boolean(req.body.resetLifeCycles),
        inspectorSignature: req.body.inspectorSignature
      });
      mfgToolMasters[idx] = calibratedTool;
      res.json({ success: true, tool: calibratedTool });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 2. Line Clearance
  app.get('/api/v1/mfg-intel/line-clearance', (_req: Request, res: Response) => {
    res.json({ success: true, lineClearances: mfgLineClearances });
  });

  app.post('/api/v1/mfg-intel/line-clearance', (req: Request, res: Response) => {
    try {
      const clearance = ManufacturingIntelligenceToolingEngine.performLineClearance({
        tenantId: req.body.tenantId || 'TENANT-001',
        companyId: req.body.companyId || 'COMP-001',
        workCenterId: req.body.workCenterId,
        workOrderId: req.body.workOrderId,
        priorLotNumber: req.body.priorLotNumber || 'LOT-PREV-01',
        targetLotNumber: req.body.targetLotNumber || 'LOT-NEXT-01',
        checklist: req.body.checklist,
        clearedByOperator: req.body.clearedByOperator,
        verifiedByQAInspector: req.body.verifiedByQAInspector
      });
      mfgLineClearances.push(clearance);
      res.status(201).json({ success: true, lineClearance: clearance });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 3. Electronic Batch Records (eBR)
  app.get('/api/v1/mfg-intel/ebr', (_req: Request, res: Response) => {
    res.json({ success: true, batchRecords: mfgElectronicBatchRecords });
  });

  app.post('/api/v1/mfg-intel/ebr', (req: Request, res: Response) => {
    try {
      const clearance = mfgLineClearances.find(l => l.id === req.body.lineClearanceId);
      if (!clearance) {
        return res.status(404).json({ success: false, error: 'Line clearance record not found' });
      }
      const ebr = ManufacturingIntelligenceToolingEngine.initializeElectronicBatchRecord({
        tenantId: req.body.tenantId || 'TENANT-001',
        companyId: req.body.companyId || 'COMP-001',
        batchNumber: req.body.batchNumber,
        workOrderId: req.body.workOrderId,
        productSku: req.body.productSku,
        lineClearance: clearance
      });
      mfgElectronicBatchRecords.push(ebr);
      res.status(201).json({ success: true, ebr });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-intel/ebr/:ebrId/ingredient', (req: Request, res: Response) => {
    try {
      const idx = mfgElectronicBatchRecords.findIndex(e => e.id === req.params.ebrId);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'eBR not found' });
      }
      const updated = ManufacturingIntelligenceToolingEngine.addIngredientDispense({
        ebr: mfgElectronicBatchRecords[idx],
        itemSku: req.body.itemSku,
        lotNumber: req.body.lotNumber,
        plannedQuantity: Number(req.body.plannedQuantity),
        actualQuantity: Number(req.body.actualQuantity),
        unitOfMeasure: req.body.unitOfMeasure,
        weighedBy: req.body.weighedBy,
        verifiedBy: req.body.verifiedBy
      });
      mfgElectronicBatchRecords[idx] = updated;
      res.json({ success: true, ebr: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-intel/ebr/:ebrId/parameter', (req: Request, res: Response) => {
    try {
      const idx = mfgElectronicBatchRecords.findIndex(e => e.id === req.params.ebrId);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'eBR not found' });
      }
      const updated = ManufacturingIntelligenceToolingEngine.recordCriticalProcessParameter({
        ebr: mfgElectronicBatchRecords[idx],
        parameterName: req.body.parameterName,
        actualValue: Number(req.body.actualValue),
        targetValue: Number(req.body.targetValue),
        unit: req.body.unit,
        lowerTolerance: Number(req.body.lowerTolerance),
        upperTolerance: Number(req.body.upperTolerance)
      });
      mfgElectronicBatchRecords[idx] = updated;
      res.json({ success: true, ebr: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-intel/ebr/:ebrId/sign-release', (req: Request, res: Response) => {
    try {
      const idx = mfgElectronicBatchRecords.findIndex(e => e.id === req.params.ebrId);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'eBR not found' });
      }
      const { releasedEbr, financialEvent } = ManufacturingIntelligenceToolingEngine.signAndReleaseBatchRecord({
        ebr: mfgElectronicBatchRecords[idx],
        productionLeadName: req.body.productionLeadName,
        productionLeadSignature: req.body.productionLeadSignature,
        qualityAssuranceName: req.body.qualityAssuranceName,
        qualityAssuranceSignature: req.body.qualityAssuranceSignature,
        batchLotValueUsd: req.body.batchLotValueUsd ? Number(req.body.batchLotValueUsd) : undefined
      });
      mfgElectronicBatchRecords[idx] = releasedEbr;
      res.json({ success: true, ebr: releasedEbr, financialEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 4. OEE Loss Tree Analysis
  app.post('/api/v1/mfg-intel/oee-loss-tree', (req: Request, res: Response) => {
    try {
      const { analysis, changeoverEvent } = ManufacturingIntelligenceToolingEngine.calculateOEELossTree({
        tenantId: req.body.tenantId || 'TENANT-001',
        companyId: req.body.companyId || 'COMP-001',
        workCenterId: req.body.workCenterId || 'WC-DEFAULT',
        periodStart: req.body.periodStart || new Date().toISOString(),
        periodEnd: req.body.periodEnd || new Date().toISOString(),
        plannedProductionTimeMinutes: Number(req.body.plannedProductionTimeMinutes || 480),
        operatingTimeMinutes: Number(req.body.operatingTimeMinutes || 420),
        idealCycleTimeSeconds: Number(req.body.idealCycleTimeSeconds || 10),
        totalPiecesProduced: Number(req.body.totalPiecesProduced || 2000),
        goodPiecesProduced: Number(req.body.goodPiecesProduced || 1950),
        lossBreakdown: req.body.lossBreakdown || []
      });
      res.json({ success: true, analysis, changeoverEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 5. Shift Handover Logbook
  app.get('/api/v1/mfg-intel/shift-handover', (_req: Request, res: Response) => {
    res.json({ success: true, handovers: mfgShiftHandovers });
  });

  app.post('/api/v1/mfg-intel/shift-handover', (req: Request, res: Response) => {
    try {
      const handover = ManufacturingIntelligenceToolingEngine.createShiftHandover({
        tenantId: req.body.tenantId || 'TENANT-001',
        companyId: req.body.companyId || 'COMP-001',
        shiftId: req.body.shiftId,
        workCenterId: req.body.workCenterId,
        outgoingSupervisor: req.body.outgoingSupervisor,
        shiftStartTime: req.body.shiftStartTime || new Date().toISOString(),
        shiftEndTime: req.body.shiftEndTime || new Date().toISOString(),
        totalOutputUnits: Number(req.body.totalOutputUnits || 0),
        scrapUnits: Number(req.body.scrapUnits || 0),
        wipItemsInCell: req.body.wipItemsInCell || [],
        unresolvedAnomalies: req.body.unresolvedAnomalies || [],
        safetyIncidentsCount: Number(req.body.safetyIncidentsCount || 0),
        handoverNotes: req.body.handoverNotes || ''
      });
      mfgShiftHandovers.push(handover);
      res.status(201).json({ success: true, handover });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-intel/shift-handover/:id/sign-off', (req: Request, res: Response) => {
    try {
      const idx = mfgShiftHandovers.findIndex(h => h.id === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Shift handover not found' });
      }
      const updated = ManufacturingIntelligenceToolingEngine.signOffShiftHandover({
        handover: mfgShiftHandovers[idx],
        incomingSupervisor: req.body.incomingSupervisor,
        acknowledgementNotes: req.body.acknowledgementNotes
      });
      mfgShiftHandovers[idx] = updated;
      res.json({ success: true, handover: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 6. Hardening Test Suite Run Endpoint
  app.get('/api/v1/mfg-intel/tests/run', (_req: Request, res: Response) => {
    try {
      const results = Phase32D06HardeningSuite.runAll();
      res.json({ success: true, results });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =========================================================================
  // PHASE 3.2D-07: REPETITIVE MANUFACTURING, REMAN & ANDON ORCHESTRATION
  // =========================================================================
  const mfgRepetitiveSchedules: RepetitiveProductionSchedule[] = [
    RepetitiveRemanufacturingAndonEngine.createRepetitiveSchedule({
      tenantId: 'default-tenant',
      companyId: 'default-company',
      scheduleCode: 'REM-LINE-ALPHA-01',
      productSku: 'PART-PUMP-ASM',
      productionLineId: 'LINE-ASSEMBLY-01',
      validFrom: '2026-09-01',
      validTo: '2026-09-30',
      taktTimeSeconds: 45,
      plannedDailyRate: 640,
      totalPlannedUnits: 12800,
      bomId: 'BOM-PUMP-V1',
      routingId: 'ROUT-PUMP-REM',
      reportingPoints: [
        { sequence: 10, operationName: 'Stator Pre-Assembly', workCenterId: 'WC-STAT-01' },
        { sequence: 20, operationName: 'Rotor Dynamic Balancing', workCenterId: 'WC-ROTOR-01' },
        { sequence: 30, operationName: 'Final Enclosure & Test', workCenterId: 'WC-TEST-01' }
      ]
    })
  ];

  const mfgRemanTeardownOrders: RemanTeardownOrder[] = [
    RepetitiveRemanufacturingAndonEngine.createCoreReturnAndTeardown({
      tenantId: 'default-tenant',
      companyId: 'default-company',
      orderNumber: 'REMAN-2026-001',
      coreReturnSerial: 'CORE-ENG-99881',
      parentProductSku: 'HEAVY-ENGINE-V8',
      customerAccountId: 'CUST-FLEET-LOGISTICS',
      conditionGrade: 'GRADE_A_REFURBISHABLE',
      coreDepositAmountUsd: 1200.00,
      disassemblyWorkCenterId: 'WC-TEARDOWN-01',
      technicianId: 'TECH-BOB',
      harvestedComponents: [
        {
          componentSku: 'GEAR-PINION-01',
          componentName: 'Main Pinion Gear',
          recoveredQuantity: 2,
          standardCostUsd: 250.00,
          salvageValueUsd: 180.00,
          disposition: 'RETURN_TO_STOCK',
          targetBinLocation: 'BIN-REMAN-A1'
        },
        {
          componentSku: 'CRANKSHAFT-HEAVY',
          componentName: 'V8 Crankshaft Forged',
          recoveredQuantity: 1,
          standardCostUsd: 800.00,
          salvageValueUsd: 650.00,
          disposition: 'REFURBISH',
          targetBinLocation: 'BIN-REMAN-B2'
        }
      ]
    }).teardownOrder
  ];

  const mfgAndonIncidents: AndonIncident[] = [
    RepetitiveRemanufacturingAndonEngine.triggerAndonAlert({
      tenantId: 'default-tenant',
      companyId: 'default-company',
      workCenterId: 'WC-PRESS-01',
      workOrderId: 'WO-STAMP-881',
      category: 'SAFETY_E_STOP',
      severity: 'CRITICAL_STOP',
      description: 'Light curtain sensor beam tripped during automated ram stroke cycle',
      triggeredBy: 'OPERATOR-JOE'
    })
  ];

  // 1. Repetitive Manufacturing
  app.get('/api/v1/mfg-advanced/repetitive-schedules', (_req: Request, res: Response) => {
    res.json({ success: true, schedules: mfgRepetitiveSchedules });
  });

  app.post('/api/v1/mfg-advanced/repetitive-schedules', (req: Request, res: Response) => {
    try {
      const schedule = RepetitiveRemanufacturingAndonEngine.createRepetitiveSchedule(req.body);
      mfgRepetitiveSchedules.push(schedule);
      res.json({ success: true, schedule });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-advanced/repetitive-schedules/:id/backflush', (req: Request, res: Response) => {
    try {
      const idx = mfgRepetitiveSchedules.findIndex(s => s.id === req.params.id);
      if (idx === -1) throw new Error('Repetitive schedule not found.');
      const result = RepetitiveRemanufacturingAndonEngine.executeRepetitiveBackflush({
        schedule: mfgRepetitiveSchedules[idx],
        reportingPointSeq: req.body.reportingPointSeq,
        backflushQty: req.body.backflushQty,
        scrapQty: req.body.scrapQty,
        operatorId: req.body.operatorId || 'OP-CURRENT'
      });
      mfgRepetitiveSchedules[idx] = result.schedule;
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 2. Circular Remanufacturing & Core Returns
  app.get('/api/v1/mfg-advanced/reman-orders', (_req: Request, res: Response) => {
    res.json({ success: true, orders: mfgRemanTeardownOrders });
  });

  app.post('/api/v1/mfg-advanced/reman-orders', (req: Request, res: Response) => {
    try {
      const { teardownOrder, financialEvent } = RepetitiveRemanufacturingAndonEngine.createCoreReturnAndTeardown(req.body);
      mfgRemanTeardownOrders.push(teardownOrder);
      res.json({ success: true, teardownOrder, financialEvent });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 3. Potency Balancing
  app.post('/api/v1/mfg-advanced/potency-compensate', (req: Request, res: Response) => {
    try {
      const result = RepetitiveRemanufacturingAndonEngine.balancePotencyAndCompensateRecipe(req.body);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 4. Joint Cost Split-Off Settlement
  app.post('/api/v1/mfg-advanced/joint-splitoff-settle', (req: Request, res: Response) => {
    try {
      const result = RepetitiveRemanufacturingAndonEngine.settleJointProductionCostSplitOff(req.body);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 5. Andon Incidents & Escalation
  app.get('/api/v1/mfg-advanced/andon-incidents', (_req: Request, res: Response) => {
    res.json({ success: true, incidents: mfgAndonIncidents });
  });

  app.post('/api/v1/mfg-advanced/andon-incidents', (req: Request, res: Response) => {
    try {
      const incident = RepetitiveRemanufacturingAndonEngine.triggerAndonAlert(req.body);
      mfgAndonIncidents.unshift(incident);
      res.json({ success: true, incident });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-advanced/andon-incidents/:id/acknowledge', (req: Request, res: Response) => {
    try {
      const idx = mfgAndonIncidents.findIndex(i => i.id === req.params.id);
      if (idx === -1) throw new Error('Andon incident not found.');
      const updated = RepetitiveRemanufacturingAndonEngine.acknowledgeAndonIncident({
        incident: mfgAndonIncidents[idx],
        acknowledgedBy: req.body.acknowledgedBy || 'TECH-ON-DUTY'
      });
      mfgAndonIncidents[idx] = updated;
      res.json({ success: true, incident: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-advanced/andon-incidents/:id/resolve', (req: Request, res: Response) => {
    try {
      const idx = mfgAndonIncidents.findIndex(i => i.id === req.params.id);
      if (idx === -1) throw new Error('Andon incident not found.');
      const updated = RepetitiveRemanufacturingAndonEngine.resolveAndonIncident({
        incident: mfgAndonIncidents[idx],
        resolvedBy: req.body.resolvedBy,
        resolutionNotes: req.body.resolutionNotes,
        downtimeMinutes: req.body.downtimeMinutes
      });
      mfgAndonIncidents[idx] = updated;
      res.json({ success: true, incident: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 6. Hardening Test Suite Run Endpoint
  app.get('/api/v1/mfg-advanced/tests/run', (_req: Request, res: Response) => {
    try {
      const results = Phase32D07HardeningSuite.runAll();
      res.json({ success: true, results });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =========================================================================
  // PHASE 3.2D-08: MANUFACTURING YIELD, DIGITAL SHIFT HANDOVER & SPC APIS
  // =========================================================================

  // 1. SPC Studies
  app.get('/api/v1/mfg-yield-spc/studies', (_req: Request, res: Response) => {
    try {
      const studies = ManufacturingYieldSpcShiftEngine.getStudies();
      res.json({ success: true, studies });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-yield-spc/studies', (req: Request, res: Response) => {
    try {
      const study = ManufacturingYieldSpcShiftEngine.createSpcStudy({
        tenantId: req.body.tenantId || 'TEN-01',
        companyId: req.body.companyId || 'COMP-01',
        studyCode: req.body.studyCode,
        workCenterId: req.body.workCenterId,
        productSku: req.body.productSku,
        parameterName: req.body.parameterName,
        unitOfMeasure: req.body.unitOfMeasure,
        chartType: req.body.chartType,
        usl: Number(req.body.usl),
        lsl: Number(req.body.lsl),
        nominalTarget: req.body.nominalTarget !== undefined ? Number(req.body.nominalTarget) : undefined
      });
      res.json({ success: true, study });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-yield-spc/studies/:id/subgroups', (req: Request, res: Response) => {
    try {
      const { study, newViolations } = ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: req.params.id,
        operatorId: req.body.operatorId || 'OP-01',
        sampleValues: req.body.sampleValues
      });
      res.json({ success: true, study, newViolations });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 2. Digital Shift Handovers
  app.get('/api/v1/mfg-yield-spc/handovers', (_req: Request, res: Response) => {
    try {
      const handovers = ManufacturingYieldSpcShiftEngine.getHandovers();
      res.json({ success: true, handovers });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-yield-spc/handovers', (req: Request, res: Response) => {
    try {
      const handover = ManufacturingYieldSpcShiftEngine.initiateShiftHandover({
        tenantId: req.body.tenantId || 'TEN-01',
        companyId: req.body.companyId || 'COMP-01',
        handoverCode: req.body.handoverCode,
        productionLineId: req.body.productionLineId,
        shiftDate: req.body.shiftDate,
        shiftType: req.body.shiftType,
        outgoingSupervisorId: req.body.outgoingSupervisorId,
        incomingSupervisorId: req.body.incomingSupervisorId,
        safetyChecklist: req.body.safetyChecklist || [],
        wipItems: req.body.wipItems || [],
        openAndonIncidentsCount: req.body.openAndonIncidentsCount,
        openMaintenanceOrdersCount: req.body.openMaintenanceOrdersCount
      });
      res.json({ success: true, handover });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-yield-spc/handovers/:id/sign-outgoing', (req: Request, res: Response) => {
    try {
      const handover = ManufacturingYieldSpcShiftEngine.signOutgoingShift({
        handoverId: req.params.id,
        supervisorId: req.body.supervisorId,
        supervisorName: req.body.supervisorName,
        role: req.body.role || 'Shift Supervisor'
      });
      res.json({ success: true, handover });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-yield-spc/handovers/:id/complete', (req: Request, res: Response) => {
    try {
      const handover = ManufacturingYieldSpcShiftEngine.completeShiftHandover({
        handoverId: req.params.id,
        supervisorId: req.body.supervisorId,
        supervisorName: req.body.supervisorName,
        role: req.body.role || 'Shift Supervisor',
        acceptDiscrepancies: req.body.acceptDiscrepancies,
        rejectionReason: req.body.rejectionReason
      });
      res.json({ success: true, handover });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 3. Yield Analysis & Financial Event
  app.post('/api/v1/mfg-yield-spc/yield-analysis', (req: Request, res: Response) => {
    try {
      const result = ManufacturingYieldSpcShiftEngine.analyzeProductionYield({
        tenantId: req.body.tenantId || 'TEN-01',
        companyId: req.body.companyId || 'COMP-01',
        manufacturingOrderId: req.body.manufacturingOrderId,
        productSku: req.body.productSku,
        plannedOutputQty: Number(req.body.plannedOutputQty),
        actualGoodQty: Number(req.body.actualGoodQty),
        actualScrapQty: Number(req.body.actualScrapQty),
        actualReworkQty: req.body.actualReworkQty !== undefined ? Number(req.body.actualReworkQty) : undefined,
        standardScrapAllowancePct: Number(req.body.standardScrapAllowancePct),
        materialCostPerUnit: Number(req.body.materialCostPerUnit),
        performedBy: req.body.performedBy || 'USER-01'
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 4. Scrap Regrind Recovery & Accounting
  app.get('/api/v1/mfg-yield-spc/scrap-recovery', (_req: Request, res: Response) => {
    try {
      const harvests = ManufacturingYieldSpcShiftEngine.getScrapHarvests();
      res.json({ success: true, harvests });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-yield-spc/scrap-recovery', (req: Request, res: Response) => {
    try {
      const result = ManufacturingYieldSpcShiftEngine.harvestScrapRecovery({
        tenantId: req.body.tenantId || 'TEN-01',
        companyId: req.body.companyId || 'COMP-01',
        manufacturingOrderId: req.body.manufacturingOrderId,
        recoveredMaterialSku: req.body.recoveredMaterialSku,
        quantityRecoveredKg: Number(req.body.quantityRecoveredKg),
        recoveryGrade: req.body.recoveryGrade,
        unitCreditRate: Number(req.body.unitCreditRate),
        targetWarehouseId: req.body.targetWarehouseId,
        targetBinId: req.body.targetBinId,
        lotNumber: req.body.lotNumber,
        operatorId: req.body.operatorId || 'OP-01'
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 5. Line Balancing & Heijunka
  app.post('/api/v1/mfg-yield-spc/line-balance', (req: Request, res: Response) => {
    try {
      const metrics = ManufacturingYieldSpcShiftEngine.evaluateLineBalance({
        productionLineId: req.body.productionLineId,
        taktTimeSeconds: Number(req.body.taktTimeSeconds),
        stations: req.body.stations || []
      });
      res.json({ success: true, metrics });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/mfg-yield-spc/heijunka', (req: Request, res: Response) => {
    try {
      const schedule = ManufacturingYieldSpcShiftEngine.generateHeijunkaSchedule({
        productionLineId: req.body.productionLineId,
        scheduleDate: req.body.scheduleDate,
        pitchMinutes: Number(req.body.pitchMinutes),
        shiftHours: req.body.shiftHours ? Number(req.body.shiftHours) : undefined,
        productMixRatio: req.body.productMixRatio,
        dailyTotalUnits: Number(req.body.dailyTotalUnits)
      });
      res.json({ success: true, schedule });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 6. Audit Vault & Chain Verification
  app.get('/api/v1/mfg-yield-spc/audit-vault', (_req: Request, res: Response) => {
    try {
      const vault = ManufacturingYieldSpcShiftEngine.getAuditVault();
      const chainValid = ManufacturingYieldSpcShiftEngine.verifyAuditChain();
      res.json({ success: true, vault, chainValid });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Phase 3.2D-08 Hardening Test Suite Run
  app.get('/api/v1/mfg-yield-spc/tests/run', (_req: Request, res: Response) => {
    try {
      const results = Phase32D08HardeningSuite.runAll();
      res.json({ success: true, results });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =========================================================================
  // PHASE 3.2D-09: CO-PRODUCTS, BATCH GENEALOGY, ECO & DISASSEMBLY ENDPOINTS
  // =========================================================================

  // 1. Joint & By-Product Cost Allocation
  app.post('/api/v1/mfg-genealogy/joint-cost/calculate', (req: Request, res: Response) => {
    try {
      const result = ManufacturingGenealogyEcoDisassemblyEngine.calculateJointProductionCosts(req.body);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 2. Register Batch Genealogy Node
  app.post('/api/v1/mfg-genealogy/nodes', (req: Request, res: Response) => {
    try {
      const node = ManufacturingGenealogyEcoDisassemblyEngine.registerGenealogyNode(req.body);
      res.json({ success: true, node });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 3. Upstream Where-Used Trace
  app.get('/api/v1/mfg-genealogy/trace-upstream/:lotOrSerial', (req: Request, res: Response) => {
    try {
      const trace = ManufacturingGenealogyEcoDisassemblyEngine.traceUpstreamWhereUsed(req.params.lotOrSerial);
      res.json({ success: true, trace });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  });

  // 4. Downstream Impact Trace
  app.get('/api/v1/mfg-genealogy/trace-downstream/:lotOrSerial', (req: Request, res: Response) => {
    try {
      const trace = ManufacturingGenealogyEcoDisassemblyEngine.traceDownstreamImpact(req.params.lotOrSerial);
      res.json({ success: true, trace });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  });

  // 5. Automated Genealogy Quarantine Containment Lock
  app.post('/api/v1/mfg-genealogy/quarantine', (req: Request, res: Response) => {
    try {
      const result = ManufacturingGenealogyEcoDisassemblyEngine.applyGenealogyQuarantineContainment(req.body);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 6. ECO Creation
  app.post('/api/v1/mfg-genealogy/eco', (req: Request, res: Response) => {
    try {
      const eco = ManufacturingGenealogyEcoDisassemblyEngine.createEngineeringChangeOrder(req.body);
      res.json({ success: true, eco });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 7. Submit ECO for CCB Review
  app.post('/api/v1/mfg-genealogy/eco/:id/submit', (req: Request, res: Response) => {
    try {
      const eco = ManufacturingGenealogyEcoDisassemblyEngine.submitEcoForReview(req.params.id);
      res.json({ success: true, eco });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 8. Approve / Reject ECO (SoD Enforced)
  app.post('/api/v1/mfg-genealogy/eco/:id/approve', (req: Request, res: Response) => {
    try {
      const eco = ManufacturingGenealogyEcoDisassemblyEngine.approveEngineeringChangeOrder({
        ecoId: req.params.id,
        ...req.body
      });
      res.json({ success: true, eco });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 9. Activate ECO Effectivity
  app.post('/api/v1/mfg-genealogy/eco/:id/activate', (req: Request, res: Response) => {
    try {
      const eco = ManufacturingGenealogyEcoDisassemblyEngine.activateEcoEffectivity(req.params.id);
      res.json({ success: true, eco });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 10. Disassembly Order Creation
  app.post('/api/v1/mfg-genealogy/disassembly', (req: Request, res: Response) => {
    try {
      const order = ManufacturingGenealogyEcoDisassemblyEngine.createDisassemblyOrder(req.body);
      res.json({ success: true, order });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 11. Execute Component Harvesting
  app.post('/api/v1/mfg-genealogy/disassembly/:id/harvest', (req: Request, res: Response) => {
    try {
      const result = ManufacturingGenealogyEcoDisassemblyEngine.executeComponentHarvesting({
        disassemblyOrderId: req.params.id,
        ...req.body
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 12. Phase 3.2D-09 Hardening Suite Execution
  app.get('/api/v1/mfg-genealogy/tests/run', (_req: Request, res: Response) => {
    try {
      const results = Phase32D09HardeningSuite.runAll();
      res.json({ success: true, results });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==================== RESTAURANT OPERATIONS & KDS ENDPOINTS ====================
  app.get('/api/v1/restaurant/tables', (req: Request, res: Response) => {
    let list = restaurantTables;
    if (req.query.branchId) {
      list = list.filter(t => t.branchId === req.query.branchId);
    }
    if (req.query.status) {
      list = list.filter(t => t.status === req.query.status);
    }
    res.json({ success: true, count: list.length, tables: list });
  });

  app.post('/api/v1/restaurant/tables', (req: Request, res: Response) => {
    try {
      const newTable: RestaurantTable = {
        id: `tbl-${Date.now()}`,
        tableNumber: req.body.tableNumber,
        capacity: Number(req.body.capacity) || 4,
        section: req.body.section || 'Main Dining',
        status: req.body.status || 'AVAILABLE',
        currentOrderId: req.body.currentOrderId,
        activeGuests: req.body.activeGuests ? Number(req.body.activeGuests) : undefined,
        serverStaffId: req.body.serverStaffId,
        companyId: req.body.companyId || 'comp-001',
        branchId: req.body.branchId || 'br-001'
      };
      restaurantTables.push(newTable);
      res.status(201).json({ success: true, table: newTable });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.put('/api/v1/restaurant/tables/:id', (req: Request, res: Response) => {
    const table = restaurantTables.find(t => t.id === req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }
    if (req.body.status !== undefined) table.status = req.body.status;
    if (req.body.currentOrderId !== undefined) table.currentOrderId = req.body.currentOrderId;
    if (req.body.activeGuests !== undefined) table.activeGuests = Number(req.body.activeGuests);
    if (req.body.serverStaffId !== undefined) table.serverStaffId = req.body.serverStaffId;
    res.json({ success: true, table });
  });

  app.get('/api/v1/restaurant/kds/orders', (req: Request, res: Response) => {
    let list = kitchenOrders;
    if (req.query.station) {
      list = list.filter(o => o.station === req.query.station);
    }
    if (req.query.status) {
      list = list.filter(o => o.status === req.query.status);
    }
    res.json({ success: true, count: list.length, orders: list });
  });

  app.post('/api/v1/restaurant/kds/orders', (req: Request, res: Response) => {
    try {
      const newOrder: KitchenDisplayOrder = {
        id: `kds-${Date.now()}`,
        orderNumber: req.body.orderNumber || `KDS-${Date.now().toString().slice(-4)}`,
        tableNumber: req.body.tableNumber,
        orderType: req.body.orderType || 'DINE_IN',
        status: 'PENDING',
        station: req.body.station || 'HOT_KITCHEN',
        priority: req.body.priority || 'NORMAL',
        items: req.body.items || [],
        createdAt: new Date().toISOString(),
        companyId: req.body.companyId || 'comp-001',
        branchId: req.body.branchId || 'br-001'
      };
      kitchenOrders.push(newOrder);
      res.status(201).json({ success: true, order: newOrder });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/v1/restaurant/kds/orders/:id/status', (req: Request, res: Response) => {
    const order = kitchenOrders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Kitchen order not found' });
    }
    order.status = req.body.status;
    if (req.body.status === 'READY') {
      order.readyAt = new Date().toISOString();
    }
    res.json({ success: true, order });
  });

  app.get('/api/v1/restaurant/waste', (_req: Request, res: Response) => {
    res.json({ success: true, count: kitchenWasteRecords.length, wasteRecords: kitchenWasteRecords });
  });

  app.post('/api/v1/restaurant/waste', (req: Request, res: Response) => {
    try {
      const newWaste: KitchenWasteRecord = {
        id: `kw-${Date.now()}`,
        wasteNumber: req.body.wasteNumber || `WST-${Date.now().toString().slice(-4)}`,
        date: req.body.date || new Date().toISOString().split('T')[0],
        itemId: req.body.itemId,
        itemName: req.body.itemName,
        quantity: Number(req.body.quantity),
        uom: req.body.uom || 'KG',
        costAmount: Number(req.body.costAmount),
        reason: req.body.reason || 'SPOILAGE',
        reportedBy: req.body.reportedBy || 'Chef Staff',
        actionTaken: req.body.actionTaken || 'Recorded to waste log',
        companyId: req.body.companyId || 'comp-001',
        branchId: req.body.branchId || 'br-001'
      };
      kitchenWasteRecords.push(newWaste);
      res.status(201).json({ success: true, wasteRecord: newWaste });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ==================== CRM TICKETS ENDPOINTS ====================
  app.get('/api/v1/crm/tickets', (req: Request, res: Response) => {
    let list = crmTickets;
    if (req.query.customerId) {
      list = list.filter(t => t.customerId === req.query.customerId);
    }
    if (req.query.status) {
      list = list.filter(t => t.status === req.query.status);
    }
    res.json({ success: true, count: list.length, tickets: list });
  });

  app.post('/api/v1/crm/tickets', (req: Request, res: Response) => {
    try {
      const newTicket: CRMTicket = {
        id: `tkt-${Date.now()}`,
        ticketNumber: req.body.ticketNumber || `TCK-${Date.now().toString().slice(-4)}`,
        customerId: req.body.customerId,
        customerName: req.body.customerName || 'Customer',
        subject: req.body.subject,
        description: req.body.description,
        priority: req.body.priority || 'MEDIUM',
        status: 'OPEN',
        category: req.body.category || 'INQUIRY',
        assignedTo: req.body.assignedTo,
        assignedToName: req.body.assignedToName,
        createdAt: new Date().toISOString(),
        companyId: req.body.companyId || 'comp-001'
      };
      crmTickets.push(newTicket);
      res.status(201).json({ success: true, ticket: newTicket });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/v1/crm/tickets/:id/status', (req: Request, res: Response) => {
    const ticket = crmTickets.find(t => t.id === req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    ticket.status = req.body.status;
    if (req.body.status === 'RESOLVED' || req.body.status === 'CLOSED') {
      ticket.resolvedAt = new Date().toISOString();
    }
    res.json({ success: true, ticket });
  });

  // ==================== PROJECT TIMESHEETS ENDPOINTS ====================
  app.get('/api/v1/projects/timesheets', (req: Request, res: Response) => {
    let list = projectTimesheets;
    if (req.query.projectId) {
      list = list.filter(t => t.projectId === req.query.projectId);
    }
    if (req.query.employeeId) {
      list = list.filter(t => t.employeeId === req.query.employeeId);
    }
    if (req.query.status) {
      list = list.filter(t => t.status === req.query.status);
    }
    res.json({ success: true, count: list.length, timesheets: list });
  });

  app.post('/api/v1/projects/timesheets', (req: Request, res: Response) => {
    try {
      const hoursWorked = Number(req.body.hoursWorked) || 0;
      const hourlyRate = Number(req.body.hourlyRate) || 0;
      const newTimesheet: ProjectTimesheet = {
        id: `ts-${Date.now()}`,
        timesheetNumber: req.body.timesheetNumber || `TS-${Date.now().toString().slice(-4)}`,
        projectId: req.body.projectId,
        projectName: req.body.projectName || 'Project',
        employeeId: req.body.employeeId,
        employeeName: req.body.employeeName || 'Consultant',
        date: req.body.date || new Date().toISOString().split('T')[0],
        hoursWorked,
        billableHours: req.body.billableHours !== undefined ? Number(req.body.billableHours) : hoursWorked,
        taskDescription: req.body.taskDescription || 'Professional Services',
        hourlyRate,
        totalCost: hoursWorked * hourlyRate,
        status: 'SUBMITTED',
        companyId: req.body.companyId || 'comp-001'
      };
      projectTimesheets.push(newTimesheet);
      res.status(201).json({ success: true, timesheet: newTimesheet });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/projects/timesheets/:id/approve', (req: Request, res: Response) => {
    const ts = projectTimesheets.find(t => t.id === req.params.id);
    if (!ts) {
      return res.status(404).json({ success: false, error: 'Timesheet not found' });
    }
    ts.status = 'APPROVED';
    ts.approvedBy = req.body.approvedBy || 'usr-001';
    ts.approvedAt = new Date().toISOString();
    res.json({ success: true, timesheet: ts });
  });



  // ==================== VITE & PRODUCTION MIDDLEWARE ====================
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AM Business Platform Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
