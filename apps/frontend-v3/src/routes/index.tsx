import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { type LandingAuthMode, LandingAuthOverlay } from "#/features/landing/components/LandingAuthOverlay"
import { LandingCTA } from "#/features/landing/components/LandingCTA"
import { LandingFAQ } from "#/features/landing/components/LandingFAQ"
import { LandingFeatures } from "#/features/landing/components/LandingFeatures"
import { LandingHero } from "#/features/landing/components/LandingHero"
import { LandingNav } from "#/features/landing/components/LandingNav"
import { LandingSkills } from "#/features/landing/components/LandingSkills"
import { LandingSocial } from "#/features/landing/components/LandingSocial"
import { useAuth } from "#/lib/auth"

type AuthParam = LandingAuthMode | undefined

export const Route = createFileRoute("/")({
	validateSearch: (
		s: Record<string, unknown>,
	): {
		auth?: AuthParam
		redirect?: string
		onboarding?: boolean
		email?: string
		token?: string
		verified?: boolean
	} => {
		const auth =
			s.auth === "login" ||
			s.auth === "register" ||
			s.auth === "forgot" ||
			s.auth === "reset" ||
			s.auth === "email-verified" ||
			s.auth === "email-verification-invalid"
				? s.auth
				: undefined
		const redirect = typeof s.redirect === "string" ? s.redirect : undefined
		const onboarding = s.onboarding === true || s.onboarding === "1" ? true : undefined
		const email = typeof s.email === "string" ? s.email : undefined
		const token = typeof s.token === "string" ? s.token : undefined
		const verified = s.verified === true || s.verified === "1" ? true : undefined
		return { auth, redirect, onboarding, email, token, verified }
	},
	component: LandingPage,
})

function LandingPage() {
	const status = useAuth((s) => s.status)
	const navigate = useNavigate()
	const { auth, redirect: redirectTo, onboarding, email, token, verified } = Route.useSearch()
	const ctaRef = useRef<HTMLDivElement>(null)
	const [showBtn, setShowBtn] = useState(false)

	useEffect(() => {
		if (status === "authenticated") navigate({ to: redirectTo || "/dashboard" })
	}, [status, navigate, redirectTo])

	useEffect(() => {
		const el = ctaRef.current
		if (!el) return
		const observer = new IntersectionObserver(([entry]) => setShowBtn(!entry.isIntersecting), {
			threshold: 0,
		})
		observer.observe(el)
		return () => observer.disconnect()
	}, [])

	return (
		<div className="min-h-screen bg-surface">
			<LandingNav showCta={showBtn} />

			<LandingHero ctaRef={ctaRef} />
			<LandingSkills />
			<LandingFeatures />
			<LandingSocial />
			<LandingFAQ />
			<LandingCTA />

			<footer className="border-t border-border py-8 text-center text-sm text-subtle">
				© 2025 VSTEP · Luyện thi chứng chỉ tiếng Anh quốc gia
			</footer>

			{auth && (
				<LandingAuthOverlay
					mode={auth}
					onboarding={onboarding === true}
					email={email}
					token={token}
					verified={verified === true}
				/>
			)}
		</div>
	)
}
