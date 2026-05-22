import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { updateAvatar, uploadAvatar } from "#/features/profile/actions"
import { useAuth } from "#/lib/auth"
import { getAvatarUrl, getUserAvatarSrc } from "#/lib/avatar"
import type { AvatarKey, User } from "#/types/auth"

export function useAvatarPicker() {
	const user = useAuth((s) => (s.status === "authenticated" ? s.user : null))
	const profile = useAuth((s) => (s.status === "authenticated" ? s.profile : null))
	const setAuthenticated = useAuth((s) => s._setAuthenticated)
	const [pendingKey, setPendingKey] = useState<AvatarKey | null>(null)
	const [pendingFile, setPendingFile] = useState<File | null>(null)
	const [pendingFileUrl, setPendingFileUrl] = useState<string | null>(null)
	const [showPresets, setShowPresets] = useState(false)

	const syncUser = (updated: Partial<User>) => {
		if (user && profile) setAuthenticated({ ...user, ...updated }, profile)
	}

	const presetMutation = useMutation({
		mutationFn: (key: AvatarKey) => updateAvatar(key),
		onSuccess: (res) => {
			syncUser({ avatar_key: res.data.avatar_key, avatar_url: null })
			setPendingKey(null)
		},
	})

	const uploadMutation = useMutation({
		mutationFn: (file: File) => uploadAvatar(file),
		onSuccess: (res) => {
			syncUser({ avatar_url: res.data.avatar_url, avatar_key: null })
			setPendingFile(null)
			setPendingFileUrl(null)
		},
	})

	const selectFile = (file: File) => {
		setPendingFile(file)
		setPendingKey(null)
		const url = URL.createObjectURL(file)
		if (pendingFileUrl) URL.revokeObjectURL(pendingFileUrl)
		setPendingFileUrl(url)
	}

	const selectPreset = (key: AvatarKey) => {
		setPendingKey(key)
		setPendingFile(null)
		if (pendingFileUrl) {
			URL.revokeObjectURL(pendingFileUrl)
			setPendingFileUrl(null)
		}
	}

	const save = () => {
		if (pendingFile) uploadMutation.mutate(pendingFile)
		else if (pendingKey) presetMutation.mutate(pendingKey)
	}

	const cancel = () => {
		if (pendingFileUrl) URL.revokeObjectURL(pendingFileUrl)
		setPendingKey(null)
		setPendingFile(null)
		setPendingFileUrl(null)
	}

	const previewSrc = pendingFileUrl ?? (pendingKey ? getAvatarUrl(pendingKey) : null)
	const currentSrc = previewSrc ?? (user ? getUserAvatarSrc(user) : null)
	const isPending = presetMutation.isPending || uploadMutation.isPending
	const isDirty = pendingKey !== null || pendingFile !== null

	return {
		user,
		currentSrc,
		pendingKey,
		pendingFile,
		showPresets,
		isPending,
		isDirty,
		selectFile,
		selectPreset,
		save,
		cancel,
		togglePresets: () => setShowPresets((v) => !v),
	}
}
