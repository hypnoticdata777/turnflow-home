# TurnFlow Home User Testing Protocol

Use this protocol to validate TurnFlow Home as a middleweight SaaS for
homeowners who self-manage maintenance and do not want a property management
company.

## Goal

Validate whether a homeowner can create a useful repair record without hand
holding:

- The owner understands why they are creating a property first.
- The owner can capture a real maintenance issue with enough context.
- The owner can attach proof, invite help, preserve documents, and set a
  reminder.
- The owner can explain what TurnFlow Home now remembers for them.

## Tester Profile

Prioritize people who have had to coordinate home repairs themselves:

- Homeowners with one primary residence.
- Small landlords with one to three units.
- Short-term rental hosts who coordinate repeat maintenance.
- Adult children helping parents track house repairs.

Avoid testers who already think in property management software terms unless
they are part of a later expert review.

## Session Format

- Length: 30 to 45 minutes.
- Device: one desktop session and at least one mobile session per round.
- Facilitation: observe first, help only after the tester is blocked.
- Recording: capture screen, time-on-task, and spoken confusion points.
- Data: use only public-safe addresses, photos, vendors, and receipts.

## Setup

1. Deploy or run the latest `main` build against a test database.
2. Confirm `/signup` creates an owner account and redirects to
   `/owner/onboarding`.
3. Keep demo vendor/collaborator accounts available for invite testing.
4. Prepare one realistic repair scenario, such as an HVAC issue, leak, broken
   appliance, or door lock problem.
5. Ask the tester to bring one fake/public-safe image or receipt if possible.

## Core Tasks

Ask the tester to complete these tasks without explaining the interface first:

1. Create a new owner account.
2. Add the home or rental property where the repair happened.
3. Log one active maintenance issue.
4. Add enough notes or access context that a helper could understand the job.
5. Attach one photo, receipt, or proof item.
6. Invite a vendor or trusted helper.
7. Record or review expected cost context.
8. Save one related document in the vault.
9. Set one recurring reminder for that property.
10. Open Account & Sharing and explain who can see the request.
11. Resend the invite, copy the fallback link, then cancel a second pending
    invite if one exists.
12. Update the Account & Sharing display name.
13. Return to the setup guide and explain what has been captured.

## Observe

Track these without coaching:

- Where the tester hesitates.
- Whether labels sound homeowner-friendly or too operational.
- Whether the property-first model makes sense.
- Whether the setup guide feels useful or like extra admin work.
- Whether the tester can distinguish requests, vault documents, and reminders.
- Whether the invite flow feels safe enough to use with a real contractor.
- Whether resend/cancel controls make pending invites feel recoverable.
- Whether the copyable invite link feels understandable when email is not
  configured or does not arrive.
- Whether Account & Sharing answers the tester's trust/privacy questions.
- Whether the owner trusts the record as evidence after the job is done.

## Success Signals

The round is working if most testers can:

- Finish signup, property, and first request in under 10 minutes.
- Understand that TurnFlow Home is a homeowner repair record, not a full PMC
  dispatch tool.
- Name at least one future repair or recurring task they would track in it.
- Explain why photos, quotes, receipts, and reminders belong together.
- Explain that vendors and collaborators are scoped to specific requests.
- Say who they would invite and what they would be comfortable sharing.

## Weak Signals

Treat these as product work, not tester failure:

- Testers cannot tell what to do after signup.
- Testers think the product is only for landlords or PMCs.
- The first request form feels too long before they trust the value.
- The vault feels disconnected from the repair workflow.
- Invites feel risky because sharing scope is unclear.
- Reminders feel hidden, optional, or unrelated to repair history.

## Interview Questions

Ask after the task flow:

- What problem did you think this product was solving?
- What would you expect to happen after inviting someone?
- What information would you not want a vendor or helper to see?
- What repair records do you wish you had from the past year?
- Would you use this for your own home, a rental, or both?
- What would make this worth paying for?
- What felt too heavy, and what felt missing?

## Notes Template

```text
Tester:
Profile:
Device:
Scenario:

Signup completed?:
Profile edited?:
Property completed?:
Request completed?:
Evidence attached?:
Helper invited?:
Vault document added?:
Reminder added?:

Top confusion:
Top value moment:
Quote or phrase:
Pricing signal:
Risk/privacy concern:
Next product fix:
```

## Decision Rule

After three to five sessions, prioritize the next build around repeated
friction, not feature wishlists. If testers complete the flow but do not feel
the record is valuable afterward, tighten the record/proof/history experience
before adding more modules.

## Product Coverage Notes

The setup guide and Account & Sharing Center now use shared readiness rules in
`lib/owner-readiness.ts`. When the user testing flow changes, update that helper
and its tests so the onboarding and account surfaces keep telling the same
story.
