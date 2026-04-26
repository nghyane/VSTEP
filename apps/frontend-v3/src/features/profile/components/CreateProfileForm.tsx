import { useForm } from "@tanstack/react-form"
import { inputClass } from "#/features/auth/styles"
import { cn } from "#/lib/utils"

interface Props {
	onSubmit: (data: { nickname: string; target_level: string; target_deadline: string }) => Promise<unknown>
	onCancel: () => void
}

const LEVEL_DESC: Record<string, string> = {
	B1: "Giao tiếp cơ bản",
	B2: "Phổ biến nhất",
	C1: "Nâng cao",
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
	const isActive = current === value
	return (
		<button
			type="button"
			onClick={() => onChange(value)}
			className={cn(
				"flex flex-col items-center gap-0.5 py-3 rounded-(--radius-button) border-2 border-b-4 font-bold transition-all",
				isActive
					? "border-primary bg-primary text-primary-foreground border-b-primary-dark"
					: "border-border bg-surface text-foreground hover:border-primary/40 active:translate-y-[2px] active:border-b-2",
			)}
		>
			<span
				className={cn("text-base font-extrabold", isActive ? "text-primary-foreground" : "text-foreground")}
			>
				{value}
			</span>
			<span
				className={cn(
					"text-[10px] font-bold uppercase tracking-wider",
					isActive ? "text-primary-foreground/80" : "text-subtle",
				)}
			>
				{LEVEL_DESC[value]}
			</span>
		</button>
	)
}

function daysUntil(deadline: string): number {
	if (!deadline) return 0
	const diff = new Date(deadline).getTime() - Date.now()
	return Math.max(0, Math.ceil(diff / 86400000))
}

export function CreateProfileForm({ onSubmit, onCancel }: Props) {
	const form = useForm({
		defaultValues: { nickname: "", target_level: "B2", target_deadline: "" },
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
				<form.Field name="nickname">
					{(field) => (
						<div className="bg-gradient-to-b from-primary-tint to-transparent px-6 pt-8 pb-6 text-center">
							<div className="size-20 mx-auto mb-3 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-display text-4xl shadow-lg">
								{field.state.value.charAt(0).toUpperCase() || "?"}
							</div>
							<h3 className="font-extrabold text-xl text-foreground">Tạo mục tiêu mới</h3>
							<p className="text-xs text-subtle mt-1">Mỗi mục tiêu là một lộ trình riêng</p>
						</div>
					)}
				</form.Field>

				<div className="px-6 pb-6 space-y-5">
					{/* Nickname */}
					<form.Field name="nickname">
						{(field) => (
							<FormField label="Nickname" hint="Tên hiển thị trên hồ sơ — tối đa 32 ký tự">
								<input
									type="text"
									placeholder="VD: Mục tiêu B2 tháng 6"
									required
									maxLength={32}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									className={inputClass}
								/>
							</FormField>
						)}
					</form.Field>

					{/* Level */}
					<form.Field name="target_level">
						{(field) => (
							<FormField label="Trình độ mục tiêu" hint="Có thể nâng cấp sau bằng cách tạo mục tiêu mới">
								<div className="grid grid-cols-3 gap-2">
									<LevelButton value="B1" current={field.state.value} onChange={field.handleChange} />
									<LevelButton value="B2" current={field.state.value} onChange={field.handleChange} />
									<LevelButton value="C1" current={field.state.value} onChange={field.handleChange} />
								</div>
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
										: "Chọn ngày thi để hệ thống tính lộ trình phù hợp"
								}
							>
								<input
									type="date"
									required
									min={new Date().toISOString().split("T")[0]}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									className={inputClass}
								/>
							</FormField>
						)}
					</form.Field>

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
							{form.state.isSubmitting ? "Đang tạo..." : "Tạo mục tiêu"}
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
