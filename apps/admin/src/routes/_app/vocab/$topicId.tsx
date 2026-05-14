import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useState } from "react"
import { Badge } from "#/components/Badge"
import { Card } from "#/components/Card"
import { PageHeader } from "#/components/PageHeader"
import { Skeleton } from "#/components/Skeleton"
import { Switch } from "#/components/Switch"
import { Tabs } from "#/components/Tabs"
import { showError, showSuccess } from "#/components/Toaster"
import { ExercisesTab } from "#/features/admin-vocab/ExercisesTab"
import { useSetTopicPublished, useUpdateTopic } from "#/features/admin-vocab/mutations"
import { adminVocabTopicDetailQuery } from "#/features/admin-vocab/queries"
import { TopicForm } from "#/features/admin-vocab/TopicForm"
import { WordsTab } from "#/features/admin-vocab/WordsTab"
import { extractError } from "#/lib/api"

interface Search {
	tab?: "info" | "words" | "exercises"
}

export const Route = createFileRoute("/_app/vocab/$topicId")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		tab: s.tab === "info" || s.tab === "words" || s.tab === "exercises" ? s.tab : undefined,
	}),
	component: TopicDetailPage,
})

function TopicDetailPage() {
	const { topicId } = Route.useParams()
	const search = Route.useSearch()
	const tab = search.tab ?? "info"
	const navigate = useNavigate({ from: "/vocab/$topicId" })

	const { data, isLoading } = useQuery(adminVocabTopicDetailQuery(topicId))
	const update = useUpdateTopic(topicId)
	const setPub = useSetTopicPublished()
	const [savingMsg, setSavingMsg] = useState<string | null>(null)

	if (isLoading || !data) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-12 w-64" />
				<Skeleton className="h-64 w-full" />
			</div>
		)
	}

	const { topic, words, exercises } = data.data

	async function togglePub(): Promise<void> {
		try {
			await setPub.mutateAsync({ id: topic.id, published: !topic.is_published })
			showSuccess(topic.is_published ? "Đã ẩn xuất bản." : "Đã xuất bản.")
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<Link
					to="/vocab"
					className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" /> Danh sách
				</Link>
				<PageHeader
					title={topic.name}
					subtitle={topic.description ?? "—"}
					action={
						<div className="flex items-center gap-3">
							<Switch
								checked={topic.is_published}
								onChange={togglePub}
								label={topic.is_published ? "Xuất bản" : "Nháp"}
								disabled={setPub.isPending}
							/>
						</div>
					}
				/>
				<div className="mt-2 flex flex-wrap gap-1">
					<Badge>{topic.level}</Badge>
					{topic.tasks.map((t) => (
						<Badge key={t} variant="info">
							{t}
						</Badge>
					))}
				</div>
			</div>

			<Tabs
				tabs={[
					{ label: "Thông tin", value: "info" },
					{ label: `Từ (${words.length})`, value: "words" },
					{ label: `Bài tập (${exercises.length})`, value: "exercises" },
				]}
				active={tab}
				onChange={(v) => navigate({ search: { tab: v as Search["tab"] } })}
			/>

			{tab === "info" && (
				<Card title="Cập nhật thông tin chủ đề">
					<TopicForm
						initial={topic}
						submitting={update.isPending}
						onCancel={() => navigate({ to: "/vocab" })}
						onSubmit={async (input) => {
							await update.mutateAsync(input)
							setSavingMsg("Đã lưu thay đổi.")
							showSuccess("Đã lưu thay đổi.")
						}}
					/>
					{savingMsg && <p className="mt-2 text-xs text-success">{savingMsg}</p>}
				</Card>
			)}

			{tab === "words" && <WordsTab topicId={topicId} words={words} />}

			{tab === "exercises" && <ExercisesTab topicId={topicId} exercises={exercises} />}
		</div>
	)
}
