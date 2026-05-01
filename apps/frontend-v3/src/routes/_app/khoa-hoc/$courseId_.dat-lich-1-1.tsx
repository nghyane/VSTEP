import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Header } from "#/components/Header"
import { Icon, StaticIcon } from "#/components/Icon"
import { Loading } from "#/components/Loading"
import { SlotGrid } from "#/features/booking/components/SlotGrid"
import { bookingPageQuery, bookSlotMock, seedTeacher } from "#/features/booking/queries"
import type { BookingPageData, BookingSlot, BookingTeacher } from "#/features/booking/types"
import { courseDetailQuery } from "#/features/course/queries"
import { cn, formatDate, formatVnDate } from "#/lib/utils"

export const Route = createFileRoute("/_app/khoa-hoc/$courseId_/dat-lich-1-1")({
	component: BookingPage,
})

function BookingPage() {
	const { courseId } = Route.useParams()
	const courseRes = useQuery(courseDetailQuery(courseId))
	const courseTeacher = courseRes.data?.data.course.teacher ?? null

	useEffect(() => {
		if (!courseTeacher) return
		seedTeacher(courseId, {
			id: courseTeacher.id,
			full_name: courseTeacher.full_name,
			title: courseTeacher.title ?? null,
			bio: courseTeacher.bio ?? null,
		})
	}, [courseId, courseTeacher])

	const { data, isLoading } = useQuery(bookingPageQuery(courseId))

	const [weekOffset, setWeekOffset] = useState(0)
	const weekStartMs = useMemo(() => {
		const start = snapMonday(new Date())
		start.setDate(start.getDate() + weekOffset * 7)
		return start.getTime()
	}, [weekOffset])

	const [pending, setPending] = useState<BookingSlot | null>(null)

	const courseTitle = courseRes.data?.data.course.title ?? null

	return (
		<>
			<Header title="Đặt lịch 1-1" backTo={`/khoa-hoc/${courseId}`} />
			<div className="px-10 pb-12 max-w-5xl mx-auto w-full space-y-6">
				<p className="text-base text-muted max-w-2xl leading-relaxed">
					{courseTitle && <span className="font-extrabold text-foreground">{courseTitle} · </span>}
					Chọn 1 khung giờ trống để đặt buổi học 30 phút với giảng viên. Link Google Meet sẽ được gửi tới bạn
					sau khi đặt.
				</p>
				{isLoading || !data ? (
					<Loading />
				) : (
					<BookingBody
						data={data.data}
						courseId={courseId}
						weekOffset={weekOffset}
						weekStartMs={weekStartMs}
						setWeekOffset={setWeekOffset}
						pending={pending}
						setPending={setPending}
					/>
				)}
			</div>
		</>
	)
}

interface BodyProps {
	data: BookingPageData
	courseId: string
	weekOffset: number
	weekStartMs: number
	setWeekOffset: (n: number) => void
	pending: BookingSlot | null
	setPending: (slot: BookingSlot | null) => void
}

function BookingBody({
	data,
	courseId,
	weekOffset,
	weekStartMs,
	setWeekOffset,
	pending,
	setPending,
}: BodyProps) {
	const queryClient = useQueryClient()
	const [success, setSuccess] = useState<BookingSlot | null>(null)

	const mutation = useMutation({
		mutationFn: (slot: BookingSlot) => bookSlotMock(courseId, slot.id),
		onSuccess: (booked) => {
			queryClient.setQueryData(["booking", courseId], (prev: { data: BookingPageData } | undefined) => {
				if (!prev) return prev
				return {
					data: {
						...prev.data,
						slots: prev.data.slots.map((s) => (s.id === booked.id ? booked : s)),
						my_bookings_count: prev.data.my_bookings_count + 1,
					},
				}
			})
			setPending(null)
			setSuccess(booked)
		},
	})

	const weekEnd = new Date(weekStartMs)
	weekEnd.setDate(weekEnd.getDate() + 6)

	return (
		<>
			<TeacherCard teacher={data.teacher} myBookingsCount={data.my_bookings_count} />

			<div className="flex items-center justify-between gap-3 flex-wrap">
				<div className="min-w-0">
					<p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted">Lịch trống</p>
					<p className="mt-1 text-sm font-extrabold text-foreground tabular-nums">
						{formatDate(new Date(weekStartMs).toISOString())} — {formatDate(weekEnd.toISOString())}
					</p>
				</div>
				<div className="inline-flex items-center gap-1 p-1 rounded-full bg-surface border-2 border-border">
					<WeekButton
						label="Tuần trước"
						icon="back"
						onClick={() => setWeekOffset(weekOffset - 1)}
						disabled={weekOffset <= -1}
					/>
					<button
						type="button"
						onClick={() => setWeekOffset(0)}
						className={cn(
							"px-3 py-1.5 rounded-full text-xs font-extrabold transition-colors",
							weekOffset === 0
								? "bg-background text-foreground border-2 border-border border-b-4 -translate-y-px"
								: "text-muted hover:text-foreground",
						)}
					>
						Tuần này
					</button>
					<WeekButton
						label="Tuần sau"
						icon="play"
						onClick={() => setWeekOffset(weekOffset + 1)}
						disabled={weekOffset >= 4}
					/>
				</div>
			</div>

			<Legend />

			<SlotGrid slots={data.slots} weekStartMs={weekStartMs} onSelect={setPending} />

			<ConfirmBookingDialog
				slot={pending}
				teacher={data.teacher}
				isLoading={mutation.isPending}
				onCancel={() => !mutation.isPending && setPending(null)}
				onConfirm={() => pending && mutation.mutate(pending)}
			/>

			<SuccessPopup slot={success} teacher={data.teacher} onClose={() => setSuccess(null)} />
		</>
	)
}

