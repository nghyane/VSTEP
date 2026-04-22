import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { enrollCourse } from "#/features/course/actions"
import { courseDetailQuery } from "#/features/course/queries"
import type { CommitmentStatus, CourseScheduleItem } from "#/features/course/types"
import { cn } from "#/lib/utils"

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
				<div className="card p-6 space-y-5">
					<div className="flex items-center gap-2 flex-wrap">
						<span className="text-xs font-bold px-2.5 py-0.5 rounded-full border-2 border-border bg-surface">
							{course.target_level}
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
					</div>

					<div>
						<h1 className="font-extrabold text-xl text-foreground">{course.title}</h1>
						{course.target_exam_school && (
							<p className="text-sm text-muted mt-1">{course.target_exam_school}</p>
						)}
					</div>

					<div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
						<p>
							{fmtDate(course.start_date)} — {fmtDate(course.end_date)}
						</p>
						{course.schedule_items.length > 0 && <p>{course.schedule_items.length} buổi</p>}
						<p>
							{sold_slots}/{course.max_slots} học viên
						</p>
					</div>

					<div className="border-t-2 border-border pt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						{enrolled ? (
							course.livestream_url && (
								<a
									href={course.livestream_url}
									target="_blank"
									rel="noreferrer"
									className="btn btn-primary px-6 py-2.5 text-sm font-bold inline-block"
								>
									Vào Zoom
								</a>
							)
						) : (
							<EnrollAction
								courseId={course.id}
								priceVnd={course.price_vnd}
								originalPriceVnd={course.original_price_vnd}
								bonus={course.bonus_coins}
								full={remaining <= 0}
								remaining={remaining}
							/>
						)}
					</div>
				</div>

				{course.description && (
					<div className="card p-6">
						<p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Mô tả</p>
						<p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
							{course.description}
						</p>
					</div>
				)}

				{commitment && commitment.phase !== "not_enrolled" && <CommitmentCard commitment={commitment} />}

				{course.schedule_items.length > 0 && <ScheduleCard items={course.schedule_items} />}
			</div>
		</>
	)
}

function EnrollAction({
	courseId,
	priceVnd,
	originalPriceVnd,
	bonus,
	full,
	remaining,
}: {
	courseId: string
	priceVnd: number
	originalPriceVnd: number | null
	bonus: number
	full: boolean
	remaining: number
}) {
	const queryClient = useQueryClient()
	const enroll = useMutation({
		mutationFn: () => enrollCourse(courseId),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
	})

	const hasDiscount = originalPriceVnd !== null && originalPriceVnd > priceVnd
	const discountPct = hasDiscount ? Math.round((1 - priceVnd / originalPriceVnd) * 100) : 0

	return (
		<div className="flex flex-col items-start gap-3">
			<p className="text-xs font-bold uppercase tracking-wide text-muted">Học phí</p>
			{hasDiscount && (
				<div className="flex items-center gap-2">
					<span className="text-sm text-muted line-through tabular-nums">{fmtVnd(originalPriceVnd)}</span>
					<span className="text-xs font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
						-{discountPct}%
					</span>
				</div>
			)}
			<p className="text-2xl font-extrabold text-foreground tabular-nums">{fmtVnd(priceVnd)}</p>
			{hasDiscount && (
				<p className="text-xs font-bold text-success">Tiết kiệm {fmtVnd(originalPriceVnd - priceVnd)}</p>
			)}
			{bonus > 0 && (
				<span className="text-xs font-bold text-coin-dark bg-coin-dark/10 px-2.5 py-1 rounded-full">
					Tặng kèm {bonus.toLocaleString("vi-VN")} xu
				</span>
			)}
			<button
				type="button"
				disabled={full || enroll.isPending}
				onClick={() => enroll.mutate()}
				className="btn btn-primary px-8 py-3 text-sm font-bold disabled:opacity-50 w-full md:w-auto"
			>
				{enroll.isPending ? "Đang xử lý…" : full ? "Đã đầy" : "Đăng ký khóa học"}
			</button>
			{!full && remaining <= 5 && (
				<p className="text-xs font-bold text-warning">Chỉ còn {remaining} chỗ cuối</p>
			)}
		</div>
	)
}

function CommitmentCard({ commitment }: { commitment: CommitmentStatus }) {
	const met = commitment.phase === "met"
	return (
		<div className={cn("card p-6", met ? "border-success" : "border-warning")}>
			<p className="text-xs font-bold uppercase tracking-wide text-muted mb-1">Cam kết kỷ luật</p>
			<p className="text-sm text-foreground">
				{commitment.completed}/{commitment.required} bài thi full-test
			</p>
			<div className="mt-3 h-2 rounded-full bg-border overflow-hidden">
				<div
					className={cn("h-full rounded-full transition-all", met ? "bg-success" : "bg-warning")}
					style={{ width: `${Math.min(100, (commitment.completed / commitment.required) * 100)}%` }}
				/>
			</div>
			<p className={cn("text-xs font-bold mt-2", met ? "text-success" : "text-warning")}>
				{met ? "Đã hoàn thành cam kết" : "Chưa đủ — hãy thi thêm"}
			</p>
		</div>
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
	const past = new Date(cell.dateISO).getTime() < now - 86400000

	if (!cell.item) {
		return (
			<div className="min-h-24 p-2 text-right">
				<span className="text-xs text-muted/40 tabular-nums">{pad(cell.day)}</span>
			</div>
		)
	}

	const s = cell.item
	return (
		<div className={cn("min-h-24 p-2", past ? "bg-surface" : "bg-primary/5")}>
			<div className="flex items-baseline justify-between">
				<span
					className={cn("text-xs font-bold uppercase tabular-nums", past ? "text-muted" : "text-primary")}
				>
					Buổi {pad(s.session_number)}
				</span>
				<span className="text-xs text-muted/60 tabular-nums">{pad(cell.day)}</span>
			</div>
			<p className={cn("mt-1 text-xs font-bold tabular-nums leading-tight", past && "line-through")}>
				{fmtTime(s.start_time)}–{fmtTime(s.end_time)}
			</p>
			<p className={cn("mt-0.5 text-xs leading-tight", past ? "text-muted" : "text-foreground")}>{s.topic}</p>
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

function fmtDate(iso: string): string {
	const d = new Date(iso)
	return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

function fmtTime(time: string): string {
	return time.slice(0, 5)
}

function fmtVnd(n: number): string {
	return `${n.toLocaleString("vi-VN")}đ`
}
