# System Map

> Sequence: **the big picture**, a zoomable map of the whole product.
> Level 0 is one page long. Each lane is zoomed in on at Level 1. Level 2 focuses on the path a single click takes through the code. Each flow document in
> [`04-algorithms/`](../04-algorithms/README.md) is given a name for its location on this map.
>
> **Finding pins** (`F1`–`F12`) mark where each issue from the
> [2026-09-28 review](../review/2026-09-28-repo-review.md) lives. Status for
> each one is in the [findings register](../07-refinement/findings-and-roadmap.md).

## Legend

| Mark | Meaning |
|---|---|
| `[A]`…`[K]` | Map node IDs, used by every flow doc |
| **F#** fixed | Fixed in the 2026-09-28 P0 change (commit on `main`) |
| **F#** open | Still open, planned in the roadmap |
| THOUGHT | Why a box or decision exists |

---

## Level 0 — the whole product on one page

**In one sentence:** a homeowner opens a repair record, shares just that record
with a vendor or helper, the work and money get proven step by step, and the
finished record becomes permanent property history.

```mermaid
flowchart TD
  subgraph People
    O([Owner / homeowner])
    V([Vendor])
    C([Collaborator / helper])
  end

  A["[A] Sign in and accounts<br/>signup, login, roles<br/>F6 fixed, F4 open"]
  B["[B] Request intake<br/>property, issue, safety checklist"]
  Cf["[C] Files and proof<br/>photos, receipts, vault docs<br/>F1 fixed, F2 fixed"]
  D["[D] Sharing<br/>invite one request, accept, revoke<br/>F4 open"]
  E["[E] Quotes and bids<br/>compare, approve, decline<br/>F11 open"]
  F["[F] Status lifecycle<br/>Draft to Complete<br/>F3 fixed"]
  G["[G] Work and tasks<br/>work sessions, task checklist"]
  H["[H] Closeout and billing<br/>vendor handoff, owner approval<br/>F5 open"]
  I["[I] History<br/>decision log, PDF, backup<br/>F8 open"]
  J["[J] Automation<br/>email, reminder digest cron"]
  K["[K] Operations<br/>health, poc:ready, demo reset<br/>F7 fixed"]

  O --> A --> B --> F
  B --> Cf
  B --> D
  D --> V
  D --> C
  V --> E --> F
  V --> G --> Cf
  G --> H --> F
  H --> I
  F --> I
  F --> J
  C --> I
  K -.watches.-> A
  K -.resets.-> I

  T1["THOUGHT: the owner is the only authority.<br/>Helpers see one request, never the account."]:::thought
  D -.- T1

  classDef thought fill:#fff8e6,stroke:#b7791f,stroke-dasharray:4 3,color:#5a3e00
```

**How to read it:** follow the arrows left to right. Every box is one core
flow with its own design doc:

| Node | Flow doc |
|---|---|
| `[A]` Sign in and accounts | [01 Auth and rate limiting](../04-algorithms/01-auth-and-rate-limiting.md) |
| `[C]` Files and proof | [02 File upload and access](../04-algorithms/02-file-upload-and-access.md) |
| `[B]` Request intake | [03 Request intake](../04-algorithms/03-request-intake.md) |
| `[F]` Status lifecycle | [04 Request status lifecycle](../04-algorithms/04-request-status-lifecycle.md) |
| `[D]` Sharing | [05 Invite and access](../04-algorithms/05-invite-and-access.md) |
| `[E]` Quotes and bids | [06 Bid and quote decision](../04-algorithms/06-bid-and-quote-decision.md) |
| `[G]` Work and tasks | [07 Work sessions and tasks](../04-algorithms/07-work-sessions-and-tasks.md) |
| `[H]` Closeout and billing | [08 Closeout and billing](../04-algorithms/08-closeout-and-billing.md) |
| `[K]` Operations, demo | [09 Investor demo reset](../04-algorithms/09-investor-demo-reset.md) |
| `[J]` Automation | [10 Reminder digest and notifications](../04-algorithms/10-reminders-and-notifications.md) |
| `[I]` History | [11 Backup, restore and exports](../04-algorithms/11-backup-restore-and-exports.md) |
| all | [12 Guidance layer](../04-algorithms/12-guidance-layer.md) (the "what to do next" helpers) |

