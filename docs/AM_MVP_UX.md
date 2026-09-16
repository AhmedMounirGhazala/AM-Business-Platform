# AM Business OS MVP UX

## Current Direction

The interface uses the AM Business OS identity: navy `#0B1F3A`, gold `#C9A227`, light canvas `#F8FAFC`, border `#E2E8F0`, Plus Jakarta Sans, Cairo, and first-class RTL/LTR support.

## Hardening Changes

- Explicit future modules are hidden from normal Sidebar navigation while their implementations remain available for controlled enablement.
- The sales hardening test tab is restricted to Super Admin.
- Fabricated recent pages and fabricated business notifications were removed from initial client state.
- Onboarding remains the first-run gate based on backend wizard state.

## Required Empty-State Work

A clean production bootstrap still needs server-side seed policy separation so dashboards, customers, inventory, sales, and notifications reflect real data only. Production modules should consistently provide actionable empty states with Add/Import actions.

## Remaining UX Gaps

- The shell uses state navigation instead of URL routes and browser-refresh-safe deep links.
- Some module labels and screens retain engineering terminology.
- Several legacy UI literals still use the older orange accent and need a deliberate visual consolidation pass rather than a blind replacement.
- Login and bootstrap UX should be made explicit for production instead of relying on `/auth/me` bootstrap behavior.
