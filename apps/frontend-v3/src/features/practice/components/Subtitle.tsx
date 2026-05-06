import { useMemo } from "react"
import type { DialogueTurn } from "#/features/practice/use-tts-player"
import type { ListeningExercise } from "#/features/practice/types"
import { cn } from "#/lib/utils"

interface Props {
	exercise: ListeningExercise
	currentTime: number
	activeWordIndex?: number
	activeTurnIndex?: number
	turns?: DialogueTurn[]
}

const SPEAKER_STYLES = [
	{ bg: "bg-skill-listening", border: "border-skill-listening" },
	{ bg: "bg-foreground", border: "border-foreground" },
]

function getSpeakerStyle(speakers: string[], speaker: string) {
	const idx = speakers.indexOf(speaker)
	return SPEAKER_STYLES[idx % SPEAKER_STYLES.length]
}

// ─── Single-turn dialogue bubble (only current turn visible) ───

function TTSDialogueSubtitle({
	turns,
	activeWordIndex,
	activeTurnIndex,
}: {
	turns: DialogueTurn[]
	activeWordIndex: number
	activeTurnIndex: number
}) {
	const speakers = useMemo(() => {
		const seen: string[] = []
		for (const t of turns) {
			if (t.speaker && !seen.includes(t.speaker)) seen.push(t.speaker)
		}
		return seen
	}, [turns])

	const isDialogue = speakers.length > 1
	const turn = activeTurnIndex >= 0 ? turns[activeTurnIndex] : null

	// Before speaking starts
	if (!turn) {
		return (
			<div className="text-center py-4">
				<p className="text-sm text-muted">Nhấn phát để bắt đầu nghe</p>
			</div>
		)
	}

	const words = turn.text.match(/\S+/g) ?? []
	const style = turn.speaker ? getSpeakerStyle(speakers, turn.speaker) : null
	const isRight = isDialogue && speakers.indexOf(turn.speaker) === 1

	return (
		<div className={cn("flex gap-2.5 items-start", isRight && "flex-row-reverse")}>
			{/* Avatar */}
			{isDialogue && turn.speaker && style && (
				<div
					className={cn(
						"w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[10px] shrink-0 border-2 border-b-4 text-primary-foreground",
						style.bg,
						style.border,
					)}
				>
					{turn.speaker.charAt(0)}
				</div>
			)}

			{/* Content */}
			<div className={cn("flex-1 min-w-0", isRight && "flex flex-col items-end")}>
				{isDialogue && turn.speaker && (
					<p className={cn("text-xs font-bold text-muted mb-1", isRight && "text-right")}>
						{turn.speaker}
					</p>
				)}
				<div
					className={cn(
						"rounded-(--radius-card) border-2 border-b-4 border-border bg-surface px-4 py-2.5",
						isRight && "max-w-[85%]",
					)}
				>
					<p className="text-[15px] leading-relaxed">
						{words.map((word, wi) => {
							const globalIdx = turn.globalWordStart + wi
							const spoken = activeWordIndex >= 0 && globalIdx <= activeWordIndex
							return (
								<span key={wi}>
									<span
										className={cn(
											"transition-colors duration-200",
											spoken ? "text-foreground" : "text-muted/40",
										)}
									>
										{word}
									</span>
									{wi < words.length - 1 ? " " : ""}
								</span>
							)
						})}
					</p>
				</div>
			</div>
		</div>
	)
}

// ─── Single-line monologue (only current sentence) ───

function TTSMonologueSubtitle({
	turns,
	activeWordIndex,
	activeTurnIndex,
}: {
	turns: DialogueTurn[]
	activeWordIndex: number
	activeTurnIndex: number
}) {
	const turn = activeTurnIndex >= 0 ? turns[activeTurnIndex] : null

	if (!turn) {
		return (
			<div className="text-center py-2">
				<p className="text-sm text-muted">Nhấn phát để bắt đầu nghe</p>
			</div>
		)
	}

	const words = turn.text.match(/\S+/g) ?? []
	return (
		<div className="text-center py-2">
			<p className="text-[15px] leading-relaxed">
				{words.map((word, wi) => {
					const globalIdx = turn.globalWordStart + wi
					const spoken = activeWordIndex >= 0 && globalIdx <= activeWordIndex
					return (
						<span key={wi}>
							<span
								className={cn(
									"transition-colors duration-200",
									spoken ? "text-foreground" : "text-muted/40",
								)}
							>
								{word}
							</span>
							{wi < words.length - 1 ? " " : ""}
						</span>
					)
				})}
			</p>
		</div>
	)
}

// ─── Audio timestamp mode ───

function TimestampSubtitle({
	timestamps,
	currentTime,
}: {
	timestamps: ListeningExercise["word_timestamps"]
	currentTime: number
}) {
	return (
		<p className="text-[15px] leading-relaxed">
			{timestamps.map((wt, i) => {
				const spoken = currentTime >= wt.offset
				return (
					<span
						key={i}
						className={cn("transition-colors duration-200", spoken ? "text-foreground" : "text-muted/40")}
					>
						{wt.word}{" "}
					</span>
				)
			})}
		</p>
	)
}

// ─── Static fallback ───

function StaticSubtitle({ transcript }: { transcript: string }) {
	const lines = transcript.split(/\n+/).filter((s) => s.trim())
	return (
		<div className="space-y-3">
			{lines.map((line, i) => (
				<p key={i} className="text-[15px] text-foreground leading-relaxed">
					{line}
				</p>
			))}
		</div>
	)
}

// ─── Main ───

export function Subtitle({ exercise, currentTime, activeWordIndex, activeTurnIndex, turns }: Props) {
	if (exercise.word_timestamps.length > 0) {
		return <TimestampSubtitle timestamps={exercise.word_timestamps} currentTime={currentTime} />
	}

	if (!exercise.transcript) return null

	if (activeWordIndex !== undefined && activeTurnIndex !== undefined && turns && turns.length > 0) {
		const hasDialogue = exercise.part === 2 && turns.some((t) => t.speaker)
		if (hasDialogue) {
			return (
				<TTSDialogueSubtitle
					turns={turns}
					activeWordIndex={activeWordIndex}
					activeTurnIndex={activeTurnIndex}
				/>
			)
		}
		return (
			<TTSMonologueSubtitle
				turns={turns}
				activeWordIndex={activeWordIndex}
				activeTurnIndex={activeTurnIndex}
			/>
		)
	}

	return <StaticSubtitle transcript={exercise.transcript} />
}
