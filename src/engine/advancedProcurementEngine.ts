/**
 * AM Business Platform - Advanced Procurement Engine (Phase 3.2B-08)
 * Evaluated Receipt Settlement (ERS), Vendor Consignment, Landed Cost Variance Adjustments,
 * Multi-Criteria Supplier Scorecarding & Vendor Prepayment Amortization
 * Aligned with SAP S/4HANA (MM-PUR / MRRL / MRKO / ME61), Oracle Cloud SCM & IFRS Standards
 */

import {
  ERSInvoice,
  ERSInvoiceItem,
  ERSRunParams,
  ERSRunResult,
  ConsignmentAgreement,
  ConsignmentStockRecord,
  ConsignmentWithdrawal,
  ConsignmentSettlement,
  ConsignmentSettlementItem,
  LandedCostActualInvoice,
  LandedCostVarianceAdjustment,
  LandedCostVarianceAllocation,
  LandedCostAllocationBasis,
  SupplierScorecard,
  SupplierTier,
  SupplierStatusRecommendation,
  ScorecardPillarScore,
  SupplierEvaluationWeightConfig,
  VendorPrepayment,
  PrepaymentApplicationRecord,
  GoodsReceiptNote,
  GoodsReceiptItem,
  PurchaseOrder,
  PurchaseOrderItem,
  VendorMaster,
  PurchaseAuditRecord
} from '../types/procurement';

import {
  SupplierInvoice,
  APVoucher
} from '../types/accountsPayable';

import { WorkflowEngine } from './workflowEngine';

export class AdvancedProcurementEngine {

  // =========================================================================
  // 1. EVALUATED RECEIPT SETTLEMENT (ERS) / SELF-BILLING ENGINE
  // =========================================================================

  /**
   * Evaluates verified Goods Receipts (GRN) and generates ERS self-billing tax invoices
   * based on PO contracted prices and inspected accepted quantities.
   */
  public static generateERSInvoices(
    params: ERSRunParams,
    goodsReceipts: GoodsReceiptNote[],
    purchaseOrders: PurchaseOrder[],
    existingERSInvoices: ERSInvoice[] = []
  ): ERSRunResult {
    const runId = `ERS-RUN-${Date.now()}`;
    const generatedInvoices: ERSInvoice[] = [];

    // Filter eligible GRNs:
    // 1. Tenant and Company match
    // 2. Status is POSTED
    // 3. Quality status is APPROVED or PARTIALLY_APPROVED
    // 4. Received date <= cutoffDate
    // 5. VendorId matches if specified
    // 6. Not already settled by existing ERS invoice
    const settledGRNIds = new Set(existingERSInvoices.map(inv => inv.grnId));

    const eligibleGRNs = goodsReceipts.filter(grn => {
      if (grn.tenantId !== params.tenantId || grn.companyId !== params.companyId) {
        return false;
      }
      if (grn.status !== 'POSTED') {
        return false;
      }
      if (grn.qualityStatus !== 'APPROVED' && grn.qualityStatus !== 'PARTIALLY_APPROVED') {
        return false;
      }
      if (params.vendorId && grn.vendorId !== params.vendorId) {
        return false;
      }
      if (grn.receivedAt && grn.receivedAt > params.cutoffDate) {
        return false;
      }
      if (settledGRNIds.has(grn.id)) {
        return false;
      }
      return true;
    });

    let totalGrossAmount = 0;
    const taxRate = params.taxPercent !== undefined ? params.taxPercent : 15.0; // Default 15% VAT

    for (let i = 0; i < eligibleGRNs.length; i++) {
      const grn = eligibleGRNs[i];
      const po = purchaseOrders.find(p => p.id === grn.poId);

      const items: ERSInvoiceItem[] = [];
      let grnNetAmount = 0;
      let grnTaxAmount = 0;

      for (const grnItem of grn.items) {
        // Use accepted quantity if available, otherwise received quantity
        const acceptedQty = grnItem.acceptedQty !== undefined ? grnItem.acceptedQty : grnItem.receivedQty;
        if (acceptedQty <= 0) continue;

        // Find PO item price
        const poItem = po?.items?.find(pi => pi.id === grnItem.poItemId || pi.itemSku === grnItem.itemSku);
        const unitPrice = poItem?.unitPrice || grnItem.unitCost || 0;

        const lineNet = Math.round(acceptedQty * unitPrice * 100) / 100;
        const lineTax = Math.round(lineNet * (taxRate / 100) * 100) / 100;
        const lineGross = Math.round((lineNet + lineTax) * 100) / 100;

        grnNetAmount += lineNet;
        grnTaxAmount += lineTax;

        items.push({
          id: `ers-item-${Date.now()}-${items.length + 1}`,
          grnItemId: grnItem.id,
          poItemId: grnItem.poItemId || (poItem ? poItem.id : 'po-item-auto'),
          itemSku: grnItem.itemSku,
          itemName: grnItem.itemName,
          acceptedQty,
          uom: grnItem.receivedUOM || 'EA',
          contractUnitPrice: unitPrice,
          lineNetAmount: lineNet,
          taxPercent: taxRate,
          taxAmount: lineTax,
          lineGrossAmount: lineGross
        });
      }

      if (items.length === 0) continue;

      const grossAmount = Math.round((grnNetAmount + grnTaxAmount) * 100) / 100;
      totalGrossAmount += grossAmount;

      const seq = String(i + 1).padStart(4, '0');
      const timestamp = new Date().toISOString();
      const ersNumber = `ERS-${new Date().getFullYear()}-${seq}`;
      const selfBillingInvoiceNumber = `SBI-${new Date().getFullYear()}-${seq}`;

      const payload = `${params.tenantId}|${params.companyId}|${ersNumber}|${grn.id}|${grossAmount}|${timestamp}`;
      const immutableHash = `ERS-HASH-${WorkflowEngine.hashPayload(payload)}`;

      const ersInvoice: ERSInvoice = {
        id: `ers-${Date.now()}-${i + 1}`,
        tenantId: params.tenantId,
        companyId: params.companyId,
        ersNumber,
        selfBillingInvoiceNumber,
        grnId: grn.id,
        grnNumber: grn.grnNumber,
        poId: grn.poId,
        poNumber: grn.poNumber,
        vendorId: grn.vendorId,
        vendorCode: (grn as any).vendorCode || (po ? po.vendorCode : 'VEND-AUTO'),
        vendorName: grn.vendorName,
        postingDate: params.cutoffDate,
        dueDate: new Date(Date.parse(params.cutoffDate) + 30 * 86400000).toISOString().split('T')[0],
        currency: grn.currency || 'USD',
        exchangeRate: grn.exchangeRate || 1.0,
        netAmount: grnNetAmount,
        taxAmount: grnTaxAmount,
        grossAmount,
        status: 'POSTED',
        items,
        voucherId: `vch-ers-${Date.now()}-${i + 1}`,
        voucherNumber: `VCH-ERS-${ersNumber}`,
        generatedBy: params.performedBy,
        generatedAt: timestamp,
        immutableHash
      };

      generatedInvoices.push(ersInvoice);
    }

    return {
      runId,
      timestamp: new Date().toISOString(),
      processedGRNCount: eligibleGRNs.length,
      generatedInvoicesCount: generatedInvoices.length,
      totalGrossAmount: Math.round(totalGrossAmount * 100) / 100,
      invoices: generatedInvoices
    };
  }

