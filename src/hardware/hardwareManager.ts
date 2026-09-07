/**
 * AM Business Platform - Master Hardware Controller (HAL Manager)
 * Architecture Baseline: Pilot Readiness 3B
 * 
 * Central controller coordinating all 4 POS peripherals:
 * 1. 80mm ESC/POS Thermal Printer
 * 2. Cash Drawer
 * 3. 1D/2D Barcode Scanner
 * 4. Weighing Scale
 * 
 * Provides:
 * - Unified hardware status overview.
 * - Reactive state change listeners for UI dashboards.
 * - Graceful fallback execution when direct hardware is absent.
 * - Strict non-faking enforcement across all device channels.
 */

import { HardwareDeviceState, PrintReceiptPayload, PrintResult, DrawerKickResult } from './types';
import { ThermalPrinterAdapter } from './thermalPrinterAdapter';
import { CashDrawerAdapter } from './cashDrawerAdapter';
import { BarcodeScannerAdapter } from './barcodeScannerAdapter';
import { WeighingScaleAdapter } from './weighingScaleAdapter';
import { BarcodeParserEngine, ParsedBarcodeResult } from '../engine/barcodeParserEngine';

export interface HardwareOverallHealth {
  timestamp: string;
  totalDevices: number;
  directConnectedCount: number;
  fallbackCount: number;
  unavailableCount: number;
  devices: Record<string, HardwareDeviceState>;
}

export type HardwareStateListener = (health: HardwareOverallHealth) => void;

export class HardwareManager {
  private static instance: HardwareManager;
  private printer = ThermalPrinterAdapter.getInstance();
  private cashDrawer = CashDrawerAdapter.getInstance();
  private scanner = BarcodeScannerAdapter.getInstance();
  private scale = WeighingScaleAdapter.getInstance();
  private listeners: Set<HardwareStateListener> = new Set();

  private constructor() {
    // Initial health check
  }

  public static getInstance(): HardwareManager {
    if (!HardwareManager.instance) {
      HardwareManager.instance = new HardwareManager();
    }
    return HardwareManager.instance;
  }

  public getPrinter(): ThermalPrinterAdapter {
    return this.printer;
  }

  public getCashDrawer(): CashDrawerAdapter {
    return this.cashDrawer;
  }

  public getScanner(): BarcodeScannerAdapter {
    return this.scanner;
  }

  public getScale(): WeighingScaleAdapter {
    return this.scale;
  }

  public subscribe(listener: HardwareStateListener): () => void {
    this.listeners.add(listener);
    // Immediately emit current state
    listener(this.getOverallHealth());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notifyStateChange(): void {
    const health = this.getOverallHealth();
    for (const listener of this.listeners) {
      try {
        listener(health);
      } catch (e) {
        console.error('Error notifying hardware state listener:', e);
      }
    }
  }

  /**
   * Generates a comprehensive hardware health assessment.
   */
  public getOverallHealth(): HardwareOverallHealth {
    const devices: Record<string, HardwareDeviceState> = {
      printer: this.printer.getState(),
      cashDrawer: this.cashDrawer.getState(),
      scanner: this.scanner.getState(),
      scale: this.scale.getState()
    };

    let directConnectedCount = 0;
    let fallbackCount = 0;
    let unavailableCount = 0;

    for (const d of Object.values(devices)) {
      if (d.isDirectHardware && d.status === 'CONNECTED') {
        directConnectedCount++;
      } else if (d.isFallback) {
        fallbackCount++;
      } else {
        unavailableCount++;
      }
    }

    return {
      timestamp: new Date().toISOString(),
      totalDevices: 4,
      directConnectedCount,
      fallbackCount,
      unavailableCount,
      devices
    };
  }

  /**
   * Helper to print a receipt safely.
   * If physical printer connected -> direct ESC/POS byte stream.
   * If disconnected -> high-fidelity 80mm browser print fallback.
   */
  public async printReceipt(payload: PrintReceiptPayload): Promise<PrintResult> {
    const result = await this.printer.printReceipt(payload);
    this.notifyStateChange();
    return result;
  }

  /**
   * Helper to kick the cash drawer safely.
   */
  public async openCashDrawer(reason: string, cashierName: string): Promise<DrawerKickResult> {
    const result = await this.cashDrawer.openDrawer(reason, cashierName);
    this.notifyStateChange();
    return result;
  }

  /**
   * Helper to parse scanned barcode.
   */
  public parseBarcode(rawBarcode: string): ParsedBarcodeResult {
    return BarcodeParserEngine.parse(rawBarcode);
  }
}
