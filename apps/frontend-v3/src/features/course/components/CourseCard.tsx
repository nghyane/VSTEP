import { Link } from "@tanstack/react-router"
import { DuoProgressBar } from "#/components/DuoProgressBar"
import { Icon, StaticIcon } from "#/components/Icon"
import {
	COURSE_LEVEL_LABELS,
	type Course,
	type CourseScheduleItem,
	type EnrollmentDetail,
} from "#/features/course/types"
import { cn, formatDate, formatNumber, formatVnd, safeExternalUrl } from "#/lib/utils"

interface Props {
	course: Course
	enrolled: boolean
	enrollment?: EnrollmentDetail | null
}

export function CourseCard({ course, enrolled, enrollment }: Props) {
	if (enrolled) return <EnrolledCard course={course} enrollment={enrollment ?? null} />

	const sold = course.sold_slots
	const remaining = sold !== undefined ? Math.max(0, course.max_slots - sold) : null
	const full = remaining === 0
	const ctaDisabled = full

	const cta = ctaDisabled ? "Chọn khóa khác" : "Xem chi tiết"

	const card = (
		<div className={cn("p-5 flex flex-col gap-4", ctaDisabled ? "card opacity-75" : "card-interactive")}>
			<div className="flex items-center justify-between gap-2">
				<span className="inline-flex items-center rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold text-foreground">
					{COURSE_LEVEL_LABELS[course.target_level] ?? course.target_level}
				</span>
				<SlotBadge full={full} remaining={remaining} />
			</div>

			<div>
				<p className="text-base font-extrabold leading-tight text-foreground">{course.title}</p>
				{course.target_exam_school && <p className="text-xs text-muted mt-1">{course.target_exam_school}</p>}
			</div>

			<MetaRows course={course} sold={sold} />

			<div className="flex items-center justify-between gap-3 mt-auto pt-1">
				<PriceBlock course={course} />
				{ctaDisabled ? (
					<span className="text-xs font-bold text-muted whitespace-nowrap">{cta}</span>
				) : (
					<span className="btn btn-primary text-sm py-2 px-4">{cta}</span>
				)}
			</div>
		</div>
	)

	if (ctaDisabled) return card

	return (
		<Link to="/khoa-hoc/$courseId" params={{ courseId: course.id }} className="block">
			{card}
		</Link>
	)
}

function MetaRows({ course, sold }: { course: Course; sold: number | undefined }) {
	const sessions = course.schedule_items_count
	return (
		<div className="space-y-1.5 text-sm text-foreground">
			<div>
				Khai giảng <span className="font-bold tabular-nums">{formatDate(course.start_date)}</span>
				{sessions !== undefined && <span className="text-muted"> · {sessions} buổi</span>}
			</div>
			{course.teacher && (
				<div>
					Giáo viên: <span className="font-bold">{course.teacher.full_name}</span>
				</div>
			)}
			{sold !== undefined && (
				<div className="space-y-1.5 pt-0.5">
					<div className="flex items-baseline justify-between">
						<span>
							<span className="tabular-nums font-bold">{sold}</span>
							<span className="font-bold">/{course.max_slots}</span>
							<span className="text-muted"> học viên</span>
						</span>
						<SlotProgressLabel sold={sold} max={course.max_slots} />
					</div>
					<DuoProgressBar
						value={slotFillRatio(sold, course.max_slots)}
						tone={slotFillTone(sold, course.max_slots) === "low" ? "primary" : "warning"}
						heightPx={8}
						label="Tỉ lệ ghế đã đăng ký"
					/>
				</div>
			)}
		</div>
	)
}

function slotFillRatio(sold: number, max: number): number {
	if (max <= 0) return 0
	return Math.min(100, Math.round((sold / max) * 100))
}

function slotFillTone(sold: number, max: number): "full" | "high" | "low" {
	const remaining = max - sold
	if (remaining <= 0) return "full"
	if (remaining <= 5) return "high"
	return "low"
}

