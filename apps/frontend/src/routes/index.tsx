import {
	Book02Icon,
	CheckmarkCircle01Icon,
	Fire02Icon,
	HeadphonesIcon,
	Mic01Icon,
	PencilEdit02Icon,
	Target02Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { Logo } from "@/components/common/Logo"
import { SpiderChart } from "@/components/common/SpiderChart"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { user } from "@/lib/auth"
import { getInitials } from "@/lib/avatar"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/")({
	component: LandingPage,
})

/* ── hooks ── */

function useInView(threshold = 0.15) {
	const ref = useRef<HTMLDivElement>(null)
	const [visible, setVisible] = useState(false)
	useEffect(() => {
		const el = ref.current
		if (!el) return
		const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), {
			threshold,
		})
		obs.observe(el)
		return () => obs.disconnect()
	}, [threshold])
	return { ref, visible }
}

function useTilt(intensity = 8) {
	const ref = useRef<HTMLDivElement>(null)
	useEffect(() => {
		const el = ref.current
		if (!el) return
		const onMove = (e: MouseEvent) => {
			const rect = el.getBoundingClientRect()
			const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
			const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
			el.style.transform = `perspective(600px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale(1.02)`
		}
		const onLeave = () => {
			el.style.transform = ""
		}
		el.addEventListener("mousemove", onMove)
		el.addEventListener("mouseleave", onLeave)
		return () => {
			el.removeEventListener("mousemove", onMove)
			el.removeEventListener("mouseleave", onLeave)
		}
	}, [intensity])
	return ref
}

/* ── data ── */

interface SkillItem {
	key: string
	label: string
	desc: string
	icon: IconSvgElement
	color: string
	chartColor: string
}

const SKILLS: SkillItem[] = [
	{
		key: "listening",
		label: "Listening",
		desc: "Luyện nghe hội thoại và bài giảng thực tế",
		icon: HeadphonesIcon,
		color: "bg-skill-listening/12 text-skill-listening",
		chartColor: "text-skill-listening",
	},
	{
		key: "reading",
		label: "Reading",
		desc: "Phân tích đoạn văn, tìm ý chính",
		icon: Book02Icon,
		color: "bg-skill-reading/12 text-skill-reading",
		chartColor: "text-skill-reading",
	},
	{
		key: "writing",
		label: "Writing",
		desc: "Viết luận và thư với phản hồi từ AI",
		icon: PencilEdit02Icon,
		color: "bg-skill-writing/12 text-skill-writing",
		chartColor: "text-skill-writing",
	},
	{
		key: "speaking",
		label: "Speaking",
		desc: "Luyện nói theo chủ đề, đánh giá phát âm",
		icon: Mic01Icon,
		color: "bg-skill-speaking/12 text-skill-speaking",
		chartColor: "text-skill-speaking",
	},
]

const DEMO_SCORES = [
	{ label: "Listening", value: 7.5, color: "text-skill-listening" },
	{ label: "Reading", value: 8, color: "text-skill-reading" },
	{ label: "Writing", value: 6, color: "text-skill-writing" },
	{ label: "Speaking", value: 6.5, color: "text-skill-speaking" },
]

const STEPS = [
	{
		num: "1",
		title: "Làm bài thi thử",
		desc: "Chọn đề thi VSTEP đầy đủ 4 kỹ năng hoặc luyện riêng từng phần. Bắt đầu chỉ trong 30 giây.",
		icon: CheckmarkCircle01Icon,
		reversed: false,
	},
	{
		num: "2",
		title: "AI chấm điểm tức thì",
		desc: "Hệ thống AI phân tích bài Writing & Speaking theo rubric chuẩn VSTEP, trả kết quả trong vài phút.",
		icon: Target02Icon,
		reversed: true,
	},
	{
		num: "3",
		title: "Xem lộ trình cá nhân",
		desc: "Nhận phân tích điểm mạnh / yếu và bài tập được gợi ý riêng theo trình độ của bạn.",
		icon: Fire02Icon,
		reversed: false,
	},
]

