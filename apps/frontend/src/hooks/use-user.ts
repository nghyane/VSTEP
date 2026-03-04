import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { User } from "@/types/api"

function useUser(userId: string) {
	return useQuery({
		queryKey: ["users", userId],
		queryFn: () => api.get<User>(`/api/users/${userId}`),
	})
}

function useUpdateUser(userId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (body: { email?: string; fullName?: string | null }) =>
			api.patch<User>(`/api/users/${userId}`, body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["users", userId] })
		},
	})
}

function useChangePassword(userId: string) {
	return useMutation({
		mutationFn: (body: { currentPassword: string; newPassword: string }) =>
			api.post<{ success: boolean }>(`/api/users/${userId}/password`, body),
	})
}

function useUploadAvatar(userId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (file: Blob) => {
			const formData = new FormData()
			formData.append("avatar", file, "avatar.jpg")
			return api.upload<{ avatarKey: string }>(`/api/users/${userId}/avatar`, formData)
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["users", userId] })
		},
	})
}

export { useChangePassword, useUpdateUser, useUploadAvatar, useUser }
