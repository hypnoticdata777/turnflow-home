# User Requirements And Event Matrix

Purpose: keep TurnFlow's user loops testable without adding payments,
marketplace, or other external dependencies too early. The product should guide
each role to the next useful action, record important transitions as a byproduct
of normal use, and make privacy boundaries obvious.

## Testing Posture

Yes, test the app hard. Do it as role-based loops, not random clicking.

1. Start with the user's job-to-be-done.
2. Walk the shortest natural path to completion.
3. Confirm the next action is obvious at each step.
4. Confirm the right event is recorded automatically.
5. Confirm the other role sees only the appropriate result.
6. Confirm owner-only data stays private.

If a tester has to ask "what happened?" or "what do I do next?", treat that as
a workflow gap even if the database row exists.

## Role Requirements

| Role | Requirement | Done When | Primary Screens | Event Coverage |
|---|---|---|---|---|
| Owner | Create a repair record | A request exists with property, priority, contact/access context, optional proof, and private owner control. | `/owner/requests/new`, `/owner/requests/[id]` | `request_created`, `status_changed`, photo rows |
| Owner | Add proof and cost context | Before/after/receipt/context proof and estimate/quote/final cost can be saved before closeout. | `/owner/requests/[id]` | photo rows, `status_changed`, quote/task/billing events |
| Owner | Invite a vendor or collaborator | A pending expiring invite exists, a copyable link is available, and no owner-wide data is exposed. | `/owner/requests/[id]`, `/owner/account` | `invite_created`, notification log |
| Owner | Recover pending invite issues | Owner can resend, copy, or cancel a pending invite. | `/owner/account` | `invite_resent`, `invite_canceled`, notification log |
| Owner | Revoke accepted access | Accepted vendor/collaborator access can be removed from the request. | `/owner/account` | `shared_access_removed` |
| Owner | Compare and decide on bids | Owner can review vendor/private quotes, approve one, decline one, and copy approved cost into the request. | `/owner/requests/[id]` | `vendor_bid_submitted`, `vendor_bid_updated`, `quote_approved`, `quote_declined` |
| Owner | Manage phased work | Owner can create tasks, track status/cost, and accept completed task rows. | `/owner/requests/[id]` | `request_task_created`, `request_task_status_changed`, `request_task_cost_updated`, `request_task_accepted`, `request_task_deleted` |
| Owner | Review closeout | Owner can approve vendor handoff or request changes with notes. | `/owner/requests/[id]` | `closeout_approved`, `closeout_changes_requested`, generated billing record |
| Owner | Preserve maintenance history | Proof packet, decision log, comments, billing records, documents, and backup export are available. | `/owner/requests/[id]`, `/owner/vault`, `/owner/backup` | decision log, comments, billing rows, vault rows |
| Vendor | Enter from invite without friction | A valid invite auto-claims after login and lands the vendor in the scoped workspace. | `/accept-invite`, `/vendor` | `invite_accepted` |
| Vendor | Understand assigned work | Vendor sees only assigned requests and the next action per job. | `/vendor` | request assignment, comments, work queue state |
| Vendor | Submit/update bid | Vendor can add amount, availability, and scope notes without seeing competitor pricing. | `/vendor` | `vendor_bid_submitted`, `vendor_bid_updated`, notification log |
| Vendor | Record work events | Vendor can start, pause, resume, and stop work with notes/proof where required. | `/vendor` | `work_session_event`, status updates, proof rows |
| Vendor | Complete task scope | Vendor can update assigned task progress and see owner acceptance gaps. | `/vendor` | task status events |
| Vendor | Submit closeout | Vendor submits completion notes, final amount, materials/receipt context, and proof for owner review. | `/vendor` | `closeout_submitted`, notification log |
| Collaborator | Enter from invite without friction | A valid invite auto-claims after login and lands the collaborator in the scoped workspace. | `/accept-invite`, `/collaborator` | `invite_accepted` |
| Collaborator | See only shared requests | Collaborator sees only requests shared with their account. | `/collaborator` | request collaborator assignment |
| Collaborator | Add helpful updates | Collaborator can add context back to the shared request thread. | `/collaborator` | comments |

## Event Catalog

