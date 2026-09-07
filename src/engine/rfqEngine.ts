/**
 * AM Enterprise ERP - RFQ Domain Engine (Phase 3.2B-02)
 * Enterprise Standard Aligned with SAP S/4HANA Sourcing & Oracle ERP Cloud SCM
 */

import {
  RequestForQuotation,
  RFQLine,
  RFQStatus,
  PurchaseRequisition,
  PurchaseAuditRecord,
  UserRole
} from '../types/procurement';
import { MasterDataService } from './masterDataService';
import { WorkflowEngine } from './workflowEngine';

export interface RFQUserContext {
  userId: string;
  userName: string;
  userRole?: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
}

export class RFQEngine {
  /**
   * Validate and snapshot an RFQ line using authoritative Master Data
   */
  static validateAndSnapshotLine(
    rawLine: Partial<RFQLine>,
    tenantId: string,
    companyId: string,
    index: number = 0
  ): { success: boolean; line?: RFQLine; error?: string } {
    const qty = Number(rawLine.targetQuantity !== undefined ? rawLine.targetQuantity : rawLine.requestedQty);
    if (!qty || isNaN(qty) || qty <= 0) {
      return { success: false, error: `Line ${index + 1}: Target quantity must be greater than zero.` };
    }

    const itemSku = rawLine.itemSku || rawLine.productId;
    if (!itemSku && !rawLine.productId) {
      return { success: false, error: `Line ${index + 1}: Product identifier or SKU is required.` };
    }

    // 1. Authoritative Product Master Lookup
    const products = MasterDataService.getProducts(tenantId);
    let matchedProduct = products.find(p => p.id === rawLine.productId || p.sku.toLowerCase() === itemSku?.toLowerCase());
    if (!matchedProduct && rawLine.productId) {
      matchedProduct = MasterDataService.getProductById(rawLine.productId, tenantId);
    }

    if (!matchedProduct) {
      return { success: false, error: `Line ${index + 1}: Product '${itemSku || rawLine.productId}' not found in authoritative Master Data catalog.` };
    }

    if (matchedProduct.active === false) {
      return { success: false, error: `Line ${index + 1}: Product '${matchedProduct.name}' (${matchedProduct.sku}) is currently INACTIVE.` };
    }

    // 2. Variant validation if specified
    let matchedVariantId = rawLine.variantId;
    let matchedVariantSku = rawLine.variantSku;
    if (rawLine.variantId || rawLine.variantSku) {
      const variant = matchedProduct.variants?.find(
        v => (rawLine.variantId && v.id === rawLine.variantId) || (rawLine.variantSku && v.sku === rawLine.variantSku)
      );
      if (variant) {
        if (!variant.active) {
          return { success: false, error: `Line ${index + 1}: Variant '${variant.sku}' is inactive in Master Data.` };
        }
        matchedVariantId = variant.id;
        matchedVariantSku = variant.sku;
      }
    }

    // 3. UOM Validation & Snapshotting
    const baseUOM = matchedProduct.baseUom || 'PCS';
    const targetUOM = (rawLine.targetUOM || rawLine.uom || baseUOM).toUpperCase();

    const tenantUOMs = MasterDataService.getUOMs(tenantId);
    const resolvedUOM = tenantUOMs.find(u => u.code.toUpperCase() === targetUOM);
    if (!resolvedUOM) {
      return { success: false, error: `Line ${index + 1}: Target UOM '${targetUOM}' is not recognized in tenant UOM registry.` };
    }
    if (!resolvedUOM.active) {
      return { success: false, error: `Line ${index + 1}: Target UOM '${targetUOM}' is inactive.` };
    }

    let baseQuantity = qty;
    let uomConversionFactor = 1;

    try {
      const convResult = MasterDataService.convertQuantity(
        targetUOM,
        baseUOM,
        qty,
        tenantId,
        matchedProduct.sku
      );
      baseQuantity = convResult.convertedQuantity;
      uomConversionFactor = convResult.factorUsed;
    } catch (err: any) {
      return { success: false, error: `Line ${index + 1}: UOM conversion error: ${err.message || err}` };
    }

    // 4. Tax Category Resolution
    let taxCategoryId = rawLine.taxCategoryId || matchedProduct.taxCategoryId;
    let taxCategoryCode = rawLine.taxCategoryCode;
    if (taxCategoryId) {
      const taxCats = MasterDataService.getTaxCategories(tenantId);
      const taxCat = taxCats.find(t => t.id === taxCategoryId);
      if (taxCat) {
        taxCategoryCode = taxCat.code;
      }
    }

    const lineId = rawLine.id || `rfq-line-${Date.now()}-${index}`;

    const snapshottedLine: RFQLine = {
      id: lineId,
      rfqId: rawLine.rfqId || '',
      lineIndex: index + 1,
      prId: rawLine.prId,
      prLineId: rawLine.prLineId || rawLine.prItemId,
      prItemId: rawLine.prItemId || rawLine.prLineId,
      productId: matchedProduct.id,
      variantId: matchedVariantId,
      variantSku: matchedVariantSku,
      itemSku: matchedProduct.sku,
      itemName: matchedProduct.name,
      itemNameAr: matchedProduct.nameAr || matchedProduct.name,
      description: rawLine.description || matchedProduct.description,
      categoryId: matchedProduct.categoryId,
      targetQuantity: qty,
      requestedQty: qty,
      targetUOM,
      uom: targetUOM,
      baseQuantity,
      baseUOM,
      uomConversionFactor,
      targetUnitPrice: rawLine.targetUnitPrice || 0,
      taxCategoryId,
      taxCategoryCode,
      warehouseId: rawLine.warehouseId || 'wh-001',
      warehouseName: rawLine.warehouseName || 'Main Logistics Hub',
      departmentId: rawLine.departmentId,
      costCenterId: rawLine.costCenterId,
      projectId: rawLine.projectId,
      requiredDate: rawLine.requiredDate || rawLine.targetDeliveryDate || new Date(Date.now() + 14 * 86400000).toISOString(),
      targetDeliveryDate: rawLine.targetDeliveryDate || rawLine.requiredDate || new Date(Date.now() + 14 * 86400000).toISOString(),
      specifications: rawLine.specifications || '',
      status: rawLine.status || 'OPEN',
      awardedQuantity: 0,
      remainingQuantity: qty
    };

    return { success: true, line: snapshottedLine };
  }

