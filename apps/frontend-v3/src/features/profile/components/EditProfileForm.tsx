import { useForm } from "@tanstack/react-form"
import { inputClass } from "#/features/auth/styles"
import { cn } from "#/lib/utils"
import type { Profile } from "#/types/auth"

interface Props {
	profile: Profile
	onSubmit: (data: { nickname: string; target_deadline: string }) => Promise<unknown>
	onCancel: () => void
}

function daysUntil(deadline: string): number {
	if (!deadline) return 0
	const diff = new Date(deadline).getTime() - Date.now()
	return Math.max(0, Math.ceil(diff / 86400000))
}

export function EditProfileForm({ profile, onSubmit, onCancel }: Props) {
	const form = useForm({
		defaultValues: { nickname: profile.nickname, target_deadline: profile.target_deadline },
		onSubmit: async ({ value }) => {
			await onSubmit(value)
		},
	})

	return (
		<button
			type="button"
			aria-label="Đóng"
			onClick={onCancel}
			className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_200ms_ease-out]"
		>
			<form
				onClick={(e) => e.stopPropagation()}
				onSubmit={(e) => {
					e.preventDefault()
					void form.handleSubmit()
				}}
				className="card relative w-full max-w-md bg-surface text-left overflow-hidden animate-[popIn_300ms_cubic-bezier(0.34,1.56,0.64,1)]"
			>
				<button
					type="button"
					onClick={onCancel}
					aria-label="Đóng"
					className="absolute top-4 right-4 size-8 rounded-full hover:bg-background flex items-center justify-center text-muted transition z-10"
				>
					<span className="text-xl leading-none">×</span>
				</button>

				{/* Hero */}
				<div className="bg-gradient-to-b from-primary-tint to-transparent px-6 pt-8 pb-6 text-center">
					<div className="relative inline-block mb-3">
						<div className="size-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-display text-4xl shadow-lg">
							{profile.nickname.charAt(0).toUpperCase()}
						</div>
						<span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-extrabold text-white bg-primary px-2.5 py-0.5 rounded-full shadow-sm">
							{profile.target_level}
						</span>
					</div>
					<h3 className="font-extrabold text-xl text-foreground">Chỉnh sửa mục tiêu</h3>
					<p className="text-xs text-subtle mt-1">Cập nhật thông tin lộ trình của bạn</p>
				</div>

				<div className="px-6 pb-6 space-y-5">
					{/* Nickname */}
					<form.Field name="nickname">
						{(field) => (
							<FormField label="Nickname" hint="Tên hiển thị trên hồ sơ">
								<input
									type="text"
									required
									maxLength={32}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									className={inputClass}
								/>
							</FormField>
						)}
					</form.Field>

					{/* Deadline */}
					<form.Field name="target_deadline">
						{(field) => (
							<FormField
								label="Ngày thi dự kiến"
								hint={
									field.state.value && daysUntil(field.state.value) > 0
										? `Còn ${daysUntil(field.state.value)} ngày để chuẩn bị`
										: "Chọn ngày thi để tính toán lộ trình"
								}
							>
								<input
									type="date"
									required
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									className={inputClass}
								/>
							</FormField>
						)}
					</form.Field>

					{/* Level (read-only) */}
					<div className="bg-background rounded-(--radius-card) p-4 border-2 border-dashed border-border">
						<p className="text-xs font-extrabold uppercase tracking-wider text-subtle mb-1">
							Trình độ mục tiêu
						</p>
						<p className="text-base font-bold text-foreground">{profile.target_level}</p>
						<p className="text-xs text-subtle mt-1">
							Không thể đổi level — tạo mục tiêu mới nếu muốn level khác
						</p>
					</div>

					{/* Actions */}
					<div className="flex gap-3 pt-2">
						<button type="button" onClick={onCancel} className="btn btn-secondary flex-1">
							Hủy
						</button>
						<button
							type="submit"
							disabled={form.state.isSubmitting}
							className={cn("btn btn-primary flex-1", form.state.isSubmitting && "opacity-50")}
						>
							{form.state.isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
						</button>
					</div>
				</div>
			</form>
		</button>
	)
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
	return (
		<div className="block">
			<p className="text-xs font-extrabold uppercase tracking-wider text-subtle mb-2">{label}</p>
			{children}
			{hint && <p className="text-[11px] text-subtle mt-1.5">{hint}</p>}
		</div>
	)
}
