import { QuestionLevel, Skill, StreakDirection } from "@common/enums";
import { t } from "elysia";

export namespace ProgressModel {
  export const Progress = t.Object({
    id: t.String({ format: "uuid" }),
    userId: t.String({ format: "uuid" }),
    skill: Skill,
    currentLevel: QuestionLevel,
    targetLevel: t.Nullable(QuestionLevel),
    scaffoldLevel: t.Number(),
    streakCount: t.Number(),
    streakDirection: t.Nullable(StreakDirection),
    attemptCount: t.Number(),
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
  });

  export const UpdateBody = t.Object({
    skill: Skill,
    currentLevel: QuestionLevel,
    targetLevel: t.Optional(QuestionLevel),
    scaffoldLevel: t.Optional(t.Number()),
    streakCount: t.Optional(t.Number()),
    streakDirection: t.Optional(StreakDirection),
  });

  export type Progress = typeof Progress.static;
  export type UpdateBody = typeof UpdateBody.static;
}
