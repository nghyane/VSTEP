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
import { useRef } from "react"
import { Logo } from "#/components/common/Logo"
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar"
import { Button } from "#/components/ui/button"
import { cn } from "#/lib/utils"

const SKILLS = [
	{
		label: "Listening",
		desc: "Luyện nghe hội thoại và bài giảng thực tế",
		icon: Headphones,
		color: "text-skill-listening",
	},
	{
		label: "Reading",
		desc: "Phân tích đoạn văn và trả lời câu hỏi trọng tâm",
		icon: BookOpenText,
		color: "text-skill-reading",
	},
	{
		label: "Writing",
		desc: "Viết thư, luận và nhận phản hồi từ AI",
		icon: PencilLine,
		color: "text-skill-writing",
	},
	{
		label: "Speaking",
		desc: "Luyện nói theo chủ đề và nghe bài mẫu tham khảo",
		icon: Mic,
		color: "text-skill-speaking",
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
	},
	{
		name: "Thanh Hà",
		role: "Nhân viên văn phòng",
		quote:
			"Giao diện dễ dùng, luyện 15 phút mỗi ngày trên điện thoại. Tiết kiệm thời gian hơn đi học trung tâm.",
		badge: "B2 → C1",
		avatar: "https://i.pravatar.cc/150?img=47",
		initials: "TH",
	},
	{
		name: "Đức Huy",
		role: "Giảng viên tiếng Anh",
		quote:
			"Đề thi sát chuẩn VSTEP, phù hợp để giới thiệu cho sinh viên luyện tập thêm ngoài giờ học.",
		badge: "Đề xuất cho SV",
		avatar: "https://i.pravatar.cc/150?img=11",
		initials: "ĐH",
	},
] as const

export function LandingPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<LandingHeader />
			<HeroSection />
			<SkillsSection />
			<HowItWorksSection />
			<RoadmapSection />
			<TestimonialsSection />
			<MascotSection />
			<LandingFooter />
		</div>
	)
}

function LandingHeader() {
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
						asChild
					>
						<Link to="/luyen-tap">Bắt đầu</Link>
					</Button>
				</div>
			</div>
		</header>
	)
}

function HeroSection() {
	return (
		<section className="relative overflow-hidden rounded-b-3xl bg-gradient-to-b from-primary to-primary/80">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute left-1/2 top-1/2 size-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5" />
				<div className="absolute left-1/2 top-1/2 size-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
				<div className="absolute bottom-20 left-[10%] size-4 rounded-full bg-white/20" />
				<div className="absolute right-[16%] top-14 size-8 rounded-full bg-warning/80" />
			</div>

			<div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 pb-24 pt-28 text-center">
				<h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
					Nền tảng luyện thi <span className="text-warning">VSTEP</span> thông minh
				</h1>
				<p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
					AI chấm Writing và Speaking theo rubric chuẩn — lộ trình cá nhân hóa từ B1 đến C1, học
					theo nhịp độ của bạn.
				</p>
				<div className="mt-8 flex flex-col gap-3 sm:flex-row">
					<Button
						size="lg"
						className="rounded-full bg-white px-10 text-base font-bold text-primary hover:bg-white/90"
						asChild
					>
						<Link to="/luyen-tap">Bắt đầu ngay</Link>
					</Button>
					<Button
						variant="ghost"
						size="lg"
						className="rounded-full border border-white/30 bg-transparent px-10 text-base font-bold text-white hover:bg-white/10 hover:text-white"
						asChild
					>
						<a href="#how-it-works">Xem cách hoạt động</a>
					</Button>
				</div>
			</div>
		</section>
	)
}

