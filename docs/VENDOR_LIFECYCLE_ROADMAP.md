# Vendor Lifecycle Roadmap

TurnFlow Home should treat vendors as a serious user group, not just invited
photo uploaders. The long-term vendor experience should trace a job from
matching and notification through bid, approval, work, closeout, billing, and
saved homeowner history.

## Current Foundation

The current app supports assigned vendor accounts:

- Owners invite or assign a vendor to a specific request.
- Vendors only see the requests shared with their account.
- Vendors can review property/job context, change status, post updates, and
  upload before, after, receipt, or other proof photos.
- Vendors can maintain a matching profile with business name, trade categories,
  service area, availability, notification preference, and license/insurance
  notes.
- Owners manage quotes privately so vendor pricing is not leaked.
- Owners can review assigned-vendor fit against the request category, service
  area, availability, notification preference, and credential notes.
- Assigned vendors can submit a private bid with amount, availability, and scope
  notes for owner review in the quote workspace.
- Owners receive logged notification attempts for vendor bid submissions and
  updates, and the quote workspace explains approve/decline impact before a
  decision is made.
- Owners can compare active quote options by count, lowest price, spread,
  vendor-submitted ratio, and per-quote price position.
- Vendors receive logged notification attempts when an owner approves or
  declines their submitted bid, keeping the bid loop visible on both sides.
- Vendors can record start, pause, resume, and stop work-session events with
  notes, task/area labels, and required start/stop proof photos; owners can see
  the resulting work timeline on the request record.
- Owners can create structured project tasks with expected proof types, and
  vendors can update each task while tying work-session proof to the selected
  task.
- Owners can record estimated and final cost per project task, then accept
  done tasks for closeout so billing review is tied to scope instead of one
  loose request total.
- Vendors can submit a closeout bundle with completion notes, materials/receipt
  notes, final amount, readiness checks, owner notification, and decision-log
  history.
- The vendor portal now shows a per-request lifecycle tracker:
  opportunity received, bid/price context, owner approval, scheduled/ready,
  work in progress, closeout proof, and billing record.

This is a good POC-safe foundation because it makes the assigned-job workflow
traceable without opening competitive bidding or payment risks too early.

## Target Lifecycle

The mature vendor workflow should support these states:

1. Opportunity available
   - Vendor receives a job notification based on trade, service area,
     availability, urgency, and owner preferences.
   - Vendor can review limited scope details before bidding.

2. Bid submitted
   - Vendor submits amount, notes, availability window, terms, attachments, and
     optional expiration date.
   - Owner sees vendor bids in a private comparison workspace.

3. Owner approval
   - Owner approves one bid or asks follow-up questions.
   - Declined vendors see a clear outcome without seeing competitors' prices.

4. Project scheduled
   - Approved vendor confirms date, arrival window, access needs, and contact
     preference.
   - Owner gets a clean pre-work checklist.

5. Work started and paused/stopped
   - Vendor records start, pause, resume, and stop events.
   - Each event can include notes, photos, and reason codes.

6. Closeout submitted
   - Vendor submits after photos, receipts, materials, completion notes, and
     final amount.
   - Owner reviews proof before marking the request complete.

7. Billing record saved
   - Invoice/final cost is preserved in the homeowner's maintenance history.
   - Future payments or subscriptions can connect here later.

## Data Model Needed Later

The current schema supports assigned-job tracking and a first vendor profile.
True bidding and billing will need additional tables or expanded fields:

- Vendor profiles: active status, public-facing service description, richer
  credentials, and optional approval/verification state.
- Job opportunities: request, trade match, visibility window, invite source,
  and opportunity status.
- Vendor bids: vendor ID, amount, notes, available dates, attachments,
  expiration, and owner decision state.
- Work sessions: start, pause, resume, stop, timestamps, notes, task/area label,
  proof photo link, and actor. Done for assigned vendors.
- Project tasks: reusable task checklist, per-task status, proof requirements,
  work-session task links, estimated/final costs, and owner acceptance. Done for
  assigned requests.
- Closeout submissions: proof bundle, materials, receipts, invoice amount, and
  owner review decision. First assigned-vendor closeout submission is done;
  richer invoice/payment state is still future work.
- Billing records: final amount, invoice reference, payment status, and export
  metadata.

## Product Guardrails

- Keep homeowner control central. Owners approve access, bids, work completion,
  and final records.
- Do not expose one vendor's pricing to another vendor.
- Keep early vendor notifications opt-in and trade-specific.
- Make every major transition visible in the request history.
- Delay payments until the workflow is tested manually with real users.

## Suggested Build Order

1. Add vendor lifecycle tracking for assigned jobs. Done.
2. Add vendor profiles with trades, service areas, and availability. Done.
3. Add owner-visible assigned-vendor fit cues. Done.
4. Add vendor bid submission for assigned quote requests. Done.
5. Add owner bid review guidance. Done.
6. Add vendor bid decision notifications after owner approval/decline. Done.
7. Add owner bid comparison metrics for active quotes. Done.
8. Add work session events for start, pause, resume, stop, and notes. Done.
9. Tie start/stop work-session events to required proof photos and task labels.
   Done.
10. Add structured project task checklist with per-task proof and timing. Done.
11. Add per-task estimate/final cost fields and owner acceptance before
    closeout. Done.
12. Add open opportunity notifications before assignment.
13. Add owner bid comparison and approval tied to assigned vendor selection.
14. Add closeout submission and owner review before billing record
    finalization. Done.
15. Add richer invoice/payment state after owner/vendor closeout behavior is
    tested.
