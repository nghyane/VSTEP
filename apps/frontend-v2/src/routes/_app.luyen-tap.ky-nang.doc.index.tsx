import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, BookOpenText, Clock, FileText } from "lucide-react"
import { Suspense } from "react"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "#/components/ui/accordion"
import { Skeleton } from "#/components/ui/skeleton"
import { READING_PART_LABELS, type ReadingExercise, type ReadingPart } from "#/lib/mock/reading"
import { readingListQueryOptions } from "#/lib/queries/reading"

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/doc/")({
	loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(readingListQueryOptions()),
	component: ReadingListPage,
})

function ReadingListPage() {
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
	const { data: exercises } = useSuspenseQuery(readingListQueryOptions())
	const grouped = groupByPart(exercises)
	const parts: ReadingPart[] = [1, 2, 3]

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
			<BookOpenText className="size-7 text-skill-reading" />
			<div>
				<h1 className="text-xl font-bold">Đọc</h1>
				<p className="text-sm text-muted-foreground">{count} bài luyện tập</p>
			</div>
		</div>
	)
}

function PartSection({
	part,
	exercises,
}: {
	part: ReadingPart
	exercises: readonly ReadingExercise[]
}) {
	return (
		<AccordionItem value={`part-${part}`} className="rounded-2xl bg-muted/40 shadow-sm">
			<AccordionTrigger className="px-5 py-4 hover:no-underline">
				<div className="flex w-full items-center justify-between gap-3 pr-2">
					<span className="text-base font-semibold">{READING_PART_LABELS[part]}</span>
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

function ExerciseRow({ exercise }: { exercise: ReadingExercise }) {
	return (
		<Link
			to="/luyen-tap/ky-nang/doc/$exerciseId"
			params={{ exerciseId: exercise.id }}
			className="group flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-muted/60"
		>
			<FileText className="size-5 shrink-0 text-skill-reading" />
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-semibold group-hover:text-foreground">
					{exercise.title}
				</p>
				<p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{exercise.description}</p>
			</div>
			<div className="hidden shrink-0 items-center gap-3 text-xs text-muted-foreground sm:flex">
				<span>{exercise.items.length} câu</span>
				<span className="inline-flex items-center gap-1">
					<Clock className="size-3.5" />
					{exercise.estimatedMinutes} phút
				</span>
			</div>
		</Link>
	)
}

function groupByPart(exercises: readonly ReadingExercise[]): Map<ReadingPart, ReadingExercise[]> {
	const map = new Map<ReadingPart, ReadingExercise[]>()
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
