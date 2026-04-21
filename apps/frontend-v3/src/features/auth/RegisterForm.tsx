import { useForm } from "@tanstack/react-form"
import { Link } from "@tanstack/react-router"
import { GoogleButton } from "#/features/auth/GoogleButton"
import { inputClass } from "#/features/auth/styles"
import { useAuth } from "#/lib/auth"
import { cn } from "#/lib/utils"

function LevelButton({
	value,
	current,
	onChange,
}: {
	value: string
	current: string
	onChange: (v: string) => void
}) {
	return (
		<button
			type="button"
			onClick={() => onChange(value)}
			className={cn(
				"h-12 rounded-(--radius-button) font-bold text-base transition",
				current === value
					? "bg-primary text-primary-foreground"
					: "bg-surface border-2 border-border text-foreground hover:border-primary",
			)}
		>
			{value}
		</button>
	)
}

export function RegisterForm() {
	const register = useAuth((s) => s.register)

	const form = useForm({
		defaultValues: { email: "", password: "", nickname: "", target_level: "B2", target_deadline: "" },
		onSubmit: async ({ value }) => {
			await register(value)
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
				<form.Field name="nickname">
					{(field) => (
						<input
							type="text"
							placeholder="Nickname"
							required
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							className={inputClass}
						/>
					)}
				</form.Field>
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
				<div>
					<p className="text-sm font-bold text-foreground mb-2 text-left">Mục tiêu trình độ</p>
					<form.Field name="target_level">
						{(field) => (
							<div className="grid grid-cols-3 gap-2">
								<LevelButton value="B1" current={field.state.value} onChange={field.handleChange} />
								<LevelButton value="B2" current={field.state.value} onChange={field.handleChange} />
								<LevelButton value="C1" current={field.state.value} onChange={field.handleChange} />
							</div>
						)}
					</form.Field>
				</div>
				<div>
					<p className="text-sm font-bold text-foreground mb-2 text-left">Ngày thi dự kiến</p>
					<form.Field name="target_deadline">
						{(field) => (
							<input
								type="date"
								required
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								className={inputClass}
							/>
						)}
					</form.Field>
				</div>
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
