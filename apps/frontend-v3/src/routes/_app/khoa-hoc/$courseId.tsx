import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { DuoProgressBar } from "#/components/DuoProgressBar"
import { Header } from "#/components/Header"
import { Icon, type IconName, StaticIcon } from "#/components/Icon"
import { SupportFab } from "#/components/SupportFab"
import { cancelEnrollmentOrder } from "#/features/course/actions"
import { EnrollDialog } from "#/features/course/components/EnrollDialog"
import { EnrollSuccessPopup } from "#/features/course/components/EnrollSuccessPopup"
import { courseDetailQuery } from "#/features/course/queries"
import {
	COURSE_LEVEL_LABELS,
	type CommitmentStatus,
	type CourseScheduleItem,
	type CourseTeacher,
	type CourseWithRelations,
} from "#/features/course/types"
import { cn, formatDate, formatNumber, formatVnd, isSameDay, safeExternalUrl } from "#/lib/utils"

export const Route = createFileRoute("/_app/khoa-hoc/$courseId")({
	validateSearch: (s: Record<string, unknown>) => ({
		cancel_order: typeof s.cancel_order === "string" ? s.cancel_order : undefined,
	}),
	component: CourseDetailPage,
})

function CourseDetailPage() {
	const { courseId } = Route.useParams()
	const { cancel_order } = Route.useSearch()
	const queryClient = useQueryClient()
	const handledCancelOrder = useRef<string | null>(null)
	const previousEnrolledRef = useRef<boolean | null>(null)
	const [enrollSuccessOpen, setEnrollSuccessOpen] = useState(false)
	const { data, isLoading } = useQuery(courseDetailQuery(courseId))
	const currentEnrolled = data?.data.commitment
		? data.data.commitment.phase !== "not_enrolled"
		: data
			? false
			: null
	const cancelOrder = useMutation({
		mutationFn: cancelEnrollmentOrder,
		onSettled: async () => {
			await queryClient.invalidateQueries({ queryKey: ["courses"] })
			window.history.replaceState(null, "", window.location.pathname)
		},
	})

	useEffect(() => {
		if (!cancel_order || handledCancelOrder.current === cancel_order) return
		handledCancelOrder.current = cancel_order
		cancelOrder.mutate(cancel_order)
	}, [cancel_order, cancelOrder])

	useEffect(() => {
		const refetchCourse = () => {
			void queryClient.invalidateQueries({ queryKey: ["courses"] })
			void queryClient.invalidateQueries({ queryKey: ["courses", courseId] })
		}
		window.addEventListener("focus", refetchCourse)
		return () => window.removeEventListener("focus", refetchCourse)
	}, [courseId, queryClient])

	useEffect(() => {
		if (currentEnrolled === null) return
		const previous = previousEnrolledRef.current
		previousEnrolledRef.current = currentEnrolled
		if (previous === false && currentEnrolled) setEnrollSuccessOpen(true)
	}, [currentEnrolled])

	if (isLoading || !data) {
		return (
			<>
				<Header title="Khóa học" backTo="/khoa-hoc" />
				<div className="px-10 pb-12">
					<div className="card h-64 animate-pulse bg-surface" />
				</div>
			</>
		)
	}

	const { course, sold_slots, commitment } = data.data
	const enrolled = commitment !== null && commitment.phase !== "not_enrolled"
	const remaining = course.max_slots - sold_slots
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const expired = new Date(course.end_date).getTime() < today.getTime()

	return (
		<>
			<Header title={course.title} backTo="/khoa-hoc" />
			<div className="px-10 pb-12 space-y-6 max-w-5xl mx-auto w-full">
				<div className="card p-6">
					<div className="grid gap-6 md:grid-cols-[1fr_minmax(260px,300px)]">
						<CourseInfo
							course={course}
							sold_slots={sold_slots}
							enrolled={enrolled}
							remaining={remaining}
							expired={expired}
						/>
						{enrolled ? (
							<EnrolledCard courseId={courseId} livestreamUrl={course.livestream_url} expired={expired} />
						) : expired ? (
							<ExpiredCard endDate={course.end_date} />
						) : (
							<EnrollCard course={course} remaining={remaining} />
						)}
					</div>
				</div>

				{commitment && commitment.phase !== "not_enrolled" && (
					<CommitmentCard commitment={commitment} courseId={courseId} />
				)}

				{course.description && (
					<div className="card p-6">
						<p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Mô tả</p>
						<p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
							{course.description}
						</p>
					</div>
				)}

				{course.schedule_items.length > 0 && (
					<ScheduleCard
						items={course.schedule_items}
						livestreamUrl={enrolled ? safeExternalUrl(course.livestream_url) : null}
					/>
				)}

				{course.teacher && <TeacherCard teacher={course.teacher} />}
			</div>
			<SupportFab />
			<EnrollSuccessPopup
				open={enrollSuccessOpen}
				courseTitle={course.title}
				bonusCoins={course.bonus_coins}
				onClose={() => setEnrollSuccessOpen(false)}
			/>
		</>
	)
}

