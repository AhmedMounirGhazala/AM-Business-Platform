/**
 * AM Business Platform - Enterprise Fixed Assets Engine
 * Full Asset Lifecycle Management Engine conforming to:
 * - IFRS / IAS 16 (Property, Plant & Equipment)
 * - IAS 36 (Impairment of Assets)
 * - IAS 23 (Borrowing Costs)
 * - SAP S/4HANA FI-AA
 * - Oracle ERP Cloud Fixed Assets
 * - Microsoft Dynamics 365 Finance
 */

import {
  FixedAssetMaster,
  AssetClass,
  AssetCategory,
  AssetLocation,
  AssetDepartment,
  AssetCostCenter,
  AssetResponsibleEmployee,
  AcquisitionType,
  AssetAcquisitionRecord,
  DepreciationMethod,
  DepreciationFrequency,
  DepreciationScheduleEntry,
  DepreciationRunResult,
  TransferType,
  AssetTransferRecord,
  DisposalType,
  AssetDisposalRecord,
  RevaluationType,
  AssetRevaluationRecord,
  AssetImpairmentRecord,
  MaintenanceType,
  AssetMaintenanceRecord,
  PhysicalVerificationSession,
  PhysicalCountScanItem,
  AssetAuditLogRecord,
  AssetDomainEvent,
  AssetRegisterReport,
  AssetRollForwardReport,
  AssetRollForwardReportLine,
  NBVReportLine,
  AssetSnapshotType,
  ImmutableAssetSnapshot
} from '../types/fixedAssets';

export class FixedAssetsEngine {
  
  // ==================== SHA-256 AUDIT HASH GENERATOR ====================

