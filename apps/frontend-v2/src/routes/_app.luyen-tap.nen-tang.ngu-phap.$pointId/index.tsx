import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, BookOpen, Lightbulb, Target } from "lucide-react"
import { Suspense } from "react"
import { accuracyPercent, computeLevel, getMastery } from "#/lib/grammar/mastery"
import { grammarPointQueryOptions } from "#/lib/queries/grammar"
import { CATEGORY_LABELS, type GrammarPoint, LEVEL_LABELS, TASK_LABELS } from "#/mocks/grammar"
import { cn } from "#/shared/lib/utils"
import { Skeleton } from "#/shared/ui/skeleton"
import { PracticeSession } from "./-components/PracticeSession"
import { TheoryView } from "./-components/TheoryView"

type Tab = "theory" | "practice" | "vstep-tips"

interface Search {
	tab: Tab
}

export const Route = createFileRoute("/_app/luyen-tap/nen-tang/ngu-phap/$pointId/")({
	validateSearch: (search: Record<string, unknown>): Search => ({
		tab:
			search.tab === "practice"
				? "practice"
				: search.tab === "vstep-tips"
					? "vstep-tips"
					: "theory",
	}),
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(grammarPointQueryOptions(params.pointId)),
	component: GrammarPointPage,
})

function GrammarPointPage() {
	const { pointId } = Route.useParams()
	return (
		<div className="mx-auto w-full max-w-3xl">
			<Link
				to="/luyen-tap/nen-tang/ngu-phap"
				search={{ view: "level" }}
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Danh sách ngữ pháp
			</Link>
			<Suspense fallback={<DetailSkeleton />}>
				<GrammarPointContent pointId={pointId} />
			</Suspense>
		</div>
	)
}

function GrammarPointContent({ pointId }: { pointId: string }) {
	const { data: point } = useSuspenseQuery(grammarPointQueryOptions(pointId))
	const { tab } = Route.useSearch()

	return (
		<div className="mt-4 space-y-6">
			<header>
				<p className="text-xs font-semibold uppercase tracking-wide text-primary">
					{CATEGORY_LABELS[point.category]}
				</p>
				<h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">{point.name}</h1>
				<p className="mt-1 text-sm text-muted-foreground md:text-base">{point.vietnameseName}</p>
				<p className="mt-3 text-sm text-foreground/80">{point.summary}</p>
				<PointMeta point={point} />
			</header>

			<div className="flex gap-1 rounded-xl bg-muted p-1">
				{(
					[
						{ key: "theory" as Tab, icon: BookOpen, label: "Lý thuyết" },
						{ key: "practice" as Tab, icon: Target, label: "Luyện tập" },
						{ key: "vstep-tips" as Tab, icon: Lightbulb, label: "Mẹo thi" },
					] as const
				).map(({ key, icon: Icon, label }) => (
					<Link
						key={key}
						to="/luyen-tap/nen-tang/ngu-phap/$pointId"
						params={{ pointId }}
						search={{ tab: key }}
						className={cn(
							"flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
							tab === key
								? "bg-card text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<Icon className="size-4" />
						{label}
					</Link>
				))}
			</div>

			{tab === "theory" && <TheoryView point={point} />}
			{tab === "practice" && <PracticeSession key={pointId} point={point} />}
			{tab === "vstep-tips" && <VstepTipsView point={point} />}
		</div>
	)
}

function PointMeta({ point }: { point: GrammarPoint }) {
	const mastery = getMastery(point.id)
	const level = computeLevel(mastery)
	const accuracy = accuracyPercent(mastery)
	return (
		<div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
			<div className="flex items-center gap-1.5">
				{point.levels.map((lv) => (
					<span
						key={lv}
						className="rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground"
					>
						{LEVEL_LABELS[lv]}
					</span>
				))}
			</div>
			<div className="flex items-center gap-1.5">
				{point.tasks.map((task) => (
					<span
						key={task}
						className="rounded-full border border-primary/30 px-2.5 py-0.5 text-xs font-medium text-primary"
					>
						{TASK_LABELS[task]}
					</span>
				))}
			</div>
			{mastery.attempts > 0 && (
				<span className="text-xs tabular-nums text-muted-foreground">
					{level === "mastered"
						? "✓ Đã thuộc"
						: `${mastery.correct}/${mastery.attempts} đúng · ${accuracy}%`}
				</span>
			)}
		</div>
	)
}

function VstepTipsView({ point }: { point: GrammarPoint }) {
	if (point.vstepTips.length === 0) {
		return <p className="text-sm text-muted-foreground">Chưa có mẹo thi cho điểm ngữ pháp này.</p>
	}
	return (
		<div className="space-y-4">
			{point.vstepTips.map((tip) => (
				<div key={`${tip.task}-${tip.tip}`} className="rounded-2xl border bg-card p-5 shadow-sm">
					<span className="rounded-full border border-primary/30 px-2.5 py-0.5 text-xs font-semibold text-primary">
						{TASK_LABELS[tip.task]}
					</span>
					<p className="mt-3 text-sm text-foreground/90">{tip.tip}</p>
					<div className="mt-3 border-l-2 border-primary/40 pl-4">
						<p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Ví dụ
						</p>
						<p className="text-sm text-foreground">{tip.example}</p>
					</div>
				</div>
			))}
		</div>
	)
}

function DetailSkeleton() {
	return (
		<div className="mt-4 space-y-6">
			<div className="space-y-3">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-10 w-2/3" />
				<Skeleton className="h-4 w-3/4" />
				<Skeleton className="h-6 w-1/2" />
			</div>
			<Skeleton className="h-12 rounded-xl" />
			<div className="space-y-4">
				<Skeleton className="h-32 rounded-2xl" />
				<Skeleton className="h-40 rounded-2xl" />
			</div>
		</div>
	)
}
