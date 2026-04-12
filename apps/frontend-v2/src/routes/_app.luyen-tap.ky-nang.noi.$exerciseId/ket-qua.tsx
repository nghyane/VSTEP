import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Headphones, Mic, RotateCcw } from "lucide-react"
import { Suspense, useMemo } from "react"
import { Button } from "#/components/ui/button"
import { Skeleton } from "#/components/ui/skeleton"
import { loadSpeakingResult } from "#/lib/practice/result-storage"
import { speakingExerciseQueryOptions } from "#/lib/queries/speaking"

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/noi/$exerciseId/ket-qua")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(speakingExerciseQueryOptions(params.exerciseId)),
	component: ResultPage,
})

function ResultPage() {
	const { exerciseId } = Route.useParams()
	return (
		<div className="mx-auto w-full max-w-3xl space-y-6 pb-10">
			<Link
				to="/luyen-tap/ky-nang/noi"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Danh sách bài
			</Link>
			<Suspense fallback={<ResultSkeleton />}>
				<ResultBody exerciseId={exerciseId} />
			</Suspense>
		</div>
	)
}

function ResultBody({ exerciseId }: { exerciseId: string }) {
	const navigate = useNavigate()
	const { data: exercise } = useSuspenseQuery(speakingExerciseQueryOptions(exerciseId))
	const stored = useMemo(() => loadSpeakingResult(exerciseId), [exerciseId])

	if (!stored) return <EmptyResult exerciseId={exerciseId} />

	const pct = Math.round(stored.dictationAccuracy * 100)

	return (
		<div className="space-y-6">
			<header>
				<p className="text-xs font-semibold uppercase tracking-wide text-skill-speaking">
					Tổng kết · {exercise.title}
				</p>
				<h1 className="mt-1 text-2xl font-bold">
					Bạn đã hoàn thành {stored.sentencesDone}/{stored.sentencesTotal} câu
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Chế độ cuối: {stored.mode === "dictation" ? "Dictation" : "Shadowing"} · Nộp lúc{" "}
					{formatTime(stored.submittedAt)}
				</p>
			</header>

			<div className="grid gap-4 sm:grid-cols-2">
				<StatCard
					icon={<Headphones className="size-5" />}
					label="Độ chính xác Dictation"
					value={`${pct}%`}
					hint={
						pct >= 80
							? "Xuất sắc!"
							: pct >= 60
								? "Khá ổn, luyện thêm chút."
								: "Hãy nghe lại và thử lại."
					}
				/>
				<StatCard
					icon={<Mic className="size-5" />}
					label="Câu đã hoàn thành"
					value={`${stored.sentencesDone}/${stored.sentencesTotal}`}
					hint="Tiếp tục luyện các câu còn lại để cải thiện nhịp nói."
				/>
			</div>

			<div className="rounded-2xl bg-muted/50 p-5">
				<h3 className="text-sm font-semibold">Gợi ý tiếp theo</h3>
				<ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
					<li>· Quay lại bài này và luyện chế độ còn lại.</li>
					<li>· Tập trung vào các câu dài, phát âm chậm 0.75x trước khi tăng tốc.</li>
					<li>· Đọc to lại câu mẫu 3 lần trước khi record để cảm nhận nhịp.</li>
				</ul>
			</div>

			<footer
				data-session-footer
				className="fixed right-0 bottom-0 left-[var(--dock-left)] z-20 flex flex-wrap items-center justify-between gap-3 border-t bg-background px-6 py-4"
			>
				<Button
					variant="outline"
					onClick={() =>
						navigate({ to: "/luyen-tap/ky-nang/noi/$exerciseId", params: { exerciseId } })
					}
				>
					<RotateCcw className="size-4" />
					Luyện lại
				</Button>
				<Button asChild>
					<Link to="/luyen-tap/ky-nang/noi">Về danh sách bài</Link>
				</Button>
			</footer>
			<div aria-hidden className="h-24" />
		</div>
	)
}

function StatCard({
	icon,
	label,
	value,
	hint,
}: {
	icon: React.ReactNode
	label: string
	value: string
	hint: string
}) {
	return (
		<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
			<div className="flex items-center gap-2 text-skill-speaking">
				{icon}
				<span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
			</div>
			<p className="mt-3 text-3xl font-bold tabular-nums">{value}</p>
			<p className="mt-1 text-xs text-muted-foreground">{hint}</p>
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
				<Link to="/luyen-tap/ky-nang/noi/$exerciseId" params={{ exerciseId }}>
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
		</div>
	)
}

function formatTime(ts: number): string {
	const d = new Date(ts)
	return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
}
