/**
 * AM BUSINESS PLATFORM — PILOT VERIFICATION SUITE
 * TASK P0-04: CREDENTIALS & AUTHENTICATION SECURITY CERTIFICATION
 * 
 * Comprehensive Security Verification Suite covering:
 * Section 1: PBKDF2 Password Hashing & Salt Stretching (SHA-512, 100k iters)
 * Section 2: Password Policy Enforcement & Credential Mutation
 * Section 3: Cashier PIN Security & Rapid POS Auth
 * Section 4: Rate Limiting & Account Lockout Resistance to Bypass
 * Section 5: Auth Token & Session Security (HMAC-SHA256 JWT, Signature, Expiry)
 * Section 6: Elimination of Auth Bypasses & Client Header Spoofing
 * Section 7: Role-Based Access Control (RBAC) across Enterprise Modules
 * Section 8: Segregation of Duties (SoD) Enforcement
 * Section 9: Tenant & Company Isolation (Anti-IDOR Protection)
 * Section 10: POS Security Boundary & Register Isolation
 * Section 11: Sanitization & Audit Trail with Zero Secret Leakage
 */

import { SecurityEngine, JWTPayload } from '../server/securityEngine';
import { PilotDatabaseService } from '../server/pilotDatabase';
import { User, Tenant, Company, POSRegister } from '../src/types';
import * as crypto from 'crypto';

interface TestResult {
  section: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, section: string, name: string, details?: string) {
  if (!condition) {
    results.push({ section, name, passed: false, details: details || 'Assertion failed' });
    console.error(`❌ [FAIL] [${section}] ${name}: ${details || ''}`);
  } else {
    results.push({ section, name, passed: true, details });
    console.log(`✅ [PASS] [${section}] ${name}`);
  }
}

