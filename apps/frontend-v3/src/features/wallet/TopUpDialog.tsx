import { useMutation } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Icon, StaticIcon } from "#/components/Icon"
import { Loading } from "#/components/Loading"
import { ScrollArea } from "#/components/ScrollArea"
import { ZaloSupportLink } from "#/components/SupportFab"
import { createTopupOrder } from "#/features/wallet/actions"
import { savePendingTopupOrder } from "#/features/wallet/topup-pending"
import { type EnrichedPackage, useTopupDialog } from "#/features/wallet/use-topup-dialog"
import { cn, formatNumber, formatVnd } from "#/lib/utils"

type UsagePricing = NonNullable<ReturnType<typeof useTopupDialog>["pricing"]>

// ─── Shell ────────────────────────────────────────────────

export function TopUpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [open, onClose])

	if (typeof document === "undefined") return null

	return open
		? createPortal(
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_200ms_ease-out] p-4"
					role="dialog"
					aria-modal="true"
					aria-label="Nạp xu"
				>
					<div className="card relative w-full max-w-5xl max-h-[92vh] overflow-hidden animate-[popIn_300ms_cubic-bezier(0.34,1.56,0.64,1)]">
						<button
							type="button"
							onClick={onClose}
							aria-label="Đóng"
							className="absolute top-4 right-4 p-2 rounded-full hover:bg-background transition z-10"
						>
							<Icon name="close" size="sm" className="text-muted" />
						</button>
						<Body onClose={onClose} />
					</div>
				</div>,
				document.body,
			)
		: null
}

// ─── Body ─────────────────────────────────────────────────

function Body({ onClose }: { onClose: () => void }) {
	const { packages, balance, pricing, isLoading } = useTopupDialog()
	const defaultId = packages[Math.floor(packages.length / 2)]?.id ?? packages[0]?.id ?? ""
	const [selectedId, setSelectedId] = useState<string>(defaultId)

	useEffect(() => {
		if (!selectedId && defaultId) setSelectedId(defaultId)
	}, [defaultId, selectedId])

	if (isLoading)
		return (
			<div className="p-12 flex items-center justify-center">
				<Loading />
			</div>
		)
	if (packages.length === 0) {
		return (
			<div className="p-10 text-center">
				<h2 className="text-xl font-extrabold text-foreground">Không có gói nạp</h2>
				<p className="mt-2 text-sm text-subtle">Vui lòng quay lại sau.</p>
			</div>
		)
	}

	const selected = packages.find((p) => p.id === selectedId) ?? packages[0]

	return (
		<div className="grid md:max-h-[92vh] md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
			<LeftPanel balance={balance} pricing={pricing} onClose={onClose} />
			<ScrollArea className="md:max-h-[92vh]">
				<RightPanel
					packages={packages}
					selectedId={selectedId}
					onSelect={setSelectedId}
					selected={selected}
				/>
			</ScrollArea>
		</div>
	)
}

// ─── Left Panel ───────────────────────────────────────────

