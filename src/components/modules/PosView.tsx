/**
 * AM Business Platform - Phase 3.1 Point of Sale (POS) & Retail Management
 * Architecture Baseline: v2.8
 * Fully integrated with Registers, Shifts, Split Payments, ZATCA QR & Treasury Events
 */

import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Barcode, 
  ShoppingCart, 
  DollarSign, 
  CheckCircle2, 
  RotateCcw, 
  Lock, 
  CreditCard, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Sparkles,
  Wifi,
  Receipt,
  QrCode,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  X,
  Printer,
  FileCheck,
  AlertCircle,
  Database,
  WifiOff,
  RefreshCw,
  Scale,
  Cpu,
  Zap,
  Sliders,
  Monitor,
  ExternalLink
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import {
  POSRegister,
  POSShift,
  POSReceipt,
  SalesReturn,
  POSReceiptLine,
  PaymentTransaction,
  OfflineTransactionQueueItem
} from '../../types/sales';
import { OfflinePosSyncPanel } from './OfflinePosSyncPanel';
import { OfflinePosManager, OfflineSyncSummary } from '../../services/offlinePosManager';
import { OfflinePosIndexedDbService } from '../../services/offlinePosIndexedDb';
import { HardwareManager, HardwareOverallHealth } from '../../hardware/hardwareManager';
import { BarcodeParserEngine } from '../../engine/barcodeParserEngine';
import { PosHardwareHub } from './PosHardwareHub';
import { CustomerDisplaySyncService } from '../../services/customerDisplaySyncService';
import { CustomerFacingDisplayView } from './CustomerFacingDisplayView';

