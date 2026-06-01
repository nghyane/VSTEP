// AnnotatedFeedbackParts — sub-components for AnnotatedFeedbackView.

import { AlertTriangle, ArrowRight, Check, MessageSquare } from "lucide-react"
import type {
	CohesionHint,
	ParagraphFeedback,
	WritingAnnotation,
} from "#/features/practice/lib/mock-ai-grading"
import { cn } from "#/shared/lib/utils"

export function ParagraphStatusIcon({ status }: { status: ParagraphFeedback["status"] }) {
	if (status === "good") return <Check className="size-3.5 text-success" />
	return <AlertTriangle className="size-3.5 text-warning" />
}

export function ParagraphStickerContent({
	feedback,
	index,
}: {
	feedback: ParagraphFeedback
	index: number
}) {
	return (
		<div className="space-y-1.5 text-xs">
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

export function CohesionHintCard({ hint }: { hint: CohesionHint }) {
	return (
		<div className="mx-auto my-2 flex max-w-md items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
			<MessageSquare className="size-3.5 shrink-0" />
			<span>{hint.suggestion}</span>
		</div>
	)
}

export function AnnotatedParagraph({
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
	const paras = fullText.split(/\n\n+/).filter((p) => p.trim().length > 0)
	let searchFrom = 0
	for (let i = 0; i < paraIndex; i++) {
		const idx = fullText.indexOf(paras[i]!, searchFrom)
		if (idx >= 0) searchFrom = idx + paras[i]!.length
	}
	const paraStart = fullText.indexOf(para, searchFrom)
	const paraEnd = paraStart + para.length

	const paraAnnotations = annotations
		.map((a, i) => ({ ...a, originalIdx: i }))
		.filter((a) => a.start >= paraStart && a.end <= paraEnd)
		.sort((a, b) => a.start - b.start)

	const segments: React.ReactNode[] = []
	let cursor = 0
	for (const ann of paraAnnotations) {
		const localStart = ann.start - paraStart
		const localEnd = ann.end - paraStart
		if (localStart > cursor)
			segments.push(<span key={`t-${cursor}`}>{para.slice(cursor, localStart)}</span>)
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
	if (cursor < para.length) segments.push(<span key="t-end">{para.slice(cursor)}</span>)
	return <p className="whitespace-pre-wrap text-sm leading-loose text-foreground/90">{segments}</p>
}

export function AnnotationDetail({
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

type SummaryItem = { text: string; detail?: string; annotationIdx?: number }
export function SummaryCard({
	icon,
	title,
	items,
	accentClass,
	onItemClick,
}: {
	icon: React.ReactNode
	title: string
	items: readonly SummaryItem[]
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
										onClick={() => onItemClick(item.annotationIdx!)}
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
