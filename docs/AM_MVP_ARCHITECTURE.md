# AM Business OS MVP Architecture

## Current Runtime

The MVP is a React 19 and TypeScript frontend built with Vite and Tailwind CSS, backed by a monolithic Express REST server in `server.ts`. Domain engines remain under `src/engine`, vertical engines under `src/verticals`, and shared contracts under `src/types`.

SQLite is the system of record through Node `DatabaseSync`, WAL mode, and the durable collection registry in `server/pilotDatabase.ts` and `server/persistenceRegistry.ts`. The current persistence model is a tenant/company-aware JSON document table rather than a relational domain schema.

## Execution Boundaries

- React shell: `src/App.tsx`
- Global client context: `src/context/PlatformContext.tsx`
- API client: `src/services/apiClient.ts`
- Server routes: `server.ts`
- Persistence: `server/pilotDatabase.ts`, `server/persistenceRegistry.ts`
- Security: `server/securityEngine.ts`
- Onboarding and vertical readiness: `src/verticals/onboardingReadinessEvaluator.ts`
- Compliance adapters: `src/compliance`

## Preserved Certified Areas

Accounting, tax, compliance adapters, inventory costing, vertical engines, onboarding, offline POS, branding, and existing certification suites were preserved. Changes in this MVP hardening pass are limited to identity contract alignment, API boundary protection, production credential fail-closed behavior, developer navigation gating, and removal of fabricated client telemetry defaults.

## Known Architectural Gaps

- `initDurableCollection` seeds empty collections from `src/data/mockDatabase.ts`; clean production bootstrap still needs an explicit foundational-seed policy.
- Navigation is state-based rather than URL-based.
- Feature flags and vertical visibility are not yet one server-authoritative registry.
- The Express server remains a very large monolithic route host.
- No CI/CD workflow is present in the repository.
