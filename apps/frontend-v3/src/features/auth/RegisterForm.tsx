import { useForm } from "@tanstack/react-form"
import { Link } from "@tanstack/react-router"
import { GoogleButton } from "#/features/auth/GoogleButton"
import { inputClass } from "#/features/auth/styles"
import { getApiError } from "#/lib/api-error"
import { useAuth } from "#/lib/auth-store"
import { useToast } from "#/lib/toast-store"

export function RegisterForm() {
	const register = useAuth((s) => s.register)
	const toast = useToast((s) => s.add)

	const form = useForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			try {
				await register(value)
			} catch (e) {
				toast(getApiError(e))
			}
		},
	})

	return (
		<>
			<h1 className="font-extrabold text-3xl text-foreground mb-4">Tạo tài khoản</h1>
			<GoogleButton />
			<div className="flex items-center gap-3 my-3">
				<div className="flex-1 h-px bg-border" />
				<span className="text-xs text-subtle font-bold">HOẶC</span>
				<div className="flex-1 h-px bg-border" />
			</div>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					void form.handleSubmit()
				}}
				className="space-y-2.5"
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
				<button
					type="submit"
					disabled={form.state.isSubmitting}
					className="btn btn-primary w-full h-12 text-base disabled:opacity-50"
				>
					{form.state.isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
				</button>
			</form>
			<p className="text-sm font-bold text-muted mt-3">
				Đã có tài khoản?
				<Link to="/" search={{ auth: "login" }} className="text-primary hover:underline ml-1">
					Đăng nhập
				</Link>
			</p>
		</>
	)
}
