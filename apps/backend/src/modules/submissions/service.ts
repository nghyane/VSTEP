/**
 * Submissions Module Service
 * Business logic for submission management
 * @see https://elysiajs.com/pattern/mvc.html
 */

import { assertExists, toISOString, toISOStringRequired } from "@common/utils";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db, table } from "@/db";
import type { SubmissionDetail } from "@/db/schema/submissions";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/plugins/error";
import type { SkillType, SubmissionModel, SubmissionStatus } from "./model";

const mapSubmissionResponse = (
  sub: {
    id: string;
    userId: string;
    questionId: string;
    skill: string;
    status: string;
    score: number | null | undefined;
    band: number | null | undefined;
    completedAt: Date | null | undefined;
    createdAt: Date;
    updatedAt: Date;
  },
  details?: Partial<SubmissionDetail>,
): typeof SubmissionModel.submissionWithDetails.static => ({
  id: sub.id,
  userId: sub.userId,
  questionId: sub.questionId,
  skill: sub.skill as typeof SkillType.static,
  status: sub.status as typeof SubmissionStatus.static,
  score: sub.score ?? undefined,
  band: sub.band ?? undefined,
  completedAt: toISOString(sub.completedAt ?? null) ?? undefined,
  createdAt: toISOStringRequired(sub.createdAt),
  updatedAt: toISOStringRequired(sub.updatedAt),
  answer: details?.answer,
  result: details?.result,
  feedback: details?.feedback ?? undefined,
});

/**
 * Submission service with static methods
 */
export abstract class SubmissionService {
  /**
   * Get submission by ID
   * @throws NotFoundError if submission not found
   */
  static async getById(
    submissionId: string,
    currentUserId: string,
    isAdmin: boolean,
  ): Promise<SubmissionModel.SubmissionResponse> {
    // Get submission
    const [submission] = await db
      .select()
      .from(table.submissions)
      .where(
        and(
          eq(table.submissions.id, submissionId),
          isNull(table.submissions.deletedAt),
        ),
      )
      .limit(1);

    if (!submission) {
      throw new NotFoundError("Submission not found");
    }

    if (!isAdmin && submission.userId !== currentUserId) {
      throw new ForbiddenError("You can only view your own submissions");
    }

    // Get details if available
    const [details] = await db
      .select()
      .from(table.submissionDetails)
      .where(eq(table.submissionDetails.submissionId, submissionId))
      .limit(1);

    return mapSubmissionResponse(submission, details);
  }

  /**
   * List submissions with filtering and pagination
   */
  static async list(
    query: SubmissionModel.ListSubmissionsQuery,
    currentUserId: string,
    isAdmin: boolean,
  ): Promise<SubmissionModel.ListSubmissionsResponse> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: ReturnType<typeof and>[] = [
      isNull(table.submissions.deletedAt),
    ];

    // Non-admin users can only see their own submissions
    if (!isAdmin) {
      conditions.push(eq(table.submissions.userId, currentUserId));
    } else if (query.userId) {
      // Admin can filter by specific user
      conditions.push(eq(table.submissions.userId, query.userId));
    }

    if (query.skill) {
      conditions.push(eq(table.submissions.skill, query.skill));
    }

    if (query.status) {
      conditions.push(eq(table.submissions.status, query.status));
    }

    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(table.submissions)
      .where(whereClause);

    const total = countResult?.count || 0;

