import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { Icon, StaticIcon } from "#/components/Icon"
import { orderHistoryQuery } from "#/features/orders/queries"
import type { OrderHistoryItem, OrderHistoryStatus } from "#/features/orders/types"
import { cn, formatNumber, formatVnd } from "#/lib/utils"

export const Route = createFileRoute("/_app/don-hang")({
	validateSearch: (s: Record<string, unknown>): { page: number } => ({
		page: Math.max(1, Number(s.page ?? 1) || 1),
	}),
	component: OrdersPage,
})

const STATUS_LABEL: Record<OrderHistoryStatus, string> = {
	pending: "Chờ thanh toán",
	paid: "Đã thanh toán",
	failed: "Thất bại",
	cancelled: "Đã hủy",
	expired: "Hết hạn",
}

const STATUS_CLASS: Record<OrderHistoryStatus, string> = {
	pending: "bg-warning/10 text-warning border-warning/30",
	paid: "bg-success/10 text-success border-success/30",
	failed: "bg-destructive/10 text-destructive border-destructive/30",
	cancelled: "bg-muted/10 text-muted border-border",
	expired: "bg-muted/10 text-muted border-border",
}

function OrdersPage() {
	const { page } = Route.useSearch()
	const navigate = useNavigate()
	const { data, isLoading } = useQuery(orderHistoryQuery(page))
	const orders = data?.data ?? []
	const meta = data?.meta

	const goToPage = (nextPage: number) => {
		navigate({ to: "/don-hang", search: { page: nextPage } })
	}

	return (
		<>
			<Header title="Lịch sử đơn hàng" />
			<div className="px-10 pb-12">
				<section className="relative overflow-hidden rounded-(--radius-banner) border-2 border-border border-b-4 bg-surface shadow-sm">
					<div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-primary-tint via-warning/10 to-info/10" />
					<div className="relative p-6 md:p-8">
						<div>
							<p className="text-xs font-extrabold uppercase tracking-wider text-primary-dark">Thanh toán</p>
							<h1 className="mt-2 text-2xl font-extrabold text-foreground md:text-3xl">Lịch sử đơn hàng</h1>
							<p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
								Theo dõi các lần nạp xu và mua khóa học của hồ sơ hiện tại. Mỗi trang hiển thị tối đa 15 đơn.
							</p>
						</div>

						<div className="mt-7 overflow-hidden rounded-(--radius-card) border-2 border-border bg-background/80">
							{isLoading ? (
								<OrderSkeleton />
							) : orders.length === 0 ? (
								<EmptyOrders />
							) : (
								<div className="divide-y divide-border">
									{orders.map((order) => (
										<OrderRow key={`${order.type}:${order.id}`} order={order} />
									))}
								</div>
							)}
						</div>

						{meta && meta.last_page > 1 && (
							<div className="mt-5 flex items-center justify-between gap-3">
								<p className="text-xs font-bold text-subtle">
									Trang {meta.current_page}/{meta.last_page} · {meta.total} đơn
								</p>
								<div className="flex gap-2">
									<button
										type="button"
										disabled={meta.current_page <= 1}
										onClick={() => goToPage(meta.current_page - 1)}
										className="btn btn-secondary px-4 py-2 text-sm disabled:pointer-events-none disabled:opacity-50"
									>
										Trước
									</button>
									<button
										type="button"
										disabled={meta.current_page >= meta.last_page}
										onClick={() => goToPage(meta.current_page + 1)}
										className="btn btn-secondary px-4 py-2 text-sm disabled:pointer-events-none disabled:opacity-50"
									>
										Sau
									</button>
								</div>
							</div>
						)}
					</div>
				</section>
			</div>
		</>
	)
}

function OrderRow({ order }: { order: OrderHistoryItem }) {
	const isTopup = order.type === "topup"

	return (
		<article className="flex flex-col gap-4 p-4 transition hover:bg-surface md:flex-row md:items-center md:justify-between md:p-5">
			<div className="flex min-w-0 gap-4">
				<div
					className={cn(
						"flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-b-4",
						isTopup ? "border-warning/30 bg-warning/10" : "border-primary/30 bg-primary-tint",
					)}
				>
					{isTopup ? (
						<StaticIcon name="coin" size="sm" />
					) : (
						<Icon name="graduation" size="sm" className="text-primary" />
					)}
				</div>
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="truncate text-base font-extrabold text-foreground">{order.item_name}</h2>
						<span
							className={cn(
								"rounded-full border px-2 py-0.5 text-[11px] font-extrabold",
								STATUS_CLASS[order.status],
							)}
						>
							{STATUS_LABEL[order.status]}
						</span>
					</div>
					<p className="mt-1 text-xs font-bold text-subtle">
						{order.type_label} · Mã đơn {order.order_code ?? order.id.slice(0, 8)} ·{" "}
						{formatDateTime(order.created_at)}
					</p>
					{isTopup && order.coins_to_credit !== null && (
						<p className="mt-1 text-xs font-extrabold text-primary-dark">
							+{formatNumber(order.coins_to_credit)} xu
						</p>
					)}
				</div>
			</div>

			<div className="flex shrink-0 items-center justify-end gap-3">
				<div className="text-right">
					<p className="text-lg font-extrabold text-foreground tabular-nums">{formatVnd(order.amount_vnd)}</p>
					<p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-subtle">
						{order.payment_provider}
					</p>
				</div>
			</div>
		</article>
	)
}

function OrderSkeleton() {
	return (
		<div className="space-y-0 divide-y divide-border">
			{Array.from({ length: 4 }, (_, index) => (
				<div key={index} className="flex items-center gap-4 p-5">
					<div className="size-12 animate-pulse rounded-2xl bg-border" />
					<div className="flex-1 space-y-2">
						<div className="h-4 w-1/2 animate-pulse rounded bg-border" />
						<div className="h-3 w-1/3 animate-pulse rounded bg-border" />
					</div>
					<div className="h-5 w-24 animate-pulse rounded bg-border" />
				</div>
			))}
		</div>
	)
}

function EmptyOrders() {
	return (
		<div className="px-6 py-12 text-center">
			<img src="/mascot/lac-think.png" alt="" className="mx-auto mb-4 h-24 w-24 object-contain opacity-90" />
			<p className="text-base font-extrabold text-foreground">Chưa có đơn hàng</p>
			<p className="mt-1 text-sm text-subtle">
				Khi bạn nạp xu hoặc mua khóa học, lịch sử sẽ xuất hiện ở đây.
			</p>
		</div>
	)
}

function formatDateTime(iso: string): string {
	return new Intl.DateTimeFormat("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(iso))
}
