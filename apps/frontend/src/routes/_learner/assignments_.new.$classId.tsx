import { ArrowLeft01Icon, Loading03Icon, Upload04Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"
import { MCQBuilder } from "@/components/features/assignments/MCQBuilder"
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
import { useCreateAssignment } from "@/hooks/use-classes"
import { useUploadAudioFile } from "@/hooks/use-uploads"

export const Route = createFileRoute("/_learner/assignments_/new/$classId")({
	component: NewAssignmentPage,
})

function NewAssignmentPage() {
	const { classId } = Route.useParams()
	const navigate = useNavigate()
	const createAssignment = useCreateAssignment()

	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")
	const [skill, setSkill] = useState<string>("")
	const [dueDate, setDueDate] = useState("")
	const [allowRetry, setAllowRetry] = useState(false)

	const [passage, setPassage] = useState("")
	const [audioUrl, setAudioUrl] = useState("")
	const [prompt, setPrompt] = useState("")
	const [questions, setQuestions] = useState<MCQQuestion[]>([])

	function buildContent(): string | undefined {
		if (skill === "listening") return JSON.stringify({ audioUrl, questions })
		if (skill === "reading") return JSON.stringify({ passage, questions })
		if (skill === "writing") return JSON.stringify({ prompt })
		if (skill === "speaking") return JSON.stringify({ prompt, audioUrl: audioUrl || undefined })
		return undefined
	}

	function validate(): string | null {
		if (!title.trim()) return "Vui lòng nhập tiêu đề"
		if (!skill) return "Vui lòng chọn kỹ năng"
		if (skill === "listening" && !audioUrl.trim())
			return "Vui lòng nhập link audio hoặc tải file lên"
		if (skill === "reading" && !passage.trim()) return "Vui lòng nhập đoạn văn"
		if (skill === "writing" && !prompt.trim()) return "Vui lòng nhập đề bài"
		if (skill === "speaking" && !prompt.trim()) return "Vui lòng nhập chủ đề"
		if ((skill === "listening" || skill === "reading") && questions.length === 0)
			return "Vui lòng thêm ít nhất 1 câu hỏi"
		if (
			(skill === "listening" || skill === "reading") &&
			questions.some((q) => !q.question.trim() || q.options.some((o) => !o.trim()))
		)
			return "Vui lòng điền đầy đủ nội dung và đáp án cho tất cả câu hỏi"
		if (dueDate && new Date(dueDate) <= new Date())
			return "Hạn nộp phải là thời điểm trong tương lai"
		return null
	}

	function handleSubmit() {
		const error = validate()
		if (error) {
			toast.error(error)
			return
		}
		createAssignment.mutate(
			{
				classId,
				title: title.trim(),
				description: description.trim() || undefined,
				content: buildContent(),
				skill: skill || undefined,
				dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
				allowRetry,
			},
			{
				onSuccess: () => {
					toast.success("Tạo bài tập thành công")
					navigate({ to: "/dashboard/$classId", params: { classId } })
				},
				onError: () => toast.error("Không thể tạo bài tập. Vui lòng thử lại."),
			},
		)
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" className="size-8" asChild>
					<Link to="/dashboard/$classId" params={{ classId }}>
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
					</Link>
				</Button>
				<h1 className="text-xl font-bold">Tạo bài tập mới</h1>
			</div>

			{/* Form */}
			<div className="space-y-5 rounded-2xl border border-border bg-background p-6">
				{/* Title */}
				<div className="space-y-1.5">
					<Label htmlFor="asgTitle">
						Tiêu đề <span className="text-destructive">*</span>
					</Label>
					<Input
						id="asgTitle"
						placeholder="Ví dụ: Listening Practice Week 1"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
					/>
				</div>

				{/* Description */}
				<div className="space-y-1.5">
					<Label htmlFor="asgDesc">Mô tả (tuỳ chọn)</Label>
					<Textarea
						id="asgDesc"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows={2}
					/>
				</div>

				{/* Skill */}
				<div className="space-y-1.5">
					<Label>
						Kỹ năng <span className="text-destructive">*</span>
					</Label>
					<Select
						value={skill}
						onValueChange={(v) => {
							setSkill(v)
							setQuestions([])
							setPassage("")
							setPrompt("")
							setAudioUrl("")
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="Chọn kỹ năng" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="listening">Listening</SelectItem>
							<SelectItem value="reading">Reading</SelectItem>
							<SelectItem value="writing">Writing</SelectItem>
							<SelectItem value="speaking">Speaking</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Listening */}
				{skill === "listening" && (
					<>
						<AudioUrlInput label="Link audio" value={audioUrl} onChange={setAudioUrl} required />
						<MCQBuilder questions={questions} onChange={setQuestions} />
					</>
				)}

				{/* Reading */}
				{skill === "reading" && (
					<>
						<div className="space-y-1.5">
							<Label>
								Đoạn văn <span className="text-destructive">*</span>
							</Label>
							<Textarea
								placeholder="Nhập đoạn văn cho học sinh đọc..."
								value={passage}
								onChange={(e) => setPassage(e.target.value)}
								rows={8}
							/>
						</div>
						<MCQBuilder questions={questions} onChange={setQuestions} />
					</>
				)}

				{/* Writing */}
				{skill === "writing" && (
					<div className="space-y-1.5">
						<Label>
							Đề bài <span className="text-destructive">*</span>
						</Label>
						<Textarea
							placeholder="Ví dụ: Write an essay about the advantages and disadvantages of..."
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							rows={6}
						/>
					</div>
				)}

				{/* Speaking */}
				{skill === "speaking" && (
					<>
						<div className="space-y-1.5">
							<Label>
								Đề bài / Chủ đề <span className="text-destructive">*</span>
							</Label>
							<Textarea
								placeholder="Ví dụ: Describe your favorite place to visit..."
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
								rows={5}
							/>
						</div>
						<AudioUrlInput
							label="Link audio mẫu (tuỳ chọn)"
							value={audioUrl}
							onChange={setAudioUrl}
						/>
					</>
				)}

				{/* Due date */}
				<div className="space-y-1.5">
					<Label htmlFor="asgDue">Hạn nộp (tuỳ chọn)</Label>
					<Input
						id="asgDue"
						type="datetime-local"
						value={dueDate}
						onChange={(e) => setDueDate(e.target.value)}
					/>
				</div>

				{/* Allow retry */}
				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={allowRetry}
						onChange={(e) => setAllowRetry(e.target.checked)}
						className="rounded"
					/>
					Cho phép làm lại
				</label>
			</div>

			{/* Actions */}
			<div className="flex items-center justify-end gap-3">
				<Button variant="outline" asChild>
					<Link to="/dashboard/$classId" params={{ classId }}>
						Huỷ
					</Link>
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={!title.trim() || !skill || createAssignment.isPending}
				>
					{createAssignment.isPending ? "Đang tạo..." : "Tạo bài tập"}
				</Button>
			</div>
		</div>
	)
}

// ─── Audio URL input with file upload ───────────────

const AUDIO_ACCEPT = "audio/wav,audio/ogg,audio/webm,audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a"

function AudioUrlInput({
	label,
	value,
	onChange,
	required,
}: {
	label: string
	value: string
	onChange: (url: string) => void
	required?: boolean
}) {
	const fileRef = useRef<HTMLInputElement>(null)
	const upload = useUploadAudioFile()

	const handleFile = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (!file) return

			upload.mutate(file, {
				onSuccess: (audioPath) => {
					onChange(audioPath)
					toast.success("Tải audio lên thành công")
				},
				onError: (err) => {
					toast.error(err instanceof Error ? err.message : "Tải audio thất bại")
				},
			})

			e.target.value = ""
		},
		[upload, onChange],
	)

	const isUploading = upload.isPending
	const isUploaded = value.startsWith("speaking/")

	return (
		<div className="space-y-1.5">
			<Label>
				{label}
				{required && <span className="text-destructive"> *</span>}
			</Label>
			<div className="flex gap-2">
				<Input
					placeholder="https://... hoặc tải file lên"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					disabled={isUploading}
					className="flex-1"
				/>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="shrink-0"
					disabled={isUploading}
					onClick={() => fileRef.current?.click()}
				>
					{isUploading ? (
						<HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
					) : (
						<HugeiconsIcon icon={Upload04Icon} className="size-4" />
					)}
					{isUploading ? "Đang tải..." : "Tải lên"}
				</Button>
			</div>
			{isUploaded && <p className="text-xs text-emerald-600">✓ Audio đã tải lên thành công</p>}
			<input
				ref={fileRef}
				type="file"
				accept={AUDIO_ACCEPT}
				className="hidden"
				onChange={handleFile}
			/>
		</div>
	)
}
