# AM Business OS MVP Gap Register

| Priority | Gap | Status | Evidence / Next Action |
|---|---|---|---|
| P0 | Canonical branding certification expected stale AM ERP/orange values | RESOLVED | Runtime and P0-08/P0-09 now align to AM Business OS and gold `#C9A227`; rerun full regression after changes. |
| P0 | Production credential fallback | RESOLVED | Production startup now fails closed when bootstrap credentials are required and absent. |
| P0 | Global API authentication boundary | PARTIALLY RESOLVED | Central guard added; route-specific role policies and bootstrap `/auth/me` behavior still require hardening. |
| P0 | Clean installation without demo transactions | OPEN | Empty collections currently seed from `src/data/mockDatabase.ts`; implement foundational bootstrap policy and clean-install tests. |
| P1 | Future modules visible in normal navigation | RESOLVED | Sidebar filters explicit future entries; feature registry still needs server-authoritative integration. |
| P1 | Developer test tab visible to users | RESOLVED | Sales hardening tab restricted to Super Admin. Other admin/developer surfaces need inventory. |
| P1 | Fabricated frontend notifications and recent pages | RESOLVED | Initial client state now empty unless backed by local user history. |
| P1 | Sales and purchasing end-to-end business-flow proof | OPEN | Add API/database reconciliation tests across quotation/order/delivery/invoice/payment and request/order/receipt/bill/payment. |
| P1 | Backup/restore production drill | UNVERIFIED | Existing certification covers isolated restore; execute against target deployment volume with corruption and WAL scenarios. |
| P1 | CI/CD and security scanning | OPEN | No workflow detected; add lint, build, regression, dependency, and secret scanning pipeline. |
| P2 | URL navigation and deep-link persistence | OPEN | Replace or supplement state-only module navigation. |
| P2 | Legacy orange UI token consolidation | OPEN | Deliberately migrate remaining literals to approved design tokens after visual review. |
