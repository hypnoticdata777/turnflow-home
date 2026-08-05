# TurnFlow Home Build Log

Keep this log tight: what changed, why it changed, validation, and what remains.

## 2026-08-04 - Trust Boundary Hardening

Commit: `31267e3`  
Scope: server-side guardrails for maintenance workflows.

### Changed

- Added server-side request status validation in `updateRequestStatusAction`.
- Re-checked completion proof server-side before allowing `Complete`.
- Required a non-empty waiver reason when completion proof is missing.
- Scoped reminder deletion to the verified property.
- Validated vault document `requestId` against the same owner and property.

### Why

The client UI already prompted for completion proof and routed users through the
right workflow, but SaaS guardrails need to live on the server. These changes
reduce the risk of invalid status values, bypassed completion proof,
cross-property reminder deletion, and mismatched vault document links.

### Validation

- `npm.cmd test` passed: 33 tests.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd run lint` ran and surfaced pre-existing React hook lint issues in
  `components/QuoteWorkspace.tsx` and `components/RequestDetailView.tsx`.

### Follow-Up

- Fix existing hook lint issues.
- Review npm audit findings before public beta.
- Add deploy runbook and make demo setup repeatable.

## 2026-08-04 - POC Deployment Documentation

Scope: make the hosted demo path repeatable.

### Changed

- Added `docs/DEPLOYMENT.md` with environment variables, setup, seeded demo
  accounts, pre-deploy checks, and smoke-test steps.
- Added `docs/BUILD_LOG.md` as the running project build log.
- Added `db:seed:demo` as a script alias for the existing demo seed.
- Linked deployment docs and build log from the README.

### Why

The app is moving from portfolio MVP toward hosted SaaS POC. Repeatable docs
keep the project understandable when returning to it after each build step.

### Validation

- `npm.cmd test` passed: 33 tests.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd run lint` ran and still reports the known React hook lint issues in
  `components/QuoteWorkspace.tsx` and `components/RequestDetailView.tsx`.
- `npm.cmd install` reported 7 npm audit findings.

### Follow-Up

- Fix lint issues so the pre-deploy checklist can go fully green.
- Convert `db:push` POC setup to committed migrations before broader beta.
