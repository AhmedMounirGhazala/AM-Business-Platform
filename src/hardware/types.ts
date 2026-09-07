/**
 * AM Business Platform - POS Hardware Abstraction Layer (HAL) Types
 * Architecture Baseline: Pilot Readiness 3B
 * 
 * Defines standardized device contracts, transports, and connection lifecycle
 * states across 80mm Thermal Printers, Cash Drawers, Barcode Scanners, and Weighing Scales.
 */

export type HardwareDeviceType =
  | 'THERMAL_PRINTER'
  | 'CASH_DRAWER'
  | 'BARCODE_SCANNER'
  | 'WEIGHING_SCALE';

export type HardwareConnectionStatus =
  | 'CONNECTED'             // Real direct hardware connection is verified & active
  | 'DISCONNECTED'          // Direct hardware connection not established
  | 'CONNECTING'            // Connection handshake in progress
  | 'UNAVAILABLE'           // Hardware is physically absent or device port rejected
  | 'FALLBACK_BROWSER'      // Direct thermal printer not connected; using browser print preview fallback
  | 'FALLBACK_KEYBOARD'     // Direct scanner not connected; active keyboard wedge listening fallback
  | 'FALLBACK_MANUAL'       // Direct scale not connected; cashier manual weight entry fallback
  | 'UNSUPPORTED_BROWSER'   // Browser does not support WebUSB / WebSerial / WebHID
  | 'ERROR';                // Device I/O failure

export type TransportType =
  | 'WEB_USB'
  | 'WEB_SERIAL'
  | 'WEB_HID'
  | 'NETWORK_RAW'
  | 'BROWSER_FALLBACK'
  | 'KEYBOARD_WEDGE'
  | 'MANUAL_ENTRY';

export interface HardwareDeviceState {
  deviceType: HardwareDeviceType;
  deviceName: string;
  status: HardwareConnectionStatus;
  transport: TransportType;
  isDirectHardware: boolean; // CRITICAL: Only true if real physical port/device is open
  isFallback: boolean;
  details: string;
  lastActivity?: string;
  errorCode?: string;
  capabilities: string[];
}

export interface PrintReceiptPayload {
  receiptNumber: string;
  orderNumber?: string;
  timestamp: string;
  companyName: string;
  companyNameAr?: string;
  vatNumber?: string;
  branchName?: string;
  cashierName: string;
  terminalCode: string;
  lines: Array<{
    name: string;
    nameAr?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    uom?: string;
    taxRate?: number;
    isWeightItem?: boolean;
  }>;
  subtotal: number;
  taxTotal: number;
  taxRatePercent?: number;
  discountTotal?: number;
  grandTotal: number;
  payments: Array<{
    method: 'CASH' | 'CARD' | 'MADA' | 'VISA' | 'WALLET' | 'SPLIT' | 'OTHER';
    amount: number;
  }>;
  changeGiven?: number;
  qrPayload?: string; // ZATCA Phase 2 TLV base64 string or verification URL
  footerMessage?: string;
}

export interface PrintResult {
  success: boolean;
  method: 'DIRECT_ESC_POS' | 'BROWSER_PRINT_FALLBACK' | 'SIMULATED_BUFFER';
  status: HardwareConnectionStatus;
  bytesCount?: number;
  message: string;
  timestamp: string;
}

export interface DrawerKickResult {
  success: boolean;
  method: 'DIRECT_PRINTER_DK' | 'DIRECT_USB_TRIGGER' | 'MANUAL_REQUIRED';
  status: HardwareConnectionStatus;
  message: string;
  timestamp: string;
}

export interface ScaleReading {
  weight: number;
  uom: 'KG' | 'G' | 'LB';
  isStable: boolean;
  isOverCapacity: boolean;
  isZero: boolean;
  isTare: boolean;
  tareWeight?: number;
  source: 'HARDWARE_SCALE' | 'MANUAL_OVERRIDE';
  timestamp: string;
}

export interface ScannedBarcodeEvent {
  barcode: string;
  source: 'HARDWARE_SCANNER_WEDGE' | 'HARDWARE_SCANNER_HID' | 'MANUAL_TYPED';
  timestamp: string;
  rawDurationMs?: number;
}
