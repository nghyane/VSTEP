import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Textarea } from "#/components/Textarea"
import type { AdminGrammarMistake, MistakeFormInput } from "#/features/admin-grammar/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminGrammarMistake
	onSubmit: (input: MistakeFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

export function MistakeForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [wrong, setWrong] = useState(initial?.wrong ?? "")
	const [correct, setCorrect] = useState(initial?.correct ?? "")
	const [explanation, setExplanation] = useState(initial?.explanation ?? "")
	const [displayOrder, setDisplayOrder] = useState(initial?.display_order ?? 0)
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			await onSubmit({ wrong, correct, explanation, display_order: displayOrder })
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
			<FormField label="Lỗi sai" htmlFor="wrong" required error={errors.wrong}>
				<Input id="wrong" value={wrong} onChange={(e) => setWrong(e.target.value)} invalid={!!errors.wrong} />
			</FormField>
			<FormField label="Câu đúng" htmlFor="correct" required error={errors.correct}>
				<Input
					id="correct"
					value={correct}
					onChange={(e) => setCorrect(e.target.value)}
					invalid={!!errors.correct}
				/>
			</FormField>
			<FormField label="Giải thích" htmlFor="explanation" required error={errors.explanation}>
				<Textarea
					id="explanation"
					value={explanation}
					onChange={(e) => setExplanation(e.target.value)}
					rows={3}
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
					{initial ? "Cập nhật" : "Thêm lỗi"}
				</Button>
			</div>
		</form>
	)
}