function SlotProgressLabel({ sold, max }: { sold: number; max: number }) {
	const tone = slotFillTone(sold, max)
	if (tone === "full") return <span className="text-xs font-bold text-subtle">Hết chỗ</span>
	if (tone === "high") return <span className="text-xs font-bold text-warning">Sắp đầy</span>
	const pct = slotFillRatio(sold, max)
	return <span className="text-xs font-bold text-muted tabular-nums">{pct}% đầy</span>
}

function PriceBlock({ course }: { course: Course }) {
	const orig = course.original_price_vnd
	const hasDiscount = orig !== null && orig > course.price_vnd
	const discountPct = hasDiscount ? Math.round((1 - course.price_vnd / orig) * 100) : 0
	return (
		<div>
			{hasDiscount && (
				<div className="flex items-center gap-2 mb-1">
					<span className="text-xs text-muted line-through tabular-nums">{formatVnd(orig)}</span>
					<span className="text-xs font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
						-{discountPct}%
					</span>
				</div>
			)}
			<p className="text-lg font-extrabold text-foreground tabular-nums leading-none">
				{formatVnd(course.price_vnd)}
			</p>
			{course.bonus_coins > 0 && (
				<span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-coin-tint px-2 py-0.5 text-xs font-bold text-coin-dark">
					<StaticIcon name="coin" size="xs" className="h-3.5 w-auto" />
					Tặng {formatNumber(course.bonus_coins)} xu
				</span>
			)}
		</div>
	)
}

type BadgeTone = "info" | "warning" | "muted" | "success" | "destructive"

const BADGE_TONE_CLASS: Record<BadgeTone, string> = {
	info: "bg-primary/10 text-primary",
	warning: "bg-warning/10 text-warning",
	muted: "bg-border text-muted",
	success: "bg-success/10 text-success",
	destructive: "bg-destructive/10 text-destructive",
}

function SlotBadge({ full, remaining }: { full: boolean; remaining: number | null }) {
	if (full) return <Badge tone="muted">Đã đầy</Badge>
	if (remaining === null) return null
	if (remaining <= 5) return <Badge tone="warning">Còn {remaining} chỗ</Badge>
	return <Badge tone="info">Còn {remaining} chỗ</Badge>
}

function EnrolledCard({ course, enrollment }: { course: Course; enrollment: EnrollmentDetail | null }) {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const startMs = new Date(course.start_date).getTime()
	const endMs = new Date(course.end_date).getTime()
	const status =
		endMs < today.getTime()
			? { tone: "muted" as const, label: "Đã kết thúc", active: false }
			: startMs > today.getTime()
				? { tone: "info" as const, label: "Sắp khai giảng", active: false }
				: { tone: "success" as const, label: "Đang học", active: true }

	const next = enrollment?.next_session ?? null
	const commitment = enrollment?.commitment ?? null

	return (
		<div className="card p-5 flex flex-col gap-4 h-full">
			<div className="flex items-center justify-between gap-2">
				<Badge tone={status.tone}>{status.label}</Badge>
				{commitment && commitment.phase !== "not_enrolled" && <CommitmentChip commitment={commitment} />}
			</div>

			<div>
				<h3 className="text-base font-extrabold leading-tight text-foreground">{course.title}</h3>
				<p className="text-xs text-muted mt-1.5 tabular-nums">
					{formatDate(course.start_date)} — {formatDate(course.end_date)}
				</p>
			</div>

			<NextSessionTile course={course} status={status} next={next} />

			<EnrolledCardActions course={course} status={status} />
		</div>
	)
}

