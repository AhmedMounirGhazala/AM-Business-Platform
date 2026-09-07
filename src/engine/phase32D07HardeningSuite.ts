/**
 * AM Enterprise ERP — Phase 3.2D-07 Hardening Test Suite
 * Repetitive Manufacturing, Circular Remanufacturing & Core Returns,
 * Potency Balancing & Shop Floor Andon Orchestration
 */

import { RepetitiveRemanufacturingAndonEngine } from './repetitiveRemanufacturingAndonEngine';

export interface HardeningTestResult {
  id: string;
  name: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

export class Phase32D07HardeningSuite {
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
    // SECTION 1: REPETITIVE MANUFACTURING & TAKT-TIME BACKFLUSH (TESTS 01 - 07)
    // =========================================================================

    runTest('3.2D-07-01', 'Repetitive Schedule Creation & Takt Time Validation', () => {
      const sched = RepetitiveRemanufacturingAndonEngine.createRepetitiveSchedule({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        scheduleCode: 'REM-AUTO-LINE-01',
        productSku: 'PART-PUMP-ASM',
        productionLineId: 'LINE-ASSEMBLY-01',
        validFrom: '2026-09-01',
        validTo: '2026-09-30',
        taktTimeSeconds: 45,
        plannedDailyRate: 640,
        totalPlannedUnits: 12800,
        bomId: 'BOM-PUMP-V1',
        routingId: 'ROUT-PUMP-REM',
        reportingPoints: [
          { sequence: 10, operationName: 'Stator Pre-Assembly', workCenterId: 'WC-STAT-01' },
          { sequence: 20, operationName: 'Rotor Balancing', workCenterId: 'WC-ROTOR-01' },
          { sequence: 30, operationName: 'Final Enclosure & Test', workCenterId: 'WC-TEST-01' }
        ]
      });

      if (sched.status !== 'ACTIVE') throw new Error('Schedule must be ACTIVE upon creation');
      if (sched.reportingPoints.length !== 3) throw new Error('Must have 3 reporting points');
      if (sched.taktTimeSeconds !== 45) throw new Error('Takt time mismatch');
      if (!sched.auditHash || sched.auditHash.length !== 64) throw new Error('Invalid SHA-256 audit hash');
    });

    runTest('3.2D-07-02', 'Reject Non-Positive Takt Time or Planned Rates', () => {
      let threw = false;
      try {
        RepetitiveRemanufacturingAndonEngine.createRepetitiveSchedule({
          tenantId: 'TEN-01',
          companyId: 'COMP-01',
          scheduleCode: 'REM-INVALID',
          productSku: 'PART-01',
          productionLineId: 'LINE-01',
          validFrom: '2026-09-01',
          validTo: '2026-09-30',
          taktTimeSeconds: -10, // Invalid negative
          plannedDailyRate: 500,
          totalPlannedUnits: 1000,
          bomId: 'BOM-01',
          routingId: 'ROUT-01',
          reportingPoints: [{ sequence: 10, operationName: 'Op1', workCenterId: 'WC-01' }]
        });
      } catch (err: any) {
        threw = true;
      }
      if (!threw) throw new Error('Must throw error on negative takt time');
    });

    runTest('3.2D-07-03', 'Repetitive Backflush Cumulative Quantities & Financial Event', () => {
      const sched = RepetitiveRemanufacturingAndonEngine.createRepetitiveSchedule({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        scheduleCode: 'REM-PUMP-02',
        productSku: 'PART-PUMP-ASM',
        productionLineId: 'LINE-01',
        validFrom: '2026-09-01',
        validTo: '2026-09-30',
        taktTimeSeconds: 40,
        plannedDailyRate: 500,
        totalPlannedUnits: 1000,
        bomId: 'BOM-01',
        routingId: 'ROUT-01',
        reportingPoints: [
          { sequence: 10, operationName: 'Subassembly', workCenterId: 'WC-01' },
          { sequence: 20, operationName: 'Final Pack', workCenterId: 'WC-02' }
        ]
      });

      const bf = RepetitiveRemanufacturingAndonEngine.executeRepetitiveBackflush({
        schedule: sched,
        reportingPointSeq: 10,
        backflushQty: 50,
        scrapQty: 2,
        operatorId: 'OP-CHRIS'
      });

      if (bf.schedule.reportingPoints[0].cumulativeCompletedQty !== 50) throw new Error('Cumulative completed mismatch');
      if (bf.schedule.reportingPoints[0].cumulativeScrapQty !== 2) throw new Error('Cumulative scrap mismatch');
      if (bf.financialEvent.eventType !== 'EVT_REPETITIVE_BACKFLUSH_SETTLED') throw new Error('Invalid financial event');

      // Check double-entry accounting balance
      const debits = bf.financialEvent.glPostings.reduce((sum, p) => sum + p.debit, 0);
      const credits = bf.financialEvent.glPostings.reduce((sum, p) => sum + p.credit, 0);
      if (Math.abs(debits - credits) > 0.01) {
        throw new Error(`Financial event unbalanced: debits ${debits} != credits ${credits}`);
      }
    });

