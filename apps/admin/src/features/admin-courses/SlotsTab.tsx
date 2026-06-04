import { DeleteOutlined, EditOutlined, PlusOutlined, ThunderboltOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { Empty, Flex, Space, Table, Tag, Typography } from "antd"
import { useState } from "react"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Modal } from "#/components/Modal"
import { showError, showSuccess } from "#/components/Toaster"
import { BulkSlotsForm } from "#/features/admin-courses/BulkSlotsForm"
import {
	slotsQuery,
	useBulkCreateSlots,
	useCreateSlot,
	useDeleteSlot,
	useUpdateSlot,
} from "#/features/admin-courses/queries"
import { SlotForm } from "#/features/admin-courses/SlotForm"
import type { AdminTeacherSlot } from "#/features/admin-courses/types"
import { formatDateTimeVN, formatTimeRange } from "#/features/admin-courses/utils"
import { extractError } from "#/lib/api"

interface Props {
	courseId: string
	courseStartDate: string
	courseEndDate: string
}

export function SlotsTab({ courseId, courseStartDate, courseEndDate }: Props) {
	const [page, setPage] = useState(1)
	const { data, isLoading } = useQuery(slotsQuery(courseId, page))
	const slots = data?.data ?? []
	const totalSlots = data?.meta.total ?? 0

	const [createOpen, setCreateOpen] = useState(false)
	const [bulkOpen, setBulkOpen] = useState(false)
	const [editing, setEditing] = useState<AdminTeacherSlot | null>(null)
	const [deleting, setDeleting] = useState<AdminTeacherSlot | null>(null)

	const create = useCreateSlot(courseId)
	const bulk = useBulkCreateSlots(courseId)
	const update = useUpdateSlot(courseId)
	const remove = useDeleteSlot(courseId)

	const bookedCount = slots.filter((s) => s.booking !== null).length
	const openCount = slots.length - bookedCount

	async function onDelete(): Promise<void> {
		if (!deleting) return
		try {
			await remove.mutateAsync(deleting.id)
			showSuccess("Đã xóa slot.")
			setDeleting(null)
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	return (
		<Flex vertical gap={16}>
			<Flex justify="space-between" align="center" wrap="wrap" gap={12}>
				<div style={{ fontSize: 14, color: "rgba(0,0,0,0.55)" }}>
					{totalSlots === 0
						? "Chưa có slot 1-1 nào trong 4 tuần tới."
						: `Tổng ${totalSlots} slot · trang này ${bookedCount} đã đặt · ${openCount} trống.`}
				</div>
				<Space size={8}>
					<Button variant="ghost" icon={<ThunderboltOutlined />} onClick={() => setBulkOpen(true)}>
						Tạo hàng loạt
					</Button>
					<Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
						Thêm slot
					</Button>
				</Space>
			</Flex>

			{!isLoading && slots.length === 0 ? (
				<Empty description="Bấm 'Tạo hàng loạt' để sắp lịch nhanh hoặc 'Thêm slot' cho 1 buổi lẻ." />
			) : (
				<Table
					rowKey="id"
					loading={isLoading}
					dataSource={slots}
					pagination={
						data && data.meta.last_page > 1
							? {
									current: data.meta.current_page,
									total: data.meta.total,
									pageSize: data.meta.per_page,
									onChange: (p) => setPage(p),
									showSizeChanger: false,
								}
							: false
					}
					scroll={{ x: 800 }}
					columns={[
						{
							title: "Bắt đầu",
							width: 220,
							render: (_, r: AdminTeacherSlot) => (
								<Flex vertical gap={2}>
									<strong>{formatDateTimeVN(r.starts_at)}</strong>
									<Typography.Text type="secondary" style={{ fontSize: 12 }}>
										{formatTimeRange(r.starts_at, r.duration_minutes)} · {r.duration_minutes} phút
									</Typography.Text>
								</Flex>
							),
						},
						{
							title: "Trạng thái",
							width: 130,
							render: (_, r: AdminTeacherSlot) => {
								if (r.booking !== null) return <Tag color="green">Đã đặt</Tag>
								if (new Date(r.starts_at).getTime() < Date.now()) return <Tag>Đã qua</Tag>
								return <Tag color="blue">Trống</Tag>
							},
						},
						{
							title: "Học viên đặt",
							render: (_, r: AdminTeacherSlot) => {
								if (r.booking === null || r.booking.profile === null) return <span>—</span>
								const p = r.booking.profile
								const name = p.full_name?.trim() || p.nickname?.trim() || p.email || "—"
								return (
									<Flex vertical gap={2}>
										<strong>{name}</strong>
										{p.email && name !== p.email && (
											<Typography.Text type="secondary" style={{ fontSize: 12 }}>
												{p.email}
											</Typography.Text>
										)}
									</Flex>
								)
							},
						},
						{
							title: "",
							width: 96,
							align: "right" as const,
							render: (_, r: AdminTeacherSlot) => {
								const disabled = r.booking !== null
								return (
									<Space size={4}>
										<button
											type="button"
											onClick={() => !disabled && setEditing(r)}
											disabled={disabled}
											style={{
												background: "none",
												border: 0,
												padding: 4,
												cursor: disabled ? "not-allowed" : "pointer",
												color: disabled ? "#cbd5e1" : undefined,
											}}
											aria-label="Sửa"
											title={disabled ? "Slot đã có học viên đặt — không sửa được" : "Sửa slot"}
										>
											<EditOutlined />
										</button>
										<button
											type="button"
											onClick={() => !disabled && setDeleting(r)}
											disabled={disabled}
											style={{
												background: "none",
												border: 0,
												padding: 4,
												cursor: disabled ? "not-allowed" : "pointer",
												color: disabled ? "#cbd5e1" : "#ef4444",
											}}
											aria-label="Xóa"
											title={disabled ? "Slot đã có học viên đặt — không xóa được" : "Xóa slot"}
										>
											<DeleteOutlined />
										</button>
									</Space>
								)
							},
						},
					]}
				/>
			)}

			<Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Thêm slot 1-1" size="md">
				<SlotForm
					courseStartDate={courseStartDate}
					courseEndDate={courseEndDate}
					submitting={create.isPending}
					onCancel={() => setCreateOpen(false)}
					onSubmit={async (input) => {
						await create.mutateAsync(input)
						showSuccess("Đã thêm slot.")
						setCreateOpen(false)
					}}
				/>
			</Modal>

			<Modal
				open={bulkOpen}
				onClose={() => setBulkOpen(false)}
				title="Tạo slot hàng loạt theo lịch tuần"
				size="md"
			>
				<BulkSlotsForm
					courseStartDate={courseStartDate}
					courseEndDate={courseEndDate}
					submitting={bulk.isPending}
					onCancel={() => setBulkOpen(false)}
					onSubmit={async (input) => {
						const res = await bulk.mutateAsync(input)
						const { created, skipped } = res.data
						showSuccess(
							skipped > 0
								? `Đã tạo ${created} slot mới (bỏ qua ${skipped} slot trùng giờ).`
								: `Đã tạo ${created} slot mới.`,
						)
						setBulkOpen(false)
					}}
				/>
			</Modal>

			<Modal open={!!editing} onClose={() => setEditing(null)} title="Sửa slot 1-1" size="md">
				{editing && (
					<SlotForm
						initial={editing}
						courseStartDate={courseStartDate}
						courseEndDate={courseEndDate}
						submitting={update.isPending}
						onCancel={() => setEditing(null)}
						onSubmit={async (input) => {
							await update.mutateAsync({ id: editing.id, input })
							showSuccess("Đã cập nhật slot.")
							setEditing(null)
						}}
					/>
				)}
			</Modal>

			<ConfirmDialog
				open={!!deleting}
				onClose={() => setDeleting(null)}
				onConfirm={onDelete}
				title="Xóa slot 1-1"
				description={
					deleting
						? `Xóa slot ${formatDateTimeVN(deleting.starts_at)}? Slot chưa có học viên đặt nên thao tác này an toàn.`
						: undefined
				}
				loading={remove.isPending}
			/>
		</Flex>
	)
}
