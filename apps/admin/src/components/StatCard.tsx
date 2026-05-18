import { Card, Statistic, Tag } from "antd"
import type { ReactNode } from "react"

interface Props {
	title: string
	description?: string
	value: string | number
	trend?: { value: number; label: string }
	icon: ReactNode
	className?: string
}

export function StatCard({ title, description, value, trend, icon, className }: Props) {
	return (
		<Card className={className} styles={{ body: { padding: 20 } }}>
			<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
				<div style={{ flex: 1, minWidth: 0 }}>
					<Statistic title={title} value={value} />
					{description && (
						<div style={{ marginTop: 4, fontSize: 12, color: "rgba(0,0,0,0.45)" }}>{description}</div>
					)}
					{trend && (
						<Tag color={trend.value > 0 ? "success" : "error"} style={{ marginTop: 8, marginInlineEnd: 0 }}>
							{trend.value > 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
						</Tag>
					)}
				</div>
				<div
					style={{
						display: "flex",
						width: 40,
						height: 40,
						alignItems: "center",
						justifyContent: "center",
						borderRadius: 8,
						background: "rgba(0,0,0,0.04)",
						color: "rgba(0,0,0,0.65)",
					}}
				>
					{icon}
				</div>
			</div>
		</Card>
	)
}
