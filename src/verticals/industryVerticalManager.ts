/**
 * AM Business Platform — P0-06 Industry Vertical Manager
 * Central orchestration facade for the 8 approved Pilot Industry Profiles:
 * 1. Commercial Trading / Distribution
 * 2. Restaurant / F&B
 * 3. Retail — Mobile Phones
 * 4. Retail — Women's Clothing
 * 5. Retail — Children's Clothing
 * 6. Manufacturing — Women's Apparel
 * 7. Manufacturing — Men's Apparel
 * 8. Manufacturing — Children's Apparel
 *
 * Ensures durable SQLite persistence via PilotDatabaseService,
 * strict multi-tenant / company isolation, audit logging, and setup wizard orchestration.
 */

import { PilotDatabaseService } from '../../server/pilotDatabase';
import { VerticalProfileRegistry } from './verticalProfileRegistry';
import {
  PilotIndustryProfileId,
  IndustryProfileDefinition,
  DeliveryTerritory,
  DeliveryRoute,
  VanStockAllocation,
  DiningArea,
  RestaurantTableRuntime,
  RecipeBOM,
  RestaurantWasteRecord,
  MobileDeviceRecord,
  MobileTradeInRecord,
  MobileRepairJobCard,
  ApparelStyleMaster,
  ApparelVariantSKU,
  FittingRoomHoldTicket,
  CustomerReservation,
  FabricYieldMarkerPlan,
  ApparelCutOrder,
  ApparelBundleTicket,
  MensTailoringSpec,
  ChildrenSafetyQACheckpoint,
  EnterpriseReadinessReport
} from './types';
import {
  OnboardingReadinessEvaluator,
  OnboardingStepValidator,
  OnboardingMaterializer
} from './onboardingReadinessEvaluator';

export interface CompanyVerticalProfileState {
  companyId: string;
  tenantId: string;
  activeProfileId: PilotIndustryProfileId;
  activatedAt: string;
  activatedBy: string;
  wizardCompleted: boolean;
  wizardCurrentStep: number;
  wizardData: Record<string, any>;
}

export class IndustryVerticalManager {
  private static instance: IndustryVerticalManager | null = null;
  private db: PilotDatabaseService;

  private constructor(db?: PilotDatabaseService) {
    this.db = db || PilotDatabaseService.getInstance();
    this.initDefaultData();
  }

  public static getInstance(db?: PilotDatabaseService): IndustryVerticalManager {
    if (!IndustryVerticalManager.instance || db) {
      IndustryVerticalManager.instance = new IndustryVerticalManager(db);
    }
    return IndustryVerticalManager.instance;
  }

  /**
   * Initializes initial profile metadata and durable collections if not present
   */
  private initDefaultData(): void {
    if (!this.db.isCollectionInitialized('vertical_profile_definitions')) {
      const allProfiles = VerticalProfileRegistry.getAllProfiles();
      allProfiles.forEach(p => {
        this.db.saveEntity('vertical_profile_definitions', { id: p.profileId, ...p }, 'ten-001', 'comp-001');
      });
    }

    if (!this.db.isCollectionInitialized('company_active_vertical_profiles')) {
      const defaultState: CompanyVerticalProfileState = {
        companyId: 'comp-001',
        tenantId: 'ten-001',
        activeProfileId: 'COMMERCIAL_DISTRIBUTION',
        activatedAt: new Date().toISOString(),
        activatedBy: 'usr-admin-01',
        wizardCompleted: true,
        wizardCurrentStep: 19,
        wizardData: {}
      };
      this.db.saveEntity('company_active_vertical_profiles', { id: 'comp-001', ...defaultState }, 'ten-001', 'comp-001');
    }
  }

  // ==========================================================================
  // 1. ACTIVE PROFILE MANAGEMENT & METADATA
  // ==========================================================================

  public getCompanyProfileState(companyId: string, tenantId: string = 'ten-001'): CompanyVerticalProfileState {
    const states = this.db.loadCollection<CompanyVerticalProfileState>('company_active_vertical_profiles');
    let state = states.find(s => s.companyId === companyId);
    if (!state) {
      state = {
        companyId,
        tenantId,
        activeProfileId: 'COMMERCIAL_DISTRIBUTION',
        activatedAt: new Date().toISOString(),
        activatedBy: 'SYSTEM',
        wizardCompleted: false,
        wizardCurrentStep: 1,
        wizardData: {}
      };
      this.db.saveEntity('company_active_vertical_profiles', { id: companyId, ...state }, tenantId, companyId);
    }
    return state;
  }

