import { useNavigate } from "@tanstack/react-router"
import { AuthShell } from "#/features/auth/AuthShell"
import { ForgotPasswordForm } from "#/features/auth/ForgotPasswordForm"
import { LoginForm } from "#/features/auth/LoginForm"
import { RegisterForm } from "#/features/auth/RegisterForm"
import { ResetPasswordForm } from "#/features/auth/ResetPasswordForm"

export type LandingAuthMode = "login" | "register" | "forgot" | "reset"

interface LandingAuthOverlayProps {
	mode: LandingAuthMode
	onboarding: boolean
	email?: string
	token?: string
}

export function LandingAuthOverlay({ mode, onboarding, email, token }: LandingAuthOverlayProps) {
	const navigate = useNavigate()

	return (
		<AuthShell onClose={() => navigate({ to: "/", search: {} })}>
			{mode === "login" && <LoginForm />}
			{mode === "register" && <RegisterForm onboardingOnly={onboarding} />}
			{mode === "forgot" && <ForgotPasswordForm />}
			{mode === "reset" && <ResetPasswordForm email={email ?? ""} token={token ?? ""} />}
		</AuthShell>
	)
}
