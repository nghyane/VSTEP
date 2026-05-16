import { Alert, Flex, Typography } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Textarea } from "#/components/Textarea"
import type { McqQuestion, McqQuestionFormInput } from "#/features/admin-practice/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: McqQuestion
	onSubmit: (input: McqQuestionFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

export function McqQuestionForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [question, setQuestion] = useState(initial?.question ?? "")
	const [options, setOptions] = useState<[string, string, string, string]>(
		(initial?.options as [string, string, string, string]) ?? ["", "", "", ""],
	)
	const [correctIndex, setCorrectIndex] = useState(initial?.correct_index ?? 0)
	const [explanation, setExplanation] = useState(initial?.explanation ?? "")
	const [displayOrder, setDisplayOrder] = useState(initial?.display_order ?? 0)
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function setOption(i: number, value: string): void {
		const next = [...options] as [string, string, string, string]
		next[i] = value
		setOptions(next)
	}

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			await onSubmit({
				question,
				options,
				correct_index: correctIndex,
				explanation,
				display_order: displayOrder,
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
				<FormField label="Câu hỏi" htmlFor="q" required error={errors.question}>
					<Textarea
						id="q"
						value={question}
						onChange={(e) => setQuestion(e.target.value)}
						rows={2}
						invalid={!!errors.question}
					/>
				</FormField>
				<Flex vertical gap={8}>
					<Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
						4 phương án
					</Typography.Text>
					{options.map((opt, i) => (
						<Flex key={i} align="center" gap={8}>
							<input
								type="radio"
								name="correct_index"
								checked={correctIndex === i}
								onChange={() => setCorrectIndex(i)}
								aria-label={`Đáp án đúng ${String.fromCharCode(65 + i)}`}
							/>
							<Typography.Text type="secondary" style={{ width: 16, fontSize: 12 }}>
								{String.fromCharCode(65 + i)}.
							</Typography.Text>
							<div style={{ flex: 1 }}>
								<Input
									value={opt}
									onChange={(e) => setOption(i, e.target.value)}
									invalid={!!errors[`options.${i}`]}
								/>
							</div>
						</Flex>
					))}
					<Typography.Text type="secondary" style={{ fontSize: 12 }}>
						Bấm radio cạnh phương án đúng.
					</Typography.Text>
				</Flex>
				<FormField label="Giải thích" htmlFor="explanation" required error={errors.explanation}>
					<Textarea
						id="explanation"
						value={explanation}
						onChange={(e) => setExplanation(e.target.value)}
						rows={2}
						invalid={!!errors.explanation}
					/>
				</FormField>
				<FormField label="Thứ tự" htmlFor="display_order">
					<Input
						id="display_order"
						type="number"
						value={displayOrder}
						onChange={(e) => setDisplayOrder(Number(e.target.value))}
					/>
				</FormField>

				{generic && <Alert type="error" message={generic} showIcon />}

				<Flex justify="end" gap={8} style={{ paddingTop: 8 }}>
					<Button variant="ghost" onClick={onCancel} disabled={submitting}>
						Huỷ
					</Button>
					<Button type="submit" loading={submitting}>
						{initial ? "Cập nhật" : "Thêm câu hỏi"}
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}
