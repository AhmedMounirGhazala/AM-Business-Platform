/**
 * AM Business Platform — Authoritative Tenant Identity & Branding Runtime Engine
 * P0-08 Architecture Baseline: Multi-Tenant White-Labeling & Isolation Runtime
 */

import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { PilotDatabaseService } from './pilotDatabase';
import {
  TenantBranding,
  ALLOWED_FONT_FAMILIES,
  AllowedFontFamily,
  ContrastScore,
  ContrastEvaluationReport,
  BrandingValidationResult,
  TenantAssetMetadata,
  BrandingPublicMetadata,
  AMPlatformIdentity,
  APPROVED_AM_IDENTITY
} from '../src/types/branding';

export class BrandingEngine {
  private static instance: BrandingEngine | null = null;
  private db: PilotDatabaseService;
  private assetStorageDir: string;

  private constructor(db?: PilotDatabaseService) {
    this.db = db || PilotDatabaseService.getInstance();
    const dataDir = process.env.PERSISTENT_DATA_PATH || process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
    this.assetStorageDir = path.join(dataDir, 'branding_assets');
    if (!fs.existsSync(this.assetStorageDir)) {
      fs.mkdirSync(this.assetStorageDir, { recursive: true });
    }
  }

  public static getInstance(db?: PilotDatabaseService): BrandingEngine {
    if (!BrandingEngine.instance || db) {
      BrandingEngine.instance = new BrandingEngine(db);
    }
    return BrandingEngine.instance;
  }

  // ==========================================================================
  // 1. SAFE PLATFORM DEFAULTS
  // ==========================================================================

  public getDefaultBranding(tenantId: string = 'ten-001', companyId?: string): TenantBranding {
    return {
      id: `brand-${tenantId}${companyId ? `-${companyId}` : ''}`,
      tenantId,
      companyId,
      appName: 'AM Business Platform',
      appNameAr: 'منصة إيه إم للأعمال',
      legalCompanyName: 'AM Enterprises Group Ltd.',
      tradingName: 'AM Business Operating Platform',
      shortName: 'AM',
      logoUrl: '',
      darkLogoUrl: '',
      faviconUrl: '',
      primaryColor: '#0B1F3A',
      secondaryColor: '#1E3A8A',
      accentColor: '#C9A227',
      surfaceColor: '#FFFFFF',
      textColor: '#0F172A',
      fontFamily: 'Inter',
      borderRadius: 'lg',
      supportEmail: 'support@am-platform.com',
      supportPhone: '+966 11 450 0000',
      website: 'https://am-platform.com',
      addressDisplay: 'King Fahd Road, Riyadh, Saudi Arabia',
      legalFooterText: 'Authorized & Licensed Enterprise SaaS Platform. Certified IFRS & ZATCA Compliant.',
      invoiceFooterText: 'Thank you for your business. For support inquiries, contact support@am-platform.com.',
      showPoweredBy: true,
      brandingVersion: 1,
      effectiveTimestamp: new Date().toISOString(),
      updatedBy: 'system',
      auditReference: 'genesis-branding-block',

      // Canonical AM Visual Identity & Platform Governance
      productName: APPROVED_AM_IDENTITY.productName,
      productNameAr: APPROVED_AM_IDENTITY.productNameAr,
      brandFamily: APPROVED_AM_IDENTITY.brandFamily,
      brandFamilyAr: APPROVED_AM_IDENTITY.brandFamilyAr,
      positioning: APPROVED_AM_IDENTITY.positioning,
      positioningAr: APPROVED_AM_IDENTITY.positioningAr,
      motto: APPROVED_AM_IDENTITY.motto,
      mottoAr: APPROVED_AM_IDENTITY.mottoAr,
      neutralColor: APPROVED_AM_IDENTITY.neutralColor,
      borderLightColor: APPROVED_AM_IDENTITY.borderLightColor
    };
  }