function LeftPanel({
	balance,
	pricing,
	onClose,
}: {
	balance: number
	pricing: UsagePricing | null
	onClose: () => void
}) {
	const isEmpty = balance === 0
	const feedbackCost = pricing?.practice.feedback_cost_coins ?? null
	return (
		<div className="flex flex-col items-center justify-between gap-6 bg-background p-8 md:py-10">
			<div className="flex flex-col items-center gap-4">
				<div className="group relative flex size-40 items-center justify-center">
					{isEmpty && (
						<span
							aria-hidden
							className="pointer-events-none absolute inset-4 animate-ping rounded-full bg-coin/20 [animation-duration:2.4s]"
						/>
					)}
					<StaticIcon
						name="coin-md"
						size="xl"
						className={cn(
							"relative h-36 w-auto group-hover:animate-[coinPinch_700ms_ease-in-out]",
							isEmpty && "grayscale opacity-60",
						)}
					/>
				</div>
				<div className="space-y-1.5 text-center">
					<h2 className="text-2xl font-extrabold text-foreground">{isEmpty ? "Cạn xu!" : "Nạp thêm xu"}</h2>
					<p className="max-w-[260px] text-sm leading-relaxed text-subtle">
						{isEmpty ? (
							<>
								Bạn đã hết xu. Nạp thêm để{" "}
								<span className="font-extrabold text-foreground">làm bài thả ga</span> và nhận xét AI chi
								tiết.
							</>
						) : (
							<>
								Còn <span className="font-extrabold text-foreground">{formatNumber(balance)} xu</span>. Nạp
								thêm khi cần để luôn sẵn sàng làm đề và nhận xét AI.
							</>
						)}
					</p>
				</div>
			</div>

			<div className="w-full rounded-(--radius-card) border-2 border-dashed border-border bg-surface/60 p-4 space-y-2">
				<p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-primary-dark">
					<Icon name="lightning" size="xs" /> Xu dùng để làm gì?
				</p>
				<ul className="space-y-1.5 text-xs text-muted">
					<li className="flex items-start gap-1.5">
						<span className="mt-1 size-1 shrink-0 rounded-full bg-subtle" />
						<span>
							<span className="font-extrabold text-foreground">Full-test</span>:{" "}
							{coinCostLabel(pricing?.exam.full_test_cost_coins, "lượt")}
						</span>
					</li>
					<li className="flex items-start gap-1.5">
						<span className="mt-1 size-1 shrink-0 rounded-full bg-subtle" />
						<span>
							Thi theo từng kỹ năng:{" "}
							<span className="font-extrabold text-foreground">
								{coinCostLabel(pricing?.exam.custom_per_skill_coins, "kỹ năng")}
							</span>
						</span>
					</li>
					<li className="flex items-start gap-1.5">
						<span className="mt-1 size-1 shrink-0 rounded-full bg-subtle" />
						<span>
							Nhận xét AI chi tiết:{" "}
							<span className="font-extrabold text-foreground">
								{feedbackCost === 0 ? "đang miễn phí" : coinCostLabel(feedbackCost, "lần")}
							</span>
						</span>
					</li>
				</ul>
			</div>

			<button
				type="button"
				onClick={onClose}
				className="text-xs font-bold text-subtle underline-offset-4 hover:text-foreground hover:underline transition"
			>
				Để sau
			</button>
		</div>
	)
}

function coinCostLabel(cost: number | null | undefined, unit: string): string {
	return typeof cost === "number" ? `${formatNumber(cost)} xu / ${unit}` : "theo cấu hình hiện tại"
}

// ─── Right Panel ──────────────────────────────────────────

function RightPanel({
	packages,
	selectedId,
	onSelect,
	selected,
}: {
	packages: EnrichedPackage[]
	selectedId: string
	onSelect: (id: string) => void
	selected: EnrichedPackage
}) {
	return (
		<div className="flex flex-col gap-6 p-6 md:p-8">
			<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coin-tint text-xs font-extrabold uppercase tracking-wider text-coin-dark self-start">
				<StaticIcon name="coin" size="xs" /> Nạp xu
			</span>

			<div className="space-y-2">
				<h1 className="text-2xl md:text-3xl font-extrabold leading-tight text-foreground">
					Chủ động xu để giữ nhịp học mỗi ngày
				</h1>
				<p className="text-sm leading-relaxed text-subtle">
					Dùng xu cho thi thử, luyện kỹ năng và nhận xét AI chi tiết. Xu không hết hạn — nạp khi cần, dùng dần
					theo mục tiêu học của bạn.
				</p>
			</div>

			<ul className="space-y-3">
				<Benefit
					icon="target"
					title="Linh hoạt luyện tập & thi thử"
					body="Chọn làm full-test hoặc từng kỹ năng tuỳ nhu cầu ôn tập."
				/>
				<Benefit
					icon="pencil"
					title="Chấm điểm + nhận xét AI chi tiết"
					body="Phân tích lỗi sai, gợi ý cải thiện ở từng tiêu chí VSTEP."
				/>
				<Benefit
					icon="lightning"
					title="Xu không hết hạn"
					body="Số dư còn lại được giữ trong ví để dùng tiếp cho các lần học sau."
				/>
			</ul>

			<div className="grid grid-cols-2 gap-3">
				{packages.map((pack) => (
					<PackCard
						key={pack.id}
						pack={pack}
						selected={selectedId === pack.id}
						onSelect={() => onSelect(pack.id)}
					/>
				))}
			</div>

			<BuyButton pack={selected} />
		</div>
	)
}

