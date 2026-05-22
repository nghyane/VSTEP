import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

/** Round to N decimal places. Matches backend `round($value, $precision)`. */
export function round(value: number, precision = 1): number {
	const factor = 10 ** precision
	return Math.round(value * factor) / factor
}

/** Format seconds → "1:23". */
export function formatAudioTime(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = Math.floor(seconds % 60)
	return `${m}:${s.toString().padStart(2, "0")}`
}

/** Format minutes → "7h 20m" or "45m". */
export function formatMinutes(m: number): string {
	const h = Math.floor(m / 60)
	const min = m % 60
	return h > 0 ? `${h}h ${min}m` : `${min}m`
}

/** Format VND amount → "30.000đ". */
export function formatVnd(n: number): string {
	return `${n.toLocaleString("vi-VN")}đ`
}

/** Format coin/number với phân cách nghìn kiểu VN. */
export function formatNumber(n: number): string {
	return n.toLocaleString("vi-VN")
}

/** Format số gọn: 999 → "999", 1500 → "1.5k", 1200000 → "1.2M". Dùng cho count hiển thị nhỏ gọn. */
export function formatCompact(n: number): string {
	if (n < 1000) return n.toString()
	if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}k`
	return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
}

/** Format ISO date → "05/04". */
export function formatShortDate(iso: string): string {
	const d = new Date(iso)
	return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
}

/** Format ISO date → "05/04/2026". */
export function formatDate(iso: string): string {
	const d = new Date(iso)
	return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

/** True nếu hai timestamp cùng ngày local. */
export function isSameDay(a: number, b: number): boolean {
	const d1 = new Date(a)
	const d2 = new Date(b)
	return (
		d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
	)
}

/** Format ISO date → "19 tháng 11, 2026". */
export function formatVnDate(iso: string): string {
	const d = new Date(iso)
	return `${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`
}

/** Count words in a string. */
export function countWords(text: string): number {
	const trimmed = text.trim()
	if (!trimmed) return 0
	return trimmed.split(/\s+/).length
}

/** Speak text via Web Speech API. */

let cachedVoices: SpeechSynthesisVoice[] | null = null

function loadVoices(): SpeechSynthesisVoice[] {
	if (cachedVoices && cachedVoices.length > 0) return cachedVoices
	const voices = window.speechSynthesis.getVoices()
	if (voices.length > 0) cachedVoices = voices
	return voices
}

if (typeof window !== "undefined" && window.speechSynthesis) {
	window.speechSynthesis.onvoiceschanged = () => {
		cachedVoices = window.speechSynthesis.getVoices()
	}
}

// Voice quality ranking: prefer Google voices (natural), then Microsoft Neural.
const VOICE_PREFERENCE = [
	"Google US English",
	"Google UK English Female",
	"Microsoft Jenny Online",
	"Microsoft Guy Online",
	"Microsoft Aria Online",
	"Microsoft Ana Online",
	"Microsoft AvaMultilingual Online",
	"Microsoft AndrewMultilingual Online",
	"Microsoft Zira",
	"Microsoft Mark",
	"Samantha",
	"Alex",
] as const

function rankVoice(name: string): number {
	for (let i = 0; i < VOICE_PREFERENCE.length; i++) {
		if (name.includes(VOICE_PREFERENCE[i])) return i
	}
	return VOICE_PREFERENCE.length
}

export function pickEnglishVoice(): SpeechSynthesisVoice | undefined {
	const voices = loadVoices()
	const en = voices.filter((v) => v.lang.startsWith("en"))
	if (en.length === 0) return undefined
	return [...en].sort((a, b) => {
		const ra = rankVoice(a.name)
		const rb = rankVoice(b.name)
		if (ra !== rb) return ra - rb
		const usA = a.lang === "en-US" ? 0 : 1
		const usB = b.lang === "en-US" ? 0 : 1
		if (usA !== usB) return usA - usB
		return Number(b.localService) - Number(a.localService)
	})[0]
}

interface SpeakOptions {
	rate?: number
	voice?: SpeechSynthesisVoice
	onEnd?: () => void
	onBoundary?: (charIndex: number) => void
	/** Skip synth.cancel() before speaking */
	skipCancel?: boolean
}

/**
 * Warm up Chrome TTS engine with a real word at zero volume.
 * Must be called from a user gesture (click handler).
 * Chrome clips the first few seconds of speech if the engine is cold.
 */
export function warmupTTS() {
	if (!window.speechSynthesis) return
	const synth = window.speechSynthesis
	synth.cancel()
	const u = new SpeechSynthesisUtterance("ready")
	u.volume = 0.01
	u.rate = 2
	u.lang = "en-US"
	const v = pickEnglishVoice()
	if (v) u.voice = v
	synth.speak(u)
}

export function speak(text: string, opts: SpeakOptions = {}) {
	if (!window.speechSynthesis) {
		opts.onEnd?.()
		return
	}
	const synth = window.speechSynthesis
	synth.cancel()

	const doSpeak = () => {
		const v = opts.voice ?? pickEnglishVoice()

		// Prepend filler "..." — Chrome clips the start of cold utterances.
		// The filler gets clipped instead of the actual first word.
		// Single utterance avoids queue timing issues.
		const filler = "... "
		const paddedText = filler + text

		const u = new SpeechSynthesisUtterance(paddedText)
		u.lang = "en-US"
		u.rate = opts.rate ?? 1
		if (v) u.voice = v
		u.onend = () => opts.onEnd?.()
		u.onerror = () => opts.onEnd?.()
		if (opts.onBoundary) {
			u.onboundary = (e) => {
				if (e.name === "word" && e.charIndex >= filler.length) {
					opts.onBoundary?.(e.charIndex - filler.length)
				}
			}
		}
		synth.speak(u)

		// Chrome stops speech after ~15s. Workaround: pause/resume periodically.
		const keepAlive = setInterval(() => {
			if (!synth.speaking) {
				clearInterval(keepAlive)
				return
			}
			synth.pause()
			synth.resume()
		}, 10000)
		const origOnEnd = u.onend
		u.onend = (ev) => {
			clearInterval(keepAlive)
			origOnEnd?.call(u, ev)
		}
		const origOnError = u.onerror
		u.onerror = (ev) => {
			clearInterval(keepAlive)
			origOnError?.call(u, ev)
		}
	}

	if (synth.getVoices().length === 0) {
		const onVoices = () => {
			synth.removeEventListener("voiceschanged", onVoices)
			setTimeout(doSpeak, 100)
		}
		synth.addEventListener("voiceschanged", onVoices)
		setTimeout(() => {
			synth.removeEventListener("voiceschanged", onVoices)
			doSpeak()
		}, 300)
	} else {
		setTimeout(doSpeak, 100)
	}
}

export function getEnglishVoices(): SpeechSynthesisVoice[] {
	if (!window.speechSynthesis) return []
	return window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"))
}

/** Cancel any ongoing speech. */
export function stopSpeaking() {
	if (!window.speechSynthesis) return
	window.speechSynthesis.cancel()
}

/** Translate text using Google Translate free API. */
export async function translateText(text: string, from = "en", to = "vi"): Promise<string> {
	const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`
	const res = await fetch(url)
	const data = await res.json()
	const segments = data?.[0] as Array<[string]> | null
	if (!segments) return text
	return segments.map((s) => s[0]).join("")
}

