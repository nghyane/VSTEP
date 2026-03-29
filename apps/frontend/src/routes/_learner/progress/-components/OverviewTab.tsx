import {
	ArrowRight01Icon,
	Clock01Icon,
	Fire02Icon,
	PencilEdit02Icon,
	Target02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { ActivityHeatmap } from "@/components/common/ActivityHeatmap"
import { Button } from "@/components/ui/button"
import type { useActivity, useProgress, useSpiderChart } from "@/hooks/use-progress"
import { LEVEL_ORDER } from "@/lib/goal-constraints"
import { DoughnutChartCard } from "./DoughnutChartCard"
import { GoalCard } from "./GoalCard"
import { SpiderChartCard } from "./SpiderChartCard"
import { StatCard } from "./StatCard"

/** Derive user's overall current level from skill progress (lowest skill = bottleneck). */
function deriveCurrentLevel(skills: { currentLevel: string }[]): string | null {
	if (!skills.length) return null
	return skills.reduce((lowest, s) =>
		(LEVEL_ORDER[s.currentLevel] ?? 0) < (LEVEL_ORDER[lowest.currentLevel] ?? 0) ? s : lowest,
	).currentLevel
}

export function OverviewTab({
	spiderData,
	progressData,
	activityData,
}: {
	spiderData: ReturnType<typeof useSpiderChart>["data"]
	progressData: ReturnType<typeof useProgress>["data"]
	activityData: ReturnType<typeof useActivity>["data"]
}) {
	const totalTests = progressData?.skills.reduce((s, sk) => s + sk.attemptCount, 0) ?? 0
	const studyMinutes = Math.max(0, Math.round(activityData?.totalStudyTimeMinutes ?? 0))
	const studyLabel =
		studyMinutes >= 60
			? `${Math.floor(studyMinutes / 60)} giờ ${studyMinutes % 60 > 0 ? `${studyMinutes % 60} phút` : ""}`
			: `${studyMinutes} phút`

	// Derive current level from skills for GoalCard constraints
	const currentLevel = deriveCurrentLevel(progressData?.skills ?? [])

	// Show onboarding banner when user has no goal and no skill progress
	const hasNoGoal = !progressData?.goal
	const hasNoSkillData =
		!progressData?.skills.length || progressData.skills.every((s) => s.attemptCount === 0)
	const needsOnboarding = hasNoGoal && hasNoSkillData

	return (
		<>
			{/* Onboarding reminder banner */}
			{needsOnboarding && (
				<div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-900 dark:bg-amber-950/50">
					<div>
						<p className="font-semibold text-amber-900 dark:text-amber-100">
							Bạn chưa hoàn thành đánh giá trình độ
						</p>
						<p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300">
							Hãy đánh giá trình độ và đặt mục tiêu để có lộ trình học phù hợp
						</p>
					</div>
					<Button asChild size="sm" className="shrink-0">
						<Link to="/onboarding">
							Bắt đầu
							<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
						</Link>
					</Button>
				</div>
			)}

			{/* Stats Row */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<StatCard
					icon={Clock01Icon}
					iconBg="bg-primary/10 text-primary"
					label="Tổng thời lượng"
					value={studyLabel}
					valueColor="text-primary"
				/>
				<StatCard
					icon={Target02Icon}
					iconBg="bg-warning/10 text-warning"
					label="Tổng bài tập"
					value={String(activityData?.totalExercises ?? 0)}
					valueColor="text-warning"
				/>
				<StatCard
					icon={PencilEdit02Icon}
					iconBg="bg-destructive/10 text-destructive"
					label="Tổng số bài test"
					value={String(totalTests)}
					valueColor="text-destructive"
				/>
				<StatCard
					icon={Fire02Icon}
					iconBg="bg-success/10 text-success"
					label="Streak"
					value={`${activityData?.streak ?? 0} ngày`}
					valueColor="text-success"
				/>
			</div>

			{/* Activity Heatmap */}
			<ActivityHeatmap activeDays={activityData?.activeDays ?? []} />

			{/* Goal Card */}
			<GoalCard goal={progressData?.goal ?? null} currentLevel={currentLevel} />

			{/* Spider Chart + Doughnut Chart */}
			<div className="grid gap-6 md:grid-cols-2">
				<SpiderChartCard spiderData={spiderData} />
				<DoughnutChartCard progressData={progressData} />
			</div>
		</>
	)
}
