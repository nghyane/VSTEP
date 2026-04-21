import type { GrammarPointDetail } from "#/features/grammar/types"

export function PointHeader({ detail }: { detail: GrammarPointDetail }) {
	const { point, mastery } = detail
	return (
		<section className="card p-6">
			<div className="flex items-start justify-between">
				<div>
					<h2 className="font-extrabold text-xl text-foreground">{point.name}</h2>
					{point.vietnamese_name && <p className="text-sm text-muted mt-1">{point.vietnamese_name}</p>}
					{point.summary && <p className="text-sm text-subtle mt-2">{point.summary}</p>}
				</div>
				{mastery && (
					<div className="text-right shrink-0 ml-4">
						<span className="text-xs font-bold text-primary bg-primary-tint px-2.5 py-1 rounded-full">
							{mastery.computed_level}
						</span>
						<p className="text-xs text-subtle mt-2">
							{mastery.accuracy_percent}% · {mastery.attempts} lần
						</p>
					</div>
				)}
			</div>
			<div className="flex flex-wrap gap-1.5 mt-4">
				{point.levels.map((lv) => (
					<span key={lv} className="text-xs font-bold text-primary bg-primary-tint px-2 py-0.5 rounded-full">
						{lv}
					</span>
				))}
				{point.functions.map((f) => (
					<span key={f} className="text-xs text-muted bg-background px-2 py-0.5 rounded-full">
						{f}
					</span>
				))}
			</div>
		</section>
	)
}

export function Structures({ structures }: { structures: GrammarPointDetail["structures"] }) {
	if (structures.length === 0) return null
	return (
		<section>
			<h3 className="font-bold text-lg text-foreground mb-3">Cấu trúc</h3>
			<div className="space-y-2">
				{structures.map((s) => (
					<div key={s.id} className="card p-4">
						<p className="font-bold text-sm text-foreground font-mono">{s.template}</p>
						{s.description && <p className="text-sm text-muted mt-1">{s.description}</p>}
					</div>
				))}
			</div>
		</section>
	)
}

export function Examples({ examples }: { examples: GrammarPointDetail["examples"] }) {
	if (examples.length === 0) return null
	return (
		<section>
			<h3 className="font-bold text-lg text-foreground mb-3">Ví dụ</h3>
			<div className="space-y-2">
				{examples.map((e) => (
					<div key={e.id} className="card p-4">
						<p className="text-sm font-bold text-foreground">{e.en}</p>
						<p className="text-sm text-muted mt-1">{e.vi}</p>
						{e.note && <p className="text-xs text-subtle mt-1 italic">{e.note}</p>}
					</div>
				))}
			</div>
		</section>
	)
}

export function CommonMistakes({ mistakes }: { mistakes: GrammarPointDetail["common_mistakes"] }) {
	if (mistakes.length === 0) return null
	return (
		<section>
			<h3 className="font-bold text-lg text-foreground mb-3">Lỗi thường gặp</h3>
			<div className="space-y-2">
				{mistakes.map((m) => (
					<div key={m.id} className="card p-4">
						<p className="text-sm text-destructive line-through">{m.wrong}</p>
						<p className="text-sm text-primary font-bold mt-1">{m.correct}</p>
						{m.explanation && <p className="text-xs text-muted mt-1">{m.explanation}</p>}
					</div>
				))}
			</div>
		</section>
	)
}

export function VstepTips({ tips }: { tips: GrammarPointDetail["vstep_tips"] }) {
	if (tips.length === 0) return null
	return (
		<section>
			<h3 className="font-bold text-lg text-foreground mb-3">VSTEP Tips</h3>
			<div className="space-y-2">
				{tips.map((t) => (
					<div key={t.id} className="card p-4 bg-info-tint border-info">
						<p className="text-xs font-bold text-info mb-1">{t.task}</p>
						<p className="text-sm text-foreground">{t.tip}</p>
						{t.example && <p className="text-xs text-muted mt-1 italic">"{t.example}"</p>}
					</div>
				))}
			</div>
		</section>
	)
}
