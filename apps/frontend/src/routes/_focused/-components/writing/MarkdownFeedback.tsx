import {
	ArrowRight01Icon,
	CheckmarkCircle02Icon,
	Edit02Icon,
	Idea01Icon,
	SparklesIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { ReactNode } from "react"
import { Fragment, useMemo } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

// ═══════════════════════════════════════════════════
// Markdown feedback renderer — renders AI grading
// feedback with styled corrections, section colors,
// quoted phrase badges, and rich formatting.
// ═══════════════════════════════════════════════════

interface MarkdownFeedbackProps {
	feedback: string
	className?: string
}

// ── Pre-processor ──────────────────────────────────

function preprocessFeedback(raw: string): string {
	let text = raw

	// 1. Correction arrows: "error" → [any Vietnamese text] "fix"
	//    Broadly matches all correction patterns:
	//    "error" → nên viết: "fix"
	//    "error" → tự nhiên hơn là: "fix"
	//    "error" → đúng hơn là "fix"
	//    "error" → "fix"
	text = text.replace(
		/["\u201C\u201D]([^"\u201C\u201D]+?)["\u201C\u201D][\s]*\u2192[\s]*[^"\u201C\u201D]*?["\u201C\u201D]([^"\u201C\u201D]+?)["\u201C\u201D]/g,
		'~~"$1"~~ \u2192 **"$2"**',
	)

	// 2. Multiline correction: "original"\n→ "correction"
	text = text.replace(
		/["\u201C\u201D]([^"\u201C\u201D]+?)["\u201C\u201D]\s*\n\s*\u2192\s*["\u201C\u201D]([^"\u201C\u201D]+?)["\u201C\u201D]/g,
		'~~"$1"~~ \u2192 **"$2"**',
	)

	// 3. Section headers — make bold + add marker
	text = text.replace(/^(Điểm mạnh|Điểm tốt)(\s*:)/gm, "**\u2705 $1$2**")
	text = text.replace(/^(Điểm cần cải thiện|Điểm yếu)(\s*:)/gm, "**\u26A0\uFE0F $1$2**")
	text = text.replace(/^(Gợi ý[^:\n]*\s*:)/gm, "**\uD83D\uDCA1 $1**")
	text = text.replace(
		/^(Tóm lại|Tổng thể|Tổng kết|Nhận xét chung)([^:\n]*:)/gm,
		"**\uD83D\uDCDD $1$2**",
	)

	return text
}

// ── Inline correction renderer ─────────────────────
// Detect ~~"error"~~ → **"fix"** in rendered children
// and render as styled correction card

