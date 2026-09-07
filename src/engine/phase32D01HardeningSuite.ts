/**
 * AM Enterprise ERP — Phase 3.2D-01 Hardening Suite
 * 30+ Verification Tests for Discrete Manufacturing, BOM, Routings,
 * Production Work Orders, Shop Floor Execution, WIP/Variance Accounting & MRP.
 */

import { ManufacturingEngine } from './manufacturingEngine';
import { BillOfMaterials, WorkCenter, Routing, ProductionWorkOrder } from '../types/manufacturing';

export interface HardeningTestResult {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

export class Phase32D01HardeningSuite {
  public static runAll(): {
    total: number;
    passed: number;
    failed: number;
    results: HardeningTestResult[];
  } {
    const results: HardeningTestResult[] = [];

    const runTest = (id: string, name: string, category: string, fn: () => void) => {
      const start = performance.now();
      try {
        fn();
        results.push({
          id,
          name,
          category,
          passed: true,
          durationMs: Number((performance.now() - start).toFixed(2))
        });
      } catch (err: any) {
        results.push({
          id,
          name,
          category,
          passed: false,
          message: err?.message || String(err),
          durationMs: Number((performance.now() - start).toFixed(2))
        });
      }
    };

    // Fixture Setup
    const tenantId = 'tenant-am-global';
    const companyId = 'comp-cairo-mfg';

    // ----------------------------------------------------
    // CATEGORY 1: BILL OF MATERIALS (BOM) & CYCLE GUARDS
    // ----------------------------------------------------

    runTest('P32D-01-01', 'Create valid Bill of Materials with components', 'BOM Governance', () => {
      const bom = ManufacturingEngine.createBOM({
        tenantId,
        companyId,
        bomNumber: 'BOM-PUMP-001',
        finishedGoodSku: 'FG-IND-PUMP-100',
        finishedGoodName: 'Industrial Centrifugal Pump 100HP',
        baseQuantity: 1,
        uom: 'EA',
        effectiveFrom: '2026-01-01',
        createdBy: 'user-planner-01',
        components: [
          {
            componentId: 'c1',
            sku: 'RAW-STEEL-CASING',
            description: 'Heavy Cast Iron Pump Casing',
            componentType: 'RAW_MATERIAL',
            quantityPerUnit: 1,
            scrapFactorPercent: 0.05, // 5%
            uom: 'EA',
            costPerUnit: 120,
            warehouseId: 'WH-RAW-01'
          },
          {
            componentId: 'c2',
            sku: 'RAW-IMPELLER-BRONZE',
            description: 'Bronze Machined Impeller',
            componentType: 'RAW_MATERIAL',
            quantityPerUnit: 1,
            scrapFactorPercent: 0.02,
            uom: 'EA',
            costPerUnit: 80,
            warehouseId: 'WH-RAW-01'
          }
        ]
      });

      if (bom.status !== 'DRAFT') throw new Error(`Expected DRAFT status, got ${bom.status}`);
      if (bom.components.length !== 2) throw new Error('Expected 2 components');
    });

    runTest('P32D-01-02', 'Reject BOM with duplicate component SKUs', 'BOM Governance', () => {
      let threw = false;
      try {
        ManufacturingEngine.createBOM({
          tenantId,
          companyId,
          bomNumber: 'BOM-DUP-ERR',
          finishedGoodSku: 'FG-TEST',
          finishedGoodName: 'Duplicate Test',
          baseQuantity: 1,
          uom: 'EA',
          effectiveFrom: '2026-01-01',
          createdBy: 'user-planner-01',
          components: [
            {
              componentId: 'c1',
              sku: 'RAW-BOLT-M10',
              description: 'M10 Bolt',
              componentType: 'RAW_MATERIAL',
              quantityPerUnit: 4,
              scrapFactorPercent: 0,
              uom: 'EA',
              costPerUnit: 1,
              warehouseId: 'WH-01'
            },
            {
              componentId: 'c2',
              sku: 'RAW-BOLT-M10', // Duplicate
              description: 'M10 Bolt Duplicate',
              componentType: 'RAW_MATERIAL',
              quantityPerUnit: 2,
              scrapFactorPercent: 0,
              uom: 'EA',
              costPerUnit: 1,
              warehouseId: 'WH-01'
            }
          ]
        });
      } catch {
        threw = true;
      }
      if (!threw) throw new Error('Expected duplicate component SKU rejection');
    });

    runTest('P32D-01-03', 'Enforce Segregation of Duties on BOM Approval', 'BOM Governance', () => {
      const bom = ManufacturingEngine.createBOM({
        tenantId,
        companyId,
        bomNumber: 'BOM-SOD-01',
        finishedGoodSku: 'FG-SOD',
        finishedGoodName: 'SoD Test FG',
        baseQuantity: 1,
        uom: 'EA',
        effectiveFrom: '2026-01-01',
        createdBy: 'user-planner-01',
        components: [
          {
            componentId: 'c1',
            sku: 'RAW-PART-A',
            description: 'Part A',
            componentType: 'RAW_MATERIAL',
            quantityPerUnit: 2,
            scrapFactorPercent: 0,
            uom: 'EA',
            costPerUnit: 10,
            warehouseId: 'WH-01'
          }
        ]
      });

      // Attempt self-approval (must fail)
      let selfApprovalBlocked = false;
      try {
        ManufacturingEngine.approveBOM(bom, 'user-planner-01');
      } catch {
        selfApprovalBlocked = true;
      }
      if (!selfApprovalBlocked) throw new Error('Creator should not be allowed to approve own BOM');

      // Valid supervisor approval
      const approved = ManufacturingEngine.approveBOM(bom, 'supervisor-eng-01');
      if (approved.status !== 'ACTIVE') throw new Error('Approved BOM should have ACTIVE status');
      if (approved.approvedBy !== 'supervisor-eng-01') throw new Error('Invalid approver set');
    });

    runTest('P32D-01-04', 'Multi-level BOM Explosion with scrap factor scaling', 'BOM Explosion', () => {
      const subBOM = ManufacturingEngine.createBOM({
        tenantId,
        companyId,
        bomNumber: 'BOM-SUB-SHAFT',
        finishedGoodSku: 'SUB-ROTOR-SHAFT',
        finishedGoodName: 'Sub-Assembly Rotor Shaft',
        baseQuantity: 1,
        uom: 'EA',
        effectiveFrom: '2026-01-01',
        createdBy: 'user-planner-01',
        status: 'ACTIVE',
        components: [
          {
            componentId: 'c1',
            sku: 'RAW-STEEL-ROD',
            description: 'Forged Steel Rod',
            componentType: 'RAW_MATERIAL',
            quantityPerUnit: 1,
            scrapFactorPercent: 0.1, // 10%
            uom: 'EA',
            costPerUnit: 40,
            warehouseId: 'WH-01'
          }
        ]
      });

      const parentBOM = ManufacturingEngine.createBOM({
        tenantId,
        companyId,
        bomNumber: 'BOM-MAIN-MOTOR',
        finishedGoodSku: 'FG-ELECTRIC-MOTOR',
        finishedGoodName: 'Electric Motor 50kW',
        baseQuantity: 1,
        uom: 'EA',
        effectiveFrom: '2026-01-01',
        createdBy: 'user-planner-01',
        status: 'ACTIVE',
        components: [
          {
            componentId: 'c2',
            sku: 'SUB-ROTOR-SHAFT',
            description: 'Rotor Shaft Subassembly',
            componentType: 'SUB_ASSEMBLY',
            subAssemblyBOMId: subBOM.id,
            quantityPerUnit: 1,
            scrapFactorPercent: 0,
            uom: 'EA',
            costPerUnit: 50,
            warehouseId: 'WH-01'
          },
          {
            componentId: 'c3',
            sku: 'RAW-COPPER-WINDING',
            description: 'Insulated Copper Wire',
            componentType: 'RAW_MATERIAL',
            quantityPerUnit: 5, // 5 kg
            scrapFactorPercent: 0.04, // 4%
            uom: 'KG',
            costPerUnit: 15,
            warehouseId: 'WH-01'
          }
        ]
      });

      const exploded = ManufacturingEngine.explodeBOM(parentBOM, 10, [subBOM, parentBOM]);
      // Should have level 1 components and level 2 component
      const level2Items = exploded.filter(e => e.level === 2);
      if (level2Items.length !== 1) throw new Error(`Expected 1 level 2 component, got ${level2Items.length}`);
      if (level2Items[0].componentSku !== 'RAW-STEEL-ROD') throw new Error('Level 2 item mismatch');
      // For 10 units: 10 * 1 * 1.1 = 11 net quantity
      if (level2Items[0].netQuantityRequired !== 11) throw new Error(`Expected 11 net qty, got ${level2Items[0].netQuantityRequired}`);
    });

    runTest('P32D-01-05', 'Detect and block circular BOM dependencies', 'BOM Explosion', () => {
      // Circular: A requires B, B requires A
      const bomA = ManufacturingEngine.createBOM({
        tenantId,
        companyId,
        bomNumber: 'BOM-CIRC-A',
        finishedGoodSku: 'SKU-A',
        finishedGoodName: 'SKU A',
        baseQuantity: 1,
        uom: 'EA',
        effectiveFrom: '2026-01-01',
        createdBy: 'user-planner-01',
        status: 'ACTIVE',
        components: [
          {
            componentId: 'c1',
            sku: 'SKU-B',
            description: 'SKU B',
            componentType: 'SUB_ASSEMBLY',
            quantityPerUnit: 1,
            scrapFactorPercent: 0,
            uom: 'EA',
            costPerUnit: 10,
            warehouseId: 'WH-01'
          }
        ]
      });

      const bomB = ManufacturingEngine.createBOM({
        tenantId,
        companyId,
        bomNumber: 'BOM-CIRC-B',
        finishedGoodSku: 'SKU-B',
        finishedGoodName: 'SKU B',
        baseQuantity: 1,
        uom: 'EA',
        effectiveFrom: '2026-01-01',
        createdBy: 'user-planner-01',
        status: 'ACTIVE',
        components: [
          {
            componentId: 'c2',
            sku: 'SKU-A', // Circular loop!
            description: 'SKU A',
            componentType: 'SUB_ASSEMBLY',
            quantityPerUnit: 1,
            scrapFactorPercent: 0,
            uom: 'EA',
            costPerUnit: 10,
            warehouseId: 'WH-01'
          }
        ]
      });

      let circularBlocked = false;
      try {
        ManufacturingEngine.explodeBOM(bomA, 1, [bomA, bomB]);
      } catch (err: any) {
        if (err.message.includes('Circular dependency')) circularBlocked = true;
      }
      if (!circularBlocked) throw new Error('Expected circular dependency error to be thrown');
    });

    // ----------------------------------------------------
    // CATEGORY 2: WORK CENTERS, ROUTINGS & COST ROLLUP
    // ----------------------------------------------------

    runTest('P32D-01-06', 'Create Work Centers with rate definitions', 'Work Centers', () => {
      const wc = ManufacturingEngine.createWorkCenter({
        tenantId,
        companyId,
        workCenterCode: 'WC-MACH-01',
        name: 'CNC Milling & Lathe Cell 01',
        costCenterCode: 'CC-MFG-MACH',
        hourlyLaborRate: 35.0,
        hourlyMachineRate: 60.0,
        hourlyOverheadRate: 20.0,
        capacityHoursPerDay: 16.0,
        efficiencyPercent: 95
      });

      if (wc.status !== 'ACTIVE') throw new Error('Work center should be ACTIVE');
      if (wc.efficiencyPercent !== 95) throw new Error('Efficiency percent mismatch');
    });

    runTest('P32D-01-07', 'Create valid multi-step Routing with milestone flag', 'Routings', () => {
      const routing = ManufacturingEngine.createRouting({
        tenantId,
        companyId,
        routingNumber: 'RTG-PUMP-001',
        finishedGoodSku: 'FG-IND-PUMP-100',
        createdBy: 'user-eng-01',
        operations: [
          {
            operationNumber: 10,
            operationName: 'Precision CNC Machining',
            workCenterId: 'wc-1',
            workCenterCode: 'WC-MACH-01',
            setupTimeHours: 1.5,
            runTimeHoursPerUnit: 0.5,
            isMilestone: true
          },
          {
            operationNumber: 20,
            operationName: 'Sub-assembly & Rotor Balancing',
            workCenterId: 'wc-2',
            workCenterCode: 'WC-ASSY-01',
            setupTimeHours: 0.5,
            runTimeHoursPerUnit: 0.75,
            isMilestone: false
          },
          {
            operationNumber: 30,
            operationName: 'Hydrostatic Pressure & Quality Testing',
            workCenterId: 'wc-3',
            workCenterCode: 'WC-QA-01',
            setupTimeHours: 0.25,
            runTimeHoursPerUnit: 0.25,
            isMilestone: true
          }
        ]
      });

      if (routing.operations.length !== 3) throw new Error('Expected 3 operations');
      if (!routing.operations[0].isMilestone) throw new Error('Op 10 should be milestone');
    });

    runTest('P32D-01-08', 'Standard Cost Rollup arithmetic across BOM & Routing', 'Standard Costing', () => {
      const bom = ManufacturingEngine.createBOM({
        tenantId,
        companyId,
        bomNumber: 'BOM-COST-TEST',
        finishedGoodSku: 'FG-VALVE-50',
        finishedGoodName: 'Gate Valve 50mm',
        baseQuantity: 1,
        uom: 'EA',
        effectiveFrom: '2026-01-01',
        createdBy: 'planner-01',
        status: 'ACTIVE',
        components: [
          {
            componentId: 'c1',
            sku: 'RAW-BRASS-BODY',
            description: 'Cast Brass Body',
            componentType: 'RAW_MATERIAL',
            quantityPerUnit: 1,
            scrapFactorPercent: 0,
            uom: 'EA',
            costPerUnit: 50.0,
            warehouseId: 'WH-01'
          }
        ]
      });

      const wcMach = ManufacturingEngine.createWorkCenter({
        tenantId,
        companyId,
        workCenterCode: 'WC-MACH-01',
        name: 'Machining',
        costCenterCode: 'CC-MFG',
        hourlyLaborRate: 30.0,
        hourlyMachineRate: 40.0,
        hourlyOverheadRate: 10.0,
        capacityHoursPerDay: 8.0,
        efficiencyPercent: 100
      });

      const routing = ManufacturingEngine.createRouting({
        tenantId,
        companyId,
        routingNumber: 'RTG-VALVE-50',
        finishedGoodSku: 'FG-VALVE-50',
        createdBy: 'eng-01',
        operations: [
          {
            operationNumber: 10,
            operationName: 'Machining',
            workCenterId: wcMach.id,
            workCenterCode: 'WC-MACH-01',
            setupTimeHours: 0,
            runTimeHoursPerUnit: 0.5, // 0.5 hours * ($30 labor + $40 mach + $10 oh) = $15 + $20 + $5 = $40
            isMilestone: true
          }
        ]
      });

      const rollup = ManufacturingEngine.calculateStandardCost(bom, routing, [wcMach]);
      if (rollup.standardMaterialCostPerUnit !== 50.0) throw new Error(`Expected $50 mat, got ${rollup.standardMaterialCostPerUnit}`);
      if (rollup.standardLaborCostPerUnit !== 15.0) throw new Error(`Expected $15 labor, got ${rollup.standardLaborCostPerUnit}`);
      if (rollup.standardMachineCostPerUnit !== 20.0) throw new Error(`Expected $20 machine, got ${rollup.standardMachineCostPerUnit}`);
      if (rollup.standardOverheadCostPerUnit !== 5.0) throw new Error(`Expected $5 overhead, got ${rollup.standardOverheadCostPerUnit}`);
      if (rollup.totalStandardCostPerUnit !== 90.0) throw new Error(`Expected $90 total, got ${rollup.totalStandardCostPerUnit}`);
    });

    // ----------------------------------------------------
    // CATEGORY 3: WORK ORDER LIFECYCLE & SOD
    // ----------------------------------------------------

    let sharedBOM: BillOfMaterials;
    let sharedRouting: Routing;
    let sharedWorkCenters: WorkCenter[];
    let sharedWO: ProductionWorkOrder;

    runTest('P32D-01-09', 'Create Production Work Order in PLANNED state', 'Work Order Lifecycle', () => {
      sharedBOM = ManufacturingEngine.createBOM({
        tenantId,
        companyId,
        bomNumber: 'BOM-STD-PUMP',
        finishedGoodSku: 'FG-PUMP-STD',
        finishedGoodName: 'Standard Centrifugal Pump',
        baseQuantity: 1,
        uom: 'EA',
        effectiveFrom: '2026-01-01',
        createdBy: 'planner-alice',
        status: 'ACTIVE',
        components: [
          {
            componentId: 'c1',
            sku: 'RAW-STEEL-CASING',
            description: 'Steel Casing',
            componentType: 'RAW_MATERIAL',
            quantityPerUnit: 1,
            scrapFactorPercent: 0,
            uom: 'EA',
            costPerUnit: 100,
            warehouseId: 'WH-RAW-01'
          }
        ]
      });

      const wcAssy = ManufacturingEngine.createWorkCenter({
        tenantId,
        companyId,
        workCenterCode: 'WC-ASSY-01',
        name: 'Assembly Cell',
        costCenterCode: 'CC-ASSY',
        hourlyLaborRate: 40.0,
        hourlyMachineRate: 20.0,
        hourlyOverheadRate: 10.0,
        capacityHoursPerDay: 8.0,
        efficiencyPercent: 100
      });
      sharedWorkCenters = [wcAssy];

      sharedRouting = ManufacturingEngine.createRouting({
        tenantId,
        companyId,
        routingNumber: 'RTG-STD-PUMP',
        finishedGoodSku: 'FG-PUMP-STD',
        createdBy: 'eng-bob',
        operations: [
          {
            operationNumber: 10,
            operationName: 'Final Assembly',
            workCenterId: wcAssy.id,
            workCenterCode: 'WC-ASSY-01',
            setupTimeHours: 1,
            runTimeHoursPerUnit: 1, // 1h * ($40 + $20 + $10) = $70
            isMilestone: true
          }
        ]
      });

      sharedWO = ManufacturingEngine.createWorkOrder({
        tenantId,
        companyId,
        finishedGoodSku: 'FG-PUMP-STD',
        finishedGoodName: 'Standard Centrifugal Pump',
        bom: sharedBOM,
        routing: sharedRouting,
        workCenters: sharedWorkCenters,
        plannedQuantity: 10,
        uom: 'EA',
        plannedStartDate: '2026-03-01',
        plannedEndDate: '2026-03-05',
        targetWarehouseId: 'WH-FG-01',
        createdBy: 'planner-alice'
      });

      if (sharedWO.status !== 'PLANNED') throw new Error(`Expected PLANNED, got ${sharedWO.status}`);
      if (sharedWO.costSummary.plannedMaterialCost !== 1000) throw new Error('Planned material cost mismatch');
      if (sharedWO.costSummary.totalPlannedCost !== 1700) throw new Error('Total planned cost mismatch ($100 mat + $70 ops = $170/unit * 10 = $1700)');
    });

    runTest('P32D-01-10', 'Enforce Segregation of Duties on Work Order Release', 'Work Order Lifecycle', () => {
      let blockedSelfRelease = false;
      try {
        ManufacturingEngine.releaseWorkOrder(sharedWO, 'planner-alice'); // Same as createdBy
      } catch (err: any) {
        if (err.message.includes('Segregation of Duties')) blockedSelfRelease = true;
      }
      if (!blockedSelfRelease) throw new Error('Order creator should not be allowed to release Work Order');
    });

    runTest('P32D-01-11', 'Release Work Order with Material Reservation by Supervisor', 'Work Order Lifecycle', () => {
      sharedWO = ManufacturingEngine.releaseWorkOrder(sharedWO, 'supervisor-mfg-01');
      if (sharedWO.status !== 'RELEASED') throw new Error('Expected status RELEASED');
      if (sharedWO.materials[0].reservedQuantity !== 10) throw new Error('Expected 10 units reserved in materials allocation');
    });

    runTest('P32D-01-12', 'Start Work Order transition to IN_PROGRESS', 'Work Order Lifecycle', () => {
      sharedWO = ManufacturingEngine.startWorkOrder(sharedWO);
      if (sharedWO.status !== 'IN_PROGRESS') throw new Error('Expected status IN_PROGRESS');
      if (!sharedWO.actualStartDate) throw new Error('Expected actualStartDate to be set');
    });

    // ----------------------------------------------------
    // CATEGORY 4: GOODS ISSUE & FINANCIAL INTEGRATION
    // ----------------------------------------------------

    runTest('P32D-01-13', 'Issue materials to Work Order and generate Goods Issue record', 'Goods Issue', () => {
      const { updatedWorkOrder, goodsIssueRecord, financialEvent } = ManufacturingEngine.issueMaterialsToWorkOrder({
        workOrder: sharedWO,
        issuedBy: 'storekeeper-01',
        issueType: 'MANUAL_STAGING',
        items: [
          {
            componentSku: 'RAW-STEEL-CASING',
            quantity: 10
          }
        ]
      });

      sharedWO = updatedWorkOrder;
      if (goodsIssueRecord.totalIssuedValue !== 1000) throw new Error(`Expected $1000 issued value, got ${goodsIssueRecord.totalIssuedValue}`);
      if (sharedWO.costSummary.actualMaterialCost !== 1000) throw new Error('Actual material cost mismatch');
      if (sharedWO.costSummary.wipBalance !== 1000) throw new Error(`Expected WIP balance $1000, got ${sharedWO.costSummary.wipBalance}`);
      if (financialEvent.eventType !== 'PRODUCTION_GOODS_ISSUE') throw new Error('Event type mismatch');
    });

    runTest('P32D-01-14', 'Decoupled Financial Event for Goods Issue (ZERO direct GL mutation)', 'Financial Integration', () => {
      const { financialEvent } = ManufacturingEngine.issueMaterialsToWorkOrder({
        workOrder: sharedWO,
        issuedBy: 'storekeeper-01',
        issueType: 'BACKFLUSH',
        items: [{ componentSku: 'RAW-STEEL-CASING', quantity: 1 }]
      });

      if (financialEvent.payload.debitAccount !== '1300-WIP-INVENTORY') throw new Error('Expected Debit to WIP account');
      if (financialEvent.payload.creditAccount !== '1200-RAW-MATERIALS-INVENTORY') throw new Error('Expected Credit to Raw Materials Inventory');
    });

    runTest('P32D-01-15', 'Reject Goods Issue for non-allocated component SKU', 'Goods Issue', () => {
      let threw = false;
      try {
        ManufacturingEngine.issueMaterialsToWorkOrder({
          workOrder: sharedWO,
          issuedBy: 'storekeeper-01',
          issueType: 'MANUAL_STAGING',
          items: [{ componentSku: 'UNALLOCATED-SKU-999', quantity: 5 }]
        });
      } catch {
        threw = true;
      }
      if (!threw) throw new Error('Expected rejection for non-allocated SKU');
    });

    // ----------------------------------------------------
    // CATEGORY 5: SHOP FLOOR CONFIRMATIONS & COST ABSORPTION
    // ----------------------------------------------------

    runTest('P32D-01-16', 'Confirm operation with labor/machine hours & cost absorption', 'Shop Floor Execution', () => {
      const { updatedWorkOrder, confirmation, absorbedCost } = ManufacturingEngine.confirmOperation({
        workOrder: sharedWO,
        routing: sharedRouting,
        workCenters: sharedWorkCenters,
        operationNumber: 10,
        confirmedGoodQuantity: 10,
        confirmedScrapQuantity: 0,
        actualLaborHours: 10,   // 10h * $40 = $400
        actualMachineHours: 10, // 10h * $20 = $200
        operatorId: 'technician-ahmed',
        operatorName: 'Ahmed Technician'
      });

      sharedWO = updatedWorkOrder;
      // Absorbed cost: $400 labor + $200 machine + $100 overhead = $700
      if (absorbedCost !== 700) throw new Error(`Expected $700 absorbed cost, got ${absorbedCost}`);
      if (confirmation.confirmedGoodQuantity !== 10) throw new Error('Confirmed quantity mismatch');
      if (sharedWO.costSummary.actualLaborCost !== 400) throw new Error('Actual labor cost mismatch');
    });

    runTest('P32D-01-17', 'Milestone operation sequence enforcement', 'Shop Floor Execution', () => {
      const multiStepRouting = ManufacturingEngine.createRouting({
        tenantId,
        companyId,
        routingNumber: 'RTG-SEQ-TEST',
        finishedGoodSku: 'FG-SEQ',
        createdBy: 'eng-01',
        operations: [
          {
            operationNumber: 10,
            operationName: 'Milestone 1',
            workCenterId: 'wc-1',
            workCenterCode: 'WC-ASSY-01',
            setupTimeHours: 0,
            runTimeHoursPerUnit: 1,
            isMilestone: true
          },
          {
            operationNumber: 20,
            operationName: 'Milestone 2',
            workCenterId: 'wc-1',
            workCenterCode: 'WC-ASSY-01',
            setupTimeHours: 0,
            runTimeHoursPerUnit: 1,
            isMilestone: true
          }
        ]
      });

      const freshWO: ProductionWorkOrder = {
        ...sharedWO,
        status: 'IN_PROGRESS',
        operationConfirmations: []
      };

      let milestoneBlocked = false;
      try {
        // Attempt Op 20 before Op 10 confirmation
        ManufacturingEngine.confirmOperation({
          workOrder: freshWO,
          routing: multiStepRouting,
          workCenters: sharedWorkCenters,
          operationNumber: 20,
          confirmedGoodQuantity: 5,
          confirmedScrapQuantity: 0,
          actualLaborHours: 5,
          actualMachineHours: 5,
          operatorId: 'op-1',
          operatorName: 'Operator 1'
        });
      } catch (err: any) {
        if (err.message.includes('Milestone operation sequence violation')) milestoneBlocked = true;
      }
      if (!milestoneBlocked) throw new Error('Expected milestone sequence violation');
    });

    // ----------------------------------------------------
    // CATEGORY 6: FINISHED GOODS RECEIPT & WIP RELIEF
    // ----------------------------------------------------

    runTest('P32D-01-18', 'Receive finished goods into warehouse at standard cost', 'Goods Receipt', () => {
      const { updatedWorkOrder, goodsReceiptRecord, financialEvent } = ManufacturingEngine.receiveFinishedGoods({
        workOrder: sharedWO,
        receivedQuantity: 10,
        receivedBy: 'qc-inspector-01',
        destinationWarehouseId: 'WH-FG-01'
      });

      sharedWO = updatedWorkOrder;
      if (sharedWO.status !== 'COMPLETED') throw new Error(`Expected status COMPLETED, got ${sharedWO.status}`);
      if (goodsReceiptRecord.receivedQuantity !== 10) throw new Error('Received quantity mismatch');
      // Standard cost per unit is $170 ($100 mat + $70 op) * 10 = $1700
      if (goodsReceiptRecord.totalReceiptValue !== 1700) throw new Error(`Expected $1700 receipt value, got ${goodsReceiptRecord.totalReceiptValue}`);
      if (financialEvent.eventType !== 'PRODUCTION_GOODS_RECEIPT') throw new Error('Event type mismatch');
      if (financialEvent.payload.debitAccount !== '1250-FINISHED-GOODS-INVENTORY') throw new Error('Expected debit to FG Inventory');
    });

    runTest('P32D-01-19', 'Block over-delivery exceeding tolerance limit (>10%)', 'Goods Receipt', () => {
      const inProgressWO: ProductionWorkOrder = {
        ...sharedWO,
        status: 'IN_PROGRESS',
        completedQuantity: 10
      };

      let overDeliveryBlocked = false;
      try {
        ManufacturingEngine.receiveFinishedGoods({
          workOrder: inProgressWO,
          receivedQuantity: 5, // Order planned was 10, receiving 5 when 10 already done -> 15 exceeds 10 by 50% (>10%)
          receivedBy: 'qc-inspector-01',
          destinationWarehouseId: 'WH-FG-01'
        });
      } catch (err: any) {
        if (err.message.includes('Over-delivery limit breached')) overDeliveryBlocked = true;
      }
      if (!overDeliveryBlocked) throw new Error('Expected over-delivery rejection');
    });

    // ----------------------------------------------------
    // CATEGORY 7: ORDER SETTLEMENT, VARIANCES & CRYPTOGRAPHIC SEAL
    // ----------------------------------------------------

    runTest('P32D-01-20', 'Settle Work Order, compute variances and clear WIP balance to zero', 'Order Settlement', () => {
      const { updatedWorkOrder, financialEvent } = ManufacturingEngine.settleAndCloseWorkOrder({
        workOrder: sharedWO,
        settledBy: 'controller-tarek'
      });

      sharedWO = updatedWorkOrder;
      if (sharedWO.status !== 'CLOSED') throw new Error(`Expected CLOSED status, got ${sharedWO.status}`);
      if (sharedWO.costSummary.wipBalance !== 0) throw new Error('WIP balance must be zero after settlement');
      if (!sharedWO.integrityHash) throw new Error('Expected cryptographic integrity hash to be generated');
      if (financialEvent.eventType !== 'PRODUCTION_ORDER_SETTLEMENT') throw new Error('Event type mismatch');
      if (financialEvent.payload.varianceAccount !== '5100-PRODUCTION-PRICE-USAGE-VARIANCE') throw new Error('Expected variance account 5100');
    });

    runTest('P32D-01-21', 'Reject settlement of non-completed Work Order', 'Order Settlement', () => {
      const draftWO: ProductionWorkOrder = {
        ...sharedWO,
        status: 'IN_PROGRESS'
      };

      let threw = false;
      try {
        ManufacturingEngine.settleAndCloseWorkOrder({
          workOrder: draftWO,
          settledBy: 'controller-tarek'
        });
      } catch {
        threw = true;
      }
      if (!threw) throw new Error('Settling non-completed order should fail');
    });

    // ----------------------------------------------------
    // CATEGORY 8: MATERIAL REQUIREMENTS PLANNING (MRP)
    // ----------------------------------------------------

    runTest('P32D-01-22', 'Run MRP net requirements calculation for independent demand', 'MRP Engine', () => {
      const report = ManufacturingEngine.runMRP({
        tenantId,
        companyId,
        demands: [
          {
            sku: 'FG-PUMP-STD',
            demandQuantity: 25,
            demandDate: '2026-04-15',
            demandSource: 'SO-2026-8801'
          }
        ],
        currentStockMap: {
          'FG-PUMP-STD': {
            onHand: 5,
            reserved: 0,
            safetyStock: 0,
            leadTimeDays: 10,
            isManufactured: true
          },
          'RAW-STEEL-CASING': {
            onHand: 10,
            reserved: 0,
            safetyStock: 2,
            leadTimeDays: 5,
            isManufactured: false
          }
        },
        allBOMs: [sharedBOM]
      });

      // Demand 25 - Onhand 5 = Net deficit 20 for FG
      const fgOrder = report.plannedOrders.find(o => o.sku === 'FG-PUMP-STD');
      if (!fgOrder) throw new Error('Expected planned order for FG-PUMP-STD');
      if (fgOrder.netRequirementQuantity !== 20) throw new Error(`Expected 20 FG required, got ${fgOrder.netRequirementQuantity}`);
      if (fgOrder.actionType !== 'CREATE_WORK_ORDER') throw new Error('Expected CREATE_WORK_ORDER action');

      // Dependent demand for RAW-STEEL-CASING: 20 * 1 = 20 req + 2 safety stock - 10 onHand = 12 deficit
      const rawOrder = report.plannedOrders.find(o => o.sku === 'RAW-STEEL-CASING');
      if (!rawOrder) throw new Error('Expected planned order for RAW-STEEL-CASING');
      if (rawOrder.netRequirementQuantity !== 12) throw new Error(`Expected 12 raw required, got ${rawOrder.netRequirementQuantity}`);
      if (rawOrder.actionType !== 'CREATE_PURCHASE_REQUISITION') throw new Error('Expected CREATE_PURCHASE_REQUISITION action');
    });

    runTest('P32D-01-23', 'Verify MRP backward scheduling lead time calculation', 'MRP Engine', () => {
      const report = ManufacturingEngine.runMRP({
        tenantId,
        companyId,
        demands: [
          {
            sku: 'FG-PUMP-STD',
            demandQuantity: 10,
            demandDate: '2026-05-20',
            demandSource: 'SO-2026-9901'
          }
        ],
        currentStockMap: {
          'FG-PUMP-STD': {
            onHand: 0,
            reserved: 0,
            safetyStock: 0,
            leadTimeDays: 14,
            isManufactured: true
          }
        },
        allBOMs: [sharedBOM]
      });

      const fgOrder = report.plannedOrders[0];
      // May 20 minus 14 days = May 6
      if (fgOrder.suggestedStartDate !== '2026-05-06') {
        throw new Error(`Expected start date 2026-05-06, got ${fgOrder.suggestedStartDate}`);
      }
    });

    runTest('P32D-01-24', 'Verify MRP report cryptographic integrity hash', 'MRP Engine', () => {
      const report = ManufacturingEngine.runMRP({
        tenantId,
        companyId,
        demands: [
          {
            sku: 'FG-PUMP-STD',
            demandQuantity: 5,
            demandDate: '2026-06-01',
            demandSource: 'SAFETY-STOCK'
          }
        ],
        currentStockMap: {
          'FG-PUMP-STD': {
            onHand: 0,
            reserved: 0,
            safetyStock: 5,
            leadTimeDays: 7,
            isManufactured: true
          }
        },
        allBOMs: [sharedBOM]
      });

      if (!report.integrityHash || report.integrityHash.length !== 64) {
        throw new Error('Expected 64-character SHA-256 integrity hash on MRP report');
      }
    });

    // ----------------------------------------------------
    // CATEGORY 9: EDGE CASES, ISOLATION & DATA INTEGRITY
    // ----------------------------------------------------

    runTest('P32D-01-25', 'Multi-tenant isolation: Tenant boundaries preserved', 'Tenant Isolation', () => {
      const bomTenantA = ManufacturingEngine.createBOM({
        tenantId: 'tenant-a',
        companyId: 'comp-a',
        bomNumber: 'BOM-ISO-01',
        finishedGoodSku: 'FG-ISO',
        finishedGoodName: 'Tenant A FG',
        baseQuantity: 1,
        uom: 'EA',
        effectiveFrom: '2026-01-01',
        createdBy: 'user-a',
        components: [
          {
            componentId: 'c1',
            sku: 'RAW-A',
            description: 'Raw A',
            componentType: 'RAW_MATERIAL',
            quantityPerUnit: 1,
            scrapFactorPercent: 0,
            uom: 'EA',
            costPerUnit: 10,
            warehouseId: 'WH-A'
          }
        ]
      });

      if (bomTenantA.tenantId !== 'tenant-a') throw new Error('Tenant ID leakage');
      if (bomTenantA.companyId !== 'comp-a') throw new Error('Company ID leakage');
    });

    runTest('P32D-01-26', 'Validate Work Center capacity constraints (max 24h/day)', 'Work Centers', () => {
      let threw = false;
      try {
        ManufacturingEngine.createWorkCenter({
          tenantId,
          companyId,
          workCenterCode: 'WC-OVERCAP',
          name: 'Impossible Cell',
          costCenterCode: 'CC-01',
          hourlyLaborRate: 20,
          hourlyMachineRate: 20,
          hourlyOverheadRate: 5,
          capacityHoursPerDay: 28, // Invalid!
        });
      } catch {
        threw = true;
      }
      if (!threw) throw new Error('Expected rejection for daily capacity > 24 hours');
    });

    runTest('P32D-01-27', 'Validate negative quantity rejection across Work Orders', 'Validation Rules', () => {
      let threw = false;
      try {
        ManufacturingEngine.createWorkOrder({
          tenantId,
          companyId,
          finishedGoodSku: 'FG-TEST',
          finishedGoodName: 'Negative Test',
          bom: sharedBOM,
          routing: sharedRouting,
          workCenters: sharedWorkCenters,
          plannedQuantity: -5, // Invalid!
          uom: 'EA',
          plannedStartDate: '2026-03-01',
          plannedEndDate: '2026-03-05',
          targetWarehouseId: 'WH-01',
          createdBy: 'planner-01'
        });
      } catch {
        threw = true;
      }
      if (!threw) throw new Error('Expected rejection for negative planned quantity');
    });

    runTest('P32D-01-28', 'Validate Goods Receipt rejection on DRAFT Work Orders', 'Validation Rules', () => {
      const plannedWO: ProductionWorkOrder = {
        ...sharedWO,
        status: 'PLANNED'
      };

      let threw = false;
      try {
        ManufacturingEngine.receiveFinishedGoods({
          workOrder: plannedWO,
          receivedQuantity: 1,
          receivedBy: 'qc-01',
          destinationWarehouseId: 'WH-01'
        });
      } catch {
        threw = true;
      }
      if (!threw) throw new Error('Cannot receive finished goods on PLANNED Work Orders');
    });

    runTest('P32D-01-29', 'Verify Work Order deterministic SHA-256 seal verification', 'Audit Integrity', () => {
      const hash1 = ManufacturingEngine.computeSha256('AM-ERP-MFG-TEST-PAYLOAD');
      const hash2 = ManufacturingEngine.computeSha256('AM-ERP-MFG-TEST-PAYLOAD');
      if (hash1 !== hash2) throw new Error('Hash must be deterministic');
      if (hash1.length !== 64) throw new Error('Hash length must be 64 characters');
    });

    runTest('P32D-01-30', 'Material variance tracking when actual scrap exceeds planned scrap', 'Variance Accounting', () => {
      // Create fresh WO
      let wo = ManufacturingEngine.createWorkOrder({
        tenantId,
        companyId,
        finishedGoodSku: 'FG-PUMP-STD',
        finishedGoodName: 'Standard Pump',
        bom: sharedBOM,
        routing: sharedRouting,
        workCenters: sharedWorkCenters,
        plannedQuantity: 5,
        uom: 'EA',
        plannedStartDate: '2026-03-01',
        plannedEndDate: '2026-03-05',
        targetWarehouseId: 'WH-FG-01',
        createdBy: 'planner-user'
      });

      wo = ManufacturingEngine.releaseWorkOrder(wo, 'supervisor-user');
      wo = ManufacturingEngine.startWorkOrder(wo);

      // Issue extra material (6 instead of planned 5) -> $600 actual vs $500 planned
      const { updatedWorkOrder: woAfterIssue } = ManufacturingEngine.issueMaterialsToWorkOrder({
        workOrder: wo,
        issuedBy: 'storekeeper-01',
        issueType: 'MANUAL_STAGING',
        items: [{ componentSku: 'RAW-STEEL-CASING', quantity: 6 }]
      });

      // Confirm operation
      const { updatedWorkOrder: woAfterOps } = ManufacturingEngine.confirmOperation({
        workOrder: woAfterIssue,
        routing: sharedRouting,
        workCenters: sharedWorkCenters,
        operationNumber: 10,
        confirmedGoodQuantity: 5,
        confirmedScrapQuantity: 0,
        actualLaborHours: 5,
        actualMachineHours: 5,
        operatorId: 'op-1',
        operatorName: 'Op 1'
      });

      // Receive finished goods (5 units)
      const { updatedWorkOrder: woAfterReceipt } = ManufacturingEngine.receiveFinishedGoods({
        workOrder: woAfterOps,
        receivedQuantity: 5,
        receivedBy: 'qc-01',
        destinationWarehouseId: 'WH-FG-01'
      });

      // Settle
      const { updatedWorkOrder: woSettled } = ManufacturingEngine.settleAndCloseWorkOrder({
        workOrder: woAfterReceipt,
        settledBy: 'controller-user'
      });

      // Material variance should be +$100 (Unfavorable material usage variance)
      if (woSettled.costSummary.materialVariance !== 100) {
        throw new Error(`Expected $100 material variance, got ${woSettled.costSummary.materialVariance}`);
      }
    });

    return {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      results
    };
  }
}
