import { Bell, LogOut, Search, User } from "lucide-react"
import { useAuth } from "#/lib/auth"

export function Topbar() {
	const user = useAuth((s) => s.user)
	const clear = useAuth((s) => s.clear)

	function logout() {
		clear()
		window.location.href = "/login"
	}

	return (
		<header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur-md">
			<div className="flex items-center gap-4">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
					<input
						type="text"
						placeholder="Tìm kiếm…"
						className="h-8 w-64 rounded-md border border-border bg-surface-muted pl-9 pr-3 text-sm text-foreground placeholder:text-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20"
					/>
				</div>
			</div>
			<div className="flex items-center gap-3">
				<button
					type="button"
					className="relative flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-foreground"
				>
					<Bell className="size-4" />
					<span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger" />
				</button>
				<div className="flex items-center gap-2">
					<div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
						<User className="size-3.5" />
					</div>
					<div className="hidden text-sm leading-tight sm:block">
						<div className="font-medium text-foreground">{user?.name ?? "—"}</div>
						<div className="text-xs text-subtle">{roleLabel(user?.role)}</div>
					</div>
				</div>
				<button
					type="button"
					onClick={logout}
					className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted hover:bg-surface-muted hover:text-foreground"
				>
					<LogOut className="size-3.5" />
					<span className="hidden sm:inline">Đăng xuất</span>
				</button>
			</div>
		</header>
	)
}

function roleLabel(role: string | undefined) {
	switch (role) {
		case "admin":
			return "Quản trị viên"
		case "staff":
			return "Nhân viên"
		case "teacher":
			return "Giáo viên"
		default:
			return ""
	}
}
