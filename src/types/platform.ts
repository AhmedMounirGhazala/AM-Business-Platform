/**
 * AM Business Platform - Phase 3.0 Platform Integration & Production Readiness Types
 * Aligned with SAP NetWeaver / S/4HANA Basis, Oracle Fusion Middleware, and Microsoft Dynamics 365 Architecture
 */

import { StoragePersistenceReport } from './pilot';

// ==================== 1. WORKFLOW ENGINE TYPES ====================

export type WorkflowEntityType = 
  | 'PURCHASE_ORDER'
  | 'PURCHASE_REQUISITION'
  | 'SUPPLIER_INVOICE'
  | 'CUSTOMER_INVOICE'
  | 'JOURNAL_ENTRY'
  | 'FIXED_ASSET_ACQUISITION'
  | 'FIXED_ASSET_DISPOSAL'
  | 'TREASURY_TRANSFER'
  | 'PAYMENT_VOUCHER'
  | 'CREDIT_MEMO'
  | 'INVENTORY_ADJUSTMENT';

export type WorkflowExecutionStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'ESCALATED'
  | 'CANCELLED';

export type ParallelApprovalStrategy = 'ALL_REQUIRED' | 'ANY_ONE';

export interface WorkflowRoutingCondition {
  id: string;
  field: 'amount' | 'departmentId' | 'branchId' | 'category' | 'vendorRating' | 'glAccount';
  operator: 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN' | 'IN_LIST';
  value: string | number | string[];
}

export interface WorkflowStepDefinition {
  stepNumber: number;
  stepName: string;
  stepNameAr: string;
  requiredRole: string;
  assignedUsers?: string[];
  isParallel: boolean;
  parallelStrategy: ParallelApprovalStrategy;
  thresholdMin?: number;
  thresholdMax?: number;
  timeoutHours?: number;
  conditions?: WorkflowRoutingCondition[];
}

export interface WorkflowEscalationRule {
  id: string;
  triggerAfterHours: number;
  action: 'NOTIFY_MANAGER' | 'AUTO_REASSIGN' | 'ESCALATE_TO_ROLE';
  targetRole: string;
  targetUserId?: string;
}

