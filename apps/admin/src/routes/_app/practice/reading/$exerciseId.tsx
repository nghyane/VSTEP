import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Badge } from "#/components/Badge"
import { Card } from "#/components/Card"
import { PageHeader } from "#/components/PageHeader"
import { Skeleton } from "#/components/Skeleton"
import { Switch } from "#/components/Switch"
import { Tabs } from "#/components/Tabs"
import { showError, showSuccess } from "#/components/Toaster"
import { McqQuestionsTab } from "#/features/admin-practice/McqQuestionsTab"
import { ReadingForm } from "#/features/admin-practice/ReadingForm"
import {
	readingDetailQuery,
	useCreateReadingQuestion,
	useDeleteReadingQuestion,
	useSetReadingPublished,
	useUpdateReading,
	useUpdateReadingQuestion,
} from "#/features/admin-practice/reading"
import { extractError } from "#/lib/api"

interface Search {
	tab?: "info" | "questions"
}

export const Route = createFileRoute("/_app/practice/reading/$exerciseId")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		tab: s.tab === "info" || s.tab === "questions" ? s.tab : undefined,
	}),
	component: ReadingDetailPage,
})

function ReadingDetailPage() {
	const { exerciseId } = Route.useParams()
	const search = Route.useSearch()
	const tab = search.tab ?? "info"
	const navigate = useNavigate({ from: "/practice/reading/$exerciseId" })

	const { data, isLoading } = useQuery(readingDetailQuery(exerciseId))
	const update = useUpdateReading(exerciseId)
	const setPub = useSetReadingPublished()
	const createQ = useCreateReadingQuestion(exerciseId)
	const updateQ = useUpdateReadingQuestion(exerciseId)
	const removeQ = useDeleteReadingQuestion(exerciseId)

	if (isLoading || !data) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-12 w-64" />
				<Skeleton className="h-64 w-full" />
			</div>
		)
	}

	const { exercise, questions } = data.data

	async function togglePub(): Promise<void> {
		try {
			await setPub.mutateAsync({ id: exercise.id, published: !exercise.is_published })
			showSuccess(exercise.is_published ? "Đã ẩn xuất bản." : "Đã xuất bản.")
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<Link
					to="/practice/reading"
					className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" /> Danh sách
				</Link>
				<PageHeader
					title={exercise.title}
					subtitle={exercise.description ?? "—"}
					action={
						<Switch
							checked={exercise.is_published}
							onChange={togglePub}
							label={exercise.is_published ? "Xuất bản" : "Nháp"}
							disabled={setPub.isPending}
						/>
					}
				/>
				<div className="mt-2 flex flex-wrap gap-1">
					<Badge>Part {exercise.part}</Badge>
					<Badge variant="info">{exercise.estimated_minutes} phút</Badge>
				</div>
			</div>

			<Tabs
				tabs={[
					{ label: "Thông tin", value: "info" },
					{ label: `Câu hỏi (${questions.length})`, value: "questions" },
				]}
				active={tab}
				onChange={(v) => navigate({ search: { tab: v as Search["tab"] } })}
			/>

			{tab === "info" && (
				<Card title="Cập nhật bài đọc">
					<ReadingForm
						initial={exercise}
						submitting={update.isPending}
						onCancel={() => navigate({ to: "/practice/reading" })}
						onSubmit={async (input) => {
							await update.mutateAsync(input)
							showSuccess("Đã lưu thay đổi.")
						}}
					/>
				</Card>
			)}

			{tab === "questions" && (
				<McqQuestionsTab questions={questions} create={createQ} update={updateQ} remove={removeQ} />
			)}
		</div>
	)
}
