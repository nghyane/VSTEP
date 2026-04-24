import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createProfile, updateProfile } from "#/features/profile/actions"
import type { UpdateProfileInput } from "#/features/profile/types"
import { useAuth } from "#/lib/auth"
import { useToast } from "#/lib/toast"

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
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["profiles"] })
			useToast.getState().add("Cập nhật hồ sơ thành công", "success")
		},
	})

	return { doSwitch, doCreate, doUpdate }
}
