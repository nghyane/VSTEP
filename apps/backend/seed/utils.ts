import { join } from "node:path";
import { Value } from "@sinclair/typebox/value";
import { t } from "elysia";
import type { Skill } from "../src/db/schema/enums";
import { skillEnum } from "../src/db/schema/enums";
import type { NewQuestion } from "../src/db/schema/questions";
import { ObjectiveAnswerKey } from "../src/db/types/answers";
import {
  CONTENT_MAP,
  OBJECTIVE_SKILLS,
  VALID_PARTS,
} from "../src/db/types/question-content";

export const SKILLS = skillEnum.enumValues;

const SEED_DIR = join(import.meta.dir, "data");

export interface SeedRecord {
  skill: NewQuestion["skill"];
  part: NewQuestion["part"];
  content: NewQuestion["content"];
  answerKey: NewQuestion["answerKey"];
  metadata: { source: string; [key: string]: unknown };
}

const MetadataSchema = t.Object(
  { source: t.String() },
  { additionalProperties: true },
);

function validateSeedRecord(
  raw: unknown,
  skill: string,
  file: string,
): SeedRecord {
  const obj = raw as Record<string, unknown>;
  const sk = obj.skill as Skill;
  const part = obj.part as number;
  const key = `${sk}:${part}`;

  const validParts: readonly number[] = VALID_PARTS[sk];
  if (!validParts?.includes(part))
    throw new Error(
      `${skill}/${file}: invalid part ${part} for ${sk} (valid: ${validParts?.join(", ")})`,
    );

  const contentSchema = CONTENT_MAP[key];
  if (!contentSchema || !Value.Check(contentSchema, obj.content)) {
    const errors = contentSchema
      ? [...Value.Errors(contentSchema, obj.content)]
      : [];
    const detail = errors.map((e) => `  ${e.path}: ${e.message}`).join("\n");
    throw new Error(
      `${skill}/${file}: content does not match ${key} schema\n${detail}`,
    );
  }

  if (
    OBJECTIVE_SKILLS.has(sk) &&
    !Value.Check(ObjectiveAnswerKey, obj.answerKey)
  )
    throw new Error(
      `${skill}/${file}: objective skill ${sk} requires a valid answerKey`,
    );

  if (!OBJECTIVE_SKILLS.has(sk) && obj.answerKey != null)
    throw new Error(
      `${skill}/${file}: subjective skill ${sk} must not have answerKey`,
    );

  if (!Value.Check(MetadataSchema, obj.metadata))
    throw new Error(`${skill}/${file}: invalid metadata`);

  return obj as unknown as SeedRecord;
}

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
    records.push(validateSeedRecord(raw, skill, file));
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
