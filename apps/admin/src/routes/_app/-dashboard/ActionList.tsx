import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons"
import { Card, Empty, List, Tag, Typography } from "antd"
import type { ActionItem } from "./types"

export function ActionList({ items }: { items: ActionItem[] | undefined }) {
	if (!items || items.length === 0) {
		return (
			<Card
				title="Cần xử lý"
				style={{ height: "100%" }}
				styles={{
					body: {
						height: "calc(100% - 56px)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					},
				}}
			>
				<Empty
					image={<CheckCircleOutlined style={{ fontSize: 32, color: "#10b981" }} />}
					description="Tất cả đã ổn"
				/>
			</Card>
		)
	}

	const total = items.reduce((sum, i) => sum + i.badge, 0)

	return (
		<Card title="Cần xử lý" extra={<Tag color="error">{total}</Tag>} style={{ height: "100%" }}>
			<List
				size="small"
				dataSource={items}
				renderItem={(item) => (
					<List.Item style={{ padding: "8px 0" }}>
						<List.Item.Meta
							avatar={<ClockCircleOutlined style={{ color: "rgba(0,0,0,0.45)" }} />}
							title={<Typography.Text style={{ fontSize: 13 }}>{item.label}</Typography.Text>}
						/>
						<Tag color="warning">{item.badge}</Tag>
					</List.Item>
				)}
			/>
		</Card>
	)
}
