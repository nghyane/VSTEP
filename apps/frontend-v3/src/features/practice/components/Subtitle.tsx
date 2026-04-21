import { useMemo } from "react"
import type { ListeningExercise } from "#/features/practice/types"
import { cn } from "#/lib/utils"

interface Props {
	exercise: ListeningExercise
	currentTime: number
}

function buildKeywordSet(keywords: string[]): Set<string> {
	return new Set(keywords.map((k) => k.toLowerCase()))
}

export function Subtitle({ exercise, currentTime }: Props) {
	const keywordSet = useMemo(() => buildKeywordSet(exercise.keywords), [exercise.keywords])
	const timestamps = exercise.word_timestamps

	if (timestamps.length > 0) {
		return (
			<p className="text-sm text-foreground leading-relaxed">
				{timestamps.map((wt, i) => {
					const active = currentTime >= wt.offset && currentTime <= wt.offset + wt.duration
					const keyword = keywordSet.has(wt.word.toLowerCase().replace(/[.,!?;:]/g, ""))
					return (
						<span
							key={i}
							className={cn(
								keyword && "font-bold text-skill-listening",
								active && "bg-info-tint rounded px-0.5",
							)}
						>
							{wt.word}{" "}
						</span>
					)
				})}
			</p>
		)
	}

	if (!exercise.transcript) return null

	if (keywordSet.size === 0) {
		return <p className="text-sm text-foreground leading-relaxed">{exercise.transcript}</p>
	}

	const pattern = new RegExp(
		`(${exercise.keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
		"gi",
	)
	const parts = exercise.transcript.split(pattern)

	return (
		<p className="text-sm text-foreground leading-relaxed">
			{parts.map((part, i) =>
				keywordSet.has(part.toLowerCase()) ? (
					<strong key={i} className="text-skill-listening font-bold">
						{part}
					</strong>
				) : (
					<span key={i}>{part}</span>
				),
			)}
		</p>
	)
}
