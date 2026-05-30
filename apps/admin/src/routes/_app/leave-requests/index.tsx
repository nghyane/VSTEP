import { CheckOutlined, CloseOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Empty, Flex, Space, Table, Tag, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { Button } from "#/components/Button"
import { PageHeader } from "#/components/PageHeader"
import { Select } from "#/components/Select"
import { showError, showSuccess } from "#/components/Toaster"
import {
	type LeaveRequestStatus,
	type StaffLeaveRequestItem,
	staffLeaveRequestsQuery,
	useUpdateLeaveRequestStatus,
} from "#/features/staff/leave-requests"
import { extractError } from "#/lib/api"

interface Search {
	page?: number
	status?: LeaveRequestStatus | ""
}

const STATUS_OPTIONS: Array<LeaveRequestStatus | ""> = ["", "pending", "approved", "rejected"]

const STATUS_MAP: Record<LeaveRequestStatus, { color: string; label: string }> = {
	pending: { color: "gold", label: "Chờ duyệt" },
	approved: { color: "green", label: "Đã duyệt" },
	rejected: { color: "red", label: "Từ chối" },
}

export const Route = createFileRoute("/_app/leave-requests/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		page: typeof s.page === "number" ? s.page : undefined,
		status: STATUS_OPTIONS.includes(s.status as LeaveRequestStatus)
			? (s.status as LeaveRequestStatus)
			: undefined,
	}),
	component: StaffLeaveRequestsPage,
})

function StaffLeaveRequestsPage() {
	const navigate = useNavigate({ from: "/leave-requests/" })
	const search = Route.useSearch()
	const { page = 1, status = "" } = search
	const { data, isLoading } = useQuery(staffLeaveRequestsQuery({ page, status }))
	const updateStatus = useUpdateLeaveRequestStatus()

	function setSearch(next: Partial<Search>): void {
		navigate({ search: { ...search, ...next, page: next.page ?? 1 } })
	}

	async function handleReview(id: string, nextStatus: Exclude<LeaveRequestStatus, "pending">): Promise<void> {
		try {
			await updateStatus.mutateAsync({ id, status: nextStatus })
			showSuccess(nextStatus === "approved" ? "Đã duyệt đơn nghỉ." : "Đã từ chối đơn nghỉ.")
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	const columns: ColumnsType<StaffLeaveRequestItem> = [
		{
			title: "Giáo viên",
			render: (_, item) => (
				<Space orientation="vertical" size={0}>
					<strong>{item.teacher?.full_name ?? "Chưa có tên"}</strong>
					<Typography.Text type="secondary" style={{ fontSize: 12 }}>
						{item.teacher?.email ?? "—"}
					</Typography.Text>
				</Space>
			),
		},
		{
			title: "Ngày nghỉ",
			dataIndex: "date",
			width: 130,
			render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
		},
		{ title: "Lý do", dataIndex: "reason", render: (v: string | null) => v || "—" },
		{
			title: "Trạng thái",
			dataIndex: "status",
			width: 130,
			render: (v: LeaveRequestStatus) => <Tag color={STATUS_MAP[v].color}>{STATUS_MAP[v].label}</Tag>,
		},
		{
			title: "Ngày tạo",
			dataIndex: "created_at",
			width: 150,
			render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm"),
		},
		{
			title: "Hành động",
			width: 170,
			align: "right",
			render: (_, item) =>
				item.status === "pending" ? (
					<Space>
						<Button
							size="sm"
							icon={<CheckOutlined />}
							loading={updateStatus.isPending}
							onClick={() => handleReview(item.id, "approved")}
						>
							Duyệt
						</Button>
						<Button
							size="sm"
							variant="danger"
							icon={<CloseOutlined />}
							loading={updateStatus.isPending}
							onClick={() => handleReview(item.id, "rejected")}
						>
							Từ chối
						</Button>
					</Space>
				) : (
					<Typography.Text type="secondary">Đã xử lý</Typography.Text>
				),
		},
	]

	return (
		<Flex vertical gap={24}>
			<PageHeader
				title="Đơn nghỉ giáo viên"
				subtitle="Nhân viên theo dõi, duyệt hoặc từ chối đơn xin nghỉ của giáo viên."
			/>

			<Flex wrap align="center" gap={8}>
				<div style={{ width: 220 }}>
					<Select
						value={status}
						onChange={(e) => setSearch({ status: e.target.value as LeaveRequestStatus | "" })}
					>
						<option value="">Tất cả trạng thái</option>
						<option value="pending">Chờ duyệt</option>
						<option value="approved">Đã duyệt</option>
						<option value="rejected">Từ chối</option>
					</Select>
				</div>
			</Flex>

			<Table
				rowKey="id"
				loading={isLoading}
				columns={columns}
				dataSource={data?.data.data ?? []}
				locale={{ emptyText: <Empty description="Chưa có đơn nghỉ nào" /> }}
				pagination={
					data && data.data.last_page > 1
						? {
								current: data.data.current_page,
								total: data.data.total,
								pageSize: data.data.per_page,
								onChange: (p) => setSearch({ page: p }),
								showSizeChanger: false,
							}
						: false
				}
			/>
		</Flex>
	)
}
