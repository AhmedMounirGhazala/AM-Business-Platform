import { Express, Request, Response } from 'express';
import { BrandingEngine } from './brandingEngine';

export interface BrandingRouteOptions {
  brandingEngine: BrandingEngine;
}

export function registerBrandingRoutes(app: Express, { brandingEngine }: BrandingRouteOptions): void {
  // ==========================================================================

  app.get('/api/v1/branding', (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const queryTenant = req.query.tenantId as string;
      const queryCompany = req.query.companyId as string;

      let targetTenantId = authUser?.tenantId || queryTenant || 'ten-001';
      if (authUser && authUser.role === 'Super Admin' && queryTenant) {
        targetTenantId = queryTenant;
      }

      const branding = brandingEngine.getBranding(targetTenantId, queryCompany);
      res.json({ success: true, branding });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/v1/branding/public/:tenantId', (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const metadata = brandingEngine.getPublicBranding(tenantId);
      res.json({ success: true, branding: metadata });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/v1/branding/platform', (req: Request, res: Response) => {
    try {
      const engine = brandingEngine;
      res.json({
        success: true,
        platformIdentity: engine.getCanonicalPlatformIdentity(),
        platformBranding: engine.getPlatformBranding()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/v1/branding', (req: Request, res: Response) => {
    const authUser = (req as any).user;
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required. Missing or invalid Bearer token.' });
    }

    if (authUser.role !== 'Tenant Admin' && authUser.role !== 'Super Admin') {
      return res.status(403).json({
        error: `Forbidden: Role '${authUser.role}' is not authorized to configure enterprise branding.`
      });
    }

    let targetTenantId = authUser.tenantId;
    if (authUser.role === 'Super Admin' && req.body.tenantId) {
      targetTenantId = req.body.tenantId;
    } else if (req.body.tenantId && req.body.tenantId !== authUser.tenantId) {
      return res.status(403).json({
        error: 'Forbidden: Anti-IDOR Violation. Cannot mutate branding for a different tenant.'
      });
    }

    try {
      const result = brandingEngine.saveBranding(
        targetTenantId,
        req.body,
        authUser.id,
        authUser.role,
        req.body.companyId
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/v1/branding/reset', (req: Request, res: Response) => {
    const authUser = (req as any).user;
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (authUser.role !== 'Tenant Admin' && authUser.role !== 'Super Admin') {
      return res.status(403).json({
        error: `Forbidden: Role '${authUser.role}' is not authorized to reset branding.`
      });
    }

    let targetTenantId = authUser.tenantId;
    if (authUser.role === 'Super Admin' && req.body.tenantId) {
      targetTenantId = req.body.tenantId;
    } else if (req.body.tenantId && req.body.tenantId !== authUser.tenantId) {
      return res.status(403).json({
        error: 'Forbidden: Cannot reset branding for another tenant.'
      });
    }

    try {
      const result = brandingEngine.resetToDefaults(
        targetTenantId,
        authUser.id,
        authUser.role,
        req.body.companyId
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/v1/branding/preview', (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const targetTenantId = authUser?.tenantId || req.body.tenantId || 'ten-001';
      const report = brandingEngine.validateBranding(req.body, targetTenantId);
      res.json(report);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/v1/branding/assets', (req: Request, res: Response) => {
    const authUser = (req as any).user;
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (authUser.role !== 'Tenant Admin' && authUser.role !== 'Super Admin') {
      return res.status(403).json({
        error: `Forbidden: Role '${authUser.role}' is not authorized to upload branding assets.`
      });
    }

    const { assetType, fileName, mimeType, fileDataBase64, tenantId } = req.body;
    if (!assetType || !fileName || !mimeType || !fileDataBase64) {
      return res.status(400).json({ error: 'Missing required asset upload parameters.' });
    }

    let targetTenantId = authUser.tenantId;
    if (authUser.role === 'Super Admin' && tenantId) {
      targetTenantId = tenantId;
    } else if (tenantId && tenantId !== authUser.tenantId) {
      return res.status(403).json({ error: 'Forbidden: Cannot upload assets for another tenant.' });
    }

    try {
      const cleanBase64 = String(fileDataBase64).replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const asset = brandingEngine.saveAsset(
        targetTenantId,
        assetType,
        buffer,
        fileName,
        mimeType,
        authUser.id
      );
      res.status(201).json({ success: true, asset });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/v1/branding/assets/:tenantId/:fileName', (req: Request, res: Response) => {
    const { tenantId, fileName } = req.params;
    const asset = brandingEngine.getAssetFile(tenantId, fileName);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(asset.buffer);
  });

}
