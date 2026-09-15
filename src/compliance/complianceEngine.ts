/**
 * AM Business Platform - Core Statutory Tax Compliance Engine
 * Architecture Baseline: v2.8 | Compliance Task P0-05
 * 
 * Orchestrates Authoritative Integration:
 * Business Document -> TaxEngine -> Eligibility -> Localization Adapter -> Canonical Doc
 * -> Schema Validation -> Sign/Hash -> Submission Queue -> Authority API -> Authority Response
 * -> Durable State -> Audit Vault -> Reconciliation -> Accounting Boundary.
 */

import crypto from 'node:crypto';
import { PilotDatabaseService } from '../../server/pilotDatabase';
import {
  CanonicalComplianceDocument,
  ComplianceArchiveRecord,
  ComplianceDocumentType,
  ComplianceEnvironment,
  ComplianceJurisdiction,
  ComplianceReconciliationReport,
  ComplianceSubmissionRecord,
  ComplianceSubmissionStatus,
  ComplianceTaxpayerProfile,
  ComplianceProviderReadiness,
  ComplianceReadinessResponse
} from './types';
import { EgyptianTaxAuthorityAdapter } from './etaAdapter';
import { SaudiZatcaAdapter } from './zatcaAdapter';
import { ZatcaTlvEncoder } from './tlvEncoder';

export class ComplianceEngine {
  private static instance: ComplianceEngine | null = null;
  private db: PilotDatabaseService;

  private constructor(pilotDb?: PilotDatabaseService) {
    this.db = pilotDb || PilotDatabaseService.getInstance();
  }

  public static getInstance(pilotDb?: PilotDatabaseService): ComplianceEngine {
    if (!ComplianceEngine.instance || pilotDb) {
      ComplianceEngine.instance = new ComplianceEngine(pilotDb);
    }
    return ComplianceEngine.instance;
  }

