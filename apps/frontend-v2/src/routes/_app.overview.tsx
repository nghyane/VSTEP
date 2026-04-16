import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { BarChart3, Target } from "lucide-react"
import { Suspense, useState } from "react"
import { OnboardingDialog } from "#/components/onboarding/OnboardingDialog"
import { Skeleton } from "#/components/ui/skeleton"
import type { OverviewData } from "#/lib/mock/overview"
import { MOCK_LEARNING_PATH } from "#/lib/mock/overview"
import type { Level, OnboardingData } from "#/lib/onboarding/types"
import { loadOnboardingData, saveOnboardingData, useMockGoal } from "#/lib/onboarding/useMockGoal"
import { overviewQueryOptions } from "#/lib/queries/overview"
import { cn } from "#/lib/utils"
import { ActivityHeatmap } from "./_app.overview/-components/ActivityHeatmap"
import { DoughnutChartCard } from "./_app.overview/-components/DoughnutChartCard"
import { ExamCountdown } from "./_app.overview/-components/ExamCountdown"
import { LearningPathView } from "./_app.overview/-components/LearningPathView"
import { ProfileBanner } from "./_app.overview/-components/ProfileBanner"
import { SpiderChartCard } from "./_app.overview/-components/SpiderChartCard"
import { StatGrid } from "./_app.overview/-components/StatGrid"

type Tab = "overview" | "learning_path"

interface Search {
	tab: Tab
}

export const Route = createFileRoute("/_app/overview")({
	validateSearch: (search: Record<string, unknown>): Search => ({
		tab: search.tab === "learning_path" ? "learning_path" : "overview",
	}),
	loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(overviewQueryOptions()),
	component: OverviewPage,
})

// Tính predictedLevel: nội suy giữa entry và target theo tỷ lệ progress
const LEVELS: Level[] = ["A1", "A2", "B1", "B2", "C1"]

function computePredictedLevel(
	entry: Level,
	target: Level,
	progressDays: number,
	totalDays: number,
): Level {
	const entryIdx = LEVELS.indexOf(entry)
	const targetIdx = LEVELS.indexOf(target)
	const ratio = totalDays > 0 ? Math.min(1, Math.max(0, progressDays / totalDays)) : 0
	const predictedIdx = Math.round(entryIdx + (targetIdx - entryIdx) * ratio)
	const clamped = Math.min(Math.max(predictedIdx, 0), LEVELS.length - 1)
	return LEVELS[clamped] as Level
}

function formatExamDate(date: Date | null): string {
	if (!date) return "—"
	return new Date(date).toLocaleDateString("vi-VN", {
		day: "numeric",
		month: "long",
		year: "numeric",
	})
}

function OverviewPage() {
	const { tab } = Route.useSearch()
	const [showOnboarding, setShowOnboarding] = useState(false)
	const mockGoal = useMockGoal()

	function handleOnboardingComplete(data: OnboardingData) {
		saveOnboardingData(data)
		setShowOnboarding(false)
	}

	// Đọc onboarding data để lấy entryLevel + targetBand cho ProfileBanner
	const onboardingData = loadOnboardingData()
	const progressDays = mockGoal?.progressDays ?? 0
	const totalDays = mockGoal?.totalDays ?? 180

	const levelTrack = onboardingData
		? {
				entryLevel: onboardingData.entryLevel,
				predictedLevel: computePredictedLevel(
					onboardingData.entryLevel,
					onboardingData.targetBand,
					progressDays,
					totalDays,
				),
				targetLevel: onboardingData.targetBand,
				examDate: formatExamDate(onboardingData.examDate),
			}
		: null

	return (
		<div className="mx-auto w-full max-w-5xl space-y-6">
			<Suspense fallback={<OverviewSkeleton tab={tab} />}>
				<OverviewContent
					tab={tab}
					onStartOnboarding={() => setShowOnboarding(true)}
					mockGoal={mockGoal}
					levelTrack={levelTrack}
				/>
			</Suspense>
			<OnboardingDialog
				open={showOnboarding}
				onClose={() => setShowOnboarding(false)}
				onComplete={handleOnboardingComplete}
			/>
		</div>
	)
}