    runTest('3.2D-07-04', 'Multi-Reporting Point Sequential Backflush & Final Schedule Completion', () => {
      let sched = RepetitiveRemanufacturingAndonEngine.createRepetitiveSchedule({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        scheduleCode: 'REM-BATCH-03',
        productSku: 'PART-MOTOR',
        productionLineId: 'LINE-02',
        validFrom: '2026-09-01',
        validTo: '2026-09-30',
        taktTimeSeconds: 30,
        plannedDailyRate: 100,
        totalPlannedUnits: 100, // Small planned batch to test completion
        bomId: 'BOM-01',
        routingId: 'ROUT-01',
        reportingPoints: [
          { sequence: 10, operationName: 'Op 10', workCenterId: 'WC-01' },
          { sequence: 20, operationName: 'Op 20 (Final)', workCenterId: 'WC-02' }
        ]
      });

      // Backflush point 10
      const res1 = RepetitiveRemanufacturingAndonEngine.executeRepetitiveBackflush({
        schedule: sched,
        reportingPointSeq: 10,
        backflushQty: 100,
        operatorId: 'OP-01'
      });
      sched = res1.schedule;

      // Final point 20 backflush
      const res2 = RepetitiveRemanufacturingAndonEngine.executeRepetitiveBackflush({
        schedule: sched,
        reportingPointSeq: 20,
        backflushQty: 100,
        operatorId: 'OP-02'
      });
      sched = res2.schedule;

      if (sched.totalReportedUnits !== 100) throw new Error('Total reported units should be 100');
      if (sched.status !== 'COMPLETED') throw new Error('Schedule must transition to COMPLETED when planned target reached');
    });

    runTest('3.2D-07-05', 'Reject Backflush on Non-Existent Reporting Point', () => {
      const sched = RepetitiveRemanufacturingAndonEngine.createRepetitiveSchedule({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        scheduleCode: 'REM-PUMP-04',
        productSku: 'PART-01',
        productionLineId: 'LINE-01',
        validFrom: '2026-09-01',
        validTo: '2026-09-30',
        taktTimeSeconds: 40,
        plannedDailyRate: 500,
        totalPlannedUnits: 1000,
        bomId: 'BOM-01',
        routingId: 'ROUT-01',
        reportingPoints: [{ sequence: 10, operationName: 'Subassembly', workCenterId: 'WC-01' }]
      });

      let threw = false;
      try {
        RepetitiveRemanufacturingAndonEngine.executeRepetitiveBackflush({
          schedule: sched,
          reportingPointSeq: 99, // Invalid sequence
          backflushQty: 10,
          operatorId: 'OP-01'
        });
      } catch (err: any) {
        threw = true;
      }
      if (!threw) throw new Error('Must reject backflush on invalid sequence');
    });

    runTest('3.2D-07-06', 'Reject Negative Scrap or Zero Backflush Quantities', () => {
      const sched = RepetitiveRemanufacturingAndonEngine.createRepetitiveSchedule({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        scheduleCode: 'REM-PUMP-05',
        productSku: 'PART-01',
        productionLineId: 'LINE-01',
        validFrom: '2026-09-01',
        validTo: '2026-09-30',
        taktTimeSeconds: 40,
        plannedDailyRate: 500,
        totalPlannedUnits: 1000,
        bomId: 'BOM-01',
        routingId: 'ROUT-01',
        reportingPoints: [{ sequence: 10, operationName: 'Subassembly', workCenterId: 'WC-01' }]
      });

      let threw = false;
      try {
        RepetitiveRemanufacturingAndonEngine.executeRepetitiveBackflush({
          schedule: sched,
          reportingPointSeq: 10,
          backflushQty: 0, // Zero invalid
          operatorId: 'OP-01'
        });
      } catch (err: any) {
        threw = true;
      }
      if (!threw) throw new Error('Must reject zero backflush qty');
    });

    runTest('3.2D-07-07', 'Reject Backflush Against Inactive or Completed Schedule', () => {
      const sched = RepetitiveRemanufacturingAndonEngine.createRepetitiveSchedule({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        scheduleCode: 'REM-PUMP-06',
        productSku: 'PART-01',
        productionLineId: 'LINE-01',
        validFrom: '2026-09-01',
        validTo: '2026-09-30',
        taktTimeSeconds: 40,
        plannedDailyRate: 500,
        totalPlannedUnits: 1000,
        bomId: 'BOM-01',
        routingId: 'ROUT-01',
        reportingPoints: [{ sequence: 10, operationName: 'Subassembly', workCenterId: 'WC-01' }]
      });
      sched.status = 'ON_HOLD';

      let threw = false;
      try {
        RepetitiveRemanufacturingAndonEngine.executeRepetitiveBackflush({
          schedule: sched,
          reportingPointSeq: 10,
          backflushQty: 10,
          operatorId: 'OP-01'
        });
      } catch (err: any) {
        threw = true;
      }
      if (!threw) throw new Error('Must reject backflush on ON_HOLD schedule');
    });

    // =========================================================================
    // SECTION 2: CIRCULAR REMANUFACTURING & CORE HARVESTING (TESTS 08 - 16)
    // =========================================================================

    runTest('3.2D-07-08', 'Reman Core Return Creation & Grade A 100% Credit', () => {
      const { teardownOrder, financialEvent } = RepetitiveRemanufacturingAndonEngine.createCoreReturnAndTeardown({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        orderNumber: 'REMAN-2026-001',
        coreReturnSerial: 'CORE-ENG-99881',
        parentProductSku: 'HEAVY-ENGINE-V8',
        customerAccountId: 'CUST-FLEET-LOGISTICS',
        conditionGrade: 'GRADE_A_REFURBISHABLE',
        coreDepositAmountUsd: 1200.00,
        disassemblyWorkCenterId: 'WC-TEARDOWN-01',
        technicianId: 'TECH-BOB'
      });

      if (teardownOrder.coreCreditApprovedUsd !== 1200.00) {
        throw new Error(`Grade A must receive 100% credit ($1200.00), got ${teardownOrder.coreCreditApprovedUsd}`);
      }
      if (teardownOrder.status !== 'INSPECTION_COMPLETED') throw new Error('Status must be INSPECTION_COMPLETED');
      if (financialEvent.eventType !== 'EVT_CORE_DEPOSIT_RECOVERED') throw new Error('Invalid financial event type');
    });

