// SpeakingSupportPanel — talking points gợi ý khi hỗ trợ AI bật.

import { ListChecks } from "lucide-react"
import { ChatGptIcon } from "#/components/common/ChatGptIcon"

interface Props {
	talkingPoints: readonly string[]
}

export function SpeakingSupportPanel({ talkingPoints }: Props) {
	return (
		<div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
			<div className="flex items-center gap-3 px-5 py-4">
				<ChatGptIcon className="size-5 shrink-0 text-primary" />
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-foreground">Trợ lý AI</p>
					<p className="text-xs text-muted-foreground">
						Các điểm chính bạn nên đề cập trong bài nói
					</p>
				</div>
			</div>
			<div className="px-5 pb-5">
				<span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
					<ListChecks className="size-3" />
					Talking points ({talkingPoints.length})
				</span>
				<ul className="mt-2 space-y-1.5">
					{talkingPoints.map((point, idx) => (
						<li
							key={point}
							className="flex items-start gap-3 rounded-lg border border-primary/10 bg-background px-3 py-2 text-sm shadow-sm"
						>
							<span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
								{idx + 1}
							</span>
							<span className="text-foreground/90">{point}</span>
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}
