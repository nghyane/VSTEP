import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { computeCommitment } from "#/features/course/lib/commitment"
import { useExamCompletions } from "#/features/course/lib/completion-log"
import { useEnrollments } from "#/features/course/lib/enrollment-store"
import { courseDetailQueryOptions } from "#/features/course/lib/queries"
import { isCourseEnded, isCourseFull } from "#/mocks/courses"
import { CommitmentCard } from "./_app.khoa-hoc/-components/CommitmentCard"
import { CourseSchedule } from "./_app.khoa-hoc/-components/CourseSchedule"
import {
	DescriptionCard,
	GuaranteeCard,
	HeroPanel,
	InstructorCard,
} from "./_app.khoa-hoc.-components/CourseDetailPanels"

export const Route = createFileRoute("/_app/khoa-hoc/$courseId")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(courseDetailQueryOptions(params.courseId)),
	component: CourseDetailPage,
})

function CourseDetailPage() {
	const { courseId } = Route.useParams()
	const { data: course } = useSuspenseQuery(courseDetailQueryOptions(courseId))
	const enrollments = useEnrollments()
	const enrollment = enrollments.find((e) => e.courseId === courseId)
	const enrolled = enrollment !== undefined
	const ended = isCourseEnded(course)
	const full = isCourseFull(course)

	useExamCompletions()
	const commitment = enrollment ? computeCommitment(course, enrollment) : null
	const violated = commitment?.phase === "violated"

	return (
		<div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
			<Link
				to="/khoa-hoc"
				search={{ tab: enrolled ? "mine" : "explore" }}
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Khóa học
			</Link>

			<HeroPanel
				course={course}
				enrolled={enrolled}
				ended={ended}
				full={full}
				violated={violated}
			/>

			{enrollment && commitment && (
				<CommitmentCard course={course} enrollment={enrollment} status={commitment} />
			)}

			<DescriptionCard course={course} />
			<InstructorCard course={course} />
			<CourseSchedule course={course} />
			<GuaranteeCard />
		</div>
	)
}
