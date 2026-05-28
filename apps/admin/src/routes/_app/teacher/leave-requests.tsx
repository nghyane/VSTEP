import { PlusOutlined } from "@ant-design/icons"
import { createFileRoute } from "@tanstack/react-router"
import { App, Button, DatePicker, Empty, Flex, Input, Modal, Skeleton, Table, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { useState } from "react"
import { FormField } from "#/components/FormField"
import { PageHeader } from "#/components/PageHeader"
import {
	type TeacherLeaveRequestItem,
	useCreateLeaveRequest,
	useTeacherLeaveRequests,
} from "#/features/teacher/queries"
import { extractError } from "#/lib/api"

export const Route = createFileRoute("/_app/teacher/leave-requests")({
	component: TeacherLeaveRequests,
})

const STATUS_MAP: Record<string, { color: string; label: string }> = {
	pending: { color: "gold", label: "Chờ duyệt" },
	approved: { color: "green", label: "Đã duyệt" },
	rejected: { color: "red", label: "Từ chối" },
}

const columns: ColumnsType<TeacherLeaveRequestItem> = [
	{ title: "Ngày nghỉ", dataIndex: "date", render: (v: string) => dayjs(v).format("DD/MM/YYYY") },
	{ title: "Lý do", dataIndex: "reason", render: (v) => v ?? "—" },
	{
		title: "Trạng thái",
		dataIndex: "status",
		render: (v: string) => {
			const s = STATUS_MAP[v] ?? { color: "default", label: v }
			return <Tag color={s.color}>{s.label}</Tag>
		},
	},
	{ title: "Ngày tạo", dataIndex: "created_at", render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm") },
]

interface LeaveFormState {
	date: string | null
	reason: string
}

function TeacherLeaveRequests() {
	const { message } = App.useApp()
	const { data, isLoading } = useTeacherLeaveRequests()
	const createLeave = useCreateLeaveRequest()
	const [modalOpen, setModalOpen] = useState(false)
	const [formState, setFormState] = useState<LeaveFormState>({ date: null, reason: "" })
	const [errors, setErrors] = useState<Record<string, string[]>>({})

	function openModal() {
		setFormState({ date: null, reason: "" })
		setErrors({})
		setModalOpen(true)
	}

	async function handleSubmit() {
		setErrors({})
		if (!formState.date) {
			setErrors({ date: ["Chọn ngày nghỉ"] })
			return
		}
		try {
			await createLeave.mutateAsync({ date: formState.date, reason: formState.reason })
			message.success("Đã tạo đơn xin nghỉ")
			setModalOpen(false)
		} catch (err) {
			const x = await extractError(err)
			if (x.errors) setErrors(x.errors)
			else message.error(x.message || "Không thể tạo đơn xin nghỉ")
		}
	}

	return (
		<Flex vertical gap={24}>
			<PageHeader
				title="Xin nghỉ"
				subtitle="Quản lý đơn xin nghỉ phép. Đơn mới cần được admin duyệt."
				action={
					<Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
						Tạo đơn xin nghỉ
					</Button>
				}
			/>
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
			<Modal
				title="Tạo đơn xin nghỉ"
				open={modalOpen}
				onOk={handleSubmit}
				onCancel={() => setModalOpen(false)}
				confirmLoading={createLeave.isPending}
				okText="Gửi"
				cancelText="Hủy"
			>
				<FormField label="Ngày nghỉ" required error={errors.date}>
					<DatePicker
						style={{ width: "100%" }}
						format="DD/MM/YYYY"
						value={formState.date ? dayjs(formState.date) : null}
						onChange={(value) =>
							setFormState((s) => ({ ...s, date: value ? value.format("YYYY-MM-DD") : null }))
						}
					/>
				</FormField>
				<FormField label="Lý do" style={{ marginTop: 16 }}>
					<Input.TextArea
						rows={3}
						maxLength={500}
						placeholder="Nhập lý do (không bắt buộc)"
						value={formState.reason}
						onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
							setFormState((s) => ({ ...s, reason: e.target.value }))
						}
					/>
				</FormField>
			</Modal>
		</Flex>
	)
}
