# Build Log Index

> Chain step: **Refinement**. What changed, why, how it was validated, and what
> remains, one entry per change. Split by month on 2026-09-28 because the single
> file had grown to about 4,900 lines.

## Months

| Month | File | Entries | Date range |
|---|---|---|---|
| October 2026 | [2026-10.md](2026-10.md) | 1 | 2026-10-08 → 2026-10-08 |
| September 2026 | [2026-09.md](2026-09.md) | 38 | 2026-09-02 → 2026-09-28 |
| August 2026 | [2026-08.md](2026-08.md) | 80 | 2026-08-04 → 2026-08-17 |

## How to add an entry (from now on)

1. Open the file for the current month, e.g. `2026-10.md`. Create it from the header of the previous month if it does not exist, and add a row to the table above.
2. Add the new entry at the **top** (newest first), using the same shape:

```markdown
## YYYY-MM-DD - Short Title

Scope: one sentence.

### Changed

- ...

### Validation

- ...

### Follow-Up

- ...
```

3. Link the change from the matching flow doc's **Refinement** section in [`04-algorithms/`](../../04-algorithms/README.md).

`docs/BUILD_LOG.md` is kept as a frozen archive so old links keep working. Do not add new entries there.

## All entries

### September 2026

- 2026-09-28: P0 Security Hardening and Documentation Restructure (added after the split)
- 2026-09-18: Closeout Revision Loop Smoke
- 2026-09-17: Full Role Loop Smoke
- 2026-09-09: Invite Acceptance Loop Smoke
- 2026-09-09: CI Esbuild Lockfile Repair
- 2026-09-09: Requirements/Event Matrix and CI Env Fix
- 2026-09-09: Frictionless Invite Handoff and Lifecycle Logging
- 2026-09-09: Email and Cron Verification Surface
- 2026-09-09: Workspace and Billing Foundation
- 2026-09-09: Deep Health Runtime Checks
- 2026-09-09: Portfolio Screenshot Refresh
- 2026-09-09: Account Privacy Controls
- 2026-09-03: Request Detail: Deep Workflow Panels
- 2026-09-03: Request Detail: Quotes Section
- 2026-09-03: Completion Waiver / Billing Dispute Colors
- 2026-09-03: Accept Invite Action Language
- 2026-09-03: Quote Decision Colors
- 2026-09-03: Public Home / Signup Alignment
- 2026-09-03: Owner Vault Action Language
- 2026-09-03: Vendor / Helper Lane sky -> cyan Alignment
- 2026-09-03: RequestDetailView sky -> cyan Alignment
- 2026-09-03: Request Detail Status Chip on Dark Surface
- 2026-09-03: Request Status Badge Scale
- 2026-09-03: Backup / Restore Action Language
- 2026-09-03: New Request Intake Action Language
- 2026-09-03: Owner Calendar / Notifications Action Language
- 2026-09-03: Owner Setup / Account / Properties Action Language
- 2026-09-03: Helper Lane Action Language
- 2026-09-03: Request Detail Action-First Hierarchy
- 2026-09-03: Owner Dashboard Investor Walkthrough Polish
- 2026-09-02: Vendor Request Progressive Disclosure
- 2026-09-02: Vendor Lane Command Center Polish
- 2026-09-02: Curated Investor Demo Seed and Hosted Smoke Stability
- 2026-09-02: Hosted Latest Deployment Verification
- 2026-09-02: Owner Dashboard Lane Maturity and Contrast Fix
- 2026-09-02: Blob Upload Proxy, Public Store, Dev-Audit Cleanup
- 2026-09-02: First Owner Flow Smoke and Env Blocker Triage
- 2026-09-02: Hosted POC Auth and Smoke Hardening

### August 2026

