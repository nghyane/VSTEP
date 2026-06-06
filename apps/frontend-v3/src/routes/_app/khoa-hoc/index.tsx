import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Header } from "#/components/Header"
import { Icon } from "#/components/Icon"
import { SegmentedTabs } from "#/components/SegmentedTabs"
import { CourseCard } from "#/features/course/components/CourseCard"
import { HotCoursesDialog } from "#/features/course/components/HotCoursesDialog"
import { courseListQuery } from "#/features/course/queries"
import type { Course } from "#/features/course/types"
import { cn } from "#/lib/utils"

const HOT_SNOOZE_KEY = "vstep:hot-courses-snoozed-until:v1"
const HOT_SNOOZE_HOURS = 24
const BOOK_HINT_DISMISSED_KEY = "vstep:book-1-1-hint-dismissed:v1"

type Tab = "explore" | "mine"

function normalizeTab(tab: unknown): Tab {
	if (tab === "mine") return "mine"
	return "explore"
}

export const Route = createFileRoute("/_app/khoa-hoc/")({
	validateSearch: (s: Record<string, unknown>) => ({
		tab: normalizeTab(s.tab),
	}),
	component: CoursesPage,
})

function CoursesPage() {
	const { tab } = Route.useSearch()
	const navigate = useNavigate()
	const { data, isLoading } = useQuery(courseListQuery)
	const courses = data?.data ?? []
	const enrolledIds = new Set(data?.enrolled_course_ids ?? [])
	const enrollments = data?.enrollments ?? {}

	// Khóa hết hạn (end_date < hôm nay) không thể đăng ký mới → ẩn khỏi Khám phá.
	// Khóa "Của tôi" vẫn giữ để học viên xem lại lịch sử / tài liệu (CourseCard đã có
	// badge "Đã kết thúc" cho enrolled state).
	const todayMs = useMemo(() => {
		const d = new Date()
		d.setHours(0, 0, 0, 0)
		return d.getTime()
	}, [])
	const isExpired = (c: Course) => new Date(c.end_date).getTime() < todayMs

	const exploreList = courses.filter((c) => !enrolledIds.has(c.id) && !isExpired(c))
	const mineList = courses.filter((c) => enrolledIds.has(c.id))
	const list = tab === "mine" ? mineList : exploreList
	const tabItems: { value: Tab; label: string; count: number }[] = [
		{ value: "explore", label: "Khám phá", count: exploreList.length },
		{ value: "mine", label: "Khóa của tôi", count: mineList.length },
	]

	const hotPair = useMemo<[Course, Course] | null>(() => {
		const candidates = courses
			.filter(
				(c) =>
					typeof c.sold_slots === "number" &&
					c.sold_slots < c.max_slots &&
					!enrolledIds.has(c.id) &&
					new Date(c.end_date).getTime() >= todayMs,
			)
			.sort((a, b) => (b.sold_slots ?? 0) - (a.sold_slots ?? 0))
		if (candidates.length < 2) return null
		return [candidates[0], candidates[1]]
	}, [courses, enrolledIds, todayMs])

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
	const changeTab = (nextTab: Tab) => {
		navigate({ to: "/khoa-hoc", search: { tab: nextTab } })
	}

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
			<div className="px-10 pb-12 space-y-6">
				<div className="flex flex-wrap items-center gap-2">
					<SegmentedTabs items={tabItems} value={tab} onChange={changeTab} />
					<BookOneOnOneCta enrolledCourses={mineList} onLockedClick={triggerHintPulse} />
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
						<span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
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

				<div className="min-h-[360px] transition-all duration-200 ease-out">
					{isLoading ? (
						<div className="grid gap-4 sm:grid-cols-2 items-stretch">
							{Array.from({ length: 4 }, (_, i) => (
								<div key={i} className="card h-72 animate-pulse bg-surface" />
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
			</div>
		</>
	)
}

function BookOneOnOneCta({
	enrolledCourses,
	onLockedClick,
}: {
	enrolledCourses: Course[]
	onLockedClick: () => void
}) {
	const [shakeKey, setShakeKey] = useState(0)
	const [pickerOpen, setPickerOpen] = useState(false)

	if (enrolledCourses.length === 0) {
		return (
			<button
				type="button"
				aria-disabled="true"
				title="Đăng ký một khóa để mở tính năng này"
				onClick={() => {
					setShakeKey((k) => k + 1)
					onLockedClick()
				}}
				className="btn btn-secondary text-muted hover:text-foreground"
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
				Đặt lịch 1-1
			</button>
		)
	}

	if (enrolledCourses.length === 1) {
		return (
			<Link
				to="/khoa-hoc/$courseId/dat-lich-1-1"
				params={{ courseId: enrolledCourses[0].id }}
				className="btn btn-secondary"
			>
				<Icon name="graduation" size="xs" className="h-4 w-auto shrink-0 text-muted" />
				Đặt lịch 1-1
			</Link>
		)
	}

	return (
		<>
			<button type="button" onClick={() => setPickerOpen(true)} className="btn btn-secondary">
				<Icon name="graduation" size="xs" className="h-4 w-auto shrink-0 text-muted" />
				Đặt lịch 1-1
			</button>
			<BookCoursePicker open={pickerOpen} courses={enrolledCourses} onClose={() => setPickerOpen(false)} />
		</>
	)
}

function BookCoursePicker({
	open,
	courses,
	onClose,
}: {
	open: boolean
	courses: Course[]
	onClose: () => void
}) {
	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose()
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [open, onClose])

	if (!open || typeof document === "undefined") return null

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-6">
			<button
				type="button"
				aria-label="Đóng"
				onClick={onClose}
				className="absolute inset-0 bg-foreground/45 backdrop-blur-sm"
			/>
			<div className="relative w-full max-w-md rounded-(--radius-card) border-2 border-border bg-card overflow-hidden animate-[popIn_400ms_cubic-bezier(0.34,1.56,0.64,1)]">
				<div className="px-7 pt-6 pb-4">
					<p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary-dark">
						Đặt lịch 1-1
					</p>
					<h2 className="mt-2 text-lg font-extrabold text-foreground leading-snug">
						Chọn khóa học để đặt lịch
					</h2>
					<p className="mt-1 text-xs text-muted leading-relaxed">
						Mỗi khóa do 1 giảng viên phụ trách. Chọn khóa bạn muốn đặt buổi 1-1.
					</p>
				</div>
				<div className="px-4 pb-5 pt-1 space-y-2">
					{courses.map((c) => (
						<Link
							key={c.id}
							to="/khoa-hoc/$courseId/dat-lich-1-1"
							params={{ courseId: c.id }}
							onClick={onClose}
							className="group flex items-center gap-3 rounded-(--radius-card) px-3.5 py-3 transition-all hover:bg-background active:translate-y-0"
						>
							<div className="size-10 shrink-0 rounded-xl bg-primary-tint flex items-center justify-center text-primary">
								<Icon name="graduation" size="sm" className="h-5 w-auto" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-extrabold text-foreground text-sm leading-snug truncate">{c.title}</p>
								<p className="text-xs text-muted mt-0.5 truncate">
									{c.teacher ? `Giảng viên: ${c.teacher.full_name}` : "Chưa có giảng viên"}
								</p>
							</div>
							<span className="shrink-0 text-primary-dark text-sm font-extrabold opacity-60 group-hover:opacity-100 transition-opacity">
								→
							</span>
						</Link>
					))}
				</div>
				<button
					type="button"
					onClick={onClose}
					aria-label="Đóng"
					className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground"
				>
					<Icon name="close" size="xs" />
				</button>
			</div>
		</div>,
		document.body,
	)
}
