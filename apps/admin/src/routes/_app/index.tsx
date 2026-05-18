import { createFileRoute } from "@tanstack/react-router"
import { Col, Flex, Row, Typography } from "antd"
import { ActionList } from "./-dashboard/ActionList"
import { ActivityTimeline } from "./-dashboard/ActivityTimeline"
import { AlertsBanner } from "./-dashboard/AlertsBanner"
import { ContentChart } from "./-dashboard/ContentChart"
import { GradingThroughputChart } from "./-dashboard/GradingThroughputChart"
import { PracticeActivityChart } from "./-dashboard/PracticeActivityChart"
import { ProfileSegmentsCard } from "./-dashboard/ProfileSegmentsCard"
import { PromoStatsCard } from "./-dashboard/PromoStatsCard"
import {
	useActionItems,
	useAlerts,
	useContentStatus,
	useGradingThroughput,
	usePracticeActivity,
	useProfileSegments,
	usePromoStats,
	useRecentActivity,
	useRevenueOverview,
	useRevenueTrend,
	useStats,
	useStreakDistribution,
	useTopContent,
	useUserGrowth,
	useWalletEconomy,
} from "./-dashboard/queries"
import { RevenueChart } from "./-dashboard/RevenueChart"
import { RevenueOverviewCards } from "./-dashboard/RevenueOverviewCards"
import { StatsRow } from "./-dashboard/StatsRow"
import { StreakDistributionCard } from "./-dashboard/StreakDistributionCard"
import { TopContentTabs } from "./-dashboard/TopContentTabs"
import { UserGrowthChart } from "./-dashboard/UserGrowthChart"
import { WalletEconomyCard } from "./-dashboard/WalletEconomyCard"

export const Route = createFileRoute("/_app/")({
	component: DashboardPage,
})

function DashboardPage() {
	const stats = useStats()
	const alerts = useAlerts()
	const actionItems = useActionItems()
	const contentStatus = useContentStatus()
	const recentActivity = useRecentActivity()
	const revenueOverview = useRevenueOverview()
	const revenueTrend = useRevenueTrend()
	const userGrowth = useUserGrowth()
	const walletEconomy = useWalletEconomy()
	const practiceActivity = usePracticeActivity()
	const gradingThroughput = useGradingThroughput()
	const profileSegments = useProfileSegments()
	const streakDistribution = useStreakDistribution()
	const promoStats = usePromoStats()
	const topContent = useTopContent()

	return (
		<Flex vertical gap={20}>
			<AlertsBanner alerts={alerts.data} />

			<div>
				<Typography.Title level={3} style={{ margin: 0 }}>
					Tổng quan
				</Typography.Title>
				<Typography.Text type="secondary">
					Tình trạng hệ thống, dòng tiền và hoạt động học tập.
				</Typography.Text>
			</div>

			<StatsRow stats={stats.data} loading={stats.isLoading} />
			<RevenueOverviewCards data={revenueOverview.data} loading={revenueOverview.isLoading} />

			<Row gutter={[16, 16]}>
				<Col xs={24} xl={16}>
					<RevenueChart data={revenueTrend.data} loading={revenueTrend.isLoading} />
				</Col>
				<Col xs={24} xl={8}>
					<UserGrowthChart data={userGrowth.data} loading={userGrowth.isLoading} />
				</Col>
			</Row>

			<WalletEconomyCard data={walletEconomy.data} loading={walletEconomy.isLoading} />

			<Row gutter={[16, 16]}>
				<Col xs={24} xl={16}>
					<PracticeActivityChart data={practiceActivity.data} loading={practiceActivity.isLoading} />
				</Col>
				<Col xs={24} xl={8}>
					<GradingThroughputChart data={gradingThroughput.data} loading={gradingThroughput.isLoading} />
				</Col>
			</Row>

			<Row gutter={[16, 16]}>
				<Col xs={24} xl={12}>
					<ProfileSegmentsCard data={profileSegments.data} loading={profileSegments.isLoading} />
				</Col>
				<Col xs={24} xl={12}>
					<StreakDistributionCard data={streakDistribution.data} loading={streakDistribution.isLoading} />
				</Col>
			</Row>

			<Row gutter={[16, 16]}>
				<Col xs={24} xl={16}>
					<ContentChart data={contentStatus.data} loading={contentStatus.isLoading} />
				</Col>
				<Col xs={24} xl={8}>
					<ActionList items={actionItems.data} />
				</Col>
			</Row>

			<Row gutter={[16, 16]}>
				<Col xs={24} xl={12}>
					<TopContentTabs data={topContent.data} loading={topContent.isLoading} />
				</Col>
				<Col xs={24} xl={12}>
					<PromoStatsCard data={promoStats.data} loading={promoStats.isLoading} />
				</Col>
			</Row>

			<ActivityTimeline items={recentActivity.data} />
		</Flex>
	)
}
