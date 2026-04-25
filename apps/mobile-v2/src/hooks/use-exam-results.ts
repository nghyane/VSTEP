import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ── Types ──

export interface ExamSessionResults {
  session: {
    id: string;
    status: string;
    submittedAt: string | null;
  };
  scores: {
    listening: number | null;
    reading: number | null;
    writing: number | null;
    speaking: number | null;
    overall: number | null;
  } | null;
  mcqDetail: {
    listening: { correct: number; total: number };
    reading: { correct: number; total: number };
  } | null;
  writingFeedback: {
    submissionId: string;
    taskId: string;
    wordCount: number;
    text: string;
    overallBand: number | null;
    rubricScores: Record<string, number> | null;
    strengths: string[];
    improvements: { message: string; explanation: string }[];
    rewrites: { original: string; improved: string; reason: string }[];
  }[];
  speakingFeedback: {
    submissionId: string;
    partId: string;
    audioUrl: string | null;
    transcript: string | null;
    overallBand: number | null;
    rubricScores: Record<string, number> | null;
    strengths: string[];
    improvements: { message: string; explanation: string }[];
  }[];
  listeningPlaySummary: {
    sectionId: string;
    part: number;
    played: boolean;
  }[];
}

interface GradingStatus {
  writing: "pending" | "processing" | "completed" | "failed";
  speaking: "pending" | "processing" | "completed" | "failed";
}

// ── Queries ──

export function useExamSessionResults(sessionId: string) {
  return useQuery({
    queryKey: ["exam-session-results", sessionId],
    queryFn: () => api.get<ExamSessionResults>(`/api/v1/exam-sessions/${sessionId}/results`),
    enabled: !!sessionId,
    retry: false,
    staleTime: 1000 * 30,
    refetchInterval: (query) => {
      // Poll every 5s while grading is in progress
      const data = query.state.data;
      if (!data) return 1000 * 5;
      const hasPendingWriting = data.writingFeedback.some((w) => w.overallBand == null);
      const hasPendingSpeaking = data.speakingFeedback.some((s) => s.overallBand == null);
      return (hasPendingWriting || hasPendingSpeaking) ? 1000 * 5 : false;
    },
  });
}

export function useGradingStatus(sessionId: string): GradingStatus {
  const { data } = useExamSessionResults(sessionId);

  const writingStatus = !data?.writingFeedback
    ? "pending"
    : data.writingFeedback.every((w) => w.overallBand != null)
      ? "completed"
      : "processing";

  const speakingStatus = !data?.speakingFeedback
    ? "pending"
    : data.speakingFeedback.every((s) => s.overallBand != null)
      ? "completed"
      : "processing";

  return { writing: writingStatus, speaking: speakingStatus };
}
