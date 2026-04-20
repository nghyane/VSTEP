import type { Profile } from "#/types/auth"
import { cn } from "#/lib/utils"

interface Props {
	profile: Profile
	isActive: boolean
	onSwitch: () => void
}

export function ProfileCard({ profile, isActive, onSwitch }: Props) {
	const initial = profile.nickname.charAt(0).toUpperCase()

	return (
		<button
			type="button"
			onClick={onSwitch}
			disabled={isActive}
			className={cn(
				"card-interactive p-5 text-left",
				isActive && "border-primary bg-primary-tint",
			)}
		>
			<div className="flex items-center gap-3 mb-3">
				<div className={cn(
					"w-10 h-10 rounded-full flex items-center justify-center font-display text-base shrink-0",
					isActive ? "bg-primary text-primary-foreground" : "bg-muted text-primary-foreground",
				)}>
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
	)
}
