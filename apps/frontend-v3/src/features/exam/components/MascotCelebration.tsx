interface Props {
	examTitle: string
	overallBand: number | null
	level: string
}

export function MascotCelebration({ examTitle, overallBand, level }: Props) {
	return (
		<div className="flex flex-col items-center px-4">
			<img src="/mascot/lac-happy.png" alt="" className="w-36 h-36 object-contain" />
			<p className="mt-2 text-lg font-extrabold text-foreground">Chúc mừng!</p>
			<p className="text-sm text-muted">
				Bạn đã hoàn thành <span className="font-bold text-foreground">{examTitle}</span>
			</p>

			{overallBand !== null && (
				<div className="mt-3 inline-flex items-baseline gap-2 rounded-xl bg-primary-tint px-4 py-1.5">
					<span className="text-2xl font-extrabold text-primary tabular-nums">{overallBand.toFixed(1)}</span>
					<span className="text-xs font-bold text-primary">/10 · {level}</span>
				</div>
			)}
		</div>
	)
}
