/**
 * Shared TypeBox enums derived from Drizzle pgEnums.
 * Single source of truth — import from here instead of redefining in controllers.
 */
import { examStatusEnum } from "@db/schema/exams";
import { streakDirectionEnum } from "@db/schema/progress";
import { questionFormatEnum, questionLevelEnum } from "@db/schema/questions";
import {
  gradingModeEnum,
  reviewPriorityEnum,
  skillEnum,
  submissionStatusEnum,
  vstepBandEnum,
} from "@db/schema/submissions";
import { userRoleEnum } from "@db/schema/users";
import { t } from "elysia";

/** Convert a Drizzle pgEnum's values array into an Elysia UnionEnum schema. */
function enumSchema<const T extends readonly [string, ...string[]]>(values: T) {
  return t.UnionEnum(values);
}

export const UserRole = enumSchema(userRoleEnum.enumValues);
export const Skill = enumSchema(skillEnum.enumValues);
export const QuestionFormat = enumSchema(questionFormatEnum.enumValues);
export const QuestionLevel = enumSchema(questionLevelEnum.enumValues);
export const VstepBand = enumSchema(vstepBandEnum.enumValues);
export const SubmissionStatus = enumSchema(submissionStatusEnum.enumValues);
export const ReviewPriority = enumSchema(reviewPriorityEnum.enumValues);
export const GradingMode = enumSchema(gradingModeEnum.enumValues);
export const ExamStatus = enumSchema(examStatusEnum.enumValues);
export const StreakDirection = enumSchema(streakDirectionEnum.enumValues);
