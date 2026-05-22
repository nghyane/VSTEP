import { Alert, Flex, Typography } from "antd"
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
		<form onSubmit={handle}>
			<Flex vertical gap={16}>
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
					{initial && (
						<Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
							Không thể đổi loại. Xoá và tạo lại nếu cần.
						</Typography.Text>
					)}
				</FormField>

				{kind === "mcq" && (
					<McqFields payload={payload as McqPayload} onChange={setPayload} errors={errors} />
				)}
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

				{generic && <Alert type="error" message={generic} showIcon />}

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
						<input
							type="radio"
							name="correct_index"
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
			<Flex gap={12}>
				<div style={{ flex: 1 }}>
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
				</div>
				<div style={{ flex: 1 }}>
					<FormField
						label="Vị trí kết thúc lỗi"
						htmlFor="ec_end"
						required
						error={errors["payload.error_end"]}
					>
						<Input
							id="ec_end"
							type="number"
							value={payload.error_end}
							onChange={(e) => onChange({ ...payload, error_end: Number(e.target.value) })}
						/>
					</FormField>
				</div>
			</Flex>
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