  /**
   * Create RFQ directly in DRAFT status
   */
  static createRFQ(
    data: Partial<RequestForQuotation>,
    lines: Partial<RFQLine>[],
    rfqs: RequestForQuotation[],
    auditLogs: PurchaseAuditRecord[],
    context: RFQUserContext
  ): { success: boolean; rfq?: RequestForQuotation; error?: string } {
    if (!data.title || data.title.trim() === '') {
      return { success: false, error: 'RFQ Title is mandatory.' };
    }

    if (!lines || lines.length === 0) {
      return { success: false, error: 'RFQ must contain at least one line item.' };
    }

    const tenantId = context.tenantId || data.tenantId || 'ten-001';
    const companyId = context.companyId || data.companyId || 'comp-001';

    const processedLines: RFQLine[] = [];
    for (let i = 0; i < lines.length; i++) {
      const lineRes = this.validateAndSnapshotLine(lines[i], tenantId, companyId, i);
      if (!lineRes.success || !lineRes.line) {
        return { success: false, error: lineRes.error };
      }
      processedLines.push(lineRes.line);
    }

    const count = rfqs.length + 1;
    const rfqNumber = data.rfqNumber || `RFQ-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;
    const rfqId = `rfq-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    processedLines.forEach(l => {
      l.rfqId = rfqId;
    });

    const newRfq: RequestForQuotation = {
      id: rfqId,
      tenantId,
      companyId,
      branchId: context.branchId || data.branchId || 'br-001',
      rfqNumber,
      title: data.title,
      prId: data.prId,
      prNumber: data.prNumber,
      departmentId: data.departmentId,
      departmentName: data.departmentName || 'Procurement & Strategic Sourcing',
      buyerId: context.userId,
      buyerName: context.userName,
      currency: data.currency || 'SAR',
      issuedDate: new Date().toISOString(),
      closingDate: data.closingDate || new Date(Date.now() + 14 * 86400000).toISOString(),
      targetDeliveryDate: data.targetDeliveryDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      paymentTermsId: data.paymentTermsId,
      paymentTermsName: data.paymentTermsName,
      incotermsId: data.incotermsId,
      incotermsCode: data.incotermsCode,
      status: 'DRAFT',
      buyersNotes: data.buyersNotes || data.notes || '',
      notes: data.notes || data.buyersNotes || '',
      vendorIds: data.vendorIds || [],
      invitations: [],
      items: processedLines,
      lines: processedLines,
      quotations: [],
      version: 1,
      correlationId: `corr-rfq-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    rfqs.unshift(newRfq);

    this.logAudit(
      newRfq,
      'RFQ_CREATED',
      context.userId,
      context.userName,
      `RFQ ${newRfq.rfqNumber} created in DRAFT state with ${processedLines.length} lines.`,
      undefined,
      'DRAFT',
      auditLogs,
      1
    );

    return { success: true, rfq: newRfq };
  }

  /**
   * Create RFQ directly from approved Purchase Requisition lines
   */
  static createRFQFromPR(
    prId: string,
    lineIds: string[] | undefined,
    invitedVendorIds: string[],
    closingDate: string,
    requisitions: PurchaseRequisition[],
    rfqs: RequestForQuotation[],
    auditLogs: PurchaseAuditRecord[],
    context: RFQUserContext
  ): { success: boolean; rfq?: RequestForQuotation; error?: string } {
    const pr = requisitions.find(p => p.id === prId && p.tenantId === context.tenantId);
    if (!pr) {
      return { success: false, error: 'Purchase Requisition not found or belongs to another tenant.' };
    }

    if (pr.status !== 'APPROVED' && pr.status !== 'IN_RFQ') {
      return { success: false, error: `Cannot generate RFQ from PR in status '${pr.status}'. PR must be in 'APPROVED' status.` };
    }

    const prLines = pr.lines || pr.items || [];
    let selectedLines = prLines;
    if (lineIds && lineIds.length > 0) {
      selectedLines = prLines.filter(l => lineIds.includes(l.id));
      if (selectedLines.length === 0) {
        return { success: false, error: 'None of the specified PR lines were found.' };
      }
    }

    const rfqLinesPayload: Partial<RFQLine>[] = selectedLines.map(pl => ({
      prId: pr.id,
      prLineId: pl.id,
      productId: pl.productId,
      variantId: pl.variantId,
      variantSku: pl.variantSku,
      itemSku: pl.itemSku || pl.productId,
      itemName: pl.itemName,
      itemNameAr: pl.itemNameAr,
      description: pl.description,
      categoryId: pl.categoryId,
      targetQuantity: pl.requestedQuantity || pl.requestedQty || 1,
      targetUOM: pl.requestedUOM || pl.uom || 'PCS',
      baseQuantity: pl.baseQuantity || pl.requestedQuantity || 1,
      baseUOM: pl.baseUOM || 'PCS',
      uomConversionFactor: pl.uomConversionFactor || 1,
      targetUnitPrice: pl.estimatedUnitPrice,
      taxCategoryId: pl.taxCategoryId,
      taxCategoryCode: pl.taxCategoryCode,
      warehouseId: pl.warehouseId,
      warehouseName: pl.warehouseName,
      departmentId: pl.departmentId || pr.departmentId,
      costCenterId: pl.costCenterId || pr.costCenterId,
      projectId: pl.projectId || pr.projectId,
      requiredDate: pl.requiredDate || pr.requiredDate,
      specifications: pl.description || ''
    }));

    const createRes = this.createRFQ(
      {
        tenantId: pr.tenantId,
        companyId: pr.companyId,
        branchId: pr.branchId,
        title: `RFQ for ${pr.prNumber} - ${pr.departmentName || 'Procurement Sourcing'}`,
        prId: pr.id,
        prNumber: pr.prNumber,
        departmentId: pr.departmentId,
        departmentName: pr.departmentName,
        currency: pr.currency || 'SAR',
        closingDate: closingDate || new Date(Date.now() + 14 * 86400000).toISOString(),
        vendorIds: invitedVendorIds || []
      },
      rfqLinesPayload,
      rfqs,
      auditLogs,
      context
    );

    if (!createRes.success || !createRes.rfq) {
      return createRes;
    }

    // Update PR and PR line status to IN_RFQ
    pr.status = 'IN_RFQ';
    selectedLines.forEach(l => {
      l.status = 'IN_RFQ';
    });

    return { success: true, rfq: createRes.rfq };
  }

  /**
   * Update an RFQ with optimistic concurrency protection
   */
  static updateRFQ(
    id: string,
    updates: Partial<RequestForQuotation>,
    lines: Partial<RFQLine>[] | undefined,
    rfqs: RequestForQuotation[],
    auditLogs: PurchaseAuditRecord[],
    context: RFQUserContext,
    expectedVersion?: number
  ): { success: boolean; rfq?: RequestForQuotation; isConflict?: boolean; error?: string } {
    const rfq = rfqs.find(r => r.id === id);
    if (!rfq) return { success: false, error: 'RFQ not found.' };

    // Tenant Isolation Check
    if (rfq.tenantId !== context.tenantId) {
      return { success: false, error: 'Cross-tenant RFQ modification strictly prohibited.' };
    }

    // Optimistic Concurrency Check
    if (expectedVersion !== undefined && rfq.version !== expectedVersion) {
      return {
        success: false,
        isConflict: true,
        error: `Optimistic concurrency conflict: RFQ ${rfq.rfqNumber} was modified by another user (Current Version: ${rfq.version}, Expected Version: ${expectedVersion}).`
      };
    }

    if (rfq.status !== 'DRAFT' && rfq.status !== 'PENDING_APPROVAL') {
      return {
        success: false,
        error: `Cannot modify RFQ in status '${rfq.status}'. Only DRAFT or PENDING_APPROVAL RFQs may be modified.`
      };
    }

    let updatedLines = rfq.items || rfq.lines || [];
    if (lines && lines.length > 0) {
      updatedLines = [];
      for (let i = 0; i < lines.length; i++) {
        const lineRes = this.validateAndSnapshotLine(lines[i], rfq.tenantId, rfq.companyId, i);
        if (!lineRes.success || !lineRes.line) {
          return { success: false, error: lineRes.error };
        }
        lineRes.line.rfqId = rfq.id;
        updatedLines.push(lineRes.line);
      }
    }

    const prevStatus = rfq.status;
    const newVersion = (rfq.version || 1) + 1;

    Object.assign(rfq, {
      ...updates,
      id: rfq.id,
      tenantId: rfq.tenantId,
      companyId: rfq.companyId,
      rfqNumber: rfq.rfqNumber,
      items: updatedLines,
      lines: updatedLines,
      version: newVersion,
      updatedAt: new Date().toISOString()
    });

    this.logAudit(
      rfq,
      'RFQ_UPDATED',
      context.userId,
      context.userName,
      `RFQ ${rfq.rfqNumber} updated to version ${newVersion}. Total lines: ${updatedLines.length}.`,
      prevStatus,
      rfq.status,
      auditLogs,
      newVersion
    );

    return { success: true, rfq };
  }

  /**
   * Transition RFQ from DRAFT -> APPROVED or PUBLISHED (Mark Ready / Direct Publish)
   */
  static markReady(
    id: string,
    rfqs: RequestForQuotation[],
    auditLogs: PurchaseAuditRecord[],
    context: RFQUserContext,
    expectedVersion?: number
  ): { success: boolean; rfq?: RequestForQuotation; isConflict?: boolean; error?: string } {
    const rfq = rfqs.find(r => r.id === id && r.tenantId === context.tenantId);
    if (!rfq) return { success: false, error: 'RFQ not found.' };

    if (expectedVersion !== undefined && rfq.version !== expectedVersion) {
      return {
        success: false,
        isConflict: true,
        error: `Optimistic concurrency conflict on RFQ ${rfq.rfqNumber} (Version: ${rfq.version}, Expected: ${expectedVersion}).`
      };
    }

    if (rfq.status !== 'DRAFT') {
      return { success: false, error: `Cannot mark ready RFQ in status '${rfq.status}'. Expected 'DRAFT'.` };
    }

    const lines = rfq.items || rfq.lines || [];
    if (lines.length === 0) {
      return { success: false, error: 'RFQ must contain at least one line item before being marked ready.' };
    }

    const prevStatus = rfq.status;
    rfq.status = 'APPROVED';
    rfq.version = (rfq.version || 1) + 1;
    rfq.updatedAt = new Date().toISOString();

    this.logAudit(
      rfq,
      'RFQ_APPROVED',
      context.userId,
      context.userName,
      `RFQ ${rfq.rfqNumber} validated and marked READY / APPROVED for sourcing.`,
      prevStatus,
      'APPROVED',
      auditLogs,
      rfq.version
    );

    return { success: true, rfq };
  }

  /**
   * Publish / Issue RFQ to invited suppliers
   */
  static publishRFQ(
    id: string,
    rfqs: RequestForQuotation[],
    auditLogs: PurchaseAuditRecord[],
    context: RFQUserContext,
    expectedVersion?: number
  ): { success: boolean; rfq?: RequestForQuotation; isConflict?: boolean; error?: string } {
    const rfq = rfqs.find(r => r.id === id && r.tenantId === context.tenantId);
    if (!rfq) return { success: false, error: 'RFQ not found.' };

    if (expectedVersion !== undefined && rfq.version !== expectedVersion) {
      return {
        success: false,
        isConflict: true,
        error: `Optimistic concurrency conflict on RFQ ${rfq.rfqNumber}.`
      };
    }

    if (rfq.status !== 'DRAFT' && rfq.status !== 'APPROVED' && rfq.status !== 'PUBLISHED') {
      return { success: false, error: `Cannot publish RFQ in status '${rfq.status}'.` };
    }

    const prevStatus = rfq.status;
    rfq.status = 'PUBLISHED';
    rfq.issuedDate = new Date().toISOString();
    rfq.version = (rfq.version || 1) + 1;
    rfq.updatedAt = new Date().toISOString();

    this.logAudit(
      rfq,
      'RFQ_PUBLISHED',
      context.userId,
      context.userName,
      `RFQ ${rfq.rfqNumber} published to suppliers. Response closing deadline: ${rfq.closingDate}.`,
      prevStatus,
      'PUBLISHED',
      auditLogs,
      rfq.version
    );

    return { success: true, rfq };
  }

  /**
   * Cancel RFQ with mandatory justification
   */
  static cancelRFQ(
    id: string,
    reason: string,
    rfqs: RequestForQuotation[],
    auditLogs: PurchaseAuditRecord[],
    context: RFQUserContext,
    expectedVersion?: number
  ): { success: boolean; rfq?: RequestForQuotation; isConflict?: boolean; error?: string } {
    const rfq = rfqs.find(r => r.id === id && r.tenantId === context.tenantId);
    if (!rfq) return { success: false, error: 'RFQ not found.' };

    if (expectedVersion !== undefined && rfq.version !== expectedVersion) {
      return {
        success: false,
        isConflict: true,
        error: `Optimistic concurrency conflict on RFQ ${rfq.rfqNumber}.`
      };
    }

    if (rfq.status === 'AWARDED' || rfq.status === 'CLOSED' || rfq.status === 'CANCELLED') {
      return { success: false, error: `Cannot cancel RFQ in terminal status '${rfq.status}'.` };
    }

    if (!reason || reason.trim() === '') {
      return { success: false, error: 'Cancellation justification is required.' };
    }

    const prevStatus = rfq.status;
    rfq.status = 'CANCELLED';
    rfq.cancellationReason = reason;
    rfq.version = (rfq.version || 1) + 1;
    rfq.updatedAt = new Date().toISOString();

    const lines = rfq.items || rfq.lines || [];
    lines.forEach(l => {
      l.status = 'CANCELLED';
    });

    this.logAudit(
      rfq,
      'RFQ_CANCELLED',
      context.userId,
      context.userName,
      `RFQ ${rfq.rfqNumber} cancelled. Reason: ${reason}`,
      prevStatus,
      'CANCELLED',
      auditLogs,
      rfq.version
    );

    return { success: true, rfq };
  }

  /**
   * Close RFQ administratively
   */
  static closeRFQ(
    id: string,
    rfqs: RequestForQuotation[],
    auditLogs: PurchaseAuditRecord[],
    context: RFQUserContext,
    expectedVersion?: number
  ): { success: boolean; rfq?: RequestForQuotation; isConflict?: boolean; error?: string } {
    const rfq = rfqs.find(r => r.id === id && r.tenantId === context.tenantId);
    if (!rfq) return { success: false, error: 'RFQ not found.' };

    if (expectedVersion !== undefined && rfq.version !== expectedVersion) {
      return { success: false, isConflict: true, error: `Optimistic concurrency conflict on RFQ ${rfq.rfqNumber}.` };
    }

    const prevStatus = rfq.status;
    rfq.status = 'CLOSED';
    rfq.version = (rfq.version || 1) + 1;
    rfq.updatedAt = new Date().toISOString();

    this.logAudit(
      rfq,
      'RFQ_CLOSED',
      context.userId,
      context.userName,
      `RFQ ${rfq.rfqNumber} administratively closed.`,
      prevStatus,
      'CLOSED',
      auditLogs,
      rfq.version
    );

    return { success: true, rfq };
  }

  /**
   * Retrieve single RFQ with tenant & company security guard
   */
  static getRFQ(
    id: string,
    tenantId: string,
    rfqs: RequestForQuotation[],
    companyId?: string
  ): RequestForQuotation | undefined {
    return rfqs.find(
      r => r.id === id && r.tenantId === tenantId && (!companyId || r.companyId === companyId)
    );
  }

  /**
   * Filter and list RFQs for a tenant
   */
  static listRFQs(
    tenantId: string,
    rfqs: RequestForQuotation[],
    filters?: {
      companyId?: string;
      branchId?: string;
      status?: string;
      buyerId?: string;
      prId?: string;
      search?: string;
    }
  ): RequestForQuotation[] {
    return rfqs.filter(r => {
      if (r.tenantId !== tenantId) return false;
      if (filters?.companyId && r.companyId !== filters.companyId) return false;
      if (filters?.branchId && r.branchId !== filters.branchId) return false;
      if (filters?.buyerId && r.buyerId !== filters.buyerId) return false;
      if (filters?.prId && r.prId !== filters.prId) return false;
      if (filters?.status && filters.status !== 'ALL' && r.status !== filters.status) return false;
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const matchNumber = r.rfqNumber.toLowerCase().includes(q);
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchPr = (r.prNumber || '').toLowerCase().includes(q);
        const matchLine = (r.items || r.lines || []).some(l => l.itemName.toLowerCase().includes(q) || l.itemSku.toLowerCase().includes(q));
        if (!matchNumber && !matchTitle && !matchPr && !matchLine) return false;
      }
      return true;
    });
  }

  /**
   * Helper to write structured, hash-stamped audit records
   */
  private static logAudit(
    rfq: RequestForQuotation,
    action: any,
    userId: string,
    userName: string,
    details: string,
    prevState: string | undefined,
    newState: string,
    auditLogs: PurchaseAuditRecord[],
    version?: number
  ): void {
    const timestamp = new Date().toISOString();
    const hash = WorkflowEngine.generateDigitalSignature(rfq.id, rfq.rfqNumber, userId, timestamp);

    const log: PurchaseAuditRecord = {
      id: `aud-rfq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: rfq.tenantId,
      companyId: rfq.companyId,
      branchId: rfq.branchId,
      actionType: action,
      performedBy: userId,
      performedByName: userName,
      performedAt: timestamp,
      targetDocumentType: 'RFQ',
      targetDocumentId: rfq.id,
      targetDocumentNumber: rfq.rfqNumber,
      details,
      previousState: prevState,
      newState,
      correlationId: rfq.correlationId,
      version: version || rfq.version,
      immutableHash: hash
    };

    auditLogs.unshift(log);
  }
}
