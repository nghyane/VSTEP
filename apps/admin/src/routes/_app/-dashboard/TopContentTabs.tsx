import { Card, Empty, List, Skeleton, Tabs, Typography } from "antd"
import type { TopContent } from "./types"

type SkillKey = keyof TopContent

const TABS: Array<{ key: SkillKey; label: string }> = [
	{ key: "listening", label: "Nghe" },
	{ key: "reading", label: "Đọc" },
	{ key: "writing", label: "Viết" },
	{ key: "vocab", label: "Từ vựng" },
	{ key: "grammar", label: "Ngữ pháp" },
]

export function TopContentTabs({ data, loading }: { data: TopContent | undefined; loading: boolean }) {
	return (
		<Card title="Nội dung được luyện nhiều nhất" styles={{ body: { padding: 8 } }}>
			{loading ? (
				<Skeleton active />
			) : !data ? (
				<Empty description="—" image={Empty.PRESENTED_IMAGE_SIMPLE} />
			) : (
				<Tabs
					size="small"
					items={TABS.map((t) => ({
						key: t.key,
						label: t.label,
						children:
							data[t.key].length === 0 ? (
								<Empty description="Chưa có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
							) : (
								<List
									size="small"
									dataSource={data[t.key]}
									renderItem={(item, i) => (
										<List.Item style={{ padding: "6px 0" }}>
											<Typography.Text style={{ fontSize: 13 }}>
												{i + 1}. {item.title}
											</Typography.Text>
											<Typography.Text type="secondary" style={{ fontSize: 12 }}>
												{item.sessions} lượt
											</Typography.Text>
										</List.Item>
									)}
								/>
							),
					}))}
				/>
			)}
		</Card>
	)
}
