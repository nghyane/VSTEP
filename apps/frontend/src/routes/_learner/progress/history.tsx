import {
	Book02Icon,
	Calendar03Icon,
	HeadphonesIcon,
	Mic01Icon,
	PencilEdit02Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { lazy, Suspense, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useExamSessions } from "@/hooks/use-exam-session"
import { useProgress, useSpiderChart } from "@/hooks/use-progress"
import { cn } from "@/lib/utils"
import type { ExamSessionWithExam, Skill } from "@/types/api"

const SpiderChart = lazy(() =>
	import("@/components/common/SpiderChart").then((module) => ({ default: module.SpiderChart })),
)

const DoughnutChart = lazy(() =>
	import("@/components/common/DoughnutChart").then((module) => ({ default: module.DoughnutChart })),
)

const DoughnutLegend = lazy(() =>
	import("@/components/common/DoughnutChart").then((module) => ({
		default: module.DoughnutLegend,
	})),
)

export const Route = createFileRoute("/_learner/progress/history")({
	component: TestHistoryPage,
})

const SKILLS: { key: Skill; label: string; icon: IconSvgElement }[] = [
	{ key: "listening", label: "Listening", icon: HeadphonesIcon },
	{ key: "reading", label: "Reading", icon: Book02Icon },
	{ key: "writing", label: "Writing", icon: PencilEdit02Icon },
	{ key: "speaking", label: "Speaking", icon: Mic01Icon },
]

const SKILL_COLORS: Record<Skill, string> = {
	listening: "var(--skill-listening)",
	reading: "var(--skill-reading)",
	writing: "var(--skill-writing)",
	speaking: "var(--skill-speaking)",
}

const skillColor: Record<Skill, string> = {
	listening: "bg-skill-listening/15 text-skill-listening",
	reading: "bg-skill-reading/15 text-skill-reading",
	writing: "bg-skill-writing/15 text-skill-writing",
	speaking: "bg-skill-speaking/15 text-skill-speaking",
}

const skillColorText: Record<Skill, string> = {
	listening: "text-skill-listening",
	reading: "text-skill-reading",
	writing: "text-skill-writing",
	speaking: "text-skill-speaking",
}

function TestHistoryPage() {
	const spider = useSpiderChart()
	const progress = useProgress()
	const [page, setPage] = useState(1)
	const sessions = useExamSessions({ status: "completed", limit: 20, page })

	const isLoading = spider.isLoading || progress.isLoading || sessions.isLoading
	const error = spider.error || progress.error || sessions.error

	if (isLoading) {
		return <p className="py-10 text-center text-muted-foreground">Đang tải...</p>
	}

	if (error) {
		return <p className="py-10 text-center text-destructive">Lỗi: {error.message}</p>
	}

	const spiderData = spider.data
	const progressData = progress.data
	const sessionList = sessions.data?.data ?? []
	const totalPages = sessions.data?.meta.totalPages ?? 1

	return (
		<div className="space-y-4">
			{/* Back link */}
			<Link
				to="/progress"
				className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				← Tiến độ
			</Link>

			<div className="grid gap-6 lg:grid-cols-[380px_1fr]">
				{/* Left column: Charts */}
				<div className="space-y-6">
					<h2 className="text-xl font-bold">Thống kê điểm số</h2>
					<SpiderChartCard spiderData={spiderData} />
					<DoughnutChartCard progressData={progressData} />
					<Link
						to="/progress"
						className="block text-center text-sm font-medium text-primary hover:underline"
					>
						Xem Learning Profile →
					</Link>
				</div>

				{/* Right column: History */}
				<div className="space-y-4">
					<h2 className="text-xl font-bold">Lịch sử Test Practice</h2>
					<SessionHistory
						sessions={sessionList}
						page={page}
						totalPages={totalPages}
						onPageChange={setPage}
					/>
				</div>
			</div>
		</div>
	)
}

// ---------- Left Column Components ----------

function SpiderChartCard({
	spiderData,
}: {
	spiderData: ReturnType<typeof useSpiderChart>["data"]
}) {
	const spiderSkills = spiderData
		? SKILLS.map(({ key, label }) => ({
				label,
				value: spiderData.skills[key]?.current ?? 0,
				color: skillColorText[key],
			}))
		: []

	if (spiderSkills.length === 0) return null

	return (
		<div className="rounded-xl border bg-card p-5">
			<h3 className="mb-1 text-sm font-semibold">Điểm trung bình theo kỹ năng</h3>
			<div className="flex justify-center">
				<Suspense fallback={<Skeleton className="size-64 rounded-2xl" />}>
					<SpiderChart skills={spiderSkills} className="size-64" />
				</Suspense>
			</div>
		</div>
	)
}

function DoughnutChartCard({
	progressData,
}: {
	progressData: ReturnType<typeof useProgress>["data"]
}) {
	const segments = SKILLS.map(({ key, label }) => {
		const sk = progressData?.skills.find((s) => s.skill === key)
		return {
			label,
			value: sk?.attemptCount ?? 0,
			color: SKILL_COLORS[key],
		}
	})
	const total = segments.reduce((s, seg) => s + seg.value, 0)

	return (
		<div className="rounded-xl border bg-card p-5">
			<h3 className="mb-3 text-sm font-semibold">Điểm trung bình theo kỹ năng</h3>
			<div className="flex items-center gap-6">
				<div className="w-36 shrink-0">
					<Suspense fallback={<Skeleton className="h-[140px] w-full rounded-2xl" />}>
						<DoughnutChart
							segments={segments}
							centerLabel="Tổng số bài test"
							centerValue={total}
							innerRadius={35}
							className="max-h-[140px]"
						/>
					</Suspense>
				</div>
				<Suspense
					fallback={
						<div className="space-y-2">
							{Array.from({ length: 4 }).map((_, i) => (
								<Skeleton key={i} className="h-4 w-28" />
							))}
						</div>
					}
				>
					<DoughnutLegend segments={segments} className="flex-col items-start" />
				</Suspense>
			</div>
		</div>
	)
}

// ---------- Right Column: Session History ----------

function SessionHistory({
	sessions,
	page,
	totalPages,
	onPageChange,
}: {
	sessions: ExamSessionWithExam[]
	page: number
	totalPages: number
	onPageChange: (p: number) => void
}) {
	// Group sessions by month
	const grouped = sessions.reduce(
		(acc, session) => {
			const date = session.completedAt ? new Date(session.completedAt) : new Date(session.createdAt)
			const monthKey = date.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })
			if (!acc[monthKey]) acc[monthKey] = []
			acc[monthKey].push(session)
			return acc
		},
		{} as Record<string, ExamSessionWithExam[]>,
	)

	if (sessions.length === 0) {
		return (
			<div className="flex h-40 items-center justify-center rounded-xl border text-muted-foreground">
				Chưa có lịch sử test
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{Object.entries(grouped).map(([month, monthSessions]) => (
				<div key={month}>
					<p className="mb-3 text-sm font-semibold text-muted-foreground">{month}</p>
					<div className="space-y-3">
						{monthSessions.map((session) => (
							<SessionCard key={session.id} session={session} />
						))}
					</div>
				</div>
			))}

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-2 pt-2">
					<button
						type="button"
						disabled={page <= 1}
						onClick={() => onPageChange(page - 1)}
						className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
					>
						← Trước
					</button>
					<span className="text-sm text-muted-foreground">
						Trang {page} / {totalPages}
					</span>
					<button
						type="button"
						disabled={page >= totalPages}
						onClick={() => onPageChange(page + 1)}
						className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
					>
						Sau →
					</button>
				</div>
			)}
		</div>
	)
}

