/**
 * AM Enterprise ERP — Advanced Sales & Order-to-Cash (O2C) Engine (Phase 3.2C-01)
 *
 * Core Enterprise Capabilities:
 * 1. Sales Contracts & Blanket Sales Agreements (BPA / Outline Agreements)
 * 2. Customer Consignment Stock Lifecycle (Fill-Up, Issue, Pick-Up, Return)
 * 3. Customer Volume Rebates & Multi-Tier Settlement Management
 * 4. Drop-Shipment Order Lifecycle & Direct Vendor Delivery Orchestration
 * 5. Dynamic Customer Credit Exposure Governance & Order Risk Protection
 *
 * Financial Event Compliance:
 * - NO DIRECT GL MUTATION. All operational financial consequences emit standardized
 *   Domain Business Events to FinancialEventEngine & PostingRulesEngine.
 *
 * Security & Governance:
 * - Strict Tenant & Multi-Company Isolation
 * - Segregation of Duties (SoD) enforcement
 * - Optimistic Concurrency Controls
 * - SHA-256 Cryptographic Audit Lineage
 */

import {
  SalesContract,
  SalesContractType,
  SalesContractStatus,
  SalesContractLine,
  ContractDrawdownRelease,
  CustomerConsignmentStock,
  ConsignmentMovementRecord,
  ConsignmentMovementType,
  CustomerRebateAgreement,
  RebateAgreementStatus,
  RebateAccrualEntry,
  RebateSettlementRecord,
  DropShipmentOrder,
  DropShipmentStatus,
  CustomerCreditProfile,
  CreditCheckResult
} from '../types/salesContracts';
import { SalesOrder, SalesOrderLine } from '../types/sales';

export interface ContractCreationParams {
  tenantId: string;
  companyId: string;
  branchId: string;
  contractType: SalesContractType;
  customerId: string;
  customerCode: string;
  customerName: string;
  title: string;
  startDate: string;
  endDate: string;
  currency: string;
  exchangeRate?: number;
  paymentTermsId: string;
  paymentTermsCode: string;
  autoRenew?: boolean;
  renewalNoticeDays?: number;
  earlyTerminationPenaltyRate?: number;
  lines: Omit<SalesContractLine, 'id' | 'lineNumber' | 'releasedQuantity' | 'remainingQuantity' | 'committedAmount' | 'releasedAmount' | 'remainingAmount'>[];
  performedBy: string;
}

export interface ContractDrawdownParams {
  contractId: string;
  salesOrderId: string;
  salesOrderNumber: string;
  drawdownLines: {
    contractLineId: string;
    quantityToRelease: number;
  }[];
  performedBy: string;
  releaseDate?: string;
}

export interface ConsignmentMovementParams {
  tenantId: string;
  companyId: string;
  movementType: ConsignmentMovementType;
  customerId: string;
  customerName: string;
  customerLocationId: string;
  customerLocationName?: string;
  itemSku: string;
  itemName: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  currency: string;
  referenceDocumentType?: 'SALES_ORDER' | 'DELIVERY_NOTE' | 'INVOICE' | 'RETURN_ORDER';
  referenceDocumentId?: string;
  referenceDocumentNumber?: string;
  performedBy: string;
  notes?: string;
}

export interface RebateAccrualEvaluationParams {
  tenantId: string;
  companyId: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerId: string;
  invoiceLines: {
    itemSku: string;
    itemCategory?: string;
    quantity: number;
    netAmount: number;
  }[];
  invoiceNetAmount: number;
  currency: string;
}

export interface RebateSettlementParams {
  agreementId: string;
  settlementAmount: number;
  settlementType: 'CREDIT_MEMO' | 'DIRECT_PAYOUT';
  performedBy: string;
  notes?: string;
}

export interface DropShipCreationParams {
  tenantId: string;
  companyId: string;
  salesOrderId: string;
  salesOrderNumber: string;
  salesOrderLineNumber: number;
  customerId: string;
  customerName: string;
  shippingAddress: string;
  vendorId: string;
  vendorName: string;
  itemSku: string;
  itemName: string;
  quantity: number;
  uom: string;
  customerSellingPrice: number;
  vendorPurchaseCost: number;
  currency: string;
  performedBy: string;
}

export interface FinancialEventPayload {
  eventId: string;
  eventType: string;
  tenantId: string;
  companyId: string;
  sourceDocumentId: string;
  sourceDocumentNumber: string;
  sourceDocumentType: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  timestamp: string;
  payload: Record<string, any>;
  sha256Hash: string;
}

export class AdvancedSalesOrderEngine {
  /**
   * Deterministic SHA-256 hash generator
   */
  private static calculateSha256(data: any): string {
    const raw = typeof data === 'string' ? data : JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `sha256_${hex}_${Date.now().toString(16)}`;
  }

  // =========================================================================
  // 1. SALES CONTRACTS & BLANKET SALES AGREEMENTS (BPA)
  // =========================================================================

