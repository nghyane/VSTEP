import { Card, Skeleton } from "antd"
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { StreakBucket } from "./types"
import { CHART_COLORS } from "./utils"

const BUCKET_COLORS = ["#cbd5e1", "#fbbf24", "#fb923c", "#f97316", "#dc2626"]

export function StreakDistributionCard({
	data,
	loading,
}: {
	data: StreakBucket[] | undefined
	loading: boolean
}) {
	return (
		<Card
			title="Phân bố streak"
			style={{ height: "100%" }}
			styles={{
				body: { padding: 16, height: "calc(100% - 56px)", display: "flex", flexDirection: "column" },
			}}
		>
			{loading ? (
				<Skeleton active paragraph={{ rows: 4 }} />
			) : (
				<div style={{ width: "100%", flex: 1, minHeight: 180 }}>
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
							<XAxis
								dataKey="range"
								tick={{ fontSize: 11, fill: "rgba(0,0,0,0.65)" }}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								tick={{ fontSize: 11, fill: "rgba(0,0,0,0.45)" }}
								tickLine={false}
								axisLine={false}
								width={32}
								allowDecimals={false}
							/>
							<Tooltip
								cursor={{ fill: CHART_COLORS.light }}
								contentStyle={{ borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)", fontSize: 12 }}
								formatter={(v) => [`${Number(v)} profile`, "Số lượng"]}
							/>
							<Bar dataKey="count" radius={[4, 4, 0, 0]}>
								{(data ?? []).map((_, i) => (
									<Cell key={i} fill={BUCKET_COLORS[i % BUCKET_COLORS.length]} />
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</div>
			)}
		</Card>
	)
}
