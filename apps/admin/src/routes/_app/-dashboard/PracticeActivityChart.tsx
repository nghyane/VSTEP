import { Card, Skeleton } from "antd"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { PracticeActivityRow } from "./types"
import { CHART_COLORS, formatShortDate } from "./utils"

const SKILLS = [
	{ key: "listening", label: "Nghe", color: CHART_COLORS.primary },
	{ key: "reading", label: "Đọc", color: CHART_COLORS.info },
	{ key: "writing", label: "Viết", color: CHART_COLORS.purple },
	{ key: "speaking", label: "Nói", color: CHART_COLORS.warning },
	{ key: "vocab", label: "Từ vựng", color: CHART_COLORS.success },
	{ key: "grammar", label: "Ngữ pháp", color: CHART_COLORS.pink },
] as const

export function PracticeActivityChart({
	data,
	loading,
}: {
	data: PracticeActivityRow[] | undefined
	loading: boolean
}) {
	return (
		<Card
			title="Hoạt động luyện tập 30 ngày"
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
						<BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
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
							{SKILLS.map((s) => (
								<Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={s.color} />
							))}
						</BarChart>
					</ResponsiveContainer>
				</div>
			)}
		</Card>
	)
}