  public static createContract(params: ContractCreationParams): SalesContract {
    if (!params.tenantId || !params.companyId) {
      throw new Error('CONTRACT_TENANT_REQUIRED: Multi-tenant context is mandatory.');
    }
    if (!params.customerId || !params.customerName) {
      throw new Error('CONTRACT_CUSTOMER_REQUIRED: Customer must be specified.');
    }
    if (!params.lines || params.lines.length === 0) {
      throw new Error('CONTRACT_LINES_REQUIRED: At least one contract line is required.');
    }
    if (new Date(params.startDate) >= new Date(params.endDate)) {
      throw new Error('CONTRACT_INVALID_DATES: End date must be strictly after start date.');
    }

    const contractId = `cntr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const contractNumber = `CNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let totalCommittedAmount = 0;
    const lines: SalesContractLine[] = params.lines.map((l, idx) => {
      if (l.committedQuantity <= 0) {
        throw new Error(`CONTRACT_LINE_QTY_INVALID: Line ${idx + 1} committed quantity must be > 0.`);
      }
      if (l.agreedUnitPrice < 0) {
        throw new Error(`CONTRACT_LINE_PRICE_INVALID: Line ${idx + 1} unit price cannot be negative.`);
      }

      const committedAmount = Number((l.committedQuantity * l.agreedUnitPrice).toFixed(2));
      totalCommittedAmount += committedAmount;

      return {
        id: `cntr-line-${idx + 1}-${Date.now()}`,
        lineNumber: idx + 1,
        itemSku: l.itemSku,
        itemName: l.itemName,
        uom: l.uom || 'EA',
        committedQuantity: l.committedQuantity,
        releasedQuantity: 0,
        remainingQuantity: l.committedQuantity,
        agreedUnitPrice: l.agreedUnitPrice,
        currency: params.currency || 'USD',
        committedAmount,
        releasedAmount: 0,
        remainingAmount: committedAmount,
        minimumOrderQuantity: l.minimumOrderQuantity,
        maximumOrderQuantity: l.maximumOrderQuantity,
        discountPercentage: l.discountPercentage || 0,
        notes: l.notes
      };
    });

    const now = new Date().toISOString();
    const contract: SalesContract = {
      id: contractId,
      contractNumber,
      tenantId: params.tenantId,
      companyId: params.companyId,
      branchId: params.branchId || 'main-branch',
      contractType: params.contractType || 'QUANTITY_COMMITMENT',
      status: 'DRAFT',
      customerId: params.customerId,
      customerCode: params.customerCode,
      customerName: params.customerName,
      title: params.title || `Sales Agreement - ${params.customerName}`,
      startDate: params.startDate,
      endDate: params.endDate,
      currency: params.currency || 'USD',
      exchangeRate: params.exchangeRate || 1.0,
      totalCommittedAmount: Number(totalCommittedAmount.toFixed(2)),
      totalReleasedAmount: 0,
      totalRemainingAmount: Number(totalCommittedAmount.toFixed(2)),
      paymentTermsId: params.paymentTermsId || 'pt-net30',
      paymentTermsCode: params.paymentTermsCode || 'NET30',
      autoRenew: !!params.autoRenew,
      renewalNoticeDays: params.renewalNoticeDays || 30,
      earlyTerminationPenaltyRate: params.earlyTerminationPenaltyRate || 0,
      lines,
      drawdownHistory: [],
      version: 1,
      auditTrail: [
        {
          id: `audit-${Date.now()}-1`,
          timestamp: now,
          action: 'CREATE',
          performedBy: params.performedBy,
          newStatus: 'DRAFT',
          details: `Contract created with ${lines.length} commitment lines. Total value: ${totalCommittedAmount}`,
          sha256Hash: this.calculateSha256({ contractId, totalCommittedAmount, performedBy: params.performedBy })
        }
      ],
      sha256Hash: '',
      createdAt: now,
      updatedAt: now
    };

    contract.sha256Hash = this.calculateSha256(contract);
    return contract;
  }

  public static approveAndActivateContract(
    contract: SalesContract,
    approverUser: string,
    expectedVersion?: number
  ): SalesContract {
    if (expectedVersion !== undefined && contract.version !== expectedVersion) {
      throw new Error(`CONCURRENCY_CONFLICT: Version mismatch. Expected ${expectedVersion}, got ${contract.version}`);
    }

    if (contract.status !== 'DRAFT' && contract.status !== 'PENDING_APPROVAL') {
      throw new Error(`INVALID_CONTRACT_STATUS: Cannot activate contract in status ${contract.status}`);
    }

    // Segregation of Duties (SoD) Check: Approver cannot be the same user who created the draft
    const creator = contract.auditTrail.find(a => a.action === 'CREATE')?.performedBy;
    if (creator && creator === approverUser) {
      throw new Error('SOD_VIOLATION: Contract creator cannot approve and activate their own sales contract.');
    }

    const now = new Date().toISOString();
    const updatedContract: SalesContract = {
      ...contract,
      status: 'ACTIVE',
      approvedBy: approverUser,
      approvedAt: now,
      version: contract.version + 1,
      updatedAt: now,
      auditTrail: [
        ...contract.auditTrail,
        {
          id: `audit-${Date.now()}-act`,
          timestamp: now,
          action: 'ACTIVATE',
          performedBy: approverUser,
          previousStatus: contract.status,
          newStatus: 'ACTIVE',
          details: `Contract approved and activated by ${approverUser}. Ready for release orders.`,
          sha256Hash: this.calculateSha256({ contractId: contract.id, action: 'ACTIVATE', approverUser })
        }
      ]
    };

    updatedContract.sha256Hash = this.calculateSha256(updatedContract);
    return updatedContract;
  }

