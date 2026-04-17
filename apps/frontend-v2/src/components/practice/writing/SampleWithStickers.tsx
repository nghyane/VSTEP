// SampleWithStickers — Zen Focus study mode.
// Nhận sampleMarkers từ WritingExercise (đến từ backend Question.content.sampleMarkers[]).
// Tự resolve match-string → range bằng resolveMarkers().

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { TextSelectionPopup } from "#/components/practice/TextSelectionPopup"
import type { SampleMarkerDef } from "#/lib/mock/writing"
import { resolveMarkers, type ResolvedMarker } from "#/lib/practice/writing-sample-markers"
import { cn } from "#/lib/utils"

interface Props {
	sampleAnswer: string
	/** Từ WritingExercise.sampleMarkers — backend trả về trong Question.content */
	sampleMarkers?: readonly SampleMarkerDef[]
}

const HIGHLIGHT_BG: Record<ResolvedMarker["color"], string> = {
	yellow: "bg-yellow-200/50",
	blue: "bg-blue-200/50",
	pink: "bg-pink-200/50",
}

const DOT_BG: Record<ResolvedMarker["color"], string> = {
	yellow: "bg-yellow-400",
	blue: "bg-blue-400",
	pink: "bg-pink-400",
}

interface Line { id: string; d: string }

export function SampleWithStickers({ sampleAnswer, sampleMarkers }: Props) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [lines, setLines] = useState<Line[]>([])

	// Resolve match-string → range. Memoized — chỉ recalc khi sampleAnswer/markers thay đổi.
	const markers = useMemo(
		() => resolveMarkers(sampleAnswer, sampleMarkers),
		[sampleAnswer, sampleMarkers],
	)

	const leftMarkers = useMemo(() => markers.filter((m) => m.side === "left"), [markers])
	const rightMarkers = useMemo(() => markers.filter((m) => m.side === "right"), [markers])

	// Build text segments từ resolved ranges
	const textSegments = useMemo(() => {
		const sorted = [...markers].sort((a, b) => a.range.start - b.range.start)
		const segs: { type: "text" | "anchor"; content: string; markerId?: string }[] = []
		let cursor = 0
		for (const m of sorted) {
			if (m.range.start > cursor) segs.push({ type: "text", content: sampleAnswer.slice(cursor, m.range.start) })
			segs.push({ type: "anchor", content: sampleAnswer.slice(m.range.start, m.range.end), markerId: m.id })
			cursor = m.range.end
		}
		if (cursor < sampleAnswer.length) segs.push({ type: "text", content: sampleAnswer.slice(cursor) })
		return segs
	}, [sampleAnswer, markers])

	const markerMap = useMemo(() => new Map(markers.map((m) => [m.id, m])), [markers])

	// Compute SVG connector lines: dot → anchor span
	const computeLines = useCallback(() => {
		const container = containerRef.current
		if (!container) return
		const cRect = container.getBoundingClientRect()
		const result: Line[] = []
		for (const m of markers) {
			const dotEl = container.querySelector(`[data-sticker="${m.id}"]`)
			const anchorEl = container.querySelector(`[data-anchor="${m.id}"]`)
			if (!dotEl || !anchorEl) continue
			const dRect = dotEl.getBoundingClientRect()
			const aRect = anchorEl.getBoundingClientRect()
			let x1: number, y1: number, x2: number, y2: number
			if (m.side === "left") {
				x1 = dRect.right - cRect.left
				y1 = dRect.top + dRect.height / 2 - cRect.top
				x2 = aRect.left - cRect.left
				y2 = aRect.top + aRect.height / 2 - cRect.top
			} else {
				x1 = aRect.right - cRect.left
				y1 = aRect.top + aRect.height / 2 - cRect.top
				x2 = dRect.left - cRect.left
				y2 = dRect.top + dRect.height / 2 - cRect.top
			}
			const cx = Math.abs(x2 - x1) * 0.45
			result.push({ id: m.id, d: `M${x1},${y1} C${x1 + cx},${y1} ${x2 - cx},${y2} ${x2},${y2}` })
		}
		setLines(result)
	}, [markers])

	useEffect(() => {
		const t = setTimeout(computeLines, 100)
		window.addEventListener("resize", computeLines)
		return () => { clearTimeout(t); window.removeEventListener("resize", computeLines) }
	}, [computeLines])

	return (
		<div ref={containerRef} className="relative">
			{/* SVG connector overlay — z-index cao hơn card */}
			<svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible" style={{ zIndex: 10 }}>
				{lines.map((l) => (
					<path key={l.id} d={l.d} fill="none" stroke="#d4d4d8" strokeWidth={1.5} strokeDasharray="5 4" />
				))}
			</svg>

			{/* Card bài mẫu — cùng max-w với đề bài */}
			<TextSelectionPopup
				promptTemplate={(text) =>
					`Phân tích đoạn "${text}" trong bài mẫu viết tiếng Anh VSTEP. Giải thích cấu trúc ngữ pháp, từ vựng hay, và cách áp dụng vào bài viết của tôi.`
				}
			>
				<div className="mx-auto w-full max-w-3xl rounded-xl border bg-card px-5 py-4">
					<p className="whitespace-pre-wrap text-[15px] leading-[2] text-foreground">
						{textSegments.map((seg, i) => {
							if (seg.type === "text") return <span key={i}>{seg.content}</span>
							const m = seg.markerId ? markerMap.get(seg.markerId) : undefined
							return (
								<span
									key={i}
									data-anchor={seg.markerId}
									className={cn("rounded px-0.5", m && HIGHLIGHT_BG[m.color])}
								>
									{seg.content}
								</span>
							)
						})}
					</p>
				</div>
			</TextSelectionPopup>

			{/* Left stickers — absolute, tràn ra ngoài card trái */}
			{leftMarkers.map((m, i) => (
				<div
					key={m.id}
					className="absolute right-[calc(50%+24rem+1.5rem)] hidden w-40 text-right xl:block"
					style={{ top: `${i * 100 + 16}px` }}
				>
					<div className="flex items-center justify-end gap-2">
						<span className="text-xs font-semibold text-foreground">{m.label}</span>
						<span data-sticker={m.id} className={cn("inline-block size-2.5 shrink-0 rounded-full", DOT_BG[m.color])} />
					</div>
					{m.detail && <p className="mt-1 text-xs text-muted-foreground">{m.detail}</p>}
				</div>
			))}

			{/* Right stickers — absolute, tràn ra ngoài card phải */}
			{rightMarkers.map((m, i) => (
				<div
					key={m.id}
					className="absolute left-[calc(50%+24rem+1.5rem)] hidden w-40 xl:block"
					style={{ top: `${i * 100 + 16}px` }}
				>
					<div className="flex items-center gap-2">
						<span data-sticker={m.id} className={cn("inline-block size-2.5 shrink-0 rounded-full", DOT_BG[m.color])} />
						<span className="text-xs font-semibold text-foreground">{m.label}</span>
					</div>
					{m.detail && <p className="mt-1 text-xs text-muted-foreground">{m.detail}</p>}
				</div>
			))}
		</div>
	)
}
