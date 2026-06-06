import { ArrowLeftOutlined, CopyOutlined, EditOutlined, ThunderboltOutlined } from "@ant-design/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import {
	Alert,
	Button,
	Card,
	Descriptions,
	Flex,
	Form,
	Input,
	InputNumber,
	message,
	Progress,
	Radio,
	Result,
	Skeleton,
	Space,
	Table,
	Tabs,
	Tag,
	Typography,
} from "antd"
import { useState } from "react"
import { PageHeader } from "#/components/PageHeader"
import {
	activateRubric,
	cloneRubric,
	rubricDetailQuery,
	type SimulateResult,
	simulateRubric,
	type UpdateRubricPayload,
	updateRubric,
} from "#/features/admin-grading/queries"
import type { Criterion, GradingRubric } from "#/features/admin-grading/types"
import { extractError, formatApiErrorBanner } from "#/lib/api"
import { useAuth } from "#/lib/auth"

const gradingSearch = { page: 1, skill: null, is_active: null }

export const Route = createFileRoute("/_app/grading/$rubricId")({
	beforeLoad: () => {
		const user = useAuth.getState().user
		if (!user || user.role !== "admin") throw redirect({ to: "/" })
	},
	component: RubricDetailPage,
})

// ─── Page ──────────────────────────────────────────────────────────

function RubricDetailPage() {
	const { rubricId } = Route.useParams()
	const queryClient = useQueryClient()
	const navigate = Route.useNavigate()
	const { data, isLoading, isError } = useQuery(rubricDetailQuery(rubricId))
	const rubric = data?.data

	const cloneMutation = useMutation({
		mutationFn: () => cloneRubric(rubricId),
		onSuccess: async (res) => {
			message.success("Đã tạo bản nháp mới")
			await queryClient.invalidateQueries({ queryKey: ["admin", "grading-rubrics"] })
			navigate({ to: "/grading/$rubricId", params: { rubricId: res.data.id } })
		},
		onError: async (error) => message.error(formatApiErrorBanner(await extractError(error))),
	})

	const activateMutation = useMutation({
		mutationFn: () => activateRubric(rubricId),
		onSuccess: async () => {
			message.success("Đã kích hoạt version này")
			await queryClient.invalidateQueries({ queryKey: ["admin", "grading-rubrics"] })
		},
		onError: async (error) => message.error(formatApiErrorBanner(await extractError(error))),
	})

	if (isLoading) return <Skeleton active />
	if (isError || !rubric) {
		return (
			<Result
				status="404"
				title="Không tìm thấy rubric"
				subTitle="Rubric này không tồn tại hoặc chưa được tạo trong hệ thống."
				extra={
					<Link to="/grading" search={gradingSearch}>
						<Button type="primary">Quay lại danh sách</Button>
					</Link>
				}
			/>
		)
	}

	const isDraft = rubric.lifecycle.status === "draft"

	return (
		<Flex vertical gap={24}>
			<Link to="/grading" search={gradingSearch}>
				<Button type="link" icon={<ArrowLeftOutlined />} style={{ paddingLeft: 0 }}>
					Quay lại
				</Button>
			</Link>

			<DetailHeader rubric={rubric} cloneMutation={cloneMutation} activateMutation={activateMutation} />

			<LifecycleBanner rubric={rubric} />

			{isDraft ? (
				<DraftBuilder rubric={rubric} activateMutation={activateMutation} />
			) : (
				<ReadOnlyView rubric={rubric} cloneMutation={cloneMutation} />
			)}
		</Flex>
	)
}

// ─── Header ────────────────────────────────────────────────────────

function DetailHeader({
	rubric,
	cloneMutation,
	activateMutation,
}: {
	rubric: GradingRubric
	cloneMutation: ReturnType<typeof useMutation>
	activateMutation: ReturnType<typeof useMutation>
}) {
	const skillLabel = rubric.skill === "writing" ? "Writing" : "Speaking"

	return (
		<Flex justify="space-between" align="flex-start" wrap="wrap" gap={12}>
			<div>
				<PageHeader title={rubric.name} subtitle={`${skillLabel} · Version ${rubric.version}`} />
			</div>
			<Space>
				<Button
					icon={<CopyOutlined />}
					loading={cloneMutation.isPending}
					onClick={() => cloneMutation.mutate()}
				>
					Tạo bản nháp mới
				</Button>
				{rubric.admin_actions.can_activate && (
					<Button
						type="primary"
						icon={<ThunderboltOutlined />}
						loading={activateMutation.isPending}
						onClick={() => activateMutation.mutate()}
					>
						Kích hoạt
					</Button>
				)}
			</Space>
		</Flex>
	)
}

