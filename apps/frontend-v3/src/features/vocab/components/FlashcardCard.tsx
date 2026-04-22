import { Icon } from "#/components/Icon"
import type { VocabWord } from "#/features/vocab/types"
import { speak } from "#/lib/utils"

interface Props {
	word: VocabWord
	revealed: boolean
	onReveal: () => void
}

export function FlashcardCard({ word, revealed, onReveal }: Props) {
	return (
		<div className="card w-full max-w-xl mx-auto p-10">
			{/* Word — always visible */}
			<div className="text-center">
				<span className="font-extrabold text-4xl text-foreground">{word.word}</span>
				{word.phonetic && <p className="text-lg text-subtle mt-3">{word.phonetic}</p>}
				{word.part_of_speech && (
					<span className="text-sm text-muted bg-background px-2.5 py-1 rounded inline-block mt-3">
						{word.part_of_speech}
					</span>
				)}
			</div>

			{/* Answer — reveal */}
			{revealed ? (
				<div className="border-t border-border mt-8 pt-8 text-center">
					<div className="flex items-center justify-center gap-2">
						<p className="text-xl text-foreground font-bold">{word.definition}</p>
						<button
							type="button"
							onClick={() => speak(word.word)}
							className="text-muted hover:text-primary transition shrink-0"
						>
							<Icon name="volume" size="sm" />
						</button>
					</div>
					{word.example && <p className="text-base text-muted italic mt-4">"{word.example}"</p>}
					{word.vstep_tip && (
						<p className="text-sm text-info bg-info-tint px-4 py-2.5 rounded-lg mt-4">{word.vstep_tip}</p>
					)}
				</div>
			) : (
				<div className="mt-8 text-center">
					<button
						type="button"
						onClick={onReveal}
						className="btn btn-secondary px-10 py-3 text-base text-muted"
					>
						Xem nghĩa
					</button>
				</div>
			)}
		</div>
	)
}
