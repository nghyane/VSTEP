import { GiftOutlined } from "@ant-design/icons"
import { Card, Empty, List, Skeleton, Space, Statistic, Tag, Typography } from "antd"
import type { PromoStats } from "./types"
import { formatNum } from "./utils"

export function PromoStatsCard({ data, loading }: { data: PromoStats | undefined; loading: boolean }) {
	return (
		<Card
			title="Khuyến mãi (Promo)"
			extra={<GiftOutlined style={{ color: "#ec4899" }} />}
			styles={{ body: { padding: 16 } }}
		>
			{loading ? (
				<Skeleton active />
			) : !data ? (
				<Empty description="—" image={Empty.PRESENTED_IMAGE_SIMPLE} />
			) : (
				<Space direction="vertical" size={12} style={{ width: "100%" }}>
					<Space size={24}>
						<Statistic title="Hôm nay" value={data.redemptions_today} />
						<Statistic title="7 ngày" value={data.redemptions_week} />
						<Statistic title="Coin đã tặng" value={formatNum(data.coins_granted_total)} />
					</Space>
					{data.top_codes.length > 0 && (
						<>
							<Typography.Text type="secondary" style={{ fontSize: 12 }}>
								Mã được dùng nhiều
							</Typography.Text>
							<List
								size="small"
								dataSource={data.top_codes}
								renderItem={(c) => (
									<List.Item style={{ padding: "4px 0" }}>
										<Tag color="magenta">{c.code}</Tag>
										<Typography.Text type="secondary" style={{ fontSize: 12 }}>
											{c.redemptions} lần · {formatNum(c.coins_total)} coin
										</Typography.Text>
									</List.Item>
								)}
							/>
						</>
					)}
				</Space>
			)}
		</Card>
	)
}
