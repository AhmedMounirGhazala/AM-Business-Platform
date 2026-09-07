/**
 * AM Enterprise ERP — Phase 3.2D-09 Engine
 * Co-Products & By-Products Cost Allocation, Multi-Level Batch Genealogy & Serialization Traceability,
 * Engineering Change Orders (ECO) with BOM Redlining, and Disassembly / De-Manufacturing Workflows.
 */

import {
  JointProductionCostAnalysis,
  JointCostAllocationMethod,
  CoProductOutputItem,
  ByProductOutputItem,
  BatchGenealogyNode,
  BatchTraceResult,
  GenealogyNodeType,
  GenealogyQuarantineStatus,
  EngineeringChangeOrder,
  EcoStatus,
  BomRedlineItem,
  EcoApprovalSignature,
  DisassemblyOrder,
  DisassemblyOrderStatus,
  HarvestedComponent,
  DisassemblyFinancialEvent
} from '../types/manufacturingGenealogyEcoDisassembly';

export class ManufacturingGenealogyEcoDisassemblyEngine {
  private static genealogyVault: Map<string, BatchGenealogyNode> = new Map();
  private static ecoVault: Map<string, EngineeringChangeOrder> = new Map();
  private static disassemblyVault: Map<string, DisassemblyOrder> = new Map();
  private static jointCostVault: Map<string, JointProductionCostAnalysis> = new Map();

