import { Alert, Select as AntdSelect, Divider, Flex, InputNumber } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Textarea } from "#/components/Textarea"
import { extractError } from "#/lib/api"

interface PassageFormInput {
	part: number
	title: string
	duration_minutes: number
	passage: string
}

interface Props {
	initial?: {
		part: number
		title: string | null
		duration_minutes: number | null
		passage: string
	}
	onSubmit: (input: PassageFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

export function ReadingPassageForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [state, setState] = useState<PassageFormInput>({
		part: initial?.part ?? 1,
		title: initial?.title ?? "",
		duration_minutes: initial?.duration_minutes ?? 15,
		passage: initial?.passage ?? "",
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function set<K extends keyof PassageFormInput>(key: K, value: PassageFormInput[K]) {
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
			if (x.errors) setErrors(x.errors)
			else setGeneric(x.message)
		}
	}

	return (
		<form onSubmit={handle}>
			{generic && <Alert type="error" description={generic} style={{ marginBottom: 16 }} />}
			<Flex gap={16} align="start">
				<FormField label="Part" required error={errors.part} style={{ width: 160 }}>
					<AntdSelect
						value={state.part}
						onChange={(v) => set("part", v)}
						style={{ width: "100%" }}
						options={[
							{ value: 1, label: "Part 1" },
							{ value: 2, label: "Part 2" },
							{ value: 3, label: "Part 3" },
							{ value: 4, label: "Part 4" },
						]}
					/>
				</FormField>
				<FormField label="Thời lượng (phút)" required error={errors.duration_minutes} style={{ flex: 1 }}>
					<InputNumber
						value={state.duration_minutes}
						onChange={(v) => set("duration_minutes", v ?? 1)}
						min={1}
						style={{ width: "100%" }}
					/>
				</FormField>
			</Flex>
			<FormField label="Tiêu đề bài đọc" required error={errors.title}>
				<Input value={state.title} onChange={(e) => set("title", e.target.value)} />
			</FormField>
			<FormField label="Nội dung bài đọc" required error={errors.passage}>
				<Textarea
					value={state.passage}
					onChange={(e) => set("passage", e.target.value)}
					autoSize={{ minRows: 10, maxRows: 16 }}
					placeholder="Dán toàn bộ nội dung bài đọc vào đây..."
				/>
			</FormField>
			<Divider style={{ margin: "8px 0 16px" }} />
			<Flex justify="end" gap={8}>
				<Button variant="ghost" onClick={onCancel}>
					Huỷ
				</Button>
				<Button type="submit" loading={submitting}>
					Lưu
				</Button>
			</Flex>
		</form>
	)
}
