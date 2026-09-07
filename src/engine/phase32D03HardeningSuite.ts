/**
 * AM Enterprise ERP — Phase 3.2D-03 Hardening Test Suite
 * Advanced Product Costing, Manufacturing Variance Settlement & Enterprise Plant Maintenance (CO-PC / EAM)
 * 
 * 30 Enterprise Scenarios covering:
 * - Multi-Level Standard Cost Rollup (CO-PC), Cost Component Splits & SoD Cost Release
 * - 6-Way Manufacturing Variance Breakdown (Material Usage/Price, Labor Rate/Efficiency, Overhead)
 * - Work Order WIP Settlement & Decoupled Financial Event Emission (Zero Direct GL Mutation)
 * - Functional Locations, Equipment Assets & PM Schedules (Time-based & IoT Run-hours Meter-based)
 * - Maintenance Work Orders (MWO), Safety Lockout/Tagout, Spare Parts MRO & SoD Settlement
 * - Reliability Analytics (MTBF, MTTR, Availability %)
 * - Engineering Change Management (ECM / ECO) with Redlines & 64-character SHA-256 Seals
 */

import { ManufacturingCostingMaintenanceEngine } from './manufacturingCostingMaintenanceEngine';
import { ManufacturingEngine } from './manufacturingEngine';
import { BillOfMaterials, Routing, WorkCenter, ProductionWorkOrder } from '../types/manufacturing';
import {
  StandardCostEstimate,
  ManufacturingVarianceBreakdown,
  EquipmentAsset,
  PreventiveMaintenanceSchedule,
  MaintenanceWorkOrder,
  EngineeringChangeOrder
} from '../types/manufacturingCostingMaintenance';

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

export class Phase32D03HardeningSuite {
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

