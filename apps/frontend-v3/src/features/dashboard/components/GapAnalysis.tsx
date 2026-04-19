import weightsIcon from "#/assets/icons/weights-small.svg"

const SKILLS = [
	{ label: "Nghe", current: 5.5, target: 6.0, color: "bg-skill-listening", gap: -0.5, status: "warning" },
	{ label: "Đọc", current: 6.0, target: 6.0, color: "bg-skill-reading", gap: 0, status: "success" },
	{ label: "Viết", current: 4.5, target: 6.0, color: "bg-skill-writing", gap: -1.5, status: "error" },
	{ label: "Nói", current: 0, target: 6.0, color: "bg-skill-speaking", gap: null, status: "none" },
] as const

const STATUS_CLASS = {
	warning: "text-warning",
	success: "text-success",
	error: "text-destructive",
	none: "text-subtle",
} as const

function formatGap(skill: (typeof SKILLS)[number]) {
	if (skill.gap === null) return "Chưa thi"
	if (skill.gap === 0) return "✓ Đạt"
	return `${skill.gap}`
}

export function GapAnalysis() {
	const weakest = SKILLS.filter((s) => s.gap !== null && s.gap < 0).sort(
		(a, b) => (a.gap ?? 0) - (b.gap ?? 0),
	)[0]

	return (
		<div className="card p-6">
			<h3 className="font-extrabold text-lg text-foreground">Khoảng cách mục tiêu</h3>
			<p className="text-sm text-subtle mt-1">
				Mục tiêu <strong className="text-primary-dark">B2 (6.0)</strong> cho mỗi kỹ năng
			</p>

			<div className="space-y-3 mt-5">
				{SKILLS.map((s) => (
					<div key={s.label} className="flex items-center gap-3 text-sm">
						<span className={`w-2 h-2 rounded-full ${s.color} shrink-0`} />
						<span className="text-muted w-12 font-semibold">{s.label}</span>
						<div className="flex-1 flex items-center gap-2">
							<span
								className={`font-extrabold text-base ${s.status === "error" ? "text-destructive" : s.current === 0 ? "text-subtle" : "text-foreground"}`}
							>
								{s.current || "—"}
							</span>
							<span className="text-placeholder text-xs">/ {s.target}</span>
						</div>
						<span className={`text-sm font-bold ${STATUS_CLASS[s.status]}`}>{formatGap(s)}</span>
					</div>
				))}
			</div>

			{weakest && (
				<a
					href="/luyen-tap"
					className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-background hover:bg-border/60 transition"
				>
					<img src={weightsIcon} className="w-8 h-auto shrink-0" alt="" />
					<div className="flex-1 min-w-0">
						<p className="text-sm text-subtle">Tập trung kỹ năng yếu nhất</p>
						<p className="font-bold text-sm text-foreground">
							{weakest.label} · cách mục tiêu {Math.abs(weakest.gap ?? 0)} band
						</p>
					</div>
					<span className="text-muted font-bold">→</span>
				</a>
			)}
		</div>
	)
}