  /**
   * Authoritative Canonical AM Platform Identity (Source of Truth)
   */
  public getCanonicalPlatformIdentity(): AMPlatformIdentity {
    return { ...APPROVED_AM_IDENTITY };
  }

  /**
   * Canonical AM Platform Identity Tokens & Mottos
   */
  public getPlatformIdentity() {
    return {
      colors: {
        primary: APPROVED_AM_IDENTITY.primaryColor,
        accent: APPROVED_AM_IDENTITY.accentColor,
        canvas: APPROVED_AM_IDENTITY.neutralColor,
        border: APPROVED_AM_IDENTITY.borderLightColor
      },
      typography: {
        latinFont: APPROVED_AM_IDENTITY.fontFamily,
        arabicFont: APPROVED_AM_IDENTITY.arabicFontFamily
      },
      motto: {
        en: APPROVED_AM_IDENTITY.motto,
        ar: APPROVED_AM_IDENTITY.mottoAr
      },
      productName: APPROVED_AM_IDENTITY.productName,
      productNameAr: APPROVED_AM_IDENTITY.productNameAr,
      brandFamily: APPROVED_AM_IDENTITY.brandFamily,
      positioning: APPROVED_AM_IDENTITY.positioning
    };
  }

  /**
   * Protected Platform Branding Object
   */
  public getPlatformBranding(): TenantBranding {
    const defaultBrand = this.getDefaultBranding('platform');
    defaultBrand.appName = APPROVED_AM_IDENTITY.productName;
    defaultBrand.appNameAr = APPROVED_AM_IDENTITY.productNameAr;
    defaultBrand.fontFamily = APPROVED_AM_IDENTITY.fontFamily;
    defaultBrand.logoUrl = '/api/v1/branding/assets/platform/am-logo.svg';
    defaultBrand.faviconUrl = '/api/v1/branding/assets/platform/am-monogram.svg';
    return defaultBrand;
  }

  // ==========================================================================
  // 2. RETRIEVAL WITH TENANT SCOPE & MIGRATION / DEFAULT RESOLUTION
  // ==========================================================================

  public getBranding(tenantId: string, companyId?: string): TenantBranding {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new Error('Tenant ID is required to retrieve branding configuration.');
    }

    const sanitizedTenantId = tenantId.trim();
    const specificId = `brand-${sanitizedTenantId}${companyId ? `-${companyId.trim()}` : ''}`;
    const generalId = `brand-${sanitizedTenantId}`;

    // 1. Check for specific company-level override first if requested
    if (companyId) {
      const specific = this.db.getEntity<TenantBranding>('tenant_branding', specificId);
      if (specific && specific.tenantId === sanitizedTenantId) {
        return this.sanitizeOutput(specific);
      }
    }

    // 2. Check for tenant-level default
    const existing = this.db.getEntity<TenantBranding>('tenant_branding', generalId);
    if (existing && existing.tenantId === sanitizedTenantId) {
      return this.sanitizeOutput(existing);
    }

