/**
 * Shared TypeBox enums derived from Drizzle pgEnums.
 * Single source of truth — import from here instead of redefining in controllers.
 */
import { questionFormatEnum, questionLevelEnum } from "@db/schema/questions";
import {
  skillEnum,
  submissionStatusEnum,
  vstepBandEnum,
} from "@db/schema/submissions";
import { userRoleEnum } from "@db/schema/users";
import { t } from "elysia";

export const UserRole = t.UnionEnum(userRoleEnum.enumValues);
export const Skill = t.UnionEnum(skillEnum.enumValues);
export const SKILLS = skillEnum.enumValues;
export const QuestionFormat = t.UnionEnum(questionFormatEnum.enumValues);
export const QuestionLevel = t.UnionEnum(questionLevelEnum.enumValues);
export const VstepBand = t.UnionEnum(vstepBandEnum.enumValues);
export const SubmissionStatus = t.UnionEnum(submissionStatusEnum.enumValues);
