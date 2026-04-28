import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useMemo, useRef, useState } from "react"
import { Header } from "#/components/Header"
import { CourseCard } from "#/features/course/components/CourseCard"
import { HotCoursesDialog } from "#/features/course/components/HotCoursesDialog"
import { courseListQuery } from "#/features/course/queries"
import type { Course } from "#/features/course/types"
import { cn } from "#/lib/utils"

const HOT_SNOOZE_KEY = "vstep:hot-courses-snoozed-until:v1"
const HOT_SNOOZE_HOURS = 24

type Tab = "explore" | "mine"
const VALID_TABS: readonly Tab[] = ["explore", "mine"]

export const Route = createFileRoute("/_app/khoa-hoc/")({
	validateSearch: (s: Record<string, unknown>) => ({
		tab: VALID_TABS.includes(s.tab as Tab) ? (s.tab as Tab) : "explore",
	}),
	component: CoursesPage,
})

function CoursesPage() {
	const { tab } = Route.useSearch()
	const { data, isLoading } = useQuery(courseListQuery)
	const courses = data?.data ?? []
	const enrolledIds = new Set(data?.enrolled_course_ids ?? [])

	const list = tab === "mine" ? courses.filter((c) => enrolledIds.has(c.id)) : courses

	const hotPair = useMemo<[Course, Course] | null>(() => {
		const candidates = courses
			.filter((c) => typeof c.sold_slots === "number" && c.sold_slots < c.max_slots && !enrolledIds.has(c.id))
			.sort((a, b) => (b.sold_slots ?? 0) - (a.sold_slots ?? 0))
		if (candidates.length < 2) return null
		return [candidates[0], candidates[1]]
	}, [courses, enrolledIds])

	// User có khóa ACTIVE (đã enroll & chưa kết thúc) → ẩn — không spam người đang học.
	// Khi khóa đó hết hạn mà chưa enroll khóa mới → popup tự hiện lại để remarketing.
	// User đóng popup → snooze 24h (localStorage). Sau 24h: hiện lại nếu vẫn chưa active.
	const hasActiveEnrollment = useMemo(() => {
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		return courses.some((c) => enrolledIds.has(c.id) && new Date(c.end_date) >= today)
	}, [courses, enrolledIds])

	const [hotOpen, setHotOpen] = useState(false)
	const autoOpenedRef = useRef(false)
	useEffect(() => {
		if (autoOpenedRef.current) return
		if (!hotPair) return
		if (hasActiveEnrollment) return
		const snoozedUntil = Number(localStorage.getItem(HOT_SNOOZE_KEY) ?? 0)
		if (snoozedUntil > Date.now()) return
		autoOpenedRef.current = true
		setHotOpen(true)
	}, [hotPair, hasActiveEnrollment])

	const dismissHot = () => {
		setHotOpen(false)
		localStorage.setItem(HOT_SNOOZE_KEY, String(Date.now() + HOT_SNOOZE_HOURS * 60 * 60 * 1000))
	}

	return (
		<>
			<Header title="Khóa học" />
			{hotPair && <HotCoursesDialog open={hotOpen} onClose={dismissHot} courses={hotPair} />}
			<div className="px-10 pb-12 space-y-6 max-w-5xl mx-auto w-full">
				<p className="text-sm text-muted">Học cùng giáo viên chấm thi VSTEP — ôn trúng đề sát ngày thi.</p>

				<div className="flex gap-1 border-b-2 border-border">
					<TabLink tab="explore" active={tab === "explore"}>
						Khám phá
					</TabLink>
					<TabLink tab="mine" active={tab === "mine"}>
						Khóa của tôi
					</TabLink>
				</div>

				{isLoading ? (
					<div className="grid gap-4 sm:grid-cols-2 items-start">
						{Array.from({ length: 4 }, (_, i) => (
							<div key={i} className="card h-64 animate-pulse bg-surface" />
						))}
					</div>
				) : list.length === 0 ? (
					<div className="card p-12 text-center">
						<p className="font-bold text-foreground">
							{tab === "mine" ? "Chưa có khóa học nào" : "Chưa có khóa nào đang mở"}
						</p>
						{tab === "mine" && (
							<Link
								to="/khoa-hoc"
								search={{ tab: "explore" }}
								className="text-sm font-bold text-primary mt-2 inline-block"
							>
								Khám phá khóa học →
							</Link>
						)}
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 items-start">
						{list.map((c) => (
							<CourseCard key={c.id} course={c} enrolled={enrolledIds.has(c.id)} />
						))}
					</div>
				)}
			</div>
		</>
	)
}

function TabLink({ tab, active, children }: { tab: Tab; active: boolean; children: React.ReactNode }) {
	return (
		<Link
			to="/khoa-hoc"
			search={{ tab }}
			className={cn(
				"relative px-4 py-3 text-sm font-bold transition-colors",
				active ? "text-foreground" : "text-muted hover:text-foreground",
			)}
		>
			{children}
			{active && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />}
		</Link>
	)
}
