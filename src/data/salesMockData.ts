/**
 * AM Business Platform - Phase 3.1 Enterprise Sales & Point of Sale (POS) Seed Data
 * Architecture Baseline: v2.8
 */

import {
  SalesQuotation,
  SalesOrder,
  POSRegister,
  POSShift,
  POSReceipt,
  EnterprisePriceList,
  DiscountRule,
  PromotionCampaign,
  SalesDocumentSequenceConfig,
  SalesReturn
} from '../types/sales';

export const INITIAL_SALES_DOCUMENT_SEQUENCES: SalesDocumentSequenceConfig[] = [
  {
    id: 'seq-qt',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    documentType: 'QUOTATION',
    prefix: 'QT',
    yearPrefix: true,
    nextNumber: 104,
    zeroPad: 4
  },
  {
    id: 'seq-so',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    documentType: 'SALES_ORDER',
    prefix: 'SO',
    yearPrefix: true,
    nextNumber: 205,
    zeroPad: 4
  },
  {
    id: 'seq-sinv',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    documentType: 'SALES_INVOICE',
    prefix: 'SINV',
    yearPrefix: true,
    nextNumber: 501,
    zeroPad: 4
  },
  {
    id: 'seq-pos',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    documentType: 'POS_RECEIPT',
    prefix: 'POS',
    yearPrefix: true,
    nextNumber: 1008,
    zeroPad: 5
  },
  {
    id: 'seq-srtn',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    documentType: 'SALES_RETURN',
    prefix: 'SRTN',
    yearPrefix: true,
    nextNumber: 42,
    zeroPad: 4
  }
];

export const INITIAL_ENTERPRISE_PRICELISTS: EnterprisePriceList[] = [
  {
    id: 'pl-retail-std',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'PL-RETAIL-SAR',
    name: 'Standard Retail Price List (SAR)',
    nameAr: 'قائمة أسعار التجزئة القياسية',
    currency: 'SAR',
    priceListType: 'RETAIL',
    isDefault: true,
    startDate: '2026-01-01',
    isActive: true,
    itemPrices: [
      {
        itemSku: 'SW-ERP-USR',
        itemName: 'AM Enterprise ERP User License',
        basePrice: 12000,
        volumeTiers: [
          { minQuantity: 10, maxQuantity: 24, unitPrice: 11000, discountPercent: 8.33 },
          { minQuantity: 25, unitPrice: 9800, discountPercent: 18.33 }
        ]
      },
      {
        itemSku: 'SRV-001',
        itemName: 'Database Performance Tuning Service',
        basePrice: 1500,
        volumeTiers: [
          { minQuantity: 5, unitPrice: 1350, discountPercent: 10 }
        ]
      },
      {
        itemSku: 'SRV-002',
        itemName: 'Annual 24/7 SLA Technical Support',
        basePrice: 4500
      },
      {
        itemSku: 'HW-SRV-RACK',
        itemName: 'Dell PowerEdge R750 Enterprise Server',
        basePrice: 28500,
        volumeTiers: [
          { minQuantity: 3, unitPrice: 26000, discountPercent: 8.77 }
        ]
      },
      {
        itemSku: 'NET-CIS-SW48',
        itemName: 'Cisco Catalyst 48-Port Managed Switch',
        basePrice: 6200
      },
      {
        itemSku: 'POS-SCN-WL',
        itemName: 'Industrial 2D Barcode Scanner (Bluetooth)',
        basePrice: 850
      },
      {
        itemSku: 'POS-PRN-TH',
        itemName: 'High-Speed Thermal Receipt Printer (80mm)',
        basePrice: 1150
      }
    ]
  },
  {
    id: 'pl-wholesale-key',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'PL-WHOLESALE-VIP',
    name: 'Key Accounts & Wholesale Price List (12% Base Discount)',
    nameAr: 'قائمة أسعار الجملة وكبار العملاء',
    currency: 'SAR',
    priceListType: 'WHOLESALE',
    isDefault: false,
    startDate: '2026-01-01',
    isActive: true,
    itemPrices: [
      {
        itemSku: 'SW-ERP-USR',
        itemName: 'AM Enterprise ERP User License',
        basePrice: 10500
      },
      {
        itemSku: 'HW-SRV-RACK',
        itemName: 'Dell PowerEdge R750 Enterprise Server',
        basePrice: 25000
      },
      {
        itemSku: 'NET-CIS-SW48',
        itemName: 'Cisco Catalyst 48-Port Managed Switch',
        basePrice: 5400
      }
    ]
  }
];

