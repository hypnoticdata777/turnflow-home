# Data Model

> Chain step: **Inputs/Outputs + Constraints**, i.e. where the records live.
> Source of truth: `lib/db/schema.ts` (Drizzle) and the SQL migrations in
> `drizzle/` (latest: `0012_clumsy_ozymandias.sql`, which adds `auth_attempts`).

## Entity relationship diagram (core)

```mermaid
erDiagram
  USERS ||--o{ WORKSPACES : owns
  WORKSPACES ||--o{ WORKSPACE_MEMBERSHIPS : has
  USERS ||--o{ WORKSPACE_MEMBERSHIPS : "member of"
  WORKSPACES ||--|| BILLING_ACCOUNTS : "plan state"
  USERS ||--o{ PROPERTIES : owns
  PROPERTIES ||--o{ REQUESTS : "has repairs"
  USERS ||--o{ REQUESTS : "owner / assigned vendor / collaborator"
  REQUESTS ||--o{ INVITES : "pending invites"
  REQUESTS ||--o{ REQUEST_PHOTOS : proof
  REQUESTS ||--o{ QUOTES : prices
  REQUESTS ||--o{ DECISION_LOG : "audit trail"
  REQUESTS ||--o{ COMMENTS : updates
  REQUESTS ||--o{ REQUEST_TASKS : scope
  REQUESTS ||--o{ WORK_SESSIONS : visits
  REQUESTS ||--o{ CLOSEOUT_SUBMISSIONS : handoff
  REQUESTS ||--o{ BILLING_RECORDS : owed
  CLOSEOUT_SUBMISSIONS ||--o| BILLING_RECORDS : generates
  WORK_SESSIONS }o--o| REQUEST_PHOTOS : "proof photo"
  WORK_SESSIONS }o--o| REQUEST_TASKS : "for task"
  PROPERTIES ||--o{ VAULT_DOCUMENTS : documents
  PROPERTIES ||--o{ REMINDERS : "recurring care"
  USERS ||--o{ NOTIFICATION_LOG : "email attempts"
  USERS ||--o| VENDOR_PROFILES : "vendor profile"
  USERS ||--o{ CONTACTS : "address book"

  REQUESTS {
    uuid id PK
    uuid owner_id FK
    uuid property_id FK
    uuid assigned_vendor_id FK
    uuid collaborator_id FK
    enum status
    numeric estimated_cost
    numeric quoted_cost
    numeric final_cost
  }
  REQUEST_PHOTOS {
    uuid id PK
    uuid request_id FK
    enum type "before after receipt other"
    text url "now /api/files?path=..."
    text blob_path "validated server-side"
  }
  DECISION_LOG {
    uuid id PK
    uuid request_id FK "ON DELETE CASCADE (F8)"
    uuid actor_id FK
    varchar action
    jsonb details
  }
  AUTH_ATTEMPTS {
    uuid id PK
    varchar key "login:email:x, login:ip:y, signup:ip:z"
    timestamp created_at
  }
```

`AUTH_ATTEMPTS` stands alone on purpose. It has no foreign keys, so a
counter can exist for an email that has no account.

## Delete behavior (why F8 matters)

| When this is deleted… | …these go with it (`ON DELETE CASCADE`) |
|---|---|
| a user | their workspaces, properties, requests, invites, contacts, notification log, vendor profile |
| a property | its requests, vault documents, reminders |
| a request | its photos, quotes, **decision log**, comments, tasks, work sessions, closeouts, billing records |

```mermaid
flowchart LR
  DEL[Owner deletes a request] --> CAS["Cascade removes photos, quotes,<br/>tasks, closeouts, billing,<br/>AND the decision log"]:::bad
  CAS --> LOSS["The 'permanent history' promise is broken"]:::bad
  FIX["Proposed (P2): archive instead of delete;<br/>decision_log insert-only at DB level"] -.-> DEL
  classDef bad fill:#fdecec,stroke:#c53030,color:#742a2a
```

## Status enums

| Enum | Values |
|---|---|
| request status | Draft, Needs Quote, Waiting, Scheduled, In Progress, Needs Review, Complete, Archived ([policy](../04-algorithms/04-request-status-lifecycle.md)) |
| photo type | before, after, receipt, other (upload folders add `quote`) |
| quote status | pending, approved, declined |
| task status | todo, in_progress, blocked, done (+ `acceptedAt`) |
| closeout status | pending, approved, changes_requested |
| billing record status | recorded, paid, disputed, void |
| invite status | pending, accepted (canceled invites are deleted) |

**Previous:** [Constraints](constraints.md) · **Next:** [Algorithms →](../04-algorithms/README.md)
