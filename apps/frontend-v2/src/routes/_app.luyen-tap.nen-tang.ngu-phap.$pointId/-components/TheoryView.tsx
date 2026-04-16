import type { GrammarPoint } from "#/lib/mock/grammar"

interface Props {
	point: GrammarPoint
}

export function TheoryView({ point }: Props) {
	return (
		<div className="space-y-6">
			<section className="rounded-2xl border bg-card p-6 shadow-sm">
				<h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
					Khi nào dùng
				</h2>
				<p className="mt-2 text-sm leading-relaxed text-foreground/90">{point.whenToUse}</p>
			</section>

			<section className="rounded-2xl border bg-card p-6 shadow-sm">
				<h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
					Cấu trúc
				</h2>
				<ul className="mt-3 space-y-2">
					{point.structures.map((structure) => (
						<li
							key={structure}
							className="rounded-lg bg-muted/50 px-4 py-2.5 font-mono text-sm text-foreground"
						>
							{structure}
						</li>
					))}
				</ul>
			</section>

			<section className="rounded-2xl border bg-card p-6 shadow-sm">
				<h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Ví dụ</h2>
				<ul className="mt-3 space-y-3">
					{point.examples.map((example) => (
						<li key={example.en} className="border-l-2 border-primary/30 pl-4">
							<p className="text-sm font-medium text-foreground">{example.en}</p>
							<p className="mt-0.5 text-xs text-muted-foreground">{example.vi}</p>
							{example.note && (
								<p className="mt-1 text-xs italic text-primary/80">→ {example.note}</p>
							)}
						</li>
					))}
				</ul>
			</section>

			{point.commonMistakes.length > 0 && (
				<section className="rounded-2xl border bg-card p-6 shadow-sm">
					<h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
						Lỗi thường gặp
					</h2>
					<ul className="mt-3 space-y-4">
						{point.commonMistakes.map((mistake) => (
							<li key={mistake.wrong} className="space-y-1">
								<p className="text-sm text-destructive line-through">{mistake.wrong}</p>
								<p className="text-sm font-medium text-success">✓ {mistake.correct}</p>
								<p className="text-xs text-muted-foreground">{mistake.explanation}</p>
							</li>
						))}
					</ul>
				</section>
			)}
		</div>
	)
}