    // Get submissions with details
    const submissions = await db
      .select({
        id: table.submissions.id,
        userId: table.submissions.userId,
        questionId: table.submissions.questionId,
        skill: table.submissions.skill,
        status: table.submissions.status,
        score: table.submissions.score,
        band: table.submissions.band,
        completedAt: table.submissions.completedAt,
        createdAt: table.submissions.createdAt,
        updatedAt: table.submissions.updatedAt,
        answer: table.submissionDetails.answer,
        result: table.submissionDetails.result,
        feedback: table.submissionDetails.feedback,
      })
      .from(table.submissions)
      .leftJoin(
        table.submissionDetails,
        eq(table.submissions.id, table.submissionDetails.submissionId),
      )
      .where(whereClause)
      .orderBy(desc(table.submissions.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: submissions.map((s) =>
        mapSubmissionResponse(
          {
            id: s.id,
            userId: s.userId,
            questionId: s.questionId,
            skill: s.skill,
            status: s.status as typeof SubmissionStatus.static,
            score: s.score,
            band: s.band,
            completedAt: s.completedAt,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          },
          {
            answer: s.answer,
            result: s.result,
            feedback: s.feedback,
          },
        ),
      ),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create new submission
   */
  static async create(
    userId: string,
    body: SubmissionModel.CreateSubmissionBody,
  ): Promise<SubmissionModel.CreateSubmissionResponse> {
    // Validate question exists
    const [question] = await db
      .select({ id: table.questions.id })
      .from(table.questions)
      .where(
        and(
          eq(table.questions.id, body.questionId),
          isNull(table.questions.deletedAt),
        ),
      )
      .limit(1);

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    // Create submission and details in transaction
    return await db.transaction(async (tx) => {
      const [submission] = await tx
        .insert(table.submissions)
        .values({
          userId,
          questionId: body.questionId,
          skill: body.skill,
          status: "pending",
        })
        .returning({
          id: table.submissions.id,
          userId: table.submissions.userId,
          questionId: table.submissions.questionId,
          skill: table.submissions.skill,
          status: table.submissions.status,
          score: table.submissions.score,
          band: table.submissions.band,
          completedAt: table.submissions.completedAt,
          createdAt: table.submissions.createdAt,
          updatedAt: table.submissions.updatedAt,
        });

      const sub = assertExists(submission, "Submission");

      // Create submission details
      await tx.insert(table.submissionDetails).values({
        submissionId: sub.id,
        answer: body.answer,
      });

      return mapSubmissionResponse(sub);
    });
  }

  /**
   * Update submission
   * @throws NotFoundError if submission not found
   * @throws ForbiddenError if not the owner
   */
  static async update(
    submissionId: string,
    userId: string,
    isAdmin: boolean,
    body: SubmissionModel.UpdateSubmissionBody,
  ): Promise<SubmissionModel.UpdateSubmissionResponse> {
    return await db.transaction(async (tx) => {
      // Get submission
      const [submission] = await tx
        .select()
        .from(table.submissions)
        .where(
          and(
            eq(table.submissions.id, submissionId),
            isNull(table.submissions.deletedAt),
          ),
        )
        .limit(1);

      if (!submission) {
        throw new NotFoundError("Submission not found");
      }

      // Check ownership
      if (submission.userId !== userId && !isAdmin) {
        throw new ForbiddenError("You can only update your own submissions");
      }

      // Don't allow updates to completed submissions unless admin
      if (submission.status === "completed" && !isAdmin) {
        throw new BadRequestError("Cannot update completed submission");
      }

      // Update submission
      const updateValues: Partial<{
        status: typeof SubmissionStatus.static;
        score: number;
        band: number;
        updatedAt: Date;
        completedAt: Date;
      }> = {
        updatedAt: new Date(),
      };

      if (body.status) {
        updateValues.status = body.status;
        // Only set completedAt when transitioning to completed status
        if (body.status === "completed" && submission.status !== "completed") {
          updateValues.completedAt = new Date();
        }
      }

      if (body.score !== undefined) updateValues.score = body.score;
      if (body.band !== undefined) updateValues.band = body.band;

      const [updatedSubmission] = await tx
        .update(table.submissions)
        .set(updateValues)
        .where(eq(table.submissions.id, submissionId))
        .returning({
          id: table.submissions.id,
          userId: table.submissions.userId,
          questionId: table.submissions.questionId,
          skill: table.submissions.skill,
          status: table.submissions.status,
          score: table.submissions.score,
          band: table.submissions.band,
          completedAt: table.submissions.completedAt,
          createdAt: table.submissions.createdAt,
          updatedAt: table.submissions.updatedAt,
        });

      // Update details if provided
      if (body.answer || body.feedback) {
        const updateDetails: Partial<{
          answer: any;
          feedback: string;
        }> = {};
        if (body.answer) updateDetails.answer = body.answer;
        if (body.feedback) updateDetails.feedback = body.feedback;

        await tx
          .update(table.submissionDetails)
          .set(updateDetails)
          .where(eq(table.submissionDetails.submissionId, submissionId));
      }

      // Get updated details
      const [details] = await tx
        .select()
        .from(table.submissionDetails)
        .where(eq(table.submissionDetails.submissionId, submissionId))
        .limit(1);

      const updatedSub = assertExists(updatedSubmission, "Submission");

      return mapSubmissionResponse(updatedSub, details);
    });
  }

  /**
   * Grade submission (admin/instructor only)
   */
  static async grade(
    submissionId: string,
    body: SubmissionModel.GradeSubmissionBody,
  ): Promise<SubmissionModel.GradeSubmissionResponse> {
    return await db.transaction(async (tx) => {
      // Get submission
      const [submission] = await tx
        .select()
        .from(table.submissions)
        .where(
          and(
            eq(table.submissions.id, submissionId),
            isNull(table.submissions.deletedAt),
          ),
        )
        .limit(1);

      if (!submission) {
        throw new NotFoundError("Submission not found");
      }

      // Update submission to completed
      const [updatedSubmission] = await tx
        .update(table.submissions)
        .set({
          status: "completed",
          score: body.score,
          band: body.band || null,
          updatedAt: new Date(),
          completedAt: new Date(),
        })
        .where(eq(table.submissions.id, submissionId))
        .returning({
          id: table.submissions.id,
          userId: table.submissions.userId,
          questionId: table.submissions.questionId,
          skill: table.submissions.skill,
          status: table.submissions.status,
          score: table.submissions.score,
          band: table.submissions.band,
          completedAt: table.submissions.completedAt,
          createdAt: table.submissions.createdAt,
          updatedAt: table.submissions.updatedAt,
        });

      // Update feedback if provided
      if (body.feedback) {
        await tx
          .update(table.submissionDetails)
          .set({ feedback: body.feedback })
          .where(eq(table.submissionDetails.submissionId, submissionId));
      }

      // Get updated details
      const [details] = await tx
        .select()
        .from(table.submissionDetails)
        .where(eq(table.submissionDetails.submissionId, submissionId))
        .limit(1);

      const updatedSub = assertExists(updatedSubmission, "Submission");

      return mapSubmissionResponse(updatedSub, details);
    });
  }

  /**
   * Delete submission (soft delete)
   */
  static async delete(
    submissionId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<SubmissionModel.DeleteSubmissionResponse> {
    return await db.transaction(async (tx) => {
      // Get submission
      const [submission] = await tx
        .select()
        .from(table.submissions)
        .where(
          and(
            eq(table.submissions.id, submissionId),
            isNull(table.submissions.deletedAt),
          ),
        )
        .limit(1);

      if (!submission) {
        throw new NotFoundError("Submission not found");
      }

      // Check ownership
      if (submission.userId !== userId && !isAdmin) {
        throw new ForbiddenError("You can only delete your own submissions");
      }

      // Soft delete
      await tx
        .update(table.submissions)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(table.submissions.id, submissionId));

      return { id: submissionId };
    });
  }

  /**
   * Auto-grade a submission (for objective questions)
   */
  static async autoGrade(
    submissionId: string,
  ): Promise<{ score: number; result: any }> {
    return await db.transaction(async (tx) => {
      // Get submission with question
      const [submission] = await tx
        .select({
          id: table.submissions.id,
          answer: table.submissionDetails.answer,
          correctAnswer: table.questions.answerKey,
          format: table.questions.format,
        })
        .from(table.submissions)
        .innerJoin(
          table.submissionDetails,
          eq(table.submissions.id, table.submissionDetails.submissionId),
        )
        .innerJoin(
          table.questions,
          eq(table.submissions.questionId, table.questions.id),
        )
        .where(eq(table.submissions.id, submissionId))
        .limit(1);

      if (!submission) {
        throw new NotFoundError("Submission not found");
      }

      let isCorrect = false;
      const userAnswer = submission.answer;
      const correctAnswer = submission.correctAnswer;

      // Enhanced auto-grading based on question format
      switch (submission.format) {
        case "multiple_choice":
          isCorrect =
            JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
          break;
        case "fill_in_blank":
          if (
            typeof userAnswer === "string" &&
            typeof correctAnswer === "string"
          ) {
            isCorrect =
              userAnswer.trim().toLowerCase() ===
              correctAnswer.trim().toLowerCase();
          } else {
            isCorrect =
              JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
          }
          break;
        default: {
          // Fallback to exact match
          const answerStr =
            typeof userAnswer === "string"
              ? userAnswer
              : JSON.stringify(userAnswer);
          const correctAnswerStr =
            typeof correctAnswer === "string"
              ? correctAnswer
              : JSON.stringify(correctAnswer);
          isCorrect =
            answerStr?.trim().toLowerCase() ===
            correctAnswerStr?.trim().toLowerCase();
        }
      }

      const score = isCorrect ? 100 : 0;
      const result = { correct: isCorrect, gradedAt: new Date().toISOString() };

      // Update submission
      await tx
        .update(table.submissions)
        .set({
          status: "completed",
          score,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(table.submissions.id, submissionId));

      await tx
        .update(table.submissionDetails)
        .set({
          result,
        })
        .where(eq(table.submissionDetails.submissionId, submissionId));

      return {
        score,
        result,
      };
    });
  }
}
