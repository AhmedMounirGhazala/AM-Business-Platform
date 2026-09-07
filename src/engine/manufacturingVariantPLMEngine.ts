/**
 * AM Enterprise ERP — Phase 3.2D-05 Engine
 * Manufacturing Variant Configuration, Super-BOM Explosion, PLM Deviations,
 * Multi-Tier Recall Containment, and Sustainability / Carbon Accounting
 */

import { sha256Hex } from '../utils/sha256';
import {
  ConfigurableProductModel,
  ConfigurationCharacteristic,
  ConfigurationRule,
  SuperBOM,
  SuperBOMComponent,
  ConfiguredVariantInstance,
  ResolvedVariantComponent,
  DeviationPermit,
  DeviationType,
  DeviationStatus,
  RecallIncident,
  RecallSeverity,
  RecallStatus,
  QuarantinedEntityRecord,
  QuarantinedEntityType,
  EnergyConsumptionRecord,
  CarbonFootprintCalculation
} from '../types/manufacturingVariantPLM';
import { FinancialEventPayload } from '../types/processManufacturingSubcontracting';

export class ManufacturingVariantPLMEngine {

  // ==========================================================================
  // 1. VARIANT CONFIGURATION & SUPER-BOM (CTO / ATO)
  // ==========================================================================

