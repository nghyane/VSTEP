import { Link } from "@tanstack/react-router"
import { Button } from "#/shared/ui/button"
import { Logo } from "#/shared/ui/Logo"
import { HERO_STATS } from "./constants"

export function HeroSection({ onOpenAuth }: { onOpenAuth: () => void }) {
	return (
		<section aria-label="Hero">
			<div className="relative overflow-hidden bg-gradient-to-b from-primary to-primary/80">
				{/* Decorative */}
				<div className="pointer-events-none absolute inset-0">
					<div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/5" />
					<div className="absolute -bottom-10 -left-10 size-40 rounded-full bg-white/5" />
					<div className="absolute left-1/2 top-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8" />
				</div>

				{/* Nav */}
				<header className="relative z-10">
					<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
						<Link to="/">
							<Logo className="text-white" />
						</Link>
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="sm"
								className="text-white/80 hover:bg-white/10 hover:text-white"
								asChild
							>
								<Link to="/overview" search={{ tab: "overview" }}>
									Vào ứng dụng
								</Link>
							</Button>
							<Button
								size="sm"
								className="rounded-full bg-white px-6 font-bold text-primary hover:bg-white/90"
								onClick={onOpenAuth}
							>
								Bắt đầu
							</Button>
						</div>
					</div>
				</header>

				{/* Content — 2 col on desktop */}
				<div className="relative mx-auto grid max-w-6xl gap-8 px-6 pb-16 pt-8 sm:pb-20 sm:pt-12 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-12 lg:pb-24">
					<div>
						<h1 className="animate-fade-in-up text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
							Nền tảng luyện thi <span className="text-warning">VSTEP</span> thông minh
						</h1>
						<p className="mt-5 max-w-xl animate-fade-in-up text-base leading-relaxed text-white/80 animation-delay-200 sm:text-lg">
							AI chấm Writing và Speaking theo rubric chuẩn — lộ trình cá nhân hóa từ B1 đến C1, học
							theo nhịp độ của bạn.
						</p>
						<div className="mt-8 flex animate-fade-in-up flex-col gap-3 animation-delay-400 sm:flex-row">
							<Button
								size="lg"
								className="rounded-full bg-white px-10 text-base font-bold text-primary hover:bg-white/90"
								onClick={onOpenAuth}
							>
								Bắt đầu ngay — Miễn phí
							</Button>
						</div>

						{/* Trust stats */}
						<div className="mt-8 flex animate-fade-in-up gap-6 animation-delay-400">
							{HERO_STATS.map((s) => {
								const Icon = s.icon
								return (
									<div key={s.label} className="flex items-center gap-2">
										<Icon className="size-4 text-white/50" />
										<div>
											<p className="text-lg font-bold leading-none text-white">{s.value}</p>
											<p className="text-xs text-white/50">{s.label}</p>
										</div>
									</div>
								)
							})}
						</div>
					</div>

					{/* Mascot */}
					<div className="hidden lg:block">
						<img
							src="/images/home-mascot.png"
							alt="Mascot VSTEP"
							className="mx-auto w-full max-w-md object-contain drop-shadow-lg"
						/>
					</div>
				</div>
			</div>
		</section>
	)
}
