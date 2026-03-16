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
import type { IconSvgElement } from "@hugeicons/react"
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
import { clear, refreshToken, token, user } from "@/lib/auth"

interface NavItem {
	label: string
	icon: IconSvgElement
	href: string
}

const adminNavItems: NavItem[] = [
	{ label: "Tổng quan", icon: DashboardSquare01Icon, href: "/admin" },
	{ label: "Người dùng", icon: UserGroup02Icon, href: "/admin/users" },
	{ label: "Đề thi", icon: DocumentValidationIcon, href: "/admin/exams" },
	{ label: "Câu hỏi", icon: Book01Icon, href: "/admin/questions" },
	{ label: "Điểm kiến thức", icon: BubbleChatIcon, href: "/admin/knowledge-points" },
	{ label: "Bài nộp", icon: PencilEdit01Icon, href: "/admin/submissions" },
]

const instructorNavItems: NavItem[] = [
	{ label: "Lớp học", icon: UserGroup02Icon, href: "/dashboard" },
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
	const currentUser = user()
	const isAdmin = currentUser?.role === "admin"
	const navItems = isAdmin ? [...adminNavItems, ...instructorNavItems] : instructorNavItems

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
					{isAdmin && (
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link to="/admin">
									<HugeiconsIcon icon={Settings01Icon} className="size-4" />
									<span>Cài đặt</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					)}
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