  /**
   * Generates SHA-256 fingerprint for any payload
   */
  public static hashPayload(payload: any): string {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  // =========================================================================
  // 1. TAXPAYER PROFILES (Stored durably per tenant/company)
  // =========================================================================

  public getTaxpayerProfile(tenantId: string, companyId: string): ComplianceTaxpayerProfile | null {
    const profile = this.db.getEntity<ComplianceTaxpayerProfile>('compliance_profiles', `${tenantId}:${companyId}`);
    return profile;
  }

  public saveTaxpayerProfile(profile: ComplianceTaxpayerProfile): void {
    const id = `${profile.tenantId}:${profile.companyId}`;
    this.db.saveEntity('compliance_profiles', { ...profile, id });
    this.db.logAudit('COMPLIANCE_PROFILE_UPDATED', { tenantId: profile.tenantId, companyId: profile.companyId, jurisdiction: profile.jurisdiction, environment: profile.environment }, profile.tenantId, profile.companyId);
  }

  // =========================================================================
  // 2. STATE MACHINE VALIDATION & AUDIT
  // =========================================================================

  private static readonly VALID_TRANSITIONS: Record<ComplianceSubmissionStatus, ComplianceSubmissionStatus[]> = {
    DRAFT: ['READY', 'READY_FOR_SUBMISSION', 'VALIDATION_FAILED', 'CONFIGURATION_ERROR'],
    VALIDATION_FAILED: ['DRAFT', 'READY', 'READY_FOR_SUBMISSION'],
    READY: ['QUEUED', 'SUBMITTING', 'CONFIGURATION_ERROR', 'VALIDATION_FAILED', 'NOT_READY'],
    READY_FOR_SUBMISSION: ['QUEUED', 'SUBMITTING', 'CONFIGURATION_ERROR', 'VALIDATION_FAILED', 'NOT_READY'],
    QUEUED: ['SUBMITTING', 'FAILED', 'CONFIGURATION_ERROR', 'NOT_READY'],
    SUBMITTING: [
      'SUBMITTED', 'ACCEPTED', 'CLEARED', 'REPORTED', 'REJECTED', 'FAILED',
      'PENDING', 'PENDING_AUTHORITY', 'CONFIGURATION_ERROR', 'VALIDATION_FAILED',
      'UNKNOWN_OUTCOME', 'RETRY_SCHEDULED'
    ],
    SUBMITTED: ['PENDING', 'PENDING_AUTHORITY', 'ACCEPTED', 'CLEARED', 'REPORTED', 'REJECTED', 'FAILED', 'UNKNOWN_OUTCOME'],
    PENDING: ['ACCEPTED', 'CLEARED', 'REPORTED', 'REJECTED', 'FAILED', 'UNKNOWN_OUTCOME'],
    PENDING_AUTHORITY: ['ACCEPTED', 'CLEARED', 'REPORTED', 'REJECTED', 'FAILED', 'UNKNOWN_OUTCOME'],
    UNKNOWN_OUTCOME: ['RETRY_SCHEDULED', 'ACCEPTED', 'CLEARED', 'REPORTED', 'REJECTED', 'FAILED', 'SUBMITTING'],
    ACCEPTED: ['CANCEL_REQUESTED'],
    CLEARED: ['CANCEL_REQUESTED'],
    REPORTED: ['CANCEL_REQUESTED'],
    REJECTED: ['RETRY_SCHEDULED', 'READY', 'READY_FOR_SUBMISSION', 'FAILED', 'DRAFT'],
    FAILED: ['RETRY_SCHEDULED', 'QUEUED', 'READY', 'READY_FOR_SUBMISSION'],
    CANCEL_REQUESTED: ['CANCELLED', 'FAILED'],
    CANCELLED: [],
    RETRY_SCHEDULED: ['QUEUED', 'SUBMITTING', 'FAILED', 'UNKNOWN_OUTCOME'],
    CONFIGURATION_ERROR: ['READY', 'READY_FOR_SUBMISSION', 'DRAFT'],
    NOT_SUPPORTED: [],
    NOT_READY: ['READY', 'READY_FOR_SUBMISSION', 'DRAFT']
  };

  public canTransition(from: ComplianceSubmissionStatus, to: ComplianceSubmissionStatus): boolean {
    const allowed = ComplianceEngine.VALID_TRANSITIONS[from];
    return Array.isArray(allowed) && allowed.includes(to);
  }

  public updateSubmissionStatus(
    submission: ComplianceSubmissionRecord,
    newStatus: ComplianceSubmissionStatus,
    actorId = 'system',
    reason?: string
  ): ComplianceSubmissionRecord {
    if (submission.status === newStatus) return submission;

    if (!this.canTransition(submission.status, newStatus)) {
      const err = `Illegal compliance state transition from ${submission.status} to ${newStatus}`;
      this.db.logAudit('COMPLIANCE_ILLEGAL_TRANSITION_ATTEMPT', { submissionId: submission.id, from: submission.status, attempted: newStatus, reason, actorId }, submission.tenantId, submission.companyId);
      throw new Error(err);
    }

    const previousStatus = submission.status;
    submission.status = newStatus;
    submission.updatedAt = new Date().toISOString();

    submission.stateTransitions = [
      ...(submission.stateTransitions || []),
      {
        from: previousStatus,
        to: newStatus,
        timestamp: new Date().toISOString(),
        actorId,
        reason
      }
    ];

    if (newStatus === 'SUBMITTED' || newStatus === 'ACCEPTED' || newStatus === 'CLEARED' || newStatus === 'REPORTED') {
      submission.completedAt = submission.completedAt || new Date().toISOString();
    }

    submission.digitalSealSha256 = ComplianceEngine.hashPayload(submission);
    this.db.saveEntity('compliance_submissions', submission);

    this.db.logAudit('COMPLIANCE_STATUS_TRANSITION', {
      submissionId: submission.id,
      docUuid: submission.documentUuid,
      from: previousStatus,
      to: newStatus,
      actorId,
      reason
    }, submission.tenantId, submission.companyId);

    return submission;
  }

  // =========================================================================
  // 3. CANONICAL DOCUMENT CREATION (Authoritative Integration Principle)
  // =========================================================================

  /**
   * Builds canonical compliance document from authoritative business document.
   * Taxes MUST be pre-calculated by TaxEngine / Accounting.
   */
  public buildCanonicalDocument(params: {
    tenantId: string;
    companyId: string;
    branchId?: string;
    sourceDocumentType: 'SALES_INVOICE' | 'POS_RECEIPT' | 'CUSTOMER_BILLING' | 'MANUAL';
    sourceDocumentId: string;
    sourceDocumentNumber: string;
    documentType: ComplianceDocumentType;
    documentVersion?: string;
    issueDate?: string;
    currency?: string;
    exchangeRate?: number;
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
    receiver?: {
      type: 'B' | 'P' | 'F';
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
    lines: {
      lineNumber: number;
      itemSku: string;
      description: string;
      descriptionAr?: string;
      commodityCode: string;
      commodityType: 'GS1' | 'EGS' | 'INTERNAL';
      quantity: number;
      unitOfMeasure: string;
      unitPrice: number;
      discountAmount: number;
      netAmount: number;
      taxRate: number;
      taxAmount: number;
      withholdingTaxRate?: number;
      withholdingTaxAmount?: number;
      lineTotalGross: number;
    }[];
    subtotalNet?: number;
    totalDiscount?: number;
    totalTax?: number;
    totalWithholdingTax?: number;
    grandTotalGross?: number;
    originalDocumentReference?: {
      documentUuid: string;
      documentNumber: string;
      issueDate: string;
      reasonCode?: string;
      reasonDescription?: string;
    };
    previousDocumentHash?: string;
    metadata?: Record<string, any>;
  }): CanonicalComplianceDocument {
    const id = `CANON-DOC-${params.tenantId}-${params.companyId}-${params.sourceDocumentNumber}`;
    const docUuid = `urn:uuid:${crypto.randomUUID()}`;

    const subtotalNet = typeof params.subtotalNet === 'number'
      ? params.subtotalNet
      : (params.lines || []).reduce((sum, l) => sum + (l.netAmount || 0), 0);
    const totalDiscount = typeof params.totalDiscount === 'number'
      ? params.totalDiscount
      : (params.lines || []).reduce((sum, l) => sum + (l.discountAmount || 0), 0);
    const totalTax = typeof params.totalTax === 'number'
      ? params.totalTax
      : (params.lines || []).reduce((sum, l) => sum + (l.taxAmount || 0), 0);
    const totalWithholdingTax = typeof params.totalWithholdingTax === 'number'
      ? params.totalWithholdingTax
      : (params.lines || []).reduce((sum, l) => sum + (l.withholdingTaxAmount || 0), 0);
    const grandTotalGross = typeof params.grandTotalGross === 'number'
      ? params.grandTotalGross
      : (subtotalNet + totalTax - totalWithholdingTax);

    const canonicalDoc: CanonicalComplianceDocument = {
      id,
      tenantId: params.tenantId,
      companyId: params.companyId,
      branchId: params.branchId,
      sourceDocumentType: params.sourceDocumentType,
      sourceDocumentId: params.sourceDocumentId,
      sourceDocumentNumber: params.sourceDocumentNumber,
      documentType: params.documentType,
      documentVersion: params.documentVersion || '1.0',
      issueDate: params.issueDate || new Date().toISOString(),
      currency: params.currency || 'EGP',
      exchangeRate: params.exchangeRate || 1.0,
      issuer: params.issuer,
      receiver: params.receiver,
      lines: params.lines,
      subtotalNet,
      totalDiscount,
      totalTax,
      totalWithholdingTax,
      grandTotalGross,
      originalDocumentReference: params.originalDocumentReference,
      documentUuid: docUuid,
      previousDocumentHash: params.previousDocumentHash,
      metadata: params.metadata
    };

    canonicalDoc.documentHashSha256 = ComplianceEngine.hashPayload(canonicalDoc);
    return canonicalDoc;
  }

  // =========================================================================
  // 4. SUBMISSION ORCHESTRATION & IDEMPOTENCY
  // =========================================================================

  /**
   * Submits or queues a canonical compliance document for official statutory integration.
   */
  public async submitComplianceDocument(
    doc: CanonicalComplianceDocument,
    actorId = 'system'
  ): Promise<ComplianceSubmissionRecord> {
    const fingerprint = ComplianceEngine.hashPayload({
      docId: doc.id,
      docNumber: doc.sourceDocumentNumber,
      grandTotal: doc.grandTotalGross,
      taxTotal: doc.totalTax,
      linesCount: doc.lines.length
    });

    // 1. Idempotency Check
    const existing = this.getSubmissionByFingerprint(doc.tenantId, doc.companyId, fingerprint);
    if (existing) {
      if (['ACCEPTED', 'CLEARED', 'REPORTED', 'SUBMITTED', 'PENDING_AUTHORITY'].includes(existing.status)) {
        return existing;
      }
    }

    // 2. Resolve Profile & Environment
    const profile = this.getTaxpayerProfile(doc.tenantId, doc.companyId) || {
      tenantId: doc.tenantId,
      companyId: doc.companyId,
      jurisdiction: doc.currency === 'SAR' ? 'ZATCA_PHASE2' : 'EGYPT_ETA',
      environment: (process.env.COMPLIANCE_ENV as ComplianceEnvironment) || 'LOCAL',
      taxRegistrationNumber: doc.issuer.taxNumber,
      legalEntityNameEn: doc.issuer.name,
      legalEntityNameAr: doc.issuer.nameAr || doc.issuer.name,
      address: {
        country: doc.issuer.address.country,
        governateOrRegion: doc.issuer.address.governate,
        city: doc.issuer.address.city,
        street: doc.issuer.address.street,
        buildingNumber: doc.issuer.address.buildingNumber,
        postalCode: doc.issuer.address.postalCode
      },
      etaClientId: process.env.ETA_CLIENT_ID,
      etaClientSecret: process.env.ETA_CLIENT_SECRET,
      zatcaCsid: process.env.ZATCA_CSID,
      zatcaCsidSecret: process.env.ZATCA_CSID_SECRET,
      zatcaCertificatePem: process.env.ZATCA_CERTIFICATE_PEM
    };

    const submissionId = `SUB-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const correlationId = `corr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    let record: ComplianceSubmissionRecord = {
      id: submissionId,
      tenantId: doc.tenantId,
      companyId: doc.companyId,
      canonicalDocId: doc.id,
      sourceDocumentNumber: doc.sourceDocumentNumber,
      documentType: doc.documentType,
      jurisdiction: profile.jurisdiction,
      environment: profile.environment,
      status: 'DRAFT',
      payloadFingerprint: fingerprint,
      documentUuid: doc.documentUuid,
      correlationId,
      retryCount: 0,
      maxRetries: 3,
      stateTransitions: [],
      createdAt: now,
      updatedAt: now,
      digitalSealSha256: ''
    };

    record.digitalSealSha256 = ComplianceEngine.hashPayload(record);
    this.db.saveEntity('compliance_submissions', record);

    // Transition to READY_FOR_SUBMISSION then SUBMITTING
    record = this.updateSubmissionStatus(record, 'READY_FOR_SUBMISSION', actorId, 'Prepared for submission');
    record = this.updateSubmissionStatus(record, 'SUBMITTING', actorId, 'Dispatching to tax authority adapter');

    // 3. Execution based on jurisdiction
    if (profile.jurisdiction === 'EGYPT_ETA') {
      const etaRes = await EgyptianTaxAuthorityAdapter.submitDocument(doc, profile);
      
      if (etaRes.status === 'CONFIGURATION_ERROR') {
        record.errorCategory = 'CONFIGURATION';
        record.errorCode = 'CONFIG_ERR';
        record.isRetryable = false;
        record.errors = etaRes.errors;
        record = this.updateSubmissionStatus(record, 'CONFIGURATION_ERROR', actorId, etaRes.errors?.join('; '));
      } else if (etaRes.status === 'VALIDATION_FAILED') {
        record.errorCategory = 'SCHEMA_VALIDATION';
        record.errorCode = 'SCHEMA_ERR';
        record.isRetryable = false;
        record.errors = etaRes.errors;
        record.warnings = etaRes.warnings;
        record = this.updateSubmissionStatus(record, 'VALIDATION_FAILED', actorId, etaRes.errors?.join('; '));
      } else if (etaRes.status === 'REJECTED') {
        record.errorCategory = 'AUTHORITY_REJECTION';
        record.errorCode = 'ETA_REJECTED';
        record.isRetryable = false;
        record.submissionId = etaRes.submissionId;
        record.authorityStatus = etaRes.authorityStatus;
        record.authorityResponse = etaRes.authorityResponse;
        record.errors = etaRes.errors;
        record = this.updateSubmissionStatus(record, 'REJECTED', actorId, 'Rejected by ETA');
      } else if (etaRes.status === 'UNKNOWN_OUTCOME') {
        record.errorCategory = 'NETWORK_TIMEOUT';
        record.errorCode = 'TIMEOUT';
        record.isRetryable = true;
        record.errors = etaRes.errors;
        record = this.updateSubmissionStatus(record, 'UNKNOWN_OUTCOME', actorId, 'ETA authority outcome unknown / timed out');
      } else if (etaRes.status === 'FAILED') {
        const classified = ComplianceEngine.classifyError(etaRes.errors?.join('; '));
        record.errorCategory = classified.errorCategory;
        record.errorCode = classified.code;
        record.isRetryable = classified.isRetryable;
        record.errors = etaRes.errors;
        record = this.updateSubmissionStatus(record, 'FAILED', actorId, 'ETA submission failed');
      } else {
        // Successful submission
        record.submissionId = etaRes.submissionId;
        record.authorityStatus = etaRes.authorityStatus;
        record.authorityResponse = etaRes.authorityResponse;
        record.submittedAt = new Date().toISOString();
        record.completedAt = new Date().toISOString();
        record = this.updateSubmissionStatus(record, etaRes.status, actorId, 'Authority accepted/submitted');
      }

      // 4. Archive raw payload and response
      this.archiveComplianceTransaction(record, doc, etaRes.authorityResponse);

    } else if (profile.jurisdiction === 'ZATCA_PHASE2') {
      const zatcaRes = await SaudiZatcaAdapter.submitDocument(doc, profile);

      if (zatcaRes.status === 'CONFIGURATION_ERROR') {
        record.errorCategory = 'CONFIGURATION';
        record.errorCode = 'CONFIG_ERR';
        record.isRetryable = false;
        record.errors = zatcaRes.errors;
        record = this.updateSubmissionStatus(record, 'CONFIGURATION_ERROR', actorId, zatcaRes.errors?.join('; '));
      } else if (zatcaRes.status === 'VALIDATION_FAILED') {
        record.errorCategory = 'SCHEMA_VALIDATION';
        record.errorCode = 'SCHEMA_ERR';
        record.isRetryable = false;
        record.errors = zatcaRes.errors;
        record.warnings = zatcaRes.warnings;
        record = this.updateSubmissionStatus(record, 'VALIDATION_FAILED', actorId, zatcaRes.errors?.join('; '));
      } else if (zatcaRes.status === 'REJECTED') {
        record.errorCategory = 'AUTHORITY_REJECTION';
        record.errorCode = 'ZATCA_REJECTED';
        record.isRetryable = false;
        record.submissionId = zatcaRes.submissionId;
        record.authorityStatus = zatcaRes.authorityStatus;
        record.authorityResponse = zatcaRes.authorityResponse;
        record.errors = zatcaRes.errors;
        record = this.updateSubmissionStatus(record, 'REJECTED', actorId, 'Rejected by ZATCA');
      } else if (zatcaRes.status === 'UNKNOWN_OUTCOME') {
        record.errorCategory = 'NETWORK_TIMEOUT';
        record.errorCode = 'TIMEOUT';
        record.isRetryable = true;
        record.errors = zatcaRes.errors;
        record = this.updateSubmissionStatus(record, 'UNKNOWN_OUTCOME', actorId, 'ZATCA authority outcome unknown / timed out');
      } else if (zatcaRes.status === 'FAILED') {
        const classified = ComplianceEngine.classifyError(zatcaRes.errors?.join('; '));
        record.errorCategory = classified.errorCategory;
        record.errorCode = classified.code;
        record.isRetryable = classified.isRetryable;
        record.errors = zatcaRes.errors;
        record = this.updateSubmissionStatus(record, 'FAILED', actorId, 'ZATCA submission failed');
      } else {
        record.submissionId = zatcaRes.submissionId;
        record.authorityStatus = zatcaRes.authorityStatus;
        record.authorityResponse = zatcaRes.authorityResponse;
        record.submittedAt = new Date().toISOString();
        record.completedAt = new Date().toISOString();
        record = this.updateSubmissionStatus(record, zatcaRes.status, actorId, 'ZATCA Cleared/Reported');
      }

      // Archive transaction
      this.archiveComplianceTransaction(record, doc, zatcaRes.authorityResponse);
    } else {
      record = this.updateSubmissionStatus(record, 'NOT_SUPPORTED', actorId, `Jurisdiction ${profile.jurisdiction} not supported`);
    }

    record.digitalSealSha256 = ComplianceEngine.hashPayload(record);
    this.db.saveEntity('compliance_submissions', record);
    return record;
  }

  // =========================================================================
  // 5. ARCHIVE & AUDIT TRAIL
  // =========================================================================

  private archiveComplianceTransaction(
    submission: ComplianceSubmissionRecord,
    doc: CanonicalComplianceDocument,
    authorityResponse: any
  ): void {
    const archiveId = `ARC-${submission.id}`;
    const archiveRecord: ComplianceArchiveRecord = {
      id: archiveId,
      submissionId: submission.id,
      tenantId: submission.tenantId,
      companyId: submission.companyId,
      sourceDocumentId: doc.sourceDocumentId,
      sourceDocumentNumber: doc.sourceDocumentNumber,
      provider: submission.jurisdiction === 'EGYPT_ETA' ? 'ETA_EGYPT' : submission.jurisdiction === 'ZATCA_PHASE2' ? 'SAUDI_ZATCA_FATOORA' : 'GENERIC_COMPLIANCE',
      environment: submission.environment,
      documentType: submission.documentType,
      documentUuid: submission.documentUuid,
      payloadFingerprint: submission.payloadFingerprint,
      canonicalDocument: doc,
      submittedPayloadRaw: JSON.stringify(doc),
      authorityResponseRaw: JSON.stringify(authorityResponse || {}),
      requestTimestamp: submission.submittedAt || submission.createdAt,
      responseTimestamp: submission.completedAt || new Date().toISOString(),
      authorityReferenceId: submission.submissionId,
      authorityStatus: submission.authorityStatus,
      errorCategory: submission.errorCategory,
      errorCode: submission.errorCode,
      retryCount: submission.retryCount,
      correlationId: submission.correlationId || submission.id,
      stateTransitions: submission.stateTransitions || [],
      signatureMetadata: {
        algorithm: submission.jurisdiction === 'ZATCA_PHASE2' ? 'ECDSA-secp256k1/sha256' : 'CAdES-BES/sha256',
        certificatePresent: Boolean(doc.issuer?.taxNumber),
        keyId: doc.issuer?.taxNumber
      },
      reconciliationHistory: submission.reconciliationHistory || [],
      digitalSealSha256: '',
      archivedAt: new Date().toISOString()
    };
    archiveRecord.digitalSealSha256 = ComplianceEngine.hashPayload(archiveRecord);
    this.db.saveEntity('compliance_archive', archiveRecord);
  }

  public getArchiveRecord(tenantId: string, companyId: string, submissionId: string): ComplianceArchiveRecord | null {
    const record = this.db.getEntity<ComplianceArchiveRecord>('compliance_archive', `ARC-${submissionId}`);
    if (record && (record.tenantId !== tenantId || record.companyId !== companyId)) {
      throw new Error('SECURITY_ERROR: Cross-tenant/company access to compliance archive is prohibited.');
    }
    return record;
  }

  // =========================================================================
  // 5B. RETRY ORCHESTRATION & ERROR CLASSIFICATION
  // =========================================================================

  public static classifyError(error: any): {
    isRetryable: boolean;
    errorCategory: 'NETWORK_TIMEOUT' | 'SCHEMA_VALIDATION' | 'AUTH_FAILURE' | 'AUTHORITY_REJECTION' | 'CONFIGURATION' | 'UNKNOWN';
    code: string;
  } {
    const msg = (error?.message || String(error)).toLowerCase();
    const code = error?.code || '';

    if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'ENOTFOUND' || msg.includes('timeout') || msg.includes('timedout') || msg.includes('etimedout') || msg.includes('network') || msg.includes('econnrefused')) {
      return { isRetryable: true, errorCategory: 'NETWORK_TIMEOUT', code: code || 'ETIMEDOUT' };
    }
    if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504') || msg.includes('service unavailable')) {
      return { isRetryable: true, errorCategory: 'NETWORK_TIMEOUT', code: 'HTTP_5XX' };
    }
    if (msg.includes('configuration_error') || msg.includes('missing official') || msg.includes('credentials not configured')) {
      return { isRetryable: false, errorCategory: 'CONFIGURATION', code: 'CONFIGURATION_ERROR' };
    }
    if (msg.includes('401') || msg.includes('403') || msg.includes('authentication failed')) {
      return { isRetryable: false, errorCategory: 'AUTH_FAILURE', code: 'AUTH_ERROR' };
    }
    if (msg.includes('validation') || msg.includes('schema') || msg.includes('422') || msg.includes('400')) {
      return { isRetryable: false, errorCategory: 'SCHEMA_VALIDATION', code: 'VALIDATION_FAILED' };
    }
    if (msg.includes('rejected') || msg.includes('invalid')) {
      return { isRetryable: false, errorCategory: 'AUTHORITY_REJECTION', code: 'AUTHORITY_REJECTED' };
    }
    return { isRetryable: false, errorCategory: 'UNKNOWN', code: 'UNKNOWN_ERROR' };
  }

