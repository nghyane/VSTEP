import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Check, Mic, RotateCcw, Star, X } from "lucide-react"
import { Suspense, useMemo } from "react"
import { AiGradingCard } from "#/features/practice/components/AiGradingCard"
import { buildMockSpeakingGrading } from "#/features/practice/lib/mock-ai-grading"
import { speakingExerciseQueryOptions } from "#/features/practice/lib/queries-speaking"
import {
	loadSpeakingResult,
	type StoredSpeakingResult,
} from "#/features/practice/lib/result-storage"
import { SPEAKING_LEVEL_LABELS, type SpeakingExercise } from "#/mocks/speaking"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"
import { Skeleton } from "#/shared/ui/skeleton"

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/noi/$exerciseId/ket-qua")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(speakingExerciseQueryOptions(params.exerciseId)),
	component: ResultPage,
})

function ResultPage() {
	const { exerciseId } = Route.useParams()
	return (
		<div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
			<Link
				to="/luyen-tap/ky-nang"
				search={{ skill: "noi", category: "", page: 1 }}
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
	const { data: exercise } = useSuspenseQuery(speakingExerciseQueryOptions(exerciseId))
	const stored = useMemo(() => loadSpeakingResult(exerciseId), [exerciseId])
	const aiResult = useMemo(
		() => (stored ? buildMockSpeakingGrading(stored.sentencesDone / stored.sentencesTotal) : null),
		[stored],
	)

	if (!stored || !aiResult) return <EmptyResult exerciseId={exerciseId} />

	return (
		<div className="space-y-6">
			<header>
				<p className="text-xs font-semibold uppercase tracking-wide text-skill-speaking">
					Kết quả · {SPEAKING_LEVEL_LABELS[exercise.level]}
				</p>
				<h1 className="mt-1 text-2xl font-bold">{exercise.title}</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Nộp lúc {formatTime(stored.submittedAt)}
				</p>
			</header>

			<AiGradingCard result={aiResult} />

			<QuickFeedback stored={stored} />

			<SentenceReview exercise={exercise} stored={stored} />

			<div aria-hidden className="h-24" />
			<footer
				data-session-footer
				className="fixed right-0 bottom-0 left-[var(--dock-left)] z-20 flex flex-wrap items-center justify-between gap-3 border-t bg-background px-6 py-4"
			>
				<Button
					type="button"
					variant="outline"
					onClick={() =>
						navigate({ to: "/luyen-tap/ky-nang/noi/$exerciseId", params: { exerciseId } })
					}
				>
					<RotateCcw className="size-4" />
					Luyện lại
				</Button>
				<Button asChild>
					<Link to="/luyen-tap/ky-nang" search={{ skill: "noi", category: "", page: 1 }}>
						Về danh sách đề nói
					</Link>
				</Button>
			</footer>
		</div>
	)
}

// ─── Quick feedback (rule-based) ───────────────────────────────────

function QuickFeedback({ stored }: { stored: StoredSpeakingResult }) {
	const pct = Math.round((stored.sentencesDone / stored.sentencesTotal) * 100)
	const stars = pct >= 100 ? 5 : pct >= 80 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : 1

	return (
		<div className="rounded-2xl border bg-card p-5 shadow-sm">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">Đánh giá nhanh</h3>
				<div className="flex items-center gap-0.5">
					{Array.from({ length: 5 }).map((_, i) => (
						<Star
							key={i}
							className={cn(
								"size-5",
								i < stars ? "fill-warning text-warning" : "text-muted-foreground/40",
							)}
						/>
					))}
				</div>
			</div>
			<ul className="mt-4 space-y-2 text-sm">
				<CheckRow
					ok={stored.sentencesDone === stored.sentencesTotal}
					label={`Hoàn thành ${stored.sentencesDone}/${stored.sentencesTotal} câu (${pct}%)`}
				/>
				<CheckRow
					ok={pct >= 80}
					label={pct >= 80 ? "Tỉ lệ hoàn thành tốt (≥80%)" : "Tỉ lệ hoàn thành chưa đạt (<80%)"}
				/>
				<CheckRow
					ok={stored.sentencesDone === stored.sentencesTotal}
					label={
						stored.sentencesDone === stored.sentencesTotal
							? "Đã luyện tất cả các câu"
							: `Còn ${stored.sentencesTotal - stored.sentencesDone} câu chưa ghi âm`
					}
				/>
			</ul>
		</div>
	)
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
	return (
		<li className="flex items-start gap-2">
			{ok ? (
				<Check className="mt-0.5 size-4 shrink-0 text-success" />
			) : (
				<X className="mt-0.5 size-4 shrink-0 text-destructive" />
			)}
			<span className={cn("text-foreground/90", !ok && "text-muted-foreground")}>{label}</span>
		</li>
	)
}

// ─── Sentence review ───────────────────────────────────────────────

function SentenceReview({
	exercise,
	stored,
}: {
	exercise: SpeakingExercise
	stored: StoredSpeakingResult
}) {
	return (
		<div className="rounded-2xl border bg-card p-5 shadow-sm">
			<h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Chi tiết từng câu
			</h3>
			<div className="space-y-3">
				{exercise.sentences.map((s, i) => {
					const done = i < stored.sentencesDone
					return (
						<div
							key={s.id}
							className={cn(
								"flex items-start gap-3 rounded-xl p-3",
								done ? "bg-success/5" : "bg-muted/50",
							)}
						>
							<div
								className={cn(
									"flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
									done ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
								)}
							>
								{done ? <Mic className="size-3.5" /> : i + 1}
							</div>
							<div className="min-w-0 flex-1">
								<p className={cn("text-sm font-medium", !done && "text-muted-foreground")}>
									{s.text}
								</p>
								{s.translation && (
									<p className="mt-0.5 text-xs italic text-muted-foreground">{s.translation}</p>
								)}
							</div>
							<span
								className={cn(
									"shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
									done ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
								)}
							>
								{done ? "Đã ghi" : "Chưa ghi"}
							</span>
						</div>
					)
				})}
			</div>
		</div>
	)
}

// ─── Shared ────────────────────────────────────────────────────────

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
			<Skeleton className="h-32 rounded-2xl" />
		</div>
	)
}

function formatTime(ts: number): string {
	const d = new Date(ts)
	return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
}
