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
import { SpeakingDrillForm } from "#/features/admin-practice/SpeakingDrillForm"
import { SpeakingDrillSentencesTab } from "#/features/admin-practice/SpeakingDrillSentencesTab"
import {
	speakingDrillDetailQuery,
	useSetSpeakingDrillPublished,
	useUpdateSpeakingDrill,
} from "#/features/admin-practice/speaking-drill"
import { extractError } from "#/lib/api"

interface Search {
	tab?: "info" | "sentences"
}

export const Route = createFileRoute("/_app/practice/speaking-drills/$drillId")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		tab: s.tab === "info" || s.tab === "sentences" ? s.tab : undefined,
	}),
	component: SpeakingDrillDetailPage,
})

function SpeakingDrillDetailPage() {
	const { drillId } = Route.useParams()
	const search = Route.useSearch()
	const tab = search.tab ?? "info"
	const navigate = useNavigate({ from: "/practice/speaking-drills/$drillId" })

	const { data, isLoading } = useQuery(speakingDrillDetailQuery(drillId))
	const update = useUpdateSpeakingDrill(drillId)
	const setPub = useSetSpeakingDrillPublished()

	if (isLoading || !data) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-12 w-64" />
				<Skeleton className="h-64 w-full" />
			</div>
		)
	}

	const { drill, sentences } = data.data

	async function togglePub(): Promise<void> {
		try {
			await setPub.mutateAsync({ id: drill.id, published: !drill.is_published })
			showSuccess(drill.is_published ? "Đã ẩn xuất bản." : "Đã xuất bản.")
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<Link
					to="/practice/speaking-drills"
					className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" /> Danh sách
				</Link>
				<PageHeader
					title={drill.title}
					subtitle={drill.description ?? "—"}
					action={
						<Switch
							checked={drill.is_published}
							onChange={togglePub}
							label={drill.is_published ? "Xuất bản" : "Nháp"}
							disabled={setPub.isPending}
						/>
					}
				/>
				<div className="mt-2 flex flex-wrap gap-1">
					<Badge>{drill.level}</Badge>
					<Badge variant="info">{drill.estimated_minutes} phút</Badge>
				</div>
			</div>

			<Tabs
				tabs={[
					{ label: "Thông tin", value: "info" },
					{ label: `Câu (${sentences.length})`, value: "sentences" },
				]}
				active={tab}
				onChange={(v) => navigate({ search: { tab: v as Search["tab"] } })}
			/>

			{tab === "info" && (
				<Card title="Cập nhật bài phát âm">
					<SpeakingDrillForm
						initial={drill}
						submitting={update.isPending}
						onCancel={() => navigate({ to: "/practice/speaking-drills" })}
						onSubmit={async (input) => {
							await update.mutateAsync(input)
							showSuccess("Đã lưu thay đổi.")
						}}
					/>
				</Card>
			)}

			{tab === "sentences" && <SpeakingDrillSentencesTab drillId={drillId} sentences={sentences} />}
		</div>
	)
}
