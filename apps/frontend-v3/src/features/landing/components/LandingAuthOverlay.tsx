import { useNavigate } from "@tanstack/react-router"
import { AuthShell } from "#/features/auth/AuthShell"
import { LoginForm } from "#/features/auth/LoginForm"
import { RegisterForm } from "#/features/auth/RegisterForm"

export type LandingAuthMode = "login" | "register"

interface LandingAuthOverlayProps {
	mode: LandingAuthMode
	onboarding: boolean
}

export function LandingAuthOverlay({ mode, onboarding }: LandingAuthOverlayProps) {
	const navigate = useNavigate()

	return (
		<AuthShell onClose={() => navigate({ to: "/", search: {} })}>
			{mode === "login" && <LoginForm />}
			{mode === "register" && <RegisterForm onboardingOnly={onboarding} />}
		</AuthShell>
	)
}
