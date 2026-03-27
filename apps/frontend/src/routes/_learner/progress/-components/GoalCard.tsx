import {
	CheckmarkCircle02Icon,
	Clock01Icon,
	Delete02Icon,
	PlusSignIcon,
	Target02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { useCreateGoal, useDeleteGoal, useUpdateGoal } from "@/hooks/use-progress"
import type { EnrichedGoal, VstepBand } from "@/types/api"

export function GoalCard({ goal }: { goal: EnrichedGoal | null }) {
	const [creating, setCreating] = useState(false)
	const [editing, setEditing] = useState(false)
	const deleteGoal = useDeleteGoal()

	if (creating) {
		return <GoalForm onCancel={() => setCreating(false)} />
	}

	if (editing && goal) {
		return <GoalEditForm goal={goal} onCancel={() => setEditing(false)} />
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

function GoalForm({ onCancel }: { onCancel: () => void }) {
	const createGoal = useCreateGoal()
	const [targetBand, setTargetBand] = useState<string>("B2")
	const [deadline, setDeadline] = useState("")
	const [dailyMinutes, setDailyMinutes] = useState("60")
	const [currentEstimatedBand, setCurrentEstimatedBand] = useState<string>("")

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!deadline) return
		createGoal.mutate(
			{
				targetBand,
				deadline,
				dailyStudyTimeMinutes: Number(dailyMinutes) || undefined,
				...(currentEstimatedBand && currentEstimatedBand !== "none" ? { currentEstimatedBand } : {}),
			},
			{ onSuccess: onCancel },
		)
	}

	return (
		<form onSubmit={handleSubmit} className="rounded-2xl bg-muted/50 p-5 shadow-sm">
			<h3 className="mb-4 text-lg font-semibold">Đặt mục tiêu mới</h3>
			<div className="grid gap-4 sm:grid-cols-2">
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
					<Label>Band hiện tại (ước lượng)</Label>
					<Select value={currentEstimatedBand} onValueChange={setCurrentEstimatedBand}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Không chọn" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">Không chọn</SelectItem>
							{(["A2", "B1", "B2", "C1"] as VstepBand[]).map((b) => (
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

function GoalEditForm({ goal, onCancel }: { goal: EnrichedGoal; onCancel: () => void }) {
	const updateGoal = useUpdateGoal()
	const [targetBand, setTargetBand] = useState<string>(goal.targetBand)
	const [deadline, setDeadline] = useState(goal.deadline.slice(0, 10))
	const [dailyMinutes, setDailyMinutes] = useState(String(goal.dailyStudyTimeMinutes ?? 60))
	const [currentEstimatedBand, setCurrentEstimatedBand] = useState<string>(goal.currentEstimatedBand ?? "")

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!deadline) return
		updateGoal.mutate(
			{
				id: goal.id,
				targetBand,
				deadline,
				dailyStudyTimeMinutes: Number(dailyMinutes) || undefined,
				...(currentEstimatedBand && currentEstimatedBand !== "none" ? { currentEstimatedBand } : {}),
			},
			{ onSuccess: onCancel },
		)
	}

	return (
		<form onSubmit={handleSubmit} className="rounded-2xl bg-muted/50 p-5 shadow-sm">
			<h3 className="mb-4 text-lg font-semibold">Chỉnh sửa mục tiêu</h3>
			<div className="grid gap-4 sm:grid-cols-2">
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
					<Label>Band hiện tại (ước lượng)</Label>
					<Select value={currentEstimatedBand || "none"} onValueChange={(v) => setCurrentEstimatedBand(v === "none" ? "" : v)}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Không chọn" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">Không chọn</SelectItem>
							{(["A2", "B1", "B2", "C1"] as VstepBand[]).map((b) => (
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
				<Button type="submit" size="sm" disabled={updateGoal.isPending}>
					Lưu
				</Button>
				<Button type="button" variant="outline" size="sm" onClick={onCancel}>
					Hủy
				</Button>
			</div>
		</form>
	)
}
