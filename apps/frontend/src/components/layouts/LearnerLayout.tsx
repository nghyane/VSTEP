import {
	AnalyticsUpIcon,
	Book02Icon,
	CheckmarkCircle01Icon,
	DocumentValidationIcon,
	Fire02Icon,
	LanguageSkillIcon,
	Logout01Icon,
	Menu01Icon,
	Notification03Icon,
	UserCircleIcon,
	UserGroup02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, Outlet, useNavigate } from "@tanstack/react-router"
import { Logo } from "@/components/common/Logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
	useMarkAllRead,
	useMarkRead,
	useNotifications,
	useUnreadCount,
} from "@/hooks/use-notifications"
import { useActivity } from "@/hooks/use-progress"
import { useUser } from "@/hooks/use-user"
import { logout } from "@/lib/api"
import { clear, refreshToken, token, user } from "@/lib/auth"
import { avatarUrl, getInitials } from "@/lib/avatar"
import { cn } from "@/lib/utils"

const DAYS_OF_WEEK = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

export function LearnerLayout() {
	const navigate = useNavigate()
	const { data: activity } = useActivity(7)
	const streakCount = activity?.streak ?? 0
	const activeDatesSet = new Set(activity?.activeDays ?? [])

	const { data: unreadData } = useUnreadCount()
	const unreadCount = unreadData?.count ?? 0
	const { data: notificationsData } = useNotifications({ unreadOnly: false })
	const notifications = notificationsData?.data ?? []
	const markRead = useMarkRead()
	const markAllRead = useMarkAllRead()

	function isActiveDay(dayIndex: number): boolean {
		const today = new Date()
		const todayDow = (today.getDay() + 6) % 7
		const diff = dayIndex - todayDow
		const date = new Date(today)
		date.setDate(today.getDate() + diff)
		const yyyy = date.getFullYear()
		const mm = String(date.getMonth() + 1).padStart(2, "0")
		const dd = String(date.getDate()).padStart(2, "0")
		return activeDatesSet.has(`${yyyy}-${mm}-${dd}`)
	}

	const activeDays = DAYS_OF_WEEK.map((_, i) => isActiveDay(i))
	const currentUser = user()
	const { data: userData } = useUser(currentUser?.id ?? "")
	const initials = getInitials(currentUser?.fullName, currentUser?.email)
	const avatarSrc = avatarUrl(userData?.avatarKey, currentUser?.fullName)

	function handleNotificationClick(notification: (typeof notifications)[number]) {
		if (!notification.readAt) {
			markRead.mutate(notification.id)
		}

		if (notification.url) {
			window.location.href = notification.url
			return
		}

		if (notification.data?.submissionId) {
			if (notification.data.skill === "writing") {
				navigate({ to: "/writing-result/$id", params: { id: notification.data.submissionId } })
				return
			}

			navigate({ to: "/submissions/$id", params: { id: notification.data.submissionId } })
			return
		}
	}

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

	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-40 border-b bg-background">
				<div className="mx-auto flex h-14 max-w-6xl items-center px-6">
					<Link to="/practice" className="mr-8">
						<Logo />
					</Link>
					<nav className="hidden items-center gap-1 md:flex">
						{[
							{ label: "Luyện tập", icon: Book02Icon, href: "/practice" as const },
							{ label: "Từ vựng", icon: LanguageSkillIcon, href: "/vocabulary" as const },
							{ label: "Thi thử", icon: DocumentValidationIcon, href: "/exams" as const },
							{ label: "Tiến độ", icon: AnalyticsUpIcon, href: "/progress" as const },
							{ label: "Lớp học", icon: UserGroup02Icon, href: "/dashboard" as const },
						].map((item) => (
							<Link
								key={item.label}
								to={item.href}
								className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
								activeProps={{
									className:
										"flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors",
								}}
							>
								<HugeiconsIcon icon={item.icon} className="size-[18px]" strokeWidth={1.75} />
								{item.label}
							</Link>
						))}
					</nav>
					<div className="ml-auto flex items-center gap-2">
						{/* Streak popover */}
						<Popover>
							<PopoverTrigger asChild>
								<button
									type="button"
									className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold tabular-nums text-warning transition-colors hover:bg-warning/10"
								>
									<HugeiconsIcon icon={Fire02Icon} className="size-5" />
									{streakCount}
								</button>
							</PopoverTrigger>
							<PopoverContent align="end" className="w-80 overflow-hidden rounded-2xl p-0">
								<div className="relative bg-warning/10 px-6 pt-6 pb-5">
									{/* Watermark fire */}
									<HugeiconsIcon
										icon={Fire02Icon}
										className="absolute top-3 right-4 size-16 text-warning/15"
									/>
									<p className="text-3xl font-bold text-warning">{streakCount} ngày streak</p>
									<p className="mt-1 text-sm text-muted-foreground">Tiếp tục học mỗi ngày nhé!</p>
								</div>
								<div className="px-6 py-4">
									<div className="flex justify-between">
										{DAYS_OF_WEEK.map((day, i) => (
											<div key={day} className="flex flex-col items-center gap-1.5">
												<span className="text-xs text-muted-foreground">{day}</span>
												<div
													className={cn(
														"flex size-8 items-center justify-center rounded-full",
														activeDays[i] ? "bg-warning/15 text-warning" : "bg-muted",
													)}
												>
													{activeDays[i] ? (
														<HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
													) : null}
												</div>
											</div>
										))}
									</div>
								</div>
							</PopoverContent>
						</Popover>

						{/* Notifications */}
						<Popover>
							<PopoverTrigger asChild>
								<button
									type="button"
									className="relative flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
								>
									<HugeiconsIcon icon={Notification03Icon} className="size-5" strokeWidth={1.75} />
									{unreadCount > 0 && (
										<span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
											{unreadCount > 9 ? "9+" : unreadCount}
										</span>
									)}
								</button>
							</PopoverTrigger>
							<PopoverContent align="end" className="w-80 overflow-hidden rounded-2xl p-0">
								<div className="flex items-center justify-between border-b px-4 py-3">
									<p className="text-sm font-semibold">Thông báo</p>
									{unreadCount > 0 && (
										<button
											type="button"
											className="text-xs text-primary hover:underline"
											onClick={() => markAllRead.mutate()}
										>
											Đánh dấu tất cả đã đọc
										</button>
									)}
								</div>
								<div className="max-h-80 overflow-y-auto">
									{notifications.length === 0 ? (
										<p className="py-8 text-center text-sm text-muted-foreground">
											Không có thông báo
										</p>
									) : (
										notifications.slice(0, 10).map((n) => (
											<button
												key={n.id}
												type="button"
												className={cn(
													"flex w-full flex-col gap-0.5 border-b px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/50",
													!n.readAt && "bg-primary/5",
												)}
												onClick={() => {
													handleNotificationClick(n)
												}}
											>
												<p className={cn("text-sm", !n.readAt && "font-medium")}>{n.title}</p>
												{n.body && (
													<p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
												)}
												<p className="text-[10px] text-muted-foreground">
													{new Date(n.createdAt).toLocaleDateString("vi-VN", {
														day: "2-digit",
														month: "2-digit",
														hour: "2-digit",
														minute: "2-digit",
													})}
												</p>
											</button>
										))
									)}
								</div>
							</PopoverContent>
						</Popover>

						{/* User menu */}
						<DropdownMenu>
							<DropdownMenuTrigger className="outline-none">
								<Avatar className="size-8 cursor-pointer">
									<AvatarImage src={avatarSrc} alt={currentUser?.fullName ?? "Avatar"} />
									<AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
										{initials}
									</AvatarFallback>
								</Avatar>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem asChild>
									<Link to="/profile">
										<HugeiconsIcon icon={UserCircleIcon} className="size-4" strokeWidth={1.75} />
										Hồ sơ
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link to="/submissions">
										<HugeiconsIcon
											icon={CheckmarkCircle01Icon}
											className="size-4"
											strokeWidth={1.75}
										/>
										Lịch sử bài nộp
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleLogout}>
									<HugeiconsIcon icon={Logout01Icon} className="size-4" strokeWidth={1.75} />
									Đăng xuất
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<Button variant="ghost" size="icon" className="md:hidden">
							<HugeiconsIcon icon={Menu01Icon} className="size-5" strokeWidth={1.75} />
						</Button>
					</div>
				</div>
			</header>
			<main className="mx-auto max-w-6xl px-6 py-8">
				<Outlet />
			</main>
		</div>
	)
}
