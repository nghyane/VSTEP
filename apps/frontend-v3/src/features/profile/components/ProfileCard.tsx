import type { ProfileCardProps } from "#/features/profile/types"
import { cn } from "#/lib/utils"

export function ProfileCard({ profile, isActive, onSwitch, onEdit }: ProfileCardProps) {
	const initial = profile.nickname.charAt(0).toUpperCase()

	return (
		<div className={cn("card p-5 text-left", isActive && "border-primary bg-primary-tint")}>
			<button type="button" onClick={onSwitch} disabled={isActive} className="w-full text-left">
				<div className="flex items-center gap-3 mb-3">
					<div
						className={cn(
							"w-10 h-10 rounded-full flex items-center justify-center font-display text-base shrink-0",
							isActive ? "bg-primary text-primary-foreground" : "bg-muted text-primary-foreground",
						)}
					>
						{initial}
					</div>
					{isActive && (
						<span className="text-xs font-bold text-primary bg-primary-tint px-2 py-0.5 rounded-full">
							Đang dùng
						</span>
					)}
				</div>
				<p className="font-bold text-base text-foreground">{profile.nickname}</p>
				<p className="text-sm text-muted mt-1">Mục tiêu {profile.target_level}</p>
				<p className="text-xs text-subtle mt-0.5">Thi ngày {profile.target_deadline}</p>
			</button>
			<button type="button" onClick={onEdit} className="mt-3 text-xs font-bold text-primary hover:underline">
				Chỉnh sửa
			</button>
		</div>
	)
}
