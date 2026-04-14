import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { Suspense, useState } from "react"
import { Skeleton } from "#/components/ui/skeleton"
import { examDetailQueryOptions } from "#/lib/queries/thi-thu"
import { BottomActionBar } from "./-components/BottomActionBar"
import { ExamDetailHeader } from "./-components/ExamDetailHeader"
import { SectionSelector } from "./-components/SectionSelector"

export const Route = createFileRoute("/_app/thi-thu/$examId/")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(examDetailQueryOptions(Number(params.examId))),
	component: ExamDetailPage,
})

function ExamDetailPage() {
	const { examId } = Route.useParams()
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [customMinutes, setCustomMinutes] = useState<number | null>(null)

	function handleToggleSection(id: string) {
		setSelected((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	function handleToggleSkill(skill: string, sectionIds: string[]) {
		setSelected((prev) => {
			const next = new Set(prev)
			const allSelected = sectionIds.every((id) => next.has(id))
			if (allSelected) sectionIds.forEach((id) => next.delete(id))
			else sectionIds.forEach((id) => next.add(id))
			return next
		})
	}

	return (
		<div className="mx-auto w-full max-w-5xl space-y-6 pb-36 pt-4 sm:pb-24">
			<Link
				to="/thi-thu"
				className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ChevronLeft className="size-4" />
				Thư viện đề thi
			</Link>

			<Suspense fallback={<ExamDetailSkeleton />}>
				<ExamDetailContent
					examId={Number(examId)}
					selected={selected}
					customMinutes={customMinutes}
					onCustomMinutesChange={setCustomMinutes}
					onToggleSection={handleToggleSection}
					onToggleSkill={handleToggleSkill}
				/>
			</Suspense>
		</div>
	)
}

interface ContentProps {
	examId: number
	selected: Set<string>
	customMinutes: number | null
	onCustomMinutesChange: (minutes: number | null) => void
	onToggleSection: (id: string) => void
	onToggleSkill: (skill: string, sectionIds: string[]) => void
}

function ExamDetailContent({
	examId,
	selected,
	customMinutes,
	onCustomMinutesChange,
	onToggleSection,
	onToggleSkill,
}: ContentProps) {
	const { data: exam } = useSuspenseQuery(examDetailQueryOptions(examId))

	return (
		<>
			<div className="space-y-6">
				<ExamDetailHeader exam={exam} />
				<SectionSelector
					sections={exam.sections}
					selected={selected}
					onToggleSection={onToggleSection}
					onToggleSkill={onToggleSkill}
				/>
			</div>
			<BottomActionBar
				sections={exam.sections}
				selected={selected}
				customMinutes={customMinutes}
				onCustomMinutesChange={onCustomMinutesChange}
			/>
		</>
	)
}

function ExamDetailSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-44 rounded-2xl" />
			<Skeleton className="h-96 rounded-2xl" />
		</div>
	)
}
