import { ArrowLeftOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Skeleton as AntSkeleton, Flex, Space, Tag } from "antd"
import { Card } from "#/components/Card"
import { PageHeader } from "#/components/PageHeader"
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
			<Flex vertical gap={16}>
				<AntSkeleton active />
			</Flex>
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
		<Flex vertical gap={24}>
			<div>
				<Link
					to="/practice/listening"
					style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}
				>
					<ArrowLeftOutlined /> Danh sách
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
				<Space size={4} wrap style={{ marginTop: 8 }}>
					<Tag>Part {exercise.part}</Tag>
					<Tag color="blue">{exercise.estimated_minutes} phút</Tag>
				</Space>
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
		</Flex>
	)
}
