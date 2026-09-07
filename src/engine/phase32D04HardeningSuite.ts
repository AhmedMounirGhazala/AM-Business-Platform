/**
 * AM Enterprise ERP — Phase 3.2D-04 Hardening Test Suite
 * Process Manufacturing (PP-PI), Advanced Finite Capacity Scheduling (APS),
 * Subcontracting / Outside Processing & Electronic Kanban Execution
 * 35 Enterprise-Grade Test Scenarios
 */

import { ProcessManufacturingSubcontractingEngine } from './processManufacturingSubcontractingEngine';
import {
  MasterRecipe,
  BatchMaster,
  ProcessOrder,
  WorkCenterCapacityProfile,
  SubcontractOrder,
  ProductionLine,
  KanbanControlCycle
} from '../types/processManufacturingSubcontracting';

export interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  message?: string;
}

export class Phase32D04HardeningSuite {
  public static runAll(): { phase: string; total: number; passed: number; failed: number; results: TestResult[] } {
    const results: TestResult[] = [];

    function record(id: string, name: string, fn: () => void) {
      try {
        fn();
        results.push({ id, name, passed: true });
      } catch (err: any) {
        results.push({ id, name, passed: false, message: err.message });
      }
    }

    // ========================================================================
    // 1. MASTER RECIPES & FORMULATION MANAGEMENT
    // ========================================================================

    let testRecipe: MasterRecipe;

    record('P32D-04-01', 'Master Recipe Creation & Schema Validation', () => {
      testRecipe = ProcessManufacturingSubcontractingEngine.createMasterRecipe({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        recipeCode: 'REC-PHARMA-SYRUP-100',
        productSku: 'FG-SYRUP-500ML',
        productName: 'Cough Relief Syrup 500ml',
        baseQuantity: 1000,
        unitOfMeasure: 'L',
        phases: [
          {
            phaseNumber: 10,
            phaseName: 'Dispensing & Pre-mixing',
            workCenterId: 'WC-DISP-01',
            standardDurationHours: 1.5,
            instructions: 'Verify active ingredient potency before charging reactor'
          },
          {
            phaseNumber: 20,
            phaseName: 'Thermal Reaction & Dissolution',
            workCenterId: 'WC-REACT-01',
            standardDurationHours: 3.0,
            temperatureCelsius: 65,
            phTarget: 5.5,
            instructions: 'Heat syrup to 65C, maintain pH at 5.5'
          }
        ],
        ingredients: [
          {
            itemSku: 'RM-ACTIVE-DXM',
            description: 'Dextromethorphan HBr Active',
            standardQuantity: 20,
            unitOfMeasure: 'KG',
            isPotencyAdjustable: true,
            basePotencyPercent: 100
          },
          {
            itemSku: 'RM-SUGAR-SOL',
            description: 'Liquid Sucrose Solution 67%',
            standardQuantity: 700,
            unitOfMeasure: 'L'
          },
          {
            itemSku: 'RM-PURIFIED-WATER',
            description: 'Purified Water USP (Filler/Vehicle)',
            standardQuantity: 300,
            unitOfMeasure: 'L',
            isFiller: true
          }
        ],
        coProducts: [
          {
            itemSku: 'CP-RECOVERED-ALCOHOL',
            description: 'Recovered Ethanol Sub-stream',
            plannedYieldQuantity: 50,
            unitOfMeasure: 'L',
            costApportionmentPercent: 15
          }
        ],
        byProducts: [
          {
            itemSku: 'BP-SPENT-FILTER-CAKE',
            description: 'Filtered Solids (Biofuel Feedstock)',
            plannedYieldQuantity: 10,
            unitOfMeasure: 'KG',
            estimatedNetRealizableCreditUnit: 5.0
          }
        ],
        validFrom: '2026-01-01',
        createdBy: 'formulator-layla'
      });

      if (!testRecipe.id.startsWith('REC-')) throw new Error('Invalid recipe ID format');
      if (testRecipe.status !== 'DRAFT') throw new Error('Recipe should initialize in DRAFT status');
      if (testRecipe.ingredients.length !== 3) throw new Error('Ingredient count mismatch');
    });

    record('P32D-04-02', 'Master Recipe Co-Product Cost Apportionment Boundary Rejection', () => {
      let rejected = false;
      try {
        ProcessManufacturingSubcontractingEngine.createMasterRecipe({
          tenantId: 'TENANT-001',
          companyId: 'COMP-001',
          recipeCode: 'REC-INVALID-COPROD',
          productSku: 'FG-CHEM-A',
          productName: 'Chemical Solution A',
          baseQuantity: 100,
          unitOfMeasure: 'KG',
          phases: [{ phaseNumber: 10, phaseName: 'Mix', workCenterId: 'WC-01', standardDurationHours: 1, instructions: 'Mix' }],
          ingredients: [{ itemSku: 'RM-SOLVENT', description: 'Solvent', standardQuantity: 100, unitOfMeasure: 'KG' }],
          coProducts: [
            { itemSku: 'CP-01', description: 'CoProduct 1', plannedYieldQuantity: 50, unitOfMeasure: 'KG', costApportionmentPercent: 60 },
            { itemSku: 'CP-02', description: 'CoProduct 2', plannedYieldQuantity: 50, unitOfMeasure: 'KG', costApportionmentPercent: 45 }
          ], // Sum = 105% > 100% -> MUST REJECT
          validFrom: '2026-01-01',
          createdBy: 'formulator-layla'
        });
      } catch (err: any) {
        if (err.message.includes('must be strictly less than 100%')) rejected = true;
      }
      if (!rejected) throw new Error('Engine failed to reject co-product apportionment exceeding 100%');
    });

    record('P32D-04-03', 'Master Recipe Cryptographic SHA-256 Seal Validation', () => {
      if (!testRecipe.sha256Seal || testRecipe.sha256Seal.length !== 64) {
        throw new Error('Master recipe missing 64-char SHA-256 seal');
      }
      const recalculated = ProcessManufacturingSubcontractingEngine.generateRecipeHash(testRecipe);
      if (recalculated !== testRecipe.sha256Seal) {
        throw new Error('SHA-256 seal recalculation mismatch');
      }
    });

    record('P32D-04-04', 'Master Recipe Approval Segregation of Duties (Creator Blocked)', () => {
      let blocked = false;
      try {
        ProcessManufacturingSubcontractingEngine.approveMasterRecipe({
          recipe: testRecipe,
          approvedBy: 'formulator-layla' // Same user who created the recipe
        });
      } catch (err: any) {
        if (err.message.includes('SoD Violation')) blocked = true;
      }
      if (!blocked) throw new Error('SoD check failed to block creator from approving their own recipe');
    });

    record('P32D-04-05', 'Master Recipe Activation by Authorized Approver', () => {
      testRecipe = ProcessManufacturingSubcontractingEngine.approveMasterRecipe({
        recipe: testRecipe,
        approvedBy: 'qa-manager-dr-hassan',
        asActive: true
      });
      if (testRecipe.status !== 'ACTIVE') throw new Error('Recipe should be ACTIVE');
      if (!testRecipe.approvalDate) throw new Error('Approval date missing');
    });

    record('P32D-04-06', 'Potency Adjustment Calculation for Low-Assay Active Ingredient', () => {
      // Standard quantity is 20 KG at 100% potency.
      // Raw material batch potency is 95% (0.95 assay).
      // Required active quantity = (20 * 100) / 95 = 21.0526 KG.
      const result = ProcessManufacturingSubcontractingEngine.calculatePotencyAdjustedIngredients({
        ingredients: testRecipe.ingredients,
        batchBatchPotencies: {
          'RM-ACTIVE-DXM': 95.0
        }
      });

      const active = result.adjustedIngredients.find(i => i.itemSku === 'RM-ACTIVE-DXM');
      if (!active) throw new Error('Active ingredient missing');
      if (Math.abs(active.calculatedQuantity - 21.0526) > 0.001) {
        throw new Error(`Expected active quantity ~21.0526, got ${active.calculatedQuantity}`);
      }
      if (Math.abs(active.potencyShiftDelta - 1.0526) > 0.001) {
        throw new Error(`Expected potency shift delta ~1.0526, got ${active.potencyShiftDelta}`);
      }
    });

    record('P32D-04-07', 'Excipient / Filler Auto-Compensation (Invariant Total Formula Weight)', () => {
      const result = ProcessManufacturingSubcontractingEngine.calculatePotencyAdjustedIngredients({
        ingredients: testRecipe.ingredients,
        batchBatchPotencies: {
          'RM-ACTIVE-DXM': 95.0
        }
      });

      // Filler RM-PURIFIED-WATER had standard 300 L.
      // Since active increased by 1.0526, filler should decrease by 1.0526 to 298.9474 L.
      const filler = result.adjustedIngredients.find(i => i.itemSku === 'RM-PURIFIED-WATER');
      if (!filler) throw new Error('Filler ingredient missing');
      if (Math.abs(filler.calculatedQuantity - 298.9474) > 0.001) {
        throw new Error(`Expected compensated filler ~298.9474, got ${filler.calculatedQuantity}`);
      }
      // Total batch weight should remain exactly 20 + 700 + 300 = 1020.0
      if (Math.abs(result.totalBatchWeight - 1020.0) > 0.001) {
        throw new Error(`Expected total batch weight 1020.0, got ${result.totalBatchWeight}`);
      }
    });

    record('P32D-04-08', 'Filler Capacity Exhaustion Detection', () => {
      let rejected = false;
      try {
        ProcessManufacturingSubcontractingEngine.calculatePotencyAdjustedIngredients({
          ingredients: [
            { itemSku: 'ACT-1', description: 'Active', standardQuantity: 50, unitOfMeasure: 'KG', isPotencyAdjustable: true },
            { itemSku: 'FIL-1', description: 'Small Filler', standardQuantity: 5, unitOfMeasure: 'KG', isFiller: true }
          ],
          batchBatchPotencies: {
            'ACT-1': 50 // 50% potency means active doubles from 50 to 100 (+50 delta), but filler is only 5!
          }
        });
      } catch (err: any) {
        if (err.message.includes('Filler became negative')) rejected = true;
      }
      if (!rejected) throw new Error('Engine failed to detect filler exhaustion');
    });

    // ========================================================================
    // 2. BATCH MASTER & SHELF-LIFE MANAGEMENT
    // ========================================================================

    let rawBatch: BatchMaster;

    record('P32D-04-09', 'Batch Master Creation in Quarantine with SLED Calculation', () => {
      rawBatch = ProcessManufacturingSubcontractingEngine.createBatch({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        batchNumber: 'B-DXM-2026-088',
        itemSku: 'RM-ACTIVE-DXM',
        manufacturingDate: '2026-01-15',
        shelfLifeDays: 365, // 1 year -> Exp: 2027-01-15
        retestDays: 180,    // 6 months -> Retest: 2026-07-14
        actualPotencyPercent: 95.0,
        warehouseId: 'WH-CHEM-QUARANTINE',
        quantityOnHand: 500,
        unitOfMeasure: 'KG',
        certificateOfAnalysisId: 'COA-2026-9912'
      });

      if (rawBatch.status !== 'QUARANTINE') throw new Error('Batch must initialize in QUARANTINE');
      if (rawBatch.expirationDate !== '2027-01-15') throw new Error(`Expiration date mismatch: got ${rawBatch.expirationDate}`);
      if (!rawBatch.retestDate) throw new Error('Retest date not calculated');
    });

    record('P32D-04-10', 'Batch Release Segregation of Duties (Operator Blocked)', () => {
      let blocked = false;
      try {
        ProcessManufacturingSubcontractingEngine.updateBatchStatus({
          batch: rawBatch,
          newStatus: 'UNRESTRICTED',
          changedBy: 'operator-ahmed', // Production operator trying to release quarantine stock
          reason: 'Attempting manual release'
        });
      } catch (err: any) {
        if (err.message.includes('SoD Violation')) blocked = true;
      }
      if (!blocked) throw new Error('SoD check failed to block production operator from releasing quarantine batch');
    });

    record('P32D-04-11', 'Batch Release by QA Inspector to UNRESTRICTED', () => {
      rawBatch = ProcessManufacturingSubcontractingEngine.updateBatchStatus({
        batch: rawBatch,
        newStatus: 'UNRESTRICTED',
        changedBy: 'qa-inspector-mona',
        reason: 'CoA testing passed all assay and purity specifications'
      });

      if (rawBatch.status !== 'UNRESTRICTED') throw new Error('Batch should be UNRESTRICTED');
      if (rawBatch.statusChangeHistory.length !== 2) throw new Error('Audit trail should have 2 entries');
    });

    record('P32D-04-12', 'Automated SLED Shelf-Life Expiration Enforcement', () => {
      // Evaluate as of 2027-02-01 (past expiration of 2027-01-15)
      const evaluated = ProcessManufacturingSubcontractingEngine.evaluateBatchExpiration(rawBatch, '2027-02-01');
      if (evaluated.status !== 'BLOCKED') {
        throw new Error(`Expired batch was not automatically set to BLOCKED, got ${evaluated.status}`);
      }
    });

    record('P32D-04-13', 'Automated Retest Date Threshold Evaluation', () => {
      // Evaluate as of 2026-08-01 (past retest date 2026-07-14, but before exp 2027-01-15)
      const evaluated = ProcessManufacturingSubcontractingEngine.evaluateBatchExpiration(rawBatch, '2026-08-01');
      if (evaluated.status !== 'RETEST_REQUIRED') {
        throw new Error(`Batch requiring retest not flagged as RETEST_REQUIRED, got ${evaluated.status}`);
      }
    });

    // ========================================================================
    // 3. PROCESS ORDERS (PP-PI EXECUTION)
    // ========================================================================

    let processOrder: ProcessOrder;

    record('P32D-04-14', 'Process Order Creation from Active Recipe', () => {
      processOrder = ProcessManufacturingSubcontractingEngine.createProcessOrder({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        recipe: testRecipe,
        plannedBatchQuantity: 2000,
        assignedBatchNumber: 'B-SYRUP-2026-001',
        plannedStartDate: '2026-09-10',
        plannedEndDate: '2026-09-11',
        createdBy: 'prod-planner-tariq'
      });

      if (!processOrder.id.startsWith('PRC-')) throw new Error('Invalid process order ID');
      if (processOrder.status !== 'CREATED') throw new Error('Process order should be CREATED');
      if (processOrder.plannedBatchQuantity !== 2000) throw new Error('Planned batch qty mismatch');
    });

    record('P32D-04-15', 'Block Process Order Creation from Unapproved Recipe', () => {
      let blocked = false;
      try {
        ProcessManufacturingSubcontractingEngine.createProcessOrder({
          tenantId: 'TENANT-001',
          companyId: 'COMP-001',
          recipe: { ...testRecipe, status: 'DRAFT' },
          plannedBatchQuantity: 500,
          assignedBatchNumber: 'B-FAIL',
          plannedStartDate: '2026-09-10',
          plannedEndDate: '2026-09-11',
          createdBy: 'prod-planner-tariq'
        });
      } catch (err: any) {
        if (err.message.includes('Cannot create Process Order from unapproved recipe')) blocked = true;
      }
      if (!blocked) throw new Error('Engine failed to block order creation from draft recipe');
    });

    record('P32D-04-16', 'Process Order Release Segregation of Duties (Planner Blocked)', () => {
      let blocked = false;
      try {
        ProcessManufacturingSubcontractingEngine.releaseProcessOrder({
          processOrder,
          releasedBy: 'prod-planner-tariq' // Same user who created
        });
      } catch (err: any) {
        if (err.message.includes('SoD Violation')) blocked = true;
      }
      if (!blocked) throw new Error('SoD check failed to block order creator from releasing order');
    });

    record('P32D-04-17', 'Process Order Release & Financial Event Emission', () => {
      const { updatedOrder, financialEvent } = ProcessManufacturingSubcontractingEngine.releaseProcessOrder({
        processOrder,
        releasedBy: 'plant-superintendent-kamal'
      });
      processOrder = updatedOrder;

      if (processOrder.status !== 'RELEASED') throw new Error('Order status should be RELEASED');
      if (financialEvent.eventType !== 'PROCESS_ORDER_RELEASED') throw new Error('Financial event mismatch');
    });

    record('P32D-04-18', 'Ingredient Dispensing with Potency Factor Recording', () => {
      // Dispense 42.1052 KG of active RM-ACTIVE-DXM (standard 40 KG for 2000L batch scaled for 95% potency)
      processOrder = ProcessManufacturingSubcontractingEngine.recordDispensedIngredient({
        processOrder,
        itemSku: 'RM-ACTIVE-DXM',
        batchNumber: rawBatch.batchNumber,
        rawMaterialBatch: rawBatch,
        standardQuantity: 40,
        actualDispensedQuantity: 42.1052,
        unitOfMeasure: 'KG',
        dispensedBy: 'dispenser-omar',
        potencyFactorApplied: 1.0526
      });

      if (processOrder.status !== 'DISPENSED') throw new Error('Order status should transition to DISPENSED');
      if (processOrder.dispensedIngredients.length !== 1) throw new Error('Dispensed ingredient not logged');
      if (processOrder.dispensedIngredients[0].potencyFactorApplied !== 1.0526) {
        throw new Error('Potency factor not stored');
      }
    });

    record('P32D-04-19', 'Block Dispensing from Expired or Quarantine Raw Batch', () => {
      let blocked = false;
      try {
        ProcessManufacturingSubcontractingEngine.recordDispensedIngredient({
          processOrder,
          itemSku: 'RM-SUGAR-SOL',
          batchNumber: 'B-SUGAR-EXPIRED',
          rawMaterialBatch: {
            ...rawBatch,
            status: 'BLOCKED',
            expirationDate: '2025-01-01'
          },
          standardQuantity: 1400,
          actualDispensedQuantity: 1400,
          unitOfMeasure: 'L',
          dispensedBy: 'dispenser-omar'
        });
      } catch (err: any) {
        if (err.message.includes('Must be UNRESTRICTED')) blocked = true;
      }
      if (!blocked) throw new Error('Engine allowed dispensing from non-unrestricted batch');
    });

    record('P32D-04-20', 'Process Phase In-Process Parameters Execution Logging', () => {
      processOrder = ProcessManufacturingSubcontractingEngine.recordPhaseConfirmation({
        processOrder,
        phaseNumber: 20,
        workCenterId: 'WC-REACT-01',
        actualStartTime: '2026-09-10T09:00:00Z',
        actualEndTime: '2026-09-10T12:30:00Z',
        actualDurationHours: 3.5,
        recordedTemperature: 65.2,
        recordedPh: 5.48,
        operatorId: 'operator-youssef',
        notes: 'Reaction completed within critical quality attribute (CQA) limits'
      });

      if (processOrder.status !== 'IN_PROCESS') throw new Error('Order status should be IN_PROCESS');
      if (processOrder.phaseLogs.length !== 1) throw new Error('Phase execution log not recorded');
      if (processOrder.phaseLogs[0].recordedTemperature !== 65.2) throw new Error('Temperature log mismatch');
    });

    record('P32D-04-21', 'Process Order Yield with By-Product Net Realizable Credit', () => {
      // Total batch cost accumulated = $10,000.
      // By-Product yield: 20 KG of spent filter cake @ $5.00/KG = $100 credit.
      // Net batch cost = $9,900.
      // Co-Product: CP-RECOVERED-ALCOHOL gets 15% of $9,900 = $1,485.
      // Main Product FG-SYRUP-500ML gets 85% of $9,900 = $8,415.
      const { completedOrder, costAllocation } = ProcessManufacturingSubcontractingEngine.completeProcessOrderYield({
        processOrder,
        recipe: testRecipe,
        actualMainYieldQuantity: 1980, // L
        coProductYields: [
          { itemSku: 'CP-RECOVERED-ALCOHOL', batchNumber: 'B-ALC-001', quantity: 95 }
        ],
        byProductYields: [
          { itemSku: 'BP-SPENT-FILTER-CAKE', batchNumber: 'B-CAKE-001', quantity: 20 }
        ],
        totalAccumulatedCosts: 10000,
        completedBy: 'plant-operator-youssef'
      });

      processOrder = completedOrder;

      if (processOrder.status !== 'BULK_COMPLETE') throw new Error('Order status should be BULK_COMPLETE');
      if (costAllocation.byProductCreditTotal !== 100) {
        throw new Error(`Expected $100 by-product credit, got ${costAllocation.byProductCreditTotal}`);
      }
      if (costAllocation.coProductsCost['CP-RECOVERED-ALCOHOL'] !== 1485) {
        throw new Error(`Expected $1485 co-product cost, got ${costAllocation.coProductsCost['CP-RECOVERED-ALCOHOL']}`);
      }
      if (costAllocation.mainProductCost !== 8415) {
        throw new Error(`Expected $8415 main product cost, got ${costAllocation.mainProductCost}`);
      }
    });

    record('P32D-04-22', 'Decoupled Financial Event on Process Batch Yield', () => {
      const { financialEvent } = ProcessManufacturingSubcontractingEngine.completeProcessOrderYield({
        processOrder,
        recipe: testRecipe,
        actualMainYieldQuantity: 1980,
        coProductYields: [{ itemSku: 'CP-RECOVERED-ALCOHOL', batchNumber: 'B-ALC-001', quantity: 95 }],
        byProductYields: [{ itemSku: 'BP-SPENT-FILTER-CAKE', batchNumber: 'B-CAKE-001', quantity: 20 }],
        totalAccumulatedCosts: 10000,
        completedBy: 'plant-operator-youssef'
      });

      if (financialEvent.eventType !== 'PROCESS_BATCH_YIELD_POSTED') {
        throw new Error('Financial event type mismatch');
      }
      if (financialEvent.payload.mainProductCost !== 8415) {
        throw new Error('Event payload main product cost mismatch');
      }
    });

    // ========================================================================
    // 4. ADVANCED PLANNING & FINITE CAPACITY SCHEDULING (APS / CRP)
    // ========================================================================

    let wcDispensingProfile: WorkCenterCapacityProfile;
    let wcReactionProfile: WorkCenterCapacityProfile;

    record('P32D-04-23', 'Work Center Capacity Profile Calculation with Efficiency & Utilization', () => {
      // 2 shifts * 8 hrs/shift = 16 gross hours.
      // 90% machine efficiency * 85% utilization target = 0.90 * 0.85 = 0.765.
      // Net daily available hours = 16 * 0.765 = 12.24 hours.
      wcDispensingProfile = ProcessManufacturingSubcontractingEngine.createWorkCenterCapacityProfile({
        workCenterId: 'WC-DISP-01',
        workCenterCode: 'DISP-01',
        name: 'Cleanroom Dispensing Suite 1',
        shiftsPerDay: 2,
        hoursPerShift: 8,
        machineEfficiencyPercent: 90,
        utilizationTargetPercent: 85
      });

      wcReactionProfile = ProcessManufacturingSubcontractingEngine.createWorkCenterCapacityProfile({
        workCenterId: 'WC-REACT-01',
        workCenterCode: 'REACT-01',
        name: 'Main Reactor 5000L',
        shiftsPerDay: 3,
        hoursPerShift: 8, // 24 gross hrs
        machineEfficiencyPercent: 95,
        utilizationTargetPercent: 90 // 24 * 0.95 * 0.90 = 20.52 hrs
      });

      if (Math.abs(wcDispensingProfile.dailyAvailableHours - 12.24) > 0.01) {
        throw new Error(`Expected 12.24 available hours, got ${wcDispensingProfile.dailyAvailableHours}`);
      }
      if (Math.abs(wcReactionProfile.dailyAvailableHours - 20.52) > 0.01) {
        throw new Error(`Expected 20.52 available hours, got ${wcReactionProfile.dailyAvailableHours}`);
      }
    });

    record('P32D-04-24', 'Finite Forward Capacity Scheduling & Bucket Loading', () => {
      const scheduleResult = ProcessManufacturingSubcontractingEngine.runFiniteCapacitySchedule({
        operationsToSchedule: [
          {
            orderId: 'ORD-001',
            orderNumber: 'PRC-2026-00001',
            productFamily: 'SYRUP',
            operationNumber: 10,
            workCenterId: 'WC-DISP-01',
            setupHours: 1.0,
            runHours: 4.0, // Total = 5 hrs
            earliestStartDate: '2026-09-10'
          },
          {
            orderId: 'ORD-002',
            orderNumber: 'PRC-2026-00002',
            productFamily: 'SYRUP',
            operationNumber: 10,
            workCenterId: 'WC-DISP-01',
            setupHours: 1.0,
            runHours: 5.0, // Total = 6 hrs (5 + 6 = 11 hrs, fits within 12.24 daily capacity)
            earliestStartDate: '2026-09-10'
          }
        ],
        workCenterProfiles: [wcDispensingProfile],
        horizonDays: 5
      });

      if (scheduleResult.totalOperationsScheduled !== 2) throw new Error('Operations scheduled mismatch');
      const bucket = scheduleResult.buckets.find(b => b.bucketDate === '2026-09-10' && b.workCenterId === 'WC-DISP-01');
      if (!bucket) throw new Error('Target date bucket not found');
      if (bucket.loadedCapacityHours !== 11.0) throw new Error(`Bucket loaded hours expected 11.0, got ${bucket.loadedCapacityHours}`);
      if (bucket.isOverloaded) throw new Error('Bucket should not be overloaded');
    });

    record('P32D-04-25', 'Capacity Overload & Bottleneck Work Center Detection (>100% Load)', () => {
      const scheduleResult = ProcessManufacturingSubcontractingEngine.runFiniteCapacitySchedule({
        operationsToSchedule: [
          {
            orderId: 'ORD-HEAVY',
            orderNumber: 'PRC-2026-HEAVY',
            productFamily: 'SYRUP',
            operationNumber: 10,
            workCenterId: 'WC-DISP-01',
            setupHours: 2.0,
            runHours: 14.0, // 16 hrs > 12.24 hrs available!
            earliestStartDate: '2026-09-10'
          }
        ],
        workCenterProfiles: [wcDispensingProfile],
        horizonDays: 1 // Single day horizon forces overload
      });

      if (scheduleResult.bottlenecksIdentified.length === 0) {
        throw new Error('Bottleneck work center was not identified');
      }
      if (!scheduleResult.bottlenecksIdentified.includes('WC-DISP-01')) {
        throw new Error('WC-DISP-01 should be flagged as bottleneck');
      }
    });

    record('P32D-04-26', 'Setup-Optimized Changeover Sequencing Algorithm', () => {
      const result = ProcessManufacturingSubcontractingEngine.runFiniteCapacitySchedule({
        operationsToSchedule: [
          { orderId: 'O1', orderNumber: 'PRC-1', productFamily: 'DARK_COATING', operationNumber: 10, workCenterId: 'WC-REACT-01', setupHours: 2, runHours: 2, earliestStartDate: '2026-09-10' },
          { orderId: 'O2', orderNumber: 'PRC-2', productFamily: 'CLEAR_SYRUP', operationNumber: 10, workCenterId: 'WC-REACT-01', setupHours: 1, runHours: 2, earliestStartDate: '2026-09-10' },
          { orderId: 'O3', orderNumber: 'PRC-3', productFamily: 'DARK_COATING', operationNumber: 10, workCenterId: 'WC-REACT-01', setupHours: 2, runHours: 2, earliestStartDate: '2026-09-10' }
        ],
        workCenterProfiles: [wcReactionProfile],
        algorithm: 'SETUP_OPTIMIZED',
        changeoverMatrix: [
          { fromFamily: 'CLEAR_SYRUP', toFamily: 'DARK_COATING', changeoverSetupHours: 1, requiresWashdown: false },
          { fromFamily: 'DARK_COATING', toFamily: 'CLEAR_SYRUP', changeoverSetupHours: 4, requiresWashdown: true }
        ]
      });

      if (result.algorithm !== 'SETUP_OPTIMIZED') throw new Error('Algorithm name mismatch');
      if (result.totalOperationsScheduled !== 3) throw new Error('Operations count mismatch');
    });

    // ========================================================================
    // 5. SUBCONTRACTING & OUTSIDE PROCESSING (TOLL MANUFACTURING)
    // ========================================================================

    let subcontractOrder: SubcontractOrder;

    record('P32D-04-27', 'Subcontract Order Creation with Provided Components Derivation', () => {
      subcontractOrder = ProcessManufacturingSubcontractingEngine.createSubcontractOrder({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        vendorId: 'VEND-TOLL-COATERS-INC',
        vendorName: 'Apex Toll Coating & Blistering LLC',
        finishedItemSku: 'FG-BLISTER-PACK-10S',
        finishedItemDescription: 'Blister Pack 10 Tablets (Coated)',
        orderQuantity: 10000,
        serviceRatePerUnit: 0.25, // $0.25 service charge per unit -> $2,500 total
        unitOfMeasure: 'EA',
        deliveryDueDate: '2026-09-25',
        plantWarehouseId: 'WH-CENTRAL-RAW',
        providedComponents: [
          {
            componentSku: 'SA-UNCOATED-TAB',
            description: 'Uncoated Core Tablet',
            requiredQuantityPerUnit: 1.0, // 10,000 required
            unitCost: 0.15,
            unitOfMeasure: 'EA'
          },
          {
            componentSku: 'RM-ALU-FOIL',
            description: 'Aluminium Blister Foil 20um',
            requiredQuantityPerUnit: 0.002, // 20 KG required
            unitCost: 40.0,
            unitOfMeasure: 'KG'
          }
        ]
      });

      if (!subcontractOrder.id.startsWith('SC-ORD-')) throw new Error('Invalid subcontract order ID format');
      if (subcontractOrder.status !== 'DRAFT') throw new Error('Subcontract order should initialize in DRAFT');
      if (subcontractOrder.totalServiceCost !== 2500) throw new Error(`Expected $2500 service cost, got ${subcontractOrder.totalServiceCost}`);
      if (subcontractOrder.providedComponents[0].requiredQuantity !== 10000) throw new Error('Component 1 qty mismatch');
    });

    record('P32D-04-28', 'Subcontract Component Provision to Special Stock "O" & Event Emission', () => {
      // Issue 10,000 tabs and 20 KG foil to vendor
      const { updatedOrder, financialEvent } = ProcessManufacturingSubcontractingEngine.issueSubcontractComponents({
        subcontractOrder,
        componentIssues: [
          { componentSku: 'SA-UNCOATED-TAB', quantity: 10000 },
          { componentSku: 'RM-ALU-FOIL', quantity: 20 }
        ],
        issuedBy: 'storekeeper-hassan'
      });

      subcontractOrder = updatedOrder;

      if (subcontractOrder.status !== 'STOCK_ISSUED') throw new Error('Status should be STOCK_ISSUED');
      if (financialEvent.eventType !== 'SUBCONTRACT_STOCK_ISSUED') throw new Error('Event type mismatch');
      // 10000 * 0.15 ($1500) + 20 * 40 ($800) = $2300 total value transferred to Special Stock O
      if (financialEvent.payload.totalIssuedValue !== 2300) {
        throw new Error(`Expected $2300 issued stock value, got ${financialEvent.payload.totalIssuedValue}`);
      }
    });

    record('P32D-04-29', 'Subcontract Goods Receipt Segregation of Duties (Issuer Blocked)', () => {
      let blocked = false;
      try {
        ProcessManufacturingSubcontractingEngine.receiveSubcontractGoods({
          subcontractOrder,
          receivedQuantity: 5000,
          receivedBy: 'storekeeper-hassan' // Same user who issued the components
        });
      } catch (err: any) {
        if (err.message.includes('SoD Violation')) blocked = true;
      }
      if (!blocked) throw new Error('SoD check failed to block stock issuer from receiving finished goods');
    });

    record('P32D-04-30', 'Subcontract Goods Receipt & Component Backflush Valuation Settlement', () => {
      // Receive 50% (5,000 units).
      // Component cost consumed: 5,000 * $0.15 ($750) + 10 KG * $40 ($400) = $1,150.
      // Subcontract service fee: 5,000 * $0.25 = $1,250.
      // Total Finished Valuation = $1,150 + $1,250 = $2,400 ($0.48 per unit).
      const { updatedOrder, receiptResult } = ProcessManufacturingSubcontractingEngine.receiveSubcontractGoods({
        subcontractOrder,
        receivedQuantity: 5000,
        receivedBy: 'receiving-inspector-farouk'
      });

      subcontractOrder = updatedOrder;

      if (subcontractOrder.status !== 'PARTIALLY_RECEIVED') throw new Error('Status should be PARTIALLY_RECEIVED');
      if (receiptResult.totalComponentCostConsumed !== 1150) {
        throw new Error(`Expected $1150 component cost, got ${receiptResult.totalComponentCostConsumed}`);
      }
      if (receiptResult.totalServiceCharge !== 1250) {
        throw new Error(`Expected $1250 service charge, got ${receiptResult.totalServiceCharge}`);
      }
      if (receiptResult.totalFinishedValuation !== 2400) {
        throw new Error(`Expected $2400 finished valuation, got ${receiptResult.totalFinishedValuation}`);
      }
      if (receiptResult.finishedUnitCost !== 0.48) {
        throw new Error(`Expected $0.48 unit cost, got ${receiptResult.finishedUnitCost}`);
      }
    });

    record('P32D-04-31', 'Subcontract Component Over-Consumption / Extra Scrap Detection', () => {
      // Receiving remaining 5,000 units, but vendor reports 2 extra KG foil scrap (needs 10 + 2 = 12 KG, but only 10 left in Special Stock O!)
      let blocked = false;
      try {
        ProcessManufacturingSubcontractingEngine.receiveSubcontractGoods({
          subcontractOrder,
          receivedQuantity: 5000,
          receivedBy: 'receiving-inspector-farouk',
          actualComponentScrap: {
            'RM-ALU-FOIL': 2.0 // Exceeds remaining issued stock!
          }
        });
      } catch (err: any) {
        if (err.message.includes("Insufficient issued Special Stock 'O'")) blocked = true;
      }
      if (!blocked) throw new Error('Engine failed to block consumption exceeding issued vendor stock');
    });

    // ========================================================================
    // 6. REPETITIVE MANUFACTURING & ELECTRONIC KANBAN (REM / PULL)
    // ========================================================================

    let prodLine: ProductionLine;
    let kanbanCycle: KanbanControlCycle;

    record('P32D-04-32', 'Repetitive Production Line Definition & Takt-to-Rate Conversion', () => {
      // Takt time = 45 seconds per unit.
      // Hourly rate = 3600 / 45 = 80 units/hour.
      prodLine = ProcessManufacturingSubcontractingEngine.createProductionLine({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        lineCode: 'LINE-PACK-01',
        lineName: 'High-Speed Automated Packaging Line 1',
        taktTimeSeconds: 45,
        activeWorkCenters: ['WC-FILL-01', 'WC-SEAL-01', 'WC-CARTON-01']
      });

      if (prodLine.designHourlyRate !== 80) {
        throw new Error(`Expected 80 units/hr, got ${prodLine.designHourlyRate}`);
      }
    });

    record('P32D-04-33', 'Electronic Kanban Control Cycle & Container Initialization', () => {
      kanbanCycle = ProcessManufacturingSubcontractingEngine.createKanbanControlCycle({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        controlCycleCode: 'CC-SYRUP-CAP-28MM',
        materialSku: 'RM-CAP-28MM-TAMPER',
        materialName: '28mm Child-Resistant Tamper-Evident Cap',
        supplyArea: 'LINE-SIDE-BIN-04',
        sourceType: 'IN_HOUSE',
        sourceLocation: 'WC-MOLD-02',
        containerQuantity: 500, // 500 caps per container bin
        numberOfContainers: 3,  // 3 bins circulating
        productionLineId: prodLine.id,
        createdBy: 'lean-engineer-samy'
      });

      if (kanbanCycle.containers.length !== 3) throw new Error('Expected 3 containers');
      if (kanbanCycle.containers[0].status !== 'FULL') throw new Error('Containers should initialize FULL');
    });

    record('P32D-04-34', 'Kanban EMPTY Scan & Automated Replenishment Signal Generation', () => {
      const container1 = kanbanCycle.containers[0].containerId;
      const { updatedControlCycle, replenishmentSignal } = ProcessManufacturingSubcontractingEngine.triggerKanbanEmpty({
        controlCycle: kanbanCycle,
        containerId: container1
      });

      kanbanCycle = updatedControlCycle;

      const bin = kanbanCycle.containers.find(c => c.containerId === container1);
      if (bin?.status !== 'EMPTY') throw new Error('Container status should be EMPTY');
      if (!replenishmentSignal.replenishmentOrderRef.startsWith('REPL-KB-')) {
        throw new Error('Replenishment signal order ref missing');
      }
      if (replenishmentSignal.targetQuantity !== 500) {
        throw new Error('Target replenishment quantity mismatch');
      }
    });

    record('P32D-04-35', 'Kanban FULL Scan, Automated Backflush & Financial Event Emission', () => {
      const container1 = kanbanCycle.containers[0].containerId;
      const { updatedControlCycle, backflushResult } = ProcessManufacturingSubcontractingEngine.triggerKanbanFullAndBackflush({
        controlCycle: kanbanCycle,
        containerId: container1,
        bomComponentsToDeduct: [
          { itemSku: 'RM-RESIN-HDPE', quantityPerUnit: 0.005 } // 500 caps * 0.005 = 2.5 KG resin
        ]
      });

      kanbanCycle = updatedControlCycle;

      const bin = kanbanCycle.containers.find(c => c.containerId === container1);
      if (bin?.status !== 'FULL') throw new Error('Container status should be FULL');
      if (bin.currentReplenishmentOrderRef !== undefined) throw new Error('Replenishment ref should be cleared');
      if (backflushResult.financialEvent.eventType !== 'KANBAN_CONTAINER_BACKFLUSHED') {
        throw new Error('Financial event type mismatch');
      }
      if (backflushResult.componentsDeducted[0].quantity !== 2.5) {
        throw new Error(`Expected 2.5 KG resin deducted, got ${backflushResult.componentsDeducted[0].quantity}`);
      }
    });

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    return {
      phase: 'Phase 3.2D-04 — Process Manufacturing, Finite Capacity Scheduling, Subcontracting & Electronic Kanban',
      total: results.length,
      passed,
      failed,
      results
    };
  }
}
