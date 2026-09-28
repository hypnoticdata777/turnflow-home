// TurnFlow Home — Drizzle schema (Postgres/Neon)
//
// One table per collection from the original Firebase build. See
// docs/DEVLOG.md (in the sibling turnflow-mvp-main/ repo) for the
// Firestore field names this maps from. Relations use real foreign keys
// instead of Firestore security-rule-enforced references — every
// authorization check that used to live in firestore.rules now lives in
// lib/actions/*.ts (Server Actions), checked against these FKs.

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  numeric,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "vendor",
  "collaborator",
]);
export const requestStatusEnum = pgEnum("request_status", [
  "Draft",
  "Needs Quote",
  "Waiting",
  "Scheduled",
  "In Progress",
  "Needs Review",
  "Complete",
  "Archived",
]);
export const photoTypeEnum = pgEnum("photo_type", [
  "before",
  "after",
  "receipt",
  "other",
]);
export const quoteStatusEnum = pgEnum("quote_status", [
  "pending",
  "approved",
  "declined",
]);
export const inviteRoleEnum = pgEnum("invite_role", ["vendor", "collaborator"]);
export const inviteStatusEnum = pgEnum("invite_status", ["pending", "accepted"]);
export const vaultCategoryEnum = pgEnum("vault_category", [
  "Receipt",
  "Warranty",
  "Manual",
  "Invoice",
  "Inspection Report",
  "Other",
]);
export const notificationStatusEnum = pgEnum("notification_status", [
  "sent",
  "failed",
]);
export const workSessionEventEnum = pgEnum("work_session_event", [
  "started",
  "paused",
  "resumed",
  "stopped",
]);
export const requestTaskStatusEnum = pgEnum("request_task_status", [
  "todo",
  "in_progress",
  "blocked",
  "done",
]);
export const closeoutSubmissionStatusEnum = pgEnum("closeout_submission_status", [
  "pending",
  "approved",
  "changes_requested",
]);
export const billingRecordStatusEnum = pgEnum("billing_record_status", [
  "recorded",
  "paid",
  "disputed",
  "void",
]);
export const workspaceKindEnum = pgEnum("workspace_kind", [
  "personal",
  "household",
  "business",
]);
export const workspaceMemberRoleEnum = pgEnum("workspace_member_role", [
  "owner",
  "admin",
  "member",
  "billing_admin",
]);
export const workspaceMemberStatusEnum = pgEnum("workspace_member_status", [
  "active",
  "invited",
  "removed",
]);
export const workspacePlanEnum = pgEnum("workspace_plan", [
  "poc",
  "homeowner",
  "team",
  "enterprise",
]);
export const billingAccountStatusEnum = pgEnum("billing_account_status", [
  "trialing",
  "active",
  "past_due",
  "paused",
  "canceled",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  kind: workspaceKindEnum("kind").default("personal").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workspaceMemberships = pgTable(
  "workspace_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: workspaceMemberRoleEnum("role").default("member").notNull(),
    status: workspaceMemberStatusEnum("status").default("active").notNull(),
    invitedById: uuid("invited_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("workspace_memberships_workspace_user_unique").on(
      table.workspaceId,
      table.userId
    ),
    index("workspace_memberships_user_idx").on(table.userId),
  ]
);

export const billingAccounts = pgTable("billing_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .unique()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  plan: workspacePlanEnum("plan").default("poc").notNull(),
  status: billingAccountStatusEnum("status").default("trialing").notNull(),
  billingEmail: varchar("billing_email", { length: 255 }),
  externalCustomerId: varchar("external_customer_id", { length: 255 }),
  externalSubscriptionId: varchar("external_subscription_id", { length: 255 }),
  trialEndsAt: timestamp("trial_ends_at"),
  currentPeriodEndsAt: timestamp("current_period_ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, {
    onDelete: "set null",
  }),
  address: text("address").notNull(),
  unit: varchar("unit", { length: 100 }),
  nickname: varchar("nickname", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invites = pgTable("invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, {
    onDelete: "set null",
  }),
  // requestId is nullable at the type level to break the requests<->invites
  // circular FK; a request-scoped invite always has this set in practice.
  requestId: uuid("request_id"),
  role: inviteRoleEnum("role").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  status: inviteStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedById: uuid("accepted_by_id").references(() => users.id),
  acceptedAt: timestamp("accepted_at"),
});