// ─── Lifecycle Banner ──────────────────────────────────────────────

function LifecycleBanner({ rubric }: { rubric: GradingRubric }) {
	const s = rubric.lifecycle.status
	const config = {
		active: {
			type: "success" as const,
			title: "ACTIVE · Đang dùng để chấm bài mới",
			description:
				rubric.lifecycle.read_only_reason ??
				"Rubric này ở chế độ chỉ đọc. Để thay đổi policy, hãy tạo bản nháp mới.",
		},
		draft: {
			type: "warning" as const,
			title: "DRAFT · Có thể chỉnh sửa",
			description:
				"Bạn đang chỉnh bản nháp. Sau khi lưu và kích hoạt, version này mới được dùng để chấm bài mới.",
		},
		archived: {
			type: "info" as const,
			title: "ARCHIVED · Lưu lịch sử",
			description: rubric.lifecycle.read_only_reason ?? "Rubric này được lưu để truy vết kết quả chấm cũ.",
		},
	}[s]

	return <Alert showIcon type={config.type} message={config.title} description={config.description} />
}

// ─── Read-only View ────────────────────────────────────────────────

function ReadOnlyView({
	rubric,
	cloneMutation,
}: {
	rubric: GradingRubric
	cloneMutation: ReturnType<typeof useMutation>
}) {
	return (
		<Tabs
			items={[
				{
					key: "overview",
					label: "Tổng quan",
					children: <OverviewTab rubric={rubric} cloneMutation={cloneMutation} />,
				},
				{
					key: "flow",
					label: "Luồng chấm",
					children: <ScoringFlowTab rubric={rubric} />,
				},
				{
					key: "criteria",
					label: "Tiêu chí & mức điểm",
					children: <CriteriaMatrixTab rubric={rubric} />,
				},
				{
					key: "policy",
					label: "Điều kiện & giới hạn",
					children: <PolicyControlTab rubric={rubric} />,
				},
				{
					key: "simulation",
					label: "Mô phỏng",
					children: <SimulatorSection rubric={rubric} />,
				},
			]}
		/>
	)
}

function OverviewTab({
	rubric,
	cloneMutation,
}: {
	rubric: GradingRubric
	cloneMutation: ReturnType<typeof useMutation>
}) {
	return (
		<Flex vertical gap={16}>
			<Alert
				showIcon
				type="info"
				message="Tổng quan chính sách chấm điểm"
				description="Kiểm tra version đang áp dụng, điều kiện loại bài, giới hạn điểm và cách hệ thống tính điểm cuối."
			/>
			<PolicySummaryCards rubric={rubric} />
			<ScoringFormulaCard rubric={rubric} />
			<CriterionWeightsCard rubric={rubric} />
			<VersionActionCard rubric={rubric} cloneMutation={cloneMutation} />
		</Flex>
	)
}

// ─── Policy Summary Cards ──────────────────────────────────────────

function PolicySummaryCards({ rubric }: { rubric: GradingRubric }) {
	const gates = rubric.policy_summary.assessment_gates
	const rules = rubric.policy_summary.word_rules
	const systemGates = rubric.policy_summary.system_gates
	const weights = rubric.policy_summary.criteria_weights
	const totalWeight = Math.round(Object.values(weights).reduce((a, b) => a + b, 0) * 100)

	return (
		<Flex gap={12} wrap="wrap">
			{gates && (
				<Card size="small" title="Bài bị loại khỏi chấm điểm khi" style={{ flex: 1, minWidth: 260 }}>
					<Typography.Text>Task 1 dưới {gates.severe_minimum_words_task1} từ</Typography.Text>
					<br />
					<Typography.Text>Task 2 dưới {gates.severe_minimum_words_task2} từ</Typography.Text>
					<br />
					<Typography.Text>Trả lời dưới {gates.minimum_covered_points} ý trong đề</Typography.Text>
					{systemGates && (
						<>
							<br />
							<Typography.Text type="secondary" style={{ fontSize: 12 }}>
								+ Hệ thống từ chối bài không phải tiếng Anh, sao chép đề, nộp rỗng.
							</Typography.Text>
						</>
					)}
				</Card>
			)}
			{rules && (
				<Card size="small" title="Mốc số từ chuẩn" style={{ flex: 1, minWidth: 200 }}>
					<Typography.Text>Task 1: {rules.official_minimum_task1} từ</Typography.Text>
					<br />
					<Typography.Text>Task 2: {rules.official_minimum_task2} từ</Typography.Text>
				</Card>
			)}
			<Card size="small" title="Tiêu chí & trọng số" style={{ flex: 1, minWidth: 180 }}>
				<Typography.Text>{rubric.criteria.length} tiêu chí</Typography.Text>
				<br />
				<Typography.Text type="secondary">Tổng trọng số hiện tại: {totalWeight}%</Typography.Text>
			</Card>
		</Flex>
	)
}