| Event | Actor | Why It Exists | Completed? | Verify In |
|---|---|---|---|---|
| `request_created` | Owner | Starts the repair's audit trail automatically when the owner creates a record. | Yes | Decision Log |
| `invite_created` | Owner | Shows that a scoped vendor/collaborator handoff was opened. | Yes | Decision Log, Account invite activity |
| `invite_resent` | Owner | Shows recovery when email is unavailable or a recipient needs a fresh link. | Yes | Decision Log, Account invite activity |
| `invite_canceled` | Owner | Shows the owner closed a pending access path before acceptance. | Yes | Decision Log, Account invite activity |
| `invite_accepted` | Vendor/Collaborator | Shows the invited user claimed scoped access. | Yes | Decision Log, role workspace |
| `shared_access_removed` | Owner | Shows accepted request access was revoked. | Yes | Decision Log, Account active access |
| `status_changed` | Owner/Vendor | Shows lifecycle movement across Draft, Needs Quote, Scheduled, In Progress, Needs Review, Complete, etc. | Yes | Decision Log, request cards |
| `completion_waived` | Owner/Vendor | Explains why completion happened without full proof requirements. | Yes | Decision Log |
| `vendor_bid_submitted` | Vendor | Preserves vendor-submitted pricing and scope. | Yes | Decision Log, Quote Workspace |
| `vendor_bid_updated` | Vendor | Preserves revised vendor pricing and scope. | Yes | Decision Log, Quote Workspace |
| `quote_approved` | Owner | Records the owner's bid decision and cost handoff. | Yes | Decision Log, Quote Workspace |
| `quote_declined` | Owner | Records the owner's rejected quote decision. | Yes | Decision Log, Quote Workspace |
| `work_session_event` | Vendor | Preserves start/pause/resume/stop activity with task/proof context. | Yes | Decision Log, Work Timeline |
| `request_task_created` | Owner | Records scope creation for phased work. | Yes | Decision Log, Project Tasks |
| `request_task_status_changed` | Owner/Vendor | Records task progress movement. | Yes | Decision Log, Project Tasks |
| `request_task_cost_updated` | Owner | Records task-level cost edits. | Yes | Decision Log, Project Tasks |
| `request_task_accepted` | Owner | Records owner acceptance of completed task work. | Yes | Decision Log, Project Tasks |
| `request_task_deleted` | Owner | Records scope removal. | Yes | Decision Log |
| `closeout_submitted` | Vendor | Starts owner review with completion details. | Yes | Decision Log, Closeout |
| `closeout_approved` | Owner | Records owner approval and creates billing history. | Yes | Decision Log, Billing |
| `closeout_changes_requested` | Owner | Keeps vendor revision requests explicit. | Yes | Decision Log, Closeout |
| `billing_record_updated` | Owner | Tracks paid/disputed/recorded billing state without processing payment. | Yes | Decision Log, Billing |

Rows that are not event-log entries but still matter:

- Request photos: proof rows with type, uploader, URL, and Blob path.
- Comments: shared updates between owner, assigned vendor, and collaborator.
- Notification log: delivery/log-only proof for invite, status, bid, closeout,
  and reminder attempts.
- Vault documents: owner-only long-term documents.
- Reminders: recurring care schedule and completion cadence.

## Loop Test Matrix

| Loop | Natural Test | Pass Criteria | Current State |
|---|---|---|---|
| First owner setup | Sign up, land in onboarding, create property, create request, upload proof, land on detail. | User never needs to leave the guided path; request has `request_created`; proof appears. | Covered by `npm run ux:owner-flow` |
| Owner to vendor invite | Owner invites vendor, copies link if needed, vendor opens invite and signs in. | Valid invite auto-claims, vendor lands in `/vendor?accepted=1`, owner sees active access, `invite_accepted` logs. | Covered by `npm run ux:invite` |
| Owner to collaborator invite | Owner invites collaborator, collaborator opens invite and signs in. | Valid invite auto-claims, collaborator lands in `/collaborator?accepted=1`, only shared request appears. | Covered by `npm run ux:invite` |
| Vendor bid loop | Owner sets Needs Quote, vendor submits bid, owner approves/declines. | Vendor is routed to bid action; owner sees private bid review; decision log captures both sides. | Covered by `npm run ux:full-loop` plus unit/helper smoke surfaces |
| Vendor work loop | Owner schedules work, vendor starts/stops with proof and updates tasks. | Work timeline and decision log explain progress; missing proof blocks completion unless waived. | Covered by `npm run ux:full-loop` plus helper smoke surfaces |
| Closeout loop | Vendor submits closeout, owner approves or requests changes. | Owner sees pending review; approval creates billing record; changes route vendor back to revision. | Covered by `npm run ux:full-loop` plus unit/helper smoke surfaces |
| Access removal loop | Owner removes accepted vendor/collaborator access. | Removed user loses request visibility; decision log names removed email. | Covered by QA checklist; manual smoke recommended |
| Billing recordkeeping loop | Owner marks recorded billing paid/disputed outside TurnFlow. | Billing state is history only, not payment processing; event is logged. | Covered by `npm run ux:full-loop` plus unit tests |

## Open Coverage Gaps

- Extend `npm run ux:full-loop` to cover the changes-requested closeout branch
  after the happy path stays stable.
- Decide whether photo upload should write a lightweight decision-log event, or
  whether the photo row itself is enough proof. Current state: photo rows are
  the source of truth, and the decision log avoids noisy entries for every file.
- Consider a read-only admin/demo event explorer later, after the role loops
  feel natural. The product should not rely on a panel to explain the workflow.
