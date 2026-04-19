import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useAuth } from "#/features/auth/AuthProvider"
import { LoginPage } from "#/features/auth/LoginPage"
import { LandingCTA, LandingFeatures, LandingHero, LandingSkills } from "#/features/landing/sections"

export const Route = createFileRoute("/")({
	component: LandingPage,
})

function LandingPage() {
	const { isAuthenticated } = useAuth()
	const navigate = useNavigate()
	const [showLogin, setShowLogin] = useState(false)

	if (isAuthenticated) {
		navigate({ to: "/dashboard" })
		return null
	}

	const openLogin = () => setShowLogin(true)

	return (
		<div className="min-h-screen bg-surface">
			<nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
				<span className="font-display text-3xl text-primary">VSTEP</span>
				<div className="flex items-center gap-3">
					<button type="button" onClick={openLogin} className="btn btn-secondary">
						Đăng nhập
					</button>
					<button type="button" onClick={openLogin} className="btn btn-primary">
						Bắt đầu miễn phí
					</button>
				</div>
			</nav>

			<LandingHero onLogin={openLogin} />
			<LandingSkills />
			<LandingFeatures />
			<LandingCTA onLogin={openLogin} />

			<footer className="border-t border-border py-8 text-center text-sm text-subtle">
				© 2025 VSTEP · Luyện thi chứng chỉ tiếng Anh quốc gia
			</footer>

			{showLogin && <LoginPage onClose={() => setShowLogin(false)} />}
		</div>
	)
}