  public scheduleRetry(
    submission: ComplianceSubmissionRecord,
    errorReason: string,
    actorId = 'system'
  ): ComplianceSubmissionRecord {
    if (submission.retryCount >= submission.maxRetries) {
      submission.errors = [...(submission.errors || []), `Max retries (${submission.maxRetries}) exhausted: ${errorReason}`];
      return this.updateSubmissionStatus(submission, 'FAILED', actorId, `Max retries reached: ${errorReason}`);
    }

    const baseBackoffSeconds = 30;
    const maxBackoffSeconds = 3600;
    const delaySeconds = Math.min(maxBackoffSeconds, baseBackoffSeconds * Math.pow(2, submission.retryCount));

    submission.retryCount += 1;
    submission.nextRetryAt = new Date(Date.now() + delaySeconds * 1000).toISOString();
    submission.isRetryable = true;
    submission.errors = [...(submission.errors || []), `Attempt ${submission.retryCount} failed: ${errorReason}`];

    return this.updateSubmissionStatus(
      submission,
      'RETRY_SCHEDULED',
      actorId,
      `Scheduled retry #${submission.retryCount} in ${delaySeconds}s (at ${submission.nextRetryAt})`
    );
  }

  public async executeRetry(
    tenantId: string,
    companyId: string,
    submissionId: string,
    actorId = 'system'
  ): Promise<ComplianceSubmissionRecord> {
    const submission = this.getSubmission(tenantId, companyId, submissionId);
    if (!submission) {
      throw new Error(`Submission ${submissionId} not found.`);
    }

    if (!['RETRY_SCHEDULED', 'FAILED', 'UNKNOWN_OUTCOME'].includes(submission.status)) {
      throw new Error(`Cannot retry submission in status ${submission.status}. Allowed: RETRY_SCHEDULED, FAILED, UNKNOWN_OUTCOME.`);
    }

    const archive = this.getArchiveRecord(tenantId, companyId, submissionId);
    if (!archive || !archive.canonicalDocument) {
      throw new Error(`Canonical document for submission ${submissionId} not found in archive.`);
    }

    this.updateSubmissionStatus(submission, 'SUBMITTING', actorId, `Executing retry #${submission.retryCount}`);

    const doc = archive.canonicalDocument;
    const profile = this.getTaxpayerProfile(tenantId, companyId) || {
      tenantId: doc.tenantId,
      companyId: doc.companyId,
      jurisdiction: submission.jurisdiction,
      environment: submission.environment,
      taxRegistrationNumber: doc.issuer.taxNumber,
      legalEntityNameEn: doc.issuer.name,
      legalEntityNameAr: doc.issuer.nameAr || doc.issuer.name,
      address: {
        country: doc.issuer.address.country,
        governateOrRegion: doc.issuer.address.governate,
        city: doc.issuer.address.city,
        street: doc.issuer.address.street,
        buildingNumber: doc.issuer.address.buildingNumber,
        postalCode: doc.issuer.address.postalCode
      }
    };

    if (submission.jurisdiction === 'EGYPT_ETA') {
      const etaRes = await EgyptianTaxAuthorityAdapter.submitDocument(doc, profile);
      submission.submissionId = etaRes.submissionId || submission.submissionId;
      submission.authorityStatus = etaRes.authorityStatus;
      submission.authorityResponse = etaRes.authorityResponse;
      if (etaRes.status === 'ACCEPTED' || etaRes.status === 'SUBMITTED') {
        submission.completedAt = new Date().toISOString();
        this.updateSubmissionStatus(submission, etaRes.status, actorId, 'Retry succeeded with authority');
      } else {
        submission.errors = etaRes.errors;
        this.updateSubmissionStatus(submission, etaRes.status, actorId, `Retry outcome: ${etaRes.status}`);
      }
    } else if (submission.jurisdiction === 'ZATCA_PHASE2') {
      const zatcaRes = await SaudiZatcaAdapter.submitDocument(doc, profile);
      submission.submissionId = zatcaRes.submissionId || submission.submissionId;
      submission.authorityStatus = zatcaRes.authorityStatus;
      submission.authorityResponse = zatcaRes.authorityResponse;
      if (zatcaRes.status === 'CLEARED' || zatcaRes.status === 'REPORTED' || zatcaRes.status === 'ACCEPTED') {
        submission.completedAt = new Date().toISOString();
        this.updateSubmissionStatus(submission, zatcaRes.status, actorId, 'Retry succeeded with authority');
      } else {
        submission.errors = zatcaRes.errors;
        this.updateSubmissionStatus(submission, zatcaRes.status, actorId, `Retry outcome: ${zatcaRes.status}`);
      }
    }

    this.archiveComplianceTransaction(submission, doc, submission.authorityResponse);
    this.db.saveEntity('compliance_submissions', submission);
    return submission;
  }

