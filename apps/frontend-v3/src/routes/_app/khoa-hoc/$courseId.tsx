import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { DuoProgressBar } from "#/components/DuoProgressBar"
import { Header } from "#/components/Header"
import { Icon, StaticIcon } from "#/components/Icon"
import { EnrollDialog } from "#/features/course/components/EnrollDialog"
import { courseDetailQuery } from "#/features/course/queries"
import {
	COURSE_LEVEL_LABELS,
	type CommitmentStatus,
	type CourseScheduleItem,
	type CourseTeacher,
	type CourseWithRelations,
} from "#/features/course/types"
import { cn, formatDate, formatNumber, formatVnd, isSameDay } from "#/lib/utils"

export const Route = createFileRoute("/_app/khoa-hoc/$courseId")({
	component: CourseDetailPage,
})

function CourseDetailPage() {
	const { courseId } = Route.useParams()
	const { data, isLoading } = useQuery(courseDetailQuery(courseId))

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

	return (
		<>
			<Header title={course.title} backTo="/khoa-hoc" />
			<div className="px-10 pb-12 space-y-6 max-w-5xl mx-auto w-full">
				<div className="card p-6">
					<div className="grid gap-6 md:grid-cols-[1fr_minmax(260px,300px)]">
						<CourseInfo course={course} sold_slots={sold_slots} enrolled={enrolled} remaining={remaining} />
						{enrolled ? (
							<EnrolledCard livestreamUrl={course.livestream_url} />
						) : (
							<EnrollCard course={course} remaining={remaining} />
						)}
					</div>
				</div>

				{commitment && commitment.phase !== "not_enrolled" && <CommitmentCard commitment={commitment} />}

				{course.description && (
					<div className="card p-6">
						<p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Mô tả</p>
						<p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
							{course.description}
						</p>
					</div>
				)}

				{course.schedule_items.length > 0 && <ScheduleCard items={course.schedule_items} />}

				{course.teacher && <TeacherCard teacher={course.teacher} />}

				<CommitmentsCard />
			</div>
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
			<div className="flex items-start gap-4">
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

const COMMITMENTS = [
	"Tỉ lệ đạt trên 98% với học viên học đúng lộ trình.",
	"Miễn phí học lại nếu chưa đạt mục tiêu sau khóa.",
	"Giảng viên dạy sát định dạng đề và tiêu chí chấm điểm VSTEP.",
] as const

function CommitmentsCard() {
	return (
		<div className="card p-6">
			<p className="text-xs font-bold uppercase tracking-wide text-muted mb-4">Cam kết từ Luyện Thi VSTEP</p>
			<ul className="space-y-3">
				{COMMITMENTS.map((c) => (
					<li key={c} className="flex items-start gap-3 text-sm text-foreground">
						<span className="size-5 shrink-0 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center mt-0.5">
							<Icon name="check" size="xs" className="h-3 w-auto" />
						</span>
						<span>{c}</span>
					</li>
				))}
			</ul>
		</div>
	)
}

function CourseInfo({
	course,
	sold_slots,
	enrolled,
	remaining,
}: {
	course: CourseWithRelations
	sold_slots: number
	enrolled: boolean
	remaining: number
}) {
	const sessions = course.schedule_items.length
	return (
		<div className="space-y-5 min-w-0">
			<div className="flex items-center gap-2 flex-wrap">
				<span className="inline-flex items-center rounded-full border-2 border-border bg-surface px-2.5 py-0.5 text-xs font-bold text-foreground">
					{COURSE_LEVEL_LABELS[course.target_level] ?? course.target_level}
				</span>
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
					<span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-border text-muted">Đã đầy</span>
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

function EnrolledCard({ livestreamUrl }: { livestreamUrl: string | null }) {
	return (
		<aside className="rounded-2xl border-2 border-success/30 bg-success/5 p-5 space-y-4 self-start">
			<p className="text-xs font-bold uppercase tracking-wider text-success text-center">Đã đăng ký</p>
			<p className="text-sm text-foreground text-center leading-relaxed">
				Khóa học đã sẵn sàng. Vào lớp đúng giờ để không bỏ lỡ buổi học.
			</p>
			{livestreamUrl && (
				<a
					href={livestreamUrl}
					target="_blank"
					rel="noreferrer"
					className="btn btn-primary w-full py-3 text-sm font-bold inline-flex items-center justify-center"
				>
					Vào Zoom
				</a>
			)}
		</aside>
	)
}

function CommitmentCard({ commitment }: { commitment: CommitmentStatus }) {
	const met = commitment.phase === "met"
	const remaining = Math.max(0, commitment.required - commitment.completed)
	const pct =
		commitment.required > 0
			? Math.min(100, Math.round((commitment.completed / commitment.required) * 100))
			: 0

	return (
		<Link
			to="/thi-thu"
			className={cn(
				"group card-interactive block p-6 relative overflow-hidden",
				met ? "border-success" : "border-warning",
			)}
		>
			<div className="relative flex items-start gap-4">
				<div
					className={cn(
						"size-14 shrink-0 rounded-2xl border-2 flex items-center justify-center text-white",
						met ? "bg-success border-primary-dark" : "bg-warning border-[color:var(--color-warning-light)]",
					)}
					style={{ boxShadow: "0 4px 0 rgb(0 0 0 / 0.08)" }}
				>
					<Icon name={met ? "check" : "lightning"} size="md" className="text-white" />
				</div>

				<div className="flex-1 min-w-0 space-y-3">
					<div className="flex items-start justify-between gap-3 flex-wrap">
						<div className="min-w-0">
							<p
								className={cn(
									"text-xs font-bold uppercase tracking-wider",
									met ? "text-success" : "text-warning",
								)}
							>
								Cam kết kỷ luật
							</p>
							<p className="font-extrabold text-foreground text-2xl leading-none mt-1.5">
								<span className="tabular-nums">{commitment.completed}</span>
								<span className="text-muted">/</span>
								<span className="tabular-nums">{commitment.required}</span>
								<span className="text-muted text-sm font-bold ml-1.5">bài thi full-test</span>
							</p>
						</div>

						<span
							className={cn(
								"shrink-0 inline-flex items-center gap-1.5 rounded-(--radius-button) border-2 border-b-4 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider transition-all group-hover:-translate-y-0.5 group-active:translate-y-0 group-active:border-b-2",
								met
									? "bg-primary-tint border-success/40 text-success"
									: "bg-warning-tint border-warning/40 text-warning",
							)}
						>
							{met ? (
								<>
									<Icon name="check" size="xs" className="h-3 w-auto" />
									Hoàn thành
								</>
							) : (
								<>
									<Icon name="play" size="xs" className="h-3 w-auto" />
									Vào phòng thi
								</>
							)}
						</span>
					</div>

					<DuoProgressBar
						value={pct}
						tone={met ? "primary" : "warning"}
						heightPx={12}
						label="Tiến độ cam kết kỷ luật"
					/>

					<p className="text-sm text-foreground leading-relaxed">
						{met ? (
							<span className="font-bold text-success">
								Bạn đã hoàn thành cam kết — tiếp tục luyện đề để giữ phong độ.
							</span>
						) : (
							<>
								Còn <span className="font-extrabold tabular-nums text-warning">{remaining}</span> bài
								full-test nữa để hoàn thành cam kết. Bấm vào ô này để{" "}
								<span className="font-bold text-foreground">vào phòng thi ngay.</span>
							</>
						)}
					</p>
				</div>
			</div>
		</Link>
	)
}

function ScheduleCard({ items }: { items: CourseScheduleItem[] }) {
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
						<DayCell key={cell.dateISO} cell={cell} now={now} />
					))}
				</div>
			</div>
		</div>
	)
}

interface CellData {
	dateISO: string
	day: number
	item: CourseScheduleItem | null
}

function DayCell({ cell, now }: { cell: CellData; now: number }) {
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
		<div
			className={cn(
				"min-h-24 p-2",
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
		</div>
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
