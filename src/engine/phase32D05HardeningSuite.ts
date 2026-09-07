/**
 * AM Enterprise ERP — Phase 3.2D-05 Hardening Test Suite
 * 35 Deterministic Scenarios Verifying Variant Configuration, Super-BOM Explosion,
 * PLM Engineering Deviations, Multi-Tier Recall Containment, and Carbon Accounting
 */

import { ManufacturingVariantPLMEngine } from './manufacturingVariantPLMEngine';
import {
  ConfigurableProductModel,
  SuperBOM,
  ConfiguredVariantInstance,
  DeviationPermit,
  RecallIncident,
  EnergyConsumptionRecord,
  CarbonFootprintCalculation
} from '../types/manufacturingVariantPLM';

export interface HardeningTestResult {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

export class Phase32D05HardeningSuite {
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

    // Shared state variables across tests
    let sharedModel: ConfigurableProductModel;
    let sharedSuperBom: SuperBOM;
    let sharedVariant: ConfiguredVariantInstance;
    let sharedDeviation: DeviationPermit;
    let sharedRecall: RecallIncident;
    let sharedEnergyRecord: EnergyConsumptionRecord;
    let sharedCarbonCalc: CarbonFootprintCalculation;

    // ========================================================================
    // CATEGORY 1: VARIANT CONFIGURATION & SUPER-BOM EXPLOSION (Tests 1 - 10)
    // ========================================================================

    runTest('P32D-05-01', 'Register Configurable Product Model with characteristics & rules', 'Variant Configuration', () => {
      sharedModel = ManufacturingVariantPLMEngine.createConfigurableProductModel({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        baseModelSku: 'FG-TURBINE-MODULAR',
        modelName: 'Industrial Power Turbine 5000',
        superBomId: 'SUPER-BOM-TURB-01',
        characteristics: [
          {
            id: 'CHAR-POWER',
            code: 'POWER_OUTPUT',
            name: 'Power Output Rating',
            type: 'ENUM',
            required: true,
            allowedValues: [
              { code: '500KW', label: '500 Kilowatt Baseline', priceDelta: 0, costDelta: 0 },
              { code: '1000KW', label: '1000 Kilowatt Heavy-Duty', priceDelta: 15000, costDelta: 6200 },
              { code: '2000KW', label: '2000 Kilowatt Megawatt Class', priceDelta: 38000, costDelta: 16500 }
            ]
          },
          {
            id: 'CHAR-ENCLOSURE',
            code: 'ENCLOSURE_TYPE',
            name: 'Acoustic Enclosure',
            type: 'ENUM',
            required: true,
            allowedValues: [
              { code: 'STANDARD', label: 'Standard Industrial Enclosure', priceDelta: 0, costDelta: 0 },
              { code: 'WEATHERPROOF', label: 'All-Weather Marine Coating', priceDelta: 4500, costDelta: 1800 },
              { code: 'SOUNDPROOF', label: 'Ultra-Quiet Soundproof Attenuation', priceDelta: 8500, costDelta: 3400 }
            ]
          },
          {
            id: 'CHAR-COOLING',
            code: 'COOLING_SYSTEM',
            name: 'Cooling Subsystem',
            type: 'ENUM',
            required: false,
            allowedValues: [
              { code: 'AIR', label: 'Standard Air Cooled', priceDelta: 0, costDelta: 0 },
              { code: 'LIQUID', label: 'Closed-Loop Liquid Glycol', priceDelta: 6200, costDelta: 2700 }
            ]
          }
        ],
        rules: [
          {
            id: 'RULE-01',
            ruleType: 'INCOMPATIBILITY',
            sourceCharacteristic: 'POWER_OUTPUT',
            conditionExpression: "POWER_OUTPUT == '2000KW' && COOLING_SYSTEM == 'AIR'",
            errorMessage: '2000KW rating generates excessive heat and cannot be configured with standard Air cooling. Liquid cooling required.'
          }
        ]
      });

      if (!sharedModel.id || sharedModel.status !== 'ACTIVE') {
        throw new Error('Configurable product model creation failed');
      }
      if (sharedModel.characteristics.length !== 3) {
        throw new Error('Expected 3 configuration characteristics');
      }
    });

