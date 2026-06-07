import { ArrowLeftOutlined } from "@ant-design/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
	App,
	Button,
	Card,
	Descriptions,
	Empty,
	Flex,
	Input,
	Select,
	Skeleton,
	Space,
	Tag,
	Typography,
} from "antd"
import { useState } from "react"
import { PageHeader } from "#/components/PageHeader"
import { teacherOptionsQuery } from "#/features/admin-courses/queries"
import {
	adminTeacherGradingRequestDetailQuery,
	assignTeacherGradingRequest,
	rejectTeacherGradingRequest,
} from "#/features/teacher-grading/queries"
import { SpeakingAudioPlayer, speakingAudioSource } from "#/features/teacher-grading/SpeakingAudioPlayer"
import type {
	TeacherGradingRequestItem,
	TeacherGradingRequestStatus,
	TeacherGradingResult,
} from "#/features/teacher-grading/types"
import { formatDateTime } from "#/lib/utils"

export const Route = createFileRoute("/_app/grading-requests/$requestId")({
	component: GradingRequestDetailPage,
})

const STATUS_META: Record<TeacherGradingRequestStatus, { color: string; label: string }> = {
	pending_assignment: { color: "gold", label: "Chờ gán" },
	assigned: { color: "blue", label: "Đã gán" },
	in_progress: { color: "purple", label: "Đang chấm" },
	completed: { color: "green", label: "Hoàn thành" },
	cancelled: { color: "default", label: "Đã hủy" },
	rejected: { color: "red", label: "Từ chối" },
}

function GradingRequestDetailPage() {
	const { requestId } = Route.useParams()
	const { message } = App.useApp()
	const qc = useQueryClient()
	const { data, isLoading } = useQuery(adminTeacherGradingRequestDetailQuery(requestId))
	const { data: teachers } = useQuery(teacherOptionsQuery())
	const item = data?.data ?? null
	const [teacherId, setTeacherId] = useState<string>()
	const [staffNote, setStaffNote] = useState("")

	const assign = useMutation({
		mutationFn: () =>
			assignTeacherGradingRequest(requestId, {
				teacher_id: teacherId ?? item?.assigned_teacher?.id ?? "",
				staff_note: staffNote || undefined,
			}),
		onSuccess: () => {
			message.success("Đã gán giáo viên")
			qc.invalidateQueries({ queryKey: ["admin", "teacher-grading-requests"] })
			qc.invalidateQueries({ queryKey: ["admin", "notifications"] })
		},
	})

	const reject = useMutation({
		mutationFn: () => rejectTeacherGradingRequest(requestId, staffNote || undefined),
		onSuccess: () => {
			message.success("Đã từ chối yêu cầu")
			qc.invalidateQueries({ queryKey: ["admin", "teacher-grading-requests"] })
		},
	})

	if (isLoading) return <Skeleton active />
	if (!item) return <Empty description="Không tìm thấy yêu cầu" />

	const canAssign = !["completed", "cancelled", "rejected"].includes(item.status)

	return (
		<Flex vertical gap={24}>
			<PageHeader
				title="Chi tiết yêu cầu chấm"
				subtitle="Xem bài làm, điểm AI và điểm giáo viên riêng biệt."
				extra={
					<Link to="/grading-requests">
						<Button icon={<ArrowLeftOutlined />}>Quay lại</Button>
					</Link>
				}
			/>

			<Flex gap={16} align="flex-start" wrap="wrap">
				<Card title="Thông tin yêu cầu" style={{ flex: "1 1 420px" }}>
					<RequestDescriptions item={item} />
				</Card>
				<Card title="Gán giáo viên" style={{ flex: "1 1 360px" }}>
					<Space orientation="vertical" style={{ width: "100%" }} size={12}>
						<Select
							showSearch
							value={teacherId ?? item.assigned_teacher?.id}
							placeholder="Chọn giáo viên"
							style={{ width: "100%" }}
							optionFilterProp="label"
							options={(teachers?.data ?? []).map((teacher) => ({
								value: teacher.id,
								label: `${teacher.full_name} (${teacher.email})`,
							}))}
							onChange={setTeacherId}
							disabled={!canAssign}
						/>
						<Input.TextArea
							value={staffNote}
							onChange={(event) => setStaffNote(event.target.value)}
							placeholder="Ghi chú cho giáo viên/staff"
							rows={4}
							disabled={!canAssign}
						/>
						<Space>
							<Button
								type="primary"
								onClick={() => assign.mutate()}
								loading={assign.isPending}
								disabled={!canAssign || !(teacherId ?? item.assigned_teacher?.id)}
							>
								Gán giáo viên
							</Button>
							<Button danger onClick={() => reject.mutate()} loading={reject.isPending} disabled={!canAssign}>
								Từ chối
							</Button>
						</Space>
					</Space>
				</Card>
			</Flex>

			<AttemptContent item={item} />
		</Flex>
	)
}

