import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { ActivityHeatmap } from "#/features/dashboard/components/ActivityHeatmap"
import { DoughnutCard } from "#/features/dashboard/components/DoughnutCard"
import { NextAction } from "#/features/dashboard/components/NextAction"
import { ProfileBanner } from "#/features/dashboard/components/ProfileBanner"
import { ScoreTrend } from "#/features/dashboard/components/ScoreTrend"
import { SpiderCard } from "#/features/dashboard/components/SpiderCard"
import { StatsRow } from "#/features/dashboard/components/StatsRow"

export const Route = createFileRoute("/_app/dashboard")({
	component: DashboardPage,
})

function DashboardPage() {
	return (
		<>
			<Header title="Tổng quan" />
			<div className="px-10 pb-12 space-y-8">
				<ProfileBanner />
				<NextAction />
				<StatsRow />
				<ActivityHeatmap />
				<section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<SpiderCard />
					<DoughnutCard />
				</section>
				<ScoreTrend />
			</div>
		</>
	)
}
