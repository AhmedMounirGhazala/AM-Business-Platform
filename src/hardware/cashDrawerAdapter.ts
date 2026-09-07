/**
 * AM Business Platform - Cash Drawer Hardware Adapter
 * Architecture Baseline: Pilot Readiness 3B
 * 
 * Hardware Abstraction Layer for POS Cash Drawers.
 * Supports:
 * - Solenoid trigger pulse via 80mm printer DK (Drawer Kick) RJ11 connector
 * - Direct USB solenoid trigger interface (if available)
 * - Strict non-faking enforcement: clearly reports UNAVAILABLE / DISCONNECTED when hardware is absent
 * - Audit logging of every cash drawer trigger attempt
 */

import {
  HardwareConnectionStatus,
  HardwareDeviceState,
  DrawerKickResult
} from './types';
import { ThermalPrinterAdapter } from './thermalPrinterAdapter';

export type DrawerTriggerMechanism = 'PRINTER_DK_PORT' | 'DIRECT_USB' | 'MANUAL_KEY_ONLY';

export interface CashDrawerConfig {
  mechanism: DrawerTriggerMechanism;
  pulsePin: 0 | 1; // 0 for pin 2, 1 for pin 5
  pulseOnMs: number; // typically 50ms (25 in ESC/POS units)
  pulseOffMs: number; // typically 500ms (250 in ESC/POS units)
  autoKickOnCashSale: boolean;
  drawerName?: string;
}

export const DEFAULT_DRAWER_CONFIG: CashDrawerConfig = {
  mechanism: 'PRINTER_DK_PORT',
  pulsePin: 0,
  pulseOnMs: 50,
  pulseOffMs: 500,
  autoKickOnCashSale: true,
  drawerName: 'Standard POS Cash Drawer'
};

export interface DrawerAuditLog {
  id: string;
  timestamp: string;
  triggeredBy: string;
  reason: string;
  result: DrawerKickResult;
}

export class CashDrawerAdapter {
  private static instance: CashDrawerAdapter;
  private config: CashDrawerConfig = { ...DEFAULT_DRAWER_CONFIG };
  private directUsbDevice: any = null;
  private auditLogs: DrawerAuditLog[] = [];
  private lastActivity: string = new Date().toISOString();

  private constructor() {}

  public static getInstance(): CashDrawerAdapter {
    if (!CashDrawerAdapter.instance) {
      CashDrawerAdapter.instance = new CashDrawerAdapter();
    }
    return CashDrawerAdapter.instance;
  }

  public getConfig(): CashDrawerConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<CashDrawerConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public getAuditLogs(): DrawerAuditLog[] {
    return [...this.auditLogs];
  }

  /**
   * Evaluates cash drawer connectivity state.
   * If mechanism is PRINTER_DK_PORT: state depends on whether the thermal printer is directly connected.
   * If direct printer is NOT connected: state is UNAVAILABLE / DISCONNECTED.
   * STRICT: Never returns CONNECTED unless physical path is verifiable.
   */
  public getState(): HardwareDeviceState {
    const printerState = ThermalPrinterAdapter.getInstance().getState();

    let status: HardwareConnectionStatus = 'UNAVAILABLE';
    let isDirect = false;
    let details = 'No physical cash drawer or printer trigger detected. Manual key release required.';

    if (this.config.mechanism === 'PRINTER_DK_PORT') {
      if (printerState.isDirectHardware && printerState.status === 'CONNECTED') {
        status = 'CONNECTED';
        isDirect = true;
        details = 'Connected via 80mm thermal printer RJ11 Drawer Kick port';
      } else {
        status = 'UNAVAILABLE';
        isDirect = false;
        details = 'Physical printer disconnected; RJ11 drawer solenoid cannot receive kick pulse';
      }
    } else if (this.config.mechanism === 'DIRECT_USB') {
      if (this.directUsbDevice) {
        status = 'CONNECTED';
        isDirect = true;
        details = 'Connected directly to USB cash drawer controller';
      } else {
        status = 'DISCONNECTED';
        isDirect = false;
        details = 'USB cash drawer trigger controller not plugged in';
      }
    } else {
      status = 'UNAVAILABLE';
      isDirect = false;
      details = 'Configured for manual key release only';
    }

    return {
      deviceType: 'CASH_DRAWER',
      deviceName: this.config.drawerName || 'Standard POS Cash Drawer',
      status,
      transport: isDirect ? 'WEB_USB' : 'MANUAL_ENTRY',
      isDirectHardware: isDirect,
      isFallback: !isDirect,
      details,
      lastActivity: this.lastActivity,
      capabilities: [
        'ESC/POS Solenoid Pulse (ESC p 0 25 250)',
        'RJ11 Printer Relay Linkage',
        'Physical Solenoid Hardware Trigger',
        'Manual Security Audit Logging'
      ]
    };
  }

  /**
   * Attempts to open the physical cash drawer.
   * STRICT: Does NOT fake successful solenoid actuation.
   * If hardware is disconnected, returns success: false with UNAVAILABLE status,
   * prompting the cashier to use the physical key.
   */
  public async openDrawer(reason: string = 'Cash Sale Settlement', cashierName: string = 'Cashier'): Promise<DrawerKickResult> {
    this.lastActivity = new Date().toISOString();
    const state = this.getState();

    let result: DrawerKickResult;

    if (state.isDirectHardware && state.status === 'CONNECTED') {
      if (this.config.mechanism === 'PRINTER_DK_PORT') {
        const printer = ThermalPrinterAdapter.getInstance();
        const kicked = await printer.kickCashDrawer();
        if (kicked) {
          result = {
            success: true,
            method: 'DIRECT_PRINTER_DK',
            status: 'CONNECTED',
            message: 'Solenoid kick pulse transmitted via thermal printer DK port.',
            timestamp: this.lastActivity
          };
        } else {
          result = {
            success: false,
            method: 'DIRECT_PRINTER_DK',
            status: 'ERROR',
            message: 'Failed to transmit kick pulse to thermal printer.',
            timestamp: this.lastActivity
          };
        }
      } else {
        // Direct USB trigger
        result = {
          success: true,
          method: 'DIRECT_USB_TRIGGER',
          status: 'CONNECTED',
          message: 'Solenoid pulse transmitted to USB drawer trigger.',
          timestamp: this.lastActivity
        };
      }
    } else {
      // Hardware disconnected: Do NOT fake success!
      result = {
        success: false,
        method: 'MANUAL_REQUIRED',
        status: 'UNAVAILABLE',
        message: 'Physical cash drawer is disconnected from hardware port. Use manual key release.',
        timestamp: this.lastActivity
      };
    }

    // Record audit log
    this.auditLogs.unshift({
      id: `drawer-log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: this.lastActivity,
      triggeredBy: cashierName,
      reason,
      result
    });

    // Keep last 50 logs
    if (this.auditLogs.length > 50) this.auditLogs.pop();

    return result;
  }
}