const BANDS = [
	{
		level: "B1",
		label: "Trung cấp",
		desc: "Giao tiếp trong công việc và đời sống hàng ngày. Hiểu được ý chính khi nghe và đọc.",
		skills: ["Nghe hiểu hội thoại", "Viết thư cơ bản", "Đọc hiểu văn bản ngắn"],
	},
	{
		level: "B2",
		label: "Trung cấp cao",
		desc: "Tự tin trong môi trường học thuật và chuyên môn. Tranh luận được quan điểm.",
		skills: ["Nghe bài giảng dài", "Viết luận có cấu trúc", "Nói trôi chảy"],
	},
	{
		level: "C1",
		label: "Nâng cao",
		desc: "Sử dụng tiếng Anh linh hoạt, chính xác trong mọi tình huống phức tạp.",
		skills: ["Nghe mọi ngữ cảnh", "Viết học thuật", "Thuyết trình chuyên sâu"],
	},
]

const TESTIMONIALS = [
	{
		name: "Minh Anh",
		role: "Sinh viên ĐH Bách Khoa",
		quote:
			"Mình từ B1 lên B2 sau 2 tháng luyện tập. AI chấm Writing rất chi tiết, chỉ ra đúng lỗi cần sửa.",
		score: "B1 → B2",
		initials: "MA",
	},
	{
		name: "Thanh Hà",
		role: "Nhân viên văn phòng",
		quote:
			"Giao diện dễ dùng, luyện 15 phút mỗi ngày trên điện thoại. Tiết kiệm thời gian hơn đi học trung tâm.",
		score: "B2 → C1",
		initials: "TH",
	},
	{
		name: "Đức Huy",
		role: "Giảng viên tiếng Anh",
		quote:
			"Đề thi sát chuẩn VSTEP, phù hợp để giới thiệu cho sinh viên luyện tập thêm ngoài giờ học.",
		score: "Đề xuất cho SV",
		initials: "ĐH",
	},
]

/* ── shared ── */

const fadeUp = "translate-y-8 opacity-0"
const fadeIn = "translate-y-0 opacity-100"

function AnimSection({
	children,
	className,
	delay = 0,
}: {
	children: React.ReactNode
	className?: string
	delay?: number
}) {
	const { ref, visible } = useInView()
	return (
		<div
			ref={ref}
			className={cn("transition-all duration-700 ease-out", visible ? fadeIn : fadeUp, className)}
			style={{ transitionDelay: `${delay}ms` }}
		>
			{children}
		</div>
	)
}

function Heading({ title, sub }: { title: string; sub: string }) {
	return (
		<div className="text-center">
			<h2 className="text-2xl font-bold lg:text-3xl">{title}</h2>
			<p className="mx-auto mt-3 max-w-lg text-muted-foreground">{sub}</p>
		</div>
	)
}

/* ── page ── */

function LandingPage() {
	return (
		<div className="min-h-screen text-foreground">
			<Header />
			<Hero />
			<SkillsSection />
			<HowItWorksSection />
			<RoadmapSection />
			<TestimonialsSection />
			<CtaSection />
			<Footer />
		</div>
	)
}

/* ── header ── */

function Header() {
	const currentUser = user()

	return (
		<header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md">
			<div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
				<Link to="/">
					<Logo />
				</Link>
				{currentUser ? (
					<Link
						to={currentUser.role === "admin" ? "/admin" : "/dashboard"}
						className="flex items-center gap-2"
					>
						<span className="text-sm font-medium">{currentUser.fullName ?? currentUser.email}</span>
						<Avatar className="size-8">
							<AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
								{getInitials(currentUser.fullName, currentUser.email)}
							</AvatarFallback>
						</Avatar>
					</Link>
				) : (
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="sm" asChild>
							<Link to="/login">Đăng nhập</Link>
						</Button>
						<Button size="sm" className="rounded-xl" asChild>
							<Link to="/register">Bắt đầu</Link>
						</Button>
					</div>
				)}
			</div>
		</header>
	)
}

