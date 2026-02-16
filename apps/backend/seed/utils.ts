import { join } from "node:path";
import { Value } from "@sinclair/typebox/value";
import { t } from "elysia";
import { skillEnum } from "../src/db/schema/enums";
import type { NewQuestion } from "../src/db/schema/questions";
import { ObjectiveAnswerKey } from "../src/db/types/answers";
import { QuestionContent } from "../src/db/types/question-content";

export const SKILLS = skillEnum.enumValues;

const SEED_DIR = join(import.meta.dir, "data");

export interface SeedRecord {
  skill: NewQuestion["skill"];
  part: NewQuestion["part"];
  content: NewQuestion["content"];
  answerKey: NewQuestion["answerKey"];
  metadata: { source: string; [key: string]: unknown };
}

const SeedRecordSchema = t.Object({
  skill: t.String(),
  part: t.Integer({ minimum: 1, maximum: 4 }),
  content: QuestionContent,
  answerKey: t.Union([ObjectiveAnswerKey, t.Null()]),
  metadata: t.Object({ source: t.String() }, { additionalProperties: true }),
});

/** Read all JSON seed files for a given skill, sorted by filename. Validates each against TypeBox schemas. */
export async function readSeedFiles(skill: string): Promise<SeedRecord[]> {
  const dir = join(SEED_DIR, skill);
  const glob = new Bun.Glob("*.json");
  const paths: string[] = [];
  for await (const path of glob.scan(dir)) {
    paths.push(path);
  }
  paths.sort();

  const records: SeedRecord[] = [];
  for (const file of paths) {
    const raw = await Bun.file(join(dir, file)).json();
    if (!Value.Check(SeedRecordSchema, raw)) {
      const errors = [...Value.Errors(SeedRecordSchema, raw)];
      const detail = errors.map((e) => `  ${e.path}: ${e.message}`).join("\n");
      throw new Error(`Invalid seed data in ${skill}/${file}:\n${detail}`);
    }
    records.push(raw as SeedRecord);
  }
  return records;
}

/** Hash a password using Bun.password (Argon2id) */
export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, "argon2id");
}

/** Print a section header */
export function logSection(name: string): void {
  console.log(`\n▸ ${name}`);
}

/** Print a result line */
export function logResult(label: string, count: number): void {
  console.log(`  ${label}: ${count} records`);
}
