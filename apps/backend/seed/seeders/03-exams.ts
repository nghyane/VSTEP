import type { DbTransaction } from "../../src/db/index";
import type { NewExam } from "../../src/db/schema/exams";
import { table } from "../../src/db/schema/index";
import type { ExamBlueprint } from "../../src/db/types/grading";
import { logResult, logSection, SKILLS } from "../utils";
import type { SeededQuestions } from "./02-questions";

type Level = NewExam["level"];

export interface SeededExams {
  all: Array<{ id: string; level: string }>;
}

export async function seedExams(
  db: DbTransaction,
  adminId: string,
  questions: SeededQuestions["all"],
): Promise<SeededExams> {
  logSection("Exams");

  const levels: Level[] = ["B1", "B2"];
  const examsToInsert: NewExam[] = levels.map((level) => ({
    level,
    blueprint: buildBlueprint(questions, level),
    isActive: true,
    createdBy: adminId,
  }));

  const inserted = await db
    .insert(table.exams)
    .values(examsToInsert)
    .returning({ id: table.exams.id, level: table.exams.level });

  for (const exam of inserted) {
    console.log(`  ${exam.level} exam: ${exam.id}`);
  }

  logResult("Exams", inserted.length);

  return { all: inserted };
}

function buildBlueprint(
  questions: SeededQuestions["all"],
  level: string,
): ExamBlueprint {
  const blueprint: ExamBlueprint = { durationMinutes: 150 };

  for (const skill of SKILLS) {
    const ids = questions
      .filter((q) => q.skill === skill && q.level === level)
      .map((q) => q.id);
    if (ids.length > 0) {
      blueprint[skill] = { questionIds: ids };
    }
  }

  return blueprint;
}
