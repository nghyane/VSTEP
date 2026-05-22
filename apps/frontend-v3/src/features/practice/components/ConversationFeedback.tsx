import { useState } from "react"
import { Icon } from "#/components/Icon"
import type { ConversationTurnFeedback } from "#/features/practice/types"
import { cn, speak } from "#/lib/utils"

interface Props {
	feedback: ConversationTurnFeedback
}

export function ConversationFeedback({ feedback }: Props) {
	const [open, setOpen] = useState(false)
	const grammarCount = feedback.grammar_corrections?.length ?? 0
	const summary = `${feedback.word_count.used}/${feedback.word_count.target} từ${grammarCount > 0 ? ` · ${grammarCount} gợi ý ngữ pháp` : " · Ngữ pháp OK"}`

	return (
		<div className="mt-2">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex w-full items-center justify-between gap-3 rounded-(--radius-button) border-2 border-b-4 border-border bg-surface px-3 py-2.5 text-left transition hover:border-skill-speaking/40 active:translate-y-[1px] active:border-b-2"
			>
				<div className="flex items-center gap-2 text-xs font-bold text-foreground">
					<Icon name="clipboard" size="xs" className="text-muted" />
					{summary}
				</div>
				<Icon
					name="back"
					size="xs"
					className={cn("text-muted transition-transform", open ? "rotate-90" : "-rotate-90")}
				/>
			</button>

			{open && (
				<div className="mt-2 space-y-3">
					{/* Sử dụng từ */}
					{feedback.vocab_check.length > 0 && (
						<div>
							<p className="text-[10px] font-extrabold text-subtle uppercase tracking-[0.18em] mb-2.5 px-1">
								Sử dụng từ
							</p>
							<ul className="space-y-2">
								{feedback.vocab_check.map((v) => (
									<li key={v.phrase} className="flex items-center gap-2.5 text-sm px-1">
										{v.used ? (
											<Icon name="check" size="xs" className="text-success shrink-0" />
										) : (
											<Icon name="close" size="xs" className="text-destructive shrink-0 scale-75" />
										)}
										<span className={cn("font-bold", v.used ? "text-foreground" : "text-muted line-through")}>
											{v.phrase}
										</span>
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Ngữ pháp */}
					{grammarCount > 0 && (
						<div>
							<p className="text-[10px] font-extrabold text-subtle uppercase tracking-[0.18em] mb-2 px-1">
								Ngữ pháp
							</p>
							<div className="space-y-2">
								{feedback.grammar_corrections.map((g) => (
									<div
										key={g.wrong}
										className="rounded-(--radius-card) border-2 border-b-4 border-warning/30 bg-warning/5 p-3"
									>
										<div className="flex items-center gap-2 mb-1">
											<Icon name="lightning" size="xs" className="text-warning" />
											<span className="text-sm text-muted line-through">{g.wrong}</span>
										</div>
										<p className="text-sm font-bold text-foreground mb-1">{g.correct}</p>
										<p className="text-xs text-muted italic">{g.explanation}</p>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Cách nói tốt hơn */}
					<div className="rounded-(--radius-card) border-2 border-b-4 border-info/30 bg-info/5 p-3">
						<div className="flex items-center gap-2 mb-1">
							<Icon name="lightning" size="xs" className="text-info" />
							<p className="text-[10px] font-extrabold text-info uppercase tracking-[0.18em]">
								Cách nói tốt hơn
							</p>
						</div>
						<div className="flex items-center gap-2">
							<p className="text-sm font-bold text-foreground flex-1">{feedback.better}</p>
							<button
								type="button"
								onClick={() => speak(feedback.better ?? "")}
								className="shrink-0 p-1.5 rounded-(--radius-button) text-info hover:bg-info/10 transition"
								aria-label="Nghe phát âm"
							>
								<Icon name="volume" size="xs" />
							</button>
						</div>
						{feedback.better_ipa && <p className="text-xs text-muted italic mt-1">/{feedback.better_ipa}/</p>}
					</div>
				</div>
			)}
		</div>
	)
}
