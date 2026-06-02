import { ArrowLeftOutlined, CopyOutlined, EditOutlined, ThunderboltOutlined } from "@ant-design/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import {
	Alert,
	Button,
	Card,
	Collapse,
	Flex,
	Form,
	Input,
	InputNumber,
	message,
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
	type UpdateRubricPayload,
	updateRubric,
} from "#/features/admin-grading/queries"
import { RubricExplanation } from "#/features/admin-grading/RubricExplanation"
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

function RubricDetailPage() {
	const { rubricId } = Route.useParams()
	const queryClient = useQueryClient()
	const navigate = Route.useNavigate()
	const { data, isLoading, isError } = useQuery(rubricDetailQuery(rubricId))
	const rubric = data?.data
	const cloneMutation = useMutation({
		mutationFn: () => cloneRubric(rubricId),
		onSuccess: async (res) => {
			message.success("Đã clone rubric thành draft")
			await queryClient.invalidateQueries({ queryKey: ["admin", "grading-rubrics"] })
			navigate({ to: "/grading/$rubricId", params: { rubricId: res.data.id } })
		},
		onError: async (error) => message.error(formatApiErrorBanner(await extractError(error))),
	})
	const activateMutation = useMutation({
		mutationFn: () => activateRubric(rubricId),
		onSuccess: async () => {
			message.success("Đã activate rubric")
			await queryClient.invalidateQueries({ queryKey: ["admin", "grading-rubrics"] })
		},
		onError: async (error) => message.error(formatApiErrorBanner(await extractError(error))),
	})

	if (isLoading) return <Skeleton active />
	if (isError || !rubric) {
		return (
			<Result
				status="404"
				title="Không tìm thấy tiêu chí"
				subTitle="Rubric này không tồn tại hoặc chưa được tạo trong hệ thống."
				extra={
					<Link to="/grading" search={gradingSearch}>
						<Button type="primary">Quay lại danh sách</Button>
					</Link>
				}
			/>
		)
	}

	return (
		<Flex vertical gap={24}>
			<Link to="/grading" search={gradingSearch}>
				<Button type="link" icon={<ArrowLeftOutlined />} style={{ paddingLeft: 0 }}>
					Quay lại
				</Button>
			</Link>

			<PageHeader
				title={rubric.name}
				subtitle={`${rubric.skill === "writing" ? "Writing" : "Speaking"} · Version ${rubric.version}`}
				action={
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
								Kích hoạt version này
							</Button>
						)}
					</Space>
				}
			/>

			<Card size="small">
				<Flex justify="space-between" align="center" wrap="wrap" gap={12}>
					<div>
						<Typography.Text strong>Thao tác version</Typography.Text>
						<br />
						<Typography.Text type="secondary">
							Active rubric không sửa trực tiếp. Hãy tạo bản nháp, chỉnh policy rồi kích hoạt.
						</Typography.Text>
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
								Kích hoạt version này
							</Button>
						)}
					</Space>
				</Flex>
			</Card>

			<LifecycleBanner rubric={rubric} />

			<RubricSummary rubric={rubric} />

			<Tabs
				items={[
					{ key: "overview", label: "Tổng quan", children: <OverviewTab rubric={rubric} /> },
					{ key: "policy", label: "Điều kiện chấm", children: <PolicyEditor rubric={rubric} /> },
					{ key: "criteria", label: "Template tiêu chí", children: <CriteriaTab rubric={rubric} /> },
					{ key: "simulator", label: "Mô phỏng", children: <SimulatorTab rubric={rubric} /> },
				]}
			/>
		</Flex>
	)
}

function RubricSummary({ rubric }: { rubric: GradingRubric }) {
	const gates = rubric.policy_summary.assessment_gates
	const wordRules = rubric.policy_summary.word_rules
	return (
		<Flex gap={12} wrap="wrap">
			<Card size="small" title="Version" style={{ width: 240 }}>
				<Typography.Text>
					{rubric.skill === "writing" ? "Writing" : "Speaking"} · v{rubric.version}
				</Typography.Text>
				<br />
				<Typography.Text type="secondary">{rubric.scoring_formula}</Typography.Text>
			</Card>
			{gates && (
				<Card size="small" title="Không chấm điểm khi" style={{ width: 320 }}>
					<Typography.Text>Task 1 &lt; {gates.severe_minimum_words_task1} từ</Typography.Text>
					<br />
					<Typography.Text>Task 2 &lt; {gates.severe_minimum_words_task2} từ</Typography.Text>
					<br />
					<Typography.Text>Coverage &lt; {gates.minimum_covered_points} ý</Typography.Text>
				</Card>
			)}
			{wordRules && (
				<Card size="small" title="Yêu cầu chuẩn" style={{ width: 260 }}>
					<Typography.Text>Task 1: {wordRules.official_minimum_task1} từ</Typography.Text>
					<br />
					<Typography.Text>Task 2: {wordRules.official_minimum_task2} từ</Typography.Text>
				</Card>
			)}
			<Card size="small" title="Tiêu chí" style={{ width: 220 }}>
				<Typography.Text>{rubric.criteria.length} tiêu chí</Typography.Text>
				<br />
				<Typography.Text type="secondary">
					Tổng weight:{" "}
					{Math.round(
						Object.values(rubric.policy_summary.criteria_weights).reduce((sum, w) => sum + w, 0) * 100,
					)}
					%
				</Typography.Text>
			</Card>
		</Flex>
	)
}

