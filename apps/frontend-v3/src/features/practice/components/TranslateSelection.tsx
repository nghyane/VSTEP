import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { speak } from "#/lib/utils"

interface PopupState {
	text: string
	x: number
	y: number
	bottom: number
}

function isSingleWord(text: string): boolean {
	return /^[a-zA-Z'-]+$/.test(text.trim())
}

export function TranslateSelection({ children }: { children: React.ReactNode }) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [popup, setPopup] = useState<PopupState | null>(null)

	const handleMouseUp = useCallback(() => {
		requestAnimationFrame(() => {
			const sel = window.getSelection()
			const text = sel?.toString().trim()
			if (!text || !sel || sel.rangeCount === 0) {
				setPopup(null)
				return
			}
			const range = sel.getRangeAt(0)
			if (!containerRef.current?.contains(range.commonAncestorContainer)) {
				setPopup(null)
				return
			}
			const rect = range.getBoundingClientRect()
			setPopup({ text, x: rect.left + rect.width / 2, y: rect.top, bottom: rect.bottom })
		})
	}, [])

	useEffect(() => {
		if (!popup) return
		function onSelectionChange() {
			if (!window.getSelection()?.toString().trim()) setPopup(null)
		}
		document.addEventListener("selectionchange", onSelectionChange)
		return () => document.removeEventListener("selectionchange", onSelectionChange)
	}, [popup])

	return (
		<div ref={containerRef} onMouseUp={handleMouseUp} onTouchEnd={handleMouseUp}>
			{children}
			{popup &&
				createPortal(
					isSingleWord(popup.text) ? (
						<WordTooltip {...popup} onClose={() => setPopup(null)} />
					) : (
						<TranslateTooltip {...popup} onClose={() => setPopup(null)} />
					),
					document.body,
				)}
		</div>
	)
}

// ─── Dictionary lookup (single word) ────────────────────────────────

interface DictMeaning {
	partOfSpeech: string
	definitions: { definition: string }[]
}

interface DictEntry {
	word: string
	phonetic?: string
	phonetics?: { text?: string }[]
	meanings: DictMeaning[]
}

interface WordData {
	word: string
	phonetic: string
	pos: string
	definition: string
	translation: string
}