---

## Level 1 — the three lanes

### 1a. Owner lane

```mermaid
flowchart TD
  S[Sign up] --> OB[Onboarding checklist]
  OB --> P[Add property]
  P --> R["Create request<br/>[B]"]
  R --> UP["Upload before photos<br/>[C] F1 F2"]
  R --> INV["Invite vendor or helper<br/>[D]"]
  INV --> WAIT{Vendor accepted?}
  WAIT -- no --> RES[Resend, copy link, or cancel]
  RES --> WAIT
  WAIT -- yes --> Q["Review bids and quotes<br/>[E]"]
  Q --> AP{Approve a quote?}
  AP -- decline --> Q
  AP -- approve --> TASKS["Plan tasks, watch work<br/>[G]"]
  TASKS --> CR{"Closeout submitted?<br/>[H]"}
  CR -- request changes --> TASKS
  CR -- approve --> DONE["Complete, billing record<br/>[F] [H]"]
  DONE --> HIST["History: PDF, CSV, backup, vault<br/>[I] F8"]
  P --> REM["Recurring reminders<br/>[J]"]

  T["THOUGHT: every arrow that changes state<br/>also writes a decision-log row"]:::thought
  DONE -.- T
  classDef thought fill:#fff8e6,stroke:#b7791f,stroke-dasharray:4 3,color:#5a3e00
```

### 1b. Vendor lane

```mermaid
flowchart TD
  EM[Invite email or copied link] --> ACC{"Has a vendor account?<br/>F4 open"}
  ACC -- no --> DEAD["Dead end today:<br/>no vendor signup"]:::bad
  ACC -- yes --> LOGIN["Log in<br/>[A] F6 fixed"]
  LOGIN --> CLAIM["Invite auto-claims<br/>[D]"]
  CLAIM --> QUEUE[Vendor work queue]
  QUEUE --> BID["Submit or update bid<br/>[E]"]
  BID --> APPR{Owner approved?}
  APPR -- not yet --> QUEUE
  APPR -- yes --> START["Start work, before-photo proof<br/>[G] [C]"]
  START --> PAUSE[Pause or resume]
  PAUSE --> STOP["Stop work, after-photo proof"]
  STOP --> CLOSE["Submit closeout<br/>[H]"]
  CLOSE --> REV{Owner decision}
  REV -- changes requested --> CLOSE
  REV -- approved --> PAID[Billing record visible]
  QUEUE --> ST["Change status: working states only<br/>[F] F3 fixed"]

  classDef bad fill:#fdecec,stroke:#c53030,color:#742a2a
```

### 1c. Collaborator lane

```mermaid
flowchart TD
  EM[Invite link] --> LOGIN["Log in<br/>[A]"] --> CLAIM["Invite auto-claims<br/>[D]"]
  CLAIM --> VIEW[See only the shared request]
  VIEW --> CMT[Add updates to the comment thread]
  VIEW --> FILES["Open request photos<br/>via /api/files [C]"]
  T["THOUGHT: a collaborator can read, not decide.<br/>No status, quote, or closeout controls."]:::thought
  VIEW -.- T
  classDef thought fill:#fff8e6,stroke:#b7791f,stroke-dasharray:4 3,color:#5a3e00
```

### 1d. Request lifecycle (all lanes meet here)

The detailed transition table is in
[04 Request status lifecycle](../04-algorithms/04-request-status-lifecycle.md).

```mermaid
stateDiagram-v2
  [*] --> Draft: owner creates
  Draft --> NeedsQuote: owner
  NeedsQuote --> Scheduled: owner or vendor
  Scheduled --> InProgress: vendor starts work
  InProgress --> Waiting: owner or vendor
  Waiting --> InProgress: owner or vendor
  InProgress --> NeedsReview: vendor stops or submits closeout
  NeedsReview --> InProgress: owner requests changes
  NeedsReview --> Complete: owner approves (proof or waiver)
  Complete --> Archived: owner
  Complete --> InProgress: owner reopens
  Archived --> [*]
  NeedsQuote: Needs Quote
  InProgress: In Progress
  NeedsReview: Needs Review
```

---

## Level 2 — how one click travels through the code

