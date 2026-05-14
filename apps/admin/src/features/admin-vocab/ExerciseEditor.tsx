import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Select } from "#/components/Select"
import { TagInput } from "#/components/TagInput"
import { Textarea } from "#/components/Textarea"
import type {
	AdminVocabExercise,
	ExerciseFormInput,
	FillBlankPayload,
	McqPayload,
	VocabExerciseKind,
	WordFormPayload,
} from "#/features/admin-vocab/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminVocabExercise
	onSubmit: (input: ExerciseFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

function defaultPayload(kind: VocabExerciseKind): McqPayload | FillBlankPayload | WordFormPayload {
	if (kind === "mcq") {
		return { prompt: "", options: ["", "", "", ""], correct_index: 0 }
	}
	if (kind === "fill_blank") {
		return { sentence: "", accepted_answers: [] }
	}
	return { instruction: "", sentence: "", root_word: "", accepted_answers: [] }
}

export function ExerciseEditor({ initial, onSubmit, onCancel, submitting }: Props) {
	const [kind, setKind] = useState<VocabExerciseKind>(initial?.kind ?? "mcq")
	const [explanation, setExplanation] = useState(initial?.explanation ?? "")
	const [payload, setPayload] = useState<McqPayload | FillBlankPayload | WordFormPayload>(
		initial?.payload ?? defaultPayload(initial?.kind ?? "mcq"),
	)
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function changeKind(next: VocabExerciseKind): void {
		setKind(next)
		setPayload(defaultPayload(next))
	}

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			await onSubmit({ kind, explanation, payload })
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
		<form onSubmit={handle} className="flex flex-col gap-4">
			<FormField label="Loại bài tập" htmlFor="kind" required>
				<Select
					id="kind"
					value={kind}
					onChange={(e) => changeKind(e.target.value as VocabExerciseKind)}
					disabled={!!initial}
				>
					<option value="mcq">Trắc nghiệm (MCQ)</option>
					<option value="fill_blank">Điền vào chỗ trống</option>
					<option value="word_form">Chia dạng từ</option>
				</Select>
				{initial && (
					<p className="mt-1 text-xs text-subtle">Không thể đổi loại sau khi tạo. Xoá và tạo lại nếu cần.</p>
				)}
			</FormField>

			{kind === "mcq" && (
				<McqFields payload={payload as McqPayload} onChange={(p) => setPayload(p)} errors={errors} />
			)}
			{kind === "fill_blank" && (
				<FillBlankFields
					payload={payload as FillBlankPayload}
					onChange={(p) => setPayload(p)}
					errors={errors}
				/>
			)}
			{kind === "word_form" && (
				<WordFormFields
					payload={payload as WordFormPayload}
					onChange={(p) => setPayload(p)}
					errors={errors}
				/>
			)}

			<FormField label="Giải thích đáp án" htmlFor="explanation" required error={errors.explanation}>
				<Textarea
					id="explanation"
					value={explanation}
					onChange={(e) => setExplanation(e.target.value)}
					rows={2}
					invalid={!!errors.explanation}
				/>
			</FormField>

			{generic && <div className="rounded-md bg-danger-tint px-3 py-2 text-xs text-danger">{generic}</div>}

			<div className="flex justify-end gap-2 pt-2">
				<Button variant="ghost" onClick={onCancel} disabled={submitting}>
					Huỷ
				</Button>
				<Button type="submit" loading={submitting}>
					{initial ? "Cập nhật" : "Tạo bài tập"}
				</Button>
			</div>
		</form>
	)
}

interface McqFieldsProps {
	payload: McqPayload
	onChange: (p: McqPayload) => void
	errors: Record<string, string[]>
}

function McqFields({ payload, onChange, errors }: McqFieldsProps) {
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
			<div className="flex flex-col gap-2">
				<span className="text-xs font-medium text-muted">4 phương án</span>
				{payload.options.map((opt, i) => (
					<div key={i} className="flex items-center gap-2">
						<input
							type="radio"
							name="correct_index"
							checked={payload.correct_index === i}
							onChange={() => onChange({ ...payload, correct_index: i })}
							aria-label={`Đáp án đúng: ${String.fromCharCode(65 + i)}`}
						/>
						<span className="w-4 text-xs text-muted">{String.fromCharCode(65 + i)}.</span>
						<Input
							value={opt}
							onChange={(e) => setOption(i, e.target.value)}
							invalid={!!errors[`payload.options.${i}`]}
						/>
					</div>
				))}
				<p className="text-xs text-subtle">Bấm radio cạnh phương án đúng.</p>
			</div>
		</>
	)
}

interface FillBlankFieldsProps {
	payload: FillBlankPayload
	onChange: (p: FillBlankPayload) => void
	errors: Record<string, string[]>
}

function FillBlankFields({ payload, onChange, errors }: FillBlankFieldsProps) {
	return (
		<>
			<FormField label="Câu" htmlFor="sentence" required error={errors["payload.sentence"]}>
				<Input
					id="sentence"
					value={payload.sentence}
					onChange={(e) => onChange({ ...payload, sentence: e.target.value })}
					placeholder="She is very ___ today."
				/>
			</FormField>
			<FormField
				label="Đáp án chấp nhận"
				required
				error={errors["payload.accepted_answers"]}
				helper="Nhiều đáp án — Enter để thêm."
			>
				<TagInput
					value={payload.accepted_answers}
					onChange={(v) => onChange({ ...payload, accepted_answers: v })}
					placeholder="happy, content…"
				/>
			</FormField>
		</>
	)
}

interface WordFormFieldsProps {
	payload: WordFormPayload
	onChange: (p: WordFormPayload) => void
	errors: Record<string, string[]>
}

function WordFormFields({ payload, onChange, errors }: WordFormFieldsProps) {
	return (
		<>
			<FormField label="Yêu cầu" htmlFor="instruction" required error={errors["payload.instruction"]}>
				<Input
					id="instruction"
					value={payload.instruction}
					onChange={(e) => onChange({ ...payload, instruction: e.target.value })}
					placeholder="Chia dạng danh từ của:"
				/>
			</FormField>
			<div className="grid grid-cols-2 gap-3">
				<FormField label="Từ gốc" htmlFor="root_word" required error={errors["payload.root_word"]}>
					<Input
						id="root_word"
						value={payload.root_word}
						onChange={(e) => onChange({ ...payload, root_word: e.target.value })}
					/>
				</FormField>
				<FormField
					label="Câu chứa chỗ trống"
					htmlFor="wf_sentence"
					required
					error={errors["payload.sentence"]}
				>
					<Input
						id="wf_sentence"
						value={payload.sentence}
						onChange={(e) => onChange({ ...payload, sentence: e.target.value })}
						placeholder="Everyone wants ___."
					/>
				</FormField>
			</div>
			<FormField
				label="Đáp án chấp nhận"
				required
				error={errors["payload.accepted_answers"]}
				helper="Bao gồm cả viết hoa/thường — backend so sánh sau khi normalize."
			>
				<TagInput
					value={payload.accepted_answers}
					onChange={(v) => onChange({ ...payload, accepted_answers: v })}
				/>
			</FormField>
		</>
	)
}
