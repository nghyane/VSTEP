import { useForm } from "@tanstack/react-form"
import { inputClass } from "#/features/auth/styles"
import { api } from "#/lib/api"
import { getApiError } from "#/lib/api-error"
import { useAuth } from "#/lib/auth-store"
import { useToast } from "#/lib/toast-store"
import { cn } from "#/lib/utils"

function LevelButton({ value, current, onChange }: { value: string; current: string; onChange: (v: string) => void }) {
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

export function OnboardingModal() {
	const profile = useAuth((s) => s.profile)
	const toast = useToast((s) => s.add)

	const form = useForm({
		defaultValues: { nickname: "", target_level: "B2", target_deadline: "" },
		onSubmit: async ({ value }) => {
			try {
				const res = await api.post("profiles", { json: value }).json<{ data: typeof profile }>()
				useAuth.setState({ profile: res.data })
			} catch (e) {
				toast(getApiError(e))
			}
		},
	})

	return (
		<div className="fixed inset-0 z-50 bg-surface/80 backdrop-blur-sm flex items-center justify-center px-6">
			<div className="w-full max-w-[440px] bg-surface rounded-(--radius-banner) border-2 border-border p-8 text-center">
				<img src="/mascot/lac-happy.png" alt="Lạc" className="w-28 h-28 mx-auto mb-2 object-contain" />
				<h1 className="font-extrabold text-2xl text-foreground mb-1">Chào mừng bạn!</h1>
				<p className="text-sm text-subtle mb-6">Thiết lập hồ sơ để bắt đầu luyện tập</p>
				<form
					onSubmit={(e) => {
						e.preventDefault()
						void form.handleSubmit()
					}}
					className="w-full space-y-4 text-left"
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
					<div>
						<p className="text-sm font-bold text-foreground mb-3">Mục tiêu trình độ</p>
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
						<p className="text-sm font-bold text-foreground mb-3">Ngày thi dự kiến</p>
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
						{form.state.isSubmitting ? "Đang lưu..." : "Bắt đầu luyện tập"}
					</button>
				</form>
			</div>
		</div>
	)
}