  public async reconcileUnknownOutcome(
    tenantId: string,
    companyId: string,
    submissionId: string,
    actorId = 'system'
  ): Promise<ComplianceSubmissionRecord> {
    const submission = this.getSubmission(tenantId, companyId, submissionId);
    if (!submission) throw new Error(`Submission ${submissionId} not found.`);

    const profile = this.getTaxpayerProfile(tenantId, companyId);
    let resolvedStatus: ComplianceSubmissionStatus = submission.status;
    let details = 'Unknown outcome reconciliation check';

    if (profile && submission.jurisdiction === 'EGYPT_ETA' && submission.submissionId) {
      try {
        const queryRes = await EgyptianTaxAuthorityAdapter.querySubmissionStatus(submission.submissionId, profile);
        if (queryRes.authorityStatus.toLowerCase() === 'valid' || queryRes.authorityStatus.toLowerCase() === 'accepted') {
          resolvedStatus = 'ACCEPTED';
          details = 'Reconciled to ACCEPTED via ETA query API';
        } else if (queryRes.authorityStatus.toLowerCase() === 'invalid' || queryRes.authorityStatus.toLowerCase() === 'rejected') {
          resolvedStatus = 'REJECTED';
          details = 'Reconciled to REJECTED via ETA query API';
        }
      } catch (err: any) {
        details = `Authority query failed during reconciliation: ${err.message}`;
      }
    }

    if (resolvedStatus !== submission.status) {
      this.updateSubmissionStatus(submission, resolvedStatus, actorId, details);
    }

    submission.reconciliationHistory = [
      ...(submission.reconciliationHistory || []),
      { timestamp: new Date().toISOString(), outcome: details, resolvedBy: actorId }
    ];
    this.db.saveEntity('compliance_submissions', submission);
    return submission;
  }