Every write in the app follows this same path. This is where the security
boundary lives.

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser (components/*)
  participant PX as proxy.ts (fast redirect)
  participant SA as Server Action (lib/actions/*)
  participant DAL as lib/auth/dal.ts
  participant POL as Pure rules (lib/*.ts)
  participant DB as Postgres (Neon)
  participant BL as Vercel Blob
  participant EM as Resend email

  B->>PX: navigate to /owner/...
  PX-->>B: redirect if not signed in or wrong role
  B->>SA: call action(requestId, form data)
  SA->>DAL: requireRole / requireAnyRole
  DAL-->>SA: session (user id, role) or redirect
  SA->>DB: load the record
  SA->>SA: ownership check (ownerId / assignedVendorId)
  SA->>POL: decide (status policy, path validation, readiness)
  POL-->>SA: ok or error
  SA->>DB: write row(s) and a decision-log row (F5: not atomic)
  SA->>BL: del() only for record-scoped paths (F1 fixed)
  SA->>EM: sendNotification, always logged
  SA-->>B: result, then revalidatePath
```

### Level 2b — file upload and read path

```mermaid
flowchart TD
  subgraph Browser
    PICK[Pick file] --> DOWN[Downscale if over 3 MB]
    DOWN --> POST["POST /api/blob-upload<br/>pathname + file"]
  end
  subgraph Server
    POST --> AUTH{Signed in?}
    AUTH -- no --> R403[403]
    AUTH -- yes --> PATH{"Path shape and uid<br/>match the user?"}
    PATH -- no --> R403
    PATH -- yes --> OWN{"Owns the request or property,<br/>or is the assigned vendor?"}
    OWN -- no --> R403
    OWN -- yes --> PUT["put() with BLOB_ACCESS<br/>+ random suffix"]
    PUT --> RET["return /api/files?path=..."]
    RET --> REC["record action re-validates path,<br/>derives url (F1 fixed)"]
    READ["GET /api/files?path=..."] --> CAN{"canReadUpload()"}
    CAN -- no --> R404[404]
    CAN -- yes --> STREAM[stream from Blob with server token]
  end
  T["THOUGHT: the browser never holds a raw Blob URL<br/>for new uploads, so revoking access really revokes it (F2)"]:::thought
  STREAM -.- T
  classDef thought fill:#fff8e6,stroke:#b7791f,stroke-dasharray:4 3,color:#5a3e00
```

---

## Where each finding lives

| ID | Finding | Map node | Status | Flow doc |
|---|---|---|---|---|
| F1 | Any user could delete other people's files via a client-supplied blob path | `[C]` | fixed | [02](../04-algorithms/02-file-upload-and-access.md) |
| F2 | All uploads were public, forever | `[C]` | fixed in code; ops step to switch store | [02](../04-algorithms/02-file-upload-and-access.md) |
| F3 | Vendors could complete, waive, archive or reopen | `[F]` | fixed | [04](../04-algorithms/04-request-status-lifecycle.md) |
| F4 | Invited vendors and helpers cannot create an account | `[A]` `[D]` | open (P1) | [05](../04-algorithms/05-invite-and-access.md) |
| F5 | Multi-step writes are not atomic | `[H]` `[D]` `[E]` | open (P2) | [08](../04-algorithms/08-closeout-and-billing.md) |
| F6 | No login/signup limits; account existence could be timed | `[A]` | fixed (reset and verification still open) | [01](../04-algorithms/01-auth-and-rate-limiting.md) |
| F7 | Demo password published in README | `[K]` | fixed; ops step to rotate | [09](../04-algorithms/09-investor-demo-reset.md) |
| F8 | Decision log deleted along with its request | `[I]` | open (P2) | [11](../04-algorithms/11-backup-restore-and-exports.md) |
| F9 | Tests cover guidance helpers, not the server boundary | all | partly fixed (pure P0 rules tested) | [Test strategy](../06-testing/test-strategy.md) |
| F10 | Upload type allowlist skipped empty types | `[C]` | fixed | [02](../04-algorithms/02-file-upload-and-access.md) |
| F11 | Several quotes can be approved at once | `[E]` | open | [06](../04-algorithms/06-bid-and-quote-decision.md) |
| F12 | Smaller items: stale JWT role, request edit validation, cron open without secret, repo weight | `[A]` `[B]` `[J]` | mixed | [Findings register](../07-refinement/findings-and-roadmap.md) |