function Benefit({
	icon,
	title,
	body,
}: {
	icon: "target" | "pencil" | "lightning"
	title: string
	body: string
}) {
	return (
		<li className="flex items-start gap-3">
			<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary-dark">
				<Icon name={icon} size="xs" />
			</span>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-extrabold text-foreground">{title}</p>
				<p className="text-xs text-subtle mt-0.5">{body}</p>
			</div>
		</li>
	)
}

// ─── Pack Card ────────────────────────────────────────────

function PackCard({
	pack,
	selected,
	onSelect,
}: {
	pack: EnrichedPackage
	selected: boolean
	onSelect: () => void
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			aria-pressed={selected}
			className={cn(
				"relative flex flex-col items-start gap-1.5 p-4 rounded-(--radius-card) border-2 bg-surface text-left transition-all",
				selected
					? "border-primary shadow-md ring-4 ring-primary/15 -translate-y-0.5"
					: "border-border border-b-4 hover:border-primary/40",
			)}
		>
			{pack.is_best_value && (
				<span className="absolute -top-2.5 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
					<StaticIcon name="trophy" size="xs" className="h-3 w-auto" /> Best value
				</span>
			)}
			<p className="text-[11px] font-extrabold uppercase tracking-wider text-subtle">{pack.label}</p>
			<div className="flex items-center gap-1.5">
				<StaticIcon name="coin" size="sm" />
				<span className="text-xl font-extrabold tabular-nums text-foreground">
					{formatNumber(pack.total_coins)}
				</span>
				<span className="text-xs font-bold text-subtle">xu</span>
			</div>
			<p className="text-base font-bold text-foreground">{formatVnd(pack.amount_vnd)}</p>
			{pack.savingsPct > 0 ? (
				<span className="inline-flex px-2 py-0.5 rounded-full bg-primary-tint text-[11px] font-extrabold text-primary-dark">
					Tặng +{formatNumber(pack.bonus_coins)} xu · tiết kiệm {pack.savingsPct}%
				</span>
			) : (
				<span className="text-[11px] font-bold text-subtle">{formatNumber(pack.pricePerCoin)}đ / xu</span>
			)}
		</button>
	)
}

// ─── Buy Button ───────────────────────────────────────────

function BuyButton({ pack }: { pack: EnrichedPackage }) {
	const mutation = useMutation({
		mutationFn: () => createTopupOrder(pack.id),
		onSuccess: (order) => {
			if (order.payment_url) {
				savePendingTopupOrder({ orderId: order.id, coins: order.coins_to_credit, createdAt: Date.now() })
				const paymentWindow = window.open(order.payment_url, "_blank")
				if (paymentWindow) paymentWindow.opener = null
				if (!paymentWindow) window.location.href = order.payment_url
			}
		},
	})

	return (
		<div className="space-y-2">
			<button
				type="button"
				disabled={mutation.isPending}
				onClick={() => mutation.mutate()}
				className="btn btn-primary w-full py-3.5 text-base font-extrabold disabled:opacity-60"
			>
				{mutation.isPending
					? "Đang xử lý..."
					: `Nạp ${formatNumber(pack.total_coins)} xu · ${formatVnd(pack.amount_vnd)}`}
			</button>
			<p className="text-center text-xs text-subtle">
				Hoặc{" "}
				<ZaloSupportLink className="underline underline-offset-4 hover:text-foreground transition">
					liên hệ Zalo hỗ trợ
				</ZaloSupportLink>{" "}
				để được hỗ trợ nạp xu
			</p>
		</div>
	)
}
