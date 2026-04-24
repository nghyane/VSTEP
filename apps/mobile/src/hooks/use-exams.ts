import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Synced with frontend-v3 features/exam/types.ts + backend-v2 ExamController

export type SkillKey = "listening" | "reading" | "writing" | "speaking";

export interface Exam {
  id: string;
  slug: string;
  title: string;
  sourceSchool: string | null;
  tags: string[];
  totalDurationMinutes: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExamVersionListeningSection {
  id: string;
  part: number;
  partTitle: string;
  durationMinutes: number;
  audioUrl: string;
  displayOrder: number;
  items: { id: string; correctIndex: number }[];
}

export interface ExamVersionReadingPassage {
  id: string;
  part: number;
  title: string;
  durationMinutes: number;
  displayOrder: number;
  items: { id: string; correctIndex: number }[];
}

export interface ExamVersionWritingTask {
  id: string;
  part: number;
  taskType: string;
  durationMinutes: number;
  prompt: string;
  minWords: number;
  displayOrder: number;
}

export interface ExamVersionSpeakingPart {
  id: string;
  part: number;
  type: string;
  durationMinutes: number;
  displayOrder: number;
}

export interface ExamVersion {
  id: string;
  versionNumber: number;
  isActive: boolean;
  publishedAt: string;
  listeningSections: ExamVersionListeningSection[];
  readingPassages: ExamVersionReadingPassage[];
  writingTasks: ExamVersionWritingTask[];
  speakingParts: ExamVersionSpeakingPart[];
}

export interface ExamDetail {
  exam: Exam;
  version: ExamVersion;
}

export interface ExamSessionStart {
  sessionId: string;
  serverDeadlineAt: string;
  coinsCharged: number;
  status: string;
}

export function useExams() {
  return useQuery({
    queryKey: ["exams"],
    queryFn: () => api.get<Exam[]>("/api/v1/exams"),
  });
}

export function useExamDetail(id: string) {
  return useQuery({
    queryKey: ["exams", id],
    queryFn: () => api.get<ExamDetail>(`/api/v1/exams/${id}`),
    enabled: !!id,
  });
}

export function useStartExamSession() {
  return useMutation({
    mutationFn: ({
      examId,
      mode,
      selectedSkills,
    }: {
      examId: string;
      mode: "full" | "custom";
      selectedSkills?: SkillKey[];
    }) =>
      api.post<ExamSessionStart>(`/api/v1/exams/${examId}/sessions`, {
        mode,
        selected_skills: selectedSkills ?? [],
      }),
  });
}
