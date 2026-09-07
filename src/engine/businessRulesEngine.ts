/**
 * Centralized Enterprise Business Rules Engine
 * Configurable rule evaluation for all 17 enterprise categories
 */

import { BusinessRule, RuleCategory } from '../types';

export interface RuleEvaluationContext {
  tenantId: string;
  category: RuleCategory;
  entityType?: string;
  entityData: any;
  userRole?: string;
  amount?: number;
  creditLimit?: number;
  currentBalance?: number;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleCode: string;
  category: RuleCategory;
  passed: boolean;
  message: string;
  action?: string;
}

export class BusinessRulesEngine {
  private static defaultRules: BusinessRule[] = [
    {
      id: 'br-101',
      tenantId: 'ten-001',
      category: 'CREDIT_LIMIT',
      ruleCode: 'RL_CREDIT_CHECK',
      name: 'Customer Credit Limit Exceeded Check',
      description: 'Prevents Sales Invoice posting if customer current balance + order total exceeds credit limit',
      expression: 'context.currentBalance + context.amount <= context.creditLimit',
      priority: 1,
      isActive: true,
      actionIfPassed: 'ALLOW_POSTING',
      actionIfFailed: 'BLOCK_POSTING_AND_REQUEST_APPROVAL'
    },
    {
      id: 'br-102',
      tenantId: 'ten-001',
      category: 'DISCOUNT',
      ruleCode: 'RL_MAX_DISCOUNT',
      name: 'Maximum Line Item Discount Threshold (15%)',
      description: 'Requires Finance Manager approval if line discount exceeds 15%',
      expression: 'context.discountPercent <= 15',
      priority: 2,
      isActive: true,
      actionIfPassed: 'APPLY_DISCOUNT',
      actionIfFailed: 'TRIGGER_WORKFLOW_APPROVAL'
    },
    {
      id: 'br-103',
      tenantId: 'ten-001',
      category: 'INVENTORY',
      ruleCode: 'RL_NEGATIVE_STOCK',
      name: 'Prevent Negative Stock Issue',
      description: 'Blocks inventory issue if requested quantity exceeds current available stock in warehouse',
      expression: 'context.requestedQty <= context.availableStockQty',
      priority: 1,
      isActive: true,
      actionIfPassed: 'ISSUE_STOCK',
      actionIfFailed: 'BLOCK_STOCK_ISSUE'
    },
    {
      id: 'br-104',
      tenantId: 'ten-001',
      category: 'PURCHASING',
      ruleCode: 'RL_PO_THRESHOLD',
      name: 'Purchase Order Multi-Level Approval Rule',
      description: 'Requires Multi-level approval for POs exceeding 50,000 SAR',
      expression: 'context.amount < 50000',
      priority: 3,
      isActive: true,
      actionIfPassed: 'AUTO_APPROVE',
      actionIfFailed: 'REQUIRE_VP_APPROVAL'
    }
  ];

  /**
   * Evaluate dynamic rules for a given context
   */
  static evaluateRules(
    context: RuleEvaluationContext,
    customRules: BusinessRule[] = []
  ): RuleEvaluationResult[] {
    const rulesList = customRules.length > 0 ? customRules : this.defaultRules;
    const applicableRules = rulesList
      .filter(r => r.tenantId === context.tenantId && r.category === context.category && r.isActive)
      .sort((a, b) => a.priority - b.priority);

    const results: RuleEvaluationResult[] = [];

    for (const rule of applicableRules) {
      let passed = true;
      let message = `Rule [${rule.name}] passed successfully.`;

      try {
        // Safe context evaluation
        if (rule.ruleCode === 'RL_CREDIT_CHECK' && context.creditLimit !== undefined) {
          const totalAfter = (context.currentBalance || 0) + (context.amount || 0);
          passed = totalAfter <= context.creditLimit;
          if (!passed) {
            message = `Credit limit exceeded! Balance (${context.currentBalance?.toLocaleString()}) + Amount (${context.amount?.toLocaleString()}) > Limit (${context.creditLimit.toLocaleString()} SAR).`;
          }
        } else if (rule.ruleCode === 'RL_MAX_DISCOUNT') {
          const discountPct = context.entityData?.discountPercent || 0;
          passed = discountPct <= 15;
          if (!passed) {
            message = `Discount (${discountPct}%) exceeds maximum allowed unapproved discount of 15%.`;
          }
        } else if (rule.ruleCode === 'RL_NEGATIVE_STOCK') {
          const reqQty = context.entityData?.requestedQty || 0;
          const availQty = context.entityData?.availableStockQty || 0;
          passed = reqQty <= availQty;
          if (!passed) {
            message = `Insufficient stock! Requested (${reqQty}) exceeds available warehouse stock (${availQty}).`;
          }
        } else if (rule.ruleCode === 'RL_PO_THRESHOLD') {
          passed = (context.amount || 0) < 50000;
          if (!passed) {
            message = `Amount (${context.amount?.toLocaleString()} SAR) exceeds auto-approval threshold of 50,000 SAR.`;
          }
        }
      } catch (err: any) {
        passed = false;
        message = `Rule evaluation error: ${err.message}`;
      }

      results.push({
        ruleId: rule.id,
        ruleCode: rule.ruleCode,
        category: rule.category,
        passed,
        message,
        action: passed ? rule.actionIfPassed : rule.actionIfFailed
      });
    }

    return results;
  }

  static getRules(tenantId: string): BusinessRule[] {
    return this.defaultRules.filter(r => r.tenantId === tenantId);
  }
}