function ScoringFormulaCard({ rubric }: { rubric: GradingRubric }) {
	return (
		<Card title="Công thức tính điểm cuối" size="small">
			<Descriptions bordered size="small" column={1}>
				<Descriptions.Item label="Công thức">{formulaLabel(rubric.scoring_formula)}</Descriptions.Item>
				<Descriptions.Item label="Thang điểm">Mỗi tiêu chí được chấm từ 0 đến 10.</Descriptions.Item>
				<Descriptions.Item label="Trọng số">
					Tiêu chí có trọng số cao sẽ ảnh hưởng nhiều hơn đến điểm cuối.
				</Descriptions.Item>
				<Descriptions.Item label="Làm tròn">Điểm cuối được làm tròn về mốc 0.5 gần nhất.</Descriptions.Item>
			</Descriptions>
		</Card>
	)
}

function CriterionWeightsCard({ rubric }: { rubric: GradingRubric }) {
	return (
		<Card title="Trọng số tiêu chí" size="small">
			<Flex vertical gap={12}>
				{rubric.criteria.map((criterion) => {
					const percent = Math.round(criterion.weight * 100)

					return (
						<div key={criterion.key}>
							<Flex justify="space-between" align="center">
								<Typography.Text strong>{criterionLabel(criterion)}</Typography.Text>
								<Tag color="blue">{percent}%</Tag>
							</Flex>
							<Progress percent={percent} showInfo={false} />
						</div>
					)
				})}
			</Flex>
		</Card>
	)
}

function VersionActionCard({
	rubric,
	cloneMutation,
}: {
	rubric: GradingRubric
	cloneMutation: ReturnType<typeof useMutation>
}) {
	return (
		<Card size="small" title="Quản trị version">
			<Flex align="center" justify="space-between" wrap="wrap" gap={12}>
				<Typography.Text type="secondary">
					{rubric.lifecycle.status === "active"
						? "Version đang active được khóa để kết quả chấm cũ không thay đổi. Muốn chỉnh, hãy tạo bản nháp mới."
						: "Version này được giữ để truy vết kết quả đã chấm trước đây."}
				</Typography.Text>
				<Button
					type="primary"
					icon={<CopyOutlined />}
					loading={cloneMutation.isPending}
					onClick={() => cloneMutation.mutate()}
				>
					Tạo bản nháp mới từ version này
				</Button>
			</Flex>
		</Card>
	)
}

interface FlowStepItem {
	index: number
	title: string
	description: string
	tags: Array<{ label: string; color: string }>
}

function ScoringFlowTab({ rubric }: { rubric: GradingRubric }) {
	const flow: FlowStepItem[] = [
		{
			index: 1,
			title: "Nhận bài làm",
			description:
				"Hệ thống nhận câu trả lời Writing/Speaking cùng metadata như task, số từ hoặc thời lượng nói.",
			tags: [{ label: "input", color: "default" }],
		},
		{
			index: 2,
			title: "Điều kiện hệ thống",
			description: "Loại bài rỗng, không phải tiếng Anh hoặc sao chép đề trước khi đi vào rubric.",
			tags: [{ label: "có thể từ chối", color: "red" }],
		},
		{
			index: 3,
			title: "Điều kiện rubric",
			description: rubric.policy_summary.assessment_gates
				? "Kiểm tra ngưỡng số từ nghiêm trọng và số ý tối thiểu đã trả lời."
				: "Rubric này không cấu hình điều kiện số từ trong phần tóm tắt chính sách.",
			tags: [{ label: "đủ điều kiện chấm", color: "orange" }],
		},
		{
			index: 4,
			title: "Trích xuất tín hiệu",
			description:
				"Analyzer/AI thu thập bằng chứng: độ phủ đề, lỗi ngữ pháp, độ đa dạng từ vựng, bố cục, phát âm hoặc độ trôi chảy.",
			tags: [{ label: "evidence", color: "blue" }],
		},
		{
			index: 5,
			title: "Chấm từng tiêu chí",
			description: "Mỗi tiêu chí nhận điểm 0–10 dựa trên tín hiệu và mô tả mức điểm đang lưu trong rubric.",
			tags: [{ label: `${rubric.criteria.length} tiêu chí`, color: "purple" }],
		},
		{
			index: 6,
			title: "Áp giới hạn điểm",
			description:
				"Nếu bài quá ngắn hoặc thiếu điều kiện, điểm có thể bị giới hạn để tránh kết quả cao bất thường.",
			tags: [{ label: "giới hạn", color: "gold" }],
		},
		{
			index: 7,
			title: "Tính điểm cuối",
			description: "Điểm sau giới hạn được nhân trọng số, cộng lại và làm tròn về mốc 0.5 gần nhất.",
			tags: [{ label: "điểm cuối", color: "green" }],
		},
	]

	return (
		<Flex vertical gap={16}>
			<Alert showIcon type="info" message="Quy trình xử lý từ lúc nộp bài đến lúc ra điểm cuối." />
			<Flex vertical gap={12}>
				{flow.map((item) => (
					<FlowStepCard key={item.index} item={item} />
				))}
			</Flex>
		</Flex>
	)
}

