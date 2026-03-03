import { Book02Icon, Target02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useCreateGoal } from "@/hooks/use-progress"
import { cn } from "@/lib/utils"
import type { VstepBand } from "@/types/api"

export const Route = createFileRoute("/_learner/onboarding")({
	component: OnboardingPage,
})

const BANDS: VstepBand[] = ["B1", "B2", "C1"]

function OnboardingPage() {
	const navigate = useNavigate()
	const [step, setStep] = useState<"choose" | "goal">("choose")
	const [targetBand, setTargetBand] = useState<VstepBand>("B1")
	const [deadline, setDeadline] = useState("")
	const [dailyMinutes, setDailyMinutes] = useState(30)
	const createGoal = useCreateGoal()

	function handleSubmitGoal() {
		if (!deadline) return
		createGoal.mutate(
			{ targetBand, deadline, dailyStudyTimeMinutes: dailyMinutes },
			{ onSuccess: () => navigate({ to: "/dashboard" }) },
		)
	}

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h1 className="text-2xl font-bold">Bạn muốn bắt đầu như thế nào?</h1>
				<p className="mt-2 text-sm text-muted-foreground">Chọn cách phù hợp với bạn</p>
			</div>

			{step === "choose" ? (
				<div className="space-y-3">
					<button
						type="button"
						onClick={() => navigate({ to: "/dashboard" })}
						className="flex w-full items-center gap-4 rounded-2xl border border-border bg-background p-6 text-left transition-colors hover:border-primary"
					>
						<div className="inline-flex shrink-0 rounded-xl bg-primary/10 p-3 text-primary">
							<HugeiconsIcon icon={Book02Icon} className="size-6" />
						</div>
						<div>
							<p className="font-bold">Bắt đầu từ cơ bản</p>
							<p className="mt-1 text-sm text-muted-foreground">Học từ đầu, từng bước một</p>
						</div>
					</button>

					<button
						type="button"
						onClick={() => setStep("goal")}
						className="flex w-full items-center gap-4 rounded-2xl border border-border bg-background p-6 text-left transition-colors hover:border-primary"
					>
						<div className="inline-flex shrink-0 rounded-xl bg-primary/10 p-3 text-primary">
							<HugeiconsIcon icon={Target02Icon} className="size-6" />
						</div>
						<div>
							<p className="font-bold">Đặt mục tiêu</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Chọn band điểm và thời hạn mong muốn
							</p>
						</div>
					</button>
				</div>
			) : (
				<div className="space-y-5 rounded-2xl border border-border bg-background p-6">
					<div className="space-y-2">
						<p className="text-sm font-medium">Band mục tiêu</p>
						<div className="flex gap-2">
							{BANDS.map((b) => (
								<button
									key={b}
									type="button"
									onClick={() => setTargetBand(b)}
									className={cn(
										"rounded-xl border px-5 py-2 text-sm font-medium transition-colors",
										targetBand === b
											? "border-primary bg-primary/10 text-primary"
											: "border-border hover:border-primary/50",
									)}
								>
									{b}
								</button>
							))}
						</div>
					</div>

					<div className="space-y-2">
						<label htmlFor="deadline" className="text-sm font-medium">
							Thời hạn
						</label>
						<input
							id="deadline"
							type="date"
							value={deadline}
							onChange={(e) => setDeadline(e.target.value)}
							className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="daily-minutes" className="text-sm font-medium">
							Thời gian học mỗi ngày (phút)
						</label>
						<input
							id="daily-minutes"
							type="number"
							min={5}
							max={480}
							value={dailyMinutes}
							onChange={(e) => setDailyMinutes(Number(e.target.value))}
							className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
						/>
					</div>

					<div className="flex gap-3">
						<Button variant="outline" onClick={() => setStep("choose")} className="rounded-xl">
							Quay lại
						</Button>
						<Button
							onClick={handleSubmitGoal}
							disabled={!deadline || createGoal.isPending}
							className="rounded-xl"
						>
							{createGoal.isPending ? "Đang lưu..." : "Bắt đầu"}
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}
