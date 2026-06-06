import { ArrowLeftOutlined, CheckOutlined } from "@ant-design/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { App, Button, Card, Empty, Flex, Input, InputNumber, Skeleton, Space, Tag, Typography } from "antd"
import { useState } from "react"
import { PageHeader } from "#/components/PageHeader"
import {
	startTeacherGradingRequest,
	submitTeacherGradingRequest,
	teacherGradingRequestDetailQuery,
} from "#/features/teacher-grading/queries"
import type {
	TeacherGradingAnnotation,
	TeacherGradingCriterion,
	TeacherGradingDiagnostics,
	TeacherGradingRequestItem,
} from "#/features/teacher-grading/types"
import { extractError, formatApiErrorBanner } from "#/lib/api"

export const Route = createFileRoute("/_app/teacher/grading-requests/$requestId")({
	component: TeacherGradingRequestDetailPage,
})

function TeacherGradingRequestDetailPage() {
	const { requestId } = Route.useParams()
	const { message } = App.useApp()
	const qc = useQueryClient()
	const { data, isLoading } = useQuery(teacherGradingRequestDetailQuery(requestId))
	const item = data?.data ?? null
	const [scores, setScores] = useState<Record<string, number>>({})
	const [comments, setComments] = useState<Record<string, string>>({})
	const [strengths, setStrengths] = useState("")
	const [improvements, setImprovements] = useState("")
	const [overallComment, setOverallComment] = useState("")

	const start = useMutation({
		mutationFn: () => startTeacherGradingRequest(requestId),
		onSuccess: async () => {
			message.success("Đã bắt đầu chấm")
			await Promise.all([
				qc.invalidateQueries({ queryKey: ["teacher", "grading-requests", "list"] }),
				qc.invalidateQueries({ queryKey: ["teacher", "grading-requests", "detail", requestId] }),
			])
		},
		onError: async (error) => message.error(formatApiErrorBanner(await extractError(error))),
	})

	const submit = useMutation({
		mutationFn: () => {
			const criteria = item?.attempt?.rubric?.criteria ?? []
			return submitTeacherGradingRequest(requestId, {
				criterion_scores: criteria.map((criterion) => ({
					key: criterion.key,
					score: scores[criterion.key] ?? 0,
					comment: comments[criterion.key]?.trim() || undefined,
				})),
				feedback: {
					strengths: lines(strengths),
					improvements: lines(improvements),
					overall_comment: overallComment.trim() || undefined,
				},
			})
		},
		onSuccess: async () => {
			message.success("Đã nộp điểm giáo viên")
			await Promise.all([
				qc.invalidateQueries({ queryKey: ["teacher", "grading-requests", "list"] }),
				qc.invalidateQueries({ queryKey: ["teacher", "grading-requests", "detail", requestId] }),
				qc.invalidateQueries({ queryKey: ["admin", "notifications"] }),
			])
		},
		onError: async (error) => message.error(formatApiErrorBanner(await extractError(error))),
	})

	if (isLoading) return <Skeleton active />
	if (!item) return <Empty description="Không tìm thấy yêu cầu" />

	const criteria = item.attempt?.rubric?.criteria ?? []
	const canEdit = item.status === "assigned" || item.status === "in_progress"
	const missingCriteria = criteria.filter((criterion) => scores[criterion.key] === undefined)
	const canSubmit = canEdit && criteria.length > 0

	function handleSubmit(): void {
		if (!canEdit) {
			message.warning("Yêu cầu này không còn ở trạng thái có thể chấm.")
			return
		}

		if (missingCriteria.length > 0) {
			message.warning(`Nhập đủ điểm cho: ${missingCriteria.map(criterionLabel).join(", ")}`)
			return
		}

		submit.mutate()
	}

	return (
		<Flex vertical gap={24}>
			<PageHeader
				title="Chấm bài học viên"
				subtitle="Nhập điểm theo rubric. Điểm giáo viên sẽ được lưu riêng với điểm hệ thống."
				extra={
					<Link to="/teacher/grading-requests">
						<Button icon={<ArrowLeftOutlined />}>Quay lại</Button>
					</Link>
				}
			/>

			<Flex gap={16} align="flex-start" wrap="wrap">
				<Card title="Bài làm" style={{ flex: "1 1 520px" }}>
					<Space orientation="vertical" size={16} style={{ width: "100%" }}>
						<AttemptPanel item={item} />
						<AIDiagnosticsPanel item={item} />
					</Space>
				</Card>
				<Card title="Chấm theo rubric" style={{ flex: "1 1 440px" }}>
					{criteria.length === 0 ? (
						<Empty description="Không có rubric" />
					) : (
						<Space orientation="vertical" size={14} style={{ width: "100%" }}>
							<Flex justify="space-between" align="center">
								<Tag color={statusColor(item.status)}>{statusLabel(item.status)}</Tag>
								{item.status === "assigned" && (
									<Button size="small" onClick={() => start.mutate()} loading={start.isPending}>
										Bắt đầu chấm
									</Button>
								)}
							</Flex>
							{criteria.map((criterion) => (
								<CriterionInput
									key={criterion.key}
									criterion={criterion}
									disabled={!canEdit}
									score={scores[criterion.key] ?? existingScore(item, criterion.key)}
									aiScore={aiScore(item, criterion.key)}
									comment={comments[criterion.key] ?? ""}
									onScore={(score) => setScores((prev) => ({ ...prev, [criterion.key]: score }))}
									onComment={(comment) => setComments((prev) => ({ ...prev, [criterion.key]: comment }))}
								/>
							))}
							<Input.TextArea
								value={strengths}
								onChange={(event) => setStrengths(event.target.value)}
								placeholder="Điểm mạnh, mỗi dòng một ý"
								rows={3}
								disabled={!canEdit}
							/>
							<Input.TextArea
								value={improvements}
								onChange={(event) => setImprovements(event.target.value)}
								placeholder="Cần cải thiện, mỗi dòng một ý"
								rows={3}
								disabled={!canEdit}
							/>
							<Input.TextArea
								value={overallComment}
								onChange={(event) => setOverallComment(event.target.value)}
								placeholder="Nhận xét tổng quát"
								rows={4}
								disabled={!canEdit}
							/>
							<Button
								type="primary"
								icon={<CheckOutlined />}
								onClick={handleSubmit}
								loading={submit.isPending}
								disabled={!canSubmit}
							>
								Nộp điểm
							</Button>
						</Space>
					)}
				</Card>
			</Flex>
		</Flex>
	)
}

