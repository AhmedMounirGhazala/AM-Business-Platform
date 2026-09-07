import React from 'react';
import { 
  Sparkles, 
  Clock, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Bot, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { usePlatform, ModuleView } from '../../context/PlatformContext';

interface ComingSoonViewProps {
  moduleId: ModuleView;
}

interface ModuleMeta {
  titleEn: string;
  titleAr: string;
  categoryEn: string;
  categoryAr: string;
  versionTarget: string;
  descriptionEn: string;
  descriptionAr: string;
  featuresEn: string[];
  featuresAr: string[];
  iconBg: string;
}

const moduleMetaMap: Partial<Record<ModuleView, ModuleMeta>> = {
  manufacturing: {
    titleEn: 'Manufacturing & Production Control',
    titleAr: 'التصنيع والتحكم بالإنتاج',
    categoryEn: 'OPERATIONS',
    categoryAr: 'العمليات',
    versionTarget: 'v1.2 Enterprise (Q4 2026)',
    descriptionEn: 'Multi-level Bill of Materials (BOM), Work Order Routing, Shop Floor Execution, and Real-time Capacity Planning.',
    descriptionAr: 'قوائم المواد متعددة المستويات (BOM)، توجيه أوامر العمل، تنفيذ أجزاء ورش العمل، والتخطيط للطلبات في الوقت الفعلي.',
    featuresEn: ['Multi-level Bill of Materials (BOM)', 'Work Order Routing & Costing', 'Machine & Work Center Capacity', 'Standard vs Actual Cost Variance'],
    featuresAr: ['قوائم المواد متعددة المستويات', 'توجيه وتكلفة أوامر العمل', 'سعة الماكينات ومراكز العمل', 'تحليل انحراف التكلفة المعيارية والفعلية'],
    iconBg: 'from-amber-500 to-orange-600'
  },
  pos: {
    titleEn: 'Point of Sale (POS) & Retail Engine',
    titleAr: 'نقاط البيع والتجزئة',
    categoryEn: 'OPERATIONS',
    categoryAr: 'العمليات',
    versionTarget: 'v1.1 Release (Q3 2026)',
    descriptionEn: 'Offline-first POS terminals, Barcode Scanner Integration, ZATCA Phase 2 QR generation, Cash Drawer reconciliation.',
    descriptionAr: 'محطات نقاط بيع تعمل دون إنترنت، ربط مع ماسح الباركود، توليد رمز الاستجابة السريعة لمرحلة هيئة الزكاة الثانية، وتسوية الصندوق.',
    featuresEn: ['Offline Receipt Syncing', 'ZATCA Phase 2 B2C QR Code', 'Multi-terminal Shift Closing', 'Customer Loyalty & Discounts'],
    featuresAr: ['مزامنة الفواتير دون إنترنت', 'فواتير مبسطة متوافقة مع هيئة الزكاة', 'إغلاق ورديات الشاشات المتعددة', 'برامج الولاء والخصومات'],
    iconBg: 'from-emerald-500 to-teal-600'
  },
  projects: {
    titleEn: 'Project Management & Job Costing',
    titleAr: 'إدارة المشاريع وتكلفة العقود',
    categoryEn: 'OPERATIONS',
    categoryAr: 'العمليات',
    versionTarget: 'v1.2 Enterprise (Q4 2026)',
    descriptionEn: 'WBS breakdown, Milestone Billing, Resource Allocation, Project P&L tracking, and Timesheet Integration.',
    descriptionAr: 'تفكيك هيكل العمل (WBS)، الفوترة حسب المراحل، توزيع الموارد، متابعة الأرباح والخسائر لكل مشروع، وربط الجداول الزمنية.',
    featuresEn: ['Work Breakdown Structure (WBS)', 'Milestone & Progress Billing', 'Resource Capacity Planning', 'Real-time Project Margins'],
    featuresAr: ['هيكل تفكيك العمل المتقدم', 'فوترة الإنجاز والمراحل', 'تخطيط الموارد والإنتاجية', 'متابعة ربحية المشروعات مباشرة'],
    iconBg: 'from-blue-500 to-indigo-600'
  },
  maintenance: {
    titleEn: 'Plant & Asset Maintenance (CMMS)',
    titleAr: 'صيانة الآلات والأصول (CMMS)',
    categoryEn: 'FUTURE',
    categoryAr: 'مستقبلي',
    versionTarget: 'v1.3 Enterprise (Q1 2027)',
    descriptionEn: 'Preventive Maintenance Schedules, Equipment Work Requests, Spare Parts Requisitions, and Downtime Tracking.',
    descriptionAr: 'جداول الصيانة الوقائية، طلبات صيانة المعدات، طلب قطع الغيار، ومتابعة أوقات التوقف والإنتاجية.',
    featuresEn: ['Preventive Maintenance Schedules', 'Meter & Runtime Triggered Orders', 'Spare Parts Consumption', 'MTBF & MTTR Analytics'],
    featuresAr: ['جداول الصيانة الوقائية', 'أوامر صيانة تلقائية بالعدادات', 'استهلاك قطع الغيار', 'تحليلات متوسط الأعطال والإصلاح'],
    iconBg: 'from-rose-500 to-pink-600'
  },
  rental: {
    titleEn: 'Rental & Equipment Contracting',
    titleAr: 'إدارة التأجير والمعدات',
    categoryEn: 'FUTURE',
    categoryAr: 'مستقبلي',
    versionTarget: 'v1.3 Enterprise (Q1 2027)',
    descriptionEn: 'Rental Fleet Dispatch, Contract Management, Metered Billing, Deposit Handling, and Equipment Return Inspections.',
    descriptionAr: 'إرسال أسطول التأجير، إدارة العقود، الفوترة حسب العدادات، التعامل مع التأمينات، وفحص استلام المعدات.',
    featuresEn: ['Rental Asset Availability Grid', 'Recurring Meter & Day Billing', 'Return Damage Assessment', 'Security Deposit Refunds'],
    featuresAr: ['جدول توافر المعدات المؤجرة', 'فوترة يومية وعبر العدادات', 'تقييم الأضرار عند الاستلام', 'إدارة تأمينات الحجز والمستردات'],
    iconBg: 'from-purple-500 to-indigo-600'
  },
  fleet: {
    titleEn: 'Fleet & Vehicle Logistics',
    titleAr: 'إدارة الأسطول واللوجستيات',
    categoryEn: 'FUTURE',
    categoryAr: 'مستقبلي',
    versionTarget: 'v1.3 Enterprise (Q1 2027)',
    descriptionEn: 'Vehicle Assignments, Driver Logs, Fuel Card Tracking, Odometer Inspections, and Trip Costing.',
    descriptionAr: 'تخصيص المركبات، سجلات السائقين، تتبع بطاقات الوقود، فحص العدادات، وتكلفة الرحلات.',
    featuresEn: ['Vehicle Service History', 'Driver License & Insurance Alerts', 'Fuel Efficiency Ratios', 'Route Trip Dispatching'],
    featuresAr: ['سجل صيانة وتراخيص المركبات', 'تنبيهات انقضاء رخص السائقين والتأمين', 'معدلات استهلاك الوقود', 'توزيع الرحلات والمسارات'],
    iconBg: 'from-amber-600 to-yellow-600'
  },
  service_management: {
    titleEn: 'Field Service & SLA Dispatch',
    titleAr: 'إدارة الخدمات الميدانية واتفاقيات مستوى الخدمة',
    categoryEn: 'FUTURE',
    categoryAr: 'مستقبلي',
    versionTarget: 'v1.3 Enterprise (Q1 2027)',
    descriptionEn: 'Technician Route Optimization, SLA Escalation Rules, On-site Service Orders, and Mobile Work Signatures.',
    descriptionAr: 'تحسين مسارات الفنيين، قواعد تصعيد اتفاقيات الخدمة، أوامر العمل الميدانية، والتوقيع الرقمي عند الاستلام.',
    featuresEn: ['SLA Breach Warnings', 'Mobile Technician Work Orders', 'On-site Spare Parts Usage', 'Customer E-Signatures'],
    featuresAr: ['تنبيهات تجاوز مستوى الخدمة (SLA)', 'أوامر العمل عبر الجوال', 'استهلاك قطع الغيار الميداني', 'التوقيع الرقمي للعميل'],
    iconBg: 'from-[#0B1F3A] to-[#153258]'
  },
  quality_management: {
    titleEn: 'Quality Control & Assurance (QA/QC)',
    titleAr: 'جودة الإنتاج والضمان (QA/QC)',
    categoryEn: 'FUTURE',
    categoryAr: 'مستقبلي',
    versionTarget: 'v1.3 Enterprise (Q1 2027)',
    descriptionEn: 'Inspection Checklists, Quarantine Warehouses, Non-Conformance Reports (NCR), and ISO Compliance Tracing.',
    descriptionAr: 'قوائم فحص الجودة، مستودعات الحجر الصحي، تقارير عدم المطابقة (NCR)، وتتبع متطلبات شهادات الأيزو.',
    featuresEn: ['Goods Receiving Quality Checks', 'Quarantine Stock Release Workflow', 'Non-Conformance Tracking (NCR)', 'Certificate of Analysis (COA)'],
    featuresAr: ['فحص جودة البضائع المستلمة', 'دورة اعتماد المخزون المحجور', 'تقارير متابعة عدم المطابقة', 'شهادات التحليل والمطابقة'],
    iconBg: 'from-sky-500 to-cyan-600'
  },
  production_planning: {
    titleEn: 'Master Production Schedule (MPS/MRP)',
    titleAr: 'التخطيط الرئيسي للإنتاج والاحتياجات (MPS/MRP)',
    categoryEn: 'FUTURE',
    categoryAr: 'مستقبلي',
    versionTarget: 'v1.3 Enterprise (Q1 2027)',
    descriptionEn: 'Material Requirements Planning (MRP I/II), Demand Forecasting, Automatic Reorder Generation, and Capacity Balancing.',
    descriptionAr: 'تخطيط الاحتياجات من المواد (MRP)، التنبؤ بالطلب، التوليد التلقائي لأوامر الشراء، وتوازن طاقة الإنتاج.',
    featuresEn: ['MRP Automated Purchase Orders', 'Demand & Sales Forecast Alignment', 'Bottleneck Work Center Detection', 'Lead Time Buffer Calculations'],
    featuresAr: ['أوامر شراء تلقائية بناء على MRP', 'محاذاة التنبؤ مع الطلبات الفعلية', 'كشف اختناقات خطوط الإنتاج', 'حساب المهلة الزمنية للتوريد'],
    iconBg: 'from-teal-600 to-emerald-700'
  },
  ecommerce: {
    titleEn: 'Enterprise E-Commerce Connector',
    titleAr: 'مربط التجارة الإلكترونية للمؤسسات',
    categoryEn: 'FUTURE',
    categoryAr: 'مستقبلي',
    versionTarget: 'v1.2 Enterprise (Q4 2026)',
    descriptionEn: 'Omnichannel Stock Sync, Shopify & Salla Connectors, Automated Order Intake, and Real-time Inventory Reservation.',
    descriptionAr: 'مزامنة القنوات المتعددة، ربط مع منصات شوبيفاي وسلة، المعالجة التلقائية للطلبات، وحجز المخزون مباشرة.',
    featuresEn: ['Real-time Omnichannel Stock Sync', 'Shopify, Salla, & Custom API Webhooks', 'Automated Sales Order Creation', 'Multi-currency Web Checkout Sync'],
    featuresAr: ['مزامنة المخزون عبر القنوات', 'ربط مخصص مع المنصات عبر Webhooks', 'إنشاء أوامر المبيعات آلياً', 'مزامنة الدفع بالعملات المتعددة'],
    iconBg: 'from-violet-600 to-purple-800'
  }
};

export const ComingSoonView: React.FC<ComingSoonViewProps> = ({ moduleId }) => {
  const { lang, setActiveModule } = usePlatform();
  const isAr = lang === 'ar';

  const meta = moduleMetaMap[moduleId] || {
    titleEn: 'Enterprise Module Roadmapped',
    titleAr: 'وحدة مؤسسية مدرجة في الخطة',
    categoryEn: 'FUTURE MODULE',
    categoryAr: 'وحدة مستقبلية',
    versionTarget: 'v1.2 Release',
    descriptionEn: 'This enterprise module is fully defined and scheduled for official deployment in the upcoming system milestone.',
    descriptionAr: 'هذه الوحدة المؤسسية معرفة بالكامل ومجدولة للإطلاق الرسمي في المرحلة القادمة.',
    featuresEn: ['Multi-company Support', 'Role-based Permissions', 'Audit Log Integration', 'Automated Financial Posting'],
    featuresAr: ['دعم الشركات المتعددة', 'الصلاحيات القائمة على الأدوار', 'سجل تدقيق شامل', 'ترحيل مالي آلي'],
    iconBg: 'from-slate-700 to-slate-900'
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Banner Card */}
      <div className="p-8 rounded-2xl bg-[#0B1F3A] text-white shadow-sm relative overflow-hidden border border-[#153258]">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="px-3 py-1 rounded-full bg-[#F28C28] text-slate-950 font-bold text-[10px] uppercase tracking-wider font-mono">
              {isAr ? meta.categoryAr : meta.categoryEn} • {isAr ? 'قيد التطوير المقنن' : 'Enterprise Roadmap'}
            </span>
            <div className="flex items-center gap-2 text-xs text-amber-200/90 font-mono">
              <Clock className="w-4 h-4 text-[#F28C28]" />
              <span>Target: {meta.versionTarget}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {isAr ? meta.titleAr : meta.titleEn}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isAr ? meta.descriptionAr : meta.descriptionEn}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => alert(isAr ? 'تم تسجيل طلبك لإخطار مسؤولي النظام عند تفعيل الوحدة.' : 'Notification request logged for Administrator.')}
              className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#F28C28] hover:bg-[#d9791c] text-slate-950 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAr ? 'طلب إخطار التفعيل والمشاركة في الإصدار التجريبي' : 'Request Early Beta Access & Notification'}</span>
            </button>

            <button
              onClick={() => setActiveModule('dashboard')}
              className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition flex items-center gap-2 cursor-pointer border border-white/15"
            >
              <span>{isAr ? 'العودة للوحة التحكم الرئيسية' : 'Return to Executive Dashboard'}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* Planned Capabilities Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>{isAr ? 'الميزات والقدرات التشغيلية المخططة' : 'Planned Enterprise Capabilities & Workflows'}</span>
          </h2>
          <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950">
            IFRS & ISO Standard Spec
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(isAr ? meta.featuresAr : meta.featuresEn).map((feat, idx) => (
            <div key={idx} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{feat}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {isAr ? 'مدمج تلقائياً مع محرك الفعالية المالية والتدقيق' : 'Integrated with Financial Event Engine & Security Audit'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active ERP Integration Note */}
      <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">
            {isAr ? 'تنبيه الربط مع الموديولات النشطة' : 'Seamless Integration with Active Modules'}
          </div>
          <div>
            {isAr 
              ? 'تعتمد هذه الوحدة عند إطلاقها على دليل الحسابات الموحد، مستودعات البضائع الحالية، والمستأجرين القائمين دون الحاجة لإعادة إدخال أي بيانات.'
              : 'Upon activation, this module immediately leverages your existing Chart of Accounts, Item Masters, Warehouses, and Tenant permissions without data duplication.'
            }
          </div>
        </div>
      </div>

    </div>
  );
};
