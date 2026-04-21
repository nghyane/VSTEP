import type { VocabWord } from "#/features/vocab/types"

interface Props {
	word: VocabWord
	revealed: boolean
	onReveal: () => void
}

export function FlashcardCard({ word, revealed, onReveal }: Props) {
	return (
		<div className="card w-full max-w-lg mx-auto p-8">
			{/* Word — always visible */}
			<div className="text-center">
				<span className="font-extrabold text-3xl text-foreground">{word.word}</span>
				{word.phonetic && (
					<p className="text-base text-subtle mt-2">{word.phonetic}</p>
				)}
				{word.part_of_speech && (
					<span className="text-sm text-muted bg-background px-2 py-0.5 rounded inline-block mt-2">
						{word.part_of_speech}
					</span>
				)}
			</div>

			{/* Answer — reveal */}
			{revealed ? (
				<div className="border-t border-border mt-6 pt-6 text-center">
					<p className="text-lg text-foreground font-bold">{word.definition}</p>
					{word.example && (
						<p className="text-sm text-muted italic mt-3">"{word.example}"</p>
					)}
					{word.vstep_tip && (
						<p className="text-xs text-info bg-info-tint px-3 py-2 rounded-lg mt-3">
							{word.vstep_tip}
						</p>
					)}
				</div>
			) : (
				<div className="mt-6 text-center">
					<button
						type="button"
						onClick={onReveal}
						className="btn btn-secondary px-8 py-2.5 text-sm text-muted"
					>
						Xem nghĩa
					</button>
				</div>
			)}
		</div>
	)
}
