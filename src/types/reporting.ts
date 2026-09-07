/**
 * Enterprise Financial Reporting, Management Reporting & Business Intelligence Types
 * Standardized according to SAP S/4HANA, Oracle ERP Cloud, Microsoft Dynamics 365, IFRS, IAS 1, IAS 7, IAS 8, IAS 21
 */

export type ReportingRole = 
  | 'CEO'
  | 'CFO'
  | 'Financial Controller'
  | 'Accountant'
  | 'Auditor'
  | 'Manager'
  | 'Viewer';

export interface ReportAuditMetadata {
  reportHash: string;      // SHA-256 hash of the generated report payload
  correlationId: string;   // Unique request tracking GUID
  auditId: string;         // Audit log entry ID
  generatedBy: string;     // User ID or User Name
  generatedAt: string;     // ISO Timestamp
  appliedFilters: Record<string, any>;
  sourceVersion: string;   // Baseline version e.g. "2.5.0"
}

// ==================== 1. FINANCIAL STATEMENTS (IFRS / IAS 1 / IAS 7) ====================

export interface FinancialStatementLine {
  accountCode?: string;
  lineName: string;
  lineNameAr?: string;
  category: string;
  amount: number;
  priorPeriodAmount?: number;
  varianceAmount?: number;
  variancePercent?: number;
  isHeader?: boolean;
  isTotal?: boolean;
  level?: number;
}

export interface BalanceSheetReport {
  auditMetadata: ReportAuditMetadata;
  asOfDate: string;
  companyId: string;
  currency: string;
  
  // Assets
  currentAssets: FinancialStatementLine[];
  totalCurrentAssets: number;
  nonCurrentAssets: FinancialStatementLine[];
  totalNonCurrentAssets: number;
  totalAssets: number;

  // Liabilities
  currentLiabilities: FinancialStatementLine[];
  totalCurrentLiabilities: number;
  nonCurrentLiabilities: FinancialStatementLine[];
  totalNonCurrentLiabilities: number;
  totalLiabilities: number;

  // Equity
  equityLines: FinancialStatementLine[];
  totalEquity: number;

  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  balanceDifference: number;
}

export interface IncomeStatementReport {
  auditMetadata: ReportAuditMetadata;
  startDate: string;
  endDate: string;
  companyId: string;
  currency: string;

  grossRevenue: number;
  salesDiscountsAndReturns: number;
  netRevenue: number;

  costOfGoodsSold: number;
  grossProfit: number;
  grossMarginPercent: number;

  operatingExpenses: FinancialStatementLine[];
  totalOperatingExpenses: number;
  operatingIncome: number; // EBIT
  operatingMarginPercent: number;

  financeIncome: number;
  financeExpenses: number;
  taxExpenses: number;

  netIncome: number;
  netProfitMarginPercent: number;
  ebitda: number;
}

export interface CashFlowActivitySection {
  activityName: string;
  lines: FinancialStatementLine[];
  totalAmount: number;
}

export interface CashFlowStatementReport {
  auditMetadata: ReportAuditMetadata;
  startDate: string;
  endDate: string;
  companyId: string;
  currency: string;
  method: 'INDIRECT';

  operatingActivities: CashFlowActivitySection;
  investingActivities: CashFlowActivitySection;
  financingActivities: CashFlowActivitySection;

  netCashFlow: number;
  beginningCashBalance: number;
  endingCashBalance: number;
  cashReconciliationCheck: boolean;
}

export interface StatementOfChangesInEquityReport {
  auditMetadata: ReportAuditMetadata;
  startDate: string;
  endDate: string;
  companyId: string;
  currency: string;

  shareCapital: { opening: number; changes: number; closing: number };
  retainedEarnings: { opening: number; netIncome: number; dividends: number; closing: number };
  revaluationReserves: { opening: number; changes: number; closing: number };
  totalOpeningEquity: number;
  totalClosingEquity: number;
}

// ==================== 2. TRIAL BALANCE REPORTING ====================

export type TrialBalanceType = 
  | 'STANDARD'
  | 'COMPARATIVE'
  | 'MULTI_PERIOD'
  | 'MONTHLY'
  | 'BRANCH'
  | 'DEPARTMENT';

export interface ReportingTrialBalanceRow {
  accountCode: string;
  accountName: string;
  accountCategory: string;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
  netBalance: number;
  branchId?: string;
  departmentId?: string;
  monthlyBreakdown?: Record<string, number>;
  priorPeriodClosingDebit?: number;
  priorPeriodClosingCredit?: number;
}

