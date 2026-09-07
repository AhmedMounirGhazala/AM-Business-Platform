/**
 * Enterprise Reporting Foundation Engine
 * Generates all GAAP/IFRS financial reports strictly from normalized General Ledger accounting tables
 */

import { Account, Customer, FinancialEvent, InventoryItem, JournalEntry, Vendor } from '../types';

export class ReportingEngine {
  /**
   * Trial Balance Report
   */
  static generateTrialBalance(accounts: Account[]) {
    let totalDebit = 0;
    let totalCredit = 0;

    const rows = accounts.map(acc => {
      const isDebitNature = acc.category === 'Asset' || acc.category === 'Expense';
      const debitBalance = isDebitNature && acc.balance > 0 ? acc.balance : (isDebitNature ? 0 : 0);
      const creditBalance = !isDebitNature && acc.balance > 0 ? acc.balance : (!isDebitNature ? 0 : 0);

      totalDebit += debitBalance;
      totalCredit += creditBalance;

      return {
        code: acc.code,
        name: acc.name,
        nameAr: acc.nameAr,
        category: acc.category,
        debitBalance,
        creditBalance
      };
    });

    return {
      asOfDate: new Date().toISOString().split('T')[0],
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      rows
    };
  }

  /**
   * Balance Sheet Report
   */
  static generateBalanceSheet(accounts: Account[]) {
    const assets = accounts.filter(a => a.category === 'Asset');
    const liabilities = accounts.filter(a => a.category === 'Liability');
    const equity = accounts.filter(a => a.category === 'Equity');

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

    return {
      asOfDate: new Date().toISOString().split('T')[0],
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      assets,
      liabilities,
      equity
    };
  }

  /**
   * Income Statement (Profit & Loss)
   */
  static generateIncomeStatement(accounts: Account[]) {
    const revenues = accounts.filter(a => a.category === 'Revenue');
    const expenses = accounts.filter(a => a.category === 'Expense');

    const totalRevenue = revenues.reduce((sum, r) => sum + r.balance, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.balance, 0);
    const netIncome = totalRevenue - totalExpense;

    return {
      period: 'Year-to-Date (2026)',
      totalRevenue,
      totalExpense,
      netIncome,
      netProfitMarginPercent: totalRevenue > 0 ? Math.round((netIncome / totalRevenue) * 1000) / 10 : 0,
      revenues,
      expenses
    };
  }

  /**
   * Aged Receivables (AR Aging)
   */
  static generateAgedReceivables(customers: Customer[], invoices: any[]) {
    const rows = customers.map(cust => {
      const custInvoices = invoices.filter(inv => inv.customerId === cust.id && inv.paymentStatus !== 'Paid');
      
      let current = 0;
      let days1To30 = 0;
      let days31To60 = 0;
      let days61To90 = 0;
      let daysOver90 = 0;

      const today = new Date().getTime();

      custInvoices.forEach(inv => {
        const invDate = new Date(inv.date).getTime();
        const diffDays = Math.floor((today - invDate) / (1000 * 3600 * 24));
        const amount = inv.grandTotal;

        if (diffDays <= 0) current += amount;
        else if (diffDays <= 30) days1To30 += amount;
        else if (diffDays <= 60) days31To60 += amount;
        else if (diffDays <= 90) days61To90 += amount;
        else daysOver90 += amount;
      });

      return {
        customerId: cust.id,
        customerCode: cust.code,
        customerName: cust.name,
        totalBalance: cust.balance,
        current,
        days1To30,
        days31To60,
        days61To90,
        daysOver90
      };
    });

    return {
      asOfDate: new Date().toISOString().split('T')[0],
      totalReceivables: customers.reduce((sum, c) => sum + c.balance, 0),
      rows
    };
  }

  /**
   * Aged Payables (AP Aging)
   */
  static generateAgedPayables(vendors: Vendor[], purchaseInvoices: any[]) {
    const rows = vendors.map(vend => {
      return {
        vendorId: vend.id,
        vendorCode: vend.code,
        vendorName: vend.name,
        totalBalance: vend.balance,
        current: vend.balance,
        days1To30: 0,
        days31To60: 0,
        days61To90: 0,
        daysOver90: 0
      };
    });

    return {
      asOfDate: new Date().toISOString().split('T')[0],
      totalPayables: vendors.reduce((sum, v) => sum + v.balance, 0),
      rows
    };
  }

  /**
   * Inventory Valuation Report
   */
  static generateInventoryValuation(inventory: InventoryItem[]) {
    let totalValuation = 0;
    const items = inventory.map(item => {
      const valuation = item.stockQty * item.costPrice;
      totalValuation += valuation;
      return {
        sku: item.sku,
        name: item.name,
        category: item.categoryName,
        stockQty: item.stockQty,
        unitCost: item.costPrice,
        valuationMethod: item.valuationMethod,
        totalValuation
      };
    });

    return {
      asOfDate: new Date().toISOString().split('T')[0],
      totalValuation,
      itemCount: inventory.length,
      items
    };
  }
}
