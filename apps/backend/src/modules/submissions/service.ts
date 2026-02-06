import { assertExists, serializeDates } from "@common/utils";
import { and, count, desc, eq, sql } from "drizzle-orm";
import type { Submission } from "@/db";
import { db, notDeleted, paginate, paginationMeta, table } from "@/db";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/plugins/error";

const SUBMISSION_COLUMNS = {
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
} as const;

function scoreToBand(score: number): Submission["band"] {
  if (score >= 8.5) return "C1";
  if (score >= 6.0) return "B2";
  if (score >= 4.0) return "B1";
  if (score >= 2.0) return "A2";
  return "A1";
}

export abstract class SubmissionService {
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
      columns: {
        id: true,
        userId: true,
        questionId: true,
        skill: true,
        status: true,
        score: true,
        band: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
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

    return {
      ...serializeDates(submission),
      answer: details?.answer,
      result: details?.result,
      feedback: details?.feedback,
    };
  }

  static async list(
    query: {
      page?: number;
      limit?: number;
      skill?: Submission["skill"];
      status?: Submission["status"];
      userId?: string;
    },
    currentUserId: string,
    isAdmin: boolean,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { limit: safeLimit, offset } = paginate(page, limit);

    const conditions: ReturnType<typeof and>[] = [
      notDeleted(table.submissions),
    ];

    if (!isAdmin) {
      conditions.push(eq(table.submissions.userId, currentUserId));
    } else if (query.userId) {
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

    const [countResult] = await db
      .select({ count: count() })
      .from(table.submissions)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    const submissions = await db
      .select({
        ...SUBMISSION_COLUMNS,
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
      data: submissions.map((s) => serializeDates(s)),
      meta: paginationMeta(total, page, limit),
    };
  }

  static async create(
    userId: string,
    body: { questionId: string; skill: Submission["skill"]; answer: unknown },
  ) {
    const question = await db.query.questions.findFirst({
      columns: { id: true, isActive: true },
      where: and(
        eq(table.questions.id, body.questionId),
        notDeleted(table.questions),
      ),
    });

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    if (!question.isActive) {
      throw new BadRequestError("Question is not active");
    }

    return await db.transaction(async (tx) => {
      const [submission] = await tx
        .insert(table.submissions)
        .values({
          userId,
          questionId: body.questionId,
          skill: body.skill,
          status: "pending",
        })
        .returning(SUBMISSION_COLUMNS);

      const sub = assertExists(submission, "Submission");

      await tx.insert(table.submissionDetails).values({
        submissionId: sub.id,
        answer: body.answer,
      });

      return serializeDates(sub);
    });
  }

  static async update(
    submissionId: string,
    userId: string,
    isAdmin: boolean,
    body: {
      answer?: unknown;
      status?: Submission["status"];
      score?: number;
      band?: Submission["band"];
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

      const updateValues: Partial<typeof table.submissions.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (isAdmin) {
        if (body.status) {
          updateValues.status = body.status;
          if (
            body.status === "completed" &&
            submission.status !== "completed"
          ) {
            updateValues.completedAt = new Date();
          }
        }
        if (body.score !== undefined) updateValues.score = body.score;
        if (body.band !== undefined) updateValues.band = body.band;
      }

      const [updatedSubmission] = await tx
        .update(table.submissions)
        .set(updateValues)
        .where(eq(table.submissions.id, submissionId))
        .returning(SUBMISSION_COLUMNS);

      if (body.answer !== undefined || body.feedback !== undefined) {
        const updateDetails: Partial<
          typeof table.submissionDetails.$inferInsert
        > = {};
        if (body.answer !== undefined) updateDetails.answer = body.answer;
        if (body.feedback !== undefined) updateDetails.feedback = body.feedback;

        await tx
          .update(table.submissionDetails)
          .set(updateDetails)
          .where(eq(table.submissionDetails.submissionId, submissionId));
      }

      const [details] = await tx
        .select()
        .from(table.submissionDetails)
        .where(eq(table.submissionDetails.submissionId, submissionId))
        .limit(1);

      const updatedSub = assertExists(updatedSubmission, "Submission");

      return {
        ...serializeDates(updatedSub),
        answer: details?.answer,
        result: details?.result,
        feedback: details?.feedback,
      };
    });
  }

  static async grade(
    submissionId: string,
    body: { score: number; band?: Submission["band"]; feedback?: string },
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

      if (submission.status === "completed" || submission.status === "failed") {
        throw new BadRequestError(
          `Cannot grade a submission with status "${submission.status}"`,
        );
      }

      if (body.score < 0 || body.score > 10) {
        throw new BadRequestError("Score must be between 0 and 10");
      }
      if (body.score % 0.5 !== 0) {
        throw new BadRequestError("Score must be in 0.5 increments");
      }

      const [updatedSubmission] = await tx
        .update(table.submissions)
        .set({
          status: "completed",
          score: body.score,
          band: body.band ?? scoreToBand(body.score),
          updatedAt: new Date(),
          completedAt: new Date(),
        })
        .where(eq(table.submissions.id, submissionId))
        .returning(SUBMISSION_COLUMNS);

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

      return {
        ...serializeDates(updatedSub),
        answer: details?.answer,
        result: details?.result,
        feedback: details?.feedback,
      };
    });
  }

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
   * Auto-grade a submission (for listening/reading objective questions).
   * Uses PostgreSQL JSONB per-item comparison instead of JS-side JSON.stringify.
   * Score: (correctCount / totalCount) * 10, rounded to nearest 0.5
   */
  static async autoGrade(
    submissionId: string,
  ): Promise<{ score: number; result: unknown }> {
    return await db.transaction(async (tx) => {
      const [row] = await tx
        .select({
          id: table.submissions.id,
          skill: table.submissions.skill,
          answerKey: table.questions.answerKey,
          correctCount: sql<number>`(
            SELECT count(*)
            FROM jsonb_each_text(${table.questions.answerKey} -> 'correctAnswers') ak
            JOIN jsonb_each_text(${table.submissionDetails.answer} -> 'answers') ua
              ON ak.key = ua.key
            WHERE lower(trim(ua.value)) = lower(trim(ak.value))
          )::int`,
          totalCount: sql<number>`(
            SELECT count(*)
            FROM jsonb_each_text(${table.questions.answerKey} -> 'correctAnswers')
          )::int`,
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

      if (!row) {
        throw new NotFoundError("Submission not found");
      }

      if (row.skill !== "listening" && row.skill !== "reading") {
        throw new BadRequestError(
          "Only listening and reading submissions can be auto-graded",
        );
      }

      if (!row.answerKey) {
        throw new BadRequestError(
          "Question has no answer key for auto-grading",
        );
      }

      const { correctCount, totalCount } = row;

      const rawScore = totalCount > 0 ? (correctCount / totalCount) * 10 : 0;
      const score = Math.round(rawScore * 2) / 2;
      const band = scoreToBand(score);

      const result = {
        correctCount,
        totalCount,
        score,
        band,
        gradedAt: new Date().toISOString(),
      };

      await tx
        .update(table.submissions)
        .set({
          status: "completed",
          score,
          band,
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