function FlowStepCard({ item }: { item: FlowStepItem }) {
	return (
		<Card size="small">
			<Flex gap={16} align="flex-start">
				<Tag color="blue" style={{ minWidth: 32, textAlign: "center" }}>
					{item.index}
				</Tag>
				<Flex vertical gap={6} style={{ flex: 1 }}>
					<Flex align="center" gap={8} wrap="wrap">
						<Typography.Text strong>{item.title}</Typography.Text>
						{item.tags.map((tag) => (
							<Tag key={tag.label} color={tag.color}>
								{tag.label}
							</Tag>
						))}
					</Flex>
					<Typography.Text type="secondary">{item.description}</Typography.Text>
				</Flex>
			</Flex>
		</Card>
	)
}

function CriteriaMatrixTab({ rubric }: { rubric: GradingRubric }) {
	return (
		<Flex vertical gap={16}>
			<Alert
				showIcon
				type="success"
				message="Các mốc điểm là chuẩn tham chiếu theo từng tiêu chí."
				description="Admin đọc từng tiêu chí riêng. Điểm 7.0 nghĩa là mức bài nằm giữa Đạt cơ bản (6) và Tốt (8)."
			/>
			{rubric.criteria.map((criterion) => (
				<CriterionBandCard key={criterion.key} criterion={criterion} />
			))}
		</Flex>
	)
}

function CriterionBandCard({ criterion }: { criterion: Criterion }) {
	const percent = Math.round(criterion.weight * 100)

	return (
		<Card size="small" title={criterionLabel(criterion)} extra={<Tag color="blue">Trọng số {percent}%</Tag>}>
			<Table
				size="small"
				pagination={false}
				dataSource={criterionBandRows(criterion.band_descriptors)}
				rowKey="key"
				columns={[
					{ title: "Mức điểm", dataIndex: "level", width: 170 },
					{ title: "Diễn giải", dataIndex: "description" },
				]}
			/>
		</Card>
	)
}

