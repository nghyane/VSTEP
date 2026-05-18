import { Alert, Flex } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Textarea } from "#/components/Textarea"
import type {
	AdminSpeakingDrillSentence,
	SpeakingDrillSentenceFormInput,
} from "#/features/admin-practice/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminSpeakingDrillSentence
	onSubmit: (input: SpeakingDrillSentenceFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

export function SpeakingDrillSentenceForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [text, setText] = useState(initial?.text ?? "")
	const [translation, setTranslation] = useState(initial?.translation ?? "")
	const [displayOrder, setDisplayOrder] = useState(initial?.display_order ?? 0)
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			await onSubmit({ text, translation, display_order: displayOrder })
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
				<FormField label="Câu (EN)" htmlFor="text" required error={errors.text}>
					<Textarea
						id="text"
						value={text}
						onChange={(e) => setText(e.target.value)}
						rows={2}
						invalid={!!errors.text}
					/>
				</FormField>
				<FormField label="Dịch (VI)" htmlFor="translation" error={errors.translation}>
					<Textarea
						id="translation"
						value={translation ?? ""}
						onChange={(e) => setTranslation(e.target.value)}
						rows={2}
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
						{initial ? "Cập nhật" : "Thêm câu"}
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}
