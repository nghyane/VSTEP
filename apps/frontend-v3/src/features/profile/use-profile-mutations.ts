import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createProfile, switchProfile } from "#/features/profile/actions"
import { useAuth } from "#/lib/auth"
import { tokens } from "#/lib/tokens"

export function useProfileMutations() {
	const qc = useQueryClient()
	const applyTokens = useAuth((s) => s.applyTokens)

	const doSwitch = useMutation({
		mutationFn: (profileId: string) => switchProfile(profileId, tokens.getRefresh() ?? ""),
		onSuccess: ({ data }) => {
			applyTokens(data)
			qc.invalidateQueries()
		},
	})

	const doCreate = useMutation({
		mutationFn: createProfile,
	})

	return { doSwitch, doCreate }
}