// ─── Tabs ──────────────────────────────────────────────────────────

function TabBar({ active }: { active: Tab }) {
	return (
		<div className="flex gap-1 rounded-xl bg-muted p-1">
			<TabLink tab="overview" active={active} icon={BarChart3} label="Tổng quan" />
			<TabLink tab="learning_path" active={active} icon={Target} label="Lộ trình" />
		</div>
	)
}

function TabLink({
	tab,
	active,
	icon: Icon,
	label,
}: {
	tab: Tab
	active: Tab
	icon: typeof Target
	label: string
}) {
	const isActive = active === tab
	return (
		<Link
			to="/overview"
			search={{ tab }}
			className={cn(
				"flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
				isActive
					? "bg-card text-foreground shadow-sm"
					: "text-muted-foreground hover:text-foreground",
			)}
		>
			<Icon className="size-4" />
			{label}
		</Link>
	)
}

// ─── Content ───────────────────────────────────────────────────────

function OverviewContent({
	tab,
	onStartOnboarding,
	mockGoal,
	levelTrack,
}: {
	tab: Tab
	onStartOnboarding: () => void
	mockGoal: ReturnType<typeof useMockGoal>
	levelTrack: {
		entryLevel: Level
		predictedLevel: Level
		targetLevel: Level
		examDate: string
	} | null
}) {
	const { data } = useSuspenseQuery(overviewQueryOptions())
	return (
		<div className="space-y-6">
			{/* Banner chung — luôn hiện ở cả 2 tab */}
			<ProfileBanner
				user={data.user}
				onStartOnboarding={onStartOnboarding}
				levelTrack={levelTrack}
			/>

			{/* Tab bar nằm dưới banner */}
			<TabBar active={tab} />

			{/* Nội dung theo tab */}
			{tab === "learning_path" ? (
				<LearningPathView data={MOCK_LEARNING_PATH} />
			) : (
				<DetailsView data={data} mockGoal={mockGoal} />
			)}
		</div>
	)
}

function DetailsView({
	data,
	mockGoal,
}: {
	data: OverviewData
	mockGoal: ReturnType<typeof useMockGoal>
}) {
	const totalTests = data.skills.reduce((acc, s) => acc + s.attemptCount, 0)

	return (
		<div className="space-y-6">
			<StatGrid activity={data.activity} totalTests={totalTests} />
			<ActivityHeatmap activityByDay={data.activity.activityByDay} />
			{mockGoal ? (
				<ExamCountdown deadline={mockGoal.deadline} daysRemaining={mockGoal.daysRemaining} />
			) : null}
			<div className="grid gap-6 md:grid-cols-2">
				<SpiderChartCard spider={data.spider} />
				<DoughnutChartCard skills={data.skills} />
			</div>
		</div>
	)
}

// ─── Skeleton ──────────────────────────────────────────────────────

function OverviewSkeleton({ tab }: { tab: Tab }) {
	if (tab === "learning_path") {
		return (
			<div className="space-y-5">
				<Skeleton className="h-24 rounded-2xl" />
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-52 rounded-2xl" />
				))}
			</div>
		)
	}
	return (
		<div className="space-y-6">
			<Skeleton className="h-36 rounded-2xl" />
			<Skeleton className="h-24 rounded-2xl" />
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-20 rounded-2xl" />
				))}
			</div>
			<Skeleton className="h-48 rounded-2xl" />
			<Skeleton className="h-32 rounded-2xl" />
			<div className="grid gap-6 md:grid-cols-2">
				<Skeleton className="h-72 rounded-2xl" />
				<Skeleton className="h-72 rounded-2xl" />
			</div>
		</div>
	)
}
