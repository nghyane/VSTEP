import { useState } from "react"
import { Icon } from "#/components/Icon"
import type { FsrsState, WordWithState } from "#/features/vocab/types"
import { cn } from "#/lib/utils"

function retrievabilityBadge(state: FsrsState): { text: string; color: string } {
	if (state.stability === 0) return { text: "Mới", color: "bg-info-tint text-info" }
	const r = state.retrievability
	if (r >= 0.9) return { text: `${Math.round(r * 100)}%`, color: "bg-primary-tint text-primary" }
	if (r >= 0.7) return { text: `${Math.round(r * 100)}%`, color: "bg-warning-tint text-warning" }
	return { text: `${Math.round(r * 100)}%`, color: "bg-destructive-tint text-destructive" }
}

interface Props {
	words: WordWithState[]
}

export function WordList({ words }: Props) {
	const [open, setOpen] = useState(false)

	return (
		<section className="card overflow-hidden">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="w-full flex items-center justify-between p-5 hover:bg-background transition"
			>
				<div className="flex items-center gap-2">
					<h3 className="font-bold text-base text-foreground">Từ vựng trong chủ đề</h3>
					<span className="text-xs font-bold text-subtle">{words.length} từ</span>
				</div>
				<Icon
					name="back"
					size="xs"
					className={cn("text-subtle transition-transform", open ? "-rotate-90" : "rotate-180")}
				/>
			</button>

			{open && (
				<div className="border-t border-border">
					{words.map(({ word: w, state }) => {
						const badge = retrievabilityBadge(state)
						return (
							<div key={w.id} className="flex items-start gap-4 px-5 py-3.5 border-b border-border last:border-b-0">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-0.5">
										<span className="font-bold text-sm text-foreground">{w.word}</span>
										{w.phonetic && <span className="text-xs text-subtle">{w.phonetic}</span>}
										{w.part_of_speech && (
											<span className="text-xs text-muted bg-background px-1.5 py-0.5 rounded">{w.part_of_speech}</span>
										)}
									</div>
									<p className="text-sm text-muted">{w.definition}</p>
									{w.example && <p className="text-xs text-subtle mt-0.5 italic">"{w.example}"</p>}
								</div>
								<span className={cn("text-xs font-bold px-2 py-0.5 rounded-full shrink-0", badge.color)}>
									{badge.text}
								</span>
							</div>
						)
					})}
				</div>
			)}
		</section>
	)
}
