import { Express, NextFunction, Request, Response } from 'express';
import { User } from '../src/types';
import { SecurityEngine } from './securityEngine';

export interface AuthenticationMiddlewareOptions {
  getUsers: () => User[];
}

export interface AuthenticatedScope {
  userId: string;
  tenantId: string;
  companyId: string;
  branchId?: string;
  role: string;
  name?: string;
  permissions: User['permissions'];
}

export function getAuthenticatedScope(req: Request): AuthenticatedScope {
  const auth = (req as any).auth;
  if (!auth?.sub || !auth.tenantId || !auth.companyId) {
    throw new Error('Authentication scope is unavailable');
  }
  return {
    userId: auth.sub,
    tenantId: auth.tenantId,
    companyId: auth.companyId,
    branchId: auth.branchId,
    role: auth.role,
    name: auth.name,
    permissions: auth.permissions || []
  };
}

export function getAuthenticatedActor(req: Request): string {
  return getAuthenticatedScope(req).userId;
}

/**
 * Registers the request authentication context and default API protection.
 *
 * The user collection is resolved for each request so restored persistence
 * state is observed without changing the middleware's behavior.
 */
export function registerAuthenticationMiddleware(
  app: Express,
  { getUsers }: AuthenticationMiddlewareOptions,
): void {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const token = SecurityEngine.extractBearerToken(req);
    if (token) {
      try {
        const payload = SecurityEngine.verifyToken(token);
        const user = getUsers().find(u => u.id === payload.sub);
        if (user && user.active) {
          (req as any).auth = payload;
          (req as any).user = SecurityEngine.sanitizeUser(user);
        }
      } catch {
        // Invalid or expired token: auth remains undefined
      }
    }
    next();
  });

  app.use('/api/v1', (req: Request, res: Response, next: NextFunction) => {
    const publicRoute =
      req.path === '/auth/login' ||
      req.path === '/auth/verify-pin' ||
      req.path === '/branding/platform' ||
      req.path.startsWith('/branding/public/') ||
      req.path === '/onboarding/wizard/state' ||
      req.path === '/onboarding/readiness';

    if (publicRoute) {
      return next();
    }

    return SecurityEngine.requireAuth(getUsers())(req, res, () => {
      const scope = getAuthenticatedScope(req);
      (req as any).scope = scope;

      const actorFields = [
        'userId',
        'approvedBy',
        'postedBy',
        'reviewedBy',
        'createdBy',
        'actorId',
        'performedBy',
        'reconciledBy',
        'releasedBy',
        'issuedBy',
        'receivedBy',
        'settledBy',
        'signedBy',
        'requestedBy'
      ];
      if (req.body) {
        for (const field of actorFields) req.body[field] = scope.userId;
        req.body.approvedByQAInspector = scope.userId;
        req.body.actionBy = scope.userId;
        if (scope.name) {
          req.body.userName = scope.name;
          req.body.approverName = scope.name;
          req.body.createdByName = scope.name;
        }
      }
      for (const field of actorFields) req.query[field] = scope.userId;
      req.query.approvedByQAInspector = scope.userId;
      req.query.actionBy = scope.userId;
      delete req.headers['x-user-id'];
      delete req.headers['x-user-name'];

      const requestedBranchId = req.body?.branchId || req.query?.branchId || req.params?.branchId;
      if (requestedBranchId && scope.branchId && requestedBranchId !== scope.branchId && scope.role !== 'Super Admin') {
        return res.status(403).json({
          error: `Branch isolation violation: user is not authorized for branch '${requestedBranchId}'.`
        });
      }

      SecurityEngine.enforceTenantCompany()(req, res, next);
    });
  });
}
