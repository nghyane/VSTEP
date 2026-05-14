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
		<form onSubmit={handle} className="flex flex-col gap-4">
			<FormField label="Câu hỏi" htmlFor="q" required error={errors.question}>
				<Textarea
					id="q"
					value={question}
					onChange={(e) => setQuestion(e.target.value)}
					rows={2}
					invalid={!!errors.question}
				/>
			</FormField>
			<div className="flex flex-col gap-2">
				<span className="text-xs font-medium text-muted">4 phương án</span>
				{options.map((opt, i) => (
					<div key={i} className="flex items-center gap-2">
						<input
							type="radio"
							name="correct_index"
							checked={correctIndex === i}
							onChange={() => setCorrectIndex(i)}
							aria-label={`Đáp án đúng ${String.fromCharCode(65 + i)}`}
						/>
						<span className="w-4 text-xs text-muted">{String.fromCharCode(65 + i)}.</span>
						<Input
							value={opt}
							onChange={(e) => setOption(i, e.target.value)}
							invalid={!!errors[`options.${i}`]}
						/>
					</div>
				))}
				<p className="text-xs text-subtle">Bấm radio cạnh phương án đúng.</p>
			</div>
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

			{generic && <div className="rounded-md bg-danger-tint px-3 py-2 text-xs text-danger">{generic}</div>}

			<div className="flex justify-end gap-2 pt-2">
				<Button variant="ghost" onClick={onCancel} disabled={submitting}>
					Huỷ
				</Button>
				<Button type="submit" loading={submitting}>
					{initial ? "Cập nhật" : "Thêm câu hỏi"}
				</Button>
			</div>
		</form>
	)
}