function TeacherCard({ teacher }: { teacher: CourseTeacher }) {
	const initials = teacher.full_name
		.split(/\s+/)
		.map((w) => w[0])
		.join("")
		.slice(-2)
		.toUpperCase()

	return (
		<div className="card p-6">
			<p className="text-xs font-bold uppercase tracking-wide text-muted mb-4">Giáo viên phụ trách</p>
			<div className="flex items-center gap-4">
				<div className="size-14 shrink-0 rounded-full bg-primary-tint flex items-center justify-center font-extrabold text-primary">
					{initials}
				</div>
				<div className="flex-1 min-w-0 space-y-1.5">
					<p className="font-bold text-foreground">{teacher.full_name}</p>
					{teacher.title && (
						<p className="text-sm flex items-center gap-1.5 text-foreground">
							<Icon name="graduation" size="xs" className="text-muted shrink-0" />
							<span className="font-bold">{teacher.title}</span>
						</p>
					)}
					{teacher.bio && <p className="text-sm text-foreground leading-relaxed pt-1">{teacher.bio}</p>}
				</div>
			</div>
		</div>
	)
}

function CourseInfo({
	course,
	sold_slots,
	enrolled,
	remaining,
	expired,
}: {
	course: CourseWithRelations
	sold_slots: number
	enrolled: boolean
	remaining: number
	expired: boolean
}) {
	const sessions = course.schedule_items.length
	return (
		<div className="space-y-5 min-w-0">
			<div className="flex items-center gap-2 flex-wrap">
				<span className="inline-flex items-center rounded-full border-2 border-border bg-surface px-2.5 py-0.5 text-xs font-bold text-foreground">
					{COURSE_LEVEL_LABELS[course.target_level] ?? course.target_level}
				</span>
				{expired ? (
					<span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-border text-muted">
						Đã kết thúc
					</span>
				) : (
					<>
						{enrolled && (
							<span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-success/10 text-success">
								Đã đăng ký
							</span>
						)}
						{!enrolled && remaining <= 5 && remaining > 0 && (
							<span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-warning/10 text-warning">
								Còn {remaining} chỗ
							</span>
						)}
						{!enrolled && remaining <= 0 && (
							<span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-border text-muted">
								Đã đầy
							</span>
						)}
					</>
				)}
			</div>

			<div>
				<h1 className="font-extrabold text-2xl text-foreground leading-tight">{course.title}</h1>
				{course.target_exam_school && (
					<p className="text-sm text-muted mt-1.5">{course.target_exam_school}</p>
				)}
			</div>

			<ul className="space-y-2 text-sm text-foreground">
				<li className="flex items-center gap-2">
					<Icon name="target" size="xs" className="text-muted shrink-0" />
					<span>
						<span className="font-bold tabular-nums">{formatDate(course.start_date)}</span>
						<span className="text-muted"> — </span>
						<span className="font-bold tabular-nums">{formatDate(course.end_date)}</span>
					</span>
				</li>
				{course.teacher && (
					<li className="flex items-center gap-2">
						<Icon name="graduation" size="xs" className="text-muted shrink-0" />
						<span>
							<span className="text-muted">Giáo viên: </span>
							<span className="font-bold">{course.teacher.full_name}</span>
						</span>
					</li>
				)}
				{sessions > 0 && (
					<li className="flex items-center gap-2">
						<Icon name="timer" size="xs" className="text-muted shrink-0" />
						<span>
							<span className="font-bold tabular-nums">{sessions}</span>
							<span> buổi</span>
						</span>
					</li>
				)}
				<li className="space-y-1.5">
					<div className="flex items-center gap-2">
						<StaticIcon name="avatar-nodding" size="sm" className="h-5 w-auto shrink-0" />
						<span>
							<span className="font-bold tabular-nums">{sold_slots}</span>
							<span className="font-bold">/{course.max_slots}</span>
							<span className="text-muted"> học viên</span>
						</span>
					</div>
					<DuoProgressBar
						value={Math.min(100, Math.round((sold_slots / course.max_slots) * 100))}
						tone={remaining <= 5 ? "warning" : "primary"}
						heightPx={10}
						label="Tỉ lệ ghế đã đăng ký"
					/>
				</li>
				<li className="flex items-center gap-2">
					<Icon name="clipboard" size="xs" className="text-muted shrink-0" />
					<span>
						<span className="text-muted">Cam kết </span>
						<span className="font-bold tabular-nums">{course.required_full_tests}</span>
						<span> bài thi trong </span>
						<span className="font-bold tabular-nums">{course.commitment_window_days}</span>
						<span> ngày</span>
					</span>
				</li>
			</ul>
		</div>
	)
}

