import { assertAccess, assertExists, now } from "@common/utils";
import { and, count, desc, eq, type SQL, sql } from "drizzle-orm";
import type { Submission } from "@/db";
import { db, notDeleted, pagination, table } from "@/db";
import type { Actor } from "@/plugins/auth";
import { BadRequestError } from "@/plugins/error";

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
  return null; // Below B1 in VSTEP 3-5
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["queued", "failed"],
  queued: ["processing", "failed"],
  processing: ["completed", "review_pending", "error", "failed"],
  review_pending: ["completed"],
  error: ["retrying"],
  retrying: ["processing", "failed"],
  completed: [],
  failed: [],
};

function validateTransition(current: string, next: string) {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed?.includes(next)) {
    throw new BadRequestError(`Cannot transition from ${current} to ${next}`);
  }
}

export class SubmissionService {
  static async getById(submissionId: string, actor: Actor) {
    const row = assertExists(
      await db.query.submissions.findFirst({
        where: and(
          eq(table.submissions.id, submissionId),
          notDeleted(table.submissions),
        ),
        with: { details: true },
      }),
      "Submission",
    );

    assertAccess(row.userId, actor, "You can only view your own submissions");

    const { details, ...submission } = row;
    return {
      ...submission,
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
    actor: Actor,
  ) {
    const pg = pagination(query.page, query.limit);

    const conditions: SQL[] = [notDeleted(table.submissions)];

    if (!actor.is("admin")) {
      conditions.push(eq(table.submissions.userId, actor.sub));
    } else if (query.userId) {
      conditions.push(eq(table.submissions.userId, query.userId));
    }

    if (query.skill) {
      conditions.push(eq(table.submissions.skill, query.skill));
    }

    if (query.status) {
      conditions.push(eq(table.submissions.status, query.status));
    }

    const whereClause = and(...conditions);

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
      .limit(pg.limit)
      .offset(pg.offset);

    return {
      data: submissions,
      meta: pg.meta(total),
    };
  }

  static async create(
    userId: string,
    body: { questionId: string; answer: unknown },
  ) {
    const question = assertExists(
      await db.query.questions.findFirst({
        columns: { id: true, skill: true, isActive: true },
        where: and(
          eq(table.questions.id, body.questionId),
          notDeleted(table.questions),
        ),
      }),
      "Question",
    );

    if (!question.isActive) {
      throw new BadRequestError("Question is not active");
    }

    return db.transaction(async (tx) => {
      const [submission] = await tx
        .insert(table.submissions)
        .values({
          userId,
          questionId: body.questionId,
          skill: question.skill,
          status: "pending",
        })
        .returning(SUBMISSION_COLUMNS);

      const sub = assertExists(submission, "Submission");

      await tx.insert(table.submissionDetails).values({
        submissionId: sub.id,
        answer: body.answer,
      });

      return { ...sub, answer: body.answer, result: null, feedback: null };
    });
  }

  static async update(
    submissionId: string,
    actor: Actor,
    body: {
      answer?: unknown;
      status?: Submission["status"];
      score?: number;
      band?: Submission["band"];
      feedback?: string;
    },
  ) {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(table.submissions)
        .where(
          and(
            eq(table.submissions.id, submissionId),
            notDeleted(table.submissions),
          ),
        )
        .limit(1);

      const submission = assertExists(row, "Submission");

      assertAccess(
        submission.userId,
        actor,
        "You can only update your own submissions",
      );

      const MUTABLE_STATUSES = ["pending", "error"];
      if (!MUTABLE_STATUSES.includes(submission.status) && !actor.is("admin")) {
        throw new BadRequestError("Cannot update submission in current status");
      }

      if (body.status) {
        validateTransition(submission.status, body.status);
      }

      const timestamp = now();
      const updateValues: Partial<typeof table.submissions.$inferInsert> = {
        updatedAt: timestamp,
      };

      if (actor.is("admin")) {
        if (body.status) {
          updateValues.status = body.status;
          if (
            body.status === "completed" &&
            submission.status !== "completed"
          ) {
            updateValues.completedAt = timestamp;
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
        ...updatedSub,
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
    return db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(table.submissions)
        .where(
          and(
            eq(table.submissions.id, submissionId),
            notDeleted(table.submissions),
          ),
        )
        .limit(1);

      const submission = assertExists(row, "Submission");

      if (submission.status === "completed" || submission.status === "failed") {
        throw new BadRequestError(
          `Cannot grade a submission with status "${submission.status}"`,
        );
      }

      if (body.score < 0 || body.score > 10) {
        throw new BadRequestError("Score must be between 0 and 10");
      }
      if (Math.round(body.score * 2) !== body.score * 2) {
        throw new BadRequestError("Score must be in 0.5 increments");
      }

      const timestamp = now();
      const [updatedSubmission] = await tx
        .update(table.submissions)
        .set({
          status: "completed",
          score: body.score,
          band: body.band ?? scoreToBand(body.score),
          updatedAt: timestamp,
          completedAt: timestamp,
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
        ...updatedSub,
        answer: details?.answer,
        result: details?.result,
        feedback: details?.feedback,
      };
    });
  }

  static async remove(submissionId: string, actor: Actor) {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(table.submissions)
        .where(
          and(
            eq(table.submissions.id, submissionId),
            notDeleted(table.submissions),
          ),
        )
        .limit(1);

      const submission = assertExists(row, "Submission");

      assertAccess(
        submission.userId,
        actor,
        "You can only delete your own submissions",
      );

      const timestamp = now();
      await tx
        .update(table.submissions)
        .set({
          deletedAt: timestamp,
          updatedAt: timestamp,
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
    return db.transaction(async (tx) => {
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

      const data = assertExists(row, "Submission");

      if (data.skill !== "listening" && data.skill !== "reading") {
        throw new BadRequestError(
          "Only listening and reading submissions can be auto-graded",
        );
      }

      if (!data.answerKey) {
        throw new BadRequestError(
          "Question has no answer key for auto-grading",
        );
      }

      const { correctCount, totalCount } = data;

      const rawScore = totalCount > 0 ? (correctCount / totalCount) * 10 : 0;
      const score = Math.round(rawScore * 2) / 2;
      const band = scoreToBand(score);

      const timestamp = now();
      const result = {
        correctCount,
        totalCount,
        score,
        band,
        gradedAt: timestamp,
      };

      await tx
        .update(table.submissions)
        .set({
          status: "completed",
          score,
          band,
          completedAt: timestamp,
          updatedAt: timestamp,
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
