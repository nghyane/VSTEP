import { useRef, useState } from "react"
import { cn } from "#/lib/utils"

interface Props {
	value: string
	onChange: (iso: string) => void
	/** Earliest date allowed (ISO YYYY-MM-DD). Defaults to today + 1 day. */
	minDate?: string
}

const YEARS = [2025, 2026, 2027, 2028] as const

function getDaysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate()
}

function startOfDay(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function parseMin(min?: string): Date {
	if (min) {
		const p = parseIso(min)
		if (p) return new Date(p.year, p.month, p.day)
	}
	const t = startOfDay(new Date())
	t.setDate(t.getDate() + 1)
	return t
}

function toIso(year: number, month: number, day: number): string {
	return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function parseIso(iso: string): { year: number; month: number; day: number } | null {
	if (!iso) return null
	const [y, m, d] = iso.split("-").map(Number)
	if (!y || !m || !d) return null
	return { year: y, month: m - 1, day: d }
}

const btnBase = "rounded-full border-2 py-1.5 text-sm font-bold transition-all select-none"
const btnIdle = "border-border bg-surface text-muted hover:border-primary/50 cursor-pointer"
const btnSelected = "border-primary bg-primary/10 text-primary"
const btnDisabled = "border-border bg-border-light text-placeholder cursor-not-allowed opacity-50"

export function DatePicker({ value, onChange, minDate }: Props) {
	const parsed = parseIso(value)
	const min = parseMin(minDate)
	const minYear = min.getFullYear()
	const minMonth = min.getMonth()
	const minDay = min.getDate()

	const [year, setYear] = useState<number>(parsed?.year ?? Math.max(minYear, new Date().getFullYear()))
	const [month, setMonth] = useState<number | null>(parsed?.month ?? null)
	const [day, setDay] = useState<number | null>(parsed?.day ?? null)
	const dayPanelRef = useRef<HTMLDivElement>(null)

	function isYearDisabled(y: number): boolean {
		return y < minYear
	}

	function isMonthDisabled(m: number, y: number): boolean {
		if (y < minYear) return true
		if (y > minYear) return false
		return m < minMonth
	}

	function isDayDisabled(d: number, m: number, y: number): boolean {
		if (y < minYear) return true
		if (y > minYear) return false
		if (m < minMonth) return true
		if (m > minMonth) return false
		return d < minDay
	}

	function selectYear(y: number) {
		if (isYearDisabled(y)) return
		setYear(y)
		setMonth(null)
		setDay(null)
		onChange("")
	}

	function selectMonth(m: number) {
		if (isMonthDisabled(m, year)) return
		setMonth(m)
		setDay(null)
		onChange("")
		requestAnimationFrame(() => {
			dayPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
		})
	}

	function selectDay(d: number) {
		if (month === null) return
		if (isDayDisabled(d, month, year)) return
		setDay(d)
		onChange(toIso(year, month, d))
	}

	const daysInMonth = month !== null ? getDaysInMonth(year, month) : 0
	const dayGrid = month !== null ? Array.from({ length: daysInMonth }, (_, i) => i + 1) : []

	return (
		<div className="space-y-4">
			{/* Year */}
			<div className="space-y-2">
				<p className="text-xs font-bold text-subtle">Chọn năm</p>
				<div className="flex gap-2">
					{YEARS.map((y) => {
						const disabled = isYearDisabled(y)
						return (
							<button
								key={y}
								type="button"
								disabled={disabled}
								onClick={() => selectYear(y)}
								className={cn(btnBase, "flex-1", year === y ? btnSelected : disabled ? btnDisabled : btnIdle)}
							>
								{y}
							</button>
						)
					})}
				</div>
			</div>

			{/* Month */}
			<div className="space-y-2">
				<p className="text-xs font-bold text-subtle">Chọn tháng</p>
				<div className="grid grid-cols-4 gap-2">
					{Array.from({ length: 12 }, (_, i) => i).map((m) => {
						const disabled = isMonthDisabled(m, year)
						const selected = month === m
						return (
							<button
								key={m}
								type="button"
								disabled={disabled}
								onClick={() => selectMonth(m)}
								className={cn(btnBase, selected ? btnSelected : disabled ? btnDisabled : btnIdle)}
							>
								{m + 1}
							</button>
						)
					})}
				</div>
			</div>

			{/* Day — only after month selected */}
			{month !== null && (
				<div ref={dayPanelRef} className="space-y-2 scroll-mt-4">
					<p className="text-xs font-bold text-subtle">Chọn ngày</p>
					<div className="grid grid-cols-7 gap-1">
						{dayGrid.map((d) => {
							const disabled = month !== null && isDayDisabled(d, month, year)
							return (
								<button
									key={d}
									type="button"
									disabled={disabled}
									onClick={() => selectDay(d)}
									className={cn(
										"flex h-8 w-full items-center justify-center rounded-full text-sm font-bold transition-all",
										day === d
											? "bg-primary text-white"
											: disabled
												? "text-placeholder cursor-not-allowed opacity-40"
												: "text-muted hover:bg-border-light",
									)}
								>
									{d}
								</button>
							)
						})}
					</div>
				</div>
			)}

			{/* Summary */}
			{value && (
				<p className="text-xs font-bold text-primary">
					Ngày thi:{" "}
					{new Date(value).toLocaleDateString("vi-VN", {
						day: "numeric",
						month: "long",
						year: "numeric",
					})}
				</p>
			)}
		</div>
	)
}