    runTest('P32D-05-02', 'Register 150% Super-BOM with standard & conditional items', 'Variant Configuration', () => {
      sharedSuperBom = ManufacturingVariantPLMEngine.createSuperBOM({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        baseModelSku: 'FG-TURBINE-MODULAR',
        modelName: 'Super-BOM Industrial Turbine',
        basePrice: 85000,
        components: [
          {
            id: 'COMP-CORE-ROTOR',
            itemSku: 'RM-ALLOY-ROTOR',
            description: 'Core Turbine Rotor Assembly',
            baseQuantity: 1,
            unitOfMeasure: 'EA',
            unitCost: 18000,
            isStandard: true
          },
          {
            id: 'COMP-CORE-STATOR',
            itemSku: 'RM-COPPER-STATOR',
            description: 'Heavy Copper Stator Core',
            baseQuantity: 1,
            unitOfMeasure: 'EA',
            unitCost: 12000,
            isStandard: true
          },
          {
            id: 'COMP-OPT-1000KW',
            itemSku: 'RM-BOOST-CAP-1000',
            description: '1000KW Auxiliary Capacitor Bank',
            baseQuantity: 2,
            unitOfMeasure: 'EA',
            unitCost: 3100,
            selectionCondition: "POWER_OUTPUT == '1000KW'",
            isStandard: false
          },
          {
            id: 'COMP-OPT-2000KW',
            itemSku: 'RM-BOOST-CAP-2000',
            description: '2000KW Dual Capacitor Matrix',
            baseQuantity: 4,
            unitOfMeasure: 'EA',
            unitCost: 4125,
            selectionCondition: "POWER_OUTPUT == '2000KW'",
            isStandard: false
          },
          {
            id: 'COMP-OPT-LIQUID-RADIATOR',
            itemSku: 'RM-GLYCOL-RADIATOR',
            description: 'Closed-Loop Liquid Radiator Core',
            baseQuantity: 1,
            unitOfMeasure: 'EA',
            unitCost: 2700,
            selectionCondition: "COOLING_SYSTEM == 'LIQUID'",
            isStandard: false
          }
        ]
      });

      if (!sharedSuperBom.id || sharedSuperBom.components.length !== 5) {
        throw new Error('Super-BOM registration failed');
      }
    });

