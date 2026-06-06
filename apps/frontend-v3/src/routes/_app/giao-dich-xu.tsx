import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { Icon, StaticIcon } from "#/components/Icon"
import { walletTransactionsQuery } from "#/features/wallet/queries"
import type { CoinTransaction } from "#/features/wallet/types"
import { cn, formatNumber } from "#/lib/utils"

export const Route = createFileRoute("/_app/giao-dich-xu")({
	validateSearch: (s: Record<string, unknown>): { page: number } => ({
		page: Math.max(1, Number(s.page ?? 1) || 1),
	}),
	component: CoinTransactionsPage,
})

const TYPE_LABELS: Record<string, string> = {
	topup: "Nạp xu",
	onboarding_bonus: "Quà chào mừng",
	course_bonus: "Thưởng khóa học",
	promo_redeem: "Mã khuyến mãi",
	streak_milestone: "Thưởng streak",
	refund: "Hoàn xu",
	exam_custom: "Thi tùy chỉnh",
	exam_full: "Thi full-test",
	course_purchase: "Mua khóa học",
	teacher_booking: "Đặt lịch 1-1",
	practice_feedback: "Feedback bài luyện",
}

const SOURCE_LABELS: Record<string, string> = {
	wallet_topup_order: "Đơn nạp xu",
	promo_code_redemption: "Đổi mã khuyến mãi",
	promo_code: "Mã khuyến mãi",
	course_enrollment: "Ghi danh khóa học",
	practice_session: "Phiên luyện tập",
	practice_feedback_request: "Yêu cầu feedback",
	profile: "Hồ sơ học tập",
	profile_streak_claim: "Nhận thưởng streak",
	teacher_booking: "Lịch học 1-1",
}

function CoinTransactionsPage() {
	const { page } = Route.useSearch()
	const navigate = useNavigate()
	const { data, isLoading } = useQuery(walletTransactionsQuery(page))
	const transactions = data?.data ?? []
	const meta = data?.meta

	const goToPage = (nextPage: number) => {
		navigate({ to: "/giao-dich-xu", search: { page: nextPage } })
	}

	return (
		<>
			<Header title="Lịch sử giao dịch xu" />
			<div className="px-10 pb-12">
				<section className="relative overflow-hidden rounded-(--radius-banner) border-2 border-border border-b-4 bg-surface shadow-sm">
					<div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-coin-tint via-primary-tint/60 to-info/10" />
					<div className="relative p-6 md:p-8">
						<div>
							<p className="text-xs font-extrabold uppercase tracking-wider text-coin-dark">Ví xu</p>
							<h1 className="mt-2 text-2xl font-extrabold text-foreground md:text-3xl">
								Lịch sử giao dịch xu
							</h1>
							<p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
								Xem các lần xu tăng hoặc giảm, số dư sau giao dịch và nguồn phát sinh để đối soát ví.
							</p>
						</div>

						<div className="mt-7 overflow-hidden rounded-(--radius-card) border-2 border-border bg-background/80">
							{isLoading ? (
								<TransactionSkeleton />
							) : transactions.length === 0 ? (
								<EmptyTransactions />
							) : (
								<div className="divide-y divide-border">
									{transactions.map((transaction) => (
										<TransactionRow key={transaction.id} transaction={transaction} />
									))}
								</div>
							)}
						</div>

						{meta && meta.last_page > 1 && (
							<div className="mt-5 flex items-center justify-between gap-3">
								<p className="text-xs font-bold text-subtle">
									Trang {meta.current_page}/{meta.last_page} · {meta.total} giao dịch
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

function TransactionRow({ transaction }: { transaction: CoinTransaction }) {
	const credit = transaction.delta > 0
	const sourceLabel = transaction.source_type ? SOURCE_LABELS[transaction.source_type] : null

	return (
		<article className="flex flex-col gap-4 p-4 transition hover:bg-surface md:flex-row md:items-center md:justify-between md:p-5">
			<div className="flex min-w-0 gap-4">
				<div
					className={cn(
						"flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-b-4",
						credit ? "border-primary/30 bg-coin-tint" : "border-destructive/20 bg-destructive/10",
					)}
				>
					{credit ? (
						<StaticIcon name="coin" size="sm" />
					) : (
						<Icon name="timer" size="sm" className="text-destructive" />
					)}
				</div>
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="truncate text-base font-extrabold text-foreground">
							{labelForType(transaction.type)}
						</h2>
						<span
							className={cn(
								"rounded-full border px-2 py-0.5 text-[11px] font-extrabold",
								credit
									? "border-primary/30 bg-primary-tint text-primary-dark"
									: "border-destructive/30 bg-destructive/10 text-destructive",
							)}
						>
							{credit ? "Cộng xu" : "Trừ xu"}
						</span>
					</div>
					<p className="mt-1 text-xs font-bold text-subtle">
						{formatDateTime(transaction.created_at)} · {sourceLabel ?? "Nguồn hệ thống"}
					</p>
					{transaction.source_id && (
						<p className="mt-1 text-[11px] font-bold text-subtle">
							Mã nguồn {shortId(transaction.source_id)}
						</p>
					)}
				</div>
			</div>

			<div className="flex shrink-0 items-center justify-between gap-6 md:justify-end">
				<div className="text-right">
					<p
						className={cn(
							"text-lg font-extrabold tabular-nums",
							credit ? "text-primary-dark" : "text-destructive",
						)}
					>
						{credit ? "+" : "-"}
						{formatNumber(Math.abs(transaction.delta))} xu
					</p>
					<p className="mt-0.5 text-[11px] font-bold text-subtle">
						Số dư sau: <span className="tabular-nums">{formatNumber(transaction.balance_after)}</span> xu
					</p>
				</div>
			</div>
		</article>
	)
}

function TransactionSkeleton() {
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

function EmptyTransactions() {
	return (
		<div className="px-6 py-12 text-center">
			<img src="/mascot/lac-think.png" alt="" className="mx-auto mb-4 h-24 w-24 object-contain opacity-90" />
			<p className="text-base font-extrabold text-foreground">Chưa có giao dịch xu</p>
			<p className="mt-1 text-sm text-subtle">Khi ví xu tăng hoặc giảm, lịch sử sẽ xuất hiện ở đây.</p>
		</div>
	)
}

function labelForType(type: string): string {
	return TYPE_LABELS[type] ?? type.replaceAll("_", " ")
}

function shortId(id: string): string {
	return id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id
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
