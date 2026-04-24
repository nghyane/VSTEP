import { useMutation } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Icon } from "#/components/Icon"
import { submitWritingSession } from "#/features/practice/actions"
import { TranslateSelection } from "#/features/practice/components/TranslateSelection"
import type { SampleMarker, WritingPromptDetail, WritingSubmission } from "#/features/practice/types"
import { cn, countWords } from "#/lib/utils"

interface Props {
	prompt: WritingPromptDetail
	sessionId: string
}

export function WritingInProgress({ prompt, sessionId }: Props) {
	const [text, setText] = useState("")
	const [submission, setSubmission] = useState<WritingSubmission | null>(null)
	const [showSample, setShowSample] = useState(false)
	const wc = countWords(text)
	const inRange = wc >= prompt.min_words && wc <= prompt.max_words
	const over = wc > prompt.max_words
	const hasSample = !!prompt.sample_answer

	const mutation = useMutation({
		mutationFn: () => submitWritingSession(sessionId, text),
		onSuccess: (res) => setSubmission(res.data),
	})

	return (
		<div className="flex flex-col h-screen bg-background">
			{/* Header */}
			<div className="flex items-center gap-3 border-b-2 border-border bg-surface px-4 py-2.5 shrink-0">
				<Link to="/luyen-tap/viet" className="p-1 hover:opacity-70 shrink-0">
					<Icon name="close" size="xs" className="text-muted" />
				</Link>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-bold text-foreground truncate">{prompt.title}</p>
				</div>
				{hasSample && (
					<button
						type="button"
						onClick={() => setShowSample(true)}
						className="px-3 py-1.5 text-xs font-bold rounded-lg border-2 border-border text-muted hover:text-foreground transition shrink-0"
					>
						Bài mẫu
					</button>
				)}
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				<div className="max-w-6xl mx-auto px-6 py-6">
					{submission && (
						<div className="card p-6 text-center mb-6">
							<img src="/mascot/lac-happy.png" alt="" className="w-20 h-20 mx-auto mb-3 object-contain" />
							<p className="font-extrabold text-xl text-foreground">Đã nộp bài!</p>
							<p className="text-sm text-muted mt-1">{submission.word_count} từ · AI đang chấm bài</p>
							<div className="flex items-center justify-center gap-3 mt-4">
								<Link
									to="/grading/writing/$submissionId"
									params={{ submissionId: submission.submission_id }}
									className="py-2 px-5 font-bold text-sm rounded-(--radius-button) text-primary-foreground bg-skill-writing shadow-[0_3px_0_var(--color-skill-writing-dark)] uppercase"
								>
									Xem kết quả
								</Link>
								<Link
									to="/luyen-tap/viet"
									className="py-2 px-5 font-bold text-sm rounded-(--radius-button) border-2 border-border text-muted uppercase"
								>
									Về danh sách
								</Link>
							</div>
						</div>
					)}

					<div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
						{/* Prompt panel */}
						<div className="card p-6 self-start lg:sticky lg:top-6 space-y-4">
							<div>
								<p className="text-xs font-bold text-skill-writing uppercase tracking-wide mb-2">
									Đề bài — Task {prompt.part}
								</p>
								<TranslateSelection>
									<p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
										{prompt.prompt}
									</p>
								</TranslateSelection>
							</div>
							{prompt.required_points.length > 0 && (
								<div>
									<p className="text-xs font-bold text-muted mb-1">Yêu cầu</p>
									<ul className="text-sm text-subtle space-y-1">
										{prompt.required_points.map((p) => (
											<li key={p} className="flex gap-2">
												<span className="text-skill-writing shrink-0">•</span>
												{p}
											</li>
										))}
									</ul>
								</div>
							)}
							{prompt.sentence_starters.length > 0 && (
								<div>
									<p className="text-xs font-bold text-muted mb-1">Gợi ý mở đầu</p>
									<div className="flex flex-wrap gap-1.5">
										{prompt.sentence_starters.map((s) => (
											<span key={s} className="text-xs bg-background px-2 py-1 rounded-lg text-subtle">
												{s}
											</span>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Editor */}
						<div className="relative">
							<textarea
								value={text}
								onChange={(e) => setText(e.target.value)}
								disabled={!!submission}
								placeholder="Viết bài của bạn ở đây..."
								className="w-full min-h-[500px] p-5 pb-10 text-sm leading-relaxed text-foreground bg-surface border-2 border-border rounded-xl resize-y focus:outline-none focus:border-primary disabled:opacity-60"
							/>
							<span
								className={cn(
									"absolute bottom-4 right-4 text-xs font-bold tabular-nums",
									inRange ? "text-primary" : over ? "text-destructive" : "text-muted",
								)}
							>
								{wc} / {prompt.min_words}–{prompt.max_words} từ
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Footer */}
			{!submission && (
				<div className="flex items-center justify-end border-t-2 border-border bg-surface px-4 py-2.5 shrink-0">
					<button
						type="button"
						onClick={() => mutation.mutate()}
						disabled={mutation.isPending || wc === 0}
						className="py-2 px-6 text-sm font-bold rounded-(--radius-button) text-primary-foreground bg-skill-writing shadow-[0_3px_0_var(--color-skill-writing-dark)] active:shadow-[0_1px_0_var(--color-skill-writing-dark)] active:translate-y-[2px] transition disabled:opacity-50 uppercase"
					>
						{mutation.isPending ? "Đang nộp..." : "Nộp bài"}
					</button>
				</div>
			)}

			{/* Sample overlay */}
			{showSample && (
				<div
					className="fixed inset-0 z-50 bg-background/50 backdrop-blur-[2px] overflow-y-auto"
					onClick={() => setShowSample(false)}
				>
					<div className="py-10 px-6 relative" onClick={(e) => e.stopPropagation()}>
						<button
							type="button"
							onClick={() => setShowSample(false)}
							className="absolute top-2 right-8 text-muted hover:text-foreground transition"
						>
							<Icon name="close" size="xs" />
						</button>
						<SamplePanel answer={prompt.sample_answer ?? ""} markers={prompt.sample_markers} />
					</div>
				</div>
			)}
		</div>
	)
}

const HIGHLIGHT_BG: Record<string, string> = {
	yellow: "bg-yellow-200/40",
	blue: "bg-blue-200/30",
	pink: "bg-pink-200/40",
}

const DOT_BG: Record<string, string> = {
	yellow: "bg-yellow-400",
	blue: "bg-blue-400",
	pink: "bg-pink-400",
}

const strokeStyle = {
	textShadow: "-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff",
} as const

function SamplePanel({ answer, markers }: { answer: string; markers: SampleMarker[] }) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [lines, setLines] = useState<{ id: string; d: string }[]>([])
	const segments = useMemo(() => buildSegments(answer, markers), [answer, markers])
	const leftMarkers = useMemo(() => markers.filter((m) => m.side === "left"), [markers])
	const rightMarkers = useMemo(() => markers.filter((m) => m.side === "right"), [markers])

	const computeLines = useCallback(() => {
		const el = containerRef.current
		if (!el) return
		const cRect = el.getBoundingClientRect()
		const result: { id: string; d: string }[] = []
		for (const m of markers) {
			const dot = el.querySelector(`[data-sticker="${m.id}"]`)
			const anchor = el.querySelector(`[data-anchor="${m.id}"]`)
			if (!dot || !anchor) continue
			const dR = dot.getBoundingClientRect()
			const aR = anchor.getBoundingClientRect()
			const x1 = m.side === "left" ? dR.right - cRect.left : aR.right - cRect.left
			const y1 = m.side === "left" ? dR.top + dR.height / 2 - cRect.top : aR.top + aR.height / 2 - cRect.top
			const x2 = m.side === "left" ? aR.left - cRect.left : dR.left - cRect.left
			const y2 = m.side === "left" ? aR.top + aR.height / 2 - cRect.top : dR.top + dR.height / 2 - cRect.top
			const cx = Math.abs(x2 - x1) * 0.45
			result.push({ id: m.id, d: `M${x1},${y1} C${x1 + cx},${y1} ${x2 - cx},${y2} ${x2},${y2}` })
		}
		setLines(result)
	}, [markers])

	useEffect(() => {
		const t = setTimeout(computeLines, 120)
		window.addEventListener("resize", computeLines)
		return () => {
			clearTimeout(t)
			window.removeEventListener("resize", computeLines)
		}
	}, [computeLines])

	return (
		<div ref={containerRef} className="relative">
			<svg
				aria-hidden="true"
				role="presentation"
				className="pointer-events-none absolute inset-0 size-full overflow-visible"
				style={{ zIndex: 10 }}
			>
				{lines.map((l) => (
					<path key={l.id} d={l.d} fill="none" stroke="#d4d4d8" strokeWidth={1.5} strokeDasharray="5 4" />
				))}
			</svg>

			<div className="mx-auto w-full max-w-3xl card px-6 py-5">
				<p className="text-xs font-bold text-skill-writing uppercase tracking-wide mb-3">Bài mẫu</p>
				<TranslateSelection>
					<p className="whitespace-pre-wrap text-sm leading-[2] text-foreground">
						{segments.map((seg, i) =>
							seg.marker ? (
								<span
									key={i}
									data-anchor={seg.marker.id}
									className={cn("rounded px-0.5", HIGHLIGHT_BG[seg.marker.color])}
								>
									{seg.text}
								</span>
							) : (
								<span key={i}>{seg.text}</span>
							),
						)}
					</p>
				</TranslateSelection>
			</div>

			{leftMarkers.map((m, i) => (
				<div
					key={m.id}
					className="absolute right-[calc(50%+24rem+1.5rem)] hidden w-40 text-right xl:block"
					style={{ top: `${i * 100 + 48}px` }}
				>
					<div className="flex items-center justify-end gap-2">
						<span className="text-xs font-bold text-black" style={strokeStyle}>
							{m.label}
						</span>
						<span
							data-sticker={m.id}
							className={cn("inline-block size-2.5 shrink-0 rounded-full", DOT_BG[m.color])}
						/>
					</div>
					{m.detail && (
						<p className="mt-1 text-xs text-black" style={strokeStyle}>
							{m.detail}
						</p>
					)}
				</div>
			))}

			{rightMarkers.map((m, i) => (
				<div
					key={m.id}
					className="absolute left-[calc(50%+24rem+1.5rem)] hidden w-40 xl:block"
					style={{ top: `${i * 100 + 48}px` }}
				>
					<div className="flex items-center gap-2">
						<span
							data-sticker={m.id}
							className={cn("inline-block size-2.5 shrink-0 rounded-full", DOT_BG[m.color])}
						/>
						<span className="text-xs font-bold text-black" style={strokeStyle}>
							{m.label}
						</span>
					</div>
					{m.detail && (
						<p className="mt-1 text-xs text-black" style={strokeStyle}>
							{m.detail}
						</p>
					)}
				</div>
			))}

			{markers.length > 0 && (
				<div className="mx-auto max-w-3xl mt-4 grid gap-2 sm:grid-cols-2 xl:hidden">
					{markers.map((m) => (
						<div key={m.id} className="flex items-start gap-2 rounded-lg border-2 border-border p-3">
							<span className={cn("mt-0.5 size-2.5 shrink-0 rounded-full", DOT_BG[m.color])} />
							<div>
								<p className="text-xs font-bold text-black" style={strokeStyle}>
									{m.label}
								</p>
								{m.detail && (
									<p className="text-xs text-black mt-0.5" style={strokeStyle}>
										{m.detail}
									</p>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

interface Segment {
	text: string
	marker: SampleMarker | null
}

function buildSegments(answer: string, markers: SampleMarker[]): Segment[] {
	if (markers.length === 0) return [{ text: answer, marker: null }]

	const ranges: { start: number; end: number; marker: SampleMarker }[] = []
	for (const m of markers) {
		let idx = -1
		let occ = 0
		const target = m.occurrence || 1
		let searchFrom = 0
		while (occ < target) {
			idx = answer.indexOf(m.match, searchFrom)
			if (idx === -1) break
			occ++
			searchFrom = idx + 1
		}
		if (idx !== -1) ranges.push({ start: idx, end: idx + m.match.length, marker: m })
	}
	ranges.sort((a, b) => a.start - b.start)

	const result: Segment[] = []
	let cursor = 0
	for (const r of ranges) {
		if (r.start < cursor) continue
		if (r.start > cursor) result.push({ text: answer.slice(cursor, r.start), marker: null })
		result.push({ text: answer.slice(r.start, r.end), marker: r.marker })
		cursor = r.end
	}
	if (cursor < answer.length) result.push({ text: answer.slice(cursor), marker: null })
	return result
}
