import { ArrowLeftOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Flex, Skeleton, Space, Tag, Typography } from "antd"
import { useState } from "react"
import { Card } from "#/components/Card"
import { PageHeader } from "#/components/PageHeader"
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
			<Flex vertical gap={16}>
				<Skeleton active paragraph={{ rows: 1 }} />
				<Skeleton active paragraph={{ rows: 6 }} />
			</Flex>
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
		<Flex vertical gap={24}>
			<div>
				<Link to="/vocab" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
					<Typography.Text type="secondary" style={{ fontSize: 12 }}>
						<ArrowLeftOutlined /> Danh sách
					</Typography.Text>
				</Link>
				<PageHeader
					title={topic.name}
					subtitle={topic.description ?? "—"}
					action={
						<Switch
							checked={topic.is_published}
							onChange={togglePub}
							label={topic.is_published ? "Xuất bản" : "Nháp"}
							disabled={setPub.isPending}
						/>
					}
				/>
				<Space size={4} wrap style={{ marginTop: 8 }}>
					<Tag>{topic.level}</Tag>
					{topic.tasks.map((t) => (
						<Tag key={t} color="blue">
							{t}
						</Tag>
					))}
				</Space>
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
					{savingMsg && (
						<Typography.Text type="success" style={{ fontSize: 12, marginTop: 8, display: "block" }}>
							{savingMsg}
						</Typography.Text>
					)}
				</Card>
			)}

			{tab === "words" && <WordsTab topicId={topicId} words={words} />}

			{tab === "exercises" && <ExercisesTab topicId={topicId} exercises={exercises} />}
		</Flex>
	)
}
