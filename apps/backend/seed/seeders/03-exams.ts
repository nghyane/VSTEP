import type { NewExam } from "../../src/db/schema/exams";
import { table } from "../../src/db/schema/index";
import type { ExamBlueprint } from "../../src/db/types/grading";
import { type Db, logResult, logSection, SKILLS } from "../utils";
import type { SeededQuestions } from "./02-questions";

type Level = NewExam["level"];

export async function seedExams(
  db: Db,
  adminId: string,
  questions: SeededQuestions["all"],
): Promise<void> {
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
}

function buildBlueprint(
  questions: SeededQuestions["all"],
  level: string,
): ExamBlueprint {
  const blueprint: ExamBlueprint = { durationMinutes: 150 };

  for (const skill of SKILLS) {
    const match = questions.find((q) => q.skill === skill && q.level === level);
    if (match) {
      blueprint[skill] = { questionIds: [match.id] };
    }
  }

  return blueprint;
}
