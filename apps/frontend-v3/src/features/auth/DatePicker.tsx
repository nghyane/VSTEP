import { useRef, useState } from "react"
import { cn } from "#/lib/utils"

interface Props {
	value: string
	onChange: (iso: string) => void
}

const YEARS = [2025, 2026, 2027, 2028] as const

function getDaysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate()
}

function isMonthDisabled(month: number, year: number): boolean {
	const now = new Date()
	if (year > now.getFullYear()) return false
	if (year < now.getFullYear()) return true
	return month <= now.getMonth()
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

export function DatePicker({ value, onChange }: Props) {
	const parsed = parseIso(value)
	const now = new Date()

	const [year, setYear] = useState<number>(parsed?.year ?? now.getFullYear())
	const [month, setMonth] = useState<number | null>(parsed?.month ?? null)
	const [day, setDay] = useState<number | null>(parsed?.day ?? null)
	const dayPanelRef = useRef<HTMLDivElement>(null)

	function selectYear(y: number) {
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
		setDay(d)
		if (month === null) return
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
					{YEARS.map((y) => (
						<button
							key={y}
							type="button"
							onClick={() => selectYear(y)}
							className={cn(btnBase, "flex-1", year === y ? btnSelected : btnIdle)}
						>
							{y}
						</button>
					))}
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
						{dayGrid.map((d) => (
							<button
								key={d}
								type="button"
								onClick={() => selectDay(d)}
								className={cn(
									"flex h-8 w-full items-center justify-center rounded-full text-sm font-bold transition-all",
									day === d ? "bg-primary text-white" : "text-muted hover:bg-border-light",
								)}
							>
								{d}
							</button>
						))}
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