interface PolicyFormValues {
	name: string
	severe_minimum_words_task1: number
	severe_minimum_words_task2: number
	minimum_covered_points: number
	official_minimum_task1: number
	official_minimum_task2: number
	short_response_caps: Array<{ max_words: number; cap: number }>
	task_fulfillment_word_caps: Array<{ max_words: number; cap: number }>
}

function LifecycleBanner({ rubric }: { rubric: GradingRubric }) {
	const status = rubric.lifecycle.status
	const config = {
		active: {
			type: "success" as const,
			title: "ACTIVE · Chỉ đọc",
			description:
				rubric.lifecycle.read_only_reason ??
				"Rubric này đang dùng để chấm bài mới. Clone để chỉnh version tiếp theo.",
		},
		draft: {
			type: "warning" as const,
			title: "DRAFT · Có thể chỉnh sửa",
			description: "Bạn đang chỉnh bản nháp. Thay đổi chỉ áp dụng sau khi kích hoạt version này.",
		},
		archived: {
			type: "info" as const,
			title: "ARCHIVED · Chỉ đọc",
			description: rubric.lifecycle.read_only_reason ?? "Rubric đã lưu để truy vết kết quả lịch sử.",
		},
	}[status]

	return <Alert showIcon type={config.type} message={config.title} description={config.description} />
}

function OverviewTab({ rubric }: { rubric: GradingRubric }) {
	return <RubricExplanation rubric={rubric} />
}

function PolicyEditor({ rubric }: { rubric: GradingRubric }) {
	const [form] = Form.useForm()
	const queryClient = useQueryClient()
	const editable = rubric.lifecycle.is_editable && rubric.skill === "writing"
	const summary = rubric.policy_summary
	const updateMutation = useMutation({
		mutationFn: (values: PolicyFormValues) => updateRubric(rubric.id, toUpdatePayload(values)),
		onSuccess: async () => {
			message.success("Đã lưu draft policy")
			await queryClient.invalidateQueries({ queryKey: ["admin", "grading-rubrics", "detail", rubric.id] })
		},
		onError: async (error) => message.error(formatApiErrorBanner(await extractError(error))),
	})

	if (!summary.assessment_gates || !summary.word_rules) {
		return <Alert type="info" showIcon message="Policy editor hiện hỗ trợ Writing rubric." />
	}

	return (
		<Form
			form={form}
			layout="vertical"
			disabled={!editable || updateMutation.isPending}
			initialValues={{
				name: rubric.name,
				...summary.assessment_gates,
				...summary.word_rules,
			}}
			onFinish={(values) => updateMutation.mutate(values)}
		>
			<Flex gap={16} align="flex-start">
				<Flex vertical gap={16} flex={1}>
					<Card title="Khi nào không chấm điểm?" extra={<Tag color="red">Không hiển thị điểm</Tag>}>
						<Alert
							showIcon
							type="error"
							message="Fail các điều kiện này thì bài không đủ dữ liệu để chấm theo rubric."
							style={{ marginBottom: 16 }}
						/>
						<Flex gap={12} wrap="wrap">
							<Form.Item name="severe_minimum_words_task1" label="Task 1 dưới bao nhiêu từ thì không chấm?">
								<InputNumber min={1} addonAfter="words" />
							</Form.Item>
							<Form.Item name="severe_minimum_words_task2" label="Task 2 dưới bao nhiêu từ thì không chấm?">
								<InputNumber min={1} addonAfter="words" />
							</Form.Item>
							<Form.Item name="minimum_covered_points" label="Cần trả lời ít nhất bao nhiêu ý?">
								<InputNumber min={1} />
							</Form.Item>
						</Flex>
					</Card>
					<Card title="Thiếu số từ nhưng vẫn chấm" extra={<Tag color="orange">Cảnh báo / giới hạn điểm</Tag>}>
						<Alert
							showIcon
							type="warning"
							message="Dưới mức chuẩn nhưng vượt ngưỡng không chấm thì vẫn được chấm, checklist sẽ cảnh báo và cap có thể giới hạn điểm."
							style={{ marginBottom: 16 }}
						/>
						<Flex gap={12} wrap="wrap">
							<Form.Item name="official_minimum_task1" label="Task 1 yêu cầu chuẩn">
								<InputNumber min={1} addonAfter="words" />
							</Form.Item>
							<Form.Item name="official_minimum_task2" label="Task 2 yêu cầu chuẩn">
								<InputNumber min={1} addonAfter="words" />
							</Form.Item>
						</Flex>
						<CapEditor name="short_response_caps" title="Giới hạn toàn bộ điểm khi bài quá ngắn" />
						<CapEditor name="task_fulfillment_word_caps" title="Giới hạn riêng điểm hoàn thành yêu cầu" />
					</Card>
					<Card title="Thông tin version">
						<Form.Item name="name" label="Tên rubric">
							<Input />
						</Form.Item>
					</Card>
					{editable && (
						<Button
							type="primary"
							htmlType="submit"
							icon={<EditOutlined />}
							loading={updateMutation.isPending}
						>
							Lưu bản nháp
						</Button>
					)}
				</Flex>
				<PolicyPreview />
			</Flex>
		</Form>
	)
}

