/**
 * AM Business Platform - Phase 3.1 Industry Configuration Layer & No-Code Foundation
 * Target Architecture: SAP S/4HANA Industry Solutions (IS-Retail, IS-Fashion, IS-Manufacturing), Oracle NetSuite Industry Suites
 * Architecture Baseline: v2.8
 * Rule: Configuration-driven behavior while maintaining zero compromise on accounting, audit, security, and period locks.
 */

import {
  IndustryProfileType,
  IndustryProfileConfig
} from '../types/sales';

export class IndustryConfigEngine {

  /**
   * Preconfigured standard profiles across 9 key industry verticals
   */
  static getStandardIndustryProfiles(): IndustryProfileConfig[] {
    return [
      {
        id: 'prof-retail',
        profileType: 'RETAIL',
        name: 'Supermarket & FMCG Retail',
        nameAr: 'تجارة التجزئة والسوبرماركت',
        description: 'Optimized for high-speed POS checkout, barcode scanning, customer loyalty, and rapid cash reconciliation.',
        descriptionAr: 'مُخصص لنقاط البيع السريعة، مسح الباركود، ولاء العملاء والتسوية النقدية الفورية.',
        isPreconfigured: true,
        isActive: true,
        posConfig: {
          enableBarcodeScanner: true,
          requireVariantSelection: false,
          enableImeiSerialTracking: false,
          enableTableManagement: false,
          enableKitchenDisplaySystem: false,
          enableWeighingScaleIntegration: true,
          enableFastCashButtons: true,
          defaultPaymentMethod: 'CASH',
          allowPriceOverride: false,
          allowNegativeStock: false
        },
        salesConfig: {
          requireCustomerSelection: false,
          defaultPriceListType: 'RETAIL',
          enableVolumeTierDiscounts: false,
          enableJobOrderIntegration: false,
          enableCustomsDeclarationField: false,
          enableBillOfQuantitiesBOM: false,
          enableWarrantyTracking: false,
          maxOrderDiscountThreshold: 10,
          mandatoryPaymentTerms: false
        },
        documentConfig: {
          orderPrefix: 'SO-RET',
          invoicePrefix: 'INV-RET',
          receiptPrefix: 'REC-RET',
          returnPrefix: 'RET-RET',
          customFields: [
            { key: 'cashierShiftCode', label: 'Shift Code', labelAr: 'رمز الوردية', fieldType: 'TEXT', required: false },
            { key: 'loyaltyCardNumber', label: 'Loyalty Card', labelAr: 'بطاقة الولاء', fieldType: 'TEXT', required: false }
          ]
        },
        governanceConfig: {
          supervisorApprovalDiscountPercent: 10,
          creditLimitBlockPolicy: 'HARD_BLOCK',
          allowOfflineOperations: true,
          maxOfflineTransactionAgeHours: 24
        }
      },
      {
        id: 'prof-fashion',
        profileType: 'FASHION',
        name: 'Fashion, Apparel & Footwear',
        nameAr: 'الأزياء والملابس والأحذية',
        description: 'Specialized for multi-variant matrix (Color x Size x Fit), seasonal price lists, and visual display cards.',
        descriptionAr: 'مخصص لمصفوفة المتغيرات (اللون × المقاس × القصة)، قوائم الأسعار الموسمية.',
        isPreconfigured: true,
        isActive: false,
        posConfig: {
          enableBarcodeScanner: true,
          requireVariantSelection: true,
          enableImeiSerialTracking: false,
          enableTableManagement: false,
          enableKitchenDisplaySystem: false,
          enableWeighingScaleIntegration: false,
          enableFastCashButtons: true,
          defaultPaymentMethod: 'DEBIT_CARD',
          allowPriceOverride: false,
          allowNegativeStock: false
        },
        salesConfig: {
          requireCustomerSelection: false,
          defaultPriceListType: 'RETAIL',
          enableVolumeTierDiscounts: true,
          enableJobOrderIntegration: false,
          enableCustomsDeclarationField: false,
          enableBillOfQuantitiesBOM: false,
          enableWarrantyTracking: false,
          maxOrderDiscountThreshold: 20,
          mandatoryPaymentTerms: false
        },
        documentConfig: {
          orderPrefix: 'SO-FSH',
          invoicePrefix: 'INV-FSH',
          receiptPrefix: 'REC-FSH',
          returnPrefix: 'RET-FSH',
          customFields: [
            { key: 'seasonCode', label: 'Season Code', labelAr: 'الموسم', fieldType: 'SELECT', required: false, options: ['Summer 2026', 'Winter 2026', 'Ramadan Collection'] },
            { key: 'brandTag', label: 'Brand Tag', labelAr: 'العلامة التجارية', fieldType: 'TEXT', required: false }
          ]
        },
        governanceConfig: {
          supervisorApprovalDiscountPercent: 15,
          creditLimitBlockPolicy: 'WARNING_WITH_OVERRIDE',
          allowOfflineOperations: true,
          maxOfflineTransactionAgeHours: 48
        }
      },
      {
        id: 'prof-mobile',
        profileType: 'MOBILE_ACCESSORIES',
        name: 'Electronics, Mobile & Accessories',
        nameAr: 'الإلكترونيات والجوالات وملحقاتها',
        description: 'Features mandatory IMEI / Serial Number verification, warranty certificate generation, and trade-in support.',
        descriptionAr: 'يتميز بإلزامية تتبع الرقم التسلسلي / IMEI، شهادات الضمان، والاستبدال.',
        isPreconfigured: true,
        isActive: false,
        posConfig: {
          enableBarcodeScanner: true,
          requireVariantSelection: true,
          enableImeiSerialTracking: true,
          enableTableManagement: false,
          enableKitchenDisplaySystem: false,
          enableWeighingScaleIntegration: false,
          enableFastCashButtons: true,
          defaultPaymentMethod: 'DEBIT_CARD',
          allowPriceOverride: true,
          allowNegativeStock: false
        },
        salesConfig: {
          requireCustomerSelection: true,
          defaultPriceListType: 'RETAIL',
          enableVolumeTierDiscounts: true,
          enableJobOrderIntegration: true,
          enableCustomsDeclarationField: false,
          enableBillOfQuantitiesBOM: false,
          enableWarrantyTracking: true,
          maxOrderDiscountThreshold: 12,
          mandatoryPaymentTerms: false
        },
        documentConfig: {
          orderPrefix: 'SO-MOB',
          invoicePrefix: 'INV-MOB',
          receiptPrefix: 'REC-MOB',
          returnPrefix: 'RET-MOB',
          customFields: [
            { key: 'deviceImei', label: 'Device IMEI', labelAr: 'الرقم التسلسلي للجهاز (IMEI)', fieldType: 'TEXT', required: true },
            { key: 'warrantyMonths', label: 'Warranty (Months)', labelAr: 'مدة الضمان (بالأشهر)', fieldType: 'NUMBER', required: true }
          ]
        },
        governanceConfig: {
          supervisorApprovalDiscountPercent: 10,
          creditLimitBlockPolicy: 'HARD_BLOCK',
          allowOfflineOperations: true,
          maxOfflineTransactionAgeHours: 24
        }
      },
      {
        id: 'prof-wholesale',
        profileType: 'WHOLESALE',
        name: 'B2B Wholesale & Distribution',
        nameAr: 'تجارة الجملة والتوزيع',
        description: 'Optimized for high-volume orders, tiered pricing matrices, representative field visits, and credit governance.',
        descriptionAr: 'مُعد للطلبات الكبيرة، مصفوفات الأسعار حسب الكمية، مندوبي المبيعات، وإدارة الائتمان.',
        isPreconfigured: true,
        isActive: false,
        posConfig: {
          enableBarcodeScanner: true,
          requireVariantSelection: false,
          enableImeiSerialTracking: false,
          enableTableManagement: false,
          enableKitchenDisplaySystem: false,
          enableWeighingScaleIntegration: true,
          enableFastCashButtons: false,
          defaultPaymentMethod: 'BANK_TRANSFER',
          allowPriceOverride: false,
          allowNegativeStock: false
        },
        salesConfig: {
          requireCustomerSelection: true,
          defaultPriceListType: 'WHOLESALE',
          enableVolumeTierDiscounts: true,
          enableJobOrderIntegration: false,
          enableCustomsDeclarationField: false,
          enableBillOfQuantitiesBOM: false,
          enableWarrantyTracking: false,
          maxOrderDiscountThreshold: 25,
          mandatoryPaymentTerms: true
        },
        documentConfig: {
          orderPrefix: 'SO-WHL',
          invoicePrefix: 'INV-WHL',
          receiptPrefix: 'REC-WHL',
          returnPrefix: 'RET-WHL',
          customFields: [
            { key: 'dispatchWarehouse', label: 'Dispatch Warehouse', labelAr: 'مستودع الصرف الرئيسي', fieldType: 'TEXT', required: true },
            { key: 'deliveryRouteId', label: 'Delivery Route', labelAr: 'خط التوزيع', fieldType: 'TEXT', required: false }
          ]
        },
        governanceConfig: {
          supervisorApprovalDiscountPercent: 12,
          creditLimitBlockPolicy: 'HARD_BLOCK',
          allowOfflineOperations: true,
          maxOfflineTransactionAgeHours: 72
        }
      },
      {
        id: 'prof-mfg',
        profileType: 'MANUFACTURING',
        name: 'Discrete & Process Manufacturing',
        nameAr: 'التصنيع والإنتاج الصناعي',
        description: 'Direct integration between Sales Orders, Work Orders, Bill of Materials (BOM), and production dispatch.',
        descriptionAr: 'ربط مباشر بين أوامر البيع، أوامر العمل، قوائم المواد والتصنيع.',
        isPreconfigured: true,
        isActive: false,
        posConfig: {
          enableBarcodeScanner: true,
          requireVariantSelection: false,
          enableImeiSerialTracking: true,
          enableTableManagement: false,
          enableKitchenDisplaySystem: false,
          enableWeighingScaleIntegration: true,
          enableFastCashButtons: false,
          defaultPaymentMethod: 'BANK_TRANSFER',
          allowPriceOverride: false,
          allowNegativeStock: false
        },
        salesConfig: {
          requireCustomerSelection: true,
          defaultPriceListType: 'WHOLESALE',
          enableVolumeTierDiscounts: true,
          enableJobOrderIntegration: true,
          enableCustomsDeclarationField: false,
          enableBillOfQuantitiesBOM: true,
          enableWarrantyTracking: true,
          maxOrderDiscountThreshold: 15,
          mandatoryPaymentTerms: true
        },
        documentConfig: {
          orderPrefix: 'SO-MFG',
          invoicePrefix: 'INV-MFG',
          receiptPrefix: 'REC-MFG',
          returnPrefix: 'RET-MFG',
          customFields: [
            { key: 'productionBatchRef', label: 'Production Batch Ref', labelAr: 'رقم تشغيلة الإنتاج', fieldType: 'TEXT', required: false },
            { key: 'specSheetNumber', label: 'Spec Sheet #', labelAr: 'رقم كراسة المواصفات', fieldType: 'TEXT', required: false }
          ]
        },
        governanceConfig: {
          supervisorApprovalDiscountPercent: 10,
          creditLimitBlockPolicy: 'HARD_BLOCK',
          allowOfflineOperations: false,
          maxOfflineTransactionAgeHours: 12
        }
      },
      {
        id: 'prof-restaurant',
        profileType: 'RESTAURANT',
        name: 'Restaurant, F&B & Hospitality',
        nameAr: 'المطاعم والضيافة والأغذية',
        description: 'Table floor plans, Kitchen Display System (KDS) order routing, split bills, and fast modifiers.',
        descriptionAr: 'إدارة الطاولات، نظام شاشات المطبخ، تقسيم الفواتير، والإضافات السريعة.',
        isPreconfigured: true,
        isActive: false,
        posConfig: {
          enableBarcodeScanner: false,
          requireVariantSelection: true,
          enableImeiSerialTracking: false,
          enableTableManagement: true,
          enableKitchenDisplaySystem: true,
          enableWeighingScaleIntegration: false,
          enableFastCashButtons: true,
          defaultPaymentMethod: 'DEBIT_CARD',
          allowPriceOverride: false,
          allowNegativeStock: true
        },
        salesConfig: {
          requireCustomerSelection: false,
          defaultPriceListType: 'RETAIL',
          enableVolumeTierDiscounts: false,
          enableJobOrderIntegration: false,
          enableCustomsDeclarationField: false,
          enableBillOfQuantitiesBOM: false,
          enableWarrantyTracking: false,
          maxOrderDiscountThreshold: 15,
          mandatoryPaymentTerms: false
        },
        documentConfig: {
          orderPrefix: 'ORD-REST',
          invoicePrefix: 'INV-REST',
          receiptPrefix: 'REC-REST',
          returnPrefix: 'RET-REST',
          customFields: [
            { key: 'tableNumber', label: 'Table #', labelAr: 'رقم الطاولة', fieldType: 'TEXT', required: false },
            { key: 'guestCount', label: 'Guests Count', labelAr: 'عدد الضيوف', fieldType: 'NUMBER', required: false }
          ]
        },
        governanceConfig: {
          supervisorApprovalDiscountPercent: 15,
          creditLimitBlockPolicy: 'ALLOW',
          allowOfflineOperations: true,
          maxOfflineTransactionAgeHours: 12
        }
      },
      {
        id: 'prof-service',
        profileType: 'SERVICE_CENTER',
        name: 'After-Sales & Maintenance Service Centers',
        nameAr: 'مراكز الصيانة والخدمات',
        description: 'Job cards, technician assignment, spare parts consumption, and warranty repair tracking.',
        descriptionAr: 'بطاقات عمل الصيانة، تعيين الفنيين، استهلاك قطع الغيار وإصلاحات الضمان.',
        isPreconfigured: true,
        isActive: false,
        posConfig: {
          enableBarcodeScanner: true,
          requireVariantSelection: false,
          enableImeiSerialTracking: true,
          enableTableManagement: false,
          enableKitchenDisplaySystem: false,
          enableWeighingScaleIntegration: false,
          enableFastCashButtons: true,
          defaultPaymentMethod: 'DEBIT_CARD',
          allowPriceOverride: true,
          allowNegativeStock: false
        },
        salesConfig: {
          requireCustomerSelection: true,
          defaultPriceListType: 'RETAIL',
          enableVolumeTierDiscounts: false,
          enableJobOrderIntegration: true,
          enableCustomsDeclarationField: false,
          enableBillOfQuantitiesBOM: false,
          enableWarrantyTracking: true,
          maxOrderDiscountThreshold: 15,
          mandatoryPaymentTerms: false
        },
        documentConfig: {
          orderPrefix: 'JOB-SRV',
          invoicePrefix: 'INV-SRV',
          receiptPrefix: 'REC-SRV',
          returnPrefix: 'RET-SRV',
          customFields: [
            { key: 'serviceJobCardId', label: 'Job Card #', labelAr: 'رقم بطاقة الصيانة', fieldType: 'TEXT', required: true },
            { key: 'technicianName', label: 'Assigned Technician', labelAr: 'اسم الفني المسئول', fieldType: 'TEXT', required: true }
          ]
        },
        governanceConfig: {
          supervisorApprovalDiscountPercent: 10,
          creditLimitBlockPolicy: 'HARD_BLOCK',
          allowOfflineOperations: true,
          maxOfflineTransactionAgeHours: 48
        }
      },
      {
        id: 'prof-const',
        profileType: 'CONSTRUCTION',
        name: 'Contracting & Construction Materials',
        nameAr: 'المقاولات ومواد البناء',
        description: 'Bill of Quantities (BOQ), milestone-based progress billings, delivery site dispatches, and retention money.',
        descriptionAr: 'جداول الكميات، مستخلصات الإنجاز، التوريد لمواقع المشاريع، ومبالغ الدفعة المقدمة والضمان.',
        isPreconfigured: true,
        isActive: false,
        posConfig: {
          enableBarcodeScanner: false,
          requireVariantSelection: false,
          enableImeiSerialTracking: false,
          enableTableManagement: false,
          enableKitchenDisplaySystem: false,
          enableWeighingScaleIntegration: true,
          enableFastCashButtons: false,
          defaultPaymentMethod: 'BANK_TRANSFER',
          allowPriceOverride: false,
          allowNegativeStock: false
        },
        salesConfig: {
          requireCustomerSelection: true,
          defaultPriceListType: 'WHOLESALE',
          enableVolumeTierDiscounts: true,
          enableJobOrderIntegration: true,
          enableCustomsDeclarationField: false,
          enableBillOfQuantitiesBOM: true,
          enableWarrantyTracking: false,
          maxOrderDiscountThreshold: 20,
          mandatoryPaymentTerms: true
        },
        documentConfig: {
          orderPrefix: 'SO-CON',
          invoicePrefix: 'INV-CON',
          receiptPrefix: 'REC-CON',
          returnPrefix: 'RET-CON',
          customFields: [
            { key: 'projectSiteLocation', label: 'Site Location', labelAr: 'موقع المشروع / الورشة', fieldType: 'TEXT', required: true },
            { key: 'milestoneStage', label: 'Milestone Stage', labelAr: 'مرحلة الإنجاز', fieldType: 'TEXT', required: false }
          ]
        },
        governanceConfig: {
          supervisorApprovalDiscountPercent: 8,
          creditLimitBlockPolicy: 'HARD_BLOCK',
          allowOfflineOperations: false,
          maxOfflineTransactionAgeHours: 24
        }
      },
      {
        id: 'prof-impexp',
        profileType: 'IMPORT_EXPORT',
        name: 'Import, Export & Cross-Border Trade',
        nameAr: 'الاستيراد والتصدير والتجارة الدولية',
        description: 'Multi-currency invoicing, customs declaration tracking, Bill of Lading references, and Incoterms.',
        descriptionAr: 'فواتير العملات الأجنبية، الإقرارات الجمركية، بوالص الشحن وشروط التجارة الدولية Incoterms.',
        isPreconfigured: true,
        isActive: false,
        posConfig: {
          enableBarcodeScanner: true,
          requireVariantSelection: false,
          enableImeiSerialTracking: false,
          enableTableManagement: false,
          enableKitchenDisplaySystem: false,
          enableWeighingScaleIntegration: false,
          enableFastCashButtons: false,
          defaultPaymentMethod: 'BANK_TRANSFER',
          allowPriceOverride: false,
          allowNegativeStock: false
        },
        salesConfig: {
          requireCustomerSelection: true,
          defaultPriceListType: 'EXPORT',
          enableVolumeTierDiscounts: true,
          enableJobOrderIntegration: false,
          enableCustomsDeclarationField: true,
          enableBillOfQuantitiesBOM: false,
          enableWarrantyTracking: false,
          maxOrderDiscountThreshold: 15,
          mandatoryPaymentTerms: true
        },
        documentConfig: {
          orderPrefix: 'SO-EXP',
          invoicePrefix: 'INV-EXP',
          receiptPrefix: 'REC-EXP',
          returnPrefix: 'RET-EXP',
          customFields: [
            { key: 'customsDeclarationNumber', label: 'Customs Declaration #', labelAr: 'رقم البيان الجمركي (46)', fieldType: 'TEXT', required: true },
            { key: 'incoterm', label: 'Incoterm', labelAr: 'شرط الشحن الدولي', fieldType: 'SELECT', required: true, options: ['FOB', 'CIF', 'EXW', 'DDP'] }
          ]
        },
        governanceConfig: {
          supervisorApprovalDiscountPercent: 10,
          creditLimitBlockPolicy: 'HARD_BLOCK',
          allowOfflineOperations: true,
          maxOfflineTransactionAgeHours: 72
        }
      }
    ];
  }

  /**
   * Validates custom configuration changes against non-bypassable architectural controls
   */
  static validateConfigurationIntegrity(config: IndustryProfileConfig): { isValid: boolean; securityViolations: string[] } {
    const violations: string[] = [];

    // 1. Cannot allow supervisor approval threshold > 50%
    if (config.governanceConfig.supervisorApprovalDiscountPercent > 50) {
      violations.push('Supervisor discount threshold cannot exceed 50% under core financial governance.');
    }

    // 2. Max offline transaction age cannot exceed 168 hours (7 days)
    if (config.governanceConfig.maxOfflineTransactionAgeHours > 168) {
      violations.push('Offline transaction age cannot exceed 168 hours (7 days) to preserve audit validity.');
    }

    // 3. Document prefix cannot be empty
    if (!config.documentConfig.orderPrefix || !config.documentConfig.invoicePrefix) {
      violations.push('Document sequence prefixes are mandatory and cannot be empty.');
    }

    return {
      isValid: violations.length === 0,
      securityViolations: violations
    };
  }
}
