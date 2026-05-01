import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useMemo, useRef, useState } from "react"
import { Header } from "#/components/Header"
import { Icon } from "#/components/Icon"
import { CourseCard } from "#/features/course/components/CourseCard"
import { HotCoursesDialog } from "#/features/course/components/HotCoursesDialog"
import { courseListQuery } from "#/features/course/queries"
import type { Course } from "#/features/course/types"
import { cn } from "#/lib/utils"

const HOT_SNOOZE_KEY = "vstep:hot-courses-snoozed-until:v1"
const HOT_SNOOZE_HOURS = 24
const BOOK_HINT_DISMISSED_KEY = "vstep:book-1-1-hint-dismissed:v1"

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
	const enrollments = data?.enrollments ?? {}

	const exploreList = courses.filter((c) => !enrolledIds.has(c.id))
	const mineList = courses.filter((c) => enrolledIds.has(c.id))
	const list = tab === "mine" ? mineList : exploreList

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

	const [bookHintDismissed, setBookHintDismissed] = useState(() => {
		if (typeof window === "undefined") return false
		return localStorage.getItem(BOOK_HINT_DISMISSED_KEY) === "1"
	})
	const dismissBookHint = () => {
		setBookHintDismissed(true)
		localStorage.setItem(BOOK_HINT_DISMISSED_KEY, "1")
	}

	const [hintPulseKey, setHintPulseKey] = useState(0)
	const bookHintRef = useRef<HTMLDivElement | null>(null)
	const triggerHintPulse = () => {
		if (bookHintDismissed) {
			localStorage.removeItem(BOOK_HINT_DISMISSED_KEY)
			setBookHintDismissed(false)
		}
		setHintPulseKey((k) => k + 1)
		requestAnimationFrame(() => {
			bookHintRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
		})
	}

	return (
		<>
			<Header title="Khóa học" />
			{hotPair && <HotCoursesDialog open={hotOpen} onClose={dismissHot} courses={hotPair} />}
			<div className="px-10 pb-12 space-y-6 max-w-5xl mx-auto w-full">
				<div className="flex flex-wrap items-center gap-3">
					<div className="inline-flex items-center gap-1 p-1 rounded-full bg-surface border-2 border-border shrink-0">
						<TabLink tab="explore" active={tab === "explore"} count={exploreList.length}>
							Khám phá
						</TabLink>
						<TabLink tab="mine" active={tab === "mine"} count={mineList.length}>
							Khóa của tôi
						</TabLink>
						<BookOneOnOneCta enrolledCourseId={mineList[0]?.id ?? null} onLockedClick={triggerHintPulse} />
					</div>
					<p className="text-base text-muted max-w-md leading-relaxed">
						Học cùng giáo viên chấm thi VSTEP — ôn trúng đề sát ngày thi.
					</p>
				</div>

				{mineList.length === 0 && exploreList.length > 0 && !bookHintDismissed && (
					<div
						ref={bookHintRef}
						key={hintPulseKey}
						className={cn(
							"relative rounded-(--radius-card) border-2 border-b-4 border-warning/30 bg-background px-4 py-3 pr-10 flex items-start gap-3 flex-wrap",
							hintPulseKey > 0 && "animate-[warningBlink_1100ms_ease-in-out_2]",
						)}
					>
						<span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-b-4 border-warning/40 bg-warning/15 text-warning">
							<svg
								viewBox="0 0 24 24"
								className="size-4"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.4"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<rect x="4" y="11" width="16" height="9" rx="2" />
								<path d="M8 11V7a4 4 0 1 1 8 0v4" />
							</svg>
						</span>
						<div className="flex-1 min-w-0">
							<p className="font-extrabold text-foreground text-sm">
								Đăng ký 1 khóa học để mở khóa <span className="text-warning">Đặt lịch 1-1</span> với giảng
								viên
							</p>
							<p className="text-xs text-muted mt-0.5 leading-relaxed">
								Sau khi đăng ký, bạn có thể đặt buổi học riêng 30 phút để được sửa bài và tư vấn cá nhân.
							</p>
						</div>
						{tab !== "explore" && (
							<Link
								to="/khoa-hoc"
								search={{ tab: "explore" }}
								className="shrink-0 inline-flex items-center gap-1.5 rounded-full border-2 border-b-4 border-warning/40 bg-warning/15 px-3 py-1.5 text-xs font-extrabold text-warning transition-all hover:-translate-y-0.5 active:translate-y-0 active:border-b-2"
							>
								Xem khóa học →
							</Link>
						)}
						<button
							type="button"
							onClick={dismissBookHint}
							aria-label="Đóng thông báo"
							className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full text-warning/70 transition-colors hover:bg-warning/15 hover:text-warning"
						>
							<Icon name="close" size="xs" className="h-3 w-auto" />
						</button>
					</div>
				)}

				{mineList.length === 0 && exploreList.length > 0 && bookHintDismissed && (
					<button
						type="button"
						onClick={() => {
							localStorage.removeItem(BOOK_HINT_DISMISSED_KEY)
							setBookHintDismissed(false)
						}}
						className="self-start inline-flex items-center gap-1.5 text-xs font-extrabold text-muted hover:text-warning transition-colors"
					>
						<svg
							viewBox="0 0 24 24"
							className="size-3.5"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.4"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<rect x="4" y="11" width="16" height="9" rx="2" />
							<path d="M8 11V7a4 4 0 1 1 8 0v4" />
						</svg>
						Vì sao Đặt lịch 1-1 đang khoá?
					</button>
				)}

				{isLoading ? (
					<div className="grid gap-4 sm:grid-cols-2 items-stretch">
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
					<div className="grid gap-4 sm:grid-cols-2 items-stretch">
						{list.map((c) => (
							<CourseCard
								key={c.id}
								course={c}
								enrolled={enrolledIds.has(c.id)}
								enrollment={enrollments[c.id] ?? null}
							/>
						))}
					</div>
				)}
			</div>
		</>
	)
}

