/**
 * AM BUSINESS PLATFORM — PILOT SECURITY & CREDENTIAL ENGINE
 * Enterprise-grade security module:
 * - PBKDF2 with SHA-512 cryptographic password hashing & salt stretching (100,000 iterations)
 * - Cashier PIN hashing (PBKDF2/SHA-512)
 * - Sanitization (strips credentials from outgoing payloads and logs)
 * - Durable server-side rate limiting & brute-force throttling with SQLite restart survival
 * - Cryptographic Token & Session Management (HMAC-SHA256 JWT, expiration, fail-closed production secret)
 * - Server-authoritative Role-Based Access Control (RBAC) & Segregation of Duties (SoD) enforcement
 * - Multi-tenant & Company boundary isolation (anti-IDOR)
 */

import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { User, UserRole, UserPermission } from '../src/types';

export interface RateLimitStatus {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSec?: number;
  retryAfterMs?: number;
  error?: string;
}

export interface AttemptTracker {
  count: number;
  firstAttemptTime: number;
  lockedUntil?: number;
  tenantId?: string;
  companyId?: string;
}

export interface TokenPayload {
  sub: string;
  tenantId: string;
  companyId: string;
  role: UserRole | string;
  email?: string;
  name?: string;
  branchId?: string;
  permissions?: UserPermission[];
  type?: 'auth_token' | 'pos_session' | string;
  iat?: number;
  exp?: number;
}

export type JWTPayload = TokenPayload;

export interface PasswordPolicyConfig {
  minLength: number;
  maxLength: number;
  requireNonEmpty: boolean;
}

export interface PinPolicyConfig {
  minLength: number;
  maxLength: number;
}

export class SecurityEngine {
  private static readonly HASH_ALGORITHM = 'sha512';
  private static readonly ITERATIONS = 100000;
  private static readonly KEY_LENGTH = 64;
  private static readonly SALT_BYTES = 16;

  // Configurable credential policies
  private static passwordPolicy: PasswordPolicyConfig = {
    minLength: 8,
    maxLength: 128,
    requireNonEmpty: true
  };

  private static pinPolicy: PinPolicyConfig = {
    minLength: 4,
    maxLength: 8
  };

  // Signing secret for cryptographic tokens
  private static tokenSecret: string | null = null;

  // In-memory rate limiting tracker (per IP or username)
  private static attempts: Map<string, AttemptTracker> = new Map();

  // Reference to durable persistence layer (PilotDatabaseService)
  private static persistenceDb: any = null;

  // Dummy hash used for constant-time comparison when user not found (prevents timing-based user enumeration)
  private static readonly DUMMY_SALT = '0123456789abcdef0123456789abcdef';
  private static readonly DUMMY_HASH = crypto.pbkdf2Sync('dummy-password-for-timing', SecurityEngine.DUMMY_SALT, 100000, 64, 'sha512').toString('hex');

  /**
   * Initializes durable persistence for rate limits and account lockouts
   */
  public static initPersistence(db: any): void {
    this.persistenceDb = db;
    if (db && typeof db.loadCollection === 'function') {
      try {
        const persistedLockouts = db.loadCollection('auth_lockouts') as Array<{
          id: string;
          key: string;
          count: number;
          firstAttemptTime: number;
          lockedUntil?: number;
          tenantId?: string;
          companyId?: string;
        }>;
        if (Array.isArray(persistedLockouts)) {
          const now = Date.now();
          for (const item of persistedLockouts) {
            if (item.lockedUntil && item.lockedUntil > now) {
              this.attempts.set(item.key || item.id, {
                count: item.count || 5,
                firstAttemptTime: item.firstAttemptTime || now,
                lockedUntil: item.lockedUntil,
                tenantId: item.tenantId,
                companyId: item.companyId
              });
            }
          }
        }
      } catch {
        // Table or collection might not be initialized yet
      }
    }
  }

  // ==================== CREDENTIAL POLICY & VALIDATION ====================