export interface TrialBalanceReport {
  auditMetadata: ReportAuditMetadata;
  type: TrialBalanceType;
  asOfDate: string;
  startDate?: string;
  companyId: string;
  currency: string;
  rows: ReportingTrialBalanceRow[];
  totalOpeningDebit: number;
  totalOpeningCredit: number;
  totalPeriodDebit: number;
  totalPeriodCredit: number;
  totalClosingDebit: number;
  totalClosingCredit: number;
  isBalanced: boolean;
}

// ==================== 3. FINANCIAL RATIOS ENGINE ====================

export interface FinancialRatiosReport {
  auditMetadata: ReportAuditMetadata;
  asOfDate: string;
  companyId: string;
  currency: string;

  // Liquidity Ratios
  currentRatio: number;
  quickRatio: number;
  workingCapital: number;

  // Solvency / Debt Ratios
  debtRatio: number;
  debtToEquityRatio: number;

  // Profitability Ratios
  grossMarginPercent: number;
  netMarginPercent: number;
  operatingMarginPercent: number;
  ebitda: number;
  roaPercent: number; // Return on Assets
  roePercent: number; // Return on Equity

  // Activity / Efficiency Ratios
  inventoryTurnover: number;
  receivableTurnover: number;
  payableTurnover: number;
  dsoDays: number; // Days Sales Outstanding
  dpoDays: number; // Days Payables Outstanding
  cashConversionCycleDays: number; // CCC = DSO + DIO - DPO
}

// ==================== 4. EXECUTIVE DASHBOARD ====================

export interface MonthlyTrendDataPoint {
  month: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  cashInflow: number;
  cashOutflow: number;
}

export interface TopEntityPerformance {
  id: string;
  code: string;
  name: string;
  totalAmount: number;
  percentageContribution: number;
}

export interface ExecutiveDashboardReport {
  auditMetadata: ReportAuditMetadata;
  asOfDate: string;
  companyId: string;
  currency: string;

  // Real-time KPIs
  revenueYTD: number;
  grossProfitYTD: number;
  netProfitYTD: number;
  cashPositionTotal: number;
  arTotalOutstanding: number;
  apTotalOutstanding: number;
  inventoryValueTotal: number;
  workingCapitalTotal: number;

  monthlyTrends: MonthlyTrendDataPoint[];
  topCustomers: TopEntityPerformance[];
  topVendors: TopEntityPerformance[];
  topProducts: TopEntityPerformance[];
  topCategories: TopEntityPerformance[];
  branchPerformance: { branchId: string; branchName: string; revenue: number; profit: number }[];
  warehousePerformance: { warehouseId: string; warehouseName: string; inventoryValue: number; turnover: number }[];
}

// ==================== 5. DYNAMIC REPORT BUILDER ====================

export interface ReportFilterCriterion {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN' | 'IN';
  value: any;
}

