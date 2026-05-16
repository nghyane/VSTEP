import { Alert, Flex } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Select } from "#/components/Select"
import { TagInput } from "#/components/TagInput"
import { Textarea } from "#/components/Textarea"
import type { AdminVocabWord, WordFormInput } from "#/features/admin-vocab/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminVocabWord
	onSubmit: (input: WordFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

const POS = ["noun", "verb", "adjective", "adverb", "preposition", "phrase", "idiom"]

export function WordForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [state, setState] = useState<WordFormInput>({
		word: initial?.word ?? "",
		phonetic: initial?.phonetic ?? "",
		part_of_speech: initial?.part_of_speech ?? "noun",
		definition: initial?.definition ?? "",
		example: initial?.example ?? "",
		synonyms: initial?.synonyms ?? [],
		collocations: initial?.collocations ?? [],
		word_family: initial?.word_family ?? [],
		vstep_tip: initial?.vstep_tip ?? "",
		display_order: initial?.display_order ?? 0,
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function set<K extends keyof WordFormInput>(key: K, value: WordFormInput[K]): void {
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
				<Flex gap={12}>
					<div style={{ flex: 1 }}>
						<FormField label="Từ" htmlFor="word" required error={errors.word}>
							<Input
								id="word"
								value={state.word}
								onChange={(e) => set("word", e.target.value)}
								invalid={!!errors.word}
							/>
						</FormField>
					</div>
					<div style={{ flex: 1 }}>
						<FormField label="Phiên âm IPA" htmlFor="phonetic" error={errors.phonetic}>
							<Input
								id="phonetic"
								value={state.phonetic ?? ""}
								onChange={(e) => set("phonetic", e.target.value)}
								placeholder="/.../"
							/>
						</FormField>
					</div>
				</Flex>

				<Flex gap={12}>
					<div style={{ flex: 1 }}>
						<FormField label="Loại từ" htmlFor="pos" required error={errors.part_of_speech}>
							<Select
								id="pos"
								value={state.part_of_speech}
								onChange={(e) => set("part_of_speech", e.target.value)}
							>
								{POS.map((p) => (
									<option key={p} value={p}>
										{p}
									</option>
								))}
							</Select>
						</FormField>
					</div>
					<div style={{ flex: 1 }}>
						<FormField label="Thứ tự" htmlFor="display_order" error={errors.display_order}>
							<Input
								id="display_order"
								type="number"
								value={state.display_order}
								onChange={(e) => set("display_order", Number(e.target.value))}
							/>
						</FormField>
					</div>
				</Flex>

				<FormField label="Định nghĩa" htmlFor="definition" required error={errors.definition}>
					<Textarea
						id="definition"
						value={state.definition}
						onChange={(e) => set("definition", e.target.value)}
						rows={2}
						invalid={!!errors.definition}
					/>
				</FormField>

				<FormField label="Ví dụ" htmlFor="example" error={errors.example}>
					<Textarea
						id="example"
						value={state.example ?? ""}
						onChange={(e) => set("example", e.target.value)}
						rows={2}
					/>
				</FormField>

				<Flex gap={12}>
					<div style={{ flex: 1 }}>
						<FormField label="Đồng nghĩa">
							<TagInput value={state.synonyms} onChange={(v) => set("synonyms", v)} />
						</FormField>
					</div>
					<div style={{ flex: 1 }}>
						<FormField label="Cụm từ">
							<TagInput value={state.collocations} onChange={(v) => set("collocations", v)} />
						</FormField>
					</div>
					<div style={{ flex: 1 }}>
						<FormField label="Họ từ">
							<TagInput value={state.word_family} onChange={(v) => set("word_family", v)} />
						</FormField>
					</div>
				</Flex>

				<FormField label="VSTEP tip" htmlFor="vstep_tip" error={errors.vstep_tip}>
					<Textarea
						id="vstep_tip"
						value={state.vstep_tip ?? ""}
						onChange={(e) => set("vstep_tip", e.target.value)}
						rows={2}
					/>
				</FormField>

				{generic && <Alert type="error" message={generic} showIcon />}

				<Flex justify="end" gap={8} style={{ paddingTop: 8 }}>
					<Button variant="ghost" onClick={onCancel} disabled={submitting}>
						Huỷ
					</Button>
					<Button type="submit" loading={submitting}>
						{initial ? "Cập nhật" : "Thêm từ"}
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}