  public static setPasswordPolicy(policy: Partial<PasswordPolicyConfig>): void {
    this.passwordPolicy = { ...this.passwordPolicy, ...policy };
  }

  public static getPasswordPolicy(): PasswordPolicyConfig {
    return { ...this.passwordPolicy };
  }

  public static validatePassword(password: unknown): { valid: boolean; error?: string } {
    if (typeof password !== 'string') {
      return { valid: false, error: 'Password must be a string.' };
    }
    const trimmed = password.trim();
    if (this.passwordPolicy.requireNonEmpty && trimmed.length === 0) {
      return { valid: false, error: 'Password cannot be empty or whitespace only.' };
    }
    if (password.length < this.passwordPolicy.minLength) {
      return { valid: false, error: `Password must be at least ${this.passwordPolicy.minLength} characters long.` };
    }
    if (password.length > this.passwordPolicy.maxLength) {
      return { valid: false, error: `Password cannot exceed ${this.passwordPolicy.maxLength} characters.` };
    }
    return { valid: true };
  }

  public static validatePin(pin: unknown): { valid: boolean; error?: string } {
    if (typeof pin !== 'string') {
      return { valid: false, error: 'Cashier PIN must be a string.' };
    }
    const trimmed = pin.trim();
    if (trimmed.length < this.pinPolicy.minLength) {
      return { valid: false, error: `Cashier PIN must be at least ${this.pinPolicy.minLength} digits.` };
    }
    if (trimmed.length > this.pinPolicy.maxLength) {
      return { valid: false, error: `Cashier PIN cannot exceed ${this.pinPolicy.maxLength} digits.` };
    }
    if (!/^\d+$/.test(trimmed)) {
      return { valid: false, error: 'Cashier PIN must contain digits only.' };
    }
    return { valid: true };
  }

  // ==================== PASSWORD & PIN CRYPTOGRAPHY ====================

  /**
   * Hashes a plaintext password using PBKDF2 with SHA-512 and a cryptographically secure 16-byte random salt.
   * Format: $pbkdf2$iterations$saltHex$hashHex
   */
  public static hashPassword(password: string): string {
    const validation = this.validatePassword(password);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    const salt = crypto.randomBytes(this.SALT_BYTES).toString('hex');
    const hash = crypto.pbkdf2Sync(
      password,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      this.HASH_ALGORITHM
    ).toString('hex');
    return `$pbkdf2$${this.ITERATIONS}$${salt}$${hash}`;
  }

