import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
	KnowledgePoint,
	KnowledgePointCategory,
	PaginatedResponse,
	TopicItem,
} from "@/types/api"

function useKnowledgePoints(params?: { page?: number; category?: string; search?: string }) {
	const sp = new URLSearchParams()
	if (params?.page) sp.set("page", String(params.page))
	if (params?.category) sp.set("category", params.category)
	if (params?.search) sp.set("search", params.search)
	const qs = sp.toString()
	return useQuery({
		queryKey: ["knowledge-points", params],
		queryFn: () =>
			api.get<PaginatedResponse<KnowledgePoint>>(`/api/knowledge-points${qs ? `?${qs}` : ""}`),
	})
}

function useKnowledgePoint(id: string) {
	return useQuery({
		queryKey: ["knowledge-points", id],
		queryFn: () => api.get<KnowledgePoint>(`/api/knowledge-points/${id}`),
		enabled: !!id,
	})
}

function useCreateKnowledgePoint() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (body: { category: KnowledgePointCategory; name: string }) =>
			api.post<KnowledgePoint>("/api/knowledge-points", body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["knowledge-points"] })
		},
	})
}

function useUpdateKnowledgePoint() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({
			id,
			...body
		}: {
			id: string
			category?: KnowledgePointCategory
			name?: string
		}) => api.patch<KnowledgePoint>(`/api/knowledge-points/${id}`, body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["knowledge-points"] })
		},
	})
}

function useKnowledgePointTopics(skill?: string) {
	const sp = new URLSearchParams()
	if (skill) sp.set("skill", skill)
	const qs = sp.toString()
	return useQuery({
		queryKey: ["knowledge-point-topics", skill],
		queryFn: () =>
			api.get<{ data: TopicItem[] }>(`/api/knowledge-points/topics${qs ? `?${qs}` : ""}`),
	})
}

function useDeleteKnowledgePoint() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete<{ id: string }>(`/api/knowledge-points/${id}`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["knowledge-points"] })
		},
	})
}

export {
	useCreateKnowledgePoint,
	useDeleteKnowledgePoint,
	useKnowledgePoint,
	useKnowledgePointTopics,
	useKnowledgePoints,
	useUpdateKnowledgePoint,
}