  public setActiveProfile(params: {
    companyId: string;
    tenantId: string;
    profileId: PilotIndustryProfileId;
    userId: string;
  }): { success: boolean; state: CompanyVerticalProfileState; profile: IndustryProfileDefinition } {
    const profile = VerticalProfileRegistry.getProfile(params.profileId);
    const existing = this.getCompanyProfileState(params.companyId, params.tenantId);

    const updated: CompanyVerticalProfileState = {
      ...existing,
      activeProfileId: params.profileId,
      activatedAt: new Date().toISOString(),
      activatedBy: params.userId
    };

    this.db.saveEntity('company_active_vertical_profiles', { id: params.companyId, ...updated }, params.tenantId, params.companyId);

    // Write cryptographic audit block
    this.db.logAudit('VERTICAL_PROFILE_ACTIVATION', { profileId: params.profileId, userId: params.userId, companyId: params.companyId }, params.tenantId);

    return { success: true, state: updated, profile };
  }

  // ==========================================================================
  // 2. COMMERCIAL TRADING / DISTRIBUTION
  // ==========================================================================

  public getTerritories(companyId: string): DeliveryTerritory[] {
    return this.db.loadCollection<DeliveryTerritory>('vertical_territories').filter(t => t.companyId === companyId);
  }

  public saveTerritory(territory: DeliveryTerritory): DeliveryTerritory {
    this.db.saveEntity('vertical_territories', territory, territory.tenantId, territory.companyId);
    return territory;
  }

  public getRoutes(companyId: string): DeliveryRoute[] {
    return this.db.loadCollection<DeliveryRoute>('vertical_routes').filter(r => r.companyId === companyId);
  }

  public saveRoute(route: DeliveryRoute): DeliveryRoute {
    this.db.saveEntity('vertical_routes', route, route.tenantId, route.companyId);
    return route;
  }

  public getVanAllocations(companyId: string): VanStockAllocation[] {
    return this.db.loadCollection<VanStockAllocation>('vertical_van_allocations').filter(a => a.companyId === companyId);
  }

  public saveVanAllocation(allocation: VanStockAllocation): VanStockAllocation {
    this.db.saveEntity('vertical_van_allocations', allocation, allocation.tenantId, allocation.companyId);
    return allocation;
  }

  // ==========================================================================
  // 3. RESTAURANT / F&B
  // ==========================================================================

  public getDiningAreas(companyId: string): DiningArea[] {
    return this.db.loadCollection<DiningArea>('vertical_dining_areas').filter(a => a.companyId === companyId);
  }

  public saveDiningArea(area: DiningArea): DiningArea {
    this.db.saveEntity('vertical_dining_areas', area, area.tenantId, area.companyId);
    return area;
  }

  public getRestaurantTables(companyId: string): RestaurantTableRuntime[] {
    return this.db.loadCollection<RestaurantTableRuntime>('vertical_restaurant_tables').filter(t => t.companyId === companyId);
  }

  public saveRestaurantTable(table: RestaurantTableRuntime): RestaurantTableRuntime {
    this.db.saveEntity('vertical_restaurant_tables', table, table.tenantId, table.companyId);
    return table;
  }

  public getRecipeBoms(companyId: string): RecipeBOM[] {
    return this.db.loadCollection<RecipeBOM>('vertical_recipes').filter(r => r.companyId === companyId);
  }

  public saveRecipeBom(bom: RecipeBOM): RecipeBOM {
    this.db.saveEntity('vertical_recipes', bom, bom.tenantId, bom.companyId);
    return bom;
  }

  public getKitchenWaste(companyId: string): RestaurantWasteRecord[] {
    return this.db.loadCollection<RestaurantWasteRecord>('vertical_kitchen_waste').filter(w => w.companyId === companyId);
  }

  public saveKitchenWaste(waste: RestaurantWasteRecord): RestaurantWasteRecord {
    this.db.saveEntity('vertical_kitchen_waste', waste, waste.tenantId, waste.companyId);
    return waste;
  }

  // ==========================================================================
  // 4. RETAIL — MOBILE PHONES
  // ==========================================================================

  public getMobileDevices(companyId: string): MobileDeviceRecord[] {
    return this.db.loadCollection<MobileDeviceRecord>('vertical_mobile_devices').filter(d => d.companyId === companyId);
  }

