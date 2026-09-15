/**
 * AM Business Platform — Tenant Identity & White-Label Branding Types
 * P0-08 Architecture Baseline: Authoritative Tenant-Scoped Identity Runtime
 */

export interface TenantBranding {
  id: string; // E.g., 'brand-ten-001'
  tenantId: string;
  companyId?: string; // Optional specific company or undefined for tenant-wide

  // Identity & Names
  appName: string; // Application display name (e.g. 'AM Business Platform' or 'Apex Commercial ERP')
  appNameAr: string; // Arabic display name
  legalCompanyName?: string; // Reference to legal company master, not duplicate source of truth
  tradingName: string; // Commercial trading name
  shortName: string; // 2-8 char uppercase monogram/symbol (e.g. 'AM', 'APEX')

  // Visual Asset References (Scoped URLs / Safe SVGs / Uploaded paths)
  logoUrl?: string; // Standard light mode logo
  darkLogoUrl?: string; // Dark mode logo
  faviconUrl?: string; // Browser tab favicon

  // Theme & Design Tokens (Strict Hex #RRGGBB)
  primaryColor: string; // Primary brand color (e.g. '#0B1F3A')
  secondaryColor: string; // Secondary brand color (e.g. '#1E3A8A')
  accentColor: string; // Accent/Highlight color (e.g. '#F28C28')
  surfaceColor: string; // Background/Surface color (e.g. '#FFFFFF' or '#F8FAFC')
  textColor: string; // Foreground body text color (e.g. '#0F172A')

  // Typography & Density
  fontFamily: AllowedFontFamily;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

  // Contact & Support
  supportEmail: string;
  supportPhone?: string;
  website?: string;
  addressDisplay?: string;

  // Document & Report Footers
  legalFooterText?: string;
  invoiceFooterText?: string;
  showPoweredBy: boolean; // Platform policy governed (e.g. Enterprise edition can toggle)

  // Versioning & Tamper-Evident Governance
  brandingVersion: number;
  effectiveTimestamp: string;
  updatedBy: string; // User ID of last author
  auditReference?: string; // SHA-256 block hash from cryptographic audit vault

  // Canonical AM Visual Identity & Platform Governance
  productName?: string; // Canonical product identity: 'AM ERP'
  productNameAr?: string; // Arabic product identity: 'إيه إم لتخطيط موارد المؤسسات'
  brandFamily?: string; // Brand/product family: 'AM / Ahmed Mounir'
  brandFamilyAr?: string; // Arabic brand family: 'إيه إم / أحمد منير'
  positioning?: string; // Positioning: 'Financial Accountant | Business Analyst'
  positioningAr?: string; // Arabic positioning: 'محاسب مالي | محلل أعمال'
  motto?: string; // Approved motto: 'Every successful decision begins with an accurate number'
  mottoAr?: string; // Approved Arabic motto: 'كل قرار ناجح يبدأ برقم صحيح'
  neutralColor?: string; // Supporting neutral: '#F8FAFC' / light grey
  borderLightColor?: string; // Supporting border: '#E2E8F0'
}

export type AllowedFontFamily = 
  | 'system-ui'
  | 'Inter'
  | 'Plus Jakarta Sans'
  | 'Segoe UI'
  | 'Cairo'
  | 'Tajawal'
  | 'Almarai'
  | 'IBM Plex Sans Arabic'
  | 'Roboto'
  | 'Open Sans';

export const ALLOWED_FONT_FAMILIES: AllowedFontFamily[] = [
  'system-ui',
  'Inter',
  'Plus Jakarta Sans',
  'Segoe UI',
  'Cairo',
  'Tajawal',
  'Almarai',
  'IBM Plex Sans Arabic',
  'Roboto',
  'Open Sans'
];

export interface ContrastScore {
  foreground: string;
  background: string;
  ratio: number;
  wcagAANormal: boolean; // >= 4.5:1
  wcagAALarge: boolean; // >= 3.0:1
  wcagAAANormal: boolean; // >= 7.0:1
}

export interface ContrastEvaluationReport {
  passed: boolean;
  scores: {
    textOnSurface: ContrastScore;
    primaryOnSurface: ContrastScore;
    textOnPrimary: ContrastScore;
    accentOnSurface: ContrastScore;
  };
  warnings: string[];
  errors: string[];
}

export interface BrandingValidationResult {
  valid: boolean;
  errors: string[];
  contrastReport: ContrastEvaluationReport;
  sanitizedPayload?: Partial<TenantBranding>;
}

export interface TenantAssetMetadata {
  assetId: string;
  tenantId: string;
  assetType: 'logo' | 'darkLogo' | 'favicon' | 'documentHeader';
  fileName: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/svg+xml';
  sizeBytes: number;
  storagePath: string;
  checksumSha256: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface BrandingPublicMetadata {
  tenantId: string;
  appName: string;
  appNameAr: string;
  shortName: string;
  logoUrl?: string;
  darkLogoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  textColor: string;
  fontFamily: AllowedFontFamily;
  showPoweredBy: boolean;
  brandingVersion: number;
}

export interface AMPlatformIdentity {
  productName: 'AM ERP';
  productNameAr: 'إيه إم لتخطيط موارد المؤسسات';
  brandFamily: 'AM / Ahmed Mounir';
  brandFamilyAr: 'إيه إم / أحمد منير';
  positioning: 'Financial Accountant | Business Analyst';
  positioningAr: 'محاسب مالي | محلل أعمال';
  motto: 'Every successful decision begins with an accurate number';
  mottoAr: 'كل قرار ناجح يبدأ برقم صحيح';
  primaryColor: '#0B1F3A';
  accentColor: '#F28C28';
  neutralColor: '#F8FAFC';
  borderLightColor: '#E2E8F0';
  surfaceColor: '#FFFFFF';
  textColor: '#0F172A';
  monogram: 'AM';
  fontFamily: 'Plus Jakarta Sans';
  arabicFontFamily: 'Cairo';
  visualDirection: 'premium, minimal, corporate, Egyptian-business oriented';
}

export const APPROVED_AM_IDENTITY: AMPlatformIdentity = {
  productName: 'AM ERP',
  productNameAr: 'إيه إم لتخطيط موارد المؤسسات',
  brandFamily: 'AM / Ahmed Mounir',
  brandFamilyAr: 'إيه إم / أحمد منير',
  positioning: 'Financial Accountant | Business Analyst',
  positioningAr: 'محاسب مالي | محلل أعمال',
  motto: 'Every successful decision begins with an accurate number',
  mottoAr: 'كل قرار ناجح يبدأ برقم صحيح',
  primaryColor: '#0B1F3A',
  accentColor: '#F28C28',
  neutralColor: '#F8FAFC',
  borderLightColor: '#E2E8F0',
  surfaceColor: '#FFFFFF',
  textColor: '#0F172A',
  monogram: 'AM',
  fontFamily: 'Plus Jakarta Sans',
  arabicFontFamily: 'Cairo',
  visualDirection: 'premium, minimal, corporate, Egyptian-business oriented'
};

