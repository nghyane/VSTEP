// OnboardingDialog — modal wizard overlay 5 bước.
// Che mờ trang hiện tại, user hoàn thành onboarding rồi mới đóng.

import { Rocket, X } from "lucide-react"
import { useState } from "react"
import type { OnboardingData } from "#/lib/onboarding/types"
import { cn } from "#/shared/lib/utils"
import { ConfirmationStep } from "./OnboardingStep.Confirmation"
import { ExamDateStep } from "./OnboardingStep.ExamDate"
import { GoalBandStep } from "./OnboardingStep.GoalBand"
import { LevelStep } from "./OnboardingStep.Level"
import { MotivationStep } from "./OnboardingStep.Motivation"

interface Props {
	open: boolean
	onClose: () => void
	onComplete: (data: OnboardingData) => void
}

// ─── Steps config ─────────────────────────────────────────────────

const STEPS = [
	{ label: "Trình độ", description: "Đánh giá đầu vào" },
	{ label: "Ngày thi", description: "Lên kế hoạch" },
	{ label: "Mục tiêu", description: "Band đích" },
	{ label: "Điểm yếu", description: "Lựa chọn của bạn" },
	{ label: "Xác nhận", description: "Hoàn tất" },
] as const

// ─── Dialog ───────────────────────────────────────────────────────

export function OnboardingDialog({ open, onClose, onComplete }: Props) {
	const [step, setStep] = useState(0)
	const [data, setData] = useState<OnboardingData>({
		entryLevel: "A2",
		examDate: null,
		targetBand: "B2",
		weaknesses: [],
		motivation: null,
	})

	const total = STEPS.length

	function handleBack() {
		setStep((s) => Math.max(s - 1, 0))
	}

	function handleAdvance() {
		setStep((s) => Math.min(s + 1, total - 1))
	}

	function handleComplete() {
		onComplete(data)
		onClose()
	}

	const stepComponents = [
		<LevelStep
			key={0}
			value={data.entryLevel}
			onChange={(v) => setData((p) => ({ ...p, entryLevel: v }))}
		/>,
		<ExamDateStep
			key={1}
			value={data.examDate}
			onChange={(v) => setData((p) => ({ ...p, examDate: v }))}
		/>,
		<GoalBandStep
			key={2}
			value={data.targetBand}
			entryLevel={data.entryLevel}
			onChange={(v) => setData((p) => ({ ...p, targetBand: v }))}
		/>,
		<MotivationStep
			key={3}
			data={{ weaknesses: data.weaknesses, motivation: data.motivation }}
			onChange={(partial) => setData((p) => ({ ...p, ...partial }))}
		/>,
		<ConfirmationStep key={4} data={data} />,
	]

	if (!open) return null

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center px-4"
			role="dialog"
			aria-modal="true"
			aria-label="Thiết lập mục tiêu"
		>
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				onClick={onClose}
				aria-hidden="true"
			/>

			{/* Modal — grows naturally, caps at 85vh so content scrolls */}
			<div className="relative z-10 flex w-full max-w-sm flex-col rounded-2xl border bg-background shadow-xl max-h-[85vh]">
				{/* Modal header */}
				<div className="flex items-center justify-between px-5 pt-5">
					<div className="flex items-center gap-2">
						<span className="text-xs font-medium text-muted-foreground">
							Bước {step + 1} / {total}
						</span>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label="Đóng"
					>
						<X className="size-3.5" />
					</button>
				</div>

				{/* Step title */}
				<div className="px-5 pt-1">
					<h2 className="text-base font-bold">{STEPS[step as 0].label}</h2>
					<p className="mt-0.5 text-xs text-muted-foreground">{STEPS[step as 0].description}</p>
				</div>

				{/* Progress bar */}
				<div className="mt-3 flex h-0.5 shrink-0 bg-muted">
					<div
						className="h-full bg-primary transition-all duration-300"
						style={{ width: `${((step + 1) / total) * 100}%` }}
					/>
				</div>

				{/* Step content — scrolls if taller than max height */}
				<div className="max-h-[60vh] overflow-y-auto px-5 py-4" key={step}>
					{stepComponents[step]}
				</div>

				{/* Navigation footer */}
				<div className="flex shrink-0 items-center justify-between border-t px-5 py-3.5">
					<button
						type="button"
						onClick={handleBack}
						disabled={step === 0}
						className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
					>
						<span>←</span>
						Quay lại
					</button>

					{/* Step dots */}
					<div className="flex gap-1.5" aria-hidden="true">
						{STEPS.map((_, i) => (
							<span
								key={i}
								className={cn(
									"size-1.5 rounded-full transition-colors",
									i === step ? "bg-primary" : i < step ? "bg-primary/40" : "bg-muted",
								)}
							/>
						))}
					</div>

					{step < total - 1 ? (
						<button
							type="button"
							onClick={handleAdvance}
							className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
						>
							Tiếp tục
							<span>→</span>
						</button>
					) : (
						<button
							type="button"
							onClick={handleComplete}
							className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
						>
							<Rocket className="size-3.5" />
							Bắt đầu chinh phục!
						</button>
					)}
				</div>
			</div>
		</div>
	)
}
