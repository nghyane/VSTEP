import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { TTSVoicePicker } from "#/features/practice/components/TTSVoicePicker"
import { useToast } from "#/lib/toast"
import { cn, pickBoundaryEnglishVoice, speak, stopSpeaking, translateText } from "#/lib/utils"

const COLORS = [
	{ key: "yellow", label: "Vàng", bg: "rgba(255, 200, 0, 0.42)" },
	{ key: "green", label: "Xanh lá", bg: "rgba(88, 204, 2, 0.32)" },
	{ key: "blue", label: "Xanh dương", bg: "rgba(28, 176, 246, 0.3)" },
	{ key: "pink", label: "Hồng", bg: "rgba(255, 90, 120, 0.3)" },
	{ key: "purple", label: "Tím", bg: "rgba(120, 80, 200, 0.3)" },
] as const

const VOICE_ERROR_MESSAGE =
	"Giọng đọc này không phát được trên trình duyệt hiện tại. Vui lòng chọn giọng khác."
const highlightTranslationCache = new Map<string, string>()

type ColorKey = (typeof COLORS)[number]["key"]

interface Highlight {
	start: number
	end: number
	color: ColorKey
}

interface HoverTranslation {
	text: string
	x: number
	bottom: number
}

interface Props {
	text: string
	passageId: string
	className?: string
	activeCharIndex?: number | null
}

interface WordRange {
	start: number
	end: number
}

function offsetFromContainer(container: HTMLElement, node: Node, offset: number): number {
	const range = document.createRange()
	range.setStart(container, 0)
	range.setEnd(node, offset)
	return range.toString().length
}

function applyHighlight(existing: Highlight[], next: Highlight): Highlight[] {
	const kept = existing.filter((h) => h.end <= next.start || h.start >= next.end)
	return [...kept, next].sort((a, b) => a.start - b.start)
}

function wordRanges(text: string): WordRange[] {
	const ranges: WordRange[] = []
	const regex = /\S+/g
	let match = regex.exec(text)
	while (match) {
		ranges.push({ start: match.index, end: match.index + match[0].length })
		match = regex.exec(text)
	}
	return ranges
}

function activeRangeAt(text: string, charIndex: number | null): WordRange | null {
	if (charIndex === null) return null
	return wordRanges(text).find((range) => charIndex >= range.start && charIndex < range.end) ?? null
}

