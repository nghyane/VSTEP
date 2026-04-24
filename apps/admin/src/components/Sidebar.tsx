import { Link, useLocation } from "@tanstack/react-router"
import {
	BookOpen,
	ClipboardList,
	Database,
	Globe,
	Headphones,
	Home,
	LayoutGrid,
	Pencil,
	Settings,
	Speaker,
	Users,
} from "lucide-react"
import { cn } from "#/lib/utils"

interface NavItem {
	label: string
	to: string
	icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
	label: string
	items: NavItem[]
}

const groups: NavGroup[] = [
	{
		label: "Tổng quan",
		items: [{ label: "Dashboard", to: "/", icon: Home }],
	},
	{
		label: "Nội dung",
		items: [
			{ label: "Từ vựng", to: "/vocab", icon: BookOpen },
			{ label: "Ngữ pháp", to: "/grammar", icon: Pencil },
		],
	},
	{
		label: "Đề thi",
		items: [{ label: "Danh sách đề", to: "/exams", icon: ClipboardList }],
	},
	{
		label: "Luyện tập",
		items: [
			{ label: "Nghe", to: "/practice/listening", icon: Headphones },
			{ label: "Đọc", to: "/practice/reading", icon: Globe },
			{ label: "Viết", to: "/practice/writing", icon: Pencil },
			{ label: "Phát âm", to: "/practice/speaking-drills", icon: Speaker },
			{ label: "Nói", to: "/practice/speaking-tasks", icon: LayoutGrid },
		],
	},
	{
		label: "Quản lý",
		items: [
			{ label: "Người dùng", to: "/users", icon: Users },
			{ label: "Khóa học", to: "/courses", icon: Database },
			{ label: "Khuyến mãi", to: "/promo", icon: LayoutGrid },
		],
	},
	{
		label: "Hệ thống",
		items: [{ label: "Cấu hình", to: "/settings", icon: Settings }],
	},
]

export function Sidebar() {
	const { pathname } = useLocation()

	return (
		<aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
			<div className="flex h-14 items-center border-b border-border px-5">
				<span className="text-sm font-semibold tracking-tight">VSTEP Admin</span>
			</div>
			<nav className="flex-1 overflow-y-auto px-3 py-4">
				{groups.map((group) => (
					<div key={group.label} className="mb-5">
						<div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">
							{group.label}
						</div>
						<ul className="flex flex-col gap-0.5">
							{group.items.map((item) => {
								const Icon = item.icon
								const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to))
								return (
									<li key={item.to}>
										<Link
											to={item.to}
											className={cn(
												"flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-muted transition-colors",
												"hover:bg-surface-muted hover:text-foreground",
												active && "bg-surface-muted font-medium text-foreground",
											)}
										>
											<Icon className="size-4 shrink-0" />
											{item.label}
										</Link>
									</li>
								)
							})}
						</ul>
					</div>
				))}
			</nav>
		</aside>
	)
}
