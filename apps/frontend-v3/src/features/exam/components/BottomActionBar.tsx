import { useMutation, useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useRef, useState } from "react"
import { Icon, StaticIcon } from "#/components/Icon"
import { startExamSession } from "#/features/exam/actions"
import type { ExamDetail, SkillKey } from "#/features/exam/types"
import { walletBalanceQuery } from "#/features/wallet/queries"
import { cn } from "#/lib/utils"

const FULL_COST = 25
const PER_SKILL_COST = 8

const TIME_PRESETS = [
	{ label: "10p", value: 10 },
	{ label: "20p", value: 20 },
	{ label: "30p", value: 30 },
	{ label: "45p", value: 45 },
] as const

type DurationMode = number | "unlimited" | null

interface Props {
	detail: ExamDetail
	selected: Set<SkillKey>
}

function computeCost(selected: Set<SkillKey>): number {
	if (selected.size === 0 || selected.size === 4) return FULL_COST
	return Math.min(FULL_COST, PER_SKILL_COST * selected.size)
}

function computeDuration(detail: ExamDetail, selected: Set<SkillKey>): number {
	const { version } = detail
	let total = 0
	if (selected.size === 0 || selected.has("listening"))
		total += version.listening_sections.reduce((s, x) => s + x.duration_minutes, 0)
	if (selected.size === 0 || selected.has("reading"))
		total += version.reading_passages.reduce((s, x) => s + x.duration_minutes, 0)
	if (selected.size === 0 || selected.has("writing"))
		total += version.writing_tasks.reduce((s, x) => s + x.duration_minutes, 0)
	if (selected.size === 0 || selected.has("speaking"))
		total += version.speaking_parts.reduce((s, x) => s + x.duration_minutes, 0)
	return total
}