    runTest('3.2D-07-09', 'Reman Core Grade B 75% Deposit Credit Validation', () => {
      const { teardownOrder } = RepetitiveRemanufacturingAndonEngine.createCoreReturnAndTeardown({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        orderNumber: 'REMAN-2026-002',
        coreReturnSerial: 'CORE-ENG-99882',
        parentProductSku: 'HEAVY-ENGINE-V8',
        customerAccountId: 'CUST-FLEET-LOGISTICS',
        conditionGrade: 'GRADE_B_MINOR_DEFECTS',
        coreDepositAmountUsd: 1000.00,
        disassemblyWorkCenterId: 'WC-TEARDOWN-01',
        technicianId: 'TECH-BOB'
      });

      if (teardownOrder.coreCreditApprovedUsd !== 750.00) {
        throw new Error(`Grade B must receive 75% credit ($750.00), got ${teardownOrder.coreCreditApprovedUsd}`);
      }
    });

    runTest('3.2D-07-10', 'Reman Core Grade C 40% Deposit Credit Validation', () => {
      const { teardownOrder } = RepetitiveRemanufacturingAndonEngine.createCoreReturnAndTeardown({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        orderNumber: 'REMAN-2026-003',
        coreReturnSerial: 'CORE-ENG-99883',
        parentProductSku: 'HEAVY-ENGINE-V8',
        customerAccountId: 'CUST-02',
        conditionGrade: 'GRADE_C_HARVEST_ONLY',
        coreDepositAmountUsd: 1000.00,
        disassemblyWorkCenterId: 'WC-TEARDOWN-01',
        technicianId: 'TECH-BOB'
      });

      if (teardownOrder.coreCreditApprovedUsd !== 400.00) {
        throw new Error(`Grade C must receive 40% credit ($400.00), got ${teardownOrder.coreCreditApprovedUsd}`);
      }
    });

    runTest('3.2D-07-11', 'Reman Core Grade D Scrap 0% Deposit Credit Validation', () => {
      const { teardownOrder } = RepetitiveRemanufacturingAndonEngine.createCoreReturnAndTeardown({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        orderNumber: 'REMAN-2026-004',
        coreReturnSerial: 'CORE-ENG-99884',
        parentProductSku: 'HEAVY-ENGINE-V8',
        customerAccountId: 'CUST-03',
        conditionGrade: 'GRADE_D_SCRAP',
        coreDepositAmountUsd: 1000.00,
        disassemblyWorkCenterId: 'WC-TEARDOWN-01',
        technicianId: 'TECH-BOB'
      });

      if (teardownOrder.coreCreditApprovedUsd !== 0.00) {
        throw new Error(`Grade D scrap must receive 0% credit ($0.00), got ${teardownOrder.coreCreditApprovedUsd}`);
      }
    });

    runTest('3.2D-07-12', 'Harvested Components Salvage Valuation & Bin Storage Tracking', () => {
      const { teardownOrder } = RepetitiveRemanufacturingAndonEngine.createCoreReturnAndTeardown({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        orderNumber: 'REMAN-2026-005',
        coreReturnSerial: 'CORE-TRANSMISSION-01',
        parentProductSku: 'TRANS-HEAVY-10S',
        customerAccountId: 'CUST-HAULING',
        conditionGrade: 'GRADE_B_MINOR_DEFECTS',
        coreDepositAmountUsd: 800.00,
        disassemblyWorkCenterId: 'WC-DISASSEMBLY-02',
        technicianId: 'TECH-ALICE',
        teardownCostUsd: 60.00,
        harvestedComponents: [
          {
            componentSku: 'GEAR-PINION-01',
            componentName: 'Main Pinion Gear',
            recoveredQuantity: 2,
            standardCostUsd: 250.00,
            salvageValueUsd: 180.00,
            disposition: 'RETURN_TO_STOCK',
            targetBinLocation: 'BIN-REMAN-A1'
          },
          {
            componentSku: 'SHAFT-DRIVE-02',
            componentName: 'Hardened Drive Shaft',
            recoveredQuantity: 1,
            standardCostUsd: 400.00,
            salvageValueUsd: 320.00,
            disposition: 'REFURBISH',
            targetBinLocation: 'BIN-REMAN-B4'
          }
        ]
      });

      // Total salvaged value = (2 * 180) + (1 * 320) = 360 + 320 = 680.00
      if (teardownOrder.totalSalvagedValueUsd !== 680.00) {
        throw new Error(`Expected $680.00 total salvaged value, got ${teardownOrder.totalSalvagedValueUsd}`);
      }
      if (teardownOrder.status !== 'DISASSEMBLED') {
        throw new Error('Status must be DISASSEMBLED when harvested components are present');
      }
    });

    runTest('3.2D-07-13', 'Net Economic Benefit Calculation on Reman Teardown', () => {
      // Core credit = 800 * 0.75 = 600.00. Teardown cost = 60.00. Salvaged value = 680.00.
      // Net benefit = 680.00 - 60.00 - 600.00 = +20.00
      const { teardownOrder } = RepetitiveRemanufacturingAndonEngine.createCoreReturnAndTeardown({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        orderNumber: 'REMAN-2026-006',
        coreReturnSerial: 'CORE-TRANS-02',
        parentProductSku: 'TRANS-01',
        customerAccountId: 'CUST-01',
        conditionGrade: 'GRADE_B_MINOR_DEFECTS',
        coreDepositAmountUsd: 800.00,
        disassemblyWorkCenterId: 'WC-01',
        technicianId: 'TECH-ALICE',
        teardownCostUsd: 60.00,
        harvestedComponents: [
          {
            componentSku: 'GEAR-01',
            componentName: 'Gear',
            recoveredQuantity: 2,
            standardCostUsd: 250.00,
            salvageValueUsd: 180.00,
            disposition: 'RETURN_TO_STOCK',
            targetBinLocation: 'BIN-01'
          },
          {
            componentSku: 'SHAFT-01',
            componentName: 'Shaft',
            recoveredQuantity: 1,
            standardCostUsd: 400.00,
            salvageValueUsd: 320.00,
            disposition: 'REFURBISH',
            targetBinLocation: 'BIN-02'
          }
        ]
      });

      if (teardownOrder.netEconomicBenefitUsd !== 20.00) {
        throw new Error(`Expected net economic benefit of $20.00, got ${teardownOrder.netEconomicBenefitUsd}`);
      }
    });