export const INITIAL_DISCOUNT_RULES: DiscountRule[] = [
  {
    id: 'disc-standard-sales',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'DISC-STD-10',
    name: 'Standard Representative Discretion (Up to 10%)',
    nameAr: 'خصم مندوب المبيعات المعتاد (حتى 10%)',
    discountType: 'LINE_PERCENT',
    value: 10,
    maxDiscountThreshold: 10,
    requiresSupervisorApprovalAbove: 10,
    isActive: true
  },
  {
    id: 'disc-supervisor-tier',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'DISC-SUP-20',
    name: 'Sales Supervisor Authorization (Up to 20%)',
    nameAr: 'صلاحية خصم مشرف المبيعات (حتى 20%)',
    discountType: 'LINE_PERCENT',
    value: 20,
    maxDiscountThreshold: 20,
    requiresSupervisorApprovalAbove: 15,
    isActive: true
  },
  {
    id: 'disc-enterprise-doc',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'DISC-DOC-5000',
    name: 'Enterprise Contract Volume Rebate (5,000 SAR)',
    nameAr: 'خصم عقود الشركات الكبرى (5000 ريال)',
    discountType: 'DOC_FIXED',
    value: 5000,
    maxDiscountThreshold: 5000,
    minOrderValue: 100000,
    requiresSupervisorApprovalAbove: 3000,
    isActive: true
  }
];

export const INITIAL_PROMOTIONS: PromotionCampaign[] = [
  {
    id: 'promo-buy2get1',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'PROMO-B2G1-SUPPORT',
    name: 'Buy 2 Database Tuning, Get 1 Free',
    nameAr: 'اشتر ساعتي ضبط قواعد بيانات واحصل على الثالثة مجاناً',
    type: 'BUY_X_GET_Y',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    buyItemSku: 'SRV-001',
    buyQuantityRequired: 2,
    freeItemSku: 'SRV-001',
    freeQuantityGranted: 1,
    redemptionsCount: 14,
    isActive: true
  },
  {
    id: 'promo-tech-launch',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'TECH2026',
    name: 'Q3 Enterprise Digital Transformation 10% Voucher',
    nameAr: 'قسيمة التحول الرقمي للربع الثالث خصم 10%',
    type: 'COUPON_CODE',
    couponCode: 'TECH2026',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    minCartValue: 5000,
    discountPercent: 10,
    maxRedemptionsTotal: 100,
    redemptionsCount: 28,
    isActive: true
  },
  {
    id: 'promo-pos-hardware-bundle',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'BUNDLE-POS-PRO',
    name: 'Complete POS Retail Station Bundle (Printer + Scanner + Cash Drawer)',
    nameAr: 'حزمة محطة نقاط البيع الكاملة (طابعة + قارئ + صندوق)',
    type: 'FIXED_DISCOUNT',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    discountFixedAmount: 300,
    minCartValue: 2000,
    redemptionsCount: 9,
    isActive: true
  }
];

export const INITIAL_SALES_QUOTATIONS: SalesQuotation[] = [
  {
    id: 'qt-101',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    quotationNumber: 'QT-2026-0101',
    customerId: 'cust-001',
    customerName: 'Aramco Digital Services',
    customerNameAr: 'أرامكو للخدمات الرقمية',
    customerEmail: 'procurement@aramcodigital.sa',
    customerPhone: '+966 13 874 0000',
    salespersonId: 'usr-002',
    salespersonName: 'Tariq Al-Mansoor',
    issueDate: '2026-08-01',
    validUntil: '2026-08-31',
    currency: 'SAR',
    exchangeRate: 1.0,
    lines: [
      {
        id: 'ql-1',
        itemSku: 'SW-ERP-USR',
        itemName: 'AM Enterprise ERP User License (Tier 1)',
        itemNameAr: 'ترخيص مستخدم نظام تخطيط الموارد',
        uom: 'USER',
        quantity: 25,
        unitPrice: 9800,
        discountRate: 0,
        discountAmount: 0,
        taxCode: 'VAT15',
        taxRate: 0.15,
        taxAmount: 36750,
        lineTotal: 281750,
        availableStock: 100
      },
      {
        id: 'ql-2',
        itemSku: 'SRV-002',
        itemName: 'Annual 24/7 SLA Technical Support',
        itemNameAr: 'دعم فني سنوي متواصل على مدار الساعة',
        uom: 'YEAR',
        quantity: 1,
        unitPrice: 4500,
        discountRate: 0.10,
        discountAmount: 450,
        taxCode: 'VAT15',
        taxRate: 0.15,
        taxAmount: 607.5,
        lineTotal: 4657.5,
        availableStock: 999
      }
    ],
    subtotal: 249500,
    discountTotal: 450,
    taxTotal: 37357.5,
    grandTotal: 286407.5,
    status: 'ACCEPTED',
    termsAndConditions: 'Payment terms: 50% Advance, 50% upon SLA deployment. Valid for 30 calendar days.',
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-05T14:30:00Z'
  },
  {
    id: 'qt-102',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    quotationNumber: 'QT-2026-0102',
    customerId: 'cust-002',
    customerName: 'STC Solutions Cloud Unit',
    customerNameAr: 'إس تي سي حلول السحابية',
    customerEmail: 'enterprise@stcsolutions.sa',
    customerPhone: '+966 11 455 5555',
    salespersonId: 'usr-002',
    salespersonName: 'Tariq Al-Mansoor',
    issueDate: '2026-08-10',
    validUntil: '2026-09-10',
    currency: 'SAR',
    exchangeRate: 1.0,
    lines: [
      {
        id: 'ql-3',
        itemSku: 'HW-SRV-RACK',
        itemName: 'Dell PowerEdge R750 Enterprise Server',
        itemNameAr: 'خادم ديل المؤسسي',
        uom: 'UNIT',
        quantity: 4,
        unitPrice: 26000,
        discountRate: 0.05,
        discountAmount: 5200,
        taxCode: 'VAT15',
        taxRate: 0.15,
        taxAmount: 14820,
        lineTotal: 113620,
        availableStock: 8
      }
    ],
    subtotal: 104000,
    discountTotal: 5200,
    taxTotal: 14820,
    grandTotal: 113620,
    status: 'SENT_TO_CUSTOMER',
    termsAndConditions: 'Hardware includes 3-year ProSupport Plus warranty on-site.',
    createdAt: '2026-08-10T11:15:00Z',
    updatedAt: '2026-08-10T11:15:00Z'
  }
];

