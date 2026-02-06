/**
 * Submissions Module Service
 * Business logic for submission management
 */

import { assertExists } from "@common/utils";
import { and, count, desc, eq } from "drizzle-orm";
import { db, notDeleted, paginate, paginationMeta, table } from "@/db";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/plugins/error";

// ─── Response mapper ────────────────────────────────────────────

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
  details?: {
    answer?: unknown;
    result?: unknown;
    feedback?: string | null;
  },
) => ({
  id: sub.id,
  userId: sub.userId,
  questionId: sub.questionId,
  skill: sub.skill,
  status: sub.status,
  score: sub.score ?? undefined,
  band: sub.band ?? undefined,
  completedAt: sub.completedAt?.toISOString() ?? undefined,
  createdAt: sub.createdAt.toISOString(),
  updatedAt: sub.updatedAt.toISOString(),
  answer: details?.answer,
  result: details?.result,
  feedback: details?.feedback ?? undefined,
});

// ─── Service ────────────────────────────────────────────────────

export abstract class SubmissionService {
  /**
   * Get submission by ID
   */
  static async getById(
    submissionId: string,
    currentUserId: string,
    isAdmin: boolean,
  ) {
    const submission = await db.query.submissions.findFirst({
      where: and(
        eq(table.submissions.id, submissionId),
        notDeleted(table.submissions),
      ),
    });

    if (!submission) {
      throw new NotFoundError("Submission not found");
    }

    if (!isAdmin && submission.userId !== currentUserId) {
      throw new ForbiddenError("You can only view your own submissions");
    }

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
    query: {
      page?: number;
      limit?: number;
      skill?: string;
      status?: string;
      userId?: string;
    },
    currentUserId: string,
    isAdmin: boolean,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const { limit: safeLimit, offset } = paginate(page, limit);

    // Build where conditions
    const conditions: ReturnType<typeof and>[] = [
      notDeleted(table.submissions),
    ];

    // Non-admin users can only see their own submissions
    if (!isAdmin) {
      conditions.push(eq(table.submissions.userId, currentUserId));
    } else if (query.userId) {
      conditions.push(eq(table.submissions.userId, query.userId));
    }

    if (query.skill) {
      conditions.push(eq(table.submissions.skill, query.skill as any));
    }

    if (query.status) {
      conditions.push(eq(table.submissions.status, query.status as any));
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
      .limit(safeLimit)
      .offset(offset);

    return {
      data: submissions.map((s) =>
        mapSubmissionResponse(
          {
            id: s.id,
            userId: s.userId,
            questionId: s.questionId,
            skill: s.skill,
            status: s.status,
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
      meta: paginationMeta(total, page, limit),
    };
  }

  /**
   * Create new submission
   */
  static async create(
    userId: string,
    body: { questionId: string; skill: string; answer: unknown },
  ) {
    // Validate question exists
    const question = await db.query.questions.findFirst({
      columns: { id: true },
      where: and(
        eq(table.questions.id, body.questionId),
        notDeleted(table.questions),
      ),
    });

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
          skill: body.skill as any,
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
   */
  static async update(
    submissionId: string,
    userId: string,
    isAdmin: boolean,
    body: {
      answer?: unknown;
      status?: string;
      score?: number;
      band?: number;
      feedback?: string;
    },
  ) {
    return await db.transaction(async (tx) => {
      const [submission] = await tx
        .select()
        .from(table.submissions)
        .where(
          and(
            eq(table.submissions.id, submissionId),
            notDeleted(table.submissions),
          ),
        )
        .limit(1);

      if (!submission) {
        throw new NotFoundError("Submission not found");
      }

      if (submission.userId !== userId && !isAdmin) {
        throw new ForbiddenError("You can only update your own submissions");
      }

      if (submission.status === "completed" && !isAdmin) {
        throw new BadRequestError("Cannot update completed submission");
      }

      // Update submission
      const updateValues: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (body.status) {
        updateValues.status = body.status;
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
        const updateDetails: Record<string, unknown> = {};
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
   * Grade submission (instructor/admin only)
   */
  static async grade(
    submissionId: string,
    body: { score: number; band?: number; feedback?: string },
  ) {
    return await db.transaction(async (tx) => {
      const [submission] = await tx
        .select()
        .from(table.submissions)
        .where(
          and(
            eq(table.submissions.id, submissionId),
            notDeleted(table.submissions),
          ),
        )
        .limit(1);

      if (!submission) {
        throw new NotFoundError("Submission not found");
      }

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

      if (body.feedback) {
        await tx
          .update(table.submissionDetails)
          .set({ feedback: body.feedback })
          .where(eq(table.submissionDetails.submissionId, submissionId));
      }

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
   * Remove submission (soft delete)
   */
  static async remove(submissionId: string, userId: string, isAdmin: boolean) {
    return await db.transaction(async (tx) => {
      const [submission] = await tx
        .select()
        .from(table.submissions)
        .where(
          and(
            eq(table.submissions.id, submissionId),
            notDeleted(table.submissions),
          ),
        )
        .limit(1);

      if (!submission) {
        throw new NotFoundError("Submission not found");
      }

      if (submission.userId !== userId && !isAdmin) {
        throw new ForbiddenError("You can only delete your own submissions");
      }

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
  ): Promise<{ score: number; result: unknown }> {
    return await db.transaction(async (tx) => {
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
        .set({ result })
        .where(eq(table.submissionDetails.submissionId, submissionId));

      return { score, result };
    });
  }
}
