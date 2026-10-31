# TurnFlow Home: PROPOSED specs for the missing states

Everything here is **PROPOSED** design work (it doesn't exist yet). Copy follows the product voice in `docs/ENDPOINT_EXPERIENCE_MAP.md:13-29`: say why you're here, what you can safely do, and what happens next.

## 1. Error state (one shared design, 3 variants)

**Frame names in Figma:** `Shell / State=Error`, `Owner / State=Error`, `Helper / State=Error`.

| Element | Spec |
|---|---|
| Chrome | Keep the role's chrome (owner sidebar from `components/OwnerSidebar.tsx`, helper shell from `components/HelperPortalShell.tsx`). The user must still be able to navigate. |
| Heading | "This page didn't load." |
| Body | "Your record is safe. Nothing was changed. This is usually a short connection problem." |
| Primary action | **Try again** (calls Next's `reset()`) |
| Secondary action | Owner: "Back to dashboard" → `/owner/dashboard`. Vendor: "Back to my jobs" → `/vendor`. Collaborator: "Back to shared requests" → `/collaborator`. |
| Diagnostics | Small muted text: "Reference: {error.digest}" so a tester can quote it (and match it in Sentry once GAP-CODE-01 is closed). |
| Never shown | Stack traces, SQL, raw error messages. |

**Global variant** (`app/global-error.tsx`, when the root layout itself fails): the same copy on a bare page with the TurnFlow wordmark only.

**Action-failure toast** (for the 21 throwing server actions until they return `{ error }`): an inline banner above the panel that was acting: "That didn't go through. Nothing was saved. Try again." It disappears on the next successful action.

## 2. Loading state (route level)

| Screen | Skeleton contents (same sizes as the Populated layout) |
|---|---|
| Owner dashboard | Status-filter pill row; 3 request cards (title bar 60%, two meta lines, a status chip block) |
| Request detail | Title + status chip; left column of 4 panel skeletons (Quotes, Tasks, Work sessions, Closeout); right column for decision log (6 lines) |
| Vendor portal | Work-queue snapshot strip (4 counters); 2 job cards with a next-action panel block |
| Collaborator portal | 1 shared-request card with a readiness checklist (5 lines) |
| Properties / Vault / Calendar / Account / Notifications | Page heading + 3 row skeletons |

Rules: gray blocks with `animate-pulse`, `aria-busy="true"` on the container, no spinner-only screens, and keep the chrome visible (put `loading.tsx` inside `app/owner/`, `app/vendor/`, `app/collaborator/` so layouts stay mounted).

## 3. Idle refinement (only one partial cell)

Request detail with zero photos (`components/RequestDetailView.tsx:657`): replace the plain empty text with "No proof yet. Add a **before** photo now so the vendor sees what you saw," plus an **Add photo** button that opens the existing upload control.

## Figma build checklist for these specs

1. Component set `Page state` with property `State = Idle | Loading | Populated | Error` and property `Role = Owner | Vendor | Collaborator`.
2. One frame per key screen × state for the screens in `state-matrix.md` whose Loading or Error cell is "missing" (13 Loading + 15 Error). Reuse the shared Error and Loading components instead of drawing 28 unique frames.
3. Annotate each frame with the file that will implement it (`app/owner/loading.tsx`, `app/owner/error.tsx`, `app/vendor/error.tsx`, `app/collaborator/error.tsx`, `app/global-error.tsx`).
