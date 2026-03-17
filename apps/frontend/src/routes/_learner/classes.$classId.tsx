import {
	ArrowLeft01Icon,
	Calendar03Icon,
	CheckmarkCircle02Icon,
	Clock01Icon,
	UserGroup02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import type {
	MockAssignment,
	MockAssignmentSubmission,
	MockClass,
	MockFeedback,
	MockLeaderboardEntry,
	MockMember,
} from "@/lib/mock-classes"
import {
	getMockAssignmentSubmissions,
	getMockAssignments,
	getMockClassDetail,
	getMockLeaderboard,
	getMockLearnerFeedback,
} from "@/lib/mock-classes"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_learner/classes/$classId")({
	component: LearnerClassDetailPage,
})

const CURRENT_USER_ID = "u-101"

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

function LearnerClassDetailPage() {
	const { classId } = Route.useParams()
	const [isLoading, setIsLoading] = useState(true)
	const [classInfo, setClassInfo] = useState<MockClass | null>(null)
	const [members, setMembers] = useState<MockMember[]>([])
	const [assignments, setAssignments] = useState<MockAssignment[]>([])
	const [submissionMap, setSubmissionMap] = useState<
		Record<string, MockAssignmentSubmission | undefined>
	>({})
	const [leaderboard, setLeaderboard] = useState<MockLeaderboardEntry[]>([])
	const [feedback, setFeedback] = useState<MockFeedback[]>([])

	useEffect(() => {
		const timer = setTimeout(() => {
			const detail = getMockClassDetail(classId)
			if (detail) {
				setClassInfo(detail.class)
				setMembers(detail.members)
			}

			const asgList = getMockAssignments(classId)
			setAssignments(asgList)

			const sMap: Record<string, MockAssignmentSubmission | undefined> = {}
			for (const asg of asgList) {
				const subs = getMockAssignmentSubmissions(asg.id)
				sMap[asg.id] = subs.find((s) => s.userId === CURRENT_USER_ID)
			}
			setSubmissionMap(sMap)

			setLeaderboard(getMockLeaderboard(classId))
			setFeedback(getMockLearnerFeedback(classId, CURRENT_USER_ID))
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

	if (!classInfo) {
		return (
			<div className="flex flex-col items-center gap-4 py-16">
				<p className="text-muted-foreground">Không tìm thấy lớp học</p>
				<Button variant="outline" asChild>
					<Link to="/dashboard">Quay lại</Link>
				</Button>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" className="size-8" asChild>
					<Link to="/dashboard">
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-semibold tracking-tight">{classInfo.name}</h1>
					<p className="mt-0.5 text-sm text-muted-foreground">
						Giảng viên: {classInfo.instructorName}
					</p>
					{classInfo.description && (
						<p className="mt-1 text-sm text-muted-foreground">{classInfo.description}</p>
					)}
				</div>
			</div>

			<Tabs defaultValue="assignments">
				<TabsList className="w-full">
					<TabsTrigger value="assignments">Bài tập</TabsTrigger>
					<TabsTrigger value="leaderboard">Bảng xếp hạng</TabsTrigger>
					<TabsTrigger value="feedback">Nhận xét</TabsTrigger>
					<TabsTrigger value="members">Thành viên</TabsTrigger>
				</TabsList>

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
					<MembersTab members={members} />
				</TabsContent>
			</Tabs>
		</div>
	)
}

interface AssignmentsTabProps {
	assignments: MockAssignment[]
	submissionMap: Record<string, MockAssignmentSubmission | undefined>
}

function AssignmentsTab({ assignments, submissionMap }: AssignmentsTabProps) {
	if (assignments.length === 0) {
		return <p className="py-8 text-center text-sm text-muted-foreground">Chưa có bài tập nào</p>
	}

	return (
		<div className="space-y-3">
			{assignments.map((asg) => {
				const sub = submissionMap[asg.id]
				return (
					<div
						key={asg.id}
						className="flex flex-col gap-3 rounded-2xl bg-muted/50 p-5 sm:flex-row sm:items-center sm:justify-between"
					>
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
							{sub?.status === "graded" ? (
								<Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
									<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" />
									Đã chấm — {sub.score} điểm
								</Badge>
							) : sub?.status === "submitted" ? (
								<Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
									<HugeiconsIcon icon={Clock01Icon} className="size-3" />
									Đã nộp
								</Badge>
							) : (
								<>
									<Badge variant="outline">Chưa nộp</Badge>
									<Button size="sm" className="gap-1.5">
										Làm bài
									</Button>
								</>
							)}
						</div>
					</div>
				)
			})}
		</div>
	)
}

interface LeaderboardTabProps {
	leaderboard: MockLeaderboardEntry[]
}

function LeaderboardTab({ leaderboard }: LeaderboardTabProps) {
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
					<TableRow
						key={entry.userId}
						className={cn(entry.userId === CURRENT_USER_ID && "bg-primary/5 font-medium")}
					>
						<TableCell className="font-semibold">{entry.rank}</TableCell>
						<TableCell>
							<div className="flex items-center gap-2">
								<span>{entry.fullName}</span>
								{entry.userId === CURRENT_USER_ID && (
									<Badge variant="secondary" className="text-[10px]">
										Bạn
									</Badge>
								)}
							</div>
						</TableCell>
						<TableCell className="text-right">{entry.avgScore}</TableCell>
						<TableCell className="text-right">{entry.totalSubmissions}</TableCell>
						<TableCell className="text-right">{entry.streak} 🔥</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}

interface FeedbackTabProps {
	feedback: MockFeedback[]
}

function FeedbackTab({ feedback }: FeedbackTabProps) {
	if (feedback.length === 0) {
		return (
			<p className="py-8 text-center text-sm text-muted-foreground">
				Chưa có nhận xét nào từ giảng viên
			</p>
		)
	}

	return (
		<div className="space-y-3">
			{feedback.map((fb) => (
				<div key={fb.id} className="rounded-2xl px-5 py-4 hover:bg-muted/50">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>Từ: {fb.fromName}</span>
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
	members: MockMember[]
}

function MembersTab({ members }: MembersTabProps) {
	if (members.length === 0) {
		return <p className="py-8 text-center text-sm text-muted-foreground">Chưa có thành viên nào</p>
	}

	return (
		<div className="space-y-2">
			{members.map((m) => (
				<div key={m.id} className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-muted/50">
					<div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
						{m.fullName[0]?.toUpperCase()}
					</div>
					<div className="flex-1">
						<p className="text-sm font-medium">{m.fullName}</p>
						<p className="text-xs text-muted-foreground">{m.email}</p>
					</div>
					<div className="flex items-center gap-1 text-xs text-muted-foreground">
						<HugeiconsIcon icon={UserGroup02Icon} className="size-3" />
						<span>{formatDate(m.joinedAt)}</span>
					</div>
				</div>
			))}
		</div>
	)
}
