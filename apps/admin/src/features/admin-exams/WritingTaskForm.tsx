import { CloseOutlined, PlusOutlined } from "@ant-design/icons"
import { Alert, Button as AntdButton, Select as AntdSelect, Divider, Flex, InputNumber } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Textarea } from "#/components/Textarea"
import { extractError } from "#/lib/api"

interface WritingTaskFormInput {
	part: number
	task_type: "letter" | "essay"
	duration_minutes: number
	prompt: string
	min_words: number
	instructions: string[]
}

interface Props {
	initial?: {
		part: number
		task_type: "letter" | "essay"
		duration_minutes: number | null
		prompt: string
		min_words: number | null
		instructions: string[] | null
	}
	onSubmit: (input: WritingTaskFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

export function WritingTaskForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [state, setState] = useState<WritingTaskFormInput>({
		part: initial?.part ?? 1,
		task_type: initial?.task_type ?? "letter",
		duration_minutes: initial?.duration_minutes ?? 20,
		prompt: initial?.prompt ?? "",
		min_words: initial?.min_words ?? 120,
		instructions: initial?.instructions ?? [],
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function set<K extends keyof WritingTaskFormInput>(key: K, value: WritingTaskFormInput[K]) {
		setState((s) => ({ ...s, [key]: value }))
	}

	function setInstruction(idx: number, value: string) {
		setState((s) => ({
			...s,
			instructions: s.instructions.map((it, i) => (i === idx ? value : it)),
		}))
	}

	function addInstruction() {
		setState((s) => ({ ...s, instructions: [...s.instructions, ""] }))
	}

	function removeInstruction(idx: number) {
		setState((s) => ({ ...s, instructions: s.instructions.filter((_, i) => i !== idx) }))
	}

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			const cleanInstructions = state.instructions.map((s) => s.trim()).filter(Boolean)
			await onSubmit({ ...state, instructions: cleanInstructions })
		} catch (err) {
			const x = await extractError(err)
			if (x.errors) setErrors(x.errors)
			else setGeneric(x.message)
		}
	}

	return (
		<form onSubmit={handle}>
			{generic && <Alert type="error" description={generic} style={{ marginBottom: 16 }} />}
			<Flex gap={16} align="start" wrap>
				<FormField label="Part" required error={errors.part} style={{ flex: "1 1 200px", minWidth: 160 }}>
					<AntdSelect
						value={state.part}
						onChange={(v) => set("part", v)}
						style={{ width: "100%" }}
						options={[
							{ value: 1, label: "Part 1" },
							{ value: 2, label: "Part 2" },
						]}
					/>
				</FormField>
				<FormField
					label="Loại bài"
					required
					error={errors.task_type}
					style={{ flex: "1 1 200px", minWidth: 160 }}
				>
					<AntdSelect
						value={state.task_type}
						onChange={(v) => set("task_type", v)}
						style={{ width: "100%" }}
						options={[
							{ value: "letter", label: "Thư" },
							{ value: "essay", label: "Bài luận" },
						]}
					/>
				</FormField>
			</Flex>
			<Flex gap={16} align="start" wrap>
				<FormField
					label="Thời lượng (phút)"
					required
					error={errors.duration_minutes}
					style={{ flex: "1 1 200px", minWidth: 180 }}
				>
					<InputNumber
						value={state.duration_minutes}
						onChange={(v) => set("duration_minutes", v ?? 1)}
						min={1}
						style={{ width: "100%" }}
					/>
				</FormField>
				<FormField
					label="Số từ tối thiểu"
					required
					error={errors.min_words}
					style={{ flex: "1 1 200px", minWidth: 180 }}
				>
					<InputNumber
						value={state.min_words}
						onChange={(v) => set("min_words", v ?? 0)}
						min={0}
						style={{ width: "100%" }}
					/>
				</FormField>
			</Flex>
			<FormField label="Đề bài" required error={errors.prompt}>
				<Textarea
					value={state.prompt}
					onChange={(e) => set("prompt", e.target.value)}
					rows={6}
					placeholder="Nhập đề bài viết..."
				/>
			</FormField>
			<FormField
				label="Hướng dẫn"
				error={errors.instructions}
				helper="Mỗi dòng là một bước hướng dẫn riêng (tuỳ chọn)."
			>
				<Flex vertical gap={8}>
					{state.instructions.map((ins, i) => (
						<Flex key={i} gap={8}>
							<Input
								value={ins}
								onChange={(e) => setInstruction(i, e.target.value)}
								placeholder={`Hướng dẫn ${i + 1}`}
							/>
							<Button
								variant="ghost"
								icon={<CloseOutlined />}
								onClick={() => removeInstruction(i)}
								aria-label="Xoá hướng dẫn"
							/>
						</Flex>
					))}
					<AntdButton type="dashed" block icon={<PlusOutlined />} onClick={addInstruction}>
						Thêm hướng dẫn
					</AntdButton>
				</Flex>
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
