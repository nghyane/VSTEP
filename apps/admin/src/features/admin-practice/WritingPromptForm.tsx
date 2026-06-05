import { Alert, Col, Flex, Row } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Select } from "#/components/Select"
import { Switch } from "#/components/Switch"
import { TagInput } from "#/components/TagInput"
import { Textarea } from "#/components/Textarea"
import type { AdminWritingPrompt, WritingPromptFormInput } from "#/features/admin-practice/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminWritingPrompt
	onSubmit: (input: WritingPromptFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

export function WritingPromptForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [state, setState] = useState<WritingPromptFormInput>({
		slug: initial?.slug ?? "",
		title: initial?.title ?? "",
		description: initial?.description ?? "",
		part: initial?.part ?? 1,
		prompt: initial?.prompt ?? "",
		min_words: initial?.min_words ?? 120,
		max_words: initial?.max_words ?? 150,
		required_points: initial?.required_points ?? [],
		keywords: initial?.keywords ?? [],
		sentence_starters: initial?.sentence_starters ?? [],
		sample_answer: initial?.sample_answer ?? "",
		estimated_minutes: initial?.estimated_minutes ?? 20,
		is_published: initial?.is_published ?? false,
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function set<K extends keyof WritingPromptFormInput>(k: K, v: WritingPromptFormInput[K]): void {
		setState((s) => ({ ...s, [k]: v }))
	}

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			await onSubmit(state)
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
								value={state.slug}
								onChange={(e) => set("slug", e.target.value)}
								invalid={!!errors.slug}
							/>
						</FormField>
					</Col>
					<Col span={12}>
						<FormField label="Tiêu đề" htmlFor="title" required error={errors.title}>
							<Input
								id="title"
								value={state.title}
								onChange={(e) => set("title", e.target.value)}
								invalid={!!errors.title}
							/>
						</FormField>
					</Col>
				</Row>

				<FormField label="Mô tả" htmlFor="description" error={errors.description}>
					<Textarea
						id="description"
						value={state.description ?? ""}
						onChange={(e) => set("description", e.target.value)}
						rows={2}
					/>
				</FormField>

				<Row gutter={12}>
					<Col span={6}>
						<FormField label="Part" htmlFor="part" required error={errors.part}>
							<Select
								id="part"
								value={state.part}
								onChange={(e) => set("part", Number(e.target.value) as 1 | 2)}
							>
								<option value={1}>Part 1 (Letter)</option>
								<option value={2}>Part 2 (Essay)</option>
							</Select>
						</FormField>
					</Col>
					<Col span={6}>
						<FormField label="Min words" htmlFor="min_words" required error={errors.min_words}>
							<Input
								id="min_words"
								type="number"
								min={1}
								value={state.min_words}
								onChange={(e) => set("min_words", Number(e.target.value))}
							/>
						</FormField>
					</Col>
					<Col span={6}>
						<FormField label="Max words" htmlFor="max_words" required error={errors.max_words}>
							<Input
								id="max_words"
								type="number"
								min={1}
								value={state.max_words}
								onChange={(e) => set("max_words", Number(e.target.value))}
							/>
						</FormField>
					</Col>
					<Col span={6}>
						<FormField
							label="~ Thời lượng ước tính (phút)"
							htmlFor="minutes"
							required
							error={errors.estimated_minutes}
						>
							<Input
								id="minutes"
								type="number"
								min={1}
								value={state.estimated_minutes}
								onChange={(e) => set("estimated_minutes", Number(e.target.value))}
							/>
						</FormField>
					</Col>
				</Row>

				<FormField label="Đề bài" htmlFor="prompt" required error={errors.prompt}>
					<Textarea
						id="prompt"
						value={state.prompt}
						onChange={(e) => set("prompt", e.target.value)}
						rows={4}
						invalid={!!errors.prompt}
					/>
				</FormField>

				<Row gutter={12}>
					<Col span={8}>
						<FormField label="Ý bắt buộc" error={errors.required_points}>
							<TagInput value={state.required_points} onChange={(v) => set("required_points", v)} />
						</FormField>
					</Col>
					<Col span={8}>
						<FormField label="Keywords" error={errors.keywords}>
							<TagInput value={state.keywords} onChange={(v) => set("keywords", v)} />
						</FormField>
					</Col>
					<Col span={8}>
						<FormField label="Câu mở đầu gợi ý" error={errors.sentence_starters}>
							<TagInput value={state.sentence_starters} onChange={(v) => set("sentence_starters", v)} />
						</FormField>
					</Col>
				</Row>

				<FormField label="Bài mẫu" htmlFor="sample_answer" error={errors.sample_answer}>
					<Textarea
						id="sample_answer"
						value={state.sample_answer ?? ""}
						onChange={(e) => set("sample_answer", e.target.value)}
						rows={8}
					/>
				</FormField>

				<Switch checked={state.is_published} onChange={(v) => set("is_published", v)} label="Đã xuất bản" />

				{generic && <Alert type="error" message={generic} showIcon />}

				<Flex justify="end" gap={8} style={{ paddingTop: 8 }}>
					<Button variant="ghost" onClick={onCancel} disabled={submitting}>
						Huỷ
					</Button>
					<Button type="submit" loading={submitting}>
						{initial ? "Cập nhật" : "Tạo đề viết"}
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}
