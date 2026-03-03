import {
	Book01Icon,
	BubbleChatIcon,
	DashboardSquare01Icon,
	DocumentValidationIcon,
	Logout01Icon,
	PencilEdit01Icon,
	Settings01Icon,
	UserGroup02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { Logo } from "@/components/common/Logo"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"
import { logout } from "@/lib/api"
import { clear, refreshToken, token } from "@/lib/auth"

const navItems = [
	{ label: "Tổng quan", icon: DashboardSquare01Icon, href: "/admin" as const },
	{ label: "Người dùng", icon: UserGroup02Icon, href: "/admin/users" as const },
	{ label: "Đề thi", icon: DocumentValidationIcon, href: "/admin/exams" as const },
	{ label: "Câu hỏi", icon: Book01Icon, href: "/admin/questions" as const },
	{ label: "Điểm kiến thức", icon: BubbleChatIcon, href: "/admin/knowledge-points" as const },
	{ label: "Bài nộp", icon: PencilEdit01Icon, href: "/admin/submissions" as const },
]

async function handleLogout() {
	try {
		const t = token()
		const r = refreshToken()
		if (t && r) await logout(r, t)
	} finally {
		clear()
		window.location.href = "/login"
	}
}

export function AppSidebar() {
	return (
		<Sidebar>
			<SidebarHeader>
				<div className="flex h-12 items-center px-2">
					<Logo />
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Quản lý</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => (
								<SidebarMenuItem key={item.label}>
									<SidebarMenuButton asChild>
										<Link to={item.href}>
											<HugeiconsIcon icon={item.icon} className="size-4" />
											<span>{item.label}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<Link to="/admin">
								<HugeiconsIcon icon={Settings01Icon} className="size-4" />
								<span>Cài đặt</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton onClick={handleLogout}>
							<HugeiconsIcon icon={Logout01Icon} className="size-4" />
							<span>Đăng xuất</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	)
}
