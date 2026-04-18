// TopUpDialog — dialog nạp xu 4 gói, 1 xu = 300đ baseline + bonus tăng dần.
// Trigger từ CoinButton trên topbar.

import { Gauge, Infinity as InfinityIcon, Sparkles, Star } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { AnimatedCoinIcon } from "#/components/common/AnimatedCoinIcon"
import { CoinIcon } from "#/components/common/CoinIcon"
import { refundCoins, useCoins } from "#/lib/coins/coin-store"
import { pushNotification } from "#/lib/notifications/store"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/shared/ui/dialog"
import { ScrollArea } from "#/shared/ui/scroll-area"

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
}

interface CoinPack {
	id: string
	name: string
	coins: number // tổng xu nhận được (đã bao gồm bonus)
	priceVnd: number
	bonus: number // xu tặng thêm
	highlight?: boolean
}

// Baseline 1 xu = 300đ. Bonus tăng dần theo size gói.
const PACKS: readonly [CoinPack, CoinPack, CoinPack, CoinPack] = [
	{ id: "starter", name: "Khởi đầu", coins: 100, priceVnd: 30_000, bonus: 0 },
	{ id: "basic", name: "Cơ bản", coins: 320, priceVnd: 90_000, bonus: 20 },
	{
		id: "popular",
		name: "Phổ biến",
		coins: 800,
		priceVnd: 210_000,
		bonus: 100,
		highlight: true,
	},
	{ id: "max", name: "Tiết kiệm", coins: 1800, priceVnd: 450_000, bonus: 300 },
]

const DEFAULT_PACK: CoinPack = PACKS.find((p) => p.highlight) ?? PACKS[0]

function formatVnd(n: number): string {
	return `${n.toLocaleString("vi-VN")}đ`
}

function formatCoins(n: number): string {
	return n.toLocaleString("vi-VN")
}

export function TopUpDialog({ open, onOpenChange }: Props) {
	const coins = useCoins()
	const [selectedId, setSelectedId] = useState<string>(DEFAULT_PACK.id)
	const selected: CoinPack = PACKS.find((p) => p.id === selectedId) ?? DEFAULT_PACK
	const isEmpty = coins === 0

	function handleBuy() {
		// Mock: cộng xu thẳng — thực tế sẽ navigate sang cổng thanh toán.
		refundCoins(selected.coins)
		toast.success(`Nạp thành công +${formatCoins(selected.coins)} xu`, {
			description: `Gói "${selected.name}" · ${formatVnd(selected.priceVnd)}`,
		})
		pushNotification({
			id: `topup:${Date.now()}`,
			title: `+${formatCoins(selected.coins)} xu từ gói ${selected.name}`,
			body: `Đã thanh toán ${formatVnd(selected.priceVnd)} · Xu không bao giờ hết hạn.`,
			iconKey: "coin",
		})
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[92vh] overflow-y-auto p-0 md:overflow-hidden sm:max-w-5xl sm:rounded-3xl">
				<DialogTitle className="sr-only">Nạp xu</DialogTitle>
				<DialogDescription className="sr-only">
					Chọn gói xu phù hợp để tiếp tục luyện tập và thi thử
				</DialogDescription>
				<div className="grid md:max-h-[92vh] md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
					<LeftPanel isEmpty={isEmpty} coins={coins} onClose={() => onOpenChange(false)} />
					<ScrollArea className="md:h-[92vh]">
						<RightPanel
							selectedId={selectedId}
							onSelect={setSelectedId}
							onBuy={handleBuy}
							selectedPack={selected}
						/>
					</ScrollArea>
				</div>
			</DialogContent>
		</Dialog>
	)
}

// ─── Left panel ──────────────────────────────────────────────────────────────

