import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { AdminWritingMarker } from "#/features/admin-practice/types"
import { useMarkerDrag } from "#/features/admin-practice/useMarkerDrag"

// Màu giống FE - yellow, blue, pink với opacity
const HIGHLIGHT_BG: Record<string, string> = {
	yellow: "rgba(253, 224, 71, 0.4)",
	blue: "rgba(191, 219, 254, 0.3)",
	pink: "rgba(251, 207, 232, 0.4)",
	// Fallback cho các màu cũ
	green: "rgba(187, 247, 208, 0.4)",
	orange: "rgba(254, 215, 170, 0.4)",
	purple: "rgba(233, 213, 255, 0.4)",
	red: "rgba(254, 202, 202, 0.4)",
	teal: "rgba(204, 251, 241, 0.4)",
}

const DOT_BG: Record<string, string> = {
	yellow: "#facc15",
	blue: "#60a5fa",
	pink: "#f472b6",
	// Fallback cho các màu cũ
	green: "#22c55e",
	orange: "#f97316",
	purple: "#a855f7",
	red: "#ef4444",
	teal: "#14b8a6",
}

interface Segment {
	text: string
	marker: AdminWritingMarker | null
}

function buildSegments(answer: string, markers: AdminWritingMarker[]): Segment[] {
	if (markers.length === 0) return [{ text: answer, marker: null }]

	const ranges: { start: number; end: number; marker: AdminWritingMarker }[] = []
	for (const m of markers) {
		let idx = -1
		let count = 0
		let cursor = 0
		while (cursor < answer.length) {
			const found = answer.indexOf(m.match, cursor)
			if (found === -1) break
			count++
			if (count === m.occurrence) {
				idx = found
				break
			}
			cursor = found + 1
		}
		if (idx !== -1) ranges.push({ start: idx, end: idx + m.match.length, marker: m })
	}

	ranges.sort((a, b) => a.start - b.start)
	const result: Segment[] = []
	let cursor = 0
	for (const r of ranges) {
		if (r.start > cursor) result.push({ text: answer.slice(cursor, r.start), marker: null })
		result.push({ text: answer.slice(r.start, r.end), marker: r.marker })
		cursor = r.end
	}
	if (cursor < answer.length) result.push({ text: answer.slice(cursor), marker: null })
	return result
}

interface Props {
	sampleAnswer: string
	markers: AdminWritingMarker[]
	activeMarkerId?: string | null
	onMarkerClick?: (marker: AdminWritingMarker) => void
	onTextSelect?: (selection: { text: string; occurrence: number }) => void
	onReorder?: (updated: AdminWritingMarker[]) => void
}

