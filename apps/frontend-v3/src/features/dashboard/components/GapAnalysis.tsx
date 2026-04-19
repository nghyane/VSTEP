import weightsIcon from "#/assets/icons/weights-small.svg"
import type { OverviewChart } from "#/features/dashboard/queries"
import { skillByKey, skills } from "#/lib/skills"
import { round } from "#/lib/utils"

const TARGET = 6.0

const STATUS_CLASS = {
	gap: "text-warning",
	pass: "text-success",
	fail: "text-destructive",
	none: "text-subtle",
} as const

interface Props {
	chart: OverviewChart | null
}

export function GapAnalysis({ chart }: Props) {
	const gaps = skills.map((s) => {
		const current = chart?.[s.key] ?? null
		const gap = current !== null ? round(current - TARGET) : null
		const status =
			current === null ? "none" : gap !== null && gap >= 0 ? "pass" : (gap ?? 0) < -1 ? "fail" : "gap"
		return { ...s, current, gap, status } as const
	})

	const weakest = gaps
		.filter((s) => s.gap !== null && s.gap < 0)
		.sort((a, b) => (a.gap ?? 0) - (b.gap ?? 0))[0]

	return (
		<div className="card p-6">
			<h3 className="font-extrabold text-lg text-foreground">Khoảng cách mục tiêu</h3>
			<p className="text-sm text-subtle mt-1">
				Mục tiêu <strong className="text-primary-dark">B2 ({TARGET})</strong> cho mỗi kỹ năng
			</p>

			<div className="space-y-3 mt-5">
				{gaps.map((s) => (
					<div key={s.key} className="flex items-center gap-3 text-sm">
						<span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
						<span className="text-muted w-12 font-semibold">{s.label}</span>
						<div className="flex-1 flex items-center gap-2">
							<span
								className={
									s.status === "fail"
										? "font-extrabold text-base text-destructive"
										: s.current === null
											? "font-extrabold text-base text-subtle"
											: "font-extrabold text-base text-foreground"
								}
							>
								{s.current ?? "—"}
							</span>
							<span className="text-placeholder text-xs">/ {TARGET}</span>
						</div>
						<span className={`text-sm font-bold ${STATUS_CLASS[s.status]}`}>
							{s.status === "none" ? "Chưa thi" : s.status === "pass" ? "✓ Đạt" : `${s.gap?.toFixed(1)}`}
						</span>
					</div>
				))}
			</div>

			{weakest && (
				<a
					href={weakest.route}
					className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-background hover:bg-border/60 transition"
				>
					<img src={weightsIcon} className="w-8 h-auto shrink-0" alt="" />
					<div className="flex-1 min-w-0">
						<p className="text-sm text-subtle">Tập trung kỹ năng yếu nhất</p>
						<p className="font-bold text-sm text-foreground">
							{weakest.label} · cách mục tiêu {Math.abs(weakest.gap ?? 0).toFixed(1)} band
						</p>
					</div>
					<span className="text-muted font-bold">→</span>
				</a>
			)}
		</div>
	)
}