function PolicyControlTab({ rubric }: { rubric: GradingRubric }) {
	const gates = rubric.policy_summary.assessment_gates
	const rules = rubric.policy_summary.word_rules
	const systemGates = rubric.policy_summary.system_gates

	return (
		<Flex vertical gap={16}>
			<Alert
				showIcon
				type="warning"
				message="Điều kiện loại bài và giới hạn điểm là hai bước khác nhau."
				description="Không đạt điều kiện thì dừng chấm. Đạt điều kiện nhưng bài quá ngắn thì vẫn chấm, nhưng điểm tối đa bị giới hạn."
			/>
			<Flex gap={12} wrap="wrap" align="stretch">
				<Card size="small" title="Điều kiện hệ thống" style={{ flex: 1, minWidth: 280 }}>
					{systemGates ? (
						<SystemGatesList gates={systemGates} />
					) : (
						<Typography.Text type="secondary">Không có điều kiện hệ thống.</Typography.Text>
					)}
				</Card>
				<Card size="small" title="Điều kiện rubric" style={{ flex: 1, minWidth: 280 }}>
					{gates ? (
						<Space orientation="vertical">
							<Typography.Text>
								Task 1 dưới {gates.severe_minimum_words_task1} từ → không chấm
							</Typography.Text>
							<Typography.Text>
								Task 2 dưới {gates.severe_minimum_words_task2} từ → không chấm
							</Typography.Text>
							<Typography.Text>Trả lời dưới {gates.minimum_covered_points} ý → không chấm</Typography.Text>
						</Space>
					) : (
						<Typography.Text type="secondary">Rubric này không có điều kiện số từ.</Typography.Text>
					)}
				</Card>
				<Card size="small" title="Mốc số từ khuyến nghị" style={{ flex: 1, minWidth: 240 }}>
					{rules ? (
						<Space orientation="vertical">
							<Typography.Text>Task 1: {rules.official_minimum_task1} từ</Typography.Text>
							<Typography.Text>Task 2: {rules.official_minimum_task2} từ</Typography.Text>
							<Typography.Text type="secondary">
								Dưới chuẩn vẫn có thể chấm nhưng sẽ cảnh báo hoặc bị giới hạn điểm.
							</Typography.Text>
						</Space>
					) : (
						<Typography.Text type="secondary">Không áp dụng.</Typography.Text>
					)}
				</Card>
			</Flex>
			{rules && (
				<Flex gap={12} wrap="wrap">
					<CapRulesCard title="Giới hạn điểm toàn bài" rules={rules.short_response_caps} />
					<CapRulesCard
						title="Giới hạn điểm Hoàn thành yêu cầu đề"
						rules={rules.task_fulfillment_word_caps}
					/>
				</Flex>
			)}
		</Flex>
	)
}

function SystemGatesList({ gates }: { gates: NonNullable<GradingRubric["policy_summary"]["system_gates"]> }) {
	return (
		<Space orientation="vertical">
			{Object.entries(gates).map(([key, gate]) => (
				<Typography.Text key={key}>
					<Tag color={gate.enabled ? "red" : "default"}>{gate.enabled ? "Bật" : "Tắt"}</Tag>
					{gate.description}
				</Typography.Text>
			))}
		</Space>
	)
}

function CapRulesCard({ title, rules }: { title: string; rules: Array<{ max_words: number; cap: number }> }) {
	return (
		<Card size="small" title={title} style={{ flex: 1, minWidth: 280 }}>
			{rules.length > 0 ? (
				<Space orientation="vertical">
					{rules.map((rule) => (
						<Typography.Text key={`${rule.max_words}-${rule.cap}`}>
							≤ {rule.max_words} từ → tối đa {rule.cap.toFixed(1)} điểm
						</Typography.Text>
					))}
				</Space>
			) : (
				<Typography.Text type="secondary">Không cấu hình giới hạn.</Typography.Text>
			)}
		</Card>
	)
}

// ─── Draft Builder ─────────────────────────────────────────────────

interface PolicyFormValues {
	name: string
	severity: "strict" | "standard" | "lenient"
	word_minimum_task1: number
	word_minimum_task2: number
	minimum_covered_points: number
}