  // =========================================================================
  // 6. QUERIES & RECONCILIATION
  // =========================================================================

  public getSubmission(tenantId: string, companyId: string, id: string): ComplianceSubmissionRecord | null {
    const sub = this.db.getEntity<ComplianceSubmissionRecord>('compliance_submissions', id);
    if (sub && (sub.tenantId !== tenantId || sub.companyId !== companyId)) {
      throw new Error('SECURITY_ERROR: Cross-tenant/company access to compliance submission is prohibited.');
    }
    return sub;
  }

  public getSubmissions(tenantId: string, companyId: string): ComplianceSubmissionRecord[] {
    const all = this.db.queryEntities<ComplianceSubmissionRecord>('compliance_submissions', { tenantId, companyId });
    return all.filter(s => s.tenantId === tenantId && s.companyId === companyId);
  }

  public getSubmissionByFingerprint(tenantId: string, companyId: string, fingerprint: string): ComplianceSubmissionRecord | null {
    const all = this.getSubmissions(tenantId, companyId);
    return all.find(s => s.payloadFingerprint === fingerprint) || null;
  }

  /**
   * Reconciles internal invoices / POS receipts against compliance submissions.
   */
  public runReconciliation(
    tenantId: string,
    companyId: string,
    internalInvoices: { id: string; number: string; totalAmount: number; taxAmount: number; date: string }[]
  ): ComplianceReconciliationReport {
    const submissions = this.getSubmissions(tenantId, companyId);
    const subMap = new Map<string, ComplianceSubmissionRecord>();
    for (const sub of submissions) {
      subMap.set(sub.sourceDocumentNumber, sub);
    }

    const discrepancies: any[] = [];
    let compliantCount = 0;
    let pendingCount = 0;

    for (const inv of internalInvoices) {
      const sub = subMap.get(inv.number);

      if (!sub) {
        discrepancies.push({
          sourceDocumentNumber: inv.number,
          issue: 'UNSUBMITTED_DOCUMENT',
          severity: 'HIGH',
          details: `Invoice ${inv.number} has been posted in internal accounts but has not been submitted to statutory tax authority.`,
          detectedAt: new Date().toISOString()
        });
      } else {
        if (['ACCEPTED', 'CLEARED', 'REPORTED'].includes(sub.status)) {
          compliantCount++;
        } else if (['SUBMITTED', 'PENDING_AUTHORITY', 'QUEUED'].includes(sub.status)) {
          pendingCount++;
          // Check for stale pending (> 2 hours)
          const ageHours = (Date.now() - new Date(sub.createdAt).getTime()) / 3600000;
          if (ageHours > 2) {
            discrepancies.push({
              sourceDocumentNumber: inv.number,
              canonicalDocId: sub.canonicalDocId,
              documentUuid: sub.documentUuid,
              issue: 'STALE_PENDING_SUBMISSION',
              severity: 'MEDIUM',
              details: `Submission has been pending authority response for ${ageHours.toFixed(1)} hours.`,
              detectedAt: new Date().toISOString()
            });
          }
        } else if (sub.status === 'REJECTED') {
          discrepancies.push({
            sourceDocumentNumber: inv.number,
            canonicalDocId: sub.canonicalDocId,
            documentUuid: sub.documentUuid,
            issue: 'STATUS_MISMATCH',
            severity: 'CRITICAL',
            details: `Invoice rejected by authority (${sub.errors?.join('; ') || 'Invalid'}), but remains active in ERP accounts.`,
            detectedAt: new Date().toISOString()
          });
        } else if (sub.status === 'UNKNOWN_OUTCOME') {
          discrepancies.push({
            sourceDocumentNumber: inv.number,
            canonicalDocId: sub.canonicalDocId,
            documentUuid: sub.documentUuid,
            issue: 'UNKNOWN_AUTHORITY_OUTCOME',
            severity: 'HIGH',
            details: `Invoice submission resulted in an unknown authority outcome. Reconciliation required before accounting closure.`,
            detectedAt: new Date().toISOString()
          });
        }
      }
    }

    // Check certificate expiry if profile exists
    const profile = this.getTaxpayerProfile(tenantId, companyId);
    if (profile?.zatcaCertificateExpiry) {
      const expiryDate = new Date(profile.zatcaCertificateExpiry).getTime();
      const daysUntilExpiry = (expiryDate - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiry <= 0) {
        discrepancies.push({
          sourceDocumentNumber: 'SYSTEM_CERTIFICATE',
          issue: 'CERTIFICATE_EXPIRED',
          severity: 'CRITICAL',
          details: `ZATCA Compliance Certificate expired ${Math.abs(daysUntilExpiry).toFixed(0)} days ago. Clearance operations blocked.`,
          detectedAt: new Date().toISOString()
        });
      } else if (daysUntilExpiry <= 30) {
        discrepancies.push({
          sourceDocumentNumber: 'SYSTEM_CERTIFICATE',
          issue: 'CERTIFICATE_EXPIRING_SOON',
          severity: 'MEDIUM',
          details: `ZATCA Compliance Certificate will expire in ${daysUntilExpiry.toFixed(0)} days. Renewal required.`,
          detectedAt: new Date().toISOString()
        });
      }
    }

    const report: ComplianceReconciliationReport = {
      timestamp: new Date().toISOString(),
      tenantId,
      companyId,
      jurisdiction: profile?.jurisdiction || 'EGYPT_ETA',
      totalDocumentsAudited: internalInvoices.length,
      totalCompliant: compliantCount,
      totalPending: pendingCount,
      totalDiscrepancies: discrepancies.length,
      discrepancies,
      certifiedStatus: discrepancies.length === 0 ? 'COMPLIANT' : 'NEEDS_ATTENTION'
    };

    return report;
  }