  // =========================================================================
  // 2. VENDOR CONSIGNMENT INVENTORY & SETTLEMENT ENGINE
  // =========================================================================

  /**
   * Creates a formal Vendor Consignment Agreement
   */
  public static createConsignmentAgreement(data: Partial<ConsignmentAgreement>): ConsignmentAgreement {
    if (!data.tenantId || !data.companyId || !data.vendorId || !data.itemSku) {
      throw new Error('CONSIGNMENT_INVALID_INPUT: tenantId, companyId, vendorId, and itemSku are required.');
    }

    const agreementNumber = data.agreementNumber || `VCA-${Date.now().toString().slice(-6)}`;
    return {
      id: data.id || `vca-${Date.now()}`,
      tenantId: data.tenantId,
      companyId: data.companyId,
      vendorId: data.vendorId,
      vendorCode: data.vendorCode || 'VEND-001',
      vendorName: data.vendorName || 'Consignment Supplier',
      agreementNumber,
      itemSku: data.itemSku,
      itemName: data.itemName || data.itemSku,
      agreedPrice: data.agreedPrice || 0,
      currency: data.currency || 'USD',
      uom: data.uom || 'EA',
      warehouseId: data.warehouseId || 'wh-001',
      warehouseName: data.warehouseName || 'Central Warehouse',
      effectiveFrom: data.effectiveFrom || new Date().toISOString().split('T')[0],
      effectiveTo: data.effectiveTo || '2099-12-31',
      status: data.status || 'ACTIVE',
      taxPercent: data.taxPercent !== undefined ? data.taxPercent : 15.0,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Records a withdrawal / consumption from Vendor Consignment Stock
   */
  public static recordConsignmentWithdrawal(
    data: Partial<ConsignmentWithdrawal>,
    agreement: ConsignmentAgreement,
    currentStock: ConsignmentStockRecord,
    withdrawnBy: string = 'system-user'
  ): { withdrawal: ConsignmentWithdrawal; updatedStock: ConsignmentStockRecord; auditRecord: PurchaseAuditRecord } {
    if (!data.quantity || data.quantity <= 0) {
      throw new Error('CONSIGNMENT_INVALID_QTY: Withdrawal quantity must be greater than zero.');
    }

    if (currentStock.onHandConsignedQty < data.quantity) {
      throw new Error(
        `CONSIGNMENT_STOCK_DEFICIT: Available on-hand consigned stock is ${currentStock.onHandConsignedQty}, requested ${data.quantity}.`
      );
    }

    if (agreement.status !== 'ACTIVE') {
      throw new Error(`CONSIGNMENT_AGREEMENT_INACTIVE: Agreement ${agreement.agreementNumber} is ${agreement.status}.`);
    }

    const netAmount = Math.round(data.quantity * agreement.agreedPrice * 100) / 100;
    const taxAmount = Math.round(netAmount * (agreement.taxPercent / 100) * 100) / 100;
    const grossAmount = Math.round((netAmount + taxAmount) * 100) / 100;

    const withdrawalNumber = `CW-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const timestamp = new Date().toISOString();

    const withdrawal: ConsignmentWithdrawal = {
      id: `cw-${Date.now()}`,
      tenantId: agreement.tenantId,
      companyId: agreement.companyId,
      withdrawalNumber,
      vendorId: agreement.vendorId,
      vendorCode: agreement.vendorCode,
      vendorName: agreement.vendorName,
      warehouseId: agreement.warehouseId,
      warehouseName: agreement.warehouseName,
      itemSku: agreement.itemSku,
      itemName: agreement.itemName,
      quantity: data.quantity,
      uom: agreement.uom,
      unitPrice: agreement.agreedPrice,
      netAmount,
      taxPercent: agreement.taxPercent,
      taxAmount,
      grossAmount,
      currency: agreement.currency,
      withdrawalDate: data.withdrawalDate || timestamp.split('T')[0],
      purpose: data.purpose || 'PRODUCTION',
      costCenterId: data.costCenterId,
      status: 'LOGGED',
      withdrawnBy,
      createdAt: timestamp
    };

    const updatedStock: ConsignmentStockRecord = {
      ...currentStock,
      onHandConsignedQty: currentStock.onHandConsignedQty - data.quantity,
      withdrawnQty: currentStock.withdrawnQty + data.quantity,
      openForSettlementQty: currentStock.openForSettlementQty + data.quantity,
      lastMovementDate: timestamp
    };

    const auditPayload = `${withdrawal.tenantId}|${withdrawal.withdrawalNumber}|${withdrawal.quantity}|${withdrawal.grossAmount}`;
    const auditRecord: PurchaseAuditRecord = {
      id: `aud-${Date.now()}`,
      tenantId: withdrawal.tenantId,
      companyId: withdrawal.companyId,
      actionType: 'CONSIGNMENT_WITHDRAWAL_LOGGED',
      performedBy: withdrawnBy,
      performedByName: 'Inventory Clerk',
      performedAt: timestamp,
      targetDocumentType: 'CONSIGNMENT',
      targetDocumentId: withdrawal.id,
      targetDocumentNumber: withdrawal.withdrawalNumber,
      details: `Logged consignment stock consumption of ${withdrawal.quantity} ${withdrawal.uom} for SKU ${withdrawal.itemSku}`,
      immutableHash: `AUD-HASH-${WorkflowEngine.hashPayload(auditPayload)}`
    };

    return { withdrawal, updatedStock, auditRecord };
  }

  /**
   * Generates periodic AP Settlement for open consignment withdrawals
   */
  public static settleConsignmentConsumption(
    tenantId: string,
    companyId: string,
    vendorId: string,
    periodStart: string,
    periodEnd: string,
    withdrawals: ConsignmentWithdrawal[],
    settledBy: string = 'system-accountant'
  ): { settlement: ConsignmentSettlement; settledWithdrawals: ConsignmentWithdrawal[]; auditRecord: PurchaseAuditRecord } {
    // Filter open withdrawals for the vendor and period
    const openWithdrawals = withdrawals.filter(w => {
      if (w.tenantId !== tenantId || w.companyId !== companyId || w.vendorId !== vendorId) {
        return false;
      }
      if (w.status !== 'LOGGED') {
        return false;
      }
      if (w.withdrawalDate < periodStart || w.withdrawalDate > periodEnd) {
        return false;
      }
      return true;
    });

    if (openWithdrawals.length === 0) {
      throw new Error('NO_SETTLEABLE_CONSIGNMENT_WITHDRAWALS: No logged withdrawals found for the selected period.');
    }

    const items: ConsignmentSettlementItem[] = [];
    let totalQty = 0;
    let totalNet = 0;
    let totalTax = 0;

    const settlementId = `cs-${Date.now()}`;
    const settlementNumber = `CS-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const timestamp = new Date().toISOString();

    const settledWithdrawals = openWithdrawals.map(w => {
      totalQty += w.quantity;
      totalNet += w.netAmount;
      totalTax += w.taxAmount;

      items.push({
        id: `csi-${Date.now()}-${items.length + 1}`,
        withdrawalId: w.id,
        withdrawalNumber: w.withdrawalNumber,
        itemSku: w.itemSku,
        itemName: w.itemName,
        quantity: w.quantity,
        uom: w.uom,
        unitPrice: w.unitPrice,
        netAmount: w.netAmount,
        taxAmount: w.taxAmount,
        grossAmount: w.grossAmount
      });

      return {
        ...w,
        status: 'SETTLED' as const,
        settlementId
      };
    });

    const totalGross = Math.round((totalNet + totalTax) * 100) / 100;
    const vendor = openWithdrawals[0];

    const hashPayload = `${tenantId}|${companyId}|${settlementNumber}|${totalGross}|${timestamp}`;
    const immutableHash = `CS-HASH-${WorkflowEngine.hashPayload(hashPayload)}`;

    const settlement: ConsignmentSettlement = {
      id: settlementId,
      tenantId,
      companyId,
      settlementNumber,
      vendorId,
      vendorCode: vendor.vendorCode,
      vendorName: vendor.vendorName,
      periodStart,
      periodEnd,
      currency: vendor.currency,
      totalQuantity: totalQty,
      totalNetAmount: Math.round(totalNet * 100) / 100,
      totalTaxAmount: Math.round(totalTax * 100) / 100,
      totalGrossAmount: totalGross,
      items,
      voucherId: `vch-cs-${Date.now()}`,
      voucherNumber: `VCH-${settlementNumber}`,
      status: 'POSTED',
      settledBy,
      settledAt: timestamp,
      immutableHash
    };

    const auditRecord: PurchaseAuditRecord = {
      id: `aud-${Date.now()}`,
      tenantId,
      companyId,
      actionType: 'CONSIGNMENT_SETTLEMENT_POSTED',
      performedBy: settledBy,
      performedByName: 'AP Accountant',
      performedAt: timestamp,
      targetDocumentType: 'CONSIGNMENT',
      targetDocumentId: settlement.id,
      targetDocumentNumber: settlement.settlementNumber,
      details: `Generated consignment AP settlement ${settlement.settlementNumber} for vendor ${vendor.vendorName}. Total Gross: $${totalGross}`,
      immutableHash: `AUD-HASH-${WorkflowEngine.hashPayload(hashPayload)}`
    };

    return { settlement, settledWithdrawals, auditRecord };
  }

  // =========================================================================
  // 3. LANDED COST VARIANCE & CAPITALIZATION ADJUSTMENT ENGINE
  // =========================================================================

  /**
   * Reconciles actual landed cost freight/customs invoice against initial GRN estimate
   * and apportions variance across received items without mathematical penny drift.
   */
  public static calculateLandedCostVarianceAdjustment(
    actualInvoice: LandedCostActualInvoice,
    grn: GoodsReceiptNote,
    allocationBasis: LandedCostAllocationBasis = 'BY_VALUE',
    postedBy: string = 'cost-accountant'
  ): { adjustment: LandedCostVarianceAdjustment; auditRecord: PurchaseAuditRecord } {
    if (actualInvoice.grnId !== grn.id) {
      throw new Error(`LANDED_COST_GRN_MISMATCH: Invoice GRN ID ${actualInvoice.grnId} does not match GRN ${grn.id}`);
    }

    if (grn.items.length === 0) {
      throw new Error('LANDED_COST_EMPTY_GRN: Goods receipt has no line items for cost apportionment.');
    }

    const totalVariance = Math.round((actualInvoice.actualAmount - actualInvoice.estimatedAmount) * 100) / 100;
    const allocations: LandedCostVarianceAllocation[] = [];

    // Calculate basis total
    let basisTotal = 0;
    for (const item of grn.items) {
      if (allocationBasis === 'BY_VALUE') {
        basisTotal += item.totalCost || item.receivedQty * item.unitCost;
      } else {
        basisTotal += item.receivedQty;
      }
    }

    if (basisTotal <= 0) {
      throw new Error('LANDED_COST_ZERO_BASIS: Cannot allocate variance over zero value/quantity basis.');
    }

    let allocatedVarianceSum = 0;

    for (let i = 0; i < grn.items.length; i++) {
      const item = grn.items[i];
      const itemBasis = allocationBasis === 'BY_VALUE' ? (item.totalCost || item.receivedQty * item.unitCost) : item.receivedQty;
      const share = itemBasis / basisTotal;

      let itemVariance: number;
      if (i === grn.items.length - 1) {
        // Last item absorbs remaining cents to eliminate rounding drift
        itemVariance = Math.round((totalVariance - allocatedVarianceSum) * 100) / 100;
      } else {
        itemVariance = Math.round(totalVariance * share * 100) / 100;
        allocatedVarianceSum += itemVariance;
      }

      const allocatedEstimated = Math.round(actualInvoice.estimatedAmount * share * 100) / 100;
      const allocatedActual = Math.round((allocatedEstimated + itemVariance) * 100) / 100;

      const currentCapitalizedUnitCost = item.capitalizedUnitCost || item.unitCost;
      const unitVariance = item.receivedQty > 0 ? itemVariance / item.receivedQty : 0;
      const revisedCapitalizedUnitCost = Math.round((currentCapitalizedUnitCost + unitVariance) * 10000) / 10000;

      allocations.push({
        goodsReceiptItemId: item.id,
        itemSku: item.itemSku,
        itemName: item.itemName,
        receivedQty: item.receivedQty,
        inventoryValueBase: itemBasis,
        allocatedEstimatedCost: allocatedEstimated,
        allocatedActualCost: allocatedActual,
        varianceAdjustment: itemVariance,
        revisedCapitalizedUnitCost
      });
    }

    const timestamp = new Date().toISOString();
    const adjustmentNumber = `LCA-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const hashPayload = `${grn.tenantId}|${grn.companyId}|${adjustmentNumber}|${totalVariance}|${timestamp}`;
    const immutableHash = `LCA-HASH-${WorkflowEngine.hashPayload(hashPayload)}`;

    const adjustment: LandedCostVarianceAdjustment = {
      id: `lca-${Date.now()}`,
      tenantId: grn.tenantId,
      companyId: grn.companyId,
      adjustmentNumber,
      grnId: grn.id,
      grnNumber: grn.grnNumber,
      componentType: actualInvoice.componentType,
      estimatedCostTotal: actualInvoice.estimatedAmount,
      actualCostTotal: actualInvoice.actualAmount,
      totalVariance,
      allocationBasis,
      allocations,
      status: 'APPLIED',
      postedBy,
      postedAt: timestamp,
      immutableHash
    };

    const auditRecord: PurchaseAuditRecord = {
      id: `aud-${Date.now()}`,
      tenantId: grn.tenantId,
      companyId: grn.companyId,
      actionType: 'LANDED_COST_VARIANCE_ADJUSTED',
      performedBy: postedBy,
      performedByName: 'Cost Accountant',
      performedAt: timestamp,
      targetDocumentType: 'GRN',
      targetDocumentId: grn.id,
      targetDocumentNumber: grn.grnNumber,
      details: `Landed cost adjustment ${adjustmentNumber} applied for ${actualInvoice.componentType}. Variance: $${totalVariance}`,
      immutableHash: `AUD-HASH-${WorkflowEngine.hashPayload(hashPayload)}`
    };

    return { adjustment, auditRecord };
  }

  // =========================================================================
  // 4. MULTI-CRITERIA SUPPLIER SCORECARDING & EVALUATION ENGINE
  // =========================================================================

  /**
   * Generates multi-dimensional supplier scorecard (Quality, Delivery, Price, Service)
   * with automated Tier ranking and status recommendation.
   */
  public static evaluateSupplierScorecard(
    tenantId: string,
    companyId: string,
    vendor: { id: string; code: string; name: string },
    evaluationPeriod: string,
    purchaseOrders: PurchaseOrder[],
    goodsReceipts: GoodsReceiptNote[],
    supplierInvoices: SupplierInvoice[],
    customWeights?: SupplierEvaluationWeightConfig,
    evaluatedBy: string = 'procurement-manager'
  ): { scorecard: SupplierScorecard; updatedVendorStatus: SupplierStatusRecommendation; auditRecord: PurchaseAuditRecord } {
    const weights: SupplierEvaluationWeightConfig = customWeights || {
      qualityWeight: 0.35,
      deliveryWeight: 0.30,
      priceWeight: 0.20,
      serviceWeight: 0.15
    };

    // Filter vendor documents
    const vendorPOs = purchaseOrders.filter(p => p.vendorId === vendor.id);
    const vendorGRNs = goodsReceipts.filter(g => g.vendorId === vendor.id);
    const vendorInvoices = supplierInvoices.filter(i => i.vendorId === vendor.id);

    // 1. QUALITY PILLAR (Rejection rate, defect rate, quarantine rate)
    let totalReceivedUnits = 0;
    let totalAcceptedUnits = 0;
    let totalRejectedUnits = 0;

    for (const grn of vendorGRNs) {
      for (const item of grn.items) {
        totalReceivedUnits += item.receivedQty || 0;
        totalAcceptedUnits += item.acceptedQty !== undefined ? item.acceptedQty : item.receivedQty;
        totalRejectedUnits += item.rejectedQty || 0;
      }
    }

    let qualityScore = 100;
    if (totalReceivedUnits > 0) {
      const acceptanceRate = (totalAcceptedUnits / totalReceivedUnits) * 100;
      qualityScore = Math.max(0, Math.min(100, Math.round(acceptanceRate * 10) / 10));
    }

    // 2. DELIVERY PILLAR (On-Time Delivery Rate & Fulfillment Rate)
    let onTimeDeliveries = 0;
    let totalDeliveries = vendorGRNs.length;

    for (const grn of vendorGRNs) {
      const po = vendorPOs.find(p => p.id === grn.poId);
      if (po && po.expectedDeliveryDate && grn.receivedAt) {
        if (grn.receivedAt.split('T')[0] <= po.expectedDeliveryDate.split('T')[0]) {
          onTimeDeliveries++;
        }
      } else {
        onTimeDeliveries++; // Default on time if no date constraint
      }
    }

    let deliveryScore = 100;
    if (totalDeliveries > 0) {
      deliveryScore = Math.round((onTimeDeliveries / totalDeliveries) * 100 * 10) / 10;
    }

    // 3. PRICE / COMMERCIAL PILLAR (Invoice Price Variance adherence)
    let invoiceVarianceCount = 0;
    for (const inv of vendorInvoices) {
      if (inv.threeWayMatchStatus === 'PRICE_VARIANCE_BLOCKED' || (inv as any).priceVariance > 0) {
        invoiceVarianceCount++;
      }
    }

    let priceScore = 100;
    if (vendorInvoices.length > 0) {
      const accurateInvoices = vendorInvoices.length - invoiceVarianceCount;
      priceScore = Math.round((accurateInvoices / vendorInvoices.length) * 100 * 10) / 10;
    }

    // 4. SERVICE / COMPLIANCE PILLAR
    const serviceScore = 95.0; // Baseline service compliance

    const pillars: ScorecardPillarScore[] = [
      {
        pillar: 'QUALITY',
        weight: weights.qualityWeight,
        rawScore: qualityScore,
        weightedScore: Math.round(qualityScore * weights.qualityWeight * 100) / 100,
        metrics: { totalReceivedUnits, totalAcceptedUnits, totalRejectedUnits }
      },
      {
        pillar: 'DELIVERY',
        weight: weights.deliveryWeight,
        rawScore: deliveryScore,
        weightedScore: Math.round(deliveryScore * weights.deliveryWeight * 100) / 100,
        metrics: { totalDeliveries, onTimeDeliveries }
      },
      {
        pillar: 'COMMERCIAL_PRICE',
        weight: weights.priceWeight,
        rawScore: priceScore,
        weightedScore: Math.round(priceScore * weights.priceWeight * 100) / 100,
        metrics: { totalInvoices: vendorInvoices.length, varianceInvoices: invoiceVarianceCount }
      },
      {
        pillar: 'SERVICE_COMPLIANCE',
        weight: weights.serviceWeight,
        rawScore: serviceScore,
        weightedScore: Math.round(serviceScore * weights.serviceWeight * 100) / 100,
        metrics: { complianceAuditPassed: 'YES' }
      }
    ];

    const overallScore = Math.round(
      pillars.reduce((acc, p) => acc + p.weightedScore, 0) * 100
    ) / 100;

    let tier: SupplierTier;
    let recommendedStatus: SupplierStatusRecommendation;

    if (overallScore >= 90) {
      tier = 'TIER_A_STRATEGIC';
      recommendedStatus = 'PREFERRED';
    } else if (overallScore >= 75) {
      tier = 'TIER_B_PREFERRED';
      recommendedStatus = 'APPROVED';
    } else if (overallScore >= 60) {
      tier = 'TIER_C_STANDARD';
      recommendedStatus = 'PROBATION';
    } else {
      tier = 'TIER_D_HIGH_RISK';
      recommendedStatus = 'BLOCKED';
    }

    const timestamp = new Date().toISOString();
    const scorecardId = `SC-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const hashPayload = `${tenantId}|${companyId}|${scorecardId}|${vendor.id}|${overallScore}|${timestamp}`;
    const immutableHash = `SC-HASH-${WorkflowEngine.hashPayload(hashPayload)}`;

    let totalSpend = 0;
    for (const po of vendorPOs) {
      totalSpend += po.grandTotal || 0;
    }

    const scorecard: SupplierScorecard = {
      id: `sc-${Date.now()}`,
      tenantId,
      companyId,
      scorecardId,
      vendorId: vendor.id,
      vendorCode: vendor.code,
      vendorName: vendor.name,
      evaluationPeriod,
      overallScore,
      tier,
      recommendedStatus,
      pillars,
      totalOrdersAnalyzed: vendorPOs.length,
      totalSpendAnalyzed: totalSpend,
      evaluatorNotes: `Automated quantitative evaluation for period ${evaluationPeriod}. Tier: ${tier}.`,
      evaluatedBy,
      evaluatedAt: timestamp,
      immutableHash
    };

    const auditRecord: PurchaseAuditRecord = {
      id: `aud-${Date.now()}`,
      tenantId,
      companyId,
      actionType: 'SUPPLIER_SCORECARD_EVALUATED',
      performedBy: evaluatedBy,
      performedByName: 'Procurement Specialist',
      performedAt: timestamp,
      targetDocumentType: 'SCORECARD',
      targetDocumentId: scorecard.id,
      targetDocumentNumber: scorecard.scorecardId,
      details: `Evaluated supplier scorecard for ${vendor.name}. Overall Score: ${overallScore}/100, Tier: ${tier}`,
      immutableHash: `AUD-HASH-${WorkflowEngine.hashPayload(hashPayload)}`
    };

    return { scorecard, updatedVendorStatus: recommendedStatus, auditRecord };
  }

  // =========================================================================
  // 5. VENDOR PREPAYMENT & AMORTIZATION ENGINE
  // =========================================================================

  /**
   * Records a Vendor Prepayment (Advance Payment) against a Purchase Order
   */
  public static recordVendorPrepayment(
    data: Partial<VendorPrepayment>,
    createdBy: string = 'treasury-officer'
  ): { prepayment: VendorPrepayment; auditRecord: PurchaseAuditRecord } {
    if (!data.tenantId || !data.companyId || !data.vendorId || !data.totalPrepaidAmount || data.totalPrepaidAmount <= 0) {
      throw new Error('PREPAYMENT_INVALID_INPUT: tenantId, companyId, vendorId, and positive totalPrepaidAmount are required.');
    }

    const timestamp = new Date().toISOString();
    const prepaymentNumber = data.prepaymentNumber || `ADV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const hashPayload = `${data.tenantId}|${data.companyId}|${prepaymentNumber}|${data.totalPrepaidAmount}|${timestamp}`;
    const immutableHash = `ADV-HASH-${WorkflowEngine.hashPayload(hashPayload)}`;

    const prepayment: VendorPrepayment = {
      id: data.id || `adv-${Date.now()}`,
      tenantId: data.tenantId,
      companyId: data.companyId,
      branchId: data.branchId,
      prepaymentNumber,
      poId: data.poId || 'po-none',
      poNumber: data.poNumber || 'PO-NONE',
      vendorId: data.vendorId,
      vendorCode: data.vendorCode || 'VEND-001',
      vendorName: data.vendorName || 'Supplier',
      paymentDate: data.paymentDate || timestamp.split('T')[0],
      currency: data.currency || 'USD',
      totalPrepaidAmount: data.totalPrepaidAmount,
      appliedAmount: 0,
      remainingAmount: data.totalPrepaidAmount,
      paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
      bankAccountId: data.bankAccountId,
      reference: data.reference || 'Advance Payment for PO',
      status: 'POSTED',
      createdBy,
      createdAt: timestamp,
      immutableHash
    };

    const auditRecord: PurchaseAuditRecord = {
      id: `aud-${Date.now()}`,
      tenantId: prepayment.tenantId,
      companyId: prepayment.companyId,
      actionType: 'VENDOR_PREPAYMENT_RECORDED',
      performedBy: createdBy,
      performedByName: 'Treasury Officer',
      performedAt: timestamp,
      targetDocumentType: 'PREPAYMENT',
      targetDocumentId: prepayment.id,
      targetDocumentNumber: prepayment.prepaymentNumber,
      details: `Recorded vendor prepayment ${prepaymentNumber} of $${prepayment.totalPrepaidAmount} to ${prepayment.vendorName}`,
      immutableHash: `AUD-HASH-${WorkflowEngine.hashPayload(hashPayload)}`
    };

    return { prepayment, auditRecord };
  }

  /**
   * Applies and amortizes an open prepayment against an open AP voucher
   */
  public static applyPrepaymentToVoucher(
    prepayment: VendorPrepayment,
    voucher: APVoucher,
    applyAmount?: number,
    appliedBy: string = 'ap-accountant'
  ): {
    updatedPrepayment: VendorPrepayment;
    updatedVoucher: APVoucher;
    applicationRecord: PrepaymentApplicationRecord;
    auditRecord: PurchaseAuditRecord;
  } {
    if (prepayment.tenantId !== voucher.tenantId || prepayment.companyId !== voucher.companyId) {
      throw new Error('TENANT_COMPANY_MISMATCH: Prepayment and Voucher belong to different tenant/company boundaries.');
    }

    if (prepayment.vendorId !== voucher.vendorId) {
      throw new Error('VENDOR_MISMATCH: Prepayment and Voucher belong to different suppliers.');
    }

    if (prepayment.remainingAmount <= 0 || prepayment.status === 'FULLY_APPLIED') {
      throw new Error('PREPAYMENT_ALREADY_EXHAUSTED: Prepayment has no remaining balance to apply.');
    }

    if (voucher.remainingAmount <= 0 || voucher.status === 'PAID') {
      throw new Error('VOUCHER_ALREADY_SETTLED: Target voucher has zero open liability balance.');
    }

    // Determine application amount
    const maxApplicable = Math.min(prepayment.remainingAmount, voucher.remainingAmount);
    const amountToApply = applyAmount !== undefined ? Math.min(applyAmount, maxApplicable) : maxApplicable;

    if (amountToApply <= 0) {
      throw new Error('INVALID_APPLICATION_AMOUNT: Applied amount must be greater than zero.');
    }

    const newPrepaymentRemaining = Math.round((prepayment.remainingAmount - amountToApply) * 100) / 100;
    const newPrepaymentApplied = Math.round((prepayment.appliedAmount + amountToApply) * 100) / 100;
    const newPrepaymentStatus = newPrepaymentRemaining === 0 ? ('FULLY_APPLIED' as const) : ('PARTIALLY_APPLIED' as const);

    const updatedPrepayment: VendorPrepayment = {
      ...prepayment,
      remainingAmount: newPrepaymentRemaining,
      appliedAmount: newPrepaymentApplied,
      status: newPrepaymentStatus
    };

    const newVoucherRemaining = Math.round((voucher.remainingAmount - amountToApply) * 100) / 100;
    const newVoucherPaid = Math.round((voucher.paidAmount + amountToApply) * 100) / 100;
    const newVoucherStatus = newVoucherRemaining === 0 ? ('PAID' as const) : ('PARTIALLY_PAID' as const);

    const updatedVoucher: APVoucher = {
      ...voucher,
      remainingAmount: newVoucherRemaining,
      paidAmount: newVoucherPaid,
      status: newVoucherStatus
    };

    const timestamp = new Date().toISOString();
    const applicationRecord: PrepaymentApplicationRecord = {
      id: `appl-${Date.now()}`,
      prepaymentId: prepayment.id,
      prepaymentNumber: prepayment.prepaymentNumber,
      voucherId: voucher.id,
      voucherNumber: voucher.voucherNumber,
      appliedAmount: amountToApply,
      applicationDate: timestamp.split('T')[0],
      appliedBy,
      remainingPrepaymentBalance: newPrepaymentRemaining,
      remainingVoucherBalance: newVoucherRemaining
    };

    const hashPayload = `${prepayment.tenantId}|${prepayment.prepaymentNumber}|${voucher.voucherNumber}|${amountToApply}|${timestamp}`;
    const auditRecord: PurchaseAuditRecord = {
      id: `aud-${Date.now()}`,
      tenantId: prepayment.tenantId,
      companyId: prepayment.companyId,
      actionType: 'VENDOR_PREPAYMENT_APPLIED',
      performedBy: appliedBy,
      performedByName: 'AP Accountant',
      performedAt: timestamp,
      targetDocumentType: 'PREPAYMENT',
      targetDocumentId: prepayment.id,
      targetDocumentNumber: prepayment.prepaymentNumber,
      details: `Amortized $${amountToApply} from advance ${prepayment.prepaymentNumber} against voucher ${voucher.voucherNumber}. Remaining voucher balance: $${newVoucherRemaining}`,
      immutableHash: `AUD-HASH-${WorkflowEngine.hashPayload(hashPayload)}`
    };

    return {
      updatedPrepayment,
      updatedVoucher,
      applicationRecord,
      auditRecord
    };
  }
}
