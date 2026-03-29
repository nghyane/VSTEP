import {
	Add01Icon,
	ArrowLeft01Icon,
	Calendar03Icon,
	CheckmarkCircle02Icon,
	Clock01Icon,
	Copy01Icon,
	Delete02Icon,
	Mail01Icon,
	PencilEdit01Icon,
	RefreshIcon,
	UserGroup02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Fragment, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type {
	ClassAssignment,
	ClassDashboard,
	ClassFeedback,
	ClassMember,
	LeaderboardEntry,
} from "@/hooks/use-classes"
import {
	useAssignments,
	useClass,
	useClassDashboard,
	useClassFeedback,
	useCreateAssignment,
	useDeleteAssignment,
	useGradeSubmission,
	useLeaderboard,
	useRemoveMember,
	useRotateCode,
	useSendFeedback,
	useUpdateClass,
} from "@/hooks/use-classes"
import { MCQBuilder } from "@/components/features/assignments/MCQBuilder"
import { type MCQQuestion, isMCQContent, parseContent } from "@/components/features/assignments/types"

export const Route = createFileRoute("/_learner/dashboard_/$classId")({
	component: ClassDetailPage,
})

const SKILL_LABELS: Record<string, string> = {
	listening: "Listening",
	reading: "Reading",
	writing: "Writing",
	speaking: "Speaking",
	all: "Tổng hợp",
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleString("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	})
}

function ClassDetailPage() {
	const { classId } = Route.useParams()
	const { data: cls, isLoading } = useClass(classId)
	const { data: dashboard } = useClassDashboard(classId)
	const { data: feedbackData } = useClassFeedback(classId)
	const { data: assignmentsData } = useAssignments(classId)
	const { data: leaderboardData } = useLeaderboard(classId)
	const updateClass = useUpdateClass()
	const rotateCode = useRotateCode()
	const removeMember = useRemoveMember()
	const sendFeedback = useSendFeedback()

	const [activeTab, setActiveTab] = useState("overview")
	const [showEdit, setShowEdit] = useState(false)
	const [editName, setEditName] = useState("")
	const [editDesc, setEditDesc] = useState("")
	const [showFeedback, setShowFeedback] = useState(false)
	const [feedbackUserId, setFeedbackUserId] = useState("")
	const [feedbackContent, setFeedbackContent] = useState("")

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-3">
					<Skeleton className="size-8 rounded-md" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-7 w-64" />
						<Skeleton className="h-4 w-40" />
					</div>
				</div>
				<Skeleton className="h-10 w-full rounded-lg" />
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={`skeleton-${i.toString()}`} className="h-24 rounded-2xl" />
					))}
				</div>
			</div>
		)
	}

	if (!cls) {
		return (
			<div className="flex flex-col items-center gap-4 py-16">
				<p className="text-muted-foreground">Không tìm thấy lớp học</p>
				<Button variant="outline" asChild>
					<Link to="/dashboard">Quay lại</Link>
				</Button>
			</div>
		)
	}

	function openEdit() {
		if (!cls) return
		setEditName(cls.name)
		setEditDesc(cls.description ?? "")
		setShowEdit(true)
	}

	function handleEdit() {
		if (!cls) return
		if (!editName.trim()) { toast.error("Tên lớp không được để trống"); return }
		updateClass.mutate(
			{ id: cls.id, name: editName.trim(), description: editDesc.trim() || undefined },
			{
				onSuccess: () => { setShowEdit(false); toast.success("Đã cập nhật lớp học") },
				onError: () => toast.error("Không thể cập nhật lớp học"),
			},
		)
	}

	function handleRotateCode() {
		rotateCode.mutate(classId, {
			onSuccess: () => toast.success("Đã đổi mã mời"),
			onError: () => toast.error("Không thể đổi mã mời"),
		})
	}

	function handleRemoveMember(userId: string) {
		if (confirm("Bạn có chắc muốn xóa thành viên này?")) {
			removeMember.mutate({ classId, userId }, {
				onSuccess: () => toast.success("Đã xóa thành viên"),
				onError: () => toast.error("Không thể xóa thành viên"),
			})
		}
	}

	function openFeedback(userId: string) {
		setFeedbackUserId(userId)
		setFeedbackContent("")
		setShowFeedback(true)
	}

	function handleSendFeedback() {
		if (!feedbackContent.trim()) { toast.error("Vui lòng nhập nội dung nhận xét"); return }
		sendFeedback.mutate(
			{ classId, toUserId: feedbackUserId, content: feedbackContent.trim() },
			{
				onSuccess: () => { setShowFeedback(false); toast.success("Đã gửi nhận xét") },
				onError: () => toast.error("Không thể gửi nhận xét"),
			},
		)
	}

	const feedbackList = feedbackData?.data ?? []
	const assignments = assignmentsData ?? []
	const leaderboard = leaderboardData ?? []

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" className="size-8" asChild>
					<Link to="/dashboard">
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-semibold tracking-tight">{cls.name}</h1>
					{cls.description && (
						<p className="mt-0.5 text-sm text-muted-foreground">{cls.description}</p>
					)}
				</div>
				<Button variant="outline" size="sm" className="gap-1.5" onClick={openEdit}>
					<HugeiconsIcon icon={PencilEdit01Icon} className="size-3.5" />
					Sửa
				</Button>
			</div>

			{/* Invite code */}
			{cls.inviteCode && (
				<div className="flex items-center gap-3 rounded-2xl bg-muted/50 px-4 py-3 shadow-sm">
					<span className="text-sm text-muted-foreground">Mã mời:</span>
					<span className="font-mono font-semibold">{cls.inviteCode}</span>
					<button
						type="button"
						className="text-muted-foreground hover:text-foreground"
						onClick={() => navigator.clipboard.writeText(cls.inviteCode ?? "").then(() => toast.success("Đã sao chép mã mời")).catch(() => toast.error("Không thể sao chép"))}
					>
						<HugeiconsIcon icon={Copy01Icon} className="size-4" />
					</button>
					<Button
						variant="ghost"
						size="sm"
						className="ml-auto gap-1.5 text-xs"
						onClick={handleRotateCode}
						disabled={rotateCode.isPending}
					>
						<HugeiconsIcon icon={RefreshIcon} className="size-3.5" />
						{rotateCode.isPending ? "Đang đổi..." : "Đổi mã"}
					</Button>
				</div>
			)}

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="w-full">
					<TabsTrigger value="overview">Tổng quan</TabsTrigger>
					<TabsTrigger value="assignments">Bài tập</TabsTrigger>
					<TabsTrigger value="leaderboard">Bảng xếp hạng</TabsTrigger>
					<TabsTrigger value="feedback">Nhận xét</TabsTrigger>
					<TabsTrigger value="members">Thành viên ({cls.memberCount})</TabsTrigger>
				</TabsList>

				<TabsContent value="overview">
					<OverviewTab dashboard={dashboard ?? null} />
				</TabsContent>

				<TabsContent value="assignments">
					<AssignmentsTab classId={classId} assignments={assignments} />
				</TabsContent>

				<TabsContent value="leaderboard">
					<LeaderboardTab leaderboard={leaderboard} />
				</TabsContent>

				<TabsContent value="feedback">
					<FeedbackTab feedback={feedbackList} />
				</TabsContent>

				<TabsContent value="members">
					<MembersTab
						members={cls.members}
						onFeedback={openFeedback}
						onRemove={handleRemoveMember}
					/>
				</TabsContent>
			</Tabs>

			{/* Edit dialog */}
			<Dialog open={showEdit} onOpenChange={setShowEdit}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Sửa lớp học</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="editName">Tên lớp</Label>
							<Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} />
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="editDesc">Mô tả</Label>
							<Textarea
								id="editDesc"
								value={editDesc}
								onChange={(e) => setEditDesc(e.target.value)}
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowEdit(false)}>
							Huỷ
						</Button>
						<Button onClick={handleEdit} disabled={!editName.trim() || updateClass.isPending}>
							{updateClass.isPending ? "Đang lưu..." : "Lưu"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Feedback dialog */}
			<Dialog open={showFeedback} onOpenChange={setShowFeedback}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Gửi nhận xét</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="fbContent">Nội dung nhận xét</Label>
							<Textarea
								id="fbContent"
								placeholder="Nhập nhận xét cho học viên..."
								value={feedbackContent}
								onChange={(e) => setFeedbackContent(e.target.value)}
								rows={4}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowFeedback(false)}>
							Huỷ
						</Button>
						<Button
							onClick={handleSendFeedback}
							disabled={!feedbackContent.trim() || sendFeedback.isPending}
						>
							{sendFeedback.isPending ? "Đang gửi..." : "Gửi nhận xét"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

// ── Tab Components ──

function AssignmentsTab({
	classId,
	assignments,
}: {
	classId: string
	assignments: ClassAssignment[]
}) {
	const qc = useQueryClient()
	const createAssignment = useCreateAssignment()
	const deleteAssignment = useDeleteAssignment()
	const gradeSubmission = useGradeSubmission()

	const [showCreate, setShowCreate] = useState(false)
	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")
	const [skill, setSkill] = useState<string>("")
	const [dueDate, setDueDate] = useState("")
	const [allowRetry, setAllowRetry] = useState(false)

	// Skill-specific content state
	const [passage, setPassage] = useState("")
	const [audioUrl, setAudioUrl] = useState("")
	const [prompt, setPrompt] = useState("")
	const [questions, setQuestions] = useState<MCQQuestion[]>([])

	// Drill-down state
	const [selectedAsg, setSelectedAsg] = useState<ClassAssignment | null>(null)
	const [gradeSubId, setGradeSubId] = useState("")
	const [gradeScore, setGradeScore] = useState("")
	const [gradeFeedback, setGradeFeedback] = useState("")
	const [viewAnswer, setViewAnswer] = useState<string | null>(null)

	function buildContent(): string | undefined {
		if (skill === "listening") {
			return JSON.stringify({ audioUrl, questions })
		}
		if (skill === "reading") {
			return JSON.stringify({ passage, questions })
		}
		if (skill === "writing") {
			return JSON.stringify({ prompt })
		}
		if (skill === "speaking") {
			return JSON.stringify({ prompt, audioUrl: audioUrl || undefined })
		}
		return undefined
	}

	function validateCreate(): string | null {
		if (!title.trim()) return "Vui lòng nhập tiêu đề"
		if (!skill) return "Vui lòng chọn kỹ năng"
		if (skill === "listening" && !audioUrl.trim()) return "Vui lòng nhập link audio"
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

	function handleCreate() {
		const error = validateCreate()
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
					setShowCreate(false)
					setTitle("")
					setDescription("")
					setSkill("")
					setPassage("")
					setAudioUrl("")
					setPrompt("")
					setQuestions([])
					setDueDate("")
					setAllowRetry(false)
					toast.success("Tạo bài tập thành công")
				},
				onError: () => toast.error("Không thể tạo bài tập. Vui lòng thử lại."),
			},
		)
	}

	function handleGrade() {
		const score = Number.parseFloat(gradeScore)
		if (!gradeSubId || Number.isNaN(score)) {
			toast.error("Vui lòng nhập điểm hợp lệ")
			return
		}
		if (score < 0 || score > 10) {
			toast.error("Điểm phải từ 0 đến 10")
			return
		}
		gradeSubmission.mutate(
			{
				classId,
				submissionId: gradeSubId,
				score,
				feedback: gradeFeedback.trim() || undefined,
			},
			{
				onSuccess: () => {
					setGradeSubId("")
					setGradeScore("")
					setGradeFeedback("")
					toast.success("Đã chấm điểm thành công")
				},
				onError: () => toast.error("Không thể chấm điểm. Vui lòng thử lại."),
			},
		)
	}

	// Drill-down view
	if (selectedAsg) {
		const subs = selectedAsg.submissions ?? []
		return (
			<div className="space-y-4">
				<div className="flex items-center gap-3">
					<Button variant="ghost" size="sm" onClick={() => setSelectedAsg(null)}>
						← Quay lại
					</Button>
					<h3 className="font-semibold">{selectedAsg.title}</h3>
				</div>

				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Học viên</TableHead>
							<TableHead>Trạng thái</TableHead>
							<TableHead>Điểm</TableHead>
							<TableHead className="text-right">Chấm điểm</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
					{subs.map((sub) => (
						<Fragment key={sub.id}>
						<TableRow>
							<TableCell>
									<div>
										<p className="text-sm font-medium">{sub.fullName ?? "—"}</p>
										<p className="text-xs text-muted-foreground">{sub.email}</p>
									</div>
								</TableCell>
								<TableCell>
									<Badge
										variant={
											sub.status === "graded"
												? "default"
												: sub.status === "submitted"
													? "secondary"
													: "outline"
										}
										className="text-[10px]"
									>
										{sub.status === "graded"
											? "Đã chấm"
											: sub.status === "submitted"
												? "Đã nộp"
												: "Chưa nộp"}
									</Badge>
									{sub.lateMinutes != null && sub.lateMinutes > 0 && (
										<Badge variant="destructive" className="ml-1 text-[10px]">
											Trễ {sub.lateMinutes >= 60 ? `${Math.floor(sub.lateMinutes / 60)}h${sub.lateMinutes % 60 > 0 ? `${sub.lateMinutes % 60}p` : ""}` : `${sub.lateMinutes} phút`}
										</Badge>
									)}
								</TableCell>
								<TableCell>
									{sub.score != null ? (
										<span className="font-semibold">{sub.score}</span>
									) : (
										<span className="text-muted-foreground">—</span>
									)}
								</TableCell>
								<TableCell className="text-right">
									{sub.status !== "pending" && (
										<div className="flex items-center justify-end gap-2">
											{sub.answer && (
												<Button
													size="sm"
													variant="outline"
													className="text-xs"
													onClick={() =>
														setViewAnswer(
															viewAnswer === sub.id ? null : sub.id,
														)
													}
												>
													{viewAnswer === sub.id ? "Ẩn bài" : "Xem bài"}
												</Button>
											)}
											{sub.examSessionId && (
												<Button
													size="sm"
													variant="outline"
													className="text-xs"
													asChild
												>
													<Link
														to="/exams/sessions/$sessionId"
														params={{ sessionId: sub.examSessionId }}
													>
														Xem kết quả
													</Link>
												</Button>
											)}
											<Button
												size="sm"
												variant="outline"
												className="text-xs"
												onClick={() => {
													setGradeSubId(sub.id)
													// Auto-calculate score for MCQ
													const asgContent = parseContent(selectedAsg.content, selectedAsg.skill)
													if (sub.answer && asgContent && isMCQContent(asgContent)) {
														try {
															const parsed = JSON.parse(sub.answer) as { answers: number[] }
															const total = asgContent.questions.length
															const correct = asgContent.questions.filter((q, i) => parsed.answers[i] === q.correctAnswer).length
															setGradeScore(String(Math.round((correct / total) * 10 * 10) / 10))
														} catch {
															setGradeScore(sub.score ?? "")
														}
													} else {
														setGradeScore(sub.score ?? "")
													}
													setGradeFeedback(sub.feedback ?? "")
												}}
											>
												Chấm điểm
											</Button>
										</div>
									)}
								</TableCell>
							</TableRow>
							{viewAnswer === sub.id && sub.answer && (
								<TableRow>
									<TableCell colSpan={4}>
										<AnswerDisplay
											answer={sub.answer}
											assignment={selectedAsg}
										/>
										{sub.feedback && (
											<div className="mt-2 rounded-lg bg-blue-50/50 p-4 dark:bg-blue-950/10">
												<p className="mb-1 text-xs font-medium text-blue-600">
													Nhận xét:
												</p>
												<p className="whitespace-pre-wrap text-sm">{sub.feedback}</p>
											</div>
										)}
									</TableCell>
								</TableRow>
							)}
							{gradeSubId === sub.id && (
								<TableRow>
									<TableCell colSpan={4}>
										<div className="flex flex-col gap-3 rounded-lg bg-muted/30 p-4">
											<div className="flex items-center gap-3">
												<Label className="text-xs">Điểm:</Label>
												<Input
													type="number"
													min="0"
													max="100"
													step="0.5"
													className="h-8 w-24"
													value={gradeScore}
													onChange={(e) => setGradeScore(e.target.value)}
												/>
											</div>
											<div className="space-y-1.5">
												<Label className="text-xs">Nhận xét (tuỳ chọn):</Label>
												<Textarea
													value={gradeFeedback}
													onChange={(e) => setGradeFeedback(e.target.value)}
													rows={2}
													placeholder="Nhận xét cho học viên..."
												/>
											</div>
											<div className="flex gap-2">
												<Button
													size="sm"
													onClick={handleGrade}
													disabled={gradeSubmission.isPending}
												>
													{gradeSubmission.isPending ? "Đang lưu..." : "Lưu điểm"}
												</Button>
												<Button
													size="sm"
													variant="ghost"
													onClick={() => setGradeSubId("")}
												>
													Huỷ
												</Button>
											</div>
										</div>
									</TableCell>
								</TableRow>
							)}
						</Fragment>
					))}
					</TableBody>
				</Table>
			</div>
		)
	}

	// Assignment list view
	return (
		<div className="space-y-3">
			<div className="flex justify-end gap-2">
				<Button
					size="sm"
					variant="outline"
					className="gap-1.5"
					onClick={() => qc.invalidateQueries({ queryKey: ["classes", classId, "assignments"] })}
				>
					<HugeiconsIcon icon={RefreshIcon} className="size-3.5" />
					Tải lại
				</Button>
				<Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
					<HugeiconsIcon icon={Add01Icon} className="size-3.5" />
					Tạo bài tập
				</Button>
			</div>

			{assignments.length === 0 ? (
				<p className="py-8 text-center text-sm text-muted-foreground">Chưa có bài tập nào</p>
			) : (
				assignments.map((asg) => (
					<button
						key={asg.id}
						type="button"
						className="w-full rounded-2xl bg-muted/50 p-5 text-left shadow-sm transition-colors hover:bg-muted/80"
						onClick={() => setSelectedAsg(asg)}
					>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div className="space-y-1.5">
								<p className="font-semibold">{asg.title}</p>
								<div className="flex flex-wrap items-center gap-1.5">
									{asg.skill && (
										<Badge variant="secondary" className="text-[10px] capitalize">
											{SKILL_LABELS[asg.skill] ?? asg.skill}
										</Badge>
									)}
									<Badge variant="outline" className="text-[10px]">
										{asg.type === "exam" ? "Thi thử" : "Luyện tập"}
									</Badge>
									{asg.allowRetry && (
										<Badge variant="outline" className="text-[10px]">
											Cho làm lại
										</Badge>
									)}
								</div>
								{asg.dueDate && (
									<div className="flex items-center gap-1 text-xs text-muted-foreground">
										<HugeiconsIcon icon={Calendar03Icon} className="size-3" />
										<span>Hạn nộp: {formatDate(asg.dueDate)}</span>
									</div>
								)}
							</div>
							{/* biome-ignore lint/a11y/useKeyWithClickEvents: nested interactive elements */}
							{/* biome-ignore lint/a11y/noStaticElementInteractions: stopPropagation wrapper */}
							<div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
								<Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
									<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" />
									{asg.gradedCount ?? 0} đã chấm
								</Badge>
								{(asg.submittedCount ?? 0) > 0 && (
									<Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
										<HugeiconsIcon icon={Clock01Icon} className="size-3" />
										{asg.submittedCount} chờ chấm
									</Badge>
								)}
								{(asg.pendingCount ?? 0) > 0 && (
									<Badge variant="outline">{asg.pendingCount} chưa nộp</Badge>
								)}
								<Button
									size="sm"
									variant="ghost"
									className="text-destructive hover:text-destructive"
									onClick={() => {
										if (confirm("Xóa bài tập này?")) {
											deleteAssignment.mutate({ classId, assignmentId: asg.id }, {
												onSuccess: () => toast.success("Đã xóa bài tập"),
												onError: () => toast.error("Không thể xóa bài tập"),
											})
										}
									}}
								>
									<HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
								</Button>
							</div>
						</div>
					</button>
				))
			)}

			<Dialog open={showCreate} onOpenChange={setShowCreate}>
				<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Tạo bài tập mới</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="asgTitle">Tiêu đề</Label>
							<Input
								id="asgTitle"
								placeholder="Ví dụ: Listening Practice Week 1"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="asgDesc">Mô tả (tuỳ chọn)</Label>
							<Textarea
								id="asgDesc"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={2}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Kỹ năng</Label>
							<Select value={skill} onValueChange={(v) => { setSkill(v); setQuestions([]); setPassage(""); setPrompt(""); setAudioUrl("") }}>
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

						{/* Listening: audio URL + MCQ builder */}
						{skill === "listening" && (
							<>
								<div className="space-y-1.5">
									<Label>Link audio</Label>
									<Input
										placeholder="https://..."
										value={audioUrl}
										onChange={(e) => setAudioUrl(e.target.value)}
									/>
								</div>
								<MCQBuilder questions={questions} onChange={setQuestions} />
							</>
						)}

						{/* Reading: passage + MCQ builder */}
						{skill === "reading" && (
							<>
								<div className="space-y-1.5">
									<Label>Đoạn văn</Label>
									<Textarea
										placeholder="Nhập đoạn văn cho học sinh đọc..."
										value={passage}
										onChange={(e) => setPassage(e.target.value)}
										rows={6}
									/>
								</div>
								<MCQBuilder questions={questions} onChange={setQuestions} />
							</>
						)}

						{/* Writing: prompt */}
						{skill === "writing" && (
							<div className="space-y-1.5">
								<Label>Đề bài</Label>
								<Textarea
									placeholder="Ví dụ: Write an essay about the advantages and disadvantages of..."
									value={prompt}
									onChange={(e) => setPrompt(e.target.value)}
									rows={5}
								/>
							</div>
						)}

						{/* Speaking: topic + optional audio */}
						{skill === "speaking" && (
							<>
								<div className="space-y-1.5">
									<Label>Đề bài / Chủ đề</Label>
									<Textarea
										placeholder="Ví dụ: Describe your favorite place to visit..."
										value={prompt}
										onChange={(e) => setPrompt(e.target.value)}
										rows={4}
									/>
								</div>
								<div className="space-y-1.5">
									<Label>Link audio mẫu (tuỳ chọn)</Label>
									<Input
										placeholder="https://..."
										value={audioUrl}
										onChange={(e) => setAudioUrl(e.target.value)}
									/>
								</div>
							</>
						)}
						<div className="space-y-1.5">
							<Label htmlFor="asgDue">Hạn nộp (tuỳ chọn)</Label>
							<Input
								id="asgDue"
								type="datetime-local"
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
							/>
						</div>
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
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowCreate(false)}>
							Huỷ
						</Button>
						<Button
							onClick={handleCreate}
							disabled={!title.trim() || createAssignment.isPending}
						>
							{createAssignment.isPending ? "Đang tạo..." : "Tạo bài tập"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

function AnswerDisplay({
	answer,
	assignment,
}: {
	answer: string
	assignment: ClassAssignment
}) {
	const content = parseContent(assignment.content, assignment.skill)

	// MCQ answer: show correct vs student
	if (content && isMCQContent(content)) {
		try {
			const parsed = JSON.parse(answer) as { answers: number[] }
			const studentAnswers = parsed.answers
			const total = content.questions.length
			const correct = content.questions.filter(
				(q, i) => studentAnswers[i] === q.correctAnswer,
			).length

			return (
				<div className="space-y-3 rounded-lg bg-muted/30 p-4">
					<div className="flex items-center justify-between">
						<p className="text-xs font-medium text-muted-foreground">Kết quả:</p>
						<Badge
							className={
								correct === total
									? "bg-green-100 text-green-700"
									: correct >= total / 2
										? "bg-yellow-100 text-yellow-700"
										: "bg-red-100 text-red-700"
							}
						>
							{correct}/{total} đúng — {Math.round((correct / total) * 10)} điểm
						</Badge>
					</div>
					{content.questions.map((q, i) => {
						const isCorrect = studentAnswers[i] === q.correctAnswer
						return (
							<div key={`aq-${i.toString()}`} className="text-sm">
								<p className="font-medium">
									Câu {i + 1}: {q.question}
								</p>
								<div className="mt-1 flex items-center gap-3 text-xs">
									<span className={isCorrect ? "text-green-600" : "text-red-500"}>
										HS chọn: {String.fromCharCode(65 + (studentAnswers[i] ?? -1))}
										{studentAnswers[i] >= 0 ? `. ${q.options[studentAnswers[i]]}` : ""}
									</span>
									{!isCorrect && (
										<span className="text-green-600">
											Đáp án: {String.fromCharCode(65 + q.correctAnswer)}.{" "}
											{q.options[q.correctAnswer]}
										</span>
									)}
									<span>{isCorrect ? "✓" : "✗"}</span>
								</div>
							</div>
						)
					})}
				</div>
			)
		} catch {
			// fallback
		}
	}

	// Speaking: audio data URL
	if (answer.startsWith("data:audio/")) {
		return (
			<div className="rounded-lg bg-muted/30 p-4">
				<p className="mb-2 text-xs font-medium text-muted-foreground">Bản ghi âm:</p>
				<audio controls className="w-full" src={answer}>
					<track kind="captions" />
				</audio>
			</div>
		)
	}

	// Writing: show text
	return (
		<div className="rounded-lg bg-muted/30 p-4">
			<p className="mb-1 text-xs font-medium text-muted-foreground">Bài làm:</p>
			<p className="whitespace-pre-wrap text-sm">{answer}</p>
		</div>
	)
}

function LeaderboardTab({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
	if (leaderboard.length === 0) {
		return (
			<p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu xếp hạng</p>
		)
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-12">#</TableHead>
					<TableHead>Tên</TableHead>
					<TableHead className="text-right">Điểm TB</TableHead>
					<TableHead className="text-right">Số bài</TableHead>
					<TableHead className="text-right">Streak</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{leaderboard.map((entry) => (
					<TableRow key={entry.userId}>
						<TableCell className="font-semibold">{entry.rank}</TableCell>
						<TableCell>{entry.fullName}</TableCell>
						<TableCell className="text-right">{entry.avgScore}</TableCell>
						<TableCell className="text-right">{entry.totalAttempts}</TableCell>
						<TableCell className="text-right">{entry.streak} 🔥</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}

function OverviewTab({ dashboard }: { dashboard: ClassDashboard | null }) {
	if (!dashboard) return null

	return (
		<div className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-3">
				<div className="rounded-2xl bg-muted/50 p-4 text-center shadow-sm">
					<p className="text-2xl font-bold">{dashboard.memberCount}</p>
					<p className="text-xs text-muted-foreground">Thành viên</p>
				</div>
				<div className="rounded-2xl bg-muted/50 p-4 text-center shadow-sm">
					<p className="text-2xl font-bold text-orange-600">{dashboard.atRiskCount}</p>
					<p className="text-xs text-muted-foreground">Cần hỗ trợ</p>
				</div>
				<div className="rounded-2xl bg-muted/50 p-4 text-center shadow-sm">
					<p className="text-2xl font-bold">{Object.keys(dashboard.skillSummary).length}</p>
					<p className="text-xs text-muted-foreground">Kỹ năng</p>
				</div>
			</div>

			{dashboard.atRiskLearners.length > 0 && (
				<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
					<p className="text-sm font-semibold">Học viên cần hỗ trợ</p>
					<div className="mt-3 space-y-2">
						{dashboard.atRiskLearners.map((l) => (
							<div
								key={l.userId}
								className="flex items-center gap-3 rounded-lg bg-orange-50/50 p-3 dark:bg-orange-950/10"
							>
								<div className="flex size-9 items-center justify-center rounded-full bg-orange-100 text-sm font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
									{(l.fullName ?? l.email)[0]?.toUpperCase()}
								</div>
								<div className="flex-1">
									<p className="text-sm font-medium">{l.fullName ?? l.email}</p>
									<p className="text-xs text-muted-foreground">{l.reasons.join(", ")}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{Object.keys(dashboard.skillSummary).length > 0 && (
				<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
					<p className="text-sm font-semibold">Tổng quan kỹ năng</p>
					<div className="mt-3 space-y-2">
						{Object.entries(dashboard.skillSummary).map(([skill, data]) => (
							<div
								key={skill}
								className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
							>
								<span className="text-sm font-medium">{SKILL_LABELS[skill] ?? skill}</span>
								<div className="flex items-center gap-4 text-xs text-muted-foreground">
									<span>TB: {data.avgScore?.toFixed(1) ?? "—"}</span>
									<span className="text-green-600">↑{data.trendDistribution.improving}</span>
									<span>→{data.trendDistribution.stable}</span>
									<span className="text-red-500">↓{data.trendDistribution.declining}</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

function FeedbackTab({ feedback }: { feedback: ClassFeedback[] }) {
	if (feedback.length === 0) {
		return <p className="py-8 text-center text-sm text-muted-foreground">Chưa có nhận xét nào</p>
	}

	return (
		<div className="space-y-3">
			{feedback.map((fb) => (
				<div key={fb.id} className="rounded-2xl px-5 py-4 hover:bg-muted/50">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>Gửi đến: {fb.toUserName ?? fb.toUserId}</span>
						<span>{formatDate(fb.createdAt)}</span>
					</div>
					<p className="mt-2 text-sm">{fb.content}</p>
					{fb.skill && (
						<Badge variant="secondary" className="mt-2 text-[10px] capitalize">
							{SKILL_LABELS[fb.skill] ?? fb.skill}
						</Badge>
					)}
				</div>
			))}
		</div>
	)
}

interface MembersTabProps {
	members: ClassMember[]
	onFeedback: (userId: string) => void
	onRemove: (userId: string) => void
}

function MembersTab({ members, onFeedback, onRemove }: MembersTabProps) {
	if (members.length === 0) {
		return <p className="py-8 text-center text-sm text-muted-foreground">Chưa có thành viên nào</p>
	}

	return (
		<div className="space-y-2">
			{members.map((m) => (
				<div key={m.id} className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-muted/50">
					<div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
						{(m.fullName ?? m.email)[0]?.toUpperCase()}
					</div>
					<div className="flex-1">
						<p className="text-sm font-medium">{m.fullName ?? "Chưa đặt tên"}</p>
						<p className="text-xs text-muted-foreground">{m.email}</p>
					</div>
					<div className="flex items-center gap-1 text-xs text-muted-foreground">
						<HugeiconsIcon icon={UserGroup02Icon} className="size-3" />
						<span>{formatDate(m.joinedAt)}</span>
					</div>
					<div className="flex items-center gap-1.5">
						<Button
							variant="ghost"
							size="sm"
							className="gap-1 text-xs"
							onClick={() => onFeedback(m.userId)}
						>
							<HugeiconsIcon icon={Mail01Icon} className="size-3.5" />
							Nhận xét
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="text-destructive hover:text-destructive"
							onClick={() => onRemove(m.userId)}
						>
							<HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
						</Button>
					</div>
				</div>
			))}
		</div>
	)
}
