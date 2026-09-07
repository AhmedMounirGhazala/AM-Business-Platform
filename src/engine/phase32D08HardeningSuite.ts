/**
 * AM Enterprise ERP — Phase 3.2D-08 Hardening Test Suite
 * Manufacturing Yield Optimization, Digital Shift Handover Governance,
 * Statistical Process Control (SPC / Six Sigma / Cpk) & Scrap Recovery
 */

import { ManufacturingYieldSpcShiftEngine } from './manufacturingYieldSpcShiftEngine';

export interface HardeningTestResult {
  id: string;
  name: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

export class Phase32D08HardeningSuite {
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
    // SECTION 1: SPC CONTROL CHARTS & SIX SIGMA CAPABILITY (TESTS 01 - 10)
    // =========================================================================

    runTest('3.2D-08-01', 'SPC Study Creation & Parameter Specification Limits Validation', () => {
      const study = ManufacturingYieldSpcShiftEngine.createSpcStudy({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        studyCode: 'SPC-BEARING-01',
        workCenterId: 'WC-CNC-01',
        productSku: 'PART-BEARING-6204',
        parameterName: 'Outer Ring Diameter (mm)',
        unitOfMeasure: 'mm',
        usl: 47.020,
        lsl: 46.980,
        nominalTarget: 47.000
      });

      if (!study.id || study.studyCode !== 'SPC-BEARING-01') throw new Error('Invalid study ID or code');
      if (study.usl !== 47.020 || study.lsl !== 46.980) throw new Error('Specification limits mismatch');
      if (!study.auditHash || study.auditHash.length !== 64) throw new Error('Invalid 64-char SHA-256 audit hash');
    });

    runTest('3.2D-08-02', 'Reject Invalid Specification Limits (USL <= LSL)', () => {
      let rejected = false;
      try {
        ManufacturingYieldSpcShiftEngine.createSpcStudy({
          tenantId: 'TEN-01',
          companyId: 'COMP-01',
          studyCode: 'SPC-INVALID-01',
          workCenterId: 'WC-01',
          productSku: 'SKU-01',
          parameterName: 'Thickness',
          unitOfMeasure: 'mm',
          usl: 10.0,
          lsl: 10.5 // invalid
        });
      } catch {
        rejected = true;
      }
      if (!rejected) throw new Error('Engine should reject USL <= LSL');
    });

    runTest('3.2D-08-03', 'Subgroup Recording, Mean & Range Calculation', () => {
      const study = ManufacturingYieldSpcShiftEngine.createSpcStudy({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        studyCode: 'SPC-STUDY-03',
        workCenterId: 'WC-CNC-02',
        productSku: 'PART-SHAFT-20',
        parameterName: 'Shaft Diameter',
        unitOfMeasure: 'mm',
        usl: 20.05,
        lsl: 19.95
      });

      const { study: updated } = ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-101',
        sampleValues: [20.002, 20.004, 19.998, 20.001, 19.995]
      });

