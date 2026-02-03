/**
 * Questions Module Models
 * TypeBox schemas for question management
 * @see https://elysiajs.com/validation/overview.html
 */

import { t } from "elysia";
import {
  ErrorResponse,
  IdParam,
  PaginationMeta,
  PaginationQuery,
  spread,
} from "@/common/schemas";

/**
 * Question skill types
 */
export const QuestionSkill = t.Union([
  t.Literal("listening"),
  t.Literal("reading"),
  t.Literal("writing"),
  t.Literal("speaking"),
]);

/**
 * Question levels
 */
export const QuestionLevel = t.Union([
  t.Literal("A2"),
  t.Literal("B1"),
  t.Literal("B2"),
  t.Literal("C1"),
]);

/**
 * Question format types
 */
export const QuestionFormat = t.Union([
  t.Literal("multiple_choice"),
  t.Literal("fill_in_blank"),
  t.Literal("short_answer"),
  t.Literal("essay"),
  t.Literal("matching"),
  t.Literal("ordering"),
]);

/**
 * Question model namespace
 */
export namespace QuestionModel {
  // ============ Params ============

  /**
   * Question ID parameter
   */
  export const questionIdParam = IdParam;
  export type QuestionIdParam = typeof questionIdParam.static;

  /**
   * Question version ID parameter
   */
  export const versionIdParam = t.Object({
    versionId: t.String({ format: "uuid" }),
  });
  export type VersionIdParam = typeof versionIdParam.static;

  // ============ Request Bodies ============

  /**
   * Create question request body
   */
  export const createQuestionBody = t.Object({
    skill: QuestionSkill,
    level: QuestionLevel,
    format: QuestionFormat,
    content: t.Any(), // jsonb in database
    answerKey: t.Optional(t.Any()), // jsonb in database
  });
  export type CreateQuestionBody = typeof createQuestionBody.static;

  /**
   * Update question request body
   */
  export const updateQuestionBody = t.Partial(
    t.Object({
      skill: QuestionSkill,
      level: QuestionLevel,
      format: QuestionFormat,
      content: t.Any(), // jsonb in database
      answerKey: t.Optional(t.Any()), // jsonb in database
      isActive: t.Boolean(),
    }),
  );
  export type UpdateQuestionBody = typeof updateQuestionBody.static;

  /**
   * Create new version request body
   */
  export const createVersionBody = t.Object({
    content: t.Any(), // jsonb in database
    answerKey: t.Optional(t.Any()), // jsonb in database
  });
  export type CreateVersionBody = typeof createVersionBody.static;

  /**
   * Query parameters for listing questions
   */
  export const listQuestionsQuery = t.Object({
    ...spread(PaginationQuery),
    skill: t.Optional(QuestionSkill),
    level: t.Optional(QuestionLevel),
    format: t.Optional(QuestionFormat),
    isActive: t.Optional(t.Boolean()),
    search: t.Optional(t.String()),
  });
  export type ListQuestionsQuery = typeof listQuestionsQuery.static;

  // ============ Response Schemas ============

  /**
   * Question info in responses
   */
  export const questionInfo = t.Object({
    id: t.String({ format: "uuid" }),
    skill: QuestionSkill,
    level: QuestionLevel,
    format: QuestionFormat,
    content: t.Any(), // jsonb in database
    answerKey: t.Optional(t.Any()), // jsonb in database
    version: t.Number(),
    isActive: t.Boolean(),
    createdBy: t.Optional(t.Nullable(t.String({ format: "uuid" }))),
    createdAt: t.String(),
    updatedAt: t.String(),
  });

  /**
   * Question with details
   */
  export const questionWithDetails = t.Object({
    ...questionInfo.properties,
    deletedAt: t.Optional(t.Nullable(t.String())),
  });

  /**
   * Single question response
   */
  export const questionResponse = questionWithDetails;
  export type QuestionResponse = typeof questionResponse.static;

  /**
   * List questions response
   */
  export const listQuestionsResponse = t.Object({
    data: t.Array(questionWithDetails),
    meta: PaginationMeta,
  });
  export type ListQuestionsResponse = typeof listQuestionsResponse.static;

  /**
   * Create question response
   */
  export const createQuestionResponse = questionInfo;
  export type CreateQuestionResponse = typeof createQuestionResponse.static;

  /**
   * Update question response
   */
  export const updateQuestionResponse = questionWithDetails;
  export type UpdateQuestionResponse = typeof updateQuestionResponse.static;

  /**
   * Delete question response
   */
  export const deleteQuestionResponse = t.Object({
    id: t.String({ format: "uuid" }),
  });
  export type DeleteQuestionResponse = typeof deleteQuestionResponse.static;

  // ============ Version Response Schemas ============

  /**
   * Question version info
   */
  export const questionVersionInfo = t.Object({
    id: t.String({ format: "uuid" }),
    questionId: t.String({ format: "uuid" }),
    version: t.Number(),
    content: t.Any(), // jsonb in database
    answerKey: t.Optional(t.Any()), // jsonb in database
    createdAt: t.String(),
  });

  /**
   * Question version response
   */
  export const questionVersionResponse = questionVersionInfo;
  export type QuestionVersionResponse = typeof questionVersionResponse.static;

  /**
   * List question versions response
   */
  export const listQuestionVersionsResponse = t.Object({
    data: t.Array(questionVersionInfo),
    meta: t.Object({
      total: t.Number(),
    }),
  });
  export type ListQuestionVersionsResponse =
    typeof listQuestionVersionsResponse.static;

  /**
   * Create version response
   */
  export const createVersionResponse = questionVersionInfo;
  export type CreateVersionResponse = typeof createVersionResponse.static;

  // ============ Error Responses ============

  /**
   * Question error response
   */
  export const questionError = ErrorResponse;
  export type QuestionError = typeof questionError.static;
}

// Re-export for convenience
export { t };