  public saveMobileDevice(device: MobileDeviceRecord): MobileDeviceRecord {
    this.db.saveEntity('vertical_mobile_devices', device, device.tenantId, device.companyId);
    return device;
  }

  public getTradeIns(companyId: string): MobileTradeInRecord[] {
    return this.db.loadCollection<MobileTradeInRecord>('vertical_trade_ins').filter(t => t.companyId === companyId);
  }

  public saveTradeIn(tradeIn: MobileTradeInRecord): MobileTradeInRecord {
    this.db.saveEntity('vertical_trade_ins', tradeIn, tradeIn.tenantId, tradeIn.companyId);
    return tradeIn;
  }

  public getRepairJobCards(companyId: string): MobileRepairJobCard[] {
    return this.db.loadCollection<MobileRepairJobCard>('vertical_repair_job_cards').filter(j => j.companyId === companyId);
  }

  public saveRepairJobCard(jobCard: MobileRepairJobCard): MobileRepairJobCard {
    this.db.saveEntity('vertical_repair_job_cards', jobCard, jobCard.tenantId, jobCard.companyId);
    return jobCard;
  }

  // ==========================================================================
  // 5. RETAIL — WOMEN'S & CHILDREN'S CLOTHING
  // ==========================================================================

  public getApparelStyles(companyId: string): ApparelStyleMaster[] {
    return this.db.loadCollection<ApparelStyleMaster>('vertical_apparel_styles').filter(s => s.companyId === companyId);
  }

  public saveApparelStyle(style: ApparelStyleMaster): ApparelStyleMaster {
    this.db.saveEntity('vertical_apparel_styles', style, style.tenantId, style.companyId);
    return style;
  }

  public getApparelVariants(styleId?: string): ApparelVariantSKU[] {
    const list = this.db.loadCollection<ApparelVariantSKU>('vertical_apparel_variants');
    return styleId ? list.filter(v => v.styleId === styleId) : list;
  }

  public saveApparelVariant(variant: ApparelVariantSKU): ApparelVariantSKU {
    this.db.saveEntity('vertical_apparel_variants', variant);
    return variant;
  }

  public getFittingRoomHolds(companyId: string): FittingRoomHoldTicket[] {
    return this.db.loadCollection<FittingRoomHoldTicket>('vertical_fitting_room_holds').filter(h => h.companyId === companyId);
  }

  public saveFittingRoomHold(hold: FittingRoomHoldTicket): FittingRoomHoldTicket {
    this.db.saveEntity('vertical_fitting_room_holds', hold, hold.tenantId, hold.companyId);
    return hold;
  }

  public getCustomerReservations(companyId: string): CustomerReservation[] {
    return this.db.loadCollection<CustomerReservation>('vertical_customer_reservations').filter(r => r.companyId === companyId);
  }

  public saveCustomerReservation(res: CustomerReservation): CustomerReservation {
    this.db.saveEntity('vertical_customer_reservations', res, res.tenantId, res.companyId);
    return res;
  }

  // ==========================================================================
  // 6. APPAREL MANUFACTURING (WOMEN'S, MEN'S, CHILDREN'S)
  // ==========================================================================

  public getMarkerPlans(): FabricYieldMarkerPlan[] {
    return this.db.loadCollection<FabricYieldMarkerPlan>('vertical_marker_plans');
  }

  public saveMarkerPlan(plan: FabricYieldMarkerPlan): FabricYieldMarkerPlan {
    this.db.saveEntity('vertical_marker_plans', plan);
    return plan;
  }

  public getCutOrders(companyId: string): ApparelCutOrder[] {
    return this.db.loadCollection<ApparelCutOrder>('vertical_cut_orders').filter(c => c.companyId === companyId);
  }

  public saveCutOrder(cutOrder: ApparelCutOrder): ApparelCutOrder {
    this.db.saveEntity('vertical_cut_orders', cutOrder, cutOrder.tenantId, cutOrder.companyId);
    return cutOrder;
  }

  public getBundleTickets(cutOrderId?: string): ApparelBundleTicket[] {
    const list = this.db.loadCollection<ApparelBundleTicket>('vertical_bundle_tickets');
    return cutOrderId ? list.filter(b => b.cutOrderId === cutOrderId) : list;
  }

  public saveBundleTicket(bundle: ApparelBundleTicket): ApparelBundleTicket {
    this.db.saveEntity('vertical_bundle_tickets', bundle);
    return bundle;
  }

