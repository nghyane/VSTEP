import { Alert, Flex, Radio } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Textarea } from "#/components/Textarea"
import type { McqItemInput } from "#/features/admin-exams/content-mutations"
import { extractError } from "#/lib/api"

interface Props {
	initial?: { stem: string; options: string[]; correct_index: number }
	onSubmit: (input: McqItemInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

export function McqItemForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [stem, setStem] = useState(initial?.stem ?? "")
	const [options, setOptions] = useState<[string, string, string, string]>([
		initial?.options[0] ?? "",
		initial?.options[1] ?? "",
		initial?.options[2] ?? "",
		initial?.options[3] ?? "",
	])
	const [correctIndex, setCorrectIndex] = useState(initial?.correct_index ?? 0)
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function setOption(idx: number, value: string) {
		setOptions((prev) => {
			const next = [...prev] as [string, string, string, string]
			next[idx] = value
			return next
		})
	}

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			await onSubmit({ stem, options, correct_index: correctIndex })
		} catch (err) {
			const x = await extractError(err)
			if (x.errors) setErrors(x.errors)
			else setGeneric(x.message)
		}
	}

	return (
		<form onSubmit={handle}>
			{generic && <Alert type="error" description={generic} style={{ marginBottom: 12 }} />}
			<FormField label="Câu hỏi" required error={errors.stem}>
				<Textarea value={stem} onChange={(e) => setStem(e.target.value)} rows={2} />
			</FormField>
			<FormField label="Đáp án đúng" required error={errors.correct_index}>
				<Radio.Group value={correctIndex} onChange={(e) => setCorrectIndex(e.target.value)}>
					{options.map((_, i) => (
						<Radio key={i} value={i}>
							{String.fromCharCode(65 + i)}
						</Radio>
					))}
				</Radio.Group>
			</FormField>
			{options.map((opt, i) => (
				<FormField key={i} label={`${String.fromCharCode(65 + i)}.`} required error={errors[`options.${i}`]}>
					<Input value={opt} onChange={(e) => setOption(i, e.target.value)} />
				</FormField>
			))}
			<Flex justify="end" gap={8} style={{ marginTop: 16 }}>
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
