import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
	ArrowLeft,
	CalendarDays,
	CheckCircle2,
	Clock,
	GraduationCap,
	ShieldCheck,
	Users,
	Video,
} from "lucide-react"
import { useState } from "react"
import { CoinIcon } from "#/components/common/CoinIcon"
import { Avatar, AvatarFallback } from "#/components/ui/avatar"
import { Button } from "#/components/ui/button"
import { computeCommitment } from "#/lib/courses/commitment"
import { useExamCompletions } from "#/lib/courses/completion-log"
import { useEnrollments } from "#/lib/courses/enrollment-store"
import {
	COURSE_LEVEL_LABELS,
	type Course,
	type CourseSession,
	discountPercent,
	hasDiscount,
	isCourseEnded,
	isCourseFull,
	remainingSlots,
	savedVnd,
} from "#/lib/mock/courses"
import { courseDetailQueryOptions } from "#/lib/queries/courses"
import { cn } from "#/lib/utils"
import {
	CommitmentCard,
	CommitmentViolatedBanner,
} from "./_app.khoa-hoc/-components/CommitmentCard"
import { CoursePurchaseDialog } from "./_app.khoa-hoc/-components/CoursePurchaseDialog"
import {
	formatCoins,
	formatDateShort,
	formatDateVi,
	formatVnd,
} from "./_app.khoa-hoc/-components/course-utils"

export const Route = createFileRoute("/_app/khoa-hoc/$courseId")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(courseDetailQueryOptions(params.courseId)),
	component: CourseDetailPage,
})

