import { useForm } from "@tanstack/react-form"
import { inputClass } from "#/features/auth/styles"
import type { Profile } from "#/types/auth"

interface Props {
	profile: Profile
	onSubmit: (data: { nickname: string; target_deadline: string }) => Promise<unknown>
	onCancel: () => void
}

export function EditProfileForm({ profile, onSubmit, onCancel }: Props) {
	const form = useForm({
		defaultValues: { nickname: profile.nickname, target_deadline: profile.target_deadline },
		onSubmit: async ({ value }) => {
			await onSubmit(value)
		},
	})

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				void form.handleSubmit()
			}}
			className="card p-6 space-y-4"
		>
			<h3 className="font-extrabold text-lg text-foreground">Chỉnh sửa hồ sơ</h3>
			<div>
				<p className="text-sm font-bold text-foreground mb-2">Trình độ mục tiêu</p>
				<p className="text-sm text-muted">{profile.target_level}</p>
			</div>
			<form.Field name="nickname">
				{(field) => (
					<div>
						<p className="text-sm font-bold text-foreground mb-2">Nickname</p>
						<input
							type="text"
							required
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							className={inputClass}
						/>
					</div>
				)}
			</form.Field>
			<form.Field name="target_deadline">
				{(field) => (
					<div>
						<p className="text-sm font-bold text-foreground mb-2">Ngày thi dự kiến</p>
						<input
							type="date"
							required
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							className={inputClass}
						/>
					</div>
				)}
			</form.Field>
			<div className="flex gap-3">
				<button type="button" onClick={onCancel} className="btn btn-secondary flex-1 py-2.5">
					Hủy
				</button>
				<button
					type="submit"
					disabled={form.state.isSubmitting}
					className="btn btn-primary flex-1 py-2.5 disabled:opacity-50"
				>
					{form.state.isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
				</button>
			</div>
		</form>
	)
}
