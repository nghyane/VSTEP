import {
	ArrowLeft01Icon,
	Copy01Icon,
	Delete02Icon,
	Mail01Icon,
	PencilEdit01Icon,
	RefreshIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
	useClass,
	useClassDashboard,
	useClassFeedback,
	useRemoveMember,
	useRotateCode,
	useSendFeedback,
	useUpdateClass,
} from "@/hooks/use-classes"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_learner/dashboard/$classId")({
	component: ClassDetailPage,
})

type Tab = "members" | "dashboard" | "feedback"

function ClassDetailPage() {
	const { classId } = Route.useParams()
	const { data: cls, isLoading } = useClass(classId)
	const { data: dashboard } = useClassDashboard(classId)
	const { data: feedbackData } = useClassFeedback(classId)
	const rotateCode = useRotateCode()
	const updateClass = useUpdateClass()
	const removeMember = useRemoveMember()
	const sendFeedback = useSendFeedback()

	const [tab, setTab] = useState<Tab>("members")
	const [showEdit, setShowEdit] = useState(false)
	const [editName, setEditName] = useState("")
	const [editDesc, setEditDesc] = useState("")
	const [showFeedback, setShowFeedback] = useState(false)
	const [feedbackUserId, setFeedbackUserId] = useState("")
	const [feedbackContent, setFeedbackContent] = useState("")

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-48 rounded-2xl" />
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
		updateClass.mutate(
			{ id: classId, name: editName.trim(), description: editDesc.trim() || undefined },
			{ onSuccess: () => setShowEdit(false) },
		)
	}

	function openFeedback(userId: string) {
		setFeedbackUserId(userId)
		setFeedbackContent("")
		setShowFeedback(true)
	}

	function handleSendFeedback() {
		if (!feedbackContent.trim()) return
		sendFeedback.mutate(
			{ classId, toUserId: feedbackUserId, content: feedbackContent.trim() },
			{ onSuccess: () => setShowFeedback(false) },
		)
	}

	const feedbackList = feedbackData?.data ?? []

	const tabs: { key: Tab; label: string }[] = [
		{ key: "members", label: `Thành viên (${cls.memberCount})` },
		{ key: "dashboard", label: "Tổng quan" },
		{ key: "feedback", label: "Nhận xét" },
	]

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
						<p className="mt-0.5 text-sm text-muted-foreground">{cls.description}</p>
					)}
				</div>
				<Button variant="outline" size="sm" className="gap-1.5" onClick={openEdit}>
					<HugeiconsIcon icon={PencilEdit01Icon} className="size-3.5" />
					Sửa
				</Button>
			</div>

			{cls.inviteCode && (
				<div className="flex items-center gap-3 rounded-2xl bg-muted/50 px-4 py-3">
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
						onClick={() => rotateCode.mutate(classId)}
						disabled={rotateCode.isPending}
					>
						<HugeiconsIcon icon={RefreshIcon} className="size-3.5" />
						Đổi mã
					</Button>
				</div>
			)}

			<div className="flex gap-1 rounded-lg bg-muted/50 p-1">
				{tabs.map((t) => (
					<button
						key={t.key}
						type="button"
						className={cn(
							"flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
							tab === t.key
								? "bg-background shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
						onClick={() => setTab(t.key)}
					>
						{t.label}
					</button>
				))}
			</div>

			{tab === "members" && (
				<div className="space-y-2">
					{cls.members.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">Chưa có thành viên nào</p>
					) : (
						cls.members.map((m) => (
							<div key={m.id} className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-muted/50">
								<div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
									{(m.fullName ?? m.email)[0]?.toUpperCase()}
								</div>
								<div className="flex-1">
									<p className="text-sm font-medium">{m.fullName ?? "Chưa đặt tên"}</p>
									<p className="text-xs text-muted-foreground">{m.email}</p>
								</div>
								<div className="flex items-center gap-1.5">
									<Button
										variant="ghost"
										size="sm"
										className="gap-1 text-xs"
										onClick={() => openFeedback(m.userId)}
									>
										<HugeiconsIcon icon={Mail01Icon} className="size-3.5" />
										Nhận xét
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="text-destructive hover:text-destructive"
										onClick={() => removeMember.mutate({ classId, userId: m.userId })}
										disabled={removeMember.isPending}
									>
										<HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
									</Button>
								</div>
							</div>
						))
					)}
				</div>
			)}

			{tab === "dashboard" && dashboard && (
				<div className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-3">
						<div className="rounded-2xl bg-muted/50 p-4 text-center">
							<p className="text-2xl font-bold">{dashboard.memberCount}</p>
							<p className="text-xs text-muted-foreground">Thành viên</p>
						</div>
						<div className="rounded-2xl bg-muted/50 p-4 text-center">
							<p className="text-2xl font-bold text-orange-600">{dashboard.atRiskCount}</p>
							<p className="text-xs text-muted-foreground">Cần hỗ trợ</p>
						</div>
						<div className="rounded-2xl bg-muted/50 p-4 text-center">
							<p className="text-2xl font-bold">{Object.keys(dashboard.skillSummary).length}</p>
							<p className="text-xs text-muted-foreground">Kỹ năng</p>
						</div>
					</div>

					{dashboard.atRiskLearners.length > 0 && (
						<div className="rounded-2xl bg-muted/50 p-5">
							<p className="text-sm font-semibold">Học viên cần hỗ trợ</p>
							<div className="mt-3 space-y-2">
								{dashboard.atRiskLearners.map((l) => (
									<div
										key={l.userId}
										className="flex items-center gap-3 rounded-lg bg-orange-50/50 p-3 dark:bg-orange-950/10"
									>
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
						<div className="rounded-2xl bg-muted/50 p-5">
							<p className="text-sm font-semibold">Tổng quan kỹ năng</p>
							<div className="mt-3 space-y-2">
								{Object.entries(dashboard.skillSummary).map(([skill, data]) => (
									<div
										key={skill}
										className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
									>
										<span className="text-sm font-medium capitalize">{skill}</span>
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
			)}

			{tab === "feedback" && (
				<div className="space-y-2">
					{feedbackList.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">Chưa có nhận xét nào</p>
					) : (
						feedbackList.map((fb) => (
							<div key={fb.id} className="rounded-2xl px-4 py-3 hover:bg-muted/50">
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<span>Gửi đến: {fb.toUserId}</span>
									<span>
										{new Date(fb.createdAt).toLocaleDateString("vi-VN", {
											day: "2-digit",
											month: "2-digit",
											year: "numeric",
										})}
									</span>
								</div>
								<p className="mt-1 text-sm">{fb.content}</p>
								{fb.skill && (
									<span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-[10px] capitalize">
										{fb.skill}
									</span>
								)}
							</div>
						))
					)}
				</div>
			)}

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
						<Button onClick={handleEdit} disabled={updateClass.isPending}>
							{updateClass.isPending ? "Đang lưu..." : "Lưu"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

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
							disabled={sendFeedback.isPending || !feedbackContent.trim()}
						>
							{sendFeedback.isPending ? "Đang gửi..." : "Gửi nhận xét"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
