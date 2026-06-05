import { useMutation, useQueryClient } from "@tanstack/react-query"
import { HTTPError } from "ky"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Icon, StaticIcon } from "#/components/Icon"
import { ScrollArea } from "#/components/ScrollArea"
import { createEnrollmentOrder } from "#/features/course/actions"
import { EnrollFailurePopup } from "#/features/course/components/EnrollFailurePopup"
import { SignaturePadField, type SignaturePadFieldRef } from "#/features/course/components/SignaturePadField"
import type { CourseWithRelations } from "#/features/course/types"
import { useSession } from "#/lib/auth"
import { formatNumber, formatVnd } from "#/lib/utils"

interface Props {
	open: boolean
	onClose: () => void
	course: CourseWithRelations
}

type Phase = "form" | "failure"

/**
 * 2-phase modal:
 *  - "form": tóm tắt giá + cam kết kỷ luật + checkbox agree → user thanh toán
 *  - "failure": EnrollFailurePopup (mascot buồn + retry)
 */
export function EnrollDialog({ open, onClose, course }: Props) {
	const { profile } = useSession()
	const [agreed, setAgreed] = useState(false)
	const [signatureEmpty, setSignatureEmpty] = useState(true)
	const signatureRef = useRef<SignaturePadFieldRef>(null)
	const [phase, setPhase] = useState<Phase>("form")
	const [errorMessage, setErrorMessage] = useState<string | undefined>()
	const queryClient = useQueryClient()
	const enroll = useMutation({
		mutationFn: () => {
			const signature = signatureRef.current?.getSvg()
			if (!signature) throw new Error("Vui lòng ký xác nhận cam kết trước khi thanh toán.")

			return createEnrollmentOrder(course.id, signature)
		},
		onSuccess: (order) => {
			if (order.payment_url) {
				const paymentWindow = window.open(order.payment_url, "_blank")
				if (paymentWindow) paymentWindow.opener = null
				onClose()
				if (!paymentWindow) window.location.href = order.payment_url
				return
			}
			setErrorMessage("Không tạo được liên kết thanh toán. Vui lòng thử lại.")
			setPhase("failure")
		},
		onError: (e: unknown) => {
			if (e instanceof HTTPError) {
				setErrorMessage(e.message)
			} else if (e instanceof Error) {
				setErrorMessage(e.message)
			} else {
				setErrorMessage("Đã có lỗi xảy ra. Vui lòng thử lại.")
			}
			setPhase("failure")
		},
	})

	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !enroll.isPending) onClose()
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [open, onClose, enroll.isPending])

	useEffect(() => {
		if (!open) {
			setAgreed(false)
			setSignatureEmpty(true)
			setPhase("form")
			setErrorMessage(undefined)
		}
	}, [open])

	if (!open || typeof document === "undefined") return null

	if (phase === "failure") {
		return (
			<EnrollFailurePopup
				open
				message={errorMessage}
				loading={enroll.isPending}
				onClose={() => {
					queryClient.invalidateQueries({ queryKey: ["courses"] })
					onClose()
				}}
				onRetry={() => {
					setErrorMessage(undefined)
					setSignatureEmpty(true)
					setPhase("form")
				}}
			/>
		)
	}

	const orig = course.original_price_vnd
	const hasDiscount = orig !== null && orig > course.price_vnd
	const discountPct = hasDiscount ? Math.round((1 - course.price_vnd / orig) * 100) : 0
	const savings = hasDiscount && orig !== null ? orig - course.price_vnd : 0

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-6">
			<button
				type="button"
				aria-label="Đóng"
				onClick={enroll.isPending ? undefined : onClose}
				className="absolute inset-0 bg-foreground/45 backdrop-blur-sm"
			/>
			<div className="relative w-full max-w-xl overflow-hidden rounded-(--radius-card) border-2 border-b-4 border-border bg-card shadow-[0_12px_28px_rgb(0_0_0_/_0.18)] animate-[slideIn_0.18s_ease-out]">
				<button
					type="button"
					onClick={onClose}
					disabled={enroll.isPending}
					aria-label="Đóng"
					className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground disabled:opacity-50"
				>
					<Icon name="close" size="xs" />
				</button>

				<ScrollArea maxHeight="calc(100vh - 96px)">
					<div className="space-y-5 p-6">
						<div>
							<h2 className="text-lg font-extrabold text-foreground">Đăng ký khóa học</h2>
							<p className="mt-1 text-sm text-muted">
								Thanh toán một lần cho toàn khóa. Khóa học có hiệu lực đến hết ngày kết thúc.
							</p>
						</div>

						<div className="space-y-3">
							<div>
								<p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">Khóa học</p>
								<p className="mt-1 font-extrabold text-foreground">{course.title}</p>
							</div>

							<div className="flex items-center justify-between gap-2 text-sm">
								<span className="text-muted">Hồ sơ đăng ký</span>
								<span className="font-bold text-foreground">
									{profile.nickname} — {profile.target_level}
								</span>
							</div>

							<div className="flex items-center justify-between gap-2 text-sm">
								<span className="text-muted">Giá niêm yết</span>
								<span className="flex items-center gap-2">
									{hasDiscount && orig !== null ? (
										<>
											<span className="text-muted line-through tabular-nums">{formatVnd(orig)}</span>
											<span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-extrabold text-destructive">
												-{discountPct}%
											</span>
										</>
									) : (
										<span className="font-bold tabular-nums">{formatVnd(course.price_vnd)}</span>
									)}
								</span>
							</div>

							<div className="flex items-center justify-between gap-2 pt-1">
								<span className="text-sm">Tổng thanh toán</span>
								<span className="text-lg font-extrabold tabular-nums">{formatVnd(course.price_vnd)}</span>
							</div>

							{savings > 0 && (
								<div className="flex items-center justify-between rounded-(--radius-button) bg-primary-tint px-3 py-2 text-sm">
									<span className="font-bold text-primary-dark">Bạn tiết kiệm</span>
									<span className="font-extrabold text-primary-dark tabular-nums">{formatVnd(savings)}</span>
								</div>
							)}

							{course.bonus_coins > 0 && (
								<div className="flex items-center justify-between rounded-(--radius-button) bg-coin-tint px-3 py-2 text-sm">
									<span className="font-bold text-coin-dark">Xu tặng kèm</span>
									<span className="inline-flex items-center gap-1 font-extrabold text-coin-dark tabular-nums">
										<StaticIcon name="coin" size="xs" className="h-3.5 w-auto" />+
										{formatNumber(course.bonus_coins)} xu
									</span>
								</div>
							)}
						</div>

						<div className="space-y-3 rounded-(--radius-card) bg-warning-tint p-4">
							<p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-foreground">
								<svg
									viewBox="0 0 24 24"
									className="size-3.5 text-warning"
									fill="currentColor"
									aria-hidden="true"
								>
									<path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" />
								</svg>
								Cam kết kỷ luật
							</p>
							<p className="text-sm leading-relaxed text-foreground">
								Để giữ cam kết đầu ra, bạn cần hoàn thành tối thiểu{" "}
								<span className="font-extrabold">{course.required_full_tests} bài thi full-test</span> trong{" "}
								<span className="font-extrabold">{course.commitment_window_days} ngày đầu</span> của khóa. Vi
								phạm sẽ dẫn tới việc <span className="font-extrabold">khóa quyền truy cập khóa học</span>.
							</p>

							{course.rules && (
								<div className="space-y-1.5 rounded-(--radius-button) bg-warning-tint/60 p-3">
									<p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-foreground">
										Nội quy khóa
									</p>
									<p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
										{course.rules}
									</p>
								</div>
							)}
							<label className="flex cursor-pointer items-start gap-2">
								<input
									type="checkbox"
									checked={agreed}
									onChange={(e) => {
										setAgreed(e.target.checked)
										if (!e.target.checked) {
											signatureRef.current?.clear()
											setSignatureEmpty(true)
										}
									}}
									disabled={enroll.isPending}
									className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary"
								/>
								<span className="text-sm text-foreground">
									Tôi đã đọc và đồng ý với điều khoản kỷ luật của khóa học.
								</span>
							</label>

							{agreed && (
								<div className="space-y-2 animate-[slideIn_0.18s_ease-out]">
									<p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-foreground">
										Ký xác nhận
									</p>
									<SignaturePadField
										ref={signatureRef}
										disabled={enroll.isPending}
										onChange={setSignatureEmpty}
									/>
								</div>
							)}
						</div>

						<div className="flex justify-end gap-2.5">
							<button
								type="button"
								onClick={onClose}
								disabled={enroll.isPending}
								className="btn btn-secondary text-sm disabled:opacity-50"
							>
								Hủy
							</button>
							<button
								type="button"
								onClick={() => enroll.mutate()}
								disabled={!agreed || signatureEmpty || enroll.isPending}
								className="btn btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-50"
							>
								{enroll.isPending
									? "Đang chuyển đến cổng thanh toán…"
									: `Thanh toán ${formatVnd(course.price_vnd)}`}
							</button>
						</div>
					</div>
				</ScrollArea>
			</div>
		</div>,
		document.body,
	)
}