function CourseDetailPage() {
	const { courseId } = Route.useParams()
	const { data: course } = useSuspenseQuery(courseDetailQueryOptions(courseId))
	const enrollments = useEnrollments()
	const enrollment = enrollments.find((e) => e.courseId === courseId)
	const enrolled = enrollment !== undefined
	const ended = isCourseEnded(course)
	const full = isCourseFull(course)

	// Subscribe vào completion log để re-render khi user làm bài mới.
	useExamCompletions()
	const commitment = enrollment ? computeCommitment(course, enrollment) : null
	const violated = commitment?.phase === "violated"

	return (
		<div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
			<Link
				to="/khoa-hoc"
				search={{ tab: enrolled ? "mine" : "explore" }}
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Khóa học
			</Link>

			<HeroPanel
				course={course}
				enrolled={enrolled}
				ended={ended}
				full={full}
				violated={violated}
			/>

			{enrollment && commitment && (
				<CommitmentCard course={course} enrollment={enrollment} status={commitment} />
			)}

			<DescriptionCard course={course} />

			<InstructorCard course={course} />

			<SessionsCard course={course} />

			<GuaranteeCard />
		</div>
	)
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroPanel({
	course,
	enrolled,
	ended,
	full,
	violated,
}: {
	course: Course
	enrolled: boolean
	ended: boolean
	full: boolean
	violated: boolean
}) {
	const [purchaseOpen, setPurchaseOpen] = useState(false)

	return (
		<div className="rounded-2xl border bg-card p-6 shadow-sm">
			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div className="min-w-0 flex-1 space-y-2">
					<div className="flex flex-wrap items-center gap-2">
						<span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
							{COURSE_LEVEL_LABELS[course.level]}
						</span>
						{enrolled && !violated && (
							<span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
								Đã mua
							</span>
						)}
						{violated && (
							<span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-semibold text-destructive">
								Tài khoản bị khóa
							</span>
						)}
						{ended && (
							<span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
								Đã kết thúc
							</span>
						)}
					</div>
					<h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
						{course.title}
					</h1>
					<p className="text-sm text-muted-foreground">{course.targetExam}</p>

					{/* Meta row */}
					<div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-2 text-xs text-muted-foreground">
						<span className="inline-flex items-center gap-1.5">
							<CalendarDays className="size-3.5" />
							{formatDateVi(course.startDate)} — {formatDateVi(course.endDate)}
						</span>
						<span className="inline-flex items-center gap-1.5">
							<Clock className="size-3.5" />
							{course.sessions.length} buổi · 2 giờ/buổi
						</span>
						<span className="inline-flex items-center gap-1.5">
							<Users className="size-3.5" />
							<span className="tabular-nums">{course.soldSlots}</span>/{course.maxSlots} học viên
						</span>
					</div>
				</div>

				{/* Right: CTA panel */}
				<div className="w-full shrink-0 md:w-64">
					{violated ? (
						<CommitmentViolatedBanner course={course} />
					) : enrolled ? (
						<EnrolledPanel course={course} ended={ended} />
					) : (
						<PurchasePanel
							course={course}
							full={full}
							ended={ended}
							onBuy={() => setPurchaseOpen(true)}
						/>
					)}
				</div>
			</div>

			<CoursePurchaseDialog course={course} open={purchaseOpen} onOpenChange={setPurchaseOpen} />
		</div>
	)
}

function PurchasePanel({
	course,
	full,
	ended,
	onBuy,
}: {
	course: Course
	full: boolean
	ended: boolean
	onBuy: () => void
}) {
	const left = remainingSlots(course)

	return (
		<div className="flex flex-col items-center rounded-xl bg-muted/50 p-4 text-center">
			<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Học phí
			</p>

			{hasDiscount(course) && (
				<div className="mt-2 flex items-center justify-center gap-2">
					<span className="relative inline-block text-base leading-none text-muted-foreground tabular-nums before:absolute before:inset-x-0 before:top-[45%] before:h-px before:-translate-y-1/2 before:bg-current before:content-['']">
						{formatVnd(course.originalPriceVnd)}
					</span>
					<span className="inline-flex items-center rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] font-bold text-destructive tabular-nums">
						-{discountPercent(course)}%
					</span>
				</div>
			)}

			<p className="mt-1 text-2xl font-extrabold text-foreground tabular-nums">
				{formatVnd(course.priceVnd)}
			</p>

			{hasDiscount(course) && (
				<p className="mt-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
					Tiết kiệm {formatVnd(savedVnd(course))}
				</p>
			)}

			{course.bonusCoins > 0 && (
				<div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
					<span className="flex size-3.5 items-center justify-center">
						<CoinIcon size={12} className="-translate-y-px" />
					</span>
					<span className="translate-y-[0.5px] leading-none tabular-nums">
						Tặng kèm {formatCoins(course.bonusCoins)} xu
					</span>
				</div>
			)}

			<Button className="mt-3 w-full" disabled={full || ended} onClick={onBuy}>
				{ended ? "Đã kết thúc" : full ? "Đã đầy chỗ" : "Đăng ký khóa học"}
			</Button>

			{!ended && !full && left <= 5 && (
				<p className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
					Chỉ còn {left} chỗ cuối
				</p>
			)}
			{full && !ended && (
				<p className="mt-2 text-xs text-muted-foreground">
					Hãy chọn khóa khác hoặc quay lại luồng{" "}
					<Link to="/luyen-tap" className="underline underline-offset-2">
						tự luyện tập
					</Link>
				</p>
			)}
		</div>
	)
}

function EnrolledPanel({ course, ended }: { course: Course; ended: boolean }) {
	if (ended) {
		return (
			<div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
				Khóa học đã kết thúc ngày {formatDateVi(course.endDate)}.
			</div>
		)
	}
	return (
		<div className="rounded-xl bg-primary/5 p-4">
			<p className="text-xs font-semibold uppercase tracking-wider text-primary">Livestream</p>
			<p className="mt-1 text-sm text-foreground">
				Link Zoom dùng chung cho mọi buổi livestream của khóa.
			</p>
			<Button asChild className="mt-3 w-full">
				<a href={course.livestreamUrl} target="_blank" rel="noreferrer">
					<Video className="size-4" />
					Vào Zoom
				</a>
			</Button>
		</div>
	)
}

// ─── Description ──────────────────────────────────────────────────────────────

function DescriptionCard({ course }: { course: Course }) {
	return (
		<section className="rounded-2xl bg-muted/50 p-5 shadow-sm">
			<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Mô tả khóa học
			</h2>
			<p className="mt-2 text-sm leading-relaxed text-foreground">{course.description}</p>
			<ul className="mt-4 space-y-2 text-sm text-foreground">
				{course.highlights.map((h) => (
					<li key={h} className="flex items-start gap-2">
						<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
						<span>{h}</span>
					</li>
				))}
			</ul>
		</section>
	)
}

// ─── Instructor ───────────────────────────────────────────────────────────────

function InstructorCard({ course }: { course: Course }) {
	const initials = course.instructor.name
		.split(" ")
		.map((w) => w[0])
		.slice(-2)
		.join("")
		.toUpperCase()

	return (
		<section className="rounded-2xl bg-muted/50 p-5 shadow-sm">
			<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Giáo viên phụ trách
			</h2>
			<div className="mt-3 flex items-start gap-4">
				<Avatar className="size-14">
					<AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
						{initials}
					</AvatarFallback>
				</Avatar>
				<div className="min-w-0 flex-1 space-y-1">
					<p className="font-semibold text-foreground">{course.instructor.name}</p>
					<p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
						<GraduationCap className="size-3.5" />
						{course.instructor.title}
					</p>
					<p className="pt-1 text-sm leading-relaxed text-foreground">{course.instructor.bio}</p>
				</div>
			</div>
		</section>
	)
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

function SessionsCard({ course }: { course: Course }) {
	const now = Date.now()

	return (
		<section className="rounded-2xl bg-muted/50 p-5 shadow-sm">
			<div className="flex items-center justify-between">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Lịch học chi tiết
				</h2>
				<span className="text-xs text-muted-foreground">{course.sessions.length} buổi</span>
			</div>
			<ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border bg-background">
				{course.sessions.map((s) => (
					<SessionRow key={s.id} session={s} past={new Date(s.date).getTime() < now} />
				))}
			</ul>
		</section>
	)
}

function SessionRow({ session, past }: { session: CourseSession; past: boolean }) {
	return (
		<li
			className={cn("flex items-center gap-3 px-4 py-3 text-sm", past && "text-muted-foreground")}
		>
			<span
				className={cn(
					"flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums",
					past ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
				)}
			>
				{String(session.sessionNumber).padStart(2, "0")}
			</span>
			<div className="min-w-0 flex-1">
				<p className={cn("font-medium", past ? "line-through" : "text-foreground")}>
					{formatDateShort(session.date)} · {session.startTime}–{session.endTime}
				</p>
				<p className="text-xs text-muted-foreground">Chủ đề: {session.topic}</p>
			</div>
			{past && <span className="text-[11px] font-medium text-muted-foreground">Đã qua</span>}
		</li>
	)
}

// ─── Commitment ───────────────────────────────────────────────────────────────

function GuaranteeCard() {
	const items = [
		"Tỉ lệ đạt trên 98% với học viên học đúng lộ trình.",
		"Miễn phí học lại nếu chưa đạt mục tiêu sau khóa.",
		"Giảng viên dạy sát định dạng đề và tiêu chí chấm điểm VSTEP.",
	]
	return (
		<section className="rounded-2xl bg-muted/50 p-5 shadow-sm">
			<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Cam kết từ LUYỆN THI VSTEP
			</h2>
			<ul className="mt-3 space-y-2 text-sm text-foreground">
				{items.map((it) => (
					<li key={it} className="flex items-start gap-2">
						<ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
						<span>{it}</span>
					</li>
				))}
			</ul>
		</section>
	)
}
