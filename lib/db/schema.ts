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

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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
  vendorName: varchar("vendor_name", { length: 255 }).notNull(),
  vendorContact: varchar("vendor_contact", { length: 255 }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
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

// ── Relations (for db.query.* relational API) ──────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  ownedRequests: many(requests, { relationName: "ownerRequests" }),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, { fields: [properties.ownerId], references: [users.id] }),
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

export const invitesRelations = relations(invites, ({ one }) => ({
  owner: one(users, { fields: [invites.ownerId], references: [users.id] }),
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

export type User = typeof users.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Request = typeof requests.$inferSelect;
export type RequestPhoto = typeof requestPhotos.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type DecisionLogEntry = typeof decisionLog.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Invite = typeof invites.$inferSelect;
export type VaultDocument = typeof vaultDocuments.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type NotificationLogEntry = typeof notificationLog.$inferSelect;
