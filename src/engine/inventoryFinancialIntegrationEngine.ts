/**
 * Enterprise Inventory Financial Integration Engine (Phase 2.2.4 Hardened)
 * 
 * Strict Domain Isolation & Enterprise Quality Board Compliance:
 * Inventory remains a pure operational domain. Inventory MUST NEVER:
 * - Create Journal Entries directly
 * - Access General Ledger directly
 * - Know Chart of Accounts / Debit / Credit
 * - Update Trial Balance, Balance Sheet, or P&L
 * 
 * Hardening Specs:
 * 1. Financial Event Queue Hardening (Retries, Delays, DLQ, Queue Locking, Queue Timeouts)
 * 2. Idempotency Protection (Idempotency Key verification; returns existing result safely)
 * 3. Duplicate Processing Protection (Concurrency guards, Double-click protection, Lock checks)
 * 4. Event Versioning (eventVersion, schemaVersion, eventTypeVersion)
 * 5. Correlation ID (End-to-end tracing across Inventory -> Event -> Profile -> GL -> Audit)
 * 6. Audit Verification (Comprehensive immutable audit logging)
 */

import {
  InventoryBusinessEventType,
  FinancialEventType,
  InventoryFinancialEventMapRule,
  PostingProfile,
  JournalTemplate,
  InventoryFinancialEventPayload,
  InventoryFinancialQueueItem,
  InventoryFinancialAuditRecord,
  FinancialQueueStatus,
  Account,
  JournalEntry,
  PostingRule,
  InventoryItem,
  Warehouse,
  ValidationResult
} from '../types';
import { FinancialEventEngine } from './financialEventEngine';

export interface FinancialIntegrationContext {
  tenantId: string;
  companyId: string;
  userId: string;
  userName: string;
  mappingRules: InventoryFinancialEventMapRule[];
  postingProfiles: PostingProfile[];
  journalTemplates: JournalTemplate[];
  accounts: Account[];
  postingRules: PostingRule[];
  inventoryItems: InventoryItem[];
  warehouses: Warehouse[];
  financialQueue: InventoryFinancialQueueItem[];
  journalEntries: JournalEntry[];
  financialEvents: any[];
  auditRecords: InventoryFinancialAuditRecord[];
}

export class InventoryFinancialIntegrationEngine {
  /**
   * Helper: Generate unique Correlation ID if missing
   */
  static generateCorrelationId(sourceDocNo?: string): string {
    const timestamp = Date.now();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const docClean = sourceDocNo ? sourceDocNo.replace(/[^a-zA-Z0-9-]/g, '') : 'DOC';
    return `CORR-${docClean}-${timestamp}-${rand}`;
  }

  /**
   * Helper: Generate unique Idempotency Key if missing
   */
  static generateIdempotencyKey(payload: Partial<InventoryFinancialEventPayload>): string {
    const docNum = payload.sourceDocumentNumber || 'DOC';
    const bizEvt = payload.businessEvent || 'EVT';
    const sku = payload.itemSku || 'SKU';
    const qty = payload.quantity || 0;
    const cost = payload.totalCost || 0;
    return `IDEMP-${docNum}-${bizEvt}-${sku}-${qty}-${cost}`;
  }

  /**
   * 1. Financial Event Mapping Engine:
   * Resolves Business Event -> Financial Event configuration mapping.
   */
  static mapBusinessEventToFinancial(
    businessEventType: InventoryBusinessEventType,
    mappingRules: InventoryFinancialEventMapRule[]
  ): FinancialEventType | null {
    const rule = mappingRules.find(r => r.businessEventType === businessEventType && r.active);
    if (rule) {
      return rule.financialEventType;
    }

    const defaultMap: Record<InventoryBusinessEventType, FinancialEventType> = {
      EVT_GOODS_RECEIPT: 'GOODS_RECEIPT',
      EVT_GOODS_ISSUE: 'GOODS_ISSUE',
      EVT_ADJUSTMENT_PLUS: 'INVENTORY_ADJUSTMENT',
      EVT_ADJUSTMENT_MINUS: 'INVENTORY_ADJUSTMENT',
      EVT_OPENING_STOCK: 'OPENING_BALANCE',
      EVT_TRANSFER: 'INVENTORY_TRANSFER',
      EVT_RETURN_IN: 'GOODS_RECEIPT',
      EVT_RETURN_OUT: 'GOODS_ISSUE'
    };

    return defaultMap[businessEventType] || null;
  }

