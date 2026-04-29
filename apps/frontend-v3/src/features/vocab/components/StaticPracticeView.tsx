import { PracticeBack, PracticeFront } from "#/features/vocab/components/PracticeFaces"
import type { PracticeItem, PracticeSession } from "#/features/vocab/use-practice-session"
import { cn } from "#/lib/utils"

const MODE_LABEL = {
	flashcard: "Flashcard",
	reverse: "Đảo ngược",
	typing: "Gõ từ",
	listen: "Nghe",
	fill_blank: "Điền chỗ trống",
} as const

const NEEDS_INPUT: PracticeItem["mode"][] = ["typing", "listen", "fill_blank"]

interface Props {
	item: PracticeItem
	session: PracticeSession
}

export function StaticPracticeView({ item, session }: Props) {
	const needsInput = NEEDS_INPUT.includes(item.mode)
	const isChecking = session.phase === "checking"
	const isRevealed = session.phase === "reveal"
	const tone =
		session.correct === true
			? "border-primary"
			: session.correct === false
				? "border-destructive"
				: "border-border"

	return (
		<div className="space-y-4">
			{/* Prompt card */}
			<div className={cn("card w-full p-6 transition-colors", tone)}>
				<div className="mb-4">
					<span className="text-[11px] font-bold text-muted uppercase tracking-wide bg-background px-2 py-0.5 rounded">
						{MODE_LABEL[item.mode]}
					</span>
				</div>
				<div className="flex flex-col items-center justify-center gap-3 text-center min-h-[8rem]">
					<PracticeFront item={item} />
				</div>
			</div>

			{/* Input + Check (typing / listen / fill_blank, before reveal) */}
			{needsInput && !isRevealed && (
				<InputBlock
					item={item}
					state={{ value: session.value, isChecking, correct: session.correct }}
					actions={{ setValue: session.setValue, check: session.check, reveal: session.reveal }}
				/>
			)}

			{/* Reveal CTA (reverse only — flashcard handles its own flip) */}
			{!needsInput && !isRevealed && (
				<button type="button" onClick={session.reveal} className="btn btn-primary w-full py-3.5 text-base">
					Hiện đáp án
				</button>
			)}

			{/* Reveal block */}
			{isRevealed && (
				<div className="card p-6 space-y-2 text-center">
					<PracticeBack item={item} />
				</div>
			)}
		</div>
	)
}

interface InputProps {
	item: PracticeItem
	state: { value: string; isChecking: boolean; correct: boolean | null }
	actions: { setValue: (v: string) => void; check: () => void; reveal: () => void }
}

function InputBlock({ item, state, actions }: InputProps) {
	const { value, isChecking, correct } = state
	const placeholder = item.mode === "fill_blank" ? "Điền từ còn thiếu..." : "Gõ từ tiếng Anh..."

	return (
		<div className="space-y-3">
			<input
				key={item.entry.word.id}
				type="text"
				value={value}
				onChange={(e) => actions.setValue(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && !isChecking && value.trim()) actions.check()
				}}
				disabled={isChecking}
				ref={focusOnMount}
				placeholder={placeholder}
				className={cn(
					"w-full h-14 px-5 rounded-(--radius-button) border-2 bg-surface text-foreground text-lg focus:outline-none transition",
					isChecking && correct ? "border-primary bg-primary-tint" : "border-border focus:border-primary",
				)}
			/>
			{isChecking ? (
				<button type="button" onClick={actions.reveal} className="btn btn-primary w-full py-3.5 text-base">
					Tiếp tục
				</button>
			) : (
				<button
					type="button"
					onClick={actions.check}
					disabled={!value.trim()}
					className="btn btn-primary w-full py-3.5 text-base disabled:opacity-50"
				>
					Kiểm tra
				</button>
			)}
		</div>
	)
}

function focusOnMount(el: HTMLInputElement | null) {
	el?.focus()
}
