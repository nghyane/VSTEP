import {
	ArrowRight01Icon,
	Book02Icon,
	CheckmarkCircle02Icon,
	Fire02Icon,
	Target02Icon,
	Time02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { SpiderChart } from "@/components/common/SpiderChart"
import { cn } from "@/lib/utils"
import {
	SKILL_ORDER,
	skillColor,
	skillColorText,
	skillMeta,
} from "@/routes/_learner/exams/-components/skill-meta"
import type { Skill } from "@/types/api"

export const Route = createFileRoute("/_learner/practice/")({
	component: PracticePage,
})

// --- Mock data ---

const MOCK_SCORES: Record<
	Skill,
	{ score: number; total: number; exercisesDone: number; lastPractice: string }
> = {
	listening: { score: 6.5, total: 10, exercisesDone: 12, lastPractice: "Hôm nay" },
	reading: { score: 7.0, total: 10, exercisesDone: 15, lastPractice: "Hôm qua" },
	writing: { score: 4.5, total: 10, exercisesDone: 3, lastPractice: "3 ngày trước" },
	speaking: { score: 3.8, total: 10, exercisesDone: 2, lastPractice: "1 tuần trước" },
}

const MOCK_STATS = {
	totalExercises: 32,
	totalTime: 14.5, // hours
	streak: 5,
	targetLevel: "B2",
	estimatedLevel: "B1+",
	weeklyGoal: 10,
	weeklyDone: 6,
	recentActivity: [
		{ label: "Listening B1 — Đề 01", time: "Hôm nay", score: "7/8" },
		{ label: "Reading B2 — Đề 01", time: "Hôm qua", score: "8/10" },
		{ label: "Writing B1 — Viết thư", time: "2 ngày trước", score: "6.5/10" },
	],
}

const WEAK_THRESHOLD = 5.0

function isWeak(skill: Skill): boolean {
	return MOCK_SCORES[skill].score < WEAK_THRESHOLD
}

function getSortedSkills(): Skill[] {
	return [...SKILL_ORDER].sort((a, b) => {
		const aWeak = isWeak(a)
		const bWeak = isWeak(b)
		if (aWeak !== bWeak) return aWeak ? -1 : 1
		return MOCK_SCORES[a].score - MOCK_SCORES[b].score
	})
}

function getAvgScore(): number {
	const scores = SKILL_ORDER.map((s) => MOCK_SCORES[s].score)
	return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
}

// --- Page ---

function PracticePage() {
	const sortedSkills = getSortedSkills()
	const avg = getAvgScore()
	const weeklyPct = Math.round((MOCK_STATS.weeklyDone / MOCK_STATS.weeklyGoal) * 100)

	const spiderSkills = SKILL_ORDER.map((s) => ({
		label: skillMeta[s].label,
		value: MOCK_SCORES[s].score,
		color: skillColorText[s],
	}))

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Luyện tập</h1>
				<p className="mt-1 text-muted-foreground">Chọn kỹ năng để luyện tập theo trình độ</p>
			</div>

			<div className="flex flex-col gap-6 lg:flex-row">
				{/* Left — skill cards */}
				<div className="flex-1 space-y-3">
					{sortedSkills.map((skill) => {
						const meta = skillMeta[skill]
						const data = MOCK_SCORES[skill]
						const weak = isWeak(skill)

						return (
							<Link
								key={skill}
								to={`/practice/${skill}`}
								className={cn(
									"group flex items-center gap-4 rounded-2xl border p-5 transition-all hover:shadow-md",
									weak
										? "border-orange-300/50 bg-orange-50/30 dark:border-orange-500/20 dark:bg-orange-950/10"
										: "hover:border-primary/30",
								)}
							>
								<div
									className={cn(
										"flex size-12 items-center justify-center rounded-xl",
										skillColor[skill],
									)}
								>
									<HugeiconsIcon icon={meta.icon} className="size-6" />
								</div>

								<div className="flex-1 space-y-1.5">
									<div className="flex items-center gap-2">
										<span className="text-base font-semibold">{meta.label}</span>
										{weak && (
											<span className="rounded-md bg-orange-500/15 px-2 py-0.5 text-[10px] font-medium text-orange-600 dark:text-orange-400">
												Cần học thêm
											</span>
										)}
									</div>
									<div className="flex items-center gap-4 text-xs text-muted-foreground">
										<span>
											Điểm:{" "}
											<span
												className={cn(
													"font-semibold",
													weak ? "text-orange-600" : "text-foreground",
												)}
											>
												{data.score}
											</span>
											/{data.total}
										</span>
										<span>{data.exercisesDone} bài đã làm</span>
										<span>{data.lastPractice}</span>
									</div>
									<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
										<div
											className={cn(
												"h-full rounded-full transition-all",
												weak ? "bg-orange-500" : "bg-primary",
											)}
											style={{ width: `${(data.score / data.total) * 100}%` }}
										/>
									</div>
								</div>

								<HugeiconsIcon
									icon={ArrowRight01Icon}
									className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
								/>
							</Link>
						)
					})}
				</div>

				{/* Right — spider chart + stats */}
				<div className="w-full space-y-4 lg:w-[340px] lg:shrink-0">
					{/* Spider chart */}
					<div className="rounded-2xl border p-5">
						<p className="text-sm font-semibold">Tổng quan kỹ năng</p>
						<SpiderChart
							skills={spiderSkills}
							className="mx-auto aspect-square w-full max-w-[260px]"
						/>
					</div>

					{/* Level & average */}
					<div className="rounded-2xl border p-5">
						<div className="flex items-center gap-3">
							<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
								<HugeiconsIcon icon={Target02Icon} className="size-5 text-primary" />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Trình độ ước tính</p>
								<p className="text-lg font-bold">{MOCK_STATS.estimatedLevel}</p>
							</div>
							<div className="ml-auto text-right">
								<p className="text-xs text-muted-foreground">Mục tiêu</p>
								<p className="text-lg font-bold text-primary">{MOCK_STATS.targetLevel}</p>
							</div>
						</div>
						<div className="mt-4 flex items-center justify-between text-sm">
							<span className="text-muted-foreground">Điểm trung bình</span>
							<span className="font-semibold">{avg}/10</span>
						</div>
						<div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-primary transition-all"
								style={{ width: `${(avg / 10) * 100}%` }}
							/>
						</div>
					</div>

					{/* Quick stats */}
					<div className="grid grid-cols-3 gap-3">
						<div className="rounded-xl border p-3 text-center">
							<HugeiconsIcon icon={Book02Icon} className="mx-auto size-4 text-muted-foreground" />
							<p className="mt-1 text-lg font-bold">{MOCK_STATS.totalExercises}</p>
							<p className="text-[10px] text-muted-foreground">Bài đã làm</p>
						</div>
						<div className="rounded-xl border p-3 text-center">
							<HugeiconsIcon icon={Time02Icon} className="mx-auto size-4 text-muted-foreground" />
							<p className="mt-1 text-lg font-bold">{MOCK_STATS.totalTime}h</p>
							<p className="text-[10px] text-muted-foreground">Thời gian học</p>
						</div>
						<div className="rounded-xl border p-3 text-center">
							<HugeiconsIcon icon={Fire02Icon} className="mx-auto size-4 text-orange-500" />
							<p className="mt-1 text-lg font-bold">{MOCK_STATS.streak}</p>
							<p className="text-[10px] text-muted-foreground">Ngày streak</p>
						</div>
					</div>

					{/* Weekly goal */}
					<div className="rounded-2xl border p-5">
						<div className="flex items-center justify-between">
							<p className="text-sm font-semibold">Mục tiêu tuần</p>
							<span className="text-xs text-muted-foreground">
								{MOCK_STATS.weeklyDone}/{MOCK_STATS.weeklyGoal} bài
							</span>
						</div>
						<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								className={cn(
									"h-full rounded-full transition-all",
									weeklyPct >= 100 ? "bg-green-500" : "bg-primary",
								)}
								style={{ width: `${Math.min(weeklyPct, 100)}%` }}
							/>
						</div>
						{weeklyPct >= 100 && (
							<p className="mt-2 flex items-center gap-1 text-xs text-green-600">
								<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" />
								Đã hoàn thành mục tiêu tuần!
							</p>
						)}
					</div>

					{/* Recent activity */}
					<div className="rounded-2xl border p-5">
						<p className="text-sm font-semibold">Hoạt động gần đây</p>
						<div className="mt-3 space-y-3">
							{MOCK_STATS.recentActivity.map((a) => (
								<div key={a.label} className="flex items-center justify-between text-sm">
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium">{a.label}</p>
										<p className="text-xs text-muted-foreground">{a.time}</p>
									</div>
									<span className="shrink-0 text-xs font-semibold">{a.score}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
