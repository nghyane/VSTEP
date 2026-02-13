import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestampsWithSoftDelete } from "./columns";
import { skillEnum } from "./enums";
import { submissions } from "./submissions";
import { users } from "./users";

export const classes = pgTable(
  "classes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    instructorId: uuid("instructor_id")
      .notNull()
      .references(() => users.id),
    inviteCode: text("invite_code").notNull(),
    ...timestampsWithSoftDelete,
  },
  (table) => ({
    inviteCodeUnique: uniqueIndex("classes_invite_code_idx").on(
      table.inviteCode,
    ),
    instructorIdx: index("classes_instructor_idx").on(table.instructorId),
  }),
);

export const classMembers = pgTable(
  "class_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    removedAt: timestamp("removed_at", { withTimezone: true, mode: "string" }),
  },
  (table) => ({
    classUserUnique: uniqueIndex("class_members_class_user_idx").on(
      table.classId,
      table.userId,
    ),
    userIdx: index("class_members_user_idx").on(table.userId),
  }),
);

export const instructorFeedback = pgTable(
  "instructor_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id),
    fromUserId: uuid("from_user_id")
      .notNull()
      .references(() => users.id),
    toUserId: uuid("to_user_id")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(),
    skill: skillEnum("skill"),
    submissionId: uuid("submission_id").references(() => submissions.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    classToIdx: index("feedback_class_to_idx").on(
      table.classId,
      table.toUserId,
    ),
    fromIdx: index("feedback_from_idx").on(table.fromUserId),
  }),
);

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;
export type ClassMember = typeof classMembers.$inferSelect;
export type NewClassMember = typeof classMembers.$inferInsert;
export type InstructorFeedback = typeof instructorFeedback.$inferSelect;
export type NewInstructorFeedback = typeof instructorFeedback.$inferInsert;
