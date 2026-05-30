import { CheckCircleOutlined, EyeOutlined, MinusCircleOutlined } from "@ant-design/icons"
import { Link, createFileRoute } from "@tanstack/react-router"
import { Button, Empty, Flex, Result, Select, Table, Tag } from "antd"
import { useQuery } from "@tanstack/react-query"
import { rubricListQuery } from "#/features/admin-grading/queries"
import type { GradingRubric } from "#/features/admin-grading/types"
import { PageHeader } from "#/components/PageHeader"

export const Route = createFileRoute("/_app/grading/")({
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
	const { data, isLoading, isError } = useQuery(rubricListQuery(search))

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

	const columns = [
		{
			title: "Kỹ năng",
			dataIndex: "skill",
			width: 120,
			render: (s: string) => (
				<Tag color={s === "writing" ? "blue" : "purple"}>
					{s === "writing" ? "Writing" : "Speaking"}
				</Tag>
			),
		},
		{ title: "Tên", dataIndex: "name" },
		{ title: "Version", dataIndex: "version", width: 90 },
		{
			title: "Số tiêu chí",
			dataIndex: "criteria",
			width: 110,
			render: (c: unknown[]) => c?.length ?? 0,
		},
		{ title: "Công thức", dataIndex: "scoring_formula", width: 160 },
		{
			title: "Trạng thái",
			dataIndex: "is_active",
			width: 120,
			render: (v: boolean) =>
				v ? (
					<Tag icon={<CheckCircleOutlined />} color="success">Active</Tag>
				) : (
					<Tag icon={<MinusCircleOutlined />} color="default">Inactive</Tag>
				),
		},
		{
			title: "",
			width: 80,
			render: (_: unknown, r: GradingRubric) => (
				<Link to="/grading/$rubricId" params={{ rubricId: r.id }}>
					<Button type="link" icon={<EyeOutlined />}>Xem</Button>
				</Link>
			),
		},
	]

	return (
		<Flex vertical gap={16}>
			<PageHeader title="Tiêu chí chấm điểm" subtitle="Rubric chấm điểm Writing & Speaking (read-only)" />
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
			<Table
				loading={isLoading}
				dataSource={data?.data}
				rowKey="id"
				columns={columns}
				locale={{ emptyText: <Empty description="Chưa có tiêu chí chấm điểm nào. Hãy chạy seeder để tạo dữ liệu mẫu." image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
				pagination={{
					current: data?.meta?.current_page ?? 1,
					pageSize: data?.meta?.per_page ?? 20,
					total: data?.meta?.total ?? 0,
					onChange: (p) => navigate({ search: { ...search, page: p } }),
				}}
			/>
		</Flex>
	)
}
