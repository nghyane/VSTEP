import { useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { AuthShell } from "#/features/auth/AuthShell"
import { ForgotPasswordForm } from "#/features/auth/ForgotPasswordForm"
import { LoginForm } from "#/features/auth/LoginForm"
import { RegisterForm } from "#/features/auth/RegisterForm"
import { ResetPasswordForm } from "#/features/auth/ResetPasswordForm"

export type LandingAuthMode = "login" | "register" | "forgot" | "reset" | "email-verified"

interface LandingAuthOverlayProps {
	mode: LandingAuthMode
	onboarding: boolean
	email?: string
	token?: string
	verified?: boolean
}

export function LandingAuthOverlay({ mode, onboarding, email, token, verified }: LandingAuthOverlayProps) {
	const navigate = useNavigate()

	return (
		<AuthShell onClose={() => navigate({ to: "/", search: {} })}>
			{mode === "login" && <LoginForm verified={verified} />}
			{mode === "register" && <RegisterForm onboardingOnly={onboarding} />}
			{mode === "forgot" && <ForgotPasswordForm />}
			{mode === "reset" && <ResetPasswordForm email={email ?? ""} token={token ?? ""} />}
			{mode === "email-verified" && <EmailVerifiedSuccess />}
		</AuthShell>
	)
}

function EmailVerifiedSuccess() {
	const navigate = useNavigate()

	useEffect(() => {
		const timeout = window.setTimeout(() => {
			void navigate({ to: "/", search: { auth: "login", verified: true } })
		}, 3000)

		return () => window.clearTimeout(timeout)
	}, [navigate])

	return (
		<>
			<div className="text-center mb-6">
				<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success/10 text-3xl font-extrabold text-success">
					✓
				</div>
				<h1 className="font-extrabold text-2xl text-foreground">Xác thực email thành công</h1>
				<p className="text-sm text-subtle mt-1">
					Tài khoản của bạn đã sẵn sàng. Hệ thống sẽ chuyển sang đăng nhập sau 3 giây.
				</p>
			</div>

			<button
				type="button"
				onClick={() => navigate({ to: "/", search: { auth: "login", verified: true } })}
				className="btn btn-primary w-full h-12 text-base"
			>
				Đăng nhập ngay
			</button>
		</>
	)
}
