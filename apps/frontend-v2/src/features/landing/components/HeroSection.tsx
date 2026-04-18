import { Link } from "@tanstack/react-router"
import { Logo } from "#/components/common/Logo"
import { Button } from "#/shared/ui/button"
import { AnimSection } from "../lib/shared"

const RIPPLES = [
	{ w: 280, h: 100, o: 0.12, d: 0 },
	{ w: 390, h: 150, o: 0.1, d: 80 },
	{ w: 510, h: 205, o: 0.08, d: 160 },
	{ w: 640, h: 265, o: 0.07, d: 240 },
	{ w: 780, h: 330, o: 0.06, d: 320 },
	{ w: 930, h: 400, o: 0.04, d: 400 },
	{ w: 1090, h: 475, o: 0.03, d: 480 },
	{ w: 1260, h: 555, o: 0.025, d: 560 },
	{ w: 1440, h: 640, o: 0.018, d: 640 },
	{ w: 1630, h: 730, o: 0.012, d: 720 },
] as const

export function HeroHeader({ onOpenAuth }: { onOpenAuth: () => void }) {
	return (
		<header className="absolute inset-x-0 top-0 z-50">
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
	)
}

export function HeroSection({ onOpenAuth }: { onOpenAuth: () => void }) {
	return (
		<section className="relative overflow-hidden rounded-b-3xl bg-primary">
			<div className="relative mx-auto flex max-w-4xl flex-col items-center px-5 pb-16 pt-20 text-center sm:px-6 sm:pb-32 sm:pt-28">
				<AnimSection>
					<h1 className="text-4xl font-bold leading-[1.2] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
						Nền tảng Học
						<br />
						và Luyện thi
						<br />
						thông minh
					</h1>
				</AnimSection>

				<AnimSection delay={200}>
					<div className="relative mt-8 flex justify-center sm:mt-12">
						<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
							{RIPPLES.map((r) => (
								<div
									key={r.d}
									className="absolute animate-[ripple_0.8s_ease-out_forwards] rounded-full opacity-0"
									style={{
										width: r.w,
										height: r.h,
										backgroundColor: `rgba(255,255,255,${r.o})`,
										animationDelay: `${r.d}ms`,
									}}
								/>
							))}
						</div>
						<Button
							size="lg"
							className="relative z-10 rounded-full bg-white px-10 py-6 text-base font-bold text-primary shadow-lg shadow-white/20 hover:bg-white/90"
							onClick={onOpenAuth}
						>
							KHÁM PHÁ NGAY
						</Button>
					</div>
				</AnimSection>
			</div>
		</section>
	)
}
