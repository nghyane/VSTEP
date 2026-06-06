import {
	CalendarOutlined,
	CheckOutlined,
	CloseOutlined,
	PhoneOutlined,
	SwapOutlined,
} from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Alert, Select as AntSelect, Empty, Flex, Input, Space, Table, Tag, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { FormField } from "#/components/FormField"
import { Modal } from "#/components/Modal"
import { PageHeader } from "#/components/PageHeader"
import { Select } from "#/components/Select"
import { showError, showSuccess } from "#/components/Toaster"
import type { AdminTeacherSlot, ScheduleItemFormInput } from "#/features/admin-courses/types"
import {
	type LeaveBookingImpact,
	type LeaveOpenSlotImpact,
	type LeaveRequestStatus,
	type LeaveScheduleImpact,
	type StaffLeaveRequestDetail,
	type StaffLeaveRequestItem,
	staffLeaveRequestDetailQuery,
	staffLeaveRequestsQuery,
	type TeacherDaySchedule,
	teacherDayScheduleQuery,
	useCancelLeaveBooking,
	useCancelLeaveScheduleItem,
	useDeleteLeaveOpenSlot,
	useRescheduleLeaveBooking,
	useRescheduleLeaveOpenSlot,
	useRescheduleLeaveScheduleItem,
	useUpdateLeaveRequestStatus,
} from "#/features/staff/leave-requests"
import { api, extractError, type PaginatedResponse } from "#/lib/api"

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
	const [detailId, setDetailId] = useState<string | null>(null)
	const [reschedulingBooking, setReschedulingBooking] = useState<LeaveBookingImpact | null>(null)
	const [reschedulingSchedule, setReschedulingSchedule] = useState<LeaveScheduleImpact | null>(null)
	const [cancellingBooking, setCancellingBooking] = useState<LeaveBookingImpact | null>(null)
	const [cancellingSchedule, setCancellingSchedule] = useState<LeaveScheduleImpact | null>(null)
	const [reschedulingOpenSlot, setReschedulingOpenSlot] = useState<LeaveOpenSlotImpact | null>(null)
	const [deletingOpenSlot, setDeletingOpenSlot] = useState<LeaveOpenSlotImpact | null>(null)
	const [cancelScheduleReason, setCancelScheduleReason] = useState("")
	const detail = useQuery(staffLeaveRequestDetailQuery(detailId))
	const rescheduleBooking = useRescheduleLeaveBooking()
	const cancelBooking = useCancelLeaveBooking()
	const rescheduleSchedule = useRescheduleLeaveScheduleItem()
	const cancelSchedule = useCancelLeaveScheduleItem()
	const rescheduleOpenSlot = useRescheduleLeaveOpenSlot()
	const deleteOpenSlot = useDeleteLeaveOpenSlot()

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

	async function handleCancelBooking(): Promise<void> {
		if (!cancellingBooking) return
		try {
			await cancelBooking.mutateAsync(cancellingBooking.id)
			showSuccess("Đã hủy booking và hoàn xu theo chính sách.")
			setCancellingBooking(null)
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	async function handleCancelSchedule(): Promise<void> {
		if (!cancellingSchedule) return
		try {
			await cancelSchedule.mutateAsync({ id: cancellingSchedule.id, reason: cancelScheduleReason.trim() })
			showSuccess("Đã hủy buổi học và gửi thông báo cho học viên.")
			setCancellingSchedule(null)
			setCancelScheduleReason("")
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	async function handleDeleteOpenSlot(): Promise<void> {
		if (!deletingOpenSlot) return
		try {
			await deleteOpenSlot.mutateAsync(deletingOpenSlot.id)
			showSuccess("Đã xóa slot 1-1 còn mở.")
			setDeletingOpenSlot(null)
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
			title: "Ảnh hưởng",
			width: 230,
			render: (_, item) => {
				const s = item.impact_summary
				if (!s) return <Typography.Text type="secondary">—</Typography.Text>
				return (
					<Space size={4} wrap>
						<Tag color={s.schedule_items_count > 0 ? "blue" : "default"}>
							{s.schedule_items_count} buổi học
						</Tag>
						<Tag color={s.bookings_count > 0 ? "red" : "default"}>{s.bookings_count} booking</Tag>
						<Tag color={s.open_slots_count > 0 ? "gold" : "default"}>
							{s.open_slots_count} slot 1-1 còn mở
						</Tag>
					</Space>
				)
			},
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
			render: (_, item) => (
				<Space>
					<Button size="sm" variant="ghost" onClick={() => setDetailId(item.id)}>
						Xem xử lý
					</Button>
					{item.status === "pending" ? (
						<>
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
						</>
					) : (
						<Typography.Text type="secondary">Đã xử lý</Typography.Text>
					)}
				</Space>
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

			<LeaveDetailModal
				open={detailId !== null}
				onClose={() => setDetailId(null)}
				loading={detail.isLoading}
				detail={detail.data?.data ?? null}
				onRescheduleBooking={setReschedulingBooking}
				onCancelBooking={setCancellingBooking}
				onRescheduleSchedule={setReschedulingSchedule}
				onCancelSchedule={(item) => {
					setCancellingSchedule(item)
					setCancelScheduleReason("")
				}}
				onRescheduleOpenSlot={setReschedulingOpenSlot}
				onDeleteOpenSlot={setDeletingOpenSlot}
			/>

			<RescheduleBookingModal
				booking={reschedulingBooking}
				onClose={() => setReschedulingBooking(null)}
				onSubmit={async (targetSlotId) => {
					if (!reschedulingBooking) return
					try {
						await rescheduleBooking.mutateAsync({ bookingId: reschedulingBooking.id, targetSlotId })
						showSuccess("Đã dời booking và gửi thông báo cho học viên.")
						setReschedulingBooking(null)
					} catch (err) {
						showError((await extractError(err)).message)
					}
				}}
				loading={rescheduleBooking.isPending}
			/>

			<RescheduleScheduleModal
				item={reschedulingSchedule}
				teacherId={detail.data?.data.leave.teacher?.id ?? null}
				onClose={() => setReschedulingSchedule(null)}
				onSubmit={async (input) => {
					if (!reschedulingSchedule) return
					try {
						await rescheduleSchedule.mutateAsync({ id: reschedulingSchedule.id, input })
						showSuccess("Đã dời buổi học và gửi thông báo cho học viên.")
						setReschedulingSchedule(null)
					} catch (err) {
						showError((await extractError(err)).message)
					}
				}}
				loading={rescheduleSchedule.isPending}
			/>

			<RescheduleOpenSlotModal
				slot={reschedulingOpenSlot}
				onClose={() => setReschedulingOpenSlot(null)}
				onSubmit={async ({ startsAt, durationMinutes }) => {
					if (!reschedulingOpenSlot) return
					try {
						await rescheduleOpenSlot.mutateAsync({
							id: reschedulingOpenSlot.id,
							startsAt,
							durationMinutes,
						})
						showSuccess("Đã dời slot 1-1 còn mở.")
						setReschedulingOpenSlot(null)
					} catch (err) {
						showError((await extractError(err)).message)
					}
				}}
				loading={rescheduleOpenSlot.isPending}
			/>

			<ConfirmDialog
				open={!!cancellingBooking}
				onClose={() => setCancellingBooking(null)}
				onConfirm={handleCancelBooking}
				title="Hủy booking 1-1"
				description="Chỉ dùng khi học viên không muốn hoặc không thể đổi buổi. Hệ thống sẽ tự hoàn đúng số xu booking đã trả, staff không cần nhập số xu."
				loading={cancelBooking.isPending}
			/>

			<ConfirmDialog
				open={!!deletingOpenSlot}
				onClose={() => setDeletingOpenSlot(null)}
				onConfirm={handleDeleteOpenSlot}
				title="Xóa slot 1-1 còn mở"
				description={
					deletingOpenSlot
						? `Xóa slot ${deletingOpenSlot.course_title ?? "1-1"} lúc ${formatDateTime(deletingOpenSlot.starts_at)}? Học viên sẽ không còn thấy slot này để đặt.`
						: undefined
				}
				loading={deleteOpenSlot.isPending}
			/>

			<Modal
				open={!!cancellingSchedule}
				onClose={() => setCancellingSchedule(null)}
				title="Hủy buổi học"
				size="md"
			>
				<Flex vertical gap={12}>
					<Alert type="warning" showIcon title="Học viên trong khóa sẽ nhận thông báo và email." />
					<Input.TextArea
						rows={3}
						maxLength={500}
						placeholder="Lý do hủy buổi học"
						value={cancelScheduleReason}
						onChange={(e) => setCancelScheduleReason(e.target.value)}
					/>
					<Flex justify="end" gap={8}>
						<Button
							variant="ghost"
							onClick={() => setCancellingSchedule(null)}
							disabled={cancelSchedule.isPending}
						>
							Hủy
						</Button>
						<Button variant="danger" onClick={handleCancelSchedule} loading={cancelSchedule.isPending}>
							Xác nhận hủy buổi
						</Button>
					</Flex>
				</Flex>
			</Modal>
		</Flex>
	)
}

interface LeaveDetailModalProps {
	open: boolean
	onClose: () => void
	loading: boolean
	detail: StaffLeaveRequestDetail | null
	onRescheduleBooking: (booking: LeaveBookingImpact) => void
	onCancelBooking: (booking: LeaveBookingImpact) => void
	onRescheduleSchedule: (item: LeaveScheduleImpact) => void
	onCancelSchedule: (item: LeaveScheduleImpact) => void
	onRescheduleOpenSlot: (slot: LeaveOpenSlotImpact) => void
	onDeleteOpenSlot: (slot: LeaveOpenSlotImpact) => void
}

function LeaveDetailModal({
	open,
	onClose,
	loading,
	detail,
	onRescheduleBooking,
	onCancelBooking,
	onRescheduleSchedule,
	onCancelSchedule,
	onRescheduleOpenSlot,
	onDeleteOpenSlot,
}: LeaveDetailModalProps) {
	return (
		<Modal open={open} onClose={onClose} title="Xử lý đơn nghỉ" size="xl">
			{loading || !detail ? (
				<Typography.Text type="secondary">Đang tải dữ liệu ảnh hưởng…</Typography.Text>
			) : (
				<Flex vertical gap={20}>
					<Flex vertical gap={4}>
						<Typography.Text strong>{detail.leave.teacher?.full_name ?? "Giáo viên"}</Typography.Text>
						<Typography.Text type="secondary">
							Ngày nghỉ {dayjs(detail.leave.date).format("DD/MM/YYYY")} ·{" "}
							{STATUS_MAP[detail.leave.status].label}
						</Typography.Text>
						{detail.leave.reason && <Typography.Text>Lý do: {detail.leave.reason}</Typography.Text>}
					</Flex>

					<Space size={4} wrap>
						<Tag color={detail.summary.schedule_items_count > 0 ? "blue" : "default"}>
							{detail.summary.schedule_items_count} buổi học
						</Tag>
						<Tag color={detail.summary.bookings_count > 0 ? "red" : "default"}>
							{detail.summary.bookings_count} booking 1-1
						</Tag>
						<Tag color={detail.summary.open_slots_count > 0 ? "gold" : "default"}>
							{detail.summary.open_slots_count} slot 1-1 còn mở
						</Tag>
					</Space>

					<ImpactSection title="Buổi học khóa học">
						{detail.impacts.schedule_items.length === 0 ? (
							<Empty description="Không có buổi học khóa học bị ảnh hưởng" />
						) : (
							<Table
								rowKey="id"
								pagination={false}
								dataSource={detail.impacts.schedule_items}
								columns={[
									{
										title: "Buổi học",
										render: (_, item: LeaveScheduleImpact) => (
											<Flex vertical gap={2}>
												<strong>
													#{item.session_number} · {item.course_title ?? "—"}
												</strong>
												<Typography.Text type="secondary" style={{ fontSize: 12 }}>
													{dayjs(item.date).format("DD/MM/YYYY")} {item.start_time}–{item.end_time} ·{" "}
													{item.topic}
												</Typography.Text>
												<LearnerContacts learners={item.learners} />
											</Flex>
										),
									},
									{
										title: "Trạng thái",
										width: 120,
										render: (_, item: LeaveScheduleImpact) =>
											item.status === "cancelled" ? (
												<Tag color="red">Đã hủy</Tag>
											) : (
												<Tag color="blue">Đang lịch</Tag>
											),
									},
									{
										title: "",
										width: 170,
										align: "right" as const,
										render: (_, item: LeaveScheduleImpact) => (
											<Space>
												<Button
													size="sm"
													icon={<CalendarOutlined />}
													onClick={() => onRescheduleSchedule(item)}
												>
													Dời
												</Button>
												<Button size="sm" variant="danger" onClick={() => onCancelSchedule(item)}>
													Hủy
												</Button>
											</Space>
										),
									},
								]}
							/>
						)}
					</ImpactSection>

					<ImpactSection title="Booking 1-1 đã đặt">
						{detail.impacts.bookings.length === 0 ? (
							<Empty description="Không có booking 1-1 bị ảnh hưởng" />
						) : (
							<Table
								rowKey="id"
								pagination={false}
								dataSource={detail.impacts.bookings}
								columns={[
									{
										title: "Booking",
										render: (_, item: LeaveBookingImpact) => (
											<Flex vertical gap={2}>
												<strong>{item.slot.course_title ?? "—"}</strong>
												<Typography.Text type="secondary" style={{ fontSize: 12 }}>
													{formatDateTime(item.slot.starts_at)} · {item.slot.duration_minutes} phút
												</Typography.Text>
												<ContactLine learner={item.learner} />
												{typeof item.coins_paid === "number" && (
													<Typography.Text type="secondary" style={{ fontSize: 12 }}>
														Admin: hoàn dự kiến {item.coins_paid} xu ·{" "}
														{item.refund_status === "refunded" ? "đã hoàn" : "chưa hoàn"}
													</Typography.Text>
												)}
											</Flex>
										),
									},
									{
										title: "",
										width: 190,
										align: "right" as const,
										render: (_, item: LeaveBookingImpact) => (
											<Space>
												<Button size="sm" icon={<SwapOutlined />} onClick={() => onRescheduleBooking(item)}>
													Dời booking
												</Button>
												<Button size="sm" variant="danger" onClick={() => onCancelBooking(item)}>
													Hủy & hoàn
												</Button>
											</Space>
										),
									},
								]}
							/>
						)}
					</ImpactSection>

					<ImpactSection title="Slot 1-1 còn mở chưa có học viên đặt">
						<Alert
							type="warning"
							showIcon
							title="Các slot này chưa có học viên đặt nhưng vẫn đang mở cho learner. Hãy dời hoặc xóa nếu không muốn học viên đặt vào ngày giáo viên nghỉ."
						/>
						{detail.impacts.open_slots.length === 0 ? (
							<Empty description="Không có slot 1-1 còn mở trong ngày nghỉ" />
						) : (
							<Table
								rowKey="id"
								pagination={false}
								dataSource={detail.impacts.open_slots}
								columns={[
									{
										title: "Slot còn mở",
										render: (_, slot: LeaveOpenSlotImpact) => (
											<Flex vertical gap={2}>
												<strong>{slot.course_title ?? "—"}</strong>
												<Typography.Text type="secondary" style={{ fontSize: 12 }}>
													{formatDateTime(slot.starts_at)} · {slot.duration_minutes} phút
												</Typography.Text>
											</Flex>
										),
									},
									{
										title: "",
										width: 150,
										align: "right" as const,
										render: (_, slot: LeaveOpenSlotImpact) => (
											<Space>
												<Button size="sm" onClick={() => onRescheduleOpenSlot(slot)}>
													Dời
												</Button>
												<Button size="sm" variant="danger" onClick={() => onDeleteOpenSlot(slot)}>
													Xóa
												</Button>
											</Space>
										),
									},
								]}
							/>
						)}
					</ImpactSection>
				</Flex>
			)}
		</Modal>
	)
}

function ImpactSection({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<Flex vertical gap={10}>
			<Typography.Title level={5} style={{ margin: 0 }}>
				{title}
			</Typography.Title>
			{children}
		</Flex>
	)
}

function ContactLine({
	learner,
}: {
	learner: { full_name: string | null; email: string | null; phone_number: string | null }
}) {
	return (
		<Flex vertical gap={1}>
			<Typography.Text type="secondary" style={{ fontSize: 12 }}>
				{learner.full_name ?? "Học viên"} · {learner.email ?? "chưa có email"}
			</Typography.Text>
			<Typography.Text type={learner.phone_number ? "secondary" : "warning"} style={{ fontSize: 12 }}>
				SĐT: {learner.phone_number ?? "chưa cập nhật"}
			</Typography.Text>
		</Flex>
	)
}

function LearnerContacts({
	learners,
}: {
	learners: Array<{ full_name: string | null; email: string | null; phone_number: string | null }>
}) {
	if (learners.length === 0)
		return <Typography.Text type="secondary">Chưa có học viên ghi danh</Typography.Text>
	return (
		<Space size={4} wrap>
			{learners.slice(0, 4).map((learner, index) => (
				<Tag
					key={`${learner.email ?? learner.phone_number ?? index}`}
					icon={learner.phone_number ? <PhoneOutlined /> : undefined}
				>
					{learner.full_name ?? learner.email ?? "Học viên"}
					{learner.phone_number ? ` · ${learner.phone_number}` : " · chưa có SĐT"}
				</Tag>
			))}
			{learners.length > 4 && <Tag>+{learners.length - 4} học viên</Tag>}
		</Space>
	)
}

function RescheduleBookingModal({
	booking,
	onClose,
	onSubmit,
	loading,
}: {
	booking: LeaveBookingImpact | null
	onClose: () => void
	onSubmit: (targetSlotId: string) => Promise<void>
	loading: boolean
}) {
	const [targetSlotId, setTargetSlotId] = useState<string | null>(null)
	const courseId = booking?.slot.course_id ?? null
	const slots = useQuery({
		queryKey: ["admin", "leave-requests", "target-slots", courseId],
		enabled: courseId !== null,
		queryFn: () =>
			api
				.get(`admin/courses/${courseId}/slots?page=1&per_page=100`)
				.json<PaginatedResponse<AdminTeacherSlot>>(),
	})
	const options = (slots.data?.data ?? [])
		.filter((slot) => slot.status === "open" && slot.id !== booking?.slot.id)
		.map((slot) => ({
			label: `${formatDateTime(slot.starts_at)} · ${slot.duration_minutes} phút`,
			value: slot.id,
		}))
	const canSubmit = targetSlotId !== null && options.some((option) => option.value === targetSlotId)

	return (
		<Modal open={booking !== null} onClose={onClose} title="Dời booking 1-1" size="md">
			<Flex vertical gap={12}>
				<Alert type="info" showIcon title="Dời booking không hoàn xu và không tạo giao dịch mới." />
				<AntSelect
					showSearch
					placeholder="Chọn slot mới còn trống"
					value={targetSlotId}
					onChange={setTargetSlotId}
					loading={slots.isLoading}
					options={options}
					style={{ width: "100%" }}
				/>
				<Flex justify="end" gap={8}>
					<Button variant="ghost" onClick={onClose} disabled={loading}>
						Hủy
					</Button>
					<Button
						onClick={() => targetSlotId && onSubmit(targetSlotId)}
						disabled={!canSubmit}
						loading={loading}
					>
						Dời booking
					</Button>
				</Flex>
			</Flex>
		</Modal>
	)
}

function RescheduleScheduleModal({
	item,
	teacherId,
	onClose,
	onSubmit,
	loading,
}: {
	item: LeaveScheduleImpact | null
	teacherId: string | null
	onClose: () => void
	onSubmit: (input: ScheduleItemFormInput) => Promise<void>
	loading: boolean
}) {
	return (
		<Modal open={item !== null} onClose={onClose} title="Dời buổi học" size="md">
			{item && (
				<RescheduleScheduleForm
					item={item}
					teacherId={teacherId}
					loading={loading}
					onClose={onClose}
					onSubmit={onSubmit}
				/>
			)}
		</Modal>
	)
}

function RescheduleScheduleForm({
	item,
	teacherId,
	loading,
	onClose,
	onSubmit,
}: {
	item: LeaveScheduleImpact
	teacherId: string | null
	loading: boolean
	onClose: () => void
	onSubmit: (input: ScheduleItemFormInput) => Promise<void>
}) {
	const [state, setState] = useState<ScheduleItemFormInput>({
		session_number: item.session_number,
		date: toDateInput(item.date),
		start_time: toTimeInput(item.start_time),
		end_time: toTimeInput(item.end_time),
		topic: item.topic,
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)
	const selectedDate = state.date || null
	const daySchedule = useQuery(teacherDayScheduleQuery(teacherId, selectedDate))
	const courseStartDate = toDateInput(item.course_start_date ?? undefined)
	const courseEndDate = toDateInput(item.course_end_date ?? undefined)
	const dateOutOfCourseRange =
		(state.date && courseStartDate && state.date < courseStartDate) ||
		(state.date && courseEndDate && state.date > courseEndDate)

	function set<K extends keyof ScheduleItemFormInput>(key: K, value: ScheduleItemFormInput[K]): void {
		setState((current) => ({ ...current, [key]: value }))
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault()
		setErrors({})
		setGeneric(null)
		if (dateOutOfCourseRange) {
			setErrors({ date: [courseDateRangeMessage(courseStartDate, courseEndDate)] })
			return
		}
		try {
			await onSubmit({
				...state,
				start_time: toTimeInput(state.start_time),
				end_time: toTimeInput(state.end_time),
			})
		} catch (err) {
			const error = await extractError(err)
			if (error.errors && Object.keys(error.errors).length > 0) {
				setErrors(error.errors)
			}
			setGeneric(error.message || "Không thể dời buổi học")
		}
	}

	return (
		<form onSubmit={handleSubmit}>
			<Flex vertical gap={12}>
				<Flex gap={12} align="start">
					<FormField label="Số buổi" htmlFor="schedule-session-number" error={errors.session_number}>
						<Input
							id="schedule-session-number"
							type="number"
							min={1}
							value={state.session_number ?? ""}
							onChange={(event) =>
								set("session_number", event.target.value === "" ? null : Number(event.target.value))
							}
						/>
					</FormField>
					<FormField label="Ngày" htmlFor="schedule-date" required error={errors.date}>
						<Input
							id="schedule-date"
							type="date"
							min={courseStartDate || undefined}
							max={courseEndDate || undefined}
							value={state.date}
							onChange={(event) => set("date", event.target.value)}
						/>
						{(courseStartDate || courseEndDate) && (
							<Typography.Text type={dateOutOfCourseRange ? "danger" : "secondary"} style={{ fontSize: 12 }}>
								{courseDateRangeMessage(courseStartDate, courseEndDate)}
							</Typography.Text>
						)}
					</FormField>
				</Flex>
				<Flex gap={12} align="start">
					<FormField label="Giờ bắt đầu" htmlFor="schedule-start-time" required error={errors.start_time}>
						<Input
							id="schedule-start-time"
							type="time"
							value={state.start_time}
							onChange={(event) => set("start_time", event.target.value)}
						/>
					</FormField>
					<FormField label="Giờ kết thúc" htmlFor="schedule-end-time" required error={errors.end_time}>
						<Input
							id="schedule-end-time"
							type="time"
							min={state.start_time || undefined}
							value={state.end_time}
							onChange={(event) => set("end_time", event.target.value)}
						/>
					</FormField>
				</Flex>
				<FormField label="Chủ đề" htmlFor="schedule-topic" required error={errors.topic}>
					<Input
						id="schedule-topic"
						value={state.topic}
						onChange={(event) => set("topic", event.target.value)}
					/>
				</FormField>
				{generic && <Alert type="error" title={generic} showIcon />}
				<TeacherDaySchedulePreview
					loading={daySchedule.isLoading}
					schedule={daySchedule.data?.data ?? null}
					currentScheduleItemId={item.id}
				/>
				<Flex justify="end" gap={8}>
					<Button variant="ghost" onClick={onClose} disabled={loading}>
						Hủy
					</Button>
					<Button type="submit" loading={loading} disabled={!!dateOutOfCourseRange}>
						Cập nhật
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}

function RescheduleOpenSlotModal({
	slot,
	onClose,
	onSubmit,
	loading,
}: {
	slot: LeaveOpenSlotImpact | null
	onClose: () => void
	onSubmit: (input: { startsAt: string; durationMinutes: number }) => Promise<void>
	loading: boolean
}) {
	return (
		<Modal open={slot !== null} onClose={onClose} title="Dời slot 1-1 còn mở" size="md">
			{slot && (
				<RescheduleOpenSlotForm
					key={slot.id}
					slot={slot}
					onClose={onClose}
					onSubmit={onSubmit}
					loading={loading}
				/>
			)}
		</Modal>
	)
}

function RescheduleOpenSlotForm({
	slot,
	onClose,
	onSubmit,
	loading,
}: {
	slot: LeaveOpenSlotImpact
	onClose: () => void
	onSubmit: (input: { startsAt: string; durationMinutes: number }) => Promise<void>
	loading: boolean
}) {
	const [startsAt, setStartsAt] = useState(dayjs(slot.starts_at).format("YYYY-MM-DDTHH:mm"))
	const [durationMinutes, setDurationMinutes] = useState(slot.duration_minutes)
	const minStartsAt = dayjs().format("YYYY-MM-DDTHH:mm")
	const selectedDate = startsAt ? dayjs(startsAt).format("YYYY-MM-DD") : null
	const daySchedule = useQuery(teacherDayScheduleQuery(slot.teacher_id, selectedDate))
	const startsAtIsPast = startsAt ? dayjs(startsAt).isBefore(dayjs()) : false

	async function submit(): Promise<void> {
		if (!startsAt) return
		if (startsAtIsPast) return
		await onSubmit({ startsAt: dayjs(startsAt).toISOString(), durationMinutes })
	}

	return (
		<Flex vertical gap={12}>
			<Alert type="info" showIcon title="Slot chưa có học viên đặt nên có thể dời trực tiếp." />
			<label htmlFor="open-slot-start" style={{ fontSize: 13, fontWeight: 600 }}>
				Thời gian mới
			</label>
			<Input
				id="open-slot-start"
				type="datetime-local"
				min={minStartsAt}
				value={startsAt}
				onChange={(e) => setStartsAt(e.target.value)}
			/>
			{startsAtIsPast && (
				<Typography.Text type="danger" style={{ fontSize: 12 }}>
					Không thể chọn thời điểm đã qua.
				</Typography.Text>
			)}
			<label htmlFor="open-slot-duration" style={{ fontSize: 13, fontWeight: 600 }}>
				Thời lượng (phút)
			</label>
			<Input
				id="open-slot-duration"
				type="number"
				min={15}
				max={180}
				step={15}
				value={durationMinutes}
				onChange={(e) => setDurationMinutes(Number(e.target.value))}
			/>
			<TeacherDaySchedulePreview
				loading={daySchedule.isLoading}
				schedule={daySchedule.data?.data ?? null}
				currentSlotId={slot.id}
			/>
			<Flex justify="end" gap={8}>
				<Button variant="ghost" onClick={onClose} disabled={loading}>
					Hủy
				</Button>
				<Button
					onClick={submit}
					disabled={!startsAt || startsAtIsPast || durationMinutes <= 0}
					loading={loading}
				>
					Dời slot
				</Button>
			</Flex>
		</Flex>
	)
}

function TeacherDaySchedulePreview({
	loading,
	schedule,
	currentSlotId,
	currentScheduleItemId,
}: {
	loading: boolean
	schedule: TeacherDaySchedule | null
	currentSlotId?: string
	currentScheduleItemId?: string
}) {
	if (loading)
		return <Typography.Text type="secondary">Đang tải lịch hiện tại của giáo viên…</Typography.Text>
	if (!schedule) return null

	const visibleScheduleItems = schedule.schedule_items.filter((item) => item.status !== "cancelled")
	const hasBusy = visibleScheduleItems.length > 0 || schedule.slots.length > 0

	return (
		<Flex vertical gap={8} style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 12 }}>
			<Typography.Text strong style={{ fontSize: 13 }}>
				Lịch hiện tại của giáo viên trong ngày đã chọn
			</Typography.Text>
			{!hasBusy ? (
				<Typography.Text type="secondary" style={{ fontSize: 12 }}>
					Chưa có lịch lớp hoặc slot 1-1 nào trong ngày này.
				</Typography.Text>
			) : (
				<Space direction="vertical" size={4} style={{ width: "100%" }}>
					{visibleScheduleItems.map((item) => (
						<Tag
							key={item.id}
							color={item.id === currentScheduleItemId ? "gold" : "blue"}
							style={{ width: "fit-content" }}
						>
							{item.id === currentScheduleItemId ? "Buổi học đang dời" : "Buổi học"} · {item.start_time}–
							{item.end_time} · {item.course_title ?? "—"}
						</Tag>
					))}
					{schedule.slots.map((busySlot) => (
						<Tag
							key={busySlot.id}
							color={busySlot.id === currentSlotId ? "gold" : busySlot.status === "booked" ? "red" : "green"}
							style={{ width: "fit-content" }}
						>
							{busySlot.id === currentSlotId
								? "Slot đang dời"
								: busySlot.status === "booked"
									? "Booking 1-1"
									: "Slot 1-1 mở"}{" "}
							· {dayjs(busySlot.starts_at).format("HH:mm")} · {busySlot.duration_minutes} phút ·{" "}
							{busySlot.course_title ?? "—"}
						</Tag>
					))}
				</Space>
			)}
			<Typography.Text type="secondary" style={{ fontSize: 12 }}>
				Nếu chọn giờ trùng, backend sẽ từ chối khi lưu. Danh sách này giúp staff kiểm tra trước khi dời.
			</Typography.Text>
		</Flex>
	)
}

function formatDateTime(value: string | null): string {
	if (!value) return "—"
	return dayjs(value).format("DD/MM/YYYY HH:mm")
}

function toDateInput(value: string | undefined): string {
	if (!value) return ""
	return value.length >= 10 ? value.slice(0, 10) : value
}

function toTimeInput(value: string | undefined): string {
	if (!value) return ""
	return value.length >= 5 ? value.slice(0, 5) : value
}

function courseDateRangeMessage(startDate: string, endDate: string): string {
	if (startDate && endDate) return `Ngày phải nằm trong thời gian khóa học: ${startDate} đến ${endDate}.`
	if (startDate) return `Ngày phải từ ${startDate} trở đi.`
	if (endDate) return `Ngày phải không sau ${endDate}.`
	return "Ngày phải nằm trong thời gian khóa học."
}
