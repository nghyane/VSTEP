import { ArrowLeftOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Flex, Skeleton, Space, Tag, Typography } from "antd"
import { Card } from "#/components/Card"
import { PageHeader } from "#/components/PageHeader"
import { Switch } from "#/components/Switch"
import { Tabs } from "#/components/Tabs"
import { showError, showSuccess } from "#/components/Toaster"
import { ChildList } from "#/features/admin-grammar/ChildList"
import { ExampleForm } from "#/features/admin-grammar/ExampleForm"
import { ExercisesTab } from "#/features/admin-grammar/ExercisesTab"
import { MistakeForm } from "#/features/admin-grammar/MistakeForm"
import {
	useCreateExample,
	useCreateMistake,
	useCreateStructure,
	useCreateTip,
	useDeleteExample,
	useDeleteMistake,
	useDeleteStructure,
	useDeleteTip,
	useSetPointPublished,
	useUpdateExample,
	useUpdateMistake,
	useUpdatePoint,
	useUpdateStructure,
	useUpdateTip,
} from "#/features/admin-grammar/mutations"
import { PointForm } from "#/features/admin-grammar/PointForm"
import { adminGrammarPointDetailQuery } from "#/features/admin-grammar/queries"
import { StructureForm } from "#/features/admin-grammar/StructureForm"
import { TipForm } from "#/features/admin-grammar/TipForm"
import { extractError } from "#/lib/api"

interface Search {
	tab?: "info" | "structures" | "examples" | "mistakes" | "tips" | "exercises"
}

const TABS = ["info", "structures", "examples", "mistakes", "tips", "exercises"] as const

export const Route = createFileRoute("/_app/grammar/$pointId")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		tab: TABS.includes(s.tab as (typeof TABS)[number]) ? (s.tab as Search["tab"]) : undefined,
	}),
	component: PointDetailPage,
})

