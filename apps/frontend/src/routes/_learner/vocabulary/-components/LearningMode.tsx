import {
	ArrowDown01Icon,
	ArrowUp01Icon,
	CheckmarkCircle02Icon,
	VolumeHighIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToggleKnown, useTopicProgress } from "@/hooks/use-vocabulary"
import { cn } from "@/lib/utils"
import type { VocabularyWord } from "@/types/api"

interface LearningModeProps {
	topicId: string
	words: VocabularyWord[]
}

export function LearningMode({ topicId, words }: LearningModeProps) {
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
	const { data: progress } = useTopicProgress(topicId)
	const toggleKnown = useToggleKnown()

	const knownIds = new Set(progress?.knownWordIds ?? [])

	function toggleExpanded(id: string) {
		setExpandedIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}

	function handleToggleKnown(wordId: string) {
		const isCurrentlyKnown = knownIds.has(wordId)
		toggleKnown.mutate({ wordId, known: !isCurrentlyKnown })
	}

	const knownCount = knownIds.size
	const totalCount = words.length
	const progressPercent = totalCount > 0 ? (knownCount / totalCount) * 100 : 0

	return (
		<div className="space-y-4">
			{/* Progress */}
			<div className="space-y-2">
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">Tiến độ</span>
					<span className="font-semibold">
						{knownCount}/{totalCount} từ đã thuộc
					</span>
				</div>
				<div className="h-2 overflow-hidden rounded-full bg-muted">
					<div
						className="h-full rounded-full bg-primary transition-all"
						style={{ width: `${progressPercent}%` }}
					/>
				</div>
			</div>

			{/* Word list */}
			<div className="space-y-2">
				{words.map((word) => {
					const isExpanded = expandedIds.has(word.id)
					const isKnown = knownIds.has(word.id)

					return (
						<div
							key={word.id}
							className={cn(
								"rounded-xl border bg-card",
								isKnown && "border-primary/30 bg-primary/5",
							)}
						>
							{/* Collapsed row */}
							<div className="flex items-center gap-3 px-4 py-3">
								<button
									type="button"
									className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
								>
									<HugeiconsIcon icon={VolumeHighIcon} className="size-4" />
								</button>

								<span className="font-semibold">{word.word}</span>

								{word.phonetic && (
									<span className="text-sm text-muted-foreground">{word.phonetic}</span>
								)}

								<span className="rounded-md bg-muted px-2 py-0.5 text-xs">{word.partOfSpeech}</span>

								<div className="ml-auto flex items-center gap-2">
									<Button
										variant={isKnown ? "default" : "outline"}
										size="sm"
										className="gap-1.5 text-xs"
										onClick={() => handleToggleKnown(word.id)}
										disabled={toggleKnown.isPending}
									>
										<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" />
										Đã thuộc
									</Button>

									<button
										type="button"
										className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
										onClick={() => toggleExpanded(word.id)}
									>
										<HugeiconsIcon
											icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
											className="size-4"
										/>
									</button>
								</div>
							</div>

							{/* Expanded content */}
							{isExpanded && (
								<div className="border-t px-4 pb-4 pt-3">
									<div className="space-y-2 text-sm">
										<p>
											<span className="font-medium">Definition: </span>
											{word.definition}
										</p>
										<p>
											<span className="font-medium">Giải thích: </span>
											{word.explanation}
										</p>
										<div>
											<span className="font-medium">Ví dụ:</span>
											<ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
												{word.examples.map((ex: string, idx: number) => (
													<li key={idx}>{ex}</li>
												))}
											</ul>
										</div>
									</div>
								</div>
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
}
