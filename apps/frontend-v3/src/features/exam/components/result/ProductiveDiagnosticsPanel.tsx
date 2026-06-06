import type { ReactNode } from "react"
import type { ProductiveItem, ProductiveKind } from "#/features/exam/components/result/productive-model"
import type { AssessmentAnnotation, AssessmentDiagnostics } from "#/features/grading/types"
import { cn, round } from "#/lib/utils"

export function ProductiveDiagnosticsPanel({
	item,
	kind,
}: {
	readonly item: ProductiveItem
	readonly kind: ProductiveKind
}) {
	if (!item.diagnostics) return null
	if (kind === "writing") return <WritingDiagnostics diagnostics={item.diagnostics} />
	return <SpeakingDiagnostics diagnostics={item.diagnostics} />
}

export function AnnotatedText({
	text,
	annotations,
}: {
	readonly text: string
	readonly annotations: readonly AssessmentAnnotation[]
}) {
	const ranges = annotations
		.filter(
			(annotation) =>
				annotation.start >= 0 && annotation.end > annotation.start && annotation.start < text.length,
		)
		.sort((a, b) => a.start - b.start)
	const nodes: ReactNode[] = []
	let cursor = 0

	for (const annotation of ranges) {
		const start = Math.max(cursor, annotation.start)
		const end = Math.min(text.length, annotation.end)
		if (start > cursor) nodes.push(text.slice(cursor, start))
		if (end > start) {
			nodes.push(
				<span
					key={`${annotation.start}-${annotation.end}-${annotation.message}`}
					title={annotation.message}
					className="rounded-sm border-b-2 border-destructive/60 bg-destructive/5"
				>
					{text.slice(start, end)}
				</span>,
			)
		}
		cursor = Math.max(cursor, end)
	}

	if (cursor < text.length) nodes.push(text.slice(cursor))

	return <>{nodes.length > 0 ? nodes : text}</>
}

function WritingDiagnostics({ diagnostics }: { readonly diagnostics: AssessmentDiagnostics }) {
	const annotations = diagnostics.annotations ?? []
	if (!hasWritingDiagnostics(diagnostics)) return null

	return (
		<Section title="Cần sửa / khoảng trống">
			<div className="space-y-4">
				<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
					<MetricPill
						label="Lỗi chính tả"
						value={numberLabel(diagnostics.summary.spelling_error_count)}
						tone={countTone(diagnostics.summary.spelling_error_count)}
					/>
					<MetricPill
						label="Lỗi ngữ pháp"
						value={numberLabel(diagnostics.summary.grammar_error_count)}
						tone={countTone(diagnostics.summary.grammar_error_count)}
					/>
					<MetricPill
						label="Lỗi dấu câu"
						value={numberLabel(diagnostics.summary.punctuation_error_count)}
						tone={countTone(diagnostics.summary.punctuation_error_count)}
					/>
					<MetricPill
						label="Từ nối"
						value={numberLabel(
							diagnostics.summary.linking_word_count ?? diagnostics.cohesion?.linking_word_count,
						)}
						tone="default"
					/>
					<MetricPill label="Số câu" value={numberLabel(diagnostics.summary.sentence_count)} tone="default" />
					<MetricPill
						label="Đoạn văn"
						value={numberLabel(diagnostics.summary.paragraph_count)}
						tone="default"
					/>
					<MetricPill
						label="Độ đa dạng từ"
						value={percentLabel(diagnostics.summary.unique_ratio)}
						tone="default"
					/>
					<MetricPill
						label="Từ vựng nâng cao"
						value={percentLabel(diagnostics.vocabulary_profile?.cefr_advanced_ratio)}
						tone="default"
					/>
				</div>

				<RequirementList diagnostics={diagnostics} />
				<AnnotationList annotations={annotations} />
			</div>
		</Section>
	)
}

