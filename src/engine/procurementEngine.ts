/**
 * AM Business Platform - Procurement & Purchasing Domain Engine (Phase 2.3)
 * Enterprise Standard Aligned with SAP S/4HANA (MM-PUR) and Oracle ERP Cloud SCM
 */

import {
  VendorMaster,
  VendorCategory,
  PaymentTerms,
  Incoterms,
  ProcurementCategory,
  BuyerGroup,
  PurchasingOrganization,
  PurchaseRequisition,
  PurchaseRequisitionLine,
  PurchaseRequisitionItem,
  ProcurementBudgetCheckResult,
  ProcurementBudgetCheckStatus,
  ProcurementBudgetPolicy,
  RequestForQuotation,
  RFQItem,
  VendorQuotation,
  VendorQuotationItem,
  QuotationComparisonMatrixItem,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseApprovalRule,
  PurchaseApprovalStep,
  PurchaseOrderAmendment,
  PartialDeliveryReceiptResult,
  VendorReturnNote,
  VendorReturnItem,
  PurchaseAuditRecord,
  PurchaseAuditAction,
  UserRole
} from '../types/procurement';

import { StockMovement } from '../types/index';
import { MasterDataService } from './masterDataService';
import { WorkflowEngine } from './workflowEngine';
import { ProcurementBudgetEngine } from './procurementBudgetEngine';
import { TaxEngine } from './taxEngine';
export * from './purchaseOrderEngine';

export class ProcurementEngine {

  // ==================== 1. PROCUREMENT MASTER DATA ENGINE ====================

