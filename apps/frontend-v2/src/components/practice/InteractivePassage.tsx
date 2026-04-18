// InteractivePassage — render passage text với từng từ có thể hover/tap.
// Hover (desktop) hoặc tap (mobile) → WordTooltipCard nếu từ có trong mock-dictionary.
// Mọi từ đều có thể hover — chỉ highlight khi có entry trong dict.
// TODO(backend): Thay lookupWord() bằng GET /api/v1/dictionary?word=...
// Khi có API: từ không có trong dict vẫn lookup được → bỏ điều kiện hasEntry.

import { Volume2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { lookupWord, type WordEntry } from "#/lib/practice/mock-dictionary"
import { cn } from "#/shared/lib/utils"

export function InteractivePassage({ text }: { text: string }) {
	const [tooltip, setTooltip] = useState<{ entry: WordEntry; x: number; y: number } | null>(null)
	const isDragging = useRef(false)
	const hoverTimer = useRef<number | null>(null)

	const clearTimer = useCallback(() => {
		if (hoverTimer.current !== null) {
			window.clearTimeout(hoverTimer.current)
			hoverTimer.current = null
		}
	}, [])

	// Close tooltip on scroll
	useEffect(() => {
		if (!tooltip) return
		function close() {
			setTooltip(null)
		}
		window.addEventListener("scroll", close, true)
		return () => window.removeEventListener("scroll", close, true)
	}, [tooltip])

	function handleWordEnter(word: string, el: HTMLElement) {
		if (isDragging.current) return
		clearTimer()
		const entry = lookupWord(word)
		if (!entry) return // từ không có trong dict — khi có API thật thì fetch ở đây
		hoverTimer.current = window.setTimeout(() => {
			const rect = el.getBoundingClientRect()
			setTooltip({ entry, x: rect.left + rect.width / 2, y: rect.top })
		}, 300)
	}

	function handleWordLeave() {
		clearTimer()
	}

	function handleWordClick(word: string, el: HTMLElement) {
		const entry = lookupWord(word)
		if (!entry) {
			setTooltip(null)
			return
		}
		const rect = el.getBoundingClientRect()
		setTooltip((prev) =>
			prev?.entry.word === entry.word
				? null
				: { entry, x: rect.left + rect.width / 2, y: rect.top },
		)
	}

	// Track drag để không hiện tooltip khi user đang tô text
	function handleMouseDown() {
		isDragging.current = false
	}
	function handleMouseMove() {
		isDragging.current = true
	}
	function handleMouseUp() {
		setTimeout(() => {
			isDragging.current = false
		}, 50)
	}

	const words = text.split(/(\s+)/)

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: word hover/click for dictionary lookup
		<span onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
			{words.map((segment, i) => {
				if (/^\s+$/.test(segment)) return <span key={i}>{segment}</span>
				// Chỉ highlight từ có trong dict. Khi có API thật: highlight tất cả từ hợp lệ.
				const hasEntry = lookupWord(segment) !== null
				return (
					// biome-ignore lint/a11y/noStaticElementInteractions: dictionary word lookup
					// biome-ignore lint/a11y/useKeyWithClickEvents: mouse-only word lookup by design
					<span
						key={i}
						onMouseEnter={hasEntry ? (e) => handleWordEnter(segment, e.currentTarget) : undefined}
						onMouseLeave={hasEntry ? handleWordLeave : undefined}
						onClick={
							hasEntry
								? (e) => {
										e.stopPropagation()
										handleWordClick(segment, e.currentTarget)
									}
								: undefined
						}
						className={cn(
							hasEntry && "cursor-pointer rounded-sm transition-colors hover:bg-primary/10",
						)}
					>
						{segment}
					</span>
				)
			})}
			{tooltip &&
				createPortal(
					<WordTooltipCard
						entry={tooltip.entry}
						x={tooltip.x}
						y={tooltip.y}
						onClose={() => setTooltip(null)}
					/>,
					document.body,
				)}
		</span>
	)
}

// ─── Tooltip card ──────────────────────────────────────────────────
// TODO(backend): WordEntry đến từ GET /api/v1/dictionary?word=...
// Shape giữ nguyên: { word, ipa, pos, meaning }

function WordTooltipCard({
	entry,
	x,
	y,
	onClose,
}: {
	entry: WordEntry
	x: number
	y: number
	onClose: () => void
}) {
	const ref = useRef<HTMLDivElement>(null)
	const [pos, setPos] = useState({ left: x, top: y })

	useEffect(() => {
		const el = ref.current
		if (!el) return
		const rect = el.getBoundingClientRect()
		let left = x - rect.width / 2
		let top = y - rect.height - 6
		if (left < 8) left = 8
		if (left + rect.width > window.innerWidth - 8) left = window.innerWidth - rect.width - 8
		if (top < 8) top = y + 24
		setPos({ left, top })
	}, [x, y])

	useEffect(() => {
		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose()
		}
		function handleClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) onClose()
		}
		document.addEventListener("keydown", handleKey)
		document.addEventListener("mousedown", handleClick)
		return () => {
			document.removeEventListener("keydown", handleKey)
			document.removeEventListener("mousedown", handleClick)
		}
	}, [onClose])

	function handleSpeak() {
		const utterance = new SpeechSynthesisUtterance(entry.word)
		utterance.lang = "en-US"
		utterance.rate = 0.85
		window.speechSynthesis.cancel()
		window.speechSynthesis.speak(utterance)
	}

	return (
		<div
			ref={ref}
			className="fixed z-50 w-56 rounded-lg border bg-card p-3 shadow-lg"
			style={{ left: pos.left, top: pos.top }}
		>
			<div className="flex items-center justify-between gap-2">
				<p className="text-sm font-semibold text-foreground">{entry.word}</p>
				<button
					type="button"
					onClick={handleSpeak}
					aria-label="Phát âm"
					className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
				>
					<Volume2 className="size-4" />
				</button>
			</div>
			<p className="mt-0.5 text-xs text-muted-foreground">{entry.ipa}</p>
			<p className="mt-1.5 text-xs">
				<span className="rounded bg-muted px-1 py-0.5 text-[11px] font-medium text-muted-foreground">
					{entry.pos}
				</span>
				<span className="ml-1.5 text-foreground/80">{entry.meaning}</span>
			</p>
		</div>
	)
}