function SpeakingDiagnostics({ diagnostics }: { readonly diagnostics: AssessmentDiagnostics }) {
	if (!hasSpeakingDiagnostics(diagnostics)) return null

	return (
		<Section title="Chẩn đoán bài nói">
			<div className="space-y-4">
				<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
					<MetricPill
						label="Tốc độ nói"
						value={numberLabel(
							diagnostics.speech?.speaking_rate ?? diagnostics.fluency?.speaking_rate,
							" từ/phút",
						)}
						tone="default"
					/>
					<MetricPill
						label="Số lần ngắt nghỉ"
						value={numberLabel(diagnostics.fluency?.pause_count ?? diagnostics.speech?.pause_count)}
						tone={countTone(diagnostics.fluency?.pause_count ?? diagnostics.speech?.pause_count)}
					/>
					<MetricPill
						label="Số từ"
						value={numberLabel(diagnostics.speech?.word_count ?? diagnostics.fluency?.word_count)}
						tone="default"
					/>
					<MetricPill
						label="Phát âm"
						value={numberLabel(diagnostics.pronunciation?.overall, "/100")}
						tone="default"
					/>
					<MetricPill
						label="Độ tin cậy transcript"
						value={percentLabel(diagnostics.speech?.confidence)}
						tone="default"
					/>
					<MetricPill
						label="Nội dung"
						value={percentLabel(diagnostics.content?.content_factor)}
						tone="default"
					/>
				</div>
				{diagnostics.profanity?.found && (
					<div className="rounded-2xl border-2 border-warning/35 bg-warning-tint p-3 text-sm font-bold text-foreground">
						Có {diagnostics.profanity.count} từ/ngữ không phù hợp. Nên tránh trong bài thi nói học thuật.
					</div>
				)}
			</div>
		</Section>
	)
}

function RequirementList({ diagnostics }: { readonly diagnostics: AssessmentDiagnostics }) {
	const word = diagnostics.word_requirement
	const coverage = diagnostics.task_coverage
	const format = diagnostics.format
	const hasFormat = format?.letter_format_expected === true
	const hasRequirements = Boolean(word || coverage || hasFormat)
	if (!hasRequirements) return null

	return (
		<div className="rounded-2xl bg-background/50 p-3">
			<p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-muted">Checklist yêu cầu</p>
			<div className="grid gap-2 sm:grid-cols-2">
				{word && (
					<RequirementItem
						label="Đủ số từ tối thiểu"
						checked={word.is_met}
						detail={`${word.actual ?? "?"}/${word.minimum} từ${word.missing ? ` · thiếu ${word.missing}` : ""}`}
					/>
				)}
				{coverage && (
					<RequirementItem
						label="Bao phủ yêu cầu đề bài"
						checked={
							coverage.covered_points === null ? null : coverage.covered_points >= coverage.required_points
						}
						detail={`${coverage.covered_points ?? "?"}/${coverage.required_points} ý`}
					/>
				)}
				{hasFormat && <RequirementItem label="Có lời chào phù hợp" checked={format.has_salutation} />}
				{hasFormat && <RequirementItem label="Có lời kết phù hợp" checked={format.has_closing} />}
			</div>
			{coverage?.requirements.length ? (
				<div className="mt-3 space-y-2">
					<p className="text-[10px] font-bold uppercase tracking-wide text-muted">Chi tiết ý trong đề</p>
					{coverage.requirements.map((requirement) => (
						<RequirementItem key={requirement.text} label={requirement.text} checked={requirement.met} />
					))}
				</div>
			) : null}
		</div>
	)
}

function AnnotationList({ annotations }: { readonly annotations: readonly AssessmentAnnotation[] }) {
	if (annotations.length === 0) return null
	const visible = annotations.slice(0, 8)

	return (
		<div className="rounded-2xl bg-background/50 p-3">
			<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
				<p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted">Lỗi cụ thể cần sửa</p>
				<span className="rounded-full bg-warning-tint px-2.5 py-1 text-[10px] font-extrabold text-foreground">
					{annotations.length} lỗi
				</span>
			</div>
			<div className="space-y-2">
				{visible.map((annotation) => (
					<div
						key={`${annotation.start}-${annotation.end}-${annotation.message}`}
						className="rounded-2xl border-2 border-border bg-surface p-3"
					>
						<div className="flex flex-wrap items-center gap-2">
							<span
								className={cn(
									"rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase",
									annotationTone(annotation.type),
								)}
							>
								{annotationTypeLabel(annotation.type)}
							</span>
							<span className="text-xs font-bold text-muted">{annotation.category}</span>
						</div>
						<p className="mt-2 text-sm font-black text-foreground">“{annotation.text}”</p>
						<p className="mt-1 text-sm text-muted">{annotation.message}</p>
						{annotation.suggestions.length > 0 && (
							<p className="mt-2 text-xs font-bold text-primary-dark">
								Gợi ý: {annotation.suggestions.slice(0, 3).join(", ")}
							</p>
						)}
					</div>
				))}
			</div>
			{annotations.length > visible.length && (
				<p className="mt-2 text-xs text-muted">Còn {annotations.length - visible.length} lỗi khác.</p>
			)}
		</div>
	)
}