function LeftPanel({
	isEmpty,
	coins,
	onClose,
}: {
	isEmpty: boolean
	coins: number
	onClose: () => void
}) {
	return (
		<div className="flex flex-col items-center justify-between gap-6 bg-muted/40 p-8 md:py-10">
			<div className="flex flex-col items-center gap-4">
				<div className="relative flex size-24 items-center justify-center">
					{isEmpty && (
						<>
							<span
								aria-hidden
								className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-slate-300/50 [animation-duration:2.4s]"
							/>
							<span
								aria-hidden
								className="pointer-events-none absolute -inset-2 animate-pulse rounded-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 opacity-40 blur-xl"
							/>
						</>
					)}
					<div
						className={cn(
							"relative transition-[filter] duration-500",
							isEmpty && "brightness-110 [filter:grayscale(1)_brightness(1.1)]",
						)}
					>
						<AnimatedCoinIcon size={88} />
					</div>
				</div>
				<div className="space-y-1.5 text-center">
					<h2 className="text-balance text-2xl font-extrabold tracking-tight text-foreground">
						{isEmpty ? "Cạn xu!" : "Nạp thêm xu"}
					</h2>
					<p className="max-w-[260px] text-pretty text-sm leading-relaxed text-muted-foreground">
						{isEmpty ? (
							<>
								Bạn đã hết xu. Nạp thêm để <span className="font-semibold">làm bài thả ga</span> và
								nhận xét AI chi tiết.
							</>
						) : (
							<>
								Còn <span className="font-semibold text-foreground">{formatCoins(coins)} xu</span>.
								Nạp thêm để học không lo dừng giữa chừng.
							</>
						)}
					</p>
				</div>
			</div>

			{/* Usage tips */}
			<div className="w-full space-y-2 rounded-2xl border border-dashed border-border bg-background/60 p-4">
				<p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
					<Sparkles className="size-3.5" />
					Xu dùng để làm gì?
				</p>
				<ul className="space-y-1.5 text-xs text-muted-foreground">
					<li className="flex items-start gap-1.5">
						<span className="mt-1 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
						<span>
							Mỗi đề <span className="font-semibold text-foreground">full-test: 25 xu</span>
						</span>
					</li>
					<li className="flex items-start gap-1.5">
						<span className="mt-1 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
						<span>
							Thi theo kỹ năng riêng:{" "}
							<span className="font-semibold text-foreground">8 xu / kỹ năng</span>
						</span>
					</li>
					<li className="flex items-start gap-1.5">
						<span className="mt-1 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
						<span>Nhận xét AI chi tiết sau mỗi bài Viết / Nói</span>
					</li>
				</ul>
			</div>

			<button
				type="button"
				onClick={onClose}
				className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
			>
				Quay lại vào ngày mai
			</button>
		</div>
	)
}

// ─── Right panel ─────────────────────────────────────────────────────────────

