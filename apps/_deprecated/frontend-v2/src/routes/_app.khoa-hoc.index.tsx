import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { GraduationCap } from "lucide-react"
import { Suspense } from "react"
import { useEnrollments } from "#/features/course/lib/enrollment-store"
import { courseListQueryOptions } from "#/features/course/lib/queries"
import { type Course, MOCK_COURSES } from "#/mocks/courses"
import { cn } from "#/shared/lib/utils"
import { Skeleton } from "#/shared/ui/skeleton"
import { CourseCard } from "./_app.khoa-hoc/-components/CourseCard"
import { MyCourseCard } from "./_app.khoa-hoc/-components/MyCourseCard"

type Tab = "explore" | "mine"

interface Search {
	tab: Tab
}

const VALID_TABS: readonly Tab[] = ["explore", "mine"]

export const Route = createFileRoute("/_app/khoa-hoc/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		tab: VALID_TABS.includes(s.tab as Tab) ? (s.tab as Tab) : "explore",
	}),
	loader: ({ context }) => context.queryClient.ensureQueryData(courseListQueryOptions()),
	component: CoursesPage,
})

function CoursesPage() {
	const { tab } = Route.useSearch()

	return (
		<div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold">Khóa học cấp tốc</h1>
				<p className="text-sm text-muted-foreground">
					Học cùng giáo viên chấm thi VSTEP — ôn "trúng đề" sát ngày thi.
				</p>
			</div>

			<div className="flex gap-1 border-b">
				<TabButton tab="explore" active={tab === "explore"}>
					Khám phá
				</TabButton>
				<TabButton tab="mine" active={tab === "mine"}>
					Khóa của tôi
				</TabButton>
			</div>

			<Suspense fallback={<ListSkeleton />}>
				{tab === "explore" ? <ExploreTab /> : <MineTab />}
			</Suspense>
		</div>
	)
}

function TabButton({
	tab,
	active,
	children,
}: {
	tab: Tab
	active: boolean
	children: React.ReactNode
}) {
	return (
		<Link
			to="/khoa-hoc"
			search={{ tab }}
			className={cn(
				"relative inline-flex shrink-0 items-center px-4 py-3 text-sm font-medium transition-colors",
				active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
			)}
		>
			{children}
			{active && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />}
		</Link>
	)
}

// ─── Explore ──────────────────────────────────────────────────────────────────

function ExploreTab() {
	const { data: courses } = useSuspenseQuery(courseListQueryOptions())
	const enrollments = useEnrollments()
	const enrolledIds = new Set(enrollments.map((e) => e.courseId))

	if (courses.length === 0) {
		return <EmptyState title="Chưa có khóa học nào đang mở" />
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{courses.map((course) => (
				<CourseCard key={course.id} course={course} enrolled={enrolledIds.has(course.id)} />
			))}
		</div>
	)
}

// ─── Mine ─────────────────────────────────────────────────────────────────────

function MineTab() {
	const enrollments = useEnrollments()

	// Ghép (enrollment, course) theo thứ tự mua mới nhất trước; skip nếu course bị xóa.
	const items = [...enrollments]
		.sort((a, b) => b.purchasedAt - a.purchasedAt)
		.map((enrollment) => {
			const course = MOCK_COURSES.find((c) => c.id === enrollment.courseId)
			return course ? { enrollment, course } : null
		})
		.filter((x): x is { enrollment: (typeof enrollments)[number]; course: Course } => x !== null)

	if (items.length === 0) {
		return (
			<EmptyState
				title="Chưa có khóa học nào"
				description="Bạn chưa đăng ký khóa học cấp tốc nào. Khám phá các khóa đang mở tuyển sinh."
				actionLabel="Khám phá khóa học"
				actionHref={{ to: "/khoa-hoc", search: { tab: "explore" as Tab } }}
			/>
		)
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{items.map(({ course, enrollment }) => (
				<MyCourseCard key={course.id} course={course} enrollment={enrollment} />
			))}
		</div>
	)
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
	title,
	description,
	actionLabel,
	actionHref,
}: {
	title: string
	description?: string
	actionLabel?: string
	actionHref?: { to: "/khoa-hoc"; search: { tab: Tab } }
}) {
	return (
		<div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/20 py-16 text-center">
			<div className="flex size-14 items-center justify-center rounded-full bg-muted">
				<GraduationCap className="size-7 text-muted-foreground" />
			</div>
			<div className="space-y-1">
				<p className="font-semibold text-foreground">{title}</p>
				{description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
			</div>
			{actionLabel && actionHref && (
				<Link
					to={actionHref.to}
					search={actionHref.search}
					className="mt-2 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
				>
					{actionLabel}
				</Link>
			)}
		</div>
	)
}

function ListSkeleton() {
	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{Array.from({ length: 4 }, (_, i) => (
				<Skeleton key={i} className="h-64 rounded-2xl" />
			))}
		</div>
	)
}
