// PracticeTrackView — theo dõi điểm số + lịch sử test, port từ frontend-v1 TestPracticeTab
// Spec: rounded-2xl bg-muted/50 p-5 shadow-sm
// Source: apps/frontend/src/routes/_learner/progress/-components/TestPracticeTab.tsx

import { BookOpen, Headphones, Mic, PencilLine } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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

const skillColor: Record<Skill, string> = {
	listening: "bg-skill-listening/15 text-skill-listening",
	reading: "bg-skill-reading/15 text-skill-reading",
	writing: "bg-skill-writing/15 text-skill-writing",
	speaking: "bg-skill-speaking/15 text-skill-speaking",
}

const scoreChartConfig = {
	listening: { label: "Listening", color: "var(--skill-listening)" },
	reading: { label: "Reading", color: "var(--skill-reading)" },
	writing: { label: "Writing", color: "var(--skill-writing)" },
	speaking: { label: "Speaking", color: "var(--skill-speaking)" },
} satisfies Record<string, { label: string; color: string }>

interface Props {
	data: PracticeTrackData
}

export function PracticeTrackView({ data }: Props) {
	const groupedSessions = groupSessionsByDate(data.testSessions)

	return (
		<div className="space-y-6">
			{/* Section 1: Average scores by skill */}
			<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
				<div className="mb-4">
					<h3 className="text-lg font-semibold">Điểm trung bình từng kỹ năng</h3>
					<p className="text-sm text-muted-foreground">Thang điểm VSTEP (0–10)</p>
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
			</div>

			{/* Section 2: Stacked bar — mỗi thanh = 1 bài test, 4 phần màu = 4 kỹ năng */}
			<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
				<div className="mb-4">
					<h3 className="text-lg font-semibold">Điểm qua 10 bài test gần nhất</h3>
					<p className="text-sm text-muted-foreground">
						Mỗi thanh là 1 bài test, chia theo 4 kỹ năng
					</p>
				</div>

				<ChartContainer config={scoreChartConfig} className="aspect-auto h-[280px] w-full">
					<BarChart
						data={buildBarData(data.recentScores)}
						margin={{ left: -10, right: 12, top: 12, bottom: 0 }}
						barCategoryGap="20%"
					>
						<CartesianGrid vertical={false} strokeDasharray="3 3" />
						<XAxis dataKey="index" tickLine={false} axisLine={false} tickMargin={10} />
						<YAxis
							domain={[0, 10]}
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickCount={6}
						/>
						<ChartTooltip content={<ChartTooltipContent />} />
						<Bar
							dataKey="listening"
							stackId="score"
							fill="var(--skill-listening)"
							radius={[0, 0, 4, 4]}
						/>
						<Bar dataKey="reading" stackId="score" fill="var(--skill-reading)" radius={0} />
						<Bar dataKey="writing" stackId="score" fill="var(--skill-writing)" radius={0} />
						<Bar
							dataKey="speaking"
							stackId="score"
							fill="var(--skill-speaking)"
							radius={[4, 4, 0, 0]}
						/>
					</BarChart>
				</ChartContainer>

				{/* Legend */}
				<div className="mt-3 flex flex-wrap items-center justify-center gap-4">
					{SKILLS.map(({ key, label, colorVar }) => (
						<span key={key} className="flex items-center gap-2 text-sm">
							<span className="size-2.5 rounded-sm" style={{ backgroundColor: colorVar }} />
							{label}
						</span>
					))}
				</div>
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

function buildBarData(recentScores: Record<Skill, { score: number }[]>): {
	index: string
	listening: number
	reading: number
	writing: number
	speaking: number
}[] {
	const maxLen = Math.max(...SKILLS.map((s) => recentScores[s.key]?.length ?? 0))
	return Array.from({ length: maxLen }, (_, i) => {
		const entry: Record<string, string | number> = { index: `#${i + 1}` }
		for (const s of SKILLS) {
			const scores = [...(recentScores[s.key] ?? [])].reverse()
			entry[s.key] = scores[i]?.score ?? 0
		}
		return entry as ReturnType<typeof buildBarData>[number]
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
