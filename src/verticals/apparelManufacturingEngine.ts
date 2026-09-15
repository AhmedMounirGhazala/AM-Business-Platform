/**
 * AM Business Platform — P0-06 Apparel Manufacturing Engine
 * Runtime service for Profiles 06, 07 & 08:
 * - Profile 06: Manufacturing — Women's Apparel
 * - Profile 07: Manufacturing — Men's Apparel (Tailoring, Fit & Shrinkage)
 * - Profile 08: Manufacturing — Children's Apparel (Safety QA & Pull Tests)
 *
 * Implements Fabric Yield & Marker Planning, Cut Orders, Bundle Tickets,
 * Piece-Rate Labor, Apparel QC Checkpoints, and Production Cost Rollup.
 */

import {
  FabricYieldMarkerPlan,
  ApparelCutOrder,
  ApparelBundleTicket,
  MensTailoringSpec,
  ChildrenSafetyQACheckpoint,
  ApparelProductionCostSummary
} from './types';

export class ApparelManufacturingEngine {
  /**
   * Creates a Fabric Marker & Yield Plan
   */
  public static createMarkerPlan(params: {
    markerCode: string;
    styleCode: string;
    fabricWidthCm: number;
    patternPiecesCount: number;
    markerLengthMeters: number;
    totalPatternAreaSquareMeters: number;
    shrinkageAllowancePercentage?: number;
  }): FabricYieldMarkerPlan {
    const totalFabricAreaSquareMeters = (params.fabricWidthCm / 100) * params.markerLengthMeters;
    let fabricYieldPercentage = totalFabricAreaSquareMeters > 0
      ? (params.totalPatternAreaSquareMeters / totalFabricAreaSquareMeters) * 100
      : 85;

    // Apply shrinkage compensation if specified (e.g. for men's wool/cotton)
    if (params.shrinkageAllowancePercentage && params.shrinkageAllowancePercentage > 0) {
      fabricYieldPercentage = fabricYieldPercentage * (1 - params.shrinkageAllowancePercentage / 100);
    }

    fabricYieldPercentage = Math.min(98, Math.max(50, Math.round(fabricYieldPercentage * 10) / 10));
    const wastePercentage = Math.round((100 - fabricYieldPercentage) * 10) / 10;
    const fabricRequiredPerGarmentMeters = Math.round((params.markerLengthMeters / 4) * 100) / 100; // Assume 4-garment marker

    return {
      id: `MRK-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      markerCode: params.markerCode,
      styleCode: params.styleCode,
      fabricWidthCm: params.fabricWidthCm,
      patternPiecesCount: params.patternPiecesCount,
      markerLengthMeters: params.markerLengthMeters,
      fabricYieldPercentage,
      wastePercentage,
      fabricRequiredPerGarmentMeters,
      shrinkageAllowancePercentage: params.shrinkageAllowancePercentage
    };
  }

  /**
   * Generates a Cut Order from production work order and marker plan
   */
  public static createCutOrder(params: {
    tenantId: string;
    companyId: string;
    styleCode: string;
    styleName: string;
    category: 'WOMENS_APPAREL' | 'MENS_APPAREL' | 'CHILDRENS_APPAREL';
    season: string;
    productionWorkOrderId: string;
    markerPlanId: string;
    cuttingTableNumber: string;
    cutterStaffName: string;
    fabricRolls: { rollId: string; fabricLotNumber: string; metersConsumed: number; costPerMeter: number }[];
    sizeBreakdown: { size: string; plannedQuantity: number }[];
  }): ApparelCutOrder {
    const totalCutQuantity = params.sizeBreakdown.reduce((sum, s) => sum + s.plannedQuantity, 0);

    return {
      id: `CUT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      cutOrderNumber: `CUT-${Date.now().toString().slice(-6)}`,
      styleCode: params.styleCode,
      styleName: params.styleName,
      category: params.category,
      season: params.season,
      productionWorkOrderId: params.productionWorkOrderId,
      fabricRollsUsed: params.fabricRolls,
      sizeBreakdown: params.sizeBreakdown.map(s => ({
        size: s.size,
        plannedQuantity: s.plannedQuantity,
        actualCutQuantity: s.plannedQuantity // initially matches planned
      })),
      totalCutQuantity,
      markerPlanId: params.markerPlanId,
      cuttingTableNumber: params.cuttingTableNumber,
      cutDate: new Date().toISOString().split('T')[0],
      cutterStaffName: params.cutterStaffName,
      status: 'IN_CUTTING'
    };
  }

