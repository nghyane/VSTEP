import { Card, Skeleton } from "antd"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { UserGrowthRow } from "./types"
import { CHART_COLORS, formatShortDate } from "./utils"

export function UserGrowthChart({ data, loading }: { data: UserGrowthRow[] | undefined; loading: boolean }) {
	return (
		<Card
			title="Người dùng & profile mới (30 ngày)"
			style={{ height: "100%" }}
			styles={{
				body: { padding: 16, height: "calc(100% - 56px)", display: "flex", flexDirection: "column" },
			}}
		>
			{loading ? (
				<Skeleton active paragraph={{ rows: 6 }} />
			) : (
				<div style={{ width: "100%", flex: 1, minHeight: 240 }}>
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
							<CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.light} />
							<XAxis
								dataKey="date"
								tickFormatter={formatShortDate}
								tick={{ fontSize: 11, fill: "rgba(0,0,0,0.45)" }}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								tick={{ fontSize: 11, fill: "rgba(0,0,0,0.45)" }}
								tickLine={false}
								axisLine={false}
								width={36}
								allowDecimals={false}
							/>
							<Tooltip
								labelFormatter={(l) => `Ngày ${formatShortDate(String(l))}`}
								contentStyle={{ borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)", fontSize: 12 }}
							/>
							<Legend wrapperStyle={{ fontSize: 12 }} />
							<Line
								type="monotone"
								dataKey="new_users"
								name="Tài khoản mới"
								stroke={CHART_COLORS.primary}
								strokeWidth={2}
								dot={false}
							/>
							<Line
								type="monotone"
								dataKey="new_profiles"
								name="Profile mới"
								stroke={CHART_COLORS.info}
								strokeWidth={2}
								dot={false}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			)}
		</Card>
	)
}
