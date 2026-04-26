import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { CreateProfileForm } from "#/features/profile/components/CreateProfileForm"
import { EditProfileForm } from "#/features/profile/components/EditProfileForm"
import { useProfilePage } from "#/features/profile/use-profile-page"
import { cn } from "#/lib/utils"
import type { Profile } from "#/types/auth"

export const Route = createFileRoute("/_app/ho-so")({
	validateSearch: (s: Record<string, unknown>): { edit?: boolean } => {
		return s.edit ? { edit: true } : {}
	},
	component: ProfilePage,
})

function daysUntil(deadline: string): number {
	const diff = new Date(deadline).getTime() - Date.now()
	return Math.max(0, Math.ceil(diff / 86400000))
}

function ProfilePage() {
	const { edit } = Route.useSearch()
	const p = useProfilePage(edit)

	if (p.isLoading || !p.profiles) return <Header title="Hồ sơ" />

	return (
		<>
			<Header title="Hồ sơ" />
			<div className="px-10 pb-12 space-y-10">
				{/* Profile selector — Netflix style */}
				<section className="text-center">
					<h3 className="font-extrabold text-2xl text-foreground mb-1">Mục tiêu của bạn</h3>
					<p className="text-sm text-subtle mb-8">Mỗi mục tiêu là một lộ trình luyện tập riêng</p>

					<div className="flex flex-wrap items-start justify-center gap-6">
						{p.profiles.map((prof) => (
							<ProfileAvatar
								key={prof.id}
								profile={prof}
								isActive={prof.id === p.activeProfile.id}
								onSwitch={() => p.doSwitch.mutate(prof.id)}
								onEdit={() => p.setEditing(prof)}
							/>
						))}

						{/* Add new */}
						{!p.showCreate && (
							<button
								type="button"
								onClick={() => p.setShowCreate(true)}
								className="group flex flex-col items-center gap-3 w-[140px]"
							>
								<div className="size-24 rounded-2xl border-2 border-dashed border-border flex items-center justify-center transition-all group-hover:border-primary group-hover:bg-primary-tint group-hover:scale-105">
									<span className="text-3xl text-subtle group-hover:text-primary transition-colors">+</span>
								</div>
								<span className="text-sm font-bold text-muted group-hover:text-foreground transition-colors">
									Mục tiêu mới
								</span>
							</button>
						)}
					</div>
				</section>

				{/* Forms */}
				{p.showCreate && (
					<CreateProfileForm onSubmit={p.handleCreate} onCancel={() => p.setShowCreate(false)} />
				)}
				{p.editing && (
					<EditProfileForm profile={p.editing} onSubmit={p.handleUpdate} onCancel={p.closeEdit} />
				)}

				{/* Account */}
				<section className="card p-6">
					<h3 className="font-bold text-base text-foreground mb-4">Tài khoản</h3>
					<div className="flex items-center justify-between py-3 border-t border-border">
						<span className="text-sm text-muted">Email</span>
						<span className="text-sm font-bold text-foreground">{p.user.email}</span>
					</div>
				</section>
			</div>
		</>
	)
}

function ProfileAvatar({
	profile,
	isActive,
	onSwitch,
	onEdit,
}: {
	profile: Profile
	isActive: boolean
	onSwitch: () => void
	onEdit: () => void
}) {
	const initial = profile.nickname.charAt(0).toUpperCase()
	const level = profile.target_level
	const days = daysUntil(profile.target_deadline)

	return (
		<div className="flex flex-col items-center gap-3 w-[140px]">
			<button
				type="button"
				onClick={onSwitch}
				disabled={isActive}
				className={cn(
					"relative size-24 rounded-2xl bg-primary flex items-center justify-center transition-all duration-200 border-2 border-b-4 border-primary-dark",
					isActive
						? "ring-4 ring-primary-dark ring-offset-2 ring-offset-surface scale-105"
						: "hover:scale-110 hover:shadow-lg active:scale-100 active:translate-y-[2px] active:border-b-2",
				)}
			>
				<span className="text-white font-display text-3xl">{initial}</span>

				{/* Level badge */}
				<span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-extrabold text-primary-dark bg-surface border-2 border-primary-dark px-2 py-0.5 rounded-full shadow-sm">
					{level}
				</span>
			</button>

			<div className="text-center">
				<p
					className={cn(
						"text-sm font-extrabold truncate max-w-[140px]",
						isActive ? "text-foreground" : "text-muted",
					)}
				>
					{profile.nickname}
				</p>
				<p className="text-[11px] text-subtle mt-0.5">{days > 0 ? `Còn ${days} ngày` : "Đã qua deadline"}</p>
			</div>

			{isActive && (
				<button type="button" onClick={onEdit} className="text-[11px] font-bold text-primary hover:underline">
					Chỉnh sửa
				</button>
			)}
		</div>
	)
}
