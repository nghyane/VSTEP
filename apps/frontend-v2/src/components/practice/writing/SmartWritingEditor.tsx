// SmartWritingEditor — Zen focus textarea với ghost text autocomplete.

import { Sparkles } from "lucide-react"
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react"
import { suggestNextPhrase } from "#/lib/practice/writing-structures"

interface Props {
	value: string
	onChange: (v: string) => void
	minWords: number
	maxWords: number
	wordCount: number
	enableAutocomplete: boolean
	placeholder?: string
}

const DEBOUNCE_MS = 500

export function SmartWritingEditor({
	value,
	onChange,
	maxWords,
	wordCount,
	enableAutocomplete,
	placeholder,
}: Props) {
	const taRef = useRef<HTMLTextAreaElement>(null)
	const mirrorRef = useRef<HTMLDivElement>(null)
	const [suggestion, setSuggestion] = useState<string | null>(null)
	const timerRef = useRef<number | null>(null)

	const clearTimer = useCallback(() => {
		if (timerRef.current !== null) {
			window.clearTimeout(timerRef.current)
			timerRef.current = null
		}
	}, [])

	useEffect(() => {
		if (!enableAutocomplete) {
			setSuggestion(null)
			return
		}
		clearTimer()
		timerRef.current = window.setTimeout(() => setSuggestion(suggestNextPhrase(value)), DEBOUNCE_MS)
		return clearTimer
	}, [value, enableAutocomplete, clearTimer])

	useEffect(() => {
		const ta = taRef.current
		const mirror = mirrorRef.current
		if (!ta || !mirror) return
		const sync = () => {
			mirror.scrollTop = ta.scrollTop
		}
		ta.addEventListener("scroll", sync)
		return () => ta.removeEventListener("scroll", sync)
	}, [])

	function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
		if (!suggestion) return
		if (e.key === "Tab" || (e.key === "ArrowRight" && isAtEnd(e.currentTarget))) {
			e.preventDefault()
			onChange(value + suggestion)
			setSuggestion(null)
			return
		}
		if (e.key !== "Shift" && e.key !== "Control" && e.key !== "Alt" && e.key !== "Meta")
			setSuggestion(null)
	}

	return (
		<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
			{/* Autocomplete hint */}
			{enableAutocomplete && suggestion && (
				<div className="mb-3 flex items-center gap-1.5 text-xs text-primary">
					<Sparkles className="size-3" />
					Tab để chấp nhận gợi ý
				</div>
			)}

			<div className="relative">
				<div
					ref={mirrorRef}
					aria-hidden
					className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words p-4 text-sm leading-relaxed"
				>
					<span className="invisible">{value}</span>
					{suggestion && <span className="text-muted-foreground/40">{suggestion}</span>}
				</div>

				<textarea
					ref={taRef}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder ?? "Bắt đầu viết bài của bạn tại đây..."}
					rows={16}
					className="relative min-h-[40vh] w-full resize-none rounded-xl border bg-background p-4 text-sm leading-relaxed text-foreground focus:outline-none"
				/>
			</div>

			{wordCount > maxWords && (
				<p className="mt-3 text-xs text-warning">Bài viết đang vượt giới hạn {maxWords} từ.</p>
			)}
		</div>
	)
}

function isAtEnd(ta: HTMLTextAreaElement): boolean {
	return ta.selectionStart === ta.value.length && ta.selectionEnd === ta.value.length
}
