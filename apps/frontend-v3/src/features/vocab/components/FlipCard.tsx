import { Icon } from "#/components/Icon"
import type { PracticeItem } from "#/features/vocab/use-practice-session"
import { cn, speak } from "#/lib/utils"

const MODE_LABEL = {
	flashcard: "Flashcard",
	reverse: "Đảo ngược",
	typing: "Gõ từ",
	listen: "Nghe",
	fill_blank: "Điền chỗ trống",
} as const

interface FlipState {
	flipped: boolean
	highlight: "correct" | "wrong" | null
	onFlip: () => void
}

interface Faces {
	front: React.ReactNode
	back: React.ReactNode
}

interface Props {
	item: PracticeItem
	flip: FlipState
	faces: Faces
}

export function FlipCard({ item, flip, faces }: Props) {
	const word = item.entry.word
	const { flipped, highlight, onFlip } = flip
	const tone =
		highlight === "correct"
			? "border-primary"
			: highlight === "wrong"
				? "border-destructive"
				: "border-border"

	return (
		<div className="flip-scene w-full max-w-xl mx-auto">
			<div className={cn("flip-inner", flipped && "flipped")}>
				{/* FRONT */}
				<div className="flip-face">
					<button
						type="button"
						onClick={onFlip}
						aria-label="Lật thẻ"
						className={cn(
							"card w-full p-8 text-center min-h-[26rem] flex flex-col cursor-pointer hover:shadow-lg transition-shadow",
							tone,
						)}
					>
						<CardHeader mode={item.mode} word={word.word} />
						<div className="flex-1 flex flex-col items-center justify-center gap-3">{faces.front}</div>
						<p className="text-xs text-subtle mt-6">Nhấn để lật thẻ</p>
					</button>
				</div>

				{/* BACK */}
				<div className="flip-face flip-face-back">
					<button
						type="button"
						onClick={onFlip}
						aria-label="Lật lại"
						className={cn(
							"card w-full p-8 text-center min-h-[26rem] flex flex-col cursor-pointer hover:shadow-lg transition-shadow",
							tone,
						)}
					>
						<CardHeader mode={item.mode} word={word.word} />
						<div className="flex-1 flex flex-col items-center justify-center gap-3">{faces.back}</div>
					</button>
				</div>
			</div>
		</div>
	)
}

function CardHeader({ mode, word }: { mode: PracticeItem["mode"]; word: string }) {
	return (
		<div className="flex items-center justify-between">
			<span className="text-[11px] font-bold text-muted uppercase tracking-wide bg-background px-2 py-0.5 rounded">
				{MODE_LABEL[mode]}
			</span>
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation()
					speak(word)
				}}
				className="text-muted hover:text-primary transition"
				aria-label="Phát âm"
			>
				<Icon name="volume" size="sm" />
			</button>
		</div>
	)
}
