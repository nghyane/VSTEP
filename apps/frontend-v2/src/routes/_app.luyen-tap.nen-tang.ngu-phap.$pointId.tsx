import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, BookOpen, Target } from "lucide-react"
import { Suspense } from "react"
import { Skeleton } from "#/components/ui/skeleton"
import { CATEGORY_LABELS } from "#/lib/mock/grammar"
import { grammarPointQueryOptions } from "#/lib/queries/grammar"
import { cn } from "#/lib/utils"
import { PracticeSession } from "./_app.luyen-tap.nen-tang.ngu-phap.$pointId.-components/PracticeSession"
import { TheoryView } from "./_app.luyen-tap.nen-tang.ngu-phap.$pointId.-components/TheoryView"

type Tab = "theory" | "practice"

interface Search {
	tab: Tab
}

export const Route = createFileRoute("/_app/luyen-tap/nen-tang/ngu-phap/$pointId")({
	validateSearch: (search: Record<string, unknown>): Search => ({
		tab: search.tab === "practice" ? "practice" : "theory",
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
			</header>

			<TabBar active={tab} pointId={pointId} />

			{tab === "theory" ? <TheoryView point={point} /> : <PracticeSession point={point} />}
		</div>
	)
}

function TabBar({ active, pointId }: { active: Tab; pointId: string }) {
	return (
		<div className="flex gap-1 rounded-xl bg-muted p-1">
			<TabLink tab="theory" active={active} pointId={pointId} icon={BookOpen} label="Lý thuyết" />
			<TabLink tab="practice" active={active} pointId={pointId} icon={Target} label="Luyện tập" />
		</div>
	)
}

function TabLink({
	tab,
	active,
	pointId,
	icon: Icon,
	label,
}: {
	tab: Tab
	active: Tab
	pointId: string
	icon: typeof BookOpen
	label: string
}) {
	const isActive = active === tab
	return (
		<Link
			to="/luyen-tap/nen-tang/ngu-phap/$pointId"
			params={{ pointId }}
			search={{ tab }}
			className={cn(
				"flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
				isActive
					? "bg-card text-foreground shadow-sm"
					: "text-muted-foreground hover:text-foreground",
			)}
		>
			<Icon className="size-4" />
			{label}
		</Link>
	)
}

function DetailSkeleton() {
	return (
		<div className="mt-4 space-y-6">
			<div className="space-y-3">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-10 w-2/3" />
				<Skeleton className="h-4 w-3/4" />
			</div>
			<Skeleton className="h-12 rounded-xl" />
			<div className="space-y-4">
				<Skeleton className="h-32 rounded-2xl" />
				<Skeleton className="h-40 rounded-2xl" />
			</div>
		</div>
	)
}
