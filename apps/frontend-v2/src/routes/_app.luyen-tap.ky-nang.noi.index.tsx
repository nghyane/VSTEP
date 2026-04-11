import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Clock, FileText, Mic } from "lucide-react"
import { Suspense } from "react"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "#/components/ui/accordion"
import { Skeleton } from "#/components/ui/skeleton"
import { SPEAKING_PART_LABELS, type SpeakingExercise, type SpeakingPart } from "#/lib/mock/speaking"
import { speakingListQueryOptions } from "#/lib/queries/speaking"

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/noi/")({
	loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(speakingListQueryOptions()),
	component: SpeakingListPage,
})

function SpeakingListPage() {
	return (
		<div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
			<Link
				to="/luyen-tap/ky-nang"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />4 kỹ năng
			</Link>
			<Suspense fallback={<ListSkeleton />}>
				<PartAccordion />
			</Suspense>
		</div>
	)
}

function PartAccordion() {
	const { data: exercises } = useSuspenseQuery(speakingListQueryOptions())
	const grouped = groupByPart(exercises)
	const parts: SpeakingPart[] = [1, 2, 3]

	return (
		<div className="space-y-5">
			<PageHeader count={exercises.length} />
			<Accordion type="multiple" defaultValue={["part-1"]} className="space-y-3">
				{parts.map((part) => {
					const list = grouped.get(part) ?? []
					if (list.length === 0) return null
					return <PartSection key={part} part={part} exercises={list} />
				})}
			</Accordion>
		</div>
	)
}

function PageHeader({ count }: { count: number }) {
	return (
		<div className="flex items-center gap-3">
			<Mic className="size-7 text-skill-speaking" />
			<div>
				<h1 className="text-xl font-bold">Nói</h1>
				<p className="text-sm text-muted-foreground">{count} bài luyện tập</p>
			</div>
		</div>
	)
}

function PartSection({
	part,
	exercises,
}: {
	part: SpeakingPart
	exercises: readonly SpeakingExercise[]
}) {
	return (
		<AccordionItem value={`part-${part}`} className="rounded-2xl bg-muted/40 shadow-sm">
			<AccordionTrigger className="px-5 py-4 hover:no-underline">
				<div className="flex w-full items-center justify-between gap-3 pr-2">
					<span className="text-base font-semibold">{SPEAKING_PART_LABELS[part]}</span>
					<span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
						{exercises.length} bài
					</span>
				</div>
			</AccordionTrigger>
			<AccordionContent className="px-2 pb-2">
				<ul className="flex flex-col gap-1">
					{exercises.map((exercise) => (
						<li key={exercise.id}>
							<ExerciseRow exercise={exercise} />
						</li>
					))}
				</ul>
			</AccordionContent>
		</AccordionItem>
	)
}

function ExerciseRow({ exercise }: { exercise: SpeakingExercise }) {
	return (
		<Link
			to="/luyen-tap/ky-nang/noi/$exerciseId"
			params={{ exerciseId: exercise.id }}
			className="group flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-muted/60"
		>
			<FileText className="size-5 shrink-0 text-skill-speaking" />
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-semibold group-hover:text-foreground">
					{exercise.title}
				</p>
				<p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{exercise.description}</p>
			</div>
			<div className="hidden shrink-0 items-center gap-3 text-xs text-muted-foreground sm:flex">
				<span>
					{exercise.prepSeconds}s chuẩn bị · {exercise.speakSeconds}s nói
				</span>
				<span className="inline-flex items-center gap-1">
					<Clock className="size-3.5" />
					{exercise.estimatedMinutes} phút
				</span>
			</div>
		</Link>
	)
}

function groupByPart(
	exercises: readonly SpeakingExercise[],
): Map<SpeakingPart, SpeakingExercise[]> {
	const map = new Map<SpeakingPart, SpeakingExercise[]>()
	for (const ex of exercises) {
		const list = map.get(ex.part) ?? []
		list.push(ex)
		map.set(ex.part, list)
	}
	return map
}

function ListSkeleton() {
	return (
		<div className="space-y-5">
			<Skeleton className="h-10 w-48" />
			<div className="space-y-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-16 rounded-xl" />
				))}
			</div>
		</div>
	)
}
