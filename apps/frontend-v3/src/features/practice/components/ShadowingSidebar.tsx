import type { ShadowingSegment } from "#/features/practice/types"
import { cn } from "#/lib/utils"

interface Props {
	segments: ShadowingSegment[]
	current: number
	done: Set<number>
	onSelect: (index: number) => void
}

export function ShadowingSidebar({ segments, current, done, onSelect }: Props) {
	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="px-4 py-3 shrink-0 border-b-2 border-border">
				<p className="text-sm font-bold text-foreground">Phụ đề</p>
			</div>

			{/* Segment list */}
			<div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
				{segments.map((seg, i) => {
					const isDone = done.has(i)
					const isCurrent = i === current
					const locked = !isDone && !isCurrent

					return (
						<button
							key={seg.id}
							type="button"
							onClick={() => onSelect(i)}
							className={cn(
								"w-full text-left rounded-(--radius-card) p-3 transition",
								isCurrent
									? "bg-skill-speaking/15 border-2 border-skill-speaking"
									: isDone
										? "bg-surface border-2 border-border hover:border-skill-speaking/40"
										: "bg-surface border-2 border-border opacity-60",
							)}
						>
							<div className="flex items-center gap-2 mb-1">
								{isDone ? (
									<span className="w-5 h-5 rounded-full bg-success flex items-center justify-center shrink-0">
										<span className="text-primary-foreground text-[10px] font-bold">✓</span>
									</span>
								) : (
									<span className="w-5 h-5 rounded-full border-2 border-border shrink-0" />
								)}
								<span className="text-xs font-bold text-muted">#{i + 1}</span>
								{isCurrent && (
									<span className="text-[10px] font-extrabold bg-foreground text-surface px-1.5 py-0.5 rounded uppercase tracking-wider">
										Đang học
									</span>
								)}
							</div>
							<p
								className={cn(
									"text-sm leading-relaxed",
									locked ? "text-transparent select-none" : "text-foreground",
								)}
								style={locked ? { textShadow: "0 0 8px var(--color-muted)" } : undefined}
							>
								{locked ? seg.text.replace(/\S/g, "•") : seg.text}
							</p>
						</button>
					)
				})}
			</div>
		</div>
	)
}
