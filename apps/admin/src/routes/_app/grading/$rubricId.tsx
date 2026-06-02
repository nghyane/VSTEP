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
	Radio,
	Result,
	Skeleton,
	Space,
	Table,
	Tag,
	Typography,
} from "antd"
import { useState } from "react"
import { PageHeader } from "#/components/PageHeader"
import {
	activateRubric,
	cloneRubric,
	rubricDetailQuery,
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
	const gates = rubric.policy_summary.assessment_gates
	const rules = rubric.policy_summary.word_rules
	const weights = rubric.policy_summary.criteria_weights

	return (
		<Flex vertical gap={16}>
			<PolicySummaryCards
				gates={gates}
				rules={rules}
				weights={weights}
				criteriaCount={rubric.criteria.length}
			/>

			<Card title="Template tiêu chí" size="small">
				<Typography.Text type="secondary">
					Bộ tiêu chí được cố định theo template {rubric.skill === "writing" ? "Writing" : "Speaking"}. Admin
					chỉnh trọng số và policy trong từng version.
				</Typography.Text>
				<Flex gap={12} wrap="wrap" style={{ marginTop: 12 }}>
					{rubric.criteria.map((criterion) => (
						<Card key={criterion.key} size="small" style={{ width: 200 }}>
							<Flex justify="space-between" align="center">
								<div>
									<Typography.Text strong>{criterion.name_vi ?? criterion.name}</Typography.Text>
									<br />
									<Typography.Text type="secondary" style={{ fontSize: 12 }}>
										{criterion.name}
									</Typography.Text>
								</div>
								<Tag>{Math.round(criterion.weight * 100)}%</Tag>
							</Flex>
						</Card>
					))}
				</Flex>
			</Card>

			<Collapse
				items={rubric.criteria.map((c: Criterion) => ({
					key: c.key,
					label: `Mô tả band — ${c.name_vi ?? c.name}`,
					children: <BandDescriptorTable descriptors={c.band_descriptors} />,
				}))}
			/>

			<Card>
				<Flex align="center" justify="center" style={{ minHeight: 80 }}>
					<Space direction="vertical" align="center">
						<Typography.Text type="secondary">Muốn thay đổi policy hoặc trọng số?</Typography.Text>
						<Button
							type="primary"
							icon={<CopyOutlined />}
							loading={cloneMutation.isPending}
							onClick={() => cloneMutation.mutate()}
						>
							Tạo bản nháp mới từ version này
						</Button>
					</Space>
				</Flex>
			</Card>
		</Flex>
	)
}

// ─── Policy Summary Cards ──────────────────────────────────────────