function AttemptPanel({ item }: { item: TeacherGradingRequestItem }) {
	const attempt = item.attempt
	if (!attempt) return <Empty description="Không có bài làm" />

	const prompt = stringValue(attempt.prompt, "prompt") ?? stringValue(attempt.prompt, "content")
	const responseText =
		stringValue(attempt.response_payload, "text") ?? stringValue(attempt.response_payload, "transcript")

	return (
		<Space orientation="vertical" size={16} style={{ width: "100%" }}>
			<div>
				<Typography.Text type="secondary">Học viên</Typography.Text>
				<Typography.Title level={4} style={{ margin: 0 }}>
					{item.profile?.account?.full_name ?? item.profile?.nickname ?? "—"}
				</Typography.Title>
			</div>
			{prompt && (
				<section>
					<Typography.Text strong>Đề bài</Typography.Text>
					<Typography.Paragraph style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
						{prompt}
					</Typography.Paragraph>
				</section>
			)}
			<section>
				<Typography.Text strong>Bài nộp</Typography.Text>
				<Typography.Paragraph style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
					{responseText ?? "Không có text/transcript trong submission."}
				</Typography.Paragraph>
			</section>
			{attempt.result && (
				<Card size="small" title="Điểm hệ thống">
					<Space orientation="vertical" size={4}>
						<Tag color="blue">Hệ thống</Tag>
						<Typography.Text strong>{attempt.result.overall_band}/10</Typography.Text>
					</Space>
				</Card>
			)}
			{item.teacher_result && (
				<Card size="small" title="Điểm giáo viên">
					<Space orientation="vertical" size={4}>
						<Tag color="green">Giáo viên</Tag>
						<Typography.Text strong>{item.teacher_result.overall_band}/10</Typography.Text>
					</Space>
				</Card>
			)}
		</Space>
	)
}

