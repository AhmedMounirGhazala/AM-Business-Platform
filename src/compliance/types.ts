/**
 * AM Business Platform - Statutory Tax Compliance & Official E-Invoicing Types
 * Architecture Baseline: v2.8 | Compliance Task P0-05
 * 
 * Supports Egyptian Tax Authority (ETA eInvoicing & eReceipt)
 * and Saudi Arabian Zakat, Tax and Customs Authority (ZATCA / FATOORA Phase 2).
 */

export type ComplianceEnvironment = 'LOCAL' | 'TEST' | 'SANDBOX' | 'PRODUCTION';

export type ComplianceJurisdiction = 'EGYPT_ETA' | 'ZATCA_PHASE2' | 'UAE_FTA' | 'GENERIC_STATUTORY';

export type ComplianceDocumentType =
  | 'INVOICE'          // Standard Tax Invoice (B2B)
  | 'SIMPLIFIED_INVOICE' // Simplified Tax Invoice (B2C)
  | 'CREDIT_NOTE'      // Credit Note (Reversal / Adjustment)
  | 'DEBIT_NOTE'       // Debit Note (Surcharge / Surcharge Adjustment)
  | 'RECEIPT'          // POS Electronic Receipt
  | 'RETURN_RECEIPT';  // POS Return Receipt

export type ComplianceSubmissionStatus =
  | 'DRAFT'
  | 'VALIDATION_FAILED'
  | 'READY'
  | 'READY_FOR_SUBMISSION'
  | 'QUEUED'
  | 'SUBMITTING'
  | 'SUBMITTED'
  | 'PENDING'
  | 'PENDING_AUTHORITY'
  | 'ACCEPTED'
  | 'CLEARED'
  | 'REPORTED'
  | 'REJECTED'
  | 'FAILED'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED'
  | 'RETRY_SCHEDULED'
  | 'CONFIGURATION_ERROR'
  | 'NOT_SUPPORTED'
  | 'NOT_READY'
  | 'UNKNOWN_OUTCOME';

export interface StateTransitionAudit {
  from: ComplianceSubmissionStatus;
  to: ComplianceSubmissionStatus;
  timestamp: string;
  actorId: string;
  reason?: string;
}

export interface ComplianceTaxpayerProfile {
  tenantId: string;
  companyId: string;
  jurisdiction: ComplianceJurisdiction;
  environment: ComplianceEnvironment;
  taxRegistrationNumber: string; // Egyptian 9-digit or Saudi 15-digit
  commercialRegistrationNumber?: string;
  legalEntityNameEn: string;
  legalEntityNameAr: string;
  activityCode?: string;
  branchCode?: string;
  address: {
    country: string;
    governateOrRegion: string;
    city: string;
    street: string;
    buildingNumber: string;
    postalCode?: string;
  };
  // Credentials (held server-side only)
  etaClientId?: string;
  etaClientSecret?: string;
  etaTokenUrl?: string;
  etaApiBaseUrl?: string;
  zatcaEgsUuid?: string;
  zatcaCsid?: string;
  zatcaCsidSecret?: string;
  zatcaPrivateKeyPem?: string;
  zatcaCertificatePem?: string;
  zatcaCertificateExpiry?: string;
  zatcaApiBaseUrl?: string;
}

export interface CanonicalComplianceLine {
  lineNumber: number;
  itemSku: string;
  description: string;
  descriptionAr?: string;
  commodityCode: string; // GS1 or EGS for Egypt, UNSPSC or internal for KSA
  commodityType: 'GS1' | 'EGS' | 'INTERNAL';
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  discountAmount: number;
  netAmount: number;
  taxRate: number; // e.g. 0.14 for Egypt, 0.15 for KSA
  taxAmount: number;
  withholdingTaxRate?: number;
  withholdingTaxAmount?: number;
  lineTotalGross: number;
}

export interface CanonicalComplianceDocument {
  id: string; // Canonical compliance ID
  tenantId: string;
  companyId: string;
  branchId?: string;
  sourceDocumentType: 'SALES_INVOICE' | 'POS_RECEIPT' | 'CUSTOMER_BILLING' | 'MANUAL';
  sourceDocumentId: string;
  sourceDocumentNumber: string;
  documentType: ComplianceDocumentType;
  documentVersion: string; // e.g. '1.0', '0.9', '1.2'
  issueDate: string; // ISO 8601
  currency: string;
  exchangeRate: number;
  
  // Taxpayer (Issuer)
  issuer: {
    taxNumber: string;
    name: string;
    nameAr?: string;
    activityCode?: string;
    branchCode?: string;
    address: {
      country: string;
      governate: string;
      city: string;
      street: string;
      buildingNumber: string;
      postalCode?: string;
    };
  };

  // Buyer (Receiver)
  receiver?: {
    type: 'B' | 'P' | 'F'; // Business, Person, Foreigner
    taxNumber?: string;
    nationalIdOrPassport?: string;
    name: string;
    nameAr?: string;
    address?: {
      country: string;
      governate?: string;
      city?: string;
      street?: string;
      buildingNumber?: string;
    };
  };

  // Original Document Reference (for Credit/Debit Notes)
  originalDocumentReference?: {
    documentUuid: string;
    documentNumber: string;
    issueDate: string;
    reasonCode?: string;
    reasonDescription?: string;
  };

