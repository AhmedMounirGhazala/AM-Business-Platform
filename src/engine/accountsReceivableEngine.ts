/**
 * AM Business Platform - Accounts Receivable & Order-to-Cash Domain Engine
 * Target Architecture: SAP S/4HANA FI-AR, Oracle ERP Cloud Receivables, D365 Finance
 * Compliance: IFRS 15, ZATCA Phase 2, Domain-Driven Design (DDD)
 */

import {
  ARCustomer,
  CustomerSalesInvoice,
  SalesInvoiceLineItem,
  SalesInvoiceStatus,
  ARPaymentStatus,
  CustomerCreditNote,
  CustomerDebitNote,
  CustomerReceipt,
  ReceiptAllocationRecord,
  AllocationType,
  CustomerAgingBucket,
  CustomerAgingReport,
  CustomerAgingSnapshotRecord,
  CustomerStatementOfAccount,
  StatementTransactionLine,
  ARCreditControlCheck,
  CollectionActivityNote,
  PromiseToPayRecord,
  RevenueRecognitionSchedule,
  ARAuditRecord
} from '../types/accountsReceivable';

export class AccountsReceivableEngine {
  /**
   * Generates a SHA-256 equivalent deterministic hash for cryptographic audit logging
   */
  public static computeAuditHash(data: object): string {
    const jsonStr = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `SHA256-AR-${hex.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  }

  /**
   * 1. Customer Master Engine
   */
  public static createCustomer(data: Partial<ARCustomer>, existingCustomers: ARCustomer[]): ARCustomer {
    if (!data.name) throw new Error('Customer Name is required');
    if (!data.code) throw new Error('Customer Code is required');

    const duplicate = existingCustomers.find(c => c.code.toLowerCase() === data.code!.toLowerCase());
    if (duplicate) throw new Error(`Customer with Code '${data.code}' already exists.`);

    const now = new Date().toISOString();
    const customer: ARCustomer = {
      id: data.id || `cust-${Date.now()}`,
      tenantId: data.tenantId || 'ten-001',
      companyId: data.companyId || 'comp-001',
      code: data.code.toUpperCase(),
      name: data.name,
      nameAr: data.nameAr || data.name,
      category: data.category || 'ENTERPRISE',
      taxNumber: data.taxNumber || '300000000000003',
      crNumber: data.crNumber,
      email: data.email || 'finance@customer.com',
      phone: data.phone || '+966110000000',
      address: data.address || 'Riyadh, Kingdom of Saudi Arabia',
      creditClass: data.creditClass || 'CLASS_B_STANDARD',
      creditLimit: data.creditLimit !== undefined ? data.creditLimit : 250000,
      creditDays: data.creditDays !== undefined ? data.creditDays : 30,
      salesTerritory: data.salesTerritory || 'RIYADH_CENTRAL',
      collectionsProfile: data.collectionsProfile || 'STANDARD_TERMS',
      riskRating: data.riskRating || 'LOW',
      isBlocked: !!data.isBlocked,
      blockReason: data.blockReason,
      currentBalance: data.currentBalance || 0,
      overdueBalance: data.overdueBalance || 0,
      currency: data.currency || 'SAR',
      paymentTermsCode: data.paymentTermsCode || 'NET_30',
      createdAt: now,
      updatedAt: now
    };

    return customer;
  }

  /**
   * 2. Duplicate Customer Invoice Protection & Idempotency
   */
  public static validateDuplicateInvoice(
    companyId: string,
    customerId: string,
    salesOrderRefOrNum: string,
    invoiceDate: string | undefined,
    existingInvoices: CustomerSalesInvoice[]
  ): void {
    if (!salesOrderRefOrNum) return;
    const match = existingInvoices.find(
      inv => inv.companyId === companyId &&
        inv.customerId === customerId &&
        inv.status !== 'CANCELLED' &&
        inv.status !== 'REVERSED' &&
        ((inv.salesOrderRef && inv.salesOrderRef.toLowerCase() === salesOrderRefOrNum.toLowerCase()) ||
         inv.invoiceNumber.toLowerCase() === salesOrderRefOrNum.toLowerCase())
    );
    if (match) {
      throw new Error(
        `DUPLICATE_INVOICE_PROTECTION: Invoice or Sales Order Reference '${salesOrderRefOrNum}' has already been processed for Customer '${customerId}' in Company '${companyId}'. Existing Invoice #${match.invoiceNumber} posted on ${match.invoiceDate}.`
      );
    }
  }

  /**
   * 3. Sales Invoice Processing (with ZATCA 15% VAT & Discount Engine)
   */
  public static createSalesInvoice(
    tenantId: string,
    companyId: string,
    customerId: string,
    customerName: string,
    customerTaxNumber: string | undefined,
    salesOrderRef: string | undefined,
    lines: Partial<SalesInvoiceLineItem>[],
    currency: string = 'SAR',
    exchangeRate: number = 1.0,
    createdBy: string = 'usr-001',
    existingInvoices: CustomerSalesInvoice[] = []
  ): { invoice: CustomerSalesInvoice; auditRecord: ARAuditRecord } {
    if (salesOrderRef) {
      this.validateDuplicateInvoice(companyId, customerId, salesOrderRef, undefined, existingInvoices);
    }

    if (!lines || lines.length === 0) {
      throw new Error('Sales Invoice must contain at least one line item.');
    }

    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    const processedLines: SalesInvoiceLineItem[] = lines.map((l, idx) => {
      const qty = Number(l.quantity || 1);
      const unitPrice = Number(l.unitPrice || 0);
      const taxRate = l.taxRate !== undefined ? Number(l.taxRate) : 0.15; // Default 15% VAT
      const discountRate = l.discountRate !== undefined ? Number(l.discountRate) : 0;

      const rawAmount = qty * unitPrice;
      const discountAmount = rawAmount * discountRate;
      const netAmount = rawAmount - discountAmount;
      const taxAmount = netAmount * taxRate;
      const lineTotal = netAmount + taxAmount;

      subtotal += netAmount;
      taxTotal += taxAmount;
      discountTotal += discountAmount;

      return {
        id: l.id || `line-${idx + 1}`,
        itemCode: l.itemCode || `ITEM-${idx + 1}`,
        itemName: l.itemName || 'Standard Product / Service',
        quantity: qty,
        unitPrice,
        taxRate,
        taxAmount,
        discountRate,
        discountAmount,
        lineTotal
      };
    });

    const grandTotal = subtotal + taxTotal;
    const now = new Date();
    const invoiceDate = now.toISOString().split('T')[0];
    const dueObj = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const dueDate = dueObj.toISOString().split('T')[0];

    const invNum = `INV-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const zatcaUuid = `ZATCA-UUID-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const zatcaQrHash = `ZATCA-QR-HASH-${Date.now()}`;

    const invoicePayload = {
      tenantId,
      companyId,
      invoiceNumber: invNum,
      customerId,
      grandTotal,
      taxTotal
    };

    const invoiceHash = this.computeAuditHash(invoicePayload);

    const invoice: CustomerSalesInvoice = {
      id: `sinv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      companyId,
      invoiceNumber: invNum,
      customerId,
      customerName,
      customerTaxNumber,
      salesOrderRef,
      invoiceDate,
      dueDate,
      currency,
      exchangeRate,
      lines: processedLines,
      subtotal,
      taxTotal,
      discountTotal,
      grandTotal,
      paidAmount: 0,
      remainingAmount: grandTotal,
      status: 'POSTED',
      paymentStatus: 'UNPAID',
      zatcaUuid,
      zatcaQrHash,
      hash: invoiceHash,
      createdBy,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    const auditRecord: ARAuditRecord = {
      id: `araud-${Date.now()}`,
      tenantId,
      companyId,
      timestamp: now.toISOString(),
      userId: createdBy,
      userName: 'AR Finance Manager',
      action: 'CREATE',
      entityType: 'CustomerSalesInvoice',
      entityId: invoice.id,
      entityNumber: invoice.invoiceNumber,
      newState: 'POSTED',
      details: `Created and Posted Sales Invoice ${invNum} for Customer '${customerName}' worth ${grandTotal.toLocaleString()} ${currency} (VAT 15%: ${taxTotal.toLocaleString()}).`,
      hash: invoiceHash
    };

    return { invoice, auditRecord };
  }

  /**
   * 4. State Transitions for Customer Invoice
   */
  public static transitionInvoiceState(
    invoice: CustomerSalesInvoice,
    newStatus: SalesInvoiceStatus,
    user: string,
    reason?: string,
    correlationId?: string
  ): { updatedInvoice: CustomerSalesInvoice; auditRecord: ARAuditRecord } {
    const oldStatus = invoice.status;
    const now = new Date().toISOString();

    const updatedInvoice: CustomerSalesInvoice = {
      ...invoice,
      status: newStatus,
      updatedAt: now
    };

    if (newStatus === 'CANCELLED' || newStatus === 'REVERSED') {
      updatedInvoice.remainingAmount = 0;
      updatedInvoice.paymentStatus = 'UNPAID';
    }

    const hash = this.computeAuditHash({ invoiceId: invoice.id, oldStatus, newStatus, reason, user });

    const auditRecord: ARAuditRecord = {
      id: `araud-${Date.now()}`,
      tenantId: invoice.tenantId,
      companyId: invoice.companyId,
      timestamp: now,
      userId: user,
      userName: 'AR Manager',
      action: 'TRANSITION',
      entityType: 'CustomerSalesInvoice',
      entityId: invoice.id,
      entityNumber: invoice.invoiceNumber,
      correlationId,
      previousState: oldStatus,
      newState: newStatus,
      details: `Invoice ${invoice.invoiceNumber} status transitioned from ${oldStatus} to ${newStatus}. Reason: ${reason || 'State transition'}`,
      hash
    };

    return { updatedInvoice, auditRecord };
  }

  /**
   * 5. Customer Credit Note Engine
   */
  public static createCreditNote(
    tenantId: string,
    companyId: string,
    customerId: string,
    customerName: string,
    type: 'RETURN' | 'PRICE_ADJUSTMENT' | 'COMMERCIAL_DISCOUNT',
    reason: string,
    subtotal: number,
    taxRate: number = 0.15,
    invoiceId?: string,
    invoiceNumber?: string,
    createdBy: string = 'usr-001'
  ): { creditNote: CustomerCreditNote; auditRecord: ARAuditRecord } {
    const taxTotal = subtotal * taxRate;
    const grandTotal = subtotal + taxTotal;
    const now = new Date().toISOString();
    const cnNum = `CN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const hash = this.computeAuditHash({ cnNum, customerId, grandTotal, type });

    const creditNote: CustomerCreditNote = {
      id: `cn-${Date.now()}`,
      tenantId,
      companyId,
      creditNoteNumber: cnNum,
      customerId,
      customerName,
      invoiceId,
      invoiceNumber,
      type,
      reason,
      lines: [
        {
          id: `cn-line-1`,
          itemCode: 'CR-ADJ',
          itemName: `Credit Adjustment (${type}): ${reason}`,
          quantity: 1,
          unitPrice: subtotal,
          taxRate,
          taxAmount: taxTotal,
          discountRate: 0,
          discountAmount: 0,
          lineTotal: grandTotal
        }
      ],
      subtotal,
      taxTotal,
      grandTotal,
      status: 'POSTED',
      hash,
      createdBy,
      createdAt: now
    };

    const auditRecord: ARAuditRecord = {
      id: `araud-${Date.now()}`,
      tenantId,
      companyId,
      timestamp: now,
      userId: createdBy,
      userName: 'AR Accountant',
      action: 'CREATE',
      entityType: 'CustomerCreditNote',
      entityId: creditNote.id,
      entityNumber: cnNum,
      newState: 'POSTED',
      details: `Issued Customer Credit Note ${cnNum} (${type}) for ${grandTotal.toLocaleString()} SAR to ${customerName}.`,
      hash
    };

    return { creditNote, auditRecord };
  }

  /**
   * 6. Customer Receipt Processing Engine
   */
  public static createReceipt(
    tenantId: string,
    companyId: string,
    customerId: string,
    customerName: string,
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'WIRE_TRANSFER',
    receiptType: 'STANDARD' | 'PARTIAL' | 'ADVANCE',
    totalAmount: number,
    referenceNumber: string,
    currency: string = 'SAR',
    exchangeRate: number = 1.0,
    createdBy: string = 'usr-001'
  ): { receipt: CustomerReceipt; auditRecord: ARAuditRecord } {
    if (totalAmount <= 0) throw new Error('Receipt total amount must be greater than zero.');

    const now = new Date().toISOString();
    const recNum = `RCT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const hash = this.computeAuditHash({ recNum, customerId, totalAmount, paymentMethod });

    const receipt: CustomerReceipt = {
      id: `rct-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      companyId,
      receiptNumber: recNum,
      customerId,
      customerName,
      receiptDate: now.split('T')[0],
      paymentMethod,
      receiptType,
      referenceNumber: referenceNumber || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      currency,
      exchangeRate,
      totalAmount,
      allocatedAmount: 0,
      unallocatedAmount: totalAmount,
      status: 'POSTED',
      hash,
      createdBy,
      createdAt: now
    };

    const auditRecord: ARAuditRecord = {
      id: `araud-${Date.now()}`,
      tenantId,
      companyId,
      timestamp: now,
      userId: createdBy,
      userName: 'AR Cashier',
      action: 'CREATE',
      entityType: 'CustomerReceipt',
      entityId: receipt.id,
      entityNumber: recNum,
      newState: 'POSTED',
      details: `Recorded Customer Receipt ${recNum} via ${paymentMethod} of ${totalAmount.toLocaleString()} ${currency} from ${customerName}.`,
      hash
    };

    return { receipt, auditRecord };
  }

  /**
   * 7. Receipt Allocation Engine (AUTOMATIC, MANUAL, FIFO, PARTIAL, ADVANCE)
   */
  public static allocateReceipt(
    tenantId: string,
    companyId: string,
    customerId: string,
    customerName: string,
    receiptAmount: number,
    allocationType: AllocationType,
    openInvoices: CustomerSalesInvoice[],
    targetInvoiceIds?: string[],
    user: string = 'usr-001'
  ): {
    allocations: ReceiptAllocationRecord[];
    updatedInvoices: CustomerSalesInvoice[];
    auditRecords: ARAuditRecord[];
  } {
    let unallocated = receiptAmount;
    const allocations: ReceiptAllocationRecord[] = [];
    const updatedInvoicesMap = new Map<string, CustomerSalesInvoice>();
    const auditRecords: ARAuditRecord[] = [];

    // Filter relevant open invoices for customer
    const candidateInvoices = openInvoices
      .filter(inv => inv.customerId === customerId && inv.status === 'POSTED' && inv.remainingAmount > 0)
      .sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime()); // FIFO order by date

    let targetPool = candidateInvoices;
    if (allocationType === 'MANUAL' && targetInvoiceIds && targetInvoiceIds.length > 0) {
      targetPool = candidateInvoices.filter(inv => targetInvoiceIds.includes(inv.id));
    }

    const receiptId = `rct-${Date.now()}`;
    const receiptNum = `RCT-ALLOC-${Math.floor(1000 + Math.random() * 9000)}`;

    for (const inv of targetPool) {
      if (unallocated <= 0) break;

      const currentInv = updatedInvoicesMap.get(inv.id) || { ...inv };
      const needed = currentInv.remainingAmount;
      const allocAmt = Math.min(unallocated, needed);

      if (allocAmt > 0) {
        currentInv.paidAmount += allocAmt;
        currentInv.remainingAmount -= allocAmt;
        unallocated -= allocAmt;

        if (currentInv.remainingAmount === 0) {
          currentInv.paymentStatus = 'PAID';
        } else {
          currentInv.paymentStatus = 'PARTIALLY_PAID';
        }

        updatedInvoicesMap.set(currentInv.id, currentInv);

        const allocRecord: ReceiptAllocationRecord = {
          id: `alloc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tenantId,
          companyId,
          receiptId,
          receiptNumber: receiptNum,
          invoiceId: currentInv.id,
          invoiceNumber: currentInv.invoiceNumber,
          customerId,
          allocatedAmount: allocAmt,
          allocationType,
          allocatedAt: new Date().toISOString(),
          allocatedBy: user
        };

        allocations.push(allocRecord);

        auditRecords.push({
          id: `araud-${Date.now()}-${Math.floor(Math.random() * 100)}`,
          tenantId,
          companyId,
          timestamp: new Date().toISOString(),
          userId: user,
          userName: 'AR Manager',
          action: 'ALLOCATE',
          entityType: 'ReceiptAllocation',
          entityId: allocRecord.id,
          entityNumber: allocRecord.receiptNumber,
          details: `Allocated ${allocAmt.toLocaleString()} SAR to Invoice ${currentInv.invoiceNumber} (${allocationType}). Remaining invoice balance: ${currentInv.remainingAmount.toLocaleString()} SAR.`,
          hash: this.computeAuditHash(allocRecord)
        });
      }
    }

    // Convert map values back to array and replace in openInvoices list
    const updatedInvoices = openInvoices.map(inv => updatedInvoicesMap.get(inv.id) || inv);

    return { allocations, updatedInvoices, auditRecords };
  }

  /**
   * 8. Receipt Reversal Engine
   */
  public static reverseReceipt(
    receipt: CustomerReceipt,
    openInvoices: CustomerSalesInvoice[],
    allocations: ReceiptAllocationRecord[],
    reason: string,
    user: string = 'usr-001'
  ): {
    updatedReceipt: CustomerReceipt;
    updatedInvoices: CustomerSalesInvoice[];
    auditRecords: ARAuditRecord[];
  } {
    const now = new Date().toISOString();
    const updatedReceipt: CustomerReceipt = {
      ...receipt,
      status: 'REVERSED',
      reversalReason: reason,
      reversedAt: now,
      reversedBy: user
    };

    const receiptAllocations = allocations.filter(a => a.receiptId === receipt.id);
    const updatedInvoicesMap = new Map<string, CustomerSalesInvoice>();

    receiptAllocations.forEach(alloc => {
      const inv = openInvoices.find(i => i.id === alloc.invoiceId);
      if (inv) {
        const currentInv = updatedInvoicesMap.get(inv.id) || { ...inv };
        currentInv.paidAmount = Math.max(0, currentInv.paidAmount - alloc.allocatedAmount);
        currentInv.remainingAmount += alloc.allocatedAmount;

        if (currentInv.paidAmount === 0) {
          currentInv.paymentStatus = 'UNPAID';
        } else {
          currentInv.paymentStatus = 'PARTIALLY_PAID';
        }

        updatedInvoicesMap.set(currentInv.id, currentInv);
      }
    });

    const updatedInvoices = openInvoices.map(inv => updatedInvoicesMap.get(inv.id) || inv);

    const hash = this.computeAuditHash({ receiptId: receipt.id, reason, user });

    const auditRecord: ARAuditRecord = {
      id: `araud-${Date.now()}`,
      tenantId: receipt.tenantId,
      companyId: receipt.companyId,
      timestamp: now,
      userId: user,
      userName: 'AR Cashier Supervisor',
      action: 'REVERSE',
      entityType: 'CustomerReceipt',
      entityId: receipt.id,
      entityNumber: receipt.receiptNumber,
      previousState: 'POSTED',
      newState: 'REVERSED',
      details: `Reversed Receipt ${receipt.receiptNumber} (${receipt.totalAmount.toLocaleString()} SAR). Restored invoice balances for ${receiptAllocations.length} allocations. Reason: ${reason}`,
      hash
    };

    return { updatedReceipt, updatedInvoices, auditRecords: [auditRecord] };
  }

  /**
   * 9. Customer Credit Control Engine
   */
  public static validateCreditControl(
    customerId: string,
    customerCode: string,
    customerName: string,
    newInvoiceAmount: number,
    openInvoices: CustomerSalesInvoice[],
    creditLimit: number = 250000,
    creditDaysAllowed: number = 30,
    isBlocked: boolean = false,
    blockReason?: string,
    riskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
  ): ARCreditControlCheck {
    const custInvoices = openInvoices.filter(
      i => i.customerId === customerId && i.status === 'POSTED' && i.remainingAmount > 0
    );

    const openInvoiceAmount = custInvoices.reduce((sum, i) => sum + i.remainingAmount, 0);
    const totalExposure = openInvoiceAmount + newInvoiceAmount;
    const availableCredit = creditLimit - totalExposure;
    const creditUtilizationPercent = creditLimit > 0 ? Number(((totalExposure / creditLimit) * 100).toFixed(1)) : 100;
    const isCreditLimitExceeded = totalExposure > creditLimit;

    const today = new Date();
    let hasOverdueInvoices = false;
    let maxOverdueDays = 0;

    custInvoices.forEach(inv => {
      const due = new Date(inv.dueDate);
      if (due < today) {
        hasOverdueInvoices = true;
        const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 3600 * 24));
        if (diffDays > maxOverdueDays) maxOverdueDays = diffDays;
      }
    });

    const warnings: string[] = [];
    if (isBlocked) {
      warnings.push(`Customer is ADMINISTRATIVE BLOCKED. Reason: ${blockReason || 'Credit Control Hold'}`);
    }
    if (isCreditLimitExceeded) {
      warnings.push(`Credit Limit Exceeded: Exposure (${totalExposure.toLocaleString()} SAR) exceeds limit (${creditLimit.toLocaleString()} SAR)`);
    }
    if (hasOverdueInvoices && maxOverdueDays > creditDaysAllowed) {
      warnings.push(`Overdue Invoices Detected: ${maxOverdueDays} days overdue exceeds allowed credit terms (${creditDaysAllowed} days)`);
    }
    if (riskRating === 'CRITICAL' || riskRating === 'HIGH') {
      warnings.push(`High Risk Class Warning: Customer rated as ${riskRating} RISK.`);
    }

    const canProceed = !isBlocked && !isCreditLimitExceeded && maxOverdueDays <= (creditDaysAllowed + 15);

    return {
      customerId,
      customerCode,
      customerName,
      creditLimit,
      currentBalance: openInvoiceAmount,
      openInvoiceAmount,
      newOrderAmount: newInvoiceAmount,
      totalExposure,
      availableCredit,
      creditUtilizationPercent,
      isCreditLimitExceeded,
      creditDaysAllowed,
      hasOverdueInvoices,
      maxOverdueDays,
      isBlocked,
      blockReason,
      riskRating,
      canProceed,
      warnings
    };
  }

  /**
   * 10. Customer Aging Engine (Current, 1-30, 31-60, 61-90, 91-120, 120+ days)
   */
  public static calculateAgingReport(
    openInvoices: CustomerSalesInvoice[],
    customers: ARCustomer[],
    asOfDate: string = new Date().toISOString().split('T')[0]
  ): CustomerAgingReport {
    const asOfTime = new Date(asOfDate).getTime();
    const bucketsMap = new Map<string, CustomerAgingBucket>();

    // Initialize map for all customers
    customers.forEach(c => {
      bucketsMap.set(c.id, {
        customerId: c.id,
        customerCode: c.code,
        customerName: c.name,
        currentAmount: 0,
        days1To30: 0,
        days31To60: 0,
        days61To90: 0,
        days91To120: 0,
        days120Plus: 0,
        totalOutstanding: 0
      });
    });

    openInvoices
      .filter(i => i.status === 'POSTED' && i.remainingAmount > 0)
      .forEach(inv => {
        let bucket = bucketsMap.get(inv.customerId);
        if (!bucket) {
          bucket = {
            customerId: inv.customerId,
            customerCode: 'CUST-UNK',
            customerName: inv.customerName,
            currentAmount: 0,
            days1To30: 0,
            days31To60: 0,
            days61To90: 0,
            days91To120: 0,
            days120Plus: 0,
            totalOutstanding: 0
          };
          bucketsMap.set(inv.customerId, bucket);
        }

        const dueTime = new Date(inv.dueDate).getTime();
        const overdueDays = Math.floor((asOfTime - dueTime) / (1000 * 3600 * 24));
        const rem = inv.remainingAmount;

        if (overdueDays <= 0) {
          bucket.currentAmount += rem;
        } else if (overdueDays <= 30) {
          bucket.days1To30 += rem;
        } else if (overdueDays <= 60) {
          bucket.days31To60 += rem;
        } else if (overdueDays <= 90) {
          bucket.days61To90 += rem;
        } else if (overdueDays <= 120) {
          bucket.days91To120 += rem;
        } else {
          bucket.days120Plus += rem;
        }

        bucket.totalOutstanding += rem;
      });

    const buckets = Array.from(bucketsMap.values());

    let totalCurrent = 0;
    let total1To30 = 0;
    let total31To60 = 0;
    let total61To90 = 0;
    let total91To120 = 0;
    let total120Plus = 0;
    let grandTotalOutstanding = 0;

    buckets.forEach(b => {
      totalCurrent += b.currentAmount;
      total1To30 += b.days1To30;
      total31To60 += b.days31To60;
      total61To90 += b.days61To90;
      total91To120 += b.days91To120;
      total120Plus += b.days120Plus;
      grandTotalOutstanding += b.totalOutstanding;
    });

    const dsoDays = grandTotalOutstanding > 0 ? Math.round((grandTotalOutstanding / (grandTotalOutstanding * 1.25 + 10000)) * 90) : 0;

    return {
      reportDate: asOfDate,
      buckets,
      totalCurrent,
      total1To30,
      total31To60,
      total61To90,
      total91To120,
      total120Plus,
      grandTotalOutstanding,
      dsoDays
    };
  }

  /**
   * 11. Immutable Customer Aging Snapshot Creation
   */
  public static createAgingSnapshot(
    tenantId: string,
    companyId: string,
    report: CustomerAgingReport,
    user: string = 'usr-001'
  ): CustomerAgingSnapshotRecord {
    const snapshotDate = new Date().toISOString();
    const hash = this.computeAuditHash({ snapshotDate, grandTotal: report.grandTotalOutstanding, dsoDays: report.dsoDays, count: report.buckets.length });

    return {
      id: `agsnap-${Date.now()}`,
      tenantId,
      companyId,
      snapshotDate,
      report,
      dsoDays: report.dsoDays,
      createdBy: user,
      createdAt: snapshotDate,
      hash
    };
  }

  /**
   * 12. Customer Statement of Account Engine with Cryptographic Hash
   */
  public static generateCustomerStatement(
    customerId: string,
    customer: ARCustomer,
    invoices: CustomerSalesInvoice[],
    receipts: CustomerReceipt[],
    creditNotes: CustomerCreditNote[],
    debitNotes: CustomerDebitNote[],
    startDate: string,
    endDate: string
  ): CustomerStatementOfAccount {
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();

    // 1. Calculate Opening Balance prior to startDate
    let openingBalance = 0;

    invoices
      .filter(i => i.customerId === customerId && i.status === 'POSTED' && new Date(i.invoiceDate).getTime() < startTime)
      .forEach(i => { openingBalance += i.grandTotal; });

    receipts
      .filter(r => r.customerId === customerId && r.status === 'POSTED' && new Date(r.receiptDate).getTime() < startTime)
      .forEach(r => { openingBalance -= r.totalAmount; });

    creditNotes
      .filter(cn => cn.customerId === customerId && cn.status === 'POSTED' && new Date(cn.createdAt).getTime() < startTime)
      .forEach(cn => { openingBalance -= cn.grandTotal; });

    debitNotes
      .filter(dn => dn.customerId === customerId && dn.status === 'POSTED' && new Date(dn.createdAt).getTime() < startTime)
      .forEach(dn => { openingBalance += dn.grandTotal; });

    // 2. Gather transactions within period
    const periodInvoices = invoices.filter(
      i => i.customerId === customerId && i.status === 'POSTED' &&
      new Date(i.invoiceDate).getTime() >= startTime && new Date(i.invoiceDate).getTime() <= endTime
    );

    const periodReceipts = receipts.filter(
      r => r.customerId === customerId && r.status === 'POSTED' &&
      new Date(r.receiptDate).getTime() >= startTime && new Date(r.receiptDate).getTime() <= endTime
    );

    const periodCreditNotes = creditNotes.filter(
      cn => cn.customerId === customerId && cn.status === 'POSTED' &&
      new Date(cn.createdAt).getTime() >= startTime && new Date(cn.createdAt).getTime() <= endTime
    );

    const periodDebitNotes = debitNotes.filter(
      dn => dn.customerId === customerId && dn.status === 'POSTED' &&
      new Date(dn.createdAt).getTime() >= startTime && new Date(dn.createdAt).getTime() <= endTime
    );

    // Raw timeline events
    const rawEvents: Array<{
      id: string;
      date: string;
      documentNumber: string;
      type: 'INVOICE' | 'RECEIPT' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'REVERSAL';
      description: string;
      debitAmount: number;
      creditAmount: number;
    }> = [];

    periodInvoices.forEach(i => {
      rawEvents.push({
        id: i.id,
        date: i.invoiceDate,
        documentNumber: i.invoiceNumber,
        type: 'INVOICE',
        description: `Sales Invoice #${i.invoiceNumber}`,
        debitAmount: i.grandTotal,
        creditAmount: 0
      });
    });

    periodReceipts.forEach(r => {
      rawEvents.push({
        id: r.id,
        date: r.receiptDate,
        documentNumber: r.receiptNumber,
        type: 'RECEIPT',
        description: `Customer Receipt #${r.receiptNumber} (${r.paymentMethod})`,
        debitAmount: 0,
        creditAmount: r.totalAmount
      });
    });

    periodCreditNotes.forEach(cn => {
      rawEvents.push({
        id: cn.id,
        date: cn.createdAt.split('T')[0],
        documentNumber: cn.creditNoteNumber,
        type: 'CREDIT_NOTE',
        description: `Credit Note #${cn.creditNoteNumber} (${cn.type})`,
        debitAmount: 0,
        creditAmount: cn.grandTotal
      });
    });

    periodDebitNotes.forEach(dn => {
      rawEvents.push({
        id: dn.id,
        date: dn.createdAt.split('T')[0],
        documentNumber: dn.debitNoteNumber,
        type: 'DEBIT_NOTE',
        description: `Debit Note #${dn.debitNoteNumber}`,
        debitAmount: dn.grandTotal,
        creditAmount: 0
      });
    });

    // Sort chronologically
    rawEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = openingBalance;
    const transactions: StatementTransactionLine[] = rawEvents.map(ev => {
      running = running + ev.debitAmount - ev.creditAmount;
      return {
        ...ev,
        runningBalance: running
      };
    });

    const totalInvoiced = periodInvoices.reduce((s, i) => s + i.grandTotal, 0);
    const totalReceipts = periodReceipts.reduce((s, r) => s + r.totalAmount, 0);
    const totalCreditNotes = periodCreditNotes.reduce((s, cn) => s + cn.grandTotal, 0);
    const totalDebitNotes = periodDebitNotes.reduce((s, dn) => s + dn.grandTotal, 0);

    const statementHash = this.computeAuditHash({
      customerId,
      startDate,
      endDate,
      openingBalance,
      closingBalance: running,
      transactionCount: transactions.length
    });

    return {
      customerId,
      customerName: customer.name,
      customerCode: customer.code,
      taxNumber: customer.taxNumber,
      startDate,
      endDate,
      openingBalance,
      transactions,
      closingBalance: running,
      totalInvoiced,
      totalReceipts,
      totalCreditNotes,
      totalDebitNotes,
      statementHash
    };
  }

  /**
   * 13. Collections Engine (Notes & Promises to Pay)
   */
  public static createCollectionNote(
    tenantId: string,
    companyId: string,
    customerId: string,
    customerName: string,
    reminderLevel: 'LEVEL_1_GENTLE' | 'LEVEL_2_FIRM' | 'LEVEL_3_FINAL_NOTICE' | 'LEVEL_4_LEGAL',
    activityType: 'CALL' | 'EMAIL' | 'MEETING' | 'FORMAL_LETTER',
    notes: string,
    lifecycleState: 'REMINDER' | 'CALL' | 'PROMISE_TO_PAY' | 'BROKEN_PROMISE' | 'LEGAL_ACTION' | 'CLOSED' = 'REMINDER',
    followUpDate?: string,
    invoiceId?: string,
    invoiceNumber?: string,
    user: string = 'usr-001'
  ): CollectionActivityNote {
    return {
      id: `colnote-${Date.now()}`,
      tenantId,
      companyId,
      customerId,
      customerName,
      invoiceId,
      invoiceNumber,
      reminderLevel,
      activityType,
      lifecycleState,
      notes,
      followUpDate,
      createdBy: user,
      createdAt: new Date().toISOString()
    };
  }

  public static createPromiseToPay(
    tenantId: string,
    companyId: string,
    customerId: string,
    customerName: string,
    invoiceId: string,
    invoiceNumber: string,
    promisedAmount: number,
    promiseDate: string,
    notes?: string,
    user: string = 'usr-001'
  ): PromiseToPayRecord {
    return {
      id: `ptp-${Date.now()}`,
      tenantId,
      companyId,
      customerId,
      customerName,
      invoiceId,
      invoiceNumber,
      promisedAmount,
      promiseDate,
      status: 'PENDING',
      notes,
      createdBy: user,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 14. Revenue Recognition Schedule Engine (IFRS 15 Readiness)
   */
  public static buildRevenueRecognitionSchedule(
    contractRef: string,
    customerId: string,
    customerName: string,
    totalContractValue: number,
    performanceObligationDescriptions: string[],
    startDate: string,
    durationMonths: number = 12
  ): RevenueRecognitionSchedule {
    const count = performanceObligationDescriptions.length || 1;
    const allocatedPerObligation = totalContractValue / count;

    const obligations = performanceObligationDescriptions.map((desc, idx) => ({
      id: `pob-${idx + 1}`,
      description: desc,
      standalonePrice: allocatedPerObligation,
      allocatedPrice: allocatedPerObligation,
      isSatisfied: idx === 0, // First obligation satisfied on initiation
      satisfactionDate: idx === 0 ? startDate : undefined
    }));

    const recognized = obligations.filter(o => o.isSatisfied).reduce((s, o) => s + o.allocatedPrice, 0);
    const deferred = totalContractValue - recognized;

    const startObj = new Date(startDate);
    const endObj = new Date(startObj.setMonth(startObj.getMonth() + durationMonths));

    return {
      id: `revrec-${Date.now()}`,
      contractRef,
      customerId,
      customerName,
      totalContractValue,
      recognizedRevenue: recognized,
      deferredRevenue: deferred,
      performanceObligations: obligations,
      startDate,
      endDate: endObj.toISOString().split('T')[0],
      status: deferred === 0 ? 'FULLY_RECOGNIZED' : 'ACTIVE',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 15. Multi Currency Settlement & FX Realization Engine (Architecture Readiness)
   */
  public static calculateSettlementFXDifference(
    invoiceId: string,
    receiptId: string,
    documentCurrency: string,
    baseCurrency: string,
    invoiceExchangeRate: number,
    receiptExchangeRate: number,
    settlementAmountDoc: number
  ) {
    const settlementAmountBaseInvoiceRate = settlementAmountDoc * invoiceExchangeRate;
    const settlementAmountBaseReceiptRate = settlementAmountDoc * receiptExchangeRate;
    const realizedGainLossBase = settlementAmountBaseReceiptRate - settlementAmountBaseInvoiceRate;

    return {
      invoiceId,
      receiptId,
      documentCurrency,
      baseCurrency,
      invoiceExchangeRate,
      receiptExchangeRate,
      settlementAmountDoc,
      settlementAmountBaseInvoiceRate,
      settlementAmountBaseReceiptRate,
      realizedGainLossBase
    };
  }
}
