import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { getEnrollmentOrderStatus } from "#/features/course/actions"
import { EnrollFailurePopup } from "#/features/course/components/EnrollFailurePopup"
import { EnrollSuccessPopup } from "#/features/course/components/EnrollSuccessPopup"
import { clearPendingEnrollmentOrder, readPendingEnrollmentOrder } from "#/features/course/enroll-pending"
import { TOPUP_RETURN_SIGNAL_KEY } from "#/features/wallet/topup-pending"

type EnrollResult = { kind: "success"; courseTitle: string; bonusCoins: number } | { kind: "failure" }

/**
 * Sau khi user thanh toán enroll qua PayOS (tab mới) và quay lại, watcher này
 * kiểm tra trạng thái đơn đang chờ rồi hiện popup thành công/thất bại. Mirror
 * cơ chế topup trong Header — dùng chung TOPUP_RETURN_SIGNAL_KEY vì return_url
 * của cả hai luồng đều là /wallet.
 */
export function EnrollReturnWatcher() {
	const queryClient = useQueryClient()
	const [result, setResult] = useState<EnrollResult | null>(null)
	const checkingRef = useRef(false)

	useEffect(() => {
		async function checkPendingEnrollment() {
			if (checkingRef.current) return
			const pending = readPendingEnrollmentOrder()
			if (!pending) return

			checkingRef.current = true
			try {
				const order = await getEnrollmentOrderStatus(pending.orderId)
				if (!order) return

				if (order.status === "paid") {
					clearPendingEnrollmentOrder(pending.orderId)
					setResult({
						kind: "success",
						courseTitle: order.course_title ?? pending.courseTitle,
						bonusCoins: pending.bonusCoins,
					})
					void queryClient.invalidateQueries({ queryKey: ["courses"] })
					void queryClient.invalidateQueries({ queryKey: ["courses", pending.courseId] })
					return
				}

				if (["failed", "cancelled", "expired"].includes(order.status)) {
					clearPendingEnrollmentOrder(pending.orderId)
					setResult({ kind: "failure" })
				}
			} catch {
				// Giữ pending order để lần focus/return signal sau thử lại.
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
			window.removeEventListener("focus", onFocus)
			document.removeEventListener("visibilitychange", onVisibilityChange)
			window.removeEventListener("storage", onStorage)
		}
	}, [queryClient])

	if (result === null) return null

	if (result.kind === "success") {
		return (
			<EnrollSuccessPopup
				open
				courseTitle={result.courseTitle}
				bonusCoins={result.bonusCoins}
				onClose={() => setResult(null)}
			/>
		)
	}

	return <EnrollFailurePopup open onClose={() => setResult(null)} />
}
