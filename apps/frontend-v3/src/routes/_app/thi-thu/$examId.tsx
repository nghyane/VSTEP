import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Suspense, useState } from "react"
import { Icon } from "#/components/Icon"
import { Loading } from "#/components/Loading"
import { BottomActionBar } from "#/features/exam/components/BottomActionBar"
import { ExamDetailHeader } from "#/features/exam/components/ExamDetailHeader"
import { SectionSelector } from "#/features/exam/components/SectionSelector"
import { examDetailQuery } from "#/features/exam/queries"
import type { ExamDetail, SkillKey } from "#/features/exam/types"

export const Route = createFileRoute("/_app/thi-thu/$examId")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(examDetailQuery(params.examId)),
	component: ExamDetailPage,
})

function ExamDetailPage() {
	const { examId } = Route.useParams()
	const [selected, setSelected] = useState<Set<string>>(new Set())

	function handleToggleSection(id: string) {
		setSelected((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	function handleToggleSkill(sectionIds: string[]) {
		setSelected((prev) => {
			const next = new Set(prev)
			const allSelected = sectionIds.every((id) => next.has(id))
			if (allSelected) {
				for (const id of sectionIds) next.delete(id)
			} else {
				for (const id of sectionIds) next.add(id)
			}
			return next
		})
	}

	return (
		<div className="mx-auto w-full max-w-5xl px-6 pb-36 pt-4 space-y-6">
			<Link
				to="/thi-thu"
				className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
			>
				<Icon name="back" size="xs" />
				Thư viện đề thi
			</Link>

			<Suspense fallback={<Loading />}>
				<ExamDetailContent
					examId={examId}
					selected={selected}
					onToggleSection={handleToggleSection}
					onToggleSkill={handleToggleSkill}
				/>
			</Suspense>
		</div>
	)
}

interface ContentProps {
	examId: string
	selected: Set<string>
	onToggleSection: (id: string) => void
	onToggleSkill: (sectionIds: string[]) => void
}

function ExamDetailContent({ examId, selected, onToggleSection, onToggleSkill }: ContentProps) {
	const { data } = useSuspenseQuery(examDetailQuery(examId))
	const detail = data.data

	const selectedSkills = deriveSelectedSkills(detail, selected)

	return (
		<>
			<div className="space-y-6">
				<ExamDetailHeader detail={detail} />
				<SectionSelector
					detail={detail}
					selected={selected}
					onToggleSection={onToggleSection}
					onToggleSkill={onToggleSkill}
				/>
			</div>
			<BottomActionBar detail={detail} selected={selectedSkills} />
		</>
	)
}

function deriveSelectedSkills(detail: ExamDetail, selected: Set<string>): Set<SkillKey> {
	const { version } = detail
	const skills = new Set<SkillKey>()
	if (version.listening_sections.some((s) => selected.has(s.id))) skills.add("listening")
	if (version.reading_passages.some((s) => selected.has(s.id))) skills.add("reading")
	if (version.writing_tasks.some((s) => selected.has(s.id))) skills.add("writing")
	if (version.speaking_parts.some((s) => selected.has(s.id))) skills.add("speaking")
	return skills
}