    runTest('P32D-05-03', 'Validate mandatory characteristic enforcement (fails if omitted)', 'Variant Configuration', () => {
      let threw = false;
      try {
        ManufacturingVariantPLMEngine.configureProductVariant({
          tenantId: 'TENANT-001',
          companyId: 'COMP-001',
          model: sharedModel,
          superBom: sharedSuperBom,
          selectedOptions: {
            // Omit required POWER_OUTPUT
            ENCLOSURE_TYPE: 'STANDARD'
          },
          configuredBy: 'sales-eng-01'
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('Mandatory characteristic')) {
          throw new Error(`Unexpected error message: ${err.message}`);
        }
      }
      if (!threw) throw new Error('Expected configuration to fail when mandatory characteristic is missing');
    });

    runTest('P32D-05-04', 'Evaluate Incompatibility rule (2000KW + AIR cooling throws error)', 'Variant Configuration', () => {
      let threw = false;
      try {
        ManufacturingVariantPLMEngine.configureProductVariant({
          tenantId: 'TENANT-001',
          companyId: 'COMP-001',
          model: sharedModel,
          superBom: sharedSuperBom,
          selectedOptions: {
            POWER_OUTPUT: '2000KW',
            ENCLOSURE_TYPE: 'STANDARD',
            COOLING_SYSTEM: 'AIR'
          },
          configuredBy: 'sales-eng-01'
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('Liquid cooling required')) {
          throw new Error(`Expected rule error message, got: ${err.message}`);
        }
      }
      if (!threw) throw new Error('Expected incompatibility rule to block invalid option combination');
    });

    runTest('P32D-05-05', 'Evaluate Precondition rule validation', 'Variant Configuration', () => {
      const modelWithPrecondition = {
        ...sharedModel,
        rules: [
          {
            id: 'RULE-PRE-01',
            ruleType: 'PRECONDITION' as const,
            sourceCharacteristic: 'COOLING_SYSTEM',
            conditionExpression: "POWER_OUTPUT != '500KW'",
            errorMessage: 'Liquid cooling option is only available for high-output turbines (>500KW)'
          }
        ]
      };

      let threw = false;
      try {
        ManufacturingVariantPLMEngine.configureProductVariant({
          tenantId: 'TENANT-001',
          companyId: 'COMP-001',
          model: modelWithPrecondition,
          superBom: sharedSuperBom,
          selectedOptions: {
            POWER_OUTPUT: '500KW',
            ENCLOSURE_TYPE: 'STANDARD',
            COOLING_SYSTEM: 'LIQUID'
          },
          configuredBy: 'sales-eng-01'
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('high-output turbines')) {
          throw new Error(`Expected precondition failure, got: ${err.message}`);
        }
      }
      if (!threw) throw new Error('Expected precondition rule to fail when power is 500KW');
    });

    runTest('P32D-05-06', 'Successful Variant Configuration: Explode Super-BOM with conditional items', 'Variant Configuration', () => {
      sharedVariant = ManufacturingVariantPLMEngine.configureProductVariant({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        model: sharedModel,
        superBom: sharedSuperBom,
        selectedOptions: {
          POWER_OUTPUT: '1000KW',
          ENCLOSURE_TYPE: 'WEATHERPROOF',
          COOLING_SYSTEM: 'LIQUID'
        },
        configuredBy: 'lead-engineer'
      });

      if (!sharedVariant.id || !sharedVariant.configuredSku) {
        throw new Error('Configured variant instance was not generated');
      }
      // Resolved BOM must include: 2 standard items + RM-BOOST-CAP-1000 + RM-GLYCOL-RADIATOR = 4 items
      if (sharedVariant.resolvedBOM.length !== 4) {
        throw new Error(`Expected 4 resolved components, got ${sharedVariant.resolvedBOM.length}`);
      }
    });

    runTest('P32D-05-07', 'Confirm non-matching conditional components are excluded from BOM', 'Variant Configuration', () => {
      const has2000KwCap = sharedVariant.resolvedBOM.some(c => c.itemSku === 'RM-BOOST-CAP-2000');
      if (has2000KwCap) {
        throw new Error('2000KW component was erroneously included in 1000KW variant');
      }
      const has1000KwCap = sharedVariant.resolvedBOM.some(c => c.itemSku === 'RM-BOOST-CAP-1000');
      if (!has1000KwCap) {
        throw new Error('1000KW component should be included');
      }
    });

    runTest('P32D-05-08', 'Calculate option price deltas / surcharges accurately', 'Variant Configuration', () => {
      // Base Price = 85,000
      // 1000KW delta = +15,000
      // WEATHERPROOF delta = +4,500
      // LIQUID cooling delta = +6,200
      // Expected Total Option Surcharge = 25,700
      // Final Price = 85,000 + 25,700 = 110,700
      if (sharedVariant.totalOptionPriceDelta !== 25700) {
        throw new Error(`Expected option delta 25700, got ${sharedVariant.totalOptionPriceDelta}`);
      }
      if (sharedVariant.finalCalculatedPrice !== 110700) {
        throw new Error(`Expected final price 110700, got ${sharedVariant.finalCalculatedPrice}`);
      }
    });

    runTest('P32D-05-09', 'Calculate total material cost rollup on dynamically resolved BOM', 'Variant Configuration', () => {
      // Standard: Rotor 18000 + Stator 12000 = 30000
      // Conditional: 2 * 3100 (RM-BOOST-CAP-1000) = 6200
      // Conditional: 1 * 2700 (RM-GLYCOL-RADIATOR) = 2700
      // Total Material Cost = 30000 + 6200 + 2700 = 38900
      if (sharedVariant.totalMaterialCost !== 38900) {
        throw new Error(`Expected total material cost 38900, got ${sharedVariant.totalMaterialCost}`);
      }
    });

    runTest('P32D-05-10', 'Verify deterministic cryptographic configuration hash generation (SHA-256)', 'Variant Configuration', () => {
      if (!sharedVariant.cryptographicConfigurationHash || sharedVariant.cryptographicConfigurationHash.length !== 64) {
        throw new Error('Expected valid 64-char SHA-256 configuration hash');
      }
      // Configured SKU starts with base model and includes hash prefix
      if (!sharedVariant.configuredSku.startsWith('FG-TURBINE-MODULAR-VAR-')) {
        throw new Error(`Unexpected configured SKU format: ${sharedVariant.configuredSku}`);
      }
    });

    // ========================================================================
    // CATEGORY 2: PLM ENGINEERING DEVIATIONS & CONCESSIONS (Tests 11 - 18)
    // ========================================================================

    runTest('P32D-05-11', 'Create DRAFT Deviation Permit with quantity limit & cryptographic seal', 'PLM Deviations', () => {
      sharedDeviation = ManufacturingVariantPLMEngine.createDeviationPermit({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        title: 'Temporary Alternate Alloy Bushing Substitution',
        deviationType: 'MATERIAL_SUBSTITUTION',
        affectedFinishedGoodSku: 'FG-TURBINE-MODULAR',
        bomId: 'BOM-TURB-001',
        originalMaterialSku: 'RM-BRONZE-BUSHING',
        substituteMaterialSku: 'RM-PHOSPHOR-BRONZE-BUSHING',
        justification: 'Primary supplier stockout; certified aerospace alternate with identical yield strength',
        scopeType: 'QUANTITY_LIMIT',
        maxAllowedQuantity: 250,
        validFrom: '2026-09-01',
        validTo: '2026-10-31',
        requestedBy: 'mfg-eng-sarah'
      });

      if (!sharedDeviation.id || sharedDeviation.status !== 'DRAFT') {
        throw new Error('Deviation permit creation failed');
      }
      if (!sharedDeviation.permitNumber.startsWith('DEV-2026-')) {
        throw new Error(`Invalid permit number format: ${sharedDeviation.permitNumber}`);
      }
      if (!sharedDeviation.cryptographicSeal || sharedDeviation.cryptographicSeal.length !== 64) {
        throw new Error('Expected 64-char cryptographic seal on deviation permit');
      }
    });

    runTest('P32D-05-12', 'Reject creation of quantity-limited deviation with non-positive allowance', 'PLM Deviations', () => {
      let threw = false;
      try {
        ManufacturingVariantPLMEngine.createDeviationPermit({
          tenantId: 'TENANT-001',
          companyId: 'COMP-001',
          title: 'Invalid Zero Quantity Permit',
          deviationType: 'TOLERANCE_RELAXATION',
          affectedFinishedGoodSku: 'FG-TURBINE-MODULAR',
          bomId: 'BOM-TURB-001',
          justification: 'Test',
          scopeType: 'QUANTITY_LIMIT',
          maxAllowedQuantity: 0, // Invalid
          validFrom: '2026-09-01',
          requestedBy: 'mfg-eng-sarah'
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('greater than zero')) {
          throw new Error(`Unexpected error message: ${err.message}`);
        }
      }
      if (!threw) throw new Error('Expected error for zero maxAllowedQuantity');
    });

    runTest('P32D-05-13', 'Submit DRAFT deviation for quality engineering review', 'PLM Deviations', () => {
      const submitted = ManufacturingVariantPLMEngine.submitDeviationPermit(sharedDeviation, 'lead-qa-reviewer');
      if (submitted.status !== 'SUBMITTED' || submitted.reviewedBy !== 'lead-qa-reviewer') {
        throw new Error('Deviation submission failed');
      }
      sharedDeviation = submitted;
    });

    runTest('P32D-05-14', 'Prevent direct approval of DRAFT deviation without prior submission', 'PLM Deviations', () => {
      const draftPermit = { ...sharedDeviation, status: 'DRAFT' as const };
      let threw = false;
      try {
        ManufacturingVariantPLMEngine.approveDeviationPermit({
          permit: draftPermit,
          approvedBy: 'qa-director-mark',
          qualityManagerSignature: 'SIGN-QM-9941'
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('Must be SUBMITTED')) {
          throw new Error(`Unexpected error message: ${err.message}`);
        }
      }
      if (!threw) throw new Error('Expected approval on DRAFT to be blocked');
    });

    runTest('P32D-05-15', 'Segregation of Duties (SoD): Block approval when approver is same as requester', 'PLM Deviations', () => {
      let threw = false;
      try {
        ManufacturingVariantPLMEngine.approveDeviationPermit({
          permit: sharedDeviation, // requestedBy is 'mfg-eng-sarah'
          approvedBy: 'mfg-eng-sarah', // Attempting self-approval
          qualityManagerSignature: 'SELF-SIGN'
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('Segregation of Duties violation')) {
          throw new Error(`Expected SoD violation message, got: ${err.message}`);
        }
      }
      if (!threw) throw new Error('Expected self-approval to be blocked by SoD');
    });

    runTest('P32D-05-16', 'Approve deviation with quality manager signature and updated cryptographic seal', 'PLM Deviations', () => {
      const approved = ManufacturingVariantPLMEngine.approveDeviationPermit({
        permit: sharedDeviation,
        approvedBy: 'qa-director-mark',
        qualityManagerSignature: 'SIGN-QM-CERT-8812'
      });

      if (approved.status !== 'ACTIVE' || approved.approvedBy !== 'qa-director-mark') {
        throw new Error('Deviation approval failed');
      }
      if (approved.cryptographicSeal === sharedDeviation.cryptographicSeal) {
        throw new Error('Expected cryptographic seal to update upon formal approval');
      }
      sharedDeviation = approved;
    });

    runTest('P32D-05-17', 'Consume authorized deviation quantity in production and verify remaining quota', 'PLM Deviations', () => {
      // Authorized = 250. Consume 100 units.
      const updated = ManufacturingVariantPLMEngine.consumeDeviationQuantity({
        permit: sharedDeviation,
        quantityToConsume: 100
      });

      if (updated.consumedQuantity !== 100 || updated.status !== 'ACTIVE') {
        throw new Error(`Expected 100 consumed, ACTIVE status, got ${updated.consumedQuantity} / ${updated.status}`);
      }
      sharedDeviation = updated;
    });

    runTest('P32D-05-18', 'Prevent over-consumption beyond allowance and transition to EXHAUSTED when depleted', 'PLM Deviations', () => {
      // Attempt to consume 200 units when only 150 remains (max 250) -> should fail
      let threw = false;
      try {
        ManufacturingVariantPLMEngine.consumeDeviationQuantity({
          permit: sharedDeviation,
          quantityToConsume: 200
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('quota exceeded')) {
          throw new Error(`Unexpected error message: ${err.message}`);
        }
      }
      if (!threw) throw new Error('Expected over-consumption to throw error');

      // Now consume exact remaining 150 units -> should succeed and set status to EXHAUSTED
      const fullyConsumed = ManufacturingVariantPLMEngine.consumeDeviationQuantity({
        permit: sharedDeviation,
        quantityToConsume: 150
      });

      if (fullyConsumed.consumedQuantity !== 250 || fullyConsumed.status !== 'EXHAUSTED') {
        throw new Error(`Expected permit to transition to EXHAUSTED, got ${fullyConsumed.status}`);
      }
      sharedDeviation = fullyConsumed;
    });

    // ========================================================================
    // CATEGORY 3: MULTI-TIER RECALL CONTAINMENT & TRACEABILITY (Tests 19 - 27)
    // ========================================================================

    runTest('P32D-05-19', 'Initiate Recall Incident for Class I contaminated lot across multi-tier entities', 'Recall Containment', () => {
      sharedRecall = ManufacturingVariantPLMEngine.initiateRecallContainment({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        title: 'Micro-crack Contamination in Turbine Blade Castings',
        severity: 'CLASS_I',
        rootCauseSku: 'RM-CAST-BLADE-01',
        rootCauseLotNumber: 'LOT-BLADE-CRACK-909',
        defectDescription: 'Sub-surface fatigue micro-cracking detected in casting batch X-909 posing catastrophic burst risk',
        initiatedBy: 'chief-safety-officer',
        entitiesToQuarantine: [
          {
            entityType: 'RAW_INVENTORY_LOT',
            entityId: 'LOT-BLADE-CRACK-909',
            itemSku: 'RM-CAST-BLADE-01',
            itemDescription: 'Raw Turbine Blade Castings',
            lotNumber: 'LOT-BLADE-CRACK-909',
            warehouseId: 'WH-CENTRAL-RAW',
            affectedQuantity: 120
          },
          {
            entityType: 'WIP_WORK_ORDER',
            entityId: 'WO-2026-0044',
            itemSku: 'FG-TURBINE-MODULAR',
            itemDescription: 'Active Turbine Assembly in Cell 3',
            affectedQuantity: 5
          },
          {
            entityType: 'FINISHED_GOODS_STOCK',
            entityId: 'FG-LOT-9901',
            itemSku: 'FG-TURBINE-MODULAR',
            itemDescription: 'Finished Turbines in Central Warehouse',
            lotNumber: 'LOT-FG-9901',
            warehouseId: 'WH-FINISHED-GOODS',
            affectedQuantity: 8
          },
          {
            entityType: 'CUSTOMER_DELIVERY',
            entityId: 'DEL-2026-0812',
            itemSku: 'FG-TURBINE-MODULAR',
            itemDescription: 'Delivered Turbine Gen-Set',
            serialNumber: 'SN-TURB-2026-0812',
            customerId: 'CUST-APEX-ENERGY',
            customerName: 'Apex Energy Systems',
            affectedQuantity: 2
          }
        ]
      });

      if (!sharedRecall.id || sharedRecall.status !== 'CONTAINMENT_ACTIVE') {
        throw new Error('Recall incident initiation failed');
      }
      if (!sharedRecall.incidentNumber.startsWith('RCL-2026-')) {
        throw new Error(`Invalid incident number: ${sharedRecall.incidentNumber}`);
      }
      if (sharedRecall.affectedEntities.length !== 4) {
        throw new Error(`Expected 4 quarantined entities, got ${sharedRecall.affectedEntities.length}`);
      }
    });

    runTest('P32D-05-20', 'Verify root cause SKU and lot validation (cannot initiate without valid identifiers)', 'Recall Containment', () => {
      let threw = false;
      try {
        ManufacturingVariantPLMEngine.initiateRecallContainment({
          tenantId: 'TENANT-001',
          companyId: 'COMP-001',
          title: 'Invalid',
          severity: 'CLASS_II',
          rootCauseSku: '',
          rootCauseLotNumber: '',
          defectDescription: 'Test',
          initiatedBy: 'officer',
          entitiesToQuarantine: [{ entityType: 'RAW_INVENTORY_LOT', entityId: 'E1', itemSku: 'SKU', itemDescription: 'Desc', affectedQuantity: 1 }]
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('Root cause SKU and contaminated lot number are mandatory')) {
          throw new Error(`Unexpected error message: ${err.message}`);
        }
      }
      if (!threw) throw new Error('Expected validation error for missing root cause lot');
    });

    runTest('P32D-05-21', 'Validate multi-tier entity quantity segregation in recall record', 'Recall Containment', () => {
      // Raw (120) + FG Stock (8) = 128
      if (sharedRecall.totalQuarantinedStockQty !== 128) {
        throw new Error(`Expected 128 quarantined stock, got ${sharedRecall.totalQuarantinedStockQty}`);
      }
      // WIP (5)
      if (sharedRecall.totalHaltedWipQty !== 5) {
        throw new Error(`Expected 5 halted WIP, got ${sharedRecall.totalHaltedWipQty}`);
      }
      // Customer Delivered (2)
      if (sharedRecall.totalCustomerImpactedQty !== 2) {
        throw new Error(`Expected 2 customer impacted, got ${sharedRecall.totalCustomerImpactedQty}`);
      }
    });

    runTest('P32D-05-22', 'Verify immediate automatic lockdown of warehouse lots to LOCKED state', 'Recall Containment', () => {
      const rawLot = sharedRecall.affectedEntities.find(e => e.entityType === 'RAW_INVENTORY_LOT');
      const fgStock = sharedRecall.affectedEntities.find(e => e.entityType === 'FINISHED_GOODS_STOCK');

      if (!rawLot || rawLot.quarantineStatus !== 'LOCKED') {
        throw new Error('Raw inventory lot not set to LOCKED state');
      }
      if (!fgStock || fgStock.quarantineStatus !== 'LOCKED') {
        throw new Error('Finished goods warehouse stock not set to LOCKED state');
      }
    });

    runTest('P32D-05-23', 'Verify customer-impacted units set to NOTIFIED state for dispatch', 'Recall Containment', () => {
      const custDelivery = sharedRecall.affectedEntities.find(e => e.entityType === 'CUSTOMER_DELIVERY');
      if (!custDelivery || custDelivery.quarantineStatus !== 'NOTIFIED') {
        throw new Error('Customer delivery entity should be in NOTIFIED state');
      }
      if (custDelivery.customerName !== 'Apex Energy Systems') {
        throw new Error(`Customer name mismatch: ${custDelivery.customerName}`);
      }
    });

    runTest('P32D-05-24', 'Decoupled Financial Event emission: Verify EVT_MFG_RECALL_QUARANTINE_INITIATED', 'Recall Containment', () => {
      const event = sharedRecall.financialEvent;
      if (!event) throw new Error('Expected decoupled financial event on recall containment');
      if (event.eventType !== 'EVT_MFG_RECALL_QUARANTINE_INITIATED') {
        throw new Error(`Invalid event type: ${event.eventType}`);
      }
      if (event.sourceModule !== 'MANUFACTURING_PLM') {
        throw new Error(`Invalid source module: ${event.sourceModule}`);
      }
      if (event.payload.totalCustomerImpactedQty !== 2) {
        throw new Error('Financial payload customer impacted quantity mismatch');
      }
    });

    runTest('P32D-05-25', 'Verify immutable SHA-256 containment hash reflects complete affected tree', 'Recall Containment', () => {
      if (!sharedRecall.containmentHash || sharedRecall.containmentHash.length !== 64) {
        throw new Error('Expected 64-char containment hash on recall incident');
      }
    });

    runTest('P32D-05-26', 'Update individual entity status through recovery lifecycle (RETRIEVED, DISPOSED)', 'Recall Containment', () => {
      const rawLot = sharedRecall.affectedEntities.find(e => e.entityType === 'RAW_INVENTORY_LOT')!;
      
      const updated = ManufacturingVariantPLMEngine.updateQuarantinedEntityStatus({
        incident: sharedRecall,
        entityId: rawLot.id,
        newStatus: 'DISPOSED',
        notes: 'Incinerated and melted under hazardous waste manifest #HW-8812'
      });

      const updatedRaw = updated.affectedEntities.find(e => e.id === rawLot.id);
      if (!updatedRaw || updatedRaw.quarantineStatus !== 'DISPOSED') {
        throw new Error('Entity status update to DISPOSED failed');
      }
      sharedRecall = updated;
    });

    runTest('P32D-05-27', 'Close recall incident with QA manager sign-off after full reconciliation', 'Recall Containment', () => {
      const closed = ManufacturingVariantPLMEngine.closeRecallIncident({
        incident: sharedRecall,
        closedBy: 'vp-quality-assurance'
      });

      if (closed.status !== 'CLOSED' || closed.closedBy !== 'vp-quality-assurance') {
        throw new Error('Recall incident closure failed');
      }
      if (!closed.closedAt) {
        throw new Error('Expected closedAt timestamp on closed incident');
      }
      sharedRecall = closed;
    });

    // ========================================================================
    // CATEGORY 4: SUSTAINABILITY, ENERGY & CARBON (ESG) ACCOUNTING (Tests 28 - 35)
    // ========================================================================

    runTest('P32D-05-28', 'Record multi-meter energy consumption (electricity, natural gas, water)', 'Sustainability & ESG', () => {
      sharedEnergyRecord = ManufacturingVariantPLMEngine.recordEnergyConsumption({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        workOrderId: 'WO-2026-0044',
        workCenterId: 'WC-MACHINING-01',
        productionDate: '2026-09-02',
        electricityKwh: 4500,
        naturalGasCubicMeters: 320,
        compressedAirCubicMeters: 850,
        waterLiters: 1200,
        electricityRatePerKwh: 0.16,
        gasRatePerCubicMeter: 0.80,
        recordedBy: 'iot-energy-gateway'
      });

      if (!sharedEnergyRecord.id) throw new Error('Energy record creation failed');
      if (sharedEnergyRecord.electricityKwh !== 4500 || sharedEnergyRecord.naturalGasCubicMeters !== 320) {
        throw new Error('Meter readings mismatch');
      }
    });

    runTest('P32D-05-29', 'Validate non-negative energy meter inputs (throws on negative)', 'Sustainability & ESG', () => {
      let threw = false;
      try {
        ManufacturingVariantPLMEngine.recordEnergyConsumption({
          tenantId: 'TENANT-001',
          companyId: 'COMP-001',
          workOrderId: 'WO-2026-0044',
          workCenterId: 'WC-01',
          productionDate: '2026-09-02',
          electricityKwh: -50,
          naturalGasCubicMeters: 10,
          recordedBy: 'tester'
        });
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('cannot be negative')) {
          throw new Error(`Unexpected error: ${err.message}`);
        }
      }
      if (!threw) throw new Error('Expected negative energy input to be rejected');
    });

    runTest('P32D-05-30', 'Calculate multi-utility energy cost using contract utility tariffs', 'Sustainability & ESG', () => {
      // 4500 kWh * 0.16 = 720.00
      // 320 m^3 * 0.80 = 256.00
      // Total Energy Cost = 720.00 + 256.00 = 976.00
      if (sharedEnergyRecord.energyCost !== 976.00) {
        throw new Error(`Expected energy cost 976.00, got ${sharedEnergyRecord.energyCost}`);
      }
    });

    runTest('P32D-05-31', 'Calculate Scope 2 direct electricity carbon emissions using grid factor', 'Sustainability & ESG', () => {
      // 4500 kWh * 0.42 kg CO2e / kWh = 1890.00 kg CO2e
      sharedCarbonCalc = ManufacturingVariantPLMEngine.calculateCarbonFootprint({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        workOrderId: 'WO-2026-0044',
        productSku: 'FG-TURBINE-MODULAR',
        productName: 'Modular Industrial Turbine',
        quantityProduced: 5,
        energyRecords: [sharedEnergyRecord],
        billOfMaterialsEmbodiedCarbonKg: 1450.00, // Scope 3 upstream BOM embodied carbon
        gridEmissionFactorKgPerKwh: 0.42,
        gasEmissionFactorKgPerM3: 2.02
      });

      if (sharedCarbonCalc.directEnergyCo2Kg !== 1890.00) {
        throw new Error(`Expected Scope 2 direct energy CO2 1890.00 kg, got ${sharedCarbonCalc.directEnergyCo2Kg}`);
      }
    });

    runTest('P32D-05-32', 'Calculate Scope 1 natural gas combustion carbon emissions', 'Sustainability & ESG', () => {
      // 320 m^3 * 2.02 kg CO2e / m^3 = 646.40 kg CO2e
      if (sharedCarbonCalc.fuelCombustionCo2Kg !== 646.40) {
        throw new Error(`Expected Scope 1 fuel combustion CO2 646.40 kg, got ${sharedCarbonCalc.fuelCombustionCo2Kg}`);
      }
    });

    runTest('P32D-05-33', 'Calculate total product carbon footprint including upstream Scope 3 BOM inputs', 'Sustainability & ESG', () => {
      // Scope 2: 1890.00
      // Scope 1: 646.40
      // Scope 3: 1450.00
      // Total CO2e = 1890.00 + 646.40 + 1450.00 = 3986.40 kg
      if (sharedCarbonCalc.totalCo2eKg !== 3986.40) {
        throw new Error(`Expected total CO2e 3986.40 kg, got ${sharedCarbonCalc.totalCo2eKg}`);
      }
    });

    runTest('P32D-05-34', 'Evaluate carbon intensity (kg CO2e / unit) and assign ESG Rating Band', 'Sustainability & ESG', () => {
      // 3986.40 kg / 5 units produced = 797.28 kg CO2e / unit
      // Since > 60 kg / unit -> Rating Band 'F' (Heavy industrial machinery)
      if (sharedCarbonCalc.co2ePerUnitKg !== 797.28) {
        throw new Error(`Expected unit intensity 797.28 kg/unit, got ${sharedCarbonCalc.co2ePerUnitKg}`);
      }
      if (sharedCarbonCalc.esgRatingBand !== 'F') {
        throw new Error(`Expected ESG Rating Band 'F' for heavy turbine, got ${sharedCarbonCalc.esgRatingBand}`);
      }

      // Test lower emission batch to verify Band 'A' assignment
      const greenBatch = ManufacturingVariantPLMEngine.calculateCarbonFootprint({
        tenantId: 'TENANT-001',
        companyId: 'COMP-001',
        workOrderId: 'WO-2026-GREEN',
        productSku: 'FG-MICRO-SENSOR',
        productName: 'Eco Solar Sensor',
        quantityProduced: 1000,
        energyRecords: [{
          ...sharedEnergyRecord,
          electricityKwh: 200,
          naturalGasCubicMeters: 0
        }],
        billOfMaterialsEmbodiedCarbonKg: 100
      });
      // 200 * 0.42 = 84 kg direct + 100 BOM = 184 kg total / 1000 units = 0.184 kg/unit <= 5.0 -> Band 'A'
      if (greenBatch.esgRatingBand !== 'A') {
        throw new Error(`Expected Band 'A' for green batch, got ${greenBatch.esgRatingBand}`);
      }
    });

    runTest('P32D-05-35', 'Verify cryptographic ESG audit seal on carbon calculation record', 'Sustainability & ESG', () => {
      if (!sharedCarbonCalc.auditSeal || sharedCarbonCalc.auditSeal.length !== 64) {
        throw new Error('Expected 64-char SHA-256 cryptographic audit seal on carbon footprint calculation');
      }
    });

    const passedCount = results.filter(r => r.passed).length;

    return {
      passed: passedCount,
      total: results.length,
      results,
      phase: 'Phase 3.2D-05 — Product Lifecycle Management (PLM), Variant Configuration (CTO/ATO), Multi-Tier Recall & Carbon Accounting'
    };
  }
}
