// PracticeTrackView — theo dõi điểm số + lịch sử test.

import type { PracticeTrackData } from "#/mocks/overview"
import { cn } from "#/shared/lib/utils"
import { groupSessionsByDate, ScoreChart, SessionRow, SKILLS } from "./PracticeTrackParts"

type Skill = "listening" | "reading" | "writing" | "speaking"

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
	const groupedSessions = groupSessionsByDate(data.testSessions)

	return (
		<div className="space-y-6">
			{/* Section 1: Average scores by skill */}
			<div className="rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-5">
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

			{/* Section 2: Stacked column chart với checkbox legend */}
			<ScoreChart recentScores={data.recentScores} />

			{/* Section 3: Test history */}
			<div className="rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-5">
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

// ─── Score chart with toggleable skills ────────────────────────────