export const INITIAL_SALES_ORDERS: SalesOrder[] = [
  {
    id: 'so-201',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    orderNumber: 'SO-2026-0201',
    quotationRefId: 'qt-101',
    quotationRefNumber: 'QT-2026-0101',
    customerPurchaseOrderNumber: 'PO-ARAMCO-88291',
    customerId: 'cust-001',
    customerName: 'Aramco Digital Services',
    customerNameAr: 'أرامكو للخدمات الرقمية',
    customerCategory: 'ENTERPRISE',
    customerTaxNumber: '300000000000003',
    shippingAddress: 'Dhahran Complex, Tower 4, Floor 8',
    billingAddress: 'Dhahran Complex, Finance HQ',
    salespersonId: 'usr-002',
    salespersonName: 'Tariq Al-Mansoor',
    orderDate: '2026-08-06',
    requestedDeliveryDate: '2026-08-20',
    currency: 'SAR',
    exchangeRate: 1.0,
    paymentTermsCode: 'NET_30',
    paymentMethodType: 'BANK_TRANSFER',
    lines: [
      {
        id: 'sol-1',
        lineNumber: 1,
        itemSku: 'SW-ERP-USR',
        itemName: 'AM Enterprise ERP User License (Tier 1)',
        itemNameAr: 'ترخيص مستخدم نظام تخطيط الموارد',
        uom: 'USER',
        warehouseId: 'wh-001',
        warehouseName: 'Central Logistics Hub (Riyadh)',
        quantityOrdered: 25,
        quantityReserved: 25,
        quantityFulfilled: 25,
        quantityReturned: 0,
        quantityCancelled: 0,
        unitPrice: 9800,
        appliedPriceListId: 'pl-retail-std',
        lineDiscountType: 'PERCENT',
        discountRate: 0,
        discountAmount: 0,
        discountApprovalRequired: false,
        taxCode: 'VAT15',
        taxRate: 0.15,
        taxAmount: 36750,
        lineTotal: 281750
      },
      {
        id: 'sol-2',
        lineNumber: 2,
        itemSku: 'SRV-002',
        itemName: 'Annual 24/7 SLA Technical Support',
        itemNameAr: 'دعم فني سنوي متواصل على مدار الساعة',
        uom: 'YEAR',
        warehouseId: 'wh-001',
        warehouseName: 'Central Logistics Hub (Riyadh)',
        quantityOrdered: 1,
        quantityReserved: 1,
        quantityFulfilled: 1,
        quantityReturned: 0,
        quantityCancelled: 0,
        unitPrice: 4500,
        appliedPriceListId: 'pl-retail-std',
        lineDiscountType: 'PERCENT',
        discountRate: 0.10,
        discountAmount: 450,
        discountApprovalRequired: false,
        taxCode: 'VAT15',
        taxRate: 0.15,
        taxAmount: 607.5,
        lineTotal: 4657.5
      }
    ],
    subtotal: 249500,
    headerDiscountRate: 0,
    headerDiscountAmount: 450,
    taxTotal: 37357.5,
    grandTotal: 286407.5,
    status: 'FULFILLED',
    stockReservationStatus: 'FULLY_RESERVED',
    arInvoiceId: 'inv-ar-771',
    arInvoiceNumber: 'SINV-2026-0501',
    stateTransitions: [
      {
        id: 'so-trans-1',
        orderId: 'so-201',
        orderNumber: 'SO-2026-0201',
        fromStatus: 'DRAFT',
        toStatus: 'CONFIRMED',
        reason: 'Converted from Quotation #QT-2026-0101 upon PO confirmation',
        performedBy: 'usr-002',
        performedByName: 'Tariq Al-Mansoor',
        performedByRole: 'Sales Lead',
        timestamp: '2026-08-06T10:00:00Z',
        digitalSealSha256: 'sha256_8819ab29fbc90012e84711ac'
      },
      {
        id: 'so-trans-2',
        orderId: 'so-201',
        orderNumber: 'SO-2026-0201',
        fromStatus: 'CONFIRMED',
        toStatus: 'FULFILLED',
        reason: 'Licenses deployed and SLA activated',
        performedBy: 'usr-001',
        performedByName: 'Ahmad Mounir (CFO)',
        performedByRole: 'Super Admin',
        timestamp: '2026-08-07T11:30:00Z',
        digitalSealSha256: 'sha256_77bb43a19ff084221ccae901'
      }
    ],
    createdAt: '2026-08-06T10:00:00Z',
    updatedAt: '2026-08-07T11:30:00Z',
    sha256AuditSeal: 'sha256_so_audit_201_verified'
  },
  {
    id: 'so-202',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    orderNumber: 'SO-2026-0202',
    customerPurchaseOrderNumber: 'PO-NEOM-2026-441',
    customerId: 'cust-003',
    customerName: 'NEOM Technology Foundation',
    customerNameAr: 'مؤسسة نيوم للتقنية',
    customerCategory: 'GOVERNMENT',
    customerTaxNumber: '300000000000005',
    shippingAddress: 'NEOM Bay Logistics Center, Sector 3',
    billingAddress: 'NEOM Finance & Accounting Hub',
    salespersonId: 'usr-002',
    salespersonName: 'Tariq Al-Mansoor',
    orderDate: '2026-08-12',
    requestedDeliveryDate: '2026-08-25',
    currency: 'SAR',
    exchangeRate: 1.0,
    paymentTermsCode: 'NET_60',
    paymentMethodType: 'BANK_TRANSFER',
    lines: [
      {
        id: 'sol-3',
        lineNumber: 1,
        itemSku: 'NET-CIS-SW48',
        itemName: 'Cisco Catalyst 48-Port Managed Switch',
        itemNameAr: 'موزع سيسكو 48 منفذ المُدار',
        uom: 'UNIT',
        warehouseId: 'wh-001',
        warehouseName: 'Central Logistics Hub (Riyadh)',
        quantityOrdered: 8,
        quantityReserved: 8,
        quantityFulfilled: 0,
        quantityReturned: 0,
        quantityCancelled: 0,
        unitPrice: 6200,
        appliedPriceListId: 'pl-retail-std',
        lineDiscountType: 'PERCENT',
        discountRate: 0.08,
        discountAmount: 3968,
        discountApprovalRequired: false,
        taxCode: 'VAT15',
        taxRate: 0.15,
        taxAmount: 6844.8,
        lineTotal: 52476.8
      }
    ],
    subtotal: 49600,
    headerDiscountRate: 0,
    headerDiscountAmount: 3968,
    taxTotal: 6844.8,
    grandTotal: 52476.8,
    status: 'CONFIRMED',
    stockReservationStatus: 'FULLY_RESERVED',
    stateTransitions: [
      {
        id: 'so-trans-3',
        orderId: 'so-202',
        orderNumber: 'SO-2026-0202',
        fromStatus: 'DRAFT',
        toStatus: 'CONFIRMED',
        reason: 'Direct government procurement order verified and confirmed',
        performedBy: 'usr-002',
        performedByName: 'Tariq Al-Mansoor',
        performedByRole: 'Sales Lead',
        timestamp: '2026-08-12T08:45:00Z',
        digitalSealSha256: 'sha256_994827bbceaa33451000f1'
      }
    ],
    createdAt: '2026-08-12T08:45:00Z',
    updatedAt: '2026-08-12T08:45:00Z',
    sha256AuditSeal: 'sha256_so_audit_202_verified'
  }
];