function RightPanel({
	selectedId,
	onSelect,
	onBuy,
	selectedPack,
}: {
	selectedId: string
	onSelect: (id: string) => void
	onBuy: () => void
	selectedPack: CoinPack
}) {
	return (
		<div className="flex flex-col gap-6 p-6 md:p-8">
			{/* Brand pill */}
			<div>
				<span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
					<CoinIcon size={12} />
					Nạp xu
				</span>
			</div>

			{/* Headline */}
			<div className="space-y-2">
				<h1 className="text-balance text-2xl font-extrabold leading-tight text-foreground md:text-3xl">
					Nạp xu một lần, học thả ga mỗi ngày!
				</h1>
				<p className="text-pretty text-sm leading-relaxed text-muted-foreground">
					Mở khoá <span className="font-semibold text-foreground">không giới hạn</span> lượt làm đề
					và chấm điểm AI. Xu không bao giờ hết hạn — mua một lần, dùng đến khi đạt mục tiêu.
				</p>
			</div>

			{/* Benefits (bare icons — Rule 0.1) */}
			<ul className="space-y-3">
				<BenefitRow
					icon={<InfinityIcon className="size-5 text-primary" />}
					title="Luyện tập & thi thử không giới hạn"
					body="Làm toàn bộ đề full-test hoặc từng kỹ năng tuỳ nhu cầu."
				/>
				<BenefitRow
					icon={<Gauge className="size-5 text-primary" />}
					title="Chấm điểm + nhận xét AI chi tiết"
					body="Phân tích lỗi sai, gợi ý cải thiện ở từng tiêu chí VSTEP."
				/>
				<BenefitRow
					icon={<Star className="size-5 text-primary" />}
					title="Tặng thêm xu theo streak học tập"
					body="Duy trì chuỗi 7 / 14 / 30 ngày để nhận thưởng xu cộng dồn."
				/>
			</ul>

			{/* Pack grid */}
			<div className="grid grid-cols-2 gap-3">
				{PACKS.map((pack) => (
					<PackCard
						key={pack.id}
						pack={pack}
						selected={selectedId === pack.id}
						onSelect={() => onSelect(pack.id)}
					/>
				))}
			</div>

			{/* CTA */}
			<div className="space-y-2">
				<Button
					size="lg"
					className="w-full rounded-xl text-base font-bold shadow-md"
					onClick={onBuy}
				>
					Nạp {formatCoins(selectedPack.coins)} xu · {formatVnd(selectedPack.priceVnd)}
				</Button>
				<p className="text-center text-xs text-muted-foreground">
					Hoặc{" "}
					<a
						href="https://www.facebook.com/"
						target="_blank"
						rel="noreferrer"
						className="underline underline-offset-4 transition-colors hover:text-foreground"
					>
						liên hệ fanpage
					</a>{" "}
					để được hỗ trợ nạp xu
				</p>
			</div>
		</div>
	)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function BenefitRow({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
	return (
		<li className="flex items-start gap-3">
			<span className="flex size-6 shrink-0 items-center justify-center">{icon}</span>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-semibold text-foreground">{title}</p>
				<p className="text-xs text-muted-foreground">{body}</p>
			</div>
		</li>
	)
}

function PackCard({
	pack,
	selected,
	onSelect,
}: {
	pack: CoinPack
	selected: boolean
	onSelect: () => void
}) {
	const pricePerCoin = Math.round(pack.priceVnd / pack.coins)
	const savingsPct = pack.bonus > 0 ? Math.round(((300 - pricePerCoin) / 300) * 100) : 0

	return (
		<button
			type="button"
			onClick={onSelect}
			aria-pressed={selected}
			className={cn(
				"group relative flex flex-col items-start gap-1 rounded-2xl border-2 bg-card p-4 text-left transition-all",
				selected
					? "border-primary shadow-md ring-4 ring-primary/10"
					: "border-border hover:border-foreground/20 hover:shadow-sm",
			)}
		>
			{pack.highlight && (
				<span className="absolute -top-2.5 left-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
					<Star className="size-2.5 fill-current" />
					Best value
				</span>
			)}
			<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
				Gói {pack.name}
			</p>
			<div className="flex items-center gap-1.5">
				<span className="flex size-5 shrink-0 items-center justify-center">
					<CoinIcon size={18} className="translate-y-[1px]" />
				</span>
				<span className="inline-block translate-y-[2px] leading-none">
					<span className="text-xl font-extrabold tabular-nums text-foreground">
						{formatCoins(pack.coins)}
					</span>{" "}
					<span className="text-xs font-semibold text-muted-foreground">xu</span>
				</span>
			</div>
			<p className="text-base font-bold text-foreground">{formatVnd(pack.priceVnd)}</p>
			{savingsPct > 0 ? (
				<span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
					Tặng +{formatCoins(pack.bonus)} xu · tiết kiệm {savingsPct}%
				</span>
			) : (
				<span className="text-[10px] font-semibold text-muted-foreground">300đ / xu</span>
			)}
		</button>
	)
}
