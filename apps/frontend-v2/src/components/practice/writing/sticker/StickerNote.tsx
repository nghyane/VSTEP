// StickerNote — card chú thích ở lề, tone variants (teach/warn/ok/info).
// Rule 0.1: icon render trần, không bọc bg.

import { cn } from "#/lib/utils"
import type { StickerSide, StickerTone } from "./useConnectorGeometry"

const TONE_STYLES: Record<StickerTone, string> = {
	teach: "border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/40",
	warn: "border-destructive/30 bg-destructive/5 dark:border-destructive/40 dark:bg-destructive/10",
	ok: "border-success/30 bg-success/5 dark:border-success/40 dark:bg-success/10",
	info: "border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10",
}

interface Props {
	id: string
	tone?: StickerTone
	side?: StickerSide
	className?: string
	children: React.ReactNode
	registerRef?: (id: string, el: HTMLElement | null, tone: StickerTone, side: StickerSide) => void
}

export function StickerNote({ id, tone = "teach", side = "left", className, children, registerRef }: Props) {
	return (
		<div
			ref={(el) => registerRef?.(id, el, tone, side)}
			data-sticker-note={id}
			className={cn("rounded-xl border p-2.5 text-xs leading-relaxed", TONE_STYLES[tone], className)}
		>
			{children}
		</div>
	)
}