export const INITIAL_POS_REGISTERS: POSRegister[] = [
  {
    id: 'pos-reg-01',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    warehouseId: 'wh-001',
    code: 'REG-01-MAIN',
    name: 'Main Retail Counter #01',
    nameAr: 'نقطة البيع الرئيسية 01',
    currentShiftId: 'shift-1001',
    isActive: true,
    cashDrawerStatus: 'CLOSED',
    defaultCashAccountId: 'acc-1010-cash',
    defaultBankAccountId: 'acc-1020-bank',
    printerIpOrName: '192.168.1.150 (Epson TM-T88VI)'
  },
  {
    id: 'pos-reg-02',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    warehouseId: 'wh-001',
    code: 'REG-02-EXP',
    name: 'Express Checkout Counter #02',
    nameAr: 'نقطة البيع السريع 02',
    isActive: true,
    cashDrawerStatus: 'CLOSED',
    defaultCashAccountId: 'acc-1010-cash',
    defaultBankAccountId: 'acc-1020-bank',
    printerIpOrName: '192.168.1.151 (Star Micronics TSP143)'
  }
];

export const INITIAL_POS_SHIFTS: POSShift[] = [
  {
    id: 'shift-1001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    warehouseId: 'wh-001',
    registerId: 'pos-reg-01',
    registerCode: 'REG-01-MAIN',
    shiftNumber: 'SH-2026-0815-01',
    cashierId: 'usr-003',
    cashierName: 'Omar Al-Ghamdi',
    openedAt: '2026-08-15T07:00:00Z',
    status: 'OPEN',
    openingCashFloat: 1500,
    totalCashSales: 4850,
    totalCardSales: 12400,
    totalWalletSales: 2100,
    totalCreditSales: 0,
    totalCashRefunds: 0,
    totalCashDrops: 2000,
    totalPettyExpenses: 150,
    expectedCashInDrawer: 4200, // 1500 + 4850 - 2000 - 150
    totalTransactionsCount: 18,
    totalItemsSoldCount: 34,
    zReportGenerated: false,
    cashMovements: [
      {
        id: 'mov-1',
        shiftId: 'shift-1001',
        type: 'OPENING_FLOAT',
        amount: 1500,
        currency: 'SAR',
        reason: 'Initial morning cash drawer float count',
        performedBy: 'usr-003',
        performedByName: 'Omar Al-Ghamdi',
        timestamp: '2026-08-15T07:00:00Z'
      },
      {
        id: 'mov-2',
        shiftId: 'shift-1001',
        type: 'CASH_DROP',
        amount: 2000,
        currency: 'SAR',
        reason: 'Midday cash drop to Main Vault (Safe)',
        performedBy: 'usr-003',
        performedByName: 'Omar Al-Ghamdi',
        timestamp: '2026-08-15T12:00:00Z'
      },
      {
        id: 'mov-3',
        shiftId: 'shift-1001',
        type: 'PETTY_EXPENSE',
        amount: 150,
        currency: 'SAR',
        reason: 'Emergency register receipt paper roll pack purchase',
        performedBy: 'usr-003',
        performedByName: 'Omar Al-Ghamdi',
        timestamp: '2026-08-15T13:30:00Z'
      }
    ],
    createdAt: '2026-08-15T07:00:00Z',
    updatedAt: '2026-08-15T13:30:00Z'
  }
];

