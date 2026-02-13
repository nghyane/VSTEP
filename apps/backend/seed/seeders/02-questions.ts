import { table } from "../../src/db/schema/index";
import type { NewQuestion } from "../../src/db/schema/questions";
import {
  type Db,
  logResult,
  logSection,
  readSeedFiles,
  type SeedRecord,
  SKILLS,
} from "../utils";

export interface SeededQuestions {
  all: Array<{ id: string; skill: string; level: string }>;
}

export async function seedQuestions(
  db: Db,
  adminId: string,
): Promise<SeededQuestions> {
  logSection("Questions");

  const allRecords = (await Promise.all(SKILLS.map(readSeedFiles))).flat();
  const values = allRecords.map((r) => toQuestion(r, adminId));

  const inserted = await db.insert(table.questions).values(values).returning({
    id: table.questions.id,
    skill: table.questions.skill,
    level: table.questions.level,
  });

  const versions = inserted.map((row, i) => ({
    questionId: row.id,
    version: 1,
    content: allRecords[i].content,
    answerKey: allRecords[i].answerKey,
  }));
  await db.insert(table.questionVersions).values(versions);

  for (const skill of SKILLS) {
    const count = inserted.filter((r) => r.skill === skill).length;
    if (count > 0) logResult(`  ${skill}`, count);
  }
  logResult("Total questions", inserted.length);
  logResult("Question versions", versions.length);

  return { all: inserted };
}

function toQuestion(record: SeedRecord, createdBy: string): NewQuestion {
  return {
    skill: record.skill,
    level: record.level,
    format: record.format,
    content: record.content,
    answerKey: record.answerKey,
    createdBy,
  };
}
