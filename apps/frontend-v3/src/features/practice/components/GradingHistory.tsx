import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { speakingVstepHistoryQuery, writingHistoryQuery } from "#/features/practice/queries"
import type { SpeakingHistoryItem, WritingHistoryItem } from "#/features/practice/types"
import { formatShortDate } from "#/lib/utils"

type MergedItem =
	| { kind: "writing"; item: WritingHistoryItem }
	| { kind: "speaking"; item: SpeakingHistoryItem }

export function GradingHistory() {
	const { data: wData } = useQuery(writingHistoryQuery)
	const { data: sData } = useQuery(speakingVstepHistoryQuery)

	const merged: MergedItem[] = [
		...(wData?.data ?? []).map((item) => ({ kind: "writing" as const, item })),
		...(sData?.data ?? []).map((item) => ({ kind: "speaking" as const, item })),
	].sort((a, b) => new Date(b.item.submitted_at).getTime() - new Date(a.item.submitted_at).getTime())

	if (!wData && !sData) return <p className="text-muted">Đang tải...</p>

	if (merged.length === 0) {
		return (
			<div className="card p-8 text-center">
				<p className="text-muted">Chưa có bài nào được AI chấm</p>
				<p className="text-xs text-subtle mt-1">Nộp bài Viết hoặc Nói để xem kết quả tại đây</p>
			</div>
		)
	}

	return (
		<div className="space-y-2">
			{merged.map((entry) => {
				if (entry.kind === "writing") {
					const w = entry.item
					return (
						<Link
							key={`w-${w.id}`}
							to="/grading/writing/$submissionId"
							params={{ submissionId: w.id }}
							className="card-interactive flex items-center gap-4 p-4"
						>
							<span className="w-8 h-8 rounded-lg bg-skill-writing/10 text-skill-writing flex items-center justify-center text-xs font-bold shrink-0">
								W
							</span>
							<div className="flex-1 min-w-0">
								<p className="font-bold text-sm text-foreground truncate">{w.prompt?.title ?? "Bài viết"}</p>
								<p className="text-xs text-muted mt-0.5">
									{formatShortDate(w.submitted_at)} · {w.word_count} từ
								</p>
							</div>
							<span className="text-xs font-bold text-skill-writing shrink-0">Xem điểm →</span>
						</Link>
					)
				}
				const s = entry.item
				return (
					<Link
						key={`s-${s.id}`}
						to="/grading/speaking/$submissionId"
						params={{ submissionId: s.id }}
						className="card-interactive flex items-center gap-4 p-4"
					>
						<span className="w-8 h-8 rounded-lg bg-skill-speaking/10 text-skill-speaking flex items-center justify-center text-xs font-bold shrink-0">
							S
						</span>
						<div className="flex-1 min-w-0">
							<p className="font-bold text-sm text-foreground">Bài nói VSTEP</p>
							<p className="text-xs text-muted mt-0.5">
								{formatShortDate(s.submitted_at)} · {s.duration_seconds}s
							</p>
						</div>
						<span className="text-xs font-bold text-skill-speaking shrink-0">Xem điểm →</span>
					</Link>
				)
			})}
		</div>
	)
}
