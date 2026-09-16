# AM Business OS MVP Test Matrix

## Baseline Commands

- `npm run lint`
- `npm run build`
- `npm test`
- `npx --no-install tsx scripts/verify_p0_01_persistence.ts`
- `npx --no-install tsx scripts/verify_p0_02_dynamic_tax.ts`
- `npx --no-install tsx scripts/verify_p0_03_accounting_integrity.ts`
- `npx --no-install tsx scripts/verify_p0_04_auth_security.ts`
- `npx --no-install tsx scripts/verify_p0_05_official_compliance.ts`
- `npx --no-install tsx scripts/verify_p0_06_vertical_runtime.ts`
- `npx --no-install tsx scripts/verify_p0_07_onboarding_wizard.ts`
- `npx --no-install tsx scripts/verify_p0_08_branding_runtime.ts`
- `npx --no-install tsx scripts/verify_p0_09_pilot_go_live.ts`

## Verified During This Pass

- TypeScript lint: PASS.
- Production build: PASS with existing crypto externalization and bundle-size warnings.
- Declared `npm test`: PASS.
- P0-04 security: 83/83 PASS.
- P0-08 branding: 89/89 PASS.
- P0-09 pilot go-live: 39/39 PASS.

## Existing Coverage

Persistence, tax, accounting, authentication, compliance, vertical runtime, onboarding, branding, and pilot readiness suites exist. The vertical suite includes mobile phone, women's clothing, children's clothing, and apparel manufacturing scenarios.

## Required Next Coverage

Add API-level tests for the centralized route guard, production bootstrap credential failure, clean installation without seeded transactions, real sales-to-payment reconciliation, purchase-to-payment reconciliation, empty dashboard state, backup corruption rejection, restore verification, and browser UI smoke coverage.

## Test Discipline

Do not change certified accounting or tax assertions to make tests pass. When a test conflicts with the approved product contract, document the conflict and update only the obsolete assertion with evidence.
