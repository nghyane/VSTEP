import {
	ArrowRight01Icon,
	Book02Icon,
	CheckmarkCircle02Icon,
	Clock01Icon,
	Fire02Icon,
	HeadphonesIcon,
	Mic01Icon,
	PencilEdit02Icon,
	PlusSignIcon,
	Target02Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { ActivityHeatmap } from "@/components/common/ActivityHeatmap"
import { DoughnutChart, DoughnutLegend } from "@/components/common/DoughnutChart"
import { SpiderChart } from "@/components/common/SpiderChart"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useExamSessions } from "@/hooks/use-exam-session"
import {
	useActivity,
	useCreateGoal,
	useLearningPath,
	useProgress,
	useSkillDetail,
	useSpiderChart,
} from "@/hooks/use-progress"
import { useUser } from "@/hooks/use-user"
import { user as getAuthUser } from "@/lib/auth"
import { avatarUrl, getInitials } from "@/lib/avatar"
import { cn } from "@/lib/utils"
import type { EnrichedGoal, Skill, VstepBand } from "@/types/api"

export const Route = createFileRoute("/_learner/progress/")({
	component: ProgressOverviewPage,
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

const scoreChartConfig = {
	listening: { label: "Listening", color: "var(--skill-listening)" },
	reading: { label: "Reading", color: "var(--skill-reading)" },
	writing: { label: "Writing", color: "var(--skill-writing)" },
	speaking: { label: "Speaking", color: "var(--skill-speaking)" },
} satisfies ChartConfig

function ProgressOverviewPage() {
	const currentUser = getAuthUser()
	const { data: userData } = useUser(currentUser?.id ?? "")
	const spider = useSpiderChart()
	const progress = useProgress()
	const activity = useActivity(90)

	const isLoading = spider.isLoading || progress.isLoading || activity.isLoading
	const error = spider.error || progress.error || activity.error

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div>
					<Skeleton className="h-8 w-48" />
					<Skeleton className="mt-1 h-5 w-72" />
				</div>
				<Skeleton className="h-24 rounded-2xl" />
				<Skeleton className="h-10 rounded-lg" />
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-20 rounded-2xl" />
					))}
				</div>
				<Skeleton className="h-48 rounded-2xl" />
				<div className="grid gap-6 md:grid-cols-2">
					<Skeleton className="h-72 rounded-2xl" />
					<Skeleton className="h-72 rounded-2xl" />
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="rounded-2xl bg-muted/50 p-12 text-center">
				<p className="text-lg font-semibold">Đã xảy ra lỗi</p>
				<p className="mt-1 text-muted-foreground">{error.message}</p>
			</div>
		)
	}

	const spiderData = spider.data
	const progressData = progress.data
	const activityData = activity.data

	const initials = getInitials(currentUser?.fullName, currentUser?.email)
	const avatarSrc = avatarUrl(userData?.avatarKey, currentUser?.fullName)

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div>
				<h1 className="text-2xl font-bold">Tiến độ học tập</h1>
				<p className="mt-1 text-muted-foreground">Theo dõi quá trình học và đặt mục tiêu</p>
			</div>

			{/* Profile Card */}
			<div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-8 py-8">
				<div className="relative z-10 flex items-center gap-5">
					<Avatar className="size-16 border-2 border-white/30 shadow-lg">
						<AvatarImage src={avatarSrc} alt={currentUser?.fullName ?? "Avatar"} />
						<AvatarFallback className="bg-white/20 text-lg font-bold text-white">
							{initials}
						</AvatarFallback>
					</Avatar>
					<div>
						<h2 className="text-2xl font-bold text-white">Hi, {currentUser?.fullName ?? "Bạn"}</h2>
						<p className="mt-1 text-sm text-white/80">
							Hãy tiếp tục học mỗi ngày — nỗ lực của bạn sẽ được đền đáp!
						</p>
					</div>
				</div>
				<div className="absolute -top-8 -right-8 size-32 rounded-full bg-white/5" />
				<div className="absolute -bottom-4 -right-4 size-20 rounded-full bg-white/5" />
			</div>

			{/* Tabs */}
			<Tabs defaultValue="overview">
				<TabsList variant="line" className="w-full">
					<TabsTrigger
						value="overview"
						className="flex-1 text-muted-foreground data-[state=active]:!bg-transparent data-[state=active]:!text-muted-foreground data-[state=active]:!shadow-none"
					>
						Tổng Quát
					</TabsTrigger>
					<TabsTrigger
						value="test-practice"
						className="flex-1 text-muted-foreground data-[state=active]:!bg-transparent data-[state=active]:!text-muted-foreground data-[state=active]:!shadow-none"
					>
						Test Practice
					</TabsTrigger>
					<TabsTrigger
						value="learning-path"
						className="flex-1 text-muted-foreground data-[state=active]:!bg-transparent data-[state=active]:!text-muted-foreground data-[state=active]:!shadow-none"
					>
						Lộ trình
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="mt-6 space-y-6">
					<OverviewTab
						spiderData={spiderData}
						progressData={progressData}
						activityData={activityData}
					/>
				</TabsContent>

				<TabsContent value="test-practice" className="mt-6 space-y-6">
					<TestPracticeTab spiderData={spiderData} progressData={progressData} />
				</TabsContent>

				<TabsContent value="learning-path" className="mt-6 space-y-6">
					<LearningPathTab />
				</TabsContent>
			</Tabs>
		</div>
	)
}