    runTest('3.2D-07-14', 'Reman Financial Event Double-Entry Balanced GL Verification', () => {
      const { financialEvent } = RepetitiveRemanufacturingAndonEngine.createCoreReturnAndTeardown({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        orderNumber: 'REMAN-2026-007',
        coreReturnSerial: 'CORE-TEST',
        parentProductSku: 'SKU-01',
        customerAccountId: 'CUST-01',
        conditionGrade: 'GRADE_A_REFURBISHABLE',
        coreDepositAmountUsd: 500.00,
        disassemblyWorkCenterId: 'WC-01',
        technicianId: 'TECH-ALICE',
        harvestedComponents: [
          {
            componentSku: 'PART-01',
            componentName: 'Part',
            recoveredQuantity: 1,
            standardCostUsd: 600.00,
            salvageValueUsd: 600.00,
            disposition: 'RETURN_TO_STOCK',
            targetBinLocation: 'BIN-01'
          }
        ]
      });

      const debits = financialEvent.glPostings.reduce((sum: number, p: any) => sum + p.debit, 0);
      const credits = financialEvent.glPostings.reduce((sum: number, p: any) => sum + p.credit, 0);
      if (Math.abs(debits - credits) > 0.01) {
        throw new Error(`Reman GL postings unbalanced: debits ${debits} != credits ${credits}`);
      }
    });

    runTest('3.2D-07-15', 'Reject Missing Core Serial or Customer Identifier', () => {
      let threw = false;
      try {
        RepetitiveRemanufacturingAndonEngine.createCoreReturnAndTeardown({
          tenantId: 'TEN-01',
          companyId: 'COMP-01',
          orderNumber: 'REMAN-ERR',
          coreReturnSerial: '', // Missing
          parentProductSku: 'SKU-01',
          customerAccountId: 'CUST-01',
          conditionGrade: 'GRADE_A_REFURBISHABLE',
          coreDepositAmountUsd: 100.00,
          disassemblyWorkCenterId: 'WC-01',
          technicianId: 'TECH-01'
        });
      } catch (err: any) {
        threw = true;
      }
      if (!threw) throw new Error('Must reject missing core serial number');
    });

    runTest('3.2D-07-16', 'Reject Negative Core Deposit Value', () => {
      let threw = false;
      try {
        RepetitiveRemanufacturingAndonEngine.createCoreReturnAndTeardown({
          tenantId: 'TEN-01',
          companyId: 'COMP-01',
          orderNumber: 'REMAN-ERR',
          coreReturnSerial: 'SN-01',
          parentProductSku: 'SKU-01',
          customerAccountId: 'CUST-01',
          conditionGrade: 'GRADE_A_REFURBISHABLE',
          coreDepositAmountUsd: -50.00, // Negative invalid
          disassemblyWorkCenterId: 'WC-01',
          technicianId: 'TECH-01'
        });
      } catch (err: any) {
        threw = true;
      }
      if (!threw) throw new Error('Must reject negative core deposit amount');
    });

    // =========================================================================
    // SECTION 3: ACTIVE INGREDIENT POTENCY BALANCING (TESTS 17 - 23)
    // =========================================================================

    runTest('3.2D-07-17', 'Active Ingredient Potency Balancing Assay Calculation', () => {
      // Nominal active: 50 kg at 100%. Assay potency: 92.5%.
      // Factor = 100 / 92.5 = 1.081081...
      // Adjusted active = 50 * 1.081081 = 54.054 kg
      // Delta active = +4.054 kg
      // Nominal filler: 200 kg -> Compensated filler = 200 - 4.054 = 195.946 kg
      const result = RepetitiveRemanufacturingAndonEngine.balancePotencyAndCompensateRecipe({
        formulaId: 'FORMULA-PARACETAMOL-500MG',
        batchSizeKg: 250,
        activeIngredient: {
          sku: 'API-PARACETAMOL-RAW',
          nominalQtyKg: 50.0,
          assay: {
            ingredientSku: 'API-PARACETAMOL-RAW',
            ingredientName: 'Paracetamol USP Active',
            lotNumber: 'LOT-API-2026-99',
            nominalPotencyPct: 100.0,
            actualAssayPotencyPct: 92.5,
            testedAt: '2026-09-02T10:00:00Z',
            analystId: 'CHEM-SARAH'
          }
        },
        fillerExcipient: {
          sku: 'EXC-MICRO-CELLULOSE',
          lotNumber: 'LOT-EXC-101',
          nominalQtyKg: 200.0
        },
        pharmacistSignature: 'SIG-PHARMACIST-DR-EVANS'
      });

      if (result.activeIngredient.adjustedQtyKg !== 54.054) {
        throw new Error(`Expected adjusted active 54.054 kg, got ${result.activeIngredient.adjustedQtyKg}`);
      }
      if (result.fillerExcipient.compensatedQtyKg !== 195.946) {
        throw new Error(`Expected compensated filler 195.946 kg, got ${result.fillerExcipient.compensatedQtyKg}`);
      }
    });

