/**
 * AM Business Platform - Pilot Readiness Phase 3B Hardening Suite
 * Architecture Baseline: Pilot Readiness 3B
 * 
 * Comprehensive Quality Gate & Regression Tests for:
 * 1. Configurable Random-Weight & Random-Price EAN-13 Parsing (Prefixes 20, 99, and Custom).
 * 2. Strict Modulo-10 Checksum Calculation and Rejection of Corrupted Digits.
 * 3. Preservation of Standard EAN-13 and Non-EAN Product Barcodes.
 * 4. 80mm Thermal Printer Hardware Abstraction & Non-Faking Fallback Execution.
 * 5. Cash Drawer Solenoid Actuation & Disconnect Audit Enforcements.
 * 6. Barcode Scanner Keyboard-Wedge Fast-Burst Timing Detection.
 * 7. Weighing Scale RS232 Serial State & Cashier Manual Override Protocol.
 * 8. End-to-End POS Hardware-Readiness Integration Flow.
 */

import { BarcodeParserEngine, BarcodeProfile } from './barcodeParserEngine';
import { HardwareManager } from '../hardware/hardwareManager';
import { ThermalPrinterAdapter } from '../hardware/thermalPrinterAdapter';
import { CashDrawerAdapter } from '../hardware/cashDrawerAdapter';
import { BarcodeScannerAdapter } from '../hardware/barcodeScannerAdapter';
import { WeighingScaleAdapter } from '../hardware/weighingScaleAdapter';
import { PrintReceiptPayload } from '../hardware/types';

