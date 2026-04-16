import { useQuery, useMutation } from "@tanstack/react-query";
import { MOCK_ONBOARDING_STATUS } from "@/lib/mock";
import type { OnboardingStatus, PlacementResult, QuestionLevel, VstepBand } from "@/types/api";

export function useOnboardingStatus() {
  return useQuery({ queryKey: ["onboarding-status"], queryFn: async (): Promise<OnboardingStatus> => MOCK_ONBOARDING_STATUS });
}

export function useSelfAssess() {
  return useMutation({ mutationFn: async (_body: { listening: QuestionLevel; reading: QuestionLevel; writing: QuestionLevel; speaking: QuestionLevel; targetBand: VstepBand; deadline?: string; dailyStudyTimeMinutes?: number }) => ({} as PlacementResult) });
}

export function useStartPlacement() {
  return useMutation({ mutationFn: async () => ({ sessionId: "mock-placement", examId: "exam-1", questionCount: 40 }) });
}

export function useCompletePlacement() {
  return useMutation({ mutationFn: async (_body: { sessionId: string; targetBand: VstepBand; deadline?: string | null; dailyStudyTimeMinutes?: number | null }) => ({} as PlacementResult) });
}

export function useSkipOnboarding() {
  return useMutation({ mutationFn: async (_body: { targetBand: VstepBand; englishYears?: number; previousTest?: string; previousScore?: string; deadline?: string | null; dailyStudyTimeMinutes?: number | null }) => ({} as PlacementResult) });
}
