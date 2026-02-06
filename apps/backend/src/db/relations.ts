import { relations } from "drizzle-orm";
import {
  mockTestSessionAnswers,
  mockTestSessionSubmissions,
  mockTestSessions,
  mockTests,
} from "./schema/mock-tests";
import { outbox } from "./schema/outbox";
import { userGoals, userProgress, userSkillScores } from "./schema/progress";
import { questions, questionVersions } from "./schema/questions";
import {
  submissionDetails,
  submissionEvents,
  submissions,
} from "./schema/submissions";
import { refreshTokens, users } from "./schema/users";

export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  submissions: many(submissions),
  progress: many(userProgress),
  skillScores: many(userSkillScores),
  goals: many(userGoals),
  mockTestSessions: many(mockTestSessions),
  createdQuestions: many(questions),
  createdMockTests: many(mockTests),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  user: one(users, { fields: [submissions.userId], references: [users.id] }),
  question: one(questions, {
    fields: [submissions.questionId],
    references: [questions.id],
  }),
  details: one(submissionDetails, {
    fields: [submissions.id],
    references: [submissionDetails.submissionId],
  }),
  events: many(submissionEvents),
  outboxEntries: many(outbox),
}));

export const submissionDetailsRelations = relations(
  submissionDetails,
  ({ one }) => ({
    submission: one(submissions, {
      fields: [submissionDetails.submissionId],
      references: [submissions.id],
    }),
  }),
);

export const submissionEventsRelations = relations(
  submissionEvents,
  ({ one }) => ({
    submission: one(submissions, {
      fields: [submissionEvents.submissionId],
      references: [submissions.id],
    }),
  }),
);

export const questionsRelations = relations(questions, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [questions.createdBy],
    references: [users.id],
  }),
  versions: many(questionVersions),
  submissions: many(submissions),
}));

export const questionVersionsRelations = relations(
  questionVersions,
  ({ one }) => ({
    question: one(questions, {
      fields: [questionVersions.questionId],
      references: [questions.id],
    }),
  }),
);

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
}));

export const userSkillScoresRelations = relations(
  userSkillScores,
  ({ one }) => ({
    user: one(users, {
      fields: [userSkillScores.userId],
      references: [users.id],
    }),
    submission: one(submissions, {
      fields: [userSkillScores.submissionId],
      references: [submissions.id],
    }),
  }),
);

export const userGoalsRelations = relations(userGoals, ({ one }) => ({
  user: one(users, { fields: [userGoals.userId], references: [users.id] }),
}));

export const mockTestsRelations = relations(mockTests, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [mockTests.createdBy],
    references: [users.id],
  }),
  sessions: many(mockTestSessions),
}));

export const mockTestSessionsRelations = relations(
  mockTestSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [mockTestSessions.userId],
      references: [users.id],
    }),
    mockTest: one(mockTests, {
      fields: [mockTestSessions.mockTestId],
      references: [mockTests.id],
    }),
    answers: many(mockTestSessionAnswers),
    submissions: many(mockTestSessionSubmissions),
  }),
);

export const mockTestSessionAnswersRelations = relations(
  mockTestSessionAnswers,
  ({ one }) => ({
    session: one(mockTestSessions, {
      fields: [mockTestSessionAnswers.sessionId],
      references: [mockTestSessions.id],
    }),
    question: one(questions, {
      fields: [mockTestSessionAnswers.questionId],
      references: [questions.id],
    }),
  }),
);

export const mockTestSessionSubmissionsRelations = relations(
  mockTestSessionSubmissions,
  ({ one }) => ({
    session: one(mockTestSessions, {
      fields: [mockTestSessionSubmissions.sessionId],
      references: [mockTestSessions.id],
    }),
    submission: one(submissions, {
      fields: [mockTestSessionSubmissions.submissionId],
      references: [submissions.id],
    }),
  }),
);

export const outboxRelations = relations(outbox, ({ one }) => ({
  submission: one(submissions, {
    fields: [outbox.submissionId],
    references: [submissions.id],
  }),
}));
