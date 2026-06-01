import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

// ═══════════════════════════════════════════════════
// Typo.js lazy singleton
// ═══════════════════════════════════════════════════

type TypoInstance = { check: (word: string) => boolean; suggest: (word: string) => string[] }

let typoPromise: Promise<TypoInstance> | null = null

function getTypo(): Promise<TypoInstance> {
	if (!typoPromise) {
		typoPromise = (async () => {
			const [Typo, affData, wordsData] = await Promise.all([
				import("typo-js").then((m) => m.default ?? m),
				fetch("/dictionaries/en_US.aff").then((r) => r.text()),
				fetch("/dictionaries/en_US.dic").then((r) => r.text()),
			])
			return new Typo("en_US", affData, wordsData) as TypoInstance
		})()
	}
	return typoPromise
}

// ═══════════════════════════════════════════════════
// Hook: useSpellCheck
// ═══════════════════════════════════════════════════

export interface MisspelledWord {
	word: string
	index: number
	suggestions: string[]
}

export function useSpellCheck(text: string, debounceMs = 350) {
	const [typo, setTypo] = useState<TypoInstance | null>(null)
	const [misspelled, setMisspelled] = useState<MisspelledWord[]>([])

	useEffect(() => {
		getTypo().then(setTypo)
	}, [])

	useEffect(() => {
		if (!typo || !text.trim()) {
			setMisspelled([])
			return
		}

		const timer = setTimeout(() => {
			const results: MisspelledWord[] = []
			const seen = new Set<string>()
			const re = /\b[a-zA-Z']+\b/g
			for (let match = re.exec(text); match !== null; match = re.exec(text)) {
				const word = match[0]
				if (word.length < 2) continue
				if (seen.has(word.toLowerCase())) {
					if (!typo.check(word)) {
						results.push({ word, index: match.index, suggestions: [] })
					}
					continue
				}
				seen.add(word.toLowerCase())
				if (!typo.check(word)) {
					results.push({
						word,
						index: match.index,
						suggestions: typo.suggest(word).slice(0, 3),
					})
				}
			}
			setMisspelled(results)
		}, debounceMs)

		return () => clearTimeout(timer)
	}, [text, typo, debounceMs])

	return { misspelled, ready: typo !== null }
}

// ═══════════════════════════════════════════════════
// SpellCheckEditor component
// ═══════════════════════════════════════════════════

interface SpellCheckEditorProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	className?: string
	minHeight?: number
}

export function SpellCheckEditor({
	value,
	onChange,
	placeholder = "",
	className,
	minHeight = 300,
}: SpellCheckEditorProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const backdropRef = useRef<HTMLDivElement>(null)
	const { misspelled, ready } = useSpellCheck(value)

	const syncScroll = useCallback(() => {
		const ta = textareaRef.current
		const bd = backdropRef.current
		if (ta && bd) {
			bd.scrollTop = ta.scrollTop
			bd.scrollLeft = ta.scrollLeft
		}
	}, [])

	const highlightedHtml = useMemo(() => {
		if (!value) return ""
		if (misspelled.length === 0) return escapeHtml(value)

		const sorted = [...misspelled].sort((a, b) => a.index - b.index)
		const parts: string[] = []
		let cursor = 0

		for (const m of sorted) {
			if (m.index > cursor) {
				parts.push(escapeHtml(value.slice(cursor, m.index)))
			}
			parts.push(`<mark class="spell-error">${escapeHtml(m.word)}</mark>`)
			cursor = m.index + m.word.length
		}

		if (cursor < value.length) {
			parts.push(escapeHtml(value.slice(cursor)))
		}

		return parts.join("")
	}, [value, misspelled])

	return (
		<div className="relative" style={{ minHeight: `${minHeight}px` }}>
			{/* Highlight backdrop */}
			<div
				ref={backdropRef}
				className={cn(
					"pointer-events-none absolute inset-0 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-transparent p-4 text-sm leading-relaxed text-transparent",
					className,
				)}
				style={{ minHeight: `${minHeight}px` }}
				aria-hidden
				// biome-ignore lint/security/noDangerouslySetInnerHtml: highlight backdrop uses sanitized HTML from escapeHtml() — no user-generated raw HTML
				dangerouslySetInnerHTML={{ __html: highlightedHtml }}
			/>

			{/* Actual textarea */}
			<textarea
				ref={textareaRef}
				className={cn(
					"relative w-full rounded-xl border bg-transparent p-4 text-sm leading-relaxed caret-foreground focus:outline-none focus:ring-2 focus:ring-primary/30",
					className,
				)}
				style={{ minHeight: `${minHeight}px` }}
				placeholder={placeholder}
				value={value}
				spellCheck={false}
				onChange={(ev) => onChange(ev.target.value)}
				onScroll={syncScroll}
			/>

			{/* Loading indicator */}
			{!ready && value.trim() && (
				<div className="absolute top-2 right-3 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
					Đang tải từ điển...
				</div>
			)}

			{/* Error count badge */}
			{misspelled.length > 0 && (
				<div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-lg bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
					<span className="flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">
						!
					</span>
					{misspelled.length} lỗi chính tả
				</div>
			)}

			{/* Inline styles for highlight marks */}
			<style>{`
				.spell-error {
					background: transparent;
					color: inherit;
					text-decoration: underline wavy #ef4444;
					text-decoration-skip-ink: none;
					text-underline-offset: 2px;
					border-radius: 2px;
				}
			`}</style>
		</div>
	)
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/\n/g, "\n")
}
