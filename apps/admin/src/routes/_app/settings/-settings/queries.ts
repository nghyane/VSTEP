import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type ApiResponse, api } from "#/lib/api"
import type { SystemConfigRow } from "./types"

export const useSystemConfigs = () =>
	useQuery({
		queryKey: ["admin", "system-config"],
		queryFn: () =>
			api
				.get("admin/system-config")
				.json<ApiResponse<SystemConfigRow[]>>()
				.then((r) => r.data),
	})

export function useUpdateSystemConfig() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ key, value }: { key: string; value: unknown }) =>
			api
				.patch(`admin/system-config/${key}`, { json: { value } })
				.json<ApiResponse<SystemConfigRow>>()
				.then((r) => r.data),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "system-config"] }),
	})
}
