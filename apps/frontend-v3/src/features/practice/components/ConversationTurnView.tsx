import { useMemo, useState } from "react"
import { Icon } from "#/components/Icon"
import { ConversationFeedback } from "#/features/practice/components/ConversationFeedback"
import type { ConversationScenario, ConversationTurn } from "#/features/practice/types"
import { cn, translateText } from "#/lib/utils"

interface Props {
	turn: ConversationTurn
	scenario: ConversationScenario
	isSpeaking?: boolean
	highlightCharIndex?: number
}

function TranslateButton({ text, align = "left" }: { text: string; align?: "left" | "right" }) {
	const [translation, setTranslation] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const toggle = async () => {
		if (translation) {
			setTranslation(null)
			return
		}
		setLoading(true)
		const result = await translateText(text)
		setTranslation(result)
		setLoading(false)
	}

	return (
		<div className={cn(align === "right" && "text-right")}>
			<button
				type="button"
				onClick={toggle}
				disabled={loading}
				className={cn(
					"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-(--radius-button) border-2 border-b-4 text-xs font-bold transition mt-2",
					"active:translate-y-[1px] active:border-b-2",
					translation
						? "border-skill-speaking/40 bg-skill-speaking/10 text-skill-speaking"
						: "border-border bg-surface text-subtle hover:text-foreground hover:border-skill-speaking/30",
				)}
			>
				<Icon name="swap" size="xs" />
				{loading ? "Đang dịch..." : translation ? "Ẩn dịch" : "Dịch"}
			</button>
			{translation && (
				<p className={cn("text-sm text-muted italic mt-1.5 px-1", align === "right" && "text-right")}>
					{translation}
				</p>
			)}
		</div>
	)
}

function HighlightText({ text, charIndex }: { text: string; charIndex: number }) {
	const words = useMemo(() => {
		const result: { word: string; start: number }[] = []
		const regex = /\S+/g
		let match = regex.exec(text)
		while (match) {
			result.push({ word: match[0], start: match.index })
			match = regex.exec(text)
		}
		return result
	}, [text])

	// Find which word is being spoken based on charIndex
	let activeIdx = -1
	if (charIndex >= 0) {
		for (let i = words.length - 1; i >= 0; i--) {
			if (charIndex >= words[i].start) {
				activeIdx = i
				break
			}
		}
	}

	return (
		<p className="text-[15px] leading-relaxed">
			{words.map((w, i) => (
				<span key={`${w.start}`}>
					<span
						className={cn(
							"transition-colors duration-200",
							i <= activeIdx ? "text-foreground" : "text-muted/40",
						)}
					>
						{w.word}
					</span>
					{i < words.length - 1 ? " " : ""}
				</span>
			))}
		</p>
	)
}

export function ConversationTurnView({ turn, scenario, isSpeaking, highlightCharIndex = -1 }: Props) {
	if (turn.role === "ai") {
		return (
			<div className="flex gap-3">
				<div className="w-9 h-9 rounded-full bg-skill-speaking text-primary-foreground flex items-center justify-center font-extrabold text-xs shrink-0 border-2 border-b-4 border-skill-speaking">
					{scenario.character_name.charAt(0)}
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-bold text-muted mb-1.5">{scenario.character_name}</p>
					<div className="rounded-(--radius-card) border-2 border-b-4 border-border bg-surface px-4 py-3">
						{isSpeaking ? (
							<HighlightText text={turn.text} charIndex={highlightCharIndex} />
						) : (
							<p className="text-[15px] text-foreground leading-relaxed">{turn.text}</p>
						)}
					</div>
					<TranslateButton text={turn.text} />
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col items-end">
			<div className="flex gap-3 max-w-[85%] flex-row-reverse">
				<div className="w-9 h-9 rounded-full bg-foreground text-surface flex items-center justify-center font-extrabold text-[10px] shrink-0 border-2 border-b-4 border-foreground">
					You
				</div>
				<div className="flex-1 min-w-0">
					<div className="rounded-(--radius-card) border-2 border-b-4 border-border bg-surface px-4 py-3">
						<p className="text-[15px] text-foreground leading-relaxed">{turn.text}</p>
					</div>
					<TranslateButton text={turn.text} align="right" />
				</div>
			</div>
			{turn.feedback && (
				<div className="w-full mt-2">
					<ConversationFeedback feedback={turn.feedback} />
				</div>
			)}
		</div>
	)
}
