// SentenceCards — UI components cho SentencePracticeView.

import { CircleCheck, CircleX, Lightbulb, RotateCcw } from "lucide-react"
import type { WritingSentenceItem } from "#/mocks/writing-sentences"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"
import { SpeakerIcon } from "#/shared/ui/SpeakerIcon"
import { normalize } from "./sentence-utils"

const DIFFICULTY_STYLE = {
	easy: "bg-success/10 text-success",
	medium: "bg-warning/10 text-warning",
	hard: "bg-destructive/10 text-destructive",
} as const

const DIFFICULTY_LABEL = { easy: "Dễ", medium: "Trung bình", hard: "Khó" } as const

export function ProgressDots(props: {
	sentences: readonly WritingSentenceItem[]
	current: number
	checked: Record<string, boolean>
	onSelect: (i: number) => void
}) {
	const { sentences, current, checked, onSelect } = props
	return (
		<div className="flex gap-1.5">
			{sentences.map((s, i) => (
				<button
					key={s.id}
					type="button"
					onClick={() => onSelect(i)}
					className={cn(
						"h-1.5 flex-1 rounded-full transition-colors",
						checked[s.id] === true && "bg-success",
						checked[s.id] === false && "bg-destructive",
						!(s.id in checked) && i === current && "bg-primary",
						!(s.id in checked) && i !== current && "bg-muted",
					)}
				/>
			))}
		</div>
	)
}

export function ResultBanner({ correctCount, total }: { correctCount: number; total: number }) {
	const pct = total > 0 ? (correctCount / total) * 100 : 0
	return (
		<div className="rounded-2xl bg-muted/50 p-5">
			<h3 className="text-lg font-semibold">Kết quả</h3>
			<p className="mt-1 text-sm text-muted-foreground">
				Bạn trả lời đúng{" "}
				<span className="font-semibold text-success">
					{correctCount}/{total}
				</span>{" "}
				câu
			</p>
			<div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
				<div
					className="h-full rounded-full bg-success transition-all"
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	)
}

export function PracticeCard(props: {
	sentence: WritingSentenceItem
	words: string[]
	slots: string[]
	isChecked: boolean
	isCorrect: boolean
	isWrong: boolean
	hintRevealed: boolean
	setHint: () => void
	onSlotChange: (idx: number, value: string) => void
	onSlotKeyDown: (idx: number, event: React.KeyboardEvent<HTMLInputElement>) => void
	onCheck: () => void
	onSpeak: () => void
	isSpeaking: boolean
	setInputRef: (idx: number, el: HTMLInputElement | null) => void
	hasInput: boolean
}) {
	const {
		sentence,
		words,
		slots,
		isChecked,
		isCorrect,
		isWrong,
		hintRevealed,
		setHint,
		onSlotChange,
		onSlotKeyDown,
		onSpeak,
		isSpeaking,
		setInputRef,
	} = props
	return (
		<div className="mx-auto max-w-3xl space-y-5 rounded-2xl bg-muted/50 p-5">
			<div className="flex items-center justify-between">
				<span
					className={cn(
						"rounded-md px-2 py-0.5 text-xs font-medium",
						DIFFICULTY_STYLE[sentence.difficulty],
					)}
				>
					{DIFFICULTY_LABEL[sentence.difficulty]}
				</span>
				<span className="text-xs text-muted-foreground">{words.length} từ</span>
			</div>
			<div className="flex flex-col items-center gap-3">
				<button
					type="button"
					className="flex size-16 items-center justify-center text-primary transition-opacity hover:opacity-80"
					onClick={onSpeak}
					aria-label="Phát âm câu"
				>
					<SpeakerIcon active={isSpeaking} className="size-7" />
				</button>
				<p className="text-center text-sm text-muted-foreground">{sentence.translation}</p>
			</div>
			<div className="flex flex-wrap items-end justify-center gap-x-1.5 gap-y-3">
				{words.map((expected, idx) => {
					const value = slots[idx] ?? ""
					const isWordCorrect = isChecked && normalize(value) === normalize(expected)
					const isWordWrong = isChecked && !isWordCorrect
					return (
						<input
							key={`${sentence.id}-${idx}`}
							ref={(el) => setInputRef(idx, el)}
							type="text"
							value={value}
							maxLength={Math.max(expected.length, 2)}
							onChange={(e) => onSlotChange(idx, e.target.value)}
							onKeyDown={(e) => onSlotKeyDown(idx, e)}
							disabled={isChecked}
							style={{ width: `${Math.max(expected.length * 0.65 + 1.2, 2.5)}rem` }}
							className={cn(
								"border-b-2 bg-transparent pb-1 text-center text-sm font-medium outline-none transition-colors focus:border-primary",
								!isChecked && "border-muted-foreground/30",
								isWordCorrect && "border-success text-success",
								isWordWrong && "border-destructive text-destructive",
							)}
						/>
					)
				})}
			</div>
			{!isChecked && (
				<div className="flex justify-center">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="gap-1.5 text-xs"
						onClick={setHint}
					>
						<Lightbulb className="size-4" />
						Gợi ý
					</Button>
				</div>
			)}
			{hintRevealed && !isChecked && (
				<p className="text-center text-xs text-muted-foreground">
					Bắt đầu bằng: "<span className="font-semibold">{words.slice(0, 3).join(" ")}</span>..." ·{" "}
					{words.length} từ
				</p>
			)}
			{isCorrect && (
				<p className="flex items-center justify-center gap-1.5 text-sm font-medium text-success">
					<CircleCheck className="size-4" />
					Chính xác!
				</p>
			)}
			{isWrong && (
				<div className="space-y-1 text-center">
					<p className="flex items-center justify-center gap-1.5 text-sm font-medium text-destructive">
						<CircleX className="size-4" />
						Chưa đúng
					</p>
					<p className="text-sm">
						Đáp án: <span className="font-medium text-success">{sentence.sentence}</span>
					</p>
				</div>
			)}
			{isChecked && (
				<div className="space-y-3 border-t pt-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Giải thích ngữ pháp
						</p>
						<p className="mt-1 text-sm">{sentence.explanation}</p>
					</div>
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Ứng dụng trong Writing
						</p>
						<p className="mt-1 text-sm">{sentence.writingUsage}</p>
					</div>
				</div>
			)}
		</div>
	)
}

export function FooterActions(props: {
	isFirst: boolean
	isChecked: boolean
	allChecked: boolean
	hasInput: boolean
	onPrevious: () => void
	onNext: () => void
	onCheck: () => void
	onReset: () => void
}) {
	const { isFirst, isChecked, allChecked, hasInput, onPrevious, onNext, onCheck, onReset } = props
	return (
		<div className="flex items-center justify-center gap-3">
			<Button variant="outline" size="sm" disabled={isFirst} onClick={onPrevious}>
				Trước
			</Button>
			{!isChecked ? (
				<Button disabled={!hasInput} onClick={onCheck}>
					Kiểm tra
				</Button>
			) : allChecked ? (
				<Button variant="outline" size="sm" onClick={onReset}>
					<RotateCcw className="size-4" />
					Làm lại
				</Button>
			) : (
				<Button variant="outline" size="sm" onClick={onNext}>
					Tiếp
				</Button>
			)}
		</div>
	)
}
