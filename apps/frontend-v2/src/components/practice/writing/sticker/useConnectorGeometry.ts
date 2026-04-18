// useConnectorGeometry — tính SVG path cubic Bezier nối StickerNote ↔ StickerAnchor.
// Hỗ trợ sticker ở cả lề trái (note.right → anchor.left) và lề phải (anchor.right → note.left).

import { useCallback, useEffect, useRef, useState } from "react"

export interface ConnectorPath {
	id: string
	d: string
	dotX: number
	dotY: number
	tone: StickerTone
}

export type StickerTone = "teach" | "warn" | "ok" | "info"
export type StickerSide = "left" | "right"

export const TONE_COLORS: Record<StickerTone, string> = {
	teach: "stroke-amber-400 fill-amber-400",
	warn: "stroke-destructive fill-destructive",
	ok: "stroke-success fill-success",
	info: "stroke-primary fill-primary",
}

interface RefEntry {
	id: string
	tone: StickerTone
	side: StickerSide
	noteEl: HTMLElement | null
	anchorEl: HTMLElement | null
}

export function useConnectorGeometry() {
	const containerRef = useRef<HTMLDivElement>(null)
	const entriesRef = useRef<Map<string, RefEntry>>(new Map())
	const [paths, setPaths] = useState<ConnectorPath[]>([])

	const ensureEntry = useCallback(
		(id: string, tone: StickerTone = "teach", side: StickerSide = "left"): RefEntry => {
			let e = entriesRef.current.get(id)
			if (!e) {
				e = { id, tone, side, noteEl: null, anchorEl: null }
				entriesRef.current.set(id, e)
			}
			e.tone = tone
			e.side = side
			return e
		},
		[],
	)

	const registerNote = useCallback(
		(
			id: string,
			el: HTMLElement | null,
			tone: StickerTone = "teach",
			side: StickerSide = "left",
		) => {
			ensureEntry(id, tone, side).noteEl = el
		},
		[ensureEntry],
	)

	const registerAnchor = useCallback(
		(id: string, el: HTMLElement | null) => {
			const entry = entriesRef.current.get(id)
			if (entry) entry.anchorEl = el
			else ensureEntry(id).anchorEl = el
		},
		[ensureEntry],
	)

	const recompute = useCallback(() => {
		const container = containerRef.current
		if (!container) return
		const cRect = container.getBoundingClientRect()
		const result: ConnectorPath[] = []

		for (const entry of entriesRef.current.values()) {
			if (!entry.noteEl || !entry.anchorEl) continue
			const nRect = entry.noteEl.getBoundingClientRect()
			const aRect = entry.anchorEl.getBoundingClientRect()

			let x1: number, y1: number, x2: number, y2: number

			if (entry.side === "left") {
				// Note is on the left → line goes note.right → anchor.left
				x1 = nRect.right - cRect.left
				y1 = nRect.top + nRect.height / 2 - cRect.top
				x2 = aRect.left - cRect.left
				y2 = aRect.top + aRect.height / 2 - cRect.top
			} else {
				// Note is on the right → line goes anchor.right → note.left
				x1 = aRect.right - cRect.left
				y1 = aRect.top + aRect.height / 2 - cRect.top
				x2 = nRect.left - cRect.left
				y2 = nRect.top + nRect.height / 2 - cRect.top
			}

			const dx = Math.abs(x2 - x1) * 0.4
			const d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`

			result.push({ id: entry.id, d, dotX: x2, dotY: y2, tone: entry.tone })
		}
		setPaths(result)
	}, [])

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		recompute()
		const ro = new ResizeObserver(() => recompute())
		ro.observe(container)

		return () => ro.disconnect()
	}, [recompute])

	return { containerRef, paths, registerNote, registerAnchor, recompute }
}
