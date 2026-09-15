/**
 * AM Business Platform — P0-06 Mobile Retail Engine
 * Runtime service for Profile 03: Retail — Mobile Phones & Electronics.
 * Implements IMEI/Serial device tracking, POS serial scanning & duplicate prevention,
 * customer trade-in inspection & valuation, and repair service job cards.
 */

import {
  MobileDeviceRecord,
  MobileTradeInRecord,
  TradeInInspectionItem,
  MobileRepairJobCard
} from './types';

export class MobileRetailEngine {
  /**
   * Validates IMEI format (15 digits)
   */
  public static validateImeiStructure(imei: string): boolean {
    if (!imei) return false;
    const clean = imei.trim();
    return /^\d{15}$/.test(clean);
  }

  /**
   * Registers a new or used mobile device with IMEI tracking
   */
  public static registerDevice(params: {
    tenantId: string;
    companyId: string;
    branchId: string;
    brand: string;
    model: string;
    storage: string;
    ram: string;
    color: string;
    condition: 'BRAND_NEW' | 'OPEN_BOX' | 'REFURBISHED_GRADE_A' | 'USED_GRADE_B' | 'USED_GRADE_C';
    imei1: string;
    imei2?: string;
    serialNumber: string;
    batteryHealthPercent?: number;
    warrantyMonths: number;
    supplierId: string;
    purchaseCost: number;
    salePrice: number;
    existingDevices?: MobileDeviceRecord[];
  }): MobileDeviceRecord {
    if (!this.validateImeiStructure(params.imei1)) {
      throw new Error(`Invalid IMEI1 "${params.imei1}": Must be exactly 15 numeric digits.`);
    }

    if (params.imei2 && !this.validateImeiStructure(params.imei2)) {
      throw new Error(`Invalid IMEI2 "${params.imei2}": Must be exactly 15 numeric digits.`);
    }

    // Duplicate check in active inventory
    if (params.existingDevices) {
      const duplicate = params.existingDevices.find(
        d => (d.imei1 === params.imei1 || (d.imei2 && d.imei2 === params.imei1)) && d.status === 'IN_STOCK'
      );
      if (duplicate) {
        throw new Error(`Device with IMEI "${params.imei1}" is already registered in active inventory (ID: ${duplicate.id}).`);
      }
    }

    return {
      id: `DEV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      branchId: params.branchId,
      brand: params.brand,
      model: params.model,
      storage: params.storage,
      ram: params.ram,
      color: params.color,
      condition: params.condition,
      imei1: params.imei1.trim(),
      imei2: params.imei2?.trim(),
      serialNumber: params.serialNumber.trim(),
      batteryHealthPercent: params.batteryHealthPercent,
      warrantyMonths: params.warrantyMonths,
      supplierId: params.supplierId,
      purchaseCost: params.purchaseCost,
      salePrice: params.salePrice,
      status: 'IN_STOCK',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Processes POS device sale with IMEI and sets warranty expiration
   */
  public static processDeviceSale(
    device: MobileDeviceRecord,
    invoiceNumber: string,
    customerId: string
  ): MobileDeviceRecord {
    if (device.status !== 'IN_STOCK') {
      throw new Error(`Device with IMEI "${device.imei1}" cannot be sold because its status is ${device.status}.`);
    }

    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + device.warrantyMonths);

    device.status = 'SOLD';
    device.soldAtInvoiceNumber = invoiceNumber;
    device.associatedCustomerId = customerId;
    device.warrantyExpirationDate = expirationDate.toISOString().split('T')[0];

    return device;
  }

  /**
   * Evaluates customer trade-in device and calculates valuation
   */
  public static evaluateTradeIn(params: {
    tenantId: string;
    companyId: string;
    branchId: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    customerNationalId?: string;
    deviceBrand: string;
    deviceModel: string;
    imei1: string;
    serialNumber?: string;
    baseMarketValuation: number;
    inspections: TradeInInspectionItem[];
    payoutMethod: 'STORE_CREDIT_VOUCHER' | 'CASH_PAYOUT' | 'OFFSET_AGAINST_NEW_DEVICE';
    processedBy: string;
  }): MobileTradeInRecord {
    if (!this.validateImeiStructure(params.imei1)) {
      throw new Error(`Invalid IMEI1 "${params.imei1}" for trade-in: Must be 15 numeric digits.`);
    }

    const totalDeductions = params.inspections.reduce((sum, item) => sum + item.deductionAmount, 0);
    const finalOfferedAmount = Math.max(0, params.baseMarketValuation - totalDeductions);

    let grade: 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'SCRAP' = 'GRADE_A';
    if (totalDeductions > params.baseMarketValuation * 0.5) {
      grade = 'SCRAP';
    } else if (totalDeductions > params.baseMarketValuation * 0.25) {
      grade = 'GRADE_C';
    } else if (totalDeductions > 0) {
      grade = 'GRADE_B';
    }

    return {
      id: `TRD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      branchId: params.branchId,
      tradeInNumber: `TRD-${Date.now().toString().slice(-6)}`,
      customerId: params.customerId,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      customerNationalId: params.customerNationalId,
      deviceBrand: params.deviceBrand,
      deviceModel: params.deviceModel,
      imei1: params.imei1,
      serialNumber: params.serialNumber,
      grade,
      baseMarketValuation: params.baseMarketValuation,
      inspections: params.inspections,
      totalDeductions,
      finalOfferedAmount,
      customerAccepted: true,
      payoutMethod: params.payoutMethod,
      processedBy: params.processedBy,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Creates a repair service job card
   */
  public static createRepairJobCard(params: {
    tenantId: string;
    companyId: string;
    branchId: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    deviceBrand: string;
    deviceModel: string;
    imeiOrSerial: string;
    reportedProblem: string;
    assignedTechnicianId: string;
    assignedTechnicianName: string;
    estimatedCost: number;
    laborHourlyRate?: number;
  }): MobileRepairJobCard {
    return {
      id: `JOB-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      companyId: params.companyId,
      branchId: params.branchId,
      jobCardNumber: `REP-${Date.now().toString().slice(-6)}`,
      customerId: params.customerId,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      deviceBrand: params.deviceBrand,
      deviceModel: params.deviceModel,
      imeiOrSerial: params.imeiOrSerial,
      reportedProblem: params.reportedProblem,
      assignedTechnicianId: params.assignedTechnicianId,
      assignedTechnicianName: params.assignedTechnicianName,
      partsUsed: [],
      laborHours: 0,
      laborHourlyRate: params.laborHourlyRate || 50,
      totalLaborCharge: 0,
      totalPartsCharge: 0,
      estimatedCost: params.estimatedCost,
      finalInvoiceAmount: 0,
      status: 'RECEIVED',
      warrantyDaysProvided: 90,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Finalizes repair job card with spare parts and labor hours
   */
  public static completeRepairJobCard(
    jobCard: MobileRepairJobCard,
    parts: { partSku: string; partName: string; quantity: number; unitCost: number; sellingPrice: number }[],
    laborHours: number
  ): MobileRepairJobCard {
    const totalPartsCharge = parts.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0);
    const totalLaborCharge = laborHours * jobCard.laborHourlyRate;
    const finalInvoiceAmount = totalPartsCharge + totalLaborCharge;

    jobCard.partsUsed = parts;
    jobCard.laborHours = laborHours;
    jobCard.totalPartsCharge = totalPartsCharge;
    jobCard.totalLaborCharge = totalLaborCharge;
    jobCard.finalInvoiceAmount = finalInvoiceAmount;
    jobCard.status = 'READY_FOR_PICKUP';
    jobCard.completedAt = new Date().toISOString();

    return jobCard;
  }

  /**
   * Calculates profitability metrics for mobile retail
   */
  public static calculateMobileKpis(
    devices: MobileDeviceRecord[],
    tradeIns: MobileTradeInRecord[],
    jobCards: MobileRepairJobCard[]
  ) {
    const soldDevices = devices.filter(d => d.status === 'SOLD');
    const totalDeviceRevenue = soldDevices.reduce((sum, d) => sum + d.salePrice, 0);
    const totalDeviceCost = soldDevices.reduce((sum, d) => sum + d.purchaseCost, 0);
    const grossMarginPercent = totalDeviceRevenue > 0
      ? ((totalDeviceRevenue - totalDeviceCost) / totalDeviceRevenue) * 100
      : 0;

    const completedJobs = jobCards.filter(j => j.status === 'DELIVERED' || j.status === 'READY_FOR_PICKUP');
    const totalRepairRevenue = completedJobs.reduce((sum, j) => sum + j.finalInvoiceAmount, 0);
    const totalPartsCost = completedJobs.reduce(
      (sum, j) => sum + j.partsUsed.reduce((pSum, p) => pSum + p.unitCost * p.quantity, 0),
      0
    );
    const repairProfit = totalRepairRevenue - totalPartsCost;

    return {
      inStockCount: devices.filter(d => d.status === 'IN_STOCK').length,
      soldCount: soldDevices.length,
      deviceGrossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
      tradeInVolumeTotal: tradeIns.reduce((sum, t) => sum + t.finalOfferedAmount, 0),
      completedRepairsCount: completedJobs.length,
      totalRepairRevenue,
      netRepairProfit: repairProfit
    };
  }
}