function EnrollCard({ course, remaining }: { course: CourseWithRelations; remaining: number }) {
	const [dialogOpen, setDialogOpen] = useState(false)

	const orig = course.original_price_vnd
	const hasDiscount = orig !== null && orig > course.price_vnd
	const discountPct = hasDiscount ? Math.round((1 - course.price_vnd / orig) * 100) : 0
	const full = remaining <= 0

	return (
		<aside className="rounded-2xl border-2 border-border bg-surface p-5 space-y-4 self-start">
			<p className="text-xs font-bold uppercase tracking-wider text-muted text-center">Học phí</p>

			<div className="text-center space-y-1">
				{hasDiscount && (
					<div className="flex items-center justify-center gap-2">
						<span className="text-sm text-muted line-through tabular-nums">{formatVnd(orig)}</span>
						<span className="text-xs font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
							-{discountPct}%
						</span>
					</div>
				)}
				<p className="text-2xl font-extrabold text-foreground tabular-nums leading-none">
					{formatVnd(course.price_vnd)}
				</p>
				{hasDiscount && (
					<p className="text-xs font-bold text-success">Tiết kiệm {formatVnd(orig - course.price_vnd)}</p>
				)}
			</div>

			{course.bonus_coins > 0 && (
				<div className="flex justify-center">
					<span className="inline-flex items-center gap-1 rounded-full bg-coin-tint px-2.5 py-1 text-xs font-bold text-coin-dark">
						<StaticIcon name="coin" size="xs" className="h-3.5 w-auto" />
						Tặng kèm {formatNumber(course.bonus_coins)} xu
					</span>
				</div>
			)}

			<button
				type="button"
				disabled={full}
				onClick={() => setDialogOpen(true)}
				className="btn btn-primary w-full py-3 text-sm font-bold disabled:opacity-50"
			>
				{full ? "Đã đầy" : "Đăng ký khóa học"}
			</button>

			{!full && remaining <= 5 && (
				<p className="text-xs font-bold text-warning text-center">Chỉ còn {remaining} chỗ cuối</p>
			)}

			<EnrollDialog open={dialogOpen} onClose={() => setDialogOpen(false)} course={course} />
		</aside>
	)
}