function BookOneOnOneCta({
	enrolledCourseId,
	onLockedClick,
}: {
	enrolledCourseId: string | null
	onLockedClick: () => void
}) {
	const [shakeKey, setShakeKey] = useState(0)
	if (!enrolledCourseId) {
		return (
			<button
				type="button"
				aria-disabled="true"
				title="Đăng ký một khóa để mở tính năng này"
				onClick={() => {
					setShakeKey((k) => k + 1)
					onLockedClick()
				}}
				className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-extrabold leading-none text-muted/80 hover:text-warning transition-colors border-l-2 border-border ml-1 pl-3"
			>
				<svg
					key={shakeKey}
					viewBox="0 0 24 24"
					className={cn(
						"size-4 shrink-0",
						shakeKey > 0 && "animate-[lockShake_700ms_ease-in-out] text-warning",
					)}
					fill="none"
					stroke="currentColor"
					strokeWidth="2.4"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<rect x="4" y="11" width="16" height="9" rx="2" />
					<path d="M8 11V7a4 4 0 1 1 8 0v4" />
				</svg>
				<span className="translate-y-px">Đặt lịch 1-1</span>
			</button>
		)
	}
	return (
		<Link
			to="/khoa-hoc/$courseId/dat-lich-1-1"
			params={{ courseId: enrolledCourseId }}
			className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-extrabold leading-none text-primary-dark hover:bg-primary-tint/70 transition-colors border-l-2 border-border ml-1 pl-3"
		>
			<Icon name="graduation" size="xs" className="h-4 w-auto shrink-0" />
			<span className="translate-y-px">Đặt lịch 1-1</span>
			<span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary/15 text-primary text-[10px] font-extrabold leading-none">
				NEW
			</span>
		</Link>
	)
}

function TabLink({
	tab,
	active,
	count,
	children,
}: {
	tab: Tab
	active: boolean
	count: number
	children: React.ReactNode
}) {
	return (
		<Link
			to="/khoa-hoc"
			search={{ tab }}
			className={cn(
				"inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-extrabold transition-all",
				active
					? "bg-background text-foreground border-2 border-border border-b-4 -translate-y-px"
					: "text-muted hover:text-foreground",
			)}
		>
			{children}
			<span
				className={cn(
					"inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs tabular-nums leading-none",
					active ? "bg-primary/15 text-primary" : "bg-border/70 text-muted",
				)}
			>
				{count}
			</span>
		</Link>
	)
}
