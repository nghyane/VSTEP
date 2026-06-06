import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Exam, ExamSessionData, ExamVersion, ListeningPlaySummaryItem, Skill } from "@/types/api";

export type ExamResultStatus = "pending" | "ready" | "partial" | "not_submitted" | "not_applicable" | "none" | "failed";

export interface CriterionScore {
  key: string;
  score: number;
  weight?: number;
}

export interface AssessmentResultDisplay {
  status?: string;
  statusLabel?: string;
  message?: string;
  overallBand?: number | null;
  bandLabel?: string | null;
  summary?: string | null;
  ui?: {
    tone?: "danger" | "warning" | "success";
    badge?: string;
    showScore?: boolean;
    showCriterionBreakdown?: boolean;
    showFeedback?: boolean;
    primaryAction?: string | null;
  } | null;
}

export interface ExamScoreInsight {
  key: string;
  label: string;
  detail: string;
}

export interface AssessmentFeedback {
  strengths?: (string | { message?: string; explanation?: string })[];
  improvements?: (string | { message?: string; explanation?: string })[];
  rewrites?: (string | { original?: string; improved?: string; reason?: string })[];
  evidenceNotes?: string[];
}

export interface ExamResultSummary {
  scoreStatus: ExamResultStatus;
  feedbackStatus: ExamResultStatus;
  hasPendingJobs: boolean;
  hasFailedJobs: boolean;
  display: {
    bandTitle: string;
    bandValue: string;
    totalScoreTitle: string;
    totalScoreValue: string;
    pendingBadgeLabel: string | null;
  };
  overall: {
    applicable: boolean;
    reason: string | null;
    band: number | null;
    scoreOn10: number | null;
    vstepLevel: string | null;
    cefrLevel: string | null;
    resultLabel: string | null;
  };
  mcq: {
    correct: number;
    total: number;
    answered: number;
    wrong: number;
    unanswered: number;
    scoreOn10: number;
  };
}

export interface ExamResultReview {
  skills: {
    key: Skill;
    label: string;
    status: ExamResultStatus;
    statusLabel: string;
    scoreLabel: string;
    issueCount: number;
    sectionIds: string[];
  }[];
  sections: {
    id: string;
    skill: Skill;
    sourceType: string;
    sourceId: string | null;
    part: number;
    displayOrder: number;
    label: string;
    shortLabel: string;
    scoreLabel: string;
    status: ExamResultStatus;
    statusLabel: string;
    issueCount: number;
  }[];
}

export interface ExamSessionResults {
  session: ExamSessionData;
  exam: Pick<Exam, "id" | "title"> | null;
  version: ExamVersion | null;
  summary: ExamResultSummary;
  review: ExamResultReview;
  scores?: {
    listening: number | null;
    reading: number | null;
    writing: number | null;
    speaking: number | null;
    overall: number | null;
  } | null;
  mcq?: {
    score: number;
    total: number;
  } | null;
  mcqDetail: {
    itemRefType: string;
    itemRefId: string;
    selectedIndex: number | null;
    correctIndex: number;
    answered: boolean;
    isCorrect: boolean;
    answerStatus: "correct" | "wrong" | "unanswered";
    answerStatusLabel: string;
    answerTone: "correct" | "wrong" | null;
    selectedLabel: string | null;
    correctLabel: string;
    selectedSummaryLabel: string;
    correctSummaryLabel: string;
    correctBadgeLabel: string;
    selectedBadgeLabel: string;
    answeredAt: string | null;
  }[];
  writingFeedback: {
    submissionId: string | null;
    attemptId: string | null;
    jobStatus: string | null;
    scoreStatus: ExamResultStatus;
    feedbackStatus: ExamResultStatus;
    taskId: string;
    wordCount: number;
    text: string;
    overallBand: number | null;
    criterionScores: CriterionScore[] | null;
    display?: AssessmentResultDisplay | null;
    diagnostics?: unknown;
    scoreInsights?: ExamScoreInsight[];
    feedback: AssessmentFeedback | null;
    calculationTrace: unknown;
  }[];
  speakingFeedback: {
    submissionId: string | null;
    attemptId: string | null;
    jobStatus: string | null;
    scoreStatus: ExamResultStatus;
    feedbackStatus: ExamResultStatus;
    partId: string;
    audioUrl: string | null;
    transcript: string | null;
    overallBand: number | null;
    criterionScores: CriterionScore[] | null;
    display?: AssessmentResultDisplay | null;
    diagnostics?: unknown;
    scoreInsights?: ExamScoreInsight[];
    feedback: AssessmentFeedback | null;
    calculationTrace: unknown;
  }[];
  listeningPlaySummary: ListeningPlaySummaryItem[];
}

interface GradingStatus {
  writing: "pending" | "processing" | "completed" | "failed";
  speaking: "pending" | "processing" | "completed" | "failed";
}

export function useExamSessionResults(sessionId: string) {
  return useQuery({
    queryKey: ["exam-session-results", sessionId],
    queryFn: () => api.get<ExamSessionResults>(`/api/v1/exam-sessions/${sessionId}/results`),
    enabled: !!sessionId,
    retry: false,
    staleTime: 1000 * 30,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 1000 * 5;
      return data.summary.hasPendingJobs ? 1000 * 5 : false;
    },
  });
}

export function useGradingStatus(sessionId: string): GradingStatus {
  const { data } = useExamSessionResults(sessionId);

  const writingStatus = !data?.writingFeedback
    ? "pending"
    : data.writingFeedback.some((w) => w.feedbackStatus === "failed" || w.scoreStatus === "failed")
      ? "failed"
      : data.writingFeedback.every((w) => w.overallBand != null)
        ? "completed"
        : "processing";

  const speakingStatus = !data?.speakingFeedback
    ? "pending"
    : data.speakingFeedback.some((s) => s.feedbackStatus === "failed" || s.scoreStatus === "failed")
      ? "failed"
      : data.speakingFeedback.every((s) => s.overallBand != null)
        ? "completed"
        : "processing";

  return { writing: writingStatus, speaking: speakingStatus };
}
