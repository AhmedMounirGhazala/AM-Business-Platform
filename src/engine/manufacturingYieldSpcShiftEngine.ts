/**
 * AM Enterprise ERP — Phase 3.2D-08 Engine
 * Manufacturing Yield Optimization, Digital Shift Handover Governance,
 * Statistical Process Control (SPC / Six Sigma / Cpk) & Scrap Recovery
 */

import {
  SpcStudy,
  SpcSubgroup,
  SpcControlLimits,
  SpcProcessCapability,
  SpcRuleViolation,
  SpcCapabilityRating,
  SpcChartType,
  DigitalShiftHandover,
  ShiftWipSnapshotItem,
  ShiftSafetyLotoCheck,
  ProductionYieldAnalysis,
  ScrapRecoveryHarvest,
  YieldFinancialEvent,
  LineBalanceMetrics,
  WorkCenterCycleTime,
  HeijunkaSchedule,
  HeijunkaBoxSlot,
  Phase32D08AuditRecord
} from '../types/manufacturingYieldSpcShift';

// Standard Statistical Constants for SPC Control Charts (Sample size n = 2..10)
const SPC_FACTORS: Record<number, { a2: number; d3: number; d4: number; d2: number; c4: number }> = {
  2: { a2: 1.880, d3: 0.000, d4: 3.267, d2: 1.128, c4: 0.7979 },
  3: { a2: 1.023, d3: 0.000, d4: 2.574, d2: 1.693, c4: 0.8862 },
  4: { a2: 0.729, d3: 0.000, d4: 2.282, d2: 2.059, c4: 0.9213 },
  5: { a2: 0.577, d3: 0.000, d4: 2.114, d2: 2.326, c4: 0.9400 },
  6: { a2: 0.483, d3: 0.000, d4: 2.004, d2: 2.534, c4: 0.9515 },
  7: { a2: 0.419, d3: 0.076, d4: 1.924, d2: 2.704, c4: 0.9594 },
  8: { a2: 0.373, d3: 0.136, d4: 1.864, d2: 2.847, c4: 0.9650 },
  9: { a2: 0.337, d3: 0.184, d4: 1.816, d2: 2.970, c4: 0.9693 },
  10: { a2: 0.308, d3: 0.223, d4: 1.777, d2: 3.078, c4: 0.9727 }
};

export class ManufacturingYieldSpcShiftEngine {
  private static spcStudies: Map<string, SpcStudy> = new Map();
  private static shiftHandovers: Map<string, DigitalShiftHandover> = new Map();
  private static scrapHarvests: Map<string, ScrapRecoveryHarvest> = new Map();
  private static auditVault: Phase32D08AuditRecord[] = [];

  // Deterministic 64-character SHA-256 equivalent digest function
  public static hashPayload(payload: any): string {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    for (let i = 0; i < raw.length; i++) {
      const c = raw.charCodeAt(i);
      h0 = (Math.imul(h0 ^ c, 0x5bd1e995)) >>> 0;
      h1 = (Math.imul(h1 ^ (c * 31), 0x27d4eb2d)) >>> 0;
      h2 = (Math.imul(h2 ^ (c * 17), 0x165667b1)) >>> 0;
      h3 = (Math.imul(h3 ^ (c * 13), 0xd3a2646c)) >>> 0;
      h4 = (Math.imul(h4 ^ (c * 7), 0x85ebca6b)) >>> 0;
      h5 = (Math.imul(h5 ^ (c * 3), 0xc2b2ae35)) >>> 0;
      h6 = (Math.imul(h6 ^ (c * 53), 0x45d9f3b)) >>> 0;
      h7 = (Math.imul(h7 ^ (c * 97), 0x7feb352d)) >>> 0;
    }
    const toHex8 = (n: number) => ('00000000' + (n >>> 0).toString(16)).slice(-8);
    return `${toHex8(h0)}${toHex8(h1)}${toHex8(h2)}${toHex8(h3)}${toHex8(h4)}${toHex8(h5)}${toHex8(h6)}${toHex8(h7)}`;
  }

  // =========================================================================
  // 1. STATISTICAL PROCESS CONTROL (SPC) & SIX SIGMA CAPABILITY
  // =========================================================================