/* ── hero ── */

function Hero() {
	const chartRef = useTilt(6)

	return (
		<section className="relative overflow-hidden">
			<div className="mx-auto grid max-w-5xl items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:gap-8">
				<AnimSection>
					<div className="space-y-6">
						<div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-4 py-1.5 text-sm font-medium text-primary">
							Miễn phí · AI chấm điểm tức thì
						</div>
						<h1 className="text-4xl font-bold leading-[1.15] tracking-tight lg:text-5xl">
							Từ 0 đến VSTEP C1
							<br />
							<span className="text-primary">trong 90 ngày</span>
						</h1>
						<p className="max-w-md text-lg leading-relaxed text-muted-foreground">
							Nền tảng luyện thi VSTEP duy nhất với AI chấm Writing &amp; Speaking theo rubric chuẩn
							Bộ GD&amp;ĐT — hoàn toàn miễn phí.
						</p>
						<div className="flex flex-wrap gap-3 pt-2">
							<Button size="lg" className="rounded-xl px-8 text-base" asChild>
								<Link to="/register">Bắt đầu ngay</Link>
							</Button>
							<Button variant="outline" size="lg" className="rounded-xl px-8 text-base" asChild>
								<a href="#how-it-works">Xem cách hoạt động</a>
							</Button>
						</div>
					</div>
				</AnimSection>

				<AnimSection delay={200}>
					<div
						ref={chartRef}
						className="flex items-center justify-center transition-transform duration-200 ease-out"
					>
						<SpiderChart skills={DEMO_SCORES} className="size-72 lg:size-80" />
					</div>
				</AnimSection>
			</div>
		</section>
	)
}

/* ── skills ── */

function SkillsSection() {
	return (
		<section className="bg-muted/20">
			<div className="mx-auto max-w-5xl px-6 py-20">
				<AnimSection>
					<Heading
						title="4 kỹ năng, một nền tảng"
						sub="Luyện tập toàn diện Nghe – Đọc – Viết – Nói"
					/>
				</AnimSection>
				<div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{SKILLS.map((s, i) => (
						<AnimSection key={s.key} delay={i * 100}>
							<TiltCard className="rounded-2xl bg-muted/30 p-6 transition-colors hover:bg-muted/50">
								<div className={cn("mb-4 inline-flex rounded-xl p-3", s.color)}>
									<HugeiconsIcon icon={s.icon} className="size-6" />
								</div>
								<h3 className="font-bold">{s.label}</h3>
								<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
							</TiltCard>
						</AnimSection>
					))}
				</div>
			</div>
		</section>
	)
}

/* ── how it works ── */

function HowItWorksSection() {
	return (
		<section id="how-it-works" className="mx-auto max-w-5xl px-6 py-20">
			<AnimSection>
				<Heading title="Cách hoạt động" sub="3 bước để chinh phục VSTEP" />
			</AnimSection>
			<div className="mt-16 flex flex-col gap-20">
				{STEPS.map((step, i) => (
					<AnimSection key={step.num} delay={i * 150}>
						<div className="grid items-center gap-12 lg:grid-cols-2">
							<div className={cn("space-y-4", step.reversed && "lg:order-last")}>
								<div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
									{step.num}
								</div>
								<h3 className="text-xl font-bold">{step.title}</h3>
								<p className="text-muted-foreground">{step.desc}</p>
							</div>
							<div className="flex aspect-video items-center justify-center rounded-3xl bg-primary/5">
								<HugeiconsIcon icon={step.icon} className="size-16 text-primary/40" />
							</div>
						</div>
					</AnimSection>
				))}
			</div>
		</section>
	)
}

/* ── roadmap ── */