  /**
   * Generates Bundle Tickets from an executed Cut Order (e.g. 20 pieces per bundle)
   */
  public static generateBundleTickets(
    cutOrder: ApparelCutOrder,
    bundleSize: number = 20,
    colorName: string = 'Standard Color'
  ): ApparelBundleTicket[] {
    const tickets: ApparelBundleTicket[] = [];
    let bundleSeq = 1;

    cutOrder.sizeBreakdown.forEach(sz => {
      let remaining = sz.actualCutQuantity;
      while (remaining > 0) {
        const qtyInBundle = Math.min(bundleSize, remaining);
        tickets.push({
          id: `BND-${Date.now()}-${bundleSeq}`,
          cutOrderId: cutOrder.id,
          bundleNumber: `${cutOrder.cutOrderNumber}-B${bundleSeq.toString().padStart(3, '0')}`,
          styleCode: cutOrder.styleCode,
          colorName,
          size: sz.size,
          quantity: qtyInBundle,
          currentOperation: 'CUTTING',
          operationHistory: [],
          status: 'OPEN'
        });
        remaining -= qtyInBundle;
        bundleSeq++;
      }
    });

    cutOrder.status = 'BUNDLED';
    return tickets;
  }

  /**
   * Records piece-rate labor completion for a bundle operation
   */
  public static recordBundleOperation(
    bundle: ApparelBundleTicket,
    operation: 'FUSING' | 'COLLAR_PREP' | 'SLEEVE_ATTACH' | 'MAIN_SEWING' | 'BUTTONHOLE' | 'PRESSING' | 'QC_INSPECTION' | 'PACKAGING',
    operatorId: string,
    operatorName: string,
    pieceRatePerUnit: number
  ): ApparelBundleTicket {
    const earned = Math.round(bundle.quantity * pieceRatePerUnit * 100) / 100;

    bundle.operationHistory.push({
      operation,
      operatorId,
      operatorName,
      completedQuantity: bundle.quantity,
      pieceRateEarned: earned,
      timestamp: new Date().toISOString()
    });

    bundle.currentOperation = operation;
    if (operation === 'PACKAGING') {
      bundle.status = 'COMPLETED';
    } else {
      bundle.status = 'IN_PROGRESS';
    }

    return bundle;
  }

