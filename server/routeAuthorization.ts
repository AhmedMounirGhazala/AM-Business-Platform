import { Express, NextFunction, Request, Response } from 'express';
import { SecurityEngine } from './securityEngine';

type RoutePolicy = {
  methods: string[];
  prefix: string;
  roles: string[];
};

const policies: RoutePolicy[] = [
  { prefix: '/api/v1/pilot/restore', methods: ['POST'], roles: ['Tenant Admin', 'Super Admin'] },
  { prefix: '/api/v1/pilot/import/commit', methods: ['POST'], roles: ['Tenant Admin', 'Inventory Manager', 'Super Admin'] },
  { prefix: '/api/v1/reports/export', methods: ['POST'], roles: ['Finance Manager', 'VP Finance', 'Auditor', 'Tenant Admin', 'Super Admin'] },
  { prefix: '/api/v1/reports/snapshots', methods: ['POST'], roles: ['Finance Manager', 'VP Finance', 'Auditor', 'Tenant Admin', 'Super Admin'] },
  { prefix: '/api/v1/gl/closing', methods: ['POST'], roles: ['Finance Manager', 'VP Finance', 'Tenant Admin', 'Super Admin'] },
  { prefix: '/api/v1/gl/ias21-revaluation', methods: ['POST'], roles: ['Finance Manager', 'VP Finance', 'Tenant Admin', 'Super Admin'] },
  { prefix: '/api/v1/treasury', methods: ['POST', 'PUT', 'PATCH', 'DELETE'], roles: ['Finance Manager', 'Treasury Manager', 'Tenant Admin', 'Super Admin'] },
  { prefix: '/api/v1/ap', methods: ['POST', 'PUT', 'PATCH', 'DELETE'], roles: ['Finance Manager', 'Purchasing Agent', 'Tenant Admin', 'Super Admin'] },
  { prefix: '/api/v1/ar', methods: ['POST', 'PUT', 'PATCH', 'DELETE'], roles: ['Finance Manager', 'Sales Lead', 'Tenant Admin', 'Super Admin'] },
  { prefix: '/api/v1/procurement', methods: ['POST', 'PUT', 'PATCH', 'DELETE'], roles: ['Purchasing Agent', 'Buyer', 'Procurement Manager', 'Finance Manager', 'Tenant Admin', 'Super Admin'] }
];

function matchingPolicy(req: Request): RoutePolicy | undefined {
  return policies.find(policy =>
    policy.methods.includes(req.method) &&
    (req.path === policy.prefix || req.path.startsWith(`${policy.prefix}/`))
  );
}

function enforceWarehouseScope(req: Request, res: Response): boolean {
  const warehouseId = req.body?.warehouseId || req.query?.warehouseId || req.params?.warehouseId;
  if (!warehouseId) return true;

  const auth = (req as any).auth;
  const user = (req as any).user;
  if (!auth || auth.role === 'Super Admin' || auth.role === 'Tenant Admin') return true;

  const authorizedWarehouseIds = (user as any)?.authorizedWarehouseIds;
  if (!Array.isArray(authorizedWarehouseIds)) {
    res.status(403).json({
      error: 'Warehouse access is not configured for this user; the operation is denied by default.'
    });
    return false;
  }
  if (!authorizedWarehouseIds.includes(warehouseId)) {
    res.status(403).json({ error: 'Warehouse scope violation.' });
    return false;
  }
  return true;
}

export function registerRouteAuthorizationMiddleware(app: Express): void {
  app.use('/api/v1', (req: Request, res: Response, next: NextFunction) => {
    const policy = matchingPolicy(req);
    if (policy) {
      return SecurityEngine.requireRole(...policy.roles)(req, res, () => {
        if (enforceWarehouseScope(req, res)) next();
      });
    }
    if (!enforceWarehouseScope(req, res)) return;
    next();
  });
}

export function getRouteAuthorizationPolicies(): readonly RoutePolicy[] {
  return policies;
}