export const INITIAL_POS_RECEIPTS: POSReceipt[] = [
  {
    id: 'rcpt-1001',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    warehouseId: 'wh-001',
    registerId: 'pos-reg-01',
    shiftId: 'shift-1001',
    receiptNumber: 'POS-2026-01001',
    transactionType: 'SALE',
    customerId: 'cust-walkin',
    customerName: 'Walk-in Retail Customer',
    isWalkInCustomer: true,
    cashierId: 'usr-003',
    cashierName: 'Omar Al-Ghamdi',
    lines: [
      {
        id: 'rcpt-line-1',
        itemSku: 'POS-SCN-WL',
        barcode: '628100100201',
        itemName: 'Industrial 2D Barcode Scanner (Bluetooth)',
        itemNameAr: 'قارئ باركود ثنائي الأبعاد صناعي لاسلكي',
        uom: 'UNIT',
        quantity: 2,
        unitPrice: 850,
        originalUnitPrice: 850,
        discountAmount: 0,
        discountPercentage: 0,
        taxRate: 0.15,
        taxAmount: 255,
        lineTotal: 1955
      },
      {
        id: 'rcpt-line-2',
        itemSku: 'POS-PRN-TH',
        barcode: '628100100202',
        itemName: 'High-Speed Thermal Receipt Printer (80mm)',
        itemNameAr: 'طابعة إيصالات حرارية عالية السرعة',
        uom: 'UNIT',
        quantity: 1,
        unitPrice: 1150,
        originalUnitPrice: 1150,
        discountAmount: 115,
        discountPercentage: 10,
        taxRate: 0.15,
        taxAmount: 155.25,
        lineTotal: 1190.25
      }
    ],
    subtotal: 2850,
    discountTotal: 115,
    taxTotal: 410.25,
    grandTotal: 3145.25,
    payments: [
      {
        id: 'pay-1',
        method: 'DEBIT_CARD',
        amount: 3145.25,
        currency: 'SAR',
        exchangeRate: 1.0,
        cardBrand: 'MADA',
        cardLast4: '4092',
        treasuryAccountCode: '1020',
        treasuryAccountId: 'acc-1020-bank',
        transactionStatus: 'CAPTURED',
        authCode: 'MADA-882194',
        capturedAt: '2026-08-15T09:14:20Z'
      }
    ],
    changeGiven: 0,
    status: 'COMPLETED',
    qrCodePayload: 'ZATCA-QR|comp-001|POS-2026-01001|2026-08-15T09:14:20Z|3145.25|410.25',
    sha256Seal: 'sha256_pos_rcpt_1001_seal',
    createdAt: '2026-08-15T09:14:20Z'
  }
];

export const INITIAL_SALES_RETURNS: SalesReturn[] = [
  {
    id: 'sret-01',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    returnNumber: 'SRTN-2026-0041',
    returnType: 'PARTIAL_RETURN',
    originalDocumentType: 'POS_RECEIPT',
    originalDocumentId: 'rcpt-990',
    originalDocumentNumber: 'POS-2026-00990',
    customerId: 'cust-walkin',
    customerName: 'Walk-in Retail Customer',
    lines: [
      {
        id: 'sret-line-1',
        itemSku: 'POS-SCN-WL',
        itemName: 'Industrial 2D Barcode Scanner (Bluetooth)',
        quantityReturned: 1,
        unitPrice: 850,
        refundAmount: 977.5,
        returnReasonCode: 'DEFECTIVE_OUT_OF_BOX',
        returnReasonText: 'Bluetooth pairing failure out of box',
        restockWarehouseId: 'wh-001',
        condition: 'DAMAGED_SCRAP'
      }
    ],
    refundSubtotal: 850,
    refundTaxTotal: 127.5,
    refundGrandTotal: 977.5,
    refundMethod: 'CASH',
    approvedBy: 'usr-001',
    status: 'COMPLETED',
    sha256Seal: 'sha256_sret_01_verified',
    createdAt: '2026-08-14T16:20:00Z'
  }
];

// ==================== PHASE 3.1 HARDENING SEED DATA ====================

