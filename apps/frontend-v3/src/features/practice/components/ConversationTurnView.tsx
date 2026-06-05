import { useMemo, useState } from "react"
import { Icon } from "#/components/Icon"
import { ConversationFeedback } from "#/features/practice/components/ConversationFeedback"
import type { ConversationTurn } from "#/features/practice/types"
import { useAuth } from "#/lib/auth"
import { getAvatarUrl, getProfileAvatarSrc } from "#/lib/avatar"
import { useIpa } from "#/lib/phonemize"
import { censorProfanityText } from "#/lib/profanity"
import { cn, translateText } from "#/lib/utils"

interface Props {
	turn: ConversationTurn
	aiName: string
	isSpeaking?: boolean
	highlightCharIndex?: number
}

function TurnActions({
	text,
	ipa,
	align = "left",
}: {
	text: string
	ipa?: string | null
	align?: "left" | "right"
}) {
	const [showIpa, setShowIpa] = useState(false)
	const [translation, setTranslation] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const displayIpa = useIpa(text, ipa)

	const toggleTranslate = async () => {
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
		<div className="mt-2 space-y-1.5">
			<div className={cn("flex items-center gap-1.5 flex-wrap", align === "right" && "justify-end")}>
				{displayIpa && (
					<button
						type="button"
						onClick={() => setShowIpa((v) => !v)}
						className={cn(
							"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-(--radius-button) border-2 border-b-4 text-xs font-bold transition",
							"active:translate-y-[1px] active:border-b-2",
							showIpa
								? "border-info/40 bg-info/10 text-info"
								: "border-border bg-surface text-subtle hover:text-foreground hover:border-info/30",
						)}
					>
						<span className="text-[11px] font-black">T</span>
						{showIpa ? "Ẩn phiên âm" : "Phiên âm"}
					</button>
				)}
				<button
					type="button"
					onClick={toggleTranslate}
					disabled={loading}
					className={cn(
						"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-(--radius-button) border-2 border-b-4 text-xs font-bold transition",
						"active:translate-y-[1px] active:border-b-2",
						translation
							? "border-skill-speaking/40 bg-skill-speaking/10 text-skill-speaking"
							: "border-border bg-surface text-subtle hover:text-foreground hover:border-skill-speaking/30",
					)}
				>
					<Icon name="swap" size="xs" />
					{loading ? "Đang dịch..." : translation ? "Ẩn dịch" : "Dịch"}
				</button>
			</div>

			{showIpa && displayIpa && (
				<p className={cn("text-sm text-muted italic px-1", align === "right" && "text-right")}>
					/{displayIpa}/
				</p>
			)}

			{translation && (
				<p className={cn("text-sm text-muted italic px-1", align === "right" && "text-right")}>
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

export function ConversationTurnView({ turn, aiName, isSpeaking, highlightCharIndex = -1 }: Props) {
	const profile = useAuth((s) => (s.status === "authenticated" ? s.profile : null))
	const userAvatarSrc = profile ? getProfileAvatarSrc(profile) : null
	const displayText = turn.feedback?.profanity?.found ? censorProfanityText(turn.text) : turn.text

	if (turn.role === "ai") {
		return (
			<div className="flex gap-3">
				<img
					src={getAvatarUrl(aiName)}
					alt={aiName}
					className="w-9 h-9 rounded-full bg-skill-speaking/20 border-2 border-skill-speaking/30 shrink-0 object-cover"
				/>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-bold text-muted mb-1.5">{aiName}</p>
					<div className="rounded-(--radius-card) border-2 border-b-4 border-border bg-surface px-4 py-3">
						{isSpeaking ? (
							<HighlightText text={turn.text} charIndex={highlightCharIndex} />
						) : (
							<p className="text-[15px] text-foreground leading-relaxed">{turn.text}</p>
						)}
					</div>
					<TurnActions text={turn.text} ipa={turn.ipa} />
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col items-end">
			<div className="flex gap-3 max-w-[85%] flex-row-reverse">
				{userAvatarSrc ? (
					<img
						src={userAvatarSrc}
						alt="You"
						className="w-9 h-9 rounded-full bg-foreground/10 border-2 border-b-4 border-foreground/20 shrink-0 object-contain p-0.5"
					/>
				) : (
					<div className="w-9 h-9 rounded-full bg-foreground text-surface flex items-center justify-center font-extrabold text-[10px] shrink-0 border-2 border-b-4 border-foreground">
						You
					</div>
				)}
				<div className="flex-1 min-w-0">
					<div className="rounded-(--radius-card) border-2 border-b-4 border-border bg-surface px-4 py-3">
						<p className="text-[15px] text-foreground leading-relaxed">{displayText}</p>
					</div>
					<TurnActions text={displayText} ipa={turn.ipa} align="right" />
				</div>
			</div>
			{turn.feedback && (
				<div className="w-full mt-2">
					<ConversationFeedback feedback={turn.feedback} userText={displayText} />
				</div>
			)}
		</div>
	)
}
