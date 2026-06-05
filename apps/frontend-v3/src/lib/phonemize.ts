import { useEffect, useState } from "react"

function stripDelimiters(ipa: string): string {
	const trimmed = ipa.trim()
	if (trimmed.startsWith("/") && trimmed.endsWith("/")) {
		return trimmed.slice(1, -1)
	}
	return trimmed
}

function normalizeIpa(value: unknown): string | null {
	if (typeof value !== "string") return null
	const ipa = stripDelimiters(value)
	return ipa.length > 0 ? ipa : null
}

/**
 * Get IPA phonetic transcription for English text via async dynamic import.
 * Returns admin-provided IPA immediately, falls back to phonemize client-side.
 */
async function fetchIpa(text: string): Promise<string | null> {
	try {
		const { toIPA } = await import("phonemize")
		return stripDelimiters(toIPA(text))
	} catch {
		return null
	}
}

/**
 * Hook: IPA phonetic transcription with admin override priority.
 *
 * Priority: admin-provided IPA → phonemize auto-generated → null.
 * Uses lazy dynamic import so a broken phonemize module won't crash the app.
 */
export function useIpa(text: string, adminIpa?: unknown): string | null {
	const [ipa, setIpa] = useState<string | null>(() => {
		const normalized = normalizeIpa(adminIpa)
		if (normalized) return normalized
		return null
	})

	useEffect(() => {
		const normalized = normalizeIpa(adminIpa)
		if (normalized) {
			setIpa(normalized)
			return
		}

		if (!text) {
			setIpa(null)
			return
		}

		let cancelled = false
		setIpa(null)
		fetchIpa(text).then((result) => {
			if (!cancelled) setIpa(result)
		})

		return () => {
			cancelled = true
		}
	}, [text, adminIpa])

	return ipa
}
