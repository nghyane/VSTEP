// PracticeTrackParts — ScoreChart + SessionRow cho PracticeTrackView.

import { BookOpen, Headphones, Mic, PencilLine } from "lucide-react"
import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { TestSession } from "#/mocks/overview"
import { cn } from "#/shared/lib/utils"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "#/shared/ui/chart"

type Skill = "listening" | "reading" | "writing" | "speaking"

export const SKILLS: { key: Skill; label: string; icon: React.ReactNode; colorVar: string }[] = [
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

function buildBarData(
	recentScores: Record<Skill, { score: number }[]>,
): { index: string; listening: number; reading: number; writing: number; speaking: number }[] {
	const maxLen = Math.max(...SKILLS.map((s) => recentScores[s.key]?.length ?? 0))
	return Array.from({ length: maxLen }, (_, i) => {
		const entry: Record<string, string | number> = { index: `#${i + 1}` }
		for (const s of SKILLS) {
			const scores = [...(recentScores[s.key] ?? [])].reverse()
			entry[s.key] = scores[i]?.score ?? 0
		}
		return entry as {
			index: string
			listening: number
			reading: number
			writing: number
			speaking: number
		}
	})
}

export function groupSessionsByDate(sessions: TestSession[]): Record<string, TestSession[]> {
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

export function ScoreChart({ recentScores }: { recentScores: Record<Skill, { score: number }[]> }) {
	const [visible, setVisible] = useState<Record<Skill, boolean>>({
		listening: true,
		reading: true,
		writing: true,
		speaking: true,
	})
	function toggle(key: Skill) {
		setVisible((v) => ({ ...v, [key]: !v[key] }))
	}
	const chartData = useMemo(() => {
		const raw = buildBarData(recentScores)
		return raw.map((row) => {
			const entry = { ...row }
			for (const s of SKILLS) {
				if (!visible[s.key]) entry[s.key] = 0
			}
			return entry
		})
	}, [recentScores, visible])
	return (
		<div className="rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-5">
			<div className="mb-4 flex flex-wrap items-start justify-between gap-3">
				<div>
					<h3 className="text-lg font-semibold">Điểm qua 10 bài test gần nhất</h3>
					<p className="text-sm text-muted-foreground">
						Mỗi cột là 1 bài test, chia theo 4 kỹ năng — bấm để ẩn/hiện
					</p>
				</div>
			</div>
			<ChartContainer config={scoreChartConfig} className="aspect-auto h-[280px] w-full">
				<BarChart
					data={chartData}
					margin={{ left: -10, right: 12, top: 12, bottom: 0 }}
					barCategoryGap="25%"
				>
					<CartesianGrid vertical={false} strokeDasharray="3 3" />
					<XAxis dataKey="index" tickLine={false} axisLine={false} tickMargin={10} />
					<YAxis
						domain={[0, 10]}
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						tickCount={6}
						allowDecimals={false}
					/>
					<ChartTooltip content={<ChartTooltipContent />} />
					{SKILLS.map((s, idx) => (
						<Bar
							key={s.key}
							dataKey={s.key}
							stackId="score"
							fill={visible[s.key] ? s.colorVar : "transparent"}
							radius={[
								idx === SKILLS.length - 1 ? 4 : 0,
								idx === SKILLS.length - 1 ? 4 : 0,
								idx === 0 ? 4 : 0,
								idx === 0 ? 4 : 0,
							]}
						/>
					))}
				</BarChart>
			</ChartContainer>
			<div className="mt-4 flex flex-wrap items-center justify-center gap-2">
				{SKILLS.map(({ key, label, colorVar }) => {
					const active = visible[key]
					return (
						<button
							key={key}
							type="button"
							onClick={() => toggle(key)}
							aria-pressed={active}
							className={cn(
								"inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all",
								active
									? "border-border bg-background"
									: "border-transparent bg-transparent opacity-50",
							)}
						>
							<span
								className={cn(
									"flex size-4 shrink-0 items-center justify-center rounded border-2",
									active ? "border-transparent" : "border-muted-foreground/30",
								)}
								style={active ? { backgroundColor: colorVar } : undefined}
							>
								{active && (
									<svg
										viewBox="0 0 12 12"
										className="size-3 text-white"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<polyline points="2.5 6.5 5 9 9.5 3.5" />
									</svg>
								)}
							</span>
							<span className={active ? "font-medium" : "text-muted-foreground"}>{label}</span>
						</button>
					)
				})}
			</div>
		</div>
	)
}

export function SessionRow({ session }: { session: TestSession }) {
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
		<div className="flex items-center gap-3 rounded-lg border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-3">
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
