import { useForm } from "@tanstack/react-form"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { useAuth } from "#/features/auth/AuthProvider"
import { inputClass } from "#/features/auth/styles"

export function LoginForm() {
	const { login } = useAuth()
	const [error, setError] = useState("")

	const form = useForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			setError("")
			try {
				await login(value.email, value.password)
			} catch {
				setError("Email hoặc mật khẩu không đúng")
			}
		},
	})

	return (
		<>
			<h1 className="font-extrabold text-2xl text-foreground mb-8">Đăng nhập</h1>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					form.handleSubmit()
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
				{error && <p className="text-sm text-destructive font-bold">{error}</p>}
				<button
					type="submit"
					disabled={form.state.isSubmitting}
					className="btn btn-primary w-full h-12 text-base disabled:opacity-50"
				>
					{form.state.isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
				</button>
			</form>
			<Link
				to="/"
				search={{ auth: "choose" }}
				className="text-sm font-bold text-primary hover:underline mt-4 inline-block"
			>
				← Quay lại
			</Link>
		</>
	)
}
