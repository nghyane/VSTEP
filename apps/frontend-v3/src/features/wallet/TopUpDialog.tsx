import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Icon, StaticIcon } from "#/components/Icon"
import { Loading } from "#/components/Loading"
import { ScrollArea } from "#/components/ScrollArea"
import { confirmTopupOrder, createTopupOrder } from "#/features/wallet/actions"
import { topupPackagesQuery, walletBalanceQuery } from "#/features/wallet/queries"
import type { TopupPackage } from "#/features/wallet/types"
import { useToast } from "#/lib/toast"
import { cn, formatNumber, formatVnd } from "#/lib/utils"

interface Props {
	open: boolean
	onClose: () => void
}

export function TopUpDialog({ open, onClose }: Props) {
	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [open, onClose])

	if (!open) return null

	return (
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
				<DialogBody onClose={onClose} />
			</div>
		</div>
	)
}

function DialogBody({ onClose }: { onClose: () => void }) {
	const { data, isLoading } = useQuery(topupPackagesQuery)
	const { data: walletData } = useQuery(walletBalanceQuery)
	const packages = data?.data ?? []
	const balance = walletData?.data.balance ?? 0

	const defaultId = packages[Math.floor(packages.length / 2)]?.id ?? packages[0]?.id ?? ""
	const [selectedId, setSelectedId] = useState<string>(defaultId)

	useEffect(() => {
		if (!selectedId && defaultId) setSelectedId(defaultId)
	}, [defaultId, selectedId])

	if (isLoading) {
		return (
			<div className="p-12 flex items-center justify-center">
				<Loading />
			</div>
		)
	}

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
			<LeftPanel balance={balance} onClose={onClose} />
			<ScrollArea className="md:max-h-[92vh]">
				<RightPanel
					packages={packages}
					selectedId={selectedId}
					onSelect={setSelectedId}
					selected={selected}
					onBuySuccess={onClose}
				/>
			</ScrollArea>
		</div>
	)
}

function LeftPanel({ balance, onClose }: { balance: number; onClose: () => void }) {
	const isEmpty = balance === 0
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
								thêm để học không lo dừng giữa chừng.
							</>
						)}
					</p>
				</div>
			</div>

			<div className="w-full rounded-(--radius-card) border-2 border-dashed border-border bg-surface/60 p-4 space-y-2">
				<p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-primary-dark">
					<Icon name="lightning" size="xs" />
					Xu dùng để làm gì?
				</p>
				<ul className="space-y-1.5 text-xs text-muted">
					<TipRow
						text={
							<>
								<span className="font-extrabold text-foreground">Full-test</span>: 25 xu / đề
							</>
						}
					/>
					<TipRow
						text={
							<>
								Thi theo kỹ năng riêng: <span className="font-extrabold text-foreground">8 xu / kỹ năng</span>
							</>
						}
					/>
					<TipRow text="Nhận xét AI chi tiết sau mỗi bài Viết / Nói" />
				</ul>
			</div>

			<button
				type="button"
				onClick={onClose}
				className="text-xs font-bold text-subtle underline-offset-4 hover:text-foreground hover:underline transition"
			>
				Quay lại vào ngày mai
			</button>
		</div>
	)
}

function TipRow({ text }: { text: React.ReactNode }) {
	return (
		<li className="flex items-start gap-1.5">
			<span className="mt-1 size-1 shrink-0 rounded-full bg-subtle" />
			<span>{text}</span>
		</li>
	)
}

function RightPanel({
	packages,
	selectedId,
	onSelect,
	selected,
	onBuySuccess,
}: {
	packages: TopupPackage[]
	selectedId: string
	onSelect: (id: string) => void
	selected: TopupPackage
	onBuySuccess: () => void
}) {
	return (
		<div className="flex flex-col gap-6 p-6 md:p-8">
			<div>
				<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coin-tint text-xs font-extrabold uppercase tracking-wider text-coin-dark">
					<StaticIcon name="coin" size="xs" />
					Nạp xu
				</span>
			</div>

			<div className="space-y-2">
				<h1 className="text-2xl md:text-3xl font-extrabold leading-tight text-foreground">
					Nạp xu một lần, học thả ga mỗi ngày!
				</h1>
				<p className="text-sm leading-relaxed text-subtle">
					Mở khoá <span className="font-extrabold text-foreground">không giới hạn</span> lượt làm đề và chấm
					điểm AI. Xu không bao giờ hết hạn — mua một lần, dùng đến khi đạt mục tiêu.
				</p>
			</div>

			<ul className="space-y-3">
				<BenefitRow
					icon="target"
					title="Luyện tập & thi thử không giới hạn"
					body="Làm toàn bộ đề full-test hoặc từng kỹ năng tuỳ nhu cầu."
				/>
				<BenefitRow
					icon="pencil"
					title="Chấm điểm + nhận xét AI chi tiết"
					body="Phân tích lỗi sai, gợi ý cải thiện ở từng tiêu chí VSTEP."
				/>
				<BenefitRow
					icon="lightning"
					title="Tặng thêm xu theo streak học tập"
					body="Duy trì chuỗi 7 / 14 / 30 ngày để nhận thưởng xu cộng dồn."
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

			<BuyButton pack={selected} onSuccess={onBuySuccess} />
		</div>
	)
}

function BenefitRow({
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

function PackCard({
	pack,
	selected,
	onSelect,
}: {
	pack: TopupPackage
	selected: boolean
	onSelect: () => void
}) {
	const highlight = pack.bonus_coins > 0 && pack.bonus_coins >= 100
	const pricePerCoin = Math.round(pack.amount_vnd / pack.total_coins)
	const savingsPct = pack.bonus_coins > 0 ? Math.max(0, Math.round(((300 - pricePerCoin) / 300) * 100)) : 0

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
			{highlight && (
				<span className="absolute -top-2.5 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
					<StaticIcon name="trophy" size="xs" className="h-3 w-auto" />
					Best value
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
			{savingsPct > 0 ? (
				<span className="inline-flex px-2 py-0.5 rounded-full bg-primary-tint text-[11px] font-extrabold text-primary-dark">
					Tặng +{formatNumber(pack.bonus_coins)} xu · tiết kiệm {savingsPct}%
				</span>
			) : (
				<span className="text-[11px] font-bold text-subtle">{formatNumber(pricePerCoin)}đ / xu</span>
			)}
		</button>
	)
}

function BuyButton({ pack, onSuccess }: { pack: TopupPackage; onSuccess: () => void }) {
	const queryClient = useQueryClient()

	const mutation = useMutation({
		mutationFn: async () => {
			const order = await createTopupOrder(pack.id)
			return confirmTopupOrder(order.id)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: walletBalanceQuery.queryKey })
			useToast.getState().add(`Nạp thành công +${formatNumber(pack.total_coins)} xu`, "success")
			onSuccess()
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
				<a
					href="https://www.facebook.com/"
					target="_blank"
					rel="noreferrer"
					className="underline underline-offset-4 hover:text-foreground transition"
				>
					liên hệ fanpage
				</a>{" "}
				để được hỗ trợ nạp xu
			</p>
		</div>
	)
}