export function HighlightablePassage({ text, passageId, className, activeCharIndex = null }: Props) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [store, setStore] = useState<Map<string, Highlight[]>>(new Map())
	const [palette, setPalette] = useState<{ x: number; y: number; start: number; end: number } | null>(null)
	const [hoverTranslation, setHoverTranslation] = useState<HoverTranslation | null>(null)

	const current = store.get(passageId) ?? []
	const activeRange = activeRangeAt(text, activeCharIndex)

	const handleMouseUp = useCallback(() => {
		const selection = window.getSelection()
		const container = containerRef.current
		if (!selection || selection.isCollapsed || !container) {
			setPalette(null)
			return
		}
		const range = selection.getRangeAt(0)
		if (!container.contains(range.commonAncestorContainer)) {
			setPalette(null)
			return
		}
		const start = offsetFromContainer(container, range.startContainer, range.startOffset)
		const end = offsetFromContainer(container, range.endContainer, range.endOffset)
		if (end <= start) {
			setPalette(null)
			return
		}
		const rect = range.getBoundingClientRect()
		setPalette({ x: rect.left + rect.width / 2, y: rect.top, start, end })
	}, [])

	const applyColor = (color: ColorKey) => {
		if (!palette) return
		setStore((prev) => {
			const next = new Map(prev)
			const cur = next.get(passageId) ?? []
			next.set(passageId, applyHighlight(cur, { start: palette.start, end: palette.end, color }))
			return next
		})
		setPalette(null)
		window.getSelection()?.removeAllRanges()
	}

	const removeAt = (index: number) => {
		setStore((prev) => {
			const next = new Map(prev)
			const cur = next.get(passageId) ?? []
			next.set(
				passageId,
				cur.filter((_, i) => i !== index),
			)
			return next
		})
	}

	useEffect(() => {
		if (!palette) return
		const handler = (e: MouseEvent) => {
			const target = e.target as HTMLElement
			if (!target.closest("[data-highlight-palette]")) {
				setPalette(null)
			}
		}
		window.addEventListener("mousedown", handler)
		return () => window.removeEventListener("mousedown", handler)
	}, [palette])

	const sorted = [...current].sort((a, b) => a.start - b.start)
	const segments: React.ReactNode[] = []
	const cuts = new Set([0, text.length])
	for (const hl of sorted) {
		cuts.add(hl.start)
		cuts.add(hl.end)
	}
	if (activeRange) {
		cuts.add(activeRange.start)
		cuts.add(activeRange.end)
	}
	const points = [...cuts].sort((a, b) => a - b)
	for (let i = 0; i < points.length - 1; i += 1) {
		const start = points[i]
		const end = points[i + 1]
		if (end <= start) continue
		const value = text.slice(start, end)
		const hl = sorted.find((item) => start >= item.start && end <= item.end)
		const active = activeRange !== null && start >= activeRange.start && end <= activeRange.end
		const activeClass = active ? "rounded-sm bg-skill-reading/20 text-skill-reading-dark" : ""
		if (!hl) {
			segments.push(
				<span key={`text-${start}-${end}`} className={activeClass}>
					{value}
				</span>,
			)
			continue
		}
		const color = COLORS.find((c) => c.key === hl.color)
		const idx = current.indexOf(hl)
		segments.push(
			<button
				type="button"
				key={`hl-${start}-${end}`}
				onMouseEnter={(e) => {
					const rect = e.currentTarget.getBoundingClientRect()
					setHoverTranslation({ text: value.trim(), x: rect.left + rect.width / 2, bottom: rect.bottom })
				}}
				onMouseLeave={() => setHoverTranslation(null)}
				onClick={(e) => {
					e.stopPropagation()
					removeAt(idx)
					setHoverTranslation(null)
				}}
				style={{ backgroundColor: color?.bg }}
				className={cn("cursor-pointer rounded-sm px-0.5 text-left text-inherit", activeClass)}
				title="Click để xóa highlight"
			>
				{value}
			</button>,
		)
	}

	return (
		<>
			<div
				ref={containerRef}
				onMouseUp={handleMouseUp}
				className={cn("whitespace-pre-wrap selection:bg-primary/20", className)}
			>
				{segments.length > 0 ? segments : text}
			</div>
			{palette && (
				<div
					data-highlight-palette
					className="fixed z-[60] flex items-center gap-1.5 rounded-full border-2 border-b-4 border-border bg-card px-2 py-1.5 shadow-[0_4px_12px_rgb(0_0_0_/_0.12)]"
					style={{
						left: palette.x,
						top: palette.y - 10,
						transform: "translate(-50%, -100%)",
					}}
				>
					{COLORS.map((c) => (
						<button
							key={c.key}
							type="button"
							onClick={() => applyColor(c.key)}
							className="size-6 rounded-full border-2 border-border transition-transform hover:scale-110 active:scale-95"
							style={{ backgroundColor: c.bg }}
							aria-label={`Highlight ${c.label}`}
							title={c.label}
						/>
					))}
				</div>
			)}
			{hoverTranslation &&
				createPortal(<HighlightedTranslationTooltip {...hoverTranslation} />, document.body)}
		</>
	)
}