  /**
   * 2. Posting Profile Engine:
   * Resolves specific Posting Profile matching Company, Branch, Category, Event Type.
   */
  static resolvePostingProfile(
    companyId: string,
    branchId: string,
    categoryId: string,
    businessEventType: InventoryBusinessEventType,
    financialEventType: FinancialEventType,
    profiles: PostingProfile[]
  ): PostingProfile | null {
    const activeProfiles = profiles.filter(
      p => p.active && 
      p.businessEventType === businessEventType && 
      p.financialEventType === financialEventType
    );

    if (activeProfiles.length === 0) return null;

    // 1. Exact match (Company, Branch, Category)
    const exact = activeProfiles.find(
      p => p.companyId === companyId && p.branchId === branchId && p.inventoryCategoryId === categoryId
    );
    if (exact) return exact;

    // 2. Company + Branch match (Wildcard Category)
    const compBranch = activeProfiles.find(
      p => p.companyId === companyId && p.branchId === branchId && p.inventoryCategoryId === '*'
    );
    if (compBranch) return compBranch;

    // 3. Company match (Wildcard Branch & Category)
    const compOnly = activeProfiles.find(
      p => p.companyId === companyId && (p.branchId === '*' || p.branchId === branchId) && (p.inventoryCategoryId === '*' || p.inventoryCategoryId === categoryId)
    );
    if (compOnly) return compOnly;

    // 4. Global Wildcard
    const globalWildcard = activeProfiles.find(
      p => p.companyId === '*' && p.branchId === '*' && p.inventoryCategoryId === '*'
    );
    return globalWildcard || activeProfiles[0];
  }

  /**
   * 3. Journal Template Registry:
   * Resolves Journal Template by ID or Category.
   */
  static resolveJournalTemplate(
    templateId: string,
    templates: JournalTemplate[]
  ): JournalTemplate | null {
    const tmpl = templates.find(t => t.id === templateId && t.active);
    return tmpl || null;
  }

  /**
   * 6. Validation Rules Engine:
   * Validates payload before queueing/processing.
   */
  static validatePayload(
    payload: InventoryFinancialEventPayload,
    context: FinancialIntegrationContext
  ): ValidationResult {
    const errors: { field?: string; message: string; severity: 'ERROR' | 'WARNING' }[] = [];

    // Rule 1: Financial Event Mapping
    const mappedEvent = this.mapBusinessEventToFinancial(payload.businessEvent, context.mappingRules);
    if (!mappedEvent) {
      errors.push({ field: 'businessEvent', message: `No active financial mapping rule for Business Event [${payload.businessEvent}]`, severity: 'ERROR' });
    }

    // Rule 2: Currency
    if (!payload.currency || payload.currency.trim().length === 0) {
      errors.push({ field: 'currency', message: 'Currency code is required for financial event integration', severity: 'ERROR' });
    }

    // Rule 3: Quantity & Cost Validation
    if (payload.quantity <= 0) {
      errors.push({ field: 'quantity', message: `Quantity must be greater than 0 (Got ${payload.quantity})`, severity: 'ERROR' });
    }
    if (payload.totalCost < 0) {
      errors.push({ field: 'totalCost', message: `Total cost cannot be negative (Got ${payload.totalCost})`, severity: 'ERROR' });
    }

    // Rule 4: Warehouse Verification
    if (payload.warehouseId) {
      const whExists = context.warehouses.some(w => w.id === payload.warehouseId || w.code === payload.warehouseId);
      if (!whExists && context.warehouses.length > 0) {
        errors.push({ field: 'warehouseId', message: `Warehouse [${payload.warehouseId}] does not exist in master registry`, severity: 'WARNING' });
      }
    }

    // Rule 5: Item Master Verification
    if (payload.itemSku) {
      const itemExists = context.inventoryItems.some(i => i.sku === payload.itemSku || i.id === payload.itemId);
      if (!itemExists && context.inventoryItems.length > 0) {
        errors.push({ field: 'itemSku', message: `Item SKU [${payload.itemSku}] not found in Inventory Item Master`, severity: 'WARNING' });
      }
    }

    // Rule 6: Source Reference Document
    if (!payload.sourceDocumentNumber || !payload.sourceDocumentType) {
      errors.push({ field: 'sourceDocumentNumber', message: 'Source Document Type and Number are mandatory for financial auditability', severity: 'ERROR' });
    }

    return {
      isValid: errors.filter(e => e.severity === 'ERROR').length === 0,
      errors
    };
  }