function CapEditor({ name, title }: { name: string; title: string }) {
	return (
		<Form.List name={name}>
			{(fields, { add, remove }) => (
				<Card
					size="small"
					title={title}
					style={{ marginTop: 12 }}
					extra={
						<Button size="small" onClick={() => add({ max_words: 0, cap: 1 })}>
							Thêm dòng
						</Button>
					}
				>
					{fields.map((field) => (
						<Space key={field.key} align="baseline">
							<Form.Item name={[field.name, "max_words"]} label="Tối đa số từ">
								<InputNumber min={1} />
							</Form.Item>
							<Form.Item name={[field.name, "cap"]} label="Điểm tối đa">
								<InputNumber min={1} max={10} step={0.5} />
							</Form.Item>
							<Button danger onClick={() => remove(field.name)}>
								Xóa
							</Button>
						</Space>
					))}
				</Card>
			)}
		</Form.List>
	)
}

function PolicyPreview() {
	const values = Form.useWatch([], Form.useFormInstance()) ?? {}
	const task1HardStop = Number(values.severe_minimum_words_task1 ?? 0)
	const task2HardStop = Number(values.severe_minimum_words_task2 ?? 0)
	return (
		<Card title="Tóm tắt tác động" style={{ width: 320 }}>
			<Space direction="vertical">
				<Typography.Text>Task 1 dưới {task1HardStop} từ: không chấm điểm.</Typography.Text>
				<Typography.Text>Task 2 dưới {task2HardStop} từ: không chấm điểm.</Typography.Text>
				<Typography.Text>
					Coverage thấp hơn {values.minimum_covered_points ?? 1}: không chấm điểm.
				</Typography.Text>
			</Space>
		</Card>
	)
}

function toUpdatePayload(values: PolicyFormValues): UpdateRubricPayload {
	return {
		name: values.name,
		policy: {
			assessment_gates: {
				severe_minimum_words_task1: values.severe_minimum_words_task1,
				severe_minimum_words_task2: values.severe_minimum_words_task2,
				minimum_covered_points: values.minimum_covered_points,
			},
			word_rules: {
				official_minimum_task1: values.official_minimum_task1,
				official_minimum_task2: values.official_minimum_task2,
				short_response_caps: values.short_response_caps,
				task_fulfillment_word_caps: values.task_fulfillment_word_caps,
			},
		},
	}
}

function CriteriaTab({ rubric }: { rubric: GradingRubric }) {
	return (
		<Flex vertical gap={16}>
			<Flex justify="space-between" align="center">
				<div>
					<Typography.Title level={4} style={{ margin: 0 }}>
						Template tiêu chí ({rubric.criteria.length})
					</Typography.Title>
					<Typography.Text type="secondary">
						Template định nghĩa bài được chấm theo những tiêu chí nào. Admin chỉnh policy và trọng số ở
						version, không sửa cấu trúc active trực tiếp.
					</Typography.Text>
				</div>
				<Tag color="blue">Template</Tag>
			</Flex>

			<Alert
				showIcon
				type="info"
				message="Kiến trúc: Template tiêu chí + Version rubric + Policy chấm điểm"
				description="Template giữ cấu trúc tiêu chí ổn định để kết quả chấm nhất quán. Version rubric lưu policy, trọng số và trạng thái active/draft. Muốn thay đổi cách chấm, tạo draft version rồi kích hoạt."
			/>

			<Flex gap={16} wrap="wrap">
				{rubric.criteria.map((criterion) => (
					<CriterionCard key={criterion.key} criterion={criterion} />
				))}
			</Flex>

			<Collapse
				items={rubric.criteria.map((c: Criterion) => ({
					key: c.key,
					label: `${c.name_vi ?? c.name} — mô tả band`,
					children: <BandDescriptorTable descriptors={c.band_descriptors} />,
				}))}
			/>
		</Flex>
	)
}

