import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Header } from "#/components/Header"
import { createProfile, switchProfile } from "#/features/profile/actions"
import { ProfileCard } from "#/features/profile/components/ProfileCard"
import { CreateProfileForm } from "#/features/profile/components/CreateProfileForm"
import { profilesQuery } from "#/features/profile/queries"
import { useSession } from "#/lib/auth"
import { tokens } from "#/lib/tokens"

export const Route = createFileRoute("/_app/ho-so")({
	component: ProfilePage,
})

function ProfilePage() {
	const { profile: activeProfile, user } = useSession()
	const { data } = useQuery(profilesQuery)
	const [showCreate, setShowCreate] = useState(false)
	const qc = useQueryClient()

	const profiles = data?.data ?? []

	const doSwitch = useMutation({
		mutationFn: (profileId: string) => switchProfile(profileId, tokens.getRefresh()!),
		onSuccess: () => qc.invalidateQueries(),
	})

	const doCreate = useMutation({
		mutationFn: createProfile,
		onSuccess: async (profile) => {
			setShowCreate(false)
			await qc.invalidateQueries({ queryKey: ["profiles"] })
			await switchProfile(profile.id, tokens.getRefresh()!)
			qc.invalidateQueries()
		},
	})

	return (
		<>
			<Header title="Hồ sơ" />
			<div className="px-10 pb-12 space-y-8">
				{/* Profile cards */}
				<section>
					<h3 className="font-extrabold text-xl text-foreground mb-1">Mục tiêu của bạn</h3>
					<p className="text-sm text-subtle mb-5">Mỗi mục tiêu là một lộ trình luyện tập riêng</p>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{profiles.map((p) => (
							<ProfileCard
								key={p.id}
								profile={p}
								isActive={p.id === activeProfile?.id}
								onSwitch={() => doSwitch.mutate(p.id)}
							/>
						))}
						{!showCreate && (
							<button
								type="button"
								onClick={() => setShowCreate(true)}
								className="card-interactive p-5 flex flex-col items-center justify-center text-center min-h-[140px]"
							>
								<span className="text-3xl text-subtle mb-2">+</span>
								<span className="font-bold text-sm text-muted">Tạo mục tiêu mới</span>
							</button>
						)}
					</div>
				</section>

				{/* Create form */}
				{showCreate && (
					<CreateProfileForm
						onSubmit={(v) => doCreate.mutateAsync(v)}
						onCancel={() => setShowCreate(false)}
					/>
				)}

				{/* Account info */}
				<section className="card p-6">
					<h3 className="font-bold text-base text-foreground mb-4">Tài khoản</h3>
					<div className="flex items-center justify-between py-3 border-t border-border">
						<span className="text-sm text-muted">Email</span>
						<span className="text-sm font-bold text-foreground">{user?.email}</span>
					</div>
				</section>
			</div>
		</>
	)
}
