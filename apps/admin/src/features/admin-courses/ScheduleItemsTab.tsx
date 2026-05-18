import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { Empty, Flex, Space, Table } from "antd"
import { useState } from "react"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Modal } from "#/components/Modal"
import { showError, showSuccess } from "#/components/Toaster"
import {
	scheduleItemsQuery,
	useCreateScheduleItem,
	useDeleteScheduleItem,
	useUpdateScheduleItem,
} from "#/features/admin-courses/queries"
import { ScheduleItemForm } from "#/features/admin-courses/ScheduleItemForm"
import type { AdminScheduleItem } from "#/features/admin-courses/types"
import { extractError } from "#/lib/api"

interface Props {
	courseId: string
	courseStartDate: string
	courseEndDate: string
}

function formatDate(iso: string): string {
	if (!iso) return ""
	const d = new Date(iso.length >= 10 ? iso.slice(0, 10) : iso)
	return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function ScheduleItemsTab({ courseId, courseStartDate, courseEndDate }: Props) {
	const { data, isLoading } = useQuery(scheduleItemsQuery(courseId))
	const items = data?.data ?? []

	const [createOpen, setCreateOpen] = useState(false)
	const [editing, setEditing] = useState<AdminScheduleItem | null>(null)
	const [deleting, setDeleting] = useState<AdminScheduleItem | null>(null)

	const create = useCreateScheduleItem(courseId)
	const update = useUpdateScheduleItem(courseId)
	const remove = useDeleteScheduleItem(courseId)

	const nextSessionNumber = items.length === 0 ? 1 : Math.max(...items.map((i) => i.session_number)) + 1

	async function onDelete(): Promise<void> {
		if (!deleting) return
		try {
			await remove.mutateAsync(deleting.id)
			showSuccess("Đã xoá buổi học.")
			setDeleting(null)
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	return (
		<Flex vertical gap={16}>
			<Flex justify="space-between" align="center">
				<div style={{ fontSize: 14, color: "rgba(0,0,0,0.55)" }}>
					{items.length === 0 ? "Chưa có buổi học nào." : `Có ${items.length} buổi học đã sắp lịch.`}
				</div>
				<Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
					Thêm buổi
				</Button>
			</Flex>

			{!isLoading && items.length === 0 ? (
				<Empty description="Bấm 'Thêm buổi' để sắp lịch buổi học đầu tiên." />
			) : (
				<Table
					rowKey="id"
					loading={isLoading}
					dataSource={items}
					pagination={false}
					columns={[
						{
							title: "Buổi",
							dataIndex: "session_number",
							width: 80,
							render: (v: number) => <strong>#{v}</strong>,
						},
						{
							title: "Ngày",
							dataIndex: "date",
							width: 140,
							render: (v: string) => formatDate(v),
						},
						{
							title: "Giờ",
							width: 140,
							render: (_, r: AdminScheduleItem) => `${r.start_time} – ${r.end_time}`,
						},
						{
							title: "Chủ đề",
							dataIndex: "topic",
						},
						{
							title: "",
							width: 96,
							align: "right" as const,
							render: (_, r: AdminScheduleItem) => (
								<Space size={4}>
									<button
										type="button"
										onClick={() => setEditing(r)}
										style={{ background: "none", border: 0, padding: 4, cursor: "pointer" }}
										aria-label="Sửa"
									>
										<EditOutlined />
									</button>
									<button
										type="button"
										onClick={() => setDeleting(r)}
										style={{ background: "none", border: 0, padding: 4, cursor: "pointer" }}
										aria-label="Xoá"
									>
										<DeleteOutlined />
									</button>
								</Space>
							),
						},
					]}
				/>
			)}

			<Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Thêm buổi học" size="md">
				<ScheduleItemForm
					defaultSessionNumber={nextSessionNumber}
					minDate={courseStartDate}
					maxDate={courseEndDate}
					submitting={create.isPending}
					onCancel={() => setCreateOpen(false)}
					onSubmit={async (input) => {
						await create.mutateAsync(input)
						showSuccess("Đã thêm buổi học.")
						setCreateOpen(false)
					}}
				/>
			</Modal>

			<Modal open={!!editing} onClose={() => setEditing(null)} title="Sửa buổi học" size="md">
				{editing && (
					<ScheduleItemForm
						initial={editing}
						minDate={courseStartDate}
						maxDate={courseEndDate}
						submitting={update.isPending}
						onCancel={() => setEditing(null)}
						onSubmit={async (input) => {
							await update.mutateAsync({ id: editing.id, input })
							showSuccess("Đã cập nhật buổi học.")
							setEditing(null)
						}}
					/>
				)}
			</Modal>

			<ConfirmDialog
				open={!!deleting}
				onClose={() => setDeleting(null)}
				onConfirm={onDelete}
				title="Xoá buổi học"
				description={deleting ? `Xoá buổi #${deleting.session_number} (${deleting.topic})?` : undefined}
				loading={remove.isPending}
			/>
		</Flex>
	)
}
