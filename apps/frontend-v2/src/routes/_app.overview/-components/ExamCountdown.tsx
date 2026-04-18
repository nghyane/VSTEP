// ExamCountdown — đồng hồ đếm ngược đến ngày thi (adapt từ DashboardGoalCard)
// Dùng khi user đã hoàn thành onboarding (mockGoal != null)
// Source: DashboardGoalCard.tsx (thi-thu route)

import { CalendarDays } from "lucide-react"
import { useEffect, useState } from "react"
import { FireIcon } from "#/components/common/FireIcon"
import { cn } from "#/shared/lib/utils"
import { StreakDialog } from "./StreakDialog"

interface Props {
	deadline: string // ISO date string
	daysRemaining: number | null
	streak: number
}

interface TimeLeft {
	days: number
	hours: number
	minutes: number
	seconds: number
}

function computeTimeLeft(deadline: string): TimeLeft {
	const diff = new Date(deadline).getTime() - Date.now()
	if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
	const totalSeconds = Math.floor(diff / 1000)
	return {
		days: Math.floor(totalSeconds / 86400),
		hours: Math.floor((totalSeconds % 86400) / 3600),
		minutes: Math.floor((totalSeconds % 3600) / 60),
		seconds: totalSeconds % 60,
	}
}

function pad(n: number) {
	return n.toString().padStart(2, "0")
}

export function ExamCountdown({ deadline, daysRemaining, streak }: Props) {
	const [time, setTime] = useState<TimeLeft>(() => computeTimeLeft(deadline))
	const [streakOpen, setStreakOpen] = useState(false)

	useEffect(() => {
		const id = setInterval(() => setTime(computeTimeLeft(deadline)), 1000)
		return () => clearInterval(id)
	}, [deadline])

	const progressPct =
		daysRemaining != null
			? Math.min(100, Math.max(0, Math.round(((180 - daysRemaining) / 180) * 100)))
			: 60

	return (
		<div className="relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-5 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
			{/* Header */}
			<div className="flex items-center gap-2">
				<CalendarDays className="size-5 text-primary" />
				<h3 className="text-sm font-semibold text-foreground">Đếm ngày thi</h3>
			</div>

			{/* Countdown blocks */}
			<div className="flex items-start justify-center gap-3 px-2">
				<div className="flex flex-col items-center gap-1.5">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold tracking-tight text-primary-foreground shadow-sm">
						{pad(time.days)}
					</div>
					<span className="text-[10px] font-semibold uppercase text-muted-foreground">Ngày</span>
				</div>
				<div className="flex h-12 items-center">
					<span className="text-lg font-bold text-muted-foreground">:</span>
				</div>
				<div className="flex flex-col items-center gap-1.5">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold tracking-tight text-primary-foreground shadow-sm">
						{pad(time.hours)}
					</div>
					<span className="text-[10px] font-semibold uppercase text-muted-foreground">Giờ</span>
				</div>
				<div className="flex h-12 items-center">
					<span className="text-lg font-bold text-muted-foreground">:</span>
				</div>
				<div className="flex flex-col items-center gap-1.5">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold tracking-tight text-primary-foreground shadow-sm">
						{pad(time.minutes)}
					</div>
					<span className="text-[10px] font-semibold uppercase text-muted-foreground">Phút</span>
				</div>
				<div className="flex h-12 items-center">
					<span className="text-lg font-bold text-muted-foreground">:</span>
				</div>
				<div className="flex flex-col items-center gap-1.5">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold tracking-tight text-primary-foreground shadow-sm">
						{pad(time.seconds)}
					</div>
					<span className="text-[10px] font-semibold uppercase text-muted-foreground">Giây</span>
				</div>
			</div>

			{/* Progress line — click để mở streak dialog */}
			{daysRemaining != null && (
				<button
					type="button"
					onClick={() => setStreakOpen(true)}
					aria-label={`Xem streak ${streak} ngày và phần thưởng`}
					className="group mt-auto flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white/60 p-3 text-left transition-all hover:border-skill-speaking/50 hover:bg-white hover:shadow-sm dark:border-slate-600 dark:bg-slate-900/40 dark:hover:bg-slate-900/70"
				>
					<FireIcon active={streak > 0} sizeClass="size-4" />
					<div className="flex flex-1 flex-col gap-1.5">
						<div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
							<span className="flex items-center gap-1.5">
								TIẾN ĐỘ
								<span className="rounded-full bg-skill-speaking/10 px-1.5 py-0.5 text-skill-speaking">
									{streak} ngày streak
								</span>
							</span>
							<span
								className={cn(
									"font-bold",
									daysRemaining <= 7 ? "text-destructive" : "text-warning",
								)}
							>
								{daysRemaining} ngày còn lại
							</span>
						</div>
						<div className="h-1.5 w-full rounded-full bg-slate-200/60">
							<div
								className={cn(
									"h-full rounded-full transition-all",
									daysRemaining <= 7
										? "bg-gradient-to-r from-red-400 to-red-500"
										: "bg-gradient-to-r from-[#FBBF24] to-[#F59E0B]",
								)}
								style={{ width: `${progressPct}%` }}
							/>
						</div>
					</div>
				</button>
			)}

			<StreakDialog open={streakOpen} onOpenChange={setStreakOpen} streak={streak} />
		</div>
	)
}