  lines: CanonicalComplianceLine[];

  // Authoritative Totals (From TaxEngine / Accounting)
  subtotalNet: number;
  totalDiscount: number;
  totalTax: number;
  totalWithholdingTax: number;
  grandTotalGross: number;

  // Cryptographic & Identity
  documentUuid: string; // Authority UUID / ZATCA URN UUID
  previousDocumentHash?: string; // Invoice chaining
  documentHashSha256?: string; // Digest
  digitalSignature?: string; // Authority / ECDSA signature
  qrCodePayload?: string; // TLV base64 or verification URL

  metadata?: Record<string, any>;
}

export interface ComplianceSubmissionRecord {
  id: string;
  tenantId: string;
  companyId: string;
  canonicalDocId: string;
  sourceDocumentNumber: string;
  documentType: ComplianceDocumentType;
  jurisdiction: ComplianceJurisdiction;
  environment: ComplianceEnvironment;
  status: ComplianceSubmissionStatus;
  payloadFingerprint: string; // SHA-256 of request payload
  documentUuid: string;
  submissionId?: string; // ID returned by official authority
  authorityStatus?: string; // Official raw status e.g. "Valid", "Invalid", "Cleared"
  authorityResponse?: any; // Preserved raw response
  warnings?: string[];
  errors?: string[];
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
  correlationId?: string;
  errorCode?: string;
  errorCategory?: 'NETWORK_TIMEOUT' | 'SCHEMA_VALIDATION' | 'AUTH_FAILURE' | 'AUTHORITY_REJECTION' | 'CONFIGURATION' | 'UNKNOWN';
  isRetryable?: boolean;
  stateTransitions?: StateTransitionAudit[];
  reconciliationHistory?: Array<{ timestamp: string; outcome: string; resolvedBy: string }>;
  offlineIssued?: boolean;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  completedAt?: string;
  digitalSealSha256: string;
}

export interface ComplianceArchiveRecord {
  id: string;
  submissionId: string;
  tenantId: string;
  companyId: string;
  sourceDocumentId: string;
  sourceDocumentNumber: string;
  provider: string; // 'ETA_EGYPT' | 'SAUDI_ZATCA' | etc.
  environment: ComplianceEnvironment;
  documentType: ComplianceDocumentType;
  documentUuid: string;
  payloadFingerprint: string;
  canonicalDocument: CanonicalComplianceDocument;
  submittedPayloadRaw: string;
  authorityResponseRaw: string;
  requestTimestamp: string;
  responseTimestamp?: string;
  authorityReferenceId?: string;
  authorityStatus?: string;
  errorCategory?: string;
  errorCode?: string;
  retryCount: number;
  correlationId: string;
  stateTransitions: StateTransitionAudit[];
  signatureMetadata?: {
    algorithm: string;
    certificatePresent: boolean;
    keyId?: string;
  };
  reconciliationHistory?: Array<{ timestamp: string; outcome: string; resolvedBy: string }>;
  digitalSealSha256: string;
  archivedAt: string;
}

export interface ComplianceReconciliationDiscrepancy {
  sourceDocumentNumber: string;
  canonicalDocId?: string;
  documentUuid?: string;
  issue:
    | 'UNSUBMITTED_DOCUMENT'
    | 'STALE_PENDING_SUBMISSION'
    | 'STATUS_MISMATCH'
    | 'TOTAL_MISMATCH'
    | 'MISSING_AUTHORITY_RESPONSE'
    | 'CERTIFICATE_EXPIRING_SOON'
    | 'CERTIFICATE_EXPIRED'
    | 'FRAUDULENT_STATUS_FORGERY'
    | 'UNKNOWN_AUTHORITY_OUTCOME';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  details: string;
  detectedAt: string;
}

export interface ComplianceReconciliationReport {
  timestamp: string;
  tenantId: string;
  companyId: string;
  jurisdiction: ComplianceJurisdiction;
  totalDocumentsAudited: number;
  totalCompliant: number;
  totalPending: number;
  totalDiscrepancies: number;
  discrepancies: ComplianceReconciliationDiscrepancy[];
  certifiedStatus: 'COMPLIANT' | 'NEEDS_ATTENTION' | 'NON_COMPLIANT';
}

export interface ComplianceProviderReadiness {
  provider: string;
  environment: ComplianceEnvironment;
  configurationReadiness: 'READY' | 'MISSING_CREDENTIALS' | 'CONFIGURATION_ERROR';
  certificatePresence: boolean;
  credentialPresence: {
    hasKeyOrSecret: boolean;
    hasClientOrDeviceId: boolean;
  };
  endpointIdentity: string;
  supportedDocumentTypes: ComplianceDocumentType[];
  adapterVersion: string;
  lastConnectivityCheck?: string;
  lastSuccessfulSubmissionTimestamp?: string;
  missingPrerequisites: string[];
}

export interface ComplianceReadinessResponse {
  success: boolean;
  environment: ComplianceEnvironment;
  certifiedStatus: string;
  providers: {
    ETA: ComplianceProviderReadiness;
    ZATCA: ComplianceProviderReadiness;
  };
  supportedJurisdictions: ComplianceJurisdiction[];
}
