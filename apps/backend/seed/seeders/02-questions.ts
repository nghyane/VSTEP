import type { DbTransaction } from "../../src/db/index";
import { table } from "../../src/db/schema/index";
import type { NewQuestion } from "../../src/db/schema/questions";
import {
  logResult,
  logSection,
  readSeedFiles,
  type SeedRecord,
  SKILLS,
} from "../utils";

export interface SeededQuestions {
  all: Array<{ id: string; skill: string; part: number }>;
}

export async function seedQuestions(
  db: DbTransaction,
  adminId: string,
): Promise<SeededQuestions> {
  logSection("Questions");

  const allRecords = (await Promise.all(SKILLS.map(readSeedFiles))).flat();
  const values = allRecords.map((r) => toQuestion(r, adminId));

  const inserted = await db.insert(table.questions).values(values).returning({
    id: table.questions.id,
    skill: table.questions.skill,
    part: table.questions.part,
  });

  for (const skill of SKILLS) {
    const count = inserted.filter((r) => r.skill === skill).length;
    if (count > 0) logResult(`  ${skill}`, count);
  }
  logResult("Total questions", inserted.length);

  return { all: inserted };
}

function toQuestion(record: SeedRecord, createdBy: string): NewQuestion {
  return {
    skill: record.skill,
    part: record.part,
    content: record.content,
    answerKey: record.answerKey,
    createdBy,
  };
}
