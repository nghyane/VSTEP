import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Icon } from "#/components/Icon"
import { TranslateSelection } from "#/features/practice/components/TranslateSelection"
import type { SampleMarker } from "#/features/practice/types"
import { cn } from "#/lib/utils"

interface Props {
	answer: string
	markers: SampleMarker[]
	onClose: () => void
}

export function WritingSamplePanel({ answer, markers, onClose }: Props) {
	return (
		<div
			className="fixed inset-0 z-50 bg-background/50 backdrop-blur-[2px] flex items-center justify-center"
			onClick={onClose}
		>
			<div
				className="relative mx-4 max-h-[90vh] w-[calc(100vw-2rem)] max-w-7xl overflow-x-hidden overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<button
					type="button"
					onClick={onClose}
					className="absolute top-3 right-3 z-10 text-muted hover:text-foreground transition"
				>
					<Icon name="close" size="xs" />
				</button>
				<div className="pt-10 pb-8 px-4">
					<SampleContent answer={answer} markers={markers} />
				</div>
			</div>
		</div>
	)
}

const HIGHLIGHT_BG: Record<string, string> = {
	yellow: "bg-yellow-200/40",
	blue: "bg-blue-200/30",
	pink: "bg-pink-200/40",
}

const DOT_BG: Record<string, string> = {
	yellow: "bg-yellow-400",
	blue: "bg-blue-400",
	pink: "bg-pink-400",
}

const strokeStyle = {
	textShadow: "-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff",
} as const

