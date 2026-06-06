import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { OverviewData } from "#/features/dashboard/types"
import { createProfile, updateProfile } from "#/features/profile/actions"
import type { UpdateProfileInput } from "#/features/profile/types"
import type { ApiResponse } from "#/lib/api"
import { useAuth } from "#/lib/auth"
import { useToast } from "#/lib/toast"

function daysUntil(deadline: string): number {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const target = new Date(deadline)
	target.setHours(0, 0, 0, 0)
	return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86_400_000))
}

export function useProfileMutations() {
	const qc = useQueryClient()
	const switchProfile = useAuth((s) => s.switchProfile)

	const doSwitch = useMutation({
		mutationFn: switchProfile,
		onSuccess: () => qc.invalidateQueries(),
	})

	const doCreate = useMutation({
		mutationFn: createProfile,
		onSuccess: () => useToast.getState().add("Tạo mục tiêu thành công", "success"),
	})

	const doUpdate = useMutation({
		mutationFn: (vars: { id: string } & UpdateProfileInput) => {
			const { id, ...input } = vars
			return updateProfile(id, input)
		},
		onSuccess: ({ data: profile }) => {
			const auth = useAuth.getState()
			if (auth.status === "authenticated" && auth.profile.id === profile.id) {
				auth._setAuthenticated(auth.user, profile)
				qc.setQueryData<ApiResponse<OverviewData>>(["overview"], (current) => {
					if (!current) return current
					return {
						...current,
						data: {
							...current.data,
							profile: {
								...current.data.profile,
								nickname: profile.nickname,
								target_level: profile.target_level,
								target_deadline: profile.target_deadline,
								days_until_exam: daysUntil(profile.target_deadline),
							},
						},
					}
				})
				qc.invalidateQueries({ queryKey: ["overview"], refetchType: "all" })
				qc.invalidateQueries({ queryKey: ["learning-path"], refetchType: "all" })
			}
			qc.invalidateQueries({ queryKey: ["profiles"] })
			useToast.getState().add("Cập nhật hồ sơ thành công", "success")
		},
	})

	return { doSwitch, doCreate, doUpdate }
}
