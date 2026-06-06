import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { inputClass } from "#/features/auth/styles"
import { updateAccount } from "#/features/profile/actions"
import { useAuth } from "#/lib/auth"
import { useToast } from "#/lib/toast"
import { cn } from "#/lib/utils"
import type { User } from "#/types/auth"

interface Props {
	user: User
}

function getPhoneError(phone: string): string | null {
	if (!phone) return null
	if (!/^\d+$/.test(phone)) return "Số điện thoại chỉ được nhập chữ số."
	if (phone.length !== 10) return "Số điện thoại phải gồm đúng 10 chữ số."
	if (!phone.startsWith("0")) return "Số điện thoại phải bắt đầu bằng 0."
	return null
}

export function AccountPhoneForm({ user }: Props) {
	const [isEditing, setIsEditing] = useState(false)
	const updateUser = useAuth((s) => s.updateUser)
	const mutation = useMutation({
		mutationFn: updateAccount,
		onSuccess: ({ data }) => {
			updateUser(data)
			setIsEditing(false)
			useToast.getState().add("Đã cập nhật số điện thoại", "success")
		},
	})
	const form = useForm({
		defaultValues: {
			phone_number: user.phone_number ?? "",
		},
		onSubmit: async ({ value }) => {
			if (!isEditing) return
			const phone = value.phone_number.trim()
			const phoneError = getPhoneError(phone)
			if (phoneError) {
				useToast.getState().add(phoneError)
				return
			}
			await mutation.mutateAsync({ phone_number: phone || null })
		},
	})

	function cancelEdit() {
		form.setFieldValue("phone_number", user.phone_number ?? "")
		setIsEditing(false)
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				void form.handleSubmit()
			}}
			className="flex items-end justify-between gap-4 py-3 border-t border-border"
		>
			<form.Field name="phone_number">
				{(field) => {
					const phoneError = isEditing ? getPhoneError(field.state.value.trim()) : null
					return (
						<div className="min-w-0 flex-1 space-y-1.5">
							<label htmlFor="account-phone" className="text-sm text-muted">
								Số điện thoại
							</label>
							<input
								id="account-phone"
								type="tel"
								inputMode="numeric"
								disabled={!isEditing}
								placeholder="VD: 0343062376"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								className={cn(
									inputClass,
									!isEditing && "bg-background text-muted cursor-default",
									phoneError && "border-destructive focus:border-destructive",
								)}
							/>
							<p className="text-xs text-subtle">Dùng để hỗ trợ và liên hệ khi cần.</p>
							{phoneError && <p className="text-xs font-bold text-destructive">{phoneError}</p>}
							{mutation.isError && !phoneError && (
								<p className="text-xs font-bold text-destructive">Số điện thoại không hợp lệ.</p>
							)}
						</div>
					)
				}}
			</form.Field>
			<div className="self-start mt-7 flex gap-2">
				{isEditing && (
					<button
						type="button"
						onClick={cancelEdit}
						className="btn btn-secondary text-sm font-bold px-4 py-2"
					>
						Hủy
					</button>
				)}
				{isEditing ? (
					<button
						type="submit"
						disabled={form.state.isSubmitting || mutation.isPending}
						className={cn(
							"btn btn-secondary text-sm font-bold px-4 py-2 whitespace-nowrap",
							(form.state.isSubmitting || mutation.isPending) && "opacity-50",
						)}
					>
						{mutation.isPending ? "Đang lưu..." : "Lưu"}
					</button>
				) : (
					<button
						type="button"
						onClick={(e) => {
							e.preventDefault()
							setIsEditing(true)
						}}
						className="btn btn-secondary text-sm font-bold px-4 py-2 whitespace-nowrap"
					>
						Chỉnh sửa
					</button>
				)}
			</div>
		</form>
	)
}
