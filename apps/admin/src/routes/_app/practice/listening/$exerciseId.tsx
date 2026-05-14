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
import { ListeningForm } from "#/features/admin-practice/ListeningForm"
import {
	listeningDetailQuery,
	useCreateListeningQuestion,
	useDeleteListeningQuestion,
	useSetListeningPublished,
	useUpdateListening,
	useUpdateListeningQuestion,
} from "#/features/admin-practice/listening"
import { McqQuestionsTab } from "#/features/admin-practice/McqQuestionsTab"
import { extractError } from "#/lib/api"

interface Search {
	tab?: "info" | "questions"
}

export const Route = createFileRoute("/_app/practice/listening/$exerciseId")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		tab: s.tab === "info" || s.tab === "questions" ? s.tab : undefined,
	}),
	component: ListeningDetailPage,
})

function ListeningDetailPage() {
	const { exerciseId } = Route.useParams()
	const search = Route.useSearch()
	const tab = search.tab ?? "info"
	const navigate = useNavigate({ from: "/practice/listening/$exerciseId" })

	const { data, isLoading } = useQuery(listeningDetailQuery(exerciseId))
	const update = useUpdateListening(exerciseId)
	const setPub = useSetListeningPublished()
	const createQ = useCreateListeningQuestion(exerciseId)
	const updateQ = useUpdateListeningQuestion(exerciseId)
	const removeQ = useDeleteListeningQuestion(exerciseId)

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
					to="/practice/listening"
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
				<Card title="Cập nhật bài nghe">
					<ListeningForm
						initial={exercise}
						submitting={update.isPending}
						onCancel={() => navigate({ to: "/practice/listening" })}
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
