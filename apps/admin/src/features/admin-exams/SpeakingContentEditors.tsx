import { CloseOutlined, PlusOutlined } from "@ant-design/icons"
import { Button as AntdButton, Flex, Typography } from "antd"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Textarea } from "#/components/Textarea"

// ─── Social: { topics: { name, questions[] }[] } ───

interface SocialContent {
	topics: { name: string; questions: string[] }[]
}

export function SocialEditor({
	value,
	onChange,
	errors,
}: {
	value: SocialContent
	onChange: (v: SocialContent) => void
	errors: Record<string, string[]>
}) {
	function setTopic(idx: number, patch: Partial<{ name: string; questions: string[] }>) {
		onChange({
			topics: value.topics.map((t, i) => (i === idx ? { ...t, ...patch } : t)),
		})
	}
	function addTopic() {
		onChange({ topics: [...value.topics, { name: "", questions: [""] }] })
	}
	function removeTopic(idx: number) {
		onChange({ topics: value.topics.filter((_, i) => i !== idx) })
	}

	return (
		<Flex vertical gap={16}>
			{value.topics.map((t, ti) => (
				<Flex
					key={ti}
					vertical
					gap={8}
					style={{
						padding: 12,
						border: "1px solid var(--ant-color-border-secondary, #f0f0f0)",
						borderRadius: 6,
					}}
				>
					<Flex justify="space-between" align="center">
						<Typography.Text strong>Chủ đề {ti + 1}</Typography.Text>
						<Button
							variant="ghost"
							icon={<CloseOutlined />}
							onClick={() => removeTopic(ti)}
							aria-label="Xoá chủ đề"
						/>
					</Flex>
					<FormField label="Tên chủ đề" required error={errors[`content.topics.${ti}.name`]}>
						<Input value={t.name} onChange={(e) => setTopic(ti, { name: e.target.value })} />
					</FormField>
					<FormField label="Câu hỏi" required>
						<Flex vertical gap={6}>
							{t.questions.map((q, qi) => (
								<Flex key={qi} gap={8}>
									<Input
										value={q}
										onChange={(e) => {
											const next = [...t.questions]
											next[qi] = e.target.value
											setTopic(ti, { questions: next })
										}}
										placeholder={`Câu hỏi ${qi + 1}`}
									/>
									<Button
										variant="ghost"
										icon={<CloseOutlined />}
										onClick={() => setTopic(ti, { questions: t.questions.filter((_, i) => i !== qi) })}
										aria-label="Xoá câu hỏi"
									/>
								</Flex>
							))}
							<AntdButton
								type="link"
								size="small"
								icon={<PlusOutlined />}
								onClick={() => setTopic(ti, { questions: [...t.questions, ""] })}
								style={{ alignSelf: "flex-start", padding: 0 }}
							>
								Thêm câu hỏi
							</AntdButton>
						</Flex>
					</FormField>
				</Flex>
			))}
			<AntdButton type="dashed" block icon={<PlusOutlined />} onClick={addTopic}>
				Thêm chủ đề
			</AntdButton>
		</Flex>
	)
}

// ─── Solution: { situation, solutions[], task } ───

interface SolutionContent {
	situation: string
	solutions: string[]
	task: string
}

export function SolutionEditor({
	value,
	onChange,
	errors,
}: {
	value: SolutionContent
	onChange: (v: SolutionContent) => void
	errors: Record<string, string[]>
}) {
	return (
		<Flex vertical gap={12}>
			<FormField label="Tình huống" required error={errors["content.situation"]}>
				<Textarea
					value={value.situation}
					onChange={(e) => onChange({ ...value, situation: e.target.value })}
					autoSize={{ minRows: 3, maxRows: 6 }}
					placeholder="Mô tả tình huống cần thí sinh thảo luận..."
				/>
			</FormField>
			<FormField label="Các giải pháp đề xuất" required>
				<Flex vertical gap={8}>
					{value.solutions.map((s, i) => (
						<Flex key={i} gap={8}>
							<Input
								value={s}
								onChange={(e) => {
									const next = [...value.solutions]
									next[i] = e.target.value
									onChange({ ...value, solutions: next })
								}}
								placeholder={`Giải pháp ${i + 1}`}
							/>
							<Button
								variant="ghost"
								icon={<CloseOutlined />}
								onClick={() => onChange({ ...value, solutions: value.solutions.filter((_, j) => j !== i) })}
								aria-label="Xoá giải pháp"
							/>
						</Flex>
					))}
					<AntdButton
						type="dashed"
						block
						icon={<PlusOutlined />}
						onClick={() => onChange({ ...value, solutions: [...value.solutions, ""] })}
					>
						Thêm giải pháp
					</AntdButton>
				</Flex>
			</FormField>
			<FormField label="Yêu cầu cho thí sinh" required error={errors["content.task"]}>
				<Textarea
					value={value.task}
					onChange={(e) => onChange({ ...value, task: e.target.value })}
					autoSize={{ minRows: 2, maxRows: 5 }}
					placeholder="Vd: Phân tích ưu/nhược điểm và chọn phương án phù hợp nhất..."
				/>
			</FormField>
		</Flex>
	)
}

