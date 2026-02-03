/**
 * Submissions Module Models
 * TypeBox schemas for submission management
 * @see https://elysiajs.com/validation/overview.html
 */

import { t } from "elysia";
import {
  IdParam,
  PaginationMeta,
  PaginationQuery,
  spread,
} from "@/common/schemas";

/**
 * Skill types
 */
export const SkillType = t.Union([
  t.Literal("listening"),
  t.Literal("reading"),
  t.Literal("writing"),
  t.Literal("speaking"),
]);

/**
 * Submission status
 */
export const SubmissionStatus = t.Union([
  t.Literal("pending"),
  t.Literal("queued"),
  t.Literal("processing"),
  t.Literal("analyzing"),
  t.Literal("grading"),
  t.Literal("review_required"),
  t.Literal("completed"),
  t.Literal("failed"),
]);

/**
 * Question levels
 */
export const QuestionLevel = t.Union([
  t.Literal("beginner"),
  t.Literal("intermediate"),
  t.Literal("advanced"),
  t.Literal("native"),
]);

/**
 * Question formats
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
 * Submission model namespace
 */
export namespace SubmissionModel {
  // ============ Params ============

  /**
   * Submission ID parameter
   */
  export const submissionIdParam = IdParam;
  export type SubmissionIdParam = typeof submissionIdParam.static;

  /**
   * User ID parameter
   */
  export const userIdParam = t.Object({
    userId: t.String({ format: "uuid" }),
  });
  export type UserIdParam = typeof userIdParam.static;

  // ============ Request Bodies ============

  /**
   * Create submission request body
   */
  export const createSubmissionBody = t.Object({
    questionId: t.String({ format: "uuid" }),
    skill: SkillType,
    answer: t.Any(), // jsonb in database
  });
  export type CreateSubmissionBody = typeof createSubmissionBody.static;

  /**
   * Update submission request body
   */
  export const updateSubmissionBody = t.Partial(
    t.Object({
      answer: t.Any(), // jsonb in database
      status: SubmissionStatus,
      score: t.Number(),
      band: t.Number(),
      feedback: t.String(),
    }),
  );
  export type UpdateSubmissionBody = typeof updateSubmissionBody.static;

  /**
   * Grade submission request body (admin/instructor)
   */
  export const gradeSubmissionBody = t.Object({
    score: t.Number(),
    band: t.Optional(t.Number()),
    feedback: t.Optional(t.String()),
  });
  export type GradeSubmissionBody = typeof gradeSubmissionBody.static;

  /**
   * Query parameters for listing submissions
   */
  export const listSubmissionsQuery = t.Object({
    ...spread(PaginationQuery),
    skill: t.Optional(SkillType),
    status: t.Optional(SubmissionStatus),
    userId: t.Optional(t.String({ format: "uuid" })),
  });
  export type ListSubmissionsQuery = typeof listSubmissionsQuery.static;

  // ============ Response Schemas ============

  /**
   * Submission info in responses
   */
  export const submissionInfo = t.Object({
    id: t.String({ format: "uuid" }),
    userId: t.String({ format: "uuid" }),
    questionId: t.String({ format: "uuid" }),
    skill: SkillType,
    status: SubmissionStatus,
    score: t.Optional(t.Nullable(t.Number())),
    band: t.Optional(t.Nullable(t.Number())),
    completedAt: t.Optional(t.String()),
    createdAt: t.String(),
    updatedAt: t.String(),
  });

  /**
   * Submission with details
   */
  export const submissionWithDetails = t.Object({
    ...submissionInfo.properties,
    answer: t.Optional(t.Any()), // jsonb in database
    result: t.Optional(t.Any()), // jsonb in database
    feedback: t.Optional(t.Nullable(t.String())),
  });

  /**
   * Single submission response
   */
  export const submissionResponse = submissionWithDetails;
  export type SubmissionResponse = typeof submissionResponse.static;

  /**
   * List submissions response
   */
  export const listSubmissionsResponse = t.Object({
    data: t.Array(submissionWithDetails),
    meta: PaginationMeta,
  });
  export type ListSubmissionsResponse = typeof listSubmissionsResponse.static;

  /**
   * Create submission response
   */
  export const createSubmissionResponse = submissionInfo;
  export type CreateSubmissionResponse = typeof createSubmissionResponse.static;

  /**
   * Update submission response
   */
  export const updateSubmissionResponse = submissionWithDetails;
  export type UpdateSubmissionResponse = typeof updateSubmissionResponse.static;

  /**
   * Grade submission response
   */
  export const gradeSubmissionResponse = submissionWithDetails;
  export type GradeSubmissionResponse = typeof gradeSubmissionResponse.static;

  /**
   * Delete submission response
   */
  export const deleteSubmissionResponse = t.Object({
    id: t.String({ format: "uuid" }),
  });
  export type DeleteSubmissionResponse = typeof deleteSubmissionResponse.static;

  // ============ Error Responses ============

  /**
   * Submission error response
   */
  export const submissionError = t.Object({
    error: t.Object({
      code: t.String(),
      message: t.String(),
    }),
    requestId: t.Optional(t.String()),
  });
  export type SubmissionError = typeof submissionError.static;
}

// Re-export for convenience
export { t };