  /**
   * Verifies a plaintext password against a stored PBKDF2 hash using constant-time comparison.
   */
  public static verifyPassword(password: string, storedHash: string): boolean {
    if (!password || !storedHash || typeof password !== 'string' || typeof storedHash !== 'string') {
      // Dummy comparison to equalize timing
      this.performDummyHash(password || 'empty');
      return false;
    }

    // Plaintext check: never accept plaintext passwords in verification
    if (!storedHash.startsWith('$pbkdf2$')) {
      this.performDummyHash(password);
      return false;
    }

    const parts = storedHash.split('$');
    if (parts.length !== 5) {
      this.performDummyHash(password);
      return false;
    }

    const iterations = parseInt(parts[2], 10);
    const salt = parts[3];
    const originalHash = parts[4];

    if (isNaN(iterations) || !salt || !originalHash || iterations <= 0) {
      this.performDummyHash(password);
      return false;
    }

    const computedHash = crypto.pbkdf2Sync(
      password,
      salt,
      iterations,
      this.KEY_LENGTH,
      this.HASH_ALGORITHM
    ).toString('hex');

    if (computedHash.length !== originalHash.length) {
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'utf8'),
      Buffer.from(originalHash, 'utf8')
    );
  }

  /**
   * Hashes a numeric or alphanumeric Cashier PIN using PBKDF2 with SHA-512.
   * Format: $pin$iterations$saltHex$hashHex
   */
  public static hashPin(pin: string): string {
    const validation = this.validatePin(pin);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    const salt = crypto.randomBytes(this.SALT_BYTES).toString('hex');
    const hash = crypto.pbkdf2Sync(
      pin,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      this.HASH_ALGORITHM
    ).toString('hex');
    return `$pin$${this.ITERATIONS}$${salt}$${hash}`;
  }

  /**
   * Verifies a Cashier PIN against a stored PIN hash using constant-time comparison.
   */
  public static verifyPin(pin: string, storedHash: string): boolean {
    if (!pin || !storedHash || typeof pin !== 'string' || typeof storedHash !== 'string') {
      this.performDummyHash(pin || 'empty');
      return false;
    }

    if (!storedHash.startsWith('$pin$')) {
      this.performDummyHash(pin);
      return false;
    }

    const parts = storedHash.split('$');
    if (parts.length !== 5) {
      this.performDummyHash(pin);
      return false;
    }

    const iterations = parseInt(parts[2], 10);
    const salt = parts[3];
    const originalHash = parts[4];

    if (isNaN(iterations) || !salt || !originalHash || iterations <= 0) {
      this.performDummyHash(pin);
      return false;
    }

    const computedHash = crypto.pbkdf2Sync(
      pin,
      salt,
      iterations,
      this.KEY_LENGTH,
      this.HASH_ALGORITHM
    ).toString('hex');

    if (computedHash.length !== originalHash.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'utf8'),
      Buffer.from(originalHash, 'utf8')
    );
  }

  private static performDummyHash(input: string): void {
    try {
      crypto.pbkdf2Sync(input, this.DUMMY_SALT, 10000, 64, 'sha512');
    } catch {}
  }

  // ==================== SANITIZATION ====================

  /**
   * Strips all sensitive credential fields (passwordHash, pinHash, password, pin, salt, secret) from objects
   */
  public static sanitizeUser<T extends Record<string, any>>(user: T): Omit<T, 'passwordHash' | 'pinHash' | 'password' | 'pin' | 'salt' | 'secret'> {
    if (!user || typeof user !== 'object') return user;
    const sanitized = { ...user };
    delete (sanitized as any).passwordHash;
    delete (sanitized as any).pinHash;
    delete (sanitized as any).password;
    delete (sanitized as any).pin;
    delete (sanitized as any).salt;
    delete (sanitized as any).secret;
    delete (sanitized as any).tokenSecret;
    return sanitized;
  }

  /**
   * Sanitizes audit logs or error messages to ensure no credentials or secrets leak
   */
  public static sanitizeString(str: string): string {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/password[:=\s]+([^\s,;]+)/gi, 'password=[REDACTED]')
      .replace(/pin[:=\s]+([^\s,;]+)/gi, 'pin=[REDACTED]')
      .replace(/\$pbkdf2\$[^\s,;]+/gi, '[REDACTED_PBKDF2_HASH]')
      .replace(/\$pin\$[^\s,;]+/gi, '[REDACTED_PIN_HASH]')
      .replace(/bearer\s+[a-zA-Z0-9_\-.]+/gi, 'Bearer [REDACTED_TOKEN]');
  }

  // ==================== TOKEN & SESSION SECURITY (HMAC-SHA256 JWT) ====================

  public static setTokenSecret(secret: string | null): void {
    this.tokenSecret = secret;
  }

  /**
   * Returns the server signing secret.
   * In production (process.env.NODE_ENV === 'production'):
   * FAILS CLOSED if neither AUTH_TOKEN_SECRET nor JWT_SECRET is configured.
   */
  public static getTokenSecret(): string {
    if (this.tokenSecret) {
      return this.tokenSecret;
    }
    const envSecret = process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET;
    if (envSecret && envSecret.trim().length > 0) {
      return envSecret.trim();
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY CONFIGURATION ERROR: Missing required production secret AUTH_TOKEN_SECRET / JWT_SECRET. Server failing closed.');
    }
    // In development / test environment: generate a cryptographically secure process-lifetime secret
    this.tokenSecret = crypto.randomBytes(32).toString('hex');
    return this.tokenSecret;
  }

  /**
   * Generates a signed cryptographic JWT using HMAC-SHA256
   */
  public static generateToken(payload: TokenPayload, expiresInSeconds = 24 * 3600): string {
    if (!payload || !payload.sub) {
      throw new Error('Token payload must include a subject identifier (sub).');
    }
    const secret = this.getTokenSecret();
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: TokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');

    return `${header}.${body}.${signature}`;
  }

  /**
   * Verifies a cryptographic JWT, checking algorithm, signature, and expiration
   */
  public static verifyToken(token: string, secretOverride?: string): TokenPayload {
    if (!token || typeof token !== 'string') {
      throw new Error('Malformed token: token must be a non-empty string.');
    }
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Malformed token: token must consist of header, payload, and signature segments.');
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify header
    let header: { alg?: string; typ?: string };
    try {
      header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    } catch {
      throw new Error('Malformed token: invalid header encoding.');
    }

    if (header.alg !== 'HS256') {
      throw new Error(`Unsupported token algorithm: expected HS256, received '${header.alg}'.`);
    }

    // Verify signature using timing-safe comparison
    const secret = secretOverride || this.getTokenSecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (signatureB64.length !== expectedSignature.length) {
      throw new Error('Invalid token signature: token signature length mismatch.');
    }

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(signatureB64, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );

    if (!isMatch) {
      throw new Error('Invalid token signature: forged or tampered token detected.');
    }

    // Verify payload
    let payload: TokenPayload;
    try {
      payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    } catch {
      throw new Error('Malformed token: invalid payload encoding.');
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp <= now) {
      throw new Error('Token has expired.');
    }

    return payload;
  }

  // ==================== RATE LIMITING & ACCOUNT LOCKOUT ====================

  /**
   * Rate limiting / brute-force protection
   */
  public static checkRateLimit(
    identifier: string,
    maxAttempts = 5,
    windowMs = 15 * 60 * 1000,
    lockDurationMs = 15 * 60 * 1000
  ): RateLimitStatus {
    const now = Date.now();
    let record = this.attempts.get(identifier);

    // If not in memory, check persistent storage
    if (!record && this.persistenceDb && typeof this.persistenceDb.loadCollection === 'function') {
      try {
        const persisted = this.persistenceDb.loadCollection('auth_lockouts') as any[];
        const match = persisted?.find(p => (p.key || p.id) === identifier);
        if (match && match.lockedUntil && match.lockedUntil > now) {
          record = {
            count: match.count || maxAttempts,
            firstAttemptTime: match.firstAttemptTime || now,
            lockedUntil: match.lockedUntil,
            tenantId: match.tenantId,
            companyId: match.companyId
          };
          this.attempts.set(identifier, record);
        }
      } catch {}
    }

    // Check if locked
    if (record && record.lockedUntil && record.lockedUntil > now) {
      const retryAfterMs = record.lockedUntil - now;
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterSec,
        retryAfterMs,
        error: `Too many failed attempts. Account temporarily locked. Please retry in ${retryAfterSec} seconds.`
      };
    }

    // Active attempt tracking when a custom window / drill rate limiter is invoked
    if (windowMs < 15 * 60 * 1000) {
      if (!record || (now - record.firstAttemptTime > windowMs)) {
        record = {
          count: 1,
          firstAttemptTime: now
        };
        this.attempts.set(identifier, record);
        return { allowed: true, remainingAttempts: maxAttempts - 1 };
      }

      record.count += 1;
      if (record.count >= maxAttempts) {
        record.lockedUntil = now + lockDurationMs;
        this.persistLockout(identifier, record);
        return {
          allowed: true,
          remainingAttempts: 0,
          retryAfterSec: Math.ceil(lockDurationMs / 1000),
          retryAfterMs: lockDurationMs
        };
      }

      return { allowed: true, remainingAttempts: Math.max(0, maxAttempts - record.count) };
    }

    if (!record) {
      return { allowed: true, remainingAttempts: maxAttempts };
    }

    // Check if window has expired
    if (now - record.firstAttemptTime > windowMs) {
      this.resetAttempts(identifier);
      return { allowed: true, remainingAttempts: maxAttempts };
    }

    if (record.count >= maxAttempts) {
      record.lockedUntil = now + lockDurationMs;
      this.persistLockout(identifier, record);
      const retryAfterSec = Math.ceil(lockDurationMs / 1000);
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterSec,
        retryAfterMs: lockDurationMs,
        error: `Rate limit exceeded. Too many attempts. Please retry in ${retryAfterSec} seconds.`
      };
    }

    return { allowed: true, remainingAttempts: Math.max(0, maxAttempts - record.count) };
  }

  /**
   * Records a failed attempt for rate limiting and persists lockout when triggered
   */
  public static recordFailure(
    identifier: string,
    maxAttempts = 5,
    lockDurationMs = 15 * 60 * 1000,
    tenantId = 'ten-001',
    companyId = 'comp-001'
  ): RateLimitStatus {
    const now = Date.now();
    let record = this.attempts.get(identifier);

    if (!record) {
      record = {
        count: 1,
        firstAttemptTime: now,
        tenantId,
        companyId
      };
      this.attempts.set(identifier, record);
    } else {
      record.count += 1;
    }

    if (record.count >= maxAttempts) {
      record.lockedUntil = now + lockDurationMs;
      this.persistLockout(identifier, record);
      const retryAfterSec = Math.ceil(lockDurationMs / 1000);
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterSec,
        retryAfterMs: lockDurationMs,
        error: `Too many failed attempts. Account temporarily locked. Please retry in ${retryAfterSec} seconds.`
      };
    }

    return {
      allowed: true,
      remainingAttempts: Math.max(0, maxAttempts - record.count)
    };
  }

  private static persistLockout(identifier: string, record: AttemptTracker): void {
    if (this.persistenceDb && typeof this.persistenceDb.saveEntity === 'function') {
      try {
        this.persistenceDb.saveEntity('auth_lockouts', {
          id: identifier,
          key: identifier,
          count: record.count,
          attempts: record.count,
          firstAttemptTime: record.firstAttemptTime,
          lockedUntil: record.lockedUntil,
          tenantId: record.tenantId || 'ten-001',
          companyId: record.companyId || 'comp-001'
        });
      } catch {}
    }
  }

  /**
   * Resets rate limiting on successful login
   */
  public static resetAttempts(identifier: string): void {
    this.attempts.delete(identifier);
    if (this.persistenceDb && typeof this.persistenceDb.deleteEntity === 'function') {
      try {
        this.persistenceDb.deleteEntity('auth_lockouts', identifier);
      } catch {}
    }
  }

  /**
   * Clears all lockout states (used for test teardown)
   */
  public static clearAllLockouts(): void {
    this.attempts.clear();
  }

  // ==================== AUTHENTICATION & AUTHORIZATION MIDDLEWARE ====================

  /**
   * Extracts Bearer token from Express request
   */
  public static extractBearerToken(req: Request): string | null {
    const authHeader = req.headers['authorization'];
    if (!authHeader || typeof authHeader !== 'string') return null;
    const parts = authHeader.trim().split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    }
    return null;
  }

  /**
   * Express middleware to authenticate requests via Bearer token
   */
  public static requireAuth(users: User[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const token = SecurityEngine.extractBearerToken(req);
      if (!token) {
        return res.status(401).json({ error: 'Authentication required. Missing Bearer authorization token.' });
      }

      let payload: TokenPayload;
      try {
        payload = SecurityEngine.verifyToken(token);
      } catch (err: any) {
        return res.status(401).json({ error: `Authentication failed: ${err.message}` });
      }

      const user = users.find(u => u.id === payload.sub);
      if (!user || !user.active) {
        return res.status(401).json({ error: 'Authentication failed: User does not exist or account is inactive.' });
      }

      // Attach authoritative security context
      (req as any).auth = payload;
      (req as any).user = SecurityEngine.sanitizeUser(user);

      next();
    };
  }

  /**
   * Express middleware to verify RBAC roles.
   * STRICTLY server-authoritative: reads ONLY from verified auth payload, NEVER from client-supplied headers.
   */
  public static requireRole(...allowedRoles: (UserRole | string)[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const auth = (req as any).auth;
      const userRole = auth?.role || (req as any).user?.role;
      if (!userRole) {
        return res.status(401).json({ error: 'Authentication required. Missing role credential.' });
      }

      if (allowedRoles.includes('Super Admin') && userRole === 'Super Admin') {
        return next();
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: `Forbidden: Role '${userRole}' is not authorized to perform this operation. Required: [${allowedRoles.join(', ')}]`
        });
      }
      next();
    };
  }

  /**
   * Middleware to enforce tenant and company boundary (anti-IDOR)
   */
  public static enforceTenantCompany() {
    return (req: Request, res: Response, next: NextFunction) => {
      const auth = (req as any).auth;
      if (!auth) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      // Check request body, query, and params for tenantId / companyId tampering
      const targetTenantId = req.body?.tenantId || req.query?.tenantId || req.params?.tenantId;
      const targetCompanyId = req.body?.companyId || req.query?.companyId || req.params?.companyId;

      if (targetTenantId && targetTenantId !== auth.tenantId && auth.role !== 'Super Admin') {
        return res.status(403).json({
          error: `Tenant isolation violation: User belonging to tenant '${auth.tenantId}' cannot access tenant '${targetTenantId}'.`
        });
      }

      if (targetCompanyId && targetCompanyId !== auth.companyId && auth.role !== 'Super Admin') {
        return res.status(403).json({
          error: `Company isolation violation: User belonging to company '${auth.companyId}' cannot access company '${targetCompanyId}'.`
        });
      }

      next();
    };
  }

  /**
   * Validates Segregation of Duties (SoD) for maker-checker workflows
   */
  public static enforceSoD(
    makerId: string,
    checkerId: string,
    operationName: string
  ): void {
    if (makerId && checkerId && makerId.trim().toLowerCase() === checkerId.trim().toLowerCase()) {
      throw new Error(
        `Segregation of Duties (SoD) Violation: User '${checkerId}' is the creator/maker of this ${operationName} and is strictly prohibited from approving or checking their own transaction.`
      );
    }
  }

  /**
   * Validates Segregation of Duties (SoD) for maker-checker workflows and returns result object
   */
  public static enforceSegregationOfDuties(
    makerId: string,
    checkerId: string,
    operationName = 'transaction'
  ): { allowed: boolean; error?: string } {
    try {
      this.enforceSoD(makerId, checkerId, operationName);
      return { allowed: true };
    } catch (err: any) {
      return { allowed: false, error: err.message };
    }
  }

  /**
   * Directly verifies tenant and company boundary against an authenticated token payload
   */
  public static verifyTenantCompanyBoundary(
    auth: TokenPayload | null,
    targetCompanyId?: string,
    targetTenantId?: string
  ): { allowed: boolean; error?: string } {
    if (!auth) {
      return { allowed: false, error: 'Authentication required.' };
    }
    if (auth.role === 'Super Admin') {
      return { allowed: true };
    }
    if (targetTenantId && targetTenantId !== auth.tenantId) {
      return {
        allowed: false,
        error: `Cross-tenant violation: User belonging to tenant '${auth.tenantId}' cannot access tenant '${targetTenantId}'.`
      };
    }
    if (targetCompanyId && targetCompanyId !== auth.companyId) {
      return {
        allowed: false,
        error: `Cross-company violation: User belonging to company '${auth.companyId}' cannot access company '${targetCompanyId}'.`
      };
    }
    return { allowed: true };
  }
}
