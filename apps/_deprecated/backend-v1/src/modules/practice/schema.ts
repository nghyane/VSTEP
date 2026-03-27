import { Skill } from "@db/enums";
import { t } from "elysia";

export const PracticeNextQuery = t.Object({
  skill: Skill,
  part: t.Optional(t.Integer({ minimum: 1, maximum: 4 })),
});
export type PracticeNextQuery = typeof PracticeNextQuery.static;

export const PracticeNextResponse = t.Object({
  question: t.Nullable(
    t.Object({
      id: t.String(),
      skill: t.String(),
      level: t.String(),
      part: t.Integer(),
      content: t.Unknown(),
      answerKey: t.Nullable(t.Unknown()),
      explanation: t.Nullable(t.String()),
    }),
  ),
  scaffoldLevel: t.Integer(),
  currentLevel: t.String(),
});
export type PracticeNextResponse = typeof PracticeNextResponse.static;