function EnrolledCardActions({ course, status }: { course: Course; status: { active: boolean } }) {
	const safeLivestream = safeExternalUrl(course.livestream_url)
	return (
		<div className="flex items-stretch gap-2 pt-1 mt-auto">
			{status.active && safeLivestream ? (
				<>
					<a
						href={safeLivestream}
						target="_blank"
						rel="noreferrer"
						className="btn btn-primary flex-1 text-sm"
					>
						<Icon name="play" size="xs" className="text-white" />
						Vào Meet
					</a>
					<Link
						to="/khoa-hoc/$courseId"
						params={{ courseId: course.id }}
						className="btn btn-secondary text-sm"
					>
						Chi tiết
					</Link>
				</>
			) : (
				<Link
					to="/khoa-hoc/$courseId"
					params={{ courseId: course.id }}
					className="btn btn-primary w-full text-sm"
				>
					{status.active ? "Vào khóa học" : "Xem chi tiết"}
				</Link>
			)}
		</div>
	)
}

function NextSessionTile({
	course,
	status,
	next,
}: {
	course: Course
	status: { active: boolean; label: string }
	next: CourseScheduleItem | null
}) {
	const ended = status.label === "Đã kết thúc"

	if (ended) {
		return (
			<div className="rounded-(--radius-card) bg-border-light px-4 py-3 flex items-start gap-3">
				<div className="size-9 shrink-0 rounded-xl bg-border/60 text-muted flex items-center justify-center">
					<Icon name="check" size="xs" className="text-muted" />
				</div>
				<div className="flex-1 min-w-0 space-y-0.5">
					<p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
						Khóa học đã kết thúc
					</p>
					<p className="text-sm font-extrabold text-foreground tabular-nums">{formatDate(course.end_date)}</p>
					<p className="text-xs text-muted leading-snug">Xem lại tài liệu trong chi tiết khóa học.</p>
				</div>
			</div>
		)
	}

	if (!next) {
		return (
			<div className="rounded-(--radius-card) bg-border-light px-4 py-3 flex items-start gap-3">
				<div className="size-9 shrink-0 rounded-xl bg-border/60 text-muted flex items-center justify-center">
					<Icon name="timer" size="xs" className="text-muted" />
				</div>
				<div className="flex-1 min-w-0 space-y-0.5">
					<p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Lịch học</p>
					<p className="text-sm font-extrabold text-foreground">Chưa có buổi học nào sắp tới</p>
					<p className="text-xs text-muted leading-snug">Giáo viên sẽ cập nhật lịch trước ngày khai giảng.</p>
				</div>
			</div>
		)
	}

	const upcoming = !status.active
	const eyebrow = upcoming
		? `Buổi đầu · Buổi ${String(next.session_number).padStart(2, "0")}`
		: `Buổi tiếp theo · Buổi ${String(next.session_number).padStart(2, "0")}`

	return (
		<div className="rounded-(--radius-card) bg-primary-tint px-4 py-3 flex items-start gap-3">
			<div
				className={cn(
					"size-9 shrink-0 rounded-xl text-white flex items-center justify-center",
					upcoming ? "bg-primary-light" : "bg-primary",
				)}
			>
				<Icon name={upcoming ? "target" : "timer"} size="xs" className="text-white" />
			</div>
			<div className="flex-1 min-w-0 space-y-0.5">
				<p className="text-[10px] font-extrabold uppercase tracking-wider text-primary-dark">{eyebrow}</p>
				<p className="text-sm font-extrabold text-foreground tabular-nums">
					{formatDate(next.date)} · {next.start_time.slice(0, 5)}–{next.end_time.slice(0, 5)}
				</p>
				<p className="text-xs text-muted leading-snug truncate">{next.topic}</p>
			</div>
		</div>
	)
}

function CommitmentChip({
	commitment,
}: {
	commitment: { phase: string; completed: number; required: number }
}) {
	const tone: BadgeTone =
		commitment.phase === "met" ? "success" : commitment.phase === "violated" ? "destructive" : "warning"
	return (
		<Badge tone={tone}>
			<span className="tabular-nums">
				{commitment.completed}/{commitment.required}
			</span>
			<span className="ml-1">{commitment.phase === "violated" ? "quá hạn" : "bài thi"}</span>
		</Badge>
	)
}

function Badge({ children, tone }: { children: React.ReactNode; tone: BadgeTone }) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
				BADGE_TONE_CLASS[tone],
			)}
		>
			{children}
		</span>
	)
}
