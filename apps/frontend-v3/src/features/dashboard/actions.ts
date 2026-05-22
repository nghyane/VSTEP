import type { StreakClaimResult } from "#/features/dashboard/types"
import { type ApiResponse, api } from "#/lib/api"

export async function claimStreakMilestone(days: number): Promise<StreakClaimResult> {
	const res = await api.post(`streak/milestones/${days}/claim`).json<ApiResponse<StreakClaimResult>>()
	return res.data
}
