import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getRefreshToken } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";
import type { Profile } from "@/types/api";

// ── Types ──

export interface CreateProfileInput {
  nickname: string;
  targetLevel: string;
  targetDeadline: string;
  entryLevel?: string;
}

export interface UpdateProfileInput {
  nickname?: string;
  targetDeadline?: string;
}

export interface SwitchProfileResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  profile: Profile;
}

// ── Queries ──

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: () => api.get<Profile[]>("/api/v1/profiles"),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}

// ── Mutations ──

export function useCreateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProfileInput) =>
      api.post<Profile>("/api/v1/profiles", {
        nickname: input.nickname,
        target_level: input.targetLevel,
        target_deadline: input.targetDeadline,
        entry_level: input.entryLevel ?? null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & UpdateProfileInput) =>
      api.patch<Profile>(`/api/v1/profiles/${id}`, {
        nickname: input.nickname,
        target_deadline: input.targetDeadline,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}

export function useDeleteProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ success: boolean }>(`/api/v1/profiles/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}

export function useSwitchProfile() {
  return useMutation({
    mutationFn: async (profileId: string) => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new Error("Missing refresh token");
      return api.post<SwitchProfileResponse>("/api/v1/auth/switch-profile", {
        profileId,
        refreshToken,
      });
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useResetProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ resetAt: string; wipedEntities: number }>(`/api/v1/profiles/${id}/reset`, {
        reason: "user_requested",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["streak"] });
      qc.invalidateQueries({ queryKey: ["activity-heatmap"] });
      qc.invalidateQueries({ queryKey: ["practice"] });
      qc.invalidateQueries({ queryKey: ["exams"] });
      qc.invalidateQueries({ queryKey: ["exam-sessions"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["booking"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
