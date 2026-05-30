import { CloseCircleOutlined, LinkOutlined, SearchOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { Input as AntdInput, Empty, Flex, Select, Space, Table, Tag, Typography } from "antd"
import { useState } from "react"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Modal } from "#/components/Modal"
import { showError, showSuccess } from "#/components/Toaster"
import { bookingsQuery, useCancelBooking, useUpdateBookingMeetUrl } from "#/features/admin-courses/queries"
import type { AdminTeacherBooking } from "#/features/admin-courses/types"
import { formatDateTimeVN } from "#/features/admin-courses/utils"
import { extractError } from "#/lib/api"

interface Props {
	courseId: string
}

function statusTag(status: AdminTeacherBooking["status"]) {
	if (status === "booked") return <Tag color="blue">Đang đặt</Tag>
	if (status === "completed") return <Tag color="green">Đã hoàn thành</Tag>
	return <Tag>Đã hủy</Tag>
}

export function BookingsTab({ courseId }: Props) {
	const [page, setPage] = useState(1)
	const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
	const [search, setSearch] = useState("")
	const [sortKey, setSortKey] = useState<string>("starts_at:asc")
	const [editing, setEditing] = useState<AdminTeacherBooking | null>(null)
	const [editMeetUrl, setEditMeetUrl] = useState("")
	const [cancelling, setCancelling] = useState<AdminTeacherBooking | null>(null)

	const [sortField, sortDir] = sortKey.split(":") as [string, "asc" | "desc"]
	const filters = { status: statusFilter, search: search || undefined, sort: sortField, direction: sortDir }
	const { data, isLoading } = useQuery(bookingsQuery(courseId, page, filters))
	const rows = data?.data ?? []

	const update = useUpdateBookingMeetUrl(courseId)
	const cancel = useCancelBooking(courseId)

	function openEdit(b: AdminTeacherBooking) {
		setEditing(b)
		setEditMeetUrl(b.meet_url ?? "")
	}

	async function onSaveMeetUrl(): Promise<void> {
		if (!editing) return
		try {
			await update.mutateAsync({
				id: editing.id,
				meetUrl: editMeetUrl.trim() === "" ? null : editMeetUrl.trim(),
			})
			showSuccess("Đã cập nhật link Google Meet.")
			setEditing(null)
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	async function onCancel(): Promise<void> {
		if (!cancelling) return
		try {
			await cancel.mutateAsync(cancelling.id)
			showSuccess("Đã hủy booking và hoàn xu cho học viên.")
			setCancelling(null)
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	return (
		<Flex vertical gap={16}>
			<Flex gap={12} wrap="wrap" align="center">
				<Select
					placeholder="Trạng thái"
					allowClear
					value={statusFilter}
					onChange={(v) => {
						setStatusFilter(v)
						setPage(1)
					}}
					style={{ width: 160 }}
					options={[
						{ label: "Đang đặt", value: "booked" },
						{ label: "Đã hoàn thành", value: "completed" },
						{ label: "Đã hủy", value: "cancelled" },
					]}
				/>
				<AntdInput
					prefix={<SearchOutlined />}
					placeholder="Tìm học viên…"
					allowClear
					value={search}
					onChange={(e) => {
						setSearch(e.target.value)
						setPage(1)
					}}
					style={{ width: 220 }}
				/>
				<Select
					value={sortKey}
					onChange={(v) => {
						setSortKey(v)
						setPage(1)
					}}
					style={{ width: 200 }}
					options={[
						{ label: "Buổi học sắp tới trước", value: "starts_at:asc" },
						{ label: "Buổi học xa nhất trước", value: "starts_at:desc" },
						{ label: "Mới đặt trước", value: "booked_at:desc" },
						{ label: "Đặt cũ nhất trước", value: "booked_at:asc" },
					]}
				/>
				<Typography.Text type="secondary" style={{ fontSize: 13, marginLeft: "auto" }}>
					{data ? `${data.meta.total} booking` : ""}
				</Typography.Text>
			</Flex>

			{!isLoading && rows.length === 0 ? (
				<Empty description="Chưa có học viên nào đặt slot 1-1." />
			) : (
				<Table
					rowKey="id"
					loading={isLoading}
					dataSource={rows}
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
					scroll={{ x: 900 }}
					columns={[
						{
							title: "Buổi học",
							width: 220,
							render: (_, r: AdminTeacherBooking) => (
								<Flex vertical gap={2}>
									<strong>{formatDateTimeVN(r.slot?.starts_at)}</strong>
									{r.slot && (
										<Typography.Text type="secondary" style={{ fontSize: 12 }}>
											{r.slot.duration_minutes} phút
										</Typography.Text>
									)}
								</Flex>
							),
						},
						{
							title: "Học viên",
							render: (_, r: AdminTeacherBooking) => {
								if (r.profile === null) return <span>—</span>
								const p = r.profile
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
							title: "Trạng thái",
							width: 120,
							render: (_, r: AdminTeacherBooking) => statusTag(r.status),
						},
						{
							title: "Google Meet",
							width: 240,
							render: (_, r: AdminTeacherBooking) =>
								r.meet_url ? (
									<a
										href={r.meet_url}
										target="_blank"
										rel="noreferrer"
										style={{
											fontSize: 12,
											display: "inline-flex",
											alignItems: "center",
											gap: 4,
											maxWidth: 220,
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										<LinkOutlined />
										{r.meet_url}
									</a>
								) : (
									<Typography.Text type="secondary" style={{ fontSize: 12 }}>
										—
									</Typography.Text>
								),
						},
						{
							title: "Đặt lúc",
							width: 170,
							render: (_, r: AdminTeacherBooking) => (
								<Typography.Text type="secondary" style={{ fontSize: 12 }}>
									{formatDateTimeVN(r.booked_at)}
								</Typography.Text>
							),
						},
						{
							title: "",
							width: 110,
							align: "right" as const,
							render: (_, r: AdminTeacherBooking) => {
								if (r.status !== "booked") return null
								return (
									<Space size={4}>
										<Button variant="ghost" onClick={() => openEdit(r)}>
											Sửa link
										</Button>
										<button
											type="button"
											onClick={() => setCancelling(r)}
											style={{
												background: "none",
												border: 0,
												padding: 4,
												cursor: "pointer",
												color: "#ef4444",
											}}
											aria-label="Hủy booking"
											title="Hủy + hoàn xu"
										>
											<CloseCircleOutlined />
										</button>
									</Space>
								)
							},
						},
					]}
				/>
			)}

			<Modal open={!!editing} onClose={() => setEditing(null)} title="Sửa link Google Meet" size="md">
				{editing && (
					<Flex vertical gap={12}>
						<FormField
							label="URL phòng học"
							htmlFor="meet_url"
							helper="Để trống nếu chưa có link. Sẽ thay link mock auto-generate ban đầu."
						>
							<Input
								id="meet_url"
								value={editMeetUrl}
								onChange={(e) => setEditMeetUrl(e.target.value)}
								placeholder="https://meet.google.com/abc-defg-hij"
							/>
						</FormField>
						<Flex justify="end" gap={8}>
							<Button variant="ghost" onClick={() => setEditing(null)} disabled={update.isPending}>
								Huỷ
							</Button>
							<Button onClick={onSaveMeetUrl} loading={update.isPending}>
								Lưu
							</Button>
						</Flex>
					</Flex>
				)}
			</Modal>

			<ConfirmDialog
				open={!!cancelling}
				onClose={() => setCancelling(null)}
				onConfirm={onCancel}
				title="Hủy booking 1-1"
				description={
					cancelling
						? `Hủy booking của ${cancelling.profile?.full_name ?? cancelling.profile?.nickname ?? "học viên"} cho buổi ${formatDateTimeVN(cancelling.slot?.starts_at)}? Hệ thống sẽ tự hoàn lại đúng số xu học viên đã trả + gửi thông báo. Slot sẽ trở về trạng thái Trống để học viên khác có thể đặt.`
						: undefined
				}
				loading={cancel.isPending}
			/>
		</Flex>
	)
}
