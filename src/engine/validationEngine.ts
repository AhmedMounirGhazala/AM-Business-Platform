/**
 * Centralized Enterprise Business Validation Engine
 * Validates required fields, posting parameters, period locking, credit limits & duplicate codes
 */

import { Customer, FiscalPeriod, InventoryItem, ValidationResult, Vendor } from '../types';

export class ValidationEngine {
  /**
   * Validate document prior to submission/posting
   */
  static validateDocument(
    documentType: string,
    documentData: any,
    customers: Customer[],
    vendors: Vendor[],
    inventory: InventoryItem[],
    fiscalPeriods: FiscalPeriod[]
  ): ValidationResult {
    const errors: { field?: string; message: string; severity: 'ERROR' | 'WARNING' }[] = [];

    // 1. Period Locking Validation
    if (documentData.date) {
      const docDate = documentData.date;
      const lockedPeriod = fiscalPeriods.find(p => p.isLocked && docDate >= p.startDate && docDate <= p.endDate);
      if (lockedPeriod) {
        errors.push({
          field: 'date',
          message: `Accounting Period ${lockedPeriod.periodNumber} is LOCKED. Posting on ${docDate} is strictly prohibited.`,
          severity: 'ERROR'
        });
      }
    }

    // 2. Sales Invoice Validation
    if (documentType === 'SalesInvoice') {
      if (!documentData.customerId) {
        errors.push({ field: 'customerId', message: 'Customer selection is required.', severity: 'ERROR' });
      } else {
        const cust = customers.find(c => c.id === documentData.customerId);
        if (cust) {
          const grandTotal = documentData.grandTotal || 0;
          if (cust.balance + grandTotal > cust.creditLimit) {
            errors.push({
              field: 'customerId',
              message: `Credit limit warning! Customer balance (${cust.balance.toLocaleString()}) + Invoice (${grandTotal.toLocaleString()}) exceeds limit of ${cust.creditLimit.toLocaleString()} SAR.`,
              severity: 'WARNING'
            });
          }
        }
      }

      if (!documentData.lines || documentData.lines.length === 0) {
        errors.push({ field: 'lines', message: 'Sales Invoice must contain at least one line item.', severity: 'ERROR' });
      } else {
        documentData.lines.forEach((line: any, idx: number) => {
          if (!line.itemSku) {
            errors.push({ field: `lines[${idx}].itemSku`, message: `Line ${idx + 1}: SKU is required.`, severity: 'ERROR' });
          }
          if (!line.quantity || line.quantity <= 0) {
            errors.push({ field: `lines[${idx}].quantity`, message: `Line ${idx + 1}: Quantity must be greater than 0.`, severity: 'ERROR' });
          }
        });
      }
    }

    // 3. Purchase Invoice Validation
    if (documentType === 'PurchaseInvoice') {
      if (!documentData.vendorId) {
        errors.push({ field: 'vendorId', message: 'Supplier / Vendor selection is required.', severity: 'ERROR' });
      }
    }

    // 4. Duplicate Code Validation Helper
    if (documentData.code) {
      if (documentType === 'Customer' && customers.some(c => c.code === documentData.code && c.id !== documentData.id)) {
        errors.push({ field: 'code', message: `Duplicate customer code "${documentData.code}" already exists.`, severity: 'ERROR' });
      }
      if (documentType === 'Vendor' && vendors.some(v => v.code === documentData.code && v.id !== documentData.id)) {
        errors.push({ field: 'code', message: `Duplicate supplier code "${documentData.code}" already exists.`, severity: 'ERROR' });
      }
      if (documentType === 'InventoryItem' && inventory.some(i => i.sku === documentData.code && i.id !== documentData.id)) {
        errors.push({ field: 'sku', message: `Duplicate item SKU "${documentData.code}" already exists.`, severity: 'ERROR' });
      }
    }

    return {
      isValid: errors.filter(e => e.severity === 'ERROR').length === 0,
      errors
    };
  }
}