function PolicySummaryCards({
	gates,
	rules,
	weights,
	criteriaCount,
}: {
	gates: GradingRubric["policy_summary"]["assessment_gates"]
	rules: GradingRubric["policy_summary"]["word_rules"]
	weights: Record<string, number>
	criteriaCount: number
}) {
	const totalWeight = Math.round(Object.values(weights).reduce((a, b) => a + b, 0) * 100)

	return (
		<Flex gap={12} wrap="wrap">
			{gates && (
				<Card size="small" title="Không chấm điểm khi" style={{ flex: 1, minWidth: 260 }}>
					<Typography.Text>Task 1 dưới {gates.severe_minimum_words_task1} từ</Typography.Text>
					<br />
					<Typography.Text>Task 2 dưới {gates.severe_minimum_words_task2} từ</Typography.Text>
					<br />
					<Typography.Text>Trả lời dưới {gates.minimum_covered_points} ý trong đề</Typography.Text>
					{rubric.policy_summary.system_gates && (
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
				<Card size="small" title="Yêu cầu số từ chuẩn" style={{ flex: 1, minWidth: 200 }}>
					<Typography.Text>Task 1: {rules.official_minimum_task1} từ</Typography.Text>
					<br />
					<Typography.Text>Task 2: {rules.official_minimum_task2} từ</Typography.Text>
				</Card>
			)}
			<Card size="small" title="Tiêu chí & trọng số" style={{ flex: 1, minWidth: 180 }}>
				<Typography.Text>{criteriaCount} tiêu chí</Typography.Text>
				<br />
				<Typography.Text type="secondary">Tổng trọng số: {totalWeight}%</Typography.Text>
			</Card>
		</Flex>
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

	if (!summary.assessment_gates || !summary.word_rules) {
		return (
			<Alert type="info" showIcon message="Trình chỉnh policy hiện chỉ hỗ trợ rubrics Writing." />
		)
	}

	return (
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
							<Radio value="strict">Chặt — từ chối sớm, cap điểm thấp</Radio>
							<Radio value="standard">Tiêu chuẩn — cân bằng</Radio>
							<Radio value="lenient">Thoáng — ít từ chối, cap điểm cao</Radio>
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
					<Button icon={<ThunderboltOutlined />} loading={activateMutation.isPending} onClick={() => activateMutation.mutate()}>
						Kích hoạt
					</Button>
				</Flex>

				<SimulatorSection rubric={rubric} />
			</Flex>
		</Form>
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

	if (!gates) {
		return <Alert showIcon type="info" message="Mô phỏng chỉ khả dụng cho Writing rubric." />
	}

	return (
		<Card title="Mô phỏng chính sách">
			<Flex gap={16} align="flex-start" wrap="wrap">
				{/* ── Input ── */}
				<Card size="small" title="Nhập tình huống thử" style={{ width: 340 }}>
					<Space direction="vertical" style={{ width: "100%" }}>
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

				{/* ── Result ── */}
				{result && (
					<Card size="small" title="Kết quả" style={{ flex: 1, minWidth: 360 }}>
						<Alert
							showIcon
							type={result.assessable ? "success" : "error"}
							message={result.assessable ? "Được chấm điểm" : "Không đủ điều kiện chấm"}
							description={
								result.assessable
									? "Bài sẽ hiển thị điểm thành phần và cho phép mua nhận xét AI."
									: "Bài chỉ hiển thị checklist và hướng dẫn viết lại."
							}
						/>

						<Space direction="vertical" style={{ marginTop: 12, width: "100%" }}>
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

						{result.assessable && result.overall_band !== null && (
							<>
								<Flex align="center" gap={12} style={{ marginTop: 12 }}>
									<Typography.Text style={{ fontSize: 48, fontWeight: 800 }}>
										{result.overall_band.toFixed(1)}
									</Typography.Text>
									<Typography.Text type="secondary">/ 10</Typography.Text>
								</Flex>

								{result.criterion_scores && (
									<Space direction="vertical" style={{ marginTop: 8 }}>
										{Object.entries(result.criterion_scores).map(([key, val]) => (
											<Typography.Text key={key} type="secondary" style={{ fontSize: 13 }}>
												{key}: {val.raw.toFixed(1)}
												{val.capped !== val.raw ? ` → ${val.capped.toFixed(1)}` : ""}
												{" · "}×{Math.round(val.weight * 100)}%
											</Typography.Text>
										))}
									</Space>
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

// ─── Form Cap List ─────────────────────────────────────────────────

function FormCapList({ name, title, description }: { name: string; title: string; description: string }) {
	return (
		<Form.List name={name}>
			{(fields, { add, remove }) => (
				<Card
					size="small"
					title={title}
					style={{ marginTop: 12 }}
					extra={
						<Button size="small" onClick={() => add({ max_words: 0, cap: 1 })}>
							Thêm
						</Button>
					}
				>
					<Typography.Text type="secondary" style={{ marginBottom: 8, display: "block" }}>
						{description}
					</Typography.Text>
					{fields.map((field) => (
						<Space key={field.key} align="baseline" style={{ marginBottom: 8 }}>
							<Typography.Text>≤</Typography.Text>
							<Form.Item {...field} name={[field.name, "max_words"]} noStyle>
								<InputNumber min={1} />
							</Form.Item>
							<Typography.Text>từ → tối đa</Typography.Text>
							<Form.Item {...field} name={[field.name, "cap"]} noStyle>
								<InputNumber min={1} max={10} step={0.5} />
							</Form.Item>
							<Typography.Text>điểm</Typography.Text>
							<Button danger size="small" onClick={() => remove(field.name)}>
								Xóa
							</Button>
						</Space>
					))}
				</Card>
			)}
		</Form.List>
	)
}

// ─── Derived Values ───────────────────────────────────────────────

const SEVERITY_DERIVED: Record<string, {
	gates: { task1: number; task2: number }
	caps: string[]
	tfCaps: string[]
}> = {
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
	const severity: keyof typeof SEVERITY_DERIVED = form.getFieldValue("severity") ?? rubric.policy_summary.severity ?? "standard"
	const derived = SEVERITY_DERIVED[severity] ?? SEVERITY_DERIVED.standard

	return (
		<Card size="small" title="Thông số được sinh từ preset" style={{ marginTop: 12 }}>
			<Space direction="vertical">
				<Typography.Text type="secondary" style={{ fontSize: 12 }}>
					Không chấm: Task 1 &lt; {derived.gates.task1} từ · Task 2 &lt; {derived.gates.task2} từ
				</Typography.Text>
				<Typography.Text type="secondary" style={{ fontSize: 12 }}>
					Cap toàn bộ: {derived.caps.join(" · ") || "không"}
				</Typography.Text>
				<Typography.Text type="secondary" style={{ fontSize: 12 }}>
					Cap TF: {derived.tfCaps.join(" · ") || "không"}
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
