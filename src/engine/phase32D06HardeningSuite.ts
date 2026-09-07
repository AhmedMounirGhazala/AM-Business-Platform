/**
 * AM Enterprise ERP — Phase 3.2D-06 Hardening Test Suite
 * 35 Deterministic Scenarios Verifying Tooling/Die Life Management, Calibration Enforcement,
 * Line Clearance Governance, Electronic Batch Records (eBR) 21 CFR Part 11 Compliance,
 * OEE Six Big Losses Decomposition, and Shift Handover Logbook
 */

import { ManufacturingIntelligenceToolingEngine } from './manufacturingIntelligenceToolingEngine';
import {
  ToolMaster,
  LineClearanceChecklist,
  ElectronicBatchRecord,
  OEELossRecord,
  ShiftHandoverLogbook
} from '../types/manufacturingIntelligenceTooling';

export interface HardeningTestResult {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

export class Phase32D06HardeningSuite {
  public static runAll(): {
    passed: number;
    total: number;
    results: HardeningTestResult[];
    phase: string;
  } {
    const results: HardeningTestResult[] = [];

    const runTest = (
      id: string,
      name: string,
      category: string,
      fn: () => void
    ) => {
      const start = Date.now();
      try {
        fn();
        results.push({
          id,
          name,
          category,
          passed: true,
          durationMs: Date.now() - start
        });
      } catch (err: any) {
        results.push({
          id,
          name,
          category,
          passed: false,
          message: err.message,
          durationMs: Date.now() - start
        });
      }
    };

    ManufacturingIntelligenceToolingEngine.clearFinancialEventsQueue();

    // =========================================================================
    // SECTION 1: TOOLING & DIE LIFECYCLE MANAGEMENT (Tests 1 - 8)
    // =========================================================================

    runTest('D06-01', 'Tool Master Creation with Cryptographic Seal', 'TOOLING', () => {
      const tool = ManufacturingIntelligenceToolingEngine.createToolMaster({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        toolCode: 'DIE-STAMP-500T',
        toolName: '500-Ton Chassis Stamping Die',
        toolType: 'DIE_STAMPING',
        serialNumber: 'SN-DIE-88992',
        workCenterId: 'WC-PRESS-01',
        nominalLifeCycles: 50000,
        maxLifeCycles: 60000,
        warningThresholdCycles: 45000,
        calibrationIntervalDays: 90,
        costPerCycleUsd: 0.12,
        hourlyWearRateUsd: 15.0
      });

      if (!tool.id.startsWith('TOOL-')) throw new Error('Invalid Tool ID');
      if (tool.status !== 'AVAILABLE') throw new Error(`Expected AVAILABLE, got ${tool.status}`);
      if (!tool.sha256Seal || tool.sha256Seal.length !== 64) throw new Error('Invalid SHA-256 seal');
      if (tool.currentLifeCycles !== 0) throw new Error('Initial cycles must be zero');
    });

    runTest('D06-02', 'Tool Master Validation Rejections (Invalid Cycles or Negative Cost)', 'TOOLING', () => {
      let threwNominal = false;
      try {
        ManufacturingIntelligenceToolingEngine.createToolMaster({
          tenantId: 'TENANT-001',
          companyId: 'COMP-001',
          toolCode: 'DIE-ERR-1',
          toolName: 'Err Die',
          toolType: 'CUTTING_TOOL',
          serialNumber: 'SN-001',
          workCenterId: 'WC-01',
          nominalLifeCycles: 0,
          maxLifeCycles: 100,
          calibrationIntervalDays: 30,
          costPerCycleUsd: 0.05
        });
      } catch {
        threwNominal = true;
      }
      if (!threwNominal) throw new Error('Should reject nominal cycles <= 0');

      let threwMax = false;
      try {
        ManufacturingIntelligenceToolingEngine.createToolMaster({
          tenantId: 'TENANT-001',
          companyId: 'COMP-001',
          toolCode: 'DIE-ERR-2',
          toolName: 'Err Die',
          toolType: 'CUTTING_TOOL',
          serialNumber: 'SN-002',
          workCenterId: 'WC-01',
          nominalLifeCycles: 1000,
          maxLifeCycles: 800, // less than nominal
          calibrationIntervalDays: 30,
          costPerCycleUsd: 0.05
        });
      } catch {
        threwMax = true;
      }
      if (!threwMax) throw new Error('Should reject maxLifeCycles <= nominalLifeCycles');
    });

    runTest('D06-03', 'Tool Usage Accumulation & Amortization Cost Calculation', 'TOOLING', () => {
      const tool = ManufacturingIntelligenceToolingEngine.createToolMaster({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        toolCode: 'MOLD-INJ-01',
        toolName: 'Plastic Enclosure Injection Mold',
        toolType: 'INJECTION_MOLD',
        serialNumber: 'MOLD-991',
        workCenterId: 'WC-INJ-01',
        nominalLifeCycles: 100000,
        maxLifeCycles: 120000,
        calibrationIntervalDays: 180,
        costPerCycleUsd: 0.25
      });

      const { updatedTool, usageRecord, financialEvent } = ManufacturingIntelligenceToolingEngine.recordToolUsageCycles({
        tool,
        workOrderId: 'WO-2026-0501',
        operationSeq: 10,
        cyclesRun: 1500,
        recordedBy: 'operator-dave'
      });

      if (updatedTool.currentLifeCycles !== 1500) throw new Error(`Expected 1500 cycles, got ${updatedTool.currentLifeCycles}`);
      if (usageRecord.amortizedCostUsd !== 375.0) throw new Error(`Expected $375.00 amortization, got ${usageRecord.amortizedCostUsd}`);
      if (financialEvent.eventType !== 'EVT_TOOLING_AMORTIZATION') throw new Error('Invalid financial event type');
      if (financialEvent.amount !== 375.0) throw new Error('Financial event amount mismatch');
    });

    runTest('D06-04', 'Decoupled Financial Event Integrity for Tool Wear', 'TOOLING', () => {
      const queue = ManufacturingIntelligenceToolingEngine.getFinancialEventsQueue();
      const lastEvent = queue[queue.length - 1];
      if (!lastEvent || !lastEvent.sha256Seal || lastEvent.sha256Seal.length !== 64) {
        throw new Error('Missing or invalid cryptographic SHA-256 seal on financial event');
      }
      if (lastEvent.debitAccount !== '5120-MANUFACTURING-OVERHEAD-TOOLING') {
        throw new Error(`Unexpected debit account: ${lastEvent.debitAccount}`);
      }
    });

    runTest('D06-05', 'Warning Threshold Triggers MAINTENANCE_REQUIRED Status', 'TOOLING', () => {
      const tool = ManufacturingIntelligenceToolingEngine.createToolMaster({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        toolCode: 'CUTTER-CNC-04',
        toolName: 'Diamond Flute CNC Cutter',
        toolType: 'CUTTING_TOOL',
        serialNumber: 'CNC-CUT-004',
        workCenterId: 'WC-MILL-02',
        nominalLifeCycles: 1000,
        maxLifeCycles: 1200,
        warningThresholdCycles: 900,
        calibrationIntervalDays: 30,
        costPerCycleUsd: 1.50
      });

      const { updatedTool } = ManufacturingIntelligenceToolingEngine.recordToolUsageCycles({
        tool,
        workOrderId: 'WO-2026-0502',
        operationSeq: 20,
        cyclesRun: 920,
        recordedBy: 'cnc-machinist'
      });

      if (updatedTool.status !== 'MAINTENANCE_REQUIRED') {
        throw new Error(`Expected status MAINTENANCE_REQUIRED, got ${updatedTool.status}`);
      }
    });

    runTest('D06-06', 'Exceeding Max Life Cycles Transitions Tool to LOCKED_EXPIRED', 'TOOLING', () => {
      const tool = ManufacturingIntelligenceToolingEngine.createToolMaster({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        toolCode: 'WELD-FIXT-01',
        toolName: 'Chassis Alignment Welding Fixture',
        toolType: 'WELDING_FIXTURE',
        serialNumber: 'WELD-FIX-881',
        workCenterId: 'WC-WELD-01',
        nominalLifeCycles: 500,
        maxLifeCycles: 600,
        calibrationIntervalDays: 60,
        costPerCycleUsd: 2.00
      });

      const { updatedTool } = ManufacturingIntelligenceToolingEngine.recordToolUsageCycles({
        tool,
        workOrderId: 'WO-2026-0503',
        operationSeq: 30,
        cyclesRun: 610,
        recordedBy: 'weld-lead'
      });

      if (updatedTool.status !== 'LOCKED_EXPIRED') {
        throw new Error(`Expected status LOCKED_EXPIRED, got ${updatedTool.status}`);
      }
    });

    runTest('D06-07', 'Operation Dispatch Lockout on LOCKED_EXPIRED Tool', 'TOOLING', () => {
      const tool = ManufacturingIntelligenceToolingEngine.createToolMaster({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        toolCode: 'DIE-LOCK-TEST',
        toolName: 'Expired Stamping Die',
        toolType: 'DIE_STAMPING',
        serialNumber: 'DIE-EXP-01',
        workCenterId: 'WC-PRESS-01',
        nominalLifeCycles: 100,
        maxLifeCycles: 120,
        calibrationIntervalDays: 30,
        costPerCycleUsd: 0.50
      });

      const { updatedTool } = ManufacturingIntelligenceToolingEngine.recordToolUsageCycles({
        tool,
        workOrderId: 'WO-2026-0504',
        operationSeq: 10,
        cyclesRun: 150,
        recordedBy: 'operator-sam'
      });

      let threw = false;
      try {
        ManufacturingIntelligenceToolingEngine.recordToolUsageCycles({
          tool: updatedTool,
          workOrderId: 'WO-2026-0505',
          operationSeq: 10,
          cyclesRun: 10,
          recordedBy: 'operator-sam'
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('LOCKED_EXPIRED')) throw new Error('Expected LOCKED_EXPIRED error message');
      }

      if (!threw) throw new Error('Must block execution when tool is LOCKED_EXPIRED');
    });

    runTest('D06-08', 'Operation Dispatch Lockout on Expired Calibration Tool', 'TOOLING', () => {
      const tool = ManufacturingIntelligenceToolingEngine.createToolMaster({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        toolCode: 'JIG-CAL-OVERDUE',
        toolName: 'Precision Coordinate Jig',
        toolType: 'CALIBRATION_JIG',
        serialNumber: 'JIG-0099',
        workCenterId: 'WC-METROLOGY',
        nominalLifeCycles: 5000,
        maxLifeCycles: 6000,
        calibrationIntervalDays: 30,
        costPerCycleUsd: 0.10
      });

      // Manually simulate overdue calibration date
      const expiredTool: ToolMaster = {
        ...tool,
        nextCalibrationDue: new Date(Date.now() - 86400000 * 5).toISOString() // 5 days ago
      };

      let threw = false;
      try {
        ManufacturingIntelligenceToolingEngine.recordToolUsageCycles({
          tool: expiredTool,
          workOrderId: 'WO-2026-0506',
          operationSeq: 10,
          cyclesRun: 25,
          recordedBy: 'tech-sarah'
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('calibration expired')) throw new Error('Expected calibration expired error');
      }

      if (!threw) throw new Error('Must reject dispatch on calibration expired tool');
    });

    // =========================================================================
    // SECTION 2: CALIBRATION & RE-CERTIFICATION GOVERNANCE (Tests 9 - 13)
    // =========================================================================

    runTest('D06-09', 'SoD Violation: Technician Approving Own Calibration Rejected', 'CALIBRATION', () => {
      const tool = ManufacturingIntelligenceToolingEngine.createToolMaster({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        toolCode: 'TOOL-SOD-01',
        toolName: 'Test Tool',
        toolType: 'DIE_STAMPING',
        serialNumber: 'SN-SOD-01',
        workCenterId: 'WC-01',
        nominalLifeCycles: 1000,
        maxLifeCycles: 1200,
        calibrationIntervalDays: 60,
        costPerCycleUsd: 0.20
      });

      let threw = false;
      try {
        ManufacturingIntelligenceToolingEngine.calibrateAndCertifyTool({
          tool,
          calibratedByTechnician: 'john.doe',
          approvedByQAInspector: 'john.doe', // Same user!
          inspectorSignature: 'SIG-JD-001'
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('Segregation of Duties Violation')) throw new Error('Expected SoD error message');
      }

      if (!threw) throw new Error('Must reject same person acting as technician and QA approver');
    });

    runTest('D06-10', 'Calibration Rejection on Missing Digital Inspector Signature', 'CALIBRATION', () => {
      const tool = ManufacturingIntelligenceToolingEngine.createToolMaster({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        toolCode: 'TOOL-SIG-01',
        toolName: 'Test Tool',
        toolType: 'DIE_STAMPING',
        serialNumber: 'SN-SIG-01',
        workCenterId: 'WC-01',
        nominalLifeCycles: 1000,
        maxLifeCycles: 1200,
        calibrationIntervalDays: 60,
        costPerCycleUsd: 0.20
      });

      let threw = false;
      try {
        ManufacturingIntelligenceToolingEngine.calibrateAndCertifyTool({
          tool,
          calibratedByTechnician: 'tech-tom',
          approvedByQAInspector: 'qa-sarah',
          inspectorSignature: ' ' // empty signature
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('digital inspector signature is mandatory')) throw new Error('Expected signature error');
      }

      if (!threw) throw new Error('Must require digital inspector signature');
    });

    runTest('D06-11', 'Successful Calibration Extends Expiration and Sets AVAILABLE', 'CALIBRATION', () => {
      const tool = ManufacturingIntelligenceToolingEngine.createToolMaster({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        toolCode: 'TOOL-CAL-OK',
        toolName: 'Micrometer Alignment Jig',
        toolType: 'CALIBRATION_JIG',
        serialNumber: 'JIG-OK-99',
        workCenterId: 'WC-METROLOGY',
        nominalLifeCycles: 5000,
        maxLifeCycles: 6000,
        calibrationIntervalDays: 90,
        costPerCycleUsd: 0.15
      });

      const certifiedTool = ManufacturingIntelligenceToolingEngine.calibrateAndCertifyTool({
        tool: { ...tool, status: 'MAINTENANCE_REQUIRED' },
        calibratedByTechnician: 'tech-alex',
        approvedByQAInspector: 'qa-mary',
        inspectorSignature: 'QA-MARY-CERT-9901'
      });

      if (certifiedTool.status !== 'AVAILABLE') throw new Error(`Expected AVAILABLE, got ${certifiedTool.status}`);
      const dueTime = new Date(certifiedTool.nextCalibrationDue).getTime();
      const expectedDueTime = Date.now() + 90 * 86400000;
      if (Math.abs(dueTime - expectedDueTime) > 10000) throw new Error('Calibration due date miscalculated');
    });

    runTest('D06-12', 'Overhaul Calibration Resets Tool Cycles to Zero', 'CALIBRATION', () => {
      const tool = ManufacturingIntelligenceToolingEngine.createToolMaster({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        toolCode: 'DIE-REFURB',
        toolName: 'Refurbished Press Die',
        toolType: 'DIE_STAMPING',
        serialNumber: 'DIE-RF-01',
        workCenterId: 'WC-PRESS-01',
        nominalLifeCycles: 10000,
        maxLifeCycles: 12000,
        calibrationIntervalDays: 180,
        costPerCycleUsd: 0.40
      });

      const wornTool = { ...tool, currentLifeCycles: 11950, status: 'MAINTENANCE_REQUIRED' as const };

      const overhauled = ManufacturingIntelligenceToolingEngine.calibrateAndCertifyTool({
        tool: wornTool,
        calibratedByTechnician: 'tool-maker-heinz',
        approvedByQAInspector: 'lead-inspector-karen',
        resetLifeCycles: true,
        inspectorSignature: 'LEAD-QA-KAREN-882'
      });

      if (overhauled.currentLifeCycles !== 0) throw new Error('Refurbished tool cycles should reset to 0');
      if (overhauled.status !== 'AVAILABLE') throw new Error('Status should be AVAILABLE');
    });

    runTest('D06-13', 'Calibration Produces New Immutable SHA-256 Audit Seal', 'CALIBRATION', () => {
      const tool = ManufacturingIntelligenceToolingEngine.createToolMaster({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        toolCode: 'DIE-SEAL-TEST',
        toolName: 'Die Seal Test',
        toolType: 'DIE_STAMPING',
        serialNumber: 'DIE-ST-01',
        workCenterId: 'WC-01',
        nominalLifeCycles: 5000,
        maxLifeCycles: 6000,
        calibrationIntervalDays: 60,
        costPerCycleUsd: 0.10
      });

      const certified = ManufacturingIntelligenceToolingEngine.calibrateAndCertifyTool({
        tool,
        calibratedByTechnician: 'tech-1',
        approvedByQAInspector: 'qa-2',
        inspectorSignature: 'SIG-VERIFY-123'
      });

      if (!certified.sha256Seal || certified.sha256Seal === tool.sha256Seal) {
        throw new Error('Certified tool must have updated cryptographic seal');
      }
    });

    // =========================================================================
    // SECTION 3: LINE CLEARANCE PROTOCOL (Tests 14 - 18)
    // =========================================================================

    runTest('D06-14', 'Line Clearance SoD Violation: Operator Cannot Be QA Inspector', 'LINE_CLEARANCE', () => {
      let threw = false;
      try {
        ManufacturingIntelligenceToolingEngine.performLineClearance({
          tenantId: 'TENANT-001',
          companyId: 'COMP-001',
          workCenterId: 'WC-PACK-01',
          workOrderId: 'WO-2026-0601',
          priorLotNumber: 'LOT-A-990',
          targetLotNumber: 'LOT-B-100',
          checklist: {
            equipmentCleanedAndSanitized: true,
            priorMaterialsRemoved: true,
            wasteBinsEmptied: true,
            correctLabelsAndPackagingVerified: true,
            calibrationValidForGauges: true,
            safetyGuardsInPlace: true
          },
          clearedByOperator: 'operator-bill',
          verifiedByQAInspector: 'operator-bill' // Same person
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('Segregation of Duties Violation')) throw new Error('Expected SoD error');
      }

      if (!threw) throw new Error('Must reject identical operator and QA inspector');
    });

    runTest('D06-15', 'Full Compliance Line Clearance Produces Status APPROVED', 'LINE_CLEARANCE', () => {
      const clearance = ManufacturingIntelligenceToolingEngine.performLineClearance({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        workCenterId: 'WC-BLENDING-01',
        workOrderId: 'WO-2026-0602',
        priorLotNumber: 'LOT-SYRUP-881',
        targetLotNumber: 'LOT-SYRUP-882',
        checklist: {
          equipmentCleanedAndSanitized: true,
          priorMaterialsRemoved: true,
          wasteBinsEmptied: true,
          correctLabelsAndPackagingVerified: true,
          calibrationValidForGauges: true,
          safetyGuardsInPlace: true
        },
        clearedByOperator: 'operator-bill',
        verifiedByQAInspector: 'qa-inspector-jill'
      });

      if (clearance.status !== 'APPROVED') throw new Error(`Expected APPROVED, got ${clearance.status}`);
      if (clearance.rejectionReason) throw new Error('Unexpected rejection reason on approved clearance');
      if (!clearance.sha256Seal || clearance.sha256Seal.length !== 64) throw new Error('Invalid SHA-256 seal');
    });

    runTest('D06-16', 'Line Clearance Rejection on Failed Prerequisite (e.g. Prior Material Left)', 'LINE_CLEARANCE', () => {
      const clearance = ManufacturingIntelligenceToolingEngine.performLineClearance({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        workCenterId: 'WC-PACK-02',
        workOrderId: 'WO-2026-0603',
        priorLotNumber: 'LOT-BOX-001',
        targetLotNumber: 'LOT-BOX-002',
        checklist: {
          equipmentCleanedAndSanitized: true,
          priorMaterialsRemoved: false, // FAILED
          wasteBinsEmptied: true,
          correctLabelsAndPackagingVerified: true,
          calibrationValidForGauges: true,
          safetyGuardsInPlace: true
        },
        clearedByOperator: 'operator-sam',
        verifiedByQAInspector: 'qa-auditor-luke'
      });

      if (clearance.status !== 'REJECTED') throw new Error(`Expected REJECTED, got ${clearance.status}`);
      if (!clearance.rejectionReason) throw new Error('Expected rejection reason for failed check');
    });

    runTest('D06-17', 'Line Clearance Checklist Seal Integrity & Traceability', 'LINE_CLEARANCE', () => {
      const clearance = ManufacturingIntelligenceToolingEngine.performLineClearance({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        workCenterId: 'WC-CLEAN-ROOM',
        workOrderId: 'WO-2026-0604',
        priorLotNumber: 'LOT-998',
        targetLotNumber: 'LOT-999',
        checklist: {
          equipmentCleanedAndSanitized: true,
          priorMaterialsRemoved: true,
          wasteBinsEmptied: true,
          correctLabelsAndPackagingVerified: true,
          calibrationValidForGauges: true,
          safetyGuardsInPlace: true
        },
        clearedByOperator: 'cleaner-01',
        verifiedByQAInspector: 'qa-lead-01'
      });

      if (!clearance.id.startsWith('LNC-')) throw new Error('Invalid LNC ID');
      if (!clearance.clearedAt) throw new Error('Missing clearedAt timestamp');
    });

    runTest('D06-18', 'Line Clearance Multi-Tenant Isolation Enforcement', 'LINE_CLEARANCE', () => {
      let threw = false;
      try {
        ManufacturingIntelligenceToolingEngine.performLineClearance({
          tenantId: '',
          companyId: 'COMP-001',
          workCenterId: 'WC-01',
          workOrderId: 'WO-01',
          priorLotNumber: 'L1',
          targetLotNumber: 'L2',
          checklist: {
            equipmentCleanedAndSanitized: true,
            priorMaterialsRemoved: true,
            wasteBinsEmptied: true,
            correctLabelsAndPackagingVerified: true,
            calibrationValidForGauges: true,
            safetyGuardsInPlace: true
          },
          clearedByOperator: 'op',
          verifiedByQAInspector: 'qa'
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('Tenant ID and Company ID are required')) throw new Error('Expected tenant error');
      }

      if (!threw) throw new Error('Must reject missing tenant ID');
    });

    // =========================================================================
    // SECTION 4: ELECTRONIC BATCH RECORD (eBR) & 21 CFR PART 11 (Tests 19 - 26)
    // =========================================================================

    let sampleClearance: LineClearanceChecklist;

    runTest('D06-19', 'Block eBR Initialization if Line Clearance is NOT Approved', 'EBR', () => {
      const rejectedClearance = ManufacturingIntelligenceToolingEngine.performLineClearance({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        workCenterId: 'WC-PHARMA-01',
        workOrderId: 'WO-2026-0701',
        priorLotNumber: 'LOT-MED-1',
        targetLotNumber: 'LOT-MED-2',
        checklist: {
          equipmentCleanedAndSanitized: false, // Rejected
          priorMaterialsRemoved: true,
          wasteBinsEmptied: true,
          correctLabelsAndPackagingVerified: true,
          calibrationValidForGauges: true,
          safetyGuardsInPlace: true
        },
        clearedByOperator: 'op-1',
        verifiedByQAInspector: 'qa-1'
      });

      let threw = false;
      try {
        ManufacturingIntelligenceToolingEngine.initializeElectronicBatchRecord({
          tenantId: 'TENANT-001',
          companyId: 'COMP-001',
          batchNumber: 'BATCH-2026-001',
          workOrderId: 'WO-2026-0701',
          productSku: 'FG-VACCINE-50ML',
          lineClearance: rejectedClearance
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('NOT approved')) throw new Error('Expected clearance rejection error');
      }

      if (!threw) throw new Error('Must block eBR initialization when line clearance failed');
    });

    runTest('D06-20', 'Successful eBR Initialization with Approved Clearance', 'EBR', () => {
      sampleClearance = ManufacturingIntelligenceToolingEngine.performLineClearance({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        workCenterId: 'WC-PHARMA-01',
        workOrderId: 'WO-2026-0702',
        priorLotNumber: 'LOT-MED-10',
        targetLotNumber: 'LOT-MED-11',
        checklist: {
          equipmentCleanedAndSanitized: true,
          priorMaterialsRemoved: true,
          wasteBinsEmptied: true,
          correctLabelsAndPackagingVerified: true,
          calibrationValidForGauges: true,
          safetyGuardsInPlace: true
        },
        clearedByOperator: 'op-pharma-01',
        verifiedByQAInspector: 'qa-inspector-clara'
      });

      const ebr = ManufacturingIntelligenceToolingEngine.initializeElectronicBatchRecord({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        batchNumber: 'BATCH-2026-0901',
        workOrderId: 'WO-2026-0702',
        productSku: 'FG-INSULIN-PEN-100U',
        lineClearance: sampleClearance
      });

      if (!ebr.id.startsWith('EBR-')) throw new Error('Invalid eBR ID');
      if (ebr.status !== 'IN_PROCESS') throw new Error(`Expected IN_PROCESS, got ${ebr.status}`);
      if (ebr.environmentalSensors.ambientTemperatureC !== 21.5) throw new Error('Sensor initial temp mismatch');
    });

    runTest('D06-21', 'Ingredient Dispense SoD Check (Weigher != Verifier)', 'EBR', () => {
      const ebr = ManufacturingIntelligenceToolingEngine.initializeElectronicBatchRecord({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        batchNumber: 'BATCH-2026-0902',
        workOrderId: 'WO-2026-0703',
        productSku: 'FG-TABLET-500MG',
        lineClearance: sampleClearance
      });

      let threw = false;
      try {
        ManufacturingIntelligenceToolingEngine.addIngredientDispense({
          ebr,
          itemSku: 'RM-API-ACTIVE',
          lotNumber: 'LOT-RM-001',
          plannedQuantity: 50.0,
          actualQuantity: 50.0,
          unitOfMeasure: 'KG',
          weighedBy: 'chemist-steve',
          verifiedBy: 'chemist-steve' // Same person
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('SoD Violation')) throw new Error('Expected SoD violation');
      }

      if (!threw) throw new Error('Must reject self-verification on ingredient dispensing');
    });

    runTest('D06-22', 'Ingredient Dispense 5% Tolerance Boundary Enforcement', 'EBR', () => {
      const ebr = ManufacturingIntelligenceToolingEngine.initializeElectronicBatchRecord({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        batchNumber: 'BATCH-2026-0903',
        workOrderId: 'WO-2026-0704',
        productSku: 'FG-TABLET-500MG',
        lineClearance: sampleClearance
      });

      let threw = false;
      try {
        ManufacturingIntelligenceToolingEngine.addIngredientDispense({
          ebr,
          itemSku: 'RM-EXCIPIENT-BINDER',
          lotNumber: 'LOT-RM-002',
          plannedQuantity: 100.0,
          actualQuantity: 107.0, // 7% over planned > 5% tolerance
          unitOfMeasure: 'KG',
          weighedBy: 'chemist-steve',
          verifiedBy: 'verifier-linda'
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('exceeds 5% tolerance')) throw new Error('Expected tolerance error');
      }

      if (!threw) throw new Error('Must reject ingredient addition out of tolerance');
    });

    runTest('D06-23', 'Valid Ingredient Dispense Appends Audit Trail', 'EBR', () => {
      const ebr = ManufacturingIntelligenceToolingEngine.initializeElectronicBatchRecord({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        batchNumber: 'BATCH-2026-0904',
        workOrderId: 'WO-2026-0705',
        productSku: 'FG-SYRUP-100ML',
        lineClearance: sampleClearance
      });

      const updatedEbr = ManufacturingIntelligenceToolingEngine.addIngredientDispense({
        ebr,
        itemSku: 'RM-SUCROSE-PURE',
        lotNumber: 'LOT-SUC-881',
        plannedQuantity: 200.0,
        actualQuantity: 201.5, // 0.75% variance (within 5%)
        unitOfMeasure: 'KG',
        weighedBy: 'chemist-steve',
        verifiedBy: 'verifier-linda'
      });

      if (updatedEbr.ingredientsAdded.length !== 1) throw new Error('Expected 1 ingredient added');
      if (updatedEbr.ingredientsAdded[0].itemSku !== 'RM-SUCROSE-PURE') throw new Error('SKU mismatch');
      if (!updatedEbr.sha256AuditSeal || updatedEbr.sha256AuditSeal === ebr.sha256AuditSeal) {
        throw new Error('Audit seal must update after ingredient dispense');
      }
    });

    runTest('D06-24', 'Critical Process Parameter (CPP) Recording & Tolerance Flagging', 'EBR', () => {
      const ebr = ManufacturingIntelligenceToolingEngine.initializeElectronicBatchRecord({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        batchNumber: 'BATCH-2026-0905',
        workOrderId: 'WO-2026-0706',
        productSku: 'FG-INJECTION-VIAL',
        lineClearance: sampleClearance
      });

      // In-spec parameter
      const ebrWithParam1 = ManufacturingIntelligenceToolingEngine.recordCriticalProcessParameter({
        ebr,
        parameterName: 'Autoclave Sterilization Temperature',
        actualValue: 121.4,
        targetValue: 121.0,
        unit: 'CELSIUS',
        lowerTolerance: 120.0,
        upperTolerance: 123.0
      });

      if (!ebrWithParam1.parameters[0].withinTolerance) {
        throw new Error('Param 1 should be within tolerance');
      }

      // Out-of-spec parameter
      const ebrWithParam2 = ManufacturingIntelligenceToolingEngine.recordCriticalProcessParameter({
        ebr: ebrWithParam1,
        parameterName: 'Reactor Agitation Speed',
        actualValue: 550,
        targetValue: 400,
        unit: 'RPM',
        lowerTolerance: 380,
        upperTolerance: 420
      });

      if (ebrWithParam2.parameters[1].withinTolerance) {
        throw new Error('Param 2 should be marked out of tolerance');
      }
    });

    runTest('D06-25', '21 CFR Part 11 Dual Digital Signatures SoD (Prod Lead != QA Officer)', 'EBR', () => {
      const ebr = ManufacturingIntelligenceToolingEngine.initializeElectronicBatchRecord({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        batchNumber: 'BATCH-2026-0906',
        workOrderId: 'WO-2026-0707',
        productSku: 'FG-TEST-VIAL',
        lineClearance: sampleClearance
      });

      let threw = false;
      try {
        ManufacturingIntelligenceToolingEngine.signAndReleaseBatchRecord({
          ebr,
          productionLeadName: 'dr.franklin',
          productionLeadSignature: 'SIG-PROD-9988',
          qualityAssuranceName: 'dr.franklin', // Same person
          qualityAssuranceSignature: 'SIG-QA-9988'
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('21 CFR Part 11 Violation')) throw new Error('Expected 21 CFR Part 11 violation');
      }

      if (!threw) throw new Error('Must reject self-signoff on batch release');
    });

    runTest('D06-26', 'Batch Release Transitions to RELEASED vs QUARANTINED Based on CPP Specs', 'EBR', () => {
      // 1. Fully in-spec batch
      const ebrGood = ManufacturingIntelligenceToolingEngine.initializeElectronicBatchRecord({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        batchNumber: 'BATCH-PASS-01',
        workOrderId: 'WO-2026-0708',
        productSku: 'FG-PASSING-DRUG',
        lineClearance: sampleClearance
      });
      const ebrGoodParam = ManufacturingIntelligenceToolingEngine.recordCriticalProcessParameter({
        ebr: ebrGood,
        parameterName: 'Dissolution pH',
        actualValue: 7.05,
        targetValue: 7.0,
        unit: 'pH',
        lowerTolerance: 6.8,
        upperTolerance: 7.2
      });

      const { releasedEbr: releasedGood, financialEvent: evtGood } = ManufacturingIntelligenceToolingEngine.signAndReleaseBatchRecord({
        ebr: ebrGoodParam,
        productionLeadName: 'lead-walter',
        productionLeadSignature: 'SIG-WALT-001',
        qualityAssuranceName: 'qa-officer-jesse',
        qualityAssuranceSignature: 'SIG-JESS-002',
        batchLotValueUsd: 45000
      });

      if (releasedGood.status !== 'RELEASED') throw new Error(`Expected RELEASED, got ${releasedGood.status}`);
      if (evtGood.eventType !== 'EVT_BATCH_RELEASE_COMPLETED') throw new Error('Invalid financial event for good batch');
      if (evtGood.debitAccount !== '1410-FINISHED-GOODS-INVENTORY') throw new Error('Debit account mismatch');

      // 2. Out-of-spec batch
      const ebrBadParam = ManufacturingIntelligenceToolingEngine.recordCriticalProcessParameter({
        ebr: ebrGood,
        parameterName: 'Dissolution pH Out-Of-Spec',
        actualValue: 8.5, // Out of spec
        targetValue: 7.0,
        unit: 'pH',
        lowerTolerance: 6.8,
        upperTolerance: 7.2
      });

      const { releasedEbr: releasedBad, financialEvent: evtBad } = ManufacturingIntelligenceToolingEngine.signAndReleaseBatchRecord({
        ebr: ebrBadParam,
        productionLeadName: 'lead-walter',
        productionLeadSignature: 'SIG-WALT-001',
        qualityAssuranceName: 'qa-officer-jesse',
        qualityAssuranceSignature: 'SIG-JESS-002',
        batchLotValueUsd: 45000
      });

      if (releasedBad.status !== 'QUARANTINED') throw new Error(`Expected QUARANTINED, got ${releasedBad.status}`);
      if (evtBad.eventType !== 'EVT_BATCH_REJECT_VARIANCE') throw new Error('Invalid financial event for rejected batch');
      if (evtBad.debitAccount !== '5200-MANUFACTURING-SCRAP-VARIANCE') throw new Error('Debit account mismatch');
    });

    // =========================================================================
    // SECTION 5: OEE SIX BIG LOSSES DECOMPOSITION (Tests 27 - 31)
    // =========================================================================

    runTest('D06-27', 'Exact Mathematical OEE (Availability, Performance, Quality, Overall)', 'OEE', () => {
      // 480 mins planned, 420 mins operating => Availability = 420 / 480 = 0.875
      // 12 sec cycle, 1800 pieces => ideal time = 1800 * 12 / 60 = 360 mins => Performance = 360 / 420 = 0.8571
      // 1750 good out of 1800 => Quality = 1750 / 1800 = 0.9722
      // Expected OEE = 0.875 * 0.8571 * 0.9722 = ~0.7291
      const { analysis } = ManufacturingIntelligenceToolingEngine.calculateOEELossTree({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        workCenterId: 'WC-ASSEMBLY-LINE-01',
        periodStart: '2026-09-03 08:00:00',
        periodEnd: '2026-09-03 16:00:00',
        plannedProductionTimeMinutes: 480,
        operatingTimeMinutes: 420,
        idealCycleTimeSeconds: 12,
        totalPiecesProduced: 1800,
        goodPiecesProduced: 1750,
        lossBreakdown: [
          { category: 'EQUIPMENT_BREAKDOWN', durationMinutes: 30, lostUnitsEquivalent: 150, reason: 'Hydraulic leak', impactScore: 70 },
          { category: 'SETUP_CHANGEOVER', durationMinutes: 30, lostUnitsEquivalent: 150, reason: 'Die swap', impactScore: 65 }
        ]
      });

      if (analysis.availabilityRate !== 0.875) throw new Error(`Expected A=0.875, got ${analysis.availabilityRate}`);
      if (Math.abs(analysis.performanceRate - 0.8571) > 0.001) throw new Error(`Performance rate mismatch: ${analysis.performanceRate}`);
      if (Math.abs(analysis.qualityRate - 0.9722) > 0.001) throw new Error(`Quality rate mismatch: ${analysis.qualityRate}`);
      if (Math.abs(analysis.overallEquipmentEffectiveness - 0.7291) > 0.005) {
        throw new Error(`Overall OEE mismatch: ${analysis.overallEquipmentEffectiveness}`);
      }
    });

    runTest('D06-28', 'Boundary Checks on OEE Calculation (Operating Time & Good Pieces Constraints)', 'OEE', () => {
      let threwTime = false;
      try {
        ManufacturingIntelligenceToolingEngine.calculateOEELossTree({
          tenantId: 'TENANT-001',
          companyId: 'COMP-001',
          workCenterId: 'WC-01',
          periodStart: '2026-09-03',
          periodEnd: '2026-09-03',
          plannedProductionTimeMinutes: 400,
          operatingTimeMinutes: 500, // Exceeds planned!
          idealCycleTimeSeconds: 10,
          totalPiecesProduced: 100,
          goodPiecesProduced: 90,
          lossBreakdown: []
        });
      } catch (err: any) {
        threwTime = true;
        if (!err.message.includes('cannot exceed planned')) throw new Error('Expected operating time error');
      }
      if (!threwTime) throw new Error('Must reject operating time > planned production time');

      let threwGood = false;
      try {
        ManufacturingIntelligenceToolingEngine.calculateOEELossTree({
          tenantId: 'TENANT-001',
          companyId: 'COMP-001',
          workCenterId: 'WC-01',
          periodStart: '2026-09-03',
          periodEnd: '2026-09-03',
          plannedProductionTimeMinutes: 400,
          operatingTimeMinutes: 300,
          idealCycleTimeSeconds: 10,
          totalPiecesProduced: 100,
          goodPiecesProduced: 150, // Exceeds total!
          lossBreakdown: []
        });
      } catch (err: any) {
        threwGood = true;
        if (!err.message.includes('cannot exceed total pieces')) throw new Error('Expected good pieces error');
      }
      if (!threwGood) throw new Error('Must reject good pieces > total pieces');
    });

    runTest('D06-29', 'Six Big Losses Categorization & Net / Valuable Operating Time Math', 'OEE', () => {
      const losses: OEELossRecord[] = [
        { category: 'EQUIPMENT_BREAKDOWN', durationMinutes: 40, lostUnitsEquivalent: 200, reason: 'Motor trip', impactScore: 80 },
        { category: 'SETUP_CHANGEOVER', durationMinutes: 20, lostUnitsEquivalent: 100, reason: 'Feeder re-tooling', impactScore: 50 },
        { category: 'IDLING_MINOR_STOPS', durationMinutes: 15, lostUnitsEquivalent: 75, reason: 'Sensor misalignment', impactScore: 40 },
        { category: 'REDUCED_SPEED', durationMinutes: 25, lostUnitsEquivalent: 125, reason: 'Lubrication flow restriction', impactScore: 45 },
        { category: 'PROCESS_DEFECTS', durationMinutes: 10, lostUnitsEquivalent: 50, reason: 'Burr trimming failure', impactScore: 30 },
        { category: 'STARTUP_REDUCED_YIELD', durationMinutes: 10, lostUnitsEquivalent: 50, reason: 'Cold start scrap', impactScore: 35 }
      ];

      const { analysis } = ManufacturingIntelligenceToolingEngine.calculateOEELossTree({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        workCenterId: 'WC-STAMPING-04',
        periodStart: '2026-09-03 00:00:00',
        periodEnd: '2026-09-03 08:00:00',
        plannedProductionTimeMinutes: 480,
        operatingTimeMinutes: 400,
        idealCycleTimeSeconds: 6,
        totalPiecesProduced: 3000,
        goodPiecesProduced: 2850,
        lossBreakdown: losses
      });

      if (analysis.losses.length !== 6) throw new Error('Expected all 6 losses recorded');
      if (analysis.scrapPiecesProduced !== 150) throw new Error(`Expected 150 scrap pieces, got ${analysis.scrapPiecesProduced}`);
      if (analysis.valuableOperatingTimeMinutes <= 0) throw new Error('Valuable operating time should be positive');
    });

    runTest('D06-30', 'MTBF & MTTR Mean Reliability Calculations', 'OEE', () => {
      const breakdownLosses: OEELossRecord[] = [
        { category: 'EQUIPMENT_BREAKDOWN', durationMinutes: 45, lostUnitsEquivalent: 90, reason: 'Belt tear', impactScore: 90 },
        { category: 'EQUIPMENT_BREAKDOWN', durationMinutes: 15, lostUnitsEquivalent: 30, reason: 'Limit switch fault', impactScore: 60 }
      ];

      const { analysis } = ManufacturingIntelligenceToolingEngine.calculateOEELossTree({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        workCenterId: 'WC-CNC-CELL-02',
        periodStart: '2026-09-03',
        periodEnd: '2026-09-03',
        plannedProductionTimeMinutes: 480,
        operatingTimeMinutes: 420,
        idealCycleTimeSeconds: 15,
        totalPiecesProduced: 1200,
        goodPiecesProduced: 1180,
        lossBreakdown: breakdownLosses
      });

      // MTTR = (45 + 15) / 2 = 30 minutes
      if (analysis.meanTimeToRepairMinutes !== 30) {
        throw new Error(`Expected MTTR 30 mins, got ${analysis.meanTimeToRepairMinutes}`);
      }

      // MTBF = (420 / 60) / 2 = 3.5 hours
      if (analysis.meanTimeBetweenFailuresHours !== 3.5) {
        throw new Error(`Expected MTBF 3.5 hours, got ${analysis.meanTimeBetweenFailuresHours}`);
      }
    });

    runTest('D06-31', 'Setup & Changeover Loss Triggers Decoupled Financial Event', 'OEE', () => {
      const { changeoverEvent } = ManufacturingIntelligenceToolingEngine.calculateOEELossTree({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        workCenterId: 'WC-PACK-LINE-05',
        periodStart: '2026-09-03',
        periodEnd: '2026-09-03',
        plannedProductionTimeMinutes: 480,
        operatingTimeMinutes: 360,
        idealCycleTimeSeconds: 5,
        totalPiecesProduced: 3500,
        goodPiecesProduced: 3450,
        lossBreakdown: [
          { category: 'SETUP_CHANGEOVER', durationMinutes: 120, lostUnitsEquivalent: 1440, reason: 'Complete bottle size conversion', impactScore: 85 }
        ]
      });

      if (!changeoverEvent) throw new Error('Expected changeover financial event');
      if (changeoverEvent.eventType !== 'EVT_CHANGEOVER_SETUP_COST') throw new Error('Event type mismatch');
      // 120 mins = 2 hrs @ $150/hr = $300
      if (changeoverEvent.amount !== 300.0) throw new Error(`Expected $300.00 setup cost, got ${changeoverEvent.amount}`);
    });

    // =========================================================================
    // SECTION 6: SHIFT HANDOVER LOGBOOK GOVERNANCE (Tests 32 - 35)
    // =========================================================================

    let activeHandover: ShiftHandoverLogbook;

    runTest('D06-32', 'Shift Handover Record Creation by Outgoing Supervisor', 'SHIFT_HANDOVER', () => {
      activeHandover = ManufacturingIntelligenceToolingEngine.createShiftHandover({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        shiftId: 'SHIFT-DAY-20260903',
        workCenterId: 'WC-ASSEMBLY-HALL',
        outgoingSupervisor: 'supervisor-claudia',
        shiftStartTime: '2026-09-03 07:00:00',
        shiftEndTime: '2026-09-03 15:30:00',
        totalOutputUnits: 450,
        scrapUnits: 8,
        wipItemsInCell: [
          { workOrderId: 'WO-2026-0991', stage: 'Stage 3 Wiring', quantity: 24 }
        ],
        unresolvedAnomalies: [
          { alertId: 'ALT-991', severity: 'MEDIUM', description: 'Conveyor belt speed flutter', actionPending: 'Check tensioner' }
        ],
        safetyIncidentsCount: 0,
        handoverNotes: 'Smooth production, planned maintenance due on station 4 tomorrow.'
      });

      if (!activeHandover.id.startsWith('SHF-')) throw new Error('Invalid Handover ID');
      if (activeHandover.isSignedOffByBoth) throw new Error('Should not be signed off by both initially');
      if (!activeHandover.sha256Seal || activeHandover.sha256Seal.length !== 64) throw new Error('Invalid SHA-256 seal');
    });

    runTest('D06-33', 'SoD Violation: Incoming Supervisor Cannot Be Outgoing Supervisor', 'SHIFT_HANDOVER', () => {
      let threw = false;
      try {
        ManufacturingIntelligenceToolingEngine.signOffShiftHandover({
          handover: activeHandover,
          incomingSupervisor: 'supervisor-claudia', // Same person
          acknowledgementNotes: 'Self signoff'
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('Segregation of Duties Violation')) throw new Error('Expected SoD violation');
      }

      if (!threw) throw new Error('Must reject self-signoff on shift handover');
    });

    runTest('D06-34', 'Successful Dual Sign-Off Freezes Handover with Final Seal', 'SHIFT_HANDOVER', () => {
      const signed = ManufacturingIntelligenceToolingEngine.signOffShiftHandover({
        handover: activeHandover,
        incomingSupervisor: 'supervisor-marcus',
        acknowledgementNotes: 'Reviewed anomaly ALT-991, notified maintenance technician.'
      });

      if (!signed.isSignedOffByBoth) throw new Error('Expected isSignedOffByBoth to be true');
      if (signed.incomingSupervisor !== 'supervisor-marcus') throw new Error('Incoming supervisor mismatch');
      if (!signed.signedOffAt) throw new Error('Missing signedOffAt timestamp');
      if (!signed.handoverNotes.includes('Incoming Note: Reviewed anomaly')) throw new Error('Missing acknowledgement notes');
      if (!signed.sha256Seal || signed.sha256Seal === activeHandover.sha256Seal) {
        throw new Error('Handover seal must update after dual sign-off');
      }
    });

    runTest('D06-35', 'Prevent Duplicate Sign-Off on Already Completed Handover', 'SHIFT_HANDOVER', () => {
      const signed = ManufacturingIntelligenceToolingEngine.signOffShiftHandover({
        handover: activeHandover,
        incomingSupervisor: 'supervisor-marcus',
        acknowledgementNotes: 'Completed'
      });

      let threw = false;
      try {
        ManufacturingIntelligenceToolingEngine.signOffShiftHandover({
          handover: signed,
          incomingSupervisor: 'supervisor-elena'
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('already been completed')) throw new Error('Expected already completed error');
      }

      if (!threw) throw new Error('Must block duplicate sign-off on already signed handover');
    });

    const passed = results.filter(r => r.passed).length;
    return {
      passed,
      total: results.length,
      results,
      phase: 'Phase 3.2D-06: Advanced Manufacturing Intelligence, Tooling & eBR Compliance'
    };
  }
}
