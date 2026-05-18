import { Alert, Col, Flex, Row } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Select } from "#/components/Select"
import { Switch } from "#/components/Switch"
import { Textarea } from "#/components/Textarea"
import type {
	AdminSpeakingTask,
	SpeakingTaskFormInput,
	SpeakingTaskType,
} from "#/features/admin-practice/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminSpeakingTask
	onSubmit: (input: SpeakingTaskFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

const TASK_TYPES: SpeakingTaskType[] = ["social", "solution", "topic"]

export function SpeakingTaskForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [slug, setSlug] = useState(initial?.slug ?? "")
	const [title, setTitle] = useState(initial?.title ?? "")
	const [part, setPart] = useState<1 | 2 | 3>(initial?.part ?? 1)
	const [taskType, setTaskType] = useState<SpeakingTaskType>(initial?.task_type ?? "social")
	const [minutes, setMinutes] = useState(initial?.estimated_minutes ?? 5)
	const [speakingSeconds, setSpeakingSeconds] = useState(initial?.speaking_seconds ?? 90)
	const [isPublished, setIsPublished] = useState(initial?.is_published ?? false)
	const [contentJson, setContentJson] = useState(JSON.stringify(initial?.content ?? {}, null, 2))

	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)
	const [jsonError, setJsonError] = useState<string | null>(null)

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		setJsonError(null)

		let content: Record<string, unknown>
		try {
			const parsed = JSON.parse(contentJson) as unknown
			if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
				setJsonError("Content phải là object JSON.")
				return
			}
			content = parsed as Record<string, unknown>
		} catch {
			setJsonError("JSON không hợp lệ.")
			return
		}

		try {
			await onSubmit({
				slug,
				title,
				part,
				task_type: taskType,
				content,
				estimated_minutes: minutes,
				speaking_seconds: speakingSeconds,
				is_published: isPublished,
			})
		} catch (err) {
			const x = await extractError(err)
			if (x.errors) {
				setErrors(x.errors)
				setGeneric(Object.values(x.errors).flat().join(" • ") || x.message)
			} else {
				setGeneric(x.message)
			}
		}
	}

	return (
		<form onSubmit={handle}>
			<Flex vertical gap={16}>
				<Row gutter={12}>
					<Col span={12}>
						<FormField label="Slug" htmlFor="slug" required error={errors.slug}>
							<Input
								id="slug"
								value={slug}
								onChange={(e) => setSlug(e.target.value)}
								invalid={!!errors.slug}
							/>
						</FormField>
					</Col>
					<Col span={12}>
						<FormField label="Tiêu đề" htmlFor="title" required error={errors.title}>
							<Input
								id="title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								invalid={!!errors.title}
							/>
						</FormField>
					</Col>
				</Row>

				<Row gutter={12}>
					<Col span={6}>
						<FormField label="Part" htmlFor="part" required error={errors.part}>
							<Select id="part" value={part} onChange={(e) => setPart(Number(e.target.value) as 1 | 2 | 3)}>
								<option value={1}>Part 1 (Social)</option>
								<option value={2}>Part 2 (Solution)</option>
								<option value={3}>Part 3 (Topic)</option>
							</Select>
						</FormField>
					</Col>
					<Col span={6}>
						<FormField label="Task type" htmlFor="task_type" required error={errors.task_type}>
							<Select
								id="task_type"
								value={taskType}
								onChange={(e) => setTaskType(e.target.value as SpeakingTaskType)}
							>
								{TASK_TYPES.map((t) => (
									<option key={t} value={t}>
										{t}
									</option>
								))}
							</Select>
						</FormField>
					</Col>
					<Col span={6}>
						<FormField label="Thời lượng (phút)" htmlFor="minutes" required error={errors.estimated_minutes}>
							<Input
								id="minutes"
								type="number"
								min={1}
								value={minutes}
								onChange={(e) => setMinutes(Number(e.target.value))}
							/>
						</FormField>
					</Col>
					<Col span={6}>
						<FormField
							label="Speaking (giây)"
							htmlFor="speaking_seconds"
							required
							error={errors.speaking_seconds}
						>
							<Input
								id="speaking_seconds"
								type="number"
								min={1}
								value={speakingSeconds}
								onChange={(e) => setSpeakingSeconds(Number(e.target.value))}
							/>
						</FormField>
					</Col>
				</Row>

				<FormField
					label="Content (JSON)"
					htmlFor="content"
					required
					error={jsonError ? [jsonError] : errors.content}
					helper="Shape phụ thuộc task_type. Social: { questions: [...] }. Solution: { situation, question }. Topic: { topic, cues: [...] }."
				>
					<Textarea
						id="content"
						value={contentJson}
						onChange={(e) => setContentJson(e.target.value)}
						rows={10}
						invalid={!!jsonError}
						style={{ fontFamily: "monospace", fontSize: 12 }}
					/>
				</FormField>

				<Switch checked={isPublished} onChange={setIsPublished} label="Đã xuất bản" />

				{generic && <Alert type="error" message={generic} showIcon />}

				<Flex justify="end" gap={8} style={{ paddingTop: 8 }}>
					<Button variant="ghost" onClick={onCancel} disabled={submitting}>
						Huỷ
					</Button>
					<Button type="submit" loading={submitting}>
						{initial ? "Cập nhật" : "Tạo bài nói"}
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}
