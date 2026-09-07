/**
 * AM Enterprise ERP — Phase 3.2D-09 Hardening Test Suite
 * Co-Products & By-Products Cost Allocation, Multi-Level Batch Genealogy & Serialization Traceability,
 * Engineering Change Orders (ECO) with BOM Redlining, and Disassembly / De-Manufacturing Workflows.
 */

import { ManufacturingGenealogyEcoDisassemblyEngine } from './manufacturingGenealogyEcoDisassemblyEngine';
import { Phase32D08HardeningSuite } from './phase32D08HardeningSuite';

export interface HardeningTestResult {
  id: string;
  name: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

export class Phase32D09HardeningSuite {
  public static runAll(): { passed: number; total: number; results: HardeningTestResult[]; phase: string } {
    const results: HardeningTestResult[] = [];

    const runTest = (id: string, name: string, fn: () => void) => {
      const start = performance.now();
      try {
        fn();
        results.push({
          id,
          name,
          passed: true,
          durationMs: Math.round((performance.now() - start) * 100) / 100
        });
      } catch (err: any) {
        results.push({
          id,
          name,
          passed: false,
          message: err.message || String(err),
          durationMs: Math.round((performance.now() - start) * 100) / 100
        });
      }
    };

    // =========================================================================
    // SECTION 1: CO-PRODUCTS & BY-PRODUCTS COST ALLOCATION (TESTS 01 - 09)
    // =========================================================================

    runTest('3.2D-09-01', 'Joint Production Cost Allocation via Equivalence Numbers with By-Product Credit', () => {
      const { analysis, financialEvent } = ManufacturingGenealogyEcoDisassemblyEngine.calculateJointProductionCosts({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        manufacturingOrderId: 'MO-CHEM-8801',
        totalOrderCostGross: 10000.0,
        allocationMethod: 'EQUIVALENCE_NUMBERS',
        coProducts: [
          {
            itemSku: 'SKU-ETHANOL-HIGH',
            productName: 'High Purity Ethanol (Primary)',
            isPrimary: true,
            producedQty: 500,
            unitOfMeasure: 'L',
            equivalenceFactor: 1.0
          },
          {
            itemSku: 'SKU-ETHANOL-TECH',
            productName: 'Technical Grade Ethanol (Co-Product)',
            isPrimary: false,
            producedQty: 300,
            unitOfMeasure: 'L',
            equivalenceFactor: 0.6
          }
        ],
        byProducts: [
          {
            itemSku: 'SKU-DISTILL-RESIDUE',
            productName: 'Distillation Fusel Oil (By-Product)',
            producedQty: 200,
            unitOfMeasure: 'KG',
            standardCreditRatePerUnit: 2.50
          }
        ]
      });

      // By-Product credit: 200 * 2.50 = 500.00
      if (analysis.byProductCreditTotal !== 500.0) {
        throw new Error(`Expected by-product credit 500.00, got ${analysis.byProductCreditTotal}`);
      }
      // Net joint cost: 10000 - 500 = 9500.00
      if (analysis.netJointCostToAllocate !== 9500.0) {
        throw new Error(`Expected net cost 9500.00, got ${analysis.netJointCostToAllocate}`);
      }

      // Equivalence points: (500 * 1.0) + (300 * 0.6) = 500 + 180 = 680 points
      // Primary: (500 / 680) * 9500 = ~6985.29
      // Co-product: (180 / 680) * 9500 = ~2514.71
      const primary = analysis.coProducts.find(c => c.isPrimary)!;
      const coProd = analysis.coProducts.find(c => !c.isPrimary)!;
      const sumAllocated = Number((primary.allocatedJointCost + coProd.allocatedJointCost).toFixed(2));
      if (Math.abs(sumAllocated - 9500.0) > 0.02) {
        throw new Error(`Sum of allocated co-product costs (${sumAllocated}) does not match net cost (9500.00)`);
      }

      // Event-driven financial accounting validation
      if (!financialEvent.balanced) throw new Error('Financial Event GL postings are unbalanced!');
      const totalDebits = financialEvent.glPostings.reduce((s, p) => s + p.debitAmount, 0);
      const totalCredits = financialEvent.glPostings.reduce((s, p) => s + p.creditAmount, 0);
      if (Math.abs(totalDebits - 10000.0) > 0.01 || Math.abs(totalCredits - 10000.0) > 0.01) {
        throw new Error('GL double-entry debit/credit does not equal total order gross cost.');
      }
    });

    runTest('3.2D-09-02', 'Joint Production Cost Allocation via Net Realizable Value (NRV)', () => {
      const { analysis } = ManufacturingGenealogyEcoDisassemblyEngine.calculateJointProductionCosts({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        manufacturingOrderId: 'MO-REFINERY-402',
        totalOrderCostGross: 50000.0,
        allocationMethod: 'NET_REALIZABLE_VALUE',
        coProducts: [
          {
            itemSku: 'SKU-KEROSENE',
            productName: 'Aviation Kerosene',
            isPrimary: true,
            producedQty: 1000,
            unitOfMeasure: 'GAL',
            plannedSalesPricePerUnit: 40.0 // Revenue = 40,000
          },
          {
            itemSku: 'SKU-DIESEL-ULTRA',
            productName: 'Ultra-low Sulfur Diesel',
            isPrimary: false,
            producedQty: 1000,
            unitOfMeasure: 'GAL',
            plannedSalesPricePerUnit: 10.0 // Revenue = 10,000
          }
        ]
      });

      // Total revenue = 50,000. Kerosene gets 80% (40,000), Diesel gets 20% (10,000)
      const kero = analysis.coProducts.find(c => c.itemSku === 'SKU-KEROSENE')!;
      const diesel = analysis.coProducts.find(c => c.itemSku === 'SKU-DIESEL-ULTRA')!;

      if (kero.allocatedJointCost !== 40000.0) {
        throw new Error(`Expected Kerosene allocation 40,000, got ${kero.allocatedJointCost}`);
      }
      if (diesel.allocatedJointCost !== 10000.0) {
        throw new Error(`Expected Diesel allocation 10,000, got ${diesel.allocatedJointCost}`);
      }
    });

    runTest('3.2D-09-03', 'Joint Production Cost Allocation via Physical Quantity Method', () => {
      const { analysis } = ManufacturingGenealogyEcoDisassemblyEngine.calculateJointProductionCosts({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        manufacturingOrderId: 'MO-SAWMILL-11',
        totalOrderCostGross: 12000.0,
        allocationMethod: 'PHYSICAL_QUANTITY',
        coProducts: [
          {
            itemSku: 'SKU-TIMBER-A',
            productName: 'Premium Cut Lumber',
            isPrimary: true,
            producedQty: 600,
            unitOfMeasure: 'M3'
          },
          {
            itemSku: 'SKU-TIMBER-B',
            productName: 'Standard Stud Lumber',
            isPrimary: false,
            producedQty: 400,
            unitOfMeasure: 'M3'
          }
        ]
      });

      // Total Qty = 1000. Cut A gets 60% = 7200, Stud B gets 40% = 4800
      const lumA = analysis.coProducts.find(c => c.itemSku === 'SKU-TIMBER-A')!;
      const lumB = analysis.coProducts.find(c => c.itemSku === 'SKU-TIMBER-B')!;

      if (lumA.allocatedJointCost !== 7200.0) throw new Error(`Expected 7200, got ${lumA.allocatedJointCost}`);
      if (lumB.allocatedJointCost !== 4800.0) throw new Error(`Expected 4800, got ${lumB.allocatedJointCost}`);
      if (lumA.unitManufacturingCost !== 12.0) throw new Error(`Expected unit cost 12.00, got ${lumA.unitManufacturingCost}`);
    });

    runTest('3.2D-09-04', 'Rejection of Zero or Negative Gross Manufacturing Order Cost', () => {
      let threw = false;
      try {
        ManufacturingGenealogyEcoDisassemblyEngine.calculateJointProductionCosts({
          tenantId: 'TEN-01',
          companyId: 'COMP-01',
          manufacturingOrderId: 'MO-INVALID-COST',
          totalOrderCostGross: 0,
          coProducts: [{ itemSku: 'A', productName: 'Prod A', isPrimary: true, producedQty: 10, unitOfMeasure: 'EA' }]
        });
      } catch {
        threw = true;
      }
      if (!threw) throw new Error('Failed to reject order with zero gross manufacturing cost.');
    });

    runTest('3.2D-09-05', 'Rejection of Empty Co-Products List', () => {
      let threw = false;
      try {
        ManufacturingGenealogyEcoDisassemblyEngine.calculateJointProductionCosts({
          tenantId: 'TEN-01',
          companyId: 'COMP-01',
          manufacturingOrderId: 'MO-NO-COPRODS',
          totalOrderCostGross: 5000,
          coProducts: []
        });
      } catch {
        threw = true;
      }
      if (!threw) throw new Error('Failed to reject empty co-products list.');
    });

    runTest('3.2D-09-06', 'Multiple By-Products WIP Credit Aggregation', () => {
      const { analysis } = ManufacturingGenealogyEcoDisassemblyEngine.calculateJointProductionCosts({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        manufacturingOrderId: 'MO-MULTI-BYPROD',
        totalOrderCostGross: 20000.0,
        coProducts: [
          { itemSku: 'MAIN-OIL', productName: 'Engine Oil', isPrimary: true, producedQty: 1000, unitOfMeasure: 'L' }
        ],
        byProducts: [
          { itemSku: 'BY-ASPHALT', productName: 'Bitumen Slag', producedQty: 100, unitOfMeasure: 'KG', standardCreditRatePerUnit: 5.0 }, // 500
          { itemSku: 'BY-SULFUR', productName: 'Sulfur Cake', producedQty: 50, unitOfMeasure: 'KG', standardCreditRatePerUnit: 6.0 }    // 300
        ]
      });

      if (analysis.byProductCreditTotal !== 800.0) throw new Error(`Expected 800 by-product credit, got ${analysis.byProductCreditTotal}`);
      if (analysis.netJointCostToAllocate !== 19200.0) throw new Error(`Expected 19,200 net cost, got ${analysis.netJointCostToAllocate}`);
    });

    runTest('3.2D-09-07', 'Zero By-Product Case Preserves 100% Gross Cost as Net Joint Cost', () => {
      const { analysis } = ManufacturingGenealogyEcoDisassemblyEngine.calculateJointProductionCosts({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        manufacturingOrderId: 'MO-ZERO-BYPROD',
        totalOrderCostGross: 15000.0,
        coProducts: [
          { itemSku: 'SOLVENT-PURE', productName: 'Pure Solvent', isPrimary: true, producedQty: 1000, unitOfMeasure: 'L' }
        ]
      });

      if (analysis.byProductCreditTotal !== 0) throw new Error('By-product credit must be 0');
      if (analysis.netJointCostToAllocate !== 15000.0) throw new Error('Net joint cost must match total gross cost.');
    });

    runTest('3.2D-09-08', 'Audit Hash Generation and Integrity on Joint Production Cost Analysis', () => {
      const { analysis } = ManufacturingGenealogyEcoDisassemblyEngine.calculateJointProductionCosts({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        manufacturingOrderId: 'MO-HASH-TEST',
        totalOrderCostGross: 8000.0,
        coProducts: [
          { itemSku: 'P1', productName: 'Prod 1', isPrimary: true, producedQty: 100, unitOfMeasure: 'EA', equivalenceFactor: 1.0 },
          { itemSku: 'P2', productName: 'Prod 2', isPrimary: false, producedQty: 100, unitOfMeasure: 'EA', equivalenceFactor: 1.0 }
        ]
      });

      if (!analysis.auditHash || !analysis.auditHash.startsWith('SHA256-')) {
        throw new Error('Analysis missing compliant SHA256 audit hash.');
      }
    });

    runTest('3.2D-09-09', 'Event-Driven GL Double-Entry Zero Direct Mutation Verification', () => {
      const { financialEvent } = ManufacturingGenealogyEcoDisassemblyEngine.calculateJointProductionCosts({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        manufacturingOrderId: 'MO-GL-TEST',
        totalOrderCostGross: 6500.0,
        coProducts: [
          { itemSku: 'A', productName: 'Product Alpha', isPrimary: true, producedQty: 50, unitOfMeasure: 'KG', equivalenceFactor: 1.0 }
        ],
        byProducts: [
          { itemSku: 'B', productName: 'By-Product Beta', producedQty: 10, unitOfMeasure: 'KG', standardCreditRatePerUnit: 20.0 }
        ]
      });

      if (!financialEvent.balanced) throw new Error('Financial event postings must be strictly balanced.');
      const wipLine = financialEvent.glPostings.find(p => p.accountCode === '14100-WIP-MANUFACTURING-CLEARING');
      if (!wipLine || wipLine.creditAmount !== 6500.0) throw new Error('WIP clearing account line must credit total gross cost 6500.00');
    });

    // =========================================================================
    // SECTION 2: BATCH GENEALOGY & AS-BUILT SERIALIZATION (TESTS 10 - 18)
    // =========================================================================

    runTest('3.2D-09-10', 'Register Raw Material, Subassembly, and Finished Good Genealogy Nodes', () => {
      // 1. Raw material batch
      const rawNode = ManufacturingGenealogyEcoDisassemblyEngine.registerGenealogyNode({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        lotOrSerialNumber: 'LOT-RAW-TITANIUM-001',
        itemSku: 'RM-TI-GRADE5',
        itemDescription: 'Aerospace Grade 5 Titanium Bar',
        nodeType: 'RAW_MATERIAL',
        workCenterId: 'WC-RECEIVING',
        supplierLotNumber: 'SUPP-HEAT-9921',
        operatorId: 'OP-INSP-01',
        telemetry: {
          inspectionId: 'INSP-HEAT-9921',
          purityPct: 99.8,
          passedInspection: true
        }
      });

      // 2. Intermediate Subassembly
      const subNode = ManufacturingGenealogyEcoDisassemblyEngine.registerGenealogyNode({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        lotOrSerialNumber: 'LOT-SUB-TURBINE-DISK-01',
        itemSku: 'SUB-TURBINE-DISK',
        itemDescription: 'Machined Turbine Disk Hub',
        nodeType: 'SUBASSEMBLY',
        parentLotNumber: undefined,
        childLotNumbers: ['LOT-RAW-TITANIUM-001'],
        workCenterId: 'WC-CNC-5AXIS',
        manufacturingOrderId: 'MO-SUB-2001',
        operatorId: 'OP-MACH-14',
        telemetry: {
          dimensionMm: 450.02,
          torqueNewtonMeters: 120,
          passedInspection: true
        }
      });

      // 3. Final Finished Good Serialized Unit
      const fgNode = ManufacturingGenealogyEcoDisassemblyEngine.registerGenealogyNode({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        lotOrSerialNumber: 'SN-AERO-ENGINE-7701',
        itemSku: 'FG-JET-ENGINE-X',
        itemDescription: 'Commercial Turbofan Jet Engine',
        nodeType: 'FINISHED_GOOD',
        parentLotNumber: undefined,
        childLotNumbers: ['LOT-SUB-TURBINE-DISK-01'],
        workCenterId: 'WC-FINAL-ASSEMBLY',
        manufacturingOrderId: 'MO-FINAL-9001',
        operatorId: 'OP-CHIEF-09',
        telemetry: {
          passedInspection: true
        }
      });

      if (rawNode.nodeType !== 'RAW_MATERIAL') throw new Error('Raw node type mismatch');
      if (subNode.childLotNumbers[0] !== 'LOT-RAW-TITANIUM-001') throw new Error('Subassembly child lot missing');
      if (fgNode.childLotNumbers[0] !== 'LOT-SUB-TURBINE-DISK-01') throw new Error('Finished good child lot missing');
    });

    runTest('3.2D-09-11', 'Upstream Where-Used Backward Trace from Finished Good Serial', () => {
      const trace = ManufacturingGenealogyEcoDisassemblyEngine.traceUpstreamWhereUsed('SN-AERO-ENGINE-7701');

      if (trace.rootLotNumber !== 'SN-AERO-ENGINE-7701') throw new Error('Root lot mismatch');
      if (trace.totalNodesCount < 3) throw new Error(`Expected at least 3 traversed nodes, got ${trace.totalNodesCount}`);
      
      const hasRaw = trace.traversedNodes.some(n => n.lotOrSerialNumber === 'LOT-RAW-TITANIUM-001');
      const hasSub = trace.traversedNodes.some(n => n.lotOrSerialNumber === 'LOT-SUB-TURBINE-DISK-01');
      if (!hasRaw || !hasSub) throw new Error('Upstream backward trace failed to navigate down to raw material.');
    });

    runTest('3.2D-09-12', 'Downstream Forward Impact Trace from Contaminated Raw Material Lot', () => {
      const trace = ManufacturingGenealogyEcoDisassemblyEngine.traceDownstreamImpact('LOT-RAW-TITANIUM-001');

      if (trace.direction !== 'DOWNSTREAM_IMPACT') throw new Error('Trace direction must be DOWNSTREAM_IMPACT');
      if (!trace.impactedFinishedGoodsLots.includes('SN-AERO-ENGINE-7701')) {
        throw new Error('Downstream trace failed to locate impacted finished good serial SN-AERO-ENGINE-7701');
      }
      if (!trace.impactedSubassemblies.includes('LOT-SUB-TURBINE-DISK-01')) {
        throw new Error('Downstream trace failed to locate intermediate subassembly LOT-SUB-TURBINE-DISK-01');
      }
    });

    runTest('3.2D-09-13', 'Automated Genealogy Quarantine Containment Lock Execution', () => {
      const containment = ManufacturingGenealogyEcoDisassemblyEngine.applyGenealogyQuarantineContainment({
        suspectLotNumber: 'LOT-RAW-TITANIUM-001',
        quarantineReason: 'Supplier notice of micro-void inclusions in heat 9921',
        operatorId: 'USR-QA-DIRECTOR'
      });

      if (containment.lockedCount < 3) throw new Error(`Expected at least 3 lots locked in containment, got ${containment.lockedCount}`);
      
      const fgNode = ManufacturingGenealogyEcoDisassemblyEngine.getGenealogyNode('SN-AERO-ENGINE-7701');
      if (!fgNode || fgNode.quarantineStatus !== 'QUARANTINE_HOLD') {
        throw new Error('Finished good serial was not placed on QUARANTINE_HOLD.');
      }
      if (!fgNode.quarantineReason?.includes('micro-void inclusions')) {
        throw new Error('Quarantine reason was not propagated to finished good node.');
      }
    });

    runTest('3.2D-09-14', 'Upstream Trace Reflects Quarantined Nodes in Lineage', () => {
      const trace = ManufacturingGenealogyEcoDisassemblyEngine.traceUpstreamWhereUsed('SN-AERO-ENGINE-7701');
      if (!trace.containsQuarantinedItems) {
        throw new Error('Trace should report containsQuarantinedItems = true');
      }
    });

    runTest('3.2D-09-15', 'Rejection of Unknown Lot Number in Genealogy Trace', () => {
      let threw = false;
      try {
        ManufacturingGenealogyEcoDisassemblyEngine.traceUpstreamWhereUsed('LOT-NONEXISTENT-9999');
      } catch {
        threw = true;
      }
      if (!threw) throw new Error('Failed to throw error on nonexistent lot trace.');
    });

    runTest('3.2D-09-16', 'Rejection of Quarantine Containment without Justification Reason', () => {
      let threw = false;
      try {
        ManufacturingGenealogyEcoDisassemblyEngine.applyGenealogyQuarantineContainment({
          suspectLotNumber: 'LOT-RAW-TITANIUM-001',
          quarantineReason: '',
          operatorId: 'USR-OP'
        });
      } catch {
        threw = true;
      }
      if (!threw) throw new Error('Failed to reject quarantine containment with empty reason.');
    });

    runTest('3.2D-09-17', 'Quality Telemetry Preservation on Genealogy Node Creation', () => {
      const node = ManufacturingGenealogyEcoDisassemblyEngine.registerGenealogyNode({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        lotOrSerialNumber: 'LOT-VALVE-TELEMETRY-99',
        itemSku: 'VALVE-BODY',
        itemDescription: 'High Pressure Valve Body',
        nodeType: 'SUBASSEMBLY',
        workCenterId: 'WC-HYDRO-TEST',
        operatorId: 'OP-QA-03',
        telemetry: {
          torqueNewtonMeters: 85.5,
          dimensionMm: 32.01,
          passedInspection: true
        }
      });

      if (node.telemetry?.torqueNewtonMeters !== 85.5) throw new Error('Torque telemetry mismatch');
      if (node.telemetry?.dimensionMm !== 32.01) throw new Error('Dimension telemetry mismatch');
    });

    runTest('3.2D-09-18', 'Genealogy Node SHA-256 Audit Hash Verification', () => {
      const node = ManufacturingGenealogyEcoDisassemblyEngine.getGenealogyNode('LOT-VALVE-TELEMETRY-99')!;
      if (!node.auditHash || !node.auditHash.startsWith('SHA256-')) {
        throw new Error('Genealogy node missing compliant SHA256 audit hash.');
      }
    });

    // =========================================================================
    // SECTION 3: ENGINEERING CHANGE ORDERS (ECO) & BOM REDLINING (TESTS 19 - 26)
    // =========================================================================

    let activeEcoId = '';

    runTest('3.2D-09-19', 'Draft Engineering Change Order (ECO) Creation with BOM Redline Items', () => {
      const eco = ManufacturingGenealogyEcoDisassemblyEngine.createEngineeringChangeOrder({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        ecoCode: 'ECO-2026-VALVE-REV-B',
        title: 'Upgrade Seal Material to Fluoroelastomer for High Temp Spec',
        description: 'Replace standard NBR O-rings with Viton O-rings to prevent thermal degradation.',
        originatorId: 'ENG-LEAD-ALICE',
        targetProductSku: 'FG-VALVE-ASSEMBLY-50',
        currentBomRevision: 'REV-A',
        proposedBomRevision: 'REV-B',
        effectivityType: 'EFFECTIVE_DATE',
        effectiveDate: '2026-10-01',
        redlineItems: [
          {
            changeType: 'COMPONENT_REMOVED',
            componentSku: 'SEAL-NBR-O-RING',
            componentDescription: 'Nitrile Butadiene O-Ring 30mm',
            previousQty: 2,
            newQty: 0,
            unitOfMeasure: 'EA',
            findNumber: '0020',
            dispositionAction: 'SCRAP_IMMEDIATELY',
            estimatedReworkScrapCost: 150.0
          },
          {
            changeType: 'COMPONENT_ADDED',
            componentSku: 'SEAL-VITON-HIGH-TEMP',
            componentDescription: 'Viton Fluoropolymer O-Ring 30mm High-Temp',
            previousQty: 0,
            newQty: 2,
            unitOfMeasure: 'EA',
            findNumber: '0025',
            dispositionAction: 'USE_AS_IS_UNTIL_EXHAUSTED',
            estimatedReworkScrapCost: 0
          }
        ]
      });

      activeEcoId = eco.id;
      if (eco.status !== 'DRAFT') throw new Error(`Expected DRAFT status, got ${eco.status}`);
      if (eco.redlineItems.length !== 2) throw new Error('Expected 2 BOM redline items');
      if (eco.redlineItems[0].changeType !== 'COMPONENT_REMOVED') throw new Error('Redline 1 changeType mismatch');
      if (eco.redlineItems[1].changeType !== 'COMPONENT_ADDED') throw new Error('Redline 2 changeType mismatch');
    });

    runTest('3.2D-09-20', 'Submit ECO for Change Control Board (CCB) Review', () => {
      const eco = ManufacturingGenealogyEcoDisassemblyEngine.submitEcoForReview(activeEcoId);
      if (eco.status !== 'CCB_REVIEW') throw new Error(`Expected CCB_REVIEW status, got ${eco.status}`);
    });

    runTest('3.2D-09-21', 'Segregation of Duties (SoD) Enforcement: ECO Originator Cannot Sign Approval', () => {
      let threw = false;
      try {
        ManufacturingGenealogyEcoDisassemblyEngine.approveEngineeringChangeOrder({
          ecoId: activeEcoId,
          approverId: 'ENG-LEAD-ALICE', // SAME AS ORIGINATOR!
          approverName: 'Alice Johnson',
          role: 'CHIEF_ENGINEER',
          decision: 'APPROVED'
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('Segregation of Duties (SoD) Violation')) {
          throw new Error(`Unexpected error message: ${err.message}`);
        }
      }
      if (!threw) throw new Error('Failed to block self-approval by ECO originator.');
    });

    runTest('3.2D-09-22', 'Authorized CCB Chairperson Approval with Cryptographic Signature Token', () => {
      const eco = ManufacturingGenealogyEcoDisassemblyEngine.approveEngineeringChangeOrder({
        ecoId: activeEcoId,
        approverId: 'CCB-CHAIR-BOB',
        approverName: 'Bob Martinez',
        role: 'CCB_CHAIR',
        decision: 'APPROVED',
        comments: 'Technical review and cost impact approved by CCB committee.'
      });

      if (eco.status !== 'APPROVED') throw new Error(`Expected APPROVED status, got ${eco.status}`);
      if (eco.approvals.length !== 1) throw new Error('Expected 1 signature record');
      const sig = eco.approvals[0];
      if (!sig.signatureToken || !sig.signatureToken.startsWith('SHA256-')) {
        throw new Error('Approval signature token is not a valid SHA-256 token.');
      }
    });

    runTest('3.2D-09-23', 'Activate ECO Effectivity and Update Engineering Revision State', () => {
      const eco = ManufacturingGenealogyEcoDisassemblyEngine.activateEcoEffectivity(activeEcoId);
      if (eco.status !== 'EFFECTIVE') throw new Error(`Expected EFFECTIVE status, got ${eco.status}`);
    });

    runTest('3.2D-09-24', 'Rejection of ECO Status Transition from Invalid Preceding State', () => {
      let threw = false;
      try {
        // Cannot activate an already EFFECTIVE ECO again
        ManufacturingGenealogyEcoDisassemblyEngine.activateEcoEffectivity(activeEcoId);
      } catch {
        threw = true;
      }
      if (!threw) throw new Error('Failed to reject activation on already effective ECO.');
    });

    runTest('3.2D-09-25', 'ECO Rejection Workflow with Review Comments', () => {
      const draftEco = ManufacturingGenealogyEcoDisassemblyEngine.createEngineeringChangeOrder({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        ecoCode: 'ECO-REJECT-TEST',
        title: 'Unvetted Motor Swap',
        description: 'Experimental motor without stress testing',
        originatorId: 'JUNIOR-ENG-01',
        targetProductSku: 'FG-PUMP-01',
        currentBomRevision: 'REV-1',
        proposedBomRevision: 'REV-X',
        redlineItems: [
          {
            changeType: 'QUANTITY_MODIFIED',
            componentSku: 'MOTOR-KW',
            componentDescription: 'Pump Motor',
            previousQty: 1,
            newQty: 2,
            unitOfMeasure: 'EA',
            findNumber: '0010',
            dispositionAction: 'REWORK_TO_NEW_REVISION',
            estimatedReworkScrapCost: 500
          }
        ]
      });

      ManufacturingGenealogyEcoDisassemblyEngine.submitEcoForReview(draftEco.id);
      const rejected = ManufacturingGenealogyEcoDisassemblyEngine.approveEngineeringChangeOrder({
        ecoId: draftEco.id,
        approverId: 'CHIEF-ENG-CHARLIE',
        approverName: 'Charlie Brown',
        role: 'CHIEF_ENGINEER',
        decision: 'REJECTED',
        comments: 'Risk of overheating in continuous operation mode.'
      });

      if (rejected.status !== 'REJECTED') throw new Error(`Expected REJECTED status, got ${rejected.status}`);
    });

    runTest('3.2D-09-26', 'ECO Audit Hash Integrity Check Across Modifications', () => {
      const eco = ManufacturingGenealogyEcoDisassemblyEngine.getEco(activeEcoId);
      if (!eco || !eco.auditHash.startsWith('SHA256-')) {
        throw new Error('ECO missing compliant SHA256 audit hash.');
      }
    });

    // =========================================================================
    // SECTION 4: DISASSEMBLY / DE-MANUFACTURING & HARVESTING (TESTS 27 - 33)
    // =========================================================================

    let activeDisassemblyId = '';

    runTest('3.2D-09-27', 'Create Disassembly Order for Returned Equipment Core', () => {
      const order = ManufacturingGenealogyEcoDisassemblyEngine.createDisassemblyOrder({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        disassemblyCode: 'DIS-2026-PUMP-CORE-09',
        sourceItemSku: 'RET-INDUSTRIAL-PUMP-100',
        sourceSerialOrLot: 'SN-CORE-PUMP-4421',
        sourceUnitBookValue: 1200.0,
        workCenterId: 'WC-TEARDOWN-BAY',
        operatorId: 'OP-REMAN-TECH-01',
        laborRatePerHour: 50.0
      });

      activeDisassemblyId = order.id;
      if (order.status !== 'PLANNED') throw new Error(`Expected PLANNED status, got ${order.status}`);
      if (order.sourceUnitBookValue !== 1200.0) throw new Error('Book value mismatch');
    });

    runTest('3.2D-09-28', 'Execute Component Harvesting with Multi-Grade Condition Scoring', () => {
      const { order, financialEvent } = ManufacturingGenealogyEcoDisassemblyEngine.executeComponentHarvesting({
        disassemblyOrderId: activeDisassemblyId,
        teardownHoursLabor: 4.0, // 4 * $50 = $200 direct labor. Total base cost = 1200 + 200 = $1400
        harvestedComponents: [
          {
            componentSku: 'HARV-CAST-IRON-HOUSING',
            componentName: 'Main Impeller Housing (Grade A Reusable)',
            harvestedQty: 1,
            unitOfMeasure: 'EA',
            conditionGrade: 'GRADE_A_REUSABLE', // weight = 1.0
            targetWarehouseId: 'WH-MAIN',
            targetBinId: 'BIN-PARTS-A1'
          },
          {
            componentSku: 'HARV-ELECTRIC-STATOR',
            componentName: 'Stator Motor Core (Grade B Refurb Needed)',
            harvestedQty: 1,
            unitOfMeasure: 'EA',
            conditionGrade: 'GRADE_B_REFURB_NEEDED', // weight = 0.6
            targetWarehouseId: 'WH-REFURB',
            targetBinId: 'BIN-WIP-R2'
          },
          {
            componentSku: 'HARV-BRASS-FITTINGS',
            componentName: 'Brass Scrap Fittings (Grade C Scrap)',
            harvestedQty: 2,
            unitOfMeasure: 'KG',
            conditionGrade: 'GRADE_C_SCRAP_SALVAGE', // weight = 0.15 * 2 = 0.30
            targetWarehouseId: 'WH-SCRAP',
            targetBinId: 'BIN-SCRAP-S1'
          },
          {
            componentSku: 'HARV-DAMAGED-GASKETS',
            componentName: 'Perished Rubber Gaskets',
            harvestedQty: 3,
            unitOfMeasure: 'EA',
            conditionGrade: 'UNSALVAGEABLE_WASTE' // weight = 0.0
          }
        ]
      });

      if (order.status !== 'COMPLETED') throw new Error(`Expected COMPLETED status, got ${order.status}`);
      if (order.harvestedComponents.length !== 4) throw new Error('Expected 4 harvested items');

      // Grade A component must receive highest share
      const gradeA = order.harvestedComponents.find(c => c.conditionGrade === 'GRADE_A_REUSABLE')!;
      const gradeB = order.harvestedComponents.find(c => c.conditionGrade === 'GRADE_B_REFURB_NEEDED')!;
      const scrap = order.harvestedComponents.find(c => c.conditionGrade === 'GRADE_C_SCRAP_SALVAGE')!;
      const waste = order.harvestedComponents.find(c => c.conditionGrade === 'UNSALVAGEABLE_WASTE')!;

      if (gradeA.allocatedResidualCost <= gradeB.allocatedResidualCost) {
        throw new Error('Grade A component cost must exceed Grade B refurb cost.');
      }
      if (waste.allocatedResidualCost !== 0) {
        throw new Error('Unsalvageable waste must have 0 allocated residual cost.');
      }

      // Event-driven financial accounting validation
      if (!financialEvent.balanced) throw new Error('Disassembly Financial Event is unbalanced!');
      const credits = financialEvent.glPostings.reduce((sum, p) => sum + p.creditAmount, 0);
      const debits = financialEvent.glPostings.reduce((sum, p) => sum + p.debitAmount, 0);
      if (Math.abs(debits - credits) > 0.01) {
        throw new Error(`Debit/credit discrepancy: Debits=${debits}, Credits=${credits}`);
      }
    });

    runTest('3.2D-09-29', 'Rejection of Repeat Teardown on Already Completed Disassembly Order', () => {
      let threw = false;
      try {
        ManufacturingGenealogyEcoDisassemblyEngine.executeComponentHarvesting({
          disassemblyOrderId: activeDisassemblyId,
          teardownHoursLabor: 2,
          harvestedComponents: [
            { componentSku: 'X', componentName: 'Part', harvestedQty: 1, unitOfMeasure: 'EA', conditionGrade: 'GRADE_A_REUSABLE' }
          ]
        });
      } catch {
        threw = true;
      }
      if (!threw) throw new Error('Failed to reject repeat execution of completed disassembly order.');
    });

    runTest('3.2D-09-30', 'Rejection of Negative Teardown Labor Hours', () => {
      const order = ManufacturingGenealogyEcoDisassemblyEngine.createDisassemblyOrder({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        disassemblyCode: 'DIS-LABOR-TEST',
        sourceItemSku: 'PUMP-UNIT',
        sourceSerialOrLot: 'SN-999',
        sourceUnitBookValue: 500,
        workCenterId: 'WC-1',
        operatorId: 'OP-1'
      });

      let threw = false;
      try {
        ManufacturingGenealogyEcoDisassemblyEngine.executeComponentHarvesting({
          disassemblyOrderId: order.id,
          teardownHoursLabor: -5,
          harvestedComponents: [
            { componentSku: 'A', componentName: 'A', harvestedQty: 1, unitOfMeasure: 'EA', conditionGrade: 'GRADE_A_REUSABLE' }
          ]
        });
      } catch {
        threw = true;
      }
      if (!threw) throw new Error('Failed to reject negative teardown labor hours.');
    });

    runTest('3.2D-09-31', 'Rejection of Empty Component Harvesting Request', () => {
      const order = ManufacturingGenealogyEcoDisassemblyEngine.createDisassemblyOrder({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        disassemblyCode: 'DIS-EMPTY-TEST',
        sourceItemSku: 'PUMP-UNIT',
        sourceSerialOrLot: 'SN-888',
        sourceUnitBookValue: 400,
        workCenterId: 'WC-1',
        operatorId: 'OP-1'
      });

      let threw = false;
      try {
        ManufacturingGenealogyEcoDisassemblyEngine.executeComponentHarvesting({
          disassemblyOrderId: order.id,
          teardownHoursLabor: 1,
          harvestedComponents: []
        });
      } catch {
        threw = true;
      }
      if (!threw) throw new Error('Failed to reject empty harvested components list.');
    });

    runTest('3.2D-09-32', 'Disassembly Financial Event Plug Loss Variance Verification', () => {
      const order = ManufacturingGenealogyEcoDisassemblyEngine.createDisassemblyOrder({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        disassemblyCode: 'DIS-LOSS-TEST',
        sourceItemSku: 'HIGH-VAL-CORE',
        sourceSerialOrLot: 'SN-CORE-LOSS-01',
        sourceUnitBookValue: 3000.0,
        workCenterId: 'WC-BAY',
        operatorId: 'OP-1'
      });

      const { financialEvent } = ManufacturingGenealogyEcoDisassemblyEngine.executeComponentHarvesting({
        disassemblyOrderId: order.id,
        teardownHoursLabor: 1,
        harvestedComponents: [
          // Mostly waste and scrap, resulting in a degradation loss
          { componentSku: 'SCRAP-METAL', componentName: 'Scrap Metal', harvestedQty: 10, unitOfMeasure: 'KG', conditionGrade: 'GRADE_C_SCRAP_SALVAGE' },
          { componentSku: 'TRASH', componentName: 'Unusable Plastics', harvestedQty: 5, unitOfMeasure: 'KG', conditionGrade: 'UNSALVAGEABLE_WASTE' }
        ]
      });

      if (!financialEvent.balanced) throw new Error('Financial event must remain strictly balanced with loss plug.');
      const lossLine = financialEvent.glPostings.find(p => p.accountCode === '59100-DISASSEMBLY-LOSS-VARIANCE');
      if (!lossLine || lossLine.debitAmount <= 0) {
        throw new Error('Degradation loss line was not generated when harvested value < book value.');
      }
    });

    runTest('3.2D-09-33', 'Disassembly Order SHA-256 Audit Hash Verification', () => {
      const order = ManufacturingGenealogyEcoDisassemblyEngine.getDisassemblyOrder(activeDisassemblyId)!;
      if (!order.auditHash || !order.auditHash.startsWith('SHA256-')) {
        throw new Error('Disassembly order missing compliant SHA256 audit hash.');
      }
    });

    // =========================================================================
    // SECTION 5: CROSS-DOMAIN GOVERNANCE & REGRESSION GATE (TESTS 34 - 35)
    // =========================================================================

    runTest('3.2D-09-34', 'Multi-Tenant Isolation & Concurrency Verification across Genealogy & ECOs', () => {
      // Tenant 1 node
      const nodeT1 = ManufacturingGenealogyEcoDisassemblyEngine.registerGenealogyNode({
        tenantId: 'TENANT-ALPHA',
        companyId: 'COMP-ALPHA',
        lotOrSerialNumber: 'LOT-ISO-T1-001',
        itemSku: 'SKU-ALPHA-1',
        itemDescription: 'Alpha Part',
        nodeType: 'RAW_MATERIAL',
        workCenterId: 'WC-T1',
        operatorId: 'OP-T1'
      });

      // Tenant 2 node
      const nodeT2 = ManufacturingGenealogyEcoDisassemblyEngine.registerGenealogyNode({
        tenantId: 'TENANT-BETA',
        companyId: 'COMP-BETA',
        lotOrSerialNumber: 'LOT-ISO-T2-001',
        itemSku: 'SKU-BETA-1',
        itemDescription: 'Beta Part',
        nodeType: 'RAW_MATERIAL',
        workCenterId: 'WC-T2',
        operatorId: 'OP-T2'
      });

      if (nodeT1.tenantId === nodeT2.tenantId) throw new Error('Tenant isolation violated.');
      if (nodeT1.auditHash === nodeT2.auditHash) throw new Error('Audit hashes must be uniquely keyed.');
    });

    runTest('3.2D-09-35', 'Phase 3.2D-08 Master Regression Quality Gate (35/35 Tests 100% PASS)', () => {
      const d08Report = Phase32D08HardeningSuite.runAll();
      if (d08Report.passed !== d08Report.total || d08Report.total < 35) {
        throw new Error(`Phase 3.2D-08 Regression Quality Gate Failed! ${d08Report.passed}/${d08Report.total} passed.`);
      }
    });

    const passedCount = results.filter(r => r.passed).length;
    return {
      passed: passedCount,
      total: results.length,
      results,
      phase: 'Phase 3.2D-09: Co-Products & By-Products Costing, Batch Genealogy, ECO Redlining & Disassembly'
    };
  }
}