async function lookupWord(word: string): Promise<WordData | null> {
	const lower = word.toLowerCase()
	try {
		const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${lower}`)
		if (!res.ok) return null
		const entries: DictEntry[] = await res.json()
		const entry = entries[0]
		if (!entry) return null

		const phonetic = entry.phonetic ?? entry.phonetics?.find((p) => p.text)?.text ?? ""
		const meaning = entry.meanings[0]
		const pos = meaning?.partOfSpeech ?? ""
		const definition = meaning?.definitions[0]?.definition ?? ""

		const translation = await translateBrowser(lower)

		return { word: lower, phonetic, pos, definition, translation }
	} catch {
		return null
	}
}

// ─── Browser Translator API ────────────────────────────────────────

interface TranslatorInstance {
	translate(text: string): Promise<string>
	destroy(): void
}

interface TranslatorStatic {
	availability(opts: { sourceLanguage: string; targetLanguage: string }): Promise<string>
	create(opts: { sourceLanguage: string; targetLanguage: string }): Promise<TranslatorInstance>
}

async function translateBrowser(text: string): Promise<string> {
	if (!("Translator" in window)) return ""
	try {
		const ai = window as unknown as { Translator: TranslatorStatic }
		const avail = await ai.Translator.availability({ sourceLanguage: "en", targetLanguage: "vi" })
		if (avail === "unavailable") return ""
		const translator = await ai.Translator.create({ sourceLanguage: "en", targetLanguage: "vi" })
		const result = await translator.translate(text)
		translator.destroy()
		return result
	} catch {
		return ""
	}
}

// ─── Shared positioning ─────────────────────────────────────────────

function useTooltipPosition(ref: React.RefObject<HTMLDivElement | null>, x: number, bottom: number) {
	const el = ref.current
	let left = x
	const top = bottom + 8
	if (el) {
		const rect = el.getBoundingClientRect()
		left = x - rect.width / 2
		if (left < 8) left = 8
		if (left + rect.width > window.innerWidth - 8) left = window.innerWidth - rect.width - 8
	}
	return { left, top }
}

function useEscapeClose(onClose: () => void) {
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose()
		}
		document.addEventListener("keydown", onKey)
		return () => document.removeEventListener("keydown", onKey)
	}, [onClose])
}

const POS_LABELS: Record<string, string> = {
	noun: "danh từ",
	verb: "động từ",
	adjective: "tính từ",
	adverb: "trạng từ",
	preposition: "giới từ",
	conjunction: "liên từ",
	pronoun: "đại từ",
	interjection: "thán từ",
	exclamation: "thán từ",
	determiner: "hạn định từ",
}

// ─── Word tooltip (single word) ─────────────────────────────────────

function WordTooltip({ text, x, bottom, onClose }: PopupState & { onClose: () => void }) {
	const ref = useRef<HTMLDivElement>(null)
	const [data, setData] = useState<WordData | null>(null)
	const [status, setStatus] = useState<"loading" | "done" | "error">("loading")

	useEffect(() => {
		let cancelled = false
		lookupWord(text).then((d) => {
			if (cancelled) return
			if (d) {
				setData(d)
				setStatus("done")
			} else {
				setStatus("error")
			}
		})
		return () => {
			cancelled = true
		}
	}, [text])

	useEscapeClose(onClose)
	const pos = useTooltipPosition(ref, x, bottom)

	if (status === "error") return null

	return (
		<div
			ref={ref}
			className="fixed z-50 w-64 rounded-(--radius-card) border-2 border-b-4 border-border bg-surface p-3 shadow-lg"
			style={pos}
		>
			{status === "loading" && <p className="text-xs text-muted animate-pulse">Đang tra từ...</p>}
			{status === "done" && data && (
				<div className="space-y-1.5">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-baseline gap-2 min-w-0">
							<span className="text-sm font-bold text-foreground">{data.word}</span>
							{data.phonetic && <span className="text-xs text-muted truncate">{data.phonetic}</span>}
						</div>
						<button
							type="button"
							onClick={() => speak(data.word)}
							aria-label="Phát âm"
							className="shrink-0 text-muted hover:text-foreground transition-colors"
						>
							<VolumeIcon />
						</button>
					</div>
					{data.pos && (
						<span className="inline-block rounded-md bg-foreground/10 px-1.5 py-0.5 text-[10px] font-bold text-foreground/70 uppercase">
							{POS_LABELS[data.pos] ?? data.pos}
						</span>
					)}
					<p className="text-xs text-foreground/80 leading-relaxed">{data.definition}</p>
					{data.translation && (
						<p className="text-xs font-medium text-foreground border-t border-border pt-1.5 mt-1.5">
							{data.translation}
						</p>
					)}
				</div>
			)}
		</div>
	)
}

// ─── Translate tooltip (multi-word / phrase) ────────────────────────

function TranslateTooltip({ text, x, bottom, onClose }: PopupState & { onClose: () => void }) {
	const ref = useRef<HTMLDivElement>(null)
	const [status, setStatus] = useState<"loading" | "done" | "unsupported">("loading")
	const [result, setResult] = useState("")

	useEffect(() => {
		let cancelled = false
		translateBrowser(text).then((t) => {
			if (cancelled) return
			if (t) {
				setResult(t)
				setStatus("done")
			} else {
				setStatus("unsupported")
			}
		})
		return () => {
			cancelled = true
		}
	}, [text])

	useEscapeClose(onClose)
	const pos = useTooltipPosition(ref, x, bottom)

	return (
		<div
			ref={ref}
			className="fixed z-50 max-w-72 rounded-(--radius-card) border-2 border-b-4 border-border bg-surface p-3 shadow-lg"
			style={pos}
		>
			{status === "loading" && (
				<div className="flex items-center gap-2">
					<TranslateIcon />
					<p className="text-xs text-muted animate-pulse">Đang dịch...</p>
				</div>
			)}
			{status === "unsupported" && (
				<p className="text-xs text-muted">Trình duyệt chưa hỗ trợ dịch. Dùng Chrome 138+.</p>
			)}
			{status === "done" && (
				<div className="flex gap-2">
					<TranslateIcon className="shrink-0 mt-0.5" />
					<p className="text-sm text-foreground">{result}</p>
				</div>
			)}
		</div>
	)
}

// ─── Icons ──────────────────────────────────────────────────────────

function TranslateIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 20 20"
			fill="currentColor"
			className={`size-3.5 text-muted ${className ?? ""}`}
			aria-hidden="true"
		>
			<path d="M7.75 2.75a.75.75 0 0 0-1.5 0v1.258a32.987 32.987 0 0 0-3.599.278.75.75 0 1 0 .198 1.487A31.545 31.545 0 0 1 8.7 5.545 19.381 19.381 0 0 1 7.257 9.04a19.391 19.391 0 0 1-1.727-2.336.75.75 0 1 0-1.261.812 20.898 20.898 0 0 0 2.073 2.753 19.39 19.39 0 0 1-3.592 2.7.75.75 0 0 0 .814 1.26 20.894 20.894 0 0 0 3.936-3.014 20.868 20.868 0 0 0 3.168 2.51.75.75 0 1 0 .836-1.246 19.389 19.389 0 0 1-2.87-2.28 20.897 20.897 0 0 0 1.89-4.45h2.726a.75.75 0 0 0 0-1.5H8.25V2.75Z" />
			<path d="M12.75 9a.75.75 0 0 1 .697.478l2.75 7a.75.75 0 1 1-1.395.544l-.652-1.66h-2.8l-.652 1.66a.75.75 0 0 1-1.395-.543l2.75-7A.75.75 0 0 1 12.75 9Zm-1.047 4.862h2.094l-1.047-2.666-1.047 2.666Z" />
		</svg>
	)
}

function VolumeIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4" aria-hidden="true">
			<path d="M11 5 6 9H2v6h4l5 4V5ZM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
		</svg>
	)
}
