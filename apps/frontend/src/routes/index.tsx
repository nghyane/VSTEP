import {
	AnalyticsUpIcon,
	Book02Icon,
	CheckmarkCircle01Icon,
	DocumentValidationIcon,
	Fire02Icon,
	HeadphonesIcon,
	Logout01Icon,
	Mic01Icon,
	PencilEdit02Icon,
	Target02Icon,
	UserCircleIcon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { type MotionValue, motion, useScroll, useTransform } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { Logo } from "@/components/common/Logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useActivity } from "@/hooks/use-progress"
import { useUser } from "@/hooks/use-user"
import { logout } from "@/lib/api"
import { clear, refreshToken, token, user } from "@/lib/auth"
import { avatarUrl, getInitials } from "@/lib/avatar"
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

const STEPS = [
	{
		num: "1",
		title: "Làm bài thi thử",
		desc: "Chọn đề thi VSTEP đầy đủ 4 kỹ năng hoặc luyện riêng từng phần. Bắt đầu chỉ trong 30 giây.",
		icon: CheckmarkCircle01Icon,
		accent: "from-sky-400/30 to-sky-400/10",
	},
	{
		num: "2",
		title: "AI chấm điểm tức thì",
		desc: "Hệ thống AI phân tích bài Writing & Speaking theo rubric chuẩn VSTEP, trả kết quả trong vài phút.",
		icon: Target02Icon,
		accent: "from-sky-400/30 to-sky-400/10",
	},
	{
		num: "3",
		title: "Xem lộ trình cá nhân",
		desc: "Nhận phân tích điểm mạnh / yếu và bài tập được gợi ý riêng theo trình độ của bạn.",
		icon: Fire02Icon,
		accent: "from-sky-400/30 to-sky-400/10",
	},
]

const BANDS = [
	{
		level: "B1",
		label: "Trung cấp",
		desc: "Giao tiếp trong công việc và đời sống hàng ngày. Hiểu được ý chính khi nghe và đọc.",
		skills: ["Nghe hiểu hội thoại", "Viết thư cơ bản", "Đọc hiểu văn bản ngắn"],
		gradient: "from-sky-400 to-blue-500",
		border: "border-l-sky-400",
		tag: "bg-sky-500/10 text-sky-600",
	},
	{
		level: "B2",
		label: "Trung cấp cao",
		desc: "Tự tin trong môi trường học thuật và chuyên môn. Tranh luận được quan điểm.",
		skills: ["Nghe bài giảng dài", "Viết luận có cấu trúc", "Nói trôi chảy"],
		gradient: "from-blue-500 to-indigo-500",
		border: "border-l-blue-500",
		tag: "bg-blue-500/10 text-blue-600",
	},
	{
		level: "C1",
		label: "Nâng cao",
		desc: "Sử dụng tiếng Anh linh hoạt, chính xác trong mọi tình huống phức tạp.",
		skills: ["Nghe mọi ngữ cảnh", "Viết học thuật", "Thuyết trình chuyên sâu"],
		gradient: "from-indigo-500 to-violet-600",
		border: "border-l-indigo-500",
		tag: "bg-indigo-500/10 text-indigo-600",
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

	if (currentUser) {
		return <AuthenticatedHeader />
	}

	return (
		<header className="absolute top-0 right-0 left-0 z-50">
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
						<Link to="/login">Đăng nhập</Link>
					</Button>
					<Button
						size="sm"
						className="rounded-full bg-white px-6 font-bold text-[oklch(0.35_0.18_258)] hover:bg-white/90"
						asChild
					>
						<Link to="/register">Bắt đầu</Link>
					</Button>
				</div>
			</div>
		</header>
	)
}

const DAYS_OF_WEEK = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

const NAV_ITEMS = [
	{ label: "Luyện tập", icon: Book02Icon, href: "/practice" as const },
	{ label: "Thi thử", icon: DocumentValidationIcon, href: "/exams" as const },
	{ label: "Tiến độ", icon: AnalyticsUpIcon, href: "/progress" as const },
]

function AuthenticatedHeader() {
	const { data: activity } = useActivity(7)
	const streakCount = activity?.streak ?? 0
	const activeDatesSet = new Set(activity?.activeDays ?? [])

	function isActiveDay(dayIndex: number): boolean {
		const today = new Date()
		const todayDow = (today.getDay() + 6) % 7
		const diff = dayIndex - todayDow
		const date = new Date(today)
		date.setDate(today.getDate() + diff)
		const yyyy = date.getFullYear()
		const mm = String(date.getMonth() + 1).padStart(2, "0")
		const dd = String(date.getDate()).padStart(2, "0")
		return activeDatesSet.has(`${yyyy}-${mm}-${dd}`)
	}

	const activeDays = DAYS_OF_WEEK.map((_, i) => isActiveDay(i))
	const currentUser = user()
	const { data: userData } = useUser(currentUser?.id ?? "")
	const initials = getInitials(currentUser?.fullName, currentUser?.email)
	const avatarSrc = avatarUrl(userData?.avatarKey, currentUser?.fullName)

	async function handleLogout() {
		try {
			const t = token()
			const r = refreshToken()
			if (t && r) await logout(r, t)
		} finally {
			clear()
			window.location.href = "/login"
		}
	}

	return (
		<header className="sticky top-0 z-50 border-b bg-background">
			<div className="mx-auto flex h-14 max-w-6xl items-center px-6">
				<Link to="/" className="mr-8">
					<Logo />
				</Link>
				<nav className="hidden items-center gap-1 md:flex">
					{NAV_ITEMS.map((item) => (
						<Link
							key={item.label}
							to={item.href}
							className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
							activeProps={{
								className:
									"flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors",
							}}
						>
							<HugeiconsIcon icon={item.icon} className="size-[18px]" strokeWidth={1.75} />
							{item.label}
						</Link>
					))}
				</nav>
				<div className="ml-auto flex items-center gap-2">
					<Popover>
						<PopoverTrigger asChild>
							<button
								type="button"
								className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold tabular-nums text-warning transition-colors hover:bg-warning/10"
							>
								<HugeiconsIcon icon={Fire02Icon} className="size-5" />
								{streakCount}
							</button>
						</PopoverTrigger>
						<PopoverContent align="end" className="w-80 overflow-hidden rounded-2xl p-0">
							<div className="relative bg-warning/10 px-6 pt-6 pb-5">
								<HugeiconsIcon
									icon={Fire02Icon}
									className="absolute top-3 right-4 size-16 text-warning/15"
								/>
								<p className="text-3xl font-bold text-warning">{streakCount} ngày streak</p>
								<p className="mt-1 text-sm text-muted-foreground">Tiếp tục học mỗi ngày nhé!</p>
							</div>
							<div className="px-6 py-4">
								<div className="flex justify-between">
									{DAYS_OF_WEEK.map((day, i) => (
										<div key={day} className="flex flex-col items-center gap-1.5">
											<span className="text-xs text-muted-foreground">{day}</span>
											<div
												className={cn(
													"flex size-8 items-center justify-center rounded-full",
													activeDays[i] ? "bg-warning/15 text-warning" : "bg-muted",
												)}
											>
												{activeDays[i] ? (
													<HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
												) : null}
											</div>
										</div>
									))}
								</div>
							</div>
						</PopoverContent>
					</Popover>
					<DropdownMenu>
						<DropdownMenuTrigger className="outline-none">
							<Avatar className="size-8 cursor-pointer">
								<AvatarImage src={avatarSrc} alt={currentUser?.fullName ?? "Avatar"} />
								<AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
									{initials}
								</AvatarFallback>
							</Avatar>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuItem asChild>
								<Link to="/profile">
									<HugeiconsIcon icon={UserCircleIcon} className="size-4" strokeWidth={1.75} />
									Hồ sơ
								</Link>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleLogout}>
								<HugeiconsIcon icon={Logout01Icon} className="size-4" strokeWidth={1.75} />
								Đăng xuất
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	)
}

function Hero() {
	return (
		<section className="relative overflow-hidden bg-gradient-to-b from-[oklch(0.35_0.18_258)] via-[oklch(0.45_0.2_258)] to-[oklch(0.50_0.2_258)]">
			{/* Decorative background elements */}
			<div className="pointer-events-none absolute inset-0">
				{/* Large radial glow */}
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[800px] rounded-full bg-white/[0.04]" />
				{/* Concentric circles */}
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full border border-white/[0.06]" />
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[700px] rounded-full border border-white/[0.04]" />
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[900px] rounded-full border border-white/[0.03]" />
				{/* Small floating accent circles */}
				<div className="absolute top-16 right-[20%] size-10 rounded-full bg-amber-400/80 blur-[1px]" />
				<div className="absolute top-12 right-[15%] size-6 rounded-full bg-white/20" />
				<div className="absolute bottom-20 left-[10%] size-4 rounded-full bg-white/15" />
			</div>

			<div className="relative mx-auto flex max-w-4xl flex-col items-center px-5 pt-20 pb-16 text-center sm:px-6 sm:pt-28 sm:pb-32">
				<AnimSection>
					<h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
						Nền tảng Luyện thi
						<br />
						<span className="text-amber-300">VSTEP</span> thông minh
					</h1>
				</AnimSection>

				<AnimSection delay={100}>
					<p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:mt-6 sm:text-lg">
						AI chấm Writing &amp; Speaking theo rubric chuẩn Bộ GD&amp;ĐT — lộ trình cá nhân hoá từ
						B1 đến C1, hoàn toàn miễn phí.
					</p>
				</AnimSection>

				<AnimSection delay={200}>
					<div className="mt-6 flex w-full flex-col items-center gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:gap-4">
						<Button
							size="lg"
							className="w-full rounded-full bg-white px-10 text-base font-bold text-[oklch(0.35_0.18_258)] shadow-lg shadow-black/20 hover:bg-white/90 sm:w-auto"
							asChild
						>
							<Link to="/register">BẮT ĐẦU NGAY</Link>
						</Button>
						<Button
							variant="ghost"
							size="lg"
							className="w-full rounded-full border border-white/30 bg-transparent px-10 text-base font-bold text-white hover:bg-white/10 hover:text-white sm:w-auto"
							asChild
						>
							<a href="#how-it-works">XEM CÁCH HOẠT ĐỘNG</a>
						</Button>
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
	const containerRef = useRef<HTMLDivElement>(null)
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start start", "end end"],
	})

	return (
		<section id="how-it-works" className="py-12 sm:py-20">
			<div className="mx-auto max-w-5xl px-6">
				<AnimSection>
					<Heading
						title="Tối ưu hành trình Luyện thi VSTEP"
						sub="3 bước đơn giản để chinh phục VSTEP cùng AI"
					/>
				</AnimSection>
			</div>

			{/* Scroll runway — height drives the album-stack scroll distance */}
			<div
				ref={containerRef}
				className="mx-auto mt-8 max-w-[1800px] px-4 sm:mt-12 sm:px-6 md:px-10 lg:px-16 2xl:px-24 min-[2200px]:max-w-[1400px] h-[200vh] sm:h-[300vh]"
			>
				<div className="sticky top-16 sm:top-20">
					<div className="relative">
						{STEPS.map((step, i) => (
							<StepCard
								key={step.num}
								step={step}
								index={i}
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
	const segStart = index / total
	const segEnd = (index + 0.7) / total
	const y = useTransform(scrollProgress, [segStart, segEnd], ["0%", "-120%"])

	return (
		<motion.div
			className={cn(
				index === 0 ? "relative" : "absolute inset-0",
				"flex flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-[#001656] from-[7%] to-[#0172FA] p-5 sm:min-h-[calc(100vh-120px)] sm:p-8 lg:rounded-3xl lg:p-10 2xl:rounded-[32px] 2xl:p-14",
			)}
			style={{ y: isLast ? undefined : y, zIndex: total - index }}
		>
			{/* Accent gradient overlay */}
			<div
				className={cn(
					"pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60",
					step.accent,
				)}
			/>

			{/* Large watermark step number */}
			<p className="relative text-4xl font-bold text-[#0071F9]/25 sm:text-6xl lg:text-8xl">
				Bước {step.num}
			</p>

			{/* Illustration — absolutely centered on right half */}
			<div className="pointer-events-none absolute inset-y-0 right-8 hidden w-[45%] items-center lg:flex lg:right-10">
				<div className="flex h-[70%] w-full items-center justify-center rounded-2xl bg-white/[0.06] backdrop-blur-sm">
					<HugeiconsIcon icon={step.icon} className="size-16 text-white/25" />
				</div>
			</div>

			{/* Text content — flows naturally on mobile, pinned bottom-left on lg */}
			<div className="relative mt-4 lg:absolute lg:bottom-10 lg:left-10 lg:mt-0 lg:max-w-[45%] 2xl:bottom-14 2xl:left-14">
				<div className="space-y-2 sm:space-y-3">
					<h3 className="text-lg font-bold text-white sm:text-xl lg:text-2xl">{step.title}</h3>
					<p className="text-sm leading-relaxed text-white/65 sm:text-base">{step.desc}</p>
				</div>
			</div>

			{/* Mobile illustration fallback */}
			<div className="mt-4 flex min-h-[160px] items-center justify-center rounded-2xl bg-white/[0.06] backdrop-blur-sm sm:mt-6 sm:min-h-0 sm:flex-1 lg:hidden">
				<HugeiconsIcon icon={step.icon} className="size-16 text-white/25" />
			</div>
		</motion.div>
	)
}

/* ── roadmap ── */

function RoadmapSection() {
	const offsets = ["lg:ml-[10%]", "lg:ml-[24%]", "lg:ml-[38%]"] as const

	return (
		<section className="overflow-hidden bg-muted/20">
			<div className="mx-auto max-w-5xl px-6 py-20">
				<AnimSection>
					<Heading
						title="Lộ trình rõ ràng"
						sub="Từ B1 đến C1 — mỗi cấp độ là một bước tiến cụ thể"
					/>
				</AnimSection>

				<div className="mt-16 flex flex-col gap-6">
					{BANDS.map((b, i) => (
						<AnimSection key={b.level} delay={i * 200}>
							<div className={cn("max-w-lg", offsets[i])}>
								<div className={cn("rounded-2xl border-l-4 bg-card p-6", b.border)}>
									<div className="flex items-start gap-4">
										<div
											className={cn(
												"flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white",
												b.gradient,
											)}
										>
											{b.level}
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-lg font-bold">{b.label}</p>
											<p className="mt-1 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
											<div className="mt-3 flex flex-wrap gap-2">
												{b.skills.map((s) => (
													<span
														key={s}
														className={cn("rounded-full px-3 py-1 text-xs font-medium", b.tag)}
													>
														{s}
													</span>
												))}
											</div>
										</div>
									</div>
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