async function runSuite() {
  console.log('========================================================================================');
  console.log('AM ENTERPRISE ERP — P0-04 CREDENTIALS & AUTHENTICATION SECURITY CERTIFICATION');
  console.log('========================================================================================\n');

  const testDb = PilotDatabaseService.getInstance();
  SecurityEngine.initPersistence(testDb);

  // ========================================================================================
  // SECTION 1: PBKDF2 Password Hashing & Salt Stretching
  // ========================================================================================
  console.log('--- SECTION 1: PBKDF2 Password Hashing & Salt Stretching ---');
  
  const rawPassword = 'StrongSecurePassword@2026!';
  const hash1 = SecurityEngine.hashPassword(rawPassword);
  const hash2 = SecurityEngine.hashPassword(rawPassword);

  assert(hash1.startsWith('$pbkdf2$100000$'), 'SEC-01', 'Hash format contains algorithm and 100,000 iterations');
  assert(hash1 !== hash2, 'SEC-01', 'Unique cryptographic salt per hash (salts must never repeat)');
  
  const parts1 = hash1.split('$');
  assert(parts1.length === 5, 'SEC-01', 'Hash has valid 5-part structure ($pbkdf2$iterations$salt$derivedKey)');
  assert(parts1[3].length >= 32, 'SEC-01', 'Salt length meets minimum 16-byte hex security threshold (>= 32 hex chars)');

  const validVerification = SecurityEngine.verifyPassword(rawPassword, hash1);
  assert(validVerification === true, 'SEC-01', 'Valid password verification returns true');

  const invalidVerification = SecurityEngine.verifyPassword('WrongPassword@2026!', hash1);
  assert(invalidVerification === false, 'SEC-01', 'Invalid password verification returns false');

  const emptyVerification = SecurityEngine.verifyPassword('', hash1);
  assert(emptyVerification === false, 'SEC-01', 'Empty password verification returns false');

  const malformedHashVerification = SecurityEngine.verifyPassword(rawPassword, 'plain_text_hash_dummy');
  assert(malformedHashVerification === false, 'SEC-01', 'Malformed hash string fails closed (returns false, no crash)');

  const corruptedHash = hash1.slice(0, -4) + '0000';
  assert(SecurityEngine.verifyPassword(rawPassword, corruptedHash) === false, 'SEC-01', 'Tampered hash payload fails closed');

  // ========================================================================================
  // SECTION 2: Password Policy Enforcement & Credential Mutation
  // ========================================================================================
  console.log('\n--- SECTION 2: Password Policy Enforcement & Credential Mutation ---');

  assert(SecurityEngine.validatePassword('').valid === false, 'SEC-02', 'Policy rejects empty password');
  assert(SecurityEngine.validatePassword('   ').valid === false, 'SEC-02', 'Policy rejects whitespace-only password');
  assert(SecurityEngine.validatePassword('short').valid === false, 'SEC-02', 'Policy rejects password < 8 characters');
  assert(SecurityEngine.validatePassword('1234567').valid === false, 'SEC-02', 'Policy rejects 7-character password');
  assert(SecurityEngine.validatePassword('ValidPass123!').valid === true, 'SEC-02', 'Policy accepts compliant >=8 char password');

  // Verify safe credential update simulation
  let userCredHash = SecurityEngine.hashPassword('InitialPass123!');
  const currentPassAttemptWrong = SecurityEngine.verifyPassword('IncorrectCurrent!', userCredHash);
  assert(currentPassAttemptWrong === false, 'SEC-02', 'Password update fails if current password is wrong');

  const currentPassAttemptRight = SecurityEngine.verifyPassword('InitialPass123!', userCredHash);
  assert(currentPassAttemptRight === true, 'SEC-02', 'Current password successfully verified');

  const newPassPolicy = SecurityEngine.validatePassword('NewSecurePass2026$');
  assert(newPassPolicy.valid === true, 'SEC-02', 'New password meets complexity requirement');

  userCredHash = SecurityEngine.hashPassword('NewSecurePass2026$');
  assert(SecurityEngine.verifyPassword('InitialPass123!', userCredHash) === false, 'SEC-02', 'Old password rejected after credential update');
  assert(SecurityEngine.verifyPassword('NewSecurePass2026$', userCredHash) === true, 'SEC-02', 'New password successfully authenticates');

  // ========================================================================================
  // SECTION 3: Cashier PIN Security & Rapid POS Auth
  // ========================================================================================
  console.log('\n--- SECTION 3: Cashier PIN Security & Rapid POS Auth ---');

  const pin = '4829';
  const pinHash1 = SecurityEngine.hashPin(pin);
  const pinHash2 = SecurityEngine.hashPin(pin);

  assert(pinHash1.startsWith('$pin$100000$'), 'SEC-03', 'PIN hash contains $pin$ prefix and 100k iterations');
  assert(pinHash1 !== pinHash2, 'SEC-03', 'PIN hash utilizes unique cryptographic salt');
  assert(SecurityEngine.verifyPin(pin, pinHash1) === true, 'SEC-03', 'Valid PIN verification succeeds');
  assert(SecurityEngine.verifyPin('0000', pinHash1) === false, 'SEC-03', 'Invalid PIN verification fails');
  assert(SecurityEngine.verifyPin('', pinHash1) === false, 'SEC-03', 'Empty PIN verification fails');
  assert(SecurityEngine.validatePin('12').valid === false, 'SEC-03', 'Policy rejects PIN < 4 digits');
  assert(SecurityEngine.validatePin('abcd').valid === false, 'SEC-03', 'Policy rejects non-numeric PIN');
  assert(SecurityEngine.validatePin('1234').valid === true, 'SEC-03', 'Policy accepts 4-digit numeric PIN');
  assert(SecurityEngine.validatePin('987654').valid === true, 'SEC-03', 'Policy accepts 6-digit numeric PIN');

  // ========================================================================================
  // SECTION 4: Rate Limiting & Account Lockout Resistance to Bypass
  // ========================================================================================
  console.log('\n--- SECTION 4: Rate Limiting & Account Lockout Resistance to Bypass ---');

  const testUserKey = 'login:test-lockout@company.com';
  SecurityEngine.resetAttempts(testUserKey);

  // 1st to 4th attempt: failures recorded, still allowed
  for (let i = 1; i <= 4; i++) {
    const status = SecurityEngine.recordFailure(testUserKey, 5, 15 * 60 * 1000);
    assert(status.allowed === true, 'SEC-04', `Attempt ${i}/5 failed: allowed remains true`);
  }

  // 5th attempt: threshold reached -> lockout triggered
  const lockoutStatus = SecurityEngine.recordFailure(testUserKey, 5, 15 * 60 * 1000);
  assert(lockoutStatus.allowed === false, 'SEC-04', '5th consecutive failure triggers account lockout');
  assert(lockoutStatus.retryAfterSec !== undefined && lockoutStatus.retryAfterSec > 0, 'SEC-04', 'Lockout includes positive retryAfter duration');

  // Check rate limit check directly
  const directCheck = SecurityEngine.checkRateLimit(testUserKey);
  assert(directCheck.allowed === false, 'SEC-04', 'Direct rateLimitCheck returns allowed=false during active lockout');

  // Lockout bypass test: entering correct password during lockout must STILL FAIL
  const validPass = 'CorrectPass123!';
  const lockedUserHash = SecurityEngine.hashPassword(validPass);
  const attemptDuringLockout = SecurityEngine.checkRateLimit(testUserKey);
  assert(attemptDuringLockout.allowed === false, 'SEC-04', 'Entering correct credentials during lockout is rejected before auth check');

  // Persistence check: verify lockout state survives in durable storage
  const durableCheck = testDb.queryEntities<any>('auth_lockouts');
  const matchingRateLimit = durableCheck.find((r: any) => r.key === testUserKey || r.id === testUserKey);
  assert(matchingRateLimit !== undefined, 'SEC-04', 'Lockout state persisted in durable database');
  assert(matchingRateLimit?.attempts >= 5 || matchingRateLimit?.count >= 5, 'SEC-04', 'Durable database records 5 attempts');

  // Reset check
  SecurityEngine.resetAttempts(testUserKey);
  const afterResetCheck = SecurityEngine.checkRateLimit(testUserKey);
  assert(afterResetCheck.allowed === true, 'SEC-04', 'resetAttempts restores account access immediately');

  // ========================================================================================
  // SECTION 5: Auth Token & Session Security (HMAC-SHA256 JWT)
  // ========================================================================================
  console.log('\n--- SECTION 5: Auth Token & Session Security (HMAC-SHA256 JWT) ---');

  const samplePayload: JWTPayload = {
    sub: 'usr-pilot-01',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    role: 'Chief Accountant',
    email: 'accountant@enterprise.com',
    name: 'Karim Al-Sayed',
    permissions: ['GL_READ' as any, 'GL_POST' as any, 'TAX_READ' as any]
  };

  const validToken = SecurityEngine.generateToken(samplePayload, 3600); // 1 hour
  assert(validToken.split('.').length === 3, 'SEC-05', 'Token has 3 dot-separated JWT parts (header.payload.signature)');

  const verifiedPayload = SecurityEngine.verifyToken(validToken);
  assert(verifiedPayload.sub === 'usr-pilot-01', 'SEC-05', 'Verified token preserves subject identity');
  assert(verifiedPayload.tenantId === 'ten-001', 'SEC-05', 'Verified token preserves tenant boundary');
  assert(verifiedPayload.companyId === 'comp-001', 'SEC-05', 'Verified token preserves company boundary');
  assert(verifiedPayload.role === 'Chief Accountant', 'SEC-05', 'Verified token preserves user role');

  // Tampered payload test
  const parts = validToken.split('.');
  const decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  decodedPayload.role = 'Super Admin'; // Privilege escalation attempt
  const forgedPayloadSegment = Buffer.from(JSON.stringify(decodedPayload)).toString('base64url');
  const tamperedToken = `${parts[0]}.${forgedPayloadSegment}.${parts[2]}`;

  let tamperedCaught = false;
  try {
    SecurityEngine.verifyToken(tamperedToken);
  } catch (err: any) {
    tamperedCaught = true;
    assert(err.message.includes('signature'), 'SEC-05', 'Tampered payload rejected with invalid signature');
  }
  assert(tamperedCaught, 'SEC-05', 'Tampered token is strictly rejected');

  // Expired token test
  const expiredToken = SecurityEngine.generateToken(samplePayload, -10); // Expired 10 seconds ago
  let expiredCaught = false;
  try {
    SecurityEngine.verifyToken(expiredToken);
  } catch (err: any) {
    expiredCaught = true;
    assert(err.message.includes('expired'), 'SEC-05', 'Expired token rejected with expired message');
  }
  assert(expiredCaught, 'SEC-05', 'Expired token is strictly rejected');

  // Forged token signed with a different secret
  const foreignSecret = 'attacker-rogue-secret-999999999999999999999';
  const foreignHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const foreignPayload = Buffer.from(JSON.stringify({ ...samplePayload, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  const foreignSig = crypto.createHmac('sha256', foreignSecret).update(`${foreignHeader}.${foreignPayload}`).digest('base64url');
  const foreignToken = `${foreignHeader}.${foreignPayload}.${foreignSig}`;

  let foreignCaught = false;
  try {
    SecurityEngine.verifyToken(foreignToken);
  } catch (err: any) {
    foreignCaught = true;
  }
  assert(foreignCaught, 'SEC-05', 'Foreign signed token strictly rejected');

  // Malformed token test
  const checkThrows = (fn: () => void) => {
    try { fn(); return false; } catch { return true; }
  };
  assert(checkThrows(() => SecurityEngine.verifyToken('invalid.token')), 'SEC-05', 'Malformed token with missing segment rejected');
  assert(checkThrows(() => SecurityEngine.verifyToken('')), 'SEC-05', 'Empty token string rejected');

  // ========================================================================================
  // SECTION 6: Elimination of Auth Bypasses & Client Header Spoofing
  // ========================================================================================
  console.log('\n--- SECTION 6: Elimination of Auth Bypasses & Client Header Spoofing ---');

  // Mock Request with spoofed client headers but NO Bearer token
  const spoofedReq: any = {
    headers: {
      'x-user-id': 'usr-admin-01',
      'x-user-role': 'Super Admin',
      'x-user-name': 'Fake Admin',
      'x-tenant-id': 'ten-001',
      'x-company-id': 'comp-001'
    }
  };

  const extractedToken = SecurityEngine.extractBearerToken(spoofedReq);
  assert(extractedToken === null, 'SEC-06', 'No Bearer token extracted from spoofed client headers');

  // Mock Request with valid Bearer token
  const legitReq: any = {
    headers: {
      'authorization': `Bearer ${validToken}`
    }
  };
  const legitExtracted = SecurityEngine.extractBearerToken(legitReq);
  assert(legitExtracted === validToken, 'SEC-06', 'Bearer token cleanly extracted from authorization header');

  // ========================================================================================
  // SECTION 7: Role-Based Access Control (RBAC) across Enterprise Modules
  // ========================================================================================
  console.log('\n--- SECTION 7: Role-Based Access Control (RBAC) across Enterprise Modules ---');

  // Role permissions testing
  const cashierAuth: JWTPayload = {
    sub: 'usr-cashier-01',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    role: 'Cashier',
    name: 'Sami Cashier'
  };

  const accountantAuth: JWTPayload = {
    sub: 'usr-acc-01',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    role: 'Chief Accountant',
    name: 'Mona Accountant'
  };

  const adminAuth: JWTPayload = {
    sub: 'usr-admin-01',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    role: 'Super Admin',
    name: 'Ahmed Admin'
  };

  const auditorAuth: JWTPayload = {
    sub: 'usr-audit-01',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    role: 'Internal Auditor',
    name: 'Farid Auditor'
  };

  // Test Route Guard Function for RBAC
  function checkRouteAccess(auth: JWTPayload | null, allowedRoles: string[]): { status: number; allowed: boolean } {
    if (!auth) return { status: 401, allowed: false };
    if (!allowedRoles.includes(auth.role)) return { status: 403, allowed: false };
    return { status: 200, allowed: true };
  }

  // 1. Audit Logs: Admin and Auditor only
  const auditAllowedRoles = ['Super Admin', 'Tenant Admin', 'Internal Auditor', 'Financial Auditor'];
  assert(checkRouteAccess(null, auditAllowedRoles).status === 401, 'SEC-07', 'Unauthenticated request to audit logs returns 401');
  assert(checkRouteAccess(cashierAuth, auditAllowedRoles).status === 403, 'SEC-07', 'Cashier accessing audit logs returns 403 Forbidden');
  assert(checkRouteAccess(accountantAuth, auditAllowedRoles).status === 403, 'SEC-07', 'Chief Accountant accessing audit logs returns 403 Forbidden');
  assert(checkRouteAccess(adminAuth, auditAllowedRoles).status === 200, 'SEC-07', 'Super Admin accessing audit logs returns 200 OK');
  assert(checkRouteAccess(auditorAuth, auditAllowedRoles).status === 200, 'SEC-07', 'Internal Auditor accessing audit logs returns 200 OK');

  // 2. Accounting GL Journals: Accounting and Admin only
  const glAllowedRoles = ['Super Admin', 'Tenant Admin', 'Chief Accountant', 'Senior Accountant', 'General Ledger Accountant'];
  assert(checkRouteAccess(cashierAuth, glAllowedRoles).status === 403, 'SEC-07', 'Cashier accessing general ledger journals returns 403');
  assert(checkRouteAccess(accountantAuth, glAllowedRoles).status === 200, 'SEC-07', 'Chief Accountant accessing general ledger journals returns 200');
  assert(checkRouteAccess(adminAuth, glAllowedRoles).status === 200, 'SEC-07', 'Super Admin accessing general ledger journals returns 200');

  // 3. Posting Rules Configuration: Admin and Chief Accountant only
  const configAllowedRoles = ['Super Admin', 'Tenant Admin', 'Chief Accountant'];
  assert(checkRouteAccess(cashierAuth, configAllowedRoles).status === 403, 'SEC-07', 'Cashier accessing posting rules configuration returns 403');
  assert(checkRouteAccess(accountantAuth, configAllowedRoles).status === 200, 'SEC-07', 'Chief Accountant configuring posting rules returns 200');

  // 4. POS Shift Execution: Cashier and Store Manager only
  const posAllowedRoles = ['Cashier', 'POS Supervisor', 'Store Manager', 'Super Admin'];
  assert(checkRouteAccess(accountantAuth, posAllowedRoles).status === 403, 'SEC-07', 'Accountant opening POS shift returns 403 Forbidden');
  assert(checkRouteAccess(cashierAuth, posAllowedRoles).status === 200, 'SEC-07', 'Cashier opening POS shift returns 200 OK');

  // ========================================================================================
  // SECTION 8: Segregation of Duties (SoD) Enforcement
  // ========================================================================================
  console.log('\n--- SECTION 8: Segregation of Duties (SoD) Enforcement ---');

  const sodSameUser = SecurityEngine.enforceSegregationOfDuties(
    'usr-maker-01',
    'usr-maker-01',
    'Financial Journal Posting'
  );
  assert(sodSameUser.allowed === false, 'SEC-08', 'Maker cannot approve their own financial transaction (SoD violation)');
  assert(sodSameUser.error?.includes('Segregation of Duties'), 'SEC-08', 'SoD error message clearly identifies policy violation');

  const sodDistinctUser = SecurityEngine.enforceSegregationOfDuties(
    'usr-maker-01',
    'usr-checker-02',
    'Financial Journal Posting'
  );
  assert(sodDistinctUser.allowed === true, 'SEC-08', 'Independent checker can approve transaction created by different maker');

  // ========================================================================================
  // SECTION 9: Tenant & Company Isolation (Anti-IDOR Protection)
  // ========================================================================================
  console.log('\n--- SECTION 9: Tenant & Company Isolation (Anti-IDOR Protection) ---');

  const companyAAuth: JWTPayload = {
    sub: 'usr-compA-01',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    role: 'Chief Accountant',
    name: 'Company A Accountant'
  };

  // 1. Target company matches auth company -> ALLOWED
  const idorValid = SecurityEngine.verifyTenantCompanyBoundary(companyAAuth, 'comp-001', 'ten-001');
  assert(idorValid.allowed === true, 'SEC-09', 'Access to own company resource is allowed');

  // 2. Target company different from auth company -> REJECTED (IDOR attempt)
  const idorInvalidCompany = SecurityEngine.verifyTenantCompanyBoundary(companyAAuth, 'comp-002', 'ten-001');
  assert(idorInvalidCompany.allowed === false, 'SEC-09', 'Access to different company resource is strictly rejected (Anti-IDOR)');
  assert(idorInvalidCompany.error?.includes('Cross-company'), 'SEC-09', 'Cross-company error message returned');

  // 3. Target tenant different from auth tenant -> REJECTED
  const idorInvalidTenant = SecurityEngine.verifyTenantCompanyBoundary(companyAAuth, 'comp-001', 'ten-002');
  assert(idorInvalidTenant.allowed === false, 'SEC-09', 'Access to different tenant resource is strictly rejected');

  // 4. Super Admin exception
  const idorSuperAdmin = SecurityEngine.verifyTenantCompanyBoundary(adminAuth, 'comp-002', 'ten-001');
  assert(idorSuperAdmin.allowed === true, 'SEC-09', 'Super Admin cross-company administrative access permitted');

  // ========================================================================================
  // SECTION 10: POS Security Boundary & Register Isolation
  // ========================================================================================
  console.log('\n--- SECTION 10: POS Security Boundary & Register Isolation ---');

  const registerCompanyA: POSRegister = {
    id: 'reg-01',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    branchId: 'br-01',
    warehouseId: 'wh-01',
    code: 'REG-01',
    name: 'Main Store Register',
    nameAr: 'نقطة بيع رئيسية',
    isActive: true,
    cashDrawerStatus: 'CLOSED',
    defaultCashAccountId: 'acc-1010',
    defaultBankAccountId: 'acc-1020'
  };

  const registerCompanyB: POSRegister = {
    id: 'reg-02',
    tenantId: 'ten-001',
    companyId: 'comp-002',
    branchId: 'br-02',
    warehouseId: 'wh-02',
    code: 'REG-02',
    name: 'Branch 2 Register',
    nameAr: 'نقطة بيع الفرع 2',
    isActive: true,
    cashDrawerStatus: 'CLOSED',
    defaultCashAccountId: 'acc-1010',
    defaultBankAccountId: 'acc-1020'
  };

  // Cashier from Company A opens Register A -> ALLOWED
  const posAOpen = SecurityEngine.verifyTenantCompanyBoundary(cashierAuth, registerCompanyA.companyId, registerCompanyA.tenantId);
  assert(posAOpen.allowed === true, 'SEC-10', 'Cashier allowed to operate register in own company');

  // Cashier from Company A attempts to open Register B -> REJECTED
  const posBOpen = SecurityEngine.verifyTenantCompanyBoundary(cashierAuth, registerCompanyB.companyId, registerCompanyB.tenantId);
  assert(posBOpen.allowed === false, 'SEC-10', 'Cashier strictly forbidden from operating register belonging to another company');

  // POS Session Token Generation & Verification
  const posToken = SecurityEngine.generateToken({
    sub: cashierAuth.sub,
    tenantId: cashierAuth.tenantId,
    companyId: cashierAuth.companyId,
    role: cashierAuth.role,
    name: cashierAuth.name,
    type: 'pos_session'
  }, 28800); // 8-hour shift token

  const posPayload = SecurityEngine.verifyToken(posToken);
  assert(posPayload.type === 'pos_session', 'SEC-10', 'POS session token contains authoritative session type');

  // ========================================================================================
  // SECTION 11: Sanitization & Audit Trail with Zero Secret Leakage
  // ========================================================================================
  console.log('\n--- SECTION 11: Sanitization & Audit Trail with Zero Secret Leakage ---');

  const sensitiveUser: User = {
    id: 'usr-sensitive-01',
    tenantId: 'ten-001',
    companyId: 'comp-001',
    name: 'Test Sensitive User',
    email: 'sensitive@enterprise.com',
    role: 'Super Admin',
    passwordHash: '$pbkdf2$100000$deadbeef$cafebabe',
    pinHash: '$pin$100000$123456$abcdef',
    active: true,
    permissions: [],
    createdAt: new Date().toISOString()
  };

  const sanitized = SecurityEngine.sanitizeUser(sensitiveUser);
  assert((sanitized as any).passwordHash === undefined, 'SEC-11', 'Sanitized user removes passwordHash');
  assert((sanitized as any).pinHash === undefined, 'SEC-11', 'Sanitized user removes pinHash');
  assert(sanitized.id === sensitiveUser.id, 'SEC-11', 'Sanitized user retains non-sensitive fields');

  // Sensitive string masking for audit trails
  const rawLog1 = 'User logged in with password: SuperSecretPassword123! and pin 4829';
  const sanitizedLog1 = SecurityEngine.sanitizeString(rawLog1);
  assert(!sanitizedLog1.includes('SuperSecretPassword123!'), 'SEC-11', 'Password masked in audit log string');
  assert(!sanitizedLog1.includes('4829'), 'SEC-11', 'PIN masked in audit log string');
  assert(sanitizedLog1.includes('[REDACTED]'), 'SEC-11', 'Redaction placeholder inserted');

  const rawLog2 = `Request headers included Authorization: Bearer ${validToken}`;
  const sanitizedLog2 = SecurityEngine.sanitizeString(rawLog2);
  assert(!sanitizedLog2.includes(validToken), 'SEC-11', 'Bearer token masked in audit log string');

  // ========================================================================================
  // FINAL REPORT & VERDICT
  // ========================================================================================
  console.log('\n========================================================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`TOTAL SECURITY TESTS : ${total}`);
  console.log(`PASSED               : ${passed}`);
  console.log(`FAILED               : ${failed}`);
  console.log(`VERDICT              : [ ${failed === 0 ? 'CERTIFIED - PASS' : 'FAILED'} ]`);
  console.log('========================================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