function MetricPill({
	label,
	value,
	tone,
}: {
	readonly label: string
	readonly value: string | null
	readonly tone: "default" | "success" | "warning"
}) {
	if (value === null) return null

	return (
		<div className="rounded-xl bg-background px-3 py-2">
			<p className="text-[10px] font-bold uppercase text-subtle">{label}</p>
			<p className={cn("text-sm font-extrabold tabular-nums", metricToneClass(tone))}>{value}</p>
		</div>
	)
}

function RequirementItem({
	label,
	checked,
	detail,
}: {
	readonly label: string
	readonly checked: boolean | null
	readonly detail?: string
}) {
	const marker = checked === null ? "?" : checked ? "✓" : "!"
	const markerClass = checked === null ? "text-muted" : checked ? "text-primary-dark" : "text-warning"

	return (
		<div className="flex items-start gap-2 rounded-xl bg-surface px-3 py-2 text-sm">
			<span className={cn("font-extrabold", markerClass)}>{marker}</span>
			<span>
				<span className="font-bold text-foreground">{label}</span>
				{detail && <span className="block text-xs text-muted">{detail}</span>}
			</span>
		</div>
	)
}

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
	return (
		<section className="rounded-(--radius-card) border-2 border-border bg-surface p-4">
			<p className="text-xs font-black uppercase tracking-[0.14em] text-muted">{title}</p>
			<div className="mt-3">{children}</div>
		</section>
	)
}

function hasWritingDiagnostics(diagnostics: AssessmentDiagnostics): boolean {
	const summary = diagnostics.summary
	return (
		[
			summary.spelling_error_count,
			summary.grammar_error_count,
			summary.punctuation_error_count,
			summary.linking_word_count,
			summary.sentence_count,
			summary.paragraph_count,
			summary.unique_ratio,
			diagnostics.cohesion?.linking_word_count,
			diagnostics.vocabulary_profile?.cefr_advanced_ratio,
		].some(isNumber) ||
		Boolean(
			diagnostics.annotations.length > 0 ||
				diagnostics.word_requirement ||
				diagnostics.task_coverage ||
				diagnostics.format?.letter_format_expected,
		)
	)
}

function hasSpeakingDiagnostics(diagnostics: AssessmentDiagnostics): boolean {
	return (
		[
			diagnostics.speech?.speaking_rate,
			diagnostics.fluency?.speaking_rate,
			diagnostics.fluency?.pause_count,
			diagnostics.speech?.pause_count,
			diagnostics.speech?.word_count,
			diagnostics.fluency?.word_count,
			diagnostics.pronunciation?.overall,
			diagnostics.speech?.confidence,
			diagnostics.content?.content_factor,
		].some(isNumber) || Boolean(diagnostics.profanity?.found)
	)
}

function isNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value)
}

function numberLabel(value: number | null | undefined, suffix = ""): string | null {
	if (!isNumber(value)) return null
	return `${round(value)}${suffix}`
}

function percentLabel(value: number | null | undefined): string | null {
	if (!isNumber(value)) return null
	return `${round(value * 100)}%`
}

function countTone(value: number | null | undefined): "default" | "success" | "warning" {
	if (!isNumber(value)) return "default"
	return value > 0 ? "warning" : "success"
}

function metricToneClass(tone: "default" | "success" | "warning"): string {
	if (tone === "success") return "text-primary-dark"
	if (tone === "warning") return "text-warning"
	return "text-foreground"
}

function annotationTypeLabel(type: AssessmentAnnotation["type"]): string {
	if (type === "spelling") return "Chính tả"
	if (type === "grammar") return "Ngữ pháp"
	if (type === "punctuation") return "Dấu câu"
	if (type === "style") return "Diễn đạt"
	return "Khác"
}

function annotationTone(type: AssessmentAnnotation["type"]): string {
	if (type === "spelling" || type === "grammar") return "bg-destructive-tint text-destructive"
	if (type === "punctuation") return "bg-warning-tint text-foreground"
	return "bg-info-tint text-info"
}
