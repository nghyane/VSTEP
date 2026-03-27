import { t } from "elysia";

export const ObjectiveAnswerKey = t.Object({
  correctAnswers: t.Record(t.String(), t.String()),
});

export const ObjectiveAnswer = t.Object({
  answers: t.Record(t.String(), t.String()),
});

export const WritingAnswer = t.Object({
  text: t.String({ minLength: 1 }),
});

export const SpeakingAnswer = t.Object({
  audioUrl: t.String(),
  durationSeconds: t.Number({ minimum: 0 }),
  transcript: t.Optional(t.String()),
});

export const SubmissionAnswer = t.Union([
  ObjectiveAnswer,
  WritingAnswer,
  SpeakingAnswer,
]);

export type ObjectiveAnswerKey = typeof ObjectiveAnswerKey.static;
export type ObjectiveAnswer = typeof ObjectiveAnswer.static;
export type WritingAnswer = typeof WritingAnswer.static;
export type SpeakingAnswer = typeof SpeakingAnswer.static;
export type SubmissionAnswer = typeof SubmissionAnswer.static;
