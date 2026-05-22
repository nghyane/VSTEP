import { ClockCircleOutlined, DollarOutlined, ShoppingOutlined, WalletOutlined } from "@ant-design/icons"
import { Card, Col, Row, Skeleton, Statistic, Typography } from "antd"
import type { ReactNode } from "react"
import type { RevenueOverview } from "./types"
import { formatVnd } from "./utils"

export function RevenueOverviewCards({
	data,
	loading,
}: {
	data: RevenueOverview | undefined
	loading: boolean
}) {
	if (loading) {
		return (
			<Row gutter={[16, 16]}>
				{[0, 1, 2, 3].map((i) => (
					<Col xs={24} sm={12} xl={6} key={i}>
						<Card>
							<Skeleton active paragraph={{ rows: 1 }} />
						</Card>
					</Col>
				))}
			</Row>
		)
	}
	if (!data) return null

	const tiles: Array<{ title: string; value: string; sub: string; icon: ReactNode; color: string }> = [
		{
			title: "Doanh thu hôm nay",
			value: formatVnd(data.total.today),
			sub: `Nạp: ${formatVnd(data.topup.today)} · Khoá: ${formatVnd(data.course.today)}`,
			icon: <DollarOutlined />,
			color: "#10b981",
		},
		{
			title: "Doanh thu 7 ngày",
			value: formatVnd(data.total.week),
			sub: `Nạp: ${formatVnd(data.topup.week)} · Khoá: ${formatVnd(data.course.week)}`,
			icon: <WalletOutlined />,
			color: "#2563eb",
		},
		{
			title: "Doanh thu 30 ngày",
			value: formatVnd(data.total.month),
			sub: `Nạp: ${formatVnd(data.topup.month)} · Khoá: ${formatVnd(data.course.month)}`,
			icon: <ShoppingOutlined />,
			color: "#8b5cf6",
		},
		{
			title: "Đơn chờ xử lý",
			value: String(data.pending_orders),
			sub: "Nạp coin + đăng ký khoá học",
			icon: <ClockCircleOutlined />,
			color: "#f59e0b",
		},
	]

	return (
		<Row gutter={[16, 16]}>
			{tiles.map((t) => (
				<Col xs={24} sm={12} xl={6} key={t.title}>
					<Card>
						<div
							style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}
						>
							<div style={{ flex: 1, minWidth: 0 }}>
								<Statistic title={t.title} value={t.value} />
								<Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
									{t.sub}
								</Typography.Text>
							</div>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: 44,
									height: 44,
									borderRadius: 8,
									background: `${t.color}1a`,
									color: t.color,
									fontSize: 20,
								}}
							>
								{t.icon}
							</div>
						</div>
					</Card>
				</Col>
			))}
		</Row>
	)
}
