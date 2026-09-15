/**
 * AM Enterprise ERP - Supplier Invitation Engine (Phase 3.2B-02)
 * Enterprise Standard Aligned with SAP S/4HANA Sourcing & Oracle Supplier Portal
 */

import {
  RequestForQuotation,
  RFQSupplierInvitation,
  RFQInvitationStatus,
  PurchaseAuditRecord,
  VendorMaster
} from '../types/procurement';
import { INITIAL_VENDORS } from '../data/mockDatabase';
import { WorkflowEngine } from './workflowEngine';
import { RFQUserContext } from './rfqEngine';

export class SupplierInvitationEngine {
  private static liveVendorProvider?: () => VendorMaster[];

  public static setLiveVendorProvider(provider: () => VendorMaster[]): void {
    this.liveVendorProvider = provider;
  }

  /**
   * Validate supplier eligibility for sourcing
   */
  static validateSupplierEligibility(
    supplierId: string,
    tenantId: string,
    companyId?: string,
    customVendors?: VendorMaster[]
  ): { eligible: boolean; supplier?: any; error?: string } {
    const vendorsList = customVendors || (this.liveVendorProvider ? this.liveVendorProvider() : (INITIAL_VENDORS as any[]));
    let matched = vendorsList.find(
      (s: any) => (s.id === supplierId || s.code === supplierId) && s.tenantId === tenantId
    );

    if (matched) {
      const isInactive = matched.status === 'INACTIVE' || matched.status === 'BLOCKED' || matched.active === false;
      if (isInactive) {
        return { eligible: false, error: `Supplier '${matched.name}' (${matched.code}) is inactive in Master Data.` };
      }
      return { eligible: true, supplier: matched };
    }

    return { eligible: false, error: `Supplier '${supplierId}' not found in tenant supplier registry.` };
  }