function EnrolledCard({
	courseId,
	livestreamUrl,
	expired,
}: {
	courseId: string
	livestreamUrl: string | null
	expired: boolean
}) {
	const safeLivestream = safeExternalUrl(livestreamUrl)
	if (expired) {
		return (
			<aside className="rounded-2xl border-2 border-border bg-surface p-5 flex flex-col gap-3 self-center text-center">
				<p className="text-xs font-bold uppercase tracking-wider text-muted">Khóa đã kết thúc</p>
				<p className="text-sm text-foreground leading-relaxed">
					Bạn vẫn có thể xem lại tài liệu và lịch học của khóa này.
				</p>
			</aside>
		)
	}
	return (
		<aside className="rounded-2xl border-2 border-success/30 bg-success/5 p-5 flex flex-col gap-4 self-center">
			<p className="text-xs font-bold uppercase tracking-wider text-success text-center">Đã đăng ký</p>
			<p className="text-sm text-foreground text-center leading-relaxed">
				Khóa học đã sẵn sàng. Vào lớp đúng giờ để không bỏ lỡ buổi học.
			</p>
			{safeLivestream && (
				<a
					href={safeLivestream}
					target="_blank"
					rel="noreferrer"
					className="btn btn-primary w-full py-3 text-sm font-bold inline-flex items-center justify-center"
				>
					Vào Meet
				</a>
			)}
			<Link
				to="/khoa-hoc/$courseId/dat-lich-1-1"
				params={{ courseId }}
				className="w-full inline-flex items-center justify-center gap-2 rounded-(--radius-button) border-2 border-b-4 border-primary/30 bg-primary-tint px-4 py-2.5 text-sm font-extrabold text-primary-dark transition-all hover:-translate-y-0.5 hover:bg-primary-tint/80 active:translate-y-0 active:border-b-2"
			>
				<Icon name="graduation" size="xs" />
				Đặt lịch 1-1 với giảng viên
			</Link>
		</aside>
	)
}

function ExpiredCard({ endDate }: { endDate: string }) {
	return (
		<aside className="rounded-2xl border-2 border-border bg-surface p-5 flex flex-col gap-3 self-start text-center">
			<p className="text-xs font-bold uppercase tracking-wider text-muted">Đã kết thúc</p>
			<p className="text-sm text-foreground leading-relaxed">
				Khóa học đã kết thúc ngày <span className="font-extrabold tabular-nums">{formatDate(endDate)}</span>{" "}
				và không còn mở ghi danh.
			</p>
			<Link
				to="/khoa-hoc"
				search={{ tab: "explore" }}
				className="btn btn-secondary w-full py-3 text-sm font-bold"
			>
				Xem khóa khác
			</Link>
		</aside>
	)
}