    runTest('3.2D-07-18', 'Total Batch Weight Conservation (0.000g Variance Guarantee)', () => {
      const result = RepetitiveRemanufacturingAndonEngine.balancePotencyAndCompensateRecipe({
        formulaId: 'FORM-01',
        batchSizeKg: 100,
        activeIngredient: {
          sku: 'API-01',
          nominalQtyKg: 20.0,
          assay: {
            ingredientSku: 'API-01',
            ingredientName: 'Active',
            lotNumber: 'LOT-01',
            nominalPotencyPct: 100.0,
            actualAssayPotencyPct: 95.0,
            testedAt: '2026-09-01',
            analystId: 'CHEM-01'
          }
        },
        fillerExcipient: {
          sku: 'EXC-01',
          lotNumber: 'LOT-02',
          nominalQtyKg: 80.0
        },
        pharmacistSignature: 'SIG-DR-01'
      });

      if (result.totalBatchWeightKg !== 100.0) {
        throw new Error(`Batch weight drifted: expected 100.0 kg, got ${result.totalBatchWeightKg}`);
      }
      if (result.weightVarianceGrams !== 0) {
        throw new Error(`Weight variance in grams must be 0, got ${result.weightVarianceGrams}`);
      }
    });

    runTest('3.2D-07-19', 'Potency Compensation with Multi-Excipient Other Ingredients', () => {
      const result = RepetitiveRemanufacturingAndonEngine.balancePotencyAndCompensateRecipe({
        formulaId: 'FORM-02',
        batchSizeKg: 120,
        activeIngredient: {
          sku: 'API-02',
          nominalQtyKg: 30.0,
          assay: {
            ingredientSku: 'API-02',
            ingredientName: 'Active',
            lotNumber: 'LOT-01',
            nominalPotencyPct: 100.0,
            actualAssayPotencyPct: 98.0,
            testedAt: '2026-09-01',
            analystId: 'CHEM-01'
          }
        },
        fillerExcipient: {
          sku: 'EXC-01',
          lotNumber: 'LOT-02',
          nominalQtyKg: 70.0
        },
        otherIngredients: [
          { sku: 'BINDER-POVIDONE', qtyKg: 10.0 },
          { sku: 'LUBRICANT-MAG-STEARATE', qtyKg: 10.0 }
        ],
        pharmacistSignature: 'SIG-DR-01'
      });

      if (result.totalBatchWeightKg !== 120.0) {
        throw new Error(`Expected total batch weight 120.0 kg, got ${result.totalBatchWeightKg}`);
      }
      if (result.otherIngredients.length !== 2) throw new Error('Other ingredients must be preserved');
    });

    runTest('3.2D-07-20', 'Reject Out-of-Spec Low Potency Assay (< 70%)', () => {
      let threw = false;
      try {
        RepetitiveRemanufacturingAndonEngine.balancePotencyAndCompensateRecipe({
          formulaId: 'FORM-03',
          batchSizeKg: 100,
          activeIngredient: {
            sku: 'API-01',
            nominalQtyKg: 20.0,
            assay: {
              ingredientSku: 'API-01',
              ingredientName: 'Active',
              lotNumber: 'LOT-FAIL',
              nominalPotencyPct: 100.0,
              actualAssayPotencyPct: 65.0, // Sub-potent lot
              testedAt: '2026-09-01',
              analystId: 'CHEM-01'
            }
          },
          fillerExcipient: {
            sku: 'EXC-01',
            lotNumber: 'LOT-02',
            nominalQtyKg: 80.0
          },
          pharmacistSignature: 'SIG-01'
        });
      } catch (err: any) {
        threw = true;
      }
      if (!threw) throw new Error('Must reject potency assay < 70%');
    });

    runTest('3.2D-07-21', 'Reject Out-of-Spec High Potency Assay (> 130%)', () => {
      let threw = false;
      try {
        RepetitiveRemanufacturingAndonEngine.balancePotencyAndCompensateRecipe({
          formulaId: 'FORM-04',
          batchSizeKg: 100,
          activeIngredient: {
            sku: 'API-01',
            nominalQtyKg: 20.0,
            assay: {
              ingredientSku: 'API-01',
              ingredientName: 'Active',
              lotNumber: 'LOT-FAIL-HIGH',
              nominalPotencyPct: 100.0,
              actualAssayPotencyPct: 145.0, // Hyper-potent lot
              testedAt: '2026-09-01',
              analystId: 'CHEM-01'
            }
          },
          fillerExcipient: {
            sku: 'EXC-01',
            lotNumber: 'LOT-02',
            nominalQtyKg: 80.0
          },
          pharmacistSignature: 'SIG-01'
        });
      } catch (err: any) {
        threw = true;
      }
      if (!threw) throw new Error('Must reject potency assay > 130%');
    });

    runTest('3.2D-07-22', 'Reject When Required Active Exceeds Available Filler Mass', () => {
      let threw = false;
      try {
        RepetitiveRemanufacturingAndonEngine.balancePotencyAndCompensateRecipe({
          formulaId: 'FORM-05',
          batchSizeKg: 100,
          activeIngredient: {
            sku: 'API-01',
            nominalQtyKg: 95.0, // High active ratio
            assay: {
              ingredientSku: 'API-01',
              ingredientName: 'Active',
              lotNumber: 'LOT-01',
              nominalPotencyPct: 100.0,
              actualAssayPotencyPct: 80.0, // requires +23.75 kg more active
              testedAt: '2026-09-01',
              analystId: 'CHEM-01'
            }
          },
          fillerExcipient: {
            sku: 'EXC-01',
            lotNumber: 'LOT-02',
            nominalQtyKg: 5.0 // Only 5 kg filler available! Cannot deduct 23.75 kg
          },
          pharmacistSignature: 'SIG-01'
        });
      } catch (err: any) {
        threw = true;
      }
      if (!threw) throw new Error('Must throw when excipient mass is insufficient');
    });

