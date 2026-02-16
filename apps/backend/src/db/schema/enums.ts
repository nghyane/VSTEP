/**
 * Shared PostgreSQL enums used across multiple schema files.
 * Extracted to break import cycles between schema modules.
 */
import { pgEnum } from "drizzle-orm/pg-core";

export const skillEnum = pgEnum("skill", [
  "listening",
  "reading",
  "writing",
  "speaking",
]);

export const SKILLS = skillEnum.enumValues;
export type Skill = (typeof SKILLS)[number];

export const questionLevelEnum = pgEnum("question_level", [
  "A2",
  "B1",
  "B2",
  "C1",
]);

export const knowledgePointCategoryEnum = pgEnum("knowledge_point_category", [
  "grammar",
  "vocabulary",
  "strategy",
]);

export const vstepBandEnum = pgEnum("vstep_band", [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
]);
