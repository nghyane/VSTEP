import { cn } from "#/lib/utils"

interface WordTimestamp {
	word: string
	offset: number
	duration: number
}

interface Props {
	transcript: string
	wordTimestamps: WordTimestamp[]
	keywords: string[]
	currentTime: number
}

export function Subtitle({ transcript, wordTimestamps, keywords, currentTime }: Props) {
	if (wordTimestamps.length > 0) {
		return (
			<p className="text-sm text-foreground leading-relaxed">
				{wordTimestamps.map((wt, i) => {
					const isActive = currentTime >= wt.offset && currentTime <= wt.offset + wt.duration
					return (
						<span
							key={i}
							className={cn(isActive && "bg-info-tint text-skill-listening font-bold px-0.5 rounded")}
						>
							{wt.word}{" "}
						</span>
					)
				})}
			</p>
		)
	}

	if (keywords.length === 0) {
		return <p className="text-sm text-foreground leading-relaxed">{transcript}</p>
	}

	const pattern = new RegExp(`(${keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi")
	const parts = transcript.split(pattern)

	return (
		<p className="text-sm text-foreground leading-relaxed">
			{parts.map((part, i) => {
				const isKeyword = keywords.some((k) => k.toLowerCase() === part.toLowerCase())
				return isKeyword
					? <strong key={i} className="text-skill-listening font-bold">{part}</strong>
					: <span key={i}>{part}</span>
			})}
		</p>
	)
}
