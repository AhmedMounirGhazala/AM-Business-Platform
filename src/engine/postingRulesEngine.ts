/**
 * Enterprise Configurable Posting Rules Engine
 * Replaces hardcoded accounting logic with dynamic per-tenant configuration
 */

import { Account, PostingRule } from '../types';

export interface ResolvedPostingAccounts {
  debitAccount: Account;
  creditAccount: Account;
  taxAccount?: Account;
  discountAccount?: Account;
  costCenterId?: string;
  profitCenterId?: string;
  departmentId?: string;
}

export class PostingRulesEngine {
  /**
   * Resolves the configured accounting posting rule for a tenant and document type
   */
  static resolveRule(
    tenantId: string,
    documentType: string,
    postingRules: PostingRule[],
    accounts: Account[],
    companyId?: string
  ): ResolvedPostingAccounts | null {
    // 1. Search for matching active rule by tenant, documentType, companyId
    let rule = postingRules.find(
      r => r.tenantId === tenantId && r.documentType === documentType && r.isActive && (!companyId || r.companyId === companyId)
    );

    // 2. Fallback to generic rule if tenant specific not found
    if (!rule) {
      rule = postingRules.find(r => r.documentType === documentType && r.isActive);
    }

    if (!rule) {
      console.error(`PostingRulesEngine: No active posting rule found for documentType "${documentType}" in tenant "${tenantId}"`);
      return null;
    }

    const debitAccount = accounts.find(a => a.code === rule.debitAccountCode && a.isActive);
    const creditAccount = accounts.find(a => a.code === rule.creditAccountCode && a.isActive);
    const taxAccount = rule.taxAccountCode ? accounts.find(a => a.code === rule.taxAccountCode && a.isActive) : undefined;
    const discountAccount = rule.discountAccountCode ? accounts.find(a => a.code === rule.discountAccountCode && a.isActive) : undefined;

    if (!debitAccount || !creditAccount) {
      console.error(`PostingRulesEngine: Invalid GL accounts for rule ${rule.name}. Debit: ${rule.debitAccountCode}, Credit: ${rule.creditAccountCode}`);
      return null;
    }

    return {
      debitAccount,
      creditAccount,
      taxAccount,
      discountAccount,
      costCenterId: rule.costCenterId,
      profitCenterId: rule.profitCenterId,
      departmentId: rule.departmentId
    };
  }
}