function SkillsSection() {
	return (
		<section className="bg-muted/20">
			<div className="mx-auto w-full max-w-5xl px-6 py-20">
				<SectionHeading
					title="4 kỹ năng, một nền tảng"
					subtitle="Luyện tập toàn diện Nghe – Đọc – Viết – Nói"
				/>
				<div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{SKILLS.map((skill) => {
						const Icon = skill.icon
						return (
							<div key={skill.label} className="rounded-2xl bg-muted/50 p-5 shadow-sm">
								<Icon className={cn("size-6", skill.color)} />
								<h3 className="mt-4 text-lg font-semibold">{skill.label}</h3>
								<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{skill.desc}</p>
							</div>
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
				<SectionHeading
					title="Tối ưu hành trình luyện thi VSTEP"
					subtitle="3 bước đơn giản để chinh phục VSTEP cùng AI"
				/>
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
	return (
		<section className="bg-muted/20">
			<div className="mx-auto w-full max-w-3xl px-6 py-20">
				<SectionHeading
					title="Lộ trình rõ ràng"
					subtitle="Từ B1 đến C1 — mỗi cấp độ là một bước tiến cụ thể"
				/>
				<div className="relative mt-14 pl-10">
					<div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
					{[
						{
							level: "B1",
							label: "Trung cấp",
							desc: "Giao tiếp trong công việc và đời sống hàng ngày.",
							items: ["Nghe hiểu hội thoại", "Viết thư cơ bản", "Đọc hiểu văn bản ngắn"],
						},
						{
							level: "B2",
							label: "Trung cấp cao",
							desc: "Tự tin trong môi trường học thuật và chuyên môn.",
							items: ["Nghe bài giảng dài", "Viết luận có cấu trúc", "Nói trôi chảy"],
						},
						{
							level: "C1",
							label: "Nâng cao",
							desc: "Sử dụng tiếng Anh linh hoạt trong mọi tình huống phức tạp.",
							items: ["Nghe mọi ngữ cảnh", "Viết học thuật", "Thuyết trình chuyên sâu"],
						},
					].map((band) => (
						<div key={band.level} className="relative mb-6">
							<div className="absolute -left-[1.875rem] top-5 size-4 rounded-full bg-background ring-4 ring-background">
								<div className="size-4 rounded-full border border-primary/30 bg-primary/10" />
							</div>
							<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
								<div className="flex items-center gap-3">
									<span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
										{band.level}
									</span>
									<h3 className="text-lg font-semibold">{band.label}</h3>
								</div>
								<p className="mt-2 text-sm text-muted-foreground">{band.desc}</p>
								<div className="mt-3 flex flex-wrap gap-1.5">
									{band.items.map((item) => (
										<span
											key={item}
											className="rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground"
										>
											{item}
										</span>
									))}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}

function TestimonialsSection() {
	return (
		<section className="mx-auto w-full max-w-5xl px-6 py-20">
			<SectionHeading
				title="Học viên nói gì?"
				subtitle="Hàng nghìn người đã cải thiện điểm VSTEP"
			/>
			<div className="mt-12 grid gap-4 sm:grid-cols-3">
				{TESTIMONIALS.map((item) => (
					<div key={item.name} className="rounded-2xl bg-muted/50 p-5 shadow-sm">
						<div className="flex items-center gap-3">
							<Avatar size="lg">
								<AvatarImage src={item.avatar} alt={item.name} />
								<AvatarFallback className="bg-primary/10 text-primary">
									{item.initials}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="text-sm font-bold">{item.name}</p>
								<p className="text-xs text-muted-foreground">{item.role}</p>
							</div>
						</div>
						<p className="mt-4 text-sm leading-relaxed text-muted-foreground italic">
							“{item.quote}”
						</p>
						<span className="mt-4 inline-flex rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
							{item.badge}
						</span>
					</div>
				))}
			</div>
		</section>
	)
}

function MascotSection() {
	return (
		<section className="relative overflow-hidden rounded-t-3xl bg-muted/30 pt-5 pb-1 sm:pt-7 lg:pt-9">
			<div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-px bg-background" />
			<div className="mx-auto w-full max-w-5xl px-6 text-center">
				<div className="relative z-10 mx-auto mt-10 max-w-3xl sm:mt-12 lg:mt-14">
					<h2 className="text-2xl font-bold tracking-tight text-foreground lg:text-4xl">
						Bắt đầu luyện ngay hôm nay — hoàn toàn miễn phí
					</h2>
					<p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-foreground/75 sm:text-base">
						Không cần thẻ tín dụng. Tạo tài khoản trong 30 giây và làm bài thi thử đầu tiên với lộ
						trình rõ ràng, phản hồi AI chi tiết và trải nghiệm học bớt áp lực hơn.
					</p>
					<Button size="lg" className="mt-6 rounded-xl px-8 text-base" asChild>
						<Link to="/luyen-tap">Bắt đầu luyện tập</Link>
					</Button>
					<p className="mt-4 text-sm text-muted-foreground">10,000+ học viên đã tham gia</p>
				</div>

				<div className="relative left-1/2 z-10 -mt-4 w-screen max-w-none -translate-x-1/2 px-0 sm:-mt-6 lg:-mt-8">
					<img
						src="/images/home-mascot.png"
						alt="Mascot VSTEP đang luyện đề cùng sách và máy chấm bài"
						className="mx-auto -mb-2 w-screen max-w-none object-contain sm:-mb-3 lg:-mb-4 [filter:drop-shadow(0_2px_0_#000)_drop-shadow(0_-1px_0_#000)_drop-shadow(1px_0_0_#000)_drop-shadow(-1px_0_0_#000)_drop-shadow(1px_1px_0_#000)_drop-shadow(-1px_-1px_0_#000)_drop-shadow(1px_-1px_0_#000)_drop-shadow(-1px_1px_0_#000)]"
					/>
				</div>
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
