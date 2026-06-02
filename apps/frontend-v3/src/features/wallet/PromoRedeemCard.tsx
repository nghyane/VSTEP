import { useMutation, useQueryClient } from "@tanstack/react-query"
import { HTTPError } from "ky"
import { useState } from "react"
import { StaticIcon } from "#/components/Icon"
import { inputClass } from "#/features/auth/styles"
import { redeemPromoCode } from "#/features/wallet/actions"
import { PromoRedeemSuccessPopup } from "#/features/wallet/PromoRedeemSuccessPopup"
import { walletBalanceQuery } from "#/features/wallet/queries"
import { useCoinGain } from "#/lib/coin-gain"
import { cn } from "#/lib/utils"

export function PromoRedeemCard() {
	const [code, setCode] = useState("")
	const [fieldError, setFieldError] = useState<string | null>(null)
	const [success, setSuccess] = useState<{ coins: number; balance: number } | null>(null)
	const queryClient = useQueryClient()

	const mutation = useMutation({
		mutationFn: (raw: string) => redeemPromoCode(raw.trim().toUpperCase()),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: walletBalanceQuery.queryKey })
			setCode("")
			setFieldError(null)
			setSuccess({ coins: data.coins_granted, balance: data.balance_after })
		},
		onError: (err) => {
			let message = "Mã không hợp lệ hoặc đã hết hạn."
			if (err instanceof HTTPError) {
				const body = err.data as { message?: string; errors?: Record<string, string[]> } | undefined
				const firstFieldError = body?.errors ? Object.values(body.errors)[0]?.[0] : undefined
				message = firstFieldError ?? body?.message ?? message
			}
			setFieldError(message)
		},
	})

	const handleSuccessClose = () => {
		const coins = success?.coins ?? 0
		setSuccess(null)
		if (coins > 0) {
			setTimeout(() => useCoinGain.getState().trigger(coins), 220)
		}
	}

	const trimmed = code.trim()
	const disabled = trimmed === "" || mutation.isPending

	return (
		<>
			<section className="card p-6">
				<div className="flex items-start gap-4">
					<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-coin-tint">
						<StaticIcon name="coin" size="sm" />
					</div>
					<div className="min-w-0 flex-1">
						<h3 className="font-bold text-base text-foreground">Nhập mã quà tặng</h3>
						<p className="text-sm text-subtle mt-0.5">
							Nhập mã khuyến mãi hoặc mã đối tác để nhận xu vào ví hồ sơ hiện tại.
						</p>
					</div>
				</div>

				<form
					onSubmit={(e) => {
						e.preventDefault()
						if (!disabled) mutation.mutate(code)
					}}
					className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start"
				>
					<div className="flex-1">
						<input
							type="text"
							value={code}
							onChange={(e) => {
								setCode(e.target.value.toUpperCase())
								if (fieldError) setFieldError(null)
							}}
							placeholder="VD: NEWYEAR2026"
							maxLength={50}
							autoComplete="off"
							spellCheck={false}
							className={cn(inputClass, "uppercase tracking-wider", fieldError && "border-destructive")}
							aria-invalid={!!fieldError}
						/>
						{fieldError && <p className="text-xs font-bold text-destructive mt-2">{fieldError}</p>}
					</div>
					<button
						type="submit"
						disabled={disabled}
						className="btn btn-primary h-12 px-6 font-extrabold whitespace-nowrap disabled:opacity-60"
					>
						{mutation.isPending ? "Đang nhận..." : "Nhận xu"}
					</button>
				</form>
			</section>

			<PromoRedeemSuccessPopup
				open={success !== null}
				coinsAdded={success?.coins ?? 0}
				newBalance={success?.balance ?? 0}
				onClose={handleSuccessClose}
			/>
		</>
	)
}
