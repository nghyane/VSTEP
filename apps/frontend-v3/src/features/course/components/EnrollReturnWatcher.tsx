import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { EnrollFailurePopup } from "#/features/course/components/EnrollFailurePopup"
import { clearPendingEnrollmentOrder, readPendingEnrollmentOrder } from "#/features/course/enroll-pending"
import { courseDetailQuery } from "#/features/course/queries"
import { TOPUP_RETURN_SIGNAL_KEY } from "#/features/wallet/topup-pending"

type PaymentReturnSignal = { status: string | null; at: number }

/**
 * Sau khi user thanh toán enroll qua PayOS (tab mới) và quay lại, watcher này
 * kiểm tra trạng thái đơn đang chờ rồi hiện popup thành công/thất bại. Mirror
 * cơ chế topup trong Header — dùng chung TOPUP_RETURN_SIGNAL_KEY vì return_url
 * của cả hai luồng đều là /wallet.
 */
export function EnrollReturnWatcher() {
	const queryClient = useQueryClient()
	const [failureOpen, setFailureOpen] = useState(false)
	const checkingRef = useRef(false)
	const retryTimerRef = useRef<number | null>(null)

	useEffect(() => {
		function clearRetryTimer() {
			if (retryTimerRef.current === null) return
			window.clearTimeout(retryTimerRef.current)
			retryTimerRef.current = null
		}

		function clearPaidEnrollment(pending: NonNullable<ReturnType<typeof readPendingEnrollmentOrder>>) {
			clearRetryTimer()
			clearPendingEnrollmentOrder(pending.orderId)
			void queryClient.invalidateQueries({ queryKey: ["courses"] })
			void queryClient.invalidateQueries({ queryKey: ["courses", pending.courseId] })
		}

		async function isCourseEnrolled(courseId: string) {
			await queryClient.invalidateQueries({ queryKey: ["courses", courseId] })
			const detail = await queryClient.fetchQuery(courseDetailQuery(courseId))
			const commitment = detail.data.commitment
			return commitment !== null && commitment.phase !== "not_enrolled"
		}

		function readPaymentReturnSignal(): PaymentReturnSignal | null {
			try {
				const raw = window.localStorage.getItem(TOPUP_RETURN_SIGNAL_KEY)
				if (!raw) return null
				const parsed = JSON.parse(raw) as Record<string, unknown>
				return {
					status: typeof parsed.status === "string" ? parsed.status : null,
					at: typeof parsed.at === "number" ? parsed.at : 0,
				}
			} catch {
				return null
			}
		}

		function returnedFromPayment(signal: PaymentReturnSignal | null) {
			if (!signal) return false
			return Date.now() - signal.at < 2 * 60 * 1000
		}

		function scheduleRetry() {
			const pending = readPendingEnrollmentOrder()
			if (!pending) return
			if (Date.now() - pending.createdAt > 2 * 60 * 1000) return
			clearRetryTimer()
			retryTimerRef.current = window.setTimeout(() => void checkPendingEnrollment(), 1500)
		}

		async function checkPendingEnrollment() {
			if (checkingRef.current) return
			const pending = readPendingEnrollmentOrder()
			if (!pending) return
			const signal = readPaymentReturnSignal()
			const status = signal?.status?.toUpperCase()

			checkingRef.current = true
			try {
				if (await isCourseEnrolled(pending.courseId)) {
					clearPaidEnrollment(pending)
					return
				}

				if (status && ["FAILED", "CANCELLED", "EXPIRED"].includes(status)) {
					clearRetryTimer()
					clearPendingEnrollmentOrder(pending.orderId)
					setFailureOpen(true)
					return
				}

				if (status === "PAID" || returnedFromPayment(signal)) scheduleRetry()
			} catch {
				// Giữ pending order để lần focus/return signal sau thử lại.
				if (status === "PAID" || returnedFromPayment(signal)) scheduleRetry()
			} finally {
				checkingRef.current = false
			}
		}

		const onFocus = () => void checkPendingEnrollment()
		const onVisibilityChange = () => {
			if (document.visibilityState === "visible") void checkPendingEnrollment()
		}
		const onStorage = (event: StorageEvent) => {
			if (event.key === TOPUP_RETURN_SIGNAL_KEY) void checkPendingEnrollment()
		}

		void checkPendingEnrollment()
		window.addEventListener("focus", onFocus)
		document.addEventListener("visibilitychange", onVisibilityChange)
		window.addEventListener("storage", onStorage)
		return () => {
			clearRetryTimer()
			window.removeEventListener("focus", onFocus)
			document.removeEventListener("visibilitychange", onVisibilityChange)
			window.removeEventListener("storage", onStorage)
		}
	}, [queryClient])

	return <EnrollFailurePopup open={failureOpen} onClose={() => setFailureOpen(false)} />
}
