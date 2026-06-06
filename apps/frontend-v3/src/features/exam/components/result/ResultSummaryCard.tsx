import type { ResultViewModel } from "#/features/exam/components/result/view-model"
import { cn } from "#/lib/utils"

export function ResultSummaryCard({ model }: { readonly model: ResultViewModel }) {
	return (
		<section className="card shrink-0 overflow-hidden bg-surface p-3">
			<div className="rounded-(--radius-card) bg-background p-4">
				<p className="text-xs font-black uppercase tracking-[0.16em] text-muted">Tổng điểm</p>
				<div className="mt-2 flex items-end gap-2">
					<p className={cn("text-6xl font-black leading-none tabular-nums", overallToneClass(model))}>
						{model.overall.scoreLabel}
					</p>
					<p className="pb-1 text-sm font-black text-foreground">{model.overall.maxScoreLabel}</p>
				</div>
				<div className="mt-2 flex flex-wrap gap-2">
					<p className="inline-flex rounded-full bg-surface px-3 py-1 text-sm font-extrabold text-foreground">
						{model.overall.resultLabel}
					</p>
					{model.statusNotice && (
						<p
							className={cn(
								"inline-flex rounded-full border px-3 py-1 text-xs font-extrabold",
								noticeToneClass(model.statusNotice.tone),
							)}
						>
							{model.statusNotice.label}
						</p>
					)}
				</div>
			</div>

			<div className="mt-3 grid grid-cols-2 gap-2">
				{model.skills.map((skill) => (
					<div key={skill.key} className="min-h-24 rounded-(--radius-card) bg-background px-3 py-3">
						<div className="flex items-center gap-2">
							<span
								className="size-2.5 shrink-0 rounded-full"
								style={{ backgroundColor: skillColor(skill.key) }}
							/>
							<p className="text-sm font-black text-foreground">{skill.label}</p>
						</div>
						<p className="mt-1 text-[11px] font-bold leading-tight text-muted">{skill.detailLabel}</p>
						<p
							className={cn("mt-3 text-lg font-black tabular-nums", scoreToneClass(skill))}
							style={scoreStyle(skill)}
						>
							{skill.scoreLabel}
						</p>
					</div>
				))}
			</div>
		</section>
	)
}

function overallToneClass(model: ResultViewModel): string {
	if (model.overall.status === "failed") return "text-destructive"
	if (model.overall.status === "pending" || model.overall.status === "partial") return "text-foreground"
	return "text-primary-dark"
}

function noticeToneClass(tone: NonNullable<ResultViewModel["statusNotice"]>["tone"]): string {
	if (tone === "warning") return "border-warning/35 bg-warning-tint text-foreground"
	if (tone === "danger") return "border-destructive/35 bg-destructive-tint text-destructive"
	return "border-border bg-surface text-muted"
}

function scoreToneClass(skill: ResultViewModel["skills"][number]): string {
	if (skill.status === "failed") return "text-destructive"
	if (skill.status === "pending" || skill.status === "partial") return "text-foreground"
	return ""
}

function scoreStyle(skill: ResultViewModel["skills"][number]): { readonly color?: string } | undefined {
	if (skill.status === "failed" || skill.status === "pending" || skill.status === "partial") return undefined
	return { color: skillDarkColor(skill.key) }
}

function skillColor(key: ResultViewModel["skills"][number]["key"]): string {
	if (key === "listening") return "var(--color-skill-listening)"
	if (key === "reading") return "var(--color-skill-reading)"
	if (key === "writing") return "var(--color-skill-writing)"
	return "var(--color-skill-speaking)"
}

function skillDarkColor(key: ResultViewModel["skills"][number]["key"]): string {
	if (key === "listening") return "var(--color-skill-listening-dark)"
	if (key === "reading") return "var(--color-skill-reading-dark)"
	if (key === "writing") return "var(--color-skill-writing-dark)"
	return "var(--color-skill-speaking-dark)"
}
