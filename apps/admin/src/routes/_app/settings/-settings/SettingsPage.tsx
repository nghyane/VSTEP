import { SettingOutlined } from "@ant-design/icons"
import { Alert, Card, Empty, Flex, Skeleton, Typography } from "antd"
import { useMemo, useState } from "react"
import { ConfigEditModal } from "./ConfigEditModal"
import { ConfigTable } from "./ConfigTable"
import { useSystemConfigs } from "./queries"
import type { SystemConfigRow } from "./types"
import { groupConfigsByNamespace, namespaceLabel } from "./utils"

export function SettingsPage() {
	const { data, isLoading, error } = useSystemConfigs()
	const [editing, setEditing] = useState<SystemConfigRow | null>(null)

	const groups = useMemo(() => (data ? groupConfigsByNamespace(data) : []), [data])

	return (
		<Flex vertical gap={20}>
			<div>
				<Typography.Title level={3} style={{ margin: 0 }}>
					Cấu hình hệ thống
				</Typography.Title>
				<Typography.Text type="secondary">
					Tham số tunable của platform (chart, streak, grading, exam, support, onboarding). Chỉ admin được
					phép sửa.
				</Typography.Text>
			</div>

			<Alert
				type="warning"
				showIcon
				title="Lưu ý"
				description="Thay đổi có hiệu lực ngay lập tức trên toàn hệ thống. Hãy chắc chắn về giá trị trước khi lưu."
			/>

			{error && <Alert type="error" description="Không tải được cấu hình. Thử lại sau." showIcon />}

			{isLoading ? (
				<Card>
					<Skeleton active paragraph={{ rows: 6 }} />
				</Card>
			) : !data || data.length === 0 ? (
				<Empty description="Chưa có cấu hình nào" />
			) : (
				groups.map((g) => (
					<Card
						key={g.namespace}
						title={
							<Flex align="center" gap={8}>
								<SettingOutlined style={{ color: "rgba(0,0,0,0.45)" }} />
								<span>{namespaceLabel(g.namespace)}</span>
								<Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
									{g.items.length} mục
								</Typography.Text>
							</Flex>
						}
						styles={{ body: { padding: 0, overflow: "hidden" } }}
					>
						<ConfigTable items={g.items} onEdit={setEditing} />
					</Card>
				))
			)}

			<ConfigEditModal open={!!editing} config={editing} onClose={() => setEditing(null)} />
		</Flex>
	)
}