export const PosView: React.FC = () => {
  const { lang, activeCompany } = usePlatform();
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'terminal' | 'hardware' | 'registers' | 'sessions' | 'returns' | 'shiftClosing' | 'offlineSync' | 'customerDisplay'>('terminal');

  // Hardware Abstraction Layer (HAL) State
  const [hwHealth, setHwHealth] = useState<HardwareOverallHealth>(HardwareManager.getInstance().getOverallHealth());
  const [hardwareAlert, setHardwareAlert] = useState<string | null>(null);

  // Large Catalog Offline Optimization State (IndexedDB)
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [catalogTotalCount, setCatalogTotalCount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [catalogLookupLatencyMs, setCatalogLookupLatencyMs] = useState<number | null>(null);
  const [isSeedingBenchmark, setIsSeedingBenchmark] = useState<boolean>(false);

  // Offline POS & IndexedDB State
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineTransactionQueueItem[]>([]);
  const [offlineSummary, setOfflineSummary] = useState<OfflineSyncSummary>({ total: 0, pendingCount: 0, syncedCount: 0, conflictCount: 0, failedCount: 0 });
  const [syncingOffline, setSyncingOffline] = useState(false);
  const [offlineNotification, setOfflineNotification] = useState<string | null>(null);

  // Backend state
  const [registers, setRegisters] = useState<POSRegister[]>([]);
  const [shifts, setShifts] = useState<POSShift[]>([]);
  const [receipts, setReceipts] = useState<POSReceipt[]>([]);
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [loading, setLoading] = useState(false);

  // Active Terminal State
  const [selectedRegister, setSelectedRegister] = useState<POSRegister | null>(null);
  const [activeShift, setActiveShift] = useState<POSShift | null>(null);
  const [cart, setCart] = useState<POSReceiptLine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');

  // Split Checkout Modal
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [cardTendered, setCardTendered] = useState<number>(0);
  const [walletTendered, setWalletTendered] = useState<number>(0);
  const [cardBrand, setCardBrand] = useState<'MADA' | 'VISA' | 'MASTERCARD'>('MADA');
  const [completedReceipt, setCompletedReceipt] = useState<POSReceipt | null>(null);

  // Cash Movement Modal
  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'CASH_DROP' | 'PETTY_EXPENSE' | 'CASH_ADD'>('CASH_DROP');
  const [movementAmount, setMovementAmount] = useState<number>(500);
  const [movementReason, setMovementReason] = useState('');

  // Shift Close Modal
  const [isShiftCloseModalOpen, setIsShiftCloseModalOpen] = useState(false);
  const [actualCountedCash, setActualCountedCash] = useState<number>(0);
  const [varianceReason, setVarianceReason] = useState('');
  const [latestZReportShift, setLatestZReportShift] = useState<POSShift | null>(null);

  // POS Return Modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReceiptNum, setReturnReceiptNum] = useState('');
  const [returnItemSku, setReturnItemSku] = useState('POS-SCN-WL');
  const [returnQty, setReturnQty] = useState(1);
  const [returnCondition, setReturnCondition] = useState<'RESTOCKABLE_NEW' | 'OPEN_BOX_DISCOUNT' | 'DAMAGED_SCRAP'>('RESTOCKABLE_NEW');
  const [returnReason, setReturnReason] = useState('Customer changed mind within 7 days return policy');

  // Catalog Products
  const catalogProducts = [
    { sku: 'POS-SCN-WL', barcode: '628100100201', name: 'Industrial 2D Barcode Scanner', nameAr: 'قارئ باركود ثنائي الأبعاد صناعي لاسلكي', price: 850, category: 'Hardware', isWeightItem: false, uom: 'UNIT' },
    { sku: 'POS-PRN-TH', barcode: '628100100202', name: 'High-Speed Thermal Receipt Printer', nameAr: 'طابعة إيصالات حرارية عالية السرعة', price: 1150, category: 'Hardware', isWeightItem: false, uom: 'UNIT' },
    { sku: 'NET-CIS-SW48', barcode: '628100100203', name: 'Cisco Catalyst 48-Port Switch', nameAr: 'موزع سيسكو 48 منفذ', price: 6200, category: 'Networking', isWeightItem: false, uom: 'UNIT' },
    { sku: 'SW-ERP-USR', barcode: '628100100204', name: 'AM Enterprise ERP User License', nameAr: 'ترخيص مستخدم نظام تخطيط الموارد', price: 12000, category: 'Software', isWeightItem: false, uom: 'UNIT' },
    { sku: 'SRV-001', barcode: '628100100205', name: 'Database Performance Tuning Service', nameAr: 'خدمة ضبط أداء قواعد البيانات', price: 1500, category: 'Services', isWeightItem: false, uom: 'UNIT' },
    // Fresh Produce & Butchery Random-Weight items for Pilot Readiness 3B
    { sku: 'PLU-10203', barcode: '201020300000', name: 'Fresh Australian Chilled Ribeye', nameAr: 'لحم بقري ريب آي أسترالي مبرد طازج', price: 120, category: 'Meat & Poultry', isWeightItem: true, uom: 'KG' },
    { sku: 'PLU-54321', barcode: '995432100000', name: 'Al-Qassim Premium Sukari Dates', nameAr: 'تمر سكري فاخر القصيم ميزان', price: 45, category: 'Fresh Produce', isWeightItem: true, uom: 'KG' }
  ];

  const loadPosData = async () => {
    setLoading(true);
    try {
      const [regRes, shRes, rcRes, rtRes] = await Promise.all([
        fetch('/api/v1/sales/pos/registers').then(r => r.json()),
        fetch('/api/v1/sales/pos/shifts').then(r => r.json()),
        fetch('/api/v1/sales/pos/receipts').then(r => r.json()),
        fetch('/api/v1/sales/returns').then(r => r.json())
      ]);

      if (regRes.success) {
        setRegisters(regRes.registers);
        if (regRes.registers.length > 0 && !selectedRegister) {
          setSelectedRegister(regRes.registers[0]);
        }
      }
      if (shRes.success) {
        setShifts(shRes.shifts);
        const openShift = shRes.shifts.find((s: POSShift) => s.status === 'OPEN');
        if (openShift) {
          setActiveShift(openShift);
          setActualCountedCash(openShift.expectedCashInDrawer);
        }
      }
      if (rcRes.success) setReceipts(rcRes.receipts);
      if (rtRes.success) setReturns(rtRes.returns);
    } catch (err) {
      console.error('Failed to load POS data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOfflineQueue = async () => {
    try {
      const state = await OfflinePosManager.getInstance().getQueueState();
      setOfflineQueue(state.items);
      setOfflineSummary(state.summary);
    } catch (err) {
      console.error('Failed to load offline queue:', err);
    }
  };

  const handleSyncOfflineQueue = async () => {
    setSyncingOffline(true);
    setOfflineNotification(null);
    try {
      const result = await OfflinePosManager.getInstance().syncPendingQueue();
      await loadOfflineQueue();
      await loadPosData();
      setOfflineNotification(
        `Sync completed: ${result.response.successCount} promoted to SQLite, ${result.response.duplicateCount} duplicate-protected, ${result.response.conflictCount} conflicts, ${result.response.failureCount} failed.`
      );
    } catch (err: any) {
      setOfflineNotification(`Sync failed: ${err.message}`);
    } finally {
      setSyncingOffline(false);
    }
  };

  const handleSimulateRestart = async () => {
    try {
      await OfflinePosIndexedDbService.getInstance().simulateBrowserRestart();
      const items = await OfflinePosIndexedDbService.getInstance().getQueue();
      await loadOfflineQueue();
      setOfflineNotification(
        `Crash/Reload Simulation: ${items.length} queued transactions recovered from IndexedDB storage.`
      );
    } catch (err: any) {
      setOfflineNotification(`Restart recovery failed: ${err.message}`);
    }
  };

  const handleRetryTransaction = async (id: string) => {
    try {
      await OfflinePosManager.getInstance().retryTransaction(id);
      await loadOfflineQueue();
      setOfflineNotification(`Transaction ${id} reset to QUEUED for sync retry.`);
    } catch (err: any) {
      alert('Retry failed: ' + err.message);
    }
  };

  const handleClearSynced = async () => {
    try {
      await OfflinePosIndexedDbService.getInstance().clearSynced();
      await loadOfflineQueue();
      setOfflineNotification('Cleared synced transactions from local IndexedDB.');
    } catch (err: any) {
      alert('Failed to clear synced: ' + err.message);
    }
  };

  // Cart Management
  const addToCart = (
    product: typeof catalogProducts[0], 
    overrideQty?: number, 
    overridePrice?: number, 
    overrideUom?: string
  ) => {
    const qtyToAdd = overrideQty !== undefined ? overrideQty : 1;
    const unitPrice = overridePrice !== undefined ? overridePrice : product.price;
    const uom = overrideUom || product.uom || 'UNIT';

    setCart(prev => {
      // For variable weight items, add as distinct weighed lines with specific weights
      const existing = !product.isWeightItem ? prev.find(i => i.itemSku === product.sku) : undefined;
      if (existing) {
        const newQty = existing.quantity + qtyToAdd;
        const sub = newQty * existing.unitPrice;
        const tax = sub * existing.taxRate;
        return prev.map(i => i.itemSku === product.sku ? {
          ...i,
          quantity: newQty,
          taxAmount: tax,
          lineTotal: sub + tax
        } : i);
      }

      const taxRate = 0.15;
      const sub = qtyToAdd * unitPrice;
      const taxAmount = sub * taxRate;

      return [...prev, {
        id: `line-${product.sku}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        itemSku: product.sku,
        barcode: product.barcode,
        itemName: product.name,
        itemNameAr: product.nameAr,
        uom,
        quantity: qtyToAdd,
        unitPrice,
        originalUnitPrice: unitPrice,
        discountAmount: 0,
        discountPercentage: 0,
        taxRate,
        taxAmount,
        lineTotal: sub + taxAmount
      }];
    });
  };

  // Barcode Parser & Auto-Addition Handler with O(log N) IndexedDB Lookup
  const handleScanBarcode = async (rawBarcode: string) => {
    const trimmed = rawBarcode.trim();
    if (!trimmed) return;

    const t0 = performance.now();
    const dbService = OfflinePosIndexedDbService.getInstance();
    const parsed = BarcodeParserEngine.parse(trimmed);
    if (!parsed.isValid) {
      setHardwareAlert(
        isAr 
          ? `تم رفض الباركود: خطأ في فحص رمز التحقق (Checksum Error: ${trimmed})` 
          : `Barcode rejected: Modulo-10 checksum validation failed for ${trimmed}`
      );
      setTimeout(() => setHardwareAlert(null), 5000);
      return;
    }

    if (parsed.barcodeType === 'VARIABLE_WEIGHT') {
      let matched = await dbService.lookupProductBySku(`PLU-${parsed.itemCode}`) ||
                    await dbService.lookupProductByBarcode(trimmed) ||
                    await dbService.lookupProductBySku(parsed.itemCode);
      const latency = performance.now() - t0;
      setCatalogLookupLatencyMs(Number(latency.toFixed(2)));

      if (matched) {
        addToCart(matched, parsed.quantity, undefined, parsed.uom);
        setHardwareAlert(
          isAr
            ? `تم وزن وإضافة: ${matched.nameAr} (${parsed.quantity} ${parsed.uom}) في ${latency.toFixed(1)}ms`
            : `Weighed & Added: ${matched.name} (${parsed.quantity} ${parsed.uom}) in ${latency.toFixed(1)}ms`
        );
      } else {
        const dynProduct = {
          sku: `PLU-${parsed.itemCode}`,
          barcode: trimmed,
          name: `Weighed Item PLU #${parsed.itemCode}`,
          nameAr: `صنف ميزان PLU #${parsed.itemCode}`,
          price: 80,
          category: 'Weighed Goods',
          isWeightItem: true,
          uom: parsed.uom || 'KG'
        };
        addToCart(dynProduct, parsed.quantity, undefined, parsed.uom);
        setHardwareAlert(`Added Weighed PLU #${parsed.itemCode} (${parsed.quantity} ${parsed.uom}) in ${latency.toFixed(1)}ms`);
      }
    } else if (parsed.barcodeType === 'VARIABLE_PRICE') {
      let matched = await dbService.lookupProductBySku(`PLU-${parsed.itemCode}`) ||
                    await dbService.lookupProductByBarcode(trimmed) ||
                    await dbService.lookupProductBySku(parsed.itemCode);
      const latency = performance.now() - t0;
      setCatalogLookupLatencyMs(Number(latency.toFixed(2)));

      const target = matched || {
        sku: `PLU-${parsed.itemCode}`,
        barcode: trimmed,
        name: `Variable Price Item #${parsed.itemCode}`,
        nameAr: `صنف سعر مشفر #${parsed.itemCode}`,
        price: parsed.embeddedPrice || 50,
        category: 'Variable Price',
        isWeightItem: false,
        uom: 'UNIT'
      };
      addToCart(target, 1, parsed.embeddedPrice);
      setHardwareAlert(`Added Price-Encoded Item #${parsed.itemCode} (${parsed.embeddedPrice} SAR) in ${latency.toFixed(1)}ms`);
    } else {
      // Standard EAN-13 or Non-EAN: O(log N) indexed search
      let matched = await dbService.lookupProductByBarcode(trimmed);
      if (!matched) {
        matched = await dbService.lookupProductBySku(trimmed);
      }
      const latency = performance.now() - t0;
      setCatalogLookupLatencyMs(Number(latency.toFixed(2)));

      if (matched) {
        addToCart(matched, 1);
        setHardwareAlert(`Scanned ${matched.name} via IndexedDB (${latency.toFixed(1)}ms)`);
      } else {
        setHardwareAlert(`Barcode ${trimmed} not found in catalog (${latency.toFixed(1)}ms).`);
      }
    }

    setTimeout(() => setHardwareAlert(null), 4000);
  };

  useEffect(() => {
    loadPosData();
    loadOfflineQueue();

    // Initialize/sync IndexedDB catalog
    const initCatalog = async () => {
      try {
        const dbService = OfflinePosIndexedDbService.getInstance();
        const count = await dbService.getCatalogCount();
        if (count === 0) {
          await dbService.cacheCatalog(catalogProducts);
        }
        const initialItems = await dbService.searchCatalogIndexed('', { limit: 24 });
        setCatalogItems(initialItems);
        const updatedCount = await dbService.getCatalogCount();
        setCatalogTotalCount(updatedCount);
      } catch (err) {
        console.error('Failed to init indexed catalog:', err);
      }
    };
    initCatalog();

    // Subscribe to Hardware Manager health status
    const unsubHw = HardwareManager.getInstance().subscribe((health) => {
      setHwHealth(health);
    });

    // Subscribe to Hardware Barcode Scanner Keyboard Wedge listener
    const scanner = HardwareManager.getInstance().getScanner();
    const unsubScanner = scanner.subscribe((event, parsed) => {
      handleScanBarcode(event.barcode);
    });

    return () => {
      unsubHw();
      unsubScanner();
    };
  }, []);

  // Real-time indexed search on query or category change
  useEffect(() => {
    let isMounted = true;
    const runSearch = async () => {
      const t0 = performance.now();
      try {
        const dbService = OfflinePosIndexedDbService.getInstance();
        const results = await dbService.searchCatalogIndexed(searchQuery, {
          limit: 24,
          category: selectedCategory
        });
        const latency = performance.now() - t0;
        if (isMounted) {
          setCatalogItems(results);
          setCatalogLookupLatencyMs(Number(latency.toFixed(2)));
        }
      } catch (err) {
        console.error('Indexed catalog search error:', err);
      }
    };
    runSearch();
    return () => { isMounted = false; };
  }, [searchQuery, selectedCategory]);

  const handleSeedBenchmarkCatalog = async () => {
    setIsSeedingBenchmark(true);
    try {
      const dbService = OfflinePosIndexedDbService.getInstance();
      const res = await dbService.seedBenchmarkCatalog(50000);
      const newCount = await dbService.getCatalogCount();
      setCatalogTotalCount(newCount);
      const items = await dbService.searchCatalogIndexed('', { limit: 24 });
      setCatalogItems(items);
      setHardwareAlert(
        isAr 
          ? `تمت فهرسة 50,000 صنف في IndexedDB بنجاح خلال ${(res.durationMs / 1000).toFixed(2)} ثانية.`
          : `IndexedDB benchmark: 50,000 SKUs successfully indexed in ${(res.durationMs / 1000).toFixed(2)}s.`
      );
    } catch (err: any) {
      alert('Benchmark seed failed: ' + err.message);
    } finally {
      setIsSeedingBenchmark(false);
    }
  };

  const updateQuantity = (sku: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.itemSku === sku) {
        const newQty = Math.max(1, i.quantity + delta);
        const sub = (newQty * i.unitPrice) - (i.discountAmount || 0);
        const tax = sub * i.taxRate;
        return {
          ...i,
          quantity: newQty,
          taxAmount: tax,
          lineTotal: sub + tax
        };
      }
      return i;
    }));
  };

  const removeFromCart = (sku: string) => {
    setCart(prev => prev.filter(i => i.itemSku !== sku));
  };

  // Cart Totals
  const cartSubtotal = cart.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
  const cartDiscount = cart.reduce((sum, i) => sum + (i.discountAmount || 0), 0);
  const cartTax = cart.reduce((sum, i) => sum + i.taxAmount, 0);
  const cartGrandTotal = cart.reduce((sum, i) => sum + i.lineTotal, 0);

  // Real-time synchronization with Customer-Facing Display (BroadcastChannel + LocalStorage)
  useEffect(() => {
    const syncService = CustomerDisplaySyncService.getInstance();
    
    if (cart.length === 0 && !completedReceipt) {
      syncService.resetToIdle();
      return;
    }

    const lines = cart.map(item => ({
      id: item.id,
      itemSku: item.itemSku,
      name: item.itemName,
      nameAr: item.itemNameAr || item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      uom: item.uom || 'UNIT',
      discountAmount: item.discountAmount,
      lineTotal: item.lineTotal
    }));

    const state = completedReceipt
      ? 'COMPLETED'
      : isCheckoutModalOpen
      ? 'PAYMENT_IN_PROGRESS'
      : cart.length > 0
      ? 'SCANNING'
      : 'IDLE';

    const payments: { method: string; amount: number }[] = [];
    if (cashTendered > 0) payments.push({ method: 'CASH', amount: cashTendered });
    if (cardTendered > 0) payments.push({ method: `CARD (${cardBrand})`, amount: cardTendered });
    if (walletTendered > 0) payments.push({ method: 'DIGITAL_WALLET', amount: walletTendered });

    const totalTendered = cashTendered + cardTendered + walletTendered;
    const changeDue = Math.max(0, totalTendered - cartGrandTotal);

    syncService.broadcast({
      companyName: activeCompany?.name || 'AM Business Platform Enterprise',
      branchName: selectedRegister ? `${selectedRegister.name} (${selectedRegister.code})` : 'Main Retail Flagship',
      terminalCode: selectedRegister?.code || 'REG-01',
      cashierName: activeShift?.cashierName || 'Ahmed Mounir',
      currency: 'SAR',
      state,
      lines,
      itemCount: cart.reduce((acc, l) => acc + l.quantity, 0),
      subtotal: cartSubtotal,
      discountTotal: cartDiscount,
      taxAmount: cartTax,
      taxRate: 0.15,
      grandTotal: cartGrandTotal,
      tendered: totalTendered,
      changeDue,
      payments,
      completedReceipt: completedReceipt ? {
        receiptNumber: completedReceipt.receiptNumber,
        timestamp: completedReceipt.createdAt,
        qrCodeData: completedReceipt.zatcaQrPayload,
        paymentSummary: completedReceipt.paymentMethod
      } : null
    });
  }, [
    cart, 
    isCheckoutModalOpen, 
    cashTendered, 
    cardTendered, 
    walletTendered, 
    cardBrand, 
    completedReceipt, 
    cartSubtotal, 
    cartTax, 
    cartGrandTotal, 
    cartDiscount, 
    selectedRegister, 
    activeShift, 
    activeCompany
  ]);

  // Open Checkout Modal
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCardTendered(cartGrandTotal);
    setCashTendered(0);
    setWalletTendered(0);
    setIsCheckoutModalOpen(true);
  };

  // Submit Checkout & Process Receipt
  const handleProcessCheckout = async () => {
    const totalTendered = cashTendered + cardTendered + walletTendered;
    if (totalTendered < cartGrandTotal) {
      alert(isAr ? 'المبلغ المدفوع أقل من الإجمالي المطلوب!' : 'Total tendered is less than the Grand Total!');
      return;
    }

    const payments: PaymentTransaction[] = [];
    const now = new Date().toISOString();

    if (cardTendered > 0) {
      payments.push({
        id: `pay-card-${Date.now()}`,
        method: 'DEBIT_CARD',
        amount: cardTendered,
        currency: 'SAR',
        exchangeRate: 1.0,
        cardBrand,
        cardLast4: '8821',
        treasuryAccountId: 'acc-1020-bank',
        treasuryAccountCode: '1020',
        transactionStatus: 'CAPTURED',
        authCode: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
        capturedAt: now
      });
    }

    if (cashTendered > 0) {
      payments.push({
        id: `pay-cash-${Date.now()}`,
        method: 'CASH',
        amount: cashTendered,
        currency: 'SAR',
        exchangeRate: 1.0,
        treasuryAccountId: 'acc-1010-cash',
        treasuryAccountCode: '1010',
        transactionStatus: 'CAPTURED',
        capturedAt: now
      });
    }

    if (walletTendered > 0) {
      payments.push({
        id: `pay-wall-${Date.now()}`,
        method: 'DIGITAL_WALLET',
        amount: walletTendered,
        currency: 'SAR',
        exchangeRate: 1.0,
        treasuryAccountId: 'acc-1020-bank',
        treasuryAccountCode: '1020',
        transactionStatus: 'CAPTURED',
        capturedAt: now
      });
    }

    const changeDue = Math.max(0, totalTendered - cartGrandTotal);

    const triggerReceiptPrintAndDrawerKick = (receipt: any) => {
      try {
        HardwareManager.getInstance().printReceipt({
          receiptNumber: receipt.receiptNumber,
          timestamp: receipt.createdAt || new Date().toLocaleString(),
          companyName: activeCompany?.name || 'AM Business Platform Enterprise',
          branchName: 'Main Retail Flagship - Counter 01',
          vatNumber: '300012345600003',
          cashierName: receipt.cashierName || 'Ahmed Mounir',
          terminalCode: selectedRegister?.code || 'REG-01-MAIN',
          lines: (receipt.lines || []).map((l: any) => ({
            name: isAr ? (l.itemNameAr || l.itemName) : l.itemName,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal,
            uom: l.uom || 'UNIT'
          })),
          subtotal: receipt.subtotal,
          taxTotal: receipt.taxTotal,
          taxRatePercent: 15,
          grandTotal: receipt.grandTotal,
          payments: (receipt.payments || []).map((p: any) => ({ method: p.method, amount: p.amount })),
          changeGiven: receipt.changeGiven
        });

        if (receipt.payments?.some((p: any) => p.method === 'CASH')) {
          HardwareManager.getInstance().openCashDrawer('Cash Sale Checkout', receipt.cashierName || 'Ahmed Mounir');
        }
      } catch (e) {
        console.warn('Hardware peripheral trigger error:', e);
      }
    };

    if (isOfflineMode) {
      try {
        const grandTotal = cartGrandTotal;
        const subtotal = grandTotal / 1.15;
        const taxTotal = grandTotal - subtotal;
        const offlineResult = await OfflinePosManager.getInstance().recordOfflineSale({
          deviceId: selectedRegister?.code || 'REG-01-MAIN',
          userId: 'usr-001',
          userName: 'Ahmed Mounir',
          companyId: activeCompany?.id || 'comp-001',
          branchId: 'br-001',
          registerId: selectedRegister?.id || 'reg-01',
          registerCode: selectedRegister?.code || 'REG-01-MAIN',
          shiftId: activeShift?.id || 'shift-01',
          lines: cart,
          subtotal,
          taxTotal,
          grandTotal,
          payments,
          changeGiven: changeDue
        });
        setCompletedReceipt(offlineResult.receipt);
        triggerReceiptPrintAndDrawerKick(offlineResult.receipt);
        setCart([]);
        setIsCheckoutModalOpen(false);
        await loadOfflineQueue();
        setOfflineNotification(`Offline sale ${offlineResult.receipt.receiptNumber} recorded in IndexedDB.`);
        return;
      } catch (err: any) {
        alert('Failed to record offline sale: ' + err.message);
        return;
      }
    }

    try {
      const res = await fetch('/api/v1/sales/pos/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registerId: selectedRegister?.id,
          shiftId: activeShift?.id,
          cartLines: cart,
          payments,
          customer: { id: 'cust-walkin', name: 'Walk-in Retail Customer', isWalkIn: true }
        })
      });

      const data = await res.json();
      if (data.success) {
        setCompletedReceipt(data.receipt);
        triggerReceiptPrintAndDrawerKick(data.receipt);
        setCart([]);
        setIsCheckoutModalOpen(false);
        loadPosData();
      } else {
        alert(data.error || 'Failed to process POS Receipt');
      }
    } catch (err) {
      // Auto-fallback to offline IndexedDB
      try {
        const grandTotal = cartGrandTotal;
        const subtotal = grandTotal / 1.15;
        const taxTotal = grandTotal - subtotal;
        const offlineResult = await OfflinePosManager.getInstance().recordOfflineSale({
          deviceId: selectedRegister?.code || 'REG-01-MAIN',
          userId: 'usr-001',
          userName: 'Ahmed Mounir',
          companyId: activeCompany?.id || 'comp-001',
          branchId: 'br-001',
          registerId: selectedRegister?.id || 'reg-01',
          registerCode: selectedRegister?.code || 'REG-01-MAIN',
          shiftId: activeShift?.id || 'shift-01',
          lines: cart,
          subtotal,
          taxTotal,
          grandTotal,
          payments,
          changeGiven: changeDue
        });
        setCompletedReceipt(offlineResult.receipt);
        triggerReceiptPrintAndDrawerKick(offlineResult.receipt);
        setCart([]);
        setIsCheckoutModalOpen(false);
        setIsOfflineMode(true);
        await loadOfflineQueue();
        setOfflineNotification(`Network offline. Saved sale ${offlineResult.receipt.receiptNumber} to IndexedDB.`);
      } catch (e: any) {
        alert('Network error and offline storage fallback failed: ' + e.message);
      }
    }
  };

  // Record Shift Cash Movement (Drop / Expense / Float Add)
  const handleRecordMovement = async () => {
    if (!activeShift) return;
    if (isOfflineMode) {
      try {
        const offlineRes = await OfflinePosManager.getInstance().recordOfflineCashMovement({
          deviceId: selectedRegister?.code || 'REG-01-MAIN',
          userId: 'usr-001',
          userName: 'Ahmed Mounir',
          companyId: activeCompany?.id || 'comp-001',
          branchId: 'br-001',
          registerCode: selectedRegister?.code || 'REG-01-MAIN',
          shiftId: activeShift.id,
          type: movementType,
          amount: movementAmount,
          reason: movementReason || 'Standard register cash operation'
        });
        setIsCashMovementModalOpen(false);
        setMovementReason('');
        await loadOfflineQueue();
        setOfflineNotification(`Cash movement ${offlineRes.movement.receiptNumber} saved to IndexedDB.`);
        return;
      } catch (err: any) {
        alert('Failed to record offline cash movement: ' + err.message);
        return;
      }
    }
    try {
      const res = await fetch(`/api/v1/sales/pos/shifts/${activeShift.id}/cash-movement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: movementType,
          amount: movementAmount,
          reason: movementReason || 'Standard register cash operation'
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsCashMovementModalOpen(false);
        setMovementReason('');
        loadPosData();
      }
    } catch (err) {
      alert('Error recording cash movement');
    }
  };

  // Close Shift & Generate Z-Report
  const handleCloseShift = async () => {
    if (!activeShift) return;
    try {
      const res = await fetch(`/api/v1/sales/pos/shifts/${activeShift.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualCountedCash,
          varianceReason,
          supervisorId: 'usr-001'
        })
      });
      const data = await res.json();
      if (data.success) {
        setLatestZReportShift(data.shift);
        setIsShiftCloseModalOpen(false);
        setActiveTab('shiftClosing');
        loadPosData();
      }
    } catch (err) {
      alert('Failed to close shift session');
    }
  };

  // Open New Shift
  const handleOpenShift = async () => {
    if (!selectedRegister) return;
    try {
      const res = await fetch('/api/v1/sales/pos/shifts/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registerId: selectedRegister.id,
          openingFloat: 1500,
          cashier: { id: 'usr-003', name: 'Omar Al-Ghamdi' }
        })
      });
      const data = await res.json();
      if (data.success) {
        loadPosData();
      }
    } catch (err) {
      alert('Failed to open shift');
    }
  };

  // Process POS Return
  const handleProcessReturn = async () => {
    if (isOfflineMode) {
      try {
        const offlineRes = await OfflinePosManager.getInstance().recordOfflineReturn({
          deviceId: selectedRegister?.code || 'REG-01-MAIN',
          userId: 'usr-001',
          userName: 'Ahmed Mounir',
          companyId: activeCompany?.id || 'comp-001',
          branchId: 'br-001',
          registerCode: selectedRegister?.code || 'REG-01-MAIN',
          originalReceiptNumber: returnReceiptNum || 'POS-2026-01001',
          lines: [
            {
              itemSku: returnItemSku,
              itemName: 'Industrial 2D Barcode Scanner (Bluetooth)',
              quantityReturned: returnQty,
              unitPrice: 850,
              refundAmount: returnQty * 850 * 1.15,
              returnReasonText: returnReason,
              restockWarehouseId: 'wh-001',
              condition: returnCondition
            }
          ],
          refundGrandTotal: returnQty * 850 * 1.15,
          refundMethod: 'CASH'
        });
        setIsReturnModalOpen(false);
        await loadOfflineQueue();
        setOfflineNotification(`Offline return ${offlineRes.returnRecord.returnNumber} saved to IndexedDB.`);
        return;
      } catch (err: any) {
        alert('Failed to record offline return: ' + err.message);
        return;
      }
    }
    try {
      const res = await fetch('/api/v1/sales/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnType: 'PARTIAL_RETURN',
          originalDoc: { type: 'POS_RECEIPT', number: returnReceiptNum || 'POS-2026-01001' },
          lines: [
            {
              itemSku: returnItemSku,
              itemName: 'Industrial 2D Barcode Scanner (Bluetooth)',
              quantityReturned: returnQty,
              unitPrice: 850,
              refundAmount: returnQty * 850 * 1.15,
              returnReasonText: returnReason,
              restockWarehouseId: 'wh-001',
              condition: returnCondition
            }
          ],
          refundMethod: 'CASH',
          approvedBy: 'usr-001'
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsReturnModalOpen(false);
        loadPosData();
        alert(isAr ? `تم تسجيل المرتجع بنجاح برقم ${data.salesReturn.returnNumber}` : `Return #${data.salesReturn.returnNumber} processed with inventory restock!`);
      }
    } catch (err) {
      alert('Failed to process return');
    }
  };

  // Streamed directly from IndexedDB cursor with 50,000+ item capacity
  const displayProducts = catalogItems.length > 0 ? catalogItems : catalogProducts;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#0B1F3A]/10 text-[#0B1F3A] dark:text-[#F28C28] dark:bg-[#F28C28]/10 font-mono text-[11px] font-bold border border-[#F28C28]/30">
              PHASE 3.1 RETAIL POINT OF SALE
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">ZATCA E-Invoicing & Treasury Event Integration</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Store className="w-7 h-7 text-[#F28C28]" />
            <span>{isAr ? 'محطة نقاط البيع والتجزئة الذكية' : 'Intelligent Retail POS Station'}</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Customer Display Popout Button */}
          <button
            onClick={() => CustomerDisplaySyncService.getInstance().openSecondaryWindow()}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer border border-slate-300 dark:border-slate-700 transition"
            title="Open Customer-Facing Display on Secondary Monitor"
          >
            <Monitor className="w-4 h-4 text-[#F28C28]" />
            <span>{isAr ? 'شاشة العميل (نافذة ثانية)' : 'Customer Screen'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Online / Offline Mode Toggle */}
          <button
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition border cursor-pointer ${
              isOfflineMode
                ? 'bg-[#F28C28] text-white border-[#D9771A] shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-100'
            }`}
            title={isOfflineMode ? 'Operating Offline via IndexedDB' : 'Connected to Server'}
          >
            {isOfflineMode ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4 text-emerald-500" />}
            <span>{isOfflineMode ? (isAr ? 'وضع عدم الاتصال (IndexedDB)' : 'Offline (IndexedDB)') : (isAr ? 'متصل بالخادم' : 'Online')}</span>
          </button>

          {/* Pending Sync Badge Button */}
          {offlineSummary.pendingCount > 0 && (
            <button
              onClick={() => setActiveTab('offlineSync')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F28C28] text-white text-xs font-bold font-mono shadow-xs animate-pulse cursor-pointer hover:bg-[#D9771A]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isAr ? `في الانتظار: ${offlineSummary.pendingCount}` : `Sync Queue: ${offlineSummary.pendingCount}`}</span>
            </button>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono">
            <span>Register: {selectedRegister?.code || 'REG-01-MAIN'} ({activeShift ? 'Shift Active' : 'Shift Closed'})</span>
          </div>

          {activeShift ? (
            <button
              onClick={() => setIsShiftCloseModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#153258] text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer border border-[#F28C28]/40"
            >
              <Lock className="w-4 h-4 text-[#F28C28]" />
              <span>{isAr ? 'إغلاق الوردية والتقرير Z' : 'Close Shift & Z-Report'}</span>
            </button>
          ) : (
            <button
              onClick={handleOpenShift}
              className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#153258] text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer border border-[#153258]"
            >
              <Plus className="w-4 h-4 text-[#F28C28]" />
              <span>{isAr ? 'فتح وردية جديدة' : 'Open Shift Session'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'terminal', labelEn: 'POS Retail Terminal', labelAr: 'شاشة التجزئة والبيع', icon: Store },
          { id: 'customerDisplay', labelEn: 'Customer Display Screen', labelAr: 'شاشة العميل (Pole Monitor)', icon: Monitor },
          { id: 'hardware', labelEn: 'Hardware & HAL Hub', labelAr: 'العتاد والأجهزة (HAL)', icon: Cpu },
          { id: 'registers', labelEn: 'Registers & Hardware', labelAr: 'الخزائن ونقاط البيع', icon: DollarSign, count: registers.length },
          { id: 'sessions', labelEn: 'Shift Sessions & Cash Moves', labelAr: 'الورديات وحركات النقد', icon: Lock, count: shifts.length },
          { id: 'returns', labelEn: 'POS Returns & RMA', labelAr: 'المرتجعات والتبديل', icon: RotateCcw, count: returns.length },
          { id: 'shiftClosing', labelEn: 'Z-Reports & Audit Ledger', labelAr: 'تقارير الإغلاق Z والتسوية', icon: Receipt, count: receipts.length },
          { id: 'offlineSync', labelEn: 'Offline Sync (IndexedDB)', labelAr: 'قائمة مزامنة التجزئة', icon: Database, count: offlineSummary.pendingCount }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-[#0B1F3A] text-white shadow-xs border border-[#153258]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#F28C28]' : ''}`} />
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-[#F28C28] text-slate-950 font-bold' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Hardware Notification / Scan Alert */}
      {hardwareAlert && (
        <div className="p-3 rounded-xl bg-[#0B1F3A] text-white border border-[#F28C28] text-xs font-mono flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#F28C28] shrink-0" />
            <span>{hardwareAlert}</span>
          </div>
          <button onClick={() => setHardwareAlert(null)} className="text-slate-400 hover:text-white text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* ==================== TAB 1: ACTIVE TERMINAL ==================== */}
      {activeTab === 'terminal' && (
        <div className="space-y-4">
          {/* Peripheral Status Ribbon */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 font-mono uppercase">
                <Cpu className="w-3.5 h-3.5 text-[#F28C28]" />
                <span>HAL Peripherals:</span>
              </span>

              {/* 80mm Printer */}
              <div className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 font-mono text-[11px]">
                <Printer className="w-3.5 h-3.5 text-[#0B1F3A] dark:text-[#F28C28]" />
                <span className="font-bold">80mm:</span>
                <span className={hwHealth.devices.printer.status === 'CONNECTED' ? 'text-emerald-600 font-bold' : 'text-amber-600'}>
                  {hwHealth.devices.printer.status === 'CONNECTED' ? 'Direct USB' : 'Browser 80mm'}
                </span>
              </div>

              {/* Cash Drawer */}
              <div className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 font-mono text-[11px]">
                <DollarSign className="w-3.5 h-3.5 text-rose-500" />
                <span className="font-bold">Drawer:</span>
                <span className={hwHealth.devices.cashDrawer.status === 'CONNECTED' ? 'text-emerald-600 font-bold' : 'text-rose-600'}>
                  {hwHealth.devices.cashDrawer.status === 'CONNECTED' ? 'RJ11 Ready' : 'Manual Key'}
                </span>
              </div>

              {/* Barcode Scanner */}
              <div className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 font-mono text-[11px]">
                <Barcode className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-bold">Scanner:</span>
                <span className="text-emerald-600 font-bold">Wedge Active (&lt;45ms)</span>
              </div>

              {/* Weighing Scale */}
              <div className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 font-mono text-[11px]">
                <Scale className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-bold">Scale:</span>
                <span className={hwHealth.devices.scale.status === 'CONNECTED' ? 'text-emerald-600 font-bold' : 'text-slate-600 dark:text-slate-300'}>
                  {hwHealth.devices.scale.status === 'CONNECTED' ? 'RS232 Serial' : 'Manual Fallback'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('hardware')}
              className="px-3 py-1 rounded-lg bg-[#0B1F3A]/5 hover:bg-[#0B1F3A]/10 text-[#0B1F3A] dark:text-[#F28C28] font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Configure Peripherals</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left / Main Catalog View (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Barcode Search Bar & Simulation Strip */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Barcode className="w-4 h-4 text-[#F28C28] absolute left-3 top-3" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          handleScanBarcode(searchQuery);
                          setSearchQuery('');
                        }
                      }}
                      placeholder={isAr ? 'امسح الباركود أو اضغط Enter للإضافة الفورية...' : 'Scan barcode or press Enter to add directly...'}
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono shadow-xs"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (searchQuery.trim()) {
                        handleScanBarcode(searchQuery);
                        setSearchQuery('');
                      } else {
                        handleScanBarcode('628100100201');
                      }
                    }}
                    className="px-3 py-2.5 rounded-xl bg-[#0B1F3A] text-white hover:bg-[#153258] border border-[#F28C28]/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Barcode className="w-4 h-4 text-[#F28C28]" />
                    <span>Scan/Enter</span>
                  </button>
                </div>

                {/* Quick Barcode Simulation Buttons for Pilot Verification */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                  <span className="text-slate-400 font-bold">Simulate:</span>
                  <button
                    onClick={() => handleScanBarcode('628100100201')}
                    className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Fixed GTIN
                  </button>
                  <button
                    onClick={() => handleScanBarcode('2010203014506')}
                    className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold cursor-pointer"
                  >
                    Prefix 20 (1.450 KG Ribeye)
                  </button>
                  <button
                    onClick={() => handleScanBarcode('9954321028753')}
                    className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-bold cursor-pointer"
                  >
                    Prefix 99 (2.875 KG Dates)
                  </button>
                </div>

                {/* Category Filter Pills & IndexedDB Benchmark Bar */}
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1">
                      {['All', 'Hardware', 'Fresh Produce', 'Meat & Poultry', 'Networking', 'Software', 'Services'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition ${
                            selectedCategory === cat
                              ? 'bg-[#0B1F3A] text-white font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSeedBenchmarkCatalog}
                        disabled={isSeedingBenchmark}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold font-mono flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                        title="Seed 50,000 SKUs into IndexedDB for high-volume stress testing"
                      >
                        <Database className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{isSeedingBenchmark ? 'Indexing 50k...' : 'Seed 50k SKUs Benchmark'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Catalog Metric & Latency Tag */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Local IndexedDB Catalog: <strong className="text-slate-800 dark:text-white font-bold">{catalogTotalCount.toLocaleString()}</strong> SKUs indexed</span>
                    </div>
                    <div>
                      <span>Cursor Lookup: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{catalogLookupLatencyMs !== null ? `${catalogLookupLatencyMs}ms` : '< 1ms'}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

            {/* Product Quick Cards Grid (Indexed Cursor Limit: 24) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {displayProducts.length === 0 ? (
                <div className="col-span-2 text-center py-10 text-slate-400 text-xs">
                  {isAr ? 'لم يتم العثور على أصناف مطابقة في قاعدة بيانات IndexedDB' : 'No items found matching the search criteria in IndexedDB.'}
                </div>
              ) : (
                displayProducts.map(p => (
                  <div 
                    key={p.sku}
                    onClick={() => addToCart(p)}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#F28C28] cursor-pointer transition shadow-xs space-y-2 group"
                  >
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <span>{p.sku}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{p.category}</span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#F28C28] min-h-8">
                      {isAr ? p.nameAr : p.name}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-mono font-black text-sm text-[#0B1F3A] dark:text-[#F28C28]">
                        {p.price.toLocaleString()} SAR
                      </span>
                      <span className="p-1 rounded-lg bg-[#0B1F3A]/10 dark:bg-[#F28C28]/20 text-[#0B1F3A] dark:text-[#F28C28] text-xs">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right / Cart & Checkout Sidebar (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#F28C28]" />
                  <span>{isAr ? 'سلة المبيعات الفورية' : 'Live Checkout Terminal Cart'}</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  {cart.reduce((s, i) => s + i.quantity, 0)} Items
                </span>
              </div>

              {/* Cart Items List */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    {isAr ? 'السلة فارغة. انقر على الأصناف لإضافتها.' : 'Cart is empty. Tap products to add.'}
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.itemSku} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="truncate flex-1">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {isAr ? item.itemNameAr : item.itemName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {item.unitPrice.toLocaleString()} SAR / unit (VAT 15%)
                        </div>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                        <button onClick={() => updateQuantity(item.itemSku, -1)} className="p-0.5 text-slate-500 hover:text-slate-800 cursor-pointer">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs font-bold px-1">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.itemSku, 1)} className="p-0.5 text-slate-500 hover:text-slate-800 cursor-pointer">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="font-mono font-bold text-xs text-slate-900 dark:text-white shrink-0">
                        {item.lineTotal.toLocaleString()} SAR
                      </div>

                      <button onClick={() => removeFromCart(item.itemSku)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total Calculation & Checkout Button */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-500 font-mono">
                  <span>Subtotal (Pre-Tax)</span>
                  <span>{cartSubtotal.toLocaleString()} SAR</span>
                </div>
                <div className="flex justify-between text-slate-500 font-mono">
                  <span>VAT (15%)</span>
                  <span>{cartTax.toLocaleString()} SAR</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 dark:text-white border-t border-slate-100 dark:border-slate-800 pt-2 font-mono">
                  <span>Total Payable</span>
                  <span className="text-[#0B1F3A] dark:text-[#F28C28]">{cartGrandTotal.toLocaleString()} SAR</span>
                </div>
              </div>

              <button
                onClick={handleOpenCheckout}
                disabled={cart.length === 0}
                className="w-full py-3 rounded-xl bg-[#F28C28] hover:bg-[#D9771A] disabled:opacity-50 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isAr ? 'الدفع وإصدار الإيصال ZATCA' : 'Pay & Issue ZATCA Receipt'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ==================== TAB: HARDWARE & HAL HUB ==================== */}
      {activeTab === 'hardware' && (
        <PosHardwareHub 
          isAr={isAr}
          onSendToCart={(itemCode, qty, price, uom) => {
            const matched = catalogProducts.find(p => p.sku.includes(itemCode) || p.barcode.includes(itemCode));
            if (matched) {
              addToCart(matched, qty, price, uom);
            } else {
              const dynItem = {
                sku: `PLU-${itemCode}`,
                barcode: `20${itemCode}00000`,
                name: `Weighed Item PLU #${itemCode}`,
                nameAr: `صنف ميزان PLU #${itemCode}`,
                price: price || 75,
                category: 'Fresh Produce',
                isWeightItem: uom === 'KG' || uom === 'G',
                uom: uom || 'UNIT'
              };
              addToCart(dynItem, qty, price, uom);
            }
            setActiveTab('terminal');
          }}
        />
      )}

      {/* ==================== TAB 2: REGISTERS & HARDWARE ==================== */}
      {activeTab === 'registers' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-teal-500" />
              <span>{isAr ? 'محطات ونقاط البيع وصناديق النقد' : 'Master POS Terminals & Cash Drawers'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {registers.map(reg => (
                <div key={reg.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{reg.name}</h4>
                    <span className="font-mono text-indigo-600 font-bold">{reg.code}</span>
                  </div>
                  <div className="space-y-1 text-slate-500 font-mono text-[11px]">
                    <div>Cash Drawer Status: <span className="font-bold text-emerald-600">{reg.cashDrawerStatus}</span></div>
                    <div>Printer IP / Device: <span className="font-bold text-slate-700 dark:text-slate-300">{reg.printerIpOrName}</span></div>
                    <div>Default Cash Account: <span className="font-bold text-slate-700 dark:text-slate-300">{reg.defaultCashAccountId}</span></div>
                    <div>Default Bank Account: <span className="font-bold text-slate-700 dark:text-slate-300">{reg.defaultBankAccountId}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: SHIFT SESSIONS ==================== */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-teal-500" />
                <span>{isAr ? 'سجل الورديات وحركات النقد' : 'Active Shifts & Real-time Cash Movements'}</span>
              </h3>
              {activeShift && (
                <button
                  onClick={() => setIsCashMovementModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Cash Drop / Expense</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {shifts.map(shift => (
                <div key={shift.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-teal-600">{shift.shiftNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${shift.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                        {shift.status}
                      </span>
                    </div>
                    <span className="text-slate-400 font-mono">Cashier: {shift.cashierName}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Opening Float</span>
                      <div className="font-bold text-slate-900 dark:text-white">{shift.openingCashFloat.toLocaleString()} SAR</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Cash Sales</span>
                      <div className="font-bold text-emerald-600">+{shift.totalCashSales.toLocaleString()} SAR</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Card & Wallet Sales</span>
                      <div className="font-bold text-blue-600">{((shift.totalCardSales || 0) + (shift.totalWalletSales || 0)).toLocaleString()} SAR</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Expected Drawer Cash</span>
                      <div className="font-black text-sm text-teal-600">{shift.expectedCashInDrawer.toLocaleString()} SAR</div>
                    </div>
                  </div>

                  {shift.cashMovements && shift.cashMovements.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Cash Movements Log:</span>
                      {shift.cashMovements.map(m => (
                        <div key={m.id} className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>{m.type}: {m.reason}</span>
                          <span className="font-bold">{m.amount.toLocaleString()} SAR ({m.timestamp.split('T')[1].substring(0, 5)})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: POS RETURNS ==================== */}
      {activeTab === 'returns' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-500" />
                <span>{isAr ? 'مرتجع المبيعات الفورية وتبديل الأصناف' : 'POS Customer Returns & Exchange Workflow'}</span>
              </h3>
              <button
                onClick={() => setIsReturnModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue POS Return</span>
              </button>
            </div>

            <div className="space-y-3">
              {returns.map(ret => (
                <div key={ret.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-rose-600">{ret.returnNumber}</span>
                      <span className="font-mono text-[10px] text-slate-400">Ref: {ret.originalDocumentNumber}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{ret.refundGrandTotal.toLocaleString()} SAR</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Refund via: <span className="font-bold text-emerald-600">{ret.refundMethod}</span> • Status: <span className="font-bold text-slate-700 dark:text-slate-300">{ret.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: SHIFT CLOSING & Z-REPORT ==================== */}
      {activeTab === 'shiftClosing' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-teal-500" />
              <span>{isAr ? 'تقارير الإغلاق الشاملة Z-Report وسجل الإيصالات' : 'Shift Z-Reports & Cryptographic Receipts Vault'}</span>
            </h3>

            {latestZReportShift && latestZReportShift.zReportDetails && (
              <div className="p-5 rounded-2xl bg-teal-50/40 dark:bg-slate-800/60 border border-teal-200 dark:border-teal-900 text-xs space-y-3 font-mono">
                <div className="flex justify-between items-center border-b border-teal-200 dark:border-teal-800 pb-2">
                  <span className="font-bold text-teal-800 dark:text-teal-300 text-sm">Z-REPORT #{latestZReportShift.zReportDetails.zReportNumber}</span>
                  <span className="text-[10px] text-slate-400">{latestZReportShift.zReportDetails.generatedAt}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Gross Shift Revenue</span>
                    <span className="font-bold text-emerald-600">{latestZReportShift.zReportDetails.grossSalesRevenue.toLocaleString()} SAR</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Shift VAT</span>
                    <span className="font-bold">{latestZReportShift.zReportDetails.totalVatCollected.toLocaleString()} SAR</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Cash Count Variance</span>
                    <span className={`font-bold ${latestZReportShift.zReportDetails.varianceAmount === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {latestZReportShift.zReportDetails.varianceAmount.toLocaleString()} SAR
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Transactions Count</span>
                    <span className="font-bold">{latestZReportShift.zReportDetails.transactionsCount} Receipts</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-teal-100 dark:border-teal-800 text-[10px] text-slate-500">
                  SHA-256 Seal: {latestZReportShift.zReportDetails.sha256Seal}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Historical Receipts</span>
              {receipts.map(rc => (
                <div key={rc.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs flex justify-between items-center font-mono">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{rc.receiptNumber}</div>
                    <div className="text-[10px] text-slate-400">{rc.createdAt} • Cashier: {rc.cashierName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-teal-600">{rc.grandTotal.toLocaleString()} SAR</div>
                    <div className="text-[10px] text-slate-400">{rc.payments.map(p => p.method).join(' + ')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 6: OFFLINE POS SYNC (INDEXEDDB) ==================== */}
      {activeTab === 'offlineSync' && (
        <OfflinePosSyncPanel
          isAr={isAr}
          isOfflineMode={isOfflineMode}
          onToggleOfflineMode={() => setIsOfflineMode(!isOfflineMode)}
          queueItems={offlineQueue}
          summary={offlineSummary}
          onSync={handleSyncOfflineQueue}
          onSimulateRestart={handleSimulateRestart}
          onRetry={handleRetryTransaction}
          onClearSynced={handleClearSynced}
          syncing={syncingOffline}
          notification={offlineNotification}
        />
      )}

      {/* ==================== TAB 7: CUSTOMER DISPLAY PREVIEW ==================== */}
      {activeTab === 'customerDisplay' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40">
            <div>
              <h3 className="font-bold text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[#F28C28]" />
                <span>{isAr ? 'معاينة شاشة العميل الموجهة (Customer Pole Display)' : 'Customer-Facing Display Live Preview'}</span>
              </h3>
              <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
                {isAr
                  ? 'هذه الشاشة مخصصة للعرض فقط للعميل على شاشة ثانوية دون عناصر تحكم الكاشير، ويتم تحديثها فورياً عبر BroadcastChannel.'
                  : 'This read-only screen displays real-time cart items, VAT, and payments for secondary monitors/poles with zero cashier controls.'}
              </p>
            </div>
            <button
              onClick={() => CustomerDisplaySyncService.getInstance().openSecondaryWindow()}
              className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#153258] text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer border border-[#F28C28]/40 whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#F28C28]" />
              <span>{isAr ? 'فتح في شاشة / نافذة ثانوية' : 'Pop-Out Secondary Window'}</span>
            </button>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-2 bg-slate-900 overflow-hidden shadow-xl min-h-[500px]">
            <CustomerFacingDisplayView isStandaloneWindow={false} />
          </div>
        </div>
      )}

      {/* ==================== SPLIT CHECKOUT MODAL ==================== */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-teal-600" />
                  <span>Split Payment Checkout</span>
                </h3>
                <span className="font-mono text-xs text-slate-400">Total: {cartGrandTotal.toLocaleString()} SAR</span>
              </div>
              <button onClick={() => setIsCheckoutModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-500">MADA / Credit Card Tendered (SAR)</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    value={cardTendered}
                    onChange={e => setCardTendered(Number(e.target.value))}
                    className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                  <select
                    value={cardBrand}
                    onChange={e => setCardBrand(e.target.value as any)}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="MADA">MADA</option>
                    <option value="VISA">VISA</option>
                    <option value="MASTERCARD">Mastercard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-500">Cash Tendered (SAR)</label>
                <input
                  type="number"
                  value={cashTendered}
                  onChange={e => setCashTendered(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-500">Apple Pay / Digital Wallet (SAR)</label>
                <input
                  type="number"
                  value={walletTendered}
                  onChange={e => setWalletTendered(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Total Tendered:</span>
                  <span>{(cardTendered + cashTendered + walletTendered).toLocaleString()} SAR</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Change Return:</span>
                  <span className="text-[#0B1F3A] dark:text-[#F28C28] font-black">
                    {Math.max(0, (cardTendered + cashTendered + walletTendered) - cartGrandTotal).toLocaleString()} SAR
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessCheckout}
                className="px-5 py-2 bg-[#F28C28] hover:bg-[#D9771A] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Confirm & Print ZATCA Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== COMPLETED RECEIPT MODAL ==================== */}
      {completedReceipt && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-center font-mono">
            <div className="flex justify-center text-teal-600">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Payment Successful</h3>
            <div className="text-xs text-slate-500">Receipt #{completedReceipt.receiptNumber}</div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-left text-[11px] space-y-1">
              <div className="flex justify-between"><span>Grand Total:</span><span className="font-bold">{completedReceipt.grandTotal.toLocaleString()} SAR</span></div>
              <div className="flex justify-between"><span>VAT (15%):</span><span>{completedReceipt.taxTotal.toLocaleString()} SAR</span></div>
              <div className="flex justify-between"><span>Change Given:</span><span>{completedReceipt.changeGiven.toLocaleString()} SAR</span></div>
            </div>

            <div className="flex justify-center p-3 bg-white rounded-xl border border-slate-200">
              <QrCode className="w-24 h-24 text-slate-900" />
            </div>
            <div className="text-[10px] text-slate-400">ZATCA Phase 2 E-Invoice QR Verified</div>

            <button
              onClick={() => setCompletedReceipt(null)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Done & New Transaction
            </button>
          </div>
        </div>
      )}

      {/* ==================== CASH MOVEMENT MODAL ==================== */}
      {isCashMovementModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Record Cash Movement</h3>
              <button onClick={() => setIsCashMovementModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-500">Operation Type</label>
                <select
                  value={movementType}
                  onChange={e => setMovementType(e.target.value as any)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="CASH_DROP">Cash Drop to Main Vault (CASH_DROP)</option>
                  <option value="PETTY_EXPENSE">Petty Cash Expense (PETTY_EXPENSE)</option>
                  <option value="CASH_ADD">Cash Float Addition (CASH_ADD)</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-500">Amount (SAR)</label>
                <input
                  type="number"
                  value={movementAmount}
                  onChange={e => setMovementAmount(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-500">Reason / Description</label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={e => setMovementReason(e.target.value)}
                  placeholder="e.g. Midday vault safe drop"
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setIsCashMovementModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
              <button onClick={handleRecordMovement} className="px-5 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl">Save Movement</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SHIFT CLOSE & RECONCILIATION MODAL ==================== */}
      {isShiftCloseModalOpen && activeShift && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Close Shift & Cash Reconciliation</h3>
                <span className="font-mono text-xs text-slate-400">{activeShift.shiftNumber}</span>
              </div>
              <button onClick={() => setIsShiftCloseModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono space-y-1">
                <div className="flex justify-between text-slate-500"><span>System Expected Float:</span><span>{activeShift.expectedCashInDrawer.toLocaleString()} SAR</span></div>
              </div>

              <div>
                <label className="font-semibold text-slate-500">Actual Counted Physical Cash (SAR)</label>
                <input
                  type="number"
                  value={actualCountedCash}
                  onChange={e => setActualCountedCash(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-sm"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono flex justify-between font-bold">
                <span>Calculated Variance:</span>
                <span className={actualCountedCash === activeShift.expectedCashInDrawer ? 'text-emerald-600' : 'text-rose-600'}>
                  {(actualCountedCash - activeShift.expectedCashInDrawer).toLocaleString()} SAR
                </span>
              </div>

              {actualCountedCash !== activeShift.expectedCashInDrawer && (
                <div>
                  <label className="font-semibold text-slate-500">Variance Justification</label>
                  <input
                    type="text"
                    value={varianceReason}
                    onChange={e => setVarianceReason(e.target.value)}
                    placeholder="Enter reason for cash discrepancy..."
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setIsShiftCloseModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
              <button onClick={handleCloseShift} className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md">
                Confirm & Generate Z-Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== POS RETURN MODAL ==================== */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Issue POS Return</h3>
              <button onClick={() => setIsReturnModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-500">Original Receipt Number</label>
                <input
                  type="text"
                  value={returnReceiptNum}
                  onChange={e => setReturnReceiptNum(e.target.value)}
                  placeholder="e.g. POS-2026-01001"
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-500">Item to Return</label>
                <select
                  value={returnItemSku}
                  onChange={e => setReturnItemSku(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="POS-SCN-WL">Industrial 2D Barcode Scanner (POS-SCN-WL)</option>
                  <option value="POS-PRN-TH">Thermal Receipt Printer (POS-PRN-TH)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-500">Restock Condition</label>
                <select
                  value={returnCondition}
                  onChange={e => setReturnCondition(e.target.value as any)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="RESTOCKABLE_NEW">Restockable New (Adds to Inventory Stock)</option>
                  <option value="OPEN_BOX_DISCOUNT">Open Box (Discounted Restock)</option>
                  <option value="DAMAGED_SCRAP">Damaged Scrap (Written off to Loss)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-500">Return Reason</label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setIsReturnModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
              <button onClick={handleProcessReturn} className="px-5 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md">
                Process Return & Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
