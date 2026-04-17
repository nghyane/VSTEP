import { Link } from "@tanstack/react-router"
import {
	BookOpenText,
	CheckCircle2,
	Flame,
	Headphones,
	Mic,
	PencilLine,
	Target,
} from "lucide-react"
import { type MotionValue, motion, useScroll, useSpring, useTransform } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { AuthDialog } from "#/components/auth/AuthDialog"
import { Logo } from "#/components/common/Logo"
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar"
import { Button } from "#/components/ui/button"
import { cn } from "#/lib/utils"

/* ── hooks ── */

function useInView(threshold = 0.15) {
	const ref = useRef<HTMLDivElement>(null)
	const [visible, setVisible] = useState(false)
	useEffect(() => {
		const el = ref.current
		if (!el) return
		const obs = new IntersectionObserver(([e]) => e?.isIntersecting && setVisible(true), {
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

/* ── shared ── */

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
			className={cn(
				"transition-all duration-700 ease-out",
				visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
				className,
			)}
			style={{ transitionDelay: `${delay}ms` }}
		>
			{children}
		</div>
	)
}

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
	const ref = useTilt(5)
	return (
		<div ref={ref} className={cn("transition-transform duration-200 ease-out", className)}>
			{children}
		</div>
	)
}

/* ── data ── */

const SKILLS = [
	{
		label: "Listening",
		desc: "Luyện nghe hội thoại và bài giảng thực tế",
		icon: Headphones,
		color: "bg-skill-listening/12 text-skill-listening",
	},
	{
		label: "Reading",
		desc: "Phân tích đoạn văn và trả lời câu hỏi trọng tâm",
		icon: BookOpenText,
		color: "bg-skill-reading/12 text-skill-reading",
	},
	{
		label: "Writing",
		desc: "Viết thư, luận và nhận phản hồi từ AI",
		icon: PencilLine,
		color: "bg-skill-writing/12 text-skill-writing",
	},
	{
		label: "Speaking",
		desc: "Luyện nói theo chủ đề và nghe bài mẫu tham khảo",
		icon: Mic,
		color: "bg-skill-speaking/12 text-skill-speaking",
	},
] as const

const STEPS = [
	{
		title: "Làm bài thi thử",
		desc: "Chọn đề thi VSTEP đầy đủ 4 kỹ năng hoặc luyện riêng từng phần. Bắt đầu chỉ trong 30 giây.",
		icon: CheckCircle2,
		image: "/images/buoc1.jpg",
	},
	{
		title: "AI chấm điểm tức thì",
		desc: "Hệ thống AI phân tích bài Writing và Speaking theo rubric chuẩn, trả kết quả trong vài phút.",
		icon: Target,
		image: "/images/buoc2.jpg",
	},
	{
		title: "Xem lộ trình cá nhân",
		desc: "Nhận phân tích điểm mạnh - yếu và bài tập được gợi ý riêng theo trình độ của bạn.",
		icon: Flame,
		image: "/images/buoc3.jpg",
	},
] as const

const TESTIMONIALS = [
	{
		name: "Minh Anh",
		role: "Sinh viên ĐH Bách Khoa",
		quote:
			"Mình từ B1 lên B2 sau 2 tháng luyện tập. AI chấm Writing rất chi tiết, chỉ ra đúng lỗi cần sửa.",
		badge: "B1 → B2",
		avatar: "https://i.pravatar.cc/150?img=32",
		initials: "MA",
		stars: 5,
	},
	{
		name: "Thanh Hà",
		role: "Nhân viên văn phòng",
		quote:
			"Giao diện dễ dùng, luyện 15 phút mỗi ngày trên điện thoại. Tiết kiệm thời gian hơn đi học trung tâm.",
		badge: "B2 → C1",
		avatar: "https://i.pravatar.cc/150?img=47",
		initials: "TH",
		stars: 5,
	},
	{
		name: "Đức Huy",
		role: "Giảng viên tiếng Anh",
		quote:
			"Đề thi sát chuẩn VSTEP, phù hợp để giới thiệu cho sinh viên luyện tập thêm ngoài giờ học.",
		badge: "Đề xuất cho SV",
		avatar: "https://i.pravatar.cc/150?img=11",
		initials: "ĐH",
		stars: 4,
	},
] as const

/* ── page ── */

export function LandingPage() {
	const [isAuthOpen, setIsAuthOpen] = useState(false)

	return (
		<div className="min-h-screen bg-background text-foreground">
			<LandingHeader onOpenAuth={() => setIsAuthOpen(true)} />
			<HeroSection onOpenAuth={() => setIsAuthOpen(true)} />
			<SkillsSection />
			<HowItWorksSection />
			<RoadmapSection />
			<TestimonialsSection />
			<MascotSection onOpenAuth={() => setIsAuthOpen(true)} />
			<LandingFooter />
			<AuthDialog open={isAuthOpen} onOpenChange={setIsAuthOpen} />
		</div>
	)
}

function LandingHeader({ onOpenAuth }: { onOpenAuth: () => void }) {
	return (
		<header className="absolute inset-x-0 top-0 z-50">
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
				<Link to="/" className="text-white">
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

function HeroSection({ onOpenAuth }: { onOpenAuth: () => void }) {
	return (
		<section className="relative overflow-hidden rounded-b-3xl bg-[#0047B3]">
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
						{/* Ripple effects behind button */}
						<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
							<div
								className="absolute h-[100px] w-[280px] animate-[ripple_0.8s_ease-out_forwards] rounded-full bg-white/[0.12] opacity-0"
								style={{ animationDelay: "0ms" }}
							/>
							<div
								className="absolute h-[150px] w-[390px] animate-[ripple_0.8s_ease-out_forwards] rounded-full bg-white/[0.10] opacity-0"
								style={{ animationDelay: "80ms" }}
							/>
							<div
								className="absolute h-[205px] w-[510px] animate-[ripple_0.8s_ease-out_forwards] rounded-full bg-white/[0.08] opacity-0"
								style={{ animationDelay: "160ms" }}
							/>
							<div
								className="absolute h-[265px] w-[640px] animate-[ripple_0.8s_ease-out_forwards] rounded-full bg-white/[0.07] opacity-0"
								style={{ animationDelay: "240ms" }}
							/>
							<div
								className="absolute h-[330px] w-[780px] animate-[ripple_0.8s_ease-out_forwards] rounded-full bg-white/[0.06] opacity-0"
								style={{ animationDelay: "320ms" }}
							/>
							<div
								className="absolute h-[400px] w-[930px] animate-[ripple_0.8s_ease-out_forwards] rounded-full bg-white/[0.04] opacity-0"
								style={{ animationDelay: "400ms" }}
							/>
							<div
								className="absolute h-[475px] w-[1090px] animate-[ripple_0.8s_ease-out_forwards] rounded-full bg-white/[0.03] opacity-0"
								style={{ animationDelay: "480ms" }}
							/>
							<div
								className="absolute h-[555px] w-[1260px] animate-[ripple_0.8s_ease-out_forwards] rounded-full bg-white/[0.025] opacity-0"
								style={{ animationDelay: "560ms" }}
							/>
							<div
								className="absolute h-[640px] w-[1440px] animate-[ripple_0.8s_ease-out_forwards] rounded-full bg-white/[0.018] opacity-0"
								style={{ animationDelay: "640ms" }}
							/>
							<div
								className="absolute h-[730px] w-[1630px] animate-[ripple_0.8s_ease-out_forwards] rounded-full bg-white/[0.012] opacity-0"
								style={{ animationDelay: "720ms" }}
							/>
						</div>

						<Button
							size="lg"
							className="relative z-10 rounded-full bg-white px-10 py-6 text-base font-bold text-[#0052CC] shadow-lg shadow-white/20 hover:bg-white/90"
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

function SkillsSection() {
	return (
		<section className="bg-muted/20">
			<div className="mx-auto w-full max-w-5xl px-6 py-20">
				<AnimSection>
					<SectionHeading
						title="4 kỹ năng, một nền tảng"
						subtitle="Luyện tập toàn diện Nghe – Đọc – Viết – Nói"
					/>
				</AnimSection>
				<div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{SKILLS.map((skill, i) => {
						const Icon = skill.icon
						return (
							<AnimSection key={skill.label} delay={i * 100}>
								<TiltCard className="rounded-2xl bg-muted/30 p-6 transition-colors hover:bg-muted/50">
									<Icon className={cn("mb-4 size-6", skill.color.split(" ")[1])} />
									<h3 className="font-bold">{skill.label}</h3>
									<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{skill.desc}</p>
								</TiltCard>
							</AnimSection>
						)
					})}
				</div>
			</div>
		</section>
	)
}

function HowItWorksSection() {
	const containerRef = useRef<HTMLDivElement>(null)
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start start", "end end"],
	})

	return (
		<section id="how-it-works" className="py-12 sm:py-20">
			<div className="mx-auto w-full max-w-5xl px-6">
				<AnimSection>
					<SectionHeading
						title="Tối ưu hành trình luyện thi VSTEP"
						subtitle="3 bước đơn giản để chinh phục VSTEP cùng AI"
					/>
				</AnimSection>
			</div>

			<div
				ref={containerRef}
				className="mx-auto mt-8 h-[185vh] w-full max-w-6xl px-4 sm:mt-12 sm:h-[230vh] sm:px-6 lg:px-10"
			>
				<div className="sticky top-14 sm:top-16">
					<div className="relative">
						{STEPS.map((step, index) => (
							<StepCard
								key={step.title}
								step={step}
								index={index}
								total={STEPS.length}
								scrollProgress={scrollYProgress}
							/>
						))}
					</div>
				</div>
			</div>
		</section>
	)
}

function StepCard({
	step,
	index,
	total,
	scrollProgress,
}: {
	step: (typeof STEPS)[number]
	index: number
	total: number
	scrollProgress: MotionValue<number>
}) {
	const isLast = index === total - 1
	const animated = total - 1
	const segStart = animated > 0 ? index / animated : 0
	const segEnd = animated > 0 ? (index + 1) / animated : 1
	const rawY = useTransform(scrollProgress, [segStart, segEnd], [0, -120])
	const springY = useSpring(rawY, { stiffness: 300, damping: 40, mass: 0.5 })
	const y = useTransform(springY, (v) => `${v}%`)
	const Icon = step.icon

	return (
		<motion.div
			className={cn(
				index === 0 ? "relative" : "absolute inset-0",
				"flex min-h-[calc(100vh-180px)] flex-col overflow-hidden rounded-3xl bg-gradient-to-b from-[#001656] from-[7%] to-[#0172FA] p-4 sm:p-6 lg:p-8",
			)}
			style={{ y: isLast ? undefined : y, zIndex: total - index }}
		>
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-400/20 to-sky-400/5 opacity-60" />
			<p className="relative text-3xl font-bold text-sky-400/25 sm:text-5xl lg:text-7xl">
				Bước {index + 1}
			</p>
			<div className="relative mt-3 grid flex-1 gap-4 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-6">
				<div className="space-y-3">
					<div className="inline-flex items-center gap-2 text-white/85">
						<Icon className="size-5" />
						<span className="text-sm font-medium">Bước {index + 1}</span>
					</div>
					<h3 className="text-lg font-bold text-white lg:text-xl">{step.title}</h3>
					<p className="text-sm leading-relaxed text-white/70">{step.desc}</p>
				</div>
				<div className="overflow-hidden rounded-2xl bg-white/8">
					<img
						src={step.image}
						alt={step.title}
						className="aspect-video w-full rounded-2xl object-cover"
					/>
				</div>
			</div>
		</motion.div>
	)
}

function RoadmapSection() {
	const { ref, visible } = useInView()
	const levels = [
		{
			level: "B1",
			label: "Trung cấp",
			desc: "Giao tiếp trong công việc và đời sống hàng ngày",
			items: ["Nghe hiểu hội thoại", "Viết thư cơ bản", "Đọc hiểu văn bản ngắn"],
		},
		{
			level: "B2",
			label: "Trung cấp cao",
			desc: "Tự tin trong môi trường học thuật và chuyên môn",
			items: ["Nghe bài giảng dài", "Viết luận có cấu trúc", "Nói trôi chảy"],
		},
		{
			level: "C1",
			label: "Nâng cao",
			desc: "Sử dụng tiếng Anh linh hoạt trong mọi tình huống phức tạp",
			items: ["Nghe mọi ngữ cảnh", "Viết học thuật", "Thuyết trình chuyên sâu"],
		},
	]

	return (
		<section ref={ref} className="py-20">
			<div className="mx-auto w-full max-w-5xl px-6">
				<AnimSection>
					<SectionHeading
						title="Lộ trình rõ ràng"
						subtitle="Từ B1 đến C1 — mỗi cấp độ là một bước tiến cụ thể"
					/>
				</AnimSection>

				<AnimSection>
					<div className="relative mt-16">
						{/* Vertical trunk with animation */}
						<div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 overflow-hidden bg-border/30">
							{visible && (
								<div
									className="h-full w-full animate-[grow-line_1.2s_ease-out_forwards] bg-border"
									style={{ transformOrigin: "top" }}
								/>
							)}
						</div>

						<div className="space-y-12">
							{levels.map((band, i) => {
								const isLeft = i % 2 === 0
								return (
									<div
										key={band.level}
										className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr]"
									>
										{/* Left side */}
										{isLeft ? (
											<div className="md:pr-8 md:text-right">
												{visible && (
													<div
														className="animate-[fade-slide_0.6s_ease-out_forwards] opacity-0"
														style={{ animationDelay: `${i * 400 + 200}ms` }}
													>
														<LevelCard band={band} align="right" />
													</div>
												)}
											</div>
										) : (
											<div />
										)}

										{/* Center - branch line only */}
										<div className="absolute left-1/2 top-6 -translate-x-1/2 md:relative md:left-0 md:top-0 md:translate-x-0">
											{visible && (
												<div
													className={`absolute top-1/2 hidden h-px w-8 -translate-y-1/2 animate-[grow-branch_0.3s_ease-out_forwards] bg-border opacity-0 md:block ${isLeft ? "right-full origin-right" : "left-full origin-left"}`}
													style={{ animationDelay: `${i * 400 + 100}ms` }}
												/>
											)}
										</div>

										{/* Right side */}
										{!isLeft ? (
											<div className="md:pl-8">
												{visible && (
													<div
														className="animate-[fade-slide_0.6s_ease-out_forwards] opacity-0"
														style={{ animationDelay: `${i * 400 + 200}ms` }}
													>
														<LevelCard band={band} align="left" />
													</div>
												)}
											</div>
										) : (
											<div />
										)}
									</div>
								)
							})}
						</div>
					</div>
				</AnimSection>
			</div>
		</section>
	)
}

function LevelCard({
	band,
	align,
}: {
	band: { level: string; label: string; desc: string; items: string[] }
	align: "left" | "right"
}) {
	return (
		<div className="inline-block rounded-2xl bg-muted/50 p-5 text-left shadow-sm md:max-w-sm">
			<div className={`flex items-center gap-2 ${align === "right" ? "md:justify-end" : ""}`}>
				<span className="rounded-lg bg-primary px-2.5 py-1 text-sm font-bold text-primary-foreground">
					{band.level}
				</span>
			</div>
			<h3 className="mt-2 text-lg font-semibold">{band.label}</h3>
			<p className="mt-1 text-sm text-muted-foreground">{band.desc}</p>
			<div className="mt-3 flex flex-wrap gap-1.5">
				{band.items.map((item) => (
					<span key={item} className="rounded-md border bg-background px-2.5 py-1 text-xs">
						{item}
					</span>
				))}
			</div>
		</div>
	)
}

function TestimonialsSection() {
	return (
		<section className="py-20">
			<div className="mx-auto w-full max-w-6xl px-6">
				<AnimSection>
					<SectionHeading
						title="Học viên nói gì?"
						subtitle="Hàng nghìn người đã cải thiện điểm VSTEP"
					/>
				</AnimSection>
				<div className="mt-12 grid gap-6 md:grid-cols-3">
					{TESTIMONIALS.map((item, i) => (
						<AnimSection key={item.name} delay={i * 120}>
							<div className="rounded-2xl bg-card p-6 shadow-sm">
								{/* Quote icon */}
								<div className="mb-4 text-primary/20">
									<svg className="size-8" fill="currentColor" viewBox="0 0 24 24">
										<path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
									</svg>
								</div>

								{/* Quote text */}
								<p className="text-sm leading-relaxed text-foreground">{item.quote}</p>

								{/* Divider */}
								<div className="my-4 h-px bg-border" />

								{/* Author info */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Avatar>
											<AvatarImage src={item.avatar} alt={item.name} />
											<AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
												{item.initials}
											</AvatarFallback>
										</Avatar>
										<div>
											<p className="text-sm font-semibold">{item.name}</p>
											<p className="text-xs text-muted-foreground">{item.role}</p>
										</div>
									</div>
									<span className="rounded-lg bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
										{item.badge}
									</span>
								</div>

								{/* Stars */}
								<div className="mt-3 flex gap-0.5">
									{Array.from({ length: 5 }).map((_, si) => (
										<svg
											key={si}
											className={cn(
												"size-4",
												si < item.stars ? "text-amber-400" : "text-muted-foreground/25",
											)}
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
										</svg>
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

function MascotSection({ onOpenAuth }: { onOpenAuth: () => void }) {
	return (
		<section className="relative overflow-hidden py-20">
			{/* Background decorations */}
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />

			<div className="relative mx-auto w-full max-w-4xl px-6">
				<AnimSection>
					<div className="relative overflow-hidden rounded-3xl border bg-card shadow-lg">
						{/* Mascot background */}
						<div className="relative min-h-[200px] pt-3">
							<img
								src="/images/home-mascot.png"
								alt=""
								className="h-full w-full object-contain object-bottom [filter:drop-shadow(2px_0_0_#000)_drop-shadow(-2px_0_0_#000)_drop-shadow(0_2px_0_#000)_drop-shadow(0_-2px_0_#000)]"
							/>

							{/* Content overlay */}
							<div className="absolute inset-0 flex flex-col justify-between p-0">
								{/* Top text */}
								<div className="pt-3 text-center">
									<h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
										Bắt đầu luyện ngay hôm nay
									</h2>
									<p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
										Không cần thẻ tín dụng. Tạo tài khoản trong 30 giây và làm bài thi thử đầu tiên
										với lộ trình rõ ràng, phản hồi AI chi tiết.
									</p>
								</div>

								{/* Bottom CTA */}
								<div className="flex flex-col items-center pb-3 text-center">
									<Button
										size="lg"
										className="rounded-full bg-white px-8 text-base text-foreground shadow-lg hover:bg-white/90"
										onClick={onOpenAuth}
									>
										Bắt đầu miễn phí
									</Button>

									<div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:gap-4">
										<div className="flex items-center gap-2">
											<CheckCircle2 className="size-4 text-success" />
											<span className="font-semibold">Hoàn toàn miễn phí</span>
										</div>
										<div className="flex items-center gap-2">
											<CheckCircle2 className="size-4 text-success" />
											<span className="font-semibold">10,000+ học viên</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</AnimSection>
			</div>
		</section>
	)
}

function LandingFooter() {
	return (
		<footer className="border-t bg-background">
			<div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
				<p>© 2026 VSTEP Practice</p>
				<nav className="flex gap-6">
					<Link to="/" className="transition-colors hover:text-foreground">
						Về chúng tôi
					</Link>
					<Link to="/luyen-tap" className="transition-colors hover:text-foreground">
						Luyện tập
					</Link>
				</nav>
			</div>
		</footer>
	)
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
	return (
		<div className="text-center">
			<h2 className="text-2xl font-bold lg:text-3xl">{title}</h2>
			<p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{subtitle}</p>
		</div>
	)
}
