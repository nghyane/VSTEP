import {
	AnalyticsUpIcon,
	Book02Icon,
	Clock01Icon,
	DocumentValidationIcon,
	HeadphonesIcon,
	Mic01Icon,
	PencilEdit02Icon,
	Target02Icon,
	TestTube01Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { SpiderChart } from "@/components/common/SpiderChart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useExams } from "@/hooks/use-exams"
import { useProgress, useSpiderChart } from "@/hooks/use-progress"
import { useSubmissions } from "@/hooks/use-submissions"
import { cn } from "@/lib/utils"
import type { Exam, Skill, SubmissionStatus, Trend } from "@/types/api"

export const Route = createFileRoute("/_learner/dashboard")({
	component: LearnerDashboard,
})

interface BlueprintSection {
	questionIds: string[]
}

type ExamBlueprint = Partial<Record<Skill, BlueprintSection>> & {
	durationMinutes?: number
}

const skillMeta: Record<Skill, { label: string; icon: IconSvgElement }> = {
	listening: { label: "Listening", icon: HeadphonesIcon },
	reading: { label: "Reading", icon: Book02Icon },
	writing: { label: "Writing", icon: PencilEdit02Icon },
	speaking: { label: "Speaking", icon: Mic01Icon },
}

const skillColor: Record<Skill, string> = {
	listening: "bg-skill-listening/15 text-skill-listening",
	reading: "bg-skill-reading/15 text-skill-reading",
	writing: "bg-skill-writing/15 text-skill-writing",
	speaking: "bg-skill-speaking/15 text-skill-speaking",
}

const SKILL_ORDER: Skill[] = ["listening", "reading", "writing", "speaking"]

const skillColorText: Record<Skill, string> = {
	listening: "text-skill-listening",
	reading: "text-skill-reading",
	writing: "text-skill-writing",
	speaking: "text-skill-speaking",
}

const trendDisplay: Record<Trend, { text: string; className: string }> = {
	improving: { text: "↑ Tiến bộ", className: "text-success" },
	stable: { text: "→ Ổn định", className: "text-muted-foreground" },
	declining: { text: "↓ Giảm", className: "text-destructive" },
	inconsistent: { text: "~ Không đều", className: "text-warning" },
	insufficient_data: { text: "— Chưa đủ", className: "text-muted-foreground" },
}

const statusConfig: Record<
	SubmissionStatus,
	{ label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
	pending: { label: "Đang chờ", variant: "secondary" },
	processing: { label: "Đang xử lý", variant: "secondary" },
	completed: { label: "Hoàn thành", variant: "outline" },
	review_pending: { label: "Chờ chấm", variant: "secondary" },
	failed: { label: "Lỗi", variant: "destructive" },
}

function getBlueprint(exam: Exam): ExamBlueprint {
	return exam.blueprint as ExamBlueprint
}

function ExamCard({ exam, skill }: { exam: Exam; skill: Skill }) {
	const bp = getBlueprint(exam)
	const section = bp[skill]
	const questionCount = section?.questionIds.length ?? 0
	const duration = bp.durationMinutes

	return (
		<Link
			to="/exams/$examId"
			params={{ examId: exam.id }}
			className={cn(
				"group relative rounded-xl p-4 transition-colors",
				"bg-muted/30 hover:bg-muted/50",
			)}
		>
			<p className="font-medium">{exam.level} — Đề thi</p>
			<p className="mt-1 text-sm text-muted-foreground">
				{questionCount} câu{duration ? ` • ${duration} phút` : ""}
			</p>
		</Link>
	)
}

function LearnerDashboard() {
	const progress = useProgress()
	const exams = useExams()
	const spiderChart = useSpiderChart()
	const submissions = useSubmissions()

	const isLoading = progress.isLoading || exams.isLoading
	const error = progress.error || exams.error

	if (isLoading) {
		return <p className="py-10 text-center text-muted-foreground">Đang tải...</p>
	}

	if (error) {
		return <p className="py-10 text-center text-destructive">Lỗi: {error.message}</p>
	}

	const examList = exams.data?.data ?? []
	const skills = progress.data?.skills ?? []
	const goal = progress.data?.goal

	const totalAttempts = skills.reduce((sum, s) => sum + s.attemptCount, 0)
	const dailyGoalMinutes = goal?.dailyStudyTimeMinutes ?? 45
	const recentSubmissions = submissions.data?.data ?? []

	const spiderSkills = spiderChart.data
		? SKILL_ORDER.map((skill) => ({
				label: skillMeta[skill].label,
				value: spiderChart.data?.skills[skill]?.current ?? 0,
				color: skillColorText[skill],
			}))
		: []

	function examsForSkill(skill: Skill) {
		return examList.filter((e) => {
			const bp = getBlueprint(e)
			const section = bp[skill]
			return section && section.questionIds.length > 0
		})
	}

	return (
		<div className="grid gap-10 lg:grid-cols-[1fr_300px]">
			{/* Left — content */}
			<div className="space-y-10">
				{/* Skill progress bars */}
				<div className="space-y-3">
					<h2 className="text-lg font-bold">Kỹ năng của bạn</h2>
					<div className="grid gap-3 sm:grid-cols-2">
						{SKILL_ORDER.map((skill) => {
							const sp = skills.find((s) => s.skill === skill)
							const spiderSkill = spiderChart.data?.skills[skill]
							if (!sp) return null
							const trend = spiderSkill ? trendDisplay[spiderSkill.trend] : null
							return (
								<Link
									key={skill}
									to="/progress/$skill"
									params={{ skill }}
									className={cn(
										"flex items-center gap-3 rounded-xl p-4 transition-colors",
										"bg-muted/30 hover:bg-muted/50",
									)}
								>
									<div
										className={cn(
											"flex size-9 items-center justify-center rounded-lg",
											skillColor[skill],
										)}
									>
										<HugeiconsIcon icon={skillMeta[skill].icon} className="size-5" />
									</div>
									<div className="flex-1">
										<div className="flex items-center justify-between">
											<span className="font-medium">{skillMeta[skill].label}</span>
											<span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
												{sp.currentLevel ?? "—"}
											</span>
										</div>
										<div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
											<span>{sp.attemptCount} bài</span>
											{trend && <span className={trend.className}>{trend.text}</span>}
										</div>
									</div>
								</Link>
							)
						})}
					</div>
				</div>

				{/* Exam cards by skill */}
				{SKILL_ORDER.map((skill) => {
					const meta = skillMeta[skill]
					const skillExams = examsForSkill(skill)
					if (skillExams.length === 0) return null

					return (
						<div key={skill}>
							<div className="mb-4 flex items-center gap-3">
								<div
									className={cn(
										"flex size-9 items-center justify-center rounded-lg",
										skillColor[skill],
									)}
								>
									<HugeiconsIcon icon={meta.icon} className="size-5" />
								</div>
								<h2 className="text-lg font-bold">{meta.label}</h2>
							</div>
							<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
								{skillExams.map((exam) => (
									<ExamCard key={exam.id} exam={exam} skill={skill} />
								))}
							</div>
						</div>
					)
				})}

				{/* Recent submissions */}
				{recentSubmissions.length > 0 && (
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-bold">Bài nộp gần đây</h2>
							<Link to="/submissions" className="text-sm text-primary hover:underline">
								Xem tất cả
							</Link>
						</div>
						<div className="space-y-2">
							{recentSubmissions.slice(0, 5).map((s) => (
								<Link
									key={s.id}
									to="/submissions/$id"
									params={{ id: s.id }}
									className="flex items-center gap-3 rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
								>
									<div
										className={cn(
											"flex size-8 items-center justify-center rounded-lg",
											skillColor[s.skill],
										)}
									>
										<HugeiconsIcon icon={skillMeta[s.skill].icon} className="size-4" />
									</div>
									<div className="flex-1">
										<span className="text-sm font-medium">{skillMeta[s.skill].label}</span>
										<p className="text-xs text-muted-foreground">
											{new Date(s.createdAt).toLocaleDateString("vi-VN")}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-sm font-bold tabular-nums">
											{s.score != null ? `${s.score}/10` : "—"}
										</span>
										<Badge variant={statusConfig[s.status].variant}>
											{statusConfig[s.status].label}
										</Badge>
									</div>
								</Link>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Right — sticky sidebar */}
			<div className="hidden space-y-6 lg:block">
				<div className="sticky top-24 space-y-6">
					{/* Daily goal */}
					<div className="rounded-2xl bg-muted/30 p-5">
						<div className="mb-3 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<HugeiconsIcon icon={Target02Icon} className="size-4 text-primary" />
								<span className="text-sm font-medium">Mục tiêu hôm nay</span>
							</div>
							<span className="text-sm text-muted-foreground">{dailyGoalMinutes} phút</span>
						</div>
						{goal && (
							<p className="text-xs text-muted-foreground">
								Mục tiêu: {goal.targetBand}
								{goal.deadline && ` — Hạn: ${new Date(goal.deadline).toLocaleDateString("vi-VN")}`}
							</p>
						)}
					</div>

					{/* Spider chart */}
					{spiderSkills.length > 0 && (
						<div className="rounded-2xl bg-muted/30 p-5">
							<h3 className="mb-2 text-sm font-medium">Tổng quan kỹ năng</h3>
							<SpiderChart skills={spiderSkills} className="mx-auto size-52" />
						</div>
					)}

					{/* Quick stats */}
					<div className="space-y-4 px-1">
						<div className="flex items-center gap-3">
							<div className="flex size-8 items-center justify-center rounded-lg bg-muted">
								<HugeiconsIcon icon={TestTube01Icon} className="size-4 text-muted-foreground" />
							</div>
							<p className="text-sm font-medium">{totalAttempts} bài đã làm</p>
						</div>
						<div className="flex items-center gap-3">
							<div className="flex size-8 items-center justify-center rounded-lg bg-muted">
								<HugeiconsIcon icon={Clock01Icon} className="size-4 text-muted-foreground" />
							</div>
							<p className="text-sm font-medium">{skills.length} kỹ năng đang luyện</p>
						</div>
					</div>

					{/* Quick actions */}
					<div className="space-y-2">
						<Button variant="outline" className="w-full justify-start gap-2" asChild>
							<Link to="/exams">
								<HugeiconsIcon icon={DocumentValidationIcon} className="size-4" />
								Bắt đầu bài mới
							</Link>
						</Button>
						<Button variant="outline" className="w-full justify-start gap-2" asChild>
							<Link to="/progress">
								<HugeiconsIcon icon={AnalyticsUpIcon} className="size-4" />
								Xem tiến độ
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
