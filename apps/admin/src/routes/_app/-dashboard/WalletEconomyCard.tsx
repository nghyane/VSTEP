import { Card, Col, Empty, List, Row, Skeleton, Statistic, Tag, Typography } from "antd"
import type { WalletEconomy } from "./types"
import { formatNum, formatVnd } from "./utils"

export function WalletEconomyCard({ data, loading }: { data: WalletEconomy | undefined; loading: boolean }) {
	return (
		<Card title="Hệ kinh tế coin" styles={{ body: { padding: 16 } }}>
			{loading ? (
				<Skeleton active />
			) : !data ? (
				<Empty description="Không có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
			) : (
				<Row gutter={[16, 16]}>
					<Col xs={24} md={8}>
						<Statistic
							title="Coin lưu thông"
							value={formatNum(data.coins_circulating)}
							valueStyle={{ color: "#2563eb" }}
						/>
						<Typography.Text type="secondary" style={{ fontSize: 11 }}>
							Đã phát hành: {formatNum(data.coins_minted)} · Đã tiêu: {formatNum(data.coins_spent)}
						</Typography.Text>
					</Col>
					<Col xs={24} md={8}>
						<Statistic title="Đơn nạp đã thanh toán" value={data.topup_orders_paid} />
						<div style={{ marginTop: 8, display: "flex", gap: 8 }}>
							<Tag color="warning">Chờ: {data.topup_orders_pending}</Tag>
							<Tag color="error">Lỗi: {data.topup_orders_failed}</Tag>
						</div>
					</Col>
					<Col xs={24} md={8}>
						<Typography.Text type="secondary" style={{ fontSize: 12 }}>
							Gói nạp bán chạy
						</Typography.Text>
						<List
							size="small"
							dataSource={data.top_packages.slice(0, 3)}
							locale={{ emptyText: "—" }}
							renderItem={(p) => (
								<List.Item style={{ padding: "4px 0" }}>
									<Typography.Text style={{ fontSize: 12 }}>{p.label}</Typography.Text>
									<Typography.Text type="secondary" style={{ fontSize: 12 }}>
										{p.orders} đơn · {formatVnd(p.revenue_vnd)}
									</Typography.Text>
								</List.Item>
							)}
						/>
					</Col>
				</Row>
			)}
		</Card>
	)
}
