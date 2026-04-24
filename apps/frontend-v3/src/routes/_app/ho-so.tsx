import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { CreateProfileForm } from "#/features/profile/components/CreateProfileForm"
import { EditProfileForm } from "#/features/profile/components/EditProfileForm"
import { ProfileCard } from "#/features/profile/components/ProfileCard"
import { useProfilePage } from "#/features/profile/use-profile-page"

export const Route = createFileRoute("/_app/ho-so")({
	validateSearch: (s: Record<string, unknown>): { edit?: boolean } => {
		return s.edit ? { edit: true } : {}
	},
	component: ProfilePage,
})

function ProfilePage() {
	const { edit } = Route.useSearch()
	const p = useProfilePage(edit)

	if (p.isLoading || !p.profiles) return <Header title="Hồ sơ" />

	return (
		<>
			<Header title="Hồ sơ" />
			<div className="px-10 pb-12 space-y-8">
				<section>
					<h3 className="font-extrabold text-xl text-foreground mb-1">Mục tiêu của bạn</h3>
					<p className="text-sm text-subtle mb-5">Mỗi mục tiêu là một lộ trình luyện tập riêng</p>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{p.profiles.map((prof) => (
							<ProfileCard
								key={prof.id}
								profile={prof}
								isActive={prof.id === p.activeProfile.id}
								onSwitch={() => p.doSwitch.mutate(prof.id)}
								onEdit={() => p.setEditing(prof)}
							/>
						))}
						{!p.showCreate && (
							<button
								type="button"
								onClick={() => p.setShowCreate(true)}
								className="card-interactive p-5 flex flex-col items-center justify-center text-center min-h-[140px]"
							>
								<span className="text-3xl text-subtle mb-2">+</span>
								<span className="font-bold text-sm text-muted">Tạo mục tiêu mới</span>
							</button>
						)}
					</div>
				</section>
				{p.showCreate && (
					<CreateProfileForm onSubmit={p.handleCreate} onCancel={() => p.setShowCreate(false)} />
				)}
				{p.editing && (
					<EditProfileForm profile={p.editing} onSubmit={p.handleUpdate} onCancel={p.closeEdit} />
				)}
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
