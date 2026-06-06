import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

type PaymentReturnState = "paid" | "confirming" | "cancelled"
type PaymentReturnFlow = "topup" | "course"

export const Route = createFileRoute("/payos/mobile-return")({
	validateSearch: (
		s: Record<string, unknown>,
	): {
		code?: string
		id?: string
		cancel?: boolean
		status?: string
		orderCode?: string
		flow?: PaymentReturnFlow
		courseId?: string
	} => ({
		code: typeof s.code === "string" ? s.code : undefined,
		id: typeof s.id === "string" ? s.id : undefined,
		cancel: s.cancel === true || s.cancel === "true" ? true : undefined,
		status: typeof s.status === "string" ? s.status : undefined,
		orderCode: typeof s.orderCode === "string" ? s.orderCode : undefined,
		flow: s.flow === "course" || s.flow === "topup" ? s.flow : undefined,
		courseId: typeof s.courseId === "string" ? s.courseId : undefined,
	}),
	component: MobilePayosReturnPage,
})

function MobilePayosReturnPage() {
	const search = Route.useSearch()
	const state = getPaymentReturnState(search)
	const isPaid = state === "paid"
	const isConfirming = state === "confirming"
	const flow = search.flow ?? "topup"
	const appReturnUrl = buildAppReturnUrl(search)

	useEffect(() => {
		const timer = window.setTimeout(() => {
			window.location.href = appReturnUrl
		}, 600)
		return () => window.clearTimeout(timer)
	}, [appReturnUrl])

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
						? getPaidMessage(flow)
						: isConfirming
							? "Kết quả cuối cùng sẽ được backend cập nhật qua callback bảo mật từ PayOS. Hãy quay về VSTEP GO để kiểm tra lại."
							: "Giao dịch đã bị hủy hoặc chưa được PayOS xác nhận thành công. Hãy quay về VSTEP GO để tạo giao dịch mới nếu cần."}
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
					<a href={appReturnUrl} className="btn btn-primary w-full sm:w-auto">
						Quay về VSTEP GO
					</a>
					<p className="text-xs text-subtle">
						Nếu ứng dụng chưa tự mở, hãy nhấn nút trên hoặc quay lại VSTEP GO thủ công.
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
	const query = params.toString()
	if (search.flow === "course") {
		const coursePath = search.courseId ? `/courses/${encodeURIComponent(search.courseId)}` : "/classes"
		return `vstep://${coursePath}${query ? `?${query}` : ""}`
	}

	return `vstep:///topup${query ? `?${query}` : ""}`
}

function getPaidMessage(flow: PaymentReturnFlow) {
	const target = flow === "course" ? "khóa học" : "ví"
	return `PayOS đã trả về trạng thái thanh toán thành công. Hãy quay về VSTEP GO để hệ thống xác nhận và cập nhật ${target}.`
}
