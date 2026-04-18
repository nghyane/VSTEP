import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, RotateCcw } from "lucide-react"
import { Suspense, useMemo } from "react"
import { AiGradingCard } from "#/features/practice/components/AiGradingCard"
import { AnnotatedFeedbackView } from "#/features/practice/components/writing/AnnotatedFeedbackView"
import {
	buildAnnotatedWritingFeedback,
	buildMockWritingGrading,
} from "#/features/practice/lib/mock-ai-grading"
import { writingExerciseQueryOptions } from "#/features/practice/lib/queries-writing"
import { loadWritingResult } from "#/features/practice/lib/result-storage"
import { Button } from "#/shared/ui/button"
import { Skeleton } from "#/shared/ui/skeleton"

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/viet/$exerciseId/ket-qua")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(writingExerciseQueryOptions(params.exerciseId)),
	component: ResultPage,
})

function ResultPage() {
	const { exerciseId } = Route.useParams()
	return (
		<div className="w-full space-y-6 pb-10">
			<Link
				to="/luyen-tap/ky-nang"
				search={{ skill: "viet", category: "", page: 1 }}
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Danh sách đề
			</Link>
			<Suspense fallback={<ResultSkeleton />}>
				<ResultBody exerciseId={exerciseId} />
			</Suspense>
		</div>
	)
}

function ResultBody({ exerciseId }: { exerciseId: string }) {
	const navigate = useNavigate()
	const { data: exercise } = useSuspenseQuery(writingExerciseQueryOptions(exerciseId))
	const stored = useMemo(() => loadWritingResult(exerciseId), [exerciseId])
	const aiResult = useMemo(
		() => (stored ? buildMockWritingGrading(stored.wordCount) : null),
		[stored],
	)
	const annotatedFeedback = useMemo(
		() => (stored ? buildAnnotatedWritingFeedback(stored.userText, exercise) : null),
		[stored, exercise],
	)

	if (!stored || !aiResult || !annotatedFeedback) {
		return <EmptyResult exerciseId={exerciseId} />
	}

	return (
		<div className="space-y-6">
			<header>
				<p className="text-xs font-semibold uppercase tracking-wide text-skill-writing">
					Kết quả · {exercise.title}
				</p>
				<h1 className="mt-1 text-2xl font-bold">Bài viết đã nộp</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Nộp lúc {formatTime(stored.submittedAt)}
				</p>
			</header>

			<AiGradingCard result={aiResult} />

			<AnnotatedFeedbackView text={stored.userText} feedback={annotatedFeedback} />

			<div aria-hidden className="h-24" />
			<footer
				data-session-footer
				className="fixed right-0 bottom-0 left-[var(--dock-left)] z-20 flex flex-wrap items-center justify-between gap-3 border-t bg-background px-6 py-4"
			>
				<Button
					type="button"
					variant="outline"
					onClick={() =>
						navigate({ to: "/luyen-tap/ky-nang/viet/$exerciseId", params: { exerciseId } })
					}
				>
					<RotateCcw className="size-4" />
					Viết lại
				</Button>
				<Button asChild>
					<Link to="/luyen-tap/ky-nang" search={{ skill: "viet", category: "", page: 1 }}>
						Về danh sách đề viết
					</Link>
				</Button>
			</footer>
		</div>
	)
}

function EmptyResult({ exerciseId }: { exerciseId: string }) {
	return (
		<div className="rounded-2xl bg-muted/50 p-12 text-center">
			<p className="text-sm text-muted-foreground">
				Không tìm thấy kết quả. Có thể bạn đã reload trang hoặc chưa nộp bài.
			</p>
			<Button asChild className="mt-4">
				<Link to="/luyen-tap/ky-nang/viet/$exerciseId" params={{ exerciseId }}>
					Quay lại làm bài
				</Link>
			</Button>
		</div>
	)
}

function ResultSkeleton() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-10 w-64" />
			<Skeleton className="h-48 rounded-2xl" />
			<Skeleton className="h-64 rounded-2xl" />
		</div>
	)
}

function formatTime(ts: number): string {
	const d = new Date(ts)
	return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
}
