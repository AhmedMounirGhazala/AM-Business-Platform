/**
 * AM Business Platform - POS Hardware Abstraction Layer (HAL) & Peripherals Hub
 * Architecture Baseline: Pilot Readiness 3B
 * 
 * Provides:
 * - Real-time diagnostics and status for 80mm Thermal Printer, Cash Drawer, Barcode Scanner, and Weighing Scale.
 * - Non-faking hardware communication with direct WebUSB/WebSerial pairing & browser fallback execution.
 * - Configurable Random-Weight & Random-Price EAN-13 Profile Management.
 * - Interactive Barcode Parser Tester & Simulator.
 * - Cash Drawer Solenoid Actuation & Audit Trail.
 */

import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Barcode, 
  Scale, 
  Cpu, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Plus, 
  Sliders, 
  Terminal, 
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  Layers
} from 'lucide-react';
import { HardwareManager, HardwareOverallHealth } from '../../hardware/hardwareManager';
import { ThermalPrinterAdapter } from '../../hardware/thermalPrinterAdapter';
import { CashDrawerAdapter, DrawerAuditLog } from '../../hardware/cashDrawerAdapter';
import { BarcodeScannerAdapter } from '../../hardware/barcodeScannerAdapter';
import { WeighingScaleAdapter } from '../../hardware/weighingScaleAdapter';
import { BarcodeParserEngine, BarcodeProfile, ParsedBarcodeResult } from '../../engine/barcodeParserEngine';

interface PosHardwareHubProps {
  isAr: boolean;
  onSendToCart?: (itemCode: string, quantity: number, price?: number, uom?: string) => void;
}

