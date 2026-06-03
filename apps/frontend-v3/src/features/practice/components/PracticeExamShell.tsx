import { Link } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"
import type { McqQuestion, SubmitResult } from "#/features/practice/types"
import { cn } from "#/lib/utils"

interface PracticeExamShellProps {
	backTo: string
	title: string
	partLabel: string
	questions: McqQuestion[]
	answers: Record<string, number>
	result: SubmitResult | null
	answeredCount: number
	accentColor: string
	primaryActionClassName: string
	onSubmit?: () => void
	submitting?: boolean
	children: React.ReactNode
	rightSidebar?: React.ReactNode
	topBarContent?: React.ReactNode
	resultTopBarContent?: React.ReactNode
	currentQuestionIndex: number
	onPrevious?: () => void
	onNext?: () => void
	onFinish?: () => void
	canFinish?: boolean
	finishLabel?: string
	onQuestionJump?: (index: number) => void
}

export function PracticeExamShell({
	backTo,
	title,
	partLabel,
	questions,
	answers,
	result,
	answeredCount,
	accentColor,
	primaryActionClassName,
	onSubmit,
	submitting,
	children,
	rightSidebar,
	topBarContent,
	resultTopBarContent,
	currentQuestionIndex,
	onPrevious,
	onNext,
	onFinish,
	canFinish,
	finishLabel = "Finish",
	onQuestionJump,
}: PracticeExamShellProps) {
	const isReviewingResult = !!result
	const visibleTopBarContent = isReviewingResult ? resultTopBarContent : topBarContent

	return (
		<div className="flex min-h-screen flex-col bg-background">
			<div className="sticky top-0 z-30 bg-surface px-4 py-3">
				<div className="mx-auto flex max-w-[1440px] items-center gap-3">
					<Link to={backTo} className="shrink-0 p-1 text-muted transition hover:opacity-70">
						<Icon name="back" size="sm" />
					</Link>
					<span
						className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
						style={{
							color: accentColor,
							backgroundColor: `color-mix(in oklch, ${accentColor} 15%, transparent)`,
						}}
					>
						{partLabel}
					</span>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-bold text-foreground">{title}</p>
					</div>
					<div className="hidden shrink-0 items-center gap-4 sm:flex">
						<div className="hidden items-center lg:flex">{visibleTopBarContent}</div>
						<span className="text-xs font-bold text-muted tabular-nums">
							{answeredCount}/{questions.length}
						</span>
					</div>
				</div>
				{visibleTopBarContent ? (
					<div className="mx-auto mt-3 flex max-w-[1440px] flex-wrap items-center gap-3 lg:hidden">
						{visibleTopBarContent}
					</div>
				) : null}
			</div>

			<div
				className={cn(
					"mx-auto flex w-full flex-1 flex-col gap-5 px-4 py-5 xl:grid xl:items-start",
					isReviewingResult
						? "max-w-[1280px] xl:grid-cols-[360px_minmax(0,1fr)]"
						: "max-w-[1440px] xl:grid-cols-[280px_minmax(0,1fr)_160px]",
				)}
			>
				{isReviewingResult ? (
					<div className="flex flex-col gap-4 self-start xl:sticky xl:top-5">{rightSidebar}</div>
				) : (
					<QuestionPalette
						questions={questions}
						answers={answers}
						result={result}
						accentColor={accentColor}
						currentQuestionIndex={currentQuestionIndex}
						onQuestionJump={onQuestionJump}
					/>
				)}
				<div className="card min-w-0 self-start overflow-hidden">{children}</div>
				<div className={cn("flex flex-col gap-4 self-start", isReviewingResult && "hidden")}>
					{rightSidebar ?? (
						<DefaultActions
							onSubmit={onSubmit}
							submitting={submitting}
							disabled={!!result || answeredCount < questions.length}
							primaryActionClassName={primaryActionClassName}
							currentQuestionIndex={currentQuestionIndex}
							onPrevious={onPrevious}
							onNext={onNext}
							onFinish={onFinish}
							canFinish={canFinish}
							finishLabel={finishLabel}
						/>
					)}
				</div>
			</div>
		</div>
	)
}

function DefaultActions({
	onSubmit,
	submitting,
	disabled,
	primaryActionClassName,
	currentQuestionIndex,
	onPrevious,
	onNext,
	onFinish,
	canFinish,
	finishLabel,
}: {
	onSubmit?: () => void
	submitting?: boolean
	disabled: boolean
	primaryActionClassName: string
	currentQuestionIndex: number
	onPrevious?: () => void
	onNext?: () => void
	onFinish?: () => void
	canFinish?: boolean
	finishLabel: string
}) {
	const showFinish = !!canFinish
	const action = showFinish ? (onFinish ?? onSubmit) : onNext

	return (
		<>
			<button
				type="button"
				onClick={onPrevious}
				disabled={!onPrevious || currentQuestionIndex === 0}
				className="btn btn-secondary min-h-12 disabled:cursor-not-allowed disabled:opacity-50"
			>
				← Back
			</button>
			<button
				type="button"
				onClick={action}
				disabled={showFinish ? !(action && canFinish && !disabled && !submitting) : !action}
				className={cn(
					"btn min-h-12 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50",
					primaryActionClassName,
				)}
			>
				{submitting ? "Đang xử lý..." : showFinish ? finishLabel : "Next"}
			</button>
		</>
	)
}

function QuestionPalette({
	questions,
	answers,
	result,
	accentColor,
	currentQuestionIndex,
	onQuestionJump,
}: {
	questions: McqQuestion[]
	answers: Record<string, number>
	result: SubmitResult | null
	accentColor: string
	currentQuestionIndex: number
	onQuestionJump?: (index: number) => void
}) {
	const resultMap = result ? new Map(result.items.map((item) => [item.question_id, item])) : null

	return (
		<div className="card xl:sticky xl:top-20">
			<div className="px-5 pt-4 pb-2">
				<p className="text-lg font-bold text-foreground">Question List</p>
			</div>
			<div className="p-5">
				<div className="grid grid-cols-5 gap-2">
					{questions.map((q, index) => {
						const isAnswered = answers[q.id] !== undefined
						const item = resultMap?.get(q.id)
						const isActive = index === currentQuestionIndex
						const shouldAccent = item?.is_correct || isAnswered || isActive
						const paletteStyle = shouldAccent
							? {
									borderColor: `color-mix(in oklch, ${accentColor} 45%, transparent)`,
									backgroundColor: `color-mix(in oklch, ${accentColor} 15%, transparent)`,
									color: accentColor,
								}
							: undefined
						const stateClass = item
							? item.is_correct
								? ""
								: "border-destructive/30 bg-destructive-tint text-destructive"
							: isAnswered
								? ""
								: "border-border bg-surface text-muted"

						return (
							<button
								key={q.id}
								type="button"
								onClick={() => onQuestionJump?.(index)}
								className={cn(
									"flex h-10 w-10 items-center justify-center rounded-(--radius-button) border-2 border-b-4 text-xs font-bold transition hover:opacity-80 active:translate-y-[1px] active:border-b-2",
									stateClass,
									isActive &&
										"shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-background)_70%,transparent)]",
								)}
								style={paletteStyle}
							>
								{index + 1}
							</button>
						)
					})}
				</div>
			</div>
		</div>
	)
}
