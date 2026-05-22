import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "#/lib/utils"

const COLORS = [
	{ key: "yellow", label: "Vàng", bg: "rgba(255, 200, 0, 0.42)" },
	{ key: "green", label: "Xanh lá", bg: "rgba(88, 204, 2, 0.32)" },
	{ key: "blue", label: "Xanh dương", bg: "rgba(28, 176, 246, 0.3)" },
	{ key: "pink", label: "Hồng", bg: "rgba(255, 90, 120, 0.3)" },
	{ key: "purple", label: "Tím", bg: "rgba(120, 80, 200, 0.3)" },
] as const

type ColorKey = (typeof COLORS)[number]["key"]

interface Highlight {
	start: number
	end: number
	color: ColorKey
}

interface Props {
	text: string
	passageId: string
	className?: string
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

export function HighlightablePassage({ text, passageId, className }: Props) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [store, setStore] = useState<Map<string, Highlight[]>>(new Map())
	const [palette, setPalette] = useState<{ x: number; y: number; start: number; end: number } | null>(null)

	const current = store.get(passageId) ?? []

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
	let cursor = 0
	for (const hl of sorted) {
		if (hl.start > cursor) segments.push(text.slice(cursor, hl.start))
		const color = COLORS.find((c) => c.key === hl.color)
		const idx = current.indexOf(hl)
		segments.push(
			<button
				type="button"
				key={`hl-${hl.start}-${hl.end}`}
				onClick={(e) => {
					e.stopPropagation()
					removeAt(idx)
				}}
				style={{ backgroundColor: color?.bg }}
				className="cursor-pointer rounded-sm px-0.5 text-inherit text-left"
				title="Click để xóa highlight"
			>
				{text.slice(hl.start, hl.end)}
			</button>,
		)
		cursor = hl.end
	}
	if (cursor < text.length) segments.push(text.slice(cursor))

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
		</>
	)
}
