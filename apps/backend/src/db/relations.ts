import { relations } from "drizzle-orm";
import {
  examAnswers,
  examSessions,
  examSubmissions,
  exams,
} from "./schema/exams";
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
  examSessions: many(examSessions),
  createdQuestions: many(questions),
  createdExams: many(exams),
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

export const examsRelations = relations(exams, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [exams.createdBy],
    references: [users.id],
  }),
  sessions: many(examSessions),
}));

export const examSessionsRelations = relations(
  examSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [examSessions.userId],
      references: [users.id],
    }),
    exam: one(exams, {
      fields: [examSessions.examId],
      references: [exams.id],
    }),
    answers: many(examAnswers),
    submissions: many(examSubmissions),
  }),
);

export const examAnswersRelations = relations(examAnswers, ({ one }) => ({
  session: one(examSessions, {
    fields: [examAnswers.sessionId],
    references: [examSessions.id],
  }),
  question: one(questions, {
    fields: [examAnswers.questionId],
    references: [questions.id],
  }),
}));

export const examSubmissionsRelations = relations(
  examSubmissions,
  ({ one }) => ({
    session: one(examSessions, {
      fields: [examSubmissions.sessionId],
      references: [examSessions.id],
    }),
    submission: one(submissions, {
      fields: [examSubmissions.submissionId],
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
