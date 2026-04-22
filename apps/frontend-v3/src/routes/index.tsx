import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { AuthShell } from "#/features/auth/AuthShell"
import { LoginForm } from "#/features/auth/LoginForm"
import { RegisterForm } from "#/features/auth/RegisterForm"
import { LandingCTA, LandingFeatures, LandingHero, LandingSkills } from "#/features/landing/sections"
import { useAuth } from "#/lib/auth"

type AuthParam = "login" | "register" | undefined

export const Route = createFileRoute("/")({
	validateSearch: (s: Record<string, unknown>): { auth?: AuthParam } => {
		if (s.auth === "login" || s.auth === "register") return { auth: s.auth }
		return {}
	},
	component: LandingPage,
})

function LandingPage() {
	const status = useAuth((s) => s.status)
	const navigate = useNavigate()
	const { auth } = Route.useSearch()

	useEffect(() => {
		if (status === "authenticated") navigate({ to: "/dashboard" })
	}, [status, navigate])

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
				<AuthShell onClose={() => navigate({ to: "/", search: {} })}>
					{auth === "login" && <LoginForm />}
					{auth === "register" && <RegisterForm />}
				</AuthShell>
			)}
		</div>
	)
}
