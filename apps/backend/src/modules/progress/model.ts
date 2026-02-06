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

  export type Progress = typeof Progress.static;
}
