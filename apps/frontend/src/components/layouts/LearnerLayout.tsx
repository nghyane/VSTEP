import {
	AnalyticsUpIcon,
	Book02Icon,
	CheckmarkCircle01Icon,
	DocumentValidationIcon,
	Fire02Icon,
	Logout01Icon,
	Menu01Icon,
	UserCircleIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, Outlet } from "@tanstack/react-router"
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
import { useActivity } from "@/hooks/use-progress"
import { useUser } from "@/hooks/use-user"
import { logout } from "@/lib/api"
import { clear, refreshToken, token, user } from "@/lib/auth"
import { avatarUrl, getInitials } from "@/lib/avatar"
import { cn } from "@/lib/utils"

const DAYS_OF_WEEK = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

export function LearnerLayout() {
	const { data: activity } = useActivity(7)
	const streakCount = activity?.streak ?? 0
	const activeDatesSet = new Set(activity?.activeDays ?? [])

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
					<Link to="/" className="mr-8">
						<Logo />
					</Link>
					<nav className="hidden items-center gap-1 md:flex">
						{[
							{ label: "Luyện tập", icon: Book02Icon, href: "/practice" as const },
							{ label: "Thi thử", icon: DocumentValidationIcon, href: "/exams" as const },
							{ label: "Tiến độ", icon: AnalyticsUpIcon, href: "/progress" as const },
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