function SessionCard({ session }: { session: ExamSessionWithExam }) {
	// Find the primary skill (highest score)
	const scores: { skill: Skill; score: number }[] = []
	if (session.listeningScore != null)
		scores.push({ skill: "listening", score: session.listeningScore })
	if (session.readingScore != null) scores.push({ skill: "reading", score: session.readingScore })
	if (session.writingScore != null) scores.push({ skill: "writing", score: session.writingScore })
	if (session.speakingScore != null)
		scores.push({ skill: "speaking", score: session.speakingScore })
	scores.sort((a, b) => b.score - a.score)

	const best = scores[0]
	const skillInfo = best ? SKILLS.find((s) => s.key === best.skill) : undefined
	const examTitle = session.exam?.title ?? `Bài test #${session.examId.slice(-6).toUpperCase()}`
	const completedDate = session.completedAt ? new Date(session.completedAt) : null

	return (
		<div className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/30">
			{/* Score badge */}
			{best ? (
				<div
					className={cn(
						"flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-bold",
						skillColor[best.skill],
					)}
				>
					{best.score.toFixed(1)}
				</div>
			) : (
				<div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-base font-bold text-muted-foreground">
					—
				</div>
			)}

			{/* Info */}
			<div className="min-w-0 flex-1">
				{skillInfo && (
					<div className="mb-0.5 flex items-center gap-1">
						<HugeiconsIcon
							icon={skillInfo.icon}
							className={cn("size-3.5", best && skillColorText[best.skill])}
						/>
						<span className={cn("text-xs font-medium", best && skillColorText[best.skill])}>
							{skillInfo.label}
						</span>
					</div>
				)}
				<p className="truncate text-sm font-semibold">{examTitle}</p>
				{session.exam && (
					<p className="truncate text-xs text-muted-foreground">{session.exam.type}</p>
				)}
			</div>

			{/* Date */}
			{completedDate && (
				<div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
					<HugeiconsIcon icon={Calendar03Icon} className="size-3.5" />
					<span>
						Ngày làm bài:{" "}
						{completedDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}{" "}
						{completedDate.toLocaleDateString("vi-VN")}
					</span>
				</div>
			)}
		</div>
	)
}