export const requests = pgTable("requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, {
    onDelete: "set null",
  }),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  urgency: varchar("urgency", { length: 50 }).notNull(),
  location: text("location"),
  contactMethod: varchar("contact_method", { length: 50 }),
  accessInstructions: text("access_instructions"),
  notes: text("notes"),
  status: requestStatusEnum("status").default("Draft").notNull(),
  assignedVendorId: uuid("assigned_vendor_id").references(() => users.id),
  collaboratorId: uuid("collaborator_id").references(() => users.id),
  estimatedCost: numeric("estimated_cost", { precision: 10, scale: 2 }),
  quotedCost: numeric("quoted_cost", { precision: 10, scale: 2 }),
  finalCost: numeric("final_cost", { precision: 10, scale: 2 }),
  pendingVendorInviteId: uuid("pending_vendor_invite_id").references(
    () => invites.id
  ),
  pendingCollaboratorInviteId: uuid(
    "pending_collaborator_invite_id"
  ).references(() => invites.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const requestPhotos = pgTable("request_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  type: photoTypeEnum("type").notNull(),
  url: text("url").notNull(),
  blobPath: text("blob_path").notNull(),
  uploadedById: uuid("uploaded_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quotes = pgTable("quotes", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  submittedByVendorId: uuid("submitted_by_vendor_id").references(() => users.id),
  vendorName: varchar("vendor_name", { length: 255 }).notNull(),
  vendorContact: varchar("vendor_contact", { length: 255 }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  availabilityWindow: text("availability_window"),
  notes: text("notes"),
  attachmentUrl: text("attachment_url"),
  attachmentBlobPath: text("attachment_blob_path"),
  status: quoteStatusEnum("status").default("pending").notNull(),
  approvedById: uuid("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const decisionLog = pgTable("decision_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  details: jsonb("details").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workSessions = pgTable("work_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => users.id),
  proofPhotoId: uuid("proof_photo_id").references(() => requestPhotos.id, {
    onDelete: "set null",
  }),
  requestTaskId: uuid("request_task_id").references(() => requestTasks.id, {
    onDelete: "set null",
  }),
  taskLabel: varchar("task_label", { length: 255 }),
  event: workSessionEventEnum("event").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const requestTasks = pgTable("request_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: requestTaskStatusEnum("status").default("todo").notNull(),
  estimatedCost: numeric("estimated_cost", { precision: 10, scale: 2 }),
  finalCost: numeric("final_cost", { precision: 10, scale: 2 }),
  acceptedById: uuid("accepted_by_id").references(() => users.id),
  acceptedAt: timestamp("accepted_at"),
  sortOrder: integer("sort_order").default(0).notNull(),
  requiredPhotoTypes: jsonb("required_photo_types").$type<string[]>().default([]).notNull(),
  createdById: uuid("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const closeoutSubmissions = pgTable("closeout_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => users.id),
  completionNotes: text("completion_notes").notNull(),
  materialsNotes: text("materials_notes"),
  finalAmount: numeric("final_amount", { precision: 10, scale: 2 }).notNull(),
  status: closeoutSubmissionStatusEnum("status").default("pending").notNull(),
  reviewNotes: text("review_notes"),
  reviewedById: uuid("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const billingRecords = pgTable("billing_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, {
    onDelete: "set null",
  }),
  vendorId: uuid("vendor_id").references(() => users.id),
  closeoutSubmissionId: uuid("closeout_submission_id")
    .references(() => closeoutSubmissions.id, { onDelete: "set null" })
    .unique(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: billingRecordStatusEnum("status").default("recorded").notNull(),
  invoiceReference: varchar("invoice_reference", { length: 120 }),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vaultDocuments = pgTable("vault_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  category: vaultCategoryEnum("category").default("Other").notNull(),
  requestId: uuid("request_id").references(() => requests.id, {
    onDelete: "set null",
  }),
  url: text("url").notNull(),
  blobPath: text("blob_path").notNull(),
  uploadedById: uuid("uploaded_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reminders = pgTable("reminders", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  intervalDays: integer("interval_days").notNull(),
  lastCompletedAt: timestamp("last_completed_at"),
  nextDueAt: timestamp("next_due_at").notNull(),
  lastNotifiedAt: timestamp("last_notified_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Scoped to owner_id here — the original Firestore rule allowed any
  // authenticated user to read any owner's contacts (`allow read: if
  // isAuthed()`), which reads as a pre-existing scoping bug rather than
  // an intended feature. Fixed in this port: Server Actions only ever
  // query contacts WHERE owner_id = session.user.id.
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  propertyAddress: text("property_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationLog = pgTable("notification_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  requestId: uuid("request_id").references(() => requests.id, {
    onDelete: "set null",
  }),
  propertyId: uuid("property_id").references(() => properties.id, {
    onDelete: "set null",
  }),
  type: varchar("type", { length: 50 }).notNull(),
  recipientEmail: varchar("recipient_email", { length: 255 }),
  subject: varchar("subject", { length: 255 }),
  status: notificationStatusEnum("status").notNull(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vendorProfiles = pgTable("vendor_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  businessName: varchar("business_name", { length: 255 }),
  trades: jsonb("trades").$type<string[]>().default([]).notNull(),
  serviceArea: text("service_area"),
  availability: text("availability"),
  notificationPreference: varchar("notification_preference", { length: 50 }),
  licenseInsuranceNotes: text("license_insurance_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Login/signup attempt ledger for rate limiting (P0 security, 2026-09-28).
// One row per counted attempt; lib/auth/rate-limit.ts counts rows per key in
// a sliding window and prunes rows older than a day. Keys look like
// "login:email:<address>", "login:ip:<ip>", "signup:ip:<ip>".
export const authAttempts = pgTable(
  "auth_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 320 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("auth_attempts_key_created_idx").on(table.key, table.createdAt)]
);

// ── Relations (for db.query.* relational API) ──────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  properties: many(properties),
  ownedRequests: many(requests, { relationName: "ownerRequests" }),
  vendorProfile: one(vendorProfiles),
  workSessions: many(workSessions),
  closeoutSubmissions: many(closeoutSubmissions),
  billingRecords: many(billingRecords),
  ownedWorkspaces: many(workspaces),
  workspaceMemberships: many(workspaceMemberships, {
    relationName: "userWorkspaceMemberships",
  }),
  invitedWorkspaceMemberships: many(workspaceMemberships, {
    relationName: "workspaceMembershipInvites",
  }),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  memberships: many(workspaceMemberships),
  billingAccount: one(billingAccounts),
  properties: many(properties),
  requests: many(requests),
  billingRecords: many(billingRecords),
}));

export const workspaceMembershipsRelations = relations(
  workspaceMemberships,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceMemberships.workspaceId],
      references: [workspaces.id],
    }),
    user: one(users, {
      fields: [workspaceMemberships.userId],
      references: [users.id],
      relationName: "userWorkspaceMemberships",
    }),
    invitedBy: one(users, {
      fields: [workspaceMemberships.invitedById],
      references: [users.id],
      relationName: "workspaceMembershipInvites",
    }),
  })
);

export const billingAccountsRelations = relations(billingAccounts, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [billingAccounts.workspaceId],
    references: [workspaces.id],
  }),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, { fields: [properties.ownerId], references: [users.id] }),
  workspace: one(workspaces, {
    fields: [properties.workspaceId],
    references: [workspaces.id],
  }),
  requests: many(requests),
  vaultDocuments: many(vaultDocuments),
  reminders: many(reminders),
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  owner: one(users, {
    fields: [requests.ownerId],
    references: [users.id],
    relationName: "ownerRequests",
  }),
  workspace: one(workspaces, {
    fields: [requests.workspaceId],
    references: [workspaces.id],
  }),
  property: one(properties, {
    fields: [requests.propertyId],
    references: [properties.id],
  }),
  assignedVendor: one(users, {
    fields: [requests.assignedVendorId],
    references: [users.id],
  }),
  collaborator: one(users, {
    fields: [requests.collaboratorId],
    references: [users.id],
  }),
  photos: many(requestPhotos),
  quotes: many(quotes),
  log: many(decisionLog),
  comments: many(comments),
  workSessions: many(workSessions),
  tasks: many(requestTasks),
  closeoutSubmissions: many(closeoutSubmissions),
  billingRecords: many(billingRecords),
}));

export const requestPhotosRelations = relations(requestPhotos, ({ one }) => ({
  request: one(requests, {
    fields: [requestPhotos.requestId],
    references: [requests.id],
  }),
  uploadedBy: one(users, {
    fields: [requestPhotos.uploadedById],
    references: [users.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  request: one(requests, {
    fields: [quotes.requestId],
    references: [requests.id],
  }),
  submittedByVendor: one(users, {
    fields: [quotes.submittedByVendorId],
    references: [users.id],
  }),
}));

export const decisionLogRelations = relations(decisionLog, ({ one }) => ({
  request: one(requests, {
    fields: [decisionLog.requestId],
    references: [requests.id],
  }),
  actor: one(users, { fields: [decisionLog.actorId], references: [users.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  request: one(requests, {
    fields: [comments.requestId],
    references: [requests.id],
  }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const workSessionsRelations = relations(workSessions, ({ one }) => ({
  request: one(requests, {
    fields: [workSessions.requestId],
    references: [requests.id],
  }),
  vendor: one(users, { fields: [workSessions.vendorId], references: [users.id] }),
  proofPhoto: one(requestPhotos, {
    fields: [workSessions.proofPhotoId],
    references: [requestPhotos.id],
  }),
  requestTask: one(requestTasks, {
    fields: [workSessions.requestTaskId],
    references: [requestTasks.id],
  }),
}));

export const requestTasksRelations = relations(requestTasks, ({ one, many }) => ({
  request: one(requests, {
    fields: [requestTasks.requestId],
    references: [requests.id],
  }),
  createdBy: one(users, { fields: [requestTasks.createdById], references: [users.id] }),
  acceptedBy: one(users, { fields: [requestTasks.acceptedById], references: [users.id] }),
  workSessions: many(workSessions),
}));

export const closeoutSubmissionsRelations = relations(closeoutSubmissions, ({ one }) => ({
  request: one(requests, {
    fields: [closeoutSubmissions.requestId],
    references: [requests.id],
  }),
  vendor: one(users, {
    fields: [closeoutSubmissions.vendorId],
    references: [users.id],
  }),
  reviewedBy: one(users, {
    fields: [closeoutSubmissions.reviewedById],
    references: [users.id],
  }),
  billingRecord: one(billingRecords),
}));

export const billingRecordsRelations = relations(billingRecords, ({ one }) => ({
  request: one(requests, {
    fields: [billingRecords.requestId],
    references: [requests.id],
  }),
  owner: one(users, {
    fields: [billingRecords.ownerId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [billingRecords.workspaceId],
    references: [workspaces.id],
  }),
  vendor: one(users, {
    fields: [billingRecords.vendorId],
    references: [users.id],
  }),
  closeoutSubmission: one(closeoutSubmissions, {
    fields: [billingRecords.closeoutSubmissionId],
    references: [closeoutSubmissions.id],
  }),
}));

export const invitesRelations = relations(invites, ({ one }) => ({
  owner: one(users, { fields: [invites.ownerId], references: [users.id] }),
  workspace: one(workspaces, {
    fields: [invites.workspaceId],
    references: [workspaces.id],
  }),
  request: one(requests, {
    fields: [invites.requestId],
    references: [requests.id],
  }),
}));

export const vaultDocumentsRelations = relations(vaultDocuments, ({ one }) => ({
  property: one(properties, {
    fields: [vaultDocuments.propertyId],
    references: [properties.id],
  }),
  request: one(requests, {
    fields: [vaultDocuments.requestId],
    references: [requests.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  property: one(properties, {
    fields: [reminders.propertyId],
    references: [properties.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  owner: one(users, { fields: [contacts.ownerId], references: [users.id] }),
}));

export const vendorProfilesRelations = relations(vendorProfiles, ({ one }) => ({
  user: one(users, { fields: [vendorProfiles.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type WorkspaceMembership = typeof workspaceMemberships.$inferSelect;
export type BillingAccount = typeof billingAccounts.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Request = typeof requests.$inferSelect;
export type RequestPhoto = typeof requestPhotos.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type DecisionLogEntry = typeof decisionLog.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type WorkSession = typeof workSessions.$inferSelect;
export type RequestTask = typeof requestTasks.$inferSelect;
export type CloseoutSubmission = typeof closeoutSubmissions.$inferSelect;
export type BillingRecord = typeof billingRecords.$inferSelect;
export type Invite = typeof invites.$inferSelect;
export type VaultDocument = typeof vaultDocuments.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type NotificationLogEntry = typeof notificationLog.$inferSelect;
export type VendorProfile = typeof vendorProfiles.$inferSelect;