export const INITIAL_POS_DEVICES = [
  {
    id: 'dev-pos-01',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    branchName: 'Riyadh Main Branch',
    deviceCode: 'DEV-POS-01',
    deviceName: 'Register 01 Terminal (Front Desk)',
    deviceType: 'DESKTOP_POS' as const,
    macAddressOrFingerprint: '00:1A:2B:3C:4D:5E',
    assignedUserId: 'usr-001',
    assignedUserName: 'Ahmed Mounir (Lead Cashier)',
    assignedTerminalId: 'reg-01',
    appVersion: '2.8.0-build.104',
    registeredAt: '2026-01-10T08:00:00Z',
    lastSyncAt: '2026-08-15T09:45:00Z',
    lastHeartbeatAt: '2026-08-15T10:15:00Z',
    isActive: true,
    isAuthorized: true,
    connectivityStatus: 'ONLINE' as const,
    localPendingQueueCount: 0,
    deviceHealth: 'HEALTHY' as const,
    allowedOfflineDays: 7,
    securityTokenHash: 'sha256_tok_pos01_sec'
  },
  {
    id: 'dev-mob-02',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-001',
    branchName: 'Riyadh Main Branch',
    deviceCode: 'DEV-MOB-02',
    deviceName: 'Field Sales Tablet (Van #04)',
    deviceType: 'TABLET' as const,
    macAddressOrFingerprint: 'A4:C3:F0:89:12:34',
    assignedUserId: 'usr-002',
    assignedUserName: 'Tariq Al-Mansoor (Field Rep)',
    appVersion: '2.8.0-build.104',
    registeredAt: '2026-02-01T09:30:00Z',
    lastSyncAt: '2026-08-15T08:12:00Z',
    lastHeartbeatAt: '2026-08-15T10:00:00Z',
    isActive: true,
    isAuthorized: true,
    connectivityStatus: 'OFFLINE' as const,
    localPendingQueueCount: 3,
    deviceHealth: 'HEALTHY' as const,
    allowedOfflineDays: 5,
    securityTokenHash: 'sha256_tok_mob02_sec'
  },
  {
    id: 'dev-mob-03',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-002',
    branchName: 'Jeddah Regional Hub',
    deviceCode: 'DEV-MOB-03',
    deviceName: 'Sales Phone (Jeddah North Route)',
    deviceType: 'MOBILE_PHONE' as const,
    macAddressOrFingerprint: 'B2:44:88:99:EE:11',
    assignedUserId: 'usr-003',
    assignedUserName: 'Khalid Al-Ghamdi',
    appVersion: '2.7.9-legacy',
    registeredAt: '2026-03-15T11:00:00Z',
    lastSyncAt: '2026-08-12T14:20:00Z',
    lastHeartbeatAt: '2026-08-15T06:00:00Z',
    isActive: true,
    isAuthorized: true,
    connectivityStatus: 'OFFLINE' as const,
    localPendingQueueCount: 5,
    deviceHealth: 'SYNC_DELAYED' as const,
    allowedOfflineDays: 3,
    securityTokenHash: 'sha256_tok_mob03_sec'
  }
];

