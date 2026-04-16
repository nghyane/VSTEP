// PracticeTrackView — theo dõi điểm số + lịch sử test, port từ frontend-v1 TestPracticeTab
// Spec: rounded-2xl bg-muted/50 p-5 shadow-sm
// Source: apps/frontend/src/routes/_learner/progress/-components/TestPracticeTab.tsx

import { BookOpen, Headphones, Mic, PencilLine } from "lucide-react"
import { useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "#/components/ui/chart"
import type { PracticeTrackData, TestSession } from "#/lib/mock/overview"
import { cn } from "#/lib/utils"

type Skill = "listening" | "reading" | "writing" | "speaking"

const SKILLS: { key: Skill; label: string; icon: React.ReactNode; colorVar: string }[] = [
	{
		key: "listening",
		label: "Listening",
		icon: <Headphones className="size-4" />,
		colorVar: "var(--skill-listening)",
	},
	{
		key: "reading",
		label: "Reading",
		icon: <BookOpen className="size-4" />,
		colorVar: "var(--skill-reading)",
	},
	{
		key: "writing",
		label: "Writing",
		icon: <PencilLine className="size-4" />,
		colorVar: "var(--skill-writing)",
	},
	{
		key: "speaking",
		label: "Speaking",
		icon: <Mic className="size-4" />,
		colorVar: "var(--skill-speaking)",
	},
]

const scoreChartConfig = {
	listening: { label: "Listening", color: "var(--skill-listening)" },
	reading: { label: "Reading", color: "var(--skill-reading)" },
	writing: { label: "Writing", color: "var(--skill-writing)" },
	speaking: { label: "Speaking", color: "var(--skill-speaking)" },
} satisfies Record<string, { label: string; color: string }>

const skillColor: Record<Skill, string> = {
	listening: "bg-skill-listening/15 text-skill-listening",
	reading: "bg-skill-reading/15 text-skill-reading",
	writing: "bg-skill-writing/15 text-skill-writing",
	speaking: "bg-skill-speaking/15 text-skill-speaking",
}

interface Props {
	data: PracticeTrackData
}

export function PracticeTrackView({ data }: Props) {
	const [mode, setMode] = useState<"practice" | "exam">("practice")
	const [visibleSkills, setVisibleSkills] = useState<Set<Skill>>(
		new Set(["listening", "reading", "writing", "speaking"]),
	)

	// Build line chart data
	const lineData = buildLineData(data.recentScores)

	// Group sessions by date
	const groupedSessions = groupSessionsByDate(data.testSessions)

	function toggleSkill(skill: Skill) {
		setVisibleSkills((prev) => {
			const next = new Set(prev)
			if (next.has(skill)) next.delete(skill)
			else next.add(skill)
			return next
		})
	}

	return (
		<div className="space-y-6">
			{/* Section 1: Average scores by skill */}
			<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
				<div className="mb-4">
					<h3 className="text-lg font-semibold">Điểm trung bình hàng tuần</h3>
					<p className="text-sm text-muted-foreground">So với tuần trước</p>
				</div>
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{SKILLS.map(({ key, label, icon }) => {
						const score = data.spider[key].current
						const attempts = data.skills.find((s) => s.skill === key)?.attemptCount ?? 0
						const hasData = score > 0

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
										{icon}
									</div>
								</div>
								<p className="text-3xl font-bold tabular-nums">
									{hasData ? score.toFixed(1) : "—.—"}
								</p>
								<p className="mt-1 text-xs text-muted-foreground">
									{hasData ? `${attempts} bài test đã hoàn thành` : "Không có dữ liệu"}
								</p>
							</div>
						)
					})}
				</div>
				<p className="mt-4 text-center text-xs text-muted-foreground">
					Điểm số được tính trên thang điểm VSTEP
				</p>
			</div>

			{/* Section 2: Score tracking line chart */}
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
					{SKILLS.map(({ key, label }) => {
						const checked = visibleSkills.has(key)
						return (
							<label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
								<input
									type="checkbox"
									checked={checked}
									onChange={() => toggleSkill(key)}
									className="sr-only"
								/>
								<span
									className={cn(
										"flex size-4 items-center justify-center rounded border-2 transition-colors",
										checked ? "border-transparent" : "border-muted-foreground/30 bg-transparent",
									)}
									style={
										checked
											? {
													backgroundColor: SKILLS.find((s) => s.key === key)?.colorVar,
													borderColor: SKILLS.find((s) => s.key === key)?.colorVar,
												}
											: undefined
									}
								>
									{checked && (
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
						)
					})}
				</div>

				{lineData.length > 0 ? (
					<ChartContainer config={scoreChartConfig} className="aspect-auto h-[280px] w-full">
						<LineChart data={lineData} margin={{ left: 12, right: 12, top: 12, bottom: 0 }}>
							<CartesianGrid vertical={false} strokeDasharray="3 3" />
							<XAxis dataKey="index" tickLine={false} axisLine={false} tickMargin={8} />
							<YAxis domain={[0, 10]} tickLine={false} axisLine={false} tickMargin={8} />
							<ChartTooltip content={<ChartTooltipContent />} />
							{SKILLS.filter((s) => visibleSkills.has(s.key)).map((s) => (
								<Line
									key={s.key}
									type="monotone"
									dataKey={s.key}
									stroke={s.colorVar}
									strokeWidth={2}
									dot={{ r: 4 }}
									connectNulls
								/>
							))}
						</LineChart>
					</ChartContainer>
				) : (
					<div className="flex h-[280px] items-center justify-center text-muted-foreground">
						Không có dữ liệu
					</div>
				)}
			</div>

			{/* Section 3: Test history */}
			<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
				<div className="mb-4 flex items-center justify-between">
					<div>
						<h3 className="text-lg font-semibold">Lịch sử Test Practice</h3>
						<p className="text-sm text-muted-foreground">Dựa trên 30 ngày qua</p>
					</div>
				</div>

				{data.testSessions.length > 0 ? (
					<div className="relative pl-6">
						<div className="absolute left-[5px] top-1 bottom-1 border-l-2 border-dashed border-border" />

						{Object.entries(groupedSessions).map(([date, sessions], groupIdx) => (
							<div key={date} className={cn("relative", groupIdx > 0 && "mt-6")}>
								<div className="absolute -left-6 top-0.5 z-10 size-3 rounded-full bg-primary ring-4 ring-card" />
								<p className="mb-3 text-sm font-semibold text-foreground">{date}</p>
								<div className="space-y-3">
									{sessions.map((session) => (
										<SessionRow key={session.id} session={session} />
									))}
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
		</div>
	)
}

// ─── Helpers ────────────────────────────────────────────────────

function buildLineData(recentScores: Record<Skill, ScoreEntry[]>): {
	index: string
	listening: number | null
	reading: number | null
	writing: number | null
	speaking: number | null
}[] {
	const maxLen = Math.max(...SKILLS.map((s) => recentScores[s.key]?.length ?? 0))
	return Array.from({ length: maxLen }, (_, i) => {
		const entry = { index: `#${i + 1}` }
		for (const s of SKILLS) {
			const scores = [...(recentScores[s.key] ?? [])].reverse()
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			;(entry as any)[s.key] = scores[i]?.score ?? null
		}
		return entry
	})
}

function groupSessionsByDate(sessions: TestSession[]): Record<string, TestSession[]> {
	return sessions.reduce(
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
		{} as Record<string, TestSession[]>,
	)
}

function SessionRow({ session }: { session: TestSession }) {
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

	return (
		<div className="flex items-center gap-3 rounded-lg border p-3">
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
					<span className={cn("text-xs font-medium", skillColor[skillInfo.key])}>
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
}
