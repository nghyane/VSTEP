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
	const [ipa, setIpa] = useState(initial?.ipa ?? "")
	const [translation, setTranslation] = useState(initial?.translation ?? "")
	const [wordCount, setWordCount] = useState(initial?.word_count ?? 0)
	const [audioStart, setAudioStart] = useState<number | "">(initial?.audio_start ?? "")
	const [audioEnd, setAudioEnd] = useState<number | "">(initial?.audio_end ?? "")
	const [displayOrder, setDisplayOrder] = useState(initial?.display_order ?? 0)
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			await onSubmit({
				text,
				ipa: ipa || null,
				translation: translation || null,
				word_count: wordCount,
				audio_start: audioStart === "" ? null : audioStart,
				audio_end: audioEnd === "" ? null : audioEnd,
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
				<FormField label="Câu (EN)" htmlFor="text" required error={errors.text}>
					<Textarea
						id="text"
						value={text}
						onChange={(e) => setText(e.target.value)}
						rows={2}
						invalid={!!errors.text}
					/>
				</FormField>
				<FormField label="Phiên âm IPA" htmlFor="ipa" error={errors.ipa}>
					<Input
						id="ipa"
						value={ipa}
						onChange={(e) => setIpa(e.target.value)}
						placeholder="/həˈloʊ wɝːld/"
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
				<Flex gap={16}>
					<FormField label="Số từ" htmlFor="word_count" style={{ flex: 1 }}>
						<Input
							id="word_count"
							type="number"
							min={0}
							value={wordCount}
							onChange={(e) => setWordCount(Number(e.target.value))}
						/>
					</FormField>
					<FormField label="Audio start (s)" htmlFor="audio_start" style={{ flex: 1 }}>
						<Input
							id="audio_start"
							type="number"
							step={0.001}
							min={0}
							value={audioStart}
							onChange={(e) => setAudioStart(e.target.value === "" ? "" : Number(e.target.value))}
							placeholder="0.000"
						/>
					</FormField>
					<FormField label="Audio end (s)" htmlFor="audio_end" style={{ flex: 1 }}>
						<Input
							id="audio_end"
							type="number"
							step={0.001}
							min={0}
							value={audioEnd}
							onChange={(e) => setAudioEnd(e.target.value === "" ? "" : Number(e.target.value))}
							placeholder="0.000"
						/>
					</FormField>
				</Flex>
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
