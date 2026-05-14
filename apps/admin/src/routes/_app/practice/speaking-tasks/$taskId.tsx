import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Badge } from "#/components/Badge"
import { Card } from "#/components/Card"
import { PageHeader } from "#/components/PageHeader"
import { Skeleton } from "#/components/Skeleton"
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
			<div className="flex flex-col gap-4">
				<Skeleton className="h-12 w-64" />
				<Skeleton className="h-64 w-full" />
			</div>
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
		<div className="flex flex-col gap-6">
			<div>
				<Link
					to="/practice/speaking-tasks"
					className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" /> Danh sách
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
				<div className="mt-2 flex flex-wrap gap-1">
					<Badge>Part {task.part}</Badge>
					<Badge variant="info">{task.task_type}</Badge>
					<Badge variant="info">{task.estimated_minutes} phút</Badge>
					<Badge variant="info">{task.speaking_seconds}s nói</Badge>
				</div>
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
		</div>
	)
}
