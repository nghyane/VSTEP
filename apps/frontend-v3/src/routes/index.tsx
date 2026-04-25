import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { Logo } from "#/components/Logo"
import { AuthShell } from "#/features/auth/AuthShell"
import { LoginForm } from "#/features/auth/LoginForm"
import { RegisterForm } from "#/features/auth/RegisterForm"
import { LandingCTA, LandingFeatures, LandingHero, LandingSkills, LandingSocial } from "#/features/landing/sections"
import { useAuth } from "#/lib/auth"

type AuthParam = "login" | "register" | undefined

export const Route = createFileRoute("/")({
	validateSearch: (s: Record<string, unknown>): { auth?: AuthParam; redirect?: string } => {
		const auth = s.auth === "login" || s.auth === "register" ? s.auth : undefined
		const redirect = typeof s.redirect === "string" ? s.redirect : undefined
		return { auth, redirect }
	},
	component: LandingPage,
})

function LandingPage() {
	const status = useAuth((s) => s.status)
	const navigate = useNavigate()
	const { auth, redirect: redirectTo } = Route.useSearch()
	const ctaRef = useRef<HTMLDivElement>(null)
	const [showBtn, setShowBtn] = useState(false)

	useEffect(() => {
		if (status === "authenticated") navigate({ to: redirectTo || "/dashboard" })
	}, [status, navigate, redirectTo])

	useEffect(() => {
		const el = ctaRef.current
		if (!el) return
		const observer = new IntersectionObserver(([entry]) => setShowBtn(!entry.isIntersecting), { threshold: 0 })
		observer.observe(el)
		return () => observer.disconnect()
	}, [])

	return (
		<div className="min-h-screen bg-surface">
			<nav className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-transparent transition-colors"
				style={showBtn ? { borderBottomColor: "var(--color-border)" } : undefined}
			>
				<div className="flex items-center justify-between px-8 py-4 max-w-6xl mx-auto">
					<Logo size="lg" />
					<div
						className={`transition-all duration-300 ${showBtn ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}
					>
						<button
							type="button"
							onClick={() => navigate({ to: "/", search: { auth: "register" } })}
							className="btn btn-primary text-sm px-6 py-2.5"
						>
							Bắt đầu
						</button>
					</div>
				</div>
			</nav>

			<LandingHero ctaRef={ctaRef} />
			<LandingSkills />
			<LandingFeatures />
			<LandingSocial />
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
