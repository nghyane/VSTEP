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
			<div className="flex flex-col gap-4">
				<Skeleton className="h-12 w-64" />
				<Skeleton className="h-64 w-full" />
			</div>
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
		<div className="flex flex-col gap-6">
			<div>
				<Link
					to="/grammar"
					className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" /> Danh sách
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
				<div className="mt-2 flex flex-wrap gap-1">
					<Badge>{point.category}</Badge>
					{point.levels.map((l) => (
						<Badge key={l}>{l}</Badge>
					))}
					{point.tasks.map((t) => (
						<Badge key={t} variant="info">
							{t}
						</Badge>
					))}
				</div>
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
							<p className="font-mono text-sm text-foreground">{it.template}</p>
							{it.description && <p className="mt-1 text-xs text-muted">{it.description}</p>}
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
							<p className="text-sm text-foreground">{it.en}</p>
							<p className="text-xs text-muted">{it.vi}</p>
							{it.note && <p className="mt-1 text-xs text-subtle">{it.note}</p>}
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
							<p className="text-sm text-danger line-through">{it.wrong}</p>
							<p className="text-sm text-success">{it.correct}</p>
							<p className="mt-1 text-xs text-muted">{it.explanation}</p>
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
							<div className="mb-1">
								<Badge variant="info">{it.task}</Badge>
							</div>
							<p className="text-sm text-foreground">{it.tip}</p>
							<p className="mt-1 text-xs text-muted italic">{it.example}</p>
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
		</div>
	)
}
