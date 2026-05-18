import { Alert, Col, Flex, Row } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Select } from "#/components/Select"
import { Switch } from "#/components/Switch"
import { TagInput } from "#/components/TagInput"
import { Textarea } from "#/components/Textarea"
import type { AdminReadingExercise, ReadingFormInput } from "#/features/admin-practice/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminReadingExercise
	onSubmit: (input: ReadingFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

export function ReadingForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [state, setState] = useState<ReadingFormInput>({
		slug: initial?.slug ?? "",
		title: initial?.title ?? "",
		description: initial?.description ?? "",
		part: initial?.part ?? 1,
		passage: initial?.passage ?? "",
		vietnamese_translation: initial?.vietnamese_translation ?? "",
		keywords: initial?.keywords ?? [],
		estimated_minutes: initial?.estimated_minutes ?? 15,
		is_published: initial?.is_published ?? false,
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function set<K extends keyof ReadingFormInput>(k: K, v: ReadingFormInput[K]): void {
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
					<Col span={8}>
						<FormField label="Part" htmlFor="part" required error={errors.part}>
							<Select id="part" value={state.part} onChange={(e) => set("part", Number(e.target.value))}>
								<option value={1}>Part 1</option>
								<option value={2}>Part 2</option>
								<option value={3}>Part 3</option>
								<option value={4}>Part 4</option>
							</Select>
						</FormField>
					</Col>
					<Col span={8}>
						<FormField label="Thời lượng (phút)" htmlFor="minutes" required error={errors.estimated_minutes}>
							<Input
								id="minutes"
								type="number"
								min={1}
								value={state.estimated_minutes}
								onChange={(e) => set("estimated_minutes", Number(e.target.value))}
							/>
						</FormField>
					</Col>
					<Col span={8}>
						<Flex align="end" style={{ height: "100%", paddingBottom: 8 }}>
							<Switch
								checked={state.is_published}
								onChange={(v) => set("is_published", v)}
								label="Đã xuất bản"
							/>
						</Flex>
					</Col>
				</Row>

				<FormField label="Bài đọc (EN)" htmlFor="passage" required error={errors.passage}>
					<Textarea
						id="passage"
						value={state.passage}
						onChange={(e) => set("passage", e.target.value)}
						rows={8}
						invalid={!!errors.passage}
					/>
				</FormField>

				<FormField label="Bản dịch tiếng Việt" htmlFor="vn_translation" error={errors.vietnamese_translation}>
					<Textarea
						id="vn_translation"
						value={state.vietnamese_translation ?? ""}
						onChange={(e) => set("vietnamese_translation", e.target.value)}
						rows={4}
					/>
				</FormField>

				<FormField label="Keywords" error={errors.keywords}>
					<TagInput value={state.keywords} onChange={(v) => set("keywords", v)} />
				</FormField>

				{generic && <Alert type="error" message={generic} showIcon />}

				<Flex justify="end" gap={8} style={{ paddingTop: 8 }}>
					<Button variant="ghost" onClick={onCancel} disabled={submitting}>
						Huỷ
					</Button>
					<Button type="submit" loading={submitting}>
						{initial ? "Cập nhật" : "Tạo bài đọc"}
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}
