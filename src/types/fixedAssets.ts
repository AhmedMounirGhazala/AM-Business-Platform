/**
 * AM Business Platform - Enterprise Fixed Assets Types
 * Aligned with IFRS, IAS 16 (Property, Plant & Equipment), IAS 36 (Impairment of Assets), 
 * IAS 23 (Borrowing Costs), SAP S/4HANA FI-AA, Oracle ERP Cloud Fixed Assets, and Dynamics 365 Finance.
 */

export type AssetStatus = 
  | 'DRAFT'
  | 'ACTIVE'
  | 'UNDER_CONSTRUCTION'
  | 'FULLY_DEPRECIATED'
  | 'TRANSFERRED'
  | 'DISPOSED'
  | 'IMPAIRED'
  | 'WRITTEN_OFF';

export type AcquisitionType = 
  | 'PURCHASE'
  | 'CONSTRUCTION'
  | 'OPENING_BALANCE'
  | 'DONATION'
  | 'LEASE_CAPITALIZATION'
  | 'PROJECT_TRANSFER'
  | 'INTERCOMPANY_TRANSFER';

export type DepreciationMethod = 
  | 'STRAIGHT_LINE'
  | 'DECLINING_BALANCE'
  | 'DOUBLE_DECLINING'
  | 'UNITS_OF_PRODUCTION'
  | 'MANUAL'
  | 'NO_DEPRECIATION';

export type DepreciationFrequency = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export type TransferType = 
  | 'COMPANY'
  | 'BRANCH'
  | 'DEPARTMENT'
  | 'COST_CENTER'
  | 'LOCATION'
  | 'EMPLOYEE';

export type DisposalType = 'SALE' | 'SCRAP' | 'LOSS' | 'DONATION' | 'WRITE_OFF';

export type RevaluationType = 'INCREASE' | 'DECREASE';

export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE';

// ==================== MASTER DATA STRUCTURES ====================

export interface AssetClass {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  defaultUsefulLifeYears: number;
  defaultDepreciationMethod: DepreciationMethod;
  defaultSalvageValuePercent: number;
  glAssetAccount: string;
  glAccumDepAccount: string;
  glDepExpenseAccount: string;
  glGainLossAccount: string;
  glRevaluationSurplusAccount?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface AssetCategory {
  id: string;
  assetClassId: string;
  code: string;
  name: string;
  nameAr?: string;
}

export interface AssetLocation {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  branchId?: string;
  address?: string;
}

export interface AssetDepartment {
  id: string;
  code: string;
  name: string;
  costCenterId?: string;
}

export interface AssetCostCenter {
  id: string;
  code: string;
  name: string;
}

export interface AssetResponsibleEmployee {
  id: string;
  code: string;
  name: string;
  departmentId?: string;
  email?: string;
}

export interface FixedAssetMaster {
  id: string;
  assetNumber: string; // e.g. AST-2026-0001
  barcode: string;     // e.g. BAR-AST-0001
  qrCode: string;      // SHA-256 / JSON encoded string
  serialNumber?: string;
  name: string;
  nameAr?: string;
  assetClassId: string;
  assetClassName?: string;
  categoryId?: string;
  categoryName?: string;
  locationId: string;
  locationName?: string;
  departmentId: string;
  departmentName?: string;
  costCenterId: string;
  costCenterName?: string;
  responsibleEmployeeId?: string;
  responsibleEmployeeName?: string;
  supplierId?: string;
  supplierName?: string;
  manufacturer?: string;
  model?: string;
  
  acquisitionType: AcquisitionType;
  acquisitionDate: string; // YYYY-MM-DD
  operationalDate: string;  // YYYY-MM-DD (depreciation start)
  purchaseCost: number;
  salvageValue: number;
  residualValue: number;
  usefulLifeYears: number;
  usefulLifeMonths: number;
  depreciationMethod: DepreciationMethod;
  depreciationFrequency: DepreciationFrequency;
  
  // Accumulated figures
  totalAccumulatedDepreciation: number;
  netBookValue: number;
  revaluationSurplus: number;
  accumulatedImpairmentLoss: number;
  lastDepreciationDate?: string;
  
  // Production units tracking (for UNITS_OF_PRODUCTION method)
  totalUnitsProduced?: number;
  capacityUnits?: number;
  
