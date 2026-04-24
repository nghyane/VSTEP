import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Suspense, useState } from "react"
import { Icon } from "#/components/Icon"
import { Loading } from "#/components/Loading"
import { BottomActionBar } from "#/features/exam/components/BottomActionBar"
import { ExamDetailHeader } from "#/features/exam/components/ExamDetailHeader"
import { ResumeExamBanner } from "#/features/exam/components/ResumeExamBanner"
import { SectionSelector } from "#/features/exam/components/SectionSelector"
import { examDetailQuery } from "#/features/exam/queries"
import type { SkillKey } from "#/features/exam/types"

export const Route = createFileRoute("/_app/thi-thu/$examId")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(examDetailQuery(params.examId)),
	component: ExamDetailPage,
})

function ExamDetailPage() {
	const { examId } = Route.useParams()
	const [selected, setSelected] = useState<Set<SkillKey>>(new Set())

	function handleToggleSkill(skill: SkillKey) {
		setSelected((prev) => {
			const next = new Set(prev)
			if (next.has(skill)) next.delete(skill)
			else next.add(skill)
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

			<ResumeExamBanner hideWhenExamId={examId} />

			<Suspense fallback={<Loading />}>
				<ExamDetailContent examId={examId} selected={selected} onToggleSkill={handleToggleSkill} />
			</Suspense>
		</div>
	)
}

interface ContentProps {
	examId: string
	selected: Set<SkillKey>
	onToggleSkill: (skill: SkillKey) => void
}

function ExamDetailContent({ examId, selected, onToggleSkill }: ContentProps) {
	const { data } = useSuspenseQuery(examDetailQuery(examId))
	const detail = data.data

	return (
		<>
			<div className="space-y-6">
				<ExamDetailHeader detail={detail} />
				<SectionSelector detail={detail} selected={selected} onToggleSkill={onToggleSkill} />
			</div>
			<BottomActionBar detail={detail} selected={selected} />
		</>
	)
}
