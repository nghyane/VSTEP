import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { ActivityHeatmap } from "#/features/dashboard/components/ActivityHeatmap"
import { GapAnalysis } from "#/features/dashboard/components/GapAnalysis"
import { NextAction } from "#/features/dashboard/components/NextAction"
import { ProfileBanner } from "#/features/dashboard/components/ProfileBanner"
import { ScoreTrend } from "#/features/dashboard/components/ScoreTrend"
import { SpiderCard } from "#/features/dashboard/components/SpiderCard"
import { StatsRow } from "#/features/dashboard/components/StatsRow"
import { overviewQuery } from "#/features/dashboard/queries"

export const Route = createFileRoute("/_app/dashboard")({
	loader: ({ context: { queryClient } }) => {
		queryClient.prefetchQuery(overviewQuery)
	},
	component: DashboardPage,
})

function DashboardPage() {
	const { data, isLoading, error } = useQuery(overviewQuery)

	if (isLoading) {
		return (
			<>
				<Header title="Tổng quan" />
				<div className="px-10 py-20 text-center text-subtle">Đang tải...</div>
			</>
		)
	}

	if (error || !data) {
		return (
			<>
				<Header title="Tổng quan" />
				<div className="px-10 py-20 text-center text-destructive">Không thể tải dữ liệu</div>
			</>
		)
	}

	const overview = data.data

	return (
		<>
			<Header title="Tổng quan" />
			<div className="px-10 pb-12 space-y-8">
				<ProfileBanner profile={overview.profile} />
				<NextAction streak={overview.stats.streak} />
				<StatsRow stats={overview.stats} />
				<section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<SpiderCard
						chart={overview.chart}
						minTests={overview.stats.min_tests_required}
						totalTests={overview.stats.total_tests}
					/>
					<GapAnalysis chart={overview.chart} />
				</section>
				<ScoreTrend />
				<ActivityHeatmap />
			</div>
		</>
	)
}
