import { useMutation } from "@tanstack/react-query"
import { HTTPError } from "ky"
import { type FormEvent, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { inputClass } from "#/features/auth/styles"
import { changePassword } from "#/features/profile/actions"
import { useToast } from "#/lib/toast"
import { cn } from "#/lib/utils"

interface Props {
	open: boolean
	onClose: () => void
}

interface FieldErrors {
	current_password?: string
	new_password?: string
	confirm?: string
}

export function ChangePasswordDialog({ open, onClose }: Props) {
	const [current, setCurrent] = useState("")
	const [next, setNext] = useState("")
	const [confirm, setConfirm] = useState("")
	const [showCurrent, setShowCurrent] = useState(false)
	const [showNext, setShowNext] = useState(false)
	const [errors, setErrors] = useState<FieldErrors>({})

	function reset() {
		setCurrent("")
		setNext("")
		setConfirm("")
		setShowCurrent(false)
		setShowNext(false)
		setErrors({})
	}

	const mutation = useMutation({
		mutationFn: changePassword,
		onSuccess: () => {
			useToast.getState().add("Đã đổi mật khẩu thành công.", "success")
			reset()
			onClose()
		},
		onError: (err) => {
			const out: FieldErrors = {}
			if (err instanceof HTTPError) {
				const body = err.data as { errors?: Record<string, string[]>; message?: string } | undefined
				const e = body?.errors ?? {}
				if (e.current_password?.[0]) out.current_password = e.current_password[0]
				if (e.new_password?.[0]) out.new_password = e.new_password[0]
				if (!out.current_password && !out.new_password) {
					out.current_password = body?.message ?? "Không đổi được mật khẩu."
				}
			} else {
				out.current_password = "Không đổi được mật khẩu."
			}
			setErrors(out)
		},
	})

	const isPending = mutation.isPending

	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !isPending) onClose()
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [open, isPending, onClose])

	useEffect(() => {
		if (open) return
		setCurrent("")
		setNext("")
		setConfirm("")
		setShowCurrent(false)
		setShowNext(false)
		setErrors({})
	}, [open])

	function handleClose() {
		if (isPending) return
		reset()
		onClose()
	}

	function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		const next_errors: FieldErrors = {}
		if (current.length < 1) next_errors.current_password = "Nhập mật khẩu hiện tại."
		if (next.length < 8) next_errors.new_password = "Mật khẩu mới tối thiểu 8 ký tự."
		else if (next === current) next_errors.new_password = "Mật khẩu mới phải khác mật khẩu hiện tại."
		if (confirm !== next) next_errors.confirm = "Mật khẩu nhập lại không khớp."
		if (Object.keys(next_errors).length > 0) {
			setErrors(next_errors)
			return
		}
		setErrors({})
		mutation.mutate({ current_password: current, new_password: next })
	}

	if (!open || typeof document === "undefined") return null

	return createPortal(
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Đổi mật khẩu"
			onClick={handleClose}
			onKeyDown={(e) => {
				if (e.key === "Escape" && !isPending) onClose()
			}}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_200ms_ease-out]"
		>
			<form
				onClick={(e) => e.stopPropagation()}
				onSubmit={handleSubmit}
				className="card relative w-full max-w-md bg-surface text-left overflow-hidden animate-[popIn_300ms_cubic-bezier(0.34,1.56,0.64,1)]"
			>
				<button
					type="button"
					onClick={handleClose}
					aria-label="Đóng"
					className="absolute top-4 right-4 size-8 rounded-full hover:bg-background flex items-center justify-center text-muted transition z-10 text-xl leading-none"
				>
					×
				</button>

				<div className="bg-gradient-to-b from-primary-tint to-transparent px-6 pt-8 pb-6 text-center">
					<div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
						<LockIcon className="size-8" />
					</div>
					<h3 className="font-extrabold text-xl text-foreground">Đổi mật khẩu</h3>
					<p className="text-xs text-subtle mt-1">Bảo vệ tài khoản — chỉ bạn biết mật khẩu mới.</p>
				</div>

				<div className="px-6 pb-6 space-y-5">
					<PasswordField
						id="current_password"
						label="Mật khẩu hiện tại"
						value={current}
						onChange={(v) => {
							setCurrent(v)
							if (errors.current_password) setErrors((s) => ({ ...s, current_password: undefined }))
						}}
						show={showCurrent}
						onToggleShow={() => setShowCurrent((v) => !v)}
						error={errors.current_password}
						autoComplete="current-password"
					/>

					<PasswordField
						id="new_password"
						label="Mật khẩu mới"
						value={next}
						onChange={(v) => {
							setNext(v)
							if (errors.new_password) setErrors((s) => ({ ...s, new_password: undefined }))
						}}
						show={showNext}
						onToggleShow={() => setShowNext((v) => !v)}
						error={errors.new_password}
						hint="Tối thiểu 8 ký tự, khác mật khẩu hiện tại."
						autoComplete="new-password"
					/>

					<PasswordField
						id="confirm_password"
						label="Nhập lại mật khẩu mới"
						value={confirm}
						onChange={(v) => {
							setConfirm(v)
							if (errors.confirm) setErrors((s) => ({ ...s, confirm: undefined }))
						}}
						show={showNext}
						onToggleShow={() => setShowNext((v) => !v)}
						error={errors.confirm}
						autoComplete="new-password"
					/>

					<div className="flex gap-3 pt-2">
						<button
							type="button"
							onClick={handleClose}
							disabled={mutation.isPending}
							className="btn btn-secondary flex-1"
						>
							Hủy
						</button>
						<button
							type="submit"
							disabled={mutation.isPending}
							className={cn("btn btn-primary flex-1", mutation.isPending && "opacity-50")}
						>
							{mutation.isPending ? "Đang lưu..." : "Đổi mật khẩu"}
						</button>
					</div>
				</div>
			</form>
		</div>,
		document.body,
	)
}