    // 3. Fallback to safe default for this tenant and persist for stability
    const defaults = this.getDefaultBranding(sanitizedTenantId, companyId);
    this.db.saveEntity('tenant_branding', defaults, sanitizedTenantId, companyId);
    return defaults;
  }

  public getPublicBranding(tenantId: string): BrandingPublicMetadata {
    const full = this.getBranding(tenantId);
    return {
      tenantId: full.tenantId,
      appName: full.appName,
      appNameAr: full.appNameAr,
      shortName: full.shortName,
      logoUrl: full.logoUrl,
      darkLogoUrl: full.darkLogoUrl,
      faviconUrl: full.faviconUrl,
      primaryColor: full.primaryColor,
      accentColor: full.accentColor,
      surfaceColor: full.surfaceColor,
      textColor: full.textColor,
      fontFamily: full.fontFamily,
      showPoweredBy: full.showPoweredBy,
      brandingVersion: full.brandingVersion
    };
  }

  // ==========================================================================
  // 3. COLOR CONTRAST & ACCESSIBILITY EVALUATOR (WCAG 2.1 AA)
  // ==========================================================================

  public static hexToRgb(hex?: string): { r: number; g: number; b: number } | null {
    if (!hex || typeof hex !== 'string') return null;
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
    if (!match) return null;
    return {
      r: parseInt(match[1], 16),
      g: parseInt(match[2], 16),
      b: parseInt(match[3], 16)
    };
  }

  public static calculateLuminance(r: number, g: number, b: number): number {
    const a = [r, g, b].map(v => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }

  public static calculateContrastRatio(hex1?: string, hex2?: string): number {
    const rgb1 = BrandingEngine.hexToRgb(hex1);
    const rgb2 = BrandingEngine.hexToRgb(hex2);
    if (!rgb1 || !rgb2) return 1.0;

    const lum1 = BrandingEngine.calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = BrandingEngine.calculateLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
  }

  public static validateThemeContrast(
    primaryColor: string,
    accentColor: string = '#C9A227',
    surfaceColor: string = '#FFFFFF',
    textColor: string = '#0F172A'
  ): { passesWcagAA: boolean; report: ContrastEvaluationReport } {
    const engine = BrandingEngine.getInstance();
    const report = engine.evaluateContrast(textColor, surfaceColor, primaryColor, accentColor);
    return {
      passesWcagAA: report.passed,
      report
    };
  }

  public evaluateContrast(
    textColor: string,
    surfaceColor: string,
    primaryColor: string,
    accentColor: string = '#C9A227'
  ): ContrastEvaluationReport {
    const ratioTextOnSurface = BrandingEngine.calculateContrastRatio(textColor, surfaceColor);
    const ratioPrimaryOnSurface = BrandingEngine.calculateContrastRatio(primaryColor, surfaceColor);
    const ratioTextOnPrimary = BrandingEngine.calculateContrastRatio('#FFFFFF', primaryColor);
    const ratioAccentOnSurface = BrandingEngine.calculateContrastRatio(accentColor, surfaceColor);

    const scoreTextOnSurface: ContrastScore = {
      foreground: textColor,
      background: surfaceColor,
      ratio: ratioTextOnSurface,
      wcagAANormal: ratioTextOnSurface >= 4.5,
      wcagAALarge: ratioTextOnSurface >= 3.0,
      wcagAAANormal: ratioTextOnSurface >= 7.0
    };

    const scorePrimaryOnSurface: ContrastScore = {
      foreground: primaryColor,
      background: surfaceColor,
      ratio: ratioPrimaryOnSurface,
      wcagAANormal: ratioPrimaryOnSurface >= 4.5,
      wcagAALarge: ratioPrimaryOnSurface >= 3.0,
      wcagAAANormal: ratioPrimaryOnSurface >= 7.0
    };

    const scoreTextOnPrimary: ContrastScore = {
      foreground: '#FFFFFF',
      background: primaryColor,
      ratio: ratioTextOnPrimary,
      wcagAANormal: ratioTextOnPrimary >= 4.5,
      wcagAALarge: ratioTextOnPrimary >= 3.0,
      wcagAAANormal: ratioTextOnPrimary >= 7.0
    };

    const scoreAccentOnSurface: ContrastScore = {
      foreground: accentColor,
      background: surfaceColor,
      ratio: ratioAccentOnSurface,
      wcagAANormal: ratioAccentOnSurface >= 4.5,
      wcagAALarge: ratioAccentOnSurface >= 3.0,
      wcagAAANormal: ratioAccentOnSurface >= 7.0
    };

    const warnings: string[] = [];
    const errors: string[] = [];

    // Body text must strictly satisfy WCAG AA (>= 4.5:1)
    if (!scoreTextOnSurface.wcagAANormal) {
      errors.push(`Text color (${textColor}) on surface (${surfaceColor}) contrast ratio is ${ratioTextOnSurface}:1, which fails WCAG AA minimum requirement of 4.5:1.`);
    }

    // Button white text on primary button must satisfy at least 3.0:1 (large/graphical) or 4.5:1
    if (!scoreTextOnPrimary.wcagAALarge) {
      errors.push(`White button text on primary brand color (${primaryColor}) contrast ratio is ${ratioTextOnPrimary}:1, failing WCAG AA 3.0:1 threshold.`);
    }

    if (!scorePrimaryOnSurface.wcagAALarge) {
      warnings.push(`Primary brand color (${primaryColor}) on surface (${surfaceColor}) contrast is ${ratioPrimaryOnSurface}:1. Ensure headings have sufficient weight.`);
    }

    return {
      passed: errors.length === 0,
      scores: {
        textOnSurface: scoreTextOnSurface,
        primaryOnSurface: scorePrimaryOnSurface,
        textOnPrimary: scoreTextOnPrimary,
        accentOnSurface: scoreAccentOnSurface
      },
      warnings,
      errors
    };
  }

  // ==========================================================================
  // 4. VALIDATION & SANITIZATION
  // ==========================================================================

  public validateBranding(
    payload: Partial<TenantBranding>,
    targetTenantId: string,
    existingBranding?: TenantBranding
  ): BrandingValidationResult {
    const errors: string[] = [];
    const current = existingBranding || this.getDefaultBranding(targetTenantId);

    // App Name validation
    const appName = payload.appName !== undefined ? String(payload.appName).trim() : current.appName;
    if (!appName || appName.length < 2 || appName.length > 80) {
      errors.push('Application display name must be between 2 and 80 characters.');
    }
    if (/[<>]/.test(appName)) {
      errors.push('Application name contains illegal markup characters.');
    }

    // App Name Arabic validation
    const appNameAr = payload.appNameAr !== undefined ? String(payload.appNameAr).trim() : current.appNameAr;
    if (appNameAr && (appNameAr.length < 2 || appNameAr.length > 80)) {
      errors.push('Arabic application name must be between 2 and 80 characters.');
    }

    // Short Name / Monogram validation
    const shortName = payload.shortName !== undefined ? String(payload.shortName).trim().toUpperCase() : current.shortName;
    if (!shortName || shortName.length < 1 || shortName.length > 8) {
      errors.push('Brand short name / monogram must be between 1 and 8 uppercase characters.');
    }
    if (!/^[A-Z0-9\-_]+$/.test(shortName)) {
      errors.push('Brand short name must contain only alphanumeric characters, dashes, or underscores.');
    }

    // Hex Color Validations
    const hexPattern = /^#[0-9a-fA-F]{6}$/;

    const primaryColor = payload.primaryColor !== undefined ? payload.primaryColor.trim() : current.primaryColor;
    if (!hexPattern.test(primaryColor)) {
      errors.push(`Primary color '${primaryColor}' is invalid. Must be a 7-character hexadecimal string (e.g. #0B1F3A).`);
    }

    const secondaryColor = payload.secondaryColor !== undefined ? payload.secondaryColor.trim() : current.secondaryColor;
    if (!hexPattern.test(secondaryColor)) {
      errors.push(`Secondary color '${secondaryColor}' is invalid. Must be a 7-character hexadecimal string.`);
    }

    const accentColor = payload.accentColor !== undefined ? payload.accentColor.trim() : current.accentColor;
    if (!hexPattern.test(accentColor)) {
      errors.push(`Accent color '${accentColor}' is invalid. Must be a 7-character hexadecimal string.`);
    }

    const surfaceColor = payload.surfaceColor !== undefined ? payload.surfaceColor.trim() : current.surfaceColor;
    if (!hexPattern.test(surfaceColor)) {
      errors.push(`Surface color '${surfaceColor}' is invalid. Must be a 7-character hexadecimal string.`);
    }

    const textColor = payload.textColor !== undefined ? payload.textColor.trim() : current.textColor;
    if (!hexPattern.test(textColor)) {
      errors.push(`Text color '${textColor}' is invalid. Must be a 7-character hexadecimal string.`);
    }

    // Font Family Validation
    const fontFamily = payload.fontFamily !== undefined ? (payload.fontFamily as AllowedFontFamily) : current.fontFamily;
    if (!ALLOWED_FONT_FAMILIES.includes(fontFamily)) {
      errors.push(`Font '${fontFamily}' is not in the approved platform font allowlist: [${ALLOWED_FONT_FAMILIES.join(', ')}].`);
    }

    // Border Radius Validation
    const borderRadius = payload.borderRadius !== undefined ? payload.borderRadius : current.borderRadius;
    const allowedRadii = ['none', 'sm', 'md', 'lg', 'xl', 'full'];
    if (!allowedRadii.includes(borderRadius)) {
      errors.push(`Border radius '${borderRadius}' is invalid. Must be one of [${allowedRadii.join(', ')}].`);
    }

    // Support Email Validation
    const supportEmail = payload.supportEmail !== undefined ? String(payload.supportEmail).trim() : current.supportEmail;
    if (supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
      errors.push(`Support email '${supportEmail}' is not a valid email address.`);
    }

    // Support Phone Validation
    const supportPhone = payload.supportPhone !== undefined ? String(payload.supportPhone).trim() : current.supportPhone;
    if (supportPhone && supportPhone.length > 30) {
      errors.push('Support phone must not exceed 30 characters.');
    }

    // Website URL Validation
    const website = payload.website !== undefined ? String(payload.website).trim() : current.website;
    if (website && !/^https?:\/\/.+/i.test(website)) {
      errors.push(`Website URL '${website}' must start with http:// or https://.`);
    }

    // Asset URL Scoping & Traversal Checks
    const checkAssetUrl = (url: string | undefined, fieldName: string) => {
      if (!url) return;
      const cleanUrl = url.trim();
      if (cleanUrl.includes('..') || cleanUrl.includes('javascript:') || cleanUrl.includes('data:text/html')) {
        errors.push(`${fieldName} contains unsafe path traversal or script URI.`);
      }
      // If referencing tenant asset endpoint, enforce tenant isolation
      const tenantAssetMatch = cleanUrl.match(/\/api\/v1\/branding\/assets\/([^/]+)/);
      if (tenantAssetMatch && tenantAssetMatch[1] !== targetTenantId) {
        errors.push(`${fieldName} attempts to reference assets belonging to a foreign tenant ('${tenantAssetMatch[1]}').`);
      }
    };

    checkAssetUrl(payload.logoUrl, 'logoUrl');
    checkAssetUrl(payload.darkLogoUrl, 'darkLogoUrl');
    checkAssetUrl(payload.faviconUrl, 'faviconUrl');

    // Footers
    const legalFooterText = payload.legalFooterText !== undefined ? String(payload.legalFooterText).trim() : current.legalFooterText;
    if (legalFooterText && legalFooterText.length > 300) {
      errors.push('Legal footer text must not exceed 300 characters.');
    }
    if (legalFooterText && /[<>]/.test(legalFooterText)) {
      errors.push('Legal footer text contains illegal HTML markup.');
    }

    const invoiceFooterText = payload.invoiceFooterText !== undefined ? String(payload.invoiceFooterText).trim() : current.invoiceFooterText;
    if (invoiceFooterText && invoiceFooterText.length > 300) {
      errors.push('Invoice footer text must not exceed 300 characters.');
    }

    // Contrast Evaluation
    const contrastReport = this.evaluateContrast(textColor, surfaceColor, primaryColor, accentColor);
    if (!contrastReport.passed) {
      errors.push(...contrastReport.errors);
    }

    const sanitizedPayload: Partial<TenantBranding> = {
      appName,
      appNameAr,
      shortName,
      tradingName: payload.tradingName !== undefined ? String(payload.tradingName).trim() : current.tradingName,
      legalCompanyName: payload.legalCompanyName !== undefined ? String(payload.legalCompanyName).trim() : current.legalCompanyName,
      primaryColor,
      secondaryColor,
      accentColor,
      surfaceColor,
      textColor,
      fontFamily,
      borderRadius,
      supportEmail,
      supportPhone,
      website,
      addressDisplay: payload.addressDisplay !== undefined ? String(payload.addressDisplay).trim() : current.addressDisplay,
      legalFooterText,
      invoiceFooterText,
      showPoweredBy: payload.showPoweredBy !== undefined ? Boolean(payload.showPoweredBy) : current.showPoweredBy,
      logoUrl: payload.logoUrl !== undefined ? payload.logoUrl.trim() : current.logoUrl,
      darkLogoUrl: payload.darkLogoUrl !== undefined ? payload.darkLogoUrl.trim() : current.darkLogoUrl,
      faviconUrl: payload.faviconUrl !== undefined ? payload.faviconUrl.trim() : current.faviconUrl,

      // Canonical AM Visual Identity & Platform Governance
      productName: payload.productName !== undefined ? String(payload.productName).trim() : current.productName,
      productNameAr: payload.productNameAr !== undefined ? String(payload.productNameAr).trim() : current.productNameAr,
      brandFamily: payload.brandFamily !== undefined ? String(payload.brandFamily).trim() : current.brandFamily,
      brandFamilyAr: payload.brandFamilyAr !== undefined ? String(payload.brandFamilyAr).trim() : current.brandFamilyAr,
      positioning: payload.positioning !== undefined ? String(payload.positioning).trim() : current.positioning,
      positioningAr: payload.positioningAr !== undefined ? String(payload.positioningAr).trim() : current.positioningAr,
      motto: payload.motto !== undefined ? String(payload.motto).trim() : current.motto,
      mottoAr: payload.mottoAr !== undefined ? String(payload.mottoAr).trim() : current.mottoAr,
      neutralColor: payload.neutralColor !== undefined ? String(payload.neutralColor).trim() : current.neutralColor,
      borderLightColor: payload.borderLightColor !== undefined ? String(payload.borderLightColor).trim() : current.borderLightColor
    };

    return {
      valid: errors.length === 0,
      errors,
      contrastReport,
      sanitizedPayload
    };
  }

  // ==========================================================================
  // 5. ATOMIC PERSISTENCE & AUDIT TRAIL
  // ==========================================================================

  public saveBranding(
    targetTenantId: string,
    payload: Partial<TenantBranding>,
    userId: string,
    userRole: string,
    companyId?: string
  ): { success: boolean; branding: TenantBranding; auditHash: string; validationReport: BrandingValidationResult } {
    if (!targetTenantId) {
      throw new Error('Tenant ID is mandatory for branding mutation.');
    }

    // 0. Platform identity protection: only Super Admin can mutate platform-level branding
    if (targetTenantId === 'platform' && userRole !== 'Super Admin') {
      throw new Error(`Forbidden: Only Super Admin is authorized to configure canonical platform branding.`);
    }

    // 1. Authorization: Only Tenant Admin or Super Admin
    if (userRole !== 'Tenant Admin' && userRole !== 'Super Admin') {
      throw new Error(`Forbidden: User with role '${userRole}' is not authorized to configure enterprise branding.`);
    }

    // 2. Fetch current state
    const current = this.getBranding(targetTenantId, companyId);

    // 3. Validate and sanitize
    const validation = this.validateBranding(payload, targetTenantId, current);
    if (!validation.valid || !validation.sanitizedPayload) {
      throw new Error(`Branding validation failed: ${validation.errors.join(' | ')}`);
    }

    const nextVersion = (current.brandingVersion || 1) + 1;
    const now = new Date().toISOString();

    const targetId = `brand-${targetTenantId}${companyId ? `-${companyId.trim()}` : ''}`;
    const updated: TenantBranding = {
      ...current,
      ...validation.sanitizedPayload,
      id: targetId,
      tenantId: targetTenantId,
      companyId,
      brandingVersion: nextVersion,
      effectiveTimestamp: now,
      updatedBy: userId
    };

    // Calculate diff for audit record
    const diff: Record<string, { old: any; new: any }> = {};
    for (const key of Object.keys(validation.sanitizedPayload) as (keyof TenantBranding)[]) {
      if ((current as any)[key] !== (updated as any)[key]) {
        diff[key] = { old: (current as any)[key], new: (updated as any)[key] };
      }
    }

    // 4. Record into tamper-evident SQLite audit vault
    const auditHash = this.db.logAudit(
      'BRANDING_CONFIG_UPDATE',
      {
        brandingVersion: nextVersion,
        changedFields: Object.keys(diff),
        diff,
        actorId: userId,
        actorRole: userRole,
        timestamp: now
      },
      targetTenantId,
      companyId || current.companyId || 'comp-001'
    );

    updated.auditReference = auditHash;

    // 5. Persist atomically
    this.db.saveEntity('tenant_branding', updated, targetTenantId, companyId);

    return {
      success: true,
      branding: this.sanitizeOutput(updated),
      auditHash,
      validationReport: validation
    };
  }

  public resetToDefaults(
    targetTenantId: string,
    userId: string,
    userRole: string,
    companyId?: string
  ): { success: boolean; branding: TenantBranding; auditHash: string } {
    if (userRole !== 'Tenant Admin' && userRole !== 'Super Admin') {
      throw new Error(`Forbidden: Role '${userRole}' is not authorized to reset tenant branding.`);
    }

    const current = this.getBranding(targetTenantId, companyId);
    const defaults = this.getDefaultBranding(targetTenantId, companyId);
    defaults.brandingVersion = (current.brandingVersion || 1) + 1;
    defaults.updatedBy = userId;
    defaults.effectiveTimestamp = new Date().toISOString();

    const auditHash = this.db.logAudit(
      'BRANDING_CONFIG_RESET_DEFAULTS',
      {
        actorId: userId,
        actorRole: userRole,
        resetTimestamp: defaults.effectiveTimestamp,
        previousVersion: current.brandingVersion
      },
      targetTenantId,
      companyId || 'comp-001'
    );

    defaults.auditReference = auditHash;
    this.db.saveEntity('tenant_branding', defaults, targetTenantId, companyId);

    return {
      success: true,
      branding: this.sanitizeOutput(defaults),
      auditHash
    };
  }

  // ==========================================================================
  // 6. ASSET UPLOAD & SECURE TENANT-SCOPED STORAGE
  // ==========================================================================

  public saveAsset(
    tenantId: string,
    assetType: 'logo' | 'darkLogo' | 'favicon' | 'documentHeader',
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    uploadedBy: string
  ): TenantAssetMetadata {
    if (!tenantId) {
      throw new Error('Tenant ID is mandatory for asset upload.');
    }

    // 1. File size limit: 2MB
    const MAX_SIZE = 2 * 1024 * 1024;
    if (fileBuffer.length > MAX_SIZE) {
      throw new Error(`Asset size (${(fileBuffer.length / 1024).toFixed(1)} KB) exceeds the maximum allowed 2MB limit.`);
    }

    // 2. MIME type & Magic Byte Verification
    const allowedMimes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowedMimes.includes(mimeType.toLowerCase())) {
      throw new Error(`Unsupported MIME type '${mimeType}'. Allowed: [${allowedMimes.join(', ')}].`);
    }

    // Inspect file signature (magic bytes)
    this.verifyMagicBytes(fileBuffer, mimeType);

    // If SVG: perform strict security scan to eliminate embedded scripts
    if (mimeType === 'image/svg+xml') {
      const svgText = fileBuffer.toString('utf-8');
      if (/<script|javascript:|onload=|onerror=|xlink:href=.*data:/i.test(svgText)) {
        throw new Error('Security Violation: SVG asset contains prohibited executable scripts or event handlers.');
      }
    }

    // 3. Hash computation
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const ext = path.extname(originalName).toLowerCase() || (mimeType === 'image/png' ? '.png' : mimeType === 'image/jpeg' ? '.jpg' : mimeType === 'image/webp' ? '.webp' : '.svg');
    const safeFileName = `${assetType}-${hash.slice(0, 16)}${ext}`;

    // 4. Scoped disk storage: data/branding_assets/${tenantId}/
    const tenantDir = path.join(this.assetStorageDir, tenantId);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }

    const fullFilePath = path.join(tenantDir, safeFileName);
    fs.writeFileSync(fullFilePath, fileBuffer);

    // 5. Metadata storage in SQLite
    const metadata: TenantAssetMetadata = {
      assetId: `ast-${Date.now()}-${hash.slice(0, 8)}`,
      tenantId,
      assetType,
      fileName: safeFileName,
      mimeType: mimeType as any,
      sizeBytes: fileBuffer.length,
      storagePath: `/api/v1/branding/assets/${tenantId}/${safeFileName}`,
      checksumSha256: hash,
      uploadedBy,
      uploadedAt: new Date().toISOString()
    };

    this.db.saveEntity('tenant_branding_assets', { id: metadata.assetId, ...metadata }, tenantId);

    return metadata;
  }

  public getAssetFile(tenantId: string, fileName: string): { buffer: Buffer; mimeType: string } | null {
    if (!tenantId || !fileName) return null;

    // Prevent path traversal
    const safeName = path.basename(fileName);
    const tenantDir = path.join(this.assetStorageDir, tenantId);
    const filePath = path.join(tenantDir, safeName);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(safeName).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : ext === '.svg' ? 'image/svg+xml' : 'application/octet-stream';

    return { buffer, mimeType: mime };
  }

  private verifyMagicBytes(buffer: Buffer, declaredMime: string): void {
    if (buffer.length < 4) {
      throw new Error('Corrupted or empty file buffer.');
    }

    if (declaredMime === 'image/png') {
      // 89 50 4E 47 0D 0A 1A 0A
      if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4E || buffer[3] !== 0x47) {
        throw new Error('File signature does not match declared image/png format.');
      }
    } else if (declaredMime === 'image/jpeg') {
      // FF D8 FF
      if (buffer[0] !== 0xFF || buffer[1] !== 0xD8 || buffer[2] !== 0xFF) {
        throw new Error('File signature does not match declared image/jpeg format.');
      }
    } else if (declaredMime === 'image/webp') {
      // RIFF ... WEBP
      const header = buffer.subarray(0, 12).toString('ascii');
      if (!header.startsWith('RIFF') || !header.includes('WEBP')) {
        throw new Error('File signature does not match declared image/webp format.');
      }
    } else if (declaredMime === 'image/svg+xml') {
      const text = buffer.subarray(0, 200).toString('utf-8').trim();
      if (!text.startsWith('<svg') && !text.startsWith('<?xml')) {
        throw new Error('File does not start with valid SVG opening tag.');
      }
    }
  }

  // ==========================================================================
  // 7. SANITIZATION OF SECRETS
  // ==========================================================================

  private sanitizeOutput(branding: TenantBranding): TenantBranding {
    const copy = { ...branding };
    // Explicitly guarantee no passwords, PINs or internal secrets leak
    delete (copy as any).password;
    delete (copy as any).pin;
    delete (copy as any).secret;
    delete (copy as any).apiKey;
    return copy;
  }
}
