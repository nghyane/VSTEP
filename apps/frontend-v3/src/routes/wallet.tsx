import { createFileRoute, Link } from "@tanstack/react-router"

type PaymentReturnState = "confirming" | "cancelled"

export const Route = createFileRoute("/wallet")({
	validateSearch: (
		s: Record<string, unknown>,
	): {
		code?: string
		id?: string
		cancel?: boolean
		status?: string
		orderCode?: string
	} => ({
		code: typeof s.code === "string" ? s.code : undefined,
		id: typeof s.id === "string" ? s.id : undefined,
		cancel: s.cancel === true || s.cancel === "true" ? true : undefined,
		status: typeof s.status === "string" ? s.status : undefined,
		orderCode: typeof s.orderCode === "string" ? s.orderCode : undefined,
	}),
	component: PaymentReturnPage,
})

function PaymentReturnPage() {
	const search = Route.useSearch()
	const state = getPaymentReturnState(search)
	const isConfirming = state === "confirming"

	return (
		<main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
			<section className="card w-full max-w-lg p-8 text-center md:p-10">
				<div
					className={`mx-auto flex size-20 items-center justify-center rounded-full text-4xl font-extrabold ${
						isConfirming ? "bg-primary-tint text-primary" : "bg-destructive/10 text-destructive"
					}`}
				>
					{isConfirming ? "…" : "!"}
				</div>

				<h1 className="mt-6 text-2xl font-extrabold text-foreground">
					{isConfirming ? "Đang xác nhận thanh toán" : "Thanh toán chưa hoàn tất"}
				</h1>
				<p className="mt-3 text-sm leading-relaxed text-muted">
					{isConfirming
						? "Kết quả cuối cùng sẽ được backend cập nhật qua callback bảo mật từ PayOS. Nếu giao dịch thành công, số dư hoặc đăng ký khóa học sẽ tự cập nhật sau vài giây."
						: "Giao dịch đã bị hủy hoặc chưa được PayOS xác nhận thành công. Dữ liệu thanh toán sẽ được backend xử lý qua callback bảo mật."}
				</p>

				<dl className="mt-6 space-y-2 rounded-(--radius-card) border-2 border-border bg-background p-4 text-left text-xs">
					<InfoRow
						label="Trạng thái trả về"
						value={search.status ?? (isConfirming ? "PENDING_CALLBACK" : "CANCELLED")}
					/>
					<InfoRow label="Mã đơn" value={search.orderCode} />
					<InfoRow label="Mã giao dịch" value={search.id} />
				</dl>

				<div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
					<Link to="/" className="btn btn-primary">
						Về trang chủ
					</Link>
					<Link to="/" search={{ auth: "login" }} className="btn btn-ghost">
						Đăng nhập để kiểm tra
					</Link>
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
	return "confirming"
}
