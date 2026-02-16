import { relations } from "drizzle-orm";
import { classes, classMembers, instructorFeedback } from "./schema/classes";
import {
  examAnswers,
  examSessions,
  examSubmissions,
  exams,
} from "./schema/exams";
import {
  knowledgePoints,
  questionKnowledgePoints,
} from "./schema/knowledge-points";
import {
  userGoals,
  userKnowledgeProgress,
  userProgress,
  userSkillScores,
} from "./schema/progress";
import { questions } from "./schema/questions";
import { submissionDetails, submissions } from "./schema/submissions";
import { refreshTokens, users } from "./schema/users";

export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  submissions: many(submissions),
  progress: many(userProgress),
  skillScores: many(userSkillScores),
  goals: many(userGoals),
  knowledgeProgress: many(userKnowledgeProgress),
  examSessions: many(examSessions),
  createdQuestions: many(questions),
  createdExams: many(exams),
  ownedClasses: many(classes),
  classMemberships: many(classMembers),
  feedbackGiven: many(instructorFeedback, { relationName: "feedbackFrom" }),
  feedbackReceived: many(instructorFeedback, { relationName: "feedbackTo" }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  user: one(users, { fields: [submissions.userId], references: [users.id] }),
  details: one(submissionDetails, {
    fields: [submissions.id],
    references: [submissionDetails.submissionId],
  }),
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

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export const questionsRelations = relations(questions, ({ one, many }) => ({
  creator: one(users, {
    fields: [questions.createdBy],
    references: [users.id],
  }),
  knowledgePoints: many(questionKnowledgePoints),
}));

// ---------------------------------------------------------------------------
// Knowledge Points
// ---------------------------------------------------------------------------

export const knowledgePointsRelations = relations(
  knowledgePoints,
  ({ many }) => ({
    questions: many(questionKnowledgePoints),
    userProgress: many(userKnowledgeProgress),
  }),
);

export const questionKnowledgePointsRelations = relations(
  questionKnowledgePoints,
  ({ one }) => ({
    question: one(questions, {
      fields: [questionKnowledgePoints.questionId],
      references: [questions.id],
    }),
    knowledgePoint: one(knowledgePoints, {
      fields: [questionKnowledgePoints.knowledgePointId],
      references: [knowledgePoints.id],
    }),
  }),
);

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

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

export const userKnowledgeProgressRelations = relations(
  userKnowledgeProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [userKnowledgeProgress.userId],
      references: [users.id],
    }),
    knowledgePoint: one(knowledgePoints, {
      fields: [userKnowledgeProgress.knowledgePointId],
      references: [knowledgePoints.id],
    }),
  }),
);

// ---------------------------------------------------------------------------
// Exams
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export const classesRelations = relations(classes, ({ one, many }) => ({
  instructor: one(users, {
    fields: [classes.instructorId],
    references: [users.id],
  }),
  members: many(classMembers),
  feedback: many(instructorFeedback),
}));

export const classMembersRelations = relations(classMembers, ({ one }) => ({
  class: one(classes, {
    fields: [classMembers.classId],
    references: [classes.id],
  }),
  user: one(users, {
    fields: [classMembers.userId],
    references: [users.id],
  }),
}));

export const instructorFeedbackRelations = relations(
  instructorFeedback,
  ({ one }) => ({
    class: one(classes, {
      fields: [instructorFeedback.classId],
      references: [classes.id],
    }),
    from: one(users, {
      fields: [instructorFeedback.fromUserId],
      references: [users.id],
      relationName: "feedbackFrom",
    }),
    to: one(users, {
      fields: [instructorFeedback.toUserId],
      references: [users.id],
      relationName: "feedbackTo",
    }),
    submission: one(submissions, {
      fields: [instructorFeedback.submissionId],
      references: [submissions.id],
    }),
  }),
);