function DraftBuilder({
	rubric,
	activateMutation,
}: {
	rubric: GradingRubric
	activateMutation: ReturnType<typeof useMutation>
}) {
	const [form] = Form.useForm<PolicyFormValues>()
	const queryClient = useQueryClient()
	const summary = rubric.policy_summary

	const updateMutation = useMutation({
		mutationFn: (values: PolicyFormValues) => updateRubric(rubric.id, toUpdatePayload(values)),
		onSuccess: async () => {
			message.success("Đã lưu draft")
			await queryClient.invalidateQueries({
				queryKey: ["admin", "grading-rubrics", "detail", rubric.id],
			})
		},
		onError: async (error) => message.error(formatApiErrorBanner(await extractError(error))),
	})

	const initial = {
		name: rubric.name,
		severity: summary.severity ?? "standard",
		word_minimum_task1: summary.word_rules?.official_minimum_task1 ?? 120,
		word_minimum_task2: summary.word_rules?.official_minimum_task2 ?? 250,
		minimum_covered_points: summary.assessment_gates?.minimum_covered_points ?? 1,
	}
	const canEditWritingPolicy = Boolean(summary.assessment_gates && summary.word_rules)

	const editForm = canEditWritingPolicy ? (
		<Form
			form={form}
			layout="vertical"
			initialValues={initial}
			onFinish={(values) => updateMutation.mutate(values)}
		>
			<Flex vertical gap={24}>
				<Card title="1. Mức độ chấm">
					<Form.Item name="severity" label="Chọn mức độ nghiêm ngặt khi chấm bài">
						<Radio.Group>
							<Radio value="strict">Chặt — từ chối sớm, giới hạn điểm thấp</Radio>
							<Radio value="standard">Tiêu chuẩn — cân bằng</Radio>
							<Radio value="lenient">Thoáng — ít từ chối, giới hạn điểm cao</Radio>
						</Radio.Group>
					</Form.Item>
					<Form.Item noStyle shouldUpdate>
						{() => <DerivedValues rubric={rubric} />}
					</Form.Item>
				</Card>

				<Card title="2. Yêu cầu tối thiểu">
					<Flex gap={16} wrap="wrap">
						<Form.Item name="word_minimum_task1" label="Task 1 yêu cầu tối thiểu">
							<InputNumber min={1} addonAfter="từ" />
						</Form.Item>
						<Form.Item name="word_minimum_task2" label="Task 2 yêu cầu tối thiểu">
							<InputNumber min={1} addonAfter="từ" />
						</Form.Item>
						<Form.Item name="minimum_covered_points" label="Cần trả lời ít nhất">
							<InputNumber min={1} addonAfter="ý" />
						</Form.Item>
					</Flex>
				</Card>

				<Card title="3. Thông tin">
					<Form.Item name="name" label="Tên rubric">
						<Input />
					</Form.Item>
				</Card>

				<Flex gap={12}>
					<Button type="primary" htmlType="submit" icon={<EditOutlined />} loading={updateMutation.isPending}>
						Lưu bản nháp
					</Button>
					<Button
						icon={<ThunderboltOutlined />}
						loading={activateMutation.isPending}
						onClick={() => activateMutation.mutate()}
					>
						Kích hoạt
					</Button>
				</Flex>
			</Flex>
		</Form>
	) : (
		<Alert type="info" showIcon message="Trình chỉnh policy hiện chỉ hỗ trợ rubrics Writing." />
	)

	return (
		<Tabs
			items={[
				{ key: "edit", label: "Chỉnh policy", children: editForm },
				{ key: "flow", label: "Luồng chấm", children: <ScoringFlowTab rubric={rubric} /> },
				{ key: "criteria", label: "Tiêu chí & mức điểm", children: <CriteriaMatrixTab rubric={rubric} /> },
				{ key: "policy", label: "Điều kiện & giới hạn", children: <PolicyControlTab rubric={rubric} /> },
				{ key: "simulation", label: "Mô phỏng", children: <SimulatorSection rubric={rubric} /> },
			]}
		/>
	)
}

// ─── Simulator ─────────────────────────────────────────────────────

