import {
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
import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
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
	MockAssignment,
	MockAssignmentSubmission,
	MockFeedback,
	MockInstructorClassDetail,
	MockInstructorDashboard,
	MockLeaderboardEntry,
} from "@/lib/mock-classes"
import {
	getMockAssignmentSubmissions,
	getMockAssignments,
	getMockFeedback,
	getMockInstructorClassDetail,
	getMockInstructorDashboard,
	getMockLeaderboard,
} from "@/lib/mock-classes"

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
	return new Date(dateStr).toLocaleDateString("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	})
}

function ClassDetailPage() {
	const { classId } = Route.useParams()
	const [isLoading, setIsLoading] = useState(true)
	const [cls, setCls] = useState<MockInstructorClassDetail | null>(null)
	const [dashboard, setDashboard] = useState<MockInstructorDashboard | null>(null)
	const [assignments, setAssignments] = useState<MockAssignment[]>([])
	const [submissionMap, setSubmissionMap] = useState<Record<string, MockAssignmentSubmission[]>>({})
	const [leaderboard, setLeaderboard] = useState<MockLeaderboardEntry[]>([])
	const [feedback, setFeedback] = useState<MockFeedback[]>([])

	const [showEdit, setShowEdit] = useState(false)
	const [editName, setEditName] = useState("")
	const [editDesc, setEditDesc] = useState("")
	const [showFeedback, setShowFeedback] = useState(false)
	const [feedbackUserId, setFeedbackUserId] = useState("")
	const [feedbackContent, setFeedbackContent] = useState("")

	useEffect(() => {
		const timer = setTimeout(() => {
			setCls(getMockInstructorClassDetail(classId))
			setDashboard(getMockInstructorDashboard(classId))

			const asgList = getMockAssignments(classId)
			setAssignments(asgList)

			const sMap: Record<string, MockAssignmentSubmission[]> = {}
			for (const asg of asgList) {
				sMap[asg.id] = getMockAssignmentSubmissions(asg.id)
			}
			setSubmissionMap(sMap)

			setLeaderboard(getMockLeaderboard(classId))
			setFeedback(getMockFeedback(classId))
			setIsLoading(false)
		}, 500)
		return () => clearTimeout(timer)
	}, [classId])

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
		setCls({ ...cls, name: editName.trim(), description: editDesc.trim() || null })
		setShowEdit(false)
	}

	function handleRotateCode() {
		if (!cls) return
		const newCode = `${cls.inviteCode?.split(`-`).slice(0, -1).join(`-`) ?? `NEW`}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
		setCls({ ...cls, inviteCode: newCode })
	}

	function handleRemoveMember(userId: string) {
		if (!cls) return
		setCls({
			...cls,
			members: cls.members.filter((m) => m.userId !== userId),
			memberCount: cls.memberCount - 1,
		})
	}

	function openFeedback(userId: string) {
		setFeedbackUserId(userId)
		setFeedbackContent("")
		setShowFeedback(true)
	}

	function handleSendFeedback() {
		if (!feedbackContent.trim()) return
		const toMember = cls?.members.find((m) => m.userId === feedbackUserId)
		const newFb: MockFeedback = {
			id: `fb-new-${Date.now()}`,
			classId,
			fromUserId: "inst-001",
			fromName: "Nguyễn Văn Hùng",
			toUserId: feedbackUserId,
			toName: toMember?.fullName ?? feedbackUserId,
			content: feedbackContent.trim(),
			skill: null,
			createdAt: new Date().toISOString(),
		}
		setFeedback((prev) => [newFb, ...prev])
		setShowFeedback(false)
	}

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
						onClick={() => navigator.clipboard.writeText(cls.inviteCode ?? "")}
					>
						<HugeiconsIcon icon={Copy01Icon} className="size-4" />
					</button>
					<Button
						variant="ghost"
						size="sm"
						className="ml-auto gap-1.5 text-xs"
						onClick={handleRotateCode}
					>
						<HugeiconsIcon icon={RefreshIcon} className="size-3.5" />
						Đổi mã
					</Button>
				</div>
			)}

			{/* Tabs */}
			<Tabs defaultValue="assignments">
				<TabsList className="w-full">
					<TabsTrigger value="overview">Tổng quan</TabsTrigger>
					<TabsTrigger value="assignments">Bài tập</TabsTrigger>
					<TabsTrigger value="leaderboard">Bảng xếp hạng</TabsTrigger>
					<TabsTrigger value="feedback">Nhận xét</TabsTrigger>
					<TabsTrigger value="members">Thành viên ({cls.memberCount})</TabsTrigger>
				</TabsList>

				<TabsContent value="overview">
					<OverviewTab dashboard={dashboard} />
				</TabsContent>

				<TabsContent value="assignments">
					<AssignmentsTab assignments={assignments} submissionMap={submissionMap} />
				</TabsContent>

				<TabsContent value="leaderboard">
					<LeaderboardTab leaderboard={leaderboard} />
				</TabsContent>

				<TabsContent value="feedback">
					<FeedbackTab feedback={feedback} />
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
						<Button onClick={handleEdit} disabled={!editName.trim()}>
							Lưu
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
						<Button onClick={handleSendFeedback} disabled={!feedbackContent.trim()}>
							Gửi nhận xét
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

// ── Tab Components ──

function OverviewTab({ dashboard }: { dashboard: MockInstructorDashboard | null }) {
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

function AssignmentsTab({
	assignments,
	submissionMap,
}: {
	assignments: MockAssignment[]
	submissionMap: Record<string, MockAssignmentSubmission[]>
}) {
	if (assignments.length === 0) {
		return <p className="py-8 text-center text-sm text-muted-foreground">Chưa có bài tập nào</p>
	}

	return (
		<div className="space-y-3">
			{assignments.map((asg) => {
				const subs = submissionMap[asg.id] ?? []
				const graded = subs.filter((s) => s.status === "graded").length
				const submitted = subs.filter((s) => s.status === "submitted").length
				const pending = subs.filter((s) => s.status === "pending").length

				return (
					<div key={asg.id} className="rounded-2xl bg-muted/50 p-5 shadow-sm">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div className="space-y-1.5">
								<p className="font-semibold">{asg.title}</p>
								<div className="flex flex-wrap items-center gap-1.5">
									<Badge variant="secondary" className="text-[10px] capitalize">
										{SKILL_LABELS[asg.skill] ?? asg.skill}
									</Badge>
									<Badge variant="outline" className="text-[10px]">
										{asg.type === "exam" ? "Thi thử" : "Luyện tập"}
									</Badge>
								</div>
								{asg.dueDate && (
									<div className="flex items-center gap-1 text-xs text-muted-foreground">
										<HugeiconsIcon icon={Calendar03Icon} className="size-3" />
										<span>Hạn nộp: {formatDate(asg.dueDate)}</span>
									</div>
								)}
							</div>

							<div className="flex items-center gap-2">
								<Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
									<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" />
									{graded} đã chấm
								</Badge>
								{submitted > 0 && (
									<Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
										<HugeiconsIcon icon={Clock01Icon} className="size-3" />
										{submitted} chờ chấm
									</Badge>
								)}
								{pending > 0 && <Badge variant="outline">{pending} chưa nộp</Badge>}
							</div>
						</div>

						{/* Submission details */}
						{subs.length > 0 && (
							<div className="mt-3 space-y-1.5 border-t pt-3">
								{subs.map((sub) => (
									<div
										key={sub.id}
										className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted/30"
									>
										<span>{sub.fullName}</span>
										<div className="flex items-center gap-2">
											{sub.status === "graded" ? (
												<span className="font-semibold text-green-700 dark:text-green-400">
													{sub.score} điểm
												</span>
											) : sub.status === "submitted" ? (
												<span className="text-xs text-yellow-600">Chờ chấm</span>
											) : (
												<span className="text-xs text-muted-foreground">Chưa nộp</span>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)
			})}
		</div>
	)
}

function LeaderboardTab({ leaderboard }: { leaderboard: MockLeaderboardEntry[] }) {
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
					<TableHead className="text-right">Số bài nộp</TableHead>
					<TableHead className="text-right">Streak</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{leaderboard.map((entry) => (
					<TableRow key={entry.userId}>
						<TableCell className="font-semibold">{entry.rank}</TableCell>
						<TableCell>{entry.fullName}</TableCell>
						<TableCell className="text-right">{entry.avgScore}</TableCell>
						<TableCell className="text-right">{entry.totalSubmissions}</TableCell>
						<TableCell className="text-right">{entry.streak} 🔥</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}

function FeedbackTab({ feedback }: { feedback: MockFeedback[] }) {
	if (feedback.length === 0) {
		return <p className="py-8 text-center text-sm text-muted-foreground">Chưa có nhận xét nào</p>
	}

	return (
		<div className="space-y-3">
			{feedback.map((fb) => (
				<div key={fb.id} className="rounded-2xl px-5 py-4 hover:bg-muted/50">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>Gửi đến: {fb.toName}</span>
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
	members: MockInstructorClassDetail["members"]
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
