import { Alert, Col, Flex, Row } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Select } from "#/components/Select"
import { Switch } from "#/components/Switch"
import { TagInput } from "#/components/TagInput"
import { Textarea } from "#/components/Textarea"
import type { AdminListeningExercise, ListeningFormInput } from "#/features/admin-practice/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminListeningExercise
	onSubmit: (input: ListeningFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

export function ListeningForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [state, setState] = useState<ListeningFormInput>({
		slug: initial?.slug ?? "",
		title: initial?.title ?? "",
		description: initial?.description ?? "",
		part: initial?.part ?? 1,
		transcript: initial?.transcript ?? "",
		vietnamese_transcript: initial?.vietnamese_transcript ?? "",
		word_timestamps: initial?.word_timestamps ?? [],
		keywords: initial?.keywords ?? [],
		estimated_minutes: initial?.estimated_minutes ?? 10,
		is_published: initial?.is_published ?? false,
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function set<K extends keyof ListeningFormInput>(k: K, v: ListeningFormInput[K]): void {
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
								placeholder="listening-part-1-conv-1"
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
								<option value={1}>Part 1 — Short conversations</option>
								<option value={2}>Part 2 — Talks</option>
								<option value={3}>Part 3 — Long talks</option>
							</Select>
						</FormField>
					</Col>
					<Col span={8}>
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

				<FormField
					label="Kịch bản nghe tiếng Anh"
					htmlFor="transcript"
					required
					error={errors.transcript}
					helper="Nội dung này được dùng để tạo giọng đọc TTS cho học viên."
				>
					<Textarea
						id="transcript"
						value={state.transcript}
						onChange={(e) => set("transcript", e.target.value)}
						rows={4}
						invalid={!!errors.transcript}
					/>
				</FormField>

				<FormField
					label="Bản dịch tiếng Việt"
					htmlFor="vn_transcript"
					error={errors.vietnamese_transcript}
					helper="Chỉ dùng để tham khảo nội bộ, không dùng để phát âm/TTS."
				>
					<Textarea
						id="vn_transcript"
						value={state.vietnamese_transcript ?? ""}
						onChange={(e) => set("vietnamese_transcript", e.target.value)}
						rows={3}
					/>
				</FormField>

				<FormField label="Keywords" error={errors.keywords} helper="Enter để thêm.">
					<TagInput value={state.keywords} onChange={(v) => set("keywords", v)} />
				</FormField>

				{generic && <Alert type="error" message={generic} showIcon />}

				<Flex justify="end" gap={8} style={{ paddingTop: 8 }}>
					<Button variant="ghost" onClick={onCancel} disabled={submitting}>
						Huỷ
					</Button>
					<Button type="submit" loading={submitting}>
						{initial ? "Cập nhật" : "Tạo bài nghe"}
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}
