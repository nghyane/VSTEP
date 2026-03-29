import { useQueries, useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

const STORAGE_URL = import.meta.env.VITE_STORAGE_URL as string | undefined

/** Check if a value is already a full URL. */
function isFullUrl(value: string): boolean {
	return value.startsWith("http://") || value.startsWith("https://")
}

/**
 * Resolve a storage key to a full URL synchronously.
 * Falls back to VITE_STORAGE_URL if set, otherwise returns the key as-is.
 * For private R2 buckets, use `usePresignedUrl` hook instead.
 */
export function resolveStorageUrl(keyOrUrl: string): string {
	if (isFullUrl(keyOrUrl)) return keyOrUrl
	if (STORAGE_URL) return `${STORAGE_URL}/${keyOrUrl}`
	return keyOrUrl
}

const PRESIGN_STALE = 50 * 60 * 1000 // 50 min (URL valid 60 min)
const PRESIGN_GC = 60 * 60 * 1000 // 1 hour

async function fetchPresignedUrl(key: string): Promise<string> {
	if (isFullUrl(key)) return key
	const res = await api.get<{ url: string; expiresIn: number }>(
		`/api/audio/presign?path=${encodeURIComponent(key)}`,
	)
	return res.url
}

/**
 * Fetch a presigned URL for a single private R2 storage key.
 * Cached for 50 minutes via TanStack Query (presigned URL lasts 60 min).
 */
export function usePresignedUrl(storageKey: string | undefined) {
	return useQuery({
		queryKey: ["presigned-url", storageKey],
		queryFn: () => fetchPresignedUrl(storageKey ?? ""),
		enabled: !!storageKey,
		staleTime: PRESIGN_STALE,
		gcTime: PRESIGN_GC,
	})
}

/**
 * Fetch presigned URLs for multiple storage keys in parallel.
 * Returns a Map<originalKey, signedUrl>.
 */
export function usePresignedUrls(storageKeys: string[]) {
	const queries = useQueries({
		queries: storageKeys.map((key) => ({
			queryKey: ["presigned-url", key],
			queryFn: () => fetchPresignedUrl(key),
			staleTime: PRESIGN_STALE,
			gcTime: PRESIGN_GC,
		})),
	})

	const urlMap = new Map<string, string>()
	for (let i = 0; i < storageKeys.length; i++) {
		const q = queries[i]
		if (q.data) urlMap.set(storageKeys[i], q.data)
	}

	const isLoading = queries.some((q) => q.isLoading)

	return { urlMap, isLoading }
}
