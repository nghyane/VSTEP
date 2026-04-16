import { useQuery, useMutation } from "@tanstack/react-query";
import { MOCK_PROGRESS, MOCK_SPIDER, MOCK_ACTIVITY, MOCK_LEARNING_PATH, MOCK_PRACTICE_TRACK } from "@/lib/mock";
import type { PracticeTrackData } from "@/lib/mock";
import type { ActivityResponse, Goal, LearningPathResponse, ProgressOverview, SpiderChart } from "@/types/api";

export function useProgress() {
  return useQuery({ queryKey: ["progress"], queryFn: async (): Promise<ProgressOverview> => MOCK_PROGRESS });
}

export function useSpiderChart() {
  return useQuery({ queryKey: ["progress", "spider-chart"], queryFn: async (): Promise<SpiderChart> => MOCK_SPIDER });
}

export function useSkillDetail(skill: string, _source?: "practice" | "exam") {
  return useQuery({ queryKey: ["progress", skill], queryFn: async () => ({ skill, submissions: [], recentScores: [] }), enabled: !!skill });
}

export function useCreateGoal() {
  return useMutation({ mutationFn: async (_body: { targetBand: string; deadline: string; dailyStudyTimeMinutes?: number }) => MOCK_PROGRESS.goal as Goal });
}

export function useUpdateGoal() {
  return useMutation({ mutationFn: async (_body: { id: string; targetBand?: string; deadline?: string; dailyStudyTimeMinutes?: number }) => MOCK_PROGRESS.goal as Goal });
}

export function useActivity(days = 7) {
  return useQuery({ queryKey: ["activity", days], queryFn: async (): Promise<ActivityResponse> => MOCK_ACTIVITY });
}

export function useLearningPath() {
  return useQuery({ queryKey: ["learning-path"], queryFn: async (): Promise<LearningPathResponse> => MOCK_LEARNING_PATH });
}

export function usePracticeTrack() {
  return useQuery({ queryKey: ["practice-track"], queryFn: async (): Promise<PracticeTrackData> => MOCK_PRACTICE_TRACK });
}
