import { Card, Skeleton } from "antd"
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { RevenueTrendRow } from "./types"
import { CHART_COLORS, formatShortDate, formatVnd } from "./utils"

export function RevenueChart({ data, loading }: { data: RevenueTrendRow[] | undefined; loading: boolean }) {
	return (
		<Card
			title="Doanh thu 30 ngày"
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
						<AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
							<defs>
								<linearGradient id="grTopup" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
									<stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
								</linearGradient>
								<linearGradient id="grCourse" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor={CHART_COLORS.purple} stopOpacity={0.4} />
									<stop offset="100%" stopColor={CHART_COLORS.purple} stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.light} />
							<XAxis
								dataKey="date"
								tickFormatter={formatShortDate}
								tick={{ fontSize: 11, fill: "rgba(0,0,0,0.45)" }}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								tickFormatter={(v) => formatVnd(Number(v))}
								tick={{ fontSize: 11, fill: "rgba(0,0,0,0.45)" }}
								tickLine={false}
								axisLine={false}
								width={64}
							/>
							<Tooltip
								formatter={(v) => formatVnd(Number(v))}
								labelFormatter={(l) => `Ngày ${formatShortDate(String(l))}`}
								contentStyle={{ borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)", fontSize: 12 }}
							/>
							<Legend wrapperStyle={{ fontSize: 12 }} />
							<Area
								type="monotone"
								dataKey="topup_vnd"
								name="Nạp coin"
								stroke={CHART_COLORS.primary}
								fill="url(#grTopup)"
								strokeWidth={2}
							/>
							<Area
								type="monotone"
								dataKey="course_vnd"
								name="Khoá học"
								stroke={CHART_COLORS.purple}
								fill="url(#grCourse)"
								strokeWidth={2}
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>
			)}
		</Card>
	)
}