function AIDiagnosticsPanel({ item }: { item: TeacherGradingRequestItem }) {
	const result = item.attempt?.result ?? null
	const diagnostics = result?.diagnostics ?? null
	const feedback = result?.feedback ?? null

	if (!diagnostics && !feedback) return null

	return (
		<Card size="small" title="Hệ thống phát hiện để tham khảo">
			<Space orientation="vertical" size={12} style={{ width: "100%" }}>
				<Typography.Text type="secondary">
					Các nhận định tự động có thể sai hoặc chưa đủ ngữ cảnh; giáo viên dùng làm tham khảo và quyết định
					điểm cuối.
				</Typography.Text>
				{diagnostics && <DiagnosticsSummary diagnostics={diagnostics} />}
				{diagnostics && <RequirementReference diagnostics={diagnostics} />}
				{diagnostics && <SpeakingReference diagnostics={diagnostics} />}
				{diagnostics && <AnnotationReference annotations={diagnostics.annotations ?? []} />}
				{feedback && <AIFeedbackReference feedback={feedback} />}
			</Space>
		</Card>
	)
}

function DiagnosticsSummary({ diagnostics }: { diagnostics: TeacherGradingDiagnostics }) {
	const summary = diagnostics.summary
	if (!summary) return null

	return (
		<Flex wrap gap={6}>
			<MetricTag label="Số từ" value={summary.word_count} />
			<MetricTag label="Số câu" value={summary.sentence_count} />
			<MetricTag label="Đoạn" value={summary.paragraph_count} />
			<MetricTag label="Tổng lỗi" value={summary.total_error_count} color="red" />
			<MetricTag label="Ngữ pháp" value={summary.grammar_error_count} color="orange" />
			<MetricTag label="Chính tả" value={summary.spelling_error_count} color="volcano" />
			<MetricTag label="Dấu câu" value={summary.punctuation_error_count} color="purple" />
			<MetricTag label="Từ nối" value={summary.linking_word_count} />
			<MetricTag label="Đa dạng từ" value={percent(summary.unique_ratio)} />
		</Flex>
	)
}

function RequirementReference({ diagnostics }: { diagnostics: TeacherGradingDiagnostics }) {
	const word = diagnostics.word_requirement
	const coverage = diagnostics.task_coverage
	const format = diagnostics.format
	const vocab = diagnostics.vocabulary_profile
	const cohesion = diagnostics.cohesion

	if (!word && !coverage && !format && !vocab && !cohesion && !diagnostics.profanity?.found) return null

	return (
		<Space orientation="vertical" size={8} style={{ width: "100%" }}>
			<Typography.Text strong>Yêu cầu/nội dung hệ thống kiểm tra</Typography.Text>
			<Flex wrap gap={6}>
				{word && (
					<Tag color={word.is_met === false ? "red" : word.is_met === true ? "green" : "default"}>
						Từ: {nullableNumber(word.actual)}/{nullableNumber(word.minimum)}
						{word.missing ? ` · thiếu ${word.missing}` : ""}
					</Tag>
				)}
				{coverage && (
					<Tag
						color={
							coverage.covered_points !== null && coverage.covered_points < coverage.required_points
								? "red"
								: "green"
						}
					>
						Ý đề: {nullableNumber(coverage.covered_points)}/{coverage.required_points}
					</Tag>
				)}
				{format?.letter_format_expected && (
					<MetricTag label="Có greeting" value={yesNo(format.has_salutation)} />
				)}
				{format?.letter_format_expected && <MetricTag label="Có closing" value={yesNo(format.has_closing)} />}
				{format?.tone.informal_count !== null && (
					<MetricTag label="Informal words" value={format.tone.informal_count} />
				)}
				{cohesion?.sentence_variety !== null && (
					<MetricTag label="Đa dạng câu" value={roundMetric(cohesion.sentence_variety)} />
				)}
				{vocab?.cefr_weighted_avg !== null && (
					<MetricTag label="CEFR vocab" value={roundMetric(vocab.cefr_weighted_avg)} />
				)}
				{diagnostics.profanity?.found && (
					<Tag color="red">Từ không phù hợp: {diagnostics.profanity.words.join(", ")}</Tag>
				)}
			</Flex>
			{coverage?.requirements && coverage.requirements.length > 0 && (
				<Space orientation="vertical" size={4} style={{ width: "100%" }}>
					{coverage.requirements.map((requirement) => (
						<Flex key={requirement.text} gap={8} align="flex-start">
							<Tag color={requirement.met === false ? "red" : requirement.met === true ? "green" : "default"}>
								{requirement.met === true ? "Đạt" : requirement.met === false ? "Thiếu" : "?"}
							</Tag>
							<Typography.Text style={{ fontSize: 12 }}>{requirement.text}</Typography.Text>
						</Flex>
					))}
				</Space>
			)}
		</Space>
	)
}

