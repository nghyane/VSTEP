import type { VocabWord } from "#/features/vocab/types"

interface Props {
	word: VocabWord
	flipped: boolean
	onFlip: () => void
}

export function FlashcardCard({ word, flipped, onFlip }: Props) {
	return (
		<button
			type="button"
			onClick={onFlip}
			className="card w-full p-8 min-h-[280px] flex flex-col items-center justify-center text-center"
		>
			<span className="font-extrabold text-3xl text-foreground">{word.word}</span>
			{word.phonetic && <span className="text-base text-subtle mt-2">{word.phonetic}</span>}
			{word.part_of_speech && (
				<span className="text-sm text-muted bg-background px-2 py-0.5 rounded mt-2">{word.part_of_speech}</span>
			)}

			{flipped ? (
				<div className="mt-6 border-t border-border pt-6 w-full">
					<p className="text-lg text-foreground font-bold">{word.definition}</p>
					{word.example && <p className="text-sm text-muted mt-3 italic">"{word.example}"</p>}
					{word.vstep_tip && (
						<p className="text-xs text-info mt-3 bg-info-tint px-3 py-2 rounded-lg">{word.vstep_tip}</p>
					)}
				</div>
			) : (
				<p className="text-sm text-subtle mt-6">Nhấn để xem nghĩa</p>
			)}
		</button>
	)
}
