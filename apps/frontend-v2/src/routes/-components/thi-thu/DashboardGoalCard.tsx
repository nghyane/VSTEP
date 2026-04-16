import { CalendarDays } from "lucide-react"
import { useEffect, useState } from "react"
import { FireIcon } from "#/components/common/FireIcon"

export function DashboardGoalCard() {
	// Giả lập đồng hồ đếm ngược (Mock data)
	const [timeLeft, setTimeLeft] = useState({
		days: 261,
		hours: 0,
		minutes: 18,
		seconds: 51,
	})

	useEffect(() => {
		const timer = setInterval(() => {
			setTimeLeft((prev) => {
				let { days, hours, minutes, seconds } = prev
				if (seconds > 0) {
					seconds--
				} else {
					seconds = 59
					if (minutes > 0) {
						minutes--
					} else {
						minutes = 59
						if (hours > 0) {
							hours--
						} else {
							hours = 23
							if (days > 0) {
								days--
							}
						}
					}
				}
				return { days, hours, minutes, seconds }
			})
		}, 1000)
		return () => clearInterval(timer)
	}, [])

	const formatNumber = (num: number) => num.toString().padStart(2, "0")

	return (
		<div className="flex flex-col gap-6 rounded-[24px] border border-slate-200 bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
			{/* Header */}
			<div className="flex items-center gap-2">
				<CalendarDays className="size-6 text-primary" />
				<h3 className="font-semibold text-foreground">Đếm ngày thi</h3>
			</div>

			{/* Countdown Blocks */}
			<div className="flex items-center justify-center gap-[12px] px-2">
				<div className="flex flex-col items-center gap-2">
					<div className="flex h-[52px] w-[56px] items-center justify-center rounded-xl bg-primary text-2xl font-bold tracking-tight text-primary-foreground shadow-sm">
						{formatNumber(timeLeft.days)}
					</div>
					<span className="text-[10px] font-semibold uppercase text-muted-foreground">Ngày</span>
				</div>
				<div className="flex flex-col items-center gap-2 mr-4">
					<div className="flex h-[52px] w-[56px] items-center justify-center rounded-xl bg-primary text-2xl font-bold tracking-tight text-primary-foreground shadow-sm">
						{formatNumber(timeLeft.hours)}
					</div>
					<span className="text-[10px] font-semibold uppercase text-muted-foreground">Giờ</span>
				</div>
				<div className="flex flex-col items-center gap-2">
					<div className="flex h-[52px] w-[56px] items-center justify-center rounded-xl bg-primary text-2xl font-bold tracking-tight text-primary-foreground shadow-sm">
						{formatNumber(timeLeft.minutes)}
					</div>
					<span className="text-[10px] font-semibold uppercase text-muted-foreground">Phút</span>
				</div>
				<div className="flex flex-col items-center gap-2">
					<div className="flex h-[52px] w-[56px] items-center justify-center rounded-xl bg-primary text-2xl font-bold tracking-tight text-primary-foreground shadow-sm">
						{formatNumber(timeLeft.seconds)}
					</div>
					<span className="text-[10px] font-semibold uppercase text-muted-foreground">Giây</span>
				</div>
			</div>

			{/* Bottom Progress */}
			<div className="mt-auto flex items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-white/60 p-3 backdrop-blur-sm">
				<div className="flex h-10 items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3">
					<FireIcon active={true} sizeClass="size-5" />
					<span className="flex items-center gap-1 pt-1">
						<span className="text-sm font-bold leading-none">1</span>
						<span className="text-[10px] font-semibold text-muted-foreground leading-none pt-[1px]">
							NGÀY
						</span>
					</span>
				</div>

				<div className="flex flex-1 flex-col gap-1.5">
					<div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
						<span>TIẾN ĐỘ</span>
						<span className="text-[#F59E0B]">1/3</span>
					</div>
					<div className="h-1.5 w-full rounded-full bg-slate-200/60">
						<div className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#FBBF24] to-[#F59E0B]" />
					</div>
				</div>
			</div>
		</div>
	)
}