export function MarkerPreview({
	sampleAnswer,
	markers,
	activeMarkerId,
	onMarkerClick,
	onTextSelect,
	onReorder,
}: Props) {
	const containerRef = useRef<HTMLDivElement>(null)
	const contentRef = useRef<HTMLDivElement>(null)
	const [lines, setLines] = useState<{ id: string; d: string }[]>([])

	const segments = useMemo(() => buildSegments(sampleAnswer, markers), [sampleAnswer, markers])
	const leftMarkers = useMemo(
		() => markers.filter((m) => m.side === "left").sort((a, b) => a.display_order - b.display_order),
		[markers],
	)
	const rightMarkers = useMemo(
		() => markers.filter((m) => m.side === "right").sort((a, b) => a.display_order - b.display_order),
		[markers],
	)

	const { dragId, dragOverId, handleDragStart, handleDragOver, handleDrop, handleColumnDrop, handleDragEnd } =
		useMarkerDrag(leftMarkers, rightMarkers, onReorder)

	const computeLines = useCallback(() => {
		const container = containerRef.current
		if (!container) return
		const cRect = container.getBoundingClientRect()
		const result: { id: string; d: string }[] = []

		for (const m of markers) {
			const dot = container.querySelector(`[data-dot="${m.id}"]`)
			const anchor = container.querySelector(`[data-anchor="${m.id}"]`)
			if (!dot || !anchor) continue

			const dR = dot.getBoundingClientRect()
			const aR = anchor.getBoundingClientRect()

			const dotX = m.side === "left" ? dR.right - cRect.left : dR.left - cRect.left
			const dotY = dR.top + dR.height / 2 - cRect.top
			const anchorX = m.side === "left" ? aR.left - cRect.left : aR.right - cRect.left
			const anchorY = aR.top + aR.height / 2 - cRect.top

			const cx = Math.abs(anchorX - dotX) * 0.4
			const d =
				m.side === "left"
					? `M${dotX},${dotY} C${dotX + cx},${dotY} ${anchorX - cx},${anchorY} ${anchorX},${anchorY}`
					: `M${anchorX},${anchorY} C${anchorX + cx},${anchorY} ${dotX - cx},${dotY} ${dotX},${dotY}`

			result.push({ id: m.id, d })
		}
		setLines(result)
	}, [markers])

	useEffect(() => {
		const t = setTimeout(computeLines, 150)
		window.addEventListener("resize", computeLines)
		return () => {
			clearTimeout(t)
			window.removeEventListener("resize", computeLines)
		}
	}, [computeLines])

	function handleMouseUp() {
		if (!onTextSelect) return
		const selection = window.getSelection()
		if (!selection || selection.isCollapsed) return
		const text = selection.toString().trim()
		if (!text) return

		let occurrence = 1
		const range = selection.getRangeAt(0)
		const preCaretRange = range.cloneRange()
		preCaretRange.selectNodeContents(contentRef.current ?? document.body)
		preCaretRange.setEnd(range.startContainer, range.startOffset)
		const textBefore = preCaretRange.toString()
		const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
		while (regex.exec(textBefore) !== null) {
			occurrence++
		}

		onTextSelect({ text, occurrence })
		selection.removeAllRanges()
	}

	return (
		<div ref={containerRef} style={{ position: "relative" }}>
			{/* SVG lines */}
			<svg
				aria-hidden="true"
				style={{
					position: "absolute",
					inset: 0,
					width: "100%",
					height: "100%",
					overflow: "visible",
					pointerEvents: "none",
					zIndex: 5,
				}}
			>
				{lines.map((l) => (
					<path
						key={l.id}
						d={l.d}
						fill="none"
						stroke={activeMarkerId === l.id ? "#3b82f6" : "#d4d4d8"}
						strokeWidth={activeMarkerId === l.id ? 2 : 1.5}
						strokeDasharray="6 4"
					/>
				))}
			</svg>

			{/* 3-column layout */}
			<div style={{ display: "grid", gridTemplateColumns: "160px 1fr 160px", gap: 16 }}>
				{/* Left markers */}
				<div
					style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 40 }}
					onDragOver={(e) => e.preventDefault()}
					onDrop={(e) => handleColumnDrop(e, "left")}
				>
					{leftMarkers.map((m) => (
						<button
							key={m.id}
							type="button"
							data-dot={m.id}
							draggable={!!onReorder}
							onDragStart={(e) => handleDragStart(e, m.id)}
							onDragOver={(e) => handleDragOver(e, m.id)}
							onDrop={(e) => handleDrop(e, m.id, "left")}
							onDragEnd={handleDragEnd}
							onClick={() => onMarkerClick?.(m)}
							style={
								{
									all: "unset",
									cursor: onReorder ? "grab" : "pointer",
									textAlign: "right",
									transition: "transform 0.15s, opacity 0.15s",
									opacity: dragId === m.id ? 0.4 : 1,
									outline: dragOverId === m.id ? "2px dashed #93c5fd" : "none",
									borderRadius: 6,
									userSelect: "none",
									WebkitUserDrag: "element",
								} as React.CSSProperties
							}
							onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
							onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
						>
							<div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
								<span
									style={{
										fontSize: 13,
										fontWeight: 600,
										color: activeMarkerId === m.id ? "#2563eb" : "#111827",
									}}
								>
									{m.label}
								</span>
								<span
									style={{
										width: 12,
										height: 12,
										borderRadius: "50%",
										backgroundColor: DOT_BG[m.color] ?? "#9ca3af",
										flexShrink: 0,
									}}
								/>
							</div>
							{m.detail && (
								<p style={{ marginTop: 2, fontSize: 11, color: "#9ca3af", textAlign: "right" }}>{m.detail}</p>
							)}
						</button>
					))}
				</div>

				{/* Center content */}
				<div
					style={{
						borderRadius: 16,
						border: "2px solid #e5e7eb",
						backgroundColor: "#fff",
						boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
					}}
				>
					<div style={{ padding: "20px 24px" }}>
						<p
							style={{
								fontSize: 12,
								fontWeight: 700,
								color: "#f97316",
								textTransform: "uppercase",
								letterSpacing: "0.05em",
								marginBottom: 16,
							}}
						>
							Bài mẫu
						</p>
						<div ref={contentRef} onMouseUp={handleMouseUp}>
							<div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 2, color: "#1f2937" }}>
								{segments.map((seg, i) =>
									seg.marker ? (
										<span
											key={i}
											data-anchor={seg.marker.id}
											onClick={() => seg.marker && onMarkerClick?.(seg.marker)}
											style={{
												cursor: "pointer",
												borderRadius: 4,
												padding: "2px 4px",
												backgroundColor: HIGHLIGHT_BG[seg.marker.color] ?? "#f3f4f6",
												outline: activeMarkerId === seg.marker.id ? "2px solid #3b82f6" : "none",
												transition: "all 0.15s",
											}}
											title={`${seg.marker.label} • Click để sửa`}
										>
											{seg.text}
										</span>
									) : (
										<span key={i}>{seg.text}</span>
									),
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Right markers */}
				<div
					style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 40 }}
					onDragOver={(e) => e.preventDefault()}
					onDrop={(e) => handleColumnDrop(e, "right")}
				>
					{rightMarkers.map((m) => (
						<button
							key={m.id}
							type="button"
							data-dot={m.id}
							draggable={!!onReorder}
							onDragStart={(e) => handleDragStart(e, m.id)}
							onDragOver={(e) => handleDragOver(e, m.id)}
							onDrop={(e) => handleDrop(e, m.id, "right")}
							onDragEnd={handleDragEnd}
							onClick={() => onMarkerClick?.(m)}
							style={
								{
									all: "unset",
									cursor: onReorder ? "grab" : "pointer",
									textAlign: "left",
									transition: "transform 0.15s, opacity 0.15s",
									opacity: dragId === m.id ? 0.4 : 1,
									outline: dragOverId === m.id ? "2px dashed #93c5fd" : "none",
									borderRadius: 6,
									userSelect: "none",
									WebkitUserDrag: "element",
								} as React.CSSProperties
							}
							onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
							onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
						>
							<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<span
									style={{
										width: 12,
										height: 12,
										borderRadius: "50%",
										backgroundColor: DOT_BG[m.color] ?? "#9ca3af",
										flexShrink: 0,
									}}
								/>
								<span
									style={{
										fontSize: 13,
										fontWeight: 600,
										color: activeMarkerId === m.id ? "#2563eb" : "#111827",
									}}
								>
									{m.label}
								</span>
							</div>
							{m.detail && <p style={{ marginTop: 2, fontSize: 11, color: "#9ca3af" }}>{m.detail}</p>}
						</button>
					))}
				</div>
			</div>
		</div>
	)
}
