import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router"
import {
	BookOpen,
	FileText,
	LayoutDashboard,
	LogOut,
	type LucideIcon,
	Menu,
	UserRound,
} from "lucide-react"
import { useState } from "react"
import { FloatingChatDock } from "#/components/ai-chat/FloatingChatDock"
import { CoinButton } from "#/components/common/CoinButton"
import { Logo } from "#/components/common/Logo"
import { NotificationButton } from "#/components/common/NotificationButton"
import { StreakButton } from "#/components/common/StreakButton"
import { Avatar, AvatarFallback } from "#/components/ui/avatar"
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
	useSidebar,
} from "#/components/ui/sidebar"
import { useRaiseChatDock } from "#/lib/ai-chat/use-raise-chat-dock"
import { MOCK_USER } from "#/lib/mock/user"
import { cn } from "#/lib/utils"

export const Route = createFileRoute("/_app")({
	component: AppLayout,
})

type OverviewLink = { to: "/overview"; search: { tab: "overview" | "learning_path" } }
type PlainLink = { to: "/luyen-tap" | "/thi-thu" }

interface NavItem {
	label: string
	icon: LucideIcon
	link: OverviewLink | PlainLink
}

const NAV_ITEMS: readonly NavItem[] = [
	{
		label: "Tổng quan",
		icon: LayoutDashboard,
		link: { to: "/overview", search: { tab: "overview" } },
	},
	{ label: "Luyện tập", icon: BookOpen, link: { to: "/luyen-tap" } },
	{ label: "Thi thử", icon: FileText, link: { to: "/thi-thu" } },
]

// ─── Sidebar nội dung ──────────────────────────────────────────────

function AppSidebar() {
	const { state, setOpen } = useSidebar()
	const [pinned, setPinned] = useState(false)
	const collapsed = state === "collapsed"

	return (
		<Sidebar
			collapsible="icon"
			onMouseEnter={() => !pinned && setOpen(true)}
			onMouseLeave={() => !pinned && setOpen(false)}
		>
			<SidebarHeader className="px-4 py-5">
				<div className="group/header flex items-center gap-2">
					<Link
						to="/overview"
						search={{ tab: "overview" }}
						className="flex min-w-0 flex-1 items-center"
					>
						<Logo size="sm" variant={collapsed ? "mark" : "full"} />
					</Link>
					{!collapsed && (
						<button
							type="button"
							onClick={() => {
								const next = !pinned
								setPinned(next)
								setOpen(next)
							}}
							aria-label={pinned ? "Bỏ ghim sidebar" : "Ghim sidebar"}
							aria-pressed={pinned}
							className={cn(
								"inline-flex size-8 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted",
								pinned && "bg-muted",
							)}
						>
							<Menu className="size-4" />
						</button>
					)}
				</div>
			</SidebarHeader>

			<SidebarContent className="px-2">
				<SidebarGroup className="px-0">
					<SidebarGroupContent>
						<SidebarMenu className="gap-0.5">
							{NAV_ITEMS.map((item) => (
								<NavLinkItem key={item.label} item={item} collapsed={collapsed} />
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<UserFooter collapsed={collapsed} />
		</Sidebar>
	)
}

function NavLinkItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
	const Icon = item.icon
	// Tailwind v4: class strings phải literal để scanner nhận ra.
	// Active indicator = ::before bar bên trái + bg-primary/5.
	const baseClass =
		"group/nav relative flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors"
	const activeClass =
		"bg-primary/5 font-semibold text-foreground before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-r before:bg-primary"
	const inactiveClass = "font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				asChild
				tooltip={collapsed ? item.label : undefined}
				className="h-9 p-0 hover:bg-transparent data-[active=true]:bg-transparent"
			>
				{item.link.to === "/overview" ? (
					<Link
						to="/overview"
						search={item.link.search}
						className={baseClass}
						activeProps={{ className: activeClass }}
						inactiveProps={{ className: inactiveClass }}
					>
						<NavRowContent icon={Icon} label={item.label} />
					</Link>
				) : (
					<Link
						to={item.link.to}
						className={baseClass}
						activeProps={{ className: activeClass }}
						inactiveProps={{ className: inactiveClass }}
					>
						<NavRowContent icon={Icon} label={item.label} />
					</Link>
				)}
			</SidebarMenuButton>
		</SidebarMenuItem>
	)
}

function NavRowContent({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
	return (
		<>
			<Icon className="size-4 shrink-0" />
			<span className="flex-1 truncate">{label}</span>
		</>
	)
}

function UserFooter({ collapsed }: { collapsed: boolean }) {
	const navigate = useNavigate()
	const handleLogout = () => navigate({ to: "/" })

	return (
		<SidebarFooter className="gap-1 p-2">
			<div
				className={cn("flex items-center gap-2.5 rounded-lg p-2", collapsed && "justify-center")}
			>
				<Avatar className="size-8 shrink-0">
					<AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
						{MOCK_USER.initials}
					</AvatarFallback>
				</Avatar>
				{!collapsed && (
					<div className="min-w-0 flex-1">
						<p className="truncate text-xs font-semibold text-foreground">{MOCK_USER.fullName}</p>
						<p className="truncate text-[11px] text-muted-foreground">Học viên</p>
					</div>
				)}
			</div>
			<button
				type="button"
				onClick={handleLogout}
				aria-label="Đăng xuất"
				className={cn(
					"flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
					collapsed && "justify-center",
				)}
			>
				<LogOut className="size-4 shrink-0" />
				{!collapsed && <span>Đăng xuất</span>}
			</button>
		</SidebarFooter>
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
			<div className="flex-1" />

			{/* Right: coin + streak + bell + avatar */}
			<CoinButton />
			<StreakButton />
			<NotificationButton />

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
		<SidebarProvider defaultOpen={false}>
			<LayoutShell />
		</SidebarProvider>
	)
}

function LayoutShell() {
	const { state } = useSidebar()
	const dockLeft = state === "collapsed" ? "3rem" : "16rem"
	useRaiseChatDock()

	return (
		<div className="flex min-h-screen w-full">
			<AppSidebar />
			<div
				style={{ "--dock-left": dockLeft } as React.CSSProperties}
				className="flex flex-1 flex-col overflow-hidden"
			>
				<AppTopbar />
				<main className="flex-1 overflow-y-auto p-6">
					<Outlet />
				</main>
			</div>
			<FloatingChatDock />
		</div>
	)
}
