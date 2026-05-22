import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "#/lib/utils"

interface Props {
	children: React.ReactNode
	className?: string
	/** Extra class(es) for the track (right-edge column wrapping the thumb). */
	trackClassName?: string
	/** Extra class(es) for the thumb — dùng khi nền sáng và muốn thumb nổi rõ hơn. */
	thumbClassName?: string
	/**
	 * Max-height cho viewport. Khác với `max-h-*` trong className (áp cho outer, viewport
	 * dùng h-full nên không clamp): prop này áp inline max-height lên viewport → content
	 * ngắn shrink theo content, content dài mới scroll. Đơn vị mặc định: px.
	 */
	maxHeight?: number | string
}

/**
 * ScrollArea — ẩn native scrollbar hoàn toàn, render thumb bằng DOM.
 * Không dùng CSS ::-webkit-scrollbar (có OS arrow trên Windows).
 * Pattern từ Radix ScrollArea: viewport overflow:hidden + custom thumb div.
 */
export function ScrollArea({ children, className, trackClassName, thumbClassName, maxHeight }: Props) {
	const viewportRef = useRef<HTMLDivElement>(null)
	const thumbRef = useRef<HTMLDivElement>(null)
	const trackRef = useRef<HTMLDivElement>(null)
	const [thumbHeight, setThumbHeight] = useState(0)
	const [thumbTop, setThumbTop] = useState(0)
	const [visible, setVisible] = useState(false)
	const dragStartY = useRef<number | null>(null)
	const dragStartScroll = useRef(0)

	const update = useCallback(() => {
		const el = viewportRef.current
		if (!el) return
		const ratio = el.clientHeight / el.scrollHeight
		const hasScroll = ratio < 1
		setVisible(hasScroll)
		if (!hasScroll) return
		const minThumb = 40
		const trackH = el.clientHeight
		const th = Math.max(minThumb, ratio * trackH)
		const scrollable = el.scrollHeight - el.clientHeight
		const thumbScrollable = trackH - th
		const top = scrollable > 0 ? (el.scrollTop / scrollable) * thumbScrollable : 0
		setThumbHeight(th)
		setThumbTop(top)
	}, [])

	useEffect(() => {
		const el = viewportRef.current
		if (!el) return
		update()
		el.addEventListener("scroll", update, { passive: true })
		const ro = new ResizeObserver(update)
		ro.observe(el)
		return () => {
			el.removeEventListener("scroll", update)
			ro.disconnect()
		}
	}, [update])

	function handleThumbPointerDown(e: React.PointerEvent) {
		e.preventDefault()
		dragStartY.current = e.clientY
		dragStartScroll.current = viewportRef.current?.scrollTop ?? 0
		window.addEventListener("pointermove", handlePointerMove)
		window.addEventListener("pointerup", handlePointerUp)
	}

	function handlePointerMove(e: PointerEvent) {
		const el = viewportRef.current
		if (!el || dragStartY.current === null) return
		const dy = e.clientY - dragStartY.current
		const trackH = el.clientHeight
		const scrollable = el.scrollHeight - el.clientHeight
		const thumbScrollable = trackH - thumbHeight
		const ratio = thumbScrollable > 0 ? scrollable / thumbScrollable : 0
		el.scrollTop = Math.max(0, Math.min(scrollable, dragStartScroll.current + dy * ratio))
	}

	function handlePointerUp() {
		dragStartY.current = null
		window.removeEventListener("pointermove", handlePointerMove)
		window.removeEventListener("pointerup", handlePointerUp)
	}

	function handleTrackClick(e: React.MouseEvent) {
		const el = viewportRef.current
		const track = trackRef.current
		if (!el || !track) return
		const rect = track.getBoundingClientRect()
		const clickY = e.clientY - rect.top
		const center = thumbTop + thumbHeight / 2
		const scrollable = el.scrollHeight - el.clientHeight
		const trackH = el.clientHeight
		const thumbScrollable = trackH - thumbHeight
		const ratio = thumbScrollable > 0 ? scrollable / thumbScrollable : 0
		const delta = (clickY - center) * ratio
		el.scrollTop = Math.max(0, Math.min(scrollable, el.scrollTop + delta))
	}

	return (
		<div className={cn("relative overflow-hidden", className)}>
			{/* Viewport — native scrollbar ẩn bằng scrollbar-width:none (không dùng padding trick
			    để content flush với thumb, không có gap bên phải) */}
			<div
				ref={viewportRef}
				className="scrollbar-none h-full w-full overflow-y-auto"
				style={{ maxHeight: maxHeight ?? undefined }}
			>
				{children}
			</div>

			{/* Custom scrollbar track */}
			{visible && (
				<div
					ref={trackRef}
					onClick={handleTrackClick}
					className={cn("absolute right-0 top-0 bottom-0 w-1 cursor-pointer", trackClassName)}
					style={{ userSelect: "none" }}
				>
					{/* Thumb */}
					<div
						ref={thumbRef}
						onPointerDown={handleThumbPointerDown}
						className={cn(
							"absolute right-0 left-0 rounded-full bg-border hover:bg-placeholder transition-colors cursor-grab active:cursor-grabbing",
							thumbClassName,
						)}
						style={{ height: thumbHeight, top: thumbTop }}
					/>
				</div>
			)}
		</div>
	)
}