  /**
   * Invite one or more suppliers to an RFQ
   */
  static inviteSuppliers(
    rfqId: string,
    supplierIds: string[],
    responseDeadline: string | undefined,
    rfqs: RequestForQuotation[],
    invitations: RFQSupplierInvitation[],
    auditLogs: PurchaseAuditRecord[],
    context: RFQUserContext,
    expectedVersion?: number,
    customVendors?: VendorMaster[]
  ): { success: boolean; invitations?: RFQSupplierInvitation[]; isConflict?: boolean; error?: string } {
    const rfq = rfqs.find(r => r.id === rfqId && r.tenantId === context.tenantId);
    if (!rfq) return { success: false, error: 'RFQ not found.' };

    // Optimistic Concurrency Check
    if (expectedVersion !== undefined && rfq.version !== expectedVersion) {
      return {
        success: false,
        isConflict: true,
        error: `Optimistic concurrency conflict on RFQ ${rfq.rfqNumber} (Version: ${rfq.version}, Expected: ${expectedVersion}).`
      };
    }

    if (rfq.status === 'AWARDED' || rfq.status === 'CLOSED' || rfq.status === 'CANCELLED') {
      return { success: false, error: `Cannot invite suppliers to RFQ in status '${rfq.status}'.` };
    }

    if (!supplierIds || supplierIds.length === 0) {
      return { success: false, error: 'At least one supplier ID is required for invitation.' };
    }

    const deadline = responseDeadline || rfq.closingDate || new Date(Date.now() + 14 * 86400000).toISOString();
    const newInvitations: RFQSupplierInvitation[] = [];
    const rfqExistingInvites = invitations.filter(i => i.rfqId === rfqId);

    for (const supId of supplierIds) {
      // Check duplicate invitation on this RFQ
      const alreadyInvited = rfqExistingInvites.some(
        i => (i.supplierId === supId || i.supplierCode === supId) && i.invitationStatus !== 'CANCELLED'
      );
      if (alreadyInvited) {
        return { success: false, error: `Supplier '${supId}' has already been invited to RFQ ${rfq.rfqNumber}.` };
      }

      // Eligibility validation
      const eligRes = this.validateSupplierEligibility(supId, context.tenantId, context.companyId, customVendors);
      if (!eligRes.eligible || !eligRes.supplier) {
        return { success: false, error: eligRes.error || `Supplier '${supId}' is not eligible for invitation.` };
      }

      const supplier = eligRes.supplier;
      const inviteId = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const invitation: RFQSupplierInvitation = {
        id: inviteId,
        rfqId: rfq.id,
        tenantId: rfq.tenantId,
        companyId: rfq.companyId,
        branchId: rfq.branchId,
        supplierId: supplier.id,
        supplierCode: supplier.code,
        supplierName: supplier.name,
        supplierEmail: supplier.email || `${supplier.code.toLowerCase()}@vendorportal.com`,
        invitedAt: new Date().toISOString(),
        invitedBy: context.userId,
        invitedByName: context.userName,
        responseDeadline: deadline,
        invitationStatus: 'INVITED'
      };

      newInvitations.push(invitation);
      invitations.push(invitation);

      // Add to RFQ vendorIds array for legacy compatibility
      if (!rfq.vendorIds) rfq.vendorIds = [];
      if (!rfq.vendorIds.includes(supplier.id)) {
        rfq.vendorIds.push(supplier.id);
      }

      if (!rfq.invitations) rfq.invitations = [];
      rfq.invitations.push(invitation);
    }

    const prevStatus = rfq.status;
    if (rfq.status === 'DRAFT' || rfq.status === 'APPROVED') {
      rfq.status = 'PUBLISHED';
    }
    rfq.version = (rfq.version || 1) + 1;
    rfq.updatedAt = new Date().toISOString();

    const timestamp = new Date().toISOString();
    const hash = WorkflowEngine.generateDigitalSignature(rfq.id, rfq.rfqNumber, context.userId, timestamp);

    auditLogs.unshift({
      id: `aud-inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: rfq.tenantId,
      companyId: rfq.companyId,
      branchId: rfq.branchId,
      actionType: 'RFQ_INVITATIONS_SENT',
      performedBy: context.userId,
      performedByName: context.userName,
      performedAt: timestamp,
      targetDocumentType: 'RFQ',
      targetDocumentId: rfq.id,
      targetDocumentNumber: rfq.rfqNumber,
      details: `Invited ${newInvitations.length} suppliers to RFQ ${rfq.rfqNumber}. Response deadline: ${deadline}.`,
      previousState: prevStatus,
      newState: rfq.status,
      version: rfq.version,
      immutableHash: hash
    });

    return { success: true, invitations: newInvitations };
  }

  /**
   * Record supplier decline response
   */
  static recordSupplierDecline(
    rfqId: string,
    supplierId: string,
    reason: string,
    rfqs: RequestForQuotation[],
    invitations: RFQSupplierInvitation[],
    auditLogs: PurchaseAuditRecord[],
    context: RFQUserContext
  ): { success: boolean; invitation?: RFQSupplierInvitation; error?: string } {
    const rfq = rfqs.find(r => r.id === rfqId && r.tenantId === context.tenantId);
    if (!rfq) return { success: false, error: 'RFQ not found.' };

    const invite = invitations.find(
      i => i.rfqId === rfqId && (i.supplierId === supplierId || i.supplierCode === supplierId)
    );
    if (!invite) {
      return { success: false, error: `Invitation for supplier '${supplierId}' on RFQ ${rfq.rfqNumber} not found.` };
    }

    invite.invitationStatus = 'DECLINED';
    invite.declinedAt = new Date().toISOString();
    invite.declineReason = reason || 'Declined to participate.';

    // Synchronize rfq.invitations if present
    if (rfq.invitations) {
      const rfqInv = rfq.invitations.find(i => i.id === invite.id);
      if (rfqInv) {
        rfqInv.invitationStatus = 'DECLINED';
        rfqInv.declinedAt = invite.declinedAt;
        rfqInv.declineReason = invite.declineReason;
      }
    }

    const timestamp = new Date().toISOString();
    const hash = WorkflowEngine.generateDigitalSignature(rfq.id, invite.id, context.userId, timestamp);

    auditLogs.unshift({
      id: `aud-dec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: rfq.tenantId,
      companyId: rfq.companyId,
      branchId: rfq.branchId,
      actionType: 'RFQ_SUPPLIER_DECLINED',
      performedBy: context.userId,
      performedByName: context.userName,
      performedAt: timestamp,
      targetDocumentType: 'RFQ',
      targetDocumentId: rfq.id,
      targetDocumentNumber: rfq.rfqNumber,
      details: `Supplier ${invite.supplierName} declined RFQ ${rfq.rfqNumber}. Reason: ${invite.declineReason}`,
      previousState: 'INVITED',
      newState: 'DECLINED',
      version: rfq.version,
      immutableHash: hash
    });

    return { success: true, invitation: invite };
  }

  /**
   * List invitations for an RFQ
   */
  static listInvitations(
    rfqId: string,
    tenantId: string,
    invitations: RFQSupplierInvitation[]
  ): RFQSupplierInvitation[] {
    return invitations.filter(i => i.rfqId === rfqId && i.tenantId === tenantId);
  }
}
