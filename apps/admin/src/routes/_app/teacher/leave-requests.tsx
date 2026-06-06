import { PlusOutlined } from "@ant-design/icons"
import { createFileRoute } from "@tanstack/react-router"
import { App, Button, Empty, Flex, Input, Skeleton, Table, Tag } from "antd"
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
				subtitle="Quản lý đơn xin nghỉ phép. Đơn mới cần được nhân viên duyệt."
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
			{modalOpen && (
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="teacher-leave-modal-title"
					style={{
						position: "fixed",
						inset: 0,
						zIndex: 1000,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						background: "rgba(0,0,0,0.45)",
						padding: 16,
					}}
					onMouseDown={(e) => {
						if (e.target === e.currentTarget) setModalOpen(false)
					}}
				>
					<div
						style={{
							width: "min(520px, 100%)",
							borderRadius: 12,
							background: "#fff",
							boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
							padding: 24,
						}}
					>
						<h2 id="teacher-leave-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
							Tạo đơn xin nghỉ
						</h2>
						<div style={{ marginTop: 20 }}>
							<FormField label="Ngày nghỉ" required error={errors.date}>
								<input
									type="date"
									value={formState.date ?? ""}
									onChange={(e) => setFormState((s) => ({ ...s, date: e.target.value || null }))}
									style={{
										width: "100%",
										height: 32,
										border: "1px solid #d9d9d9",
										borderRadius: 6,
										padding: "4px 11px",
										font: "inherit",
									}}
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
						</div>
						<Flex justify="flex-end" gap={8} style={{ marginTop: 24 }}>
							<Button onClick={() => setModalOpen(false)}>Hủy</Button>
							<Button type="primary" loading={createLeave.isPending} onClick={handleSubmit}>
								Gửi
							</Button>
						</Flex>
					</div>
				</div>
			)}
		</Flex>
	)
}
