# AM Business OS MVP Deployment

## Runtime

- Node `v24.20.0` was used for the baseline verification.
- Development entrypoint: `tsx server.ts`.
- Production build: Vite frontend plus bundled `dist/server.cjs`.
- Production start: `node dist/server.cjs`.

## Required Configuration

Provide `NODE_ENV=production`, a strong `AUTH_TOKEN_SECRET` or `JWT_SECRET`, persistent storage via `PERSISTENT_DATA_PATH` or `DATABASE_PATH`, and bootstrap credentials when a user requires initialization. Configure `STRICT_PERSISTENCE_ABORT` and `REQUIRE_PERSISTENT_STORAGE` according to the deployment platform.

Compliance environments are `LOCAL`, `SANDBOX`, and `PRODUCTION`. Real ETA/ZATCA credentials and certificates are required before statutory production submission. The application must not claim authority certification based only on local adapter tests.

## Storage

SQLite uses WAL mode and requires a durable mounted volume. Container-local or ephemeral storage is not acceptable for financial records. Backup and restore must be tested against the target deployment volume, not only an isolated test database.

## Current Deployment Risks

- No CI/CD workflow or deployment manifest was detected.
- The build warns that `node:crypto` is externalized from a browser-imported compliance module.
- Bundle sizes exceed the advisory threshold.
- Repository test execution generates database/WAL and asset artifacts; CI should isolate test data paths.
- Clean production bootstrap and seed-data separation remain unfinished.