function PasswordField({
	id,
	label,
	value,
	onChange,
	show,
	onToggleShow,
	error,
	hint,
	autoComplete,
}: {
	id: string
	label: string
	value: string
	onChange: (v: string) => void
	show: boolean
	onToggleShow: () => void
	error?: string
	hint?: string
	autoComplete?: string
}) {
	return (
		<div>
			<label htmlFor={id} className="block text-xs font-extrabold uppercase tracking-wider text-muted mb-1.5">
				{label}
			</label>
			<div className="relative">
				<input
					id={id}
					type={show ? "text" : "password"}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					autoComplete={autoComplete}
					className={cn(inputClass, "pr-12", error && "border-destructive")}
					aria-invalid={!!error}
				/>
				<button
					type="button"
					onClick={onToggleShow}
					aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
					className="absolute right-2 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center rounded-full text-muted hover:bg-background transition"
				>
					{show ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
				</button>
			</div>
			{error ? (
				<p className="text-xs font-bold text-destructive mt-1.5">{error}</p>
			) : hint ? (
				<p className="text-xs text-subtle mt-1.5">{hint}</p>
			) : null}
		</div>
	)
}

function LockIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.4"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden
		>
			<title>Lock</title>
			<rect x="4" y="11" width="16" height="10" rx="2.5" />
			<path d="M8 11V8a4 4 0 0 1 8 0v3" />
		</svg>
	)
}

function EyeIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden
		>
			<title>Hiện mật khẩu</title>
			<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	)
}

function EyeOffIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden
		>
			<title>Ẩn mật khẩu</title>
			<path d="m3 3 18 18" />
			<path d="M10.6 6.1A10 10 0 0 1 12 6c6.5 0 10 7 10 7a16.4 16.4 0 0 1-3 3.9" />
			<path d="M6.6 6.6A16.4 16.4 0 0 0 2 13s3.5 7 10 7c1.7 0 3.2-.4 4.5-1" />
			<path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
		</svg>
	)
}
