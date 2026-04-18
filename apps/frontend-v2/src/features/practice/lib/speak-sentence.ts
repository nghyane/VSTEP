// Speak a single sentence via Web Speech API. Promise resolves on end/error.

export interface SpeakOptions {
	rate?: number
	voice?: SpeechSynthesisVoice | null
}

export function speakSentence(text: string, opts: SpeakOptions = {}): Promise<void> {
	if (typeof window === "undefined" || !("speechSynthesis" in window)) {
		return Promise.resolve()
	}
	return new Promise((resolve) => {
		const u = new SpeechSynthesisUtterance(text)
		u.rate = opts.rate ?? 1
		if (opts.voice) u.voice = opts.voice
		u.onend = () => resolve()
		u.onerror = () => resolve()
		window.speechSynthesis.cancel()
		window.speechSynthesis.speak(u)
	})
}

export function cancelSpeak(): void {
	if (typeof window !== "undefined" && "speechSynthesis" in window) {
		window.speechSynthesis.cancel()
	}
}

export function pickEnglishVoice(): SpeechSynthesisVoice | null {
	if (typeof window === "undefined" || !("speechSynthesis" in window)) return null
	const voices = window.speechSynthesis.getVoices()
	return (
		voices.find((v) => v.lang.toLowerCase().startsWith("en-us")) ??
		voices.find((v) => v.lang.toLowerCase().startsWith("en")) ??
		null
	)
}
