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

/** Format ISO date → "05/04". */
export function formatShortDate(iso: string): string {
	const d = new Date(iso)
	return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
}

/** Count words in a string. */
export function countWords(text: string): number {
	const trimmed = text.trim()
	if (!trimmed) return 0
	return trimmed.split(/\s+/).length
}

/** Speak text via Web Speech API. */
export function speak(text: string) {
	if (!window.speechSynthesis) return
	window.speechSynthesis.cancel()
	const u = new SpeechSynthesisUtterance(text)
	u.lang = "en-US"
	u.rate = 0.9
	window.speechSynthesis.speak(u)
}
