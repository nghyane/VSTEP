/**
 * All tables for Drizzle ORM initialization
 * Import this when creating the database client
 */

// Mock Tests
import {
  mockTestSessionAnswers,
  mockTestSessionSubmissions,
  mockTestSessions,
  mockTests,
} from "./mock-tests";
// Integration
import { outbox, processedCallbacks } from "./outbox";
// Progress
import { userGoals, userProgress, userSkillScores } from "./progress";
// Questions
import { questions, questionVersions } from "./questions";
// Submissions
import {
  submissionDetails,
  submissionEvents,
  submissions,
} from "./submissions";
// Users
import { refreshTokens, users } from "./users";

export const schema = {
  // Users
  users,
  refreshTokens,

  // Submissions
  submissions,
  submissionDetails,
  submissionEvents,

  // Questions
  questions,
  questionVersions,

  // Integration
  outbox,
  processedCallbacks,

  // Progress
  userProgress,
  userSkillScores,
  userGoals,

  // Mock Tests
  mockTests,
  mockTestSessions,
  mockTestSessionAnswers,
  mockTestSessionSubmissions,
};