export interface WorkflowDefinition {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  entityType: WorkflowEntityType;
  isActive: boolean;
  version: number;
  companyId: string;
  slaHours: number;
  steps: WorkflowStepDefinition[];
  escalationRules: WorkflowEscalationRule[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowDelegation {
  id: string;
  delegatorUserId: string;
  delegatorName: string;
  delegateUserId: string;
  delegateName: string;
  role: string;
  validFrom: string;
  validTo: string;
  reason: string;
  isActive: boolean;
  entityTypes?: WorkflowEntityType[];
}

export interface WorkflowStepExecutionRecord {
  stepNumber: number;
  stepName: string;
  stepNameAr: string;
  requiredRole: string;
  approverUserId?: string;
  approverName?: string;
  approverRole?: string;
  decision: 'APPROVED' | 'REJECTED' | 'DELEGATED' | 'ESCALATED' | 'PENDING';
  decisionAt?: string;
  comments?: string;
  digitalSignatureSha256?: string;
}

export interface WorkflowInstance {
  id: string;
  workflowDefinitionId: string;
  workflowCode: string;
  entityType: WorkflowEntityType;
  entityId: string;
  entityNumber: string;
  amount: number;
  currency: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  currentStepIndex: number;
  totalSteps: number;
  status: WorkflowExecutionStatus;
  slaDeadline: string;
  isEscalated: boolean;
  history: WorkflowStepExecutionRecord[];
  createdAt: string;
  updatedAt: string;
}

// ==================== 2. NOTIFICATION ENGINE TYPES ====================

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface NotificationMessage {
  id: string;
  tenantId: string;
  userId: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  entityType?: string;
  entityId?: string;
  entityNumber?: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  deliveryStatus: 'QUEUED' | 'SENT' | 'FAILED';
  providerResponse?: string;
  createdAt: string;
}

export interface NotificationSubscription {
  id: string;
  userId: string;
  eventTopic: string;
  eventTopicNameEn: string;
  eventTopicNameAr: string;
  channels: NotificationChannel[];
  isEnabled: boolean;
}

export interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  eventTopic: string;
  subjectEn: string;
  subjectAr: string;
  bodyTemplateEn: string;
  bodyTemplateAr: string;
  channel: NotificationChannel;
}

// ==================== 3. UNIVERSAL APPROVAL ENGINE TYPES ====================

export interface DigitalApprovalStamp {
  stampId: string;
  entityId: string;
  entityNumber: string;
  entityType: string;
  stepNumber: number;
  decision: 'APPROVED' | 'REJECTED';
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  ipAddress: string;
  payloadHash: string;
  digitalSignatureSha256: string;
}

export interface UniversalApprovalRecord {
  id: string;
  entityType: WorkflowEntityType;
  entityId: string;
  entityNumber: string;
  amount: number;
  currency: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  currentStep: number;
  totalSteps: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  currentRequiredRole: string;
  summaryEn: string;
  summaryAr: string;
  approvals: WorkflowStepExecutionRecord[];
  digitalAuditTrail: DigitalApprovalStamp[];
}

// ==================== 4. BACKGROUND JOB SCHEDULER TYPES ====================

export type JobQueuePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type JobExecutionStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING' | 'CANCELLED';

export interface JobExecutionLog {
  logId: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  details?: any;
}

export interface PlatformScheduledJob {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  jobType: string;
  cronExpression?: string;
  isRecurring: boolean;
  priority: JobQueuePriority;
  status: JobExecutionStatus;
  retryCount: number;
  maxRetries: number;
  progressPercent: number;
  nextRunAt?: string;
  lastRunAt?: string;
  lastExecutionDurationMs?: number;
  payload?: any;
  result?: any;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  logs: JobExecutionLog[];
}

// ==================== 5. GLOBAL SEARCH ENGINE TYPES ====================

export type GlobalSearchCategory = 
  | 'ALL'
  | 'CUSTOMERS'
  | 'VENDORS'
  | 'ITEMS'
  | 'ASSETS'
  | 'JOURNALS'
  | 'INVOICES'
  | 'PURCHASE_ORDERS'
  | 'RECEIPTS'
  | 'PAYMENTS'
  | 'REPORTS'
  | 'BANK_ACCOUNTS'
  | 'TREASURY';

export interface GlobalSearchResultItem {
  id: string;
  category: GlobalSearchCategory;
  entityType: string;
  entityId: string;
  title: string;
  titleAr?: string;
  subtitle: string;
  subtitleAr?: string;
  codeOrNumber: string;
  amount?: number;
  currency?: string;
  status?: string;
  tags: string[];
  relevanceScore: number; // 0 - 100
  routeModule: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface GlobalSearchQuery {
  q: string;
  category?: GlobalSearchCategory;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  limit?: number;
}

// ==================== 6. UNIVERSAL ATTACHMENT SERVICE TYPES ====================

export type AttachmentCategory = 
  | 'INVOICE'
  | 'RECEIPT'
  | 'CONTRACT'
  | 'SPECIFICATION'
  | 'PHOTO'
  | 'REPORT'
  | 'OTHER';

export interface DocumentAttachment {
  id: string;
  entityType: string;
  entityId: string;
  entityNumber: string;
  fileName: string;
  fileSize: number;
  fileSizeBytesFormatted: string;
  mimeType: string;
  category: AttachmentCategory;
  version: number;
  isLatest: boolean;
  downloadUrl: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  sha256Checksum: string;
  isVerified: boolean;
  description?: string;
}

export interface AttachmentAuditLog {
  id: string;
  attachmentId: string;
  fileName: string;
  action: 'UPLOADED' | 'DOWNLOADED' | 'VIEWED' | 'DELETED' | 'NEW_VERSION';
  userId: string;
  userName: string;
  timestamp: string;
  ipAddress: string;
}

// ==================== 7. ACTIVITY TIMELINE TYPES ====================

export type DocumentLifecycleAction = 
  | 'CREATED'
  | 'MODIFIED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'POSTED'
  | 'TRANSFERRED'
  | 'CANCELLED'
  | 'REVERSED'
  | 'ARCHIVED'
  | 'VIEWED'
  | 'ATTACHED';

export interface ActivityTimelineEvent {
  id: string;
  entityType: string;
  entityId: string;
  entityNumber: string;
  action: DocumentLifecycleAction;
  performedByUserId: string;
  performedByName: string;
  performedByRole: string;
  timestamp: string;
  correlationId: string;
  summaryEn: string;
  summaryAr: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  sha256Hash: string;
}

// ==================== 8. DASHBOARD FRAMEWORK TYPES ====================

export type DashboardWidgetType = 
  | 'KPI_STAT'
  | 'LINE_CHART'
  | 'BAR_CHART'
  | 'DONUT_CHART'
  | 'AREA_CHART'
  | 'RECENT_TABLE'
  | 'ALERT_LIST';

export interface DashboardWidgetDefinition {
  id: string;
  titleEn: string;
  titleAr: string;
  widgetType: DashboardWidgetType;
  roleScope: string[];
  metricKey: string;
  refreshIntervalSeconds: number;
  gridSpan: { w: number; h: number };
  config?: Record<string, any>;
}

export interface DashboardKpiMetric {
  key: string;
  labelEn: string;
  labelAr: string;
  value: number | string;
  formattedValue: string;
  trendPercent: number;
  trendDirection: 'UP' | 'DOWN' | 'NEUTRAL';
  badgeColor: 'emerald' | 'amber' | 'blue' | 'rose' | 'purple';
  drillDownModule: string;
}

export interface RoleDashboardLayout {
  role: string;
  layoutId: string;
  widgets: {
    widgetId: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }[];
  isDefault: boolean;
}

// ==================== 9. IMPORT & EXPORT FRAMEWORK TYPES ====================

export interface ImportColumnDefinition {
  field: string;
  label: string;
  labelAr: string;
  required: boolean;
  dataType: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN';
  sample: string;
}

export interface ImportTemplate {
  id: string;
  entityType: string;
  nameEn: string;
  nameAr: string;
  supportedFormats: ('XLSX' | 'CSV' | 'JSON')[];
  columns: ImportColumnDefinition[];
}

export interface ImportErrorDetail {
  rowNumber: number;
  field: string;
  errorEn: string;
  errorAr: string;
  rawValue: string;
}

export interface ImportSession {
  id: string;
  entityType: string;
  fileName: string;
  format: 'XLSX' | 'CSV' | 'JSON';
  totalRows: number;
  validRows: number;
  invalidRows: number;
  status: 'VALIDATING' | 'VALIDATED' | 'IMPORTING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';
  errors: ImportErrorDetail[];
  previewData: Record<string, any>[];
  importedCount: number;
  createdAt: string;
  completedAt?: string;
  rolledBackAt?: string;
}

export interface PlatformExportRequest {
  entityType: string;
  format: 'XLSX' | 'PDF' | 'CSV' | 'JSON' | 'XML';
  columns?: string[];
  filters?: Record<string, any>;
  includeHeaders?: boolean;
  dateRange?: { from: string; to: string };
  title?: string;
}

// ==================== 10. SYSTEM CONFIGURATION CENTER TYPES ====================

export interface NumberingSeriesConfig {
  id: string;
  entityType: string;
  prefix: string;
  suffix?: string;
  yearFormat: 'YYYY' | 'YY' | 'NONE';
  sequencePadding: number;
  currentSequence: number;
  resetPeriod: 'YEARLY' | 'MONTHLY' | 'NEVER';
  exampleFormat: string;
}

export interface LocalizationFrameworkSettings {
  zatcaPhase2Enabled: boolean;
  zatcaProductionMode: boolean;
  etaEInvoicingEnabled: boolean;
  uaeFtaVatEnabled: boolean;
  standardVatRate: number;
  withholdingTaxRate: number;
  currencyRoundingDecimals: number;
  defaultCountryCode: string;
}

export interface PlatformSystemConfiguration {
  companyId: string;
  companyName: string;
  generalSettings: {
    legalName: string;
    legalNameAr: string;
    taxNumber: string;
    baseCurrency: string;
    timezone: string;
    dateFormat: string;
    rtlEnabled: boolean;
  };
  numberingRules: NumberingSeriesConfig[];
  localization: LocalizationFrameworkSettings;
  featureFlags: Record<string, boolean>;
}

// ==================== 11. HEALTH MONITORING & DIAGNOSTICS TYPES ====================

export interface ServiceHealthStatus {
  name: string;
  category: 'CORE' | 'DATABASE' | 'SUBLEDGER' | 'INTEGRATION' | 'STORAGE';
  status: 'UP' | 'DOWN' | 'DEGRADED';
  latencyMs: number;
  message: string;
}

export interface SubledgerIntegrityCheck {
  glBalanced: boolean;
  apSyncValid: boolean;
  arSyncValid: boolean;
  inventorySyncValid: boolean;
  treasurySyncValid: boolean;
  fixedAssetsSyncValid: boolean;
  totalVarianceSar: number;
}

export interface SystemHealthReport {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  timestamp: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  memory: {
    totalMb: number;
    usedMb: number;
    heapUsedMb: number;
    freeMb: number;
    usagePercent: number;
  };
  eventLoopLatencyMs: number;
  activeConnections: number;
  requestsPerSecond: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  subledgerIntegrity: SubledgerIntegrityCheck;
  services: ServiceHealthStatus[];
  queueStats: {
    totalQueued: number;
    activeWorkers: number;
    completedToday: number;
    failedToday: number;
  };
}

// ==================== 12. BACKUP & RECOVERY TYPES ====================

export interface BackupMetadata {
  id: string;
  backupNumber: string;
  backupType: 'FULL' | 'CONFIGURATION_ONLY' | 'METADATA_ONLY';
  status: 'COMPLETED' | 'FAILED' | 'IN_PROGRESS';
  totalEntities: number;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  sha256Checksum: string;
  createdAt: string;
  createdBy: string;
  restoreSimulationStatus: 'PASSED' | 'FAILED' | 'PENDING';
  restoreSimulationTimestamp?: string;
  modulesIncluded: string[];
}

// ==================== 13. PERFORMANCE OPTIMIZATION METRICS ====================

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRatePercent: number;
  cachedKeysCount: number;
  memoryUsageBytes: number;
  memoryUsageFormatted: string;
}

// ==================== 14. PILOT DEPLOYMENT READINESS TYPES ====================

export interface PreFlightCheckResult {
  checkId: string;
  title: string;
  titleAr: string;
  category: 'INFRASTRUCTURE' | 'SECURITY' | 'INTEGRATION' | 'DATA_INTEGRITY' | 'STATUTORY';
  status: 'PASSED' | 'WARNING' | 'FAILED';
  details: string;
  sha256Signature: string;
}

export interface DomainVerificationRecord {
  domain: string;
  domainAr: string;
  phase: string;
  status: 'CERTIFIED' | 'HARDENED';
  testsPassed: number;
  totalTests: number;
  coveragePercent: number;
  certifiedDate: string;
}

export interface PilotReadinessEvaluation {
  overallScore: string;
  overallPercent: number;
  certificationStatus: 'READY_FOR_PILOT_DEPLOYMENT' | 'ACTION_REQUIRED' | 'FAILED_STORAGE_EPHEMERAL';
  generatedAt: string;
  certifiedBy: string;
  sha256AuditSeal: string;
  domainVerifications: DomainVerificationRecord[];
  preFlightChecks: PreFlightCheckResult[];
  persistence?: StoragePersistenceReport;
  performanceBaseline: {
    p50LatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    maxConcurrentUsers: number;
    throughputRps: number;
    coldStartMs: number;
  };
  deploymentChecklist: {
    id: string;
    item: string;
    itemAr: string;
    mandatory: boolean;
    isVerified: boolean;
  }[];
}
