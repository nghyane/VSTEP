import { Link, useMatchRoute } from "@tanstack/react-router"
import { Icon, type IconName } from "#/components/Icon"
import { useAuth } from "#/lib/auth-store"
import { cn } from "#/lib/utils"

const NAV_ITEMS: { label: string; icon: IconName; to: string }[] = [
	{ label: "Tổng quan", icon: "house", to: "/dashboard" },
	{ label: "Luyện tập", icon: "weights", to: "/luyen-tap" },
	{ label: "Thi thử", icon: "target", to: "/thi-thu" },
	{ label: "Khóa học", icon: "book", to: "/khoa-hoc" },
	{ label: "Hồ sơ", icon: "face", to: "/ho-so" },
]

export function Sidebar() {
	const matchRoute = useMatchRoute()
	const { profile, user } = useAuth()
	const initial = profile?.nickname?.charAt(0).toUpperCase() ?? "?"
	const displayName = profile?.nickname ?? user?.email ?? "User"

	return (
		<aside className="w-[260px] shrink-0 bg-surface border-r border-border flex flex-col sticky top-0 h-screen">
			<div className="px-7 py-7">
				<Link to="/dashboard" className="font-display text-3xl text-primary">
					VSTEP
				</Link>
			</div>

			<nav className="flex-1 px-4 py-2 space-y-1">
				{NAV_ITEMS.map((item) => {
					const active = matchRoute({ to: item.to, fuzzy: true })
					return (
						<Link
							key={item.to}
							to={item.to}
							className={cn(
								"flex items-center gap-4 px-4 py-3 rounded-xl font-bold",
								active ? "bg-primary-tint text-primary" : "text-muted hover:bg-background",
							)}
						>
							<Icon name={item.icon} size="sm" />
							<span className="text-base">{item.label}</span>
						</Link>
					)
				})}

				<div className="h-px bg-border my-3 mx-4" />

				<button
					type="button"
					className="flex items-center gap-4 px-4 py-3 rounded-xl text-muted font-bold w-full opacity-50 cursor-not-allowed"
					disabled
					title="Sắp ra mắt"
				>
					<Icon name="more" size="sm" />
					<span className="text-base">Xem thêm</span>
				</button>
			</nav>

			<div className="p-4">
				<div className="flex items-center gap-3 p-3 rounded-xl bg-background">
					<div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display text-base">
						{initial}
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-bold text-foreground truncate">{displayName}</p>
						<p className="text-xs text-subtle truncate">Học viên</p>
					</div>
				</div>
			</div>
		</aside>
	)
}
