import { CalendarDays } from "lucide-react"
import { useMemo } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "#/components/ui/tooltip"

function getColorClass(level: number) {
	switch (level) {
		case 1:
			return "bg-primary/30"
		case 2:
			return "bg-primary/50"
		case 3:
			return "bg-primary/70"
		case 4:
			return "bg-primary"
		default:
			return "bg-muted-foreground/10" // Level 0 (không hoạt động)
	}
}

export function DashboardStreakCard() {
	const monthsData = useMemo(() => {
		const today = new Date()
		const data = []

		// Lấy 4 tháng gần nhất (bao gồm tháng hiện tại)
		for (let m = 3; m >= 0; m--) {
			const targetMonth = new Date(today.getFullYear(), today.getMonth() - m, 1)
			const monthLabel = `Tháng ${String(targetMonth.getMonth() + 1).padStart(2, "0")}`

			const year = targetMonth.getFullYear()
			const month = targetMonth.getMonth()
			const numDays = new Date(year, month + 1, 0).getDate()

			const columns = []
			let currentColumn = Array(7).fill(null)

			for (let d = 1; d <= numDays; d++) {
				const date = new Date(year, month, d)
				const dayOfWeek = date.getDay() // 0 = Sun, 1 = Mon...
				const gridRowIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 0 = Mon, 6 = Sun

				// Giả lập mức độ
				const isFuture = date > today
				const level = isFuture ? 0 : Math.floor(Math.random() * 5)

				currentColumn[gridRowIndex] = {
					date: date,
					level: level,
				}

				// Chuyển cột mới nếu là Chủ Nhật (cuối tuần) hoặc là ngày cuối của tháng
				if (gridRowIndex === 6 || d === numDays) {
					columns.push(currentColumn)
					currentColumn = Array(7).fill(null)
				}
			}

			data.push({
				label: monthLabel,
				columns,
			})
		}
		return data
	}, [])

	return (
		<div className="flex flex-col gap-4 rounded-[24px] bg-muted/50 p-5 shadow-sm">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<CalendarDays className="size-5 text-primary" />
					<h3 className="font-semibold text-foreground">Hành trình chăm chỉ</h3>
				</div>
				<p className="text-sm text-muted-foreground">Duy trì chuỗi streak mỗi ngày</p>
			</div>

			<div className="flex pt-2">
				{/* Cột cố định cho nhãn Thứ (T2, T4, T6, CN) */}
				<div className="mt-[24px] shrink-0 pr-2">
					<div className="flex flex-col gap-[4px]">
						<div className="flex h-[12px] w-[20px] items-center justify-end text-[10px] text-muted-foreground">
							T2
						</div>
						<div className="h-[12px]" />
						<div className="flex h-[12px] w-[20px] items-center justify-end text-[10px] text-muted-foreground">
							T4
						</div>
						<div className="h-[12px]" />
						<div className="flex h-[12px] w-[20px] items-center justify-end text-[10px] text-muted-foreground">
							T6
						</div>
						<div className="h-[12px]" />
						<div className="flex h-[12px] w-[20px] items-center justify-end text-[10px] text-muted-foreground">
							CN
						</div>
					</div>
				</div>

				{/* Lưới các tháng cuộn ngang được */}
				<div className="flex-1 overflow-x-auto pb-2">
					<TooltipProvider delayDuration={0}>
						<div className="flex gap-[16px] min-w-max pr-4">
							{monthsData.map((month, mIdx) => (
								<div key={mIdx} className="flex flex-col gap-[8px]">
									<div className="flex h-[16px] w-full items-end justify-center text-xs text-muted-foreground">
										{month.label}
									</div>
									<div className="flex gap-[4px]">
										{month.columns.map((col, cIdx) => (
											<div key={cIdx} className="flex flex-col gap-[4px]">
												{col.map((day, dIdx) => {
													if (!day) {
														return <div key={dIdx} className="size-[12px]" /> // Ô trống
													}

													const formattedDate = day.date.toLocaleDateString("vi-VN", {
														day: "2-digit",
														month: "2-digit",
													})

													return (
														<Tooltip key={dIdx}>
															<TooltipTrigger asChild>
																<div
																	className={`size-[12px] cursor-pointer rounded-full transition-transform hover:scale-125 hover:ring-2 hover:ring-primary/50 hover:ring-offset-1 hover:ring-offset-background ${getColorClass(
																		day.level,
																	)}`}
																/>
															</TooltipTrigger>
															<TooltipContent
																className="flex flex-col items-center justify-center border-none bg-[#1e293b] px-3 py-1.5 text-[#f8fafc] shadow-md"
																sideOffset={5}
															>
																<p className="text-sm font-semibold">{formattedDate}</p>
																<p className="text-xs text-slate-300">
																	{day.level === 0 ? "Chưa nộp bài" : `Đã nộp ${day.level} bài`}
																</p>
															</TooltipContent>
														</Tooltip>
													)
												})}
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</TooltipProvider>
				</div>
			</div>

			{/* Legend */}
			<div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
				<span>Ít</span>
				<div className="flex gap-1.5">
					<div className="size-[12px] rounded-full bg-muted-foreground/10" />
					<div className="size-[12px] rounded-full bg-primary/30" />
					<div className="size-[12px] rounded-full bg-primary/50" />
					<div className="size-[12px] rounded-full bg-primary/70" />
					<div className="size-[12px] rounded-full bg-primary" />
				</div>
				<span>Nhiều</span>
			</div>
		</div>
	)
}
