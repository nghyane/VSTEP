import { useForm } from "@tanstack/react-form"
import { Link, useNavigate } from "@tanstack/react-router"
import { HTTPError } from "ky"
import { useState } from "react"
import { resendEmailVerification } from "#/features/auth/actions"
import { GoogleButton } from "#/features/auth/GoogleButton"
import { PasswordInput } from "#/features/auth/PasswordInput"
import { inputClass } from "#/features/auth/styles"
import { useAuth } from "#/lib/auth"

function authErrorMessage(error: unknown, fallback: string) {
	if (error instanceof HTTPError) {
		const body = error.data as { message?: string; errors?: { email?: string[] } } | undefined
		return body?.errors?.email?.[0] ?? body?.message ?? fallback
	}
	return fallback
}

export function LoginForm({ verified = false }: { verified?: boolean } = {}) {
	const login = useAuth((s) => s.login)
	const loginWithGoogle = useAuth((s) => s.loginWithGoogle)
	const navigate = useNavigate()
	const [googleLoading, setGoogleLoading] = useState(false)
	const [verificationEmail, setVerificationEmail] = useState<string | null>(null)
	const [resendingVerification, setResendingVerification] = useState(false)
	const [resendMessage, setResendMessage] = useState<string | null>(null)
	const [resendError, setResendError] = useState<string | null>(null)

	async function handleResendVerification() {
		if (!verificationEmail) return
		setResendingVerification(true)
		setResendMessage(null)
		setResendError(null)
		try {
			await resendEmailVerification(verificationEmail)
			setResendMessage("Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.")
		} catch (error) {
			setResendError(authErrorMessage(error, "Không gửi lại được email xác thực."))
		} finally {
			setResendingVerification(false)
		}
	}

	async function handleGoogleToken(idToken: string) {
		setGoogleLoading(true)
		try {
			const result = await loginWithGoogle(idToken)
			if (result?.needsOnboarding) {
				void navigate({ to: "/", search: { auth: "register", onboarding: true } })
			}
		} finally {
			setGoogleLoading(false)
		}
	}

	const form = useForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			setVerificationEmail(null)
			setResendMessage(null)
			setResendError(null)
			const result = await login(value.email, value.password)
			if (result?.emailVerificationRequired) {
				setVerificationEmail(result.email ?? value.email)
				return
			}
			if (result?.needsOnboarding) {
				void navigate({ to: "/", search: { auth: "register", onboarding: true } })
			}
		},
	})

	return (
		<>
			<div className="text-center mb-6">
				<h1 className="font-extrabold text-2xl text-foreground">Đăng nhập</h1>
				<p className="text-sm text-subtle mt-1">
					{verified ? "Email đã được xác thực. Bạn có thể đăng nhập." : "Chào mừng bạn quay lại!"}
				</p>
			</div>
			{verified && (
				<p className="text-sm font-bold text-success text-center bg-success/10 rounded-(--radius-button) py-2 mb-4">
					Xác thực email thành công.
				</p>
			)}

			<GoogleButton onToken={handleGoogleToken} text="signin_with" disabled={googleLoading} />

			<div className="flex items-center gap-3 my-5">
				<div className="flex-1 h-px bg-border" />
				<span className="text-[11px] text-placeholder font-bold uppercase">hoặc</span>
				<div className="flex-1 h-px bg-border" />
			</div>

			{verificationEmail && (
				<div className="mb-4 rounded-(--radius-card) border-2 border-warning/30 bg-warning/10 p-4 text-center">
					<p className="text-sm font-bold text-warning">
						Email này đã đăng ký nhưng chưa xác thực. Vui lòng mở link trong email hoặc gửi lại link mới.
					</p>
					{resendMessage && <p className="mt-2 text-sm font-bold text-success">{resendMessage}</p>}
					{resendError && <p className="mt-2 text-sm font-bold text-destructive">{resendError}</p>}
					<button
						type="button"
						disabled={resendingVerification}
						onClick={handleResendVerification}
						className="btn btn-secondary mt-3 h-11 w-full text-sm disabled:opacity-50"
					>
						{resendingVerification ? "Đang gửi..." : "Gửi lại email xác thực"}
					</button>
				</div>
			)}

			<form
				onSubmit={(e) => {
					e.preventDefault()
					void form.handleSubmit()
				}}
				className="space-y-3"
			>
				<div className="space-y-1">
					<label htmlFor="login-email" className="text-xs font-bold text-muted uppercase">
						Email
					</label>
					<form.Field name="email">
						{(field) => (
							<input
								id="login-email"
								type="email"
								placeholder="email@example.com"
								required
								autoComplete="email"
								value={field.state.value}
								onChange={(e) => {
									field.handleChange(e.target.value)
									setVerificationEmail(null)
								}}
								className={inputClass}
							/>
						)}
					</form.Field>
				</div>
				<div className="space-y-1">
					<label htmlFor="login-password" className="text-xs font-bold text-muted uppercase">
						Mật khẩu
					</label>
					<form.Field name="password">
						{(field) => (
							<PasswordInput
								id="login-password"
								placeholder="Nhập mật khẩu"
								required
								autoComplete="current-password"
								value={field.state.value}
								onChange={field.handleChange}
							/>
						)}
					</form.Field>
				</div>
				<div className="flex items-center justify-end">
					<Link to="/" search={{ auth: "forgot" }} className="text-xs font-bold text-primary hover:underline">
						Quên mật khẩu?
					</Link>
				</div>
				<button
					type="submit"
					disabled={form.state.isSubmitting}
					className="btn btn-primary w-full h-12 text-base disabled:opacity-50"
				>
					{form.state.isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
				</button>
			</form>

			<p className="text-sm text-muted mt-5 text-center">
				Chưa có tài khoản?{" "}
				<Link to="/" search={{ auth: "register" }} className="font-bold text-primary hover:underline">
					Đăng ký
				</Link>
			</p>
		</>
	)
}
