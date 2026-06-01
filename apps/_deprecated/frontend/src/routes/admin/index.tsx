import {
	Book01Icon,
	BubbleChatIcon,
	DocumentValidationIcon,
	PencilEdit01Icon,
	UserGroup02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/admin/")({
	component: AdminDashboard,
})

const sections = [
	{
		label: "Người dùng",
		desc: "Quản lý tài khoản, phân quyền",
		icon: UserGroup02Icon,
		href: "/admin/users" as const,
	},
	{
		label: "Đề thi",
		desc: "Tạo và quản lý đề thi VSTEP",
		icon: DocumentValidationIcon,
		href: "/admin/exams" as const,
	},
	{
		label: "Câu hỏi",
		desc: "Ngân hàng câu hỏi theo kỹ năng",
		icon: Book01Icon,
		href: "/admin/questions" as const,
	},
	{
		label: "Điểm kiến thức",
		desc: "Phân loại kiến thức theo danh mục",
		icon: BubbleChatIcon,
		href: "/admin/knowledge-points" as const,
	},
	{
		label: "Bài nộp",
		desc: "Chấm điểm và quản lý bài làm",
		icon: PencilEdit01Icon,
		href: "/admin/submissions" as const,
	},
]

function AdminDashboard() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Chào mừng Admin</h1>
				<p className="mt-1 text-sm text-muted-foreground">Chọn mục để quản lý</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{sections.map((s) => (
					<Link
						key={s.label}
						to={s.href}
						className={cn(
							"flex items-start gap-4 rounded-2xl border border-border bg-background p-6 transition-colors hover:border-primary",
						)}
					>
						<div className="inline-flex shrink-0 rounded-xl bg-primary/10 p-3 text-primary">
							<HugeiconsIcon icon={s.icon} className="size-6" />
						</div>
						<div>
							<p className="font-bold">{s.label}</p>
							<p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
						</div>
					</Link>
				))}
			</div>
		</div>
	)
}
