import { t } from "elysia";

const BlueprintSection = t.Object({
  questionIds: t.Array(t.String({ format: "uuid" })),
});

export const ExamBlueprint = t.Object({
  listening: t.Optional(BlueprintSection),
  reading: t.Optional(BlueprintSection),
  writing: t.Optional(BlueprintSection),
  speaking: t.Optional(BlueprintSection),
  durationMinutes: t.Optional(t.Integer({ minimum: 1 })),
});

export type ExamBlueprint = typeof ExamBlueprint.static;
