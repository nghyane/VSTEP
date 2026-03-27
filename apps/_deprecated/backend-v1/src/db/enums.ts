/**
 * Shared TypeBox enums derived from Drizzle pgEnums.
 * Single source of truth — import from here instead of redefining in controllers.
 */

import {
  examSkillEnum,
  examTypeEnum,
  knowledgePointCategoryEnum,
  placementConfidenceEnum,
  placementSourceEnum,
  questionLevelEnum,
  skillEnum,
  vstepBandEnum,
} from "@db/schema/enums";
import { submissionStatusEnum } from "@db/schema/submissions";
import { userRoleEnum } from "@db/schema/users";
import { t } from "elysia";

export const UserRole = t.UnionEnum(userRoleEnum.enumValues);
export const Skill = t.UnionEnum(skillEnum.enumValues, { default: undefined });
export const QuestionLevel = t.UnionEnum(questionLevelEnum.enumValues, {
  default: undefined,
});
export const VstepBand = t.UnionEnum(vstepBandEnum.enumValues, {
  default: undefined,
});
export const SubmissionStatus = t.UnionEnum(submissionStatusEnum.enumValues, {
  default: undefined,
});
export const KnowledgePointCategory = t.UnionEnum(
  knowledgePointCategoryEnum.enumValues,
  { default: undefined },
);
export const PlacementSource = t.UnionEnum(placementSourceEnum.enumValues, {
  default: undefined,
});
export const PlacementConfidence = t.UnionEnum(
  placementConfidenceEnum.enumValues,
  { default: undefined },
);
export const ExamType = t.UnionEnum(examTypeEnum.enumValues, {
  default: undefined,
});
export const ExamSkill = t.UnionEnum(examSkillEnum.enumValues, {
  default: undefined,
});
