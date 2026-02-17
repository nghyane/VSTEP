import { Skill } from "@db/enums";
import { ObjectiveAnswerKey } from "@db/types/answers";
import {
  ListeningContent,
  QuestionContent,
  ReadingContent,
  ReadingGapFillContent,
  ReadingMatchingContent,
  ReadingTNGContent,
  SpeakingPart1Content,
  SpeakingPart2Content,
  SpeakingPart3Content,
  WritingContent,
} from "@db/types/question-content";
import { t } from "elysia";

// ---------------------------------------------------------------------------
// Response schemas
// ---------------------------------------------------------------------------

export const Question = t.Object({
  id: t.String({ format: "uuid" }),
  skill: Skill,
  part: t.Integer(),
  content: QuestionContent,
  answerKey: t.Optional(t.Nullable(ObjectiveAnswerKey)),
  explanation: t.Optional(t.Nullable(t.String())),
  isActive: t.Boolean(),
  createdBy: t.Nullable(t.String({ format: "uuid" })),
  createdAt: t.String(),
  updatedAt: t.String(),
});
export type Question = typeof Question.static;

export const QuestionWithKnowledgePoints = t.Intersect([
  Question,
  t.Object({
    knowledgePointIds: t.Array(t.String({ format: "uuid" })),
  }),
]);
export type QuestionWithKnowledgePoints =
  typeof QuestionWithKnowledgePoints.static;

// ---------------------------------------------------------------------------
// Request schemas
// ---------------------------------------------------------------------------

const KnowledgePointIds = t.Optional(
  t.Array(t.String({ format: "uuid" }), { maxItems: 10 }),
);
const Explanation = t.Optional(t.String());

const ListeningCreateBody = t.Object({
  skill: t.Literal("listening"),
  part: t.UnionEnum([1, 2, 3]),
  content: ListeningContent,
  answerKey: ObjectiveAnswerKey,
  explanation: Explanation,
  knowledgePointIds: KnowledgePointIds,
});

const ReadingCreateBody = t.Object({
  skill: t.Literal("reading"),
  part: t.UnionEnum([1, 2, 3, 4]),
  content: t.Union([
    ReadingContent,
    ReadingTNGContent,
    ReadingGapFillContent,
    ReadingMatchingContent,
  ]),
  answerKey: ObjectiveAnswerKey,
  explanation: Explanation,
  knowledgePointIds: KnowledgePointIds,
});

const WritingCreateBody = t.Object({
  skill: t.Literal("writing"),
  part: t.UnionEnum([1, 2]),
  content: WritingContent,
  explanation: Explanation,
  knowledgePointIds: KnowledgePointIds,
});

const SpeakingCreateBody = t.Object({
  skill: t.Literal("speaking"),
  part: t.UnionEnum([1, 2, 3]),
  content: t.Union([
    SpeakingPart1Content,
    SpeakingPart2Content,
    SpeakingPart3Content,
  ]),
  explanation: Explanation,
  knowledgePointIds: KnowledgePointIds,
});

export const QuestionCreateBody = t.Union([
  ListeningCreateBody,
  ReadingCreateBody,
  WritingCreateBody,
  SpeakingCreateBody,
]);

export const QuestionUpdateBody = t.Object({
  part: t.Optional(t.Integer({ minimum: 1, maximum: 4 })),
  content: t.Optional(QuestionContent),
  answerKey: t.Optional(ObjectiveAnswerKey),
  explanation: t.Optional(t.String()),
  isActive: t.Optional(t.Boolean()),
  knowledgePointIds: t.Optional(
    t.Array(t.String({ format: "uuid" }), { maxItems: 10 }),
  ),
});

export const QuestionListQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  skill: t.Optional(Skill),
  part: t.Optional(t.Integer({ minimum: 1, maximum: 4 })),
  isActive: t.Optional(t.Boolean()),
  knowledgePointId: t.Optional(t.String({ format: "uuid" })),
  search: t.Optional(t.String({ maxLength: 255 })),
});

export type QuestionCreateBody = typeof QuestionCreateBody.static;
export type QuestionUpdateBody = typeof QuestionUpdateBody.static;
export type QuestionListQuery = typeof QuestionListQuery.static;