function CriterionCard({ criterion }: { criterion: Criterion }) {
	const percent = Math.round(criterion.weight * 100)

	return (
		<Card size="small" style={{ width: 260 }}>
			<Flex vertical gap={8}>
				<Flex justify="space-between" align="start">
					<div>
						<Typography.Text strong>{criterion.name_vi ?? criterion.name}</Typography.Text>
						<br />
						<Typography.Text type="secondary" style={{ fontSize: 12 }}>
							{criterion.name}
						</Typography.Text>
					</div>
					<Tag color="blue">{percent}%</Tag>
				</Flex>
				<Space direction="vertical" size={2}>
					<Typography.Text type="secondary">Key: {criterion.key}</Typography.Text>
					<Typography.Text type="secondary">Điểm tối đa: {criterion.max_score}</Typography.Text>
					<Typography.Text type="secondary">Trọng số: {percent}%</Typography.Text>
				</Space>
			</Flex>
		</Card>
	)
}

function SimulatorTab({ rubric }: { rubric: GradingRubric }) {
	const gates = rubric.policy_summary.assessment_gates
	const [part, setPart] = useState<1 | 2>(1)
	const [wordCount, setWordCount] = useState(36)
	const [covered, setCovered] = useState(0)
	if (!gates) {
		return <Alert showIcon type="info" message="Mô phỏng Speaking sẽ bổ sung sau." />
	}
	const severeMin = part === 1 ? gates.severe_minimum_words_task1 : gates.severe_minimum_words_task2
	const failedWords = wordCount < severeMin
	const failedCoverage = covered < gates.minimum_covered_points
	const assessable = !failedWords && !failedCoverage

	return (
		<Flex gap={16} align="flex-start">
			<Card title="Nhập tình huống" style={{ width: 360 }}>
				<Space direction="vertical" style={{ width: "100%" }}>
					<Space>
						<Button type={part === 1 ? "primary" : "default"} onClick={() => setPart(1)}>
							Task 1
						</Button>
						<Button type={part === 2 ? "primary" : "default"} onClick={() => setPart(2)}>
							Task 2
						</Button>
					</Space>
					<Space direction="vertical">
						<Typography.Text>Số từ</Typography.Text>
						<InputNumber
							style={{ width: "100%" }}
							min={0}
							value={wordCount}
							onChange={(v) => setWordCount(Number(v ?? 0))}
						/>
					</Space>
					<Space direction="vertical">
						<Typography.Text>Số ý đã trả lời</Typography.Text>
						<InputNumber
							style={{ width: "100%" }}
							min={0}
							max={10}
							value={covered}
							onChange={(v) => setCovered(Number(v ?? 0))}
						/>
					</Space>
				</Space>
			</Card>
			<Card title="Kết quả mô phỏng" style={{ flex: 1 }}>
				<Alert
					showIcon
					type={assessable ? "success" : "error"}
					message={assessable ? "Được chấm điểm" : "Không đủ điều kiện chấm"}
					description={
						assessable
							? "Bài sẽ hiển thị điểm, rubric breakdown và có thể mua nhận xét AI."
							: "Bài chỉ hiển thị checklist lỗi và hướng dẫn viết lại; không hiển thị điểm thành phần."
					}
				/>
				<Space direction="vertical" style={{ marginTop: 16 }}>
					<Typography.Text type={failedWords ? "danger" : "success"}>
						{failedWords ? "✕" : "✓"} Số từ: {wordCount}/{severeMin} tối thiểu để được chấm
					</Typography.Text>
					<Typography.Text type={failedCoverage ? "danger" : "success"}>
						{failedCoverage ? "✕" : "✓"} Coverage: {covered}/{gates.minimum_covered_points} ý tối thiểu
					</Typography.Text>
				</Space>
			</Card>
		</Flex>
	)
}

function BandDescriptorTable({ descriptors }: { descriptors: string[] }) {
	const rows = descriptors.map((desc, idx) => ({ band: idx, description: desc }))
	return (
		<Table
			size="small"
			pagination={false}
			dataSource={rows}
			rowKey="band"
			columns={[
				{ title: "Band", dataIndex: "band", width: 70 },
				{ title: "Mô tả", dataIndex: "description" },
			]}
		/>
	)
}
