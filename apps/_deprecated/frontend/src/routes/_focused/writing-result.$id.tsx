import { ArrowLeft01Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { useSubmission } from "@/hooks/use-submissions"
import { cn } from "@/lib/utils"
import { WritingGradingResult } from "@/routes/_focused/-components/writing/WritingGradingResult"
import { skillColor } from "@/routes/_learner/exams/-components/skill-meta"
import type { WritingContent } from "@/types/api"

export const Route = createFileRoute("/_focused/writing-result/$id")({
	component: FocusedWritingResultPage,
})

function isWritingContent(value: unknown): value is WritingContent {
	return !!value && typeof value === "object" && "prompt" in value
}

function FocusedWritingResultPage() {
	const { id } = Route.useParams()
	const { data, isLoading, isError } = useSubmission(id)

	if (isLoading) {
		return <div className="h-full animate-pulse bg-muted" />
	}

	if (isError || !data || data.skill !== "writing") {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<p className="text-sm text-destructive">Không thể tải dữ liệu bài viết.</p>
				<Button asChild variant="outline">
					<Link to="/submissions">Quay lại</Link>
				</Button>
			</div>
		)
	}

	const submittedText = data.answer && "text" in data.answer ? data.answer.text : ""
	const writingContent = isWritingContent(data.question?.content) ? data.question.content : null
	const writingTier = data.practiceSession?.config?.writingTier
	const isPending = data.status === "pending" || data.status === "processing"

	return (
		<div className="flex h-full flex-col">
			<header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
				<div className="flex items-center gap-2">
					<div
						className={cn("flex size-7 items-center justify-center rounded-lg", skillColor.writing)}
					>
						<HugeiconsIcon icon={PencilEdit02Icon} className="size-4" />
					</div>
					<span className="text-sm font-semibold">Phòng chấm bài viết</span>
				</div>
				<Button variant="ghost" size="sm" asChild>
					<Link to="/submissions">
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						Quay lại
					</Link>
				</Button>
			</header>

			{isPending ? (
				<div className="flex flex-1 items-center justify-center p-6">
					<div className="w-full max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/40 dark:bg-amber-950/10">
						<p className="text-lg font-semibold text-amber-800 dark:text-amber-200">
							Bài viết này vẫn đang được chấm
						</p>
						<p className="mt-2 text-sm text-amber-700/90 dark:text-amber-300/90">
							Hệ thống chưa trả kết quả chi tiết cho bài này. Hãy quay lại và đợi thông báo khi việc
							chấm điểm hoàn tất.
						</p>
						<div className="mt-4 flex items-center justify-center gap-3">
							<Button asChild>
								<Link to="/submissions">Quay về lịch sử bài nộp</Link>
							</Button>
						</div>
					</div>
				</div>
			) : (
				<WritingGradingResult
					submission={data}
					submittedText={submittedText}
					content={writingContent}
					tier={writingTier}
				/>
			)}
		</div>
	)
}