function SimulatorSection({ rubric }: { rubric: GradingRubric }) {
	const gates = rubric.policy_summary.assessment_gates
	const [part, setPart] = useState<1 | 2>(1)
	const [wordCount, setWordCount] = useState(36)
	const [covered, setCovered] = useState(0)
	const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({})

	const simulateMutation = useMutation({
		mutationFn: () =>
			simulateRubric(rubric.id, {
				part,
				word_count: wordCount,
				covered_points: covered,
				scores: Object.keys(criteriaScores).length > 0 ? criteriaScores : undefined,
			}),
		onError: async (error) => message.error(formatApiErrorBanner(await extractError(error))),
	})

	const result = simulateMutation.data?.data
	const criterionRows = result?.criterion_scores
		? simulationCriterionRows(rubric, result.criterion_scores)
		: []

	if (!gates) {
		return <Alert showIcon type="info" message="Mô phỏng chỉ khả dụng cho Writing rubric." />
	}

	return (
		<Card title="Mô phỏng tác động chính sách">
			<Flex gap={16} align="flex-start" wrap="wrap">
				<Card size="small" title="Nhập tình huống thử" style={{ width: 340 }}>
					<Space orientation="vertical" style={{ width: "100%" }}>
						<Space>
							<Button type={part === 1 ? "primary" : "default"} onClick={() => setPart(1)}>
								Task 1
							</Button>
							<Button type={part === 2 ? "primary" : "default"} onClick={() => setPart(2)}>
								Task 2
							</Button>
						</Space>
						<Typography.Text>Số từ</Typography.Text>
						<InputNumber
							style={{ width: "100%" }}
							min={0}
							value={wordCount}
							onChange={(v) => setWordCount(Number(v ?? 0))}
						/>
						<Typography.Text>Số ý đã trả lời trong đề</Typography.Text>
						<InputNumber
							style={{ width: "100%" }}
							min={0}
							max={10}
							value={covered}
							onChange={(v) => setCovered(Number(v ?? 0))}
						/>

						<Typography.Text>Điểm tiêu chí ước lượng (nếu có)</Typography.Text>
						{rubric.criteria.map((criterion) => (
							<Flex key={criterion.key} justify="space-between" align="center">
								<Typography.Text style={{ fontSize: 12 }}>
									{criterion.name_vi ?? criterion.name}
								</Typography.Text>
								<InputNumber
									size="small"
									min={0}
									max={10}
									step={0.5}
									value={criteriaScores[criterion.key] ?? undefined}
									placeholder="Bỏ trống"
									onChange={(v) =>
										setCriteriaScores((prev) => {
											const next = { ...prev }
											if (v === null || v === undefined) {
												delete next[criterion.key]
											} else {
												next[criterion.key] = Number(v)
											}
											return next
										})
									}
								/>
							</Flex>
						))}

						<Button
							type="primary"
							block
							loading={simulateMutation.isPending}
							onClick={() => simulateMutation.mutate()}
						>
							Chạy mô phỏng
						</Button>
					</Space>
				</Card>

				{result && (
					<Card size="small" title="Kết quả mô phỏng" style={{ flex: 1, minWidth: 420 }}>
						<Alert
							showIcon
							type={result.assessable ? "success" : "error"}
							message={result.assessable ? "Được chấm điểm" : "Không đủ điều kiện chấm"}
							description={
								result.assessable
									? "Bài đi tiếp vào bước chấm tiêu chí, áp giới hạn nếu có, rồi tính điểm cuối."
									: "Bài dừng ở bước kiểm tra điều kiện; hệ thống chỉ hiển thị checklist và hướng dẫn viết lại."
							}
						/>

						<Space orientation="vertical" style={{ marginTop: 12, width: "100%" }}>
							<Typography.Text type={result.details.word_check.passed ? "success" : "danger"}>
								{result.details.word_check.passed ? "✓" : "✕"} Số từ: {result.details.word_check.actual}/
								{result.details.word_check.required}
							</Typography.Text>
							<Typography.Text type={result.details.coverage_check.passed ? "success" : "danger"}>
								{result.details.coverage_check.passed ? "✓" : "✕"} Coverage:{" "}
								{result.details.coverage_check.actual}/{result.details.coverage_check.required}
							</Typography.Text>
						</Space>

						{result.details.system_gates && (
							<Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
								Hệ thống cũng từ chối: không phải tiếng Anh, sao chép đề, nộp rỗng.
							</Typography.Text>
						)}

						{result.assessable && (
							<>
								{result.overall_band !== null ? (
									<Flex align="center" gap={12} style={{ marginTop: 12 }}>
										<Typography.Text style={{ fontSize: 48, fontWeight: 800 }}>
											{result.overall_band.toFixed(1)}
										</Typography.Text>
										<Typography.Text type="secondary">/ 10 điểm cuối</Typography.Text>
									</Flex>
								) : (
									<Alert
										showIcon
										type="info"
										message="Nhập điểm tiêu chí để xem điểm cuối."
										style={{ marginTop: 12 }}
									/>
								)}

								{criterionRows.length > 0 && (
									<Table
										size="small"
										pagination={false}
										dataSource={criterionRows}
										rowKey="key"
										style={{ marginTop: 12 }}
										columns={[
											{ title: "Tiêu chí", dataIndex: "criterion" },
											{ title: "Điểm gốc", dataIndex: "raw", width: 100 },
											{ title: "Sau giới hạn", dataIndex: "capped", width: 120 },
											{ title: "Trọng số", dataIndex: "weight", width: 90 },
											{ title: "Đóng góp", dataIndex: "contribution", width: 100 },
										]}
									/>
								)}

								{Object.keys(result.caps_applied).length > 0 && (
									<Alert
										showIcon
										type="warning"
										message="Đã áp dụng giới hạn điểm do bài quá ngắn."
										style={{ marginTop: 12 }}
									/>
								)}
								{result.details.below_official_minimum && (
									<Alert
										showIcon
										type="warning"
										message={`Dưới mức chuẩn ${result.details.official_minimum} từ, checklist sẽ cảnh báo.`}
										style={{ marginTop: 8 }}
									/>
								)}
							</>
						)}
					</Card>
				)}
			</Flex>
		</Card>
	)
}

// ─── Derived Values ───────────────────────────────────────────────

