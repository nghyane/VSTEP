import { useNavigate } from "@tanstack/react-router"
import type { FormEvent } from "react"
import { useEffect, useState } from "react"
import { AuthShell } from "#/features/auth/AuthShell"
import { resendEmailVerification } from "#/features/auth/actions"
import { ForgotPasswordForm } from "#/features/auth/ForgotPasswordForm"
import { LoginForm } from "#/features/auth/LoginForm"
import { RegisterForm } from "#/features/auth/RegisterForm"
import { ResetPasswordForm } from "#/features/auth/ResetPasswordForm"
import { inputClass } from "#/features/auth/styles"

export type LandingAuthMode =
	| "login"
	| "register"
	| "forgot"
	| "reset"
	| "email-verified"
	| "email-verification-invalid"

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
			{mode === "email-verification-invalid" && <EmailVerificationInvalid initialEmail={email} />}
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

function EmailVerificationInvalid({ initialEmail = "" }: { initialEmail?: string }) {
	const navigate = useNavigate()
	const [email, setEmail] = useState(initialEmail)
	const [submitting, setSubmitting] = useState(false)
	const [message, setMessage] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	async function handleResend(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setSubmitting(true)
		setMessage(null)
		setError(null)

		try {
			await resendEmailVerification(email)
			setMessage("Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.")
		} catch (err) {
			setError(err instanceof Error ? err.message : "Không gửi lại được email xác thực.")
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<>
			<div className="text-center mb-6">
				<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10 text-3xl font-extrabold text-destructive">
					!
				</div>
				<h1 className="font-extrabold text-2xl text-foreground">Liên kết xác thực đã hết hạn</h1>
				<p className="text-sm text-subtle mt-1">
					Nhập email đã đăng ký để nhận liên kết xác thực mới. Bạn chưa thể đăng nhập khi email chưa được xác
					thực.
				</p>
			</div>

			<form onSubmit={handleResend} className="space-y-3">
				<input
					type="email"
					placeholder="email@example.com"
					required
					autoComplete="email"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					className={inputClass}
				/>

				{message && (
					<p className="text-sm font-bold text-success text-center bg-success/10 rounded-(--radius-button) py-2">
						{message}
					</p>
				)}
				{error && (
					<p className="text-sm font-bold text-destructive text-center bg-destructive/10 rounded-(--radius-button) py-2">
						{error}
					</p>
				)}

				<button
					type="submit"
					disabled={submitting}
					className="btn btn-primary w-full h-12 text-base disabled:opacity-50"
				>
					{submitting ? "Đang gửi..." : "Gửi lại email xác thực"}
				</button>
				<button
					type="button"
					onClick={() => navigate({ to: "/", search: { auth: "login" } })}
					className="btn btn-secondary w-full h-12 text-base"
				>
					Tôi đã xác thực, đăng nhập
				</button>
			</form>
		</>
	)
}
