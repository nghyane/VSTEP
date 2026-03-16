import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { PaginatedResponse, Skill } from "@/types/api"

interface Class {
	id: string
	name: string
	description: string | null
	inviteCode: string
	instructorId: string
	createdAt: string
	updatedAt: string
}

interface ClassMember {
	id: string
	userId: string
	fullName: string | null
	email: string
	joinedAt: string
}

interface ClassDetail extends Omit<Class, "inviteCode"> {
	inviteCode: string | null
	members: ClassMember[]
	memberCount: number
}

interface ClassDashboard {
	memberCount: number
	atRiskCount: number
	atRiskLearners: {
		userId: string
		fullName: string | null
		email: string
		reasons: string[]
	}[]
	skillSummary: Record<
		string,
		{
			avgScore: number | null
			trendDistribution: { improving: number; stable: number; declining: number }
		}
	>
}

interface ClassFeedback {
	id: string
	classId: string
	fromUserId: string
	toUserId: string
	content: string
	skill: string | null
	submissionId: string | null
	createdAt: string
	updatedAt: string
}

function useClasses(page = 1, limit = 20) {
	return useQuery({
		queryKey: ["classes", page, limit],
		queryFn: () => api.get<PaginatedResponse<Class>>(`/api/classes?page=${page}&limit=${limit}`),
	})
}

function useClass(id: string) {
	return useQuery({
		queryKey: ["classes", id],
		queryFn: () => api.get<ClassDetail>(`/api/classes/${id}`),
		enabled: !!id,
	})
}

function useCreateClass() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (body: { name: string; description?: string }) =>
			api.post<Class>("/api/classes", body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["classes"] })
		},
	})
}

function useUpdateClass() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, ...body }: { id: string; name?: string; description?: string }) =>
			api.patch<Class>(`/api/classes/${id}`, body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["classes"] })
		},
	})
}

function useDeleteClass() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete<{ id: string }>(`/api/classes/${id}`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["classes"] })
		},
	})
}

function useRotateCode() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.post<Class>(`/api/classes/${id}/rotate-code`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["classes"] })
		},
	})
}

function useJoinClass() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (body: { inviteCode: string }) =>
			api.post<{ classId: string; className: string }>("/api/classes/join", body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["classes"] })
		},
	})
}

function useLeaveClass() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.post<{ id: string }>(`/api/classes/${id}/leave`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["classes"] })
		},
	})
}

function useRemoveMember() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ classId, userId }: { classId: string; userId: string }) =>
			api.delete<{ id: string }>(`/api/classes/${classId}/members/${userId}`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["classes"] })
		},
	})
}

function useClassDashboard(id: string) {
	return useQuery({
		queryKey: ["classes", id, "dashboard"],
		queryFn: () => api.get<ClassDashboard>(`/api/classes/${id}/dashboard`),
		enabled: !!id,
	})
}

function useMemberProgress(classId: string, userId: string) {
	return useQuery({
		queryKey: ["classes", classId, "members", userId, "progress"],
		queryFn: () => api.get<unknown>(`/api/classes/${classId}/members/${userId}/progress`),
		enabled: !!classId && !!userId,
	})
}

function useSendFeedback() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({
			classId,
			...body
		}: {
			classId: string
			toUserId: string
			content: string
			skill?: Skill
			submissionId?: string
		}) => api.post<ClassFeedback>(`/api/classes/${classId}/feedback`, body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["classes"] })
		},
	})
}

function useClassFeedback(classId: string, params?: { page?: number; skill?: string }) {
	return useQuery({
		queryKey: ["classes", classId, "feedback", params],
		queryFn: () => {
			const search = new URLSearchParams()
			if (params?.page) search.set("page", String(params.page))
			if (params?.skill) search.set("skill", params.skill)
			const qs = search.toString()
			return api.get<PaginatedResponse<ClassFeedback>>(
				`/api/classes/${classId}/feedback${qs ? `?${qs}` : ""}`,
			)
		},
		enabled: !!classId,
	})
}

export {
	useClass,
	useClassDashboard,
	useClassFeedback,
	useClasses,
	useCreateClass,
	useDeleteClass,
	useJoinClass,
	useLeaveClass,
	useMemberProgress,
	useRemoveMember,
	useRotateCode,
	useSendFeedback,
	useUpdateClass,
}

export type { Class, ClassDashboard, ClassDetail, ClassFeedback, ClassMember }
