import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import { signalTopupReturn } from "#/features/wallet/topup-pending"

type PaymentReturnState = "paid" | "confirming" | "cancelled"
type PaymentReturnClient = "web" | "mobile"
type PaymentReturnFlow = "topup" | "course"

export const Route = createFileRoute("/wallet")({
	validateSearch: (
		s: Record<string, unknown>,
	): {
		code?: string
		id?: string
		cancel?: boolean
		status?: string
		orderCode?: string
		client?: PaymentReturnClient
		flow?: PaymentReturnFlow
		courseId?: string
	} => ({
		code: typeof s.code === "string" ? s.code : undefined,
		id: typeof s.id === "string" ? s.id : undefined,
		cancel: s.cancel === true || s.cancel === "true" ? true : undefined,
		status: typeof s.status === "string" ? s.status : undefined,
		orderCode: typeof s.orderCode === "string" ? s.orderCode : undefined,
		client: s.client === "mobile" || s.client === "web" ? s.client : undefined,
		flow: s.flow === "course" || s.flow === "topup" ? s.flow : undefined,
		courseId: typeof s.courseId === "string" ? s.courseId : undefined,
	}),
	component: PaymentReturnPage,
})

function PaymentReturnPage() {
	const search = Route.useSearch()
	const state = getPaymentReturnState(search)
	const isPaid = state === "paid"
	const isConfirming = state === "confirming"
	const client = search.client ?? "web"
	const flow = search.flow ?? "topup"
	const isMobileReturn = client === "mobile"
	const appReturnUrl = buildAppReturnUrl(search)
	const closeTab = () => window.close()

	useEffect(() => {
		if (!search.id) return
		signalTopupReturn(search.id, search.status)
	}, [search.id, search.status])

	return (
		<main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
			<section className="card w-full max-w-lg p-8 text-center md:p-10">
				<div
					className={`mx-auto flex size-20 items-center justify-center rounded-full text-4xl font-extrabold ${
						isPaid
							? "bg-success/10 text-success"
							: isConfirming
								? "bg-primary-tint text-primary"
								: "bg-destructive/10 text-destructive"
					}`}
				>
					{isPaid ? "✓" : isConfirming ? "…" : "!"}
				</div>

				<h1 className="mt-6 text-2xl font-extrabold text-foreground">
					{isPaid
						? "Thanh toán thành công"
						: isConfirming
							? "Đang xác nhận thanh toán"
							: "Thanh toán chưa hoàn tất"}
				</h1>
				<p className="mt-3 text-sm leading-relaxed text-muted">
					{isPaid
						? getPaidMessage(flow, isMobileReturn)
						: isConfirming
							? getConfirmingMessage(isMobileReturn)
							: getCancelledMessage(isMobileReturn)}
				</p>

				<dl className="mt-6 space-y-2 rounded-(--radius-card) border-2 border-border bg-background p-4 text-left text-xs">
					<InfoRow
						label="Trạng thái trả về"
						value={search.status ?? (isConfirming ? "PENDING_CALLBACK" : "CANCELLED")}
					/>
					<InfoRow label="Mã đơn" value={search.orderCode} />
					<InfoRow label="Mã giao dịch" value={search.id} />
				</dl>

				<div className="mt-7 space-y-3">
					<div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
						{isMobileReturn ? (
							<>
								<a href={appReturnUrl} className="btn btn-primary w-full sm:w-auto">
									Mở VSTEP GO
								</a>
								<button type="button" onClick={closeTab} className="btn btn-primary w-full sm:w-auto">
									Đóng tab này
								</button>
							</>
						) : (
							<>
								<a href={buildWebReturnUrl(search)} className="btn btn-primary w-full sm:w-auto">
									{flow === "course" ? "Về khóa học" : "Về ví"}
								</a>
								<a href="/dashboard" className="btn btn-ghost w-full sm:w-auto">
									Về trang chủ
								</a>
							</>
						)}
					</div>
					<p className="text-xs text-subtle">
						{isMobileReturn
							? "Nếu trình duyệt không cho đóng tự động, hãy đóng tab này thủ công và quay lại ứng dụng."
							: "Bạn có thể quay lại trang web để tiếp tục học sau khi hệ thống cập nhật thanh toán."}
					</p>
				</div>
			</section>
		</main>
	)
}

function InfoRow({ label, value }: { label: string; value: string | undefined }) {
	return (
		<div className="flex items-start justify-between gap-4">
			<dt className="font-bold text-subtle">{label}</dt>
			<dd className="break-all text-right font-mono text-foreground">{value ?? "-"}</dd>
		</div>
	)
}

function getPaymentReturnState(search: { cancel?: boolean; status?: string }): PaymentReturnState {
	const status = search.status?.toUpperCase()
	if (search.cancel || status === "CANCELLED" || status === "FAILED") return "cancelled"
	if (status === "PAID") return "paid"
	return "confirming"
}

function buildAppReturnUrl(search: {
	id?: string
	status?: string
	orderCode?: string
	cancel?: boolean
	flow?: PaymentReturnFlow
	courseId?: string
}) {
	const params = new URLSearchParams()
	if (search.id) params.set("id", search.id)
	if (search.status) params.set("status", search.status)
	if (search.orderCode) params.set("orderCode", search.orderCode)
	if (search.cancel) params.set("cancel", "true")
	if (search.courseId) params.set("courseId", search.courseId)
	const query = params.toString()
	return `vstep://${search.flow === "course" ? "course-payment" : "topup"}${query ? `?${query}` : ""}`
}

function buildWebReturnUrl(search: { flow?: PaymentReturnFlow; courseId?: string }) {
	if (search.flow === "course") return search.courseId ? `/khoa-hoc/${search.courseId}` : "/khoa-hoc"
	return "/dashboard"
}

function getPaidMessage(flow: PaymentReturnFlow, isMobileReturn: boolean) {
	const target = flow === "course" ? "khóa học" : "ví"
	return isMobileReturn
		? `PayOS đã trả về trạng thái thanh toán thành công. Hãy mở VSTEP GO để hệ thống xác nhận và cập nhật ${target}.`
		: `PayOS đã trả về trạng thái thanh toán thành công. Hệ thống sẽ xác nhận và cập nhật ${target} trong giây lát.`
}

function getConfirmingMessage(isMobileReturn: boolean) {
	return isMobileReturn
		? "Kết quả cuối cùng sẽ được backend cập nhật qua callback bảo mật từ PayOS. Hãy mở VSTEP GO để kiểm tra lại."
		: "Kết quả cuối cùng sẽ được backend cập nhật qua callback bảo mật từ PayOS. Bạn có thể quay lại trang web để tiếp tục."
}

function getCancelledMessage(isMobileReturn: boolean) {
	return isMobileReturn
		? "Giao dịch đã bị hủy hoặc chưa được PayOS xác nhận thành công. Hãy mở VSTEP GO để tạo giao dịch mới nếu cần."
		: "Giao dịch đã bị hủy hoặc chưa được PayOS xác nhận thành công. Bạn có thể quay lại trang web để thử lại."
}
