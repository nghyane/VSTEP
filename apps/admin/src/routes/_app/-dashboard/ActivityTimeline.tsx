import { ClockCircleOutlined } from "@ant-design/icons"
import { Card, Empty, Tag, Timeline, Typography } from "antd"
import type { ActivityItem } from "./types"
import { formatRelativeDate } from "./utils"

const ACTION_META: Record<string, { label: string; color: string }> = {
	user_registered: { label: "Đăng ký mới", color: "green" },
	exam_published: { label: "Xuất bản đề", color: "blue" },
	vocab_created: { label: "Từ vựng mới", color: "default" },
	grammar_created: { label: "Ngữ pháp mới", color: "default" },
}

export function ActivityTimeline({ items }: { items: ActivityItem[] | undefined }) {
	return (
		<Card title="Hoạt động gần đây">
			{!items || items.length === 0 ? (
				<Empty
					image={<ClockCircleOutlined style={{ fontSize: 32, color: "rgba(0,0,0,0.25)" }} />}
					description="Chưa có hoạt động"
				/>
			) : (
				<Timeline
					items={items.map((item) => {
						const meta = ACTION_META[item.action] ?? { label: item.action, color: "default" }
						return {
							children: (
								<div>
									<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
										<Tag color={meta.color}>{meta.label}</Tag>
										<Typography.Text style={{ fontSize: 13 }}>{item.detail}</Typography.Text>
									</div>
									<Typography.Text type="secondary" style={{ fontSize: 11 }}>
										{formatRelativeDate(item.happened_at)}
									</Typography.Text>
								</div>
							),
						}
					})}
				/>
			)}
		</Card>
	)
}
