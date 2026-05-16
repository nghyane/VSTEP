import { Card, Col, Row, Skeleton, Statistic, Typography } from "antd"
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { ProfileSegments } from "./types"
import { CHART_COLORS } from "./utils"

const LEVEL_COLORS = ["#94a3b8", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af"]

export function ProfileSegmentsCard({
	data,
	loading,
}: {
	data: ProfileSegments | undefined
	loading: boolean
}) {
	return (
		<Card
			title="Phân khúc profile"
			style={{ height: "100%" }}
			styles={{
				body: { padding: 16, height: "calc(100% - 56px)", display: "flex", flexDirection: "column" },
			}}
		>
			{loading ? (
				<Skeleton active />
			) : !data ? null : (
				<Row gutter={[16, 16]}>
					<Col xs={24} md={8}>
						<Statistic title="Tổng profile" value={data.total_profiles} />
						<Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: "block" }}>
							Hoạt động 7 ngày: <strong>{data.active_profiles_7d}</strong>
						</Typography.Text>
					</Col>
					<Col xs={24} md={16}>
						<Typography.Text type="secondary" style={{ fontSize: 12 }}>
							Theo cấp độ mục tiêu (target level)
						</Typography.Text>
						<div style={{ width: "100%", height: 160, marginTop: 8 }}>
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={data.by_target_level} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
									<XAxis
										dataKey="level"
										tick={{ fontSize: 11, fill: "rgba(0,0,0,0.65)" }}
										tickLine={false}
										axisLine={false}
									/>
									<YAxis
										tick={{ fontSize: 11, fill: "rgba(0,0,0,0.45)" }}
										tickLine={false}
										axisLine={false}
										width={28}
										allowDecimals={false}
									/>
									<Tooltip
										cursor={{ fill: CHART_COLORS.light }}
										contentStyle={{ borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)", fontSize: 12 }}
									/>
									<Bar dataKey="count" name="Profile" radius={[4, 4, 0, 0]}>
										{data.by_target_level.map((_, i) => (
											<Cell key={i} fill={LEVEL_COLORS[i % LEVEL_COLORS.length]} />
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</Col>
				</Row>
			)}
		</Card>
	)
}
