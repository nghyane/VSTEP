import { Link } from "@tanstack/react-router"
import type { Ref } from "react"
import { Icon, StaticIcon, type StaticIconName } from "#/components/Icon"

interface LandingHeroProps {
	ctaRef?: Ref<HTMLDivElement>
}

interface HeroBadgeData {
	pos: string
	delay: string
	icon: StaticIconName | "check"
	label: string
}

const HERO_BADGES: HeroBadgeData[] = [
	{ pos: "-top-2 -right-2", delay: "0s", icon: "streak-sm", label: "7 ngày" },
	{ pos: "-bottom-2 -left-4", delay: "0.6s", icon: "trophy", label: "B2!" },
	{ pos: "top-1/3 -left-8", delay: "1.2s", icon: "coin", label: "+100" },
	{ pos: "-bottom-5 right-4", delay: "1.8s", icon: "check", label: "4 skills" },
]

export function LandingHero({ ctaRef }: LandingHeroProps) {
	return (
		<section className="max-w-[1140px] mx-auto px-8 pt-16 pb-20">
			<div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-16">
				<HeroIllustration />

				<div className="flex-1 text-center lg:text-left">
					<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-tint text-primary-dark text-xs font-extrabold uppercase tracking-wider mb-6">
						<Icon name="lightning" size="xs" />
						Miễn phí 100 xu khi đăng ký
					</div>
					<h1 className="font-sans font-extrabold text-4xl md:text-5xl lg:text-[56px] text-foreground leading-[1.05] tracking-tight">
						Luyện thi VSTEP <span className="text-primary">đơn giản</span>,
						<br />
						hiệu quả mỗi ngày.
					</h1>
					<p className="text-base md:text-lg text-muted mt-5 max-w-xl mx-auto lg:mx-0 leading-relaxed">
						Đề thi chuẩn format Bộ Giáo dục, AI chấm bài chi tiết theo rubric, tiến độ rõ ràng từng kỹ năng.
					</p>
					<div ref={ctaRef} className="flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start">
						<Link to="/" search={{ auth: "register" }} className="btn btn-primary text-base px-8 py-3.5">
							Bắt đầu miễn phí
						</Link>
						<Link
							to="/"
							search={{ auth: "login" }}
							className="btn btn-secondary text-info text-base px-8 py-3.5"
						>
							Đã có tài khoản
						</Link>
					</div>
				</div>
			</div>
		</section>
	)
}

function HeroIllustration() {
	return (
		<div className="relative shrink-0 w-72 h-72 md:w-80 md:h-80 lg:w-[420px] lg:h-[420px] flex items-center justify-center">
			<img src="/mascot/lac-hero.png" alt="Lạc - Mascot VSTEP" className="w-full h-full object-contain" />
			{HERO_BADGES.map((b) => (
				<HeroBadge key={b.label} data={b} />
			))}
		</div>
	)
}

function HeroBadge({ data }: { data: HeroBadgeData }) {
	return (
		<div
			className={`absolute ${data.pos} card px-3 py-2 flex items-center gap-1.5 z-20 bg-surface`}
			style={{ animation: `landingFloat 3s ease-in-out ${data.delay} infinite` }}
		>
			{data.icon === "check" ? (
				<Icon name="check" size="xs" className="text-primary" />
			) : (
				<StaticIcon name={data.icon} size="sm" />
			)}
			<span className="text-xs font-extrabold text-foreground">{data.label}</span>
		</div>
	)
}
