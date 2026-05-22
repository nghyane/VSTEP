import { Icon } from "#/components/Icon"

interface Props {
	words: string[]
}

export function ConversationSuggestions({ words }: Props) {
	if (words.length === 0) return null
	return (
		<div className="rounded-(--radius-card) border-2 border-b-4 border-border bg-surface px-4 py-3">
			<div className="flex items-center gap-2 text-xs font-bold text-subtle mb-2.5">
				<Icon name="lightning" size="xs" className="text-skill-speaking" />
				Thử dùng các từ sau:
			</div>
			<div className="flex flex-wrap gap-2">
				{words.map((w) => (
					<span
						key={w}
						className="px-3 py-1.5 rounded-(--radius-button) border-2 border-b-4 border-border bg-background text-sm font-bold text-foreground hover:border-skill-speaking/30 transition cursor-default"
					>
						{w}
					</span>
				))}
			</div>
		</div>
	)
}
