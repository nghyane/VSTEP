// AnnotatedFeedbackView — bài viết có highlight lỗi + margin stickers + connector lines.
// Layout 2-cột: paragraph stickers (trái) | bài viết annotated (phải).

import { AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import type { AnnotatedWritingFeedback } from "#/features/practice/lib/mock-ai-grading"
import {
	AnnotatedParagraph,
	AnnotationDetail,
	CohesionHintCard,
	ParagraphStatusIcon,
	ParagraphStickerContent,
	SummaryCard,
} from "./AnnotatedFeedbackParts"
import { StickerAnchor } from "./sticker/StickerAnchor"
import { StickerLayer } from "./sticker/StickerLayer"
import { StickerNote } from "./sticker/StickerNote"
import { useConnectorGeometry } from "./sticker/useConnectorGeometry"

interface Props {
	text: string
	feedback: AnnotatedWritingFeedback
}

export function AnnotatedFeedbackView({ text, feedback }: Props) {
	const [activeIdx, setActiveIdx] = useState<number | null>(null)
	const { containerRef, paths, registerNote, registerAnchor, recompute } = useConnectorGeometry()

	useEffect(() => {
		const t = setTimeout(recompute, 80)
		return () => clearTimeout(t)
	}, [recompute])

	const scrollToAnnotation = useCallback((idx: number) => {
		setActiveIdx(idx)
		const el = document.querySelector(`[data-annotation-idx="${idx}"]`)
		el?.scrollIntoView({ behavior: "smooth", block: "center" })
		el?.classList.add("ring-2", "ring-primary/40")
		setTimeout(() => el?.classList.remove("ring-2", "ring-primary/40"), 1500)
	}, [])

	const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0)

	return (
		<div className="space-y-6">
			<StickerLayer paths={paths} containerRef={containerRef}>
				<div className="rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-5">
					<h3 className="mb-4 text-lg font-semibold">Bài viết đã chấm</h3>
					<div className="space-y-4">
						{paragraphs.map((para, pIdx) => {
							const pFeedback = feedback.paragraphs.find((p) => p.index === pIdx)
							const cohesion = feedback.cohesionHints.find((c) => c.afterParagraphIndex === pIdx)
							const stickerId = `result-para-${pIdx}`
							return (
								<div key={pIdx}>
									<div className="flex items-start gap-3">
										{pFeedback && (
											<div className="hidden w-44 shrink-0 lg:block">
												<StickerNote
													id={stickerId}
													tone={pFeedback.status === "good" ? "ok" : "warn"}
													registerRef={registerNote}
												>
													<ParagraphStickerContent feedback={pFeedback} index={pIdx} />
												</StickerNote>
											</div>
										)}
										<StickerAnchor
											id={stickerId}
											registerRef={registerAnchor}
											className="min-w-0 flex-1"
										>
											{pFeedback && (
												<div className="mb-1.5 flex items-center gap-1.5 lg:hidden">
													<ParagraphStatusIcon status={pFeedback.status} />
													<span className="text-xs font-semibold text-muted-foreground">
														Đoạn {pIdx + 1} · {pFeedback.wordCount} từ
													</span>
												</div>
											)}
											<AnnotatedParagraph
												fullText={text}
												para={para}
												paraIndex={pIdx}
												annotations={feedback.annotations}
												activeIdx={activeIdx}
												onSelect={setActiveIdx}
											/>
										</StickerAnchor>
									</div>
									{cohesion && <CohesionHintCard hint={cohesion} />}
								</div>
							)
						})}
					</div>
					{activeIdx !== null && feedback.annotations[activeIdx] && (
						<AnnotationDetail
							annotation={feedback.annotations[activeIdx]}
							onClose={() => setActiveIdx(null)}
						/>
					)}
					<div className="mt-4 flex items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
						<span className="inline-flex items-center gap-1.5">
							<span className="inline-block size-3 rounded bg-destructive/20" />
							Lỗi — cần sửa
						</span>
						<span className="inline-flex items-center gap-1.5">
							<span className="inline-block size-3 rounded bg-warning/20" />
							Gợi ý cải thiện
						</span>
					</div>
				</div>
			</StickerLayer>
			<div className="grid gap-4 md:grid-cols-3">
				<SummaryCard
					icon={<CheckCircle2 className="size-5 text-success" />}
					title="Điểm mạnh"
					items={feedback.strengths.map((s) => ({ text: s }))}
					accentClass="border-success/20 bg-success/5"
				/>
				<SummaryCard
					icon={<AlertTriangle className="size-5 text-warning" />}
					title="Cần cải thiện"
					items={feedback.improvements.map((i) => ({
						text: i.message,
						detail: i.explanation,
						annotationIdx: i.annotationIdx,
					}))}
					accentClass="border-warning/20 bg-warning/5"
					onItemClick={scrollToAnnotation}
				/>
				<SummaryCard
					icon={<Lightbulb className="size-5 text-primary" />}
					title="Gợi ý viết lại"
					items={feedback.rewrites.map((r) => ({
						text: `"${r.original}" → "${r.improved}"`,
						detail: r.reason,
					}))}
					accentClass="border-primary/20 bg-primary/5"
				/>
			</div>
		</div>
	)
}
