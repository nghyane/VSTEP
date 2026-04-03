import {
	ArrowLeft01Icon,
	Calendar03Icon,
	CheckmarkCircle02Icon,
	Clock01Icon,
	RefreshIcon,
	UserGroup02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

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
	ClassAssignment,
	ClassFeedback,
	ClassMember,
	LeaderboardEntry,
} from "@/hooks/use-classes"
import { useAssignments, useClass, useClassFeedback, useLeaderboard } from "@/hooks/use-classes"
import { user } from "@/lib/auth"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_learner/classes/$classId")({
	component: LearnerClassDetailPage,
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

function LearnerClassDetailPage() {
	const { classId } = Route.useParams()
	const currentUser = user()
	const [activeTab, setActiveTab] = useState("assignments")
	const { data: cls, isLoading } = useClass(classId)
	const { data: feedbackData } = useClassFeedback(classId)
	const { data: assignmentsData } = useAssignments(classId)
	const { data: leaderboardData } = useLeaderboard(classId)

	// Filter feedback for current user only
	const feedback = (feedbackData?.data ?? []).filter((fb) => fb.toUserId === currentUser?.id)
	const assignments = assignmentsData ?? []
	const leaderboard = leaderboardData ?? []

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

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" className="size-8" asChild>
					<Link to="/dashboard">
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-semibold tracking-tight">{cls.name}</h1>
					{cls.description && (
						<p className="mt-1 text-sm text-muted-foreground">{cls.description}</p>
					)}
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="w-full">
					<TabsTrigger value="assignments">Bài tập</TabsTrigger>
					<TabsTrigger value="leaderboard">Bảng xếp hạng</TabsTrigger>
					<TabsTrigger value="feedback">Nhận xét</TabsTrigger>
					<TabsTrigger value="members">Thành viên</TabsTrigger>
				</TabsList>

				<TabsContent value="assignments">
					<LearnerAssignmentsTab
						classId={classId}
						assignments={assignments}
						currentUserId={currentUser?.id ?? ""}
					/>
				</TabsContent>

				<TabsContent value="leaderboard">
					<LeaderboardTab leaderboard={leaderboard} currentUserId={currentUser?.id ?? ""} />
				</TabsContent>

				<TabsContent value="feedback">
					<FeedbackTab feedback={feedback} />
				</TabsContent>

				<TabsContent value="members">
					<MembersTab members={cls.members} />
				</TabsContent>
			</Tabs>
		</div>
	)
}

function LearnerAssignmentsTab({
	classId,
	assignments,
	currentUserId,
}: {
	classId: string
	assignments: ClassAssignment[]
	currentUserId: string
}) {
	const qc = useQueryClient()

	if (assignments.length === 0) {
		return <p className="py-8 text-center text-sm text-muted-foreground">Chưa có bài tập nào</p>
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Button
					size="sm"
					variant="outline"
					className="gap-1.5"
					onClick={() => qc.invalidateQueries({ queryKey: ["classes", classId, "assignments"] })}
				>
					<HugeiconsIcon icon={RefreshIcon} className="size-3.5" />
					Tải lại
				</Button>
			</div>
			{assignments.map((asg) => {
				const mySub = asg.submissions?.find((s) => s.userId === currentUserId)
				const hasContent = !!asg.content
				const canRetry = asg.allowRetry && mySub?.status !== "pending"

				return (
					<div key={asg.id} className="rounded-2xl bg-muted/50 shadow-sm">
						{/* Header */}
						<div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
							<div className="space-y-1.5">
								<p className="font-semibold">{asg.title}</p>
								{asg.description && (
									<p className="text-sm text-muted-foreground">{asg.description}</p>
								)}
								<div className="flex flex-wrap items-center gap-1.5">
									{asg.skill && (
										<Badge variant="secondary" className="text-[10px] capitalize">
											{SKILL_LABELS[asg.skill] ?? asg.skill}
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

							<div className="flex items-center gap-2">
								{mySub?.status === "graded" ? (
									<>
										<Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
											<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" />
											Đã chấm — {mySub.score} điểm
										</Badge>
										{canRetry && (
											<Button size="sm" variant="outline" asChild>
												<Link
													to="/classes/$classId/do/$assignmentId"
													params={{ classId, assignmentId: asg.id }}
												>
													Làm lại
												</Link>
											</Button>
										)}
									</>
								) : mySub?.status === "submitted" ? (
									<>
										<Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
											<HugeiconsIcon icon={Clock01Icon} className="size-3" />
											Đã nộp — chờ chấm
										</Badge>
										{mySub.lateMinutes != null && mySub.lateMinutes > 0 && (
											<Badge variant="destructive" className="text-[10px]">
												Trễ{" "}
												{mySub.lateMinutes >= 60
													? `${Math.floor(mySub.lateMinutes / 60)}h${mySub.lateMinutes % 60 > 0 ? `${mySub.lateMinutes % 60}p` : ""}`
													: `${mySub.lateMinutes} phút`}
											</Badge>
										)}
									</>
								) : hasContent ? (
									<Button size="sm" className="gap-1.5" asChild>
										<Link
											to="/classes/$classId/do/$assignmentId"
											params={{ classId, assignmentId: asg.id }}
										>
											Làm bài
										</Link>
									</Button>
								) : (
									<Badge variant="outline">Chưa có đề</Badge>
								)}
							</div>
						</div>

						{/* Feedback from GV */}
						{mySub?.feedback && (
							<div className="mx-5 mb-4 rounded-lg bg-blue-50/50 p-4 dark:bg-blue-950/10">
								<p className="mb-1 text-xs font-medium text-blue-600">Nhận xét từ giảng viên:</p>
								<p className="whitespace-pre-wrap text-sm">{mySub.feedback}</p>
							</div>
						)}
					</div>
				)
			})}
		</div>
	)
}

function LeaderboardTab({
	leaderboard,
	currentUserId,
}: {
	leaderboard: LeaderboardEntry[]
	currentUserId: string
}) {
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
					<TableRow
						key={entry.userId}
						className={cn(entry.userId === currentUserId && "bg-primary/5 font-medium")}
					>
						<TableCell className="font-semibold">{entry.rank}</TableCell>
						<TableCell>
							<div className="flex items-center gap-2">
								<span>{entry.fullName}</span>
								{entry.userId === currentUserId && (
									<Badge variant="secondary" className="text-[10px]">
										Bạn
									</Badge>
								)}
							</div>
						</TableCell>
						<TableCell className="text-right">{entry.avgScore}</TableCell>
						<TableCell className="text-right">{entry.totalAttempts}</TableCell>
						<TableCell className="text-right">{entry.streak} 🔥</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}

function FeedbackTab({ feedback }: { feedback: ClassFeedback[] }) {
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
						<span>Từ: {fb.fromUserName ?? fb.fromUserId}</span>
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

function MembersTab({ members }: { members: ClassMember[] }) {
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
				</div>
			))}
		</div>
	)
}