  /**
   * Evaluates Children's Wear Safety QA checkpoints (Profile 08)
   */
  public static evaluateChildrenSafetyQA(params: {
    cutOrderId: string;
    styleCode: string;
    ageGroup: string;
    inspectorName: string;
    pullTestNewtonsApplied: number; // Must be >= 70 N
    snapsTestPassed: boolean;
    chokingHazardPartsAbsent: boolean;
    needleDetectorScanClean: boolean;
    drawstringsCompliant: boolean;
    nonToxicDyeCertVerified: boolean;
  }): ChildrenSafetyQACheckpoint {
    const pullTestPassed = params.pullTestNewtonsApplied >= 70;
    const overallPassed =
      pullTestPassed &&
      params.snapsTestPassed &&
      params.chokingHazardPartsAbsent &&
      params.needleDetectorScanClean &&
      params.drawstringsCompliant &&
      params.nonToxicDyeCertVerified;

    return {
      id: `SAFE-QA-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      cutOrderId: params.cutOrderId,
      styleCode: params.styleCode,
      ageGroup: params.ageGroup,
      checkDate: new Date().toISOString().split('T')[0],
      inspectorName: params.inspectorName,
      pullTestButtonsPassed: pullTestPassed,
      pullTestSnapsPassed: params.snapsTestPassed,
      chokingHazardPartsAbsent: params.chokingHazardPartsAbsent,
      sharpEdgesOrNeedlesAbsent: params.needleDetectorScanClean,
      drawstringsCompliancePassed: params.drawstringsCompliant,
      nonToxicDyeCertificationVerified: params.nonToxicDyeCertVerified,
      overallSafetyApproval: overallPassed ? 'PASSED' : 'FAILED_QUARANTINED',
      notes: overallPassed ? 'Meets all international child apparel safety requirements.' : 'FAILED SAFETY AUDIT. QUARANTINED.'
    };
  }

  /**
   * Configures Men's Tailoring Specifications with Shrinkage (Profile 07)
   */
  public static createMensTailoringSpec(params: {
    styleCode: string;
    fitType: 'SUPER_SLIM' | 'SLIM' | 'REGULAR' | 'TAILORED' | 'RELAXED';
    chestCm: number;
    waistCm: number;
    shoulderWidthCm: number;
    sleeveLengthCm: number;
    jacketLengthCm: number;
    trouserInseamCm: number;
    trouserWaistCm: number;
    canvasType: 'FULL_CANVAS' | 'HALF_CANVAS' | 'FUSED';
    interliningSpec?: string;
  }): MensTailoringSpec {
    return {
      styleCode: params.styleCode,
      fitType: params.fitType,
      measurements: {
        chestCm: params.chestCm,
        waistCm: params.waistCm,
        shoulderWidthCm: params.shoulderWidthCm,
        sleeveLengthCm: params.sleeveLengthCm,
        jacketLengthCm: params.jacketLengthCm,
        trouserInseamCm: params.trouserInseamCm,
        trouserWaistCm: params.trouserWaistCm
      },
      canvasType: params.canvasType,
      interliningSpec: params.interliningSpec || 'Wool/Horsehair blend',
      trimDetails: ['Horn Buttons', 'Bemberg Cupro Lining', 'AMF Pick Stitching']
    };
  }

  /**
   * Performs complete Garment Costing Rollup
   */
  public static calculateGarmentCostRollup(params: {
    cutOrder: ApparelCutOrder;
    bundles: ApparelBundleTicket[];
    trimsCostPerGarment: number;
    factoryOverheadAllocationRatePerGarment: number;
    standardTargetCostPerUnit: number;
  }): ApparelProductionCostSummary {
    const totalFabricCost = params.cutOrder.fabricRollsUsed.reduce(
      (sum, r) => sum + r.metersConsumed * r.costPerMeter,
      0
    );

    const totalTrimCost = params.cutOrder.totalCutQuantity * params.trimsCostPerGarment;

    const totalPieceRateLabor = params.bundles.reduce(
      (sum, b) => sum + b.operationHistory.reduce((opSum, op) => opSum + op.pieceRateEarned, 0),
      0
    );

    const totalOverhead = params.cutOrder.totalCutQuantity * params.factoryOverheadAllocationRatePerGarment;

    const totalActualCost = totalFabricCost + totalTrimCost + totalPieceRateLabor + totalOverhead;
    const costPerUnit = params.cutOrder.totalCutQuantity > 0
      ? Math.round((totalActualCost / params.cutOrder.totalCutQuantity) * 100) / 100
      : 0;

    const costVarianceAmount = Math.round((costPerUnit - params.standardTargetCostPerUnit) * 100) / 100;
    const variancePercentage = params.standardTargetCostPerUnit > 0
      ? Math.round((costVarianceAmount / params.standardTargetCostPerUnit) * 1000) / 10
      : 0;

    return {
      styleCode: params.cutOrder.styleCode,
      cutOrderNumber: params.cutOrder.cutOrderNumber,
      totalUnitsProduced: params.cutOrder.totalCutQuantity,
      totalFabricCost: Math.round(totalFabricCost * 100) / 100,
      totalTrimAndAccessoryCost: Math.round(totalTrimCost * 100) / 100,
      totalPieceRateLabourCost: Math.round(totalPieceRateLabor * 100) / 100,
      allocatedFactoryOverhead: Math.round(totalOverhead * 100) / 100,
      totalActualCost: Math.round(totalActualCost * 100) / 100,
      costPerUnit,
      standardTargetCostPerUnit: params.standardTargetCostPerUnit,
      costVarianceAmount,
      variancePercentage
    };
  }
}