export interface ReportSortCriterion {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface ReportDefinition {
  id: string;
  tenantId: string;
  companyId: string;
  name: string;
  description: string;
  reportType: string;
  groupByFields: string[];
  filterCriteria: ReportFilterCriterion[];
  sortCriteria: ReportSortCriterion[];
  selectedColumns: string[];
  dateRange: { startDate: string; endDate: string };
  isTemplate: boolean;
  isBookmarked: boolean;
  createdBy: string;
  createdAt: string;
}

// ==================== 6. BUDGET VS ACTUAL FRAMEWORK ====================

export type BudgetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface BudgetVersion {
  id: string;
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  fiscalYear: number;
  status: BudgetStatus;
  versionType: 'ORIGINAL' | 'REVISED' | 'FORECAST';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface BudgetItem {
  id: string;
  budgetId: string;
  accountCode: string;
  accountName: string;
  departmentId?: string;
  costCenterId?: string;
  projectId?: string;
  monthlyAllocations: Record<number, number>; // 1..12 -> amount
  totalBudgetAmount: number;
}

export interface BudgetVsActualLine {
  accountCode: string;
  accountName: string;
  departmentId?: string;
  costCenterId?: string;
  projectId?: string;
  budgetAmount: number;
  actualAmount: number;
  varianceAmount: number; // Actual - Budget or Budget - Actual based on Account category
  variancePercent: number;
  isFavorable: boolean;
}

export interface BudgetVsActualReport {
  auditMetadata: ReportAuditMetadata;
  budgetId: string;
  budgetName: string;
  fiscalYear: number;
  companyId: string;
  currency: string;
  lines: BudgetVsActualLine[];
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
  overallFavorable: boolean;
}

// ==================== 7. COST CENTER & PROFIT CENTER REPORTING ====================

export interface CostCenterPerformance {
  costCenterId: string;
  costCenterCode: string;
  costCenterName: string;
  departmentName?: string;
  directCosts: number;
  allocatedOverheads: number;
  totalCost: number;
  budgetAmount: number;
  variance: number;
}

export interface ProfitCenterPerformance {
  profitCenterId: string;
  profitCenterCode: string;
  profitCenterName: string;
  totalRevenue: number;
  directCosts: number;
  allocatedCosts: number;
  netContribution: number;
  marginPercent: number;
}

export interface OverheadAllocationRule {
  id: string;
  tenantId: string;
  companyId: string;
  name: string;
  sourceCostCenterId: string;
  targetCostCenterIds: string[];
  allocationBasis: 'HEADCOUNT' | 'SQUARE_FOOTAGE' | 'REVENUE' | 'EQUAL_SPLIT' | 'CUSTOM_PERCENT';
  allocationRatios: Record<string, number>; // targetCostCenterId -> percentage
}

// ==================== 8. CONSOLIDATION READINESS ====================

export interface IntercompanyEliminationEntry {
  id: string;
  sourceCompanyId: string;
  targetCompanyId: string;
  eliminationType: 'INTERCOMPANY_RECEIVABLE_PAYABLE' | 'INTERCOMPANY_REVENUE_EXPENSE' | 'INTERCOMPANY_DIVIDEND';
  accountCode: string;
  amount: number;
  currency: string;
  description: string;
}

export interface CurrencyTranslationDetail {
  fromCurrency: string;
  toCurrency: string;
  closingRate: number;
  averageRate: number;
  historicalRate: number;
  fxGainLossAmount: number;
}

export interface ConsolidatedFinancialReport {
  auditMetadata: ReportAuditMetadata;
  groupName: string;
  parentCompanyId: string;
  subsidiaryCompanyIds: string[];
  reportingCurrency: string;
  asOfDate: string;
  consolidatedAssets: number;
  consolidatedLiabilities: number;
  consolidatedEquity: number;
  consolidatedRevenue: number;
  consolidatedNetIncome: number;
  intercompanyEliminationsTotal: number;
  fxTranslationReserveTotal: number;
  eliminationEntries: IntercompanyEliminationEntry[];
}

// ==================== 9. BUSINESS INTELLIGENCE LAYER ====================

export interface PivotDataRow {
  dimensions: Record<string, string>;
  measures: Record<string, number>;
}

export interface DrillDownMetadata {
  level: number;
  currentDimension: string;
  nextDimension?: string;
  filterValue: string;
}

export interface HeatmapPoint {
  xLabel: string;
  yLabel: string;
  value: number;
}

export interface WaterfallPoint {
  category: string;
  value: number;
  isTotal?: boolean;
  cumulativeValue: number;
}

export interface BusinessIntelligenceDataset {
  auditMetadata: ReportAuditMetadata;
  reportName: string;
  pivotData: PivotDataRow[];
  heatmapData: HeatmapPoint[];
  waterfallData: WaterfallPoint[];
}

// ==================== 10. EXPORT ENGINE ====================

export type ExportFormat = 'EXCEL' | 'PDF' | 'CSV' | 'JSON' | 'XML' | 'PRINT_LAYOUT';

export interface ExportRequest {
  reportType: string;
  exportFormat: ExportFormat;
  reportData: any;
  customTitle?: string;
  includeAuditHeader?: boolean;
}

export interface ExportResult {
  fileName: string;
  mimeType: string;
  content: string; // Base64 or formatted string;
  fileSizeBytes: number;
  reportHash: string;
  generatedAt: string;
}

// ==================== 11. REPORT SNAPSHOT ENGINE ====================

export interface ReportSnapshotRecord {
  snapshotId: string;
  reportType: string;
  companyId: string;
  branchId?: string;
  parameters: Record<string, any>;
  filters: Record<string, any>;
  reportData: any;
  auditMetadata: ReportAuditMetadata;
  generatedBy: string;
  generatedAt: string;
  isImmutable: boolean;
}

export interface KPITraceabilityLineage {
  kpiId: string;
  kpiName: string;
  kpiValue: number;
  financialReportName: string;
  reportSection: string;
  glAccountCode: string;
  glAccountName: string;
  journalEntryNumbers: string[];
  sourceDocumentIds: string[];
}

