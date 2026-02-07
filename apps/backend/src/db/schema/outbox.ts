import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { submissions } from "./submissions";

export const outboxStatusEnum = pgEnum("outbox_status", [
  "pending",
  "processing",
  "published",
  "failed",
]);

export const outbox = pgTable(
  "outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .references(() => submissions.id, { onDelete: "cascade" })
      .notNull(),
    aggregateType: varchar("aggregate_type", { length: 50 }),
    aggregateId: uuid("aggregate_id"),
    messageType: varchar("message_type", { length: 50 }).notNull(),
    payload: jsonb("payload").notNull(),
    status: outboxStatusEnum("status").default("pending").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    errorMessage: text("error_message"),
    lockedAt: timestamp("locked_at", { withTimezone: true, mode: "string" }),
    lockedBy: varchar("locked_by", { length: 64 }),
    publishedAt: timestamp("published_at", {
      withTimezone: true,
      mode: "string",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pendingIdx: index("outbox_pending_idx")
      .on(table.createdAt)
      .where(sql`${table.status} = 'pending'`),
    processingIdx: index("outbox_processing_idx")
      .on(table.lockedAt)
      .where(sql`${table.status} = 'processing'`),
  }),
);

export const processedCallbacks = pgTable(
  "processed_callbacks",
  {
    eventId: uuid("event_id").primaryKey(),
    requestId: uuid("request_id").notNull(),
    submissionId: uuid("submission_id")
      .references(() => submissions.id, { onDelete: "cascade" })
      .notNull(),
    processedAt: timestamp("processed_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    requestIdx: index("processed_callbacks_request_idx").on(table.requestId),
  }),
);

export type Outbox = typeof outbox.$inferSelect;
export type NewOutbox = typeof outbox.$inferInsert;
export type ProcessedCallback = typeof processedCallbacks.$inferSelect;
export type NewProcessedCallback = typeof processedCallbacks.$inferInsert;