function WeekButton({
	label,
	icon,
	onClick,
	disabled,
}: {
	label: string
	icon: "back" | "play"
	onClick: () => void
	disabled: boolean
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-label={label}
			className={cn(
				"inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-background hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed",
			)}
		>
			<Icon name={icon} size="xs" className={cn("h-3.5 w-auto", icon === "play" && "rotate-0")} />
		</button>
	)
}

function TeacherCard({ teacher, myBookingsCount }: { teacher: BookingTeacher; myBookingsCount: number }) {
	const initials = teacher.full_name
		.split(/\s+/)
		.map((w) => w[0])
		.join("")
		.slice(-2)
		.toUpperCase()
	return (
		<div className="card p-5 flex items-start gap-4 flex-wrap">
			<div className="size-14 shrink-0 rounded-2xl border-2 border-b-4 border-primary/30 bg-primary-tint flex items-center justify-center text-primary font-extrabold text-lg">
				{initials}
			</div>
			<div className="flex-1 min-w-0 space-y-1">
				<p className="font-extrabold text-foreground">{teacher.full_name}</p>
				{teacher.title && (
					<p className="text-sm flex items-center gap-1.5 text-foreground">
						<Icon name="graduation" size="xs" className="text-muted shrink-0" />
						<span className="font-bold">{teacher.title}</span>
					</p>
				)}
				{teacher.bio && <p className="text-sm text-muted leading-relaxed pt-0.5">{teacher.bio}</p>}
			</div>
			<span
				className={cn(
					"inline-flex items-center gap-1.5 rounded-full border-2 border-b-4 px-3 py-1 text-xs font-extrabold",
					myBookingsCount > 0
						? "border-success/40 bg-success/10 text-success"
						: "border-border bg-surface text-muted",
				)}
			>
				<Icon name="check" size="xs" className="h-3 w-auto" />
				{myBookingsCount > 0 ? `Đã đặt ${myBookingsCount} buổi` : "Chưa có buổi nào"}
			</span>
		</div>
	)
}

function Legend() {
	const items = [
		{ key: "available", label: "Trống", className: "bg-primary-tint/80 border-primary/30" },
		{ key: "booked_me", label: "Lịch của bạn", className: "bg-success/15 border-success/40" },
		{ key: "booked_other", label: "Đã có người đặt", className: "bg-border/60 border-border" },
		{ key: "past", label: "Đã qua", className: "bg-surface border-border opacity-60" },
	]
	return (
		<div className="flex flex-wrap items-center gap-3">
			{items.map((it) => (
				<span key={it.key} className="inline-flex items-center gap-2 text-xs font-bold text-muted">
					<span className={cn("inline-block size-3.5 rounded-sm border-2", it.className)} />
					{it.label}
				</span>
			))}
		</div>
	)
}

