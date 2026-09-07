/**
 * Global Enterprise Search Engine
 * Search across all master entities and operational documents centrally
 */

import { SearchResult } from '../types';

export class SearchEngine {
  /**
   * Execute global fuzzy search across all enterprise entities
   */
  static globalSearch(
    query: string,
    customers: any[],
    vendors: any[],
    inventory: any[],
    salesInvoices: any[],
    journalEntries: any[],
    projects: any[],
    warehouses: any[],
    employees: any[],
    assets: any[] = []
  ): SearchResult[] {
    if (!query || query.trim().length === 0) return [];

    const q = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // 1. Customers
    customers.forEach(c => {
      if (c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.taxNumber && c.taxNumber.includes(q))) {
        results.push({
          id: `sr-cust-${c.id}`,
          category: 'Customers',
          title: c.name,
          subtitle: `Code: ${c.code} | Balance: ${c.balance.toLocaleString()} SAR`,
          entityType: 'Customer',
          entityId: c.id
        });
      }
    });

    // 2. Suppliers
    vendors.forEach(v => {
      if (v.name.toLowerCase().includes(q) || v.code.toLowerCase().includes(q)) {
        results.push({
          id: `sr-vend-${v.id}`,
          category: 'Suppliers',
          title: v.name,
          subtitle: `Code: ${v.code} | Balance: ${v.balance.toLocaleString()} SAR`,
          entityType: 'Vendor',
          entityId: v.id
        });
      }
    });

    // 3. Inventory Items
    inventory.forEach(i => {
      if (i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || (i.barcode && i.barcode.includes(q))) {
        results.push({
          id: `sr-inv-${i.id}`,
          category: 'Items',
          title: i.name,
          subtitle: `SKU: ${i.sku} | Stock: ${i.stockQty} ${i.uom}`,
          entityType: 'InventoryItem',
          entityId: i.id,
          entityNumber: i.sku
        });
      }
    });

    // 4. Invoices
    salesInvoices.forEach(inv => {
      if (inv.invoiceNumber.toLowerCase().includes(q) || inv.customerName.toLowerCase().includes(q)) {
        results.push({
          id: `sr-sinv-${inv.id}`,
          category: 'Invoices',
          title: `Sales Invoice ${inv.invoiceNumber}`,
          subtitle: `Customer: ${inv.customerName} | Total: ${inv.grandTotal.toLocaleString()} SAR (${inv.status})`,
          entityType: 'SalesInvoice',
          entityId: inv.id,
          entityNumber: inv.invoiceNumber
        });
      }
    });

    // 5. Journal Entries
    journalEntries.forEach(je => {
      if (je.entryNumber.toLowerCase().includes(q) || je.description.toLowerCase().includes(q) || (je.reference && je.reference.toLowerCase().includes(q))) {
        results.push({
          id: `sr-je-${je.id}`,
          category: 'Journal Entries',
          title: `GL Journal Entry ${je.entryNumber}`,
          subtitle: `Ref: ${je.reference || 'N/A'} | Total Debit: ${je.totalDebit.toLocaleString()} SAR`,
          entityType: 'JournalEntry',
          entityId: je.id,
          entityNumber: je.entryNumber
        });
      }
    });

    // 6. Projects
    projects.forEach(p => {
      if (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)) {
        results.push({
          id: `sr-proj-${p.id}`,
          category: 'Projects',
          title: p.name,
          subtitle: `Code: ${p.code} | Budget: ${p.budget.toLocaleString()} SAR`,
          entityType: 'Project',
          entityId: p.id
        });
      }
    });

    // 7. Warehouses
    warehouses.forEach(w => {
      if (w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q)) {
        results.push({
          id: `sr-wh-${w.id}`,
          category: 'Warehouses',
          title: w.name,
          subtitle: `Code: ${w.code}`,
          entityType: 'Warehouse',
          entityId: w.id
        });
      }
    });

    // 8. Employees
    employees.forEach(e => {
      if (e.name.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q) || e.department.toLowerCase().includes(q)) {
        results.push({
          id: `sr-emp-${e.id}`,
          category: 'Employees',
          title: e.name,
          subtitle: `Code: ${e.employeeCode} | Dept: ${e.department} | ${e.jobTitle}`,
          entityType: 'Employee',
          entityId: e.id,
          entityNumber: e.employeeCode
        });
      }
    });

    // 9. Assets
    assets.forEach(a => {
      if (a.name.toLowerCase().includes(q) || a.assetCode.toLowerCase().includes(q)) {
        results.push({
          id: `sr-ast-${a.id}`,
          category: 'Assets',
          title: a.name,
          subtitle: `Code: ${a.assetCode} | Cost: ${a.acquisitionCost.toLocaleString()} SAR`,
          entityType: 'Asset',
          entityId: a.id,
          entityNumber: a.assetCode
        });
      }
    });

    return results.slice(0, 30); // Limit top 30
  }
}