// ─── Topic: { topic, prompt, follow_up_questions? } ───

interface TopicContent {
	topic: string
	prompt: string
	follow_up_questions: string[]
}

export function TopicEditor({
	value,
	onChange,
	errors,
}: {
	value: TopicContent
	onChange: (v: TopicContent) => void
	errors: Record<string, string[]>
}) {
	return (
		<Flex vertical gap={12}>
			<FormField label="Chủ đề" required error={errors["content.topic"]}>
				<Input
					value={value.topic}
					onChange={(e) => onChange({ ...value, topic: e.target.value })}
					placeholder="Vd: Tác động của công nghệ tới giáo dục"
				/>
			</FormField>
			<FormField label="Đề bài" required error={errors["content.prompt"]}>
				<Textarea
					value={value.prompt}
					onChange={(e) => onChange({ ...value, prompt: e.target.value })}
					autoSize={{ minRows: 3, maxRows: 6 }}
					placeholder="Mô tả đề bài thí sinh cần phát triển..."
				/>
			</FormField>
			<FormField label="Câu hỏi mở rộng" helper="Câu hỏi follow-up cho thí sinh (tuỳ chọn).">
				<Flex vertical gap={8}>
					{value.follow_up_questions.length === 0 && (
						<Typography.Text type="secondary" style={{ fontSize: 12 }}>
							Chưa có câu hỏi nào.
						</Typography.Text>
					)}
					{value.follow_up_questions.map((q, i) => (
						<Flex key={i} gap={8}>
							<Input
								value={q}
								onChange={(e) => {
									const next = [...value.follow_up_questions]
									next[i] = e.target.value
									onChange({ ...value, follow_up_questions: next })
								}}
								placeholder={`Câu hỏi ${i + 1}`}
							/>
							<Button
								variant="ghost"
								icon={<CloseOutlined />}
								onClick={() =>
									onChange({
										...value,
										follow_up_questions: value.follow_up_questions.filter((_, j) => j !== i),
									})
								}
								aria-label="Xoá câu hỏi"
							/>
						</Flex>
					))}
					<AntdButton
						type="dashed"
						block
						icon={<PlusOutlined />}
						onClick={() =>
							onChange({
								...value,
								follow_up_questions: [...value.follow_up_questions, ""],
							})
						}
					>
						Thêm câu hỏi
					</AntdButton>
				</Flex>
			</FormField>
		</Flex>
	)
}

// ─── Defaults & sanitizers ───

export const speakingDefaults = {
	social: { topics: [{ name: "", questions: [""] }] } satisfies SocialContent,
	solution: { situation: "", solutions: [""], task: "" } satisfies SolutionContent,
	topic: { topic: "", prompt: "", follow_up_questions: [] } satisfies TopicContent,
}

export function sanitizeSpeakingContent(
	type: string,
	content: Record<string, unknown>,
): Record<string, unknown> {
	if (type === "social") {
		const c = content as unknown as SocialContent
		return {
			topics: c.topics
				.map((t) => ({
					name: t.name.trim(),
					questions: t.questions.map((q) => q.trim()).filter(Boolean),
				}))
				.filter((t) => t.name || t.questions.length > 0),
		}
	}
	if (type === "solution") {
		const c = content as unknown as SolutionContent
		return {
			situation: c.situation.trim(),
			solutions: c.solutions.map((s) => s.trim()).filter(Boolean),
			task: c.task.trim(),
		}
	}
	if (type === "topic") {
		const c = content as unknown as TopicContent
		return {
			topic: c.topic.trim(),
			prompt: c.prompt.trim(),
			follow_up_questions: c.follow_up_questions.map((q) => q.trim()).filter(Boolean),
		}
	}
	return content
}
