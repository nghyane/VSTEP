import { ArrowLeftOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Skeleton as AntSkeleton, Flex, Space, Tag } from "antd"
import { Card } from "#/components/Card"
import { PageHeader } from "#/components/PageHeader"
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
			<Flex vertical gap={16}>
				<AntSkeleton active />
			</Flex>
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
		<Flex vertical gap={24}>
			<div>
				<Link
					to="/practice/speaking-drills"
					style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}
				>
					<ArrowLeftOutlined /> Danh sách
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
				<Space size={4} wrap style={{ marginTop: 8 }}>
					<Tag>{drill.level}</Tag>
					<Tag color="blue">{drill.estimated_minutes} phút</Tag>
				</Space>
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
		</Flex>
	)
}