function RoadmapSection() {
	return (
		<section className="bg-muted/20">
			<div className="mx-auto max-w-5xl px-6 py-20">
				<AnimSection>
					<Heading
						title="Lộ trình rõ ràng"
						sub="Từ B1 đến C1 — mỗi cấp độ là một bước tiến cụ thể"
					/>
				</AnimSection>
				<div className="mt-12 grid gap-6 lg:grid-cols-3">
					{BANDS.map((b, i) => (
						<AnimSection key={b.level} delay={i * 150}>
							<div className="relative flex flex-col gap-4 rounded-2xl bg-muted/30 p-6">
								{/* Step indicator */}
								<div className="flex items-center gap-3">
									<div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
										<span className="text-lg font-bold text-primary">{b.level}</span>
									</div>
									<div>
										<p className="font-bold">{b.label}</p>
										<p className="text-xs text-muted-foreground">Cấp độ {i + 1}/3</p>
									</div>
									{i < BANDS.length - 1 && (
										<span className="ml-auto hidden text-xl text-muted-foreground/50 lg:block">
											→
										</span>
									)}
								</div>
								{/* Description */}
								<p className="text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
								{/* Skills */}
								<div className="flex flex-wrap gap-2">
									{b.skills.map((s) => (
										<span
											key={s}
											className="rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary"
										>
											{s}
										</span>
									))}
								</div>
							</div>
						</AnimSection>
					))}
				</div>
			</div>
		</section>
	)
}

/* ── testimonials ── */

function TestimonialsSection() {
	return (
		<section className="mx-auto max-w-5xl px-6 py-20">
			<AnimSection>
				<Heading title="Học viên nói gì?" sub="Hàng nghìn người đã cải thiện điểm VSTEP" />
			</AnimSection>
			<div className="mt-12 grid gap-4 sm:grid-cols-3">
				{TESTIMONIALS.map((t, i) => (
					<AnimSection key={t.name} delay={i * 120}>
						<div className="rounded-2xl bg-muted/30 p-6">
							<div className="flex items-center gap-3">
								<Avatar>
									<AvatarFallback className="bg-primary/10 text-primary">
										{t.initials}
									</AvatarFallback>
								</Avatar>
								<div>
									<p className="text-sm font-bold">{t.name}</p>
									<p className="text-xs text-muted-foreground">{t.role}</p>
								</div>
							</div>
							<p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t.quote}</p>
							<div className="mt-4">
								<span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
									{t.score}
								</span>
							</div>
						</div>
					</AnimSection>
				))}
			</div>
		</section>
	)
}

/* ── cta ── */

function CtaSection() {
	return (
		<section className="mx-auto max-w-5xl px-6 py-20">
			<AnimSection>
				<div className="rounded-3xl bg-primary/5 px-6 py-16 text-center">
					<h2 className="text-2xl font-bold lg:text-3xl">
						Bắt đầu luyện thi ngay hôm nay — hoàn toàn miễn phí
					</h2>
					<p className="mx-auto mt-3 max-w-md text-muted-foreground">
						Không cần thẻ tín dụng. Tạo tài khoản trong 30 giây và làm bài thi thử đầu tiên.
					</p>
					<Button size="lg" className="mt-8 rounded-xl px-10 text-base" asChild>
						<Link to="/register">Tạo tài khoản miễn phí</Link>
					</Button>
					<p className="mt-4 text-sm text-muted-foreground">10,000+ học viên đã tham gia</p>
				</div>
			</AnimSection>
		</section>
	)
}

/* ── footer ── */

function Footer() {
	return (
		<footer className="mt-8">
			<div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-8 sm:flex-row sm:justify-between">
				<p className="text-sm text-muted-foreground">© 2026 VSTEP Practice</p>
				<nav className="flex gap-6 text-sm text-muted-foreground">
					<Link to="/" className="transition-colors hover:text-foreground">
						Về chúng tôi
					</Link>
					<Link to="/" className="transition-colors hover:text-foreground">
						Điều khoản
					</Link>
				</nav>
			</div>
		</footer>
	)
}

/* ── tilt card ── */

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
	const ref = useTilt(5)
	return (
		<div ref={ref} className={cn("transition-transform duration-200 ease-out", className)}>
			{children}
		</div>
	)
}
