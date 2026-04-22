import type { WritingPromptDetail } from "#/features/practice/types"
import { FocusBar } from "#/features/vocab/components/FocusBar"

interface Props {
	prompt: WritingPromptDetail
	starting: boolean
	onStart: () => void
}

export function WritingPreview({ prompt, starting, onStart }: Props) {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<FocusBar backTo="/luyen-tap/viet" current={0} total={1} />
			<div className="flex-1 flex items-center justify-center px-6">
				<div className="text-center max-w-md">
					<p className="text-xs font-bold text-skill-writing bg-skill-writing/10 px-2.5 py-1 rounded-full inline-block mb-3">
						Task {prompt.part}
					</p>
					<h2 className="font-extrabold text-xl text-foreground">{prompt.title}</h2>
					{prompt.description && <p className="text-sm text-muted mt-2">{prompt.description}</p>}
					<p className="text-sm text-subtle mt-3">
						{prompt.min_words}–{prompt.max_words} từ
						{prompt.estimated_minutes ? ` · ${prompt.estimated_minutes} phút` : ""}
					</p>
					<button
						type="button"
						onClick={onStart}
						disabled={starting}
						className="btn btn-primary px-10 py-3.5 text-base mt-6 disabled:opacity-50"
					>
						{starting ? "Đang bắt đầu..." : "Bắt đầu viết"}
					</button>
				</div>
			</div>
		</div>
	)
}
