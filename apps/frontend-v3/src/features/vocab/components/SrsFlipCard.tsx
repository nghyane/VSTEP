import { Icon } from "#/components/Icon"
import type { VocabWord } from "#/features/vocab/types"
import { useIpa } from "#/lib/phonemize"
import { cn, speak } from "#/lib/utils"

interface Props {
	word: VocabWord
	flipped: boolean
	onReveal: () => void
}

export function SrsFlipCard({ word, flipped, onReveal }: Props) {
	const ipa = useIpa(word.word, word.phonetic)

	return (
		<div className="flip-scene w-full max-w-xl mx-auto">
			<div key={word.id} className={cn("flip-inner", flipped && "flipped")}>
				<div className="flip-face">
					<FlipButton onClick={onReveal} label="Lật thẻ">
						<FlipHeader word={word.word} />
						<div className="flex-1 flex flex-col items-center justify-center gap-3">
							<span className="font-extrabold text-4xl text-foreground break-words">{word.word}</span>
							{ipa && <p className="text-base text-subtle">/{ipa}/</p>}
							{word.part_of_speech && (
								<span className="text-sm text-muted bg-background px-2.5 py-1 rounded inline-block">
									{word.part_of_speech}
								</span>
							)}
						</div>
						<p className="text-xs text-subtle mt-6">Nhấn để lật thẻ</p>
					</FlipButton>
				</div>

				<div className="flip-face flip-face-back">
					<FlipPanel>
						<FlipHeader word={word.word} />
						<div className="flex-1 flex flex-col items-center justify-center gap-3">
							<span className="font-extrabold text-3xl text-foreground break-words">{word.word}</span>
							{ipa && <p className="text-sm text-subtle">/{ipa}/</p>}
							<p className="text-base text-foreground font-bold mt-1">{word.definition}</p>
							{word.example && <p className="text-sm text-muted italic mt-2">"{word.example}"</p>}
							{word.vstep_tip && (
								<p className="text-xs text-info bg-info-tint px-3 py-2 rounded-lg mt-2">{word.vstep_tip}</p>
							)}
						</div>
					</FlipPanel>
				</div>
			</div>
		</div>
	)
}

function FlipHeader({ word }: { word: string }) {
	return (
		<div className="flex items-center justify-between">
			<span className="text-[11px] font-bold text-muted uppercase tracking-wide bg-background px-2 py-0.5 rounded">
				Ôn tập
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

function FlipButton({
	onClick,
	label,
	children,
}: {
	onClick: () => void
	label: string
	children: React.ReactNode
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={label}
			className="card w-full p-8 text-center min-h-[26rem] flex flex-col cursor-pointer hover:shadow-lg transition-shadow border-border"
		>
			{children}
		</button>
	)
}

function FlipPanel({ children }: { children: React.ReactNode }) {
	return (
		<div className="card w-full p-8 text-center min-h-[26rem] flex flex-col border-border">{children}</div>
	)
}
