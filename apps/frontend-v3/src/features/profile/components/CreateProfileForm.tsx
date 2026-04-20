import { useForm } from "@tanstack/react-form"
import { useState } from "react"
import { inputClass } from "#/features/auth/styles"
import { cn } from "#/lib/utils"

interface Props {
	onSubmit: (data: { nickname: string; target_level: string; target_deadline: string }) => Promise<unknown>
	onCancel: () => void
}

function LevelButton({ value, current, onChange }: { value: string; current: string; onChange: (v: string) => void }) {
	return (
		<button
			type="button"
			onClick={() => onChange(value)}
			className={cn(
				"h-10 rounded-(--radius-button) font-bold text-sm transition",
				current === value
					? "bg-primary text-primary-foreground"
					: "bg-surface border-2 border-border text-foreground hover:border-primary",
			)}
		>
			{value}
		</button>
	)
}

export function CreateProfileForm({ onSubmit, onCancel }: Props) {
	const form = useForm({
		defaultValues: { nickname: "", target_level: "B2", target_deadline: "" },
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
			<h3 className="font-extrabold text-lg text-foreground">Tạo mục tiêu mới</h3>
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
				<p className="text-sm font-bold text-foreground mb-2">Trình độ mục tiêu</p>
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
				<p className="text-sm font-bold text-foreground mb-2">Ngày thi dự kiến</p>
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
			<div className="flex gap-3">
				<button type="button" onClick={onCancel} className="btn btn-secondary flex-1 py-2.5">
					Hủy
				</button>
				<button
					type="submit"
					disabled={form.state.isSubmitting}
					className="btn btn-primary flex-1 py-2.5 disabled:opacity-50"
				>
					{form.state.isSubmitting ? "Đang tạo..." : "Tạo mục tiêu"}
				</button>
			</div>
		</form>
	)
}
