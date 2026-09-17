# AM Business Platform

AM Business Platform is a TypeScript/React ERP operating platform with an Express
API and SQLite persistence.

## Quick start

Requirements: Node.js 22 or newer and npm.

```bash
npm install
cp .env.example .env
npm run dev
```

The development server runs on `http://localhost:3000`. In a second terminal,
verify that it is healthy:

```bash
npm run smoke
```

## Configuration

Development can use the seeded local database. Production must provide:

- `NODE_ENV=production`
- `AUTH_TOKEN_SECRET` or `JWT_SECRET` with at least 32 characters
- `DATABASE_PATH` or `PERSISTENT_DATA_PATH` pointing to a durable volume
- `INITIAL_ADMIN_PASSWORD` and `INITIAL_CASHIER_PIN` when seeded users need credentials

Optional integrations include `GEMINI_API_KEY`, ETA credentials, and ZATCA
credentials. Missing optional integration credentials disable those integrations;
they must not be represented as statutory production certification.

The server prints a startup configuration summary without printing secret values.
Production fails fast when required security or persistence configuration is
missing. See [`.env.example`](./.env.example) and
[`docs/AM_MVP_DEPLOYMENT.md`](./docs/AM_MVP_DEPLOYMENT.md).

## Build and production start

```bash
npm run lint
npm run build
NODE_ENV=production npm start
```

Use a durable mounted volume for SQLite. Runtime database files, WAL files,
backups, and certification outputs are intentionally ignored by Git.

## Tests

```bash
npm run smoke       # requires npm run dev in another terminal
npm test            # full certification suites; may require significant memory
```

Certification scripts write runtime databases and should use an isolated
`DATABASE_PATH` in CI.

## Product scope

The repository contains broad ERP modules including accounting, inventory,
sales, purchasing, CRM, HR, POS, manufacturing, treasury, fixed assets,
onboarding, branding, and compliance adapters. The health/readiness endpoints,
durable persistence kernel, authentication engine, and onboarding gate are the
operational foundation. Statutory integrations and external AI services require
their own credentials and environment validation; local adapter tests do not
constitute authority certification.

Before enabling a module for production, verify its complete workflow:
authorization, validation, persistence, audit trail, restart recovery, and
reporting. Incomplete modules should remain disabled or explicitly marked as
pilot functionality rather than presented as fully certified.

## Repository hygiene

Do not commit generated SQLite files, WAL files, uploaded runtime assets,
backups, or test output. Use migrations/seed data for reproducible setup and
configure runtime storage outside the repository.
