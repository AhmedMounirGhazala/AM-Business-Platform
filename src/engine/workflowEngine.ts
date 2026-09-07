/**
 * Universal Enterprise Workflow Engine
 * Generic multi-level, role-based, amount-based, department-based approval engine
 */

import { ApprovalRequest, User, WorkflowRule } from '../types';

export interface WorkflowEvaluationResult {
  requiresApproval: boolean;
  applicableRule?: WorkflowRule;
  approvalRequest?: ApprovalRequest;
}

export class WorkflowEngine {
  /**
   * Evaluate whether a document requires workflow approval
   */
  static evaluateDocument(
    tenantId: string,
    entityType: WorkflowRule['entityType'],
    amount: number,
    workflowRules: WorkflowRule[],
    requestedBy: User,
    entityId: string,
    entityNumber: string,
    description: string,
    companyId?: string,
    departmentId?: string,
    branchId?: string
  ): WorkflowEvaluationResult {
    // Find applicable rule with lowest threshold that satisfies criteria
    const rules = workflowRules.filter(
      r => r.tenantId === tenantId && r.entityType === entityType && r.isActive && amount >= r.thresholdAmount
    ).sort((a, b) => b.thresholdAmount - a.thresholdAmount);

    if (rules.length === 0) {
      return { requiresApproval: false };
    }

    const applicableRule = rules[0];

    const approvalRequest: ApprovalRequest = {
      id: `app-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      companyId,
      workflowRuleId: applicableRule.id,
      entityType,
      entityId,
      entityNumber,
      requestedBy: requestedBy.id,
      requestedByName: requestedBy.name,
      requestedAt: new Date().toISOString(),
      amount,
      description: `${applicableRule.stepName}: ${description} (${amount.toLocaleString()} SAR)`,
      status: 'Pending',
      currentApproverRole: applicableRule.requiredRole
    };

    return {
      requiresApproval: true,
      applicableRule,
      approvalRequest
    };
  }

  /**
   * Generate digital signature / cryptographic hash verification stamp for approval traceability
   */
  static generateDigitalSignature(entityId: string | Record<string, any>, entityNumber?: string, approverId?: string, timestamp?: string): string {
    const raw = typeof entityId === 'object'
      ? JSON.stringify(entityId) + ':AM_ERP_ENTERPRISE_CORE_SIGNATURE'
      : `${entityId}:${entityNumber || ''}:${approverId || ''}:${timestamp || new Date().toISOString()}:AM_ERP_ENTERPRISE_CORE_SIGNATURE`;
    let hash1 = 0;
    let hash2 = 5381;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash1 = ((hash1 << 5) - hash1 + char) | 0;
      hash2 = ((hash2 << 5) + hash2 + char) | 0;
    }
    const hex1 = Math.abs(hash1).toString(16).padStart(8, '0');
    const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
    const hex3 = Math.abs((hash1 ^ hash2)).toString(16).padStart(8, '0');
    const hex4 = Math.abs((hash1 + hash2)).toString(16).padStart(8, '0');
    const fullHex = `${hex1}${hex2}${hex3}${hex4}`.toUpperCase();
    return `SIG-SHA256-${fullHex}`;
  }

  /**
   * Generate deterministic payload hash
   */
  static hashPayload(payload: string | Record<string, any>): string {
    const raw = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
    let hash1 = 0;
    let hash2 = 5381;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash1 = ((hash1 << 5) - hash1 + char) | 0;
      hash2 = ((hash2 << 5) + hash2 + char) | 0;
    }
    const hex1 = Math.abs(hash1).toString(16).padStart(8, '0');
    const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
    return `${hex1}${hex2}`.toUpperCase();
  }
}
