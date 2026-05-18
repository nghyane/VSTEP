import { BookOutlined, FileTextOutlined, ReadOutlined, RiseOutlined, TeamOutlined } from "@ant-design/icons"
import { Card, Col, Row, Skeleton, Statistic, Tag, theme } from "antd"
import type { ReactNode } from "react"
import type { StatsData } from "./types"
import { formatNum } from "./utils"

interface Item {
	title: string
	value: string
	trend: string
	trendPositive: boolean
	icon: ReactNode
}

export function StatsRow({ stats, loading }: { stats: StatsData | undefined; loading: boolean }) {
	if (loading) return <StatsSkeleton />
	if (!stats) return null

	const items: Item[] = [
		{
			title: "Người dùng",
			value: formatNum(stats.users_total),
			trend: `+${stats.users_today} hôm nay`,
			trendPositive: true,
			icon: <TeamOutlined />,
		},
		{
			title: "Phiên đang hoạt động",
			value: formatNum(stats.sessions_active),
			trend: `${stats.sessions_stuck} quá hạn`,
			trendPositive: stats.sessions_stuck === 0,
			icon: <ReadOutlined />,
		},
		{
			title: "Chấm bài hôm nay",
			value: formatNum(stats.grading_done_today),
			trend: `${stats.grading_pending} chờ · ${stats.grading_failed} lỗi`,
			trendPositive: stats.grading_failed === 0,
			icon: <FileTextOutlined />,
		},
		{
			title: "Đề thi đã xuất bản",
			value: formatNum(stats.exams_published),
			trend: `${stats.vocab_topics} chủ đề từ vựng · ${stats.grammar_points} ngữ pháp`,
			trendPositive: true,
			icon: <BookOutlined />,
		},
	]

	return (
		<Row gutter={[16, 16]}>
			{items.map((item) => (
				<Col xs={24} sm={12} xl={6} key={item.title}>
					<StatTile item={item} />
				</Col>
			))}
		</Row>
	)
}

function StatTile({ item }: { item: Item }) {
	const { token } = theme.useToken()
	return (
		<Card>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
				<div style={{ flex: 1, minWidth: 0 }}>
					<Statistic title={item.title} value={item.value} />
					<Tag color={item.trendPositive ? "success" : "error"} style={{ marginTop: 8, marginInlineEnd: 0 }}>
						<RiseOutlined style={{ marginInlineEnd: 4 }} />
						{item.trend}
					</Tag>
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: 40,
						height: 40,
						borderRadius: token.borderRadius,
						background: token.colorFillTertiary,
						color: token.colorPrimary,
						fontSize: 18,
					}}
				>
					{item.icon}
				</div>
			</div>
		</Card>
	)
}

function StatsSkeleton() {
	return (
		<Row gutter={[16, 16]}>
			{[0, 1, 2, 3].map((i) => (
				<Col xs={24} sm={12} xl={6} key={i}>
					<Card>
						<Skeleton active paragraph={{ rows: 2 }} />
					</Card>
				</Col>
			))}
		</Row>
	)
}
