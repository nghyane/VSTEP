import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { useAuth } from "#/lib/auth"

export const Route = createFileRoute("/_app/ho-so")({
	component: ProfilePage,
})

function ProfilePage() {
	const profile = useAuth((s) => s.profile)
	const user = useAuth((s) => s.user)
	const initial = profile?.nickname?.charAt(0).toUpperCase() ?? "?"

	return (
		<>
			<Header title="Hồ sơ" />
			<div className="px-10 pb-12 max-w-3xl">
				<div className="card p-8">
					<div className="flex items-center gap-5 mb-6">
						<div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display text-3xl shrink-0">
							{initial}
						</div>
						<div>
							<h2 className="font-extrabold text-2xl text-foreground">
								{profile?.nickname ?? "User"}
							</h2>
							<p className="text-sm text-subtle">{user?.email}</p>
						</div>
					</div>
					<div className="space-y-4">
						<div className="flex items-center justify-between py-3 border-t border-border">
							<span className="text-sm font-bold text-muted">Mục tiêu</span>
							<span className="text-sm font-bold text-primary">
								{profile?.target_level ?? "Chưa thiết lập"}
							</span>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