    runTest('3.2D-07-23', 'Reject Potency Compensation Without Qualified Pharmacist Signature', () => {
      let threw = false;
      try {
        RepetitiveRemanufacturingAndonEngine.balancePotencyAndCompensateRecipe({
          formulaId: 'FORM-06',
          batchSizeKg: 100,
          activeIngredient: {
            sku: 'API-01',
            nominalQtyKg: 20.0,
            assay: {
              ingredientSku: 'API-01',
              ingredientName: 'Active',
              lotNumber: 'LOT-01',
              nominalPotencyPct: 100.0,
              actualAssayPotencyPct: 98.0,
              testedAt: '2026-09-01',
              analystId: 'CHEM-01'
            }
          },
          fillerExcipient: {
            sku: 'EXC-01',
            lotNumber: 'LOT-02',
            nominalQtyKg: 80.0
          },
          pharmacistSignature: '' // Missing signature
        });
      } catch (err: any) {
        threw = true;
      }
      if (!threw) throw new Error('Must reject compensation without pharmacist digital signature');
    });

    // =========================================================================
    // SECTION 4: JOINT COST SPLIT-OFF SETTLEMENT (TESTS 24 - 29)
    // =========================================================================

    runTest('3.2D-07-24', 'Joint Cost Apportionment via SALES_VALUE_SPLITOFF Method', () => {
      const settlement = RepetitiveRemanufacturingAndonEngine.settleJointProductionCostSplitOff({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        productionBatchId: 'BATCH-PETRO-REF-01',
        totalJointCostUsd: 100000.00,
        splitMethod: 'SALES_VALUE_SPLITOFF',
        products: [
          {
            productSku: 'GASOLINE-PREMIUM',
            productName: 'Premium Motor Gasoline',
            productType: 'MAIN_PRODUCT',
            quantityProduced: 50000,
            unitOfMeasure: 'GAL',
            marketPricePerUnitUsd: 3.00 // $150k value (60%)
          },
          {
            productSku: 'DIESEL-ULTRA',
            productName: 'Ultra-Low Sulfur Diesel',
            productType: 'CO_PRODUCT',
            quantityProduced: 25000,
            unitOfMeasure: 'GAL',
            marketPricePerUnitUsd: 3.00 // $75k value (30%)
          },
          {
            productSku: 'ASPHALT-HEAVY',
            productName: 'Paving Asphalt Residual',
            productType: 'BY_PRODUCT',
            quantityProduced: 25000,
            unitOfMeasure: 'GAL',
            marketPricePerUnitUsd: 1.00 // $25k value (10%)
          }
        ]
      });

      // Total market value = $150k + $75k + $25k = $250k.
      // Gasoline (60%) = $60,000. Diesel (30%) = $30,000. Asphalt (10%) = $10,000.
      if (settlement.outputs[0].allocatedJointCostUsd !== 60000.00) {
        throw new Error(`Gasoline allocation error: expected $60000, got ${settlement.outputs[0].allocatedJointCostUsd}`);
      }
      if (settlement.outputs[1].allocatedJointCostUsd !== 30000.00) {
        throw new Error(`Diesel allocation error: expected $30000, got ${settlement.outputs[1].allocatedJointCostUsd}`);
      }
      if (settlement.outputs[2].allocatedJointCostUsd !== 10000.00) {
        throw new Error(`Asphalt allocation error: expected $10000, got ${settlement.outputs[2].allocatedJointCostUsd}`);
      }
    });

    runTest('3.2D-07-25', 'Joint Cost Apportionment via PHYSICAL_UNITS Method', () => {
      const settlement = RepetitiveRemanufacturingAndonEngine.settleJointProductionCostSplitOff({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        productionBatchId: 'BATCH-DAIRY-01',
        totalJointCostUsd: 12000.00,
        splitMethod: 'PHYSICAL_UNITS',
        products: [
          {
            productSku: 'DAIRY-WHOLE-MILK',
            productName: 'Standardized Whole Milk',
            productType: 'MAIN_PRODUCT',
            quantityProduced: 6000,
            unitOfMeasure: 'KG',
            marketPricePerUnitUsd: 2.00
          },
          {
            productSku: 'DAIRY-CREAM',
            productName: 'Heavy Dairy Cream',
            productType: 'CO_PRODUCT',
            quantityProduced: 4000,
            unitOfMeasure: 'KG',
            marketPricePerUnitUsd: 5.00
          }
        ]
      });

      // Total quantity = 10,000 KG. Milk (60%) = $7,200. Cream (40%) = $4,800.
      if (settlement.outputs[0].allocatedJointCostUsd !== 7200.00) {
        throw new Error(`Expected $7200.00 milk cost, got ${settlement.outputs[0].allocatedJointCostUsd}`);
      }
      if (settlement.outputs[1].allocatedJointCostUsd !== 4800.00) {
        throw new Error(`Expected $4800.00 cream cost, got ${settlement.outputs[1].allocatedJointCostUsd}`);
      }
    });