function CommitmentCard({ commitment, courseId }: { commitment: CommitmentStatus; courseId: string }) {
	const met = commitment.phase === "met"
	const violated = commitment.phase === "violated"

	// Dismiss persistent qua localStorage theo courseId: khi user đã ăn mừng cam kết
	// xong, không cần thấy lại card này mỗi lần vào course. Chỉ áp khi met (pending
	// hay violated thì luôn cần thấy để hành động).
	const storageKey = `commitment-dismissed:${courseId}`
	const [dismissed, setDismissed] = useState<boolean>(() => {
		if (typeof window === "undefined") return false
		return window.localStorage.getItem(storageKey) === "1"
	})
	const [dismissing, setDismissing] = useState(false)

	function handleDismiss(e: React.MouseEvent) {
		// Chip nằm trong <Link> → phải chặn navigate trước khi bắt đầu animation.
		e.preventDefault()
		e.stopPropagation()
		if (dismissing) return
		setDismissing(true)
		// Khớp duration 600ms của keyframe cardDismiss bên dưới.
		window.setTimeout(() => {
			window.localStorage.setItem(storageKey, "1")
			setDismissed(true)
		}, 600)
	}

	if (met && dismissed) return null

	const pct =
		commitment.required > 0
			? Math.min(100, Math.round((commitment.completed / commitment.required) * 100))
			: 0

	const deadlineMs = commitment.deadline_at ? new Date(commitment.deadline_at).getTime() : null
	const daysLeft = deadlineMs !== null ? Math.ceil((deadlineMs - Date.now()) / (1000 * 60 * 60 * 24)) : null
	const urgent = !met && !violated && daysLeft !== null && daysLeft <= 3

	// Card border: "card" class đã có border-2 border-b-4 — không thêm border class riêng.
	const progressTone: "primary" | "warning" | "muted" = met ? "primary" : violated ? "muted" : "warning"

	return (
		<div
			style={{
				display: "grid",
				gridTemplateRows: dismissing ? "0fr" : "1fr",
				transition: "grid-template-rows 550ms cubic-bezier(0.4, 0, 0.2, 1)",
			}}
		>
			<div style={{ overflow: "hidden", minHeight: 0 }}>
				<div
					className="card block p-6"
					style={
						dismissing
							? {
									animation: "cardDismiss 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
									pointerEvents: "none",
								}
							: undefined
					}
				>
					<div className="space-y-3">
						<div className="flex items-start justify-between gap-3 flex-wrap">
							<div className="min-w-0">
								<p className="text-xs font-bold uppercase tracking-wider text-muted">Cam kết kỷ luật</p>
								<p className="font-extrabold text-foreground text-2xl leading-none mt-1.5">
									<span className="tabular-nums">{commitment.completed}</span>
									<span className="text-muted">/</span>
									<span className="tabular-nums">{commitment.required}</span>
									<span className="text-muted text-sm font-bold ml-1.5">bài thi full-test</span>
								</p>
							</div>

							{met ? (
								<button
									type="button"
									onClick={handleDismiss}
									title="Bấm để ẩn cam kết đã hoàn thành"
									className="shrink-0 btn btn-secondary text-xs py-1.5 px-3 uppercase tracking-wider"
								>
									<Icon name="check" size="xs" className="h-3 w-auto" />
									Hoàn thành
								</button>
							) : violated ? (
								<span className="shrink-0 inline-flex items-center rounded-(--radius-button) border border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive/70">
									Đã quá hạn
								</span>
							) : (
								<Link
									to="/thi-thu"
									className="shrink-0 btn btn-primary text-xs py-1.5 px-3 uppercase tracking-wider"
								>
									<Icon name="play" size="xs" className="text-white h-3 w-auto" />
									Vào phòng thi
								</Link>
							)}
						</div>

						<DuoProgressBar value={pct} tone={progressTone} heightPx={12} label="Tiến độ cam kết kỷ luật" />

						{commitment.deadline_at && (
							<p
								className={cn(
									"text-xs font-bold inline-flex items-center gap-1.5",
									violated ? "text-destructive/70" : urgent ? "text-warning" : "text-muted",
								)}
							>
								<Icon name="timer" size="xs" />
								<span>
									Hạn chót: <span className="tabular-nums">{formatDate(commitment.deadline_at)}</span>
									{!met && !violated && daysLeft !== null && (
										<span className="ml-1">
											(còn <span className="tabular-nums">{Math.max(0, daysLeft)}</span> ngày)
										</span>
									)}
								</span>
							</p>
						)}
					</div>

					<p className="text-sm text-foreground leading-relaxed mt-4">
						{met ? (
							<span className="font-bold text-primary-dark">
								Bạn đã hoàn thành cam kết — tiếp tục luyện đề để giữ phong độ.
							</span>
						) : violated ? (
							<span>
								Cam kết đã <span className="font-bold text-destructive/80">vi phạm</span> — bạn chưa hoàn
								thành đủ {commitment.required} bài full-test trong hạn. Liên hệ giáo viên để được hỗ trợ.
							</span>
						) : (
							<>
								Bạn cần hoàn thành{" "}
								<span className="font-extrabold tabular-nums">
									{Math.max(1, commitment.required - commitment.completed)}
								</span>{" "}
								bài full-test còn lại
								{daysLeft !== null && daysLeft >= 0 && (
									<>
										{" "}
										trong <span className="font-extrabold tabular-nums text-warning">{daysLeft}</span> ngày
										tới
									</>
								)}
								. Bấm vào nút <span className="font-bold text-primary-dark">Vào phòng thi</span> để bắt đầu.
							</>
						)}
					</p>
				</div>
			</div>
		</div>
	)
}

function ScheduleCard({
	items,
	livestreamUrl,
}: {
	items: CourseScheduleItem[]
	livestreamUrl: string | null
}) {
	const [selected, setSelected] = useState<CourseScheduleItem | null>(null)
	const weeks = buildWeeks(items)
	const now = Date.now()
	const DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const

	return (
		<div className="card p-6">
			<div className="flex items-center justify-between mb-4">
				<p className="text-xs font-bold uppercase tracking-wide text-muted">Lịch học chi tiết</p>
				<p className="text-xs text-muted">{items.length} buổi</p>
			</div>
			<div className="overflow-hidden rounded-xl border-2 border-border">
				<div className="grid grid-cols-7 border-b-2 border-border bg-surface text-center">
					{DAYS.map((d) => (
						<div key={d} className="py-2 text-xs font-bold uppercase tracking-wider text-muted">
							{d}
						</div>
					))}
				</div>
				<div className="grid grid-cols-7 divide-x-2 divide-y-2 divide-border">
					{weeks.flat().map((cell) => (
						<DayCell key={cell.dateISO} cell={cell} now={now} onSelect={setSelected} />
					))}
				</div>
			</div>
			<SessionDetailDialog
				item={selected}
				now={now}
				livestreamUrl={livestreamUrl}
				onClose={() => setSelected(null)}
			/>
		</div>
	)
}

