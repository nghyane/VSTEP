import { useEffect } from "react"
import { createPortal } from "react-dom"
import { useAuth } from "#/lib/auth"

/**
 * Hiển thị khi user đăng nhập bằng tài khoản admin/teacher/staff vào trang
 * user. Mount global ở __root.tsx, subscribe `roleRejected` state — auth
 * store đã clear token, dialog chỉ là báo lỗi UX cho có mặt Lạc.
 */
const ROLE_LABELS: Record<string, string> = {
	admin: "Quản trị viên",
	staff: "Nhân viên",
	teacher: "Giáo viên",
}

export function RoleRejectedDialog() {
	const rejected = useAuth((s) => s.roleRejected)
	const dismiss = useAuth((s) => s.dismissRoleRejected)

	useEffect(() => {
		if (!rejected) return
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss()
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [rejected, dismiss])

	if (!rejected || typeof document === "undefined") return null

	const roleLabel = ROLE_LABELS[rejected.role] ?? rejected.role

	return createPortal(
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-[fadeIn_220ms_ease-out]"
			role="dialog"
			aria-modal="true"
			aria-label="Tài khoản không dành cho trang học viên"
		>
			<div className="card relative w-full max-w-md overflow-hidden text-center animate-[popIn_400ms_cubic-bezier(0.34,1.56,0.64,1)]">
				<div className="relative overflow-hidden bg-gradient-to-b from-destructive-tint to-transparent px-8 pb-3 pt-12">
					<p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-destructive">
						Sai trang đăng nhập
					</p>
					<h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
						Tài khoản không phải học viên
					</h2>
					<p className="mt-2 text-sm text-subtle">
						<span className="font-bold text-foreground">{rejected.email}</span> là tài khoản{" "}
						<span className="font-bold text-destructive">{roleLabel}</span> — không thể đăng nhập vào trang
						học viên.
					</p>
				</div>

				<div className="relative mx-auto flex h-48 w-48 items-center justify-center">
					<span aria-hidden className="absolute h-32 w-32 rounded-full bg-destructive/10 blur-xl" />
					<span
						aria-hidden
						className="pointer-events-none absolute left-1/2 top-12 size-2 -translate-x-1/2 rounded-full bg-info opacity-0 animate-[tearDrop_2.4s_ease-in_700ms_infinite]"
					/>
					<img
						src="/mascot/lac-sad.png"
						alt=""
						className="relative h-40 w-auto drop-shadow-[0_6px_0_rgba(234,67,53,0.15)]"
						style={{
							animation:
								"mascotSadShake 600ms ease-in-out 200ms 1, mascotSadSway 3.4s ease-in-out 800ms infinite",
						}}
					/>
				</div>

				<div className="space-y-2 px-8 pb-7 pt-2">
					<p className="text-xs leading-relaxed text-muted">
						Vui lòng đăng nhập vào trang quản trị riêng nếu bạn là {roleLabel.toLowerCase()}, hoặc dùng tài
						khoản học viên để truy cập trang này.
					</p>
					<button
						type="button"
						onClick={dismiss}
						className="btn btn-primary mt-2 w-full py-3.5 text-base font-extrabold uppercase tracking-wide"
					>
						Đã hiểu
					</button>
				</div>
			</div>
		</div>,
		document.body,
	)
}
