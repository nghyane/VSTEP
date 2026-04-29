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

// Voice quality ranking: prefer Microsoft Online voices (Aria, Jenny, Guy)
// then fallback to Zira, avoid David (clips first words on Chromium).
const VOICE_PREFERENCE = [
	"Microsoft Aria Online",
	"Microsoft Jenny Online",
	"Microsoft Guy Online",
	"Microsoft Ana Online",
	"Microsoft AvaMultilingual Online",
	"Microsoft AndrewMultilingual Online",
	"Google US English",
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

function pickEnglishVoice(): SpeechSynthesisVoice | undefined {
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
	onEnd?: () => void
}

export function speak(text: string, opts: SpeakOptions = {}) {
	if (!window.speechSynthesis) {
		opts.onEnd?.()
		return
	}
	const synth = window.speechSynthesis
	synth.cancel()
	const u = new SpeechSynthesisUtterance(text)
	u.lang = "en-US"
	u.rate = opts.rate ?? 1
	const voice = pickEnglishVoice()
	if (voice) u.voice = voice
	u.onend = () => opts.onEnd?.()
	u.onerror = () => opts.onEnd?.()
	synth.speak(u)
}

/** Cancel any ongoing speech. */
export function stopSpeaking() {
	if (!window.speechSynthesis) return
	window.speechSynthesis.cancel()
}
