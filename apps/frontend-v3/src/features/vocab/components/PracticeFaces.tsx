import { Icon } from "#/components/Icon"
import type { PracticeItem } from "#/features/vocab/use-practice-session"
import { speak } from "#/lib/utils"

interface Props {
	item: PracticeItem
}

export function PracticeFront({ item }: Props) {
	const w = item.entry.word
	switch (item.mode) {
		case "flashcard":
			return (
				<>
					<span className="font-extrabold text-4xl text-foreground break-words">{w.word}</span>
					{w.phonetic && <p className="text-base text-subtle">{w.phonetic}</p>}
					{w.part_of_speech && <PartOfSpeech text={w.part_of_speech} />}
				</>
			)
		case "reverse":
			return (
				<>
					<p className="text-xs font-bold text-muted uppercase tracking-wide">Nhớ lại từ tiếng Anh</p>
					<p className="font-extrabold text-2xl text-foreground leading-snug">{w.definition}</p>
					{w.part_of_speech && <PartOfSpeech text={w.part_of_speech} />}
				</>
			)
		case "typing":
			return (
				<>
					<p className="text-xs font-bold text-muted uppercase tracking-wide">Gõ từ tiếng Anh</p>
					<p className="font-extrabold text-xl text-foreground leading-snug">{w.definition}</p>
					{w.part_of_speech && <PartOfSpeech text={w.part_of_speech} />}
				</>
			)
		case "listen":
			return (
				<>
					<p className="text-xs font-bold text-muted uppercase tracking-wide">Nghe và gõ từ</p>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation()
							speak(w.word)
						}}
						className="size-20 rounded-full bg-primary-tint border-2 border-b-4 border-primary flex items-center justify-center hover:scale-105 transition"
						aria-label="Phát âm"
					>
						<Icon name="volume" size="lg" className="text-primary" />
					</button>
					{w.part_of_speech && <PartOfSpeech text={w.part_of_speech} />}
				</>
			)
		case "fill_blank":
			return (
				<>
					<p className="text-xs font-bold text-muted uppercase tracking-wide">Điền vào chỗ trống</p>
					<p className="font-bold text-lg text-foreground leading-relaxed">{item.maskedSentence}</p>
				</>
			)
	}
}

export function PracticeBack({ item }: Props) {
	const w = item.entry.word
	return (
		<>
			<span className="font-extrabold text-3xl text-foreground break-words">{w.word}</span>
			{w.phonetic && <p className="text-sm text-subtle">{w.phonetic}</p>}
			<p className="text-base text-foreground font-bold mt-1">{w.definition}</p>
			{w.example && (
				<p className="text-sm text-muted italic mt-2">
					"{item.mode === "fill_blank" ? highlightWord(w.example, w.word) : w.example}"
				</p>
			)}
			{w.vstep_tip && (
				<p className="text-xs text-info bg-info-tint px-3 py-2 rounded-lg mt-2">{w.vstep_tip}</p>
			)}
		</>
	)
}

function PartOfSpeech({ text }: { text: string }) {
	return <span className="text-sm text-muted bg-background px-2.5 py-1 rounded inline-block">{text}</span>
}

function highlightWord(sentence: string, word: string): React.ReactNode {
	const re = new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\w*)\\b`, "i")
	const parts = sentence.split(re)
	return parts.map((p, i) => {
		const key = `${i}-${p}`
		return i % 2 === 1 ? (
			<strong key={key} className="text-primary">
				{p}
			</strong>
		) : (
			<span key={key}>{p}</span>
		)
	})
}
