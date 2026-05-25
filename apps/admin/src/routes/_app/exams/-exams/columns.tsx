import { DeleteOutlined } from "@ant-design/icons"
import { Link } from "@tanstack/react-router"
import { Switch as AntdSwitch, Tag, Tooltip, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { Button } from "#/components/Button"
import type { AdminExam } from "#/features/admin-exams/types"

interface ColumnActions {
	togglePublish: (t: AdminExam) => void
	setDeleting: (t: AdminExam) => void
}

export function getExamColumns({ togglePublish, setDeleting }: ColumnActions): ColumnsType<AdminExam> {
	return [
		{
			title: "Tiêu đề",
			dataIndex: "title",
			key: "title",
			render: (v: string, r) => (
				<div>
					<Link to="/exams/$examId" params={{ examId: r.id }} style={{ fontWeight: 600 }}>
						{v}
					</Link>
					<br />
					<Typography.Text type="secondary" style={{ fontFamily: "monospace", fontSize: 12 }}>
						{r.slug}
					</Typography.Text>
				</div>
			),
		},
		{
			title: "Trường nguồn",
			dataIndex: "source_school",
			key: "source_school",
			render: (v: string | null) => v ?? "—",
		},
		{
			title: "Thời lượng",
			dataIndex: "total_duration_minutes",
			key: "duration",
			render: (v: number) => `${v} phút`,
		},
		{
			title: "Version",
			key: "version",
			render: (_: unknown, r) =>
				r.active_version ? <Tag color="blue">v{r.active_version.version_number}</Tag> : <Tag>Chưa có</Tag>,
		},
		{
			title: "Trạng thái",
			key: "status",
			render: (_: unknown, t) => {
				const hasVersion = t.active_version !== null
				const sw = (
					<AntdSwitch
						checked={t.is_published}
						onChange={() => togglePublish(t)}
						checkedChildren="Xuất bản"
						unCheckedChildren="Nháp"
						size="small"
						disabled={!hasVersion && !t.is_published}
					/>
				)
				if (!hasVersion && !t.is_published) {
					return <Tooltip title="Cần import nội dung trước khi xuất bản">{sw}</Tooltip>
				}
				return sw
			},
		},
		{
			title: "",
			key: "actions",
			width: 80,
			align: "right",
			render: (_: unknown, t) => (
				<Button
					variant="ghost"
					size="sm"
					icon={<DeleteOutlined />}
					onClick={() => setDeleting(t)}
					aria-label="Xoá"
				/>
			),
		},
	]
}
