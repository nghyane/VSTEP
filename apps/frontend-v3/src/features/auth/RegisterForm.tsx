import { useForm } from "@tanstack/react-form"
import { Link, useNavigate } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { inputClass } from "#/features/auth/styles"
import { useAuth } from "#/lib/auth-store"
import { createStrictContext } from "#/lib/create-strict-context"
import { cn } from "#/lib/utils"

interface RegisterValues {
	nickname: string
	email: string
	password: string
	target_level: string
	target_deadline: string
}

const [FormCtx, useRegisterForm] =
	createStrictContext<ReturnType<typeof useForm<RegisterValues>>>("RegisterForm")

export function RegisterFormProvider({ children }: { children: ReactNode }) {
	const register = useAuth((s) => s.register)
	const navigate = useNavigate()

	const form = useForm<RegisterValues>({
		defaultValues: { nickname: "", email: "", password: "", target_level: "B2", target_deadline: "" },
		onSubmit: async ({ value }) => {
			await register(value)
			navigate({ to: "/dashboard" })
		},
	})

	return <FormCtx value={form}>{children}</FormCtx>
}

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

export function RegisterStep1() {
	const form = useRegisterForm()

	return (
		<>
			<h1 className="font-extrabold text-2xl text-foreground mb-2">Tạo tài khoản</h1>
			<p className="text-sm text-subtle mb-8">Bước 1/2 · Thông tin đăng nhập</p>
			<div className="space-y-3">
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
				<Link
					to="/"
					search={{ auth: "register-target" }}
					onClick={(e) => {
						const v = form.state.values
						if (!v.nickname || !v.email || !v.password) e.preventDefault()
					}}
					className="btn btn-primary w-full h-12 text-base"
				>
					Tiếp tục
				</Link>
			</div>
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

export function RegisterStep2() {
	const form = useRegisterForm()

	return (
		<>
			<h1 className="font-extrabold text-2xl text-foreground mb-2">Đặt mục tiêu</h1>
			<p className="text-sm text-subtle mb-8">Bước 2/2 · Trình độ và kỳ thi</p>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					void form.handleSubmit()
				}}
				className="space-y-4"
			>
				<div>
					<p className="text-sm font-bold text-foreground mb-3 text-left">Mục tiêu trình độ</p>
					<form.Field name="target_level">
						{(field) => (
							<div className="grid grid-cols-4 gap-2">
								<LevelButton value="A2" current={field.state.value} onChange={field.handleChange} />
								<LevelButton value="B1" current={field.state.value} onChange={field.handleChange} />
								<LevelButton value="B2" current={field.state.value} onChange={field.handleChange} />
								<LevelButton value="C1" current={field.state.value} onChange={field.handleChange} />
							</div>
						)}
					</form.Field>
				</div>
				<div>
					<p className="text-sm font-bold text-foreground mb-3 text-left">Ngày thi dự kiến</p>
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
				{form.state.errorMap.onSubmit && (
					<p className="text-sm text-destructive font-bold">
						Không thể đăng ký. Email có thể đã được sử dụng.
					</p>
				)}
				<button
					type="submit"
					disabled={form.state.isSubmitting}
					className="btn btn-primary w-full h-12 text-base disabled:opacity-50"
				>
					{form.state.isSubmitting ? "Đang tạo tài khoản..." : "Hoàn tất đăng ký"}
				</button>
			</form>
			<Link
				to="/"
				search={{ auth: "register" }}
				className="text-sm font-bold text-primary hover:underline mt-4 inline-block"
			>
				← Quay lại
			</Link>
		</>
	)
}