// ---------- Overview Tab ----------

function OverviewTab({
	spiderData,
	progressData,
	activityData,
}: {
	spiderData: ReturnType<typeof useSpiderChart>["data"]
	progressData: ReturnType<typeof useProgress>["data"]
	activityData: ReturnType<typeof useActivity>["data"]
}) {
	const totalTests = progressData?.skills.reduce((s, sk) => s + sk.attemptCount, 0) ?? 0
	const studyMinutes = activityData?.totalStudyTimeMinutes ?? 0
	const studyLabel =
		studyMinutes >= 60
			? `${Math.floor(studyMinutes / 60)} giờ ${studyMinutes % 60 > 0 ? `${studyMinutes % 60} phút` : ""}`
			: `${studyMinutes} phút`

	return (
		<>
			{/* Stats Row */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<StatCard
					icon={Clock01Icon}
					iconBg="bg-primary/10 text-primary"
					label="Tổng thời lượng"
					value={studyLabel}
					valueColor="text-primary"
				/>
				<StatCard
					icon={Target02Icon}
					iconBg="bg-warning/10 text-warning"
					label="Tổng bài tập"
					value={String(activityData?.totalExercises ?? 0)}
					valueColor="text-warning"
				/>
				<StatCard
					icon={PencilEdit02Icon}
					iconBg="bg-destructive/10 text-destructive"
					label="Tổng số bài test"
					value={String(totalTests)}
					valueColor="text-destructive"
				/>
				<StatCard
					icon={Fire02Icon}
					iconBg="bg-success/10 text-success"
					label="Streak"
					value={`${activityData?.streak ?? 0} ngày`}
					valueColor="text-success"
				/>
			</div>

			{/* Activity Heatmap */}
			<ActivityHeatmap activeDays={activityData?.activeDays ?? []} />

			{/* Goal Card */}
			<GoalCard goal={progressData?.goal ?? null} />

			{/* Spider Chart + Doughnut Chart */}
			<div className="grid gap-6 md:grid-cols-2">
				<SpiderChartCard spiderData={spiderData} />
				<DoughnutChartCard progressData={progressData} />
			</div>
		</>
	)
}

// ---------- Test Practice Tab ----------

function TestPracticeTab({
	spiderData,
	progressData,
}: {
	spiderData: ReturnType<typeof useSpiderChart>["data"]
	progressData: ReturnType<typeof useProgress>["data"]
}) {
	const listeningDetail = useSkillDetail("listening")
	const readingDetail = useSkillDetail("reading")
	const writingDetail = useSkillDetail("writing")
	const speakingDetail = useSkillDetail("speaking")
	const sessions = useExamSessions({ status: "completed", limit: 10 })

	const [mode, setMode] = useState<"practice" | "exam">("practice")
	const [visibleSkills, setVisibleSkills] = useState(
		new Set(["listening", "reading", "writing", "speaking"]),
	)

	// Build line chart data
	const listeningScores = [...(listeningDetail.data?.recentScores ?? [])].reverse()
	const readingScores = [...(readingDetail.data?.recentScores ?? [])].reverse()
	const writingScores = [...(writingDetail.data?.recentScores ?? [])].reverse()
	const speakingScores = [...(speakingDetail.data?.recentScores ?? [])].reverse()
	const maxLen = Math.max(
		listeningScores.length,
		readingScores.length,
		writingScores.length,
		speakingScores.length,
	)
	const lineData = Array.from({ length: maxLen }, (_, i) => ({
		index: `#${i + 1}`,
		listening: listeningScores[i]?.score ?? null,
		reading: readingScores[i]?.score ?? null,
		writing: writingScores[i]?.score ?? null,
		speaking: speakingScores[i]?.score ?? null,
	}))

	// Group sessions by date
	const sessionList = sessions.data?.data ?? []
	const groupedSessions = sessionList.reduce(
		(acc, session) => {
			const dateKey = session.completedAt
				? new Date(session.completedAt).toLocaleDateString("vi-VN", {
						weekday: "long",
						day: "numeric",
						month: "long",
						year: "numeric",
					})
				: "Không rõ ngày"
			if (!acc[dateKey]) acc[dateKey] = []
			acc[dateKey].push(session)
			return acc
		},
		{} as Record<string, typeof sessionList>,
	)

	const toggleSkill = (skill: string) => {
		setVisibleSkills((prev) => {
			const next = new Set(prev)
			if (next.has(skill)) next.delete(skill)
			else next.add(skill)
			return next
		})
	}

	return (
		<>
			{/* Section 1: Weekly Average Scores */}
			<div className="rounded-2xl bg-muted/50 p-5">
				<div className="mb-4">
					<h3 className="text-lg font-semibold">Điểm trung bình hàng tuần</h3>
					<p className="text-sm text-muted-foreground">So với tuần trước</p>
				</div>
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{SKILLS.map(({ key, label, icon }) => {
						const score = spiderData?.skills[key]?.current
						const attempts = progressData?.skills.find((s) => s.skill === key)?.attemptCount
						const hasData = score != null && score > 0

						return (
							<div key={key} className="rounded-xl border bg-background p-4">
								<div className="mb-3 flex items-center justify-between">
									<span className="text-sm font-medium text-muted-foreground">{label}</span>
									<div
										className={cn(
											"flex size-8 items-center justify-center rounded-lg",
											skillColor[key],
										)}
									>
										<HugeiconsIcon icon={icon} className="size-4" />
									</div>
								</div>
								<p className="text-3xl font-bold tabular-nums">
									{hasData ? score.toFixed(1) : "—.—"}
								</p>
								<p className="mt-1 text-xs text-muted-foreground">
									{hasData ? `${attempts ?? 0} bài test đã hoàn thành` : "Không có dữ liệu"}
								</p>
							</div>
						)
					})}
				</div>
				<p className="mt-4 text-center text-xs text-muted-foreground">
					Điểm số được tính trên thang điểm VSTEP
				</p>
			</div>

			{/* Section 2: Score Tracking Line Chart */}
			<div className="rounded-2xl bg-muted/50 p-5">
				<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
					<div>
						<h3 className="text-lg font-semibold">Theo dõi điểm số</h3>
						<p className="text-sm text-muted-foreground">Dựa trên 10 bài test gần nhất</p>
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => setMode("practice")}
							className={cn(
								"rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
								mode === "practice"
									? "bg-primary text-primary-foreground"
									: "border text-muted-foreground hover:bg-muted",
							)}
						>
							Chế độ luyện tập
						</button>
						<button
							type="button"
							onClick={() => setMode("exam")}
							className={cn(
								"rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
								mode === "exam"
									? "bg-primary text-primary-foreground"
									: "border text-muted-foreground hover:bg-muted",
							)}
						>
							Chế độ phòng thi
						</button>
					</div>
				</div>

				{/* Skill toggle checkboxes */}
				<div className="mb-4 flex flex-wrap gap-4">
					{SKILLS.map(({ key, label }) => (
						<label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
							<input
								type="checkbox"
								checked={visibleSkills.has(key)}
								onChange={() => toggleSkill(key)}
								className="sr-only"
							/>
							<span
								className={cn(
									"flex size-4 items-center justify-center rounded border-2 transition-colors",
									visibleSkills.has(key)
										? "border-transparent"
										: "border-muted-foreground/30 bg-transparent",
								)}
								style={
									visibleSkills.has(key)
										? { backgroundColor: SKILL_COLORS[key], borderColor: SKILL_COLORS[key] }
										: undefined
								}
							>
								{visibleSkills.has(key) && (
									<svg className="size-3 text-white" viewBox="0 0 12 12" fill="none">
										<path
											d="M2 6l3 3 5-5"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								)}
							</span>
							{label}
						</label>
					))}
				</div>

				{lineData.length > 0 ? (
					<ChartContainer config={scoreChartConfig} className="aspect-auto h-[280px] w-full">
						<LineChart data={lineData} margin={{ left: 12, right: 12, top: 12, bottom: 0 }}>
							<CartesianGrid vertical={false} strokeDasharray="3 3" />
							<XAxis dataKey="index" tickLine={false} axisLine={false} tickMargin={8} />
							<YAxis domain={[0, 10]} tickLine={false} axisLine={false} tickMargin={8} />
							<ChartTooltip content={<ChartTooltipContent />} />
							{visibleSkills.has("listening") && (
								<Line
									type="monotone"
									dataKey="listening"
									stroke="var(--color-listening)"
									strokeWidth={2}
									dot={{ r: 4 }}
									connectNulls
								/>
							)}
							{visibleSkills.has("reading") && (
								<Line
									type="monotone"
									dataKey="reading"
									stroke="var(--color-reading)"
									strokeWidth={2}
									dot={{ r: 4 }}
									connectNulls
								/>
							)}
							{visibleSkills.has("writing") && (
								<Line
									type="monotone"
									dataKey="writing"
									stroke="var(--color-writing)"
									strokeWidth={2}
									dot={{ r: 4 }}
									connectNulls
								/>
							)}
							{visibleSkills.has("speaking") && (
								<Line
									type="monotone"
									dataKey="speaking"
									stroke="var(--color-speaking)"
									strokeWidth={2}
									dot={{ r: 4 }}
									connectNulls
								/>
							)}
						</LineChart>
					</ChartContainer>
				) : (
					<div className="flex h-[280px] items-center justify-center text-muted-foreground">
						Không có dữ liệu
					</div>
				)}
			</div>

			{/* Section 3: Test Practice History */}
			<div className="rounded-2xl bg-muted/50 p-5">
				<div className="mb-4 flex items-center justify-between">
					<div>
						<h3 className="text-lg font-semibold">Lịch sử Test Practice</h3>
						<p className="text-sm text-muted-foreground">Dựa trên 30 ngày qua</p>
					</div>
					<Link to="/progress/history" className="text-sm font-medium text-primary hover:underline">
						Xem tất cả →
					</Link>
				</div>

				{sessionList.length > 0 ? (
					<div className="relative pl-6">
						{/* Continuous dashed line from first dot to last dot */}
						<div className="absolute left-[5px] top-1 bottom-1 border-l-2 border-dashed border-border" />

						{Object.entries(groupedSessions).map(([date, dateSessions], groupIdx) => (
							<div key={date} className={cn("relative", groupIdx > 0 && "mt-6")}>
								{/* Blue dot */}
								<div className="absolute -left-6 top-0.5 z-10 size-3 rounded-full bg-primary ring-4 ring-card" />
								<p className="mb-3 text-sm font-semibold text-foreground">{date}</p>
								<div className="space-y-3">
									{dateSessions.map((session) => {
										const scores: { skill: Skill; score: number }[] = []
										if (session.listeningScore != null)
											scores.push({ skill: "listening", score: session.listeningScore })
										if (session.readingScore != null)
											scores.push({ skill: "reading", score: session.readingScore })
										if (session.writingScore != null)
											scores.push({ skill: "writing", score: session.writingScore })
										if (session.speakingScore != null)
											scores.push({ skill: "speaking", score: session.speakingScore })
										scores.sort((a, b) => b.score - a.score)
										const best = scores[0]
										const skillInfo = best ? SKILLS.find((s) => s.key === best.skill) : undefined

										return (
											<div
												key={session.id}
												className="flex items-center gap-3 rounded-lg border p-3"
											>
												{best ? (
													<div
														className={cn(
															"flex size-10 items-center justify-center rounded-lg text-sm font-bold",
															skillColor[best.skill],
														)}
													>
														{best.score.toFixed(1)}
													</div>
												) : (
													<div className="flex size-10 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
														—
													</div>
												)}
												<div className="min-w-0 flex-1">
													{skillInfo && (
														<span
															className={cn("text-xs font-medium", skillColorText[best!.skill])}
														>
															{skillInfo.label}
														</span>
													)}
													<p className="truncate text-sm font-medium">
														Bài test #{session.examId.slice(-6).toUpperCase()}
													</p>
												</div>
												<span className="shrink-0 text-xs text-muted-foreground">
													{session.completedAt
														? new Date(session.completedAt).toLocaleTimeString("vi-VN", {
																hour: "2-digit",
																minute: "2-digit",
															})
														: ""}
												</span>
											</div>
										)
									})}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="flex h-32 items-center justify-center text-muted-foreground">
						Chưa có lịch sử test
					</div>
				)}
			</div>
		</>
	)
}

// ---------- Goal Card ----------

function GoalCard({ goal }: { goal: EnrichedGoal | null }) {
	const [creating, setCreating] = useState(false)

	if (creating) {
		return <GoalForm onCancel={() => setCreating(false)} />
	}

	if (!goal) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-muted/50 p-8">
				<div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
					<HugeiconsIcon icon={Target02Icon} className="size-6" />
				</div>
				<p className="text-sm text-muted-foreground">Bạn chưa đặt mục tiêu học tập</p>
				<Button size="sm" onClick={() => setCreating(true)}>
					<HugeiconsIcon icon={PlusSignIcon} className="size-4" />
					Đặt mục tiêu
				</Button>
			</div>
		)
	}

	const deadlineDate = new Date(goal.deadline)
	const deadlineLabel = deadlineDate.toLocaleDateString("vi-VN", {
		day: "numeric",
		month: "long",
		year: "numeric",
	})
	const isExpired = goal.daysRemaining != null && goal.daysRemaining <= 0

	return (
		<div className="rounded-2xl bg-muted/50 p-5">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<HugeiconsIcon icon={Target02Icon} className="size-5" />
					</div>
					<div>
						<h3 className="text-lg font-semibold">Mục tiêu: {goal.targetBand}</h3>
						<p className="text-sm text-muted-foreground">
							{goal.currentEstimatedBand && `Hiện tại: ${goal.currentEstimatedBand} · `}
							Hạn: {deadlineLabel}
						</p>
					</div>
				</div>
			</div>

			<div className="mt-4 grid grid-cols-3 gap-4">
				<div className="rounded-xl bg-muted/50 p-3 text-center">
					<p className="text-xs text-muted-foreground">Thời gian học/ngày</p>
					<p className="mt-1 text-lg font-bold">{goal.dailyStudyTimeMinutes ?? "—"} phút</p>
				</div>
				<div className="rounded-xl bg-muted/50 p-3 text-center">
					<p className="text-xs text-muted-foreground">Còn lại</p>
					<p className="mt-1 text-lg font-bold">
						{isExpired
							? "Hết hạn"
							: goal.daysRemaining != null
								? `${goal.daysRemaining} ngày`
								: "—"}
					</p>
				</div>
				<div className="rounded-xl bg-muted/50 p-3 text-center">
					<p className="text-xs text-muted-foreground">Tiến độ</p>
					<div className="mt-1 flex items-center justify-center gap-1.5">
						{goal.achieved ? (
							<>
								<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5 text-success" />
								<span className="text-sm font-bold text-success">Đạt</span>
							</>
						) : isExpired ? (
							<>
								<HugeiconsIcon icon={Clock01Icon} className="size-5 text-muted-foreground" />
								<span className="text-sm font-bold text-muted-foreground">Đã kết thúc</span>
							</>
						) : goal.onTrack === true ? (
							<>
								<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5 text-primary" />
								<span className="text-sm font-bold text-primary">Đúng tiến độ</span>
							</>
						) : goal.onTrack === false ? (
							<>
								<HugeiconsIcon icon={Clock01Icon} className="size-5 text-warning" />
								<span className="text-sm font-bold text-warning">Cần cố gắng</span>
							</>
						) : (
							<span className="text-sm font-bold text-muted-foreground">—</span>
						)}
					</div>
				</div>
			</div>

			{isExpired && (
				<div className="mt-4 flex items-center justify-between rounded-xl border border-dashed p-3">
					<p className="text-sm text-muted-foreground">
						Mục tiêu đã kết thúc. Hãy đặt mục tiêu mới!
					</p>
					<Button size="sm" onClick={() => setCreating(true)}>
						<HugeiconsIcon icon={PlusSignIcon} className="size-4" />
						Mục tiêu mới
					</Button>
				</div>
			)}
		</div>
	)
}

function GoalForm({ onCancel }: { onCancel: () => void }) {
	const createGoal = useCreateGoal()
	const [targetBand, setTargetBand] = useState<string>("B2")
	const [deadline, setDeadline] = useState("")
	const [dailyMinutes, setDailyMinutes] = useState("60")

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!deadline) return
		createGoal.mutate(
			{ targetBand, deadline, dailyStudyTimeMinutes: Number(dailyMinutes) || undefined },
			{ onSuccess: onCancel },
		)
	}

	return (
		<form onSubmit={handleSubmit} className="rounded-2xl bg-muted/50 p-5">
			<h3 className="mb-4 text-lg font-semibold">Đặt mục tiêu mới</h3>
			<div className="grid gap-4 sm:grid-cols-3">
				<div className="space-y-1.5">
					<Label>Band mục tiêu</Label>
					<Select value={targetBand} onValueChange={setTargetBand}>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{(["B1", "B2", "C1"] as VstepBand[]).map((b) => (
								<SelectItem key={b} value={b}>
									{b}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1.5">
					<Label>Hạn hoàn thành</Label>
					<Input
						type="date"
						value={deadline}
						onChange={(e) => setDeadline(e.target.value)}
						required
					/>
				</div>
				<div className="space-y-1.5">
					<Label>Phút/ngày</Label>
					<Input
						type="number"
						min={10}
						max={480}
						value={dailyMinutes}
						onChange={(e) => setDailyMinutes(e.target.value)}
					/>
				</div>
			</div>
			<div className="mt-4 flex gap-2">
				<Button type="submit" size="sm" disabled={createGoal.isPending}>
					Tạo mục tiêu
				</Button>
				<Button type="button" variant="outline" size="sm" onClick={onCancel}>
					Hủy
				</Button>
			</div>
		</form>
	)
}

// ---------- Learning Path Tab ----------

function LearningPathTab() {
	const { data, isLoading, error } = useLearningPath()

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-16 rounded-2xl" />
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-48 rounded-2xl" />
				))}
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex h-40 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
				Không thể tải lộ trình: {error.message}
			</div>
		)
	}

	if (!data || data.weeklyPlan.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-muted/50 py-16">
				<div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
					<HugeiconsIcon icon={Book02Icon} className="size-6" />
				</div>
				<p className="text-sm text-muted-foreground">Chưa có lộ trình học tập</p>
				<p className="max-w-xs text-center text-xs text-muted-foreground">
					Hãy đặt mục tiêu và luyện tập thêm để hệ thống tạo lộ trình phù hợp cho bạn.
				</p>
			</div>
		)
	}

	return (
		<>
			{/* Summary banner */}
			<div className="flex flex-wrap items-center gap-4 rounded-2xl bg-muted/50 p-5">
				{data.projectedImprovement && (
					<div className="flex items-center gap-2">
						<HugeiconsIcon icon={ArrowRight01Icon} className="size-5 text-primary" />
						<span className="text-sm font-semibold">{data.projectedImprovement}</span>
					</div>
				)}
				<div className="flex items-center gap-2">
					<HugeiconsIcon icon={Clock01Icon} className="size-5 text-muted-foreground" />
					<span className="text-sm text-muted-foreground">
						{data.totalMinutesPerWeek} phút/tuần
					</span>
				</div>
			</div>

			{/* Skill cards */}
			<div className="space-y-4">
				{data.weeklyPlan.map((plan) => {
					const skillInfo = SKILLS.find((s) => s.key === plan.skill)
					const color = skillColor[plan.skill as Skill] ?? "bg-muted text-muted-foreground"
					const textColor = skillColorText[plan.skill as Skill] ?? "text-muted-foreground"

					return (
						<div key={plan.skill} className="rounded-2xl bg-muted/50 p-5">
							{/* Header */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className={cn("flex size-10 items-center justify-center rounded-xl", color)}>
										{skillInfo && <HugeiconsIcon icon={skillInfo.icon} className="size-5" />}
									</div>
									<div>
										<div className="flex items-center gap-2">
											<h4 className="font-semibold">{skillInfo?.label ?? plan.skill}</h4>
											<Badge variant="secondary" className="text-[10px]">
												#{plan.priority}
											</Badge>
										</div>
										<p className="text-sm text-muted-foreground">
											{plan.currentLevel}
											<span className="mx-1">→</span>
											{plan.targetLevel}
										</p>
									</div>
								</div>
							</div>

							{/* Details */}
							<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
								<div className="rounded-xl bg-muted/50 p-2.5 text-center">
									<p className="text-[10px] text-muted-foreground">Buổi/tuần</p>
									<p className="text-sm font-bold">{plan.sessionsPerWeek}</p>
								</div>
								<div className="rounded-xl bg-muted/50 p-2.5 text-center">
									<p className="text-[10px] text-muted-foreground">Thời lượng</p>
									<p className="text-sm font-bold">{plan.estimatedMinutes} phút</p>
								</div>
								<div className="rounded-xl bg-muted/50 p-2.5 text-center">
									<p className="text-[10px] text-muted-foreground">Cấp độ đề xuất</p>
									<p className="text-sm font-bold">{plan.recommendedLevel}</p>
								</div>
								{plan.focusArea && (
									<div className="rounded-xl bg-muted/50 p-2.5 text-center">
										<p className="text-[10px] text-muted-foreground">Trọng tâm</p>
										<p className="text-sm font-bold">{plan.focusArea}</p>
									</div>
								)}
							</div>

							{/* Weak topics */}
							{plan.weakTopics.length > 0 && (
								<div className="mt-4">
									<p className="mb-2 text-xs font-medium text-muted-foreground">
										Chủ đề cần cải thiện
									</p>
									<div className="space-y-2">
										{plan.weakTopics.map((topic) => (
											<div key={topic.id} className="flex items-center gap-3">
												<span className="w-28 truncate text-xs">{topic.name}</span>
												<div className="h-1.5 flex-1 rounded-full bg-muted">
													<div
														className={cn("h-full rounded-full", textColor.replace("text-", "bg-"))}
														style={{ width: `${Math.min(topic.masteryScore, 100)}%` }}
													/>
												</div>
												<span className="w-8 text-right text-[10px] text-muted-foreground">
													{topic.masteryScore}%
												</span>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)
				})}
			</div>
		</>
	)
}

// ---------- Shared Components ----------

function StatCard({
	icon,
	iconBg,
	label,
	value,
	valueColor,
}: {
	icon: IconSvgElement
	iconBg: string
	label: string
	value: string
	valueColor: string
}) {
	return (
		<div className="rounded-2xl bg-muted/50 p-4">
			<div className="flex items-center gap-3">
				<div className={cn("flex size-10 items-center justify-center rounded-xl", iconBg)}>
					<HugeiconsIcon icon={icon} className="size-5" />
				</div>
				<div>
					<p className="text-sm text-muted-foreground">{label}</p>
					<p className={cn("text-lg font-bold", valueColor)}>{value}</p>
				</div>
			</div>
		</div>
	)
}

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
		<div className="rounded-2xl bg-muted/50 p-5">
			<h3 className="text-lg font-semibold">Điểm trung bình theo kỹ năng</h3>
			<p className="mb-4 text-sm text-muted-foreground">trong Test Practice</p>
			<div className="flex justify-center">
				<SpiderChart skills={spiderSkills} className="size-64" />
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
		<div className="rounded-2xl bg-muted/50 p-5">
			<h3 className="text-lg font-semibold">Tổng số bài test đã hoàn thành</h3>
			<p className="mb-4 text-sm text-muted-foreground">trong Test Practice</p>
			<DoughnutChart segments={segments} centerLabel="Tổng số bài test" centerValue={total} />
			<DoughnutLegend segments={segments} className="mt-4 justify-center" />
		</div>
	)
}
