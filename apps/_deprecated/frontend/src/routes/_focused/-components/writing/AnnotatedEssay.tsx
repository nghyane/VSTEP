import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { InlineError } from "./writing-grading-shared"

// ═══════════════════════════════════════════════════
// AnnotatedEssay — Highlights errors in submitted text
// by parsing correction patterns from AI feedback.
//
// Patterns detected:
//   "original text" → "corrected text"
//   "original text" → nên viết: "corrected text"
// ═══════════════════════════════════════════════════

interface ErrorAnnotation {
	original: string
	correction: string
	explanation?: string
}

/**
 * Extract error→correction pairs from feedback text.
 * Matches patterns like:
 *   "I want suggest" → nên viết: "I want to suggest"
 *   "It have" → "It has"
 */
function extractErrors(feedback: string): ErrorAnnotation[] {
	const errors: ErrorAnnotation[] = []
	const seen = new Set<string>()

	function addError(original: string, correction: string) {
		const o = original.trim()
		const c = correction.trim()
		const key = o.toLowerCase()
		if (o.length >= 2 && c.length >= 2 && o !== c && !seen.has(key)) {
			seen.add(key)
			errors.push({ original: o, correction: c })
		}
	}

	// Split feedback into lines for line-by-line parsing
	const lines = feedback.split("\n")

	for (const line of lines) {
		// Pattern 1: "original" → [any Vietnamese text] "correction"
		// Matches: "error" → nên viết: "fix"
		//          "error" → tự nhiên hơn là: "fix"
		//          "error" → đúng hơn là "fix"
		//          "error" → "fix"
		const arrowQuoteRegex =
			/["\u201C\u201D]([^"\u201C\u201D]{2,}?)["\u201C\u201D][\s]*\u2192[\s]*[^"\u201C\u201D]*?["\u201C\u201D]([^"\u201C\u201D]{2,}?)["\u201C\u201D]/g
		let m = arrowQuoteRegex.exec(line)
		while (m) {
			addError(m[1], m[2])
			m = arrowQuoteRegex.exec(line)
		}

		// Pattern 2: "original" → correction without quotes (e.g. "Best regard" → đúng hơn là "Best regards".)
		// Already covered by Pattern 1 if correction is quoted

		// Pattern 3: Multiline gợi ý viết lại:
		// "long original"
		// → "long correction"
		// Handle by checking if line starts with → and previous context has quote
		if (/^\s*\u2192\s*["\u201C\u201D]/.test(line)) {
			const prevLineIdx = lines.indexOf(line) - 1
			if (prevLineIdx >= 0) {
				const prevLine = lines[prevLineIdx]
				const prevQuoteMatch = /["\u201C\u201D]([^"\u201C\u201D]{2,}?)["\u201C\u201D]\s*$/.exec(
					prevLine,
				)
				const currQuoteMatch =
					/\u2192\s*["\u201C\u201D]([^"\u201C\u201D]{2,}?)["\u201C\u201D]/.exec(line)
				if (prevQuoteMatch && currQuoteMatch) {
					addError(prevQuoteMatch[1], currQuoteMatch[1])
				}
			}
		}
	}

	return errors
}

/**
 * Split essay text into segments: normal text and annotated error spans.
 * Uses case-insensitive matching and handles overlapping by taking longest match first.
 */
interface TextSegment {
	type: "text" | "error"
	text: string
	annotation?: ErrorAnnotation
}

