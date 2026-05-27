import { PlusOutlined } from "@ant-design/icons"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { Button, Card, DatePicker, Empty, Form, Input, Modal, Skeleton, Table, Tag, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { useState } from "react"
import { showError, showSuccess } from "#/components/Toaster"
import {
	type TeacherLeaveRequestItem,
	useCreateLeaveRequest,
	useTeacherLeaveRequests,
} from "#/features/teacher/queries"
import { useAuth } from "#/lib/auth"

export const Route = createFileRoute("/_app/teacher/leave-requests")({
	beforeLoad: () => {
		const user = useAuth.getState().user
		if (!user || user.role !== "teacher") throw redirect({ to: "/" })
	},
	component: TeacherLeaveRequests,
})

const STATUS_MAP: Record<string, { color: string; label: string }> = {
	pending: { color: "gold", label: "Chờ duyệt" },
	approved: { color: "green", label: "Đã duyệt" },
	rejected: { color: "red", label: "Từ chối" },
}

const columns: ColumnsType<TeacherLeaveRequestItem> = [
	{
		title: "Ngày nghỉ",
		dataIndex: "date",
		render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
	},
	{
		title: "Lý do",
		dataIndex: "reason",
		render: (v) => v ?? "—",
	},
	{
		title: "Trạng thái",
		dataIndex: "status",
		render: (v: string) => {
			const s = STATUS_MAP[v] ?? { color: "default", label: v }
			return <Tag color={s.color}>{s.label}</Tag>
		},
	},
	{
		title: "Ngày tạo",
		dataIndex: "created_at",
		render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm"),
	},
]

function TeacherLeaveRequests() {
	const { data, isLoading } = useTeacherLeaveRequests()
	const createLeave = useCreateLeaveRequest()
	const [modalOpen, setModalOpen] = useState(false)
	const [form] = Form.useForm()

	function handleSubmit() {
		form.validateFields().then((values) => {
			createLeave.mutate(
				{ date: values.date.format("YYYY-MM-DD"), reason: values.reason },
				{
					onSuccess: () => {
						showSuccess("Đã tạo đơn xin nghỉ")
						setModalOpen(false)
						form.resetFields()
					},
					onError: () => showError("Không thể tạo đơn xin nghỉ"),
				},
			)
		})
	}

	return (
		<div>
			<div
				style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}
			>
				<Typography.Title level={3} style={{ margin: 0 }}>
					Xin nghỉ
				</Typography.Title>
				<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
					Tạo đơn xin nghỉ
				</Button>
			</div>
			<Card>
				{isLoading ? (
					<Skeleton active />
				) : (
					<Table
						rowKey="id"
						columns={columns}
						dataSource={data ?? []}
						locale={{ emptyText: <Empty description="Chưa có đơn xin nghỉ nào" /> }}
						pagination={{ pageSize: 10 }}
					/>
				)}
			</Card>
			<Modal
				title="Tạo đơn xin nghỉ"
				open={modalOpen}
				onOk={handleSubmit}
				onCancel={() => setModalOpen(false)}
				confirmLoading={createLeave.isPending}
				okText="Gửi"
				cancelText="Hủy"
			>
				<Form form={form} layout="vertical">
					<Form.Item name="date" label="Ngày nghỉ" rules={[{ required: true, message: "Chọn ngày nghỉ" }]}>
						<DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
					</Form.Item>
					<Form.Item name="reason" label="Lý do">
						<Input.TextArea rows={3} maxLength={500} placeholder="Nhập lý do (không bắt buộc)" />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	)
}