function PointDetailPage() {
	const { pointId } = Route.useParams()
	const search = Route.useSearch()
	const tab = search.tab ?? "info"
	const navigate = useNavigate({ from: "/grammar/$pointId" })

	const { data, isLoading } = useQuery(adminGrammarPointDetailQuery(pointId))
	const update = useUpdatePoint(pointId)
	const setPub = useSetPointPublished()

	const createStructure = useCreateStructure(pointId)
	const updateStructure = useUpdateStructure(pointId)
	const deleteStructure = useDeleteStructure(pointId)
	const createExample = useCreateExample(pointId)
	const updateExample = useUpdateExample(pointId)
	const deleteExample = useDeleteExample(pointId)
	const createMistake = useCreateMistake(pointId)
	const updateMistake = useUpdateMistake(pointId)
	const deleteMistake = useDeleteMistake(pointId)
	const createTip = useCreateTip(pointId)
	const updateTip = useUpdateTip(pointId)
	const deleteTip = useDeleteTip(pointId)

	if (isLoading || !data) {
		return (
			<Flex vertical gap={16}>
				<Skeleton active paragraph={{ rows: 1 }} />
				<Skeleton active paragraph={{ rows: 6 }} />
			</Flex>
		)
	}

	const { point, structures, examples, mistakes, tips, exercises } = data.data

	async function togglePub(): Promise<void> {
		try {
			await setPub.mutateAsync({ id: point.id, published: !point.is_published })
			showSuccess(point.is_published ? "Đã ẩn xuất bản." : "Đã xuất bản.")
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
	}

	return (
		<Flex vertical gap={24}>
			<div>
				<Link to="/grammar" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
					<Typography.Text type="secondary" style={{ fontSize: 12 }}>
						<ArrowLeftOutlined /> Danh sách
					</Typography.Text>
				</Link>
				<PageHeader
					title={point.name}
					subtitle={point.vietnamese_name ?? point.summary}
					action={
						<Switch
							checked={point.is_published}
							onChange={togglePub}
							label={point.is_published ? "Xuất bản" : "Nháp"}
							disabled={setPub.isPending}
						/>
					}
				/>
				<Space size={4} wrap style={{ marginTop: 8 }}>
					<Tag>{point.category}</Tag>
					{point.levels.map((l) => (
						<Tag key={l}>{l}</Tag>
					))}
					{point.tasks.map((t) => (
						<Tag key={t} color="blue">
							{t}
						</Tag>
					))}
				</Space>
			</div>

			<Tabs
				tabs={[
					{ label: "Thông tin", value: "info" },
					{ label: `Cấu trúc (${structures.length})`, value: "structures" },
					{ label: `Ví dụ (${examples.length})`, value: "examples" },
					{ label: `Lỗi (${mistakes.length})`, value: "mistakes" },
					{ label: `Mẹo (${tips.length})`, value: "tips" },
					{ label: `Bài tập (${exercises.length})`, value: "exercises" },
				]}
				active={tab}
				onChange={(v) => navigate({ search: { tab: v as Search["tab"] } })}
			/>

			{tab === "info" && (
				<Card title="Cập nhật thông tin">
					<PointForm
						initial={point}
						submitting={update.isPending}
						onCancel={() => navigate({ to: "/grammar" })}
						onSubmit={async (input) => {
							await update.mutateAsync(input)
							showSuccess("Đã lưu thay đổi.")
						}}
					/>
				</Card>
			)}

			{tab === "structures" && (
				<ChildList
					items={structures}
					addLabel="Thêm cấu trúc"
					emptyLabel="Chưa có cấu trúc nào."
					modalTitle={{ create: "Thêm cấu trúc", edit: "Sửa cấu trúc" }}
					confirmDelete={(it) => `Xoá cấu trúc "${it.template}"?`}
					renderItem={(it) => (
						<>
							<Typography.Text style={{ fontFamily: "monospace", fontSize: 14 }}>
								{it.template}
							</Typography.Text>
							{it.description && (
								<div style={{ marginTop: 4 }}>
									<Typography.Text type="secondary" style={{ fontSize: 12 }}>
										{it.description}
									</Typography.Text>
								</div>
							)}
						</>
					)}
					renderForm={(p) => <StructureForm {...p} />}
					mutations={{
						create: createStructure,
						update: updateStructure,
						remove: deleteStructure,
					}}
				/>
			)}

			{tab === "examples" && (
				<ChildList
					items={examples}
					addLabel="Thêm ví dụ"
					emptyLabel="Chưa có ví dụ nào."
					modalTitle={{ create: "Thêm ví dụ", edit: "Sửa ví dụ" }}
					confirmDelete={(it) => `Xoá ví dụ "${it.en}"?`}
					renderItem={(it) => (
						<>
							<Typography.Text style={{ fontSize: 14 }}>{it.en}</Typography.Text>
							<div>
								<Typography.Text type="secondary" style={{ fontSize: 12 }}>
									{it.vi}
								</Typography.Text>
							</div>
							{it.note && (
								<div style={{ marginTop: 4 }}>
									<Typography.Text type="secondary" style={{ fontSize: 12, fontStyle: "italic" }}>
										{it.note}
									</Typography.Text>
								</div>
							)}
						</>
					)}
					renderForm={(p) => <ExampleForm {...p} />}
					mutations={{
						create: createExample,
						update: updateExample,
						remove: deleteExample,
					}}
				/>
			)}

			{tab === "mistakes" && (
				<ChildList
					items={mistakes}
					addLabel="Thêm lỗi"
					emptyLabel="Chưa có lỗi thường gặp nào."
					modalTitle={{ create: "Thêm lỗi", edit: "Sửa lỗi" }}
					confirmDelete={(it) => `Xoá lỗi "${it.wrong}"?`}
					renderItem={(it) => (
						<>
							<Typography.Text type="danger" delete style={{ fontSize: 14 }}>
								{it.wrong}
							</Typography.Text>
							<div>
								<Typography.Text type="success" style={{ fontSize: 14 }}>
									{it.correct}
								</Typography.Text>
							</div>
							<div style={{ marginTop: 4 }}>
								<Typography.Text type="secondary" style={{ fontSize: 12 }}>
									{it.explanation}
								</Typography.Text>
							</div>
						</>
					)}
					renderForm={(p) => <MistakeForm {...p} />}
					mutations={{
						create: createMistake,
						update: updateMistake,
						remove: deleteMistake,
					}}
				/>
			)}

			{tab === "tips" && (
				<ChildList
					items={tips}
					addLabel="Thêm mẹo"
					emptyLabel="Chưa có mẹo VSTEP nào."
					modalTitle={{ create: "Thêm mẹo", edit: "Sửa mẹo" }}
					confirmDelete={(it) => `Xoá mẹo cho task ${it.task}?`}
					renderItem={(it) => (
						<>
							<div style={{ marginBottom: 4 }}>
								<Tag color="blue">{it.task}</Tag>
							</div>
							<Typography.Text style={{ fontSize: 14 }}>{it.tip}</Typography.Text>
							<div style={{ marginTop: 4 }}>
								<Typography.Text type="secondary" style={{ fontSize: 12, fontStyle: "italic" }}>
									{it.example}
								</Typography.Text>
							</div>
						</>
					)}
					renderForm={(p) => <TipForm {...p} />}
					mutations={{
						create: createTip,
						update: updateTip,
						remove: deleteTip,
					}}
				/>
			)}

			{tab === "exercises" && <ExercisesTab pointId={pointId} exercises={exercises} />}
		</Flex>
	)
}
