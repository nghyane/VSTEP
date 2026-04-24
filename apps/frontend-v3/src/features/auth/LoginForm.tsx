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
			<h1 className="font-extrabold text-3xl text-foreground mb-1">Đăng nhập</h1>
			<p className="text-sm text-subtle mb-5">Chào mừng bạn quay lại cùng Lạc.</p>
			<GoogleButton onToken={handleGoogleToken} text="signin_with" disabled={googleLoading} />
			<div className="flex items-center gap-3 my-4">
				<div className="flex-1 h-px bg-border" />
				<span className="text-xs text-subtle font-bold">HOẶC</span>
				<div className="flex-1 h-px bg-border" />
			</div>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					void form.handleSubmit()
				}}
				className="space-y-3"
			>
				<form.Field name="email">
					{(field) => (
						<input
							type="email"
							placeholder="Email"
							required
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							className={inputClass}
						/>
					)}
				</form.Field>
				<form.Field name="password">
					{(field) => (
						<input
							type="password"
							placeholder="Mật khẩu"
							required
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							className={inputClass}
						/>
					)}
				</form.Field>
				<div className="flex items-center justify-between">
					<label className="group flex items-center gap-2 cursor-pointer">
						<input type="checkbox" className="sr-only" />
						<div className="w-5 h-5 rounded-md border-2 border-border bg-surface group-has-checked:bg-primary group-has-checked:border-primary flex items-center justify-center transition">
							<svg
								viewBox="0 0 12 10"
								aria-hidden="true"
								className="w-3 h-2.5 opacity-0 group-has-checked:opacity-100 transition"
								fill="none"
								stroke="white"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M1 5.5L4.5 9L11 1" />
							</svg>
						</div>
						<span className="text-xs font-bold text-muted">Ghi nhớ đăng nhập</span>
					</label>
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
			<p className="text-sm font-bold text-muted mt-4">
				Chưa có tài khoản?
				<Link to="/" search={{ auth: "register" }} className="text-primary hover:underline ml-1">
					Đăng ký
				</Link>
			</p>
		</>
	)
}
