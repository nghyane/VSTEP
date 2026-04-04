import { Add01Icon, Delete02Icon, TextIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import type { MCQQuestion } from "@/components/features/assignments/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { parseDocumentToAssignment } from "./parse-document"

interface MCQBuilderProps {
	questions: MCQQuestion[]
	onChange: (questions: MCQQuestion[]) => void
}

const EMPTY_QUESTION: MCQQuestion = {
	question: "",
	options: ["", "", "", ""],
	correctAnswer: 0,
}

export function MCQBuilder({ questions, onChange }: MCQBuilderProps) {
	const [bulkOpen, setBulkOpen] = useState(false)
	const [bulkText, setBulkText] = useState("")

	function addQuestion() {
		onChange([...questions, { ...EMPTY_QUESTION, options: ["", "", "", ""] }])
	}

	function removeQuestion(index: number) {
		onChange(questions.filter((_, i) => i !== index))
	}

	function updateQuestion(index: number, field: string, value: string) {
		const updated = [...questions]
		if (field === "question") {
			updated[index] = { ...updated[index], question: value }
		}
		onChange(updated)
	}

	function updateOption(qIndex: number, oIndex: number, value: string) {
		const updated = [...questions]
		const opts = [...updated[qIndex].options]
		opts[oIndex] = value
		updated[qIndex] = { ...updated[qIndex], options: opts }
		onChange(updated)
	}

	function updateCorrectAnswer(qIndex: number, value: string) {
		const updated = [...questions]
		updated[qIndex] = { ...updated[qIndex], correctAnswer: Number.parseInt(value, 10) }
		onChange(updated)
	}

	const handleBulkImport = useCallback(() => {
		if (!bulkText.trim()) {
			toast.error("Vui lòng nhập nội dung câu hỏi")
			return
		}

		const parsed = parseDocumentToAssignment(bulkText)

		if (parsed.questions.length === 0) {
			toast.error("Không tìm thấy câu hỏi nào. Kiểm tra lại định dạng.")
			return
		}

		const shouldReplace =
			questions.length === 0 ||
			window.confirm(
				`Đã có ${questions.length} câu hỏi. Thêm ${parsed.questions.length} câu mới hay thay thế tất cả?\n\nOK = Thay thế  |  Cancel = Thêm vào cuối`,
			)

		if (shouldReplace) {
			onChange(parsed.questions)
		} else {
			onChange([...questions, ...parsed.questions])
		}

		const msg = parsed.missingAnswers
			? `Đã thêm ${parsed.questions.length} câu hỏi (một số chưa có đáp án, vui lòng kiểm tra)`
			: `Đã thêm ${parsed.questions.length} câu hỏi`
		toast.success(msg)

		setBulkText("")
		setBulkOpen(false)
	}, [bulkText, questions, onChange])

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label>Câu hỏi ({questions.length})</Label>
				<div className="flex gap-2">
					<Button
						type="button"
						size="sm"
						variant="outline"
						className="gap-1.5"
						onClick={() => setBulkOpen(!bulkOpen)}
					>
						<HugeiconsIcon icon={TextIcon} className="size-3.5" />
						Dán hàng loạt
					</Button>
					<Button
						type="button"
						size="sm"
						variant="outline"
						className="gap-1.5"
						onClick={addQuestion}
					>
						<HugeiconsIcon icon={Add01Icon} className="size-3.5" />
						Thêm câu hỏi
					</Button>
				</div>
			</div>

			{/* Bulk paste panel */}
			{bulkOpen && (
				<div className="space-y-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
					<p className="text-xs text-muted-foreground">
						Dán câu hỏi vào đây. Hỗ trợ format có hoặc không đánh số, đáp án A/B/C/D, và Answer Key
						ở cuối.
					</p>
					<Textarea
						value={bulkText}
						onChange={(e) => setBulkText(e.target.value)}
						rows={10}
						placeholder={`1. What is the main idea?\nA. Option one\nB. Option two\nC. Option three\nD. Option four\nAnswer: B\n\n2. ...`}
					/>
					<div className="flex items-center justify-end gap-2">
						<Button
							type="button"
							size="sm"
							variant="ghost"
							onClick={() => {
								setBulkOpen(false)
								setBulkText("")
							}}
						>
							Huỷ
						</Button>
						<Button type="button" size="sm" onClick={handleBulkImport}>
							Nhập câu hỏi
						</Button>
					</div>
				</div>
			)}

			{questions.map((q, qi) => (
				<div key={`q-${qi.toString()}`} className="space-y-3 rounded-xl border p-4">
					<div className="flex items-start justify-between gap-2">
						<div className="flex-1 space-y-1.5">
							<Label className="text-xs">Câu {qi + 1}</Label>
							<Input
								placeholder="Nội dung câu hỏi..."
								value={q.question}
								onChange={(e) => updateQuestion(qi, "question", e.target.value)}
							/>
						</div>
						<Button
							type="button"
							size="icon"
							variant="ghost"
							className="mt-6 text-destructive"
							onClick={() => removeQuestion(qi)}
						>
							<HugeiconsIcon icon={Delete02Icon} className="size-4" />
						</Button>
					</div>

					<div className="grid grid-cols-2 gap-2">
						{q.options.map((opt, oi) => (
							<Input
								key={`q${qi.toString()}-o${oi.toString()}`}
								placeholder={`${String.fromCharCode(65 + oi)}. ...`}
								value={opt}
								onChange={(e) => updateOption(qi, oi, e.target.value)}
							/>
						))}
					</div>

					<div className="flex items-center gap-2">
						<Label className="text-xs">Đáp án đúng:</Label>
						<Select
							value={q.correctAnswer.toString()}
							onValueChange={(v) => updateCorrectAnswer(qi, v)}
						>
							<SelectTrigger className="w-20">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="0">A</SelectItem>
								<SelectItem value="1">B</SelectItem>
								<SelectItem value="2">C</SelectItem>
								<SelectItem value="3">D</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			))}

			{questions.length === 0 && !bulkOpen && (
				<p className="py-4 text-center text-sm text-muted-foreground">
					Chưa có câu hỏi nào. Bấm "Thêm câu hỏi" hoặc "Dán hàng loạt" để bắt đầu.
				</p>
			)}
		</div>
	)
}
