import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { PracticeNextResponse } from "@/types/api"

function usePracticeNext(skill: string, part?: number) {
	const params = new URLSearchParams({ skill })
	if (part != null) params.set("part", String(part))

	return useQuery({
		queryKey: ["practice", "next", skill, part],
		queryFn: () => api.get<PracticeNextResponse>(`/api/practice/next?${params}`),
		enabled: !!skill,
	})
}

export { usePracticeNext }
