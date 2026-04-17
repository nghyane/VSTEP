import { useNavigate } from "@tanstack/react-router"
import { ArrowRight, Clock, LayoutGrid, Timer } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { CoinIcon } from "#/components/common/CoinIcon"
import { TopUpDialog } from "#/components/common/TopUpDialog"
import { Button } from "#/components/ui/button"
import { computeSessionCost, useCoins } from "#/lib/coins/coin-store"
import type { ExamSection, ExamSkillKey } from "#/lib/mock/thi-thu"
import { cn } from "#/lib/utils"

type ExamDurationSelection = number | "unlimited" | null

interface TimePreset {
	label: string
	value: number | "unlimited"
	ariaLabel?: string
}

const TIME_PRESETS: TimePreset[] = [
	{ label: "∞", value: "unlimited", ariaLabel: "Không giới hạn" },
	{ label: "10p", value: 10 },
	{ label: "20p", value: 20 },
	{ label: "30p", value: 30 },
	{ label: "45p", value: 45 },
]

const CUSTOM_MINUTES_MIN = 1
const CUSTOM_MINUTES_MAX = 300

interface Props {
	examId: number
	sections: readonly ExamSection[]
	selected: Set<string>
	customMinutes: ExamDurationSelection
	onCustomMinutesChange: (minutes: ExamDurationSelection) => void
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
	const [topUpOpen, setTopUpOpen] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const coins = useCoins()

	const isFullTest = selected.size === 0
	const selectedSections = sections.filter((s) => selected.has(s.id))
	const naturalMinutes = selectedSections.reduce((sum, s) => sum + s.durationMinutes, 0)
	const fullMinutes = sections.reduce((sum, s) => sum + s.durationMinutes, 0)
	const recommendedMinutes = naturalMinutes
	const selectedSkills: Set<ExamSkillKey> = isFullTest
		? new Set()
		: new Set(selectedSections.map((s) => s.skill))
	const sessionCost = computeSessionCost(selectedSkills)
	const insufficientCoins = coins < sessionCost

	const isChipActive = (value: number | "unlimited") => !showCustomInput && customMinutes === value
	const isRecommendedActive = !showCustomInput && customMinutes === null
	const isCustomSelected =
		!showCustomInput &&
		typeof customMinutes === "number" &&
		!TIME_PRESETS.some((p) => p.value === customMinutes)
	const isUnlimited = customMinutes === "unlimited"
	const shouldShowRecommendationHint = !isRecommendedActive && recommendedMinutes > 0

	const timeLabel = isUnlimited
		? "Không giới hạn"
		: typeof customMinutes === "number"
			? `${customMinutes} phút`
			: `Gợi ý ~${recommendedMinutes} phút`

	function handleSelectPreset(value: number | "unlimited") {
		setShowCustomInput(false)
		onCustomMinutesChange(value)
	}

	function handleSelectRecommended() {
		setShowCustomInput(false)
		onCustomMinutesChange(null)
	}

	function handleOpenCustom() {
		setShowCustomInput(true)
		setCustomDraft(isCustomSelected ? String(customMinutes) : String(recommendedMinutes))
		setTimeout(() => inputRef.current?.focus(), 50)
	}

	function handleCustomConfirm() {
		const parsed = parseInt(customDraft, 10)
		if (
			!Number.isNaN(parsed) &&
			Number.isInteger(parsed) &&
			parsed >= CUSTOM_MINUTES_MIN &&
			parsed <= CUSTOM_MINUTES_MAX
		) {
			onCustomMinutesChange(parsed)
		}
		setShowCustomInput(false)
	}

	function handleCustomDraftChange(value: string) {
		const digitsOnly = value.replace(/\D/g, "")
		if (!digitsOnly) {
			setCustomDraft("")
			return
		}

		const parsed = parseInt(digitsOnly.slice(0, 3), 10)
		if (parsed < CUSTOM_MINUTES_MIN && customDraft !== String(CUSTOM_MINUTES_MIN)) {
			toast.info("Tối thiểu 1 phút nhé")
		}
		if (parsed > CUSTOM_MINUTES_MAX && customDraft !== String(CUSTOM_MINUTES_MAX)) {
			toast.warning("Tối đa 300 phút thôi nhé")
		}
		const bounded = Math.min(Math.max(parsed, CUSTOM_MINUTES_MIN), CUSTOM_MINUTES_MAX)
		setCustomDraft(String(bounded))
	}

