import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Select } from "#/components/Select"
import { TagInput } from "#/components/TagInput"
import { Textarea } from "#/components/Textarea"
import type {
	AdminGrammarExercise,
	ErrorCorrectionPayload,
	ExerciseFormInput,
	FillBlankPayload,
	GrammarExerciseKind,
	McqPayload,
	RewritePayload,
} from "#/features/admin-grammar/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminGrammarExercise
	onSubmit: (input: ExerciseFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

function defaultPayload(
	kind: GrammarExerciseKind,
): McqPayload | ErrorCorrectionPayload | FillBlankPayload | RewritePayload {
	if (kind === "mcq") return { prompt: "", options: ["", "", "", ""], correct_index: 0 }
	if (kind === "error_correction") return { sentence: "", error_start: 0, error_end: 0, correction: "" }
	if (kind === "fill_blank") return { template: "", accepted_answers: [] }
	return { instruction: "", original: "", accepted_answers: [] }
}

export function ExerciseEditor({ initial, onSubmit, onCancel, submitting }: Props) {
	const [kind, setKind] = useState<GrammarExerciseKind>(initial?.kind ?? "mcq")
	const [explanation, setExplanation] = useState(initial?.explanation ?? "")
	const [payload, setPayload] = useState<
		McqPayload | ErrorCorrectionPayload | FillBlankPayload | RewritePayload
	>(initial?.payload ?? defaultPayload(initial?.kind ?? "mcq"))
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function changeKind(next: GrammarExerciseKind): void {
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
					onChange={(e) => changeKind(e.target.value as GrammarExerciseKind)}
					disabled={!!initial}
				>
					<option value="mcq">Trắc nghiệm (MCQ)</option>
					<option value="error_correction">Sửa lỗi</option>
					<option value="fill_blank">Điền vào chỗ trống</option>
					<option value="rewrite">Viết lại câu</option>
				</Select>
				{initial && <p className="mt-1 text-xs text-subtle">Không thể đổi loại. Xoá và tạo lại nếu cần.</p>}
			</FormField>

			{kind === "mcq" && <McqFields payload={payload as McqPayload} onChange={setPayload} errors={errors} />}
			{kind === "error_correction" && (
				<ErrorCorrectionFields
					payload={payload as ErrorCorrectionPayload}
					onChange={setPayload}
					errors={errors}
				/>
			)}
			{kind === "fill_blank" && (
				<FillBlankFields payload={payload as FillBlankPayload} onChange={setPayload} errors={errors} />
			)}
			{kind === "rewrite" && (
				<RewriteFields payload={payload as RewritePayload} onChange={setPayload} errors={errors} />
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

interface EcProps {
	payload: ErrorCorrectionPayload
	onChange: (p: ErrorCorrectionPayload) => void
	errors: Record<string, string[]>
}

function ErrorCorrectionFields({ payload, onChange, errors }: EcProps) {
	return (
		<>
			<FormField label="Câu chứa lỗi" htmlFor="ec_sentence" required error={errors["payload.sentence"]}>
				<Input
					id="ec_sentence"
					value={payload.sentence}
					onChange={(e) => onChange({ ...payload, sentence: e.target.value })}
					placeholder="I has a book."
				/>
			</FormField>
			<div className="grid grid-cols-2 gap-3">
				<FormField
					label="Vị trí bắt đầu lỗi"
					htmlFor="ec_start"
					required
					error={errors["payload.error_start"]}
					helper="Chỉ số ký tự (0-based)."
				>
					<Input
						id="ec_start"
						type="number"
						value={payload.error_start}
						onChange={(e) => onChange({ ...payload, error_start: Number(e.target.value) })}
					/>
				</FormField>
				<FormField label="Vị trí kết thúc lỗi" htmlFor="ec_end" required error={errors["payload.error_end"]}>
					<Input
						id="ec_end"
						type="number"
						value={payload.error_end}
						onChange={(e) => onChange({ ...payload, error_end: Number(e.target.value) })}
					/>
				</FormField>
			</div>
			<FormField label="Câu đúng" htmlFor="ec_correction" required error={errors["payload.correction"]}>
				<Input
					id="ec_correction"
					value={payload.correction}
					onChange={(e) => onChange({ ...payload, correction: e.target.value })}
					placeholder="I have a book."
				/>
			</FormField>
		</>
	)
}

interface FbProps {
	payload: FillBlankPayload
	onChange: (p: FillBlankPayload) => void
	errors: Record<string, string[]>
}

function FillBlankFields({ payload, onChange, errors }: FbProps) {
	return (
		<>
			<FormField label="Mẫu câu" htmlFor="template" required error={errors["payload.template"]}>
				<Input
					id="template"
					value={payload.template}
					onChange={(e) => onChange({ ...payload, template: e.target.value })}
					placeholder="He ___ there yesterday."
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
					placeholder="was, went…"
				/>
			</FormField>
		</>
	)
}

interface RwProps {
	payload: RewritePayload
	onChange: (p: RewritePayload) => void
	errors: Record<string, string[]>
}

function RewriteFields({ payload, onChange, errors }: RwProps) {
	return (
		<>
			<FormField label="Yêu cầu" htmlFor="rw_instr" required error={errors["payload.instruction"]}>
				<Input
					id="rw_instr"
					value={payload.instruction}
					onChange={(e) => onChange({ ...payload, instruction: e.target.value })}
					placeholder="Viết lại dùng câu cảm thán:"
				/>
			</FormField>
			<FormField label="Câu gốc" htmlFor="rw_orig" required error={errors["payload.original"]}>
				<Input
					id="rw_orig"
					value={payload.original}
					onChange={(e) => onChange({ ...payload, original: e.target.value })}
				/>
			</FormField>
			<FormField
				label="Đáp án chấp nhận"
				required
				error={errors["payload.accepted_answers"]}
				helper="Nhiều dạng viết lại."
			>
				<TagInput
					value={payload.accepted_answers}
					onChange={(v) => onChange({ ...payload, accepted_answers: v })}
				/>
			</FormField>
		</>
	)
}
