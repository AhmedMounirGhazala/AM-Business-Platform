import { Express, Request, Response } from 'express';
import { Company, Tenant } from '../src/types';
import { PilotDatabaseService } from './pilotDatabase';
import { IndustryVerticalManager } from '../src/verticals/industryVerticalManager';

export interface OnboardingRouteOptions {
  pilotDb: PilotDatabaseService;
  manager: IndustryVerticalManager;
  tenants: Tenant[];
  companies: Company[];
  recordAudit: (...args: any[]) => unknown;
}

export function registerOnboardingRoutes(
  app: Express,
  { pilotDb, manager, tenants, companies, recordAudit }: OnboardingRouteOptions,
): void {
// Get full onboarding wizard state & definitions
app.get('/api/v1/onboarding/wizard/state', (req: Request, res: Response) => {
  const targetCompany = (req.query.companyId as string) || (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
  const targetTenant = (req.query.tenantId as string) || (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';

  // Anti-IDOR: If authenticated with a Bearer token, enforce cross-tenant boundary
  if ((req as any).auth && (req as any).auth.tenantId && (req as any).auth.tenantId !== targetTenant) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Cannot access wizard state of another tenant.',
      code: 'CROSS_TENANT_ACCESS_DENIED'
    });
  }

  const wizardState = manager.getWizardStepsForCompany(targetCompany, targetTenant);
  const readiness = manager.evaluateReadiness(targetCompany, targetTenant);

  res.json({
    success: true,
    wizardState,
    readiness
  });
});

// Save / advance individual onboarding step
app.post('/api/v1/onboarding/wizard/step', (req: Request, res: Response) => {
  const { stepNumber, payload, companyId, tenantId } = req.body;
  const targetCompany = companyId || (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
  const targetTenant = tenantId || (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';

  if ((req as any).auth && (req as any).auth.tenantId && (req as any).auth.tenantId !== targetTenant) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Cannot modify wizard state of another tenant.',
      code: 'CROSS_TENANT_ACCESS_DENIED'
    });
  }

  if (!stepNumber || typeof stepNumber !== 'number' || stepNumber < 1 || stepNumber > 19) {
    return res.status(400).json({
      success: false,
      error: 'Invalid step number. Must be between 1 and 19.'
    });
  }

  const result = manager.advanceWizardStep({
    companyId: targetCompany,
    stepNumber,
    stepData: payload || {}
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: 'Step validation failed.',
      errors: result.errors,
      currentStep: result.currentStep
    });
  }

  const wizardState = manager.getWizardStepsForCompany(targetCompany, targetTenant);
  res.json({
    success: true,
    currentStep: result.currentStep,
    isCompleted: result.isCompleted,
    wizardState
  });
});

// Deterministic readiness evaluation (Phase 5)
app.get('/api/v1/onboarding/readiness', (req: Request, res: Response) => {
  const targetCompany = (req.query.companyId as string) || (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
  const targetTenant = (req.query.tenantId as string) || (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';

  if ((req as any).auth && (req as any).auth.tenantId && (req as any).auth.tenantId !== targetTenant) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Cannot access readiness of another tenant.',
      code: 'CROSS_TENANT_ACCESS_DENIED'
    });
  }

  const report = manager.evaluateReadiness(targetCompany, targetTenant);

  res.json({
    success: true,
    report
  });
});

// Final readiness review and explicit completion
app.post('/api/v1/onboarding/wizard/complete', (req: Request, res: Response) => {
  const { companyId, tenantId } = req.body;
  const targetCompany = companyId || (req as any).auth?.companyId || (req.headers['x-company-id'] as string) || 'comp-001';
  const targetTenant = tenantId || (req as any).auth?.tenantId || (req.headers['x-tenant-id'] as string) || 'ten-001';

  if ((req as any).auth && (req as any).auth.tenantId && (req as any).auth.tenantId !== targetTenant) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Cannot complete onboarding for another tenant.',
      code: 'CROSS_TENANT_ACCESS_DENIED'
    });
  }

  const operatorUser = (req as any).user || { id: 'usr-admin-01', name: 'Enterprise Administrator', email: 'admin@enterprise.pilot' };

  try {
    const outcome = manager.completeOnboardingWizard({
      companyId: targetCompany,
      tenantId: targetTenant,
      operatorUser
    });

    // Synchronize in-memory collections with newly materialized records
    const syncdComp = pilotDb.getEntity<Company>('companies', targetCompany);
    if (syncdComp && !companies.some(c => c.id === syncdComp.id)) {
      companies.push(syncdComp);
    }
    const syncdTenant = pilotDb.getEntity<Tenant>('tenants', targetTenant);
    if (syncdTenant && !tenants.some(t => t.id === syncdTenant.id)) {
      tenants.push(syncdTenant);
    }

    recordAudit(
      targetTenant,
      operatorUser.id,
      operatorUser.name,
      'Tenant Admin',
      'APPROVE',
      'OnboardingWizard',
      outcome.certificate.certificateId,
      `Certified and launched pilot tenant ${targetTenant} / ${targetCompany} with score ${outcome.certificate.readinessScore}%`
    );

    res.json({
      success: true,
      certificate: outcome.certificate,
      report: outcome.report
    });
  } catch (err: any) {
    console.error('Onboarding completion error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error during onboarding materialization.',
      correlationId: `err-${Date.now()}`
    });
  }
});

// Initialize a fresh unconfigured tenant and company for testing or onboarding
app.post('/api/v1/onboarding/tenant/initialize', (req: Request, res: Response) => {
  const { tenantName, companyName, tenantCode, companyCode, profileId } = req.body;
  const tId = `ten-${Date.now()}`;
  const cId = `comp-${Date.now()}`;

  const newTenant: Tenant = {
    id: tId,
    name: tenantName || 'New Pilot Enterprise Tenant',
    code: tenantCode || `TEN-${Date.now().toString().slice(-4)}`,
    edition: 'Enterprise',
    ownerEmail: 'admin@newenterprise.pilot',
    active: true,
    createdAt: new Date().toISOString()
  };

  const newComp: Company = {
    id: cId,
    tenantId: tId,
    name: companyName || 'New Pilot Enterprise Company',
    nameAr: 'شركة تجريبية جديدة',
    code: companyCode || `COMP-${Date.now().toString().slice(-4)}`,
    taxNumber: '',
    currency: 'SAR',
    country: 'Saudi Arabia',
    countryCode: 'SA',
    fiscalYearStart: '01-01',
    address: ''
  };

  pilotDb.saveEntity('tenants', newTenant, tId, cId);
  pilotDb.saveEntity('companies', newComp, tId, cId);
  tenants.push(newTenant);
  companies.push(newComp);

  // Initial uncompleted profile state
  const unconfiguredState = {
    id: cId,
    companyId: cId,
    tenantId: tId,
    activeProfileId: profileId || 'COMMERCIAL_DISTRIBUTION',
    activatedAt: new Date().toISOString(),
    activatedBy: 'SYSTEM',
    wizardCompleted: false,
    wizardCurrentStep: 1,
    wizardData: {}
  };
  pilotDb.saveEntity('company_active_vertical_profiles', unconfiguredState, tId, cId);

  res.status(201).json({
    success: true,
    tenant: newTenant,
    company: newComp,
    state: unconfiguredState
  });
});
}
