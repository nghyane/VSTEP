// StickerLayer — container relative + SVG overlay vẽ connector lines.

import { cn } from "#/lib/utils"
import { TONE_COLORS, type ConnectorPath } from "./useConnectorGeometry"

interface Props {
	paths: ConnectorPath[]
	containerRef: React.Ref<HTMLDivElement>
	className?: string
	style?: React.CSSProperties
	children: React.ReactNode
}

export function StickerLayer({ paths, containerRef, className, style, children }: Props) {
	return (
		<div ref={containerRef} className={cn("relative", className)} style={style}>
			{children}
			{paths.length > 0 && (
				<svg
					aria-hidden
					className="pointer-events-none absolute inset-0 size-full overflow-visible"
				>
					{paths.map((p) => (
						<g key={p.id}>
							<path
								d={p.d}
								fill="none"
								strokeWidth={1.5}
								strokeDasharray="4 3"
								className={cn("opacity-50", TONE_COLORS[p.tone])}
							/>
							<circle
								cx={p.dotX}
								cy={p.dotY}
								r={3}
								className={cn("opacity-70", TONE_COLORS[p.tone])}
							/>
						</g>
					))}
				</svg>
			)}
		</div>
	)
}
