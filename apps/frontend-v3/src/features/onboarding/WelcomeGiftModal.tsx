import { useEffect, useState } from "react"
import { StaticIcon } from "#/components/Icon"
import { useWelcomeGift } from "#/features/onboarding/use-welcome-gift"

const COUNT_DURATION_MS = 1200

export function WelcomeGiftModal() {
	const amount = useWelcomeGift((s) => s.amount)
	const dismiss = useWelcomeGift((s) => s.dismiss)
	const [opened, setOpened] = useState(false)
	const [displayed, setDisplayed] = useState(0)

	useEffect(() => {
		if (amount === null) {
			setOpened(false)
			setDisplayed(0)
			return
		}
		const openTimer = setTimeout(() => setOpened(true), 400)
		return () => clearTimeout(openTimer)
	}, [amount])

	useEffect(() => {
		if (!opened || amount === null) return
		const start = performance.now()
		let raf = 0
		const step = (now: number) => {
			const t = Math.min(1, (now - start) / COUNT_DURATION_MS)
			const eased = 1 - (1 - t) ** 3
			setDisplayed(Math.round(amount * eased))
			if (t < 1) raf = requestAnimationFrame(step)
		}
		raf = requestAnimationFrame(step)
		return () => cancelAnimationFrame(raf)
	}, [opened, amount])

	if (amount === null) return null

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
			role="dialog"
			aria-modal="true"
			aria-label="Chào mừng — quà tặng khởi đầu"
		>
			<div className="card p-8 mx-4 w-full max-w-md text-center animate-[popIn_300ms_cubic-bezier(0.34,1.56,0.64,1)]">
				<p className="text-sm font-bold uppercase tracking-wide text-primary-dark">Chào mừng đến VSTEP</p>
				<h2 className="mt-1 text-2xl font-extrabold text-foreground">Quà khởi đầu của bạn</h2>

				<div className="relative mt-6 flex h-40 items-center justify-center">
					{opened && (
						<span
							aria-hidden
							className="absolute h-40 w-40 rounded-full bg-coin/30 blur-2xl animate-[fadeIn_400ms_ease-out]"
						/>
					)}
					<div
						className={`relative transition-transform duration-500 ${opened ? "scale-110 -rotate-6" : "scale-100"}`}
						style={{ animation: opened ? "chestPop 500ms cubic-bezier(0.34,1.56,0.64,1)" : undefined }}
					>
						<StaticIcon
							name={opened ? "chest-open" : "chest"}
							size="xl"
							className="h-32 w-auto drop-shadow-lg"
						/>
					</div>
					{opened && (
						<>
							{[...Array(20)].map((_, i) => (
								<span
									key={`burst-${i}`}
									className="absolute"
									style={{
										left: "50%",
										top: "30%",
										animation: `coinBurst ${900 + (i % 4) * 120}ms ease-out forwards`,
										animationDelay: `${i * 25}ms`,
										// @ts-expect-error -- CSS custom property
										"--angle": `${(i / 20) * 360 + (i % 2) * 9}deg`,
										"--dist": `${70 + (i % 5) * 22}px`,
									}}
								>
									<StaticIcon name="coin-md" size={i % 3 === 0 ? "xs" : "sm"} />
								</span>
							))}
							{[...Array(10)].map((_, i) => (
								<span
									key={`fountain-${i}`}
									className="absolute"
									style={{
										left: `${42 + (i % 5) * 4}%`,
										top: "32%",
										animation: `coinFountain ${1100 + (i % 3) * 200}ms cubic-bezier(0.22,1,0.36,1) forwards`,
										animationDelay: `${100 + i * 60}ms`,
										// @ts-expect-error -- CSS custom property
										"--dx": `${(i % 2 === 0 ? -1 : 1) * (20 + (i % 4) * 14)}px`,
										"--rise": `${90 + (i % 4) * 22}px`,
									}}
								>
									<StaticIcon name="coin-md" size={i % 2 === 0 ? "sm" : "xs"} />
								</span>
							))}
						</>
					)}
				</div>

				<div className="mt-4 flex items-center justify-center gap-2">
					<StaticIcon name="coin-md" size="md" />
					<span className="text-4xl font-extrabold text-foreground tabular-nums">+{displayed}</span>
				</div>
				<p className="mt-2 text-sm text-subtle">
					Dùng xu để mở khóa gợi ý, mua đề thi và các tính năng luyện tập nâng cao.
				</p>

				<button type="button" className="btn btn-primary mt-6 w-full py-3 font-extrabold" onClick={dismiss}>
					Bắt đầu học
				</button>
			</div>
		</div>
	)
}
