import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { AuthShell } from "#/features/auth/AuthShell"
import { LoginForm } from "#/features/auth/LoginForm"
import { RegisterForm } from "#/features/auth/RegisterForm"
import { LandingCTA, LandingFeatures, LandingHero, LandingSkills } from "#/features/landing/sections"
import { useAuth } from "#/lib/auth-store"

type AuthParam = "login" | "register" | undefined

export const Route = createFileRoute("/")({
	validateSearch: (search: Record<string, unknown>): { auth?: AuthParam } => ({
		auth: ["login", "register"].includes(search.auth as string) ? (search.auth as AuthParam) : undefined,
	}),
	component: LandingPage,
})

function LandingPage() {
	const isAuthenticated = useAuth((s) => s.isAuthenticated)
	const navigate = useNavigate()
	const { auth } = Route.useSearch()

	if (isAuthenticated) {
		navigate({ to: "/dashboard" })
		return null
	}

	function closeAuth() {
		navigate({ to: "/", search: {} })
	}

	return (
		<div className="min-h-screen bg-surface">
			<nav className="flex items-center px-8 py-5 max-w-6xl mx-auto">
				<span className="font-display text-3xl text-primary">VSTEP</span>
			</nav>

			<LandingHero />
			<LandingSkills />
			<LandingFeatures />
			<LandingCTA />

			<footer className="border-t border-border py-8 text-center text-sm text-subtle">
				© 2025 VSTEP · Luyện thi chứng chỉ tiếng Anh quốc gia
			</footer>

			{auth && (
				<AuthShell onClose={closeAuth}>
					{auth === "login" && <LoginForm />}
					{auth === "register" && <RegisterForm />}
				</AuthShell>
			)}
		</div>
	)
}
