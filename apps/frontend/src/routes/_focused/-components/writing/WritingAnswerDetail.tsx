import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
	Level1AnnotatedText,
	MOCK_LEVEL1_RESULTS,
	WritingLevel1Detail,
} from "./WritingLevel1Detail"
import { MOCK_LEVEL2_RESULTS, WritingLevel2Detail } from "./WritingLevel2Detail"
import type { InlineError, InlineHighlight } from "./writing-grading-shared"

// ═══════════════════════════════════════════════════
// Helper functions
// ═══════════════════════════════════════════════════

function getSubmittedText(examId: string, level: 1 | 2 | 3): string {
	if (level === 1) return MOCK_LEVEL1_RESULTS[examId]?.submittedText ?? ""
	return MOCK_LEVEL2_RESULTS[examId]?.submittedText ?? ""
}

function getErrors(examId: string, level: 1 | 2 | 3): InlineError[] {
	if (level === 2 || level === 3) return MOCK_LEVEL2_RESULTS[examId]?.errors ?? []
	return []
}

function getHighlights(examId: string, level: 1 | 2 | 3): InlineHighlight[] {
	if (level === 2 || level === 3) return MOCK_LEVEL2_RESULTS[examId]?.highlights ?? []
	return []
}

const errorStyleMap: Record<string, string> = {
	grammar:
		"rounded bg-red-100 px-0.5 text-red-700 underline decoration-red-400 decoration-wavy dark:bg-red-900/30 dark:text-red-400",
	vocabulary:
		"rounded bg-amber-100 px-0.5 text-amber-700 underline decoration-amber-400 decoration-wavy dark:bg-amber-900/30 dark:text-amber-400",
	spelling:
		"rounded bg-blue-100 px-0.5 text-blue-700 underline decoration-blue-400 decoration-wavy dark:bg-blue-900/30 dark:text-blue-400",
}

const goodStyle =
	"rounded bg-emerald-100/70 px-0.5 font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"

interface Annotation {
	original: string
	style: string
	tag: string
}

function buildAnnotations(errors: InlineError[], highlights: InlineHighlight[]): Annotation[] {
	return [
		...errors.map((e, i) => ({
			original: e.original,
			style: errorStyleMap[e.type] ?? errorStyleMap.grammar,
			tag: `E${i}`,
		})),
		...highlights.map((h, i) => ({
			original: h.phrase,
			style: goodStyle,
			tag: `H${i}`,
		})),
	]
}

function AnnotatedText({
	text,
	errors,
	highlights,
}: {
	text: string
	errors: InlineError[]
	highlights: InlineHighlight[]
}) {
	if (!text) return <p className="text-sm text-muted-foreground">Chưa có bài viết.</p>

	const annotations = buildAnnotations(errors, highlights)

	let annotated = text
	for (const a of annotations) {
		annotated = annotated.replace(a.original, `⟨${a.tag}⟩${a.original}⟨/${a.tag}⟩`)
	}

	const tagNames = annotations.map((a) => a.tag)
	const splitRe = new RegExp(`(${tagNames.map((t) => `⟨${t}⟩.*?⟨/${t}⟩`).join("|")})`)

	const parts = tagNames.length > 0 ? annotated.split(splitRe) : [annotated]

	return (
		<div className="whitespace-pre-wrap text-sm leading-relaxed">
			{parts.map((part, i) => {
				for (const a of annotations) {
					const open = `⟨${a.tag}⟩`
					const close = `⟨/${a.tag}⟩`
					if (part.startsWith(open) && part.endsWith(close)) {
						const content = part.slice(open.length, -close.length)
						return (
							<span key={i} className={a.style}>
								{content}
							</span>
						)
					}
				}
				return <span key={i}>{part}</span>
			})}
		</div>
	)
}

// ═══════════════════════════════════════════════════
// Annotated text panel (left side)
// ═══════════════════════════════════════════════════

export function WritingAnnotatedPanel({ examId, level }: { examId: string; level: 1 | 2 | 3 }) {
	const text = getSubmittedText(examId, level)
	const errors = getErrors(examId, level)
	const highlights = getHighlights(examId, level)

	const levelLabels: Record<number, { label: string; color: string }> = {
		1: {
			label: "Cấp độ 1 — Trợ nhiệt tình",
			color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
		},
		2: {
			label: "Cấp độ 2 — Gợi ý khung",
			color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
		},
		3: {
			label: "Cấp độ 3 — Thực chiến",
			color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
		},
	}

	const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

	return (
		<div className="p-6">
			<div className="mb-4 flex items-center justify-between">
				<h3 className="text-lg font-bold">Bài viết đã nộp</h3>
				<div className="flex items-center gap-2">
					<Badge variant="secondary" className={levelLabels[level].color}>
						{levelLabels[level].label}
					</Badge>
					<span className="text-xs text-muted-foreground">{wordCount} từ</span>
				</div>
			</div>
			{level === 1 ? (
				<Level1AnnotatedText text={text} />
			) : (
				<AnnotatedText text={text} errors={errors} highlights={highlights} />
			)}
		</div>
	)
}

// ═══════════════════════════════════════════════════
// Main export — right panel
// ═══════════════════════════════════════════════════

interface WritingAnswerDetailProps {
	examId: string
	level: 1 | 2 | 3
}

export function WritingAnswerDetail({ examId, level }: WritingAnswerDetailProps) {
	const [activeTab, setActiveTab] = useState<"result" | "prompt">("result")

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* Tab header */}
			<div className="flex shrink-0 border-b">
				<button
					type="button"
					onClick={() => setActiveTab("result")}
					className={cn(
						"flex-1 py-2.5 text-center text-sm font-medium transition-colors",
						activeTab === "result"
							? "border-b-2 border-primary text-primary"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					Kết quả chấm
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("prompt")}
					className={cn(
						"flex-1 py-2.5 text-center text-sm font-medium transition-colors",
						activeTab === "prompt"
							? "border-b-2 border-primary text-primary"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					Đề bài
				</button>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				{activeTab === "result" ? (
					<>
						{level === 1 && <WritingLevel1Detail examId={examId} />}
						{(level === 2 || level === 3) && <WritingLevel2Detail examId={examId} />}
					</>
				) : (
					<div className="p-5 text-sm text-muted-foreground">
						<p className="italic">Đề bài sẽ được hiển thị ở đây khi có backend.</p>
					</div>
				)}
			</div>
		</div>
	)
}
