import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createProfile } from "#/features/profile/actions"
import { useAuth } from "#/lib/auth"

export function useProfileMutations() {
	const qc = useQueryClient()
	const switchProfile = useAuth((s) => s.switchProfile)

	const doSwitch = useMutation({
		mutationFn: switchProfile,
		onSuccess: () => qc.invalidateQueries(),
	})

	const doCreate = useMutation({
		mutationFn: createProfile,
	})

	return { doSwitch, doCreate }
}
