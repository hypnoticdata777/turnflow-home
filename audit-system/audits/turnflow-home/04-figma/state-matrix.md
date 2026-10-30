# TurnFlow Home: key screen × UI state matrix (@ b45b1ac)

Definitions:
- **Idle** = empty / first-run / zero results.
- **Loading** = feedback while the *route* loads (`loading.tsx` or a Suspense fallback around page content).
- **Populated** = data rendered.
- **Error** = an *unexpected* failure (DB down, thrown action error), caught by `error.tsx` / `global-error.tsx`.

Expected domain errors (invalid invite, validation messages) and action-level pending states are listed separately in the last two columns, because they're built well.

Repo-wide facts behind the Loading and Error columns:
- `missing:app/**/loading.tsx` and `missing:app/**/error.tsx`, `missing:app/global-error.tsx`, `missing:app/not-found.tsx`. No route segment has them.
- The only Suspense fallback wraps the owner **sidebar**, not page content: `app/owner/layout.tsx:14-20`.
- `notFound()` is called once (`app/owner/requests/[id]/page.tsx:45`) and renders Next's default 404.

| Screen (route) | MVP story | Idle | Loading | Populated | Error (unexpected) | Domain errors (built) | Action pending (built) |
|---|---|---|---|---|---|---|---|
| Sign up `/signup` | Join | n/a (form) | n/a (form) | n/a | **missing** | built @ app/signup/page.tsx:131-133 | built @ app/signup/page.tsx:9 |
| Log in `/login` | Join | n/a (form) | n/a (form) | n/a | **missing** | built @ app/login/page.tsx:87-89 | built @ app/login/page.tsx:18 |
| Accept invite `/accept-invite` | Share | n/a | **missing** | built @ app/accept-invite/page.tsx | **missing** | built @ app/accept-invite/page.tsx:26, :49-51, :81, :85, :92 | built @ components/AcceptInviteButton.tsx:17, :49 |
| Onboarding `/owner/onboarding` | Set up my home | built (0/N progress) @ app/owner/onboarding/page.tsx:63-84 | **missing** | built @ app/owner/onboarding/page.tsx | **missing** | n/a | n/a |
| Dashboard `/owner/dashboard` | Capture → triage | built @ app/owner/dashboard/page.tsx:436-447 (first request), :448-459 (empty filter) | **missing** | built @ app/owner/dashboard/page.tsx:462 | **missing** | n/a | n/a |
| New request `/owner/requests/new` | Capture | built (no property) @ components/NewRequestForm.tsx:200 | **missing** | n/a (form) | **missing** | built (inline `{error}`) @ lib/actions/requests.ts:52-66 | built @ components/NewRequestForm.tsx:79 |
| Request detail `/owner/requests/[id]` | Share, Work, Close out | partial: no photos @ components/RequestDetailView.tsx:657 | **missing** | built @ components/RequestDetailView.tsx | **missing** (only default 404 @ app/owner/requests/[id]/page.tsx:45) | built per panel (quotes, closeout) | built @ components/QuoteWorkspace.tsx:137-154, components/CloseoutSubmissionPanel.tsx:260-322, components/RequestDetailView.tsx:237, :499 |
| Properties `/owner/properties` | Set up my home | built @ app/owner/properties/page.tsx:81 | **missing** | built | **missing** | built @ components/PropertyForm.tsx:8 | built @ components/DeletePropertyButton.tsx:7 |
| Vault `/owner/vault` | Keep history | built @ app/owner/vault/page.tsx:86, components/VaultManager.tsx:139-141 | **missing** | built | **missing** | built | n/a |
| Calendar `/owner/calendar` | Keep history | built @ app/owner/calendar/page.tsx:15, components/ReminderManager.tsx:214-215 | **missing** | built | **missing** | built | n/a |
| Account & sharing `/owner/account` | Share | built @ app/owner/account/page.tsx:509, :611 | **missing** | built | **missing** | built @ components/SharedAccessControls.tsx:13, components/PendingInviteControls.tsx:8-12 | built (same lines) |
| Notifications `/owner/notifications` | Keep history | built @ app/owner/notifications/page.tsx:110-112 | **missing** | built | **missing** | n/a | n/a |
| Backup `/owner/backup` | Keep history | n/a (actions page) | **missing** | built | **missing** | built (restore errors list) @ components/BackupManager.tsx:194 | built |
| Vendor portal `/vendor` | Quote, Work, Close out | built @ components/VendorPortal.tsx:405-406 | **missing** | built @ components/VendorPortal.tsx | **missing** | built (gated actions, per docs) @ docs/ENDPOINT_EXPERIENCE_MAP.md:68 | built @ components/VendorPortal.tsx:144, :555 |
| Collaborator portal `/collaborator` | Share (helper) | built @ app/collaborator/page.tsx:105-110 | **missing** | built | **missing** | n/a | n/a |

## Totals

| State | Built | Missing | n/a |
|---|---|---|---|
| Idle | 11 (1 partial) | 0 | 4 |
| Loading (route) | 0 | 13 | 2 |
| Populated | 12 | 0 | 3 |
| Error (unexpected) | 0 | 15 | 0 |

## What the user sees today when something unexpected fails (inferred from Next.js defaults)

- **A server component throws** (for example, a Neon timeout while loading the dashboard): with no `error.tsx` anywhere, Next.js renders its built-in error screen. In production that's a generic message with no TurnFlow chrome, no "Try again", and no way back except the browser.
- **A server action throws** (21 `throw new Error` sites, such as `approveQuoteAction` when the quote isn't found, `lib/actions/quotes.ts:88-90`): the client component's `await` rejects. Without a local `try/catch` or an error boundary, the same generic screen appears.
- **Slow navigation** (Neon cold start): the previous page stays on screen with no progress feedback until the server responds, because no `loading.tsx` exists.
