import {
	ArrowRight01Icon,
	Book02Icon,
	Fire02Icon,
	Target02Icon,
	Time02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useActivity, useProgress, useSpiderChart } from "@/hooks/use-progress"
import { cn } from "@/lib/utils"
import {
	SKILL_ORDER,
	skillColor,
	skillColorText,
	skillMeta,
} from "@/routes/_learner/exams/-components/skill-meta"
import type { Skill } from "@/types/api"

const SpiderChart = lazy(() =>
	import("@/components/common/SpiderChart").then((module) => ({ default: module.SpiderChart })),
)

export const Route = createFileRoute("/_learner/practice/")({
	component: PracticePage,
})

const WEAK_THRESHOLD = 5.0

function PracticePage() {
	const { data: progress, isLoading: progressLoading } = useProgress()
	const { data: activity, isLoading: activityLoading } = useActivity(7)
	const { data: spiderData, isLoading: spiderLoading } = useSpiderChart()

	const isLoading = progressLoading || activityLoading || spiderLoading

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold">Luyện tập</h1>
					<p className="mt-1 text-muted-foreground">Chọn kỹ năng để luyện tập theo trình độ</p>
				</div>
				<div className="flex flex-col gap-6 lg:flex-row">
					<div className="flex-1 space-y-3">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className="h-24 rounded-2xl" />
						))}
					</div>
					<div className="w-full space-y-4 lg:w-[340px] lg:shrink-0">
						<Skeleton className="h-64 rounded-2xl" />
						<Skeleton className="h-32 rounded-2xl" />
					</div>
				</div>
			</div>
		)
	}

	const skillScores: Record<Skill, number> = {
		listening: spiderData?.skills.listening.current ?? 0,
		reading: spiderData?.skills.reading.current ?? 0,
		writing: spiderData?.skills.writing.current ?? 0,
		speaking: spiderData?.skills.speaking.current ?? 0,
	}

	const skillProgressMap = new Map((progress?.skills ?? []).map((sp) => [sp.skill, sp]))

	function isWeak(skill: Skill): boolean {
		return skillScores[skill] < WEAK_THRESHOLD
	}

	const sortedSkills = [...SKILL_ORDER].sort((a, b) => {
		const aWeak = isWeak(a)
		const bWeak = isWeak(b)
		if (aWeak !== bWeak) return aWeak ? -1 : 1
		return skillScores[a] - skillScores[b]
	})

	const avg =
		Math.round(
			(SKILL_ORDER.reduce((sum, s) => sum + skillScores[s], 0) / SKILL_ORDER.length) * 10,
		) / 10

	const spiderSkills = SKILL_ORDER.map((s) => ({
		label: skillMeta[s].label,
		value: skillScores[s],
		color: skillColorText[s],
	}))

	const streakCount = activity?.streak ?? 0
	const totalExercises = activity?.totalExercises ?? 0
	const totalTimeHours = Math.round(((activity?.totalStudyTimeMinutes ?? 0) / 60) * 10) / 10
	const goalTarget = progress?.goal?.targetBand ?? "—"
	const estimatedBand = progress?.goal?.currentEstimatedBand ?? "—"

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
						const score = skillScores[skill]
						const sp = skillProgressMap.get(skill)
						const weak = isWeak(skill)

						return (
							<Link
								key={skill}
								to={`/practice/${skill}`}
								className="group flex items-center gap-4 rounded-2xl p-5 transition-all hover:bg-muted/50"
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
												{score}
											</span>
											/10
										</span>
										<span>{sp?.attemptCount ?? 0} bài đã làm</span>
										<span>Level: {sp?.currentLevel ?? "—"}</span>
									</div>
									<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
										<div
											className={cn(
												"h-full rounded-full transition-all",
												weak ? "bg-orange-500" : "bg-primary",
											)}
											style={{ width: `${(score / 10) * 100}%` }}
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
					<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
						<p className="text-sm font-semibold">Tổng quan kỹ năng</p>
						<Suspense
							fallback={
								<Skeleton className="mx-auto mt-2 aspect-square w-full max-w-[260px] rounded-2xl" />
							}
						>
							<SpiderChart
								skills={spiderSkills}
								className="mx-auto aspect-square w-full max-w-[260px]"
							/>
						</Suspense>
					</div>

					{/* Level & average */}
					<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
						<div className="flex items-center gap-3">
							<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
								<HugeiconsIcon icon={Target02Icon} className="size-5 text-primary" />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Trình độ ước tính</p>
								<p className="text-lg font-bold">{estimatedBand}</p>
							</div>
							<div className="ml-auto text-right">
								<p className="text-xs text-muted-foreground">Mục tiêu</p>
								<p className="text-lg font-bold text-primary">{goalTarget}</p>
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
						<div className="rounded-2xl bg-muted/50 p-3 text-center">
							<HugeiconsIcon icon={Book02Icon} className="mx-auto size-4 text-muted-foreground" />
							<p className="mt-1 text-lg font-bold">{totalExercises}</p>
							<p className="text-[10px] text-muted-foreground">Bài đã làm</p>
						</div>
						<div className="rounded-2xl bg-muted/50 p-3 text-center">
							<HugeiconsIcon icon={Time02Icon} className="mx-auto size-4 text-muted-foreground" />
							<p className="mt-1 text-lg font-bold">{totalTimeHours}h</p>
							<p className="text-[10px] text-muted-foreground">Thời gian học</p>
						</div>
						<div className="rounded-2xl bg-muted/50 p-3 text-center">
							<HugeiconsIcon icon={Fire02Icon} className="mx-auto size-4 text-orange-500" />
							<p className="mt-1 text-lg font-bold">{streakCount}</p>
							<p className="text-[10px] text-muted-foreground">Ngày streak</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
