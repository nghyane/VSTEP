import { useState } from "react"
import { Icon } from "#/components/Icon"
import type { ConversationTurnFeedback } from "#/features/practice/types"
import { useIpa } from "#/lib/phonemize"
import { censorProfanityWords } from "#/lib/profanity"
import { cn, speak } from "#/lib/utils"

interface Props {
	feedback: ConversationTurnFeedback
	userText: string
}

export function ConversationFeedback({ feedback, userText }: Props) {
	const [open, setOpen] = useState(false)
	const grammarCount = feedback.grammar_corrections?.length ?? 0
	const hasProfanity = feedback.profanity?.found ?? false
	const betterText = feedback.better ?? userText
	const improvementLabel = feedback.grammar_ok ? "Câu của bạn" : "Cách nói tốt hơn"
	const summary = hasProfanity
		? "Từ ngữ không phù hợp"
		: `${feedback.word_count.used}/${feedback.word_count.target} từ${grammarCount > 0 ? ` · ${grammarCount} gợi ý ngữ pháp` : " · Ngữ pháp OK"}`
	const betterIpa = useIpa(betterText, feedback.better_ipa)

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
					{hasProfanity && feedback.profanity && (
						<div className="rounded-(--radius-card) border-2 border-b-4 border-warning/30 bg-warning/5 p-3">
							<div className="flex items-start gap-2">
								<Icon name="lightning" size="xs" className="text-warning shrink-0 mt-0.5" />
								<div>
									<p className="text-sm font-bold text-warning">Nên dùng ngôn ngữ lịch sự khi luyện nói</p>
									<p className="text-xs text-muted mt-1">
										Phát hiện từ ngữ không phù hợp ({feedback.profanity.count} lần):{" "}
										<span className="font-bold text-foreground">
											{censorProfanityWords(feedback.profanity.words)}
										</span>
										. Hãy nói lại bằng tiếng Anh phù hợp với ngữ cảnh học thuật.
									</p>
								</div>
							</div>
						</div>
					)}

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

					{/* Câu của bạn / Cách nói tốt hơn */}
					<div className="rounded-(--radius-card) border-2 border-b-4 border-info/30 bg-info/5 p-3">
						<div className="flex items-center gap-2 mb-1">
							<Icon name="lightning" size="xs" className="text-info" />
							<p className="text-[10px] font-extrabold text-info uppercase tracking-[0.18em]">
								{improvementLabel}
							</p>
						</div>
						<div className="flex items-center gap-2">
							<p className="text-sm font-bold text-foreground flex-1">{betterText}</p>
							<button
								type="button"
								onClick={() => speak(betterText)}
								className="shrink-0 p-1.5 rounded-(--radius-button) text-info hover:bg-info/10 transition"
								aria-label="Nghe phát âm"
							>
								<Icon name="volume" size="xs" />
							</button>
						</div>
						{betterIpa && <p className="text-xs text-muted italic mt-1">/{betterIpa}/</p>}
					</div>
				</div>
			)}
		</div>
	)
}
