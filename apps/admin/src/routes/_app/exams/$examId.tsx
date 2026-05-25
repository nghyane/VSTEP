import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Flex, Skeleton } from "antd"
import { adminExamDetailQuery, adminExamVersionsQuery } from "#/features/admin-exams/queries"
import { ExamDetailHeader } from "./-exams/ExamDetailHeader"
import { VersionContentTabs } from "./-exams/VersionContentTabs"
import { VersionSelector } from "./-exams/VersionSelector"

interface Search {
	tab?: "listening" | "reading" | "writing" | "speaking"
	version?: string
}

export const Route = createFileRoute("/_app/exams/$examId")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		tab: ["listening", "reading", "writing", "speaking"].includes(s.tab as string)
			? (s.tab as Search["tab"])
			: undefined,
		version: typeof s.version === "string" ? s.version : undefined,
	}),
	component: ExamDetailPage,
})

function ExamDetailPage() {
	const { examId } = Route.useParams()
	const search = Route.useSearch()

	const { data: examData, isLoading: examLoading } = useQuery(adminExamDetailQuery(examId))
	const { data: versionsData, isLoading: versionsLoading } = useQuery(adminExamVersionsQuery(examId))

	if (examLoading || versionsLoading) {
		return <Skeleton active paragraph={{ rows: 6 }} />
	}

	const exam = examData?.data
	const versions = versionsData?.data ?? []
	if (!exam) return null

	const selectedVersionId = search.version ?? exam.active_version?.id ?? versions[0]?.id

	return (
		<Flex vertical gap={24}>
			<ExamDetailHeader exam={exam} />
			<VersionSelector examId={examId} versions={versions} selectedId={selectedVersionId} />
			{selectedVersionId && (
				<VersionContentTabs examId={examId} versionId={selectedVersionId} tab={search.tab ?? "listening"} />
			)}
		</Flex>
	)
}