function SampleContent({ answer, markers }: { answer: string; markers: SampleMarker[] }) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [lines, setLines] = useState<{ id: string; d: string }[]>([])
	const segments = useMemo(() => buildSegments(answer, markers), [answer, markers])
	const leftMarkers = useMemo(() => markers.filter((m) => m.side === "left"), [markers])
	const rightMarkers = useMemo(() => markers.filter((m) => m.side === "right"), [markers])

	const computeLines = useCallback(() => {
		const el = containerRef.current
		if (!el) return
		const cRect = el.getBoundingClientRect()
		const result: { id: string; d: string }[] = []
		for (const m of markers) {
			const dot = el.querySelector(`[data-sticker="${m.id}"]`)
			const anchor = el.querySelector(`[data-anchor="${m.id}"]`)
			if (!dot || !anchor) continue
			const dR = dot.getBoundingClientRect()
			const aR = anchor.getBoundingClientRect()
			const x1 = m.side === "left" ? dR.right - cRect.left : aR.right - cRect.left
			const y1 = m.side === "left" ? dR.top + dR.height / 2 - cRect.top : aR.top + aR.height / 2 - cRect.top
			const x2 = m.side === "left" ? aR.left - cRect.left : dR.left - cRect.left
			const y2 = m.side === "left" ? aR.top + aR.height / 2 - cRect.top : dR.top + dR.height / 2 - cRect.top
			const cx = Math.abs(x2 - x1) * 0.45
			result.push({ id: m.id, d: `M${x1},${y1} C${x1 + cx},${y1} ${x2 - cx},${y2} ${x2},${y2}` })
		}
		setLines(result)
	}, [markers])

	useEffect(() => {
		const t = setTimeout(computeLines, 120)
		window.addEventListener("resize", computeLines)
		return () => {
			clearTimeout(t)
			window.removeEventListener("resize", computeLines)
		}
	}, [computeLines])

	return (
		<div ref={containerRef} className="relative">
			<svg
				aria-hidden="true"
				role="presentation"
				className="pointer-events-none absolute inset-0 size-full overflow-visible"
				style={{ zIndex: 10 }}
			>
				{lines.map((l) => (
					<path key={l.id} d={l.d} fill="none" stroke="#d4d4d8" strokeWidth={1.5} strokeDasharray="5 4" />
				))}
			</svg>

			<div className="mx-auto w-full max-w-3xl card px-6 py-5">
				<p className="text-xs font-bold text-skill-writing uppercase tracking-wide mb-3">Bài mẫu</p>
				<TranslateSelection>
					<p className="whitespace-pre-wrap text-sm leading-[2] text-foreground">
						{segments.map((seg, i) =>
							seg.marker ? (
								<span
									key={i}
									data-anchor={seg.marker.id}
									className={cn("rounded px-0.5", HIGHLIGHT_BG[seg.marker.color])}
								>
									{seg.text}
								</span>
							) : (
								<span key={i}>{seg.text}</span>
							),
						)}
					</p>
				</TranslateSelection>
			</div>

			{leftMarkers.map((m, i) => (
				<div
					key={m.id}
					className="absolute right-[calc(50%+24rem+1.5rem)] hidden w-40 text-right xl:block"
					style={{ top: `${i * 100 + 48}px` }}
				>
					<div className="flex items-center justify-end gap-2">
						<span className="text-xs font-bold text-black" style={strokeStyle}>
							{m.label}
						</span>
						<span
							data-sticker={m.id}
							className={cn("inline-block size-2.5 shrink-0 rounded-full", DOT_BG[m.color])}
						/>
					</div>
					{m.detail && (
						<p className="mt-1 text-xs text-black" style={strokeStyle}>
							{m.detail}
						</p>
					)}
				</div>
			))}

			{rightMarkers.map((m, i) => (
				<div
					key={m.id}
					className="absolute left-[calc(50%+24rem+1.5rem)] hidden w-40 xl:block"
					style={{ top: `${i * 100 + 48}px` }}
				>
					<div className="flex items-center gap-2">
						<span
							data-sticker={m.id}
							className={cn("inline-block size-2.5 shrink-0 rounded-full", DOT_BG[m.color])}
						/>
						<span className="text-xs font-bold text-black" style={strokeStyle}>
							{m.label}
						</span>
					</div>
					{m.detail && (
						<p className="mt-1 text-xs text-black" style={strokeStyle}>
							{m.detail}
						</p>
					)}
				</div>
			))}

			{markers.length > 0 && (
				<div className="mx-auto max-w-3xl mt-4 grid gap-2 sm:grid-cols-2 xl:hidden">
					{markers.map((m) => (
						<div key={m.id} className="flex items-start gap-2 rounded-lg border-2 border-border p-3">
							<span className={cn("mt-0.5 size-2.5 shrink-0 rounded-full", DOT_BG[m.color])} />
							<div>
								<p className="text-xs font-bold text-black" style={strokeStyle}>
									{m.label}
								</p>
								{m.detail && (
									<p className="text-xs text-black mt-0.5" style={strokeStyle}>
										{m.detail}
									</p>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

interface Segment {
	text: string
	marker: SampleMarker | null
}

function buildSegments(answer: string, markers: SampleMarker[]): Segment[] {
	if (markers.length === 0) return [{ text: answer, marker: null }]

	const ranges: { start: number; end: number; marker: SampleMarker }[] = []
	for (const m of markers) {
		let idx = -1
		let occ = 0
		const target = m.occurrence || 1
		let searchFrom = 0
		while (occ < target) {
			idx = answer.indexOf(m.match, searchFrom)
			if (idx === -1) break
			occ++
			searchFrom = idx + 1
		}
		if (idx !== -1) ranges.push({ start: idx, end: idx + m.match.length, marker: m })
	}
	ranges.sort((a, b) => a.start - b.start)

	const result: Segment[] = []
	let cursor = 0
	for (const r of ranges) {
		if (r.start < cursor) continue
		if (r.start > cursor) result.push({ text: answer.slice(cursor, r.start), marker: null })
		result.push({ text: answer.slice(r.start, r.end), marker: r.marker })
		cursor = r.end
	}
	if (cursor < answer.length) result.push({ text: answer.slice(cursor), marker: null })
	return result
}
