import { useNavigate } from "@tanstack/react-router"
import { ArrowRight, Clock, LayoutGrid, Timer } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "#/components/ui/button"
import type { ExamSection } from "#/lib/mock/thi-thu"
import { cn } from "#/lib/utils"

interface TimePreset {
	label: string
	value: number | null
	ariaLabel?: string
}

const TIME_PRESETS: TimePreset[] = [
	{ label: "∞", value: null, ariaLabel: "Không giới hạn" },
	{ label: "10p", value: 10 },
	{ label: "20p", value: 20 },
	{ label: "30p", value: 30 },
	{ label: "45p", value: 45 },
]

interface Props {
	examId: number
	sections: readonly ExamSection[]
	selected: Set<string>
	customMinutes: number | null
	onCustomMinutesChange: (minutes: number | null) => void
}

export function BottomActionBar({
	examId,
	sections,
	selected,
	customMinutes,
	onCustomMinutesChange,
}: Props) {
	const navigate = useNavigate()
	const [showCustomInput, setShowCustomInput] = useState(false)
	const [customDraft, setCustomDraft] = useState("")
	const inputRef = useRef<HTMLInputElement>(null)

	const isFullTest = selected.size === 0
	const selectedSections = sections.filter((s) => selected.has(s.id))
	const naturalMinutes = selectedSections.reduce((sum, s) => sum + s.durationMinutes, 0)
	const fullMinutes = sections.reduce((sum, s) => sum + s.durationMinutes, 0)

	const isChipActive = (value: number | null) => !showCustomInput && customMinutes === value
	const isCustomSelected =
		!showCustomInput &&
		customMinutes !== null &&
		!TIME_PRESETS.some((p) => p.value === customMinutes)

	const timeLabel = customMinutes !== null ? `${customMinutes} phút` : `~${naturalMinutes} phút`

	function handleSelectPreset(value: number | null) {
		setShowCustomInput(false)
		onCustomMinutesChange(value)
	}

	function handleOpenCustom() {
		setShowCustomInput(true)
		setCustomDraft(isCustomSelected && customMinutes !== null ? String(customMinutes) : "")
		setTimeout(() => inputRef.current?.focus(), 50)
	}

	function handleCustomConfirm() {
		const parsed = parseInt(customDraft, 10)
		if (!Number.isNaN(parsed) && parsed >= 1) {
			onCustomMinutesChange(Math.min(parsed, naturalMinutes > 0 ? naturalMinutes : parsed))
		}
		setShowCustomInput(false)
	}

	function handleStartExam() {
		navigate({ to: "/phong-thi/$examId", params: { examId: String(examId) } })
	}

	return (
		<div
			className="fixed bottom-0 right-0 z-20 border-t bg-background/95 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-sm"
			style={{ left: "var(--dock-left)", transition: "left 0.2s ease" }}
		>
			<div className="mx-auto max-w-5xl px-4 py-3">
				{isFullTest ? (
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-sm font-semibold">Làm full test</p>
							<p className="text-xs text-muted-foreground">
								Toàn bộ 4 kỹ năng · {fullMinutes} phút
							</p>
						</div>
						<Button className="shrink-0 gap-2" onClick={handleStartExam}>
							Làm full test
							<ArrowRight className="size-4" />
						</Button>
					</div>
				) : (
					<div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
							{/* Selection summary */}
							<div className="flex items-center gap-3">
								<span className="flex items-center gap-1.5 text-sm">
									<LayoutGrid className="size-3.5 text-muted-foreground" />
									<span className="font-semibold">{selected.size} phần</span>
								</span>
								<span className="flex items-center gap-1.5 text-sm text-muted-foreground">
									<Clock className="size-3.5" />
									<span className="font-medium">{timeLabel}</span>
								</span>
							</div>

							{/* Time picker */}
							<div className="flex flex-wrap items-center gap-1.5">
								<span className="flex items-center gap-1 text-xs text-muted-foreground">
									<Timer className="size-3.5 shrink-0" />
									Thời gian:
								</span>
								<div className="flex flex-wrap items-center gap-1">
									{TIME_PRESETS.map((preset) => (
										<button
											key={preset.label}
											type="button"
											aria-label={preset.ariaLabel ?? preset.label}
											onClick={() => handleSelectPreset(preset.value)}
											className={cn(
												"rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
												isChipActive(preset.value)
													? "bg-primary text-primary-foreground"
													: "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
											)}
										>
											{preset.label}
										</button>
									))}

									{showCustomInput ? (
										<input
											ref={inputRef}
											type="number"
											min={1}
											max={naturalMinutes || undefined}
											value={customDraft}
											onChange={(e) => setCustomDraft(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") handleCustomConfirm()
												if (e.key === "Escape") setShowCustomInput(false)
											}}
											onBlur={handleCustomConfirm}
											aria-label="Nhập số phút tùy chỉnh"
											className="w-16 rounded-full border border-primary bg-background px-2 py-0.5 text-center text-xs font-medium outline-none focus:ring-1 focus:ring-primary"
											placeholder="phút"
										/>
									) : (
										<button
											type="button"
											onClick={handleOpenCustom}
											className={cn(
												"rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
												isCustomSelected
													? "bg-primary text-primary-foreground"
													: "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
											)}
										>
											{isCustomSelected ? `${customMinutes}p` : "Tùy chỉnh"}
										</button>
									)}
								</div>
							</div>
						</div>

						<Button className="shrink-0 gap-2" onClick={handleStartExam}>
							Bắt đầu luyện tập
							<ArrowRight className="size-4" />
						</Button>
					</div>
				)}
			</div>
		</div>
	)
}
