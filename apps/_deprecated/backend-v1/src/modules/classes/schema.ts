import { Skill } from "@db/enums";
import { classes, classMembers, instructorFeedback } from "@db/schema";
import { createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";

export const Class = createSelectSchema(classes);
export type Class = typeof Class.static;

export const ClassMember = createSelectSchema(classMembers);
export type ClassMember = typeof ClassMember.static;

export const Feedback = createSelectSchema(instructorFeedback);
export type Feedback = typeof Feedback.static;

export const CreateClassBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  description: t.Optional(t.String({ maxLength: 5000 })),
});
export type CreateClassBody = typeof CreateClassBody.static;

export const UpdateClassBody = t.Partial(CreateClassBody);
export type UpdateClassBody = typeof UpdateClassBody.static;

export const JoinClassBody = t.Object({
  inviteCode: t.String({ minLength: 1 }),
});
export type JoinClassBody = typeof JoinClassBody.static;

export const CreateFeedbackBody = t.Object({
  toUserId: t.String({ format: "uuid" }),
  content: t.String({ minLength: 1, maxLength: 10000 }),
  skill: t.Optional(Skill),
  submissionId: t.Optional(t.String({ format: "uuid" })),
});
export type CreateFeedbackBody = typeof CreateFeedbackBody.static;

export const ClassListQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
});
export type ClassListQuery = typeof ClassListQuery.static;

export const FeedbackListQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  skill: t.Optional(Skill),
});
export type FeedbackListQuery = typeof FeedbackListQuery.static;

export const ClassDetail = t.Composite([
  t.Omit(Class, ["inviteCode"]),
  t.Object({
    inviteCode: t.Nullable(t.String()),
    members: t.Array(
      t.Object({
        id: t.String({ format: "uuid" }),
        userId: t.String({ format: "uuid" }),
        fullName: t.Nullable(t.String()),
        email: t.String(),
        joinedAt: t.String(),
      }),
    ),
    memberCount: t.Number(),
  }),
]);
export type ClassDetail = typeof ClassDetail.static;
