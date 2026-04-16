import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { BarChart3, Flame, Target } from "lucide-react"
import { Suspense, useState } from "react"
import { OnboardingDialog } from "#/components/onboarding/OnboardingDialog"
import { Skeleton } from "#/components/ui/skeleton"
import type { OverviewData } from "#/lib/mock/overview"
import type { OnboardingData } from "#/lib/onboarding/types"
import { saveOnboardingData, useMockGoal } from "#/lib/onboarding/useMockGoal"
import { overviewQueryOptions } from "#/lib/queries/overview"
import { cn } from "#/lib/utils"
import { ActivityHeatmap } from "./_app.overview/-components/ActivityHeatmap"
import { DoughnutChartCard } from "./_app.overview/-components/DoughnutChartCard"
import { ExamCountdown } from "./_app.overview/-components/ExamCountdown"
import { NextActionCard } from "./_app.overview/-components/NextActionCard"
import { ProfileBanner } from "./_app.overview/-components/ProfileBanner"
import { SpiderChartCard } from "./_app.overview/-components/SpiderChartCard"
import { StatGrid } from "./_app.overview/-components/StatGrid"

type Tab = "overview" | "focus"

interface Search {
	tab: Tab
}

export const Route = createFileRoute("/_app/overview")({
	validateSearch: (search: Record<string, unknown>): Search => ({
		tab: search.tab === "focus" ? "focus" : "overview",
	}),
	loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(overviewQueryOptions()),
	component: OverviewPage,
})

function OverviewPage() {
	const { tab } = Route.useSearch()
	const [showOnboarding, setShowOnboarding] = useState(false)
	const mockGoal = useMockGoal()

	function handleOnboardingComplete(data: OnboardingData) {
		saveOnboardingData(data)
		setShowOnboarding(false)
	}

	return (
		<div className="mx-auto w-full max-w-5xl space-y-6">
			<Suspense fallback={<OverviewSkeleton tab={tab} />}>
				<OverviewContent
					tab={tab}
					onStartOnboarding={() => setShowOnboarding(true)}
					mockGoal={mockGoal}
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
			<TabLink tab="focus" active={active} icon={Target} label="Tập trung" />
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
}: {
	tab: Tab
	onStartOnboarding: () => void
	mockGoal: ReturnType<typeof useMockGoal>
}) {
	const { data } = useSuspenseQuery(overviewQueryOptions())
	return (
		<div className="space-y-6">
			{/* Banner chung — luôn hiện ở cả 2 tab */}
			<ProfileBanner user={data.user} onStartOnboarding={onStartOnboarding} />

			{/* Tab bar nằm dưới banner */}
			<TabBar active={tab} />

			{/* Nội dung theo tab */}
			{tab === "focus" ? (
				<FocusView data={data} />
			) : (
				<DetailsView data={data} mockGoal={mockGoal} />
			)}
		</div>
	)
}

function FocusView({ data }: { data: OverviewData }) {
	return (
		<div className="space-y-6 pt-2">
			<NextActionCard action={data.nextAction} />
			<FocusFooter streak={data.activity.streak} />
		</div>
	)
}

function FocusFooter({ streak }: { streak: number }) {
	if (streak <= 0) return null
	return (
		<div className="flex items-center justify-center pt-2">
			<span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
				<Flame className="size-4 text-skill-speaking" />
				{streak} ngày liên tiếp
			</span>
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
	if (tab === "focus") {
		return (
			<div className="space-y-8">
				<div className="flex flex-col items-center gap-4 py-8">
					<Skeleton className="h-6 w-40" />
					<Skeleton className="h-28 w-40" />
					<Skeleton className="h-5 w-48" />
				</div>
				<Skeleton className="mx-auto h-52 max-w-2xl rounded-3xl" />
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
