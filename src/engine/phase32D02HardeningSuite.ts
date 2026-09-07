/**
 * AM Enterprise ERP — Phase 3.2D-02 Hardening Test Suite
 * Shop Floor Dispatching, Machine IoT & Quality Inspections (QM/MES)
 * 
 * 30 Enterprise Scenarios covering:
 * - Shop Floor Dispatching, Shift Scheduling, Operator Certifications & Priority Rules
 * - Machine Masters, IoT Telemetry Ingestion, Automated Safety Interlocks & OEE Analytics
 * - Quality Inspection Plans, ISO-2859 Sampling, Characteristic Measurements & SoD Usage Decisions
 * - Non-Conformance Reports (NCR), Quarantine Controls, 5-Whys CAPA & Decoupled Financial Events
 * - Serial/Lot Forward & Backward Traceability with Cryptographic SHA-256 Seals
 */

import { ShopFloorQualityEngine } from './shopFloorQualityEngine';
import { ManufacturingEngine } from './manufacturingEngine';
import {
  ShopFloorOperator,
  MachineMaster,
  ShopFloorDispatchOrder,
  DowntimeEvent,
  InspectionPlan,
  InspectionLot,
  NonConformanceReport,
  CorrectivePreventiveAction,
  SerialGenealogyRecord
} from '../types/shopFloorQuality';
import { BillOfMaterials, Routing, WorkCenter, ProductionWorkOrder } from '../types/manufacturing';