/* ───── Word comparison for Shadowing ───── */

function levenshtein(a: string, b: string): number {
	const m = a.length
	const n = b.length
	const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i])
	for (let j = 0; j <= n; j++) dp[0][j] = j
	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			dp[i][j] =
				a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
		}
	}
	return dp[m][n]
}

function matchScore(a: string, b: string): number {
	if (a === b) return 3
	if (a.length > 3 && levenshtein(a, b) <= 2) return 2
	if (b.includes(a) || a.includes(b)) return 1
	return 0
}

export interface WordCompareResult {
	word: string
	accuracy: "correct" | "wrong" | "close"
	userSaid?: string
}

export function compareWords(
	original: string,
	transcript: string,
): { results: WordCompareResult[]; correct: number } {
	const clean = (s: string) =>
		s
			.toLowerCase()
			.replace(/[.,!?;:'"]/g, "")
			.split(/\s+/)
			.filter(Boolean)
	const origWords = clean(original)
	const userWords = clean(transcript)

	const m = origWords.length
	const n = userWords.length
	const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			const s = matchScore(origWords[i - 1], userWords[j - 1])
			dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1] + s)
		}
	}

	const alignment: (number | null)[] = Array(m).fill(null)
	let i = m
	let j = n
	while (i > 0 && j > 0) {
		const s = matchScore(origWords[i - 1], userWords[j - 1])
		if (dp[i][j] === dp[i - 1][j - 1] + s && s > 0) {
			alignment[i - 1] = j - 1
			i--
			j--
		} else if (dp[i][j] === dp[i - 1][j]) {
			i--
		} else {
			j--
		}
	}

	let correct = 0
	const results: WordCompareResult[] = origWords.map((w, idx) => {
		const uIdx = alignment[idx]
		if (uIdx === null) {
			const merged = userWords.find((uw) => uw.includes(w) && uw !== w)
			return { word: w, accuracy: "wrong", userSaid: merged }
		}
		const uw = userWords[uIdx]
		if (uw === w) {
			correct++
			return { word: w, accuracy: "correct", userSaid: uw }
		}
		if (w.length > 3 && levenshtein(w, uw) <= 2) {
			correct++
			return { word: w, accuracy: "close", userSaid: uw }
		}
		if (uw.includes(w) || w.includes(uw)) {
			correct++
			return { word: w, accuracy: "close", userSaid: uw }
		}
		return { word: w, accuracy: "wrong", userSaid: uw }
	})
	return { results, correct }
}