export const PosHardwareHub: React.FC<PosHardwareHubProps> = ({ isAr, onSendToCart }) => {
  const hwManager = HardwareManager.getInstance();
  const printerAdapter = ThermalPrinterAdapter.getInstance();
  const drawerAdapter = CashDrawerAdapter.getInstance();
  const scannerAdapter = BarcodeScannerAdapter.getInstance();
  const scaleAdapter = WeighingScaleAdapter.getInstance();

  const [health, setHealth] = useState<HardwareOverallHealth>(hwManager.getOverallHealth());
  const [profiles, setProfiles] = useState<BarcodeProfile[]>(BarcodeParserEngine.getProfiles());
  const [drawerLogs, setDrawerLogs] = useState<DrawerAuditLog[]>(drawerAdapter.getAuditLogs());
  const [scaleReading, setScaleReading] = useState(scaleAdapter.readWeight());

  // Test states
  const [testBarcode, setTestBarcode] = useState<string>('2010203014506');
  const [parsedTestResult, setParsedTestResult] = useState<ParsedBarcodeResult | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [manualWeightInput, setManualWeightInput] = useState<number>(1.250);

  // New Profile Form
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [newPrefix, setNewPrefix] = useState('28');
  const [newName, setNewName] = useState('Custom Bakery Weight Profile');
  const [newValueType, setNewValueType] = useState<'WEIGHT' | 'PRICE'>('WEIGHT');
  const [newItemDigits, setNewItemDigits] = useState(5);
  const [newValueDigits, setNewValueDigits] = useState(5);
  const [newDecimals, setNewDecimals] = useState(3);
  const [newUom, setNewUom] = useState('KG');

  useEffect(() => {
    const unsub = hwManager.subscribe((newHealth) => {
      setHealth(newHealth);
      setDrawerLogs(drawerAdapter.getAuditLogs());
      setScaleReading(scaleAdapter.readWeight());
    });
    return () => unsub();
  }, []);

  const refreshAll = () => {
    setHealth(hwManager.getOverallHealth());
    setProfiles(BarcodeParserEngine.getProfiles());
    setDrawerLogs(drawerAdapter.getAuditLogs());
    setScaleReading(scaleAdapter.readWeight());
  };

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 5000);
  };

  // 1. Printer Test
  const handleTestPrint = async () => {
    const res = await hwManager.printReceipt({
      receiptNumber: `TEST-80MM-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleString(),
      companyName: 'AM Business Platform Enterprise',
      branchName: 'Main Flagship Branch - Terminal 01',
      vatNumber: '300012345600003',
      cashierName: 'Ahmed Mounir',
      terminalCode: 'REG-01',
      lines: [
        { name: 'Australian Chilled Ribeye', quantity: 1.450, unitPrice: 120.00, lineTotal: 174.00, uom: 'KG' },
        { name: 'Al-Qassim Premium Dates', quantity: 2.500, unitPrice: 45.00, lineTotal: 112.50, uom: 'KG' },
        { name: 'Olive Oil Extra Virgin 1L', quantity: 1, unitPrice: 55.00, lineTotal: 55.00, uom: 'PCS' }
      ],
      subtotal: 341.50,
      taxTotal: 51.23,
      taxRatePercent: 15,
      grandTotal: 392.73,
      payments: [{ method: 'CASH', amount: 400.00 }],
      changeGiven: 7.27
    });

    showNotification(
      `Print Test: ${res.method} (${res.bytesCount} bytes) - ${res.message}`
    );
    refreshAll();
  };

  // 2. Drawer Kick Test
  const handleTestDrawerKick = async () => {
    const res = await hwManager.openCashDrawer('Diagnostic Solenoid Actuation Test', 'Store Supervisor');
    showNotification(
      res.success
        ? `Cash Drawer Solenoid Triggered: ${res.message}`
        : `Physical Drawer Offline: ${res.message}`
    );
    refreshAll();
  };

  // 3. Connect Direct WebUSB Printer
  const handleConnectUsbPrinter = async () => {
    const res = await printerAdapter.connectDirectHardware('USB');
    showNotification(res.message);
    refreshAll();
  };

  // 4. Connect Direct Serial Scale
  const handleConnectSerialScale = async () => {
    const res = await scaleAdapter.connectDirectSerial();
    showNotification(res.message);
    refreshAll();
  };

  // 5. Scale Tare & Zero
  const handleTareScale = () => {
    scaleAdapter.tare();
    setScaleReading(scaleAdapter.readWeight());
    showNotification('Scale Container Tared to 0.000 KG.');
  };

  const handleZeroScale = () => {
    scaleAdapter.zero();
    setScaleReading(scaleAdapter.readWeight());
    showNotification('Scale Baseline Reset to Zero.');
  };

  const handleApplyManualWeight = () => {
    const reading = scaleAdapter.setManualWeight(manualWeightInput, 'KG');
    setScaleReading(reading);
    showNotification(`Manual weight set to ${reading.weight} KG (Cashier Override Mode).`);
  };

  // 6. Test Barcode Parsing
  const handleParseTestBarcode = (codeToParse?: string) => {
    const target = codeToParse || testBarcode;
    const res = BarcodeParserEngine.parse(target);
    setParsedTestResult(res);
  };

  // 7. Toggle Barcode Profile
  const handleToggleProfile = (id: string, currentActive: boolean) => {
    BarcodeParserEngine.setProfileActive(id, !currentActive);
    setProfiles(BarcodeParserEngine.getProfiles());
    showNotification(`Profile ${id} ${!currentActive ? 'activated' : 'deactivated'}.`);
  };

  // 8. Add New Profile
  const handleSaveNewProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const newProfile: BarcodeProfile = {
      id: `PROF-${newPrefix}-${newValueType}`,
      name: newName,
      prefix: newPrefix,
      valueType: newValueType,
      itemCodeStart: newPrefix.length,
      itemCodeLength: newItemDigits,
      valueStart: newPrefix.length + newItemDigits,
      valueLength: newValueDigits,
      decimalPrecision: newDecimals,
      unitOfMeasure: newUom,
      active: true
    };
    BarcodeParserEngine.registerProfile(newProfile);
    setProfiles(BarcodeParserEngine.getProfiles());
    setIsAddingProfile(false);
    showNotification(`New Barcode Profile '${newProfile.name}' registered successfully.`);
  };

  const handleResetProfiles = () => {
    BarcodeParserEngine.resetToDefaults();
    setProfiles(BarcodeParserEngine.getProfiles());
    showNotification('Barcode profiles reset to standard system defaults.');
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Alert */}
      {actionNotice && (
        <div className="p-3 rounded-xl bg-[#0B1F3A] text-white border border-[#F28C28] text-xs font-mono flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#F28C28] shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Header & Health Score */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#0B1F3A]/10 text-[#0B1F3A] dark:text-[#F28C28] font-mono text-[11px] font-bold border border-[#F28C28]/30">
              PILOT READINESS 3B
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">Hardware Abstraction Layer (HAL) & EAN-13 Engine</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[#F28C28]" />
            <span>{isAr ? 'مركز إدارة العتاد والأجهزة الطرفية' : 'POS Peripherals & Hardware Abstraction Hub'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr 
              ? 'إدارة محولات الطابعات الحرارية، الأدراج النقدية، الموازين وقوارئ الباركود مع عدم تزييف الاتصال' 
              : 'Direct WebUSB/WebSerial peripheral controllers, non-faking status enforcement, and browser fallbacks.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshAll}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isAr ? 'تحديث الحالة' : 'Refresh State'}</span>
          </button>
        </div>
      </div>

      {/* 4 Peripherals Live Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Device 1: 80mm Thermal Printer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-xl bg-[#0B1F3A]/5 text-[#0B1F3A] dark:text-[#F28C28] dark:bg-[#F28C28]/10">
                <Printer className="w-5 h-5" />
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                health.devices.printer.status === 'CONNECTED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {health.devices.printer.status}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2">80mm ESC/POS Printer</h3>
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{health.devices.printer.details}</p>
            <div className="mt-2 text-[10px] font-mono text-slate-400">
              Transport: <span className="font-bold text-slate-700 dark:text-slate-300">{health.devices.printer.transport}</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleTestPrint}
              className="w-full py-1.5 rounded-xl bg-[#0B1F3A] hover:bg-[#153258] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition border border-[#F28C28]/30"
            >
              <Printer className="w-3.5 h-3.5 text-[#F28C28]" />
              <span>Test 80mm Print</span>
            </button>
            <button
              onClick={handleConnectUsbPrinter}
              className="w-full py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Pair WebUSB Device</span>
            </button>
          </div>
        </div>

        {/* Device 2: Cash Drawer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-xl bg-[#0B1F3A]/5 text-[#0B1F3A] dark:text-[#F28C28] dark:bg-[#F28C28]/10">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                health.devices.cashDrawer.status === 'CONNECTED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                {health.devices.cashDrawer.status}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2">Cash Drawer</h3>
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{health.devices.cashDrawer.details}</p>
            <div className="mt-2 text-[10px] font-mono text-slate-400">
              Link: <span className="font-bold text-slate-700 dark:text-slate-300">RJ11 via ESC/POS Relay</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleTestDrawerKick}
              className="w-full py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Test Drawer Kick</span>
            </button>
            <div className="text-[10px] text-center text-slate-400 font-mono">
              Strict: No faking when unplugged
            </div>
          </div>
        </div>

        {/* Device 3: Barcode Scanner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-xl bg-[#0B1F3A]/5 text-[#0B1F3A] dark:text-[#F28C28] dark:bg-[#F28C28]/10">
                <Barcode className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {health.devices.scanner.status}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2">1D/2D Barcode Scanner</h3>
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{health.devices.scanner.details}</p>
            <div className="mt-2 text-[10px] font-mono text-slate-400">
              Inter-key delay: <span className="font-bold text-slate-700 dark:text-slate-300">&lt;45ms burst</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => handleParseTestBarcode('2010203014506')}
              className="w-full py-1.5 rounded-xl bg-[#0B1F3A] hover:bg-[#153258] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition border border-[#F28C28]/30"
            >
              <Barcode className="w-3.5 h-3.5 text-[#F28C28]" />
              <span>Test Burst Decode</span>
            </button>
            <div className="text-[10px] text-center text-emerald-600 font-mono font-bold">
              ● Ready for Hardware Scan
            </div>
          </div>
        </div>

        {/* Device 4: Countertop Weighing Scale */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-xl bg-[#0B1F3A]/5 text-[#0B1F3A] dark:text-[#F28C28] dark:bg-[#F28C28]/10">
                <Scale className="w-5 h-5" />
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                health.devices.scale.status === 'CONNECTED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {health.devices.scale.status}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2">Counter Weighing Scale</h3>
            <div className="my-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-center font-mono">
              <span className="text-xl font-black text-[#0B1F3A] dark:text-[#F28C28]">{scaleReading.weight.toFixed(3)}</span>
              <span className="text-xs ml-1 text-slate-500 font-bold">{scaleReading.uom}</span>
              <div className="text-[9px] text-slate-400">Source: {scaleReading.source}</div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleTareScale}
                className="py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Tare
              </button>
              <button
                onClick={handleZeroScale}
                className="py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Zero
              </button>
            </div>
            <button
              onClick={handleConnectSerialScale}
              className="w-full py-1.5 rounded-xl bg-[#0B1F3A] hover:bg-[#153258] text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition border border-[#F28C28]/30"
            >
              <ExternalLink className="w-3 h-3 text-[#F28C28]" />
              <span>Pair RS232 Serial</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Barcode Parser Simulator */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Barcode className="w-4 h-4 text-[#F28C28]" />
              <span>{isAr ? 'مختبر اختبار وتحليل الباركود المتغير (EAN-13 Parsing Simulator)' : 'Variable-Weight / Price EAN-13 Parser & Simulator'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Supports prefixes 20, 99, custom prefixes, Modulo-10 checksum check, and weight/price extraction.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const code = BarcodeParserEngine.generateRandomWeightBarcode('20', '10203', 1.450, 3);
                setTestBarcode(code);
                handleParseTestBarcode(code);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#0B1F3A]/5 hover:bg-[#0B1F3A]/10 text-[#0B1F3A] dark:text-[#F28C28] text-xs font-mono font-bold cursor-pointer"
            >
              Gen 20-Weight (1.450 KG)
            </button>
            <button
              onClick={() => {
                const code = BarcodeParserEngine.generateRandomWeightBarcode('99', '54321', 2.875, 3);
                setTestBarcode(code);
                handleParseTestBarcode(code);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#0B1F3A]/5 hover:bg-[#0B1F3A]/10 text-[#0B1F3A] dark:text-[#F28C28] text-xs font-mono font-bold cursor-pointer"
            >
              Gen 99-Weight (2.875 KG)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={testBarcode}
                onChange={(e) => setTestBarcode(e.target.value)}
                placeholder="Enter 13-digit EAN barcode or scan..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white"
              />
              <button
                onClick={() => handleParseTestBarcode()}
                className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#153258] text-white font-bold text-xs cursor-pointer border border-[#F28C28]/30"
              >
                Decode
              </button>
            </div>

            {/* Quick manual weight setter */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Cashier Scale Manual Weight Fallback:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.005"
                  value={manualWeightInput}
                  onChange={(e) => setManualWeightInput(parseFloat(e.target.value) || 0)}
                  className="w-32 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                />
                <span className="font-bold font-mono text-slate-500">KG</span>
                <button
                  onClick={handleApplyManualWeight}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                >
                  Set Weight
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            {parsedTestResult ? (
              <div className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
                parsedTestResult.isValid
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                  : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-500/30 text-rose-900 dark:text-rose-300'
              }`}>
                <div className="flex justify-between items-center font-bold">
                  <span>Type: {parsedTestResult.barcodeType}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    parsedTestResult.checksumValid ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                  }`}>
                    {parsedTestResult.checksumValid ? 'Checksum VALID (Modulo-10)' : 'Checksum INVALID'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-200 dark:border-emerald-800">
                  <div>Item Code: <strong className="text-slate-900 dark:text-white">{parsedTestResult.itemCode}</strong></div>
                  <div>Quantity: <strong className="text-slate-900 dark:text-white">{parsedTestResult.quantity} {parsedTestResult.uom}</strong></div>
                  {parsedTestResult.embeddedPrice !== undefined && (
                    <div>Embedded Price: <strong className="text-slate-900 dark:text-white">{parsedTestResult.embeddedPrice} {parsedTestResult.uom}</strong></div>
                  )}
                  <div>Expected Check: {parsedTestResult.expectedCheckDigit} (Actual: {parsedTestResult.actualCheckDigit})</div>
                </div>

                {onSendToCart && parsedTestResult.isValid && (
                  <div className="pt-2">
                    <button
                      onClick={() => onSendToCart(parsedTestResult.itemCode, parsedTestResult.quantity, parsedTestResult.embeddedPrice, parsedTestResult.uom)}
                      className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      + Add Item #{parsedTestResult.itemCode} to POS Cart ({parsedTestResult.quantity} {parsedTestResult.uom})
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 font-mono">
                Click Decode or generate a sample barcode to test the real-time parser.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barcode Profiles Configuration Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#F28C28]" />
              <span>{isAr ? 'ملفات تعريف وقواعد الباركود المتغير (Barcode Profiles)' : 'Configured EAN-13 Barcode Profiles'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Define which prefixes encode item weights or prices and set decimal precision rules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingProfile(!isAddingProfile)}
              className="px-3 py-1.5 rounded-xl bg-[#0B1F3A] hover:bg-[#153258] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-[#F28C28]/30"
            >
              <Plus className="w-3.5 h-3.5 text-[#F28C28]" />
              <span>Add Custom Profile</span>
            </button>
            <button
              onClick={handleResetProfiles}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Reset Defaults
            </button>
          </div>
        </div>

        {/* Add Profile Sub-form */}
        {isAddingProfile && (
          <form onSubmit={handleSaveNewProfile} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white">Create New Barcode Profile</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Prefix (e.g. 20, 99, 28)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={newPrefix}
                  onChange={(e) => setNewPrefix(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Value Type</label>
                <select
                  value={newValueType}
                  onChange={(e) => setNewValueType(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                >
                  <option value="WEIGHT">Weight (KG/G)</option>
                  <option value="PRICE">Price (SAR)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Item Code Digits</label>
                <input
                  type="number"
                  min={3}
                  max={6}
                  value={newItemDigits}
                  onChange={(e) => setNewItemDigits(parseInt(e.target.value) || 5)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Decimal Precision</label>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={newDecimals}
                  onChange={(e) => setNewDecimals(parseInt(e.target.value) || 3)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Profile Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingProfile(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#0B1F3A] text-white font-bold text-xs cursor-pointer border border-[#F28C28]"
              >
                Save Profile
              </button>
            </div>
          </form>
        )}

        {/* Profiles Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Status</th>
                <th className="p-3">Prefix</th>
                <th className="p-3">Profile Name</th>
                <th className="p-3">Value Type</th>
                <th className="p-3">Item Digits</th>
                <th className="p-3">Decimals</th>
                <th className="p-3">UOM</th>
                <th className="p-3 text-right">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {profiles.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {p.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{p.prefix}</td>
                  <td className="p-3 font-sans font-semibold text-slate-800 dark:text-slate-200">{p.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      p.valueType === 'WEIGHT' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {p.valueType}
                    </span>
                  </td>
                  <td className="p-3">{p.itemCodeLength} digits</td>
                  <td className="p-3">{p.decimalPrecision} decimals</td>
                  <td className="p-3">{p.unitOfMeasure}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleToggleProfile(p.id, p.active)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                        p.active
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {p.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cash Drawer Solenoid Audit Logs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-rose-500" />
          <span>{isAr ? 'سجل رقابة تشغيل الدرج النقدي (Cash Drawer Audit Trail)' : 'Cash Drawer Solenoid Trigger Audit Logs'}</span>
        </h3>
        <p className="text-xs text-slate-500">
          Every physical kick attempt is audited with cashier name, method, timestamp, and hardware response.
        </p>

        <div className="overflow-x-auto max-h-48">
          <table className="w-full text-xs text-left font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] uppercase">
              <tr>
                <th className="p-2">Timestamp</th>
                <th className="p-2">Cashier</th>
                <th className="p-2">Reason</th>
                <th className="p-2">Method</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
              {drawerLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">
                    No drawer kick events recorded in this session.
                  </td>
                </tr>
              ) : (
                drawerLogs.map(log => (
                  <tr key={log.id}>
                    <td className="p-2 text-slate-500">{log.timestamp.replace('T', ' ').substring(0, 19)}</td>
                    <td className="p-2 font-bold text-slate-900 dark:text-white">{log.triggeredBy}</td>
                    <td className="p-2 text-slate-600 dark:text-slate-300">{log.reason}</td>
                    <td className="p-2 text-indigo-600">{log.result.method}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.result.success ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {log.result.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
