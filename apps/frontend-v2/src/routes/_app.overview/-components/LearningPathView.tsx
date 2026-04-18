// LearningPathView — lộ trình học tập theo tuần, port từ frontend-v1 LearningPathTab
// Spec: rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-5 (skill cards)
// Source: apps/frontend/src/routes/_learner/progress/-components/LearningPathTab.tsx

import { ArrowRight, BookOpen, Clock, Headphones, ListChecks, Mic, PencilLine } from "lucide-react"
import type { LearningPathData, WeeklyPlanItem } from "#/mocks/overview"
import { cn } from "#/shared/lib/utils"

type Skill = "listening" | "reading" | "writing" | "speaking"

const SKILL_INFO: Record<
	Skill,
	{ label: string; icon: React.ReactNode; colorClass: string; bgClass: string }
> = {
	listening: {
		label: "Listening",
		icon: <Headphones className="size-5" />,
		colorClass: "text-skill-listening",
		bgClass: "bg-skill-listening/15 text-skill-listening",
	},
	reading: {
		label: "Reading",
		icon: <BookOpen className="size-5" />,
		colorClass: "text-skill-reading",
		bgClass: "bg-skill-reading/15 text-skill-reading",
	},
	writing: {
		label: "Writing",
		icon: <PencilLine className="size-5" />,
		colorClass: "text-skill-writing",
		bgClass: "bg-skill-writing/15 text-skill-writing",
	},
	speaking: {
		label: "Speaking",
		icon: <Mic className="size-5" />,
		colorClass: "text-skill-speaking",
		bgClass: "bg-skill-speaking/15 text-skill-speaking",
	},
}

interface Props {
	data: LearningPathData
}

export function LearningPathView({ data }: Props) {
	if (!data.weeklyPlan.length) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-muted/50 py-16">
				<div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
					<BookOpen className="size-6" />
				</div>
				<p className="text-sm text-muted-foreground">Chưa có lộ trình học tập</p>
				<p className="max-w-xs text-center text-xs text-muted-foreground">
					Hãy đặt mục tiêu và luyện tập thêm để hệ thống tạo lộ trình phù hợp cho bạn.
				</p>
			</div>
		)
	}

	return (
		<div className="space-y-5">
			{/* Summary banner */}
			<div className="flex flex-wrap items-center gap-4 rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-5">
				{data.projectedImprovement && (
					<div className="flex items-center gap-2">
						<ArrowRight className="size-5 text-primary" />
						<span className="text-sm font-semibold">{data.projectedImprovement}</span>
					</div>
				)}
				<div className="flex items-center gap-2">
					<Clock className="size-5 text-muted-foreground" />
					<span className="text-sm text-muted-foreground">
						{data.totalMinutesPerWeek} phút/tuần
					</span>
				</div>
			</div>

			{/* Skill plan cards */}
			<div className="space-y-4">
				{data.weeklyPlan.map((plan) => (
					<SkillPlanCard key={plan.skill} plan={plan} />
				))}
			</div>
		</div>
	)
}

// ─── Skill plan card ─────────────────────────────────────────────

function SkillPlanCard({ plan }: { plan: WeeklyPlanItem }) {
	const info = SKILL_INFO[plan.skill]
	const barColorClass = info.colorClass.replace("text-", "bg-")

	return (
		<div className="rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-5">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className={cn("flex size-10 items-center justify-center rounded-xl", info.bgClass)}>
						{info.icon}
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h4 className="font-semibold">{info.label}</h4>
							<span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
								#{plan.priority}
							</span>
						</div>
						<p className="text-sm text-muted-foreground">
							{plan.currentLevel}
							<span className="mx-1">→</span>
							<span className="font-semibold text-foreground">{plan.targetLevel}</span>
						</p>
					</div>
				</div>
			</div>

			{/* Mini stats */}
			<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
				<MiniStat
					icon={<ListChecks className="size-4 text-muted-foreground" />}
					label="Buổi/tuần"
					value={String(plan.sessionsPerWeek)}
				/>
				<MiniStat
					icon={<Clock className="size-4 text-muted-foreground" />}
					label="Thời lượng"
					value={`${plan.estimatedMinutes} phút`}
				/>
				<MiniStat
					icon={<BookOpen className="size-4 text-muted-foreground" />}
					label="Cấp độ đề xuất"
					value={plan.recommendedLevel}
				/>
				{plan.focusArea ? (
					<div className="rounded-xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-2.5 text-center">
						<p className="text-xs text-muted-foreground">Trọng tâm</p>
						<p className="mt-1 text-sm font-bold">{plan.focusArea}</p>
					</div>
				) : (
					<div className="rounded-xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-2.5 text-center">
						<p className="text-xs text-muted-foreground">Trọng tâm</p>
						<p className="mt-1 text-sm font-bold text-muted-foreground">—</p>
					</div>
				)}
			</div>

			{/* Weak topics */}
			{plan.weakTopics.length > 0 && (
				<div className="mt-4">
					<p className="mb-2 text-xs font-medium text-muted-foreground">Chủ đề cần cải thiện</p>
					<div className="space-y-2">
						{plan.weakTopics.map((topic) => (
							<div key={topic.id} className="flex items-center gap-3">
								<span className="w-28 truncate text-xs">{topic.name}</span>
								<div className="h-1.5 flex-1 rounded-full bg-muted">
									<div
										className={cn("h-full rounded-full", barColorClass)}
										style={{ width: `${Math.min(topic.masteryScore, 100)}%` }}
									/>
								</div>
								<span className="w-8 text-right text-xs text-muted-foreground">
									{topic.masteryScore}%
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
	return (
		<div className="rounded-xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-2.5 text-center">
			<div className="mb-1 flex justify-center">{icon}</div>
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="text-sm font-bold">{value}</p>
		</div>
	)
}
