// ── Auth ────────────────────────────────────────────────────────────
export const AUTH_MESSAGES = {
  invalidCredentials: "Invalid email or password",
  emailAlreadyRegistered: "Email already registered",
  tokenInvalid: "Invalid refresh token",
  tokenExpired: "Refresh token expired",
  tokenReuseDetected: "Refresh token reuse detected, all sessions revoked",
  userNotFound: "User not found",
} as const;

// ── Users ───────────────────────────────────────────────────────────
export const USER_MESSAGES = {
  viewOwnProfile: "You can only view your own profile",
  updateOwnProfile: "You can only update your own profile",
  changeOwnPassword: "You can only change your own password",
  emailAlreadyRegistered: "Email already registered",
  adminRoleOnly: "Only admins can change user roles",
  emailInUse: "Email already in use",
  incorrectPassword: "Current password is incorrect",
} as const;

// ── Questions ───────────────────────────────────────────────────────
export const QUESTION_MESSAGES = {
  updateOwn: "You can only update your own questions",
  versionOwn: "You can only create versions of your own questions",
  deleteOwn: "You can only delete your own questions",
  notDeleted: "Question is not deleted",
} as const;

// ── Submissions ─────────────────────────────────────────────────────
export const SUBMISSION_MESSAGES = {
  viewOwn: "You can only view your own submissions",
  updateOwn: "You can only update your own submissions",
  deleteOwn: "You can only delete your own submissions",
  questionNotActive: "Question is not active",
  cannotUpdateInCurrentStatus: "Cannot update submission in current status",
  objectiveOnlyAutoGrading:
    "Only listening and reading submissions can be auto-graded",
  noAnswerKeyForAutoGrading: "Question has no answer key for auto-grading",
  incompatibleAnswerFormat: "Answer format incompatible with auto-grading",
} as const;

// ── Exams ───────────────────────────────────────────────────────────
export const EXAM_MESSAGES = {
  notActive: "Exam is not active",
  sessionNotInProgress: "Session is not in progress",
  noSessionAccess: "You do not have access to this session",
  invalidOrInactiveQuestion: "Invalid or inactive question",
  noAnswers: "No answers found for this session",
} as const;
