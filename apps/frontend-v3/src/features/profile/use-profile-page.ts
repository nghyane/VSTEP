import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { profilesQuery } from "#/features/profile/queries"
import { useProfileMutations } from "#/features/profile/use-profile-mutations"
import { useSession } from "#/lib/auth"
import type { Profile } from "#/types/auth"

export function useProfilePage(edit?: boolean) {
	const { profile: activeProfile, user } = useSession()
	const navigate = useNavigate()
	const { data, isLoading } = useQuery(profilesQuery)
	const [showCreate, setShowCreate] = useState(false)
	const [editing, setEditing] = useState<Profile | null>(edit ? activeProfile : null)
	const { doSwitch, doCreate, doUpdate } = useProfileMutations()

	function closeEdit() {
		setEditing(null)
		navigate({ to: "/ho-so", search: {}, replace: true })
	}

	async function handleCreate(v: { nickname: string; target_level: string; target_deadline: string }) {
		await doSwitch.mutateAsync((await doCreate.mutateAsync(v)).data.id)
		setShowCreate(false)
	}

	async function handleUpdate(v: { nickname: string; target_deadline: string }) {
		if (!editing) return
		await doUpdate.mutateAsync({ id: editing.id, ...v })
		closeEdit()
	}

	return {
		user,
		activeProfile,
		profiles: data?.data ?? null,
		isLoading,
		showCreate,
		setShowCreate,
		editing,
		setEditing,
		closeEdit,
		handleCreate,
		handleUpdate,
		doSwitch,
	}
}
