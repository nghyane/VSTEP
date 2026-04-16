import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Check, ChevronDown, RotateCcw, Star, X } from "lucide-react"
import { Suspense, useMemo, useState } from "react"
import { AiGradingCard } from "#/components/practice/AiGradingCard"
import { Button } from "#/components/ui/button"
import { Skeleton } from "#/components/ui/skeleton"
import { buildMockWritingGrading } from "#/lib/practice/mock-ai-grading"
import { loadWritingResult } from "#/lib/practice/result-storage"
import { writingExerciseQueryOptions } from "#/lib/queries/writing"
import { cn } from "#/lib/utils"

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/viet/$exerciseId/ket-qua")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(writingExerciseQueryOptions(params.exerciseId)),
	component: ResultPage,
})

function ResultPage() {
	const { exerciseId } = Route.useParams()
	return (
		<div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
			<Link
				to="/luyen-tap/ky-nang/viet"
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

	if (!stored || !aiResult) {
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

			<RuleFeedback
				wordCount={stored.wordCount}
				wordCountInRange={stored.wordCountInRange}
				keywordsHit={stored.keywordsHit}
				keywordCoveragePct={stored.keywordCoveragePct}
				hasMultipleParagraphs={stored.hasMultipleParagraphs}
				stars={stored.stars}
				minWords={exercise.minWords}
				maxWords={exercise.maxWords}
			/>

			<div className="grid gap-4 lg:grid-cols-2">
				<TextCard title="Bài của bạn" text={stored.userText} />
				<SampleCard sample={exercise.sampleAnswer} />
			</div>

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
					<Link to="/luyen-tap/ky-nang/viet">Về danh sách đề viết</Link>
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

// ─── Rule-based feedback ───────────────────────────────────────────

function RuleFeedback(props: {
	wordCount: number
	wordCountInRange: boolean
	keywordsHit: readonly { keyword: string; hit: boolean }[]
	keywordCoveragePct: number
	hasMultipleParagraphs: boolean
	stars: number
	minWords: number
	maxWords: number
}) {
	const {
		wordCount,
		wordCountInRange,
		keywordsHit,
		keywordCoveragePct,
		hasMultipleParagraphs,
		stars,
		minWords,
		maxWords,
	} = props
	const hitCount = keywordsHit.filter((k) => k.hit).length
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
					ok={wordCountInRange}
					label={`Số từ ${wordCount} — yêu cầu ${minWords}-${maxWords}`}
				/>
				<CheckRow
					ok={keywordCoveragePct >= 60}
					label={`Dùng từ khoá: ${keywordCoveragePct}% (${hitCount}/${keywordsHit.length})`}
				/>
				<CheckRow
					ok={hasMultipleParagraphs}
					label="Có cấu trúc nhiều đoạn (mở bài, thân bài, kết bài)"
				/>
			</ul>
			{keywordsHit.length > 0 && (
				<div className="mt-4 flex flex-wrap gap-1.5">
					{keywordsHit.map((h) => (
						<span
							key={h.keyword}
							className={cn(
								"rounded-full border px-2 py-0.5 text-xs font-medium",
								h.hit
									? "border-success/40 bg-success/10 text-success"
									: "border-border bg-muted text-muted-foreground line-through",
							)}
						>
							{h.keyword}
						</span>
					))}
				</div>
			)}
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

// ─── Text + sample ─────────────────────────────────────────────────

function TextCard({ title, text }: { title: string; text: string }) {
	return (
		<section className="rounded-2xl border bg-card p-5 shadow-sm">
			<h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				{title}
			</h4>
			<p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{text}</p>
		</section>
	)
}

function SampleCard({ sample }: { sample: string }) {
	const [open, setOpen] = useState(false)
	return (
		<section className="rounded-2xl border bg-card p-5 shadow-sm">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				className="flex w-full items-center justify-between text-left"
			>
				<h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
					Bài mẫu {open ? "(đang hiện)" : "(click để xem)"}
				</h4>
				<ChevronDown
					className={cn("size-4 text-primary transition-transform", open && "rotate-180")}
				/>
			</button>
			{open && (
				<p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
					{sample}
				</p>
			)}
		</section>
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