function RequestDescriptions({ item }: { item: TeacherGradingRequestItem }) {
	const meta = STATUS_META[item.status]
	return (
		<Descriptions column={1} size="small" bordered>
			<Descriptions.Item label="Trạng thái">
				<Tag color={meta.color}>{meta.label}</Tag>
			</Descriptions.Item>
			<Descriptions.Item label="Học viên">
				{item.profile?.account?.full_name ?? item.profile?.nickname ?? "—"}
			</Descriptions.Item>
			<Descriptions.Item label="Email">{item.profile?.account?.email ?? "—"}</Descriptions.Item>
			<Descriptions.Item label="Kỹ năng">
				{item.attempt?.skill === "speaking" ? "Nói" : "Viết"}
			</Descriptions.Item>
			<Descriptions.Item label="Ngày gửi">{formatDateTime(item.requested_at)}</Descriptions.Item>
			<Descriptions.Item label="Giáo viên">
				{item.assigned_teacher?.full_name ?? "Chưa gán"}
			</Descriptions.Item>
			<Descriptions.Item label="Ghi chú học viên">{item.student_note ?? "—"}</Descriptions.Item>
		</Descriptions>
	)
}

function AttemptContent({ item }: { item: TeacherGradingRequestItem }) {
	const attempt = item.attempt
	if (!attempt) return null

	const prompt = stringValue(attempt.prompt, "prompt") ?? stringValue(attempt.prompt, "content")
	const responseText =
		stringValue(attempt.response_payload, "text") ?? stringValue(attempt.response_payload, "transcript")
	const audio = speakingAudioSource(attempt.response_payload)

	return (
		<Flex gap={16} align="flex-start" wrap="wrap">
			<Card title="Bài làm" style={{ flex: "1 1 520px" }}>
				<Space orientation="vertical" style={{ width: "100%" }} size={16}>
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
					{attempt.skill === "speaking" && <SpeakingAudioPlayer source={audio} />}
				</Space>
			</Card>
			<Card title="Điểm" style={{ flex: "1 1 360px" }}>
				<Space orientation="vertical" style={{ width: "100%" }} size={16}>
					<ResultSummary title="Điểm AI" result={attempt.result} empty="Chưa có điểm AI." />
					<ResultSummary
						title="Điểm giáo viên"
						result={item.teacher_result}
						empty="Chưa có điểm giáo viên."
					/>
				</Space>
			</Card>
		</Flex>
	)
}

function ResultSummary({
	title,
	result,
	empty,
}: {
	title: string
	result: TeacherGradingResult | null
	empty: string
}) {
	if (!result) return <Typography.Text type="secondary">{empty}</Typography.Text>

	const isTeacher = result.source === "teacher"

	return (
		<Space orientation="vertical" style={{ width: "100%" }} size={8}>
			<Flex justify="space-between" align="center">
				<Typography.Text strong>{title}</Typography.Text>
				<Tag color={isTeacher ? "green" : "blue"}>{isTeacher ? "Giáo viên" : "AI"}</Tag>
			</Flex>
			<Typography.Title level={2} style={{ margin: 0 }}>
				{result.overall_band}/10
			</Typography.Title>
			{result.criterion_scores.map((score) => (
				<div key={score.key}>
					<Typography.Text strong>{score.key}</Typography.Text>: {score.score}
				</div>
			))}
		</Space>
	)
}

function stringValue(record: Record<string, unknown>, key: string): string | null {
	const value = record[key]
	return typeof value === "string" && value.trim() !== "" ? value : null
}
