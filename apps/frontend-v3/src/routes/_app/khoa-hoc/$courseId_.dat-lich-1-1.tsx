import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Header } from "#/components/Header"
import { Icon, StaticIcon } from "#/components/Icon"
import { Loading } from "#/components/Loading"
import { SlotGrid } from "#/features/booking/components/SlotGrid"
import { BOOKING_COIN_COST, bookingPageQuery, bookSlotMock, seedTeacher } from "#/features/booking/queries"
import type { BookingPageData, BookingSlot, BookingTeacher } from "#/features/booking/types"
import { courseDetailQuery } from "#/features/course/queries"
import { walletBalanceQuery } from "#/features/wallet/queries"
import type { WalletBalance } from "#/features/wallet/types"
import { useToast } from "#/lib/toast"
import { cn, formatDate, formatVnDate } from "#/lib/utils"

export const Route = createFileRoute("/_app/khoa-hoc/$courseId_/dat-lich-1-1")({
	component: BookingPage,
})

type FireworkColor = "primary" | "coin" | "success" | "warning"
interface FireworkParticle {
	angle: number
	dist: number
	delay: number
	size: number
	color: FireworkColor
}
const FIREWORK_PARTICLES: FireworkParticle[] = [
	{ angle: 0, dist: 110, delay: 80, size: 8, color: "primary" },
	{ angle: 30, dist: 95, delay: 160, size: 6, color: "coin" },
	{ angle: 60, dist: 120, delay: 40, size: 7, color: "success" },
	{ angle: 90, dist: 100, delay: 200, size: 8, color: "warning" },
	{ angle: 120, dist: 115, delay: 100, size: 6, color: "primary" },
	{ angle: 150, dist: 90, delay: 180, size: 7, color: "coin" },
	{ angle: 180, dist: 110, delay: 60, size: 8, color: "success" },
	{ angle: 210, dist: 100, delay: 220, size: 6, color: "warning" },
	{ angle: 240, dist: 120, delay: 120, size: 7, color: "primary" },
	{ angle: 270, dist: 95, delay: 40, size: 8, color: "coin" },
	{ angle: 300, dist: 105, delay: 200, size: 6, color: "success" },
	{ angle: 330, dist: 115, delay: 140, size: 7, color: "warning" },
]

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
	const [viewing, setViewing] = useState<BookingSlot | null>(null)
	const { data: walletData } = useQuery(walletBalanceQuery)
	const balance = walletData?.data.balance ?? null
	const insufficient = balance !== null && balance < BOOKING_COIN_COST

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
			queryClient.setQueryData(["wallet", "balance"], (prev: { data: WalletBalance } | undefined) => {
				if (!prev) return prev
				return {
					data: {
						...prev.data,
						balance: Math.max(0, prev.data.balance - BOOKING_COIN_COST),
						last_transaction_at: new Date().toISOString(),
					},
				}
			})
			useToast.getState().add(`Đã trừ ${BOOKING_COIN_COST} xu cho buổi học 1-1`, "success")
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
				<div className="inline-flex items-center gap-1.5">
					<WeekButton
						label="Tuần trước"
						icon="back"
						onClick={() => setWeekOffset(weekOffset - 1)}
						disabled={weekOffset <= -1}
					/>
					<button
						type="button"
						onClick={() => setWeekOffset(0)}
						disabled={weekOffset === 0}
						className={cn(
							"min-w-[96px] px-4 h-9 rounded-full text-xs font-extrabold uppercase tracking-wider transition-colors",
							weekOffset === 0
								? "bg-primary-tint text-primary-dark cursor-default"
								: "bg-surface text-muted hover:text-foreground hover:bg-background border-2 border-border",
						)}
					>
						{weekOffset === 0 ? "Tuần này" : "Về tuần này"}
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

			<SlotGrid
				slots={data.slots}
				weekStartMs={weekStartMs}
				onSelect={(slot) => {
					if (slot.status === "booked_me") setViewing(slot)
					else setPending(slot)
				}}
			/>

			<ConfirmBookingDialog
				slot={pending}
				teacher={data.teacher}
				isLoading={mutation.isPending}
				balance={balance}
				insufficient={insufficient}
				onCancel={() => !mutation.isPending && setPending(null)}
				onConfirm={() => pending && !insufficient && mutation.mutate(pending)}
			/>

			<SuccessPopup slot={success} teacher={data.teacher} onClose={() => setSuccess(null)} />

			<BookedDetailDialog slot={viewing} teacher={data.teacher} onClose={() => setViewing(null)} />
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
				"inline-flex size-9 items-center justify-center rounded-full bg-surface border-2 border-border text-muted transition-colors hover:text-foreground hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-surface",
			)}
		>
			<Icon name={icon} size="xs" className="h-3.5 w-auto" />
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
		<div className="card p-5 flex items-center gap-4">
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
					"inline-flex items-center gap-1.5 rounded-full border-2 border-b-4 px-3 py-1 text-xs font-extrabold shrink-0",
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
	balance,
	insufficient,
	onCancel,
	onConfirm,
}: {
	slot: BookingSlot | null
	teacher: BookingTeacher
	isLoading: boolean
	balance: number | null
	insufficient: boolean
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

	const [confirming, setConfirming] = useState(false)

	useEffect(() => {
		if (!slot) setConfirming(false)
	}, [slot])

	useEffect(() => {
		if (!confirming) return
		const t = setTimeout(() => setConfirming(false), 4000)
		return () => clearTimeout(t)
	}, [confirming])

	if (!slot || typeof document === "undefined") return null
	const start = new Date(slot.starts_at)
	const end = new Date(start.getTime() + slot.duration_minutes * 60 * 1000)
	const remaining = balance !== null ? Math.max(0, balance - BOOKING_COIN_COST) : null

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
					{/* Coin chip — gamification pattern: bg-coin-tint + border-coin/40 border-b-4 */}
					<div className="rounded-(--radius-card) border-2 border-b-4 border-coin/40 bg-coin-tint px-4 py-3.5 flex items-center justify-between gap-4">
						<div className="flex items-center gap-3 min-w-0">
							<span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-background border-2 border-coin/50">
								<StaticIcon name="coin-md" size="md" className="h-6 w-auto" />
							</span>
							<div className="leading-tight min-w-0">
								<p className="text-[10px] font-extrabold uppercase tracking-wider text-coin-dark/70">
									Trừ vào ví
								</p>
								<p className="text-xl font-extrabold tabular-nums text-coin-dark">
									−{BOOKING_COIN_COST}
									<span className="ml-1 text-sm font-extrabold text-coin-dark/60">xu</span>
								</p>
							</div>
						</div>
						<div className="text-right leading-tight">
							<p className="text-[10px] font-extrabold uppercase tracking-wider text-coin-dark/70">
								Số dư còn
							</p>
							<p
								className={cn(
									"text-base font-extrabold tabular-nums",
									insufficient ? "text-destructive" : "text-coin-dark",
								)}
							>
								{remaining !== null ? remaining : "—"}
								<span className="ml-1 text-xs text-coin-dark/60">xu</span>
							</p>
						</div>
					</div>
					{insufficient && (
						<p className="px-1 text-xs font-extrabold leading-relaxed text-destructive">
							Số dư không đủ — vui lòng nạp thêm xu để đặt buổi học này.
						</p>
					)}
					<div className="flex gap-2.5 pt-1">
						<button
							type="button"
							onClick={onCancel}
							disabled={isLoading}
							className="flex-1 rounded-(--radius-button) border-2 border-border bg-surface px-5 py-2.5 text-sm font-extrabold uppercase tracking-tight text-foreground transition-all shadow-[0_4px_0_var(--color-border)] hover:border-primary/40 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-border)] disabled:opacity-60"
						>
							Huỷ
						</button>
						<button
							type="button"
							onClick={() => {
								if (insufficient || isLoading) return
								if (!confirming) {
									setConfirming(true)
									return
								}
								onConfirm()
							}}
							disabled={isLoading || insufficient}
							className={cn(
								"btn flex-1 text-sm disabled:cursor-not-allowed disabled:opacity-60",
								confirming ? "btn-coin" : "btn-primary",
							)}
						>
							{isLoading
								? "Đang đặt…"
								: insufficient
									? "Không đủ xu"
									: confirming
										? "Bấm lại để xác nhận"
										: "Đặt buổi học"}
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
					<div className="relative flex h-32 w-32 items-center justify-center">
						{/* Pulse rings */}
						<span
							aria-hidden
							className="absolute inset-0 rounded-full bg-success/25 animate-[coinPulseRing_900ms_ease-out_forwards]"
						/>
						<span
							aria-hidden
							className="absolute inset-0 rounded-full bg-primary/15 animate-[coinPulseRing_900ms_ease-out_220ms_forwards]"
						/>
						{/* Firework burst particles */}
						{FIREWORK_PARTICLES.map((p) => (
							<span
								key={`${p.angle}-${p.color}`}
								aria-hidden
								className="pointer-events-none absolute left-1/2 top-1/2"
								style={
									{
										"--angle": `${p.angle}deg`,
										"--dist": `${p.dist}px`,
										animation: "coinBurst 1100ms ease-out forwards",
										animationDelay: `${p.delay}ms`,
									} as React.CSSProperties
								}
							>
								<span
									className={cn(
										"block rounded-full",
										p.color === "primary" && "bg-primary",
										p.color === "coin" && "bg-coin",
										p.color === "success" && "bg-success",
										p.color === "warning" && "bg-warning",
									)}
									style={{ width: p.size, height: p.size }}
								/>
							</span>
						))}
						{/* Avatar core */}
						<div className="relative size-24 rounded-full bg-success/15 border-2 border-b-4 border-success/40 flex items-center justify-center animate-[popIn_500ms_cubic-bezier(0.34,1.56,0.64,1)]">
							<StaticIcon name="avatar-nodding" size="xl" className="h-16 w-auto" />
							<span className="absolute -top-2 -right-2 inline-flex items-center justify-center size-9 rounded-full bg-success border-2 border-b-4 border-primary-dark text-white animate-[popIn_500ms_cubic-bezier(0.34,1.56,0.64,1)_220ms_both]">
								<Icon name="check" size="sm" className="text-white" />
							</span>
						</div>
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

function BookedDetailDialog({
	slot,
	teacher,
	onClose,
}: {
	slot: BookingSlot | null
	teacher: BookingTeacher
	onClose: () => void
}) {
	useEffect(() => {
		if (!slot) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose()
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [slot, onClose])

	if (!slot || typeof document === "undefined") return null
	const start = new Date(slot.starts_at)
	const end = new Date(start.getTime() + slot.duration_minutes * 60 * 1000)
	const now = Date.now()
	const startsInMs = start.getTime() - now
	const startsInHours = Math.round(startsInMs / (60 * 60 * 1000))
	const countdown =
		startsInMs <= 0
			? "Buổi học đang/đã diễn ra"
			: startsInHours < 24
				? `Còn ${startsInHours} giờ nữa`
				: `Còn ${Math.round(startsInHours / 24)} ngày nữa`

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-6">
			<button
				type="button"
				aria-label="Đóng"
				onClick={onClose}
				className="absolute inset-0 bg-foreground/45 backdrop-blur-sm"
			/>
			<div className="relative w-full max-w-md rounded-(--radius-card) border-2 border-b-4 border-border bg-card overflow-hidden animate-[popIn_400ms_cubic-bezier(0.34,1.56,0.64,1)]">
				<div className="bg-gradient-to-b from-success/15 to-transparent px-7 pt-6 pb-5">
					<p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-success">
						Buổi học đã đặt
					</p>
					<h2 className="mt-2 text-lg font-extrabold text-foreground leading-snug">
						Học 1-1 với {teacher.full_name}
					</h2>
					<p className="mt-1.5 text-xs font-bold text-muted">{countdown}</p>
				</div>
				<div className="px-7 pb-6 pt-2 space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<InfoTile label="Ngày" value={formatVnDate(slot.starts_at)} />
						<InfoTile label="Thời gian" value={`${fmtClock(start)}–${fmtClock(end)}`} />
					</div>
					{slot.meet_url ? (
						<a
							href={slot.meet_url}
							target="_blank"
							rel="noreferrer"
							className="btn btn-primary w-full py-3 text-sm"
						>
							<Icon name="play" size="xs" className="text-white" />
							Mở Google Meet
						</a>
					) : (
						<div className="rounded-(--radius-button) border-2 border-dashed border-border bg-surface px-3 py-2.5 text-xs font-bold text-muted text-center">
							Link Google Meet sẽ hiện ở đây trước giờ học.
						</div>
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
