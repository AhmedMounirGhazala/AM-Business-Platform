# AM Business OS MVP Baseline

**Baseline date:** 2026-09-16  
**Initial baseline status:** BLOCKED  
**Initial reason:** P0-08 Branding and P0-09 Pilot Go-Live certification failed on stale canonical identity assertions.

## Repository

- Branch: `main`
- Commit: `dff60a1b71eff29ac85883c16d7e35fb2c4e7457`
- Remote: `https://github.com/AhmedMounirGhazala/AM-Business-Platform`
- Worktree before test execution: pre-existing untracked `package-lock.json`; no existing files were reverted.
- Safety checkpoint: local branch `mvp-hardening-baseline-20260916` points to the baseline commit.

## Runtime

- Node: `v24.20.0`
- npm: `11.19.0`
- tsx: `v4.23.13`
- Package manager metadata: tracked `bun.lock`; untracked `package-lock.json` already existed.

Installed package versions were captured with `npm ls --depth=0`:

- React `19.3.0`, React DOM `19.3.0`
- TypeScript `5.8.3`
- Vite `6.4.3`
- Express `4.22.3`
- esbuild `0.25.12`
- Tailwind CSS `4.3.3`
- `tsx` `4.23.13`
- Recharts `3.10.1`
- Lucide React `0.546.0`

## Commands

Declared in `package.json`:

- Lint/typecheck: `npm run lint`
- Build: `npm run build`
- Declared regression: `npm test`
- Targeted suites: `npm run test:p006`, `npm run test:p007`
- Development: `npm run dev`
- Production start: `npm run start`

Additional suites executed during baseline verification:

- `scripts/verify_p0_01_persistence.ts`
- `scripts/verify_p0_02_dynamic_tax.ts`
- `scripts/verify_p0_03_accounting_integrity.ts`
- `scripts/verify_p0_04_auth_security.ts`
- `scripts/verify_p0_05_official_compliance.ts`
- `scripts/verify_p0_06_vertical_runtime.ts`
- `scripts/verify_p0_07_onboarding_wizard.ts`
- `scripts/verify_p0_08_branding_runtime.ts`
- `scripts/verify_p0_09_pilot_go_live.ts`
- `scripts/verify_all_phases.ts` through `npm test`

## Results

| Check | Result | Evidence |
|---|---|---|
| `npm run lint` | PASS | `tsc --noEmit` exited 0 |
| `npm run build` | PASS with warnings | Vite and esbuild exited 0 |
| `npm test` | PASS | Exit 0; final onboarding section reported 88/88 |
| P0-01 persistence | PASS | Exit 0 |
| P0-02 dynamic tax | PASS | Exit 0 |
| P0-03 accounting integrity | PASS | Exit 0 |
| P0-04 authentication/security | PASS | Exit 0 |
| P0-05 official compliance | PASS | Exit 0 |
| P0-06 vertical runtime | PASS | Included by `npm test`; exit 0 |
| P0-07 onboarding wizard | PASS | Included by `npm test`; exit 0; 88/88 |
| P0-08 branding runtime | FAIL | Canonical product identity check: product name is not `AM ERP` |
| P0-09 pilot go-live | FAIL | P09-I-01 canonical AM platform identity gate fails |

## Build Warnings

- Vite externalized `node:crypto` from `src/engine/complianceAdapterEngine.ts` for browser compatibility.
- The frontend JavaScript bundle exceeds the 500 kB advisory threshold.
- The backend bundle is approximately 3.1 MB with a 5.4 MB source map.

## Post-Baseline Repair Verification

The stale certification contract was aligned with the approved AM Business OS identity: product name `AM Business OS`, primary `#0B1F3A`, and gold accent `#C9A227`. Authoritative branding defaults were normalized to the same gold accent. The API now applies centralized authentication and tenant/company boundary middleware, production bootstrap credentials fail closed when required, future navigation entries are hidden, the sales test tab is Super Admin-only, and fabricated client notifications/recent pages were removed.

- P0-04 after security changes: 83/83 PASS.
- P0-08 after identity repair: 89/89 PASS.
- P0-09 after identity repair: 39/39 PASS.
- `npm run lint` after changes: PASS.
- `npm run build` after changes: PASS with the existing warnings above.
- `npm test` after changes: PASS.

The initial failures remain recorded above as historical baseline evidence; the current acceptance state is green for the executed suites, subject to the open gaps in the MVP gap register.

## Database Configuration

- Database implementation: native Node `DatabaseSync` SQLite.
- Default data directory: `PERSISTENT_DATA_PATH`, then `DATA_DIR`, then repository `data/`.
- Database override: `DATABASE_PATH`.
- Default database filename: `pilot_erp.db`.
- Journal mode: WAL.
- Synchronous mode: `NORMAL`.
- Foreign keys: enabled.
- Busy timeout: 5000 ms.
- Startup persistence controls: `PERSISTENCE_MODE`, `REQUIRE_PERSISTENT_STORAGE`, and `STRICT_PERSISTENCE_ABORT`.
- Compliance configuration: `COMPLIANCE_ENV`, ETA credentials, and ZATCA credentials/certificates.

## Known Warnings and Risks

- P0-08 and P0-09 currently block the baseline gate and must be diagnosed before MVP hardening continues.
- The build succeeds despite browser externalization of `node:crypto`; compliance browser/runtime behavior requires explicit review.
- No CI/CD workflow was detected during the audit.
- The repository contains database and WAL artifacts under `data/` and `1234/`; their deployment and source-control policy requires review.
- Baseline suites create or mutate test database artifacts, so their results are not equivalent to a clean immutable CI run.

## Test Side Effects

The executed suites wrote test data and generated artifacts in the repository worktree. Current post-baseline changes include modified tracked SQLite/WAL files under `data/`, generated branding asset directories, generated P0-09 database directories, and generated SQLite sidecar files. These artifacts were not deleted or reverted during the audit.

No application source code was modified during baseline verification. This baseline record is the only intentional source-controlled documentation addition. No packages were installed, no database was reset, and no certified subsystem was changed.

**Next permitted action:** diagnose and correct the canonical AM identity mismatch, rerun P0-08 and P0-09, then proceed only after the baseline gate is green.