const SEVERITY_DERIVED: Record<
	string,
	{
		gates: { task1: number; task2: number }
		caps: string[]
		tfCaps: string[]
	}
> = {
	strict: {
		gates: { task1: 80, task2: 150 },
		caps: ["≤10 từ → 1.0", "≤30 từ → 2.0"],
		tfCaps: ["≤80 từ → 3.0", "≤120 từ → 5.0"],
	},
	standard: {
		gates: { task1: 60, task2: 125 },
		caps: ["≤10 từ → 1.0", "≤30 từ → 2.0"],
		tfCaps: ["≤80 từ → 4.0", "≤120 từ → 6.0"],
	},
	lenient: {
		gates: { task1: 40, task2: 90 },
		caps: ["≤10 từ → 1.0"],
		tfCaps: ["≤80 từ → 5.0"],
	},
}

function DerivedValues({ rubric }: { rubric: GradingRubric }) {
	const form = Form.useFormInstance()
	const severity: keyof typeof SEVERITY_DERIVED =
		form.getFieldValue("severity") ?? rubric.policy_summary.severity ?? "standard"
	const derived = SEVERITY_DERIVED[severity] ?? SEVERITY_DERIVED.standard

	return (
		<Card size="small" title="Thông số được sinh từ preset" style={{ marginTop: 12 }}>
			<Space orientation="vertical">
				<Typography.Text type="secondary" style={{ fontSize: 12 }}>
					Không chấm: Task 1 &lt; {derived.gates.task1} từ · Task 2 &lt; {derived.gates.task2} từ
				</Typography.Text>
				<Typography.Text type="secondary" style={{ fontSize: 12 }}>
					Giới hạn toàn bộ: {derived.caps.join(" · ") || "không"}
				</Typography.Text>
				<Typography.Text type="secondary" style={{ fontSize: 12 }}>
					Giới hạn Hoàn thành yêu cầu đề: {derived.tfCaps.join(" · ") || "không"}
				</Typography.Text>
			</Space>
		</Card>
	)
}

// ─── Helpers ───────────────────────────────────────────────────────

function toUpdatePayload(values: PolicyFormValues): UpdateRubricPayload {
	return {
		name: values.name,
		policy: {
			severity: values.severity,
			word_minimum_task1: values.word_minimum_task1,
			word_minimum_task2: values.word_minimum_task2,
			minimum_covered_points: values.minimum_covered_points,
		},
	}
}

function formulaLabel(formula: string): string {
	if (formula === "equal_weighted_mean_rounded_half" || formula === "weighted_mean_rounded_half") {
		return "Trung bình có trọng số, làm tròn về 0.5 gần nhất"
	}

	if (formula === "mean_rounded_half") {
		return "Trung bình cộng các tiêu chí, làm tròn về 0.5 gần nhất"
	}

	return formula
}

function criterionLabel(criterion: Criterion): string {
	return criterion.name_vi ?? criterion.name
}

function criterionLabelByKey(rubric: GradingRubric, key: string): string {
	const criterion = rubric.criteria.find((item) => item.key === key)

	return criterion ? criterionLabel(criterion) : key
}

function descriptorText(
	descriptors: Criterion["band_descriptors"],
	band: keyof Criterion["band_descriptors"],
): string {
	return descriptors[band]
}

function criterionBandRows(descriptors: Criterion["band_descriptors"]) {
	return [
		{ key: "10", level: "10 — Xuất sắc", description: descriptorText(descriptors, "10") },
		{ key: "8", level: "8 — Tốt", description: descriptorText(descriptors, "8") },
		{ key: "6", level: "6 — Đạt cơ bản", description: descriptorText(descriptors, "6") },
		{ key: "4", level: "4 — Yếu", description: descriptorText(descriptors, "4") },
		{ key: "0", level: "0 — Không chấm", description: descriptorText(descriptors, "0") },
	]
}

function simulationCriterionRows(
	rubric: GradingRubric,
	scores: NonNullable<SimulateResult["criterion_scores"]>,
) {
	const totalWeight = Object.values(scores).reduce((sum, item) => sum + item.weight, 0)

	return Object.entries(scores).map(([key, value]) => ({
		key,
		criterion: criterionLabelByKey(rubric, key),
		raw: value.raw.toFixed(1),
		capped: value.capped.toFixed(1),
		weight: `${Math.round(value.weight * 100)}%`,
		contribution: totalWeight > 0 ? ((value.capped * value.weight) / totalWeight).toFixed(2) : "0.00",
	}))
}
