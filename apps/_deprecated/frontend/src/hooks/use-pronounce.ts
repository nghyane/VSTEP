import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Preferred male voices for VSTEP-style clear pronunciation.
 * Ordered by quality — first match wins.
 * "Online" Microsoft voices are neural TTS (much more natural).
 */
const PREFERRED_VOICES = [
	"Microsoft Ryan Online (Natural) - English (United Kingdom)",
	"Microsoft Guy Online (Natural) - English (United States)",
	"Microsoft David - English (United States)",
	"Google UK English Male",
	"Google US English",
	"Daniel", // macOS/iOS en-GB male
	"Alex", // macOS en-US male
]

function getEnglishVoice(): SpeechSynthesisVoice | null {
	const voices = speechSynthesis.getVoices()
	const enVoices = voices.filter((v) => v.lang.startsWith("en"))

	// Try preferred voices first
	for (const name of PREFERRED_VOICES) {
		const match = enVoices.find((v) => v.name === name)
		if (match) return match
	}

	// Fallback: any en-US, then any en-*
	return enVoices.find((v) => v.lang === "en-US") ?? enVoices[0] ?? null
}

export function usePronounce() {
	const [supported, setSupported] = useState(false)
	const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

	useEffect(() => {
		if (typeof speechSynthesis === "undefined") return

		function resolve() {
			voiceRef.current = getEnglishVoice()
			setSupported(voiceRef.current !== null)
		}

		resolve()
		speechSynthesis.addEventListener("voiceschanged", resolve)
		return () => speechSynthesis.removeEventListener("voiceschanged", resolve)
	}, [])

	const speak = useCallback((text: string) => {
		if (!text || typeof speechSynthesis === "undefined") return
		speechSynthesis.cancel()
		const utterance = new SpeechSynthesisUtterance(text)
		utterance.voice = voiceRef.current
		utterance.lang = "en-US"
		utterance.rate = 0.9
		speechSynthesis.speak(utterance)
	}, [])

	return { speak, supported }
}