function buildSegments(essayText: string, errors: ErrorAnnotation[]): TextSegment[] {
	if (errors.length === 0) {
		return [{ type: "text", text: essayText }]
	}

	// Build regex matching all error originals, longest first to avoid partial matches
	const sortedErrors = [...errors].sort((a, b) => b.original.length - a.original.length)

	// Find all match positions
	interface MatchPos {
		start: number
		end: number
		error: ErrorAnnotation
	}
	const matches: MatchPos[] = []

	for (const error of sortedErrors) {
		const escaped = error.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
		const re = new RegExp(escaped, "gi")
		let m = re.exec(essayText)
		while (m) {
			const start = m.index
			const end = start + m[0].length
			// Check no overlap with existing matches
			const overlaps = matches.some((prev) => !(end <= prev.start || start >= prev.end))
			if (!overlaps) {
				matches.push({ start, end, error })
			}
			m = re.exec(essayText)
		}
	}

	// Sort by position
	matches.sort((a, b) => a.start - b.start)

	// Build segments
	const segments: TextSegment[] = []
	let cursor = 0

	for (const m of matches) {
		if (m.start > cursor) {
			segments.push({ type: "text", text: essayText.slice(cursor, m.start) })
		}
		segments.push({
			type: "error",
			text: essayText.slice(m.start, m.end),
			annotation: m.error,
		})
		cursor = m.end
	}

	if (cursor < essayText.length) {
		segments.push({ type: "text", text: essayText.slice(cursor) })
	}

	return segments
}

// ═══════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════

function ErrorHighlight({ segment }: { segment: TextSegment & { type: "error" } }) {
	const [open, setOpen] = useState(false)
	const annotation = segment.annotation as ErrorAnnotation

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className={cn(
						"relative cursor-pointer rounded px-0.5",
						"bg-red-100 text-red-800 underline decoration-red-400 decoration-wavy underline-offset-4",
						"transition-colors hover:bg-red-200",
						"dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60",
					)}
				>
					{segment.text}
				</button>
			</PopoverTrigger>
			<PopoverContent
				side="bottom"
				align="start"
				className="w-auto max-w-xs p-3"
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<div className="space-y-2">
					<Badge
						variant="secondary"
						className="bg-red-100 text-[10px] text-red-700 dark:bg-red-900/30 dark:text-red-400"
					>
						Cần sửa
					</Badge>
					<div className="flex items-start gap-2 text-sm">
						<span className="line-through decoration-red-400 text-red-600 dark:text-red-400">
							{annotation.original}
						</span>
						<HugeiconsIcon
							icon={ArrowRight01Icon}
							className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
						/>
						<span className="font-medium text-green-700 dark:text-green-400">
							{annotation.correction}
						</span>
					</div>
					{annotation.explanation ? (
						<p className="text-xs text-muted-foreground">{annotation.explanation}</p>
					) : null}
				</div>
			</PopoverContent>
		</Popover>
	)
}

// ═══════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════

interface AnnotatedEssayProps {
	essayText: string
	feedback: string
	corrections?: InlineError[]
	className?: string
}

export function AnnotatedEssay({
	essayText,
	feedback,
	corrections,
	className,
}: AnnotatedEssayProps) {
	const errors = useMemo(() => {
		if (corrections && corrections.length > 0) {
			return corrections.map((item) => ({
				original: item.original,
				correction: item.correction,
				explanation: item.explanation,
			}))
		}

		return extractErrors(feedback)
	}, [feedback, corrections])
	const segments = useMemo(() => buildSegments(essayText, errors), [essayText, errors])

	return (
		<div className={cn("space-y-3", className)}>
			{/* Error count summary */}
			{errors.length > 0 && (
				<div className="flex items-center gap-2">
					<Badge
						variant="secondary"
						className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
					>
						{errors.length} lỗi phát hiện
					</Badge>
					<span className="text-xs text-muted-foreground">
						Nhấn vào từ được đánh dấu để xem gợi ý sửa
					</span>
				</div>
			)}

			{/* Annotated text */}
			<div className="whitespace-pre-wrap rounded-xl bg-muted/10 p-4 text-sm leading-[1.9]">
				{segments.map((seg, i) =>
					seg.type === "error" ? (
						<ErrorHighlight key={`err-${i}`} segment={seg as TextSegment & { type: "error" }} />
					) : (
						<span key={`txt-${i}`}>{seg.text}</span>
					),
				)}
			</div>
		</div>
	)
}

export { extractErrors }
export type { ErrorAnnotation }
