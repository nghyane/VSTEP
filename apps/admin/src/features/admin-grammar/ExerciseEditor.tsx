import { Alert, Flex, Radio, Typography } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Textarea } from "#/components/Textarea"
import type { AdminGrammarExercise, ExerciseFormInput, McqPayload } from "#/features/admin-grammar/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminGrammarExercise
	onSubmit: (input: ExerciseFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

function defaultPayload(): McqPayload {
	return { prompt: "", options: ["", "", "", ""], correct_index: 0 }
}

export function ExerciseEditor({ initial, onSubmit, onCancel, submitting }: Props) {
	const [explanation, setExplanation] = useState(initial?.explanation ?? "")
	const [payload, setPayload] = useState<McqPayload>(initial?.payload ?? defaultPayload())
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			await onSubmit({ kind: "mcq", explanation, payload })
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
				<Typography.Text type="secondary">Luyện ngữ pháp chỉ sử dụng câu hỏi chọn đáp án.</Typography.Text>

				<McqFields payload={payload} onChange={setPayload} errors={errors} />

				<FormField label="Giải thích đáp án" htmlFor="explanation" required error={errors.explanation}>
					<Textarea
						id="explanation"
						value={explanation}
						onChange={(e) => setExplanation(e.target.value)}
						rows={2}
						invalid={!!errors.explanation}
					/>
				</FormField>

				{generic && <Alert type="error" description={generic} showIcon />}

				<Flex justify="end" gap={8} style={{ paddingTop: 8 }}>
					<Button variant="ghost" onClick={onCancel} disabled={submitting}>
						Huỷ
					</Button>
					<Button type="submit" loading={submitting}>
						{initial ? "Cập nhật" : "Tạo bài tập"}
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}

interface McqProps {
	payload: McqPayload
	onChange: (p: McqPayload) => void
	errors: Record<string, string[]>
}

function McqFields({ payload, onChange, errors }: McqProps) {
	function setOption(i: number, value: string): void {
		const next = [...payload.options] as [string, string, string, string]
		next[i] = value
		onChange({ ...payload, options: next })
	}

	return (
		<>
			<FormField label="Đề bài" htmlFor="prompt" required error={errors["payload.prompt"]}>
				<Textarea
					id="prompt"
					value={payload.prompt}
					onChange={(e) => onChange({ ...payload, prompt: e.target.value })}
					rows={2}
				/>
			</FormField>
			<Flex vertical gap={8}>
				<Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
					4 phương án
				</Typography.Text>
				{payload.options.map((opt, i) => (
					<Flex key={i} align="center" gap={8}>
						<Radio
							checked={payload.correct_index === i}
							onChange={() => onChange({ ...payload, correct_index: i })}
							aria-label={`Đáp án đúng: ${String.fromCharCode(65 + i)}`}
						/>
						<Typography.Text type="secondary" style={{ width: 16, fontSize: 12 }}>
							{String.fromCharCode(65 + i)}.
						</Typography.Text>
						<div style={{ flex: 1 }}>
							<Input
								value={opt}
								onChange={(e) => setOption(i, e.target.value)}
								invalid={!!errors[`payload.options.${i}`]}
							/>
						</div>
					</Flex>
				))}
				<Typography.Text type="secondary" style={{ fontSize: 12 }}>
					Bấm radio cạnh phương án đúng.
				</Typography.Text>
			</Flex>
		</>
	)
}
