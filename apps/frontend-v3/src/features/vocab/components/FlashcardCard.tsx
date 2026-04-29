import { Icon } from "#/components/Icon"
import type { VocabWord } from "#/features/vocab/types"
import { speak } from "#/lib/utils"

export type FlashcardDirection = "front" | "reverse"

interface Props {
	word: VocabWord
	revealed: boolean
	direction: FlashcardDirection
	onReveal: () => void
}

export function FlashcardCard({ word, revealed, direction, onReveal }: Props) {
	const showWordFirst = direction === "front"
	return (
		<div className="card w-full max-w-xl mx-auto p-10">
			<div className="text-center">
				{showWordFirst ? (
					<>
						<span className="font-extrabold text-4xl text-foreground">{word.word}</span>
						{word.phonetic && <p className="text-lg text-subtle mt-3">{word.phonetic}</p>}
						{word.part_of_speech && (
							<span className="text-sm text-muted bg-background px-2.5 py-1 rounded inline-block mt-3">
								{word.part_of_speech}
							</span>
						)}
					</>
				) : (
					<>
						<p className="font-extrabold text-3xl text-foreground leading-snug">{word.definition}</p>
						<p className="text-sm text-subtle mt-3">Nhớ lại từ tiếng Anh</p>
					</>
				)}
			</div>

			{revealed ? (
				<div className="border-t border-border mt-8 pt-8 text-center">
					{showWordFirst ? (
						<>
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
						</>
					) : (
						<>
							<div className="flex items-center justify-center gap-2">
								<span className="font-extrabold text-3xl text-foreground">{word.word}</span>
								<button
									type="button"
									onClick={() => speak(word.word)}
									className="text-muted hover:text-primary transition shrink-0"
								>
									<Icon name="volume" size="sm" />
								</button>
							</div>
							{word.phonetic && <p className="text-base text-subtle mt-2">{word.phonetic}</p>}
							{word.example && <p className="text-base text-muted italic mt-4">"{word.example}"</p>}
						</>
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