    runTest('3.2D-07-26', 'Joint Cost Apportionment via NET_REALIZABLE_VALUE (NRV) Method', () => {
      const settlement = RepetitiveRemanufacturingAndonEngine.settleJointProductionCostSplitOff({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        productionBatchId: 'BATCH-CHEM-01',
        totalJointCostUsd: 50000.00,
        splitMethod: 'NET_REALIZABLE_VALUE',
        products: [
          {
            productSku: 'CHEM-A',
            productName: 'Chemical A',
            productType: 'MAIN_PRODUCT',
            quantityProduced: 1000,
            unitOfMeasure: 'L',
            marketPricePerUnitUsd: 60.00,
            separableProcessingCostPerUnitUsd: 10.00 // NRV = 1000 * 50 = $50k (62.5%)
          },
          {
            productSku: 'CHEM-B',
            productName: 'Chemical B',
            productType: 'CO_PRODUCT',
            quantityProduced: 1000,
            unitOfMeasure: 'L',
            marketPricePerUnitUsd: 40.00,
            separableProcessingCostPerUnitUsd: 10.00 // NRV = 1000 * 30 = $30k (37.5%)
          }
        ]
      });

      // Total NRV = $80k. Chem A (62.5%) = $31,250. Chem B (37.5%) = $18,750.
      if (settlement.outputs[0].allocatedJointCostUsd !== 31250.00) {
        throw new Error(`Expected $31250 for Chem A, got ${settlement.outputs[0].allocatedJointCostUsd}`);
      }
      if (settlement.outputs[1].allocatedJointCostUsd !== 18750.00) {
        throw new Error(`Expected $18750 for Chem B, got ${settlement.outputs[1].allocatedJointCostUsd}`);
      }
    });

    runTest('3.2D-07-27', 'Zero-Penny Exact Rounding Reconciliation on Joint Cost Allocation', () => {
      // 100,000 / 3 = 33,333.3333... Must strictly balance to 100,000.00 with 0.00 variance
      const settlement = RepetitiveRemanufacturingAndonEngine.settleJointProductionCostSplitOff({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        productionBatchId: 'BATCH-ROUNDING-01',
        totalJointCostUsd: 100000.00,
        splitMethod: 'PHYSICAL_UNITS',
        products: [
          { productSku: 'P1', productName: 'Prod 1', productType: 'MAIN_PRODUCT', quantityProduced: 1, unitOfMeasure: 'EA', marketPricePerUnitUsd: 10 },
          { productSku: 'P2', productName: 'Prod 2', productType: 'CO_PRODUCT', quantityProduced: 1, unitOfMeasure: 'EA', marketPricePerUnitUsd: 10 },
          { productSku: 'P3', productName: 'Prod 3', productType: 'BY_PRODUCT', quantityProduced: 1, unitOfMeasure: 'EA', marketPricePerUnitUsd: 10 }
        ]
      });

      const totalAllocated = settlement.outputs.reduce((sum, p) => sum + p.allocatedJointCostUsd, 0);
      if (Math.abs(totalAllocated - 100000.00) > 0.001) {
        throw new Error(`Rounding leak: total allocated is ${totalAllocated}, expected 100000.00`);
      }
      if (settlement.reconciliationDifferenceUsd !== 0.00) {
        throw new Error('Reconciliation difference must be 0.00');
      }
    });

    runTest('3.2D-07-28', 'Joint Production Cost Financial Event Balanced GL Postings', () => {
      const settlement = RepetitiveRemanufacturingAndonEngine.settleJointProductionCostSplitOff({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        productionBatchId: 'BATCH-FIN-01',
        totalJointCostUsd: 45000.00,
        splitMethod: 'SALES_VALUE_SPLITOFF',
        products: [
          { productSku: 'P1', productName: 'Prod 1', productType: 'MAIN_PRODUCT', quantityProduced: 10, unitOfMeasure: 'EA', marketPricePerUnitUsd: 5000 }
        ]
      });

      const debits = settlement.financialEvent.glPostings.reduce((sum, p) => sum + p.debit, 0);
      const credits = settlement.financialEvent.glPostings.reduce((sum, p) => sum + p.credit, 0);
      if (Math.abs(debits - credits) > 0.01) {
        throw new Error(`Joint settlement GL unbalanced: debits ${debits} != credits ${credits}`);
      }
    });

    runTest('3.2D-07-29', 'Reject Zero or Negative Total Joint Cost', () => {
      let threw = false;
      try {
        RepetitiveRemanufacturingAndonEngine.settleJointProductionCostSplitOff({
          tenantId: 'TEN-01',
          companyId: 'COMP-01',
          productionBatchId: 'BATCH-ERR',
          totalJointCostUsd: 0, // Zero invalid
          splitMethod: 'PHYSICAL_UNITS',
          products: [{ productSku: 'P1', productName: 'Prod 1', productType: 'MAIN_PRODUCT', quantityProduced: 10, unitOfMeasure: 'EA', marketPricePerUnitUsd: 10 }]
        });
      } catch (err: any) {
        threw = true;
      }
      if (!threw) throw new Error('Must reject zero joint cost');
    });

    // =========================================================================
    // SECTION 5: SHOP FLOOR ANDON ORCHESTRATION & SOD (TESTS 30 - 35)
    // =========================================================================

    runTest('3.2D-07-30', 'Andon Incident Trigger with Automated Safety E-Stop Line Halt', () => {
      const incident = RepetitiveRemanufacturingAndonEngine.triggerAndonAlert({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        workCenterId: 'WC-PRESS-01',
        workOrderId: 'WO-STAMP-881',
        category: 'SAFETY_E_STOP',
        severity: 'CRITICAL_STOP',
        description: 'Light curtain sensor beam tripped during ram descent',
        triggeredBy: 'OPERATOR-JOE'
      });

      if (!incident.lineHaltEnforced) throw new Error('Safety E-Stop must enforce immediate line halt');
      if (incident.status !== 'OPEN_TRIGGERED') throw new Error('Initial status must be OPEN_TRIGGERED');
      if (!incident.auditHash || incident.auditHash.length !== 64) throw new Error('Invalid SHA-256 seal');
    });

