import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { StaticIcon } from "#/components/Icon"
import { enrollCourse } from "#/features/course/actions"
import { EnrollFailurePopup } from "#/features/course/components/EnrollFailurePopup"
import { EnrollSuccessPopup } from "#/features/course/components/EnrollSuccessPopup"
import type { CourseWithRelations } from "#/features/course/types"
import { cn, formatNumber, formatVnd } from "#/lib/utils"

interface Props {
	open: boolean
	onClose: () => void
	course: CourseWithRelations
}

type Phase = "form" | "success" | "failure"

/**
 * 3-phase modal:
 *  - "form": tóm tắt giá + cam kết kỷ luật + checkbox agree → user thanh toán
 *  - "success": EnrollSuccessPopup (mascot vui + confetti)
 *  - "failure": EnrollFailurePopup (mascot buồn + retry)
 */
export function EnrollDialog({ open, onClose, course }: Props) {
	const [agreed, setAgreed] = useState(false)
	const [phase, setPhase] = useState<Phase>("form")
	const [errorMessage, setErrorMessage] = useState<string | undefined>()
	const queryClient = useQueryClient()
	const enroll = useMutation({
		mutationFn: () => enrollCourse(course.id),
		onSuccess: () => {
			// KHÔNG invalidate ngay — sẽ làm parent ($courseId) refetch → enrolled=true
			// → EnrollCard unmount → EnrollDialog unmount → SuccessPopup chưa kịp hiện.
			// Defer tới lúc user đóng popup (xem handleSuccessClose).
			setPhase("success")
		},
		onError: (e: Error) => {
			setErrorMessage(e.message || undefined)
			setPhase("failure")
		},
	})

	const handleSuccessClose = () => {
		queryClient.invalidateQueries({ queryKey: ["courses"] })
		queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] })
		onClose()
	}

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
			setPhase("form")
			setErrorMessage(undefined)
		}
	}, [open])

	if (!open || typeof document === "undefined") return null

	if (phase === "success") {
		return (
			<EnrollSuccessPopup
				open
				courseTitle={course.title}
				bonusCoins={course.bonus_coins}
				onClose={handleSuccessClose}
			/>
		)
	}

	if (phase === "failure") {
		return (
			<EnrollFailurePopup
				open
				message={errorMessage}
				loading={enroll.isPending}
				onClose={onClose}
				onRetry={() => enroll.mutate()}
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
					<svg
						viewBox="0 0 16 16"
						className="size-4"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.2"
						strokeLinecap="round"
						aria-hidden="true"
					>
						<path d="M3 3l10 10M13 3L3 13" />
					</svg>
				</button>

				<div className="space-y-5 p-6">
					<div>
						<h2 className="text-lg font-extrabold text-foreground">Đăng ký khóa học</h2>
						<p className="mt-1 text-sm text-muted">
							Thanh toán một lần cho toàn khóa. Khóa học có hiệu lực đến hết ngày kết thúc.
						</p>
					</div>

					<div className="space-y-3 rounded-(--radius-card) border-2 border-border p-4">
						<div>
							<p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">Khóa học</p>
							<p className="mt-1 font-extrabold text-foreground">{course.title}</p>
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

						<div className="flex items-center justify-between gap-2 border-t-2 border-border pt-3">
							<span className="text-sm">Tổng thanh toán</span>
							<span className="text-lg font-extrabold tabular-nums">{formatVnd(course.price_vnd)}</span>
						</div>

						{savings > 0 && (
							<div className="flex items-center justify-between rounded-(--radius-button) bg-success/10 px-3 py-2 text-sm">
								<span className="font-bold text-success">Bạn tiết kiệm</span>
								<span className="font-extrabold text-success tabular-nums">{formatVnd(savings)}</span>
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

					<div className="space-y-3 rounded-(--radius-card) border-2 border-warning/30 bg-warning-tint/40 p-4">
						<p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-warning">
							<svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden="true">
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
						<label className="flex cursor-pointer items-start gap-2">
							<input
								type="checkbox"
								checked={agreed}
								onChange={(e) => setAgreed(e.target.checked)}
								disabled={enroll.isPending}
								className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary"
							/>
							<span className="text-sm text-foreground">
								Tôi đã đọc và đồng ý với điều khoản kỷ luật của khóa học.
							</span>
						</label>
					</div>

					<div className="flex justify-end gap-2.5">
						<button
							type="button"
							onClick={onClose}
							disabled={enroll.isPending}
							className="rounded-(--radius-button) border-2 border-b-4 border-border bg-surface px-5 py-2.5 text-sm font-extrabold text-foreground transition-all hover:border-primary/40 active:translate-y-[2px] active:border-b-2 disabled:opacity-50"
						>
							Hủy
						</button>
						<button
							type="button"
							onClick={() => enroll.mutate()}
							disabled={!agreed || enroll.isPending}
							className={cn(
								"rounded-(--radius-button) border-2 border-b-4 border-primary-dark bg-primary px-5 py-2.5 text-sm font-extrabold text-primary-foreground transition-all hover:brightness-110 active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-50",
							)}
						>
							{enroll.isPending ? "Đang xử lý…" : `Thanh toán ${formatVnd(course.price_vnd)}`}
						</button>
					</div>
				</div>
			</div>
		</div>,
		document.body,
	)
}
