import { ArrowLeftOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Skeleton as AntSkeleton, Flex, Space, Tag } from "antd"
import { Card } from "#/components/Card"
import { PageHeader } from "#/components/PageHeader"
import { Switch } from "#/components/Switch"
import { showError, showSuccess } from "#/components/Toaster"
import { SpeakingTaskForm } from "#/features/admin-practice/SpeakingTaskForm"
import {
	speakingTaskDetailQuery,
	useSetSpeakingTaskPublished,
	useUpdateSpeakingTask,
} from "#/features/admin-practice/speaking-task"
import { extractError } from "#/lib/api"

export const Route = createFileRoute("/_app/practice/speaking-tasks/$taskId")({
	component: SpeakingTaskDetailPage,
})

function SpeakingTaskDetailPage() {
	const { taskId } = Route.useParams()
	const navigate = useNavigate({ from: "/practice/speaking-tasks/$taskId" })

	const { data, isLoading } = useQuery(speakingTaskDetailQuery(taskId))
	const update = useUpdateSpeakingTask(taskId)
	const setPub = useSetSpeakingTaskPublished()

	if (isLoading || !data) {
		return (
			<Flex vertical gap={16}>
				<AntSkeleton active />
			</Flex>
		)
	}

	const task = data.data

	async function togglePub(): Promise<void> {
		try {
			await setPub.mutateAsync({ id: task.id, published: !task.is_published })
			showSuccess(task.is_published ? "Đã ẩn xuất bản." : "Đã xuất bản.")
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	return (
		<Flex vertical gap={24}>
			<div>
				<Link
					to="/practice/speaking-tasks"
					style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}
				>
					<ArrowLeftOutlined /> Danh sách
				</Link>
				<PageHeader
					title={task.title}
					subtitle={`Part ${task.part} · ${task.task_type}`}
					action={
						<Switch
							checked={task.is_published}
							onChange={togglePub}
							label={task.is_published ? "Xuất bản" : "Nháp"}
							disabled={setPub.isPending}
						/>
					}
				/>
				<Space size={4} wrap style={{ marginTop: 8 }}>
					<Tag>Part {task.part}</Tag>
					<Tag color="blue">{task.task_type}</Tag>
					<Tag color="blue">{task.estimated_minutes} phút</Tag>
					<Tag color="blue">{task.speaking_seconds}s nói</Tag>
				</Space>
			</div>

			<Card title="Cập nhật bài nói">
				<SpeakingTaskForm
					initial={task}
					submitting={update.isPending}
					onCancel={() => navigate({ to: "/practice/speaking-tasks" })}
					onSubmit={async (input) => {
						await update.mutateAsync(input)
						showSuccess("Đã lưu thay đổi.")
					}}
				/>
			</Card>
		</Flex>
	)
}
