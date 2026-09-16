# AM Business OS MVP Security

## Implemented Controls

- HMAC-SHA256 token signing and verification.
- PBKDF2/SHA-512 password hashing and PIN hashing.
- Persistent login rate limits and account lockouts.
- Sanitized user responses and audit redaction.
- Tenant/company boundary helper with Super Admin exception.
- Central API authentication middleware for `/api/v1` routes.
- Public-route allowlist limited to authentication bootstrap, public branding, and onboarding probes.
- Production startup fails closed when bootstrap credentials are required but `INITIAL_ADMIN_PASSWORD` or `INITIAL_CASHIER_PIN` is absent.
- Invalid compliance environment values resolve safely to `LOCAL`.

## Verification

- `scripts/verify_p0_04_auth_security.ts`: 83/83 passed after hardening.
- `scripts/verify_p0_09_pilot_go_live.ts`: 39/39 passed after hardening.

## Remaining Risks

- `/api/v1/auth/me` remains a bootstrap endpoint and currently can issue a token for the default user; production login/session UX should be completed before external deployment.
- Route-specific role policies are inconsistent and should be centralized for sensitive backup, restore, configuration, and developer endpoints.
- No automated dependency scanning, CI security workflow, explicit CORS policy, or CSRF policy was detected.
- Upload and error-response review remains required across the complete route surface.

## Operational Rules

Production must provide a strong `AUTH_TOKEN_SECRET` or `JWT_SECRET`, explicit initial credentials for a clean bootstrap, persistent storage, and real statutory credentials only when operating in `SANDBOX` or `PRODUCTION`.
