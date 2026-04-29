import { useState } from "react"
import { Icon } from "#/components/Icon"
import type { FsrsState, WordWithState } from "#/features/vocab/types"
import { cn, speak } from "#/lib/utils"

type Bucket = "new" | "learning" | "known"
type FilterKey = "all" | Bucket

const FILTERS = [
	{ key: "all", label: "Tất cả" },
	{ key: "new", label: "Mới" },
	{ key: "learning", label: "Đang học" },
	{ key: "known", label: "Đã thuộc" },
] as const

function bucket(state: FsrsState): Bucket {
	if (state.kind === "new") return "new"
	if (state.kind === "learning" || state.kind === "relearning") return "learning"
	return state.retrievability >= 0.85 ? "known" : "learning"
}

function badge(state: FsrsState): { text: string; color: string } {
	const b = bucket(state)
	if (b === "new") return { text: "Mới", color: "bg-info-tint text-info" }
	if (b === "known") return { text: "Đã thuộc", color: "bg-primary-tint text-primary" }
	return { text: "Đang học", color: "bg-warning-tint text-warning" }
}

interface Props {
	words: WordWithState[]
}

export function WordList({ words }: Props) {
	const [filter, setFilter] = useState<FilterKey>("all")
	const counts = countByBucket(words)
	const filtered = filter === "all" ? words : words.filter((w) => bucket(w.state) === filter)

	return (
		<section className="card overflow-hidden">
			<header className="flex items-center justify-between gap-3 px-5 pt-5">
				<h3 className="font-extrabold text-base text-foreground">
					Từ vựng <span className="text-subtle">· {words.length}</span>
				</h3>
			</header>
			<div className="flex flex-wrap gap-2 px-5 py-4">
				{FILTERS.map((f) => {
					const active = filter === f.key
					const n = f.key === "all" ? words.length : counts[f.key]
					return (
						<button
							key={f.key}
							type="button"
							onClick={() => setFilter(f.key)}
							className={cn(
								"text-xs font-bold px-3 py-1.5 rounded-full border-2 transition",
								active
									? "border-primary bg-primary-tint text-primary"
									: "border-border bg-background text-muted hover:text-foreground",
							)}
						>
							{f.label} <span className="text-subtle">{n}</span>
						</button>
					)
				})}
			</div>

			{filtered.length === 0 ? (
				<div className="px-5 pb-6 text-center text-sm text-muted">Không có từ phù hợp.</div>
			) : (
				<ul className="grid sm:grid-cols-2 gap-px bg-border border-t border-border">
					{filtered.map(({ word: w, state }) => (
						<WordRow key={w.id} word={w} state={state} />
					))}
				</ul>
			)}
		</section>
	)
}

function countByBucket(words: WordWithState[]) {
	const acc: Record<Bucket, number> = { new: 0, learning: 0, known: 0 }
	for (const { state } of words) acc[bucket(state)] += 1
	return acc
}

interface WordRowProps {
	word: WordWithState["word"]
	state: FsrsState
}

function WordRow({ word, state }: WordRowProps) {
	const b = badge(state)
	return (
		<li className="bg-surface px-5 py-3.5">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2 mb-0.5">
						<span className="font-extrabold text-sm text-foreground truncate">{word.word}</span>
						<button
							type="button"
							onClick={() => speak(word.word)}
							className="text-muted hover:text-primary transition shrink-0"
						>
							<Icon name="volume" size="xs" />
						</button>
						{word.part_of_speech && (
							<span className="text-[10px] text-muted bg-background px-1.5 py-0.5 rounded shrink-0">
								{word.part_of_speech}
							</span>
						)}
					</div>
					{word.phonetic && <span className="text-xs text-subtle">{word.phonetic}</span>}
					<p className="text-sm text-muted mt-0.5 line-clamp-2">{word.definition}</p>
				</div>
				<span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", b.color)}>
					{b.text}
				</span>
			</div>
		</li>
	)
}