export const INITIAL_OFFLINE_QUEUE = [
  {
    id: 'off-tx-001',
    globalCorrelationId: 'corr-comp-001-20260815-9921',
    idempotencyKey: 'idemp-dev-mob-02-1-1755250000',
    deviceId: 'dev-mob-02',
    deviceName: 'Field Sales Tablet (Van #04)',
    userId: 'usr-002',
    userName: 'Tariq Al-Mansoor',
    companyId: 'comp-001',
    branchId: 'br-001',
    timestamp: '2026-08-15T08:30:00Z',
    localSequence: 1,
    syncStatus: 'QUEUED' as const,
    transactionType: 'CUSTOMER_ORDER' as const,
    tempDocumentNumber: 'OFF-MOB-02-ORDER-20260815-0001',
    payload: {
      customerId: 'cust-101',
      customerName: 'Al-Mansoor Trading Est',
      lines: [
        { itemSku: 'POS-TRM-T5', itemName: 'Smart POS Touch Terminal T5', quantityOrdered: 2, unitPrice: 2850, lineTotal: 6555 }
      ],
      subtotal: 5700,
      taxTotal: 855,
      grandTotal: 6555,
      paymentTerms: 'NET_30'
    },
    retryCount: 0,
    maxRetries: 5,
    encryptedChecksumSha256: 'sha256_off_tx_001_chksum'
  },
  {
    id: 'off-tx-002',
    globalCorrelationId: 'corr-comp-001-20260815-9922',
    idempotencyKey: 'idemp-dev-mob-02-2-1755250100',
    deviceId: 'dev-mob-02',
    deviceName: 'Field Sales Tablet (Van #04)',
    userId: 'usr-002',
    userName: 'Tariq Al-Mansoor',
    companyId: 'comp-001',
    branchId: 'br-001',
    timestamp: '2026-08-15T08:55:00Z',
    localSequence: 2,
    syncStatus: 'QUEUED' as const,
    transactionType: 'CASH_COLLECTION' as const,
    tempDocumentNumber: 'OFF-MOB-02-COLLECT-20260815-0002',
    payload: {
      customerId: 'cust-102',
      customerName: 'Delta Systems & Networks',
      amountCollected: 3500,
      paymentReference: 'CASH-REC-VAN04-881',
      treasuryAccountId: 'acc-1010-cash',
      treasuryAccountCode: '1010'
    },
    retryCount: 0,
    maxRetries: 5,
    encryptedChecksumSha256: 'sha256_off_tx_002_chksum'
  },
  {
    id: 'off-tx-003',
    globalCorrelationId: 'corr-comp-001-20260815-9923',
    idempotencyKey: 'idemp-dev-mob-02-3-1755250200',
    deviceId: 'dev-mob-02',
    deviceName: 'Field Sales Tablet (Van #04)',
    userId: 'usr-002',
    userName: 'Tariq Al-Mansoor',
    companyId: 'comp-001',
    branchId: 'br-001',
    timestamp: '2026-08-15T09:15:00Z',
    localSequence: 3,
    syncStatus: 'CONFLICT' as const,
    transactionType: 'SALE' as const,
    tempDocumentNumber: 'OFF-MOB-02-SALE-20260815-0003',
    payload: {
      customerId: 'cust-103',
      customerName: 'Gulf Modern Clinics',
      lines: [
        { itemSku: 'POS-SCN-WL', itemName: 'Industrial 2D Barcode Scanner (Bluetooth)', quantity: 5, unitPrice: 750, lineTotal: 4312.5 }
      ],
      subtotal: 3750,
      taxTotal: 562.5,
      grandTotal: 4312.5
    },
    retryCount: 1,
    maxRetries: 5,
    errorMessage: 'Price mismatch: Client offline price (750) differs from server base price (850).',
    conflictDetails: {
      id: 'conf-101',
      transactionId: 'off-tx-003',
      tempDocNumber: 'OFF-MOB-02-SALE-20260815-0003',
      conflictType: 'PRICE_MISMATCH' as const,
      detectedAt: '2026-08-15T09:20:00Z',
      clientState: { itemSku: 'POS-SCN-WL', unitPrice: 750 },
      serverState: { itemSku: 'POS-SCN-WL', basePrice: 850 },
      differenceExplanation: 'Special on-field discount applied by representative requires supervisor approval or price list alignment.',
      resolutionStatus: 'PENDING' as const,
      appliedResolution: 'MANUAL_REVIEW' as const,
      auditTrailSha256: 'sha256_conf_101_audit'
    },
    encryptedChecksumSha256: 'sha256_off_tx_003_chksum'
  }
];

export const INITIAL_MOBILE_CUSTOMERS = [
  {
    id: 'cust-101',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'CUST-101',
    name: 'Al-Mansoor Trading Est',
    nameAr: 'مؤسسة المنصور للتجارة',
    phone: '+966 50 111 2233',
    email: 'info@almansoor.com.sa',
    creditLimit: 100000,
    currentBalance: 35000,
    availableCredit: 65000,
    priceListId: 'pl-wholesale-std',
    paymentTerms: 'NET_30',
    taxRegistrationNumber: '300123456700003',
    address: 'King Fahd Road, Al-Olaya',
    city: 'Riyadh',
    latitude: 24.7136,
    longitude: 46.6753,
    status: 'ACTIVE' as const,
    snapshotTimestamp: '2026-08-15T06:00:00Z'
  },
  {
    id: 'cust-102',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'CUST-102',
    name: 'Delta Systems & Networks',
    nameAr: 'شركة دلتا للأنظمة والشبكات',
    phone: '+966 54 222 3344',
    email: 'purchasing@delta-sys.com',
    creditLimit: 75000,
    currentBalance: 52000,
    availableCredit: 23000,
    priceListId: 'pl-retail-std',
    paymentTerms: 'NET_15',
    taxRegistrationNumber: '300987654300003',
    address: 'Prince Sultan St, Al-Rawdah',
    city: 'Jeddah',
    latitude: 21.5433,
    longitude: 39.1728,
    status: 'ACTIVE' as const,
    snapshotTimestamp: '2026-08-15T06:00:00Z'
  },
  {
    id: 'cust-103',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    code: 'CUST-103',
    name: 'Gulf Modern Clinics',
    nameAr: 'مجمع العيادات الخليجية الحديثة',
    phone: '+966 56 333 4455',
    email: 'admin@gulfclinics.sa',
    creditLimit: 40000,
    currentBalance: 39500,
    availableCredit: 500,
    priceListId: 'pl-vip-corp',
    paymentTerms: 'DUE_ON_RECEIPT',
    taxRegistrationNumber: '300555444300003',
    address: 'Al-Khobar Dammam Highway',
    city: 'Khobar',
    latitude: 26.2172,
    longitude: 50.1971,
    status: 'ACTIVE' as const,
    snapshotTimestamp: '2026-08-15T06:00:00Z'
  }
];