  public getMensTailoringSpecs(styleCode?: string): MensTailoringSpec[] {
    const list = this.db.loadCollection<MensTailoringSpec>('vertical_tailoring_specs');
    return styleCode ? list.filter(s => s.styleCode === styleCode) : list;
  }

  public saveMensTailoringSpec(spec: MensTailoringSpec): MensTailoringSpec {
    this.db.saveEntity('vertical_tailoring_specs', { id: `SPEC-${spec.styleCode}`, ...spec });
    return spec;
  }

  public getSafetyQACheckpoints(cutOrderId?: string): ChildrenSafetyQACheckpoint[] {
    const list = this.db.loadCollection<ChildrenSafetyQACheckpoint>('vertical_safety_checkpoints');
    return cutOrderId ? list.filter(s => s.cutOrderId === cutOrderId) : list;
  }

  public saveSafetyQACheckpoint(checkpoint: ChildrenSafetyQACheckpoint): ChildrenSafetyQACheckpoint {
    this.db.saveEntity('vertical_safety_checkpoints', checkpoint);
    return checkpoint;
  }

  // ==========================================================================
  // 7. SETUP WIZARD ORCHESTRATION (19 STEPS DYNAMIC FLOW)
  // ==========================================================================

  public getWizardStepsForCompany(companyId: string, tenantId?: string): {
    totalSteps: number;
    currentStep: number;
    isCompleted: boolean;
    activeProfile: IndustryProfileDefinition;
    steps: {
      stepNumber: number;
      title: string;
      titleAr: string;
      description: string;
      isDynamicVerticalStep: boolean;
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    }[];
    wizardData?: Record<string, any>;
  } {
    const state = this.getCompanyProfileState(companyId, tenantId);
    const profile = VerticalProfileRegistry.getProfile(state.activeProfileId);

    const standardBaseSteps = [
      { stepNumber: 1, title: 'Company Identity & Legal Registration', titleAr: 'بيانات الشركة والسجل التجاري', description: 'Company name, tax ID, and commercial register.' },
      { stepNumber: 2, title: 'Country & Jurisdictional Localization', titleAr: 'الدولة والتشريعات الضريبية', description: 'Country selection, compliance framework (Egypt ETA / Saudi ZATCA).' },
      { stepNumber: 3, title: 'Operating Currency & Exchange Rates', titleAr: 'العملة التشغيلية وأسعار الصرف', description: 'Base currency, decimal places, and exchange rate providers.' },
      { stepNumber: 4, title: 'Fiscal Year & Accounting Calendar', titleAr: 'السنة المالية والفترات المحاسبية', description: 'Fiscal year start date and period definitions.' },
      { stepNumber: 5, title: 'Organizational Units & Branches', titleAr: 'الفروع والوحدات الإدارية', description: 'HQ, retail branches, and operational sites.' },
      { stepNumber: 6, title: 'Warehouses & Storage Locations', titleAr: 'المستودعات والمخازن', description: 'Main warehouses, transit locations, and POS backstores.' },
      { stepNumber: 7, title: 'Chart of Accounts (COA) Structure', titleAr: 'شجرة الحسابات ودليل الحسابات المعتمد', description: 'Profile-specific standard Chart of Accounts.' },
      { stepNumber: 8, title: 'Cost Centers & Profit Centers', titleAr: 'مراكز التكلفة ومراكز الربحية', description: 'Managerial accounting dimensions and project codes.' },
      { stepNumber: 9, title: 'Payment Terms & Credit Policies', titleAr: 'شروط الدفع وسياسات الائتمان', description: 'Net terms, cash discounts, and credit check policies.' },
      { stepNumber: 10, title: 'Tax Rules & Electronic Compliance Setup', titleAr: 'قواعد الضرائب والفوترة الإلكترونية', description: 'Standard VAT rates, withholding taxes, and digital seals.' },
      { stepNumber: 11, title: 'Customer & Supplier Groups', titleAr: 'مجموعات العملاء والموردين', description: 'B2B/B2C categorization and pricing tier defaults.' },
      { stepNumber: 12, title: 'Item Categories & Units of Measure (UOM)', titleAr: 'تصنيفات الأصناف ووحدات القياس', description: 'Inventory hierarchy and packaging conversions.' },
      { stepNumber: 13, title: 'Numbering Sequences & Document Prefixes', titleAr: 'ترقيم المستندات والبادئات', description: 'Invoices, receipts, orders, and journal entry sequences.' },
      { stepNumber: 14, title: 'Roles, Permissions & Segregation of Duties', titleAr: 'الأدوار والصلاحيات وفصل المهام', description: 'RBAC user assignments and authorization limits.' },
      // Step 15 is dynamic based on profile!
      {
        stepNumber: 15,
        title: profile.wizardSteps[0]?.title || 'Industry Vertical Configurations',
        titleAr: profile.wizardSteps[0]?.titleAr || 'الإعدادات التشغيلية للنشاط التجاري',
        description: profile.wizardSteps[0]?.description || 'Configure domain-specific operations.'
      },
      { stepNumber: 16, title: 'Initial Master Data Loading & CSV Onboarding', titleAr: 'استيراد البيانات الأساسية والأرصدة', description: 'Bulk import products, prices, and partner master data.' },
      { stepNumber: 17, title: 'Opening Balance Equity Journal Entries', titleAr: 'تسجيل القيد الافتتاحي المتوازن', description: 'Post balanced opening stock, cash float, and equity entries.' },
      { stepNumber: 18, title: 'End-to-End Simulation & Verification Run', titleAr: 'اختبار التدفق الشامل والمطابقة', description: 'Automated test of procurement, POS, inventory, and ledger.' },
      { stepNumber: 19, title: 'Pilot Certification Sign-Off & Go-Live', titleAr: 'اعتماد شهادة التشغيل والإطلاق', description: 'Final compliance gate sign-off and live transaction unlocking.' }
    ];

    const steps = standardBaseSteps.map(s => {
      let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
      if (s.stepNumber < state.wizardCurrentStep) {
        status = 'COMPLETED';
      } else if (s.stepNumber === state.wizardCurrentStep) {
        status = 'IN_PROGRESS';
      }
      return {
        ...s,
        isDynamicVerticalStep: s.stepNumber === 15,
        status
      };
    });

    // Sanitize wizardData before returning to client (strip any raw password/PIN)
    const sanitizedData = JSON.parse(JSON.stringify(state.wizardData || {}));
    if (sanitizedData.step_17) {
      delete sanitizedData.step_17.adminPassword;
      delete sanitizedData.step_17.adminPin;
    }

    return {
      totalSteps: 19,
      currentStep: state.wizardCurrentStep,
      isCompleted: state.wizardCompleted,
      activeProfile: profile,
      steps,
      wizardData: sanitizedData
    };
  }