  public static createConfigurableProductModel(params: {
    tenantId: string;
    companyId: string;
    baseModelSku: string;
    modelName: string;
    characteristics: ConfigurationCharacteristic[];
    rules?: ConfigurationRule[];
    superBomId: string;
  }): ConfigurableProductModel {
    if (!params.baseModelSku || !params.modelName) {
      throw new Error('Base model SKU and name are mandatory for configurable product models');
    }
    if (!params.characteristics || params.characteristics.length === 0) {
      throw new Error('At least one configuration characteristic is required');
    }

    return {
      id: `CFG-MOD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      baseModelSku: params.baseModelSku,
      modelName: params.modelName,
      characteristics: params.characteristics,
      rules: params.rules || [],
      superBomId: params.superBomId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
  }

  public static createSuperBOM(params: {
    tenantId: string;
    companyId: string;
    baseModelSku: string;
    modelName: string;
    basePrice: number;
    components: SuperBOMComponent[];
  }): SuperBOM {
    if (!params.baseModelSku) {
      throw new Error('Base model SKU is required for Super-BOM');
    }
    if (!params.components || params.components.length === 0) {
      throw new Error('Super-BOM must have at least one component');
    }

    return {
      id: `SUPER-BOM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      baseModelSku: params.baseModelSku,
      modelName: params.modelName,
      version: 1,
      basePrice: params.basePrice,
      components: params.components,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Evaluates a condition string against chosen option values safely
   * Supports format: "KEY == 'VAL'", "KEY != 'VAL'", "KEY == 'VAL' && OTHER == 'VAL2'"
   */
  public static evaluateCondition(
    condition: string,
    options: Record<string, string | number | boolean>
  ): boolean {
    if (!condition || condition.trim() === '') return true;

    // Handle compound AND expressions: expr1 && expr2
    const clauses = condition.split('&&').map(c => c.trim());
    for (const clause of clauses) {
      if (clause.includes('!=')) {
        const [key, valRaw] = clause.split('!=').map(s => s.trim());
        const expected = valRaw.replace(/['"]/g, '');
        const actual = String(options[key] ?? '');
        if (actual === expected) return false;
      } else if (clause.includes('==')) {
        const [key, valRaw] = clause.split('==').map(s => s.trim());
        const expected = valRaw.replace(/['"]/g, '');
        const actual = String(options[key] ?? '');
        if (actual !== expected) return false;
      }
    }
    return true;
  }

  public static configureProductVariant(params: {
    tenantId: string;
    companyId: string;
    model: ConfigurableProductModel;
    superBom: SuperBOM;
    selectedOptions: Record<string, string | number | boolean>;
    configuredBy: string;
  }): ConfiguredVariantInstance {
    const { model, superBom, selectedOptions } = params;

    // 1. Validate mandatory characteristics
    for (const char of model.characteristics) {
      if (char.required && (selectedOptions[char.code] === undefined || selectedOptions[char.code] === '')) {
        throw new Error(`Mandatory characteristic '${char.name}' (${char.code}) is not selected`);
      }
    }

    // 2. Evaluate rules (Preconditions & Incompatibilities)
    for (const rule of model.rules) {
      if (rule.ruleType === 'INCOMPATIBILITY') {
        const triggers = this.evaluateCondition(rule.conditionExpression, selectedOptions);
        if (triggers) {
          throw new Error(rule.errorMessage || `Incompatible configuration options selected: ${rule.conditionExpression}`);
        }
      } else if (rule.ruleType === 'PRECONDITION') {
        const isAllowed = this.evaluateCondition(rule.conditionExpression, selectedOptions);
        const targetVal = selectedOptions[rule.sourceCharacteristic];
        if (targetVal !== undefined && !isAllowed) {
          throw new Error(rule.errorMessage || `Option '${rule.sourceCharacteristic}' cannot be selected unless condition is met: ${rule.conditionExpression}`);
        }
      }
    }

    // 3. Resolve Super-BOM: Filter components matching selection conditions
    const resolvedBOM: ResolvedVariantComponent[] = [];
    let totalMaterialCost = 0;

    for (const comp of superBom.components) {
      let isIncluded = comp.isStandard;
      if (!isIncluded && comp.selectionCondition) {
        isIncluded = this.evaluateCondition(comp.selectionCondition, selectedOptions);
      }

      if (isIncluded) {
        const lineCost = Number((comp.baseQuantity * comp.unitCost).toFixed(2));
        resolvedBOM.push({
          itemSku: comp.itemSku,
          description: comp.description,
          quantity: comp.baseQuantity,
          unitOfMeasure: comp.unitOfMeasure,
          unitCost: comp.unitCost,
          totalCost: lineCost
        });
        totalMaterialCost += lineCost;
      }
    }

    // 4. Calculate Option Price Surcharges / Deltas
    let totalOptionPriceDelta = 0;
    for (const char of model.characteristics) {
      const selectedVal = selectedOptions[char.code];
      if (selectedVal !== undefined) {
        const opt = char.allowedValues.find(v => String(v.code) === String(selectedVal));
        if (opt) {
          totalOptionPriceDelta += opt.priceDelta;
        }
      }
    }

    const basePrice = superBom.basePrice;
    const finalCalculatedPrice = Number((basePrice + totalOptionPriceDelta).toFixed(2));
    totalMaterialCost = Number(totalMaterialCost.toFixed(2));

    // 5. Generate deterministic cryptographic configuration hash
    const normalizedOptions = Object.keys(selectedOptions).sort().reduce((acc, k) => {
      acc[k] = selectedOptions[k];
      return acc;
    }, {} as Record<string, any>);

    const configHash = sha256Hex(JSON.stringify({
      baseModel: model.baseModelSku,
      options: normalizedOptions,
      components: resolvedBOM.map(c => ({ sku: c.itemSku, qty: c.quantity }))
    }));

    const configuredSku = `${model.baseModelSku}-VAR-${configHash.substring(0, 8).toUpperCase()}`;

    return {
      id: `VAR-INST-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      configuredSku,
      baseModelSku: model.baseModelSku,
      selectedOptions: params.selectedOptions,
      resolvedBOM,
      totalMaterialCost,
      basePrice,
      totalOptionPriceDelta,
      finalCalculatedPrice,
      cryptographicConfigurationHash: configHash,
      configuredBy: params.configuredBy,
      configuredAt: new Date().toISOString()
    };
  }

  // ==========================================================================
  // 2. PLM ENGINEERING DEVIATIONS & CONCESSION PERMITS
  // ==========================================================================

  public static createDeviationPermit(params: {
    tenantId: string;
    companyId: string;
    title: string;
    deviationType: DeviationType;
    affectedFinishedGoodSku: string;
    bomId: string;
    originalMaterialSku?: string;
    substituteMaterialSku?: string;
    workCenterId?: string;
    justification: string;
    scopeType: 'QUANTITY_LIMIT' | 'DATE_RANGE' | 'LOT_COUNT';
    maxAllowedQuantity?: number;
    validFrom: string;
    validTo?: string;
    requestedBy: string;
  }): DeviationPermit {
    if (!params.title || !params.justification) {
      throw new Error('Title and engineering justification are required for deviation permits');
    }
    if (!params.affectedFinishedGoodSku || !params.bomId) {
      throw new Error('Affected SKU and BOM ID are mandatory');
    }
    if (params.scopeType === 'QUANTITY_LIMIT' && (!params.maxAllowedQuantity || params.maxAllowedQuantity <= 0)) {
      throw new Error('Max allowed quantity must be greater than zero for quantity-limited deviations');
    }

    const permitNumber = `DEV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const seal = sha256Hex(`${permitNumber}|${params.affectedFinishedGoodSku}|${params.justification}|${params.requestedBy}`);

    return {
      id: `DEV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      permitNumber,
      title: params.title,
      deviationType: params.deviationType,
      status: 'DRAFT',
      affectedFinishedGoodSku: params.affectedFinishedGoodSku,
      bomId: params.bomId,
      originalMaterialSku: params.originalMaterialSku,
      substituteMaterialSku: params.substituteMaterialSku,
      workCenterId: params.workCenterId,
      justification: params.justification,
      scopeType: params.scopeType,
      maxAllowedQuantity: params.maxAllowedQuantity,
      consumedQuantity: 0,
      validFrom: params.validFrom,
      validTo: params.validTo,
      requestedBy: params.requestedBy,
      requestedAt: new Date().toISOString(),
      cryptographicSeal: seal
    };
  }

  public static submitDeviationPermit(permit: DeviationPermit, submittedBy: string): DeviationPermit {
    if (permit.status !== 'DRAFT') {
      throw new Error(`Only DRAFT deviation permits can be submitted (current status: ${permit.status})`);
    }
    return {
      ...permit,
      status: 'SUBMITTED',
      reviewedBy: submittedBy,
      reviewedAt: new Date().toISOString()
    };
  }

  public static approveDeviationPermit(params: {
    permit: DeviationPermit;
    approvedBy: string;
    qualityManagerSignature: string;
  }): DeviationPermit {
    const { permit, approvedBy, qualityManagerSignature } = params;
    if (permit.status !== 'SUBMITTED') {
      throw new Error(`Cannot approve deviation permit in '${permit.status}' status. Must be SUBMITTED`);
    }
    // Separation of Duties: Approver cannot be the same user who requested the deviation
    if (approvedBy === permit.requestedBy) {
      throw new Error('Segregation of Duties violation: Quality approver cannot be the same person as requester');
    }
    if (!qualityManagerSignature) {
      throw new Error('Quality manager signature is required for deviation authorization');
    }

    const updatedSeal = sha256Hex(`${permit.permitNumber}|APPROVED|${approvedBy}|${qualityManagerSignature}|${permit.maxAllowedQuantity}`);

    return {
      ...permit,
      status: 'ACTIVE',
      approvedBy,
      approvedAt: new Date().toISOString(),
      qualityManagerSignature,
      cryptographicSeal: updatedSeal
    };
  }

  public static consumeDeviationQuantity(params: {
    permit: DeviationPermit;
    quantityToConsume: number;
  }): DeviationPermit {
    const { permit, quantityToConsume } = params;
    if (permit.status !== 'ACTIVE') {
      throw new Error(`Deviation permit is not ACTIVE (current status: ${permit.status})`);
    }

    const newConsumed = permit.consumedQuantity + quantityToConsume;

    if (permit.scopeType === 'QUANTITY_LIMIT' && permit.maxAllowedQuantity !== undefined) {
      if (newConsumed > permit.maxAllowedQuantity) {
        throw new Error(`Deviation permit quota exceeded: Requested ${quantityToConsume}, consumed ${permit.consumedQuantity}, max allowance ${permit.maxAllowedQuantity}`);
      }
    }

    const isExhausted = permit.maxAllowedQuantity !== undefined && newConsumed >= permit.maxAllowedQuantity;

    return {
      ...permit,
      consumedQuantity: newConsumed,
      status: isExhausted ? 'EXHAUSTED' : 'ACTIVE'
    };
  }

  // ==========================================================================
  // 3. MULTI-TIER RECALL CONTAINMENT & QUARANTINE ENGINE
  // ==========================================================================

  public static initiateRecallContainment(params: {
    tenantId: string;
    companyId: string;
    title: string;
    severity: RecallSeverity;
    rootCauseSku: string;
    rootCauseLotNumber: string;
    defectDescription: string;
    initiatedBy: string;
    regulatoryReportRequired?: boolean;
    regulatoryBody?: string;
    // Discovered affected entities via genealogy traversal
    entitiesToQuarantine: {
      entityType: QuarantinedEntityType;
      entityId: string;
      itemSku: string;
      itemDescription: string;
      lotNumber?: string;
      serialNumber?: string;
      warehouseId?: string;
      customerId?: string;
      customerName?: string;
      affectedQuantity: number;
    }[];
  }): RecallIncident {
    if (!params.rootCauseSku || !params.rootCauseLotNumber) {
      throw new Error('Root cause SKU and contaminated lot number are mandatory to initiate containment');
    }
    if (!params.entitiesToQuarantine || params.entitiesToQuarantine.length === 0) {
      throw new Error('Recall containment must target at least one affected entity/lot');
    }

    const incidentNumber = `RCL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    let totalQuarantinedStockQty = 0;
    let totalHaltedWipQty = 0;
    let totalCustomerImpactedQty = 0;

    const affectedEntities: QuarantinedEntityRecord[] = params.entitiesToQuarantine.map((item, idx) => {
      if (item.entityType === 'RAW_INVENTORY_LOT' || item.entityType === 'FINISHED_GOODS_STOCK') {
        totalQuarantinedStockQty += item.affectedQuantity;
      } else if (item.entityType === 'WIP_WORK_ORDER') {
        totalHaltedWipQty += item.affectedQuantity;
      } else {
        totalCustomerImpactedQty += item.affectedQuantity;
      }

      return {
        id: `QNT-${Date.now()}-${idx}`,
        entityType: item.entityType,
        entityId: item.entityId,
        itemSku: item.itemSku,
        itemDescription: item.itemDescription,
        lotNumber: item.lotNumber,
        serialNumber: item.serialNumber,
        warehouseId: item.warehouseId,
        customerId: item.customerId,
        customerName: item.customerName,
        affectedQuantity: item.affectedQuantity,
        quarantineStatus: (item.entityType === 'CUSTOMER_DELIVERY' || item.entityType === 'OUTBOUND_SHIPMENT') 
          ? 'NOTIFIED' 
          : 'LOCKED',
        lockedAt: now,
        notes: `Containment lock under ${incidentNumber}`
      };
    });

    const containmentHash = sha256Hex(`${incidentNumber}|${params.severity}|${params.rootCauseLotNumber}|${affectedEntities.length}|${now}`);

    // Financial Decoupled Event for Warranty / Recall Accrual
    const financialEvent: FinancialEventPayload = {
      eventId: `EVT-RCL-${Date.now()}`,
      eventType: 'EVT_MFG_RECALL_QUARANTINE_INITIATED',
      tenantId: params.tenantId,
      companyId: params.companyId,
      sourceModule: 'MANUFACTURING_PLM',
      sourceEntityId: incidentNumber,
      eventTimestamp: now,
      payload: {
        incidentNumber,
        severity: params.severity,
        rootCauseSku: params.rootCauseSku,
        rootCauseLotNumber: params.rootCauseLotNumber,
        totalQuarantinedStockQty,
        totalHaltedWipQty,
        totalCustomerImpactedQty,
        containmentHash
      }
    };

    return {
      id: `RCL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      incidentNumber,
      title: params.title,
      severity: params.severity,
      status: 'CONTAINMENT_ACTIVE',
      rootCauseSku: params.rootCauseSku,
      rootCauseLotNumber: params.rootCauseLotNumber,
      defectDescription: params.defectDescription,
      affectedEntities,
      totalQuarantinedStockQty,
      totalHaltedWipQty,
      totalCustomerImpactedQty,
      initiatedBy: params.initiatedBy,
      initiatedAt: now,
      containmentLockedAt: now,
      regulatoryReportRequired: params.regulatoryReportRequired ?? (params.severity === 'CLASS_I'),
      regulatoryBody: params.regulatoryBody || (params.severity === 'CLASS_I' ? 'FDA/ISO' : undefined),
      containmentHash,
      financialEvent
    };
  }

  public static updateQuarantinedEntityStatus(params: {
    incident: RecallIncident;
    entityId: string;
    newStatus: 'LOCKED' | 'NOTIFIED' | 'RETRIEVED' | 'DISPOSED' | 'RELEASED';
    notes?: string;
  }): RecallIncident {
    const { incident, entityId, newStatus, notes } = params;
    const idx = incident.affectedEntities.findIndex(e => e.id === entityId || e.entityId === entityId);
    if (idx < 0) {
      throw new Error(`Quarantined entity record not found: ${entityId}`);
    }

    const updatedEntities = [...incident.affectedEntities];
    updatedEntities[idx] = {
      ...updatedEntities[idx],
      quarantineStatus: newStatus,
      notes: notes || updatedEntities[idx].notes
    };

    // Check if all customer deliveries are retrieved or disposed
    const allProcessed = updatedEntities.every(e => e.quarantineStatus === 'DISPOSED' || e.quarantineStatus === 'RETRIEVED' || e.quarantineStatus === 'RELEASED');
    const newIncidentStatus: RecallStatus = allProcessed ? 'RECONCILED' : incident.status;

    return {
      ...incident,
      status: newIncidentStatus,
      affectedEntities: updatedEntities
    };
  }

  public static closeRecallIncident(params: {
    incident: RecallIncident;
    closedBy: string;
  }): RecallIncident {
    const { incident, closedBy } = params;
    if (incident.status === 'CLOSED') {
      throw new Error('Recall incident is already CLOSED');
    }

    return {
      ...incident,
      status: 'CLOSED',
      closedBy,
      closedAt: new Date().toISOString()
    };
  }

  // ==========================================================================
  // 4. PLANT SUSTAINABILITY, ENERGY & CARBON (ESG) ACCOUNTING
  // ==========================================================================

  public static recordEnergyConsumption(params: {
    tenantId: string;
    companyId: string;
    workOrderId: string;
    workCenterId: string;
    productionDate: string;
    electricityKwh: number;
    naturalGasCubicMeters: number;
    compressedAirCubicMeters?: number;
    waterLiters?: number;
    electricityRatePerKwh?: number;
    gasRatePerCubicMeter?: number;
    recordedBy: string;
  }): EnergyConsumptionRecord {
    if (params.electricityKwh < 0 || params.naturalGasCubicMeters < 0) {
      throw new Error('Energy meter readings cannot be negative');
    }

    const elekRate = params.electricityRatePerKwh ?? 0.15; // default $0.15 / kWh
    const gasRate = params.gasRatePerCubicMeter ?? 0.75;    // default $0.75 / m^3

    const energyCost = Number((
      (params.electricityKwh * elekRate) + 
      (params.naturalGasCubicMeters * gasRate)
    ).toFixed(2));

    return {
      id: `ENRG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      workOrderId: params.workOrderId,
      workCenterId: params.workCenterId,
      productionDate: params.productionDate,
      electricityKwh: params.electricityKwh,
      naturalGasCubicMeters: params.naturalGasCubicMeters,
      compressedAirCubicMeters: params.compressedAirCubicMeters ?? 0,
      waterLiters: params.waterLiters ?? 0,
      energyCost,
      recordedBy: params.recordedBy,
      recordedAt: new Date().toISOString()
    };
  }

  public static calculateCarbonFootprint(params: {
    tenantId: string;
    companyId: string;
    workOrderId: string;
    productSku: string;
    productName: string;
    quantityProduced: number;
    energyRecords: EnergyConsumptionRecord[];
    billOfMaterialsEmbodiedCarbonKg?: number; // Upstream Scope 3 embodied carbon from BOM items
    gridEmissionFactorKgPerKwh?: number;     // Scope 2 factor (default 0.42 kg CO2e / kWh)
    gasEmissionFactorKgPerM3?: number;       // Scope 1 factor (default 2.02 kg CO2e / m3)
  }): CarbonFootprintCalculation {
    if (params.quantityProduced <= 0) {
      throw new Error('Produced quantity must be greater than zero for carbon intensity calculation');
    }

    const gridFactor = params.gridEmissionFactorKgPerKwh ?? 0.42;
    const gasFactor = params.gasEmissionFactorKgPerM3 ?? 2.02;

    const totalElectricityKwh = params.energyRecords.reduce((sum, r) => sum + r.electricityKwh, 0);
    const totalGasM3 = params.energyRecords.reduce((sum, r) => sum + r.naturalGasCubicMeters, 0);

    const directEnergyCo2Kg = Number((totalElectricityKwh * gridFactor).toFixed(2));
    const fuelCombustionCo2Kg = Number((totalGasM3 * gasFactor).toFixed(2));
    const rawMaterialEmbodiedCo2Kg = Number((params.billOfMaterialsEmbodiedCarbonKg ?? 0).toFixed(2));

    const totalCo2eKg = Number((directEnergyCo2Kg + fuelCombustionCo2Kg + rawMaterialEmbodiedCo2Kg).toFixed(2));
    const co2ePerUnitKg = Number((totalCo2eKg / params.quantityProduced).toFixed(3));

    // Determine ESG Rating Band based on unit intensity
    let esgRatingBand: 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
    if (co2ePerUnitKg > 60.0) {
      esgRatingBand = 'F';
    } else if (co2ePerUnitKg > 30.0) {
      esgRatingBand = 'D';
    } else if (co2ePerUnitKg > 15.0) {
      esgRatingBand = 'C';
    } else if (co2ePerUnitKg > 5.0) {
      esgRatingBand = 'B';
    } else {
      esgRatingBand = 'A';
    }

    const auditSeal = sha256Hex(`${params.workOrderId}|${params.productSku}|${totalCo2eKg}|${co2ePerUnitKg}|${esgRatingBand}`);

    return {
      id: `CARB-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      workOrderId: params.workOrderId,
      productSku: params.productSku,
      productName: params.productName,
      quantityProduced: params.quantityProduced,
      directEnergyCo2Kg,
      fuelCombustionCo2Kg,
      rawMaterialEmbodiedCo2Kg,
      totalCo2eKg,
      co2ePerUnitKg,
      esgRatingBand,
      calculatedAt: new Date().toISOString(),
      auditSeal
    };
  }
}