export const INITIAL_MOBILE_PRODUCTS = [
  {
    sku: 'POS-TRM-T5',
    barcode: '628100100201',
    name: 'Smart POS Touch Terminal T5',
    nameAr: 'شاشة نقطة بيع ذكية T5 باللمس',
    uom: 'PCS',
    basePrice: 3100,
    costPrice: 2100,
    qtyOnHand: 45,
    qtyReserved: 5,
    qtyAvailableOffline: 35,
    safetyBuffer: 5,
    category: 'Hardware',
    isStale: false,
    snapshotTimestamp: '2026-08-15T06:00:00Z'
  },
  {
    sku: 'POS-PRN-80',
    barcode: '628100100202',
    name: 'High-Speed Thermal Receipt Printer 80mm',
    nameAr: 'طابعة إيصالات حرارية 80 مم',
    uom: 'PCS',
    basePrice: 650,
    costPrice: 420,
    qtyOnHand: 80,
    qtyReserved: 10,
    qtyAvailableOffline: 60,
    safetyBuffer: 10,
    category: 'Hardware',
    isStale: false,
    snapshotTimestamp: '2026-08-15T06:00:00Z'
  },
  {
    sku: 'POS-SCN-WL',
    barcode: '628100100203',
    name: 'Industrial 2D Barcode Scanner (Bluetooth)',
    nameAr: 'قارئ باركود لاسلكي 2D بلوتوث',
    uom: 'PCS',
    basePrice: 850,
    costPrice: 530,
    qtyOnHand: 60,
    qtyReserved: 8,
    qtyAvailableOffline: 42,
    safetyBuffer: 10,
    category: 'Hardware',
    isStale: false,
    snapshotTimestamp: '2026-08-15T06:00:00Z'
  },
  {
    sku: 'ACC-DRW-HD',
    barcode: '628100100204',
    name: 'Heavy Duty Steel Cash Drawer',
    nameAr: 'درج كاشير فولاذي للأحمال الشاقة',
    uom: 'PCS',
    basePrice: 380,
    costPrice: 220,
    qtyOnHand: 110,
    qtyReserved: 12,
    qtyAvailableOffline: 85,
    safetyBuffer: 13,
    category: 'Accessories',
    isStale: false,
    snapshotTimestamp: '2026-08-15T06:00:00Z'
  }
];

export const INITIAL_SALES_REP_TARGETS = [
  {
    id: 'tgt-rep-02',
    salesRepId: 'usr-002',
    salesRepName: 'Tariq Al-Mansoor',
    period: '2026-08',
    targetRevenue: 150000,
    achievedRevenue: 98500,
    targetVisitsCount: 60,
    achievedVisitsCount: 44,
    targetNewCustomers: 5,
    achievedNewCustomers: 3,
    targetCollectionsAmount: 80000,
    achievedCollectionsAmount: 62000,
    commissionRatePercent: 2.5,
    commissionEarned: 2462.5
  }
];

export const INITIAL_SALES_REP_ACTIVITIES = [
  {
    id: 'act-001',
    salesRepId: 'usr-002',
    salesRepName: 'Tariq Al-Mansoor',
    customerId: 'cust-101',
    customerName: 'Al-Mansoor Trading Est',
    activityType: 'VISIT_CHECKIN' as const,
    timestamp: '2026-08-15T08:15:00Z',
    location: { lat: 24.7136, lng: 46.6753, address: 'King Fahd Road, Riyadh' },
    notes: 'Checked stock requirements for POS terminals upgrade.',
    offlineGenerated: true
  },
  {
    id: 'act-002',
    salesRepId: 'usr-002',
    salesRepName: 'Tariq Al-Mansoor',
    customerId: 'cust-101',
    customerName: 'Al-Mansoor Trading Est',
    activityType: 'ORDER_TAKEN' as const,
    timestamp: '2026-08-15T08:30:00Z',
    documentReference: 'OFF-MOB-02-ORDER-20260815-0001',
    amount: 6555,
    notes: 'Order placed for 2x T5 touch terminals.',
    offlineGenerated: true
  },
  {
    id: 'act-003',
    salesRepId: 'usr-002',
    salesRepName: 'Tariq Al-Mansoor',
    customerId: 'cust-102',
    customerName: 'Delta Systems & Networks',
    activityType: 'COLLECTION_MADE' as const,
    timestamp: '2026-08-15T08:55:00Z',
    documentReference: 'OFF-MOB-02-COLLECT-20260815-0002',
    amount: 3500,
    notes: 'Collected partial invoice payment in cash.',
    offlineGenerated: true
  }
];

export const INITIAL_SYNC_AUDIT_LOGS = [
  {
    id: 'sync-aud-01',
    syncSessionId: 'batch-20260815-0812',
    deviceId: 'dev-mob-02',
    deviceName: 'Field Sales Tablet (Van #04)',
    userId: 'usr-002',
    userName: 'Tariq Al-Mansoor',
    companyId: 'comp-001',
    branchId: 'br-001',
    transactionId: 'off-tx-prev-10',
    transactionType: 'CUSTOMER_ORDER' as const,
    tempDocNumber: 'OFF-MOB-02-ORDER-20260815-0000',
    finalDocNumber: 'SO-2026-0204',
    attemptNumber: 1,
    timestamp: '2026-08-15T08:12:10Z',
    syncResult: 'SUCCESS' as const,
    correlationId: 'corr-comp-001-20260815-9900',
    payloadChecksumSha256: 'sha256_audit_prev_10_verified'
  }
];