  status: AssetStatus;
  companyId: string;
  branchId: string;
  currency: string;
  isLocked?: boolean;
  lockReason?: string;
  idempotencyKey?: string;
  
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

// ==================== SNAPSHOT & QUALITY GATE STRUCTURES ====================

export type AssetSnapshotType = 
  | 'ASSET_REGISTER'
  | 'DEPRECIATION_REGISTER'
  | 'REVALUATION_REGISTER'
  | 'IMPAIRMENT_REGISTER'
  | 'PHYSICAL_VERIFICATION'
  | 'MAINTENANCE_REGISTER'
  | 'ASSET_TRANSFERS';

export interface ImmutableAssetSnapshot {
  snapshotId: string;
  snapshotType: AssetSnapshotType;
  companyId: string;
  fiscalPeriod: string;
  generatedAt: string;
  itemCount: number;
  dataPayload: any;
  sha256Seal: string;
  signedBy: string;
  isVerified: boolean;
}

export interface Phase28QualityGateAssertion {
  criterionId: string;
  criterionName: string;
  category: string;
  status: 'PASSED' | 'FAILED';
  verificationDetails: string;
  sha256VerificationHash: string;
  executionTimestamp: string;
}

export interface Phase28QualityGateReport {
  gateId: string;
  phase: string;
  domainName: string;
  version: string;
  executedAt: string;
  readinessScore: number;
  overallStatus: 'ENTERPRISE_CERTIFIED' | 'FAILED';
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
  assertions: Phase28QualityGateAssertion[];
  sealedSnapshots: ImmutableAssetSnapshot[];
  immutableAuditVaultSummary: {
    totalAuditEntries: number;
    unbrokenHashChain: boolean;
    vaultRootHash: string;
  };
  certifiedBy: string;
}

// ==================== LIFECYCLE TRANSACTIONS ====================

export interface AssetAcquisitionRecord {
  id: string;
  assetId: string;
  assetNumber: string;
  acquisitionType: AcquisitionType;
  poNumber?: string;
  vendorInvoiceNumber?: string;
  projectCode?: string;
  capitalLeaseContractId?: string;
  purchaseCost: number;
  currency: string;
  exchangeRate: number;
  acquisitionDate: string;
  operationalDate: string;
  glAssetAccount: string;
  glClearingAccount: string;
  createdBy: string;
  createdAt: string;
  correlationId: string;
}

export interface DepreciationScheduleEntry {
  id: string;
  assetId: string;
  periodNumber: number;
  periodStartDate: string;
  periodEndDate: string;
  openingBookValue: number;
  depreciationAmount: number;
  accumulatedDepreciation: number;
  closingBookValue: number;
  status: 'SCHEDULED' | 'POSTED' | 'REVERSED';
  postedDate?: string;
  journalEntryNumber?: string;
}

export interface DepreciationRunResult {
  runId: string;
  runDate: string;
  period: string; // e.g. "2026-08"
  companyId: string;
  assetCount: number;
  totalDepreciationAmount: number;
  entries: DepreciationScheduleEntry[];
  publishedEventsCount: number;
  status: 'SUCCESS' | 'FAILED';
  executionTimeMs: number;
  correlationId: string;
}

export interface AssetTransferRecord {
  id: string;
  assetId: string;
  assetNumber: string;
  transferType: TransferType;
  transferDate: string;
  
  fromCompanyId?: string;
  toCompanyId?: string;
  fromBranchId?: string;
  toBranchId?: string;
  fromDepartmentId?: string;
  toDepartmentId?: string;
  fromCostCenterId?: string;
  toCostCenterId?: string;
  fromLocationId?: string;
  toLocationId?: string;
  fromEmployeeId?: string;
  toEmployeeId?: string;
  
