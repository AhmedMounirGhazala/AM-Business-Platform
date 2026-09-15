/**
 * AM Business Platform - Pilot Readiness Phase 1 Types
 * Retail Deployment Hardening: Persistence, Backup/Restore, and Master Data CSV Import
 */

export interface PilotMasterDataImportRow {
  sku: string;
  barcode?: string;
  name: string;
  nameAr?: string;
  category?: string;
  uom?: string;
  costPrice: number;
  sellingPrice: number;
  openingStockQty?: number;
  warehouseId?: string;
  openingCashAmount?: number;
}

export interface PilotImportValidationItem {
  rowNumber: number;
  status: 'VALID' | 'WARNING' | 'ERROR' | 'DUPLICATE';
  data: PilotMasterDataImportRow;
  issues: string[];
}

export interface PilotImportSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  duplicateRows: number;
  totalOpeningStockUnits: number;
  totalOpeningStockCost: number;
  totalOpeningCash: number;
}

export interface PilotImportPreviewResponse {
  valid: boolean;
  summary: PilotImportSummary;
  items: PilotImportValidationItem[];
  detectedWarehouses: string[];
  sampleOpeningJournal?: {
    debitInventory: number;
    debitCash: number;
    creditEquity: number;
    isBalanced: boolean;
  };
}

export interface PilotImportCommitRequest {
  companyId: string;
  tenantId: string;
  warehouseId?: string;
  cashAccountId?: string;
  rows: PilotMasterDataImportRow[];
  skipDuplicates?: boolean;
}

export interface PilotImportCommitResponse {
  success: boolean;
  importedItemsCount: number;
  stockMovementsCreated: number;
  openingStockCostValue: number;
  openingCashRecorded: number;
  journalEntryId?: string;
  journalEntryNumber?: string;
  auditLogId: string;
  message: string;
  errors?: string[];
}

export interface PilotBackupMetadata {
  backupId: string;
  snapshotName: string;
  timestamp: string;
  version: string;
  platformVersion: string;
  architectureBaseline: string;
  checksumSha256: string;
  checksum?: string;
  schemaVersion?: number;
  totalRecords: number;
  collectionCounts: Record<string, number>;
}

export interface PilotBackupPayload {
  metadata: PilotBackupMetadata;
  data: Record<string, any[]>;
}

export interface PilotRestoreResult {
  success: boolean;
  restoredAt: string;
  backupId: string;
  totalRecordsRestored: number;
  collectionsRestored: string[];
  message: string;
}

export type StoragePersistenceType =
  | 'PERSISTENT_VOLUME'
  | 'EPHEMERAL_CONTAINER_FS'
  | 'MEMORY'
  | 'SIMULATED_EPHEMERAL';

export type PersistenceReadinessStatus = 'READY' | 'NOT_READY_EPHEMERAL' | 'DEGRADED';

export interface StoragePersistenceReport {
  isPersistent: boolean;
  storageType: StoragePersistenceType;
  databasePath: string;
  dataDirectory: string;
  mountPoint?: string;
  fileSystemType?: string;
  walMode: boolean;
  busyTimeoutMs: number;
  readinessStatus: PersistenceReadinessStatus;
  operationalMessage: string;
  verifiedAt: string;
  remedyInstructions?: string[];
  environment: {
    nodeEnv: string;
    isProduction: boolean;
    requirePersistentStorage: boolean;
    allowEphemeralStorage: boolean;
    storageConfirmedEnv: boolean;
  };
}

export interface PilotDatabaseStatus {
  engine: string;
  databasePath: string;
  sizeBytes: number;
  status: 'ACTIVE' | 'ERROR';
  persistedCollections: number;
  totalEntities: number;
  lastBackupTimestamp?: string;
  persistence?: StoragePersistenceReport;
}
