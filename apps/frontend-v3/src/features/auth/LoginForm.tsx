import { useForm } from "@tanstack/react-form"
import { Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { GoogleButton } from "#/features/auth/GoogleButton"
import { inputClass } from "#/features/auth/styles"
import { useAuth } from "#/lib/auth"

export function LoginForm() {
	const login = useAuth((s) => s.login)
	const loginWithGoogle = useAuth((s) => s.loginWithGoogle)
	const navigate = useNavigate()
	const [googleLoading, setGoogleLoading] = useState(false)

	async function handleGoogleToken(idToken: string) {
		setGoogleLoading(true)
		try {
			const result = await loginWithGoogle(idToken)
			if (result?.needsOnboarding) {
				void navigate({ to: "/", search: { auth: "register" } })
			}
		} finally {
			setGoogleLoading(false)
		}
	}

	const form = useForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			await login(value.email, value.password)
		},
	})

	return (
		<>
			<div className="text-center mb-6">
				<h1 className="font-extrabold text-2xl text-foreground">Đăng nhập</h1>
				<p className="text-sm text-subtle mt-1">Chào mừng bạn quay lại!</p>
			</div>

			<GoogleButton onToken={handleGoogleToken} text="signin_with" disabled={googleLoading} />

			<div className="flex items-center gap-3 my-5">
				<div className="flex-1 h-px bg-border" />
				<span className="text-[11px] text-placeholder font-bold uppercase">hoặc</span>
				<div className="flex-1 h-px bg-border" />
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault()
					void form.handleSubmit()
				}}
				className="space-y-3"
			>
				<div className="space-y-1">
					<label htmlFor="login-email" className="text-xs font-bold text-muted uppercase">Email</label>
					<form.Field name="email">
						{(field) => (
							<input
								id="login-email"
								type="email"
								placeholder="email@example.com"
								required
								autoComplete="email"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								className={inputClass}
							/>
						)}
					</form.Field>
				</div>
				<div className="space-y-1">
					<label htmlFor="login-password" className="text-xs font-bold text-muted uppercase">Mật khẩu</label>
					<form.Field name="password">
						{(field) => (
							<input
								id="login-password"
								type="password"
								placeholder="Nhập mật khẩu"
								required
								autoComplete="current-password"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								className={inputClass}
							/>
						)}
					</form.Field>
				</div>
				<div className="flex items-center justify-end">
					<button type="button" className="text-xs font-bold text-primary hover:underline">
						Quên mật khẩu?
					</button>
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
