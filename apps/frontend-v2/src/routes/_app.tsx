import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router"
import {
	Bell,
	BookOpen,
	ChevronLeft,
	FileText,
	LayoutDashboard,
	LogOut,
	UserRound,
} from "lucide-react"
import { Logo } from "#/components/common/Logo"
import { StreakButton } from "#/components/common/StreakButton"
import { Avatar, AvatarFallback } from "#/components/ui/avatar"
import { Button } from "#/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
	useSidebar,
} from "#/components/ui/sidebar"
import { MOCK_USER } from "#/lib/mock/user"

export const Route = createFileRoute("/_app")({
	component: AppLayout,
})

const NAV_ITEMS = [
	{ label: "Overview", to: "/overview", icon: LayoutDashboard },
	{ label: "Luyện tập", to: "/luyen-tap", icon: BookOpen },
	{ label: "Thi thử", to: "/thi-thu", icon: FileText },
] as const

// ─── Sidebar nội dung ───────────────────────────────────────────────
function AppSidebar() {
	const { state } = useSidebar()
	const collapsed = state === "collapsed"

	return (
		<Sidebar collapsible="icon">
			{/* Logo */}
			<SidebarHeader className="h-14 justify-center border-b px-4">
				<Link to="/overview" search={{ tab: "overview" }} className="flex items-center">
					<Logo size="sm" variant={collapsed ? "mark" : "full"} />
				</Link>
			</SidebarHeader>

			{/* Nav */}
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{NAV_ITEMS.map(({ label, to, icon: Icon }) => (
								<SidebarMenuItem key={to}>
									<SidebarMenuButton asChild tooltip={collapsed ? label : undefined}>
										<Link
											to={to}
											activeProps={{
												className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
											}}
											inactiveProps={{
												className:
													"text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50",
											}}
											className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors"
										>
											<Icon className="size-4 shrink-0" />
											<span>{label}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			{/* Footer */}
			<SidebarFooter className="border-t">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild tooltip={collapsed ? "Trở về trang chủ" : undefined}>
							<Link
								to="/"
								className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
							>
								<ChevronLeft className="size-4 shrink-0" />
								<span>Trở về trang chủ</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	)
}

// ─── Topbar ────────────────────────────────────────────────────────
function AppTopbar() {
	const navigate = useNavigate()

	function handleLogout() {
		navigate({ to: "/" })
	}

	return (
		<header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4">
			{/* Sidebar toggle */}
			<SidebarTrigger className="text-muted-foreground hover:text-foreground" />

			{/* Spacer */}
			<div className="flex-1" />

			{/* Right: streak + bell + avatar */}
			<StreakButton />
			<Button
				variant="ghost"
				size="icon-sm"
				className="text-muted-foreground"
				aria-label="Thông báo"
			>
				<Bell className="size-4" />
			</Button>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Avatar className="size-8 cursor-pointer">
						<AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
							{MOCK_USER.initials}
						</AvatarFallback>
					</Avatar>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					<div className="px-2 py-1.5">
						<p className="text-sm font-medium">{MOCK_USER.fullName}</p>
						<p className="text-xs text-muted-foreground">{MOCK_USER.email}</p>
					</div>
					<DropdownMenuSeparator />
					<DropdownMenuItem asChild>
						<Link to="/overview" search={{ tab: "overview" }} className="flex items-center gap-2">
							<UserRound className="size-4" />
							Hồ sơ
						</Link>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className="text-destructive focus:text-destructive"
						onClick={handleLogout}
					>
						<LogOut className="size-4" />
						Đăng xuất
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</header>
	)
}

// ─── Layout chính ──────────────────────────────────────────────────
function AppLayout() {
	return (
		<SidebarProvider defaultOpen>
			<div className="flex min-h-screen w-full">
				<AppSidebar />
				<div className="flex flex-1 flex-col overflow-hidden">
					<AppTopbar />
					<main className="flex-1 overflow-y-auto p-6">
						<Outlet />
					</main>
				</div>
			</div>
		</SidebarProvider>
	)
}
