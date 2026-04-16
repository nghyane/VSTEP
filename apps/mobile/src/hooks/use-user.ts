import { useQuery, useMutation } from "@tanstack/react-query";
import { MOCK_USER } from "@/lib/mock";
import type { User } from "@/types/api";

export function useUploadAvatar(_userId: string) {
  return useMutation({ mutationFn: async (_file: any) => ({ avatarKey: "mock-avatar" }) });
}

export function useUser(userId: string) {
  return useQuery({ queryKey: ["users", userId], queryFn: async (): Promise<User> => MOCK_USER, enabled: !!userId });
}

export function useUpdateUser(_userId: string) {
  return useMutation({ mutationFn: async (_body: { email?: string; fullName?: string | null }) => MOCK_USER });
}

export function useChangePassword(_userId: string) {
  return useMutation({ mutationFn: async (_body: { currentPassword: string; newPassword: string }) => ({ success: true }) });
}
