export const EXAM_MESSAGES = {
  notActive: "Exam is not active",
  sessionNotInProgress: "Session is not in progress",
  noSessionAccess: "You do not have access to this session",
  invalidOrInactiveQuestion: "Invalid or inactive question",
  noAnswers: "No answers found for this session",
  blueprintMissingQuestions: (ids: string[]) =>
    `Blueprint references non-existent or inactive questions: [${ids.join(", ")}]`,
  invalidQuestions: (ids: string[]) =>
    `Invalid or inactive questions: ${ids.join(", ")}`,
  questionNotFoundDuringGrading: (id: string) =>
    `Question ${id} not found during grading`,
} as const;
