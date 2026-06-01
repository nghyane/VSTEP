import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { SkillKey } from "#/lib/skills"

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

/**
 * Trả về URL nếu là absolute http(s) URL hợp lệ; ngược lại trả null.
 * Tránh trường hợp admin nhập bậy ("ádfasdfds") → browser treat as relative
 * → navigate sang /khoa-hoc/ádfasdfds → BE crash UUID lookup.
 */
export function safeExternalUrl(value: string | null | undefined): string | null {
	if (!value) return null
	const trimmed = value.trim()
	if (!trimmed) return null
	try {
		const u = new URL(trimmed)
		if (u.protocol !== "http:" && u.protocol !== "https:") return null
		return u.toString()
	} catch {
		return null
	}
}

/** Count words in a string. */
export function countWords(text: string): number {
	const trimmed = text.trim()
	if (!trimmed) return 0
	return trimmed.split(/\s+/).length
}

/** Bỏ dấu tiếng Việt + lowercase. Dùng cho search accent-insensitive. */
export function normalizeVi(s: string): string {
	return s
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/đ/g, "d")
		.replace(/Đ/g, "D")
		.toLowerCase()
}

export function isEdgeOnMac(userAgent: string): boolean {
	return /Edg\//.test(userAgent) && /Macintosh|Mac OS X/.test(userAgent)
}

export function speechRecognitionNetworkMessage(userAgent: string, online: boolean): string {
	if (!online) return "Thiết bị đang offline nên không dùng được nhận dạng giọng nói."
	if (/Edg\//.test(userAgent)) {
		return isEdgeOnMac(userAgent)
			? "Edge trên Mac không hỗ trợ nhận dạng giọng nói. Vui lòng dùng Chrome."
			: "Microsoft Edge không kết nối được dịch vụ nhận dạng giọng nói trên thiết bị này. Vui lòng dùng Chrome."
	}
	return "Dịch vụ nhận dạng giọng nói của trình duyệt đang không phản hồi. Vui lòng thử lại bằng Chrome."
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

export function pickBoundaryEnglishVoice(): SpeechSynthesisVoice | undefined {
	const voices = loadVoices()
	const en = voices.filter((v) => v.lang.startsWith("en"))
	if (en.length === 0) return undefined

	const local = en.filter((v) => v.localService)
	const nonGoogle = en.filter((v) => !v.name.includes("Google"))
	const candidates = local.length > 0 ? local : nonGoogle.length > 0 ? nonGoogle : en

	return [...candidates].sort((a, b) => {
		const usA = a.lang === "en-US" ? 0 : 1
		const usB = b.lang === "en-US" ? 0 : 1
		if (usA !== usB) return usA - usB
		const ra = rankVoice(a.name)
		const rb = rankVoice(b.name)
		if (ra !== rb) return ra - rb
		return a.name.localeCompare(b.name)
	})[0]
}

interface SpeakOptions {
	rate?: number
	voice?: SpeechSynthesisVoice
	onEnd?: () => void
	onBoundary?: (charIndex: number) => void
	boundaryFallback?: boolean
	/** Skip synth.cancel() before speaking */
	skipCancel?: boolean
}

function wordStartIndexes(text: string): number[] {
	const indexes: number[] = []
	const regex = /\S+/g
	let match = regex.exec(text)
	while (match) {
		indexes.push(match.index)
		match = regex.exec(text)
	}
	return indexes
}

function boundaryFallbackMs(rate: number): number {
	return Math.max(180, Math.round(400 / rate))
}

function attachBoundaryTracking(
	u: SpeechSynthesisUtterance,
	text: string,
	filler: string,
	onBoundary: ((charIndex: number) => void) | undefined,
	useFallback: boolean,
): () => void {
	if (!onBoundary) return () => {}
	const starts = wordStartIndexes(text)
	let fallbackTimer = 0
	let lastCharIndex = -1
	const cleanup = () => {
		if (!fallbackTimer) return
		clearInterval(fallbackTimer)
		fallbackTimer = 0
	}
	const emit = (charIndex: number) => {
		if (charIndex < lastCharIndex) return
		lastCharIndex = charIndex
		onBoundary(charIndex)
	}
	if (useFallback && starts.length > 0) {
		let wordIndex = 0
		emit(starts[0])
		fallbackTimer = window.setInterval(() => {
			wordIndex += 1
			if (wordIndex >= starts.length) {
				cleanup()
				return
			}
			emit(starts[wordIndex])
		}, boundaryFallbackMs(u.rate))
	}
	u.onboundary = (e) => {
		if (e.charIndex < filler.length) return
		cleanup()
		emit(e.charIndex - filler.length)
	}
	return cleanup
}

function attachSpeechCleanup(
	u: SpeechSynthesisUtterance,
	synth: SpeechSynthesis,
	onBoundaryCleanup: () => void,
	onEnd: (() => void) | undefined,
) {
	const keepAlive = setInterval(() => {
		if (!synth.speaking) {
			clearInterval(keepAlive)
			return
		}
		synth.pause()
		synth.resume()
	}, 10000)
	const cleanup = () => {
		clearInterval(keepAlive)
		onBoundaryCleanup()
	}
	u.onend = () => {
		cleanup()
		onEnd?.()
	}
	u.onerror = () => {
		cleanup()
		onEnd?.()
	}
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
		const filler = "... "
		const u = new SpeechSynthesisUtterance(filler + text)
		u.lang = "en-US"
		u.rate = opts.rate ?? 1
		if (v) u.voice = v
		const boundaryCleanup = attachBoundaryTracking(
			u,
			text,
			filler,
			opts.onBoundary,
			opts.boundaryFallback ?? true,
		)
		attachSpeechCleanup(u, synth, boundaryCleanup, opts.onEnd)
		synth.speak(u)
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
	const all = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"))

	// Loại bỏ duplicate theo tên rút gọn (giữ cái đầu tiên gặp)
	const seen = new Set<string>()
	return all.filter((v) => {
		const key = v.name.replace(/Microsoft |Google |Online| \(Natural\)|\s*-.*$/g, "").trim()
		if (seen.has(key)) return false
		seen.add(key)
		return true
	})
}

/** Rút gọn tên giọng TTS: bỏ "Microsoft ", "Google ", "Online", " (Natural)". */
export function shortVoiceName(name: string): string {
	return name.replace(/Microsoft |Google |Online| \(Natural\)/g, "").trim()
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

/* ───── Exam scoring ───── */

/**
 * Average of non-null skill scores → 0–10 band. Returns null if no scores.
 * Skill scores are per-skill VSTEP bands (0–10), e.g. { listening: 7, reading: 8, writing: null, speaking: 6 }.
 */
export function avgSkillScores(scores: Record<SkillKey, number | null> | null): number | null {
	if (!scores) return null
	const vals = Object.values(scores).filter((v): v is number => v !== null)
	if (vals.length === 0) return null
	return vals.reduce((a, b) => a + b, 0) / vals.length
}

/** Map VSTEP band (0–10) → "7.5 · B2". Returns "Đang chấm..." if null. */
export function formatVstepBand(band: number | null): string {
	if (band === null) return "Đang chấm..."
	const r = round(band)
	if (band >= 8.5) return `${r} · C1`
	if (band >= 6.0) return `${r} · B2`
	if (band >= 4.0) return `${r} · B1`
	if (band >= 3.5) return `${r} · A2`
	return `${r} · A1`
}
