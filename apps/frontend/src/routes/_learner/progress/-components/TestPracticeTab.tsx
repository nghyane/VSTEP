import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useExamSessions } from "@/hooks/use-exam-session"
import { type useProgress, useSkillDetail, type useSpiderChart } from "@/hooks/use-progress"
import { cn } from "@/lib/utils"
import type { Skill } from "@/types/api"
import {
	SKILL_COLORS,
	SKILLS,
	scoreChartConfig,
	skillColor,
	skillColorText,
} from "./progress-constants"

export function TestPracticeTab({
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
			<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
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
							<Link key={key} to="/progress/$skill" params={{ skill: key }} className="rounded-xl border bg-background p-4 transition-colors hover:border-primary/30">
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
							</Link>
						)
					})}
				</div>
				<p className="mt-4 text-center text-xs text-muted-foreground">
					Điểm số được tính trên thang điểm VSTEP
				</p>
			</div>

			{/* Section 2: Score Tracking Line Chart */}
			<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
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
										<title>Đã chọn</title>
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
			<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
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
															className={cn("text-xs font-medium", skillColorText[skillInfo.key])}
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
