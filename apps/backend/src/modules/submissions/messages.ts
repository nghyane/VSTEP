export const SUBMISSION_MESSAGES = {
  viewOwn: "You can only view your own submissions",
  updateOwn: "You can only update your own submissions",
  deleteOwn: "You can only delete your own submissions",
  questionNotActive: "Question is not active",
  cannotUpdateInCurrentStatus: "Cannot update submission in current status",
  invalidTransition: (current: string, next: string) =>
    `Cannot transition from ${current} to ${next}`,
  cannotGradeStatus: (status: string) =>
    `Cannot grade a submission with status "${status}"`,
  cannotAutoGradeStatus: (status: string) =>
    `Cannot auto-grade a submission with status "${status}"`,
  objectiveOnlyAutoGrading:
    "Only listening and reading submissions can be auto-graded",
  noAnswerKeyForAutoGrading: "Question has no answer key for auto-grading",
  incompatibleAnswerFormat: "Answer format incompatible with auto-grading",
} as const;
