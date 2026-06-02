import { CheckCircleOutlined, CopyOutlined, EditOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { Button, Card, Empty, Flex, message, Result, Select, Space, Tag, Typography } from "antd"
import { PageHeader } from "#/components/PageHeader"
import { cloneRubric, rubricListQuery } from "#/features/admin-grading/queries"
import type { GradingRubric } from "#/features/admin-grading/types"
import { extractError, formatApiErrorBanner } from "#/lib/api"
import { useAuth } from "#/lib/auth"

export const Route = createFileRoute("/_app/grading/")({
	beforeLoad: () => {
		const user = useAuth.getState().user
		if (!user || user.role !== "admin") throw redirect({ to: "/" })
	},
	validateSearch: (search: Record<string, unknown>) => ({
		page: Number(search.page) || 1,
		skill: (search.skill as string) || null,
		is_active: (search.is_active as string) || null,
	}),
	component: GradingListPage,
})

function GradingListPage() {
	const search = Route.useSearch()
	const navigate = Route.useNavigate()
	const queryClient = useQueryClient()
	const { data, isLoading, isError } = useQuery(rubricListQuery(search))
	const activeWriting = data?.data.find((rubric) => rubric.skill === "writing" && rubric.is_active)
	const cloneMutation = useMutation({
		mutationFn: (id: string) => cloneRubric(id),
		onSuccess: async (res) => {
			message.success("Đã tạo bản nháp mới")
			await queryClient.invalidateQueries({ queryKey: ["admin", "grading-rubrics"] })
			navigate({ to: "/grading/$rubricId", params: { rubricId: res.data.id } })
		},
		onError: async (error) => message.error(formatApiErrorBanner(await extractError(error))),
	})

	if (isError) {
		return (
			<Result
				status="error"
				title="Không thể tải dữ liệu"
				subTitle="Có lỗi xảy ra khi tải tiêu chí chấm điểm. Vui lòng thử lại sau."
				extra={<Button onClick={() => window.location.reload()}>Tải lại</Button>}
			/>
		)
	}

	return (
		<Flex vertical gap={16}>
			<PageHeader
				title="Rubric chấm điểm"
				subtitle="Quản lý version rubric. Active để chấm bài mới, Draft để chỉnh sửa trước khi kích hoạt."
				action={
					<Button
						type="primary"
						icon={<PlusOutlined />}
						disabled={!activeWriting}
						loading={cloneMutation.isPending}
						onClick={() => activeWriting && cloneMutation.mutate(activeWriting.id)}
					>
						Tạo rubric mới
					</Button>
				}
			/>
			<Flex gap={12}>
				<Select
					placeholder="Kỹ năng"
					allowClear
					value={search.skill}
					onChange={(v) => navigate({ search: { ...search, skill: v ?? null, page: 1 } })}
					options={[
						{ value: "writing", label: "Writing" },
						{ value: "speaking", label: "Speaking" },
					]}
					style={{ width: 160 }}
				/>
				<Select
					placeholder="Trạng thái"
					allowClear
					value={search.is_active}
					onChange={(v) => navigate({ search: { ...search, is_active: v ?? null, page: 1 } })}
					options={[
						{ value: "yes", label: "Active" },
						{ value: "no", label: "Inactive" },
					]}
					style={{ width: 140 }}
				/>
			</Flex>
			{isLoading ? (
				<Card loading />
			) : data?.data.length ? (
				<Flex vertical gap={12}>
					{data.data.map((rubric) => (
						<RubricCard
							key={rubric.id}
							rubric={rubric}
							onClone={() => cloneMutation.mutate(rubric.id)}
							cloning={cloneMutation.isPending}
						/>
					))}
				</Flex>
			) : (
				<Empty
					description="Chưa có rubric. Hãy chạy seeder hoặc tạo rubric mới."
					image={Empty.PRESENTED_IMAGE_SIMPLE}
				/>
			)}
		</Flex>
	)
}

function RubricCard({
	rubric,
	onClone,
	cloning,
}: {
	rubric: GradingRubric
	onClone: () => void
	cloning: boolean
}) {
	return (
		<Card>
			<Flex justify="space-between" align="center" wrap="wrap" gap={16}>
				<div>
					<Space>
						<Typography.Title level={4} style={{ margin: 0 }}>
							{rubric.name}
						</Typography.Title>
						<LifecycleTag rubric={rubric} />
					</Space>
					<Typography.Text type="secondary">
						{rubric.skill === "writing" ? "Writing" : "Speaking"} · Version {rubric.version} ·{" "}
						{rubric.criteria.length} tiêu chí
					</Typography.Text>
					<br />
					<Typography.Text type="secondary">{lifecycleText(rubric)}</Typography.Text>
				</div>
				<Space>
					<Link to="/grading/$rubricId" params={{ rubricId: rubric.id }}>
						<Button icon={rubric.lifecycle.status === "draft" ? <EditOutlined /> : <EyeOutlined />}>
							{rubric.lifecycle.status === "draft" ? "Tiếp tục chỉnh" : "Xem"}
						</Button>
					</Link>
					<Button icon={<CopyOutlined />} loading={cloning} onClick={onClone}>
						Tạo bản nháp từ version này
					</Button>
				</Space>
			</Flex>
		</Card>
	)
}

function LifecycleTag({ rubric }: { rubric: GradingRubric }) {
	if (rubric.lifecycle.status === "active")
		return (
			<Tag icon={<CheckCircleOutlined />} color="success">
				ACTIVE
			</Tag>
		)
	if (rubric.lifecycle.status === "draft") return <Tag color="processing">DRAFT</Tag>
	return <Tag>ARCHIVED</Tag>
}

function lifecycleText(rubric: GradingRubric): string {
	if (rubric.lifecycle.status === "active") return "Đang dùng để chấm bài mới. Không sửa trực tiếp."
	if (rubric.lifecycle.status === "draft") return "Bản nháp có thể chỉnh sửa, chưa ảnh hưởng bài chấm mới."
	return "Lưu để truy vết kết quả lịch sử."
}
