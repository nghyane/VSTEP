import { Link, useMatchRoute } from "@tanstack/react-router"
import faceIcon from "#/assets/icons/face-small.svg"
import houseIcon from "#/assets/icons/house-small.svg"
import challengeIcon from "#/assets/icons/monthly-challenge-medium.svg"
import moreIcon from "#/assets/icons/more-small.svg"
import targetIcon from "#/assets/icons/target-small.svg"
import weightsIcon from "#/assets/icons/weights-small.svg"
import { useAuth } from "#/features/auth/AuthProvider"
import { cn } from "#/lib/utils"

const NAV_ITEMS = [
	{ label: "Tổng quan", icon: houseIcon, to: "/dashboard" as const },
	{ label: "Luyện tập", icon: weightsIcon, to: "/luyen-tap" as const },
	{ label: "Thi thử", icon: targetIcon, to: "/thi-thu" as const },
	{ label: "Khóa học", icon: challengeIcon, to: "/khoa-hoc" as const },
	{ label: "Hồ sơ", icon: faceIcon, to: "/ho-so" as const },
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
							<img src={item.icon} className="w-7 h-7" alt="" />
							<span className="text-base">{item.label}</span>
						</Link>
					)
				})}

				<div className="h-px bg-border my-3 mx-4" />

				<button
					type="button"
					className="flex items-center gap-4 px-4 py-3 rounded-xl text-muted font-bold hover:bg-background w-full"
				>
					<img src={moreIcon} className="w-7 h-7" alt="" />
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
