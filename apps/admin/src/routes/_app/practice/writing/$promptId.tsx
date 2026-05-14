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
import { WritingMarkersTab } from "#/features/admin-practice/WritingMarkersTab"
import { WritingPromptForm } from "#/features/admin-practice/WritingPromptForm"
import {
	useSetWritingPublished,
	useUpdateWriting,
	writingDetailQuery,
} from "#/features/admin-practice/writing"
import { extractError } from "#/lib/api"

interface Search {
	tab?: "info" | "markers"
}

export const Route = createFileRoute("/_app/practice/writing/$promptId")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		tab: s.tab === "info" || s.tab === "markers" ? s.tab : undefined,
	}),
	component: WritingDetailPage,
})

function WritingDetailPage() {
	const { promptId } = Route.useParams()
	const search = Route.useSearch()
	const tab = search.tab ?? "info"
	const navigate = useNavigate({ from: "/practice/writing/$promptId" })

	const { data, isLoading } = useQuery(writingDetailQuery(promptId))
	const update = useUpdateWriting(promptId)
	const setPub = useSetWritingPublished()

	if (isLoading || !data) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-12 w-64" />
				<Skeleton className="h-64 w-full" />
			</div>
		)
	}

	const { prompt, markers } = data.data

	async function togglePub(): Promise<void> {
		try {
			await setPub.mutateAsync({ id: prompt.id, published: !prompt.is_published })
			showSuccess(prompt.is_published ? "Đã ẩn xuất bản." : "Đã xuất bản.")
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<Link
					to="/practice/writing"
					className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" /> Danh sách
				</Link>
				<PageHeader
					title={prompt.title}
					subtitle={prompt.description ?? "—"}
					action={
						<Switch
							checked={prompt.is_published}
							onChange={togglePub}
							label={prompt.is_published ? "Xuất bản" : "Nháp"}
							disabled={setPub.isPending}
						/>
					}
				/>
				<div className="mt-2 flex flex-wrap gap-1">
					<Badge>Part {prompt.part}</Badge>
					<Badge variant="info">
						{prompt.min_words}–{prompt.max_words} từ
					</Badge>
					<Badge variant="info">{prompt.estimated_minutes} phút</Badge>
				</div>
			</div>

			<Tabs
				tabs={[
					{ label: "Thông tin", value: "info" },
					{ label: `Markers (${markers.length})`, value: "markers" },
				]}
				active={tab}
				onChange={(v) => navigate({ search: { tab: v as Search["tab"] } })}
			/>

			{tab === "info" && (
				<Card title="Cập nhật đề viết">
					<WritingPromptForm
						initial={prompt}
						submitting={update.isPending}
						onCancel={() => navigate({ to: "/practice/writing" })}
						onSubmit={async (input) => {
							await update.mutateAsync(input)
							showSuccess("Đã lưu thay đổi.")
						}}
					/>
				</Card>
			)}

			{tab === "markers" && <WritingMarkersTab promptId={promptId} markers={markers} />}
		</div>
	)
}