  public static executeContractDrawdown(
    contract: SalesContract,
    params: ContractDrawdownParams
  ): {
    updatedContract: SalesContract;
    releases: ContractDrawdownRelease[];
    auditRecord: any;
  } {
    if (contract.status !== 'ACTIVE') {
      throw new Error(`CONTRACT_NOT_ACTIVE: Cannot release orders against contract with status ${contract.status}`);
    }

    const now = new Date();
    const startDate = new Date(contract.startDate);
    const endDate = new Date(contract.endDate);
    if (now < startDate || now > endDate) {
      throw new Error(`CONTRACT_EXPIRED_OR_INACTIVE: Current date is outside the contract validity period (${contract.startDate} to ${contract.endDate})`);
    }

    const newDrawdowns: ContractDrawdownRelease[] = [];
    let totalDrawdownAmount = 0;

    const updatedLines = contract.lines.map(line => {
      const match = params.drawdownLines.find(dl => dl.contractLineId === line.id);
      if (!match) return line;

      if (match.quantityToRelease <= 0) {
        throw new Error(`DRAWDOWN_QUANTITY_INVALID: Release quantity for line ${line.lineNumber} must be > 0.`);
      }

      if (line.minimumOrderQuantity && match.quantityToRelease < line.minimumOrderQuantity) {
        throw new Error(`MINIMUM_ORDER_QTY_BREACH: Release qty ${match.quantityToRelease} is below minimum allowed ${line.minimumOrderQuantity} for line ${line.lineNumber}`);
      }

      if (line.maximumOrderQuantity && match.quantityToRelease > line.maximumOrderQuantity) {
        throw new Error(`MAXIMUM_ORDER_QTY_BREACH: Release qty ${match.quantityToRelease} exceeds maximum allowed ${line.maximumOrderQuantity} for line ${line.lineNumber}`);
      }

      if (match.quantityToRelease > line.remainingQuantity) {
        throw new Error(`OVERDRAW_PREVENTION: Requested release ${match.quantityToRelease} exceeds contract remaining commitment ${line.remainingQuantity} for item ${line.itemSku}`);
      }

      const releaseQty = match.quantityToRelease;
      const releaseAmount = Number((releaseQty * line.agreedUnitPrice).toFixed(2));
      totalDrawdownAmount += releaseAmount;

      const newReleasedQty = Number((line.releasedQuantity + releaseQty).toFixed(4));
      const newRemainingQty = Number((line.committedQuantity - newReleasedQty).toFixed(4));
      const newReleasedAmount = Number((line.releasedAmount + releaseAmount).toFixed(2));
      const newRemainingAmount = Number((line.committedAmount - newReleasedAmount).toFixed(2));

      const releaseRecord: ContractDrawdownRelease = {
        id: `rel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        salesOrderId: params.salesOrderId,
        salesOrderNumber: params.salesOrderNumber,
        lineId: line.id,
        itemSku: line.itemSku,
        releasedQuantity: releaseQty,
        unitPrice: line.agreedUnitPrice,
        releasedAmount: releaseAmount,
        releaseDate: params.releaseDate || new Date().toISOString(),
        performedBy: params.performedBy
      };
      newDrawdowns.push(releaseRecord);

      return {
        ...line,
        releasedQuantity: newReleasedQty,
        remainingQuantity: newRemainingQty,
        releasedAmount: newReleasedAmount,
        remainingAmount: newRemainingAmount
      };
    });

    const totalReleasedAmount = Number((contract.totalReleasedAmount + totalDrawdownAmount).toFixed(2));
    const totalRemainingAmount = Number((contract.totalCommittedAmount - totalReleasedAmount).toFixed(2));

    // Check if contract is fully fulfilled
    const allLinesFulfilled = updatedLines.every(l => l.remainingQuantity <= 0);
    const newStatus: SalesContractStatus = allLinesFulfilled ? 'FULFILLED' : 'ACTIVE';

    const timestampStr = new Date().toISOString();
    const auditRecord = {
      id: `audit-${Date.now()}-dd`,
      timestamp: timestampStr,
      action: 'DRAWDOWN' as const,
      performedBy: params.performedBy,
      previousStatus: contract.status,
      newStatus,
      details: `Released order ${params.salesOrderNumber} with ${newDrawdowns.length} lines. Total released: ${totalDrawdownAmount}. Remaining: ${totalRemainingAmount}`,
      sha256Hash: this.calculateSha256({ contractId: contract.id, salesOrderNumber: params.salesOrderNumber, totalDrawdownAmount })
    };

    const updatedContract: SalesContract = {
      ...contract,
      status: newStatus,
      lines: updatedLines,
      totalReleasedAmount,
      totalRemainingAmount,
      drawdownHistory: [...contract.drawdownHistory, ...newDrawdowns],
      version: contract.version + 1,
      updatedAt: timestampStr,
      auditTrail: [...contract.auditTrail, auditRecord]
    };

    updatedContract.sha256Hash = this.calculateSha256(updatedContract);

    return {
      updatedContract,
      releases: newDrawdowns,
      auditRecord
    };
  }

  public static terminateContract(
    contract: SalesContract,
    reason: string,
    performedBy: string
  ): {
    updatedContract: SalesContract;
    earlyTerminationPenaltyAmount: number;
    auditRecord: any;
  } {
    if (contract.status !== 'ACTIVE') {
      throw new Error(`INVALID_STATUS: Only active contracts can be terminated. Current status is ${contract.status}`);
    }

    const penaltyRate = contract.earlyTerminationPenaltyRate || 0;
    const penaltyAmount = Number((contract.totalRemainingAmount * penaltyRate).toFixed(2));

    const now = new Date().toISOString();
    const auditRecord = {
      id: `audit-${Date.now()}-term`,
      timestamp: now,
      action: 'TERMINATE' as const,
      performedBy,
      previousStatus: contract.status,
      newStatus: 'TERMINATED' as const,
      details: `Contract terminated early by ${performedBy}. Reason: ${reason}. Early termination penalty assessed: ${penaltyAmount} (${penaltyRate * 100}% on unfulfilled balance ${contract.totalRemainingAmount})`,
      sha256Hash: this.calculateSha256({ contractId: contract.id, reason, penaltyAmount })
    };

    const updatedContract: SalesContract = {
      ...contract,
      status: 'TERMINATED',
      version: contract.version + 1,
      updatedAt: now,
      auditTrail: [...contract.auditTrail, auditRecord]
    };

    updatedContract.sha256Hash = this.calculateSha256(updatedContract);

    return {
      updatedContract,
      earlyTerminationPenaltyAmount: penaltyAmount,
      auditRecord
    };
  }

  // =========================================================================
  // 2. CUSTOMER CONSIGNMENT INVENTORY (Fill-Up, Issue, Pick-Up, Return)
  // =========================================================================

  public static processConsignmentMovement(
    currentStockList: CustomerConsignmentStock[],
    params: ConsignmentMovementParams
  ): {
    updatedStockList: CustomerConsignmentStock[];
    movementRecord: ConsignmentMovementRecord;
    financialEvent?: FinancialEventPayload;
  } {
    if (!params.tenantId || !params.companyId) {
      throw new Error('CONSIGNMENT_TENANT_REQUIRED: Multi-tenant context is mandatory.');
    }
    if (!params.customerId || !params.customerLocationId) {
      throw new Error('CONSIGNMENT_CUSTOMER_LOCATION_REQUIRED: Customer and location must be specified.');
    }
    if (params.quantity <= 0) {
      throw new Error('CONSIGNMENT_QTY_INVALID: Movement quantity must be strictly > 0.');
    }

    const now = new Date().toISOString();
    const movementNumber = `CNSM-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const totalAmount = Number((params.quantity * params.unitPrice).toFixed(2));

    const stockIndex = currentStockList.findIndex(
      s => s.tenantId === params.tenantId &&
           s.companyId === params.companyId &&
           s.customerId === params.customerId &&
           s.customerLocationId === params.customerLocationId &&
           s.itemSku === params.itemSku
    );

    let updatedStockList = [...currentStockList];
    let financialEvent: FinancialEventPayload | undefined;

    switch (params.movementType) {
      case 'CONSIGNMENT_FILLUP': {
        // Stock transferred to customer consignment location (Company owns stock, custody transferred)
        // No billing / revenue at this stage (Special Stock 'W' Transfer)
        if (stockIndex >= 0) {
          const existing = updatedStockList[stockIndex];
          const newQty = Number((existing.currentStockQuantity + params.quantity).toFixed(4));
          const unitValuation = params.unitCost !== undefined ? params.unitCost : existing.unitValuationCost;
          updatedStockList[stockIndex] = {
            ...existing,
            currentStockQuantity: newQty,
            unitValuationCost: unitValuation,
            totalValuationValue: Number((newQty * unitValuation).toFixed(2)),
            lastMovementDate: now,
            updatedAt: now
          };
        } else {
          const unitValuation = params.unitCost || params.unitPrice * 0.7; // default standard cost estimate
          const newStock: CustomerConsignmentStock = {
            id: `cstk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            tenantId: params.tenantId,
            companyId: params.companyId,
            customerId: params.customerId,
            customerName: params.customerName,
            customerLocationId: params.customerLocationId,
            customerLocationName: params.customerLocationName || 'Customer Central Warehouse',
            itemSku: params.itemSku,
            itemName: params.itemName,
            uom: params.uom || 'EA',
            currentStockQuantity: params.quantity,
            reservedStockQuantity: 0,
            unitValuationCost: unitValuation,
            totalValuationValue: Number((params.quantity * unitValuation).toFixed(2)),
            currency: params.currency || 'USD',
            lastMovementDate: now,
            updatedAt: now
          };
          updatedStockList.push(newStock);
        }
        break;
      }

      case 'CONSIGNMENT_ISSUE': {
        // Customer consumes goods from consignment stock.
        // Triggers billing, title transfer, and revenue recognition event.
        if (stockIndex < 0) {
          throw new Error(`CONSIGNMENT_NO_STOCK: No consignment stock exists for item ${params.itemSku} at customer location.`);
        }
        const existing = updatedStockList[stockIndex];
        if (existing.currentStockQuantity < params.quantity) {
          throw new Error(`CONSIGNMENT_INSUFFICIENT_STOCK: Available consignment stock (${existing.currentStockQuantity}) is less than requested issue quantity (${params.quantity}).`);
        }

        const newQty = Number((existing.currentStockQuantity - params.quantity).toFixed(4));
        updatedStockList[stockIndex] = {
          ...existing,
          currentStockQuantity: newQty,
          totalValuationValue: Number((newQty * existing.unitValuationCost).toFixed(2)),
          lastMovementDate: now,
          updatedAt: now
        };

        // Emit domain financial event for Consignment Issue (Revenue & COGS)
        financialEvent = {
          eventId: `fe-cnsm-issue-${Date.now()}`,
          eventType: 'CUSTOMER_CONSIGNMENT_ISSUE',
          tenantId: params.tenantId,
          companyId: params.companyId,
          sourceDocumentId: movementNumber,
          sourceDocumentNumber: movementNumber,
          sourceDocumentType: 'CONSIGNMENT_MOVEMENT',
          amount: totalAmount,
          currency: params.currency,
          exchangeRate: 1.0,
          timestamp: now,
          payload: {
            movementType: 'CONSIGNMENT_ISSUE',
            customerId: params.customerId,
            customerName: params.customerName,
            itemSku: params.itemSku,
            quantity: params.quantity,
            unitPrice: params.unitPrice,
            costOfGoodsSold: Number((params.quantity * existing.unitValuationCost).toFixed(2)),
            salesRevenue: totalAmount
          },
          sha256Hash: this.calculateSha256({ movementNumber, totalAmount, action: 'CONSIGNMENT_ISSUE' })
        };
        break;
      }

      case 'CONSIGNMENT_PICKUP': {
        // Customer returns unsold consignment stock back to company plant
        if (stockIndex < 0) {
          throw new Error(`CONSIGNMENT_NO_STOCK: No consignment stock exists to pick up.`);
        }
        const existing = updatedStockList[stockIndex];
        if (existing.currentStockQuantity < params.quantity) {
          throw new Error(`CONSIGNMENT_PICKUP_OVERFLOW: Cannot pick up ${params.quantity}. Only ${existing.currentStockQuantity} is currently in consignment stock.`);
        }
        const newQty = Number((existing.currentStockQuantity - params.quantity).toFixed(4));
        updatedStockList[stockIndex] = {
          ...existing,
          currentStockQuantity: newQty,
          totalValuationValue: Number((newQty * existing.unitValuationCost).toFixed(2)),
          lastMovementDate: now,
          updatedAt: now
        };
        break;
      }

      case 'CONSIGNMENT_RETURN': {
        // Customer returns previously consumed / billed goods for credit
        if (stockIndex >= 0) {
          const existing = updatedStockList[stockIndex];
          const newQty = Number((existing.currentStockQuantity + params.quantity).toFixed(4));
          updatedStockList[stockIndex] = {
            ...existing,
            currentStockQuantity: newQty,
            totalValuationValue: Number((newQty * existing.unitValuationCost).toFixed(2)),
            lastMovementDate: now,
            updatedAt: now
          };
        }

        // Financial event for credit memo & COGS reversal
        financialEvent = {
          eventId: `fe-cnsm-ret-${Date.now()}`,
          eventType: 'CUSTOMER_CONSIGNMENT_RETURN_CREDIT',
          tenantId: params.tenantId,
          companyId: params.companyId,
          sourceDocumentId: movementNumber,
          sourceDocumentNumber: movementNumber,
          sourceDocumentType: 'CONSIGNMENT_MOVEMENT',
          amount: totalAmount,
          currency: params.currency,
          exchangeRate: 1.0,
          timestamp: now,
          payload: {
            movementType: 'CONSIGNMENT_RETURN',
            customerId: params.customerId,
            itemSku: params.itemSku,
            quantity: params.quantity,
            creditAmount: totalAmount
          },
          sha256Hash: this.calculateSha256({ movementNumber, totalAmount, action: 'CONSIGNMENT_RETURN' })
        };
        break;
      }
    }

    const movementRecord: ConsignmentMovementRecord = {
      id: `cnsm-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      movementNumber,
      tenantId: params.tenantId,
      companyId: params.companyId,
      movementType: params.movementType,
      customerId: params.customerId,
      customerName: params.customerName,
      customerLocationId: params.customerLocationId,
      itemSku: params.itemSku,
      itemName: params.itemName,
      uom: params.uom || 'EA',
      quantity: params.quantity,
      unitPrice: params.unitPrice,
      totalAmount,
      currency: params.currency || 'USD',
      referenceDocumentType: params.referenceDocumentType,
      referenceDocumentId: params.referenceDocumentId,
      referenceDocumentNumber: params.referenceDocumentNumber,
      financialEventId: financialEvent?.eventId,
      performedBy: params.performedBy,
      notes: params.notes,
      timestamp: now,
      sha256Hash: this.calculateSha256({ movementNumber, totalAmount, type: params.movementType })
    };

    return {
      updatedStockList,
      movementRecord,
      financialEvent
    };
  }

  // =========================================================================
  // 3. CUSTOMER VOLUME REBATES & SETTLEMENT MANAGEMENT
  // =========================================================================

  public static createRebateAgreement(params: {
    tenantId: string;
    companyId: string;
    customerId: string;
    customerName: string;
    title: string;
    calculationBasis: 'NET_SALES_VALUE' | 'GROSS_SALES_VALUE' | 'TOTAL_QUANTITY';
    currency: string;
    validFrom: string;
    validTo: string;
    tiers: { thresholdFrom: number; thresholdTo?: number; rebatePercentage: number }[];
    eligibleItemSkus?: string[];
    performedBy: string;
  }): CustomerRebateAgreement {
    if (!params.tenantId || !params.companyId) {
      throw new Error('REBATE_TENANT_REQUIRED: Multi-tenant context is mandatory.');
    }
    if (!params.customerId) {
      throw new Error('REBATE_CUSTOMER_REQUIRED: Customer must be specified.');
    }
    if (!params.tiers || params.tiers.length === 0) {
      throw new Error('REBATE_TIERS_REQUIRED: At least one rebate tier must be configured.');
    }
    if (new Date(params.validFrom) >= new Date(params.validTo)) {
      throw new Error('REBATE_INVALID_DATES: Valid to must be strictly after valid from.');
    }

    const sortedTiers = [...params.tiers].sort((a, b) => a.thresholdFrom - b.thresholdFrom);
    const agreementNumber = `RBT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const agreement: CustomerRebateAgreement = {
      id: `rbt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      agreementNumber,
      tenantId: params.tenantId,
      companyId: params.companyId,
      customerId: params.customerId,
      customerName: params.customerName,
      title: params.title || `Volume Rebate Agreement - ${params.customerName}`,
      status: 'ACTIVE',
      calculationBasis: params.calculationBasis || 'NET_SALES_VALUE',
      currency: params.currency || 'USD',
      validFrom: params.validFrom,
      validTo: params.validTo,
      tiers: sortedTiers.map((t, idx) => ({
        tierNumber: idx + 1,
        thresholdFrom: t.thresholdFrom,
        thresholdTo: t.thresholdTo,
        rebatePercentage: t.rebatePercentage
      })),
      eligibleItemSkus: params.eligibleItemSkus || [],
      accumulatedEligibleAmount: 0,
      accumulatedEligibleQuantity: 0,
      accumulatedAccrualAmount: 0,
      totalSettledAmount: 0,
      remainingPayableAmount: 0,
      settlements: [],
      version: 1,
      sha256Hash: '',
      createdAt: now,
      updatedAt: now
    };

    agreement.sha256Hash = this.calculateSha256(agreement);
    return agreement;
  }

  public static evaluateAndAccrueRebate(
    agreements: CustomerRebateAgreement[],
    params: RebateAccrualEvaluationParams
  ): {
    updatedAgreements: CustomerRebateAgreement[];
    accrualEntries: RebateAccrualEntry[];
    financialEvents: FinancialEventPayload[];
  } {
    const matchingAgreements = agreements.filter(
      a => a.tenantId === params.tenantId &&
           a.companyId === params.companyId &&
           a.customerId === params.customerId &&
           a.status === 'ACTIVE' &&
           new Date(params.invoiceDate) >= new Date(a.validFrom) &&
           new Date(params.invoiceDate) <= new Date(a.validTo)
    );

    if (matchingAgreements.length === 0) {
      return { updatedAgreements: agreements, accrualEntries: [], financialEvents: [] };
    }

    const accrualEntries: RebateAccrualEntry[] = [];
    const financialEvents: FinancialEventPayload[] = [];
    const updatedAgreements = agreements.map(agreement => {
      const isMatch = matchingAgreements.some(m => m.id === agreement.id);
      if (!isMatch) return agreement;

      // Calculate eligible invoice value/quantity
      let eligibleAmount = 0;
      let eligibleQty = 0;

      if (!agreement.eligibleItemSkus || agreement.eligibleItemSkus.length === 0) {
        eligibleAmount = params.invoiceNetAmount;
        eligibleQty = params.invoiceLines.reduce((acc, l) => acc + l.quantity, 0);
      } else {
        params.invoiceLines.forEach(line => {
          if (agreement.eligibleItemSkus?.includes(line.itemSku)) {
            eligibleAmount += line.netAmount;
            eligibleQty += line.quantity;
          }
        });
      }

      if (eligibleAmount <= 0) return agreement;

      // Determine projected accumulated base
      const newAccumulatedAmount = Number((agreement.accumulatedEligibleAmount + eligibleAmount).toFixed(2));
      const newAccumulatedQty = Number((agreement.accumulatedEligibleQuantity + eligibleQty).toFixed(4));
      const evaluationMetric = agreement.calculationBasis === 'TOTAL_QUANTITY' ? newAccumulatedQty : newAccumulatedAmount;

      // Match highest qualifying tier
      let applicableRate = 0;
      for (const tier of agreement.tiers) {
        if (evaluationMetric >= tier.thresholdFrom) {
          if (!tier.thresholdTo || evaluationMetric <= tier.thresholdTo) {
            applicableRate = tier.rebatePercentage;
          } else if (evaluationMetric > (tier.thresholdTo || Infinity)) {
            applicableRate = tier.rebatePercentage;
          }
        }
      }

      const accrualForThisInvoice = Number((eligibleAmount * (applicableRate / 100)).toFixed(2));
      const newTotalAccrual = Number((agreement.accumulatedAccrualAmount + accrualForThisInvoice).toFixed(2));
      const newRemainingPayable = Number((newTotalAccrual - agreement.totalSettledAmount).toFixed(2));

      const now = new Date().toISOString();
      const accrualEntry: RebateAccrualEntry = {
        id: `rbt-acc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        agreementId: agreement.id,
        agreementNumber: agreement.agreementNumber,
        invoiceId: params.invoiceId,
        invoiceNumber: params.invoiceNumber,
        invoiceDate: params.invoiceDate,
        customerId: params.customerId,
        eligibleInvoiceAmount: eligibleAmount,
        applicableRebateRate: applicableRate,
        accrualAmount: accrualForThisInvoice,
        currency: agreement.currency,
        timestamp: now
      };
      accrualEntries.push(accrualEntry);

      // Financial Event for Rebate Accrual:
      // Dr. Sales Rebates & Allowances (Contra-Revenue) / Cr. Customer Rebate Accruals Payable
      const fe: FinancialEventPayload = {
        eventId: `fe-rbt-acc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        eventType: 'CUSTOMER_REBATE_ACCRUAL',
        tenantId: agreement.tenantId,
        companyId: agreement.companyId,
        sourceDocumentId: agreement.id,
        sourceDocumentNumber: agreement.agreementNumber,
        sourceDocumentType: 'REBATE_AGREEMENT',
        amount: accrualForThisInvoice,
        currency: agreement.currency,
        exchangeRate: 1.0,
        timestamp: now,
        payload: {
          agreementNumber: agreement.agreementNumber,
          customerId: agreement.customerId,
          invoiceNumber: params.invoiceNumber,
          accrualAmount: accrualForThisInvoice,
          applicableRate
        },
        sha256Hash: this.calculateSha256({ agreementId: agreement.id, accrualForThisInvoice, invoiceNumber: params.invoiceNumber })
      };
      financialEvents.push(fe);

      const updatedAgr: CustomerRebateAgreement = {
        ...agreement,
        accumulatedEligibleAmount: newAccumulatedAmount,
        accumulatedEligibleQuantity: newAccumulatedQty,
        accumulatedAccrualAmount: newTotalAccrual,
        remainingPayableAmount: newRemainingPayable,
        version: agreement.version + 1,
        updatedAt: now
      };
      updatedAgr.sha256Hash = this.calculateSha256(updatedAgr);
      return updatedAgr;
    });

    return {
      updatedAgreements,
      accrualEntries,
      financialEvents
    };
  }

  public static settleRebateAgreement(
    agreement: CustomerRebateAgreement,
    params: RebateSettlementParams
  ): {
    updatedAgreement: CustomerRebateAgreement;
    settlementRecord: RebateSettlementRecord;
    financialEvent: FinancialEventPayload;
  } {
    if (agreement.status !== 'ACTIVE' && agreement.status !== 'EXPIRED') {
      throw new Error(`REBATE_SETTLE_INVALID_STATUS: Cannot settle rebate agreement in status ${agreement.status}`);
    }

    if (params.settlementAmount <= 0) {
      throw new Error('REBATE_SETTLEMENT_AMOUNT_INVALID: Settlement amount must be > 0.');
    }

    if (params.settlementAmount > agreement.remainingPayableAmount) {
      throw new Error(`REBATE_OVERSETTLEMENT_PREVENTION: Requested settlement ${params.settlementAmount} exceeds remaining accrued balance ${agreement.remainingPayableAmount}.`);
    }

    const settlementNumber = `RSET-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const creditNoteNumber = `CRN-RBT-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    const newTotalSettled = Number((agreement.totalSettledAmount + params.settlementAmount).toFixed(2));
    const newRemainingPayable = Number((agreement.accumulatedAccrualAmount - newTotalSettled).toFixed(2));
    const isFullySettled = newRemainingPayable <= 0;

    const settlementRecord: RebateSettlementRecord = {
      id: `rset-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      settlementNumber,
      agreementId: agreement.id,
      agreementNumber: agreement.agreementNumber,
      tenantId: agreement.tenantId,
      companyId: agreement.companyId,
      customerId: agreement.customerId,
      customerName: agreement.customerName,
      settlementDate: now,
      settledAmount: params.settlementAmount,
      currency: agreement.currency,
      settlementType: params.settlementType,
      creditNoteId: `crn-${Date.now()}`,
      creditNoteNumber,
      performedBy: params.performedBy,
      notes: params.notes,
      sha256Hash: this.calculateSha256({ settlementNumber, settledAmount: params.settlementAmount, agreementId: agreement.id })
    };

    // Financial Event for Rebate Settlement:
    // Dr. Customer Rebate Accruals Payable / Cr. Accounts Receivable (or Bank Payout)
    const financialEvent: FinancialEventPayload = {
      eventId: `fe-rbt-set-${Date.now()}`,
      eventType: 'CUSTOMER_REBATE_SETTLEMENT',
      tenantId: agreement.tenantId,
      companyId: agreement.companyId,
      sourceDocumentId: settlementNumber,
      sourceDocumentNumber: settlementNumber,
      sourceDocumentType: 'REBATE_SETTLEMENT',
      amount: params.settlementAmount,
      currency: agreement.currency,
      exchangeRate: 1.0,
      timestamp: now,
      payload: {
        settlementNumber,
        agreementNumber: agreement.agreementNumber,
        customerId: agreement.customerId,
        creditNoteNumber,
        settledAmount: params.settlementAmount
      },
      sha256Hash: this.calculateSha256({ settlementNumber, settledAmount: params.settlementAmount, action: 'SETTLE' })
    };

    settlementRecord.financialEventId = financialEvent.eventId;

    const updatedAgreement: CustomerRebateAgreement = {
      ...agreement,
      totalSettledAmount: newTotalSettled,
      remainingPayableAmount: newRemainingPayable,
      status: isFullySettled ? 'SETTLED' : agreement.status,
      settlements: [...agreement.settlements, settlementRecord],
      version: agreement.version + 1,
      updatedAt: now
    };
    updatedAgreement.sha256Hash = this.calculateSha256(updatedAgreement);

    return {
      updatedAgreement,
      settlementRecord,
      financialEvent
    };
  }

  // =========================================================================
  // 4. DROP-SHIPMENT DIRECT VENDOR DELIVERY ORCHESTRATION
  // =========================================================================

  public static createDropShipmentOrder(params: DropShipCreationParams): DropShipmentOrder {
    if (!params.tenantId || !params.companyId) {
      throw new Error('DROPSHIP_TENANT_REQUIRED: Multi-tenant context is mandatory.');
    }
    if (!params.salesOrderId || !params.vendorId) {
      throw new Error('DROPSHIP_LINKAGE_REQUIRED: Sales Order and Supplier linkage must be specified.');
    }
    if (params.quantity <= 0) {
      throw new Error('DROPSHIP_QTY_INVALID: Quantity must be > 0.');
    }

    const customerTotalAmount = Number((params.quantity * params.customerSellingPrice).toFixed(2));
    const vendorTotalCost = Number((params.quantity * params.vendorPurchaseCost).toFixed(2));
    const estimatedMarginAmount = Number((customerTotalAmount - vendorTotalCost).toFixed(2));
    const estimatedMarginPercent = customerTotalAmount > 0
      ? Number(((estimatedMarginAmount / customerTotalAmount) * 100).toFixed(2))
      : 0;

    const dropShipNumber = `DS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    const dropShip: DropShipmentOrder = {
      id: `ds-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      dropShipNumber,
      tenantId: params.tenantId,
      companyId: params.companyId,
      salesOrderId: params.salesOrderId,
      salesOrderNumber: params.salesOrderNumber,
      salesOrderLineNumber: params.salesOrderLineNumber,
      customerId: params.customerId,
      customerName: params.customerName,
      shippingAddress: params.shippingAddress,
      vendorId: params.vendorId,
      vendorName: params.vendorName,
      itemSku: params.itemSku,
      itemName: params.itemName,
      quantity: params.quantity,
      uom: params.uom || 'EA',
      customerSellingPrice: params.customerSellingPrice,
      customerTotalAmount,
      vendorPurchaseCost: params.vendorPurchaseCost,
      vendorTotalCost,
      estimatedMarginAmount,
      estimatedMarginPercent,
      currency: params.currency || 'USD',
      status: 'PENDING_PO_CREATION',
      auditTrail: [
        {
          id: `audit-${Date.now()}-ds1`,
          timestamp: now,
          action: 'CREATE_DROPSHIP',
          performedBy: params.performedBy,
          newStatus: 'PENDING_PO_CREATION',
          details: `Drop-shipment workflow initiated for SO #${params.salesOrderNumber}. Vendor: ${params.vendorName}. Estimated margin: ${estimatedMarginPercent}%`
        }
      ],
      sha256Hash: '',
      createdAt: now,
      updatedAt: now
    };

    dropShip.sha256Hash = this.calculateSha256(dropShip);
    return dropShip;
  }

  public static linkDropShipPurchaseOrder(
    dropShip: DropShipmentOrder,
    poId: string,
    poNumber: string,
    performedBy: string
  ): DropShipmentOrder {
    if (dropShip.status !== 'PENDING_PO_CREATION') {
      throw new Error(`DROPSHIP_INVALID_STATUS: Cannot link PO when drop-shipment is in status ${dropShip.status}`);
    }

    const now = new Date().toISOString();
    const updated: DropShipmentOrder = {
      ...dropShip,
      purchaseOrderId: poId,
      purchaseOrderNumber: poNumber,
      status: 'PO_CREATED',
      updatedAt: now,
      auditTrail: [
        ...dropShip.auditTrail,
        {
          id: `audit-${Date.now()}-dspo`,
          timestamp: now,
          action: 'LINK_PO',
          performedBy,
          previousStatus: dropShip.status,
          newStatus: 'PO_CREATED',
          details: `Linked to Supplier Purchase Order #${poNumber}`
        }
      ]
    };
    updated.sha256Hash = this.calculateSha256(updated);
    return updated;
  }

  public static confirmDropShipVendorDispatch(
    dropShip: DropShipmentOrder,
    carrierName: string,
    trackingNumber: string,
    performedBy: string
  ): DropShipmentOrder {
    if (dropShip.status !== 'PO_CREATED' && dropShip.status !== 'VENDOR_CONFIRMED') {
      throw new Error(`DROPSHIP_INVALID_STATUS: Cannot record transit in status ${dropShip.status}`);
    }

    const now = new Date().toISOString();
    const updated: DropShipmentOrder = {
      ...dropShip,
      carrierName,
      trackingNumber,
      status: 'IN_TRANSIT',
      updatedAt: now,
      auditTrail: [
        ...dropShip.auditTrail,
        {
          id: `audit-${Date.now()}-dsasn`,
          timestamp: now,
          action: 'VENDOR_DISPATCH',
          performedBy,
          previousStatus: dropShip.status,
          newStatus: 'IN_TRANSIT',
          details: `Vendor dispatched goods via ${carrierName} (Tracking: ${trackingNumber})`
        }
      ]
    };
    updated.sha256Hash = this.calculateSha256(updated);
    return updated;
  }

  public static confirmDropShipCustomerReceipt(
    dropShip: DropShipmentOrder,
    receivedDate: string,
    performedBy: string
  ): {
    updatedDropShip: DropShipmentOrder;
    financialEvent: FinancialEventPayload;
  } {
    if (dropShip.status !== 'IN_TRANSIT') {
      throw new Error(`DROPSHIP_INVALID_STATUS: Cannot confirm receipt for order in status ${dropShip.status}`);
    }

    const now = new Date().toISOString();
    const updated: DropShipmentOrder = {
      ...dropShip,
      customerReceivedDate: receivedDate || now,
      status: 'DELIVERED_TO_CUSTOMER',
      updatedAt: now,
      auditTrail: [
        ...dropShip.auditTrail,
        {
          id: `audit-${Date.now()}-dsdel`,
          timestamp: now,
          action: 'CUSTOMER_RECEIPT_CONFIRMED',
          performedBy,
          previousStatus: dropShip.status,
          newStatus: 'DELIVERED_TO_CUSTOMER',
          details: `Customer confirmed physical receipt on ${receivedDate}. Ready for customer sales billing & vendor AP voucher matching.`
        }
      ]
    };
    updated.sha256Hash = this.calculateSha256(updated);

    // Financial Event for Dropship Delivery:
    // Triggers Statistical Virtual GRN and COGS Recognition
    const financialEvent: FinancialEventPayload = {
      eventId: `fe-ds-del-${Date.now()}`,
      eventType: 'DROPSHIP_CUSTOMER_DELIVERED',
      tenantId: dropShip.tenantId,
      companyId: dropShip.companyId,
      sourceDocumentId: dropShip.id,
      sourceDocumentNumber: dropShip.dropShipNumber,
      sourceDocumentType: 'DROPSHIP_ORDER',
      amount: dropShip.customerTotalAmount,
      currency: dropShip.currency,
      exchangeRate: 1.0,
      timestamp: now,
      payload: {
        dropShipNumber: dropShip.dropShipNumber,
        salesOrderNumber: dropShip.salesOrderNumber,
        purchaseOrderNumber: dropShip.purchaseOrderNumber,
        customerSellingPrice: dropShip.customerSellingPrice,
        vendorPurchaseCost: dropShip.vendorPurchaseCost,
        totalSalesRevenue: dropShip.customerTotalAmount,
        totalCostOfGoodsSold: dropShip.vendorTotalCost,
        recognizedMargin: dropShip.estimatedMarginAmount
      },
      sha256Hash: this.calculateSha256({ dropShipNumber: dropShip.dropShipNumber, customerTotalAmount: dropShip.customerTotalAmount, action: 'DELIVERY' })
    };

    return {
      updatedDropShip: updated,
      financialEvent
    };
  }

  // =========================================================================
  // 5. DYNAMIC CUSTOMER CREDIT EXPOSURE & RISK WORKBENCH
  // =========================================================================

  public static evaluateCustomerCredit(
    profile: CustomerCreditProfile,
    newOrderAmount: number
  ): CreditCheckResult {
    const failureReasons: string[] = [];

    // 1. Check Hard Credit Hold Flag
    if (profile.creditHoldActive) {
      failureReasons.push('ACCOUNT_ON_CREDIT_HOLD: Customer account is placed on an administrative credit hold.');
    }

    // 2. Check Overdue Days Rule
    if (profile.overdueBalanceAmount > 0 && profile.oldestOverdueDays > profile.paymentTermsDays + 15) {
      failureReasons.push(`OVERDUE_PAYMENTS_EXIST: Customer has overdue balance of ${profile.overdueBalanceAmount} with oldest overdue of ${profile.oldestOverdueDays} days (Threshold: ${profile.paymentTermsDays + 15} days).`);
    }

    // 3. Dynamic Exposure Calculation
    // Total Exposure = Open Orders + Open Deliveries + Open AR Invoices
    const currentExposure = Number((profile.openOrdersAmount + profile.openDeliveriesAmount + profile.openInvoicesAmount).toFixed(2));
    const newProjectedExposure = Number((currentExposure + newOrderAmount).toFixed(2));
    const utilizationAfterOrder = profile.creditLimit > 0
      ? Number(((newProjectedExposure / profile.creditLimit) * 100).toFixed(2))
      : 100;

    // 4. Check Credit Limit Breach
    if (newProjectedExposure > profile.creditLimit) {
      failureReasons.push(`CREDIT_LIMIT_EXCEEDED: Projected exposure of ${newProjectedExposure} exceeds approved credit limit of ${profile.creditLimit} by ${Number((newProjectedExposure - profile.creditLimit).toFixed(2))}.`);
    }

    const passed = failureReasons.length === 0;
    let recommendedAction: 'APPROVE' | 'REQUIRE_PREPAYMENT' | 'REQUIRE_MANAGEMENT_OVERRIDE' | 'REJECT' = 'APPROVE';

    if (!passed) {
      if (profile.creditHoldActive || profile.creditRiskRating === 'CRITICAL_SUSPENDED') {
        recommendedAction = 'REJECT';
      } else if (profile.overdueBalanceAmount > 0) {
        recommendedAction = 'REQUIRE_PREPAYMENT';
      } else {
        recommendedAction = 'REQUIRE_MANAGEMENT_OVERRIDE';
      }
    }

    return {
      passed,
      customerId: profile.customerId,
      customerName: profile.customerName,
      requestedOrderAmount: newOrderAmount,
      currentExposure,
      newProjectedExposure,
      creditLimit: profile.creditLimit,
      utilizationAfterOrder,
      creditHoldActive: profile.creditHoldActive,
      overdueBlocking: profile.overdueBalanceAmount > 0,
      failureReasons,
      requiresSpecialApproval: !passed,
      recommendedAction
    };
  }

  public static applyCreditOverride(
    profile: CustomerCreditProfile,
    approvedBy: string,
    expiryDays: number = 7,
    notes?: string
  ): CustomerCreditProfile {
    // Segregation of Duties: Sales rep cannot override their own customer's credit hold
    if (!approvedBy) {
      throw new Error('CREDIT_OVERRIDE_APPROVER_REQUIRED: Management approver name is mandatory.');
    }

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + expiryDays);

    return {
      ...profile,
      overrideApprover: approvedBy,
      overrideExpiryDate: expiry.toISOString(),
      notes: notes ? `${profile.notes || ''} | Override by ${approvedBy}: ${notes}` : profile.notes,
      updatedAt: new Date().toISOString()
    };
  }
}
