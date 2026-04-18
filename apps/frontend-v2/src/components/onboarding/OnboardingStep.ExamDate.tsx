// ExamDateStep — chọn ngày thi dự kiến
// Spec: year → month → day picker, content scrollable, summary at bottom

import { useState } from "react"
import { cn } from "#/lib/utils"

interface Props {
	value: Date | null
	onChange: (date: Date | null) => void
}

const YEARS = [2026, 2027, 2028] as const
const MONTHS = [
	{ value: 0, label: "Tháng 1" },
	{ value: 1, label: "Tháng 2" },
	{ value: 2, label: "Tháng 3" },
	{ value: 3, label: "Tháng 4" },
	{ value: 4, label: "Tháng 5" },
	{ value: 5, label: "Tháng 6" },
	{ value: 6, label: "Tháng 7" },
	{ value: 7, label: "Tháng 8" },
	{ value: 8, label: "Tháng 9" },
	{ value: 9, label: "Tháng 10" },
	{ value: 10, label: "Tháng 11" },
	{ value: 11, label: "Tháng 12" },
]

function getDaysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate()
}

function isMonthDisabled(month: number, selectedYear: number): boolean {
	const now = new Date()
	const currentYear = now.getFullYear()
	const currentMonth = now.getMonth()
	if (selectedYear > currentYear) return false
	if (selectedYear < currentYear) return false
	return month <= currentMonth
}

function formatDate(date: Date): string {
	return date.toLocaleDateString("vi-VN", {
		day: "numeric",
		month: "long",
		year: "numeric",
	})
}

export function ExamDateStep({ value, onChange }: Props) {
	const now = new Date()
	const currentYear = now.getFullYear()

	const [selectedYear, setSelectedYear] = useState<number>(
		value ? value.getFullYear() : currentYear,
	)
	const [selectedMonth, setSelectedMonth] = useState<number | null>(value ? value.getMonth() : null)
	const [selectedDay, setSelectedDay] = useState<number | null>(value ? value.getDate() : null)

	function handleYearSelect(year: number) {
		setSelectedYear(year)
		setSelectedMonth(null)
		setSelectedDay(null)
		onChange(null)
	}

	function handleMonthSelect(month: number) {
		setSelectedMonth(month)
		setSelectedDay(null)
		onChange(null)
	}

	function handleDaySelect(day: number) {
		setSelectedDay(day)
		if (selectedMonth === null) return
		const d = new Date(selectedYear, selectedMonth, day)
		onChange(d)
	}

	const daysInMonth = selectedMonth !== null ? getDaysInMonth(selectedYear, selectedMonth) : 0
	const dayGrid = selectedMonth !== null ? Array.from({ length: daysInMonth }, (_, i) => i + 1) : []

	const selectedDate =
		selectedYear && selectedMonth !== null && selectedDay !== null
			? new Date(selectedYear, selectedMonth, selectedDay)
			: null

	return (
		<div className="space-y-4">
			<p className="text-xs text-muted-foreground">Ngày bạn dự định "chốt số" tấm bằng VSTEP?</p>

			{/* Year selector */}
			<div className="space-y-1.5">
				<p className="text-[11px] font-medium text-muted-foreground">Chọn năm</p>
				<div className="flex gap-2">
					{YEARS.map((year) => (
						<button
							key={year}
							type="button"
							onClick={() => handleYearSelect(year)}
							className={cn(
								"flex-1 rounded-lg border-2 py-1.5 text-xs font-semibold transition-all",
								selectedYear === year
									? "border-primary bg-primary/10 text-primary"
									: "border-border bg-background text-muted-foreground hover:border-primary/40",
							)}
						>
							{year}
						</button>
					))}
				</div>
			</div>

			{/* Month selector */}
			<div className="space-y-1.5">
				<p className="text-[11px] font-medium text-muted-foreground">Chọn tháng</p>
				<div className="grid grid-cols-4 gap-1.5">
					{MONTHS.map((m) => {
						const disabled = isMonthDisabled(m.value, selectedYear)
						const selected = selectedMonth === m.value
						return (
							<button
								key={m.value}
								type="button"
								disabled={disabled}
								onClick={() => !disabled && handleMonthSelect(m.value)}
								className={cn(
									"rounded-lg border-2 py-1.5 text-[11px] font-medium transition-all",
									selected
										? "border-primary bg-primary/10 text-primary"
										: disabled
											? "border-border bg-muted/50 text-muted-foreground/40 cursor-not-allowed"
											: "border-border bg-background text-muted-foreground hover:border-primary/40",
								)}
							>
								{m.label.replace("Tháng ", "")}
							</button>
						)
					})}
				</div>
			</div>

			{/* Day selector — only show when month is selected */}
			{selectedMonth !== null && (
				<div className="space-y-1.5">
					<p className="text-[11px] font-medium text-muted-foreground">Chọn ngày</p>
					<div className="grid grid-cols-7 gap-1">
						{dayGrid.map((day) => {
							const isSelected = selectedDay === day
							return (
								<button
									key={day}
									type="button"
									onClick={() => handleDaySelect(day)}
									className={cn(
										"flex size-7 items-center justify-center rounded-md text-[11px] font-medium transition-all",
										isSelected
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:bg-muted",
									)}
								>
									{day}
								</button>
							)
						})}
					</div>
				</div>
			)}

			{/* Summary */}
			{selectedDate && (
				<div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
					<span className="text-[11px] text-muted-foreground">Ngày chốt số:</span>
					<span className="text-xs font-bold text-primary">{formatDate(selectedDate)}</span>
				</div>
			)}
		</div>
	)
}