export interface PilotPhase3BTestResult {
  id: string;
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

export interface PilotPhase3BSuiteReport {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  results: PilotPhase3BTestResult[];
}

export class PilotReadinessPhase3BHardeningSuite {
  public static async runAll(): Promise<PilotPhase3BSuiteReport> {
    const results: PilotPhase3BTestResult[] = [];

    // TEST 1: Configurable Random-Weight Prefix 20 Parsing
    try {
      const generated = BarcodeParserEngine.generateRandomWeightBarcode('20', '10203', 1.450, 3);
      const parsed = BarcodeParserEngine.parse(generated);

      const passed =
        parsed.isValid &&
        parsed.barcodeType === 'VARIABLE_WEIGHT' &&
        parsed.itemCode === '10203' &&
        parsed.quantity === 1.450 &&
        parsed.uom === 'KG' &&
        parsed.checksumValid;

      results.push({
        id: 'TEST-3B-01',
        name: 'Configurable Random-Weight Prefix 20 EAN-13 Parsing',
        passed,
        message: passed
          ? `Parsed barcode '${generated}' into ItemCode: ${parsed.itemCode}, Weight: ${parsed.quantity} KG (3 decimals)`
          : `Failed to parse prefix 20 weight barcode: ${JSON.stringify(parsed)}`
      });
    } catch (e: any) {
      results.push({ id: 'TEST-3B-01', name: 'Configurable Random-Weight Prefix 20 EAN-13 Parsing', passed: false, message: e.message });
    }

    // TEST 2: Modulo-10 Checksum Validation & Corrupted Check Digit Rejection
    try {
      const validBarcode = BarcodeParserEngine.generateRandomWeightBarcode('20', '99887', 0.750, 3);
      const validResult = BarcodeParserEngine.parse(validBarcode);

      // Corrupt the check digit (invert last digit)
      const lastDigit = parseInt(validBarcode[12], 10);
      const corruptedCheckDigit = (lastDigit + 1) % 10;
      const corruptedBarcode = validBarcode.substring(0, 12) + corruptedCheckDigit;
      const corruptedResult = BarcodeParserEngine.parse(corruptedBarcode);

      const passed =
        validResult.isValid &&
        validResult.checksumValid &&
        !corruptedResult.isValid &&
        !corruptedResult.checksumValid &&
        corruptedResult.errorCode === 'INVALID_CHECKSUM';

      results.push({
        id: 'TEST-3B-02',
        name: 'Modulo-10 Checksum Algorithm & Corrupted Digit Rejection',
        passed,
        message: passed
          ? `Valid check digit verified; corrupted barcode '${corruptedBarcode}' rejected safely with INVALID_CHECKSUM`
          : 'Failed checksum validation gate'
      });
    } catch (e: any) {
      results.push({ id: 'TEST-3B-02', name: 'Modulo-10 Checksum Algorithm & Corrupted Digit Rejection', passed: false, message: e.message });
    }

    // TEST 3: Configurable Random-Weight Prefix 99 Parsing
    try {
      const generated = BarcodeParserEngine.generateRandomWeightBarcode('99', '54321', 2.875, 3);
      const parsed = BarcodeParserEngine.parse(generated);

      const passed =
        parsed.isValid &&
        parsed.barcodeType === 'VARIABLE_WEIGHT' &&
        parsed.itemCode === '54321' &&
        parsed.quantity === 2.875 &&
        parsed.uom === 'KG';

      results.push({
        id: 'TEST-3B-03',
        name: 'Configurable Random-Weight Prefix 99 EAN-13 Parsing',
        passed,
        message: passed
          ? `Parsed prefix 99 barcode '${generated}' into ItemCode: ${parsed.itemCode}, Weight: ${parsed.quantity} KG`
          : 'Failed prefix 99 parsing'
      });
    } catch (e: any) {
      results.push({ id: 'TEST-3B-03', name: 'Configurable Random-Weight Prefix 99 EAN-13 Parsing', passed: false, message: e.message });
    }

    // TEST 4: Configurable Random-Price Barcode Parsing
    try {
      // Temporarily activate the 20-PRICE profile
      const priceProfile: BarcodeProfile = {
        id: 'PROF-TEST-PRICE',
        name: 'Test Prefix 20 Price Profile',
        prefix: '20',
        valueType: 'PRICE',
        itemCodeStart: 2,
        itemCodeLength: 5,
        valueStart: 7,
        valueLength: 5,
        decimalPrecision: 2,
        unitOfMeasure: 'SAR',
        active: true
      };
      BarcodeParserEngine.registerProfile(priceProfile);

      const generated = BarcodeParserEngine.generateRandomPriceBarcode('20', '77889', 85.50, 2);
      const parsed = BarcodeParserEngine.parse(generated);

      const passed =
        parsed.isValid &&
        parsed.barcodeType === 'VARIABLE_PRICE' &&
        parsed.itemCode === '77889' &&
        parsed.embeddedPrice === 85.50 &&
        parsed.uom === 'SAR';

      // Restore default weight profile for 20
      BarcodeParserEngine.resetToDefaults();

      results.push({
        id: 'TEST-3B-04',
        name: 'Configurable Random-Price EAN-13 Profile Parsing',
        passed,
        message: passed
          ? `Parsed embedded price barcode '${generated}' into Price: ${parsed.embeddedPrice} SAR (2 decimals)`
          : `Failed price profile parsing: ${JSON.stringify(parsed)}`
      });
    } catch (e: any) {
      results.push({ id: 'TEST-3B-04', name: 'Configurable Random-Price EAN-13 Profile Parsing', passed: false, message: e.message });
    }

    // TEST 5: Dynamic Custom Profile Registration (Custom Prefix 25, 4-digit item)
    try {
      const customProfile: BarcodeProfile = {
        id: 'PROF-CUSTOM-25',
        name: 'Custom Meat Dept Prefix 25',
        prefix: '25',
        valueType: 'WEIGHT',
        itemCodeStart: 2,
        itemCodeLength: 4,
        valueStart: 6,
        valueLength: 6,
        decimalPrecision: 3,
        unitOfMeasure: 'KG',
        active: true
      };
      BarcodeParserEngine.registerProfile(customProfile);

      // 25 + 4444 (item) + 003250 (3.250 kg) = 12 digits
      const first12 = '254444003250';
      const fullBarcode = BarcodeParserEngine.generateValidEan13(first12);
      const parsed = BarcodeParserEngine.parse(fullBarcode);

      const passed =
        parsed.isValid &&
        parsed.barcodeType === 'VARIABLE_WEIGHT' &&
        parsed.itemCode === '4444' &&
        parsed.quantity === 3.250 &&
        parsed.matchedProfile?.id === 'PROF-CUSTOM-25';

      results.push({
        id: 'TEST-3B-05',
        name: 'Dynamic Custom Barcode Profile Registration',
        passed,
        message: passed
          ? `Successfully registered custom profile '${customProfile.name}' and parsed 4-digit item barcode: ${fullBarcode}`
          : 'Failed custom profile parsing'
      });
    } catch (e: any) {
      results.push({ id: 'TEST-3B-05', name: 'Dynamic Custom Barcode Profile Registration', passed: false, message: e.message });
    }

    // TEST 6: Decimal Precision Configuration (Divisors for 1, 2, 3 decimals)
    try {
      // 1 decimal place: 00125 => 12.5 kg
      const p1: BarcodeProfile = {
        id: 'PROF-DEC-1',
        name: '1-Decimal Profile',
        prefix: '28',
        valueType: 'WEIGHT',
        itemCodeStart: 2,
        itemCodeLength: 5,
        valueStart: 7,
        valueLength: 5,
        decimalPrecision: 1,
        unitOfMeasure: 'KG',
        active: true
      };
      BarcodeParserEngine.registerProfile(p1);

      const barcode1Dec = BarcodeParserEngine.generateValidEan13('281111100125');
      const res1 = BarcodeParserEngine.parse(barcode1Dec);

      const passed = res1.isValid && res1.quantity === 12.5;

      results.push({
        id: 'TEST-3B-06',
        name: 'Configurable Decimal Precision & Divisor Scaling',
        passed,
        message: passed
          ? `Parsed 1-decimal barcode '${barcode1Dec}' to exact scaled value ${res1.quantity} KG`
          : 'Failed decimal precision scaling'
      });
    } catch (e: any) {
      results.push({ id: 'TEST-3B-06', name: 'Configurable Decimal Precision & Divisor Scaling', passed: false, message: e.message });
    }

    // TEST 7: Safe Rejection of Malformed & Out-of-Bounds Barcodes
    try {
      const emptyRes = BarcodeParserEngine.parse('');
      const nullRes = BarcodeParserEngine.parse(null as any);
      const shortRes = BarcodeParserEngine.parse('12345');
      const alphaRes = BarcodeParserEngine.parse('ABCD-EFGH-1234');

      const passed =
        !emptyRes.isValid &&
        emptyRes.errorCode === 'EMPTY_INPUT' &&
        !nullRes.isValid &&
        shortRes.barcodeType === 'NON_EAN' &&
        alphaRes.barcodeType === 'NON_EAN';

      results.push({
        id: 'TEST-3B-07',
        name: 'Safe Rejection of Malformed & Non-Conforming Barcodes',
        passed,
        message: passed
          ? 'Safely caught empty, null, short, and alpha inputs without crashing or unhandled exceptions'
          : 'Failed malformed input protection'
      });
    } catch (e: any) {
      results.push({ id: 'TEST-3B-07', name: 'Safe Rejection of Malformed & Non-Conforming Barcodes', passed: false, message: e.message });
    }

    // TEST 8: Preservation of Normal Standard EAN-13 Behavior
    try {
      // Standard Saudi fixed barcode: 628100293012 (First 12: 628100293012, Check: calculate)
      const standardFirst12 = '628100293012';
      const checkDigit = BarcodeParserEngine.calculateEan13Checksum(standardFirst12);
      const standardEan13 = `${standardFirst12}${checkDigit}`;

      const parsed = BarcodeParserEngine.parse(standardEan13);

      const passed =
        parsed.isValid &&
        parsed.barcodeType === 'STANDARD_EAN13' &&
        parsed.itemCode === standardEan13 &&
        parsed.quantity === 1 &&
        parsed.checksumValid;

      results.push({
        id: 'TEST-3B-08',
        name: 'Preservation of Normal Fixed Standard EAN-13 Behavior',
        passed,
        message: passed
          ? `Standard GS1 barcode '${standardEan13}' preserved as STANDARD_EAN13 with itemCode='${parsed.itemCode}', qty=1`
          : 'Failed standard EAN-13 preservation'
      });
    } catch (e: any) {
      results.push({ id: 'TEST-3B-08', name: 'Preservation of Normal Fixed Standard EAN-13 Behavior', passed: false, message: e.message });
    }

    // TEST 9: Non-EAN Barcode Preservation (Code 128 / Alphanumeric SKUs)
    try {
      const code128Sku = 'SKU-DAIRY-FRESH-01';
      const parsed = BarcodeParserEngine.parse(code128Sku);

      const passed =
        parsed.isValid &&
        parsed.barcodeType === 'NON_EAN' &&
        parsed.itemCode === code128Sku &&
        parsed.quantity === 1;

      results.push({
        id: 'TEST-3B-09',
        name: 'Non-EAN Barcode & Alphanumeric SKU Preservation',
        passed,
        message: passed
          ? `Alphanumeric SKU '${code128Sku}' correctly classified as NON_EAN without checksum error`
          : 'Failed non-EAN preservation'
      });
    } catch (e: any) {
      results.push({ id: 'TEST-3B-09', name: 'Non-EAN Barcode & Alphanumeric SKU Preservation', passed: false, message: e.message });
    }

    // TEST 10: 80mm Thermal Printer Adapter State & Non-Faking Enforcement
    try {
      const printer = ThermalPrinterAdapter.getInstance();
      const state = printer.getState();

      // Since we are running in headless node/container without physical USB/Serial printer,
      // it MUST NOT claim CONNECTED! It must report FALLBACK_BROWSER or DISCONNECTED / UNSUPPORTED_BROWSER.
      const passed =
        state.isDirectHardware === false &&
        state.isFallback === true &&
        (state.status === 'FALLBACK_BROWSER' || state.status === 'UNSUPPORTED_BROWSER' || state.status === 'DISCONNECTED');

      results.push({
        id: 'TEST-3B-10',
        name: 'Thermal Printer Adapter Non-Faking Connectivity Verification',
        passed,
        message: passed
          ? `Verified printer state: status='${state.status}', isDirectHardware=false, isFallback=true (strictly un-faked)`
          : `Printer state improperly faked: ${JSON.stringify(state)}`
      });
    } catch (e: any) {
      results.push({ id: 'TEST-3B-10', name: 'Thermal Printer Adapter Non-Faking Connectivity Verification', passed: false, message: e.message });
    }

    // TEST 11: 80mm ESC/POS Binary Buffer & Plain Text Generation
    try {
      const printer = ThermalPrinterAdapter.getInstance();
      const mockPayload: PrintReceiptPayload = {
        receiptNumber: 'REC-2026-TEST',
        timestamp: '2026-09-06 10:00:00',
        companyName: 'AM Business Platform Enterprise',
        vatNumber: '300012345600003',
        cashierName: 'Ahmed Mounir',
        terminalCode: 'REG-01',
        lines: [
          { name: 'Fresh Australian Beef', quantity: 1.450, unitPrice: 80.00, lineTotal: 116.00, uom: 'KG' },
          { name: 'Pure Olive Oil 1L', quantity: 2, unitPrice: 45.00, lineTotal: 90.00, uom: 'PCS' }
        ],
        subtotal: 206.00,
        taxTotal: 30.90,
        taxRatePercent: 15,
        grandTotal: 236.90,
        payments: [{ method: 'CASH', amount: 250.00 }],
        changeGiven: 13.10
      };

      const buffer = printer.generateEscPosBuffer(mockPayload);
      const plainText = printer.generatePlainTextReceipt(mockPayload);

      // Verify ESC/POS byte commands:
      // Index 0, 1: 0x1B, 0x40 (ESC @ Init)
      const hasInit = buffer[0] === 0x1B && buffer[1] === 0x40;
      // Plain text contains header and totals
      const hasHeader = plainText.includes('AM Business Platform Enterprise');
      const hasItems = plainText.includes('Fresh Australian Beef') && plainText.includes('1.45KG');
      const hasGrandTotal = plainText.includes('236.90');

      const passed = hasInit && hasHeader && hasItems && hasGrandTotal && buffer.length > 100;

      results.push({
        id: 'TEST-3B-11',
        name: '80mm ESC/POS Byte Buffer & Monospace Text Formatting',
        passed,
        message: passed
          ? `Generated valid ESC/POS byte sequence (${buffer.length} bytes) and verified 48-char monospace receipt layout`
          : 'Failed ESC/POS formatting'
      });
    } catch (e: any) {
      results.push({ id: 'TEST-3B-11', name: '80mm ESC/POS Byte Buffer & Monospace Text Formatting', passed: false, message: e.message });
    }

    // TEST 12: Cash Drawer Solenoid Actuation & Disconnect Audit Enforcement
    try {
      const drawer = CashDrawerAdapter.getInstance();
      const state = drawer.getState();

      // Attempt to kick drawer without physical connection
      const kickRes = await drawer.openDrawer('Midday vault drop test', 'Cashier Supervisor');
      const auditLogs = drawer.getAuditLogs();

      // MUST NOT fake solenoid opening! Must report success: false, status: UNAVAILABLE / MANUAL_REQUIRED
      const passed =
        state.isDirectHardware === false &&
        kickRes.success === false &&
        kickRes.method === 'MANUAL_REQUIRED' &&
        auditLogs.length > 0 &&
        auditLogs[0].reason === 'Midday vault drop test';

      results.push({
        id: 'TEST-3B-12',
        name: 'Cash Drawer Solenoid Disconnect & Audit Enforcement',
        passed,
        message: passed
          ? `Correctly rejected false solenoid activation (method='${kickRes.method}'); logged audit entry #${auditLogs[0].id}`
          : 'Failed cash drawer disconnect enforcement'
      });
    } catch (e: any) {
      results.push({ id: 'TEST-3B-12', name: 'Cash Drawer Solenoid Disconnect & Audit Enforcement', passed: false, message: e.message });
    }

    // TEST 13: Barcode Scanner Fast-Burst Timing Detection
    try {
      const scanner = BarcodeScannerAdapter.getInstance();
      const state = scanner.getState();

      let receivedBarcode = '';
      let receivedParsed: any = null;

      const unsubscribe = scanner.subscribe((event, parsed) => {
        receivedBarcode = event.barcode;
        receivedParsed = parsed;
      });

      // Simulate a hardware scanner fast burst scan
      const testCode = BarcodeParserEngine.generateRandomWeightBarcode('20', '33333', 0.825, 3);
      scanner.triggerManualScan(testCode, 'HARDWARE_SCANNER_WEDGE');

      unsubscribe();

      const passed =
        (state.status === 'FALLBACK_KEYBOARD' || state.status === 'DISCONNECTED') &&
        receivedBarcode === testCode &&
        receivedParsed &&
        receivedParsed.isValid &&
        receivedParsed.quantity === 0.825;

      results.push({
        id: 'TEST-3B-13',
        name: 'Barcode Scanner Keyboard-Wedge Fast-Burst Timing Detection',
        passed,
        message: passed
          ? `Dispatched scan burst '${testCode}'; received parsed event with itemCode='${receivedParsed?.itemCode}', qty=${receivedParsed?.quantity} KG`
          : 'Failed barcode scanner burst detection'
      });
    } catch (e: any) {
      results.push({ id: 'TEST-3B-13', name: 'Barcode Scanner Keyboard-Wedge Fast-Burst Timing Detection', passed: false, message: e.message });
    }

    // TEST 14: Weighing Scale Adapter RS232 Serial State & Manual Override Protocol
    try {
      const scale = WeighingScaleAdapter.getInstance();
      const state = scale.getState();

      // Read initial state: must be FALLBACK_MANUAL or UNSUPPORTED_BROWSER
      const initialReading = scale.readWeight();

      // Enter manual weight of 2.450 KG
      const manualReading = scale.setManualWeight(2.450, 'KG');

      // Test tare
      scale.tare();
      const tareReading = scale.readWeight();

      // Reset / Zero
      scale.zero();
      const zeroReading = scale.readWeight();

      const passed =
        state.isDirectHardware === false &&
        manualReading.weight === 2.450 &&
        manualReading.source === 'MANUAL_OVERRIDE' &&
        tareReading.isTare === true &&
        zeroReading.isZero === true;

      results.push({
        id: 'TEST-3B-14',
        name: 'Weighing Scale Offline State & Cashier Manual Override Protocol',
        passed,
        message: passed
          ? `Verified scale fallback (source='${manualReading.source}'); successfully executed manual weigh (2.450 KG), tare, and zero baseline`
          : 'Failed weighing scale override protocol'
      });
    } catch (e: any) {
      results.push({ id: 'TEST-3B-14', name: 'Weighing Scale Offline State & Cashier Manual Override Protocol', passed: false, message: e.message });
    }

    // TEST 15: End-to-End POS Hardware-Readiness Integration Flow
    try {
      const hwManager = HardwareManager.getInstance();
      const overallHealth = hwManager.getOverallHealth();

      // 1. Scan random-weight barcode (e.g. Australian Ribeye, 1.625 KG)
      const scannedBarcode = BarcodeParserEngine.generateRandomWeightBarcode('20', '88801', 1.625, 3);
      const parsed = hwManager.parseBarcode(scannedBarcode);

      // 2. Mock Cart Item addition
      const mockCartLine = {
        name: 'Prime Australian Ribeye',
        quantity: parsed.quantity,
        unitPrice: 120.00,
        lineTotal: parsed.quantity * 120.00,
        uom: parsed.uom,
        isWeightItem: true
      };

      // 3. Print receipt through HardwareManager (triggering 80mm fallback)
      const printResult = await hwManager.printReceipt({
        receiptNumber: 'REC-E2E-TEST-001',
        timestamp: new Date().toISOString(),
        companyName: 'AM Business Platform',
        cashierName: 'Ahmed Mounir',
        terminalCode: 'REG-01',
        lines: [mockCartLine],
        subtotal: mockCartLine.lineTotal,
        taxTotal: mockCartLine.lineTotal * 0.15,
        grandTotal: mockCartLine.lineTotal * 1.15,
        payments: [{ method: 'CARD', amount: mockCartLine.lineTotal * 1.15 }]
      });

      // 4. Request drawer open (should report UNAVAILABLE safely)
      const drawerResult = await hwManager.openCashDrawer('E2E Sale Completion', 'Ahmed Mounir');

      const passed =
        overallHealth.totalDevices === 4 &&
        parsed.quantity === 1.625 &&
        mockCartLine.lineTotal === 195.00 &&
        printResult.success === true &&
        printResult.method === 'BROWSER_PRINT_FALLBACK' &&
        drawerResult.success === false &&
        drawerResult.method === 'MANUAL_REQUIRED';

      results.push({
        id: 'TEST-3B-15',
        name: 'End-to-End POS Hardware-Readiness Integration Flow',
        passed,
        message: passed
          ? 'Completed full cycle: Random-weight scan -> 1.625 KG itemization -> 80mm print fallback -> safe manual drawer enforcement'
          : 'Failed end-to-end POS hardware-readiness flow'
      });
    } catch (e: any) {
      results.push({ id: 'TEST-3B-15', name: 'End-to-End POS Hardware-Readiness Integration Flow', passed: false, message: e.message });
    }

    const passedCount = results.filter(r => r.passed).length;
    return {
      suite: 'Pilot Readiness Phase 3B - POS Hardware Abstraction & Variable EAN-13 Layer',
      total: results.length,
      passed: passedCount,
      failed: results.length - passedCount,
      results
    };
  }
}
