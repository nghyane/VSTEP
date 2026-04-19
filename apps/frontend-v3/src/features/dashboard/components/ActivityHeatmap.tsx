import { useMemo } from "react"
import { cn } from "#/lib/utils"

const WEEKS = 12
const DAYS = 7
const LEVELS = ["bg-border", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"]
const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

function generateMockData() {
	const cells: number[] = []
	for (let i = 0; i < WEEKS * DAYS; i++) {
		const d = i % DAYS
		const isWeekend = d >= 5
		const r = Math.random()
		if (isWeekend) {
			cells.push(r > 0.7 ? 2 : r > 0.4 ? 1 : 0)
		} else {
			cells.push(r > 0.8 ? 4 : r > 0.5 ? 3 : r > 0.25 ? 2 : r > 0.1 ? 1 : 0)
		}
	}
	return cells
}

export function ActivityHeatmap() {
	const cells = useMemo(generateMockData, [])

	return (
		<section className="card p-6">
			<div className="flex items-start justify-between mb-5">
				<div>
					<h3 className="font-extrabold text-lg text-foreground">Hoạt động luyện tập</h3>
					<p className="text-sm text-subtle mt-1">12 tuần qua · chỉ tính luyện tập</p>
				</div>
				<div className="flex items-center gap-1.5 text-xs text-subtle">
					<span>Ít</span>
					{LEVELS.map((cls) => (
						<span key={cls} className={cn("w-3.5 h-3.5 rounded", cls)} />
					))}
					<span>Nhiều</span>
				</div>
			</div>

			<div className="flex gap-1">
				<div className="flex flex-col gap-1 pt-5 pr-2 shrink-0">
					{DAY_LABELS.map((d) => (
						<div key={d} className="h-4 text-xs text-subtle leading-4">
							{d}
						</div>
					))}
				</div>
				<div className="flex-1 min-w-0">
					<div className="grid grid-rows-7 grid-flow-col gap-1">
						{cells.map((lv, i) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: static mock data
								key={i}
								className={cn(
									"h-4 rounded hover:ring-1 hover:ring-border cursor-pointer transition",
									LEVELS[lv],
								)}
							/>
						))}
					</div>
				</div>
			</div>
		</section>
	)
}
