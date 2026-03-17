import {
	Add01Icon,
	ArrowRight01Icon,
	Copy01Icon,
	Delete02Icon,
	UserGroup02Icon,
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
import { useClasses, useCreateClass, useDeleteClass } from "@/hooks/use-classes"
import { user } from "@/lib/auth"
import { getMockClasses } from "@/lib/mock-classes"

export const Route = createFileRoute("/_learner/dashboard")({
	component: DashboardPage,
})

function DashboardPage() {
	const currentUser = user()
	const isInstructor = currentUser?.role === "instructor" || currentUser?.role === "admin"

	return isInstructor ? <InstructorView /> : <LearnerView />
}

function InstructorView() {
	const { data, isLoading } = useClasses()
	const createClass = useCreateClass()
	const deleteClass = useDeleteClass()
	const [showCreate, setShowCreate] = useState(false)
	const [name, setName] = useState("")
	const [description, setDescription] = useState("")

	const classes = data?.data ?? []

	function handleCreate() {
		if (!name.trim()) return
		createClass.mutate(
			{ name: name.trim(), description: description.trim() || undefined },
			{
				onSuccess: () => {
					setShowCreate(false)
					setName("")
					setDescription("")
				},
			},
		)
	}

	function handleCopyCode(code: string) {
		navigator.clipboard.writeText(code)
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Lớp học của tôi</h1>
					<p className="mt-1 text-muted-foreground">Quản lý các lớp học của bạn</p>
				</div>
				<Button className="gap-1.5" onClick={() => setShowCreate(true)}>
					<HugeiconsIcon icon={Add01Icon} className="size-4" />
					Tạo lớp mới
				</Button>
			</div>

			{isLoading ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={`skeleton-${i.toString()}`} className="h-36 rounded-2xl" />
					))}
				</div>
			) : classes.length === 0 ? (
				<div className="flex flex-col items-center gap-4 py-16">
					<div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
						<HugeiconsIcon icon={UserGroup02Icon} className="size-8 text-muted-foreground" />
					</div>
					<p className="text-muted-foreground">Chưa có lớp học nào</p>
					<Button variant="outline" onClick={() => setShowCreate(true)}>
						Tạo lớp đầu tiên
					</Button>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{classes.map((cls) => (
						<div
							key={cls.id}
							className="flex flex-col rounded-2xl p-5 transition-colors hover:bg-muted/50"
						>
							<div className="flex items-start gap-3">
								<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<HugeiconsIcon icon={UserGroup02Icon} className="size-5" />
								</div>
								<div className="flex-1">
									<p className="font-semibold">{cls.name}</p>
									{cls.description && (
										<p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
											{cls.description}
										</p>
									)}
								</div>
							</div>

							<div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
								<span className="rounded bg-muted px-2 py-0.5 font-mono">{cls.inviteCode}</span>
								<button
									type="button"
									className="text-muted-foreground hover:text-foreground"
									onClick={() => handleCopyCode(cls.inviteCode)}
								>
									<HugeiconsIcon icon={Copy01Icon} className="size-3.5" />
								</button>
							</div>

							<div className="mt-auto flex items-center gap-2 pt-4">
								<Button size="sm" variant="outline" className="flex-1 gap-1.5" asChild>
									<Link to="/dashboard/$classId" params={{ classId: cls.id }}>
										Chi tiết
										<HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
									</Link>
								</Button>
								<Button
									size="sm"
									variant="ghost"
									className="text-destructive hover:text-destructive"
									onClick={() => deleteClass.mutate(cls.id)}
									disabled={deleteClass.isPending}
								>
									<HugeiconsIcon icon={Delete02Icon} className="size-4" />
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			<Dialog open={showCreate} onOpenChange={setShowCreate}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Tạo lớp mới</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="className">Tên lớp</Label>
							<Input
								id="className"
								placeholder="Ví dụ: VSTEP B2 - Lớp 1"
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="classDesc">Mô tả (tuỳ chọn)</Label>
							<Textarea
								id="classDesc"
								placeholder="Mô tả ngắn về lớp học..."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowCreate(false)}>
							Huỷ
						</Button>
						<Button onClick={handleCreate} disabled={createClass.isPending || !name.trim()}>
							{createClass.isPending ? "Đang tạo..." : "Tạo lớp"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

function LearnerView() {
	const classes = getMockClasses("learner")

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Lớp học của tôi</h1>
					<p className="mt-1 text-muted-foreground">Xem các lớp học bạn đã tham gia</p>
				</div>
			</div>

			{classes.length === 0 ? (
				<div className="flex flex-col items-center gap-4 py-16">
					<div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
						<HugeiconsIcon icon={UserGroup02Icon} className="size-8 text-muted-foreground" />
					</div>
					<p className="text-muted-foreground">Bạn chưa tham gia lớp học nào</p>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{classes.map((cls) => (
						<div
							key={cls.id}
							className="flex flex-col rounded-2xl p-5 transition-colors hover:bg-muted/50"
						>
							<div className="flex items-start gap-3">
								<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<HugeiconsIcon icon={UserGroup02Icon} className="size-5" />
								</div>
								<div className="flex-1">
									<p className="font-semibold">{cls.name}</p>
									{cls.description && (
										<p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
											{cls.description}
										</p>
									)}
								</div>
							</div>

							<div className="mt-auto flex items-center gap-2 pt-4">
								<Button size="sm" variant="outline" className="flex-1 gap-1.5" asChild>
									<Link to="/classes/$classId" params={{ classId: cls.id }}>
										Chi tiết
										<HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
									</Link>
								</Button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
