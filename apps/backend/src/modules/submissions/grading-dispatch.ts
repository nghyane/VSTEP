import { logger } from "@common/logger";
import type { DbTransaction } from "@db/index";
import { table } from "@db/index";
import type { Skill } from "@db/schema/enums";
import { redis } from "bun";
import { eq } from "drizzle-orm";

const GRADING_QUEUE = "grading:tasks";

export interface Task {
  submissionId: string;
  questionId: string;
  skill: Skill;
  answer: unknown;
  dispatchedAt: string;
}

/** Mark submission as processing inside the transaction. Returns a task to dispatch after commit. */
export async function prepare(
  tx: DbTransaction,
  submissionId: string,
  skill: Skill,
  questionId: string,
  answer: unknown,
): Promise<Task> {
  const ts = new Date().toISOString();
  await tx
    .update(table.submissions)
    .set({ status: "processing", updatedAt: ts })
    .where(eq(table.submissions.id, submissionId));
  return { submissionId, questionId, skill, answer, dispatchedAt: ts };
}

/** Push collected tasks to Redis. Call AFTER transaction commits. */
export async function dispatch(tasks: Task[]) {
  if (tasks.length === 0) return;
  await Promise.all(
    tasks.map((task) =>
      redis.send("LPUSH", [GRADING_QUEUE, JSON.stringify(task)]),
    ),
  );
  for (const task of tasks) {
    logger.info("Dispatched grading task", {
      submissionId: task.submissionId,
      skill: task.skill,
    });
  }
}