  static createVendor(data: Partial<VendorMaster>, vendors: VendorMaster[]): { success: boolean; vendor?: VendorMaster; error?: string } {
    if (!data.name || !data.code || !data.vendorCategoryId) {
      return { success: false, error: 'Vendor Name, Code, and Category are required.' };
    }

    if (vendors.some(v => v.code.toLowerCase() === data.code?.toLowerCase())) {
      return { success: false, error: `Vendor with code ${data.code} already exists.` };
    }

    const newVendor: VendorMaster = {
      id: `ven-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: data.tenantId || 'ten-001',
      companyId: data.companyId || 'comp-001',
      code: data.code.toUpperCase(),
      name: data.name,
      nameAr: data.nameAr || data.name,
      taxNumber: data.taxNumber || '',
      commercialRegNo: data.commercialRegNo || '',
      vendorCategoryId: data.vendorCategoryId,
      vendorCategoryName: data.vendorCategoryName || 'General Supplier',
      paymentTermsId: data.paymentTermsId || 'pterm-001',
      paymentTermsName: data.paymentTermsName || 'Net 30 Days',
      incotermsId: data.incotermsId || 'inco-001',
      incotermsCode: data.incotermsCode || 'FOB',
      purchasingOrgId: data.purchasingOrgId || 'porg-001',
      purchasingOrgName: data.purchasingOrgName || 'Global Central Purchasing Org',
      currency: data.currency || 'USD',
      email: data.email || '',
      phone: data.phone || '',
      contactPerson: data.contactPerson || '',
      address: data.address || '',
      country: data.country || 'Egypt',
      city: data.city || 'Cairo',
      bankName: data.bankName || '',
      bankIban: data.bankIban || '',
      creditLimit: data.creditLimit || 100000,
      rating: data.rating || 5,
      status: data.status || 'ACTIVE',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    vendors.unshift(newVendor);
    return { success: true, vendor: newVendor };
  }

  // ==================== 2. PURCHASE REQUISITION (PR) ENGINE ====================

  /**
   * Validate master data references and perform authoritative UOM snapshotting
   */
  static validateAndEnrichPRLine(
    rawItem: Partial<PurchaseRequisitionLine>,
    tenantId: string,
    companyId: string,
    index: number = 0
  ): { success: boolean; line?: PurchaseRequisitionLine; error?: string } {
    const qty = Number(rawItem.requestedQuantity !== undefined ? rawItem.requestedQuantity : rawItem.requestedQty);
    if (!qty || isNaN(qty) || qty <= 0) {
      return { success: false, error: `Line ${index + 1}: Requested quantity must be a positive number.` };
    }

    const unitPrice = Number(rawItem.estimatedUnitPrice || 0);
    if (isNaN(unitPrice) || unitPrice < 0) {
      return { success: false, error: `Line ${index + 1}: Unit price cannot be negative.` };
    }

    const itemSku = rawItem.itemSku || rawItem.productId;
    if (!itemSku && !rawItem.productId) {
      return { success: false, error: `Line ${index + 1}: Product reference (ID or SKU) is required.` };
    }

    // 1. Authoritative Product Master Lookup
    const products = MasterDataService.getProducts(tenantId);
    let matchedProduct = products.find(p => p.id === rawItem.productId || p.sku.toLowerCase() === itemSku?.toLowerCase());

    if (!matchedProduct && rawItem.productId) {
      matchedProduct = MasterDataService.getProductById(rawItem.productId, tenantId);
    }

    if (!matchedProduct) {
      // Fallback: If not in master data catalog, reject if strict lookup is enforced or construct with warning
      return { success: false, error: `Line ${index + 1}: Product '${itemSku || rawItem.productId}' not found in authoritative Master Data catalog.` };
    }

    if (matchedProduct.active === false) {
      return { success: false, error: `Line ${index + 1}: Product '${matchedProduct.name}' (${matchedProduct.sku}) is currently INACTIVE in Master Data.` };
    }

    // 2. Variant validation if specified
    let matchedVariantId = rawItem.variantId;
    let matchedVariantSku = rawItem.variantSku;
    if (rawItem.variantId || rawItem.variantSku) {
      const variant = matchedProduct.variants?.find(
        v => (rawItem.variantId && v.id === rawItem.variantId) || (rawItem.variantSku && v.sku === rawItem.variantSku)
      );
      if (variant) {
        if (!variant.active) {
          return { success: false, error: `Line ${index + 1}: Product Variant '${variant.sku}' is inactive.` };
        }
        matchedVariantId = variant.id;
        matchedVariantSku = variant.sku;
      }
    }

    // 3. UOM Validation & Authoritative Snapshotting
    const baseUOM = matchedProduct.baseUom || 'PCS';
    const requestedUOM = (rawItem.requestedUOM || rawItem.uom || baseUOM).toUpperCase();

    const tenantUOMs = MasterDataService.getUOMs(tenantId);
    const resolvedUOM = tenantUOMs.find(u => u.code.toUpperCase() === requestedUOM);
    if (!resolvedUOM) {
      return { success: false, error: `Line ${index + 1}: UOM '${requestedUOM}' is not recognized in tenant UOM registry.` };
    }
    if (!resolvedUOM.active) {
      return { success: false, error: `Line ${index + 1}: UOM '${requestedUOM}' is inactive.` };
    }

    let baseQuantity = qty;
    let uomConversionFactor = 1;

    try {
      const convResult = MasterDataService.convertQuantity(
        requestedUOM,
        baseUOM,
        qty,
        tenantId,
        matchedProduct.sku
      );
      baseQuantity = convResult.convertedQuantity;
      uomConversionFactor = convResult.factorUsed;
    } catch (err: any) {
      return { success: false, error: `Line ${index + 1}: UOM conversion failed: ${err.message || err}` };
    }

    // 4. Tax Category Resolution
    let taxCategoryId = rawItem.taxCategoryId;
    let taxCategoryCode = rawItem.taxCategoryCode;
    let estimatedTaxAmount = 0;
    if (matchedProduct.taxCategoryId || rawItem.taxCategoryId) {
      const taxCats = MasterDataService.getTaxCategories(tenantId);
      const taxCat = taxCats.find(t => t.id === (rawItem.taxCategoryId || matchedProduct?.taxCategoryId));
      if (taxCat) {
        taxCategoryId = taxCat.id;
        taxCategoryCode = taxCat.code;
        if (!taxCat.isExempt && !taxCat.isZeroRated) {
          const resolvedRate = TaxEngine.resolveTaxRate({
            tenantId,
            taxCategory: taxCat.code || taxCat.name,
            countryOrJurisdiction: 'SA'
          }).taxRate;
          estimatedTaxAmount = (qty * unitPrice) * resolvedRate;
        }
      }
    }

    const estimatedLineAmount = qty * unitPrice;

    const enrichedLine: PurchaseRequisitionLine = {
      id: rawItem.id || `pr-line-${Date.now()}-${index}`,
      requisitionId: rawItem.requisitionId || rawItem.prId || '',
      prId: rawItem.requisitionId || rawItem.prId || '',
      productId: matchedProduct.id,
      itemSku: matchedProduct.sku,
      variantId: matchedVariantId,
      variantSku: matchedVariantSku,
      itemName: rawItem.itemName || matchedProduct.name,
      itemNameAr: rawItem.itemNameAr || matchedProduct.nameAr || matchedProduct.name,
      description: rawItem.description || matchedProduct.description || '',
      categoryId: matchedProduct.categoryId || rawItem.categoryId || '',
      requestedQuantity: qty,
      requestedQty: qty,
      requestedUOM: requestedUOM,
      uom: requestedUOM,
      baseQuantity,
      baseUOM,
      uomConversionFactor,
      estimatedUnitPrice: unitPrice,
      estimatedLineAmount,
      estimatedTotalPrice: estimatedLineAmount,
      taxCategoryId,
      taxCategoryCode,
      estimatedTaxAmount,
      warehouseId: rawItem.warehouseId || 'wh-001',
      warehouseName: rawItem.warehouseName || 'Central Warehouse - Riyadh',
      departmentId: rawItem.departmentId,
      costCenterId: rawItem.costCenterId,
      profitCenterId: rawItem.profitCenterId,
      projectId: rawItem.projectId,
      supplierId: rawItem.supplierId,
      supplierName: rawItem.supplierName,
      requiredDate: rawItem.requiredDate || new Date(Date.now() + 14 * 86400000).toISOString(),
      status: rawItem.status || 'OPEN',
      poReference: rawItem.poReference
    };

    return { success: true, line: enrichedLine };
  }

  /**
   * Create an enterprise Purchase Requisition
   */
  static createRequisition(
    data: Partial<PurchaseRequisition>,
    items: Partial<PurchaseRequisitionLine>[],
    requisitions: PurchaseRequisition[],
    auditLogs: PurchaseAuditRecord[],
    userId: string,
    userName: string
  ): { success: boolean; requisition?: PurchaseRequisition; error?: string } {
    if (!items || items.length === 0) {
      return { success: false, error: 'Purchase Requisition must contain at least one line item.' };
    }

    const tenantId = data.tenantId || 'ten-001';
    const companyId = data.companyId || 'comp-001';
    const branchId = data.branchId || 'br-001';

    const enrichedLines: PurchaseRequisitionLine[] = [];
    for (let i = 0; i < items.length; i++) {
      const lineRes = this.validateAndEnrichPRLine(items[i], tenantId, companyId, i);
      if (!lineRes.success || !lineRes.line) {
        return { success: false, error: lineRes.error };
      }
      enrichedLines.push(lineRes.line);
    }

    const totalEstimatedAmount = enrichedLines.reduce((sum, l) => sum + l.estimatedLineAmount, 0);
    const count = requisitions.length + 1;
    const prNumber = data.prNumber || `PR-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;
    const prId = `pr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    enrichedLines.forEach(l => {
      l.requisitionId = prId;
      l.prId = prId;
    });

    const newPr: PurchaseRequisition = {
      id: prId,
      tenantId,
      companyId,
      branchId,
      prNumber,
      requestedBy: userId,
      requestedByName: userName,
      requesterName: userName,
      departmentId: data.departmentId || 'dept-02',
      departmentName: data.departmentName || 'Finance & Treasury',
      warehouseId: data.warehouseId || 'wh-001',
      warehouseName: data.warehouseName || 'Central Warehouse - Riyadh',
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      currencyId: data.currencyId || 'curr-sar',
      currency: data.currency || 'SAR',
      costCenterId: data.costCenterId,
      costCenterName: data.costCenterName,
      profitCenterId: data.profitCenterId,
      profitCenterName: data.profitCenterName,
      projectId: data.projectId,
      projectName: data.projectName,
      purchasingOrgId: data.purchasingOrgId || 'porg-001',
      purchasingOrgName: data.purchasingOrgName || 'Global Central Purchasing Org',
      buyerGroupId: data.buyerGroupId || 'bg-001',
      requisitionDate: data.requisitionDate || new Date().toISOString(),
      requiredDate: data.requiredDate || new Date(Date.now() + 14 * 86400000).toISOString(),
      priority: data.priority || 'MEDIUM',
      purpose: data.purpose || data.notes || 'Standard Operating Procurement',
      status: 'DRAFT',
      totalEstimatedAmount,
      lines: enrichedLines,
      items: enrichedLines,
      version: 1,
      correlationId: data.correlationId || `corr-pr-${Date.now()}`,
      notes: data.notes || data.purpose || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Automatic Initial Budget Evaluation
    const budgetRes = ProcurementBudgetEngine.evaluateRequisitionBudget(newPr, requisitions);
    newPr.budgetStatus = budgetRes.status;
    newPr.budgetPolicy = budgetRes.policy;
    newPr.budgetCheckResult = budgetRes;

    requisitions.unshift(newPr);

    this.logAuditTrail(
      newPr.tenantId,
      newPr.companyId,
      'PR_CREATED',
      userId,
      userName,
      'PR',
      newPr.id,
      newPr.prNumber,
      `Purchase Requisition ${newPr.prNumber} created with ${enrichedLines.length} line items (Est Total: ${totalEstimatedAmount.toLocaleString()} ${newPr.currency}). Budget Status: ${newPr.budgetStatus}`,
      'None',
      'DRAFT',
      auditLogs,
      newPr.branchId,
      newPr.correlationId,
      newPr.version
    );

    return { success: true, requisition: newPr };
  }

  /**
   * Retrieve single PR with tenant isolation verification
   */
  static getRequisition(
    id: string,
    tenantId: string,
    requisitions: PurchaseRequisition[],
    companyId?: string
  ): PurchaseRequisition | undefined {
    return requisitions.find(
      p => p.id === id && p.tenantId === tenantId && (!companyId || p.companyId === companyId)
    );
  }

  /**
   * List PRs with enterprise filtering and tenant isolation
   */
  static listRequisitions(
    tenantId: string,
    requisitions: PurchaseRequisition[],
    filters?: {
      companyId?: string;
      branchId?: string;
      departmentId?: string;
      supplierId?: string;
      status?: string;
      priority?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): PurchaseRequisition[] {
    return requisitions.filter(pr => {
      if (pr.tenantId !== tenantId) return false;
      if (filters?.companyId && pr.companyId !== filters.companyId) return false;
      if (filters?.branchId && pr.branchId !== filters.branchId) return false;
      if (filters?.departmentId && pr.departmentId !== filters.departmentId) return false;
      if (filters?.supplierId && pr.supplierId !== filters.supplierId) return false;
      if (filters?.status && filters.status !== 'ALL' && pr.status !== filters.status) return false;
      if (filters?.priority && filters.priority !== 'ALL' && pr.priority !== filters.priority) return false;
      if (filters?.dateFrom && new Date(pr.requisitionDate) < new Date(filters.dateFrom)) return false;
      if (filters?.dateTo && new Date(pr.requisitionDate) > new Date(filters.dateTo)) return false;
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const matchNumber = pr.prNumber.toLowerCase().includes(q);
        const matchRequester = (pr.requestedByName || pr.requesterName || '').toLowerCase().includes(q);
        const matchDept = (pr.departmentName || '').toLowerCase().includes(q);
        const matchPurpose = (pr.purpose || pr.notes || '').toLowerCase().includes(q);
        const matchItem = pr.lines?.some(l => l.itemName.toLowerCase().includes(q) || l.itemSku?.toLowerCase().includes(q));
        if (!matchNumber && !matchRequester && !matchDept && !matchPurpose && !matchItem) return false;
      }
      return true;
    });
  }

  /**
   * Update PR with optimistic concurrency and authoritative re-snapshotting
   */
  static updateRequisition(
    id: string,
    updates: Partial<PurchaseRequisition>,
    items: Partial<PurchaseRequisitionLine>[] | undefined,
    requisitions: PurchaseRequisition[],
    auditLogs: PurchaseAuditRecord[],
    userId: string,
    userName: string,
    expectedVersion?: number
  ): { success: boolean; requisition?: PurchaseRequisition; isConflict?: boolean; error?: string } {
    const prIndex = requisitions.findIndex(p => p.id === id);
    if (prIndex === -1) {
      return { success: false, error: 'Purchase Requisition not found.' };
    }

    const pr = requisitions[prIndex];
    const tenantId = updates.tenantId || pr.tenantId;
    const companyId = updates.companyId || pr.companyId;

    // Tenant Isolation Check
    if (updates.tenantId && updates.tenantId !== pr.tenantId) {
      return { success: false, error: 'Cross-tenant mutation prohibited.' };
    }

    // Optimistic Concurrency Check
    if (expectedVersion !== undefined && pr.version !== expectedVersion) {
      return {
        success: false,
        isConflict: true,
        error: `Optimistic concurrency conflict: Requisition ${pr.prNumber} was updated by another process (Current Version: ${pr.version}, Expected Version: ${expectedVersion}).`
      };
    }

    // State Mutation Eligibility
    if (pr.status !== 'DRAFT' && pr.status !== 'BUDGET_CHECKED') {
      return {
        success: false,
        error: `Cannot modify Requisition in status ${pr.status}. Only DRAFT or BUDGET_CHECKED requisitions may be edited.`
      };
    }

    let newLines = pr.lines || pr.items || [];
    if (items && items.length > 0) {
      newLines = [];
      for (let i = 0; i < items.length; i++) {
        const lineRes = this.validateAndEnrichPRLine(items[i], tenantId, companyId, i);
        if (!lineRes.success || !lineRes.line) {
          return { success: false, error: lineRes.error };
        }
        lineRes.line.requisitionId = pr.id;
        lineRes.line.prId = pr.id;
        newLines.push(lineRes.line);
      }
    }

    const totalEst = newLines.reduce((s, l) => s + l.estimatedLineAmount, 0);
    const prevStatus = pr.status;
    const newVersion = pr.version + 1;

    const updatedPr: PurchaseRequisition = {
      ...pr,
      ...updates,
      id: pr.id,
      tenantId: pr.tenantId,
      companyId: updates.companyId || pr.companyId,
      branchId: updates.branchId || pr.branchId,
      totalEstimatedAmount: totalEst,
      lines: newLines,
      items: newLines,
      version: newVersion,
      updatedAt: new Date().toISOString()
    };

    // Re-evaluate Budget on update
    const budgetRes = ProcurementBudgetEngine.evaluateRequisitionBudget(updatedPr, requisitions);
    updatedPr.budgetStatus = budgetRes.status;
    updatedPr.budgetPolicy = budgetRes.policy;
    updatedPr.budgetCheckResult = budgetRes;

    requisitions[prIndex] = updatedPr;

    this.logAuditTrail(
      updatedPr.tenantId,
      updatedPr.companyId,
      'PR_UPDATED',
      userId,
      userName,
      'PR',
      updatedPr.id,
      updatedPr.prNumber,
      `Requisition ${updatedPr.prNumber} updated to version ${newVersion}. Lines: ${newLines.length}, Total: ${totalEst.toLocaleString()} ${updatedPr.currency}`,
      prevStatus,
      updatedPr.status,
      auditLogs,
      updatedPr.branchId,
      updatedPr.correlationId,
      newVersion
    );

    return { success: true, requisition: updatedPr };
  }

  /**
   * Authoritative Procurement Budget Check
   */
  static checkBudget(
    prId: string,
    requisitions: PurchaseRequisition[],
    auditLogs: PurchaseAuditRecord[],
    userId: string,
    userName: string,
    customAllocatedAmount?: number,
    customPolicy?: ProcurementBudgetPolicy
  ): { success: boolean; budgetResult?: ProcurementBudgetCheckResult; requisition?: PurchaseRequisition; error?: string } {
    const pr = requisitions.find(p => p.id === prId);
    if (!pr) return { success: false, error: 'Purchase Requisition not found.' };

    const budgetRes = ProcurementBudgetEngine.evaluateRequisitionBudget(
      pr,
      requisitions,
      customAllocatedAmount,
      customPolicy
    );

    const prevBudgetStatus = pr.budgetStatus;
    pr.budgetStatus = budgetRes.status;
    pr.budgetPolicy = budgetRes.policy;
    pr.budgetCheckResult = budgetRes;

    if (pr.status === 'DRAFT' && !budgetRes.isBlocked) {
      pr.status = 'BUDGET_CHECKED';
    }
    pr.version += 1;
    pr.updatedAt = new Date().toISOString();

    this.logAuditTrail(
      pr.tenantId,
      pr.companyId,
      'PR_BUDGET_CHECKED',
      userId,
      userName,
      'PR',
      pr.id,
      pr.prNumber,
      `Budget check performed: Status=${budgetRes.status}, Policy=${budgetRes.policy}, Allocated=${budgetRes.allocatedBudget.toLocaleString()} SAR, Available=${budgetRes.availableBudget.toLocaleString()} SAR, Variance=${budgetRes.variance.toLocaleString()} SAR`,
      prevBudgetStatus || 'NONE',
      pr.budgetStatus,
      auditLogs,
      pr.branchId,
      pr.correlationId,
      pr.version
    );

    return { success: true, budgetResult: budgetRes, requisition: pr };
  }

  /**
   * Submit PR for workflow approval with budget policy gating
   */
  static submitRequisition(
    prId: string,
    requisitions: PurchaseRequisition[],
    approvalRules: PurchaseApprovalRule[],
    auditLogs: PurchaseAuditRecord[],
    userId: string,
    userName: string,
    expectedVersion?: number
  ): { success: boolean; requisition?: PurchaseRequisition; isConflict?: boolean; error?: string } {
    const pr = requisitions.find(p => p.id === prId);
    if (!pr) return { success: false, error: 'Purchase Requisition not found.' };

    if (expectedVersion !== undefined && pr.version !== expectedVersion) {
      return {
        success: false,
        isConflict: true,
        error: `Optimistic concurrency conflict: Expected version ${expectedVersion}, but requisition is at version ${pr.version}.`
      };
    }

    if (pr.status !== 'DRAFT' && pr.status !== 'BUDGET_CHECKED') {
      return { success: false, error: `Requisition ${pr.prNumber} cannot be submitted from status '${pr.status}'.` };
    }

    // 1. Mandatory Budget Gate Check
    const budgetRes = ProcurementBudgetEngine.evaluateRequisitionBudget(pr, requisitions);
    pr.budgetStatus = budgetRes.status;
    pr.budgetPolicy = budgetRes.policy;
    pr.budgetCheckResult = budgetRes;

    if (budgetRes.status === 'BUDGET_BLOCKED' || (budgetRes.policy === 'HARD_BLOCK' && budgetRes.variance < 0)) {
      return {
        success: false,
        error: `Submission Blocked: Requisition exceeds budget limit under HARD_BLOCK policy. Deficit: ${Math.abs(budgetRes.variance).toLocaleString()} SAR. Reason: ${budgetRes.reason}`
      };
    }

    // 2. Resolve Multi-Tier Approval Rules
    const matchingRules = approvalRules.filter(r => 
      r.documentType === 'PR' && 
      r.isActive && 
      r.tenantId === pr.tenantId &&
      pr.totalEstimatedAmount >= r.minAmount && 
      pr.totalEstimatedAmount <= r.maxAmount
    ).sort((a, b) => a.stepNumber - b.stepNumber);

    const steps: PurchaseApprovalStep[] = matchingRules.map(rule => ({
      id: `step-${Date.now()}-${rule.stepNumber}`,
      documentId: pr.id,
      documentType: 'PR',
      stepNumber: rule.stepNumber,
      approverRole: rule.requiredRoles[0] || 'Department Manager',
      status: 'PENDING'
    }));

    const prevStatus = pr.status;
    if (steps.length === 0) {
      // Auto-approve when within auto-approval threshold or unconfigured
      pr.status = 'APPROVED';
    } else {
      pr.status = 'PENDING_APPROVAL';
      pr.approvalHistory = steps;
    }

    pr.version += 1;
    pr.updatedAt = new Date().toISOString();

    this.logAuditTrail(
      pr.tenantId,
      pr.companyId,
      'PR_SUBMITTED',
      userId,
      userName,
      'PR',
      pr.id,
      pr.prNumber,
      `Requisition ${pr.prNumber} submitted for workflow routing. Initial approval status: ${pr.status} (${steps.length} approval tier(s) configured)`,
      prevStatus,
      pr.status,
      auditLogs,
      pr.branchId,
      pr.correlationId,
      pr.version
    );

    return { success: true, requisition: pr };
  }

  // Alias for backward compatibility
  static submitRequisitionForApproval(
    prId: string,
    requisitions: PurchaseRequisition[],
    approvalRules: PurchaseApprovalRule[],
    auditLogs: PurchaseAuditRecord[],
    userId: string,
    userName: string
  ) {
    return this.submitRequisition(prId, requisitions, approvalRules, auditLogs, userId, userName);
  }

  /**
   * Approve a Purchase Requisition step with Segregation of Duties (SoD) & Non-Duplication
   */
  static approveRequisition(
    prId: string,
    stepNumber: number = 1,
    comments: string = 'Approved',
    requisitions: PurchaseRequisition[],
    auditLogs: PurchaseAuditRecord[],
    userId: string,
    userName: string,
    userRole: string = 'Procurement Officer',
    expectedVersion?: number
  ): { success: boolean; requisition?: PurchaseRequisition; isConflict?: boolean; error?: string } {
    const pr = requisitions.find(p => p.id === prId);
    if (!pr) return { success: false, error: 'Purchase Requisition not found.' };

    if (expectedVersion !== undefined && pr.version !== expectedVersion) {
      return {
        success: false,
        isConflict: true,
        error: `Optimistic concurrency conflict: Expected version ${expectedVersion}, but requisition is at version ${pr.version}.`
      };
    }

    if (pr.status !== 'PENDING_APPROVAL') {
      return { success: false, error: `Requisition ${pr.prNumber} is not in PENDING_APPROVAL status (Current: ${pr.status}).` };
    }

    // Segregation of Duties (SoD) Rule: Requester cannot approve their own PR
    if (userId && pr.requestedBy && userId === pr.requestedBy) {
      return {
        success: false,
        error: 'Segregation of Duties Violation: Requester is strictly forbidden from approving their own purchase requisition.'
      };
    }

    if (!pr.approvalHistory || pr.approvalHistory.length === 0) {
      pr.approvalHistory = [
        {
          id: `step-${Date.now()}-1`,
          documentId: pr.id,
          documentType: 'PR',
          stepNumber: 1,
          approverRole: userRole,
          status: 'PENDING'
        }
      ];
    }

    const stepIndex = pr.approvalHistory.findIndex(s => s.stepNumber === stepNumber);
    if (stepIndex === -1) {
      return { success: false, error: `Approval step ${stepNumber} not found on Requisition ${pr.prNumber}.` };
    }

    const targetStep = pr.approvalHistory[stepIndex];

    // Anti-Duplication Rule: Reject if step is already approved
    if (targetStep.status === 'APPROVED') {
      return { success: false, error: `Approval Step ${stepNumber} has already been approved.` };
    }

    const timestamp = new Date().toISOString();
    const digitalSignature = WorkflowEngine.generateDigitalSignature(pr.id, pr.prNumber, userId, timestamp);

    targetStep.status = 'APPROVED';
    targetStep.approverUserId = userId;
    targetStep.approverName = userName;
    targetStep.approverRole = userRole;
    targetStep.actionDate = timestamp;
    targetStep.comments = comments;
    targetStep.digitalSignature = digitalSignature;

    // Check if all steps are approved
    const allApproved = pr.approvalHistory.every(s => s.status === 'APPROVED');
    const prevStatus = pr.status;

    if (allApproved) {
      pr.status = 'APPROVED';
    }

    pr.version += 1;
    pr.updatedAt = timestamp;

    this.logAuditTrail(
      pr.tenantId,
      pr.companyId,
      'PR_APPROVED',
      userId,
      userName,
      'PR',
      pr.id,
      pr.prNumber,
      `Step ${stepNumber} approved by ${userName} (${userRole}). Overall PR status: ${pr.status}. Signature: ${digitalSignature}`,
      prevStatus,
      pr.status,
      auditLogs,
      pr.branchId,
      pr.correlationId,
      pr.version
    );

    return { success: true, requisition: pr };
  }

  /**
   * Reject a Purchase Requisition
   */
  static rejectRequisition(
    prId: string,
    reason: string,
    requisitions: PurchaseRequisition[],
    auditLogs: PurchaseAuditRecord[],
    userId: string,
    userName: string,
    userRole: string = 'Department Manager',
    expectedVersion?: number
  ): { success: boolean; requisition?: PurchaseRequisition; isConflict?: boolean; error?: string } {
    const pr = requisitions.find(p => p.id === prId);
    if (!pr) return { success: false, error: 'Purchase Requisition not found.' };

    if (expectedVersion !== undefined && pr.version !== expectedVersion) {
      return {
        success: false,
        isConflict: true,
        error: `Optimistic concurrency conflict: Expected version ${expectedVersion}, but requisition is at version ${pr.version}.`
      };
    }

    if (pr.status !== 'PENDING_APPROVAL') {
      return { success: false, error: `Requisition ${pr.prNumber} is not in PENDING_APPROVAL status.` };
    }

    if (!reason || reason.trim() === '') {
      return { success: false, error: 'Rejection reason is required.' };
    }

    const prevStatus = pr.status;
    pr.status = 'REJECTED';
    pr.rejectionReason = reason;

    if (pr.approvalHistory) {
      const pendingStep = pr.approvalHistory.find(s => s.status === 'PENDING');
      if (pendingStep) {
        pendingStep.status = 'REJECTED';
        pendingStep.approverUserId = userId;
        pendingStep.approverName = userName;
        pendingStep.approverRole = userRole;
        pendingStep.actionDate = new Date().toISOString();
        pendingStep.comments = reason;
      }
    }

    pr.version += 1;
    pr.updatedAt = new Date().toISOString();

    this.logAuditTrail(
      pr.tenantId,
      pr.companyId,
      'PR_REJECTED',
      userId,
      userName,
      'PR',
      pr.id,
      pr.prNumber,
      `Requisition ${pr.prNumber} rejected by ${userName}. Reason: ${reason}`,
      prevStatus,
      'REJECTED',
      auditLogs,
      pr.branchId,
      pr.correlationId,
      pr.version
    );

    return { success: true, requisition: pr };
  }

  /**
   * Cancel a Purchase Requisition
   */
  static cancelRequisition(
    prId: string,
    reason: string = 'User Cancelled',
    requisitions: PurchaseRequisition[],
    auditLogs: PurchaseAuditRecord[],
    userId: string,
    userName: string,
    expectedVersion?: number
  ): { success: boolean; requisition?: PurchaseRequisition; isConflict?: boolean; error?: string } {
    const pr = requisitions.find(p => p.id === prId);
    if (!pr) return { success: false, error: 'Purchase Requisition not found.' };

    if (expectedVersion !== undefined && pr.version !== expectedVersion) {
      return {
        success: false,
        isConflict: true,
        error: `Optimistic concurrency conflict: Expected version ${expectedVersion}, but requisition is at version ${pr.version}.`
      };
    }

    if (pr.status === 'CONVERTED_TO_PO' || pr.status === 'CANCELLED') {
      return { success: false, error: `Requisition ${pr.prNumber} in status ${pr.status} cannot be cancelled.` };
    }

    const prevStatus = pr.status;
    pr.status = 'CANCELLED';
    pr.lines?.forEach(l => l.status = 'CANCELLED');
    pr.items?.forEach(i => i.status = 'CANCELLED');
    pr.version += 1;
    pr.updatedAt = new Date().toISOString();

    this.logAuditTrail(
      pr.tenantId,
      pr.companyId,
      'PR_CANCELLED',
      userId,
      userName,
      'PR',
      pr.id,
      pr.prNumber,
      `Requisition ${pr.prNumber} cancelled by ${userName}. Reason: ${reason}`,
      prevStatus,
      'CANCELLED',
      auditLogs,
      pr.branchId,
      pr.correlationId,
      pr.version
    );

    return { success: true, requisition: pr };
  }

  /**
   * Retrieve approval history & audit entries for a PR
   */
  static getApprovalHistory(
    prId: string,
    tenantId: string,
    requisitions: PurchaseRequisition[],
    auditLogs: PurchaseAuditRecord[]
  ): { approvalSteps: PurchaseApprovalStep[]; auditHistory: PurchaseAuditRecord[] } {
    const pr = requisitions.find(p => p.id === prId && p.tenantId === tenantId);
    const steps = pr?.approvalHistory || [];
    const logs = auditLogs.filter(
      a => a.tenantId === tenantId && a.targetDocumentType === 'PR' && a.targetDocumentId === prId
    );
    return { approvalSteps: steps, auditHistory: logs };
  }

  // ==================== 3. REQUEST FOR QUOTATION (RFQ) ENGINE ====================

  static createRFQFromRequisition(
    prId: string,
    invitedVendorIds: string[],
    closingDate: string,
    requisitions: PurchaseRequisition[],
    rfqs: RequestForQuotation[],
    auditLogs: PurchaseAuditRecord[],
    userId: string,
    userName: string
  ): { success: boolean; rfq?: RequestForQuotation; error?: string } {
    const pr = requisitions.find(p => p.id === prId);
    if (!pr) return { success: false, error: 'Purchase Requisition not found.' };

    if (pr.status !== 'APPROVED' && pr.status !== 'IN_RFQ') {
      return { success: false, error: `Cannot generate RFQ from PR in status ${pr.status}. PR must be APPROVED.` };
    }

    if (!invitedVendorIds || invitedVendorIds.length === 0) {
      return { success: false, error: 'At least one vendor must be invited for RFQ creation.' };
    }

    const rfqNumber = `RFQ-${new Date().getFullYear()}-${(rfqs.length + 1).toString().padStart(4, '0')}`;

    const rfqItems: RFQItem[] = pr.items.map((pi, idx) => ({
      id: `rfq-item-${Date.now()}-${idx}`,
      rfqId: '',
      prItemId: pi.id,
      itemSku: pi.itemSku,
      itemName: pi.itemName,
      requestedQty: pi.requestedQty,
      uom: pi.uom,
      targetUnitPrice: pi.estimatedUnitPrice,
      targetDeliveryDate: pi.requiredDate
    }));

    const newRfq: RequestForQuotation = {
      id: `rfq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: pr.tenantId,
      companyId: pr.companyId,
      rfqNumber,
      prId: pr.id,
      prNumber: pr.prNumber,
      title: `RFQ for ${pr.prNumber} - ${pr.departmentName || 'Procurement'}`,
      issuedDate: new Date().toISOString(),
      closingDate: closingDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      status: 'ISSUED',
      vendorIds: invitedVendorIds,
      items: rfqItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    rfqItems.forEach(i => i.rfqId = newRfq.id);
    rfqs.unshift(newRfq);

    pr.status = 'IN_RFQ';
    pr.items.forEach(i => i.status = 'IN_RFQ');

    this.logAuditTrail(
      newRfq.tenantId,
      newRfq.companyId,
      'RFQ_ISSUED',
      userId,
      userName,
      'RFQ',
      newRfq.id,
      newRfq.rfqNumber,
      `RFQ ${newRfq.rfqNumber} issued to ${invitedVendorIds.length} vendors based on PR ${pr.prNumber}`,
      'Draft',
      'Issued',
      auditLogs
    );

    return { success: true, rfq: newRfq };
  }

  // ==================== 4. VENDOR QUOTATION & COMPARISON MATRIX ====================

  static submitVendorQuotation(
    data: Partial<VendorQuotation>,
    items: Partial<VendorQuotationItem>[],
    quotations: VendorQuotation[],
    rfqs: RequestForQuotation[],
    auditLogs: PurchaseAuditRecord[],
    userId: string,
    userName: string
  ): { success: boolean; quotation?: VendorQuotation; error?: string } {
    if (!data.rfqId || !data.vendorId) {
      return { success: false, error: 'RFQ ID and Vendor ID are required to submit quotation.' };
    }

    const rfq = rfqs.find(r => r.id === data.rfqId);
    if (!rfq) return { success: false, error: 'Associated RFQ not found.' };

    const quotationNumber = `VQ-${data.vendorName?.slice(0, 4).toUpperCase() || 'VEN'}-${Date.now().toString().slice(-4)}`;

    const quoteItems: VendorQuotationItem[] = items.map((it, idx) => {
      const qty = it.offeredQty || 1;
      const unitP = it.unitPrice || 0;
      const disc = it.discountPercent || 0;
      const netUnit = unitP * (1 - disc / 100);
      const total = qty * netUnit;

      return {
        id: `vq-item-${Date.now()}-${idx}`,
        quotationId: '',
        rfqItemId: it.rfqItemId || '',
        itemSku: it.itemSku || '',
        itemName: it.itemName || it.itemSku || '',
        offeredQty: qty,
        uom: it.uom || 'PCS',
        unitPrice: unitP,
        taxRate: it.taxRate || 0,
        discountPercent: disc,
        totalPrice: total,
        deliveryDate: it.deliveryDate || new Date(Date.now() + 14 * 86400000).toISOString(),
        technicalScore: it.technicalScore || 90,
        commercialScore: it.commercialScore || 90
      };
    });

    const totalAmt = quoteItems.reduce((sum, i) => sum + i.totalPrice, 0);

    const newQuote: VendorQuotation = {
      id: `vq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: rfq.tenantId,
      companyId: rfq.companyId,
      quotationNumber,
      rfqId: rfq.id,
      rfqNumber: rfq.rfqNumber,
      vendorId: data.vendorId,
      vendorName: data.vendorName || 'Vendor Partner',
      quotationDate: new Date().toISOString(),
      validUntil: data.validUntil || new Date(Date.now() + 30 * 86400000).toISOString(),
      currency: data.currency || 'USD',
      exchangeRate: data.exchangeRate || 1.0,
      paymentTermsId: data.paymentTermsId || 'pterm-001',
      paymentTermsName: data.paymentTermsName || 'Net 30 Days',
      incotermsId: data.incotermsId || 'inco-001',
      incotermsCode: data.incotermsCode || 'FOB',
      deliveryLeadTimeDays: data.deliveryLeadTimeDays || 14,
      totalAmount: totalAmt,
      status: 'SUBMITTED',
      items: quoteItems,
      overallScore: Math.round(quoteItems.reduce((s, i) => s + (i.technicalScore! + i.commercialScore!) / 2, 0) / quoteItems.length),
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    };

    quoteItems.forEach(i => i.quotationId = newQuote.id);
    quotations.unshift(newQuote);

    rfq.status = 'RESPONSES_RECEIVED';

    this.logAuditTrail(
      newQuote.tenantId,
      newQuote.companyId,
      'QUOTATION_SUBMITTED',
      userId,
      userName,
      'QUOTATION',
      newQuote.id,
      newQuote.quotationNumber,
      `Quotation ${newQuote.quotationNumber} submitted by ${newQuote.vendorName} for RFQ ${rfq.rfqNumber}`,
      'Draft',
      'Submitted',
      auditLogs
    );

    return { success: true, quotation: newQuote };
  }

  static generateComparisonMatrix(
    rfqId: string,
    rfqs: RequestForQuotation[],
    quotations: VendorQuotation[]
  ): QuotationComparisonMatrixItem[] {
    const rfq = rfqs.find(r => r.id === rfqId);
    if (!rfq) return [];

    const rfqQuotes = quotations.filter(q => q.rfqId === rfqId);

    const matrixItems: QuotationComparisonMatrixItem[] = rfq.items.map(rfqItem => {
      const itemQuotes = rfqQuotes.map(q => {
        const qItem = q.items.find(i => i.rfqItemId === rfqItem.id || i.itemSku === rfqItem.itemSku);
        const unitP = qItem ? qItem.unitPrice : 0;
        const totalP = qItem ? qItem.totalPrice : 0;
        const tech = qItem?.technicalScore || 85;
        const comm = qItem?.commercialScore || 85;

        return {
          vendorId: q.vendorId,
          vendorName: q.vendorName,
          unitPrice: unitP,
          totalPrice: totalP,
          deliveryDate: qItem?.deliveryDate || new Date().toISOString(),
          leadTimeDays: q.deliveryLeadTimeDays,
          technicalScore: tech,
          commercialScore: comm,
          overallScore: Math.round((tech + comm) / 2),
          isSelected: q.status === 'SELECTED'
        };
      });

      // Find lowest price / highest score vendor
      const selectedQuote = itemQuotes.find(iq => iq.isSelected) || itemQuotes.sort((a, b) => b.overallScore - a.overallScore)[0];

      return {
        itemSku: rfqItem.itemSku,
        itemName: rfqItem.itemName,
        requestedQty: rfqItem.requestedQty,
        uom: rfqItem.uom,
        quotes: itemQuotes,
        winningVendorId: selectedQuote?.vendorId,
        winningVendorName: selectedQuote?.vendorName
      };
    });

    return matrixItems;
  }

  // ==================== 5. PURCHASE ORDER (PO) ENGINE ====================

  static createPurchaseOrder(
    data: Partial<PurchaseOrder>,
    items: Partial<PurchaseOrderItem>[],
    vendors: VendorMaster[],
    orders: PurchaseOrder[],
    approvalRules: PurchaseApprovalRule[],
    auditLogs: PurchaseAuditRecord[],
    userId: string,
    userName: string
  ): { success: boolean; order?: PurchaseOrder; error?: string } {
    if (!data.vendorId) {
      return { success: false, error: 'Vendor ID is mandatory for Purchase Order creation.' };
    }

    const vendor = vendors.find(v => v.id === data.vendorId);
    if (!vendor) return { success: false, error: 'Selected Vendor not found.' };

    if (vendor.status === 'BLOCKED') {
      return { success: false, error: `Vendor ${vendor.name} is BLOCKED and cannot receive Purchase Orders.` };
    }

    if (!items || items.length === 0) {
      return { success: false, error: 'Purchase Order must contain at least one line item.' };
    }

    const count = orders.length + 1;
    const poNumber = `PO-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;

    const poItems: PurchaseOrderItem[] = items.map((it, idx) => {
      const qty = it.orderedQty || 1;
      const unitP = it.unitPrice || 0;
      const taxR = it.taxRate || 0;
      const discP = it.discountPercent || 0;

      const netUnit = unitP * (1 - discP / 100);
      const totalNet = qty * netUnit;
      const taxAmt = totalNet * (taxR / 100);
      const lineTotal = totalNet + taxAmt;

      return {
        id: `po-item-${Date.now()}-${idx}`,
        poId: '',
        itemSku: it.itemSku!,
        itemName: it.itemName || it.itemSku!,
        description: it.description || '',
        warehouseId: it.warehouseId || 'wh-001',
        warehouseName: it.warehouseName || 'Main Warehouse',
        orderedQty: qty,
        receivedQty: 0,
        returnedQty: 0,
        openQty: qty,
        uom: it.uom || 'PCS',
        unitPrice: unitP,
        taxRate: taxR,
        taxAmount: taxAmt,
        discountPercent: discP,
        discountAmount: (unitP * qty) - totalNet,
        netUnitPrice: netUnit,
        totalAmount: lineTotal,
        requiredDeliveryDate: it.requiredDeliveryDate || new Date(Date.now() + 14 * 86400000).toISOString(),
        status: 'OPEN'
      };
    });

    const subtotal = poItems.reduce((s, i) => s + (i.orderedQty * i.unitPrice), 0);
    const discTotal = poItems.reduce((s, i) => s + i.discountAmount, 0);
    const taxTotal = poItems.reduce((s, i) => s + i.taxAmount, 0);
    const totalAmt = poItems.reduce((s, i) => s + i.totalAmount, 0);

    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: data.tenantId || 'ten-001',
      companyId: data.companyId || 'comp-001',
      branchId: data.branchId || 'br-001',
      poNumber,
      vendorId: vendor.id,
      vendorCode: vendor.code,
      vendorName: vendor.name,
      prId: data.prId || '',
      prNumber: data.prNumber || '',
      rfqId: data.rfqId || '',
      rfqNumber: data.rfqNumber || '',
      purchasingOrgId: data.purchasingOrgId || vendor.purchasingOrgId || 'porg-001',
      buyerGroupId: data.buyerGroupId || 'bg-001',
      poDate: new Date().toISOString(),
      expectedDeliveryDate: data.expectedDeliveryDate || new Date(Date.now() + 14 * 86400000).toISOString(),
      paymentTermsId: vendor.paymentTermsId,
      paymentTermsName: vendor.paymentTermsName,
      incotermsId: vendor.incotermsId,
      incotermsCode: vendor.incotermsCode,
      currency: data.currency || vendor.currency || 'USD',
      exchangeRate: data.exchangeRate || 1.0,
      items: poItems,
      subtotalAmount: subtotal,
      taxAmount: taxTotal,
      discountAmount: discTotal,
      totalAmount: totalAmt,
      baseCurrencyTotal: totalAmt * (data.exchangeRate || 1.0),
      status: 'DRAFT',
      approvalStatus: 'PENDING',
      approvalLevel: 1,
      version: 1,
      currentVersion: 1,
      amendmentCount: 0,
      notes: data.notes || '',
      createdBy: userId,
      createdByName: userName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    poItems.forEach(i => i.poId = newPo.id);
    orders.unshift(newPo);

    this.logAuditTrail(
      newPo.tenantId,
      newPo.companyId,
      'PO_CREATED',
      userId,
      userName,
      'PO',
      newPo.id,
      newPo.poNumber,
      `Purchase Order ${newPo.poNumber} created for ${vendor.name} ($${totalAmt.toLocaleString()})`,
      'Draft',
      'Draft',
      auditLogs
    );

    return { success: true, order: newPo };
  }

  // ==================== 6. PURCHASE APPROVAL WORKFLOW ENGINE ====================

  static approvePurchaseOrder(
    poId: string,
    approverRole: UserRole,
    approverUserId: string,
    approverName: string,
    orders: PurchaseOrder[],
    approvalRules: PurchaseApprovalRule[],
    auditLogs: PurchaseAuditRecord[]
  ): { success: boolean; order?: PurchaseOrder; error?: string } {
    const po = orders.find(p => p.id === poId);
    if (!po) return { success: false, error: 'Purchase Order not found.' };

    if (po.status !== 'DRAFT' && po.status !== 'PENDING_APPROVAL') {
      return { success: false, error: `Purchase Order ${po.poNumber} is in status ${po.status} and cannot be approved.` };
    }

    // Check approval threshold rules
    const rules = approvalRules.filter(r => 
      r.documentType === 'PO' && 
      r.isActive && 
      po.totalAmount >= r.minAmount && 
      po.totalAmount <= r.maxAmount
    ).sort((a, b) => a.stepNumber - b.stepNumber);

    const requiredMaxLevel = rules.length > 0 ? Math.max(...rules.map(r => r.stepNumber)) : 1;

    if (po.approvalLevel < requiredMaxLevel) {
      po.approvalLevel += 1;
      po.status = 'PENDING_APPROVAL';
      po.approvalStatus = 'PENDING';
    } else {
      po.status = 'ISSUED_TO_VENDOR';
      po.approvalStatus = 'APPROVED';
    }

    po.updatedAt = new Date().toISOString();

    this.logAuditTrail(
      po.tenantId,
      po.companyId,
      'PO_APPROVED',
      approverUserId,
      approverName,
      'PO',
      po.id,
      po.poNumber,
      `Purchase Order ${po.poNumber} approved by ${approverName} (${approverRole}). Status: ${po.status}`,
      'PendingApproval',
      po.status,
      auditLogs
    );

    return { success: true, order: po };
  }

  // ==================== 7. PURCHASE AMENDMENTS & VERSIONING ENGINE ====================

  static amendPurchaseOrder(
    poId: string,
    amendmentReason: string,
    updatedFields: Partial<PurchaseOrder>,
    updatedItems: Partial<PurchaseOrderItem>[],
    orders: PurchaseOrder[],
    amendments: PurchaseOrderAmendment[],
    auditLogs: PurchaseAuditRecord[],
    userId: string,
    userName: string
  ): { success: boolean; amendment?: PurchaseOrderAmendment; order?: PurchaseOrder; error?: string } {
    const po = orders.find(p => p.id === poId);
    if (!po) return { success: false, error: 'Purchase Order not found.' };

    if (!amendmentReason || amendmentReason.trim().length === 0) {
      return { success: false, error: 'Mandatory reason required for PO Amendment governance.' };
    }

    // Capture snapshot of previous version
    const snapshot: Partial<PurchaseOrder> = JSON.parse(JSON.stringify(po));
    const previousTotal = po.totalAmount;

    po.amendmentCount += 1;
    po.currentVersion += 1;

    // Apply item changes if provided
    if (updatedItems && updatedItems.length > 0) {
      const newPoItems: PurchaseOrderItem[] = updatedItems.map((it, idx) => {
        const qty = it.orderedQty || 1;
        const unitP = it.unitPrice || 0;
        const discP = it.discountPercent || 0;
        const taxR = it.taxRate || 0;

        const netUnit = unitP * (1 - discP / 100);
        const totalNet = qty * netUnit;
        const taxAmt = totalNet * (taxR / 100);
        const lineTotal = totalNet + taxAmt;

        return {
          id: `po-item-${Date.now()}-${idx}`,
          poId: po.id,
          itemSku: it.itemSku!,
          itemName: it.itemName || it.itemSku!,
          description: it.description || '',
          warehouseId: it.warehouseId || 'wh-001',
          warehouseName: it.warehouseName || 'Main Warehouse',
          orderedQty: qty,
          receivedQty: it.receivedQty || 0,
          returnedQty: it.returnedQty || 0,
          openQty: Math.max(0, qty - (it.receivedQty || 0)),
          uom: it.uom || 'PCS',
          unitPrice: unitP,
          taxRate: taxR,
          taxAmount: taxAmt,
          discountPercent: discP,
          discountAmount: (unitP * qty) - totalNet,
          netUnitPrice: netUnit,
          totalAmount: lineTotal,
          requiredDeliveryDate: it.requiredDeliveryDate || new Date().toISOString(),
          status: (it.receivedQty || 0) >= qty ? 'FULFILLED' : (it.receivedQty || 0) > 0 ? 'PARTIAL' : 'OPEN'
        };
      });

      po.items = newPoItems;
      po.subtotalAmount = newPoItems.reduce((s, i) => s + (i.orderedQty * i.unitPrice), 0);
      po.taxAmount = newPoItems.reduce((s, i) => s + i.taxAmount, 0);
      po.discountAmount = newPoItems.reduce((s, i) => s + i.discountAmount, 0);
      po.totalAmount = newPoItems.reduce((s, i) => s + i.totalAmount, 0);
      po.baseCurrencyTotal = po.totalAmount * po.exchangeRate;
    }

    if (updatedFields.notes) po.notes = updatedFields.notes;
    po.status = 'PENDING_APPROVAL';
    po.approvalStatus = 'PENDING';
    po.updatedAt = new Date().toISOString();

    const amdNumber = `AMD-${po.poNumber}-V${po.currentVersion}`;

    const amdRecord: PurchaseOrderAmendment = {
      id: `amd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      poId: po.id,
      poNumber: po.poNumber,
      amendmentNumber: amdNumber,
      version: po.currentVersion,
      requestedBy: userId,
      requestedByName: userName,
      requestedDate: new Date().toISOString(),
      amendmentReason,
      changesDescription: `Version updated from v${snapshot.currentVersion} to v${po.currentVersion}. Total changed from $${previousTotal.toLocaleString()} to $${po.totalAmount.toLocaleString()}`,
      previousTotalAmount: previousTotal,
      newTotalAmount: po.totalAmount,
      status: 'APPROVED', // Auto-approved for verified manager amendments
      snapshotData: snapshot,
      createdAt: new Date().toISOString()
    };

    amendments.unshift(amdRecord);

    this.logAuditTrail(
      po.tenantId,
      po.companyId,
      'PO_AMENDED',
      userId,
      userName,
      'AMENDMENT',
      amdRecord.id,
      amdNumber,
      `PO ${po.poNumber} amended (v${po.currentVersion}). Reason: ${amendmentReason}`,
      `v${snapshot.currentVersion}`,
      `v${po.currentVersion}`,
      auditLogs
    );

    return { success: true, amendment: amdRecord, order: po };
  }

  // ==================== 8. PARTIAL DELIVERIES & GOODS RECEIPT INTEGRATION ====================

  static recordPartialDelivery(
    poId: string,
    receivedLines: { poItemId: string; itemSku: string; quantityReceived: number }[],
    orders: PurchaseOrder[],
    auditLogs: PurchaseAuditRecord[],
    userId: string,
    userName: string
  ): { success: boolean; result?: PartialDeliveryReceiptResult; error?: string } {
    const po = orders.find(p => p.id === poId);
    if (!po) return { success: false, error: 'Purchase Order not found.' };

    if (po.status === 'CLOSED' || po.status === 'CANCELLED') {
      return { success: false, error: `Cannot receive goods against PO in status ${po.status}.` };
    }

    const receiptNumber = `GRN-${po.poNumber.replace('PO-', '')}-${Date.now().toString().slice(-4)}`;
    const lineResults = [];

    for (const line of receivedLines) {
      const item = po.items.find(i => i.id === line.poItemId || i.itemSku === line.itemSku);
      if (!item) continue;

      if (line.quantityReceived <= 0) continue;

      if (line.quantityReceived > item.openQty) {
        return { 
          success: false, 
          error: `Over-delivery error for ${item.itemSku}: Received qty (${line.quantityReceived}) exceeds open qty (${item.openQty}).` 
        };
      }

      const prevReceived = item.receivedQty;
      item.receivedQty += line.quantityReceived;
      item.openQty = Math.max(0, item.orderedQty - item.receivedQty);

      if (item.openQty === 0) {
        item.status = 'FULFILLED';
      } else {
        item.status = 'PARTIAL';
      }

      lineResults.push({
        itemSku: item.itemSku,
        orderedQty: item.orderedQty,
        previouslyReceivedQty: prevReceived,
        newlyReceivedQty: line.quantityReceived,
        remainingOpenQty: item.openQty,
        status: item.status
      });
    }

    // Evaluate overall PO status
    const allFulfilled = po.items.every(i => i.openQty === 0);
    const anyReceived = po.items.some(i => i.receivedQty > 0);

    if (allFulfilled) {
      po.status = 'FULLY_RECEIVED';
    } else if (anyReceived) {
      po.status = 'PARTIALLY_RECEIVED';
    }

    po.updatedAt = new Date().toISOString();

    const result: PartialDeliveryReceiptResult = {
      poId: po.id,
      poNumber: po.poNumber,
      goodsReceiptId: `grn-${Date.now()}`,
      goodsReceiptNumber: receiptNumber,
      receivedItems: lineResults,
      overallPOStatus: po.status,
      financialEventId: `EVT_PURCHASE_GRN_${receiptNumber}`,
      postedAt: new Date().toISOString()
    };

    this.logAuditTrail(
      po.tenantId,
      po.companyId,
      allFulfilled ? 'FULL_RECEIPT_POSTED' : 'PARTIAL_RECEIPT_POSTED',
      userId,
      userName,
      'RECEIPT',
      result.goodsReceiptId,
      receiptNumber,
      `Goods Receipt ${receiptNumber} posted for PO ${po.poNumber}. Overall PO status: ${po.status}`,
      'IssuedToVendor',
      po.status,
      auditLogs
    );

    return { success: true, result };
  }

  // ==================== 9. VENDOR RETURNS ENGINE ====================

  static createVendorReturn(
    poId: string,
    reason: 'DEFECTIVE' | 'OVER_DELIVERY' | 'WRONG_SPECIFICATION' | 'DAMAGED_IN_TRANSIT' | 'OTHER',
    returnItems: Partial<VendorReturnItem>[],
    orders: PurchaseOrder[],
    returns: VendorReturnNote[],
    auditLogs: PurchaseAuditRecord[],
    userId: string,
    userName: string
  ): { success: boolean; returnNote?: VendorReturnNote; error?: string } {
    const po = orders.find(p => p.id === poId);
    if (!po) return { success: false, error: 'Purchase Order not found.' };

    if (!returnItems || returnItems.length === 0) {
      return { success: false, error: 'Vendor Return must contain at least one line item.' };
    }

    const returnNumber = `VRN-${new Date().getFullYear()}-${(returns.length + 1).toString().padStart(4, '0')}`;

    const items: VendorReturnItem[] = returnItems.map((it, idx) => {
      const poItem = po.items.find(i => i.itemSku === it.itemSku);
      const qty = it.returnedQty || 1;
      const unitCost = it.unitCost || poItem?.netUnitPrice || 0;

      if (poItem) {
        poItem.returnedQty += qty;
      }

      return {
        id: `vr-item-${Date.now()}-${idx}`,
        returnId: '',
        poItemId: poItem?.id || '',
        itemSku: it.itemSku!,
        itemName: it.itemName || poItem?.itemName || it.itemSku!,
        returnedQty: qty,
        uom: it.uom || poItem?.uom || 'PCS',
        unitCost,
        totalCost: qty * unitCost,
        batchNumber: it.batchNumber || '',
        serialNumber: it.serialNumber || '',
        reason: it.reason || reason
      };
    });

    const totalAmt = items.reduce((s, i) => s + i.totalCost, 0);

    const newReturn: VendorReturnNote = {
      id: `vrn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: po.tenantId,
      companyId: po.companyId,
      branchId: po.branchId,
      returnNumber,
      poId: po.id,
      poNumber: po.poNumber,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      warehouseId: po.items[0]?.warehouseId || 'wh-001',
      warehouseName: po.items[0]?.warehouseName || 'Main Warehouse',
      returnDate: new Date().toISOString(),
      reason,
      items,
      totalReturnAmount: totalAmt,
      status: 'APPROVED',
      financialQueueRef: `EVT_VENDOR_RETURN_${returnNumber}`,
      createdBy: userId,
      createdByName: userName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    items.forEach(i => i.returnId = newReturn.id);
    returns.unshift(newReturn);

    this.logAuditTrail(
      po.tenantId,
      po.companyId,
      'VENDOR_RETURN_APPROVED',
      userId,
      userName,
      'RETURN',
      newReturn.id,
      newReturn.returnNumber,
      `Vendor Return ${newReturn.returnNumber} created against PO ${po.poNumber} for ${po.vendorName} (Amount: $${totalAmt.toLocaleString()})`,
      'Draft',
      'Approved',
      auditLogs
    );

    return { success: true, returnNote: newReturn };
  }

  // ==================== 10. PURCHASE DOCUMENT AUDIT TRAIL ENGINE ====================

  static logAuditTrail(
    tenantId: string,
    companyId: string,
    actionType: PurchaseAuditAction,
    performedBy: string,
    performedByName: string,
    targetDocumentType: 'PR' | 'RFQ' | 'QUOTATION' | 'PO' | 'AMENDMENT' | 'RECEIPT' | 'RETURN',
    targetDocumentId: string,
    targetDocumentNumber: string,
    details: string,
    previousState: string,
    newState: string,
    auditLogs: PurchaseAuditRecord[],
    branchId?: string,
    correlationId?: string,
    version?: number,
    reason?: string
  ): PurchaseAuditRecord {
    const record: PurchaseAuditRecord = {
      id: `paudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      auditId: `paudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      companyId,
      branchId,
      actionType,
      performedBy,
      performedByName,
      performedAt: new Date().toISOString(),
      targetDocumentType,
      targetDocumentId,
      targetDocumentNumber,
      details,
      previousState,
      newState,
      reason,
      correlationId,
      version,
      immutableHash: `HASH-PAUDIT-${Date.now()}-${targetDocumentNumber}`
    };

    auditLogs.unshift(record);
    return record;
  }
}
