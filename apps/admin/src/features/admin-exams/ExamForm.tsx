import { Alert, Flex } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Switch } from "#/components/Switch"
import { TagInput } from "#/components/TagInput"
import type { AdminExam, ExamFormInput } from "#/features/admin-exams/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminExam
	onSubmit: (input: ExamFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

export function ExamForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [state, setState] = useState<ExamFormInput>({
		slug: initial?.slug ?? "",
		title: initial?.title ?? "",
		source_school: initial?.source_school ?? "",
		tags: initial?.tags ?? [],
		total_duration_minutes: initial?.total_duration_minutes ?? 120,
		is_published: initial?.is_published ?? false,
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function set<K extends keyof ExamFormInput>(key: K, value: ExamFormInput[K]): void {
		setState((s) => ({ ...s, [key]: value }))
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
				const fieldList = Object.values(x.errors).flat().join(" • ")
				setGeneric(fieldList || x.message)
			} else {
				setGeneric(x.message)
			}
		}
	}

	return (
		<form onSubmit={handle}>
			<Flex vertical gap={16}>
				<Flex gap={12}>
					<div style={{ flex: 1 }}>
						<FormField
							label="Slug"
							htmlFor="slug"
							required
							error={errors.slug}
							helper="URL-friendly, không trùng."
						>
							<Input
								id="slug"
								value={state.slug}
								onChange={(e) => set("slug", e.target.value)}
								placeholder="vd: vstep-2024-01"
								invalid={!!errors.slug}
							/>
						</FormField>
					</div>
					<div style={{ flex: 1 }}>
						<FormField label="Tiêu đề" htmlFor="title" required error={errors.title}>
							<Input
								id="title"
								value={state.title}
								onChange={(e) => set("title", e.target.value)}
								invalid={!!errors.title}
							/>
						</FormField>
					</div>
				</Flex>

				<Flex gap={12}>
					<div style={{ flex: 1 }}>
						<FormField label="Trường nguồn" htmlFor="source_school" error={errors.source_school}>
							<Input
								id="source_school"
								value={state.source_school}
								onChange={(e) => set("source_school", e.target.value)}
								placeholder="vd: ĐHQG Hà Nội"
							/>
						</FormField>
					</div>
					<div style={{ flex: 1 }}>
						<FormField
							label="Thời lượng (phút)"
							htmlFor="total_duration_minutes"
							required
							error={errors.total_duration_minutes}
						>
							<Input
								id="total_duration_minutes"
								type="number"
								value={state.total_duration_minutes}
								onChange={(e) => set("total_duration_minutes", Number(e.target.value))}
							/>
						</FormField>
					</div>
				</Flex>

				<FormField label="Tags" error={errors.tags} helper="Bấm Enter để thêm tag.">
					<TagInput value={state.tags} onChange={(v) => set("tags", v)} placeholder="vd: 2024, mock-test" />
				</FormField>

				<Switch
					id="is_published"
					checked={state.is_published}
					onChange={(v) => set("is_published", v)}
					label="Xuất bản ngay"
				/>

				{generic && <Alert type="error" message={generic} showIcon />}

				<Flex justify="end" gap={8} style={{ paddingTop: 8 }}>
					<Button variant="ghost" onClick={onCancel} disabled={submitting}>
						Huỷ
					</Button>
					<Button type="submit" loading={submitting}>
						{initial ? "Cập nhật" : "Tạo đề thi"}
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}