  reason: string;
  approvedBy: string;
  status: 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  correlationId: string;
}

export interface AssetDisposalRecord {
  id: string;
  assetId: string;
  assetNumber: string;
  disposalType: DisposalType;
  disposalDate: string;
  proceedsAmount: number;
  costAtDisposal: number;
  accumDepAtDisposal: number;
  netBookValueAtDisposal: number;
  gainLossAmount: number; // Proceeds - NetBookValue
  customerId?: string;
  buyerName?: string;
  remarks: string;
  approvedBy: string;
  status: 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  correlationId: string;
}

export interface AssetRevaluationRecord {
  id: string;
  assetId: string;
  assetNumber: string;
  revaluationDate: string;
  revaluationType: RevaluationType;
  preRevaluationCost: number;
  preRevaluationAccumDep: number;
  preRevaluationNBV: number;
  appraisalValue: number;
  revaluationSurplusDelta: number;
  revaluationExpenseDelta: number;
  valuerName: string;
  valuerReportReference?: string;
  remarks: string;
  approvedBy: string;
  createdAt: string;
  correlationId: string;
}

export interface AssetImpairmentRecord {
  id: string;
  assetId: string;
  assetNumber: string;
  impairmentDate: string;
  carryingAmount: number;
  recoverableAmount: number; // Max(Fair Value - Cost to Sell, Value in Use)
  impairmentLossAmount: number;
  isReversal: boolean;
  reversalAmount: number;
  valuationMethod: 'FAIR_VALUE' | 'VALUE_IN_USE';
  reason: string;
  approvedBy: string;
  createdAt: string;
  correlationId: string;
}

export interface SparePartItem {
  partName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface AssetMaintenanceRecord {
  id: string;
  assetId: string;
  assetNumber: string;
  maintenanceType: MaintenanceType;
  maintenanceDate: string;
  vendorId?: string;
  vendorName?: string;
  description: string;
  cost: number;
  spareParts: SparePartItem[];
  downtimeHours: number;
  performedBy: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
}

export interface PhysicalCountScanItem {
  scanId: string;
  assetId?: string;
  assetNumber?: string;
  scannedBarcode: string;
  expectedLocationId: string;
  actualLocationId: string;
  scanStatus: 'MATCHED' | 'LOCATION_MISMATCH' | 'MISSING' | 'FOUND_UNRECORDED';
  notes?: string;
  scannedAt: string;
}

export interface PhysicalVerificationSession {
  id: string;
  sessionNumber: string;
  sessionDate: string;
  locationId: string;
  locationName: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'RECONCILED';
  totalAssetsExpected: number;
  totalAssetsScanned: number;
  matchedCount: number;
  missingCount: number;
  discrepancyCount: number;
  scans: PhysicalCountScanItem[];
  conductedBy: string;
  createdAt: string;
}

export interface AssetAuditLogRecord {
  id: string;
  assetId: string;
  assetNumber: string;
  eventType: 
    | 'ASSET_ACQUIRED'
    | 'DEPRECIATION_POSTED'
    | 'ASSET_TRANSFERRED'
    | 'ASSET_DISPOSED'
    | 'ASSET_REVALUED'
    | 'ASSET_IMPAIRED'
    | 'MAINTENANCE_LOGGED'
    | 'PHYSICAL_VERIFIED';
  timestamp: string;
  actionBy: string;
  details: string;
  payload: any;
  sha256Hash: string;
  correlationId: string;
}

// ==================== ASSET DOMAIN EVENTS ====================

export interface AssetDomainEvent {
  eventId: string;
  eventType: 
    | 'ASSET_ACQUIRED'
    | 'DEPRECIATION_POSTED'
    | 'ASSET_TRANSFERRED'
    | 'ASSET_DISPOSED'
    | 'ASSET_REVALUED'
    | 'ASSET_IMPAIRED';
  eventTimestamp: string;
  companyId: string;
  branchId: string;
  assetId: string;
  assetNumber: string;
  eventData: any;
  glAccountPostings: {
    debitAccount: string;
    creditAccount: string;
    amount: number;
    description: string;
  }[];
  sha256Hash: string;
  correlationId: string;
}

// ==================== REPORTING STRUCTURES ====================

export interface AssetRegisterReport {
  companyId: string;
  generatedAt: string;
  totalAssetsCount: number;
  totalAcquisitionCost: number;
  totalAccumulatedDepreciation: number;
  totalNetBookValue: number;
  assets: FixedAssetMaster[];
}

export interface AssetRollForwardReportLine {
  assetClassId: string;
  assetClassName: string;
  openingCost: number;
  acquisitionsCost: number;
  disposalsCost: number;
  revaluationsCost: number;
  closingCost: number;
  openingAccumDep: number;
  depreciationExpense: number;
  disposalsAccumDep: number;
  closingAccumDep: number;
  openingNBV: number;
  closingNBV: number;
}

export interface AssetRollForwardReport {
  companyId: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  lines: AssetRollForwardReportLine[];
  grandTotalOpeningCost: number;
  grandTotalClosingCost: number;
  grandTotalOpeningNBV: number;
  grandTotalClosingNBV: number;
}

export interface NBVReportLine {
  assetNumber: string;
  assetName: string;
  assetClassName: string;
  acquisitionDate: string;
  usefulLifeYears: number;
  purchaseCost: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  status: AssetStatus;
}
