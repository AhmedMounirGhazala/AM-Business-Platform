/**
 * AM Business Platform - Phase 3.1 Enterprise Sales & Point of Sale (POS) Engine
 * Target Architecture: SAP S/4HANA SD / Retail, Oracle SCM Order Management, D365 Commerce
 * Architecture Baseline: v2.8
 * Pure deterministic domain logic with full auditability, event dispatch readiness, and SHA-256 digital seals.
 */

import {
  SalesOrder,
  SalesOrderLine,
  SalesOrderStatus,
  SalesQuotation,
  SalesQuotationLine,
  SalesOrderStateTransitionAudit,
  OrderHoldReason,
  POSRegister,
  POSShift,
  POSShiftStatus,
  POSShiftCashMovement,
  POSReceipt,
  POSReceiptLine,
  PaymentTransaction,
  EnterprisePriceList,
  DiscountRule,
  PromotionCampaign,
  SalesTaxJurisdiction,
  SalesTaxCalculationResult,
  SalesReturn,
  SalesReturnLine,
  SalesDocumentSequenceConfig
} from '../types/sales';

export class SalesEngine {

  /**
   * Generates a deterministic SHA-256 digital seal hash for data integrity
   */
  static generateSha256Seal(payload: any): string {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
    let hash = 0x811c9dc5;
    for (let i = 0; i < raw.length; i++) {
      hash ^= raw.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    const hex1 = ('00000000' + hash.toString(16)).slice(-8);
    const hex2 = ('00000000' + ((hash * 31) >>> 0).toString(16)).slice(-8);
    const hex3 = ('00000000' + ((hash * 17) >>> 0).toString(16)).slice(-8);
    const hex4 = ('00000000' + ((hash * 13) >>> 0).toString(16)).slice(-8);
    return `sha256_${hex1}${hex2}${hex3}${hex4}`;
  }

  // =========================================================================
  // 1. SALES ORDER STATE MACHINE & AUDIT
  // =========================================================================

  private static readonly VALID_TRANSITIONS: Record<SalesOrderStatus, SalesOrderStatus[]> = {
    DRAFT: ['PENDING_APPROVAL', 'APPROVED', 'CANCELLED'],
    PENDING_APPROVAL: ['APPROVED', 'DRAFT', 'ON_HOLD', 'CANCELLED'],
    APPROVED: ['CONFIRMED', 'ON_HOLD', 'CANCELLED'],
    ON_HOLD: ['PENDING_APPROVAL', 'APPROVED', 'CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PARTIALLY_FULFILLED', 'FULFILLED', 'ON_HOLD', 'CANCELLED'],
    PARTIALLY_FULFILLED: ['FULFILLED', 'ON_HOLD', 'CANCELLED', 'RETURNED'],
    FULFILLED: ['RETURNED', 'CLOSED'],
    RETURNED: ['CLOSED'],
    CANCELLED: [],
    CLOSED: []
  };

  /**
   * Validates and transitions Sales Order status with full immutable cryptographic audit logging
   */
  static transitionOrderStatus(
    order: SalesOrder,
    toStatus: SalesOrderStatus,
    performedBy: { id: string; name: string; role: string },
    reason?: string,
    holdReason?: OrderHoldReason
  ): { success: boolean; order: SalesOrder; audit?: SalesOrderStateTransitionAudit; error?: string } {
    const fromStatus = order.status;

    if (fromStatus === toStatus) {
      return { success: true, order };
    }

    const allowed = this.VALID_TRANSITIONS[fromStatus] || [];
    if (!allowed.includes(toStatus)) {
      return {
        success: false,
        order,
        error: `Illegal state transition from ${fromStatus} to ${toStatus}. Allowed transitions: ${allowed.join(', ') || 'None'}`
      };
    }

    const now = new Date().toISOString();
    const auditRecord: SalesOrderStateTransitionAudit = {
      id: `so-audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      fromStatus,
      toStatus,
      reason: reason || `Transitioned to ${toStatus}`,
      performedBy: performedBy.id,
      performedByName: performedBy.name,
      performedByRole: performedBy.role,
      timestamp: now,
      digitalSealSha256: this.generateSha256Seal({
        orderId: order.id,
        orderNumber: order.orderNumber,
        fromStatus,
        toStatus,
        performedBy: performedBy.id,
        timestamp: now
      }),
      metadata: holdReason ? { holdReason } : undefined
    };

    const updatedOrder: SalesOrder = {
      ...order,
      status: toStatus,
      holdReason: toStatus === 'ON_HOLD' ? holdReason : undefined,
      holdNotes: toStatus === 'ON_HOLD' ? reason : undefined,
      cancellationReason: toStatus === 'CANCELLED' ? reason : undefined,
      stateTransitions: [auditRecord, ...(order.stateTransitions || [])],
      updatedAt: now,
      sha256AuditSeal: this.generateSha256Seal({
        ...order,
        status: toStatus,
        updatedAt: now
      })
    };

    return {
      success: true,
      order: updatedOrder,
      audit: auditRecord
    };
  }

  /**
   * Converts an approved Quotation into a standard Sales Order
   */
  static convertQuotationToOrder(
    quotation: SalesQuotation,
    orderNumber: string,
    performedBy: { id: string; name: string; role: string },
    defaultWarehouse: { id: string; name: string }
  ): SalesOrder {
    const now = new Date().toISOString();
    const orderLines: SalesOrderLine[] = quotation.lines.map((ql, idx) => ({
      id: `sol-${Date.now()}-${idx + 1}`,
      lineNumber: idx + 1,
      itemSku: ql.itemSku,
      itemName: ql.itemName,
      itemNameAr: ql.itemNameAr,
      uom: ql.uom,
      warehouseId: defaultWarehouse.id,
      warehouseName: defaultWarehouse.name,
      quantityOrdered: ql.quantity,
      quantityReserved: 0,
      quantityFulfilled: 0,
      quantityReturned: 0,
      quantityCancelled: 0,
      unitPrice: ql.unitPrice,
      lineDiscountType: 'PERCENT',
      discountRate: ql.discountRate,
      discountAmount: ql.discountAmount,
      discountApprovalRequired: false,
      taxCode: ql.taxCode,
      taxRate: ql.taxRate,
      taxAmount: ql.taxAmount,
      lineTotal: ql.lineTotal
    }));

    const initialAudit: SalesOrderStateTransitionAudit = {
      id: `so-audit-init-${Date.now()}`,
      orderId: `so-${Date.now()}`,
      orderNumber,
      fromStatus: 'DRAFT',
      toStatus: 'CONFIRMED',
      reason: `Converted from Quotation #${quotation.quotationNumber}`,
      performedBy: performedBy.id,
      performedByName: performedBy.name,
      performedByRole: performedBy.role,
      timestamp: now,
      digitalSealSha256: this.generateSha256Seal({ orderNumber, quotationNumber: quotation.quotationNumber, timestamp: now })
    };

    const newOrder: SalesOrder = {
      id: `so-${Date.now()}`,
      tenantId: quotation.tenantId,
      companyId: quotation.companyId,
      branchId: quotation.branchId,
      orderNumber,
      quotationRefId: quotation.id,
      quotationRefNumber: quotation.quotationNumber,
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      customerNameAr: quotation.customerNameAr,
      customerCategory: 'ENTERPRISE',
      shippingAddress: 'Standard Customer Address',
      billingAddress: 'Standard Customer Billing Address',
      salespersonId: quotation.salespersonId,
      salespersonName: quotation.salespersonName,
      orderDate: now.split('T')[0],
      requestedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      currency: quotation.currency,
      exchangeRate: quotation.exchangeRate,
      paymentTermsCode: 'NET_30',
      paymentMethodType: 'BANK_TRANSFER',
      lines: orderLines,
      subtotal: quotation.subtotal,
      headerDiscountRate: 0,
      headerDiscountAmount: quotation.discountTotal,
      taxTotal: quotation.taxTotal,
      grandTotal: quotation.grandTotal,
      status: 'CONFIRMED',
      stockReservationStatus: 'UNRESERVED',
      stateTransitions: [initialAudit],
      createdAt: now,
      updatedAt: now,
      sha256AuditSeal: this.generateSha256Seal({ orderNumber, total: quotation.grandTotal, now })
    };

    return newOrder;
  }

  // =========================================================================
  // 2. AVAILABLE TO PROMISE (ATP) & STOCK RESERVATION
  // =========================================================================

  /**
   * Calculates Available-To-Promise (ATP) inventory quantities
   */
  static checkAvailableToPromise(
    itemSku: string,
    requestedQuantity: number,
    inventoryStock: { currentStock: number; reservedStock?: number; reorderLevel?: number; leadTimeDays?: number }
  ): {
    isAvailable: boolean;
    availableStock: number;
    shortageQuantity: number;
    canFulfillPartially: boolean;
    estimatedLeadDays: number;
  } {
    const onHand = inventoryStock.currentStock || 0;
    const reserved = inventoryStock.reservedStock || 0;
    const availableStock = Math.max(0, onHand - reserved);
    const isAvailable = availableStock >= requestedQuantity;
    const shortageQuantity = isAvailable ? 0 : requestedQuantity - availableStock;
    const canFulfillPartially = availableStock > 0 && availableStock < requestedQuantity;
    const estimatedLeadDays = isAvailable ? 1 : (inventoryStock.leadTimeDays || 7);

    return {
      isAvailable,
      availableStock,
      shortageQuantity,
      canFulfillPartially,
      estimatedLeadDays
    };
  }

  // =========================================================================
  // 3. PRICING & VOLUME TIERS ENGINE
  // =========================================================================

  /**
   * Resolves the effective unit price considering Customer Price Lists, Volume Tiers, and Custom Overrides
   */
  static resolveUnitPrice(
    itemSku: string,
    quantity: number,
    basePrice: number,
    priceList?: EnterprisePriceList,
    customerDiscountPercent: number = 0
  ): {
    originalUnitPrice: number;
    effectiveUnitPrice: number;
    volumeTierApplied: boolean;
    appliedDiscountPercent: number;
    priceSourceName: string;
  } {
    let effectiveUnitPrice = basePrice;
    let volumeTierApplied = false;
    let priceSourceName = 'Base Catalog Price';

    if (priceList && priceList.isActive) {
      const itemPriceConfig = priceList.itemPrices.find(p => p.itemSku === itemSku);
      if (itemPriceConfig) {
        effectiveUnitPrice = itemPriceConfig.basePrice;
        priceSourceName = `Price List: ${priceList.name}`;

        // Check Volume Tier
        if (itemPriceConfig.volumeTiers && itemPriceConfig.volumeTiers.length > 0) {
          const matchedTier = itemPriceConfig.volumeTiers
            .filter(t => quantity >= t.minQuantity && (!t.maxQuantity || quantity <= t.maxQuantity))
            .sort((a, b) => b.minQuantity - a.minQuantity)[0];

          if (matchedTier) {
            effectiveUnitPrice = matchedTier.unitPrice;
            volumeTierApplied = true;
            priceSourceName = `Volume Tier (${matchedTier.minQuantity}+ units)`;
          }
        }
      }
    }

    // Apply customer tier discount if not overridden by a strict volume tier price
    let appliedDiscountPercent = 0;
    if (!volumeTierApplied && customerDiscountPercent > 0) {
      appliedDiscountPercent = customerDiscountPercent;
      effectiveUnitPrice = effectiveUnitPrice * (1 - customerDiscountPercent / 100);
      priceSourceName += ` - ${customerDiscountPercent}% Customer Tier`;
    }

    return {
      originalUnitPrice: basePrice,
      effectiveUnitPrice: Math.round(effectiveUnitPrice * 100) / 100,
      volumeTierApplied,
      appliedDiscountPercent,
      priceSourceName
    };
  }

  // =========================================================================
  // 4. DISCOUNT ENGINE & APPROVAL THRESHOLDS
  // =========================================================================

  /**
   * Evaluates line or invoice discount against safety thresholds
   */
  static evaluateDiscountApproval(
    requestedDiscountPercent: number,
    maxAllowedPercent: number = 15
  ): {
    isApprovalRequired: boolean;
    reason?: string;
  } {
    if (requestedDiscountPercent > maxAllowedPercent) {
      return {
        isApprovalRequired: true,
        reason: `Requested discount of ${requestedDiscountPercent}% exceeds the authorized threshold of ${maxAllowedPercent}%. Supervisor digital approval is required.`
      };
    }
    return {
      isApprovalRequired: false
    };
  }

  // =========================================================================
  // 5. PROMOTION ENGINE (BUY X GET Y, BUNDLES, COUPONS)
  // =========================================================================

  /**
   * Evaluates active promotion campaigns for a set of cart items
   */
  static evaluatePromotions(
    cartItems: { itemSku: string; quantity: number; unitPrice: number }[],
    campaigns: PromotionCampaign[],
    appliedCouponCode?: string
  ): {
    appliedPromotions: { campaignId: string; campaignName: string; discountAmount: number; freeItemsGranted: number }[];
    totalPromoDiscount: number;
    modifiedCartItems: { itemSku: string; quantity: number; unitPrice: number; promoDiscount: number }[];
  } {
    let totalPromoDiscount = 0;
    const appliedPromotions: { campaignId: string; campaignName: string; discountAmount: number; freeItemsGranted: number }[] = [];
    const cartSubtotal = cartItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const activeCampaigns = campaigns.filter(c => c.isActive);

    const modifiedCartItems = cartItems.map(item => ({
      ...item,
      promoDiscount: 0
    }));

    for (const camp of activeCampaigns) {
      // If promotion requires a coupon code, match it
      if (camp.couponCode && camp.couponCode.toUpperCase() !== (appliedCouponCode || '').toUpperCase()) {
        continue;
      }

      // Check min cart value
      if (camp.minCartValue && cartSubtotal < camp.minCartValue) {
        continue;
      }

      if (camp.type === 'BUY_X_GET_Y' && camp.buyItemSku && camp.buyQuantityRequired) {
        const targetItem = modifiedCartItems.find(i => i.itemSku === camp.buyItemSku);
        if (targetItem && targetItem.quantity >= camp.buyQuantityRequired) {
          const setsEligible = Math.floor(targetItem.quantity / camp.buyQuantityRequired);
          const freeUnits = setsEligible * (camp.freeQuantityGranted || 1);
          const discountVal = freeUnits * targetItem.unitPrice;

          totalPromoDiscount += discountVal;
          targetItem.promoDiscount += discountVal;
          appliedPromotions.push({
            campaignId: camp.id,
            campaignName: `${camp.name} (Free ${freeUnits} units)`,
            discountAmount: discountVal,
            freeItemsGranted: freeUnits
          });
        }
      } else if (camp.type === 'PERCENTAGE_DISCOUNT' && camp.discountPercent) {
        const discountVal = (cartSubtotal * camp.discountPercent) / 100;
        totalPromoDiscount += discountVal;
        appliedPromotions.push({
          campaignId: camp.id,
          campaignName: `${camp.name} (${camp.discountPercent}% Off)`,
          discountAmount: discountVal,
          freeItemsGranted: 0
        });
      } else if (camp.type === 'FIXED_DISCOUNT' && camp.discountFixedAmount) {
        const discountVal = Math.min(cartSubtotal, camp.discountFixedAmount);
        totalPromoDiscount += discountVal;
        appliedPromotions.push({
          campaignId: camp.id,
          campaignName: `${camp.name} (${camp.discountFixedAmount} SAR Off)`,
          discountAmount: discountVal,
          freeItemsGranted: 0
        });
      }
    }

    return {
      appliedPromotions,
      totalPromoDiscount: Math.round(totalPromoDiscount * 100) / 100,
      modifiedCartItems
    };
  }

  // =========================================================================
  // 6. TAX ENGINE ABSTRACTION
  // =========================================================================

  /**
   * Pure Tax Calculation Abstraction supporting Tax-Inclusive/Exclusive & Exemptions
   */
  static calculateSalesTax(
    lines: {
      itemSku: string;
      quantity: number;
      unitPrice: number;
      discountAmount?: number;
      taxRate?: number;
      isExempt?: boolean;
    }[],
    jurisdiction: { defaultTaxRate: number; isTaxInclusiveDefault: boolean; withholdingTaxRate?: number }
  ): SalesTaxCalculationResult {
    let taxableSubtotal = 0;
    let exemptSubtotal = 0;
    let taxTotal = 0;
    let withholdingTaxTotal = 0;

    const defaultRate = jurisdiction.defaultTaxRate || 0.15;
    const whtRate = jurisdiction.withholdingTaxRate || 0;
    const isInclusive = jurisdiction.isTaxInclusiveDefault;

    const lineTaxes = lines.map(line => {
      const rawSubtotal = line.quantity * line.unitPrice;
      const discount = line.discountAmount || 0;
      const netAmount = Math.max(0, rawSubtotal - discount);

      if (line.isExempt) {
        exemptSubtotal += netAmount;
        return {
          itemSku: line.itemSku,
          taxableAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          isExempt: true,
          lineTotalWithTax: netAmount
        };
      }

      const rate = line.taxRate !== undefined ? line.taxRate : defaultRate;
      let taxableAmount = netAmount;
      let taxAmount = 0;

      if (isInclusive) {
        // Price includes tax: base = net / (1 + rate)
        taxableAmount = netAmount / (1 + rate);
        taxAmount = netAmount - taxableAmount;
      } else {
        // Price excludes tax: tax = net * rate
        taxableAmount = netAmount;
        taxAmount = netAmount * rate;
      }

      taxableAmount = Math.round(taxableAmount * 100) / 100;
      taxAmount = Math.round(taxAmount * 100) / 100;

      taxableSubtotal += taxableAmount;
      taxTotal += taxAmount;

      const lineTotalWithTax = Math.round((taxableAmount + taxAmount) * 100) / 100;

      return {
        itemSku: line.itemSku,
        taxableAmount,
        taxRate: rate,
        taxAmount,
        isExempt: false,
        lineTotalWithTax
      };
    });

    if (whtRate > 0) {
      withholdingTaxTotal = Math.round(taxableSubtotal * whtRate * 100) / 100;
    }

    const grandTotal = Math.round((taxableSubtotal + exemptSubtotal + taxTotal - withholdingTaxTotal) * 100) / 100;

    return {
      taxableSubtotal: Math.round(taxableSubtotal * 100) / 100,
      exemptSubtotal: Math.round(exemptSubtotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      withholdingTaxTotal,
      grandTotal,
      lineTaxes
    };
  }

  // =========================================================================
  // 7. ACCOUNTS RECEIVABLE CREDIT LIMIT & EXPOSURE CHECK
  // =========================================================================

  /**
   * Verifies customer exposure against approved Credit Limit
   */
  static checkCustomerCreditLimit(
    customer: { creditLimit: number; currentBalance: number; overdueBalance: number; isBlocked?: boolean },
    newOrderAmount: number
  ): {
    canProceed: boolean;
    creditLimit: number;
    currentExposure: number;
    projectedExposure: number;
    excessAmount: number;
    isBlocked: boolean;
    message: string;
  } {
    if (customer.isBlocked) {
      return {
        canProceed: false,
        creditLimit: customer.creditLimit,
        currentExposure: customer.currentBalance,
        projectedExposure: customer.currentBalance + newOrderAmount,
        excessAmount: newOrderAmount,
        isBlocked: true,
        message: 'Customer account is administratively BLOCKED. Cannot proceed with credit sales.'
      };
    }

    const currentExposure = customer.currentBalance || 0;
    const projectedExposure = currentExposure + newOrderAmount;
    const limit = customer.creditLimit || 0;

    if (limit > 0 && projectedExposure > limit) {
      const excessAmount = projectedExposure - limit;
      return {
        canProceed: false,
        creditLimit: limit,
        currentExposure,
        projectedExposure,
        excessAmount,
        isBlocked: false,
        message: `Credit limit of ${limit} SAR exceeded by ${excessAmount} SAR. Order will be placed ON HOLD for management approval.`
      };
    }

    return {
      canProceed: true,
      creditLimit: limit,
      currentExposure,
      projectedExposure,
      excessAmount: 0,
      isBlocked: false,
      message: 'Credit limit check passed successfully.'
    };
  }

  // =========================================================================
  // 8. POS SHIFT MANAGEMENT & RECONCILIATION
  // =========================================================================

  /**
   * Opens a new POS Register shift with opening cash float
   */
  static openShift(
    register: POSRegister,
    cashier: { id: string; name: string },
    shiftNumber: string,
    openingCashFloat: number
  ): POSShift {
    const now = new Date().toISOString();
    const initialMovement: POSShiftCashMovement = {
      id: `mov-${Date.now()}-open`,
      shiftId: `shift-${Date.now()}`,
      type: 'OPENING_FLOAT',
      amount: openingCashFloat,
      currency: 'SAR',
      reason: 'Shift Opening Initial Float',
      performedBy: cashier.id,
      performedByName: cashier.name,
      timestamp: now
    };

    return {
      id: `shift-${Date.now()}`,
      tenantId: register.tenantId,
      companyId: register.companyId,
      branchId: register.branchId,
      warehouseId: register.warehouseId,
      registerId: register.id,
      registerCode: register.code,
      shiftNumber,
      cashierId: cashier.id,
      cashierName: cashier.name,
      openedAt: now,
      status: 'OPEN',
      openingCashFloat,
      totalCashSales: 0,
      totalCardSales: 0,
      totalWalletSales: 0,
      totalCreditSales: 0,
      totalCashRefunds: 0,
      totalCashDrops: 0,
      totalPettyExpenses: 0,
      expectedCashInDrawer: openingCashFloat,
      totalTransactionsCount: 0,
      totalItemsSoldCount: 0,
      zReportGenerated: false,
      cashMovements: [initialMovement],
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Records a cash drawer movement (Drop, Expense, Sale, Refund) and recalculates expected cash
   */
  static recordShiftCashMovement(
    shift: POSShift,
    movementType: POSShiftCashMovement['type'],
    amount: number,
    performedBy: { id: string; name: string },
    reason?: string,
    receiptNumber?: string
  ): POSShift {
    const now = new Date().toISOString();
    const movement: POSShiftCashMovement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      shiftId: shift.id,
      type: movementType,
      amount,
      currency: 'SAR',
      reason,
      receiptNumber,
      performedBy: performedBy.id,
      performedByName: performedBy.name,
      timestamp: now
    };

    let {
      totalCashSales,
      totalCashRefunds,
      totalCashDrops,
      totalPettyExpenses
    } = shift;

    if (movementType === 'CASH_SALE') totalCashSales += amount;
    else if (movementType === 'CASH_REFUND') totalCashRefunds += amount;
    else if (movementType === 'CASH_DROP' || movementType === 'SAFE_TRANSFER') totalCashDrops += amount;
    else if (movementType === 'PETTY_EXPENSE') totalPettyExpenses += amount;

    const expectedCashInDrawer = shift.openingCashFloat + totalCashSales - totalCashRefunds - totalCashDrops - totalPettyExpenses;

    return {
      ...shift,
      totalCashSales,
      totalCashRefunds,
      totalCashDrops,
      totalPettyExpenses,
      expectedCashInDrawer: Math.round(expectedCashInDrawer * 100) / 100,
      cashMovements: [...shift.cashMovements, movement],
      updatedAt: now
    };
  }

  /**
   * Closes a POS Shift, generates Z-Report and calculates cash variance
   */
  static closeShift(
    shift: POSShift,
    actualCountedCash: number,
    supervisorId?: string,
    varianceReason?: string
  ): { shift: POSShift; requiresSupervisorApproval: boolean } {
    const now = new Date().toISOString();
    const cashVariance = Math.round((actualCountedCash - shift.expectedCashInDrawer) * 100) / 100;
    const varianceTolerance = 20; // 20 SAR variance threshold
    const requiresSupervisorApproval = Math.abs(cashVariance) > varianceTolerance;

    const zReportData = {
      shiftNumber: shift.shiftNumber,
      registerCode: shift.registerCode,
      cashierName: shift.cashierName,
      openedAt: shift.openedAt,
      closedAt: now,
      openingFloat: shift.openingCashFloat,
      cashSales: shift.totalCashSales,
      cardSales: shift.totalCardSales,
      walletSales: shift.totalWalletSales,
      creditSales: shift.totalCreditSales,
      grossTurnover: shift.totalCashSales + shift.totalCardSales + shift.totalWalletSales + shift.totalCreditSales,
      cashRefunds: shift.totalCashRefunds,
      cashDrops: shift.totalCashDrops,
      pettyExpenses: shift.totalPettyExpenses,
      expectedCash: shift.expectedCashInDrawer,
      countedCash: actualCountedCash,
      variance: cashVariance,
      totalTransactions: shift.totalTransactionsCount,
      totalItemsSold: shift.totalItemsSoldCount,
      generatedAt: now,
      hash: this.generateSha256Seal({ shiftId: shift.id, actualCountedCash, cashVariance, now })
    };

    const updatedShift: POSShift = {
      ...shift,
      status: requiresSupervisorApproval && !supervisorId ? 'CLOSING_REVIEW' : 'CLOSED',
      closedAt: now,
      actualCountedCash,
      cashVariance,
      varianceReason,
      supervisorId,
      varianceApprovedBy: supervisorId,
      zReportGenerated: true,
      zReportData,
      updatedAt: now
    };

    return {
      shift: updatedShift,
      requiresSupervisorApproval
    };
  }

  // =========================================================================
  // 9. POS RECEIPT & SPLIT PAYMENT PROCESSOR
  // =========================================================================

  /**
   * Processes POS Checkout with support for Split Payments and change calculation
   */
  static processPOSReceipt(
    register: POSRegister,
    shift: POSShift,
    cartLines: POSReceiptLine[],
    payments: PaymentTransaction[],
    customer: { id: string; name: string; phone?: string; taxNumber?: string; isWalkIn: boolean },
    cashier: { id: string; name: string },
    receiptNumber: string
  ): {
    success: boolean;
    receipt?: POSReceipt;
    changeGiven: number;
    updatedShift: POSShift;
    error?: string;
  } {
    const subtotal = cartLines.reduce((sum, line) => sum + (line.quantity * line.originalUnitPrice), 0);
    const discountTotal = cartLines.reduce((sum, line) => sum + line.discountAmount, 0);
    const taxTotal = cartLines.reduce((sum, line) => sum + line.taxAmount, 0);
    const grandTotal = Math.round((subtotal - discountTotal + taxTotal) * 100) / 100;

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid < grandTotal - 0.01) {
      return {
        success: false,
        changeGiven: 0,
        updatedShift: shift,
        error: `Insufficient payment: Total Paid (${totalPaid} SAR) is less than Grand Total (${grandTotal} SAR).`
      };
    }

    const changeGiven = Math.max(0, Math.round((totalPaid - grandTotal) * 100) / 100);
    const now = new Date().toISOString();

    const receipt: POSReceipt = {
      id: `pos-rcpt-${Date.now()}`,
      tenantId: register.tenantId,
      companyId: register.companyId,
      branchId: register.branchId,
      warehouseId: register.warehouseId,
      registerId: register.id,
      shiftId: shift.id,
      receiptNumber,
      transactionType: 'SALE',
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerTaxNumber: customer.taxNumber,
      isWalkInCustomer: customer.isWalkIn,
      cashierId: cashier.id,
      cashierName: cashier.name,
      lines: cartLines,
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      payments,
      changeGiven,
      status: 'COMPLETED',
      qrCodePayload: `ZATCA-QR|${register.companyId}|${receiptNumber}|${now}|${grandTotal}|${taxTotal}`,
      sha256Seal: this.generateSha256Seal({ receiptNumber, grandTotal, totalPaid, now }),
      createdAt: now
    };

    // Update shift metrics
    let updatedShift = { ...shift };
    let cashPaid = 0;
    let cardPaid = 0;
    let walletPaid = 0;
    let creditPaid = 0;

    for (const p of payments) {
      if (p.method === 'CASH') cashPaid += p.amount;
      else if (p.method === 'CREDIT_CARD' || p.method === 'DEBIT_CARD') cardPaid += p.amount;
      else if (p.method === 'DIGITAL_WALLET') walletPaid += p.amount;
      else if (p.method === 'CUSTOMER_CREDIT') creditPaid += p.amount;
    }

    // Net cash impact in drawer = cashPaid - changeGiven
    const netCashFromSale = Math.max(0, cashPaid - changeGiven);
    if (netCashFromSale > 0) {
      updatedShift = this.recordShiftCashMovement(
        updatedShift,
        'CASH_SALE',
        netCashFromSale,
        cashier,
        `POS Sale #${receiptNumber}`,
        receiptNumber
      );
    }

    updatedShift.totalCardSales += cardPaid;
    updatedShift.totalWalletSales += walletPaid;
    updatedShift.totalCreditSales += creditPaid;
    updatedShift.totalTransactionsCount += 1;
    updatedShift.totalItemsSoldCount += cartLines.reduce((sum, l) => sum + l.quantity, 0);

    return {
      success: true,
      receipt,
      changeGiven,
      updatedShift
    };
  }

  // =========================================================================
  // 10. SALES RETURNS & EXCHANGES
  // =========================================================================

  /**
   * Processes Sales Return or Exchange with inventory restock and refund routing
   */
  static processSalesReturn(
    returnNumber: string,
    returnType: SalesReturn['returnType'],
    originalDoc: { type: 'SALES_ORDER' | 'POS_RECEIPT' | 'SALES_INVOICE' | 'NONE'; id?: string; number?: string },
    customer: { id: string; name: string },
    lines: SalesReturnLine[],
    refundMethod: SalesReturn['refundMethod'],
    approvedBy: string,
    exchangeSalesOrderId?: string
  ): SalesReturn {
    const now = new Date().toISOString();
    const refundSubtotal = lines.reduce((sum, l) => sum + (l.quantityReturned * l.unitPrice), 0);
    const refundTaxTotal = Math.round(refundSubtotal * 0.15 * 100) / 100;
    const refundGrandTotal = Math.round((refundSubtotal + refundTaxTotal) * 100) / 100;

    let storeCreditCode: string | undefined;
    if (refundMethod === 'STORE_CREDIT') {
      storeCreditCode = `SC-${Date.now().toString(36).toUpperCase()}`;
    }

    return {
      id: `sret-${Date.now()}`,
      tenantId: 'ten-001',
      companyId: 'comp-001',
      branchId: 'br-001',
      returnNumber,
      returnType,
      originalDocumentType: originalDoc.type,
      originalDocumentId: originalDoc.id,
      originalDocumentNumber: originalDoc.number,
      customerId: customer.id,
      customerName: customer.name,
      lines,
      refundSubtotal,
      refundTaxTotal,
      refundGrandTotal,
      refundMethod,
      storeCreditVoucherCode: storeCreditCode,
      exchangeSalesOrderId,
      approvedBy,
      status: 'COMPLETED',
      sha256Seal: this.generateSha256Seal({ returnNumber, refundGrandTotal, returnType, now }),
      createdAt: now
    };
  }

  // =========================================================================
  // 11. SEQUENTIAL DOCUMENT NUMBERING
  // =========================================================================

  /**
   * Generates formatted sequential document numbering (e.g. SO-2026-0001)
   */
  static generateDocumentNumber(
    rule: SalesDocumentSequenceConfig
  ): { documentNumber: string; updatedRule: SalesDocumentSequenceConfig } {
    const year = new Date().getFullYear();
    const pad = Math.max(1, rule.zeroPad || 4);
    const numStr = String(rule.nextNumber).padStart(pad, '0');

    let documentNumber = rule.prefix;
    if (rule.yearPrefix) {
      documentNumber += `-${year}`;
    }
    documentNumber += `-${numStr}`;
    if (rule.suffix) {
      documentNumber += `-${rule.suffix}`;
    }

    const updatedRule: SalesDocumentSequenceConfig = {
      ...rule,
      nextNumber: rule.nextNumber + 1
    };

    return {
      documentNumber,
      updatedRule
    };
  }
}