    runTest('3.2D-07-31', 'Andon Incident Acknowledgment Lead Time Tracking', () => {
      const incident = RepetitiveRemanufacturingAndonEngine.triggerAndonAlert({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        workCenterId: 'WC-MACH-02',
        category: 'MACHINE_JAM',
        severity: 'WARNING_ATTENTION',
        description: 'Conveyor roller vibration spike',
        triggeredBy: 'OPERATOR-SUE'
      });

      const ack = RepetitiveRemanufacturingAndonEngine.acknowledgeAndonIncident({
        incident,
        acknowledgedBy: 'MAINT-TECH-DAVE'
      });

      if (ack.status !== 'ACKNOWLEDGED') throw new Error('Status must be ACKNOWLEDGED');
      if (ack.acknowledgedBy !== 'MAINT-TECH-DAVE') throw new Error('Acknowledged technician mismatch');
      if (ack.responseLeadTimeMinutes === undefined || ack.responseLeadTimeMinutes < 1) {
        throw new Error('Response lead time minutes must be tracked');
      }
    });

    runTest('3.2D-07-32', 'Andon Incident Resolution & Line Halt Interlock Release', () => {
      let incident = RepetitiveRemanufacturingAndonEngine.triggerAndonAlert({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        workCenterId: 'WC-WELD-03',
        category: 'QUALITY_OUT_OF_SPEC',
        severity: 'CRITICAL_STOP',
        description: 'Laser weld seam porosity exceeds tolerance',
        triggeredBy: 'OPERATOR-DAN'
      });

      incident = RepetitiveRemanufacturingAndonEngine.acknowledgeAndonIncident({
        incident,
        acknowledgedBy: 'QA-INSPECTOR-LISA'
      });

      const resolved = RepetitiveRemanufacturingAndonEngine.resolveAndonIncident({
        incident,
        resolvedBy: 'QA-INSPECTOR-LISA',
        resolutionNotes: 'Nozzle shielding gas flow rate recalibrated to 15 L/min. Test bead verified 100% sound.',
        downtimeMinutes: 18
      });

      if (resolved.status !== 'RESOLVED') throw new Error('Status must be RESOLVED');
      if (resolved.lineHaltEnforced !== false) throw new Error('Line halt interlock must be released upon resolution');
      if (resolved.totalDowntimeMinutes !== 18) throw new Error('Downtime minutes mismatch');
    });

    runTest('3.2D-07-33', 'Segregation of Duties (SoD): Triggering Operator Cannot Unilaterally Resolve Safety E-Stop', () => {
      const incident = RepetitiveRemanufacturingAndonEngine.triggerAndonAlert({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        workCenterId: 'WC-ROBOT-01',
        category: 'SAFETY_E_STOP',
        severity: 'CRITICAL_STOP',
        description: 'Safety gate opened during robotic welding motion',
        triggeredBy: 'OPERATOR-JOE'
      });

      let threw = false;
      try {
        RepetitiveRemanufacturingAndonEngine.resolveAndonIncident({
          incident,
          resolvedBy: 'OPERATOR-JOE', // Same as triggering operator!
          resolutionNotes: 'Closed door and hit reset'
        });
      } catch (err: any) {
        threw = true;
      }

      if (!threw) throw new Error('Must enforce SoD: triggering operator cannot self-resolve safety E-Stop');
    });

    runTest('3.2D-07-34', 'Reject Duplicate Resolution of Already Resolved Andon Incident', () => {
      const incident = RepetitiveRemanufacturingAndonEngine.triggerAndonAlert({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        workCenterId: 'WC-01',
        category: 'MATERIAL_SHORTAGE',
        severity: 'WARNING_ATTENTION',
        description: 'Fastener bin empty',
        triggeredBy: 'OP-01'
      });

      const resolved = RepetitiveRemanufacturingAndonEngine.resolveAndonIncident({
        incident,
        resolvedBy: 'LOGISTICS-LEAD',
        resolutionNotes: 'Replenished 500 bolts from central stores'
      });

      let threw = false;
      try {
        RepetitiveRemanufacturingAndonEngine.resolveAndonIncident({
          incident: resolved,
          resolvedBy: 'LOGISTICS-LEAD',
          resolutionNotes: 'Second attempt'
        });
      } catch (err: any) {
        threw = true;
      }
      if (!threw) throw new Error('Must reject duplicate resolution');
    });

    runTest('3.2D-07-35', 'Cryptographic SHA-256 Audit Trail Integrity Across Lifecycle States', () => {
      const incident = RepetitiveRemanufacturingAndonEngine.triggerAndonAlert({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        workCenterId: 'WC-STAMP-01',
        category: 'MACHINE_JAM',
        severity: 'CRITICAL_STOP',
        description: 'Punch die stuck in downstroke position',
        triggeredBy: 'OP-MARCUS'
      });

      const hash1 = incident.auditHash;
      const ack = RepetitiveRemanufacturingAndonEngine.acknowledgeAndonIncident({
        incident,
        acknowledgedBy: 'MAINT-TECH-BILL'
      });
      const hash2 = ack.auditHash;

      const resolved = RepetitiveRemanufacturingAndonEngine.resolveAndonIncident({
        incident: ack,
        resolvedBy: 'MAINT-TECH-BILL',
        resolutionNotes: 'Pneumatic valve cleared and pressure restored.'
      });
      const hash3 = resolved.auditHash;

      if (hash1 === hash2 || hash2 === hash3 || hash1 === hash3) {
        throw new Error('Audit hashes must uniquely evolve at each lifecycle transition');
      }
      if (hash1.length !== 64 || hash2.length !== 64 || hash3.length !== 64) {
        throw new Error('Hashes must be standard 64-character SHA-256 digests');
      }
    });

    const passedCount = results.filter(r => r.passed).length;
    return {
      passed: passedCount,
      total: results.length,
      results,
      phase: 'Phase 3.2D-07: Repetitive Manufacturing, Circular Remanufacturing & Andon Orchestration'
    };
  }
}
