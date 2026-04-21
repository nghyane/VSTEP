import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createProfile, switchProfile } from "#/features/profile/actions"
import { useAuth } from "#/lib/auth"
import { tokens } from "#/lib/tokens"
import type { SwitchProfileResponse } from "#/features/profile/types"

function applySwitch(data: SwitchProfileResponse) {
	tokens.setAccess(data.access_token)
	tokens.setRefresh(data.refresh_token)
	tokens.setProfile(data.profile)
	useAuth.setState({ profile: data.profile })
}

export function useProfileMutations() {
	const qc = useQueryClient()

	const doSwitch = useMutation({
		mutationFn: (profileId: string) => switchProfile(profileId, tokens.getRefresh() ?? ""),
		onSuccess: ({ data }) => {
			applySwitch(data)
			qc.invalidateQueries()
		},
	})

	const doCreate = useMutation({
		mutationFn: createProfile,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["profiles"] })
		},
	})

	return { doSwitch, doCreate }
}