function HighlightedTranslationTooltip({ text, x, bottom }: HoverTranslation) {
	const ref = useRef<HTMLDivElement>(null)
	const [translation, setTranslation] = useState("")
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let cancelled = false
		const cached = highlightTranslationCache.get(text)
		if (cached) {
			setTranslation(cached)
			setLoading(false)
			return () => {
				cancelled = true
			}
		}
		setLoading(true)
		setTranslation("")
		translateText(text)
			.then((result) => {
				if (cancelled) return
				if (result) highlightTranslationCache.set(text, result)
				setTranslation(result)
			})
			.catch(() => {
				if (cancelled) return
				setTranslation("")
			})
			.finally(() => {
				if (!cancelled) setLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [text])

	const rect = ref.current?.getBoundingClientRect()
	const left = rect ? Math.min(Math.max(8, x - rect.width / 2), window.innerWidth - rect.width - 8) : x

	return (
		<div
			ref={ref}
			className="fixed z-[70] max-w-72 rounded-(--radius-card) border-2 border-b-4 border-border bg-surface p-3 text-xs text-foreground shadow-lg"
			style={{ left, top: bottom + 8, transform: rect ? undefined : "translateX(-50%)" }}
		>
			{loading ? (
				<span className="text-muted animate-pulse">Đang dịch...</span>
			) : (
				translation || "Không dịch được"
			)}
		</div>
	)
}

interface SpeechControlProps {
	text: string
	onActiveCharChange: (activeChar: number | null) => void
	voice?: SpeechSynthesisVoice
	onVoiceChange?: (voice: SpeechSynthesisVoice) => void
	showVoicePicker?: boolean
}

export function PassageSpeechControl({
	text,
	onActiveCharChange,
	voice,
	onVoiceChange,
	showVoicePicker = true,
}: SpeechControlProps) {
	const [speaking, setSpeaking] = useState(false)
	const [internalVoice, setInternalVoice] = useState<SpeechSynthesisVoice | undefined>(() =>
		pickBoundaryEnglishVoice(),
	)
	const selectedVoice = voice ?? internalVoice

	useEffect(() => {
		if (selectedVoice) return
		const load = () => {
			const nextVoice = pickBoundaryEnglishVoice()
			if (nextVoice) setInternalVoice(nextVoice)
		}
		window.speechSynthesis?.addEventListener("voiceschanged", load)
		return () => window.speechSynthesis?.removeEventListener("voiceschanged", load)
	}, [selectedVoice])

	const stopPlayback = useCallback(() => {
		stopSpeaking()
		setSpeaking(false)
		onActiveCharChange(null)
	}, [onActiveCharChange])

	const playPassage = useCallback(() => {
		if (speaking) {
			stopPlayback()
			return
		}
		setSpeaking(true)
		onActiveCharChange(0)
		speak(text, {
			rate: 0.9,
			voice: selectedVoice,
			boundaryFallback: false,
			onBoundary: onActiveCharChange,
			onError: () => useToast.getState().add(VOICE_ERROR_MESSAGE),
			onEnd: () => {
				setSpeaking(false)
				onActiveCharChange(null)
			},
		})
	}, [onActiveCharChange, selectedVoice, speaking, stopPlayback, text])

	const handleVoiceChange = useCallback(
		(nextVoice: SpeechSynthesisVoice) => {
			stopPlayback()
			if (onVoiceChange) onVoiceChange(nextVoice)
			else setInternalVoice(nextVoice)
		},
		[onVoiceChange, stopPlayback],
	)

	useEffect(() => stopPlayback, [stopPlayback])

	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				onClick={playPassage}
				className="flex size-9 items-center justify-center text-foreground transition hover:scale-110 active:scale-95"
				aria-label={speaking ? "Dừng đọc đoạn văn" : "Đọc đoạn văn"}
				title={speaking ? "Dừng đọc" : "Đọc đoạn văn"}
			>
				{speaking ? (
					<svg
						viewBox="0 0 16 16"
						className="size-5 animate-[flameOuterPulse_900ms_ease-in-out_infinite]"
						fill="currentColor"
						aria-hidden="true"
					>
						<path d="M2.5 6.2v3.6h2.4L8 12.5v-9L4.9 6.2H2.5z" />
						<path d="M10 5.4a3.2 3.2 0 0 1 0 5.2l-.8-1a1.9 1.9 0 0 0 0-3.2l.8-1z" />
						<path d="M11.8 3.5a5.5 5.5 0 0 1 0 9l-.8-1a4.2 4.2 0 0 0 0-7l.8-1z" />
					</svg>
				) : (
					<svg viewBox="0 0 16 16" className="ml-0.5 size-5" fill="currentColor" aria-hidden="true">
						<path d="M5 3.5v9l7-4.5-7-4.5z" />
					</svg>
				)}
			</button>
			{showVoicePicker ? (
				<TTSVoicePicker
					voice={selectedVoice}
					onVoiceChange={handleVoiceChange}
					accentClassName="border-skill-reading text-skill-reading"
				/>
			) : null}
		</div>
	)
}
