/**
 * AM ERP — Enterprise Procurement Budget Engine
 * Architecture Baseline: v2.8 (Phase 3.2B-01)
 * Evaluates purchase requisition budgets across Company, Branch, Department, Cost Center, Profit Center, and Project.
 * Implements explainable budget validation, policy enforcement (NONE, WARNING, SOFT_BLOCK, HARD_BLOCK),
 * and commitment tracking without direct GL mutation.
 */

import {
  ProcurementBudgetCheckResult,
  ProcurementBudgetCheckStatus,
  ProcurementBudgetPolicy,
  PurchaseRequisition
} from '../types/procurement';
import { Project, Department, CostCenter } from '../types';

export interface BudgetConfigEntry {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  departmentId?: string;
  costCenterId?: string;
  profitCenterId?: string;
  projectId?: string;
  fiscalYear: number;
  allocatedAmount: number;
  warningThresholdPercent: number; // e.g. 80 for 80%
  policy: ProcurementBudgetPolicy;
  active: boolean;
}

// Initial In-Memory Budget Configurations
const INITIAL_BUDGET_CONFIGS: BudgetConfigEntry[] = [
  // Project Budgets
  {
    id: 'bcfg-prj-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    projectId: 'prj-001',
    fiscalYear: 2026,
    allocatedAmount: 1500000,
    warningThresholdPercent: 85,
    policy: 'HARD_BLOCK',
    active: true
  },
  {
    id: 'bcfg-prj-002',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    projectId: 'prj-002',
    fiscalYear: 2026,
    allocatedAmount: 850000,
    warningThresholdPercent: 80,
    policy: 'SOFT_BLOCK',
    active: true
  },
  // Cost Center Budgets
  {
    id: 'bcfg-cc-002',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    costCenterId: 'cc-002',
    departmentId: 'dept-02',
    fiscalYear: 2026,
    allocatedAmount: 500000,
    warningThresholdPercent: 80,
    policy: 'HARD_BLOCK',
    active: true
  },
  {
    id: 'bcfg-cc-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    costCenterId: 'cc-001',
    departmentId: 'dept-01',
    fiscalYear: 2026,
    allocatedAmount: 250000,
    warningThresholdPercent: 90,
    policy: 'WARNING',
    active: true
  },
  {
    id: 'bcfg-cc-003',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    costCenterId: 'cc-003',
    departmentId: 'dept-04',
    fiscalYear: 2026,
    allocatedAmount: 350000,
    warningThresholdPercent: 85,
    policy: 'NONE',
    active: true
  },
  // Default Company/General Fallback
  {
    id: 'bcfg-comp-001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    fiscalYear: 2026,
    allocatedAmount: 5000000,
    warningThresholdPercent: 85,
    policy: 'WARNING',
    active: true
  }
];

export class ProcurementBudgetEngine {
  private static budgetConfigs: BudgetConfigEntry[] = [...INITIAL_BUDGET_CONFIGS];

  public static getBudgetConfigs(tenantId: string, companyId?: string): BudgetConfigEntry[] {
    return this.budgetConfigs.filter(b => b.tenantId === tenantId && (!companyId || b.companyId === companyId) && b.active);
  }

  public static registerBudgetConfig(config: Omit<BudgetConfigEntry, 'id'>): BudgetConfigEntry {
    const entry: BudgetConfigEntry = {
      ...config,
      id: `bcfg-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    this.budgetConfigs.push(entry);
    return entry;
  }

  public static resetBudgetConfigs(): void {
    this.budgetConfigs = [...INITIAL_BUDGET_CONFIGS];
  }

  /**
   * Evaluate budget for a Purchase Requisition
   */
  public static evaluateRequisitionBudget(
    requisition: Partial<PurchaseRequisition>,
    existingRequisitions: PurchaseRequisition[] = [],
    customAllocatedAmount?: number,
    customPolicy?: ProcurementBudgetPolicy
  ): ProcurementBudgetCheckResult {
    const tenantId = requisition.tenantId || 'ten-001';
    const companyId = requisition.companyId || 'comp-001';
    const branchId = requisition.branchId;
    const departmentId = requisition.departmentId;
    const costCenterId = requisition.costCenterId;
    const profitCenterId = requisition.profitCenterId;
    const projectId = requisition.projectId;
    const requestedAmount = Number(requisition.totalEstimatedAmount || 0);
    const now = new Date().toISOString();
    const fiscalYear = new Date(requisition.requiredDate || now).getFullYear() || 2026;

    if (requestedAmount < 0 || isNaN(requestedAmount)) {
      return {
        id: `bchk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        requisitionId: requisition.id,
        tenantId,
        companyId,
        branchId,
        departmentId,
        costCenterId,
        profitCenterId,
        projectId,
        fiscalPeriod: `FY-${fiscalYear}`,
        allocatedBudget: 0,
        consumedBudget: 0,
        committedBudget: 0,
        availableBudget: 0,
        requestedAmount,
        variance: -requestedAmount,
        status: 'BUDGET_CHECK_FAILED',
        policy: 'HARD_BLOCK',
        isBlocked: true,
        reason: `Invalid requested requisition amount: ${requestedAmount}`,
        evaluatedAt: now
      };
    }

    // 1. Resolve matching budget configuration (Project -> Cost Center -> Department -> Company)
    let matchingConfig: BudgetConfigEntry | undefined;