	function handleStartExam() {
		if (insufficientCoins) {
			setTopUpOpen(true)
			return
		}
		navigate({
			to: "/phong-thi/$examId",
			params: { examId: String(examId) },
			search: isFullTest
				? {}
				: {
						durationMode: isUnlimited ? "unlimited" : undefined,
						minutes: typeof customMinutes === "number" ? customMinutes : undefined,
						sections: selectedSections.map((section) => section.id).join(","),
					},
		})
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
						<div className="flex items-center gap-2">
							<CostBadge cost={sessionCost} insufficient={insufficientCoins} />
							{insufficientCoins ? (
								<Button
									variant="secondary"
									className="shrink-0 gap-2 bg-amber-500 text-white hover:bg-amber-500/90"
									onClick={handleStartExam}
								>
									<CoinIcon size={16} className="-translate-y-px" />
									Nạp thêm xu
								</Button>
							) : (
								<Button className="shrink-0 gap-2" onClick={handleStartExam}>
									Làm full test
									<ArrowRight className="size-4" />
								</Button>
							)}
						</div>
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
									<button
										type="button"
										onClick={handleSelectRecommended}
										aria-label={`Dùng thời gian gợi ý ${recommendedMinutes} phút`}
										className={cn(
											"rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
											isRecommendedActive
												? "bg-primary text-primary-foreground"
												: "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
										)}
									>
										Gợi ý {recommendedMinutes}p
									</button>

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
											type="text"
											inputMode="numeric"
											autoComplete="off"
											minLength={1}
											maxLength={3}
											value={customDraft}
											onChange={(e) => handleCustomDraftChange(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") handleCustomConfirm()
												if (e.key === "Escape") setShowCustomInput(false)
												if (
													!/[0-9]/.test(e.key) &&
													e.key !== "Backspace" &&
													e.key !== "Delete" &&
													e.key !== "ArrowLeft" &&
													e.key !== "ArrowRight" &&
													e.key !== "Tab"
												) {
													e.preventDefault()
												}
											}}
											onBlur={handleCustomConfirm}
											aria-label="Nhập số phút tùy chỉnh từ 1 đến 300"
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
								{shouldShowRecommendationHint ? (
									<p className="text-xs text-muted-foreground">
										Theo phần đã chọn: ~{recommendedMinutes} phút
									</p>
								) : null}
							</div>
						</div>

						<div className="flex items-center gap-2">
							<CostBadge cost={sessionCost} insufficient={insufficientCoins} />
							{insufficientCoins ? (
								<Button
									variant="secondary"
									className="shrink-0 gap-2 bg-amber-500 text-white hover:bg-amber-500/90"
									onClick={handleStartExam}
								>
									<CoinIcon size={16} className="-translate-y-px" />
									Nạp thêm xu
								</Button>
							) : (
								<Button className="shrink-0 gap-2" onClick={handleStartExam}>
									Bắt đầu luyện tập
									<ArrowRight className="size-4" />
								</Button>
							)}
						</div>
					</div>
				)}
			</div>
			<TopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} />
		</div>
	)
}

function CostBadge({ cost, insufficient }: { cost: number; insufficient: boolean }) {
	return (
		<output
			className={cn(
				"inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-4 text-sm font-bold whitespace-nowrap",
				insufficient
					? "bg-rose-50 text-rose-700 ring-1 ring-rose-300 dark:bg-rose-950/40 dark:text-rose-200"
					: "bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm",
			)}
			aria-label={`Cần ${cost} xu để bắt đầu`}
		>
			<CoinIcon size={16} className={insufficient ? "opacity-60 grayscale" : undefined} />
			<span className="leading-none tabular-nums">{cost} xu</span>
		</output>
	)
}