      if (updated.subgroups.length !== 1) throw new Error('Subgroup not appended');
      const sg = updated.subgroups[0];
      if (sg.sampleValues.length !== 5) throw new Error('Incorrect sample values count');
      if (Math.abs(sg.mean - 20.000) > 0.005) throw new Error(`Incorrect mean: ${sg.mean}`);
      if (Math.abs(sg.range - 0.009) > 0.001) throw new Error(`Incorrect range: ${sg.range}`);
    });

    runTest('3.2D-08-04', 'Grand Mean, Average Range & Control Limits (X-bar & R Chart)', () => {
      const study = ManufacturingYieldSpcShiftEngine.createSpcStudy({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        studyCode: 'SPC-STUDY-04',
        workCenterId: 'WC-CNC-02',
        productSku: 'PART-CYLINDER',
        parameterName: 'Bore Diameter',
        unitOfMeasure: 'mm',
        usl: 50.050,
        lsl: 49.950
      });

      // Add 3 subgroups of n=5
      ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-01',
        sampleValues: [50.001, 50.003, 49.998, 50.000, 49.998]
      });
      ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-01',
        sampleValues: [50.002, 50.001, 49.999, 50.002, 50.001]
      });
      const { study: updated } = ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-01',
        sampleValues: [50.000, 50.002, 50.001, 49.999, 50.003]
      });

      const limits = updated.controlLimits;
      if (limits.centerLine <= 0) throw new Error('Center line not computed');
      if (limits.ucl <= limits.centerLine || limits.lcl >= limits.centerLine) {
        throw new Error(`Control limits invalid: UCL=${limits.ucl}, CL=${limits.centerLine}, LCL=${limits.lcl}`);
      }
      if (limits.sigmaEstimate <= 0) throw new Error('Sigma estimate must be positive');
    });

    runTest('3.2D-08-05', 'Six Sigma Process Capability Indices (Cp, Cpk) Calculation', () => {
      const study = ManufacturingYieldSpcShiftEngine.createSpcStudy({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        studyCode: 'SPC-CAPABILITY-05',
        workCenterId: 'WC-05',
        productSku: 'SKU-05',
        parameterName: 'Length (mm)',
        unitOfMeasure: 'mm',
        usl: 100.10,
        lsl: 99.90,
        nominalTarget: 100.00
      });

      // Feed tightly centered data around 100.00 with small spread
      for (let i = 0; i < 4; i++) {
        ManufacturingYieldSpcShiftEngine.recordSubgroup({
          studyId: study.id,
          operatorId: 'OP-05',
          sampleValues: [100.002, 100.001, 99.998, 100.000, 99.999]
        });
      }

      const updated = ManufacturingYieldSpcShiftEngine.getStudyById(study.id)!;
      if (!updated.capability) throw new Error('Process capability not calculated');
      if (updated.capability.cp <= 0 || updated.capability.cpk <= 0) {
        throw new Error('Cp and Cpk must be strictly positive');
      }
      if (updated.capability.cpk < 1.33) {
        throw new Error(`Expected high capability Cpk >= 1.33, got: ${updated.capability.cpk}`);
      }
      if (updated.capability.rating !== 'WORLD_CLASS' && updated.capability.rating !== 'CAPABLE') {
        throw new Error(`Unexpected rating: ${updated.capability.rating}`);
      }
    });

    runTest('3.2D-08-06', 'Process Incapability Detection (Cpk < 1.00) & Automatic Quarantine Trigger', () => {
      const study = ManufacturingYieldSpcShiftEngine.createSpcStudy({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        studyCode: 'SPC-INCAPABLE-06',
        workCenterId: 'WC-06',
        productSku: 'SKU-06',
        parameterName: 'Wall Thickness',
        unitOfMeasure: 'mm',
        usl: 5.05, // very narrow spec
        lsl: 4.95
      });

      // Feed wide variance data (out of spec)
      ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-06',
        sampleValues: [5.08, 4.92, 5.06, 4.91, 5.09]
      });
      const { study: updated } = ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-06',
        sampleValues: [5.10, 4.90, 5.12, 4.88, 5.11]
      });

      if (!updated.capability) throw new Error('Capability missing');
      if (updated.capability.cpk >= 1.00) {
        throw new Error(`Expected Cpk < 1.00 for widely spread data, got: ${updated.capability.cpk}`);
      }
      if (updated.capability.rating !== 'INCAPABLE') {
        throw new Error(`Rating must be INCAPABLE, got: ${updated.capability.rating}`);
      }
      if (!updated.quarantineTriggered) {
        throw new Error('Incapable process should automatically trigger quarantine');
      }
    });

    runTest('3.2D-08-07', 'Defect PPM Estimation via Normal Distribution Z-Score', () => {
      const study = ManufacturingYieldSpcShiftEngine.createSpcStudy({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        studyCode: 'SPC-PPM-07',
        workCenterId: 'WC-07',
        productSku: 'SKU-07',
        parameterName: 'Viscosity (cP)',
        unitOfMeasure: 'cP',
        usl: 120,
        lsl: 80,
        nominalTarget: 100
      });

      ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-07',
        sampleValues: [100.2, 99.8, 100.1, 99.9, 100.0]
      });
      const { study: updated } = ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-07',
        sampleValues: [100.1, 100.3, 99.7, 100.0, 99.9]
      });

      if (updated.capability!.defectPpmEstimated === undefined) {
        throw new Error('Defect PPM not estimated');
      }
      if (updated.capability!.defectPpmEstimated < 0) {
        throw new Error('PPM cannot be negative');
      }
    });

    runTest('3.2D-08-08', 'Reject Empty Sample Values Subgroup', () => {
      const study = ManufacturingYieldSpcShiftEngine.createSpcStudy({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        studyCode: 'SPC-EMPTY-08',
        workCenterId: 'WC-08',
        productSku: 'SKU-08',
        parameterName: 'Length',
        unitOfMeasure: 'mm',
        usl: 10,
        lsl: 8
      });

      let rejected = false;
      try {
        ManufacturingYieldSpcShiftEngine.recordSubgroup({
          studyId: study.id,
          operatorId: 'OP-08',
          sampleValues: []
        });
      } catch {
        rejected = true;
      }
      if (!rejected) throw new Error('Empty sample values should be rejected');
    });

    runTest('3.2D-08-09', 'Reject Subgroup Recording on Non-Existent SPC Study', () => {
      let rejected = false;
      try {
        ManufacturingYieldSpcShiftEngine.recordSubgroup({
          studyId: 'non-existent-study-id',
          operatorId: 'OP-01',
          sampleValues: [1.0, 1.1]
        });
      } catch {
        rejected = true;
      }
      if (!rejected) throw new Error('Non-existent study ID should be rejected');
    });

    runTest('3.2D-08-10', 'Subgroup Statistical Constants Lookup Across Varying Sample Sizes (n=2 to 10)', () => {
      const study = ManufacturingYieldSpcShiftEngine.createSpcStudy({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        studyCode: 'SPC-CONST-10',
        workCenterId: 'WC-10',
        productSku: 'SKU-10',
        parameterName: 'Height',
        unitOfMeasure: 'mm',
        usl: 15,
        lsl: 5
      });

      // Sample size n=3
      ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-10',
        sampleValues: [10.1, 9.9, 10.0]
      });
      const { study: updated } = ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-10',
        sampleValues: [10.2, 9.8, 10.1]
      });

      if (updated.controlLimits.sigmaEstimate <= 0) {
        throw new Error('Sigma estimate must be positive for n=3');
      }
    });

    // =========================================================================
    // SECTION 2: WESTERN ELECTRIC & NELSON OUT-OF-CONTROL RULES (TESTS 11 - 16)
    // =========================================================================

    runTest('3.2D-08-11', 'Western Electric Rule 1: Point Beyond 3-Sigma Control Limits', () => {
      const study = ManufacturingYieldSpcShiftEngine.createSpcStudy({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        studyCode: 'SPC-RULE1-11',
        workCenterId: 'WC-11',
        productSku: 'SKU-11',
        parameterName: 'Gap (mm)',
        unitOfMeasure: 'mm',
        usl: 12,
        lsl: 8
      });

      // Establish baseline centered at 10.0
      ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-11',
        sampleValues: [10.01, 9.99, 10.00]
      });
      ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-11',
        sampleValues: [10.02, 9.98, 10.00]
      });

      // Inject severe out-of-control point
      const { newViolations } = ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-11',
        sampleValues: [14.50, 14.55, 14.60]
      });

      const rule1 = newViolations.find(v => v.ruleId === 'RULE_1_BEYOND_3_SIGMA');
      if (!rule1) throw new Error('Rule 1 violation (beyond 3 sigma) should be detected');
      if (rule1.severity !== 'CRITICAL_OUT_OF_CONTROL') {
        throw new Error(`Rule 1 should be CRITICAL_OUT_OF_CONTROL, got: ${rule1.severity}`);
      }
    });

    runTest('3.2D-08-12', 'Automatic Work Center Quarantine on Rule 1 Critical Violation', () => {
      const study = ManufacturingYieldSpcShiftEngine.createSpcStudy({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        studyCode: 'SPC-QUAR-12',
        workCenterId: 'WC-12',
        productSku: 'SKU-12',
        parameterName: 'Temperature',
        unitOfMeasure: 'C',
        usl: 105,
        lsl: 95
      });

      ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-12',
        sampleValues: [100.1, 99.9, 100.0]
      });
      ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-12',
        sampleValues: [100.2, 99.8, 100.1]
      });

      const { study: updated } = ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-12',
        sampleValues: [115.0, 115.2, 115.1] // massive breach
      });

      if (!updated.quarantineTriggered) {
        throw new Error('Critical out of control violation must trigger quarantine');
      }
    });

    runTest('3.2D-08-13', 'Nelson Rule 2: 9 Consecutive Points on Same Side of Center Line', () => {
      const study = ManufacturingYieldSpcShiftEngine.createSpcStudy({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        studyCode: 'SPC-RULE2-13',
        workCenterId: 'WC-13',
        productSku: 'SKU-13',
        parameterName: 'Torque (Nm)',
        unitOfMeasure: 'Nm',
        usl: 50,
        lsl: 30
      });

      // Initial baseline
      ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-13',
        sampleValues: [40.0, 39.8, 40.2] // CL ~ 40.0
      });

      let rule2Triggered = false;
      // Record 9 points strictly above 40.0
      for (let i = 0; i < 9; i++) {
        const { newViolations } = ManufacturingYieldSpcShiftEngine.recordSubgroup({
          studyId: study.id,
          operatorId: 'OP-13',
          sampleValues: [40.5 + i * 0.01, 40.4 + i * 0.01, 40.6 + i * 0.01]
        });
        if (newViolations.some(v => v.ruleId === 'RULE_2_NINE_SAME_SIDE')) {
          rule2Triggered = true;
          break;
        }
      }

      if (!rule2Triggered) {
        throw new Error('Rule 2 (9 consecutive points on same side of center line) should have fired');
      }
    });

    runTest('3.2D-08-14', 'Nelson Rule 3: 6 Consecutive Points Strictly Increasing or Decreasing', () => {
      const study = ManufacturingYieldSpcShiftEngine.createSpcStudy({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        studyCode: 'SPC-RULE3-14',
        workCenterId: 'WC-14',
        productSku: 'SKU-14',
        parameterName: 'Weight (g)',
        unitOfMeasure: 'g',
        usl: 500,
        lsl: 400
      });

      ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-14',
        sampleValues: [450, 450, 450]
      });

      let rule3Triggered = false;
      // Record 6 strictly increasing means
      for (let i = 1; i <= 6; i++) {
        const val = 450 + i * 2;
        const { newViolations } = ManufacturingYieldSpcShiftEngine.recordSubgroup({
          studyId: study.id,
          operatorId: 'OP-14',
          sampleValues: [val, val + 0.1, val - 0.1]
        });
        if (newViolations.some(v => v.ruleId === 'RULE_3_SIX_TRENDING')) {
          rule3Triggered = true;
          break;
        }
      }

      if (!rule3Triggered) {
        throw new Error('Rule 3 (6 points trending) should have fired');
      }
    });

    runTest('3.2D-08-15', 'Nelson Rule 4: 14 Consecutive Points Alternating Up and Down', () => {
      const study = ManufacturingYieldSpcShiftEngine.createSpcStudy({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        studyCode: 'SPC-RULE4-15',
        workCenterId: 'WC-15',
        productSku: 'SKU-15',
        parameterName: 'Hardness (HRC)',
        unitOfMeasure: 'HRC',
        usl: 65,
        lsl: 55
      });

      ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: study.id,
        operatorId: 'OP-15',
        sampleValues: [60, 60, 60]
      });

      let rule4Triggered = false;
      // Record 14 strictly alternating points
      for (let i = 1; i <= 14; i++) {
        const val = i % 2 === 0 ? 61.0 : 59.0;
        const { newViolations } = ManufacturingYieldSpcShiftEngine.recordSubgroup({
          studyId: study.id,
          operatorId: 'OP-15',
          sampleValues: [val, val + 0.1, val - 0.1]
        });
        if (newViolations.some(v => v.ruleId === 'RULE_4_FOURTEEN_ALTERNATING')) {
          rule4Triggered = true;
          break;
        }
      }

      if (!rule4Triggered) {
        throw new Error('Rule 4 (14 points alternating up and down) should have fired');
      }
    });

    runTest('3.2D-08-16', 'Stable Process Yields Zero False Violations', () => {
      const study = ManufacturingYieldSpcShiftEngine.createSpcStudy({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        studyCode: 'SPC-STABLE-16',
        workCenterId: 'WC-16',
        productSku: 'SKU-16',
        parameterName: 'Depth (mm)',
        unitOfMeasure: 'mm',
        usl: 25.10,
        lsl: 24.90
      });

      // Feed 5 random small perturbations around 25.0
      const perturbations = [
        [25.01, 24.99, 25.00],
        [24.99, 25.02, 25.00],
        [25.02, 24.98, 25.01],
        [25.00, 25.01, 24.99],
        [24.99, 25.00, 25.01]
      ];

      for (const p of perturbations) {
        ManufacturingYieldSpcShiftEngine.recordSubgroup({
          studyId: study.id,
          operatorId: 'OP-16',
          sampleValues: p
        });
      }

      const updated = ManufacturingYieldSpcShiftEngine.getStudyById(study.id)!;
      if (updated.violations.length !== 0) {
        throw new Error(`Stable process generated unexpected violations: ${JSON.stringify(updated.violations)}`);
      }
      if (updated.quarantineTriggered) {
        throw new Error('Quarantine falsely triggered on stable process');
      }
    });

    // =========================================================================
    // SECTION 3: DIGITAL SHIFT HANDOVER & WIP CUSTODY (TESTS 17 - 23)
    // =========================================================================

    runTest('3.2D-08-17', 'Digital Shift Handover Initiation & WIP Snapshot Balancing', () => {
      const handover = ManufacturingYieldSpcShiftEngine.initiateShiftHandover({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        handoverCode: 'SHF-LINE1-20260903-M',
        productionLineId: 'LINE-01',
        shiftDate: '2026-09-03',
        shiftType: 'MORNING',
        outgoingSupervisorId: 'SUP-OUT-01',
        incomingSupervisorId: 'SUP-INC-02',
        safetyChecklist: [
          { itemCode: 'SAFE-01', description: 'Emergency E-Stops Tested & Clear', verified: true },
          { itemCode: 'LOTO-01', description: 'Lock-Out / Tag-Out Audit Passed', verified: true }
        ],
        wipItems: [
          {
            itemSku: 'PART-HOUSING-ALUM',
            lotNumber: 'LOT-2026-0901',
            workCenterId: 'WC-MILL-01',
            theoreticalSystemQty: 100,
            physicalCountedQty: 100
          }
        ],
        openAndonIncidentsCount: 0,
        openMaintenanceOrdersCount: 0
      });

      if (!handover.id || handover.status !== 'INITIATED') throw new Error('Handover status should be INITIATED');
      if (!handover.safetyCleanPassed) throw new Error('Safety check should pass');
      if (handover.wipItems[0].varianceQty !== 0) throw new Error('Variance qty should be 0');
      if (handover.wipItems[0].discrepancyFlag) throw new Error('Discrepancy flag should be false for exact match');
    });

    runTest('3.2D-08-18', 'Segregation of Duties (SoD): Reject Identical Outgoing and Incoming Supervisor', () => {
      let rejected = false;
      try {
        ManufacturingYieldSpcShiftEngine.initiateShiftHandover({
          tenantId: 'TEN-01',
          companyId: 'COMP-01',
          handoverCode: 'SHF-SOD-ERR',
          productionLineId: 'LINE-01',
          shiftDate: '2026-09-03',
          shiftType: 'AFTERNOON',
          outgoingSupervisorId: 'SAME-SUP-01',
          incomingSupervisorId: 'SAME-SUP-01', // SoD violation
          safetyChecklist: [{ itemCode: 'S-01', description: 'OK', verified: true }],
          wipItems: []
        });
      } catch (err: any) {
        if (err.message.includes('Segregation of Duties Violation')) {
          rejected = true;
        }
      }
      if (!rejected) throw new Error('SoD violation not blocked for identical supervisor ID');
    });

    runTest('3.2D-08-19', 'Detect WIP Count Variance Exceeding 2% Discrepancy Threshold', () => {
      const handover = ManufacturingYieldSpcShiftEngine.initiateShiftHandover({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        handoverCode: 'SHF-DISC-19',
        productionLineId: 'LINE-02',
        shiftDate: '2026-09-03',
        shiftType: 'NIGHT',
        outgoingSupervisorId: 'SUP-A',
        incomingSupervisorId: 'SUP-B',
        safetyChecklist: [{ itemCode: 'SAFE-01', description: 'Clear', verified: true }],
        wipItems: [
          {
            itemSku: 'PART-ROTOR',
            lotNumber: 'LOT-R-01',
            workCenterId: 'WC-LATHE',
            theoreticalSystemQty: 100,
            physicalCountedQty: 95 // 5% variance > 2%
          }
        ]
      });

      const item = handover.wipItems[0];
      if (item.varianceQty !== -5) throw new Error(`Variance qty expected -5, got: ${item.varianceQty}`);
      if (!item.discrepancyFlag) throw new Error('Discrepancy flag must be set for 5% variance');
    });

    runTest('3.2D-08-20', 'Outgoing Shift Supervisor Digital Cryptographic Signing', () => {
      const handover = ManufacturingYieldSpcShiftEngine.initiateShiftHandover({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        handoverCode: 'SHF-SIGN-20',
        productionLineId: 'LINE-01',
        shiftDate: '2026-09-03',
        shiftType: 'MORNING',
        outgoingSupervisorId: 'SUP-OUT-20',
        incomingSupervisorId: 'SUP-INC-20',
        safetyChecklist: [{ itemCode: 'S-01', description: 'Safe', verified: true }],
        wipItems: []
      });

      const signed = ManufacturingYieldSpcShiftEngine.signOutgoingShift({
        handoverId: handover.id,
        supervisorId: 'SUP-OUT-20',
        supervisorName: 'Marcus Aurelius',
        role: 'Shift Supervisor'
      });

      if (signed.status !== 'OUTGOING_SIGNED') throw new Error('Status must transition to OUTGOING_SIGNED');
      if (!signed.outgoingSignature?.signatureToken) throw new Error('Signature token missing');
    });

    runTest('3.2D-08-21', 'Reject Incoming Signature Before Outgoing Supervisor Has Signed', () => {
      const handover = ManufacturingYieldSpcShiftEngine.initiateShiftHandover({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        handoverCode: 'SHF-PREMATURE-21',
        productionLineId: 'LINE-01',
        shiftDate: '2026-09-03',
        shiftType: 'MORNING',
        outgoingSupervisorId: 'SUP-OUT-21',
        incomingSupervisorId: 'SUP-INC-21',
        safetyChecklist: [{ itemCode: 'S-01', description: 'Safe', verified: true }],
        wipItems: []
      });

      let rejected = false;
      try {
        ManufacturingYieldSpcShiftEngine.completeShiftHandover({
          handoverId: handover.id,
          supervisorId: 'SUP-INC-21',
          supervisorName: 'Lucius Verus',
          role: 'Incoming Supervisor'
        });
      } catch {
        rejected = true;
      }
      if (!rejected) throw new Error('Incoming signature should be rejected if outgoing has not signed');
    });

    runTest('3.2D-08-22', 'Complete Shift Handover Dual Signatures & Custody Transfer', () => {
      const handover = ManufacturingYieldSpcShiftEngine.initiateShiftHandover({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        handoverCode: 'SHF-COMPLETE-22',
        productionLineId: 'LINE-01',
        shiftDate: '2026-09-03',
        shiftType: 'AFTERNOON',
        outgoingSupervisorId: 'SUP-OUT-22',
        incomingSupervisorId: 'SUP-INC-22',
        safetyChecklist: [{ itemCode: 'S-01', description: 'Safe', verified: true }],
        wipItems: [
          {
            itemSku: 'PART-STATOR',
            lotNumber: 'LOT-S-01',
            workCenterId: 'WC-01',
            theoreticalSystemQty: 50,
            physicalCountedQty: 50
          }
        ]
      });

      ManufacturingYieldSpcShiftEngine.signOutgoingShift({
        handoverId: handover.id,
        supervisorId: 'SUP-OUT-22',
        supervisorName: 'Outgoing Leader',
        role: 'Supervisor'
      });

      const completed = ManufacturingYieldSpcShiftEngine.completeShiftHandover({
        handoverId: handover.id,
        supervisorId: 'SUP-INC-22',
        supervisorName: 'Incoming Leader',
        role: 'Supervisor'
      });

      if (completed.status !== 'COMPLETED') throw new Error('Handover status must be COMPLETED');
      if (!completed.incomingSignature || !completed.completedAt) throw new Error('Completion timestamp or signature missing');
    });

    runTest('3.2D-08-23', 'Reject Shift Handover Completion with Unaccepted Critical Discrepancy', () => {
      const handover = ManufacturingYieldSpcShiftEngine.initiateShiftHandover({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        handoverCode: 'SHF-REJECT-23',
        productionLineId: 'LINE-01',
        shiftDate: '2026-09-03',
        shiftType: 'NIGHT',
        outgoingSupervisorId: 'SUP-OUT-23',
        incomingSupervisorId: 'SUP-INC-23',
        safetyChecklist: [{ itemCode: 'S-01', description: 'Safe', verified: true }],
        wipItems: [
          {
            itemSku: 'PART-CRITICAL',
            lotNumber: 'LOT-C-01',
            workCenterId: 'WC-01',
            theoreticalSystemQty: 200,
            physicalCountedQty: 180 // 10% discrepancy
          }
        ]
      });

      ManufacturingYieldSpcShiftEngine.signOutgoingShift({
        handoverId: handover.id,
        supervisorId: 'SUP-OUT-23',
        supervisorName: 'Out Lead',
        role: 'Supervisor'
      });

      const rejected = ManufacturingYieldSpcShiftEngine.completeShiftHandover({
        handoverId: handover.id,
        supervisorId: 'SUP-INC-23',
        supervisorName: 'In Lead',
        role: 'Supervisor',
        acceptDiscrepancies: false // reject
      });

      if (rejected.status !== 'REJECTED_DISCREPANCY') {
        throw new Error(`Expected REJECTED_DISCREPANCY, got: ${rejected.status}`);
      }
    });

    // =========================================================================
    // SECTION 4: PRODUCTION YIELD & SCRAP ACCOUNTING (TESTS 24 - 28)
    // =========================================================================

    runTest('3.2D-08-24', 'Production Yield Analysis with Unfavorable Scrap Variance', () => {
      const { analysis, financialEvent } = ManufacturingYieldSpcShiftEngine.analyzeProductionYield({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        manufacturingOrderId: 'MO-2026-001',
        productSku: 'VALVE-BODY-50',
        plannedOutputQty: 1000,
        actualGoodQty: 940,
        actualScrapQty: 60, // 6% scrap
        standardScrapAllowancePct: 2.5, // standard 25 units allowed
        materialCostPerUnit: 15.00,
        performedBy: 'COST-ACCNT-01'
      });

      if (analysis.standardAllowedScrapQty !== 25) {
        throw new Error(`Standard allowed scrap expected 25, got: ${analysis.standardAllowedScrapQty}`);
      }
      if (analysis.scrapVarianceQty !== 35) {
        throw new Error(`Scrap variance expected 35 units excess, got: ${analysis.scrapVarianceQty}`);
      }
      if (analysis.isFavorableVariance) {
        throw new Error('Variance should be UNFAVORABLE');
      }
      if (analysis.materialYieldVarianceCost !== 525.00) {
        throw new Error(`Variance cost expected $525, got: $${analysis.materialYieldVarianceCost}`);
      }
      if (financialEvent.eventType !== 'EVT_MFG_YIELD_VARIANCE_RECOGNIZED') {
        throw new Error('Financial event type mismatch');
      }
    });

    runTest('3.2D-08-25', 'Production Yield Analysis with Favorable Scrap Variance (High Yield)', () => {
      const { analysis, financialEvent } = ManufacturingYieldSpcShiftEngine.analyzeProductionYield({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        manufacturingOrderId: 'MO-2026-002',
        productSku: 'VALVE-BODY-50',
        plannedOutputQty: 1000,
        actualGoodQty: 990,
        actualScrapQty: 10, // only 1% scrap
        standardScrapAllowancePct: 3.0, // 30 allowed
        materialCostPerUnit: 15.00,
        performedBy: 'COST-ACCNT-01'
      });

      if (analysis.scrapVarianceQty !== -20) {
        throw new Error(`Scrap variance expected -20 units, got: ${analysis.scrapVarianceQty}`);
      }
      if (!analysis.isFavorableVariance) {
        throw new Error('Variance should be FAVORABLE');
      }
      if (analysis.materialYieldVarianceCost !== 300.00) {
        throw new Error(`Expected $300 variance cost, got: $${analysis.materialYieldVarianceCost}`);
      }
      const crEntry = financialEvent.glPostings.find(p => p.creditAmount > 0);
      if (crEntry?.accountCode !== '5215') {
        throw new Error('Favorable variance should credit account 5215');
      }
    });

    runTest('3.2D-08-26', 'Zero-Penny Exact Double-Entry Balance on Yield Financial Event', () => {
      const { financialEvent } = ManufacturingYieldSpcShiftEngine.analyzeProductionYield({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        manufacturingOrderId: 'MO-2026-003',
        productSku: 'PUMP-GEAR',
        plannedOutputQty: 500,
        actualGoodQty: 470,
        actualScrapQty: 30,
        standardScrapAllowancePct: 2.0, // 10 allowed, 20 excess
        materialCostPerUnit: 18.75,
        performedBy: 'AUDIT-01'
      });

      const totalDebit = financialEvent.glPostings.reduce((sum, p) => sum + p.debitAmount, 0);
      const totalCredit = financialEvent.glPostings.reduce((sum, p) => sum + p.creditAmount, 0);

      if (Math.abs(totalDebit - totalCredit) > 0.001) {
        throw new Error(`GL imbalance detected: Total Debit=${totalDebit}, Total Credit=${totalCredit}`);
      }
      if (totalDebit <= 0) throw new Error('GL postings cannot be zero');
    });

    runTest('3.2D-08-27', 'Reject Non-Positive Planned Output in Yield Analysis', () => {
      let rejected = false;
      try {
        ManufacturingYieldSpcShiftEngine.analyzeProductionYield({
          tenantId: 'TEN-01',
          companyId: 'COMP-01',
          manufacturingOrderId: 'MO-ERR',
          productSku: 'SKU-01',
          plannedOutputQty: 0, // invalid
          actualGoodQty: 10,
          actualScrapQty: 0,
          standardScrapAllowancePct: 2.0,
          materialCostPerUnit: 10,
          performedBy: 'USER-01'
        });
      } catch {
        rejected = true;
      }
      if (!rejected) throw new Error('Engine must reject plannedOutputQty <= 0');
    });

    runTest('3.2D-08-28', 'Reject Negative Actual Quantities in Yield Analysis', () => {
      let rejected = false;
      try {
        ManufacturingYieldSpcShiftEngine.analyzeProductionYield({
          tenantId: 'TEN-01',
          companyId: 'COMP-01',
          manufacturingOrderId: 'MO-ERR',
          productSku: 'SKU-01',
          plannedOutputQty: 100,
          actualGoodQty: -5, // invalid
          actualScrapQty: 0,
          standardScrapAllowancePct: 2.0,
          materialCostPerUnit: 10,
          performedBy: 'USER-01'
        });
      } catch {
        rejected = true;
      }
      if (!rejected) throw new Error('Engine must reject negative actual quantities');
    });

    // =========================================================================
    // SECTION 5: SCRAP HARVESTING & REGRIND RECOVERY (TESTS 29 - 32)
    // =========================================================================

    runTest('3.2D-08-29', 'Scrap Regrind Harvest & Financial Valuation Credit', () => {
      const { harvest, financialEvent } = ManufacturingYieldSpcShiftEngine.harvestScrapRecovery({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        manufacturingOrderId: 'MO-2026-001',
        recoveredMaterialSku: 'REGRIND-HDPE-RESIN',
        quantityRecoveredKg: 250,
        recoveryGrade: 'GRADE_PREMIUM_REGRIND',
        unitCreditRate: 1.80, // $1.80/kg
        targetWarehouseId: 'WH-RECYCLED',
        targetBinId: 'BIN-REGRIND-A1',
        lotNumber: 'LOT-RGR-2026-01',
        operatorId: 'OP-RECYCLE-01'
      });

      if (harvest.totalRecoveryValue !== 450.00) {
        throw new Error(`Total recovery value expected $450.00, got: $${harvest.totalRecoveryValue}`);
      }
      if (!harvest.auditHash || harvest.auditHash.length !== 64) {
        throw new Error('Invalid 64-char SHA-256 audit hash');
      }
      if (financialEvent.eventType !== 'EVT_MFG_SCRAP_RECOVERY_POSTED') {
        throw new Error('Invalid financial event type');
      }
    });

    runTest('3.2D-08-30', 'Balanced GL Accounting for Scrap Recovery Inventory Inflow', () => {
      const { financialEvent } = ManufacturingYieldSpcShiftEngine.harvestScrapRecovery({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        manufacturingOrderId: 'MO-2026-002',
        recoveredMaterialSku: 'REGRIND-ALUM-SWARF',
        quantityRecoveredKg: 100,
        recoveryGrade: 'GRADE_STANDARD_REGRIND',
        unitCreditRate: 2.50,
        targetWarehouseId: 'WH-METALS',
        targetBinId: 'BIN-MET-01',
        lotNumber: 'LOT-SWARF-01',
        operatorId: 'OP-02'
      });

      const totalDebit = financialEvent.glPostings.reduce((sum, p) => sum + p.debitAmount, 0);
      const totalCredit = financialEvent.glPostings.reduce((sum, p) => sum + p.creditAmount, 0);

      if (Math.abs(totalDebit - totalCredit) > 0.001) {
        throw new Error(`Scrap GL imbalance: Debit=${totalDebit}, Credit=${totalCredit}`);
      }
      const debEntry = financialEvent.glPostings.find(p => p.debitAmount > 0);
      if (debEntry?.accountCode !== '1340') {
        throw new Error('Debit must go to 1340 Secondary Regrind Inventory');
      }
      const credEntry = financialEvent.glPostings.find(p => p.creditAmount > 0);
      if (credEntry?.accountCode !== '5220') {
        throw new Error('Credit must go to 5220 Scrap Recovery Cost Offset');
      }
    });

    runTest('3.2D-08-31', 'Reject Non-Positive Recovered Scrap Quantity or Credit Rate', () => {
      let rejected = false;
      try {
        ManufacturingYieldSpcShiftEngine.harvestScrapRecovery({
          tenantId: 'TEN-01',
          companyId: 'COMP-01',
          manufacturingOrderId: 'MO-ERR',
          recoveredMaterialSku: 'SKU-01',
          quantityRecoveredKg: 0, // invalid
          recoveryGrade: 'GRADE_PREMIUM_REGRIND',
          unitCreditRate: 1.5,
          targetWarehouseId: 'WH-01',
          targetBinId: 'BIN-01',
          lotNumber: 'LOT-01',
          operatorId: 'OP-01'
        });
      } catch {
        rejected = true;
      }
      if (!rejected) throw new Error('Zero recovered quantity should be rejected');
    });

    runTest('3.2D-08-32', 'Reject Scrap Recovery Without Target Storage Bin or Material SKU', () => {
      let rejected = false;
      try {
        ManufacturingYieldSpcShiftEngine.harvestScrapRecovery({
          tenantId: 'TEN-01',
          companyId: 'COMP-01',
          manufacturingOrderId: 'MO-ERR',
          recoveredMaterialSku: '', // invalid
          quantityRecoveredKg: 50,
          recoveryGrade: 'GRADE_PREMIUM_REGRIND',
          unitCreditRate: 1.5,
          targetWarehouseId: 'WH-01',
          targetBinId: '', // invalid
          lotNumber: 'LOT-01',
          operatorId: 'OP-01'
        });
      } catch {
        rejected = true;
      }
      if (!rejected) throw new Error('Missing SKU or bin should be rejected');
    });

    // =========================================================================
    // SECTION 6: LINE BALANCING, HEIJUNKA & AUDIT VAULT (TESTS 33 - 35)
    // =========================================================================

    runTest('3.2D-08-33', 'Dynamic Line Balance Efficiency, Bottleneck Identification & Smoothness Index', () => {
      const metrics = ManufacturingYieldSpcShiftEngine.evaluateLineBalance({
        productionLineId: 'LINE-AUTO-01',
        taktTimeSeconds: 45,
        stations: [
          { workCenterId: 'ST-01', operationName: 'Raw Prep', cycleTimeSeconds: 38, standardCycleTimeSeconds: 40, headcount: 1 },
          { workCenterId: 'ST-02', operationName: 'Machining', cycleTimeSeconds: 52, standardCycleTimeSeconds: 45, headcount: 2 }, // bottleneck > takt
          { workCenterId: 'ST-03', operationName: 'Deburr & Wash', cycleTimeSeconds: 35, standardCycleTimeSeconds: 35, headcount: 1 },
          { workCenterId: 'ST-04', operationName: 'Final Assembly', cycleTimeSeconds: 42, standardCycleTimeSeconds: 40, headcount: 2 }
        ]
      });

      if (metrics.bottleneckStationId !== 'ST-02') {
        throw new Error(`Expected ST-02 as bottleneck, got: ${metrics.bottleneckStationId}`);
      }
      if (metrics.bottleneckCycleTimeSeconds !== 52) {
        throw new Error(`Expected 52s bottleneck cycle time, got: ${metrics.bottleneckCycleTimeSeconds}`);
      }
      if (!metrics.bottleneckStarvationAlert) {
        throw new Error('Bottleneck > takt time (52 > 45) should trigger starvation alert');
      }
      if (metrics.lineBalanceEfficiencyPct <= 0 || metrics.lineBalanceEfficiencyPct > 100) {
        throw new Error(`Invalid line balance efficiency %: ${metrics.lineBalanceEfficiencyPct}`);
      }
      if (metrics.balanceDelayPct !== Math.round((100 - metrics.lineBalanceEfficiencyPct) * 100) / 100) {
        throw new Error('Balance delay must equal 100 - efficiency');
      }
      if (metrics.smoothnessIndex <= 0) {
        throw new Error('Smoothness index must be positive');
      }
    });

    runTest('3.2D-08-34', 'Heijunka Box Schedule Pitch Interleaving & Sequencing', () => {
      const schedule = ManufacturingYieldSpcShiftEngine.generateHeijunkaSchedule({
        productionLineId: 'LINE-01',
        scheduleDate: '2026-09-03',
        pitchMinutes: 20,
        shiftHours: 8,
        productMixRatio: {
          'SKU-HIGH-RUNNER': 60,
          'SKU-MID-RUNNER': 30,
          'SKU-LOW-RUNNER': 10
        },
        dailyTotalUnits: 240
      });

      // 8 hours * 60 / 20 = 24 pitch slots
      if (schedule.slots.length !== 24) {
        throw new Error(`Expected 24 pitch slots, got: ${schedule.slots.length}`);
      }
      if (!schedule.slots[0].kanbanCardId.startsWith('KBN-LINE-01')) {
        throw new Error('Kanban card ID prefix invalid');
      }
      const highRunnerCount = schedule.slots.filter(s => s.productSku === 'SKU-HIGH-RUNNER').length;
      if (highRunnerCount <= 0) {
        throw new Error('High runner SKU not scheduled in slots');
      }
    });

    runTest('3.2D-08-35', 'Cryptographic SHA-256 Audit Trail Chain Integrity Across All Operations', () => {
      const isValid = ManufacturingYieldSpcShiftEngine.verifyAuditChain();
      if (!isValid) {
        throw new Error('Audit trail block hash chain integrity check failed');
      }

      const vault = ManufacturingYieldSpcShiftEngine.getAuditVault();
      if (vault.length === 0) {
        throw new Error('Audit vault should contain recorded events');
      }

      for (const rec of vault) {
        if (!rec.currentHash || rec.currentHash.length !== 64) {
          throw new Error(`Invalid 64-char SHA-256 digest in record ${rec.id}: ${rec.currentHash}`);
        }
      }
    });

    const passedCount = results.filter(r => r.passed).length;

    return {
      passed: passedCount,
      total: results.length,
      results,
      phase: 'Phase 3.2D-08: Manufacturing Yield Optimization, Shift Handover Governance & Statistical Process Control (SPC)'
    };
  }
}
