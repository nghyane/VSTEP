import { Clock01Icon, Fire02Icon, PencilEdit02Icon, Target02Icon } from "@hugeicons/core-free-icons"
import { ActivityHeatmap } from "@/components/common/ActivityHeatmap"
import type { useActivity, useProgress, useSpiderChart } from "@/hooks/use-progress"
import { DoughnutChartCard } from "./DoughnutChartCard"
import { GoalCard } from "./GoalCard"
import { SpiderChartCard } from "./SpiderChartCard"
import { StatCard } from "./StatCard"

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

	return (
		<>
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
			<GoalCard goal={progressData?.goal ?? null} />

			{/* Spider Chart + Doughnut Chart */}
			<div className="grid gap-6 md:grid-cols-2">
				<SpiderChartCard spiderData={spiderData} />
				<DoughnutChartCard progressData={progressData} />
			</div>
		</>
	)
}