export interface TestCaseResult {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

export interface HardeningSuiteSummary {
  phase: string;
  total: number;
  passed: number;
  failed: number;
  results: TestCaseResult[];
}

export class Phase32D02HardeningSuite {
  public static runAll(): HardeningSuiteSummary {
    const results: TestCaseResult[] = [];

    const runTest = (id: string, name: string, category: string, fn: () => void) => {
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

    // ==========================================
    // SHARED FIXTURES SETUP
    // ==========================================
    const tenantId = 'tenant-am-global';
    const companyId = 'comp-egypt-01';

    // 1. Work Center, BOM & Routing
    const wcCNC: WorkCenter = {
      id: 'wc-cnc-01',
      tenantId,
      companyId,
      workCenterCode: 'WC-CNC',
      name: 'CNC Precision Machining Center',
      costCenterCode: 'CC-MFG-01',
      hourlyLaborRate: 50,
      hourlyMachineRate: 80,
      hourlyOverheadRate: 30,
      capacityHoursPerDay: 16,
      efficiencyPercent: 100,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const sharedBOM: BillOfMaterials = {
      id: 'bom-turbine-01',
      tenantId,
      companyId,
      bomNumber: 'BOM-TURB-001',
      finishedGoodSku: 'FG-TURBINE-01',
      finishedGoodName: 'Industrial Gas Turbine Core',
      version: 1,
      status: 'ACTIVE',
      baseQuantity: 1,
      uom: 'EA',
      components: [
        {
          componentId: 'c1',
          sku: 'RM-ALLOY-BAR',
          description: 'Titanium Inconel Alloy Bar',
          componentType: 'RAW_MATERIAL',
          quantityPerUnit: 2,
          scrapFactorPercent: 0.05,
          uom: 'KG',
          costPerUnit: 200,
          warehouseId: 'WH-RAW-01'
        },
        {
          componentId: 'c2',
          sku: 'RM-ROTOR-BEARING',
          description: 'Ceramic High-Speed Rotor Bearing',
          componentType: 'RAW_MATERIAL',
          quantityPerUnit: 4,
          scrapFactorPercent: 0.0,
          uom: 'EA',
          costPerUnit: 150,
          warehouseId: 'WH-RAW-01'
        }
      ],
      effectiveFrom: '2026-01-01',
      createdBy: 'eng-lead-01',
      createdAt: new Date().toISOString()
    };

    const sharedRouting: Routing = {
      id: 'rtg-turb-01',
      tenantId,
      companyId,
      routingNumber: 'RTG-TURB-001',
      finishedGoodSku: 'FG-TURBINE-01',
      version: 1,
      status: 'ACTIVE',
      operations: [
        {
          operationNumber: 10,
          operationName: 'CNC Rotor Milling & Turning',
          workCenterId: wcCNC.id,
          workCenterCode: wcCNC.workCenterCode,
          setupTimeHours: 1.0,
          runTimeHoursPerUnit: 2.0,
          isMilestone: true
        },
        {
          operationNumber: 20,
          operationName: 'Precision Dynamic Balancing & Assembly',
          workCenterId: wcCNC.id,
          workCenterCode: wcCNC.workCenterCode,
          setupTimeHours: 0.5,
          runTimeHoursPerUnit: 1.5,
          isMilestone: true
        }
      ],
      createdBy: 'eng-lead-01',
      createdAt: new Date().toISOString()
    };

    // Shared Released Work Order
    const sharedWorkOrder: ProductionWorkOrder = ManufacturingEngine.createWorkOrder({
      tenantId,
      companyId,
      finishedGoodSku: 'FG-TURBINE-01',
      finishedGoodName: 'Industrial Gas Turbine Core',
      bom: sharedBOM,
      routing: sharedRouting,
      workCenters: [wcCNC],
      plannedQuantity: 10,
      uom: 'EA',
      plannedStartDate: '2026-09-05T08:00:00Z',
      plannedEndDate: '2026-09-10T17:00:00Z',
      targetWarehouseId: 'WH-FG-01',
      createdBy: 'planner-01'
    });

    const releasedWO: ProductionWorkOrder = ManufacturingEngine.releaseWorkOrder(sharedWorkOrder, 'prod-manager-01');

    // Shared Machine Master
    const sharedMachine: MachineMaster = ShopFloorQualityEngine.createMachine({
      tenantId,
      companyId,
      machineCode: 'CNC-5AXIS-01',
      name: 'DMG Mori 5-Axis Milling Machine',
      workCenterId: wcCNC.id,
      workCenterCode: wcCNC.workCenterCode,
      iotDeviceId: 'IOT-DEV-CNC-009',
      nominalCycleTimeSeconds: 120,
      nominalSpeedUnitsPerHour: 30,
      maxOperatingTemperature: 85,
      maxVibrationThreshold: 7.5
    });

    // Shared Operator
    const sharedOperator: ShopFloorOperator = ShopFloorQualityEngine.createOperator({
      tenantId,
      companyId,
      employeeNumber: 'EMP-OP-401',
      name: 'Ahmed El-Sayed',
      certifiedSkills: ['CNC_OPERATION', 'GENERAL_ASSEMBLY'],
      currentShift: 'MORNING',
      assignedWorkCenterId: wcCNC.id
    });

    // Shared Inspection Plan
    const sharedInspectionPlan: InspectionPlan = ShopFloorQualityEngine.createInspectionPlan({
      tenantId,
      companyId,
      planNumber: 'IP-TURB-001',
      itemSku: 'FG-TURBINE-01',
      inspectionType: 'IN_PROCESS',
      characteristics: [
        {
          characteristicId: 'CHAR-01',
          name: 'Rotor Shaft Outer Diameter',
          type: 'QUANTITATIVE',
          targetValue: 50.0,
          lowerTolerance: 49.95,
          upperTolerance: 50.05,
          uom: 'MM',
          isCritical: true
        },
        {
          characteristicId: 'CHAR-02',
          name: 'Surface Finish Roughness Ra',
          type: 'QUANTITATIVE',
          targetValue: 0.8,
          lowerTolerance: 0.0,
          upperTolerance: 1.2,
          uom: 'MICRON',
          isCritical: false
        },
        {
          characteristicId: 'CHAR-03',
          name: 'Visual Micro-Crack Inspection',
          type: 'QUALITATIVE',
          acceptableQualitativeValues: ['PASS', 'NO_CRACKS_DETECTED'],
          isCritical: true
        }
      ],
      samplingRule: 'ISO_2859_NORMAL',
      sampleRateOrSize: 0
    });

    let sharedDispatch: ShopFloorDispatchOrder;
    let sharedInspectionLot: InspectionLot;
    let sharedNCR: NonConformanceReport;
    let sharedCAPA: CorrectivePreventiveAction;
    let sharedGenealogy: SerialGenealogyRecord;

    // =========================================================================
    // CATEGORY 1: SHOP FLOOR DISPATCHING & SHIFT SCHEDULES (Tests 1 - 7)
    // =========================================================================

    runTest('P32D-02-01', 'Register Shop Floor Operator with skills and shift assignment', 'Dispatching', () => {
      const op = ShopFloorQualityEngine.createOperator({
        tenantId,
        companyId,
        employeeNumber: 'EMP-OP-999',
        name: 'Tariq Hassan',
        certifiedSkills: ['ROBOTICS', 'SMT_ASSEMBLY'],
        currentShift: 'AFTERNOON'
      });
      if (!op.id || op.name !== 'Tariq Hassan' || op.certifiedSkills.length !== 2) {
        throw new Error('Failed to register operator');
      }
    });

    runTest('P32D-02-02', 'Prevent dispatch operation on unreleased/draft work order', 'Dispatching', () => {
      let blocked = false;
      try {
        ShopFloorQualityEngine.dispatchWorkOrderOperation({
          tenantId,
          companyId,
          workOrder: sharedWorkOrder, // PLANNED status, not RELEASED
          operationNumber: 10,
          routingOperationName: 'CNC Milling',
          workCenterId: wcCNC.id,
          workCenterCode: wcCNC.workCenterCode,
          shift: 'MORNING',
          plannedStart: '2026-09-05T08:00:00Z',
          plannedEnd: '2026-09-05T12:00:00Z',
          targetQuantity: 10,
          requiredSkill: 'CNC_OPERATION'
        });
      } catch (err: any) {
        if (err.message.includes('Order must be RELEASED')) {
          blocked = true;
        }
      }
      if (!blocked) throw new Error('Expected dispatch to fail on non-released work order');
    });

    runTest('P32D-02-03', 'Enforce Operator Qualification Gate (reject uncertified operator)', 'Dispatching', () => {
      const uncertifiedOperator = ShopFloorQualityEngine.createOperator({
        tenantId,
        companyId,
        employeeNumber: 'EMP-OP-402',
        name: 'Mahmoud Ali',
        certifiedSkills: ['GENERAL_ASSEMBLY'], // Lacks CNC_OPERATION
        currentShift: 'MORNING'
      });

      let blocked = false;
      try {
        ShopFloorQualityEngine.dispatchWorkOrderOperation({
          tenantId,
          companyId,
          workOrder: releasedWO,
          operationNumber: 10,
          routingOperationName: 'CNC Milling',
          workCenterId: wcCNC.id,
          workCenterCode: wcCNC.workCenterCode,
          assignedMachine: sharedMachine,
          assignedOperator: uncertifiedOperator,
          shift: 'MORNING',
          plannedStart: '2026-09-05T08:00:00Z',
          plannedEnd: '2026-09-05T12:00:00Z',
          targetQuantity: 10,
          requiredSkill: 'CNC_OPERATION'
        });
      } catch (err: any) {
        if (err.message.includes('Qualification Gate Failed')) {
          blocked = true;
        }
      }
      if (!blocked) throw new Error('Expected qualification gate to reject uncertified operator');
    });

    runTest('P32D-02-04', 'Dispatch operation with Critical Ratio (CR) priority calculation', 'Dispatching', () => {
      sharedDispatch = ShopFloorQualityEngine.dispatchWorkOrderOperation({
        tenantId,
        companyId,
        workOrder: releasedWO,
        operationNumber: 10,
        routingOperationName: 'CNC Rotor Milling & Turning',
        workCenterId: wcCNC.id,
        workCenterCode: wcCNC.workCenterCode,
        assignedMachine: sharedMachine,
        assignedOperator: sharedOperator,
        shift: 'MORNING',
        plannedStart: '2026-09-05T08:00:00Z',
        plannedEnd: '2026-09-05T12:00:00Z',
        targetQuantity: 10,
        requiredSkill: 'CNC_OPERATION',
        priorityRule: 'CRITICAL_RATIO'
      });

      if (!sharedDispatch.id || sharedDispatch.status !== 'DISPATCHED' || sharedDispatch.criticalRatio === undefined) {
        throw new Error('Expected dispatch order with calculated Critical Ratio');
      }
    });

    runTest('P32D-02-05', 'Transition dispatch order to IN_PROGRESS and machine to RUNNING', 'Dispatching', () => {
      const { updatedDispatchOrder, updatedMachine } = ShopFloorQualityEngine.startDispatchOrder(sharedDispatch, sharedMachine);
      if (updatedDispatchOrder.status !== 'IN_PROGRESS' || !updatedDispatchOrder.actualStart) {
        throw new Error('Expected dispatch status IN_PROGRESS with actualStart');
      }
      if (updatedMachine?.currentState !== 'RUNNING') {
        throw new Error('Expected machine state to transition to RUNNING');
      }
      sharedDispatch = updatedDispatchOrder;
    });

    runTest('P32D-02-06', 'Pause and resume dispatch order with reason logging', 'Dispatching', () => {
      const { updatedDispatchOrder: pausedDispatch, updatedMachine: idleMach } = ShopFloorQualityEngine.pauseDispatchOrder(
        sharedDispatch,
        'Tooling re-calibration and coolant top-up',
        sharedMachine
      );
      if (pausedDispatch.status !== 'PAUSED' || !pausedDispatch.notes?.includes('Tooling re-calibration')) {
        throw new Error('Expected dispatch status PAUSED');
      }
      if (idleMach?.currentState !== 'IDLE') {
        throw new Error('Expected machine state IDLE during pause');
      }

      const { updatedDispatchOrder: resumedDispatch } = ShopFloorQualityEngine.startDispatchOrder(pausedDispatch);
      if (resumedDispatch.status !== 'IN_PROGRESS') {
        throw new Error('Expected dispatch status IN_PROGRESS on resume');
      }
      sharedDispatch = resumedDispatch;
    });

    runTest('P32D-02-07', 'Time ticketing: record operator hours, machine duration, good & scrap counts', 'Dispatching', () => {
      const ticket = ShopFloorQualityEngine.recordTimeTicket({
        tenantId,
        companyId,
        dispatchOrder: sharedDispatch,
        operatorId: sharedOperator.id,
        machineId: sharedMachine.id,
        startTime: '2026-09-05T08:00:00Z',
        endTime: '2026-09-05T11:30:00Z',
        goodQuantity: 9,
        scrapQuantity: 1
      });

      if (ticket.durationMinutes !== 210 || ticket.goodQuantity !== 9 || ticket.scrapQuantity !== 1) {
        throw new Error(`Invalid time ticket duration or counts: ${JSON.stringify(ticket)}`);
      }
    });

    // =========================================================================
    // CATEGORY 2: MACHINE IOT, TELEMETRY & OEE ANALYTICS (Tests 8 - 14)
    // =========================================================================

    runTest('P32D-02-08', 'Create Machine Master with IoT Device ID and operational thresholds', 'Machine IoT', () => {
      const mach = ShopFloorQualityEngine.createMachine({
        tenantId,
        companyId,
        machineCode: 'SMT-ROBOT-01',
        name: 'Pick-and-Place SMT Robot',
        workCenterId: 'wc-smt',
        workCenterCode: 'WC-SMT',
        iotDeviceId: 'IOT-SMT-77',
        nominalCycleTimeSeconds: 45,
        nominalSpeedUnitsPerHour: 80,
        maxOperatingTemperature: 80,
        maxVibrationThreshold: 5.0
      });
      if (mach.nominalSpeedUnitsPerHour !== 80 || mach.currentState !== 'IDLE') {
        throw new Error('Failed to create machine master');
      }
    });

    runTest('P32D-02-09', 'Ingest normal IoT telemetry stream without safety alarms', 'Machine IoT', () => {
      const normalTelemetry = {
        machineId: sharedMachine.id,
        iotDeviceId: sharedMachine.iotDeviceId,
        timestamp: '2026-09-05T09:30:00Z',
        sensorReadings: {
          temperatureCelsius: 68.5,
          vibrationMmPerSec: 2.1,
          spindleRpm: 12000,
          powerKw: 15.4
        },
        cycleCounter: 142,
        activeErrorCodes: []
      };

      const result = ShopFloorQualityEngine.ingestIoTTelemetry({
        telemetry: normalTelemetry,
        machine: sharedMachine,
        activeDispatch: sharedDispatch
      });

      if (result.alertTriggered || result.updatedMachine.currentState === 'UNPLANNED_DOWNTIME') {
        throw new Error('Normal telemetry should not trigger downtime or safety alerts');
      }
    });

    runTest('P32D-02-10', 'Automated Thermal Safety Interlock: High temp (>85°C) auto-trips UNPLANNED_DOWNTIME & interrupts dispatch', 'Machine IoT', () => {
      const hotTelemetry = {
        machineId: sharedMachine.id,
        iotDeviceId: sharedMachine.iotDeviceId,
        timestamp: '2026-09-05T10:15:00Z',
        sensorReadings: {
          temperatureCelsius: 94.2, // Exceeds 85°C threshold!
          vibrationMmPerSec: 3.2,
          spindleRpm: 12500,
          powerKw: 22.1
        },
        cycleCounter: 180,
        activeErrorCodes: ['OVERTEMP_SENS_01']
      };

      const result = ShopFloorQualityEngine.ingestIoTTelemetry({
        telemetry: hotTelemetry,
        machine: sharedMachine,
        activeDispatch: sharedDispatch
      });

      if (!result.alertTriggered) throw new Error('Expected alertTriggered=true on overheating');
      if (result.updatedMachine.currentState !== 'UNPLANNED_DOWNTIME') {
        throw new Error('Expected machine state to transition to UNPLANNED_DOWNTIME');
      }
      if (!result.downtimeEvent || result.downtimeEvent.category !== 'SAFETY_INTERLOCK') {
        throw new Error('Expected automated SAFETY_INTERLOCK downtime event');
      }
      if (result.interruptedDispatch?.status !== 'INTERRUPTED') {
        throw new Error('Expected active dispatch order to be auto-INTERRUPTED');
      }
    });

    runTest('P32D-02-11', 'Automated Vibration Safety Interlock: Excessive vibration (>7.5 mm/s) triggers safety shutdown', 'Machine IoT', () => {
      const shakingTelemetry = {
        machineId: sharedMachine.id,
        iotDeviceId: sharedMachine.iotDeviceId,
        timestamp: '2026-09-05T10:20:00Z',
        sensorReadings: {
          temperatureCelsius: 70.0,
          vibrationMmPerSec: 9.8, // Exceeds 7.5 mm/s threshold!
          spindleRpm: 8000,
          powerKw: 14.0
        },
        cycleCounter: 190,
        activeErrorCodes: []
      };

      const result = ShopFloorQualityEngine.ingestIoTTelemetry({
        telemetry: shakingTelemetry,
        machine: sharedMachine
      });

      if (!result.alertTriggered || result.updatedMachine.currentState !== 'UNPLANNED_DOWNTIME') {
        throw new Error('Expected vibration interlock shutdown');
      }
    });

    runTest('P32D-02-12', 'Reject starting new dispatch on machine currently in UNPLANNED_DOWNTIME state', 'Machine IoT', () => {
      const downMachine: MachineMaster = {
        ...sharedMachine,
        currentState: 'UNPLANNED_DOWNTIME'
      };

      let blocked = false;
      try {
        ShopFloorQualityEngine.startDispatchOrder(sharedDispatch, downMachine);
      } catch (err: any) {
        if (err.message.includes('UNPLANNED_DOWNTIME')) {
          blocked = true;
        }
      }
      if (!blocked) throw new Error('Expected startDispatchOrder to fail on down machine');
    });

    runTest('P32D-02-13', 'Resolve downtime event with maintenance root cause, duration calculation & restore IDLE', 'Machine IoT', () => {
      const activeEvent: DowntimeEvent = {
        id: 'dt-001',
        tenantId,
        companyId,
        machineId: sharedMachine.id,
        machineCode: sharedMachine.machineCode,
        startTime: '2026-09-05T10:00:00Z',
        durationMinutes: 0,
        category: 'SAFETY_INTERLOCK',
        reasonCode: 'THERMAL_INTERLOCK',
        description: 'Spindle cooling failure',
        status: 'ACTIVE'
      };

      const { resolvedEvent, updatedMachine } = ShopFloorQualityEngine.resolveDowntimeEvent({
        event: activeEvent,
        machine: { ...sharedMachine, currentState: 'UNPLANNED_DOWNTIME' },
        resolvedBy: 'maint-tech-01',
        resolutionNotes: 'Coolant line purged and replaced thermal sensor',
        resolvedAt: '2026-09-05T10:45:00Z'
      });

      if (resolvedEvent.status !== 'RESOLVED' || resolvedEvent.durationMinutes !== 45) {
        throw new Error(`Expected resolved event with 45 mins duration, got ${resolvedEvent.durationMinutes}`);
      }
      if (updatedMachine.currentState !== 'IDLE') {
        throw new Error('Expected machine state restored to IDLE');
      }
    });

    runTest('P32D-02-14', 'OEE calculation engine: verify Availability, Performance, Quality, and World-Class benchmark', 'Machine IoT', () => {
      // 480 planned mins (8h shift), 48 mins unplanned downtime -> Operating = 432 mins (Availability = 0.90)
      // Cycle time = 120s (2 mins). In 432 mins, could produce 216 units. Produced 200 units -> Performance = 200/216 ~ 0.9259
      // Total 200 units, 190 good -> Quality = 190/200 = 0.95
      // OEE = 0.90 * 0.9259 * 0.95 = 79.17% (Not world class, < 85%)
      const downtime: DowntimeEvent = {
        id: 'dt-sample',
        tenantId,
        companyId,
        machineId: sharedMachine.id,
        machineCode: sharedMachine.machineCode,
        startTime: '2026-09-05T09:00:00Z',
        endTime: '2026-09-05T09:48:00Z',
        durationMinutes: 48,
        category: 'TOOLING',
        reasonCode: 'INSERT_WEAR',
        description: 'Tool replacement',
        status: 'RESOLVED'
      };

      const oee = ShopFloorQualityEngine.calculateOEE({
        machine: sharedMachine,
        periodStart: '2026-09-05T08:00:00Z',
        periodEnd: '2026-09-05T16:00:00Z',
        plannedProductionTimeMinutes: 480,
        downtimeEvents: [downtime],
        totalUnitsProduced: 200,
        goodUnitsProduced: 190
      });

      if (oee.availabilityRate !== 0.9) {
        throw new Error(`Expected availabilityRate 0.90, got ${oee.availabilityRate}`);
      }
      if (oee.qualityRate !== 0.95) {
        throw new Error(`Expected qualityRate 0.95, got ${oee.qualityRate}`);
      }
      if (oee.worldClassCompliant !== false) {
        throw new Error('Expected worldClassCompliant=false for OEE < 85%');
      }

      // Test World Class compliant setup (>85%)
      const worldClassOEE = ShopFloorQualityEngine.calculateOEE({
        machine: sharedMachine,
        periodStart: '2026-09-05T08:00:00Z',
        periodEnd: '2026-09-05T16:00:00Z',
        plannedProductionTimeMinutes: 480,
        downtimeEvents: [], // 0 downtime -> Availability = 1.0
        totalUnitsProduced: 240,
        goodUnitsProduced: 235 // Quality = 0.9792, Performance = 1.0 -> OEE ~ 97.9%
      });
      if (!worldClassOEE.worldClassCompliant || worldClassOEE.oeePercent < 85) {
        throw new Error('Expected worldClassCompliant=true for zero downtime run');
      }
    });

    // =========================================================================
    // CATEGORY 3: QUALITY MANAGEMENT, SAMPLING & INSPECTION LOTS (Tests 15 - 20)
    // =========================================================================

    runTest('P32D-02-15', 'Create Quality Inspection Plan with quantitative tolerances and qualitative criteria', 'Quality Management', () => {
      const plan = ShopFloorQualityEngine.createInspectionPlan({
        tenantId,
        companyId,
        planNumber: 'IP-VALVE-01',
        itemSku: 'FG-VALVE-CORE',
        inspectionType: 'FINAL_INSPECTION',
        characteristics: [
          {
            characteristicId: 'C-PRESS',
            name: 'Burst Pressure Rating',
            type: 'QUANTITATIVE',
            targetValue: 300,
            lowerTolerance: 280,
            upperTolerance: 350,
            uom: 'BAR',
            isCritical: true
          }
        ],
        samplingRule: 'PERCENTAGE',
        sampleRateOrSize: 10
      });

      if (plan.characteristics.length !== 1 || plan.samplingRule !== 'PERCENTAGE') {
        throw new Error('Failed to create inspection plan');
      }
    });

    runTest('P32D-02-16', 'Generate Inspection Lot with ISO-2859-1 Normal Sampling rule calculation', 'Quality Management', () => {
      // Lot size of 100 with ISO_2859_NORMAL should compute sample size of 13
      sharedInspectionLot = ShopFloorQualityEngine.generateInspectionLot({
        tenantId,
        companyId,
        inspectionType: 'IN_PROCESS',
        itemSku: 'FG-TURBINE-01',
        itemName: 'Industrial Gas Turbine Core',
        lotSize: 100,
        sourceDocumentType: 'WORK_ORDER',
        sourceDocumentId: releasedWO.id,
        sourceDocumentNumber: releasedWO.orderNumber,
        operationNumber: 10,
        plan: sharedInspectionPlan,
        createdBy: 'qa-engineer-01'
      });

      if (sharedInspectionLot.sampleSize !== 13) {
        throw new Error(`Expected ISO 2859-1 sample size 13 for lot size 100, got ${sharedInspectionLot.sampleSize}`);
      }
      if (sharedInspectionLot.status !== 'CREATED') {
        throw new Error('Expected inspection lot status CREATED');
      }
    });

    runTest('P32D-02-17', 'Record sample measurements with tolerance verification (pass/fail per characteristic)', 'Quality Management', () => {
      const sampleMeasurements = [
        {
          sampleNumber: 1,
          characteristicId: 'CHAR-01',
          numericValue: 50.02, // In range [49.95, 50.05] -> PASS
          pass: false
        },
        {
          sampleNumber: 1,
          characteristicId: 'CHAR-02',
          numericValue: 0.75, // In range [0.0, 1.2] -> PASS
          pass: false
        },
        {
          sampleNumber: 1,
          characteristicId: 'CHAR-03',
          qualitativeValue: 'PASS', // Acceptable -> PASS
          pass: false
        },
        {
          sampleNumber: 2,
          characteristicId: 'CHAR-01',
          numericValue: 50.12, // Out of tolerance (> 50.05) -> FAIL!
          pass: false
        }
      ];

      sharedInspectionLot = ShopFloorQualityEngine.recordInspectionMeasurements({
        lot: sharedInspectionLot,
        plan: sharedInspectionPlan,
        measurements: sampleMeasurements
      });

      if (sharedInspectionLot.status !== 'RECORDING_IN_PROGRESS') {
        throw new Error('Expected lot status RECORDING_IN_PROGRESS');
      }
      const sample1Char1 = sharedInspectionLot.measurements.find(m => m.sampleNumber === 1 && m.characteristicId === 'CHAR-01');
      const sample2Char1 = sharedInspectionLot.measurements.find(m => m.sampleNumber === 2 && m.characteristicId === 'CHAR-01');

      if (!sample1Char1?.pass) throw new Error('Expected sample 1 char 1 to PASS');
      if (sample2Char1?.pass) throw new Error('Expected sample 2 char 1 to FAIL');
    });

    runTest('P32D-02-18', 'Segregation of Duties (SoD): Block production operator from making QA Usage Decision', 'Quality Management', () => {
      let blocked = false;
      try {
        ShopFloorQualityEngine.makeUsageDecision({
          lot: sharedInspectionLot,
          decision: 'APPROVED',
          decidedBy: sharedOperator.id, // Ahmed El-Sayed (Operator)
          producerOrOperatorId: sharedOperator.id // Same person!
        });
      } catch (err: any) {
        if (err.message.includes('Segregation of Duties Violation')) {
          blocked = true;
        }
      }
      if (!blocked) throw new Error('Expected SoD rejection when operator attempts to approve own production');
    });

    runTest('P32D-02-19', 'Authorized QA inspector executes usage decision with 64-char cryptographic SHA-256 seal', 'Quality Management', () => {
      const { updatedLot, cryptographicSeal } = ShopFloorQualityEngine.makeUsageDecision({
        lot: sharedInspectionLot,
        decision: 'REWORK_REQUIRED',
        decidedBy: 'qa-inspector-fatima',
        producerOrOperatorId: sharedOperator.id, // Different person!
        notes: 'Sample 2 shaft diameter out of tolerance by 0.07mm'
      });

      if (updatedLot.status !== 'COMPLETED' || updatedLot.usageDecision !== 'REWORK_REQUIRED') {
        throw new Error('Expected lot status COMPLETED with REWORK_REQUIRED decision');
      }
      if (!cryptographicSeal || cryptographicSeal.length !== 64) {
        throw new Error(`Expected 64-character SHA-256 seal, got '${cryptographicSeal}'`);
      }
      sharedInspectionLot = updatedLot;
    });

    runTest('P32D-02-20', 'Prevent duplicate usage decision on already completed inspection lot', 'Quality Management', () => {
      let blocked = false;
      try {
        ShopFloorQualityEngine.makeUsageDecision({
          lot: sharedInspectionLot, // Already completed
          decision: 'APPROVED',
          decidedBy: 'qa-manager-01'
        });
      } catch (err: any) {
        if (err.message.includes('already been posted')) {
          blocked = true;
        }
      }
      if (!blocked) throw new Error('Expected rejection on duplicate usage decision');
    });

    // =========================================================================
    // CATEGORY 4: DEFECTS, NCR & CAPA MANAGEMENT (Tests 21 - 26)
    // =========================================================================

    runTest('P32D-02-21', 'Create Non-Conformance Report (NCR) with automatic quarantine of defective stock', 'NCR & CAPA', () => {
      sharedNCR = ShopFloorQualityEngine.createNonConformanceReport({
        tenantId,
        companyId,
        sourceDocNumber: sharedInspectionLot.lotNumber,
        itemSku: 'FG-TURBINE-01',
        itemName: 'Industrial Gas Turbine Core',
        defectQuantity: 2,
        uom: 'EA',
        severity: 'MAJOR',
        defectType: 'DIMENSIONAL_OUT_OF_TOLERANCE',
        defectDescription: 'Rotor outer diameter machined oversize by 0.07mm on sample 2 and 5',
        inspectionLotId: sharedInspectionLot.id,
        workOrderId: releasedWO.id,
        quarantineLocationId: 'WH-QUARANTINE',
        estimatedScrapOrReworkCost: 1200,
        createdBy: 'qa-inspector-fatima'
      });

      if (!sharedNCR.id || !sharedNCR.isQuarantined || sharedNCR.quarantineLocationId !== 'WH-QUARANTINE') {
        throw new Error('Expected NCR to automatically quarantine defective stock');
      }
      if (!sharedNCR.integrityHash || sharedNCR.integrityHash.length !== 64) {
        throw new Error('Expected 64-char integrity hash on NCR');
      }
    });

    runTest('P32D-02-22', 'NCR SoD gate: Block NCR originator from unilaterally approving disposition', 'NCR & CAPA', () => {
      let blocked = false;
      try {
        ShopFloorQualityEngine.dispositionNCR({
          ncr: sharedNCR,
          disposition: 'SCRAP',
          dispositionBy: 'qa-inspector-fatima', // Same user who created NCR
          dispositionNotes: 'Scrap defective core',
          unitCost: 1500
        });
      } catch (err: any) {
        if (err.message.includes('Segregation of Duties Violation')) {
          blocked = true;
        }
      }
      if (!blocked) throw new Error('Expected SoD rejection when NCR creator attempts to disposition');
    });

    runTest('P32D-02-23', 'Disposition NCR as SCRAP: emits decoupled Financial Event QUALITY_SCRAP_WRITEOFF', 'NCR & CAPA', () => {
      const { updatedNCR, financialEvent } = ShopFloorQualityEngine.dispositionNCR({
        ncr: sharedNCR,
        disposition: 'SCRAP',
        dispositionBy: 'plant-director-khaled',
        dispositionNotes: 'Irreversible dimensional error; approved for scrap write-off',
        unitCost: 1500
      });

      if (updatedNCR.status !== 'DISPOSITIONED' || updatedNCR.disposition !== 'SCRAP') {
        throw new Error('Expected NCR status DISPOSITIONED with SCRAP');
      }
      if (!financialEvent || financialEvent.eventType !== 'QUALITY_SCRAP_WRITEOFF') {
        throw new Error('Expected QUALITY_SCRAP_WRITEOFF financial event');
      }
      if (financialEvent.payload.amount !== 3000) { // 2 units * 1500
        throw new Error(`Expected scrap financial event amount 3000, got ${financialEvent.payload.amount}`);
      }
    });

    runTest('P32D-02-24', 'Disposition NCR as REWORK: emits decoupled Financial Event QUALITY_REWORK_ALLOCATION', 'NCR & CAPA', () => {
      const reworkNCR = ShopFloorQualityEngine.createNonConformanceReport({
        tenantId,
        companyId,
        sourceDocNumber: 'WO-2026-00002',
        itemSku: 'FG-TURBINE-01',
        itemName: 'Industrial Gas Turbine Core',
        defectQuantity: 1,
        uom: 'EA',
        severity: 'MINOR',
        defectType: 'SURFACE_FINISH',
        defectDescription: 'Minor surface burrs on intake flange',
        createdBy: 'qa-inspector-fatima'
      });

      const { updatedNCR, financialEvent } = ShopFloorQualityEngine.dispositionNCR({
        ncr: reworkNCR,
        disposition: 'REWORK',
        dispositionBy: 'plant-director-khaled',
        dispositionNotes: 'Perform secondary polishing pass on work center WC-CNC',
        unitCost: 200
      });

      if (updatedNCR.disposition !== 'REWORK') throw new Error('Expected REWORK disposition');
      if (!financialEvent || financialEvent.eventType !== 'QUALITY_REWORK_ALLOCATION') {
        throw new Error('Expected QUALITY_REWORK_ALLOCATION financial event');
      }
    });

    runTest('P32D-02-25', 'Create CAPA with mandatory 5-Whys root cause investigation (reject < 3 whys)', 'NCR & CAPA', () => {
      let blocked = false;
      try {
        ShopFloorQualityEngine.createCAPA({
          tenantId,
          companyId,
          ncr: sharedNCR,
          rootCauseCategory: 'MACHINE',
          fiveWhysAnalysis: ['Why 1: Tool chatter'], // Only 1 why!
          rootCauseStatement: 'Worn tool',
          correctiveActionDescription: 'Change tool',
          preventiveActionDescription: 'Inspect tools',
          assignedOwnerId: 'maint-lead-youssef',
          targetCompletionDate: '2026-09-30',
          createdBy: 'qa-lead-samir'
        });
      } catch (err: any) {
        if (err.message.includes('requires at least 3 levels of 5-Whys')) {
          blocked = true;
        }
      }
      if (!blocked) throw new Error('Expected CAPA to reject fewer than 3 whys in root cause analysis');

      const { capa, updatedNCR } = ShopFloorQualityEngine.createCAPA({
        tenantId,
        companyId,
        ncr: sharedNCR,
        rootCauseCategory: 'MACHINE',
        fiveWhysAnalysis: [
          'Why 1: Spindle shaft diameter was machined 0.07mm oversize',
          'Why 2: CNC dynamic offset calibration drifted mid-cycle',
          'Why 3: High-frequency spindle vibration loosened toolholder clamp',
          'Why 4: Toolholder clamp torque was not verified during shift turnover',
          'Why 5: Lack of mandatory pre-shift torque wrench sign-off checklist'
        ],
        rootCauseStatement: 'Toolholder clamp torque was deficient due to missing shift turnover check',
        correctiveActionDescription: 'Recalibrate CNC machine 5-axis dynamic offset and replace toolholder',
        preventiveActionDescription: 'Implement mandatory digital shift pre-flight torque verification in MES',
        assignedOwnerId: 'maint-lead-youssef',
        targetCompletionDate: '2026-09-25',
        createdBy: 'qa-lead-samir'
      });

      if (!capa.id || capa.fiveWhysAnalysis.length !== 5 || updatedNCR.status !== 'CAPA_PENDING') {
        throw new Error('Expected CAPA created with 5-whys and NCR transitioned to CAPA_PENDING');
      }
      sharedCAPA = capa;
    });

    runTest('P32D-02-26', 'CAPA verification SoD: Block assigned owner from certifying their own CAPA', 'NCR & CAPA', () => {
      let blocked = false;
      try {
        ShopFloorQualityEngine.verifyAndCloseCAPA({
          capa: sharedCAPA,
          verifiedBy: 'maint-lead-youssef', // Same as assignedOwnerId!
          verificationNotes: 'I verified my own fix'
        });
      } catch (err: any) {
        if (err.message.includes('Segregation of Duties Violation')) {
          blocked = true;
        }
      }
      if (!blocked) throw new Error('Expected SoD error when CAPA owner attempts to self-certify');

      const closedCAPA = ShopFloorQualityEngine.verifyAndCloseCAPA({
        capa: sharedCAPA,
        verifiedBy: 'qa-director-layla', // Independent QA Director
        verificationNotes: 'Audited digital torque log for 14 consecutive shifts; 0 defects observed'
      });

      if (closedCAPA.status !== 'CLOSED' || !closedCAPA.effectivenessVerified) {
        throw new Error('Expected CAPA to be closed and verified');
      }
    });

    // =========================================================================
    // CATEGORY 5: GENEALOGY, TRACEABILITY & AUDIT CONTROLS (Tests 27 - 30)
    // =========================================================================

    runTest('P32D-02-27', 'Register Serial Genealogy record linking finished good serial to child component lots', 'Traceability', () => {
      sharedGenealogy = ShopFloorQualityEngine.registerSerialGenealogy({
        finishedGoodSerial: 'SN-TURB-2026-00881',
        finishedGoodSku: 'FG-TURBINE-01',
        finishedGoodName: 'Industrial Gas Turbine Core',
        workOrderId: releasedWO.id,
        workOrderNumber: releasedWO.orderNumber,
        productionDate: '2026-09-05T14:30:00Z',
        machineId: sharedMachine.id,
        operatorId: sharedOperator.id,
        consumedComponents: [
          {
            componentSku: 'RM-ALLOY-BAR',
            componentName: 'Titanium Inconel Alloy Bar',
            componentLotNumber: 'LOT-ALLOY-B882',
            supplierPoNumber: 'PO-2026-00104',
            quantityConsumed: 2.1,
            uom: 'KG'
          },
          {
            componentSku: 'RM-ROTOR-BEARING',
            componentName: 'Ceramic High-Speed Rotor Bearing',
            componentLotNumber: 'LOT-BEAR-C901',
            supplierPoNumber: 'PO-2026-00095',
            quantityConsumed: 4,
            uom: 'EA'
          }
        ],
        qualityInspectionLotId: sharedInspectionLot.id,
        usageDecision: 'APPROVED',
        cryptographicHash: ''
      });

      if (!sharedGenealogy.cryptographicHash || sharedGenealogy.cryptographicHash.length !== 64) {
        throw new Error('Expected 64-char cryptographic hash on genealogy record');
      }
    });

    runTest('P32D-02-28', 'Forward Traceability: Query defective raw material component lot and retrieve all affected serials', 'Traceability', () => {
      const gen2 = ShopFloorQualityEngine.registerSerialGenealogy({
        finishedGoodSerial: 'SN-TURB-2026-00882',
        finishedGoodSku: 'FG-TURBINE-01',
        finishedGoodName: 'Industrial Gas Turbine Core',
        workOrderId: releasedWO.id,
        workOrderNumber: releasedWO.orderNumber,
        productionDate: '2026-09-05T15:45:00Z',
        machineId: sharedMachine.id,
        operatorId: sharedOperator.id,
        consumedComponents: [
          {
            componentSku: 'RM-ALLOY-BAR',
            componentName: 'Titanium Inconel Alloy Bar',
            componentLotNumber: 'LOT-ALLOY-B882', // SAME LOT
            supplierPoNumber: 'PO-2026-00104',
            quantityConsumed: 2.1,
            uom: 'KG'
          }
        ],
        qualityInspectionLotId: sharedInspectionLot.id,
        usageDecision: 'APPROVED',
        cryptographicHash: ''
      });

      const forwardResult = ShopFloorQualityEngine.traceForward('LOT-ALLOY-B882', [sharedGenealogy, gen2]);

      if (!forwardResult.found) throw new Error('Forward trace failed to locate records');
      if (forwardResult.affectedFinishedGoodSerials.length !== 2) {
        throw new Error(`Expected 2 affected serials, got ${forwardResult.affectedFinishedGoodSerials.length}`);
      }
      if (!forwardResult.affectedFinishedGoodSerials.includes('SN-TURB-2026-00881') ||
          !forwardResult.affectedFinishedGoodSerials.includes('SN-TURB-2026-00882')) {
        throw new Error('Forward trace did not return matching finished good serials');
      }
    });

    runTest('P32D-02-29', 'Backward Traceability: Query finished good serial and dissect genealogy to supplier PO', 'Traceability', () => {
      const backwardResult = ShopFloorQualityEngine.traceBackward('SN-TURB-2026-00881', [sharedGenealogy]);

      if (!backwardResult.found) throw new Error('Backward trace failed to locate serial');
      if (backwardResult.traceChain.length !== 2) {
        throw new Error(`Expected 2 component links in trace chain, got ${backwardResult.traceChain.length}`);
      }
      const alloyTrace = backwardResult.traceChain.find(c => c.componentSku === 'RM-ALLOY-BAR');
      if (alloyTrace?.componentLotNumber !== 'LOT-ALLOY-B882' || alloyTrace?.supplierPoNumber !== 'PO-2026-00104') {
        throw new Error('Backward trace did not accurately dissect component lot and supplier PO');
      }
    });

    runTest('P32D-02-30', 'Tamper-proof audit seal: verify 64-char deterministic cryptographic SHA-256 hash chaining', 'Traceability', () => {
      const hash1 = ShopFloorQualityEngine.generateCryptoHash('TEST-PAYLOAD-AM-ENTERPRISE-01');
      const hash2 = ShopFloorQualityEngine.generateCryptoHash('TEST-PAYLOAD-AM-ENTERPRISE-01');
      const hash3 = ShopFloorQualityEngine.generateCryptoHash('TEST-PAYLOAD-AM-ENTERPRISE-02');

      if (hash1.length !== 64 || hash2.length !== 64) {
        throw new Error('Hash length must be 64 characters');
      }
      if (hash1 !== hash2) {
        throw new Error('Cryptographic hash must be strictly deterministic');
      }
      if (hash1 === hash3) {
        throw new Error('Different payloads must produce different hashes');
      }
    });

    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.filter(r => !r.passed).length;

    return {
      phase: 'Phase 3.2D-02 — Shop Floor Dispatching, Machine IoT & Quality Inspections',
      total: results.length,
      passed: passedCount,
      failed: failedCount,
      results
    };
  }
}