    if (projectId) {
      matchingConfig = this.budgetConfigs.find(
        c => c.tenantId === tenantId && c.companyId === companyId && c.projectId === projectId && c.active
      );
    }
    if (!matchingConfig && costCenterId) {
      matchingConfig = this.budgetConfigs.find(
        c => c.tenantId === tenantId && c.companyId === companyId && c.costCenterId === costCenterId && c.active
      );
    }
    if (!matchingConfig && departmentId) {
      matchingConfig = this.budgetConfigs.find(
        c => c.tenantId === tenantId && c.companyId === companyId && c.departmentId === departmentId && c.active
      );
    }
    if (!matchingConfig) {
      matchingConfig = this.budgetConfigs.find(
        c => c.tenantId === tenantId && c.companyId === companyId && !c.projectId && !c.costCenterId && !c.departmentId && c.active
      );
    }

    const allocatedBudget = customAllocatedAmount !== undefined 
      ? customAllocatedAmount 
      : (matchingConfig ? matchingConfig.allocatedAmount : 0);

    const policy: ProcurementBudgetPolicy = customPolicy !== undefined
      ? customPolicy
      : (matchingConfig ? matchingConfig.policy : (requisition.budgetPolicy || 'NONE'));

    if (!matchingConfig && customAllocatedAmount === undefined) {
      return {
        id: `bchk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        requisitionId: requisition.id,
        tenantId,
        companyId,
        branchId,
        departmentId,
        costCenterId,
        profitCenterId,
        projectId,
        fiscalPeriod: `FY-${fiscalYear}`,
        allocatedBudget: 0,
        consumedBudget: 0,
        committedBudget: 0,
        availableBudget: 0,
        requestedAmount,
        variance: -requestedAmount,
        status: 'BUDGET_NOT_CONFIGURED',
        policy: 'NONE',
        isBlocked: false,
        reason: 'No budget allocation configured for the specified organizational dimensions. Requisition allowed under unconstrained policy.',
        evaluatedAt: now
      };
    }

    // 2. Compute existing commitments and consumption
    let consumedBudget = 0;
    let committedBudget = 0;

    for (const pr of existingRequisitions) {
      if (pr.id === requisition.id) continue;
      if (pr.tenantId !== tenantId || pr.companyId !== companyId) continue;

      // Match dimensional scope
      const matchesScope = (projectId && pr.projectId === projectId) ||
        (!projectId && costCenterId && pr.costCenterId === costCenterId) ||
        (!projectId && !costCenterId && departmentId && pr.departmentId === departmentId) ||
        (!projectId && !costCenterId && !departmentId);

      if (!matchesScope) continue;

      if (pr.status === 'APPROVED' || pr.status === 'CONVERTED_TO_PO' || pr.status === 'PARTIALLY_CONVERTED') {
        consumedBudget += Number(pr.totalEstimatedAmount || 0);
      } else if (pr.status === 'PENDING_APPROVAL' || pr.status === 'BUDGET_CHECKED') {
        committedBudget += Number(pr.totalEstimatedAmount || 0);
      }
    }

    const totalObligated = consumedBudget + committedBudget;
    const availableBudget = allocatedBudget - totalObligated;
    const variance = availableBudget - requestedAmount; // Positive = Surplus, Negative = Deficit

    let status: ProcurementBudgetCheckStatus = 'WITHIN_BUDGET';
    let isBlocked = false;
    let reason = '';

    const warningThresholdPercent = matchingConfig?.warningThresholdPercent || 85;
    const utilizationAfterRequest = allocatedBudget > 0 ? ((totalObligated + requestedAmount) / allocatedBudget) * 100 : 100;

    if (variance < 0) {
      // Over budget
      if (policy === 'HARD_BLOCK') {
        status = 'BUDGET_BLOCKED';
        isBlocked = true;
        reason = `HARD_BLOCK Policy Enforced: Requested amount (${requestedAmount.toLocaleString()} SAR) exceeds available budget (${availableBudget.toLocaleString()} SAR) by ${Math.abs(variance).toLocaleString()} SAR. Requisition cannot be submitted for approval.`;
      } else if (policy === 'SOFT_BLOCK') {
        status = 'OVER_BUDGET';
        isBlocked = false; // Soft block allows escalation / manager review
        reason = `SOFT_BLOCK Policy: Requisition exceeds available budget by ${Math.abs(variance).toLocaleString()} SAR. Requires executive budget escalation.`;
      } else if (policy === 'WARNING') {
        status = 'BUDGET_WARNING';
        isBlocked = false;
        reason = `WARNING Policy: Requisition exceeds available budget by ${Math.abs(variance).toLocaleString()} SAR. Approved to proceed with deficit warning.`;
      } else {
        status = 'OVER_BUDGET';
        isBlocked = false;
        reason = `NONE Policy: Budget deficit of ${Math.abs(variance).toLocaleString()} SAR detected. Informational only.`;
      }
    } else if (utilizationAfterRequest >= warningThresholdPercent) {
      // Approaching threshold
      status = 'BUDGET_WARNING';
      isBlocked = false;
      reason = `Budget utilization reaches ${utilizationAfterRequest.toFixed(1)}% (Threshold: ${warningThresholdPercent}%). Remaining buffer: ${variance.toLocaleString()} SAR.`;
    } else {
      status = 'WITHIN_BUDGET';
      isBlocked = false;
      reason = `Within approved budget limits. Total available: ${availableBudget.toLocaleString()} SAR, Remaining buffer: ${variance.toLocaleString()} SAR.`;
    }

    return {
      id: `bchk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      requisitionId: requisition.id,
      tenantId,
      companyId,
      branchId,
      departmentId,
      costCenterId,
      profitCenterId,
      projectId,
      fiscalPeriod: `FY-${fiscalYear}`,
      allocatedBudget,
      consumedBudget,
      committedBudget,
      availableBudget,
      requestedAmount,
      variance,
      status,
      policy,
      isBlocked,
      reason,
      evaluatedAt: now
    };
  }
}