function SpeakingReference({ diagnostics }: { diagnostics: TeacherGradingDiagnostics }) {
	const speech = diagnostics.speech
	const fluency = diagnostics.fluency
	const pronunciation = diagnostics.pronunciation

	if (!speech && !fluency && !pronunciation) return null

	return (
		<Space orientation="vertical" size={8} style={{ width: "100%" }}>
			<Typography.Text strong>Chỉ số bài nói</Typography.Text>
			<Flex wrap gap={6}>
				{speech && <MetricTag label="Confidence" value={percent(speech.confidence)} />}
				{fluency && (
					<MetricTag
						label="Tốc độ nói"
						value={fluency.speaking_rate === null ? null : `${roundMetric(fluency.speaking_rate)} wpm`}
					/>
				)}
				{fluency && <MetricTag label="Số pause" value={fluency.pause_count} />}
				{pronunciation && <MetricTag label="Phát âm" value={pronunciation.overall} color="geekblue" />}
			</Flex>
		</Space>
	)
}

function AnnotationReference({ annotations }: { annotations: TeacherGradingAnnotation[] }) {
	if (annotations.length === 0) {
		return <Typography.Text type="secondary">Hệ thống không ghi nhận lỗi ngôn ngữ cụ thể.</Typography.Text>
	}

	return (
		<Space orientation="vertical" size={8} style={{ width: "100%" }}>
			<Typography.Text strong>Nghi vấn lỗi ngôn ngữ hệ thống phát hiện</Typography.Text>
			{annotations.slice(0, 12).map((annotation, index) => (
				<Card key={`${annotation.rule_id}-${annotation.text}-${index}`} size="small">
					<Space orientation="vertical" size={4} style={{ width: "100%" }}>
						<Flex wrap gap={6} align="center">
							<Tag color={annotationColor(annotation.type)}>{annotationTypeLabel(annotation.type)}</Tag>
							{annotation.text && <Tag>{annotation.text}</Tag>}
							{annotation.rule_id && <Typography.Text type="secondary">{annotation.rule_id}</Typography.Text>}
						</Flex>
						<Typography.Text>{annotation.message || annotation.category}</Typography.Text>
						{annotation.suggestions.length > 0 && (
							<Typography.Text type="secondary" style={{ fontSize: 12 }}>
								Gợi ý: {annotation.suggestions.join(", ")}
							</Typography.Text>
						)}
					</Space>
				</Card>
			))}
			{annotations.length > 12 && (
				<Typography.Text type="secondary">
					Còn {annotations.length - 12} lỗi khác trong phân tích tự động.
				</Typography.Text>
			)}
		</Space>
	)
}

function AIFeedbackReference({ feedback }: { feedback: Record<string, unknown> }) {
	const strengths = stringArray(feedback.strengths)
	const improvements = stringArray(feedback.improvements)

	if (strengths.length === 0 && improvements.length === 0) return null

	return (
		<Space orientation="vertical" size={8} style={{ width: "100%" }}>
			<Typography.Text strong>Nhận xét tự động</Typography.Text>
			{strengths.length > 0 && (
				<Typography.Paragraph style={{ marginBottom: 0 }}>
					<Typography.Text type="success">Điểm mạnh: </Typography.Text>
					{strengths.join("; ")}
				</Typography.Paragraph>
			)}
			{improvements.length > 0 && (
				<Typography.Paragraph style={{ marginBottom: 0 }}>
					<Typography.Text type="warning">Cần cải thiện: </Typography.Text>
					{improvements.join("; ")}
				</Typography.Paragraph>
			)}
		</Space>
	)
}

