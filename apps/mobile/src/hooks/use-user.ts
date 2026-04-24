import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/types/api";

export function useUser(userId: string) {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: () => api.get<{ user: User; profile: unknown }>("/api/v1/auth/me"),
    enabled: !!userId,
    select: (data) => (data as any).user as User,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      api.post<{ success: boolean }>("/api/v1/auth/change-password", body),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { fullName?: string | null }) =>
      api.patch<User>("/api/v1/auth/me", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

// Avatar upload not yet supported by backend-v2 — no-op stub
export function useUploadAvatar(_userId: string) {
  return useMutation({
    mutationFn: async (_file: unknown) => ({ avatarKey: null }),
  });
}