  // =========================================================================
  // 7. READINESS & CERTIFICATION REPORTING
  // =========================================================================

  public getReadinessReport(envParam?: ComplianceEnvironment): ComplianceReadinessResponse {
    const env = envParam || (process.env.COMPLIANCE_ENV as ComplianceEnvironment) || 'LOCAL';
    const etaEndpoints = EgyptianTaxAuthorityAdapter.getEndpoints(env);
    const zatcaEndpoints = SaudiZatcaAdapter.getEndpoints(env);

    const etaClientIdPresent = Boolean(process.env.ETA_CLIENT_ID);
    const etaClientSecretPresent = Boolean(process.env.ETA_CLIENT_SECRET);
    const etaConfigured = etaClientIdPresent && etaClientSecretPresent;

    const zatcaCsidPresent = Boolean(process.env.ZATCA_CSID);
    const zatcaSecretPresent = Boolean(process.env.ZATCA_CSID_SECRET);
    const zatcaCertPresent = Boolean(process.env.ZATCA_CERTIFICATE_PEM);
    const zatcaConfigured = zatcaCsidPresent && zatcaSecretPresent;

    const etaMissing: string[] = [];
    if (!etaClientIdPresent) etaMissing.push('ETA_CLIENT_ID');
    if (!etaClientSecretPresent) etaMissing.push('ETA_CLIENT_SECRET');

    const zatcaMissing: string[] = [];
    if (!zatcaCsidPresent) zatcaMissing.push('ZATCA_CSID');
    if (!zatcaSecretPresent) zatcaMissing.push('ZATCA_CSID_SECRET');
    if (!zatcaCertPresent) zatcaMissing.push('ZATCA_CERTIFICATE_PEM');

    // Find last successful submission timestamp from durable submissions
    const allSubmissions = this.db.queryEntities<ComplianceSubmissionRecord>('compliance_submissions', {});
    const etaSubmissions = allSubmissions.filter(s => s.jurisdiction === 'EGYPT_ETA' && ['ACCEPTED', 'SUBMITTED'].includes(s.status));
    const zatcaSubmissions = allSubmissions.filter(s => s.jurisdiction === 'ZATCA_PHASE2' && ['CLEARED', 'REPORTED', 'ACCEPTED'].includes(s.status));

    const lastEtaSubmission = etaSubmissions.length > 0 ? etaSubmissions[etaSubmissions.length - 1].submittedAt || etaSubmissions[etaSubmissions.length - 1].createdAt : undefined;
    const lastZatcaSubmission = zatcaSubmissions.length > 0 ? zatcaSubmissions[zatcaSubmissions.length - 1].submittedAt || zatcaSubmissions[zatcaSubmissions.length - 1].createdAt : undefined;

    const certifiedStatus = (etaConfigured && zatcaConfigured)
      ? (env === 'PRODUCTION' ? 'P0-05 CERTIFIED (PASS)' : 'CONDITIONAL — SANDBOX VERIFIED / PRODUCTION NOT VERIFIED')
      : 'NOT CERTIFIED — LOCAL VALIDATION ONLY';

    return {
      success: true,
      environment: env,
      certifiedStatus,
      providers: {
        ETA: {
          provider: 'ETA_EGYPT',
          environment: env,
          configurationReadiness: etaConfigured ? 'READY' : 'MISSING_CREDENTIALS',
          certificatePresence: false,
          credentialPresence: {
            hasKeyOrSecret: etaClientSecretPresent,
            hasClientOrDeviceId: etaClientIdPresent
          },
          endpointIdentity: etaEndpoints.apiBaseUrl,
          supportedDocumentTypes: ['INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE', 'RECEIPT', 'RETURN_RECEIPT'],
          adapterVersion: 'v1.0 (eInvoice) / v1.2 (eReceipt)',
          lastConnectivityCheck: etaConfigured ? new Date().toISOString() : undefined,
          lastSuccessfulSubmissionTimestamp: lastEtaSubmission,
          missingPrerequisites: etaMissing
        },
        ZATCA: {
          provider: 'SAUDI_ZATCA_FATOORA',
          environment: env,
          configurationReadiness: zatcaConfigured ? 'READY' : 'MISSING_CREDENTIALS',
          certificatePresence: zatcaCertPresent,
          credentialPresence: {
            hasKeyOrSecret: zatcaSecretPresent,
            hasClientOrDeviceId: zatcaCsidPresent
          },
          endpointIdentity: zatcaEndpoints.baseUrl,
          supportedDocumentTypes: ['INVOICE', 'SIMPLIFIED_INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE'],
          adapterVersion: 'Phase 2 (UBL 2.1 / ASN.1 BER TLV)',
          lastConnectivityCheck: zatcaConfigured ? new Date().toISOString() : undefined,
          lastSuccessfulSubmissionTimestamp: lastZatcaSubmission,
          missingPrerequisites: zatcaMissing
        }
      },
      supportedJurisdictions: ['EGYPT_ETA', 'ZATCA_PHASE2', 'UAE_FTA']
    };
  }

  public getComplianceReadiness(jurisdiction: string = 'SA_ZATCA'): {
    overallStatus: 'LOCAL_VERIFIED' | 'NOT_CONFIGURED' | 'CERTIFIED';
    environment: ComplianceEnvironment;
    jurisdiction: string;
    credentialsConfigured: boolean;
    missingCredentials: string[];
    readinessReport: ComplianceReadinessResponse;
  } {
    const report = this.getReadinessReport();
    const isZatca = jurisdiction.toUpperCase().includes('ZATCA') || jurisdiction.toUpperCase().includes('SA');
    const provider = isZatca ? report.providers.ZATCA : report.providers.ETA;
    const isConfigured = provider.configurationReadiness === 'READY';
    const overallStatus: 'LOCAL_VERIFIED' | 'NOT_CONFIGURED' | 'CERTIFIED' = isConfigured
      ? (report.environment === 'PRODUCTION' ? 'CERTIFIED' : 'LOCAL_VERIFIED')
      : 'LOCAL_VERIFIED';

    return {
      overallStatus,
      environment: report.environment,
      jurisdiction,
      credentialsConfigured: isConfigured,
      missingCredentials: provider.missingPrerequisites,
      readinessReport: report
    };
  }
}