function renderInlineCorrections(children: ReactNode): ReactNode {
	if (typeof children !== "string") return children

	// Match: ~~"error"~~ → **"fix"**
	const correctionRegex = /~~"([^"]+)"~~\s*→\s*\*\*"([^"]+)"\*\*/g
	const parts: ReactNode[] = []
	let lastIndex = 0
	let match = correctionRegex.exec(children)

	while (match) {
		if (match.index > lastIndex) {
			parts.push(children.slice(lastIndex, match.index))
		}
		parts.push(
			<span key={match.index} className="my-1 inline-flex items-center gap-1.5 align-baseline">
				<span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-xs dark:border-red-800/40 dark:bg-red-950/30">
					<span className="line-through decoration-red-400 text-red-600 dark:text-red-400">
						{match[1]}
					</span>
				</span>
				<HugeiconsIcon icon={ArrowRight01Icon} className="size-3 text-muted-foreground" />
				<span className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-1.5 py-0.5 text-xs font-medium dark:border-green-800/40 dark:bg-green-950/30">
					<span className="text-green-700 dark:text-green-400">{match[2]}</span>
				</span>
			</span>,
		)
		lastIndex = match.index + match[0].length
		match = correctionRegex.exec(children)
	}

	if (parts.length === 0) return children
	if (lastIndex < children.length) {
		parts.push(children.slice(lastIndex))
	}
	return <>{parts}</>
}

// ── Quoted phrase highlighter ──────────────────────
// Detect "quoted text" in rendered text and render as inline badge

function renderQuotedPhrases(children: ReactNode): ReactNode {
	if (typeof children !== "string") return children

	// Skip if this looks like a correction (has → or ~~)
	if (children.includes("→") || children.includes("~~")) return children

	const quoteRegex = /["""]([^"""]{2,60}?)["""]/g
	const parts: ReactNode[] = []
	let lastIndex = 0
	let match = quoteRegex.exec(children)

	while (match) {
		if (match.index > lastIndex) {
			parts.push(children.slice(lastIndex, match.index))
		}
		parts.push(
			<span
				key={match.index}
				className="mx-0.5 inline-block rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300"
			>
				{match[1]}
			</span>,
		)
		lastIndex = match.index + match[0].length
		match = quoteRegex.exec(children)
	}

	if (parts.length === 0) return children
	if (lastIndex < children.length) {
		parts.push(children.slice(lastIndex))
	}
	return <>{parts}</>
}

// ── Combined inline renderer ───────────────────────

function renderRichInline(children: ReactNode): ReactNode {
	// First try corrections, then quotes
	const withCorrections = renderInlineCorrections(children)
	if (withCorrections !== children) return withCorrections
	return renderQuotedPhrases(children)
}

// ── Section icon detector ──────────────────────────

function getSectionStyle(
	text: string,
): { icon: typeof CheckmarkCircle02Icon; color: string } | null {
	if (text.includes("✅") || /điểm mạnh/i.test(text)) {
		return { icon: CheckmarkCircle02Icon, color: "text-green-600 dark:text-green-400" }
	}
	if (text.includes("⚠️") || /điểm cần|cải thiện/i.test(text)) {
		return { icon: Edit02Icon, color: "text-red-600 dark:text-red-400" }
	}
	if (text.includes("💡") || /gợi ý/i.test(text)) {
		return { icon: Idea01Icon, color: "text-amber-600 dark:text-amber-400" }
	}
	if (text.includes("📝") || /tóm lại|tổng/i.test(text)) {
		return { icon: SparklesIcon, color: "text-blue-600 dark:text-blue-400" }
	}
	return null
}

// ── Emoji marker stripper ──────────────────────────

const EMOJI_MARKERS = ["\u2705", "\u26A0\uFE0F", "\u26A0", "\uD83D\uDCA1", "\uD83D\uDCDD"]

function stripEmojiMarkers(text: string): string {
	let result = text
	for (const emoji of EMOJI_MARKERS) {
		result = result.replaceAll(emoji, "")
	}
	return result.replace(/^\s+/, "")
}

// ═══════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════

export function MarkdownFeedback({ feedback, className }: MarkdownFeedbackProps) {
	const processed = useMemo(() => preprocessFeedback(feedback), [feedback])

	return (
		<div className={cn("markdown-feedback", className)}>
			<Markdown
				remarkPlugins={[remarkGfm]}
				components={{
					// Paragraphs — apply rich inline rendering
					p({ children }) {
						const enhanced = Array.isArray(children)
							? children.map((child, i) => <Fragment key={i}>{renderRichInline(child)}</Fragment>)
							: renderRichInline(children)

						// Check if this paragraph is a section header
						const textContent = typeof children === "string" ? children : ""
						const sectionStyle = getSectionStyle(textContent)

						if (sectionStyle) {
							// Strip emoji markers from display
							const cleanText = stripEmojiMarkers(textContent).replace(/\*\*/g, "")
							return (
								<div className="mb-2 mt-4 flex items-center gap-2 first:mt-0">
									<HugeiconsIcon
										icon={sectionStyle.icon}
										className={cn("size-4", sectionStyle.color)}
									/>
									<span className={cn("text-sm font-bold", sectionStyle.color)}>{cleanText}</span>
								</div>
							)
						}

						return (
							<p className="mb-3 text-sm leading-relaxed text-muted-foreground last:mb-0">
								{enhanced}
							</p>
						)
					},

					// Bold
					strong({ children }) {
						// Check if this is a section header
						const text = typeof children === "string" ? children : ""
						const sectionStyle = getSectionStyle(text)
						if (sectionStyle) {
							const cleanText = stripEmojiMarkers(text)
							return (
								<span className="mb-2 mt-4 flex items-center gap-2 first:mt-0">
									<HugeiconsIcon
										icon={sectionStyle.icon}
										className={cn("size-4", sectionStyle.color)}
									/>
									<span className={cn("text-sm font-bold", sectionStyle.color)}>{cleanText}</span>
								</span>
							)
						}
						return <strong className="font-semibold text-foreground">{children}</strong>
					},

					// Strikethrough — original errors
					del({ children }) {
						return (
							<span className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-xs line-through decoration-red-400 dark:border-red-800/40 dark:bg-red-950/30">
								<span className="text-red-600 dark:text-red-400">{children}</span>
							</span>
						)
					},

					// Emphasis
					em({ children }) {
						return <em className="font-medium text-primary not-italic">{children}</em>
					},

					// Ordered lists
					ol({ children }) {
						return <ol className="mb-3 list-decimal space-y-2 pl-5 text-sm">{children}</ol>
					},

					// Unordered lists
					ul({ children }) {
						return <ul className="mb-3 space-y-2 pl-4 text-sm">{children}</ul>
					},

					// List items — apply rich inline
					li({ children }) {
						const enhanced = Array.isArray(children)
							? children.map((child, i) => <Fragment key={i}>{renderRichInline(child)}</Fragment>)
							: renderRichInline(children)
						return (
							<li className="leading-relaxed text-muted-foreground marker:text-muted-foreground/50">
								{enhanced}
							</li>
						)
					},

					// Headings
					h1({ children }) {
						return <h3 className="mb-2 mt-4 text-sm font-bold first:mt-0">{children}</h3>
					},
					h2({ children }) {
						return <h4 className="mb-2 mt-3 text-sm font-bold first:mt-0">{children}</h4>
					},
					h3({ children }) {
						return <h5 className="mb-1.5 mt-3 text-sm font-semibold first:mt-0">{children}</h5>
					},

					// Blockquotes — styled as suggestion cards
					blockquote({ children }) {
						return (
							<blockquote className="my-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-800/40 dark:bg-blue-950/20">
								<div className="mb-1 flex items-center gap-1.5">
									<HugeiconsIcon
										icon={Idea01Icon}
										className="size-3.5 text-blue-600 dark:text-blue-400"
									/>
									<span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
										Gợi ý viết lại
									</span>
								</div>
								<div className="text-sm leading-relaxed text-blue-900 dark:text-blue-200">
									{children}
								</div>
							</blockquote>
						)
					},

					// Inline code
					code({ children }) {
						return (
							<code className="rounded bg-muted px-1 py-0.5 text-xs font-medium text-foreground">
								{children}
							</code>
						)
					},

					// HR
					hr() {
						return <hr className="my-4 border-border/50" />
					},

					// Links
					a({ children, href }) {
						return (
							<a
								href={href}
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary underline"
							>
								{children}
							</a>
						)
					},
				}}
			>
				{processed}
			</Markdown>
		</div>
	)
}