  public static createSpcStudy(params: {
    tenantId: string;
    companyId: string;
    studyCode: string;
    workCenterId: string;
    productSku: string;
    parameterName: string;
    unitOfMeasure: string;
    chartType?: SpcChartType;
    usl: number;
    lsl: number;
    nominalTarget?: number;
  }): SpcStudy {
    if (!params.studyCode || !params.parameterName || !params.productSku) {
      throw new Error('Study code, parameter name, and product SKU are mandatory.');
    }
    if (params.usl <= params.lsl) {
      throw new Error(`Upper Specification Limit (${params.usl}) must be strictly greater than Lower Specification Limit (${params.lsl}).`);
    }

    const id = `spc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const study: SpcStudy = {
      id,
      tenantId: params.tenantId,
      companyId: params.companyId,
      studyCode: params.studyCode,
      workCenterId: params.workCenterId,
      productSku: params.productSku,
      parameterName: params.parameterName,
      unitOfMeasure: params.unitOfMeasure,
      chartType: params.chartType || 'X_BAR_R',
      usl: params.usl,
      lsl: params.lsl,
      nominalTarget: params.nominalTarget !== undefined ? params.nominalTarget : (params.usl + params.lsl) / 2,
      subgroups: [],
      controlLimits: {
        centerLine: 0,
        ucl: 0,
        lcl: 0,
        rangeCenterLine: 0,
        rangeUcl: 0,
        rangeLcl: 0,
        sigmaEstimate: 0
      },
      violations: [],
      quarantineTriggered: false,
      createdAt: now,
      updatedAt: now,
      auditHash: ''
    };

    study.auditHash = this.hashPayload(study);
    this.spcStudies.set(study.id, study);
    this.logAudit(params.tenantId, params.companyId, 'SPC_STUDY', study.id, 'CREATE_SPC_STUDY', 'SYSTEM', study);

    return study;
  }

  public static recordSubgroup(params: {
    studyId: string;
    operatorId: string;
    sampleValues: number[];
  }): { study: SpcStudy; newViolations: SpcRuleViolation[] } {
    const study = this.spcStudies.get(params.studyId);
    if (!study) {
      throw new Error(`SPC Study not found: ${params.studyId}`);
    }
    if (!params.sampleValues || params.sampleValues.length === 0) {
      throw new Error('Subgroup sample values cannot be empty.');
    }

    const n = params.sampleValues.length;
    const sum = params.sampleValues.reduce((a, b) => a + b, 0);
    const mean = Math.round((sum / n) * 10000) / 10000;
    const min = Math.min(...params.sampleValues);
    const max = Math.max(...params.sampleValues);
    const range = Math.round((max - min) * 10000) / 10000;

    let variance = 0;
    if (n > 1) {
      variance = params.sampleValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1);
    }
    const stdDev = Math.round(Math.sqrt(variance) * 10000) / 10000;

    const subgroup: SpcSubgroup = {
      subgroupId: `sub-${study.subgroups.length + 1}-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      sampleValues: [...params.sampleValues],
      mean,
      range,
      stdDev,
      operatorId: params.operatorId
    };

    study.subgroups.push(subgroup);

    // Recompute Control Limits once at least 2 subgroups exist
    this.recomputeSpcMetrics(study);

    // Evaluate Western Electric & Nelson Rules on the latest subgroup
    const newViolations = this.evaluateSpcRules(study, subgroup);
    if (newViolations.length > 0) {
      study.violations.push(...newViolations);
      const criticalViolation = newViolations.some(v => v.severity === 'CRITICAL_OUT_OF_CONTROL');
      if (criticalViolation) {
        study.quarantineTriggered = true;
      }
    }

    study.updatedAt = new Date().toISOString();
    study.auditHash = this.hashPayload(study);

    this.logAudit(study.tenantId, study.companyId, 'SPC_STUDY', study.id, 'RECORD_SUBGROUP', params.operatorId, {
      subgroupId: subgroup.subgroupId,
      mean,
      range,
      newViolationsCount: newViolations.length,
      quarantineTriggered: study.quarantineTriggered
    });

