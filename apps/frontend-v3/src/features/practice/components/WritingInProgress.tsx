import { useMutation } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useCallback, useRef, useState } from "react"
import { Icon } from "#/components/Icon"
import { submitWritingSession } from "#/features/practice/actions"
import { TranslateSelection } from "#/features/practice/components/TranslateSelection"
import { WritingGradingScreen } from "#/features/practice/components/WritingGradingScreen"
import { WritingSamplePanel } from "#/features/practice/components/WritingSamplePanel"
import { WritingWordProgress } from "#/features/practice/components/WritingWordProgress"
import type { WritingPromptDetail, WritingSubmission } from "#/features/practice/types"
import { countWords } from "#/lib/utils"

interface Props {
	prompt: WritingPromptDetail
	sessionId: string
}

export function WritingInProgress({ prompt, sessionId }: Props) {
	const [text, setText] = useState("")
	const [submission, setSubmission] = useState<WritingSubmission | null>(null)
	const [showSample, setShowSample] = useState(false)
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const wc = countWords(text)
	const hasSample = !!prompt.sample_answer

	const mutation = useMutation({
		mutationFn: () => submitWritingSession(sessionId, text),
		onSuccess: (res) => setSubmission(res.data),
	})

	const handleInsertText = useCallback(
		(insert: string) => {
			const ta = textareaRef.current
			if (!ta) return
			const start = ta.selectionStart
			const before = text.slice(0, start)
			const after = text.slice(start)
			const spaceBefore = before.length > 0 && !before.endsWith(" ") && !before.endsWith("\n") ? " " : ""
			const spaceAfter = after.length > 0 && !after.startsWith(" ") && !after.startsWith("\n") ? " " : ""
			const newText = before + spaceBefore + insert + spaceAfter + after
			setText(newText)
			requestAnimationFrame(() => {
				const pos = start + spaceBefore.length + insert.length + spaceAfter.length
				ta.setSelectionRange(pos, pos)
				ta.focus()
			})
		},
		[text],
	)

	if (submission) {
		return <WritingGradingScreen prompt={prompt} submission={submission} responseText={text} />
	}

	return (
		<div className="flex flex-col h-screen bg-background">
			{/* Header */}
			<div className="flex items-center gap-3 border-b-2 border-border bg-surface px-4 py-3 shrink-0">
				<Link to="/luyen-tap/viet" className="p-1 hover:opacity-70 shrink-0">
					<Icon name="back" size="sm" className="text-muted" />
				</Link>
				<span className="text-[10px] font-bold text-skill-writing bg-skill-writing/15 px-1.5 py-0.5 rounded shrink-0">
					Task {prompt.part}
				</span>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-bold text-foreground truncate">{prompt.title}</p>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				<div className="max-w-6xl mx-auto px-6 py-6">
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
											<button
												key={s}
												type="button"
												onClick={() => handleInsertText(s)}
												className="text-xs bg-background px-2 py-1 rounded-lg text-subtle hover:text-foreground hover:bg-skill-writing/10 transition cursor-pointer"
											>
												{s}
											</button>
										))}
									</div>
								</div>
							)}
							{hasSample && (
								<button
									type="button"
									onClick={() => setShowSample(true)}
									className="text-xs font-bold text-skill-writing hover:underline transition"
								>
									Xem bài mẫu
								</button>
							)}
						</div>

						{/* Editor */}
						<div className="space-y-3">
							<textarea
								ref={textareaRef}
								value={text}
								onChange={(e) => setText(e.target.value)}
								placeholder="Viết bài của bạn ở đây..."
								className="w-full min-h-[500px] p-5 pb-14 text-sm leading-relaxed text-foreground bg-surface border-2 border-border rounded-xl resize-y focus:outline-none focus:border-primary"
							/>
							<WritingWordProgress count={wc} min={prompt.min_words} max={prompt.max_words} />
						</div>
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className="border-t-2 border-border bg-surface shrink-0">
				<div className="max-w-2xl mx-auto px-6 py-4 flex flex-col items-center gap-2">
					<button
						type="button"
						onClick={() => mutation.mutate()}
						disabled={mutation.isPending || wc === 0}
						className="py-2 px-6 text-sm font-bold rounded-(--radius-button) text-primary-foreground bg-skill-writing shadow-[0_3px_0_var(--color-skill-writing-dark)] active:shadow-[0_1px_0_var(--color-skill-writing-dark)] active:translate-y-[2px] transition disabled:opacity-50 uppercase"
					>
						{mutation.isPending ? "Đang nộp..." : "Nộp bài"}
					</button>
					<p className="text-xs font-bold text-muted tabular-nums">
						{wc} / {prompt.max_words} từ
					</p>
				</div>
			</div>

			{/* Sample overlay */}
			{showSample && (
				<WritingSamplePanel
					answer={prompt.sample_answer ?? ""}
					markers={prompt.sample_markers}
					onClose={() => setShowSample(false)}
				/>
			)}
		</div>
	)
}
