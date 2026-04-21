import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createProfile, switchProfile } from "#/features/profile/actions"
import { tokens } from "#/lib/tokens"

export function useProfileMutations() {
	const qc = useQueryClient()
	const refreshToken = tokens.getRefresh() ?? ""

	const doSwitch = useMutation({
		mutationFn: (profileId: string) => switchProfile(profileId, refreshToken),
		onSuccess: () => qc.invalidateQueries(),
	})

	const doCreate = useMutation({
		mutationFn: createProfile,
		onSuccess: async (profile) => {
			await qc.invalidateQueries({ queryKey: ["profiles"] })
			await switchProfile(profile.id, refreshToken)
			qc.invalidateQueries()
		},
	})

	return { doSwitch, doCreate }
}
