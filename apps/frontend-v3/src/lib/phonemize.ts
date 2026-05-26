import { useEffect, useState } from "react"

/**
 * Get IPA phonetic transcription for English text via async dynamic import.
 * Returns admin-provided IPA immediately, falls back to phonemize client-side.
 */
async function fetchIpa(text: string): Promise<string | null> {
	try {
		const { toIPA } = await import("phonemize")
		return toIPA(text)
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
export function useIpa(text: string, adminIpa?: string | null): string | null {
	const [ipa, setIpa] = useState<string | null>(() => {
		if (adminIpa && adminIpa.length > 0) return adminIpa
		return null
	})

	useEffect(() => {
		if (adminIpa || !text) return

		let cancelled = false
		fetchIpa(text).then((result) => {
			if (!cancelled) setIpa(result)
		})

		return () => {
			cancelled = true
		}
	}, [text, adminIpa])

	return ipa
}
