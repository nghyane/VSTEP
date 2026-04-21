import { cn } from "#/lib/utils"

interface WordTimestamp {
	word: string
	start: number
	end: number
}

interface Props {
	transcript: string
	wordTimestamps: WordTimestamp[]
	keywords: string[]
	currentTime: number
}

export function Subtitle({ transcript, wordTimestamps, keywords, currentTime }: Props) {
	const keywordSet = new Set(keywords.map((k) => k.toLowerCase()))

	if (wordTimestamps.length > 0) {
		return (
			<p className="text-sm text-foreground leading-relaxed">
				{wordTimestamps.map((wt, i) => {
					const isActive = currentTime >= wt.start && currentTime <= wt.end
					const isKeyword = keywordSet.has(wt.word.toLowerCase().replace(/[.,!?]/g, ""))
					return (
						<span
							key={i}
							className={cn(
								"transition-colors",
								isActive && "bg-info-tint text-skill-listening font-bold px-0.5 rounded",
								isKeyword && !isActive && "font-bold",
							)}
						>
							{wt.word}{" "}
						</span>
					)
				})}
			</p>
		)
	}

	return <p className="text-sm text-foreground leading-relaxed">{transcript}</p>
}