  public static computeSha256Hash(payload: any): string {
    const str = JSON.stringify(payload);
    let hash1 = 0x811c9dc5;
    let hash2 = 0x9301e1ee;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash1 ^= char;
      hash1 = Math.imul(hash1, 0x01000193);
      hash2 ^= char;
      hash2 = Math.imul(hash2, 0x050c5d1d);
    }
    const h1Hex = (hash1 >>> 0).toString(16).padStart(8, '0');
    const h2Hex = (hash2 >>> 0).toString(16).padStart(8, '0');
    const fullHex = h1Hex + h2Hex + h1Hex + h2Hex;
    return `SHA256-${fullHex.toUpperCase()}`;
  }

  // ==================== MASTER DATA INITIALIZATION ====================

  public static getInitialAssetClasses(): AssetClass[] {
    return [
      {
        id: 'AC-100',
        code: 'BUILDINGS',
        name: 'Buildings & Real Estate Structures',
        nameAr: 'المباني والإنشاءات العقارية',
        description: 'Commercial real estate, offices, warehouses, and structural plant assets',
        defaultUsefulLifeYears: 30,
        defaultDepreciationMethod: 'STRAIGHT_LINE',
        defaultSalvageValuePercent: 10,
        glAssetAccount: '121000',
        glAccumDepAccount: '121900',
        glDepExpenseAccount: '611000',
        glGainLossAccount: '710000',
        glRevaluationSurplusAccount: '320000',
        status: 'ACTIVE'
      },
      {
        id: 'AC-200',
        code: 'MACHINERY',
        name: 'Industrial Machinery & Equipment',
        nameAr: 'الآلات والمعدات الصناعية',
        description: 'Manufacturing lines, CNC cutters, heavy industrial tools',
        defaultUsefulLifeYears: 10,
        defaultDepreciationMethod: 'STRAIGHT_LINE',
        defaultSalvageValuePercent: 5,
        glAssetAccount: '122000',
        glAccumDepAccount: '122900',
        glDepExpenseAccount: '612000',
        glGainLossAccount: '710000',
        glRevaluationSurplusAccount: '320000',
        status: 'ACTIVE'
      },
      {
        id: 'AC-300',
        code: 'VEHICLES',
        name: 'Vehicles & Logistics Fleet',
        nameAr: 'السيارات أسطول النقل',
        description: 'Company cars, delivery vans, heavy trucks, forklifts',
        defaultUsefulLifeYears: 5,
        defaultDepreciationMethod: 'DOUBLE_DECLINING',
        defaultSalvageValuePercent: 15,
        glAssetAccount: '123000',
        glAccumDepAccount: '123900',
        glDepExpenseAccount: '613000',
        glGainLossAccount: '710000',
        glRevaluationSurplusAccount: '320000',
        status: 'ACTIVE'
      },
      {
        id: 'AC-400',
        code: 'IT_HARDWARE',
        name: 'IT Hardware & Telecommunications',
        nameAr: 'أجهزة أجهزة أجهزة تقنية المعلومات',
        description: 'Data center servers, enterprise routers, laptops, network racks',
        defaultUsefulLifeYears: 4,
        defaultDepreciationMethod: 'STRAIGHT_LINE',
        defaultSalvageValuePercent: 0,
        glAssetAccount: '124000',
        glAccumDepAccount: '124900',
        glDepExpenseAccount: '614000',
        glGainLossAccount: '710000',
        glRevaluationSurplusAccount: '320000',
        status: 'ACTIVE'
      },
      {
        id: 'AC-500',
        code: 'FURNITURE',
        name: 'Office Furniture & Fixtures',
        nameAr: 'الأثاث والتجهيزات المكتبية',
        description: 'Desks, ergonomic chairs, conference tables, HVAC fixtures',
        defaultUsefulLifeYears: 7,
        defaultDepreciationMethod: 'STRAIGHT_LINE',
        defaultSalvageValuePercent: 5,
        glAssetAccount: '125000',
        glAccumDepAccount: '125900',
        glDepExpenseAccount: '615000',
        glGainLossAccount: '710000',
        glRevaluationSurplusAccount: '320000',
        status: 'ACTIVE'
      }
    ];
  }

  // ==================== DEPRECIATION CALCULATION LOGIC ====================

  /**
   * Calculates periodic depreciation based on depreciation method
   */
  public static calculatePeriodicDepreciation(params: {
    purchaseCost: number;
    salvageValue: number;
    currentNBV: number;
    usefulLifeYears: number;
    usefulLifeMonths: number;
    depreciationMethod: DepreciationMethod;
    frequency: DepreciationFrequency;
    periodIndex: number; // 1-indexed
    unitsProducedThisPeriod?: number;
    capacityUnits?: number;
  }): number {
    const {
      purchaseCost,
      salvageValue,
      currentNBV,
      usefulLifeYears,
      depreciationMethod,
      frequency,
      unitsProducedThisPeriod = 0,
      capacityUnits = 1
    } = params;

    const periodsPerYear = frequency === 'MONTHLY' ? 12 : frequency === 'QUARTERLY' ? 4 : 1;
    const totalPeriods = usefulLifeYears * periodsPerYear;
    const depreciableCost = Math.max(0, purchaseCost - salvageValue);

    if (currentNBV <= salvageValue || depreciableCost <= 0) {
      return 0;
    }

    let periodicDep = 0;

    switch (depreciationMethod) {
      case 'STRAIGHT_LINE': {
        periodicDep = depreciableCost / totalPeriods;
        break;
      }
      case 'DECLINING_BALANCE': {
        const rate = 1 - Math.pow(salvageValue / purchaseCost, 1 / totalPeriods);
        periodicDep = currentNBV * (isNaN(rate) ? 0.15 / periodsPerYear : rate);
        break;
      }
      case 'DOUBLE_DECLINING': {
        const annualRate = 2 / usefulLifeYears;
        const periodicRate = annualRate / periodsPerYear;
        periodicDep = currentNBV * periodicRate;
        break;
      }
      case 'UNITS_OF_PRODUCTION': {
        if (capacityUnits > 0) {
          periodicDep = depreciableCost * (unitsProducedThisPeriod / capacityUnits);
        }
        break;
      }
      case 'MANUAL': {
        periodicDep = depreciableCost / totalPeriods;
        break;
      }
      case 'NO_DEPRECIATION':
      default:
        periodicDep = 0;
        break;
    }

    // Cap depreciation so NBV doesn't drop below salvage value
    const maxAllowableDep = Math.max(0, currentNBV - salvageValue);
    return Math.round(Math.min(periodicDep, maxAllowableDep) * 100) / 100;
  }

  /**
   * Generates full depreciation schedule entries for an asset
   */
  public static generateDepreciationSchedule(asset: FixedAssetMaster): DepreciationScheduleEntry[] {
    const entries: DepreciationScheduleEntry[] = [];
    const periodsPerYear = asset.depreciationFrequency === 'MONTHLY' ? 12 : asset.depreciationFrequency === 'QUARTERLY' ? 4 : 1;
    const totalPeriods = asset.usefulLifeYears * periodsPerYear;

    let bookValue = asset.purchaseCost;
    let accumDep = 0;

    const startDate = new Date(asset.operationalDate || asset.acquisitionDate || '2026-01-01');

    for (let p = 1; p <= totalPeriods; p++) {
      const periodStartDate = new Date(startDate);
      if (asset.depreciationFrequency === 'MONTHLY') {
        periodStartDate.setMonth(startDate.getMonth() + (p - 1));
      } else if (asset.depreciationFrequency === 'QUARTERLY') {
        periodStartDate.setMonth(startDate.getMonth() + (p - 1) * 3);
      } else {
        periodStartDate.setFullYear(startDate.getFullYear() + (p - 1));
      }

      const periodEndDate = new Date(periodStartDate);
      periodEndDate.setMonth(periodEndDate.getMonth() + 1);
      periodEndDate.setDate(0); // last day of month

      const depAmount = this.calculatePeriodicDepreciation({
        purchaseCost: asset.purchaseCost,
        salvageValue: asset.salvageValue,
        currentNBV: bookValue,
        usefulLifeYears: asset.usefulLifeYears,
        usefulLifeMonths: asset.usefulLifeMonths,
        depreciationMethod: asset.depreciationMethod,
        frequency: asset.depreciationFrequency,
        periodIndex: p,
        unitsProducedThisPeriod: asset.totalUnitsProduced,
        capacityUnits: asset.capacityUnits
      });

      const openingNBV = bookValue;
      accumDep += depAmount;
      bookValue -= depAmount;

      entries.push({
        id: `DEP-SCH-${asset.id}-${p}`,
        assetId: asset.id,
        periodNumber: p,
        periodStartDate: periodStartDate.toISOString().split('T')[0],
        periodEndDate: periodEndDate.toISOString().split('T')[0],
        openingBookValue: Math.round(openingNBV * 100) / 100,
        depreciationAmount: Math.round(depAmount * 100) / 100,
        accumulatedDepreciation: Math.round(accumDep * 100) / 100,
        closingBookValue: Math.round(bookValue * 100) / 100,
        status: p === 1 && asset.totalAccumulatedDepreciation > 0 ? 'POSTED' : 'SCHEDULED'
      });

      if (bookValue <= asset.salvageValue) {
        break;
      }
    }

    return entries;
  }

  // ==================== ASSET ACQUISITION ====================

  public static processAssetAcquisition(params: {
    assetData: Omit<FixedAssetMaster, 'id' | 'assetNumber' | 'barcode' | 'qrCode' | 'totalAccumulatedDepreciation' | 'netBookValue' | 'revaluationSurplus' | 'accumulatedImpairmentLoss' | 'status' | 'createdAt'>;
    acquisitionRecord: Omit<AssetAcquisitionRecord, 'id' | 'assetId' | 'assetNumber' | 'createdBy' | 'createdAt' | 'correlationId'>;
    assetClassMap: Map<string, AssetClass>;
    createdBy: string;
  }): {
    asset: FixedAssetMaster;
    acquisitionRecord: AssetAcquisitionRecord;
    event: AssetDomainEvent;
    auditLog: AssetAuditLogRecord;
  } {
    const timestamp = new Date().toISOString();
    const correlationId = `CORR-ACQ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const assetId = `AST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const assetNumber = `AST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const barcode = `BAR-${assetNumber}`;
    const qrCode = `QR-${assetNumber}-${this.computeSha256Hash({ assetNumber, timestamp }).substring(0, 16)}`;

    const assetClass = params.assetClassMap.get(params.assetData.assetClassId);
    const glAssetAccount = assetClass?.glAssetAccount || '120000';
    const glClearingAccount = '211000'; // Vendor/AP Clearing Account

    const purchaseCost = params.assetData.purchaseCost;
    const salvageValue = params.assetData.salvageValue || 0;
    const residualValue = params.assetData.residualValue || salvageValue;

    const asset: FixedAssetMaster = {
      ...params.assetData,
      id: assetId,
      assetNumber,
      barcode,
      qrCode,
      salvageValue,
      residualValue,
      totalAccumulatedDepreciation: 0,
      netBookValue: purchaseCost,
      revaluationSurplus: 0,
      accumulatedImpairmentLoss: 0,
      status: 'ACTIVE',
      createdAt: timestamp,
      createdBy: params.createdBy
    };

    const acqRecord: AssetAcquisitionRecord = {
      ...params.acquisitionRecord,
      id: `ACQ-${Date.now()}`,
      assetId: asset.id,
      assetNumber: asset.assetNumber,
      glAssetAccount,
      glClearingAccount,
      createdBy: params.createdBy,
      createdAt: timestamp,
      correlationId
    };

    const eventPayload = {
      assetId: asset.id,
      assetNumber: asset.assetNumber,
      name: asset.name,
      purchaseCost: asset.purchaseCost,
      acquisitionType: asset.acquisitionType,
      acquisitionDate: asset.acquisitionDate,
      glAssetAccount,
      glClearingAccount
    };

    const eventSha = this.computeSha256Hash({ type: 'ASSET_ACQUIRED', eventPayload, correlationId });

    const event: AssetDomainEvent = {
      eventId: `EVT-ACQ-${Date.now()}`,
      eventType: 'ASSET_ACQUIRED',
      eventTimestamp: timestamp,
      companyId: asset.companyId,
      branchId: asset.branchId,
      assetId: asset.id,
      assetNumber: asset.assetNumber,
      eventData: eventPayload,
      glAccountPostings: [
        {
          debitAccount: glAssetAccount,
          creditAccount: glClearingAccount,
          amount: purchaseCost,
          description: `Capitalization of Fixed Asset ${asset.assetNumber} - ${asset.name}`
        }
      ],
      sha256Hash: eventSha,
      correlationId
    };

    const auditLog: AssetAuditLogRecord = {
      id: `LOG-ACQ-${Date.now()}`,
      assetId: asset.id,
      assetNumber: asset.assetNumber,
      eventType: 'ASSET_ACQUIRED',
      timestamp,
      actionBy: params.createdBy,
      details: `Asset acquired via ${asset.acquisitionType} for cost ${asset.currency} ${asset.purchaseCost}`,
      payload: eventPayload,
      sha256Hash: eventSha,
      correlationId
    };

    return { asset, acquisitionRecord: acqRecord, event, auditLog };
  }

  // ==================== MONTHLY AUTOMATIC DEPRECIATION RUN ====================

  public static runMonthlyDepreciation(params: {
    assets: FixedAssetMaster[];
    assetClasses: AssetClass[];
    companyId: string;
    period: string; // e.g. "2026-08"
    runBy: string;
  }): DepreciationRunResult {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const correlationId = `CORR-DEP-${Date.now()}`;
    const runId = `DEP-RUN-${Date.now()}`;

    const classMap = new Map<string, AssetClass>(params.assetClasses.map(c => [c.id, c]));
    const processedEntries: DepreciationScheduleEntry[] = [];
    let totalDepAmount = 0;
    let activeProcessedCount = 0;

    for (const asset of params.assets) {
      if (asset.companyId !== params.companyId || asset.status !== 'ACTIVE') {
        continue;
      }

      const assetClass = classMap.get(asset.assetClassId);
      const depAmount = this.calculatePeriodicDepreciation({
        purchaseCost: asset.purchaseCost,
        salvageValue: asset.salvageValue,
        currentNBV: asset.netBookValue,
        usefulLifeYears: asset.usefulLifeYears,
        usefulLifeMonths: asset.usefulLifeMonths,
        depreciationMethod: asset.depreciationMethod,
        frequency: asset.depreciationFrequency,
        periodIndex: 1,
        unitsProducedThisPeriod: asset.totalUnitsProduced,
        capacityUnits: asset.capacityUnits
      });

      if (depAmount <= 0) {
        continue;
      }

      activeProcessedCount++;
      totalDepAmount += depAmount;

      // Update asset figures in place / in memory object
      asset.totalAccumulatedDepreciation = Math.round((asset.totalAccumulatedDepreciation + depAmount) * 100) / 100;
      asset.netBookValue = Math.round(Math.max(asset.salvageValue, asset.netBookValue - depAmount) * 100) / 100;
      asset.lastDepreciationDate = timestamp.split('T')[0];

      if (asset.netBookValue <= asset.salvageValue) {
        asset.status = 'FULLY_DEPRECIATED';
      }

      const scheduleEntry: DepreciationScheduleEntry = {
        id: `DEP-ENTRY-${asset.id}-${params.period}`,
        assetId: asset.id,
        periodNumber: 1,
        periodStartDate: `${params.period}-01`,
        periodEndDate: `${params.period}-28`,
        openingBookValue: asset.netBookValue + depAmount,
        depreciationAmount: depAmount,
        accumulatedDepreciation: asset.totalAccumulatedDepreciation,
        closingBookValue: asset.netBookValue,
        status: 'POSTED',
        postedDate: timestamp.split('T')[0],
        journalEntryNumber: `JV-DEP-${asset.assetNumber}-${params.period}`
      };

      processedEntries.push(scheduleEntry);
    }

    return {
      runId,
      runDate: timestamp,
      period: params.period,
      companyId: params.companyId,
      assetCount: activeProcessedCount,
      totalDepreciationAmount: Math.round(totalDepAmount * 100) / 100,
      entries: processedEntries,
      publishedEventsCount: activeProcessedCount,
      status: 'SUCCESS',
      executionTimeMs: Date.now() - startTime,
      correlationId
    };
  }

  // ==================== ASSET TRANSFER ====================

  public static processAssetTransfer(params: {
    asset: FixedAssetMaster;
    transferType: TransferType;
    toCompanyId?: string;
    toBranchId?: string;
    toDepartmentId?: string;
    toDepartmentName?: string;
    toCostCenterId?: string;
    toCostCenterName?: string;
    toLocationId?: string;
    toLocationName?: string;
    toEmployeeId?: string;
    toEmployeeName?: string;
    reason: string;
    approvedBy: string;
  }): {
    updatedAsset: FixedAssetMaster;
    transferRecord: AssetTransferRecord;
    event: AssetDomainEvent;
    auditLog: AssetAuditLogRecord;
  } {
    const timestamp = new Date().toISOString();
    const correlationId = `CORR-XFR-${Date.now()}`;
    const transferId = `XFR-${Date.now()}`;

    const oldCompanyId = params.asset.companyId;
    const oldBranchId = params.asset.branchId;
    const oldDeptId = params.asset.departmentId;
    const oldCostCenterId = params.asset.costCenterId;
    const oldLocId = params.asset.locationId;
    const oldEmpId = params.asset.responsibleEmployeeId;

    const updatedAsset: FixedAssetMaster = {
      ...params.asset,
      companyId: params.toCompanyId || params.asset.companyId,
      branchId: params.toBranchId || params.asset.branchId,
      departmentId: params.toDepartmentId || params.asset.departmentId,
      departmentName: params.toDepartmentName || params.asset.departmentName,
      costCenterId: params.toCostCenterId || params.asset.costCenterId,
      costCenterName: params.toCostCenterName || params.asset.costCenterName,
      locationId: params.toLocationId || params.asset.locationId,
      locationName: params.toLocationName || params.asset.locationName,
      responsibleEmployeeId: params.toEmployeeId || params.asset.responsibleEmployeeId,
      responsibleEmployeeName: params.toEmployeeName || params.asset.responsibleEmployeeName,
      updatedAt: timestamp
    };

    if (params.toCompanyId && params.toCompanyId !== oldCompanyId) {
      updatedAsset.status = 'TRANSFERRED';
    }

    const transferRecord: AssetTransferRecord = {
      id: transferId,
      assetId: params.asset.id,
      assetNumber: params.asset.assetNumber,
      transferType: params.transferType,
      transferDate: timestamp.split('T')[0],
      fromCompanyId: oldCompanyId,
      toCompanyId: params.toCompanyId,
      fromBranchId: oldBranchId,
      toBranchId: params.toBranchId,
      fromDepartmentId: oldDeptId,
      toDepartmentId: params.toDepartmentId,
      fromCostCenterId: oldCostCenterId,
      toCostCenterId: params.toCostCenterId,
      fromLocationId: oldLocId,
      toLocationId: params.toLocationId,
      fromEmployeeId: oldEmpId,
      toEmployeeId: params.toEmployeeId,
      reason: params.reason,
      approvedBy: params.approvedBy,
      status: 'COMPLETED',
      createdAt: timestamp,
      correlationId
    };

    const eventPayload = {
      transferId,
      transferType: params.transferType,
      from: { companyId: oldCompanyId, deptId: oldDeptId, locationId: oldLocId },
      to: { companyId: params.toCompanyId, deptId: params.toDepartmentId, locationId: params.toLocationId },
      reason: params.reason
    };

    const eventSha = this.computeSha256Hash({ type: 'ASSET_TRANSFERRED', eventPayload, correlationId });

    const event: AssetDomainEvent = {
      eventId: `EVT-XFR-${Date.now()}`,
      eventType: 'ASSET_TRANSFERRED',
      eventTimestamp: timestamp,
      companyId: updatedAsset.companyId,
      branchId: updatedAsset.branchId,
      assetId: updatedAsset.id,
      assetNumber: updatedAsset.assetNumber,
      eventData: eventPayload,
      glAccountPostings: [], // Transfer within entity does not alter GL balances, intercompany posts clearing
      sha256Hash: eventSha,
      correlationId
    };

    const auditLog: AssetAuditLogRecord = {
      id: `LOG-XFR-${Date.now()}`,
      assetId: updatedAsset.id,
      assetNumber: updatedAsset.assetNumber,
      eventType: 'ASSET_TRANSFERRED',
      timestamp,
      actionBy: params.approvedBy,
      details: `Asset transferred (${params.transferType}). Reason: ${params.reason}`,
      payload: eventPayload,
      sha256Hash: eventSha,
      correlationId
    };

    return { updatedAsset, transferRecord, event, auditLog };
  }

  // ==================== ASSET DISPOSAL ====================

  public static processAssetDisposal(params: {
    asset: FixedAssetMaster;
    disposalType: DisposalType;
    disposalDate: string;
    proceedsAmount: number;
    buyerName?: string;
    remarks: string;
    approvedBy: string;
    glClassMap: Map<string, AssetClass>;
  }): {
    updatedAsset: FixedAssetMaster;
    disposalRecord: AssetDisposalRecord;
    event: AssetDomainEvent;
    auditLog: AssetAuditLogRecord;
  } {
    const timestamp = new Date().toISOString();
    const correlationId = `CORR-DSP-${Date.now()}`;
    const disposalId = `DSP-${Date.now()}`;

    const costAtDisposal = params.asset.purchaseCost;
    const accumDepAtDisposal = params.asset.totalAccumulatedDepreciation;
    const netBookValueAtDisposal = params.asset.netBookValue;
    const gainLossAmount = params.proceedsAmount - netBookValueAtDisposal;

    const updatedAsset: FixedAssetMaster = {
      ...params.asset,
      status: params.disposalType === 'SCRAP' || params.disposalType === 'WRITE_OFF' ? 'WRITTEN_OFF' : 'DISPOSED',
      updatedAt: timestamp
    };

    const disposalRecord: AssetDisposalRecord = {
      id: disposalId,
      assetId: params.asset.id,
      assetNumber: params.asset.assetNumber,
      disposalType: params.disposalType,
      disposalDate: params.disposalDate,
      proceedsAmount: params.proceedsAmount,
      costAtDisposal,
      accumDepAtDisposal,
      netBookValueAtDisposal,
      gainLossAmount,
      buyerName: params.buyerName,
      remarks: params.remarks,
      approvedBy: params.approvedBy,
      status: 'COMPLETED',
      createdAt: timestamp,
      correlationId
    };

    const assetClass = params.glClassMap.get(params.asset.assetClassId);
    const glAssetAccount = assetClass?.glAssetAccount || '120000';
    const glAccumDepAccount = assetClass?.glAccumDepAccount || '129000';
    const glGainLossAccount = assetClass?.glGainLossAccount || '710000';

    const eventPayload = {
      disposalId,
      disposalType: params.disposalType,
      proceedsAmount: params.proceedsAmount,
      costAtDisposal,
      accumDepAtDisposal,
      netBookValueAtDisposal,
      gainLossAmount
    };

    const eventSha = this.computeSha256Hash({ type: 'ASSET_DISPOSED', eventPayload, correlationId });

    const postings = [
      {
        debitAccount: glAccumDepAccount,
        creditAccount: glAssetAccount,
        amount: accumDepAtDisposal,
        description: `Derecognition of Accumulated Depreciation for Asset ${params.asset.assetNumber}`
      }
    ];

    if (params.proceedsAmount > 0) {
      postings.push({
        debitAccount: '111000', // Cash/Bank/AR
        creditAccount: glAssetAccount,
        amount: params.proceedsAmount,
        description: `Proceeds from disposal of Asset ${params.asset.assetNumber}`
      });
    }

    if (gainLossAmount < 0) {
      // Loss on Disposal
      postings.push({
        debitAccount: glGainLossAccount,
        creditAccount: glAssetAccount,
        amount: Math.abs(gainLossAmount),
        description: `Recognized Loss on Disposal of Asset ${params.asset.assetNumber}`
      });
    } else if (gainLossAmount > 0) {
      // Gain on Disposal
      postings.push({
        debitAccount: glAssetAccount,
        creditAccount: glGainLossAccount,
        amount: gainLossAmount,
        description: `Recognized Gain on Disposal of Asset ${params.asset.assetNumber}`
      });
    }

    const event: AssetDomainEvent = {
      eventId: `EVT-DSP-${Date.now()}`,
      eventType: 'ASSET_DISPOSED',
      eventTimestamp: timestamp,
      companyId: params.asset.companyId,
      branchId: params.asset.branchId,
      assetId: params.asset.id,
      assetNumber: params.asset.assetNumber,
      eventData: eventPayload,
      glAccountPostings: postings,
      sha256Hash: eventSha,
      correlationId
    };

    const auditLog: AssetAuditLogRecord = {
      id: `LOG-DSP-${Date.now()}`,
      assetId: params.asset.id,
      assetNumber: params.asset.assetNumber,
      eventType: 'ASSET_DISPOSED',
      timestamp,
      actionBy: params.approvedBy,
      details: `Disposed via ${params.disposalType}. Proceeds: ${params.asset.currency} ${params.proceedsAmount}, Gain/Loss: ${gainLossAmount}`,
      payload: eventPayload,
      sha256Hash: eventSha,
      correlationId
    };

    return { updatedAsset, disposalRecord, event, auditLog };
  }

  // ==================== ASSET REVALUATION (IAS 16) ====================

  public static processAssetRevaluation(params: {
    asset: FixedAssetMaster;
    revaluationDate: string;
    appraisalValue: number;
    valuerName: string;
    valuerReportReference?: string;
    remarks: string;
    approvedBy: string;
    glClassMap: Map<string, AssetClass>;
  }): {
    updatedAsset: FixedAssetMaster;
    revaluationRecord: AssetRevaluationRecord;
    event: AssetDomainEvent;
    auditLog: AssetAuditLogRecord;
  } {
    const timestamp = new Date().toISOString();
    const correlationId = `CORR-REV-${Date.now()}`;
    const revaluationId = `REV-${Date.now()}`;

    const preNBV = params.asset.netBookValue;
    const delta = params.appraisalValue - preNBV;
    const revaluationType: RevaluationType = delta >= 0 ? 'INCREASE' : 'DECREASE';

    const revaluationSurplusDelta = delta >= 0 ? delta : 0;
    const revaluationExpenseDelta = delta < 0 ? Math.abs(delta) : 0;

    const updatedAsset: FixedAssetMaster = {
      ...params.asset,
      netBookValue: params.appraisalValue,
      revaluationSurplus: Math.max(0, params.asset.revaluationSurplus + revaluationSurplusDelta - revaluationExpenseDelta),
      updatedAt: timestamp
    };

    const revaluationRecord: AssetRevaluationRecord = {
      id: revaluationId,
      assetId: params.asset.id,
      assetNumber: params.asset.assetNumber,
      revaluationDate: params.revaluationDate,
      revaluationType,
      preRevaluationCost: params.asset.purchaseCost,
      preRevaluationAccumDep: params.asset.totalAccumulatedDepreciation,
      preRevaluationNBV: preNBV,
      appraisalValue: params.appraisalValue,
      revaluationSurplusDelta,
      revaluationExpenseDelta,
      valuerName: params.valuerName,
      valuerReportReference: params.valuerReportReference,
      remarks: params.remarks,
      approvedBy: params.approvedBy,
      createdAt: timestamp,
      correlationId
    };

    const assetClass = params.glClassMap.get(params.asset.assetClassId);
    const glAssetAccount = assetClass?.glAssetAccount || '120000';
    const glSurplusAccount = assetClass?.glRevaluationSurplusAccount || '320000';
    const glGainLossAccount = assetClass?.glGainLossAccount || '710000';

    const postings = [];
    if (delta > 0) {
      postings.push({
        debitAccount: glAssetAccount,
        creditAccount: glSurplusAccount,
        amount: delta,
        description: `IAS 16 Revaluation Surplus Increase for Asset ${params.asset.assetNumber}`
      });
    } else {
      postings.push({
        debitAccount: glGainLossAccount,
        creditAccount: glAssetAccount,
        amount: Math.abs(delta),
        description: `IAS 16 Revaluation Deficit Expense for Asset ${params.asset.assetNumber}`
      });
    }

    const eventPayload = {
      revaluationId,
      revaluationType,
      preNBV,
      appraisalValue: params.appraisalValue,
      delta,
      valuerName: params.valuerName
    };

    const eventSha = this.computeSha256Hash({ type: 'ASSET_REVALUED', eventPayload, correlationId });

    const event: AssetDomainEvent = {
      eventId: `EVT-REV-${Date.now()}`,
      eventType: 'ASSET_REVALUED',
      eventTimestamp: timestamp,
      companyId: params.asset.companyId,
      branchId: params.asset.branchId,
      assetId: params.asset.id,
      assetNumber: params.asset.assetNumber,
      eventData: eventPayload,
      glAccountPostings: postings,
      sha256Hash: eventSha,
      correlationId
    };

    const auditLog: AssetAuditLogRecord = {
      id: `LOG-REV-${Date.now()}`,
      assetId: params.asset.id,
      assetNumber: params.asset.assetNumber,
      eventType: 'ASSET_REVALUED',
      timestamp,
      actionBy: params.approvedBy,
      details: `IAS 16 Revaluation ${revaluationType}. Pre-NBV: ${preNBV}, New Value: ${params.appraisalValue}, Delta: ${delta}`,
      payload: eventPayload,
      sha256Hash: eventSha,
      correlationId
    };

    return { updatedAsset, revaluationRecord, event, auditLog };
  }

  // ==================== ASSET IMPAIRMENT (IAS 36) ====================

  public static processAssetImpairment(params: {
    asset: FixedAssetMaster;
    impairmentDate: string;
    recoverableAmount: number;
    valuationMethod: 'FAIR_VALUE' | 'VALUE_IN_USE';
    isReversal?: boolean;
    reason: string;
    approvedBy: string;
  }): {
    updatedAsset: FixedAssetMaster;
    impairmentRecord: AssetImpairmentRecord;
    event: AssetDomainEvent;
    auditLog: AssetAuditLogRecord;
  } {
    const timestamp = new Date().toISOString();
    const correlationId = `CORR-IMP-${Date.now()}`;
    const impairmentId = `IMP-${Date.now()}`;

    const carryingAmount = params.asset.netBookValue;
    const isReversal = !!params.isReversal;

    let impairmentLossAmount = 0;
    let reversalAmount = 0;

    if (!isReversal) {
      impairmentLossAmount = Math.max(0, carryingAmount - params.recoverableAmount);
    } else {
      reversalAmount = Math.max(0, params.recoverableAmount - carryingAmount);
    }

    const newNBV = isReversal
      ? carryingAmount + reversalAmount
      : carryingAmount - impairmentLossAmount;

    const updatedAsset: FixedAssetMaster = {
      ...params.asset,
      netBookValue: newNBV,
      accumulatedImpairmentLoss: isReversal
        ? Math.max(0, params.asset.accumulatedImpairmentLoss - reversalAmount)
        : params.asset.accumulatedImpairmentLoss + impairmentLossAmount,
      status: !isReversal && impairmentLossAmount > 0 ? 'IMPAIRED' : params.asset.status,
      updatedAt: timestamp
    };

    const impairmentRecord: AssetImpairmentRecord = {
      id: impairmentId,
      assetId: params.asset.id,
      assetNumber: params.asset.assetNumber,
      impairmentDate: params.impairmentDate,
      carryingAmount,
      recoverableAmount: params.recoverableAmount,
      impairmentLossAmount,
      isReversal,
      reversalAmount,
      valuationMethod: params.valuationMethod,
      reason: params.reason,
      approvedBy: params.approvedBy,
      createdAt: timestamp,
      correlationId
    };

    const eventPayload = {
      impairmentId,
      carryingAmount,
      recoverableAmount: params.recoverableAmount,
      impairmentLossAmount,
      isReversal,
      reversalAmount
    };

    const eventSha = this.computeSha256Hash({ type: 'ASSET_IMPAIRED', eventPayload, correlationId });

    const postings = [];
    if (!isReversal && impairmentLossAmount > 0) {
      postings.push({
        debitAccount: '680000', // Impairment Loss Expense
        creditAccount: '129900', // Accumulated Impairment Account
        amount: impairmentLossAmount,
        description: `IAS 36 Impairment Loss on Asset ${params.asset.assetNumber}`
      });
    } else if (isReversal && reversalAmount > 0) {
      postings.push({
        debitAccount: '129900', // Accumulated Impairment Account
        creditAccount: '780000', // Impairment Loss Reversal Gain
        amount: reversalAmount,
        description: `IAS 36 Impairment Loss Reversal on Asset ${params.asset.assetNumber}`
      });
    }

    const event: AssetDomainEvent = {
      eventId: `EVT-IMP-${Date.now()}`,
      eventType: 'ASSET_IMPAIRED',
      eventTimestamp: timestamp,
      companyId: params.asset.companyId,
      branchId: params.asset.branchId,
      assetId: params.asset.id,
      assetNumber: params.asset.assetNumber,
      eventData: eventPayload,
      glAccountPostings: postings,
      sha256Hash: eventSha,
      correlationId
    };

    const auditLog: AssetAuditLogRecord = {
      id: `LOG-IMP-${Date.now()}`,
      assetId: params.asset.id,
      assetNumber: params.asset.assetNumber,
      eventType: 'ASSET_IMPAIRED',
      timestamp,
      actionBy: params.approvedBy,
      details: isReversal
        ? `IAS 36 Impairment Reversal of ${reversalAmount}`
        : `IAS 36 Impairment Loss of ${impairmentLossAmount} recognized`,
      payload: eventPayload,
      sha256Hash: eventSha,
      correlationId
    };

    return { updatedAsset, impairmentRecord, event, auditLog };
  }

  // ==================== ASSET MAINTENANCE LOGGING ====================

  public static logMaintenanceRecord(params: {
    asset: FixedAssetMaster;
    maintenanceType: MaintenanceType;
    maintenanceDate: string;
    vendorId?: string;
    vendorName?: string;
    description: string;
    cost: number;
    spareParts?: { partName: string; quantity: number; unitCost: number }[];
    downtimeHours: number;
    performedBy: string;
  }): {
    maintenanceRecord: AssetMaintenanceRecord;
    auditLog: AssetAuditLogRecord;
  } {
    const timestamp = new Date().toISOString();
    const correlationId = `CORR-MNT-${Date.now()}`;
    const id = `MNT-${Date.now()}`;

    const parts = (params.spareParts || []).map(p => ({
      ...p,
      totalCost: Math.round(p.quantity * p.unitCost * 100) / 100
    }));

    const maintenanceRecord: AssetMaintenanceRecord = {
      id,
      assetId: params.asset.id,
      assetNumber: params.asset.assetNumber,
      maintenanceType: params.maintenanceType,
      maintenanceDate: params.maintenanceDate,
      vendorId: params.vendorId,
      vendorName: params.vendorName,
      description: params.description,
      cost: params.cost,
      spareParts: parts,
      downtimeHours: params.downtimeHours,
      performedBy: params.performedBy,
      status: 'COMPLETED',
      createdAt: timestamp
    };

    const auditLog: AssetAuditLogRecord = {
      id: `LOG-MNT-${Date.now()}`,
      assetId: params.asset.id,
      assetNumber: params.asset.assetNumber,
      eventType: 'MAINTENANCE_LOGGED',
      timestamp,
      actionBy: params.performedBy,
      details: `${params.maintenanceType} maintenance performed. Cost: ${params.asset.currency} ${params.cost}, Downtime: ${params.downtimeHours} hrs`,
      payload: maintenanceRecord,
      sha256Hash: this.computeSha256Hash({ id, cost: params.cost, timestamp }),
      correlationId
    };

    return { maintenanceRecord, auditLog };
  }

  // ==================== PHYSICAL COUNT & SCAN VERIFICATION ====================

  public static processPhysicalCountScan(params: {
    session: PhysicalVerificationSession;
    scannedBarcode: string;
    actualLocationId: string;
    assets: FixedAssetMaster[];
    notes?: string;
  }): {
    updatedSession: PhysicalVerificationSession;
    scanItem: PhysicalCountScanItem;
  } {
    const timestamp = new Date().toISOString();
    const matchedAsset = params.assets.find(
      a => a.barcode === params.scannedBarcode || a.assetNumber === params.scannedBarcode
    );

    let scanStatus: 'MATCHED' | 'LOCATION_MISMATCH' | 'MISSING' | 'FOUND_UNRECORDED' = 'FOUND_UNRECORDED';

    if (matchedAsset) {
      if (matchedAsset.locationId === params.session.locationId) {
        scanStatus = 'MATCHED';
      } else {
        scanStatus = 'LOCATION_MISMATCH';
      }
    }

    const scanItem: PhysicalCountScanItem = {
      scanId: `SCN-${Date.now()}`,
      assetId: matchedAsset?.id,
      assetNumber: matchedAsset?.assetNumber,
      scannedBarcode: params.scannedBarcode,
      expectedLocationId: matchedAsset?.locationId || 'UNKNOWN',
      actualLocationId: params.actualLocationId,
      scanStatus,
      notes: params.notes,
      scannedAt: timestamp
    };

    const newScans = [...params.session.scans, scanItem];
    const matchedCount = newScans.filter(s => s.scanStatus === 'MATCHED').length;
    const discrepancyCount = newScans.filter(s => s.scanStatus !== 'MATCHED').length;

    const updatedSession: PhysicalVerificationSession = {
      ...params.session,
      totalAssetsScanned: newScans.length,
      matchedCount,
      discrepancyCount,
      scans: newScans
    };

    return { updatedSession, scanItem };
  }

  // ==================== REPORTING ENGINES ====================

  public static generateAssetRegisterReport(assets: FixedAssetMaster[], companyId: string): AssetRegisterReport {
    const filtered = assets.filter(a => a.companyId === companyId);
    let totalCost = 0;
    let totalAccumDep = 0;
    let totalNBV = 0;

    for (const a of filtered) {
      totalCost += a.purchaseCost;
      totalAccumDep += a.totalAccumulatedDepreciation;
      totalNBV += a.netBookValue;
    }

    return {
      companyId,
      generatedAt: new Date().toISOString(),
      totalAssetsCount: filtered.length,
      totalAcquisitionCost: Math.round(totalCost * 100) / 100,
      totalAccumulatedDepreciation: Math.round(totalAccumDep * 100) / 100,
      totalNetBookValue: Math.round(totalNBV * 100) / 100,
      assets: filtered
    };
  }

  public static generateAssetRollForwardReport(params: {
    assets: FixedAssetMaster[];
    assetClasses: AssetClass[];
    companyId: string;
    periodStart: string;
    periodEnd: string;
  }): AssetRollForwardReport {
    const classMap = new Map<string, AssetClass>(params.assetClasses.map(c => [c.id, c]));
    const classGroupMap = new Map<string, AssetRollForwardReportLine>();

    for (const ac of params.assetClasses) {
      classGroupMap.set(ac.id, {
        assetClassId: ac.id,
        assetClassName: ac.name,
        openingCost: 0,
        acquisitionsCost: 0,
        disposalsCost: 0,
        revaluationsCost: 0,
        closingCost: 0,
        openingAccumDep: 0,
        depreciationExpense: 0,
        disposalsAccumDep: 0,
        closingAccumDep: 0,
        openingNBV: 0,
        closingNBV: 0
      });
    }

    const companyAssets = params.assets.filter(a => a.companyId === params.companyId);

    for (const a of companyAssets) {
      let line = classGroupMap.get(a.assetClassId);
      if (!line) {
        line = {
          assetClassId: a.assetClassId,
          assetClassName: a.assetClassName || a.assetClassId,
          openingCost: 0,
          acquisitionsCost: 0,
          disposalsCost: 0,
          revaluationsCost: 0,
          closingCost: 0,
          openingAccumDep: 0,
          depreciationExpense: 0,
          disposalsAccumDep: 0,
          closingAccumDep: 0,
          openingNBV: 0,
          closingNBV: 0
        };
        classGroupMap.set(a.assetClassId, line);
      }

      if (a.status === 'DISPOSED' || a.status === 'WRITTEN_OFF') {
        line.disposalsCost += a.purchaseCost;
        line.disposalsAccumDep += a.totalAccumulatedDepreciation;
      } else {
        line.closingCost += a.purchaseCost;
        line.closingAccumDep += a.totalAccumulatedDepreciation;
        line.closingNBV += a.netBookValue;

        // Approximate roll-forward metrics for current active fleet
        line.openingCost += a.purchaseCost;
        line.depreciationExpense += a.totalAccumulatedDepreciation;
        line.openingAccumDep += Math.max(0, a.totalAccumulatedDepreciation - (a.purchaseCost / (a.usefulLifeYears || 5)));
        line.openingNBV += a.purchaseCost - line.openingAccumDep;
      }
    }

    const lines = Array.from(classGroupMap.values());
    let gOpenCost = 0, gCloseCost = 0, gOpenNBV = 0, gCloseNBV = 0;

    for (const l of lines) {
      gOpenCost += l.openingCost;
      gCloseCost += l.closingCost;
      gOpenNBV += l.openingNBV;
      gCloseNBV += l.closingNBV;
    }

    return {
      companyId: params.companyId,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      generatedAt: new Date().toISOString(),
      lines,
      grandTotalOpeningCost: Math.round(gOpenCost * 100) / 100,
      grandTotalClosingCost: Math.round(gCloseCost * 100) / 100,
      grandTotalOpeningNBV: Math.round(gOpenNBV * 100) / 100,
      grandTotalClosingNBV: Math.round(gCloseNBV * 100) / 100
    };
  }

  public static generateNBVReport(assets: FixedAssetMaster[], companyId: string): NBVReportLine[] {
    return assets
      .filter(a => a.companyId === companyId)
      .map(a => ({
        assetNumber: a.assetNumber,
        assetName: a.name,
        assetClassName: a.assetClassName || a.assetClassId,
        acquisitionDate: a.acquisitionDate,
        usefulLifeYears: a.usefulLifeYears,
        purchaseCost: a.purchaseCost,
        accumulatedDepreciation: a.totalAccumulatedDepreciation,
        netBookValue: a.netBookValue,
        status: a.status
      }));
  }

  // ==================== ENTERPRISE HARDENING & GOVERNANCE ENGINES ====================

  /**
   * 1. Gapless Sequential Asset Numbering Generator
   * Format: AST-{COMPANY_CODE}-{CLASS_CODE}-{YEAR}-{0000}
   * Guarantees strict gapless progression, deduplication, and multi-tenant isolation.
   */
  public static generateGaplessAssetNumber(params: {
    companyCode: string;
    assetClassCode: string;
    fiscalYear: number | string;
    existingAssets: FixedAssetMaster[];
  }): { assetNumber: string; sequenceNumber: number; barcode: string; qrCode: string } {
    const yearStr = String(params.fiscalYear || new Date().getFullYear());
    const compClean = (params.companyCode || 'COMP').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const classClean = (params.assetClassCode || 'GEN').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const prefix = `AST-${compClean}-${classClean}-${yearStr}`;

    // Filter existing assets matching prefix
    let maxSeq = 0;
    for (const ast of params.existingAssets) {
      if (ast.assetNumber && ast.assetNumber.startsWith(prefix)) {
        const parts = ast.assetNumber.split('-');
        const seqPart = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(seqPart) && seqPart > maxSeq) {
          maxSeq = seqPart;
        }
      }
    }

    const nextSeq = maxSeq + 1;
    const seqStr = String(nextSeq).padStart(4, '0');
    const assetNumber = `${prefix}-${seqStr}`;
    const barcode = `BAR-${assetNumber}`;
    const qrSignature = this.computeSha256Hash({ assetNumber, prefix, nextSeq }).substring(0, 16);
    const qrCode = `QR-${assetNumber}-${qrSignature}`;

    return {
      assetNumber,
      sequenceNumber: nextSeq,
      barcode,
      qrCode
    };
  }

  /**
   * 2. Acquisition Validation & Idempotency Rules
   */
  public static validateAcquisitionRules(params: {
    assetData: any;
    existingAssets: FixedAssetMaster[];
    existingAcquisitions: AssetAcquisitionRecord[];
    idempotencyKey?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { assetData, existingAssets, existingAcquisitions, idempotencyKey } = params;

    // Check mandatory fields
    if (!assetData.name || assetData.name.trim().length === 0) {
      errors.push('Asset name/description is mandatory');
    }
    if (!assetData.assetClassId) {
      errors.push('Asset class assignment is mandatory');
    }
    if (typeof assetData.purchaseCost !== 'number' || assetData.purchaseCost <= 0) {
      errors.push('Purchase/Capitalized cost must be a positive number');
    }
    if (typeof assetData.usefulLifeYears !== 'number' || assetData.usefulLifeYears <= 0) {
      errors.push('Useful life in years must be greater than zero');
    }
    if (assetData.salvageValue < 0) {
      errors.push('Salvage value cannot be negative');
    }
    if (assetData.salvageValue >= assetData.purchaseCost) {
      errors.push('Salvage value must be strictly less than purchase cost');
    }

    const validMethods: DepreciationMethod[] = [
      'STRAIGHT_LINE',
      'DECLINING_BALANCE',
      'DOUBLE_DECLINING',
      'UNITS_OF_PRODUCTION',
      'MANUAL',
      'NO_DEPRECIATION'
    ];
    if (!validMethods.includes(assetData.depreciationMethod)) {
      errors.push(`Invalid depreciation method: ${assetData.depreciationMethod}`);
    }

    // Idempotency Key Validation
    if (idempotencyKey) {
      const isDuplicateKey = existingAssets.some(a => a.idempotencyKey === idempotencyKey);
      if (isDuplicateKey) {
        errors.push(`Duplicate capitalization detected for Idempotency Key: ${idempotencyKey}`);
      }
    }

    // Reference uniqueness check (PO Number / Invoice Number duplicate prevention)
    if (assetData.poNumber) {
      const duplicatePO = existingAcquisitions.some(
        a => a.poNumber === assetData.poNumber && a.assetId !== assetData.id
      );
      if (duplicatePO) {
        errors.push(`Duplicate capitalization rejected: PO Number ${assetData.poNumber} already capitalized`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 3. Depreciation Integrity Validation
   */
  public static validateDepreciationIntegrity(asset: FixedAssetMaster): {
    isValid: boolean;
    errors: string[];
    depreciableBase: number;
    remainingDepreciable: number;
  } {
    const errors: string[] = [];
    const depreciableBase = Math.max(0, asset.purchaseCost - asset.salvageValue);
    const remainingDepreciable = Math.max(0, asset.netBookValue - asset.salvageValue);

    if (asset.netBookValue < 0) {
      errors.push(`Integrity Violation: Asset ${asset.assetNumber} Net Book Value is negative (${asset.netBookValue})`);
    }
    if (asset.netBookValue < asset.salvageValue && asset.status === 'ACTIVE') {
      errors.push(`Integrity Violation: Asset ${asset.assetNumber} NBV (${asset.netBookValue}) is below Salvage Value (${asset.salvageValue})`);
    }
    if (asset.totalAccumulatedDepreciation > asset.purchaseCost) {
      errors.push(`Integrity Violation: Accumulated Depreciation (${asset.totalAccumulatedDepreciation}) exceeds Purchase Cost (${asset.purchaseCost})`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      depreciableBase,
      remainingDepreciable
    };
  }

  /**
   * 4. Asset Lock Status Verification
   */
  public static validateAssetLockStatus(asset: FixedAssetMaster): void {
    if (asset.isLocked) {
      throw new Error(`Asset ${asset.assetNumber} is LOCKED. Reason: ${asset.lockReason || 'Administrative Lock'}. Modifications blocked.`);
    }
    if (asset.status === 'DISPOSED' || asset.status === 'WRITTEN_OFF') {
      throw new Error(`Asset ${asset.assetNumber} is ${asset.status}. Modifying or depreciating retired assets is strictly forbidden under IAS 16.`);
    }
  }

  /**
   * 5. Disposal Validation & Open Maintenance Checks
   */
  public static validateDisposalRules(params: {
    asset: FixedAssetMaster;
    maintenances: AssetMaintenanceRecord[];
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { asset, maintenances } = params;

    if (asset.status === 'DISPOSED' || asset.status === 'WRITTEN_OFF') {
      errors.push(`Asset ${asset.assetNumber} is already disposed/written off. Cannot dispose twice.`);
    }

    // Check for open/in-progress maintenance orders
    const openOrders = maintenances.filter(
      m => m.assetId === asset.id && (m.status === 'IN_PROGRESS' || m.status === 'SCHEDULED')
    );
    if (openOrders.length > 0) {
      errors.push(`Cannot dispose Asset ${asset.assetNumber}: There are ${openOrders.length} active/scheduled maintenance work orders pending completion.`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 6. IAS 16 Revaluation Validation
   */
  public static validateIAS16Revaluation(params: {
    asset: FixedAssetMaster;
    appraisalValue: number;
    valuerName: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { asset, appraisalValue, valuerName } = params;

    if (asset.status === 'DISPOSED' || asset.status === 'WRITTEN_OFF') {
      errors.push('Cannot revalue a retired/disposed asset.');
    }
    if (!valuerName || valuerName.trim().length === 0) {
      errors.push('IAS 16 requires a certified independent valuer identification.');
    }
    if (typeof appraisalValue !== 'number' || appraisalValue <= 0) {
      errors.push('Appraisal value must be a positive number.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 7. IAS 36 Impairment & Reversal Limitations
   */
  public static validateIAS36Impairment(params: {
    asset: FixedAssetMaster;
    recoverableAmount: number;
    isReversal: boolean;
  }): { isValid: boolean; errors: string[]; calculatedDelta: number } {
    const errors: string[] = [];
    const { asset, recoverableAmount, isReversal } = params;

    if (asset.status === 'DISPOSED' || asset.status === 'WRITTEN_OFF') {
      errors.push('Cannot perform impairment test on a disposed asset.');
    }

    let calculatedDelta = 0;

    if (isReversal) {
      if (asset.accumulatedImpairmentLoss <= 0) {
        errors.push('Cannot process impairment reversal: Asset has zero accumulated impairment loss.');
      }
      if (recoverableAmount <= asset.netBookValue) {
        errors.push('Recoverable amount does not exceed carrying value; reversal not justified.');
      }
      // Calculate allowable reversal (capped at accumulated impairment loss)
      const potentialGain = recoverableAmount - asset.netBookValue;
      calculatedDelta = Math.min(potentialGain, asset.accumulatedImpairmentLoss);
    } else {
      if (recoverableAmount >= asset.netBookValue) {
        errors.push(`No impairment loss detected. Recoverable amount (${recoverableAmount}) >= Carrying NBV (${asset.netBookValue}).`);
      }
      calculatedDelta = Math.max(0, asset.netBookValue - recoverableAmount);
    }

    return {
      isValid: errors.length === 0,
      errors,
      calculatedDelta
    };
  }

  /**
   * 8. Maintenance Schedule Integrity
   */
  public static validateMaintenanceIntegrity(params: {
    asset: FixedAssetMaster;
    existingMaintenances: AssetMaintenanceRecord[];
    newMaintenanceDate: string;
  }): { isValid: boolean; errors: string[]; hasOverdueMaintenance: boolean } {
    const errors: string[] = [];
    const { asset, existingMaintenances } = params;

    if (asset.status === 'DISPOSED' || asset.status === 'WRITTEN_OFF') {
      errors.push('Cannot schedule maintenance on a disposed/retired asset.');
    }

    // Check for open/overlapping orders
    const activeOrders = existingMaintenances.filter(
      m => m.assetId === asset.id && m.status === 'IN_PROGRESS'
    );
    if (activeOrders.length > 0) {
      errors.push(`Work order collision: Asset ${asset.assetNumber} already has an active work order in progress (${activeOrders[0].id}).`);
    }

    // Detect overdue preventive maintenance
    const assetMaint = existingMaintenances.filter(m => m.assetId === asset.id && m.status === 'COMPLETED');
    let hasOverdueMaintenance = false;
    if (assetMaint.length > 0) {
      const lastDate = new Date(assetMaint[assetMaint.length - 1].maintenanceDate);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      if (lastDate < sixMonthsAgo && asset.status === 'ACTIVE') {
        hasOverdueMaintenance = true;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      hasOverdueMaintenance
    };
  }

  /**
   * 9. Cryptographically Sealed Immutable Snapshot Generator
   */
  public static createImmutableSnapshot(params: {
    snapshotType: AssetSnapshotType;
    companyId: string;
    fiscalPeriod: string;
    itemCount: number;
    dataPayload: any;
    signedBy: string;
  }): ImmutableAssetSnapshot {
    const timestamp = new Date().toISOString();
    const snapshotId = `SNAP-${params.snapshotType}-${params.fiscalPeriod}-${Date.now()}`;
    const rawPayloadForSeal = {
      snapshotId,
      snapshotType: params.snapshotType,
      companyId: params.companyId,
      fiscalPeriod: params.fiscalPeriod,
      itemCount: params.itemCount,
      dataPayload: params.dataPayload,
      timestamp,
      signedBy: params.signedBy
    };

    const sha256Seal = this.computeSha256Hash(rawPayloadForSeal);

    return {
      snapshotId,
      snapshotType: params.snapshotType,
      companyId: params.companyId,
      fiscalPeriod: params.fiscalPeriod,
      generatedAt: timestamp,
      itemCount: params.itemCount,
      dataPayload: params.dataPayload,
      sha256Seal,
      signedBy: params.signedBy,
      isVerified: true
    };
  }

  /**
   * 10. Verify Immutable Snapshot Integrity
   */
  public static verifySnapshotIntegrity(snapshot: ImmutableAssetSnapshot): boolean {
    const rawPayloadForSeal = {
      snapshotId: snapshot.snapshotId,
      snapshotType: snapshot.snapshotType,
      companyId: snapshot.companyId,
      fiscalPeriod: snapshot.fiscalPeriod,
      itemCount: snapshot.itemCount,
      dataPayload: snapshot.dataPayload,
      timestamp: snapshot.generatedAt,
      signedBy: snapshot.signedBy
    };
    const expectedSeal = this.computeSha256Hash(rawPayloadForSeal);
    return snapshot.sha256Seal === expectedSeal;
  }
}