- 2026-08-17: App-Wide Button Restyle and Copyright Notice
- 2026-08-14: Hosted Auth Cookie Redirect Fix
- 2026-08-12: Owner Closeout Review Guidance
- 2026-08-12: Vendor Closeout Readiness Gate
- 2026-08-12: Vendor Work Session Proof Gate
- 2026-08-12: Vendor Work Queue Snapshot
- 2026-08-12: Account Sharing Boundary Snapshot
- 2026-08-12: Owner Intake Handoff Readiness
- 2026-08-12: Public Homepage Positioning
- 2026-08-12: Backup Restore Trust UX
- 2026-08-12: Vendor Next Action Panel
- 2026-08-12: Owner Request Workflow Rail
- 2026-08-11: Endpoint Experience Map
- 2026-08-11: Proof Packet Billing Table
- 2026-08-11: Billing Records After Approved Closeout
- 2026-08-11: Owner Closeout Review Decisions
- 2026-08-11: Vendor Closeout Submission Bundle
- 2026-08-11: Task Costs And Owner Acceptance
- 2026-08-11: Structured Project Task Checklist
- 2026-08-11: Work Session Proof Gates And Task Labels
- 2026-08-11: Vendor Work Session Events
- 2026-08-11: Owner Quote Comparison Metrics
- 2026-08-11: Vendor Bid Decision Notifications
- 2026-08-11: Owner Bid Review Guidance
- 2026-08-11: Assigned Vendor Bid Submission
- 2026-08-11: Owner Vendor Fit Cues
- 2026-08-11: Vendor Matching Profiles
- 2026-08-11: Vendor Lifecycle Tracker
- 2026-08-11: Notification Delivery Health
- 2026-08-11: Owner Dashboard Update Signals
- 2026-08-11: Status Handoff Guidance
- 2026-08-11: Guided Owner/Vendor Updates
- 2026-08-11: Vendor Closeout Snapshot
- 2026-08-10: README Product Positioning Refresh
- 2026-08-10: Property Care Signals
- 2026-08-10: Owner Care Value Snapshots
- 2026-08-10: Owner Request Card Signals
- 2026-08-10: Request Record Value Snapshot
- 2026-08-10: Homeowner Value Snapshot
- 2026-08-10: POC Readiness Preflight
- 2026-08-10: Deterministic Helper Demo Seed
- 2026-08-10: Vendor Proof Upload Handoff
- 2026-08-10: Helper Request Card Readiness
- 2026-08-10: Helper First-Run Onboarding
- 2026-08-10: Helper Workspace Guidance
- 2026-08-10: Post-Create Notice Cleanup
- 2026-08-10: Post-Create Request Handoff
- 2026-08-10: Request Intake Readiness Guidance
- 2026-08-10: Inline Completion Waiver Review
- 2026-08-10: Request Detail Readiness Guidance
- 2026-08-10: Dashboard Readiness Guidance
- 2026-08-10: Owner Readiness Guidance
- 2026-08-10: Owner Trust Action Forms
- 2026-08-10: Helper Workspace UX
- 2026-08-10: Owner Workspace Navigation UX
- 2026-08-09: Public Auth UX Smoke
- 2026-08-09: UI UX Findings Register
- 2026-08-09: UI UX Review Process
- 2026-08-09: Protected Deep Health Check
- 2026-08-09: Baseline Security Headers
- 2026-08-08: Public Health Check
- 2026-08-08: CI Uses Product Gate
- 2026-08-08: Product QA Gate
- 2026-08-08: Shared Access Audit Email
- 2026-08-08: Shared Access Audit Trail
- 2026-08-08: Shared Access Removal
- 2026-08-08: Request Invite Copy Link
- 2026-08-08: Invite Link Fallback
- 2026-08-07: Pending Invite Controls
- 2026-08-07: Signup and Profile Friction Pass
- 2026-08-07: Owner Readiness Test Coverage
- 2026-08-07: Owner Account & Sharing Center
- 2026-08-07: Middleweight First-Run Testing Loop
- 2026-08-06: Lint Blocker Cleared
- 2026-08-06: Production Audit Cleared
- 2026-08-06: Baseline Migration Added
- 2026-08-06: Production Build Without Local Secrets
- 2026-08-06: GitHub CI Added
- 2026-08-04: Trust Boundary Hardening
- 2026-08-04: POC Deployment Documentation
