import { ArrowRight01Icon, Book02Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useLearningPath } from "@/hooks/use-progress"
import { cn } from "@/lib/utils"
import type { Skill } from "@/types/api"
import { SKILLS, skillColor, skillColorText } from "./progress-constants"

export function LearningPathTab() {
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
			<div className="flex flex-wrap items-center gap-4 rounded-2xl bg-muted/50 p-5 shadow-sm">
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
						<div key={plan.skill} className="rounded-2xl bg-muted/50 p-5 shadow-sm">
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
