// Onboarding hooks — profile onboarding via API
import { useQuery, useMutation } from "@tanstack/react-query";
import { type ApiResponse, api } from "@/lib/api";

export function useOnboardingStatus() {
  return useQuery({
    queryKey: ["onboarding-status"],
    queryFn: () => api.get<ApiResponse<{ completed: boolean }>>("/profiles"),
  });
}

export function useSelfAssess() {
  return useMutation({
    mutationFn: (body: { target_level: string; target_deadline: string }) =>
      api.post<ApiResponse<unknown>>("profiles", body),
  });
}
