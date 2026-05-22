import { ArrowLeftOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Skeleton as AntSkeleton, Flex, Space, Tag } from "antd"
import { Card } from "#/components/Card"
import { PageHeader } from "#/components/PageHeader"
import { Switch } from "#/components/Switch"
import { showError, showSuccess } from "#/components/Toaster"
import { SpeakingScenarioForm } from "#/features/admin-practice/SpeakingScenarioForm"
import {
	speakingScenarioDetailQuery,
	useSetSpeakingScenarioPublished,
	useUpdateSpeakingScenario,
} from "#/features/admin-practice/speaking-scenario"
import { extractError } from "#/lib/api"

export const Route = createFileRoute("/_app/practice/speaking-scenarios/$scenarioId")({
	component: SpeakingScenarioDetailPage,
})

function SpeakingScenarioDetailPage() {
	const { scenarioId } = Route.useParams()
	const navigate = useNavigate({ from: "/practice/speaking-scenarios/$scenarioId" })

	const { data, isLoading } = useQuery(speakingScenarioDetailQuery(scenarioId))
	const update = useUpdateSpeakingScenario(scenarioId)
	const setPub = useSetSpeakingScenarioPublished()

	if (isLoading || !data) {
		return (
			<Flex vertical gap={16}>
				<AntSkeleton active />
			</Flex>
		)
	}

	const scenario = data.data

	async function togglePub(): Promise<void> {
		try {
			await setPub.mutateAsync({ id: scenario.id, published: !scenario.is_published })
			showSuccess(scenario.is_published ? "Đã ẩn xuất bản." : "Đã xuất bản.")
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	return (
		<Flex vertical gap={24}>
			<div>
				<Link
					to="/practice/speaking-scenarios"
					style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}
				>
					<ArrowLeftOutlined /> Danh sách
				</Link>
				<PageHeader
					title={scenario.title}
					subtitle={`Nhân vật: ${scenario.character_name}`}
					action={
						<Switch
							checked={scenario.is_published}
							onChange={togglePub}
							label={scenario.is_published ? "Xuất bản" : "Nháp"}
							disabled={setPub.isPending}
						/>
					}
				/>
				<Space size={4} wrap style={{ marginTop: 8 }}>
					<Tag>{scenario.level}</Tag>
					<Tag color="blue">{scenario.estimated_minutes} phút</Tag>
					<Tag color="purple">{scenario.expected_turns} lượt</Tag>
				</Space>
			</div>

			<Card title="Cập nhật kịch bản">
				<SpeakingScenarioForm
					initial={scenario}
					submitting={update.isPending}
					onCancel={() => navigate({ to: "/practice/speaking-scenarios" })}
					onSubmit={async (input) => {
						await update.mutateAsync(input)
						showSuccess("Đã lưu thay đổi.")
					}}
				/>
			</Card>
		</Flex>
	)
}
