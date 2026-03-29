import {
	CheckmarkCircle02Icon,
	Clock01Icon,
	Delete02Icon,
	PlusSignIcon,
	Target02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { useCreateGoal, useDeleteGoal, useUpdateGoal } from "@/hooks/use-progress"
import {
	DAILY_TIMES,
	DEADLINES,
	deadlineToMonths,
	getGoalConstraints,
	isDailyTimeAllowed,
	isDeadlineAllowed,
	LEVEL_ORDER,
	minutesToPreset,
	monthsToDeadline,
	TARGET_BANDS,
} from "@/lib/goal-constraints"
import { cn } from "@/lib/utils"
import type { EnrichedGoal, VstepBand } from "@/types/api"

const toggleBtnClass = (active: boolean, disabled?: boolean) =>
	cn(
		"rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
		disabled && "cursor-not-allowed opacity-40",
		active
			? "border-primary bg-primary/10 text-primary"
			: disabled
				? "border-border"
				: "border-border hover:border-primary/50",
	)

export function GoalCard({
	goal,
	currentLevel,
}: {
	goal: EnrichedGoal | null
	currentLevel: string | null
}) {
	const [creating, setCreating] = useState(false)
	const [editing, setEditing] = useState(false)
	const deleteGoal = useDeleteGoal()

	if (creating) {
		return <GoalForm currentLevel={currentLevel} onCancel={() => setCreating(false)} />
	}

	if (editing && goal) {
		return (
			<GoalEditForm goal={goal} currentLevel={currentLevel} onCancel={() => setEditing(false)} />
		)
	}

	if (!goal) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-muted/50 p-8 shadow-sm">
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
		<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
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
				<div className="flex gap-1">
					<Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
						Chỉnh sửa
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="text-destructive"
						onClick={() => {
							if (confirm("Bạn có chắc muốn xóa mục tiêu này?")) {
								deleteGoal.mutate(goal.id)
							}
						}}
					>
						<HugeiconsIcon icon={Delete02Icon} className="size-4" />
						Xóa
					</Button>
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

// ---------------------------------------------------------------------------
// GoalForm — create new goal with constraints (matches onboarding UX)
// ---------------------------------------------------------------------------

function GoalForm({
	currentLevel,
	onCancel,
}: {
	currentLevel: string | null
	onCancel: () => void
}) {
	const createGoal = useCreateGoal()

	// Default target: one level above current
	const currentIdx = LEVEL_ORDER[currentLevel ?? "A2"] ?? 0
	const defaultTarget = currentIdx === 0 ? "B1" : currentIdx === 1 ? "B2" : "C1"

	const [targetBand, setTargetBand] = useState<VstepBand>(defaultTarget as VstepBand)
	const [deadlineMonths, setDeadlineMonths] = useState<number | undefined>(3)
	const [dailyMinutes, setDailyMinutes] = useState<number | undefined>(30)

	const constraints = useMemo(
		() => getGoalConstraints(currentLevel, targetBand),
		[currentLevel, targetBand],
	)

	// Auto-adjust when constraints change
	if (
		deadlineMonths !== undefined &&
		!isDeadlineAllowed(deadlineMonths, constraints.minDeadlineMonths)
	) {
		setDeadlineMonths(constraints.minDeadlineMonths)
	}
	if (
		dailyMinutes !== undefined &&
		!isDailyTimeAllowed(dailyMinutes, constraints.minDailyMinutes)
	) {
		setDailyMinutes(constraints.minDailyMinutes)
	}

	function handleSubmit() {
		createGoal.mutate(
			{
				targetBand,
				deadline:
					monthsToDeadline(deadlineMonths) ??
					new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
				dailyStudyTimeMinutes: dailyMinutes,
				currentEstimatedBand: currentLevel ?? undefined,
			},
			{ onSuccess: onCancel },
		)
	}

	return (
		<div className="space-y-5 rounded-2xl bg-muted/50 p-5 shadow-sm">
			<h3 className="text-lg font-semibold">Đặt mục tiêu mới</h3>

			{currentLevel && (
				<p className="text-sm text-muted-foreground">
					Trình độ hiện tại: <span className="font-semibold text-foreground">{currentLevel}</span>
				</p>
			)}

			{constraints.hint && (
				<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
					{constraints.hint}
				</div>
			)}

			<div className="space-y-4">
				<div className="space-y-2.5">
					<p className="text-sm font-medium">Band mục tiêu</p>
					<div className="flex gap-2">
						{TARGET_BANDS.map((b) => {
							const disabled = (LEVEL_ORDER[b] ?? 0) <= currentIdx
							return (
								<button
									key={b}
									type="button"
									disabled={disabled}
									onClick={() => !disabled && setTargetBand(b)}
									className={toggleBtnClass(targetBand === b, disabled)}
								>
									{b}
								</button>
							)
						})}
					</div>
				</div>

				<div className="space-y-2.5">
					<p className="text-sm font-medium">Thời hạn</p>
					<div className="flex flex-wrap gap-2">
						{DEADLINES.map((d) => {
							const disabled = !isDeadlineAllowed(d.months, constraints.minDeadlineMonths)
							return (
								<button
									key={d.label}
									type="button"
									disabled={disabled}
									onClick={() => !disabled && setDeadlineMonths(d.months)}
									className={toggleBtnClass(deadlineMonths === d.months, disabled)}
								>
									{d.label}
								</button>
							)
						})}
					</div>
				</div>

				<div className="space-y-2.5">
					<p className="text-sm font-medium">Thời gian học mỗi ngày</p>
					<div className="flex flex-wrap gap-2">
						{DAILY_TIMES.map((t) => {
							const disabled = !isDailyTimeAllowed(t.minutes, constraints.minDailyMinutes)
							return (
								<button
									key={t.label}
									type="button"
									disabled={disabled}
									onClick={() => !disabled && setDailyMinutes(t.minutes)}
									className={toggleBtnClass(dailyMinutes === t.minutes, disabled)}
								>
									{t.label}
								</button>
							)
						})}
					</div>
				</div>
			</div>

			<div className="flex gap-2">
				<Button size="sm" onClick={handleSubmit} disabled={createGoal.isPending}>
					{createGoal.isPending ? "Đang tạo..." : "Tạo mục tiêu"}
				</Button>
				<Button type="button" variant="outline" size="sm" onClick={onCancel}>
					Hủy
				</Button>
			</div>
		</div>
	)
}

// ---------------------------------------------------------------------------
// GoalEditForm — edit existing goal with same constraints
// ---------------------------------------------------------------------------

function GoalEditForm({
	goal,
	currentLevel,
	onCancel,
}: {
	goal: EnrichedGoal
	currentLevel: string | null
	onCancel: () => void
}) {
	const updateGoal = useUpdateGoal()
	const currentIdx = LEVEL_ORDER[currentLevel ?? "A2"] ?? 0

	const [targetBand, setTargetBand] = useState<VstepBand>(goal.targetBand as VstepBand)
	const [deadlineMonths, setDeadlineMonths] = useState<number | undefined>(
		deadlineToMonths(goal.deadline),
	)
	const [dailyMinutes, setDailyMinutes] = useState<number | undefined>(
		minutesToPreset(goal.dailyStudyTimeMinutes),
	)

	const constraints = useMemo(
		() => getGoalConstraints(currentLevel, targetBand),
		[currentLevel, targetBand],
	)

	// Auto-adjust when constraints change
	if (
		deadlineMonths !== undefined &&
		!isDeadlineAllowed(deadlineMonths, constraints.minDeadlineMonths)
	) {
		setDeadlineMonths(constraints.minDeadlineMonths)
	}
	if (
		dailyMinutes !== undefined &&
		!isDailyTimeAllowed(dailyMinutes, constraints.minDailyMinutes)
	) {
		setDailyMinutes(constraints.minDailyMinutes)
	}

	function handleSubmit() {
		updateGoal.mutate(
			{
				id: goal.id,
				targetBand,
				deadline: monthsToDeadline(deadlineMonths) ?? goal.deadline,
				dailyStudyTimeMinutes: dailyMinutes,
				currentEstimatedBand: currentLevel,
			},
			{ onSuccess: onCancel },
		)
	}

	return (
		<div className="space-y-5 rounded-2xl bg-muted/50 p-5 shadow-sm">
			<h3 className="text-lg font-semibold">Chỉnh sửa mục tiêu</h3>

			{currentLevel && (
				<p className="text-sm text-muted-foreground">
					Trình độ hiện tại: <span className="font-semibold text-foreground">{currentLevel}</span>
				</p>
			)}

			{constraints.hint && (
				<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
					{constraints.hint}
				</div>
			)}

			<div className="space-y-4">
				<div className="space-y-2.5">
					<p className="text-sm font-medium">Band mục tiêu</p>
					<div className="flex gap-2">
						{TARGET_BANDS.map((b) => {
							const disabled = (LEVEL_ORDER[b] ?? 0) <= currentIdx
							return (
								<button
									key={b}
									type="button"
									disabled={disabled}
									onClick={() => !disabled && setTargetBand(b)}
									className={toggleBtnClass(targetBand === b, disabled)}
								>
									{b}
								</button>
							)
						})}
					</div>
				</div>

				<div className="space-y-2.5">
					<p className="text-sm font-medium">Thời hạn</p>
					<div className="flex flex-wrap gap-2">
						{DEADLINES.map((d) => {
							const disabled = !isDeadlineAllowed(d.months, constraints.minDeadlineMonths)
							return (
								<button
									key={d.label}
									type="button"
									disabled={disabled}
									onClick={() => !disabled && setDeadlineMonths(d.months)}
									className={toggleBtnClass(deadlineMonths === d.months, disabled)}
								>
									{d.label}
								</button>
							)
						})}
					</div>
				</div>

				<div className="space-y-2.5">
					<p className="text-sm font-medium">Thời gian học mỗi ngày</p>
					<div className="flex flex-wrap gap-2">
						{DAILY_TIMES.map((t) => {
							const disabled = !isDailyTimeAllowed(t.minutes, constraints.minDailyMinutes)
							return (
								<button
									key={t.label}
									type="button"
									disabled={disabled}
									onClick={() => !disabled && setDailyMinutes(t.minutes)}
									className={toggleBtnClass(dailyMinutes === t.minutes, disabled)}
								>
									{t.label}
								</button>
							)
						})}
					</div>
				</div>
			</div>

			<div className="flex gap-2">
				<Button size="sm" onClick={handleSubmit} disabled={updateGoal.isPending}>
					{updateGoal.isPending ? "Đang lưu..." : "Lưu"}
				</Button>
				<Button type="button" variant="outline" size="sm" onClick={onCancel}>
					Hủy
				</Button>
			</div>
		</div>
	)
}