function CriterionInput({
	criterion,
	disabled,
	score,
	aiScore,
	comment,
	onScore,
	onComment,
}: {
	criterion: TeacherGradingCriterion
	disabled: boolean
	score: number | undefined
	aiScore: number | null
	comment: string
	onScore: (score: number) => void
	onComment: (comment: string) => void
}) {
	const maxScore = criterion.max_score ?? 10
	const descriptors = criterionDescriptors(criterion)

	return (
		<Card size="small" title={<CriterionTitle criterion={criterion} />}>
			<Space orientation="vertical" style={{ width: "100%" }} size={8}>
				<Flex gap={6} wrap align="center">
					<Tag color="blue">Trọng số {Math.round(criterion.weight * 100)}%</Tag>
					<Tag>Tối đa {maxScore}</Tag>
					{aiScore !== null && (
						<Tag color="geekblue">
							Hệ thống: {aiScore}/{maxScore}
						</Tag>
					)}
				</Flex>
				{descriptors.length > 0 && (
					<div>
						<Typography.Text type="secondary" style={{ fontSize: 12 }}>
							Mốc điểm tham khảo
						</Typography.Text>
						<Space orientation="vertical" size={4} style={{ width: "100%", marginTop: 6 }}>
							{descriptors.map(([band, description]) => (
								<Flex key={band} gap={8} align="flex-start">
									<Tag color="gold">{band}</Tag>
									<Typography.Text style={{ fontSize: 12 }}>{description}</Typography.Text>
								</Flex>
							))}
						</Space>
					</div>
				)}
				<InputNumber<number>
					min={0}
					max={maxScore}
					step={0.5}
					value={score}
					onChange={(value) => onScore(value ?? 0)}
					disabled={disabled}
					style={{ width: "100%" }}
					placeholder={`Điểm 0–${maxScore}`}
				/>
				<Input.TextArea
					value={comment}
					onChange={(event) => onComment(event.target.value)}
					placeholder="Nhận xét tiêu chí"
					rows={2}
					disabled={disabled}
				/>
			</Space>
		</Card>
	)
}

function lines(value: string): string[] {
	return value
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
}

function MetricTag({
	label,
	value,
	color,
}: {
	label: string
	value: string | number | null | undefined
	color?: string
}) {
	return (
		<Tag color={color}>
			{label}: {value ?? "—"}
		</Tag>
	)
}

function nullableNumber(value: number | null | undefined): string {
	return value === null || value === undefined ? "—" : String(value)
}

function percent(value: number | null | undefined): string | null {
	return value === null || value === undefined ? null : `${roundMetric(value * 100)}%`
}

function yesNo(value: boolean | null | undefined): string | null {
	if (value === null || value === undefined) return null
	return value ? "Có" : "Không"
}

function roundMetric(value: number): string {
	return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function annotationColor(type: TeacherGradingAnnotation["type"]): string {
	switch (type) {
		case "grammar":
			return "orange"
		case "spelling":
			return "volcano"
		case "punctuation":
			return "purple"
		case "style":
			return "cyan"
		default:
			return "default"
	}
}

function annotationTypeLabel(type: TeacherGradingAnnotation["type"]): string {
	switch (type) {
		case "grammar":
			return "Ngữ pháp"
		case "spelling":
			return "Chính tả"
		case "punctuation":
			return "Dấu câu"
		case "style":
			return "Văn phong"
		default:
			return "Khác"
	}
}

function stringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return []

	return value
		.map((item) => {
			if (typeof item === "string") return item
			if (typeof item === "object" && item !== null && "message" in item) {
				const message = item.message
				return typeof message === "string" ? message : null
			}

			return null
		})
		.filter((item): item is string => item !== null && item.trim().length > 0)
}

function existingScore(item: TeacherGradingRequestItem, key: string): number | undefined {
	return item.teacher_result?.criterion_scores.find((score) => score.key === key)?.score
}

function aiScore(item: TeacherGradingRequestItem, key: string): number | null {
	return item.attempt?.result?.criterion_scores.find((score) => score.key === key)?.score ?? null
}

function CriterionTitle({ criterion }: { criterion: TeacherGradingCriterion }) {
	const secondary =
		criterion.name && criterion.name !== criterionLabel(criterion) ? criterion.name : criterion.key

	return (
		<Flex vertical gap={2}>
			<Typography.Text strong>{criterionLabel(criterion)}</Typography.Text>
			<Typography.Text type="secondary" style={{ fontSize: 12 }}>
				{secondary}
			</Typography.Text>
		</Flex>
	)
}

function criterionLabel(criterion: TeacherGradingCriterion): string {
	return criterion.name_vi ?? criterion.label ?? criterion.name ?? criterion.key
}

function criterionDescriptors(criterion: TeacherGradingCriterion): Array<[string, string]> {
	return Object.entries(criterion.band_descriptors ?? {}).sort(
		([leftBand], [rightBand]) => Number(rightBand) - Number(leftBand),
	)
}

function stringValue(record: Record<string, unknown>, key: string): string | null {
	const value = record[key]
	return typeof value === "string" && value.trim() !== "" ? value : null
}

function statusLabel(status: string): string {
	if (status === "assigned") return "Cần chấm"
	if (status === "in_progress") return "Đang chấm"
	if (status === "completed") return "Hoàn thành"
	return status
}

function statusColor(status: string): string {
	if (status === "completed") return "green"
	if (status === "in_progress") return "purple"
	return "blue"
}