  /**
   * Idempotency Check:
   * Finds existing queue item matching idempotency key or event ID.
   */
  static findExistingByKey(
    idempotencyKey: string,
    eventId: string,
    queue: InventoryFinancialQueueItem[]
  ): InventoryFinancialQueueItem | null {
    if (idempotencyKey) {
      const byKey = queue.find(q => q.idempotencyKey === idempotencyKey);
      if (byKey) return byKey;
    }
    if (eventId) {
      const byEvt = queue.find(q => q.eventId === eventId);
      if (byEvt) return byEvt;
    }
    return null;
  }

  /**
   * Enqueue & Process Event Payload (With Idempotency & Queue Hardening)
   */
  static enqueueEvent(
    rawPayload: Partial<InventoryFinancialEventPayload>,
    context: FinancialIntegrationContext
  ): { queueItem: InventoryFinancialQueueItem; validation: ValidationResult; isDuplicate: boolean } {
    // 1. Ensure Event Metadata, Correlation ID, Idempotency Key, Versioning
    const eventId = rawPayload.eventId || `fev-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const correlationId = rawPayload.correlationId || this.generateCorrelationId(rawPayload.sourceDocumentNumber);
    const idempotencyKey = rawPayload.idempotencyKey || this.generateIdempotencyKey(rawPayload);
    const eventVersion = rawPayload.eventVersion || '1.0';
    const schemaVersion = rawPayload.schemaVersion || 'v1.0';
    const eventTypeVersion = rawPayload.eventTypeVersion || 'v1.0';

    // 2. IDEMPOTENCY CHECK: Reject duplicate creation / return existing safely
    const existingQueueItem = this.findExistingByKey(idempotencyKey, eventId, context.financialQueue);
    if (existingQueueItem) {
      // Record Idempotency Hit Audit
      context.auditRecords.unshift({
        id: `faudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenantId: existingQueueItem.tenantId,
        eventId: existingQueueItem.eventId,
        correlationId: existingQueueItem.correlationId,
        idempotencyKey: existingQueueItem.idempotencyKey,
        eventVersion: existingQueueItem.payload.eventVersion,
        queueItemId: existingQueueItem.id,
        businessEventType: existingQueueItem.payload.businessEvent,
        financialEventType: existingQueueItem.payload.financialEventType,
        sourceDocumentNumber: existingQueueItem.payload.sourceDocumentNumber,
        status: existingQueueItem.status,
        actionTaken: 'IDEMPOTENCY_INTERCEPT',
        performedBy: rawPayload.createdBy || context.userName,
        timestamp: new Date().toISOString(),
        details: `Duplicate event request intercepted by Idempotency Key [${idempotencyKey}]. Returning existing queue item ${existingQueueItem.id} safely.`
      });

      return {
        queueItem: existingQueueItem,
        validation: { isValid: true, errors: [] },
        isDuplicate: true
      };
    }

    // Construct Normalized Complete Payload
    const payload: InventoryFinancialEventPayload = {
      eventId,
      correlationId,
      idempotencyKey,
      eventVersion,
      schemaVersion,
      eventTypeVersion,
      tenantId: rawPayload.tenantId || context.tenantId || 'ten-001',
      companyId: rawPayload.companyId || context.companyId || 'comp-001',
      branchId: rawPayload.branchId || 'br-001',
      warehouseId: rawPayload.warehouseId || 'wh-001',
      itemId: rawPayload.itemId || 'item-01',
      itemSku: rawPayload.itemSku || 'HW-SRV-01',
      quantity: rawPayload.quantity || 1,
      unitCost: rawPayload.unitCost || 0,
      totalCost: rawPayload.totalCost || 0,
      currency: rawPayload.currency || 'SAR',
      businessEvent: rawPayload.businessEvent || 'EVT_GOODS_RECEIPT',
      financialEventType: rawPayload.financialEventType || 'GOODS_RECEIPT',
      sourceDocumentType: rawPayload.sourceDocumentType || 'GoodsReceiptNote',
      sourceDocumentId: rawPayload.sourceDocumentId || `doc-${Date.now()}`,
      sourceDocumentNumber: rawPayload.sourceDocumentNumber || `GRN-${Date.now()}`,
      createdBy: rawPayload.createdBy || context.userName,
      createdAt: rawPayload.createdAt || new Date().toISOString(),
      auditMetadata: {
        ...(rawPayload.auditMetadata || {}),
        correlationId,
        idempotencyKey,
        eventVersion
      }
    };

    // 3. Validation
    const validation = this.validatePayload(payload, context);

    // Resolve Mappings
    const mappedFinancialEvent = this.mapBusinessEventToFinancial(payload.businessEvent, context.mappingRules) || 'GOODS_RECEIPT';
    payload.financialEventType = mappedFinancialEvent;

    const item = context.inventoryItems.find(i => i.sku === payload.itemSku || i.id === payload.itemId);
    const categoryId = item?.categoryId || '*';

    const postingProfile = this.resolvePostingProfile(
      payload.companyId,
      payload.branchId,
      categoryId,
      payload.businessEvent,
      mappedFinancialEvent,
      context.postingProfiles
    );

    if (postingProfile) {
      payload.postingProfileId = postingProfile.id;
      payload.journalTemplateId = postingProfile.journalTemplateId;
    }

    const journalTemplate = postingProfile 
      ? this.resolveJournalTemplate(postingProfile.journalTemplateId, context.journalTemplates)
      : null;

    const initialStatus: FinancialQueueStatus = validation.isValid ? 'Pending' : 'Failed';

    const queueItem: InventoryFinancialQueueItem = {
      id: `fq-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      tenantId: payload.tenantId,
      companyId: payload.companyId,
      eventId: payload.eventId,
      correlationId: payload.correlationId,
      idempotencyKey: payload.idempotencyKey,
      payload,
      postingProfile: postingProfile || undefined,
      journalTemplate: journalTemplate || undefined,
      status: initialStatus,
      retryCount: 0,
      maxRetries: 3,
      retryDelayMs: 1000,
      isLocked: false,
      isDeadLetter: false,
      failureReason: validation.isValid ? undefined : validation.errors.map(e => e.message).join('; '),
      queuedAt: new Date().toISOString(),
      auditHistory: [
        {
          id: `audit-${Date.now()}-1`,
          timestamp: new Date().toISOString(),
          action: 'EVENT_QUEUED',
          user: payload.createdBy || context.userName,
          details: `Enqueued inventory business event [${payload.businessEvent}] for doc ${payload.sourceDocumentNumber} (CorrID: ${correlationId}, IdempKey: ${idempotencyKey}, Version: ${eventVersion})`
        }
      ]
    };

    context.financialQueue.unshift(queueItem);

    // Record Immutable Integration Audit
    context.auditRecords.unshift({
      id: `faudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: payload.tenantId,
      eventId: payload.eventId,
      correlationId: payload.correlationId,
      idempotencyKey: payload.idempotencyKey,
      eventVersion: payload.eventVersion,
      queueItemId: queueItem.id,
      businessEventType: payload.businessEvent,
      financialEventType: mappedFinancialEvent,
      sourceDocumentNumber: payload.sourceDocumentNumber,
      status: queueItem.status,
      actionTaken: 'ENQUEUE',
      performedBy: payload.createdBy || context.userName,
      timestamp: new Date().toISOString(),
      details: `Financial Queue Item ${queueItem.id} created. Status: ${queueItem.status}. CorrelationId: ${correlationId}`
    });

    // Auto-Process if Behavior is AUTO_POST and valid
    if (validation.isValid && postingProfile?.postingBehavior === 'AUTO_POST') {
      this.processQueueItem(queueItem.id, context);
    }

    return { queueItem, validation, isDuplicate: false };
  }

  /**
   * Execute Queue Item Processing (With Concurrency Locking, Timeout, and DLQ handling)
   */
  static processQueueItem(
    queueItemId: string,
    context: FinancialIntegrationContext
  ): { success: boolean; journalEntry?: JournalEntry; error?: string } {
    const queueItem = context.financialQueue.find(q => q.id === queueItemId);
    if (!queueItem) {
      return { success: false, error: 'Queue item not found' };
    }

    // 1. DUPLICATE & COMPLETED PROTECTION
    if (queueItem.status === 'Completed') {
      return { success: true, error: 'Queue item already completed' };
    }

    // 2. QUEUE LOCKING & CONCURRENCY PROTECTION
    const now = new Date();
    if (queueItem.isLocked) {
      // Check Queue Timeout (Unlock after 30 seconds if stuck)
      const lockTime = queueItem.lockedAt ? new Date(queueItem.lockedAt).getTime() : 0;
      if (now.getTime() - lockTime > 30000) {
        queueItem.isLocked = false;
        queueItem.auditHistory.push({
          id: `audit-${Date.now()}-timeout`,
          timestamp: now.toISOString(),
          action: 'LOCK_TIMEOUT_RELEASED',
          user: context.userName,
          details: 'Stale processing lock released after 30 second timeout threshold.'
        });
      } else {
        return { success: false, error: `Queue item ${queueItemId} is locked by another active process (${queueItem.lockedBy})` };
      }
    }

    // Acquire Lock
    queueItem.isLocked = true;
    queueItem.lockedAt = now.toISOString();
    queueItem.lockedBy = context.userName;
    queueItem.status = 'Processing';

    queueItem.auditHistory.push({
      id: `audit-${Date.now()}-proc`,
      timestamp: now.toISOString(),
      action: 'PROCESSING_STARTED',
      user: context.userName,
      details: `Started financial event processing. CorrelationId: ${queueItem.correlationId}`
    });

    try {
      const { payload, journalTemplate } = queueItem;

      if (!journalTemplate) {
        throw new Error('No active Journal Template resolved for posting profile');
      }

      // Execute via core Financial Event Engine
      const generateDocNumFn = (tId: string, entity: string) => `${entity}-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const recordAuditFn = () => {};

      const result = FinancialEventEngine.processEvent(
        {
          tenantId: payload.tenantId,
          companyId: payload.companyId,
          eventType: payload.financialEventType,
          sourceDocumentType: payload.sourceDocumentType,
          sourceDocumentId: payload.sourceDocumentId,
          sourceDocumentNumber: payload.sourceDocumentNumber,
          amount: payload.totalCost,
          currency: payload.currency,
          description: `[CorrID: ${payload.correlationId}] Inventory Financial Posting for ${payload.businessEvent} (${payload.itemSku} x ${payload.quantity} @ ${payload.unitCost})`,
          dimensions: {
            branchId: payload.branchId,
            warehouseId: payload.warehouseId
          },
          triggeredBy: payload.createdBy || context.userId,
          triggeredByName: context.userName
        },
        context.postingRules,
        context.accounts,
        context.journalEntries,
        context.financialEvents,
        generateDocNumFn,
        recordAuditFn
      );

      if (result.journalEntry) {
        queueItem.status = 'Completed';
        queueItem.journalEntryId = result.journalEntry.id;
        queueItem.processedAt = new Date().toISOString();
        queueItem.isLocked = false; // Release lock

        queueItem.auditHistory.push({
          id: `audit-${Date.now()}-comp`,
          timestamp: new Date().toISOString(),
          action: 'POSTING_COMPLETED',
          user: context.userName,
          details: `Successfully generated GL Journal Entry ${result.journalEntry.entryNumber} (CorrID: ${queueItem.correlationId})`
        });

        context.auditRecords.unshift({
          id: `faudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tenantId: payload.tenantId,
          eventId: payload.eventId,
          correlationId: queueItem.correlationId,
          idempotencyKey: queueItem.idempotencyKey,
          eventVersion: payload.eventVersion,
          queueItemId: queueItem.id,
          businessEventType: payload.businessEvent,
          financialEventType: payload.financialEventType,
          sourceDocumentNumber: payload.sourceDocumentNumber,
          status: 'Completed',
          actionTaken: 'GL_POSTED',
          performedBy: context.userName,
          timestamp: new Date().toISOString(),
          details: `GL Journal Entry ${result.journalEntry.entryNumber} posted. CorrelationId: ${queueItem.correlationId}`
        });

        return { success: true, journalEntry: result.journalEntry };
      } else {
        throw new Error('Financial Event Engine failed to generate balanced journal entry');
      }
    } catch (err: any) {
      queueItem.retryCount += 1;
      queueItem.isLocked = false; // Release lock

      // Check Dead Letter Queue (DLQ) threshold
      if (queueItem.retryCount >= queueItem.maxRetries) {
        queueItem.status = 'DeadLetter';
        queueItem.isDeadLetter = true;
        queueItem.failureReason = `DLQ EXCEEDED MAX RETRIES (${queueItem.retryCount}/${queueItem.maxRetries}): ${err.message}`;

        queueItem.auditHistory.push({
          id: `audit-${Date.now()}-dlq`,
          timestamp: new Date().toISOString(),
          action: 'DEAD_LETTER_QUEUED',
          user: context.userName,
          details: `Moved item to Dead Letter Queue (DLQ). Exceeded max retry threshold of ${queueItem.maxRetries}. Error: ${err.message}`
        });

        context.auditRecords.unshift({
          id: `faudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tenantId: queueItem.tenantId,
          eventId: queueItem.eventId,
          correlationId: queueItem.correlationId,
          idempotencyKey: queueItem.idempotencyKey,
          eventVersion: queueItem.payload.eventVersion,
          queueItemId: queueItem.id,
          businessEventType: queueItem.payload.businessEvent,
          financialEventType: queueItem.payload.financialEventType,
          sourceDocumentNumber: queueItem.payload.sourceDocumentNumber,
          status: 'DeadLetter',
          actionTaken: 'MOVED_TO_DLQ',
          performedBy: context.userName,
          timestamp: new Date().toISOString(),
          details: `Queue Item ${queueItem.id} moved to Dead Letter Queue after ${queueItem.retryCount} failed attempts.`
        });
      } else {
        queueItem.status = 'Failed';
        queueItem.failureReason = err.message || 'Processing failed';
        queueItem.retryDelayMs = Math.min(queueItem.retryDelayMs * 2, 60000); // Exponential backoff
        queueItem.nextRetryAt = new Date(Date.now() + queueItem.retryDelayMs).toISOString();

        queueItem.auditHistory.push({
          id: `audit-${Date.now()}-fail`,
          timestamp: new Date().toISOString(),
          action: 'PROCESSING_FAILED',
          user: context.userName,
          details: `Processing failed (Attempt ${queueItem.retryCount}/${queueItem.maxRetries}). Next retry in ${queueItem.retryDelayMs}ms. Error: ${err.message}`
        });

        context.auditRecords.unshift({
          id: `faudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tenantId: queueItem.tenantId,
          eventId: queueItem.eventId,
          correlationId: queueItem.correlationId,
          idempotencyKey: queueItem.idempotencyKey,
          eventVersion: queueItem.payload.eventVersion,
          queueItemId: queueItem.id,
          businessEventType: queueItem.payload.businessEvent,
          financialEventType: queueItem.payload.financialEventType,
          sourceDocumentNumber: queueItem.payload.sourceDocumentNumber,
          status: 'Failed',
          actionTaken: 'PROCESSING_FAILED',
          performedBy: context.userName,
          timestamp: new Date().toISOString(),
          details: `Queue Item ${queueItem.id} failed attempt ${queueItem.retryCount}/${queueItem.maxRetries}: ${err.message}`
        });
      }

      return { success: false, error: err.message };
    }
  }

  /**
   * Retry Failed or DeadLetter Queue Item
   */
  static retryQueueItem(
    queueItemId: string,
    context: FinancialIntegrationContext
  ): { success: boolean; journalEntry?: JournalEntry; error?: string } {
    const queueItem = context.financialQueue.find(q => q.id === queueItemId);
    if (!queueItem) return { success: false, error: 'Queue item not found' };

    if (queueItem.status === 'Completed') {
      return { success: true, error: 'Queue item already completed' };
    }

    // Unlock and reset DLQ state for manual retry
    queueItem.isLocked = false;
    queueItem.isDeadLetter = false;
    queueItem.status = 'Retry';

    queueItem.auditHistory.push({
      id: `audit-${Date.now()}-retry`,
      timestamp: new Date().toISOString(),
      action: 'RETRY_INITIATED',
      user: context.userName,
      details: `Manual administrative retry initiated (Attempt ${queueItem.retryCount + 1}). CorrID: ${queueItem.correlationId}`
    });

    return this.processQueueItem(queueItemId, context);
  }
}