  public advanceWizardStep(params: {
    companyId: string;
    stepNumber: number;
    stepData: Record<string, any>;
  }): { success: boolean; currentStep: number; isCompleted: boolean; errors?: Record<string, string> } {
    const state = this.getCompanyProfileState(params.companyId);
    
    // Server-side validation per step
    if (params.stepData && Object.keys(params.stepData).length > 0) {
      const validation = OnboardingStepValidator.validateStep(params.stepNumber, params.stepData);
      if (!validation.valid) {
        return {
          success: false,
          currentStep: state.wizardCurrentStep,
          isCompleted: state.wizardCompleted,
          errors: validation.errors
        };
      }
    }

    const nextStep = Math.min(19, params.stepNumber + 1);
    const isCompleted = params.stepNumber >= 19;

    state.wizardCurrentStep = nextStep;
    if (isCompleted) {
      state.wizardCompleted = true;
    }
    state.wizardData = { ...state.wizardData, [`step_${params.stepNumber}`]: params.stepData };

    this.db.saveEntity('company_active_vertical_profiles', { id: params.companyId, ...state });

    return { success: true, currentStep: nextStep, isCompleted };
  }

  /**
   * Deterministic readiness check across all 16 Phase 5 criteria
   */
  public evaluateReadiness(companyId: string, tenantId: string = 'ten-001'): EnterpriseReadinessReport {
    return OnboardingReadinessEvaluator.evaluate(companyId, tenantId, this.db);
  }

  /**
   * Completes onboarding atomically with full entity materialization, audit block logging, and idempotency
   */
  public completeOnboardingWizard(params: {
    companyId: string;
    tenantId: string;
    operatorUser?: { id: string; name: string; email?: string };
  }) {
    const state = this.getCompanyProfileState(params.companyId, params.tenantId);
    return OnboardingMaterializer.materializeAndComplete(
      params.companyId,
      params.tenantId,
      this.db,
      state.wizardData,
      params.operatorUser
    );
  }
}