function SessionDetailDialog({
	item,
	now,
	livestreamUrl,
	onClose,
}: {
	item: CourseScheduleItem | null
	now: number
	livestreamUrl: string | null
	onClose: () => void
}) {
	useEffect(() => {
		if (!item) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose()
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [item, onClose])

	if (!item || typeof document === "undefined") return null

	const cellTime = new Date(item.date).getTime()
	const today = isSameDay(cellTime, now)
	const past = !today && cellTime < now

	const stateIcon: IconName = today ? "play" : past ? "check" : "timer"
	const iconBlock = today
		? "bg-primary border-primary-dark text-white"
		: past
			? "bg-border-light border-border text-muted"
			: "bg-primary-tint border-primary/40 text-primary"

	const chip = today
		? "bg-primary border-primary-dark text-white"
		: past
			? "bg-border-light border-border text-muted"
			: "bg-primary-tint border-primary/40 text-primary-dark"
	const chipLabel = today ? "Hôm nay" : past ? "Đã qua" : "Sắp tới"

	const bannerGradient = today
		? "from-primary-tint to-transparent"
		: past
			? "from-border-light to-transparent"
			: "from-primary-tint/60 to-transparent"

	const showMeet = livestreamUrl !== null && !past

	return createPortal(
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_220ms_ease-out]"
			role="dialog"
			aria-modal="true"
			aria-label="Chi tiết buổi học"
		>
			<button type="button" aria-label="Đóng" onClick={onClose} className="absolute inset-0" />
			<div className="card relative w-full max-w-md overflow-hidden animate-[popIn_400ms_cubic-bezier(0.34,1.56,0.64,1)]">
				<button
					type="button"
					onClick={onClose}
					aria-label="Đóng"
					className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground"
				>
					<Icon name="close" size="xs" />
				</button>

				<div className={cn("relative bg-gradient-to-b px-7 pb-5 pt-7", bannerGradient)}>
					<p
						className={cn(
							"text-[11px] font-extrabold uppercase tracking-[0.18em]",
							past ? "text-muted" : "text-primary-dark",
						)}
					>
						Lịch học chi tiết
					</p>

					<div className="mt-3 flex items-start gap-3.5">
						<div
							className={cn(
								"size-14 shrink-0 rounded-2xl border-2 border-b-4 flex items-center justify-center",
								iconBlock,
							)}
						>
							<Icon name={stateIcon} size="md" />
						</div>

						<div className="flex-1 min-w-0 space-y-1.5">
							<div className="flex items-center gap-2 flex-wrap">
								<span className="text-xs font-extrabold uppercase tracking-wider tabular-nums text-foreground">
									Buổi {pad(item.session_number)}
								</span>
								<span
									className={cn(
										"inline-flex items-center rounded-full border-2 border-b-4 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider",
										chip,
									)}
								>
									{chipLabel}
								</span>
							</div>
							<h2 className="text-lg font-extrabold text-foreground leading-snug">{item.topic}</h2>
						</div>
					</div>
				</div>

				<div className="space-y-4 px-7 pb-6 pt-2">
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1 rounded-(--radius-card) border-2 border-dashed border-border bg-background px-3.5 py-3">
							<p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Ngày học</p>
							<p className="text-sm font-extrabold tabular-nums">{formatDate(item.date)}</p>
						</div>
						<div className="space-y-1 rounded-(--radius-card) border-2 border-dashed border-border bg-background px-3.5 py-3">
							<p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Thời gian</p>
							<p className="text-sm font-extrabold tabular-nums">
								{fmtTime(item.start_time)}–{fmtTime(item.end_time)}
							</p>
						</div>
					</div>

					{showMeet && livestreamUrl !== null && (
						<a
							href={livestreamUrl}
							target="_blank"
							rel="noreferrer"
							className="btn btn-primary w-full py-3 text-sm"
						>
							<Icon name="play" size="xs" className="text-white" />
							{today ? "Vào lớp Meet ngay" : "Mở link Meet"}
						</a>
					)}

					{today && (
						<p className="text-center text-xs font-bold text-primary-dark">
							Buổi học đang diễn ra — vào lớp đúng giờ để không bỏ lỡ.
						</p>
					)}

					{past && (
						<p className="text-center text-xs text-muted">
							Buổi học đã kết thúc. Bạn có thể xem lại nội dung trong tài liệu khóa học.
						</p>
					)}
				</div>
			</div>
		</div>,
		document.body,
	)
}

