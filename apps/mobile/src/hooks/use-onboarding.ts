import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import type { OnboardingStatus, PlacementResult, PlacementStarted, QuestionLevel, VstepBand } from "@/types/api";

export function useOnboardingStatus() {
  return useQuery({
    queryKey: ["onboarding-status"],
    queryFn: () => api.get<OnboardingStatus>("/api/onboarding/status"),
  });
}

export function useSelfAssess() {
  return useMutation({
    mutationFn: (body: {
      listening: QuestionLevel;
      reading: QuestionLevel;
      writing: QuestionLevel;
      speaking: QuestionLevel;
      targetBand: VstepBand;
      deadline?: string;
      dailyStudyTimeMinutes?: number;
    }) => api.post<PlacementResult>("/api/onboarding/self-assess", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

export function useStartPlacement() {
  return useMutation({
    mutationFn: () => api.post<PlacementStarted>("/api/onboarding/placement", {}),
  });
}

export function useSkipOnboarding() {
  return useMutation({
    mutationFn: (body: {
      targetBand: VstepBand;
      englishYears?: number;
      previousTest?: string;
      previousScore?: string;
      deadline?: string;
      dailyStudyTimeMinutes?: number;
    }) => api.post<PlacementResult>("/api/onboarding/skip", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}