function ConfirmBookingDialog({
	slot,
	teacher,
	isLoading,
	onCancel,
	onConfirm,
}: {
	slot: BookingSlot | null
	teacher: BookingTeacher
	isLoading: boolean
	onCancel: () => void
	onConfirm: () => void
}) {
	useEffect(() => {
		if (!slot) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !isLoading) onCancel()
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [slot, isLoading, onCancel])

	if (!slot || typeof document === "undefined") return null
	const start = new Date(slot.starts_at)
	const end = new Date(start.getTime() + slot.duration_minutes * 60 * 1000)

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-6">
			<button
				type="button"
				aria-label="Đóng"
				onClick={onCancel}
				className="absolute inset-0 bg-foreground/45 backdrop-blur-sm"
			/>
			<div className="relative w-full max-w-md rounded-(--radius-card) border-2 border-b-4 border-border bg-card overflow-hidden animate-[popIn_400ms_cubic-bezier(0.34,1.56,0.64,1)]">
				<div className="bg-gradient-to-b from-primary-tint/70 to-transparent px-7 pt-6 pb-5">
					<p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary-dark">
						Xác nhận đặt lịch
					</p>
					<h2 className="mt-2 text-lg font-extrabold text-foreground leading-snug">
						Học 1-1 với {teacher.full_name}
					</h2>
				</div>
				<div className="px-7 pb-6 pt-2 space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<InfoTile label="Ngày" value={formatVnDate(slot.starts_at)} />
						<InfoTile label="Thời gian" value={`${fmtClock(start)}–${fmtClock(end)}`} />
					</div>
					<div className="rounded-(--radius-button) border-2 border-warning/30 bg-warning-tint px-3 py-2.5 text-xs font-extrabold text-warning leading-relaxed">
						Sau khi đặt, bạn không thể huỷ trong vòng 12 giờ trước buổi học.
					</div>
					<div className="flex gap-2.5">
						<button
							type="button"
							onClick={onCancel}
							disabled={isLoading}
							className="flex-1 rounded-(--radius-button) border-2 border-b-4 border-border bg-surface px-4 py-2.5 text-sm font-extrabold text-foreground transition-all hover:border-primary/40 active:translate-y-[2px] active:border-b-2 disabled:opacity-60"
						>
							Huỷ
						</button>
						<button
							type="button"
							onClick={onConfirm}
							disabled={isLoading}
							className="btn btn-primary flex-1 text-sm disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isLoading ? "Đang đặt…" : "Đặt buổi học"}
						</button>
					</div>
				</div>
			</div>
		</div>,
		document.body,
	)
}

function InfoTile({ label, value }: { label: string; value: string }) {
	return (
		<div className="space-y-1 rounded-(--radius-card) border-2 border-dashed border-border bg-background px-3.5 py-3">
			<p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">{label}</p>
			<p className="text-sm font-extrabold tabular-nums text-foreground">{value}</p>
		</div>
	)
}

function SuccessPopup({
	slot,
	teacher,
	onClose,
}: {
	slot: BookingSlot | null
	teacher: BookingTeacher
	onClose: () => void
}) {
	if (!slot || typeof document === "undefined") return null
	const start = new Date(slot.starts_at)
	const end = new Date(start.getTime() + slot.duration_minutes * 60 * 1000)
	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-6">
			<button
				type="button"
				aria-label="Đóng"
				onClick={onClose}
				className="absolute inset-0 bg-foreground/45 backdrop-blur-sm"
			/>
			<div className="relative w-full max-w-md rounded-(--radius-card) border-2 border-b-4 border-border bg-card overflow-hidden animate-[popIn_400ms_cubic-bezier(0.34,1.56,0.64,1)]">
				<div className="bg-gradient-to-b from-success/15 to-transparent px-7 pt-7 pb-5 text-center">
					<p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-success">
						Đặt lịch thành công
					</p>
					<h2 className="mt-2 text-xl font-extrabold text-foreground leading-snug">
						Hẹn gặp bạn trong buổi học!
					</h2>
				</div>
				<div className="relative flex justify-center px-7 pb-2">
					<div className="relative size-24 rounded-full bg-success/15 border-2 border-b-4 border-success/40 flex items-center justify-center">
						<StaticIcon name="avatar-nodding" size="xl" className="h-16 w-auto" />
						<span className="absolute -top-2 -right-2 inline-flex items-center justify-center size-9 rounded-full bg-success border-2 border-b-4 border-primary-dark text-white">
							<Icon name="check" size="sm" className="text-white" />
						</span>
					</div>
				</div>
				<div className="px-7 pb-6 pt-4 space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<InfoTile label="Giảng viên" value={teacher.full_name} />
						<InfoTile
							label="Khung giờ"
							value={`${fmtClock(start)}–${fmtClock(end)} · ${formatDate(slot.starts_at)}`}
						/>
					</div>
					{slot.meet_url && (
						<a
							href={slot.meet_url}
							target="_blank"
							rel="noreferrer"
							className="btn btn-primary w-full py-3 text-sm"
						>
							<Icon name="play" size="xs" className="text-white" />
							Mở Google Meet
						</a>
					)}
					<button
						type="button"
						onClick={onClose}
						className="w-full rounded-(--radius-button) border-2 border-b-4 border-border bg-surface px-4 py-2.5 text-sm font-extrabold text-foreground transition-all hover:border-primary/40 active:translate-y-[2px] active:border-b-2"
					>
						Đóng
					</button>
				</div>
			</div>
		</div>,
		document.body,
	)
}

function snapMonday(d: Date): Date {
	const r = new Date(d)
	const dow = r.getDay()
	r.setDate(r.getDate() + (dow === 0 ? -6 : 1 - dow))
	r.setHours(0, 0, 0, 0)
	return r
}

function fmtClock(d: Date): string {
	return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function pad(n: number): string {
	return String(n).padStart(2, "0")
}