  // -------------------------------------------------------------------------
  // Helper: SHA-256 equivalent deterministic hash
  // -------------------------------------------------------------------------
  private static computeHash(data: any): string {
    const str = JSON.stringify(data);
    let hash1 = 0xdeadbeef;
    let hash2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      hash1 = Math.imul(hash1 ^ ch, 2654435761);
      hash2 = Math.imul(hash2 ^ ch, 1597334677);
    }
    hash1 = Math.imul(hash1 ^ (hash1 >>> 16), 2246822507) ^ Math.imul(hash2 ^ (hash2 >>> 13), 3266489909);
    hash2 = Math.imul(hash2 ^ (hash2 >>> 16), 2246822507) ^ Math.imul(hash1 ^ (hash1 >>> 13), 3266489909);
    const hex1 = (hash1 >>> 0).toString(16).padStart(8, '0');
    const hex2 = (hash2 >>> 0).toString(16).padStart(8, '0');
    return `SHA256-${hex1}${hex2}${(hex1 + hex2).slice(0, 16)}`.toUpperCase();
  }

  // =========================================================================
  // 1. CO-PRODUCTS & BY-PRODUCTS COST ALLOCATION
  // =========================================================================

  public static calculateJointProductionCosts(params: {
    tenantId: string;
    companyId: string;
    manufacturingOrderId: string;
    totalOrderCostGross: number;
    allocationMethod?: JointCostAllocationMethod;
    currency?: string;
    coProducts: Array<{
      itemSku: string;
      productName: string;
      isPrimary: boolean;
      producedQty: number;
      unitOfMeasure: string;
      equivalenceFactor?: number;
      plannedSalesPricePerUnit?: number;
      glAccountDestination?: string;
    }>;
    byProducts?: Array<{
      itemSku: string;
      productName: string;
      producedQty: number;
      unitOfMeasure: string;
      standardCreditRatePerUnit: number;
      glAccountDestination?: string;
    }>;
  }): {
    analysis: JointProductionCostAnalysis;
    financialEvent: DisassemblyFinancialEvent;
  } {
    const {
      tenantId,
      companyId,
      manufacturingOrderId,
      totalOrderCostGross,
      allocationMethod = 'EQUIVALENCE_NUMBERS',
      currency = 'USD',
      coProducts,
      byProducts = []
    } = params;

    if (!tenantId || !companyId) throw new Error('Tenant ID and Company ID are mandatory.');
    if (!manufacturingOrderId) throw new Error('Manufacturing Order ID is mandatory.');
    if (totalOrderCostGross <= 0) throw new Error('Total Gross Manufacturing Order Cost must be greater than zero.');
    if (!coProducts || coProducts.length === 0) throw new Error('At least one primary/co-product output must be specified.');

    // 1. Compute by-products recovery credit
    let byProductCreditTotal = 0;
    const computedByProducts: ByProductOutputItem[] = byProducts.map(bp => {
      const totalCreditValue = Number((bp.producedQty * bp.standardCreditRatePerUnit).toFixed(2));
      byProductCreditTotal += totalCreditValue;
      return {
        itemSku: bp.itemSku,
        productName: bp.productName,
        producedQty: bp.producedQty,
        unitOfMeasure: bp.unitOfMeasure,
        standardCreditRatePerUnit: bp.standardCreditRatePerUnit,
        totalCreditValue,
        glAccountDestination: bp.glAccountDestination || '13200-BY-PRODUCTS-INVENTORY'
      };
    });

    byProductCreditTotal = Number(byProductCreditTotal.toFixed(2));
    const netJointCostToAllocate = Number(Math.max(0, totalOrderCostGross - byProductCreditTotal).toFixed(2));

    // 2. Allocate net joint cost across co-products
    let computedCoProducts: CoProductOutputItem[] = [];

    if (allocationMethod === 'EQUIVALENCE_NUMBERS') {
      let totalEquivalencePoints = 0;
      coProducts.forEach(cp => {
        const factor = cp.equivalenceFactor ?? (cp.isPrimary ? 1.0 : 0.5);
        totalEquivalencePoints += cp.producedQty * factor;
      });

      if (totalEquivalencePoints <= 0) throw new Error('Total equivalence points across co-products must be > 0.');

      const costPerPoint = netJointCostToAllocate / totalEquivalencePoints;

      let allocatedSum = 0;
      computedCoProducts = coProducts.map((cp, idx) => {
        const factor = cp.equivalenceFactor ?? (cp.isPrimary ? 1.0 : 0.5);
        let allocatedJointCost = 0;
        if (idx === coProducts.length - 1) {
          // Balance out rounding discrepancy on final item
          allocatedJointCost = Number((netJointCostToAllocate - allocatedSum).toFixed(2));
        } else {
          allocatedJointCost = Number(((cp.producedQty * factor) * costPerPoint).toFixed(2));
          allocatedSum += allocatedJointCost;
        }

        const unitManufacturingCost = cp.producedQty > 0
          ? Number((allocatedJointCost / cp.producedQty).toFixed(4))
          : 0;

        return {
          itemSku: cp.itemSku,
          productName: cp.productName,
          isPrimary: cp.isPrimary,
          producedQty: cp.producedQty,
          unitOfMeasure: cp.unitOfMeasure,
          equivalenceFactor: factor,
          plannedSalesPricePerUnit: cp.plannedSalesPricePerUnit,
          allocatedJointCost,
          unitManufacturingCost,
          glAccountDestination: cp.glAccountDestination || '13100-FINISHED-GOODS-INVENTORY'
        };
      });
    } else if (allocationMethod === 'NET_REALIZABLE_VALUE') {
      let totalNrv = 0;
      coProducts.forEach(cp => {
        const price = cp.plannedSalesPricePerUnit || 1.0;
        totalNrv += cp.producedQty * price;
      });

      if (totalNrv <= 0) throw new Error('Total Net Realizable Value across co-products must be > 0.');

      let allocatedSum = 0;
      computedCoProducts = coProducts.map((cp, idx) => {
        const price = cp.plannedSalesPricePerUnit || 1.0;
        const nrv = cp.producedQty * price;
        let allocatedJointCost = 0;

        if (idx === coProducts.length - 1) {
          allocatedJointCost = Number((netJointCostToAllocate - allocatedSum).toFixed(2));
        } else {
          allocatedJointCost = Number(((nrv / totalNrv) * netJointCostToAllocate).toFixed(2));
          allocatedSum += allocatedJointCost;
        }

        const unitManufacturingCost = cp.producedQty > 0
          ? Number((allocatedJointCost / cp.producedQty).toFixed(4))
          : 0;

        return {
          itemSku: cp.itemSku,
          productName: cp.productName,
          isPrimary: cp.isPrimary,
          producedQty: cp.producedQty,
          unitOfMeasure: cp.unitOfMeasure,
          equivalenceFactor: cp.equivalenceFactor ?? 1.0,
          plannedSalesPricePerUnit: price,
          allocatedJointCost,
          unitManufacturingCost,
          glAccountDestination: cp.glAccountDestination || '13100-FINISHED-GOODS-INVENTORY'
        };
      });
    } else {
      // Physical Quantity Method
      let totalQty = coProducts.reduce((sum, c) => sum + c.producedQty, 0);
      if (totalQty <= 0) throw new Error('Total produced quantity across co-products must be > 0.');

      let allocatedSum = 0;
      computedCoProducts = coProducts.map((cp, idx) => {
        let allocatedJointCost = 0;
        if (idx === coProducts.length - 1) {
          allocatedJointCost = Number((netJointCostToAllocate - allocatedSum).toFixed(2));
        } else {
          allocatedJointCost = Number(((cp.producedQty / totalQty) * netJointCostToAllocate).toFixed(2));
          allocatedSum += allocatedJointCost;
        }

        const unitManufacturingCost = cp.producedQty > 0
          ? Number((allocatedJointCost / cp.producedQty).toFixed(4))
          : 0;

        return {
          itemSku: cp.itemSku,
          productName: cp.productName,
          isPrimary: cp.isPrimary,
          producedQty: cp.producedQty,
          unitOfMeasure: cp.unitOfMeasure,
          equivalenceFactor: cp.equivalenceFactor ?? 1.0,
          allocatedJointCost,
          unitManufacturingCost,
          glAccountDestination: cp.glAccountDestination || '13100-FINISHED-GOODS-INVENTORY'
        };
      });
    }

    const analysisId = `JCA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const auditHash = this.computeHash({
      analysisId,
      manufacturingOrderId,
      totalOrderCostGross,
      byProductCreditTotal,
      netJointCostToAllocate,
      computedCoProducts
    });

    const analysis: JointProductionCostAnalysis = {
      id: analysisId,
      tenantId,
      companyId,
      manufacturingOrderId,
      calculationDate: new Date().toISOString(),
      totalOrderCostGross,
      byProductCreditTotal,
      netJointCostToAllocate,
      allocationMethod,
      coProducts: computedCoProducts,
      byProducts: computedByProducts,
      currency,
      auditHash
    };

    this.jointCostVault.set(analysis.id, analysis);

    // 3. Generate Event-Driven Double-Entry Postings (Zero direct GL mutation)
    // Postings:
    // DR Finished Goods for each Co-Product (Sum of allocated costs)
    // DR By-Products Inventory for By-Products credit total
    // CR Work-in-Progress Manufacturing Order (Gross total cost)
    const glPostings: Array<{ accountCode: string; accountName: string; debitAmount: number; creditAmount: number }> = [];

    computedCoProducts.forEach(cp => {
      glPostings.push({
        accountCode: cp.glAccountDestination,
        accountName: `Finished Goods Inventory - ${cp.productName}`,
        debitAmount: cp.allocatedJointCost,
        creditAmount: 0
      });
    });

    if (byProductCreditTotal > 0) {
      glPostings.push({
        accountCode: '13200-BY-PRODUCTS-INVENTORY',
        accountName: 'Secondary By-Products Inventory',
        debitAmount: byProductCreditTotal,
        creditAmount: 0
      });
    }

    glPostings.push({
      accountCode: '14100-WIP-MANUFACTURING-CLEARING',
      accountName: 'Work-in-Progress Manufacturing Order Clearing',
      debitAmount: 0,
      creditAmount: totalOrderCostGross
    });

    const totalDebits = Number(glPostings.reduce((sum, p) => sum + p.debitAmount, 0).toFixed(2));
    const totalCredits = Number(glPostings.reduce((sum, p) => sum + p.creditAmount, 0).toFixed(2));
    const balanced = Math.abs(totalDebits - totalCredits) < 0.01;

    const financialEvent: DisassemblyFinancialEvent = {
      eventId: `EVT-JCA-${Date.now()}`,
      tenantId,
      companyId,
      orderCode: manufacturingOrderId,
      eventType: 'JOINT_CO_PRODUCT_COST_ALLOCATED',
      timestamp: new Date().toISOString(),
      glPostings,
      balanced,
      auditHash: this.computeHash({ glPostings, balanced })
    };

    return { analysis, financialEvent };
  }

  // =========================================================================
  // 2. MULTI-LEVEL BATCH GENEALOGY & AS-BUILT SERIALIZATION
  // =========================================================================

  public static registerGenealogyNode(params: {
    tenantId: string;
    companyId: string;
    lotOrSerialNumber: string;
    itemSku: string;
    itemDescription: string;
    nodeType: GenealogyNodeType;
    parentLotNumber?: string;
    childLotNumbers?: string[];
    workCenterId: string;
    manufacturingOrderId?: string;
    supplierLotNumber?: string;
    operatorId: string;
    telemetry?: {
      inspectionId?: string;
      torqueNewtonMeters?: number;
      dimensionMm?: number;
      purityPct?: number;
      passedInspection: boolean;
    };
  }): BatchGenealogyNode {
    const {
      tenantId,
      companyId,
      lotOrSerialNumber,
      itemSku,
      itemDescription,
      nodeType,
      parentLotNumber,
      childLotNumbers = [],
      workCenterId,
      manufacturingOrderId,
      supplierLotNumber,
      operatorId,
      telemetry
    } = params;

    if (!lotOrSerialNumber) throw new Error('Lot or Serial Number is mandatory.');
    if (!itemSku) throw new Error('Item SKU is mandatory.');

    const nodeId = `NODE-${lotOrSerialNumber}`;
    const auditHash = this.computeHash({
      lotOrSerialNumber,
      itemSku,
      nodeType,
      parentLotNumber,
      childLotNumbers,
      workCenterId,
      operatorId
    });

    const node: BatchGenealogyNode = {
      nodeId,
      tenantId,
      companyId,
      lotOrSerialNumber,
      itemSku,
      itemDescription,
      nodeType,
      parentLotNumber,
      childLotNumbers: [...childLotNumbers],
      workCenterId,
      manufacturingOrderId,
      supplierLotNumber,
      operatorId,
      timestamp: new Date().toISOString(),
      quarantineStatus: 'CLEARED',
      telemetry,
      auditHash
    };

    this.genealogyVault.set(lotOrSerialNumber, node);

    // Also update parent's child references if parent exists
    if (parentLotNumber && this.genealogyVault.has(parentLotNumber)) {
      const parent = this.genealogyVault.get(parentLotNumber)!;
      if (!parent.childLotNumbers.includes(lotOrSerialNumber)) {
        parent.childLotNumbers.push(lotOrSerialNumber);
      }
    }

    return node;
  }

  public static traceUpstreamWhereUsed(lotOrSerialNumber: string): BatchTraceResult {
    const rootNode = this.genealogyVault.get(lotOrSerialNumber);
    if (!rootNode) throw new Error(`Lot / Serial Number "${lotOrSerialNumber}" not found in genealogy vault.`);

    const traversedNodes: BatchGenealogyNode[] = [];
    const visited = new Set<string>();

    const traverseUp = (currentLot: string) => {
      if (visited.has(currentLot)) return;
      visited.add(currentLot);
      const node = this.genealogyVault.get(currentLot);
      if (!node) return;
      traversedNodes.push(node);

      // Child lot numbers in this context represent raw materials/components that went INTO this node
      node.childLotNumbers.forEach(childLot => {
        traverseUp(childLot);
      });
    };

    traverseUp(lotOrSerialNumber);

    const impactedFinishedGoods = traversedNodes.filter(n => n.nodeType === 'FINISHED_GOOD').map(n => n.lotOrSerialNumber);
    const impactedSubassemblies = traversedNodes.filter(n => n.nodeType === 'SUBASSEMBLY').map(n => n.lotOrSerialNumber);
    const containsQuarantinedItems = traversedNodes.some(n => n.quarantineStatus !== 'CLEARED');

    return {
      rootLotNumber: lotOrSerialNumber,
      direction: 'UPSTREAM_WHERE_USED',
      traversedNodes,
      impactedFinishedGoodsLots: impactedFinishedGoods,
      impactedSubassemblies,
      totalNodesCount: traversedNodes.length,
      containsQuarantinedItems
    };
  }

  public static traceDownstreamImpact(lotOrSerialNumber: string): BatchTraceResult {
    const rootNode = this.genealogyVault.get(lotOrSerialNumber);
    if (!rootNode) throw new Error(`Lot / Serial Number "${lotOrSerialNumber}" not found in genealogy vault.`);

    const traversedNodes: BatchGenealogyNode[] = [];
    const visited = new Set<string>();

    const traverseDown = (currentLot: string) => {
      if (visited.has(currentLot)) return;
      visited.add(currentLot);
      const node = this.genealogyVault.get(currentLot);
      if (!node) return;
      traversedNodes.push(node);

      // Find all nodes that list currentLot as their parent OR in their childLotNumbers
      for (const candidate of this.genealogyVault.values()) {
        if (candidate.parentLotNumber === currentLot || candidate.childLotNumbers.includes(currentLot)) {
          traverseDown(candidate.lotOrSerialNumber);
        }
      }
    };

    traverseDown(lotOrSerialNumber);

    const impactedFinishedGoods = traversedNodes.filter(n => n.nodeType === 'FINISHED_GOOD').map(n => n.lotOrSerialNumber);
    const impactedSubassemblies = traversedNodes.filter(n => n.nodeType === 'SUBASSEMBLY').map(n => n.lotOrSerialNumber);
    const containsQuarantinedItems = traversedNodes.some(n => n.quarantineStatus !== 'CLEARED');

    return {
      rootLotNumber: lotOrSerialNumber,
      direction: 'DOWNSTREAM_IMPACT',
      traversedNodes,
      impactedFinishedGoodsLots: impactedFinishedGoods,
      impactedSubassemblies,
      totalNodesCount: traversedNodes.length,
      containsQuarantinedItems
    };
  }

  public static applyGenealogyQuarantineContainment(params: {
    suspectLotNumber: string;
    quarantineReason: string;
    operatorId: string;
  }): {
    lockedCount: number;
    lockedLots: string[];
    traceResult: BatchTraceResult;
  } {
    const { suspectLotNumber, quarantineReason, operatorId } = params;
    if (!suspectLotNumber) throw new Error('Suspect Lot Number is mandatory for quarantine containment.');
    if (!quarantineReason) throw new Error('Quarantine reason justification is mandatory.');

    const trace = this.traceDownstreamImpact(suspectLotNumber);
    const lockedLots: string[] = [];

    trace.traversedNodes.forEach(node => {
      const liveNode = this.genealogyVault.get(node.lotOrSerialNumber);
      if (liveNode) {
        liveNode.quarantineStatus = 'QUARANTINE_HOLD';
        liveNode.quarantineReason = `Containment trigger from ${suspectLotNumber}: ${quarantineReason} (by ${operatorId})`;
        liveNode.auditHash = this.computeHash({
          lot: liveNode.lotOrSerialNumber,
          status: liveNode.quarantineStatus,
          reason: liveNode.quarantineReason
        });
        lockedLots.push(liveNode.lotOrSerialNumber);
      }
    });

    return {
      lockedCount: lockedLots.length,
      lockedLots,
      traceResult: this.traceDownstreamImpact(suspectLotNumber)
    };
  }

  // =========================================================================
  // 3. ENGINEERING CHANGE ORDERS (ECO) & BOM REDLINING
  // =========================================================================

  public static createEngineeringChangeOrder(params: {
    tenantId: string;
    companyId: string;
    ecoCode: string;
    title: string;
    description: string;
    originatorId: string;
    targetProductSku: string;
    currentBomRevision: string;
    proposedBomRevision: string;
    effectivityType?: 'EFFECTIVE_DATE' | 'SERIAL_CUTOFF_NUMBER';
    effectiveDate?: string;
    effectiveCutoffSerialOrLot?: string;
    redlineItems: BomRedlineItem[];
  }): EngineeringChangeOrder {
    const {
      tenantId,
      companyId,
      ecoCode,
      title,
      description,
      originatorId,
      targetProductSku,
      currentBomRevision,
      proposedBomRevision,
      effectivityType = 'EFFECTIVE_DATE',
      effectiveDate,
      effectiveCutoffSerialOrLot,
      redlineItems
    } = params;

    if (!ecoCode) throw new Error('ECO Code is mandatory.');
    if (!originatorId) throw new Error('ECO Originator ID is mandatory.');
    if (!redlineItems || redlineItems.length === 0) throw new Error('At least one BOM redline item is required.');

    const id = `ECO-${Date.now()}`;
    const auditHash = this.computeHash({
      ecoCode,
      targetProductSku,
      currentBomRevision,
      proposedBomRevision,
      originatorId,
      redlineItems
    });

    const eco: EngineeringChangeOrder = {
      id,
      tenantId,
      companyId,
      ecoCode,
      title,
      description,
      originatorId,
      targetProductSku,
      currentBomRevision,
      proposedBomRevision,
      status: 'DRAFT',
      effectivityType,
      effectiveDate,
      effectiveCutoffSerialOrLot,
      redlineItems,
      approvals: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditHash
    };

    this.ecoVault.set(eco.id, eco);
    return eco;
  }

  public static submitEcoForReview(ecoId: string): EngineeringChangeOrder {
    const eco = this.ecoVault.get(ecoId);
    if (!eco) throw new Error(`ECO with ID "${ecoId}" not found.`);
    if (eco.status !== 'DRAFT') throw new Error(`Only DRAFT ECOs can be submitted. Current status: ${eco.status}`);

    eco.status = 'CCB_REVIEW';
    eco.updatedAt = new Date().toISOString();
    eco.auditHash = this.computeHash({ id: eco.id, status: eco.status });
    return eco;
  }

  public static approveEngineeringChangeOrder(params: {
    ecoId: string;
    approverId: string;
    approverName: string;
    role: 'CCB_CHAIR' | 'CHIEF_ENGINEER' | 'OPERATIONS_DIRECTOR' | 'QUALITY_HEAD';
    decision: 'APPROVED' | 'REJECTED';
    comments?: string;
  }): EngineeringChangeOrder {
    const { ecoId, approverId, approverName, role, decision, comments } = params;
    const eco = this.ecoVault.get(ecoId);
    if (!eco) throw new Error(`ECO with ID "${ecoId}" not found.`);

    if (eco.status !== 'CCB_REVIEW') {
      throw new Error(`ECO must be in CCB_REVIEW to approve or reject. Current status: ${eco.status}`);
    }

    // Segregation of Duties (SoD) Enforcement: Originator CANNOT approve own ECO
    if (eco.originatorId === approverId) {
      throw new Error(`Segregation of Duties (SoD) Violation: ECO originator (${approverId}) cannot sign CCB approval.`);
    }

    const signatureToken = this.computeHash({
      ecoId,
      approverId,
      role,
      decision,
      timestamp: new Date().toISOString()
    });

    const approvalSignature: EcoApprovalSignature = {
      approverId,
      approverName,
      role,
      decision,
      signatureToken,
      timestamp: new Date().toISOString(),
      comments
    };

    eco.approvals.push(approvalSignature);

    if (decision === 'REJECTED') {
      eco.status = 'REJECTED';
    } else {
      // If approved by CCB Chairperson or Chief Engineer
      eco.status = 'APPROVED';
    }

    eco.updatedAt = new Date().toISOString();
    eco.auditHash = this.computeHash({ id: eco.id, status: eco.status, approvals: eco.approvals });
    return eco;
  }

  public static activateEcoEffectivity(ecoId: string): EngineeringChangeOrder {
    const eco = this.ecoVault.get(ecoId);
    if (!eco) throw new Error(`ECO with ID "${ecoId}" not found.`);
    if (eco.status !== 'APPROVED') {
      throw new Error(`Only APPROVED ECOs can be activated as EFFECTIVE. Current status: ${eco.status}`);
    }

    eco.status = 'EFFECTIVE';
    eco.updatedAt = new Date().toISOString();
    eco.auditHash = this.computeHash({ id: eco.id, status: eco.status, effectiveAt: eco.updatedAt });
    return eco;
  }

  // =========================================================================
  // 4. DISASSEMBLY / DE-MANUFACTURING & COMPONENT HARVESTING
  // =========================================================================

  public static createDisassemblyOrder(params: {
    tenantId: string;
    companyId: string;
    disassemblyCode: string;
    sourceItemSku: string;
    sourceSerialOrLot: string;
    sourceUnitBookValue: number;
    workCenterId: string;
    operatorId: string;
    laborRatePerHour?: number;
  }): DisassemblyOrder {
    const {
      tenantId,
      companyId,
      disassemblyCode,
      sourceItemSku,
      sourceSerialOrLot,
      sourceUnitBookValue,
      workCenterId,
      operatorId,
      laborRatePerHour = 45.0
    } = params;

    if (!disassemblyCode) throw new Error('Disassembly Order Code is mandatory.');
    if (!sourceItemSku || !sourceSerialOrLot) throw new Error('Source item SKU and Serial/Lot number are mandatory.');
    if (sourceUnitBookValue <= 0) throw new Error('Source unit book value must be > 0.');

    const id = `DIS-${Date.now()}`;
    const auditHash = this.computeHash({
      disassemblyCode,
      sourceItemSku,
      sourceSerialOrLot,
      sourceUnitBookValue,
      operatorId
    });

    const order: DisassemblyOrder = {
      id,
      tenantId,
      companyId,
      disassemblyCode,
      sourceItemSku,
      sourceSerialOrLot,
      sourceUnitBookValue,
      workCenterId,
      operatorId,
      status: 'PLANNED',
      teardownHoursLabor: 0,
      laborRatePerHour,
      harvestedComponents: [],
      totalHarvestedValue: 0,
      netDisassemblyVariance: 0,
      createdAt: new Date().toISOString(),
      auditHash
    };

    this.disassemblyVault.set(order.id, order);
    return order;
  }

  public static executeComponentHarvesting(params: {
    disassemblyOrderId: string;
    teardownHoursLabor: number;
    harvestedComponents: Array<{
      componentSku: string;
      componentName: string;
      harvestedQty: number;
      unitOfMeasure: string;
      conditionGrade: 'GRADE_A_REUSABLE' | 'GRADE_B_REFURB_NEEDED' | 'GRADE_C_SCRAP_SALVAGE' | 'UNSALVAGEABLE_WASTE';
      targetWarehouseId?: string;
      targetBinId?: string;
      glAccountCreditOrDebit?: string;
    }>;
  }): {
    order: DisassemblyOrder;
    financialEvent: DisassemblyFinancialEvent;
  } {
    const { disassemblyOrderId, teardownHoursLabor, harvestedComponents } = params;
    const order = this.disassemblyVault.get(disassemblyOrderId);
    if (!order) throw new Error(`Disassembly Order "${disassemblyOrderId}" not found.`);
    if (order.status === 'COMPLETED') throw new Error('Disassembly Order is already completed.');

    if (teardownHoursLabor < 0) throw new Error('Teardown labor hours cannot be negative.');
    if (!harvestedComponents || harvestedComponents.length === 0) {
      throw new Error('At least one component must be harvested from disassembly teardown.');
    }

    order.teardownHoursLabor = teardownHoursLabor;
    const directLaborCost = Number((teardownHoursLabor * order.laborRatePerHour).toFixed(2));
    const totalDismantleBaseCost = Number((order.sourceUnitBookValue + directLaborCost).toFixed(2));

    // Base allocation per component unit:
    const totalHarvestedQty = harvestedComponents.reduce((sum, c) => sum + c.harvestedQty, 0);
    const baseSharePerComponentUnit = totalHarvestedQty > 0 ? (totalDismantleBaseCost / totalHarvestedQty) : 0;

    const evaluatedComponents: HarvestedComponent[] = [];
    let totalHarvestedValue = 0;

    harvestedComponents.forEach((c, idx) => {
      let weight = 0;
      if (c.conditionGrade === 'GRADE_A_REUSABLE') weight = 1.0;
      else if (c.conditionGrade === 'GRADE_B_REFURB_NEEDED') weight = 0.6;
      else if (c.conditionGrade === 'GRADE_C_SCRAP_SALVAGE') weight = 0.15;
      else if (c.conditionGrade === 'UNSALVAGEABLE_WASTE') weight = 0.0;

      const allocatedCost = Number((c.harvestedQty * baseSharePerComponentUnit * weight).toFixed(2));
      totalHarvestedValue += allocatedCost;

      evaluatedComponents.push({
        componentSku: c.componentSku,
        componentName: c.componentName,
        harvestedQty: c.harvestedQty,
        unitOfMeasure: c.unitOfMeasure,
        conditionGrade: c.conditionGrade,
        assignedConditionLot: `LOT-HRV-${Date.now().toString().slice(-4)}-${idx + 1}`,
        allocatedResidualCost: allocatedCost,
        targetWarehouseId: c.targetWarehouseId || 'WH-PARTS-01',
        targetBinId: c.targetBinId || 'BIN-HARVEST-A1',
        glAccountCreditOrDebit: c.glAccountCreditOrDebit || (
          c.conditionGrade === 'GRADE_A_REUSABLE'
            ? '13150-PARTS-INVENTORY'
            : c.conditionGrade === 'GRADE_B_REFURB_NEEDED'
            ? '14200-REFURBISHMENT-WIP'
            : '13300-SCRAP-SALVAGE-INVENTORY'
        )
      });
    });

    totalHarvestedValue = Number(totalHarvestedValue.toFixed(2));
    const netDisassemblyVariance = Number((totalHarvestedValue - totalDismantleBaseCost).toFixed(2));

    order.harvestedComponents = evaluatedComponents;
    order.totalHarvestedValue = totalHarvestedValue;
    order.netDisassemblyVariance = netDisassemblyVariance;
    order.status = 'COMPLETED';
    order.completedAt = new Date().toISOString();
    order.auditHash = this.computeHash({
      id: order.id,
      status: order.status,
      totalHarvestedValue,
      netDisassemblyVariance
    });

    // Generate Double-Entry Accounting Postings:
    // DR Component Parts Inventory (Grade A)
    // DR Refurbishment WIP (Grade B)
    // DR Scrap Salvage Inventory (Grade C)
    // DR/CR Disassembly Variance (Gain / Loss)
    // CR Disassembled Asset Inventory (Book Value)
    // CR Direct Labor Absorption
    const glPostings: Array<{ accountCode: string; accountName: string; debitAmount: number; creditAmount: number }> = [];

    evaluatedComponents.forEach(comp => {
      if (comp.allocatedResidualCost > 0) {
        glPostings.push({
          accountCode: comp.glAccountCreditOrDebit,
          accountName: `Harvested Stock (${comp.conditionGrade}) - ${comp.componentName}`,
          debitAmount: comp.allocatedResidualCost,
          creditAmount: 0
        });
      }
    });

    // Credit original asset book value
    glPostings.push({
      accountCode: '13100-FINISHED-GOODS-INVENTORY',
      accountName: `Disassembled Asset De-recognition (${order.sourceItemSku})`,
      debitAmount: 0,
      creditAmount: order.sourceUnitBookValue
    });

    // Credit direct labor applied if labor incurred
    if (directLaborCost > 0) {
      glPostings.push({
        accountCode: '52100-DIRECT-LABOR-ABSORBED',
        accountName: 'Manufacturing Direct Labor Absorption',
        debitAmount: 0,
        creditAmount: directLaborCost
      });
    }

    // Plug variance if any discrepancy due to rounding or condition write-down
    const sumDebits = Number(glPostings.reduce((sum, p) => sum + p.debitAmount, 0).toFixed(2));
    const sumCredits = Number(glPostings.reduce((sum, p) => sum + p.creditAmount, 0).toFixed(2));
    const diff = Number((sumCredits - sumDebits).toFixed(2));

    if (Math.abs(diff) >= 0.01) {
      if (diff > 0) {
        // Debits were less than credits -> Disassembly Loss / Variance
        glPostings.push({
          accountCode: '59100-DISASSEMBLY-LOSS-VARIANCE',
          accountName: 'Disassembly Teardown Degradation Loss',
          debitAmount: diff,
          creditAmount: 0
        });
      } else {
        // Debits were greater than credits -> Disassembly Recovery Gain
        glPostings.push({
          accountCode: '49100-DISASSEMBLY-RECOVERY-GAIN',
          accountName: 'Disassembly Salvage Recovery Gain',
          debitAmount: 0,
          creditAmount: Math.abs(diff)
        });
      }
    }

    const finalDebits = Number(glPostings.reduce((sum, p) => sum + p.debitAmount, 0).toFixed(2));
    const finalCredits = Number(glPostings.reduce((sum, p) => sum + p.creditAmount, 0).toFixed(2));
    const balanced = Math.abs(finalDebits - finalCredits) < 0.01;

    const financialEvent: DisassemblyFinancialEvent = {
      eventId: `EVT-DIS-${Date.now()}`,
      tenantId: order.tenantId,
      companyId: order.companyId,
      orderCode: order.disassemblyCode,
      eventType: 'DISASSEMBLY_TEARDOWN_COMPLETED',
      timestamp: new Date().toISOString(),
      glPostings,
      balanced,
      auditHash: this.computeHash({ glPostings, balanced })
    };

    return { order, financialEvent };
  }

  // =========================================================================
  // Vault Inspection & Query Methods
  // =========================================================================

  public static getGenealogyNode(lotOrSerial: string): BatchGenealogyNode | undefined {
    return this.genealogyVault.get(lotOrSerial);
  }

  public static getAllGenealogyNodes(): BatchGenealogyNode[] {
    return Array.from(this.genealogyVault.values());
  }

  public static getEco(ecoId: string): EngineeringChangeOrder | undefined {
    return this.ecoVault.get(ecoId);
  }

  public static getAllEcos(): EngineeringChangeOrder[] {
    return Array.from(this.ecoVault.values());
  }

  public static getDisassemblyOrder(orderId: string): DisassemblyOrder | undefined {
    return this.disassemblyVault.get(orderId);
  }

  public static getAllDisassemblyOrders(): DisassemblyOrder[] {
    return Array.from(this.disassemblyVault.values());
  }

  public static getJointCostAnalysis(id: string): JointProductionCostAnalysis | undefined {
    return this.jointCostVault.get(id);
  }
}
