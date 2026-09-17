import express from 'express';
import { registerAuthenticationMiddleware } from '../server/authMiddleware';
import { registerRouteAuthorizationMiddleware } from '../server/routeAuthorization';
import { registerPeriodGuardMiddleware } from '../server/periodGuard';
import { SecurityEngine } from '../server/securityEngine';

const users = [
  {
    id: 'user-a',
    tenantId: 'tenant-a',
    companyId: 'company-a',
    branchId: 'branch-a',
    name: 'Tenant A Finance',
    email: 'a@example.test',
    role: 'Finance Manager',
    permissions: [],
    active: true
  },
  {
    id: 'user-b',
    tenantId: 'tenant-b',
    companyId: 'company-b',
    branchId: 'branch-b',
    name: 'Tenant B Finance',
    email: 'b@example.test',
    role: 'Finance Manager',
    permissions: [],
    active: true
  }
] as any;

function tokenFor(user: any): string {
  return SecurityEngine.generateToken({
    sub: user.id,
    tenantId: user.tenantId,
    companyId: user.companyId,
    branchId: user.branchId,
    role: user.role,
    name: user.name,
    permissions: user.permissions
  });
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

async function main(): Promise<void> {
  const app = express();
  app.use(express.json());
  registerAuthenticationMiddleware(app, { getUsers: () => users });
  registerRouteAuthorizationMiddleware(app);
  registerPeriodGuardMiddleware(app, () => [
    { fiscalYear: 2026, fiscalPeriod: 1, startDate: '2026-01-01', endDate: '2026-01-31', status: 'CLOSED' },
    { fiscalYear: 2026, fiscalPeriod: 2, startDate: '2026-02-01', endDate: '2026-02-28', status: 'OPEN' }
  ]);

  app.get('/api/v1/auth/me', (req, res) => res.json({ user: (req as any).user }));
  app.get('/api/v1/reports/financial/test', (req, res) => res.json({ companyId: req.query.companyId || 'company-a' }));
  app.post('/api/v1/reports/export', (req, res) => res.json({ success: true }));
  app.post('/api/v1/inventory/count-sessions', (req, res) => res.json({ success: true }));
  app.post('/api/v1/gl/manual-journal', (req, res) => res.json({ success: true }));

  const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
    const instance = app.listen(0, () => resolve(instance));
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to start test server');
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const tokenA = tokenFor(users[0]);

  try {
    const unauthMe = await fetch(`${baseUrl}/api/v1/auth/me`);
    assert(unauthMe.status === 401, 'unauthenticated auth/me is rejected');

    const forgedCompany = await fetch(`${baseUrl}/api/v1/reports/financial/test?companyId=company-b`, {
      headers: { authorization: `Bearer ${tokenA}` }
    });
    assert(forgedCompany.status === 403, 'cross-company report scope is rejected');

    const unauthorizedExport = await fetch(`${baseUrl}/api/v1/reports/export`, {
      method: 'POST',
      headers: { authorization: `Bearer ${tokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ companyId: 'company-b' })
    });
    assert(unauthorizedExport.status === 403, 'cross-company export scope is rejected');

    const unconfiguredWarehouse = await fetch(`${baseUrl}/api/v1/inventory/count-sessions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${tokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ warehouseId: 'warehouse-b' })
    });
    assert(unconfiguredWarehouse.status === 403, 'warehouse access is denied without configured warehouse scope');

    const closedPeriod = await fetch(`${baseUrl}/api/v1/gl/manual-journal`, {
      method: 'POST',
      headers: { authorization: `Bearer ${tokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ fiscalYear: 2026, fiscalPeriod: 1 })
    });
    assert(closedPeriod.status === 409, 'posting into a closed period is rejected');

    const openPeriod = await fetch(`${baseUrl}/api/v1/gl/manual-journal`, {
      method: 'POST',
      headers: { authorization: `Bearer ${tokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ fiscalYear: 2026, fiscalPeriod: 2 })
    });
    assert(openPeriod.status === 200, 'posting into an open period reaches the route');
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
