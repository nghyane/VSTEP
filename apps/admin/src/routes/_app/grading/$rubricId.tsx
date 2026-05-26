import { ArrowLeftOutlined } from "@ant-design/icons"
import { Link, createFileRoute } from "@tanstack/react-router"
import { Button, Card, Collapse, Descriptions, Flex, Result, Skeleton, Table, Tag, Typography } from "antd"
import { useQuery } from "@tanstack/react-query"
import { rubricDetailQuery } from "#/features/admin-grading/queries"
import type { BandDescriptor, Criterion, ScoringPolicy } from "#/features/admin-grading/types"
import { PageHeader } from "#/components/PageHeader"

export const Route = createFileRoute("/_app/grading/$rubricId")({
	component: RubricDetailPage,
})

function RubricDetailPage() {
	const { rubricId } = Route.useParams()
	const { data, isLoading, isError } = useQuery(rubricDetailQuery(rubricId))
	const rubric = data?.data

	if (isLoading) return <Skeleton active />
	if (isError || !rubric) {
		return (
			<Result
				status="404"
				title="Không tìm thấy tiêu chí"
				subTitle="Rubric này không tồn tại hoặc chưa được tạo trong hệ thống."
				extra={<Link to="/grading"><Button type="primary">Quay lại danh sách</Button></Link>}
			/>
		)
	}

	return (
		<Flex vertical gap={24}>
			<Link to="/grading">
				<Button type="link" icon={<ArrowLeftOutlined />} style={{ paddingLeft: 0 }}>
					Quay lại
				</Button>
			</Link>

			<PageHeader
				title={rubric.name}
				description={`${rubric.skill === "writing" ? "Writing" : "Speaking"} — v${rubric.version}`}
			/>

			<Descriptions bordered column={2}>
				<Descriptions.Item label="Kỹ năng">
					<Tag color={rubric.skill === "writing" ? "blue" : "purple"}>
						{rubric.skill === "writing" ? "Writing" : "Speaking"}
					</Tag>
				</Descriptions.Item>
				<Descriptions.Item label="Version">{rubric.version}</Descriptions.Item>
				<Descriptions.Item label="Công thức">{rubric.scoring_formula}</Descriptions.Item>
				<Descriptions.Item label="Trạng thái">
					{rubric.is_active ? <Tag color="success">Active</Tag> : <Tag>Inactive</Tag>}
				</Descriptions.Item>
				<Descriptions.Item label="Áp dụng từ">{rubric.effective_from ?? "—"}</Descriptions.Item>
				<Descriptions.Item label="Nguồn tham chiếu">{rubric.source_reference ?? "—"}</Descriptions.Item>
			</Descriptions>

			<Typography.Title level={4} style={{ margin: 0 }}>Tiêu chí ({rubric.criteria.length})</Typography.Title>
			<Collapse
				items={rubric.criteria.map((c: Criterion) => ({
					key: c.key,
					label: (
						<Flex justify="space-between" align="center" style={{ width: "100%" }}>
							<span>{c.name_vi ?? c.name} ({c.key})</span>
							<Typography.Text type="secondary">Max: {c.max_score} — Weight: {c.weight}</Typography.Text>
						</Flex>
					),
					children: <BandDescriptorTable descriptors={c.band_descriptors} />,
				}))}
			/>

			{rubric.policies && rubric.policies.length > 0 && (
				<>
					<Typography.Title level={4} style={{ margin: 0 }}>Scoring Policies ({rubric.policies.length})</Typography.Title>
					{rubric.policies.map((p: ScoringPolicy) => (
						<Card key={p.id} title={`${p.name} (v${p.version})`} extra={p.is_active ? <Tag color="success">Active</Tag> : <Tag>Inactive</Tag>}>
							<PolicyRules rules={p.rules} />
						</Card>
					))}
				</>
			)}
		</Flex>
	)
}

function BandDescriptorTable({ descriptors }: { descriptors: BandDescriptor[] }) {
	return (
		<Table
			size="small"
			pagination={false}
			dataSource={descriptors}
			rowKey="band"
			columns={[
				{ title: "Band", dataIndex: "band", width: 70 },
				{ title: "Mô tả", dataIndex: "description" },
			]}
		/>
	)
}

function PolicyRules({ rules }: { rules: ScoringPolicy["rules"] }) {
	if (!rules.caps || rules.caps.length === 0) {
		return <Typography.Text type="secondary">Không có cap rules.</Typography.Text>
	}
	return (
		<Table
			size="small"
			pagination={false}
			dataSource={rules.caps}
			rowKey={(r) => `${r.criterion}-${r.condition}`}
			columns={[
				{ title: "Tiêu chí", dataIndex: "criterion", width: 160 },
				{ title: "Điều kiện", dataIndex: "condition" },
				{ title: "Max score", dataIndex: "max_score", width: 100 },
			]}
		/>
	)
}