interface CellData {
	dateISO: string
	day: number
	item: CourseScheduleItem | null
}

function DayCell({
	cell,
	now,
	onSelect,
}: {
	cell: CellData
	now: number
	onSelect: (item: CourseScheduleItem) => void
}) {
	const cellTime = new Date(cell.dateISO).getTime()
	const today = isSameDay(cellTime, now)
	const past = !today && cellTime < now

	if (!cell.item) {
		return (
			<div className="min-h-24 p-2 text-right">
				<span className="text-xs text-muted/40 tabular-nums">{pad(cell.day)}</span>
			</div>
		)
	}

	const s = cell.item
	return (
		<button
			type="button"
			onClick={() => onSelect(s)}
			className={cn(
				"min-h-24 p-2 text-left transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset cursor-pointer",
				past && "schedule-cell-past bg-surface opacity-70",
				today && "bg-primary/15 ring-2 ring-primary ring-inset",
				!past && !today && "schedule-cell-future bg-primary/5",
			)}
		>
			<div className="flex items-baseline justify-between">
				<span
					className={cn(
						"text-xs font-bold uppercase tabular-nums",
						past ? "text-muted line-through" : "text-primary",
					)}
				>
					{today ? "Hôm nay" : `Buổi ${pad(s.session_number)}`}
				</span>
				<span className={cn("text-xs tabular-nums", past ? "text-muted/40" : "text-muted/60")}>
					{pad(cell.day)}
				</span>
			</div>
			<p
				className={cn("mt-1 text-xs font-bold tabular-nums leading-tight", past && "line-through text-muted")}
			>
				{fmtTime(s.start_time)}–{fmtTime(s.end_time)}
			</p>
			<p className={cn("mt-0.5 text-xs leading-tight", past ? "text-muted line-through" : "text-foreground")}>
				{s.topic}
			</p>
		</button>
	)
}

function buildWeeks(items: CourseScheduleItem[]): CellData[][] {
	if (items.length === 0) return []

	const byDate = new Map<string, CourseScheduleItem>()
	for (const s of items) byDate.set(toISO(new Date(s.date)), s)

	const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))
	const first = new Date(sorted[0].date)
	const last = new Date(sorted[sorted.length - 1].date)

	const start = snapMon(first)
	const end = snapSun(last)

	const weeks: CellData[][] = []
	const cur = new Date(start)
	while (cur.getTime() <= end.getTime()) {
		const week: CellData[] = []
		for (let i = 0; i < 7; i++) {
			const iso = toISO(cur)
			week.push({ dateISO: iso, day: cur.getDate(), item: byDate.get(iso) ?? null })
			cur.setDate(cur.getDate() + 1)
		}
		weeks.push(week)
	}
	return weeks
}

function snapMon(d: Date): Date {
	const r = new Date(d)
	const dow = r.getDay()
	r.setDate(r.getDate() + (dow === 0 ? -6 : 1 - dow))
	r.setHours(0, 0, 0, 0)
	return r
}

function snapSun(d: Date): Date {
	const r = new Date(d)
	const dow = r.getDay()
	r.setDate(r.getDate() + (dow === 0 ? 0 : 7 - dow))
	r.setHours(23, 59, 59, 999)
	return r
}

function toISO(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function pad(n: number): string {
	return String(n).padStart(2, "0")
}

function fmtTime(time: string): string {
	return time.slice(0, 5)
}
