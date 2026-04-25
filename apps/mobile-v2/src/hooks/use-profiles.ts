import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Profile } from "@/types/api";

// ── Types ──

export interface CreateProfileInput {
  nickname: string;
  targetLevel: string;
  targetDeadline: string;
}

export interface UpdateProfileInput {
  nickname?: string;
  targetDeadline?: string;
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) =>
      api.post<Profile>("/api/v1/auth/switch-profile", {
        profile_id: profileId,
      }),
    onSuccess: () => {
      qc.invalidateQueries();
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
    },
  });
}
