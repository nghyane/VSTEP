const STORAGE_URL = import.meta.env.VITE_STORAGE_URL as string | undefined

export function avatarUrl(
	key: string | null | undefined,
	fullName: string | null | undefined,
): string {
	if (key && STORAGE_URL) return `${STORAGE_URL}/${key}`
	const name = encodeURIComponent(fullName ?? "?")
	return `https://ui-avatars.com/api/?name=${name}&background=random`
}

export function getInitials(name: string | null | undefined, email?: string | null): string {
	return (name ?? email ?? "?")
		.split(" ")
		.map((w) => w[0])
		.slice(0, 2)
		.join("")
		.toUpperCase()
}