    // Work Centers
    const wcMachining: WorkCenter = {
      id: 'wc-mfg-10',
      tenantId,
      companyId,
      workCenterCode: 'WC-MACH-10',
      name: 'Heavy CNC Milling Center',
      costCenterCode: 'CC-MFG-10',
      hourlyLaborRate: 50,
      hourlyMachineRate: 80,
      hourlyOverheadRate: 30,
      capacityHoursPerDay: 16,
      efficiencyPercent: 100,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const wcAssembly: WorkCenter = {
      id: 'wc-mfg-20',
      tenantId,
      companyId,
      workCenterCode: 'WC-ASSY-20',
      name: 'Precision Core Assembly Line',
      costCenterCode: 'CC-MFG-20',
      hourlyLaborRate: 45,
      hourlyMachineRate: 40,
      hourlyOverheadRate: 25,
      capacityHoursPerDay: 16,
      efficiencyPercent: 100,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Sub-assembly Child BOM: Rotor Blade Assembly
    const subAssemblyBOM: BillOfMaterials = {
      id: 'bom-sub-blade-01',
      tenantId,
      companyId,
      bomNumber: 'BOM-SUB-BLADE-01',
      finishedGoodSku: 'SA-BLADE-PACK',
      finishedGoodName: 'Turbine Rotor Blade Pack (Sub-assembly)',
      version: 1,
      status: 'ACTIVE',
      baseQuantity: 1,
      uom: 'SET',
      components: [
        {
          componentId: 'sub-c1',
          sku: 'RM-NICKEL-SHEET',
          description: 'Nickel Alloy Sheet 5mm',
          componentType: 'RAW_MATERIAL',
          quantityPerUnit: 5,
          scrapFactorPercent: 0.02,
          uom: 'KG',
          costPerUnit: 120, // 5 * 1.02 * 120 = 612
          warehouseId: 'WH-RAW-01'
        }
      ],
      effectiveFrom: '2026-01-01',
      createdBy: 'eng-cost-01',
      createdAt: new Date().toISOString()
    };

    // Finished Good Parent BOM: Industrial Turbine Core
    const parentBOM: BillOfMaterials = {
      id: 'bom-turb-fg-01',
      tenantId,
      companyId,
      bomNumber: 'BOM-TURB-FG-001',
      finishedGoodSku: 'FG-TURBINE-X1',
      finishedGoodName: 'Industrial High-Pressure Gas Turbine X1',
      version: 1,
      status: 'ACTIVE',
      baseQuantity: 1,
      uom: 'EA',
      components: [
        {
          componentId: 'p-c1',
          sku: 'SA-BLADE-PACK',
          description: 'Turbine Rotor Blade Pack',
          componentType: 'SUB_ASSEMBLY',
          subAssemblyBOMId: subAssemblyBOM.id,
          quantityPerUnit: 2,
          scrapFactorPercent: 0.0,
          uom: 'SET',
          costPerUnit: 800,
          warehouseId: 'WH-WIP-01'
        },
        {
          componentId: 'p-c2',
          sku: 'RM-CAST-HOUSING',
          description: 'Heavy Cast Steel Turbine Casing',
          componentType: 'RAW_MATERIAL',
          quantityPerUnit: 1,
          scrapFactorPercent: 0.0,
          uom: 'EA',
          costPerUnit: 2500,
          warehouseId: 'WH-RAW-01'
        }
      ],
      effectiveFrom: '2026-01-01',
      createdBy: 'eng-cost-01',
      createdAt: new Date().toISOString()
    };

    // Parent Routing
    const sharedRouting: Routing = {
      id: 'rtg-turb-x1',
      tenantId,
      companyId,
      routingNumber: 'RTG-TURB-X1-001',
      finishedGoodSku: 'FG-TURBINE-X1',
      version: 1,
      status: 'ACTIVE',
      operations: [
        {
          operationNumber: 10,
          operationName: 'Heavy Casing Milling & Boring',
          workCenterId: wcMachining.id,
          workCenterCode: wcMachining.workCenterCode,
          setupTimeHours: 2.0,
          runTimeHoursPerUnit: 4.0,
          isMilestone: true
        },
        {
          operationNumber: 20,
          operationName: 'Core Sub-assembly Integration',
          workCenterId: wcAssembly.id,
          workCenterCode: wcAssembly.workCenterCode,
          setupTimeHours: 1.0,
          runTimeHoursPerUnit: 3.0,
          isMilestone: true
        }
      ],
      createdBy: 'eng-cost-01',
      createdAt: new Date().toISOString()
    };

    let sharedCostEstimate: StandardCostEstimate;
    let sharedWorkOrder: ProductionWorkOrder;
    let sharedVariances: ManufacturingVarianceBreakdown;
    let sharedEquipment: EquipmentAsset;
    let sharedPMSchedule: PreventiveMaintenanceSchedule;
    let sharedMWO: MaintenanceWorkOrder;
    let sharedECO: EngineeringChangeOrder;

    // =========================================================================
    // CATEGORY 1: PRODUCT COSTING & MULTI-LEVEL COST ROLLUP (Tests 1 - 7)
    // =========================================================================

    runTest('P32D-03-01', 'Calculate Multi-Level Standard Cost Rollup for Finished Good with component splits', 'Product Costing', () => {
      sharedCostEstimate = ManufacturingCostingMaintenanceEngine.calculateStandardCostRollup({
        tenantId,
        companyId,
        bom: parentBOM,
        allBOMs: [parentBOM, subAssemblyBOM],
        routing: sharedRouting,
        workCenters: [wcMachining, wcAssembly],
        lotSize: 1,
        createdBy: 'cost-analyst-hassan'
      });

      if (!sharedCostEstimate.id || sharedCostEstimate.status !== 'ESTIMATED') {
        throw new Error('Failed to create standard cost estimate');
      }
      if (sharedCostEstimate.costSplit.directMaterialCost <= 0) {
        throw new Error('Expected positive direct material cost');
      }
      if (sharedCostEstimate.costSplit.directLaborCost <= 0) {
        throw new Error('Expected positive direct labor cost');
      }
      if (sharedCostEstimate.costSplit.machineCost <= 0) {
        throw new Error('Expected positive machine cost');
      }
    });

    runTest('P32D-03-02', 'Verify sub-assembly multi-level BOM explosion in cost breakdown', 'Product Costing', () => {
      const subComp = sharedCostEstimate.costedComponents.find(c => c.sku === 'RM-NICKEL-SHEET');
      if (!subComp || subComp.level !== 2) {
        throw new Error('Expected level 2 exploded sub-assembly component RM-NICKEL-SHEET');
      }
      if (subComp.quantityRequired <= 0) {
        throw new Error('Expected positive quantity for exploded child component');
      }
    });

    runTest('P32D-03-03', 'Deterministic 64-character SHA-256 seal generation on cost estimate', 'Product Costing', () => {
      if (!sharedCostEstimate.cryptographicHash || sharedCostEstimate.cryptographicHash.length !== 64) {
        throw new Error(`Expected 64-character SHA-256 seal, got length ${sharedCostEstimate.cryptographicHash?.length}`);
      }
    });

    runTest('P32D-03-04', 'Mark standard cost estimate (transition from ESTIMATED to MARKED)', 'Product Costing', () => {
      const marked = ManufacturingCostingMaintenanceEngine.markStandardCostEstimate(sharedCostEstimate);
      if (marked.status !== 'MARKED') {
        throw new Error('Expected status to be MARKED');
      }
      sharedCostEstimate = marked;
    });

    runTest('P32D-03-05', 'Prevent marking already marked or non-estimated cost estimate', 'Product Costing', () => {
      let blocked = false;
      try {
        ManufacturingCostingMaintenanceEngine.markStandardCostEstimate(sharedCostEstimate); // already MARKED
      } catch (err: any) {
        if (err.message.includes('Must be ESTIMATED')) {
          blocked = true;
        }
      }
      if (!blocked) throw new Error('Expected rejection when marking non-estimated cost record');
    });

    runTest('P32D-03-06', 'Segregation of Duties (SoD): Reject creator attempting to release own standard cost estimate', 'Product Costing', () => {
      let blocked = false;
      try {
        ManufacturingCostingMaintenanceEngine.releaseStandardCostEstimate({
          estimate: sharedCostEstimate,
          releasedBy: 'cost-analyst-hassan' // SAME AS CREATOR!
        });
      } catch (err: any) {
        if (err.message.includes('Segregation of Duties Violation')) {
          blocked = true;
        }
      }
      if (!blocked) throw new Error('Expected SoD rejection when creator tries to release standard cost');
    });

    runTest('P32D-03-07', 'Authorized cost controller releases standard cost estimate with audit seal', 'Product Costing', () => {
      const released = ManufacturingCostingMaintenanceEngine.releaseStandardCostEstimate({
        estimate: sharedCostEstimate,
        releasedBy: 'controller-mariam' // Different authorized user
      });

      if (released.status !== 'RELEASED' || released.releasedBy !== 'controller-mariam') {
        throw new Error('Expected RELEASED status and authorized controller recorded');
      }
      sharedCostEstimate = released;
    });

    // =========================================================================
    // CATEGORY 2: 6-WAY MANUFACTURING VARIANCE SETTLEMENT (Tests 8 - 14)
    // =========================================================================

    runTest('P32D-03-08', 'Calculate Material Usage Variance: Actual Qty exceeds standard quantity', 'Variance Settlement', () => {
      // Setup production work order with material usage overrun
      sharedWorkOrder = ManufacturingEngine.createWorkOrder({
        tenantId,
        companyId,
        finishedGoodSku: parentBOM.finishedGoodSku,
        finishedGoodName: parentBOM.finishedGoodName,
        bom: parentBOM,
        routing: sharedRouting,
        workCenters: [wcMachining, wcAssembly],
        plannedQuantity: 1,
        uom: 'EA',
        plannedStartDate: '2026-09-01T08:00:00Z',
        plannedEndDate: '2026-09-05T17:00:00Z',
        targetWarehouseId: 'WH-FG-01',
        createdBy: 'planner-01'
      });

      sharedWorkOrder = ManufacturingEngine.releaseWorkOrder(sharedWorkOrder, 'prod-mgr-01');

      // Standard issued quantity for component 0 (SA-BLADE-PACK): 2
      sharedWorkOrder.materials[0].issuedQuantity = 2;
      // Actual issue with overrun on casting: standard is 1, issued 1.2 (0.2 scrap/overrun)
      sharedWorkOrder.materials[1].issuedQuantity = 1.2;
      sharedWorkOrder.status = 'COMPLETED';
      sharedWorkOrder.completedQuantity = 1;
      sharedWorkOrder.completedBy = 'operator-youssef';

      sharedVariances = ManufacturingCostingMaintenanceEngine.calculateManufacturingVariances({
        workOrder: sharedWorkOrder,
        plannedLaborHours: 10
      });

      // Expected Material Usage Variance = (1.2 - 1.0) * 2500 = +500 (unfavorable)
      if (sharedVariances.materialUsageVariance !== 500) {
        throw new Error(`Expected materialUsageVariance 500, got ${sharedVariances.materialUsageVariance}`);
      }
    });

    runTest('P32D-03-09', 'Calculate Material Price Variance: Actual material cost differs from standard', 'Variance Settlement', () => {
      const variancesWithPriceDelta = ManufacturingCostingMaintenanceEngine.calculateManufacturingVariances({
        workOrder: sharedWorkOrder,
        actualComponentUnitPrices: {
          'RM-CAST-HOUSING': 2600 // $100 higher than standard $2500
        },
        plannedLaborHours: 10
      });

      // Material Price Variance = (2600 - 2500) * 1.2 actual qty = +120
      if (variancesWithPriceDelta.materialPriceVariance !== 120) {
        throw new Error(`Expected materialPriceVariance 120, got ${variancesWithPriceDelta.materialPriceVariance}`);
      }
    });

    runTest('P32D-03-10', 'Calculate Labor Rate Variance and Labor Efficiency Variance', 'Variance Settlement', () => {
      // Standard labor hours = 10 hrs @ $50 = $500
      // Actual labor hours = 12 hrs @ $55 actual rate
      sharedWorkOrder.operationConfirmations = [
        {
          id: 'conf-1',
          operationNumber: 10,
          workCenterCode: 'WC-MACH-10',
          confirmedGoodQuantity: 1,
          confirmedScrapQuantity: 0,
          actualLaborHours: 7, // Planned 6
          actualMachineHours: 6,
          operatorId: 'op-1',
          operatorName: 'Mahmoud',
          confirmedAt: new Date().toISOString()
        },
        {
          id: 'conf-2',
          operationNumber: 20,
          workCenterCode: 'WC-ASSY-20',
          confirmedGoodQuantity: 1,
          confirmedScrapQuantity: 0,
          actualLaborHours: 5, // Planned 4
          actualMachineHours: 4,
          operatorId: 'op-2',
          operatorName: 'Tarek',
          confirmedAt: new Date().toISOString()
        }
      ];

      const laborVariances = ManufacturingCostingMaintenanceEngine.calculateManufacturingVariances({
        workOrder: sharedWorkOrder,
        actualLaborHourlyRate: 55, // Std is 50
        plannedLaborHours: 10
      });

      // Total actual hours = 12. Std hours = 10.
      // Rate variance = (55 - 50) * 12 = +60
      // Efficiency variance = (12 - 10) * 50 = +100
      if (laborVariances.laborRateVariance !== 60) {
        throw new Error(`Expected laborRateVariance 60, got ${laborVariances.laborRateVariance}`);
      }
      if (laborVariances.laborEfficiencyVariance !== 100) {
        throw new Error(`Expected laborEfficiencyVariance 100, got ${laborVariances.laborEfficiencyVariance}`);
      }
    });

    runTest('P32D-03-11', 'Calculate Machine Spending Variance and Overhead Absorption Variance', 'Variance Settlement', () => {
      sharedWorkOrder.costSummary.plannedMachineCost = 800;
      sharedWorkOrder.costSummary.actualMachineCost = 880; // +80 spending variance
      sharedWorkOrder.costSummary.plannedOverheadCost = 300;
      sharedWorkOrder.costSummary.actualOverheadCost = 340; // +40 overhead spending variance

      const variances = ManufacturingCostingMaintenanceEngine.calculateManufacturingVariances({
        workOrder: sharedWorkOrder,
        plannedLaborHours: 10
      });

      if (variances.machineSpendingVariance !== 80) {
        throw new Error(`Expected machineSpendingVariance 80, got ${variances.machineSpendingVariance}`);
      }
      if (variances.overheadSpendingVariance !== 40) {
        throw new Error(`Expected overheadSpendingVariance 40, got ${variances.overheadSpendingVariance}`);
      }
    });

    runTest('P32D-03-12', 'Total variance aggregation and unfavorable vs favorable classification', 'Variance Settlement', () => {
      const fullVariances = ManufacturingCostingMaintenanceEngine.calculateManufacturingVariances({
        workOrder: sharedWorkOrder,
        actualComponentUnitPrices: { 'RM-CAST-HOUSING': 2600 },
        actualLaborHourlyRate: 55,
        plannedLaborHours: 10
      });

      // 500 (usage) + 120 (price) + 60 (labor rate) + 100 (labor eff) + 80 (mach) + 40 (oh) = 900
      if (fullVariances.totalVariance !== 900) {
        throw new Error(`Expected totalVariance 900, got ${fullVariances.totalVariance}`);
      }
      if (!fullVariances.isUnfavorable) {
        throw new Error('Expected isUnfavorable=true for positive variance over standard');
      }
      sharedVariances = fullVariances;
    });

    runTest('P32D-03-13', 'Settle Work Order WIP: Enforce SoD (order completion operator cannot settle variances)', 'Variance Settlement', () => {
      let blocked = false;
      try {
        ManufacturingCostingMaintenanceEngine.settleWorkOrderWIP({
          workOrder: sharedWorkOrder,
          settledBy: 'operator-youssef', // Same person who completed the order!
          varianceBreakdown: sharedVariances
        });
      } catch (err: any) {
        if (err.message.includes('Segregation of Duties Violation')) {
          blocked = true;
        }
      }
      if (!blocked) throw new Error('Expected SoD error when shop floor operator attempts to settle order variance');
    });

    runTest('P32D-03-14', 'Authorized cost accountant settles WIP, clears WIP balance to 0, emits decoupled financial event', 'Variance Settlement', () => {
      sharedWorkOrder.costSummary.wipBalance = 900;

      const { updatedWorkOrder, wipRecord, financialEvent } = ManufacturingCostingMaintenanceEngine.settleWorkOrderWIP({
        workOrder: sharedWorkOrder,
        settledBy: 'acct-lead-nour',
        varianceBreakdown: sharedVariances
      });

      if (updatedWorkOrder.status !== 'SETTLED' || updatedWorkOrder.costSummary.wipBalance !== 0) {
        throw new Error('Expected work order status SETTLED with zero WIP balance');
      }
      if (wipRecord.settledVarianceAmount !== 900 || wipRecord.cryptographicSeal.length !== 64) {
        throw new Error('Invalid WIP revaluation record or missing cryptographic seal');
      }
      if (!financialEvent || financialEvent.eventType !== 'MANUFACTURING_VARIANCE_SETTLED') {
        throw new Error('Expected decoupled financial event MANUFACTURING_VARIANCE_SETTLED');
      }
      if (financialEvent.payload.targetVarianceAccount !== '510000_MFG_VARIANCE_UNFAVORABLE') {
        throw new Error('Expected unfavorable variance GL routing in event payload');
      }
    });

    // =========================================================================
    // CATEGORY 3: ENTERPRISE PLANT MAINTENANCE (EAM) MASTER DATA & PM (Tests 15 - 20)
    // =========================================================================

    runTest('P32D-03-15', 'Create Functional Location hierarchy (Plant -> Area -> Equipment)', 'Plant Maintenance', () => {
      const floc = ManufacturingCostingMaintenanceEngine.createFunctionalLocation({
        tenantId,
        companyId,
        locationCode: 'PLANT-EGY-01-CNC-BAY',
        name: 'Alexandria Heavy Machining Bay 1',
        plantId: 'PLANT-EGY-01'
      });

      if (!floc.id || floc.locationCode !== 'PLANT-EGY-01-CNC-BAY' || floc.status !== 'ACTIVE') {
        throw new Error('Failed to create Functional Location');
      }
    });

    runTest('P32D-03-16', 'Register Equipment Asset with operational status and run-hours meter', 'Plant Maintenance', () => {
      sharedEquipment = ManufacturingCostingMaintenanceEngine.createEquipmentAsset({
        tenantId,
        companyId,
        equipmentCode: 'EQ-CNC-5AXIS-01',
        name: 'DMG Mori 5-Axis Precision Milling Machining Center',
        category: 'PRODUCTION_MACHINE',
        functionalLocationCode: 'PLANT-EGY-01-CNC-BAY',
        workCenterId: wcMachining.id,
        serialNumber: 'DMG-SN-99201',
        manufacturer: 'DMG Mori Seiki',
        model: 'DMU 85 monoBLOCK',
        installationDate: '2024-01-15',
        currentRunHours: 1450
      });

      if (!sharedEquipment.id || sharedEquipment.status !== 'OPERATIONAL' || sharedEquipment.currentRunHours !== 1450) {
        throw new Error('Failed to register Equipment Asset');
      }
    });

    runTest('P32D-03-17', 'Configure Time-Based Preventive Maintenance (PM) Schedule (90-day cycle)', 'Plant Maintenance', () => {
      const timePMSched = ManufacturingCostingMaintenanceEngine.createPreventiveMaintenanceSchedule({
        tenantId,
        companyId,
        scheduleCode: 'PMS-TIME-QTR-01',
        equipmentId: sharedEquipment.id,
        equipmentCode: sharedEquipment.equipmentCode,
        title: 'Quarterly Spindle & Coolant Filtration Service',
        frequencyType: 'TIME_BASED',
        intervalDays: 90,
        assignedTechnicianRole: 'MECH_MAINT_TECH',
        estimatedLaborHours: 4.0,
        lastServiceDate: '2026-06-01',
        requiredSpareParts: [
          {
            partSku: 'MRO-FILT-01',
            partName: 'Spindle Coolant Cartridge Filter',
            quantity: 2,
            uom: 'EA',
            estimatedCost: 75
          }
        ]
      });

      if (!timePMSched.id || timePMSched.frequencyType !== 'TIME_BASED' || !timePMSched.nextDueDate) {
        throw new Error('Failed to create time-based PM schedule');
      }
    });

    runTest('P32D-03-18', 'Configure Run-Hours Meter-Based PM Schedule (every 500 operating hours)', 'Plant Maintenance', () => {
      sharedPMSchedule = ManufacturingCostingMaintenanceEngine.createPreventiveMaintenanceSchedule({
        tenantId,
        companyId,
        scheduleCode: 'PMS-METER-500H',
        equipmentId: sharedEquipment.id,
        equipmentCode: sharedEquipment.equipmentCode,
        title: '500-Hour Ball Screw & Linear Guide Lubrication',
        frequencyType: 'RUN_HOURS_METER',
        intervalRunHours: 500,
        lastServiceRunHours: 1000, // Due at 1500 hours!
        assignedTechnicianRole: 'ELECTROMECH_TECH',
        estimatedLaborHours: 3.5,
        requiredSpareParts: [
          {
            partSku: 'MRO-GREASE-SYN',
            partName: 'Synthetic High-Speed Spindle Grease 400g',
            quantity: 1,
            uom: 'CAN',
            estimatedCost: 90
          }
        ]
      });

      if (sharedPMSchedule.nextDueRunHours !== 1500) {
        throw new Error(`Expected nextDueRunHours 1500, got ${sharedPMSchedule.nextDueRunHours}`);
      }
    });

    runTest('P32D-03-19', 'Reject invalid PM schedule configurations (negative or zero interval)', 'Plant Maintenance', () => {
      let blocked = false;
      try {
        ManufacturingCostingMaintenanceEngine.createPreventiveMaintenanceSchedule({
          tenantId,
          companyId,
          scheduleCode: 'PMS-BAD',
          equipmentId: sharedEquipment.id,
          equipmentCode: sharedEquipment.equipmentCode,
          title: 'Invalid Schedule',
          frequencyType: 'TIME_BASED',
          intervalDays: 0, // INVALID!
          assignedTechnicianRole: 'TECH',
          estimatedLaborHours: 1
        });
      } catch (err: any) {
        if (err.message.includes('requires valid intervalDays > 0')) {
          blocked = true;
        }
      }
      if (!blocked) throw new Error('Expected rejection for PM schedule with interval <= 0');
    });

    runTest('P32D-03-20', 'Automated PM Scheduler evaluation: trigger PM work orders when due meter reached', 'Plant Maintenance', () => {
      // Equipment currentRunHours is 1450. Now updated to 1520 (exceeds 1500 due threshold!)
      const updatedEq = { ...sharedEquipment, currentRunHours: 1520 };

      const { dueSchedules, generatedOrders } = ManufacturingCostingMaintenanceEngine.evaluatePMSchedules({
        schedules: [sharedPMSchedule],
        equipment: [updatedEq],
        createdBy: 'maint-planner-ahmed'
      });

      if (dueSchedules.length !== 1 || generatedOrders.length !== 1) {
        throw new Error(`Expected 1 due schedule and 1 generated MWO, got ${dueSchedules.length} and ${generatedOrders.length}`);
      }
      if (generatedOrders[0].orderType !== 'PREVENTIVE' || !generatedOrders[0].safetyLockoutRequired) {
        throw new Error('Generated MWO must be PREVENTIVE with safety lockout enabled');
      }
    });

    // =========================================================================
    // CATEGORY 4: MAINTENANCE WORK ORDERS (MWO) & LOCKOUT/TAGOUT (Tests 21 - 25)
    // =========================================================================

    runTest('P32D-03-21', 'Create Corrective Breakdown Maintenance Order with Safety Lockout/Tagout requirement', 'Plant Maintenance', () => {
      sharedMWO = ManufacturingCostingMaintenanceEngine.createMaintenanceWorkOrder({
        tenantId,
        companyId,
        orderType: 'CORRECTIVE',
        priority: 'HIGH',
        equipmentId: sharedEquipment.id,
        equipmentCode: sharedEquipment.equipmentCode,
        title: 'Emergency: Spindle Axis Z Backlash & Drive Alarm 401',
        description: 'Vibration spike observed, servo drive threw thermal fault 401. Immediate inspection required.',
        breakdownReportedAt: '2026-09-02T10:15:00Z',
        safetyLockoutRequired: true,
        assignedTechnicianId: 'tech-fady-01',
        assignedTechnicianName: 'Fady Gerges',
        createdBy: 'maint-supervisor-hany'
      });

      if (!sharedMWO.id || sharedMWO.status !== 'RELEASED' || !sharedMWO.lockoutTagoutInstalled) {
        throw new Error('Expected released MWO with Lockout/Tagout installed');
      }
    });

    runTest('P32D-03-22', 'Start Maintenance Work Order: transition equipment status to LOCKOUT', 'Plant Maintenance', () => {
      const { updatedOrder, updatedEquipment } = ManufacturingCostingMaintenanceEngine.startMaintenanceWorkOrder(
        sharedMWO,
        sharedEquipment
      );

      if (updatedOrder.status !== 'IN_PROGRESS' || !updatedOrder.actualStartDate) {
        throw new Error('Expected MWO status IN_PROGRESS');
      }
      if (updatedEquipment?.status !== 'LOCKOUT') {
        throw new Error('Expected equipment status LOCKOUT during active maintenance order');
      }
      sharedMWO = updatedOrder;
      sharedEquipment = updatedEquipment;
    });

    runTest('P32D-03-23', 'Reserve & consume MRO spare parts: emits decoupled financial event MRO_SPARE_PARTS_CONSUMED', 'Plant Maintenance', () => {
      const { updatedOrder, financialEvent } = ManufacturingCostingMaintenanceEngine.consumeMaintenanceSpareParts({
        mwo: sharedMWO,
        partSku: 'MRO-DRIVE-MOD-Z',
        quantity: 1,
        unitCost: 1450,
        warehouseId: 'WH-MRO-01',
        consumedBy: 'tech-fady-01'
      });

      if (updatedOrder.totalPartsCost !== 1450 || updatedOrder.spareParts.length !== 1) {
        throw new Error('Failed to record consumed spare parts on MWO');
      }
      if (!financialEvent || financialEvent.eventType !== 'MRO_SPARE_PARTS_CONSUMED') {
        throw new Error('Expected MRO_SPARE_PARTS_CONSUMED decoupled financial event');
      }
      if (financialEvent.payload.totalCost !== 1450) {
        throw new Error(`Expected financial event cost 1450, got ${financialEvent.payload.totalCost}`);
      }
      sharedMWO = updatedOrder;
    });

    runTest('P32D-03-24', 'Complete Maintenance Work Order: record technician labor hours, downtime duration & clear lockout', 'Plant Maintenance', () => {
      const completed = ManufacturingCostingMaintenanceEngine.completeMaintenanceWorkOrder({
        mwo: sharedMWO,
        actualLaborHours: 5.0, // 5 hrs @ $65 = $325
        laborHourlyRate: 65,
        actualDowntimeHours: 4.5,
        rootCauseNotes: 'Capacitor bank degraded in Axis Z inverter servo pack',
        resolutionNotes: 'Replaced inverter module, re-torqued motor coupling, calibrated zero offset',
        completedBy: 'tech-fady-01'
      });

      if (completed.status !== 'COMPLETED' || completed.totalLaborCost !== 325) {
        throw new Error(`Expected COMPLETED MWO with labor cost $325, got ${completed.totalLaborCost}`);
      }
      if (completed.totalOrderCost !== 1775) { // 1450 parts + 325 labor
        throw new Error(`Expected total order cost $1775, got ${completed.totalOrderCost}`);
      }
      if (completed.lockoutTagoutInstalled !== false) {
        throw new Error('Expected lockoutTagoutInstalled to be cleared upon completion');
      }
      sharedMWO = completed;
    });

    runTest('P32D-03-25', 'Settle Maintenance Order: Enforce SoD, update breakdown counts, restore OPERATIONAL & emit event', 'Plant Maintenance', () => {
      let blocked = false;
      try {
        ManufacturingCostingMaintenanceEngine.settleMaintenanceWorkOrder({
          mwo: sharedMWO,
          equipment: sharedEquipment,
          settledBy: 'tech-fady-01' // SAME AS COMPLETED TECHNICIAN!
        });
      } catch (err: any) {
        if (err.message.includes('Segregation of Duties Violation')) {
          blocked = true;
        }
      }
      if (!blocked) throw new Error('Expected SoD error when technician attempts to settle own MWO');

      const { settledOrder, updatedEquipment, financialEvent } = ManufacturingCostingMaintenanceEngine.settleMaintenanceWorkOrder({
        mwo: sharedMWO,
        equipment: sharedEquipment,
        settledBy: 'maint-acct-layla' // Independent maintenance accountant
      });

      if (settledOrder.status !== 'SETTLED' || !settledOrder.cryptographicSeal) {
        throw new Error('Expected SETTLED status with cryptographic seal');
      }
      if (updatedEquipment.status !== 'OPERATIONAL' || updatedEquipment.totalBreakdowns !== 1) {
        throw new Error('Expected equipment restored to OPERATIONAL with incremented breakdown count');
      }
      if (!financialEvent || financialEvent.eventType !== 'MAINTENANCE_ORDER_SETTLEMENT') {
        throw new Error('Expected MAINTENANCE_ORDER_SETTLEMENT financial event');
      }
      sharedEquipment = updatedEquipment;
    });

    // =========================================================================
    // CATEGORY 5: RELIABILITY ANALYTICS & ECM / ECO (Tests 26 - 30)
    // =========================================================================

    runTest('P32D-03-26', 'Calculate Equipment Reliability Analytics: verify MTBF (Mean Time Between Failures)', 'Reliability & ECO', () => {
      // 720 total operating hours in month. 1 breakdown with 4.5 hours downtime.
      // Uptime = 720 - 4.5 = 715.5 hours.
      // MTBF = 715.5 / 1 = 715.5 hours.
      const metrics = ManufacturingCostingMaintenanceEngine.calculateEquipmentReliability({
        equipment: sharedEquipment,
        periodStart: '2026-09-01T00:00:00Z',
        periodEnd: '2026-09-30T23:59:59Z',
        totalOperatingHours: 720,
        totalDowntimeHours: 4.5,
        breakdownCount: 1,
        totalMaintenanceCost: 1775
      });

      if (metrics.meanTimeBetweenFailuresHours !== 715.5) {
        throw new Error(`Expected MTBF 715.5, got ${metrics.meanTimeBetweenFailuresHours}`);
      }
    });

    runTest('P32D-03-27', 'Calculate Equipment Reliability Analytics: verify MTTR (Mean Time To Repair) & Availability %', 'Reliability & ECO', () => {
      const metrics = ManufacturingCostingMaintenanceEngine.calculateEquipmentReliability({
        equipment: sharedEquipment,
        periodStart: '2026-09-01T00:00:00Z',
        periodEnd: '2026-09-30T23:59:59Z',
        totalOperatingHours: 720,
        totalDowntimeHours: 4.5,
        breakdownCount: 1,
        totalMaintenanceCost: 1775
      });

      // MTTR = 4.5 / 1 = 4.5 hours
      // Availability = 715.5 / 720 * 100 = 99.38%
      if (metrics.meanTimeToRepairHours !== 4.5) {
        throw new Error(`Expected MTTR 4.5, got ${metrics.meanTimeToRepairHours}`);
      }
      if (metrics.availabilityPercent !== 99.38) {
        throw new Error(`Expected Availability 99.38%, got ${metrics.availabilityPercent}`);
      }
    });

    runTest('P32D-03-28', 'Create Engineering Change Order (ECO) with component redlines', 'Reliability & ECO', () => {
      sharedECO = ManufacturingCostingMaintenanceEngine.createECO({
        tenantId,
        companyId,
        title: 'Upgrade Turbine Casing Fasteners & Optimize Blade Count',
        description: 'Upgrade to Grade-8 Inconel studs for higher thermal tolerance and reduce blade pack count from 2 to 1.8 sets equivalent.',
        changeReason: 'QUALITY_IMPROVEMENT',
        affectedFinishedGoodSku: parentBOM.finishedGoodSku,
        bom: parentBOM,
        componentRedlines: [
          {
            action: 'MODIFY_QUANTITY',
            componentSku: 'SA-BLADE-PACK',
            oldQuantity: 2,
            newQuantity: 1.8,
            uom: 'SET',
            reason: 'Aerodynamic redesign allows 10% reduction in blade mass'
          },
          {
            action: 'ADD',
            componentSku: 'RM-INCONEL-STUDS-M16',
            newQuantity: 12,
            uom: 'EA',
            reason: 'High-temperature casing mounting hardware'
          }
        ],
        requestedBy: 'eng-lead-samir',
        effectiveDate: '2026-09-01'
      });

      if (!sharedECO.id || sharedECO.status !== 'DRAFT' || sharedECO.toBomVersion !== 2) {
        throw new Error('Failed to create Engineering Change Order with incremented target BOM version');
      }
      if (sharedECO.cryptographicSeal.length !== 64) {
        throw new Error('Expected 64-character SHA-256 seal on ECO');
      }
    });

    runTest('P32D-03-29', 'ECO Review & Segregation of Duties: Block requester from approving own ECO', 'Reliability & ECO', () => {
      const underReview = ManufacturingCostingMaintenanceEngine.submitECOForReview(sharedECO);
      if (underReview.status !== 'UNDER_REVIEW') throw new Error('Expected status UNDER_REVIEW');

      let blocked = false;
      try {
        ManufacturingCostingMaintenanceEngine.approveECO({
          eco: underReview,
          approvedBy: 'eng-lead-samir' // SAME AS REQUESTER!
        });
      } catch (err: any) {
        if (err.message.includes('Segregation of Duties Violation')) {
          blocked = true;
        }
      }
      if (!blocked) throw new Error('Expected SoD error when ECO requester attempts to self-approve');

      const approved = ManufacturingCostingMaintenanceEngine.approveECO({
        eco: underReview,
        approvedBy: 'chief-engineer-mona' // Chief Engineer
      });

      if (approved.status !== 'APPROVED' || approved.approvedBy !== 'chief-engineer-mona') {
        throw new Error('Expected APPROVED ECO status');
      }
      sharedECO = approved;
    });

    runTest('P32D-03-30', 'Apply approved ECO: generate incremented BOM version (v2) and verify redlined components', 'Reliability & ECO', () => {
      const { updatedECO, newBOM } = ManufacturingCostingMaintenanceEngine.applyECO({
        eco: sharedECO,
        bom: parentBOM,
        appliedBy: 'plm-admin-karim',
        asOfDate: '2026-09-02'
      });

      if (updatedECO.status !== 'EFFECTIVE') {
        throw new Error('Expected ECO status to be EFFECTIVE');
      }
      if (newBOM.version !== 2 || newBOM.status !== 'ACTIVE') {
        throw new Error('Expected new BOM version 2 with ACTIVE status');
      }
      const modifiedBlade = newBOM.components.find(c => c.sku === 'SA-BLADE-PACK');
      const addedStuds = newBOM.components.find(c => c.sku === 'RM-INCONEL-STUDS-M16');

      if (!modifiedBlade || modifiedBlade.quantityPerUnit !== 1.8) {
        throw new Error(`Expected modified blade quantity 1.8, got ${modifiedBlade?.quantityPerUnit}`);
      }
      if (!addedStuds || addedStuds.quantityPerUnit !== 12) {
        throw new Error(`Expected added studs quantity 12, got ${addedStuds?.quantityPerUnit}`);
      }
    });

    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.filter(r => !r.passed).length;

    return {
      phase: 'Phase 3.2D-03 — Advanced Product Costing, Manufacturing Variances & Plant Maintenance',
      total: results.length,
      passed: passedCount,
      failed: failedCount,
      results
    };
  }
}
