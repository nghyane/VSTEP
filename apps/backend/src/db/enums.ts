/**
 * Shared TypeBox enums derived from Drizzle pgEnums.
 * Single source of truth — import from here instead of redefining in controllers.
 */

import { skillEnum, vstepBandEnum } from "@db/schema/enums";
import { questionFormatEnum, questionLevelEnum } from "@db/schema/questions";
import { submissionStatusEnum } from "@db/schema/submissions";
import { userRoleEnum } from "@db/schema/users";
import { t } from "elysia";

export const UserRole = t.UnionEnum(userRoleEnum.enumValues);
export const Skill = t.UnionEnum(skillEnum.enumValues, { default: undefined });
export const QuestionFormat = t.UnionEnum(questionFormatEnum.enumValues, {
  default: undefined,
});
export const QuestionLevel = t.UnionEnum(questionLevelEnum.enumValues, {
  default: undefined,
});
export const VstepBand = t.UnionEnum(vstepBandEnum.enumValues, {
  default: undefined,
});
export const SubmissionStatus = t.UnionEnum(submissionStatusEnum.enumValues, {
  default: undefined,
});
