import {
	Book01Icon,
	DashboardSquare01Icon,
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

const navItems = [
	{ label: "Dashboard", icon: DashboardSquare01Icon, href: "/" },
	{ label: "Đề thi", icon: Book01Icon, href: "/" },
	{ label: "Chấm bài", icon: PencilEdit01Icon, href: "/" },
	{ label: "Lớp học", icon: UserGroup02Icon, href: "/" },
]

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
							<Link to="/">
								<HugeiconsIcon icon={Settings01Icon} className="size-4" />
								<span>Cài đặt</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton>
							<HugeiconsIcon icon={Logout01Icon} className="size-4" />
							<span>Đăng xuất</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	)
}
