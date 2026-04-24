import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Icon, StaticIcon } from "#/components/Icon"
import { Loading } from "#/components/Loading"
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
			<div className="card relative w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col animate-[popIn_300ms_cubic-bezier(0.34,1.56,0.64,1)]">
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
	const packages = data?.data ?? []
	const defaultId = packages[Math.floor(packages.length / 2)]?.id ?? packages[0]?.id ?? ""
	const [selectedId, setSelectedId] = useState<string>(defaultId)

	useEffect(() => {
		if (!selectedId && defaultId) setSelectedId(defaultId)
	}, [defaultId, selectedId])

	const selected = packages.find((p) => p.id === selectedId) ?? packages[0]

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

	return (
		<div className="p-8 overflow-y-auto">
			<Header />
			<div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
				{packages.map((pack) => (
					<PackCard
						key={pack.id}
						pack={pack}
						selected={selectedId === pack.id}
						onSelect={() => setSelectedId(pack.id)}
					/>
				))}
			</div>
			{selected && <BuyButton pack={selected} onSuccess={onClose} />}
		</div>
	)
}

function Header() {
	return (
		<div className="flex flex-col items-center text-center gap-3">
			<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-coin-tint">
				<StaticIcon name="coin" size="xs" />
				<span className="text-xs font-extrabold uppercase tracking-wider text-coin-dark">Nạp xu</span>
			</div>
			<h2 className="text-2xl font-extrabold text-foreground">Nạp xu một lần, học thả ga!</h2>
			<p className="max-w-md text-sm text-subtle">
				Mở khoá không giới hạn lượt làm đề và chấm điểm AI. Xu không bao giờ hết hạn.
			</p>
		</div>
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
				<span className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-wider">
					Best value
				</span>
			)}
			<p className="text-[11px] font-extrabold uppercase tracking-wider text-subtle">{pack.label}</p>
			<div className="flex items-center gap-1.5">
				<StaticIcon name="coin" size="sm" />
				<span className="text-xl font-extrabold tabular-nums text-foreground">
					{formatNumber(pack.total_coins)}
				</span>
			</div>
			<p className="text-base font-bold text-foreground">{formatVnd(pack.amount_vnd)}</p>
			{pack.bonus_coins > 0 && (
				<span className="inline-flex px-2 py-0.5 rounded-full bg-primary-tint text-[11px] font-extrabold text-primary-dark">
					+{formatNumber(pack.bonus_coins)} xu tặng
				</span>
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
		<button
			type="button"
			disabled={mutation.isPending}
			onClick={() => mutation.mutate()}
			className="btn btn-primary mt-6 w-full py-3.5 text-base font-extrabold disabled:opacity-60"
		>
			{mutation.isPending
				? "Đang xử lý..."
				: `Nạp ${formatNumber(pack.total_coins)} xu · ${formatVnd(pack.amount_vnd)}`}
		</button>
	)
}
