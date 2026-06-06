import { EyeOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Button, Empty, Flex, Select, Table, Tag, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { PageHeader } from "#/components/PageHeader"
import { adminTeacherGradingRequestsQuery } from "#/features/teacher-grading/queries"
import type {
	TeacherGradingListFilters,
	TeacherGradingRequestItem,
	TeacherGradingRequestStatus,
} from "#/features/teacher-grading/types"
import { formatDateTime } from "#/lib/utils"

interface Search {
	page?: number
	status?: TeacherGradingRequestStatus | "all"
	skill?: "writing" | "speaking" | "all"
}

const STATUS_OPTIONS: Array<{ value: TeacherGradingRequestStatus | "all"; label: string }> = [
	{ value: "all", label: "Tất cả trạng thái" },
	{ value: "pending_assignment", label: "Chờ gán" },
	{ value: "assigned", label: "Đã gán" },
	{ value: "in_progress", label: "Đang chấm" },
	{ value: "completed", label: "Hoàn thành" },
	{ value: "rejected", label: "Từ chối" },
]

const STATUS_META: Record<TeacherGradingRequestStatus, { color: string; label: string }> = {
	pending_assignment: { color: "gold", label: "Chờ gán" },
	assigned: { color: "blue", label: "Đã gán" },
	in_progress: { color: "purple", label: "Đang chấm" },
	completed: { color: "green", label: "Hoàn thành" },
	cancelled: { color: "default", label: "Đã hủy" },
	rejected: { color: "red", label: "Từ chối" },
}

function parsePage(value: unknown): number | undefined {
	const page = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN
	return Number.isInteger(page) && page > 0 ? page : undefined
}

function parseStatus(value: unknown): Search["status"] {
	for (const option of STATUS_OPTIONS) {
		if (option.value === value) return option.value
	}
	return undefined
}

function parseSkill(value: unknown): Search["skill"] {
	return value === "writing" || value === "speaking" || value === "all" ? value : undefined
}

export const Route = createFileRoute("/_app/grading-requests/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		page: parsePage(s.page),
		status: parseStatus(s.status),
		skill: parseSkill(s.skill),
	}),
	component: GradingRequestsPage,
})

function GradingRequestsPage() {
	const navigate = useNavigate({ from: "/grading-requests/" })
	const search = Route.useSearch()
	const { page = 1, status = "pending_assignment", skill = "all" } = search
	const filters: TeacherGradingListFilters = { page, status, skill, per_page: 20 }
	const { data, isLoading } = useQuery(adminTeacherGradingRequestsQuery(filters))

	function setSearch(next: Partial<Search>): void {
		navigate({ search: { ...search, ...next, page: next.page ?? 1 } })
	}

	const columns: ColumnsType<TeacherGradingRequestItem> = [
		{
			title: "Học viên",
			render: (_, item) => (
				<Flex vertical gap={2}>
					<Typography.Text strong>
						{item.profile?.account?.full_name ?? item.profile?.nickname ?? "—"}
					</Typography.Text>
					<Typography.Text type="secondary" style={{ fontSize: 12 }}>
						{item.profile?.account?.email ?? item.profile?.id ?? "—"}
					</Typography.Text>
				</Flex>
			),
		},
		{
			title: "Kỹ năng",
			render: (_, item) => <Tag>{item.attempt?.skill === "speaking" ? "Nói" : "Viết"}</Tag>,
		},
		{
			title: "Trạng thái",
			dataIndex: "status",
			render: (value: TeacherGradingRequestStatus) => {
				const meta = STATUS_META[value]
				return <Tag color={meta.color}>{meta.label}</Tag>
			},
		},
		{
			title: "Giáo viên",
			render: (_, item) =>
				item.assigned_teacher?.full_name ?? <Typography.Text type="secondary">Chưa gán</Typography.Text>,
		},
		{
			title: "Ngày gửi",
			dataIndex: "requested_at",
			render: (value: string) => formatDateTime(value),
		},
		{
			title: "Thao tác",
			render: (_, item) => (
				<Link to="/grading-requests/$requestId" params={{ requestId: item.id }}>
					<Button type="link" icon={<EyeOutlined />}>
						Xem
					</Button>
				</Link>
			),
		},
	]

	return (
		<Flex vertical gap={24}>
			<PageHeader
				title="Yêu cầu chấm giáo viên"
				subtitle="Staff tiếp nhận yêu cầu và gán bài cho giáo viên phù hợp."
			/>

			<Flex wrap align="center" gap={8}>
				<Select
					value={status}
					style={{ width: 180 }}
					options={STATUS_OPTIONS}
					onChange={(value) => setSearch({ status: value })}
				/>
				<Select
					value={skill}
					style={{ width: 140 }}
					options={[
						{ value: "all", label: "Mọi kỹ năng" },
						{ value: "writing", label: "Viết" },
						{ value: "speaking", label: "Nói" },
					]}
					onChange={(value) => setSearch({ skill: value })}
				/>
			</Flex>

			<Table
				rowKey="id"
				loading={isLoading}
				columns={columns}
				dataSource={data?.data ?? []}
				locale={{ emptyText: <Empty description="Chưa có yêu cầu chấm giáo viên." /> }}
				pagination={
					data && data.meta.last_page > 1
						? {
								current: data.meta.current_page,
								total: data.meta.total,
								pageSize: data.meta.per_page,
								onChange: (nextPage) => setSearch({ page: nextPage }),
								showSizeChanger: false,
							}
						: false
				}
			/>
		</Flex>
	)
}