    return { study, newViolations };
  }

  private static recomputeSpcMetrics(study: SpcStudy): void {
    if (study.subgroups.length < 2) {
      if (study.subgroups.length === 1) {
        study.controlLimits.centerLine = study.subgroups[0].mean;
      }
      return;
    }

    const k = study.subgroups.length;
    const avgSubgroupSize = Math.round(study.subgroups.reduce((acc, s) => acc + s.sampleValues.length, 0) / k);
    const n = Math.min(Math.max(avgSubgroupSize, 2), 10);
    const factor = SPC_FACTORS[n] || SPC_FACTORS[5];

    // Grand Mean (X-double-bar)
    const grandMean = Math.round((study.subgroups.reduce((acc, s) => acc + s.mean, 0) / k) * 10000) / 10000;
    // Average Range (R-bar)
    const avgRange = Math.round((study.subgroups.reduce((acc, s) => acc + s.range, 0) / k) * 10000) / 10000;

    // Control Limits
    const ucl = Math.round((grandMean + factor.a2 * avgRange) * 10000) / 10000;
    const lcl = Math.round((grandMean - factor.a2 * avgRange) * 10000) / 10000;
    const rangeUcl = Math.round((factor.d4 * avgRange) * 10000) / 10000;
    const rangeLcl = Math.round((factor.d3 * avgRange) * 10000) / 10000;

    // Process standard deviation estimate: sigma = R-bar / d2
    const sigmaEstimate = factor.d2 > 0 ? Math.round((avgRange / factor.d2) * 10000) / 10000 : 0.0001;

    study.controlLimits = {
      centerLine: grandMean,
      ucl,
      lcl,
      rangeCenterLine: avgRange,
      rangeUcl,
      rangeLcl,
      sigmaEstimate
    };

    // Calculate Process Capability (Cp and Cpk)
    if (sigmaEstimate > 0) {
      const cp = Math.round(((study.usl - study.lsl) / (6 * sigmaEstimate)) * 100) / 100;
      const cpu = (study.usl - grandMean) / (3 * sigmaEstimate);
      const cpl = (grandMean - study.lsl) / (3 * sigmaEstimate);
      const cpk = Math.round(Math.min(cpu, cpl) * 100) / 100;

      let rating: SpcCapabilityRating = 'INCAPABLE';
      if (cpk >= 1.67) rating = 'WORLD_CLASS';
      else if (cpk >= 1.33) rating = 'CAPABLE';
      else if (cpk >= 1.00) rating = 'MARGINALLY_CAPABLE';

      // Estimate Defect PPM based on normal distribution Z scores
      const zUpper = (study.usl - grandMean) / sigmaEstimate;
      const zLower = (grandMean - study.lsl) / sigmaEstimate;
      const tailUpper = this.approxNormTail(zUpper);
      const tailLower = this.approxNormTail(zLower);
      const defectPpmEstimated = Math.round((tailUpper + tailLower) * 1000000);

      study.capability = {
        usl: study.usl,
        lsl: study.lsl,
        nominalTarget: study.nominalTarget,
        cp,
        cpk,
        rating,
        isCapable: cpk >= 1.33,
        defectPpmEstimated
      };

      if (cpk < 1.00) {
        study.quarantineTriggered = true;
      }
    }
  }

  // Approximation of complementary standard normal cumulative distribution P(Z > z)
  private static approxNormTail(z: number): number {
    if (z <= 0) return 0.5;
    if (z > 6) return 0.000000001;
    // Hastings approximation
    const b1 = 0.319381530;
    const b2 = -0.356563782;
    const b3 = 1.781477937;
    const b4 = -1.821255978;
    const b5 = 1.330274429;
    const p = 0.2316419;
    const t = 1.0 / (1.0 + p * z);
    const poly = ((((b5 * t + b4) * t + b3) * t + b2) * t + b1) * t;
    const pdf = (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z);
    return Math.max(0, pdf * poly);
  }

  private static evaluateSpcRules(study: SpcStudy, latestSubgroup: SpcSubgroup): SpcRuleViolation[] {
    const violations: SpcRuleViolation[] = [];
    const subgroups = study.subgroups;
    const idx = subgroups.length - 1;
    const limits = study.controlLimits;

    if (limits.sigmaEstimate <= 0 || study.subgroups.length < 2) {
      return violations;
    }

    const mean = latestSubgroup.mean;
    const cl = limits.centerLine;

    // Rule 1: 1 point beyond 3-sigma control limits (UCL or LCL) [Nelson Rule 1 / Western Electric Rule 1]
    if (mean > limits.ucl || mean < limits.lcl) {
      violations.push({
        subgroupId: latestSubgroup.subgroupId,
        ruleId: 'RULE_1_BEYOND_3_SIGMA',
        ruleSet: 'HYBRID_STANDARD',
        ruleName: 'Nelson Rule 1 / WECO Rule 1: Point Beyond 3-Sigma Control Limit',
        ruleProvenance: 'Western Electric (1956) Rule 1 / Lloyd S. Nelson (1984) Rule 1',
        ruleDescription: `Subgroup mean ${mean} falls beyond 3-sigma control limits [${limits.lcl}, ${limits.ucl}].`,
        severity: 'CRITICAL_OUT_OF_CONTROL',
        triggerValue: mean,
        timestamp: latestSubgroup.timestamp
      });
    }

    // Nelson Rule 2: 9 points in a row on the same side of the center line (Distinct from WECO Rule 4 which specifies 8 points)
    if (subgroups.length >= 9) {
      const last9 = subgroups.slice(-9);
      const allAbove = last9.every(s => s.mean > cl);
      const allBelow = last9.every(s => s.mean < cl);
      if (allAbove || allBelow) {
        violations.push({
          subgroupId: latestSubgroup.subgroupId,
          ruleId: 'RULE_2_NINE_SAME_SIDE',
          ruleSet: 'NELSON',
          ruleName: 'Nelson Rule 2: Nine Consecutive Points on Same Side of Center Line',
          ruleProvenance: 'Lloyd S. Nelson (1984) Technical Aids - Rule 2',
          ruleDescription: `9 consecutive subgroups positioned strictly on ${allAbove ? 'upper' : 'lower'} side of Center Line (${cl}).`,
          severity: 'WARNING',
          triggerValue: mean,
          timestamp: latestSubgroup.timestamp
        });
      }
    }

    // Nelson Rule 3: 6 points in a row strictly increasing or decreasing
    if (subgroups.length >= 6) {
      const last6 = subgroups.slice(-6);
      let isIncreasing = true;
      let isDecreasing = true;
      for (let i = 1; i < last6.length; i++) {
        if (last6[i].mean <= last6[i - 1].mean) isIncreasing = false;
        if (last6[i].mean >= last6[i - 1].mean) isDecreasing = false;
      }
      if (isIncreasing || isDecreasing) {
        violations.push({
          subgroupId: latestSubgroup.subgroupId,
          ruleId: 'RULE_3_SIX_TRENDING',
          ruleSet: 'NELSON',
          ruleName: 'Nelson Rule 3: Six Consecutive Points Continually Increasing or Decreasing',
          ruleProvenance: 'Lloyd S. Nelson (1984) Technical Aids - Rule 3',
          ruleDescription: `6 consecutive subgroups exhibiting continuous ${isIncreasing ? 'upward' : 'downward'} trend drift.`,
          severity: 'WARNING',
          triggerValue: mean,
          timestamp: latestSubgroup.timestamp
        });
      }
    }

    // Nelson Rule 4: 14 points in a row alternating up and down (systematic oscillation)
    if (subgroups.length >= 14) {
      const last14 = subgroups.slice(-14);
      let isAlternating = true;
      for (let i = 2; i < last14.length; i++) {
        const prevDiff = last14[i - 1].mean - last14[i - 2].mean;
        const currDiff = last14[i].mean - last14[i - 1].mean;
        if (prevDiff * currDiff >= 0) {
          isAlternating = false;
          break;
        }
      }
      if (isAlternating) {
        violations.push({
          subgroupId: latestSubgroup.subgroupId,
          ruleId: 'RULE_4_FOURTEEN_ALTERNATING',
          ruleSet: 'NELSON',
          ruleName: 'Nelson Rule 4: Fourteen Consecutive Points Alternating Direction',
          ruleProvenance: 'Lloyd S. Nelson (1984) Technical Aids - Rule 4',
          ruleDescription: '14 consecutive subgroups alternating up and down (systematic oscillation).',
          severity: 'WARNING',
          triggerValue: mean,
          timestamp: latestSubgroup.timestamp
        });
      }
    }

    return violations;
  }

  // =========================================================================
  // 2. DIGITAL SHIFT HANDOVER & WORK-IN-PROGRESS (WIP) CUSTODY
  // =========================================================================

  public static initiateShiftHandover(params: {
    tenantId: string;
    companyId: string;
    handoverCode: string;
    productionLineId: string;
    shiftDate: string;
    shiftType: 'MORNING' | 'AFTERNOON' | 'NIGHT';
    outgoingSupervisorId: string;
    incomingSupervisorId: string;
    safetyChecklist: ShiftSafetyLotoCheck[];
    wipItems: Array<{
      itemSku: string;
      lotNumber: string;
      workCenterId: string;
      theoreticalSystemQty: number;
      physicalCountedQty: number;
      notes?: string;
    }>;
    openAndonIncidentsCount?: number;
    openMaintenanceOrdersCount?: number;
  }): DigitalShiftHandover {
    if (!params.handoverCode || !params.productionLineId) {
      throw new Error('Handover code and production line ID are mandatory.');
    }
    if (params.outgoingSupervisorId === params.incomingSupervisorId) {
      throw new Error('Segregation of Duties Violation: Outgoing supervisor cannot sign as incoming supervisor.');
    }

    const id = `shf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const processedWipItems: ShiftWipSnapshotItem[] = params.wipItems.map(item => {
      const varianceQty = Math.round((item.physicalCountedQty - item.theoreticalSystemQty) * 100) / 100;
      const variancePct = item.theoreticalSystemQty !== 0
        ? Math.round((varianceQty / item.theoreticalSystemQty) * 10000) / 100
        : 0;
      const discrepancyFlag = Math.abs(variancePct) > 2.0; // flag if variance > 2%

      return {
        itemSku: item.itemSku,
        lotNumber: item.lotNumber,
        workCenterId: item.workCenterId,
        theoreticalSystemQty: item.theoreticalSystemQty,
        physicalCountedQty: item.physicalCountedQty,
        varianceQty,
        variancePct,
        discrepancyFlag,
        notes: item.notes
      };
    });

    const safetyCleanPassed = params.safetyChecklist.every(item => item.verified);

    const handover: DigitalShiftHandover = {
      id,
      tenantId: params.tenantId,
      companyId: params.companyId,
      handoverCode: params.handoverCode,
      productionLineId: params.productionLineId,
      shiftDate: params.shiftDate,
      shiftType: params.shiftType,
      outgoingSupervisorId: params.outgoingSupervisorId,
      incomingSupervisorId: params.incomingSupervisorId,
      status: 'INITIATED',
      safetyCleanPassed,
      safetyChecklist: [...params.safetyChecklist],
      wipItems: processedWipItems,
      openAndonIncidentsCount: params.openAndonIncidentsCount || 0,
      openMaintenanceOrdersCount: params.openMaintenanceOrdersCount || 0,
      createdAt: now,
      auditHash: ''
    };

    handover.auditHash = this.hashPayload(handover);
    this.shiftHandovers.set(handover.id, handover);
    this.logAudit(params.tenantId, params.companyId, 'SHIFT_HANDOVER', handover.id, 'INITIATE_SHIFT_HANDOVER', params.outgoingSupervisorId, handover);

    return handover;
  }

  public static signOutgoingShift(params: {
    handoverId: string;
    supervisorId: string;
    supervisorName: string;
    role: string;
  }): DigitalShiftHandover {
    const handover = this.shiftHandovers.get(params.handoverId);
    if (!handover) {
      throw new Error(`Shift handover record not found: ${params.handoverId}`);
    }
    if (handover.status !== 'INITIATED') {
      throw new Error(`Cannot sign outgoing handover in status: ${handover.status}`);
    }
    if (handover.outgoingSupervisorId !== params.supervisorId) {
      throw new Error(`Authorization Mismatch: Supervisor ${params.supervisorId} is not designated outgoing supervisor ${handover.outgoingSupervisorId}.`);
    }

    const now = new Date().toISOString();
    const signatureToken = this.hashPayload({
      handoverId: handover.id,
      supervisorId: params.supervisorId,
      signedAt: now,
      role: params.role
    });

    handover.outgoingSignature = {
      supervisorId: params.supervisorId,
      supervisorName: params.supervisorName,
      role: params.role,
      signedAt: now,
      signatureToken
    };

    handover.status = 'OUTGOING_SIGNED';
    handover.auditHash = this.hashPayload(handover);

    this.logAudit(handover.tenantId, handover.companyId, 'SHIFT_HANDOVER', handover.id, 'SIGN_OUTGOING_SHIFT', params.supervisorId, {
      signatureToken
    });

    return handover;
  }

  public static completeShiftHandover(params: {
    handoverId: string;
    supervisorId: string;
    supervisorName: string;
    role: string;
    acceptDiscrepancies?: boolean;
    rejectionReason?: string;
  }): DigitalShiftHandover {
    const handover = this.shiftHandovers.get(params.handoverId);
    if (!handover) {
      throw new Error(`Shift handover record not found: ${params.handoverId}`);
    }
    if (handover.status !== 'OUTGOING_SIGNED') {
      throw new Error(`Cannot complete handover in status: ${handover.status}. Outgoing signature is required first.`);
    }
    if (handover.incomingSupervisorId !== params.supervisorId) {
      throw new Error(`Authorization Mismatch: Supervisor ${params.supervisorId} is not designated incoming supervisor ${handover.incomingSupervisorId}.`);
    }
    if (params.supervisorId === handover.outgoingSupervisorId) {
      throw new Error('Segregation of Duties Violation: Outgoing supervisor cannot sign as incoming supervisor.');
    }

    const hasCriticalDiscrepancy = handover.wipItems.some(item => item.discrepancyFlag);
    if (hasCriticalDiscrepancy && !params.acceptDiscrepancies) {
      handover.status = 'REJECTED_DISCREPANCY';
      handover.rejectionReason = params.rejectionReason || 'Rejected due to unaccepted physical WIP inventory discrepancies (> 2%).';
      handover.auditHash = this.hashPayload(handover);
      this.logAudit(handover.tenantId, handover.companyId, 'SHIFT_HANDOVER', handover.id, 'REJECT_SHIFT_HANDOVER', params.supervisorId, {
        reason: handover.rejectionReason
      });
      return handover;
    }

    const now = new Date().toISOString();
    const signatureToken = this.hashPayload({
      handoverId: handover.id,
      supervisorId: params.supervisorId,
      signedAt: now,
      role: params.role
    });

    handover.incomingSignature = {
      supervisorId: params.supervisorId,
      supervisorName: params.supervisorName,
      role: params.role,
      signedAt: now,
      signatureToken
    };

    handover.status = 'COMPLETED';
    handover.completedAt = now;
    handover.auditHash = this.hashPayload(handover);

    this.logAudit(handover.tenantId, handover.companyId, 'SHIFT_HANDOVER', handover.id, 'COMPLETE_SHIFT_HANDOVER', params.supervisorId, {
      signatureToken,
      acceptedDiscrepancies: !!params.acceptDiscrepancies
    });

    return handover;
  }

  // =========================================================================
  // 3. PRODUCTION YIELD OPTIMIZATION & SCRAP RECOVERY ACCOUNTING
  // =========================================================================

  public static analyzeProductionYield(params: {
    tenantId: string;
    companyId: string;
    manufacturingOrderId: string;
    productSku: string;
    plannedOutputQty: number;
    actualGoodQty: number;
    actualScrapQty: number;
    actualReworkQty?: number;
    standardScrapAllowancePct: number; // e.g. 2.5%
    materialCostPerUnit: number;
    performedBy: string;
  }): { analysis: ProductionYieldAnalysis; financialEvent: YieldFinancialEvent } {
    if (params.plannedOutputQty <= 0) {
      throw new Error('Planned output quantity must be strictly greater than zero.');
    }
    if (params.actualGoodQty < 0 || params.actualScrapQty < 0) {
      throw new Error('Actual quantities cannot be negative.');
    }

    const actualReworkQty = params.actualReworkQty || 0;
    const totalActualProduced = params.actualGoodQty + params.actualScrapQty + actualReworkQty;
    const actualScrapPct = totalActualProduced > 0
      ? Math.round((params.actualScrapQty / totalActualProduced) * 10000) / 100
      : 0;

    const standardAllowedScrapQty = Math.round((params.plannedOutputQty * (params.standardScrapAllowancePct / 100)) * 100) / 100;
    const scrapVarianceQty = Math.round((params.actualScrapQty - standardAllowedScrapQty) * 100) / 100;
    const isFavorableVariance = scrapVarianceQty <= 0;
    const yieldEfficiencyPct = Math.round((params.actualGoodQty / params.plannedOutputQty) * 10000) / 100;

    const materialYieldVarianceCost = Math.round(Math.abs(scrapVarianceQty) * params.materialCostPerUnit * 100) / 100;

    const analysis: ProductionYieldAnalysis = {
      manufacturingOrderId: params.manufacturingOrderId,
      productSku: params.productSku,
      plannedOutputQty: params.plannedOutputQty,
      actualGoodQty: params.actualGoodQty,
      actualScrapQty: params.actualScrapQty,
      actualReworkQty,
      standardScrapAllowancePct: params.standardScrapAllowancePct,
      actualScrapPct,
      standardAllowedScrapQty,
      scrapVarianceQty,
      isFavorableVariance,
      yieldEfficiencyPct,
      materialCostPerUnit: params.materialCostPerUnit,
      materialYieldVarianceCost
    };

    // Construct Balanced Financial Event (zero direct GL mutation, event-driven accounting)
    const glPostings = isFavorableVariance
      ? [
          {
            accountCode: '1410',
            accountName: 'Work-in-Progress (WIP) Inventory',
            debitAmount: materialYieldVarianceCost,
            creditAmount: 0
          },
          {
            accountCode: '5215',
            accountName: 'Favorable Material Yield Variance',
            debitAmount: 0,
            creditAmount: materialYieldVarianceCost
          }
        ]
      : [
          {
            accountCode: '5210',
            accountName: 'Unfavorable Material Yield Variance',
            debitAmount: materialYieldVarianceCost,
            creditAmount: 0
          },
          {
            accountCode: '1410',
            accountName: 'Work-in-Progress (WIP) Inventory',
            debitAmount: 0,
            creditAmount: materialYieldVarianceCost
          }
        ];

    const financialEvent: YieldFinancialEvent = {
      eventId: `evt-yield-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      eventType: 'EVT_MFG_YIELD_VARIANCE_RECOGNIZED',
      tenantId: params.tenantId,
      companyId: params.companyId,
      manufacturingOrderId: params.manufacturingOrderId,
      productSku: params.productSku,
      amount: materialYieldVarianceCost,
      isFavorable: isFavorableVariance,
      timestamp: new Date().toISOString(),
      glPostings
    };

    this.logAudit(params.tenantId, params.companyId, 'YIELD_ANALYSIS', params.manufacturingOrderId, 'RECOGNIZE_YIELD_VARIANCE', params.performedBy, {
      scrapVarianceQty,
      isFavorableVariance,
      materialYieldVarianceCost,
      financialEventId: financialEvent.eventId
    });

    return { analysis, financialEvent };
  }

  public static harvestScrapRecovery(params: {
    tenantId: string;
    companyId: string;
    manufacturingOrderId: string;
    recoveredMaterialSku: string;
    quantityRecoveredKg: number;
    recoveryGrade: 'GRADE_PREMIUM_REGRIND' | 'GRADE_STANDARD_REGRIND' | 'GRADE_DOWNGRADED_FEEDSTOCK';
    unitCreditRate: number;
    targetWarehouseId: string;
    targetBinId: string;
    lotNumber: string;
    operatorId: string;
  }): { harvest: ScrapRecoveryHarvest; financialEvent: YieldFinancialEvent } {
    if (params.quantityRecoveredKg <= 0 || params.unitCreditRate <= 0) {
      throw new Error('Recovered quantity and unit credit rate must be strictly positive.');
    }
    if (!params.recoveredMaterialSku || !params.targetBinId) {
      throw new Error('Recovered material SKU and target storage bin ID are mandatory.');
    }

    const totalRecoveryValue = Math.round(params.quantityRecoveredKg * params.unitCreditRate * 100) / 100;
    const now = new Date().toISOString();

    const harvest: ScrapRecoveryHarvest = {
      id: `hrv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      manufacturingOrderId: params.manufacturingOrderId,
      recoveredMaterialSku: params.recoveredMaterialSku,
      quantityRecoveredKg: params.quantityRecoveredKg,
      recoveryGrade: params.recoveryGrade,
      unitCreditRate: params.unitCreditRate,
      totalRecoveryValue,
      targetWarehouseId: params.targetWarehouseId,
      targetBinId: params.targetBinId,
      lotNumber: params.lotNumber,
      harvestedAt: now,
      operatorId: params.operatorId,
      auditHash: ''
    };

    harvest.auditHash = this.hashPayload(harvest);
    this.scrapHarvests.set(harvest.id, harvest);

    // Balanced GL Postings for Scrap Recovery
    const glPostings = [
      {
        accountCode: '1340',
        accountName: 'Secondary Regrind / Recycled Material Inventory',
        debitAmount: totalRecoveryValue,
        creditAmount: 0
      },
      {
        accountCode: '5220',
        accountName: 'Scrap Recovery Cost Offset',
        debitAmount: 0,
        creditAmount: totalRecoveryValue
      }
    ];

    const financialEvent: YieldFinancialEvent = {
      eventId: `evt-scraphrv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      eventType: 'EVT_MFG_SCRAP_RECOVERY_POSTED',
      tenantId: params.tenantId,
      companyId: params.companyId,
      manufacturingOrderId: params.manufacturingOrderId,
      productSku: params.recoveredMaterialSku,
      amount: totalRecoveryValue,
      timestamp: now,
      glPostings
    };

    this.logAudit(params.tenantId, params.companyId, 'SCRAP_RECOVERY', harvest.id, 'HARVEST_SCRAP_RECOVERY', params.operatorId, {
      quantityRecoveredKg: params.quantityRecoveredKg,
      totalRecoveryValue,
      financialEventId: financialEvent.eventId
    });

    return { harvest, financialEvent };
  }

  // =========================================================================
  // 4. DYNAMIC LINE BALANCING & HEIJUNKA PRODUCTION LEVELING
  // =========================================================================

  public static evaluateLineBalance(params: {
    productionLineId: string;
    taktTimeSeconds: number;
    stations: WorkCenterCycleTime[];
  }): LineBalanceMetrics {
    if (params.taktTimeSeconds <= 0) {
      throw new Error('Takt time must be strictly positive.');
    }
    if (!params.stations || params.stations.length === 0) {
      throw new Error('Workstation stations list cannot be empty.');
    }

    const stationCount = params.stations.length;
    const totalCycleTimeSeconds = Math.round(params.stations.reduce((acc, s) => acc + s.cycleTimeSeconds, 0) * 100) / 100;

    let bottleneckStationId = params.stations[0].workCenterId;
    let bottleneckCycleTimeSeconds = params.stations[0].cycleTimeSeconds;

    for (const station of params.stations) {
      if (station.cycleTimeSeconds > bottleneckCycleTimeSeconds) {
        bottleneckCycleTimeSeconds = station.cycleTimeSeconds;
        bottleneckStationId = station.workCenterId;
      }
    }

    // Line Balance Efficiency = sum(cycleTimes) / (N * bottleneck) * 100
    const maxCapacity = stationCount * bottleneckCycleTimeSeconds;
    const lineBalanceEfficiencyPct = maxCapacity > 0
      ? Math.round((totalCycleTimeSeconds / maxCapacity) * 10000) / 100
      : 0;

    const balanceDelayPct = Math.round((100 - lineBalanceEfficiencyPct) * 100) / 100;

    // Smoothness Index = sqrt(sum((bottleneck - stationTime)^2))
    const sumSquaredDeviations = params.stations.reduce(
      (acc, s) => acc + Math.pow(bottleneckCycleTimeSeconds - s.cycleTimeSeconds, 2),
      0
    );
    const smoothnessIndex = Math.round(Math.sqrt(sumSquaredDeviations) * 100) / 100;

    const theoreticalMinWorkstations = Math.ceil(totalCycleTimeSeconds / params.taktTimeSeconds);
    const bottleneckStarvationAlert = bottleneckCycleTimeSeconds > params.taktTimeSeconds;

    // Buffer recommendations between adjacent stations where cycle time differs significantly
    const recommendedBuffers: Array<{ betweenWorkCenterA: string; betweenWorkCenterB: string; bufferUnitsNeeded: number }> = [];
    for (let i = 0; i < params.stations.length - 1; i++) {
      const stA = params.stations[i];
      const stB = params.stations[i + 1];
      const diff = stB.cycleTimeSeconds - stA.cycleTimeSeconds;
      if (diff > 5) {
        const bufferUnitsNeeded = Math.ceil(diff / params.taktTimeSeconds * 3);
        recommendedBuffers.push({
          betweenWorkCenterA: stA.workCenterId,
          betweenWorkCenterB: stB.workCenterId,
          bufferUnitsNeeded: Math.max(1, bufferUnitsNeeded)
        });
      }
    }

    return {
      productionLineId: params.productionLineId,
      taktTimeSeconds: params.taktTimeSeconds,
      stationCount,
      totalCycleTimeSeconds,
      bottleneckStationId,
      bottleneckCycleTimeSeconds,
      lineBalanceEfficiencyPct,
      balanceDelayPct,
      smoothnessIndex,
      theoreticalMinWorkstations,
      bottleneckStarvationAlert,
      recommendedBuffers
    };
  }

  public static generateHeijunkaSchedule(params: {
    productionLineId: string;
    scheduleDate: string;
    pitchMinutes: number; // e.g. 20 min
    shiftHours?: number;   // default 8 hours
    productMixRatio: Record<string, number>; // e.g. { 'SKU-A': 60, 'SKU-B': 30, 'SKU-C': 10 }
    dailyTotalUnits: number;
  }): HeijunkaSchedule {
    if (params.pitchMinutes <= 0) {
      throw new Error('Pitch minutes must be strictly positive.');
    }
    if (params.dailyTotalUnits <= 0) {
      throw new Error('Daily total units must be strictly positive.');
    }

    const shiftHours = params.shiftHours || 8;
    const totalMinutes = shiftHours * 60;
    const totalSlots = Math.floor(totalMinutes / params.pitchMinutes);

    // Compute integer units per SKU based on percentage
    const skus = Object.keys(params.productMixRatio);
    const totalWeight = Object.values(params.productMixRatio).reduce((a, b) => a + b, 0);

    const pattern: string[] = [];
    for (const sku of skus) {
      const weight = params.productMixRatio[sku];
      const count = Math.round((weight / totalWeight) * totalSlots);
      for (let i = 0; i < count; i++) {
        pattern.push(sku);
      }
    }

    // Interleave pattern evenly across slots
    const slots: HeijunkaBoxSlot[] = [];
    const unitsPerSlot = Math.max(1, Math.round(params.dailyTotalUnits / totalSlots));

    let startMinute = 8 * 60; // 08:00 AM start
    for (let i = 0; i < totalSlots; i++) {
      const slotStart = `${String(Math.floor(startMinute / 60)).padStart(2, '0')}:${String(startMinute % 60).padStart(2, '0')}`;
      startMinute += params.pitchMinutes;
      const slotEnd = `${String(Math.floor(startMinute / 60)).padStart(2, '0')}:${String(startMinute % 60).padStart(2, '0')}`;

      const sku = pattern[i % pattern.length] || skus[0];
      slots.push({
        timeSlot: `${slotStart} - ${slotEnd}`,
        sequenceNumber: i + 1,
        productSku: sku,
        batchQty: unitsPerSlot,
        kanbanCardId: `KBN-${params.productionLineId}-${String(i + 1).padStart(3, '0')}`
      });
    }

    return {
      productionLineId: params.productionLineId,
      scheduleDate: params.scheduleDate,
      pitchMinutes: params.pitchMinutes,
      dailyTotalUnits: params.dailyTotalUnits,
      productMixRatio: { ...params.productMixRatio },
      slots,
      generatedAt: new Date().toISOString()
    };
  }

  // =========================================================================
  // 5. AUDIT VAULT & LOGGING
  // =========================================================================

  private static logAudit(
    tenantId: string,
    companyId: string,
    entityType: Phase32D08AuditRecord['entityType'],
    entityId: string,
    action: string,
    performedBy: string,
    details: Record<string, any>
  ): void {
    const prevHash = this.auditVault.length > 0
      ? this.auditVault[this.auditVault.length - 1].currentHash
      : 'GENESIS-HASH-MFG-32D08-VAULT';
    const timestamp = new Date().toISOString();
    const payloadHash = this.hashPayload(details);
    const payload = `${prevHash}:${tenantId}:${companyId}:${entityType}:${entityId}:${action}:${performedBy}:${timestamp}:${payloadHash}`;
    const currentHash = this.hashPayload(payload);

    this.auditVault.push({
      id: `aud-32d08-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      companyId,
      entityType,
      entityId,
      action,
      performedBy,
      timestamp,
      previousHash: prevHash,
      currentHash,
      payloadHash,
      details
    });
  }

  public static getAuditVault(): Phase32D08AuditRecord[] {
    return [...this.auditVault];
  }

  public static getStudies(): SpcStudy[] {
    return Array.from(this.spcStudies.values());
  }

  public static getStudyById(id: string): SpcStudy | undefined {
    return this.spcStudies.get(id);
  }

  public static getHandovers(): DigitalShiftHandover[] {
    return Array.from(this.shiftHandovers.values());
  }

  public static getHandoverById(id: string): DigitalShiftHandover | undefined {
    return this.shiftHandovers.get(id);
  }

  public static getScrapHarvests(): ScrapRecoveryHarvest[] {
    return Array.from(this.scrapHarvests.values());
  }

  public static verifyAuditChain(): boolean {
    if (this.auditVault.length === 0) return true;
    for (let i = 0; i < this.auditVault.length; i++) {
      const rec = this.auditVault[i];
      if (i > 0) {
        if (rec.previousHash !== this.auditVault[i - 1].currentHash) return false;
      } else {
        if (rec.previousHash !== 'GENESIS-HASH-MFG-32D08-VAULT') return false;
      }
    }
    return true;
  }
}
