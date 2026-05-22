import { Card, Skeleton } from "antd"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { ContentStatusItem } from "./types"
import { CHART_COLORS } from "./utils"

export function ContentChart({ data, loading }: { data: ContentStatusItem[] | undefined; loading: boolean }) {
	return (
		<Card
			title="Trạng thái nội dung"
			style={{ height: "100%" }}
			styles={{
				body: { padding: 16, height: "calc(100% - 56px)", display: "flex", flexDirection: "column" },
			}}
		>
			{loading ? (
				<Skeleton active paragraph={{ rows: 5 }} />
			) : (
				// Pin chiều cao tuyệt đối — ResponsiveContainer cần parent có height đã
				// settle ở first paint, nếu để flex:1 trong Card height:100% mà parent Col
				// không cố định chiều cao thì lần measure đầu = 0 → recharts warn -1×-1.
				<div style={{ width: "100%", height: 280 }}>
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
							<CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.light} />
							<XAxis
								dataKey="type"
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
							/>
							<Legend wrapperStyle={{ fontSize: 12 }} />
							<Bar dataKey="published" name="Đã xuất bản" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
							<Bar dataKey="draft" name="Nháp" fill={CHART_COLORS.light} radius={[4, 4, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>
			)}
		</Card>
	)
}
