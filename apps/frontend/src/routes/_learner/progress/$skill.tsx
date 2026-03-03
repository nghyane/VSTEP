import { Book02Icon, HeadphonesIcon, Mic01Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useSkillDetail } from "@/hooks/use-progress"
import { cn } from "@/lib/utils"
import type { ProgressRecentScore, Skill, StreakDirection, Trend } from "@/types/api"

export const Route = createFileRoute("/_learner/progress/$skill")({
	component: SkillDetailPage,
})

const skillMeta: Record<Skill, { label: string; icon: IconSvgElement }> = {
	listening: { label: "Listening", icon: HeadphonesIcon },
	reading: { label: "Reading", icon: Book02Icon },
	writing: { label: "Writing", icon: PencilEdit02Icon },
	speaking: { label: "Speaking", icon: Mic01Icon },
}

const skillBarBg: Record<Skill, string> = {
	listening: "bg-skill-listening",
	reading: "bg-skill-reading",
	writing: "bg-skill-writing",
	speaking: "bg-skill-speaking",
}

const trendDisplay: Record<Trend, { text: string; className: string }> = {
	improving: { text: "↑ Đang tiến bộ", className: "text-success" },
	stable: { text: "→ Ổn định", className: "text-muted-foreground" },
	declining: { text: "↓ Giảm", className: "text-destructive" },
	inconsistent: { text: "~ Không đều", className: "text-warning" },
	insufficient_data: { text: "— Chưa đủ dữ liệu", className: "text-muted-foreground" },
}

const streakArrow: Record<StreakDirection, string> = {
	up: "↑",
	down: "↓",
	neutral: "→",
}

function SkillDetailPage() {
	const { skill } = Route.useParams()
	const { data, isLoading, error } = useSkillDetail(skill)
	const meta = skillMeta[skill as Skill]

	if (isLoading) {
		return <p className="py-10 text-center text-muted-foreground">Đang tải...</p>
	}

	if (error) {
		return <p className="py-10 text-center text-destructive">Lỗi: {error.message}</p>
	}

	if (!data || !meta) {
		return <p className="py-10 text-center text-destructive">Kỹ năng không hợp lệ</p>
	}

	const trend = trendDisplay[data.trend]
	const prog = data.progress

	return (
		<div className="space-y-6">
			<div>
				<Link to="/progress" className="text-sm text-muted-foreground hover:text-foreground">
					← Tiến độ
				</Link>
				<h1 className="mt-2 text-2xl font-bold">{meta.label} — Chi tiết</h1>
			</div>

			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<StatCard label="Trình độ hiện tại" value={prog?.currentLevel ?? "—"} />
				<StatCard label="Số lần luyện" value={String(prog?.attemptCount ?? 0)} />
				<StatCard
					label="Chuỗi"
					value={`${prog?.streakCount ?? 0} ${streakArrow[prog?.streakDirection ?? "neutral"]}`}
				/>
				<StatCard label="Xu hướng" value={trend.text} valueClassName={trend.className} />
			</div>

			<ScoreHistory scores={data.recentScores} skill={skill as Skill} />

			<div className="rounded-xl bg-muted/30 p-5">
				<h3 className="mb-3 font-semibold">Thống kê</h3>
				<dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
					<div>
						<dt className="text-muted-foreground">Điểm trung bình</dt>
						<dd className="mt-1 text-lg font-bold tabular-nums">
							{data.windowAvg != null ? `${data.windowAvg.toFixed(1)}/10` : "—"}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground">Độ lệch</dt>
						<dd className="mt-1 text-lg font-bold tabular-nums">
							{data.windowDeviation != null ? data.windowDeviation.toFixed(2) : "—"}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground">ETA</dt>
						<dd className="mt-1 text-lg font-bold tabular-nums">
							{data.eta != null ? `${data.eta} tuần` : "—"}
						</dd>
					</div>
				</dl>
			</div>
		</div>
	)
}

function StatCard({
	label,
	value,
	valueClassName,
}: {
	label: string
	value: string
	valueClassName?: string
}) {
	return (
		<div className="rounded-xl bg-muted/30 p-4">
			<p className="text-sm text-muted-foreground">{label}</p>
			<p className={cn("mt-1 text-lg font-bold", valueClassName)}>{value}</p>
		</div>
	)
}

function ScoreHistory({ scores, skill }: { scores: ProgressRecentScore[]; skill: Skill }) {
	return (
		<div className="rounded-xl bg-muted/30 p-5">
			<h3 className="mb-3 font-semibold">Lịch sử điểm số</h3>
			{scores.length === 0 ? (
				<p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
			) : (
				<div className="space-y-2">
					{scores.map((s, i) => {
						const pct = Math.min(100, (s.score / 10) * 100)
						return (
							<div key={`${s.createdAt}-${i}`} className="flex items-center gap-4 text-sm">
								<span className="w-24 shrink-0 text-muted-foreground tabular-nums">
									{new Date(s.createdAt).toLocaleDateString("vi-VN")}
								</span>
								<div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
									<div
										className={cn("h-full rounded-full", skillBarBg[skill])}
										style={{ width: `${pct}%` }}
									/>
								</div>
								<span className="w-10 text-right font-medium tabular-nums">
									{s.score.toFixed(1)}
								</span>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
