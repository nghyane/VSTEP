// AnnotatedFeedbackView — bài viết có highlight lỗi + margin stickers + connector lines.
// Layout 2-cột: paragraph stickers (trái) | bài viết annotated (phải).

import {
	AlertTriangle,
	ArrowRight,
	Check,
	CheckCircle2,
	Lightbulb,
	MessageSquare,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import type {
	AnnotatedWritingFeedback,
	CohesionHint,
	ParagraphFeedback,
	WritingAnnotation,
} from "#/lib/practice/mock-ai-grading"
import { cn } from "#/shared/lib/utils"
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
			{/* Annotated writing with margin stickers */}
			<StickerLayer paths={paths} containerRef={containerRef}>
				<div className="rounded-2xl border bg-card p-5 shadow-sm">
					<h3 className="mb-4 text-lg font-semibold">Bài viết đã chấm</h3>

					<div className="space-y-4">
						{paragraphs.map((para, pIdx) => {
							const pFeedback = feedback.paragraphs.find((p) => p.index === pIdx)
							const cohesion = feedback.cohesionHints.find((c) => c.afterParagraphIndex === pIdx)
							const stickerId = `result-para-${pIdx}`

							return (
								<div key={pIdx}>
									<div className="flex items-start gap-3">
										{/* Paragraph sticker (left margin) */}
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

										{/* Paragraph text with inline annotations */}
										<StickerAnchor
											id={stickerId}
											registerRef={registerAnchor}
											className="min-w-0 flex-1"
										>
											{/* Mobile: inline paragraph status */}
											{pFeedback && (
												<div className="mb-1.5 flex items-center gap-1.5 lg:hidden">
													<ParagraphStatusIcon status={pFeedback.status} />
													<span className="text-[11px] font-semibold text-muted-foreground">
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

									{/* Cohesion hint between paragraphs */}
									{cohesion && <CohesionHintCard hint={cohesion} />}
								</div>
							)
						})}
					</div>

					{/* Active annotation detail */}
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

			{/* 3-part summary with connected links */}
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

// ─── Paragraph sticker content ─────────────────────────────────────

function ParagraphStatusIcon({ status }: { status: ParagraphFeedback["status"] }) {
	if (status === "good") return <Check className="size-3.5 text-success" />
	return <AlertTriangle className="size-3.5 text-warning" />
}

function ParagraphStickerContent({
	feedback,
	index,
}: {
	feedback: ParagraphFeedback
	index: number
}) {
	return (
		<div className="space-y-1.5 text-[11px]">
			<div className="flex items-center gap-1.5">
				<ParagraphStatusIcon status={feedback.status} />
				<span className="font-semibold">Đoạn {index + 1}</span>
			</div>
			<p className="text-muted-foreground">
				{feedback.wordCount} từ (gợi ý {feedback.suggestedWordRange.min}-
				{feedback.suggestedWordRange.max})
			</p>
			{feedback.checklist.some((c) => !c.covered) && (
				<div className="space-y-0.5">
					{feedback.checklist.map((c) => (
						<div key={c.point} className="flex items-start gap-1">
							{c.covered ? (
								<Check className="mt-0.5 size-3 shrink-0 text-success" />
							) : (
								<AlertTriangle className="mt-0.5 size-3 shrink-0 text-warning" />
							)}
							<span className={cn(!c.covered && "text-warning")}>{c.point}</span>
						</div>
					))}
				</div>
			)}
			{feedback.notes.map((n) => (
				<p key={n} className="text-warning">
					{n}
				</p>
			))}
		</div>
	)
}

// ─── Cohesion hint ─────────────────────────────────────────────────

function CohesionHintCard({ hint }: { hint: CohesionHint }) {
	return (
		<div className="mx-auto my-2 flex max-w-md items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
			<MessageSquare className="size-3.5 shrink-0" />
			<span>{hint.suggestion}</span>
		</div>
	)
}

// ─── Annotated paragraph ───────────────────────────────────────────

function AnnotatedParagraph({
	fullText,
	para,
	paraIndex,
	annotations,
	activeIdx,
	onSelect,
}: {
	fullText: string
	para: string
	paraIndex: number
	annotations: readonly WritingAnnotation[]
	activeIdx: number | null
	onSelect: (idx: number | null) => void
}) {
	// Find paragraph offset in full text
	const paras = fullText.split(/\n\n+/).filter((p) => p.trim().length > 0)
	let searchFrom = 0
	for (let i = 0; i < paraIndex; i++) {
		const idx = fullText.indexOf(paras[i] ?? "", searchFrom)
		if (idx >= 0) searchFrom = idx + (paras[i]?.length ?? 0)
	}
	const paraStart = fullText.indexOf(para, searchFrom)
	const paraEnd = paraStart + para.length

	// Filter annotations that fall within this paragraph
	const paraAnnotations = annotations
		.map((a, i) => ({ ...a, originalIdx: i }))
		.filter((a) => a.start >= paraStart && a.end <= paraEnd)
		.sort((a, b) => a.start - b.start)

	const segments: React.ReactNode[] = []
	let cursor = 0

	for (const ann of paraAnnotations) {
		const localStart = ann.start - paraStart
		const localEnd = ann.end - paraStart
		if (localStart > cursor) {
			segments.push(<span key={`t-${cursor}`}>{para.slice(cursor, localStart)}</span>)
		}
		const isActive = activeIdx === ann.originalIdx
		segments.push(
			<button
				type="button"
				key={`a-${ann.originalIdx}`}
				data-annotation-idx={ann.originalIdx}
				onClick={() => onSelect(isActive ? null : ann.originalIdx)}
				className={cn(
					"rounded px-0.5 transition-colors",
					ann.severity === "error"
						? "bg-destructive/15 text-destructive underline decoration-destructive decoration-wavy underline-offset-2 hover:bg-destructive/25"
						: "bg-warning/15 text-warning-foreground underline decoration-warning decoration-wavy underline-offset-2 hover:bg-warning/25",
					isActive && "ring-2 ring-primary/40",
				)}
			>
				{para.slice(localStart, localEnd)}
			</button>,
		)
		cursor = localEnd
	}
	if (cursor < para.length) {
		segments.push(<span key="t-end">{para.slice(cursor)}</span>)
	}

	return <p className="whitespace-pre-wrap text-sm leading-loose text-foreground/90">{segments}</p>
}

// ─── Annotation detail sticker ─────────────────────────────────────

function AnnotationDetail({
	annotation,
	onClose,
}: {
	annotation: WritingAnnotation
	onClose: () => void
}) {
	const isError = annotation.severity === "error"
	return (
		<div
			className={cn(
				"mt-4 rounded-xl border-l-4 p-4",
				isError ? "border-l-destructive bg-destructive/5" : "border-l-warning bg-warning/5",
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex-1">
					<p
						className={cn(
							"text-xs font-semibold uppercase tracking-wider",
							isError ? "text-destructive" : "text-warning",
						)}
					>
						{annotation.category}
					</p>
					<p className="mt-1 text-sm text-foreground">{annotation.message}</p>
					{annotation.suggestion && (
						<p className="mt-2 text-sm">
							<span className="text-muted-foreground">Gợi ý: </span>
							<code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs font-semibold text-primary">
								{annotation.suggestion}
							</code>
						</p>
					)}
				</div>
				<button
					type="button"
					onClick={onClose}
					className="text-muted-foreground hover:text-foreground"
					aria-label="Đóng"
				>
					×
				</button>
			</div>
		</div>
	)
}

// ─── Summary card ──────────────────────────────────────────────────

function SummaryCard({
	icon,
	title,
	items,
	accentClass,
	onItemClick,
}: {
	icon: React.ReactNode
	title: string
	items: readonly { text: string; detail?: string; annotationIdx?: number }[]
	accentClass: string
	onItemClick?: (annotationIdx: number) => void
}) {
	return (
		<div className={cn("rounded-2xl border p-4", accentClass)}>
			<div className="mb-3 flex items-center gap-2">
				{icon}
				<h4 className="font-semibold">{title}</h4>
			</div>
			{items.length === 0 ? (
				<p className="text-xs text-muted-foreground">Chưa có mục nào.</p>
			) : (
				<ul className="space-y-2.5">
					{items.map((item, i) => (
						<li key={i} className="text-sm">
							<div className="flex items-start gap-1.5">
								<p className="flex-1 font-medium text-foreground">{item.text}</p>
								{item.annotationIdx !== undefined && onItemClick && (
									<button
										type="button"
										onClick={() =>
											// biome-ignore lint/style/noNonNullAssertion: guarded by !== undefined check above
											onItemClick(item.annotationIdx!)
										}
										className="mt-0.5 shrink-0 text-primary hover:text-primary/80"
										aria-label="Xem vị trí lỗi"
									>
										<ArrowRight className="size-3.5" />
									</button>
								)}
							</div>
							{item.detail && <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>}
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
