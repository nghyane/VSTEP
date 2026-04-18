// StreakButton — nút icon ngọn lửa cạnh nút thông báo ở header.
// Click → popover hiện streak hiện tại + tuần học (T2 → CN) kiểu Duolingo.

import { useQuery } from "@tanstack/react-query"
import { Check } from "lucide-react"
import { FireIcon } from "#/components/common/FireIcon"
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover"
import { overviewQueryOptions } from "#/lib/queries/overview"
import { cn } from "#/lib/utils"

export function StreakButton() {
	const { data } = useQuery(overviewQueryOptions())
	const streak = data?.activity.streak ?? 0
	const activityByDay = data?.activity.activityByDay ?? {}
	const isActive = streak > 0

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					aria-label={isActive ? `Chuỗi học ${streak} ngày` : "Chưa có chuỗi học"}
					className="inline-flex size-8 items-center justify-center rounded-md transition-colors hover:bg-muted"
				>
					<FireIcon active={isActive} sizeClass="size-5" />
				</button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80 overflow-hidden p-0">
				<StreakDetails streak={streak} isActive={isActive} activityByDay={activityByDay} />
			</PopoverContent>
		</Popover>
	)
}

interface WeekDay {
	label: string
	active: boolean
	isToday: boolean
	isFuture: boolean
}

function buildCurrentWeek(activityByDay: Record<string, number>, now: number): WeekDay[] {
	const today = new Date(now)
	today.setHours(0, 0, 0, 0)
	const dayOfWeek = today.getDay() // 0=CN, 1=T2, ..., 6=T7
	const monOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
	const monday = new Date(today)
	monday.setDate(today.getDate() + monOffset)

	const labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
	return labels.map((label, i) => {
		const d = new Date(monday)
		d.setDate(monday.getDate() + i)
		const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
		return {
			label,
			active: (activityByDay[dateStr] ?? 0) > 0,
			isToday: d.getTime() === today.getTime(),
			isFuture: d.getTime() > today.getTime(),
		}
	})
}

function StreakDetails({
	streak,
	isActive,
	activityByDay,
}: {
	streak: number
	isActive: boolean
	activityByDay: Record<string, number>
}) {
	const weekDays = buildCurrentWeek(activityByDay, Date.now())

	return (
		<div>
			{/* Top: banner cam + số streak + fire icon inline */}
			<div className="bg-skill-speaking/10 px-6 py-5">
				<div className="flex items-center gap-2">
					<FireIcon active={isActive} sizeClass="size-8" />
					<h2 className="text-3xl font-extrabold leading-tight text-skill-speaking">
						{streak} ngày streak
					</h2>
				</div>
				<p className="mt-1 text-sm text-muted-foreground">
					{isActive ? "Tiếp tục học mỗi ngày nhé!" : "Bắt đầu chuỗi học ngay hôm nay!"}
				</p>
			</div>

			{/* Bottom: week view */}
			<div className="grid grid-cols-7 gap-1 px-4 py-5">
				{weekDays.map((day) => (
					<WeekDayCell key={day.label} day={day} />
				))}
			</div>
		</div>
	)
}

function WeekDayCell({ day }: { day: WeekDay }) {
	return (
		<div className="flex flex-col items-center gap-1.5">
			<span className="text-xs font-medium text-muted-foreground">{day.label}</span>
			<div
				className={cn(
					"flex size-9 items-center justify-center rounded-full transition-colors",
					day.active
						? "border-2 border-skill-speaking bg-skill-speaking/10 text-skill-speaking"
						: "bg-muted text-muted-foreground",
					day.isToday && !day.active && "ring-2 ring-skill-speaking/40",
					day.isFuture && "opacity-40",
				)}
			>
				{day.active && <Check className="size-4" strokeWidth={3} />}
			</div>
		</div>
	)
}