export function BottomActionBar({ detail, selected }: Props) {
	const navigate = useNavigate()
	const [durationMode, setDurationMode] = useState<DurationMode>(null)
	const [showCustom, setShowCustom] = useState(false)
	const [customDraft, setCustomDraft] = useState("")
	const inputRef = useRef<HTMLInputElement>(null)
	const { data: walletData } = useQuery(walletBalanceQuery)

	const isFullTest = selected.size === 0
	const cost = computeCost(selected)
	const naturalMinutes = computeDuration(detail, selected)
	const balance = walletData?.data.balance ?? null
	const insufficient = balance !== null && balance < cost

	const isChipActive = (v: number) => !showCustom && durationMode === v
	const isRecommendedActive = !showCustom && durationMode === null
	const isCustomSelected =
		!showCustom && typeof durationMode === "number" && !TIME_PRESETS.some((p) => p.value === durationMode)
	const isUnlimited = durationMode === "unlimited"

	const timeLabel = isUnlimited
		? "Không giới hạn"
		: typeof durationMode === "number"
			? `${durationMode} phút`
			: `~${naturalMinutes} phút`

	const mutation = useMutation({
		mutationFn: () => {
			const skills: SkillKey[] = isFullTest
				? ["listening", "reading", "writing", "speaking"]
				: Array.from(selected)
			return startExamSession(detail.exam.id, {
				mode: isFullTest ? "full" : "custom",
				selected_skills: isFullTest ? undefined : skills,
			})
		},
		onSuccess: (result) => {
			navigate({
				to: "/phong-thi/$sessionId",
				params: { sessionId: result.session_id },
			})
		},
	})

	function handleSelectPreset(v: number) {
		setShowCustom(false)
		setDurationMode(v)
	}

	function handleSelectRecommended() {
		setShowCustom(false)
		setDurationMode(null)
	}

	function handleOpenCustom() {
		setShowCustom(true)
		setCustomDraft(isCustomSelected ? String(durationMode) : String(naturalMinutes))
		setTimeout(() => inputRef.current?.focus(), 50)
	}

	function handleCustomConfirm() {
		const parsed = parseInt(customDraft, 10)
		if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 300) {
			setDurationMode(parsed)
		}
		setShowCustom(false)
	}

	function handleCustomDraftChange(value: string) {
		const digits = value.replace(/\D/g, "")
		if (!digits) {
			setCustomDraft("")
			return
		}
		const bounded = Math.min(Math.max(parseInt(digits.slice(0, 3), 10), 1), 300)
		setCustomDraft(String(bounded))
	}

	return (
		<div
			className="fixed bottom-0 right-0 z-20 border-t-2 border-primary/20 bg-surface/95 backdrop-blur-sm"
			style={{ left: "var(--sidebar-width, 260px)", transition: "left 0.2s ease" }}
		>
			<div className="mx-auto max-w-5xl px-6 py-3">
				{isFullTest ? (
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-sm font-bold text-foreground">Làm full test</p>
							<p className="text-xs text-subtle">Toàn bộ 4 kỹ năng · {naturalMinutes} phút</p>
						</div>
						<div className="flex items-center gap-3">
							<CostBadge cost={cost} insufficient={insufficient} />
							<button
								type="button"
								onClick={() => mutation.mutate()}
								disabled={insufficient || mutation.isPending}
								className="btn btn-primary"
							>
								Làm full test
								<Icon name="lightning" size="xs" className="text-white" />
							</button>
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
							{/* Summary */}
							<div className="flex items-center gap-3">
								<span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
									{selected.size} kỹ năng
								</span>
								<span className="flex items-center gap-1.5 text-sm text-muted">
									<StaticIcon name="timer-md" size="xs" />
									{timeLabel}
								</span>
							</div>

							{/* Time picker */}
							<div className="flex flex-wrap items-center gap-1.5">
								<span className="text-xs text-subtle">Thời gian:</span>
								<div className="flex flex-wrap items-center gap-1">
									<button
										type="button"
										onClick={handleSelectRecommended}
										className={cn(
											"rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
											isRecommendedActive
												? "bg-primary text-white"
												: "bg-background text-muted hover:bg-border-light",
										)}
									>
										Gợi ý {naturalMinutes}p
									</button>

									{TIME_PRESETS.map((p) => (
										<button
											key={p.label}
											type="button"
											onClick={() => handleSelectPreset(p.value)}
											className={cn(
												"rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
												isChipActive(p.value)
													? "bg-primary text-white"
													: "bg-background text-muted hover:bg-border-light",
											)}
										>
											{p.label}
										</button>
									))}

									{showCustom ? (
										<input
											ref={inputRef}
											type="text"
											inputMode="numeric"
											autoComplete="off"
											value={customDraft}
											onChange={(e) => handleCustomDraftChange(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") handleCustomConfirm()
												if (e.key === "Escape") setShowCustom(false)
												if (
													!/[0-9]/.test(e.key) &&
													!["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
												) {
													e.preventDefault()
												}
											}}
											onBlur={handleCustomConfirm}
											className="w-16 rounded-full border border-primary bg-surface px-2 py-0.5 text-center text-xs font-medium outline-none focus:ring-1 focus:ring-primary"
											placeholder="phút"
										/>
									) : (
										<button
											type="button"
											onClick={handleOpenCustom}
											className={cn(
												"rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
												isCustomSelected
													? "bg-primary text-white"
													: "bg-background text-muted hover:bg-border-light",
											)}
										>
											{isCustomSelected ? `${durationMode}p` : "Tùy chỉnh"}
										</button>
									)}
								</div>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<CostBadge cost={cost} insufficient={insufficient} />
							<button
								type="button"
								onClick={() => mutation.mutate()}
								disabled={insufficient || mutation.isPending}
								className="btn btn-primary"
							>
								Bắt đầu luyện tập
								<Icon name="lightning" size="xs" className="text-white" />
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

function CostBadge({ cost, insufficient }: { cost: number; insufficient: boolean }) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 text-sm font-bold whitespace-nowrap",
				insufficient ? "text-destructive" : "text-coin-dark",
			)}
		>
			<StaticIcon name="gem-color" size="xs" className={insufficient ? "opacity-50 grayscale" : undefined} />
			{cost} xu
		</span>
	)
}
