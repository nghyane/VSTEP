import { Link } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"
import { WritingResult } from "#/features/grading/components/WritingResult"
import type { WritingPromptDetail } from "#/features/practice/types"

interface Props {
	prompt: WritingPromptDetail
	submissionId: string
}

export function WritingGradingScreen({ prompt, submissionId }: Props) {
	return (
		<div className="flex flex-col h-screen bg-background">
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
			<div className="flex-1 overflow-y-auto">
				<div className="max-w-2xl mx-auto px-6 py-8">
					<WritingResult submissionId={submissionId} />
				</div>
			</div>
		</div>
	)
}
