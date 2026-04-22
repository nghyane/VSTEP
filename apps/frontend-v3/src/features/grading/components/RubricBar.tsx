interface Props {
	label: string
	score: number
	max: number
	color: string
}

export function RubricBar({ label, score, max, color }: Props) {
	const pct = (score / max) * 100

	return (
		<div className="space-y-1">
			<div className="flex justify-between text-sm">
				<span className="font-bold text-foreground">{label}</span>
				<span className="font-extrabold tabular-nums" style={{ color }}>
					{score}/{max}
				</span>
			</div>
			<div className="h-2.5 rounded-full bg-background overflow-hidden">
				<div
					className="h-full rounded-full transition-all duration-500"
					style={{ width: `${pct}%`, backgroundColor: color }}
				/>
			</div>
		</div>
	)
}
