import { pgTable, serial, text, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";

export const agreements = pgTable("agreements", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  vendorName: text("vendor_name"),
  title: text("title"),
  effectiveDate: timestamp("effective_date"),
  initialTermMonths: integer("initial_term_months"),
  autoRenews: boolean("auto_renews"),
  renewalTermMonths: integer("renewal_term_months"),
  noticePeriodDays: integer("notice_period_days"),
  rawText: text("raw_text"),
  sourceFile: text("source_file"),
  products: json("products").$type<string[]>().default([]),

});


export const renewalEvents = pgTable("renewal_events", {
  id: serial("id").primaryKey(),
  agreementId: integer("agreement_id").notNull(),
  title: text("title").notNull(),
  eventDate: timestamp("event_date").notNull(),
  kind: text("kind").notNull(),
  isDone: boolean("is_done").notNull().default(false),
  assignedTo: text("assigned_to"),
  sharedBy: text("shared_by"),
  shareToken: text("share_token"),
  vendorName: text("vendor_name"),
  autoRenews: boolean("auto_renews").default(false),
  isResolved: boolean("is_resolved").default(false),
  status: text("status"),
  renewalTermMonths: integer("renewal_term_months").default(12),
  lastReminderSent: timestamp("last_reminder_sent"),
});
